/**
 * Likert scale module
 * Handles Likert tables, pills, custom radio buttons, and mobile segmented controls
 */

import { isFieldFilled } from './validation.js';

/**
 * Create Likert pill element positioned based on actual cell measurements
 */
export function createLikertPill(row) {
  if (row.querySelector('.likert-pill-highlight')) return;

  const firstRadioCell = row.querySelector('td:nth-child(2)');
  const lastRadioCell = row.querySelector('td:last-child');
  const firstCustomRadio = row.querySelector('.likert-radio');
  if (!firstRadioCell || !lastRadioCell || !firstCustomRadio) return;

  const firstCellRect = firstRadioCell.getBoundingClientRect();
  if (firstCellRect.width === 0) return;

  const pill = document.createElement('span');
  pill.className = 'likert-pill-highlight';

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
 * Refresh likert pills for all visible answered rows
 */
export function refreshLikertPills() {
  document.querySelectorAll('.likert-table tbody tr.answered').forEach(row => {
    createLikertPill(row);
  });
}

/**
 * Create custom Likert radio buttons
 */
export function initLikertRadioOverlays() {
  document.querySelectorAll('.likert-table input[type="radio"]').forEach(radio => {
    const td = radio.closest('td');
    if (!td || td.querySelector('.likert-radio')) return;

    const customRadio = document.createElement('span');
    customRadio.className = 'likert-radio';
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
      row.querySelectorAll('.likert-radio').forEach(cr => {
        cr.classList.remove('selected');
      });

      customRadio.classList.add('selected');

      const ring = customRadio.querySelector('.target-ring');
      ring.style.animation = 'none';
      void ring.offsetWidth;
      ring.style.animation = '';
    });
  });
}

/**
 * Reset all radio buttons in a Likert table
 * @param {string} tableId - The table ID to reset
 */
export function resetLikertTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.querySelectorAll('input[type="radio"]').forEach(input => {
    input.checked = false;
  });

  table.querySelectorAll('tr.answered').forEach(row => {
    row.classList.remove(window.CONSTANTS.CSS.ANSWERED);
    row.classList.remove('just-answered');
    const pill = row.querySelector('.likert-pill-highlight');
    if (pill) {
      pill.classList.add('fade-out');
      setTimeout(() => pill.remove(), 200);
    }
  });

  table.querySelectorAll('.likert-radio').forEach(customRadio => {
    customRadio.classList.remove('selected');
  });

  table.classList.remove('has-missing');

  const header = document.getElementById(`header-${tableId}`);
  if (header) header.classList.remove(window.CONSTANTS.CSS.HAS_VALUE);

  table.querySelectorAll('.likert-segment-option').forEach(btn => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-checked', 'false');
  });
}

/**
 * Initialize mobile-friendly Likert scale controls
 */
export function initMobileLikert() {
  const MOBILE_BREAKPOINT = 768;
  const LIKERT_OPTIONS = [
    { value: '0', label: 'Niet' },
    { value: '1', label: 'Enigszins' },
    { value: '2', label: 'Grotendeels' },
    { value: '3', label: 'Volledig' }
  ];

  function createSegmentedControl(row) {
    if (row.querySelector('.likert-segment')) return;

    const firstCell = row.querySelector('td:first-child');
    if (!firstCell) return;

    const firstRadio = row.querySelector('input[type="radio"]');
    if (!firstRadio) return;

    const radioName = firstRadio.name;

    const segment = document.createElement('div');
    segment.className = 'likert-segment';
    segment.setAttribute('role', 'radiogroup');
    segment.setAttribute('aria-label', 'Selecteer uw antwoord');

    const slider = document.createElement('div');
    slider.className = 'likert-segment-slider';
    segment.appendChild(slider);

    LIKERT_OPTIONS.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'likert-segment-option';
      btn.dataset.value = option.value;
      btn.dataset.index = index;
      btn.dataset.radioName = radioName;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');

      const label = document.createElement('span');
      label.className = 'likert-segment-label';
      label.textContent = option.label;

      btn.appendChild(label);
      segment.appendChild(btn);

      const radio = row.querySelector(`input[name="${radioName}"][value="${option.value}"]`);
      if (radio && radio.checked) {
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        segment.classList.add('has-selection');
        slider.style.transform = `translateX(${index * 100}%)`;
      }

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        selectLikertOption(this, radioName, option.value, row, index);
      });
    });

    setupTouchSliding(segment, radioName, row);
    firstCell.after(segment);
  }

  function setupTouchSliding(segment, radioName, row) {
    const slider = segment.querySelector('.likert-segment-slider');
    const options = segment.querySelectorAll('.likert-segment-option');
    let isDragging = false;
    let currentIndex = -1;

    function getOptionIndexFromTouch(touchX) {
      const rect = segment.getBoundingClientRect();
      const relativeX = touchX - rect.left;
      const optionWidth = rect.width / options.length;
      let index = Math.floor(relativeX / optionWidth);
      return Math.max(0, Math.min(options.length - 1, index));
    }

    function updateSliderPosition(index, animate = true) {
      if (index === currentIndex) return;
      currentIndex = index;

      segment.classList.add('has-selection');
      slider.classList.toggle('no-transition', !animate);
      slider.style.transform = `translateX(${index * 100}%)`;

      options.forEach((opt, i) => {
        opt.classList.toggle('hover', i === index);
      });
    }

    segment.addEventListener('touchstart', function(e) {
      isDragging = true;
      segment.classList.add('is-dragging');
      const touch = e.touches[0];
      const index = getOptionIndexFromTouch(touch.clientX);
      updateSliderPosition(index, false);
    }, { passive: true });

    segment.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      const touch = e.touches[0];
      const index = getOptionIndexFromTouch(touch.clientX);
      updateSliderPosition(index, true);
    }, { passive: true });

    segment.addEventListener('touchend', function(e) {
      if (!isDragging) return;
      isDragging = false;
      segment.classList.remove('is-dragging');

      options.forEach(opt => opt.classList.remove('hover'));

      if (currentIndex >= 0 && currentIndex < options.length) {
        const option = options[currentIndex];
        selectLikertOption(option, radioName, option.dataset.value, row, currentIndex);
      }
    }, { passive: true });

    segment.addEventListener('touchcancel', function() {
      isDragging = false;
      segment.classList.remove('is-dragging');
      options.forEach(opt => opt.classList.remove('hover'));
    }, { passive: true });
  }

  function selectLikertOption(button, radioName, value, row, index) {
    const segment = button.closest('.likert-segment');
    const slider = segment.querySelector('.likert-segment-slider');

    segment.querySelectorAll('.likert-segment-option').forEach(btn => {
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

    const radio = document.querySelector(`input[name="${radioName}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function syncSegmentedControls() {
    document.querySelectorAll('.likert-table tbody tr').forEach(row => {
      const segment = row.querySelector('.likert-segment');
      if (!segment) return;

      const slider = segment.querySelector('.likert-segment-slider');
      const firstRadio = row.querySelector('input[type="radio"]');
      if (!firstRadio) return;

      const radioName = firstRadio.name;
      const checkedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
      let selectedIndex = -1;

      segment.querySelectorAll('.likert-segment-option').forEach((btn, index) => {
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

  function handleResponsive() {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    document.querySelectorAll('.likert-table tbody tr').forEach(row => {
      if (isMobile) {
        createSegmentedControl(row);
      }
    });

    if (isMobile) {
      syncSegmentedControls();
    }
  }

  handleResponsive();

  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResponsive, 250);
  });

  window.syncLikertSegments = syncSegmentedControls;
}
