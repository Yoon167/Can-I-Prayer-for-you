function HeroPanel({ answeredCount, completedCount, activeCount, requestInputRef, journalTitleRef }) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Daily prayer home</p>
        <h1>Keep your prayer life visible, structured, and active.</h1>
        <p className="hero-text">
          Build a rhythm for gratitude, reflection, and focused intercession with one clear place
          to return to each day.
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
        <h2>Be still and stay intentional.</h2>
        <p>
          Set aside 15 minutes for silence, one passage of scripture, and three specific prayer
          points.
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