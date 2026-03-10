import { useEffect, useState } from 'react'

const quickReferences = ['Psalm 23', 'John 3:16', 'Romans 8:28', 'Philippians 4:6-7']

function BibleView() {
  const [reference, setReference] = useState('Psalm 23')
  const [draftReference, setDraftReference] = useState('Psalm 23')
  const [passage, setPassage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load that Bible passage right now.')
        }

        const payload = await response.json()

        if (!payload.text) {
          throw new Error('That Bible passage could not be found.')
        }

        if (!isMounted) {
          return
        }

        setPassage(payload)
        setLoading(false)
      })
      .catch((nextError) => {
        if (!isMounted) {
          return
        }

        setPassage(null)
        setError(nextError.message)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reference])

  function handleSubmit(event) {
    event.preventDefault()

    const trimmedReference = draftReference.trim()

    if (!trimmedReference) {
      return
    }

    setLoading(true)
    setError('')
    setPassage(null)
    setReference(trimmedReference)
  }

  return (
    <section className="content-grid bible-grid">
      <article className="panel panel-wide bible-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bible inside prayer</p>
            <h2>Read scripture without leaving the prayer app</h2>
          </div>
          <span className="panel-tag">KJV</span>
        </div>

        <form className="bible-search-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            value={draftReference}
            onChange={(event) => setDraftReference(event.target.value)}
            placeholder="Search a verse like John 3:16"
          />
          <button type="submit" className="form-action">
            Open passage
          </button>
        </form>

        <div className="filter-row bible-filter-row">
          {quickReferences.map((item) => (
            <button
              key={item}
              type="button"
              className={reference === item ? 'filter-chip filter-chip-active' : 'filter-chip'}
              onClick={() => {
                setLoading(true)
                setError('')
                setPassage(null)
                setDraftReference(item)
                setReference(item)
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? <p className="request-sync-status">Loading scripture...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {passage ? (
          <article className="bible-passage-card">
            <p className="moment-time">Scripture reference</p>
            <h3>{passage.reference}</h3>
            <pre className="bible-passage-text">{passage.text.trim()}</pre>
          </article>
        ) : null}
      </article>

      <article className="panel bible-panel-side">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Prayer prompts</p>
            <h2>Turn scripture into prayer</h2>
          </div>
        </div>

        <div className="bible-prayer-prompts">
          <section className="profile-card">
            <p className="moment-time">Adoration</p>
            <p>What does this passage show about God&apos;s character?</p>
          </section>
          <section className="profile-card">
            <p className="moment-time">Confession</p>
            <p>Where does this scripture reveal a place to repent or surrender?</p>
          </section>
          <section className="profile-card">
            <p className="moment-time">Intercession</p>
            <p>Who needs this promise, warning, or comfort in prayer today?</p>
          </section>
        </div>
      </article>
    </section>
  )
}

export default BibleView