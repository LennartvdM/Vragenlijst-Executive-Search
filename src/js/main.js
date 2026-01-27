/**
 * Main entry point for the Survey module
 * Initializes all modules and sets up event handling
 */

import * as state from './state.js';
import * as scroll from './scroll.js';
import * as navigation from './navigation.js';
import * as progress from './progress.js';
import * as validation from './validation.js';
import * as form from './form.js';
import * as modals from './modals.js';
import * as likert from './likert.js';
import * as review from './review.js';
import * as utils from './utils.js';
import * as print from './print.js';

// Note: CSS is handled separately via link tags in HTML

/**
 * Initialize the survey module
 */
function initSurvey() {
  // Always setup event delegation first so navigation works
  setupEventDelegation();

  const formEl = document.getElementById('monitoringForm');
  if (!formEl) {
    return false;
  }

  // Get session
  state.setSession(window.Storage.getSession());
  if (!state.session || !state.session.orgCode) {
    return false;
  }

  // Initialize UI
  form.initializeOrganizationInfo();
  modals.initPreviewMode(state.session);
  progress.initProgress();

  // Initialize alignment rig
  setTimeout(progress.updateAlignmentRig, 50);
  window.addEventListener('resize', progress.updateAlignmentRig);

  // Setup remaining functionality
  setupInputListeners();
  setupAutoSave();
  form.loadSavedFormData();
  utils.setupWordCounter();
  utils.setupTextareaWordCounters();
  progress.updateIndexStatus();

  // Load saved scroll positions before showing step
  scroll.loadScrollPositions();
  navigation.showStep(0);

  // Initialize mobile drawer
  navigation.initMobileDrawer();

  // Initialize mobile Likert controls
  likert.initMobileLikert();

  // Initialize Likert radio overlays
  likert.initLikertRadioOverlays();

  // Initialize date picker
  utils.initDatePicker();

  // Listen for scroll events
  const scrollable = document.getElementById('contentScrollable');
  if (scrollable) {
    scrollable.addEventListener('scroll', scroll.handleScroll, { passive: true });
  }

  // Initialize fade gradients and custom scrollbar
  setTimeout(scroll.updateFadeGradients, 100);
  setTimeout(scroll.updateCustomScrollbar, 100);

  // Setup custom scrollbar drag
  scroll.initCustomScrollbarDrag();

  return true;
}

/**
 * Setup event delegation for all interactive elements
 */
function setupEventDelegation() {
  document.addEventListener('click', function(event) {
    const target = event.target;

    const actionElement = target.closest('[data-action]');
    if (actionElement) {
      const action = actionElement.dataset.action;
      handleAction(action, actionElement, event);
      return;
    }

    const optionCard = target.closest('.option-card');
    if (optionCard) {
      handleOptionCardClick(optionCard);
      return;
    }
  });
}

/**
 * Handle actions triggered by data-action attributes
 */
function handleAction(action, element, event) {
  switch (action) {
    case 'goToStep':
      const step = parseInt(element.dataset.step, 10);
      navigation.goToStep(step);
      break;

    case 'prevStep':
      navigation.prevStep();
      break;

    case 'nextStep':
      navigation.nextStep();
      break;

    case 'toggleComments':
      const commentStep = parseInt(element.dataset.step, 10);
      validation.toggleComments(commentStep);
      break;

    case 'resetGroup':
      const name = element.dataset.name;
      navigation.resetGroup(name);
      break;

    case 'resetLikertTable':
      const tableId = element.dataset.table;
      likert.resetLikertTable(tableId);
      progress.updateAllSections();
      progress.updateIndexStatus();
      form.saveFormData();
      break;

    case 'logout':
      event.preventDefault();
      form.logout();
      break;

    case 'printForm':
      print.printForm();
      break;

    case 'confirmSubmit':
      form.handleConfirmSubmit(navigation.goToStep);
      break;

    case 'toggleAccordion':
      const accordionId = element.dataset.accordion;
      if (accordionId) {
        review.toggleAccordion(accordionId);
      }
      break;

    case 'goToReview':
      navigation.goToStep(window.CONFIG.REVIEW_STEP);
      break;

    case 'startNewForm':
      modals.showRestartChoiceModal();
      break;

    case 'continueExistingForm':
      modals.hideRestartChoiceModal();
      state.setCurrentStep(0);
      state.setPreviousStep(-1);
      state.setReviewVisited(false);
      state.setInitialReviewItems(null);
      navigation.showStep(0);
      progress.updateIndexStatus();
      break;

    case 'showClearWarning':
      modals.showClearWarningModal();
      break;

    case 'confirmClearForm':
      form.clearFormAndRestart(navigation.showStep);
      break;

    case 'cancelClearForm':
      modals.hideClearWarningModal();
      break;

    case 'printArchivedForm':
      const formId = element.dataset.formId;
      if (formId) print.printArchivedForm(formId);
      break;

    case 'closeValidationModal':
      modals.hideValidationModal();
      break;

    case 'closeErrorModal':
      modals.hideErrorModal();
      break;

    case 'closePreviewModal':
      modals.hidePreviewModal();
      break;
  }
}

/**
 * Handle option card clicks
 */
function handleOptionCardClick(card) {
  const input = card.querySelector('input[type="radio"]');
  if (!input) return;

  const name = input.name;
  const value = input.value;

  // Deselect all cards in the same group
  document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
    const parentCard = radio.closest('.option-card');
    if (parentCard) {
      parentCard.classList.remove(window.CONSTANTS.CSS.SELECTED, 'awaiting-conditional', 'conditional-satisfied');
    }
  });

  // Select this card
  card.classList.add(window.CONSTANTS.CSS.SELECTED);
  input.checked = true;

  // Update header state
  const header = document.getElementById(`header-${name}`);
  if (header) header.classList.add(window.CONSTANTS.CSS.HAS_VALUE);

  // Handle conditional field visibility
  const conditionalId = window.CONSTANTS.CONDITIONAL_FIELDS[name];
  if (conditionalId) {
    const triggerValue = window.CONSTANTS.CONDITIONAL_VALUES && window.CONSTANTS.CONDITIONAL_VALUES[name]
      ? window.CONSTANTS.CONDITIONAL_VALUES[name]
      : window.CONSTANTS.ANSWERS.YES;
    validation.toggleConditional(conditionalId, value === triggerValue);
  }

  // Update conditional status
  form.updateOptionCardConditionalStatus(name);

  progress.updateAllSections();
  progress.updateIndexStatus();
  form.saveFormData();
}

/**
 * Setup input change listeners
 */
function setupInputListeners() {
  document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      progress.updateAllSections();
      progress.updateIndexStatus();
      form.updateAllOptionCardConditionalStatuses();
    });
    input.addEventListener('change', () => {
      progress.updateAllSections();
      progress.updateIndexStatus();
      form.updateAllOptionCardConditionalStatuses();
    });
  });

  // Likert scale row highlighting
  document.querySelectorAll('.likert-table input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const row = this.closest('tr');
      row.classList.add(window.CONSTANTS.CSS.ANSWERED);
      likert.createLikertPill(row);

      row.classList.remove('just-answered');
      void row.offsetWidth;
      row.classList.add('just-answered');

      const table = this.closest('.likert-table');
      if (table && table.id) {
        const header = document.getElementById(`header-${table.id}`);
        if (header) header.classList.add(window.CONSTANTS.CSS.HAS_VALUE);
      }

      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        const lastRow = rows[rows.length - 1];
        const lastRowAnswered = lastRow && lastRow.classList.contains(window.CONSTANTS.CSS.ANSWERED);
        const answeredRows = table.querySelectorAll('tbody tr.answered').length;

        if (lastRowAnswered && answeredRows < rows.length) {
          table.classList.remove('has-missing');
          void table.offsetWidth;
          table.classList.add('has-missing');
        } else {
          table.classList.remove('has-missing');
        }
      }
      progress.updateIndexStatus();
    });
  });
}

/**
 * Setup auto-save functionality
 */
function setupAutoSave() {
  let saveTimeout;
  document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(form.saveFormData, window.CONSTANTS.TIMEOUTS.AUTO_SAVE_DELAY);
    });
    input.addEventListener('change', form.saveFormData);
  });

  const editor = document.getElementById('voorbeeld-organisatie-editor');
  if (editor) {
    editor.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(form.saveFormData, window.CONSTANTS.TIMEOUTS.AUTO_SAVE_DELAY);
    });
  }
}

// Listen for custom events
document.addEventListener('generateReview', () => {
  review.generateReviewContent();
});

document.addEventListener('showStep', (e) => {
  navigation.showStep(e.detail.step);
});

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  const formEl = document.getElementById('monitoringForm');
  if (formEl) {
    state.setSession(window.Storage.getSession());
    if (!state.session || !state.session.orgCode) {
      window.location.href = '/index.html';
      return;
    }
    initSurvey();
  }
});

// Export Survey module for use by App.js
window.Survey = {
  init: initSurvey
};

export { initSurvey };
