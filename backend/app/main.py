"""
Yuanfen — SMS-based matchmaking.
FastAPI entrypoint.
"""
import logging
from fastapi import FastAPI, Depends, Form, HTTPException, Header, Response
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

app = FastAPI(title="Yuanfen API", version="0.1.0")

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


# ---------- Waitlist ----------

@app.post("/waitlist", response_model=schemas.WaitlistOut)
def join_waitlist(payload: schemas.WaitlistIn, db: Session = Depends(get_db)):
    # Dedupe on whichever identifier was provided
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


# ---------- Twilio SMS webhook ----------

@app.post("/sms")
def sms_webhook(
    From: str = Form(...),
    Body: str = Form(""),
    db: Session = Depends(get_db),
):
    """
    Twilio webhook for incoming SMS.
    Twilio posts form fields including From, Body, MessageSid.
    """
    reply = handle_incoming(db, From, Body)
    # Twilio accepts TwiML or an empty 200 — we already sent via API, so respond empty.
    twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    return Response(content=twiml, media_type="application/xml")


# ---------- Admin (token-protected) ----------

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


# ---------- Dev helper: simulate inbound SMS ----------

@app.post("/dev/sms")
def dev_sms(
    phone: str = Form(...),
    body: str = Form(""),
    db: Session = Depends(get_db),
):
    """Simulate an inbound SMS for local testing without Twilio."""
    reply = handle_incoming(db, phone, body)
    return {"phone": phone, "received": body, "reply": reply}
