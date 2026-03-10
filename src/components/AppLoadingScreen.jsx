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
        <p className="eyebrow">Opening your prayer space</p>
        <h1>Preparing your session...</h1>
        <p className="auth-text loading-text">
          Restoring your profile, prayer rhythm, and sign-in state so you can return where you left off.
        </p>
        <p className="loading-verse">&quot;Devote yourselves to prayer, being watchful and thankful.&quot; Colossians 4:2</p>
      </section>
    </main>
  )
}

export default AppLoadingScreen