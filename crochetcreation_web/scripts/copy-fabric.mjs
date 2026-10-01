/**
 * Vendor fabric.js into `public/` so the browser loads it untouched.
 *
 * fabric does not survive webpack's minifier: its SVG parser builds the
 * tag-name regexes at module load, and after minification
 * /^(path|circle|…)/ stops matching, so every SVG import parses to zero
 * objects and fails silently. Development never minifies, so this only
 * appeared in production. Excluding fabric from the minimizer did not stick,
 * and turning minification off for the whole app is not a trade worth making.
 *
 * The dist file is already minified by fabric's own build and is entirely
 * self-contained, so serving it as a static asset costs nothing and removes
 * the bundler from the path completely.
 */
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../node_modules/fabric/dist/index.min.mjs');
const target = resolve(here, '../public/vendor/fabric.min.mjs');

try {
  await stat(source);
} catch {
  console.error(
    `\n[copy-fabric] Cannot find ${source}.\n` +
      '[copy-fabric] Run `npm install` before building.\n',
  );
  process.exit(1);
}

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
const { size } = await stat(target);
console.log(`[copy-fabric] public/vendor/fabric.min.mjs (${Math.round(size / 1024)} KB)`);
