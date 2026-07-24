"""Messaging facade.

Routes outbound messages to LoopMessage (iMessage) or Twilio (SMS)
based on settings.MESSAGING_PROVIDER. Existing callers use send_sms()
unchanged — only the transport under it swapped.
"""

import logging

from .config import settings
from . import loop_service

logger = logging.getLogger(__name__)


def send_sms(to: str, body: str) -> dict:
    """Primary outbound entrypoint. Name kept for backward compatibility."""
    if settings.MESSAGING_PROVIDER == "loop":
        return loop_service.send_message(to, body)
    return _send_via_twilio(to, body)


def send_with_effect(to: str, body: str, effect: str) -> dict:
    """Outbound with an iMessage effect. Silently degrades on Twilio."""
    if settings.MESSAGING_PROVIDER == "loop":
        return loop_service.send_message(to, body, effect=effect)
    return _send_via_twilio(to, body)


def _send_via_twilio(to: str, body: str) -> dict:
    """Legacy Twilio path — kept for rollback."""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to,
        )
        loop_service._log_message(to, body, direction="outbound", ok=True)
        return {"ok": True, "message_id": msg.sid}
    except Exception as e:
        logger.exception("Twilio send failed")
        return {"ok": False, "error": str(e)}
