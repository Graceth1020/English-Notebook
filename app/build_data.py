#!/usr/bin/env python3
"""Build JSON data for the rephrase practice site from the skill's markdown files.

Scans corpus/, days/, summaries/, and progress/ in the repo root and writes
app/data/index.json plus one JSON file per course.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent / "data"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def clean_line(line: str) -> str:
    return line.strip()


def join_paragraph(lines: list[str]) -> str:
    return re.sub(r"\s+", " ", " ".join(lines)).strip()


def is_heading(line: str) -> bool:
    return line.startswith("#")


# --------------------------------------------------------------------------
# Corpus
# --------------------------------------------------------------------------

def parse_corpus(path: Path) -> dict:
    sentences = []
    for raw in read_text(path).splitlines():
        line = clean_line(raw)
        if not line:
            continue
        m = re.match(r"^(\d+)\.\s*\[([EMH])\]\s*(.+?)\s*(?:\|\s*(.*))?$", line)
        if not m:
            continue
        sentences.append(
            {
                "n": int(m.group(1)),
                "tag": m.group(2),
                "text": m.group(3).strip(),
                "zh": (m.group(4) or "").strip(),
            }
        )
    return {
        "file": path.name,
        "sentences": sentences,
        "count": len(sentences),
        "days_at_10": (len(sentences) + 9) // 10,
    }


# --------------------------------------------------------------------------
# Day files
# --------------------------------------------------------------------------

DAY_NAME_RE = re.compile(r"^day-(\d+)-(\d{8})(?:-(\d+))?\.md$")


def parse_day(path: Path) -> dict | None:
    lines = read_text(path).splitlines()
    m = DAY_NAME_RE.match(path.name)
    if not m:
        return None
    day_n = int(m.group(1))
    date = f"{m.group(2)[:4]}-{m.group(2)[4:6]}-{m.group(2)[6:]}"
    round_n = int(m.group(3)) if m.group(3) else None

    title = ""
    source = ""
    difficulty = ""
    context = ""
    focus_lines: list[str] = []
    sentences: list[dict] = []
    answers: list[dict] = []
    in_answers = False
    in_focus = False
    seen_answer_nums: set[int] = set()

    for line in lines:
        s = clean_line(line)
        if s.startswith("# "):
            title = s[2:].strip()
            in_focus = False
            continue
        if s.startswith("## "):
            in_focus = False
            if s[3:].strip().lower() == "my answers":
                in_answers = True
            continue
        if s.startswith("Source:"):
            parts = [p.strip() for p in s[7:].split("|")]
            source = parts[0]
            if len(parts) > 1:
                difficulty = parts[1]
            continue
        if s.startswith("Context:"):
            context = s[8:].strip()
            continue
        if s.lower().startswith("today's focus:"):
            in_focus = True
            rest = s[len("Today's focus:") :].strip()
            if rest:
                focus_lines.append(rest)
            continue
        if in_focus:
            if not s:
                continue
            focus_lines.append(s)
            continue
        if in_answers:
            am = re.match(r"^(\d+)\.\s*(.*)$", s)
            if am and int(am.group(1)) not in seen_answer_nums:
                num = int(am.group(1))
                seen_answer_nums.add(num)
                body = am.group(2).strip()
                if not body or body.lower() in {"(blank)", "blank"}:
                    answers.append({"n": num, "kind": "blank", "text": ""})
                elif body.lower() in {"pass", "pass.", "passed", "passed."}:
                    answers.append({"n": num, "kind": "pass", "text": "pass"})
                else:
                    answers.append({"n": num, "kind": "text", "text": body})
            continue
        sm = re.match(r"^(\d+)\.\s+(.+)$", s)
        if sm:
            num = int(sm.group(1))
            body = sm.group(2)
            pattern = ""
            line_n = None
            pm = re.match(r"^(.*?)\s+`([^`]+)`\s*(?:\(line\s*(\d+)\))?$", body)
            if pm:
                body = pm.group(1).strip()
                pattern = pm.group(2).strip()
                if pm.group(3):
                    line_n = int(pm.group(3))
            sentences.append(
                {"n": num, "text": body, "pattern": pattern, "line": line_n}
            )

    answers.sort(key=lambda a: a["n"])
    answered = sum(1 for a in answers if a["kind"] in {"text", "pass"})
    return {
        "n": day_n,
        "date": date,
        "round": round_n,
        "file": path.name,
        "title": title,
        "source": source,
        "difficulty": difficulty,
        "context": context,
        "sentences": sentences,
        "focus": join_paragraph(focus_lines),
        "answers": answers,
        "answered": answered,
        "total": len(sentences),
    }


# --------------------------------------------------------------------------
# Summaries
# --------------------------------------------------------------------------

def parse_summary(path: Path) -> dict | None:
    lines = read_text(path).splitlines()
    m = DAY_NAME_RE.match(path.name)
    if not m:
        return None
    day_n = int(m.group(1))
    date = f"{m.group(2)[:4]}-{m.group(2)[4:6]}-{m.group(2)[6:]}"
    round_n = int(m.group(3)) if m.group(3) else None

    title = ""
    source = ""
    level = ""
    practice_lines: list[str] = []
    table_rows: list[dict] = []
    corrections: list[dict] = []
    dontknow: list[dict] = []
    patterns: list[str] = []
    builds: list[str] = []
    preview: list[str] = []

    section = ""
    detail_kind = ""
    in_table = False
    correction_block: dict | None = None
    dontknow_block: dict | None = None

    for raw in lines:
        s = clean_line(raw)
        if s.startswith("# "):
            title = s[2:].strip()
            section = "title"
            continue
        if s.startswith("### "):
            if correction_block:
                corrections.append(correction_block)
            if dontknow_block:
                dontknow.append(dontknow_block)
            correction_block = None
            dontknow_block = None
            section = "detail"
            bm = re.match(r"^###\s+(\d+)\.\s*(.*)$", s)
            if not bm:
                continue
            num = int(bm.group(1))
            if detail_kind == "corrections":
                correction_block = {
                    "n": num,
                    "title": bm.group(2).strip(),
                    "original": "",
                    "mine": "",
                    "model": "",
                    "explanation": [],
                }
            elif detail_kind == "dontknow":
                dontknow_block = {
                    "n": num,
                    "title": bm.group(2).strip(),
                    "meaning": "",
                    "model": "",
                    "note": "",
                    "body": [],
                }
            continue
        if s.startswith("## "):
            if correction_block:
                corrections.append(correction_block)
            if dontknow_block:
                dontknow.append(dontknow_block)
            correction_block = None
            dontknow_block = None
            section = s[3:].strip().lower()
            in_table = section == "the sentences and my rephrases"
            if section == "corrections worth remembering":
                detail_kind = "corrections"
            elif section == "don't know - taught today":
                detail_kind = "dontknow"
            continue

        if s.startswith("Date:"):
            meta = [p.strip() for p in s[5:].split("|")]
            if len(meta) > 0:
                date = meta[0]
            if len(meta) > 1:
                source = meta[1]
            if len(meta) > 2:
                level = meta[2]
            continue

        if section == "the sentences and my rephrases":
            if not s.startswith("|"):
                in_table = False
                continue
            if re.match(r"^\|\s*[#\s]+\s*\|", s) or re.match(
                r"^\|[\s:\-|]+\|$", s
            ):
                continue
            cells = [c.strip() for c in s.strip("|").split("|")]
            if len(cells) < 6:
                continue
            table_rows.append(
                {
                    "n": _to_int(cells[0]),
                    "original": cells[1],
                    "zh": cells[2],
                    "rephrase": cells[3],
                    "corrected": cells[4],
                    "notes": cells[5],
                    "notesZh": cells[6] if len(cells) > 6 else "",
                }
            )
            continue

        if section == "today's practice" and s:
            practice_lines.append(s)
            continue
        if section == "patterns i can use today" and s.startswith("- "):
            patterns.append(s[2:].strip())
            continue
        if section == "how this builds speaking" and s:
            builds.append(s)
            continue
        if section == "tomorrow's preview" and s:
            preview.append(s)
            continue

        if section in ("corrections worth remembering", "don't know - taught today"):
            if correction_block is not None:
                if s.startswith("Original:"):
                    correction_block["original"] = s[9:].strip()
                elif s.startswith("My version:") or s.startswith("My rephrase:"):
                    correction_block["mine"] = s[s.index(":") + 1 :].strip()
                elif s.startswith("Model:"):
                    correction_block["model"] = s[6:].strip()
                elif s:
                    correction_block["explanation"].append(s)
            elif dontknow_block is not None:
                if s.startswith("Meaning:"):
                    dontknow_block["meaning"] = s[8:].strip()
                elif s.startswith("Model:"):
                    dontknow_block["model"] = s[6:].strip()
                elif s.startswith("Note:"):
                    dontknow_block["note"] = s[5:].strip()
                elif s:
                    dontknow_block["body"].append(s)

    if correction_block:
        corrections.append(correction_block)
    if dontknow_block:
        dontknow.append(dontknow_block)

    for c in corrections:
        c["explanation"] = join_paragraph(c["explanation"])
    for d in dontknow:
        d["body"] = join_paragraph(d["body"])

    return {
        "n": day_n,
        "date": date,
        "round": round_n,
        "file": path.name,
        "title": title,
        "source": source,
        "level": level,
        "practice": join_paragraph(practice_lines),
        "rows": table_rows,
        "corrections": corrections,
        "dontknow": dontknow,
        "patterns": patterns,
        "builds": join_paragraph(builds),
        "preview": join_paragraph(preview),
    }


def _to_int(v: str) -> int | None:
    try:
        return int(v)
    except ValueError:
        return None


# --------------------------------------------------------------------------
# Progress
# --------------------------------------------------------------------------

def parse_progress(path: Path) -> dict:
    lines = read_text(path).splitlines()
    overview: list[dict] = []
    days: list[dict] = []
    current: dict | None = None
    in_overview = False
    in_day_table = False

    for raw in lines:
        s = clean_line(raw)
        if s.startswith("## "):
            current = None
            in_day_table = False
            heading = s[3:].strip()
            if heading.lower() == "overview":
                in_overview = True
                continue
            in_overview = False
            dm = re.match(
                r"^Day\s+(\d+)\s+\((\d{4}-\d{2}-\d{2})"
                r"(?:,\s*round\s*(\d+))?\)\s*[-:]\s*(.*)$",
                heading,
            )
            if not dm:
                dm = re.match(r"^Day\s+(\d+).*?(\d{4}-\d{2}-\d{2}).*$", heading)
            if dm:
                current = {
                    "day": int(dm.group(1)),
                    "date": dm.group(2),
                    "round": int(dm.group(3)) if dm.group(3) else None,
                    "source": dm.group(4).strip() if len(dm.groups()) > 3 else "",
                    "level": "",
                    "focus": "",
                    "verdicts": [],
                    "repeated": "",
                    "next": "",
                }
                days.append(current)
            continue
        if in_overview:
            if not s.startswith("|"):
                continue
            if re.match(r"^\|[\s:\-|]+\|$", s) or s.startswith("| Day |"):
                continue
            cells = [c.strip() for c in s.strip("|").split("|")]
            if len(cells) < 5:
                continue
            overview.append(
                {
                    "day": _to_int(cells[0]),
                    "date": cells[1],
                    "level": cells[2],
                    "fixes": cells[3],
                    "passed": _to_int(cells[4]),
                    "focus": cells[5] if len(cells) > 5 else "",
                }
            )
            continue
        if current is None:
            continue
        if s.startswith("Level:"):
            current["level"] = s[6:].strip()
            continue
        if s.startswith("Focus:"):
            current["focus"] = s[6:].strip()
            continue
        if s.lower().startswith("repeated errors:"):
            current["repeated"] = s[16:].strip()
            continue
        if s.lower().startswith("next day:"):
            current["next"] = s[9:].strip()
            continue
        if s.startswith("|"):
            if re.match(r"^\|[\s:\-|]+\|$", s) or s.startswith("| # |"):
                in_day_table = True
                continue
            if in_day_table:
                cells = [c.strip() for c in s.strip("|").split("|")]
                if len(cells) < 4:
                    continue
                current["verdicts"].append(
                    {
                        "n": _to_int(cells[0]),
                        "pattern": cells[1],
                        "verdict": cells[2],
                        "note": cells[3] if len(cells) > 3 else "",
                    }
                )
            continue

    return {"overview": overview, "days": days}


# --------------------------------------------------------------------------
# Course assembly
# --------------------------------------------------------------------------

@dataclass
class Course:
    name: str
    corpus_files: list[Path] = field(default_factory=list)
    day_files: list[Path] = field(default_factory=list)
    summary_files: list[Path] = field(default_factory=list)
    progress_file: Path | None = None


def discover_courses() -> list[Course]:
    names = sorted(
        {
            *(p.name for p in (ROOT / "corpus").iterdir() if p.is_dir()),
            *(p.name for p in (ROOT / "days").iterdir() if p.is_dir()),
            *(p.name for p in (ROOT / "summaries").iterdir() if p.is_dir()),
        }
    )
    courses = []
    for name in names:
        c = Course(name)
        corpus_dir = ROOT / "corpus" / name
        if corpus_dir.exists():
            c.corpus_files = sorted(
                p for p in corpus_dir.iterdir() if p.suffix == ".txt"
            )
        days_dir = ROOT / "days" / name
        if days_dir.exists():
            c.day_files = sorted(
                (p for p in days_dir.iterdir() if DAY_NAME_RE.match(p.name)),
                key=lambda p: (int(DAY_NAME_RE.match(p.name).group(1)), p.name),
            )
        summaries_dir = ROOT / "summaries" / name
        if summaries_dir.exists():
            c.summary_files = sorted(
                (p for p in summaries_dir.iterdir() if DAY_NAME_RE.match(p.name)),
                key=lambda p: (int(DAY_NAME_RE.match(p.name).group(1)), p.name),
            )
        progress_file = ROOT / "progress" / f"{name}.md"
        if progress_file.exists():
            c.progress_file = progress_file
        courses.append(c)
    return courses


def build_course(course: Course) -> dict:
    corpus = None
    if course.corpus_files:
        corpus = parse_corpus(course.corpus_files[0])
        if len(course.corpus_files) > 1:
            corpus["extraFiles"] = [p.name for p in course.corpus_files[1:]]

    days = []
    for p in course.day_files:
        parsed = parse_day(p)
        if parsed:
            days.append(parsed)

    summaries = []
    for p in course.summary_files:
        parsed = parse_summary(p)
        if parsed:
            summaries.append(parsed)

    progress = parse_progress(course.progress_file) if course.progress_file else {}

    return {
        "name": course.name,
        "slug": slugify(course.name),
        "corpus": corpus,
        "days": days,
        "summaries": summaries,
        "progress": progress,
    }


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    courses = discover_courses()
    if not courses:
        print("No courses found in the workspace.")
        return 1

    index = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "courses": [],
    }
    for course in courses:
        data = build_course(course)
        out = DATA_DIR / f"{data['slug']}.json"
        out.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        index["courses"].append(
            {
                "name": data["name"],
                "slug": data["slug"],
                "days": len(data["days"]),
                "summaries": len(data["summaries"]),
                "corpusLines": data["corpus"]["count"] if data["corpus"] else 0,
                "sourceFiles": len(course.corpus_files),
            }
        )
        print(
            f"{data['name']}: {len(data['days'])} days, "
            f"{len(data['summaries'])} summaries, "
            f"{data['corpus']['count'] if data['corpus'] else 0} corpus lines"
        )

    (DATA_DIR / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {len(index['courses'])} course file(s) to {DATA_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
