/**
 * Centralized state management for the survey module
 * All shared state is managed here to avoid circular dependencies
 */

// Survey navigation state
export let currentStep = 0;
export let previousStep = -1;
export let session = null;
export let reviewVisited = false;
export let initialReviewItems = null;

// Scroll state
export let scrollPositions = {};
export let scrollSaveTimeout = null;

// UI state
export let highlighterInitialized = false;

// State setters
export function setCurrentStep(step) {
  currentStep = step;
}

export function setPreviousStep(step) {
  previousStep = step;
}

export function setSession(s) {
  session = s;
}

export function setReviewVisited(visited) {
  reviewVisited = visited;
}

export function setInitialReviewItems(items) {
  initialReviewItems = items;
}

export function setScrollPositions(positions) {
  scrollPositions = positions;
}

export function setScrollSaveTimeout(timeout) {
  scrollSaveTimeout = timeout;
}

export function setHighlighterInitialized(initialized) {
  highlighterInitialized = initialized;
}

// Step labels for review page
export const STEP_LABELS = {
  0: 'Welkom',
  1: 'Streefcijfer',
  2: 'Plaatsingen',
  3: 'Longlist',
  4: 'Shortlist',
  5: 'Verzoeken',
  6: 'Redenen keuze',
  7: 'Aanbod & Sectoren',
  8: 'M/V Diversiteit',
  9: 'Belemmeringen',
  10: 'Kweekvijver',
  11: 'Culturele Diversiteit',
  12: 'Aanvullend',
  13: 'Ondertekenen'
};

// Field labels for review page (human readable names)
export const FIELD_LABELS = {
  organisatie: 'Naam bureau',
  streef_minimum: 'Minimaal percentage',
  streef_gemiddeld: 'Gemiddeld percentage over een jaar',
  aantal_geplaatst: 'Totaal geplaatst',
  geplaatst_vrouw: 'Geplaatst vrouw',
  geplaatst_rvb: 'Geplaatst RvB niveau',
  rvb_vrouw: 'RvB vrouw',
  geplaatst_rvc_rvt: 'Geplaatst RvC/RvT niveau',
  rvc_rvt_vrouw: 'RvC/RvT vrouw',
  longlist_totaal: 'Longlist totaal',
  longlist_vrouw: 'Longlist vrouw',
  longlist_rvb: 'Longlist RvB',
  longlist_rvb_vrouw: 'Longlist RvB vrouw',
  longlist_rvc_rvt: 'Longlist RvC/RvT',
  longlist_rvc_rvt_vrouw: 'Longlist RvC/RvT vrouw',
  shortlist_totaal: 'Shortlist totaal',
  shortlist_vrouw: 'Shortlist vrouw',
  shortlist_rvb: 'Shortlist RvB',
  shortlist_rvb_vrouw: 'Shortlist RvB vrouw',
  shortlist_rvc_rvt: 'Shortlist RvC/RvT',
  shortlist_rvc_rvt_vrouw: 'Shortlist RvC/RvT vrouw',
  verzoek_vrouw: 'Verzoek alleen vrouwelijke kandidaten',
  verzoek_man: 'Verzoek alleen mannelijke kandidaten',
  reden_niet_vrouw_1: 'Reden niet voor vrouw (1)',
  reden_niet_vrouw_2: 'Reden niet voor vrouw (2)',
  reden_wel_vrouw_1: 'Reden wél voor vrouw (1)',
  reden_wel_vrouw_2: 'Reden wél voor vrouw (2)',
  aanbod_vrouw: 'Aanbod vrouwelijke kandidaten',
  reden_onvoldoende_1: 'Reden onvoldoende aanbod (1)',
  reden_onvoldoende_2: 'Reden onvoldoende aanbod (2)',
  sector_voorloper: 'Sectoren voorloper',
  sector_achterblijver: 'Sectoren achterblijver',
  aandacht_mv: 'Proactieve aandacht m/v diversiteit',
  reden_niet_aandacht: 'Reden niet proactief',
  ondersteuning_selectie: 'Ondersteuning selectieproces',
  reden_niet_ondersteuning: 'Reden niet ondersteunen',
  belemmering_vrouw_1: 'Belemmering vrouwen (1)',
  belemmering_vrouw_2: 'Belemmering vrouwen (2)',
  belemmering_vrouw_3: 'Belemmering vrouwen (3)',
  ondersteuning_vrouw_1: 'Ondersteuning vrouwen (1)',
  ondersteuning_vrouw_2: 'Ondersteuning vrouwen (2)',
  ondersteuning_vrouw_3: 'Ondersteuning vrouwen (3)',
  investering_kweekvijver: 'Investering kweekvijver',
  reden_niet_kweekvijver: 'Reden niet investeren kweekvijver',
  waarborg_kwaliteiten: 'Waarborg gelijkwaardige kwaliteiten',
  best_practices_vrouwen: 'Best practices plaatsing vrouwen',
  aandacht_cultureel: 'Proactieve aandacht culturele diversiteit',
  verzoek_bicultureel: 'Verzoek biculturele kandidaten',
  aanbod_bicultureel: 'Aanbod biculturele kandidaten',
  belemmering_bicultureel_1: 'Belemmering bicultureel (1)',
  belemmering_bicultureel_2: 'Belemmering bicultureel (2)',
  belemmering_bicultureel_3: 'Belemmering bicultureel (3)',
  best_practices_bicultureel: 'Best practices bicultureel',
  nieuwe_themas: 'Nieuwe thema\'s of uitdagingen',
  opmerkingen_vragen: 'Opmerkingen of vragen',
  datum: 'Datum',
  ondertekenaar: 'Naam ondertekenaar',
  bevestiging: 'Bevestiging'
};

// Likert table groupings for review page (not used in this survey)
export const LIKERT_LABELS = {};

// Conditional field parent mapping (child -> parent info)
// value can be a string or array of strings for multi-value triggers
export const CONDITIONAL_PARENT_MAP = {
  'reden_onvoldoende_1': { parent: 'aanbod_vrouw', value: ['Onvoldoende', 'Geen'] },
  'reden_onvoldoende_2': { parent: 'aanbod_vrouw', value: ['Onvoldoende', 'Geen'] },
  'reden_niet_aandacht': { parent: 'aandacht_mv', value: ['Meestal niet', 'Nooit'] },
  'reden_niet_ondersteuning': { parent: 'ondersteuning_selectie', value: ['Meestal niet', 'Nooit'] },
  'reden_niet_kweekvijver': { parent: 'investering_kweekvijver', value: ['Meestal niet', 'Nooit'] }
};
