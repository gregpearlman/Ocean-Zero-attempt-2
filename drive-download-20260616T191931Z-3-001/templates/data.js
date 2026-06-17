// data.js — your fund's core dataset. Edit this most.
// Replace the EXAMPLE records below with your real portfolio + investors.
// After any edit, run:  node --check data.js

// ======== COMPANIES ========
// One object per portfolio company. `id` is a permanent lowercase-hyphenated key.
const COMPANIES = [
  {
    id: 'flux-marine',
    name: 'Flux Marine',
    website: 'https://example.com/',
    sector: 'Fusion energy',
    stage: 'Series A',
    hq: 'Boston, MA',
    raised: '~$25M cumulative',
    lastRound: '$12M Seed (2024)',
    status: 'Active raise — $40M Series A',
    tagline: 'Compact tokamak; first net-energy demo targeted 2027.',
    milestones: [
      'DOE grant awarded Jan 2026',
      'Net-energy demo targeted Q3 2027'
    ],
    notes: 'Founder background, strategic backers, key context…',
    pitchAsk: '$40M @ $180M pre-money'
  },
  {
    id: 'ocea-wings',
    name: 'Ocean Wings',
    website: 'https://example.com/',
    sector: 'Grid-scale storage',
    stage: 'Seed',
    hq: 'Berlin, DE',
    raised: '$4M',
    lastRound: '$4M pre-seed (2025)',
    status: 'Planning Seed',
    tagline: 'Long-duration iron-air battery for grid balancing.',
    milestones: ['First 10kWh cell shipped Q1 2026'],
    notes: '',
    pitchAsk: '$10M @ $35M pre-money'
  }
];

// ======== INVESTORS ========
// Your funding universe. Start minimal; tags can be derived later.
const INVESTORS = [
  {
    id: 'lowercarbon',
    name: 'Lowercarbon Capital',
    type: 'non-aaf',
    hq: 'US',
    website: 'https://example.com/',
    thesis: 'Climate deep-tech; will lead Series A.',
    ticket: '$10–25M, leads',
    stagesTag: ['seed', 'series-a', 'series-b'],
    geosTag: ['us', 'global'],
    ticketMin: 10, ticketMax: 25,
    leadCapable: 'yes',
    isGrant: false,
    coInvestorOf: null,
    contactStatus: 'cold',
    verified: true
  },
  {
    id: 'climentum',
    name: 'Climentum Capital',
    type: 'non-aaf',
    hq: 'EU',
    website: 'https://example.com/',
    thesis: 'European climate-tech Series A.',
    ticket: '€2–8M',
    stagesTag: ['seed', 'series-a'],
    geosTag: ['eu', 'nordic'],
    ticketMin: 2, ticketMax: 8,
    leadCapable: 'maybe',
    isGrant: false,
    coInvestorOf: null,
    contactStatus: 'cold',
    verified: false
  }
];

// ======== PAIRINGS ========
// Every investor × company match, ranked. Every NEW pairing needs a verificationUrl.
const PAIRINGS = [
  {
    rank: 1, tier: 1,
    investor: 'lowercarbon', company: 'acme-fusion',
    conviction: 5,
    contact: 'Partner Name, Partner',
    contactLinkedIn: null,
    killerAngle: 'Backed multiple fusion plays 2024–25; deep-tech lead.',
    checkAsk: '$15–20M lead',
    introPath: 'Warm via shared LP.',
    ticketMatch: 'yes', stageMatch: 'yes',
    verificationUrl: 'https://example.com/source'
  },
  {
    rank: 2, tier: 2,
    investor: 'climentum', company: 'verde-grid',
    conviction: 4,
    contact: 'Partner Name, Principal',
    contactLinkedIn: null,
    killerAngle: 'European storage thesis; recent battery investments.',
    checkAsk: '€3–5M co-lead',
    introPath: 'Cold; intro via portfolio founder.',
    ticketMatch: 'yes', stageMatch: 'yes',
    verificationUrl: 'https://example.com/source'
  }
];

// ======== OPTIONAL: sectors / experts / survey data ========
const SECTORS = [];
const EXPERTS = [];

// If you split your investor universe into multiple arrays (e.g. a separate
// NON_AAF_INVESTORS / NON_AAF_PAIRINGS that you merge in), do it here, e.g.:
//   INVESTORS.push(...NON_AAF_INVESTORS);
//   PAIRINGS.push(...NON_AAF_PAIRINGS);
