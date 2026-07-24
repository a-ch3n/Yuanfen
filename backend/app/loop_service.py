"""LoopMessage (iMessage) delivery service.

Replaces Twilio for outbound messages. Falls back to SMS automatically
if the recipient isn't on iMessage (requires SMS enabled on your sender name).
"""

import logging
import re
import httpx

from .config import settings
from .database import SessionLocal
from .models import Message

logger = logging.getLogger(__name__)

SEND_URL = "https://server.loopmessage.com/api/v1/message/send/"

# iMessage expressive effects — use sparingly, they're a treat not a default
EFFECT_CONFETTI = "confetti"
EFFECT_LOVE = "love"
EFFECT_FIREWORKS = "fireworks"
EFFECT_CELEBRATION = "celebration"


def normalize_phone(raw: str) -> str:
    """LoopMessage requires +13231112233 — no spaces, dashes, or parens."""
    if not raw:
        return ""
    raw = raw.strip()
    if "@" in raw:                      # email recipients are allowed too
        return raw.lower()
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:               # bare US number
        digits = "1" + digits
    if not digits.startswith("+"):
        return "+" + digits
    return digits


def send_message(
    to: str,
    body: str,
    effect: str | None = None,
    subject: str | None = None,
    service: str = "imessage",
    log_to_db: bool = True,
) -> dict:
    """Send an iMessage via LoopMessage.

    Args:
        to: phone number or email
        body: message text
        effect: optional iMessage effect (confetti, love, fireworks, ...)
        subject: optional bold title above the message
        service: "imessage" or "sms"
    Returns:
        dict with ok/status/message_id/error
    """
    recipient = normalize_phone(to)
    if not recipient:
        return {"ok": False, "error": "empty recipient"}

    if not settings.LOOP_AUTH_KEY or not settings.LOOP_SECRET_KEY:
        logger.warning("LoopMessage keys not configured — message not sent")
        return {"ok": False, "error": "loop keys missing"}

    payload = {
        "recipient": recipient,
        "text": body,
        "sender_name": settings.LOOP_SENDER_NAME,
        "service": service,
    }
    # SMS doesn't support subject or effect
    if service == "imessage":
        if effect:
            payload["effect"] = effect
        if subject:
            payload["subject"] = subject

    headers = {
        "Authorization": settings.LOOP_AUTH_KEY,
        "Loop-Secret-Key": settings.LOOP_SECRET_KEY,
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(SEND_URL, json=payload, headers=headers)

        data = {}
        try:
            data = resp.json()
        except Exception:
            pass

        ok = resp.status_code in (200, 201)
        if not ok:
            logger.error(
                "LoopMessage send failed: %s %s", resp.status_code, resp.text[:400]
            )

        if log_to_db:
            _log_message(recipient, body, direction="outbound", ok=ok)

        return {
            "ok": ok,
            "status": resp.status_code,
            "message_id": data.get("message_id"),
            "raw": data,
        }

    except Exception as e:
        logger.exception("LoopMessage send exception")
        if log_to_db:
            _log_message(recipient, body, direction="outbound", ok=False)
        return {"ok": False, "error": str(e)}


def _log_message(phone: str, body: str, direction: str, ok: bool = True) -> None:
    """Persist message to DB. Never let logging break sending."""
    db = SessionLocal()
    try:
        db.add(Message(phone=phone, body=body, direction=direction))
        db.commit()
    except Exception:
        logger.exception("Failed to log message")
        db.rollback()
    finally:
        db.close()


# --- Convenience wrappers in Mei's voice ---

def send_match_reveal(to: str, body: str) -> dict:
    """Match intro — the moment worth an effect."""
    return send_message(to, body, effect=EFFECT_CONFETTI)


def send_mutual_match(to: str, body: str) -> dict:
    """Both said yes. Contact exchange."""
    return send_message(to, body, effect=EFFECT_LOVE)
