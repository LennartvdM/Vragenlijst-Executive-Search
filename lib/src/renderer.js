/**
 * Schema-to-HTML Renderer — @vragenlijst/forms
 *
 * Turns a FormSchema into semantic HTML with the vl-* class vocabulary.
 * Works both server-side (Node) and client-side (browser).
 *
 * Usage:
 *   import { renderForm } from '@vragenlijst/forms';
 *   const html = renderForm(schema);
 *   document.getElementById('root').innerHTML = html;
 */

import { DEFAULT_LIKERT_OPTIONS, DEFAULT_LABELS, validateSchema } from './schema.js';

/**
 * Escape HTML entities in user-provided strings.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ──────────────────────────────────────────────────────────────
// Field renderers
// ──────────────────────────────────────────────────────────────

function renderInfoBlock(field) {
  const paragraphs = field.content.split('\n\n').map(p => {
    const lines = p.split('\n');
    if (lines.length > 1 && /^\d+\./.test(lines[0])) {
      return `<ol class="vl-info-block__list">${lines.map(line =>
        `<li>${line.replace(/^\d+\.\s*/, '')}</li>`
      ).join('')}</ol>`;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return `<div class="vl-info-block">${paragraphs}</div>`;
}

function renderRadioCards(field, labels) {
  const triggerValue = field.conditional?.trigger || 'Yes';

  let conditionalHtml = '';
  if (field.conditional) {
    conditionalHtml = `
      <div class="vl-conditional" id="conditional-${esc(field.name)}" data-parent="${esc(field.name)}" data-trigger="${esc(field.conditional.trigger)}">
        ${field.conditional.fields.map(f => renderField(f, labels)).join('')}
      </div>`;
  }

  const cards = field.options.map(opt => {
    let cardHtml = `
      <label class="vl-option-card">
        <input type="radio" name="${esc(field.name)}" value="${esc(opt.value)}">
        <span class="vl-option-radio"></span>
        <div class="vl-option-content">
          <h3>${opt.label}</h3>${opt.description ? `
          <p>${opt.description}</p>` : ''}
        </div>
      </label>`;

    if (field.conditional && opt.value === triggerValue) {
      cardHtml += conditionalHtml;
    }
    return cardHtml;
  }).join('');

  return `
    <div class="vl-question-header" id="header-${esc(field.name)}">
      ${field.label ? `<label>${field.label}</label>` : ''}
      <button type="button" class="vl-reset-btn" data-action="resetGroup" data-name="${esc(field.name)}" title="${esc(labels.reset)}">${labels.reset}</button>
    </div>
    <div class="vl-option-cards">${cards}
    </div>`;
}

function renderRadio(field, labels) {
  const triggerValue = field.conditional?.trigger;

  let conditionalHtml = '';
  if (field.conditional) {
    conditionalHtml = `
      <div class="vl-conditional" id="conditional-${esc(field.name)}" data-parent="${esc(field.name)}" data-trigger="${esc(field.conditional.trigger)}">
        ${field.conditional.fields.map(f => renderField(f, labels)).join('')}
      </div>`;
  }

  const options = field.options.map(opt => {
    let html = `
      <label class="vl-option-card">
        <input type="radio" name="${esc(field.name)}" value="${esc(opt.value)}">
        <span class="vl-option-radio"></span>
        <div class="vl-option-content">
          <h3>${opt.label}</h3>
        </div>
      </label>`;

    if (field.conditional && opt.value === triggerValue) {
      html += conditionalHtml;
    }
    return html;
  }).join('');

  return `
    <div class="vl-question-header" id="header-${esc(field.name)}">
      ${field.label ? `<label>${field.label}</label>` : ''}
      <button type="button" class="vl-reset-btn" data-action="resetGroup" data-name="${esc(field.name)}" title="${esc(labels.reset)}">${labels.reset}</button>
    </div>
    <div class="vl-option-cards">${options}
    </div>`;
}

function renderTextField(field) {
  const placeholder = field.placeholder ? ` placeholder="${esc(field.placeholder)}"` : '';
  const required = field.required ? ' required' : '';
  return `
    <div class="vl-field">
      <label for="${esc(field.name)}">${field.label}</label>
      <input type="text" id="${esc(field.name)}" name="${esc(field.name)}"${placeholder}${required}>
    </div>`;
}

function renderNumberField(field) {
  const compactClass = field.compact ? ' vl-field--compact' : '';
  const indentClass = field.indent ? ' vl-field--indent' : '';
  const placeholder = field.placeholder ? ` placeholder="${esc(field.placeholder)}"` : '';
  const maxLength = field.maxLength ? ` maxlength="${field.maxLength}"` : '';
  const suffix = field.suffix ? `<span class="vl-field__suffix">${esc(field.suffix)}</span>` : '';
  const hint = field.hint ? `\n      <span class="vl-field__hint">${field.hint}</span>` : '';

  return `
    <div class="vl-field${compactClass}${indentClass}">
      <label for="${esc(field.name)}">${field.label}</label>
      <div class="vl-field__input-wrapper">
        <input type="text" inputmode="numeric" pattern="[0-9]*" id="${esc(field.name)}" name="${esc(field.name)}"${placeholder}${maxLength}>
        ${suffix}
      </div>${hint}
    </div>`;
}

function renderTextarea(field) {
  return `
    <div class="vl-field">
      <label for="${esc(field.name)}">${field.label}</label>
      <textarea id="${esc(field.name)}" name="${esc(field.name)}" rows="3"></textarea>
    </div>`;
}

function renderDate(field) {
  return `
    <div class="vl-field">
      <label for="${esc(field.name)}">${field.label}</label>
      <input type="date" id="${esc(field.name)}" name="${esc(field.name)}">
    </div>`;
}

function renderCheckbox(field) {
  const indentClass = field.indent ? ' vl-field--indent' : '';
  return `
    <div class="vl-field${indentClass}">
      <label class="vl-checkbox">
        <input type="checkbox" name="${esc(field.name)}">
        <span>${field.label}</span>
      </label>
    </div>`;
}

function renderField(field, labels) {
  switch (field.type) {
    case 'radio-cards': return renderRadioCards(field, labels);
    case 'radio':       return renderRadio(field, labels);
    case 'info-block':  return renderInfoBlock(field);
    case 'number':      return renderNumberField(field);
    case 'text':        return renderTextField(field);
    case 'textarea':    return renderTextarea(field);
    case 'date':        return renderDate(field);
    case 'checkbox':    return renderCheckbox(field);
    default:            return `<!-- unknown field type: ${esc(field.type)} -->`;
  }
}

function renderFieldsWithGroups(fields, labels) {
  let html = '';
  let i = 0;
  while (i < fields.length) {
    const field = fields[i];

    // Group type: explicit nested group
    if (field.type === 'group') {
      html += `<div class="vl-question-group" data-group="${esc(field.name)}">`;
      if (field.label) {
        html += `<label class="vl-field__group-label">${field.label}</label>`;
      }
      if (Array.isArray(field.fields)) {
        html += field.fields.map(f => renderField(f, labels)).join('');
      }
      html += `</div>`;
      i++;
      continue;
    }

    // Implicit grouping via .group property
    if (field.group) {
      const groupName = field.group;
      const groupFields = [];
      while (i < fields.length && fields[i].group === groupName) {
        groupFields.push(fields[i]);
        i++;
      }
      html += `<div class="vl-question-group" data-group="${esc(groupName)}">` +
        groupFields.map(f => renderField(f, labels)).join('') +
        `</div>`;
    } else {
      html += renderField(field, labels);
      i++;
    }
  }
  return html;
}

// ──────────────────────────────────────────────────────────────
// Likert table renderer
// ──────────────────────────────────────────────────────────────

function renderLikertTable(likert, likertOptions, labels) {
  const rows = likert.questions.map((q, i) => `
        <tr>
          <td><span class="q-num">${i + 1}.</span> ${q}</td>
          ${likertOptions.map(opt =>
            `<td><input type="radio" name="${esc(likert.prefix)}_${i + 1}" value="${opt.value}"></td>`
          ).join('')}
        </tr>`).join('');

  return `
    <div class="vl-likert-header" id="header-${esc(likert.id)}">
      <span></span>
      <button type="button" class="vl-reset-btn" data-action="resetLikertTable" data-table="${esc(likert.id)}" title="${esc(labels.reset)}">${labels.reset}</button>
    </div>
    <table class="vl-likert-table" id="${esc(likert.id)}">
      <thead>
        <tr>
          <th class="vl-likert-header-label">${labels.likertHeader}</th>
          ${likertOptions.map(opt => `<th>${esc(opt.label)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>`;
}

// ──────────────────────────────────────────────────────────────
// Step renderer
// ──────────────────────────────────────────────────────────────

function renderStep(step, likertOptions, labels) {
  let content = '';

  // Title
  if (step.sectionNum) {
    content += `<h1><span class="section-num">${esc(step.sectionNum)}</span> ${esc(step.title)}</h1>`;
  } else if (step.type !== 'welcome' && step.type !== 'intro') {
    content += `<h1>${esc(step.title)}</h1>`;
  }

  // Subtitle
  if (step.subtitle) {
    content += `<p class="subtitle">${step.subtitle}</p>`;
  }

  // Static content
  if (step.content) {
    if (step.content.heading) content += `<h1>${step.content.heading}</h1>`;
    if (step.content.text) content += `<p>${step.content.text}</p>`;
    if (step.content.intro) content += `<p class="vl-welcome-intro">${step.content.intro}</p>`;
  }

  // Intro text
  if (step.introText) {
    content += `<p class="vl-step-intro">${step.introText}</p>`;
  }

  // Fields + Likert
  if (step.fields || step.likert) {
    content += `<div class="vl-form-section">`;

    if (step.likert) {
      content += renderLikertTable(step.likert, likertOptions, labels);
    }

    if (step.fields) {
      content += renderFieldsWithGroups(step.fields, labels);
    }

    if (step.toelichting) {
      content += `
        <div class="vl-field">
          <label>${labels.toelichtingLabel}</label>
          <textarea name="${esc(step.toelichting)}" rows="3" placeholder="${esc(labels.toelichtingPlaceholder)}"></textarea>
        </div>`;
    }

    // Comments toggle
    content += `
      <div class="vl-comments-section">
        <button type="button" class="vl-comments-toggle" data-action="toggleComments" data-step="${step.id}">
          <span class="vl-comments-label">${labels.commentToggle}</span>
        </button>
        <div class="vl-comments-field" id="comments-field-${step.id}">
          <textarea name="comments_step_${step.id}" placeholder="${esc(labels.commentPlaceholder)}"></textarea>
        </div>
      </div>`;

    content += `</div>`;
  }

  return `
  <div class="vl-step${step.id === 0 ? ' active' : ''}" data-step="${step.id}">
    ${content}
  </div>`;
}

// ──────────────────────────────────────────────────────────────
// Navigation renderer
// ──────────────────────────────────────────────────────────────

function renderNavItems(steps) {
  return steps.map(step => `
    <div class="vl-nav-item${step.id === 0 ? ' active' : ''}" data-step="${step.id}" data-action="goToStep">
      <span class="vl-nav-status"></span>
      <span class="vl-nav-label">${esc(step.title)}</span>
    </div>`).join('');
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Render a complete multi-step form from a schema.
 *
 * @param {import('./schema.js').FormSchema} schema
 * @param {Object} [options]
 * @param {boolean} [options.includeNav=true]   - Include sidebar navigation
 * @param {boolean} [options.includeProgress=true] - Include progress bar
 * @returns {string} HTML string
 */
export function renderForm(schema, options = {}) {
  const errors = validateSchema(schema);
  if (errors.length > 0) {
    throw new Error(`Invalid form schema:\n  - ${errors.join('\n  - ')}`);
  }

  const likertOptions = schema.likertOptions || DEFAULT_LIKERT_OPTIONS;
  const labels = { ...DEFAULT_LABELS, ...(schema.labels || {}) };
  const { includeNav = true, includeProgress = true } = options;

  const stepsHtml = schema.steps.map(step =>
    renderStep(step, likertOptions, labels)
  ).join('\n');

  let navHtml = '';
  if (includeNav) {
    navHtml = `
  <nav class="vl-sidebar">
    ${includeProgress ? `
    <div class="vl-progress">
      <div class="vl-progress__bar">
        <div class="vl-progress__fill" id="vlProgressFill"></div>
      </div>
      <span class="vl-progress__label" id="vlProgressLabel">0%</span>
    </div>` : ''}
    <div class="vl-nav">
      ${renderNavItems(schema.steps)}
    </div>
  </nav>`;
  }

  return `
<div class="vl-form" data-total-steps="${schema.steps.length}">
  ${navHtml}
  <main class="vl-content">
    ${includeProgress ? `
    <div class="vl-progress-dots" id="vlProgressDots"></div>` : ''}
    <div class="vl-content-header">
      <div class="vl-nav-buttons">
        <button type="button" class="vl-btn vl-btn--secondary vl-btn--small" data-action="prevStep" hidden>${labels.previous}</button>
        <button type="button" class="vl-btn vl-btn--primary vl-btn--small" data-action="nextStep">${labels.next}</button>
      </div>
    </div>
    <div class="vl-content-scrollable">
      <form id="vlForm">
        ${stepsHtml}
      </form>
    </div>
    <div class="vl-content-footer">
      <div class="vl-nav-buttons">
        <button type="button" class="vl-btn vl-btn--secondary vl-btn--small" data-action="prevStep" hidden>${labels.previous}</button>
        <button type="button" class="vl-btn vl-btn--primary vl-btn--small" data-action="nextStep">${labels.next}</button>
      </div>
    </div>
  </main>
</div>`;
}

/**
 * Render a single step (for dynamic loading or partial rendering).
 *
 * @param {import('./schema.js').Step} step
 * @param {import('./schema.js').LikertOption[]} [likertOptions]
 * @param {Object} [labelOverrides]
 * @returns {string} HTML string
 */
export function renderSingleStep(step, likertOptions, labelOverrides) {
  const opts = likertOptions || DEFAULT_LIKERT_OPTIONS;
  const labels = { ...DEFAULT_LABELS, ...(labelOverrides || {}) };
  return renderStep(step, opts, labels);
}
