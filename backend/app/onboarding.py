"""
SMS onboarding state machine.

Flow: start → name → age → city → gender → seeking → q1..q5 → complete
Once complete, handles YES/NO match responses and STOP/HELP/DELETE.
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from .models import User, Message, Match
from .sms_service import send_sms
from .personality import extract_personality

logger = logging.getLogger(__name__)

QUESTIONS = [
    ("q1", "What's something small that recently made you feel deeply alive?"),
    ("q2", "When you're at your best, what are you usually doing?"),
    ("q3", "Describe a person, real or fictional, whose company would feel like home."),
    ("q4", "What's a belief or value that quietly guides most of your choices?"),
    ("q5", "What are you hoping to find here — in your own words?"),
]
QUESTION_KEYS = [k for k, _ in QUESTIONS]

FLOW = ["start", "name", "age", "city", "gender", "seeking"] + QUESTION_KEYS + ["complete"]


def _next_step(current: str) -> str:
    try:
        return FLOW[FLOW.index(current) + 1]
    except (ValueError, IndexError):
        return "complete"


def _question_for(step: str) -> str | None:
    return dict(QUESTIONS).get(step)


def _parse_gender(text: str) -> str | None:
    t = text.lower().strip()
    if t in ("m", "man", "male", "guy", "men"):
        return "man"
    if t in ("w", "f", "woman", "female", "women"):
        return "woman"
    if t in ("nb", "enby", "nonbinary", "non-binary", "non binary", "other"):
        return "nonbinary"
    return None


def _parse_seeking(text: str) -> str | None:
    t = text.lower().strip()
    if t in ("m", "men", "man", "guys", "male"):
        return "men"
    if t in ("w", "f", "women", "woman", "female"):
        return "women"
    if t in ("everyone", "all", "anyone", "both", "any"):
        return "everyone"
    return None


# ─────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────

def handle_incoming(db: Session, phone: str, body: str) -> str:
    """Process an inbound SMS. Returns the reply text that was sent."""
    body = (body or "").strip()
    upper = body.upper()
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        user = User(phone=phone, onboarding_step="start", answers={}, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Log every inbound message
    db.add(Message(user_id=user.id, direction="in", body=body))
    user.last_active_at = datetime.utcnow()
    db.commit()

    # ── Universal commands work at any point ──

    if upper == "HELP":
        reply = (
            "Yuanfen 缘 — SMS matchmaking. Reply STOP to opt out, "
            "DELETE to remove your data, RESUME to start matches again, "
            "or PAUSE to pause matches. Questions: hello@joinyuanfen.com"
        )
        send_sms(db, user, reply)
        return reply

    if upper == "STOP":
        user.is_active = False
        db.commit()
        reply = (
            "You've been unsubscribed. You won't receive any more messages. "
            "Reply RESUME to opt back in, or DELETE to remove all data."
        )
        send_sms(db, user, reply)
        return reply

    if upper == "RESUME":
        user.is_active = True
        db.commit()
        reply = "Welcome back. We'll text when we find a resonant match."
        send_sms(db, user, reply)
        return reply

    if upper == "PAUSE":
        user.is_active = False
        db.commit()
        reply = "Matches paused. Reply RESUME when you're ready again."
        send_sms(db, user, reply)
        return reply

    if upper == "DELETE":
        # Two-step confirmation
        if user.onboarding_step == "awaiting_delete_confirm":
            phone_to_log = user.phone
            user_id = user.id
            # Explicitly delete matches first (SQLite doesn't enforce FK cascades by default)
            db.query(Match).filter(
                (Match.user_a_id == user_id) | (Match.user_b_id == user_id)
            ).delete(synchronize_session=False)
            db.delete(user)
            db.commit()
            logger.info("Deleted user %s on request.", phone_to_log)
            return ""  # User row is gone, can't send via send_sms — silent
        user.onboarding_step = "awaiting_delete_confirm"
        db.commit()
        reply = (
            "This will permanently delete your profile, messages, and any "
            "matches. Reply DELETE again to confirm, or anything else to cancel."
        )
        send_sms(db, user, reply)
        return reply

    # If they were in delete-confirm and sent anything else, cancel
    if user.onboarding_step == "awaiting_delete_confirm":
        user.onboarding_step = "complete" if user.is_complete else _previous_step_for(user)
        db.commit()
        reply = "Cancelled. Nothing was deleted."
        send_sms(db, user, reply)
        return reply

    # ── Match response (YES/NO) after onboarding ──

    if user.is_complete and upper in ("YES", "NO", "Y", "N"):
        reply = _handle_match_response(db, user, upper)
        send_sms(db, user, reply)
        return reply

    # ── Otherwise: continue onboarding ──

    reply = _advance_onboarding(db, user, body)
    send_sms(db, user, reply)
    return reply


def _previous_step_for(user: User) -> str:
    """Fallback when we cancel out of awaiting_delete_confirm pre-onboarding."""
    return "complete" if user.is_complete else "start"


# ─────────────────────────────────────────────────────────
# Onboarding state machine
# ─────────────────────────────────────────────────────────

def _advance_onboarding(db: Session, user: User, body: str) -> str:
    step = user.onboarding_step

    if step == "start":
        user.onboarding_step = "name"
        db.commit()
        return (
            "Welcome to Yuanfen 缘 — connection by fate, refined by intention. "
            "We'll ask a few questions to learn your emotional shape. "
            "Reply STOP at any time to opt out. What's your first name?"
        )

    if step == "name":
        user.name = body[:80]
        user.onboarding_step = "age"
        db.commit()
        return f"Nice to meet you, {user.name}. How old are you?"

    if step == "age":
        try:
            age = int("".join(c for c in body if c.isdigit())[:3])
            if 18 <= age <= 120:
                user.age = age
                user.onboarding_step = "city"
                db.commit()
                return "And what city are you in?"
        except (ValueError, TypeError):
            pass
        return "Please reply with your age as a number (e.g. 28). You must be 18 or older."

    if step == "city":
        user.city = body[:80]
        user.onboarding_step = "gender"
        db.commit()
        return "How do you describe yourself? Reply with: man, woman, or nonbinary."

    if step == "gender":
        g = _parse_gender(body)
        if not g:
            return "Sorry, I didn't catch that. Reply with: man, woman, or nonbinary."
        user.gender = g
        user.onboarding_step = "seeking"
        db.commit()
        return "Who would you like to meet? Reply with: men, women, or everyone."

    if step == "seeking":
        s = _parse_seeking(body)
        if not s:
            return "Sorry, I didn't catch that. Reply with: men, women, or everyone."
        user.seeking = s
        user.onboarding_step = "q1"
        db.commit()
        return _question_for("q1") or ""

    if step in QUESTION_KEYS:
        answers = dict(user.answers or {})
        answers[step] = body
        user.answers = answers
        nxt = _next_step(step)
        user.onboarding_step = nxt
        db.commit()

        if nxt == "complete":
            user.personality = extract_personality(answers)
            user.is_complete = True
            db.commit()
            return (
                f"Thank you, {user.name}. We have what we need. "
                f"When we find someone whose interior life resonates with yours, "
                f"we'll text. Reply YES to meet them, NO to pass. 缘"
            )
        return _question_for(nxt) or "Tell me more."

    if step == "complete":
        return (
            "You're all set. We'll reach out when we find a resonant match. "
            "Reply PAUSE to pause matches, STOP to opt out, HELP for help."
        )

    return "Hi. Reply START to begin."


# ─────────────────────────────────────────────────────────
# Match response routing
# ─────────────────────────────────────────────────────────

def _handle_match_response(db: Session, user: User, response: str) -> str:
    yes = response in ("YES", "Y")

    pending = db.query(Match).filter(
        or_(
            and_(Match.user_a_id == user.id, Match.state == "sent_to_a"),
            and_(Match.user_b_id == user.id, Match.state == "sent_to_b"),
        )
    ).order_by(Match.created_at.desc()).first()

    if not pending:
        return "No pending introductions right now. We'll text when we find one."

    is_a = (pending.user_a_id == user.id)

    if is_a:
        pending.a_response = "YES" if yes else "NO"
        if not yes:
            pending.state = "rejected"
            db.commit()
            return "Understood. We'll keep looking."

        pending.state = "sent_to_b"
        db.commit()
        partner = db.get(User, pending.user_b_id)
        if partner and partner.is_active:
            msg = (
                f"Yuanfen 缘 — we think you'd enjoy meeting someone. "
                f"{pending.reasoning} "
                f"Reply YES to be introduced, or NO to pass."
            )
            send_sms(db, partner, msg)
        return "Lovely. We're reaching out to them now."

    # User is B
    pending.b_response = "YES" if yes else "NO"
    if not yes:
        pending.state = "rejected"
        db.commit()
        return "Understood. We'll keep looking."

    pending.state = "connected"
    db.commit()

    a = db.get(User, pending.user_a_id)
    b = db.get(User, pending.user_b_id)
    if a and b:
        send_sms(db, a, f"It's mutual. Meet {b.name} — {b.phone}. The rest is yours. 缘")
        return f"It's mutual. Meet {a.name} — {a.phone}. The rest is yours. 缘"
    return "Connected."
