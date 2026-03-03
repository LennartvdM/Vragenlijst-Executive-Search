/**
 * Shared Email Template Builder
 *
 * Ported from scripts/gas-email-function.js for client-side use.
 * Exposes window.EmailTemplate with buildEmailHtml() and buildPlainText().
 * Used by both email-admin.js and email-manual.js.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str || '';
    return el.innerHTML;
  }

  function replaceTextPlaceholders(text, vars) {
    return text
      .replace(/\{naam\}/g, vars.naam)
      .replace(/\{deadline\}/g, vars.deadline)
      .replace(/\{contactPerson\}/g, vars.contactPerson)
      .replace(/\{contactEmail\}/g, vars.contactEmail)
      .replace(/\{code\}/g, vars.code);
  }

  // ---------------------------------------------------------------------------
  // Default text fields (same as email-admin.js / gas-email-function.js)
  // ---------------------------------------------------------------------------

  const DEFAULTS = {
    subject: 'Monitoring Cultureel Talent naar de Top 2026',
    senderName: 'Commissie Monitoring Talent naar de Top',
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

  // ---------------------------------------------------------------------------
  // Build HTML email
  // ---------------------------------------------------------------------------

  /**
   * @param {Object} recipient  { name, code }
   * @param {Object} settings   Full settings object (subject, surveyUrl, previewUrl, deadline, senderName, contactPerson, contactEmail, heading, introText, ...)
   * @returns {string} Complete HTML email string
   */
  function buildEmailHtml(recipient, settings) {
    const s = settings || {};
    const naam = esc(recipient?.name || '[naam]');
    const rawCode = recipient?.code || 'ABC-DEF';
    const code = esc(rawCode);
    const deadline = esc(s.deadline || '[deadline]');
    const baseSurveyUrl = s.surveyUrl || '#';
    const surveyUrl = baseSurveyUrl !== '#'
      ? esc(baseSurveyUrl + (baseSurveyUrl.includes('?') ? '&' : '?') + 'code=' + encodeURIComponent(rawCode))
      : '#';
    const previewUrl = esc(s.previewUrl || '#');
    const contactPerson = esc(s.contactPerson || '[contactpersoon]');
    const contactEmail = esc(s.contactEmail || '[email]');
    const senderName = esc(s.senderName || DEFAULTS.senderName);

    const vars = { naam, deadline, contactPerson, contactEmail, code };

    const heading = esc(s.heading || DEFAULTS.heading);
    const introHtml = esc(replaceTextPlaceholders(s.introText || DEFAULTS.introText, vars));
    const codeLabel = esc(s.codeLabel || DEFAULTS.codeLabel);
    const ctaText = esc(s.ctaText || DEFAULTS.ctaText);
    const previewLinkText = esc(s.previewLinkText || DEFAULTS.previewLinkText);
    const praktischHeading = esc(s.praktischHeading || DEFAULTS.praktischHeading);
    const privacyText = esc(s.privacyText || DEFAULTS.privacyText);
    const closingText = esc(s.closingText || DEFAULTS.closingText);
    const footerText = esc(s.footerText || DEFAULTS.footerText);

    // Build contact HTML with mailto link
    const contactRaw = s.contactText || DEFAULTS.contactText;
    const contactHtml = esc(replaceTextPlaceholders(contactRaw, vars))
      .replace(esc(contactEmail), `<a href="mailto:${contactEmail}" style="color:#111162; font-weight:500; text-decoration:none;">${contactEmail}</a>`);

    // Build checklist rows
    const checklistRaw = s.checklistItems || DEFAULTS.checklistItems;
    const checklistLines = checklistRaw.split('\n').map(l => l.trim()).filter(Boolean);
    const checklistHtml = checklistLines.map((item, i) => {
      const padding = i === checklistLines.length - 1 ? '3px 28px 16px 46px' : '3px 28px 3px 46px';
      return `<tr><td style="padding:${padding}; color:#3c3c5d; font-size:13px; line-height:1.6;"><span style="color:#111162; font-weight:700; margin-left:-18px; margin-right:8px;">&#10003;</span>${esc(item)}</td></tr>`;
    }).join('\n                      ');

    return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${esc(s.subject || DEFAULTS.subject)}</title>
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

        <!-- .container outline stroke -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#fafbfc; border-radius:18px; box-shadow: 0 8px 32px rgba(8,9,30,0.15), 0 2px 8px rgba(8,9,30,0.1);">
          <tr>
            <td style="padding: 6px;">

              <!-- .container inner — sidebar + content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px; overflow:hidden;">
                <tr>

                  <!-- .index sidebar strip (decorative) -->
                  <td width="48" style="width:48px; background: linear-gradient(180deg, rgba(140,174,244,0.2) 0%, rgba(225,233,244,0.35) 100%); vertical-align:top; border-radius:12px 0 0 12px;">
                    &nbsp;
                  </td>

                  <!-- .content area -->
                  <td style="background-color:#fafbfc; vertical-align:top; border-radius:0 12px 12px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                      <!-- Content header with progress dots -->
                      <tr>
                        <td style="padding: 20px 28px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td style="font-size:0; line-height:0;">
                              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#111162;margin-right:4px;">&nbsp;</span><!--
                              --><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;margin-right:4px;">&nbsp;</span><!--
                              --><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;margin-right:4px;">&nbsp;</span><!--
                              --><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;margin-right:4px;">&nbsp;</span><!--
                              --><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#adbcd2;">&nbsp;</span>
                            </td>
                          </tr></table>
                        </td>
                      </tr>

                      <!-- Step heading — h1 style -->
                      <tr>
                        <td style="padding: 20px 28px 8px;">
                          <h1 style="margin:0; color:#1d1d30; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif; font-size:24px; font-weight:600; line-height:1.3; letter-spacing:-0.3px;">
                            ${heading}
                          </h1>
                        </td>
                      </tr>

                      <!-- Subtitle -->
                      <tr>
                        <td style="padding: 0 28px 24px;">
                          <p style="margin:0; color:#7a7a96; font-size:15px; line-height:1.55; letter-spacing:0.01em;">
                            ${introHtml}
                          </p>
                        </td>
                      </tr>

                      <!-- Code box -->
                      <tr>
                        <td style="padding: 0 28px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border:2px solid #111162; border-radius:10px; background-color:#f1f4f8; padding:20px; text-align:center; box-shadow:0 4px 16px rgba(17,17,98,0.15);">
                                <p style="margin:0 0 6px; color:#7a7a96; font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:1px;">${codeLabel}</p>
                                <p style="margin:0; color:#111162; font-size:26px; font-weight:700; letter-spacing:5px; font-family:'SF Mono','Fira Code','Courier New',monospace;">${code}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- CTA button -->
                      <tr>
                        <td style="padding: 0 28px 8px;" align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${surveyUrl}" style="height:42px;v-text-anchor:middle;width:220px;" arcsize="24%" strokecolor="#111162" fillcolor="#111162">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;">${ctaText}</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td bgcolor="#111162" style="background:linear-gradient(135deg, #8caef4 0%, #111162 100%); border-radius:10px; box-shadow:0 4px 12px rgba(17,17,98,0.3);">
                                <a href="${surveyUrl}" target="_blank" style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;">${ctaText}</a>
                              </td>
                            </tr>
                          </table>
                          <!--<![endif]-->
                        </td>
                      </tr>

                      <!-- Preview link -->
                      <tr>
                        <td style="padding: 0 28px 24px;" align="center">
                          <a href="${previewUrl}" target="_blank" style="color:#3c3c5d; font-size:12px; text-decoration:underline;">${previewLinkText}</a>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e1e9f4; font-size:0;">&nbsp;</td></tr></table></td></tr>

                      <!-- Praktisch heading -->
                      <tr>
                        <td style="padding: 20px 28px 10px;">
                          <p style="margin:0; color:#1d1d30; font-size:14px; font-weight:600;">${praktischHeading}</p>
                        </td>
                      </tr>

                      <!-- Checklist items -->
                      ${checklistHtml}

                      <!-- Privacy info block -->
                      <tr>
                        <td style="padding: 0 28px 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:linear-gradient(135deg, #f1f4f8 0%, #e1e9f4 100%); border-left:3px solid #111162; border-radius:0 8px 8px 0; padding:12px 16px; font-size:13px; color:#3c3c5d; line-height:1.6;">
                                ${privacyText}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Contact -->
                      <tr>
                        <td style="padding: 0 28px 16px;">
                          <p style="margin:0; color:#7a7a96; font-size:12px; line-height:1.6;">
                            ${contactHtml}
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e1e9f4; font-size:0;">&nbsp;</td></tr></table></td></tr>

                      <!-- Closing -->
                      <tr>
                        <td style="padding: 16px 28px 24px;">
                          <p style="margin:0 0 4px; color:#3c3c5d; font-size:13px; line-height:1.6;">${closingText}</p>
                          <p style="margin:0; color:#1d1d30; font-size:13px; font-weight:600; line-height:1.6;">${senderName}</p>
                        </td>
                      </tr>

                    </table>
                  </td>

                </tr>
              </table>
              <!-- /.container inner -->

            </td>
          </tr>
        </table>
        <!-- /.container outline stroke -->

        <!-- Footer outside card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:16px 20px; text-align:center;">
              <p style="margin:0; color:#7a7a96; font-size:11px; line-height:1.5;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Build plain-text email (for mailto: links)
  // ---------------------------------------------------------------------------

  /**
   * @param {Object} recipient  { name, code }
   * @param {Object} settings   Full settings object
   * @returns {string} Plain-text email body
   */
  function buildPlainText(recipient, settings) {
    const s = settings || {};
    const naam = recipient?.name || '[naam]';
    const rawCode = recipient?.code || 'ABC-DEF';
    const deadline = s.deadline || '[deadline]';
    const baseSurveyUrl = s.surveyUrl || '';
    const surveyUrl = baseSurveyUrl
      ? baseSurveyUrl + (baseSurveyUrl.includes('?') ? '&' : '?') + 'code=' + encodeURIComponent(rawCode)
      : '';
    const previewUrl = s.previewUrl || '';
    const contactPerson = s.contactPerson || '[contactpersoon]';
    const contactEmail = s.contactEmail || '[email]';
    const senderName = s.senderName || DEFAULTS.senderName;

    const vars = { naam, deadline, contactPerson, contactEmail, code: rawCode };

    const introText = replaceTextPlaceholders(s.introText || DEFAULTS.introText, vars);
    const closingText = s.closingText || DEFAULTS.closingText;

    // Build checklist
    const checklistRaw = s.checklistItems || DEFAULTS.checklistItems;
    const checklistLines = checklistRaw.split('\n').map(l => l.trim()).filter(Boolean);
    const checklistText = checklistLines.map(item => '- ' + item).join('\n');

    // Build contact line
    const contactRaw = s.contactText || DEFAULTS.contactText;
    const contactLine = replaceTextPlaceholders(contactRaw, vars);

    let text = introText + '\n\n';
    text += (s.codeLabel || DEFAULTS.codeLabel) + ': ' + rawCode + '\n\n';
    if (surveyUrl) {
      text += 'Start de vragenlijst: ' + surveyUrl + '\n';
    }
    if (previewUrl) {
      text += 'Inkijkexemplaar: ' + previewUrl + '\n';
    }
    text += '\n';
    text += (s.praktischHeading || DEFAULTS.praktischHeading) + ':\n';
    text += checklistText + '\n\n';
    text += contactLine + '\n\n';
    text += closingText + '\n';
    text += senderName;

    return text;
  }

  // ---------------------------------------------------------------------------
  // Build .eml file (RFC 2822 + MIME multipart/alternative)
  // ---------------------------------------------------------------------------

  /**
   * Encode a UTF-8 string as RFC 2047 encoded-word for email headers.
   */
  function encodeRfc2047(str) {
    return '=?UTF-8?B?' + btoa(unescape(encodeURIComponent(str))) + '?=';
  }

  /**
   * Base64-encode a UTF-8 string with line wrapping at 76 chars (RFC 2045).
   */
  function base64Utf8(str) {
    const raw = btoa(unescape(encodeURIComponent(str)));
    return raw.match(/.{1,76}/g).join('\r\n');
  }

  /**
   * Encode a UTF-8 string as quoted-printable (RFC 2045).
   * More compatible with email clients than base64 for HTML content —
   * ASCII passes through unchanged so links remain intact.
   */
  function encodeQuotedPrintable(str) {
    const utf8 = unescape(encodeURIComponent(str));
    let result = '';
    let lineLen = 0;

    for (let i = 0; i < utf8.length; i++) {
      const c = utf8.charCodeAt(i);

      // Hard line break: \r\n or lone \n → CRLF
      if (c === 0x0D && i + 1 < utf8.length && utf8.charCodeAt(i + 1) === 0x0A) {
        result += '\r\n';
        lineLen = 0;
        i++;
        continue;
      }
      if (c === 0x0A) {
        result += '\r\n';
        lineLen = 0;
        continue;
      }

      // Printable ASCII (33-126) except '=' passes through; tab and space too
      let encoded;
      if ((c >= 33 && c <= 126 && c !== 61) || c === 9 || c === 32) {
        encoded = String.fromCharCode(c);
      } else {
        encoded = '=' + c.toString(16).toUpperCase().padStart(2, '0');
      }

      // Soft line break at 75 chars (leave room for trailing =)
      if (lineLen + encoded.length >= 76) {
        result += '=\r\n';
        lineLen = 0;
      }

      result += encoded;
      lineLen += encoded.length;
    }

    return result;
  }

  /**
   * Format a Date object as RFC 2822 date string for email headers.
   */
  function formatRfc2822Date(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = n => n < 10 ? '0' + n : '' + n;
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOff = Math.abs(offset);
    const tz = sign + pad(Math.floor(absOff / 60)) + pad(absOff % 60);
    return days[date.getDay()] + ', ' + date.getDate() + ' ' + months[date.getMonth()] + ' ' +
      date.getFullYear() + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' +
      pad(date.getSeconds()) + ' ' + tz;
  }

  /**
   * Build a .eml file string that Outlook/Thunderbird/Apple Mail can open
   * as a ready-to-send draft with full HTML formatting.
   *
   * @param {Object} recipient  { name, email, code }
   * @param {Object} settings   Full settings object
   * @returns {string} Complete .eml file content
   */
  function buildEml(recipient, settings) {
    const s = settings || {};
    const subject = s.subject || DEFAULTS.subject;
    const toEmail = recipient?.email || '';
    const toName = recipient?.name || '';
    const senderName = s.senderName || DEFAULTS.senderName;
    const contactEmail = s.contactEmail || '';

    const htmlBody = buildEmailHtml(recipient, settings);
    const textBody = buildPlainText(recipient, settings);

    const boundary = '----=_Part_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const messageId = '<' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 10) + '@monitoringtalent.local>';

    // Format "To" with display name if available
    const toHeader = toName
      ? encodeRfc2047(toName) + ' <' + toEmail + '>'
      : toEmail;

    // Format "From" — use contact email if available, otherwise placeholder
    const fromEmail = contactEmail || 'noreply@monitoringtalent.local';
    const fromHeader = senderName
      ? encodeRfc2047(senderName) + ' <' + fromEmail + '>'
      : fromEmail;

    const lines = [
      'Date: ' + formatRfc2822Date(new Date()),
      'From: ' + fromHeader,
      'To: ' + toHeader,
      'Subject: ' + encodeRfc2047(subject),
      'Message-ID: ' + messageId,
      'MIME-Version: 1.0',
      'X-Unsent: 1',
      'Content-Type: multipart/alternative; boundary="' + boundary + '"',
      '',
      'This is a multi-part message in MIME format.',
      '',
      '--' + boundary,
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      encodeQuotedPrintable(textBody),
      '',
      '--' + boundary,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      encodeQuotedPrintable(htmlBody),
      '',
      '--' + boundary + '--',
      ''
    ];

    return lines.join('\r\n');
  }

  // ---------------------------------------------------------------------------
  // Expose on window
  // ---------------------------------------------------------------------------

  window.EmailTemplate = {
    buildEmailHtml: buildEmailHtml,
    buildPlainText: buildPlainText,
    buildEml: buildEml,
    DEFAULTS: DEFAULTS
  };

})();
