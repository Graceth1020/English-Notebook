---
name: english-rephrase-practice
description: Turn English subtitle or text files into a daily rephrasing practice routine for improving spoken and written expression. Cleans raw text (SRT, VTT, TXT, transcripts), analyzes colloquial sentence patterns, selects 10 practice sentences per day with increasing difficulty, reviews the learner's rephrase attempts with corrections and suggestions, and writes a blog-style markdown summary each day. Use when the user wants to practice rephrasing sentences from movies, shows, podcasts, articles, or any English text; wants a cleaned sentence list from a subtitle/text file; wants daily English expression practice; wants their rephrase versions corrected with suggestions; or wants a daily practice summary.
---

# English Rephrase Practice

## Overview

Turn imported English text into a daily rephrasing routine: clean the file,
select 10 practice sentences per day, review the learner's rephrases, and
publish a blog-style daily summary. Serve a learner whose reading/listening
is strong (C1) but whose active expression is B1-B2.

## Language Rule

Respond in English only for the entire conversation, whatever language the
user writes in. This applies to every user-facing message: explanations,
feedback on rephrases, corrections, suggestions, daily summaries, and progress
notes. Quote the user's own text verbatim only when it is the subject of
review (for example, their rephrase attempt or a non-English line from the
source material). Never translate skill instructions or add non-English
explanations alongside English ones. Exception: the Chinese translation
columns in the summary table carry Chinese translations of each original
sentence and its note; these are the only non-English content allowed in
outputs.

## Workspace Layout

Create and maintain this layout in the project folder:

```text
raw/<course>/          original subtitle/text files for that course
corpus/<course>/       one cleaned file per source: <source-stem>-clean.txt
corpus/<course>/index.md   manifest of cleaned files, counts, and status
days/<course>/         day-XX-YYYYMMDD[-N].md files with each round's 10 sentences
days/<course>/index.md         index of day files with status
summaries/<course>/    day-XX-YYYYMMDD[-N].md blog-style daily summaries
summaries/<course>/index.md    index of summaries with level and fixes
progress/<course>.md   running record of strengths, errors, and difficulty
```

`<course>` is the source name (for example "Gravity Falls"). Every course
keeps its own folders, so several courses can run at the same time. Use the
same course name in `raw/`, `corpus/`, `days/`, `summaries/`, and
`progress/`. Day numbering restarts at 1 for each new course. The learner
writes their rephrases directly in the day file, so each day file holds both
the sentences and the answers.

## Index Files

Each of `days/<course>/` and `summaries/<course>/` keeps an `index.md`
listing every file in that folder with its date, level, and status, so the
folder stays manageable as files accumulate. Update the two index files
whenever a round starts (add the day file as "awaiting answers") and whenever
a review is done (mark the day file as completed and add the summary row).

## Workflow

Follow these steps in order. Read the matching reference at each step.

### 1. Clean the source file

Run the cleaning script on the imported file with Python 3:

```bash
python scripts/clean_text.py raw/<course>/<source>.srt --out "corpus/<course>/<source-stem>-clean.txt" --index
```

The script strips timestamps, cue indexes, HTML tags, speaker labels, music
cues, and duplicates, and prints how many sentences are kept and how many
practice days that equals at 10 per day. Review the output: if the file has
odd artifacts (lyrics, non-English text, heavy scene-specific slang), clean
those lines by hand before proceeding. Name each cleaned file after its
source (`<source-stem>-clean.txt`) so the corpus stays unambiguous when a
course has many files, and keep `--index` so the file is recorded in
`corpus/<course>/index.md`.

Then apply the corpus rule before saving the final file:

1. Filter out non-dialogue content: sound effects, screams, chants, pure
   interjections, and sentence fragments. The script drops most of these
   mechanically; review the output and remove what it missed.
2. Extract only sentences with common oral sentence patterns: reactions,
   suggestions, questions, phrasal verbs, idioms, discourse markers, hedging,
   and everyday statements. Drop narration and one-off lines that teach no
   transferable pattern, and drop sentences with no meaningful rephrasing
   challenge (formulaic greetings, one-word reactions, trivial statements).
3. Tag each kept line `[E]` (easy everyday), `[M]` (medium), or `[H]`
   (hard), and keep the file sorted by the order the sentences appear in
   the original subtitles, so reading the corpus follows the story.

See `references/selection.md` for the pattern categories and tagging rules.

### 2. Analyze patterns and plan the days

The corpus is in subtitle order, so select day batches across it by
difficulty tag: start with `[E]` sentences, move into `[M]`, then `[H]`,
and record the used corpus line numbers in `days/<course>/plan.md`. Tag
each sentence with the colloquial pattern it teaches and write the day's
batch file. See `references/selection.md` for pattern categories, selection
criteria, and the `days/<course>/day-XX.md` format.

Deliver to the user:

- The cleaned corpus file (`corpus/<course>/<source-stem>-clean.txt`)
- Today's batch file (`days/<course>/day-XX-YYYYMMDD[-N].md`) with exactly
  10 sentences and their pattern tags; `-N` marks a later round on the same
  date (`-2`, `-3`, ...)
- A short note on today's focus and difficulty tier

Ask the learner to rephrase each sentence in their own words, keeping the
meaning, and to send the 10 versions back in the same numbered order. The
learner may pass any sentence they find too easy; accept the pass and offer
one alternative phrase (see "Learner Passes" in `references/selection.md`).
The learner writes their rephrases in the "My Answers" section of the day
file (one version per numbered sentence, or "pass") and sends it back.

### 3. Review the rephrases

Review each rephrase with the checklist and feedback format in
`references/review.md`: what worked, what to fix, why, and one natural model
version. Calibrate difficulty for the next day based on how many rephrases
needed major fixes. A blank rephrase means the learner does not know how to
answer: explain the meaning, give one model version with a short why, and
record it as `don't know` (see "Blank Answers" in `references/review.md`).

### 4. Write the daily summary

Write the blog-style markdown summary using `references/summary.md`. The
summary must contain the original sentences, the learner's rephrase versions,
the corrections and suggestions, and a section on how the day's practice
builds speaking skills. The summary must contain no opening pleasantries,
interactive or motivational filler, or emojis (see "Forbidden Content" in
`references/summary.md`). Include Chinese translation columns in the summary
table for each original sentence and for each note. Save it as
`summaries/<course>/day-XX-YYYYMMDD.md`.

### 5. Track progress

Append the day's record to `progress/<course>.md` as described in
`references/review.md`. Carry the difficulty level into the next session.

## Reference Guide

- `references/selection.md` - pattern analysis, sentence selection criteria,
  difficulty tiers, day file format
- `references/review.md` - review checklist, common B1-B2 error patterns,
  feedback format, progress tracking
- `references/summary.md` - blog-style summary template and speaking
  improvement follow-up drills

## Scripts

`scripts/clean_text.py` cleans subtitle and text files into a numbered
sentence corpus. Run `python scripts/clean_text.py --help` for options.
