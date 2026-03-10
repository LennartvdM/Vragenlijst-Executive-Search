/**
 * Horizontal swipe navigation module (mobile only)
 * Transforms the step container into a horizontal carousel with
 * custom spring-physics snapping (overshoot "pow" effect).
 */

import * as state from './state.js';
import { updateProgress, updateIndex } from './progress.js';
import { getIncompleteItems } from './validation.js';
import { refreshLikertPills } from './likert.js';
import { saveFormData } from './form.js';

let swipeContainer = null;
let isSwipeActive = false;
let lastDotStep = -1;

// --- Touch tracking ---
let touchStartX = 0;
let touchStartY = 0;
let touchStartScroll = 0;
let touchStartTime = 0;
let lastTouchX = 0;
let lastTouchTime = 0;
let velocityX = 0;
let isDragging = false;
let directionLocked = null; // null | 'horizontal' | 'vertical'

// --- Spring animation ---
let springRAF = null;

// Spring config
const SPRING_TENSION = 0.25;    // how hard it pulls toward target (higher = snappier)
const SPRING_DAMPING = 0.72;    // energy retention per frame (lower = less bouncy)
const OVERSHOOT_SCALE = 1.15;   // initial velocity multiplier for the "pow" feel
const VELOCITY_THRESHOLD = 0.3; // px/ms — minimum flick speed to advance a step
const DIRECTION_LOCK_THRESHOLD = 8; // px — movement before locking axis

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

  // Touch events for custom drag + spring snap
  swipeContainer.addEventListener('touchstart', onTouchStart, { passive: true });
  swipeContainer.addEventListener('touchmove', onTouchMove, { passive: false });
  swipeContainer.addEventListener('touchend', onTouchEnd, { passive: true });
  swipeContainer.addEventListener('touchcancel', onTouchEnd, { passive: true });

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
 * @param {boolean} animated - Whether to use spring animation
 */
export function scrollToStep(step, animated = true) {
  if (!isSwipeActive || !swipeContainer) return false;

  const targetScroll = getStepScrollPosition(step);

  if (!animated) {
    cancelSpring();
    swipeContainer.scrollLeft = targetScroll;
    return true;
  }

  animateSpring(targetScroll, 0);
  return true;
}

// =====================
//  Touch event handlers
// =====================

function onTouchStart(e) {
  if (!isSwipeActive) return;

  // Stop any running spring animation
  cancelSpring();

  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartScroll = swipeContainer.scrollLeft;
  touchStartTime = Date.now();
  lastTouchX = touch.clientX;
  lastTouchTime = touchStartTime;
  velocityX = 0;
  isDragging = true;
  directionLocked = null;
}

function onTouchMove(e) {
  if (!isDragging || !isSwipeActive) return;

  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  // Lock direction after threshold
  if (directionLocked === null) {
    if (Math.abs(dx) > DIRECTION_LOCK_THRESHOLD || Math.abs(dy) > DIRECTION_LOCK_THRESHOLD) {
      directionLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
  }

  // If vertical scroll, let it pass through to the step's own scrolling
  if (directionLocked === 'vertical') return;

  // Horizontal drag — prevent default to stop vertical scroll interference
  e.preventDefault();

  // Track velocity (exponential moving average over recent movement)
  const now = Date.now();
  const dt = now - lastTouchTime;
  if (dt > 0) {
    const instantVelocity = (lastTouchX - touch.clientX) / dt; // positive = swiping left
    velocityX = 0.6 * instantVelocity + 0.4 * velocityX;
  }
  lastTouchX = touch.clientX;
  lastTouchTime = now;

  // Move scroll position 1:1 with finger
  swipeContainer.scrollLeft = touchStartScroll - dx;

  // Update dots live
  updateDotsLive();
}

function onTouchEnd() {
  if (!isDragging || !isSwipeActive) return;
  isDragging = false;

  if (directionLocked === 'vertical' || directionLocked === null) {
    // Was a vertical scroll or a tap — just snap to nearest
    snapToNearest(0);
    return;
  }

  // Decay velocity if touch ended a while after last move
  const timeSinceLastMove = Date.now() - lastTouchTime;
  if (timeSinceLastMove > 80) {
    velocityX = 0;
  }

  snapToNearest(velocityX);
}

// =====================
//  Snap + spring physics
// =====================

/**
 * Determine the target step based on current position + velocity, then spring to it.
 */
function snapToNearest(velocity) {
  if (!swipeContainer) return;

  const containerWidth = swipeContainer.offsetWidth;
  const scrollCenter = swipeContainer.scrollLeft + containerWidth / 2;
  const steps = swipeContainer.querySelectorAll('.step');

  // Find closest step to current scroll center
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

  // If velocity is strong enough, bias toward the next/previous step
  let targetIndex = closestIndex;
  if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
    if (velocity > 0 && targetIndex < steps.length - 1) {
      targetIndex = closestIndex + 1; // swipe left → next
    } else if (velocity < 0 && targetIndex > 0) {
      targetIndex = closestIndex - 1; // swipe right → previous
    }
  }

  const targetStep = parseInt(steps[targetIndex].dataset.step, 10);
  const targetScroll = getStepScrollPosition(targetStep);

  // Convert finger velocity (px/ms) to initial spring velocity (px/frame at ~60fps)
  // The overshoot scale makes it feel punchier
  const initialVelocity = velocity * 16 * OVERSHOOT_SCALE;

  animateSpring(targetScroll, initialVelocity);
}

/**
 * Animate scroll position with a spring that overshoots and settles.
 * @param {number} target - Target scrollLeft
 * @param {number} initialVelocity - Starting velocity in px/frame (positive = scrolling right)
 */
function animateSpring(target, initialVelocity) {
  cancelSpring();

  let currentVelocity = initialVelocity;
  let settled = false;

  function tick() {
    if (!swipeContainer || settled) return;

    const current = swipeContainer.scrollLeft;
    const displacement = current - target;

    // Spring force pulls toward target
    const springForce = -SPRING_TENSION * displacement;

    // Apply force + damping
    currentVelocity = (currentVelocity + springForce) * SPRING_DAMPING;

    // Apply velocity
    const newScroll = current + currentVelocity;
    swipeContainer.scrollLeft = newScroll;

    // Update dots during animation
    updateDotsLive();

    // Check if settled (close enough + slow enough)
    if (Math.abs(displacement) < 0.5 && Math.abs(currentVelocity) < 0.5) {
      swipeContainer.scrollLeft = target;
      settled = true;
      springRAF = null;
      onSnapSettled();
      return;
    }

    springRAF = requestAnimationFrame(tick);
  }

  springRAF = requestAnimationFrame(tick);
}

function cancelSpring() {
  if (springRAF) {
    cancelAnimationFrame(springRAF);
    springRAF = null;
  }
}

/**
 * Called when the spring animation finishes. Full state sync.
 */
function onSnapSettled() {
  if (!isSwipeActive || !swipeContainer) return;

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
  cancelSpring();
  swipeContainer.classList.remove('swipe-horizontal');

  const steps = swipeContainer.querySelectorAll('.step');
  steps.forEach(step => step.classList.remove('swipe-step'));

  swipeContainer.removeEventListener('touchstart', onTouchStart);
  swipeContainer.removeEventListener('touchmove', onTouchMove);
  swipeContainer.removeEventListener('touchend', onTouchEnd);
  swipeContainer.removeEventListener('touchcancel', onTouchEnd);
  lastDotStep = -1;
}

export function isSwipeMode() {
  return isSwipeActive;
}

export function cleanupSwipe() {
  destroySwipe();
  window.removeEventListener('resize', handleResize);
}
