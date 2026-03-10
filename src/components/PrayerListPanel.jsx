function PrayerListPanel({
  activeFocusItemsCount,
  requestText,
  requestInputRef,
  setRequestText,
  requestIsAnonymous,
  setRequestIsAnonymous,
  requestVisibilityScope,
  setRequestVisibilityScope,
  memberDisplayName,
  authUserId,
  handleAddPrayerRequest,
  filterOptions,
  focusFilter,
  setFocusFilter,
  filteredFocusItems,
  handleToggleFocusItem,
  handleMarkAnswered,
  handleToggleFollowUp,
  handleRemoveFocusItem,
  requestSyncStatus,
  requestSyncTone,
  canRemoveRequests,
  canManagePrayerWorkflow,
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
        <label>
          <span className="auth-label">Request visibility</span>
          <select
            className="auth-input"
            value={requestVisibilityScope}
            onChange={(event) => setRequestVisibilityScope(event.target.value)}
          >
            <option value="team">Intercessory team</option>
            <option value="pastoral">Pastor and prayer core only</option>
          </select>
        </label>
      </div>

      <p className="form-helper">
        Team requests move into the live intercessory swipe deck. Sensitive requests go straight to pastoral review and stay limited to the requester, pastors, and prayer core.
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
              {canManagePrayerWorkflow ? (
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
              ) : (
                <div className="focus-toggle focus-toggle-static" aria-label={item.label}>
                  <span className="focus-check" aria-hidden="true">
                    {item.completed ? '✓' : ''}
                  </span>
                  <span>{item.label}</span>
                </div>
              )}
              <p className="focus-requester">
                Requested by <strong>{item.isAnonymous ? 'Anonymous member' : item.requestedBy}</strong>
              </p>
              <div className="request-status-row">
                <span className="request-status-chip">
                  {item.workflowStatus === 'queue' ? 'Pending' : item.workflowStatus}
                </span>
                <span className="request-status-chip">
                  {item.visibilityScope === 'pastoral' ? 'Pastoral only' : 'Intercessory team'}
                </span>
                {item.followUpStatus === 'requested' ? (
                  <span className="request-status-chip request-status-chip-accent">Follow-up</span>
                ) : null}
              </div>
              {item.prayedNotice ? <p className="request-owner-status">{item.prayedNotice}</p> : null}
              {item.prayedAt ? (
                <p className="request-owner-status">
                  Prayed {item.prayedAt}
                  {item.prayedBy ? ` by ${item.prayedBy}` : ''}.
                </p>
              ) : null}
            </div>
            <div className="focus-actions">
              {canManagePrayerWorkflow || item.ownerUserId === authUserId ? (
                <button
                  type="button"
                  className="ghost-action answer-action"
                  onClick={() => handleMarkAnswered(item.id)}
                  aria-label={`Mark ${item.label} as answered`}
                >
                  Answered
                </button>
              ) : null}
              {canManagePrayerWorkflow ? (
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => handleToggleFollowUp(item.id)}
                  aria-label={`Toggle follow-up for ${item.label}`}
                >
                  {item.followUpStatus === 'requested' ? 'Clear follow-up' : 'Follow-up'}
                </button>
              ) : null}
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