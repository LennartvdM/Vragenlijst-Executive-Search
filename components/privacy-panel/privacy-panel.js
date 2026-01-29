/**
 * Privacy Panel - Overlay Popover Component
 *
 * A compact door that expands into a centered overlay with blur backdrop.
 * Mouse-driven interaction with safe zones and popover tooltips.
 *
 * Features:
 * - Single blur layer switches z-index: behind kamer (page blur) or above kamer (card blur)
 * - Hover triggers open popovers with information
 * - Safe zones prevent accidental closing
 * - Clone trigger for inline links stays visible
 * - Escape key or backdrop click closes overlay
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
    var triggerArea = panel.querySelector('.pp-trigger-area');

    // Find inline trigger (in kamer-content, not trigger-area)
    var inlineTrigger = panel.querySelector('.pp-kamer-content .pp-trigger-inline[data-pop]');

    // Create overlay container
    var overlayContainer = document.createElement('div');
    overlayContainer.className = 'pp-overlay-container';

    var overlayBackdrop = document.createElement('div');
    overlayBackdrop.className = 'pp-overlay-backdrop';
    overlayContainer.appendChild(overlayBackdrop);

    // Create single blur layer (switches z-index)
    var blurLayer = document.createElement('div');
    blurLayer.className = 'pp-blur-layer';
    overlayContainer.appendChild(blurLayer);

    // Move kamer into overlay (if it exists)
    if (kamer) {
      overlayContainer.appendChild(kamer);
    }

    // Move popovers into overlay
    popovers.forEach(function(p) {
      overlayContainer.appendChild(p);
    });

    // Move trigger clone and safezone into overlay
    if (triggerClone) {
      overlayContainer.appendChild(triggerClone);
    }
    if (popoverSafezone) {
      overlayContainer.appendChild(popoverSafezone);
    }

    // Create clone of trigger-area (appended last so it sits above everything)
    var triggerAreaClone = null;
    var triggerAreaTriggers = triggerArea ? triggerArea.querySelectorAll('.pp-trigger-inline[data-pop]') : [];
    if (triggerArea) {
      triggerAreaClone = document.createElement('div');
      triggerAreaClone.className = 'pp-trigger-area-clone';
      triggerAreaClone.innerHTML = triggerArea.innerHTML;
      overlayContainer.appendChild(triggerAreaClone);
    }

    // Add overlay to body
    document.body.appendChild(overlayContainer);

    // Timers
    var popoverCloseTimeout = null;

    // State
    var activePopover = null;
    var isOpen = false;

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
      // Sync active state to trigger-area clone
      if (triggerAreaClone) {
        triggerAreaClone.querySelectorAll('.pp-trigger-inline').forEach(function(t) {
          t.classList.remove('is-active');
        });
      }
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
     * Close everything - popovers and overlay
     */
    function closeEverything() {
      closeAllPopovers();
      if (kamer) {
        kamer.classList.remove('has-popover');
      }
      hideClone();
      hideTriggerAreaClone();
      if (popoverSafezone) {
        popoverSafezone.classList.remove('is-visible');
      }

      // Deactivate blur layer
      blurLayer.classList.remove('is-active', 'above-kamer');

      // Close overlay
      overlayContainer.classList.remove('is-open');
      document.body.classList.remove('pp-blur-active');
      isOpen = false;
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
     * Show the trigger-area clone positioned over the original
     */
    function showTriggerAreaClone() {
      if (!triggerAreaClone || !triggerArea) return;

      var rect = triggerArea.getBoundingClientRect();
      triggerAreaClone.style.left = rect.left + 'px';
      triggerAreaClone.style.top = rect.top + 'px';
      triggerAreaClone.style.width = rect.width + 'px';
      triggerAreaClone.classList.add('is-visible');
    }

    /**
     * Hide the trigger-area clone
     */
    function hideTriggerAreaClone() {
      if (triggerAreaClone) {
        triggerAreaClone.classList.remove('is-visible');
      }
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
     * Start timer to close just popovers
     */
    function startPopoverCloseTimer() {
      popoverCloseTimeout = setTimeout(function() {
        closeAllPopovers();
        if (kamer) {
          kamer.classList.remove('has-popover');
        }
        // Drop blur layer back behind kamer
        blurLayer.classList.remove('above-kamer');
        hideClone();
        hideTriggerAreaClone();
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
      var pop = overlayContainer.querySelector('#' + popId);
      if (!pop) return;

      closeAllPopovers();
      if (popoverSafezone) {
        popoverSafezone.classList.remove('is-visible');
      }

      trigger.classList.add('is-active');
      // Sync active state to matching clone trigger
      if (triggerAreaClone) {
        var cloneMatch = triggerAreaClone.querySelector('.pp-trigger-inline[data-pop="' + trigger.dataset.pop + '"]');
        if (cloneMatch) cloneMatch.classList.add('is-active');
      }
      if (kamer) {
        kamer.classList.add('has-popover');
      }
      // Raise blur layer above kamer
      blurLayer.classList.add('above-kamer');

      requestAnimationFrame(function() {
        // Always show trigger-area clone above blur
        showTriggerAreaClone();
        // Only show localStorage clone for voortgang popover
        if (trigger.dataset.pop === 'voortgang') {
          showClone();
        } else {
          hideClone();
        }
        positionPopover(trigger, pop);
        pop.classList.add('is-open');
        activePopover = pop;

        // Position safezone after popover is visible
        requestAnimationFrame(function() {
          positionSafezone(pop);
        });
      });
    }

    /**
     * Open the overlay
     */
    function openOverlay() {
      overlayContainer.classList.add('is-open');
      document.body.classList.add('pp-blur-active');
      blurLayer.classList.add('is-active');
      isOpen = true;
    }

    // Door press handler (mousedown, not click)
    if (door) {
      door.addEventListener('mousedown', function() {
        openOverlay();
      });
    }

    // Backdrop press handler - close overlay (mousedown, not click)
    overlayBackdrop.addEventListener('mousedown', function() {
      closeEverything();
    });

    // Safe zone handlers for popovers and related elements
    var popoverSafeZones = [triggerClone, popoverSafezone].filter(Boolean);
    popovers.forEach(function(p) {
      popoverSafeZones.push(p);
    });

    popoverSafeZones.forEach(function(zone) {
      if (!zone) return;
      zone.addEventListener('mouseenter', function() {
        cancelPopoverCloseTimer();
      });
      zone.addEventListener('mouseleave', startPopoverCloseTimer);
    });

    // Trigger area handlers
    if (triggerArea) {
      triggerArea.addEventListener('mouseenter', function() {
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

    // Clone hover handler (localStorage)
    if (triggerClone && inlineTrigger) {
      triggerClone.addEventListener('mouseenter', function() {
        openPopover(inlineTrigger);
      });
    }

    // Trigger-area clone hover handlers
    if (triggerAreaClone) {
      // Map clone triggers to original triggers by data-pop
      var cloneTriggers = triggerAreaClone.querySelectorAll('.pp-trigger-inline[data-pop]');
      cloneTriggers.forEach(function(cloneTrigger) {
        var popName = cloneTrigger.dataset.pop;
        // Find the matching original trigger in trigger-area
        var originalTrigger = triggerArea.querySelector('.pp-trigger-inline[data-pop="' + popName + '"]');
        if (originalTrigger) {
          cloneTrigger.addEventListener('mouseenter', function() {
            openPopover(originalTrigger);
          });
        }
      });

      // Safe zone: keep popover open when hovering the clone
      triggerAreaClone.addEventListener('mouseenter', function() {
        cancelPopoverCloseTimer();
      });
      triggerAreaClone.addEventListener('mouseleave', function(e) {
        var toElement = e.relatedTarget;
        if (toElement && (toElement.closest('.pp-popover') || toElement.closest('.pp-popover-safezone'))) {
          return;
        }
        startPopoverCloseTimer();
      });
    }

    // Escape key handler
    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen) {
        closeEverything();
      }
    }
    document.addEventListener('keydown', handleKeydown);

    // Mark as initialized
    panel.dataset.privacyPanelInitialized = 'true';

    return {
      open: function() {
        openOverlay();
      },
      close: function() {
        closeEverything();
      },
      isOpen: function() {
        return isOpen;
      },
      getActivePopover: function() {
        return activePopover ? activePopover.id : null;
      },
      destroy: function() {
        document.removeEventListener('keydown', handleKeydown);
        closeEverything();
        // Move elements back and remove overlay
        if (kamer) {
          panel.appendChild(kamer);
        }
        popovers.forEach(function(p) {
          panel.appendChild(p);
        });
        if (triggerClone) {
          panel.appendChild(triggerClone);
        }
        if (popoverSafezone) {
          panel.appendChild(popoverSafezone);
        }
        overlayContainer.remove();
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
