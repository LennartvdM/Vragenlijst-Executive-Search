/**
 * Survey module for Monitoring Cultureel Talent naar de Top
 * Handles form navigation, validation, and submission
 *
 * Dependencies: config.js, constants.js, storage.js, api.js
 */

(function() {
  'use strict';

  let currentStep = 0;
  let previousStep = -1; // Track previous step for slide direction
  let session = null;

  // Step labels for review page
  const STEP_LABELS = {
    0: 'Welkom',
    1: 'Streefcijfer',
    2: 'Kwantitatief',
    3: 'Bestuursorganen',
    4: 'Leiderschap',
    5: 'Strategie',
    6: 'HR Management',
    7: 'Communicatie',
    8: 'Kennis',
    9: 'Klimaat',
    10: 'Motivatie',
    11: 'Aanvullend',
    12: 'Ondertekenen'
  };

  // Field labels for review page (human readable names)
  const FIELD_LABELS = {
    organisatie: 'Naam organisatie',
    streefcijfer: 'Heeft u een streefcijfer?',
    streefcijfer_percentage: 'Streefcijfer percentage',
    streefcijfer_jaar: 'Streefcijfer jaar',
    streefcijfer_gehaald: 'Streefcijfer gehaald?',
    definitie_afwijking: 'Wijkt definitie af?',
    eigen_definitie: 'Eigen definitie',
    aantal_werknemers: 'Totaal aantal werknemers',
    werknemers_buiten_europa: 'Werknemers Buiten-Europa',
    aantal_top: 'Aantal in de top',
    top_buiten_europa: 'Top Buiten-Europa',
    aantal_subtop: 'Aantal in de subtop',
    subtop_buiten_europa: 'Subtop Buiten-Europa',
    heeft_rvb: 'Heeft u een RvB?',
    aantal_rvb: 'Aantal RvB',
    rvb_buiten_europa: 'RvB Buiten-Europa',
    heeft_rvc: 'Heeft u een RvC?',
    aantal_rvc: 'Aantal RvC',
    rvc_buiten_europa: 'RvC Buiten-Europa',
    heeft_rvt: 'Heeft u een RvT?',
    aantal_rvt: 'Aantal RvT',
    rvt_buiten_europa: 'RvT Buiten-Europa',
    beleid_samenstelling: 'Beleid samenstelling',
    beleid_samenstelling_anders: 'Beleid toelichting',
    motivatie: 'Motivatie',
    strategie_vraag_1: 'Strategievraag 1',
    blokkade_1: 'Blokkade 1',
    bevorderend_1: 'Bevorderend 1',
    voorbeeld_organisatie: 'Voorbeeld organisatie',
    datum: 'Datum',
    ondertekenaar: 'Naam ondertekenaar',
    bevestiging: 'Bevestiging'
  };

  // Likert table groupings for review page
  const LIKERT_LABELS = {
    'likert-leiderschap': {
      step: 4,
      label: 'Leiderschap stellingen',
      fields: ['leid_1', 'leid_2', 'leid_3', 'leid_4', 'leid_5']
    },
    'likert-strategie': {
      step: 5,
      label: 'Strategie stellingen',
      fields: ['strat_1', 'strat_2', 'strat_3', 'strat_4', 'strat_5', 'strat_6', 'strat_7', 'strat_8']
    },
    'likert-hr': {
      step: 6,
      label: 'HR Management stellingen',
      fields: ['hr_1', 'hr_2', 'hr_3', 'hr_4', 'hr_5', 'hr_6', 'hr_7', 'hr_8', 'hr_9', 'hr_10', 'hr_11', 'hr_12', 'hr_13', 'hr_14']
    },
    'likert-communicatie': {
      step: 7,
      label: 'Communicatie stellingen',
      fields: ['comm_1', 'comm_2', 'comm_3', 'comm_4', 'comm_5']
    },
    'likert-kennis': {
      step: 8,
      label: 'Kennis stellingen',
      fields: ['kennis_1', 'kennis_2', 'kennis_3', 'kennis_4', 'kennis_5', 'kennis_6', 'kennis_7', 'kennis_8']
    },
    'likert-klimaat': {
      step: 9,
      label: 'Klimaat stellingen',
      fields: ['klimaat_1', 'klimaat_2', 'klimaat_3', 'klimaat_4', 'klimaat_5', 'klimaat_6']
    }
  };

  // Conditional field parent mapping (child -> parent info)
  const CONDITIONAL_PARENT_MAP = {
    'streefcijfer_percentage': { parent: 'streefcijfer', value: 'Ja' },
    'streefcijfer_jaar': { parent: 'streefcijfer', value: 'Ja' },
    'eigen_definitie': { parent: 'definitie_afwijking', value: 'Ja' },
    'aantal_rvb': { parent: 'heeft_rvb', value: 'Ja' },
    'rvb_buiten_europa': { parent: 'heeft_rvb', value: 'Ja' },
    'aantal_rvc': { parent: 'heeft_rvc', value: 'Ja' },
    'rvc_buiten_europa': { parent: 'heeft_rvc', value: 'Ja' },
    'aantal_rvt': { parent: 'heeft_rvt', value: 'Ja' },
    'rvt_buiten_europa': { parent: 'heeft_rvt', value: 'Ja' },
    'beleid_samenstelling_anders': { parent: 'beleid_samenstelling', value: 'Anders' }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    session = Storage.getSession();
    if (!session || !session.orgCode) {
      window.location.href = '/index.html';
      return;
    }

    // Initialize UI
    initializeOrganizationInfo();
    initProgress();
    setupEventDelegation();
    setupInputListeners();
    setupAutoSave();
    loadSavedFormData();
    updateIndexStatus(); // Initialize progress bar
    calculateStableCardDimensions();
    showStep(0);

    // Recalculate on window resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        // Reset min-height before recalculating
        const content = document.querySelector('.content');
        if (content) content.style.minHeight = '';
        calculateStableCardDimensions();
      }, 250);
    });
  });

  /**
   * Setup event delegation for all interactive elements
   * This replaces inline onclick handlers with a single document-level listener
   */
  function setupEventDelegation() {
    document.addEventListener('click', function(event) {
      const target = event.target;

      // Check for data-action attribute on target or parent elements
      const actionElement = target.closest('[data-action]');
      if (actionElement) {
        const action = actionElement.dataset.action;
        handleAction(action, actionElement, event);
        return;
      }

      // Handle option card clicks (labels containing radio buttons)
      const optionCard = target.closest('.option-card');
      if (optionCard) {
        handleOptionCardClick(optionCard);
        return;
      }
    });
  }

  /**
   * Handle actions triggered by data-action attributes
   * @param {string} action - The action name
   * @param {HTMLElement} element - The element that triggered the action
   * @param {Event} event - The original event
   */
  function handleAction(action, element, event) {
    switch (action) {
      case 'goToStep':
        const step = parseInt(element.dataset.step, 10);
        goToStep(step);
        break;

      case 'prevStep':
        prevStep();
        break;

      case 'nextStep':
        nextStep();
        break;

      case 'toggleComments':
        const commentStep = parseInt(element.dataset.step, 10);
        toggleComments(commentStep);
        break;

      case 'resetGroup':
        const name = element.dataset.name;
        resetGroup(name);
        break;

      case 'resetLikertTable':
        const tableId = element.dataset.table;
        resetLikertTable(tableId);
        break;

      case 'logout':
        logout();
        break;

      case 'printForm':
        printForm();
        break;

      case 'confirmSubmit':
        handleConfirmSubmit();
        break;
    }
  }

  /**
   * Update option card conditional status classes
   * @param {string} fieldName - The field name to update
   */
  function updateOptionCardConditionalStatus(fieldName) {
    const selectedRadio = document.querySelector(`[name="${fieldName}"]:checked`);
    if (!selectedRadio) return;

    const card = selectedRadio.closest('.option-card');
    if (!card) return;

    // Remove previous conditional status classes
    card.classList.remove('awaiting-conditional', 'conditional-satisfied');

    // Check if this field has conditional requirements
    const conditionalStatus = checkConditionalCompletion(fieldName);
    if (conditionalStatus.triggered) {
      if (conditionalStatus.filled) {
        card.classList.add('conditional-satisfied');
      } else {
        card.classList.add('awaiting-conditional');
      }
    }
  }

  /**
   * Handle option card clicks
   * @param {HTMLElement} card - The option card element
   */
  function handleOptionCardClick(card) {
    const input = card.querySelector('input[type="radio"]');
    if (!input) return;

    const name = input.name;
    const value = input.value;

    // Deselect all cards in the same group and remove conditional classes
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
      const parentCard = radio.closest('.option-card');
      if (parentCard) {
        parentCard.classList.remove(CONSTANTS.CSS.SELECTED, 'awaiting-conditional', 'conditional-satisfied');
      }
    });

    // Select this card
    card.classList.add(CONSTANTS.CSS.SELECTED);
    input.checked = true;

    // Update header state
    const header = document.getElementById(`header-${name}`);
    if (header) header.classList.add(CONSTANTS.CSS.HAS_VALUE);

    // Handle conditional field visibility using centralized mapping
    const conditionalId = CONSTANTS.CONDITIONAL_FIELDS[name];
    if (conditionalId) {
      // Check if there's a custom trigger value for this field
      const triggerValue = CONSTANTS.CONDITIONAL_VALUES && CONSTANTS.CONDITIONAL_VALUES[name]
        ? CONSTANTS.CONDITIONAL_VALUES[name]
        : CONSTANTS.ANSWERS.YES;
      toggleConditional(conditionalId, value === triggerValue);
    }

    // Update conditional status for this card
    updateOptionCardConditionalStatus(name);

    updateAllSections();
    updateIndexStatus();
    saveFormData();
  }

  /**
   * Calculate and set stable card dimensions based on the largest step
   * This prevents the card from resizing when navigating between steps
   */
  function calculateStableCardDimensions() {
    const content = document.querySelector('.content');
    const steps = document.querySelectorAll('.step');

    if (!content || steps.length === 0) return;

    // Store original states
    const originalStates = Array.from(steps).map(step => ({
      element: step,
      display: step.style.display,
      visibility: step.style.visibility,
      position: step.style.position,
      hasActive: step.classList.contains(CONSTANTS.CSS.ACTIVE)
    }));

    // Temporarily make all steps measurable
    steps.forEach(step => {
      step.style.display = 'flex';
      step.style.visibility = 'hidden';
      step.style.position = 'absolute';
      step.classList.remove(CONSTANTS.CSS.ACTIVE);
    });

    // Force layout recalculation
    content.offsetHeight;

    // Measure each step
    let maxHeight = 0;
    steps.forEach(step => {
      // Temporarily make this step visible for measurement
      step.style.visibility = 'visible';
      step.style.position = 'relative';

      const height = step.scrollHeight;
      if (height > maxHeight) maxHeight = height;

      // Hide again for next measurement
      step.style.visibility = 'hidden';
      step.style.position = 'absolute';
    });

    // Restore original states
    originalStates.forEach(state => {
      state.element.style.display = state.display;
      state.element.style.visibility = state.visibility;
      state.element.style.position = state.position;
      if (state.hasActive) {
        state.element.classList.add(CONSTANTS.CSS.ACTIVE);
      }
    });

    // Set minimum height on content to prevent resizing
    if (maxHeight > 0) {
      content.style.minHeight = maxHeight + 'px';
    }
  }

  /**
   * Initialize organization info display
   */
  function initializeOrganizationInfo() {
    const orgNameEl = document.getElementById('orgNameDisplay');
    const orgCodeEl = document.getElementById('orgCodeDisplay');
    const orgField = document.getElementById('organisatieField');

    if (orgNameEl) orgNameEl.textContent = session.orgName || '-';
    if (orgCodeEl) orgCodeEl.textContent = session.orgCode || '-';

    // Pre-fill organization name in form
    if (orgField && session.orgName) {
      orgField.value = session.orgName;
      orgField.dispatchEvent(new Event('input'));
    }
  }

  /**
   * Initialize progress dots (both top and bottom)
   * Only show dots for steps 0-12 (not review/success)
   */
  function initProgress() {
    const dotsBottom = document.getElementById('progressDots');
    const dotsTop = document.getElementById('progressDotsTop');
    const contentSteps = 13; // Steps 0-12

    [dotsBottom, dotsTop].forEach(dots => {
      if (!dots) return;
      dots.innerHTML = '';
      for (let i = 0; i < contentSteps; i++) {
        const span = document.createElement('span');
        if (i === 0) span.classList.add(CONSTANTS.CSS.ACTIVE);
        dots.appendChild(span);
      }
    });
  }

  /**
   * Update progress dots display
   * Dots only represent steps 0-12
   */
  function updateProgress() {
    const dotsContainers = document.querySelectorAll('.progress-dots');
    const displayStep = currentStep <= 12 ? currentStep : 12; // Clamp to 12 for review/success

    dotsContainers.forEach(container => {
      const dots = container.querySelectorAll('span');
      dots.forEach((dot, i) => {
        dot.classList.remove(CONSTANTS.CSS.ACTIVE, CONSTANTS.CSS.DONE);
        if (i < displayStep) dot.classList.add(CONSTANTS.CSS.DONE);
        if (i === displayStep) dot.classList.add(CONSTANTS.CSS.ACTIVE);
      });

      // Mark all done on review/success step
      if (currentStep >= CONFIG.REVIEW_STEP) {
        dots.forEach(dot => {
          dot.classList.remove(CONSTANTS.CSS.ACTIVE);
          dot.classList.add(CONSTANTS.CSS.DONE);
        });
      }
    });
  }

  /**
   * Update sidebar index highlighting
   */
  function updateIndex() {
    document.querySelectorAll('.index-item').forEach(item => {
      const step = parseInt(item.dataset.step);
      item.classList.toggle(CONSTANTS.CSS.ACTIVE, step === currentStep);
    });
  }

  /**
   * Update index item completion status
   */
  function updateIndexStatus() {
    Object.keys(CONFIG.STEP_FIELDS).forEach(step => {
      const fields = CONFIG.STEP_FIELDS[step];
      let filled = 0;
      let hasConditionalIncomplete = false;

      fields.forEach(fieldName => {
        const input = document.querySelector(`[name="${fieldName}"]`);
        if (!input) return;

        if (input.type === 'radio') {
          const checked = document.querySelector(`[name="${fieldName}"]:checked`);
          if (checked) {
            filled++;
            // Check if this field has conditional requirements
            const conditionalStatus = checkConditionalCompletion(fieldName);
            if (conditionalStatus.triggered && !conditionalStatus.filled) {
              hasConditionalIncomplete = true;
            }
          }
        } else if (input.type === 'checkbox') {
          if (input.checked) filled++;
        } else if (input.value && input.value.trim() !== '') {
          filled++;
        }
      });

      const indexItem = document.querySelector(`.index-item[data-step="${step}"]`);
      if (!indexItem) return;

      const statusEl = indexItem.querySelector('.status');
      indexItem.classList.remove(CONSTANTS.CSS.COMPLETE, CONSTANTS.CSS.PARTIAL, CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);

      if (filled === fields.length) {
        if (hasConditionalIncomplete) {
          // All primary fields filled, but conditional fields missing
          indexItem.classList.add(CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);
          statusEl.innerHTML = CONSTANTS.UI.STATUS_PARTIAL;
        } else {
          indexItem.classList.add(CONSTANTS.CSS.COMPLETE);
          statusEl.innerHTML = CONSTANTS.UI.STATUS_COMPLETE;
        }
      } else if (filled > 0) {
        indexItem.classList.add(CONSTANTS.CSS.PARTIAL);
        statusEl.innerHTML = `${filled}/${fields.length}`;
      } else {
        statusEl.innerHTML = CONSTANTS.UI.STATUS_EMPTY;
      }
    });

    // Also update the progress bar
    updateProgressBar();
  }

  /**
   * Update the progress bar based on total filled fields
   */
  function updateProgressBar() {
    let totalFields = 0;
    let filledFields = 0;

    // Count all fields across all steps (excluding the success step)
    Object.keys(CONFIG.STEP_FIELDS).forEach(step => {
      const fields = CONFIG.STEP_FIELDS[step];
      totalFields += fields.length;

      fields.forEach(fieldName => {
        const input = document.querySelector(`[name="${fieldName}"]`);
        if (!input) return;

        if (input.type === 'radio') {
          const checked = document.querySelector(`[name="${fieldName}"]:checked`);
          if (checked) filledFields++;
        } else if (input.type === 'checkbox') {
          if (input.checked) filledFields++;
        } else if (input.value && input.value.trim() !== '') {
          filledFields++;
        }
      });
    });

    // Calculate percentage
    const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    // Update progress bar UI
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercentage = document.getElementById('progressPercentage');

    if (progressBarFill) {
      progressBarFill.style.width = percentage + '%';
    }
    if (progressPercentage) {
      progressPercentage.textContent = percentage + '%';
    }
  }

  /**
   * Check if conditional fields for a parent field are filled
   * @param {string} parentField - The parent field name
   * @returns {Object} { triggered: boolean, filled: boolean }
   */
  function checkConditionalCompletion(parentField) {
    const requirements = CONSTANTS.CONDITIONAL_REQUIREMENTS[parentField];
    if (!requirements) {
      return { triggered: false, filled: true };
    }

    const parentInput = document.querySelector(`[name="${parentField}"]:checked`);
    if (!parentInput) {
      return { triggered: false, filled: true };
    }

    // Check if the selected value triggers the conditional
    if (parentInput.value !== requirements.triggerValue) {
      return { triggered: false, filled: true };
    }

    // Conditional is triggered - check if required fields are filled
    let allFilled = true;
    requirements.requiredFields.forEach(fieldName => {
      const input = document.querySelector(`[name="${fieldName}"]`);
      if (!input) {
        allFilled = false;
        return;
      }
      if (input.type === 'radio') {
        const checked = document.querySelector(`[name="${fieldName}"]:checked`);
        if (!checked) allFilled = false;
      } else if (!input.value || input.value.trim() === '') {
        allFilled = false;
      }
    });

    return { triggered: true, filled: allFilled };
  }

  /**
   * Update section header completion status
   * @param {string} sectionName - Name of the section to update
   */
  function updateSectionStatus(sectionName) {
    const fields = CONFIG.SECTION_FIELDS[sectionName];
    if (!fields) return;

    const header = document.querySelector(`[data-section="${sectionName}"]`);
    if (!header) return;

    let filled = 0;
    let hasConditionalIncomplete = false;
    const total = fields.length;

    fields.forEach(fieldName => {
      const input = document.querySelector(`[name="${fieldName}"]`);
      if (!input) return;

      if (input.type === 'radio') {
        const checked = document.querySelector(`[name="${fieldName}"]:checked`);
        if (checked) {
          filled++;
          // Check if this field has conditional requirements
          const conditionalStatus = checkConditionalCompletion(fieldName);
          if (conditionalStatus.triggered && !conditionalStatus.filled) {
            hasConditionalIncomplete = true;
          }
        }
      } else if (input.value && input.value.trim() !== '') {
        filled++;
      }
    });

    const icon = header.querySelector('.status-icon');
    header.classList.remove(CONSTANTS.CSS.COMPLETE, CONSTANTS.CSS.PARTIAL, CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);

    if (filled === total) {
      if (hasConditionalIncomplete) {
        // All primary fields filled, but conditional fields missing
        header.classList.add(CONSTANTS.CSS.CONDITIONAL_INCOMPLETE);
        icon.innerHTML = CONSTANTS.UI.STATUS_PARTIAL;
      } else {
        header.classList.add(CONSTANTS.CSS.COMPLETE);
        icon.innerHTML = CONSTANTS.UI.STATUS_COMPLETE;
      }
    } else if (filled > 0) {
      header.classList.add(CONSTANTS.CSS.PARTIAL);
      icon.innerHTML = `${filled}/${total}`;
    } else {
      icon.innerHTML = CONSTANTS.UI.STATUS_EMPTY;
    }
  }

  /**
   * Update all section statuses
   */
  function updateAllSections() {
    Object.keys(CONFIG.SECTION_FIELDS).forEach(updateSectionStatus);
  }

  /**
   * Show a specific step
   * @param {number} step - Step index to show
   */
  function showStep(step) {
    // Remove active class and animation classes from all steps
    document.querySelectorAll('.step').forEach(s => {
      s.classList.remove(CONSTANTS.CSS.ACTIVE, 'slide-up', 'slide-down');
    });

    const stepEl = document.querySelector(`.step[data-step="${step}"]`);
    if (stepEl) {
      stepEl.classList.add(CONSTANTS.CSS.ACTIVE);

      // Apply slide animation based on navigation direction
      if (previousStep !== -1 && previousStep !== step) {
        if (step > previousStep) {
          stepEl.classList.add('slide-up');
        } else {
          stepEl.classList.add('slide-down');
        }
      }
    }

    // Update previous step tracker
    previousStep = step;

    // Generate review content when showing review step
    if (step === CONFIG.REVIEW_STEP) {
      generateReviewContent();
    }

    // Get both sets of navigation buttons (top and bottom)
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const navButtons = document.getElementById('navButtons');
    const btnPrevTop = document.getElementById('btnPrevTop');
    const btnNextTop = document.getElementById('btnNextTop');
    const navButtonsTop = document.getElementById('navButtonsTop');
    const progressDotsTop = document.getElementById('progressDotsTop');

    // Update both prev buttons
    const showPrev = step > 0 && step <= CONFIG.REVIEW_STEP;
    if (btnPrev) btnPrev.style.display = showPrev ? 'block' : 'none';
    if (btnPrevTop) btnPrevTop.style.display = showPrev ? 'block' : 'none';

    // Update both next buttons and nav containers
    if (step === 12) {
      // Step 12 (Ondertekenen) - next goes to review, button says "Controleren"
      if (btnNext) {
        btnNext.textContent = 'Controleren';
        btnNext.style.display = 'block';
      }
      if (btnNextTop) {
        btnNextTop.textContent = 'Controleren';
        btnNextTop.disabled = false;
        btnNextTop.classList.remove('btn-disabled-top');
      }
    } else if (step === CONFIG.REVIEW_STEP) {
      // Review step - hide normal navigation, review has its own submit
      if (navButtonsTop) navButtonsTop.style.display = 'none';
      if (progressDotsTop) progressDotsTop.style.display = 'none';
      if (btnNext) btnNext.style.display = 'none';
      if (btnPrev) btnPrev.style.display = 'block';
    } else if (step === CONFIG.SUCCESS_STEP) {
      // Success step - hide all navigation
      if (navButtonsTop) navButtonsTop.style.display = 'none';
      if (progressDotsTop) progressDotsTop.style.display = 'none';
      if (btnNext) btnNext.style.display = 'none';
      if (btnPrev) btnPrev.style.display = 'none';
    } else {
      // Normal steps (0-11)
      if (btnNext) {
        btnNext.textContent = CONSTANTS.UI.BUTTON_NEXT;
        btnNext.style.display = 'block';
      }
      if (btnNextTop) {
        btnNextTop.textContent = CONSTANTS.UI.BUTTON_NEXT;
        btnNextTop.disabled = false;
        btnNextTop.classList.remove('btn-disabled-top');
      }
      if (navButtonsTop) navButtonsTop.style.display = 'flex';
      if (progressDotsTop) progressDotsTop.style.display = 'flex';
    }

    updateProgress();
    updateIndex();
  }

  /**
   * Navigate to a specific step
   * @param {number} step - Step index to navigate to
   */
  function goToStep(step) {
    currentStep = step;
    showStep(step);
  }

  /**
   * Go to next step (step 12 goes to review, review is handled by its own button)
   */
  function nextStep() {
    if (currentStep === 12) {
      // Go to review step
      currentStep = CONFIG.REVIEW_STEP;
      showStep(currentStep);
    } else if (currentStep < 12) {
      currentStep++;
      showStep(currentStep);
    }
    // Note: Review step submission is handled by handleConfirmSubmit()
  }

  /**
   * Go to previous step
   */
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  }

  /**
   * Reset a radio button group
   * @param {string} name - The field name to reset
   */
  function resetGroup(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.checked = false;
      const card = input.closest('.option-card');
      if (card) {
        card.classList.remove(CONSTANTS.CSS.SELECTED);
      }
    });

    const header = document.getElementById(`header-${name}`);
    if (header) header.classList.remove(CONSTANTS.CSS.HAS_VALUE);

    // Hide conditional field if applicable
    const conditionalId = CONSTANTS.CONDITIONAL_FIELDS[name];
    if (conditionalId) {
      toggleConditional(conditionalId, false);
    }

    updateAllSections();
    updateIndexStatus();
    saveFormData();
  }

  /**
   * Reset all radio buttons in a Likert table
   * @param {string} tableId - The table ID to reset
   */
  function resetLikertTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll('input[type="radio"]').forEach(input => {
      input.checked = false;
    });

    table.querySelectorAll('tr.answered').forEach(row => {
      row.classList.remove(CONSTANTS.CSS.ANSWERED);
      row.classList.remove('just-answered');
    });

    // Remove arrow indicators
    table.classList.remove('has-missing');

    const header = document.getElementById(`header-${tableId}`);
    if (header) header.classList.remove(CONSTANTS.CSS.HAS_VALUE);

    updateAllSections();
    updateIndexStatus();
    saveFormData();
  }

  /**
   * Toggle conditional field visibility
   * @param {string} id - The element ID to toggle
   * @param {boolean} show - Whether to show or hide
   */
  function toggleConditional(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle(CONSTANTS.CSS.SHOW, show);
  }

  /**
   * Toggle comments field visibility for a specific step
   * @param {number} step - The step index
   */
  function toggleComments(step) {
    const field = document.getElementById(`comments-field-${step}`);
    if (field) {
      field.classList.toggle(CONSTANTS.CSS.SHOW);
      // Focus the textarea when opening
      if (field.classList.contains(CONSTANTS.CSS.SHOW)) {
        const textarea = field.querySelector('textarea');
        if (textarea) textarea.focus();
      }
    }
  }

  /**
   * Update all option cards that have conditional requirements
   */
  function updateAllOptionCardConditionalStatuses() {
    Object.keys(CONSTANTS.CONDITIONAL_REQUIREMENTS).forEach(fieldName => {
      updateOptionCardConditionalStatus(fieldName);
    });
  }

  /**
   * Setup input change listeners for real-time status updates
   */
  function setupInputListeners() {
    document.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        updateAllSections();
        updateIndexStatus();
        updateAllOptionCardConditionalStatuses();
      });
      input.addEventListener('change', () => {
        updateAllSections();
        updateIndexStatus();
        updateAllOptionCardConditionalStatuses();
      });
    });

    // Likert scale row highlighting and header tracking
    document.querySelectorAll('.likert-table input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function() {
        const row = this.closest('tr');
        row.classList.add(CONSTANTS.CSS.ANSWERED);
        // Add animation class for pop effect (only on user interaction)
        row.classList.remove('just-answered');
        void row.offsetWidth; // Force reflow to restart animation
        row.classList.add('just-answered');
        // Update the Likert header to show reset button
        const table = this.closest('.likert-table');
        if (table && table.id) {
          const header = document.getElementById(`header-${table.id}`);
          if (header) header.classList.add(CONSTANTS.CSS.HAS_VALUE);
        }
        // Check for unfilled rows and show bouncing arrows (only when last row is answered)
        if (table) {
          const rows = table.querySelectorAll('tbody tr');
          const lastRow = rows[rows.length - 1];
          const lastRowAnswered = lastRow && lastRow.classList.contains(CONSTANTS.CSS.ANSWERED);
          const answeredRows = table.querySelectorAll('tbody tr.answered').length;

          if (lastRowAnswered && answeredRows < rows.length) {
            // Last row answered but has missing rows - show arrows
            table.classList.remove('has-missing');
            void table.offsetWidth; // Force reflow to restart animation
            table.classList.add('has-missing');
          } else {
            // Either last row not answered yet, or all rows filled - remove arrows
            table.classList.remove('has-missing');
          }
        }
        updateIndexStatus();
      });
    });
  }

  /**
   * Setup auto-save functionality with debouncing
   */
  function setupAutoSave() {
    let saveTimeout;
    document.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveFormData, CONSTANTS.TIMEOUTS.AUTO_SAVE_DELAY);
      });
      input.addEventListener('change', saveFormData);
    });
  }

  /**
   * Check if a field is filled
   * @param {string} fieldName - The field name to check
   * @returns {boolean} True if the field has a value
   */
  function isFieldFilled(fieldName) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) return false;

    if (input.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldName}"]:checked`);
      return !!checked;
    } else if (input.type === 'checkbox') {
      return input.checked;
    } else {
      return input.value && input.value.trim() !== '';
    }
  }

  /**
   * Check if a field is a conditional field
   * @param {string} fieldName - The field name to check
   * @returns {boolean} True if the field is conditional
   */
  function isConditionalField(fieldName) {
    return !!CONDITIONAL_PARENT_MAP[fieldName];
  }

  /**
   * Check if a conditional field's parent condition is active
   * @param {string} fieldName - The conditional field name
   * @returns {boolean} True if the parent condition is met (field should be visible)
   */
  function isConditionalActive(fieldName) {
    const parentInfo = CONDITIONAL_PARENT_MAP[fieldName];
    if (!parentInfo) return true; // Not a conditional field

    const parentInput = document.querySelector(`[name="${parentInfo.parent}"]:checked`);
    if (!parentInput) return false;

    return parentInput.value === parentInfo.value;
  }

  /**
   * Check if a Likert table is incomplete
   * @param {string[]} fields - Array of field names in the Likert table
   * @returns {Object} { incomplete: boolean, filled: number, total: number }
   */
  function checkLikertTableStatus(fields) {
    let filled = 0;
    const total = fields.length;

    fields.forEach(fieldName => {
      if (isFieldFilled(fieldName)) {
        filled++;
      }
    });

    return {
      incomplete: filled < total,
      filled: filled,
      total: total
    };
  }

  /**
   * Get all incomplete items grouped by section/step
   * @returns {Array} Array of incomplete item objects
   */
  function getIncompleteItems() {
    const incompleteItems = [];
    const processedLikertFields = new Set();

    // Process each step
    Object.keys(CONFIG.STEP_FIELDS).forEach(stepStr => {
      const step = parseInt(stepStr, 10);
      const fields = CONFIG.STEP_FIELDS[step];
      const stepLabel = STEP_LABELS[step] || `Stap ${step}`;

      // Check for Likert tables in this step
      Object.keys(LIKERT_LABELS).forEach(tableId => {
        const tableInfo = LIKERT_LABELS[tableId];
        if (tableInfo.step === step) {
          const status = checkLikertTableStatus(tableInfo.fields);
          if (status.incomplete) {
            incompleteItems.push({
              step: step,
              stepLabel: stepLabel,
              label: tableInfo.label,
              type: 'likert',
              filled: status.filled,
              total: status.total
            });
          }
          // Mark these fields as processed
          tableInfo.fields.forEach(f => processedLikertFields.add(f));
        }
      });

      // Check non-Likert fields
      const nonLikertMissing = [];
      fields.forEach(fieldName => {
        // Skip if already processed as part of Likert table
        if (processedLikertFields.has(fieldName)) return;

        // Skip conditional fields whose parent condition is not active
        if (isConditionalField(fieldName) && !isConditionalActive(fieldName)) {
          return;
        }

        // Check if field is filled
        if (!isFieldFilled(fieldName)) {
          nonLikertMissing.push(fieldName);
        }
      });

      // Also check conditional fields that are active
      Object.keys(CONDITIONAL_PARENT_MAP).forEach(conditionalField => {
        const parentInfo = CONDITIONAL_PARENT_MAP[conditionalField];
        // Find which step this conditional field belongs to
        const parentStep = Object.keys(CONFIG.STEP_FIELDS).find(s =>
          CONFIG.STEP_FIELDS[s].includes(parentInfo.parent)
        );

        if (parseInt(parentStep, 10) === step) {
          if (isConditionalActive(conditionalField) && !isFieldFilled(conditionalField)) {
            if (!nonLikertMissing.includes(conditionalField)) {
              nonLikertMissing.push(conditionalField);
            }
          }
        }
      });

      // Add non-Likert incomplete fields as a group for this step
      if (nonLikertMissing.length > 0) {
        incompleteItems.push({
          step: step,
          stepLabel: stepLabel,
          label: stepLabel,
          type: 'fields',
          missingFields: nonLikertMissing,
          count: nonLikertMissing.length
        });
      }
    });

    return incompleteItems;
  }

  /**
   * Generate the review content HTML
   */
  function generateReviewContent() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;

    const incompleteItems = getIncompleteItems();

    if (incompleteItems.length === 0) {
      // All fields filled - show success message
      reviewContent.innerHTML = `
        <div class="review-complete">
          <div class="review-complete-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>Alle velden zijn ingevuld!</h3>
          <p>Uw formulier is volledig ingevuld. U kunt nu verzenden.</p>
          <button type="button" class="btn btn-primary btn-submit-review" data-action="confirmSubmit">
            Verzenden
          </button>
        </div>
      `;
    } else {
      // Show incomplete items
      let itemsHtml = '';

      // Group items by step for cleaner display
      const itemsByStep = {};
      incompleteItems.forEach(item => {
        if (!itemsByStep[item.step]) {
          itemsByStep[item.step] = [];
        }
        itemsByStep[item.step].push(item);
      });

      Object.keys(itemsByStep).sort((a, b) => parseInt(a) - parseInt(b)).forEach(step => {
        const items = itemsByStep[step];
        const stepLabel = STEP_LABELS[step] || `Stap ${step}`;

        items.forEach(item => {
          if (item.type === 'likert') {
            itemsHtml += `
              <div class="review-item">
                <div class="review-item-info">
                  <span class="review-item-step">${item.stepLabel}</span>
                  <span class="review-item-label">${item.label}</span>
                  <span class="review-item-count">${item.filled} van ${item.total} ingevuld</span>
                </div>
                <button type="button" class="btn btn-secondary btn-review-goto" data-action="goToStep" data-step="${item.step}">
                  Invullen &rarr;
                </button>
              </div>
            `;
          } else {
            itemsHtml += `
              <div class="review-item">
                <div class="review-item-info">
                  <span class="review-item-step">${item.stepLabel}</span>
                  <span class="review-item-label">${item.count} veld${item.count > 1 ? 'en' : ''} niet ingevuld</span>
                </div>
                <button type="button" class="btn btn-secondary btn-review-goto" data-action="goToStep" data-step="${item.step}">
                  Invullen &rarr;
                </button>
              </div>
            `;
          }
        });
      });

      reviewContent.innerHTML = `
        <div class="review-incomplete">
          <div class="review-incomplete-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3>Niet alle velden zijn ingevuld</h3>
          </div>
          <p class="review-incomplete-subtitle">U kunt teruggaan om ontbrekende velden in te vullen, of bewust incompleet verzenden.</p>

          <div class="review-items">
            ${itemsHtml}
          </div>

          <div class="review-confirm">
            <label class="review-confirm-label">
              <input type="checkbox" id="confirmIncomplete" class="review-confirm-checkbox">
              <span>Ik begrijp dat niet alle velden zijn ingevuld en wil toch verzenden</span>
            </label>
          </div>

          <button type="button" class="btn btn-primary btn-submit-review" data-action="confirmSubmit" id="btnConfirmSubmit" disabled>
            Verzenden
          </button>
        </div>
      `;

      // Add checkbox listener
      const checkbox = document.getElementById('confirmIncomplete');
      const submitBtn = document.getElementById('btnConfirmSubmit');
      if (checkbox && submitBtn) {
        checkbox.addEventListener('change', function() {
          submitBtn.disabled = !this.checked;
        });
      }
    }
  }

  /**
   * Handle confirm submit action from review page
   */
  function handleConfirmSubmit() {
    // If incomplete, check that checkbox is checked
    const checkbox = document.getElementById('confirmIncomplete');
    if (checkbox && !checkbox.checked) {
      return; // Button should be disabled anyway
    }

    // Proceed with submission
    submitForm();
  }

  /**
   * Save form data to localStorage
   */
  function saveFormData() {
    const form = document.getElementById('monitoringForm');
    const data = {};
    new FormData(form).forEach((v, k) => data[k] = v);
    Storage.saveFormData(data);
  }

  /**
   * Load saved form data from localStorage and restore UI state
   */
  function loadSavedFormData() {
    const data = Storage.getFormData();
    if (!data) return;

    Object.entries(data).forEach(([name, value]) => {
      const input = document.querySelector(`[name="${name}"]`);
      if (!input) return;

      if (input.type === 'radio') {
        const radio = document.querySelector(`[name="${name}"][value="${value}"]`);
        if (radio) {
          radio.checked = true;
          const card = radio.closest('.option-card');
          if (card) card.classList.add(CONSTANTS.CSS.SELECTED);

          const header = document.getElementById(`header-${name}`);
          if (header) header.classList.add(CONSTANTS.CSS.HAS_VALUE);

          // Handle conditional fields using centralized mapping
          const conditionalId = CONSTANTS.CONDITIONAL_FIELDS[name];
          if (conditionalId) {
            // Check if there's a custom trigger value for this field
            const triggerValue = CONSTANTS.CONDITIONAL_VALUES && CONSTANTS.CONDITIONAL_VALUES[name]
              ? CONSTANTS.CONDITIONAL_VALUES[name]
              : CONSTANTS.ANSWERS.YES;
            if (value === triggerValue) {
              toggleConditional(conditionalId, true);
            }
          }

          // Likert table row highlighting and header tracking
          const row = radio.closest('tr');
          if (row) {
            row.classList.add(CONSTANTS.CSS.ANSWERED);
            const table = radio.closest('.likert-table');
            if (table && table.id) {
              const header = document.getElementById(`header-${table.id}`);
              if (header) header.classList.add(CONSTANTS.CSS.HAS_VALUE);
            }
          }
        }
      } else if (input.type === 'checkbox') {
        input.checked = value === 'on' || value === true;
      } else {
        input.value = value;
        // Show comments field if it has content
        if (name.startsWith('opmerkingen_stap_') && value.trim() !== '') {
          const step = name.replace('opmerkingen_stap_', '');
          const field = document.getElementById(`comments-field-${step}`);
          if (field) field.classList.add(CONSTANTS.CSS.SHOW);
        }
      }
    });

    updateAllSections();
    updateIndexStatus();
    updateAllOptionCardConditionalStatuses();
  }

  /**
   * Collect all form data including metadata
   * @returns {Object} Form data with timestamp, orgCode, and orgName
   */
  function getFormData() {
    const form = document.getElementById('monitoringForm');
    const data = {};
    new FormData(form).forEach((v, k) => data[k] = v);

    // Add metadata
    data.timestamp = new Date().toISOString();
    data.orgCode = session.orgCode;
    data.orgName = session.orgName;

    return data;
  }

  /**
   * Submit the form to the backend
   */
  async function submitForm() {
    // Validate required fields on the sign-off page
    const ondertekenaar = document.querySelector('[name="ondertekenaar"]');
    const bevestiging = document.querySelector('[name="bevestiging"]');

    if (!ondertekenaar || !ondertekenaar.value.trim()) {
      alert('Vul de naam van de CEO/directeur in.');
      if (ondertekenaar) ondertekenaar.focus();
      return;
    }

    if (!bevestiging || !bevestiging.checked) {
      alert('Bevestig dat de gegevens naar waarheid zijn ingevuld.');
      return;
    }

    const btn = document.getElementById('btnNext');
    const btnTop = document.getElementById('btnNextTop');
    const originalText = btn ? btn.textContent : CONSTANTS.UI.BUTTON_SUBMIT;

    // Disable both buttons during submission
    if (btn) {
      btn.disabled = true;
      btn.textContent = CONSTANTS.UI.BUTTON_SUBMITTING;
    }
    if (btnTop) {
      btnTop.disabled = true;
      btnTop.textContent = CONSTANTS.UI.BUTTON_SUBMITTING;
    }

    try {
      const formData = getFormData();

      // If API is not configured, simulate successful submission
      if (!ApiClient.isConfigured()) {
        // Simulate network delay for demo
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success
        currentStep = CONFIG.SUCCESS_STEP;
        showStep(currentStep);

        // Clear saved form data
        Storage.clearFormData();
        return;
      }

      // Submit to backend
      const result = await ApiClient.submitSurvey(formData);

      if (result.success) {
        currentStep = CONFIG.SUCCESS_STEP;
        showStep(currentStep);

        // Show document link if available
        if (result.documentUrl) {
          const docLink = document.getElementById('docLink');
          const docLinkAnchor = document.getElementById('docLinkAnchor');
          if (docLink && docLinkAnchor) {
            docLinkAnchor.href = result.documentUrl;
            docLink.style.display = 'block';
          }
        }

        // Clear saved form data
        Storage.clearFormData();
      } else {
        throw new Error(result.message || CONSTANTS.ERRORS.SUBMIT_ERROR);
      }
    } catch (e) {
      alert(CONSTANTS.ERRORS.SUBMIT_ERROR);
      // Re-enable both buttons on error
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
      if (btnTop) {
        btnTop.disabled = false;
        btnTop.textContent = originalText;
      }
    }
  }

  /**
   * Print the complete form with all pages
   */
  function printForm() {
    // Store current step to restore after printing
    const originalStep = currentStep;

    // Temporarily show all steps for printing
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
      // Don't show the success step
      if (step.dataset.step !== '6') {
        step.classList.add('active');
      }
    });

    // Trigger browser print dialog
    window.print();

    // Restore original state after print dialog closes
    // Use timeout to ensure print dialog has closed
    setTimeout(() => {
      steps.forEach(step => {
        step.classList.remove('active');
      });
      showStep(originalStep);
    }, 100);
  }

  /**
   * Logout and return to login page
   */
  function logout() {
    Storage.clearSession();
    // Redirect with logout parameter as extra safety
    window.location.href = '/index.html?logout=1';
  }

})();
