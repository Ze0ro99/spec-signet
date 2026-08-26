import { createHash } from 'node:crypto';

function normalize(value, path = '$') {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return typeof value === 'string' ? value.normalize('NFC') : value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || Object.is(value, -0)) throw new TypeError(`invalid number at ${path}`);
    return value;
  }
  if (Array.isArray(value)) return value.map((v, i) => { if (!(i in value)) throw new TypeError(`array hole at ${path}`); return normalize(v, `${path}[${i}]`); });
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => [k.normalize('NFC'), normalize(v, `${path}.${k}`)]);
    entries.sort(([a], [b]) => a.localeCompare(b, 'en', { sensitivity: 'variant' }));
    return Object.fromEntries(entries);
  }
  throw new TypeError(`unsupported value at ${path}`);
}
export function canonicalBytes(value) { return new TextEncoder().encode(JSON.stringify(normalize(value))); }
export function canonicalString(value) { return new TextDecoder().decode(canonicalBytes(value)); }
export function sha256(value) { return `sha256:${createHash('sha256').update(canonicalBytes(value)).digest('hex')}`; }
export function hashBytes(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }
export { normalize };

export const DOMAINS = Object.freeze({ PEP:'SIGNET-PEP-v1\n', KEY:'SIGNET-KEY-v1\n', ESCROW:'SIGNET-ESCROW-v1\n', FLOOR:'SIGNET-FLOOR-v1\n', ALLOC:'SIGNET-ALLOC-v1\n', RECEIPT:'SIGNET-RECEIPT-v1\n' });
export const signedBytes = (domain, body) => new TextEncoder().encode(domain + canonicalString(body));
export const b64 = (bytes) => Buffer.from(bytes).toString('base64');
export const unb64 = (s) => Buffer.from(s, 'base64');
export const hex = (bytes) => Buffer.from(bytes).toString('hex');
export const unhex = (s) => Buffer.from(s, 'hex');
export const hmacUid = (secret, uid) => `h1:${b64(createHash('sha256').update(Buffer.from(secret)).update(Buffer.from(uid.normalize('NFC'))).digest())}`;

// HMAC-SHA256 is intentionally exposed via node crypto in registry helpers; this pure helper is for deterministic vectors.
export function digest(bytes) { return createHash('sha256').update(bytes).digest(); }

export function evidenceId(event) { const { signature, ...body } = event; return hashBytes(canonicalBytes(body)); }

export function assertCanonical(value, bytes) { const actual = canonicalBytes(value); if (Buffer.compare(Buffer.from(actual), Buffer.from(bytes)) !== 0) throw new Error('non-canonical bytes'); }

export default canonicalBytes;
