# Daily Blog-Style Summary

Read this after reviewing the day's rephrases, when writing the markdown
summary for that day.

## Purpose

The summary is a short blog post, not a report. It should read naturally,
show what was learned, and make the day's practice feel concrete. Write the
whole post in English except for the "中文" column, which gives the Chinese
translation of each original sentence. No other non-English text belongs in
the post; if a grammar point needs extra clarity, explain it in simpler
English.

## Forbidden Content

The summary is a standalone document. Do not wrap it in chat-style framing.
Specifically, never include:

- Opening pleasantries or acknowledgements before the content, such as "OK",
  "Sure", "Here you go", "Got it", or "Let me analyze this for you"
- Interactive or conversational sentences addressed to the reader, such as
  "I hope this helps", "Did you get it?", "What do you think?", or "You're
  doing great"
- Motivational closers and cheerleader-style filler, such as "Keep going!",
  "You're already doing the hardest part", or "The gap between understanding
  and speaking is bridged by consistent practice"
- Emojis, decorative symbols, or exclamation-heavy praise
- Meta commentary about the summary itself ("This summary covers...",
  "Below is the review")

Start directly with the title and date line, end after "Tomorrow's Preview",
and write nothing else.

## Template

```markdown
# Day 1 - <source name>: <one-line theme>

Date: <date> | Source: <file name> | Level: Tier 1

## Today's Practice

<2-3 sentences introducing the day: what we practiced and why it matters for
speaking. Mention the focus pattern.>

## The Sentences and My Rephrases

| # | Original | 中文 | My rephrase | Corrected version | Notes | Notes 中文 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ... | ... | ... | No change needed | Good: same meaning and natural | ... |
| 2 | ... | ... | ... | ... | Tense: "is going on" is ongoing; "happened" is finished | ... |
| ... | ... | ... | ... | ... | ... | ... |

## Corrections Worth Remembering

<Pick the 2-3 most instructive corrections. For each, show the original,
the learner's version, the model version, and a one-sentence "why".>

## Common Phrases and Fixed Structures

<A bullet list of the common phrases and fixed sentence structures that
appeared in this exercise: fixed expressions, collocations, and reusable
sentence frames, each with a short example from today's sentences or model
versions. Example bullets:
- "I might as well ..." - "With this rain, I might as well stay home."
- "There's no such thing as ..." - "There's no such thing as a free lunch."
- tag-question frame - "You didn't forget the tickets, did you?">

## Notes from This Round

<Optional: if the learner used the language-notes skill on today's sentences,
link the day's notes page and list the entries briefly. On the blog the
notes are published as a separate page and linked from both the day page and
the summary page.>

## How This Builds Speaking

<One short paragraph. Connect today's exercise to speaking: rephrasing forces
active recall of vocabulary, builds automaticity for common patterns, and
gives you chunks you can shadow aloud. Suggest one speaking follow-up, such
as reading the model versions aloud three times, recording yourself, or
using two of today's patterns in a real conversation.>

## Tomorrow's Preview

<One sentence: what tier/patterns are next.>
```

## Writing Notes

- Save each summary as `summaries/<course>/day-XX-YYYYMMDD.md` (the date is
  the practice date, for example `day-01-20260804.md`). When a date has more
  than one practice round, append the round number: `-2`, `-3`, matching the
  day file. Add a row for it in `summaries/<course>/index.md`.
- Keep the intro and the "How This Builds Speaking" section to 2-4 sentences.
- Every row whose rephrase is incorrect or unnatural must show a corrected
  sentence in the "Corrected version" column. Corrected versions use word or
  phrase substitutes only when a natural equivalent exists (for example
  "contest" -> "competition"); if no natural substitute exists, keep the
  original wording. The corrected version must preserve the original meaning
  exactly and must not add content that is not in the original sentence.
  Rows that are already good say "No change needed"; if a natural substitute
  exists, add "; alternative: <model>".
- When the best corrected version is exactly the original sentence, mark it
  clearly so it does not look like an error: write
  "Same as original: the original was already the best natural form", and
  make the note explain what moved away from it. The original is the target
  form; the learner's version drifted, and coming back is the fix.
- Every summary includes a "Common Phrases and Fixed Structures" section: a
  bullet list of the fixed expressions and reusable sentence frames that
  appeared in the exercise, each with a short example.
- If `notes/rephrase/<course>/day-XX-YYYYMMDD.md` exists, add a
  `## Notes from This Round` section after `## Common Phrases and Fixed
  Structures` that links the day's notes page and lists each entry (the
  word, sentence, or pattern it covers). The blog import publishes the notes
  as a separate page per day (`rephrase/notes/<slug>/<stem>/`) and adds
  links from both the day page and the summary page.
- Add a Chinese translation of the original sentence in the "中文" column.
  Translate the sentence as spoken, not word for word.
- Add a Chinese translation of the note in the "Notes 中文" column, next to
  the English note in "Notes".
- If a sentence was passed (too easy), put "passed" in the "Corrected
  version" column and note it in "Notes" ("too easy, skipped").
- If the rephrase is blank (the learner did not know how to answer), put the
  model version in "Corrected version" and note "Don't know: meaning
  explained, model given" in "Notes" (with the Chinese note).
- Write notes in plain words so the learner understands without asking.
  Name the issue category and show what the problem is: "Tense: 'happened' is
  finished, but the original is ongoing", "Wordy: repeats the same idea",
  "Register: too formal for speech". Never use a cryptic one-word label like
  "wordy" or "fix article" without explanation.
- Choose the corrections that taught the most, not the first two in order.
- Use "My rephrase" wording so the post reads like the learner's own blog.

## Speaking Improvement Guidance

Use this section in the summary (adapted to the day) and offer the learner
these follow-up speaking moves after the rephrase exercise:

- Shadowing: play the original line and speak along, copying rhythm and
  intonation, then repeat with the model rephrases.
- Read-aloud: read today's 10 model versions aloud three times, aiming for
  one breath per sentence.
- Delayed recall: close the file, wait an hour, then say each meaning again
  in your own words without looking.
- Recording: record your rephrases, compare them to the model, and note one
  sound or rhythm issue to fix tomorrow.
- Pattern planting: pick two patterns from today and use them in real
  conversation or writing before the next session.
