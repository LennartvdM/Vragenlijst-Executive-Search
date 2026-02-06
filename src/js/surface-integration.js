/**
 * Survey sidebar previews — Integration module
 *
 * Attaches Surface hover previews to sidebar nav items.
 * Each item shows a live miniature of its step's current fill state.
 */

import { Surface } from './surface.js';

/**
 * Attach preview surfaces to all sidebar nav items.
 * Call once after survey HTML is loaded and injected.
 *
 * @param {HTMLElement} root - The survey container (.container or similar)
 */
export function initSidebarPreviews(root) {
  Surface.init();

  const navItems = root.querySelectorAll('.index-item, .vl-nav-item');

  navItems.forEach(navItem => {
    const stepIndex = parseInt(navItem.dataset.step, 10);
    if (isNaN(stepIndex)) return;

    // Steps with no meaningful content to preview
    const skipSteps = [4, 14, 15];
    if (skipSteps.includes(stepIndex)) return;

    Surface.preview(navItem, {
      place: 'right',
      align: 'start',
      gap: 12,
      delay: { in: 250, out: 150 },
      previewScale: 0.55,
      previewWidth: 380,
      previewMaxHeight: 320,

      cloneFrom: () => {
        return root.querySelector(
          `.step[data-step="${stepIndex}"], .vl-step[data-step="${stepIndex}"]`
        );
      },

      transform: (clone) => {
        // Remove nav buttons
        clone.querySelectorAll(
          '.form-nav, .nav-buttons, .vl-nav-buttons, .vl-content-footer, .vl-content-header'
        ).forEach(el => el.remove());

        // Remove comment sections
        clone.querySelectorAll(
          '.comments-section, .vl-comments-section'
        ).forEach(el => el.remove());

        // Ensure step is visible
        clone.style.display = 'block';
        clone.classList.add('active');

        // Show Likert pills
        clone.querySelectorAll('.likert-pill-highlight, .vl-likert-pill').forEach(pill => {
          pill.style.opacity = '1';
        });

        // Preserve filled inputs
        clone.querySelectorAll('input, textarea').forEach(input => {
          if (input.value) input.style.opacity = '1';
        });

        // Show selected option cards
        clone.querySelectorAll('.option-card.selected, .vl-option-card.selected').forEach(card => {
          card.style.opacity = '1';
        });
      },

      footer: getStepFooter(root, stepIndex),
    });
  });
}

/**
 * Build a footer string showing step completion status.
 */
function getStepFooter(root, stepIndex) {
  const stepLabels = window.STEP_LABELS || {
    0: 'Welkom', 1: 'Streefcijfer', 2: 'Kwantitatief',
    3: 'Bestuursorganen', 5: 'Leiderschap', 6: 'Strategie',
    7: 'HR Management', 8: 'Communicatie', 9: 'Kennis',
    10: 'Klimaat', 11: 'Motivatie', 12: 'Aanvullend', 13: 'Ondertekenen'
  };

  const step = root.querySelector(
    `.step[data-step="${stepIndex}"], .vl-step[data-step="${stepIndex}"]`
  );
  if (!step) return `Stap ${stepIndex + 1}`;

  const fields = step.querySelectorAll('input[name], textarea[name], select[name]');
  const radioGroups = new Set();
  let total = 0, filled = 0;

  fields.forEach(f => {
    if (f.type === 'radio') {
      if (radioGroups.has(f.name)) return;
      radioGroups.add(f.name);
      total++;
      if (step.querySelector(`input[name="${f.name}"]:checked`)) filled++;
    } else if (f.type !== 'checkbox' && f.type !== 'hidden') {
      total++;
      if (f.value && f.value.trim()) filled++;
    }
  });

  if (total === 0) return stepLabels[stepIndex] || `Stap ${stepIndex + 1}`;

  const pct = Math.round((filled / total) * 100);
  return `${filled}/${total} ingevuld \u00b7 ${pct}%`;
}
