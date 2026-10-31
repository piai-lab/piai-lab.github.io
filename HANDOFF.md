# πAI Lab 设计交接

## 目标与边界

2026-10-30 用户明确要求全站深化（文案、视觉、动效、移动端），并先交付完整可操作原型。第 23 版在 2026-10-30 被用户明确否决（“差远了”），退出候选与上线队列，仅保留历史。第 24 版的中央叠字首屏与交错研究布局也被用户否决（“布局还不如之前的”），退出候选与上线队列。用户现已明确选择“线上原版：左文右周天，研究区依次展开”。2026-10-31 用户回复“OK 提交和重新部署吧”，已批准 v25 并授权提交、PR 合并与重新部署。v25 沿用 v22 整体布局，深化材质/动效/主题连续性；v23/v24 的否决保持有效。稳定偏好、已否决方向和产品事实只见 [AGENTS.md](AGENTS.md)。2026-10-12 用户要求把本分支效果部署到 piai-lab.github.io 与 piailab.cn，因此 PR #7 合并入 main 上线；之后的改动仍按“分支 → PR → 合并即发布”处理。原 `zaoqu-liu.github.io` 仓库与线上个人站不改。

## 当前事实

- 历史上线：`feat/lab-v21-design-handoff` 经 [PR #7](https://github.com/piai-lab/piai-lab.github.io/pull/7) squash 合并入 main；push 到 main 即触发 Pages workflow 与 Vercel 生产部署。回退用 revert 合并提交。续接时先核对 `git status --short`、`git log -3 --oneline`。
- 现行生产源码为 `artifacts/ui-prototypes/version-25/`；v22 为历史上线基准。20/21/22 页面设计未改。发布状态以对应 PR、main 提交的 Pages workflow 与 Vercel 部署为准，不将本地构建当作线上证据。
- GitHub Pages 与 Vercel（piailab.cn）都直接发布已提交的 `docs/`。正式构建为 `pnpm build:site` / `node artifacts/ui-prototypes/build-25.mjs --production`，输出首页、带内容哈希的 assets、第三方许可、404 与三个个人页；不发布 preview、baseline 或截图。Vercel 跳过依赖安装/重建。不要手改生成产物。
- 默认 `node artifacts/ui-prototypes/build-25.mjs` 只生成 `version-25/preview/`，该目录已忽略。历史 `build-21.mjs` / `build-22.mjs` 仅生成历史原型，不再写生产目录。其余历史草稿保留，不能整目录 stage。


## 第 25 版（2026-10-31，已批准发布）

- 用户明确选择“线上原版：左文右周天，研究区依次展开”，这是布局基准；2026-10-31 已进一步批准本候选发布。v23 整体候选、v24 布局继续被否决，不恢复待采用状态。
- 原型类型原为 `decision-candidate`，现已获用户批准，作为本次发布视觉真值。保留 v22 首页/研究/新闻/人物/联系的完整结构、字体与色彩；精简两段研究导语。CSS 除来源注释，只修 681–960px 周天右侧溢出取景。
- 已批准原型入口为 `version-25/preview/`（原审阅端口 4325），正式输出为 `docs/`。本地服务器只用于本轮审阅/验证，发布完成后回收；复看可重新启动，无需保留后台进程。
- 构建：`~/.local/zcode-node/node-v24.14.0-darwin-arm64/bin/node artifacts/ui-prototypes/build-25.mjs [--production]`。16 张照片原字节外置；三个个人页复用共享构建器，从 `client/public/people/` 生成，只有首页返回路径适配，不改个人站源码。
- 复用：v25 app/site 从 v22 copied-adapted；资源网络、SiteMotion、logo、Radix Sheet、Lucide direct-import 原 owner。周天从 v22 copied-adapted，原环面/构图/12环/5层/24秒运镜不变，10条主环边缘换为细倒角实体以改善前后遮挡，副环光点与拖尾收弱。未采用 v24 中央构图和宽亮金属带。
- 自主发现从 v23 copied-adapted，保留 P/R/可见性修正；当前探测轨迹突出，抵达后保持 0.6s 再收拢，完成轨迹平滑退到次级。模型、数据、路径与合成演示说明不变。资源网络仍为 2.5D 概念视觉。
- 星空从 v22 copied-adapted：主题切换不重新生成点位/时钟，浅色显示同一几何的稳定子集；reduced motion 关闭视差。语言切换先更新 lang 再补偿当前阅读锚点，首页保持顶部；导航定位标题；页脚动画补页面隐藏暂停。
- 实际浏览器：in-app Chromium 1440×900、768×1024、390×844、360×800 的代表性页面，覆盖中英/深浅首屏、研究、新闻、团队和联系；未见横向溢出及控制台 warning/error。平板取景修正后重看。10位团队成员+6位合作者完整展开，Founder与其他人物同尺寸。
- 交互证据：周天暂停切主题 time=34.150不变、R回到0；自主发现暂停切主题 time=2.383不变、R回到约0.2；主题前后4个canvas、星点几何990个；资源缩放1→1.12；手机菜单导航焦点落在 team-heading；Founder页与返回保留 en/light；motion=reduce 下发现time=23、frames=1，按R不启动，星空time=0；离开发现区后state=offscreen。未做真机、多浏览器或长期性能验证；隐藏生命周期有源码检查，未另做后台标签实测。
- 截图：`version-25/screenshots/desktop-dark.jpg`（1440×900，周天t=3定帧）、`mobile-zh-light.jpg`（390×844，实时画面）。截图为审阅记录；用户随后批准本候选。默认入口保持实时播放。
- 最终 JS SHA256 `7c393fa6f853e5db8cb80182354878e4e14d3711b25fe62228ef10645ea05b5b`；CSS SHA256 `e45f5affa1ba563faca421e12f4505468fcc66a9b63b4c214f786daf905c0289`。
- 正式构建的 JS/CSS SHA256 与上述批准产物完全一致；仅生产文件名增加内容哈希。20 个首页资源引用闭合；三个个人页与 source 比较，仅陈镕浩的三条首页绝对链接归一到 `/`，其余内容保留。
- 发布接线经独立只读审查：v25 运行依赖均有版本控制来源，无 v23/v24 运行依赖；35 个实际贡献 bundle 的 npm 依赖版本均在许可文本中。默认预览已取消失效的 baseline/team 复制。发布前浏览器核对实际 1200×750 与 325×703 的代表性状态，中英/深浅切换、4个canvas、无横向溢出、无控制台warning/error，Founder页跳转保留 zh/light。v25 上轮完整代表性验证仍见前述记录。
- 从 Git 暂存区导出干净目录复建，75 个 docs 文件均与待发布产物一致；预览构建不修改 docs。源码 diff whitespace 检查通过；生成的 Three.js shader 字符串与原始许可保留上游空白，不改动批准 bundle。
- 本轮仅提交 v25 源码、正式构建接线、许可与 docs 产物；其它历史草稿不提交、不删除。未创建 worktree。提交、合并及两域名线上验证的最终证据放在本轮发布 PR 与会话交付中。


## 第 23 版（2026-10-30，被否决，仅历史）

- 当前工作区：`feat/lab-v23-prototype`，基线 `4452047`（PR #10 已合并，包含陈镕浩个人页）。本轮先确认 tracked 干净且无 untracked 冲突，再从 `03055f6` fast-forward；历史草稿完整保留。未提交、未推送、未部署，未创建 worktree。
- 原型类型：`decision-candidate`，本候选即待审视觉真值；不是旧版逐像素复刻。入口 `artifacts/ui-prototypes/version-23/preview/index.html`，同目录 `baseline.html` 为当前 `docs/index.html` 原样复制。
- 构建：`~/.local/zcode-node/node-v24.14.0-darwin-arm64/bin/node artifacts/ui-prototypes/build-23.mjs`。仅写 `version-23/preview/`，不导入旧构建的发布副作用，不修改 `docs/`、`client/public/` 或 v22。
- 预览：`python3 -m http.server 4323 --bind 127.0.0.1 --directory artifacts/ui-prototypes/version-23/preview`；打开 `http://127.0.0.1:4323/`。该历史服务已停止，当前使用 v25 的 4325 预览。原 URL 支持 `?lang=zh`、`?theme=light`、`?motion=reduce`、`?t=3`（周天定帧）。
- 页面与布局唯一候选入口：`version-23/app.tsx`、`site.css`。保留既有首屏标题与人员事实；调整标题字级/字族关系、周天占幅、研究导语、新闻左右阅读布局、四列人物布局与收尾。手机独立重排，成员与合作者全部展开。
- 复用：周天、资源网络、全站星空、SiteMotion、logo、Radix Sheet、Lucide 为现有组件 direct-import；自主发现从 v22 copied-adapted，仅补键盘 P 暂停/继续、R 重播与可见性控制，未改变数学模型/轨迹/叙事。资源网络仍是 2.5D 概念图，自主发现仍是合成演示。
- 交互修正：语言改变先更新 html.lang，再补偿当前阅读锚点；新闻桌面导航滚动到非 sticky 的内容起点；联系区 SVG 在页面隐藏时暂停。主题/语言不重建场景。
- 资源：16 张照片无损外置，保留原字节与原有 lazy 属性；首页 HTML 5.6 KB、JS 1.07 MB、CSS 1.91 MB（含离线字体），照片共 5.43 MB，未作网络加载速度或真实设备性能结论。三个个人页只复制到预览并适配返回候选路径，源站不改。
- 实际验证：本机 in-app Chromium 浏览器审阅 1440×900、768×1024、390×844、360×800，覆盖中英文/深浅主题的代表性状态、研究图、新闻、团队与联系；未见横向溢出或控制台错误。手机菜单选项导航/关闭/焦点返回正常；Founder 个人页及返回保留语言与主题；资源网络缩放值可改变；切主题/语言仍为 4 个 canvas；自主发现 P 后 time/frame 保持不变，R 回到 0；`motion=reduce` 下 P/R 保持静态。截图不代替完整多浏览器/真机验证。
- 截图入口：`version-23/screenshots/desktop-dark.jpg`、`baseline-desktop.jpg`、`mobile-zh-light.jpg`。
- 候选产物 SHA256：`assets/app.js` 为 `93a90a296842270d3e03ce5b5bdb9556e6e3d7ae190f5924f71ad4fec6899cea`；`assets/site.css` 为 `d37e28e4fbf68556a4c6f08d7a78ad170391a94e1f559a0519541457c60a1e36`。

## 第 24 版（2026-10-30，布局被否决，仅历史）

- 用户原话：“布局还不如之前的”。中央周天叠前景标题、sticky pullback、交错研究区、双列新闻的布局方向撤回，不再作为待批准候选。
- 代码：`artifacts/ui-prototypes/version-24/`；构建：`artifacts/ui-prototypes/build-24.mjs`；仅输出 `version-24/preview/`。
- 本机服务：`http://127.0.0.1:4324/`，根目录为上述 preview；进程为本任务启动的 `python3 -m http.server`（exec session 3821）。该历史服务现已停止，由 v25 预览取代；不能视为已交付/已接受版本。
- 已构建、浏览器实际看过英文深色桌面 1440×900 的首屏、资源网络、自主发现与新闻。发现研究导航按 h2 滚动会遮住图形上沿；未修复，因布局随后被否决。未完成全矩阵验证，不沿用 v23 验证结论。
- 场景可独立复用候选：`version-24/celestial-replica/` 从 v22 copied-adapted，五个主环增加空心倒角金属截面，收弱原颗粒/flare；12 环、五层分类与 24 秒运动共享原 owner。几何/语法/focused TypeScript 数值检查通过，浏览器完整生命周期未复验；用户未单独批准该材质。
- 无 commit、push、生产写入或新 worktree；v22、`docs/`、`client/public/` 保持原样，历史草稿保留。

## 第 22 版入口（历史上线基准，已由 v25 取代）

以下路径相对 `artifacts/ui-prototypes/`：

| 用途 | 入口 |
| --- | --- |
| 当前候选 / 对照 | `piai-redesign-22.html` / `piai-redesign-21.html`、`piai-redesign-20.html` |
| 构建 / 页面与文案 | `build-22.mjs` / `version-22/app.tsx` |
| 全站布局、字级和主题 | `version-22/site.css` |
| 唯一星空 | `version-22/starlight-backdrop.tsx` |
| 周天 | `version-22/celestial-replica/`；24 秒循环 |
| 资源网络 | `version-22/model-dikw/` |
| 自主发现 | `version-22/autonomous-discovery.tsx`、`version-22/discovery-observatory.js` |
| 截图证据 | `piai-22-dark.png`、`piai-22-light.png`、`piai-22-compare-dark.png`、`piai-22-compare-light.png`、`piai-22-wheel-loop.png` |

## 第 22 版做了什么

- **一个空间**：星空只由 `starlight-backdrop` 绘制，三层视差、缓慢呼吸，覆盖全站；周天、资源网络、自主发现删除各自星点并改为透明合成，不再出现场景“星空方框”。
- **首屏**：保留左文右周天。标题 Towards autonomous science / 迈向自主科学（用户提出 towards 方向后选定）；副句 “We build AI-ready scientific infrastructure and study agents that carry inquiry from hypothesis to evidence / 构建 AI-ready 科学基础设施，研究智能体如何从假设走向证据”。删去眉标、摘要列表和底栏。
- **去重复**：删除使命段、研究编号与章节横栏；品牌名只留导航 logo、页脚版权和文档标题。
- **结尾**：Open to collaboration / 欢迎研究合作，一句合作范围 + mailto。替换已否决的“让科学发现继续向前”。
- **浅色主题**：用户否决暖黄后改为冷灰白（`#f3f5f7`）+ 深青 `#1d5964` + 墨蓝 `#26476b`，四个场景同步。
- **色彩职责**：铜金在深色里只表示“观测 / 证据”（自主发现）与周天金属；Founder、系统类别改用 accent / muted。
- **团队**：新增吴俣帅 / Yushuai Wu（简历职位 Researcher / 研究员，照片仅把冷灰底换成团队统一的米白底，脸与服装未改）；成员顺序按用户指定：贺福初、刘灶渠、陈镕浩、吴俣帅、杨靖宽、徐志豪、闫明阳、任秋燃、李文俊、郑蓉峰。
- **字体**：v22 改用自己的 Noto Sans SC 子集 `version-22/cjk-fonts.css`（覆盖 v22 全部中文，含“俣”“帅”）；21 仍用 `research-cjk-fonts.css` 不变。
- **结尾**：标题与说明、邮箱改为底边对齐，消除左低右高；中文说明在逗号处换行。
- **节奏**：章节间距收为 `clamp(112px,9.5vw,144px)`；研究系统四列标题对齐；自主发现图形与标题拉开、手机端隐藏走位异常的流程点。
- **自主发现**：保留“粒子轨迹被隐藏的力弯折”的具体物理画面（用户否决了更抽象的假设地形）。青色扇面是后验仍允许的解释各自预测的路径，每次观测后收拢；两个力的光核随后验均值与不确定性变亮、变紧；删除标题 HUD、图例、浮动标签与四步流程条；数字全部来自 `discovery-model.mjs`（新增导出 `weights`、`hypotheses`，对 v21 无影响）。用户否决了剩余解释数读数和研究方向→成果之间的过渡句（“说得太具体”），均已删除，不再加回。
- **下半页**：研究方向之后依次为 News & Events、团队、联系。用户已删除 Selected work（论文列表）与 Research systems，研究系统未来另做独立页面。News & Events 时间线按日期倒序：2026.10.10 OmniKnowledge 发布、09.20 OmniScholar 发布、09.18 PathWeaver 投稿 ICLR 2027、09.16 OmniFigure 投稿 ICLR 2027、09.15 AI4S News 发布、09.01 πAI Lab 成立；发布条目整行链接对应平台，不写介绍。时间线下方一行 Platforms：AI4S News、OmniScholar、OmniKnowledge、Euler，只放图标、名称和外链（新标签页，rel=noopener）。图标取自各产品的线上站点或仓库：AI4S News 用小信鸟（`apps/web/public/messenger-bird.svg`），OmniScholar 用 `icon.svg` 的白色主形，Euler 用 `euler-logo-dark-white-exact.png` 转成 alpha，OmniKnowledge 没有图片图标，沿用其界面中的 Lucide `BookOpen`。四个图标统一以 CSS mask 单色渲染，跟随 `--ink`，悬停时取 `--accent`，深浅主题都适用，源文件在 `version-22/platforms/`。人像加细光边；联系区以三道倾斜轨道和缓行光点收束（SVG，离屏/减少动态时暂停）。间距统一用 `--section`，收尾标题用 `--closing`。Founder 保持与成员同尺寸（用户否决放大）。字级整体上调一档：导航 15px、语言 14px、栏目小标 13px、人物职位 14px、页脚 13px、方法说明 12.5px。

## 已知未决

- 团队成员照片为米白底，在冷色浅色主题中略偏暖；合作者照片底色不一，未处理。
- 资源网络为生成概念图 + 局部网面运动的 2.5D 实现；自主发现为合成主动学习演示，均不能宣传为实测发现。
- 标题字体有系统回退，跨系统一致性未验证。

## 历史 v22 运行与验证

```sh
pnpm install --frozen-lockfile
node artifacts/ui-prototypes/build-22.mjs
python3 -m http.server 4318 --bind 127.0.0.1 --directory artifacts/ui-prototypes
```

打开 `http://127.0.0.1:4318/piai-redesign-22.html`。`?lang=zh`、`?theme=light`、`?motion=reduce` 直达对应状态。本机 Homebrew Node 缺动态库，使用 `~/.local/zcode-node/node-v24.14.0-darwin-arm64/bin`。

- **细节审阅（v22）**：中英文人物职位、合作者单位、方向导语与新闻说明按词组换行（`ph()` + 全局 `.keep`），不再从词中断开；自主发现减弱候选探针列与后验光晕，镜头略上移；联系区轨道缩小、降低不透明度并加径向遮罩，避免压住标题；页脚图标线宽统一 1.5；新增 `--spark` 光点色以适配浅色。
- 22 HTML SHA256：`f05c639b1a28373fce7d8d41bab42e0c05050b58cfed5788dd994412e9d76200`；21 `149162c5…1c94716`、20 `2ecc861a…7741f` 未变。
- 2026-10-12 用 Playwright + 系统 Chrome 实测：桌面 1440 与手机 360/390，中英文 × 深浅；周天 1/7/13/19/25 秒定帧，25 秒与 1 秒姿态一致、无停顿；`?motion=reduce` 停在静止帧；主题切换不重置周天时钟、不累积画布（4 个 canvas）；355/375/390/768/1440 无横向溢出；无控制台错误。
- 链接：Founder 整卡 → `/people/zaoqu-liu/?lang=&theme=`，返回 `piai-redesign-22.html` 并延续语言与主题；贺福初 → π-HuB 指定页；邮箱 mailto；Haros → GitHub。
- 截图为定帧，不代表整段动效或用户审美认可。未在全新依赖安装环境复验构建。

## 官网内个人页

个人页唯一维护源为 `client/public/people/<slug>/`（`zaoqu-liu`、`yushuai-wu`、`ronghao-chen`）。`scripts/build-founder-profile.mjs` 导出唯一复制/返回链接适配函数，供 v25 正式构建与隔离预览使用；直接运行脚本只生成 `docs/people/`。历史 21/22 构建显式调用该函数生成各自预览链接，不再隐式写生产。团队卡片站内链接由 `version-25/app.tsx` 的 `onSite` 映射决定。源站文案、布局、动效及原 `zaoqu-liu.github.io` 仓库保持不动。

## 后续维护

v25 已获批准发布，沿用上述正式构建入口。v23 整体与 v24 布局保持历史拒绝状态，不再进入上线队列。后续设计修改仍须遵守 AGENTS.md；回退发布通过 revert 对应合并提交，不运行旧构建器覆盖生产。
