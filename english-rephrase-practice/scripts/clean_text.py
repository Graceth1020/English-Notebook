#!/usr/bin/env python3
"""
Clean raw English subtitle or text files into a numbered sentence corpus for
rephrasing practice.

Handles .srt, .vtt, and plain text. Strips timestamps, cue indexes, HTML tags,
speaker labels, and music/effect cues; joins subtitle lines that continue a
sentence; filters too-short and too-long lines; removes duplicates.

Usage:
    python clean_text.py <input> [--out OUTPUT] [--min-words N]
                         [--max-words N] [--batch-size N] [--keep-speakers]

Example:
    python clean_text.py raw/gravity-falls-ep1.srt --out corpus/corpus-clean.txt
"""

import argparse
import math
import re
import sys
from pathlib import Path


TERMINAL_PUNCT = ".!?…\"'"
SPEAKER_RE = re.compile(r"^[A-Z][A-Za-z0-9&.' -]{0,20}:\s*")
LEADER_RE = re.compile(r"^(>>|>|-)\s*")
HTML_TAG_RE = re.compile(r"<[^>]+>")
TIMESTAMP_LINE_RE = re.compile(r"^\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->")
ONLY_SYMBOLS_RE = re.compile(r"^[^\w\s]*$")
EFFECT_WORDS = {
    "applause", "bang", "bangs", "beep", "beeps", "beeping", "buzz", "buzzing",
    "chatter", "chattering", "cheer", "cheers", "choke", "choking", "clank",
    "clanks", "click", "clicks", "cough", "coughing", "coughs", "crash",
    "crashes", "crashing", "creak", "creaks", "creaking", "cry", "crying",
    "gasp", "gasps", "gasping", "giggle", "giggles", "giggling", "groan",
    "groans", "growl", "growls", "growling", "grunt", "grunts", "grunting",
    "gurgle", "gurgling", "honk", "honking", "hoot", "hoots", "hooting",
    "howl", "howls", "howling", "hum", "humming", "knock", "knocks",
    "knocking", "laugh", "laughing", "laughter", "laughs", "moan", "moans",
    "moaning", "mumble", "mumbling", "murmur", "murmuring", "music", "pant",
    "pants", "panting", "pop", "pops", "ring", "ringing", "rings", "roar",
    "roars", "roaring", "rustle", "rustling", "screech", "screeching",
    "scream", "screaming", "screams", "shriek", "shrieks", "shrieking",
    "sigh", "sighing", "sighs", "sing", "singing", "sing-song", "slam",
    "slams", "slurp", "slurping", "sniff", "sniffing", "sniffle", "sniffles",
    "sob", "sobbing", "song", "squeak", "squeaking", "stomp", "stomping",
    "stomps", "thud", "thuds", "wail", "wailing", "wails", "whimper",
    "whimpering", "whisper", "whispering", "whispers", "whistle", "whistling",
    "wind", "yelp", "yelps", "yelping", "yell", "yelling", "yells",
}
INTERJECTIONS = {
    "ah", "aha", "argh", "aw", "bleh", "boo", "brr", "eh", "ew", "eww",
    "gah", "grr", "ha", "hah", "heh", "hmm", "ho", "huh", "meh", "oh",
    "ooh", "oof", "ouch", "ow", "phew", "shh", "ugh", "um", "uh", "whoa",
    "woo", "wow", "yay", "yikes", "yuck",
}


def read_text(path):
    data = path.read_bytes()
    for encoding in ("utf-8-sig", "gbk", "utf-16", "cp1252"):
        try:
            return data.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    return data.decode("utf-8", errors="replace")


def strip_line_noise(line):
    line = HTML_TAG_RE.sub("", line)
    line = LEADER_RE.sub("", line)
    line = SPEAKER_RE.sub("", line)
    return line.strip()


def parse_subtitle_cues(lines):
    cues = []
    current = []
    in_cue = False
    for raw in lines:
        line = raw.strip()
        if TIMESTAMP_LINE_RE.match(line):
            in_cue = True
            if current:
                cues.append(current)
                current = []
            continue
        if not line:
            if current:
                cues.append(current)
                current = []
            in_cue = False
            continue
        if not in_cue:
            continue
        if re.match(r"^\d+$", line):
            continue
        current.append(line)
    if current:
        cues.append(current)
    return cues


def join_cue(cue_lines):
    text = ""
    for line in cue_lines:
        line = strip_line_noise(line)
        if not line:
            continue
        if text.endswith("-") and line and line[0].isalpha():
            text = text[:-1] + line
        elif text and not text.endswith(" "):
            text += " "
        text += line
    return text.strip()


def looks_like_effect(line):
    if "♪" in line or "♫" in line:
        return True
    if not (line.startswith("(") and line.endswith(")")) and not (
        line.startswith("[") and line.endswith("]")
    ):
        return False
    inner = line[1:-1].strip()
    parts = [p.strip().lower() for p in re.split(r"[,&]|\band\b", inner) if p.strip()]
    if not parts:
        return False
    for part in parts:
        words = part.split()
        if words and words[0] in ("both", "all"):
            words = words[1:]
        if not words or any(w not in EFFECT_WORDS for w in words):
            return False
    return True


def collapse_repeats(word):
    out = []
    prev = ""
    for ch in word:
        if ch != prev:
            out.append(ch)
        prev = ch
    return "".join(out)


def looks_like_interjection(line):
    words = [re.sub(r"[^A-Za-z]", "", w).lower() for w in line.split()]
    words = [w for w in words if w]
    if not words:
        return False
    for w in words:
        if collapse_repeats(w) not in INTERJECTIONS:
            return False
    return True


def word_count(text):
    return len([w for w in text.split() if re.search(r"[A-Za-z0-9]", w)])


def clean(input_path, min_words, max_words, keep_speakers):
    text = read_text(input_path)
    lines = [line for line in text.splitlines()]
    has_timestamps = any(TIMESTAMP_LINE_RE.match(line.strip()) for line in lines)

    if has_timestamps:
        raw_units = parse_subtitle_cues(lines)
        units = [join_cue(cue) for cue in raw_units]
        raw_count = len(raw_units)
    else:
        if keep_speakers:
            units = [line.strip() for line in lines if line.strip()]
        else:
            units = [strip_line_noise(line) for line in lines if line.strip()]
        raw_count = len(units)

    kept = []
    dropped_effect = 0
    dropped_short = 0
    dropped_long = 0
    dropped_dup = 0
    seen = set()

    for unit in units:
        if not unit:
            continue
        if looks_like_effect(unit) or looks_like_interjection(unit) or ONLY_SYMBOLS_RE.match(unit):
            dropped_effect += 1
            continue
        n = word_count(unit)
        if n < min_words:
            dropped_short += 1
            continue
        if n > max_words:
            dropped_long += 1
            continue
        key = unit.casefold()
        if key in seen:
            dropped_dup += 1
            continue
        seen.add(key)
        kept.append(unit)
    return kept, {
        "raw_count": raw_count,
        "dropped_effect": dropped_effect,
        "dropped_short": dropped_short,
        "dropped_long": dropped_long,
        "dropped_dup": dropped_dup,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Path to subtitle or text file (.srt, .vtt, .txt)")
    parser.add_argument("--out", help="Output path (default: <input-stem>-clean.txt next to input)")
    parser.add_argument("--min-words", type=int, default=2, help="Drop lines with fewer words (default: 2)")
    parser.add_argument("--max-words", type=int, default=30, help="Drop lines with more words (default: 30)")
    parser.add_argument("--batch-size", type=int, default=10, help="Sentences per practice day (default: 10)")
    parser.add_argument("--keep-speakers", action="store_true", help="Keep speaker labels like MABEL:")
    parser.add_argument("--index", action="store_true", help="Record this file in <out-dir>/index.md")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[ERROR] Input not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    kept, stats = clean(input_path, args.min_words, args.max_words, args.keep_speakers)

    if args.out:
        out_path = Path(args.out)
    else:
        out_path = input_path.with_name(input_path.stem + "-clean.txt")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="\n") as fh:
        for i, sentence in enumerate(kept, start=1):
            fh.write(f"{i}. {sentence}\n")

    days = math.ceil(len(kept) / args.batch_size) if kept else 0
    if args.index:
        index_path = out_path.parent / "index.md"
        row = f"| {input_path.name} | {len(kept)} | {days} | pending |\n"
        if index_path.exists():
            content = index_path.read_text(encoding="utf-8")
            if input_path.name not in content:
                with index_path.open("a", encoding="utf-8", newline="\n") as fh:
                    fh.write(row)
        else:
            header = "| Source file | Sentences | Days at 10/day | Status |\n| --- | --- | --- | --- |\n"
            index_path.write_text(header + row, encoding="utf-8", newline="\n")
        print(f"Index               : {index_path}")
    print(f"Input units         : {stats['raw_count']}")
    print(f"Music/effect lines  : {stats['dropped_effect']}")
    print(f"Too short (<{args.min_words} words): {stats['dropped_short']}")
    print(f"Too long (>{args.max_words} words): {stats['dropped_long']}")
    print(f"Duplicates          : {stats['dropped_dup']}")
    print(f"Kept sentences      : {len(kept)}")
    print(f"Estimated days at {args.batch_size}/day: {days}")
    print(f"Output              : {out_path}")


if __name__ == "__main__":
    main()
