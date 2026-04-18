"""
Normalize heterogeneous LLM JSON (e.g. Groq/Llama using alternate keys)
into the shape expected by SpeakingEvaluateResponse.
"""

from __future__ import annotations

import math
from typing import Any, Mapping


def _clamp_band(x: Any, default: float = 6.0) -> float:
    try:
        v = float(x)
    except (TypeError, ValueError):
        return default
    if math.isnan(v):
        return default
    return max(1.0, min(9.0, v))


def _first_str(d: Mapping[str, Any], keys: tuple[str, ...]) -> str | None:
    for k in keys:
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _alias_top_level_strings(d: dict[str, Any]) -> None:
    if not _first_str(d, ("corrected_version",)):
        s = _first_str(
            d,
            (
                "correction",
                "corrected",
                "corrected_text",
                "corrected_answer",
                "edited_version",
                "revised_answer",
            ),
        )
        if s:
            d["corrected_version"] = s

    if not _first_str(d, ("natural_version",)):
        s = _first_str(
            d,
            (
                "natural",
                "natural_answer",
                "more_natural",
                "native_like_version",
                "fluent_version",
                "natural_rephrase",
            ),
        )
        if s:
            d["natural_version"] = s

    if not _first_str(d, ("sample_answer",)):
        s = _first_str(
            d,
            (
                "sample",
                "model_answer",
                "ideal_answer",
                "exemplar_answer",
                "high_band_answer",
                "example_answer",
            ),
        )
        if s:
            d["sample_answer"] = s


def _coerce_key_vocabulary(d: dict[str, Any]) -> None:
    if isinstance(d.get("key_vocabulary"), list):
        cleaned: list[str] = []
        for item in d["key_vocabulary"]:
            if isinstance(item, str) and item.strip():
                cleaned.append(item.strip())
            elif isinstance(item, dict):
                w = item.get("word") or item.get("phrase") or item.get("item")
                if isinstance(w, str) and w.strip():
                    cleaned.append(w.strip())
        d["key_vocabulary"] = cleaned[:16]
        return
    for k in (
        "key_vocab",
        "vocabulary_suggestions",
        "useful_vocabulary",
        "vocabulary_items",
        "suggested_vocabulary",
        "key_words",
    ):
        v = d.get(k)
        if v is None:
            continue
        if isinstance(v, list):
            out: list[str] = []
            for item in v:
                if isinstance(item, str) and item.strip():
                    out.append(item.strip())
                elif isinstance(item, dict):
                    w = item.get("word") or item.get("phrase") or item.get("item")
                    if isinstance(w, str) and w.strip():
                        out.append(w.strip())
                if len(out) >= 16:
                    break
            d["key_vocabulary"] = out[:16]
            return
        if isinstance(v, str) and v.strip():
            parts = [s.strip() for s in v.replace(";", ",").split(",") if s.strip()]
            d["key_vocabulary"] = parts[:16]
            return
    d.setdefault("key_vocabulary", [])


def _scores_from_mapping(sub: Mapping[str, Any]) -> dict[str, float]:
    def pick(*names: str, default: float = 6.0) -> float:
        for n in names:
            if n in sub and sub[n] is not None:
                return _clamp_band(sub[n], default)
        return default

    fluency = pick("fluency", "fluency_coherence", "fluency_and_coherence")
    pronunciation: float | None = None
    for n in ("pronunciation", "pronunciation_band"):
        if n in sub and sub[n] is not None:
            pronunciation = _clamp_band(sub[n], 6.0)
            break
    if pronunciation is None:
        pronunciation = fluency
    grammar = pick("grammar", "grammatical_range_and_accuracy", "grammatical_range_accuracy", "grammar_accuracy")
    vocabulary = pick("vocabulary", "lexical_resource", "lexical")
    has_overall = any(k in sub for k in ("overall", "overall_band", "band", "total"))
    if has_overall:
        overall = pick("overall", "overall_band", "band", "total")
    else:
        overall = round((fluency + pronunciation + grammar + vocabulary) / 4 * 2) / 2
    return {
        "fluency": fluency,
        "pronunciation": pronunciation,
        "grammar": grammar,
        "vocabulary": vocabulary,
        "overall": overall,
    }


def _coerce_scores(d: dict[str, Any]) -> None:
    if isinstance(d.get("scores"), dict) and d["scores"]:
        sub = d["scores"]
        fluency = _clamp_band(sub.get("fluency"), 6.0)
        pronunciation = (
            _clamp_band(sub.get("pronunciation"), 6.0)
            if sub.get("pronunciation") is not None
            else fluency
        )
        grammar = _clamp_band(sub.get("grammar"), 6.0)
        vocabulary = _clamp_band(sub.get("vocabulary"), 6.0)
        overall = (
            _clamp_band(sub.get("overall"), 6.0)
            if sub.get("overall") is not None
            else round((fluency + pronunciation + grammar + vocabulary) / 4 * 2) / 2
        )
        d["scores"] = {
            "fluency": fluency,
            "pronunciation": pronunciation,
            "grammar": grammar,
            "vocabulary": vocabulary,
            "overall": overall,
        }
        return
    for nest in ("ielts_scores", "band_scores", "scores_breakdown", "evaluation", "assessment", "rubrics"):
        sub = d.get(nest)
        if isinstance(sub, dict) and sub:
            d["scores"] = _scores_from_mapping(sub)
            return
    d["scores"] = {
        "fluency": 6.0,
        "pronunciation": 6.0,
        "grammar": 6.0,
        "vocabulary": 6.0,
        "overall": 6.0,
    }


def _normalize_feedback_item(item: Any) -> dict[str, Any]:
    if not isinstance(item, dict):
        t = str(item).strip()[:400] if item is not None else "Note"
        return {
            "issue": "Feedback",
            "explanation_simple": t or "See suggestion.",
            "suggestion": t or "Rewrite more naturally.",
            "original_snippet": None,
        }
    out = dict(item)
    if "explanation_simple" not in out or not str(out.get("explanation_simple", "")).strip():
        exp = out.get("explanation") or out.get("reason") or out.get("detail")
        out["explanation_simple"] = str(exp).strip()[:800] if exp else "See suggestion."
    if "suggestion" not in out or not str(out.get("suggestion", "")).strip():
        fix = out.get("fix") or out.get("better") or out.get("improved")
        out["suggestion"] = str(fix).strip()[:400] if fix else str(out.get("issue", "Improve wording."))[:400]
    if "issue" not in out or not str(out.get("issue", "")).strip():
        out["issue"] = "Issue"
    orig = out.get("original_snippet")
    if orig is not None and not isinstance(orig, str):
        out["original_snippet"] = str(orig)[:200] if orig else None
    elif "original" in out and "original_snippet" not in out:
        o = out.get("original")
        out["original_snippet"] = str(o)[:200] if o is not None else None
    return out


def _coerce_feedback_list(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    return [_normalize_feedback_item(x) for x in raw]


def _coerce_feedback(d: dict[str, Any]) -> None:
    fb = d.get("feedback")
    if isinstance(fb, dict):
        fb = dict(fb)
        if "grammar_mistakes" not in fb and "grammar_errors" in fb:
            fb["grammar_mistakes"] = fb.pop("grammar_errors")
        if "vocabulary_improvements" not in fb and "vocabulary" in fb and isinstance(fb.get("vocabulary"), list):
            fb["vocabulary_improvements"] = fb.pop("vocabulary")
        fb["grammar_mistakes"] = _coerce_feedback_list(fb.get("grammar_mistakes"))
        fb["vocabulary_improvements"] = _coerce_feedback_list(fb.get("vocabulary_improvements"))
        fb["clarity_comments"] = _coerce_feedback_list(fb.get("clarity_comments"))
        d["feedback"] = fb
        return

    gm = d.get("grammar_mistakes") or d.get("grammar_errors") or d.get("grammar_issues")
    vm = d.get("vocabulary_improvements") or d.get("vocabulary") or d.get("lexical_feedback")
    cc = d.get("clarity_comments") or d.get("clarity") or d.get("coherence_comments")
    d["feedback"] = {
        "grammar_mistakes": _coerce_feedback_list(gm if isinstance(gm, list) else []),
        "vocabulary_improvements": _coerce_feedback_list(vm if isinstance(vm, list) else []),
        "clarity_comments": _coerce_feedback_list(cc if isinstance(cc, list) else []),
    }


def coerce_speaking_evaluate_dict(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise RuntimeError("Model output must be a single JSON object at the top level.")

    d: dict[str, Any] = dict(raw)
    _alias_top_level_strings(d)

    if _first_str(d, ("natural_version",)) is None and _first_str(d, ("corrected_version",)) is not None:
        d["natural_version"] = d["corrected_version"]

    _coerce_scores(d)
    _coerce_key_vocabulary(d)
    _coerce_feedback(d)

    if not _first_str(d, ("sample_answer",)):
        base = _first_str(d, ("natural_version", "corrected_version"))
        d["sample_answer"] = (base or "A stronger sample answer could not be inferred from the model output.")[:8000]

    cv = _first_str(d, ("corrected_version",))
    if not cv:
        raise RuntimeError(
            "Model JSON is missing a corrected answer. Expected key `corrected_version` "
            "(or alias `correction`)."
        )

    return d
