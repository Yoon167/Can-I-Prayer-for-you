import MemberAccessPanel from './MemberAccessPanel.jsx'

function ProfileView({
  authSession,
  activeCount,
  answeredCount,
  journalCount,
  memberProfile,
  memberProfileForm,
  memberProfileStatus,
  authBusy,
  handleSignOut,
  handleMemberProfileChange,
  handleMemberAvatarChange,
  handleSaveMemberProfile,
  canManageTeaching,
  teachingForm,
  teachingStatus,
  teachingTone,
  handleTeachingChange,
  handleSaveTeaching,
  canManageMembers,
  members,
  memberDirectoryBusy,
  memberDirectoryStatus,
  memberDirectoryTone,
  handleRefreshMemberDirectory,
  handleUpdateMemberRole,
  roleOptions,
}) {
  const memberIdentity = memberProfile.displayName || memberProfile.fullName || 'Not saved yet'

  return (
    <section className="content-grid profile-grid">
      <article className="panel panel-wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Your access and activity</h2>
          </div>
          <button type="button" className="ghost-action" onClick={handleSignOut} disabled={authBusy}>
            Sign out
          </button>
        </div>

        <div className="profile-grid-cards">
          <section className="profile-card">
            <p className="moment-time">Account</p>
            <h3>{authSession.email || 'Local session'}</h3>
            <p>{authSession.provider ? `Provider: ${authSession.provider}` : 'Provider not available'}</p>
          </section>
          <section className="profile-card">
            <p className="moment-time">Member identity</p>
            <h3>{memberIdentity}</h3>
            <p>
              {memberProfile.fullName
                ? `Saved member profile for ${memberProfile.fullName}.`
                : 'Add your member details so prayer requests can show your name when you do not post anonymously.'}
            </p>
          </section>
          <section className="profile-card">
            <p className="moment-time">Prayer snapshot</p>
            <h3>{activeCount} active requests</h3>
            <p>{answeredCount} answered prayers and {journalCount} journal notes in your current rhythm.</p>
          </section>
        </div>
      </article>

      <article className="panel panel-wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Your profile</p>
            <h2>Everything about your account, editable in one place</h2>
          </div>
        </div>

        <form className="member-profile-form" onSubmit={handleSaveMemberProfile}>
          <section className="profile-identity-editor">
            <div className="profile-avatar-stack">
              <div className="profile-avatar-preview">
                {memberProfileForm.avatarUrl ? (
                  <img src={memberProfileForm.avatarUrl} alt={`${memberIdentity} profile`} className="profile-avatar-image" />
                ) : (
                  <span>{memberIdentity.slice(0, 1).toUpperCase() || 'P'}</span>
                )}
              </div>
              <label className="ghost-action profile-upload-action">
                Import picture
                <input type="file" accept="image/*" className="sr-only" onChange={handleMemberAvatarChange} />
              </label>
            </div>

            <div className="profile-bio-card">
              <p className="moment-time">Bio</p>
              <textarea
                className="auth-input profile-bio-input"
                name="bio"
                value={memberProfileForm.bio}
                onChange={handleMemberProfileChange}
                placeholder="Write a short bio like a prayer-focused Instagram profile."
                rows="4"
              />
            </div>
          </section>

          <div className="profile-form-grid">
          <label>
            <span className="auth-label">Full name</span>
            <input
              className="auth-input"
              name="fullName"
              type="text"
              value={memberProfileForm.fullName}
              onChange={handleMemberProfileChange}
              placeholder="Your full name"
            />
          </label>

          <label>
            <span className="auth-label">Display name</span>
            <input
              className="auth-input"
              name="displayName"
              type="text"
              value={memberProfileForm.displayName}
              onChange={handleMemberProfileChange}
              placeholder="Name to show on requests"
            />
          </label>

          <label>
            <span className="auth-label">Mobile phone</span>
            <input
              className="auth-input"
              name="phone"
              type="tel"
              value={memberProfileForm.phone}
              onChange={handleMemberProfileChange}
              placeholder="Your mobile phone"
            />
          </label>

          <label>
            <span className="auth-label">Address</span>
            <input
              className="auth-input"
              name="address"
              type="text"
              value={memberProfileForm.address}
              onChange={handleMemberProfileChange}
              placeholder="City, country, or full address"
            />
          </label>

          <label>
            <span className="auth-label">Church name</span>
            <input
              className="auth-input"
              name="churchName"
              type="text"
              value={memberProfileForm.churchName}
              onChange={handleMemberProfileChange}
              placeholder="Church or ministry"
            />
          </label>

          <label>
            <span className="auth-label">Pastor name</span>
            <input
              className="auth-input"
              name="pastorName"
              type="text"
              value={memberProfileForm.pastorName}
              onChange={handleMemberProfileChange}
              placeholder="Pastor or spiritual leader"
            />
          </label>
          </div>

          <p className="form-helper profile-form-helper">
            Members can pray globally, share requests, and keep a personal profile. Leave a request anonymous whenever needed. If you do not, the display name is used first, then your full name.
          </p>

          <p className="form-helper profile-form-helper">
            Access changes are assigned by pastors or prayer core. Member profiles cannot promote themselves to intercessor, pastor, or prayer core from this screen.
          </p>

          {memberProfileStatus ? (
            <p className={memberProfileStatus.includes('saved') ? 'form-helper profile-form-helper' : 'auth-error'}>
              {memberProfileStatus}
            </p>
          ) : null}

          <button type="submit" className="form-action profile-save-action" disabled={authBusy}>
            {authBusy ? 'Saving profile...' : 'Save member profile'}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Personal stats</p>
            <h2>Current activity</h2>
          </div>
        </div>

        <div className="profile-stats-list">
          <section className="profile-stat-row">
            <span>Open requests</span>
            <strong>{activeCount}</strong>
          </section>
          <section className="profile-stat-row">
            <span>Answered prayers</span>
            <strong>{answeredCount}</strong>
          </section>
          <section className="profile-stat-row">
            <span>Journal entries</span>
            <strong>{journalCount}</strong>
          </section>
        </div>
      </article>

      {canManageTeaching ? (
        <article className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Teaching editor</p>
              <h2>Manage the daily teaching shown on the home page</h2>
            </div>
            <span className="panel-tag">Pastor / Owner</span>
          </div>

          <form className="member-profile-form" onSubmit={handleSaveTeaching}>
            <div className="profile-form-grid">
              <label>
                <span className="auth-label">Publish date</span>
                <input
                  className="auth-input"
                  name="publishDate"
                  type="date"
                  value={teachingForm.publishDate}
                  onChange={handleTeachingChange}
                />
              </label>

              <label>
                <span className="auth-label">Title</span>
                <input
                  className="auth-input"
                  name="title"
                  type="text"
                  value={teachingForm.title}
                  onChange={handleTeachingChange}
                  placeholder="Daily teaching title"
                />
              </label>

              <label>
                <span className="auth-label">Teacher</span>
                <input
                  className="auth-input"
                  name="speaker"
                  type="text"
                  value={teachingForm.speaker}
                  onChange={handleTeachingChange}
                  placeholder="Teacher or pastor name"
                />
              </label>

              <label>
                <span className="auth-label">Theme</span>
                <input
                  className="auth-input"
                  name="theme"
                  type="text"
                  value={teachingForm.theme}
                  onChange={handleTeachingChange}
                  placeholder="Teaching theme"
                />
              </label>

              <label className="profile-form-grid-span">
                <span className="auth-label">Summary</span>
                <textarea
                  className="auth-input profile-bio-input"
                  name="summary"
                  value={teachingForm.summary}
                  onChange={handleTeachingChange}
                  placeholder="Short teaching summary for the home page"
                  rows="4"
                />
              </label>

              <label className="profile-form-grid-span">
                <span className="auth-label">Source link</span>
                <input
                  className="auth-input"
                  name="link"
                  type="url"
                  value={teachingForm.link}
                  onChange={handleTeachingChange}
                  placeholder="Optional teaching or sermon link"
                />
              </label>
            </div>

            {teachingStatus ? (
              <p className={teachingTone === 'error' ? 'auth-error' : 'request-sync-status'}>
                {teachingStatus}
              </p>
            ) : null}

            <button type="submit" className="form-action profile-save-action" disabled={authBusy}>
              {authBusy ? 'Saving teaching...' : 'Save daily teaching'}
            </button>
          </form>
        </article>
      ) : null}

      {canManageMembers ? (
        <MemberAccessPanel
          authSession={authSession}
          members={members}
          roleOptions={roleOptions}
          busy={memberDirectoryBusy}
          status={memberDirectoryStatus}
          tone={memberDirectoryTone}
          onRefresh={handleRefreshMemberDirectory}
          onUpdateRole={handleUpdateMemberRole}
        />
      ) : null}
    </section>
  )
}

export default ProfileView