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
    var subject = params.subject || 'Monitor Executive Search \u2014 Talent naar de Top';
    var surveyUrl = params.surveyUrl || '';
    var deadline = params.deadline || '';
    var contactPerson = params.contactPerson || '';
    var contactEmail = params.contactEmail || '';
    var contactPhone = params.contactPhone || '';
    var senderName = params.senderName || 'Talent naar de Top';

    // Editable mail text fields (with defaults matching the newsletter template)
    var textFields = {
      heading: params.heading || 'Monitor Executive Search',
      greeting: params.greeting || 'Beste {naam}',
      bodyText: params.bodyText || '',
      ctaText: params.ctaText || 'Naar de vragenlijst',
      ctaNote: params.ctaNote || '',
      deadlineContactText: params.deadlineContactText || 'U kunt de vragenlijst invullen tot en met {deadline}. Bij vragen of problemen met het invullen kunt u contact opnemen met {contactPerson} via {contactPhone} of {contactEmail}.',
      section2Heading: params.section2Heading || '',
      section2Text: params.section2Text || '',
      section3Heading: params.section3Heading || '',
      section3ImageUrl: params.section3ImageUrl || '',
      section3Text: params.section3Text || '',
      closingText: params.closingText || 'Met vriendelijke groet,',
      signer1Name: params.signer1Name || '',
      signer1Title: params.signer1Title || '',
      signer2Name: params.signer2Name || '',
      signer2Title: params.signer2Title || '',
      address: params.address || 'Sandbergplein 24\n1181 ZX Amstelveen\nNederland',
      phone: params.phone || '',
      website: params.website || 'www.talentnaardetop.nl',
      footerText: params.footerText || 'U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitor Executive Search.',
      webVersionUrl: params.webVersionUrl || '',
      unsubscribeUrl: params.unsubscribeUrl || '',
      profileUrl: params.profileUrl || '',
      privacyUrl: params.privacyUrl || '',
      socialTwitter: params.socialTwitter || '',
      socialLinkedin: params.socialLinkedin || '',
      socialYoutube: params.socialYoutube || ''
    };

    if (!to) {
      return jsonResponse({ success: false, error: 'Geen e-mailadres opgegeven' });
    }

    // The surveyUrl is already personalized with ?code= by the Email CMS client.
    var personalSurveyUrl = surveyUrl;
    if (surveyUrl && code && surveyUrl.indexOf('code=') === -1) {
      personalSurveyUrl = surveyUrl + (surveyUrl.indexOf('?') >= 0 ? '&' : '?') + 'code=' + encodeURIComponent(code);
    }

    var htmlBody = buildEmailHtml(naam, code, subject, personalSurveyUrl, deadline, contactPerson, contactEmail, contactPhone, senderName, textFields);

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
 * Replace text placeholders with actual values
 */
function replaceTextPlaceholders(text, vars) {
  return text
    .replace(/\{naam\}/g, vars.naam)
    .replace(/\{deadline\}/g, vars.deadline)
    .replace(/\{contactPerson\}/g, vars.contactPerson)
    .replace(/\{contactEmail\}/g, vars.contactEmail)
    .replace(/\{contactPhone\}/g, vars.contactPhone)
    .replace(/\{code\}/g, vars.code);
}

/**
 * Convert newline-separated text to HTML paragraphs.
 * Double newline = new <p>, single newline = <br>.
 */
function textToHtmlGas(text, style) {
  if (!text) return '';
  var paragraphs = text.split(/\n\n+/);
  var result = '';
  for (var i = 0; i < paragraphs.length; i++) {
    var p = paragraphs[i].replace(/^\s+|\s+$/g, '');
    if (p) {
      result += '<p style="' + style + '">' + escHtml(p).replace(/\n/g, '<br>') + '</p>\n';
    }
  }
  return result;
}

/**
 * Build the HTML email body — Newsletter-style layout for Executive Search Monitor
 */
function buildEmailHtml(naam, code, subject, surveyUrl, deadline, contactPerson, contactEmail, contactPhone, senderName, textFields) {
  var tf = textFields || {};
  var vars = {
    naam: escHtml(naam),
    deadline: escHtml(deadline),
    contactPerson: escHtml(contactPerson),
    contactEmail: escHtml(contactEmail),
    contactPhone: escHtml(contactPhone),
    code: escHtml(code)
  };

  // Colors
  var terracotta = '#111162';
  var sand = '#e1e9f4';
  var white = '#ffffff';
  var text = '#1d1d30';
  var textLight = '#3c3c5d';
  var textMuted = '#7a7a96';
  var border = '#c5d6f8';
  var footerBg = '#f1f4f8';

  // Resolve text fields
  var heading = escHtml(tf.heading || 'Monitor Executive Search');
  var greetingText = escHtml(replaceTextPlaceholders(tf.greeting || 'Beste {naam}', vars));
  var bodyRaw = replaceTextPlaceholders(tf.bodyText || '', vars);
  var ctaText = escHtml(tf.ctaText || 'Naar de vragenlijst');
  var ctaNote = escHtml(tf.ctaNote || '');
  var deadlineContactRaw = replaceTextPlaceholders(tf.deadlineContactText || '', vars);
  var section2Heading = escHtml(tf.section2Heading || '');
  var section2Raw = replaceTextPlaceholders(tf.section2Text || '', vars);
  var section3Heading = escHtml(tf.section3Heading || '');
  var section3ImageUrl = escHtml(tf.section3ImageUrl || '');
  var section3Raw = replaceTextPlaceholders(tf.section3Text || '', vars);
  var closingRaw = replaceTextPlaceholders(tf.closingText || 'Met vriendelijke groet,', vars);
  var signer1Name = escHtml(tf.signer1Name || '');
  var signer1Title = escHtml(tf.signer1Title || '');
  var signer2Name = escHtml(tf.signer2Name || '');
  var signer2Title = escHtml(tf.signer2Title || '');
  var addressRaw = tf.address || '';
  var phone = escHtml(tf.phone || '');
  var website = escHtml(tf.website || 'www.talentnaardetop.nl');
  var footerText = escHtml(tf.footerText || '');
  var webVersionUrl = escHtml(tf.webVersionUrl || '');
  var unsubscribeUrl = escHtml(tf.unsubscribeUrl || '');
  var profileUrl = escHtml(tf.profileUrl || '');
  var privacyUrl = escHtml(tf.privacyUrl || '');

  var pStyle = 'margin:0 0 16px; color:' + text + '; font-size:15px; line-height:1.65; word-spacing:-0.5px;';
  var bodyHtml = textToHtmlGas(bodyRaw, pStyle);
  var deadlineContactHtml = textToHtmlGas(deadlineContactRaw, 'margin:0 0 16px; color:' + text + '; font-size:14px; line-height:1.65; word-spacing:-0.5px;');
  if (vars.contactEmail) {
    deadlineContactHtml = deadlineContactHtml.replace(
      vars.contactEmail,
      '<a href="mailto:' + vars.contactEmail + '" style="color:' + terracotta + '; text-decoration:none;">' + vars.contactEmail + '</a>'
    );
  }
  var closingHtml = textToHtmlGas(closingRaw, 'margin:0 0 4px; color:' + text + '; font-size:15px; line-height:1.65; word-spacing:-0.5px;');
  var addressHtml = escHtml(addressRaw).replace(/\n/g, '<br>');

  // Pre-header
  var preheaderHtml = '';
  if (webVersionUrl || unsubscribeUrl) {
    var links = [];
    if (webVersionUrl) links.push('<a href="' + webVersionUrl + '" style="color:' + textMuted + '; text-decoration:underline;">Webversie</a>');
    if (unsubscribeUrl) links.push('<a href="' + unsubscribeUrl + '" style="color:' + textMuted + '; text-decoration:underline;">Afmelden</a>');
    preheaderHtml = '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;"><tr><td style="padding:12px 0; text-align:center; font-size:12px; color:' + textMuted + ';">' + links.join('&nbsp;&nbsp;|&nbsp;&nbsp;') + '</td></tr></table>';
  }

  // Section 2
  var section2Html = '';
  if (section2Heading) {
    var s2Body = textToHtmlGas(section2Raw, 'margin:0 0 16px; color:' + text + '; font-size:14px; line-height:1.65; word-spacing:-0.5px;');
    section2Html = '<tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ' + border + '; font-size:0;">&nbsp;</td></tr></table></td></tr>' +
      '<tr><td style="padding:24px 32px 0;"><h2 style="margin:0 0 12px; color:' + text + '; font-size:18px; font-weight:600; line-height:1.4;">' + section2Heading + '</h2></td></tr>' +
      '<tr><td style="padding:0 32px 16px;">' + s2Body + '</td></tr>';
  }

  // Section 3
  var section3Html = '';
  if (section3Heading) {
    var s3Body = textToHtmlGas(section3Raw, 'margin:0 0 16px; color:' + text + '; font-size:14px; line-height:1.65; word-spacing:-0.5px;');
    var imgHtml = section3ImageUrl ? '<tr><td style="padding:0 32px 16px;"><img src="' + section3ImageUrl + '" alt="" style="max-width:100%; height:auto; border-radius:8px; display:block;" /></td></tr>' : '';
    section3Html = '<tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ' + border + '; font-size:0;">&nbsp;</td></tr></table></td></tr>' +
      '<tr><td style="padding:24px 32px 0;"><h2 style="margin:0 0 12px; color:' + text + '; font-size:18px; font-weight:600; line-height:1.4;">' + section3Heading + '</h2></td></tr>' +
      imgHtml +
      '<tr><td style="padding:0 32px 16px;">' + s3Body + '</td></tr>';
  }

  // CTA note
  var ctaNoteHtml = ctaNote ? '<tr><td style="padding:4px 32px 16px;" align="center"><p style="margin:0; color:' + textLight + '; font-size:13px; font-style:italic;">' + ctaNote + '</p></td></tr>' : '';

  // Signatures
  var signatureHtml = '';
  if (signer1Name || signer2Name) {
    var s1 = signer1Name ? '<td style="vertical-align:top; padding-right:24px;"><p style="margin:0; color:' + text + '; font-size:14px; font-weight:600;">' + signer1Name + '</p>' + (signer1Title ? '<p style="margin:2px 0 0; color:' + textLight + '; font-size:13px;">' + signer1Title + '</p>' : '') + '</td>' : '';
    var s2 = signer2Name ? '<td style="vertical-align:top;"><p style="margin:0; color:' + text + '; font-size:14px; font-weight:600;">' + signer2Name + '</p>' + (signer2Title ? '<p style="margin:2px 0 0; color:' + textLight + '; font-size:13px;">' + signer2Title + '</p>' : '') + '</td>' : '';
    signatureHtml = '<tr><td style="padding:8px 32px 24px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' + s1 + s2 + '</tr></table></td></tr>';
  }

  // Social links
  var socialHtml = '';
  var socialItems = [];
  if (tf.socialTwitter) socialItems.push('<a href="' + escHtml(tf.socialTwitter) + '" style="display:inline-block; margin:0 6px; color:' + terracotta + '; text-decoration:none; font-size:13px; font-weight:500;">t</a>');
  if (tf.socialLinkedin) socialItems.push('<a href="' + escHtml(tf.socialLinkedin) + '" style="display:inline-block; margin:0 6px; color:' + terracotta + '; text-decoration:none; font-size:13px; font-weight:500;">in</a>');
  if (tf.socialYoutube) socialItems.push('<a href="' + escHtml(tf.socialYoutube) + '" style="display:inline-block; margin:0 6px; color:' + terracotta + '; text-decoration:none; font-size:13px; font-weight:500;">yt</a>');
  if (socialItems.length > 0) {
    socialHtml = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0 0; text-align:center;">' + socialItems.join('') + '</td></tr></table>';
  }

  // Footer links
  var footerLinksHtml = '';
  var fLinks = [];
  if (unsubscribeUrl) fLinks.push('<a href="' + unsubscribeUrl + '" style="color:' + textMuted + '; text-decoration:underline;">Afmelden</a>');
  if (profileUrl) fLinks.push('<a href="' + profileUrl + '" style="color:' + textMuted + '; text-decoration:underline;">Profiel wijzigen</a>');
  if (fLinks.length > 0) {
    footerLinksHtml = '<tr><td style="padding:12px 0 0; text-align:center; font-size:12px;">' + fLinks.join('&nbsp;&nbsp;&nbsp;') + '</td></tr>';
  }

  // Copyright
  var year = new Date().getFullYear();
  var copyrightHtml = '<p style="margin:0; color:' + textMuted + '; font-size:11px;">\u00A9' + year + ' ' + escHtml(senderName);
  if (privacyUrl) copyrightHtml += '&nbsp;&nbsp;|&nbsp;&nbsp;<a href="' + privacyUrl + '" style="color:' + textMuted + '; text-decoration:underline;">Privacy</a>';
  copyrightHtml += '</p>';

  return '<!DOCTYPE html>' +
    '<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + escHtml(subject) + '</title>' +
    '<style>body,table,td{margin:0;padding:0}body{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt}img{border:0;display:block}</style>' +
    '</head>' +
    '<body style="margin:0;padding:0;background-color:' + sand + ';font-family:\'Inter\',\'Segoe UI\',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:' + sand + ';">' +
    '<tr><td align="center" style="padding:20px 16px 40px;">' +

    // Pre-header
    preheaderHtml +

    // Header
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:' + terracotta + '; border-radius:12px 12px 0 0;">' +
    '<tr><td style="padding:32px 32px 28px; text-align:center;">' +
    '<p style="margin:0 0 4px; color:rgba(255,255,255,0.85); font-size:14px; font-weight:500; letter-spacing:0.3px;">' + escHtml(senderName) + '</p>' +
    '<h1 style="margin:0; color:' + white + '; font-size:26px; font-weight:700; line-height:1.3; letter-spacing:-0.3px;">' + heading + '</h1>' +
    '</td></tr></table>' +

    // Content area
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:' + white + ';">' +
    '<tr><td style="height:8px;"></td></tr>' +

    // Greeting
    '<tr><td style="padding:24px 32px 16px;"><p style="margin:0; color:' + text + '; font-size:15px; font-weight:600; line-height:1.5; word-spacing:-0.5px;">' + greetingText + '</p></td></tr>' +

    // Body
    '<tr><td style="padding:0 32px 8px;">' + bodyHtml + '</td></tr>' +

    // CTA button
    '<tr><td style="padding:8px 32px 8px;" align="center">' +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="background-color:' + terracotta + '; border-radius:6px;">' +
    '<a href="' + escHtml(surveyUrl) + '" target="_blank" style="display:inline-block;padding:12px 32px;color:' + white + ';text-decoration:none;font-size:15px;font-weight:600;">' + ctaText + '</a>' +
    '</td></tr></table></td></tr>' +

    ctaNoteHtml +

    '<tr><td style="height:8px;"></td></tr>' +

    // Deadline/contact
    '<tr><td style="padding:8px 32px 24px;">' + deadlineContactHtml + '</td></tr>' +

    section2Html +
    section3Html +

    // Closing
    '<tr><td style="padding:16px 32px 8px;">' + closingHtml + '</td></tr>' +

    signatureHtml +

    '</table>' +

    // Footer
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:' + footerBg + '; border-radius:0 0 12px 12px; border-top:1px solid ' + border + ';">' +
    '<tr><td style="padding:24px 32px; text-align:center;">' +
    '<p style="margin:0 0 4px; color:' + terracotta + '; font-size:15px; font-weight:700;">' + escHtml(senderName) + '</p>' +
    socialHtml +
    '<p style="margin:12px 0 0; color:' + textLight + '; font-size:12px; line-height:1.6;">' + addressHtml + '</p>' +
    (phone ? '<p style="margin:4px 0 0; color:' + textLight + '; font-size:12px;">' + phone + '</p>' : '') +
    '<p style="margin:4px 0 0; font-size:12px;">' +
    (vars.contactEmail ? '<a href="mailto:' + vars.contactEmail + '" style="color:' + terracotta + '; text-decoration:none;">' + vars.contactEmail + '</a>' : '') +
    (vars.contactEmail && website ? '&nbsp;&nbsp;' : '') +
    (website ? '<a href="https://' + website + '" style="color:' + terracotta + '; text-decoration:none;">' + website + '</a>' : '') +
    '</p>' +
    '</td></tr></table>' +

    // Bottom footer
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">' +
    footerLinksHtml +
    '<tr><td style="padding:12px 20px 0; text-align:center;">' + copyrightHtml + '</td></tr>' +
    '<tr><td style="padding:8px 20px; text-align:center;"><p style="margin:0; color:' + textMuted + '; font-size:11px; line-height:1.5;">' + footerText + '</p></td></tr>' +
    '</table>' +

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
