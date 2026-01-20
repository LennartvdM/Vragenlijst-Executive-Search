/**
 * Survey module for Monitoring Cultureel Talent naar de Top
 * Handles form navigation, validation, and submission
 */

(function() {
  'use strict';

  let currentStep = 0;
  let session = null;

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    session = getSession();
    if (!session || !session.orgCode) {
      window.location.href = 'index.html';
      return;
    }

    // Initialize UI
    initializeOrganizationInfo();
    initProgress();
    loadSavedFormData();
    setupAutoSave();
    setupInputListeners();
    showStep(0);
  });

  /**
   * Get session from localStorage
   */
  function getSession() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
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
   * Initialize progress dots
   */
  function initProgress() {
    const dots = document.getElementById('progressDots');
    if (!dots) return;

    dots.innerHTML = '';
    for (let i = 0; i < CONFIG.TOTAL_STEPS; i++) {
      const span = document.createElement('span');
      if (i === 0) span.classList.add('active');
      dots.appendChild(span);
    }
  }

  /**
   * Update progress dots display
   */
  function updateProgress() {
    const dots = document.querySelectorAll('.progress-dots span');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i < currentStep) dot.classList.add('done');
      if (i === currentStep) dot.classList.add('active');
    });
  }

  /**
   * Update sidebar index highlighting
   */
  function updateIndex() {
    document.querySelectorAll('.index-item').forEach(item => {
      const step = parseInt(item.dataset.step);
      item.classList.toggle('active', step === currentStep);
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
      indexItem.classList.remove('complete', 'partial');

      if (filled === fields.length) {
        indexItem.classList.add('complete');
        statusEl.innerHTML = '✓';
      } else if (filled > 0) {
        indexItem.classList.add('partial');
        statusEl.innerHTML = `${filled}/${fields.length}`;
      } else {
        statusEl.innerHTML = '○';
      }
    });
  }

  /**
   * Update section header completion status
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
    header.classList.remove('complete', 'partial');

    if (filled === total) {
      header.classList.add('complete');
      icon.innerHTML = '✓';
    } else if (filled > 0) {
      header.classList.add('partial');
      icon.innerHTML = `${filled}/${total}`;
    } else {
      icon.innerHTML = '○';
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
   */
  function showStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepEl = document.querySelector(`.step[data-step="${step}"]`);
    if (stepEl) stepEl.classList.add('active');

    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const navButtons = document.getElementById('navButtons');

    if (btnPrev) {
      btnPrev.style.display = step > 0 && step < CONFIG.TOTAL_STEPS ? 'block' : 'none';
    }

    if (btnNext) {
      if (step === CONFIG.TOTAL_STEPS - 1) {
        btnNext.textContent = 'Verzenden';
      } else if (step === CONFIG.TOTAL_STEPS) {
        if (navButtons) navButtons.style.display = 'none';
      } else {
        btnNext.textContent = 'Volgende';
      }
    }

    updateProgress();
    updateIndex();
  }

  /**
   * Navigate to a specific step
   */
  window.goToStep = function(step) {
    currentStep = step;
    showStep(step);
  };

  /**
   * Go to next step
   */
  window.nextStep = function() {
    if (currentStep === CONFIG.TOTAL_STEPS - 1) {
      submitForm();
    } else {
      currentStep++;
      showStep(currentStep);
    }
  };

  /**
   * Go to previous step
   */
  window.prevStep = function() {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  };

  /**
   * Select an option card
   */
  window.selectOption = function(el, name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.closest('.option-card').classList.remove('selected');
    });
    el.classList.add('selected');
    el.querySelector('input').checked = true;

    const header = document.getElementById(`header-${name}`);
    if (header) header.classList.add('has-value');

    if (name === 'streefcijfer') {
      toggleConditional('streefcijfer-details', value === 'Ja');
    }

    updateAllSections();
    updateIndexStatus();
    saveFormData();
  };

  /**
   * Reset a radio button group
   */
  window.resetGroup = function(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.checked = false;
      input.closest('.option-card').classList.remove('selected');
    });

    const header = document.getElementById(`header-${name}`);
    if (header) header.classList.remove('has-value');

    const conditionalMap = {
      'streefcijfer': 'streefcijfer-details',
      'heeft_rvb': 'rvb-details',
      'heeft_rvc': 'rvc-details',
      'heeft_rvt': 'rvt-details'
    };

    if (conditionalMap[name]) {
      toggleConditional(conditionalMap[name], false);
    }

    updateAllSections();
    updateIndexStatus();
    saveFormData();
  };

  /**
   * Toggle conditional field visibility
   */
  window.toggleConditional = function(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show', show);
  };

  /**
   * Toggle comments field visibility for a specific step
   */
  window.toggleComments = function(step) {
    const field = document.getElementById(`comments-field-${step}`);
    if (field) {
      field.classList.toggle('show');
      // Focus the textarea when opening
      if (field.classList.contains('show')) {
        const textarea = field.querySelector('textarea');
        if (textarea) textarea.focus();
      }
    }
  };

  /**
   * Setup input change listeners
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
        this.closest('tr').classList.add('answered');
        updateIndexStatus();
      });
    });
  }

  /**
   * Setup auto-save functionality
   */
  function setupAutoSave() {
    let saveTimeout;
    document.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveFormData, 500);
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
    localStorage.setItem(CONFIG.STORAGE_KEYS.FORM_DATA, JSON.stringify(data));
  }

  /**
   * Load saved form data from localStorage
   */
  function loadSavedFormData() {
    const savedData = localStorage.getItem(CONFIG.STORAGE_KEYS.FORM_DATA);
    if (!savedData) return;

    const data = JSON.parse(savedData);

    Object.entries(data).forEach(([name, value]) => {
      const input = document.querySelector(`[name="${name}"]`);
      if (!input) return;

      if (input.type === 'radio') {
        const radio = document.querySelector(`[name="${name}"][value="${value}"]`);
        if (radio) {
          radio.checked = true;
          const card = radio.closest('.option-card');
          if (card) card.classList.add('selected');

          const header = document.getElementById(`header-${name}`);
          if (header) header.classList.add('has-value');

          // Handle conditional fields
          if (name === 'streefcijfer' && value === 'Ja') {
            toggleConditional('streefcijfer-details', true);
          }
          if (name === 'heeft_rvb' && value === 'Ja') {
            toggleConditional('rvb-details', true);
          }
          if (name === 'heeft_rvc' && value === 'Ja') {
            toggleConditional('rvc-details', true);
          }
          if (name === 'heeft_rvt' && value === 'Ja') {
            toggleConditional('rvt-details', true);
          }

          // Likert table row highlighting
          const row = radio.closest('tr');
          if (row) row.classList.add('answered');
        }
      } else if (input.type === 'checkbox') {
        input.checked = value === 'on' || value === true;
      } else {
        input.value = value;
        // Show comments field if it has content
        if (name.startsWith('opmerkingen_stap_') && value.trim() !== '') {
          const step = name.replace('opmerkingen_stap_', '');
          const field = document.getElementById(`comments-field-${step}`);
          if (field) field.classList.add('show');
        }
      }
    });

    updateAllSections();
    updateIndexStatus();
  }

  /**
   * Get all form data
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
   * Submit the form
   */
  async function submitForm() {
    const btn = document.getElementById('btnNext');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Verzenden...';

    try {
      const formData = getFormData();

      // If no script URL configured, show demo success
      if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
        console.warn('No Google Apps Script URL configured. Demo submission.');
        console.log('Form data:', formData);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success
        currentStep = CONFIG.TOTAL_STEPS;
        showStep(currentStep);

        // Clear saved form data
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FORM_DATA);
        return;
      }

      // Submit to Google Apps Script
      const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: 'submitSurvey',
          data: formData
        })
      });

      const result = await response.json();

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
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FORM_DATA);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (e) {
      console.error('Submit error:', e);
      alert('Er ging iets mis bij het verzenden. Probeer het opnieuw.');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  /**
   * Logout and return to login page
   */
  window.logout = function() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.FORM_DATA);
    window.location.href = 'index.html';
  };

})();
