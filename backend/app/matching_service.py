"""
Matching engine.

Two-stage matching:
  1. Hard filters: demographics, location, activity, prior matches.
  2. AI judgment: GPT-4 reads both users' raw answers and decides whether
     they'd genuinely enjoy talking. Returns a score + reasoning.

The score is internal only — users never see it. They see the reason.
"""
import json
import logging
import math
from typing import Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from .database import SessionLocal
from .config import settings
from .models import User, Match
from .sms_service import send_sms

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────
# Hard filters
# ─────────────────────────────────────────────────────────

def _gender_seeking_compatible(a: User, b: User) -> bool:
    """Does each user want the other's gender?"""
    if not (a.gender and a.seeking and b.gender and b.seeking):
        return True  # If unset, don't filter (legacy users)
    a_wants_b = (a.seeking == "everyone") or (
        (a.seeking == "men" and b.gender == "man") or
        (a.seeking == "women" and b.gender == "woman")
    )
    b_wants_a = (b.seeking == "everyone") or (
        (b.seeking == "men" and a.gender == "man") or
        (b.seeking == "women" and a.gender == "woman")
    )
    return a_wants_b and b_wants_a


def _same_metro(a: User, b: User) -> bool:
    """Loose city match — case-insensitive, exact for now. Punt on metros."""
    if not a.city or not b.city:
        return True
    return a.city.strip().lower() == b.city.strip().lower()


def _candidate_pool(db: Session, user: User) -> list[User]:
    """Find eligible candidates after hard filters but before AI scoring."""
    if not user.is_complete:
        return []

    # Already-matched partner IDs (regardless of state)
    prior = db.query(Match).filter(
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()
    excluded_ids = {user.id}
    for m in prior:
        excluded_ids.add(m.user_a_id)
        excluded_ids.add(m.user_b_id)

    q = db.query(User).filter(
        User.is_complete == True,
        User.is_active == True,
        ~User.id.in_(excluded_ids),
    )

    # Apply Python-side filters that are hard to express in SQL
    return [c for c in q.all() if _gender_seeking_compatible(user, c) and _same_metro(user, c)]


# ─────────────────────────────────────────────────────────
# AI matching judgment
# ─────────────────────────────────────────────────────────

MATCH_PROMPT = """You are a thoughtful matchmaker reading two people's answers to the same questions.
Decide if they'd genuinely enjoy a real conversation together. Look for resonance: shared sensibility,
complementary emotional registers, similar values expressed in different ways. Avoid surface-level
matching on shared hobbies. Weight emotional honesty, curiosity, and the quality of attention each person brings.

Person A's answers:
{a_answers}

Person B's answers:
{b_answers}

Return JSON only:
{{
  "score": integer 0-100 (your honest assessment of compatibility),
  "reason": one sentence (max 30 words) describing what they share — written as a note one would receive over SMS. Concrete, specific, no marketing language. Address it to "you" — both people will read it.
}}

If their answers don't resonate, return a score below 50. Better to under-match than oversell."""


def _ai_judge_match(a: User, b: User) -> tuple[int, str]:
    """Ask the AI to judge compatibility from raw answers."""
    if not settings.OPENAI_API_KEY:
        return _fallback_judge(a, b)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        a_text = "\n".join(f"Q: {k}\nA: {v}" for k, v in (a.answers or {}).items())
        b_text = "\n".join(f"Q: {k}\nA: {v}" for k, v in (b.answers or {}).items())

        resp = client.chat.completions.create(
            model="gpt-4o",  # The good one — this judgment matters
            messages=[
                {"role": "system", "content": "You return only valid JSON. No commentary."},
                {"role": "user", "content": MATCH_PROMPT.format(a_answers=a_text, b_answers=b_text)},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        score = int(data.get("score", 0))
        reason = str(data.get("reason", "")).strip()
        return max(0, min(100, score)), reason
    except Exception as e:
        logger.exception("AI match judgment failed; falling back. %s", e)
        return _fallback_judge(a, b)


def _fallback_judge(a: User, b: User) -> tuple[int, str]:
    """Used when no OpenAI key — looks at trait overlap only.
    Returns lower scores than the AI to be conservative."""
    p_a, p_b = a.personality or {}, b.personality or {}
    if not p_a or not p_b:
        return 0, ""

    score = 50
    # Bonus for matching humor and energy
    if p_a.get("humor_style") == p_b.get("humor_style"):
        score += 10
    if p_a.get("energy") == p_b.get("energy"):
        score += 5

    # Shared values
    va = set(v.lower() for v in p_a.get("values", []))
    vb = set(v.lower() for v in p_b.get("values", []))
    shared = va & vb
    score += min(15, len(shared) * 5)

    # Emotional depth similarity
    depth_diff = abs(float(p_a.get("emotional_depth", 0.5)) - float(p_b.get("emotional_depth", 0.5)))
    score += int((1 - depth_diff) * 10)

    score = max(0, min(100, score))
    reason = "You share a similar sensibility — worth a real conversation."
    return score, reason


# ─────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────

def find_best_match(db: Session, user: User, min_score: int = 70) -> Optional[tuple[User, int, str]]:
    """Find the single best AI-judged match for a user above threshold."""
    candidates = _candidate_pool(db, user)
    if not candidates:
        return None

    # AI judgment is expensive — cap candidates we evaluate fully.
    # In practice you'd pre-filter with cheaper signals first.
    candidates = candidates[:20]

    best: Optional[tuple[User, int, str]] = None
    for c in candidates:
        score, reason = _ai_judge_match(user, c)
        if score >= min_score and (best is None or score > best[1]):
            best = (c, score, reason)
    return best


def run_matching(min_score: int = 70):
    """Run a matching pass. Creates Match records and notifies user A.
    Threshold raised to 70 — we'd rather under-match than oversell."""
    db = SessionLocal()
    created = 0
    try:
        users = db.query(User).filter(User.is_complete == True, User.is_active == True).all()
        # Sort by least-recently-matched so everyone gets a fair shot
        users.sort(key=lambda u: u.last_active_at or u.created_at)

        seen_pairs = set()
        for u in users:
            # Skip users who already have a pending intro waiting
            pending = db.query(Match).filter(
                or_(
                    and_(Match.user_a_id == u.id, Match.state == "sent_to_a"),
                    and_(Match.user_b_id == u.id, Match.state == "sent_to_b"),
                )
            ).first()
            if pending:
                continue

            result = find_best_match(db, u, min_score=min_score)
            if not result:
                continue

            partner, score, reason = result
            pair = tuple(sorted([u.id, partner.id]))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            match = Match(
                user_a_id=u.id,
                user_b_id=partner.id,
                score=score,
                reasoning=reason,
                state="sent_to_a",
            )
            db.add(match)
            db.commit()
            db.refresh(match)

            # Notify A — no percentage shown, just the AI's reason
            msg = (
                f"Yuanfen 缘 — we think you'd enjoy meeting someone. "
                f"{reason} "
                f"Reply YES to be introduced, or NO to pass."
            )
            send_sms(db, u, msg)
            created += 1

        logger.info("Matching run complete. %d new matches created.", created)
        return created
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    n = run_matching()
    print(f"Created {n} matches.")
