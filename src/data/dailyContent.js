export const devotionLibrary = [
  {
    title: 'Grace for the ordinary day',
    scripture: 'Lamentations 3:22-23',
    summary: 'God meets people in ordinary places with fresh mercy, not only in dramatic moments.',
    action: 'Pause for two minutes and thank God for one mercy you almost missed today.',
  },
  {
    title: 'Courage to stay gentle',
    scripture: 'Colossians 3:12',
    summary: 'Strength in Christ is seen in compassion, patience, and humility that remains steady under pressure.',
    action: 'Pray for one person who is difficult to love and ask for a gentle response.',
  },
  {
    title: 'Peace beyond headlines',
    scripture: 'John 14:27',
    summary: 'Jesus offers a peace the world cannot manufacture, even when the news cycle is loud.',
    action: 'Turn anxiety into intercession by praying for a nation, city, or family in crisis.',
  },
  {
    title: 'Faithful in hidden places',
    scripture: 'Matthew 6:6',
    summary: 'The secret place still forms public faithfulness. Hidden prayer is never wasted.',
    action: 'Take one private prayer burden to God before sharing it anywhere else.',
  },
  {
    title: 'Hope for tired hearts',
    scripture: 'Isaiah 40:31',
    summary: 'Waiting on the Lord is not passive surrender. It is active dependence that renews strength.',
    action: 'Write down one area where you need renewed strength and pray over it by name.',
  },
  {
    title: 'Love that crosses borders',
    scripture: 'Revelation 7:9',
    summary: 'The heart of God gathers every people and nation. Prayer should stretch as far as His mission.',
    action: 'Pray for believers in another country and for those who have never heard the gospel.',
  },
  {
    title: 'Joy in answered prayer',
    scripture: 'Psalm 126:3',
    summary: 'Remembering what God has done fuels confidence for what you still need Him to do.',
    action: 'Review one answered prayer and thank God out loud for His faithfulness.',
  },
]

export const teachingLibrary = [
  {
    title: 'Global Prayer Stories',
    speaker: 'Pastor Miriam Cole',
    theme: 'Mission and compassion',
    summary: 'A short teaching on how local obedience becomes global impact through prayer and generosity.',
  },
  {
    title: 'Preaching Hope to the Weary',
    speaker: 'Pastor Daniel A.',
    theme: 'Hope in Christ',
    summary: 'A teaching message on strengthening tired believers with the promises of Christ.',
  },
  {
    title: 'Prayer for the Nations',
    speaker: 'Elder Ruth Mensah',
    theme: 'Intercession for nations',
    summary: 'A guided teaching on praying for cities, governments, missionaries, and the persecuted church.',
  },
  {
    title: 'The Shepherd and the Streets',
    speaker: 'Pastor Joel Hart',
    theme: 'Shepherding people well',
    summary: 'A field report and preaching reflection on ministry outside the church building.',
  },
  {
    title: 'Daily Bread Conversations',
    speaker: 'Naomi Rivera',
    theme: 'Daily discipleship',
    summary: 'A devotional conversation about hearing God in real life, not just on Sundays.',
  },
  {
    title: 'His Glory Among the People',
    speaker: 'Bishop Samuel Reed',
    theme: 'Worship and mission',
    summary: 'A preaching episode focused on worship, mission, and the glory of God among all peoples.',
  },
  {
    title: 'Prayer Room Testimonies',
    speaker: 'Grace Collective',
    theme: 'Testimony and faith',
    summary: 'Testimonies and teaching from believers who have seen God answer prayer across communities.',
  },
]

export function getDayIndex(date = new Date(), size) {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const diff = date - startOfYear
  const dayOfYear = Math.floor(diff / 86400000)
  return dayOfYear % size
}

function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function getDailyHomeContent(date = new Date()) {
  const devotion = devotionLibrary[getDayIndex(date, devotionLibrary.length)]
  const teaching = teachingLibrary[getDayIndex(date, teachingLibrary.length)]

  return {
    devotion: {
      ...devotion,
      source: 'Curated fallback',
      isLive: false,
      link: null,
    },
    teaching: {
      ...teaching,
      publishDate: getTodayDateKey(date),
      source: 'Curated fallback',
      isLive: false,
      link: null,
    },
  }
}