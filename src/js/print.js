/**
 * Print functionality module
 * Handles printing forms and archived submissions
 */

import * as state from './state.js';
import { showErrorModal } from './modals.js';
import { showStep } from './navigation.js';
import { getFormData } from './form.js';

/**
 * Print the complete form with all pages
 */
export function printForm() {
  const originalStep = state.currentStep;

  const steps = document.querySelectorAll('.step');
  steps.forEach(step => {
    if (step.dataset.step !== '6') {
      step.classList.add('active');
    }
  });

  window.print();

  setTimeout(() => {
    steps.forEach(step => {
      step.classList.remove('active');
    });
    showStep(originalStep);
  }, 100);
}

/**
 * Print an archived form by temporarily loading its data
 * @param {string} formId - The ID of the archived form to print
 */
export function printArchivedForm(formId) {
  const archivedForm = window.Storage.getSubmittedFormById(formId);
  if (!archivedForm) {
    showErrorModal(
      'Niet gevonden',
      'Het formulier kon niet worden gevonden.'
    );
    return;
  }

  const currentFormData = getFormData();
  const originalStep = state.currentStep;

  const form = document.getElementById('monitoringForm');
  if (!form) return;

  // Clear current form state
  form.reset();
  document.querySelectorAll('.option-card').forEach(card => {
    card.classList.remove(window.CONSTANTS.CSS.SELECTED);
  });

  // Load archived data
  const data = archivedForm.data;
  for (const [key, value] of Object.entries(data)) {
    if (key === 'timestamp' || key === 'orgCode' || key === 'orgName') continue;

    const field = form.elements[key];
    if (!field) continue;

    if (field.type === 'checkbox') {
      field.checked = value === 'on' || value === true;
    } else if (field.type === 'radio') {
      const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
        const card = radio.closest('.option-card');
        if (card) card.classList.add(window.CONSTANTS.CSS.SELECTED);
      }
    } else {
      field.value = value;
    }
  }

  // Show all content steps for printing
  const steps = document.querySelectorAll('.step');
  steps.forEach(step => {
    const stepNum = parseInt(step.dataset.step, 10);
    if (stepNum <= 13) {
      step.classList.add('active');
    }
  });

  // Hide the modal during print
  const modal = document.getElementById('restartChoiceModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';

  window.print();

  // Restore original state after print dialog closes
  setTimeout(() => {
    steps.forEach(step => {
      step.classList.remove('active');
    });

    form.reset();
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove(window.CONSTANTS.CSS.SELECTED);
    });

    if (currentFormData) {
      for (const [key, value] of Object.entries(currentFormData)) {
        const field = form.elements[key];
        if (!field) continue;

        if (field.type === 'checkbox') {
          field.checked = value === 'on' || value === true;
        } else if (field.type === 'radio') {
          const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
          if (radio) {
            radio.checked = true;
            const card = radio.closest('.option-card');
            if (card) card.classList.add(window.CONSTANTS.CSS.SELECTED);
          }
        } else {
          field.value = value;
        }
      }
    }

    showStep(originalStep);

    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }, 100);
}
