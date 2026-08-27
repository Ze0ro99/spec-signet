export class ReceiptStore {
  constructor() { this.claims = new Set() }
  claimIfAbsent(app, evidence, window) {
    const key = `${app}\0${evidence}\0${window}`
    if (this.claims.has(key)) return false
    this.claims.add(key)
    return true
  }
}

export class InMemoryReceiptStore extends ReceiptStore {}

