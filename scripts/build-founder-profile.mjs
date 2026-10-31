// Each personal page has one source: client/public/people/<slug>.
// Both production and isolated previews use this copy/return-link adapter.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const people = path.join(root, 'client/public/people');
export function buildPersonalPages(output, homePath = '/') {
  // Validate all pages before copying any of them.
  const profiles = fs.readdirSync(people)
    .filter(slug => fs.statSync(path.join(people, slug)).isDirectory())
    .map(slug => {
      const source = path.join(people, slug);
      let homeLinks = 0;
      const html = fs.readFileSync(path.join(source, 'index.html'), 'utf8')
        .replace(/<a\b[^>]*\bdata-lab-home="[^"]*"[^>]*>/g, tag => {
          homeLinks++;
          return tag.replace(/\bdata-lab-home="[^"]*"/, `data-lab-home="${homePath}"`)
            .replace(/\bhref="[^"]*"/, `href="${homePath}"`);
        });
      if (!homeLinks) throw new Error(`Missing lab return link: ${slug}`);
      return {slug, source, html};
    });
  for (const {slug, source, html} of profiles) {
    const destination = path.resolve(root, output, 'people', slug);
    fs.mkdirSync(destination, {recursive: true});
    fs.cpSync(source, destination, {recursive: true});
    fs.writeFileSync(path.join(destination, 'index.html'), html);
  }
  return profiles.map(profile => profile.slug);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log('Built personal pages:', buildPersonalPages('docs').join(', '));
}
