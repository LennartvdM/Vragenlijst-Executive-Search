/**
 * Review page module
 * Handles the review step with accordions for incomplete items
 */

import * as state from './state.js';
import { STEP_LABELS, FIELD_LABELS, LIKERT_LABELS } from './state.js';
import { isFieldFilled, checkLikertTableStatus, getFieldValue } from './validation.js';
import { updateAllSections, updateIndexStatus } from './progress.js';
import { saveFormData } from './form.js';

/**
 * Generate the review content HTML
 */
export function generateReviewContent() {
  const reviewContent = document.getElementById('reviewContent');
  if (!reviewContent) return;

  const reviewItems = state.initialReviewItems || [];

  if (reviewItems.length === 0) {
    reviewContent.innerHTML = `
      <div class="review-complete">
        <div class="review-complete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>Alle velden zijn ingevuld!</h3>
        <p>Uw formulier is volledig ingevuld. U kunt nu verzenden.</p>
        <button type="button" class="btn btn-primary btn-submit-review" data-action="confirmSubmit">
          Verzenden
        </button>
      </div>
    `;
    return;
  }

  let allNowComplete = true;
  let itemsHtml = '';
  let accordionIndex = 0;

  const itemsByStep = {};
  reviewItems.forEach(item => {
    if (!itemsByStep[item.step]) {
      itemsByStep[item.step] = [];
    }
    itemsByStep[item.step].push(item);
  });

  Object.keys(itemsByStep).sort((a, b) => parseInt(a) - parseInt(b)).forEach(step => {
    const items = itemsByStep[step];

    items.forEach(item => {
      const accordionId = `accordion-${accordionIndex}`;
      accordionIndex++;

      let isNowComplete = false;
      let currentFilled = 0;
      let currentRemaining = 0;

      if (item.type === 'likert') {
        const tableKey = Object.keys(LIKERT_LABELS).find(k =>
          LIKERT_LABELS[k].step === item.step && LIKERT_LABELS[k].label === item.label
        );
        const status = checkLikertTableStatus(tableKey ? LIKERT_LABELS[tableKey].fields : []);
        currentFilled = status.filled;
        isNowComplete = !status.incomplete;
      } else {
        item.missingFields.forEach(fieldName => {
          if (isFieldFilled(fieldName)) {
            currentFilled++;
          } else {
            currentRemaining++;
          }
        });
        isNowComplete = currentRemaining === 0;
      }

      if (!isNowComplete) {
        allNowComplete = false;
      }

      const completedClass = isNowComplete ? 'accordion-complete' : '';

      if (item.type === 'likert') {
        const accordionContent = generateLikertAccordionContent(item);
        const statusText = isNowComplete
          ? `${item.total} van ${item.total} ingevuld`
          : `${currentFilled} van ${item.total} ingevuld`;

        itemsHtml += `
          <div class="review-item-accordion ${completedClass}">
            <div class="review-item-header" data-action="toggleAccordion" data-accordion="${accordionId}">
              <div class="review-item-info">
                <span class="review-item-step">${item.stepLabel}</span>
                <span class="review-item-label">${item.label}</span>
                <span class="review-item-count" id="${accordionId}-count">${statusText}</span>
              </div>
              <div class="review-item-actions">
                <button type="button" class="btn btn-secondary btn-review-goto" data-action="goToStep" data-step="${item.step}">
                  Naar sectie &rarr;
                </button>
                <span class="accordion-chevron" id="${accordionId}-chevron">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="review-item-content" id="${accordionId}" data-step="${item.step}" data-type="likert">
              ${accordionContent}
            </div>
          </div>
        `;
      } else {
        const accordionContent = generateFieldsAccordionContent(item);
        const statusText = isNowComplete
          ? 'Compleet'
          : `${currentRemaining} veld${currentRemaining > 1 ? 'en' : ''} niet ingevuld`;

        itemsHtml += `
          <div class="review-item-accordion ${completedClass}">
            <div class="review-item-header" data-action="toggleAccordion" data-accordion="${accordionId}">
              <div class="review-item-info">
                <span class="review-item-step">${item.stepLabel}</span>
                <span class="review-item-label" id="${accordionId}-label">${statusText}</span>
              </div>
              <div class="review-item-actions">
                <button type="button" class="btn btn-secondary btn-review-goto" data-action="goToStep" data-step="${item.step}">
                  Naar sectie &rarr;
                </button>
                <span class="accordion-chevron" id="${accordionId}-chevron">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="review-item-content" id="${accordionId}" data-step="${item.step}" data-type="fields" data-fields='${JSON.stringify(item.missingFields)}'>
              ${accordionContent}
            </div>
          </div>
        `;
      }
    });
  });

  const headerIcon = allNowComplete
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="24" height="24">
         <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
       </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
         <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round"/>
       </svg>`;

  const headerClass = allNowComplete ? 'review-all-complete-header' : 'review-incomplete-header';
  const headerText = allNowComplete
    ? 'Alle secties zijn nu ingevuld!'
    : 'Niet alle velden zijn ingevuld';
  const subtitleText = allNowComplete
    ? 'De onderstaande secties waren oorspronkelijk incompleet maar zijn nu ingevuld. U kunt nu verzenden.'
    : 'Klik op een sectie om de velden direct hier in te vullen, of ga naar de betreffende stap.';

  const confirmHtml = allNowComplete
    ? ''
    : `<div class="review-confirm">
         <label class="review-confirm-label">
           <input type="checkbox" id="confirmIncomplete" class="review-confirm-checkbox">
           <span>Ik begrijp dat niet alle velden zijn ingevuld en wil toch verzenden</span>
         </label>
       </div>`;

  const submitDisabled = allNowComplete ? '' : 'disabled';
  const containerClass = allNowComplete ? 'review-now-complete' : 'review-incomplete';

  reviewContent.innerHTML = `
    <div class="${containerClass}">
      <div class="${headerClass}">
        ${headerIcon}
        <h3>${headerText}</h3>
      </div>
      <p class="review-incomplete-subtitle">${subtitleText}</p>

      <div class="review-items">
        ${itemsHtml}
      </div>

      ${confirmHtml}

      <button type="button" class="btn btn-primary btn-submit-review" data-action="confirmSubmit" id="btnConfirmSubmit" ${submitDisabled}>
        Verzenden
      </button>
    </div>
  `;

  const checkbox = document.getElementById('confirmIncomplete');
  const submitBtn = document.getElementById('btnConfirmSubmit');
  if (checkbox && submitBtn) {
    checkbox.addEventListener('change', function() {
      submitBtn.disabled = !this.checked;
    });
  }

  setupAccordionInputListeners();
}

/**
 * Generate accordion content for Likert table items
 */
function generateLikertAccordionContent(item) {
  let tableConfig = null;
  let tableId = null;
  Object.keys(LIKERT_LABELS).forEach(id => {
    if (LIKERT_LABELS[id].step === item.step && LIKERT_LABELS[id].label === item.label) {
      tableConfig = LIKERT_LABELS[id];
      tableId = id;
    }
  });

  if (!tableConfig) return '<p>Kon vragen niet laden.</p>';

  const originalTable = document.getElementById(tableId);
  let rows = [];

  if (originalTable) {
    const tbody = originalTable.querySelector('tbody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach(tr => {
        const questionCell = tr.querySelector('td:first-child');
        const radios = tr.querySelectorAll('input[type="radio"]');
        if (questionCell && radios.length > 0) {
          const fieldName = radios[0].name;
          rows.push({
            question: questionCell.textContent,
            fieldName: fieldName,
            filled: isFieldFilled(fieldName)
          });
        }
      });
    }
  }

  let rowsHtml = rows.map(row => {
    const currentValue = getFieldValue(row.fieldName);
    return `
      <tr class="${row.filled ? 'row-complete' : 'row-incomplete'}">
        <td>${row.question}</td>
        <td><input type="radio" name="review_${row.fieldName}" value="0" ${currentValue === '0' ? 'checked' : ''} data-original="${row.fieldName}"></td>
        <td><input type="radio" name="review_${row.fieldName}" value="1" ${currentValue === '1' ? 'checked' : ''} data-original="${row.fieldName}"></td>
        <td><input type="radio" name="review_${row.fieldName}" value="2" ${currentValue === '2' ? 'checked' : ''} data-original="${row.fieldName}"></td>
        <td><input type="radio" name="review_${row.fieldName}" value="3" ${currentValue === '3' ? 'checked' : ''} data-original="${row.fieldName}"></td>
      </tr>
    `;
  }).join('');

  return `
    <table class="likert-table likert-table-review">
      <thead>
        <tr>
          <th>Stelling</th>
          <th>Niet</th>
          <th>Enigszins</th>
          <th>Grotendeels</th>
          <th>Volledig</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

/**
 * Generate accordion content for regular field items
 */
function generateFieldsAccordionContent(item) {
  let fieldsHtml = '';

  item.missingFields.forEach(fieldName => {
    const label = FIELD_LABELS[fieldName] || fieldName;
    const originalField = document.querySelector(`[name="${fieldName}"]`);

    if (!originalField) return;

    if (originalField.type === 'radio') {
      const radioGroup = document.querySelectorAll(`[name="${fieldName}"]`);
      let optionsHtml = '';
      radioGroup.forEach(radio => {
        const optionCard = radio.closest('.option-card');
        let optionLabel = radio.value;
        if (optionCard) {
          const h3 = optionCard.querySelector('h3');
          if (h3) optionLabel = h3.textContent;
        }
        const currentValue = getFieldValue(fieldName);
        optionsHtml += `
          <label class="review-option-card">
            <input type="radio" name="review_${fieldName}" value="${radio.value}" ${currentValue === radio.value ? 'checked' : ''} data-original="${fieldName}">
            <span>${optionLabel}</span>
          </label>
        `;
      });
      fieldsHtml += `
        <div class="review-field">
          <label class="review-field-label">${label}</label>
          <div class="review-radio-group">
            ${optionsHtml}
          </div>
        </div>
      `;
    } else if (originalField.type === 'checkbox') {
      const isChecked = originalField.checked;
      fieldsHtml += `
        <div class="review-field">
          <label class="review-checkbox-label">
            <input type="checkbox" name="review_${fieldName}" ${isChecked ? 'checked' : ''} data-original="${fieldName}">
            <span>${label}</span>
          </label>
        </div>
      `;
    } else if (originalField.tagName === 'TEXTAREA') {
      const currentValue = originalField.value || '';
      fieldsHtml += `
        <div class="review-field">
          <label class="review-field-label">${label}</label>
          <textarea name="review_${fieldName}" rows="3" data-original="${fieldName}" placeholder="Vul hier in...">${currentValue}</textarea>
        </div>
      `;
    } else if (originalField.type === 'date' || fieldName === 'datum') {
      const currentValue = originalField.value || '';
      fieldsHtml += `
        <div class="review-field">
          <label class="review-field-label">${label}</label>
          <div class="date-input-wrapper">
            <input type="text" name="review_${fieldName}" id="review_datumPicker" value="${currentValue}" data-original="${fieldName}" readonly placeholder="Selecteer datum">
          </div>
        </div>
      `;
    } else if (originalField.type === 'number') {
      const currentValue = originalField.value || '';
      fieldsHtml += `
        <div class="review-field">
          <label class="review-field-label">${label}</label>
          <input type="number" name="review_${fieldName}" value="${currentValue}" min="0" data-original="${fieldName}" placeholder="0">
        </div>
      `;
    } else {
      const currentValue = originalField.value || '';
      fieldsHtml += `
        <div class="review-field">
          <label class="review-field-label">${label}</label>
          <input type="text" name="review_${fieldName}" value="${currentValue}" data-original="${fieldName}" placeholder="Vul hier in...">
        </div>
      `;
    }
  });

  return `<div class="review-fields-container">${fieldsHtml}</div>`;
}

/**
 * Setup listeners for accordion inputs
 */
function setupAccordionInputListeners() {
  const reviewContent = document.getElementById('reviewContent');
  if (!reviewContent) return;

  reviewContent.addEventListener('change', function(event) {
    const input = event.target;
    if (!input.dataset.original) return;

    const originalName = input.dataset.original;
    const originalInput = document.querySelector(`[name="${originalName}"]`);

    if (!originalInput) return;

    if (input.type === 'radio') {
      const originalRadio = document.querySelector(`[name="${originalName}"][value="${input.value}"]`);
      if (originalRadio) {
        originalRadio.checked = true;
        const optionCard = originalRadio.closest('.option-card');
        if (optionCard) {
          // Trigger option card click handling
          document.querySelectorAll(`input[name="${originalName}"]`).forEach(radio => {
            const parentCard = radio.closest('.option-card');
            if (parentCard) {
              parentCard.classList.remove(window.CONSTANTS.CSS.SELECTED);
            }
          });
          optionCard.classList.add(window.CONSTANTS.CSS.SELECTED);
        }
        originalRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (input.type === 'checkbox') {
      originalInput.checked = input.checked;
      originalInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      originalInput.value = input.value;
      originalInput.dispatchEvent(new Event('input', { bubbles: true }));
      originalInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    saveFormData();
    updateAllSections();
    updateIndexStatus();
    updateAccordionItemStatus(input);
  });

  reviewContent.addEventListener('input', function(event) {
    const input = event.target;
    if (!input.dataset.original) return;
    if (input.type === 'radio' || input.type === 'checkbox') return;

    const originalName = input.dataset.original;
    const originalInput = document.querySelector(`[name="${originalName}"]`);

    if (originalInput) {
      originalInput.value = input.value;
      originalInput.dispatchEvent(new Event('input', { bubbles: true }));
      saveFormData();
    }
  });

  initReviewDatePicker();
}

/**
 * Initialize Flatpickr for the review page date field
 */
function initReviewDatePicker() {
  const reviewDateInput = document.getElementById('review_datumPicker');
  if (!reviewDateInput || typeof flatpickr === 'undefined') return;

  flatpickr(reviewDateInput, {
    locale: 'nl',
    dateFormat: 'd-m-Y',
    altInput: true,
    altFormat: 'j F Y',
    disableMobile: true,
    allowInput: false,
    monthSelectorType: 'dropdown',
    animate: true,
    onChange: function(selectedDates, dateStr, instance) {
      const originalInput = document.querySelector('[name="datum"]');
      if (originalInput) {
        originalInput.value = dateStr;
        if (originalInput._flatpickr) {
          originalInput._flatpickr.setDate(dateStr, false);
        }
        originalInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      saveFormData();
      updateAllSections();
      updateIndexStatus();

      const accordionContent = reviewDateInput.closest('.review-item-content');
      if (accordionContent) {
        updateAccordionItemStatus(reviewDateInput);
      }
    }
  });
}

/**
 * Update the status display of an accordion item
 */
function updateAccordionItemStatus(input) {
  const accordionContent = input.closest('.review-item-content');
  if (!accordionContent) return;

  const accordionId = accordionContent.id;
  const dataType = accordionContent.dataset.type;

  if (dataType === 'likert') {
    const row = input.closest('tr');
    if (row) {
      row.classList.remove('row-incomplete');
      row.classList.add('row-complete');
    }

    const countEl = document.getElementById(`${accordionId}-count`);
    if (countEl) {
      const radios = accordionContent.querySelectorAll('input[type="radio"]');
      const fieldNames = new Set();
      radios.forEach(r => fieldNames.add(r.dataset.original));

      let filled = 0;
      fieldNames.forEach(name => {
        if (isFieldFilled(name)) filled++;
      });

      countEl.textContent = `${filled} van ${fieldNames.size} ingevuld`;

      if (filled === fieldNames.size) {
        markAccordionComplete(accordionId);
      }
    }
  } else {
    const fieldWrapper = input.closest('.review-field');
    if (fieldWrapper && input.value && input.value.trim() !== '') {
      fieldWrapper.classList.add('field-complete');
    }

    const labelEl = document.getElementById(`${accordionId}-label`);
    if (labelEl) {
      const fieldsData = accordionContent.dataset.fields;
      if (fieldsData) {
        const fields = JSON.parse(fieldsData);
        let remaining = 0;
        fields.forEach(name => {
          if (!isFieldFilled(name)) remaining++;
        });

        if (remaining === 0) {
          markAccordionComplete(accordionId);
        } else {
          labelEl.textContent = `${remaining} veld${remaining > 1 ? 'en' : ''} niet ingevuld`;
        }
      }
    }
  }

  checkAllItemsComplete();
}

/**
 * Mark an accordion item as complete
 */
function markAccordionComplete(accordionId) {
  const accordionContent = document.getElementById(accordionId);
  const accordionItem = accordionContent?.closest('.review-item-accordion');

  if (accordionItem) {
    accordionItem.classList.add('accordion-complete');
    accordionContent.classList.remove('open');
    const chevron = document.getElementById(`${accordionId}-chevron`);
    if (chevron) chevron.classList.remove('open');
  }
}

/**
 * Check if all initially incomplete items are now complete
 */
function checkAllItemsComplete() {
  if (!state.initialReviewItems || state.initialReviewItems.length === 0) return;

  let allNowComplete = true;
  state.initialReviewItems.forEach(item => {
    if (item.type === 'likert') {
      const tableConfig = LIKERT_LABELS[Object.keys(LIKERT_LABELS).find(k =>
        LIKERT_LABELS[k].step === item.step && LIKERT_LABELS[k].label === item.label
      )];
      if (tableConfig) {
        const status = checkLikertTableStatus(tableConfig.fields);
        if (status.incomplete) allNowComplete = false;
      }
    } else {
      item.missingFields.forEach(fieldName => {
        if (!isFieldFilled(fieldName)) allNowComplete = false;
      });
    }
  });

  const submitBtn = document.getElementById('btnConfirmSubmit');
  const checkbox = document.getElementById('confirmIncomplete');
  const confirmContainer = document.querySelector('.review-confirm');
  const headerEl = document.querySelector('.review-incomplete-header, .review-all-complete-header');
  const containerEl = document.querySelector('.review-incomplete, .review-now-complete');

  if (allNowComplete) {
    if (submitBtn) submitBtn.disabled = false;
    if (confirmContainer) confirmContainer.style.display = 'none';
    if (headerEl) {
      headerEl.className = 'review-all-complete-header';
      const h3 = headerEl.querySelector('h3');
      if (h3) h3.textContent = 'Alle secties zijn nu ingevuld!';
      const svg = headerEl.querySelector('svg');
      if (svg) {
        svg.outerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="24" height="24">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      }
    }
    if (containerEl) {
      containerEl.className = 'review-now-complete';
    }
    const subtitle = document.querySelector('.review-incomplete-subtitle');
    if (subtitle) {
      subtitle.textContent = 'De onderstaande secties waren oorspronkelijk incompleet maar zijn nu ingevuld. U kunt nu verzenden.';
    }
  } else {
    if (submitBtn && checkbox) {
      submitBtn.disabled = !checkbox.checked;
    }
    if (confirmContainer) confirmContainer.style.display = 'block';
  }
}

/**
 * Toggle accordion open/close
 */
export function toggleAccordion(accordionId) {
  const content = document.getElementById(accordionId);
  const chevron = document.getElementById(`${accordionId}-chevron`);

  if (content) {
    content.classList.toggle('open');
  }
  if (chevron) {
    chevron.classList.toggle('open');
  }
}
