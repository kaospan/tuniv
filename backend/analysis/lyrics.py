from __future__ import annotations

import re
from collections import Counter
from typing import Dict, List


STOPWORDS = {
    "the",
    "and",
    "to",
    "a",
    "of",
    "in",
    "on",
    "it",
    "is",
    "for",
    "with",
    "that",
    "this",
    "you",
    "i",
    "me",
    "my",
    "we",
    "our",
}


def extract_keywords(text: str, limit: int = 8) -> List[str]:
    words = re.findall(r"[a-zA-Z']+", text.lower())
    filtered = [w for w in words if w not in STOPWORDS and len(w) > 2]
    counts = Counter(filtered)
    return [w for w, _ in counts.most_common(limit)]


def summarize_lyrics(text: str) -> Dict:
    if not text.strip():
        return {"keywords": [], "sentiment": "neutral", "themes": []}
    keywords = extract_keywords(text)
    sentiment = "uplifting" if any(w in text.lower() for w in ["love", "rise", "shine", "alive"]) else "reflective"
    themes = keywords[:3]
    return {"keywords": keywords, "sentiment": sentiment, "themes": themes}
