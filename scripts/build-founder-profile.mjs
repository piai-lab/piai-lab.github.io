// The checked-in personal page has one source: client/public/people/zaoqu-liu.
// Pages publishes docs; the standalone lab prototype uses its own static root.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'client/public/people/zaoqu-liu');
for (const output of ['docs', 'artifacts/ui-prototypes']) {
  const destination = path.join(root, output, 'people/zaoqu-liu');
  fs.mkdirSync(destination, {recursive: true});
  fs.cpSync(source, destination, {recursive: true});
  if (output === 'artifacts/ui-prototypes') {
    const file = path.join(destination, 'index.html');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(
      'data-lab-home="/" href="/"',
      'data-lab-home="/piai-redesign-21.html" href="/piai-redesign-21.html"',
    ));
  }
}
console.log('Built founder profile for Pages and the v21 preview');
