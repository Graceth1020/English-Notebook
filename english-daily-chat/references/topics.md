# Topic Pool

One topic per session. Check `chat_log.py recent-topics` first and skip anything
used in the last 14 sessions. Prefer a topic that would naturally pull for the
expressions due for hidden review.

## Weekly Mix

Baseline per week of sessions: **3-4 daily-life topics, 2 work topics, and 1
opinion or hypothetical topic.** Work topics stay casual - chatting with a
colleague, not presenting to a manager.

**The due queue overrides the baseline.** `function` and `tone` rows cannot be
reached by a daily-life topic; they need a `work` or `opinion` setting where
Codex holds a mild position and the learner has to respond to pushback. When
those categories dominate the due list, run more work/opinion days that week and
let the daily-life share drop. Check `chat_log.py recent-topics` for the running
category counts.

Difficulty rises gradually across weeks - not by using harder words, but by
asking for longer turns, more narration, and more opinion:

- Weeks 1-2: concrete and personal. What you did, what you like, what happened.
- Weeks 3-4: narration and reasons. Tell a story, explain why, compare two things.
- Weeks 5+: opinion, hypotheticals, and mild disagreement, where the learner has
  to take a position and defend it in a few sentences.

## Daily Life (`daily`)

Weekends and days off; food and cooking; coffee and tea habits; sleep and
mornings; commuting; the neighborhood you live in; apartment hunting; keeping
plants or pets; exercise you keep quitting; games you're playing; a show you
just finished; music while working; last trip you took; a trip you keep
postponing; phone and gadget habits; online shopping regrets; weather and
seasons; haircuts and small errands; how you spend money; a hobby you picked up
and dropped; family visits; friends you've kept since school; parties and
socializing; being ill and going to the doctor; superstitions and habits you
can't explain.

## Work and Collaboration (`work`)

The last bug that ruined your day; how your team does standups; code review that
went sideways; working with a designer; estimating how long something takes; a
tool you'd refuse to give up; remote vs office; a meeting that should have been a
message; onboarding somewhere new; explaining your job to your parents; a side
project; interviews you've been through; what you'd want in your next job;
being interrupted all day; documentation nobody reads; on-call and incidents.

## Opinion and Mild Debate (`opinion`)

Is remote work better; do you need to be passionate about your job; are ratings
and reviews trustworthy; should everyone learn to code; is AI making people worse
at their craft; city vs small town; buy or rent; big company vs startup; is
multitasking real; paying for software vs free alternatives; social media worth
keeping.

Keep debate light. Codex takes a mild position and pushes back once or twice, so
the learner has to hold their ground - never a full argument. This is also the
setting that exposes `function` and `tone` habits: whether the learner concedes
too fast, apologizes for having a view, or states a preference where a decision
was asked for. Push back exactly once when a seeded `tone` row is in play, then
let it go.

## Hypotheticals and Storytelling (`hypothetical`)

A year off with money handled; moving to another country; hosting a friend
visiting your city for two days; giving advice to yourself five years ago; a
skill you'd absorb instantly; the worst travel day you can imagine; a small
invention that would fix your daily annoyance; explaining your city to someone
who's never been.

## Culture and Language (`culture`)

Small talk that feels fake to you; how directness differs between cultures;
humor that doesn't translate; holidays and what people actually do; gift-giving
rules; tipping and service; things foreigners get wrong about your city; English
phrases you've never dared to use.

## Selection Notes

- Announce the topic in one line, then ask the first question in the same
  message. No framing, no goal statement.
- The first question is the one piece of engineering in the session: it should
  make a due chunk the obvious answer while looking like ordinary curiosity.
- Choose the topic that covers the largest **cluster** of due chunks rather than
  the one that fits the single oldest chunk. Three chunks from one domain beat
  three unrelated ones spread across five exchanges, and a topic that carries a
  cluster will usually pick up an error seed for free.
- The topic is a starting point, not a syllabus. If the learner takes it
  somewhere else, follow.
- If a topic dies after two exchanges, pivot once to a neighboring topic instead
  of interrogating the learner. With only five exchanges in a session there is
  room for exactly one pivot, and none after exchange three.
