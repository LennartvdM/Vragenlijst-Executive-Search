/**
 * Modal Dialog — Imperative API
 *
 * Create and show modal dialogs with configurable icon, text, and buttons.
 *
 * @example
 *   const modal = createModal({
 *     icon: 'warning',
 *     title: 'Are you sure?',
 *     text: 'This action cannot be undone.',
 *     buttons: [
 *       { label: 'Cancel', variant: 'secondary', action: () => modal.close() },
 *       { label: 'Delete', variant: 'danger', action: () => { doDelete(); modal.close(); } }
 *     ]
 *   });
 *   modal.open();
 */

const ICON_SVGS = {
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>`,
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};

/**
 * @typedef {Object} ModalButton
 * @property {string} label
 * @property {'primary'|'secondary'|'tertiary'|'danger'} [variant='primary']
 * @property {Function} action - Called on click
 */

/**
 * @typedef {Object} ModalConfig
 * @property {'info'|'warning'|'error'|'success'} [icon]
 * @property {string} title
 * @property {string} [text]       - Body text (supports HTML)
 * @property {boolean} [warning]   - Apply warning text color
 * @property {ModalButton[]} buttons
 * @property {string} [link]       - Optional link text
 * @property {string} [linkHref]   - Optional link URL
 */

/**
 * Create a modal dialog.
 * @param {ModalConfig} config
 * @returns {{ open: Function, close: Function, el: HTMLElement }}
 */
export function createModal(config) {
  const overlay = document.createElement('div');
  overlay.className = 'vl-modal-overlay';
  overlay.setAttribute('hidden', '');

  let iconHtml = '';
  if (config.icon && ICON_SVGS[config.icon]) {
    iconHtml = `
      <div class="vl-modal__icon vl-modal__icon--${config.icon}">
        ${ICON_SVGS[config.icon]}
      </div>`;
  }

  const textClass = config.warning ? 'vl-modal__text vl-modal__text--warning' : 'vl-modal__text';

  const buttonsHtml = (config.buttons || []).map(btn => {
    const variant = btn.variant || 'primary';
    return `<button type="button" class="vl-btn vl-btn--${variant}" data-modal-action>${btn.label}</button>`;
  }).join('');

  let linkHtml = '';
  if (config.link) {
    linkHtml = `<a href="${config.linkHref || '#'}" class="vl-modal__link">${config.link}</a>`;
  }

  overlay.innerHTML = `
    <div class="vl-modal">
      ${iconHtml}
      <h2>${config.title}</h2>
      ${config.text ? `<p class="${textClass}">${config.text}</p>` : ''}
      <div class="vl-modal__buttons">${buttonsHtml}</div>
      ${linkHtml}
    </div>`;

  // Wire up button actions
  const buttonEls = overlay.querySelectorAll('[data-modal-action]');
  buttonEls.forEach((el, i) => {
    if (config.buttons[i]?.action) {
      el.addEventListener('click', config.buttons[i].action);
    }
  });

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  function open() {
    document.body.appendChild(overlay);
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  return { open, close, el: overlay };
}
