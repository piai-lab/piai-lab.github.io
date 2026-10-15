import React,{Fragment,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,ArrowUp,ArrowDown,Menu,X,Sun,Moon,Mail,Github,BookOpen} from 'lucide-react';
import {Sheet,SheetTrigger,SheetContent,SheetTitle,SheetDescription} from '../../../client/src/components/ui/sheet';
import Logo from '../../../client/src/components/Logo';
import CelestialWheel from './celestial-replica/view';
import ModelInfrastructure from './model-dikw/view';
import AutonomousDiscovery from './autonomous-discovery';
import StarlightBackdrop from './starlight-backdrop';
import SiteMotion from './site-motion';
import data from '../discovery-data.json';
import ai4sIcon from './platforms/ai4s-news.svg';
import scholarIcon from './platforms/omnischolar.svg';
import eulerIcon from './platforms/euler.png';

const svgSrc=(svg:string)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
const platforms:{id:string,name:string,url:string,icon?:string}[]=[
 {id:'ai4s-news',name:'AI4S News',url:'https://ai4snews.wisdomeyes.cn/en',icon:svgSrc(ai4sIcon)},
 {id:'omnischolar',name:'OmniScholar',url:'https://omnischolar.wisdomeyes.cn/',icon:svgSrc(scholarIcon)},
 {id:'omniknowledge',name:'OmniKnowledge',url:'https://omniknowledge.wisdomeyes.cn/'},
 {id:'euler',name:'Euler',url:'https://euler.wisdomeyes.cn/',icon:eulerIcon}
];
function PlatformIcon({id}:{id:string}){const p=platforms.find(x=>x.id===id)!;return <span className={'platform-icon '+p.id} aria-hidden="true">{p.icon?<i style={{WebkitMaskImage:`url("${p.icon}")`,maskImage:`url("${p.icon}")`}}/>:<BookOpen size={17}/>}</span>}
// [date, English title, Chinese title, English line, Chinese line, platform id]
const news:[string,string,string,string,string,string][]=[
 ['2026.10.10','OmniKnowledge released','OmniKnowledge 发布','','','omniknowledge'],
 ['2026.09.20','OmniScholar released','OmniScholar 发布','','','omnischolar'],
 ['2026.09.18','PathWeaver submitted to ICLR 2027','PathWeaver 投稿 ICLR 2027','Our work explores how explicit reasoning graphs can enhance diagnostic reasoning in pathology vision-language models','探索显式推理图|如何增强病理视觉语言模型的|诊断推理',''],
 ['2026.09.16','OmniFigure submitted to ICLR 2027','OmniFigure 投稿 ICLR 2027','We explore a unified representation for data visualization, aiming to describe different visualization forms within a common framework','探索数据可视化的统一表示，|在同一框架内描述不同的可视化形式',''],
 ['2026.09.15','AI4S News released','AI4S News 发布','','','ai4s-news'],
 ['2026.09.01','Founded πAI Lab','πAI Lab 成立','Advancing AI-ready scientific infrastructure and autonomous scientific discovery','推进 AI-ready 科学基础设施|与自主科学发现','']
];

function ClosingOrbit({reduced}:{reduced:boolean}){
 const ref=useRef<SVGSVGElement>(null);
 useEffect(()=>{const svg=ref.current;if(!svg)return;if(reduced){svg.pauseAnimations();svg.setCurrentTime(6);return}svg.unpauseAnimations();const io=new IntersectionObserver(([e])=>e?.isIntersecting?svg.unpauseAnimations():svg.pauseAnimations());io.observe(svg);return()=>io.disconnect()},[reduced]);
 const rings=[[-16,300,62,36],[14,250,96,48],[38,210,128,60]];
 return <svg ref={ref} className="contact-orbit" viewBox="-320 -170 640 340" aria-hidden="true" focusable="false">
  <defs><linearGradient id="orbit-fade" x1="0" x2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0"/><stop offset=".5" stopColor="var(--accent)" stopOpacity=".34"/><stop offset="1" stopColor="var(--copper)" stopOpacity=".1"/></linearGradient><radialGradient id="orbit-spark"><stop offset="0" stopColor="var(--spark)"/><stop offset=".35" stopColor="var(--accent)" stopOpacity=".45"/><stop offset="1" stopColor="var(--accent)" stopOpacity="0"/></radialGradient></defs>
  {rings.map(([tilt,rx,ry,dur],i)=><g key={i} transform={`rotate(${tilt})`}><path id={'orbit-'+i} d={`M${-rx} 0A${rx} ${ry} 0 1 0 ${rx} 0A${rx} ${ry} 0 1 0 ${-rx} 0`} fill="none" stroke="url(#orbit-fade)" strokeWidth="1"/><circle r="9" fill="url(#orbit-spark)"><animateMotion dur={dur+'s'} begin={-i*11+'s'} repeatCount="indefinite"><mpath href={'#orbit-'+i}/></animateMotion></circle></g>)}
 </svg>
}
// Team members whose personal pages live under /people/<slug>/
const onSite:Record<string,string>={'Zaoqu Liu':'zaoqu-liu','Yushuai Wu':'yushuai-wu','Mingyang Yan':'mingyang-yan'};
const phrases:Record<string,string>={
 '中山大学副教授':'中山大学|副教授',
 '德克萨斯大学休斯顿健康科学中心博士后研究员':'德克萨斯大学|休斯顿健康科学中心|博士后研究员',
 '美的 AI 研究院 AI Agent 算法负责人':'美的 AI 研究院 |AI Agent 算法负责人',
 '上海交通大学硕士生':'上海交通大学|硕士生',
 '中国科学院计算技术研究所硕士生':'中国科学院|计算技术研究所|硕士生',
 '中国科学院自动化研究所硕士生':'中国科学院|自动化研究所|硕士生',
 '广东智慧医学国际研究院院长':'广东智慧医学|国际研究院院长',
 '生物医学多模态大模型科学家':'生物医学多模态|大模型科学家',
 'Associate Professor, Sun Yat-sen University':'Associate Professor, |Sun Yat-sen University',
 'Academician of the Chinese Academy of Sciences':'Academician of the |Chinese Academy of Sciences',
 "Master's Student, Institute of Computing Technology, Chinese Academy of Sciences":"Master's Student, |Institute of Computing Technology, |Chinese Academy of Sciences",
 "Master's Student, Institute of Automation, Chinese Academy of Sciences":"Master's Student, |Institute of Automation, |Chinese Academy of Sciences",
 'Postdoctoral Researcher, The University of Texas Health Science Center at Houston':'Postdoctoral Researcher, |The University of Texas |Health Science Center at Houston'
};
const ph=(text:string)=>{const v=phrases[text]??text;return v.includes('|')?v.split('|').map((x,i)=><Fragment key={i}><span className="keep">{x.trimEnd()}</span>{/\s$/.test(x)?' ':null}</Fragment>):v};
const sectionIds=['home','research','infrastructure','discovery','news','people','contact'];
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
 const nav=[['research',t('研究方向','Research')],['news',t('新闻与动态','News & Events')],['people',t('团队','Team')]];
 const navLinks=nav.map(([id,label])=><a key={id} href={'#'+id} aria-current={(section===id||(id==='research'&&['infrastructure','discovery'].includes(section)))?'location':undefined} onClick={e=>{e.preventDefault();go(id)}}>{label}</a>);
 return <div className={'biomedical starlight-site research-site frontier-site v22 '+(reduced?'reduced-motion':'')}>
 <StarlightBackdrop reduced={reduced} theme={theme}/><SiteMotion reduced={reduced} paused={false}/>
 <a className="skip-link" href="#research">{t('跳至正文','Skip to content')}</a>
 <header className={"site-nav"+(section!=="home"?" nav-scrolled":"")}>
  <a className="brand" href="#home" aria-label={t('πAI Lab 首页','πAI Lab home')} onClick={e=>{e.preventDefault();go('home')}}><Logo/></a>
  <nav aria-label={t('主导航','Main navigation')}>{navLinks}</nav>
  <div className="nav-actions"><a className="contact-link" href="#contact" onClick={e=>{e.preventDefault();go('contact')}}>{t('联系合作','Contact')}</a><button className="theme-switch" onClick={toggleTheme} aria-label={theme==='dark'?t('切换浅色主题','Switch to light theme'):t('切换深色主题','Switch to dark theme')} title={theme==='dark'?t('浅色主题','Light theme'):t('深色主题','Dark theme')}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button><button className="language-switch" onClick={changeLanguage} lang={en?'zh-CN':'en'} aria-label={en?'切换至中文':'Switch to English'}>{en?'中文':'EN'}</button>
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
    <p className="direction-intro">{ph(t('贯通数据、模型、工具与知识，|让智能体能够查找、调用和核验，|为科学推理、计算与验证提供共同基础','We connect data, models, tools and knowledge so that agents can find, use and verify them, giving scientific reasoning, computation and validation common ground'))}</p>
   </header>
   <ModelInfrastructure en={en} reduced={reduced} theme={theme}/>
  </section>
  <section className="research-direction discovery-direction" id="discovery" aria-labelledby="discovery-heading">
   <header className="direction-opening section">
    <div className="direction-name"><h2 id="discovery-heading">{en?<>Autonomous<br/>scientific discovery</>:<>自主科学发现</>}</h2></div>
    <p className="direction-intro">{ph(t('研究智能体如何自主选择实验、|用证据检验预测、修正解释，|让科学探究形成闭环','We study how agents can choose experiments, test predictions against evidence and revise their explanations, closing the loop of inquiry'))}</p>
   </header>
   <AutonomousDiscovery en={en} reduced={reduced} theme={theme}/>
  </section>
 </section>
 <section className="news section" id="news" aria-labelledby="news-heading">
  <div className="section-title"><h2 id="news-heading">{t('新闻与动态','News & Events')}</h2></div>
  <ol className="news-list">{news.map(([date,title,titleZh,line,lineZh,platform])=>{const p=platforms.find(x=>x.id===platform);const body=<><time dateTime={date.replaceAll('.','-')}>{date}</time><div><h3>{en?title:titleZh}</h3>{line&&<p>{en?line:ph(lineZh)}</p>}</div>{p?<><PlatformIcon id={p.id}/><ArrowUpRight size={18} aria-hidden="true"/></>:null}</>;return <li key={date} className="news-item">{p?<a href={p.url} target="_blank" rel="noopener noreferrer">{body}</a>:<div>{body}</div>}</li>})}</ol>
  <div className="platforms"><h3>{t('平台','Platforms')}</h3><ul>{platforms.map(p=><li key={p.id}><a href={p.url} target="_blank" rel="noopener noreferrer"><PlatformIcon id={p.id}/><span>{p.name}</span><ArrowUpRight size={16} aria-hidden="true"/></a></li>)}</ul></div>
 </section>
 <section className="people section" id="people" aria-label={t('团队与合作者','Team and collaborators')}>
  <section className="people-group" aria-labelledby="team-heading">
  <div className="people-heading"><h2 id="team-heading">{t('团队成员','Team')}</h2></div>
  <div className="people-grid">
   {data.members.map(p=>{
    const isFounder=p.nameEn==='Zaoqu Liu',isPresident=p.nameEn==='Fuchu He',page=onSite[p.nameEn];
    const profileHref=page?`/people/${page}/?lang=${en?'en':'zh'}&theme=${theme}`:isPresident?'https://www.pi-hub.org.cn/news/news/%2091':null;
    const content=<><div className="portrait"><img src={data.assets[p.avatar as keyof typeof data.assets]} alt={en?p.nameEn:p.nameZh} loading="lazy"/></div><div className="person-name"><h3>{en?p.nameEn:p.nameZh}{profileHref&&<ArrowUpRight size={15} aria-hidden="true"/>}</h3>{!en&&<p className="person-alias">{p.nameEn}</p>}{isFounder&&<p className="person-role founder">{t('创始人','Founder')}</p>}{isPresident&&<p className="person-role">{ph(t('广东智慧医学国际研究院院长','President, IAPM'))}</p>}<p className="person-role">{ph(isFounder?t('生物医学多模态大模型科学家','Biomedical Multimodal Large Model Scientist'):(en?p.roleEn:p.roleZh))}</p></div></>;
    return <article key={p.nameEn}>{profileHref?<a className="person-profile" href={profileHref} target={isPresident?'_blank':undefined} rel={isPresident?'noopener noreferrer':undefined} aria-label={page?t(`${p.nameZh}的个人主页`,`${p.nameEn}’s personal website`):t('贺福初院士的 π-HuB 官方介绍（新窗口）','Fuchu He’s π-HuB profile (opens in a new tab)')}>{content}</a>:content}</article>
   })}
  </div>
  </section>
  <section className="people-group" aria-labelledby="collaborators-heading">
  <div className="people-heading"><h2 id="collaborators-heading">{t('合作者','Collaborators')}</h2></div>
  <div className="people-grid">
   {data.collaborators.map(p=><article key={p.en}><div className="portrait"><img src={data.assets[p.avatar as keyof typeof data.assets]} alt={en?p.en:p.zh} loading="lazy"/></div><div className="person-name"><h3>{en?p.en:p.zh}</h3>{!en&&<p className="person-alias">{p.en}</p>}<p className="person-affiliation">{ph(en?p.affiliationEn:p.affiliationZh)}</p></div></article>)}
  </div>
  </section>
 </section>
 </main>
 <footer id="contact" className="section" aria-labelledby="contact-heading"><div className="contact-layout"><ClosingOrbit reduced={reduced}/><h2 id="contact-heading">{t('欢迎研究合作','Open to collaboration')}</h2><div className="contact-details"><p>{en?'Academic exchange and joint research on scientific infrastructure, autonomous discovery and agent methods':<>围绕科学基础设施、自主发现与智能体方法，<span className="keep">开展学术交流与联合研究</span></>}</p><a href="mailto:liuzaoqu@163.com"><Mail size={18} aria-hidden="true"/>liuzaoqu@163.com</a></div></div><div className="footer-meta"><span>© 2026 πAI Lab</span><a href="https://github.com/piai-lab" target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true"/>GitHub</a><a href="#home" onClick={e=>{e.preventDefault();go('home')}}>{t('返回顶部','Back to top')}<ArrowUp size={16} aria-hidden="true"/></a></div></footer>
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
