# Sentence Selection and Difficulty Progression

Read this when choosing practice sentences from a cleaned corpus and when
planning how many days a source will take.

## Corpus Rule

The final cleaned file must be built with three steps, in order:

1. Filter out non-dialogue content: sound effects, screams, chants, pure
   interjections, and sentence fragments. Drop anything a person would not
   actually say in conversation, plus fragments that cannot stand alone.
2. Extract only sentences with common oral sentence patterns. Keep lines that
   teach a reusable spoken pattern; drop narration, one-off jokes, song
   lyrics, and lines that only work with heavy plot context.
   Drop sentences with no meaningful rephrasing challenge: formulaic greetings
   and acknowledgements ("Hey, friend.", "My name is Dipper."), one-word
   reactions ("What?!", "A zombie?"), and trivial statements ("It's jam.").
   A sentence belongs in the corpus only if it can be said another way and
   the alternative teaches something.
3. Tag each line `[E]` (easy everyday), `[M]` (medium), or `[H]` (hard),
   but keep the file sorted by the order the sentences appear in the
   original subtitles, so reading the corpus follows the story. Append a
   natural Chinese translation after each sentence, separated by ` | `, so
   every line reads `<n>. [<tag>] <English sentence> | <Chinese
   translation>`.

Tag meanings:

- `[E]`: short, high-frequency everyday patterns - reactions, greetings,
  suggestions, simple questions, everyday statements (Tier 1)
- `[M]`: idioms, phrasal verbs, discourse markers, conditionals, hedging,
  reported speech (Tier 2)
- `[H]`: humor, sarcasm, emphasis structures, long or multi-pattern
  sentences (Tier 3)

## Analyze the Corpus for Colloquial Patterns

After cleaning, scan the corpus and tag sentences by the pattern they teach.
Useful categories for a B1-B2 speaker aiming at natural spoken English:

- Contractions and reductions: "I'm gonna", "wanna", "kinda", "lemme", "gotta"
- Phrasal verbs: "figure out", "come up with", "get through", "put up with"
- Idioms and fixed expressions: "beat around the bush", "no big deal"
- Discourse markers and fillers: "you know", "I mean", "well", "anyway", "to be honest"
- Question patterns: "How come...?", "What if...?", "Why don't we...?"
- Conditionals: "If I were you...", "I would've... if..."
- Giving opinions and suggestions: "I'd say", "You should", "It's not worth"
- Agreement and hedging: "Exactly", "Sort of", "I'm not so sure about that"
- Comparisons and degrees: "as long as", "the sooner the better", "way more"
- Emphatic structures: "What I mean is", "The thing is", "No matter what"
- Reported speech and reactions: "He was like", "She told me to", "I was like"
- Everyday small talk: greetings, apologies, excuses, requests, complaints

Write a short pattern tag next to each selected sentence (for example
"phrasal verb: come up with"). These tags drive the daily summary.

## Selection Criteria

Choose sentences that:

- Contain a reusable pattern (phrasal verb, idiom, connective, structure) the
  learner can transfer to their own speech
- Have rephrasing headroom: more than one natural way to say the same thing
- Are short enough to say aloud comfortably (aim for 4-14 words, but allow
  longer ones when the structure is worth practicing)
- Stand alone or need only a one-line context note (add context when the
  meaning depends on the scene)
- Sound like how real people talk, not written prose

Prefer to skip:

- One-off jokes that teach no transferable pattern
- Song lyrics and poetic lines
- Very long monologues that cannot be said in one breath
- Lines that only make sense with paragraphs of plot context
- Formulaic greetings, one-word reactions, and trivial statements that can
  only be rephrased by an obvious word swap

## Difficulty Progression

The corpus file stays in subtitle order; progression lives in the difficulty
tags. Select day batches across the corpus by tag, starting with `[E]`
sentences, then `[M]`, then `[H]`, and record the used corpus line numbers
in `days/<course>/plan.md`. Progression is per-source and carries over
between sources when the learner continues from a previous day.

E (Tier 1): high-frequency everyday patterns. Greetings, small talk,
contractions, common phrasal verbs, basic question and suggestion forms.
Every sentence should be immediately useful in daily conversation.

M (Tier 2): idioms, discourse markers, conditionals, opinion and hedging
phrases, and reactions. Sentences may need a one-line context note.

H (Tier 3): nuance, register shifts, humor, sarcasm, emphasis structures, and
combinations of two or more patterns in one sentence. Include occasional
longer sentences that require rephrasing in multiple ways.

If the learner's rephrase accuracy stays high (most sentences need only minor
fixes), move through tiers faster. If they struggle, slow down and repeat
similar patterns instead of pushing forward.

## Daily Batch Plan

For each source, plan all days up front:

1. Decide the total number of days from the cleaned corpus size (10 sentences
   per day, from the script's estimate).
2. Assign each day's 10 sentences from the pattern-tagged pool, starting with
   Tier 1 and moving into Tier 2 and Tier 3.
3. Keep a `days/<course>/day-XX-YYYYMMDD.md` file per practice round in this
   format (the date is the practice date, for example `day-01-20260804.md`):
   `XX` is the session number and keeps incrementing across rounds; if more
   than one round happens on the same date, append a round number to the
   file name: `day-XX-YYYYMMDD-2.md`, `day-XX-YYYYMMDD-3.md`. Use the same
   suffix for the summary of that round.

```markdown
# Day 1 - <source name>

Source: <file name> | Difficulty: Tier 1 (everyday patterns)

Context: <one-line note about the scene or text, optional>

1. <original sentence> `<pattern tag>`
2. <original sentence> `<pattern tag>`
...

Today's focus: <one sentence naming the pattern to pay attention to>

## My Answers

1. <write your rephrase here>
2. <write your rephrase here>
...

Write "pass" as the rephrase if a sentence feels too easy. Leave the
rephrase blank if you do not know how to answer; blank means "I don't know".
```

4. Store one cleaned corpus per source file as
   `corpus/<course>/<source-stem>-clean.txt` (numbered), keep the raw file
   under `raw/<course>/`, and record each cleaned file in
   `corpus/<course>/index.md` (the script writes it with `--index`).
5. When a course has several source files, assign day ranges per file and
   note the mapping in `days/<course>/plan.md`; each
   `day-XX-YYYYMMDD.md` file records which source its sentences come from.

## Answers in the Day File

The day file carries both the sentences and the answers. Each practice
round creates `days/<course>/day-XX-YYYYMMDD.md` with the "My Answers"
section at the end; the learner writes one rephrase per numbered sentence
there, "pass" for too-easy sentences, and leaves a blank when they do not
know how to answer. The review reads the answers from the day file.

## Learner Passes

The learner may pass (skip) any sentence they find too easy. Accept a pass
without insisting on a rephrase. Offer one alternative phrase so the pass
still teaches something, record it in `progress.md`, and pick a replacement
sentence for the day when the learner asks for one.

A blank rephrase is not a pass: it means the learner does not know how to
answer. Treat it as teaching material (see "Blank Answers" in
`references/review.md`), not as a sentence to fill in later.
