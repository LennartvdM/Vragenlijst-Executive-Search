/**
 * Configuration for Monitoring Executive Search Code 2025
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
   * Total number of steps in the survey wizard (0-13 = content, 14 = review, 15 = success)
   */
  TOTAL_STEPS: 16,

  /**
   * Sign step index - the last content step before review
   */
  SIGN_STEP: 13,

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
    1: ['streef_minimum', 'streef_gemiddeld'],
    2: ['aantal_geplaatst', 'geplaatst_vrouw', 'geplaatst_rvb', 'rvb_vrouw', 'geplaatst_rvc_rvt', 'rvc_rvt_vrouw'],
    3: ['longlist_totaal', 'longlist_vrouw', 'longlist_rvb', 'longlist_rvb_vrouw', 'longlist_rvc_rvt', 'longlist_rvc_rvt_vrouw'],
    4: ['shortlist_totaal', 'shortlist_vrouw', 'shortlist_rvb', 'shortlist_rvb_vrouw', 'shortlist_rvc_rvt', 'shortlist_rvc_rvt_vrouw'],
    5: ['verzoek_vrouw', 'verzoek_man'],
    6: ['reden_niet_vrouw_1', 'reden_niet_vrouw_2', 'reden_wel_vrouw_1', 'reden_wel_vrouw_2'],
    7: ['aanbod_vrouw', 'sector_voorloper', 'sector_achterblijver'],
    8: ['aandacht_mv', 'ondersteuning_selectie'],
    9: ['belemmering_vrouw_1', 'belemmering_vrouw_2', 'belemmering_vrouw_3', 'ondersteuning_vrouw_1', 'ondersteuning_vrouw_2', 'ondersteuning_vrouw_3'],
    10: ['investering_kweekvijver', 'waarborg_kwaliteiten', 'best_practices_vrouwen'],
    11: ['aandacht_cultureel', 'verzoek_bicultureel', 'aanbod_bicultureel', 'belemmering_bicultureel_1', 'belemmering_bicultureel_2', 'belemmering_bicultureel_3', 'best_practices_bicultureel'],
    12: ['nieuwe_themas', 'opmerkingen_vragen'],
    13: ['datum', 'ondertekenaar', 'bevestiging']
  },

  /**
   * Section field mappings for progress indicators within steps
   * Used to show completion status for grouped fields
   */
  SECTION_FIELDS: {
    geplaatst: ['aantal_geplaatst', 'geplaatst_vrouw'],
    plaatsing_rvb: ['geplaatst_rvb', 'rvb_vrouw'],
    plaatsing_rvc_rvt: ['geplaatst_rvc_rvt', 'rvc_rvt_vrouw'],
    longlist_totaal: ['longlist_totaal', 'longlist_vrouw'],
    longlist_rvb: ['longlist_rvb', 'longlist_rvb_vrouw'],
    longlist_rvc_rvt: ['longlist_rvc_rvt', 'longlist_rvc_rvt_vrouw'],
    shortlist_totaal: ['shortlist_totaal', 'shortlist_vrouw'],
    shortlist_rvb: ['shortlist_rvb', 'shortlist_rvb_vrouw'],
    shortlist_rvc_rvt: ['shortlist_rvc_rvt', 'shortlist_rvc_rvt_vrouw']
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
