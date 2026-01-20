/**
 * Survey module for Monitoring Cultureel Talent naar de Top
 * Handles form navigation, validation, and submission
 *
 * Dependencies: config.js, constants.js, storage.js, api.js
 */

(function() {
  'use strict';

  let currentStep = 0;
  let session = null;

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

      case 'logout':
        logout();
        break;

      case 'printForm':
        printForm();
        break;
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

    // Deselect all cards in the same group
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
      const parentCard = radio.closest('.option-card');
      if (parentCard) {
        parentCard.classList.remove(CONSTANTS.CSS.SELECTED);
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
      toggleConditional(conditionalId, value === CONSTANTS.ANSWERS.YES);
    }

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
   */
  function initProgress() {
    const dotsBottom = document.getElementById('progressDots');
    const dotsTop = document.getElementById('progressDotsTop');

    [dotsBottom, dotsTop].forEach(dots => {
      if (!dots) return;
      dots.innerHTML = '';
      for (let i = 0; i < CONFIG.TOTAL_STEPS; i++) {
        const span = document.createElement('span');
        if (i === 0) span.classList.add(CONSTANTS.CSS.ACTIVE);
        dots.appendChild(span);
      }
    });
  }

  /**
   * Update progress dots display
   */
  function updateProgress() {
    const dots = document.querySelectorAll('.progress-dots span');
    dots.forEach((dot, i) => {
      dot.classList.remove(CONSTANTS.CSS.ACTIVE, CONSTANTS.CSS.DONE);
      if (i < currentStep) dot.classList.add(CONSTANTS.CSS.DONE);
      if (i === currentStep) dot.classList.add(CONSTANTS.CSS.ACTIVE);
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

      fields.forEach(fieldName => {
        const input = document.querySelector(`[name="${fieldName}"]`);
        if (!input) return;

        if (input.type === 'radio') {
          const checked = document.querySelector(`[name="${fieldName}"]:checked`);
          if (checked) filled++;
        } else if (input.type === 'checkbox') {
          if (input.checked) filled++;
        } else if (input.value && input.value.trim() !== '') {
          filled++;
        }
      });

      const indexItem = document.querySelector(`.index-item[data-step="${step}"]`);
      if (!indexItem) return;

      const statusEl = indexItem.querySelector('.status');
      indexItem.classList.remove(CONSTANTS.CSS.COMPLETE, CONSTANTS.CSS.PARTIAL);

      if (filled === fields.length) {
        indexItem.classList.add(CONSTANTS.CSS.COMPLETE);
        statusEl.innerHTML = CONSTANTS.UI.STATUS_COMPLETE;
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
   * Update section header completion status
   * @param {string} sectionName - Name of the section to update
   */
  function updateSectionStatus(sectionName) {
    const fields = CONFIG.SECTION_FIELDS[sectionName];
    if (!fields) return;

    const header = document.querySelector(`[data-section="${sectionName}"]`);
    if (!header) return;

    let filled = 0;
    const total = fields.length;

    fields.forEach(fieldName => {
      const input = document.querySelector(`[name="${fieldName}"]`);
      if (!input) return;

      if (input.type === 'radio') {
        const checked = document.querySelector(`[name="${fieldName}"]:checked`);
        if (checked) filled++;
      } else if (input.value && input.value.trim() !== '') {
        filled++;
      }
    });

    const icon = header.querySelector('.status-icon');
    header.classList.remove(CONSTANTS.CSS.COMPLETE, CONSTANTS.CSS.PARTIAL);

    if (filled === total) {
      header.classList.add(CONSTANTS.CSS.COMPLETE);
      icon.innerHTML = CONSTANTS.UI.STATUS_COMPLETE;
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
    document.querySelectorAll('.step').forEach(s => s.classList.remove(CONSTANTS.CSS.ACTIVE));
    const stepEl = document.querySelector(`.step[data-step="${step}"]`);
    if (stepEl) stepEl.classList.add(CONSTANTS.CSS.ACTIVE);

    // Get both sets of navigation buttons (top and bottom)
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const navButtons = document.getElementById('navButtons');
    const btnPrevTop = document.getElementById('btnPrevTop');
    const btnNextTop = document.getElementById('btnNextTop');
    const navButtonsTop = document.getElementById('navButtonsTop');
    const progressDotsTop = document.getElementById('progressDotsTop');

    // Update both prev buttons
    const showPrev = step > 0 && step < CONFIG.TOTAL_STEPS;
    if (btnPrev) btnPrev.style.display = showPrev ? 'block' : 'none';
    if (btnPrevTop) btnPrevTop.style.display = showPrev ? 'block' : 'none';

    // Update both next buttons and nav containers
    if (step === CONFIG.TOTAL_STEPS - 1) {
      // Last step before submit
      if (btnNext) btnNext.textContent = CONSTANTS.UI.BUTTON_SUBMIT;
      if (btnNextTop) btnNextTop.textContent = CONSTANTS.UI.BUTTON_SUBMIT;
    } else if (step === CONFIG.TOTAL_STEPS) {
      // Success step - hide all navigation and progress dots
      if (navButtons) navButtons.style.display = 'none';
      if (navButtonsTop) navButtonsTop.style.display = 'none';
      if (progressDotsTop) progressDotsTop.style.display = 'none';
    } else {
      // Normal steps
      if (btnNext) btnNext.textContent = CONSTANTS.UI.BUTTON_NEXT;
      if (btnNextTop) btnNextTop.textContent = CONSTANTS.UI.BUTTON_NEXT;
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
   * Go to next step or submit if on last step
   */
  function nextStep() {
    if (currentStep === CONFIG.TOTAL_STEPS - 1) {
      submitForm();
    } else {
      currentStep++;
      showStep(currentStep);
    }
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
   * Setup input change listeners for real-time status updates
   */
  function setupInputListeners() {
    document.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        updateAllSections();
        updateIndexStatus();
      });
      input.addEventListener('change', () => {
        updateAllSections();
        updateIndexStatus();
      });
    });

    // Likert scale row highlighting
    document.querySelectorAll('.likert-table input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function() {
        this.closest('tr').classList.add(CONSTANTS.CSS.ANSWERED);
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
          if (conditionalId && value === CONSTANTS.ANSWERS.YES) {
            toggleConditional(conditionalId, true);
          }

          // Likert table row highlighting
          const row = radio.closest('tr');
          if (row) row.classList.add(CONSTANTS.CSS.ANSWERED);
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
        currentStep = CONFIG.TOTAL_STEPS;
        showStep(currentStep);

        // Clear saved form data
        Storage.clearFormData();
        return;
      }

      // Submit to backend
      const result = await ApiClient.submitSurvey(formData);

      if (result.success) {
        currentStep = CONFIG.TOTAL_STEPS;
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
