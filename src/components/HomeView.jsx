import HeroPanel from './HeroPanel.jsx'
import VersePanel from './VersePanel.jsx'

const welcomeLanguageRoadmap = [
  { id: 'english', label: 'English', status: 'Live today' },
  { id: 'tagalog', label: 'Tagalog', status: 'Coming soon' },
  { id: 'spanish', label: 'Spanish', status: 'Coming soon' },
  { id: 'chinese', label: 'Chinese', status: 'Coming soon' },
  { id: 'arabic', label: 'Arabic', status: 'Coming soon' },
  { id: 'aramaic', label: 'Aramaic', status: 'Coming soon' },
]

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
  livePrayerPreview,
  livePrayerQueueCount,
  livePrayerPastoralCount,
  livePrayerPrayedCount,
  livePrayerActiveIntercessors,
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
        <VersePanel dailyDevotion={dailyDevotion} className="panel-wide home-verse-panel" />

        <article className="panel panel-wide home-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your feed</p>
              <h2>{`Hi ${memberName}`}</h2>
              <p className="role-summary">{`${accountType} account moving through the ${activeRoleLabel} prayer flow.`}</p>
            </div>
            <span className="panel-tag">Fresh today</span>
          </div>

          <div className="home-mission-banner">
            <p className="moment-time">Prayer highlights</p>
            <h3>A social-style prayer view for the needs, praises, and follow-ups you want near.</h3>
            <p>
              Move through open needs, answered moments, and pastoral care updates in a cleaner,
              lighter feed that works well on phone and laptop.
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

        <article className="panel live-prayer-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live prayer</p>
              <h2>Swipe prayer is now moving on the home page too</h2>
            </div>
            <span className="panel-tag">{livePrayerActiveIntercessors} intercessors live</span>
          </div>

          <div className="live-prayer-summary-grid">
            <section className="home-summary-card live-prayer-chip">
              <span className="metric-value">{livePrayerQueueCount}</span>
              <span className="metric-label">Pending queue</span>
            </section>
            <section className="home-summary-card live-prayer-chip">
              <span className="metric-value">{livePrayerPastoralCount}</span>
              <span className="metric-label">Pastoral view</span>
            </section>
            <section className="home-summary-card live-prayer-chip">
              <span className="metric-value">{livePrayerPrayedCount}</span>
              <span className="metric-label">Already prayed</span>
            </section>
          </div>

          <div className="live-prayer-preview-card">
            <p className="moment-time">Next prayer in motion</p>
            <h3>{livePrayerPreview ? livePrayerPreview.name : 'Live prayer room is quiet right now'}</h3>
            <p>{livePrayerPreview ? livePrayerPreview.request : 'New requests from members will appear here for the intercessory swipe team.'}</p>
            <p className="request-owner-status">
              {livePrayerPreview
                ? `${livePrayerPreview.assignedTo} • ${livePrayerPreview.confidentiality}`
                : 'Members receive a notification when their request is marked prayed.'}
            </p>
          </div>

          <div className="home-actions live-prayer-actions">
            <button type="button" className="form-action" onClick={() => onNavigate('dashboard')}>
              Open live prayer hub
            </button>
            <button type="button" className="ghost-action" onClick={() => onNavigate('praises')}>
              See praise flow
            </button>
            <button type="button" className="ghost-action" onClick={() => onNavigate('bible')}>
              Open Bible
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

        <article className="panel home-coming-soon-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Podcast preaching</p>
              <h2>Voice AI podcast feed</h2>
            </div>
            <span className="panel-tag">Coming soon</span>
          </div>
          <p>
            A podcast-style preaching stream is planned for the home page so every member can see what teaching is coming next.
          </p>
          <ul className="home-feature-list">
            <li>Voice AI summaries for daily preaching</li>
            <li>Podcast cards pinned on the home feed</li>
            <li>Shared updates so members know what is launching next</li>
          </ul>
        </article>

        <article className="panel home-coming-soon-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Welcome languages</p>
              <h2>More languages for the spoken welcome</h2>
            </div>
            <span className="panel-tag">Roadmap</span>
          </div>
          <p>
            English is live now. Tagalog, Spanish, Chinese, Arabic, Aramaic, and more are marked as coming soon so members can see what is on the way.
          </p>
          <div className="voice-language-grid">
            {welcomeLanguageRoadmap.map((language) => (
              <span
                key={language.id}
                className={
                  language.status === 'Live today'
                    ? 'voice-language-chip voice-language-chip-active'
                    : 'voice-language-chip'
                }
              >
                {language.label}
                <strong>{language.status}</strong>
              </span>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}

export default HomeView