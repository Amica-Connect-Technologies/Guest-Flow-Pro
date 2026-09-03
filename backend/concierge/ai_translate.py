"""
Shared OpenAI-backed translation helper.

Used to translate hotel-authored, guest-facing content (descriptions,
service listings, etc.) ONCE at write time, cached in the database — guests
never wait on a live API call, only the editor's save does.
"""
import json
import urllib.request
from django.conf import settings

_LANG_NAMES = {"it": "Italian", "es": "Spanish"}


def translate_text(text: str, target_lang: str) -> str:
    """
    Translate English `text` into `target_lang` ("it" or "es") using OpenAI.
    Returns "" on any failure (missing key, API error, empty input) so
    callers can safely store the result without crashing a save.
    """
    text = (text or "").strip()
    lang_name = _LANG_NAMES.get(target_lang)
    key = getattr(settings, "OPENAI_API_KEY", "")
    if not text or not lang_name or not key:
        return ""

    prompt = (
        f"Translate the following hotel-guest-facing text into {lang_name}. "
        "Keep the tone warm and professional, keep proper nouns and place names "
        "unchanged, and return ONLY the translated text — no quotes, no notes, "
        "no explanation.\n\n"
        f"Text:\n{text}"
    )
    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 800,
        "temperature": 0.3,
    }).encode()

    req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=payload)
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            result = json.loads(resp.read())
        return result["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""


def translate_to_it_es(text: str) -> tuple[str, str]:
    """Convenience wrapper: returns (italian, spanish) translations of `text`."""
    return translate_text(text, "it"), translate_text(text, "es")
