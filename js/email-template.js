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
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:linear-gradient(135deg, #8caef4 0%, #111162 100%); border-radius:10px; box-shadow:0 4px 12px rgba(17,17,98,0.3);">
                                <a href="${surveyUrl}" target="_blank" style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;">${ctaText}</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Preview link -->
                      <tr>
                        <td style="padding: 0 28px 24px;" align="center">
                          <a href="${previewUrl}" target="_blank" style="color:#3c3c5d; font-size:12px; text-decoration:none; opacity:0.7;">${previewLinkText}</a>
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
  // Expose on window
  // ---------------------------------------------------------------------------

  window.EmailTemplate = {
    buildEmailHtml: buildEmailHtml,
    buildPlainText: buildPlainText,
    DEFAULTS: DEFAULTS
  };

})();
