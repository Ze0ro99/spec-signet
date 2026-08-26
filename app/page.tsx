import { buildViewerStatus } from '../src/viewer/status.js'

function Mark({ type }: { type: 'check' | 'arrow' | 'lock' | 'pulse' }) {
  if (type === 'check') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="icon icon-check">
        <path d="m4 10.5 3.7 3.7L16 5.8" />
      </svg>
    )
  }

  if (type === 'arrow') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="icon">
        <path d="M3 10h13M11 5l5 5-5 5" />
      </svg>
    )
  }

  if (type === 'lock') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="icon">
        <rect x="4" y="8.5" width="12" height="8" rx="1.5" />
        <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 11.5v2" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="icon">
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6v4l2.5 1.5" />
    </svg>
  )
}

const planes = [
  {
    title: 'Evidence kernel',
    copy: 'Closed PEP/1 events, Ed25519 signatures, registry checks, and replay protection.',
    state: 'Scaffolded',
    tone: 'amber',
  },
  {
    title: 'Product planes',
    copy: 'Sector packs, receipts, allocation, escrow, and floor claims stay outside the event.',
    state: 'In progress',
    tone: 'blue',
  },
  {
    title: 'Reviewability',
    copy: 'Frozen vectors, second-language verification, and a formal CI gate make claims portable.',
    state: 'Next gate',
    tone: 'slate',
  },
]

const checklist = [
  ['Closed schemas & canonical bytes', 'In repository', 'check'],
  ['Nine-step verification pipeline', 'In repository', 'check'],
  ['Sector packs and signed claim domains', 'Scaffolded', 'pulse'],
  ['Attack matrix and cross-language vectors', 'To prove', 'pulse'],
  ['Read-only transparency viewer', 'This surface', 'check'],
] as const

export default async function Page() {
  const viewer = await buildViewerStatus()

  return (
    <main className="site-shell">
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />

      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="SIGNET home">
          <span className="brand-mark"><Mark type="lock" /></span>
          <span>SIGNET</span>
        </a>
        <div className="nav-links">
          <a href="#architecture">Architecture</a>
          <a href="#readiness">Readiness</a>
          <a href="#position">Position</a>
        </div>
        <span className="version-chip">0.x / handoff</span>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Independent evidence stack</div>
          <h1>Claims that can be <em>verified.</em></h1>
          <p className="hero-lede">
            SIGNET turns application engagement into signed, replay-resistant evidence.
            The kernel stays narrow; allocation, rewards, and transparency claims stay
            in their own sealed planes.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#architecture">
              Explore the architecture <Mark type="arrow" />
            </a>
            <a className="button button-quiet" href="#position">Read the position</a>
          </div>
        </div>

        <div className="hero-card" aria-label="Current project status">
          <div className="hero-card-top">
            <span className="status-label"><span className="status-dot" /> Current status</span>
            <span className="status-version">v0.x</span>
          </div>
          <div className="hero-card-title">Architecture exists.<br /><strong>Proof density is in progress.</strong></div>
          <p>
            SIGNET is not production-ready, audited, or a replacement for piproof.
            This surface is a viewer of the work, never an authority.
          </p>
          <div className="live-result">
            <span className="live-result-label"><span className="live-result-dot" /> Live fixture</span>
            <span className="live-result-value">{viewer.decision.code} / {viewer.decision.policy}</span>
            <span className="live-result-detail">decide() · snapshot()</span>
          </div>
          <div className="meter" aria-label="Work in progress">
            <span className="meter-fill" />
          </div>
          <div className="meter-caption"><span>Work in progress</span><span>Gates A → C</span></div>
        </div>
      </section>

      <section className="stat-strip" aria-label="SIGNET principles">
        <div className="stat"><span className="stat-number">09</span><span className="stat-label">verification<br />gates</span></div>
        <div className="stat"><span className="stat-number">06</span><span className="stat-label">signed<br />domains</span></div>
        <div className="stat"><span className="stat-number">00</span><span className="stat-label">live chain<br />lookups</span></div>
        <div className="stat stat-wide"><span className="stat-number">1</span><span className="stat-label">closed evidence<br />plane</span></div>
        <div className="stat-note">“Built as evidence,<br />not as advertising.”</div>
      </section>

      <section className="section architecture-section" id="architecture">
        <div className="section-heading">
          <div>
            <div className="eyebrow">01 / How it fits together</div>
            <h2>A sealed core.<br /><span>Separate planes.</span></h2>
          </div>
          <p>
            Product context can grow without changing the meaning of a signed
            engagement event. Each plane has its own domain, inputs, and failure boundary.
          </p>
        </div>

        <div className="flow" aria-label="SIGNET verification flow">
          <div className="flow-step">
            <span className="flow-index">01</span>
            <span className="flow-symbol flow-symbol-blue">map</span>
            <h3>Map</h3>
            <p>Context becomes a closed PEP/1 body.</p>
          </div>
          <div className="flow-connector"><Mark type="arrow" /></div>
          <div className="flow-step">
            <span className="flow-index">02</span>
            <span className="flow-symbol flow-symbol-purple">sign</span>
            <h3>Sign</h3>
            <p>Canonical bytes receive a domain-separated signature.</p>
          </div>
          <div className="flow-connector"><Mark type="arrow" /></div>
          <div className="flow-step flow-step-highlight">
            <span className="flow-index">03</span>
            <span className="flow-symbol flow-symbol-orange">verify</span>
            <h3>Verify</h3>
            <p>Registry, timestamp, weight, eligibility, and nonce gates run in order.</p>
          </div>
          <div className="flow-connector"><Mark type="arrow" /></div>
          <div className="flow-step">
            <span className="flow-index">04</span>
            <span className="flow-symbol flow-symbol-green">decide</span>
            <h3>Decide</h3>
            <p>Policy can narrow an accepted event, never rescue a denial.</p>
          </div>
        </div>

        <div className="plane-grid">
          {planes.map((plane) => (
            <article className="plane-card" key={plane.title}>
              <div className={`plane-icon plane-icon-${plane.tone}`}>
                <Mark type={plane.tone === 'amber' ? 'lock' : plane.tone === 'blue' ? 'check' : 'pulse'} />
              </div>
              <div className="plane-meta">
                <span>{plane.title}</span>
                <span className={`tag tag-${plane.tone}`}>{plane.state}</span>
              </div>
              <p>{plane.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section readiness-section" id="readiness">
        <div className="section-heading readiness-heading">
          <div>
            <div className="eyebrow">02 / Honest readiness</div>
            <h2>What is true<br /><span>today.</span></h2>
          </div>
          <div className="callout">
            <span className="callout-mark"><Mark type="lock" /></span>
            <p><strong>No invented ALLOW.</strong><br />A dashboard can display evidence; it cannot create it.</p>
          </div>
        </div>

        <div className="readiness-layout">
          <div className="checklist" role="list" aria-label="Project readiness checklist">
            {checklist.map(([label, state, icon]) => (
              <div className="check-row" role="listitem" key={label}>
                <span className={`check-mark check-mark-${icon}`}>
                  <Mark type={icon === 'check' ? 'check' : 'pulse'} />
                </span>
                <span className="check-label">{label}</span>
                <span className={`check-state check-state-${icon}`}>{state}</span>
              </div>
            ))}
          </div>
          <div className="gate-card">
            <div className="gate-card-header"><span>Next proof point</span><span className="gate-code">GATE A</span></div>
            <h3>Make every decision independently reproducible.</h3>
            <p>
              The next milestone is not a new claim. It is enough exact-code tests,
              frozen vectors, race checks, and cross-language agreement for a stranger
              to reproduce the same result without editing the project.
            </p>
            <a href="#position" className="text-link">See the boundaries <Mark type="arrow" /></a>
          </div>
        </div>
      </section>

      <section className="section position-section" id="position">
        <div className="position-card">
          <div className="eyebrow">03 / The team position</div>
          <h2>Use the right tool<br />for the right <em>job.</em></h2>
          <div className="position-columns">
            <div>
              <span className="position-kicker">Today</span>
              <p>If a production evidence library is needed this week, use <strong>piproof</strong> as the evidence reference.</p>
            </div>
            <div>
              <span className="position-kicker">The opportunity</span>
              <p>Finish SIGNET as an independent product architecture for apps, rewards, and transparency—not as a merged source tree.</p>
            </div>
          </div>
          <div className="position-footer">
            <span><Mark type="check" /> Independent implementation</span>
            <span><Mark type="check" /> Not audited</span>
            <span><Mark type="check" /> Not a Pi Network product</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand" href="#top"><span className="brand-mark"><Mark type="lock" /></span><span>SIGNET</span></a>
        <span>Evidence kernel &amp; product architecture</span>
        <span className="footer-status"><span className="status-dot" /> Work in progress</span>
      </footer>
    </main>
  )
}