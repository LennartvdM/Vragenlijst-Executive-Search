/**
 * Authentication module for Monitoring Cultureel Talent naar de Top
 * Handles organization code validation and session management
 *
 * Dependencies: config.js, constants.js, storage.js, api.js
 */

(function() {
  'use strict';

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initDemoMode();
    setupEventListeners();
  });

  /**
   * Setup all event listeners for the login page
   */
  function setupEventListeners() {
    // Login form submission
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Public login button (demo mode)
    var publicLoginBtn = document.getElementById('publicLoginBtn');
    if (publicLoginBtn) {
      publicLoginBtn.addEventListener('click', publicLogin);
    }
  }

  /**
   * Initialize demo mode UI elements when no API is configured
   */
  function initDemoMode() {
    if (CONFIG.isDemoMode()) {
      var demoBanner = document.getElementById('demoBanner');
      var publicAccess = document.getElementById('publicAccess');

      if (demoBanner) demoBanner.style.display = 'block';
      if (publicAccess) publicAccess.style.display = 'block';

      // Make org code field not required in demo mode
      var orgCodeInput = document.getElementById('orgCode');
      if (orgCodeInput) orgCodeInput.required = false;
    }
  }

  /**
   * Public login without organization code (demo mode only)
   */
  function publicLogin() {
    if (!CONFIG.isDemoMode()) {
      return;
    }

    var publicLoginBtn = document.getElementById('publicLoginBtn');

    // Create a public session
    Storage.saveSession({
      orgCode: CONSTANTS.SESSION.PUBLIC_CODE,
      orgName: CONSTANTS.SESSION.PUBLIC_NAME,
      timestamp: Date.now(),
      isPublic: true
    });

    // Transition to survey view (SPA navigation) - expand from button
    if (typeof App !== 'undefined' && App.transitionToSurvey) {
      App.transitionToSurvey(publicLoginBtn);
    } else {
      // Fallback for direct survey.html access
      window.location.href = '/survey.html';
    }
  }

  /**
   * Handle login form submission
   * @param {Event} event - Form submit event
   */
  async function handleLogin(event) {
    event.preventDefault();

    var codeInput = document.getElementById('orgCode');
    var errorDiv = document.getElementById('loginError');
    var loginBtn = document.getElementById('loginBtn');
    var btnText = loginBtn.querySelector('.btn-text');
    var btnLoading = loginBtn.querySelector('.btn-loading');

    var code = codeInput.value.trim().toUpperCase();

    if (!code) {
      showError(errorDiv, CONSTANTS.ERRORS.ENTER_CODE);
      return;
    }

    // Show loading state
    setLoadingState(true, loginBtn, btnText, btnLoading);
    errorDiv.style.display = 'none';
    codeInput.classList.remove(CONSTANTS.CSS.ERROR);

    try {
      var result = await validateOrganizationCode(code);

      if (result.success) {
        // Store session data
        Storage.saveSession({
          orgCode: code,
          orgName: result.organizationName,
          timestamp: Date.now()
        });

        // Transition to survey view (SPA navigation) - expand from button
        if (typeof App !== 'undefined' && App.transitionToSurvey) {
          App.transitionToSurvey(loginBtn);
        } else {
          // Fallback for direct survey.html access
          window.location.href = '/survey.html';
        }
      } else {
        showError(errorDiv, result.message || CONSTANTS.ERRORS.INVALID_CODE);
        codeInput.classList.add(CONSTANTS.CSS.ERROR);
        codeInput.focus();
        setLoadingState(false, loginBtn, btnText, btnLoading);
      }
    } catch (error) {
      showError(errorDiv, CONSTANTS.ERRORS.NETWORK_ERROR);
      setLoadingState(false, loginBtn, btnText, btnLoading);
    }
  }

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
   * Falls back to demo validation when API is not configured
   * @param {string} code - The organization code to validate
   * @returns {Promise<{success: boolean, organizationName?: string, message?: string}>}
   */
  async function validateOrganizationCode(code) {
    // Use demo validation if API is not configured
    if (!ApiClient.isConfigured()) {
      return demoValidation(code);
    }

    return ApiClient.validateCode(code);
  }

  /**
   * Demo validation for testing without backend
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
    var span = element.querySelector('span');
    if (span) {
      span.textContent = message;
    }
    element.style.display = 'flex';
  }

  // Export functions for use in other modules (if needed)
  window.AuthModule = {
    getSession: Storage.getSession,
    clearSession: Storage.clearSession,
    saveSession: Storage.saveSession,
    isSessionValid: Storage.isSessionValid
  };
})();
