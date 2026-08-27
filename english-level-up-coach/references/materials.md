# Ingesting Material

Turn whatever the learner supplies into lesson-ready material under
`coach/materials/<slug>/`. Never invent source content: if a transcript is
missing a passage, work with what is there.

## No Network

There is no outbound access and neither `yt-dlp` nor `ffmpeg` is installed, so
YouTube URLs cannot be fetched. The learner exports the transcript themselves
(YouTube: `...` -> `Show transcript` -> copy, or a caption downloader producing
`json3` JSON / `.srt` / `.vtt`) and drops the file in `coach/inbox/`.

Always ask for the video URL alongside the transcript so timestamps become
clickable re-listen links. Without a URL, material still works but loses the
listening loop.

## Parsing

```bash
python scripts/parse_transcript.py <input> \
  --out coach/materials/<slug>/transcript.md \
  --json coach/materials/<slug>/transcript.json \
  --url <video-url> --title "<title>"
```

Handles YouTube `json3` (`tStartMs`/`dDurationMs`/`segs[].utf8`), `.srt`, and
`.vtt`. It merges caption cues into whole sentences, drops `[MUSIC]`-style
noise, keeps each sentence's start time, appends a `?t=<seconds>s` link, and
flags speaker-turn boundaries with `>>`.

**Speaker identity is not asserted.** Caption `>>` markers are unreliable and
often missing, so the parser marks only where a turn starts. Read the content to
decide who is speaking before attributing a quote in a lesson.

## Segmenting a Long Source

Anything over ~10 minutes becomes a mini-series. Group sentences into 3-6 minute
segments along topic boundaries (interviewer questions are reliable seams), and
write `coach/materials/<slug>/series.md`:

```markdown
# <title> - Mini-Series

Source: <url> | Duration: <hh:mm> | Sentences: <n>

| Seg | Time | Sentences | Topic | Language focus | Lesson |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:04-5:40 | 1-64 | Upbringing | narrating your background | 01 |
```

One segment per lesson. Choose the segment whose natural language matches the
lesson's goal rather than marching in order - a segment about hard tradeoffs
suits a "disagree politely" lesson better than the opening pleasantries.

## Selecting Target Sentences

Pick 4-8 sentences per lesson that carry a reusable, transferable frame:
hedges, stance markers, discourse organizers, commitment language, softened
disagreement, comparison and tradeoff frames. Skip content that teaches nothing
portable (names, one-off jargon, pleasantries) and anything the learner already
produces reliably.

Prefer sentences a developer could reuse almost verbatim in a standup, review,
or design discussion.

## Non-Video Material

- **Article or blog post:** extract 6-10 sentences with reusable frames; treat
  the argument structure as the input for opinion tasks.
- **Email or Slack thread:** the highest-value workplace material. Mine it for
  register, then have the learner rewrite it at a different politeness level.
- **Meeting notes:** rebuild the spoken version - the learner says what they
  would have said in that meeting.
- **Resume or self-introduction:** turn bullets into spoken narration; target
  self-diminishing language and vague impact claims.
- **The learner's own writing:** the best source for error logging, since the
  errors are already theirs.

Store the cleaned material as `coach/materials/<slug>/source.md` with a short
provenance header, and keep the raw drop in `coach/inbox/`.
