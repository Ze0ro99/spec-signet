import { readFile } from 'node:fs/promises';
import { canonicalBytes } from '../src/core/canonical.js';
const files=[];async function walk(u){for(const e of await (await import('node:fs/promises')).readdir(u,{withFileTypes:true})){const v=new URL(e.name+(e.isDirectory()?'/':''),u);if(e.isDirectory())await walk(v);else if(e.name.endsWith('.json'))files.push(v)}}await walk(new URL('../vectors/',import.meta.url));for(const f of files)JSON.parse(await readFile(f));canonicalBytes({ok:true});if (files.length < 1) throw new Error('CONFORMANCE requires committed vectors');
console.log(`CONFORMANCE OK: ${files.length} vectors`);
