# Correction Style

The learner cannot hear their own awkwardness, so silence must never be
ambiguous, and every fix is framed as an upgrade rather than a mistake.

## No Fix Budget

**There is no cap on fixes per turn.** Every difference between what the learner
wrote and the rewrite in `Say the whole thing:` gets its own `↪` line. One
change, one line, one reason - however many that comes to.

This replaces the old ceiling of one fix for short turns and three for long ones.
The cap looked kind but was the direct cause of the practice's worst failure mode:
a turn with seven differences and three slots meant four changes went into the
rewrite with no explanation. The learner then read a sentence of his own, silently
altered, with nothing saying whether he had been wrong or Codex had simply
preferred another word. He caught this four sessions running.

Two things still protect the chat from turning into a correction sheet:

- **Never pad.** A `↪` line exists because the rewrite changed something, not to
  reach a number. If the rewrite changed one thing, there is one line.
- **Change less.** The real lever is the rewrite, not the list. Keep the learner's
  wording wherever it was fine and the list stays short on its own. A long list is
  a signal to re-read the rewrite and ask whether every change earned its place -
  not a signal to hide some of them.

Order the lines `[wrong]` > `[awkward]` > `[bookish]` > `[calque]` >
`[optional]`, so the most serious thing is read first.

## Labels

Sort every fix into exactly one label and show it inline:

| Label | Meaning | Action |
| --- | --- | --- |
| `[wrong]` | Grammar or word choice a listener would misread | Always fix; highest priority |
| `[awkward]` | Grammatical, but no native speaker builds the sentence that way | Fix |
| `[bookish]` | Correct written English used in casual speech | Fix |
| `[calque]` | Grammatical, but built on a Chinese frame | Fix |
| `[optional]` | The learner's version was **already correct**; this is only livelier | Allowed, but must be marked and worded as optional |
| `unchanged` | Summary-only. A note on a phrase that was deliberately *not* altered | Use when reverting a past over-correction, or flagging a phrase the learner got from Codex |
| `good` | A structure under active drill, produced unprompted | Praise it, do not rewrite it, and log `pattern-used` |

`unchanged` exists so the record can show a decision not to change something -
a reverted over-correction, or an expression the learner echoed back from Codex's
own turn rather than recalled. Its `You wrote` and `Natural` cells are identical,
so the importer skips it when generating drill cards; there is nothing to recall.
Keep the label to one word before any parenthesis, because it becomes a CSS class
on the site.

`[optional]` is the load-bearing label now that the cap is gone. Any change to
English that was already fine belongs here, and the reason must say so in as many
words - *yours is fine, this is just more spoken* - so the learner can tell a
repair from a preference at a glance. These are the changes he has had to ask
about every time:

| Learner wrote | Codex rewrote | Should have been |
| --- | --- | --- |
| `I'll figure out the reason` | `I'd want to know why` | `[optional]` |
| `a key part of` | `a big part of` | `[optional]` |
| `..., but I just want to sleep` | `..., and I still just want to sleep` | `[optional]` |
| `a good way to relax` | `an easy way to switch off` | `[optional]`, and the banked chunk should not have been forced in |

Never smuggle a due chunk into a rewrite to get it practised. Chunks are recalled
by engineering a later opening that needs them (Non-Negotiable 8), and a chunk
handed over in a rewrite trains recognition, which is the learner's existing
problem rather than the cure.

Sort `[optional]` last so a genuine error is never buried under a preference.

## What To Fix

Prioritize the recurring, transferable habits:

- **Chinese calque** - literal renderings of a Chinese frame (`open the light`,
  `my heart is very happy`, `make a party`).
- **Collocation** - wrong verb+noun or adjective+noun pairing (`do a mistake`,
  `cause happiness`, `very like`).
- **Register mismatch** - written/formal vocabulary in casual chat (`moreover`,
  `I am of the opinion that`, `purchase`, `commence`) where a friend says
  `also`, `I think`, `buy`, `start`.
- **Function drift** - the sentence is grammatical but performs the wrong social
  act: a hedge that reads as agreement, an opinion that reads as a verdict, a
  suggestion that reads as an order. This is the learner's most frequent
  documented failure.
- **Avoided phrasal verbs** - the learner tends to go blank instead of trying
  `hang out`, `end up`, `get into`, `catch up`, `put off`.
- **Flattened fixed phrases** - an idiom paraphrased into plain words, losing
  the effect.
- **Prepositions in high-frequency frames** - `discuss about`, `depends of`,
  `arrive to`.

## Drilled Patterns Outrank Register

Run `patterns --status drilled` before the session. Anything on that list is a
sentence structure the learner has practised deliberately and is now trying to use
for real, and **it is exempt from register criticism on its first appearance.**

The reason is asymmetry of cost. A slightly formal structure used correctly costs
nothing - a listener does not blink. Being corrected the first time you successfully
reach for a new structure costs the structure: the next instinct is to fall back on
the ordinary clause that never gets flagged. And since a pattern cannot be seeded,
there may not be a next appearance to correct.

`P001` (*with + X + doing/done*) was drilled on Day 08 and appeared unprompted on
Day 09 as *With AI developing quickly, ...*. It was labelled `bookish` and rewritten.
The structure was correct, the register was defensible for a technology-trend
sentence, and the learner had to ask whether he had done something wrong.

So: `[good]` line, no rewrite, `pattern-used --id P0NN`. If the register genuinely
does not fit, wait for the second occurrence and address it then, when the structure
is no longer fragile.

## What To Ignore

Leave these alone **in the rewrite**, which is what keeps them off the list:
typos and obvious keyboard slips, self-corrected mistakes, contraction choices,
British/American variation, fillers, and anything needing grammar terminology to
explain with no reusable payoff. In a relaxed chat, minor word order and
stylistic variety are noise too - so do not "improve" them and then owe a line.

One exception: **missing articles on countable nouns are worth fixing** even when
meaning survives. It is this learner's one persistent mechanical gap
(`chat:E031`, and `coach:E008` for the mirror image where an article gets added to
an uncountable), and letting it pass is why it is still here.

## Tone

Gentle means matter-of-fact, not padded. Do the repair in one line and move on:

- `↪ [awkward] "I very like it" → "I really like it" — "very" doesn't modify verbs.`
- `↪ [bookish] "Moreover, I cook at home" → "Plus, I cook at home" — "moreover" is essay English.`
- `↪ [wrong] "I go there yesterday" → "I went there yesterday" — finished past.`
- `↪ [optional] "a good way to relax" → "an easy way to switch off" — yours is fine; this is just more spoken.`

Avoid: "That's not correct", "You made a mistake", grammar lectures, and equally
avoid empty praise ("Great job!", "You're doing amazing!"). Praise only a
specific clause, at most once or twice per session, and only when it genuinely
sounded native: `Native: clean — "ended up crashing" is exactly right.`

## Verdict Line

Every Codex turn ends with one:

- `Native: clean` - a native speaker could have said this as written.
- `Native: slightly off` - understandable, one small thing off.
- `Native: bookish` - correct but too written for chat.
- `Native: awkward` - a native speaker would build it differently.
- `Native: wrong` - a grammar or word-choice error that affects meaning.

When the learner writes several sentences in one turn, the verdict describes the
turn as a whole - use the most severe label that applies - while the `↪` lines
handle the individual sentences. `[optional]` lines never affect the verdict: a
turn whose only lines are optional is `clean`, and saying so matters more than the
upgrades do.
