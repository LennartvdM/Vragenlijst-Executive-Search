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
    '<style>body,table,td{margin:0;padding:0}body{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse}</style>' +
    '</head>' +
    '<body style="margin:0;padding:0;background-color:#f3ece2;font-family:\'Segoe UI\',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ece2;">' +
    '<tr><td align="center" style="padding:40px 20px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;">' +

    // Header
    '<tr><td style="background-color:#111162;padding:40px 40px 32px;text-align:center;">' +
    '<h1 style="margin:0;color:#ffffff;font-family:\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.3;">Monitoring Cultureel Talent<br>naar de Top</h1>' +
    '<p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;">2026</p>' +
    '</td></tr>' +

    // Body
    '<tr><td style="padding:40px 40px 32px;">' +
    '<p style="margin:0 0 20px;color:#1d1d30;font-size:16px;line-height:1.6;">Geachte ' + escHtml(naam) + ',</p>' +
    '<p style="margin:0 0 28px;color:#3c3c5d;font-size:15px;line-height:1.7;">Wij vragen u de monitoring in te vullen v&oacute;&oacute;r <strong style="color:#1d1d30;">' + escHtml(deadline) + '</strong>.</p>' +

    // Code box
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">' +
    '<tr><td style="background-color:#e1e9f4;border-radius:12px;padding:24px;text-align:center;">' +
    '<p style="margin:0 0 8px;color:#7a7a96;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Uw toegangscode</p>' +
    '<p style="margin:0;color:#111162;font-size:28px;font-weight:700;letter-spacing:4px;font-family:\'SF Mono\',\'Courier New\',monospace;">' + escHtml(code) + '</p>' +
    '</td></tr></table>' +

    // CTA button
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">' +
    '<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="background-color:#111162;border-radius:10px;">' +
    '<a href="' + escHtml(surveyUrl) + '" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">Ga naar de vragenlijst &rarr;</a>' +
    '</td></tr></table></td></tr></table>' +

    // Preview link
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px;">' +
    '<tr><td align="center"><a href="' + escHtml(previewUrl) + '" target="_blank" style="color:#111162;font-size:14px;font-weight:500;text-decoration:underline;">Bekijk inkijkexemplaar &rarr;</a></td></tr></table>' +

    // Divider
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td style="border-top:1px solid #e1e9f4;">&nbsp;</td></tr></table>' +

    // Practical
    '<p style="margin:0 0 12px;color:#1d1d30;font-size:15px;font-weight:600;">Praktisch</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="padding:4px 0;color:#3c3c5d;font-size:14px;line-height:1.6;">&#8226;&nbsp;Duurt 20-30 minuten, u kunt tussendoor stoppen</td></tr>' +
    '<tr><td style="padding:4px 0;color:#3c3c5d;font-size:14px;line-height:1.6;">&#8226;&nbsp;U kunt meerdere keren verzenden, de laatste versie telt</td></tr>' +
    '<tr><td style="padding:4px 0;color:#3c3c5d;font-size:14px;line-height:1.6;">&#8226;&nbsp;Houd uw personeelscijfers bij de hand (totaal, top, subtop, per herkomst Buiten-Europa)</td></tr>' +
    '<tr><td style="padding:4px 0;color:#3c3c5d;font-size:14px;line-height:1.6;">&#8226;&nbsp;Uw voortgang is gekoppeld aan uw apparaat, niet aan uw code</td></tr>' +
    '</table>' +

    // Privacy
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 28px;">' +
    '<tr><td style="background-color:#f1f4f8;border-radius:10px;padding:20px 24px;">' +
    '<p style="margin:0 0 10px;color:#3c3c5d;font-size:14px;line-height:1.7;">Uw antwoorden worden beveiligd opgeslagen in uw browser, lokaal op uw apparaat. Hierdoor kunt u tussendoor stoppen en later verdergaan, maar:</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="padding:3px 0;color:#3c3c5d;font-size:13px;line-height:1.6;">&#8226;&nbsp;Op een ander apparaat begint u met een leeg formulier.</td></tr>' +
    '<tr><td style="padding:3px 0;color:#3c3c5d;font-size:13px;line-height:1.6;">&#8226;&nbsp;Als u uw browsergegevens wist, zijn uw conceptantwoorden weg.</td></tr>' +
    '<tr><td style="padding:3px 0;color:#3c3c5d;font-size:13px;line-height:1.6;">&#8226;&nbsp;Ieder formulier ontvangen wij zodra u verzendt.</td></tr>' +
    '</table></td></tr></table>' +

    // Contact
    '<p style="margin:0 0 24px;color:#7a7a96;font-size:14px;line-height:1.6;">Bij vragen: ' + escHtml(contactPerson) + ' via <a href="mailto:' + escHtml(contactEmail) + '" style="color:#111162;text-decoration:underline;">' + escHtml(contactEmail) + '</a></p>' +

    // Closing
    '<p style="margin:0 0 4px;color:#3c3c5d;font-size:15px;line-height:1.6;">Met vriendelijke groet,</p>' +
    '<p style="margin:0;color:#1d1d30;font-size:15px;font-weight:600;line-height:1.6;">' + escHtml(senderName) + '</p>' +

    '</td></tr>' +

    // Footer
    '<tr><td style="background-color:#e1e9f4;padding:20px 40px;text-align:center;">' +
    '<p style="margin:0;color:#7a7a96;font-size:12px;line-height:1.5;">U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitoring Cultureel Talent naar de Top 2026.</p>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>';
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
