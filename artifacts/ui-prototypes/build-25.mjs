// Approved v25 source. Default: isolated preview; --production: prebuilt docs/ for both hosts.
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildPersonalPages} from '../../scripts/build-founder-profile.mjs';

const dir = import.meta.dirname;
const repository = path.resolve(dir, '../..');
if (process.argv.slice(2).some(arg => arg !== '--production')) throw new Error('Usage: build-25.mjs [--production]');
const production = process.argv.includes('--production');
const preview = production ? path.join(repository, 'docs') : path.join(dir, 'version-25/preview');
const assets = path.join(preview, 'assets');
const discoveryData = path.join(dir, 'discovery-data.json');
const portraitFiles = new Map();
const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 16);

// Keep the roster and original image bytes intact; only replace embedded asset URLs.
const localPortraits = {
  name: 'v25-local-portraits',
  setup(builder) {
    builder.onLoad({filter: /discovery-data\.json$/}, args => {
      if (path.resolve(args.path) !== discoveryData) return;
      const data = JSON.parse(fs.readFileSync(args.path, 'utf8'));
      for (const [key, value] of Object.entries(data.assets)) {
        const match = /^data:(image\/(?:png|webp|jpeg));base64,([\s\S]+)$/.exec(value);
        if (!match) throw new Error(`Expected an embedded portrait for ${key}`);
        const bytes = Buffer.from(match[2], 'base64');
        const extension = match[1] === 'image/jpeg' ? 'jpg' : match[1].slice(6);
        const filename = `portrait-${hash(bytes)}.${extension}`;
        portraitFiles.set(filename, bytes);
        data.assets[key] = `/assets/${filename}`;
      }
      return {contents: JSON.stringify(data), loader: 'json'};
    });
  },
};

// Adapt the existing v22 esbuild configuration without its production-copy side effect.
const result = await build({
  entryPoints: [path.join(dir, 'version-25/app.tsx')],
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  jsx: 'automatic',
  outdir: assets,
  entryNames: 'app',
  assetNames: '[name]-[hash]',
  publicPath: '/assets',
  alias: {'@': path.resolve(repository, 'client/src')},
  define: {'process.env.NODE_ENV': '"production"'},
  legalComments: 'inline',
  loader: {'.css': 'empty', '.svg': 'text', '.png': 'file', '.webp': 'file', '.jpg': 'file'},
  plugins: [localPortraits],
});

// Use the same local Latin faces and current Chinese subset as the approved v22 base.
const latinFonts = fs.readFileSync(path.join(dir, 'discovery-fonts.css'), 'utf8')
  .replace(/@font-face\s*\{[^}]*font-family:\s*'Noto Sans SC'[^}]*\}/g, '');
const css = latinFonts + '\n' + [
  'version-22/cjk-fonts.css',
  'autonomous-discovery.css',
  'model-dikw/style.css',
  'celestial-replica/style.css',
  'version-25/site.css',
].map(file => fs.readFileSync(path.join(dir, file), 'utf8')).join('\n');
if (/@import\s|url\(\s*["']?(?:https?:)?\/\//i.test(css)) {
  throw new Error('Site CSS must not depend on remote runtime styles or assets');
}

const script = result.outputFiles.find(file => file.path.endsWith('/app.js'));
const scriptName = production ? `app-${hash(script.contents)}.js` : 'app.js';
const styleName = production ? `site-${hash(css)}.css` : 'site.css';

const favicon = fs.readFileSync(path.join(repository, 'client/public/brand/piai-lab-favicon.svg'), 'utf8')
  .replace('#dce8ff', '#a0dacb');
const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>πAI Lab · Towards autonomous science</title>
<meta name="description" content="πAI Lab pursues autonomous scientific discovery and builds AI-ready scientific infrastructure">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}">
<script>document.documentElement.dataset.theme=new URLSearchParams(location.search).get("theme")==="light"?"light":"dark"</script>
<link rel="stylesheet" href="/assets/${styleName}">
</head>
<body>
<!-- πAI Lab v25. Local dependencies; see THIRD_PARTY_NOTICES.txt. -->
<div id="root"></div>
<script src="/assets/${scriptName}"></script>
</body>
</html>
`;

const notices = fs.readFileSync(path.join(dir, 'THIRD_PARTY_NOTICES.txt'));

const profileSlugs = buildPersonalPages(path.relative(repository, preview));
fs.mkdirSync(assets, {recursive: true});
for (const output of result.outputFiles) {
  fs.writeFileSync(output === script ? path.join(assets, scriptName) : output.path, output.contents);
}
for (const [filename, bytes] of portraitFiles) fs.writeFileSync(path.join(assets, filename), bytes);
fs.writeFileSync(path.join(assets, styleName), css);
fs.writeFileSync(path.join(preview, 'index.html'), html);
if (production) {
  fs.writeFileSync(path.join(preview, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>πAI Lab</title><meta http-equiv="refresh" content="0; url=/"><link rel="canonical" href="/"></head><body><a href="/">πAI Lab</a></body></html>\n');
}
fs.writeFileSync(path.join(preview, 'THIRD_PARTY_NOTICES.txt'), notices);
const bytesIn = directory => fs.readdirSync(directory, {withFileTypes: true})
  .reduce((total, entry) => {
    const file = path.join(directory, entry.name);
    return total + (entry.isDirectory() ? bytesIn(file) : fs.statSync(file).size);
  }, 0);
console.log(JSON.stringify({
  mode: production ? 'production' : 'preview',
  output: path.relative(repository, preview),
  scriptName,
  styleName,
  htmlBytes: Buffer.byteLength(html),
  scriptBytes: result.outputFiles.find(file => file.path.endsWith('/app.js')).contents.length,
  cssBytes: Buffer.byteLength(css),
  portraitCount: portraitFiles.size,
  portraitBytes: [...portraitFiles.values()].reduce((total, bytes) => total + bytes.length, 0),
  totalBytes: bytesIn(preview),
  profileSlugs,
}, null, 2));
