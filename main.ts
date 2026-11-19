// Leonida Platinum — entrypoint (Node 22, no build step, no dependencies).
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with the kit's vendor library, byte for byte as the scorer
// rebuilds it. Run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(new URL('main.ts', import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
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
