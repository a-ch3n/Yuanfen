"""
AI personality extraction.
Uses OpenAI to turn a user's free-text SMS answers into a structured personality profile.
Falls back to a deterministic heuristic if no API key is configured (useful for local dev).
"""
import json
import logging
from typing import Any
from .config import settings

logger = logging.getLogger(__name__)

PERSONALITY_PROMPT = """You are a thoughtful matchmaker analyzing someone's answers to learn about their emotional world.

Their answers:
{answers}

Return a JSON object (and nothing else) with the following structure:
{{
  "openness": float 0-1,
  "emotional_depth": float 0-1,
  "humor_style": one of ["dry", "playful", "absurd", "warm", "earnest", "sharp"],
  "energy": one of ["calm", "steady", "vibrant", "intense"],
  "love_language": one of ["words", "time", "touch", "acts", "gifts"],
  "values": array of 3-5 short strings (what they care about),
  "looking_for": array of 2-4 short strings (qualities they seek in another person),
  "summary": one sentence describing their emotional signature (max 25 words)
}}
"""


def _fallback_profile(answers: dict[str, str]) -> dict[str, Any]:
    """Deterministic, content-aware fallback when no OpenAI key is set."""
    text = " ".join(str(v) for v in answers.values()).lower()
    length = sum(len(str(v)) for v in answers.values())

    # Heuristic signals
    has_feelings = any(w in text for w in ["feel", "love", "afraid", "hope", "miss", "lonely", "joy"])
    has_humor = any(w in text for w in ["lol", "haha", "funny", "joke", "weird", "silly"])
    has_art = any(w in text for w in ["book", "music", "art", "film", "writing", "poetry"])
    has_outdoors = any(w in text for w in ["hike", "outdoors", "mountain", "ocean", "run"])

    return {
        "openness": min(1.0, 0.4 + (length / 1000)),
        "emotional_depth": 0.8 if has_feelings else 0.5,
        "humor_style": "playful" if has_humor else "warm",
        "energy": "vibrant" if has_outdoors else "calm",
        "love_language": "words" if has_art else "time",
        "values": ["honesty", "curiosity", "depth"] + (["creativity"] if has_art else []),
        "looking_for": ["someone present", "a real conversationalist"],
        "summary": "A thoughtful person with a quiet emotional intelligence.",
    }


def extract_personality(answers: dict[str, str]) -> dict[str, Any]:
    if not settings.OPENAI_API_KEY:
        logger.info("No OPENAI_API_KEY set — using fallback personality profile.")
        return _fallback_profile(answers)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        formatted = "\n".join(f"Q: {k}\nA: {v}" for k, v in answers.items())
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You return only valid JSON. No commentary."},
                {"role": "user", "content": PERSONALITY_PROMPT.format(answers=formatted)},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.exception("OpenAI personality extraction failed; falling back. %s", e)
        return _fallback_profile(answers)
