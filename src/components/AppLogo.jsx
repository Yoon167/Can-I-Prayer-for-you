function AppLogo({ compact = false, className = '' }) {
  const rootClassName = className ? `app-logo ${className}` : 'app-logo'

  return (
    <div className={rootClassName}>
      <img className="app-logo-mark" src="./brand-mark.svg" alt="Can I Pray for You logo" />
      {!compact ? (
        <div className="app-logo-copy">
          <p className="eyebrow">Global prayer community</p>
          <h2>Can I Pray for You</h2>
        </div>
      ) : null}
    </div>
  )
}

export default AppLogo