/**
 * Build script: generates views/survey.html from data
 * Run: node scripts/build-survey-html.js
 */

import { SURVEY_STEPS, LIKERT_OPTIONS } from '../src/data/survey-data.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// TEMPLATE RENDERERS
// ============================================================================

function renderLikertTable(likert) {
  const rows = likert.questions.map((q, i) => `
              <tr>
                <td><span class="q-num">${i + 1}.</span> ${q}</td>
                ${LIKERT_OPTIONS.map(opt => `<td><input type="radio" name="${likert.prefix}_${i + 1}" value="${opt.value}"></td>`).join('')}
              </tr>`).join('');

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
            <tbody>${rows}
            </tbody>
          </table>`;
}

function renderRadioCards(field) {
  const cards = field.options.map(opt => `
            <label class="option-card">
              <input type="radio" name="${field.name}" value="${opt.value}">
              <div class="option-content">
                <h3>${opt.label}</h3>${opt.description ? `
                <p>${opt.description}</p>` : ''}
              </div>
            </label>`).join('');

  let conditionalHtml = '';
  if (field.conditional) {
    conditionalHtml = `
          <div class="conditional" id="conditional-${field.name}">
            ${field.conditional.fields.map(f => renderField(f)).join('')}
          </div>`;
  }

  return `
          <div class="question-header" id="header-${field.name}">${field.label ? `
            <label>${field.label}</label>` : ''}
            <button type="button" class="reset-btn" data-action="resetGroup" data-name="${field.name}" title="Wis selectie">↺</button>
          </div>
          <div class="option-cards">${cards}
          </div>${conditionalHtml}`;
}

function renderField(field) {
  switch (field.type) {
    case 'radio-cards': return renderRadioCards(field);
    case 'number': return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="number" id="${field.name}" name="${field.name}" min="0">
          </div>`;
    case 'text': return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="text" id="${field.name}" name="${field.name}">
          </div>`;
    case 'textarea': return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <textarea id="${field.name}" name="${field.name}" rows="3"></textarea>
          </div>`;
    case 'date': return `
          <div class="field">
            <label for="${field.name}">${field.label}</label>
            <input type="text" id="datumPicker" name="${field.name}" readonly>
          </div>`;
    case 'checkbox': return `
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input type="checkbox" name="${field.name}">
              <span>${field.label}</span>
            </label>
          </div>`;
    default: return '';
  }
}

function renderStep(step) {
  let content = '';

  if (step.sectionNum) {
    content += `
        <h1><span class="section-num">${step.sectionNum}</span> ${step.title}</h1>`;
  } else if (step.type !== 'welcome' && step.type !== 'intro') {
    content += `
        <h1>${step.title}</h1>`;
  }

  if (step.subtitle) {
    content += `
        <p class="subtitle">${step.subtitle}</p>`;
  }

  if (step.content) {
    content += `
        <h1>${step.content.heading}</h1>`;
    if (step.content.text) content += `
        <p>${step.content.text}</p>`;
    if (step.content.intro) content += `
        <p>${step.content.intro}</p>`;
  }

  if (step.fields || step.likert) {
    content += `
        <div class="form-section">`;
    if (step.likert) content += renderLikertTable(step.likert);
    if (step.fields) content += step.fields.map(f => renderField(f)).join('');
    if (step.toelichting) content += `
          <div class="field">
            <label>Toelichting (optioneel)</label>
            <textarea name="${step.toelichting}" rows="3" placeholder="Licht uw antwoorden toe..."></textarea>
          </div>`;
    content += `
        </div>

        <div class="comments-section">
          <button type="button" class="comments-toggle" data-action="toggleComments" data-step="${step.id}">
            <span class="comments-label">Opmerking achterlaten</span>
          </button>
          <div class="comments-field" id="comments-field-${step.id}">
            <textarea name="opmerkingen_stap_${step.id}" placeholder="Optioneel: laat hier een opmerking achter"></textarea>
          </div>
        </div>`;
  }

  return `
      <div class="step${step.id === 0 ? ' active' : ''}" data-step="${step.id}">${content}
      </div>`;
}

function renderNavItems() {
  return SURVEY_STEPS.map((step, i) => {
    if (step.id === 4) {
      return `    <div class="index-divider-sub index-divider-clickable" data-step="${step.id}" data-action="goToStep">Kwalitatief</div>`;
    }
    if (step.id === 11) {
      return `    <div class="index-divider-sub">Afsluiting</div>
    <div class="index-item" data-step="${step.id}" data-action="goToStep">
      <span class="status">○</span>
      <span class="label">${step.title}</span>
    </div>`;
    }
    return `    <div class="index-item${step.id === 0 ? ' active' : ''}" data-step="${step.id}" data-action="goToStep">
      <span class="status">○</span>
      <span class="label">${step.title}</span>
    </div>`;
  }).join('\n');
}

// ============================================================================
// FULL HTML TEMPLATE
// ============================================================================

const fullHtml = `<!-- AUTO-GENERATED - Edit src/data/survey-data.js, then run: node scripts/build-survey-html.js -->
<!-- Mobile Menu Button -->
<button type="button" class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu">
  <span class="hamburger-line"></span>
  <span class="hamburger-line"></span>
  <span class="hamburger-line"></span>
</button>

<!-- Mobile Overlay -->
<div class="mobile-overlay" id="mobileOverlay"></div>

<noscript>
  <div style="background:#fef3c7;border:1px solid #f59e0b;padding:20px;margin:20px;border-radius:8px;text-align:center;">
    <p style="margin:0 0 10px 0;font-weight:bold;">JavaScript is vereist voor deze vragenlijst.</p>
    <p style="margin:0;"><a href="/index.html?logout=1" style="color:#b45309;">Klik hier om terug te gaan naar de inlogpagina</a></p>
  </div>
</noscript>

<div class="container">
  <div class="index">
    <div class="mobile-highlighter" id="mobileHighlighter"></div>
    <h2>Monitoring Cultureel</h2>
    <div class="index-divider-full"></div>
    <div class="progress-bar-container">
      <div class="progress-bar" id="progressBar">
        <div class="progress-bar-fill" id="progressBarFill"></div>
      </div>
      <span class="progress-percentage" id="progressPercentage">0%</span>
    </div>
    <div class="index-divider-full"></div>
${renderNavItems()}
    <div class="index-divider-full"></div>
    <div class="org-info" id="orgInfo">
      <div class="org-name" id="orgNameDisplay">-</div>
      <div class="org-code" id="orgCodeDisplay">-</div>
      <a href="/index.html?logout=1" class="logout-btn" data-action="logout">Uitloggen</a>
    </div>
  </div>

  <div class="content">
    <div class="content-header">
      <div class="progress-dots-top-container">
        <div class="progress-dots progress-dots-top" id="progressDotsTop"></div>
      </div>
      <div class="top-bar">
        <div class="preview-info-box preview-info-box-top" id="previewInfoBoxTop">
          <p class="preview-info-box-title">Inkijkexemplaar</p>
          <p class="preview-info-box-subtitle">Ingevulde gegevens worden niet verstuurd</p>
        </div>
        <div class="nav-buttons nav-buttons-top" id="navButtonsTop">
          <button type="button" class="btn btn-secondary btn-small" id="btnPrevTop" data-action="prevStep" style="display:none;">Vorige</button>
          <button type="button" class="btn btn-tertiary btn-small" id="btnGoToReviewTop" data-action="goToReview" style="display:none;">Controle</button>
          <button type="button" class="btn btn-primary btn-small" id="btnNextTop" data-action="nextStep">Volgende</button>
        </div>
      </div>
    </div>

    <div class="content-scrollable-wrapper">
      <div class="custom-scrollbar" id="customScrollbar">
        <div class="custom-scrollbar-thumb" id="customScrollbarThumb"></div>
      </div>
      <div class="content-scrollable" id="contentScrollable">
        <form id="monitoringForm">
${SURVEY_STEPS.map(renderStep).join('\n')}

      <!-- Review Step -->
      <div class="step" data-step="14">
        <h1>Controleer uw antwoorden</h1>
        <p class="subtitle">Controleer hieronder uw antwoorden voordat u verzendt.</p>
        <div id="reviewContent"></div>
      </div>

      <!-- Success Step -->
      <div class="step" data-step="15">
        <div class="success-content">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Bedankt voor uw deelname!</h1>
          <p>Uw monitoring is succesvol verzonden.</p>
          <div class="success-actions">
            <button type="button" class="btn btn-secondary" data-action="printForm">Afdrukken</button>
            <button type="button" class="btn btn-primary" data-action="startNewForm">Nieuw formulier</button>
          </div>
        </div>
      </div>

        </form>
      </div>
    </div>

    <div class="content-footer">
      <div class="preview-info-box preview-info-box-bottom" id="previewInfoBoxBottom">
        <p class="preview-info-box-title">Inkijkexemplaar</p>
        <p class="preview-info-box-subtitle">Ingevulde gegevens worden niet verstuurd</p>
      </div>
      <div class="nav-buttons" id="navButtons">
        <button type="button" class="btn btn-secondary" id="btnPrev" data-action="prevStep" style="display:none;">Vorige</button>
        <button type="button" class="btn btn-tertiary" id="btnGoToReview" data-action="goToReview" style="display:none;">Ga naar controle</button>
        <button type="button" class="btn btn-primary" id="btnNext" data-action="nextStep">Volgende</button>
      </div>
      <div class="progress-dots" id="progressDots"></div>
    </div>
  </div>
</div>

<!-- Modals -->
<div id="restartChoiceModal" class="modal-overlay" style="display: none;">
  <div class="modal-content">
    <h2>Formulier opnieuw invullen</h2>
    <p class="modal-text">U heeft al een formulier ingevuld. Wilt u doorgaan met uw bestaande gegevens of opnieuw beginnen?</p>
    <div class="modal-buttons">
      <button type="button" class="btn btn-secondary" data-action="continueExistingForm">Doorgaan</button>
      <button type="button" class="btn btn-primary" data-action="showClearWarning">Opnieuw beginnen</button>
    </div>
    <div id="archivedFormsList" class="archived-forms-list"></div>
  </div>
</div>

<div id="clearWarningModal" class="modal-overlay" style="display: none;">
  <div class="modal-content">
    <div class="modal-icon modal-icon-warning">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <h2>Let op!</h2>
    <p class="modal-text modal-text-warning">Weet u zeker dat u een leeg formulier wilt starten?<br><strong>Uw lokale gegevens worden gewist.</strong></p>
    <div class="modal-buttons">
      <button type="button" class="btn btn-secondary" data-action="cancelClearForm">Annuleren</button>
      <button type="button" class="btn btn-danger" data-action="confirmClearForm">Ja, wis alles</button>
    </div>
  </div>
</div>

<div id="validationModal" class="modal-overlay" style="display: none;">
  <div class="modal-content">
    <div class="modal-icon modal-icon-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <h2 id="validationModalTitle">Nog niet compleet</h2>
    <p class="modal-text" id="validationModalText">Vul alle verplichte velden in.</p>
    <div class="modal-buttons">
      <button type="button" class="btn btn-primary" data-action="closeValidationModal">Begrepen</button>
    </div>
    <a href="#" id="validationModalLink" class="modal-link" style="display: none;"></a>
  </div>
</div>

<div id="errorModal" class="modal-overlay" style="display: none;">
  <div class="modal-content">
    <div class="modal-icon modal-icon-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    <h2 id="errorModalTitle">Er ging iets mis</h2>
    <p class="modal-text" id="errorModalText">Probeer het opnieuw.</p>
    <div class="modal-buttons">
      <button type="button" class="btn btn-primary" data-action="closeErrorModal">Sluiten</button>
    </div>
  </div>
</div>

<div id="previewModal" class="modal-overlay" style="display: none;">
  <div class="modal-content">
    <div class="modal-icon modal-icon-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    </div>
    <h2>Inkijkexemplaar</h2>
    <p class="modal-text">Dit is een openbaar inkijkexemplaar.<br><strong>Ingevulde gegevens worden niet verstuurd.</strong></p>
    <div class="modal-buttons">
      <button type="button" class="btn btn-primary" data-action="closePreviewModal">Begrepen</button>
    </div>
  </div>
</div>`;

// Write output
const outputPath = join(__dirname, '..', 'views', 'survey.html');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, fullHtml);
console.log(`Generated: ${outputPath} (${fullHtml.split('\n').length} lines)`);
