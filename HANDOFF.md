# πAI Lab 设计交接

## 目标与边界

从第 21 版继续全局优化，交付更协调、有质感且可操作的下一版候选。稳定偏好、已否决方向和产品事实只见 [AGENTS.md](AGENTS.md)。本轮授权包含保存第 21 版、官网内接入个人页、更新两张人物卡、推送分支与建立 Draft PR，不包含合并或发布。原 `zaoqu-liu.github.io` 仓库与线上个人站不改；官网内副本按用户新要求接入。

## 当前事实

- 分支：`feat/lab-v21-design-handoff`；基底 `origin/main` 的 `1c605d2`。原 `fix/standalone-copy-punctuation` 已由 PR #6 合并，新分支不重复引入它。
- 当前候选以本分支 HEAD 的 `version-21/` 和构建 HTML 为准，续接时先核对 `git status --short`、`git log -3 --oneline`。对应 [Draft PR #7](https://github.com/piai-lab/piai-lab.github.io/pull/7)，未合并、未部署。
- 第 20 版为用户更新的只读基底；第 21 版已构建并做过浏览器检查，**没有用户最终视觉验收或生产采纳的结论**。浏览器偶然打开第 18 版不意味着设计基底退回 18。
- 新增 `client/public/people/zaoqu-liu/` 与派生的 `docs/people/zaoqu-liu/`；原 `client/src/`、`docs/index.html` 和部署工作流未改。Pages 实际发布 `docs/`，21 仍是独立候选，不能将其视为官网首页已上线。
- 候选依赖、必要素材和许可已提交；其余历史 `artifacts/` 草稿仍留在原工作区，未提交、未删除，新 clone 不依赖它们。没有新 worktree。

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
| 最近实际截图 | `piai-21-dark.png` / `piai-21-light.png` / `piai-21-people.png` / `piai-21-team-groups.png` |

21 沿用 20 的左文右周天、内容顺序、5 篇成果、4 个系统、9 名成员和 6 位合作者；最新调整将 Team / 团队成员和 Collaborators / 合作者分成两个同级、全展开区块，导航用 Team，保留 `#people` 链接；统一字级、深青/暖白/铜色材质，提供中英文、深浅主题、人物整卡主页链接。场景主题由 App 传入现有 renderer，不重建时钟。

网络是**用户选定图片 + Three.js 局部网面/光点运动的 2.5D 实现**，不是完整三维几何。Wisdom 居中，四周为 Data、Information、Knowledge、Model；不要用早期 Tool 分类覆盖此较新裁决。贴图为生成概念图，自主发现为合成主动学习演示，均不能宣传为实测发现。

## 官网内个人页

- 唯一维护源：`client/public/people/zaoqu-liu/`，12 个静态文件。源来自个人站提交 `942051ddc9fa4b1927d4839a3e051dc88afc2a45`；2026-10-12 下载的线上首页与该本地首页 SHA256 均为 `b6b5c8d8ab94fdcc2698bb3ff7f6b14d0134d18991e8652b305c97d78042f354`。原个人仓库工作树保持干净。
- 仅适配 canonical、站内返回链接及语言/主题延续，不改原页面的文案、布局或动效。个人内容与肖像不属于实验室 MIT 授权；原第三方许可及此边界已随页保留。
- `node scripts/build-founder-profile.mjs` 从唯一源生成 `docs/people/zaoqu-liu/` 和原型旁的预览副本；`build-21.mjs` 已调用该步骤。不要手改两份产物。Vite 正常构建也会复制 public 到 `dist/public/`。
- Zaoqu 整卡同页进入 `/people/zaoqu-liu/?lang=…&theme=…`。个人页返回链接在 Pages 指向 `/`，在原型中指向 `/piai-redesign-21.html`，均延续语言和主题。
- 贺福初整卡外链用户最终指定的 `https://www.pi-hub.org.cn/news/news/%2091`（HTTP 200）；英文身份是 **President, IAPM**，下一行保留 **Academician of the Chinese Academy of Sciences**。这取代先前百度百科链接和全拼机构称谓。

## 运行与验证

在仓库根、可用的 Node.js 22+ 环境运行：

```sh
pnpm install --frozen-lockfile
node artifacts/ui-prototypes/build-21.mjs
python3 -m http.server 4318 --bind 127.0.0.1 --directory artifacts/ui-prototypes
```

打开 `http://127.0.0.1:4318/piai-redesign-21.html#home`。默认英文/深色；`?lang=zh`、`?theme=light`、`?motion=reduce` 可直达对应状态。`?frame=720` 仅用于周天定帧检查，正常演示必须移除。已有服务占用端口时复用或换端口，不杀未知进程。

- 此前从 `beed1a11505a2fcc83d71d067a40d1983d2338f4` 的 `git archive` 到临时目录，仅复用已有 `node_modules`，重新构建成功，输出逐字节一致；**未在全新依赖安装环境复验**。本机系统 Node 有动态库故障，本次使用已有 Codex Node，不改系统设置。
- 21 HTML SHA256：`149162c58741dd64702dfba8be2c4170ebf2ac4f49ec4f001c8fd05691c94716`
- 20 HTML SHA256：`2ecc861a40152b40e546d82546dbb3de180831656ca29c6d33545613cdf7741f`，未改
- 上轮真实浏览器覆盖中英文、深浅主题、桌面/平板/355–390 CSS 像素窄屏、菜单焦点、主页链接、缩放、reduced motion 和主题切换时钟连续性，无横向溢出或控制台错误；修正了发现轨迹穿字和边缘裁切。本轮追加验证最终人物卡、个人页同标签进入、中文/浅色切换与返回官网，桌面及 355 CSS 像素窄屏无横向溢出，首屏可见图片加载正常，未见控制台错误。
- 人物分组后重新构建 21，并实测桌面英文深色、手机中文浅色：9/6 人完整，两组照片同尺寸、同裁切，无横向溢出或控制台错误。桌面 6 列、中屏 3 列、手机 2 列；原人物角色和链接保留。
- Vite production build 通过，个人页随 public 正确复制；现有主 bundle 超过 500 kB 的提示仍在。本次不涉及完整生产首页替换。
- 截图是定帧画面，不能代表整段动效或用户审美认可。标题和周天字形仍有系统字体回退，跨系统一致性尚未验证。
- 自写源码空白检查通过；冻结 HTML 内的上游 shader 和原样许可仍含原始空白，未为格式检查改写基底。临时构建目录已清理。

## 下一步

先实际运行并通览 20/21 的整页和动态循环，判断最影响全局质感的少数问题，再在新候选中修订并做前后对照。不要无证据恢复旧设计、重写全部动效或直接部署。继续核查最终源码，而不是沿用前任“已优化”的评价。

### 可直接复制的启动提示

```text
请接手这个 πAI Lab 仓库，先读根目录 AGENTS.md 和 HANDOFF.md，并核对当前分支与真实运行页面。

请以具有顶级审美判断的 UI 设计师和产品经理视角，从第 21 版出发做全局优化。我要简洁、优雅、饱满、有力量感的完整网站，尤其看重平衡、比例、留白、秩序与数理美感，不接受模板拼装、空瘦松散、装饰堆砌或每个区块各自为政。以 AGENTS.md 中的细节和已否决方向为约束，不把前任自评当作事实。

先真实浏览全页、明暗主题、中英文和动效完整循环，形成少数有证据的全局判断，再直接完成一个可运行、可审阅的第 22 版候选。保留 20/21 便于对照，尊重现行 logo、内容、人员角色与动效辨识度；同时允许对影响整体品质的布局、排版、材质和节奏作有理由的调整。不要只微调颜色，也不要无依据推倒重来。

你的判断必须体现在实际画面和体验上，而不是一份建议清单。完成桌面和手机的真实验证，展示前后变化和仍存在的限制。可逆且范围内的选择直接做，只有真实事实缺口或会改变结果的产品分叉才问我。人物中有关 Zaoqu Liu 的整张卡片应进入官网内 /people/zaoqu-liu/，延续语言与主题；原个人站和其独立仓库不改。贺福初整卡链接 π-HuB 官方介绍，英文身份用 President, IAPM，保留院士称谓。本次继续做候选，不自行合并 PR 或发布生产。
```
