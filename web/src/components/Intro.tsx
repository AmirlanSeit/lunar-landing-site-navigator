/** Three-step "how it works" strip for first-time visitors, with a one-click demo. */
export function Intro({ onDemo }: { onDemo: () => void }) {
  return (
    <section className="intro" aria-label="How it works">
      <ol className="intro-steps">
        <li>
          <b>1 · Pick the new date</b>
          <span>Your launch slipped. Enter the new landing date – and the original one to see what changed.</span>
        </li>
        <li>
          <b>2 · Compare the squad</b>
          <span>Every site gets a player card: sunlight, Earth in view, night survival and a GO / RISKY / NO-GO verdict.</span>
        </li>
        <li>
          <b>3 · Follow the tactics</b>
          <span>See the best alternative site, the date shift that saves your plan – and why.</span>
        </li>
      </ol>
      <div className="intro-cta">
        <button onClick={onDemo}>▶ Demo: a two-week slip at the south pole</button>
        <span>Real NASA data: JPL Horizons Sun &amp; Earth positions · LRO LOLA terrain</span>
      </div>
    </section>
  )
}
