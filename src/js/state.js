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
  3: 'Verzoeken',
  4: 'M/V Diversiteit',
  5: 'Kweekvijver',
  6: 'Culturele Diversiteit',
  7: 'Aanvullend',
  8: 'Ondertekenen'
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
  verzoek_vrouw: 'Verzoek alleen vrouwelijke kandidaten',
  verzoek_man: 'Verzoek alleen mannelijke kandidaten',
  aanbod_vrouw: 'Aanbod vrouwelijke kandidaten',
  aandacht_mv: 'Proactieve aandacht m/v diversiteit',
  ondersteuning_selectie: 'Ondersteuning selectieproces',
  investering_kweekvijver: 'Investering kweekvijver',
  waarborg_kwaliteiten: 'Waarborg gelijkwaardige kwaliteiten',
  best_practices_vrouwen: 'Best practices plaatsing vrouwen',
  aandacht_cultureel: 'Proactieve aandacht culturele diversiteit',
  verzoek_bicultureel: 'Verzoek biculturele kandidaten',
  aanbod_bicultureel: 'Aanbod biculturele kandidaten',
  belemmering_bicultureel_1: 'Belemmering bicultureel (1)',
  belemmering_bicultureel_2: 'Belemmering bicultureel (2)',
  belemmering_bicultureel_3: 'Belemmering bicultureel (3)',
  best_practices_bicultureel: 'Best practices bicultureel',
  opmerkingen_vragen: 'Opmerkingen of vragen',
  datum: 'Datum',
  ondertekenaar: 'Naam ondertekenaar',
  bevestiging: 'Bevestiging'
};

// Likert table groupings for review page (not used in this survey)
export const LIKERT_LABELS = {};

// Conditional field parent mapping (none in this survey)
export const CONDITIONAL_PARENT_MAP = {};
