/**
 * Navigation — Step transitions
 *
 * Handles multi-step form navigation: prev/next, sidebar clicks,
 * step visibility, button state, progress updates.
 */

/**
 * @typedef {Object} NavigationState
 * @property {number} currentStep
 * @property {number} totalSteps
 */

/**
 * Initialize navigation within a .vl-form container.
 * @param {HTMLElement} root - The .vl-form element
 * @param {Object} [options]
 * @param {Function} [options.onStepChange] - Callback: (newStep, oldStep) => void
 * @param {Function} [options.beforeStepChange] - Callback: (newStep, oldStep) => boolean (return false to prevent)
 * @returns {{ goToStep: Function, getState: Function }}
 */
export function initNavigation(root, options = {}) {
  const steps = root.querySelectorAll('.vl-step');
  const totalSteps = steps.length;
  let currentStep = 0;

  function goToStep(step) {
    if (step < 0 || step >= totalSteps) return;
    if (step === currentStep) return;

    // Allow external validation/prevention
    if (options.beforeStepChange) {
      const allowed = options.beforeStepChange(step, currentStep);
      if (allowed === false) return;
    }

    const oldStep = currentStep;
    const direction = step > currentStep ? 'forward' : 'backward';

    // Hide current step
    steps[currentStep].classList.remove('active');

    // Show new step
    currentStep = step;
    steps[currentStep].classList.add('active');

    // Update navigation buttons
    updateNavButtons(root, currentStep, totalSteps);

    // Update sidebar nav
    updateSidebarNav(root, currentStep);

    // Scroll to top of content area
    const scrollable = root.querySelector('.vl-content-scrollable');
    if (scrollable) scrollable.scrollTop = 0;

    if (options.onStepChange) {
      options.onStepChange(currentStep, oldStep, direction);
    }
  }

  function getState() {
    return { currentStep, totalSteps };
  }

  // Wire up data-action handlers
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    if (action === 'nextStep') {
      goToStep(currentStep + 1);
    } else if (action === 'prevStep') {
      goToStep(currentStep - 1);
    } else if (action === 'goToStep') {
      const step = parseInt(target.dataset.step, 10);
      if (!isNaN(step)) goToStep(step);
    }
  });

  // Initial state
  updateNavButtons(root, currentStep, totalSteps);
  updateSidebarNav(root, currentStep);

  return { goToStep, getState };
}

function updateNavButtons(root, currentStep, totalSteps) {
  root.querySelectorAll('[data-action="prevStep"]').forEach(btn => {
    btn.hidden = currentStep === 0;
  });

  root.querySelectorAll('[data-action="nextStep"]').forEach(btn => {
    btn.hidden = currentStep >= totalSteps - 1;
  });
}

function updateSidebarNav(root, currentStep) {
  root.querySelectorAll('.vl-nav-item').forEach(item => {
    const step = parseInt(item.dataset.step, 10);
    item.classList.toggle('active', step === currentStep);
  });
}
