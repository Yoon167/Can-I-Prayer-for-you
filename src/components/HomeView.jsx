import HeroPanel from './HeroPanel.jsx'
import VersePanel from './VersePanel.jsx'

function HomeView({
  memberName,
  accountType,
  answeredCount,
  completedCount,
  activeCount,
  requestInputRef,
  journalTitleRef,
  prayedDeckCount,
  pastoralReviewCount,
  activeRoleLabel,
  dailyDevotion,
  dailyTeaching,
  homeContentStatus,
  onNavigate,
}) {
  return (
    <>
      <HeroPanel
        answeredCount={answeredCount}
        completedCount={completedCount}
        activeCount={activeCount}
        requestInputRef={requestInputRef}
        journalTitleRef={journalTitleRef}
      />

      <section className="content-grid">
        <article className="panel panel-wide home-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Welcome home</p>
              <h2>{`Hi ${memberName}`}</h2>
              <p className="role-summary">{`${accountType} account serving through the ${activeRoleLabel} workflow.`}</p>
            </div>
            <span className="panel-tag">Today</span>
          </div>

          <div className="home-mission-banner">
            <p className="moment-time">Global prayer mission</p>
            <h3>This app is for everyone, everywhere, for His glory.</h3>
            <p>
              Stand with believers, families, churches, and communities across the world through prayer,
              encouragement, and faithful follow-up.
            </p>
          </div>

          <p className="request-sync-status home-content-status">{homeContentStatus}</p>

          <div className="home-summary-grid">
            <section className="home-summary-card">
              <span className="metric-value">{activeCount}</span>
              <span className="metric-label">Open requests</span>
            </section>
            <section className="home-summary-card">
              <span className="metric-value">{answeredCount}</span>
              <span className="metric-label">Answered prayers</span>
            </section>
            <section className="home-summary-card">
              <span className="metric-value">{prayedDeckCount}</span>
              <span className="metric-label">Deck prayed</span>
            </section>
            <section className="home-summary-card">
              <span className="metric-value">{pastoralReviewCount}</span>
              <span className="metric-label">Pastoral review</span>
            </section>
          </div>

          <div className="home-actions">
            <button type="button" className="form-action" onClick={() => onNavigate('dashboard')}>
              Open prayer hub
            </button>
            <button type="button" className="ghost-action" onClick={() => onNavigate('praises')}>
              View praises
            </button>
            <button type="button" className="ghost-action" onClick={() => onNavigate('profile')}>
              Open profile
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Daily devotion</p>
              <h2>{dailyDevotion.title}</h2>
            </div>
            <span className="panel-tag">{dailyDevotion.isLive ? 'Live' : 'Fallback'}</span>
          </div>
          <p className="praise-meta-line">
            Scripture: <strong>{dailyDevotion.scripture}</strong>
          </p>
          <p>{dailyDevotion.summary}</p>
          <p className="praise-meta-line">
            Prayer focus: <strong>{dailyDevotion.action}</strong>
          </p>
          <p className="praise-meta-line">
            Source: <strong>{dailyDevotion.source}</strong>
          </p>
          {dailyDevotion.link ? (
            <a className="ghost-action content-link" href={dailyDevotion.link} target="_blank" rel="noreferrer">
              Open devotion source
            </a>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Daily teaching</p>
              <h2>{dailyTeaching.title}</h2>
            </div>
            <span className="panel-tag">{dailyTeaching.theme}</span>
          </div>
          <p>{dailyTeaching.summary}</p>
          <p className="praise-meta-line">
            Teacher: <strong>{dailyTeaching.speaker}</strong>
          </p>
          <p className="praise-meta-line">
            Source: <strong>{dailyTeaching.source}</strong>
          </p>
        </article>

        <VersePanel dailyDevotion={dailyDevotion} />
      </section>
    </>
  )
}

export default HomeView