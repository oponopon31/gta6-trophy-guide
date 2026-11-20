// Leonida Platinum — entry program for gta6-trophy-guide-01.
//
// Hands the guide in: it copies app/ and screenshots/ from this repository
// into the output directory and writes /output/dossier.json with buildDossier
// from vendor/makefun-frontend.ts (the kit's copy, unchanged).
//
// Run it with Node 22: `node main.ts`. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output. The output directory itself is never removed — the
// grader may mount it on a read-only parent — only its contents are cleared.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function clearOutputDir(dir) {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

// Validation is log-only: it never throws and never changes the dossier
// bytes. It exists so a bad trophy file is noticed in the build log.
function validateTrophies(appDir) {
  const path = join(appDir, 'data', 'trophies.json');
  if (!existsSync(path)) {
    console.log('validate: app/data/trophies.json is missing');
    return;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.log('validate: app/data/trophies.json is not valid JSON: ' + err.message);
    return;
  }
  const trophies = Array.isArray(data) ? data : data.trophies || [];
  const emptyGuides = trophies.filter((t) => !t || typeof t.guide !== 'string' || t.guide.trim() === '').length;
  const noSources = trophies.filter((t) => !t || !Array.isArray(t.sources) || t.sources.length === 0).length;
  const unconfirmed = trophies.filter((t) => t && t.unconfirmed).map((t) => t.id).join(', ');
  console.log(
    'validate: trophies=' + trophies.length +
    ' empty-guides=' + emptyGuides +
    ' no-sources=' + noSources +
    ' unconfirmed=[' + unconfirmed + ']'
  );
}

function validateScreenshots(shotsDir) {
  if (!existsSync(shotsDir)) {
    console.log('validate: screenshots/ is missing');
    return;
  }
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  console.log('validate: screenshots=' + shots.length + ' (' + shots.join(', ') + ')');
}

clearOutputDir(OUT);
cpSync(join(ROOT, 'app'), join(OUT, 'app'), { recursive: true });
cpSync(join(ROOT, 'screenshots'), join(OUT, 'screenshots'), { recursive: true });
validateTrophies(join(OUT, 'app'));
validateScreenshots(join(OUT, 'screenshots'));

const dossier = buildDossier(OUT, CAPS);
writeFileSync(join(OUT, 'dossier.json'), dossier);
console.log('dossier: ' + dossier.length + ' bytes written to ' + join(OUT, 'dossier.json'));
