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
   * @param {DOMRect} originRect - The starting position (button)
   */
  function performContainerTransform(originRect) {
    // IMPORTANT: Add survey-body class FIRST so we measure the correct final layout
    document.body.classList.add('survey-body');

    // Get the survey container element first (before showing)
    elements.surveyView.style.display = '';
    elements.surveyView.style.visibility = 'hidden';
    elements.surveyView.classList.add('view-active');

    var container = elements.surveyView.querySelector('.container');
    if (!container) {
      // Fallback: just show without animation
      elements.surveyView.style.visibility = '';
      elements.loginView.style.display = 'none';
      initializeSurvey();
      return;
    }

    // Force layout to get accurate final dimensions (now with correct body class)
    void container.offsetWidth;
    var containerRect = container.getBoundingClientRect();

    // Store final dimensions for later
    var finalLeft = containerRect.left;
    var finalTop = containerRect.top;
    var finalWidth = containerRect.width;
    var finalHeight = containerRect.height;

    // Calculate starting scale (how small should it be at button)
    var scale = Math.max(originRect.width / finalWidth, 0.05);

    // Calculate where the container should start (centered on button)
    var startLeft = originRect.left + originRect.width / 2 - (finalWidth * scale) / 2;
    var startTop = originRect.top + originRect.height / 2 - (finalHeight * scale) / 2;

    // Make container fixed positioned (out of document flow)
    container.style.position = 'fixed';
    container.style.left = startLeft + 'px';
    container.style.top = startTop + 'px';
    container.style.width = finalWidth + 'px';
    container.style.height = finalHeight + 'px';
    container.style.transform = 'scale(' + scale + ')';
    container.style.transformOrigin = 'top left';
    container.style.opacity = '1';
    container.style.zIndex = '1000';
    container.classList.add('container-transform-active');

    // Now make survey visible (container floats above login)
    elements.surveyView.style.visibility = '';

    // Force reflow
    void container.offsetWidth;

    // Animate to final position
    container.style.transition = 'all ' + TRANSFORM_DURATION + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.left = finalLeft + 'px';
    container.style.top = finalTop + 'px';
    container.style.transform = 'scale(1)';

    // No need to fade login - the card floats above it

    // Cleanup after animation
    setTimeout(function() {
      // Remove fixed positioning - return to normal flow
      container.style.position = '';
      container.style.left = '';
      container.style.top = '';
      container.style.width = '';
      container.style.height = '';
      container.style.transform = '';
      container.style.transition = '';
      container.style.transformOrigin = '';
      container.style.opacity = '';
      container.style.zIndex = '';
      container.classList.remove('container-transform-active');

      // Update state
      currentView = 'survey';
      document.title = 'Monitoring Cultureel Talent naar de Top 2025';

      // Hide login completely
      elements.loginView.style.display = 'none';
      elements.loginView.classList.remove('view-active');

      // Initialize survey
      initializeSurvey();
    }, TRANSFORM_DURATION);
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
    }, 300);
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
