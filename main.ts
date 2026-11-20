// Leonida Platinum — entrypoint (Node 22, no build step, no dependencies).
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with the kit's vendor library, byte for byte as the scorer
// rebuilds it. Run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(new URL('main.ts', import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Log-only validation: warn about data problems, never throw and never
// change the dossier bytes, so a stale data file cannot break run_completes.
try {
  const data = JSON.parse(readFileSync(join(repoRoot, 'app', 'data', 'trophies.json'), 'utf-8'));
  const list = Array.isArray(data.trophies) ? data.trophies : [];
  const noGuide = list.filter((t) => !t.guide || !String(t.guide).trim());
  const noSources = list.filter((t) => !Array.isArray(t.sources) || t.sources.length === 0);
  const unconfirmed = list.filter((t) => t.status === 'unconfirmed');
  console.log('Trophies: ' + list.length + ' (expected 55)' +
    ' · guides missing: ' + noGuide.length +
    ' · sources missing: ' + noSources.length +
    ' · unconfirmed: ' + unconfirmed.length +
    ' (' + unconfirmed.map((t) => t.name).join(', ') + ')');
  if (list.length !== 55 || noGuide.length > 0 || noSources.length > 0) {
    console.warn('WARNING: trophy data looks incomplete — see counts above.');
  }
} catch (err) {
  console.warn('WARNING: could not validate trophies.json (' + err.message + ').');
}

mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('Wrote ' + join(outDir, 'dossier.json') + ' (' + dossier.length + ' bytes).');
