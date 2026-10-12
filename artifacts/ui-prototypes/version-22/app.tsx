import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,ArrowUp,ArrowDown,Menu,X,Sun,Moon,Mail,Github} from 'lucide-react';
import {Sheet,SheetTrigger,SheetContent,SheetTitle,SheetDescription} from '../../../client/src/components/ui/sheet';
import Logo from '../../../client/src/components/Logo';
import CelestialWheel from './celestial-replica/view';
import ModelInfrastructure from './model-dikw/view';
import AutonomousDiscovery from './autonomous-discovery';
import StarlightBackdrop from './starlight-backdrop';
import SiteMotion from './site-motion';
import data from '../discovery-data.json';

const papers=[
 ['KnowMe-Bench','Benchmarking Person Understanding for Lifelong Digital Companions','ACL','https://aclanthology.org/2026.acl-long.1394/','2026'],
 ['LiveCANNBench','Benchmark SWE AI Coding for Ascend CANN','Findings of ACL','https://aclanthology.org/2026.findings-acl.1143/','2026'],
 ['MemGovern','Enhancing Code Agents through Learning from Governed Human Experiences','arXiv','https://arxiv.org/abs/2601.06789','2026'],
 ['Controlled Self-Evolution','for Algorithmic Code Optimization','arXiv','https://arxiv.org/abs/2601.07348','2026'],
 ['π-HuB','The proteomic navigator of the human body','Nature · Perspective','https://www.nature.com/articles/s41586-024-08280-5','2024']
];
const systems=[
 ['Haros','智能体工作台','连接 Codex、Claude Code 等智能体运行环境，在同一界面管理项目、对话与工作记录。','https://github.com/piai-lab/Haros'],
 ['OmniScholar','科学知识与研究线索','围绕科学问题，组织文献、证据与研究线索。',''],
 ['OmniSketch','科学图示','以科研图示呈现科学机制与研究思路。',''],
 ['OmniPlotter','数据可视化','面向研究数据的科学图表与可视化工具。','']
];

// Line glyphs share the wheel's orbit language; each draws what its system does.
const glyphs=[
 <><ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(-24 32 32)"/><ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(30 32 32)"/><circle cx="32" cy="32" r="5"/><circle className="node" cx="11" cy="42" r="2.2"/><circle className="node" cx="52" cy="45" r="2.2"/><circle className="node warm" cx="48" cy="17" r="2.2"/></>,
 <><path d="M12 44L24 20L40 28L52 14M24 20L30 50L40 28L50 46M12 44L30 50"/><circle className="node" cx="12" cy="44" r="2.2"/><circle className="node" cx="24" cy="20" r="2.2"/><circle className="node warm" cx="40" cy="28" r="2.8"/><circle className="node" cx="52" cy="14" r="2.2"/><circle className="node" cx="30" cy="50" r="2.2"/><circle className="node" cx="50" cy="46" r="2.2"/></>,
 <><path d="M10 46C22 46 20 18 32 18S42 46 54 46"/><path className="faint" d="M10 46L20 28M54 46L44 28"/><circle className="node" cx="20" cy="28" r="2"/><circle className="node" cx="44" cy="28" r="2"/><circle className="node warm" cx="32" cy="18" r="2.8"/></>,
 <><path className="faint" d="M10 12V52H56"/><path d="M14 46C22 44 24 34 31 32S41 26 44 20S50 14 54 13"/><circle className="node" cx="22" cy="42" r="2"/><circle className="node" cx="31" cy="32" r="2"/><circle className="node" cx="44" cy="20" r="2"/><circle className="node warm" cx="54" cy="13" r="2.8"/></>
];
function ClosingOrbit({reduced}:{reduced:boolean}){
 const ref=useRef<SVGSVGElement>(null);
 useEffect(()=>{const svg=ref.current;if(!svg)return;if(reduced){svg.pauseAnimations();svg.setCurrentTime(6);return}svg.unpauseAnimations();const io=new IntersectionObserver(([e])=>e?.isIntersecting?svg.unpauseAnimations():svg.pauseAnimations());io.observe(svg);return()=>io.disconnect()},[reduced]);
 const rings=[[-16,300,62,36],[14,250,96,48],[38,210,128,60]];
 return <svg ref={ref} className="contact-orbit" viewBox="-320 -170 640 340" aria-hidden="true" focusable="false">
  <defs><linearGradient id="orbit-fade" x1="0" x2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0"/><stop offset=".5" stopColor="var(--accent)" stopOpacity=".5"/><stop offset="1" stopColor="var(--copper)" stopOpacity=".12"/></linearGradient><radialGradient id="orbit-spark"><stop offset="0" stopColor="var(--ink)"/><stop offset=".35" stopColor="var(--accent)" stopOpacity=".55"/><stop offset="1" stopColor="var(--accent)" stopOpacity="0"/></radialGradient></defs>
  {rings.map(([tilt,rx,ry,dur],i)=><g key={i} transform={`rotate(${tilt})`}><path id={'orbit-'+i} d={`M${-rx} 0A${rx} ${ry} 0 1 0 ${rx} 0A${rx} ${ry} 0 1 0 ${-rx} 0`} fill="none" stroke="url(#orbit-fade)" strokeWidth="1"/><circle r="9" fill="url(#orbit-spark)"><animateMotion dur={dur+'s'} begin={-i*11+'s'} repeatCount="indefinite"><mpath href={'#orbit-'+i}/></animateMotion></circle></g>)}
 </svg>
}
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
 useEffect(()=>{document.documentElement.lang=en?'en':'zh-CN';document.title=t('πAI Lab · 迈向自主科学','πAI Lab · Towards autonomous science');document.querySelector('meta[name=description]')?.setAttribute('content',t('πAI Lab 聚焦自主科学发现，构建面向人工智能的科学基础设施','πAI Lab pursues autonomous scientific discovery and builds AI-ready scientific infrastructure'));},[en]);
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
 const nav=[['research',t('研究方向','Research')],['work',t('研究成果','Selected work')],['people',t('团队','Team')]];
 const navLinks=nav.map(([id,label])=><a key={id} href={'#'+id} aria-current={(section===id||(id==='research'&&['infrastructure','discovery'].includes(section)))?'location':undefined} onClick={e=>{e.preventDefault();go(id)}}>{label}</a>);
 const systemKinds=['Agent workspace','Scientific knowledge','Scientific illustration','Data visualization'];
 const systemNotes=['A shared workspace for agent runtimes, projects, conversations and research history','Organizing literature, evidence and research leads around scientific questions','Illustrations that make mechanisms and research ideas legible','Charts and visualization tools for research data'];
 const systemNotesZh=['连接 Codex、Claude Code 等智能体运行环境，在同一界面管理项目、对话与工作记录','围绕科学问题，组织文献、证据与研究线索','以科研图示呈现科学机制与研究思路','面向研究数据的科学图表与可视化工具'];
 return <div className={'biomedical starlight-site research-site frontier-site v22 '+(reduced?'reduced-motion':'')}>
 <StarlightBackdrop reduced={reduced} theme={theme}/><SiteMotion reduced={reduced} paused={false}/>
 <a className="skip-link" href="#research">{t('跳至正文','Skip to content')}</a>
 <header className={"site-nav"+(section!=="home"?" nav-scrolled":"")}>
  <a className="brand" href="#home" aria-label={t('πAI Lab 首页','πAI Lab home')} onClick={e=>{e.preventDefault();go('home')}}><Logo/></a>
  <nav aria-label={t('主导航','Main navigation')}>{navLinks}</nav>
  <div className="nav-actions"><a className="contact-link" href="#contact" onClick={e=>{e.preventDefault();go('contact')}}>{t('联系合作','Contact')}</a><button className="theme-switch" onClick={toggleTheme} aria-label={theme==='dark'?t('切换浅色主题','Switch to light theme'):t('切换深色主题','Switch to dark theme')} title={theme==='dark'?t('浅色主题','Light theme'):t('深色主题','Dark theme')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="language-switch" onClick={changeLanguage} lang={en?'zh-CN':'en'} aria-label={en?'切换至中文':'Switch to English'}>{en?'中文':'EN'}</button>
  <Sheet open={menu} onOpenChange={setMenu}><SheetTrigger className="mobile-menu" aria-label={t('打开导航','Open navigation')}><Menu size={22}/></SheetTrigger><SheetContent className="bio-menu" onCloseAutoFocus={e=>{if(menuDestination.current){e.preventDefault();menuDestination.current.focus({preventScroll:true});menuDestination.current=null}}}><SheetTitle><Logo/></SheetTitle><SheetDescription>{t('AI-ready 科学基础设施 · 自主科学发现','AI-ready scientific infrastructure · Autonomous scientific discovery')}</SheetDescription><button onClick={()=>setMenu(false)} aria-label={t('关闭导航','Close navigation')}><X size={20}/></button><nav>{navLinks}<a href="#contact" onClick={e=>{e.preventDefault();go('contact')}}>{t('联系合作','Contact')}</a></nav></SheetContent></Sheet></div>
 </header>
 <main>
 <section className="hero" id="home" aria-labelledby="hero-heading">
  <div className="hero-copy">
   <h1 id="hero-heading">{en?<>Towards<br/><span>autonomous</span><br/>science</>:<>迈向<br/><span>自主科学</span></>}</h1>
   <p className="hero-lead">{en?'We build AI-ready scientific infrastructure and study agents that carry inquiry from hypothesis to evidence':<>构建 AI-ready 科学基础设施，<span className="keep">研究智能体如何从假设走向证据</span></>}</p>
   <a className="hero-explore" href="#research" onClick={e=>{e.preventDefault();go('research')}}>{t('了解研究方向','Explore our research')}<ArrowDown size={17} aria-hidden="true"/></a>
  </div>
  <div className="hero-wheel"><CelestialWheel en={en} reduced={reduced} theme={theme}/></div>
 </section>
 <section className="research-programme" id="research" aria-label={t('研究方向','Research directions')}>
  <section className="research-direction infrastructure-direction" id="infrastructure" aria-labelledby="infrastructure-heading">
   <header className="direction-opening section">
    <div className="direction-name"><p className="direction-kicker">{t('研究方向','Research')}</p><h2 id="infrastructure-heading">{en?<>AI-ready scientific<br/>infrastructure</>:<>AI-ready<br/>科学基础设施</>}</h2></div>
    <p className="direction-intro">{t('贯通数据、模型、工具与知识，让智能体能够查找、调用和核验，为科学推理、计算与验证提供共同基础','We connect data, models, tools and knowledge so that agents can find, use and verify them, giving scientific reasoning, computation and validation common ground')}</p>
   </header>
   <ModelInfrastructure en={en} reduced={reduced} theme={theme}/>
  </section>
  <section className="research-direction discovery-direction" id="discovery" aria-labelledby="discovery-heading">
   <header className="direction-opening section">
    <div className="direction-name"><h2 id="discovery-heading">{en?<>Autonomous<br/>scientific discovery</>:<>自主科学发现</>}</h2></div>
    <p className="direction-intro">{t('研究智能体如何自主选择实验、用证据检验预测、修正解释，让科学探究形成闭环','We study how agents can choose experiments, test predictions against evidence and revise their explanations, closing the loop of inquiry')}</p>
   </header>
   <AutonomousDiscovery en={en} reduced={reduced} theme={theme}/>
  </section>
 </section>
 <section className="work section" id="work" aria-labelledby="work-heading">
  <div className="work-title"><h2 id="work-heading">{t('研究成果','Selected work')}</h2><p>{t('智能体方法、研究系统与科学应用','Agent methods, research systems and scientific applications')}</p></div>
  <div className="papers">{[...new Set(papers.map(p=>p[4]))].map(year=><div className="paper-year-group" key={year}><p className="paper-year">{year}</p><div>{papers.filter(p=>p[4]===year).map(p=><a className="paper" key={p[0]} href={p[3]} target="_blank" rel="noreferrer"><div><h3>{p[0]}</h3><p>{p[1]}</p></div><span className="paper-venue">{p[2]}</span><ArrowUpRight size={18} aria-hidden="true"/></a>)}</div></div>)}</div>
  <h3 className="systems-heading">{t('研究系统','Research systems')}</h3>
  <div className="systems-grid">{systems.map((s,i)=><article key={s[0]}><svg className="system-glyph" viewBox="0 0 64 64" aria-hidden="true" focusable="false">{glyphs[i]}</svg><div className="system-title"><h4>{s[0]}</h4>{s[3]?<a href={s[3]} target="_blank" rel="noreferrer" aria-label={t('查看 '+s[0]+' 开源项目','View '+s[0]+' on GitHub')}><Github size={17}/></a>:null}</div><p className="system-kind">{t(s[1],systemKinds[i])}</p><p>{en?systemNotes[i]:systemNotesZh[i]}</p></article>)}</div>
 </section>
 <section className="people section" id="people" aria-label={t('团队与合作者','Team and collaborators')}>
  <section className="people-group" aria-labelledby="team-heading">
  <div className="people-heading"><h2 id="team-heading">{t('团队成员','Team')}</h2></div>
  <div className="people-grid">
   {data.members.map(p=>{
    const isFounder=p.nameEn==='Zaoqu Liu',isPresident=p.nameEn==='Fuchu He';
    const profileHref=isFounder?`/people/zaoqu-liu/?lang=${en?'en':'zh'}&theme=${theme}`:isPresident?'https://www.pi-hub.org.cn/news/news/%2091':null;
    const content=<><div className="portrait"><img src={data.assets[p.avatar as keyof typeof data.assets]} alt={en?p.nameEn:p.nameZh} loading="lazy"/></div><div className="person-name"><h3>{en?p.nameEn:p.nameZh}{profileHref&&<ArrowUpRight size={15} aria-hidden="true"/>}</h3>{!en&&<p className="person-alias">{p.nameEn}</p>}{isFounder&&<p className="person-role founder">{t('创始人','Founder')}</p>}{isPresident&&<p className="person-role">{t('广东智慧医学国际研究院院长','President, IAPM')}</p>}<p className="person-role">{isFounder?t('生物医学多模态大模型科学家','Biomedical Multimodal Large Model Scientist'):(en?p.roleEn:p.roleZh)}</p></div></>;
    return <article key={p.nameEn}>{profileHref?<a className="person-profile" href={profileHref} target={isPresident?'_blank':undefined} rel={isPresident?'noopener noreferrer':undefined} aria-label={isFounder?t('刘灶渠的个人主页','Zaoqu Liu’s personal website'):t('贺福初院士的 π-HuB 官方介绍（新窗口）','Fuchu He’s π-HuB profile (opens in a new tab)')}>{content}</a>:content}</article>
   })}
  </div>
  </section>
  <section className="people-group" aria-labelledby="collaborators-heading">
  <div className="people-heading"><h2 id="collaborators-heading">{t('合作者','Collaborators')}</h2></div>
  <div className="people-grid">
   {data.collaborators.map(p=><article key={p.en}><div className="portrait"><img src={data.assets[p.avatar as keyof typeof data.assets]} alt={en?p.en:p.zh} loading="lazy"/></div><div className="person-name"><h3>{en?p.en:p.zh}</h3>{!en&&<p className="person-alias">{p.en}</p>}<p className="person-affiliation">{en?p.affiliationEn:p.affiliationZh}</p></div></article>)}
  </div>
  </section>
 </section>
 </main>
 <footer id="contact" className="section" aria-labelledby="contact-heading"><div className="contact-layout"><ClosingOrbit reduced={reduced}/><h2 id="contact-heading">{t('欢迎研究合作','Open to collaboration')}</h2><div className="contact-details"><p>{en?'Academic exchange and joint research on scientific infrastructure, autonomous discovery and agent methods':<>围绕科学基础设施、自主发现与智能体方法，<span className="keep">开展学术交流与联合研究</span></>}</p><a href="mailto:liuzaoqu@163.com"><Mail size={18} aria-hidden="true"/>liuzaoqu@163.com</a></div></div><div className="footer-meta"><span>© 2026 πAI Lab</span><a href="https://github.com/piai-lab" target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true"/>GitHub</a><a href="#home" onClick={e=>{e.preventDefault();go('home')}}>{t('返回顶部','Back to top')}<ArrowUp size={16} aria-hidden="true"/></a></div></footer>
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
