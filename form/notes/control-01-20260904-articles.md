# Control 01 - articles, in isolation

Date: 2026-09-04 | Type: control (conventional drill) | Items: 12 | Correct: 12/12

> **This is the control, not the method.** A conventional drill: one form class,
> announced in the heading, no content load, twelve discrete items. It lives in
> `form/notes/` rather than `form/summaries/` because it does not have the
> round-and-axis shape the form-drill importer parses, and forcing it into that
> shape would misrepresent what it was.
>
> It is kept because its perfect score is the evidence that no knowledge gap
> exists - which is what justified building the scheme-A instrument in
> `form-01-20260904.md`. Do not copy it as a template; see
> `english-daily-chat/references/form-drills.md`.

## Why This Was Run

`chat:E031` (singular countable noun with no article) had reached **5 hits across 5
consecutive sessions** - Day 06 *In Chinese workplace*, Day 07 *off game forum*,
Day 08 *the train tickets*, Day 09 *relationship*, Day 10 *the network congestion*.
Conversational seeding had failed five times running, and the review scheduler had
pushed the next review to 2026-10-04 on a hits-based interval, which is wrong for an
error appearing daily.

`coach:E008` is the same gap running the other way - articles ADDED to uncountables
(*a solid backend experience*, *a large-scale traffic*). Two opposite directions was
the reason to suspect the problem was not articles at all.

Not filed as a pattern. `patterns/inventory.md` is for structures that are *absent*
and never wrong; articles are wrong every time and carry error rows, so `P0NN` would
have corrupted that table's semantics and `pattern-next`'s ordering. This is a
separate one-off, run manually to test whether a drill was even the right instrument.

## The Rule Taught

Before the noun, ask one question: **can it follow "one"?**

```
one forum    -> yes -> countable -> singular needs a / the / my  ->  a game forum
one traffic  -> no  -> uncountable -> bare when general          ->  network congestion
```

Then, if countable: listener doesn't know which -> `a`; listener knows which -> `the`;
whole category -> bare plural (`train tickets`).

All twelve items are the learner's own sentences from Days 01-10. No invented examples.

## Round 1 - Decide

**1.** I get guides off ___ game forum.

**中文：**从某个游戏论坛上找攻略。

**You wrote:**
> a

**Answer:**
> a game forum

**Verdict:** ok

---

**2.** That came down to ___ network congestion.

**中文：**归结于网络拥塞（泛指现象）。

**You wrote:**
> /

**Answer:**
> network congestion

**Verdict:** ok

---

**3.** It's really hard to get ___ train tickets for that week.

**中文：**那周的火车票很难抢（泛指）。

**You wrote:**
> /

**Answer:**
> train tickets

**Verdict:** ok

---

**4.** It's hard for ___ LLM to design the process.

**中文：**大模型很难设计这个流程。

**You wrote:**
> an

**Answer:**
> an LLM

**Verdict:** ok

**Why:** Not just correct but correct for the harder reason - *L* is read /el/, so it
takes *an* despite being a consonant letter.

---

## Round 2 - Both Directions Mixed

Five sentences: some missing an article, some carrying one they should not, and one
already correct.

**5.** In Chinese workplace, this might be a problem.

**中文：**在中国的职场里，这可能是个问题。

**You wrote:**
> In a Chinese workplace, this might be a problem.

**Answer:**
> In a Chinese workplace (or: In the Chinese workplace)

**Verdict:** ok

---

**6.** I've got a solid backend experience.

**中文：**我有扎实的后端经验。

**You wrote:**
> I've got solid backend experience.

**Answer:**
> solid backend experience

**Verdict:** ok

---

**7.** A remote job would mean no commute at all.

**中文：**远程工作意味着完全没有通勤。

**You wrote:**
> A remote job would mean no commute at all.

**Answer:**
> already correct - no change needed

**Verdict:** ok

**Why:** The trap item. Four of five needed changing, and he left this one alone
instead of editing something to look productive.

---

**8.** I like working from library or coffee shop.

**中文：**我喜欢在图书馆或咖啡馆工作。

**You wrote:**
> I like working from a library or a coffee shop.

**Answer:**
> from a library or a coffee shop

**Verdict:** ok

**Why:** Both nouns supplied, not just the first - which is where this normally breaks.

---

**9.** We handle a large-scale traffic.

**中文：**我们处理大规模流量。

**You wrote:**
> We handle large-scale traffic.

**Answer:**
> large-scale traffic

**Verdict:** ok

---

## Round 3 - Free Production

Situation only, no sentence given.

**10.** Say where you go to write code at weekends.

**中文：**说明你周末去哪儿写代码。

**You wrote:**
> I went coding in a coffee shop.

**Answer:**
> in a coffee shop

**Verdict:** ok

**Why:** Article correct. Unmarked because it is out of scope for this drill: *went
coding* should be *go coding* or *I'll go and code* - the question was about a habit,
so present tense. Noted only, not counted.

---

**11.** Explain what the root cause of Saturday's outage was.

**中文：**解释周六那次故障的根本原因是什么。

**You wrote:**
> The root cause of the error on Saturday was network congestion.

**Answer:**
> The root cause ... the error ... network congestion

**Verdict:** ok

**Why:** Three article decisions in one sentence, all correct and all different -
`the` for a unique thing, `the` for a specific known event, bare for a general
substance.

---

**12.** Say you want to build a learning system that links different things you learn.

**中文：**说你想做一个学习系统，建立不同知识之间的关联。

**You wrote:**
> I want to build a learning system which helps build relationships between things I learn.

**Answer:**
> a learning system ... relationships

**Verdict:** ok

**Why:** `relationships` is the exact word he got wrong on Day 09 as a bare singular -
the fourth hit on `chat:E031`. Correct here without prompting.

## What Went Wrong

Nothing. 12/12, including the trap item and the /el/ vowel rule.

## What The Score Actually Means

**A perfect score here does not show the problem is fixed - it shows the drill was
measuring the wrong thing.**

Per `pattern-drills.md`: ten out of ten in a drill means the structure was available
*while it was the announced subject of the exercise*, which is recognition. The
learner's accepted self-diagnosis since Day 04 is that his knowledge is
recognition-level rather than recall-level. So this drill tested the one register he
was never weak in.

What it does establish, and this is worth having: **there is no knowledge gap.** The
countable/uncountable judgement is sound, `a` versus `the` is sound, and the /el/ rule
was known. So `chat:E031` is not something he has to learn. It is an attention-
allocation failure.

Which makes it the same shape as `chat:E037` (present tense inside a hypothetical):

| | `chat:E037` tense | `chat:E031` articles |
| --- | --- | --- |
| Tested in isolation | correct | 12/12 |
| In live production | first verb right, then drifts | dropped while composing content |
| Diagnosis | rule known, cannot hold it while speaking | identical |

Both are *correct under attention, wrong under production*. And that class of error
has an awkward property: **a drill cannot fix it, because a drill supplies exactly the
thing that is missing during real speech - attention.** He scored 12/12 partly because
the heading said the subject was articles.

## Carry Forward

1. **A conventional drill is finished for this error.** Repeating it would produce
   another 12/12 and no transfer.
2. **What has never been tested: production under content load.** Ten sessions, and he
   has never once had to answer a genuinely hard question while only ONE narrow form
   class was being marked. That is the next instrument to try - hard content, attention
   fully on meaning, feedback restricted to form.
3. **`chat:E031`'s review date is wrong.** 2026-10-04 was set by a hits-based interval
   that assumes more hits means better learned. For an error recurring daily, hits
   should shorten the interval, not lengthen it. Left as-is for now and recorded here,
   because changing the scheduler affects every row in both logs.
