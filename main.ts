// Leonida Atlas — hands the guide in: copies app/ and screenshots/ beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library.
// Leave vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte
// for byte what its own copy writes. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Validation is log-only: never throw, never change the dossier bytes.
try {
  const doc = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
  const list = doc.trophies ?? doc;
  const empty = list.filter((t) => !t.guide || !String(t.guide).trim()).length;
  const unstepped = list.filter((t) => !t.steps || t.steps.length === 0).length;
  const cited = list.reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  console.log(`trophies: ${list.length}, empty guides: ${empty}, without steps: ${unstepped}, cited steps: ${cited}`);
} catch (err) {
  console.log('validation skipped: ' + String(err));
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
