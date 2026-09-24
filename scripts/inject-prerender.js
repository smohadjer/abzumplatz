import { readFile, rm, writeFile } from 'node:fs/promises';
import { renderHomepage } from '../.prerender/entry-server.js';

const indexPath = new URL('../dist/index.html', import.meta.url);
const prerenderDirectory = new URL('../.prerender/', import.meta.url);
const marker = '<!--app-html-->';
const indexHtml = await readFile(indexPath, 'utf8');

if (!indexHtml.includes(marker)) {
    throw new Error(`Prerender marker ${marker} was not found in dist/index.html`);
}

await writeFile(indexPath, indexHtml.replace(marker, renderHomepage()));
await rm(prerenderDirectory, {recursive: true, force: true});
