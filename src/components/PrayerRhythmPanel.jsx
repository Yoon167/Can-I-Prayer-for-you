function PrayerRhythmPanel({ prayerMoments }) {
  return (
    <article className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Prayer rhythm</p>
          <h2>Plan the day in small moments</h2>
        </div>
        <span className="panel-tag">3 checkpoints</span>
      </div>

      <div className="moment-list">
        {prayerMoments.map((moment) => (
          <section className="moment-card" key={moment.title}>
            <p className="moment-time">{moment.time}</p>
            <h3>{moment.title}</h3>
            <p>{moment.detail}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

export default PrayerRhythmPanel