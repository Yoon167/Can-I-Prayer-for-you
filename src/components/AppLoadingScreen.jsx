import AppLogo from './AppLogo.jsx'

function AppLoadingScreen() {
  return (
    <main className="loading-shell" aria-live="polite" aria-busy="true">
      <section className="loading-card">
        <AppLogo className="loading-logo" />
        <div className="loading-pulse" aria-hidden="true">
          <span className="loading-pulse-ring loading-pulse-ring-primary" />
          <span className="loading-pulse-ring loading-pulse-ring-secondary" />
          <span className="loading-pulse-dot" />
        </div>
        <p className="eyebrow">Opening your prayer room</p>
        <h1>Gathering your prayer rhythm...</h1>
        <p className="auth-text loading-text">
          Bringing back your profile, reflections, and prayer flow so your next moment starts with clarity.
        </p>
        <div className="loading-steps" aria-hidden="true">
          <span>Restore</span>
          <span>Reflect</span>
          <span>Pray</span>
        </div>
        <div className="loading-track" aria-hidden="true">
          <span className="loading-track-fill" />
        </div>
        <p className="loading-verse">&quot;Devote yourselves to prayer, being watchful and thankful.&quot; Colossians 4:2</p>
      </section>
    </main>
  )
}

export default AppLoadingScreen