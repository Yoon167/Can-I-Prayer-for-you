function VersePanel({ dailyDevotion }) {
  const verseText = dailyDevotion?.summary ?? 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.'
  const verseReference = dailyDevotion?.scripture ?? 'Philippians 4:6'

  return (
    <article className="panel accent-panel">
      <p className="eyebrow">Verse for today</p>
      <blockquote>{verseText}</blockquote>
      <p className="verse-ref">{verseReference}</p>
    </article>
  )
}

export default VersePanel