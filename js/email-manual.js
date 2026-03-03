/**
 * Manual Email Sender — Monitoring Cultureel Talent naar de Top 2026
 *
 * Lets the client send survey invitation emails one by one from their own
 * mail client (Outlook, Gmail, etc.). No DNS changes required — emails are
 * sent from the client's own domain with perfect deliverability.
 *
 * Shares localStorage keys with email-admin.js:
 *   cttt_email_recipients — recipient list
 *   cttt_email_settings   — template settings
 *
 * Depends on: js/email-template.js (window.EmailTemplate)
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const STORAGE_KEYS = {
    RECIPIENTS: 'cttt_email_recipients',
    SETTINGS: 'cttt_email_settings'
  };

  const DEFAULT_SETTINGS = {
    subject: 'Monitoring Cultureel Talent naar de Top 2026',
    surveyUrl: 'https://monitorcultuur.nl/',
    previewUrl: '',
    deadline: '',
    senderName: 'Commissie Monitoring Talent naar de Top',
    contactPerson: '',
    contactEmail: '',
    heading: 'Monitoring Cultureel Talent naar de Top 2026',
    introText: 'Geachte {naam}, wij vragen u de monitoring in te vullen v\u00f3\u00f3r {deadline}.',
    codeLabel: 'Uw toegangscode',
    ctaText: 'Ga naar de vragenlijst \u2192',
    previewLinkText: 'Bekijk inkijkexemplaar \u2192',
    praktischHeading: 'Praktisch',
    checklistItems: 'Duurt 20\u201330 minuten, u kunt tussendoor stoppen\nU kunt meerdere keren verzenden, de laatste versie telt\nHoud uw personeelscijfers bij de hand\nVoortgang gekoppeld aan uw apparaat, niet aan uw code',
    privacyText: 'Uw antwoorden worden lokaal in uw browser opgeslagen. Op een ander apparaat begint u opnieuw. Wist u uw browsergegevens, dan zijn conceptantwoorden weg.',
    contactText: 'Vragen? {contactPerson} via {contactEmail}',
    closingText: 'Met vriendelijke groet,',
    footerText: 'U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitoring Cultureel Talent naar de Top 2026.'
  };

  const ALL_SETTING_FIELDS = [
    'subject', 'surveyUrl', 'previewUrl', 'deadline',
    'senderName', 'contactPerson', 'contactEmail'
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let recipients = [];
  let settings = { ...DEFAULT_SETTINGS };
  let selectedId = null;
  let currentFilter = 'all'; // 'all', 'pending', 'sent'
  let pendingConfirmAction = null;

  // ---------------------------------------------------------------------------
  // localStorage
  // ---------------------------------------------------------------------------

  function saveRecipients() {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(recipients));
    } catch (e) {
      console.warn('[ManualSender] Failed to save recipients:', e);
    }
  }

  function loadRecipients() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPIENTS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('[ManualSender] Failed to save settings:', e);
    }
  }

  function loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  }

  // ---------------------------------------------------------------------------
  // Settings UI sync
  // ---------------------------------------------------------------------------

  function syncSettingsToUI() {
    for (const key of ALL_SETTING_FIELDS) {
      const el = document.getElementById('setting-' + key);
      if (el) el.value = settings[key] || '';
    }
  }

  function syncSettingsFromUI() {
    for (const key of ALL_SETTING_FIELDS) {
      const el = document.getElementById('setting-' + key);
      if (el) settings[key] = el.value;
    }
    saveSettings();
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  function getVisibleRecipients() {
    return recipients.filter(r => {
      if (r.isExample) return false;
      if (!r.email || !r.name) return false;
      if (currentFilter === 'pending') return r.status !== 'sent';
      if (currentFilter === 'sent') return r.status === 'sent';
      return true;
    });
  }

  // ---------------------------------------------------------------------------
  // Rendering — recipient list
  // ---------------------------------------------------------------------------

  function renderList() {
    const container = document.getElementById('recipientList');
    const emptyState = document.getElementById('emptyList');
    const visible = getVisibleRecipients();

    if (visible.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = '';
      return;
    }

    emptyState.style.display = 'none';

    // Sort: unsent first, then sent
    const sorted = [...visible].sort((a, b) => {
      if (a.status === 'sent' && b.status !== 'sent') return 1;
      if (a.status !== 'sent' && b.status === 'sent') return -1;
      return 0;
    });

    container.innerHTML = sorted.map(r => {
      const isActive = r.id === selectedId;
      const isSent = r.status === 'sent';
      const classes = ['em-recipient'];
      if (isActive) classes.push('active');
      if (isSent) classes.push('sent');

      return `<div class="${classes.join(' ')}" data-id="${r.id}" data-action="selectRecipient">
        <div class="em-status-dot ${isSent ? 'sent' : 'pending'}"></div>
        <div class="em-recipient-info">
          <div class="em-recipient-name">${esc(r.name)}</div>
          <div class="em-recipient-email">${esc(r.email)}</div>
        </div>
        <span class="em-recipient-code">${esc(r.code)}</span>
        <div class="em-recipient-check">
          <input type="checkbox" ${isSent ? 'checked' : ''} data-action="toggleSent" data-id="${r.id}" title="${isSent ? 'Markeer als niet verstuurd' : 'Markeer als verstuurd'}">
        </div>
      </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Rendering — progress
  // ---------------------------------------------------------------------------

  function updateProgress() {
    const total = recipients.filter(r => !r.isExample && r.email && r.name).length;
    const sent = recipients.filter(r => !r.isExample && r.email && r.name && r.status === 'sent').length;
    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressText').textContent = `${sent} van ${total} verstuurd`;
    document.getElementById('recipientCount').textContent = total;
  }

  // ---------------------------------------------------------------------------
  // Rendering — preview
  // ---------------------------------------------------------------------------

  function updatePreview() {
    const emptyPreview = document.getElementById('emptyPreview');
    const previewWrap = document.getElementById('previewWrap');
    const actionBar = document.getElementById('actionBar');
    const previewTitle = document.getElementById('previewTitle');
    const iframe = document.getElementById('emailPreview');

    const recipient = recipients.find(r => r.id === selectedId);
    if (!recipient) {
      emptyPreview.style.display = '';
      previewWrap.style.display = 'none';
      actionBar.style.display = 'none';
      previewTitle.textContent = 'E-mailvoorbeeld';
      return;
    }

    emptyPreview.style.display = 'none';
    previewWrap.style.display = '';
    actionBar.style.display = '';
    previewTitle.textContent = recipient.name || recipient.email;

    // Generate HTML email using shared template
    const html = window.EmailTemplate.buildEmailHtml(recipient, settings);
    iframe.srcdoc = html;
  }

  // ---------------------------------------------------------------------------
  // .eml file download — opens as draft in Outlook / Thunderbird / Apple Mail
  // ---------------------------------------------------------------------------

  function downloadEml() {
    const recipient = recipients.find(r => r.id === selectedId);
    if (!recipient) return;

    // Ensure latest settings are captured (debounce may not have fired)
    syncSettingsFromUI();

    // Warn if survey URL is empty — links won't work
    if (!settings.surveyUrl) {
      showToast('Let op: geen URL ingesteld — links in de e-mail werken niet. Stel de URL in bij Instellingen.', 'error');
      return;
    }

    const emlContent = window.EmailTemplate.buildEml(recipient, settings);
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    // Filename: organisatie-naam.eml (sanitized)
    const safeName = (recipient.name || recipient.email || 'email')
      .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 50);
    a.download = safeName + '.eml';
    a.click();
    URL.revokeObjectURL(url);

    showToast('E-mail gedownload — dubbelklik om te openen in Outlook', 'success');
  }

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------

  function copyEmailHtml() {
    const recipient = recipients.find(r => r.id === selectedId);
    if (!recipient) return;

    const html = window.EmailTemplate.buildEmailHtml(recipient, settings);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(() => {
        showToast('HTML gekopieerd naar klembord', 'success');
      }).catch(() => {
        fallbackCopy(html);
      });
    } else {
      fallbackCopy(html);
    }
  }

  function copyRichText() {
    const recipient = recipients.find(r => r.id === selectedId);
    if (!recipient) return;

    const html = window.EmailTemplate.buildEmailHtml(recipient, settings);

    // Try clipboard API with HTML mime type for rich paste
    if (navigator.clipboard && navigator.clipboard.write) {
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      navigator.clipboard.write([item]).then(() => {
        showToast('Opgemaakte e-mail gekopieerd — plak in uw mailprogramma', 'success');
      }).catch(() => {
        // Fallback: copy plain HTML
        fallbackCopy(html);
        showToast('HTML-code gekopieerd (plak in HTML-modus van uw mailprogramma)', 'info');
      });
    } else {
      fallbackCopy(html);
      showToast('HTML-code gekopieerd (plak in HTML-modus van uw mailprogramma)', 'info');
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Gekopieerd naar klembord', 'success');
    } catch {
      showToast('Kopiëren mislukt — selecteer de tekst handmatig', 'error');
    }
    document.body.removeChild(textarea);
  }

  // ---------------------------------------------------------------------------
  // CSV import / export (same logic as email-admin.js)
  // ---------------------------------------------------------------------------

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const results = [];
    let skippedHeader = false;

    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 3) continue;

      if (!skippedHeader) {
        const firstLower = parts[0].toLowerCase();
        if (firstLower === 'email' || firstLower === 'e-mail' || firstLower === 'e-mailadres' || firstLower === 'emailadres') {
          skippedHeader = true;
          continue;
        }
        skippedHeader = true;
      }

      const email = parts[0];
      const name = parts[1];
      const code = parts[2];
      if (email && name && code) {
        results.push({ email, name, code });
      }
    }

    return results;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function handleCSVImport(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const parsed = parseCSV(e.target.result);
      if (parsed.length === 0) {
        showToast('Geen geldige rijen gevonden. Verwacht: email, naam, code', 'error');
        return;
      }

      let added = 0;
      let updated = 0;
      let skipped = 0;
      for (const row of parsed) {
        const codeUpper = row.code.trim().toUpperCase();

        // Update pre-populated row by code
        const existingByCode = recipients.find(r => r.code === codeUpper && !r.isExample);
        if (existingByCode && !existingByCode.email) {
          existingByCode.email = row.email.trim();
          existingByCode.name = row.name.trim() || existingByCode.name;
          updated++;
          continue;
        }

        // Check duplicate email
        const isDuplicate = row.email && recipients.some(r => r.email && r.email.toLowerCase() === row.email.toLowerCase());
        if (isDuplicate) {
          skipped++;
          continue;
        }

        recipients.push({
          id: generateId(),
          email: row.email.trim(),
          name: row.name.trim(),
          code: codeUpper,
          status: 'pending',
          selected: false,
          error: null,
          isExample: false
        });
        added++;
      }

      saveRecipients();
      renderList();
      updateProgress();

      const parts = [];
      if (added > 0) parts.push(`${added} ontvanger${added !== 1 ? 's' : ''} toegevoegd`);
      if (updated > 0) parts.push(`${updated} bestaande code${updated !== 1 ? 's' : ''} bijgewerkt`);
      if (skipped > 0) parts.push(`${skipped} duplica${skipped !== 1 ? 'ten' : 'at'} overgeslagen`);
      showToast(parts.join(', ') || 'Geen wijzigingen', parts.length > 0 ? 'success' : 'info');
    };
    reader.readAsText(file);
  }

  function exportCSV() {
    const exportable = recipients.filter(r => !r.isExample);
    if (exportable.length === 0) {
      showToast('Geen ontvangers om te exporteren', 'error');
      return;
    }

    const header = 'email,naam,code,status';
    const rows = exportable.map(r =>
      `"${r.email || ''}","${r.name || ''}","${r.code}","${r.status}"`
    );
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-ontvangers.csv';
    a.click();
    URL.revokeObjectURL(url);

    showToast('CSV ge\u00EBxporteerd', 'success');
  }

  // ---------------------------------------------------------------------------
  // Toggle sent status
  // ---------------------------------------------------------------------------

  function toggleSent(id) {
    const r = recipients.find(r => r.id === id);
    if (!r) return;

    r.status = r.status === 'sent' ? 'pending' : 'sent';
    saveRecipients();
    renderList();
    updateProgress();
  }

  // ---------------------------------------------------------------------------
  // Select recipient
  // ---------------------------------------------------------------------------

  function selectRecipient(id) {
    selectedId = id;
    renderList();
    updatePreview();
  }

  // ---------------------------------------------------------------------------
  // Next unsent
  // ---------------------------------------------------------------------------

  function selectNextUnsent() {
    const unsent = recipients.filter(r =>
      !r.isExample && r.email && r.name && r.status !== 'sent'
    );

    if (unsent.length === 0) {
      showToast('Alle ontvangers zijn verstuurd!', 'success');
      return;
    }

    // Find next unsent after current selection
    if (selectedId) {
      const currentIdx = unsent.findIndex(r => r.id === selectedId);
      if (currentIdx >= 0 && currentIdx < unsent.length - 1) {
        selectRecipient(unsent[currentIdx + 1].id);
        scrollToRecipient(unsent[currentIdx + 1].id);
        return;
      }
    }

    // Default to first unsent
    selectRecipient(unsent[0].id);
    scrollToRecipient(unsent[0].id);
  }

  function scrollToRecipient(id) {
    const el = document.querySelector(`.em-recipient[data-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ---------------------------------------------------------------------------
  // Toasts
  // ---------------------------------------------------------------------------

  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `ea-toast ea-toast-${type || 'info'}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }

  // ---------------------------------------------------------------------------
  // Confirm modal
  // ---------------------------------------------------------------------------

  function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    pendingConfirmAction = onConfirm;
    document.getElementById('confirmModal').style.display = '';
  }

  function hideConfirm() {
    document.getElementById('confirmModal').style.display = 'none';
    pendingConfirmAction = null;
  }

  // ---------------------------------------------------------------------------
  // Section toggle (reuse pattern from email-admin)
  // ---------------------------------------------------------------------------

  function toggleSection(target) {
    const header = document.querySelector(`[data-target="${target}"]`);
    const body = document.getElementById(target);
    if (!header || !body) return;

    header.classList.toggle('collapsed');
    body.classList.toggle('collapsed');
  }

  // ---------------------------------------------------------------------------
  // Filter buttons
  // ---------------------------------------------------------------------------

  function setFilter(filter) {
    currentFilter = filter;

    // Update button states
    document.querySelectorAll('.em-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const actionMap = { all: 'filterAll', pending: 'filterPending', sent: 'filterSent' };
    const activeBtn = document.querySelector(`[data-action="${actionMap[filter]}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    renderList();
  }

  // ---------------------------------------------------------------------------
  // HTML escape
  // ---------------------------------------------------------------------------

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str || '';
    return el.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Action dispatcher
  // ---------------------------------------------------------------------------

  function handleAction(action, target) {
    switch (action) {
      case 'selectRecipient': {
        const row = target.closest('.em-recipient');
        if (row) selectRecipient(row.dataset.id);
        break;
      }
      case 'toggleSent': {
        const id = target.dataset.id;
        if (id) {
          // Prevent the click from also selecting the recipient
          toggleSent(id);
        }
        break;
      }
      case 'downloadEml':
        downloadEml();
        break;
      case 'nextUnsent':
        selectNextUnsent();
        break;
      case 'copyHtml':
        copyEmailHtml();
        break;
      case 'copyRichText':
        copyRichText();
        break;
      case 'exportCsv':
        exportCSV();
        break;
      case 'filterAll':
        setFilter('all');
        break;
      case 'filterPending':
        setFilter('pending');
        break;
      case 'filterSent':
        setFilter('sent');
        break;
      case 'toggleSection': {
        const sectionTarget = target.closest('[data-target]');
        if (sectionTarget) toggleSection(sectionTarget.dataset.target);
        break;
      }
      case 'proceedConfirm':
        if (pendingConfirmAction) pendingConfirmAction();
        hideConfirm();
        break;
      case 'cancelConfirm':
        hideConfirm();
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  function init() {
    // Load data from shared localStorage
    recipients = loadRecipients();
    settings = loadSettings();

    // Sync settings to UI
    syncSettingsToUI();

    // Initial render
    renderList();
    updateProgress();

    // Click delegation
    document.addEventListener('click', function (e) {
      // Handle checkbox clicks specially to prevent bubbling to selectRecipient
      const checkbox = e.target.closest('input[type="checkbox"][data-action="toggleSent"]');
      if (checkbox) {
        e.stopPropagation();
        handleAction('toggleSent', checkbox);
        return;
      }

      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        e.preventDefault();
        handleAction(actionEl.dataset.action, actionEl);
      }
    });

    // Settings input change — debounced save
    let settingsTimer = null;
    const settingsInputs = document.querySelectorAll('#settingsBody input, #settingsBody textarea');
    settingsInputs.forEach(input => {
      input.addEventListener('input', function () {
        clearTimeout(settingsTimer);
        settingsTimer = setTimeout(() => {
          syncSettingsFromUI();
          updatePreview();
        }, 400);
      });
    });

    // CSV import
    document.getElementById('csvImport').addEventListener('change', function (e) {
      if (e.target.files.length > 0) {
        handleCSVImport(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Keyboard: Escape to close modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideConfirm();
      }
    });

    // Modal backdrop click
    document.getElementById('confirmModal').addEventListener('click', function (e) {
      if (e.target === this) hideConfirm();
    });

    // Auto-select first unsent if there are recipients
    const firstUnsent = recipients.find(r =>
      !r.isExample && r.email && r.name && r.status !== 'sent'
    );
    if (firstUnsent) {
      selectRecipient(firstUnsent.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
