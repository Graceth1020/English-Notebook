#!/usr/bin/env python3
"""Check a lesson file against the coach's verbosity budget.

A lesson the learner needs hours to read has failed even when the teaching is
sound. Run this before closing a lesson.

Usage:
  python check_budget.py coach/lessons/week-01/lesson-03-20260826.md
"""
from __future__ import annotations

import re
import sys

# Two turns, one learner reply each, no retries. A third turn is added only when
# the learner asks, which raises the word cap; pass --turns-allowed 3 in that case.
CAPS = {
    "coach_words": 900,
    "turns": 2,
    "fixes_per_reply": 3,
    "retries": 0,
}
EXTRA_TURN_WORDS = 250


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    path = sys.argv[1]
    turns_allowed = CAPS["turns"]
    if "--turns-allowed" in sys.argv:
        turns_allowed = int(sys.argv[sys.argv.index("--turns-allowed") + 1])
    word_cap = CAPS["coach_words"] + EXTRA_TURN_WORDS * max(0, turns_allowed - CAPS["turns"])
    try:
        text = open(path, encoding="utf-8").read()
    except OSError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1

    if re.search(r"^format:\s*legacy-v1\s*$", text, re.M):
        print(f"{path}\n  [SKIP] format: legacy-v1 - graded before the current caps; not re-scored.")
        return 0

    dlg = text[text.index("## Dialogue"):] if "## Dialogue" in text else text
    learner = re.findall(r'\*\*You[^:]*:\*\*\s*"(.*?)"', dlg, re.S)
    learner_words = sum(len(x.split()) for x in learner)
    total_words = len(dlg.split())
    coach_words = total_words - learner_words
    # per-turn load and the coach:learner ratio are about the turns themselves; the recap is
    # coach-only by design, so folding it in would penalise every lesson equally
    turns_text = dlg.split("## Consolidation")[0]
    turn_coach_words = len(turns_text.split()) - learner_words
    turns = len(re.findall(r"^### Turn", dlg, re.M))
    turns_only = dlg.split("## Consolidation")[0]
    fixes = len([l for l in re.findall(r"^- .*$", turns_only, re.M) if "->" in l])
    attempts = len(learner)

    ok = True
    def check(label, value, cap, over_msg):
        nonlocal ok
        flag = "OK  " if value <= cap else "OVER"
        if value > cap:
            ok = False
        print(f"  [{flag}] {label}: {value} (cap {cap})" + ("" if value <= cap else f"  <- {over_msg}"))

    print(f"{path}")
    check("coach words", coach_words, word_cap, "cut optional upgrades, P3 polish, extra models")
    check("turns", turns, turns_allowed, "learner did not ask for an extra turn")
    if turns:
        per_turn = round(turn_coach_words / turns)
        check("coach words per turn", per_turn, 300, "shorten corrections")
        retries = max(0, attempts - turns)
        check("retries (extra replies)", retries, CAPS["retries"],
              "one reply per turn; correct and move on")
    if attempts:
        check("fixes per reply (avg)", round(fixes / attempts), CAPS["fixes_per_reply"], "keep only the transferable ones")

    # every learner reply needs a complete model sentence
    blocks = re.split(r"\*\*You[^:]*:\*\*", dlg)[1:]
    missing = sum(1 for b in blocks if "**Model" not in re.split(r"^### Turn|^## ", b, flags=re.M)[0])
    flag = "OK  " if missing == 0 else "FAIL"
    if missing:
        ok = False
    print(f"  [{flag}] replies without a Model sentence: {missing} (must be 0)")

    # every learner reply needs a Native: calibration verdict - silence is ambiguous
    missing_native = sum(1 for b in blocks if "**Native" not in re.split(r"^### Turn|^## ", b, flags=re.M)[0])
    flag = "OK  " if missing_native == 0 else "FAIL"
    if missing_native:
        ok = False
    print(f"  [{flag}] replies without a Native verdict: {missing_native} (must be 0)")

    # [bookish] cannot be judged without a channel on the turn heading
    headings = re.findall(r"^### Turn.*$", dlg, re.M)
    no_channel = [h for h in headings if "[channel:" not in h]
    flag = "OK  " if not no_channel else "FAIL"
    if no_channel:
        ok = False
    print(f"  [{flag}] turns missing [channel: ...]: {len(no_channel)} (must be 0)")

    # every fix must name its tier, so a change is never ambiguous
    fix_lines = [l for l in re.findall(r"^- .*$", dlg, re.M) if "->" in l]
    untagged = [l for l in fix_lines if not re.search(r"\[(wrong|bookish|awkward|optional)\b", l)]
    flag = "OK  " if not untagged else "FAIL"
    if untagged:
        ok = False
    print(f"  [{flag}] fixes missing a [wrong|bookish|awkward|optional] tag: {len(untagged)} (must be 0)")

    # [optional] means correct English - it must never be folded into the model
    opt = len(re.findall(r"\[optional\b", dlg))
    flag = "OK  " if opt <= 1 else "OVER"
    if opt > 1:
        ok = False
    print(f"  [{flag}] [optional] notes: {opt} (cap 1 per lesson)")

    # a model is a repair, not a rewrite: it must keep most of the learner's wording
    def toks(s):
        return re.findall(r"[a-z']+", s.lower())
    pairs = []
    for b in blocks:
        head = re.split(r"^### Turn|^## ", b, flags=re.M)[0]
        m = re.search(r"\*\*Model[^:]*:\*\*\s*\"?(.*?)\"?\s*(?:\n\s*\n|\*\*)", head, re.S)
        reply = re.match(r'\s*\"?(.*?)\"?\s*(?:\n\s*\n|\*\*)', head, re.S)
        if m and reply:
            pairs.append((toks(reply.group(1)), toks(m.group(1))))
    rewrites = []
    for lt, mt in pairs:
        if not lt:
            continue
        from collections import Counter
        keep = sum((Counter(lt) & Counter(mt)).values())
        pct = keep / len(lt)
        if pct < 0.60:
            rewrites.append(round(pct * 100))
    rebuilt = len(re.findall(r"\*\*Model \(rebuilt[^)]*\)", dlg))
    if rebuilt and rewrites:
        # one rebuild is allowed when most of the reply's own wording was the error;
        # it must be labelled "Model (rebuilt: <reason>)" so the learner sees it is not a repair
        rewrites = rewrites[min(rebuilt, len(rewrites)):]
    flag = "OK  " if not rewrites else "FAIL"
    if rewrites:
        ok = False
    print(f"  [{flag}] models that rewrite instead of repair: {len(rewrites)} "
          f"{'(kept ' + '%, '.join(map(str, rewrites)) + '%)' if rewrites else ''} (must keep >=60% of learner words)")

    # elliptical replacements teach nothing
    ellipsis = len(re.findall(r"->\s*`?[^`\n]{0,40}\.\.\.", dlg))
    flag = "OK  " if ellipsis == 0 else "FAIL"
    if ellipsis:
        ok = False
    print(f"  [{flag}] elliptical '-> ...' replacements: {ellipsis} (must be 0)")

    # Each turn carries fixed coach overhead (prompt + fixes + model + native verdict) that does
    # not shrink when turns are cut, while the learner's volume does. So the ratio cap scales with
    # turn count: 4:1 at three turns, 5:1 at two. Tightening it further would only delete
    # corrections, which is the opposite of the intent.
    ratio_cap = 5 if turns <= 2 else 4
    ratio = turn_coach_words / max(learner_words, 1)
    print(f"  [{'OK  ' if ratio <= ratio_cap + 0.05 else 'OVER'}] coach:learner word ratio: "
          f"{ratio:.1f}:1 (aim <= {ratio_cap}:1 at {turns} turns)")
    if ratio > ratio_cap + 0.05:
        ok = False

    print(f"\n  learner words: {learner_words} across {attempts} reply/replies")
    print("\n" + ("Within budget." if ok else "Over budget - trim before delivering."))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())




