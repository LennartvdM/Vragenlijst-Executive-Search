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
  2: 'Kwantitatief',
  3: 'Bestuursorganen',
  4: 'Kwalitatief (intro)',
  5: 'Leiderschap',
  6: 'Strategie',
  7: 'HR Management',
  8: 'Communicatie',
  9: 'Kennis',
  10: 'Klimaat',
  11: 'Motivatie',
  12: 'Aanvullend',
  13: 'Ondertekenen'
};

// Field labels for review page (human readable names)
export const FIELD_LABELS = {
  organisatie: 'Naam organisatie',
  streefcijfer: 'Heeft u een streefcijfer?',
  streefcijfer_percentage: 'Streefcijfer percentage',
  streefcijfer_jaar: 'Streefcijfer jaar',
  streefcijfer_gehaald: 'Streefcijfer gehaald?',
  definitie_afwijking: 'Wijkt definitie af?',
  eigen_definitie: 'Eigen definitie',
  aantal_werknemers: 'Totaal aantal werknemers',
  werknemers_buiten_europa: 'Werknemers Buiten-Europa',
  aantal_top: 'Aantal in de top',
  top_buiten_europa: 'Top Buiten-Europa',
  aantal_subtop: 'Aantal in de subtop',
  subtop_buiten_europa: 'Subtop Buiten-Europa',
  heeft_rvb: 'Heeft u een RvB?',
  aantal_rvb: 'Aantal RvB',
  rvb_buiten_europa: 'RvB Buiten-Europa',
  heeft_rvc: 'Heeft u een RvC?',
  aantal_rvc: 'Aantal RvC',
  rvc_buiten_europa: 'RvC Buiten-Europa',
  heeft_rvt: 'Heeft u een RvT?',
  aantal_rvt: 'Aantal RvT',
  rvt_buiten_europa: 'RvT Buiten-Europa',
  beleid_samenstelling: 'Beleid samenstelling',
  beleid_samenstelling_anders: 'Beleid toelichting',
  motivatie: 'Motivatie',
  strategie_vraag_1: 'Strategievraag 1',
  blokkade_1: 'Blokkade 1',
  bevorderend_1: 'Bevorderend 1',
  voorbeeld_organisatie: 'Voorbeeld organisatie',
  datum: 'Datum',
  ondertekenaar: 'Naam ondertekenaar',
  bevestiging: 'Bevestiging'
};

// Likert table groupings for review page
export const LIKERT_LABELS = {
  'likert-leiderschap': {
    step: 5,
    label: 'Leiderschap stellingen',
    fields: ['leid_1', 'leid_2', 'leid_3', 'leid_4', 'leid_5']
  },
  'likert-strategie': {
    step: 6,
    label: 'Strategie stellingen',
    fields: ['strat_1', 'strat_2', 'strat_3', 'strat_4', 'strat_5', 'strat_6', 'strat_7', 'strat_8']
  },
  'likert-hr': {
    step: 7,
    label: 'HR Management stellingen',
    fields: ['hr_1', 'hr_2', 'hr_3', 'hr_4', 'hr_5', 'hr_6', 'hr_7', 'hr_8', 'hr_9', 'hr_10', 'hr_11', 'hr_12', 'hr_13', 'hr_14']
  },
  'likert-communicatie': {
    step: 8,
    label: 'Communicatie stellingen',
    fields: ['comm_1', 'comm_2', 'comm_3', 'comm_4', 'comm_5']
  },
  'likert-kennis': {
    step: 9,
    label: 'Kennis stellingen',
    fields: ['kennis_1', 'kennis_2', 'kennis_3', 'kennis_4', 'kennis_5', 'kennis_6', 'kennis_7', 'kennis_8']
  },
  'likert-klimaat': {
    step: 10,
    label: 'Klimaat stellingen',
    fields: ['klimaat_1', 'klimaat_2', 'klimaat_3', 'klimaat_4', 'klimaat_5', 'klimaat_6']
  }
};

// Conditional field parent mapping (child -> parent info)
export const CONDITIONAL_PARENT_MAP = {
  'streefcijfer_percentage': { parent: 'streefcijfer', value: 'Ja' },
  'streefcijfer_jaar': { parent: 'streefcijfer', value: 'Ja' },
  'eigen_definitie': { parent: 'definitie_afwijking', value: 'Ja' },
  'aantal_rvb': { parent: 'heeft_rvb', value: 'Ja' },
  'rvb_buiten_europa': { parent: 'heeft_rvb', value: 'Ja' },
  'aantal_rvc': { parent: 'heeft_rvc', value: 'Ja' },
  'rvc_buiten_europa': { parent: 'heeft_rvc', value: 'Ja' },
  'aantal_rvt': { parent: 'heeft_rvt', value: 'Ja' },
  'rvt_buiten_europa': { parent: 'heeft_rvt', value: 'Ja' },
  'beleid_samenstelling_anders': { parent: 'beleid_samenstelling', value: 'Anders' }
};
