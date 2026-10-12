import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const dir=import.meta.dirname;
const result=await build({entryPoints:[path.join(dir,'version-21/app.tsx')],bundle:true,write:false,minify:true,format:'iife',jsx:'automatic',alias:{'@':path.resolve(dir,'../../client/src')},define:{'process.env.NODE_ENV':'"production"'},legalComments:'inline',loader:{'.css':'empty','.svg':'text','.png':'dataurl'}});
const js=result.outputFiles[0].text.replaceAll('</script','<\\/script');
// Keep the existing Latin faces; the current Chinese subset replaces the older incomplete faces.
const latinFonts=fs.readFileSync(path.join(dir,'discovery-fonts.css'),'utf8').replace(/@font-face\s*\{[^}]*font-family:\s*'Noto Sans SC'[^}]*\}/g,'');
const css=latinFonts+'\n'+['research-cjk-fonts.css','autonomous-discovery.css','model-dikw/style.css','celestial-replica/style.css','version-21/site.css'].map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const licenses=fs.readFileSync(path.join(dir,'THIRD_PARTY_NOTICES.txt'),'utf8');
const favicon=fs.readFileSync(path.resolve(dir,'../../client/public/brand/piai-lab-favicon.svg'),'utf8').replace('#dce8ff','#a0dacb');
const icon='<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,'+Buffer.from(favicon).toString('base64')+'">';
const html='<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>πAI Lab · Autonomous Discovery &amp; AI-Ready Infrastructure</title><meta name="description" content="πAI Lab pursues autonomous scientific discovery and builds AI-ready scientific infrastructure">'+icon+'<script>document.documentElement.dataset.theme=new URLSearchParams(location.search).get("theme")==="light"?"light":"dark"</script><style>'+css+'</style></head><body><!-- 21: a unified editorial system with native light and dark scientific scenes; copied-adapted from the verified v20 sources. Licenses: '+licenses.replaceAll('--','—')+' --><div id="root"></div><script>'+js+'</script></body></html>';
fs.writeFileSync(path.join(dir,'piai-redesign-21.html'),html);
console.log('Built piai-redesign-21.html:',Buffer.byteLength(html),'bytes');
