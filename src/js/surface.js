/**
 * Surface — Hover preview overlay engine
 *
 * Shows a scaled-down clone of any DOM element as a floating preview
 * when the user hovers over a trigger element. Designed for sidebar
 * nav items that preview step content.
 *
 * Usage:
 *   Surface.init();
 *   Surface.preview(triggerEl, { cloneFrom: () => el, ... });
 */

const Surface = (() => {
  'use strict';

  // Shared overlay container
  let overlay = null;
  let activePreview = null;
  let hideTimeout = null;
  let showTimeout = null;

  /**
   * Initialize the overlay container. Safe to call multiple times.
   */
  function init() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'surface-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
  }

  /**
   * Attach a hover preview to a trigger element.
   *
   * @param {HTMLElement} trigger - Element that triggers preview on hover
   * @param {Object} opts
   * @param {Function} opts.cloneFrom - Returns the element to clone (called on each show)
   * @param {Function} [opts.transform] - Mutate the clone before display
   * @param {string} [opts.footer] - Text to show in the preview footer
   * @param {'left'|'right'|'top'|'bottom'} [opts.place='right'] - Placement relative to trigger
   * @param {'start'|'center'|'end'} [opts.align='start'] - Alignment along the placement axis
   * @param {number} [opts.gap=12] - Gap between trigger and preview
   * @param {{in: number, out: number}} [opts.delay] - Show/hide delays in ms
   * @param {number} [opts.previewScale=0.55] - Scale of the preview
   * @param {number} [opts.previewWidth=380] - Width of the preview container (before scaling)
   * @param {number} [opts.previewMaxHeight=320] - Max height of the preview (after scaling)
   */
  function preview(trigger, opts = {}) {
    const config = {
      place: opts.place || 'right',
      align: opts.align || 'start',
      gap: opts.gap ?? 12,
      delay: opts.delay || { in: 250, out: 150 },
      previewScale: opts.previewScale ?? 0.55,
      previewWidth: opts.previewWidth ?? 380,
      previewMaxHeight: opts.previewMaxHeight ?? 320,
      cloneFrom: opts.cloneFrom,
      transform: opts.transform,
      footer: opts.footer,
    };

    trigger.addEventListener('mouseenter', () => handleEnter(trigger, config));
    trigger.addEventListener('mouseleave', () => handleLeave(config));
  }

  function handleEnter(trigger, config) {
    // Cancel any pending hide
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    // Cancel any pending show for a different trigger
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    // If already showing a preview for this trigger, keep it
    if (activePreview && activePreview._trigger === trigger) {
      return;
    }

    showTimeout = setTimeout(() => {
      showTimeout = null;
      showPreview(trigger, config);
    }, config.delay.in);
  }

  function handleLeave(config) {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    hideTimeout = setTimeout(() => {
      hideTimeout = null;
      hidePreview();
    }, config.delay.out);
  }

  function showPreview(trigger, config) {
    // Clean up any existing preview
    hidePreview(true);

    if (!config.cloneFrom) return;
    const source = config.cloneFrom();
    if (!source) return;

    init(); // Ensure overlay exists

    // Build preview container
    const container = document.createElement('div');
    container.className = 'surface-preview';
    container.style.cssText = `
      position: absolute;
      pointer-events: auto;
      background: var(--cream, #fffbf7);
      border-radius: 10px;
      box-shadow:
        0 8px 32px rgba(74, 55, 40, 0.18),
        0 2px 8px rgba(74, 55, 40, 0.08);
      overflow: hidden;
      opacity: 0;
      transform: scale(0.96);
      transition: opacity 180ms ease, transform 180ms ease;
    `;

    // Preview body (scaled clone)
    const body = document.createElement('div');
    body.className = 'surface-preview-body';

    const innerWidth = config.previewWidth / config.previewScale;
    body.style.cssText = `
      width: ${innerWidth}px;
      transform: scale(${config.previewScale});
      transform-origin: top left;
      overflow: hidden;
      max-height: ${config.previewMaxHeight / config.previewScale}px;
    `;

    // Clone the source element
    const clone = source.cloneNode(true);

    // Remove interactivity
    clone.querySelectorAll('input, textarea, select, button').forEach(el => {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('disabled', '');
    });
    clone.querySelectorAll('a').forEach(a => {
      a.removeAttribute('href');
      a.style.pointerEvents = 'none';
    });

    // Apply user transform
    if (config.transform) {
      config.transform(clone);
    }

    body.appendChild(clone);
    container.appendChild(body);

    // Outer container sizing: width is fixed, height wraps to scaled content
    container.style.width = config.previewWidth + 'px';
    container.style.maxHeight = config.previewMaxHeight + 'px';

    // Footer
    if (config.footer) {
      const footer = document.createElement('div');
      footer.className = 'surface-preview-footer';
      footer.style.cssText = `
        padding: 8px 14px;
        font-size: 12px;
        color: var(--text-light, #7a6555);
        border-top: 1px solid rgba(74, 55, 40, 0.08);
        background: rgba(245, 230, 211, 0.3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      footer.textContent = config.footer;
      container.appendChild(footer);
    }

    overlay.appendChild(container);

    // Position the preview
    positionPreview(container, trigger, config);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
      });
    });

    // Allow hovering on the preview itself to keep it open
    container.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    });
    container.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        hideTimeout = null;
        hidePreview();
      }, config.delay.out);
    });

    activePreview = container;
    activePreview._trigger = trigger;
  }

  function positionPreview(container, trigger, config) {
    const triggerRect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Force layout to measure
    void container.offsetHeight;
    const cw = container.offsetWidth;
    const ch = container.offsetHeight;

    let left, top;

    // Placement
    switch (config.place) {
      case 'right':
        left = triggerRect.right + config.gap;
        break;
      case 'left':
        left = triggerRect.left - config.gap - cw;
        break;
      case 'top':
        top = triggerRect.top - config.gap - ch;
        break;
      case 'bottom':
        top = triggerRect.bottom + config.gap;
        break;
    }

    // Alignment
    if (config.place === 'left' || config.place === 'right') {
      switch (config.align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - ch / 2;
          break;
        case 'end':
          top = triggerRect.bottom - ch;
          break;
      }
    } else {
      switch (config.align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - cw / 2;
          break;
        case 'end':
          left = triggerRect.right - cw;
          break;
      }
    }

    // Viewport clamping
    if (left + cw > vw - 8) left = vw - cw - 8;
    if (left < 8) left = 8;
    if (top + ch > vh - 8) top = vh - ch - 8;
    if (top < 8) top = 8;

    container.style.left = left + 'px';
    container.style.top = top + 'px';
  }

  function hidePreview(immediate) {
    if (!activePreview) return;

    const el = activePreview;
    activePreview = null;

    if (immediate) {
      el.remove();
      return;
    }

    el.style.opacity = '0';
    el.style.transform = 'scale(0.96)';
    setTimeout(() => el.remove(), 200);
  }

  /**
   * Remove all previews and clean up.
   */
  function destroy() {
    hidePreview(true);
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  return { init, preview, destroy };
})();

export { Surface };
