"""
Yuanfen — SMS/iMessage-based matchmaking.
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
from . import loop_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Yuanfen API", version="0.5.0")

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
    logger.info("Yuanfen API ready. Messaging provider: %s", settings.MESSAGING_PROVIDER)


@app.get("/")
def root():
    return {"name": "Yuanfen", "tagline": "Connection by fate, refined by intention."}


@app.get("/health")
def health():
    return {"ok": True, "provider": settings.MESSAGING_PROVIDER}


# ──────────────────────────────────────────────────────────────────────
# Waitlist
# ──────────────────────────────────────────────────────────────────────

@app.post("/waitlist", response_model=schemas.WaitlistOut)
def join_waitlist(payload: schemas.WaitlistIn, db: Session = Depends(get_db)):
    existing = None
    if payload.email:
        existing = db.query(models.WaitlistEntry).filter(
            models.WaitlistEntry.email == payload.email
        ).first()
    if not existing and payload.phone:
        existing = db.query(models.WaitlistEntry).filter(
            models.WaitlistEntry.phone == payload.phone
        ).first()
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


# ──────────────────────────────────────────────────────────────────────
# LoopMessage webhook (iMessage — primary inbound)
# ──────────────────────────────────────────────────────────────────────

@app.post("/loop/webhook")
async def loop_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Inbound iMessage from LoopMessage.

    LoopMessage posts JSON with an `alert_type` discriminator. We only act on
    inbound text messages; delivery receipts and reaction events are ack'd
    and ignored.

    Note: handle_incoming() sends its own reply via sms_service, which routes
    to LoopMessage when MESSAGING_PROVIDER=loop. Do NOT send again here.
    """
    # Optional shared-secret check — set the same value in the LoopMessage dashboard
    if settings.LOOP_WEBHOOK_SECRET:
        provided = request.headers.get("Authorization", "")
        if provided != settings.LOOP_WEBHOOK_SECRET:
            logger.warning("Rejected Loop webhook: bad secret")
            raise HTTPException(status_code=403, detail="Invalid webhook secret")

    try:
        payload = await request.json()
    except Exception:
        logger.warning("Loop webhook: non-JSON body")
        raise HTTPException(status_code=400, detail="Expected JSON")

    # Log raw payload until you've confirmed field names in Railway logs
    logger.info("Loop webhook payload: %s", payload)

    alert_type = payload.get("alert_type", "")

    # Only inbound texts trigger the onboarding state machine
    if alert_type != "message_inbound":
        return {"ok": True, "ignored": alert_type or "unknown"}

    sender = (
        payload.get("recipient")
        or payload.get("from")
        or payload.get("contact")
        or ""
    )
    text = payload.get("text") or payload.get("message") or ""

    if not sender or not text:
        logger.info("Loop webhook: missing sender or text, ignoring")
        return {"ok": True, "ignored": "missing sender or text"}

    phone = loop_service.normalize_phone(sender)

    # Log inbound, then run the state machine (which sends its own reply)
    loop_service._log_message(phone, text, direction="inbound")
    handle_incoming(db, phone, text)

    return {"ok": True}


# ──────────────────────────────────────────────────────────────────────
# Twilio SMS webhook (legacy — kept for rollback)
# ──────────────────────────────────────────────────────────────────────

async def _verify_twilio_signature(request: Request) -> bool:
    """Verify the request actually came from Twilio. Skip in dev mode."""
    if not settings.TWILIO_AUTH_TOKEN:
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
    twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    return Response(content=twiml, media_type="application/xml")


# ──────────────────────────────────────────────────────────────────────
# Admin (token-protected)
# ──────────────────────────────────────────────────────────────────────

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
    rows = db.query(models.WaitlistEntry).order_by(
        models.WaitlistEntry.created_at.desc()
    ).all()
    return [
        {
            "id": r.id,
            "email": r.email,
            "phone": r.phone,
            "referral": r.referral,
            "created_at": r.created_at,
        }
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


# ──────────────────────────────────────────────────────────────────────
# Dev helpers
# ──────────────────────────────────────────────────────────────────────

@app.post("/dev/sms")
def dev_sms(
    phone: str = Form(...),
    body: str = Form(""),
    db: Session = Depends(get_db),
):
    """Simulate an inbound message for local testing without a provider."""
    reply = handle_incoming(db, phone, body)
    return {"phone": phone, "received": body, "reply": reply}


@app.post("/dev/loop-send")
def dev_loop_send(
    to: str = Form(...),
    body: str = Form("test from mei"),
    _: None = Depends(require_admin),
):
    """
    Admin-only: fire a test iMessage through LoopMessage.
    Use this against a sandbox contact before buying a sender name.
    """
    result = loop_service.send_message(to, body)
    return result
