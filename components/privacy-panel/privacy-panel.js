/**
 * Privacy Panel - Hover Popover Component
 *
 * A compact door that expands into a card with hover-based popovers.
 * Mouse-driven interaction with safe zones and blur effects.
 *
 * Features:
 * - Door opens to reveal "kamer" (room) on click
 * - Hover triggers open popovers with information
 * - Blur effect on main content when popover is active
 * - Safe zones prevent accidental closing
 * - Clone trigger for inline links stays visible
 * - Escape key closes everything
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

    // Elements
    var door = panel.querySelector('.pp-door');
    var kamer = panel.querySelector('.pp-kamer');
    var triggers = panel.querySelectorAll('.pp-trigger-inline[data-pop]');
    var popovers = panel.querySelectorAll('.pp-popover');
    var triggerClone = panel.querySelector('.pp-trigger-clone');
    var popoverSafezone = panel.querySelector('.pp-popover-safezone');
    var backdrop = panel.querySelector('.pp-popover-backdrop');
    var triggerArea = panel.querySelector('.pp-trigger-area');

    // Find inline trigger (in kamer-content, not trigger-area)
    var inlineTrigger = panel.querySelector('.pp-kamer-content .pp-trigger-inline[data-pop]');

    // Timers
    var closeTimeout = null;
    var popoverCloseTimeout = null;

    // State
    var activePopover = null;

    /**
     * Close all popovers and reset state
     */
    function closeAllPopovers() {
      popovers.forEach(function(p) {
        p.classList.remove('is-open', 'arrow-left');
      });
      triggers.forEach(function(t) {
        t.classList.remove('is-active');
      });
      activePopover = null;
    }

    /**
     * Hide the trigger clone
     */
    function hideClone() {
      if (triggerClone) {
        triggerClone.classList.remove('is-visible');
      }
    }

    /**
     * Close everything - popovers and kamer
     */
    function closeEverything() {
      closeAllPopovers();
      if (kamer) {
        kamer.classList.remove('has-popover');
      }
      hideClone();
      if (backdrop) {
        backdrop.classList.remove('is-visible');
      }
      if (popoverSafezone) {
        popoverSafezone.classList.remove('is-visible');
      }
    }

    /**
     * Show clone of inline trigger at its position
     */
    function showClone() {
      if (!inlineTrigger || !triggerClone) return;

      var rect = inlineTrigger.getBoundingClientRect();
      triggerClone.style.left = rect.left + 'px';
      triggerClone.style.top = rect.top + 'px';
      triggerClone.style.width = rect.width + 'px';
      triggerClone.style.height = rect.height + 'px';
      triggerClone.classList.add('is-visible');
    }

    /**
     * Position the safe zone around a popover
     */
    function positionSafezone(pop) {
      if (!popoverSafezone) return;

      var rect = pop.getBoundingClientRect();
      var margin = 20;
      popoverSafezone.style.left = (rect.left - margin) + 'px';
      popoverSafezone.style.top = (rect.top - margin) + 'px';
      popoverSafezone.style.width = (rect.width + margin * 2) + 'px';
      popoverSafezone.style.height = (rect.height + margin * 2) + 'px';
      popoverSafezone.classList.add('is-visible');
    }

    /**
     * Position popover relative to trigger
     */
    function positionPopover(trigger, pop) {
      var rect = trigger.getBoundingClientRect();
      var isInlineLink = trigger.closest('.pp-kamer-content') !== null;

      // Temporarily show to measure
      pop.style.visibility = 'hidden';
      pop.style.display = 'block';
      var popHeight = pop.offsetHeight;
      var popWidth = 360;
      pop.style.display = '';
      pop.style.visibility = '';

      var left, top;

      if (isInlineLink) {
        // Position to the right of inline link, vertically centered
        left = rect.right + 16;
        top = rect.top + (rect.height / 2) - (popHeight / 2);
        pop.classList.add('arrow-left');
      } else {
        // Position above trigger link, offset to the left
        left = rect.left - 180;
        top = rect.top - popHeight - 12;
        pop.classList.remove('arrow-left');
      }

      // Viewport bounds
      if (left + popWidth > window.innerWidth - 16) {
        left = window.innerWidth - popWidth - 16;
      }
      if (left < 16) left = 16;
      if (top < 16) top = 16;

      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    }

    /**
     * Start timer to close everything (kamer + popovers)
     */
    function startCloseTimer() {
      closeTimeout = setTimeout(function() {
        closeEverything();
        if (kamer) {
          kamer.classList.remove('is-open');
        }
        if (door) {
          door.classList.remove('is-open');
        }
      }, 150);
    }

    /**
     * Cancel the close timer
     */
    function cancelCloseTimer() {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    }

    /**
     * Start timer to close just popovers
     */
    function startPopoverCloseTimer() {
      popoverCloseTimeout = setTimeout(function() {
        closeAllPopovers();
        if (kamer) {
          kamer.classList.remove('has-popover');
        }
        hideClone();
        if (popoverSafezone) {
          popoverSafezone.classList.remove('is-visible');
        }
      }, 100);
    }

    /**
     * Cancel popover close timer
     */
    function cancelPopoverCloseTimer() {
      if (popoverCloseTimeout) {
        clearTimeout(popoverCloseTimeout);
        popoverCloseTimeout = null;
      }
    }

    /**
     * Open a popover for a trigger
     */
    function openPopover(trigger) {
      var popId = 'pp-pop-' + trigger.dataset.pop;
      var pop = panel.querySelector('#' + popId);
      if (!pop) return;

      closeAllPopovers();
      if (popoverSafezone) {
        popoverSafezone.classList.remove('is-visible');
      }

      trigger.classList.add('is-active');
      if (kamer) {
        kamer.classList.add('has-popover');
      }
      if (backdrop) {
        backdrop.classList.add('is-visible');
      }

      requestAnimationFrame(function() {
        showClone();
        positionPopover(trigger, pop);
        pop.classList.add('is-open');
        activePopover = pop;

        // Position safezone after popover is visible
        requestAnimationFrame(function() {
          positionSafezone(pop);
        });
      });
    }

    // Door click handler
    if (door) {
      door.addEventListener('click', function() {
        door.classList.add('is-open');
        if (kamer) {
          kamer.classList.add('is-open');
        }
      });
    }

    // Backdrop click handler
    if (backdrop) {
      backdrop.addEventListener('click', function() {
        closeEverything();
      });
    }

    // Kamer mouse handlers
    if (kamer) {
      kamer.addEventListener('mouseenter', cancelCloseTimer);
      kamer.addEventListener('mouseleave', startCloseTimer);
    }

    // Safe zone handlers for popovers and related elements
    var popoverSafeZones = [triggerClone, popoverSafezone].filter(Boolean);
    popovers.forEach(function(p) {
      popoverSafeZones.push(p);
    });

    popoverSafeZones.forEach(function(zone) {
      if (!zone) return;
      zone.addEventListener('mouseenter', function() {
        cancelCloseTimer();
        cancelPopoverCloseTimer();
      });
      zone.addEventListener('mouseleave', startPopoverCloseTimer);
    });

    // Trigger area handlers
    if (triggerArea) {
      triggerArea.addEventListener('mouseenter', function() {
        cancelCloseTimer();
        cancelPopoverCloseTimer();
      });
      triggerArea.addEventListener('mouseleave', function(e) {
        var toElement = e.relatedTarget;
        if (toElement && (toElement.closest('.pp-popover') || toElement.closest('.pp-popover-safezone'))) {
          return;
        }
        startPopoverCloseTimer();
      });
    }

    // Trigger hover handlers
    triggers.forEach(function(trigger) {
      trigger.addEventListener('mouseenter', function() {
        openPopover(trigger);
      });
    });

    // Clone hover handler
    if (triggerClone && inlineTrigger) {
      triggerClone.addEventListener('mouseenter', function() {
        openPopover(inlineTrigger);
      });
    }

    // Escape key handler
    function handleKeydown(e) {
      if (e.key === 'Escape') {
        closeEverything();
      }
    }
    document.addEventListener('keydown', handleKeydown);

    // Mark as initialized
    panel.dataset.privacyPanelInitialized = 'true';

    return {
      open: function() {
        if (door) {
          door.classList.add('is-open');
        }
        if (kamer) {
          kamer.classList.add('is-open');
        }
      },
      close: function() {
        closeEverything();
        if (kamer) {
          kamer.classList.remove('is-open');
        }
        if (door) {
          door.classList.remove('is-open');
        }
      },
      isOpen: function() {
        return kamer && kamer.classList.contains('is-open');
      },
      getActivePopover: function() {
        return activePopover ? activePopover.id : null;
      },
      destroy: function() {
        document.removeEventListener('keydown', handleKeydown);
        closeEverything();
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
      PrivacyPanel.init();
    }
  }

  return PrivacyPanel;
}));
