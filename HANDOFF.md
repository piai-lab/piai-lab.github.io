# πAI Lab 设计交接

## 目标与边界

从第 21 版出发完成第 22 版候选，保留 20/21 对照。稳定偏好、已否决方向和产品事实只见 [AGENTS.md](AGENTS.md)。授权包含推送本分支并更新 Draft PR，不包含合并或发布。原 `zaoqu-liu.github.io` 仓库与线上个人站不改。

## 当前事实

- 分支：`feat/lab-v21-design-handoff`，对应 [Draft PR #7](https://github.com/piai-lab/piai-lab.github.io/pull/7)，未合并、未部署。续接时先核对 `git status --short`、`git log -3 --oneline`。
- 当前候选为 `piai-redesign-22.html`。**用户尚未对 22 做最终视觉验收**；20/21 文件未改。
- Pages 实际发布 `docs/`；22 仍是独立原型，不等于官网首页上线。其余历史 `artifacts/` 草稿留在工作区，未提交、未删除。

## 入口

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

## 运行与验证

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

唯一维护源 `client/public/people/zaoqu-liu/`；`node scripts/build-founder-profile.mjs` 生成 `docs/people/zaoqu-liu/` 和原型旁预览副本（后者 gitignore），原型返回链接现指向 v22。不手改产物，不改原页面文案、布局或动效。

## 下一步

等待用户审阅 22，尤其是首屏副句、浅色主题和人物照片底色是否统一。审阅通过前不替换生产首页。
