/**
 * Print functionality module
 * Generates a standalone HTML document for printing, completely independent
 * of the screen DOM and CSS. Opens in a new window and triggers window.print().
 */

import * as state from './state.js';
import { showErrorModal } from './modals.js';

/**
 * Collect form data from the live form
 * @returns {Object} key-value pairs of field names to values
 */
function collectLiveFormData() {
  const form = document.getElementById('monitoringForm');
  if (!form) return {};
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });

  // Also capture checkboxes that are unchecked (FormData skips them)
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (!data[cb.name]) data[cb.name] = cb.checked ? 'on' : '';
  });

  return data;
}

/**
 * Escape HTML entities
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strip HTML tags from label strings (they sometimes contain <span> highlights)
 */
function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Check if a conditional field should be visible given the parent's value
 */
function isConditionalActive(parentName, data) {
  const parentValue = data[parentName];
  if (!parentValue) return false;

  const condValues = window.CONSTANTS.CONDITIONAL_VALUES[parentName];
  if (!condValues) return parentValue === window.CONSTANTS.ANSWERS.YES;

  if (Array.isArray(condValues)) {
    return condValues.includes(parentValue);
  }
  return parentValue === condValues;
}

/**
 * Get the survey step definitions.
 * We import them dynamically since they're an ES module used by the build script.
 * As a fallback, we reconstruct from CONFIG + the DOM.
 */
function getSurveySteps() {
  // The survey-data.js SURVEY_STEPS are not available at runtime in the IIFE bundle.
  // Instead, we reconstruct the structure from CONFIG.STEP_FIELDS, FIELD_LABELS, etc.
  // and read actual field types from the DOM.
  const steps = [];
  const form = document.getElementById('monitoringForm');
  const stepLabels = state.STEP_LABELS;
  const fieldLabels = state.FIELD_LABELS;

  for (let i = 0; i <= window.CONFIG.SIGN_STEP; i++) {
    const fieldNames = window.CONFIG.STEP_FIELDS[i] || [];
    const fields = [];

    for (const name of fieldNames) {
      const el = form ? form.elements[name] : null;
      let type = 'text';

      if (el) {
        if (el.type === 'radio' || (el[0] && el[0].type === 'radio')) {
          type = 'radio';
        } else if (el.type === 'checkbox') {
          type = 'checkbox';
        } else if (el.type === 'textarea' || el.tagName === 'TEXTAREA') {
          type = 'textarea';
        } else if (el.dataset && el.dataset.type === 'date') {
          type = 'date';
        } else {
          // Check if it's a number-like field (inputmode="numeric")
          if (el.inputMode === 'numeric' || el.getAttribute('inputmode') === 'numeric') {
            type = 'number';
          }
        }
      }

      // Get radio options if applicable
      let options = [];
      if (type === 'radio' && form) {
        const radios = form.querySelectorAll(`input[name="${name}"]`);
        radios.forEach(r => {
          options.push({ value: r.value, label: r.value });
        });
      }

      // Check if this field is a conditional child
      const parentInfo = state.CONDITIONAL_PARENT_MAP[name];

      // Check if the field is visually indented in the DOM
      let isIndented = false;
      if (el) {
        const fieldWrapper = (el.closest ? el : el[0])?.closest('.field');
        if (fieldWrapper && fieldWrapper.classList.contains('field-indent')) {
          isIndented = true;
        }
      }

      fields.push({
        name,
        label: fieldLabels[name] || name,
        type,
        options,
        parentInfo,
        isIndented
      });
    }

    steps.push({
      id: i,
      title: stepLabels[i] || `Stap ${i}`,
      fields
    });
  }

  return steps;
}

/**
 * Render a single field for the print document
 */
function renderField(field, data, indent) {
  const value = data[field.name] || '';
  const label = esc(stripHtml(field.label));
  const indentClass = indent ? ' class="indent"' : '';

  switch (field.type) {
    case 'radio':
      return renderRadioField(field, value, label, indentClass);
    case 'checkbox':
      return renderCheckboxField(field, value, label, indentClass);
    case 'textarea':
      return renderTextareaField(field, value, label, indentClass);
    default:
      return renderTextField(field, value, label, indentClass);
  }
}

function renderRadioField(field, value, label, indentClass) {
  const pills = field.options.map(opt => {
    const selected = opt.value === value;
    return `<span class="pill${selected ? ' selected' : ''}">${esc(opt.label)}</span>`;
  }).join('');

  return `<div class="field"${indentClass}>
    <div class="field-label">${label}</div>
    <div class="pills">${pills}</div>
  </div>`;
}

function renderCheckboxField(field, value, label, indentClass) {
  const checked = value === 'on' || value === true || value === 'true';
  const marker = checked ? '☑' : '☐';
  return `<div class="field"${indentClass}>
    <span class="checkbox-marker">${marker}</span> ${label}
  </div>`;
}

function renderTextareaField(field, value, label, indentClass) {
  const displayValue = value ? esc(value) : '<span class="empty">—</span>';
  return `<div class="field textarea-field"${indentClass}>
    <div class="field-label">${label}</div>
    <div class="textarea-value">${displayValue}</div>
  </div>`;
}

function renderTextField(field, value, label, indentClass) {
  const displayValue = value ? esc(value) : '<span class="empty">—</span>';
  // For number fields with suffix (%), check config
  const suffix = (field.name.includes('streef_') || field.name.includes('percentage')) ? '%' : '';
  return `<div class="field inline-field"${indentClass}>
    <span class="field-label">${label}</span>
    <span class="field-value">${displayValue}${value ? suffix : ''}</span>
  </div>`;
}

/**
 * Build the complete print HTML document
 */
function buildPrintDocument(data, orgName, orgCode) {
  const steps = getSurveySteps();
  const printDate = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  let sectionsHtml = '';

  for (const step of steps) {
    if (step.fields.length === 0) continue;

    let fieldsHtml = '';
    for (const field of step.fields) {
      // Skip conditional children whose parent condition is not met
      if (field.parentInfo) {
        if (!isConditionalActive(field.parentInfo.parent, data)) {
          continue;
        }
      }

      const indent = !!field.parentInfo || field.isIndented;
      fieldsHtml += renderField(field, data, indent);
    }

    if (!fieldsHtml) continue;

    sectionsHtml += `
    <div class="section">
      <h2>${esc(step.title)}</h2>
      ${fieldsHtml}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Monitoring Executive Search Code 2025 — ${esc(orgName)}</title>
<style>
${getPrintCSS()}
</style>
</head>
<body>

<div class="header">
  <h1>Monitoring Executive Search Code 2025</h1>
  <div class="header-meta">
    <span>${esc(orgName)}</span>
    <span class="sep">·</span>
    <span>${esc(orgCode)}</span>
    <span class="sep">·</span>
    <span>${printDate}</span>
  </div>
</div>

${sectionsHtml}

<div class="footer">
  Dit is een werkexemplaar, bedoeld voor interne bespreking. De definitieve inzending verloopt via het online formulier.
</div>

</body>
</html>`;
}

/**
 * Get the embedded CSS for the print document
 */
function getPrintCSS() {
  return `
@page {
  size: A4 portrait;
  margin: 20mm 18mm;
}

* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: #2a2a2a;
  margin: 0;
  padding: 0;
  background: white;
}

/* ---- Header ---- */
.header {
  margin-bottom: 18pt;
  padding-bottom: 10pt;
  border-bottom: 2pt solid #c4785a;
}

.header h1 {
  font-size: 15pt;
  font-weight: 700;
  color: #4a3728;
  margin: 0 0 4pt 0;
}

.header-meta {
  font-size: 9.5pt;
  color: #7a6555;
}

.header-meta .sep {
  margin: 0 4pt;
  color: #c4b5a5;
}

/* ---- Sections ---- */
.section {
  margin-bottom: 6pt;
  padding-top: 10pt;
}

.section h2 {
  font-size: 12pt;
  font-weight: 700;
  color: #c4785a;
  margin: 0 0 8pt 0;
  padding-bottom: 4pt;
  border-bottom: 0.75pt solid #e8d5c4;
  break-after: avoid;
}

/* ---- Fields ---- */
.field {
  margin-bottom: 6pt;
  break-inside: avoid;
}

.field.indent {
  margin-left: 14pt;
  padding-left: 8pt;
  border-left: 2pt solid #e8a091;
}

.field-label {
  font-weight: 600;
  font-size: 9.5pt;
  color: #4a3728;
  margin-bottom: 2pt;
}

.field-value {
  color: #2a2a2a;
}

.empty {
  color: #bbb;
  font-style: italic;
}

/* ---- Inline fields (text/number: label + value on one line) ---- */
.inline-field {
  display: flex;
  align-items: baseline;
  gap: 8pt;
}

.inline-field .field-label {
  flex-shrink: 0;
  margin-bottom: 0;
}

.inline-field .field-label::after {
  content: ":";
}

.inline-field .field-value {
  flex: 1;
  border-bottom: 0.5pt dotted #ccc;
  padding-bottom: 1pt;
  min-width: 40pt;
}

/* ---- Textarea fields ---- */
.textarea-field .textarea-value {
  background: #faf8f6;
  border-left: 2.5pt solid #d5cec7;
  padding: 5pt 8pt;
  margin-top: 3pt;
  font-size: 9.5pt;
  line-height: 1.45;
  white-space: pre-wrap;
  min-height: 14pt;
}

/* ---- Radio pills ---- */
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4pt;
  margin-top: 3pt;
}

.pill {
  display: inline-block;
  font-size: 8.5pt;
  padding: 2pt 7pt;
  border: 0.75pt solid #d5cec7;
  border-radius: 10pt;
  color: #7a6555;
  background: white;
}

.pill.selected {
  background: #c4785a;
  border-color: #c4785a;
  color: white;
  font-weight: 600;
}

/* ---- Checkbox ---- */
.checkbox-marker {
  font-size: 11pt;
}

/* ---- Footer ---- */
.footer {
  margin-top: 20pt;
  padding-top: 8pt;
  border-top: 0.75pt solid #d5cec7;
  font-size: 8.5pt;
  color: #999;
  font-style: italic;
  text-align: center;
}

/* ---- Page break rules ---- */
h2 {
  break-after: avoid;
}
`;
}

/**
 * Open the print document in a new window and trigger print
 */
function openPrintWindow(html) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showErrorModal(
      'Pop-up geblokkeerd',
      'Sta pop-ups toe voor deze website om het formulier af te drukken.'
    );
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Guard against double-printing (onload + fallback)
  let printed = false;
  function triggerPrint() {
    if (printed) return;
    printed = true;
    printWindow.focus();
    printWindow.print();
  }

  printWindow.onload = triggerPrint;

  // Fallback if onload doesn't fire (some browsers with document.write)
  setTimeout(triggerPrint, 500);
}

/**
 * Print the current form
 */
export function printForm() {
  const data = collectLiveFormData();
  const orgName = state.session?.orgName || '';
  const orgCode = state.session?.orgCode || '';

  const html = buildPrintDocument(data, orgName, orgCode);
  openPrintWindow(html);
}

/**
 * Print an archived form by its ID
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

  const data = archivedForm.data || {};
  const orgName = archivedForm.orgName || data.orgName || '';
  const orgCode = data.orgCode || '';

  const html = buildPrintDocument(data, orgName, orgCode);
  openPrintWindow(html);
}
