/**
 * Modal dialogs module
 * Handles all modal windows (validation, error, preview, restart, etc.)
 */

import { escapeHtml } from './utils.js';

/**
 * Show the restart choice modal
 */
export function showRestartChoiceModal() {
  const modal = document.getElementById('restartChoiceModal');
  if (modal) {
    populateArchivedFormsList();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide the restart choice modal
 */
export function hideRestartChoiceModal() {
  const modal = document.getElementById('restartChoiceModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Show the clear warning modal
 */
export function showClearWarningModal() {
  const restartModal = document.getElementById('restartChoiceModal');
  const warningModal = document.getElementById('clearWarningModal');
  if (restartModal) restartModal.style.display = 'none';
  if (warningModal) warningModal.style.display = 'flex';
}

/**
 * Hide the clear warning modal and go back to choice
 */
export function hideClearWarningModal() {
  const warningModal = document.getElementById('clearWarningModal');
  const restartModal = document.getElementById('restartChoiceModal');
  if (warningModal) warningModal.style.display = 'none';
  if (restartModal) restartModal.style.display = 'flex';
}

/**
 * Show the validation modal with custom message
 * @param {string} title - The modal title
 * @param {string} message - The validation message
 * @param {Object} options - Optional settings (linkText, linkAction)
 */
export function showValidationModal(title, message, options = {}) {
  const modal = document.getElementById('validationModal');
  const titleEl = document.getElementById('validationModalTitle');
  const textEl = document.getElementById('validationModalText');
  const linkEl = document.getElementById('validationModalLink');

  if (modal && titleEl && textEl) {
    titleEl.textContent = title;
    textEl.textContent = message;

    if (linkEl) {
      if (options.linkText && options.linkAction) {
        linkEl.textContent = options.linkText;
        linkEl.style.display = 'inline-block';
        linkEl.onclick = (e) => {
          e.preventDefault();
          hideValidationModal();
          options.linkAction();
        };
      } else {
        linkEl.style.display = 'none';
      }
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide the validation modal
 */
export function hideValidationModal() {
  const modal = document.getElementById('validationModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Show the error modal with custom message
 * @param {string} title - The modal title
 * @param {string} message - The error message
 */
export function showErrorModal(title, message) {
  const modal = document.getElementById('errorModal');
  const titleEl = document.getElementById('errorModalTitle');
  const textEl = document.getElementById('errorModalText');

  if (modal && titleEl && textEl) {
    titleEl.textContent = title;
    textEl.textContent = message;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide the error modal
 */
export function hideErrorModal() {
  const modal = document.getElementById('errorModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Show the preview mode modal (for public access submission attempt)
 */
export function showPreviewModal() {
  const modal = document.getElementById('previewModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide the preview mode modal
 */
export function hidePreviewModal() {
  const modal = document.getElementById('previewModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Initialize preview mode UI elements
 */
export function initPreviewMode(session) {
  if (!session || !session.isPublic) {
    return;
  }

  const topBox = document.getElementById('previewInfoBoxTop');
  const bottomBox = document.getElementById('previewInfoBoxBottom');
  const exitBannerTop = document.getElementById('previewExitBannerTop');
  const exitBannerBottom = document.getElementById('previewExitBannerBottom');

  if (topBox) {
    topBox.classList.add('visible');
  }
  if (bottomBox) {
    bottomBox.classList.add('visible');
  }
  if (exitBannerTop) {
    exitBannerTop.classList.add('visible');
  }
  if (exitBannerBottom) {
    exitBannerBottom.classList.add('visible');
  }
}

/**
 * Populate the archived forms list in the modal
 */
export function populateArchivedFormsList() {
  const section = document.getElementById('archivedFormsSection');
  const list = document.getElementById('archivedFormsList');
  if (!section || !list) return;

  const forms = window.Storage.getSubmittedForms();

  if (forms.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = forms.map((form, index) => {
    const date = new Date(form.submittedAt);
    const dateStr = date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const isLatest = index === 0;

    return `
      <div class="archived-form-item ${isLatest ? 'archived-form-latest' : ''}">
        <div class="archived-form-info">
          <span class="archived-form-org">${escapeHtml(form.orgName)}</span>
          <span class="archived-form-date">${dateStr}</span>
          ${isLatest ? '<span class="archived-form-badge">Laatst verzonden</span>' : ''}
        </div>
        <div class="archived-form-actions">
          <button type="button" class="btn btn-small btn-tertiary" data-action="printArchivedForm" data-form-id="${form.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
        </div>
      </div>
    `;
  }).join('');
}
