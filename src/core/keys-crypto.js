import { generateKeyPairSync, sign as nodeSign, verify as nodeVerify, createPublicKey, createPrivateKey } from 'node:crypto';
import { DOMAINS, signedBytes, b64, unb64 } from './canonical.js';
export function generateKeyPair() { const { publicKey, privateKey } = generateKeyPairSync('ed25519'); return { publicKey: publicKey.export({type:'spki',format:'der'}).toString('base64'), privateKey: privateKey.export({type:'pkcs8',format:'der'}).toString('base64') }; }
export function sign(body, privateKey, domain = DOMAINS.PEP) { return b64(nodeSign(null, signedBytes(domain, body), createPrivateKey({key:Buffer.from(privateKey,'base64'),format:'der',type:'pkcs8'}))); }
export function verifySignature(body, signature, publicKey, domain = DOMAINS.PEP) { try { return nodeVerify(null, signedBytes(domain, body), createPublicKey({key:Buffer.from(publicKey,'base64'),format:'der',type:'spki'}), unb64(signature)); } catch { return false; } }
export { DOMAINS };
