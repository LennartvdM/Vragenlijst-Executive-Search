/**
 * Authentication module for Monitoring Cultureel Talent naar de Top
 * Handles organization code validation and session management
 *
 * Dependencies: config.js, constants.js, storage.js, api.js
 */

(function() {
  'use strict';

  // Check if already logged in on page load
  document.addEventListener('DOMContentLoaded', function() {
    initDevMode();
    checkExistingSession();
  });

  /**
   * Initialize dev mode UI elements
   */
  function initDevMode() {
    if (CONFIG.DEV_MODE) {
      const devBanner = document.getElementById('devBanner');
      const publicAccess = document.getElementById('publicAccess');

      if (devBanner) devBanner.style.display = 'block';
      if (publicAccess) publicAccess.style.display = 'block';

      // Make org code field not required in dev mode
      const orgCodeInput = document.getElementById('orgCode');
      if (orgCodeInput) orgCodeInput.required = false;
    }
  }

  /**
   * Check for existing valid session and redirect to survey if found
   */
  function checkExistingSession() {
    if (Storage.isSessionValid()) {
      window.location.href = 'survey.html';
      return;
    }
    // Clear any expired session data
    Storage.clearSession();
  }

  /**
   * Public login without organization code (dev mode only)
   */
  window.publicLogin = function() {
    if (!CONFIG.DEV_MODE) {
      return;
    }

    // Create a public session
    Storage.saveSession({
      orgCode: CONSTANTS.SESSION.PUBLIC_CODE,
      orgName: CONSTANTS.SESSION.PUBLIC_NAME,
      timestamp: Date.now(),
      isPublic: true
    });

    // Redirect to survey
    window.location.href = 'survey.html';
  };

  /**
   * Handle login form submission
   * @param {Event} event - Form submit event
   * @returns {boolean} Always false to prevent form submission
   */
  window.handleLogin = async function(event) {
    event.preventDefault();

    const codeInput = document.getElementById('orgCode');
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');

    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
      showError(errorDiv, CONSTANTS.ERRORS.ENTER_CODE);
      return false;
    }

    // Show loading state
    setLoadingState(true, loginBtn, btnText, btnLoading);
    errorDiv.style.display = 'none';
    codeInput.classList.remove(CONSTANTS.CSS.ERROR);

    try {
      const result = await validateOrganizationCode(code);

      if (result.success) {
        // Store session data
        Storage.saveSession({
          orgCode: code,
          orgName: result.organizationName,
          timestamp: Date.now()
        });

        // Redirect to survey
        window.location.href = 'survey.html';
      } else {
        showError(errorDiv, result.message || CONSTANTS.ERRORS.INVALID_CODE);
        codeInput.classList.add(CONSTANTS.CSS.ERROR);
        codeInput.focus();
      }
    } catch (error) {
      showError(errorDiv, CONSTANTS.ERRORS.NETWORK_ERROR);
    } finally {
      setLoadingState(false, loginBtn, btnText, btnLoading);
    }

    return false;
  };

  /**
   * Set the loading state of the login button
   * @param {boolean} isLoading - Whether to show loading state
   * @param {HTMLButtonElement} btn - The button element
   * @param {HTMLElement} textEl - The button text element
   * @param {HTMLElement} loadingEl - The loading indicator element
   */
  function setLoadingState(isLoading, btn, textEl, loadingEl) {
    btn.disabled = isLoading;
    textEl.style.display = isLoading ? 'none' : 'inline';
    loadingEl.style.display = isLoading ? 'flex' : 'none';
  }

  /**
   * Validate organization code against backend
   * Falls back to demo validation in dev mode or when API is not configured
   * @param {string} code - The organization code to validate
   * @returns {Promise<{success: boolean, organizationName?: string, message?: string}>}
   */
  async function validateOrganizationCode(code) {
    // Use demo validation if API is not configured
    if (!ApiClient.isConfigured()) {
      if (CONFIG.DEV_MODE) {
        return demoValidation(code);
      }
      // In production without API, reject all codes
      return {
        success: false,
        message: CONSTANTS.ERRORS.NETWORK_ERROR
      };
    }

    return ApiClient.validateCode(code);
  }

  /**
   * Demo validation for testing without backend (dev mode only)
   * Accepts codes in format: ORG-YYYY-XXX or DEMO
   * @param {string} code - The organization code to validate
   * @returns {{success: boolean, organizationName?: string, message?: string}}
   */
  function demoValidation(code) {
    // Accept DEMO code
    if (code === 'DEMO') {
      return {
        success: true,
        organizationName: 'Demo Organisatie'
      };
    }

    // Accept any code matching the pattern for demo purposes
    if (/^ORG-\d{4}-\d{3}$/.test(code)) {
      return {
        success: true,
        organizationName: 'Organisatie ' + code
      };
    }

    return {
      success: false,
      message: 'Ongeldige organisatiecode. Gebruik DEMO of een code in het formaat ORG-2025-001.'
    };
  }

  /**
   * Show error message in the error display element
   * @param {HTMLElement} element - The error container element
   * @param {string} message - The error message to display
   */
  function showError(element, message) {
    const span = element.querySelector('span');
    if (span) {
      span.textContent = message;
    }
    element.style.display = 'flex';
  }

  // Export functions for use in other modules
  window.AuthModule = {
    getSession: Storage.getSession,
    clearSession: Storage.clearSession,
    saveSession: Storage.saveSession,
    isSessionValid: Storage.isSessionValid
  };
})();
