export class ReceiptStore {
 v0/ze0ro99-a8e6e867
  constructor() { this.claims = new Set() }
  claimIfAbsent(app, evidence, window) {
    const key = `${app}\0${evidence}\0${window}`
    if (this.claims.has(key)) return false
    this.claims.add(key)
    return true
  }
}

export class InMemoryReceiptStore extends ReceiptStore {}


  constructor() {
    this.claims = new Set();
  }

  claimIfAbsent(app, evidence, window) {
    const key = `${app}\0${evidence}\0${window}`;
    if (this.claims.has(key)) return false;
    this.claims.add(key);
    return true;
  }
}
 main
