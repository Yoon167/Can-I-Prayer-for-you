import { useState } from 'react'

function NotificationCenter({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onClose,
  onMarkAllRead,
  onNotificationSelect,
  onRequestPermission,
  notificationPermission,
  welcomeVoiceEnabled,
  onToggleWelcomeVoice,
  onReplayWelcomeVoice,
}) {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const hasNotifications = notifications.length > 0
  const canRequestPermission = notificationPermission === 'default'
  const browserNotificationsEnabled = notificationPermission === 'granted'
  const browserNotificationsUnavailable = notificationPermission === 'unsupported'
  const filterOptions = [
    { id: 'all', label: 'All', matches: () => true },
    {
      id: 'prayer',
      label: 'Prayer',
      matches: (notification) => notification.type === 'request' || notification.type === 'prayed',
    },
    { id: 'follow-up', label: 'Follow-up', matches: (notification) => notification.type === 'followUp' },
    { id: 'answered', label: 'Answered', matches: (notification) => notification.type === 'answered' },
    { id: 'system', label: 'System', matches: (notification) => notification.type === 'system' },
  ]
  const activeFilter = filterOptions.find((option) => option.id === selectedFilter) ?? filterOptions[0]
  const visibleNotifications = notifications.filter(activeFilter.matches)
  const hasVisibleNotifications = visibleNotifications.length > 0

  function getFilterCount(option) {
    return notifications.filter(option.matches).length
  }

  return (
    <>
      <button
        type="button"
        className={isOpen ? 'notification-bell-button notification-bell-button-open' : 'notification-bell-button'}
        onClick={onToggle}
        aria-label={unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : 'Open notifications'}
        aria-expanded={isOpen}
        aria-controls="notification-center-panel"
      >
        <span className="notification-bell-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="nav-icon-svg">
            <path
              d="M12 4.5a4 4 0 0 0-4 4v2.2c0 1.4-.5 2.8-1.4 3.9L5.3 16h13.4l-1.3-1.4a5.8 5.8 0 0 1-1.4-3.9V8.5a4 4 0 0 0-4-4Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.8 18a2.4 2.4 0 0 0 4.4 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="notification-bell-copy">Alerts</span>
        {unreadCount > 0 ? <span className="notification-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>

      {isOpen ? <button type="button" className="notification-overlay" aria-label="Close notifications" onClick={onClose} /> : null}

      <aside
        id="notification-center-panel"
        className={isOpen ? 'notification-panel notification-panel-open' : 'notification-panel'}
        aria-label="Notifications"
      >
        <div className="notification-panel-header">
          <div>
            <p className="eyebrow">Prayer updates</p>
            <h2>Notifications</h2>
          </div>
          <button type="button" className="ghost-action" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="notification-panel-tools">
          <section className="notification-settings-card">
            <p className="moment-time">Browser alerts</p>
            <p>
              {browserNotificationsEnabled
                ? 'Browser notifications are enabled for new prayer activity.'
                : browserNotificationsUnavailable
                  ? 'Browser notifications are not available in this browser.'
                  : 'Enable browser notifications to get popup alerts for new prayer activity.'}
            </p>
            {canRequestPermission ? (
              <button type="button" className="secondary-action" onClick={onRequestPermission}>
                Enable alerts
              </button>
            ) : null}
          </section>

          <section className="notification-settings-card">
            <p className="moment-time">Welcome voice</p>
            <p>
              {welcomeVoiceEnabled
                ? 'A welcome voice plays once per session using the best voice your browser provides.'
                : 'Welcome voice is muted.'}
            </p>
            <div className="notification-settings-actions">
              <button type="button" className="secondary-action" onClick={onToggleWelcomeVoice}>
                {welcomeVoiceEnabled ? 'Mute welcome voice' : 'Enable welcome voice'}
              </button>
              <button type="button" className="ghost-action" onClick={onReplayWelcomeVoice}>
                Replay welcome
              </button>
            </div>
          </section>
        </div>

        <div className="notification-list-header">
          <p className="moment-time">Recent activity</p>
          {hasNotifications ? (
            <button type="button" className="ghost-action" onClick={onMarkAllRead}>
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="notification-filter-bar" role="tablist" aria-label="Notification categories">
          {filterOptions.map((option) => {
            const count = getFilterCount(option)

            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={selectedFilter === option.id}
                className={selectedFilter === option.id ? 'notification-filter-chip notification-filter-chip-active' : 'notification-filter-chip'}
                onClick={() => setSelectedFilter(option.id)}
              >
                <span>{option.label}</span>
                <span className="notification-filter-count">{count}</span>
              </button>
            )
          })}
        </div>

        {hasVisibleNotifications ? (
          <div className="notification-list" role="list">
            {visibleNotifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={notification.read ? 'notification-item' : 'notification-item notification-item-unread'}
                onClick={() => onNotificationSelect(notification.id, notification.view ?? 'dashboard')}
              >
                <span className="notification-item-meta">
                  <span className="notification-item-type">{notification.typeLabel}</span>
                  <span className="notification-item-time">{notification.createdLabel}</span>
                </span>
                <strong>{notification.title}</strong>
                <span>{notification.detail}</span>
              </button>
            ))}
          </div>
        ) : hasNotifications ? (
          <div className="notification-empty-state">
            <p className="moment-time">No {activeFilter.label.toLowerCase()} alerts</p>
            <p>Switch categories to see other prayer activity notifications.</p>
          </div>
        ) : (
          <div className="notification-empty-state">
            <p className="moment-time">No alerts yet</p>
            <p>New prayer requests, follow-up updates, and answered reports will appear here.</p>
          </div>
        )}
      </aside>
    </>
  )
}

export default NotificationCenter
