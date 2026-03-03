// ============================================================
// INFRALINK – Static Mock Data (fallback)
// ============================================================

export const CATEGORIES = [
  'road_damage', 'streetlight', 'garbage', 'water_supply',
  'drainage', 'transport', 'encroachment', 'noise', 'other'
];

export const CAT_LABELS = {
  road_damage: 'Road Damage', streetlight: 'Streetlight', garbage: 'Garbage',
  water_supply: 'Water Supply', drainage: 'Drainage', transport: 'Transport',
  encroachment: 'Encroachment', noise: 'Noise Pollution', other: 'Other'
};

export const STATUS_LABELS = {
  pending: 'Pending', in_progress: 'In Progress', solved: 'Solved', escalated: 'Escalated'
};

export const STATUS_COLORS = {
  pending: '#DC2626', in_progress: '#FF9933', solved: '#138808', escalated: '#7C3AED'
};

export const MOCK_USER = {
  _id: 'u1',
  name: 'Arjun Mehra',
  mobile: '9876543210',
  role: 'admin',
  ward: 5,
  points: 320,
};

export const MOCK_USERS = [
  { _id: 'u1', name: 'Arjun Mehra', email: 'arjun@civic.gov', mobile: '9876543210', role: 'admin', ward: 5, points: 320 },
  { _id: 'u2', name: 'Priya Sharma', email: 'priya@civic.gov', mobile: '9876543211', role: 'higher_authority', ward: 3, points: 0 },
  { _id: 'u3', name: 'Ravi Kumar', email: 'ravi@civic.gov', mobile: '9876543212', role: 'ward_authority', ward: 7, points: 0 },
  { _id: 'u4', name: 'Sneha Patel', email: 'sneha@civic.gov', mobile: '9876543213', role: 'ward_authority', ward: 12, points: 0 },
  { _id: 'u5', name: 'Vikram Singh', email: 'vikram@mail.com', mobile: '9876543214', role: 'user', ward: 5, points: 180 },
  { _id: 'u6', name: 'Anita Desai', email: 'anita@mail.com', mobile: '9876543215', role: 'user', ward: 3, points: 240 },
  { _id: 'u7', name: 'Karan Joshi', email: 'karan@mail.com', mobile: '9876543216', role: 'user', ward: 7, points: 95 },
  { _id: 'u8', name: 'Meera Reddy', email: 'meera@mail.com', mobile: '9876543217', role: 'user', ward: 12, points: 150 },
  { _id: 'u9', name: 'Suresh Nair', email: 'suresh@mail.com', mobile: '9876543218', role: 'user', ward: 9, points: 60 },
  { _id: 'u10', name: 'Deepa Gupta', email: 'deepa@mail.com', mobile: '9876543219', role: 'user', ward: 14, points: 210 },
];

export const MOCK_ISSUES = [
  {
    _id: 'iss1', title: 'Broken water main on MG Road', description: 'A major water pipe has burst near MG Road crossing, causing flooding. Multiple vehicles are stuck and pedestrians cannot pass. The water level has risen significantly.',
    category: 'water_supply', ward: 5, status: 'pending',
    reporter: { name: 'Vikram Singh' }, reporterName: 'Vikram Singh',
    latitude: 12.9716, longitude: 77.5946,
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u3', name: 'Ravi Kumar', email: 'ravi@civic.gov' },
    progressNotes: [
      { note: 'Complaint received and forwarded to water department', addedBy: { name: 'System' }, createdAt: '2026-02-23T09:00:00Z' },
    ],
    createdAt: '2026-02-22T08:30:00Z', resolvedAt: null,
  },
  {
    _id: 'iss2', title: 'Streetlight not working – Sector 14', description: 'Three consecutive streetlights on the main road in Sector 14 have been non-functional for over a week. It has become unsafe for pedestrians at night.',
    category: 'streetlight', ward: 3, status: 'in_progress',
    reporter: { name: 'Anita Desai' }, reporterName: 'Anita Desai',
    latitude: 12.9352, longitude: 77.6245,
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u4', name: 'Sneha Patel', email: 'sneha@civic.gov' },
    progressNotes: [
      { note: 'Electrical team dispatched', addedBy: { name: 'Sneha Patel' }, createdAt: '2026-02-21T14:00:00Z' },
      { note: 'Parts ordered, expected delivery tomorrow', addedBy: { name: 'Sneha Patel' }, createdAt: '2026-02-22T10:30:00Z' },
    ],
    createdAt: '2026-02-20T11:15:00Z', resolvedAt: null,
  },
  {
    _id: 'iss3', title: 'Garbage pile-up near bus stand', description: 'Garbage has not been collected from the bus stand area for 5 days. The situation is causing health hazards and foul smell.',
    category: 'garbage', ward: 7, status: 'solved',
    reporter: { name: 'Karan Joshi' }, reporterName: 'Karan Joshi',
    latitude: 12.9783, longitude: 77.5712,
    location: { type: 'Point', coordinates: [77.5712, 12.9783] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u3', name: 'Ravi Kumar', email: 'ravi@civic.gov' },
    progressNotes: [
      { note: 'Sanitation team deployed', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-19T09:00:00Z' },
      { note: 'Area cleaned and sanitized', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-19T16:00:00Z' },
    ],
    createdAt: '2026-02-18T07:45:00Z', resolvedAt: '2026-02-19T16:00:00Z',
  },
  {
    _id: 'iss4', title: 'Pothole causing accidents on NH-48', description: 'Deep pothole on the highway near the service road junction. Two accidents reported this week.',
    category: 'road_damage', ward: 12, status: 'escalated',
    reporter: { name: 'Meera Reddy' }, reporterName: 'Meera Reddy',
    latitude: 12.9250, longitude: 77.5470,
    location: { type: 'Point', coordinates: [77.5470, 12.9250] },
    image: null, solutionImage: null,
    assignedTo: null,
    progressNotes: [
      { note: 'Issue reported to highway authority', addedBy: { name: 'System' }, createdAt: '2026-02-17T10:00:00Z' },
      { note: 'Auto-escalated: No resolution after 3 days', addedBy: { name: 'System' }, createdAt: '2026-02-20T10:00:00Z' },
    ],
    createdAt: '2026-02-16T14:20:00Z', resolvedAt: null,
  },
  {
    _id: 'iss5', title: 'Open drainage near school zone', description: 'Drainage cover missing near Government School in Ward 9. Children at risk during school hours.',
    category: 'drainage', ward: 9, status: 'pending',
    reporter: { name: 'Suresh Nair' }, reporterName: 'Suresh Nair',
    latitude: 12.9610, longitude: 77.6380,
    location: { type: 'Point', coordinates: [77.6380, 12.9610] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u4', name: 'Sneha Patel', email: 'sneha@civic.gov' },
    progressNotes: [],
    createdAt: '2026-02-24T06:10:00Z', resolvedAt: null,
  },
  {
    _id: 'iss6', title: 'Illegal encroachment blocking footpath', description: 'Vendors have permanently occupied the footpath near City Market. Pedestrians forced to walk on road.',
    category: 'encroachment', ward: 5, status: 'in_progress',
    reporter: { name: 'Deepa Gupta' }, reporterName: 'Deepa Gupta',
    latitude: 12.9690, longitude: 77.5810,
    location: { type: 'Point', coordinates: [77.5810, 12.9690] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u3', name: 'Ravi Kumar', email: 'ravi@civic.gov' },
    progressNotes: [
      { note: 'Notice issued to vendors', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-23T11:00:00Z' },
    ],
    createdAt: '2026-02-22T15:30:00Z', resolvedAt: null,
  },
  {
    _id: 'iss7', title: 'Noise pollution from construction site', description: 'Construction activity continues past 10 PM in residential area. Multiple residents have complained.',
    category: 'noise', ward: 14, status: 'solved',
    reporter: { name: 'Deepa Gupta' }, reporterName: 'Deepa Gupta',
    latitude: 12.9820, longitude: 77.6100,
    location: { type: 'Point', coordinates: [77.6100, 12.9820] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u4', name: 'Sneha Patel', email: 'sneha@civic.gov' },
    progressNotes: [
      { note: 'Warning issued to builder', addedBy: { name: 'Sneha Patel' }, createdAt: '2026-02-15T14:00:00Z' },
      { note: 'Construction hours limited. Resolved.', addedBy: { name: 'Sneha Patel' }, createdAt: '2026-02-17T10:00:00Z' },
    ],
    createdAt: '2026-02-14T20:00:00Z', resolvedAt: '2026-02-17T10:00:00Z',
  },
  {
    _id: 'iss8', title: 'Bus route 42 irregular schedule', description: 'Bus number 42 has been highly irregular for the past two weeks. Commuters are affected daily.',
    category: 'transport', ward: 3, status: 'pending',
    reporter: { name: 'Anita Desai' }, reporterName: 'Anita Desai',
    latitude: 12.9450, longitude: 77.5680,
    location: { type: 'Point', coordinates: [77.5680, 12.9450] },
    image: null, solutionImage: null,
    assignedTo: null,
    progressNotes: [],
    createdAt: '2026-02-24T08:45:00Z', resolvedAt: null,
  },
  {
    _id: 'iss9', title: 'Road resurfacing needed – 4th Cross', description: 'The road surface on 4th Cross, Ward 7, has completely deteriorated. Vehicles are getting damaged.',
    category: 'road_damage', ward: 7, status: 'in_progress',
    reporter: { name: 'Karan Joshi' }, reporterName: 'Karan Joshi',
    latitude: 12.9550, longitude: 77.5920,
    location: { type: 'Point', coordinates: [77.5920, 12.9550] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u3', name: 'Ravi Kumar', email: 'ravi@civic.gov' },
    progressNotes: [
      { note: 'Road survey completed', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-21T08:00:00Z' },
      { note: 'Resurfacing work started', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-23T07:00:00Z' },
    ],
    createdAt: '2026-02-19T09:30:00Z', resolvedAt: null,
  },
  {
    _id: 'iss10', title: 'Water contamination in Ward 12', description: 'Residents report yellowish water supply. Possible contamination at source.',
    category: 'water_supply', ward: 12, status: 'escalated',
    reporter: { name: 'Meera Reddy' }, reporterName: 'Meera Reddy',
    latitude: 12.9300, longitude: 77.5550,
    location: { type: 'Point', coordinates: [77.5550, 12.9300] },
    image: null, solutionImage: null,
    assignedTo: null,
    progressNotes: [
      { note: 'Water samples collected for testing', addedBy: { name: 'System' }, createdAt: '2026-02-18T09:00:00Z' },
      { note: 'Auto-escalated: Unresolved for 3+ days', addedBy: { name: 'System' }, createdAt: '2026-02-21T09:00:00Z' },
    ],
    createdAt: '2026-02-17T07:00:00Z', resolvedAt: null,
  },
  {
    _id: 'iss11', title: 'Garbage overflow at Ward 5 dumpsite', description: 'Community dumpsite overflowing. Waste spilling onto the road.',
    category: 'garbage', ward: 5, status: 'solved',
    reporter: { name: 'Vikram Singh' }, reporterName: 'Vikram Singh',
    latitude: 12.9740, longitude: 77.5880,
    location: { type: 'Point', coordinates: [77.5880, 12.9740] },
    image: null, solutionImage: null,
    assignedTo: { _id: 'u3', name: 'Ravi Kumar', email: 'ravi@civic.gov' },
    progressNotes: [
      { note: 'Extra trucks dispatched', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-20T10:00:00Z' },
      { note: 'Dumpsite cleared and sanitized', addedBy: { name: 'Ravi Kumar' }, createdAt: '2026-02-21T15:00:00Z' },
    ],
    createdAt: '2026-02-19T12:00:00Z', resolvedAt: '2026-02-21T15:00:00Z',
  },
  {
    _id: 'iss12', title: 'Streetlight flickering in Ward 14', description: 'Multiple streetlights on Ring Road near Ward 14 are flickering and may fail soon.',
    category: 'streetlight', ward: 14, status: 'pending',
    reporter: { name: 'Deepa Gupta' }, reporterName: 'Deepa Gupta',
    latitude: 12.9880, longitude: 77.6050,
    location: { type: 'Point', coordinates: [77.6050, 12.9880] },
    image: null, solutionImage: null,
    assignedTo: null,
    progressNotes: [],
    createdAt: '2026-02-25T05:00:00Z', resolvedAt: null,
  },
];

// Ward leaderboard data
export const MOCK_WARD_LEADERBOARD = [
  { _id: 7, ward: 7, total: 48, solved: 41, pending: 3, in_progress: 2, escalated: 2 },
  { _id: 5, ward: 5, total: 52, solved: 40, pending: 5, in_progress: 4, escalated: 3 },
  { _id: 3, ward: 3, total: 38, solved: 28, pending: 4, in_progress: 3, escalated: 3 },
  { _id: 14, ward: 14, total: 35, solved: 24, pending: 6, in_progress: 3, escalated: 2 },
  { _id: 12, ward: 12, total: 42, solved: 27, pending: 7, in_progress: 4, escalated: 4 },
  { _id: 9, ward: 9, total: 30, solved: 19, pending: 5, in_progress: 4, escalated: 2 },
  { _id: 1, ward: 1, total: 22, solved: 14, pending: 4, in_progress: 3, escalated: 1 },
  { _id: 8, ward: 8, total: 18, solved: 11, pending: 3, in_progress: 2, escalated: 2 },
  { _id: 20, ward: 20, total: 15, solved: 8, pending: 4, in_progress: 2, escalated: 1 },
  { _id: 16, ward: 16, total: 12, solved: 6, pending: 3, in_progress: 2, escalated: 1 },
];

// Citizen leaderboard data
export const MOCK_CITIZEN_LEADERBOARD = [
  { _id: 'u6', name: 'Anita Desai', ward: 3, issueCount: 28, points: 240 },
  { _id: 'u1', name: 'Arjun Mehra', ward: 5, issueCount: 32, points: 320 },
  { _id: 'u10', name: 'Deepa Gupta', ward: 14, issueCount: 22, points: 210 },
  { _id: 'u5', name: 'Vikram Singh', ward: 5, issueCount: 18, points: 180 },
  { _id: 'u8', name: 'Meera Reddy', ward: 12, issueCount: 15, points: 150 },
  { _id: 'u7', name: 'Karan Joshi', ward: 7, issueCount: 12, points: 95 },
  { _id: 'u9', name: 'Suresh Nair', ward: 9, issueCount: 8, points: 60 },
];

// Notifications (static)
export const MOCK_NOTIFICATIONS = [
  { _id: 'n1', message: 'Your issue "Broken water main on MG Road" has been acknowledged.', read: false, createdAt: '2026-02-24T10:00:00Z' },
  { _id: 'n2', message: 'Streetlight issue in Sector 14 is now in progress.', read: false, createdAt: '2026-02-23T15:00:00Z' },
  { _id: 'n3', message: 'Garbage pile-up near bus stand has been resolved.', read: true, createdAt: '2026-02-19T16:30:00Z' },
  { _id: 'n4', message: 'Pothole on NH-48 has been escalated to higher authority.', read: true, createdAt: '2026-02-20T10:15:00Z' },
];
