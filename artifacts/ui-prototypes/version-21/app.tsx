import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,ArrowUp,Menu,X,Sun,Moon,Mail,FileText,Github,Layers3,BookOpen,PenTool,ChartNoAxesCombined} from 'lucide-react';
import {Sheet,SheetTrigger,SheetContent,SheetTitle,SheetDescription} from '../../../client/src/components/ui/sheet';
import Logo from '../../../client/src/components/Logo';
import CelestialWheel from './celestial-replica/view';
import ModelInfrastructure from './model-dikw/view';
import AutonomousDiscovery from './autonomous-discovery';
import StarlightBackdrop from './starlight-backdrop';
import SiteMotion from './site-motion';
import data from '../discovery-data.json';

const papers=[
 ['KnowMe-Bench','Benchmarking Person Understanding for Lifelong Digital Companions','ACL 2026','https://aclanthology.org/2026.acl-long.1394/'],
 ['LiveCANNBench','Benchmark SWE AI Coding for Ascend CANN','Findings of ACL 2026','https://aclanthology.org/2026.findings-acl.1143/'],
 ['MemGovern','Enhancing Code Agents through Learning from Governed Human Experiences','arXiv · 2026','https://arxiv.org/abs/2601.06789'],
 ['Controlled Self-Evolution','for Algorithmic Code Optimization','arXiv · 2026','https://arxiv.org/abs/2601.07348'],
 ['π-HuB','The proteomic navigator of the human body','Nature · Perspective · 2024','https://www.nature.com/articles/s41586-024-08280-5']
];
const systems=[
 ['Haros','智能体工作台','连接 Codex、Claude Code 等智能体运行环境，在同一界面管理项目、对话与工作记录。','https://github.com/piai-lab/Haros'],
 ['OmniScholar','科学知识与研究线索','围绕科学问题，组织文献、证据与研究线索。',''],
 ['OmniSketch','科学图示','以科研图示呈现科学机制与研究思路。',''],
 ['OmniPlotter','数据可视化','面向研究数据的科学图表与可视化工具。','']
];
const sectionIds=['home','research','infrastructure','discovery','work','people','contact'];
const initialTheme = (): 'dark'|'light' => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
const languageFromUrl=()=>new URLSearchParams(location.search).get('lang')!=='zh';
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const subscribeMotionPreference=(notify:()=>void)=>{motionPreference.addEventListener('change',notify);return()=>motionPreference.removeEventListener('change',notify)};
function App(){
 const [en,setEn]=useState(languageFromUrl);
 const [theme,setTheme]=useState<'dark'|'light'>(initialTheme);
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 const toggleTheme=()=>{const next=theme==='dark'?'light':'dark';setTheme(next);const url=new URL(location.href);url.searchParams.set('theme',next);history.replaceState(null,'',url)};
 const t=(zh:string,english:string)=>en?english:zh;
 useEffect(()=>{document.documentElement.lang=en?'en':'zh-CN';document.title=t('πAI Lab · 自主科学发现与科学基础设施','πAI Lab · Autonomous Discovery & AI-Ready Infrastructure');document.querySelector('meta[name=description]')?.setAttribute('content',t('πAI Lab 聚焦自主科学发现，构建面向人工智能的科学基础设施','πAI Lab pursues autonomous scientific discovery and builds AI-ready scientific infrastructure'));},[en]);
 const changeLanguage=()=>{const next=!en;setEn(next);const url=new URL(location.href);url.searchParams.set('lang',next?'en':'zh');history.replaceState(null,'',url)};
 const [menu,setMenu]=useState(false),[section,setSection]=useState('home');
 const reduced=useSyncExternalStore(subscribeMotionPreference,()=>motionPreference.matches)||new URLSearchParams(location.search).get('motion')==='reduce';
 const menuDestination=useRef<HTMLElement|null>(null);
 const go=(id:string,record=true)=>{if(record&&location.hash!=='#'+id)history.pushState(null,'','#'+id);setSection(id);setMenu(false);const el=document.getElementById(id);el?.scrollIntoView({behavior:reduced?'instant':'smooth'});const heading=el?.querySelector<HTMLElement>('h1,h2');if(heading){heading.tabIndex=-1;if(menu)menuDestination.current=heading;else heading.focus({preventScroll:true})}};
 useEffect(()=>{let frame=0,alive=true;const previousRestoration=history.scrollRestoration;history.scrollRestoration='manual';const restore=()=>{if(!alive)return;setEn(languageFromUrl());setTheme(new URLSearchParams(location.search).get('theme')==='light'?'light':'dark');const id=location.hash.slice(1)||'home';if(sectionIds.includes(id)){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{document.getElementById(id)?.scrollIntoView({behavior:'instant'});setSection(id)})}};restore();document.fonts.ready.then(restore);window.addEventListener('pageshow',restore);window.addEventListener('popstate',restore);return()=>{alive=false;cancelAnimationFrame(frame);history.scrollRestoration=previousRestoration;window.removeEventListener('pageshow',restore);window.removeEventListener('popstate',restore)}},[]);
 useEffect(()=>{document.documentElement.classList.toggle('manual-reduced',reduced);return()=>document.documentElement.classList.remove('manual-reduced')},[reduced]);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;if(innerHeight+scrollY>=document.documentElement.scrollHeight-4){setSection('contact');return}const probe=innerHeight*.3;const current=sectionIds.find(id=>{const r=document.getElementById(id)?.getBoundingClientRect();return r&&r.top<=probe&&r.bottom>probe});if(current)setSection(current)};
  const track=()=>{if(!frame)frame=requestAnimationFrame(update)};
  window.addEventListener('scroll',track,{passive:true});window.addEventListener('resize',track);track();
  return()=>{window.removeEventListener('scroll',track);window.removeEventListener('resize',track);if(frame)cancelAnimationFrame(frame)}
 },[]);
 const nav=[['research',t('研究方向','Research')],['work',t('研究成果','Selected work')],['people',t('团队','People')]];
 const navLinks=nav.map(([id,label])=><a key={id} href={'#'+id} aria-current={(section===id||(id==='research'&&['infrastructure','discovery'].includes(section)))?'location':undefined} onClick={e=>{e.preventDefault();go(id)}}>{label}</a>);
 return <div className={'biomedical starlight-site research-site frontier-site '+(reduced?'reduced-motion':'')}>
 <StarlightBackdrop reduced={reduced} theme={theme}/><SiteMotion reduced={reduced} paused={false}/>
 <a className="skip-link" href="#research">{t('跳至正文','Skip to content')}</a>
 <header className={"site-nav"+(section!=="home"?" nav-scrolled":"")}>
  <a className="brand" href="#home" aria-label={t('πAI Lab 首页','πAI Lab home')} onClick={e=>{e.preventDefault();go('home')}}><Logo/></a>
  <nav aria-label={t('主导航','Main navigation')}>{navLinks}</nav>
  <div className="nav-actions"><a className="contact-link" href="#contact" onClick={e=>{e.preventDefault();go('contact')}}>{t('联系合作','Contact')}<ArrowUpRight size={16}/></a><button className="theme-switch" onClick={toggleTheme} aria-label={theme==='dark'?t('切换浅色主题','Switch to light theme'):t('切换深色主题','Switch to dark theme')} title={theme==='dark'?t('浅色主题','Light theme'):t('深色主题','Dark theme')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="language-switch" onClick={changeLanguage} lang={en?'zh-CN':'en'} aria-label={en?'切换至中文':'Switch to English'}>{en?'中文':'EN'}</button>
  <Sheet open={menu} onOpenChange={setMenu}><SheetTrigger className="mobile-menu" aria-label={t('打开导航','Open navigation')}><Menu size={22}/></SheetTrigger><SheetContent className="bio-menu" onCloseAutoFocus={e=>{if(menuDestination.current){e.preventDefault();menuDestination.current.focus({preventScroll:true});menuDestination.current=null}}}><SheetTitle><Logo/></SheetTitle><SheetDescription>{t('AI-ready 科学基础设施 · 自主科学发现','AI-ready scientific infrastructure · Autonomous scientific discovery')}</SheetDescription><button onClick={()=>setMenu(false)} aria-label={t('关闭导航','Close navigation')}><X size={20}/></button><nav>{navLinks}<a href="#contact" onClick={e=>{e.preventDefault();go('contact')}}>{t('联系合作','Contact')}</a></nav></SheetContent></Sheet></div>
 </header>
 <main>
 <section className="hero" id="home">
  <div className="hero-copy"><p className="eyebrow">{t('智能驱动科学探索','INTELLIGENCE FOR DISCOVERY')}</p><h1>{t('拓展','Expanding the')}<br/>{t('科学发现的','frontiers of')}<br/><span>{t('边界','discovery')}</span></h1><p className="hero-summary">{t('AI-ready 科学基础设施','AI-ready scientific infrastructure')}<br/>{t('自主科学发现','Autonomous scientific discovery')}</p><a className="hero-explore" href="#research" onClick={e=>{e.preventDefault();go('research')}}>{t('探索研究方向','Explore our research')}<ArrowUpRight size={20}/></a></div>
  <div className="hero-wheel"><CelestialWheel en={en} reduced={reduced} theme={theme}/></div>
  <div className="hero-foot"><span>{t('01 / 研究方向','01 / RESEARCH')}</span><a className="text-link" href="#research" onClick={e=>{e.preventDefault();go('research')}}>{t('筑基科学发现','Foundations for discovery')}</a></div>
 </section>
 <section className="lab-statement section" aria-label={t('关于 πAI Lab','About πAI Lab')}><p className="eyebrow">{t('我们的使命','OUR PURPOSE')}</p><p>{t('πAI Lab 聚焦 AI-ready 科学基础设施与自主科学发现，探索科学知识的联结、检验与创造，拓展智能驱动的科学研究边界','πAI Lab advances research in AI-ready scientific infrastructure and autonomous scientific discovery, expanding how scientific knowledge is connected, tested and created')}</p></section>
 <section className="research-programme" id="research" aria-label={t('研究方向','Research directions')}>
  <div className="section programme-heading"><div className="section-heading"><p className="eyebrow">{t('01 / 研究方向','01 / RESEARCH')}</p><span>{t('两条路径，同一个方向','Two directions, one ambition')}</span></div></div>
  <section className="research-direction infrastructure-direction" id="infrastructure" aria-labelledby="infrastructure-heading">
   <header className="direction-opening section">
    <div className="direction-name"><p className="direction-number">{t('01.1 / 科学基础设施','01.1 / FOUNDATIONS')}</p><h2 id="infrastructure-heading">{t('面向人工智能的','AI-ready scientific')}<br/>{t('科学基础设施','infrastructure')}</h2></div>
    <p className="direction-intro">{t('构建贯通数据、模型、工具与知识的 AI-ready 科学基础设施，为科学推理、计算与验证提供共同基础','We build an AI-ready foundation across data, models, tools and knowledge, supporting scientific reasoning, computation and validation')}</p>
   </header>
   <ModelInfrastructure en={en} reduced={reduced} theme={theme}/>
  </section>
  <section className="research-direction discovery-direction" id="discovery" aria-labelledby="discovery-heading">
   <header className="direction-opening section">
    <div className="direction-name"><p className="direction-number">{t('01.2 / 自主科学发现','01.2 / DISCOVERY')}</p><h2 id="discovery-heading">{t('自主科学发现','Autonomous')}<br className="en-only" hidden={!en}/>{en?'scientific discovery':null}</h2></div>
    <p className="direction-intro">{t('探索自主智能如何揭示机制、发现规律，拓展科学知识的边界','We investigate how autonomous intelligence can uncover mechanisms, reveal governing principles, and expand the frontiers of scientific knowledge')}</p>
   </header>
   <AutonomousDiscovery en={en} reduced={reduced} theme={theme}/>
  </section>
 </section>
 <section className="work section" id="work"><div className="section-heading"><p className="eyebrow">{t('02 / 代表成果','02 / SELECTED WORK')}</p><span>{t('论文与研究系统','Publications & systems')}</span></div><div className="work-title"><h2>{t('代表成果','Selected work')}</h2><p>{t('智能体方法、研究系统与科学应用','Agent methods, research systems and scientific applications')}</p></div><div className="papers">{papers.map((p,i)=><a className="paper" key={p[0]} href={p[3]} target="_blank" rel="noreferrer"><span className="paper-index">0{i+1}</span><div><h3>{p[0]}</h3><p>{p[1]}</p></div><span className="paper-venue">{p[2]}</span><FileText size={20} aria-hidden="true"/></a>)}</div>
 <div className="systems-heading"><h3>{t('工具与系统','Tools & systems')}</h3><p>{t('让研究能力成为可用的工具','Research capabilities, made usable')}</p></div><div className="systems-grid">{systems.map((s,i)=><article key={s[0]}><div className="system-title"><div className="system-name">{React.createElement([Layers3,BookOpen,PenTool,ChartNoAxesCombined][i],{size:21,'aria-hidden':true})}<h4>{s[0]}</h4></div>{s[3]?<a href={s[3]} target="_blank" rel="noreferrer" aria-label={t('查看 '+s[0]+' 开源项目','View '+s[0]+' on GitHub')}><Github size={19}/></a>:null}</div><p className="system-kind">{t(s[1],['Agent workspace','Scientific knowledge','Scientific illustration','Data visualization'][i])}</p><p>{t(s[2].replace(/。$/,''),['A shared workspace for agent runtimes, projects, conversations and research history','Organizing literature, evidence and research leads around scientific questions','Scientific illustrations that communicate mechanisms and research ideas','Charts and visualization tools for research data'][i])}</p></article>)}</div></section>
 <section className="people section" id="people">
  <div className="section-heading"><p className="eyebrow">{t('03 / 团队','03 / PEOPLE')}</p><span>{t('团队与合作者','People & collaborators')}</span></div>
  <div className="people-heading"><h2>{t('一起探索的人','People behind the work')}</h2><p>{t('连接不同学科的视角，共同推进科学发现','Different disciplines, a shared pursuit of discovery')}</p></div>
  <div className="people-grid">
   {data.members.map(p=>{const isFounder=p.nameEn==='Zaoqu Liu';const content=<><div className="portrait"><img src={data.assets[p.avatar as keyof typeof data.assets]} alt={en?p.nameEn:p.nameZh} loading="lazy"/></div><div className="person-name"><h3>{en?p.nameEn:p.nameZh}{isFounder&&<ArrowUpRight size={16} aria-hidden="true"/>}</h3>{!en&&<p className="person-alias">{p.nameEn}</p>}{isFounder&&<p className="person-role founder">{t('创始人','Founder')}</p>}<p className="person-role">{isFounder?t('生物医学多模态大模型科学家','Biomedical Multimodal Large Model Scientist'):(en?p.roleEn:p.roleZh)}</p></div></>;return <article key={p.nameEn}>{isFounder?<a className="person-profile" href="https://zaoqu-liu.github.io/" target="_blank" rel="noopener noreferrer" aria-label={t('刘灶渠的个人主页','Zaoqu Liu’s personal website')}>{content}</a>:content}</article>})}
   {data.collaborators.map(p=><article key={p.en}><div className="portrait"><img src={data.assets[p.avatar as keyof typeof data.assets]} alt={en?p.en:p.zh} loading="lazy"/></div><div className="person-name"><h3>{en?p.en:p.zh}</h3>{!en&&<p>{p.en}</p>}<p className="person-role">{t('合作者','Collaborator')}</p><p className="person-affiliation">{en?p.affiliationEn:p.affiliationZh}</p></div></article>)}
  </div>
 </section>
 </main>
 <footer id="contact" className="section"><div className="section-heading"><p className="eyebrow">{t('04 / 联系合作','04 / CONTACT')}</p><span>πAI LAB</span></div><div className="contact-layout"><h2>{t('让科学发现','Advance discovery')}<br/><span>{t('继续向前','together')}</span></h2><div className="contact-details"><p>{t('欢迎围绕科学基础设施、自主发现与智能体方法开展学术交流和研究合作','For research collaborations and academic exchange in scientific infrastructure, autonomous discovery and agent methods')}</p><a href="mailto:liuzaoqu@163.com"><Mail size={18} aria-hidden="true"/>liuzaoqu@163.com</a></div></div><div className="footer-meta"><a className="brand" href="#home" aria-label={t('πAI Lab 首页','πAI Lab home')} onClick={e=>{e.preventDefault();go('home')}}><Logo/></a><span>© 2026 πAI Lab</span><a href="https://github.com/piai-lab" target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true"/>GitHub</a><a href="#home" onClick={e=>{e.preventDefault();go('home')}}>{t('返回顶部','Back to top')}<ArrowUp size={16} aria-hidden="true"/></a></div></footer>
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
