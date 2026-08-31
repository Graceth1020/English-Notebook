# Summary Format

Written after the chat ends, into `chat/summaries/day-XX-YYYYMMDD.md`. It is a
standalone record the learner rereads later, not a message to them.

The centrepiece is an **annotated transcript**: the conversation in order, with
each repair attached to the line that produced it. A detached table of fixes
loses what makes a repair memorable - what was being said, and why that wording
was reached for.

Every learner turn carries three layers, and all three are required:

1. **Their line, verbatim** - what they actually produced.
2. **The whole turn rewritten** - the entire answer as a native speaker would say
   it, start to finish, carrying the learner's own content and opinion.
3. **The individual repairs** - each specific change, labelled and explained.

Layer 2 is the one the learner actually reuses. Fragment pairs show what was
wrong; only a complete rewrite shows what the finished answer sounds like,
including the parts that were already fine. Never omit it, even when the turn
needed a single small change.

## Rules

- Write in English. Chinese appears only in the `中文` line of each exchange and
  in the `Why 中文` column.
- Start with the title line and stop after "Tomorrow". Nothing before, nothing
  after.
- Never include: opening pleasantries ("Sure", "Here you go"), sentences
  addressed to the reader ("Hope this helps", "You did great"), motivational
  closers, emojis, or meta commentary about the summary.
- Quote the learner verbatim, typos and all. The transcript is evidence; silently
  tidying their line destroys it.
- **Rewrite every learner turn in full**, however small the change. Keep their
  content, their opinion, and their register - this is their sentence said well,
  not a display of better English. Do not add ideas they did not express, do not
  lengthen a short answer, and keep contractions and casual rhythm so the result
  is speakable.
- When a turn needed nothing, still give the rewrite line and say it was already
  natural, so silence is never ambiguous.
- Include every repair that came up, including ones skipped during the chat
  because of the per-turn fix cap. Mark those `(caught after the fact)` so the
  record is honest about what was said in the moment.
- Number the exchanges as the session file does, and skip `[meta]` Chinese
  questions - they were never exchanges.

## Template

```markdown
# Day <NN> - <topic>

Date: <YYYY-MM-DD> | Category: <daily|work|opinion|hypothetical|culture> | Exchanges: <N> | Fixes: <N> | Chunks owned: <N>/<total banked>

## What We Talked About

<2-3 sentences: the topic and where the conversation actually went.>

## The Conversation

---

**1. Me:** So what got you going this morning - coffee, tea, or nothing at all?

**You said:**
> I am going with a bottle of hot water this morning. That's my daily routine.

**中文：**我今天早上喝的是一瓶热水，这是我的日常习惯。

**Say it like this:**
> Just hot water this morning - that's pretty much my every-morning thing.

**What changed:**

| # | You wrote | Natural | Label | Why | Why 中文 |
| --- | --- | --- | --- | --- | --- |
| 1 | I am going with a bottle of hot water | Just hot water this morning | awkward | "going with" fits choosing between options; a habit you simply name. | "going with" 用于在选项间挑选；习惯直接说出来就好。 |
| 2 | That's my daily routine. | that's pretty much my every-morning thing | bookish | "daily routine" is questionnaire English. | "daily routine" 是问卷用语。 |

**Native:** bookish

---

**2. Me:** Hot water on its own is such a Chinese thing. Does coffee just not agree with you?

**You said:**
> I've always gone with water because water is good for our health.

**中文：**我一直喝水，因为水对健康有好处。

**Say it like this:**
> I've always gone with water - it's just better for you.

**What changed:** only `good for our health`; the rest was already how a native
would put it.

| # | You wrote | Natural | Label | Why | Why 中文 |
| --- | --- | --- | --- | --- | --- |
| 1 | good for our health | better for you | bookish | "our health" is health-campaign English; in chat it's "better for you". | "our health" 像公益宣传语，闲聊里说 "better for you"。 |

**Native:** slightly off

---

**3. Me:** <next question>

**You said:**
> <verbatim>

**中文：**<what they were trying to say>

**Say it like this:**
> <full rewrite>

**What changed:** nothing - this one was already natural.

**Native:** clean

---

<...continue for every exchange...>

## Worth Stealing

<3-5 expressions from this chat the learner should reuse - from Codex's turns or
the natural versions. Each with a one-line example and its banked id, so the
sheet and the summary agree. Only expressions the learner actually needed today.>

- `C007` **"end up + -ing"** - "I ended up watching three episodes."

## Patterns Showing Up Again

<Any habit that appeared more than once today, or that matches an open row in
chat/errors.md. One line each, citing exchange numbers so they can be found in
the transcript above. Omit the section if there is nothing repeated.>

- Bookish framing under pressure (exchanges 1, 4, 5) - register climbs whenever
  the sentence carries an argument.

## Chunk Recall

<Only the chunks seeded today, one line each: the id, whether it came out
unprompted, and the action taken - `used`, `missed`, or `no action` when the
conversation never called for it. Omit the section if nothing was seeded.>

- `C001` "That's on me" - produced unprompted when asked who owns the fix -> used (2/2, owned)
- `C002` "my commute" - said "commuting time" again -> missed, requeued

## Hidden Review

<Which prior errors were seeded into today's topic and what happened. One line
each, with the qualified id and the action taken, so the record shows what was
retired: `coach:E012 pushed-back-without-a-number - used correctly unprompted ->
resolved`. Use "avoided (no action)" when the learner sidestepped the structure
entirely. Omit the section if nothing was due.>

## Two To Use Tomorrow

<Exactly two sentences the learner should try to say in real life, built from
today's material.>

## Tomorrow

<One line: the likely next category and whether the difficulty steps up.>
```

## Writing the Rewrite

The rewrite is the most useful line in the file and the easiest to get wrong.

**Keep it theirs.** If they said hot water is their habit, the rewrite says that -
not something more interesting. Their opinion, their facts, their length.

**Keep it speakable.** Contractions, natural rhythm, the odd `honestly` or
`pretty much`. A rewrite the learner would never say out loud has failed even when
every word is correct.

**Do not upgrade beyond reach.** Stay near their level. Replacing their sentence
with C2 phrasing produces something they cannot reuse, and reuse is the point.

**Fold in the repairs.** Every change listed in `What changed` should be visible in
the rewrite, and the rewrite should contain no changes that are not listed.

This second half is the one that gets broken. It is easy to write a good rewrite
and then list only the two or three most interesting repairs, leaving the rest to
be absorbed silently. Do not: an unlisted change is a sentence altered with no
reason given, and if that change is the *second* occurrence of a habit, the record
loses the only evidence that it is a habit rather than a slip. Day 05 exchange 2
shipped this way - `my ticket is migrating` and `test carefully` were both
repaired in the rewrite and neither was listed, and `test carefully` was the
session's second occurrence.

Repairs recovered this way are still worth adding after the fact; mark them
`(caught after the fact)` like any other. `tools/import-chat.js` checks for it:
if three or more consecutive content words disappear from a learner's line and no
table row mentions them, the build warns.

**The check only sees deletions, and the important ones are often substitutions.**
`It's similar to mine` -> `It looks similar` drops a single short word and warns
about nothing, yet it is a change of stance, not of wording - and stance repairs
are the ones worth recording. A word-count heuristic for substitutions was tried
and removed; it fired on 13 of 30 turns, because one table row often does cover a
whole rewritten clause. So there is no automation here. When writing the table,
read the rewrite against the original **clause by clause**, and ask of each
difference: is this in a row? A stance change with no row is the worst kind of
omission, because it looks like a stylistic preference when it is an argument.

For a turn where several sentences each needed work, rewrite the whole turn as one
flowing answer rather than repairing sentence by sentence - that is how it would
actually be said.

## Multiple Repairs on One Line

List them in the order they appear in the sentence, numbered, one table row each,
with a single `Native:` verdict at the end of the exchange. Repairs recovered
after the session - because the fix cap was full, or the learner asked a follow-up
question - carry a marker in the Label cell:

```markdown
| 2 | the commuting time | my commute | calque (caught after the fact) | ... | ... |
```

## Why This Shape

The learner rereading this three weeks later sees the situation, their attempt,
the finished version, and the specific reasons, in that order. That is the unit
that transfers. The `中文` gloss sits on their own line rather than in every cell,
because the point is to record what they were trying to say - not to translate the
English back for them, which would reinforce the translate-then-assemble habit
this practice exists to break.

## Machine Contract

`tools/import-chat.js` in the notebook repo parses this file to build the site's
conversation pages and recall drills. It matches on exact literal anchors, in
this order, inside the `## The Conversation` section:

| Anchor | Feeds |
| --- | --- |
| `**<N>. Me:**` | the Codex bubble, and the drill's `Situation` line |
| `**You said:**` + `>` quote | the red "you wrote" line, hidden until reveal |
| `**中文：**` | the Chinese cue - the drill prompt for whole-turn recall |
| `**Say it like this:**` + `>` quote | the green rewrite, and the drill answer |
| `**What changed:**` + table | one drill card per row; columns are positional |
| `**Native:**` | the verdict, shown only after reveal |
| `---` between exchanges | the block separator |

Consequences worth knowing before changing anything here:

- **The `中文` line is load-bearing.** It is the only prompt the whole-turn drill
  has. A turn without it produces no card.
- **The table is positional**: `# | You wrote | Natural | Label | Why | Why 中文`.
  Reordering or inserting a column silently mislabels every card.
- A row whose `Natural` cell is `(nothing)` is a deletion and is skipped - there
  is no answer to recall.
- Every learner turn is audited: content words present in `You said` but absent
  from both the rewrite and the whole `What changed` table are reported as a
  dropped run. This warns, like every other check here; it never fails the build.
- Section headings after the conversation (`Worth Stealing`, `Chunk Recall`, and
  the rest) are passed through as markdown, so they can change freely.

**If this format changes, change `tools/import-chat.js` in the same commit.** The
importer warns on turns it cannot parse rather than failing the build, so a
mismatch shows up as a quietly missing card, not an error. Rebuild with
`npm run preview` and check the count it prints against the session count.

## Index Row

After writing the summary, record the session with `chat_log.py log-session`.
Use `--status open` if the chat was abandoned partway and may be resumed, and
`--status done` when it finished and the summary is written.
