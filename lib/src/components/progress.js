/**
 * Progress — Bar fill and dot indicators
 *
 * Updates progress bar fill width and dot states
 * based on form completion percentage.
 */

/**
 * Update the progress bar to a given percentage.
 * @param {HTMLElement} root - The .vl-form element
 * @param {number} percent - 0 to 100
 */
export function updateProgressBar(root, percent) {
  const fill = root.querySelector('#vlProgressFill');
  const label = root.querySelector('#vlProgressLabel');

  if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (label) label.textContent = `${Math.round(percent)}%`;
}

/**
 * Render progress dots for each step.
 * @param {HTMLElement} root
 * @param {number} totalSteps
 * @param {number} currentStep
 * @param {Object<number, 'complete'|'partial'>} [stepStates] - Status per step index
 */
export function renderProgressDots(root, totalSteps, currentStep, stepStates = {}) {
  const container = root.querySelector('#vlProgressDots');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement('span');
    dot.className = 'vl-progress-dot';

    if (i === currentStep) {
      dot.classList.add('vl-progress-dot--active');
    } else if (stepStates[i] === 'complete') {
      dot.classList.add('vl-progress-dot--complete');
    } else if (stepStates[i] === 'partial') {
      dot.classList.add('vl-progress-dot--partial');
    }

    container.appendChild(dot);
  }
}

/**
 * Calculate overall form completion percentage.
 * Counts filled fields vs total fields across the form.
 * @param {HTMLFormElement} form
 * @returns {number} Percentage 0-100
 */
export function calculateProgress(form) {
  const fields = form.querySelectorAll('input[name], textarea[name], select[name]');
  if (fields.length === 0) return 0;

  let total = 0;
  let filled = 0;
  const radioGroups = new Set();

  fields.forEach(field => {
    if (field.type === 'radio') {
      if (radioGroups.has(field.name)) return;
      radioGroups.add(field.name);
      total++;
      if (form.querySelector(`input[name="${CSS.escape(field.name)}"]:checked`)) {
        filled++;
      }
    } else if (field.type === 'checkbox') {
      // Checkboxes are optional by nature, skip counting
    } else {
      total++;
      if (field.value.trim() !== '') filled++;
    }
  });

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}
