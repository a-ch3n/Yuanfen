"""
Matching engine.
Compares personality profiles and produces a compatibility score (0-100)
plus a short human-readable reason.
"""
import logging
from typing import Any
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import User, Match
from .sms_service import send_sms

logger = logging.getLogger(__name__)


def _score(a: dict[str, Any], b: dict[str, Any]) -> tuple[int, str]:
    if not a or not b:
        return 0, "Profiles incomplete."

    # Trait similarity (closer = better)
    def diff(k: str) -> float:
        return abs(float(a.get(k, 0.5)) - float(b.get(k, 0.5)))

    openness_match = 1 - diff("openness")
    depth_match = 1 - diff("emotional_depth")

    # Complementary energy: similar energies match; opposites can spark
    energy_pairs = {
        ("calm", "calm"): 0.9, ("steady", "steady"): 0.9,
        ("vibrant", "vibrant"): 0.9, ("intense", "intense"): 0.85,
        ("calm", "steady"): 0.8, ("steady", "vibrant"): 0.7,
        ("vibrant", "intense"): 0.7, ("calm", "intense"): 0.4,
    }
    e_a, e_b = a.get("energy", "steady"), b.get("energy", "steady")
    energy_score = energy_pairs.get((e_a, e_b)) or energy_pairs.get((e_b, e_a), 0.5)

    # Humor compatibility
    humor_match = 0.9 if a.get("humor_style") == b.get("humor_style") else 0.6

    # Shared values overlap
    values_a = set(v.lower() for v in a.get("values", []))
    values_b = set(v.lower() for v in b.get("values", []))
    if values_a or values_b:
        shared = len(values_a & values_b)
        total = len(values_a | values_b)
        values_score = shared / total if total else 0.5
    else:
        values_score = 0.5

    raw = (
        openness_match * 0.15
        + depth_match * 0.25
        + energy_score * 0.20
        + humor_match * 0.15
        + values_score * 0.25
    )
    score = int(round(raw * 100))

    # Reasoning
    bits = []
    if depth_match > 0.8:
        bits.append("a similar emotional register")
    if humor_match > 0.8:
        bits.append("the same kind of humor")
    if values_score > 0.5:
        shared_values = list(values_a & values_b)[:2]
        if shared_values:
            bits.append(f"shared care for {' and '.join(shared_values)}")
    if energy_score > 0.8:
        bits.append("a matching energy")
    reason = "You share " + ", ".join(bits) + "." if bits else "An unexpected pairing — worth exploring."
    return score, reason


def find_matches_for_user(db: Session, user: User, min_score: int = 60) -> list[tuple[User, int, str]]:
    """Find candidate matches for one user. Excludes self and existing matches."""
    if not user.is_complete:
        return []

    existing_partner_ids = set()
    for m in db.query(Match).filter(
        (Match.user_a_id == user.id) | (Match.user_b_id == user.id)
    ).all():
        existing_partner_ids.add(m.user_a_id if m.user_a_id != user.id else m.user_b_id)

    candidates = db.query(User).filter(
        User.id != user.id,
        User.is_complete == True,
        User.is_active == True,
        ~User.id.in_(existing_partner_ids) if existing_partner_ids else True,
    ).all()

    results = []
    for c in candidates:
        score, reason = _score(user.personality or {}, c.personality or {})
        if score >= min_score:
            results.append((c, score, reason))
    results.sort(key=lambda x: x[1], reverse=True)
    return results


def run_matching():
    """
    Run matching pass over all complete users.
    Creates Match records and sends the YES/NO prompt to user A.
    """
    db = SessionLocal()
    created = 0
    try:
        users = db.query(User).filter(User.is_complete == True, User.is_active == True).all()
        seen_pairs = set()
        for u in users:
            top = find_matches_for_user(db, u, min_score=60)
            for partner, score, reason in top[:1]:  # one new intro per pass
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

                # Notify user A
                msg = (
                    f"Yuanfen 缘 — we found someone with {score}% compatibility. "
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
