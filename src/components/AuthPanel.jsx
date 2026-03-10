import AppLogo from './AppLogo.jsx'

function AuthPanel({
  authMode,
  email,
  password,
  signUpForm,
  authError,
  authNotice,
  authBusy,
  providerConfigured,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSignUpChange,
  onSignInSubmit,
  onSignUpSubmit,
}) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <AppLogo className="auth-logo" />
          <h1>Pray with people everywhere, for His glory.</h1>
          <p className="auth-text">
            {providerConfigured
              ? 'Create an account or sign in to join a global prayer community with your profile, requests, and journal synced across devices.'
              : 'Supabase is not configured yet, so the app is using local demo accounts on this device while keeping the same member experience.'}
          </p>
        </div>

        <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={authMode === 'sign-in' ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => onModeChange('sign-in')}
            aria-pressed={authMode === 'sign-in'}
          >
            Sign in
          </button>
          <button
            type="button"
            className={authMode === 'sign-up' ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => onModeChange('sign-up')}
            aria-pressed={authMode === 'sign-up'}
          >
            Sign up
          </button>
        </div>

        {authMode === 'sign-in' ? (
          <form className="auth-form" onSubmit={onSignInSubmit}>
            <div className="auth-inputs">
              <div className="auth-field-grid">
                <div>
                  <label className="auth-label" htmlFor="auth-email">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="you@church.org"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="auth-label" htmlFor="auth-password">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {authError ? <p className="auth-error">{authError}</p> : null}
              {authNotice ? <p className="request-sync-status">{authNotice}</p> : null}

              <div className="auth-actions">
                <button type="submit" className="form-action auth-submit" disabled={authBusy}>
                  {authBusy ? 'Signing in...' : 'Sign in'}
                </button>
                <p className="auth-hint">Your member profile, prayer requests, and journal follow your account.</p>
              </div>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onSignUpSubmit}>
            <div className="auth-inputs">
              <div className="auth-field-grid auth-field-grid-wide">
                <div>
                  <label className="auth-label" htmlFor="signup-email">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-password">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-full-name">
                    Full name
                  </label>
                  <input
                    id="signup-full-name"
                    className="auth-input"
                    name="fullName"
                    type="text"
                    value={signUpForm.fullName}
                    onChange={onSignUpChange}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-display-name">
                    Display name
                  </label>
                  <input
                    id="signup-display-name"
                    className="auth-input"
                    name="displayName"
                    type="text"
                    value={signUpForm.displayName}
                    onChange={onSignUpChange}
                    placeholder="Name shown in requests"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-phone">
                    Mobile phone
                  </label>
                  <input
                    id="signup-phone"
                    className="auth-input"
                    name="phone"
                    type="tel"
                    value={signUpForm.phone}
                    onChange={onSignUpChange}
                    placeholder="Mobile phone number"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-address">
                    Address
                  </label>
                  <input
                    id="signup-address"
                    className="auth-input"
                    name="address"
                    type="text"
                    value={signUpForm.address}
                    onChange={onSignUpChange}
                    placeholder="City, state, or address"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-church-name">
                    Church name
                  </label>
                  <input
                    id="signup-church-name"
                    className="auth-input"
                    name="churchName"
                    type="text"
                    value={signUpForm.churchName}
                    onChange={onSignUpChange}
                    placeholder="Church or ministry name"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="signup-pastor-name">
                    Pastor name
                  </label>
                  <input
                    id="signup-pastor-name"
                    className="auth-input"
                    name="pastorName"
                    type="text"
                    value={signUpForm.pastorName}
                    onChange={onSignUpChange}
                    placeholder="Pastor or spiritual leader"
                  />
                </div>
              </div>

              <p className="auth-hint">Every new account starts as a member automatically and can personalize the profile later.</p>

              {authError ? <p className="auth-error">{authError}</p> : null}
              {authNotice ? <p className="request-sync-status">{authNotice}</p> : null}

              <div className="auth-actions">
                <button type="submit" className="form-action auth-submit" disabled={authBusy}>
                  {authBusy ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

export default AuthPanel