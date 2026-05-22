"""
SMS onboarding state machine.
Handles incoming SMS messages, walks the user through onboarding,
and routes YES/NO responses to active matches.
"""
import logging
from sqlalchemy.orm import Session
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


def _next_step(current: str) -> str:
    flow = ["start", "name", "age", "city"] + QUESTION_KEYS + ["complete"]
    try:
        return flow[flow.index(current) + 1]
    except (ValueError, IndexError):
        return "complete"


def _question_for(step: str) -> str | None:
    return dict(QUESTIONS).get(step)


def handle_incoming(db: Session, phone: str, body: str) -> str:
    """Process an inbound SMS. Returns the reply text that was sent."""
    body = (body or "").strip()
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        user = User(phone=phone, onboarding_step="start", answers={})
        db.add(user)
        db.commit()
        db.refresh(user)

    # Log incoming
    db.add(Message(user_id=user.id, direction="in", body=body))
    db.commit()

    # YES/NO to an active match takes priority once onboarded
    if user.is_complete and body.upper() in ("YES", "NO", "Y", "N"):
        reply = _handle_match_response(db, user, body.upper())
        send_sms(db, user, reply)
        return reply

    reply = _advance_onboarding(db, user, body)
    send_sms(db, user, reply)
    return reply


def _advance_onboarding(db: Session, user: User, body: str) -> str:
    step = user.onboarding_step

    if step == "start":
        user.onboarding_step = "name"
        db.commit()
        return (
            "Welcome to Yuanfen 缘 — connection by fate, refined by intention. "
            "We'll ask a few questions to learn your emotional shape. What's your first name?"
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
        return "Please reply with your age as a number (e.g. 28)."

    if step == "city":
        user.city = body[:80]
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
            # Run personality extraction
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
            "Reply PAUSE to stop matches, RESUME to start again."
        )

    return "Hi. Reply START to begin."


def _handle_match_response(db: Session, user: User, response: str) -> str:
    """Route YES/NO to the most recent open match."""
    yes = response in ("YES", "Y")

    # Find the most recent match awaiting this user's response
    pending = db.query(Match).filter(
        ((Match.user_a_id == user.id) & (Match.state == "sent_to_a")) |
        ((Match.user_b_id == user.id) & (Match.state == "sent_to_b"))
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

        # A said yes — now ask B
        pending.state = "sent_to_b"
        db.commit()
        partner = db.query(User).filter(User.id == pending.user_b_id).first()
        if partner:
            msg = (
                f"Yuanfen 缘 — we found someone with {pending.score}% compatibility. "
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

    # Both said yes — exchange contact
    a = db.query(User).filter(User.id == pending.user_a_id).first()
    b = db.query(User).filter(User.id == pending.user_b_id).first()
    if a and b:
        send_sms(db, a, f"It's mutual. Meet {b.name} — {b.phone}. The rest is yours. 缘")
        return f"It's mutual. Meet {a.name} — {a.phone}. The rest is yours. 缘"
    return "Connected."
