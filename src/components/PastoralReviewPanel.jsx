function PastoralReviewPanel({ pastoralReviewItems, handleReturnToQueue, handleApproveReview }) {
  return (
    <article className="panel review-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Pastoral review</p>
          <h2>Escalations that need human discernment</h2>
        </div>
        <span className="panel-tag">{pastoralReviewItems.length} queued</span>
      </div>

      {pastoralReviewItems.length === 0 ? (
        <p className="empty-state">Swipe left or use the review action to route sensitive needs here.</p>
      ) : (
        <div className="review-list">
          {pastoralReviewItems.map((item) => (
            <section className="review-card" key={item.id}>
              <p className="moment-time">Flagged {item.flaggedAt}</p>
              <h3>{item.name}</h3>
              <p>{item.request}</p>
              <div className="review-actions">
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => handleReturnToQueue(item.id)}
                >
                  Return to queue
                </button>
                <button
                  type="button"
                  className="form-action prayed-action"
                  onClick={() => handleApproveReview(item.id)}
                >
                  Approve prayer
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </article>
  )
}

export default PastoralReviewPanel