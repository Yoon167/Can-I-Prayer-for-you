export const prayerMoments = [
  {
    title: 'Morning gratitude',
    time: '6:30 AM',
    detail: 'Start the day with thanks, scripture, and one clear intention.',
  },
  {
    title: 'Midday reset',
    time: '12:15 PM',
    detail: 'Pause work, breathe, and pray for wisdom in what is next.',
  },
  {
    title: 'Evening reflection',
    time: '8:45 PM',
    detail: 'Review the day, release stress, and pray for the people you love.',
  },
]

export const prayerFocus = [
  {
    id: 'focus-1',
    label: 'Family covering',
    completed: false,
    answeredAt: null,
    answeredNote: '',
    requestedBy: 'Anonymous member',
    isAnonymous: true,
    workflowStatus: 'review',
    category: 'Healing',
    confidentiality: 'Pastoral sensitive',
    submittedBy: 'Prayer wall',
    assignedTo: 'Team A',
    flaggedAt: 'Mar 10, 2026, 8:00 AM',
    prayedAt: null,
    ownerUserId: 'demo-member-1',
    visibilityScope: 'pastoral',
    followUpStatus: 'requested',
    followUpMessages: [
      {
        id: 'follow-up-1',
        text: 'Pastoral team is checking in. Please share any update you want us to carry forward.',
        authorName: 'Pastoral team',
        authorRole: 'Pastor',
        senderType: 'team',
        createdAt: 'Mar 10, 2026, 8:05 AM',
      },
    ],
    prayedNotice: '',
    prayedNotifiedAt: null,
    prayedBy: '',
    testimonyText: '',
    testimonyShared: false,
  },
  {
    id: 'focus-2',
    label: 'Clarity for decisions',
    completed: true,
    answeredAt: 'Mar 9, 2026, 6:20 PM',
    answeredNote: 'The Lord provided peace, a confirmed next step, and timely counsel from trusted leaders.',
    requestedBy: 'Faith N.',
    isAnonymous: false,
    workflowStatus: 'answered',
    category: 'Direction',
    confidentiality: 'Intercessor safe',
    submittedBy: 'Mobile request',
    assignedTo: 'Open team',
    flaggedAt: null,
    prayedAt: null,
    ownerUserId: 'demo-member-2',
    visibilityScope: 'team',
    followUpStatus: 'none',
    followUpMessages: [],
    prayedNotice: '',
    prayedNotifiedAt: null,
    prayedBy: '',
    testimonyText: 'God answered with clarity after a week of uncertainty, and the family moved forward in peace.',
    testimonyShared: true,
  },
  {
    id: 'focus-3',
    label: 'Peace over anxiety',
    completed: false,
    answeredAt: null,
    answeredNote: '',
    requestedBy: 'Anonymous member',
    isAnonymous: true,
    workflowStatus: 'queue',
    category: 'Care',
    confidentiality: 'Intercessor safe',
    submittedBy: 'Prayer wall',
    assignedTo: 'Open team',
    flaggedAt: null,
    prayedAt: null,
    ownerUserId: 'demo-member-3',
    visibilityScope: 'team',
    followUpStatus: 'none',
    followUpMessages: [],
    prayedNotice: '',
    prayedNotifiedAt: null,
    prayedBy: '',
    testimonyText: '',
    testimonyShared: false,
  },
  {
    id: 'focus-4',
    label: 'Strength to stay consistent',
    completed: false,
    answeredAt: null,
    answeredNote: '',
    requestedBy: 'Joshua',
    isAnonymous: false,
    workflowStatus: 'prayed',
    category: 'Consistency',
    confidentiality: 'Prayer core watch',
    submittedBy: 'Member prayer request',
    assignedTo: 'Team C',
    flaggedAt: null,
    prayedAt: 'Mar 10, 2026, 7:45 AM',
    ownerUserId: 'demo-member-4',
    visibilityScope: 'team',
    followUpStatus: 'requested',
    followUpMessages: [
      {
        id: 'follow-up-2',
        text: 'Prayer team prayed this morning. Let us know how this situation is moving.',
        authorName: 'Prayer Core',
        authorRole: 'Prayer Core',
        senderType: 'team',
        createdAt: 'Mar 10, 2026, 7:45 AM',
      },
    ],
    prayedNotice: 'The intercessory team already prayed for this request and asked for a follow-up update.',
    prayedNotifiedAt: 'Mar 10, 2026, 7:45 AM',
    prayedBy: 'Prayer Core',
    testimonyText: 'God gave us peace and unexpected provision the same week.',
    testimonyShared: true,
  },
]

export const journalEntries = [
  {
    id: 'journal-1',
    title: 'Prayer for direction',
    detail: 'Ask for confidence, patience, and the discipline to move one step at a time.',
    date: 'Mar 10',
  },
  {
    id: 'journal-2',
    title: 'Prayer for others',
    detail: 'Keep a short list of names so intercession becomes a daily habit, not a vague intention.',
    date: 'Mar 9',
  },
]

export const prayerSwipeDeck = [
  {
    id: 'deck-1',
    name: 'Anonymous member',
    requestedBy: 'Anonymous member',
    isAnonymous: true,
    request: 'Pray for peace ahead of a diagnosis follow-up and wisdom for the whole family.',
    category: 'Healing',
    confidentiality: 'Pastoral sensitive',
    submittedBy: 'Prayer wall',
    assignedTo: 'Team A',
    ownerUserId: 'demo-member-1',
    visibilityScope: 'pastoral',
    followUpStatus: 'requested',
    followUpMessages: [
      {
        id: 'deck-follow-up-1',
        text: 'Sensitive care may be needed here. Keep this one in prayer and route if details deepen.',
        authorName: 'Pastoral team',
        authorRole: 'Pastor',
        senderType: 'team',
        createdAt: 'Mar 10, 2026, 8:10 AM',
      },
    ],
    prayedNotice: '',
    prayedNotifiedAt: null,
    prayedBy: '',
    testimonyText: '',
    testimonyShared: false,
  },
  {
    id: 'deck-2',
    name: 'Campus student',
    requestedBy: 'Campus student',
    isAnonymous: false,
    request: 'Pray for courage to return to church and for healthy friendships this semester.',
    category: 'Restoration',
    confidentiality: 'Intercessor safe',
    submittedBy: 'Mobile request',
    assignedTo: 'Team B',
    ownerUserId: 'demo-member-2',
    visibilityScope: 'team',
    followUpStatus: 'none',
    followUpMessages: [],
    prayedNotice: '',
    prayedNotifiedAt: null,
    prayedBy: '',
    testimonyText: '',
    testimonyShared: false,
  },
  {
    id: 'deck-3',
    name: 'Young family',
    requestedBy: 'Young family',
    isAnonymous: false,
    request: 'Pray for provision after a sudden work change and strength for parents under stress.',
    category: 'Provision',
    confidentiality: 'Prayer core watch',
    submittedBy: 'Sunday card',
    assignedTo: 'Team C',
    ownerUserId: 'demo-member-4',
    visibilityScope: 'team',
    followUpStatus: 'requested',
    followUpMessages: [],
    prayedNotice: '',
    prayedNotifiedAt: null,
    prayedBy: '',
    testimonyText: '',
    testimonyShared: false,
  },
]

export const intercessorSpaces = [
  {
    name: 'Early watch',
    coverage: '6 intercessors online',
    detail: 'Live coverage for urgent hospital updates, grief calls, and same-day needs.',
  },
  {
    name: 'Care follow-up',
    coverage: '4 pending callbacks',
    detail: 'Track which requests need a second prayer touchpoint after first response.',
  },
  {
    name: 'Night covering',
    coverage: '2 leaders assigned',
    detail: 'Reserved for crisis prayer, overnight escalation, and quiet handoff notes.',
  },
]

export const prayerCoreSpaces = [
  {
    name: 'Pastoral escalation',
    access: 'Prayer core only',
    detail: 'Sensitive requests that require staff discernment, care decisions, or direct follow-up.',
  },
  {
    name: 'Leadership brief',
    access: 'Core review room',
    detail: 'Summaries for team leads before services, counseling blocks, and response planning.',
  },
  {
    name: 'Intercessor notes',
    access: 'Approved intercessors',
    detail: 'Shared prayer language, scripture anchors, and updates from ongoing coverage.',
  },
]

export const focusStorageKey = 'prayer-app-focus-items'
export const journalStorageKey = 'prayer-app-journal-entries'
export const prayerQueueStorageKey = 'prayer-app-swipe-queue'
export const pastoralReviewStorageKey = 'prayer-app-pastoral-review'
export const prayedDeckStorageKey = 'prayer-app-prayed-deck'
export const roleStorageKey = 'prayer-app-role'
export const authStorageKey = 'prayer-app-auth-session'
export const memberProfileStorageKey = 'prayer-app-member-profile'
export const filterOptions = ['all', 'active', 'completed']

export const roleOptions = [
  {
    id: 'member',
    label: 'Member',
    summary: 'Share prayer requests, keep your journal, and follow the daily prayer rhythm.',
    accessCodeHint: 'Assigned by default',
  },
  {
    id: 'intercessor',
    label: 'Intercessor',
    summary: 'Work through the live prayer queue and cover current requests in real time.',
    accessCodeHint: 'Use code COVER',
  },
  {
    id: 'pastor',
    label: 'Pastor',
    summary: 'Review escalations, answered notes, and the requests that need direct care.',
    accessCodeHint: 'Use code SHEPHERD',
  },
  {
    id: 'prayer-core',
    label: 'Prayer Core',
    summary: 'Coordinate intercessors, oversee sensitive requests, and support pastoral routing.',
    accessCodeHint: 'Use code WATCH',
  },
]

export const demoAccessCodes = {
  member: 'MEMBER',
  intercessor: 'COVER',
  pastor: 'SHEPHERD',
  'prayer-core': 'WATCH',
}