# Reviewing the Learner's Rephrases

Read this when the learner has written their rephrase versions and wants
corrections and suggestions.

The learner profile: writing/expression at B1-B2, reading/listening at C1.
This means they can understand everything easily but make typical intermediate
production errors: articles, prepositions, collocations, tense shifts, and
wordiness from translating their first language literally.

## Review Checklist

For each rephrase, check in this order:

1. Meaning: did they keep the original intent and register?
2. Grammar: articles, subject-verb agreement, tense and aspect, pronouns,
   prepositions, sentence structure
3. Collocation: does the word combination sound natural to a native speaker?
4. Register: is the tone right (casual vs. formal)?
5. Economy: is it concise, or padded with filler that adds nothing?

## Common Error Patterns to Watch For

| Pattern | Example problem | Suggested fix |
| --- | --- | --- |
| Missing/extra articles | "I went to cinema" | "I went to the cinema" |
| Literal translation | "open the computer" | "turn on the computer" |
| Wrong preposition | "discuss about the plan" | "discuss the plan" |
| Verb choice | "make a decision" is fine, but "do a decision" is not | check collocation: do/make/take |
| Tense shift | "I tell him yesterday" | "I told him yesterday" |
| Run-on sentence | "I was tired so I went home and then I slept" | split or connect with a clearer link |
| Wordiness | "the reason is because" | "the reason is" or "because" |
| Register mismatch | using formal "utilize" in casual speech | "use" |

## Feedback Format

Give feedback per sentence so the learner can compare directly:

```markdown
### 3. Original: <original sentence>

Your rephrase: <learner's version>

Good: <one or two things that worked>
Fix: <the specific error(s)>
Why: <brief explanation, one or two sentences>
Model: <a corrected/natural version>
```

Rules for feedback:

- Always say what worked first, then what to fix. Praise must be specific, not
  generic ("Nice use of the phrasal verb" beats "Good job").
- Explain the error in one or two sentences; do not lecture.
- Give exactly one model version, phrased the way a native speaker would
  actually say it.
- If several valid versions exist, mention the alternative in one line.
- If a rephrase is already good, say so and mark it "no change needed".
- In the daily summary, every incorrect or unnatural rephrase must include a
  corrected sentence, and table notes must explain the issue in plain words
  (category plus what is wrong), never a bare label like "wordy".

## Calibrate Difficulty

After each day's review, note in `progress.md`:

- How many of the 10 rephrases needed major fixes
- Which error patterns repeated
- Which patterns the learner handled well

Adjust the next day accordingly: if most rephrases were strong, move to the
next tier; if the same error repeats, select sentences that practice that
pattern again.

## Passed Sentences

If the learner marks a sentence as passed (too easy to rephrase), accept it
without correction. Offer one alternative phrase so the pass still teaches
something, and record it in `progress.md` (for example "passed 2: no change
needed"). A passed sentence does not count as a major fix.

## Blank Answers

A blank rephrase means the learner does not know how to answer, which is
different from a pass (too easy). For every blank sentence:

- Explain the meaning briefly, using the Chinese translation in the corpus
- Give one natural model version with a one-line "why"
- Record it in `progress.md` as `don't know` (for example "1, 3: don't
  know")
- Do not count it as a major fix, but plan to bring the pattern back in a
  later round so the learner meets it again

Never pressure the learner to fill a blank later; the blank is information,
not a missed task.

## Progress File Format

Keep `progress/<course>.md` in the workspace. It has two parts: an overview
table at the top that shows the trend across days, and one detailed section
per day. Use the overview to spot the trend: falling major-fix counts mean
the level is right; rising counts mean slow down.

```markdown
# Practice Progress - <course>

Source: <raw file name> | Current day: N
Difficulty trend: Tier 1 -> Tier 1 (steady)

## Overview

| Day | Date | Level | Major fixes | Passed | Focus |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-03 | Tier 1 | 2/10 | 1 | Keep meaning and register |

## Day 1 (2026-08-03) - <source>

Level: Tier 1 | Focus: <focus>

| # | Pattern | Verdict | Note |
| --- | --- | --- | --- |
| 1 | reaction phrase | good | no change needed |
| 2 | phrasal verb | major | collocation: "suspicious about" |
| 3 | greeting | passed | too easy |
| ... | ... | ... | ... |

Repeated errors: <list>
Next day: <level>, focus on <pattern>
```

Verdict values: `good` (natural, no change), `minor` (small fix), `major`
(meaning, function, or register drift, or a grammar error), `passed`
(learner skipped the sentence as too easy), `don't know` (blank rephrase;
the sentence needs teaching).

When a date has more than one practice round, list each round as its own row
in the overview table and its own day section, and note the round suffix
(for example "Day 3 (round 2 of 2026-08-04)").
