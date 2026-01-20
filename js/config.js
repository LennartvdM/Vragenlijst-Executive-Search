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
    FORM_DATA: 'cttt_form_data'
  },

  /**
   * Session timeout in milliseconds
   * Default: 24 hours (24 * 60 * 60 * 1000 = 86400000)
   */
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

  /**
   * Total number of steps in the survey wizard
   */
  TOTAL_STEPS: 6,

  /**
   * Field definitions for validation and progress tracking
   * Maps step index to array of field names that belong to that step
   */
  STEP_FIELDS: {
    0: ['organisatie'],
    1: ['streefcijfer', 'streefcijfer_gehaald'],
    2: ['aantal_werknemers', 'werknemers_buiten_europa', 'aantal_top', 'top_buiten_europa', 'aantal_subtop', 'subtop_buiten_europa'],
    3: ['heeft_rvb', 'heeft_rvc', 'heeft_rvt'],
    4: ['leid_1', 'leid_2', 'leid_3', 'leid_4', 'leid_5'],
    5: ['datum', 'ondertekenaar', 'bevestiging']
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
    rvt: ['heeft_rvt']
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
