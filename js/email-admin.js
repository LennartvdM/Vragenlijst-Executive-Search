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
    RECIPIENTS: 'cttt_email_recipients',
    SETTINGS: 'cttt_email_settings'
  };

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbw3gcRqlbc9lH0WKiR5yEeM4whu_WFVAUg9lE8cf9Uyf6C-teYRfA5CQX2tCaZZiV-nlg/exec';
  const PROXY_URL = '/api/';

  const DEFAULT_SETTINGS = {
    subject: 'Monitoring Cultureel Talent naar de Top 2026',
    surveyUrl: '',
    previewUrl: '',
    deadline: '',
    senderName: 'Commissie Monitoring Talent naar de Top',
    contactPerson: '',
    contactEmail: ''
  };

  const SEND_DELAY_MS = 1500; // Delay between consecutive sends to avoid rate-limiting

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

  function loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
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

  function generateEmailHtml(recipient) {
    const s = settings;
    const naam = esc(recipient?.name || '[naam]');
    const code = esc(recipient?.code || 'ABC-DEF');
    const deadline = esc(s.deadline || '[deadline]');
    const surveyUrl = esc(s.surveyUrl || '#');
    const previewUrl = esc(s.previewUrl || '#');
    const contactPerson = esc(s.contactPerson || '[contactpersoon]');
    const contactEmail = esc(s.contactEmail || '[email]');
    const senderName = esc(s.senderName || 'Commissie Monitoring Talent naar de Top');

    return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${esc(s.subject)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td { margin: 0; padding: 0; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; display: block; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f3ece2; font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ece2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Outline stroke (simulated via outer table) -->
        <table role="presentation" width="612" cellpadding="0" cellspacing="0" style="max-width:612px; background-color:#fafbfc; border-radius:22px; box-shadow: 0 8px 32px rgba(8,9,30,0.15), 0 2px 8px rgba(8,9,30,0.1);">
          <tr>
            <td style="padding: 6px;">

              <!-- Inner card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafbfc; border-radius:16px; overflow:hidden;">

                <!-- Header — matches .login-header gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8caef4 0%, #111162 100%); padding: 40px 32px; text-align: center;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <!-- Logo icon — frosted glass container like .logo-icon -->
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td style="width:56px; height:64px; background-color:rgba(255,255,255,0.25); border-radius:12px; text-align:center; vertical-align:middle;">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 57.614 67.051'%3E%3Cg transform='translate(-741 -4156)'%3E%3Cpath d='M48.72,105.206,30.284,91.174a2.438,2.438,0,0,0-2.951,0L8.9,105.205a3.1,3.1,0,0,1-4.337-.588L.634,99.459a3.094,3.094,0,0,1,.587-4.338l24.1-18.347a5.748,5.748,0,0,1,6.964,0l24.1,18.347a3.094,3.094,0,0,1,.59,4.336h0l-3.927,5.16a3.094,3.094,0,0,1-4.336.589h0' transform='translate(740.999 4117.211)' fill='%23ffffff'/%3E%3Cpath d='M48.719,67.465,34.359,56.536a9.17,9.17,0,0,0-11.106,0L8.9,67.465a3.094,3.094,0,0,1-4.337-.588L.632,61.718a3.094,3.094,0,0,1,.587-4.336h0L16.239,45.95a20.75,20.75,0,0,1,25.136,0L56.394,57.384a3.1,3.1,0,0,1,.588,4.336h0l-3.924,5.157a3.1,3.1,0,0,1-4.337.588' transform='translate(741 4134.599)' fill='%23ffffff'/%3E%3Cpath d='M58.5,12.356A12.355,12.355,0,1,1,46.143,0h0A12.355,12.355,0,0,1,58.5,12.356' transform='translate(723.664 4155.999)' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E" width="38" height="38" alt="" style="display:inline-block; width:38px; height:38px; opacity:0.87;">
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <h1 style="margin:0 0 8px; color:rgba(255,255,255,0.87); font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif; font-size:20px; font-weight:600; line-height:1.3;">
                            Monitoring Cultureel Talent naar&nbsp;de&nbsp;Top
                          </h1>
                          <!-- Year badge — white pill like .year-badge -->
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                              <td style="background-color:rgba(255,255,255,0.95); border-radius:20px; padding:6px 18px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                                <span style="color:#1d1d30; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; font-weight:600;">2026</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 32px 32px 28px;">
                    <!-- Greeting -->
                    <p style="margin:0 0 20px; color:#1d1d30; font-size:16px; line-height:1.6;">
                      Geachte ${naam},
                    </p>

                    <!-- Main text -->
                    <p style="margin:0 0 28px; color:#3c3c5d; font-size:14.5px; line-height:1.7;">
                      Wij vragen u de monitoring in te vullen v&oacute;&oacute;r <strong style="color:#1d1d30; font-weight:600;">${deadline}</strong>.
                    </p>

                    <!-- Access code card — styled like .option-card.selected -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                      <tr>
                        <td style="border:2px solid #111162; border-radius:10px; background-color:#f1f4f8; padding:24px; text-align:center; box-shadow:0 4px 16px rgba(17,17,98,0.15);">
                          <p style="margin:0 0 8px; color:#7a7a96; font-size:13px; font-weight:500; text-transform:uppercase; letter-spacing:1px;">
                            Uw toegangscode
                          </p>
                          <p style="margin:0; color:#111162; font-size:28px; font-weight:700; letter-spacing:5px; font-family:'SF Mono','Fira Code','Courier New',monospace;">
                            ${code}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA button — matches .btn-primary -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:linear-gradient(135deg, #8caef4 0%, #111162 100%); border-radius:10px; box-shadow:0 4px 12px rgba(17,17,98,0.3);">
                                <a href="${surveyUrl}" target="_blank" style="display:inline-block; padding:14px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;">
                                  Ga naar de vragenlijst &rarr;
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Preview link — matches .preview-link style -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                      <tr>
                        <td align="center">
                          <a href="${previewUrl}" target="_blank" style="color:#3c3c5d; font-size:12px; font-weight:400; text-decoration:none; opacity:0.7;">
                            Bekijk inkijkexemplaar &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider — matches .login-footer border-top -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td style="border-top:1px solid #e1e9f4; font-size:0; line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Practical section — checkmarks like .login-info li -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td>
                          <p style="margin:0 0 12px; color:#1d1d30; font-size:15px; font-weight:600;">
                            Praktisch
                          </p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:5px 0 5px 24px; color:#3c3c5d; font-size:14px; line-height:1.6; position:relative;">
                                <span style="color:#111162; font-weight:700; margin-left:-24px; margin-right:10px;">&check;</span>Duurt 20&#8211;30 minuten, u kunt tussendoor stoppen
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0 5px 24px; color:#3c3c5d; font-size:14px; line-height:1.6;">
                                <span style="color:#111162; font-weight:700; margin-left:-24px; margin-right:10px;">&check;</span>U kunt meerdere keren verzenden, de laatste versie telt
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0 5px 24px; color:#3c3c5d; font-size:14px; line-height:1.6;">
                                <span style="color:#111162; font-weight:700; margin-left:-24px; margin-right:10px;">&check;</span>Houd uw personeelscijfers bij de hand
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0 5px 24px; color:#3c3c5d; font-size:14px; line-height:1.6;">
                                <span style="color:#111162; font-weight:700; margin-left:-24px; margin-right:10px;">&check;</span>Uw voortgang is gekoppeld aan uw apparaat, niet aan uw code
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Privacy notice — matches .info-block (border-left + sand-light bg) -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                      <tr>
                        <td style="background-color:#f1f4f8; border-left:3px solid #111162; border-radius:0 6px 6px 0; padding:16px 20px;">
                          <p style="margin:0 0 10px; color:#3c3c5d; font-size:13.5px; line-height:1.6;">
                            Uw antwoorden worden opgeslagen in uw browser, lokaal op uw apparaat. U kunt tussendoor stoppen en later verdergaan, maar:
                          </p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:3px 0; color:#3c3c5d; font-size:13px; line-height:1.6;">
                                &#8226;&nbsp; Op een ander apparaat begint u met een leeg formulier.
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:3px 0; color:#3c3c5d; font-size:13px; line-height:1.6;">
                                &#8226;&nbsp; Als u uw browsergegevens wist, zijn uw conceptantwoorden weg.
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:3px 0; color:#3c3c5d; font-size:13px; line-height:1.6;">
                                &#8226;&nbsp; Ieder formulier ontvangen wij zodra u verzendt.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Contact — matches .contact-email style -->
                    <p style="margin:0 0 24px; color:#3c3c5d; font-size:13px; line-height:1.6;">
                      Nog vragen? Neem contact op met ${contactPerson} via
                      <a href="mailto:${contactEmail}" style="color:#111162; font-weight:500; text-decoration:none;">${contactEmail}</a>
                    </p>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                      <tr>
                        <td style="border-top:1px solid #e1e9f4; font-size:0; line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Closing -->
                    <p style="margin:0 0 4px; color:#3c3c5d; font-size:14px; line-height:1.6;">
                      Met vriendelijke groet,
                    </p>
                    <p style="margin:0; color:#1d1d30; font-size:14px; font-weight:600; line-height:1.6;">
                      ${senderName}
                    </p>
                  </td>
                </tr>

                <!-- Footer — sidebar gradient style -->
                <tr>
                  <td style="background: linear-gradient(180deg, rgba(140,174,244,0.15) 0%, rgba(225,233,244,0.3) 100%); padding:20px 32px; text-align:center;">
                    <p style="margin:0; color:#7a7a96; font-size:12px; line-height:1.5;">
                      U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitoring Cultureel Talent naar de Top 2026.
                    </p>
                  </td>
                </tr>

              </table>
              <!-- /Inner card -->

            </td>
          </tr>
        </table>
        <!-- /Outline stroke -->

      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Recipient Management
  // ---------------------------------------------------------------------------

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function addRecipient(email, name, code) {
    email = (email || '').trim();
    name = (name || '').trim();
    code = (code || '').trim().toUpperCase();

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
    if (!code) {
      showToast('Vul een code in', 'error');
      return false;
    }

    // Check for duplicate email
    if (recipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
      showToast('Dit e-mailadres is al toegevoegd', 'error');
      return false;
    }

    recipients.push({
      id: generateId(),
      email,
      name,
      code,
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
  }

  function clearAllRecipients() {
    recipients = [];
    saveRecipients();
    renderTable();
    updateCounts();
    showToast('Alle ontvangers verwijderd', 'info');
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

      if (parts.length < 3) continue;

      // Try to detect header row
      if (!skippedHeader) {
        const firstLower = parts[0].toLowerCase();
        if (firstLower === 'email' || firstLower === 'e-mail' || firstLower === 'e-mailadres' || firstLower === 'emailadres') {
          skippedHeader = true;
          continue;
        }
        skippedHeader = true;
      }

      // Expect: email, name, code
      const email = parts[0];
      const name = parts[1];
      const code = parts[2];

      if (email && name && code) {
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
        showToast('Geen geldige rijen gevonden. Verwacht: email, naam, code', 'error');
        return;
      }

      let added = 0;
      let skipped = 0;
      for (const row of parsed) {
        const isDuplicate = recipients.some(r => r.email.toLowerCase() === row.email.toLowerCase());
        if (isDuplicate) {
          skipped++;
          continue;
        }
        recipients.push({
          id: generateId(),
          email: row.email.trim(),
          name: row.name.trim(),
          code: row.code.trim().toUpperCase(),
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

      let msg = `${added} ontvanger${added !== 1 ? 's' : ''} ge\u00EFmporteerd`;
      if (skipped > 0) msg += `, ${skipped} duplica${skipped !== 1 ? 'ten' : 'at'} overgeslagen`;
      showToast(msg, 'success');
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
    const params = new URLSearchParams({
      action: 'sendEmail',
      to: recipient.email,
      naam: recipient.name,
      code: recipient.code,
      subject: settings.subject,
      surveyUrl: settings.surveyUrl || '',
      previewUrl: settings.previewUrl || '',
      deadline: settings.deadline || '',
      contactPerson: settings.contactPerson || '',
      contactEmail: settings.contactEmail || '',
      senderName: settings.senderName || ''
    });

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

    const toSend = recipients.filter(r => recipientIds.includes(r.id) && r.status !== 'sent');
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
  // UI Rendering
  // ---------------------------------------------------------------------------

  function renderTable() {
    const tbody = document.getElementById('recipientTableBody');
    if (!tbody) return;

    tbody.innerHTML = recipients.map(r => `
      <tr data-id="${r.id}">
        <td><input type="checkbox" class="row-check" data-id="${r.id}" ${r.selected ? 'checked' : ''}></td>
        <td class="ea-cell-email">${esc(r.email)}</td>
        <td class="ea-cell-name">${esc(r.name)}</td>
        <td class="ea-cell-code">${esc(r.code)}</td>
        <td>${renderStatus(r)}</td>
        <td>
          <button class="ea-btn-delete" data-action="deleteRecipient" data-id="${r.id}" title="Verwijderen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

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
    const selected = recipients.filter(r => r.selected);
    const pendingSel = selected.filter(r => r.status !== 'sent');
    const allPending = recipients.filter(r => r.status !== 'sent');

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

  function syncSettingsFromUI() {
    const fields = ['subject', 'surveyUrl', 'previewUrl', 'deadline', 'senderName', 'contactPerson', 'contactEmail'];
    for (const field of fields) {
      const el = document.getElementById('setting-' + field);
      if (el) settings[field] = el.value;
    }
    saveSettings();
  }

  function syncSettingsToUI() {
    const fields = ['subject', 'surveyUrl', 'previewUrl', 'deadline', 'senderName', 'contactPerson', 'contactEmail'];
    for (const field of fields) {
      const el = document.getElementById('setting-' + field);
      if (el) el.value = settings[field] || '';
    }
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
        const codeEl = document.getElementById('add-code');
        if (addRecipient(emailEl.value, nameEl.value, codeEl.value)) {
          emailEl.value = '';
          nameEl.value = '';
          codeEl.value = '';
          emailEl.focus();
        }
        break;
      }

      case 'deleteRecipient': {
        const id = target.dataset.id || target.closest('[data-id]')?.dataset.id;
        if (id) removeRecipient(id);
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

      case 'toggleSection': {
        const targetId = target.closest('[data-target]')?.dataset.target;
        if (!targetId) return;
        const body = document.getElementById(targetId);
        const header = target.closest('.ea-card-header');
        if (body) body.classList.toggle('collapsed');
        if (header) header.classList.toggle('collapsed');
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

    // Settings debounced save + preview update
    let settingsTimer;
    const settingsContainer = document.querySelector('.ea-grid');
    if (settingsContainer) {
      settingsContainer.addEventListener('input', function () {
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
