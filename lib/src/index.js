/**
 * @vragenlijst/forms — Schema-driven form component library
 *
 * Main entry point. Import this module to get access to:
 * - Schema rendering (JSON → HTML)
 * - Interactive component initialization
 * - Progress tracking
 * - Modal dialogs
 *
 * @example
 *   import { renderForm, initForm } from '@vragenlijst/forms';
 *   import '@vragenlijst/forms/css';
 *
 *   const schema = { steps: [...], likertOptions: [...] };
 *   document.getElementById('root').innerHTML = renderForm(schema);
 *   const form = initForm(document.querySelector('.vl-form'));
 */

// CSS (imported for bundlers that handle CSS imports)
import './css/index.css';

// Schema
export { validateSchema, DEFAULT_LIKERT_OPTIONS, DEFAULT_LABELS } from './schema.js';

// Renderer
export { renderForm, renderSingleStep } from './renderer.js';

// Components — individual exports for granular use
import { initRadioCards, resetRadioGroup } from './components/radio-cards.js';
import { initConditionals, syncConditionals } from './components/conditionals.js';
import { initLikertTables, refreshLikertPills, resetLikertTable } from './components/likert-table.js';
import { initNavigation } from './components/navigation.js';
import { createModal } from './components/modal.js';
import { updateProgressBar, renderProgressDots, calculateProgress } from './components/progress.js';

export {
  initRadioCards, resetRadioGroup,
  initConditionals, syncConditionals,
  initLikertTables, refreshLikertPills, resetLikertTable,
  initNavigation,
  createModal,
  updateProgressBar, renderProgressDots, calculateProgress
};

/**
 * Initialize all interactive behaviors on a rendered form.
 *
 * This is the primary convenience function. It calls all component
 * initializers and wires up data-action event delegation.
 *
 * @param {HTMLElement} root - The .vl-form container
 * @param {Object} [options]
 * @param {Function} [options.onStepChange]       - (newStep, oldStep, direction) => void
 * @param {Function} [options.beforeStepChange]   - (newStep, oldStep) => boolean
 * @param {Function} [options.onFormChange]        - (fieldName, value) => void
 * @param {number}   [options.mobileBreakpoint]    - Default 768
 * @param {Array}    [options.likertOptions]        - Override mobile likert labels
 * @returns {Object} Controller with goToStep, getProgress, etc.
 */
export function initForm(root, options = {}) {
  if (!root || !root.querySelector) {
    throw new Error('initForm requires a DOM element');
  }

  // Initialize all components
  initRadioCards(root);
  initConditionals(root);
  initLikertTables(root, {
    mobileBreakpoint: options.mobileBreakpoint,
    likertOptions: options.likertOptions
  });

  const nav = initNavigation(root, {
    onStepChange: options.onStepChange,
    beforeStepChange: options.beforeStepChange
  });

  // Wire up reset actions and comments toggle
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    if (action === 'resetGroup') {
      resetRadioGroup(root, target.dataset.name);
    } else if (action === 'resetLikertTable') {
      resetLikertTable(root, target.dataset.table);
    } else if (action === 'toggleComments') {
      const stepId = target.dataset.step;
      const commentsField = root.querySelector(`#comments-field-${stepId}`);
      if (commentsField) commentsField.classList.toggle('show');
    }
  });

  // Form change tracking
  if (options.onFormChange) {
    const form = root.querySelector('form');
    if (form) {
      form.addEventListener('input', (e) => {
        if (e.target.name) options.onFormChange(e.target.name, e.target.value);
      });
      form.addEventListener('change', (e) => {
        if (e.target.name) {
          const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          options.onFormChange(e.target.name, value);
        }
      });
    }
  }

  return {
    /** Navigate to a specific step index */
    goToStep: nav.goToStep,

    /** Get current navigation state: { currentStep, totalSteps } */
    getState: nav.getState,

    /** Calculate overall form completion percentage (0-100) */
    getProgress() {
      const form = root.querySelector('form');
      return form ? calculateProgress(form) : 0;
    },

    /** Get all form field values as a plain object */
    getFormData() {
      const form = root.querySelector('form');
      if (!form) return {};
      const data = new FormData(form);
      const result = {};
      for (const [key, value] of data.entries()) {
        result[key] = value;
      }
      return result;
    },

    /** Sync conditional visibility to current field state (call after loading data) */
    syncConditionals() {
      syncConditionals(root);
    },

    /** Cleanup */
    destroy() {
      // Reserved for future teardown
    }
  };
}
