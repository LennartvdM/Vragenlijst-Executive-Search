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
    // Update state
    currentView = 'survey';
    document.title = 'Monitoring Cultureel Talent naar de Top 2025';
    document.body.classList.add('survey-body');

    // Show survey view (needed to get container dimensions)
    elements.surveyView.style.display = '';
    elements.surveyView.style.visibility = 'hidden';
    elements.surveyView.classList.add('view-active');

    // Get the survey container element
    var container = elements.surveyView.querySelector('.container');
    if (!container) {
      // Fallback: just show without animation
      elements.surveyView.style.visibility = '';
      elements.loginView.style.display = 'none';
      initializeSurvey();
      return;
    }

    // Force layout to get accurate measurements
    void container.offsetWidth;

    // Get the container's final position
    var containerRect = container.getBoundingClientRect();

    // Calculate the transform to move container from button position to final position
    // We need to find what scale and translate would make the container appear at button position
    var scaleX = originRect.width / containerRect.width;
    var scaleY = originRect.height / containerRect.height;
    var scale = Math.min(scaleX, scaleY, 0.1); // Cap at 0.1 to keep content somewhat visible

    // Calculate translation to move scaled container's center to button's center
    var originCenterX = originRect.left + originRect.width / 2;
    var originCenterY = originRect.top + originRect.height / 2;
    var containerCenterX = containerRect.left + containerRect.width / 2;
    var containerCenterY = containerRect.top + containerRect.height / 2;

    var translateX = originCenterX - containerCenterX;
    var translateY = originCenterY - containerCenterY;

    // Apply initial transform (container appears at button position)
    container.style.transformOrigin = 'center center';
    container.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
    container.style.opacity = '0.9';
    container.classList.add('container-transform-active');

    // Hide login and make survey visible
    elements.loginView.style.opacity = '0';
    elements.surveyView.style.visibility = '';

    // Force reflow
    void container.offsetWidth;

    // Animate to final position
    container.style.transition = 'transform ' + TRANSFORM_DURATION + 'ms cubic-bezier(0.4, 0, 0.2, 1), opacity ' + TRANSFORM_DURATION + 'ms ease-out';
    container.style.transform = 'translate(0, 0) scale(1)';
    container.style.opacity = '1';

    // Fade out login card during animation
    var loginCard = elements.loginView.querySelector('.login-card');
    if (loginCard) {
      loginCard.style.transition = 'opacity 200ms ease-out';
      loginCard.style.opacity = '0';
    }

    // Cleanup after animation
    setTimeout(function() {
      // Remove inline styles
      container.style.transform = '';
      container.style.transition = '';
      container.style.transformOrigin = '';
      container.style.opacity = '';
      container.classList.remove('container-transform-active');

      // Hide login completely
      elements.loginView.style.display = 'none';
      elements.loginView.style.opacity = '';
      elements.loginView.classList.remove('view-active');

      if (loginCard) {
        loginCard.style.transition = '';
        loginCard.style.opacity = '';
      }

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
