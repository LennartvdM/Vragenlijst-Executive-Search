/**
 * Privacy Panel - Overlay Popover Component
 *
 * A compact door that expands into a centered overlay with blur backdrop.
 * Desktop: hover-driven interaction with safe zones and popover tooltips.
 * Mobile: tap triggers to toggle popovers, flick down or tap backdrop to close.
 *
 * Features:
 * - Single blur layer switches z-index: behind kamer (page blur) or above kamer (card blur)
 * - Desktop hover / mobile tap triggers open popovers with information
 * - Safe zones prevent accidental closing (desktop)
 * - Clone trigger for inline links stays visible
 * - Escape key or backdrop click/tap closes overlay
 * - Flick-to-dismiss on mobile
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

  /** True on devices with a fine pointer (mouse). Checked once at init time. */
  var hasHover = window.matchMedia('(hover: hover)').matches;

  /** True when hover interaction mode should be used (desktop/tablet only).
   *  On mobile viewports (≤768px), always use touch mode regardless of hasHover,
   *  since some mobile browsers incorrectly report (hover: hover). */
  function useHoverMode() {
    return hasHover && window.innerWidth > 768;
  }

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

    // Move popovers into overlay and inject grab bars for mobile
    popovers.forEach(function(p) {
      overlayContainer.appendChild(p);
      // Add a grab bar at the top as a swipe-down affordance (visible on touch only via CSS)
      var grabBar = document.createElement('div');
      grabBar.className = 'pp-grab-bar';
      grabBar.setAttribute('aria-hidden', 'true');
      grabBar.innerHTML = '<span></span>';
      p.insertBefore(grabBar, p.firstChild);
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
    var activeTrigger = null;
    var isOpen = false;

    // Touch-to-dismiss tracking
    var touchStartY = 0;
    var touchStartX = 0;
    var touchDeltaY = 0;
    var isTouchDragging = false;

    /**
     * Close all popovers and reset state
     */
    function closeAllPopovers() {
      popovers.forEach(function(p) {
        p.classList.remove('is-open', 'arrow-left');
        // Reset any touch-drag inline styles
        p.style.transform = '';
        p.style.opacity = '';
        p.style.transition = '';
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
      activeTrigger = null;
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
      var popWidth = pop.offsetWidth;
      pop.style.display = '';
      pop.style.visibility = '';

      var left, top;

      if (!useHoverMode()) {
        // Mobile: center horizontally, position below trigger
        left = Math.max(16, (window.innerWidth - popWidth) / 2);
        top = rect.bottom + 12;
        // If it would go off-screen bottom, position above
        if (rect.bottom + popHeight > window.innerHeight - 16) {
          top = rect.top - popHeight - 12;
        }
        if (top < 16) top = 16;
        pop.classList.remove('arrow-left');
      } else if (isInlineLink) {
        // Desktop: position to the right of inline link, vertically centered
        left = rect.right + 16;
        top = rect.top + (rect.height / 2) - (popHeight / 2);
        pop.classList.add('arrow-left');
      } else {
        // Desktop: position above trigger link, offset to the left
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
      activeTrigger = trigger;
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
        if (useHoverMode()) {
          // Desktop: show clones above blur
          showTriggerAreaClone();
          if (trigger.dataset.pop === 'voortgang') {
            showClone();
          } else {
            hideClone();
          }
        }
        positionPopover(trigger, pop);
        pop.classList.add('is-open');
        activePopover = pop;

        if (useHoverMode()) {
          // Position safezone after popover is visible (desktop only)
          requestAnimationFrame(function() {
            positionSafezone(pop);
          });
        }
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

    /**
     * Close just the popover (not the overlay), used on mobile
     */
    function closePopover() {
      closeAllPopovers();
      if (kamer) {
        kamer.classList.remove('has-popover');
      }
      blurLayer.classList.remove('above-kamer');
      hideClone();
      hideTriggerAreaClone();
      if (popoverSafezone) {
        popoverSafezone.classList.remove('is-visible');
      }
    }

    // ── Touch: flick-to-dismiss on popovers ──

    function onPopoverTouchStart(e) {
      if (useHoverMode()) return;
      var touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      touchDeltaY = 0;
      isTouchDragging = false;
    }

    function onPopoverTouchMove(e) {
      if (useHoverMode()) return;
      var touch = e.touches[0];
      var dy = touch.clientY - touchStartY;
      var dx = touch.clientX - touchStartX;

      if (!isTouchDragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          isTouchDragging = true;
        } else {
          return;
        }
      }

      touchDeltaY = dy;

      if (dy > 0) {
        e.preventDefault();
        var pop = e.currentTarget;
        var visualDy = dy < 80 ? dy : 80 + (dy - 80) * 0.3;
        pop.style.transform = 'translateY(' + visualDy + 'px)';
        pop.style.opacity = Math.max(0.3, 1 - (dy / 250));
      }
    }

    function onPopoverTouchEnd(e) {
      if (useHoverMode()) return;
      var pop = e.currentTarget;

      if (isTouchDragging && touchDeltaY > 40) {
        pop.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        pop.style.transform = 'translateY(120px)';
        pop.style.opacity = '0';
        setTimeout(function() {
          closePopover();
          pop.style.transition = '';
          pop.style.transform = '';
          pop.style.opacity = '';
        }, 200);
      } else {
        pop.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        pop.style.transform = '';
        pop.style.opacity = '';
        setTimeout(function() {
          pop.style.transition = '';
        }, 250);
      }

      isTouchDragging = false;
      touchDeltaY = 0;
    }

    // ── Door handler ──
    if (door) {
      // Desktop: mousedown for immediate response
      door.addEventListener('mousedown', function() {
        if (useHoverMode()) openOverlay();
      });
      // Mobile: click/tap
      door.addEventListener('click', function() {
        if (!useHoverMode()) openOverlay();
      });
    }

    // ── Backdrop handler ──
    // Desktop: mousedown
    overlayBackdrop.addEventListener('mousedown', function() {
      if (useHoverMode()) closeEverything();
    });
    // Mobile: click/tap
    overlayBackdrop.addEventListener('click', function() {
      if (!useHoverMode()) closeEverything();
    });

    // ── Blur layer handler (mobile: tap to close popover) ──
    blurLayer.addEventListener('click', function() {
      if (!useHoverMode() && activePopover) {
        closePopover();
      }
    });

    // ── Safe zone handlers (desktop hover only) ──
    var popoverSafeZones = [triggerClone, popoverSafezone].filter(Boolean);
    popovers.forEach(function(p) {
      popoverSafeZones.push(p);
    });

    popoverSafeZones.forEach(function(zone) {
      if (!zone) return;
      zone.addEventListener('mouseenter', function() {
        if (useHoverMode()) cancelPopoverCloseTimer();
      });
      zone.addEventListener('mouseleave', function() {
        if (useHoverMode()) startPopoverCloseTimer();
      });
    });

    // ── Touch: flick-to-dismiss on each popover ──
    popovers.forEach(function(p) {
      p.addEventListener('touchstart', onPopoverTouchStart, { passive: true });
      p.addEventListener('touchmove', onPopoverTouchMove, { passive: false });
      p.addEventListener('touchend', onPopoverTouchEnd, { passive: true });
    });

    // ── Trigger area handlers (desktop hover only) ──
    if (triggerArea) {
      triggerArea.addEventListener('mouseenter', function() {
        if (useHoverMode()) cancelPopoverCloseTimer();
      });
      triggerArea.addEventListener('mouseleave', function(e) {
        if (!useHoverMode()) return;
        var toElement = e.relatedTarget;
        if (toElement && (toElement.closest('.pp-popover') || toElement.closest('.pp-popover-safezone'))) {
          return;
        }
        startPopoverCloseTimer();
      });
    }

    // ── Trigger handlers ──
    triggers.forEach(function(trigger) {
      // Desktop: hover to open
      trigger.addEventListener('mouseenter', function() {
        if (useHoverMode()) openPopover(trigger);
      });

      // Mobile: tap to toggle
      trigger.addEventListener('click', function(e) {
        if (useHoverMode()) return;
        e.preventDefault();
        e.stopPropagation();
        if (activePopover && activeTrigger === trigger) {
          closePopover();
        } else {
          openPopover(trigger);
        }
      });
    });

    // ── Clone hover handler (localStorage, desktop only) ──
    if (triggerClone && inlineTrigger) {
      triggerClone.addEventListener('mouseenter', function() {
        if (useHoverMode()) openPopover(inlineTrigger);
      });
    }

    // ── Trigger-area clone handlers ──
    if (triggerAreaClone) {
      var cloneTriggers = triggerAreaClone.querySelectorAll('.pp-trigger-inline[data-pop]');
      cloneTriggers.forEach(function(cloneTrigger) {
        var popName = cloneTrigger.dataset.pop;
        var originalTrigger = triggerArea.querySelector('.pp-trigger-inline[data-pop="' + popName + '"]');
        if (originalTrigger) {
          // Desktop: hover
          cloneTrigger.addEventListener('mouseenter', function() {
            if (useHoverMode()) openPopover(originalTrigger);
          });
        }
      });

      // Desktop: safe zone on clone
      triggerAreaClone.addEventListener('mouseenter', function() {
        if (useHoverMode()) cancelPopoverCloseTimer();
      });
      triggerAreaClone.addEventListener('mouseleave', function(e) {
        if (!useHoverMode()) return;
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

    // Populate contact email (obfuscated to prevent scraping)
    var rechtenEmails = overlayContainer.querySelectorAll('.pp-rechten-email');
    var emailUser = 'info';
    var emailDomain = 'commissiemonitoring' + '.' + 'nl';
    var emailAddr = emailUser + '@' + emailDomain;
    rechtenEmails.forEach(function(el) {
      el.textContent = emailAddr;
    });

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
