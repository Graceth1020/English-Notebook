# Pattern Drills

A second track, separate from the daily five exchanges. Started only when the
learner asks for it, normally after a chat session has finished.

## What A Pattern Is, And Why It Needs Its Own Track

A **chunk** is a fixed expression - `wired`, `sold out`, `know it inside out`. A
topic can be built so that one is the only natural answer, so chunks are seeded
into daily chat and counted when they come back unprompted.

A **pattern** is a structure that changes how a whole sentence is assembled -
`with + X + doing`, `the thing is, ...`, fronted participles. Seeding cannot
reach one, and this is not a tuning problem:

- Any idea a pattern expresses can be said correctly with ordinary clauses. If
  the learner writes `since everyone was heading the same way`, that is right,
  and Non-Negotiable 7 forbids rewriting it. There is no error to log.
- So a pattern is never *wrong*, only *absent*. It produces no error rows, no
  `hits`, and nothing for the review scheduler to bite on.

`chat/errors.md` cannot hold one either: its `You said` column is mandatory and
there is no sentence to put in it. The learner produced 45 grammatical exchanges
without ever using `with + X + doing`.

Evidence this is real: `C009` / `C010` / `C012` were seeded twice each and
produced zero times, because they were being seeded like phrases when two of them
are frames.

## One Pattern Per Session

Exactly one, named at the top, never mixed. The point of a drill is depth in a
single structure, which is the opposite of the daily chat's spread.

## Choosing It

```bash
python scripts/chat_log.py pattern-next --root <project-root>
```

Never drilled beats most overdue - a pattern at 0 drills is a gap that has never
once been addressed. State the choice and the reason in one line, and let the
learner veto it and pick another.

## Material Comes From The Learner's Own Sessions

Every short sentence in a drill must be something the learner actually said, or a
close paraphrase, drawn from any previous day - not just today. Invented example
sentences make the drill feel like a textbook and, worse, remove the one thing
that makes the structure stick: recognising his own flat two-sentence version and
seeing it fold into one.

Pull from `chat/summaries/day-*.md`. The `You said` lines are the raw material.

## Three Rounds

| Round | Task | Trains |
| --- | --- | --- |
| 1 | Join two given short sentences with the pattern. 3-4 items. | that the structure can be built at all |
| 2 | Same, but items are mixed so the learner must choose the right form - `doing` vs `done` vs `being done`. 3-4 items. | the decision inside the pattern |
| 3 | A situation, no sentences given. 2-3 items. | production, which is the only round that matters |

Rounds 1 and 2 are recognition with extra steps. Round 3 is the one that predicts
whether the pattern will ever appear in real speech, so never cut it for time.

Give a whole round at once and let the learner answer it in one message. This is
not the daily chat: batching is correct here, because the pattern is the subject
rather than the conversation.

## Rules During A Drill

1. **English for the drill itself.** A Chinese meta question is answered briefly,
   as in daily chat, and costs nothing.
2. **Mark each item, do not rewrite the whole answer.** `[ok]`, or the correction
   and one clause of why. There is no `Native:` verdict - the sentence is not an
   attempt at natural speech, it is an attempt at one structure.
3. **Correctness of the structure is the only thing being marked.** If the learner
   uses the pattern correctly but picks an odd word, let it go; that belongs to
   daily chat. Mixing both here buries the one signal the drill exists to give.
4. **No fix cap** - same reasoning as the daily chat. But the marking is per item
   and terse, so this rarely bites.
5. **Give the rule, not the answer, on a miss.** If `with the tickets sold out`
   comes back as `with the tickets sold`, name the test - is the noun doing it, or
   having it done to it - and let them retry within the same round.

## The One-Sentence Test Worth Teaching

For `with + X + doing/done`, and adaptable to most patterns: pull the noun out and
make a small sentence, then look at what follows `be`.

```
everyone  ->  everyone IS BOOKING      active   -> -ing
tickets   ->  tickets ARE SOLD OUT     passive  -> -ed
```

Whatever sits after `be` is what goes after `with`. This avoids naming
active/passive at all, and it is the kind of rule a learner can actually run at
speaking speed.

## Recording It

```bash
python scripts/chat_log.py pattern-drilled --id P001 --root <project-root>
```

This sets `drilled` and advances the review date. **It can never set `owned`**,
by design - see below.

## `drilled` Is Not `owned`

Ten out of ten in a drill means the structure was available while it was the
announced subject of the exercise. That is recognition, and recognition is
already this learner's strength; his own diagnosis, accepted on Day 04, is that
his vocabulary is recognition-level rather than recall-level.

So promotion is deliberately split:

- a drill can only ever produce **`drilled`**
- **`owned`** requires two unprompted productions in a normal five-exchange chat,
  logged with `pattern-used`

Which makes the daily chat the exam and the drill the teaching. The two tracks
share no data and no schedule - only this one gate.

## Watching For It Afterwards

After a pattern reaches `drilled`, watch for it in later chats. Two outcomes are
worth recording:

- It appears unprompted -> `pattern-used`, and say so in that day summary.
- A turn clearly wanted it and got two flat clauses instead -> note it in the
  session file. Do **not** log an error row: the flat version was correct, and an
  error row with nothing wrong in it is the thing Non-Negotiable 7 forbids.

## Summary Format

Written to `patterns/summaries/pattern-NN-YYYYMMDD.md` after the drill.
`tools/import-patterns.js` parses it, so the anchors are a contract:

```markdown
# Pattern 01 - with + X + doing/done

Date: 2026-09-02 | Pattern: P001 | Rounds: 3 | Items: 10 | Correct: 7/10

## The Gap

<2-3 sentences: what the learner does instead, with a real example from a real
day, and what the pattern buys.>

## The Rule

<the test, in the shortest runnable form>

## Round 1 - <name>

**1.** <the two short sentences, or the situation>

**中文：**<what the joined sentence should mean>

**You wrote:**
> <verbatim>

**Answer:**
> <the correct joined sentence>

**Verdict:** ok | wrong form | not the pattern | other

**Why:** <one clause, only when not ok>

---

<...every item, in every round...>

## What Went Wrong

<the pattern in the mistakes, if there is one - one bullet each. Skip the section
if everything was correct.>

## Carry Into Chat

<2-3 openings where this structure would be the natural thing to say, so it can
be watched for.>
```

Anchors the importer matches: `**<N>.**`, `**中文：**`, `**You wrote:**`,
`**Answer:**`, `**Verdict:**`, `**Why:**`, `---` between items, and
`## Round <N> - <name>`. The `中文` line is load-bearing - it is the drill prompt
on the site, exactly as in the chat summaries.

**If this format changes, change `tools/import-patterns.js` in the same commit.**
