# Correction Priorities

Correct what changes how a colleague perceives the learner. Ignore what does not.
The learner is B1-C1: they do not need every flaw named, they need the few
habits that repeatedly cost them credibility at work.

## Priority Order

Fix in this order and stop at three issues per answer.

### P1 - Breaks meaning or function
The listener misunderstands, or the utterance does the wrong social job.

- **Function drift:** the sentence is grammatical but performs the wrong act -
  hedging read as agreement, a verdict read as a description, a suggestion read
  as an order. This is the learner's single most frequent documented failure.
- **Wrong tense/aspect** where it changes the fact: ongoing vs finished, a
  shipped feature vs a planned one.
- **Missing or wrong subject/verb** that makes the claim unreadable.

### P2 - Marks the speaker as non-native and is highly transferable
Not misunderstood, but distracting, and it recurs across hundreds of sentences.

- **Collocation:** wrong verb+noun or adjective+noun pairing
  (`play a joke` for `pull a joke`, `cause anything bad`, `greet to`).
- **Chinese calque:** literal translation of a Chinese frame
  (`my heart`, `during my life`, `make a party`, `open the light`).
- **Register mismatch:** bookish or bureaucratic words in speech
  (`method`, `approval`, `betrayers`, `pleased with`) where a native colleague
  says `way`, `sign-off`, `people who sold us out`, `happy with`. Also the
  reverse: slang in a written status update.
- **Preposition and particle errors** in frequent frames
  (`depends of`, `discuss about`, `focus in`).
- **Flattened fixed phrases:** replacing an idiom with a plain paraphrase and
  losing the effect (`in my day` -> `during my life`). Documented weakness.
- **Phrasal verbs avoided entirely** - the learner tends to go blank rather than
  attempt `go through`, `move out`, `push back`, `roll out`. Documented weakness.

### P3 - Polish, only when P1 and P2 are clear
Articles that do not obstruct meaning, minor word order, optional upgrades,
stylistic variety. Mention at most one, framed as optional.

### Do Not Correct
Accent; fillers (`um`, `like`) unless they dominate; self-corrected slips;
British/American variation; contraction choice; anything requiring
metalinguistic terminology to explain and yielding no reusable gain.

## Known Error Profile

Carried over from the learner's prior practice records. Assume these until
evidence says otherwise, and probe them early.

| Pattern | Typical shape | Watch for |
| --- | --- | --- |
| Function drift | Rephrases the idea instead of performing the act | Disagreeing, hedging, pushing back |
| Chinese calque | Word-for-word from Chinese | Emotion and commitment language |
| Bookish register | Written/formal word in spoken context | `method`, `approval`, `moreover` |
| Collocation slips | Wrong verb for the noun | `cause`, `make`, `do`, `take` |
| Fixed phrases flattened | Idiom paraphrased away | Fixed frames from input material |
| Phrasal verbs blank | No attempt when a phrasal verb is needed | `push back`, `follow up`, `sign off` |
| Copying the prompt | Returns the source sentence nearly verbatim | Treat as no output; re-prompt |

These names describe what to **notice** in the moment. They are deliberately not the
categories used in `coach/errors.md`, which is filed by what the learner must **produce**
when the card resurfaces (`act` / `phrasing` / `form`). Diagnosing with a word-class label
and then logging with it produces unusable cards - a `phrasal-verb` row becomes a list of
verbs instead of a sentence. Diagnose here, log with a bucket. See
`references/lesson-format.md`.

## Workplace-Specific Sensitivities

For a developer heading into a multinational team, these carry outsized weight
and deserve correction even when technically minor:

- **Bluntness that reads as rude.** Chinese-direct translations of disagreement
  (`I don't think so`, `This is wrong`, `No, impossible`) sound harsher in
  English than intended. Teach the hedge-first pattern.
- **Over-apologizing / self-diminishing.** `Sorry for my poor English`,
  `Maybe I am wrong but`, excessive `just`. Costs authority.
- **Commitment ambiguity.** Vague timelines where a team expects a clear
  `I'll have it by Thursday` or an explicit `I can't commit to that yet`.
- **Missing softeners in code review.** `Your code is bad` vs
  `I'd suggest extracting this - it'd make the retry path easier to test`.
- **Escalation without framing.** Stating a problem without stating impact and
  the ask.

## Feedback Tone

Brief, concrete, and never condescending. Name one thing that worked before
listing fixes. Use the learner's own sentences as the raw material - generic
example sentences teach far less than their own repaired output.
