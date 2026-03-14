function HeroPanel({ answeredCount, completedCount, activeCount, requestInputRef, journalTitleRef }) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Prayer feed</p>
        <h1>See today&apos;s prayer life in one clean, scrollable place.</h1>
        <p className="hero-text">
          Keep requests, gratitude, scripture, and follow-up close together in a layout that feels
          fast, familiar, and easy to revisit throughout the day.
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
        <p className="card-label">Today&apos;s snapshot</p>
        <h2>Prayer, progress, and quiet focus all in one glance.</h2>
        <p>
          Treat the app like a daily prayer feed: open it quickly, catch up on what matters, and
          return when you have a few more minutes to pray.
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