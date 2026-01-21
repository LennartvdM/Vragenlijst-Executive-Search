/**
 * Configuration for Monitoring Cultureel Talent naar de Top
 *
 * SETUP INSTRUCTIONS:
 * 1. Deploy the Google Apps Script (see docs/google-apps-script.js)
 * 2. Copy the Web App URL and paste it below as SCRIPT_URL
 * 3. The script handles both authentication and data storage
 *
 * NOTE: When SCRIPT_URL is not configured, the app runs in demo mode automatically.
 */

const CONFIG = {
  /**
   * Google Apps Script Web App URL
   * Replace with your deployed script URL from Google Apps Script
   * Format: https://script.google.com/macros/s/XXXXXX/exec
   *
   * When not configured, the app runs in demo mode:
   * - Public access without login is available
   * - Demo codes (DEMO, ORG-2025-XXX) are accepted
   * - Form submissions are simulated
   */
  SCRIPT_URL: '',

  /**
   * localStorage keys for session and form data persistence
   * Prefixed with 'cttt_' to avoid collisions with other apps
   */
  STORAGE_KEYS: {
    SESSION: 'cttt_session',
    FORM_DATA: 'cttt_form_data',
    SUBMITTED_FORMS: 'cttt_submitted_forms'
  },

  /**
   * Session timeout in milliseconds
   * Default: 24 hours (24 * 60 * 60 * 1000 = 86400000)
   */
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

  /**
   * Total number of steps in the survey wizard (0-13 = content, 14 = review, 15 = success)
   */
  TOTAL_STEPS: 16,

  /**
   * Review step index - shows overview of incomplete fields
   */
  REVIEW_STEP: 14,

  /**
   * Success step index - shown after successful submission
   */
  SUCCESS_STEP: 15,

  /**
   * Field definitions for validation and progress tracking
   * Maps step index to array of field names that belong to that step
   */
  STEP_FIELDS: {
    0: ['organisatie'],
    1: ['streefcijfer', 'streefcijfer_gehaald', 'definitie_afwijking'],
    2: ['aantal_werknemers', 'werknemers_buiten_europa', 'aantal_top', 'top_buiten_europa', 'aantal_subtop', 'subtop_buiten_europa'],
    3: ['heeft_rvb', 'heeft_rvc', 'heeft_rvt', 'beleid_samenstelling'],
    4: [], // Kwalitatieve gegevens intro - no fields, informational only
    5: ['leid_1', 'leid_2', 'leid_3', 'leid_4', 'leid_5'],
    6: ['strat_1', 'strat_2', 'strat_3', 'strat_4', 'strat_5', 'strat_6', 'strat_7', 'strat_8'],
    7: ['hr_1', 'hr_2', 'hr_3', 'hr_4', 'hr_5', 'hr_6', 'hr_7', 'hr_8', 'hr_9', 'hr_10', 'hr_11', 'hr_12', 'hr_13', 'hr_14'],
    8: ['comm_1', 'comm_2', 'comm_3', 'comm_4', 'comm_5'],
    9: ['kennis_1', 'kennis_2', 'kennis_3', 'kennis_4', 'kennis_5', 'kennis_6', 'kennis_7', 'kennis_8'],
    10: ['klimaat_1', 'klimaat_2', 'klimaat_3', 'klimaat_4', 'klimaat_5', 'klimaat_6'],
    11: ['motivatie'],
    12: ['strategie_vraag_1', 'blokkade_1', 'bevorderend_1', 'voorbeeld_organisatie'],
    13: ['datum', 'ondertekenaar', 'bevestiging']
  },

  /**
   * Section field mappings for progress indicators within steps
   * Used to show completion status for grouped fields
   */
  SECTION_FIELDS: {
    werknemers: ['aantal_werknemers', 'werknemers_buiten_europa'],
    top: ['aantal_top', 'top_buiten_europa'],
    subtop: ['aantal_subtop', 'subtop_buiten_europa'],
    rvb: ['heeft_rvb'],
    rvc: ['heeft_rvc'],
    rvt: ['heeft_rvt'],
    beleid: ['beleid_samenstelling']
  },

  /**
   * Check if the app is running in demo mode (no API configured)
   * @returns {boolean}
   */
  isDemoMode: function() {
    return !this.SCRIPT_URL || this.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL';
  }
};

// Freeze configuration to prevent accidental modification at runtime
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.STEP_FIELDS);
Object.freeze(CONFIG.SECTION_FIELDS);
