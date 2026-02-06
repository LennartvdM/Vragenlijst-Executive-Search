/**
 * Likert Table — Interactive behavior
 *
 * Desktop: custom radio overlays, highlight pills, answered state
 * Mobile:  segmented controls with touch sliding
 */

/**
 * Initialize Likert table behavior within a container.
 * @param {HTMLElement} root - Container element (e.g. .vl-form)
 * @param {Object} [options]
 * @param {number} [options.mobileBreakpoint=768] - Width below which to show segmented controls
 * @param {Array<{value: string|number, label: string}>} [options.likertOptions] - Scale options for mobile segments
 */
export function initLikertTables(root, options = {}) {
  const { mobileBreakpoint = 768 } = options;

  initLikertRadioOverlays(root);
  initLikertChangeHandler(root);
  handleResponsive(root, mobileBreakpoint, options.likertOptions);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => handleResponsive(root, mobileBreakpoint, options.likertOptions), 250);
  });
}

/**
 * Create custom radio overlay elements on all Likert radios.
 * @param {HTMLElement} root
 */
function initLikertRadioOverlays(root) {
  root.querySelectorAll('.vl-likert-table input[type="radio"]').forEach(radio => {
    const td = radio.closest('td');
    if (!td || td.querySelector('.vl-likert-radio')) return;

    const customRadio = document.createElement('span');
    customRadio.className = 'vl-likert-radio';
    customRadio.innerHTML = '<span class="target-ring"></span>';
    td.appendChild(customRadio);

    radio._customRadio = customRadio;

    customRadio.addEventListener('click', () => {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    });

    if (radio.checked) {
      customRadio.classList.add('selected');
    }

    radio.addEventListener('change', () => {
      const row = radio.closest('tr');
      row.querySelectorAll('.vl-likert-radio').forEach(cr => cr.classList.remove('selected'));
      customRadio.classList.add('selected');

      const ring = customRadio.querySelector('.target-ring');
      ring.style.animation = 'none';
      void ring.offsetWidth;
      ring.style.animation = '';
    });
  });
}

/**
 * Handle row answered state + pill creation on change.
 * @param {HTMLElement} root
 */
function initLikertChangeHandler(root) {
  root.addEventListener('change', (e) => {
    const radio = e.target;
    if (radio.type !== 'radio') return;

    const row = radio.closest('.vl-likert-table tbody tr');
    if (!row) return;

    // Mark answered
    const wasAnswered = row.classList.contains('answered');
    row.classList.add('answered');

    if (!wasAnswered) {
      row.classList.add('just-answered');
      setTimeout(() => row.classList.remove('just-answered'), 300);
    }

    // Create pill
    createLikertPill(row);

    // Show reset button
    const table = row.closest('.vl-likert-table');
    if (table) {
      const header = root.querySelector(`#header-${CSS.escape(table.id)}`);
      if (header) header.classList.add('has-value');
    }
  });
}

/**
 * Create a highlight pill spanning the radio cells.
 * @param {HTMLElement} row
 */
function createLikertPill(row) {
  if (row.querySelector('.vl-likert-pill')) return;

  const firstRadioCell = row.querySelector('td:nth-child(2)');
  const lastRadioCell = row.querySelector('td:last-child');
  const firstCustomRadio = row.querySelector('.vl-likert-radio');
  if (!firstRadioCell || !lastRadioCell || !firstCustomRadio) return;

  const firstCellRect = firstRadioCell.getBoundingClientRect();
  if (firstCellRect.width === 0) return;

  const pill = document.createElement('span');
  pill.className = 'vl-likert-pill';

  const lastCellRect = lastRadioCell.getBoundingClientRect();
  const radioRect = firstCustomRadio.getBoundingClientRect();

  pill.style.width = `${lastCellRect.right - firstCellRect.left}px`;
  pill.style.left = '0';

  const pillHeight = 36;
  const radioCenter = radioRect.top + (radioRect.height / 2) - firstCellRect.top;
  pill.style.top = `${radioCenter - (pillHeight / 2)}px`;
  pill.style.transform = 'none';

  firstRadioCell.appendChild(pill);
}

/**
 * Refresh pills for all visible answered rows.
 * @param {HTMLElement} root
 */
export function refreshLikertPills(root) {
  root.querySelectorAll('.vl-likert-table tbody tr.answered').forEach(row => {
    createLikertPill(row);
  });
}

/**
 * Reset all radio buttons in a Likert table.
 * @param {HTMLElement} root
 * @param {string} tableId
 */
export function resetLikertTable(root, tableId) {
  const table = root.querySelector(`#${CSS.escape(tableId)}`);
  if (!table) return;

  table.querySelectorAll('input[type="radio"]').forEach(input => {
    input.checked = false;
  });

  table.querySelectorAll('tr.answered').forEach(row => {
    row.classList.remove('answered', 'just-answered');
    const pill = row.querySelector('.vl-likert-pill');
    if (pill) {
      pill.classList.add('fade-out');
      setTimeout(() => pill.remove(), 200);
    }
  });

  table.querySelectorAll('.vl-likert-radio').forEach(cr => {
    cr.classList.remove('selected');
  });

  table.classList.remove('has-missing');

  const header = root.querySelector(`#header-${CSS.escape(tableId)}`);
  if (header) header.classList.remove('has-value');

  // Reset mobile segments
  table.querySelectorAll('.vl-likert-segment-option').forEach(btn => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-checked', 'false');
  });
}

// ──────────────────────────────────────────────────────────────
// Mobile segmented controls
// ──────────────────────────────────────────────────────────────

const DEFAULT_MOBILE_OPTIONS = [
  { value: '0', label: 'Not at all' },
  { value: '1', label: 'Somewhat' },
  { value: '2', label: 'Mostly' },
  { value: '3', label: 'Fully' }
];

function handleResponsive(root, breakpoint, likertOptions) {
  const isMobile = window.innerWidth <= breakpoint;

  if (isMobile) {
    root.querySelectorAll('.vl-likert-table tbody tr').forEach(row => {
      createSegmentedControl(row, likertOptions || DEFAULT_MOBILE_OPTIONS);
    });
    syncSegmentedControls(root);
  }
}

function createSegmentedControl(row, likertOptions) {
  if (row.querySelector('.vl-likert-segment')) return;

  const firstCell = row.querySelector('td:first-child');
  const firstRadio = row.querySelector('input[type="radio"]');
  if (!firstCell || !firstRadio) return;

  const radioName = firstRadio.name;

  const segment = document.createElement('div');
  segment.className = 'vl-likert-segment visible';
  segment.setAttribute('role', 'radiogroup');

  const slider = document.createElement('div');
  slider.className = 'vl-likert-segment-slider';
  segment.appendChild(slider);

  likertOptions.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vl-likert-segment-option';
    btn.dataset.value = String(option.value);
    btn.dataset.index = index;
    btn.dataset.radioName = radioName;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');

    const label = document.createElement('span');
    label.className = 'vl-likert-segment-label';
    label.textContent = option.label;
    btn.appendChild(label);
    segment.appendChild(btn);

    const radio = row.querySelector(`input[name="${CSS.escape(radioName)}"][value="${CSS.escape(String(option.value))}"]`);
    if (radio && radio.checked) {
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      segment.classList.add('has-selection');
      slider.style.transform = `translateX(${index * 100}%)`;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      selectSegmentOption(btn, radioName, String(option.value), row, index);
    });
  });

  setupTouchSliding(segment, radioName, row);
  firstCell.after(segment);
}

function selectSegmentOption(button, radioName, value, row, index) {
  const segment = button.closest('.vl-likert-segment');
  const slider = segment.querySelector('.vl-likert-segment-slider');

  segment.querySelectorAll('.vl-likert-segment-option').forEach(btn => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-checked', 'false');
  });
  button.classList.add('selected');
  button.setAttribute('aria-checked', 'true');

  if (slider && index !== undefined) {
    segment.classList.add('has-selection');
    slider.classList.remove('no-transition');
    slider.style.transform = `translateX(${index * 100}%)`;
  }

  const radio = document.querySelector(`input[name="${CSS.escape(radioName)}"][value="${CSS.escape(value)}"]`);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function setupTouchSliding(segment, radioName, row) {
  const slider = segment.querySelector('.vl-likert-segment-slider');
  const options = segment.querySelectorAll('.vl-likert-segment-option');
  let isDragging = false;
  let currentIndex = -1;

  function getOptionIndexFromTouch(touchX) {
    const rect = segment.getBoundingClientRect();
    const relativeX = touchX - rect.left;
    const optionWidth = rect.width / options.length;
    return Math.max(0, Math.min(options.length - 1, Math.floor(relativeX / optionWidth)));
  }

  function updateSliderPosition(index, animate = true) {
    if (index === currentIndex) return;
    currentIndex = index;
    segment.classList.add('has-selection');
    slider.classList.toggle('no-transition', !animate);
    slider.style.transform = `translateX(${index * 100}%)`;
    options.forEach((opt, i) => opt.classList.toggle('hover', i === index));
  }

  segment.addEventListener('touchstart', (e) => {
    isDragging = true;
    segment.classList.add('is-dragging');
    updateSliderPosition(getOptionIndexFromTouch(e.touches[0].clientX), false);
  }, { passive: true });

  segment.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(getOptionIndexFromTouch(e.touches[0].clientX), true);
  }, { passive: true });

  segment.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    segment.classList.remove('is-dragging');
    options.forEach(opt => opt.classList.remove('hover'));
    if (currentIndex >= 0 && currentIndex < options.length) {
      const option = options[currentIndex];
      selectSegmentOption(option, radioName, option.dataset.value, row, currentIndex);
    }
  }, { passive: true });

  segment.addEventListener('touchcancel', () => {
    isDragging = false;
    segment.classList.remove('is-dragging');
    options.forEach(opt => opt.classList.remove('hover'));
  }, { passive: true });
}

function syncSegmentedControls(root) {
  root.querySelectorAll('.vl-likert-table tbody tr').forEach(row => {
    const segment = row.querySelector('.vl-likert-segment');
    if (!segment) return;

    const slider = segment.querySelector('.vl-likert-segment-slider');
    const firstRadio = row.querySelector('input[type="radio"]');
    if (!firstRadio) return;

    const radioName = firstRadio.name;
    const checkedRadio = document.querySelector(`input[name="${CSS.escape(radioName)}"]:checked`);
    let selectedIndex = -1;

    segment.querySelectorAll('.vl-likert-segment-option').forEach((btn, index) => {
      const isSelected = checkedRadio && btn.dataset.value === checkedRadio.value;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      if (isSelected) selectedIndex = index;
    });

    if (slider) {
      if (selectedIndex >= 0) {
        segment.classList.add('has-selection');
        slider.classList.add('no-transition');
        slider.style.transform = `translateX(${selectedIndex * 100}%)`;
        requestAnimationFrame(() => slider.classList.remove('no-transition'));
      } else {
        segment.classList.remove('has-selection');
      }
    }
  });
}
