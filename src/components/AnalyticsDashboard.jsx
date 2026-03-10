function AnalyticsDashboard({
  activeRoleLabel,
  openRequests,
  answeredRequests,
  prayedCoverageCount,
  followUpRequestedCount,
  sensitivePendingCount,
  testimonySharedCount,
  answerRate,
  sharedPrayerRequestsEnabled,
}) {
  const analyticsItems = [
    {
      label: 'Open requests',
      value: openRequests,
      detail: 'Current needs still visible on the prayer wall.',
    },
    {
      label: 'Answered rate',
      value: `${answerRate}%`,
      detail: 'How much of the visible request history has already moved to answered.',
    },
    {
      label: 'Prayed coverage',
      value: prayedCoverageCount,
      detail: 'Requests already marked as prayed by the intercessory flow.',
    },
    {
      label: 'Follow-up threads',
      value: followUpRequestedCount,
      detail: 'Requests that currently need a user reply or team check-in.',
    },
    {
      label: 'Sensitive reviews',
      value: sensitivePendingCount,
      detail: 'Pastoral-only requests still waiting for discernment or action.',
    },
    {
      label: 'Shared testimonies',
      value: testimonySharedCount,
      detail: 'Answered prayers where the requester is willing to share a testimony.',
    },
  ]

  return (
    <article className="panel panel-wide analytics-panel">
      <div className="panel-heading analytics-heading">
        <div>
          <p className="eyebrow">Analytics dashboard</p>
          <h2>Live prayer movement and response</h2>
          <p className="role-summary analytics-summary">
            {sharedPrayerRequestsEnabled
              ? `${activeRoleLabel} view with live Supabase sync across accounts.`
              : 'Local-only analytics view for this device until Supabase reconnects.'}
          </p>
        </div>
        <span className="panel-tag analytics-tag">{answeredRequests} answered</span>
      </div>

      <div className="analytics-grid">
        {analyticsItems.map((item) => (
          <section className="analytics-card" key={item.label}>
            <p className="moment-time">{item.label}</p>
            <strong className="analytics-value">{item.value}</strong>
            <p>{item.detail}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

export default AnalyticsDashboard