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
    surveyView: null
  };

  // Animation duration in ms
  var TRANSFORM_DURATION = 500;

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
   * The survey card expands from the button position with content visible
   * @param {HTMLElement} originElement - The element to expand from (usually the login button)
   */
  function transitionToSurvey(originElement) {
    // Get origin rect (button position)
    var originRect;
    if (originElement && originElement.getBoundingClientRect) {
      originRect = originElement.getBoundingClientRect();
    } else {
      // Fallback: center of screen
      originRect = {
        left: window.innerWidth / 2 - 50,
        top: window.innerHeight / 2 - 25,
        width: 100,
        height: 50
      };
    }

    // Load survey content first
    var loadPromise;
    if (!surveyLoaded) {
      loadPromise = fetch('/views/survey.html')
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
      loadPromise = Promise.resolve();
    }

    loadPromise
      .then(function() {
        performContainerTransform(originRect);
      })
      .catch(function(error) {
        console.error('App: Error loading survey:', error);
        window.location.href = '/survey.html';
      });
  }

  /**
   * Perform the container transform animation
   * Login stays 100% stable, survey card expands on top, then login fades out
   * @param {DOMRect} originRect - The starting position (button)
   */
  function performContainerTransform(originRect) {
    var container = elements.surveyView.querySelector('.container');
    if (!container) {
      // Fallback: just show without animation
      document.body.classList.add('survey-body');
      elements.surveyView.style.display = '';
      elements.surveyView.classList.add('view-active');
      elements.loginView.style.display = 'none';
      initializeSurvey();
      return;
    }

    // ========================================
    // PHASE 1: INVISIBLE MEASUREMENT
    // Measure final position without user seeing anything
    // ========================================
    document.body.style.visibility = 'hidden';

    // Set up TRUE final state: login hidden, survey in normal flow with survey-body
    elements.loginView.style.display = 'none';
    document.body.classList.add('survey-body');
    elements.surveyView.style.display = '';
    elements.surveyView.classList.add('view-active');

    // Measure the TRUE final position
    void container.offsetWidth;
    var containerRect = container.getBoundingClientRect();
    var finalLeft = containerRect.left;
    var finalTop = containerRect.top;
    var finalWidth = containerRect.width;
    var finalHeight = containerRect.height;

    // Reset everything back to starting state
    elements.loginView.style.display = '';
    elements.surveyView.style.display = 'none';
    elements.surveyView.classList.remove('view-active');
    document.body.classList.remove('survey-body');

    // Make page visible - login is exactly as before, user saw nothing
    document.body.style.visibility = '';

    // ========================================
    // PHASE 2: ANIMATION
    // Login stays stable, container floats on top
    // ========================================

    // Calculate starting scale and position (centered on button)
    var scale = Math.max(originRect.width / finalWidth, 0.05);
    var startLeft = originRect.left + originRect.width / 2 - (finalWidth * scale) / 2;
    var startTop = originRect.top + originRect.height / 2 - (finalHeight * scale) / 2;

    // Show survey as invisible fixed overlay (doesn't affect login layout)
    elements.surveyView.style.position = 'fixed';
    elements.surveyView.style.top = '0';
    elements.surveyView.style.left = '0';
    elements.surveyView.style.width = '100%';
    elements.surveyView.style.height = '100%';
    elements.surveyView.style.background = 'transparent';
    elements.surveyView.style.zIndex = '100';
    elements.surveyView.style.overflow = 'visible';
    elements.surveyView.style.display = '';
    elements.surveyView.classList.add('view-active');
    // NOTE: Do NOT add survey-body class here - it affects login layout!

    // Position container at button location
    container.style.position = 'fixed';
    container.style.left = startLeft + 'px';
    container.style.top = startTop + 'px';
    container.style.width = finalWidth + 'px';
    container.style.height = finalHeight + 'px';
    container.style.transform = 'scale(' + scale + ')';
    container.style.transformOrigin = 'top left';
    container.style.zIndex = '1000';
    container.classList.add('container-transform-active');

    // Force reflow before animation
    void container.offsetWidth;

    // Animate container to final position
    container.style.transition = 'all ' + TRANSFORM_DURATION + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.left = finalLeft + 'px';
    container.style.top = finalTop + 'px';
    container.style.transform = 'scale(1)';

    // ========================================
    // PHASE 3: CLEANUP
    // After expansion, fade login, then settle into normal flow
    // ========================================
    setTimeout(function() {
      // Fade out login
      elements.loginView.style.transition = 'opacity 300ms ease-out';
      elements.loginView.style.opacity = '0';

      // After login fade completes
      setTimeout(function() {
        // Hide login completely
        elements.loginView.style.display = 'none';
        elements.loginView.style.opacity = '';
        elements.loginView.style.transition = '';
        elements.loginView.classList.remove('view-active');

        // NOW add survey-body class (login is gone, safe to change body layout)
        document.body.classList.add('survey-body');

        // Remove fixed positioning from container
        container.style.position = '';
        container.style.left = '';
        container.style.top = '';
        container.style.width = '';
        container.style.height = '';
        container.style.transform = '';
        container.style.transition = '';
        container.style.transformOrigin = '';
        container.style.zIndex = '';
        container.classList.remove('container-transform-active');

        // Remove fixed overlay from survey-view
        elements.surveyView.style.position = '';
        elements.surveyView.style.top = '';
        elements.surveyView.style.left = '';
        elements.surveyView.style.width = '';
        elements.surveyView.style.height = '';
        elements.surveyView.style.background = '';
        elements.surveyView.style.zIndex = '';
        elements.surveyView.style.overflow = '';

        // Update state
        currentView = 'survey';
        document.title = 'Monitoring Cultureel Talent naar de Top 2025';

        // Initialize survey
        initializeSurvey();
      }, 300); // Login fade duration
    }, TRANSFORM_DURATION);
  }

  /**
   * Transition from survey to login view with crossfade
   * Called when user logs out (session should already be cleared by caller)
   */
  function transitionToLogin() {
    var FADE_DURATION = 400;

    // Prepare login underneath (invisible, but in position)
    document.body.classList.remove('survey-body');
    elements.loginView.style.display = '';
    elements.loginView.style.opacity = '0';
    elements.loginView.classList.add('view-active');

    // Force reflow
    void elements.loginView.offsetWidth;

    // Start crossfade: login fades in, survey fades out simultaneously
    elements.loginView.style.transition = 'opacity ' + FADE_DURATION + 'ms ease-out';
    elements.loginView.style.opacity = '1';

    elements.surveyView.style.transition = 'opacity ' + FADE_DURATION + 'ms ease-out';
    elements.surveyView.style.opacity = '0';

    // Cleanup after crossfade completes
    setTimeout(function() {
      // Hide survey completely
      elements.surveyView.style.display = 'none';
      elements.surveyView.style.opacity = '';
      elements.surveyView.style.transition = '';
      elements.surveyView.classList.remove('view-active');

      // Clean up login transition
      elements.loginView.style.transition = '';

      // Update state
      currentView = 'login';
      document.title = 'Inloggen - Monitoring Cultureel Talent naar de Top 2025';
    }, FADE_DURATION);
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
