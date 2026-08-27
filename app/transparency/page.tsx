import snapshot from '../../results/transparency.json'

type Snapshot = typeof snapshot & {
  escrow: { status: string; code: string }
  pfloor: { status: string; code: string; numerator?: string; denominator?: string; method_id?: string }
  pool: { status: string; code: string; k?: string }
  engagement: { leaderboard: Array<{ app_id: string; score: number; consistency_ppm: number }> }
  alloc: { sum_eligible_weight: number; reject_counts: Record<string, number> }
}

const data = snapshot as Snapshot

function Status({ value }: { value: string }) {
  return <span className={`transparency-status transparency-status-${value.toLowerCase()}`}>{value}</span>
}

export default function TransparencyPage() {
  return (
    <main className="transparency-shell">
      <header className="transparency-header">
        <a className="brand" href="/"><span className="brand-mark">S</span><span>SIGNET</span></a>
        <a className="transparency-back" href="/">Back to overview</a>
      </header>
      <section className="transparency-intro">
        <div className="eyebrow"><span className="eyebrow-dot" /> Read-only snapshot viewer</div>
        <h1>Transparency,<br /><em>without invention.</em></h1>
        <p>
          This page renders the deterministic snapshot produced by the local
          transparency command. Signatures attest what an issuer reported; they do
          not turn caller-supplied reserves into on-chain truth.
        </p>
      </section>
      <section className="transparency-meta">
        <span>{data.spec}</span>
        <span>Registry epoch: {data.registry_epoch}</span>
        <span>Issued: {new Date(data.issued_at_ms).toISOString()}</span>
      </section>
      <section className="transparency-grid" aria-label="Transparency snapshot">
        <article className="transparency-card">
          <div className="transparency-card-label">Escrow authority</div>
          <Status value={data.escrow.status} />
          <strong>{data.escrow.code}</strong>
          <p>Dedicated escrow domain; no anchor is resolved by this viewer.</p>
        </article>
        <article className="transparency-card">
          <div className="transparency-card-label">p_floor report</div>
          <Status value={data.pfloor.status} />
          <strong>{data.pfloor.numerator}/{data.pfloor.denominator}</strong>
          <p>{data.pfloor.method_id ?? 'No attested fraction supplied.'}</p>
        </article>
        <article className="transparency-card">
          <div className="transparency-card-label">Pool health</div>
          <Status value={data.pool.status} />
          <strong>{data.pool.code}</strong>
          <p>{data.pool.k ? `Latest k = ${data.pool.k}` : 'No attested k value supplied.'}</p>
        </article>
        <article className="transparency-card">
          <div className="transparency-card-label">Eligible allocation</div>
          <Status value="ATTESTED" />
          <strong>{data.alloc.sum_eligible_weight} weight</strong>
          <p>{Object.entries(data.alloc.reject_counts).map(([code, count]) => `${code}: ${count}`).join(' · ')}</p>
        </article>
      </section>
      <section className="transparency-leaderboard">
        <div>
          <div className="eyebrow">Engagement score</div>
          <h2>Policy-allowed activity only.</h2>
        </div>
        <div className="leaderboard-list">
          {data.engagement.leaderboard.map((entry) => (
            <div className="leaderboard-row" key={entry.app_id}>
              <span>{entry.app_id}</span>
              <span>{entry.score} score / {entry.consistency_ppm} ppm</span>
            </div>
          ))}
        </div>
      </section>
      <footer className="transparency-footer">
        <span>Offline fixture · no RPC · no live price claim</span>
        <a href="/">SIGNET overview <span aria-hidden="true">→</span></a>
      </footer>
    </main>
  )
}