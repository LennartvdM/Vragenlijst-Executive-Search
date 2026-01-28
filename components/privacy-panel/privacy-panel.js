/**
 * Privacy Panel - Standalone Component
 *
 * A self-contained privacy disclosure panel with sidebar navigation
 * and scroll synchronization.
 *
 * Features:
 * - Sidebar navigation with smooth scroll to sections
 * - Visual highlighter following active section
 * - IntersectionObserver for scroll-based section detection
 * - No external dependencies
 *
 * Usage:
 *   Option 1: Auto-initialization (default)
 *     Just include the script - it will find all .privacy-panel elements
 *
 *   Option 2: Manual initialization
 *     PrivacyPanel.init()                    // Initialize all panels
 *     PrivacyPanel.init('#myPanel')          // Initialize specific panel
 *     PrivacyPanel.init(document.querySelector('#myPanel'))
 *
 *   Option 3: ES Module
 *     import { PrivacyPanel } from './privacy-panel.js';
 *     PrivacyPanel.init();
 */

(function(root, factory) {
  // UMD pattern: supports AMD, CommonJS, and browser globals
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PrivacyPanel = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  /**
   * Initialize a single privacy panel instance
   * @param {HTMLElement} panel - The .privacy-panel element
   * @returns {Object} - Controller object with destroy method
   */
  function initPanel(panel) {
    if (!panel || panel.dataset.privacyPanelInitialized) {
      return null;
    }

    const highlighter = panel.querySelector('.privacy-highlighter');
    const sidebar = panel.querySelector('.privacy-sidebar');
    const navItems = panel.querySelectorAll('.privacy-nav-item');
    const sections = panel.querySelectorAll('.privacy-section');
    const scrollContainer = panel.querySelector('.privacy-scroll');

    if (!sidebar || !navItems.length || !sections.length) {
      console.warn('PrivacyPanel: Missing required elements', panel);
      return null;
    }

    let initialized = false;
    let observer = null;

    /**
     * Update the highlighter position to match the active nav item
     */
    function updateHighlighter(navItem) {
      if (!navItem || !highlighter || !sidebar) return;

      const sidebarRect = sidebar.getBoundingClientRect();
      const itemRect = navItem.getBoundingClientRect();
      const topPosition = itemRect.top - sidebarRect.top;

      if (!initialized) {
        // First update: no animation
        highlighter.style.transition = 'none';
        highlighter.style.top = topPosition + 'px';
        // Force reflow
        highlighter.offsetHeight;
        highlighter.style.transition = '';
        initialized = true;
      } else {
        highlighter.style.top = topPosition + 'px';
      }

      highlighter.classList.add('active');
    }

    /**
     * Set the active section by ID
     */
    function setActiveSection(sectionId) {
      navItems.forEach(function(item) {
        const isActive = item.dataset.section === sectionId;
        item.classList.toggle('active', isActive);
        if (isActive) {
          updateHighlighter(item);
        }
      });
    }

    /**
     * Handle nav item click - scroll to section
     */
    function handleNavClick(event) {
      const item = event.currentTarget;
      const sectionId = item.dataset.section;
      const section = panel.querySelector('.privacy-section[data-section="' + sectionId + '"]');

      if (section && scrollContainer) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    /**
     * Set up IntersectionObserver for scroll-based section detection
     */
    function setupScrollObserver() {
      if (!scrollContainer || typeof IntersectionObserver === 'undefined') {
        return;
      }

      observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(entry.target.dataset.section);
          }
        });
      }, {
        root: scrollContainer,
        threshold: 0.5
      });

      sections.forEach(function(section) {
        observer.observe(section);
      });
    }

    // Attach click handlers to nav items
    navItems.forEach(function(item) {
      item.addEventListener('click', handleNavClick);
    });

    // Set up scroll observer
    setupScrollObserver();

    // Initialize with the first active item
    var activeItem = panel.querySelector('.privacy-nav-item.active');
    if (activeItem) {
      updateHighlighter(activeItem);
    }

    // Mark as initialized
    panel.dataset.privacyPanelInitialized = 'true';

    // Return controller object
    return {
      /**
       * Clean up the panel instance
       */
      destroy: function() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        navItems.forEach(function(item) {
          item.removeEventListener('click', handleNavClick);
        });

        delete panel.dataset.privacyPanelInitialized;
      },

      /**
       * Programmatically set active section
       */
      setSection: function(sectionId) {
        setActiveSection(sectionId);
        var section = panel.querySelector('.privacy-section[data-section="' + sectionId + '"]');
        if (section && scrollContainer) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },

      /**
       * Get the current active section ID
       */
      getActiveSection: function() {
        var active = panel.querySelector('.privacy-nav-item.active');
        return active ? active.dataset.section : null;
      }
    };
  }

  /**
   * Main PrivacyPanel object
   */
  var PrivacyPanel = {
    instances: [],

    /**
     * Initialize privacy panel(s)
     * @param {string|HTMLElement|NodeList} [selector] - Optional selector, element, or NodeList
     * @returns {Object|Array} - Single controller or array of controllers
     */
    init: function(selector) {
      var panels;

      if (!selector) {
        // No selector: find all panels
        panels = document.querySelectorAll('.privacy-panel');
      } else if (typeof selector === 'string') {
        // String selector
        panels = document.querySelectorAll(selector);
      } else if (selector instanceof HTMLElement) {
        // Single element
        panels = [selector];
      } else if (selector instanceof NodeList || Array.isArray(selector)) {
        // NodeList or Array
        panels = selector;
      } else {
        console.warn('PrivacyPanel.init: Invalid selector', selector);
        return null;
      }

      var controllers = [];

      for (var i = 0; i < panels.length; i++) {
        var controller = initPanel(panels[i]);
        if (controller) {
          controllers.push(controller);
          this.instances.push(controller);
        }
      }

      // Return single controller if only one panel, otherwise array
      return controllers.length === 1 ? controllers[0] : controllers;
    },

    /**
     * Destroy all initialized instances
     */
    destroyAll: function() {
      this.instances.forEach(function(instance) {
        instance.destroy();
      });
      this.instances = [];
    }
  };

  // Auto-initialize on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        PrivacyPanel.init();
      });
    } else {
      // DOM already loaded
      PrivacyPanel.init();
    }
  }

  return PrivacyPanel;
}));
