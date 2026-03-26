/**
 * Configuration for Monitoring Executive Search Code 2023
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
   * API endpoint URL
   * Primary: direct GAS URL (GAS supports CORS for "Anyone" deployments).
   * Fallback: Netlify proxy (/api/) configured in netlify.toml.
   *
   * When not configured, the app runs in demo mode:
   * - Public access without login is available
   * - Demo codes (DEMO, ORG-2025-XXX) are accepted
   * - Form submissions are simulated
   */
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzOq9Mn0UKwrhvPWRZaJkV2b9qH1uPtuYCOp4C9QDchaWcYk3-JJUz6LF0z9WQHb7dh/exec',
  PROXY_URL: '/api/',

  /**
   * localStorage keys for session and form data persistence
   * Prefixed with 'esc_' to avoid collisions with other apps
   */
  STORAGE_KEYS: {
    SESSION: 'esc_session',
    FORM_DATA: 'esc_form_data',
    SUBMITTED_FORMS: 'esc_submitted_forms',
    SCROLL_POSITIONS: 'esc_scroll_positions'
  },

  /**
   * Session timeout in milliseconds
   * Default: 24 hours (24 * 60 * 60 * 1000 = 86400000)
   */
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

  /**
   * Mobile breakpoint width in pixels
   */
  MOBILE_BREAKPOINT: 768,

  /**
   * Total number of steps in the survey wizard (0-8 = content, 9 = review, 10 = success)
   */
  TOTAL_STEPS: 11,

  /**
   * Sign step index - the last content step before review
   */
  SIGN_STEP: 8,

  /**
   * Review step index - shows overview of incomplete fields
   */
  REVIEW_STEP: 9,

  /**
   * Success step index - shown after successful submission
   */
  SUCCESS_STEP: 10,

  /**
   * Field definitions for validation and progress tracking
   * Maps step index to array of field names that belong to that step
   */
  STEP_FIELDS: {
    0: ['organisatie'],
    1: ['streef_minimum', 'streef_gemiddeld'],
    2: ['aantal_geplaatst', 'geplaatst_vrouw', 'geplaatst_rvb', 'rvb_vrouw', 'geplaatst_rvc_rvt', 'rvc_rvt_vrouw'],
    3: ['verzoek_vrouw', 'verzoek_man'],
    4: ['aanbod_vrouw', 'aandacht_mv', 'ondersteuning_selectie'],
    5: ['investering_kweekvijver', 'waarborg_kwaliteiten', 'best_practices_vrouwen'],
    6: ['aandacht_cultureel', 'verzoek_bicultureel', 'aanbod_bicultureel', 'belemmering_bicultureel_1', 'belemmering_bicultureel_2', 'belemmering_bicultureel_3', 'best_practices_bicultureel'],
    7: ['opmerkingen_vragen'],
    8: ['datum', 'ondertekenaar', 'bevestiging']
  },

  /**
   * Section field mappings for progress indicators within steps
   * Used to show completion status for grouped fields
   */
  SECTION_FIELDS: {
    geplaatst: ['aantal_geplaatst', 'geplaatst_vrouw'],
    plaatsing_rvb: ['geplaatst_rvb', 'rvb_vrouw'],
    plaatsing_rvc_rvt: ['geplaatst_rvc_rvt', 'rvc_rvt_vrouw']
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

// Expose on window for ES6 modules
window.CONFIG = CONFIG;
