import React,{useEffect} from 'react';
import {animate,inView,motion,useScroll} from 'framer-motion';

// One page owner for reveal choreography and reading progress.
export default function SiteMotion({reduced,paused}:{reduced:boolean;paused:boolean}){
 const {scrollYProgress}=useScroll();
 useEffect(()=>{
  const root=document.querySelector('.biomedical') as HTMLElement;
  const selectors='.lab-statement,.direction-opening,.work-title,.paper,.systems-heading,.systems-grid article,.people-heading,.people-grid article,.contact-layout';
  const elements=Array.from(root.querySelectorAll<HTMLElement>(selectors));
  if(reduced||paused){elements.forEach(el=>{el.style.opacity='1';el.style.transform='none';});return;}
  const animations:ReturnType<typeof animate>[]=[];
  const stop=inView(elements,el=>{const animation=animate(el,{opacity:[.75,1],transform:['translateY(12px)','translateY(0px)']},{duration:.45,ease:[.16,1,.3,1]});animations.push(animation);},{margin:'0px 0px -6% 0px'});
  return()=>{stop();animations.forEach(a=>a.stop());elements.forEach(el=>{el.style.opacity='1';el.style.transform='none';});};
 },[reduced,paused]);
 return <motion.div className="reading-progress" style={{scaleX:scrollYProgress}} aria-hidden="true"/>;
}
