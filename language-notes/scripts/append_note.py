#!/usr/bin/env python3
"""Append a timestamped language-notes entry to notes/<command>/<command>-YYYY-MM-DD.md."""

import argparse
import datetime
import pathlib
import re
import sys

KNOWN_COMMANDS = ("translate", "spoken", "define", "parse", "compare", "rephrase")

FIELD_RE = re.compile(r"^([^=]+)=(.*)$", re.DOTALL)


def parse_args(argv):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--command", required=True, choices=KNOWN_COMMANDS)
    parser.add_argument(
        "--field",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="repeatable; use '-' as the value to read it from stdin",
    )
    parser.add_argument("--root", default=".", help="project root (default: current directory)")
    parser.add_argument(
        "--timestamp",
        help="YYYY-MM-DD or YYYY-MM-DD HH:MM; defaults to the current local time",
    )
    parser.add_argument(
        "--course",
        help="course name for a rephrase-linked note (used with --day)",
    )
    parser.add_argument(
        "--day",
        help="day file stem such as day-02-20260810; saves to notes/rephrase/<course>/<day>.md",
    )
    return parser.parse_args(argv)


def parse_timestamp(raw):
    if not raw:
        now = datetime.datetime.now()
        return now.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d %H:%M")
    text = raw.strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            dt = datetime.datetime.strptime(text, fmt)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%Y-%m-%d %H:%M")
        except ValueError:
            continue
    raise SystemExit("error: cannot parse timestamp '{}'".format(raw))


def indent_continuation(value, indent="  "):
    lines = value.splitlines()
    if len(lines) <= 1:
        return value
    return "\n".join([lines[0]] + [indent + line for line in lines[1:]])


def field_line(key, value):
    if value == "":
        return "- {}: ".format(key)
    lines = value.splitlines()
    if lines[0].strip().startswith("- "):
        indented = "\n".join("  " + line for line in lines)
        return "- {}:\n{}".format(key, indented)
    return "- {}: {}".format(key, indent_continuation(value))


def main(argv=None):
    args = parse_args(argv)

    if not args.field:
        raise SystemExit("error: at least one --field is required")

    fields = []
    for item in args.field:
        match = FIELD_RE.match(item)
        if not match:
            raise SystemExit("error: field must be KEY=VALUE, got '{}'".format(item))
        key, value = match.group(1).strip(), match.group(2)
        if not key:
            raise SystemExit("error: empty field key in '{}'".format(item))
        if value == "-":
            value = sys.stdin.read()
        fields.append((key, value))

    if args.day and not args.course:
        raise SystemExit("error: --course is required when --day is given")
    if args.day:
        fields.insert(0, ("**Day**", args.day))
        fields.insert(0, ("**Course**", args.course))

    date_str, ts = parse_timestamp(args.timestamp)
    root = pathlib.Path(args.root)
    if args.day:
        target_dir = root / "notes" / "rephrase" / args.course
        target = target_dir / "{}.md".format(args.day)
    else:
        target_dir = root / "notes" / args.command
        target = target_dir / "{}-{}.md".format(args.command, date_str)

    entry_lines = ["## {}".format(ts)]
    for key, value in fields:
        entry_lines.append(field_line(key, value))
    entry = "\n".join(entry_lines) + "\n"

    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        if target.exists() and target.read_text(encoding="utf-8").strip():
            with target.open("a", encoding="utf-8") as fh:
                fh.write("\n" + entry)
        else:
            target.write_text(entry, encoding="utf-8")
    except OSError as exc:
        raise SystemExit("error: failed to write {}: {}".format(target, exc))

    print(target)


if __name__ == "__main__":
    main()
