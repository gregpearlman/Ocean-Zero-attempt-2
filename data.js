// data.js — your fund's core dataset. Edit this most.
// Replace the EXAMPLE records below with your real portfolio + investors.
// After any edit, run:  node --check data.js

// ======== COMPANIES ========
// One object per portfolio company. `id` is a permanent lowercase-hyphenated key.
// Financials sourced from "Ocean Zero - Portfolio Snapshot - 06.21.2026.xlsx" (Total by Company table).
// sector/stage/hq/website/tagline are <TBD> — not in the source sheet, fill in when known.
const COMPANIES = [
  {
    id: 'flux-marine',
    name: 'Flux Marine',
    website: '<TBD>',
    sector: '<TBD>',
    stage: 'Series B',
    hq: '<TBD>',
    invested: 12000000,
    ownedPct: 0.1575,
    entValue: 79895000,
    currentMark: 12583462.5,
    gainLoss: 583462.5,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: '',
    pitchAsk: '<TBD>'
  },
  {
    id: 'batene',
    name: 'Batene',
    website: '<TBD>',
    sector: '<TBD>',
    stage: '<TBD>',
    hq: '<TBD>',
    invested: 5094528.45,
    ownedPct: 0.0965,
    entValue: 53724000,
    currentMark: 5184366,
    gainLoss: 89837.55,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: 'Cap reference: 47mm EUR',
    pitchAsk: '<TBD>'
  },
  {
    id: 'ocean-wings',
    name: 'Ocean Wings',
    website: '<TBD>',
    sector: '<TBD>',
    stage: 'Series C',
    hq: '<TBD>',
    invested: 11640124.58,
    ownedPct: 0.166,
    entValue: 123620000,
    currentMark: 20520920,
    gainLoss: 8880795.42,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: 'Cap reference: 108mm EUR at cap',
    pitchAsk: '<TBD>'
  },
  {
    id: 'pascal',
    name: 'Pascal',
    website: '<TBD>',
    sector: '<TBD>',
    stage: '<TBD>',
    hq: '<TBD>',
    invested: 6928828.35,
    ownedPct: 0.29,
    entValue: 21871000,
    currentMark: 6342590,
    gainLoss: -586238.35,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: 'Cap reference: 212mm NOK',
    pitchAsk: '<TBD>'
  },
  {
    id: 'glas-ocean-electric',
    name: 'Glas Ocean Electric',
    website: '<TBD>',
    sector: '<TBD>',
    stage: '<TBD>',
    hq: '<TBD>',
    invested: 2000000,
    ownedPct: 0.2,
    entValue: 10000000,
    currentMark: 2000000,
    gainLoss: 0,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: '',
    pitchAsk: '<TBD>'
  },
  {
    id: 'candela',
    name: 'Candela',
    website: '<TBD>',
    sector: '<TBD>',
    stage: '<TBD>',
    hq: '<TBD>',
    invested: 21934878.67,
    ownedPct: 0.1593,
    entValue: 243204000,
    currentMark: 38742397.2,
    gainLoss: 16807518.53,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: 'Cap reference: 2,338.5mm SEK',
    pitchAsk: '<TBD>'
  },
  {
    id: 'hyke',
    name: 'Hyke',
    website: '<TBD>',
    sector: '<TBD>',
    stage: '<TBD>',
    hq: '<TBD>',
    invested: 5943822.23,
    ownedPct: 0.525,
    entValue: 3000000,
    currentMark: 1575000,
    gainLoss: -4368822.23,
    status: '<TBD>',
    tagline: '<TBD>',
    milestones: [],
    notes: '',
    pitchAsk: '<TBD>'
  },
  {
    id: 'zen-yachts',
    name: 'Zen Yachts',
    website: '<TBD>',
    sector: '<TBD>',
    stage: '<TBD>',
    hq: '<TBD>',
    invested: 5676055.4,
    ownedPct: 0.05,
    entValue: 0,
    currentMark: 0,
    gainLoss: -5676055.4,
    status: 'Being restructured',
    tagline: '<TBD>',
    milestones: [],
    notes: 'Being restructured now',
    pitchAsk: '<TBD>'
  }
];

// ======== INVESTORS ========
// Your funding universe: co-investors on existing deals, other known investors, and
// investors tied to pipeline companies. Empty until real records are added — do not
// fabricate entries. type: 'co-investor' | 'tracked' | 'pipeline'.
const INVESTORS = [];

// ======== PAIRINGS ========
// Every investor × company match, ranked. Every NEW pairing needs a verificationUrl.
// Empty until real pairings are added.
const PAIRINGS = [];

// ======== OPTIONAL: sectors / experts / survey data ========
const SECTORS = [];
const EXPERTS = [];

// If you split your investor universe into multiple arrays (e.g. a separate
// NON_AAF_INVESTORS / NON_AAF_PAIRINGS that you merge in), do it here, e.g.:
//   INVESTORS.push(...NON_AAF_INVESTORS);
//   PAIRINGS.push(...NON_AAF_PAIRINGS);
