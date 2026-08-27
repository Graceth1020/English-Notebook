#!/usr/bin/env python3
"""Maintain the coach error log at coach/errors.md.

The log is a markdown table so it stays readable and diffable. Errors resurface
on a spaced schedule (3, 7, 16, 30 days) and are resolved only when the learner
produces the correct form unprompted.

Usage:
  coach_log.py add --pattern "flat disagreement" --category function \
      --said "I don't think so." --fix "I see it a bit differently." --lesson 01
  coach_log.py due [--top 8] [--as-of YYYY-MM-DD]
  coach_log.py hit --id E003          # seen again (reset interval, count++)
  coach_log.py resolve --id E003
  coach_log.py list [--status open]
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys

CATEGORIES = (
    "function", "calque", "register", "collocation", "fixed-phrase",
    "phrasal-verb", "grammar", "preposition", "tone", "unknown", "other",
)
INTERVALS = [3, 7, 16, 30]
HEADER = "| ID | Pattern | Category | You said | Say instead | Lesson | Hits | Status | Next review |"
SEP = "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
ROW_RE = re.compile(r"^\|\s*(E\d+)\s*\|(.*)\|\s*$")


def log_path(root: str) -> str:
    return os.path.join(root, "coach", "errors.md")


def esc(s: str) -> str:
    return s.replace("|", "\\|").replace("\n", " ").strip()


def today(s: str | None = None) -> dt.date:
    return dt.date.fromisoformat(s) if s else dt.date.today()


def read_rows(path: str) -> tuple[list[str], list[dict]]:
    if not os.path.exists(path):
        return [], []
    preamble, rows = [], []
    with open(path, encoding="utf-8") as fh:
        for line in fh.read().splitlines():
            m = ROW_RE.match(line)
            if m:
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cells) >= 9:
                    rows.append({
                        "id": cells[0], "pattern": cells[1], "category": cells[2],
                        "said": cells[3], "fix": cells[4], "lesson": cells[5],
                        "hits": cells[6], "status": cells[7], "next": cells[8],
                    })
                continue
            if line.strip().startswith("|"):
                continue
            preamble.append(line)
    return preamble, rows


def write_rows(path: str, preamble: list[str], rows: list[dict]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not preamble or not any(l.startswith("# ") for l in preamble):
        preamble = [
            "# Error Log",
            "",
            "Errors the learner actually produced, with the natural version and a",
            "spaced review date. `Hits` counts how many times the pattern recurred.",
            "Rows are resolved only after the correct form appears unprompted.",
            "",
        ]
    while preamble and not preamble[-1].strip():
        preamble.pop()
    lines = preamble + ["", HEADER, SEP]
    order = {"open": 0, "resolved": 1}
    rows = sorted(rows, key=lambda r: (order.get(r["status"], 0), r["id"]))
    for r in rows:
        lines.append(
            f"| {r['id']} | {r['pattern']} | {r['category']} | {r['said']} | "
            f"{r['fix']} | {r['lesson']} | {r['hits']} | {r['status']} | {r['next']} |"
        )
    lines.append("")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def next_id(rows: list[dict]) -> str:
    n = max((int(r["id"][1:]) for r in rows if r["id"][1:].isdigit()), default=0)
    return f"E{n + 1:03d}"


def schedule(hits: int, base: dt.date) -> str:
    return (base + dt.timedelta(days=INTERVALS[min(hits, len(INTERVALS)) - 1])).isoformat()


def cmd_add(a, root):
    path = log_path(root)
    pre, rows = read_rows(path)
    for r in rows:
        if r["pattern"].lower() == a.pattern.lower() and r["status"] == "open":
            print(f"[warn] pattern already logged as {r['id']}; recording a hit")
            a.id = r["id"]
            return cmd_hit(a, root)
    eid = next_id(rows)
    rows.append({
        "id": eid, "pattern": esc(a.pattern), "category": a.category,
        "said": esc(a.said), "fix": esc(a.fix), "lesson": esc(a.lesson or "-"),
        "hits": "1", "status": "open", "next": schedule(1, today(a.as_of)),
    })
    write_rows(path, pre, rows)
    print(f"[OK] {eid} added -> {path}")
    return 0


def cmd_hit(a, root):
    path = log_path(root)
    pre, rows = read_rows(path)
    for r in rows:
        if r["id"] == a.id:
            hits = int(r["hits"]) + 1 if r["hits"].isdigit() else 2
            r["hits"], r["status"] = str(hits), "open"
            r["next"] = schedule(hits, today(a.as_of))
            write_rows(path, pre, rows)
            print(f"[OK] {a.id} hits={hits} next={r['next']}")
            return 0
    print(f"[ERROR] no such id: {a.id}", file=sys.stderr)
    return 1


def cmd_resolve(a, root):
    path = log_path(root)
    pre, rows = read_rows(path)
    for r in rows:
        if r["id"] == a.id:
            r["status"], r["next"] = "resolved", "-"
            write_rows(path, pre, rows)
            print(f"[OK] {a.id} resolved")
            return 0
    print(f"[ERROR] no such id: {a.id}", file=sys.stderr)
    return 1


def cmd_due(a, root):
    _, rows = read_rows(log_path(root))
    now = today(a.as_of)
    due = []
    for r in rows:
        if r["status"] != "open":
            continue
        try:
            when = dt.date.fromisoformat(r["next"])
        except ValueError:
            when = now
        if when <= now:
            due.append((when, r))
    due.sort(key=lambda t: (t[0], -int(t[1]["hits"] or 1)))
    if not due:
        print("Nothing due.")
        return 0
    print(f"{len(due)} due as of {now.isoformat()}:")
    for when, r in due[: a.top]:
        print(f"  {r['id']} [{r['category']}] {r['pattern']} (hits {r['hits']}, due {when})")
        print(f"       said: {r['said']}")
        print(f"        fix: {r['fix']}")
    return 0


def cmd_list(a, root):
    _, rows = read_rows(log_path(root))
    rows = [r for r in rows if a.status in (None, "all") or r["status"] == a.status]
    if not rows:
        print("No entries.")
        return 0
    for r in rows:
        print(f"{r['id']} [{r['status']}] {r['category']}: {r['pattern']} "
              f"(hits {r['hits']}, next {r['next']})")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=".", help="project root (default: cwd)")
    ap.add_argument("--as-of", help="override today's date, YYYY-MM-DD")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("add"); p.set_defaults(fn=cmd_add)
    p.add_argument("--pattern", required=True)
    p.add_argument("--category", default="other", choices=CATEGORIES)
    p.add_argument("--said", default="")
    p.add_argument("--fix", default="")
    p.add_argument("--lesson", default="-")

    p = sub.add_parser("hit"); p.set_defaults(fn=cmd_hit)
    p.add_argument("--id", required=True)

    p = sub.add_parser("resolve"); p.set_defaults(fn=cmd_resolve)
    p.add_argument("--id", required=True)

    p = sub.add_parser("due"); p.set_defaults(fn=cmd_due)
    p.add_argument("--top", type=int, default=8)

    p = sub.add_parser("list"); p.set_defaults(fn=cmd_list)
    p.add_argument("--status", default="all",
                   choices=["all", "open", "resolved"])

    for p in sub.choices.values():
        p.add_argument("--as-of", dest="as_of_sub",
                       help="override today's date, YYYY-MM-DD")
        p.add_argument("--root", dest="root_sub", help=argparse.SUPPRESS)

    a = ap.parse_args()
    a.as_of = getattr(a, "as_of_sub", None) or a.as_of
    a.root = getattr(a, "root_sub", None) or a.root
    return a.fn(a, a.root)


if __name__ == "__main__":
    raise SystemExit(main())

