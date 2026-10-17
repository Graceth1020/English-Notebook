# 场景词块：编程工作（work）
动作链 drill 的场景专用固定搭配。与 chat/chunks.md 分工：那边只放**通用**表达，这里收**具体场景**的动作词块。每轮 drill 后由助手系统梳理补全，不限于纠错项——产出正确的、词库里该会没会的，一并记录。

## 修 bug 上线（Drill 16 R1, 2026-10-17）
**原句：**
> I got assigned a ticket last week. I checked the logs for stack traces to locate where the faulty code snippet was and tried to reproduce it locally. After I had located the problem, I added a fix and covered it with a test. Once all test suites were passed, I committed the change and pushed my branch. Before deploying the fix to production, I opened a pull request, got it approved and merged into main. Finally I verified it on the dashboard.

**优化版（背诵用）：**
> I got assigned a ticket last week. I checked the logs for stack traces to locate where the faulty code snippet was and tried to reproduce it locally. After I had located the problem, I added a fix and covered it with a test. Once all the tests passed, I committed the change and pushed my branch. Before deploying the fix to production, I opened a pull request, got it approved and merged into main. Finally I verified the fix on the dashboard.

| Chunk | 中文/用法 | 状态 |
| --- | --- | --- |
| get assigned a ticket | 被分到工单 | ✅产出正确 |
| check the logs for stack traces | 查日志看堆栈 | ✅产出正确 |
| locate the faulty code snippet | 定位问题代码 | ✅产出正确 |
| reproduce it locally | 本地复现 | ✅产出正确（初稿 try 自改 tried） |
| after I had located the problem | 定位之后（过去完成时用对） | ✅产出正确 |
| cover it with a test | 补个测试覆盖 | ✅产出正确 |
| once all the tests passed | 测试全过时（pass 不及物，不用被动；all + the） | 纠错：all test suites were passed |
| commit the change and push my branch | 提交并推分支 | ✅产出正确（初稿 push 自改 pushed） |
| open a pull request | 提 PR | ✅产出正确 |
| get it approved and merge into main | 过评审合进主干 | ✅产出正确 |
| deploy the fix to production | 把修复发到生产 | ✅产出正确 |
| verify it on the dashboard | 在看板上确认 | ✅产出正确 |

## 做 code review（Drill 16 R2, 2026-10-17）
**原句：**
> Whenever I get tagged as a reviewer, I pull the branch locally and skim the diff. If I find something unresonable, I leave a comment on that line or snippet. Once I've reviewed all changes and there are some unreasonable logic needs to be adjusted, I request changes. Last week I pushed back on a request because of an edge case. When the author addresses my comments, I review it again. I resolve the threads until I approve and sign off.

**优化版（背诵用）：**
> Whenever I get tagged as a reviewer, I pull the branch locally and skim the diff. If I find something unreasonable, I leave a comment on that line or snippet. Once I've reviewed all the changes and there's some logic that needs adjusting, I request changes. Last week I pushed back on a PR because of an edge case. When the author addresses my comments, I review it again. Once everything's addressed, I resolve the threads, then approve and sign off.

| Chunk | 中文/用法 | 状态 |
| --- | --- | --- |
| get tagged as a reviewer | 被标为评审人 | ✅产出正确 |
| pull the branch locally and skim the diff | 拉分支过改动 | ✅产出正确 |
| leave a comment on that line | 在某行留评论 | ✅产出正确 |
| there's some logic that needs adjusting | 有些逻辑要调整（logic 不可数；从句带 that，一句一个谓语） | 纠错：there are some unreasonable logic needs to be adjusted |
| request changes | 打回修改（reviewer 侧，最重的按钮） | ✅产出正确 |
| push back on a PR | 对 PR 提异议 | 纠错：pushed back on a request |
| address my comments | 逐条处理评论（author 侧；address 不是 reply） | ✅产出正确 |
| resolve the threads, then approve and sign off | 关掉讨论串再批准（先 resolve 后 approve，不是 until） | 纠错：resolve ... until I approve |
| once I've reviewed all the changes | 过完所有改动后（all + the，E074） | 纠错：all changes |

## 处理线上事故（Drill 16 R3, 2026-10-17）
**原句：**
> At midnight of last Saturday, I got paged because of a production incident. I joined the channel and checked the monitoring dashboard at the same time. Then I checked the logs to narrow it down to the latest deploy which we shipped just now. We talked it through in the channel and decided to roll back the release. After confirming the metric recover, I shipped a hotfix. We ran a postmortem on Monday morning to summarize the experience. I documented the root cause and shared the action items with my teammates.

**优化版（背诵用）：**
> Last Saturday at midnight, I got paged because of a production incident. I joined the incident channel and checked the monitoring dashboard at the same time. Then I checked the logs to narrow it down to the latest deploy, which we had just shipped. We talked it through in the channel and decided to roll back the release. After confirming the metrics had recovered, I shipped a hotfix. We ran a postmortem on Monday morning to go over what happened. I documented the root cause and shared the action items with my teammates.

| Chunk | 中文/用法 | 状态 |
| --- | --- | --- |
| last Saturday at midnight | 上周六半夜（时间短语直接串，不加 of） | 纠错：At midnight of last Saturday |
| get paged | 被呼叫起来 | ✅产出正确 |
| join the incident channel | 进事故频道 | ✅产出正确 |
| check the monitoring dashboard | 查监控看板 | ✅产出正确 |
| narrow it down to the latest deploy | 定位到最近一次发布 | ✅产出正确 |
| which we had just shipped | 我们刚发的（故事锚定在过去：had just shipped，不是 just now） | 纠错：shipped just now |
| talk it through | 捋一遍讨论透（E055 原题，这次全对） | ✅产出正确 |
| roll back the release | 回滚版本 | ✅产出正确 |
| after confirming the metrics had recovered | 确认指标恢复后（从句动词跟着故事框架走） | 纠错：the metric recover |
| ship a hotfix | 发热修复 | ✅产出正确 |
| run a postmortem | 开复盘会 | ✅产出正确 |
| go over what happened | 复盘发生了什么（summarize the experience 是直译） | 纠错：summarize the experience |
| document the root cause | 记录根因 | ✅产出正确 |
| share the action items with my teammates | 把待办同步给同事 | ✅产出正确 |
