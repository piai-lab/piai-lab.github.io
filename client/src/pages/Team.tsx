/**
 * πAI Lab 团队页。
 * 视觉规则：研究机构名册语言，使用真实团队头像与明确组织关系；排印克制、标题居中、页脚与首页统一，不使用海报式大字或产品化口吻。
 */
import { useEffect, useState } from "react";

type Lang = "zh" | "en";
const wordmark = "/brand/piai-lab-wordmark-e.png";

const members = [
  {
    nameZh: "贺福初",
    nameEn: "Fuchu He",
    roleZh: "中国科学院院士",
    roleEn: "Academician of the Chinese Academy of Sciences",
    avatar: "/team/he-fuchu.png",
  },
  {
    nameZh: "刘灶渠",
    nameEn: "Zaoqu Liu",
    roleZh: "生物医学多模态基础模型科学家",
    roleEn: "Biomedical Multimodal Foundation Model Scientist",
    avatar: "/team/zaoqu.webp",
  },
  {
    nameZh: "陈镕浩",
    nameEn: "Ronghao Chen",
    roleZh: "AI 智能体系统架构师",
    roleEn: "AI Agent Systems Architect",
    avatar: "/team/ronghao.webp",
  },
  {
    nameZh: "闫明阳",
    nameEn: "Mingyang Yan",
    roleZh: "AI 产品与全栈工程师",
    roleEn: "AI Product & Full-Stack Engineer",
    avatar: "/team/mingyang.webp",
  },
  {
    nameZh: "徐志豪",
    nameEn: "Zhihao Xu",
    roleZh: "知识发现 AI 工程师",
    roleEn: "Knowledge Discovery AI Engineer",
    avatar: "/team/zhihao.webp",
  },
  {
    nameZh: "杨靖宽",
    nameEn: "Jingkuan Yang",
    roleZh: "知识发现 AI 工程师",
    roleEn: "Knowledge Discovery AI Engineer",
    avatar: "/team/jingkuan.webp",
  },
  {
    nameZh: "郑蓉峰",
    nameEn: "Rongfeng Zheng",
    roleZh: "知识发现 AI 工程师",
    roleEn: "Knowledge Discovery AI Engineer",
    avatar: "/team/rongfeng.webp",
  },
  {
    nameZh: "李文俊",
    nameEn: "Wenjun Li",
    roleZh: "AI 平台工程师",
    roleEn: "AI Platform Engineer",
    avatar: "/team/wenjun.webp",
  },
  {
    nameZh: "任秋燃",
    nameEn: "Qiuran Ren",
    roleZh: "AI 算法与后端工程师",
    roleEn: "AI Algorithms & Backend Engineer",
    avatar: "/team/qiuran.webp",
  },
  {
    nameZh: "万梦璇",
    nameEn: "Mengxuan Wan",
    roleZh: "药物发现 AI 工程师",
    roleEn: "Drug Discovery AI Engineer",
    avatar: "/team/mengxuan.webp",
  },
];

const collaborators = [
  {
    zh: "刘井平",
    en: "Jingping Liu",
    avatar: "/team/collaborators/liu-jingping.png",
    affiliationZh: "中山大学副教授",
    affiliationEn: "Associate Professor, Sun Yat-sen University",
  },
  {
    zh: "兰启臻",
    en: "Qizhen Lan",
    avatar: "/team/collaborators/lan-qizhen.png",
    affiliationZh: "休斯顿德克萨斯大学健康科学中心博士后研究员",
    affiliationEn:
      "Postdoctoral Researcher, The University of Texas Health Science Center at Houston",
  },
  {
    zh: "汪华灿",
    en: "Huacan Wang",
    avatar: "/team/collaborators/wang-huacan.png",
    affiliationZh: "美的 AI 研究院 AI Agent 算法负责人",
    affiliationEn: "AI Agent Algorithm Lead, Midea AI Research",
  },
  {
    zh: "周奕帆",
    en: "Yifan Zhou",
    avatar: "/team/collaborators/zhou-yifan.png",
    affiliationZh: "上海交通大学硕士生",
    affiliationEn: "Master's Student, Shanghai Jiao Tong University",
  },
  {
    zh: "吴挺煜",
    en: "Tingyu Wu",
    avatar: "/team/collaborators/wu-tingyu.png",
    affiliationZh: "中国科学院计算技术研究所硕士生",
    affiliationEn:
      "Master's Student, Institute of Computing Technology, Chinese Academy of Sciences",
  },
  {
    zh: "曹广雨",
    en: "Guangyu Cao",
    avatar: "/team/collaborators/cao-guangyu.png",
    affiliationZh: "中国科学院自动化研究所硕士生",
    affiliationEn:
      "Master's Student, Institute of Automation, Chinese Academy of Sciences",
  },
];

export default function Team() {
  const [lang, setLang] = useState<Lang>("zh");
  const zh = lang === "zh";
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting)
        ),
      { threshold: 0.08, rootMargin: "0px 0px -4%" }
    );
    document
      .querySelectorAll(".team-page-section")
      .forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <main className="site-shell team-page" lang={zh ? "zh-CN" : "en"}>
      <header className="team-page-nav">
        <a className="team-brand" href="/" aria-label={zh ? "返回首页" : "Back to home"}>
          <img className="brand-wordmark-image" src={wordmark} alt="πAI Lab" />
        </a>
        <button
          className="language-button"
          onClick={() => setLang(zh ? "en" : "zh")}
        >
          {zh ? "EN" : "中文"}
        </button>
      </header>
      <section className="team-page-hero">
        <div>
          <h1>{zh ? "团队" : "Team"}</h1>
          <p>
            {zh
              ? "πAI Lab 汇聚人工智能系统、知识发现、生物医学智能与科研平台方向的研究者和工程师。我们以开放协作连接不同学科、人才与机构。"
              : "πAI Lab brings together researchers and engineers across AI systems, knowledge discovery, biomedical intelligence and scientific platforms. We connect disciplines, people and institutions through open collaboration."}
          </p>
        </div>
      </section>
      <section className="team-roster team-page-section">
        <div className="roster-heading">
          <div>
            <h2>{zh ? "πAI Lab 团队" : "πAI Lab Team"}</h2>
          </div>
        </div>
        <div className="member-grid">
          {members.map(member => (
            <article className="member-card" key={member.nameEn}>
              <img
                className="member-avatar"
                src={member.avatar}
                alt={zh ? member.nameZh : member.nameEn}
              />
              <div className="member-meta">
                <h3>{zh ? member.nameZh : member.nameEn}</h3>
                <p>{zh ? member.roleZh : member.roleEn}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="collaborator-section team-page-section">
        <div className="roster-heading">
          <div>
            <h2>{zh ? "合作者" : "Collaborators"}</h2>
          </div>
          <p>
            {zh
              ? "与 πAI Lab 开展研究协作的学者和研究者。"
              : "Scholars and researchers collaborating with πAI Lab."}
          </p>
        </div>
        <div className="collaborator-grid">
          {collaborators.map(person => (
            <article key={person.en}>
              <img
                className="collaborator-avatar"
                src={person.avatar}
                alt={zh ? person.zh : person.en}
              />
              <div>
                <h3>{zh ? person.zh : person.en}</h3>
                <p>{zh ? person.affiliationZh : person.affiliationEn}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="institutional-footer team-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-lockup brand-lab-lockup">
              <img className="brand-wordmark-image" src={wordmark} alt="πAI Lab" />
            </span>
            <p>
              {zh
                ? "面向知识生成的人工智能研究"
                : "Artificial intelligence research for knowledge generation"}
            </p>
          </div>
          <div className="footer-column">
            <span>{zh ? "网站导航" : "NAVIGATION"}</span>
            <a href="/#news">{zh ? "动态" : "News"}</a>
            <a href="/#vision">{zh ? "愿景" : "Vision"}</a>
            <a href="/#research">{zh ? "研究" : "Research"}</a>
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
