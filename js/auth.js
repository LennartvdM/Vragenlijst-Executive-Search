/**
 * Authentication module for Monitoring Cultureel Talent naar de Top
 * Handles organization code validation and session management
 */

(function() {
  'use strict';

  // Check if already logged in on page load
  document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
  });

  /**
   * Check for existing valid session and redirect to survey if found
   */
  function checkExistingSession() {
    const session = getSession();
    if (session && session.orgCode && session.orgName) {
      // Verify session hasn't expired
      if (session.timestamp && (Date.now() - session.timestamp) < CONFIG.SESSION_TIMEOUT) {
        window.location.href = 'survey.html';
        return;
      }
      // Clear expired session
      clearSession();
    }
  }

  /**
   * Handle login form submission
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
      showError(errorDiv, 'Voer uw organisatiecode in.');
      return false;
    }

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    loginBtn.disabled = true;
    errorDiv.style.display = 'none';
    codeInput.classList.remove('error');

    try {
      const result = await validateOrganizationCode(code);

      if (result.success) {
        // Store session data
        saveSession({
          orgCode: code,
          orgName: result.organizationName,
          timestamp: Date.now()
        });

        // Redirect to survey
        window.location.href = 'survey.html';
      } else {
        showError(errorDiv, result.message || 'Ongeldige organisatiecode. Controleer uw code en probeer opnieuw.');
        codeInput.classList.add('error');
        codeInput.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(errorDiv, 'Er ging iets mis bij het controleren van uw code. Probeer het later opnieuw.');
    } finally {
      // Reset button state
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      loginBtn.disabled = false;
    }

    return false;
  };

  /**
   * Validate organization code against Google Apps Script backend
   */
  async function validateOrganizationCode(code) {
    // If no script URL configured, use demo mode
    if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
      console.warn('No Google Apps Script URL configured. Using demo mode.');
      return demoValidation(code);
    }

    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        action: 'validateCode',
        code: code
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Demo validation for testing without backend
   * Accepts codes in format: ORG-YYYY-XXX or DEMO
   */
  function demoValidation(code) {
    // Demo codes for testing
    const demoCodes = {
      'DEMO': 'Demo Organisatie',
      'ORG-2025-001': 'Voorbeeld Bedrijf BV',
      'ORG-2025-002': 'Test Organisatie NV',
      'ORG-2025-003': 'Stichting Voorbeeld'
    };

    if (demoCodes[code]) {
      return {
        success: true,
        organizationName: demoCodes[code]
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
   * Save session to localStorage
   */
  function saveSession(data) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(data));
  }

  /**
   * Get session from localStorage
   */
  function getSession() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear session data
   */
  function clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.FORM_DATA);
  }

  /**
   * Show error message
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
    getSession,
    clearSession,
    saveSession
  };
})();
