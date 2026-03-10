function HeroPanel({ answeredCount, completedCount, activeCount, requestInputRef, journalTitleRef }) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Daily prayer home</p>
        <h1>Keep your prayer life visible, hopeful, and active.</h1>
        <p className="hero-text">
          Bring requests, gratitude, and daily reflection into one prayer space that is simple to
          return to every day.
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
        <p className="card-label">Today&apos;s focus</p>
        <h2>Be still, stay faithful, and keep praying.</h2>
        <p>
          Make space for scripture, quiet reflection, and a few names or needs you want to carry
          before God today.
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