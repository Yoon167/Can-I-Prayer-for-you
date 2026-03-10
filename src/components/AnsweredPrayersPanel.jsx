function AnsweredPrayersPanel({ answeredFocusItems, handleRestoreAnswered, handleAnsweredNoteChange }) {
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
            </section>
          ))}
        </div>
      )}
    </article>
  )
}

export default AnsweredPrayersPanel