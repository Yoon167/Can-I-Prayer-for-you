function PrayerListPanel({
  activeFocusItemsCount,
  requestText,
  requestInputRef,
  setRequestText,
  requestIsAnonymous,
  setRequestIsAnonymous,
  memberDisplayName,
  handleAddPrayerRequest,
  filterOptions,
  focusFilter,
  setFocusFilter,
  filteredFocusItems,
  handleToggleFocusItem,
  handleMarkAnswered,
  handleRemoveFocusItem,
  requestSyncStatus,
  requestSyncTone,
  canRemoveRequests,
}) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Current list</p>
          <h2>What to cover in prayer</h2>
        </div>
        <span className="panel-tag">{activeFocusItemsCount} current</span>
      </div>

      <form className="entry-form" onSubmit={handleAddPrayerRequest}>
        <label className="sr-only" htmlFor="prayer-request">
          Add prayer request
        </label>
        <input
          id="prayer-request"
          ref={requestInputRef}
          name="request"
          type="text"
          value={requestText}
          onChange={(event) => setRequestText(event.target.value)}
          placeholder="Add a prayer request"
        />
        <button type="submit" className="form-action">
          Add
        </button>
      </form>

      <div className="request-meta-bar">
        <label className="anonymous-toggle" htmlFor="request-anonymous-toggle">
          <input
            id="request-anonymous-toggle"
            type="checkbox"
            checked={requestIsAnonymous}
            onChange={(event) => setRequestIsAnonymous(event.target.checked)}
          />
          <span>Post this request anonymously</span>
        </label>
        <p className="request-posting-as">
          This request will show as{' '}
          <strong>{requestIsAnonymous ? 'Anonymous member' : memberDisplayName}</strong>
        </p>
      </div>

      <p className="form-helper">
        New requests added here also enter the live swipe queue for intercessors and pastoral
        review.
      </p>

      {requestSyncStatus ? (
        <p className={requestSyncTone === 'error' ? 'auth-error' : 'request-sync-status'}>
          {requestSyncStatus}
        </p>
      ) : null}

      <div className="filter-row" role="tablist" aria-label="Prayer request filters">
        {filterOptions.map((filterOption) => (
          <button
            key={filterOption}
            type="button"
            className={
              focusFilter === filterOption ? 'filter-chip filter-chip-active' : 'filter-chip'
            }
            onClick={() => setFocusFilter(filterOption)}
            aria-pressed={focusFilter === filterOption}
          >
            {filterOption}
          </button>
        ))}
      </div>

      <ul className="focus-list">
        {filteredFocusItems.map((item) => (
          <li key={item.id} className={item.completed ? 'focus-item focus-item-complete' : 'focus-item'}>
            <div className="focus-item-main">
              <button
                type="button"
                className="focus-toggle"
                onClick={() => handleToggleFocusItem(item.id)}
                aria-pressed={item.completed}
              >
                <span className="focus-check" aria-hidden="true">
                  {item.completed ? '✓' : ''}
                </span>
                <span>{item.label}</span>
              </button>
              <p className="focus-requester">
                Requested by <strong>{item.isAnonymous ? 'Anonymous member' : item.requestedBy}</strong>
              </p>
            </div>
            <div className="focus-actions">
              <button
                type="button"
                className="ghost-action answer-action"
                onClick={() => handleMarkAnswered(item.id)}
                aria-label={`Mark ${item.label} as answered`}
              >
                Answered
              </button>
              {canRemoveRequests ? (
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => handleRemoveFocusItem(item.id)}
                  aria-label={`Remove ${item.label}`}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </li>
        ))}

        {filteredFocusItems.length === 0 ? (
          <li className="empty-state">No prayer requests match this filter yet.</li>
        ) : null}
      </ul>
    </article>
  )
}

export default PrayerListPanel