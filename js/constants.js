/**
 * Constants for Monitoring Executive Search Code 2023
 * Centralized magic strings and values to improve maintainability
 */

const CONSTANTS = {
  // Answer values for radio buttons
  ANSWERS: {
    YES: 'Ja',
    NO: 'Nee',
    UNKNOWN: 'Weet niet'
  },

  // Session/auth related
  SESSION: {
    PUBLIC_CODE: 'PUBLIC',
    PUBLIC_NAME: 'Openbare toegang'
  },

  // Field names that trigger conditional sections (none in this survey)
  CONDITIONAL_FIELDS: {},

  // Answer values that trigger conditional sections (none in this survey)
  CONDITIONAL_VALUES: {},

  // Required fields when conditional is triggered (none in this survey)
  CONDITIONAL_REQUIREMENTS: {},

  // UI text
  UI: {
    BUTTON_NEXT: 'Volgende',
    BUTTON_SUBMIT: 'Verzenden',
    BUTTON_SUBMITTING: 'Verzenden...',
    STATUS_COMPLETE: '\u2713',
    STATUS_PARTIAL: '\u2212',
    STATUS_EMPTY: '\u25CB'
  },

  // Error messages (Dutch)
  ERRORS: {
    INVALID_CODE: 'Ongeldige organisatiecode. Controleer uw code en probeer opnieuw.',
    ENTER_CODE: 'Vul beide delen van uw organisatiecode in.',
    NETWORK_ERROR: 'Er ging iets mis bij het controleren van uw code. Probeer het later opnieuw.',
    SUBMIT_ERROR: 'Er ging iets mis bij het verzenden. Probeer het opnieuw.',
    SESSION_EXPIRED: 'Uw sessie is verlopen. Log opnieuw in.',
    STORAGE_ERROR: 'Kan gegevens niet opslaan. Controleer of uw browser localStorage ondersteunt.'
  },

  // CSS classes
  CSS: {
    ACTIVE: 'active',
    SELECTED: 'selected',
    COMPLETE: 'complete',
    PARTIAL: 'partial',
    CONDITIONAL_INCOMPLETE: 'conditional-incomplete',
    SHOW: 'show',
    DONE: 'done',
    ERROR: 'error',
    HAS_VALUE: 'has-value',
    ANSWERED: 'answered'
  },

  // Timeouts (milliseconds)
  TIMEOUTS: {
    AUTO_SAVE_DELAY: 500,
    API_REQUEST: 15000,
    RETRY_BASE: 1000
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MULTIPLIER: 2
  }
};

// Freeze all nested objects to prevent accidental modification
Object.freeze(CONSTANTS);
Object.freeze(CONSTANTS.ANSWERS);
Object.freeze(CONSTANTS.SESSION);
Object.freeze(CONSTANTS.CONDITIONAL_FIELDS);
Object.freeze(CONSTANTS.CONDITIONAL_VALUES);
Object.freeze(CONSTANTS.CONDITIONAL_REQUIREMENTS);
Object.freeze(CONSTANTS.UI);
Object.freeze(CONSTANTS.ERRORS);
Object.freeze(CONSTANTS.CSS);
Object.freeze(CONSTANTS.TIMEOUTS);
Object.freeze(CONSTANTS.RETRY);

// Expose on window for ES6 modules
window.CONSTANTS = CONSTANTS;
