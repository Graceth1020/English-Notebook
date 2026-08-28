---
name: language-notes
description: English language practice notes for learners. Use when the user asks to translate Chinese text into English, give the natural American spoken-English way to say something, define a word or phrase, parse a sentence's grammar, compare two sentences or answer a grammar question about them, rephrase a sentence into alternative versions, summarize today's saved language notes, or list the available language commands. Activates on natural-language requests such as "translate 今天天气很好", "how do Americans actually say 我认为", "define keep back", "parse this sentence", "compare these two sentences", "rephrase this", or "summarize today's notes"; the slash aliases /translate, /spoken, /define, /parse, /compare, /rephrase, /summary, and /help are also supported.
---

# Language Notes

## Activation

Trigger on natural-language requests; slash aliases are optional shortcuts. Recognize intent by meaning, not exact words: "how do you say X in English" is a translate request, "how would an American actually say X" or "口语怎么说" is a spoken request, "what does X mean" is a define request, and "why is A wrong and B right" is a compare request.

| Intent | Alias | Action |
|--------|-------|--------|
| Translate Chinese to English | `/translate` | English translation only |
| Say it in American spoken English | `/spoken` | 4-6 natural spoken versions with example sentences |
| Define a word or phrase | `/define` | Definition, usage, examples, synonyms, antonyms |
| Analyze grammar of a sentence | `/parse` | Structural breakdown |
| Compare sentences / answer a grammar question | `/compare` | Comparison, judgment, reasoning |
| Rephrase a sentence | `/rephrase` | 3-5 alternative versions |
| Summarize today's notes | `/summary` | Grouped daily summary |
| List available commands | `/help` | Command list, no file saved |

## Core Rules

1. Respond in English for the entire conversation, whatever language the user writes in.
2. Write file content in English, except verbatim quoted user input (for example the Chinese text in an Input line).
3. Generated files contain structured data only; never add conversational filler, pleasantries, or meta-commentary.
4. Save all files under `notes/` at the project root Codex is working in, unless the user names another directory.
5. Use the local date for filenames and timestamps. Append to the daily file when more than one entry lands on the same day; never overwrite.

## File Layout

Create and maintain this layout at the project root:

```text
notes/
├── translate/   translate-YYYY-MM-DD.md
├── spoken/      spoken-YYYY-MM-DD.md
├── define/      define-YYYY-MM-DD.md
├── parse/       parse-YYYY-MM-DD.md
├── compare/     compare-YYYY-MM-DD.md
├── rephrase/    rephrase-YYYY-MM-DD.md
└── summary/     summary-YYYY-MM-DD.md
```

Rephrase-linked notes live one level deeper:
`notes/rephrase/<course>/day-XX-YYYYMMDD.md` (one file per practice day,
associated with that day's rephrase summary).

Every daily file holds one entry per request in this shape:

```markdown
## YYYY-MM-DD HH:MM
- Key: value
- Key: value
```

For `translate`, the keys are `Input` (the user's Chinese) and `Output` (the English translation).
For `spoken`, the keys are `Input`, `Expressions`, `Register`, `Examples`, `Avoid`, and `Notes`.

## Commands

### Translate

Translate Chinese text into English. Chat output is only the translation, with no extra text. Save the entry with the append script:

```bash
python scripts/append_note.py --command translate --field "Input=今天天气很好" --field "Output=The weather is very nice today."
```

### Spoken

Give the way an American actually says the input in everyday speech. The input may be Chinese (`我认为`), English that sounds textbook-stiff (`I am of the opinion that`), or a described situation (`how to politely disagree in a meeting`).

Chat output:

1. A ranked list of 4-6 natural spoken expressions, most common first. For each one give the register (neutral / casual / very casual / slightly formal), a one-line note on when Americans reach for it, and at least one example sentence in a realistic context.
2. An `Avoid` section for versions that are grammatical but sound stiff, dated, or non-native, with a short reason.
3. A `Notes` section for pronunciation reductions, contractions, filler placement, and any Br/Am difference worth knowing.

Rules for this command:

- Prefer American English. Flag British-only variants explicitly instead of listing them as equivalents.
- Show contractions and reductions the way they are really said (`I'd say`, `gonna`, `kinda`), and note the full form when the reduction is informal.
- Sort by real spoken frequency, not by dictionary neatness. The plainest expression usually goes first.
- Keep example sentences short and situational (work, friends, meetings), not abstract textbook sentences.
- Never invent slang. If an expression is regional, generational, or dated, say so.

Save with `--command spoken`, using `Expressions` as an inline list in ranked order and `Examples` as a nested bullet list:

```markdown
## YYYY-MM-DD HH:MM
- **Input**: 我认为
- **Expressions**: I think / I feel like / I'd say / My take is / If you ask me / The way I see it
- **Register**: neutral to casual; all six work in a normal US work conversation
- **Examples**:
  - I think we should just ship it and see what happens.
  - I feel like we're overcomplicating this.
  - I'd say give it another week.
  - My take is that the timeline is too tight.
- **Avoid**: "I am of the opinion that" and "In my humble opinion" — both sound stiff or sarcastic in speech.
- **Notes**: "I think" often reduces to "I think" + dropped "that"; "I feel like" is the most common hedge among younger speakers.
```

Pass the `Examples` value as a bullet list (for example via stdin) so the script keeps the nested format.

### Define

Provide the definition, usage notes, example sentences, synonyms, and antonyms. Chat output is a structured response with `Definition`, `Usage`, `Examples`, `Synonyms`, and `Antonyms`. Save with `--command define` using bold field keys and `Examples` as a nested bullet list:

```markdown
## YYYY-MM-DD HH:MM
- **Word**: Unfortunately
- **Definition**: ...
- **Usage**: ...
- **Examples**:
  - Unfortunately, we missed the last train.
- **Synonyms**: regrettably, sadly, unluckily, unhappily
- **Antonyms**: fortunately, luckily, thankfully
```

Pass the `Examples` value as a bullet list (for example via stdin) so the script keeps the nested format. Write synonyms and antonyms as comma-separated lists whenever they are useful and unambiguous.

### Parse

Analyze the grammatical structure: subject, verb, objects, complements, clauses, sentence type, tense. Chat output is a structured breakdown with components, functions, and notes. Save with `--command parse` and fields such as `Sentence`, `Structure`, `Translation`.

### Compare

Compare two sentences and answer the user's question about them (correctness, meaning difference, grammar). Chat output is the comparison, the correctness judgment, and the reasoning. Save with `--command compare` and fields such as `Sentence 1`, `Sentence 2`, `Question`, `Answer`, `Reasoning`.

### Rephrase

Provide 3-5 alternative rephrased versions with a brief explanation of tone or context. Chat output is a bullet list of versions plus the explanation. Save with `--command rephrase` and fields such as `Original`, `Versions`, `Explanation`.

### Summary

Read today's daily files across all six command folders, count the entries in each, and produce a grouped summary. Chat output shows the counts and entries per category. Write the summary file directly (not with the append script) as `notes/summary/summary-YYYY-MM-DD.md`:

```markdown
# Summary - YYYY-MM-DD

## Total Entries: 12

## Translations (5)
- 今天天气很好 -> The weather is very nice today.
- 我在学习英语 -> I am learning English.

## Spoken (2)
- 我认为 -> I think / I feel like / I'd say / My take is
- 没问题 -> No problem / You got it / Sure thing

## Definitions (3)
- "keep back" -> Definition + examples
- "challenge to" -> Definition + examples

## Parses (2)
- "He is happy." -> Subject: He, Verb: is, Complement: happy

## Comparisons (1)
- [sentence1] vs [sentence2] -> Answer: sentence 1 is correct because...

## Rephrases (1)
- "He's really deep." -> 5 rephrased versions
```

### Help

When asked what the skill can do, list the commands with short usage examples. Save no file.

## Linking Notes to Rephrase Practice

The rephrase practice skill generates daily batches
(`days/<course>/.../day-XX-YYYYMMDD.md`) and summaries. To attach a language
note to a specific practice day, add a day reference to a command:

- `/spoken <word or phrase> from day <N>`
- `/define <word> from day <N>`
- `/parse <sentence or sentence number> from day <N>`
- `/compare <A> and <B> from day <N>`
- `/rephrase <sentence or sentence number> from day <N>`

Resolution rules:

1. Locate the day file: search `days/*/*/day-<N>-*.md`; prefer today's date,
   otherwise the latest date. A full stem such as `day-02-20260810` is used
   directly.
2. For `/define <word>` and `/spoken <word or phrase>`, find the word inside one
   of the day's numbered sentences and include that sentence as a `Sentence` field.
3. For `/parse`, `/compare`, and `/rephrase`, a number refers to the numbered
   sentence in the day file; otherwise use the quoted text.
4. Save with the append script plus `--course` and `--day`. The script adds
   the `Course` and `Day` fields automatically:

```bash
python scripts/append_note.py --command define --course "Gravity Falls" --day day-02-20260810 --field "**Word**=..." --field ...
```

5. If the word or sentence is not found in the day, fall back to the normal
   daily file under `notes/<command>/` and tell the user.

Day-linked entries are summarized by the rephrase day summary, not by the
`/summary` command (which reads only the six daily command files). They are
also published as a separate page per practice day
(`rephrase/notes/<slug>/<stem>/` on the blog), linked from both the day page
and the summary page.

## Append Script

Use `scripts/append_note.py` for every command entry so filenames, timestamps, and append behavior stay consistent:

```bash
python scripts/append_note.py --command <command> --field "Key=value" [--field "Key=value"] [--root <project-root>] [--timestamp "YYYY-MM-DD HH:MM"]
```

- `--command`: one of `translate`, `spoken`, `define`, `parse`, `compare`, `rephrase`.
- `--field`: repeatable `Key=value` pair written as `- Key: value`; the value may contain `=`.
- `--root`: project root; defaults to the current directory.
- `--timestamp`: overrides the timestamp (for example when backfilling); defaults to now.
- Set a field value to `-` to read it from stdin, which handles multiline content without shell quoting issues.

The script creates `notes/<command>/` and the daily file as needed, appends without overwriting, and prints the file path. Summary files are written directly, not with this script.

## Error Handling

| Situation | Response |
|-----------|----------|
| Request has no input to act on | "Please provide input. Example: translate 今天天气很好" |
| Unknown alias | "Unknown command. Use: translate, spoken, define, parse, compare, rephrase, summary, or help." |
| File write failure | "Failed to write to file. Please check directory permissions." |
| Same-day repeat | Append to the existing daily file; do not overwrite. |
