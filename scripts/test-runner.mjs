import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const requested = process.argv[2];
const root = new URL('../test/', import.meta.url);
async function walk(url) { const out = []; for (const entry of await readdir(url, { withFileTypes: true })) { const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url); if (entry.isDirectory()) out.push(...await walk(child)); else if (entry.name.endsWith('.test.js')) out.push(fileURLToPath(child)); } return out; }
const files = await walk(root);
const selected = requested ? files.filter((file) => file.includes(`/test/${requested}/`)) : files;
if (!selected.length) throw new Error(`No tests found for ${requested ?? 'test'}`);
const result = spawnSync(process.execPath, ['--test', ...selected], { stdio: 'inherit' });
process.exit(result.status ?? 1);
