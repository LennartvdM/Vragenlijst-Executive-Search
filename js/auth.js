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

    // Split code input: auto-advance and paste handling
    var part1 = document.getElementById('orgCodePart1');
    var part2 = document.getElementById('orgCodePart2');

    if (part1 && part2) {
      // Clear validation on input
      function clearCodeValidation() {
        var v = document.getElementById('codeValidation');
        if (v) v.style.display = 'none';
        part1.classList.remove(CONSTANTS.CSS.ERROR);
        part2.classList.remove(CONSTANTS.CSS.ERROR);
      }

      // Auto-advance to part2 when part1 is filled
      part1.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        clearCodeValidation();
        if (this.value.length === 3) {
          part2.focus();
        }
      });

      part2.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        clearCodeValidation();
      });

      // Handle paste on either field: split full code across both
      part1.addEventListener('paste', function(e) {
        handleCodePaste(e, part1, part2);
      });
      part2.addEventListener('paste', function(e) {
        handleCodePaste(e, part1, part2);
      });

      // Allow backspace from empty part2 to jump back to part1
      part2.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === '') {
          part1.focus();
        }
      });

      // Ctrl+A / Cmd+A selects both fields visually
      function handleSelectAll(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          part1.select();
          part2.select();
          part1.parentElement.classList.add('code-input-selected');
        }
      }
      part1.addEventListener('keydown', handleSelectAll);
      part2.addEventListener('keydown', handleSelectAll);

      // Ctrl+C / Cmd+C copies the full combined code when both are selected
      function handleCopy(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && part1.parentElement.classList.contains('code-input-selected')) {
          e.preventDefault();
          var fullCode = part1.value + '-' + part2.value;
          navigator.clipboard.writeText(fullCode);
        }
      }
      part1.addEventListener('keydown', handleCopy);
      part2.addEventListener('keydown', handleCopy);

      // Clear the "selected" visual state on click or any other input
      function clearGroupSelection() {
        part1.parentElement.classList.remove('code-input-selected');
      }
      part1.addEventListener('click', clearGroupSelection);
      part2.addEventListener('click', clearGroupSelection);
      part1.addEventListener('input', clearGroupSelection);
      part2.addEventListener('input', clearGroupSelection);
    }

    // Public login button (demo mode)
    var publicLoginBtn = document.getElementById('publicLoginBtn');
    if (publicLoginBtn) {
      publicLoginBtn.addEventListener('click', publicLogin);
    }
  }

  /**
   * Handle paste event for split code inputs
   * Splits a pasted code like "YAW-PGP" across both fields
   */
  function handleCodePaste(e, part1, part2) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData).getData('text').trim().toUpperCase();
    // Remove any separators (dash, space, etc.)
    var clean = pasted.replace(/[\s\-_]/g, '');
    if (clean.length >= 6) {
      part1.value = clean.substring(0, 3);
      part2.value = clean.substring(3, 6);
      part2.focus();
    } else if (clean.length <= 3) {
      // Short paste, just put in current field
      var target = e.target;
      target.value = clean.substring(0, 3);
      if (clean.length === 3 && target === part1) {
        part2.focus();
      }
    } else {
      // 4 or 5 chars: fill part1 with first 3, rest in part2
      part1.value = clean.substring(0, 3);
      part2.value = clean.substring(3);
      part2.focus();
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

      // Make org code fields not required in demo mode
      var part1 = document.getElementById('orgCodePart1');
      var part2 = document.getElementById('orgCodePart2');
      if (part1) part1.required = false;
      if (part2) part2.required = false;
    }
  }

  /**
   * Public login without organization code (inkijkexemplaar)
   */
  function publicLogin() {

    var publicLoginBtn = document.getElementById('publicLoginBtn');

    // Create a public session
    Storage.saveSession({
      orgCode: CONSTANTS.SESSION.PUBLIC_CODE,
      orgName: CONSTANTS.SESSION.PUBLIC_NAME,
      timestamp: Date.now(),
      isPublic: true
    });

    // Update URL so /inkijkexemplaar is shareable
    window.history.pushState({ inkijkexemplaar: true }, '', '/inkijkexemplaar');

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

    var codePart1 = document.getElementById('orgCodePart1');
    var codePart2 = document.getElementById('orgCodePart2');
    var errorDiv = document.getElementById('loginError');
    var loginBtn = document.getElementById('loginBtn');
    var btnText = loginBtn.querySelector('.btn-text');
    var btnLoading = loginBtn.querySelector('.btn-loading');
    var btnLoadingText = loginBtn.querySelector('.btn-loading-text');
    var retryProgress = document.getElementById('retryProgress');
    var retryProgressFill = document.getElementById('retryProgressFill');
    var retryProgressText = document.getElementById('retryProgressText');

    var p1 = codePart1.value.trim().toUpperCase();
    var p2 = codePart2.value.trim().toUpperCase();
    var codeValidation = document.getElementById('codeValidation');

    if (!p1 || !p2) {
      if (!p1) { codePart1.classList.add(CONSTANTS.CSS.ERROR); codePart1.focus(); }
      if (!p2) codePart2.classList.add(CONSTANTS.CSS.ERROR);
      if (codeValidation) codeValidation.style.display = '';
      return;
    }

    var code = p1 + '-' + p2;

    // Hide validation and show loading state
    if (codeValidation) codeValidation.style.display = 'none';
    setLoadingState(true, loginBtn, btnText, btnLoading);
    errorDiv.style.display = 'none';
    codePart1.classList.remove(CONSTANTS.CSS.ERROR);
    codePart2.classList.remove(CONSTANTS.CSS.ERROR);

    // Reset retry progress
    if (retryProgress) {
      retryProgress.style.display = 'none';
      retryProgressFill.style.width = '0%';
    }

    // Progress callback to show retry attempts to the user
    var onProgress = function(attempt, maxAttempts) {
      if (btnLoadingText) {
        btnLoadingText.textContent = 'Poging ' + attempt + ' van ' + maxAttempts + '...';
      }
      if (retryProgress && attempt > 1) {
        retryProgress.style.display = 'flex';
      }
      if (retryProgressFill) {
        retryProgressFill.style.width = ((attempt / maxAttempts) * 100) + '%';
      }
      if (retryProgressText) {
        if (attempt === 1) {
          retryProgressText.textContent = 'Verbinding maken...';
        } else {
          retryProgressText.textContent = 'Server reageert niet, opnieuw proberen...';
        }
      }
    };

    try {
      var result = await validateOrganizationCode(code, { onProgress: onProgress });

      if (result.success) {
        // Store session data
        Storage.saveSession({
          orgCode: code,
          orgName: result.organizationName,
          timestamp: Date.now()
        });

        // Hide retry progress
        if (retryProgress) retryProgress.style.display = 'none';

        // Transition to survey view (SPA navigation) - expand from button
        if (typeof App !== 'undefined' && App.transitionToSurvey) {
          App.transitionToSurvey(loginBtn);
        } else {
          // Fallback for direct survey.html access
          window.location.href = '/survey.html';
        }
      } else {
        showError(errorDiv, result.message || CONSTANTS.ERRORS.INVALID_CODE);
        codePart1.classList.add(CONSTANTS.CSS.ERROR);
        codePart2.classList.add(CONSTANTS.CSS.ERROR);
        codePart1.focus();
        resetLoginUI(loginBtn, btnText, btnLoading, btnLoadingText, retryProgress);
      }
    } catch (error) {
      const isServerConfig = error instanceof ApiError && (error.code === 'AUTH_REDIRECT' || error.code === 'REDIRECT_ERROR' || error.code === 'PARSE_ERROR');
      const message = isServerConfig
        ? 'De server is tijdelijk niet beschikbaar. Probeer het later opnieuw of neem contact op met de beheerder.'
        : CONSTANTS.ERRORS.NETWORK_ERROR;
      showError(errorDiv, message);
      resetLoginUI(loginBtn, btnText, btnLoading, btnLoadingText, retryProgress);
    }
  }

  /**
   * Reset login UI to its default state after an error
   */
  function resetLoginUI(btn, textEl, loadingEl, loadingTextEl, retryProgress) {
    setLoadingState(false, btn, textEl, loadingEl);
    if (loadingTextEl) loadingTextEl.textContent = 'Controleren...';
    if (retryProgress) retryProgress.style.display = 'none';
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
  async function validateOrganizationCode(code, options) {
    // Use demo validation if API is not configured
    if (!ApiClient.isConfigured()) {
      return demoValidation(code);
    }

    return ApiClient.validateCode(code, options);
  }

  /**
   * Demo validation for testing without backend
   * Accepts codes in format: XXX-XXX (e.g. YAW-PGP) or DEM-OOO
   * @param {string} code - The organization code to validate
   * @returns {{success: boolean, organizationName?: string, message?: string}}
   */
  function demoValidation(code) {
    // Accept any code matching the XXX-XXX pattern for demo purposes
    if (/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code)) {
      return {
        success: true,
        organizationName: 'Organisatie ' + code
      };
    }

    return {
      success: false,
      message: 'Ongeldige organisatiecode. Voer een code in het formaat ABC-DEF in.'
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
