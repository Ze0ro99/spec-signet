import { createHmac } from 'node:crypto';

export class Registry {
  constructor({ issuer = 'registry', epoch = 'epoch-1', issuerPublicKey = null } = {}) {
    this.issuer = issuer;
    this.epoch = epoch;
    this.issuerPublicKey = issuerPublicKey;
    this.apps = new Map();
    this.keys = new Map();
    this.users = new Map();
  }

  hasApp(id) {
    return this.apps.has(id);
  }

  addApp(id, secret) {
    this.apps.set(id, { secret });
  }

  addUser(hash, { kyc = true, mainnet = true } = {}) {
    this.users.set(hash, { kyc, mainnet });
  }

  eligibility(hash) {
    return this.users.get(hash) ?? { kyc: false, mainnet: false };
  }

  addKey(app, key) {
    this.keys.set(`${app}:${key.key_id}`, { ...key, app_id: app });
  }

  getKey(app, id) {
    return this.keys.get(`${app}:${id}`);
  }

  revoke(app, id, at) {
    const key = this.getKey(app, id);
    if (key) key.revoked_at_ms = at;
    return Boolean(key);
  }

  uidHash(app, uid) {
    const appRecord = this.apps.get(app);
    if (!appRecord) throw Error('unknown app');
    return `h1:${createHmac('sha256', appRecord.secret).update(uid.normalize('NFC')).digest('base64')}`;
  }
}
