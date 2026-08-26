import { readFile } from 'node:fs/promises';
import { canonicalBytes } from '../src/core/canonical.js';
import { signedBytes } from '../src/core/canonical.js';
import { verifySignature } from '../src/core/keys-crypto.js';

const root = new URL('../vectors/', import.meta.url);
const files = [];

async function walk(url) {
  for (const entry of await (await import('node:fs/promises')).readdir(url, { withFileTypes: true })) {
    const next = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) await walk(next);
    else if (entry.name.endsWith('.json')) files.push(next);
  }
}

await walk(root);
for (const file of files) JSON.parse(await readFile(file, 'utf8'));

const required = [
  'pep/valid.json',
  'pep/attacks.json',
  'pep/cross-language.json',
  'packs/retail-valid.json',
  'receipts/first-ok.json',
  'receipts/second-replay.json',
  'transparency/pep-with-floor.json',
  'transparency/escrow-valid.json',
  'alloc/snapshot.json',
];
const available = new Set(files.map((file) => file.pathname.split('/vectors/')[1]));
for (const file of required) if (!available.has(file)) throw new Error(`missing conformance vector: ${file}`);

const attacks = JSON.parse(await readFile(new URL('pep/attacks.json', root), 'utf8'));
if (attacks.minimum_exact_cases < 18) throw new Error('attack vector minimum is below 18');

const crossLanguage = JSON.parse(await readFile(new URL('pep/cross-language.json', root), 'utf8'));
if (!verifySignature(
  crossLanguage.body,
  crossLanguage.signature,
  crossLanguage.public_key,
  crossLanguage.domain,
)) throw new Error('cross-language signature vector does not verify');

const canonical = new TextDecoder().decode(canonicalBytes(crossLanguage.body));
if (canonical !== '{"action_id":"retail.order_delivered","app_id":"app.marketplace","key_id":"k1","nonce":"cross-language-0001","pioneer_uid_hash":"h1:dGVzdC1wcm9vZg==","spec":"SIGNET-PEP-v1","timestamp_ms":1764000000000,"utility_class":"A","weight":2}') {
  throw new Error('canonical vector drift');
}
if (Buffer.compare(
  Buffer.from(signedBytes(crossLanguage.domain, crossLanguage.body)),
  Buffer.from(`${crossLanguage.domain}${canonical}`),
) !== 0) throw new Error('signed byte construction drift');

console.log(`CONFORMANCE OK: ${files.length} vectors; signed PEP and required planes verified`);