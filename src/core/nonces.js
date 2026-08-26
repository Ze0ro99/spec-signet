import { readFile, writeFile, rename } from 'node:fs/promises';

export class InMemoryNonceStore {
  constructor() {
    this.used = new Set();
  }

  claimIfAbsent(app, nonce) {
    const key = `${app}\0${nonce}`;
    if (this.used.has(key)) return false;
    this.used.add(key);
    return true;
  }
}

export class FileNonceStore {
  constructor(path) {
    this.path = path;
    this.used = new Set();
    this.ready = this.load();
    this.locks = new Map();
  }

  async load() {
    try {
      this.used = new Set(JSON.parse(await readFile(this.path, 'utf8')));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  async claimIfAbsent(app, nonce) {
    await this.ready;
    const key = `${app}\0${nonce}`;
    const previous = this.locks.get(key) ?? Promise.resolve();
    const current = previous.then(async () => {
      if (this.used.has(key)) return false;
      this.used.add(key);
      const temporary = `${this.path}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify([...this.used]), 'utf8');
      await rename(temporary, this.path);
      return true;
    });
    this.locks.set(key, current.catch(() => undefined));
    try {
      return await current;
    } finally {
      if (this.locks.get(key) === current) this.locks.delete(key);
    }
  }
}
