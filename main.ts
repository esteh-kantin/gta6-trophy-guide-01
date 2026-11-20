import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Package the offline field guide and its browser-made screenshots for the scorer.
const project = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(destination, { recursive: true });
rmSync(join(destination, 'app'), { recursive: true, force: true });
rmSync(join(destination, 'screenshots'), { recursive: true, force: true });
cpSync(join(project, 'app'), join(destination, 'app'), { recursive: true });
cpSync(join(project, 'screenshots'), join(destination, 'screenshots'), { recursive: true });
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
