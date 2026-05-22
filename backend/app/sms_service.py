"""
SMS sending wrapper.
Logs all messages to DB regardless of whether Twilio is configured,
so dev mode (no Twilio creds) still works end-to-end.
"""
import logging
from sqlalchemy.orm import Session
from .config import settings
from .models import User, Message

logger = logging.getLogger(__name__)

_twilio_client = None


def _get_client():
    global _twilio_client
    if _twilio_client is None and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            _twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        except Exception as e:
            logger.exception("Twilio init failed: %s", e)
    return _twilio_client


def send_sms(db: Session, user: User, body: str) -> Message:
    """Persist an outgoing message and dispatch via Twilio if configured."""
    msg = Message(user_id=user.id, direction="out", body=body)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    client = _get_client()
    if client and settings.TWILIO_PHONE_NUMBER:
        try:
            client.messages.create(
                body=body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=user.phone,
            )
        except Exception as e:
            logger.exception("Twilio send failed for %s: %s", user.phone, e)
    else:
        logger.info("[DEV SMS to %s] %s", user.phone, body)
    return msg
