# Error Log

Errors the learner actually produced, with the natural version and a
spaced review date. `Hits` counts how many times the pattern recurred.
Rows are resolved only after the correct form appears unprompted.

| ID | Pattern | Category | You said | Say instead | Lesson | Hits | Status | Next review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E001 | function drift: rephrases the idea, not the act | function | let me figure it out (for 'get this straight') | Let me get this straight - you're saying X? | seed | 2 | open | 2026-08-31 |
| E002 | phrasal verb goes blank | phrasal-verb | (no attempt) | go through / push back / move out / follow up | seed | 3 | open | 2026-09-10 |
| E003 | fixed phrase flattened to plain words | fixed-phrase | during my life | back in my day | seed | 1 | open | 2026-08-27 |
| E004 | bookish register in speech | register | method / approval / moreover | way / sign-off / and also | seed | 2 | open | 2026-09-03 |
| E005 | Chinese calque | calque | my heart / make it | I'd love that / I'm on it | seed | 3 | open | 2026-09-10 |
| E006 | collocation: wrong verb for noun | collocation | play a joke / greet to / cause anything bad | pull a prank / say hi to / cause any problems | seed | 1 | open | 2026-08-27 |
| E007 | copies the prompt verbatim | other | (returns source sentence) | rebuild the frame in your own words | seed | 3 | open | 2026-09-10 |
| E008 | article with uncountable noun | grammar | a long-term backend developing experience / a large scale traffic | solid backend experience / large-scale traffic | 01 | 3 | open | 2026-09-10 |
| E009 | ineffective vs inefficient | other | The select query SQL is ineffective | the query is inefficient | 01 | 1 | open | 2026-08-27 |
| E010 | question for issue/problem | calque | the core question is on the application layer | the root cause is in the application layer | 01 | 1 | open | 2026-08-27 |
| E011 | purpose clause: in order for X to Y | grammar | in order the system can easily migrate a microservice architecture | so that we can migrate to microservices later | 01 | 2 | open | 2026-09-01 |
| E012 | pushes back without giving own number | function | two days is not enough | I'd put it closer to a week | 01 | 3 | open | 2026-09-10 |
| E013 | will + adjective, missing 'be' | grammar | I'll happy to accept it | I'd be happy to go with your call | 01 | 2 | open | 2026-09-03 |
| E014 | premature capitulation in disagreement | tone | If you stick to your thought, I'll happy to accept it | Happy to talk it through if you still prefer inheritance | 01 | 2 | open | 2026-09-01 |
| E015 | be + adjective: 'I am worry' | grammar | I am worry about the scale of team | I'm worried about the size of the team | 01 | 1 | open | 2026-08-27 |
| E016 | circular proposal: restates what you argued against | other | design our system by using microservice concepts ... to migrate to microservice architecture | keep it a modular monolith with clean boundaries | 01 | 1 | open | 2026-08-27 |
| E017 | over-apologizing / self-diminishing opener | tone | I'm sorry for making misunderstanding | Sorry, I wasn't clear - let me put it differently | 01 | 3 | open | 2026-09-11 |
| E018 | answers a different question than the one asked | function | (asked what we avoid paying for; answered who owns which module) | name the specific cost avoided, then add the extra benefit | 01 | 1 | open | 2026-08-27 |
| E019 | plural after 'each of' | grammar | each of our four teammate | each of the four of us / each of our four teammates | 01 | 1 | open | 2026-08-27 |
| E020 | broken correlative: the more X, the -er Y | grammar | The more services we have, the long call chain it will | the more services we add, the longer the call chain gets | 01 | 1 | open | 2026-08-28 |
| E021 | calque: meet a problem | calque | two problems we'll meet | two problems we'd run into / hit | 01 | 1 | open | 2026-08-28 |
| E022 | imprecise technical term | register | network delay | network latency | 01 | 1 | open | 2026-08-28 |
| E023 | same thought WITH you (preposition) | preposition | I had the same thought with you | I thought the same thing / the same as you | 01 | 1 | open | 2026-08-28 |
| E024 | word repetition in one sentence | register | The logic of querying issues has significant issues | the query logic has a real problem | 01 | 1 | open | 2026-08-28 |
| E025 | vague fix instead of naming the fix | function | optimizing the application layer code | batching it into a single query with a join | 01 | 1 | open | 2026-08-28 |
| E026 | exceptional for unusual/abnormal | calque | this exceptional metric | that spike / those numbers looked off | 01 | 1 | open | 2026-08-28 |
| E027 | demonstrative + plural mismatch | grammar | See this code snippets | Take a look at this snippet / these snippets | 01 | 1 | open | 2026-08-28 |
| E028 | gives mechanism but omits effort estimate | function | using a batch query. Like each batch contains only 500 orders. | batch it in chunks of 500 - about half a day | 01 | 2 | open | 2026-09-01 |
| E029 | concedes their number then contradicts it | function | Two days is enough for correcting the code logic. However, the logic here is very complicated. | Two days covers the code change itself, but not the testing around it | 02 | 1 | open | 2026-08-28 |
| E030 | calque: related influence / analyze the influence | calque | analyze the related influence | check what else it affects / trace the downstream impact | 02 | 1 | open | 2026-08-28 |
| E031 | restates the number instead of justifying it | function | Two days is too short and a week is enough. | cut the restatement; give the reason instead | 02 | 1 | open | 2026-08-28 |
| E032 | overly forceful modal: 'we must' | register | we must trace the downstream impact | we'd need to / we also have to | 02 | 1 | open | 2026-08-28 |
| E033 | at the same time as filler | calque | trace the downstream impact at the same time | (drop it) / on top of that | 02 | 1 | open | 2026-08-28 |
| E034 | gerund vs infinitive as subject | grammar | Add a new channel will bring some complexity | Adding a new channel would bring / That would add | 02 | 1 | open | 2026-08-28 |
| E035 | no number for the new scope | function | It seems a week is too short to complete this | SMS is about three days on its own | 02 | 1 | open | 2026-08-28 |
| E036 | hedge stack weakens a firm position | tone | It seems a week is too short | A week doesn't cover SMS | 02 | 1 | open | 2026-08-28 |
| E037 | reuses coach's model phrasing verbatim | other | I'd rather ship the batching fix this week and complete the SMS ticket next week | rebuild in own words; borrow the frame, not the sentence | 02 | 1 | open | 2026-08-28 |
| E038 | justifies estimate by own inadequacy, not the work | tone | I just touch this system for half a year, I should analyze the downstream impact carefully. So a week is a more reasonable length for me. | The week isn't about speed - it's what the change touches | 02 | 2 | open | 2026-09-02 |
| E039 | present simple for duration (needs present perfect) | grammar | I just touch this system for half a year | I've only been working on this system for six months | 02 | 1 | open | 2026-08-28 |
| E040 | professional for skilled/experienced | calque | she is really more professional than me | she knows this system better than I do | 02 | 1 | open | 2026-08-28 |
| E041 | cost vs take for time | calque | he will cost a week | it'll take a week | 02 | 1 | open | 2026-08-28 |
| E042 | so that (result) used for purpose/need | grammar | will be changed so that I should confirm | changes, so we need to confirm | 02 | 1 | open | 2026-08-28 |
| E043 | generic 'he' for unknown person | register | No matter who does this job, he will... | whoever does it / anyone doing this | 02 | 1 | open | 2026-08-28 |
| E044 | it's my fault to do (instead of should have + p.p.) | fixed-phrase | It's my fault not to flag it | I should have flagged it Monday | 03 | 1 | open | 2026-08-29 |
| E045 | promises character instead of a mechanism | function | I'll never make such a mistake whenever the same situation happens | From now on, if I turn anything off in prod, I'll post it the same day | 03 | 1 | open | 2026-08-29 |
| E046 | passive missing be (will send / will not be sent) | grammar | all notifications backlogged will send by a task | will be sent by a task | 03 | 1 | open | 2026-08-29 |
| E047 | over-explains before answering the question asked | function | The code change had been completed. But during the testing... | No - I held it. ... QA sign-off by Friday. | 03 | 1 | open | 2026-08-29 |
| E048 | impact on as a verb | calque | In order not to impact on the production environment | I didn't want to break prod | 03 | 1 | open | 2026-08-29 |
| E049 | states a decision as a preference (I prefer...) | function | I prefer to use PostgreSQL for the audit-log service | Postgres. | 04 | 2 | open | 2026-09-04 |
| E050 | deference undoes own stated position | tone | I work for the company, not the company works for me | that's where I'd add the most value here | 04 | 1 | open | 2026-08-30 |
| E051 | need not to (formal + wrong to) | grammar | we need not to deploy a new database service | we don't need to deploy a new database service | 04 | 1 | open | 2026-08-30 |
| E052 | I'm glad (pleased) vs I'd be glad (willing) | grammar | I'm also glad to learn anything new on backend | I'd be glad to pick up whatever's new | 04 | 1 | open | 2026-08-30 |
| E053 | passive receive hides the blocker | function | If I can receive the spec this week | If legal gets me the spec this week | 04 | 1 | open | 2026-08-30 |
| E054 | ordinal dates without the | grammar | will be done by 10th ... by 25th | by the 10th ... by the 25th | 04 | 1 | open | 2026-08-30 |
| E055 | dismisses a senior's experience instead of conceding the concern | tone | Your pass experience is right, but it's not suited for our system | That's fair, and I'd rather not migrate under pressure either - but our numbers are different | 05 | 1 | open | 2026-08-31 |
| E056 | empty framing verb around a number | function | 2M rows a day is given according to our current situation | We're at 2M rows a day, and monthly partitions handle that | 05 | 1 | open | 2026-08-31 |
| E057 | as vs as for | preposition | As the bottleneck on write throughput problem | As for the write-throughput bottleneck | 05 | 1 | open | 2026-08-31 |
| E058 | have the ability to (heavy paraphrase of can) | collocation | doesn't have strong ability to support mutil-table queries | doesn't do multi-table queries well | 05 | 1 | open | 2026-08-31 |
| E059 | concedes a premise wholesale instead of splitting it | function | Audit logs are exactly the write-heavy, schema-flexible workload document stores are built for | Agreed on the schema flexibility - but our schema is fixed | 05 | 1 | open | 2026-08-31 |
| E060 | dangling to solve / to do at clause end | grammar | we can design a new solution like backup old data regularly to solve | we can partition and archive old data | 05 | 1 | open | 2026-08-31 |
