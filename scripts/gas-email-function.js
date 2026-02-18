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
  var logoSvg = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 57.614 67.051\'%3E%3Cg transform=\'translate(-741 -4156)\'%3E%3Cpath d=\'M48.72,105.206,30.284,91.174a2.438,2.438,0,0,0-2.951,0L8.9,105.205a3.1,3.1,0,0,1-4.337-.588L.634,99.459a3.094,3.094,0,0,1,.587-4.338l24.1-18.347a5.748,5.748,0,0,1,6.964,0l24.1,18.347a3.094,3.094,0,0,1,.59,4.336h0l-3.927,5.16a3.094,3.094,0,0,1-4.336.589h0\' transform=\'translate(740.999 4117.211)\' fill=\'%23ffffff\'/%3E%3Cpath d=\'M48.719,67.465,34.359,56.536a9.17,9.17,0,0,0-11.106,0L8.9,67.465a3.094,3.094,0,0,1-4.337-.588L.632,61.718a3.094,3.094,0,0,1,.587-4.336h0L16.239,45.95a20.75,20.75,0,0,1,25.136,0L56.394,57.384a3.1,3.1,0,0,1,.588,4.336h0l-3.924,5.157a3.1,3.1,0,0,1-4.337.588\' transform=\'translate(741 4134.599)\' fill=\'%23ffffff\'/%3E%3Cpath d=\'M58.5,12.356A12.355,12.355,0,1,1,46.143,0h0A12.355,12.355,0,0,1,58.5,12.356\' transform=\'translate(723.664 4155.999)\' fill=\'%23ffffff\'/%3E%3C/g%3E%3C/svg%3E';

  return '<!DOCTYPE html>' +
    '<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + escHtml(subject) + '</title>' +
    '<style>body,table,td{margin:0;padding:0}body{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt}img{border:0;display:block}</style>' +
    '</head>' +
    '<body style="margin:0;padding:0;background-color:#f3ece2;font-family:\'Inter\',\'Segoe UI\',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ece2;">' +
    '<tr><td align="center" style="padding:40px 20px;">' +

    // Outline stroke wrapper (simulates ::before outline)
    '<table role="presentation" width="612" cellpadding="0" cellspacing="0" style="max-width:612px;background-color:#fafbfc;border-radius:22px;box-shadow:0 8px 32px rgba(8,9,30,0.15),0 2px 8px rgba(8,9,30,0.1);">' +
    '<tr><td style="padding:6px;">' +

    // Inner card
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafbfc;border-radius:16px;overflow:hidden;">' +

    // Header — matches .login-header gradient
    '<tr><td style="background:linear-gradient(135deg,#8caef4 0%,#111162 100%);padding:40px 32px;text-align:center;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td align="center" style="padding-bottom:16px;">' +
    // Logo icon — frosted glass container like .logo-icon
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">' +
    '<tr><td style="width:56px;height:64px;background-color:rgba(255,255,255,0.25);border-radius:12px;text-align:center;vertical-align:middle;">' +
    '<img src="' + logoSvg + '" width="38" height="38" alt="" style="display:inline-block;width:38px;height:38px;opacity:0.87;">' +
    '</td></tr></table>' +
    '</td></tr>' +
    '<tr><td align="center">' +
    '<h1 style="margin:0 0 8px;color:rgba(255,255,255,0.87);font-family:\'Inter\',\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;line-height:1.3;">Monitoring Cultureel Talent naar&nbsp;de&nbsp;Top</h1>' +
    // Year badge — white pill like .year-badge
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>' +
    '<td style="background-color:rgba(255,255,255,0.95);border-radius:20px;padding:6px 18px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">' +
    '<span style="color:#1d1d30;font-family:\'Inter\',\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;">2026</span>' +
    '</td></tr></table>' +
    '</td></tr>' +
    '</table></td></tr>' +

    // Body
    '<tr><td style="padding:32px 32px 28px;">' +
    '<p style="margin:0 0 20px;color:#1d1d30;font-size:16px;line-height:1.6;">Geachte ' + escHtml(naam) + ',</p>' +
    '<p style="margin:0 0 28px;color:#3c3c5d;font-size:14.5px;line-height:1.7;">Wij vragen u de monitoring in te vullen v&oacute;&oacute;r <strong style="color:#1d1d30;font-weight:600;">' + escHtml(deadline) + '</strong>.</p>' +

    // Code card — styled like .option-card.selected
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">' +
    '<tr><td style="border:2px solid #111162;border-radius:10px;background-color:#f1f4f8;padding:24px;text-align:center;box-shadow:0 4px 16px rgba(17,17,98,0.15);">' +
    '<p style="margin:0 0 8px;color:#7a7a96;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Uw toegangscode</p>' +
    '<p style="margin:0;color:#111162;font-size:28px;font-weight:700;letter-spacing:5px;font-family:\'SF Mono\',\'Fira Code\',\'Courier New\',monospace;">' + escHtml(code) + '</p>' +
    '</td></tr></table>' +

    // CTA button — matches .btn-primary
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">' +
    '<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="background:linear-gradient(135deg,#8caef4 0%,#111162 100%);border-radius:10px;box-shadow:0 4px 12px rgba(17,17,98,0.3);">' +
    '<a href="' + escHtml(surveyUrl) + '" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Ga naar de vragenlijst &rarr;</a>' +
    '</td></tr></table></td></tr></table>' +

    // Preview link — matches .preview-link
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">' +
    '<tr><td align="center"><a href="' + escHtml(previewUrl) + '" target="_blank" style="color:#3c3c5d;font-size:12px;font-weight:400;text-decoration:none;opacity:0.7;">Bekijk inkijkexemplaar &rarr;</a></td></tr></table>' +

    // Divider
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="border-top:1px solid #e1e9f4;font-size:0;line-height:0;">&nbsp;</td></tr></table>' +

    // Practical — checkmarks like .login-info li
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td>' +
    '<p style="margin:0 0 12px;color:#1d1d30;font-size:15px;font-weight:600;">Praktisch</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="padding:5px 0 5px 24px;color:#3c3c5d;font-size:14px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-24px;margin-right:10px;">&check;</span>Duurt 20&#8211;30 minuten, u kunt tussendoor stoppen</td></tr>' +
    '<tr><td style="padding:5px 0 5px 24px;color:#3c3c5d;font-size:14px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-24px;margin-right:10px;">&check;</span>U kunt meerdere keren verzenden, de laatste versie telt</td></tr>' +
    '<tr><td style="padding:5px 0 5px 24px;color:#3c3c5d;font-size:14px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-24px;margin-right:10px;">&check;</span>Houd uw personeelscijfers bij de hand</td></tr>' +
    '<tr><td style="padding:5px 0 5px 24px;color:#3c3c5d;font-size:14px;line-height:1.6;"><span style="color:#111162;font-weight:700;margin-left:-24px;margin-right:10px;">&check;</span>Uw voortgang is gekoppeld aan uw apparaat, niet aan uw code</td></tr>' +
    '</table></td></tr></table>' +

    // Privacy — matches .info-block (border-left + sand-light bg)
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">' +
    '<tr><td style="background-color:#f1f4f8;border-left:3px solid #111162;border-radius:0 6px 6px 0;padding:16px 20px;">' +
    '<p style="margin:0 0 10px;color:#3c3c5d;font-size:13.5px;line-height:1.6;">Uw antwoorden worden opgeslagen in uw browser, lokaal op uw apparaat. U kunt tussendoor stoppen en later verdergaan, maar:</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="padding:3px 0;color:#3c3c5d;font-size:13px;line-height:1.6;">&#8226;&nbsp;Op een ander apparaat begint u met een leeg formulier.</td></tr>' +
    '<tr><td style="padding:3px 0;color:#3c3c5d;font-size:13px;line-height:1.6;">&#8226;&nbsp;Als u uw browsergegevens wist, zijn uw conceptantwoorden weg.</td></tr>' +
    '<tr><td style="padding:3px 0;color:#3c3c5d;font-size:13px;line-height:1.6;">&#8226;&nbsp;Ieder formulier ontvangen wij zodra u verzendt.</td></tr>' +
    '</table></td></tr></table>' +

    // Contact
    '<p style="margin:0 0 24px;color:#3c3c5d;font-size:13px;line-height:1.6;">Nog vragen? Neem contact op met ' + escHtml(contactPerson) + ' via <a href="mailto:' + escHtml(contactEmail) + '" style="color:#111162;font-weight:500;text-decoration:none;">' + escHtml(contactEmail) + '</a></p>' +

    // Divider
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="border-top:1px solid #e1e9f4;font-size:0;line-height:0;">&nbsp;</td></tr></table>' +

    // Closing
    '<p style="margin:0 0 4px;color:#3c3c5d;font-size:14px;line-height:1.6;">Met vriendelijke groet,</p>' +
    '<p style="margin:0;color:#1d1d30;font-size:14px;font-weight:600;line-height:1.6;">' + escHtml(senderName) + '</p>' +

    '</td></tr>' +

    // Footer — sidebar gradient style
    '<tr><td style="background:linear-gradient(180deg,rgba(140,174,244,0.15) 0%,rgba(225,233,244,0.3) 100%);padding:20px 32px;text-align:center;">' +
    '<p style="margin:0;color:#7a7a96;font-size:12px;line-height:1.5;">U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitoring Cultureel Talent naar de Top 2026.</p>' +
    '</td></tr>' +

    '</table></td></tr></table>' + // inner card + outline stroke
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
