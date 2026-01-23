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
  let reviewVisited = false; // Track if review step has been visited
  let initialReviewItems = null; // Snapshot of incomplete items when review was first visited

  // Step labels for review page
  const STEP_LABELS = {
    0: 'Welkom',
    1: 'Streefcijfer',
    2: 'Kwantitatief',
    3: 'Bestuursorganen',
    4: 'Kwalitatief (intro)',
    5: 'Leiderschap',
    6: 'Strategie',
    7: 'HR Management',
    8: 'Communicatie',
    9: 'Kennis',
    10: 'Klimaat',
    11: 'Motivatie',
    12: 'Aanvullend',
    13: 'Ondertekenen'
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
      step: 5,
      label: 'Leiderschap stellingen',
      fields: ['leid_1', 'leid_2', 'leid_3', 'leid_4', 'leid_5']
    },
    'likert-strategie': {
      step: 6,
      label: 'Strategie stellingen',
      fields: ['strat_1', 'strat_2', 'strat_3', 'strat_4', 'strat_5', 'strat_6', 'strat_7', 'strat_8']
    },
    'likert-hr': {
      step: 7,
      label: 'HR Management stellingen',
      fields: ['hr_1', 'hr_2', 'hr_3', 'hr_4', 'hr_5', 'hr_6', 'hr_7', 'hr_8', 'hr_9', 'hr_10', 'hr_11', 'hr_12', 'hr_13', 'hr_14']
    },
    'likert-communicatie': {
      step: 8,
      label: 'Communicatie stellingen',
      fields: ['comm_1', 'comm_2', 'comm_3', 'comm_4', 'comm_5']
    },
    'likert-kennis': {
      step: 9,
      label: 'Kennis stellingen',
      fields: ['kennis_1', 'kennis_2', 'kennis_3', 'kennis_4', 'kennis_5', 'kennis_6', 'kennis_7', 'kennis_8']
    },
    'likert-klimaat': {
      step: 10,
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

  // Per-page scroll position memory
  let scrollPositions = {};
  let scrollSaveTimeout = null;

  /**
   * Load scroll positions from localStorage
   */
  function loadScrollPositions() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SCROLL_POSITIONS);
      if (saved) {
        scrollPositions = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load scroll positions:', e);
      scrollPositions = {};
    }
  }

  /**
   * Save scroll positions to localStorage
   */
  function persistScrollPositions() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.SCROLL_POSITIONS, JSON.stringify(scrollPositions));
    } catch (e) {
      console.warn('Could not save scroll positions:', e);
    }
  }

  /**
   * Save the current scroll position for the current step
   */
  function saveScrollPosition() {
    const scrollY = window.scrollY || window.pageYOffset;
    scrollPositions[currentStep] = scrollY;
    persistScrollPositions();
  }

  /**
   * Restore scroll position for a given step
   * @param {number} step - The step to restore scroll position for
   */
  function restoreScrollPosition(step) {
    const savedPosition = scrollPositions[step];
    if (typeof savedPosition === 'number' && savedPosition > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedPosition, behavior: 'instant' });
      });
    } else {
      // No saved position for this step - scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  /**
   * Handle scroll events - debounced save of scroll position
   */
  function handleScroll() {
    // Clear any pending save
    if (scrollSaveTimeout) {
      clearTimeout(scrollSaveTimeout);
    }
    // Debounce: save after 150ms of no scrolling
    scrollSaveTimeout = setTimeout(() => {
      saveScrollPosition();
    }, 150);
  }

  /**
   * Clear scroll positions (called on form reset/clear)
   */
  function clearScrollPositions() {
    scrollPositions = {};
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.SCROLL_POSITIONS);
    } catch (e) {
      console.warn('Could not clear scroll positions:', e);
    }
  }

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
    setupWordCounter(); // After loadSavedFormData so counter shows saved word count
    setupTextareaWordCounters(); // Word counters for toelichting and comment fields
    updateIndexStatus(); // Initialize progress bar
    calculateStableCardDimensions();

    // Load saved scroll positions before showing step
    loadScrollPositions();
    showStep(0);

    // Initialize mobile drawer
    initMobileDrawer();

    // Initialize mobile Likert controls
    initMobileLikert();

    // Initialize Flatpickr date picker
    initDatePicker();

    // Listen for scroll events to save position (debounced in handleScroll)
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Width stability handled via CSS - no resize recalculation needed
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

      case 'toggleAccordion':
        const accordionId = element.dataset.accordion;
        if (accordionId) {
          toggleAccordion(accordionId);
        }
        break;

      case 'goToReview':
        goToStep(CONFIG.REVIEW_STEP);
        break;

      case 'startNewForm':
        showRestartChoiceModal();
        break;

      case 'continueExistingForm':
        hideRestartChoiceModal();
        break;

      case 'showClearWarning':
        showClearWarningModal();
        break;

      case 'confirmClearForm':
        clearFormAndRestart();
        break;

      case 'cancelClearForm':
        hideClearWarningModal();
        break;

      case 'printArchivedForm':
        const formId = element.dataset.formId;
        if (formId) printArchivedForm(formId);
        break;

      case 'closeValidationModal':
        hideValidationModal();
        break;

      case 'closeErrorModal':
        hideErrorModal();
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
   * Placeholder - width stability now handled purely via CSS
   * Container has fixed width, content area uses flex with min-width: 0
   */
  function calculateStableCardDimensions() {
    // No-op: CSS handles fixed container width
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
   * Only show dots for steps 0-13 (not review/success)
   */
  function initProgress() {
    const dotsBottom = document.getElementById('progressDots');
    const dotsTop = document.getElementById('progressDotsTop');
    const contentSteps = 14; // Steps 0-13

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
   * Dots only represent steps 0-13
   */
  function updateProgress() {
    const dotsContainers = document.querySelectorAll('.progress-dots');
    const displayStep = currentStep <= 13 ? currentStep : 13; // Clamp to 13 for review/success

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
    // Also handle clickable dividers
    document.querySelectorAll('.index-divider-clickable').forEach(divider => {
      const step = parseInt(divider.dataset.step);
      divider.classList.toggle(CONSTANTS.CSS.ACTIVE, step === currentStep);
    });

    // Update mobile highlighter position
    updateMobileHighlighter();
  }

  /**
   * Update mobile highlighter position to match active item
   */
  function updateMobileHighlighter() {
    const highlighter = document.getElementById('mobileHighlighter');
    const indexContainer = document.querySelector('.index');
    if (!highlighter || !indexContainer) return;

    // Find the active item (could be index-item or index-divider-clickable)
    const activeItem = indexContainer.querySelector('.index-item.active, .index-divider-clickable.active');

    if (activeItem) {
      // Get position relative to index container
      const indexRect = indexContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Calculate top position relative to index (accounting for scroll)
      const topPosition = itemRect.top - indexRect.top + indexContainer.scrollTop;

      // Update highlighter position and size
      highlighter.style.top = topPosition + 'px';
      highlighter.style.height = itemRect.height + 'px';
      highlighter.classList.add('active');

      // Morph shape based on element type
      const isDivider = activeItem.classList.contains('index-divider-clickable');
      highlighter.classList.toggle('highlighter-divider', isDivider);
      highlighter.classList.toggle('highlighter-item', !isDivider);
    } else {
      highlighter.classList.remove('active', 'highlighter-divider', 'highlighter-item');
    }
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

      // Restore saved scroll position for this step (or scroll to top if none saved)
      restoreScrollPosition(step);
    }

    // Update previous step tracker
    previousStep = step;

    // Generate review content when showing review step
    if (step === CONFIG.REVIEW_STEP) {
      // Capture initial incomplete items on first visit
      if (!reviewVisited) {
        reviewVisited = true;
        initialReviewItems = getIncompleteItems();
      }
      generateReviewContent();
    }

    // Show/hide "Ga naar controle" button based on reviewVisited status
    const btnGoToReview = document.getElementById('btnGoToReview');
    const btnGoToReviewTop = document.getElementById('btnGoToReviewTop');
    const showReviewBtn = reviewVisited && step < CONFIG.REVIEW_STEP;
    if (btnGoToReview) btnGoToReview.style.display = showReviewBtn ? 'block' : 'none';
    if (btnGoToReviewTop) btnGoToReviewTop.style.display = showReviewBtn ? 'block' : 'none';

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
    if (step === 13) {
      // Step 13 (Ondertekenen) - next goes to review, button says "Controleren"
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
    // Save scroll position before leaving current step
    saveScrollPosition();
    currentStep = step;
    showStep(step);
  }

  /**
   * Go to next step (step 13 goes to review, review is handled by its own button)
   */
  function nextStep() {
    // Save scroll position before leaving current step
    saveScrollPosition();
    if (currentStep === 13) {
      // Go to review step
      currentStep = CONFIG.REVIEW_STEP;
      showStep(currentStep);
    } else if (currentStep < 13) {
      currentStep++;
      showStep(currentStep);
    }
    // Note: Review step submission is handled by handleConfirmSubmit()
  }

  /**
   * Go to previous step
   */
  function prevStep() {
    // Save scroll position before leaving current step
    saveScrollPosition();
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

    // Reset segmented controls on mobile
    table.querySelectorAll('.likert-segment-option').forEach(btn => {
      btn.classList.remove('selected');
      btn.setAttribute('aria-checked', 'false');
    });

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

    // Also listen to contenteditable editor for auto-save
    const editor = document.getElementById('voorbeeld-organisatie-editor');
    if (editor) {
      editor.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveFormData, CONSTANTS.TIMEOUTS.AUTO_SAVE_DELAY);
      });
    }
  }

  /**
   * Setup word counter for contenteditable field with word limits
   * Words beyond soft limit are shown in red/bold, hard limit blocks input
   */
  function setupWordCounter() {
    const editor = document.getElementById('voorbeeld-organisatie-editor');
    const hiddenInput = document.getElementById('voorbeeld-organisatie-hidden');
    const counter = document.getElementById('word-counter-voorbeeld');
    if (!editor || !hiddenInput || !counter) return;

    const softLimit = 200;
    const hardLimit = 220; // 10% margin as hidden "delight"

    function getWords(text) {
      const trimmed = text.trim();
      if (!trimmed) return [];
      return trimmed.split(/\s+/);
    }

    function getPlainText() {
      // Get text content without HTML tags
      return editor.textContent || '';
    }

    function saveCursorPosition() {
      const sel = window.getSelection();
      if (sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(editor);
      preRange.setEnd(range.startContainer, range.startOffset);
      return preRange.toString().length;
    }

    function restoreCursorPosition(pos) {
      if (pos === null) return;
      const sel = window.getSelection();
      const range = document.createRange();

      let currentPos = 0;
      let found = false;

      function walkNodes(node) {
        if (found) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const len = node.textContent.length;
          if (currentPos + len >= pos) {
            range.setStart(node, pos - currentPos);
            range.collapse(true);
            found = true;
            return;
          }
          currentPos += len;
        } else {
          for (const child of node.childNodes) {
            walkNodes(child);
            if (found) return;
          }
        }
      }

      walkNodes(editor);
      if (found) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    // Interpolate color from yellow to red for gradient
    function getGradientColor(index, total) {
      // Yellow: rgb(230, 170, 0) -> Red: rgb(200, 50, 50)
      const t = total <= 1 ? 1 : index / (total - 1);
      const r = Math.round(230 + (200 - 230) * t);
      const g = Math.round(170 + (50 - 170) * t);
      const b = Math.round(0 + (50 - 0) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }

    function updateDisplay() {
      const text = getPlainText();
      const words = getWords(text);
      const wordCount = words.length;

      // Sync to hidden input (plain text for form submission)
      hiddenInput.value = text;

      // If at or under soft limit, just show plain text
      if (wordCount <= softLimit) {
        counter.innerHTML = `${wordCount} / ${softLimit} woorden`;
        // Only update if content changed (avoid cursor jump)
        if (editor.textContent !== text) {
          editor.textContent = text;
        }
        return;
      }

      // Over soft limit - build counter with colored parts
      const excessIndex = Math.min(wordCount - softLimit - 1, 19); // 0-19 for gradient
      const counterColor = wordCount >= hardLimit
        ? getGradientColor(19, 20) // Full red at limit
        : getGradientColor(excessIndex, 20);

      if (wordCount >= hardLimit) {
        counter.innerHTML = `<span style="color: ${counterColor}; font-weight: 500;">${wordCount} / ${softLimit} woorden</span> — <span class="hint-error">limiet bereikt</span>`;
      } else {
        counter.innerHTML = `<span style="color: ${counterColor}; font-weight: 500;">${wordCount} / ${softLimit} woorden</span> — <span class="hint-success">dit mag nog</span>`;
      }

      // Save cursor position
      const cursorPos = saveCursorPosition();

      // Build HTML with excess words in yellow-to-red gradient
      const normalWords = words.slice(0, softLimit);
      const excessWords = words.slice(softLimit, hardLimit);

      let html = normalWords.join(' ');
      if (excessWords.length > 0) {
        const styledWords = excessWords.map((word, i) => {
          const color = getGradientColor(i, 20); // Always use 20 steps for consistent gradient
          return `<span style="color: ${color}; font-weight: 600;">${word}</span>`;
        });
        html += ' ' + styledWords.join(' ');
      }

      editor.innerHTML = html;

      // Restore cursor
      restoreCursorPosition(cursorPos);

      // Update hidden input with truncated text if over hard limit
      if (wordCount > hardLimit) {
        hiddenInput.value = words.slice(0, hardLimit).join(' ');
      }
    }

    // Block input when at hard limit
    editor.addEventListener('keydown', function(e) {
      const words = getWords(getPlainText());
      const atLimit = words.length >= hardLimit;

      // Allow: backspace, delete, arrows, ctrl+a, ctrl+c, ctrl+v, ctrl+x
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      const isCtrlCombo = e.ctrlKey || e.metaKey;

      if (atLimit && !allowedKeys.includes(e.key) && !isCtrlCombo) {
        // Check if this would add a new word (space or character at end)
        e.preventDefault();
      }
    });

    // Handle paste - trim to hard limit
    editor.addEventListener('paste', function(e) {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const currentText = getPlainText();
      const currentWords = getWords(currentText);
      const pastedWords = getWords(pastedText);
      const availableSlots = hardLimit - currentWords.length;

      if (availableSlots <= 0) return;

      const textToInsert = pastedWords.slice(0, availableSlots).join(' ');
      document.execCommand('insertText', false, textToInsert);
    });

    editor.addEventListener('input', updateDisplay);

    // Initialize display
    updateDisplay();
  }

  /**
   * Setup simple word counters for large textareas (toelichting, motivatie, opmerkingen)
   * Shows word count without strict limits - just informational
   */
  function setupTextareaWordCounters() {
    // Define which textareas should have word counters
    const textareaNames = [
      // Toelichting fields
      'leiderschap_toelichting',
      'strategie_toelichting',
      'hr_toelichting',
      'communicatie_toelichting',
      'kennis_toelichting',
      'klimaat_toelichting',
      // Motivatie field
      'motivatie',
      // Comment fields
      'opmerkingen_stap_0',
      'opmerkingen_stap_1',
      'opmerkingen_stap_2',
      'opmerkingen_stap_3',
      'opmerkingen_stap_5',
      'opmerkingen_stap_6',
      'opmerkingen_stap_7',
      'opmerkingen_stap_8',
      'opmerkingen_stap_9',
      'opmerkingen_stap_10',
      'opmerkingen_stap_11',
      'opmerkingen_stap_12',
      'opmerkingen_stap_13'
    ];

    function getWordCount(text) {
      const trimmed = text.trim();
      if (!trimmed) return 0;
      return trimmed.split(/\s+/).length;
    }

    function updateCounter(textarea, counter) {
      const wordCount = getWordCount(textarea.value);
      counter.textContent = wordCount === 1 ? '1 woord' : `${wordCount} woorden`;
    }

    textareaNames.forEach(function(name) {
      const textarea = document.querySelector(`textarea[name="${name}"]`);
      if (!textarea) return;

      // Create word counter element
      const counter = document.createElement('span');
      counter.className = 'word-counter textarea-word-counter';

      // Insert after textarea
      textarea.parentNode.insertBefore(counter, textarea.nextSibling);

      // Update on input
      textarea.addEventListener('input', function() {
        updateCounter(textarea, counter);
      });

      // Initialize with current value
      updateCounter(textarea, counter);
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
   * Uses initialReviewItems (snapshot from first visit) to show persistent list
   */
  function generateReviewContent() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;

    // Use stored initial items, or get current if not yet captured
    const reviewItems = initialReviewItems || getIncompleteItems();

    // If there were no incomplete items at first visit, show success
    if (reviewItems.length === 0) {
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
      return;
    }

    // Calculate current completion status for each stored item
    let allNowComplete = true;
    let itemsHtml = '';
    let accordionIndex = 0;

    // Group items by step for cleaner display
    const itemsByStep = {};
    reviewItems.forEach(item => {
      if (!itemsByStep[item.step]) {
        itemsByStep[item.step] = [];
      }
      itemsByStep[item.step].push(item);
    });

    Object.keys(itemsByStep).sort((a, b) => parseInt(a) - parseInt(b)).forEach(step => {
      const items = itemsByStep[step];

      items.forEach(item => {
        const accordionId = `accordion-${accordionIndex}`;
        accordionIndex++;

        // Calculate current status of this item
        let isNowComplete = false;
        let currentFilled = 0;
        let currentRemaining = 0;

        if (item.type === 'likert') {
          const status = checkLikertTableStatus(item.fields || LIKERT_LABELS[Object.keys(LIKERT_LABELS).find(k => LIKERT_LABELS[k].step === item.step && LIKERT_LABELS[k].label === item.label)]?.fields || []);
          currentFilled = status.filled;
          isNowComplete = !status.incomplete;
        } else {
          item.missingFields.forEach(fieldName => {
            if (isFieldFilled(fieldName)) {
              currentFilled++;
            } else {
              currentRemaining++;
            }
          });
          isNowComplete = currentRemaining === 0;
        }

        if (!isNowComplete) {
          allNowComplete = false;
        }

        const completedClass = isNowComplete ? 'accordion-complete' : '';

        if (item.type === 'likert') {
          const accordionContent = generateLikertAccordionContent(item);
          const statusText = isNowComplete
            ? `${item.total} van ${item.total} ingevuld`
            : `${currentFilled} van ${item.total} ingevuld`;

          itemsHtml += `
            <div class="review-item-accordion ${completedClass}">
              <div class="review-item-header" data-action="toggleAccordion" data-accordion="${accordionId}">
                <div class="review-item-info">
                  <span class="review-item-step">${item.stepLabel}</span>
                  <span class="review-item-label">${item.label}</span>
                  <span class="review-item-count" id="${accordionId}-count">${statusText}</span>
                </div>
                <div class="review-item-actions">
                  <button type="button" class="btn btn-secondary btn-review-goto" data-action="goToStep" data-step="${item.step}">
                    Naar sectie &rarr;
                  </button>
                  <span class="accordion-chevron" id="${accordionId}-chevron">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div class="review-item-content" id="${accordionId}" data-step="${item.step}" data-type="likert">
                ${accordionContent}
              </div>
            </div>
          `;
        } else {
          const accordionContent = generateFieldsAccordionContent(item);
          const statusText = isNowComplete
            ? 'Compleet'
            : `${currentRemaining} veld${currentRemaining > 1 ? 'en' : ''} niet ingevuld`;

          itemsHtml += `
            <div class="review-item-accordion ${completedClass}">
              <div class="review-item-header" data-action="toggleAccordion" data-accordion="${accordionId}">
                <div class="review-item-info">
                  <span class="review-item-step">${item.stepLabel}</span>
                  <span class="review-item-label" id="${accordionId}-label">${statusText}</span>
                </div>
                <div class="review-item-actions">
                  <button type="button" class="btn btn-secondary btn-review-goto" data-action="goToStep" data-step="${item.step}">
                    Naar sectie &rarr;
                  </button>
                  <span class="accordion-chevron" id="${accordionId}-chevron">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div class="review-item-content" id="${accordionId}" data-step="${item.step}" data-type="fields" data-fields='${JSON.stringify(item.missingFields)}'>
                ${accordionContent}
              </div>
            </div>
          `;
        }
      });
    });

    // Determine header and confirmation UI based on current completion
    const headerIcon = allNowComplete
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="24" height="24">
           <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
           <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`;

    const headerClass = allNowComplete ? 'review-all-complete-header' : 'review-incomplete-header';
    const headerText = allNowComplete
      ? 'Alle secties zijn nu ingevuld!'
      : 'Niet alle velden zijn ingevuld';
    const subtitleText = allNowComplete
      ? 'De onderstaande secties waren oorspronkelijk incompleet maar zijn nu ingevuld. U kunt nu verzenden.'
      : 'Klik op een sectie om de velden direct hier in te vullen, of ga naar de betreffende stap.';

    const confirmHtml = allNowComplete
      ? ''
      : `<div class="review-confirm">
           <label class="review-confirm-label">
             <input type="checkbox" id="confirmIncomplete" class="review-confirm-checkbox">
             <span>Ik begrijp dat niet alle velden zijn ingevuld en wil toch verzenden</span>
           </label>
         </div>`;

    const submitDisabled = allNowComplete ? '' : 'disabled';
    const containerClass = allNowComplete ? 'review-now-complete' : 'review-incomplete';

    reviewContent.innerHTML = `
      <div class="${containerClass}">
        <div class="${headerClass}">
          ${headerIcon}
          <h3>${headerText}</h3>
        </div>
        <p class="review-incomplete-subtitle">${subtitleText}</p>

        <div class="review-items">
          ${itemsHtml}
        </div>

        ${confirmHtml}

        <button type="button" class="btn btn-primary btn-submit-review" data-action="confirmSubmit" id="btnConfirmSubmit" ${submitDisabled}>
          Verzenden
        </button>
      </div>
    `;

    // Add checkbox listener if present
    const checkbox = document.getElementById('confirmIncomplete');
    const submitBtn = document.getElementById('btnConfirmSubmit');
    if (checkbox && submitBtn) {
      checkbox.addEventListener('change', function() {
        submitBtn.disabled = !this.checked;
      });
    }

    // Setup accordion input listeners
    setupAccordionInputListeners();
  }

  /**
   * Generate accordion content for Likert table items
   * @param {Object} item - The incomplete item object
   * @returns {string} HTML content for the accordion
   */
  function generateLikertAccordionContent(item) {
    // Find the Likert table configuration
    let tableConfig = null;
    let tableId = null;
    Object.keys(LIKERT_LABELS).forEach(id => {
      if (LIKERT_LABELS[id].step === item.step && LIKERT_LABELS[id].label === item.label) {
        tableConfig = LIKERT_LABELS[id];
        tableId = id;
      }
    });

    if (!tableConfig) return '<p>Kon vragen niet laden.</p>';

    // Find the original table and get row data
    const originalTable = document.getElementById(tableId);
    let rows = [];

    if (originalTable) {
      const tbody = originalTable.querySelector('tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
          const questionCell = tr.querySelector('td:first-child');
          const radios = tr.querySelectorAll('input[type="radio"]');
          if (questionCell && radios.length > 0) {
            const fieldName = radios[0].name;
            rows.push({
              question: questionCell.textContent,
              fieldName: fieldName,
              filled: isFieldFilled(fieldName)
            });
          }
        });
      }
    } else {
      // Fallback for klimaat table (no id in HTML)
      if (item.step === 9) {
        const klimaatQuestions = [
          'Er wordt actief strijd gevoerd tegen stereotypen',
          'Maatregelen worden geaccepteerd in de organisatie',
          'Culturele verschillen worden gewaardeerd',
          'Diversiteitsaandacht leeft in de organisatie',
          'Managers voelen zich verantwoordelijk',
          'De organisatie staat bekend als diversiteitsgericht'
        ];
        tableConfig.fields.forEach((fieldName, index) => {
          rows.push({
            question: klimaatQuestions[index] || `Vraag ${index + 1}`,
            fieldName: fieldName,
            filled: isFieldFilled(fieldName)
          });
        });
      }
    }

    // Generate table HTML with only incomplete rows highlighted
    let rowsHtml = rows.map(row => {
      const currentValue = getFieldValue(row.fieldName);
      return `
        <tr class="${row.filled ? 'row-complete' : 'row-incomplete'}">
          <td>${row.question}</td>
          <td><input type="radio" name="review_${row.fieldName}" value="0" ${currentValue === '0' ? 'checked' : ''} data-original="${row.fieldName}"></td>
          <td><input type="radio" name="review_${row.fieldName}" value="1" ${currentValue === '1' ? 'checked' : ''} data-original="${row.fieldName}"></td>
          <td><input type="radio" name="review_${row.fieldName}" value="2" ${currentValue === '2' ? 'checked' : ''} data-original="${row.fieldName}"></td>
          <td><input type="radio" name="review_${row.fieldName}" value="3" ${currentValue === '3' ? 'checked' : ''} data-original="${row.fieldName}"></td>
        </tr>
      `;
    }).join('');

    return `
      <table class="likert-table likert-table-review">
        <thead>
          <tr>
            <th>Stelling</th>
            <th>Niet</th>
            <th>Enigszins</th>
            <th>Grotendeels</th>
            <th>Volledig</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  /**
   * Generate accordion content for regular field items
   * @param {Object} item - The incomplete item object
   * @returns {string} HTML content for the accordion
   */
  function generateFieldsAccordionContent(item) {
    let fieldsHtml = '';

    item.missingFields.forEach(fieldName => {
      const label = FIELD_LABELS[fieldName] || fieldName;
      const originalField = document.querySelector(`[name="${fieldName}"]`);

      if (!originalField) return;

      if (originalField.type === 'radio') {
        // Radio button group
        const radioGroup = document.querySelectorAll(`[name="${fieldName}"]`);
        let optionsHtml = '';
        radioGroup.forEach(radio => {
          const optionCard = radio.closest('.option-card');
          let optionLabel = radio.value;
          if (optionCard) {
            const h3 = optionCard.querySelector('h3');
            if (h3) optionLabel = h3.textContent;
          }
          const currentValue = getFieldValue(fieldName);
          optionsHtml += `
            <label class="review-option-card">
              <input type="radio" name="review_${fieldName}" value="${radio.value}" ${currentValue === radio.value ? 'checked' : ''} data-original="${fieldName}">
              <span>${optionLabel}</span>
            </label>
          `;
        });
        fieldsHtml += `
          <div class="review-field">
            <label class="review-field-label">${label}</label>
            <div class="review-radio-group">
              ${optionsHtml}
            </div>
          </div>
        `;
      } else if (originalField.type === 'checkbox') {
        // Checkbox
        const isChecked = originalField.checked;
        fieldsHtml += `
          <div class="review-field">
            <label class="review-checkbox-label">
              <input type="checkbox" name="review_${fieldName}" ${isChecked ? 'checked' : ''} data-original="${fieldName}">
              <span>${label}</span>
            </label>
          </div>
        `;
      } else if (originalField.tagName === 'TEXTAREA') {
        // Textarea
        const currentValue = originalField.value || '';
        fieldsHtml += `
          <div class="review-field">
            <label class="review-field-label">${label}</label>
            <textarea name="review_${fieldName}" rows="3" data-original="${fieldName}" placeholder="Vul hier in...">${currentValue}</textarea>
          </div>
        `;
      } else if (originalField.type === 'date' || fieldName === 'datum') {
        // Date input - render with Flatpickr wrapper
        const currentValue = originalField.value || '';
        fieldsHtml += `
          <div class="review-field">
            <label class="review-field-label">${label}</label>
            <div class="date-input-wrapper">
              <input type="text" name="review_${fieldName}" id="review_datumPicker" value="${currentValue}" data-original="${fieldName}" readonly placeholder="Selecteer datum">
            </div>
          </div>
        `;
      } else if (originalField.type === 'number') {
        // Number input
        const currentValue = originalField.value || '';
        fieldsHtml += `
          <div class="review-field">
            <label class="review-field-label">${label}</label>
            <input type="number" name="review_${fieldName}" value="${currentValue}" min="0" data-original="${fieldName}" placeholder="0">
          </div>
        `;
      } else {
        // Text input
        const currentValue = originalField.value || '';
        fieldsHtml += `
          <div class="review-field">
            <label class="review-field-label">${label}</label>
            <input type="text" name="review_${fieldName}" value="${currentValue}" data-original="${fieldName}" placeholder="Vul hier in...">
          </div>
        `;
      }
    });

    return `<div class="review-fields-container">${fieldsHtml}</div>`;
  }

  /**
   * Get the current value of a field
   * @param {string} fieldName - The field name
   * @returns {string} The field value
   */
  function getFieldValue(fieldName) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) return '';

    if (input.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldName}"]:checked`);
      return checked ? checked.value : '';
    } else if (input.type === 'checkbox') {
      return input.checked ? 'true' : '';
    } else {
      return input.value || '';
    }
  }

  /**
   * Setup listeners for accordion inputs to sync with main form
   */
  function setupAccordionInputListeners() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;

    // Listen for changes on all review inputs
    reviewContent.addEventListener('change', function(event) {
      const input = event.target;
      if (!input.dataset.original) return;

      const originalName = input.dataset.original;
      const originalInput = document.querySelector(`[name="${originalName}"]`);

      if (!originalInput) return;

      // Sync value to original input and dispatch change event
      if (input.type === 'radio') {
        const originalRadio = document.querySelector(`[name="${originalName}"][value="${input.value}"]`);
        if (originalRadio) {
          originalRadio.checked = true;
          // Trigger change event for option card handling
          const optionCard = originalRadio.closest('.option-card');
          if (optionCard) {
            handleOptionCardClick(optionCard);
          } else {
            // For Likert tables and other radios without option cards
            // Dispatch change event to trigger any listeners
            originalRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      } else if (input.type === 'checkbox') {
        originalInput.checked = input.checked;
        originalInput.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        originalInput.value = input.value;
        originalInput.dispatchEvent(new Event('input', { bubbles: true }));
        originalInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Save form data
      saveFormData();

      // Update all section statuses and index
      updateAllSections();
      updateIndexStatus();

      // Update the accordion item status
      updateAccordionItemStatus(input);
    });

    // Also listen for input events on text/number fields
    reviewContent.addEventListener('input', function(event) {
      const input = event.target;
      if (!input.dataset.original) return;
      if (input.type === 'radio' || input.type === 'checkbox') return;

      const originalName = input.dataset.original;
      const originalInput = document.querySelector(`[name="${originalName}"]`);

      if (originalInput) {
        originalInput.value = input.value;
        originalInput.dispatchEvent(new Event('input', { bubbles: true }));
        saveFormData();
      }
    });

    // Initialize Flatpickr for review date field
    initReviewDatePicker();
  }

  /**
   * Initialize Flatpickr for the review page date field
   */
  function initReviewDatePicker() {
    const reviewDateInput = document.getElementById('review_datumPicker');
    if (!reviewDateInput || typeof flatpickr === 'undefined') return;

    flatpickr(reviewDateInput, {
      locale: 'nl',
      dateFormat: 'd-m-Y',
      altInput: true,
      altFormat: 'j F Y',
      disableMobile: true,
      allowInput: false,
      monthSelectorType: 'dropdown',
      animate: true,
      onChange: function(selectedDates, dateStr, instance) {
        // Sync with original datum field
        const originalInput = document.querySelector('[name="datum"]');
        if (originalInput) {
          originalInput.value = dateStr;
          // Update the main Flatpickr instance if it exists
          if (originalInput._flatpickr) {
            originalInput._flatpickr.setDate(dateStr, false);
          }
          originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        saveFormData();
        updateAllSections();
        updateIndexStatus();

        // Update accordion item status
        const accordionContent = reviewDateInput.closest('.review-item-content');
        if (accordionContent) {
          updateAccordionItemStatus(reviewDateInput);
        }
      }
    });
  }

  /**
   * Update the status display of an accordion item after a field is filled
   * @param {HTMLElement} input - The input that was changed
   */
  function updateAccordionItemStatus(input) {
    const accordionContent = input.closest('.review-item-content');
    if (!accordionContent) return;

    const accordionId = accordionContent.id;
    const dataType = accordionContent.dataset.type;

    if (dataType === 'likert') {
      // Update Likert table row styling
      const row = input.closest('tr');
      if (row) {
        row.classList.remove('row-incomplete');
        row.classList.add('row-complete');
      }

      // Update count display
      const countEl = document.getElementById(`${accordionId}-count`);
      if (countEl) {
        // Count filled fields in this accordion
        const radios = accordionContent.querySelectorAll('input[type="radio"]');
        const fieldNames = new Set();
        radios.forEach(r => fieldNames.add(r.dataset.original));

        let filled = 0;
        fieldNames.forEach(name => {
          if (isFieldFilled(name)) filled++;
        });

        countEl.textContent = `${filled} van ${fieldNames.size} ingevuld`;

        // If all filled, mark accordion as complete
        if (filled === fieldNames.size) {
          markAccordionComplete(accordionId);
        }
      }
    } else {
      // Update field styling
      const fieldWrapper = input.closest('.review-field');
      if (fieldWrapper && input.value && input.value.trim() !== '') {
        fieldWrapper.classList.add('field-complete');
      }

      // Update label display
      const labelEl = document.getElementById(`${accordionId}-label`);
      if (labelEl) {
        const fieldsData = accordionContent.dataset.fields;
        if (fieldsData) {
          const fields = JSON.parse(fieldsData);
          let remaining = 0;
          fields.forEach(name => {
            if (!isFieldFilled(name)) remaining++;
          });

          if (remaining === 0) {
            markAccordionComplete(accordionId);
          } else {
            labelEl.textContent = `${remaining} veld${remaining > 1 ? 'en' : ''} niet ingevuld`;
          }
        }
      }
    }

    // Check if all items are now complete
    checkAllItemsComplete();
  }

  /**
   * Mark an accordion item as complete
   * @param {string} accordionId - The accordion ID
   */
  function markAccordionComplete(accordionId) {
    const accordionContent = document.getElementById(accordionId);
    const accordionItem = accordionContent?.closest('.review-item-accordion');

    if (accordionItem) {
      accordionItem.classList.add('accordion-complete');
      // Collapse the accordion
      accordionContent.classList.remove('open');
      const chevron = document.getElementById(`${accordionId}-chevron`);
      if (chevron) chevron.classList.remove('open');
    }
  }

  /**
   * Check if all initially incomplete items are now complete and update UI
   * Does NOT regenerate the list - items persist permanently
   */
  function checkAllItemsComplete() {
    if (!initialReviewItems || initialReviewItems.length === 0) return;

    // Check current status of all initial items
    let allNowComplete = true;
    initialReviewItems.forEach(item => {
      if (item.type === 'likert') {
        const tableConfig = LIKERT_LABELS[Object.keys(LIKERT_LABELS).find(k =>
          LIKERT_LABELS[k].step === item.step && LIKERT_LABELS[k].label === item.label
        )];
        if (tableConfig) {
          const status = checkLikertTableStatus(tableConfig.fields);
          if (status.incomplete) allNowComplete = false;
        }
      } else {
        item.missingFields.forEach(fieldName => {
          if (!isFieldFilled(fieldName)) allNowComplete = false;
        });
      }
    });

    // Update submit button state
    const submitBtn = document.getElementById('btnConfirmSubmit');
    const checkbox = document.getElementById('confirmIncomplete');
    const confirmContainer = document.querySelector('.review-confirm');
    const headerEl = document.querySelector('.review-incomplete-header, .review-all-complete-header');
    const containerEl = document.querySelector('.review-incomplete, .review-now-complete');

    if (allNowComplete) {
      // All complete - enable submit, hide checkbox
      if (submitBtn) submitBtn.disabled = false;
      if (confirmContainer) confirmContainer.style.display = 'none';
      if (headerEl) {
        headerEl.className = 'review-all-complete-header';
        const h3 = headerEl.querySelector('h3');
        if (h3) h3.textContent = 'Alle secties zijn nu ingevuld!';
        const svg = headerEl.querySelector('svg');
        if (svg) {
          svg.outerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="24" height="24">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
        }
      }
      if (containerEl) {
        containerEl.className = 'review-now-complete';
      }
      const subtitle = document.querySelector('.review-incomplete-subtitle');
      if (subtitle) {
        subtitle.textContent = 'De onderstaande secties waren oorspronkelijk incompleet maar zijn nu ingevuld. U kunt nu verzenden.';
      }
    } else {
      // Still incomplete - require checkbox
      if (submitBtn && checkbox) {
        submitBtn.disabled = !checkbox.checked;
      }
      if (confirmContainer) confirmContainer.style.display = 'block';
    }
  }

  /**
   * Toggle accordion open/close
   * @param {string} accordionId - The accordion content element ID
   */
  function toggleAccordion(accordionId) {
    const content = document.getElementById(accordionId);
    const chevron = document.getElementById(`${accordionId}-chevron`);

    if (content) {
      content.classList.toggle('open');
    }
    if (chevron) {
      chevron.classList.toggle('open');
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
        // Sync contenteditable editor for voorbeeld_organisatie
        if (name === 'voorbeeld_organisatie') {
          const editor = document.getElementById('voorbeeld-organisatie-editor');
          if (editor) editor.textContent = value;
        }
      }
    });

    updateAllSections();
    updateIndexStatus();
    updateAllOptionCardConditionalStatuses();

    // Sync mobile Likert segmented controls with loaded data
    if (typeof window.syncLikertSegments === 'function') {
      window.syncLikertSegments();
    }
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
      showValidationModal(
        'Nog niet compleet',
        'Vul de naam van de CEO/directeur in voordat u het formulier kunt verzenden.',
        {
          linkText: 'Ga naar ondertekenen →',
          linkAction: () => {
            goToStep(13);
            setTimeout(() => ondertekenaar && ondertekenaar.focus(), 100);
          }
        }
      );
      return;
    }

    if (!bevestiging || !bevestiging.checked) {
      showValidationModal(
        'Bevestiging vereist',
        'Bevestig dat de gegevens naar waarheid zijn ingevuld voordat u het formulier kunt verzenden.',
        {
          linkText: 'Ga naar ondertekenen →',
          linkAction: () => goToStep(13)
        }
      );
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

        // Archive the submitted form before clearing
        const orgName = formData.organisatie || session.orgName || 'Onbekende organisatie';
        Storage.addSubmittedForm(formData, orgName);

        // Show success
        currentStep = CONFIG.SUCCESS_STEP;
        showStep(currentStep);

        // Clear saved form data and scroll positions
        Storage.clearFormData();
        clearScrollPositions();
        return;
      }

      // Submit to backend
      const result = await ApiClient.submitSurvey(formData);

      if (result.success) {
        // Archive the submitted form before clearing
        const orgName = formData.organisatie || session.orgName || 'Onbekende organisatie';
        Storage.addSubmittedForm(formData, orgName);

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

        // Clear saved form data and scroll positions
        Storage.clearFormData();
        clearScrollPositions();
      } else {
        throw new Error(result.message || CONSTANTS.ERRORS.SUBMIT_ERROR);
      }
    } catch (e) {
      showErrorModal(
        'Verzenden mislukt',
        CONSTANTS.ERRORS.SUBMIT_ERROR
      );
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
   * Print an archived form by temporarily loading its data
   * @param {string} formId - The ID of the archived form to print
   */
  function printArchivedForm(formId) {
    const archivedForm = Storage.getSubmittedFormById(formId);
    if (!archivedForm) {
      showErrorModal(
        'Niet gevonden',
        'Het formulier kon niet worden gevonden.'
      );
      return;
    }

    // Store current form data to restore after printing
    const currentFormData = getFormData();
    const originalStep = currentStep;

    // Temporarily load the archived form data into the form
    const form = document.getElementById('monitoringForm');
    if (!form) return;

    // Clear current form state
    form.reset();
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove(CONSTANTS.CSS.SELECTED);
    });

    // Load archived data
    const data = archivedForm.data;
    for (const [key, value] of Object.entries(data)) {
      if (key === 'timestamp' || key === 'orgCode' || key === 'orgName') continue;

      const field = form.elements[key];
      if (!field) continue;

      if (field.type === 'checkbox') {
        field.checked = value === 'on' || value === true;
      } else if (field.type === 'radio') {
        const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
        if (radio) {
          radio.checked = true;
          const card = radio.closest('.option-card');
          if (card) card.classList.add(CONSTANTS.CSS.SELECTED);
        }
      } else {
        field.value = value;
      }
    }

    // Show all content steps for printing (not review/success)
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
      const stepNum = parseInt(step.dataset.step, 10);
      if (stepNum <= 13) {
        step.classList.add('active');
      }
    });

    // Hide the modal during print
    const modal = document.getElementById('restartChoiceModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';

    // Trigger browser print dialog
    window.print();

    // Restore original state after print dialog closes
    setTimeout(() => {
      // Hide all steps
      steps.forEach(step => {
        step.classList.remove('active');
      });

      // Restore current form data
      form.reset();
      document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove(CONSTANTS.CSS.SELECTED);
      });

      if (currentFormData) {
        for (const [key, value] of Object.entries(currentFormData)) {
          const field = form.elements[key];
          if (!field) continue;

          if (field.type === 'checkbox') {
            field.checked = value === 'on' || value === true;
          } else if (field.type === 'radio') {
            const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
            if (radio) {
              radio.checked = true;
              const card = radio.closest('.option-card');
              if (card) card.classList.add(CONSTANTS.CSS.SELECTED);
            }
          } else {
            field.value = value;
          }
        }
      }

      // Restore step display
      showStep(originalStep);

      // Show modal again
      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
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

  /**
   * Show the restart choice modal
   * User can choose to continue with existing data or clear and start fresh
   */
  function showRestartChoiceModal() {
    const modal = document.getElementById('restartChoiceModal');
    if (modal) {
      // Populate archived forms list
      populateArchivedFormsList();

      modal.style.display = 'flex';
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Populate the archived forms list in the modal
   */
  function populateArchivedFormsList() {
    const section = document.getElementById('archivedFormsSection');
    const list = document.getElementById('archivedFormsList');
    if (!section || !list) return;

    const forms = Storage.getSubmittedForms();

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

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Hide the restart choice modal
   */
  function hideRestartChoiceModal() {
    const modal = document.getElementById('restartChoiceModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
    // Navigate to step 0 to continue with existing data
    currentStep = 0;
    previousStep = -1;
    reviewVisited = false;
    initialReviewItems = null;
    showStep(0);
    updateIndexStatus();
  }

  /**
   * Show the clear warning modal
   */
  function showClearWarningModal() {
    const restartModal = document.getElementById('restartChoiceModal');
    const warningModal = document.getElementById('clearWarningModal');
    if (restartModal) restartModal.style.display = 'none';
    if (warningModal) warningModal.style.display = 'flex';
  }

  /**
   * Hide the clear warning modal and go back to choice
   */
  function hideClearWarningModal() {
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
  function showValidationModal(title, message, options = {}) {
    const modal = document.getElementById('validationModal');
    const titleEl = document.getElementById('validationModalTitle');
    const textEl = document.getElementById('validationModalText');
    const linkEl = document.getElementById('validationModalLink');

    if (modal && titleEl && textEl) {
      titleEl.textContent = title;
      textEl.textContent = message;

      // Handle optional link
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
  function hideValidationModal() {
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
  function showErrorModal(title, message) {
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
  function hideErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  /**
   * Clear all form data and restart fresh
   */
  function clearFormAndRestart() {
    // Clear form data from storage
    Storage.clearFormData();

    // Clear saved scroll positions
    clearScrollPositions();

    // Reset form fields
    const form = document.getElementById('monitoringForm');
    if (form) {
      form.reset();
    }

    // Clear all option card selections
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove(CONSTANTS.CSS.SELECTED, 'awaiting-conditional', 'conditional-satisfied');
    });

    // Clear all question header states
    document.querySelectorAll('.question-header').forEach(header => {
      header.classList.remove(CONSTANTS.CSS.HAS_VALUE);
    });

    // Hide all conditional fields
    document.querySelectorAll('.conditional').forEach(conditional => {
      conditional.classList.remove(CONSTANTS.CSS.VISIBLE);
    });

    // Hide all comment fields
    document.querySelectorAll('.comments-field').forEach(field => {
      field.classList.remove(CONSTANTS.CSS.VISIBLE);
    });

    // Reset section headers
    document.querySelectorAll('.section-header').forEach(header => {
      header.classList.remove('complete', 'partial');
      const icon = header.querySelector('.status-icon');
      if (icon) icon.textContent = '○';
    });

    // Close modals
    const warningModal = document.getElementById('clearWarningModal');
    if (warningModal) warningModal.style.display = 'none';
    document.body.style.overflow = '';

    // Reset state and go to step 0
    currentStep = 0;
    previousStep = -1;
    reviewVisited = false;
    initialReviewItems = null;
    showStep(0);
    updateIndexStatus();
  }

  /**
   * Initialize mobile drawer functionality
   * Sets up the hamburger menu button and overlay interactions
   */
  function initMobileDrawer() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    const index = document.querySelector('.index');

    if (!menuBtn || !overlay || !index) return;

    // Toggle drawer on menu button click
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMobileDrawer();
    });

    // Close drawer when clicking overlay
    overlay.addEventListener('click', function() {
      closeMobileDrawer();
    });

    // Close drawer when clicking an index item (after navigation)
    index.addEventListener('click', function(e) {
      const indexItem = e.target.closest('.index-item, .index-divider-clickable');
      if (indexItem && indexItem.dataset.action === 'goToStep') {
        // Small delay to let the navigation animation start
        setTimeout(closeMobileDrawer, 150);
      }
    });

    // Close drawer on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && index.classList.contains('mobile-open')) {
        closeMobileDrawer();
      }
    });

    // Update highlighter position when index is scrolled
    index.addEventListener('scroll', function() {
      updateMobileHighlighter();
    }, { passive: true });

    // Handle swipe gestures on mobile
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 50;
      const swipeDistance = touchEndX - touchStartX;

      // Swipe right to open (only from left edge)
      if (swipeDistance > swipeThreshold && touchStartX < 50) {
        openMobileDrawer();
      }

      // Swipe left to close
      if (swipeDistance < -swipeThreshold && index.classList.contains('mobile-open')) {
        closeMobileDrawer();
      }
    }
  }

  /**
   * Toggle mobile drawer open/closed state
   */
  function toggleMobileDrawer() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    const index = document.querySelector('.index');

    if (index.classList.contains('mobile-open')) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  }

  /**
   * Open the mobile drawer
   */
  function openMobileDrawer() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    const index = document.querySelector('.index');

    menuBtn.classList.add('active');
    overlay.classList.add('active');
    index.classList.add('mobile-open');
    document.body.classList.add('mobile-drawer-open');

    // Update mobile highlighter position after drawer opens
    // Small delay to ensure layout is complete
    requestAnimationFrame(updateMobileHighlighter);
  }

  /**
   * Close the mobile drawer
   */
  function closeMobileDrawer() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    const index = document.querySelector('.index');

    menuBtn.classList.remove('active');
    overlay.classList.remove('active');
    index.classList.remove('mobile-open');
    document.body.classList.remove('mobile-drawer-open');
  }

  /**
   * Initialize Flatpickr date picker with custom styling
   */
  function initDatePicker() {
    const datumInput = document.getElementById('datumPicker');
    if (!datumInput || typeof flatpickr === 'undefined') return;

    // Check if there's a saved date value (may be in different formats)
    const savedValue = datumInput.value;
    let defaultDate = 'today';

    if (savedValue) {
      // Try to parse existing value (could be YYYY-MM-DD, DD-MM-YYYY, or other)
      const datePatterns = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})-(\d{2})-(\d{4})$/  // DD-MM-YYYY
      ];

      for (const pattern of datePatterns) {
        const match = savedValue.match(pattern);
        if (match) {
          if (pattern === datePatterns[0]) {
            // YYYY-MM-DD format
            defaultDate = new Date(match[1], match[2] - 1, match[3]);
          } else {
            // DD-MM-YYYY format
            defaultDate = new Date(match[3], match[2] - 1, match[1]);
          }
          break;
        }
      }
    }

    flatpickr(datumInput, {
      locale: 'nl',
      dateFormat: 'd-m-Y',
      altInput: true,
      altFormat: 'j F Y',
      disableMobile: true,
      allowInput: false,
      defaultDate: defaultDate,
      monthSelectorType: 'dropdown',
      animate: true,
      onChange: function(selectedDates, dateStr, instance) {
        // Trigger save when date changes
        if (typeof saveFormData === 'function') {
          saveFormData();
        }
      },
      onReady: function(selectedDates, dateStr, instance) {
        // Add custom class to the container for additional styling
        instance.calendarContainer.classList.add('flatpickr-terracotta');
      }
    });
  }

  /**
   * Initialize mobile-friendly Likert scale controls
   * Creates segmented control UI for each Likert row on mobile
   */
  function initMobileLikert() {
    const MOBILE_BREAKPOINT = 768;
    const LIKERT_OPTIONS = [
      { value: '0', label: 'Niet' },
      { value: '1', label: 'Enigszins' },
      { value: '2', label: 'Grotendeels' },
      { value: '3', label: 'Volledig' }
    ];

    /**
     * Create a segmented control for a Likert row
     */
    function createSegmentedControl(row) {
      // Check if already has segmented control
      if (row.querySelector('.likert-segment')) return;

      const firstCell = row.querySelector('td:first-child');
      if (!firstCell) return;

      // Get the radio button name from the first radio in this row
      const firstRadio = row.querySelector('input[type="radio"]');
      if (!firstRadio) return;

      const radioName = firstRadio.name;

      // Add mobile reset button to the row
      if (!row.querySelector('.likert-row-reset')) {
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'likert-row-reset';
        resetBtn.setAttribute('aria-label', 'Wis selectie');
        resetBtn.innerHTML = '×';
        resetBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          resetLikertRow(row, radioName);
        });
        row.appendChild(resetBtn);
      }

      // Create the segmented control container
      const segment = document.createElement('div');
      segment.className = 'likert-segment';
      segment.setAttribute('role', 'radiogroup');
      segment.setAttribute('aria-label', 'Selecteer uw antwoord');

      // Create sliding indicator
      const slider = document.createElement('div');
      slider.className = 'likert-segment-slider';
      segment.appendChild(slider);

      // Create options
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

        // Check if this option is already selected
        const radio = row.querySelector(`input[name="${radioName}"][value="${option.value}"]`);
        if (radio && radio.checked) {
          btn.classList.add('selected');
          btn.setAttribute('aria-checked', 'true');
          // Position slider on selected option
          segment.classList.add('has-selection');
          slider.style.transform = `translateX(${index * 100}%)`;
        }

        // Handle click
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          selectLikertOption(this, radioName, option.value, row, index);
        });
      });

      // Setup touch sliding interaction
      setupTouchSliding(segment, radioName, row);

      // Insert after the first cell (statement text)
      firstCell.after(segment);
    }

    /**
     * Setup touch sliding interaction for a segment
     */
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
        // Clamp to valid range
        return Math.max(0, Math.min(options.length - 1, index));
      }

      function updateSliderPosition(index, animate = true) {
        if (index === currentIndex) return;
        currentIndex = index;

        segment.classList.add('has-selection');
        slider.classList.toggle('no-transition', !animate);
        slider.style.transform = `translateX(${index * 100}%)`;

        // Update visual hover state
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

        // Remove hover states
        options.forEach(opt => opt.classList.remove('hover'));

        // Select the option where finger lifted
        if (currentIndex >= 0 && currentIndex < options.length) {
          const option = options[currentIndex];
          selectLikertOption(option, radioName, option.dataset.value, row, currentIndex);
        }
      }, { passive: true });

      // Cancel on touch leaving the element
      segment.addEventListener('touchcancel', function() {
        isDragging = false;
        segment.classList.remove('is-dragging');
        options.forEach(opt => opt.classList.remove('hover'));
      }, { passive: true });
    }

    /**
     * Select a Likert option via segmented control
     */
    function selectLikertOption(button, radioName, value, row, index) {
      // Update visual state
      const segment = button.closest('.likert-segment');
      const slider = segment.querySelector('.likert-segment-slider');

      segment.querySelectorAll('.likert-segment-option').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
      });
      button.classList.add('selected');
      button.setAttribute('aria-checked', 'true');

      // Animate slider to selected position
      if (slider && index !== undefined) {
        segment.classList.add('has-selection');
        slider.classList.remove('no-transition');
        slider.style.transform = `translateX(${index * 100}%)`;
      }

      // Trigger the actual radio button
      const radio = document.querySelector(`input[name="${radioName}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
        // Dispatch change event to trigger existing handlers
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    /**
     * Reset a single Likert row
     */
    function resetLikertRow(row, radioName) {
      // Uncheck all radio buttons for this row
      row.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
      });

      // Remove answered state from row
      row.classList.remove(CONSTANTS.CSS.ANSWERED);
      row.classList.remove('just-answered');

      // Reset segmented control
      const segment = row.querySelector('.likert-segment');
      if (segment) {
        const slider = segment.querySelector('.likert-segment-slider');
        segment.classList.remove('has-selection');
        segment.querySelectorAll('.likert-segment-option').forEach(btn => {
          btn.classList.remove('selected');
          btn.setAttribute('aria-checked', 'false');
        });
      }

      // Check if table still has any values
      const table = row.closest('.likert-table');
      if (table) {
        const hasAnsweredRows = table.querySelectorAll('tbody tr.answered').length > 0;
        if (!hasAnsweredRows && table.id) {
          const header = document.getElementById(`header-${table.id}`);
          if (header) header.classList.remove(CONSTANTS.CSS.HAS_VALUE);
        }
        // Remove missing arrows indicator
        table.classList.remove('has-missing');
      }

      // Trigger updates
      updateAllSections();
      updateIndexStatus();
      saveFormData();
    }

    /**
     * Sync segmented controls with radio button state
     * (Called when loading saved data or resetting)
     */
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

        // Position slider
        if (slider) {
          if (selectedIndex >= 0) {
            segment.classList.add('has-selection');
            slider.classList.add('no-transition');
            slider.style.transform = `translateX(${selectedIndex * 100}%)`;
            // Remove no-transition after a frame
            requestAnimationFrame(() => slider.classList.remove('no-transition'));
          } else {
            segment.classList.remove('has-selection');
          }
        }
      });
    }

    /**
     * Initialize or remove segmented controls based on screen size
     */
    function handleResponsive() {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      document.querySelectorAll('.likert-table tbody tr').forEach(row => {
        if (isMobile) {
          createSegmentedControl(row);
        }
        // Note: We keep the controls in DOM even on desktop (CSS hides them)
        // This maintains state and avoids recreation on resize
      });

      if (isMobile) {
        syncSegmentedControls();
      }
    }

    // Initial setup
    handleResponsive();

    // Handle window resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResponsive, 250);
    });

    // Expose sync function for external use (e.g., after data load)
    window.syncLikertSegments = syncSegmentedControls;
  }

})();
