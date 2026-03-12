import AppLogo from './AppLogo.jsx'

function NavIcon({ id, active }) {
  const strokeWidth = active ? 2.2 : 1.8

  if (id === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (id === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        <rect x="13" y="4" width="7" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        <rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        <rect x="13" y="17" width="7" height="3" rx="1.5" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      </svg>
    )
  }

  if (id === 'profile') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        <path
          d="M5 19c1.9-3 4.2-4.5 7-4.5s5.1 1.5 7 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (id === 'bible') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path
          d="M7 5.5h8.5a2.5 2.5 0 0 1 2.5 2.5v10H9a2 2 0 0 0-2 2"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 5.5A2.5 2.5 0 0 0 4.5 8v10.5h10"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 9.5v5M9.5 12h5"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (id === 'notification') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
        <path
          d="M12 4.5a4 4 0 0 0-4 4v2.2c0 1.4-.5 2.8-1.4 3.9L5.3 16h13.4l-1.3-1.4a5.8 5.8 0 0 1-1.4-3.9V8.5a4 4 0 0 0-4-4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.8 18a2.4 2.4 0 0 0 4.4 0"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <path
        d="M7 12h10M12 7v10"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12 5c1.1 2.2 3.1 4.2 5.3 5.3C15.1 11.4 13.1 13.4 12 15.6c-1.1-2.2-3.1-4.2-5.3-5.3C8.9 9.2 10.9 7.2 12 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AppNavbar({ currentView, onChangeView, unreadNotificationCount }) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'praises', label: 'Praises' },
    { id: 'dashboard', label: 'Prayer Hub' },
    { id: 'bible', label: 'Bible' },
    { id: 'notification', label: 'Alerts' },
  ]

  return (
    <nav className="app-navbar" aria-label="Primary navigation">
      <div className="app-navbar-brand">
        <AppLogo compact />
      </div>

      <div className="app-navbar-links">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={currentView === item.id ? 'nav-button nav-button-active' : 'nav-button'}
            onClick={() => onChangeView(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon-wrap">
              <NavIcon id={item.id} active={currentView === item.id} />
            </span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'notification' && unreadNotificationCount > 0 ? (
              <span className="nav-badge">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default AppNavbar