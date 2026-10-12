# πAI Lab 设计交接

## 目标与边界

从第 21 版继续全局优化，交付更协调、有质感且可操作的下一版候选。稳定偏好、已否决方向和产品事实只见 [AGENTS.md](AGENTS.md)。本轮授权是保存候选、推送分支与建立 PR，不包含合并或发布；**不得修改 https://zaoqu-liu.github.io/ 及其源码**。

## 当前事实

- 分支：`feat/lab-v21-design-handoff`；基底 `origin/main` 的 `1c605d2`。原 `fix/standalone-copy-punctuation` 已由 PR #6 合并，新分支不重复引入它。
- 候选源码提交：`c8fe821a2749eb75f778ed375caaf568be7767e0`；交接及偏好文件在后续文档提交中。接手时用 `git status --short`、`git log -3 --oneline` 核对实际 HEAD，不把此处源码 SHA 当作永远不变的分支头。
- 第 20 版为用户更新的只读基底；第 21 版已构建并做过浏览器检查，**没有用户最终视觉验收或生产采纳的结论**。浏览器偶然打开第 18 版不意味着设计基底退回 18。
- `client/`、`docs/` 和部署工作流未改；实际 Pages 工作流发布 `docs/`。不要把原型 HTML 直接覆盖生产入口。
- 已提交候选所需 30 个源码、素材、许可和预览文件；其余历史 `artifacts/` 草稿仍留在原工作区，未提交、未删除，新 clone 不依赖它们。没有新 worktree。

## 入口与实际实现

以下路径均相对 `artifacts/ui-prototypes/`：

| 用途 | 入口 |
| --- | --- |
| 当前候选 / 对照 | `piai-redesign-21.html` / `piai-redesign-20.html` |
| 构建 / 页面与文案 | `build-21.mjs` / `version-21/app.tsx` |
| 全站布局、字级和主题 | `version-21/site.css` |
| 周天 | `version-21/celestial-replica/`；运动学为 `celestial-replica/kinematics.js`，24 秒循环 |
| 资源网络 | `version-21/model-dikw/` |
| 自主发现 | `version-21/autonomous-discovery.tsx`、`version-21/discovery-observatory.js`、`discovery-model.mjs` |
| 星空 / 入场 | `version-21/starlight-backdrop.tsx` / `version-21/site-motion.tsx` |
| 人员与照片 / 许可 | `discovery-data.json` / `THIRD_PARTY_NOTICES.txt` |
| 最近实际截图 | `piai-21-dark.png` / `piai-21-light.png` |

21 沿用 20 的左文右周天、内容顺序、5 篇成果、4 个系统、9 名成员和 6 位合作者；统一字级、深青/暖白/铜色材质，提供中英文、深浅主题、人物整卡主页链接。场景主题由 App 传入现有 renderer，不重建时钟。

网络是**用户选定图片 + Three.js 局部网面/光点运动的 2.5D 实现**，不是完整三维几何。Wisdom 居中，四周为 Data、Information、Knowledge、Model；不要用早期 Tool 分类覆盖此较新裁决。贴图为生成概念图，自主发现为合成主动学习演示，均不能宣传为实测发现。

## 运行与验证

在仓库根、可用的 Node.js 22+ 环境运行：

```sh
pnpm install --frozen-lockfile
node artifacts/ui-prototypes/build-21.mjs
python3 -m http.server 4318 --bind 127.0.0.1 --directory artifacts/ui-prototypes
```

打开 `http://127.0.0.1:4318/piai-redesign-21.html#home`。默认英文/深色；`?lang=zh`、`?theme=light`、`?motion=reduce` 可直达对应状态。`?frame=720` 仅用于周天定帧检查，正常演示必须移除。已有服务占用端口时复用或换端口，不杀未知进程。

- 本轮从上述提交 `git archive` 到临时目录，仅复用已有 `node_modules`，重新构建成功，输出逐字节一致；**未在全新依赖安装环境复验**。本机系统 Node 有动态库故障，本次使用已有 Codex Node，不改系统设置。
- 21 HTML SHA256：`c64d6d09557805c452aaeec53bf7ea4d73a44fc06fe85102366e00d76c8804f9`
- 20 HTML SHA256：`2ecc861a40152b40e546d82546dbb3de180831656ca29c6d33545613cdf7741f`，未改
- 上轮真实浏览器覆盖中英文、深浅主题、桌面/平板/355–390 CSS 像素窄屏、菜单焦点、主页链接、缩放、reduced motion 和主题切换时钟连续性，无横向溢出或控制台错误；修正了发现轨迹穿字和边缘裁切。本轮仅补内联许可，未改变视觉代码行为。
- 截图是定帧首屏，不能代表整段动效或用户审美认可。标题和周天字形仍有系统字体回退，跨系统一致性尚未验证。
- 自写源码空白检查通过；冻结 HTML 内的上游 shader 和原样许可仍含原始空白，未为格式检查改写基底。临时构建目录已清理。

## 下一步

先实际运行并通览 20/21 的整页和动态循环，判断最影响全局质感的少数问题，再在新候选中修订并做前后对照。不要无证据恢复旧设计、重写全部动效或直接部署。继续核查最终源码，而不是沿用前任“已优化”的评价。

### 可直接复制的启动提示

```text
请接手这个 πAI Lab 仓库，先读根目录 AGENTS.md 和 HANDOFF.md，并核对当前分支与真实运行页面。

请以具有顶级审美判断的 UI 设计师和产品经理视角，从第 21 版出发做全局优化。我要简洁、优雅、饱满、有力量感的完整网站，尤其看重平衡、比例、留白、秩序与数理美感，不接受模板拼装、空瘦松散、装饰堆砌或每个区块各自为政。以 AGENTS.md 中的细节和已否决方向为约束，不把前任自评当作事实。

先真实浏览全页、明暗主题、中英文和动效完整循环，形成少数有证据的全局判断，再直接完成一个可运行、可审阅的第 22 版候选。保留 20/21 便于对照，尊重现行 logo、内容、人员角色与动效辨识度；同时允许对影响整体品质的布局、排版、材质和节奏作有理由的调整。不要只微调颜色，也不要无依据推倒重来。

你的判断必须体现在实际画面和体验上，而不是一份建议清单。完成桌面和手机的真实验证，展示前后变化和仍存在的限制。可逆且范围内的选择直接做，只有真实事实缺口或会改变结果的产品分叉才问我。人物中有关 Zaoqu Liu 的整张卡片应打开 https://zaoqu-liu.github.io/，不得修改个人主页及其源码。本次继续做候选，不自行合并 PR 或发布生产。
```
