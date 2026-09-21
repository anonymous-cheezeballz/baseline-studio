// Static packaging only: public files are copied byte-for-byte, never transformed.
import { readFileSync, existsSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve, relative, dirname, extname } from 'node:path';

const root = resolve('website');
const output = resolve('dist');
const entries = ['index.html', 'portfolio.html', 'about.html', 'start-project.html', 'thanks.html', '404.html',
  ...readdirSync(resolve(root, 'work')).filter(p => p.endsWith('.html')).map(p => `work/${p}`)];
const queue = entries.map(p => resolve(root, p));
const files = new Set();
const errors = [];
const anchors = [];
while (queue.length) {
  const file = queue.shift();
  if (files.has(file)) continue;
  if (!file.startsWith(root + '/')) { errors.push(`Outside public root: ${file}`); continue; }
  if (!existsSync(file)) { errors.push(`Missing: ${relative(root, file)}`); continue; }
  files.add(file);
  if (!['.html', '.css', '.js'].includes(extname(file))) continue;
  const text = readFileSync(file, 'utf8');
  if (/localhost|127\.0\.0\.1|file:\/\//.test(text)) errors.push(`Local URL: ${relative(root, file)}`);
  if (/-----BEGIN .*PRIVATE KEY|sk_live_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}/.test(text)) errors.push(`Possible secret: ${relative(root, file)}`);
  const refs = extname(file) === '.html'
    ? [...text.matchAll(/\b(?:href|src|data-src|poster)\s*=\s*["']([^"']*)["']/g)].map(m => m[1])
    : extname(file) === '.css'
      ? [...text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)].map(m => m[1] ?? m[2] ?? m[3]) : [];
  for (const ref of refs) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) {
      if (ref.startsWith('http:')) errors.push(`Insecure asset/link: ${relative(root, file)}`);
      continue;
    }
    const url = new URL(ref, 'https://static.invalid/' + relative(root, file));
    let target = resolve(root, decodeURIComponent(url.pathname).slice(1));
    if (url.pathname.endsWith('/')) target = resolve(target, 'index.html');
    queue.push(target);
    if (url.hash && extname(target) === '.html') anchors.push([target, decodeURIComponent(url.hash.slice(1)), file]);
  }
}
for (const [target, id, source] of anchors) {
  if (!existsSync(target)) continue;
  const ids = [...readFileSync(target, 'utf8').matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
  if (!ids.includes(id)) errors.push(`Missing anchor ${id}, linked by ${relative(root, source)}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (!process.argv.includes('--check')) {
  rmSync(output, { recursive: true, force: true });
  for (const file of files) {
    const destination = resolve(output, relative(root, file));
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(file, destination);
  }
}
console.log(`PASS: ${files.size} public files; internal assets/anchors, HTTPS paths, and basic secret scan. ${process.argv.includes('--check') ? 'Validation only.' : 'Copied unchanged to dist/.'}`);
