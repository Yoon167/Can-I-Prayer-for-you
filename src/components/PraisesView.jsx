import AnsweredPrayersPanel from './AnsweredPrayersPanel.jsx'

function PraisesView({
  answeredFocusItems,
  authUserId,
  canManagePrayerWorkflow,
  handleRestoreAnswered,
  handleAnsweredNoteChange,
  testimonyDrafts,
  handleTestimonyDraftChange,
  handleTestimonyShareChange,
  handleSaveTestimony,
  prayedDeckItems,
}) {
  return (
    <section className="content-grid">
      <AnsweredPrayersPanel
        answeredFocusItems={answeredFocusItems}
        authUserId={authUserId}
        canManagePrayerWorkflow={canManagePrayerWorkflow}
        handleRestoreAnswered={handleRestoreAnswered}
        handleAnsweredNoteChange={handleAnsweredNoteChange}
        testimonyDrafts={testimonyDrafts}
        handleTestimonyDraftChange={handleTestimonyDraftChange}
        handleTestimonyShareChange={handleTestimonyShareChange}
        handleSaveTestimony={handleSaveTestimony}
      />

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Prayer deck praise</p>
            <h2>Requests already covered</h2>
          </div>
          <span className="panel-tag">{prayedDeckItems.length} prayed</span>
        </div>

        {prayedDeckItems.length === 0 ? (
          <p className="empty-state">Deck prayers marked as prayed will appear here.</p>
        ) : (
          <div className="praise-list">
            {prayedDeckItems.map((item) => (
              <section className="praise-card" key={item.id}>
                <p className="moment-time">Prayed {item.prayedAt}</p>
                <h3>{item.name}</h3>
                <p>{item.request}</p>
                <p className="praise-meta-line">
                  Requested by <strong>{item.isAnonymous ? 'Anonymous member' : item.requestedBy}</strong>
                </p>
                {item.prayedNotice ? <p className="request-owner-status">{item.prayedNotice}</p> : null}
              </section>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

export default PraisesView