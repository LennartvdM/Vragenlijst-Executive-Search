/**
 * Radio Cards — Interactive behavior
 *
 * Handles selection state, .selected class toggle,
 * and reset button visibility.
 */

/**
 * Initialize radio card selection behavior within a container.
 * @param {HTMLElement} root - Container element (e.g. .vl-form)
 */
export function initRadioCards(root) {
  // Delegate click events on option cards
  root.addEventListener('change', (e) => {
    const radio = e.target;
    if (radio.type !== 'radio') return;

    const card = radio.closest('.vl-option-card');
    if (!card) return;

    const name = radio.name;
    const container = card.closest('.vl-option-cards');
    if (!container) return;

    // Clear selection from all cards in this group
    container.querySelectorAll(`.vl-option-card`).forEach(c => {
      c.classList.remove('selected', 'awaiting-conditional', 'conditional-satisfied');
    });

    // Mark selected
    card.classList.add('selected');

    // Show reset button
    const header = root.querySelector(`#header-${CSS.escape(name)}`);
    if (header) {
      const resetBtn = header.querySelector('.vl-reset-btn');
      if (resetBtn) resetBtn.classList.add('has-value');
    }
  });
}

/**
 * Reset a radio group by name.
 * @param {HTMLElement} root
 * @param {string} name - Radio group name
 */
export function resetRadioGroup(root, name) {
  const radios = root.querySelectorAll(`input[name="${CSS.escape(name)}"]`);
  radios.forEach(r => {
    r.checked = false;
    const card = r.closest('.vl-option-card');
    if (card) card.classList.remove('selected', 'awaiting-conditional', 'conditional-satisfied');
  });

  const header = root.querySelector(`#header-${CSS.escape(name)}`);
  if (header) {
    const resetBtn = header.querySelector('.vl-reset-btn');
    if (resetBtn) resetBtn.classList.remove('has-value');
  }
}
