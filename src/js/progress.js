/**
 * Progress tracking module
 * Handles progress bar, index status, and section completion
 */

import * as state from './state.js';
import { checkConditionalCompletion } from './validation.js';

/**
 * Initialize progress dots (both top and bottom)
 */
export function initProgress() {
  const dotsBottom = document.getElementById('progressDots');
  const dotsTop = document.getElementById('progressDotsTop');
  const contentSteps = 14;

  [dotsBottom, dotsTop].forEach(dots => {
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < contentSteps; i++) {
      const span = document.createElement('span');
      if (i === 0) span.classList.add(window.CONSTANTS.CSS.ACTIVE);
      dots.appendChild(span);
    }
  });
}

/**
 * Update progress dots display
 */
export function updateProgress() {
  const dotsContainers = document.querySelectorAll('.progress-dots');
  const displayStep = state.currentStep <= 13 ? state.currentStep : 13;

  dotsContainers.forEach(container => {
    const dots = container.querySelectorAll('span');
    dots.forEach((dot, i) => {
      dot.classList.remove(window.CONSTANTS.CSS.ACTIVE, window.CONSTANTS.CSS.DONE);
      if (i < displayStep) dot.classList.add(window.CONSTANTS.CSS.DONE);
      if (i === displayStep) dot.classList.add(window.CONSTANTS.CSS.ACTIVE);
    });

    if (state.currentStep >= window.CONFIG.REVIEW_STEP) {
      dots.forEach(dot => {
        dot.classList.remove(window.CONSTANTS.CSS.ACTIVE);
        dot.classList.add(window.CONSTANTS.CSS.DONE);
      });
    }
  });
}

/**
 * Update sidebar index highlighting
 */
export function updateIndex() {
  document.querySelectorAll('.index-item').forEach(item => {
    const step = parseInt(item.dataset.step);
    item.classList.toggle(window.CONSTANTS.CSS.ACTIVE, step === state.currentStep);
  });
  document.querySelectorAll('.index-divider-clickable').forEach(divider => {
    const step = parseInt(divider.dataset.step);
    divider.classList.toggle(window.CONSTANTS.CSS.ACTIVE, step === state.currentStep);
  });

  updateMobileHighlighter();
}

/**
 * Update mobile highlighter position to match active item
 */
export function updateMobileHighlighter() {
  const highlighter = document.getElementById('mobileHighlighter');
  const indexContainer = document.querySelector('.index');
  if (!highlighter || !indexContainer) return;

  const activeItem = indexContainer.querySelector('.index-item.active, .index-divider-clickable.active');

  if (activeItem) {
    const indexRect = indexContainer.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const topPosition = itemRect.top - indexRect.top + indexContainer.scrollTop;

    if (!state.highlighterInitialized) {
      highlighter.style.transition = 'none';
      highlighter.style.top = topPosition + 'px';
      highlighter.style.height = itemRect.height + 'px';
      highlighter.offsetHeight;
      highlighter.style.transition = '';
      state.setHighlighterInitialized(true);
    } else {
      highlighter.style.top = topPosition + 'px';
      highlighter.style.height = itemRect.height + 'px';
    }
    highlighter.classList.add('active');

    const isDivider = activeItem.classList.contains('index-divider-clickable');
    const isSubsection = activeItem.classList.contains('index-divider-sub');
    highlighter.classList.toggle('highlighter-divider', isDivider && !isSubsection);
    highlighter.classList.toggle('highlighter-subsection', isSubsection);
    highlighter.classList.toggle('highlighter-item', !isDivider);
  } else {
    highlighter.classList.remove('active', 'highlighter-divider', 'highlighter-subsection', 'highlighter-item');
  }
}

/**
 * Update index item completion status
 */
export function updateIndexStatus() {
  Object.keys(window.CONFIG.STEP_FIELDS).forEach(step => {
    const fields = window.CONFIG.STEP_FIELDS[step];
    let filled = 0;
    let hasConditionalIncomplete = false;

    fields.forEach(fieldName => {
      const input = document.querySelector(`[name="${fieldName}"]`);
      if (!input) return;

      if (input.type === 'radio') {
        const checked = document.querySelector(`[name="${fieldName}"]:checked`);
        if (checked) {
          filled++;
          const conditionalStatus = checkConditionalCompletion(fieldName);
          if (conditionalStatus.triggered && !conditionalStatus.filled) {
            hasConditionalIncomplete = true;
          }
        }
      } else if (input.type === 'checkbox') {
        if (input.checked) filled++;
      } else if (input.value && input.value.trim() !== '') {
        filled++;
      }
    });

    const indexItem = document.querySelector(`.index-item[data-step="${step}"]`);
    if (!indexItem) return;

    const statusEl = indexItem.querySelector('.status');
    indexItem.classList.remove(window.CONSTANTS.CSS.COMPLETE, window.CONSTANTS.CSS.PARTIAL, window.CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);

    if (filled === fields.length) {
      if (hasConditionalIncomplete) {
        indexItem.classList.add(window.CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);
        statusEl.innerHTML = window.CONSTANTS.UI.STATUS_PARTIAL;
      } else {
        indexItem.classList.add(window.CONSTANTS.CSS.COMPLETE);
        statusEl.innerHTML = window.CONSTANTS.UI.STATUS_COMPLETE;
      }
    } else if (filled > 0) {
      indexItem.classList.add(window.CONSTANTS.CSS.PARTIAL);
      statusEl.innerHTML = `${filled}/${fields.length}`;
    } else {
      statusEl.innerHTML = window.CONSTANTS.UI.STATUS_EMPTY;
    }
  });

  updateProgressBar();
}

/**
 * Update the progress bar based on total filled fields
 */
export function updateProgressBar() {
  let totalFields = 0;
  let filledFields = 0;

  Object.keys(window.CONFIG.STEP_FIELDS).forEach(step => {
    const fields = window.CONFIG.STEP_FIELDS[step];
    totalFields += fields.length;

    fields.forEach(fieldName => {
      const input = document.querySelector(`[name="${fieldName}"]`);
      if (!input) return;

      if (input.type === 'radio') {
        const checked = document.querySelector(`[name="${fieldName}"]:checked`);
        if (checked) filledFields++;
      } else if (input.type === 'checkbox') {
        if (input.checked) filledFields++;
      } else if (input.value && input.value.trim() !== '') {
        filledFields++;
      }
    });
  });

  const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');

  if (progressBarFill) {
    progressBarFill.style.width = percentage + '%';
  }
  if (progressPercentage) {
    progressPercentage.textContent = percentage + '%';
  }
}

/**
 * Update section header completion status
 * @param {string} sectionName - Name of the section to update
 */
export function updateSectionStatus(sectionName) {
  const fields = window.CONFIG.SECTION_FIELDS[sectionName];
  if (!fields) return;

  const header = document.querySelector(`[data-section="${sectionName}"]`);
  if (!header) return;

  let filled = 0;
  let hasConditionalIncomplete = false;
  const total = fields.length;

  fields.forEach(fieldName => {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) return;

    if (input.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldName}"]:checked`);
      if (checked) {
        filled++;
        const conditionalStatus = checkConditionalCompletion(fieldName);
        if (conditionalStatus.triggered && !conditionalStatus.filled) {
          hasConditionalIncomplete = true;
        }
      }
    } else if (input.value && input.value.trim() !== '') {
      filled++;
    }
  });

  const icon = header.querySelector('.status-icon');
  header.classList.remove(window.CONSTANTS.CSS.COMPLETE, window.CONSTANTS.CSS.PARTIAL, window.CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);

  if (filled === total) {
    if (hasConditionalIncomplete) {
      header.classList.add(window.CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);
      icon.innerHTML = window.CONSTANTS.UI.STATUS_PARTIAL;
    } else {
      header.classList.add(window.CONSTANTS.CSS.COMPLETE);
      icon.innerHTML = window.CONSTANTS.UI.STATUS_COMPLETE;
    }
  } else if (filled > 0) {
    header.classList.add(window.CONSTANTS.CSS.PARTIAL);
    icon.innerHTML = `${filled}/${total}`;
  } else {
    icon.innerHTML = window.CONSTANTS.UI.STATUS_EMPTY;
  }
}

/**
 * Update all section statuses
 */
export function updateAllSections() {
  Object.keys(window.CONFIG.SECTION_FIELDS).forEach(updateSectionStatus);
}
