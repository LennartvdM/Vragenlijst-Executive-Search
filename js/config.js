/**
 * Configuration for Monitoring Cultureel Talent naar de Top
 *
 * SETUP INSTRUCTIONS:
 * 1. Deploy the Google Apps Script (see docs/google-apps-script.js)
 * 2. Copy the Web App URL and paste it below as SCRIPT_URL
 * 3. The script handles both authentication and data storage
 */

const CONFIG = {
  // DEVELOPMENT MODE
  // Set to true to enable public access without login
  // Set to false for production
  DEV_MODE: true,

  // Google Apps Script Web App URL
  // Replace this with your deployed script URL
  SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL',

  // Session storage keys
  STORAGE_KEYS: {
    SESSION: 'cttt_session',
    ORG_CODE: 'cttt_org_code',
    ORG_NAME: 'cttt_org_name',
    FORM_DATA: 'cttt_form_data'
  },

  // Session timeout in milliseconds (24 hours)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

  // Survey configuration
  TOTAL_STEPS: 6,

  // Field definitions for validation and progress tracking
  STEP_FIELDS: {
    0: ['organisatie'],
    1: ['streefcijfer', 'streefcijfer_gehaald'],
    2: ['aantal_werknemers', 'werknemers_buiten_europa', 'aantal_top', 'top_buiten_europa', 'aantal_subtop', 'subtop_buiten_europa'],
    3: ['heeft_rvb', 'heeft_rvc', 'heeft_rvt'],
    4: ['leid_1', 'leid_2', 'leid_3', 'leid_4', 'leid_5'],
    5: ['datum', 'ondertekenaar', 'bevestiging']
  },

  // Section field mappings for progress indicators
  SECTION_FIELDS: {
    werknemers: ['aantal_werknemers', 'werknemers_buiten_europa'],
    top: ['aantal_top', 'top_buiten_europa'],
    subtop: ['aantal_subtop', 'subtop_buiten_europa'],
    rvb: ['heeft_rvb'],
    rvc: ['heeft_rvc'],
    rvt: ['heeft_rvt']
  }
};

// Freeze configuration to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.STEP_FIELDS);
Object.freeze(CONFIG.SECTION_FIELDS);
