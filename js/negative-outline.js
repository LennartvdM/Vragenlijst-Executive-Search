/**
 * Negative Outline Effect
 *
 * Creates a seamless outer stroke effect by rendering the element + outline
 * as a single compound SVG shape. This eliminates the anti-aliasing seam
 * that occurs with CSS outline/box-shadow approaches.
 *
 * Usage: Add data-negative-outline attribute to elements
 * Optional: data-outline-width="6" (default: reads from CSS --outline-width or 6px)
 * Optional: data-outline-color="#fffbf7" (default: reads from element's background-color)
 */

(function() {
  'use strict';

  const SVG_CLASS = 'negative-outline-svg';

  /**
   * Get computed outline width from CSS variable or attribute
   */
  function getOutlineWidth(element) {
    const attrWidth = element.dataset.outlineWidth;
    if (attrWidth) return parseFloat(attrWidth);

    const cssVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--outline-width').trim();
    if (cssVar) return parseFloat(cssVar);

    return 6;
  }

  /**
   * Get the fill color for the outline
   */
  function getOutlineColor(element) {
    const attrColor = element.dataset.outlineColor;
    if (attrColor) return attrColor;

    const computed = getComputedStyle(element);
    const bgColor = computed.backgroundColor;

    if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
      const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue('--cream').trim();
      return cssVar || '#fffbf7';
    }

    return bgColor;
  }

  /**
   * Get border radius values from element
   */
  function getBorderRadius(element) {
    const computed = getComputedStyle(element);
    const radius = computed.borderRadius;
    const values = radius.split(' ').map(v => parseFloat(v) || 0);

    if (values.length === 1) {
      return { tl: values[0], tr: values[0], br: values[0], bl: values[0] };
    } else if (values.length === 4) {
      return { tl: values[0], tr: values[1], br: values[2], bl: values[3] };
    }

    return { tl: 12, tr: 12, br: 12, bl: 12 };
  }

  /**
   * Create SVG path for rounded rectangle
   */
  function createRoundedRectPath(width, height, radius) {
    const { tl, tr, br, bl } = radius;

    return `
      M ${tl} 0
      L ${width - tr} 0
      Q ${width} 0 ${width} ${tr}
      L ${width} ${height - br}
      Q ${width} ${height} ${width - br} ${height}
      L ${bl} ${height}
      Q 0 ${height} 0 ${height - bl}
      L 0 ${tl}
      Q 0 0 ${tl} 0
      Z
    `.replace(/\s+/g, ' ').trim();
  }

  /**
   * Create a unique ID for gradient
   */
  let gradientCounter = 0;
  function createGradientId() {
    return 'neg-outline-grad-' + (++gradientCounter);
  }

  /**
   * Get gradient colors from CSS variables
   */
  function getGradientColors() {
    const root = getComputedStyle(document.documentElement);
    // Use design system colors for subtle gradient
    const cream = root.getPropertyValue('--cream').trim() || '#fffbf7';
    const sandLight = root.getPropertyValue('--sand-light').trim() || '#faf4eb';
    const salmonLight = root.getPropertyValue('--salmon-light').trim() || '#f5c4b8';

    return {
      start: cream,
      mid: sandLight,
      end: salmonLight
    };
  }

  /**
   * Apply negative outline to an element
   * Inserts SVG as a sibling, positioned behind the element
   */
  function applyOutline(element) {
    const outlineWidth = getOutlineWidth(element);
    const baseRadius = getBorderRadius(element);

    // Get element's position relative to its offset parent
    const rect = element.getBoundingClientRect();
    const parentRect = element.offsetParent
      ? element.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0 };

    const offsetLeft = rect.left - parentRect.left;
    const offsetTop = rect.top - parentRect.top;

    // Total dimensions including outline
    const totalWidth = rect.width + (outlineWidth * 2);
    const totalHeight = rect.height + (outlineWidth * 2);

    // Outer radius (expanded by outline width)
    const outerRadius = {
      tl: baseRadius.tl + outlineWidth,
      tr: baseRadius.tr + outlineWidth,
      br: baseRadius.br + outlineWidth,
      bl: baseRadius.bl + outlineWidth
    };

    // Find or create SVG
    let svg = element.previousElementSibling;
    if (!svg || !svg.classList.contains(SVG_CLASS)) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', SVG_CLASS);
      svg.setAttribute('aria-hidden', 'true');
      element.parentNode.insertBefore(svg, element);
    }

    // Update SVG attributes
    svg.setAttribute('width', totalWidth);
    svg.setAttribute('height', totalHeight);
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    svg.style.cssText = `
      position: absolute;
      left: ${offsetLeft - outlineWidth}px;
      top: ${offsetTop - outlineWidth}px;
      width: ${totalWidth}px;
      height: ${totalHeight}px;
      pointer-events: none;
      z-index: 0;
    `;

    // Get or create defs for gradient
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }

    // Create gradient with unique ID
    const gradientId = svg.dataset.gradientId || createGradientId();
    svg.dataset.gradientId = gradientId;

    let gradient = defs.querySelector('#' + gradientId);
    if (!gradient) {
      gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      defs.appendChild(gradient);
    }

    // Subtle diagonal gradient (135deg like the body background)
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    // Get colors from design system
    const colors = getGradientColors();

    // Clear existing stops
    gradient.innerHTML = '';

    // Very subtle gradient - mostly cream with hint of warmth
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', colors.start);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('stop-color', colors.mid);
    stop2.setAttribute('stop-opacity', '0.5'); // Blend subtly

    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', colors.end);
    stop3.setAttribute('stop-opacity', '0.15'); // Very subtle pink hint

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);

    // Update or create path
    let path = svg.querySelector('path');
    if (!path) {
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(path);
    }
    path.setAttribute('d', createRoundedRectPath(totalWidth, totalHeight, outerRadius));
    path.setAttribute('fill', `url(#${gradientId})`);

    // Ensure element is above SVG
    const currentZIndex = getComputedStyle(element).zIndex;
    if (currentZIndex === 'auto' || parseInt(currentZIndex) < 1) {
      element.style.position = element.style.position || 'relative';
      element.style.zIndex = '1';
    }
  }

  /**
   * Initialize all elements with negative outline
   */
  function initOutlines() {
    const elements = document.querySelectorAll('[data-negative-outline]');
    elements.forEach(applyOutline);
  }

  /**
   * Update outlines on resize (debounced)
   */
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initOutlines, 100);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOutlines);
  } else {
    // Small delay to ensure CSS is applied
    setTimeout(initOutlines, 10);
  }

  // Re-apply on window resize
  window.addEventListener('resize', handleResize);

  // Expose API for manual control
  window.NegativeOutline = {
    apply: applyOutline,
    refresh: initOutlines
  };
})();
