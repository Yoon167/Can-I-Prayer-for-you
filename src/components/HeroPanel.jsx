function HeroPanel({ answeredCount, completedCount, activeCount, requestInputRef, journalTitleRef }) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Prayer room</p>
        <h1>Step into a quiet place built for prayer, reflection, and steady hope.</h1>
        <p className="hero-text">
          Gather your requests, gratitude, scripture, and follow-up conversations in one calm
          space that feels just as natural on a phone as it does on a laptop.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => requestInputRef.current?.focus()}
          >
            Start today&apos;s prayer
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => journalTitleRef.current?.focus()}
          >
            Add journal note
          </button>
        </div>
      </div>

      <aside className="hero-card">
        <p className="card-label">Today&apos;s atmosphere</p>
        <h2>Soft light, open hands, and enough room to listen.</h2>
        <p>
          Move through today&apos;s prayer list like a small prayer journal wall: quiet, focused, and
          easy to revisit throughout the day.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-value">15 min</span>
            <span className="metric-label">quiet time</span>
          </div>
          <div>
            <span className="metric-value">{answeredCount}</span>
            <span className="metric-label">answered prayers</span>
          </div>
          <div>
            <span className="metric-value">{completedCount}/{activeCount || 0}</span>
            <span className="metric-label">focus progress</span>
          </div>
        </div>
      </aside>
    </section>
  )
}

export default HeroPanel