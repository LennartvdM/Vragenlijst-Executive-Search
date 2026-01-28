/**
 * Privacy Panel - Expandable Overlay Component
 *
 * A compact privacy disclosure that expands into larger overlay panels.
 * Navigation between rooms replaces content (no stacking required).
 *
 * Features:
 * - Single overlay at a time (new room replaces previous)
 * - Expand animation towards center
 * - Close button returns to door
 * - Escape key closes overlay
 * - No external dependencies
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PrivacyPanel = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function initPanel(panel) {
    if (!panel || panel.dataset.privacyPanelInitialized) {
      return null;
    }

    var trigger = panel.querySelector('.pp-trigger');
    var rooms = panel.querySelectorAll('.pp-room');
    var navLinks = panel.querySelectorAll('.pp-nav-link[data-open]');
    var closeButtons = panel.querySelectorAll('.pp-close[data-close]');

    // State: single active room (no stacking)
    var activeRoom = null;

    /**
     * Open a room (closes any currently open room first)
     */
    function openRoom(roomId) {
      var room = panel.querySelector('.pp-room[data-panel="' + roomId + '"]');
      if (!room) return;

      // Close current room if different
      if (activeRoom && activeRoom !== roomId) {
        var currentRoom = panel.querySelector('.pp-room[data-panel="' + activeRoom + '"]');
        if (currentRoom) {
          currentRoom.classList.remove('is-open');
          currentRoom.removeAttribute('tabindex');
        }
      }

      // Open new room
      activeRoom = roomId;
      room.classList.add('is-open');
      panel.classList.add('has-open');

      // Focus for accessibility
      room.setAttribute('tabindex', '-1');
      room.focus({ preventScroll: true });
    }

    /**
     * Close all rooms (return to door)
     */
    function closeAll() {
      if (!activeRoom) return;

      var room = panel.querySelector('.pp-room[data-panel="' + activeRoom + '"]');
      if (room) {
        room.classList.remove('is-open');
        room.removeAttribute('tabindex');
      }

      activeRoom = null;
      panel.classList.remove('has-open');

      // Return focus to trigger
      if (trigger) {
        trigger.focus({ preventScroll: true });
      }
    }

    function handleTriggerClick(event) {
      event.preventDefault();
      var targetRoom = event.currentTarget.dataset.open;
      if (targetRoom) {
        openRoom(targetRoom);
      }
    }

    function handleNavLinkClick(event) {
      event.preventDefault();
      var targetRoom = event.currentTarget.dataset.open;
      if (targetRoom) {
        openRoom(targetRoom);
      }
    }

    function handleCloseClick(event) {
      event.preventDefault();
      closeAll();
    }

    function handleKeydown(event) {
      if (event.key === 'Escape' && activeRoom) {
        event.preventDefault();
        closeAll();
      }
    }

    // Event listeners
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

    panel.dataset.privacyPanelInitialized = 'true';

    return {
      open: function(roomId) { openRoom(roomId); },
      close: function() { closeAll(); },
      getActiveRoom: function() { return activeRoom; },
      isOpen: function() { return activeRoom !== null; },
      destroy: function() {
        if (trigger) trigger.removeEventListener('click', handleTriggerClick);
        navLinks.forEach(function(link) {
          link.removeEventListener('click', handleNavLinkClick);
        });
        closeButtons.forEach(function(btn) {
          btn.removeEventListener('click', handleCloseClick);
        });
        panel.removeEventListener('keydown', handleKeydown);
        closeAll();
        delete panel.dataset.privacyPanelInitialized;
      }
    };
  }

  var PrivacyPanel = {
    instances: [],

    init: function(selector) {
      var panels;
      if (!selector) {
        panels = document.querySelectorAll('.privacy-panel');
      } else if (typeof selector === 'string') {
        panels = document.querySelectorAll(selector);
      } else if (selector instanceof HTMLElement) {
        panels = [selector];
      } else if (selector instanceof NodeList || Array.isArray(selector)) {
        panels = selector;
      } else {
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
      return controllers.length === 1 ? controllers[0] : controllers;
    },

    destroyAll: function() {
      this.instances.forEach(function(instance) { instance.destroy(); });
      this.instances = [];
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { PrivacyPanel.init(); });
    } else {
      PrivacyPanel.init();
    }
  }

  return PrivacyPanel;
}));
