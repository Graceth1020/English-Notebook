# Lesson Format

Every lesson runs five stages and fits 20-30 minutes. One lesson, one goal.
The output stage is a **spoken-style dialogue**: one prompt at a time, corrected
on the spot.

## Time Budget

| Stage | Minutes | Coach word budget | Purpose |
| --- | --- | --- | --- |
| 1. Warm-up | 2 | ~60 | One quick exchange; recycle a prior error |
| 2. Input | 4-5 | ~250 | 3-4 target lines, minimal commentary |
| 3. Dialogue | 10-12 | ~200 per turn | Three turns, one reply each |
| 4. Recap | 2-3 | ~200 | The three closing sections |

**Hard caps per lesson.** Exceeding these makes the lesson unusable even when the
content is good:

- **Coach words: ~750 total.** The learner reads at a fraction of native speed;
  1800 words of feedback is a reading assignment, not a conversation.
- **Turns: 3, one learner reply each.** Three prompts, three replies, three
  corrections - then the recap. Do not open a fourth turn unprompted; the learner
  adds one only by asking ("再加一轮" / "add another turn").
- **Fixes: at most 3 per learner reply**, and at most **8 logged errors per
  lesson**. Beyond that nothing is retained and the error log becomes noise.
- **Retries: none.** Each turn gets exactly one learner reply. Correct it, give the
  model, and move to the next turn. Never ask the learner to rebuild or say it
  again - the model sentence carries the repair, and the next turn provides the
  fresh practice.
- **One inline comment per fix.** No sub-bullets, no "smaller ones" list, no
  alternative phrasings beyond a single model.

A lesson should end in 20-30 minutes of the learner's time. If the coach is
writing more than the learner, the lesson has failed. Aim for rough parity: the
learner's three replies should be comparable in volume to the coach's prompts and
corrections.

### What to drop first when over budget

1. Optional upgrades and "you could also say" alternatives.
2. P3 polish items - articles, minor word order, stylistic variety.
3. Praise beyond one specific clause.
4. Chinese glosses for anything not genuinely abstract.
5. The third turn - two solid turns beat three rushed ones.

Never drop: the single P1 fix per turn, the learner's verbatim reply in the file,
or the recap.

## Stage 1 - Warm-up

Two or three quick exchanges, one at a time, each needing only a one-sentence
reply. At least one recycles an unresolved error from `coach/errors.md` without
announcing it as a test. Keep it fast; correct only what is glaring.

Never post a numbered list of warm-up questions and wait for a block of answers -
ask one, react, ask the next, exactly like the dialogue stage.

## Stage 2 - Input

One focused chunk of authentic material: a 3-6 minute video segment, or a short
passage. Present 4-8 target sentences with timestamps so the learner can
re-listen. Point out the target pattern in context and say why it matters at
work. Keep commentary tight - this is not a lecture.

For listening: instruct the learner to watch the segment first, then compare
against the transcript lines. The video is their only listening input.

## Stage 3 - Output Dialogue

**Ask one question. Wait. React. Then ask the next.** Never present the full
list of prompts up front, and never ask the learner to send several answers in
one block. The exchange should feel like talking to a colleague, not filling in
a worksheet.

Each turn:

1. **Speak in role**, in the first person, as the colleague/manager/interviewer.
   One or two sentences, the way a person would actually say it.
2. **Wait** for the learner's reply. Do not answer for them, do not add a model
   answer in the same message, and do not stack a second question.
3. **React in role first** ("Hm, fair enough - though I'd still worry about..."),
   so the conversation stays alive, then correct.
4. **Correct immediately** and briefly - see the inline correction shape below.
   Fix at most two things per turn, the most transferable first.
5. **Never ask for a retry.** One reply per turn is the whole exchange: react in
   role, correct, give the model, and move on. If the reply misses the target badly,
   say so plainly in one line and let the next turn supply another attempt at the
   same skill - do not re-run the same prompt.
6. Move to the next turn.

Plan **3 turns** from the workplace scenario bank, escalating: a lower-stakes prompt
first, then one with real pressure - pushing back against seniority, cost, or a false
assumption. Each turn is a fresh scenario, so the same skill gets three independent
attempts instead of one prompt drilled repeatedly.

Because there are no retries, each turn must stand alone: the learner's single reply
is the whole performance, and the correction plus model closes it. Sequence the turns
so a miss in turn 1 has somewhere to be re-attempted naturally in turn 2 or 3.

Follow-ups matter more than fresh prompts. If a reply is vague, ask *"what would
you actually say to them?"* rather than moving on. Stay on one scenario for two
or three turns when it is productive.

### Inline correction shape

Default to one compact line per fix, three fixes maximum:

```text
"<their phrase>" -> "<natural version>" (<3-6 word reason>)
```

**Never leave a replacement abstract or elliptical.** Every arrow must point at
words the learner can actually say. `-> I'd rather ...` teaches nothing; write
`-> "I'd rather ship the fix this week"`. If a fix depends on the rest of the
sentence, show the whole clause, not a fragment plus dots. Likewise, do not label
a problem without giving its replacement: "too formal" or "wrong register" alone
is not a correction.

Use the expanded form for **one** fix per turn at most - the one tied to today's
goal:

```text
You said: <their exact words>
Issue: <one label, e.g. function drift / collocation / register>
Natural: <one improved version>
Why: <one line, work-relevant>
```

**Every learner reply ends with one complete model sentence**, labelled `Model:`,
that applies all the fixes at once. Individual arrows show the parts; the model
shows the assembled whole, which is what the learner actually needs to reuse.

### Four tiers, always labelled

The learner cannot self-detect awkwardness - that is the main thing they need the
coach for - but they also lose confidence when correct English is silently
rewritten. Their dominant skew is **register**: the English is acquired mostly by
reading, so it is grammatical but sounds written when spoken. So sort every change
into one of four tiers and **name the tier**, so the learner always knows which
kind of change they are looking at:

| Tier | Meaning | Goes in the model? |
| --- | --- | --- |
| `[wrong]` | Ungrammatical, a calque, or the wrong word | Yes |
| `[bookish]` | Correct and fine in writing, too written for this channel | Yes - swapped for the spoken equivalent |
| `[awkward]` | No native would say it in any register | Yes |
| `[optional]` | Correct and natural; the coach would just phrase it differently | No |

The dividing line: **`[bookish]` is the right register in the wrong channel;
`[awkward]` is wrong in every channel.** `However` in a standup is `[bookish]` -
it is perfect in an email. `same with you` is `[awkward]` - it is wrong everywhere.

**Label the channel on every turn**, because `[bookish]` cannot be judged without
it. `In my opinion` is `[bookish]` in a PR comment and fine in a design doc:

```markdown
### Turn 2 - Standup pushback  [channel: spoken]
```

Channels: `spoken` (standup, 1:1, interview, call), `Slack`, `PR comment`,
`email`, `doc`.

```text
"the scale of team" -> "the size of the team"  [wrong: countability]
"However, we must trace the impact" -> "But we'd also need to check what it touches"  [bookish: written connector + "must" sounds like policy]
"my opinion is X can be integrated" -> "the thing is, X has to integrate with"  [awkward: passive + heavy preamble]
Model: <their sentence with [wrong], [bookish] and [awkward] items fixed, everything else kept>
Optional: <tighter alternative> - their version is fine as written.
```

**The model fixes the first three tiers, never `[optional]`.** Silently changing
correct wording teaches the learner their version was an error and encourages
copying; leaving awkward phrasing unmarked leaves them unable to hear what a
colleague would notice. Both failures matter, so the tier label is what resolves
them.

Before writing a model, test each change: **would a native colleague notice this,
or is it only my preference?** If they would notice in this channel, it is
`[bookish]` or `[awkward]` and belongs in the model. If not, it is `[optional]`
and stays out.

Keep `[optional]` notes rare - at most one per lesson, and only when the
alternative teaches a reusable pattern rather than a synonym swap.

### Fix-slot priority

`[bookish]` will fire on almost every reply - it is a standing skew, not an
occasional slip - so it must not crowd out errors that break comprehension.
Fill the three fix slots in this order:

```text
[wrong]  >  [awkward]  >  [bookish]
```

Surplus `[bookish]` items do not take slots. Collapse them into a single line on
the `Native:` verdict instead:

```text
Native: bookish overall - "However", "at the same time", "trace the impact" all read
written. In speech: "But", "on top of that", "check what it touches."
```

That way register is named every single time without displacing real errors.

### The `Native:` verdict line - never silent

Every learner reply gets a `Native:` line after the model. Its job is calibration,
not repair: it answers *does this sound like a colleague or like a translation?*
Because the learner cannot hear this themselves, **silence is not an option** -
"I did not change it" must never be ambiguous between *it was good* and *I did
not bother*. One of four verdicts:

```text
Native: clean                                  <- promise, not politeness: say it at work as-is
Native: bookish - <phrase>; in speech: <form>  <- correct, but written for this channel
Native: slightly off - <phrase>; a colleague would say <form>
Native: a native would say: <full rewrite>     <- at most once per lesson, on their best turn,
                                                  marked explicitly as NOT an error
```

Budget: roughly 20 words per turn, ~60 per lesson. Take it out of the Stage 2
input commentary, never out of a dialogue turn.

### A model is a repair, not a rewrite

The model must keep **at least 60% of the learner's own words**. Below that it is a
new sentence wearing their content, and the learner cannot tell which parts were
errors - so they memorise the coach instead of correcting themselves.

Three specific overreaches to avoid, all observed:

1. **Adding content they never said.** If a fact was not in their reply, it cannot
   appear in the model. Offer it as a separate suggestion.
2. **Silently applying `[optional]` preferences.** `After analyzing the log` is
   correct; changing it to `checking` is taste, and taste stays out of the model.
3. **Folding a reordering note into the model.** Sequence advice ("put the cause
   first in Slack") is a function-level point, not a wording error. Put it on its
   own line, labelled, after the model:

```text
Reorder (separate from the repair): <the sequencing point + one short example>
```

Enforced by `check_budget.py`, which fails any model retaining under 60%.

### Convert, do not cut

When something has to go, **do not just delete it.** Name what the sentence was
trying to do, then give the native form of that intent. Deleting a clause that
had the right instinct teaches the learner to say less, which is the opposite of
the goal.

```text
"Two days is too short and a week is enough."
  -> "So I'd want the full week on this."  [awkward: restates the number instead of closing on it]
```

The instinct there - do not let the number drift - was correct; only the form was
a repeat. Cut a clause outright only when it is genuinely empty, and say so.

This is the one place where repeating the sentence is required. Everywhere else,
trust them to apply a fix they can see.

Say when a reply is already good, specifically and briefly, then move on. Do not
manufacture a correction for a clean answer; an optional upgrade is fine.

If a reply is blank or the learner says they don't know, explain the meaning,
give one model, ask them to say it back in their own words, and log it as
`unknown` rather than an error.

## Stage 4 - Consolidation

Two or three sentences naming **the one thread** through the session's errors -
the pattern, not the slips. Fold it into the recap rather than writing a separate
essay; a paragraph is enough. Log confirmed errors with `coach_log.py`, staying
within the 8-per-lesson cap.

## Stage 5 - Recap

Close with exactly these three sections, in this order, every lesson:

```markdown
## 1. Expressions You Learned
## 2. Your Key Errors
## 3. Next Lesson Focus
```

- **Expressions:** 4-6 items, each a reusable chunk, not a full sentence.
- **Key errors:** 3 items maximum, the transferable ones only, each as
  `you said -> say instead`. A 8-row table is a wall, not a takeaway.
- **Next lesson focus:** one sentence naming the next single goal.

**No homework.** The learner has opted out of between-session assignments; all
practice happens inside the lesson. Do not assign, imply, or leave a slot for
homework. Re-listening to a segment may be *suggested* in one line at most, never
as a task to hand in.

## Lesson File

The file is a running transcript of the dialogue, not a worksheet handed over in
advance. Create it at `coach/lessons/week-XX/lesson-NN-YYYYMMDD.md`:

```markdown
---
lesson: NN
week: XX
date: YYYY-MM-DD
goal: "<the one small goal>"
material: "<source + timestamp range>"
stage: in-progress | reviewed
---

# Lesson NN - <goal>

## Warm-up
## Input
## Dialogue

### Turn 1 - <scenario>  [channel: spoken | Slack | PR comment | email | doc]
**Coach:** <the prompt in role>
**You:** <the learner's reply, verbatim>
**Fix:**
- "<their phrase>" -> "<natural version>"  [wrong|bookish|awkward: <short reason>]
- ... (3 maximum, filled [wrong] > [awkward] > [bookish])

**Model:** <one complete sentence applying those fixes, built from their content>
**Native:** clean | bookish - ... | slightly off - ... | a native would say: ...

## Consolidation
## Recap
```

Append each turn **as it happens**, not at the end of the lesson: if the session
is interrupted, the learner's verbatim wording is the one thing that cannot be
reconstructed, and it is the raw material for correction and the error log. Set
`stage: in-progress` while the dialogue is running and `reviewed` once the recap
is written.

Tell the learner they can simply reply in chat - there is nothing to fill in.

**No process meta-commentary in the lesson file.** The file is the learner's study
and review material, so it holds only English they can reuse: the prompt, their
reply, the fixes, the model, the native verdict. Notes about the coach's own
mistakes, rule changes, scenario corrections, tooling, or budget checks are
workflow - they belong in chat and, if durable, in this reference or `plan.md`.
A learner revising in week 8 does not need to know a prompt was rewritten in
week 1.

**The lesson file contains only these sections:** frontmatter, the goal, `## Input`,
`## Dialogue` (turn by turn), `## Consolidation`, `## Recap`. Do not add worksheet
scaffolding - no numbered prompt lists, no blank answer slots, no homework
section, no separate correction round outside the turns. Corrections live inside
the turn that produced them.

## Weekly Review Lesson

Every sixth session. Same shape, but the dialogue prompts are built from the
learner's own error log: run `coach_log.py due`, target the top unresolved
patterns, and mark a pattern `resolved` only when the learner produces the
correct form unprompted in dialogue. Record in `coach/reviews/week-XX-review.md`.










