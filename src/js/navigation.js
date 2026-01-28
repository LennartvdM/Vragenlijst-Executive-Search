/**
 * Navigation module
 * Handles step navigation, mobile drawer, and transitions
 */

import * as state from './state.js';
import { saveScrollPosition, restoreScrollPosition, updateFadeGradients, getScrollableContainer } from './scroll.js';
import { updateProgress, updateIndex, updateMobileHighlighter, updateIndexStatus } from './progress.js';
import { getIncompleteItems, toggleConditional } from './validation.js';
import { saveFormData } from './form.js';
import { updateAllSections } from './progress.js';
import { refreshLikertPills } from './likert.js';

/**
 * Show a specific step
 * @param {number} step - Step index to show
 */
export function showStep(step) {
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove(window.CONSTANTS.CSS.ACTIVE, 'slide-up', 'slide-down');
  });

  const stepEl = document.querySelector(`.step[data-step="${step}"]`);
  if (stepEl) {
    const scrollableContainer = getScrollableContainer();
    const savedPosition = state.scrollPositions[step];
    const hasSavedPosition = typeof savedPosition === 'number' && savedPosition > 0;
    const shouldAnimate = state.previousStep !== -1 && state.previousStep !== step && !hasSavedPosition;

    if (shouldAnimate) {
      stepEl.classList.add(window.CONSTANTS.CSS.ACTIVE);

      if (scrollableContainer) {
        scrollableContainer.style.scrollBehavior = 'auto';
        scrollableContainer.scrollTop = 0;
        scrollableContainer.style.scrollBehavior = '';
        scrollableContainer.classList.add('animating');
      }

      if (step > state.previousStep) {
        stepEl.classList.add('slide-up');
      } else {
        stepEl.classList.add('slide-down');
      }

      setTimeout(() => {
        if (scrollableContainer) {
          scrollableContainer.classList.remove('animating');
        }
        updateFadeGradients();
      }, 400);
    } else {
      stepEl.classList.add(window.CONSTANTS.CSS.ACTIVE);

      if (scrollableContainer && hasSavedPosition) {
        scrollableContainer.style.scrollBehavior = 'auto';
        scrollableContainer.scrollTop = savedPosition;
        scrollableContainer.style.scrollBehavior = '';
        updateFadeGradients();
      } else {
        restoreScrollPosition(step);
      }
    }

    setTimeout(refreshLikertPills, 50);
  }

  state.setPreviousStep(step);

  // Generate review content when showing review step
  if (step === window.CONFIG.REVIEW_STEP) {
    if (!state.reviewVisited) {
      state.setReviewVisited(true);
      state.setInitialReviewItems(getIncompleteItems());
    }
    document.dispatchEvent(new CustomEvent('generateReview'));
  }

  // Show/hide "Ga naar controle" button
  const btnGoToReview = document.getElementById('btnGoToReview');
  const showReviewBtn = state.reviewVisited && step < window.CONFIG.REVIEW_STEP;
  if (btnGoToReview) btnGoToReview.style.display = showReviewBtn ? 'block' : 'none';

  // Toggle footer class to hide Inkijkexemplaar when review button is visible
  const contentFooter = document.querySelector('.content-footer');
  if (contentFooter) {
    contentFooter.classList.toggle('has-review-btn', showReviewBtn);
  }

  // Update navigation buttons
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const progressDotsTop = document.getElementById('progressDotsTop');

  const showPrev = step > 0 && step <= window.CONFIG.REVIEW_STEP;
  if (btnPrev) btnPrev.style.display = showPrev ? 'block' : 'none';

  if (step === 13) {
    if (btnNext) {
      btnNext.textContent = 'Controleren';
      btnNext.style.display = 'block';
    }
  } else if (step === window.CONFIG.REVIEW_STEP) {
    if (progressDotsTop) progressDotsTop.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (btnPrev) btnPrev.style.display = 'block';
  } else if (step === window.CONFIG.SUCCESS_STEP) {
    if (progressDotsTop) progressDotsTop.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (btnPrev) btnPrev.style.display = 'none';
  } else {
    if (btnNext) {
      btnNext.textContent = window.CONSTANTS.UI.BUTTON_NEXT;
      btnNext.style.display = 'block';
    }
    if (progressDotsTop) progressDotsTop.style.display = 'flex';
  }

  updateProgress();
  updateIndex();
}

/**
 * Navigate to a specific step
 * @param {number} step - Step index to navigate to
 */
export function goToStep(step) {
  if (step === state.currentStep) {
    const scrollable = getScrollableContainer();
    if (scrollable) {
      scrollable.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(updateFadeGradients, 400);
    }
    return;
  }

  triggerPassingEffect(state.currentStep, step);
  saveScrollPosition();
  state.setCurrentStep(step);
  showStep(step);
}

/**
 * Trigger passing effect on sidebar items
 */
export function triggerPassingEffect(fromStep, toStep) {
  const direction = toStep > fromStep ? 1 : -1;
  const travelTime = 350;
  const passingDuration = 40;

  const start = Math.min(fromStep, toStep) + 1;
  const end = Math.max(fromStep, toStep);
  const itemCount = end - start;

  if (itemCount <= 0) return;

  const delayPerItem = travelTime / (itemCount + 1);

  for (let i = start; i < end; i++) {
    const item = document.querySelector(`.index-item[data-step="${i}"], .index-divider-clickable[data-step="${i}"]`);
    if (!item) continue;

    const position = direction > 0 ? (i - start) : (end - 1 - i - start);
    const delay = delayPerItem * (position + 1);

    setTimeout(() => {
      item.classList.add('passing');
      setTimeout(() => item.classList.remove('passing'), passingDuration);
    }, delay);
  }
}

/**
 * Go to next step
 */
export function nextStep() {
  saveScrollPosition();
  if (state.currentStep === 13) {
    state.setCurrentStep(window.CONFIG.REVIEW_STEP);
    showStep(state.currentStep);
  } else if (state.currentStep < 13) {
    state.setCurrentStep(state.currentStep + 1);
    showStep(state.currentStep);
  }
}

/**
 * Go to previous step
 */
export function prevStep() {
  saveScrollPosition();
  if (state.currentStep > 0) {
    state.setCurrentStep(state.currentStep - 1);
    showStep(state.currentStep);
  }
}

/**
 * Initialize mobile drawer functionality
 */
export function initMobileDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('mobileOverlay');
  const index = document.querySelector('.index');

  if (!menuBtn || !overlay || !index) return;

  menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMobileDrawer();
  });

  overlay.addEventListener('click', function() {
    closeMobileDrawer();
  });

  index.addEventListener('click', function(e) {
    const indexItem = e.target.closest('.index-item, .index-divider-clickable');
    if (indexItem && indexItem.dataset.action === 'goToStep') {
      setTimeout(closeMobileDrawer, 150);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && index.classList.contains('mobile-open')) {
      closeMobileDrawer();
    }
  });

  index.addEventListener('scroll', function() {
    updateMobileHighlighter();
  }, { passive: true });

  // Handle swipe gestures
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance > swipeThreshold && touchStartX < 50) {
      openMobileDrawer();
    }

    if (swipeDistance < -swipeThreshold && index.classList.contains('mobile-open')) {
      closeMobileDrawer();
    }
  }
}

/**
 * Toggle mobile drawer
 */
export function toggleMobileDrawer() {
  const index = document.querySelector('.index');
  if (index.classList.contains('mobile-open')) {
    closeMobileDrawer();
  } else {
    openMobileDrawer();
  }
}

/**
 * Open mobile drawer
 */
export function openMobileDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('mobileOverlay');
  const index = document.querySelector('.index');

  menuBtn.classList.add('active');
  overlay.classList.add('active');
  index.classList.add('mobile-open');
  document.body.classList.add('mobile-drawer-open');

  requestAnimationFrame(updateMobileHighlighter);
}

/**
 * Close mobile drawer
 */
export function closeMobileDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('mobileOverlay');
  const index = document.querySelector('.index');

  menuBtn.classList.remove('active');
  overlay.classList.remove('active');
  index.classList.remove('mobile-open');
  document.body.classList.remove('mobile-drawer-open');
}

/**
 * Reset a radio button group
 * @param {string} name - The field name to reset
 */
export function resetGroup(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
    input.checked = false;
    const card = input.closest('.option-card');
    if (card) {
      card.classList.remove(window.CONSTANTS.CSS.SELECTED);
    }
  });

  const header = document.getElementById(`header-${name}`);
  if (header) header.classList.remove(window.CONSTANTS.CSS.HAS_VALUE);

  const conditionalId = window.CONSTANTS.CONDITIONAL_FIELDS[name];
  if (conditionalId) {
    toggleConditional(conditionalId, false);
  }

  updateAllSections();
  updateIndexStatus();
  saveFormData();
}
