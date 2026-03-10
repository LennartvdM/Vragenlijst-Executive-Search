/**
 * Horizontal swipe navigation module (mobile only)
 * Transforms the step container into a horizontal carousel using
 * native CSS scroll-snap for GPU-accelerated snapping.
 */

import * as state from './state.js';
import { updateProgress, updateIndex } from './progress.js';
import { getIncompleteItems } from './validation.js';
import { refreshLikertPills } from './likert.js';
import { saveFormData } from './form.js';

let swipeContainer = null;
let isSwipeActive = false;
let lastDotStep = -1;
let scrollEndTimer = null;

/**
 * Check if we're on mobile
 */
function isMobile() {
  return window.innerWidth <= (window.CONFIG?.MOBILE_BREAKPOINT || 768);
}

/**
 * Initialize horizontal swipe navigation on mobile.
 */
export function initSwipe() {
  if (!isMobile()) return;

  swipeContainer = document.getElementById('contentScrollable');
  if (!swipeContainer) return;

  isSwipeActive = true;

  swipeContainer.classList.add('swipe-horizontal');

  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(step => step.classList.add('swipe-step'));

  // Scroll to current step instantly
  scrollToStep(state.currentStep, false);

  lastDotStep = state.currentStep;

  // Use native scroll events — the browser handles all touch/momentum/snapping
  swipeContainer.addEventListener('scroll', onScroll, { passive: true });
  swipeContainer.addEventListener('scrollend', onScrollEnd, { passive: true });

  // Handle resize (orientation change)
  window.addEventListener('resize', handleResize);
}

/**
 * Get the scroll-left position that centers a given step.
 */
function getStepScrollPosition(step) {
  if (!swipeContainer) return 0;
  const stepEl = swipeContainer.querySelector(`.step[data-step="${step}"]`);
  if (!stepEl) return 0;
  const containerWidth = swipeContainer.offsetWidth;
  return stepEl.offsetLeft - (containerWidth - stepEl.offsetWidth) / 2;
}

/**
 * Scroll to a specific step.
 * @param {number} step - Step index
 * @param {boolean} animated - Whether to animate
 */
export function scrollToStep(step, animated = true) {
  if (!isSwipeActive || !swipeContainer) return false;

  const targetScroll = getStepScrollPosition(step);

  if (!animated) {
    swipeContainer.scrollLeft = targetScroll;
    return true;
  }

  swipeContainer.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });
  return true;
}

// =====================
//  Scroll event handlers
// =====================

function onScroll() {
  if (!isSwipeActive) return;

  // Update dots live during scroll
  updateDotsLive();

  // Fallback for browsers without scrollend: debounce to detect snap settlement
  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(() => {
    onScrollEnd();
  }, 150);
}

function onScrollEnd() {
  if (!isSwipeActive || !swipeContainer) return;

  clearTimeout(scrollEndTimer);

  const containerWidth = swipeContainer.offsetWidth;
  if (containerWidth === 0) return;

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

  updateActiveStep(newStep);

  if (newStep === window.CONFIG.REVIEW_STEP) {
    if (!state.reviewVisited) {
      state.setReviewVisited(true);
      state.setInitialReviewItems(getIncompleteItems());
    }
    document.dispatchEvent(new CustomEvent('generateReview'));
  }

  updateProgress();
  updateIndex();
  updateNavButtons(newStep);

  setTimeout(refreshLikertPills, 50);
  saveFormData();
}

// =====================
//  Live dot updates
// =====================

function updateDotsLive() {
  if (!swipeContainer) return;

  const containerWidth = swipeContainer.offsetWidth;
  if (containerWidth === 0) return;

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

  const nearestStep = getStepFromDOMIndex(closestIndex);

  if (nearestStep === lastDotStep) return;
  lastDotStep = nearestStep;

  const displayStep = nearestStep <= 13 ? nearestStep : 13;
  const dotsContainers = document.querySelectorAll('.progress-dots');
  dotsContainers.forEach(container => {
    const dots = container.querySelectorAll('span');
    dots.forEach((dot, i) => {
      dot.classList.remove(window.CONSTANTS.CSS.ACTIVE, window.CONSTANTS.CSS.DONE);
      if (i < displayStep) dot.classList.add(window.CONSTANTS.CSS.DONE);
      if (i === displayStep) dot.classList.add(window.CONSTANTS.CSS.ACTIVE);
    });

    if (nearestStep >= window.CONFIG.REVIEW_STEP) {
      dots.forEach(dot => {
        dot.classList.remove(window.CONSTANTS.CSS.ACTIVE);
        dot.classList.add(window.CONSTANTS.CSS.DONE);
      });
    }
  });
}

// =====================
//  Helpers
// =====================

function getStepFromDOMIndex(index) {
  if (!swipeContainer) return 0;
  const steps = swipeContainer.querySelectorAll('.step');
  if (index >= 0 && index < steps.length) {
    return parseInt(steps[index].dataset.step, 10);
  }
  return 0;
}

function updateActiveStep(step) {
  if (!swipeContainer) return;
  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(s => {
    const stepNum = parseInt(s.dataset.step, 10);
    s.classList.toggle('active', stepNum === step);
  });
}

function saveVerticalScroll(step) {
  const stepEl = swipeContainer?.querySelector(`.step[data-step="${step}"]`);
  if (stepEl) {
    state.scrollPositions[step] = stepEl.scrollTop;
  }
}

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

function handleResize() {
  if (isMobile() && !isSwipeActive) {
    initSwipe();
  } else if (!isMobile() && isSwipeActive) {
    destroySwipe();
  } else if (isMobile() && isSwipeActive) {
    scrollToStep(state.currentStep, false);
  }
}

function destroySwipe() {
  if (!swipeContainer) return;

  isSwipeActive = false;
  clearTimeout(scrollEndTimer);
  swipeContainer.classList.remove('swipe-horizontal');

  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(step => step.classList.remove('swipe-step'));

  swipeContainer.removeEventListener('scroll', onScroll);
  swipeContainer.removeEventListener('scrollend', onScrollEnd);
  lastDotStep = -1;
}

export function isSwipeMode() {
  return isSwipeActive;
}

export function cleanupSwipe() {
  destroySwipe();
  window.removeEventListener('resize', handleResize);
}
