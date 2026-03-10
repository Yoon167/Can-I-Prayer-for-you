function JournalPanel({
  journalItems,
  journalForm,
  journalTitleRef,
  handleJournalChange,
  handleAddJournalEntry,
  handleRemoveJournalEntry,
  journalSyncStatus,
  journalSyncTone,
}) {
  return (
    <article className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Journal prompts</p>
          <h2>Capture what changes over time</h2>
        </div>
        <span className="panel-tag">{journalItems.length} saved</span>
      </div>

      <form className="journal-form" onSubmit={handleAddJournalEntry}>
        <label className="sr-only" htmlFor="journal-title">
          Journal title
        </label>
        <input
          id="journal-title"
          ref={journalTitleRef}
          name="title"
          type="text"
          value={journalForm.title}
          onChange={handleJournalChange}
          placeholder="Journal title"
        />
        <label className="sr-only" htmlFor="journal-detail">
          Journal detail
        </label>
        <textarea
          id="journal-detail"
          name="detail"
          value={journalForm.detail}
          onChange={handleJournalChange}
          placeholder="Write what you are praying through today"
          rows="3"
        />
        <button type="submit" className="form-action">
          Save entry
        </button>
      </form>

      {journalSyncStatus ? (
        <p className={journalSyncTone === 'error' ? 'auth-error' : 'request-sync-status'}>
          {journalSyncStatus}
        </p>
      ) : null}

      <div className="journal-grid">
        {journalItems.map((entry) => (
          <section className="journal-card" key={entry.id}>
            <div className="journal-card-top">
              <p className="moment-time">{entry.date}</p>
              <button
                type="button"
                className="ghost-action"
                onClick={() => handleRemoveJournalEntry(entry.id)}
                aria-label={`Delete ${entry.title}`}
              >
                Delete
              </button>
            </div>
            <h3>{entry.title}</h3>
            <p>{entry.detail}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

export default JournalPanel