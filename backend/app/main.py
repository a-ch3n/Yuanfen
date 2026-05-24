"""
Yuanfen — SMS-based matchmaking.
FastAPI entrypoint.
"""
import logging
from fastapi import FastAPI, Depends, Form, HTTPException, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from .database import get_db, init_db
from .config import settings
from . import models, schemas
from .onboarding import handle_incoming
from .matching_service import run_matching

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Yuanfen API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()
    logger.info("Yuanfen API ready.")


@app.get("/")
def root():
    return {"name": "Yuanfen", "tagline": "Connection by fate, refined by intention."}


@app.get("/health")
def health():
    return {"ok": True}


# ─────────────────────────────────────────────────────────
# Waitlist
# ─────────────────────────────────────────────────────────

@app.post("/waitlist", response_model=schemas.WaitlistOut)
def join_waitlist(payload: schemas.WaitlistIn, db: Session = Depends(get_db)):
    existing = None
    if payload.email:
        existing = db.query(models.WaitlistEntry).filter(models.WaitlistEntry.email == payload.email).first()
    if not existing and payload.phone:
        existing = db.query(models.WaitlistEntry).filter(models.WaitlistEntry.phone == payload.phone).first()
    if existing:
        return existing
    entry = models.WaitlistEntry(
        email=payload.email,
        phone=payload.phone,
        referral=payload.referral,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    logger.info("New waitlist entry: %s / %s", payload.email, payload.phone)
    return entry


# ─────────────────────────────────────────────────────────
# Twilio SMS webhook (with signature verification)
# ─────────────────────────────────────────────────────────

async def _verify_twilio_signature(request: Request) -> bool:
    """Verify the request actually came from Twilio. Skip in dev mode."""
    if not settings.TWILIO_AUTH_TOKEN:
        # Dev mode — no auth token configured, accept everything
        return True

    try:
        from twilio.request_validator import RequestValidator
    except ImportError:
        logger.warning("twilio package not installed; skipping signature check")
        return True

    signature = request.headers.get("X-Twilio-Signature", "")
    if not signature:
        return False

    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    # Twilio signs the full URL + sorted form params
    url = str(request.url)
    form = await request.form()
    params = {k: v for k, v in form.items()}
    return validator.validate(url, params, signature)


@app.post("/sms")
async def sms_webhook(request: Request, db: Session = Depends(get_db)):
    """Twilio webhook for incoming SMS."""
    if not await _verify_twilio_signature(request):
        logger.warning("Rejected SMS webhook: invalid signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    form = await request.form()
    from_ = form.get("From")
    body = form.get("Body", "")
    if not from_:
        raise HTTPException(status_code=400, detail="Missing From")

    handle_incoming(db, from_, body)
    # We already sent the reply via Twilio API in handle_incoming.
    # Respond with empty TwiML so Twilio doesn't send a default reply.
    twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    return Response(content=twiml, media_type="application/xml")


# ─────────────────────────────────────────────────────────
# Admin (token-protected)
# ─────────────────────────────────────────────────────────

def require_admin(x_admin_token: Optional[str] = Header(default=None)):
    if not settings.ADMIN_TOKEN or x_admin_token != settings.ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/admin/users", response_model=list[schemas.UserOut])
def admin_users(db: Session = Depends(get_db), _: None = Depends(require_admin)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@app.get("/admin/matches", response_model=list[schemas.MatchOut])
def admin_matches(db: Session = Depends(get_db), _: None = Depends(require_admin)):
    return db.query(models.Match).order_by(models.Match.created_at.desc()).all()


@app.get("/admin/waitlist")
def admin_waitlist(db: Session = Depends(get_db), _: None = Depends(require_admin)):
    rows = db.query(models.WaitlistEntry).order_by(models.WaitlistEntry.created_at.desc()).all()
    return [
        {"id": r.id, "email": r.email, "phone": r.phone, "referral": r.referral, "created_at": r.created_at}
        for r in rows
    ]


@app.post("/admin/run-matching")
def admin_run_matching(_: None = Depends(require_admin)):
    n = run_matching()
    return {"created": n}


@app.delete("/admin/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Permanently delete a user and all their data (messages, matches)."""
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    phone = user.phone
    # Matches cascade-delete via FK; messages cascade via relationship.
    db.query(models.Match).filter(
        (models.Match.user_a_id == user_id) | (models.Match.user_b_id == user_id)
    ).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    logger.info("Admin deleted user %s (phone %s)", user_id, phone)
    return {"deleted": True, "user_id": user_id}


@app.delete("/admin/waitlist/{entry_id}")
def admin_delete_waitlist(
    entry_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    entry = db.get(models.WaitlistEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True, "id": entry_id}


# ─────────────────────────────────────────────────────────
# Dev helper
# ─────────────────────────────────────────────────────────

@app.post("/dev/sms")
def dev_sms(
    phone: str = Form(...),
    body: str = Form(""),
    db: Session = Depends(get_db),
):
    """Simulate an inbound SMS for local testing without Twilio."""
    reply = handle_incoming(db, phone, body)
    return {"phone": phone, "received": body, "reply": reply}
