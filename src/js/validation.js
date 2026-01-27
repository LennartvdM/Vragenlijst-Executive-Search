/**
 * Validation module
 * Handles field validation and conditional logic
 */

import { CONDITIONAL_PARENT_MAP, LIKERT_LABELS, STEP_LABELS } from './state.js';

/**
 * Check if a field is filled
 * @param {string} fieldName - The field name to check
 * @returns {boolean} True if the field has a value
 */
export function isFieldFilled(fieldName) {
  const input = document.querySelector(`[name="${fieldName}"]`);
  if (!input) return false;

  if (input.type === 'radio') {
    const checked = document.querySelector(`[name="${fieldName}"]:checked`);
    return !!checked;
  } else if (input.type === 'checkbox') {
    return input.checked;
  } else {
    return input.value && input.value.trim() !== '';
  }
}

/**
 * Check if a field is a conditional field
 * @param {string} fieldName - The field name to check
 * @returns {boolean} True if the field is conditional
 */
export function isConditionalField(fieldName) {
  return !!CONDITIONAL_PARENT_MAP[fieldName];
}

/**
 * Check if a conditional field's parent condition is active
 * @param {string} fieldName - The conditional field name
 * @returns {boolean} True if the parent condition is met (field should be visible)
 */
export function isConditionalActive(fieldName) {
  const parentInfo = CONDITIONAL_PARENT_MAP[fieldName];
  if (!parentInfo) return true;

  const parentInput = document.querySelector(`[name="${parentInfo.parent}"]:checked`);
  if (!parentInput) return false;

  return parentInput.value === parentInfo.value;
}

/**
 * Check if conditional fields for a parent field are filled
 * @param {string} parentField - The parent field name
 * @returns {Object} { triggered: boolean, filled: boolean }
 */
export function checkConditionalCompletion(parentField) {
  const requirements = window.CONSTANTS.CONDITIONAL_REQUIREMENTS[parentField];
  if (!requirements) {
    return { triggered: false, filled: true };
  }

  const parentInput = document.querySelector(`[name="${parentField}"]:checked`);
  if (!parentInput) {
    return { triggered: false, filled: true };
  }

  if (parentInput.value !== requirements.triggerValue) {
    return { triggered: false, filled: true };
  }

  let allFilled = true;
  requirements.requiredFields.forEach(fieldName => {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) {
      allFilled = false;
      return;
    }
    if (input.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldName}"]:checked`);
      if (!checked) allFilled = false;
    } else if (!input.value || input.value.trim() === '') {
      allFilled = false;
    }
  });

  return { triggered: true, filled: allFilled };
}

/**
 * Check if a Likert table is incomplete
 * @param {string[]} fields - Array of field names in the Likert table
 * @returns {Object} { incomplete: boolean, filled: number, total: number }
 */
export function checkLikertTableStatus(fields) {
  let filled = 0;
  const total = fields.length;

  fields.forEach(fieldName => {
    if (isFieldFilled(fieldName)) {
      filled++;
    }
  });

  return {
    incomplete: filled < total,
    filled: filled,
    total: total
  };
}

/**
 * Get all incomplete items grouped by section/step
 * @returns {Array} Array of incomplete item objects
 */
export function getIncompleteItems() {
  const incompleteItems = [];
  const processedLikertFields = new Set();

  Object.keys(window.CONFIG.STEP_FIELDS).forEach(stepStr => {
    const step = parseInt(stepStr, 10);
    const fields = window.CONFIG.STEP_FIELDS[step];
    const stepLabel = STEP_LABELS[step] || `Stap ${step}`;

    // Check for Likert tables in this step
    Object.keys(LIKERT_LABELS).forEach(tableId => {
      const tableInfo = LIKERT_LABELS[tableId];
      if (tableInfo.step === step) {
        const status = checkLikertTableStatus(tableInfo.fields);
        if (status.incomplete) {
          incompleteItems.push({
            step: step,
            stepLabel: stepLabel,
            label: tableInfo.label,
            type: 'likert',
            filled: status.filled,
            total: status.total
          });
        }
        tableInfo.fields.forEach(f => processedLikertFields.add(f));
      }
    });

    // Check non-Likert fields
    const nonLikertMissing = [];
    fields.forEach(fieldName => {
      if (processedLikertFields.has(fieldName)) return;
      if (isConditionalField(fieldName) && !isConditionalActive(fieldName)) {
        return;
      }
      if (!isFieldFilled(fieldName)) {
        nonLikertMissing.push(fieldName);
      }
    });

    // Also check conditional fields that are active
    Object.keys(CONDITIONAL_PARENT_MAP).forEach(conditionalField => {
      const parentInfo = CONDITIONAL_PARENT_MAP[conditionalField];
      const parentStep = Object.keys(window.CONFIG.STEP_FIELDS).find(s =>
        window.CONFIG.STEP_FIELDS[s].includes(parentInfo.parent)
      );

      if (parseInt(parentStep, 10) === step) {
        if (isConditionalActive(conditionalField) && !isFieldFilled(conditionalField)) {
          if (!nonLikertMissing.includes(conditionalField)) {
            nonLikertMissing.push(conditionalField);
          }
        }
      }
    });

    if (nonLikertMissing.length > 0) {
      incompleteItems.push({
        step: step,
        stepLabel: stepLabel,
        label: stepLabel,
        type: 'fields',
        missingFields: nonLikertMissing,
        count: nonLikertMissing.length
      });
    }
  });

  return incompleteItems;
}

/**
 * Get the current value of a field
 * @param {string} fieldName - The field name
 * @returns {string} The field value
 */
export function getFieldValue(fieldName) {
  const input = document.querySelector(`[name="${fieldName}"]`);
  if (!input) return '';

  if (input.type === 'radio') {
    const checked = document.querySelector(`[name="${fieldName}"]:checked`);
    return checked ? checked.value : '';
  } else if (input.type === 'checkbox') {
    return input.checked ? 'true' : '';
  } else {
    return input.value || '';
  }
}

/**
 * Toggle conditional field visibility
 * @param {string} id - The element ID to toggle
 * @param {boolean} show - Whether to show or hide
 */
export function toggleConditional(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle(window.CONSTANTS.CSS.SHOW, show);
}

/**
 * Toggle comments field visibility for a specific step
 * @param {number} step - The step index
 */
export function toggleComments(step) {
  const field = document.getElementById(`comments-field-${step}`);
  if (field) {
    field.classList.toggle(window.CONSTANTS.CSS.SHOW);
    if (field.classList.contains(window.CONSTANTS.CSS.SHOW)) {
      const textarea = field.querySelector('textarea');
      if (textarea) textarea.focus();
    }
  }
}
