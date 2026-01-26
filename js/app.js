/**
 * App Controller for Monitoring Cultureel Talent naar de Top
 * Handles SPA view management, routing, and transitions
 *
 * Dependencies: config.js, constants.js, storage.js
 */

var App = (function() {
  'use strict';

  // View state
  var currentView = null;
  var surveyLoaded = false;
  var surveyInitialized = false;

  // DOM elements (cached after init)
  var elements = {
    loginView: null,
    surveyView: null,
    expandOverlay: null
  };

  // Animation durations in ms
  var EXPAND_DURATION = 450;
  var CONTENT_FADE_DURATION = 300;

  /**
   * Initialize the application
   * Determines initial view based on session state
   */
  function init() {
    // Cache DOM elements
    elements.loginView = document.getElementById('login-view');
    elements.surveyView = document.getElementById('survey-view');

    if (!elements.loginView || !elements.surveyView) {
      console.error('App: Required view containers not found');
      return;
    }

    // Create expand overlay element
    createExpandOverlay();

    // Check for logout parameter
    if (window.location.search.includes('logout=1')) {
      handleLogout();
    }

    // Determine initial view based on session
    if (Storage.isSessionValid()) {
      // User has valid session - show survey
      loadAndShowSurvey();
    } else {
      // No valid session - show login
      showLogin();
    }

    // Setup popstate handler for browser back/forward
    window.addEventListener('popstate', handlePopState);
  }

  /**
   * Create the expand overlay element used for container transform animation
   */
  function createExpandOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'expand-overlay';
    overlay.className = 'expand-overlay';
    document.body.appendChild(overlay);
    elements.expandOverlay = overlay;
  }

  /**
   * Handle logout - clear session and show login
   */
  function handleLogout() {
    try {
      localStorage.removeItem('cttt_session');
      localStorage.removeItem('cttt_form_data');
    } catch (e) {
      // Ignore storage errors
    }
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  /**
   * Handle browser back/forward navigation
   */
  function handlePopState() {
    if (Storage.isSessionValid() && currentView === 'login') {
      loadAndShowSurvey();
    } else if (!Storage.isSessionValid() && currentView === 'survey') {
      showLogin();
    }
  }

  /**
   * Show the login view
   */
  function showLogin() {
    currentView = 'login';

    // Update document title
    document.title = 'Inloggen - Monitoring Cultureel Talent naar de Top 2025';

    // Remove survey-body class from body
    document.body.classList.remove('survey-body');

    // Hide survey, show login
    elements.surveyView.style.display = 'none';
    elements.surveyView.classList.remove('view-active');

    elements.loginView.style.display = '';
    // Trigger reflow for animation
    void elements.loginView.offsetWidth;
    elements.loginView.classList.add('view-active');
  }

  /**
   * Load survey content and show it
   * Called when user has valid session on page load
   */
  function loadAndShowSurvey() {
    if (surveyLoaded) {
      showSurvey();
      return;
    }

    // Fetch survey partial
    fetch('/views/survey.html')
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to load survey');
        }
        return response.text();
      })
      .then(function(html) {
        elements.surveyView.innerHTML = html;
        surveyLoaded = true;
        showSurvey();
        initializeSurvey();
      })
      .catch(function(error) {
        console.error('App: Error loading survey:', error);
        // Fallback: redirect to survey.html if fetch fails
        window.location.href = '/survey.html';
      });
  }

  /**
   * Show the survey view (assumes content is loaded)
   */
  function showSurvey() {
    currentView = 'survey';

    // Update document title
    document.title = 'Monitoring Cultureel Talent naar de Top 2025';

    // Add survey-body class to body for styling
    document.body.classList.add('survey-body');

    // Hide login, show survey
    elements.loginView.style.display = 'none';
    elements.loginView.classList.remove('view-active');

    elements.surveyView.style.display = '';
    // Trigger reflow for animation
    void elements.surveyView.offsetWidth;
    elements.surveyView.classList.add('view-active');
  }

  /**
   * Initialize survey module after content is loaded
   */
  function initializeSurvey() {
    if (surveyInitialized) return;

    // Survey.js should expose an init function
    if (typeof Survey !== 'undefined' && typeof Survey.init === 'function') {
      Survey.init();
      surveyInitialized = true;
    }
  }

  /**
   * Transition from login to survey view with container transform animation
   * Called by auth.js after successful login
   * @param {HTMLElement} originElement - The element to expand from (usually the login button)
   */
  function transitionToSurvey(originElement) {
    // Get origin rect (button position) or use center of screen as fallback
    var originRect;
    if (originElement && originElement.getBoundingClientRect) {
      originRect = originElement.getBoundingClientRect();
    } else {
      // Fallback: center of screen
      var centerX = window.innerWidth / 2;
      var centerY = window.innerHeight / 2;
      originRect = {
        left: centerX - 50,
        top: centerY - 25,
        width: 100,
        height: 50
      };
    }

    // Position overlay at button location
    var overlay = elements.expandOverlay;
    overlay.style.left = originRect.left + 'px';
    overlay.style.top = originRect.top + 'px';
    overlay.style.width = originRect.width + 'px';
    overlay.style.height = originRect.height + 'px';
    overlay.style.borderRadius = '8px';
    overlay.style.display = 'block';
    overlay.style.opacity = '1';

    // Force reflow
    void overlay.offsetWidth;

    // Start expand animation
    overlay.classList.add('expanding');

    // Load survey content during animation
    var surveyLoadPromise;
    if (!surveyLoaded) {
      surveyLoadPromise = fetch('/views/survey.html')
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to load survey');
          }
          return response.text();
        })
        .then(function(html) {
          elements.surveyView.innerHTML = html;
          surveyLoaded = true;
        });
    } else {
      surveyLoadPromise = Promise.resolve();
    }

    // After expand animation completes
    setTimeout(function() {
      // Ensure survey is loaded before proceeding
      surveyLoadPromise
        .then(function() {
          completeExpandTransition();
        })
        .catch(function(error) {
          console.error('App: Error loading survey:', error);
          // Reset overlay and fallback
          overlay.classList.remove('expanding');
          overlay.style.display = 'none';
          window.location.href = '/survey.html';
        });
    }, EXPAND_DURATION);
  }

  /**
   * Complete the expand transition - show survey content
   */
  function completeExpandTransition() {
    var overlay = elements.expandOverlay;

    // Hide login view
    elements.loginView.style.display = 'none';
    elements.loginView.classList.remove('view-active');

    // Update state
    currentView = 'survey';
    document.title = 'Monitoring Cultureel Talent naar de Top 2025';
    document.body.classList.add('survey-body');

    // Show survey view (invisible initially for fade-in)
    elements.surveyView.style.display = '';
    elements.surveyView.style.opacity = '0';
    void elements.surveyView.offsetWidth;

    // Fade in survey content
    elements.surveyView.classList.add('view-active');
    elements.surveyView.style.opacity = '';

    // Initialize survey
    initializeSurvey();

    // Fade out and remove overlay
    overlay.classList.add('fade-out');

    setTimeout(function() {
      overlay.classList.remove('expanding', 'fade-out');
      overlay.style.display = 'none';
      overlay.style.left = '';
      overlay.style.top = '';
      overlay.style.width = '';
      overlay.style.height = '';
    }, CONTENT_FADE_DURATION);
  }

  /**
   * Transition from survey to login view
   * Called when user logs out (session should already be cleared by caller)
   */
  function transitionToLogin() {
    // Start fade out of survey
    elements.surveyView.classList.add('view-fade-out');
    elements.surveyView.classList.remove('view-active');

    setTimeout(function() {
      // Hide survey
      elements.surveyView.style.display = 'none';
      elements.surveyView.classList.remove('view-fade-out');
      document.body.classList.remove('survey-body');

      // Show login
      showLogin();
    }, CONTENT_FADE_DURATION);
  }

  // Public API
  return {
    init: init,
    transitionToSurvey: transitionToSurvey,
    transitionToLogin: transitionToLogin,
    showLogin: showLogin,
    showSurvey: showSurvey
  };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
