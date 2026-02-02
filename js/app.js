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
  var TRANSFORM_DURATION = 350;

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

    // Preload survey HTML in background so it's ready when user logs in
    preloadSurvey();
  }

  /**
   * Preload survey HTML in background while user is on login screen
   * This eliminates the fetch delay when transitioning to the survey
   */
  function preloadSurvey() {
    if (surveyLoaded) return;

    fetch('/views/survey.html')
      .then(function(response) {
        if (!response.ok) return;
        return response.text();
      })
      .then(function(html) {
        if (html && !surveyLoaded) {
          elements.surveyView.innerHTML = html;
          surveyLoaded = true;
        }
      })
      .catch(function() {
        // Silently ignore preload failures - will retry on actual navigation
      });
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
        initializeSurvey();
        showSurvey();
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

    // Survey.js exposes init function (Vite may export as initSurvey)
    if (typeof Survey !== 'undefined' && typeof Survey.init === 'function') {
      Survey.init();
      surveyInitialized = true;
    } else if (typeof Survey !== 'undefined' && typeof Survey.initSurvey === 'function') {
      Survey.initSurvey();
      surveyInitialized = true;
    } else {
      console.error('App: Survey module not available');
    }
  }

  /**
   * Transition from login to survey view with container transform animation
   * The survey card expands from the button position with content visible
   * @param {HTMLElement} originElement - The element to expand from (usually the login button)
   */
  function transitionToSurvey(originElement) {
    var MOBILE_BREAKPOINT = 768;
    var isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    // On mobile, skip the container transform animation - just load and show
    if (isMobile) {
      var mobileLoadPromise;
      if (!surveyLoaded) {
        mobileLoadPromise = fetch('/views/survey.html')
          .then(function(response) {
            if (!response.ok) throw new Error('Failed to load survey');
            return response.text();
          })
          .then(function(html) {
            elements.surveyView.innerHTML = html;
            surveyLoaded = true;
          });
      } else {
        mobileLoadPromise = Promise.resolve();
      }
      mobileLoadPromise
        .then(function() {
          initializeSurvey();
          document.body.classList.add('survey-body');
          elements.loginView.style.display = 'none';
          elements.loginView.classList.remove('view-active');
          elements.surveyView.style.display = '';
          elements.surveyView.classList.add('view-active');
          currentView = 'survey';
          document.title = 'Monitoring Cultureel Talent naar de Top 2025';
        })
        .catch(function(error) {
          console.error('App: Error loading survey:', error);
          window.location.href = '/survey.html';
        });
      return;
    }

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
        // Initialize survey BEFORE animation so progress dots and
        // inkijkexemplaar are already in the DOM when the form appears
        initializeSurvey();
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
    // Login stays stable, container revealed via clip-path mask
    // ========================================

    // Shadow padding: 10% extra on each side = 120% total visible area
    var shadowPadding = Math.max(finalWidth, finalHeight) * 0.1;

    // Calculate button Y position relative to container
    var buttonCenterY = originRect.top + originRect.height / 2 - finalTop;

    // Initial clip: full width (with shadow padding), but only 10% height centered at button
    var initialVisibleHeight = finalHeight * 0.1;
    var clipTop = Math.max(0, buttonCenterY - initialVisibleHeight / 2);
    var clipBottom = Math.max(0, finalHeight - (buttonCenterY + initialVisibleHeight / 2));

    // Show survey as fixed overlay
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

    // Position container at FINAL position and size (no scaling)
    container.style.position = 'fixed';
    container.style.left = finalLeft + 'px';
    container.style.top = finalTop + 'px';
    container.style.width = finalWidth + 'px';
    container.style.height = finalHeight + 'px';
    container.style.zIndex = '1000';
    container.classList.add('container-transform-active');

    // Hide sidebar highlighter initially (will fade in at end of transition)
    var highlighter = container.querySelector('.mobile-highlighter');
    if (highlighter) {
      highlighter.style.opacity = '0';
    }

    // Scale content from 50% to 100% - originates from left (sidebar) side
    var containerChildren = container.children;
    for (var i = 0; i < containerChildren.length; i++) {
      containerChildren[i].style.transform = 'scale(0.5)';
      containerChildren[i].style.transformOrigin = 'left center';
    }

    // Sidebar needs to be on top of main content and have a fill to mask it
    var sidebar = container.querySelector('.index');
    if (sidebar) {
      sidebar.style.position = 'relative';
      sidebar.style.zIndex = '10';
      sidebar.style.backgroundColor = 'var(--cream, #fffbf7)'; // Temporary fill to cover content
    }

    // Main content slides out from under sidebar (translateX -100% to 0)
    var mainContent = container.querySelector('.content');
    if (mainContent) {
      mainContent.style.transform = 'scale(0.5) translateX(-100%)';
      mainContent.style.transformOrigin = 'left center';
      mainContent.style.position = 'relative';
      mainContent.style.zIndex = '5';
    }

    // Start: full width (120%), 10% height centered at button
    container.style.clipPath = 'inset(' + clipTop + 'px ' + (-shadowPadding) + 'px ' + clipBottom + 'px ' + (-shadowPadding) + 'px round 12px)';

    // Force reflow before animation
    void container.offsetWidth;

    // Transition 120% longer (600ms) - mainly height expansion
    var expandDuration = TRANSFORM_DURATION * 1.2;
    container.style.transition = 'clip-path ' + expandDuration + 'ms ease-out';
    container.style.clipPath = 'inset(' + (-shadowPadding) + 'px)';

    // Animate content scale from 50% to 100%
    for (var j = 0; j < containerChildren.length; j++) {
      containerChildren[j].style.transition = 'transform ' + expandDuration + 'ms ease-out';
      containerChildren[j].style.transform = 'scale(1)';
    }

    // Main content also slides from under sidebar
    if (mainContent) {
      mainContent.style.transition = 'transform ' + expandDuration + 'ms ease-out';
      mainContent.style.transform = 'scale(1) translateX(0)';
    }

    // Fade in highlighter after clip-path animation + short delay
    setTimeout(function() {
      if (highlighter) {
        highlighter.style.transition = 'opacity 200ms linear';
        highlighter.style.opacity = '1';
        // After fade-in completes, restore full transition set so highlighter can travel between items
        setTimeout(function() {
          highlighter.style.transition = '';
        }, 200);
      }
    }, expandDuration + 200);

    // ========================================
    // PHASE 3: CLEANUP
    // After expansion, fade login, then settle into normal flow
    // ========================================
    setTimeout(function() {
      // Fade out login
      elements.loginView.style.transition = 'opacity 200ms linear';
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

        // Remove fixed positioning and clip-path from container
        container.style.position = '';
        container.style.left = '';
        container.style.top = '';
        container.style.width = '';
        container.style.height = '';
        container.style.transition = '';
        container.style.clipPath = '';
        container.style.zIndex = '';
        container.classList.remove('container-transform-active');

        // Reset highlighter styles
        if (highlighter) {
          highlighter.style.opacity = '';
          highlighter.style.transition = '';
        }

        // Reset content transform styles
        for (var k = 0; k < containerChildren.length; k++) {
          containerChildren[k].style.transform = '';
          containerChildren[k].style.transformOrigin = '';
          containerChildren[k].style.transition = '';
        }

        // Reset sidebar temporary styles
        if (sidebar) {
          sidebar.style.position = '';
          sidebar.style.zIndex = '';
          sidebar.style.backgroundColor = '';
        }

        // Reset main content z-index
        if (mainContent) {
          mainContent.style.position = '';
          mainContent.style.zIndex = '';
        }

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
      }, 200); // Login fade duration
    }, expandDuration);
  }

  /**
   * Transition from survey to login view
   * Login is already underneath, survey fades out to reveal it
   */
  function transitionToLogin() {
    var FADE_DURATION = 500;
    var MOBILE_BREAKPOINT = 768;
    var isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    // Reset login button from any lingering loading state
    var loginBtn = document.getElementById('loginBtn');
    var btnText = loginBtn && loginBtn.querySelector('.btn-text');
    var btnLoading = loginBtn && loginBtn.querySelector('.btn-loading');
    var btnLoadingText = loginBtn && loginBtn.querySelector('.btn-loading-text');
    var retryProgress = document.getElementById('retryProgress');
    if (loginBtn && btnText && btnLoading) {
      loginBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
    if (btnLoadingText) btnLoadingText.textContent = 'Controleren...';
    if (retryProgress) retryProgress.style.display = 'none';

    // On mobile, skip animation - just switch views instantly
    if (isMobile) {
      document.body.classList.remove('survey-body');
      elements.surveyView.style.display = 'none';
      elements.surveyView.classList.remove('view-active');
      elements.loginView.style.display = '';
      elements.loginView.classList.add('view-active');
      currentView = 'login';
      document.title = 'Inloggen - Monitoring Cultureel Talent naar de Top 2025';
      return;
    }

    // Make survey fixed so it floats above everything during fade
    var surveyContainer = elements.surveyView.querySelector('.container');
    if (surveyContainer) {
      var rect = surveyContainer.getBoundingClientRect();
      surveyContainer.style.position = 'fixed';
      surveyContainer.style.top = rect.top + 'px';
      surveyContainer.style.left = rect.left + 'px';
      surveyContainer.style.width = rect.width + 'px';
      surveyContainer.style.height = rect.height + 'px';
      surveyContainer.style.margin = '0';
      surveyContainer.style.zIndex = '100';
    }

    // Remove survey-body class and show login UNDERNEATH (starts at opacity 0)
    document.body.classList.remove('survey-body');
    elements.loginView.style.display = '';

    // Force reflow so browser registers the element at opacity 0
    void elements.loginView.offsetWidth;

    // Set transition to match survey fade-out, then trigger fade-in
    // This creates a crossfade: login fades in while survey fades out
    elements.loginView.style.transition = 'opacity ' + FADE_DURATION + 'ms linear';
    elements.loginView.classList.add('view-active');

    // Fade OUT survey container (reveals login underneath)
    if (surveyContainer) {
      surveyContainer.style.transition = 'opacity ' + FADE_DURATION + 'ms linear';
      surveyContainer.style.opacity = '0';
    }

    // After fade: cleanup
    setTimeout(function() {
      // Hide survey completely
      elements.surveyView.style.display = 'none';
      elements.surveyView.classList.remove('view-active');

      // Reset survey container styles
      if (surveyContainer) {
        surveyContainer.style.position = '';
        surveyContainer.style.top = '';
        surveyContainer.style.left = '';
        surveyContainer.style.width = '';
        surveyContainer.style.height = '';
        surveyContainer.style.margin = '';
        surveyContainer.style.zIndex = '';
        surveyContainer.style.opacity = '';
        surveyContainer.style.transition = '';
      }

      // Reset login's inline transition (return to CSS default for future use)
      elements.loginView.style.transition = '';

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
