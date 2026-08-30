import { TestApplicationForm } from "@/components/test-application-form";

export default function Home() {
  return (
    <main>
      <nav className="nav-shell">
        <a className="wordmark" href="#top"><span className="wordmark-gate">T</span>Tollgate</a>
        <span className="build-label">GrowthX Build Week · 2026</span>
      </nav>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Early access · Direct OpenAI</p>
          <h1>Know what your AI agents cost <em>before</em> the bill arrives.</h1>
          <p className="hero-subhead">I&apos;m building Tollgate for teams paying OpenAI directly: a live meter for supported API calls, with an honest same-token estimate against a cheaper model.</p>
          <a className="primary-link" href="#apply">Apply to test Tollgate <span>↘</span></a>
          <p className="trust-line">Your key and content pass through for the request, but are never stored or logged. Non-production tests only.</p>
        </div>
        <div className="meter-stage" aria-label="Illustrative cost meter preview">
          <div className="signal-track track-one"><i /></div>
          <div className="signal-track track-two"><i /></div>
          <article className="cost-receipt">
            <header><span>CALL / 00842</span><span className="live-chip"><i /> METERED</span></header>
            <div className="receipt-total"><p>Current run</p><strong>$0.0278</strong><small>estimated</small></div>
            <div className="ledger">
              <div><span>Model</span><b>gpt-5.4-mini</b></div>
              <div><span>Input</span><b>18,420 tokens</b></div>
              <div><span>Output</span><b>3,108 tokens</b></div>
              <div><span>Latency</span><b>1.84 sec</b></div>
            </div>
            <div className="comparison"><span>Same tokens on nano</span><strong>$0.0076</strong><small>Estimate only. Quality not tested.</small></div>
          </article>
          <p className="preview-note">Illustrative preview · not customer usage</p>
        </div>
      </section>
      <section className="argument-grid">
        <div><p className="section-code">THE GAP / 01</p><h2>The useful moment comes before the usage warning.</h2></div>
        <div className="argument-body">
          <p>Agents can make many model calls while you focus on the work. By the time the invoice gets your attention, the spend has happened.</p>
          <div className="steps">
            <div><span>01</span><p>Point one non-production Chat Completions client at its Tollgate project URL.</p></div>
            <div><span>02</span><p>Keep using your own OpenAI key. Tollgate does not store it or your content.</p></div>
            <div><span>03</span><p>See usage and estimated cost arrive on your protected project dashboard.</p></div>
          </div>
        </div>
      </section>
      <section className="apply-section" id="apply">
        <div className="apply-copy">
          <p className="section-code">BUILD WEEK TEST / 02</p>
          <h2>Run one real call through Tollgate.</h2>
          <p>I&apos;m looking for founders and engineering leads who pay OpenAI directly and can test one non-production Chat Completions call this week.</p>
          <div className="fit-check"><span>Good fit if you</span><ul><li>own or influence a direct OpenAI API bill</li><li>can change a client&apos;s base URL</li><li>have been surprised by model spend</li></ul></div>
        </div>
        <TestApplicationForm />
      </section>
      <footer>
        <a className="wordmark" href="#top"><span className="wordmark-gate">T</span>Tollgate</a>
        <p>Built in public · GrowthX Build Week</p>
        <p>Meter first. Route after evidence.</p>
      </footer>
    </main>
  );
}
