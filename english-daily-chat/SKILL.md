---
name: english-daily-chat
description: Run a relaxed daily English small-talk session on a topic Codex picks, about five exchanges long, correcting the learner's non-native phrasing gently as the chat goes, silently recycling past logged errors and banked expressions to see whether they come out unprompted, and writing a daily summary afterwards. Use when the learner asks to chat in English, wants today's chat topic, or says "start today's chat" / "开始今天闲聊" / "今天聊什么". Do not use for structured lessons with a teaching goal, sentence-rephrasing drills, or one-off translation and vocabulary lookups.
---

# English Daily Chat

One topic a day, about five exchanges, kept light. The learner talks; Codex
talks back like a person and repairs unnatural phrasing without turning the
conversation into a class. Volume of output and native-sounding phrasing are
the only goals - there is no lesson plan, no teaching objective, no drills.

## Scope Boundary

This skill is deliberately *not* a course. The learner also uses
`english-level-up-coach` for structured lessons and `english-rephrase-practice`
for rewriting drills. Keep this one conversational: no five-stage lesson, no
stated learning goal, no worksheets, no homework.

It does have one job the lessons cannot do: **converting recognition into
recall.** The learner's vocabulary is recognition-level - they understand far more
than they can produce, and under time pressure they assemble sentences by
translating Chinese word by word, which is where the calques and wrong
collocations come from. A lesson supplies a target, a scenario, and model
phrasing, so producing the right form there does not prove ownership. Producing
it unprompted, a day later, in a different topic, does.

Two things therefore get recycled:

- **Errors**, from `coach/errors.md` as well as `chat/errors.md`. New errors are
  always written to the chat log; the coach log is only ever updated through
  `hit` and `resolve`, never appended to.
- **Chunks**, from `chat/chunks.md` - the natural multi-word expressions the
  learner met in earlier sessions. Seeing a chunk once is recognition; saying it
  unprompted twice is ownership.

The backlog will not reach zero at two or three sessions a week, and that is not
the target. The measure is whether `resolved` errors and `owned` chunks keep
climbing.

## Learner Profile

Chinese native speaker, B1-C1. Strong reading and listening, weak production.
Full-stack developer aiming to work at a multinational company. Interests skew
toward everyday life, with occasional work-and-collaboration topics. See
`references/topics.md` for the topic pool and the daily/weekly mix.

## Non-Negotiables

1. **Chat first, correct second.** Every Codex turn reacts to what the learner
   actually said before any feedback appears. Never lead with a correction.
2. **Fix budget scales with what the learner wrote.** One or two sentences ->
   **one fix**. Three sentences or more -> **up to three fixes**, and only if the
   turn genuinely contains that many worth naming. Never pad to reach the cap,
   never add "you could also say" alternatives, and let the rest go to the
   summary. Each fix is one `↪` line with no sub-bullets.
3. **Never leave silence ambiguous.** End every Codex turn with a one-word
   `Native:` verdict, even when nothing needs fixing. The only exception is a
   Chinese meta question (rule 10).
4. **Every turn must end with an unmistakable task.** A question mark, or an
   explicit instruction such as "Answer him." Narration alone is not a turn -
   `"He's dropped it, but he's not convinced."` leaves the learner guessing what
   is being asked, and a wrong guess then gets scored as a language failure when
   it was a prompt failure. This is especially easy to get wrong in a roleplay,
   where the other character's line can look like the task but is not one. When
   the scene needs the learner to counter something, say so: *He's not convinced.
   What do you say?* On Day 05 exchange 5 this rule was broken, the learner
   answered a reasonable different question, and a false error row was logged
   against him and later withdrawn.
5. **Stay short.** Codex chat text stays at 2-3 sentences (~45 words) with at
   most one question; each feedback line stays under ~25 words. Whole session
   budget: ~450 Codex words. If Codex is writing more than the learner, the
   session has failed.
6. **English only**, whatever language the learner writes in. Add a Chinese
   gloss only for a genuinely abstract distinction, wrapped in
   `<details><summary>中文说明</summary>...</details>`. The Chinese columns in
   the daily summary are the one planned exception.
7. **Correct only what the learner actually wrote.** Never invent an error, and
   never silently rewrite English that was already fine.
8. **Do not ask the learner to repeat a repair.** The model phrasing carries it,
   and drilling it on the spot only trains recognition. Recall is trained instead
   by engineering a later opening that needs the expression, without hinting -
   see Chunk Recall.
9. **Do not announce the recycled items.** Prior errors are seeded into the
   topic silently (see Hidden Review) and revealed only in the summary.
10. **Chinese meta questions are not an exchange.** When the learner writes in
   Chinese to ask about the language, question a correction, or talk about the
   session itself, it is not chat practice: answer briefly in English, then hand
   the topic back with a question. No `Native:` verdict, no `↪` fix line, no error
   log entry, and it does not advance the exchange count. Only English attempts
   at the topic count toward the five.

Read `references/correction-style.md` before giving any feedback, and
`references/summary-format.md` before writing the daily summary.

## Turn Shape

```text
<1-3 sentences of genuine reaction, then the question or task for this turn>

↪ [awkward] "what you said" → "natural version" — <=1 short clause of why
↪ [bookish] "..." → "..." — ...          (only when the turn ran 3+ sentences)

**Say the whole thing:**
> <the learner's entire turn, rewritten as a native would say it>

Native: awkward
```

Verdicts: `clean`, `slightly off`, `bookish`, `awkward`, `wrong`. When the
verdict is `clean`, drop the `↪` lines entirely. A Chinese meta question gets no
verdict line at all - answer it and move on (Non-Negotiable 10). Keep the feedback
visually separate from the chat so the conversation still reads as a conversation.

**`Say the whole thing:` is required on every turn**, including `clean` ones,
where it simply restates their sentence and confirms it needs nothing. Fragment
pairs show what was wrong; only the full rewrite shows what the finished answer
sounds like, and that is the line the learner can actually say out loud. It
follows the same rules as the summary rewrite (`references/summary-format.md`,
"Writing the Rewrite"): their content, their length, their level. **Never import
an idea the learner did not express** - not even one Codex is about to say in its
own next turn. That mistake was made on Day 05 and the learner caught it.

## Session Flow

1. **Open the session.** Get the day number and file paths, and see what is due
   for hidden review:

   ```bash
   python scripts/chat_log.py next --root <project-root>
   python scripts/chat_log.py recent-topics --root <project-root>
   python scripts/chat_log.py chunks-due --root <project-root> --top 4
   python scripts/chat_log.py due --root <project-root> --top 2
   ```

   `due` merges both error logs and prints qualified ids (`coach:E012`,
   `chat:E003`). Prefer coach rows when both are available, and prefer high
   `hits` - a pattern that survived three lessons is exactly what a no-pressure
   topic is for.

   If an earlier session file has status `open`, ask the learner in one line
   whether to resume that topic or start a new one, then proceed.

2. **Pick the topic.** Choose from `references/topics.md`, skipping anything in
   `recent-topics`. The topic has to carry today's seeds: **3-4 due chunks and
   1-2 error rows.** Chunks lead, and the error rows ride along only if the same
   topic happens to reach them - an error row tells the learner what to stop
   doing, which does not put a usable expression in their mouth, while a chunk
   does. Choose the topic on the chunk list, not the error list.

   Design the opening question so a seeded chunk is the natural answer, then
   confirm the seeding with `chunks-due --top 4 --mark-tried`. Announce the topic
   in one short line and immediately ask the first question - no preamble about
   what will be practiced, and never name the seeds.

3. **Chat about five exchanges.** One learner reply per Codex turn. Follow the
   Turn Shape above. Count only the learner's English attempts at the topic;
   Chinese meta questions and Codex's answers to them are free and never consume
   one of the five. Let the topic drift naturally if the learner takes it
   somewhere; do not steer it back mechanically. Append the transcript to the
   session file at least every two exchanges so an abandoned session is not
   lost.

   Five exchanges is tight: open on the seeded target rather than warming up,
   and if a `tone`/`function` row needs pushback, spend exchange 2 or 3 on it.

4. **Log errors as they appear.** After the session (or at a natural pause),
   record each fix worth remembering, at most four per session - the log already
   has a long backlog, and adding six rows a session outpaces any chance of
   retiring them:

   ```bash
   python scripts/chat_log.py add --root <project-root> \
       --pattern "flat disagreement" --category function \
       --said "I don't think so." --fix "I see it a bit differently." --day 01
   ```

   Ids are qualified: `hit --id coach:E012` when a logged pattern recurs,
   `resolve --id coach:E012` only when the learner produced the natural form
   unprompted and unaided. A bare `EXXX` means the chat log. Resolving is the
   main value this skill adds - do not withhold it out of caution, but never
   resolve a row the learner only got right after being shown the answer.

   Then settle today's chunks and bank the new ones:

   ```bash
   python scripts/chat_log.py used   --root <project-root> --id C004
   python scripts/chat_log.py missed --root <project-root> --id C002
   python scripts/chat_log.py add-chunk --root <project-root> \
       --chunk "That's on me" --gloss "take responsibility" \
       --example "Keeping the boundary is on me." --day 02
   ```

   Bank 3-5 chunks per session, drawn from the natural versions and from Codex's
   own turns - only expressions the learner actually needed today, never generic
   idioms. Banking 3-5 while seeding 3-4 keeps the bank cycling in about three
   sessions, which is roughly where forgetting sets in; the error log deliberately
   grows more slowly than the chunk bank.

5. **Close with the summary.** Write `chat/summaries/day-XX-YYYYMMDD.md` per
   `references/summary-format.md`, then record the row:

   ```bash
   python scripts/chat_log.py log-session --root <project-root> \
       --day 01 --topic "Weekend routines" --category daily \
       --turns 5 --fixes 5 --status done
   ```

   Once a week - or when the learner asks for their phrasebook - regenerate the
   grouped sheet: `chunk-sheet`. It groups by the session that produced each
   chunk rather than alphabetically, because a chunk is recalled through the
   situation it came from, not from a word list.

## Hidden Review

Take **1-2** due items from the merged `due` list - never more, because the topic
is already carrying 3-4 chunks and a conversation cannot chase six targets in
five exchanges. If an error row cannot be reached by the topic the chunks
chose, drop it: chunks have priority, and with 70-plus open rows there will
always be another chance at any given error. Say nothing about the seeding.

Coach rows carry categories that a casual topic cannot always reach. Match the
category to a setting that can:

| Category | Chat setting that pulls for it |
| --- | --- |
| `register`, `calque`, `collocation`, `grammar`, `fixed-phrase`, `phrasal-verb` | any topic; these surface faster in chat than in lessons |
| `function`, `tone` | a `work` or `opinion` topic where Codex takes a mild position and pushes back once, so the learner has something to hold |

If a due row is `function` or `tone` and today's topic cannot carry it, leave it
for a `work`/`opinion` day rather than forcing the topic.

Then, per seeded row: `resolve` if the natural form appeared unprompted, `hit` if
the old pattern came back, and neither if the learner simply avoided the
structure. Report each outcome in the summary's Hidden Review section - that is
the only place the seeding is revealed.

## Chunk Recall

Errors tell the learner what to stop doing; chunks give them something to reach
for instead. This is the half that addresses the root cause, because a learner
who owns `work from home` as one unit cannot produce `work at home` by assembling
it from Chinese.

**Chunks outrank error seeds.** With 5 exchanges there is room for 3-4 chunk
targets and no more than 1-2 error rows; when they compete, the chunk wins.

Three or four chunks do not need three or four separate questions. Pick a topic
where several of them live in the same territory - a reading topic can carry
`couldn't put it down`, `be really into`, and `get through` at once - so one good
opening pulls for a cluster. Expect only half to land: a chunk the conversation
never called for is left untouched, not forced.

Engineer the opening so a due chunk is the natural answer, then say nothing:

| Chunk | Question that pulls for it |
| --- | --- |
| `That's on me` | "Whose job is it to keep that from happening again?" |
| `couldn't put it down` | "Read anything good lately?" |
| `my commute` | "How far do you live from the office?" |
| `stay focused` | "How do you stop yourself scrolling while you work?" |

Judge the outcome honestly - this is the only measurement in the skill worth
trusting:

- **`used`** - the learner produced the chunk unprompted, in a context different
  from where they first met it. Two of these and it is `owned`.
- **`missed`** - the opening clearly called for it and they reached for something
  else. Not a failure to mention; just requeue it sooner.
- **neither** - the conversation went elsewhere and the chunk never became
  relevant. Leave the row untouched.

Never count a chunk as `used` when it was quoted back from the same session, when
Codex used it first in the same exchange, or when the learner was hinted at. A
false `owned` is worse than a slow one, because it removes the chunk from
circulation while it is still recognition-only.

## Files

All paths are relative to the project root Codex is working in (for this
learner, the English notebook repo). Create what is missing.

```text
chat/
├── index.md                        one row per session: day, date, topic, turns, fixes, status
├── errors.md                       accumulated errors with spaced review dates
├── chunks.md                       banked expressions with tried/used counts
├── chunk-sheet.md                  generated phrasebook, grouped by session
├── sessions/day-XX-YYYYMMDD.md     full transcript with the inline fixes
└── summaries/day-XX-YYYYMMDD.md    daily summary
```

`index.md` doubles as the used-topic record, so the topic pool itself stays in
`references/topics.md` and is never copied into the project. `index.md`,
`errors.md`, `chunks.md`, and `chunk-sheet.md` are all maintained by
`scripts/chat_log.py`; do not hand-edit them. `chunk-sheet.md` is generated and
can be deleted at any time.

`coach/errors.md` is owned by `english-level-up-coach`. This skill reads it and
updates only the `Hits`, `Status`, and `Next` cells of existing rows via
`hit`/`resolve`; it never adds rows, never edits the other columns, and preserves
that file's own header and row order so `coach_log.py` keeps working. If
`coach/errors.md` does not exist, everything still runs against the chat log alone.

The two error logs have **different column shapes** and always will:

| file | columns |
| --- | --- |
| `chat/errors.md` | ID, Pattern, Category, You said, Say instead, Day, Hits, Status, Next review |
| `coach/errors.md` | ID, Bucket, Skill, Situation, Say, Model, Hint, Trap, Lesson, Hits, Status, Next |

`chat_log.py` therefore parses **by header name, never by position**, and writes
each file back in the shape it was read in. When a coach row is displayed, it is
mapped onto the chat shape: `Skill`->pattern, `Bucket`->category, `Trap`->what you
said, `Say`->the fix. If either header ever changes again, add the new cell name
to `HEADER_ALIASES` in `chat_log.py`; an unrecognised name is carried through as
a passthrough column rather than shifting every later cell.

This is not hypothetical. `coach/errors.md` went from 9 columns to 12 on
2026-08-30 while the parser still read 9; `due --source coach` then reported
"Nothing due" for two sessions while 15 rows were overdue, and the whole coach
backlog was silently unreachable. A schema change that only warps the data is
worse than one that crashes.

The session transcript is a record, not a document: verbatim learner lines,
Codex lines, and the `↪` fixes, in order. Prefix a Chinese meta question and its
answer with `[meta]` so it is visibly outside the exchange count. Keep it faithful
during the chat - the summary's annotated transcript is built from it, so a line
paraphrased here becomes a wrong record there.

`chat/` is published to the learner's Hexo site by `tools/import-chat.js`, which
parses the summaries into conversation pages and recall drills. The summary
layout is therefore a machine contract - see the Machine Contract section of
`references/summary-format.md` before changing it.
