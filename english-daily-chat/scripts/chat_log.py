#!/usr/bin/env python3
"""Maintain the daily-chat records under chat/, and recycle errors and chunks.

Three tables are in play. Errors record what went wrong; chunks record the
natural multi-word expressions the learner should own. Both are recycled into
later sessions, because reading a chunk once is recognition, while producing it
unprompted a day later is recall - and recall is the whole point.

Two error logs, with DIFFERENT column shapes:
  chat/errors.md   9 cols  | ID | Pattern | Category | You said | Say instead |
                             Day | Hits | Status | Next review |
  coach/errors.md  12 cols | ID | Bucket | Skill | Situation | Say | Model |
                             Hint | Trap | Lesson | Hits | Status | Next |

Rows are parsed by HEADER NAME, never by position, and each file is written
back in the shape it was read in. If you change either header, add the new cell
name to HEADER_ALIASES; an unknown name is kept as a passthrough column so the
row still round-trips instead of being silently shifted.

Both are markdown tables with `E\\d+` ids, so ids are addressed with a
qualified form: `chat:E003` / `coach:E012`. A bare `E003` means chat.
`due` merges both logs, because the point of chat is to retire the coach
backlog in a low-pressure setting. New chat errors are only ever added to
chat/errors.md; the coach log is touched only by hit/resolve.

And one chunk bank, chat/chunks.md, holding the "worth stealing" expressions
with their own review schedule and an owned/tried counter.

Errors and chunks resurface on a spaced schedule (3, 7, 16, 30 days). An error
is resolved only when the learner produces the natural form unprompted; a chunk
is owned only after two unprompted uses in a new context.

Usage:
  chat_log.py next                            # next day number + file paths
  chat_log.py recent-topics [--last 14]       # topics to avoid today
  chat_log.py due [--top 2] [--source both|chat|coach]
  chat_log.py add --pattern "flat disagreement" --category function \
      --said "I don't think so." --fix "I see it a bit differently." --day 01
  chat_log.py hit --id coach:E012             # pattern recurred
  chat_log.py resolve --id coach:E012         # produced correctly, unprompted
  chat_log.py list [--status open] [--source both|chat|coach]

  chat_log.py add-chunk --chunk "That's on me" --gloss "take responsibility" \
      --example "Keeping the boundary is on me." --day 02
  chat_log.py chunks-due [--top 4]            # chunks to seed today
  chat_log.py used --id C004                  # produced unprompted (2 -> owned)
  chat_log.py missed --id C004                # needed it, did not reach for it
  chat_log.py chunks [--status open|owned]
  chat_log.py chunk-sheet [--out PATH]        # grouped personal phrasebook

  chat_log.py log-session --day 01 --topic "Weekend routines" \
      --category daily --turns 5 --fixes 5 --status done

All subcommands take --root (project root, default: cwd).
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys

CATEGORIES = (
    "calque", "collocation", "register", "function", "phrasal-verb",
    "fixed-phrase", "grammar", "preposition", "tone", "other",
)
TOPIC_CATEGORIES = ("daily", "work", "opinion", "hypothetical", "culture")
STATUSES = ("open", "done")
INTERVALS = [3, 7, 16, 30]

ERR_ROW_RE = re.compile(r"^\|\s*(E\d+)\s*\|")

# The two error logs no longer share a shape. chat/errors.md is the original
# 9-column table; coach/errors.md was rebuilt as 12 drillable-card columns.
# Rows are therefore mapped by HEADER NAME, not by position, and each file is
# written back in exactly the shape it was read in.
ERR_FIELDS = ["id", "pattern", "category", "said", "fix", "origin", "hits", "status", "next"]
COACH_FIELDS = ["id", "bucket", "skill", "situation", "say", "model", "hint",
                "trap", "origin", "hits", "status", "next"]

# header cell (lowercased) -> canonical key
HEADER_ALIASES = {
    "id": "id", "pattern": "pattern", "category": "category",
    "you said": "said", "say instead": "fix",
    "day": "origin", "lesson": "origin",
    "hits": "hits", "status": "status",
    "next": "next", "next review": "next",
    "bucket": "bucket", "skill": "skill", "situation": "situation",
    "say": "say", "model": "model", "hint": "hint", "trap": "trap",
}

# Filled in by read_errors so write_errors can round-trip the same columns.
_SCHEMA: dict[str, dict] = {}

# The two logs differ only in the label of the origin column. Keep each file's
# own header so english-level-up-coach/scripts/coach_log.py can still parse it.
LOGS = {
    "chat": {
        "path": ("chat", "errors.md"),
        "origin": "Day",
        "preamble": [
            "# Chat Error Log",
            "",
            "Phrasings the learner actually produced in daily chat, with the natural",
            "version and a spaced review date. `Hits` counts how many times the pattern",
            "recurred. Rows are resolved only after the natural form appears unprompted.",
            "Maintained by scripts/chat_log.py - do not hand-edit.",
        ],
    },
    "coach": {
        "path": ("coach", "errors.md"),
        "origin": "Lesson",
        "preamble": [
            "# Error Log",
            "",
            "Errors the learner actually produced, with the natural version and a",
            "spaced review date. `Hits` counts how many times the pattern recurred.",
            "Rows are resolved only after the correct form appears unprompted.",
        ],
    },
}

IDX_HEADER = "| Day | Date | Topic | Category | Exchanges | Fixes | Status | Summary |"
IDX_SEP = "| --- | --- | --- | --- | --- | --- | --- | --- |"
IDX_ROW_RE = re.compile(r"^\|\s*(\d+)\s*\|")
IDX_FIELDS = ["day", "date", "topic", "category", "turns", "fixes", "status", "summary"]
IDX_PREAMBLE = [
    "# Daily Chat Index",
    "",
    "One row per chat session, newest last. Also serves as the used-topic",
    "record, so today's topic can avoid recent repeats.",
    "Maintained by scripts/chat_log.py - do not hand-edit.",
]


CHUNK_HEADER = ("| ID | Chunk | Means | Example | Day | Tried | Used | "
                "Status | Next review |")
CHUNK_SEP = "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
CHUNK_ROW_RE = re.compile(r"^\|\s*(C\d+)\s*\|")
CHUNK_FIELDS = ["id", "chunk", "gloss", "example", "day", "tried", "used",
                "status", "next"]
CHUNK_PREAMBLE = [
    "# Chunk Bank",
    "",
    "Natural multi-word expressions worth owning, taken from the learner's own",
    "chat sessions. `Tried` counts how many times a chunk was seeded into a topic;",
    "`Used` counts unprompted productions in a new context. A chunk becomes",
    "`owned` at two unprompted uses - reading it once is recognition, producing it",
    "a day later is recall.",
    "Maintained by scripts/chat_log.py - do not hand-edit.",
]
OWNED_AT = 2


def chunks_path(root: str) -> str:
    return os.path.join(root, "chat", "chunks.md")


def log_path(root: str, which: str) -> str:
    return os.path.join(root, *LOGS[which]["path"])


def err_header(which: str) -> str:
    """Default header, used only when a log file does not exist yet."""
    if which == "coach":
        return ("| ID | Bucket | Skill | Situation | Say | Model | Hint | Trap "
                "| Lesson | Hits | Status | Next |")
    return ("| ID | Pattern | Category | You said | Say instead | "
            f"{LOGS[which]['origin']} | Hits | Status | Next review |")


def err_fields(which: str) -> list[str]:
    return COACH_FIELDS if which == "coach" else ERR_FIELDS


def err_sep(header: str) -> str:
    n = len([c for c in header.strip().strip("|").split("|")])
    return "| " + " | ".join(["---"] * n) + " |"


ERR_SEP = "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"


def view(which: str, r: dict) -> dict:
    """One shape for display, whichever log the row came from.

    coach columns map on as: skill=the ability, bucket=the drill type,
    trap=the wrong version the learner produced, model=what to say instead.
    """
    if which == "coach":
        return {
            "pattern": r.get("skill") or r.get("pattern", ""),
            "category": r.get("bucket") or r.get("category", ""),
            "said": r.get("trap") or r.get("said", ""),
            "fix": r.get("say") or r.get("model") or r.get("fix", ""),
            "model": r.get("model", ""),
            "situation": r.get("situation", ""),
        }
    return {
        "pattern": r.get("pattern", ""), "category": r.get("category", ""),
        "said": r.get("said", ""), "fix": r.get("fix", ""),
        "model": r.get("fix", ""), "situation": "",
    }


def index_path(root: str) -> str:
    return os.path.join(root, "chat", "index.md")


def esc(s: str) -> str:
    return (s or "").replace("|", "\\|").replace("\n", " ").strip()


def today(s: str | None = None) -> dt.date:
    return dt.date.fromisoformat(s) if s else dt.date.today()


def parse_id(raw: str) -> tuple[str, str]:
    """"coach:E012" -> ("coach", "E012"); bare "E012" defaults to chat."""
    if ":" in raw:
        which, eid = raw.split(":", 1)
        which = which.strip().lower()
        if which not in LOGS:
            sys.exit(f"[ERROR] unknown log '{which}'; use chat: or coach:")
        return which, eid.strip().upper()
    return "chat", raw.strip().upper()


def read_table(path: str, row_re: re.Pattern, fields: list[str]):
    if not os.path.exists(path):
        return [], []
    preamble: list[str] = []
    rows: list[dict] = []
    with open(path, encoding="utf-8") as fh:
        for line in fh.read().splitlines():
            if row_re.match(line):
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cells) >= len(fields):
                    rows.append(dict(zip(fields, cells)))
                continue
            if line.strip().startswith("|"):
                continue
            preamble.append(line)
    return preamble, rows


def write_table(path, preamble, default_preamble, header, sep, rows, fields):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not preamble or not any(l.startswith("# ") for l in preamble):
        preamble = list(default_preamble)
    while preamble and not preamble[-1].strip():
        preamble.pop()
    lines = preamble + ["", header, sep]
    for r in rows:
        lines.append("| " + " | ".join(r.get(f, "") for f in fields) + " |")
    lines.append("")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def fields_from_header(line: str) -> list[str]:
    cells = [c.strip().lower() for c in line.strip().strip("|").split("|")]
    out = []
    for i, c in enumerate(cells):
        out.append(HEADER_ALIASES.get(c) or re.sub(r"\W+", "_", c) or f"col{i}")
    return out


def read_errors(root, which):
    """Parse an error log by header name and remember its exact shape."""
    path = log_path(root, which)
    default = {"header": err_header(which), "sep": None, "fields": err_fields(which)}
    default["sep"] = err_sep(default["header"])
    if not os.path.exists(path):
        _SCHEMA[which] = default
        return [], []
    preamble: list[str] = []
    rows: list[dict] = []
    header = sep = None
    fields = default["fields"]
    with open(path, encoding="utf-8") as fh:
        for line in fh.read().splitlines():
            if ERR_ROW_RE.match(line):
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cells) >= len(fields):
                    row = dict(zip(fields, cells))
                    row["_ord"] = len(rows)
                    rows.append(row)
                else:
                    print(f"[warn] {which}: skipped a row with {len(cells)} cells, "
                          f"header declares {len(fields)}", file=sys.stderr)
                continue
            if line.strip().startswith("|"):
                stripped = line.replace("|", "").replace(" ", "")
                if header is None and line.strip().lower().startswith("| id"):
                    header, fields = line, fields_from_header(line)
                elif sep is None and stripped and set(stripped) <= set("-:"):
                    sep = line
                continue
            preamble.append(line)
    _SCHEMA[which] = {
        "header": header or default["header"],
        "sep": sep or err_sep(header or default["header"]),
        "fields": fields,
    }
    return preamble, rows


def write_errors(root, which, preamble, rows):
    """Write back in the same column shape the file was read in."""
    schema = _SCHEMA.get(which)
    if schema is None:
        header = err_header(which)
        schema = {"header": header, "sep": err_sep(header), "fields": err_fields(which)}
    # Keep the file's existing row order. coach/errors.md is grouped by bucket
    # by hand, and re-sorting it by id would silently destroy that grouping and
    # make every write a large diff. Resolved rows still sink to the bottom.
    order = {"open": 0, "resolved": 1}
    rows = sorted(rows, key=lambda r: (order.get(r["status"], 0),
                                       r.get("_ord", 1 << 30)))
    write_table(log_path(root, which), preamble, LOGS[which]["preamble"],
                schema["header"], schema["sep"], rows, schema["fields"])


def read_index(root):
    return read_table(index_path(root), IDX_ROW_RE, IDX_FIELDS)


def write_index(root, preamble, rows):
    rows = sorted(rows, key=lambda r: (int(r["day"]) if r["day"].isdigit() else 0, r["date"]))
    write_table(index_path(root), preamble, IDX_PREAMBLE,
                IDX_HEADER, IDX_SEP, rows, IDX_FIELDS)


def read_chunks(root):
    return read_table(chunks_path(root), CHUNK_ROW_RE, CHUNK_FIELDS)


def write_chunks(root, preamble, rows):
    order = {"open": 0, "owned": 1}
    rows = sorted(rows, key=lambda r: (order.get(r["status"], 0), r["id"]))
    write_table(chunks_path(root), preamble, CHUNK_PREAMBLE,
                CHUNK_HEADER, CHUNK_SEP, rows, CHUNK_FIELDS)


def next_chunk_id(rows):
    n = max((int(r["id"][1:]) for r in rows if r["id"][1:].isdigit()), default=0)
    return f"C{n + 1:03d}"


def find_chunk(rows, raw):
    """Match by id (C004) or by the chunk text itself."""
    key = raw.strip().upper()
    for r in rows:
        if r["id"].upper() == key:
            return r
    low = raw.strip().strip('"').lower()
    for r in rows:
        if r["chunk"].strip().strip('"').lower() == low:
            return r
    return None


def next_error_id(rows):
    n = max((int(r["id"][1:]) for r in rows if r["id"][1:].isdigit()), default=0)
    return f"E{n + 1:03d}"


def schedule(hits: int, base: dt.date) -> str:
    return (base + dt.timedelta(days=INTERVALS[min(hits, len(INTERVALS)) - 1])).isoformat()


def sources(arg: str) -> list[str]:
    return ["chat", "coach"] if arg == "both" else [arg]


def cmd_next(a):
    _, rows = read_index(a.root)
    days = [int(r["day"]) for r in rows if r["day"].isdigit()]
    open_rows = [r for r in rows if r["status"] == "open"]
    day = (max(days) + 1) if days else 1
    date = today(a.as_of).isoformat()
    stem = f"day-{day:02d}-{date.replace('-', '')}"
    print(f"day: {day:02d}")
    print(f"date: {date}")
    print(f"session: chat/sessions/{stem}.md")
    print(f"summary: chat/summaries/{stem}.md")
    if open_rows:
        r = open_rows[-1]
        print(f"unfinished: day {r['day']} ({r['date']}) topic \"{r['topic']}\" "
              f"- ask whether to resume before starting a new topic")
    return 0


def cmd_recent_topics(a):
    _, rows = read_index(a.root)
    recent = rows[-a.last:] if a.last > 0 else rows
    if not recent:
        print("No topics used yet; any topic is fair game.")
        return 0
    print(f"Avoid these {len(recent)} recent topics:")
    for r in recent:
        print(f"  day {r['day']} [{r['category']}] {r['topic']}")
    used = {}
    for r in rows:
        used[r["category"]] = used.get(r["category"], 0) + 1
    if used:
        print("category counts (all time): "
              + ", ".join(f"{k}={v}" for k, v in sorted(used.items())))
    return 0


def cmd_add(a):
    """New chat errors always land in chat/errors.md."""
    pre, rows = read_errors(a.root, "chat")
    for r in rows:
        if r["pattern"].lower() == a.pattern.lower() and r["status"] == "open":
            print(f"[warn] pattern already logged as chat:{r['id']}; recording a hit")
            a.id = f"chat:{r['id']}"
            return cmd_hit(a)
    eid = next_error_id(rows)
    rows.append({
        "id": eid, "pattern": esc(a.pattern), "category": a.category,
        "said": esc(a.said), "fix": esc(a.fix), "origin": esc(a.day) or "-",
        "hits": "1", "status": "open", "next": schedule(1, today(a.as_of)),
    })
    write_errors(a.root, "chat", pre, rows)
    print(f"[OK] chat:{eid} added -> {log_path(a.root, 'chat')}")
    return 0


def cmd_hit(a):
    which, eid = parse_id(a.id)
    pre, rows = read_errors(a.root, which)
    for r in rows:
        if r["id"] == eid:
            hits = int(r["hits"]) + 1 if r["hits"].isdigit() else 2
            r["hits"], r["status"] = str(hits), "open"
            r["next"] = schedule(hits, today(a.as_of))
            write_errors(a.root, which, pre, rows)
            print(f"[OK] {which}:{eid} hits={hits} next={r['next']}")
            return 0
    print(f"[ERROR] no such id in {which} log: {eid}", file=sys.stderr)
    return 1


def cmd_resolve(a):
    which, eid = parse_id(a.id)
    pre, rows = read_errors(a.root, which)
    for r in rows:
        if r["id"] == eid:
            if r["status"] == "resolved":
                print(f"[warn] {which}:{eid} already resolved")
                return 0
            r["status"], r["next"] = "resolved", "-"
            write_errors(a.root, which, pre, rows)
            print(f"[OK] {which}:{eid} resolved ({view(which, r)['pattern']})")
            return 0
    print(f"[ERROR] no such id in {which} log: {eid}", file=sys.stderr)
    return 1


def cmd_due(a):
    now = today(a.as_of)
    due = []
    for which in sources(a.source):
        _, rows = read_errors(a.root, which)
        for r in rows:
            if r["status"] != "open":
                continue
            try:
                when = dt.date.fromisoformat(r["next"])
            except ValueError:
                when = now
            if when <= now:
                due.append((when, which, r))
    if not due:
        print("Nothing due; pick the topic freely.")
        return 0
    # Oldest first, then most-recurring: a pattern with 3 hits has resisted
    # three lessons and needs the low-pressure setting most.
    due.sort(key=lambda t: (t[0], -(int(t[2]["hits"]) if t[2]["hits"].isdigit() else 1)))
    n_coach = sum(1 for _, w, _ in due if w == "coach")
    print(f"{len(due)} due as of {now.isoformat()} "
          f"({n_coach} from coach) - seed these silently:")
    for when, which, r in due[: a.top]:
        v = view(which, r)
        print(f"  {which}:{r['id']} [{v['category']}] {v['pattern']} "
              f"(hits {r['hits']}, due {when})")
        if v["situation"]:
            print(f"  situation: {v['situation']}")
        print(f"       said: {v['said']}")
        print(f"        fix: {v['fix']}")
    return 0


def cmd_list(a):
    total = 0
    for which in sources(a.source):
        _, rows = read_errors(a.root, which)
        rows = [r for r in rows if a.status == "all" or r["status"] == a.status]
        if not rows:
            continue
        print(f"--- {which} ({len(rows)}) ---")
        for r in rows:
            v = view(which, r)
            print(f"{which}:{r['id']} [{r['status']}] {v['category']}: {v['pattern']} "
                  f"(hits {r['hits']}, next {r['next']})")
        total += len(rows)
    if not total:
        print("No entries.")
    return 0


def cmd_add_chunk(a):
    pre, rows = read_chunks(a.root)
    existing = find_chunk(rows, a.chunk)
    if existing:
        print(f"[warn] already banked as {existing['id']}: {existing['chunk']}")
        return 0
    cid = next_chunk_id(rows)
    rows.append({
        "id": cid, "chunk": esc(a.chunk), "gloss": esc(a.gloss),
        "example": esc(a.example), "day": esc(a.day) or "-",
        "tried": "0", "used": "0", "status": "open",
        "next": schedule(1, today(a.as_of)),
    })
    write_chunks(a.root, pre, rows)
    print(f"[OK] {cid} banked -> {chunks_path(a.root)}")
    return 0


def cmd_chunks_due(a):
    pre, rows = read_chunks(a.root)
    now = today(a.as_of)
    due = []
    for r in rows:
        if r["status"] == "owned":
            continue
        try:
            when = dt.date.fromisoformat(r["next"])
        except ValueError:
            when = now
        if when <= now:
            due.append((when, r))
    if not due:
        print("No chunks due; seed from errors only.")
        return 0
    # Oldest first, then fewest unprompted uses: the ones that never came back
    # on their own need the engineered opening most.
    due.sort(key=lambda t: (t[0], int(t[1]["used"] or 0)))
    picked = due[: a.top]
    print(f"{len(due)} chunks due as of {now.isoformat()} - build the topic so "
          f"these are the natural answer, and do not hint:")
    for when, r in picked:
        print(f"  {r['id']} \"{r['chunk']}\" = {r['gloss']} "
              f"(tried {r['tried']}, used {r['used']}/{OWNED_AT}, due {when})")
        if r["example"] and r["example"] != "-":
            print(f"       e.g. {r['example']}")
    if a.mark_tried:
        for _, r in picked:
            r["tried"] = str(int(r["tried"] or 0) + 1)
        write_chunks(a.root, pre, rows)
        print(f"[OK] marked {len(picked)} chunk(s) as tried")
    return 0


def cmd_used(a):
    """Unprompted production in a new context."""
    pre, rows = read_chunks(a.root)
    r = find_chunk(rows, a.id)
    if not r:
        print(f"[ERROR] no such chunk: {a.id}", file=sys.stderr)
        return 1
    used = int(r["used"] or 0) + 1
    r["used"] = str(used)
    if int(r["tried"] or 0) < used:
        r["tried"] = str(used)
    if used >= OWNED_AT:
        r["status"], r["next"] = "owned", "-"
        print(f"[OK] {r['id']} used={used} -> owned ({r['chunk']})")
    else:
        r["next"] = schedule(used + 1, today(a.as_of))
        print(f"[OK] {r['id']} used={used}/{OWNED_AT} next={r['next']}")
    write_chunks(a.root, pre, rows)
    return 0


def cmd_missed(a):
    """The opening called for it and the learner did not reach for it."""
    pre, rows = read_chunks(a.root)
    r = find_chunk(rows, a.id)
    if not r:
        print(f"[ERROR] no such chunk: {a.id}", file=sys.stderr)
        return 1
    tried = int(r["tried"] or 0) + 1
    r["tried"], r["status"] = str(tried), "open"
    # Missing it means the chunk is still recognition-only: come back sooner,
    # not later, so do not advance the interval past the first step.
    r["next"] = schedule(1, today(a.as_of))
    write_chunks(a.root, pre, rows)
    print(f"[OK] {r['id']} tried={tried} used={r['used']} next={r['next']}")
    return 0


def cmd_chunks(a):
    _, rows = read_chunks(a.root)
    rows = [r for r in rows if a.status == "all" or r["status"] == a.status]
    if not rows:
        print("No chunks.")
        return 0
    owned = sum(1 for r in rows if r["status"] == "owned")
    for r in rows:
        print(f"{r['id']} [{r['status']}] \"{r['chunk']}\" = {r['gloss']} "
              f"(tried {r['tried']}, used {r['used']}, next {r['next']})")
    print(f"\n{owned}/{len(rows)} owned")
    return 0


def cmd_chunk_sheet(a):
    """Group the bank by situation, not alphabetically - a phrasebook, not a list."""
    _, rows = read_chunks(a.root)
    if not rows:
        print("No chunks banked yet.")
        return 0
    out = a.out or os.path.join(a.root, "chat", "chunk-sheet.md")
    by_day = {}
    for r in rows:
        by_day.setdefault(r["day"], []).append(r)
    owned_n = sum(1 for r in rows if r["status"] == "owned")
    lines = [
        "# Personal Chunk Sheet",
        "",
        f"Generated {today(a.as_of).isoformat()} from chat/chunks.md. "
        "Grouped by the session that produced it, because a chunk is easier to "
        "recall attached to the situation it came from than from a word list.",
        "",
        f"**{owned_n} owned / {len(rows)} banked**",
        "",
        "## How to review this",
        "",
        "Reading this file is recognition, and recognition is the problem, not the",
        "cure. The only action that moves a chunk into recall:",
        "",
        "1. Pick 3 unchecked chunks. Three minutes, not thirty - spacing beats volume.",
        "2. For each one, say a sentence **out loud** about your own real life,",
        "   not the example. The example is already understood; your own sentence is not.",
        "3. Next time, put the same chunk in a different situation. Repeating",
        "   yesterday's sentence is memorisation; changing the context is recall.",
        "",
        "Do not read this file before a chat session - the seeding is meant to be",
        "silent, and previewing it invalidates the only honest measurement here.",
        "",
    ]
    for day in sorted(by_day):
        lines.append(f"## Day {day}")
        lines.append("")
        for r in sorted(by_day[day], key=lambda r: r["id"]):
            mark = "x" if r["status"] == "owned" else " "
            lines.append(f"- [{mark}] **{r['chunk']}** - {r['gloss']}")
            if r["example"] and r["example"] != "-":
                lines.append(f"  - {r['example']}")
        lines.append("")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"[OK] {len(rows)} chunks -> {out}")
    return 0


def cmd_log_session(a):
    pre, rows = read_index(a.root)
    date = today(a.as_of).isoformat()
    day = f"{int(a.day):02d}"
    stem = f"day-{day}-{date.replace('-', '')}"
    row = {
        "day": day, "date": date, "topic": esc(a.topic),
        "category": a.category, "turns": str(a.turns), "fixes": str(a.fixes),
        "status": a.status,
        "summary": f"[summary](summaries/{stem}.md)" if a.status == "done" else "-",
    }
    for i, r in enumerate(rows):
        if r["day"] == day:
            rows[i] = row
            break
    else:
        rows.append(row)
    write_index(a.root, pre, rows)
    print(f"[OK] day {day} logged -> {index_path(a.root)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(p):
        p.add_argument("--root", default=".", help="project root (default: cwd)")
        p.add_argument("--as-of", dest="as_of", help="override today's date, YYYY-MM-DD")
        return p

    p = common(sub.add_parser("next")); p.set_defaults(fn=cmd_next)

    p = common(sub.add_parser("recent-topics")); p.set_defaults(fn=cmd_recent_topics)
    p.add_argument("--last", type=int, default=14)

    p = common(sub.add_parser("add")); p.set_defaults(fn=cmd_add)
    p.add_argument("--pattern", required=True)
    p.add_argument("--category", default="other", choices=CATEGORIES)
    p.add_argument("--said", default="")
    p.add_argument("--fix", default="")
    p.add_argument("--day", default="-")

    p = common(sub.add_parser("hit")); p.set_defaults(fn=cmd_hit)
    p.add_argument("--id", required=True, help="chat:E003 / coach:E012")

    p = common(sub.add_parser("resolve")); p.set_defaults(fn=cmd_resolve)
    p.add_argument("--id", required=True, help="chat:E003 / coach:E012")

    p = common(sub.add_parser("due")); p.set_defaults(fn=cmd_due)
    p.add_argument("--top", type=int, default=2)
    p.add_argument("--source", default="both", choices=["both", "chat", "coach"])

    p = common(sub.add_parser("list")); p.set_defaults(fn=cmd_list)
    p.add_argument("--status", default="all", choices=["all", "open", "resolved"])
    p.add_argument("--source", default="both", choices=["both", "chat", "coach"])

    p = common(sub.add_parser("add-chunk")); p.set_defaults(fn=cmd_add_chunk)
    p.add_argument("--chunk", required=True, help="the expression itself")
    p.add_argument("--gloss", default="", help="what it means / when it is used")
    p.add_argument("--example", default="")
    p.add_argument("--day", default="-")

    p = common(sub.add_parser("chunks-due")); p.set_defaults(fn=cmd_chunks_due)
    p.add_argument("--top", type=int, default=4)
    p.add_argument("--mark-tried", action="store_true",
                   help="record that these were seeded into today's topic")

    p = common(sub.add_parser("used")); p.set_defaults(fn=cmd_used)
    p.add_argument("--id", required=True, help="C004 or the chunk text")

    p = common(sub.add_parser("missed")); p.set_defaults(fn=cmd_missed)
    p.add_argument("--id", required=True, help="C004 or the chunk text")

    p = common(sub.add_parser("chunks")); p.set_defaults(fn=cmd_chunks)
    p.add_argument("--status", default="all", choices=["all", "open", "owned"])

    p = common(sub.add_parser("chunk-sheet")); p.set_defaults(fn=cmd_chunk_sheet)
    p.add_argument("--out", help="default: <root>/chat/chunk-sheet.md")

    p = common(sub.add_parser("log-session")); p.set_defaults(fn=cmd_log_session)
    p.add_argument("--day", required=True)
    p.add_argument("--topic", required=True)
    p.add_argument("--category", default="daily", choices=TOPIC_CATEGORIES)
    p.add_argument("--turns", type=int, default=5)
    p.add_argument("--fixes", type=int, default=0)
    p.add_argument("--status", default="done", choices=STATUSES)

    a = ap.parse_args()
    return a.fn(a)


if __name__ == "__main__":
    raise SystemExit(main())
