// Leonida Atlas — a gta6-trophy-guide-01 entry (Node 22, standard library only).
// The guide is this directory's app/ folder: plain static files a browser opens
// at app/index.html (ES modules, CSS, no build step), offline — it loads nothing
// over the network, and its trophy list and cited guides are
// app/data/trophies.json. The program hands it in: it copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be
// byte for byte what its own copy writes.
//
// Validation is log-only: it never throws and never changes the dossier bytes.
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

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

// Log-only checks (the scorer's own caps, reference/gate.json): 55 trophies,
// every guide non-empty, every step cited, 4 screenshots at most, each at
// most 256 KiB, dossier text at most 163,840 bytes.
try {
  const doc = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
  const list = doc.trophies ?? doc;
  console.log(`trophies: ${list.length}, steps: ${list.reduce((n, t) => n + (t.steps?.length ?? 0), 0)}, steppers: ${list.filter((t) => t.stepper).length}`);
  const bad = list.filter((t) => !t.guide || !t.sources?.length || t.steps.some((s) => !s.s));
  if (bad.length) console.log(`warn: ${bad.length} trophies with a missing guide, source or step source`);
} catch (err) {
  console.log(`warn: trophy check skipped (${err.message})`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
