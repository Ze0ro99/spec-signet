import { readFile } from 'node:fs/promises'; import { createHash } from 'node:crypto';
const raw=await readFile(new URL('../packs/catalog.v1.json',import.meta.url)); JSON.parse(raw); const hash=createHash('sha256').update(raw).digest('hex'); console.log(`catalog sha256:${hash}`);
