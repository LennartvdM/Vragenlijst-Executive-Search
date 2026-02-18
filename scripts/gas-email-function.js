/**
 * Google Apps Script — Email Sending Function
 *
 * Add this code to your existing GAS project (the one that handles the survey).
 * It adds a new `sendEmail` action to the existing `doGet` handler.
 *
 * SETUP:
 * 1. Open your Google Apps Script project
 * 2. Add this function (or merge the sendEmail case into your existing doGet)
 * 3. Deploy a new version of the web app
 *
 * The Email CMS page at /m9v2-email-cms calls this with:
 *   ?action=sendEmail&to=...&naam=...&code=...&subject=...&surveyUrl=...&etc.
 *
 * Daily email quota: ~100/day (free), ~1500/day (Google Workspace)
 */

// --- Add this case to your existing doGet(e) switch/if-else ---

/*
  // Inside your existing doGet(e) function, add this case:

  if (action === 'sendEmail') {
    return handleSendEmail(e.parameter);
  }
*/

/**
 * Handle the sendEmail action
 * @param {Object} params - URL parameters
 * @returns {ContentService.TextOutput} JSON response
 */
function handleSendEmail(params) {
  try {
    var to = params.to;
    var naam = params.naam || '';
    var code = params.code || '';
    var subject = params.subject || 'Monitoring Cultureel Talent naar de Top 2026';
    var surveyUrl = params.surveyUrl || '';
    var previewUrl = params.previewUrl || '';
    var deadline = params.deadline || '';
    var contactPerson = params.contactPerson || '';
    var contactEmail = params.contactEmail || '';
    var senderName = params.senderName || 'Commissie Monitoring Talent naar de Top';

    if (!to) {
      return jsonResponse({ success: false, error: 'Geen e-mailadres opgegeven' });
    }

    var htmlBody = buildEmailHtml(naam, code, subject, surveyUrl, previewUrl, deadline, contactPerson, contactEmail, senderName);

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: senderName,
      noReply: true
    });

    return jsonResponse({ success: true, message: 'E-mail verzonden naar ' + to });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message || 'Onbekende fout bij verzenden' });
  }
}

/**
 * Build the HTML email body
 */
function buildEmailHtml(naam, code, subject, surveyUrl, previewUrl, deadline, contactPerson, contactEmail, senderName) {
  return '<!DOCTYPE html>' +
    '<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + escHtml(subject) + '</title>' +
    '<style>body,table,td{margin:0;padding:0}body{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt}img{border:0;display:block}</style>' +
    '</head>' +
    '<body style="margin:0;padding:0;background-color:#f3ece2;font-family:\'Inter\',\'Segoe UI\',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ece2;">' +
    '<tr><td align="center" style="padding:40px 20px;">' +

    // .container outline stroke
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#fafbfc;border-radius:18px;box-shadow:0 8px 32px rgba(8,9,30,0.15),0 2px 8px rgba(8,9,30,0.1);">' +
    '<tr><td style="padding:6px;">' +

    // .container inner — sidebar + content
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;">' +
    '<tr>' +

    // .index sidebar strip (decorative)
    '<td width="48" style="width:48px;background:linear-gradient(180deg,rgba(140,174,244,0.2) 0%,rgba(225,233,244,0.35) 100%);vertical-align:top;border-radius:12px 0 0 12px;">&nbsp;</td>' +

    // .content area
    '<td style="background-color:#fafbfc;vertical-align:top;border-radius:0 12px 12px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +

    // Progress dots
    '<tr><td style="padding:20px 28px 0;font-size:0;line-height:0;">' +
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#111162;margin-right:4px;">&nbsp;</span>' +
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;margin-right:4px;">&nbsp;</span>' +
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;margin-right:4px;">&nbsp;</span>' +
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;margin-right:4px;">&nbsp;</span>' +
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;">&nbsp;</span>' +
    '</td></tr>' +

    // h1 heading
    '<tr><td style="padding:20px 28px 8px;">' +
    '<h1 style="margin:0;color:#1d1d30;font-family:\'Inter\',\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-0.3px;">Monitoring Cultureel Talent naar de Top 2026</h1>' +
    '</td></tr>' +

    // Subtitle
    '<tr><td style="padding:0 28px 24px;">' +
    '<p style="margin:0;color:#7a7a96;font-size:15px;line-height:1.55;letter-spacing:0.01em;">Geachte ' + escHtml(naam) + ', wij vragen u de monitoring in te vullen v&oacute;&oacute;r <strong style="color:#1d1d30;font-weight:600;">' + escHtml(deadline) + '</strong>.</p>' +
    '</td></tr>' +

    // Code box — .option-card.selected
    '<tr><td style="padding:0 28px 24px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="border:2px solid #111162;border-radius:10px;background-color:#f1f4f8;padding:20px;text-align:center;box-shadow:0 4px 16px rgba(17,17,98,0.15);">' +
    '<p style="margin:0 0 6px;color:#7a7a96;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Uw toegangscode</p>' +
    '<p style="margin:0;color:#111162;font-size:26px;font-weight:700;letter-spacing:5px;font-family:\'SF Mono\',\'Fira Code\',\'Courier New\',monospace;">' + escHtml(code) + '</p>' +
    '</td></tr></table></td></tr>' +

    // CTA — .btn-primary
    '<tr><td style="padding:0 28px 8px;" align="center">' +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="background:linear-gradient(135deg,#8caef4 0%,#111162 100%);border-radius:10px;box-shadow:0 4px 12px rgba(17,17,98,0.3);">' +
    '<a href="' + escHtml(surveyUrl) + '" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Ga naar de vragenlijst &rarr;</a>' +
    '</td></tr></table></td></tr>' +

    // Preview link
    '<tr><td style="padding:0 28px 24px;" align="center">' +
    '<a href="' + escHtml(previewUrl) + '" target="_blank" style="color:#3c3c5d;font-size:12px;text-decoration:none;opacity:0.7;">Bekijk inkijkexemplaar &rarr;</a>' +
    '</td></tr>' +

    // Divider
    '<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e1e9f4;font-size:0;">&nbsp;</td></tr></table></td></tr>' +

    // Praktisch
    '<tr><td style="padding:20px 28px 10px;"><p style="margin:0;color:#1d1d30;font-size:14px;font-weight:600;">Praktisch</p></td></tr>' +
    '<tr><td style="padding:3px 28px 3px 46px;color:#3c3c5d;font-size:13px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-18px;margin-right:8px;">&#10003;</span>Duurt 20&#8211;30 minuten, u kunt tussendoor stoppen</td></tr>' +
    '<tr><td style="padding:3px 28px 3px 46px;color:#3c3c5d;font-size:13px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-18px;margin-right:8px;">&#10003;</span>U kunt meerdere keren verzenden, de laatste versie telt</td></tr>' +
    '<tr><td style="padding:3px 28px 3px 46px;color:#3c3c5d;font-size:13px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-18px;margin-right:8px;">&#10003;</span>Houd uw personeelscijfers bij de hand</td></tr>' +
    '<tr><td style="padding:3px 28px 16px 46px;color:#3c3c5d;font-size:13px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-18px;margin-right:8px;">&#10003;</span>Voortgang gekoppeld aan uw apparaat, niet aan uw code</td></tr>' +

    // Privacy — .info-block
    '<tr><td style="padding:0 28px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="background:linear-gradient(135deg,#f1f4f8 0%,#e1e9f4 100%);border-left:3px solid #111162;border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;color:#3c3c5d;line-height:1.6;">' +
    'Uw antwoorden worden lokaal in uw browser opgeslagen. Op een ander apparaat begint u opnieuw. Wist u uw browsergegevens, dan zijn conceptantwoorden weg.' +
    '</td></tr></table></td></tr>' +

    // Contact
    '<tr><td style="padding:0 28px 16px;"><p style="margin:0;color:#7a7a96;font-size:12px;line-height:1.6;">Vragen? ' + escHtml(contactPerson) + ' via <a href="mailto:' + escHtml(contactEmail) + '" style="color:#111162;font-weight:500;text-decoration:none;">' + escHtml(contactEmail) + '</a></p></td></tr>' +

    // Divider
    '<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e1e9f4;font-size:0;">&nbsp;</td></tr></table></td></tr>' +

    // Closing
    '<tr><td style="padding:16px 28px 24px;">' +
    '<p style="margin:0 0 4px;color:#3c3c5d;font-size:13px;line-height:1.6;">Met vriendelijke groet,</p>' +
    '<p style="margin:0;color:#1d1d30;font-size:13px;font-weight:600;line-height:1.6;">' + escHtml(senderName) + '</p>' +
    '</td></tr>' +

    '</table></td>' + // content area

    '</tr></table>' + // sidebar + content
    '</td></tr></table>' + // outline stroke

    // Footer outside card
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;"><tr><td style="padding:16px 20px;text-align:center;">' +
    '<p style="margin:0;color:#7a7a96;font-size:11px;line-height:1.5;">U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitoring Cultureel Talent naar de Top 2026.</p>' +
    '</td></tr></table>' +

    '</td></tr></table></body></html>';
}

/**
 * HTML-escape a string
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Return a JSON response (reuse from your existing code if available)
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
