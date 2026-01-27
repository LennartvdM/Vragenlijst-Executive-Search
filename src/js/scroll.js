/**
 * Scroll management module
 * Handles scroll position persistence, custom scrollbar, and fade gradients
 */

import * as state from './state.js';

/**
 * Load scroll positions from localStorage
 */
export function loadScrollPositions() {
  try {
    const saved = localStorage.getItem(window.CONFIG.STORAGE_KEYS.SCROLL_POSITIONS);
    if (saved) {
      state.setScrollPositions(JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Could not load scroll positions:', e);
    state.setScrollPositions({});
  }
}

/**
 * Save scroll positions to localStorage
 */
export function persistScrollPositions() {
  try {
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.SCROLL_POSITIONS, JSON.stringify(state.scrollPositions));
  } catch (e) {
    console.warn('Could not save scroll positions:', e);
  }
}

/**
 * Get the scrollable content container
 */
export function getScrollableContainer() {
  return document.getElementById('contentScrollable');
}

/**
 * Save the current scroll position for the current step
 */
export function saveScrollPosition() {
  const scrollable = getScrollableContainer();
  if (!scrollable) return;
  const scrollY = scrollable.scrollTop;
  state.scrollPositions[state.currentStep] = scrollY;
  persistScrollPositions();
}

/**
 * Restore scroll position for a given step
 * @param {number} step - The step to restore scroll position for
 */
export function restoreScrollPosition(step) {
  const scrollable = getScrollableContainer();
  if (!scrollable) return;

  const savedPosition = state.scrollPositions[step];
  if (typeof savedPosition === 'number' && savedPosition > 0) {
    requestAnimationFrame(() => {
      scrollable.scrollTo({ top: savedPosition, behavior: 'smooth' });
      setTimeout(updateFadeGradients, 400);
    });
  } else {
    scrollable.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(updateFadeGradients, 400);
  }
}

/**
 * Handle scroll events - debounced save of scroll position
 */
export function handleScroll() {
  if (state.scrollSaveTimeout) {
    clearTimeout(state.scrollSaveTimeout);
  }
  state.setScrollSaveTimeout(setTimeout(() => {
    saveScrollPosition();
  }, 150));

  updateFadeGradients();
  updateCustomScrollbar();
}

/**
 * Update custom scrollbar thumb position and size
 */
export function updateCustomScrollbar() {
  const scrollable = getScrollableContainer();
  const thumb = document.getElementById('customScrollbarThumb');
  const track = document.getElementById('customScrollbar');
  const wrapper = document.querySelector('.content-scrollable-wrapper');

  if (!scrollable || !thumb || !track) return;

  const scrollTop = scrollable.scrollTop;
  const scrollHeight = scrollable.scrollHeight;
  const clientHeight = scrollable.clientHeight;
  const trackHeight = track.offsetHeight;

  const thumbHeight = Math.max(30, (clientHeight / scrollHeight) * trackHeight);
  const scrollRatio = scrollTop / (scrollHeight - clientHeight);
  const thumbTop = scrollRatio * (trackHeight - thumbHeight);

  thumb.style.height = thumbHeight + 'px';
  thumb.style.transform = `translateY(${thumbTop}px)`;

  if (wrapper) {
    wrapper.classList.add('scrolling');
    clearTimeout(wrapper.scrollingTimeout);
    wrapper.scrollingTimeout = setTimeout(() => {
      wrapper.classList.remove('scrolling');
    }, 1000);
  }

  if (scrollHeight <= clientHeight) {
    track.style.display = 'none';
  } else {
    track.style.display = 'block';
  }
}

/**
 * Initialize custom scrollbar drag functionality
 */
export function initCustomScrollbarDrag() {
  const thumb = document.getElementById('customScrollbarThumb');
  const track = document.getElementById('customScrollbar');
  const scrollable = getScrollableContainer();

  if (!thumb || !track || !scrollable) return;

  let isDragging = false;
  let startY = 0;
  let startScrollTop = 0;

  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startScrollTop = scrollable.scrollTop;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaY = e.clientY - startY;
    const trackHeight = track.offsetHeight;
    const thumbHeight = thumb.offsetHeight;
    const scrollHeight = scrollable.scrollHeight;
    const clientHeight = scrollable.clientHeight;

    const scrollRatio = deltaY / (trackHeight - thumbHeight);
    const scrollDelta = scrollRatio * (scrollHeight - clientHeight);

    scrollable.scrollTop = startScrollTop + scrollDelta;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });

  track.addEventListener('click', (e) => {
    if (e.target === thumb) return;

    const trackRect = track.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackHeight = track.offsetHeight;
    const scrollHeight = scrollable.scrollHeight;
    const clientHeight = scrollable.clientHeight;

    const scrollRatio = clickY / trackHeight;
    scrollable.scrollTop = scrollRatio * (scrollHeight - clientHeight);
  });
}

/**
 * Update fade gradient visibility based on scroll position
 */
export function updateFadeGradients() {
  const scrollable = getScrollableContainer();
  const wrapper = document.querySelector('.content-scrollable-wrapper');
  if (!scrollable || !wrapper) return;

  const scrollTop = scrollable.scrollTop;
  const scrollHeight = scrollable.scrollHeight;
  const clientHeight = scrollable.clientHeight;
  const threshold = 5;

  if (scrollTop > threshold && !wrapper.classList.contains('has-scrolled')) {
    wrapper.classList.add('has-scrolled');
  }

  const atTop = scrollTop <= threshold;
  const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;

  wrapper.classList.toggle('at-top', atTop);
  wrapper.classList.toggle('at-bottom', atBottom);
}

/**
 * Clear scroll positions (called on form reset/clear)
 */
export function clearScrollPositions() {
  state.setScrollPositions({});
  try {
    localStorage.removeItem(window.CONFIG.STORAGE_KEYS.SCROLL_POSITIONS);
  } catch (e) {
    console.warn('Could not clear scroll positions:', e);
  }
}
