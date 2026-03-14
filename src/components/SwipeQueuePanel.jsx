function SwipeQueuePanel({
  prayerQueueLength,
  currentDeckCard,
  nextDeckCard,
  prayedDeckCount,
  pastoralReviewCount,
  lastDeckAction,
  swipeIntent,
  swipeCardTransform,
  onDeckDecision,
  onSendToReview,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  return (
    <article className="panel panel-wide swipe-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Swipe prayer queue</p>
          <h2>Move through live requests like a prayer response deck</h2>
        </div>
        <span className="panel-tag">{prayerQueueLength} waiting</span>
      </div>

      {currentDeckCard ? (
        <div className="swipe-layout">
          <div className="swipe-stack">
            {nextDeckCard ? (
              <section className="swipe-card swipe-card-back" aria-hidden="true">
                <p className="moment-time">Up next</p>
                <h3>{nextDeckCard.name}</h3>
                <p>{nextDeckCard.request}</p>
              </section>
            ) : null}

            <section
              className="swipe-card swipe-card-front"
              style={{ transform: swipeCardTransform }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              <div className="swipe-badges">
                <span
                  className={
                    swipeIntent === 'pending'
                      ? 'swipe-badge swipe-badge-pending active'
                      : 'swipe-badge swipe-badge-pending'
                  }
                >
                  Pending
                </span>
                <span
                  className={
                    swipeIntent === 'prayed'
                      ? 'swipe-badge swipe-badge-prayed active'
                      : 'swipe-badge swipe-badge-prayed'
                  }
                >
                  Prayed
                </span>
              </div>

              <p className="moment-time">{currentDeckCard.category}</p>
              <h3>{currentDeckCard.name}</h3>
              <p className="swipe-request">{currentDeckCard.request}</p>
              <p className="swipe-requester">
                Requested by{' '}
                <strong>
                  {currentDeckCard.isAnonymous ? 'Anonymous member' : currentDeckCard.requestedBy}
                </strong>
              </p>

              <div className="swipe-meta">
                <span>{currentDeckCard.confidentiality}</span>
                <span>{currentDeckCard.submittedBy}</span>
                <span>{currentDeckCard.assignedTo}</span>
                {currentDeckCard.followUpStatus === 'requested' ? <span>Follow-up requested</span> : null}
              </div>
            </section>
          </div>

          <div className="swipe-actions-row">
            <button
              type="button"
              className="ghost-action"
              onClick={() => onDeckDecision('pending')}
            >
              Keep pending
            </button>
            <button
              type="button"
              className="ghost-action review-action"
              onClick={onSendToReview}
            >
              Send to pastoral review
            </button>
            <button
              type="button"
              className="form-action prayed-action"
              onClick={() => onDeckDecision('prayed')}
            >
              Mark prayed
            </button>
          </div>

          <div className="swipe-summary">
            <p>{prayedDeckCount} prayed from deck</p>
            <p>{pastoralReviewCount} in pastoral review</p>
            {lastDeckAction ? <p className="swipe-live-status">Live update: {lastDeckAction}</p> : null}
          </div>
        </div>
      ) : (
        <p className="empty-state">The swipe queue is clear. New requests will show here first.</p>
      )}
    </article>
  )
}

export default SwipeQueuePanel