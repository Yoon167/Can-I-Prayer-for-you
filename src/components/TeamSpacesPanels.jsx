function TeamSpacesPanels({ intercessorSpaces, prayerCoreSpaces, activeRole }) {
  return (
    <>
      {activeRole === 'intercessor' || activeRole === 'prayer-core' ? (
        <article className="panel panel-wide team-space-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Intercessor spaces</p>
              <h2>Dedicated lanes for live prayer coverage</h2>
            </div>
            <span className="panel-tag">3 active spaces</span>
          </div>

          <div className="space-grid">
            {intercessorSpaces.map((space) => (
              <section className="space-card" key={space.name}>
                <p className="moment-time">{space.coverage}</p>
                <h3>{space.name}</h3>
                <p>{space.detail}</p>
              </section>
            ))}
          </div>
        </article>
      ) : null}

      {activeRole === 'prayer-core' ? (
        <article className="panel core-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Prayer core access</p>
              <h2>Guardrails for sensitive handling</h2>
            </div>
          </div>

          <div className="core-list">
            {prayerCoreSpaces.map((space) => (
              <section className="core-card" key={space.name}>
                <p className="moment-time">{space.access}</p>
                <h3>{space.name}</h3>
                <p>{space.detail}</p>
              </section>
            ))}
          </div>
        </article>
      ) : null}
    </>
  )
}

export default TeamSpacesPanels