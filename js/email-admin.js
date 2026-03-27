/**
 * Email CMS — Monitoring Cultureel Talent naar de Top 2026
 *
 * Standalone admin tool for composing and bulk-sending styled invitation emails.
 * Uses localStorage for recipient persistence and Google Apps Script for sending.
 * Version 3 deployment — updated 2026-02-17
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const STORAGE_KEYS = {
    RECIPIENTS: 'esc_email_recipients',
    SETTINGS: 'esc_email_settings'
  };

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbw3gcRqlbc9lH0WKiR5yEeM4whu_WFVAUg9lE8cf9Uyf6C-teYRfA5CQX2tCaZZiV-nlg/exec';
  const PROXY_URL = '/api/';

  const DEFAULT_SETTINGS = {
    subject: 'Monitor Executive Search \u2014 Talent naar de Top',
    surveyUrl: 'https://monitortalent.nl/',
    webVersionUrl: '',
    deadline: '28 april',
    jaar: '2025',
    senderName: 'Commissie Monitoring Talent naar de Top',
    contactPerson: 'Ellen Stoop',
    contactEmail: 'ellen.stoop@talentnaardetop.nl',
    contactPhone: '06 83562954',
    // Editable mail text fields
    heading: 'Monitor Executive Search',
    greeting: 'Beste {naam}',
    bodyText: 'Als ondertekenaar van de Executive Search Code zet u zich samen met Talent naar de Top in voor meer diversiteit in de (sub)top van organisaties.\n\nWat representatie van vrouwen in de top betreft heeft de effectiviteit van het Charter Talent naar de Top zich al bewezen. Charterondertekenaars zijn \'koploper\' en u levert daar een zeer belangrijke bijdrage aan.\n\nWij zijn benieuwd naar uw resultaten van het afgelopen kalenderjaar. Daarom nodigen wij u graag uit om de Executive Search Monitor over 2024 in te vullen.\n\nVia de button hieronder komt u bij de vragenlijst.\nWij vragen u deze in \u00e9\u00e9n keer volledig in te vullen. Uw antwoorden worden niet opgeslagen als u tussentijds stopt. Wilt u de vragen eerst inzien ter voorbereiding? Klik hier voor het overzicht.',
    ctaText: 'Naar de vragenlijst',
    ctaNote: '',
    deadlineContactText: 'U kunt de vragenlijst invullen tot en met {deadline}. Bij vragen of problemen met het invullen kunt u contact opnemen met {contactPerson} via {contactPhone} of {contactEmail}.',
    section2Heading: 'Wat gebeurt er met de resultaten?',
    section2Text: 'De Commissie Monitoring Talent naar de Top, die ook verantwoordelijk is voor de jaarlijkse monitoring van Charterondertekenaars, zal de resultaten beoordelen. Vervolgens ontvangt u een algemene rapportage waaruit de voortgang blijkt o.b.v. de resultaten van de executive search bureaus die zich bij ons hebben aangesloten. Uw gegevens worden uiteraard strikt vertrouwelijk behandeld. In de rapportage worden alleen de algemene resultaten gedeeld.',
    section3Heading: 'Topvrouw van het Jaar',
    section3ImageUrl: '',
    section3Text: 'Tot slot nog een belangrijke vraag aan u. Eerder ontving u van ons een email met suggesties over de topvrouw van het jaar. Onze vraag aan u: Welke vrouwelijke bestuurder zou volgens u in aanmerking moeten komen voor deze award? Wij stellen uw input zeer op prijs.',
    closingText: 'Wij wensen u veel succes met het invullen van de vragenlijst en kijken uit naar uw resultaten. Alvast hartelijk dank voor uw medewerking.\n\nMet vriendelijke groet,',
    signer1Name: '',
    signer1Title: '',
    signer2Name: '',
    signer2Title: '',
    address: 'Sandbergplein 24\n1181 ZX Amstelveen\nNederland',
    phone: '',
    website: 'www.talentnaardetop.nl',
    socialTwitter: '',
    socialLinkedin: '',
    socialInstagram: '',
    socialYoutube: '',
    footerText: 'U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitor Executive Search.',
    unsubscribeUrl: '',
    profileUrl: '',
    privacyUrl: ''
  };

  const SEND_DELAY_MS = 1500; // Delay between consecutive sends to avoid rate-limiting

  // Characters used for code generation (no ambiguous chars: 0/O, 1/I/L)
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let recipients = [];
  let settings = { ...DEFAULT_SETTINGS };
  let sendingInProgress = false;
  let pendingConfirmAction = null;

  // ---------------------------------------------------------------------------
  // localStorage helpers
  // ---------------------------------------------------------------------------

  function saveRecipients() {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(recipients));
    } catch (e) {
      console.warn('Failed to save recipients:', e);
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
      console.warn('Failed to save settings:', e);
    }
  }

  const SETTINGS_VERSION = 2;

  function loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return { ...DEFAULT_SETTINGS, _v: SETTINGS_VERSION };
      const saved = JSON.parse(data);
      // Clear stale settings from older versions
      if (!saved._v || saved._v < SETTINGS_VERSION) {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        return { ...DEFAULT_SETTINGS, _v: SETTINGS_VERSION };
      }
      // Don't let empty saved values override non-empty defaults
      const merged = { ...DEFAULT_SETTINGS, _v: SETTINGS_VERSION };
      for (const key of Object.keys(saved)) {
        if (saved[key] !== '' && saved[key] !== undefined) {
          merged[key] = saved[key];
        }
      }
      return merged;
    } catch { return { ...DEFAULT_SETTINGS, _v: SETTINGS_VERSION }; }
  }

  // ---------------------------------------------------------------------------
  // HTML Escape
  // ---------------------------------------------------------------------------

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str || '';
    return el.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Email HTML Template
  // ---------------------------------------------------------------------------

  function replaceTextPlaceholders(text, vars) {
    return text
      .replace(/\{naam\}/g, vars.naam)
      .replace(/\{jaar\}/g, vars.jaar)
      .replace(/\{deadline\}/g, vars.deadline)
      .replace(/\{contactPerson\}/g, vars.contactPerson)
      .replace(/\{contactEmail\}/g, vars.contactEmail)
      .replace(/\{contactPhone\}/g, vars.contactPhone)
      .replace(/\{code\}/g, vars.code);
  }

  function generateEmailHtml(recipient) {
    // Delegate to shared template builder
    if (window.EmailTemplate && window.EmailTemplate.buildEmailHtml) {
      return window.EmailTemplate.buildEmailHtml(recipient, settings);
    }
    // Fallback: simple text
    return '<html><body><p>Template niet geladen.</p></body></html>';
  }

  // ---------------------------------------------------------------------------
  // Recipient Management
  // ---------------------------------------------------------------------------

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /**
   * Generate a unique XXX-XXX access code.
   */
  function generateCode() {
    const existingCodes = new Set(recipients.map(r => r.code));
    let code;
    do {
      let part1 = '', part2 = '';
      for (let i = 0; i < 3; i++) {
        part1 += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
        part2 += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      code = part1 + '-' + part2;
    } while (existingCodes.has(code));
    return code;
  }

  function addRecipient(email, name) {
    email = (email || '').trim();
    name = (name || '').trim();

    if (!email) {
      showToast('Vul een e-mailadres in', 'error');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Ongeldig e-mailadres', 'error');
      return false;
    }
    if (!name) {
      showToast('Vul een naam in', 'error');
      return false;
    }

    // Check for duplicate email
    if (recipients.some(r => r.email && r.email.toLowerCase() === email.toLowerCase())) {
      showToast('Dit e-mailadres is al toegevoegd', 'error');
      return false;
    }

    recipients.push({
      id: generateId(),
      email: email,
      name: name,
      code: generateCode(),
      status: 'pending',
      selected: false,
      error: null
    });

    saveRecipients();
    renderTable();
    updateCounts();
    updatePreview();
    return true;
  }

  function removeRecipient(id) {
    recipients = recipients.filter(r => r.id !== id);
    saveRecipients();
    renderTable();
    updateCounts();
    updatePreview();
  }

  function clearAllRecipients() {
    recipients = [];
    saveRecipients();
    renderTable();
    updateCounts();
    updatePreview();
    showToast('Lijst gereset', 'info');
  }

  // ---------------------------------------------------------------------------
  // CSV Import / Export
  // ---------------------------------------------------------------------------

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const results = [];
    let skippedHeader = false;

    for (const line of lines) {
      // Split by comma, semicolon, or tab
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length < 2) continue;

      // Try to detect header row
      if (!skippedHeader) {
        const firstLower = parts[0].toLowerCase();
        if (firstLower === 'email' || firstLower === 'e-mail' || firstLower === 'e-mailadres' || firstLower === 'emailadres') {
          skippedHeader = true;
          continue;
        }
        skippedHeader = true;
      }

      // Expect: email, name[, code (optional)]
      const email = parts[0];
      const name = parts[1];
      const code = parts[2] || '';

      if (email && name) {
        results.push({ email, name, code });
      }
    }

    return results;
  }

  function handleCSVImport(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const parsed = parseCSV(e.target.result);
      if (parsed.length === 0) {
        showToast('Geen geldige rijen gevonden. Verwacht: email, naam', 'error');
        return;
      }

      let added = 0;
      let skipped = 0;
      for (const row of parsed) {
        // Check for duplicate email
        const isDuplicate = row.email && recipients.some(r => r.email && r.email.toLowerCase() === row.email.toLowerCase());
        if (isDuplicate) {
          skipped++;
          continue;
        }

        recipients.push({
          id: generateId(),
          email: row.email.trim(),
          name: row.name.trim(),
          code: row.code ? row.code.trim().toUpperCase() : generateCode(),
          status: 'pending',
          selected: false,
          error: null
        });
        added++;
      }

      saveRecipients();
      renderTable();
      updateCounts();
      updatePreview();

      const parts = [];
      if (added > 0) parts.push(`${added} ontvanger${added !== 1 ? 's' : ''} toegevoegd`);
      if (skipped > 0) parts.push(`${skipped} duplica${skipped !== 1 ? 'ten' : 'at'} overgeslagen`);
      showToast(parts.join(', ') || 'Geen wijzigingen', parts.length > 0 ? 'success' : 'info');
    };
    reader.readAsText(file);
  }

  function exportCSV() {
    if (recipients.length === 0) {
      showToast('Geen ontvangers om te exporteren', 'error');
      return;
    }

    const header = 'email,naam,code,status';
    const rows = recipients.map(r =>
      `"${r.email}","${r.name}","${r.code}","${r.status}"`
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
  // Sending Emails via GAS
  // ---------------------------------------------------------------------------

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function sendSingleEmail(recipient) {
    // Build params — send all settings fields to GAS
    const paramObj = {
      action: 'sendEmail',
      to: recipient.email,
      naam: recipient.name,
      code: recipient.code,
      subject: settings.subject,
      surveyUrl: settings.surveyUrl
        ? settings.surveyUrl + (settings.surveyUrl.includes('?') ? '&' : '?') + 'code=' + encodeURIComponent(recipient.code)
        : '',
      deadline: settings.deadline || '',
      jaar: settings.jaar || '',
      contactPerson: settings.contactPerson || '',
      contactEmail: settings.contactEmail || '',
      contactPhone: settings.contactPhone || '',
      senderName: settings.senderName || ''
    };
    // Add all text fields
    const textFieldKeys = [
      'heading', 'greeting', 'bodyText', 'ctaText', 'ctaNote',
      'deadlineContactText', 'section2Heading', 'section2Text',
      'section3Heading', 'section3ImageUrl', 'section3Text',
      'closingText', 'signer1Name', 'signer1Title', 'signer2Name', 'signer2Title',
      'address', 'phone', 'website', 'footerText',
      'webVersionUrl', 'unsubscribeUrl', 'profileUrl', 'privacyUrl',
      'socialTwitter', 'socialLinkedin', 'socialInstagram', 'socialYoutube'
    ];
    for (const key of textFieldKeys) {
      paramObj[key] = settings[key] || DEFAULT_SETTINGS[key] || '';
    }
    const params = new URLSearchParams(paramObj);

    // Try direct GAS first, fall back to proxy
    const endpoints = [
      { url: GAS_URL + '?' + params.toString(), label: 'direct' },
      { url: PROXY_URL + '?' + params.toString(), label: 'proxy' }
    ];

    console.log('[EmailCMS] ─── SEND EMAIL ───');
    console.log('[EmailCMS]   To:', recipient.email);
    console.log('[EmailCMS]   Params:', Object.fromEntries(params));

    for (const endpoint of endpoints) {
      try {
        console.log(`[EmailCMS]   Trying ${endpoint.label}: ${endpoint.url.substring(0, 120)}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(endpoint.url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        console.log(`[EmailCMS]   ${endpoint.label} response: status=${response.status}, type=${response.type}, url=${response.url}`);

        if (!response.ok) {
          console.warn(`[EmailCMS]   ${endpoint.label} HTTP error: ${response.status} ${response.statusText}`);
          continue;
        }

        const text = await response.text();
        console.log(`[EmailCMS]   ${endpoint.label} body:`, text.substring(0, 500));

        if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
          console.error('[EmailCMS]   Redirected to Google login!');
          throw new Error('GAS requires reauthorization');
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error(`[EmailCMS]   ${endpoint.label} JSON parse failed:`, parseErr.message);
          console.error(`[EmailCMS]   Raw body:`, text.substring(0, 300));
          continue;
        }

        console.log(`[EmailCMS]   ${endpoint.label} parsed:`, data);

        if (data.success) {
          console.log('[EmailCMS]   ✓ Email sent successfully');
          return { success: true };
        }
        console.warn(`[EmailCMS]   ${endpoint.label} returned success=false:`, data.error);
        return { success: false, error: data.error || 'Onbekende fout' };
      } catch (err) {
        console.error(`[EmailCMS]   ${endpoint.label} error:`, err.name, err.message);
        if (err.message === 'GAS requires reauthorization') throw err;
        // Try next endpoint
        continue;
      }
    }

    console.error('[EmailCMS] ─── BOTH ENDPOINTS FAILED ───');

    throw new Error('Beide endpoints niet bereikbaar');
  }

  async function sendBulk(recipientIds) {
    if (sendingInProgress) return;
    sendingInProgress = true;

    const toSend = recipients.filter(r => recipientIds.includes(r.id) && r.status !== 'sent' && r.email && r.name);
    const total = toSend.length;
    let completed = 0;
    let succeeded = 0;
    let failed = 0;

    const progressEl = document.getElementById('sendProgress');
    const fillEl = document.getElementById('progressFill');
    const textEl = document.getElementById('progressText');
    progressEl.style.display = 'flex';

    disableSendButtons(true);

    for (const recipient of toSend) {
      recipient.status = 'sending';
      recipient.error = null;
      renderTable();

      try {
        const result = await sendSingleEmail(recipient);
        if (result.success) {
          recipient.status = 'sent';
          succeeded++;
        } else {
          recipient.status = 'error';
          recipient.error = result.error;
          failed++;
        }
      } catch (err) {
        recipient.status = 'error';
        recipient.error = err.message;
        failed++;
      }

      completed++;
      const pct = Math.round((completed / total) * 100);
      fillEl.style.width = pct + '%';
      textEl.textContent = `${completed} / ${total} verzonden`;

      saveRecipients();
      renderTable();
      updateCounts();

      // Delay between sends
      if (completed < total) {
        await sleep(SEND_DELAY_MS);
      }
    }

    sendingInProgress = false;
    disableSendButtons(false);

    let msg = `${succeeded} e-mail${succeeded !== 1 ? 's' : ''} verzonden`;
    if (failed > 0) msg += `, ${failed} mislukt`;
    showToast(msg, failed > 0 ? 'error' : 'success');

    // Hide progress after a delay
    setTimeout(() => {
      progressEl.style.display = 'none';
      fillEl.style.width = '0%';
    }, 3000);
  }

  function disableSendButtons(disabled) {
    const btn1 = document.getElementById('btnSendSelected');
    const btn2 = document.getElementById('btnSendAll');
    if (disabled) {
      btn1.disabled = true;
      btn2.disabled = true;
    } else {
      updateCounts();
    }
  }

  // ---------------------------------------------------------------------------
  // .eml Download (manual send via Outlook)
  // ---------------------------------------------------------------------------

  function downloadSingleEml(recipient) {
    // Ensure latest settings are captured
    syncSettingsFromUI();
    const emlContent = window.EmailTemplate.buildEml(recipient, settings);
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const safeName = (recipient.name || recipient.email || 'email')
      .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 50);
    a.download = safeName + '.eml';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadBulkEml(recipientIds) {
    const toDownload = recipients.filter(r =>
      recipientIds.includes(r.id) && r.email && r.name && r.status !== 'sent'
    );

    if (toDownload.length === 0) {
      showToast('Geen ontvangers om te downloaden', 'error');
      return;
    }

    // Download one by one with a short delay so the browser doesn't block them
    for (let i = 0; i < toDownload.length; i++) {
      downloadSingleEml(toDownload[i]);
      if (i < toDownload.length - 1) {
        await sleep(300);
      }
    }

    showToast(`${toDownload.length} .eml-bestand${toDownload.length !== 1 ? 'en' : ''} gedownload`, 'success');
  }

  // ---------------------------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------------------------

  function renderTable() {
    const tbody = document.getElementById('recipientTableBody');
    if (!tbody) return;

    tbody.innerHTML = recipients.map(r => {
      return `
      <tr data-id="${r.id}">
        <td><input type="checkbox" class="row-check" data-id="${r.id}" ${r.selected ? 'checked' : ''}></td>
        <td class="ea-cell-email">${esc(r.email)}</td>
        <td class="ea-cell-name">${esc(r.name)}</td>
        <td class="ea-cell-code">${esc(r.code)}</td>
        <td>${renderStatus(r)}</td>
        <td class="ea-cell-actions">
          <button class="ea-btn-icon" data-action="downloadRowEml" data-id="${r.id}" title="Download .eml voor Outlook">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v2.667A1.333 1.333 0 0 1 12.667 14H3.333A1.334 1.334 0 0 1 2 12.667V10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.667 6.667 8 10l3.333-3.333" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10V2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="ea-btn-delete" data-action="deleteRecipient" data-id="${r.id}" title="Verwijderen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4M12.667 4v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </td>
      </tr>`;
    }).join('');

    // Show/hide empty state
    const emptyEl = document.getElementById('emptyState');
    const tableScroll = document.querySelector('.ea-table-scroll');
    if (recipients.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
      if (tableScroll) tableScroll.style.display = 'none';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      if (tableScroll) tableScroll.style.display = '';
    }
  }

  function renderStatus(r) {
    switch (r.status) {
      case 'pending':
        return '<span class="ea-status ea-status-pending">Wachtrij</span>';
      case 'sending':
        return '<span class="ea-status ea-status-sending">Verzenden\u2026</span>';
      case 'sent':
        return '<span class="ea-status ea-status-sent">\u2713 Verzonden</span>';
      case 'error':
        return `<span class="ea-status ea-status-error" title="${esc(r.error || '')}">\u2717 Mislukt</span>`;
      default:
        return '';
    }
  }

  function updateCounts() {
    const sendable = recipients.filter(r => r.email && r.name);
    const selected = sendable.filter(r => r.selected);
    const pendingSel = selected.filter(r => r.status !== 'sent');
    const allPending = sendable.filter(r => r.status !== 'sent');

    const countEl = document.getElementById('recipientCount');
    const selCountEl = document.getElementById('selectedCount');
    const totalPendingEl = document.getElementById('totalPendingCount');
    const btn1 = document.getElementById('btnSendSelected');
    const btn2 = document.getElementById('btnSendAll');

    if (countEl) countEl.textContent = recipients.length;
    if (selCountEl) selCountEl.textContent = pendingSel.length;
    if (totalPendingEl) totalPendingEl.textContent = allPending.length;

    if (btn1 && !sendingInProgress) btn1.disabled = pendingSel.length === 0;
    if (btn2 && !sendingInProgress) btn2.disabled = allPending.length === 0;

    // .eml download buttons
    const selEmlCountEl = document.getElementById('selectedEmlCount');
    const totalEmlCountEl = document.getElementById('totalEmlCount');
    const btnDlSel = document.getElementById('btnDownloadSelected');
    const btnDlAll = document.getElementById('btnDownloadAll');

    if (selEmlCountEl) selEmlCountEl.textContent = pendingSel.length;
    if (totalEmlCountEl) totalEmlCountEl.textContent = allPending.length;
    if (btnDlSel) btnDlSel.disabled = pendingSel.length === 0;
    if (btnDlAll) btnDlAll.disabled = allPending.length === 0;
  }

  function updatePreview() {
    const iframe = document.getElementById('emailPreview');
    if (!iframe) return;

    const sampleRecipient = recipients.length > 0 ? recipients[0] : null;
    const html = generateEmailHtml(sampleRecipient);

    iframe.srcdoc = html;
  }

  // ---------------------------------------------------------------------------
  // Settings Sync
  // ---------------------------------------------------------------------------

  const ALL_SETTING_FIELDS = [
    'subject', 'surveyUrl', 'webVersionUrl', 'deadline', 'jaar', 'senderName', 'contactPerson', 'contactEmail', 'contactPhone',
    'heading', 'greeting', 'bodyText', 'ctaText', 'ctaNote',
    'deadlineContactText', 'section2Heading', 'section2Text',
    'section3Heading', 'section3ImageUrl', 'section3Text',
    'closingText', 'signer1Name', 'signer1Title', 'signer2Name', 'signer2Title',
    'address', 'phone', 'website', 'socialTwitter', 'socialLinkedin', 'socialInstagram', 'socialYoutube',
    'footerText', 'unsubscribeUrl', 'profileUrl', 'privacyUrl'
  ];

  function syncSettingsFromUI() {
    for (const field of ALL_SETTING_FIELDS) {
      const el = document.getElementById('setting-' + field);
      if (el) settings[field] = el.value;
    }
    saveSettings();
  }

  function syncSettingsToUI() {
    for (const field of ALL_SETTING_FIELDS) {
      const el = document.getElementById('setting-' + field);
      if (el) el.value = settings[field] || '';
    }
  }

  function loadTemplatePreset(presetKey) {
    const presets = window.EmailTemplate && window.EmailTemplate.TEMPLATE_PRESETS;
    if (!presets || !presets[presetKey]) return;

    const preset = presets[presetKey].defaults;
    // Overwrite text fields + settings that the preset provides
    const presetFields = [
      'subject', 'senderName', 'deadline', 'jaar',
      'contactPerson', 'contactEmail', 'contactPhone',
      'heading', 'greeting', 'bodyText', 'ctaText', 'ctaNote',
      'deadlineContactText', 'section2Heading', 'section2Text',
      'section3Heading', 'section3ImageUrl', 'section3Text',
      'closingText', 'signer1Name', 'signer1Title', 'signer2Name', 'signer2Title',
      'address', 'phone', 'website', 'socialTwitter', 'socialLinkedin', 'socialInstagram', 'socialYoutube',
      'footerText', 'unsubscribeUrl', 'profileUrl', 'privacyUrl'
    ];
    for (const field of presetFields) {
      if (preset[field] !== undefined) {
        settings[field] = preset[field];
      }
    }
    saveSettings();
    syncSettingsToUI();
    updatePreview();

    // Update active state on preset buttons
    document.querySelectorAll('.ea-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });

    showToast(`Template "${presets[presetKey].label}" geladen`, 'success');
  }

  // ---------------------------------------------------------------------------
  // Toast Notifications
  // ---------------------------------------------------------------------------

  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

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
  // Confirmation Modal
  // ---------------------------------------------------------------------------

  function showConfirm(title, message, onConfirm) {
    const overlay = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    pendingConfirmAction = onConfirm;
    if (overlay) overlay.style.display = '';
  }

  function hideConfirm() {
    const overlay = document.getElementById('confirmModal');
    if (overlay) overlay.style.display = 'none';
    pendingConfirmAction = null;
  }

  // ---------------------------------------------------------------------------
  // Copy HTML to Clipboard
  // ---------------------------------------------------------------------------

  async function copyEmailHtml() {
    const sampleRecipient = recipients.length > 0 ? recipients[0] : null;
    const html = generateEmailHtml(sampleRecipient);

    try {
      await navigator.clipboard.writeText(html);
      showToast('E-mail HTML gekopieerd naar klembord', 'success');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = html;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('E-mail HTML gekopieerd naar klembord', 'success');
    }
  }

  // ---------------------------------------------------------------------------
  // Event Handling
  // ---------------------------------------------------------------------------

  function handleAction(action, target) {
    switch (action) {
      case 'addRecipient': {
        const emailEl = document.getElementById('add-email');
        const nameEl = document.getElementById('add-name');
        if (addRecipient(emailEl.value, nameEl.value)) {
          emailEl.value = '';
          nameEl.value = '';
          emailEl.focus();
        }
        break;
      }

      case 'deleteRecipient': {
        const id = target.dataset.id || target.closest('[data-id]')?.dataset.id;
        if (id) removeRecipient(id);
        break;
      }

      case 'downloadRowEml': {
        const id = target.dataset.id || target.closest('[data-id]')?.dataset.id;
        const r = recipients.find(r => r.id === id);
        if (r && r.email && r.name) {
          downloadSingleEml(r);
          showToast(`${r.name}.eml gedownload`, 'success');
        }
        break;
      }

      case 'downloadSelectedEml': {
        const selected = recipients.filter(r => r.selected && r.status !== 'sent' && r.email && r.name);
        if (selected.length === 0) return;
        downloadBulkEml(selected.map(r => r.id));
        break;
      }

      case 'downloadAllEml': {
        const pending = recipients.filter(r => r.status !== 'sent' && r.email && r.name);
        if (pending.length === 0) return;
        downloadBulkEml(pending.map(r => r.id));
        break;
      }

      case 'copyHtml':
        copyEmailHtml();
        break;

      case 'exportCsv':
        exportCSV();
        break;

      case 'sendSelected': {
        const selected = recipients.filter(r => r.selected && r.status !== 'sent');
        if (selected.length === 0) return;
        showConfirm(
          'E-mails verzenden',
          `${selected.length} e-mail${selected.length !== 1 ? 's' : ''} verzenden naar de geselecteerde ontvangers?`,
          () => sendBulk(selected.map(r => r.id))
        );
        break;
      }

      case 'sendAll': {
        const pending = recipients.filter(r => r.status !== 'sent');
        if (pending.length === 0) return;
        showConfirm(
          'Alle e-mails verzenden',
          `${pending.length} e-mail${pending.length !== 1 ? 's' : ''} verzenden naar alle ontvangers?`,
          () => sendBulk(pending.map(r => r.id))
        );
        break;
      }

      case 'proceedConfirm':
        if (pendingConfirmAction) pendingConfirmAction();
        hideConfirm();
        break;

      case 'cancelConfirm':
        hideConfirm();
        break;

      case 'resetAll':
        showConfirm(
          'Lijst resetten',
          'Alle e-mailadressen en namen worden gewist. De toegangscodes blijven behouden. Weet u het zeker?',
          () => clearAllRecipients()
        );
        break;

      case 'toggleSection': {
        const targetId = target.closest('[data-target]')?.dataset.target;
        if (!targetId) return;
        const body = document.getElementById(targetId);
        const header = target.closest('.ea-card-header');
        if (body) body.classList.toggle('collapsed');
        if (header) header.classList.toggle('collapsed');
        break;
      }

      case 'loadPreset': {
        const presetKey = target.dataset.preset;
        if (presetKey) loadTemplatePreset(presetKey);
        break;
      }

      default:
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  function init() {
    // Load persisted state
    recipients = loadRecipients();
    settings = loadSettings();

    // Strip legacy isExample rows from older localStorage data
    const hadExamples = recipients.some(r => r.isExample);
    if (hadExamples) {
      recipients = recipients.filter(r => !r.isExample);
      saveRecipients();
    }

    // Sync settings to UI
    syncSettingsToUI();

    // Initial render
    renderTable();
    updateCounts();
    updatePreview();

    // Event delegation for data-action buttons
    document.addEventListener('click', function (e) {
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        e.preventDefault();
        handleAction(actionEl.dataset.action, actionEl);
      }
    });

    // Row checkbox changes
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('row-check')) {
        const id = e.target.dataset.id;
        const r = recipients.find(r => r.id === id);
        if (r) {
          r.selected = e.target.checked;
          saveRecipients();
          updateCounts();
        }
      }

      if (e.target.id === 'selectAll') {
        const checked = e.target.checked;
        recipients.forEach(r => { r.selected = checked; });
        saveRecipients();
        renderTable();
        updateCounts();
        // Re-check the selectAll after render
        const sa = document.getElementById('selectAll');
        if (sa) sa.checked = checked;
      }
    });

    // Settings debounced save + preview update (covers all .ea-grid containers)
    let settingsTimer;
    const settingsContainers = document.querySelectorAll('.ea-grid');
    for (const container of settingsContainers) {
      container.addEventListener('input', function () {
        clearTimeout(settingsTimer);
        settingsTimer = setTimeout(() => {
          syncSettingsFromUI();
          updatePreview();
        }, 400);
      });
    }

    // CSV import
    const csvInput = document.getElementById('csvImport');
    if (csvInput) {
      csvInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          handleCSVImport(this.files[0]);
          this.value = ''; // Reset so same file can be imported again
        }
      });
    }

    // Enter key in add form
    const addForm = document.querySelector('.ea-add-form');
    if (addForm) {
      addForm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAction('addRecipient', e.target);
        }
      });
    }

    // Escape to close modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideConfirm();
    });

    // Close modal on backdrop click
    const modal = document.getElementById('confirmModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) hideConfirm();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
