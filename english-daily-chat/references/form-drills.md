# Form Drills

A third track, alongside the daily chat and the pattern drills. Started only when
the learner asks for it.

## The Problem It Exists For

Some errors are **correct under attention, wrong under production**. The learner
knows the rule, produces it perfectly when the rule is the announced subject, and
drops it the moment his attention goes to content.

Two are documented:

| | `chat:E031` articles | `chat:E037` tense in hypotheticals |
| --- | --- | --- |
| Tested in isolation | 12/12 | correct |
| In live chat | 5 hits in 5 consecutive sessions | first verb right, then drifts |

Form Drill 01 established this directly: twelve article items, twelve correct,
including a trap item and the /el/ vowel rule. **There is no knowledge gap.** So a
conventional drill is the wrong instrument - it supplies exactly what is missing
during real speech, which is attention. Running it again produces another perfect
score and no transfer.

## The Mechanism

**Hard content, narrow marking.**

- Ask a question whose *content* takes real thought and three or four sentences to
  answer. The learner's attention has to go to meaning.
- Mark **only** the form axes. Word choice, register, idiom, naturalness - all
  ignored, because they belong to the daily chat and marking them here restores the
  attention the drill is trying to occupy.
- **Never announce the axes.** Form Drill 01 scored 12/12 partly because the heading
  said the subject was articles. If the learner knows what is being watched, the
  drill measures recognition again.

Difficulty climbs across rounds, and the climb is the experiment: it is the only way
to see whether accuracy degrades under load, holds, or - as happened on Day 10 -
*improves*, because harder content made him more careful rather than less.

## The Three Axes

Fixed, so that results are comparable across drills:

| Axis | Covers |
| --- | --- |
| `tense` | Time-frame consistency across a whole turn; hypotheticals; past narration |
| `article` | Articles, and the countable/uncountable judgement behind them |
| `form` | Which verb shape belongs in the slot - bare vs `-ing` vs `-ed` vs participle |

`form` is deliberately **not** "irregular verbs". Ten sessions of corpus produced
zero irregular-verb errors - `bought`, `caught`, `ran into`, `got round to` were all
correct, and the one candidate (`planed`) was a spelling slip. The real gap is
choosing the verb *shape*: `usually learning` without an auxiliary, `whenever
working from home` with no subject, `if it's just spend`, `With the change touched`.
Add axes only when the corpus shows the need.

## Rounds

Three, and difficulty is the variable rather than the task type:

| Round | Content | Purpose |
| --- | --- | --- |
| 1 | Something he knows cold - a habit, a routine, a decision he made | baseline with attention to spare |
| 2 | A position he has to state and support, on a topic he has not thought about | genuine load |
| 3 | A high-information task: chronology, dense technical description, or comparison | maximum load |

**Load must come from the information, not from being cornered.** Round 3 was
originally an adversarial challenge - a hole punched in his round 2 argument, with a
demand that he answer it. Drill 02 abandoned that mid-session when the learner said,
correctly, that the exercise had turned into "how to handle this kind of question"
rather than how to speak English.

Round 2 of that same drill is the evidence: five misses while he was merely *stating*
a position, with nobody attacking it. So the argument is not what generates load. When
a round makes him solve a business problem before he can produce a sentence, a failure
at the first step leaves no data at all - the answer comes back short and cautious,
which is precisely when form errors hide.

The adversarial style was inherited from the daily chat, where holding a position
under pressure is the actual goal. It belongs there, not here.

Three sources of load that work, each stressing a different axis:

| Load source | Axis it stresses |
| --- | --- |
| Narrate something spanning several points in time, in order | `tense` - a time frame to manage |
| Noun-dense technical description for someone with no context | `article` - a judgement at every noun |
| Comparison or conditional reasoning needing subordinate clauses | `form` - more verb-shape choices |

None of these require him to invent a stance, and none of them are easy.

Marking is **immediate**, after each round rather than at the end. Delayed marking
is closer to real speech but lets the same error repeat three times in one session
with nothing learned from the first.

One round, one answer, three or four sentences. Do not accept a one-sentence answer -
the whole design depends on there being enough material for the axes to fail in.

## Marking

Per round, one line per axis, always all three even when clean:

```
tense   -> ok
article -> "combine the efficiency" -> "combine that efficiency" (uncountable)
form    -> ok
```

Out-of-scope observations may be mentioned **once**, explicitly flagged as not
counted, and never turned into a correction the learner is expected to act on.
Day 10 round 3: `makes misunderstanding` is a collocation error, worth naming, and
deliberately outside the three axes.

## Summary Format

Written to `form/summaries/form-NN-YYYYMMDD.md`. `tools/import-form-drills.js`
parses it, so the anchors are a contract.

```markdown
# Form Drill <NN> - <what the session was about>

Date: <YYYY-MM-DD> | Axes: tense, article, form | Rounds: <N> | Clean: <N>/<N*3>

## Why This Was Run

<2-3 sentences: which error rows, how many hits, what has already failed.>

## Round <N> - <difficulty label>

**Prompt:** <the question, verbatim>

**中文：**<what he was being asked to do>

**He wrote:**
> <verbatim>

**tense:** ok
**article:** "combine the efficiency" -> "combine that efficiency"
**form:** "how to combine ... rather than coding" -> "combining ... rather than coding"

**Note:** <optional, out-of-scope, stated as not counted>

---

<...every round...>

## Matrix

| Round | Difficulty | tense | article | form |
| --- | --- | --- | --- | --- |
| 1 | easy | miss | ok | ok |
| 2 | medium | ok | miss | miss |
| 3 | hard | ok | ok | ok |

## What It Showed

<the finding, which is the point of the whole track. Degradation curve, or its
absence.>

## Carry Forward

<what to do next, numbered.>
```

Anchors the importer matches: `## Round <N> - <label>`, `**Prompt:**`,
`**中文：**`, `**He wrote:**`, `**tense:**`, `**article:**`, `**form:**`,
`**Note:**`, `---` between rounds, and the `## Matrix` table.

An axis line reading exactly `ok` is clean. Anything else is a miss, and the text is
shown as the correction. The `中文` line is load-bearing - it is the recall prompt on
the site, as in the other two tracks.

**If this format changes, change `tools/import-form-drills.js` in the same commit.**

## What This Track Cannot Do

It cannot promote anything to `owned`. Like a pattern drill, a good result here means
the form survived while the learner was busy - which is better evidence than a
conventional drill, but still not evidence from an unmarked conversation. The daily
chat remains the exam.

Nor does it replace the error log. `chat:E031` stays in `chat/errors.md` and keeps
accruing hits from real sessions; this track is an instrument pointed at it, not a
home for it.
