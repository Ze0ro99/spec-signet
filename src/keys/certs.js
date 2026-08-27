import {DOMAINS} from '../core/canonical.js';import {sign,verifySignature} from '../core/keys-crypto.js';
export function certificate(body, issuerKey) {
  return { ...body, signature: sign(body, issuerKey, DOMAINS.KEY) };
}
export function verifyCertificate(c, pub) {
  const { signature, ...body } = c;
  return Boolean(pub) && verifySignature(body, signature, pub, DOMAINS.KEY);
}
export function register(reg, c, issuerPublicKey = reg.issuerPublicKey) {
  if (!verifyCertificate(c, issuerPublicKey) || (c.op === 'register' && reg.getKey(c.app_id, c.key_id))) throw Error('invalid certificate');
  reg.addKey(c.app_id, c);
  return c;
}
export const revoke = (reg, app, id, at) => reg.revoke(app, id, at);
