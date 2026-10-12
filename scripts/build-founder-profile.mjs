// Each personal page has one source: client/public/people/<slug>.
// Pages publishes docs; the standalone lab prototype uses its own static root.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const people = path.join(root, 'client/public/people');
for (const slug of fs.readdirSync(people)) for (const output of ['docs', 'artifacts/ui-prototypes']) {
  const source = path.join(people, slug);
  const destination = path.join(root, output, 'people', slug);
  fs.mkdirSync(destination, {recursive: true});
  fs.cpSync(source, destination, {recursive: true});
  if (output === 'artifacts/ui-prototypes') {
    const file = path.join(destination, 'index.html');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(
      'data-lab-home="/" href="/"',
      'data-lab-home="/piai-redesign-22.html" href="/piai-redesign-22.html"',
    ));
  }
}
console.log('Built personal pages for Pages and the current (v22) preview');
