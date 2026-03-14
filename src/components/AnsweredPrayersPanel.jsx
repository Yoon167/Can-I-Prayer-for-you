function AnsweredPrayersPanel({
  answeredFocusItems,
  authUserId,
  canManagePrayerWorkflow,
  handleRestoreAnswered,
  handleAnsweredNoteChange,
  testimonyDrafts,
  handleTestimonyDraftChange,
  handleTestimonyShareChange,
  handleSaveTestimony,
}) {
  return (
    <article className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Answered prayers</p>
          <h2>Keep record of what was already carried</h2>
        </div>
        <span className="panel-tag">{answeredFocusItems.length} recorded</span>
      </div>

      {answeredFocusItems.length === 0 ? (
        <p className="empty-state">Mark a request as answered to build a visible history.</p>
      ) : (
        <div className="answered-list">
          {answeredFocusItems.map((item) => (
            <section className="answered-card" key={item.id}>
              <div className="answered-card-top">
                <p className="moment-time">Answered {item.answeredAt}</p>
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => handleRestoreAnswered(item.id)}
                  aria-label={`Return ${item.label} to current requests`}
                >
                  Reopen
                </button>
              </div>
              <h3>{item.label}</h3>
              <label className="answered-note-label" htmlFor={`answered-note-${item.id}`}>
                Answer note
              </label>
              <textarea
                id={`answered-note-${item.id}`}
                className="answered-note-input"
                value={item.answeredNote}
                onChange={(event) => handleAnsweredNoteChange(item.id, event.target.value)}
                placeholder="Write what changed, what was provided, or what you learned."
                rows="3"
              />
              {canManagePrayerWorkflow || item.ownerUserId === authUserId ? (
                <div className="testimony-editor">
                  <label className="anonymous-toggle" htmlFor={`testimony-share-${item.id}`}>
                    <input
                      id={`testimony-share-${item.id}`}
                      type="checkbox"
                      checked={testimonyDrafts[item.id]?.shared ?? item.testimonyShared ?? false}
                      onChange={(event) => handleTestimonyShareChange(item.id, event.target.checked)}
                    />
                    <span>I am willing to share this testimony</span>
                  </label>
                  <textarea
                    className="answered-note-input"
                    value={testimonyDrafts[item.id]?.text ?? item.testimonyText ?? ''}
                    onChange={(event) => handleTestimonyDraftChange(item.id, event.target.value)}
                    placeholder="Share what God did, what changed, and what you want others to know."
                    rows="4"
                  />
                  <button type="button" className="form-action" onClick={() => handleSaveTestimony(item.id)}>
                    Save testimony
                  </button>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </article>
  )
}

export default AnsweredPrayersPanel