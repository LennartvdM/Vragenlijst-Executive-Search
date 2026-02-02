/**
 * Form data management module
 * Handles saving, loading, and submitting form data
 */

import * as state from './state.js';
import { showValidationModal, showErrorModal, showPreviewModal } from './modals.js';
import { toggleConditional, checkConditionalCompletion } from './validation.js';
import { updateAllSections, updateIndexStatus } from './progress.js';
import { clearScrollPositions } from './scroll.js';
import { createLikertPill } from './likert.js';

/**
 * Save form data to localStorage
 */
export function saveFormData() {
  const form = document.getElementById('monitoringForm');
  const data = {};
  new FormData(form).forEach((v, k) => data[k] = v);
  window.Storage.saveFormData(data);
}

/**
 * Load saved form data from localStorage and restore UI state
 */
export function loadSavedFormData() {
  const data = window.Storage.getFormData();
  if (!data) return;

  Object.entries(data).forEach(([name, value]) => {
    const input = document.querySelector(`[name="${name}"]`);
    if (!input) return;

    if (input.type === 'radio') {
      const radio = document.querySelector(`[name="${name}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
        const card = radio.closest('.option-card');
        if (card) card.classList.add(window.CONSTANTS.CSS.SELECTED);

        const header = document.getElementById(`header-${name}`);
        if (header) header.classList.add(window.CONSTANTS.CSS.HAS_VALUE);

        const conditionalId = window.CONSTANTS.CONDITIONAL_FIELDS[name];
        if (conditionalId) {
          const triggerValue = window.CONSTANTS.CONDITIONAL_VALUES && window.CONSTANTS.CONDITIONAL_VALUES[name]
            ? window.CONSTANTS.CONDITIONAL_VALUES[name]
            : window.CONSTANTS.ANSWERS.YES;
          if (value === triggerValue) {
            toggleConditional(conditionalId, true);
          }
        }

        const row = radio.closest('tr');
        if (row) {
          row.classList.add(window.CONSTANTS.CSS.ANSWERED);
          createLikertPill(row);
          const table = radio.closest('.likert-table');
          if (table && table.id) {
            const header = document.getElementById(`header-${table.id}`);
            if (header) header.classList.add(window.CONSTANTS.CSS.HAS_VALUE);
          }
        }
      }
    } else if (input.type === 'checkbox') {
      input.checked = value === 'on' || value === true;
    } else {
      input.value = value;
      if (name.startsWith('opmerkingen_stap_') && value.trim() !== '') {
        const step = name.replace('opmerkingen_stap_', '');
        const field = document.getElementById(`comments-field-${step}`);
        if (field) field.classList.add(window.CONSTANTS.CSS.SHOW);
      }
      if (name === 'voorbeeld_organisatie') {
        const editor = document.getElementById('voorbeeld-organisatie-editor');
        if (editor) editor.textContent = value;
      }
    }
  });

  updateAllSections();
  updateIndexStatus();
  updateAllOptionCardConditionalStatuses();

  if (typeof window.syncLikertSegments === 'function') {
    window.syncLikertSegments();
  }
}

/**
 * Collect all form data including metadata
 * @returns {Object} Form data with timestamp, orgCode, and orgName
 */
export function getFormData() {
  const form = document.getElementById('monitoringForm');
  const data = {};
  new FormData(form).forEach((v, k) => data[k] = v);

  data.timestamp = new Date().toISOString();
  data.orgCode = state.session.orgCode;
  data.orgName = state.session.orgName;

  return data;
}

/**
 * Submit the form to the backend
 */
export async function submitForm(goToStep) {
  const ondertekenaar = document.querySelector('[name="ondertekenaar"]');
  const bevestiging = document.querySelector('[name="bevestiging"]');

  if (!ondertekenaar || !ondertekenaar.value.trim()) {
    showValidationModal(
      'Nog niet compleet',
      'Vul de naam van de CEO/directeur in voordat u het formulier kunt verzenden.',
      {
        linkText: 'Ga naar ondertekenen →',
        linkAction: () => {
          goToStep(13);
          setTimeout(() => ondertekenaar && ondertekenaar.focus(), 100);
        }
      }
    );
    return;
  }

  if (!bevestiging || !bevestiging.checked) {
    showValidationModal(
      'Bevestiging vereist',
      'Bevestig dat de gegevens naar waarheid zijn ingevuld voordat u het formulier kunt verzenden.',
      {
        linkText: 'Ga naar ondertekenen →',
        linkAction: () => goToStep(13)
      }
    );
    return;
  }

  const btn = document.getElementById('btnNext');
  const btnTop = document.getElementById('btnNextTop');
  const originalText = btn ? btn.textContent : window.CONSTANTS.UI.BUTTON_SUBMIT;

  if (btn) {
    btn.disabled = true;
    btn.textContent = window.CONSTANTS.UI.BUTTON_SUBMITTING;
  }
  if (btnTop) {
    btnTop.disabled = true;
    btnTop.textContent = window.CONSTANTS.UI.BUTTON_SUBMITTING;
  }

  try {
    const formData = getFormData();
    console.log('[FORM] Submitting survey...', { orgCode: formData.orgCode, fieldsCount: Object.keys(formData).length, method: 'POST' });

    if (!window.ApiClient.isConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const orgName = formData.organisatie || state.session.orgName || 'Onbekende organisatie';
      window.Storage.addSubmittedForm(formData, orgName);

      state.setCurrentStep(window.CONFIG.SUCCESS_STEP);
      document.dispatchEvent(new CustomEvent('showStep', { detail: { step: state.currentStep } }));

      window.Storage.clearFormData();
      clearScrollPositions();
      return;
    }

    const result = await window.ApiClient.submitSurvey(formData);

    if (result.success) {
      const orgName = formData.organisatie || state.session.orgName || 'Onbekende organisatie';
      window.Storage.addSubmittedForm(formData, orgName);

      state.setCurrentStep(window.CONFIG.SUCCESS_STEP);
      document.dispatchEvent(new CustomEvent('showStep', { detail: { step: state.currentStep } }));

      if (result.documentUrl) {
        const docLink = document.getElementById('docLink');
        const docLinkAnchor = document.getElementById('docLinkAnchor');
        if (docLink && docLinkAnchor) {
          docLinkAnchor.href = result.documentUrl;
          docLink.style.display = 'block';
        }
      }

      window.Storage.clearFormData();
      clearScrollPositions();
    } else {
      throw new Error(result.message || window.CONSTANTS.ERRORS.SUBMIT_ERROR);
    }
  } catch (e) {
    console.error('[FORM] Submit failed:', e.message, e.code || '', e);
    showErrorModal(
      'Verzenden mislukt',
      window.CONSTANTS.ERRORS.SUBMIT_ERROR
    );
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
    if (btnTop) {
      btnTop.disabled = false;
      btnTop.textContent = originalText;
    }
  }
}

/**
 * Handle confirm submit action from review page
 */
export function handleConfirmSubmit(goToStep) {
  if (state.session && state.session.isPublic) {
    showPreviewModal();
    return;
  }

  const checkbox = document.getElementById('confirmIncomplete');
  if (checkbox && !checkbox.checked) {
    return;
  }

  submitForm(goToStep);
}

/**
 * Clear all form data and restart fresh
 */
export function clearFormAndRestart(showStep) {
  window.Storage.clearFormData();
  clearScrollPositions();

  const form = document.getElementById('monitoringForm');
  if (form) {
    form.reset();
  }

  document.querySelectorAll('.option-card').forEach(card => {
    card.classList.remove(window.CONSTANTS.CSS.SELECTED, 'awaiting-conditional', 'conditional-satisfied');
  });

  document.querySelectorAll('.question-header').forEach(header => {
    header.classList.remove(window.CONSTANTS.CSS.HAS_VALUE);
  });

  document.querySelectorAll('.conditional').forEach(conditional => {
    conditional.classList.remove(window.CONSTANTS.CSS.VISIBLE);
  });

  document.querySelectorAll('.comments-field').forEach(field => {
    field.classList.remove(window.CONSTANTS.CSS.VISIBLE);
  });

  document.querySelectorAll('.section-header').forEach(header => {
    header.classList.remove('complete', 'partial');
    const icon = header.querySelector('.status-icon');
    if (icon) icon.textContent = '○';
  });

  const warningModal = document.getElementById('clearWarningModal');
  if (warningModal) warningModal.style.display = 'none';
  document.body.style.overflow = '';

  state.setCurrentStep(0);
  state.setPreviousStep(-1);
  state.setReviewVisited(false);
  state.setInitialReviewItems(null);
  showStep(0);
  updateIndexStatus();
}

/**
 * Initialize organization info display
 */
export function initializeOrganizationInfo() {
  const orgNameEl = document.getElementById('orgNameDisplay');
  const orgCodeEl = document.getElementById('orgCodeDisplay');
  const orgField = document.getElementById('organisatieField');

  if (orgNameEl) orgNameEl.textContent = state.session.orgName || '-';
  if (orgCodeEl) orgCodeEl.textContent = state.session.orgCode || '-';

  if (orgField && state.session.orgName) {
    orgField.value = state.session.orgName;
    orgField.dispatchEvent(new Event('input'));
  }
}

/**
 * Update all option cards that have conditional requirements
 */
export function updateAllOptionCardConditionalStatuses() {
  Object.keys(window.CONSTANTS.CONDITIONAL_REQUIREMENTS).forEach(fieldName => {
    updateOptionCardConditionalStatus(fieldName);
  });
}

/**
 * Update option card conditional status classes
 * @param {string} fieldName - The field name to update
 */
export function updateOptionCardConditionalStatus(fieldName) {
  const selectedRadio = document.querySelector(`[name="${fieldName}"]:checked`);
  if (!selectedRadio) return;

  const card = selectedRadio.closest('.option-card');
  if (!card) return;

  card.classList.remove('awaiting-conditional', 'conditional-satisfied');

  const conditionalStatus = checkConditionalCompletion(fieldName);
  if (conditionalStatus.triggered) {
    if (conditionalStatus.filled) {
      card.classList.add('conditional-satisfied');
    } else {
      card.classList.add('awaiting-conditional');
    }
  }
}

/**
 * Logout and return to login page
 */
export function logout() {
  window.Storage.clearSession();
  // Clean /inkijkexemplaar URL back to /
  if (window.location.pathname === '/inkijkexemplaar') {
    window.history.replaceState({}, '', '/');
  }
  if (typeof window.App !== 'undefined' && window.App.transitionToLogin) {
    window.App.transitionToLogin();
  } else {
    window.location.href = '/index.html?logout=1';
  }
}
