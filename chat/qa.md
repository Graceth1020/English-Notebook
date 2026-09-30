# Language Q&A

Language questions the learner asks mid-practice - the `[meta]` questions in
chat sessions, plus ad-hoc side questions like the ones asked in side threads -
with their answers, kept in one place for review. Newest entries go at the end
under the day's heading. Chat-side entries also appear in the session
transcript as `[meta]`; this file is the review copy.

## Day 01 - 2026-08-28

**Q:** 为什么你的纠正还是用 hot water 呢?

**A:** hot water 本身没错——我改的是 "I am going with"(时态/句式),不是"热水"这个词。英语里热水就是 hot water,完全正确;我说它"很中国"是在评论这个习惯,不是改它。

---

**Q:** *couldn't help ~ing* 和 *couldn't stop myself* 描述这句话分别怎么用?

**A:** 两个句型分开用:"I couldn't help reading it in one sitting." / "I couldn't stop myself from reading it." 要点:`couldn't help` 直接接 -ing;`couldn't stop myself` 要接 `from + -ing`。最朴素的母语说法是 "I couldn't stop reading it."

---

## Day 02 - 2026-08-29

**Q:** commute 不是动词吗?(针对 "as long as the commute is bad")

**A:** commute 既是动词也是名词。动词:"I commute by subway.";名词:"my commute is 40 minutes" / "a long commute" / "the commute"。名词在日常口语里更常用,而且本身就包含"路程+时长",所以 "commuting time" 虽然能懂但多余——母语者说 "my commute"。

---

**Q:** "at once 口语里陈旧"是什么意思?

**A:** at once 语法没错,但在日常口语里已经过时、偏书面,现在主要活在命令句("Stop it at once!")和正式文体里。口语的默认说法是 right away。所以 "I'll respond right away" 不是改语法,是换语域。(记为 chat:E014,register 类。)

---

## Day 04 - 2026-08-31

**Q:** "The business side, I'd say." —— 我只知道 the business,不知道还要加个 side,这种怎么练?

**A:** 中文的"方面"可以隐含,英文必须说出来:business/technical/coding 后面要接一个方面名词(side/part/end)。裸说 "the business",母语者会等你把话说完。这个槽位后来存为 chunk C031(the X side),在后续聊天里反复埋点练——到 Day 23 已经转为 owned。

---

## Day 05 - 2026-08-31

**Q:** for what it's worth 和 that's after the fact 分别是什么意思?

**A:**
- **for what it's worth** = "这话不一定有用/不一定中听,但说一下供你参考"——给一个可能不受欢迎的观点预先垫一句。例:"For what it's worth, I still think the testing's overkill."
- **that's after the fact** = "那已经是事后了"——等知道的时候损失已经造成。例:监控只在故障发生后报警,所以 "Monitoring helps, but that's after the fact."

---

**Q:** "By then customers already haven't got their codes." 是什么意思?这种 got 怎么理解?(像 get somebody something 一样难理解)

**A:** 这里的 got 不是 "get sb sth"(给某人某物),而是 **have got = have**(已经拿到/持有):"customers haven't got their codes" = 用户手里没有验证码 = 没收到。整句:到那时,用户已经收不到验证码了。这句后来打磨成 "by then the customer still hasn't got their code"(still + 否定,记为 chat:E030)。

---

**Q:** "Monitoring helps, but that's after the fact - by then the customer already didn't get their code." 这句话是什么意思?

**A:** 监控有用,但那是事后才告诉你——等它报警时,用户已经没收到验证码了。这句在解释为什么监控救不了这次发布:它只能发现,不能预防。

---

**Q:** "It's similar to mine" 改成了 "It looks similar",改了但没说为什么。

**A:** "is similar" 是下了结论;"looks similar" 只是第一印象——而你下一句马上说核心逻辑其实不同,hedge 正好配合这个转折:看起来像,实际不是。这处当时漏了解释行,属于"悄悄改写"失误(同批还有 figure out / key part 等四处,后来都写进了 correction-style.md 的 [optional] 规则)。

---

**Q:** 为什么改写的句子和我的原句差距这么大,是不是原句表述很不好,只能重新表述?

**A:** 不是原句差。那次改写从 Codex 自己的下一轮里"偷"了内容("there's no fallback", "the old one goes away")——这是 Codex 的错(违反了"改写只能用你说过的东西"),当场改正并给了贴近原句的版本。真正的语言问题只有那三条 fix。这一课后来成了规则:每处改动单独说明,不许悄悄重述。

---

**Q:** ("The code change costs two days" 的改写)为什么改动跟原句好像也很不一样,是原句表述问题?

**A:** 同样不是。原句意思完全能懂,真正的问题很小:cost 配时间像"损失"(工作用 take);"where I have to test carefully" 的 where 接不上 logic;"a good fit" 用于人不用于工期。改写是展示"母语者会怎么说同一个意思",不等于"你的句子失败了"。

---

**Q:** 第四轮那句 "Though for what it's worth, I still think the testing's overkill. We've got monitoring..." 存在的意义是什么?(以及:不是这个提示说要推迟到周一吗?)

**A:** 那句"让步+嘟囔"是设计来把"监控兜底"这个论点递到你手上,等你用 after the fact 反驳。但那轮结尾只有叙述、没有问题,你把它读成一个真问题("监控是不是已经覆盖了 SMS")完全合理——这是提问方的失误,后来写成 Non-Negotiable 4(每轮必须以明确的任务收尾),错记的 chat:E023 也撤了。

---

## Day 06 - 2026-09-01

**Q:** 没太看懂第二个问题(特别是 push on / sit on it / read something into 这段)。

**A:** 那句堆了三个生表达再加一个抽象问题,是问题写坏了,不是你的理解问题。三个表达:**push on** = 追问/质疑某一点;**sit on it** = 搁着不处理、不回;**read something into it** = 从一件小事里解读出(可能不存在的)含义,比如"他早上没回"被解读成"他不在乎"。之后用平实的说法重新问了一遍。

---

**Q:** "In Chinese workplace" 这个表达有什么问题?

**A:** 单数可数名词前缺限定词。三种说法都行:"In China" / "In the Chinese workplace" / "In Chinese workplaces"(复数泛指不用 the)。注意这和 coach:E008 是同一个缺口的两个方向:那边是给不可数名词多加冠词,这边是给可数名词漏加冠词。

---

**Q:** "Switching off after work is a key part of..." 改成 "a big part of work-life balance" —— 这里不能用 key part 吗?

**A:** 能用,a key part of 完全正确。big part of 只是口语里更常见的说法,key part 略带 PPT 味。这处本应标 [optional],当时没标,是四处漏标之一——你每次都得追问才发现,所以后来定了规矩:原句没错却要换说法的,必须明说"你的没错,这只是更口语"。

---

**Q:** "I'll figure out the reason" 和 "I'd want to know why" 有什么区别?为什么改了?

**A:** 两句都对。figure out the reason = 去查明原因,偏"过程/动作",像立项调查;want to know why = 出事后第一反应的"我想知道为什么",更口语也更有人味。那句语境(反思加班是谁的责任)母语者会用短的那个。你的没错——这又是 [optional],不是改错。

---

## Day 08 - 2026-09-02

**Q:** 如果要用 during 说国庆假日,应该怎么描述?

**A:** 单说节日名不加 the:"during National Day";节日名 + holiday/break/week 要加 the:"during the National Day holiday" / "during the Spring Festival break"。

---

**Q:** 没有太看明白第五轮的问题是什么意思。

**A:** 原问题先叙述了结论再提问,把任务埋了(同一类失误后来写成 Non-Negotiable 4)。重新问成:如果远程工作真的来了,你多久回一次家、每次待多久?(how often + how long,任务前置。)

---

**Q:** 「站不住」怎么理解?(总结里说我的三个理由站不住)

**A:** "doesn't hold up" / "doesn't hold water" —— 经不起追问,一推就倒。这个问题还揪出了总结本身的夸大:你的三个理由不是不成立,而是不完整——都是同一个没说出口的约束的下游。总结已改正;这个答案还顺手存了三个 chunk:C055 doesn't hold up / C056 that's a symptom, not the reason / C057 that's downstream of。

---

## Day 09 - 2026-09-03

**Q:** "hands you a year's salary" 难理解,是因为对地道表达还不够熟悉吗?

**A:** 拆成三块:**hands you** = 白给你/直接塞给你(地道表达,确实要见过才熟);**a year's salary** = 时间段的所有格,"一年的工资"(这是语法,不是地道问题);真正的原因一半是表达,一半是那句问题太长、任务压在最后。之后改成任务前置重新问。

---

**Q:** "With AI developing quickly" 是特意练的 with 句型,但被改了,是写得不好吗?

**A:** 不是,你写得对——那是 P001 句型 drill 后第二天的首次主动产出,唯一该做的是表扬,却被当成 bookish 改写了。错在 Codex:开场检查漏查了 pattern 清单。之后改了三处:session 流程必查 patterns、新增 Non-Negotiable 11(drilled 句型的首次产出只表扬不纠正)、总结表加 good 标签。P001 记为 used 1/2。

---

## Day 11 - 2026-09-06

**Q:** "it is so awesome that I couldn't put it down" -> "it's so good I can't put it down",为什么 awesome 变成了 good?

**A:** 两个原因:(1) `so ... that` 里要普通程度形容词,awesome 本身已是顶格,和 so 语气重复;(2) 口语里 awesome 已经贬值成"不错",反而没有 so good 有分量。而且这是第三次在这个词上被改(Day 01 "They are awesome"、Day 07 "That's awesome")——一个万能评语反复顶替你真正想说的细节:中文一个"太棒了"能收尾,英文通常要说出具体哪里好。已记为 chat:E054。

---

**Q:** "I plan to finish it over this season" -> "I'm hoping to get through it by the end of the quarter",为什么 plan 变成了 hoping to?

**A:** 这处改写后来被**撤回**了:plan 是有安排的计划,hoping to 是没把握的期望——你的原句既准确又正确,改成 hoping to 反而弱了。真正该改的只有 season:英文 season 是四季或剧集的"季",工作里的季度是 quarter(存为 C068 by the end of the quarter)。

---

**Q:** whole thing 里 "not only... but also" 的平行结构怎么没了?

**A:** 你的结构可以保留,但两边必须平行:"not only helps... but also improves"(你写了 helps / improve,所以 fix 是 improves)。第一版改写把整句换成 "It doesn't just help..., it improves...",框架整个消失——改写句要保留可练习的结构,撤框架属于另一种悄悄改写,已改正。附注:not only... but also 本身偏书面,口语确实更常说 "doesn't just ..., it ...",但要换也得在表格里单独标一行,不能偷换。

---

## Day 12 - 2026-09-08

**Q:** "Can you not just start and see how far you get?" 是什么意思?

**A:** "就不能先做起来,边做边看能推进到哪吗?" —— Can you not just...? 不是字面反问"你不能吗",是带催促的建议;see how far you get = 看能推进到什么程度。这轮后来被判"超纲":回答它需要的不是英语而是谈判策略,话题当场换掉,并写成 topics.md 的难度上限(同伴级对话,不许有需要策略才能答的题)。

---

## Day 13 - 2026-09-10

**Q:** "No matter which company you work for..." —— No matter 那个句型不能用吗?

**A:** 能用,而且这次产出是 P005 在 55 轮跟踪里的首次出现——该记 pattern-used。改写却把它悄悄换成了 Whichever:单看两个都对(whichever 更短),但这是把 [optional] 伪装成修改,还抹掉了一个零产出句型的证据。这一课写进了 correction-style.md:每处差异一行说明,没有例外。你的 no matter which 成立。

---

## Day 14 - 2026-09-11

**Q:** "especially whether they are kept to date or not" 这句话为什么改了?

**A:** 你的句子语法没错,但 "big on" 后面接 whether 从句很别扭("重视" + "是否……"两种结构打架)。自然说法是 "especially about keeping them up to date"。这处改写当时没给解释行,一问就补上了(总结 exchange 3 第 9 行)——和 Day 13 的 whichever 是同一类失误。

---

**Q:** for what it's worth 该怎么用好一点?

**A:** 放在一个你估计对方不太爱听的观点前面,预先垫一下:"For what it's worth, I still think the testing's overkill." 两个注意:(1) 它修饰观点/看法,不修饰事实和请求;(2) 别和别的弱化词叠用(不要再加 I think / maybe)——一句话一个垫子就够。

---

## Day 15 - 2026-09-13

**Q:** "For what it's worth, I think a message is well." 可以这样说吗?(想表达:虽然开了会,但一个 message 就够了)

**A:** 两处要修。(1) "a message is well" —— well 是副词,这里要形容词 fine/good/enough;更地道:"a message would have been fine" 或 "a message would have done (it)"。(2) for what it's worth 后面又叠 I think,是双重弱化——FWIW 本身就是垫子,删掉 I think。整句:"For what it's worth, a message would have done."

---

**Q:** 如果用 "or add it" 这个方案(Every time we do..., it helps...),这句话应该怎么写?

**A:** "Every time we do what we enjoy, it helps us unwind." every time 引导的是时间状语从句,主句还得有自己的主语(it)。少了 it,every-time 从句就被顶到主语位置上,正是 chat:E059 记的那个坑。

---

**Q:** 有没有其他的连词也容易出现这种"不能当主语"的问题?

**A:** 有,同一族:whenever("Whenever working from home" 后面要接主语+动词)、every time、although/though、because of 接从句、叠用的 if 从句。判断口诀:这些都是状语连接词,负责给句子挂时间/条件框架,自己永远不能当主句主语。写完检查主句有没有自己的主语,没有就是警报。

---

**Q:** 为什么 "I play it myself" 改成 "by myself"?

**A:** "I play it myself" = 我"亲自"玩,强调自己动手、不是别人代劳(myself 是强调代词);"I play it by myself" = 我"一个人"玩,强调独自。你想说的是一个人玩,所以用 by myself。

---

## Day 21 - 2026-09-19

**Q:** on / in / to 这些介词怎么练?比如 in the province,这里用 in 对吗?(在两次练习之间问的)

**A:** "in the province" 是对的。地点三兄弟:**in** 用于有范围的区域(in Jieyang / in the province / in China),**at** 用于点(at the station / at the door),**on** 用于表面和街道(on the road / on the table)。介词目前不走单独 drill,靠在 chat 纠错里逐条记(chat:E029 reply to、chat:E068 被动施动者用 by 等),重复出现的会升级成 pattern。

---

## Day 22 - 2026-09-20

**Q:** 为什么改写里 "which means" 换成了 "so"?

**A:** "which means" 没错——语法正确,只是略书面。那处真正的修改是宾语("play it" -> "play games on it",玩的是游戏不是手机)。which means -> so 只是口语化偏好,本应单独标 [optional],却被捆进了修改行——你一问就发现了,记为一次漏标。

---
## Day 24 - 2026-09-30

**Q:** What does "the kind where your stomach drops the moment you see it"
mean?

**A:** That split-second sinking feeling when you realize something has gone
badly wrong - like the floor gives way inside you. So the phrase means "the
kind of bug that hits you with instant dread the second you spot it" - say,
you see the error in production and immediately know it is your code.
(心里咯噔一下 / 胃里一沉。)

---

**Q:** 怎么辨别用 for 还是用 to?("built a coupon feature ___ our pay module")

**A:** 动词决定介词,不看后面的名词:
- **to 类 = 方向/目标**(把 X 放进 Y 里):add X **to** Y, attach **to**,
  connect **to**, move **to**。
- **for 类 = 受益/服务对象**(为 Y 做 X):build X **for** Y, make **for**,
  design **for**, write **for**。
- 判断法:能换成"**为** Y 做 X" → for;能换成"**把** X 放进/接到 Y" →
  to / into。
- 注意 build X **into** Y 是另一个意思:把逻辑内嵌进模块、成为它的一部分,
  这时候 build 带上了"放进去"的画面,所以用 into。

