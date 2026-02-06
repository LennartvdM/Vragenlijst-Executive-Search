/**
 * Conditional Fields — Show/hide logic
 *
 * Listens for radio changes and toggles visibility of
 * .vl-conditional sections based on data-parent / data-trigger attributes.
 */

/**
 * Initialize conditional field behavior within a container.
 * @param {HTMLElement} root - Container element (e.g. .vl-form)
 */
export function initConditionals(root) {
  root.addEventListener('change', (e) => {
    const radio = e.target;
    if (radio.type !== 'radio') return;

    const name = radio.name;
    const conditional = root.querySelector(`#conditional-${CSS.escape(name)}`);
    if (!conditional) return;

    const trigger = conditional.dataset.trigger;
    const shouldShow = radio.value === trigger;

    if (shouldShow) {
      conditional.classList.add('show');
    } else {
      conditional.classList.remove('show');
    }

    // Update parent card's conditional state
    updateCardConditionalState(root, name, conditional, shouldShow);
  });

  // Sync initial state for pre-filled forms
  syncConditionals(root);
}

/**
 * Sync all conditional fields to match current radio states.
 * Call this after loading saved form data.
 * @param {HTMLElement} root
 */
export function syncConditionals(root) {
  root.querySelectorAll('.vl-conditional').forEach(conditional => {
    const parentName = conditional.dataset.parent;
    const trigger = conditional.dataset.trigger;
    if (!parentName || !trigger) return;

    const checked = root.querySelector(`input[name="${CSS.escape(parentName)}"]:checked`);
    if (checked && checked.value === trigger) {
      conditional.classList.add('show');
    } else {
      conditional.classList.remove('show');
    }
  });
}

/**
 * Update parent option card's visual state based on conditional completeness.
 * @param {HTMLElement} root
 * @param {string} parentName
 * @param {HTMLElement} conditional
 * @param {boolean} isVisible
 */
function updateCardConditionalState(root, parentName, conditional, isVisible) {
  const selectedCard = root.querySelector(
    `input[name="${CSS.escape(parentName)}"]:checked`
  )?.closest('.vl-option-card');

  if (!selectedCard) return;

  if (!isVisible) {
    selectedCard.classList.remove('awaiting-conditional', 'conditional-satisfied');
    return;
  }

  // Check if all conditional fields are filled
  const fields = conditional.querySelectorAll('input, textarea, select');
  const allFilled = Array.from(fields).every(f => {
    if (f.type === 'radio') {
      return root.querySelector(`input[name="${CSS.escape(f.name)}"]:checked`);
    }
    return f.value.trim() !== '';
  });

  selectedCard.classList.toggle('awaiting-conditional', !allFilled);
  selectedCard.classList.toggle('conditional-satisfied', allFilled);
}
