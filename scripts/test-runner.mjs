import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../test/', import.meta.url);
async function walk(url){const out=[];for(const e of await readdir(url,{withFileTypes:true})){const u=new URL(e.name+'/',url);if(e.isDirectory())out.push(...await walk(u));else if(e.name.endsWith('.test.js'))out.push(fileURLToPath(new URL(e.name, url)))}return out}
const files=await walk(root);const {spawnSync}=await import('node:child_process');const r=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});process.exit(r.status??1);
