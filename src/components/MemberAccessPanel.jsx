import { useState } from 'react'

function MemberAccessPanel({
  authSession,
  members,
  roleOptions,
  busy,
  status,
  tone,
  onRefresh,
  onUpdateRole,
}) {
  const [draftRoles, setDraftRoles] = useState({})
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Member access</p>
          <h2>Change the permissions of registered members</h2>
        </div>
        <div className="member-access-toolbar">
          <button
            type="button"
            className="ghost-action"
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
          >
            {isExpanded ? 'Hide members' : 'Show members'}
          </button>
          <button type="button" className="ghost-action" onClick={onRefresh} disabled={busy || !isExpanded}>
            Refresh members
          </button>
        </div>
      </div>

      <p className="form-helper profile-form-helper">
        Owner and pastor accounts can decide who stays member, who joins intercession, and who gets pastoral or core access.
      </p>

      {!isExpanded ? (
        <p className="member-access-collapsed-note">
          Member access is hidden by default because this section is long. Open it when you need to update roles.
        </p>
      ) : null}

      {isExpanded ? (
        <>
          {status ? <p className={tone === 'error' ? 'auth-error' : 'request-sync-status'}>{status}</p> : null}

          <div className="member-access-list">
            {members.map((member) => {
              const memberName = member.displayName || member.fullName || member.email || 'Registered member'

              return (
                <section className="member-access-card" key={member.userId}>
                  <div className="member-access-copy">
                    <p className="moment-time">{member.userId === authSession?.userId ? 'Your account' : 'Registered member'}</p>
                    <h3>{memberName}</h3>
                    <p>{member.email || 'No email available'}</p>
                  </div>

                  <div className="member-access-actions">
                    <label>
                      <span className="auth-label">Role type</span>
                      <select
                        className="auth-input"
                        value={draftRoles[member.userId] ?? member.role}
                        onChange={(event) =>
                          setDraftRoles((current) => ({
                            ...current,
                            [member.userId]: event.target.value,
                          }))
                        }
                      >
                        {roleOptions.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="form-action"
                      onClick={() => onUpdateRole(member.userId, draftRoles[member.userId] ?? member.role)}
                      disabled={busy || (draftRoles[member.userId] ?? member.role) === member.role}
                    >
                      Save role
                    </button>
                  </div>
                </section>
              )
            })}
          </div>
        </>
      ) : null}
    </article>
  )
}

export default MemberAccessPanel