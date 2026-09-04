/**
 * πAI Lab 首页。
 * 视觉规则：以连续、克制的中文研究机构叙事组织内容；基础设施先于愿景；避免产品卡片、PPT 式页码和装饰性控件；首屏与收束仅使用新的统一 WebGL 粒子方案。
 */
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import InstitutionalGlobe, {
  type GlobePoint,
} from "@/components/InstitutionalGlobe";
import ResearchParticleField, {
  MorphingParticleField,
} from "@/components/ResearchParticleField";

type Lang = "zh" | "en";
type NewsItem = {
  date: string;
  title: string;
  href: string;
  type: string;
  previewLabel: string;
  previewSubtitle: string;
  previewImage: string;
};

const assets = {
  labWordmark: "/brand/piai-lab-wordmark-e.png",
  visionArtwork: "/vision/knowledge-generation-artwork.png",
};

const nav = [
  { zh: "动态", en: "News", href: "#news" },
  { zh: "愿景", en: "Vision", href: "#vision" },
  { zh: "研究", en: "Research", href: "#research" },
  { zh: "团队", en: "Team", href: "/team" },
];

const teamLocations: GlobePoint[] = [
  { label: "广州", lat: 23.129, lng: 113.264, accent: true },
  { label: "北京", lat: 39.904, lng: 116.407 },
  { label: "上海", lat: 31.231, lng: 121.473 },
  { label: "香港", lat: 22.319, lng: 114.169 },
  { label: "休斯顿", lat: 29.76, lng: -95.369 },
  { label: "伦敦", lat: 51.507, lng: -0.128 },
];

function Logo({ hero = false }: { hero?: boolean }) {
  return (
    <span
      className={`brand-lockup brand-lab-lockup ${hero ? "hero-lab-lockup" : ""}`}
    >
      <img className="brand-wordmark-image" src={assets.labWordmark} alt="πAI Lab" />
    </span>
  );
}

function HeroTitle({ zh }: { zh: boolean }) {
  const title = zh ? "让人类知识多一倍" : "Double human knowledge";
  return (
    <h1 aria-label={title}>
      <span className="hero-title-line">{title}</span>
    </h1>
  );
}

function NewsPreview({ item }: { item: NewsItem }) {
  return (
    <div className="news-preview news-preview-open" aria-hidden="true">
      <img src={item.previewImage} alt="" />
      <span className="news-preview-caption">
        <b>{item.previewLabel}</b>
        <small>{item.previewSubtitle}</small>
      </span>
    </div>
  );
}

function NewsRail({
  items,
  label,
  zh,
}: {
  items: NewsItem[];
  label: string;
  zh: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) =>
    railRef.current?.scrollBy({
      left: direction * Math.max(320, railRef.current.clientWidth * 0.72),
      behavior: "smooth",
    });
  return (
    <div className="news-rail-shell">
      <div className="news-rail" ref={railRef}>
        {items.map(item => {
          const content = (
            <>
              <NewsPreview item={item} />
              <h3>{item.title}</h3>
              <div className="news-meta">
                <time>{item.date}</time>
                <span>{item.type}</span>
              </div>
              <span className="news-read">
                {item.href
                  ? zh
                    ? "查看原文"
                    : "Read"
                  : zh
                    ? "阅读记录"
                    : "View record"}
                <ArrowRight size={15} />
              </span>
            </>
          );
          return item.href ? (
            <a
              className="news-record"
              href={item.href}
              target="_blank"
              rel="noreferrer"
              key={item.title}
            >
              {content}
            </a>
          ) : (
            <article
              className="news-record news-record-pending"
              key={item.title}
            >
              {content}
            </article>
          );
        })}
      </div>
      <div className="news-rail-footer">
        <div className="news-rail-controls" aria-label={label}>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="查看上一组动态"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="查看下一组动态"
          >
            <ArrowRight size={17} />
          </button>
        </div>
        <a className="news-research-link" href="#research">
          {zh ? "查看全部研究" : "View all research"}
          <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}

export default function ContentHome() {
  const [lang, setLang] = useState<Lang>("zh");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const zh = lang === "zh";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHeroReady(true));
    const onScroll = () => setScrolled(window.scrollY > 18);
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting)
        ),
      { threshold: 0.08, rootMargin: "0px 0px -4%" }
    );
    document
      .querySelectorAll(".content-section")
      .forEach(section => observer.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const news: NewsItem[] = zh
    ? [
        {
          date: "2026.09",
          type: "开源发布",
          title: "Haros：统一多智能体科研工作台正式发布",
          previewLabel: "Haros",
          previewSubtitle: "统一科研工作台",
          previewImage: "/news/haros-system-schematic.png",
          href: "https://github.com/piai-lab/Haros",
        },
        {
          date: "2026.08",
          type: "论文录用",
          title: "EMNLP 2026：πAI Lab 三篇论文录用",
          previewLabel: "EMNLP 2026",
          previewSubtitle: "三篇论文录用",
          previewImage: "/news/emnlp-2026-memgovern.png",
          href: "",
        },
        {
          date: "2024.12.11",
          type: "研究成果",
          title: "π-HuB：人体蛋白质组导航计划",
          previewLabel: "π-HuB",
          previewSubtitle: "人体蛋白质组导航",
          previewImage: "/news/pihub-nature-figure.jpg",
          href: "https://www.nature.com/articles/s41586-024-08280-5",
        },
      ]
    : [
        {
          date: "SEP 2026",
          type: "OPEN SOURCE",
          title:
            "Haros: the unified workspace for multi-agent research, formally released",
          previewLabel: "Haros",
          previewSubtitle: "Unified research workspace",
          previewImage: "/news/haros-system-schematic.png",
          href: "https://github.com/piai-lab/Haros",
        },
        {
          date: "AUG 2026",
          type: "PAPER ACCEPTANCE",
          title: "Three πAI Lab papers accepted to EMNLP 2026",
          previewLabel: "EMNLP 2026",
          previewSubtitle: "Three papers accepted",
          previewImage: "/news/emnlp-2026-memgovern.png",
          href: "",
        },
        {
          date: "11 DEC 2024",
          type: "RESEARCH",
          title: "π-HuB: the proteomic navigator of the human body",
          previewLabel: "π-HuB",
          previewSubtitle: "Human proteome navigation",
          previewImage: "/news/pihub-nature-figure.jpg",
          href: "https://www.nature.com/articles/s41586-024-08280-5",
        },
      ];

  const research = zh
    ? [
        {
          date: "2026.08",
          title:
            "KnowMeBenchV2: Evidence-Grounded Person-Centric Long-Video Understanding",
          href: "",
        },
        {
          date: "2026.08",
          title:
            "MemGovern: Enhancing Code Agents through Learning from Governed Human Experiences",
          href: "",
        },
        {
          date: "2026.08",
          title: "Controlled Self-Evolution for Algorithmic Code Optimization",
          href: "",
        },
        {
          date: "2026.07",
          title:
            "Knowme-bench: Benchmarking person understanding for lifelong digital companions",
          href: "",
        },
        {
          date: "2026.07",
          title: "LiveCANNBench: Benchmark SWE AI Coding for Ascend CANN",
          href: "",
        },
        {
          date: "2024.12",
          title: "π-HuB: the proteomic navigator of the human body",
          href: "https://www.nature.com/articles/s41586-024-08280-5",
        },
      ]
    : [
        {
          date: "AUG 2026",
          title:
            "KnowMeBenchV2: Evidence-Grounded Person-Centric Long-Video Understanding",
          href: "",
        },
        {
          date: "AUG 2026",
          title:
            "MemGovern: Enhancing Code Agents through Learning from Governed Human Experiences",
          href: "",
        },
        {
          date: "AUG 2026",
          title: "Controlled Self-Evolution for Algorithmic Code Optimization",
          href: "",
        },
        {
          date: "JUL 2026",
          title:
            "Knowme-bench: Benchmarking person understanding for lifelong digital companions",
          href: "",
        },
        {
          date: "JUL 2026",
          title: "LiveCANNBench: Benchmark SWE AI Coding for Ascend CANN",
          href: "",
        },
        {
          date: "DEC 2024",
          title: "π-HuB: the proteomic navigator of the human body",
          href: "https://www.nature.com/articles/s41586-024-08280-5",
        },
      ];

  return (
    <main className="site-shell content-home">
      <header
        className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}
      >
        <a href="#top" className="brand-link" aria-label="πAI Lab 首页">
          <Logo />
        </a>
        <nav className="site-nav" aria-label="主导航">
          {nav.map(item => (
            <a href={item.href} key={item.href}>
              {zh ? item.zh : item.en}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="language-button"
            onClick={() => setLang(zh ? "en" : "zh")}
          >
            {zh ? "EN" : "中文"}
          </button>
          <a href="#contact" className="header-cta">
            {zh ? "联系" : "Contact"}
            <ArrowDown size={14} />
          </a>
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "关闭导航" : "打开导航"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            {nav.map(item => (
              <a
                href={item.href}
                onClick={() => setMenuOpen(false)}
                key={item.href}
              >
                {zh ? item.zh : item.en}
              </a>
            ))}
          </div>
        )}
      </header>

      <section
        className={`hero content-hero ${heroReady ? "hero-ready" : ""}`}
        id="top"
      >
        <ResearchParticleField />
        <div className="hero-vignette" />
        <div className="hero-content">
          <Logo hero />
          <HeroTitle zh={zh} />
          <div className="hero-actions">
            <a href="#news" className="pill-button pill-dark">
              {zh ? "查看动态" : "View news"}
              <ArrowDown size={17} />
            </a>
            <a href="#research" className="pill-button">
              {zh ? "进入研究" : "Explore research"}
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <section className="news-section content-section" id="news">
        <div className="section-heading-only section-heading-centered">
          <h2 className="section-title">{zh ? "动态" : "News"}</h2>
        </div>
        <NewsRail
          items={news}
          label={zh ? "动态轨道控制" : "News rail controls"}
          zh={zh}
        />
      </section>

      <section
        className="infrastructure-section content-section"
        id="infrastructure"
      >
        <div className="infrastructure-heading section-heading-only section-heading-centered" id="vision">
          <h2 className="section-title">{zh ? "愿景" : "Vision"}</h2>
          <p className="vision-infrastructure-statement">
            {zh
              ? "让人工智能以可靠高效的方式参与知识生成"
              : "Make AI a reliable, efficient participant in knowledge generation"}
          </p>
        </div>
        <div
          className="infra-atlas"
          aria-label={
            zh
              ? "πAI Lab 科研基础设施能力网络"
              : "πAI Lab research infrastructure capability network"
          }
        >
          <div className="infra-atlas-intro">
            <span>
              {zh ? "科学智能的研究能力网络" : "RESEARCH CAPABILITY NETWORK"}
            </span>
          </div>
          <div className="infra-network-primary">
            <div className="infra-foundation-network">
              <article>
                <span>DATA</span>
                <b>OmniData</b>
                <p>
                  {zh
                    ? "多源生物医学数据的收集、清洗与统一入口"
                    : "Biomedical data collection, cleaning and access"}
                </p>
              </article>
              <article>
                <span>METHODS</span>
                <b>OmniEngine</b>
                <p>
                  {zh
                    ? "经验证的分析方法、算法与工具能力"
                    : "Validated analytical methods, algorithms and tools"}
                </p>
              </article>
              <article>
                <span>KNOWLEDGE</span>
                <b>OmniScholar</b>
                <p>
                  {zh
                    ? "文献、专利、指南与教科书的知识组织"
                    : "Literature, patents, guidelines and textbooks"}
                </p>
              </article>
              <article>
                <span>DISCOVERY</span>
                <b>OmniKnowledge</b>
                <p>
                  {zh
                    ? "新知识在研究过程中的沉淀、组织与复用"
                    : "Knowledge accumulation, organization and reuse"}
                </p>
              </article>
            </div>
            <div className="infra-network-link" aria-hidden="true">
              <span />
            </div>
            <article className="infra-network-node">
              <span>{zh ? "科研执行框架" : "RESEARCH EXECUTION"}</span>
              <b>OmniHarness</b>
              <p>
                {zh
                  ? "使数据、方法与知识能够在任务中被稳定调用、检验与积累"
                  : "Stable invocation, validation and accumulation of scientific capabilities"}
              </p>
              <small>
                Memory · Reasoning ·{" "}
                {zh ? "调用 · 验证" : "Calling · Validation"}
              </small>
            </article>
            <div className="infra-network-link" aria-hidden="true">
              <span />
            </div>
            <article className="infra-network-node">
              <span>
                {zh ? "科学研究的数字大脑" : "DIGITAL BRAIN FOR SCIENCE"}
              </span>
              <b>OmniMind</b>
              <p>
                {zh
                  ? "汇聚数据、方法、知识与研究过程，支持持续的科学智能"
                  : "Bringing together data, methods, knowledge and research processes"}
              </p>
            </article>
          </div>
          <div
            className="infra-system-registry"
            aria-label={zh ? "科研支撑系统" : "Research support systems"}
          >
            <article>
              <b>OmniPatent</b>
              <p>{zh ? "专利研究与写作" : "Patent research and writing"}</p>
            </article>
            <article>
              <b>OmniPlotter</b>
              <p>
                {zh
                  ? "统计图与原理图生成"
                  : "Statistical and schematic figures"}
              </p>
            </article>
            <article>
              <b>OmniSketch</b>
              <p>{zh ? "科研技术路线图" : "Research technical roadmaps"}</p>
            </article>
            <article>
              <b>OmniSlide</b>
              <p>
                {zh
                  ? "研究成果叙事与呈现"
                  : "Research storytelling and presentation"}
              </p>
            </article>
            <article>
              <b>AI4S News</b>
              <p>
                {zh
                  ? "AI for Science 前沿追踪"
                  : "AI for Science frontier tracking"}
              </p>
            </article>
            <article>
              <b>Euler</b>
              <p>
                {zh
                  ? "组织知识与协作上下文"
                  : "Organizational knowledge and context"}
              </p>
            </article>
            <article>
              <b>Haros</b>
              <p>
                {zh
                  ? "多智能体科研工作台"
                  : "Unified workspace for research agents"}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="vision-section content-section" id="vision">
        <div className="section-heading-only section-heading-centered">
          <h2 className="section-title">{zh ? "愿景" : "Vision"}</h2>
        </div>
        <div className="vision-manifesto">
          <div className="vision-proposition">
            <h3>
              {zh
                ? "让人工智能以可靠高效的方式参与知识生成"
                : "Make AI a reliable, efficient participant in knowledge generation"}
            </h3>
          </div>
          <figure className="vision-artwork">
            <img src={assets.visionArtwork} alt={zh ? "由证据、路径与验证标记构成的知识生成图景" : "An artwork of knowledge generation, made of evidence, paths and verification marks"} />
          </figure>
          <div
            className="vision-continuum"
            aria-label={zh ? "研究重点" : "Research focus"}
          >
            <p>{zh ? "研究重点" : "RESEARCH FOCUS"}</p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <b>{zh ? "科学证据" : "Scientific evidence"}</b>
                  <small>
                    {zh
                      ? "让文献、专利、数据、方法与主张可追溯、可审查、可复用。"
                      : "Traceable, examinable and reusable evidence."}
                  </small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <b>{zh ? "可靠工作流" : "Reliable workflows"}</b>
                  <small>
                    {zh
                      ? "把溯源、评估、可复现、恢复与人工监督纳入 AI 辅助研究。"
                      : "Provenance, evaluation, reproducibility and oversight."}
                  </small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <b>{zh ? "科学表达" : "Scientific communication"}</b>
                  <small>
                    {zh
                      ? "创建清晰、可编辑、可验证的研究成果，让表达始终连着证据。"
                      : "Editable, verifiable research artifacts connected to evidence."}
                  </small>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <b>{zh ? "生物医学研究" : "Biomedical research"}</b>
                  <small>
                    {zh
                      ? "在医学与生命科学中，用高要求的真实问题检验方法与系统。"
                      : "Testing ideas on demanding real-world biomedical questions."}
                  </small>
                </div>
              </li>
            </ol>
            <div className="vision-principles">
              <b>{zh ? "我们如何工作" : "HOW WE WORK"}</b>
              <span>{zh ? "开放研究" : "Open research"}</span>
              <span>{zh ? "证据优先" : "Evidence first"}</span>
              <span>{zh ? "可复现" : "Reproducible"}</span>
              <span>{zh ? "研究者主导" : "Researcher led"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="research-directory content-section" id="research">
        <div className="section-heading-only">
          <h2 className="section-title">{zh ? "研究" : "Research"}</h2>
        </div>
        <div className="research-list">
          {research.map(item =>
            item.href ? (
              <a
                className="research-item"
                href={item.href}
                target="_blank"
                rel="noreferrer"
                key={item.title}
              >
                <time>{item.date}</time>
                <h3>{item.title}</h3>
              </a>
            ) : (
              <div className="research-item research-pending" key={item.title}>
                <time>{item.date}</time>
                <h3>{item.title}</h3>
              </div>
            )
          )}
        </div>
      </section>

      <section className="team-section content-section" id="team">
        <div className="team-heading">
          <h2 className="section-title">{zh ? "团队" : "Team"}</h2>
        </div>
        <div className="team-body">
          <div className="team-copy">
            <p>
              {zh
                ? "πAI Lab 是依托广州广东智慧医学国际研究院开展的公共研究与开放技术计划，扎根广州。我们探索人工智能如何参与科学发现，初期聚焦生物医学，并与不同学科的合作者在真实研究场景中持续检验和建设。"
                : "πAI Lab is a public research and open-technology initiative based at the Guangdong Institute of Intelligent Medicine in Guangzhou. Rooted in Guangzhou, we explore how AI can participate in scientific discovery, initially focusing on biomedical research and testing ideas in real settings with collaborators across disciplines."}
            </p>
            <a href="/team" className="team-link-button">
              <span>{zh ? "认识团队" : "Meet the team"}</span>
              <i>
                <ArrowUpRight size={17} />
              </i>
            </a>
          </div>
          <div className="team-globe">
            <InstitutionalGlobe
              points={teamLocations}
              tone="ink"
              ariaLabel={
                zh
                  ? "随地球转动的团队协作地点"
                  : "Team collaboration locations rotating with the globe"
              }
            />
          </div>
        </div>
      </section>

      <section className="closing-vision content-section" id="closing">
        <MorphingParticleField />
        <div className="closing-vision-copy">
          <p>πAI Lab</p>
          <h2>
            {zh
              ? "让科学智能持续生成可靠的新知识"
              : "Scientific intelligence for reliable new knowledge"}
          </h2>
        </div>
      </section>

      <footer className="institutional-footer" id="contact">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>
              {zh
                ? "面向知识生成的人工智能研究"
                : "Artificial intelligence research for knowledge generation"}
            </p>
          </div>
          <div className="footer-column">
            <span>{zh ? "网站导航" : "NAVIGATION"}</span>
            <a href="#news">{zh ? "动态" : "News"}</a>
            <a href="#vision">{zh ? "愿景" : "Vision"}</a>
            <a href="#research">{zh ? "研究" : "Research"}</a>
          </div>
          <div className="footer-column">
            <span>{zh ? "研究方向" : "RESEARCH"}</span>
            <p>{zh ? "科学智能" : "Scientific intelligence"}</p>
            <p>{zh ? "知识发现" : "Knowledge discovery"}</p>
            <p>
              {zh
                ? "生物医学研究基础设施"
                : "Biomedical research infrastructure"}
            </p>
          </div>
          <div className="footer-column">
            <span>{zh ? "联系" : "CONTACT"}</span>
            <a href="mailto:zaoqu.liu@iapm.com">zaoqu.liu@iapm.com</a>
            <p>{zh ? "广州，中国" : "Guangzhou, China"}</p>
            <a href="/team">{zh ? "团队与协作" : "Team & collaboration"}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 πAI Lab</span>
          <span>{zh ? "保留所有权利" : "All rights reserved"}</span>
        </div>
      </footer>
    </main>
  );
}
