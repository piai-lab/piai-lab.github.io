/**
 * πAI Lab 首页。
 * 视觉规则：以连续、克制的中文研究机构叙事组织内容；基础设施先于愿景；避免产品卡片、PPT 式页码和装饰性控件；首屏与收束仅使用新的统一 WebGL 粒子方案。
 */
import { useEffect, useRef, useState } from "react";
import ProductShowcase from "@/components/ProductShowcase";
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
type ResearchItem = { date: string; title: string; href: string; venue?: string };

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
  const title = zh ? "让人类知识增长十倍" : "Grow human knowledge tenfold";
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

  const research: ResearchItem[] = zh
    ? [
        {
          date: "2026.08",
          title:
            "KnowMeBenchV2: Evidence-Grounded Person-Centric Long-Video Understanding",
          href: "", venue: "EMNLP 2026",
        },
        {
          date: "2026.08",
          title:
            "MemGovern: Enhancing Code Agents through Learning from Governed Human Experiences",
          href: "", venue: "EMNLP 2026",
        },
        {
          date: "2026.08",
          title: "Controlled Self-Evolution for Algorithmic Code Optimization",
          href: "", venue: "EMNLP 2026",
        },
        {
          date: "2026.07",
          title:
            "Knowme-bench: Benchmarking person understanding for lifelong digital companions",
          href: "", venue: "ACL 2026",
        },
        {
          date: "2026.07",
          title: "LiveCANNBench: Benchmark SWE AI Coding for Ascend CANN",
          href: "", venue: "ACL 2026",
        },
        {
          date: "2024.12",
          title: "π-HuB: the proteomic navigator of the human body",
          href: "https://www.nature.com/articles/s41586-024-08280-5", venue: "Nature",
        },
      ]
    : [
        {
          date: "AUG 2026",
          title:
            "KnowMeBenchV2: Evidence-Grounded Person-Centric Long-Video Understanding",
          href: "", venue: "EMNLP 2026",
        },
        {
          date: "AUG 2026",
          title:
            "MemGovern: Enhancing Code Agents through Learning from Governed Human Experiences",
          href: "", venue: "EMNLP 2026",
        },
        {
          date: "AUG 2026",
          title: "Controlled Self-Evolution for Algorithmic Code Optimization",
          href: "", venue: "EMNLP 2026",
        },
        {
          date: "JUL 2026",
          title:
            "Knowme-bench: Benchmarking person understanding for lifelong digital companions",
          href: "", venue: "ACL 2026",
        },
        {
          date: "JUL 2026",
          title: "LiveCANNBench: Benchmark SWE AI Coding for Ascend CANN",
          href: "", venue: "ACL 2026",
        },
        {
          date: "DEC 2024",
          title: "π-HuB: the proteomic navigator of the human body",
          href: "https://www.nature.com/articles/s41586-024-08280-5", venue: "Nature",
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

      <section className="product-vision" id="vision">
        <div className="vision-product-heading">
          <h2>{zh ? "愿景" : "Vision"}</h2>
          <p>
            {zh ? "让人工智能以可靠高效的方式参与知识生成" : "Enabling the genesis of new knowledge through reliable, efficient AI"}
          </p>
        </div>
        <ProductShowcase zh={zh} />
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
                <h3>{item.title}</h3><span className="research-venue">{item.venue}</span>
              </a>
            ) : (
              <div className="research-item research-pending" key={item.title}>
                <time>{item.date}</time>
                <h3>{item.title}</h3><span className="research-venue">{item.venue}</span>
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
