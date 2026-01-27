/**
 * Template renderer - generates survey HTML from data
 * Reduces 1300+ lines of HTML to ~100 lines of rendering logic
 */

import { SURVEY_STEPS, LIKERT_OPTIONS } from '../data/survey-data.js';

/**
 * Generate a Likert table HTML
 */
function renderLikertTable(likert, stepId) {
  const rows = likert.questions.map((q, i) => `
    <tr>
      <td><span class="q-num">${i + 1}.</span> ${q}</td>
      ${LIKERT_OPTIONS.map(opt =>
        `<td><input type="radio" name="${likert.prefix}_${i + 1}" value="${opt.value}"></td>`
      ).join('')}
    </tr>
  `).join('');

  return `
    <div class="likert-header" id="header-${likert.id}">
      <span></span>
      <button type="button" class="reset-btn" data-action="resetLikertTable" data-table="${likert.id}" title="Wis selectie">↺</button>
    </div>
    <table class="likert-table" id="${likert.id}">
      <thead>
        <tr>
          <th class="likert-header-label">Gerealiseerd:</th>
          ${LIKERT_OPTIONS.map(opt => `<th>${opt.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/**
 * Generate radio card options
 */
function renderRadioCards(field) {
  const cards = field.options.map(opt => `
    <label class="option-card">
      <input type="radio" name="${field.name}" value="${opt.value}">
      <div class="option-content">
        <h3>${opt.label}</h3>
        ${opt.description ? `<p>${opt.description}</p>` : ''}
      </div>
    </label>
  `).join('');

  let conditionalHtml = '';
  if (field.conditional) {
    conditionalHtml = `
      <div class="conditional" id="conditional-${field.name}">
        ${field.conditional.fields.map(f => renderField(f)).join('')}
      </div>
    `;
  }

  return `
    <div class="question-header" id="header-${field.name}">
      ${field.label ? `<label>${field.label}</label>` : ''}
      <button type="button" class="reset-btn" data-action="resetGroup" data-name="${field.name}" title="Wis selectie">↺</button>
    </div>
    <div class="option-cards">${cards}</div>
    ${conditionalHtml}
  `;
}

/**
 * Generate a single field
 */
function renderField(field) {
  switch (field.type) {
    case 'radio-cards':
      return renderRadioCards(field);
    case 'number':
      return `
        <div class="field">
          <label for="${field.name}">${field.label}</label>
          <input type="number" id="${field.name}" name="${field.name}" min="0"${field.suffix ? ` data-suffix="${field.suffix}"` : ''}>
        </div>
      `;
    case 'text':
      return `
        <div class="field">
          <label for="${field.name}">${field.label}</label>
          <input type="text" id="${field.name}" name="${field.name}">
        </div>
      `;
    case 'textarea':
      return `
        <div class="field">
          <label for="${field.name}">${field.label}</label>
          <textarea id="${field.name}" name="${field.name}" rows="3"></textarea>
        </div>
      `;
    case 'date':
      return `
        <div class="field">
          <label for="${field.name}">${field.label}</label>
          <input type="text" id="datumPicker" name="${field.name}" readonly>
        </div>
      `;
    case 'checkbox':
      return `
        <div class="field checkbox-field">
          <label class="checkbox-label">
            <input type="checkbox" name="${field.name}">
            <span>${field.label}</span>
          </label>
        </div>
      `;
    default:
      return '';
  }
}

/**
 * Generate a complete step
 */
function renderStep(step) {
  let content = '';

  // Title and subtitle
  if (step.sectionNum) {
    content += `<h1><span class="section-num">${step.sectionNum}</span> ${step.title}</h1>`;
  } else if (step.type !== 'welcome') {
    content += `<h1>${step.title}</h1>`;
  }

  if (step.subtitle) {
    content += `<p class="subtitle">${step.subtitle}</p>`;
  }

  // Content for intro/welcome steps
  if (step.content) {
    content += `<h1>${step.content.heading}</h1>`;
    if (step.content.text) content += `<p>${step.content.text}</p>`;
    if (step.content.intro) content += `<p>${step.content.intro}</p>`;
  }

  // Form section
  if (step.fields || step.likert) {
    content += '<div class="form-section">';

    // Likert table
    if (step.likert) {
      content += renderLikertTable(step.likert, step.id);
    }

    // Regular fields
    if (step.fields) {
      content += step.fields.map(f => renderField(f)).join('');
    }

    // Toelichting field
    if (step.toelichting) {
      content += `
        <div class="field">
          <label>Toelichting (optioneel)</label>
          <textarea name="${step.toelichting}" rows="3" placeholder="Licht uw antwoorden toe..."></textarea>
        </div>
      `;
    }

    content += '</div>';

    // Comments section
    content += `
      <div class="comments-section">
        <button type="button" class="comments-toggle" data-action="toggleComments" data-step="${step.id}">
          <span class="comments-label">Opmerking achterlaten</span>
        </button>
        <div class="comments-field" id="comments-field-${step.id}">
          <textarea name="opmerkingen_stap_${step.id}" placeholder="Optioneel: laat hier een opmerking achter"></textarea>
        </div>
      </div>
    `;
  }

  return `<div class="step" data-step="${step.id}">${content}</div>`;
}

/**
 * Generate all survey steps
 */
export function renderSurveySteps() {
  return SURVEY_STEPS.map(renderStep).join('\n');
}

/**
 * Generate navigation index
 */
export function renderNavIndex() {
  return SURVEY_STEPS.map(step => `
    <div class="index-item${step.id === 0 ? ' active' : ''}" data-step="${step.id}" data-action="goToStep">
      <span class="status">○</span>
      <span class="label">${step.title}</span>
    </div>
  `).join('');
}
