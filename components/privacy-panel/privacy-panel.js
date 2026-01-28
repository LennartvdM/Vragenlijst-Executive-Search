/**
 * Privacy Panel - Stacked Overlay Component
 *
 * A compact privacy disclosure with layered panels that stack
 * like Excel sheets - each room overlays the previous one.
 *
 * Features:
 * - Stacked overlay panels with smooth animations
 * - Room-to-room navigation via trigger buttons
 * - Close buttons to dismiss panels and reveal the one beneath
 * - No external dependencies
 *
 * Usage:
 *   Option 1: Auto-initialization (default)
 *     Just include the script - it will find all .privacy-panel elements
 *
 *   Option 2: Manual initialization
 *     PrivacyPanel.init()                    // Initialize all panels
 *     PrivacyPanel.init('#myPanel')          // Initialize specific panel
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
   * @returns {Object} - Controller object with methods
   */
  function initPanel(panel) {
    if (!panel || panel.dataset.privacyPanelInitialized) {
      return null;
    }

    // Elements
    var door = panel.querySelector('.pp-door');
    var trigger = panel.querySelector('.pp-trigger');
    var rooms = panel.querySelectorAll('.pp-room');
    var navLinks = panel.querySelectorAll('.pp-nav-link[data-open]');
    var closeButtons = panel.querySelectorAll('.pp-close[data-close]');

    // State: track which rooms are open (as a stack)
    var openRooms = [];

    /**
     * Open a specific room panel
     */
    function openRoom(roomId) {
      var room = panel.querySelector('.pp-room[data-panel="' + roomId + '"]');
      if (!room) return;

      // Add to stack if not already open
      if (openRooms.indexOf(roomId) === -1) {
        openRooms.push(roomId);
      }

      // Add open class
      room.classList.add('is-open');

      // Update container state
      updateContainerState();

      // Focus the room for accessibility
      room.setAttribute('tabindex', '-1');
      room.focus({ preventScroll: true });
    }

    /**
     * Close the topmost room panel
     */
    function closeTopRoom() {
      if (openRooms.length === 0) return;

      var roomId = openRooms.pop();
      var room = panel.querySelector('.pp-room[data-panel="' + roomId + '"]');

      if (room) {
        room.classList.remove('is-open');
        room.removeAttribute('tabindex');
      }

      // Update container state
      updateContainerState();

      // Focus the next room or door
      if (openRooms.length > 0) {
        var prevRoomId = openRooms[openRooms.length - 1];
        var prevRoom = panel.querySelector('.pp-room[data-panel="' + prevRoomId + '"]');
        if (prevRoom) {
          prevRoom.focus({ preventScroll: true });
        }
      } else if (trigger) {
        trigger.focus({ preventScroll: true });
      }
    }

    /**
     * Close a specific room and all rooms above it
     */
    function closeRoom(roomId) {
      var roomIndex = openRooms.indexOf(roomId);
      if (roomIndex === -1) return;

      // Close this room and all rooms above it
      var roomsToClose = openRooms.splice(roomIndex);
      roomsToClose.forEach(function(id) {
        var room = panel.querySelector('.pp-room[data-panel="' + id + '"]');
        if (room) {
          room.classList.remove('is-open');
          room.removeAttribute('tabindex');
        }
      });

      updateContainerState();
    }

    /**
     * Close all rooms
     */
    function closeAll() {
      openRooms.forEach(function(roomId) {
        var room = panel.querySelector('.pp-room[data-panel="' + roomId + '"]');
        if (room) {
          room.classList.remove('is-open');
          room.removeAttribute('tabindex');
        }
      });
      openRooms = [];
      updateContainerState();
    }

    /**
     * Update container class based on open state
     */
    function updateContainerState() {
      if (openRooms.length > 0) {
        panel.classList.add('has-open');
      } else {
        panel.classList.remove('has-open');
      }
    }

    /**
     * Handle trigger button click (door → first room)
     */
    function handleTriggerClick(event) {
      event.preventDefault();
      var targetRoom = event.currentTarget.dataset.open;
      if (targetRoom) {
        openRoom(targetRoom);
      }
    }

    /**
     * Handle navigation link click (room → next room)
     */
    function handleNavLinkClick(event) {
      event.preventDefault();
      var targetRoom = event.currentTarget.dataset.open;
      if (targetRoom) {
        openRoom(targetRoom);
      }
    }

    /**
     * Handle close button click
     */
    function handleCloseClick(event) {
      event.preventDefault();
      closeTopRoom();
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeydown(event) {
      // Escape key closes topmost room
      if (event.key === 'Escape' && openRooms.length > 0) {
        event.preventDefault();
        closeTopRoom();
      }
    }

    // Attach event listeners
    if (trigger) {
      trigger.addEventListener('click', handleTriggerClick);
    }

    navLinks.forEach(function(link) {
      link.addEventListener('click', handleNavLinkClick);
    });

    closeButtons.forEach(function(btn) {
      btn.addEventListener('click', handleCloseClick);
    });

    panel.addEventListener('keydown', handleKeydown);

    // Mark as initialized
    panel.dataset.privacyPanelInitialized = 'true';

    // Return controller object
    return {
      /**
       * Open a room by ID
       */
      open: function(roomId) {
        openRoom(roomId);
      },

      /**
       * Close the topmost room
       */
      close: function() {
        closeTopRoom();
      },

      /**
       * Close all rooms
       */
      closeAll: function() {
        closeAll();
      },

      /**
       * Get list of currently open rooms
       */
      getOpenRooms: function() {
        return openRooms.slice();
      },

      /**
       * Check if a room is open
       */
      isOpen: function(roomId) {
        return openRooms.indexOf(roomId) !== -1;
      },

      /**
       * Clean up the panel instance
       */
      destroy: function() {
        if (trigger) {
          trigger.removeEventListener('click', handleTriggerClick);
        }

        navLinks.forEach(function(link) {
          link.removeEventListener('click', handleNavLinkClick);
        });

        closeButtons.forEach(function(btn) {
          btn.removeEventListener('click', handleCloseClick);
        });

        panel.removeEventListener('keydown', handleKeydown);

        // Reset state
        closeAll();
        delete panel.dataset.privacyPanelInitialized;
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
