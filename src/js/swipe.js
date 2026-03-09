/**
 * Horizontal swipe navigation module (mobile only)
 * Transforms the step container into a horizontal scroll-snap carousel.
 * Users can flick/drag between survey steps on mobile devices.
 */

import * as state from './state.js';
import { updateProgress, updateIndex } from './progress.js';
import { getIncompleteItems } from './validation.js';
import { refreshLikertPills } from './likert.js';
import { saveFormData } from './form.js';

let swipeContainer = null;
let isSwipeActive = false;
let scrollEndTimer = null;

/**
 * Check if we're on mobile
 */
function isMobile() {
  return window.innerWidth <= (window.CONFIG?.MOBILE_BREAKPOINT || 768);
}

/**
 * Initialize horizontal swipe navigation on mobile.
 * Called once after survey HTML is loaded.
 */
export function initSwipe() {
  if (!isMobile()) return;

  swipeContainer = document.getElementById('contentScrollable');
  if (!swipeContainer) return;

  isSwipeActive = true;

  // Add the CSS class that activates horizontal scroll-snap layout
  swipeContainer.classList.add('swipe-horizontal');

  // Make all steps visible for the horizontal layout
  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(step => {
    step.classList.add('swipe-step');
  });

  // Scroll to the current step without animation
  scrollToStep(state.currentStep, false);

  // Listen for scroll end to detect which step we landed on
  swipeContainer.addEventListener('scroll', handleSwipeScroll, { passive: true });

  // Handle resize (e.g. orientation change)
  window.addEventListener('resize', handleResize);
}

/**
 * Scroll the swipe container to show a specific step
 * @param {number} step - Step index
 * @param {boolean} smooth - Whether to animate
 */
export function scrollToStep(step, smooth = true) {
  if (!isSwipeActive || !swipeContainer) return false;

  const stepEl = swipeContainer.querySelector(`.step[data-step="${step}"]`);
  if (!stepEl) return false;

  // Center the step element within the scroll container
  const containerWidth = swipeContainer.offsetWidth;
  const scrollLeft = stepEl.offsetLeft - (containerWidth - stepEl.offsetWidth) / 2;

  swipeContainer.scrollTo({
    left: scrollLeft,
    behavior: smooth ? 'smooth' : 'instant'
  });

  return true;
}

/**
 * Get the DOM index of a step (its position among .step siblings)
 */
function getStepDOMIndex(stepNumber) {
  if (!swipeContainer) return 0;
  const steps = swipeContainer.querySelectorAll('.step');
  for (let i = 0; i < steps.length; i++) {
    if (parseInt(steps[i].dataset.step, 10) === stepNumber) {
      return i;
    }
  }
  return 0;
}

/**
 * Get the step number from a DOM index
 */
function getStepFromDOMIndex(index) {
  if (!swipeContainer) return 0;
  const steps = swipeContainer.querySelectorAll('.step');
  if (index >= 0 && index < steps.length) {
    return parseInt(steps[index].dataset.step, 10);
  }
  return 0;
}

/**
 * Handle scroll events on the swipe container.
 * Uses a debounced "scroll end" detection to figure out which step
 * the user landed on after a swipe.
 */
function handleSwipeScroll() {
  if (!isSwipeActive) return;

  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(() => {
    onSwipeEnd();
  }, 100);
}

/**
 * Called when scrolling settles. Determines which step is now visible
 * and updates app state accordingly.
 */
function onSwipeEnd() {
  if (!isSwipeActive || !swipeContainer) return;

  const containerWidth = swipeContainer.offsetWidth;
  if (containerWidth === 0) return;

  // Figure out which step is centered by finding closest to viewport center
  const scrollCenter = swipeContainer.scrollLeft + containerWidth / 2;
  const steps = swipeContainer.querySelectorAll('.step');
  let closestIndex = 0;
  let closestDist = Infinity;
  steps.forEach((step, i) => {
    const stepCenter = step.offsetLeft + step.offsetWidth / 2;
    const dist = Math.abs(stepCenter - scrollCenter);
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  });
  const newStep = getStepFromDOMIndex(closestIndex);

  if (newStep === state.currentStep) return;

  // Save scroll position of the old step's vertical content
  saveVerticalScroll(state.currentStep);

  const oldStep = state.currentStep;
  state.setPreviousStep(oldStep);
  state.setCurrentStep(newStep);

  // Update active classes
  updateActiveStep(newStep);

  // Handle review step logic
  if (newStep === window.CONFIG.REVIEW_STEP) {
    if (!state.reviewVisited) {
      state.setReviewVisited(true);
      state.setInitialReviewItems(getIncompleteItems());
    }
    document.dispatchEvent(new CustomEvent('generateReview'));
  }

  // Refresh UI
  updateProgress();
  updateIndex();
  updateNavButtons(newStep);

  setTimeout(refreshLikertPills, 50);
  saveFormData();
}

/**
 * Update which step has the .active class
 */
function updateActiveStep(step) {
  if (!swipeContainer) return;
  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(s => {
    const stepNum = parseInt(s.dataset.step, 10);
    s.classList.toggle('active', stepNum === step);
  });
}

/**
 * Save the vertical scroll position of a step's inner content
 */
function saveVerticalScroll(step) {
  const stepEl = swipeContainer?.querySelector(`.step[data-step="${step}"]`);
  if (stepEl) {
    state.scrollPositions[step] = stepEl.scrollTop;
  }
}

/**
 * Restore the vertical scroll position of a step's inner content
 */
export function restoreVerticalScroll(step) {
  const stepEl = swipeContainer?.querySelector(`.step[data-step="${step}"]`);
  if (!stepEl) return;

  const saved = state.scrollPositions[step];
  if (typeof saved === 'number' && saved > 0) {
    stepEl.scrollTop = saved;
  } else {
    stepEl.scrollTop = 0;
  }
}

/**
 * Update nav button visibility/labels based on current step.
 * Mirrors the logic in navigation.js showStep().
 */
function updateNavButtons(step) {
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnGoToReview = document.getElementById('btnGoToReview');
  const btnGoToReviewTop = document.getElementById('btnGoToReviewTop');
  const progressDotsBottom = document.getElementById('progressDots');

  const showPrev = step > 0 && step <= window.CONFIG.REVIEW_STEP;
  if (btnPrev) btnPrev.style.display = showPrev ? 'block' : 'none';

  const showReviewBtn = state.reviewVisited && step < window.CONFIG.REVIEW_STEP;
  if (btnGoToReview) btnGoToReview.style.display = showReviewBtn ? 'block' : 'none';
  if (btnGoToReviewTop) btnGoToReviewTop.style.display = showReviewBtn ? 'block' : 'none';

  if (step === window.CONFIG.SIGN_STEP) {
    if (btnNext) {
      btnNext.textContent = 'Controleren';
      btnNext.style.display = 'block';
    }
  } else if (step === window.CONFIG.REVIEW_STEP) {
    if (progressDotsBottom) progressDotsBottom.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (btnPrev) btnPrev.style.display = 'block';
  } else if (step === window.CONFIG.SUCCESS_STEP) {
    if (progressDotsBottom) progressDotsBottom.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (btnPrev) btnPrev.style.display = 'none';
  } else {
    if (btnNext) {
      btnNext.textContent = window.CONSTANTS.UI.BUTTON_NEXT;
      btnNext.style.display = 'block';
    }
    if (progressDotsBottom) progressDotsBottom.style.display = 'flex';
  }
}

/**
 * Handle window resize — activate/deactivate swipe mode
 */
function handleResize() {
  if (isMobile() && !isSwipeActive) {
    initSwipe();
  } else if (!isMobile() && isSwipeActive) {
    destroySwipe();
  } else if (isMobile() && isSwipeActive) {
    // Re-snap to current step on orientation change
    scrollToStep(state.currentStep, false);
  }
}

/**
 * Deactivate swipe mode (when switching to desktop)
 */
function destroySwipe() {
  if (!swipeContainer) return;

  isSwipeActive = false;
  swipeContainer.classList.remove('swipe-horizontal');

  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(step => {
    step.classList.remove('swipe-step');
  });

  swipeContainer.removeEventListener('scroll', handleSwipeScroll);
  clearTimeout(scrollEndTimer);
}

/**
 * Check if swipe mode is currently active
 */
export function isSwipeMode() {
  return isSwipeActive;
}

/**
 * Clean up on full teardown
 */
export function cleanupSwipe() {
  destroySwipe();
  window.removeEventListener('resize', handleResize);
}
