#!/usr/bin/env python3
"""Parse YouTube transcript files into a timestamped, sentence-level lesson corpus.

Supports YouTube `json3` caption dumps (tStartMs/dDurationMs/segs[].utf8),
plain `.srt`, and `.vtt`. Cues are merged into complete sentences, each
carrying the start time of the cue where the sentence began, so lesson
material can link back to the exact moment in the video.

Usage:
  python parse_transcript.py INPUT --out coach/materials/<slug>/transcript.md \
      [--url https://www.youtube.com/watch?v=ID] [--title "..."] [--json out.json]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

NOISE_RE = re.compile(
    r"^\s*[\[\(](music|applause|laughter|inaudible|silence|noise|sound|"
    r"crosstalk|background)[^\]\)]*[\]\)]\s*$",
    re.IGNORECASE,
)
INLINE_NOISE_RE = re.compile(
    r"[\[\(](music|applause|laughter|inaudible|crosstalk)[^\]\)]*[\]\)]",
    re.IGNORECASE,
)
TAG_RE = re.compile(r"<[^>]+>")
SPEAKER_RE = re.compile(r">>\s*")
SENT_END_RE = re.compile(r"[.!?]['\"\u201d\u2019)]*$")
SRT_TIME_RE = re.compile(
    r"(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*"
    r"(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})"
)


def hhmmss(ms: int) -> str:
    total = int(ms) // 1000
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def clean(text: str) -> str:
    text = TAG_RE.sub("", text)
    text = INLINE_NOISE_RE.sub(" ", text)
    text = text.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text).strip()


def load_json3(path: str) -> list[dict]:
    with open(path, encoding="utf-8-sig") as fh:
        data = json.load(fh)
    events = data.get("events", data) if isinstance(data, dict) else data
    cues = []
    for ev in events or []:
        if not isinstance(ev, dict):
            continue
        start = ev.get("tStartMs", ev.get("start"))
        if start is None:
            continue
        segs = ev.get("segs") or []
        text = "".join(s.get("utf8", "") for s in segs if isinstance(s, dict))
        if not text.strip():
            continue
        cues.append({"start": int(start), "text": text})
    return cues


def load_srt_vtt(path: str) -> list[dict]:
    with open(path, encoding="utf-8-sig", errors="replace") as fh:
        raw = fh.read()
    cues, current = [], None
    for line in raw.splitlines():
        m = SRT_TIME_RE.search(line)
        if m:
            h, mi, s, frac = m.group(1, 2, 3, 4)
            ms = (int(h) * 3600 + int(mi) * 60 + int(s)) * 1000 + int(frac.ljust(3, "0"))
            current = {"start": ms, "text": ""}
            cues.append(current)
        elif current is not None and line.strip() and "-->" not in line:
            if line.strip().isdigit() and not current["text"]:
                continue
            current["text"] += " " + line.strip()
    return [c for c in cues if c["text"].strip()]


def load(path: str) -> list[dict]:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".json":
        return load_json3(path)
    if ext in (".srt", ".vtt"):
        return load_srt_vtt(path)
    try:
        return load_json3(path)
    except Exception:
        return load_srt_vtt(path)


def build_sentences(cues: list[dict]) -> list[dict]:
    """Merge cues into sentences, tracking speaker turns and start times."""
    sentences: list[dict] = []
    buf, buf_start = "", None
    pending_turn = True

    for cue in cues:
        text = cue["text"]
        if NOISE_RE.match(text.strip()):
            continue
        parts = SPEAKER_RE.split(text)
        for idx, part in enumerate(parts):
            is_turn = idx > 0
            part = clean(part)
            if is_turn:
                if buf.strip():
                    sentences.append(
                        {"start": buf_start, "turn_start": pending_turn,
                         "text": buf.strip()}
                    )
                    buf, buf_start = "", None
                    pending_turn = False
                pending_turn = True
            if not part:
                continue
            if buf_start is None:
                buf_start = cue["start"]
            buf = f"{buf} {part}".strip()
            while True:
                m = re.search(r"[.!?]['\"\u201d\u2019)]*\s+(?=[A-Z\u201c\"'])", buf)
                if not m:
                    break
                sentences.append(
                    {"start": buf_start, "turn_start": pending_turn,
                     "text": buf[: m.end()].strip()}
                )
                pending_turn = False
                buf = buf[m.end():].strip()
                buf_start = cue["start"]
            if SENT_END_RE.search(buf):
                sentences.append(
                    {"start": buf_start, "turn_start": pending_turn,
                     "text": buf.strip()}
                )
                pending_turn = False
                buf, buf_start = "", None

    if buf.strip():
        sentences.append(
            {"start": buf_start or 0, "turn_start": pending_turn, "text": buf.strip()}
        )

    for i, s in enumerate(sentences, 1):
        s["n"] = i
        s["time"] = hhmmss(s["start"])
        s["words"] = len(s["text"].split())
    return sentences


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input")
    ap.add_argument("--out", required=True, help="markdown transcript output path")
    ap.add_argument("--json", dest="json_out", help="optional JSON output path")
    ap.add_argument("--url", default="", help="source video URL")
    ap.add_argument("--title", default="", help="source title")
    args = ap.parse_args()

    if not os.path.exists(args.input):
        print(f"[ERROR] input not found: {args.input}", file=sys.stderr)
        return 1

    cues = load(args.input)
    if not cues:
        print("[ERROR] no cues parsed", file=sys.stderr)
        return 1
    sentences = build_sentences(cues)
    if not sentences:
        print("[ERROR] no sentences built", file=sys.stderr)
        return 1

    total_ms = cues[-1]["start"]
    base = re.sub(r"[?&]t=\d+s?", "", args.url).rstrip("&?")

    lines = [f"# {args.title or 'Transcript'}", ""]
    if args.url:
        lines += [f"Source: {args.url}", ""]
    lines += [
        f"Duration: {hhmmss(total_ms)} | Cues: {len(cues)} | Sentences: {len(sentences)}",
        "",
        "Each line is `N. [mm:ss] sentence`; `>>` marks the start of a new speaker",
        "turn as flagged in the source captions. Timestamps mark where the sentence",
        "starts in the video, so any line can be re-listened to directly. Speaker",
        "identity is not asserted: confirm it from content before quoting.",
        "",
    ]
    for s in sentences:
        spk = " >>" if s.get("turn_start") else ""
        link = ""
        if base:
            link = f" <{base}{'&' if '?' in base else '?'}t={s['start'] // 1000}s>"
        lines.append(f"{s['n']}.{spk} [{s['time']}] {s['text']}{link}")
    lines.append("")

    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    if args.json_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_out)) or ".", exist_ok=True)
        with open(args.json_out, "w", encoding="utf-8") as fh:
            json.dump(
                {"title": args.title, "url": args.url, "duration_ms": total_ms,
                 "sentences": sentences}, fh, ensure_ascii=False, indent=2)

    words = sum(s["words"] for s in sentences)
    print(f"[OK] {args.out}")
    print(f"     sentences={len(sentences)} words={words} duration={hhmmss(total_ms)}")
    print(f"     ~{max(1, round(total_ms / 1000 / 60 / 5))} lesson segments at ~5 min each")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


