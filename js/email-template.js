/**
 * Shared Email Template Builder — Monitor Executive Search
 *
 * Exposes window.EmailTemplate with buildEmailHtml(), buildPlainText(), buildEml().
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
      .replace(/\{jaar\}/g, vars.jaar)
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
  function textToHtml(text, style) {
    if (!text) return '';
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map(p => {
      const lines = esc(p.trim()).replace(/\n/g, '<br>');
      return `<p style="${style}">${lines}</p>`;
    }).join('\n');
  }

  // ---------------------------------------------------------------------------
  // Default text fields — Executive Search Monitor
  // ---------------------------------------------------------------------------

  const DEFAULTS = {
    subject: 'Monitor Executive Search \u2014 Talent naar de Top',
    senderName: 'Talent naar de Top',
    heading: 'Monitor Executive Search',
    greeting: 'Beste {naam}',
    bodyText: 'Als ondertekenaar van de Executive Search Code zet u zich samen met Talent naar de Top in voor meer diversiteit in de (sub)top van organisaties.\n\nWat representatie van vrouwen in de top betreft heeft de effectiviteit van het Charter Talent naar de Top zich al bewezen. Charterondertekenaars zijn \'koploper\' en u levert daar een zeer belangrijke bijdrage aan.\n\nWij zijn benieuwd naar uw resultaten van het afgelopen kalenderjaar. Daarom nodigen wij u graag uit om de Executive Search Monitor over 2024 in te vullen.\n\nVia de button hieronder komt u bij de vragenlijst.\nWij vragen u deze in \u00e9\u00e9n keer volledig in te vullen. Uw antwoorden worden niet opgeslagen als u tussentijds stopt. Wilt u de vragen eerst inzien ter voorbereiding? Klik hier voor het overzicht.',
    section1Heading: '',
    section1Text: '',
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
    socialYoutube: '',
    footerText: 'U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitor Executive Search.',
    webVersionUrl: '',
    unsubscribeUrl: '',
    profileUrl: '',
    privacyUrl: ''
  };

  const UITNODIGING_V2_DEFAULTS = {
    subject: 'Monitor Executive Search \u2014 Talent naar de Top',
    senderName: 'Talent naar de Top',
    heading: 'Monitor Executive Search',
    greeting: 'Beste {naam}',
    bodyText: 'Als ondertekenaar van de Executive Search Code nodigen wij u uit om de Monitor Executive Search over {jaar} in te vullen.',
    section1Heading: 'Wat vragen we?',
    section1Text: 'Via onderstaande button komt u bij de vragenlijst. Uw antwoorden worden automatisch opgeslagen, dus u kunt de vragenlijst op elk gewenst moment onderbreken en later verder gaan. U kunt de vragenlijst ook opnieuw invullen \u2014 uw laatst ingevoerde antwoorden tellen.\n\nWilt u de vragen vooraf inzien? Klik hier voor het overzicht.',
    ctaText: 'Naar de vragenlijst',
    ctaNote: '',
    deadlineContactText: 'Invullen kan tot en met {deadline}. Bij vragen kunt u contact opnemen met {contactPerson} via {contactPhone} of {contactEmail}.',
    section2Heading: 'Wat gebeurt er met de resultaten?',
    section2Text: 'De Commissie Monitoring beoordeelt de resultaten en stelt een algemene rapportage op over de voortgang van alle deelnemende bureaus. U ontvangt deze rapportage na afloop. Uw individuele gegevens worden strikt vertrouwelijk behandeld en niet herleidbaar gedeeld.',
    section3Heading: 'Topvrouw van het Jaar',
    section3ImageUrl: '',
    section3Text: 'Welke vrouwelijke bestuurder zou volgens u in aanmerking moeten komen voor de award Topvrouw van het Jaar? U kunt uw suggestie meegeven in de vragenlijst.',
    closingText: 'Alvast hartelijk dank voor uw medewerking.\n\nMet vriendelijke groet,',
    signer1Name: '',
    signer1Title: '',
    signer2Name: '',
    signer2Title: '',
    address: 'Sandbergplein 24\n1181 ZX Amstelveen',
    phone: '',
    website: 'talentnaardetop.nl',
    socialTwitter: '',
    socialLinkedin: '',
    socialYoutube: '',
    footerText: 'U ontvangt deze e-mail omdat uw organisatie deelneemt aan de Monitor Executive Search.',
    webVersionUrl: '',
    unsubscribeUrl: '',
    profileUrl: '',
    privacyUrl: ''
  };

  const RESET_DEFAULTS = {
    subject: 'Uw vragenlijst is gereset \u2014 Monitor Executive Search',
    senderName: 'Talent naar de Top',
    heading: 'Uw vragenlijst is gereset',
    greeting: 'Beste {naam}',
    bodyText: 'Uw eerdere inzending voor de Monitor Executive Search is gereset. U kunt de vragenlijst opnieuw invullen v\u00f3\u00f3r {deadline}.',
    section1Heading: '',
    section1Text: '',
    ctaText: 'Vragenlijst opnieuw invullen',
    ctaNote: '',
    deadlineContactText: 'Bij vragen kunt u contact opnemen met {contactPerson} via {contactPhone} of {contactEmail}.',
    section2Heading: '',
    section2Text: '',
    section3Heading: '',
    section3ImageUrl: '',
    section3Text: '',
    closingText: 'Met vriendelijke groet,',
    signer1Name: '',
    signer1Title: '',
    signer2Name: '',
    signer2Title: '',
    address: 'Sandbergplein 24\n1181 ZX Amstelveen\nNederland',
    phone: '',
    website: 'www.talentnaardetop.nl',
    socialTwitter: '',
    socialLinkedin: '',
    socialYoutube: '',
    footerText: 'U ontvangt deze e-mail omdat uw eerdere inzending is gereset voor de Monitor Executive Search.',
    webVersionUrl: '',
    unsubscribeUrl: '',
    profileUrl: '',
    privacyUrl: ''
  };

  const TEMPLATE_PRESETS = {
    uitnodiging: { label: 'Uitnodiging', defaults: DEFAULTS },
    'uitnodiging-v2': { label: 'Uitnodiging (nieuw)', defaults: UITNODIGING_V2_DEFAULTS },
    reset: { label: 'Reset', defaults: RESET_DEFAULTS }
  };

  // ---------------------------------------------------------------------------
  // Brand colors
  // ---------------------------------------------------------------------------

  const C = {
    terracotta: '#111162',
    terracottaDark: '#07072f',
    sand: '#e1e9f4',
    white: '#ffffff',
    text: '#1d1d30',
    textLight: '#3c3c5d',
    textMuted: '#7a7a96',
    border: '#c5d6f8',
    footerBg: '#f1f4f8'
  };

  // ---------------------------------------------------------------------------
  // Build HTML email
  // ---------------------------------------------------------------------------

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
    const contactPerson = esc(s.contactPerson || '[contactpersoon]');
    const contactEmail = esc(s.contactEmail || '[email]');
    const contactPhone = esc(s.contactPhone || '[telefoon]');
    const senderName = esc(s.senderName || DEFAULTS.senderName);
    const jaar = esc(s.jaar || '[jaar]');

    const vars = { naam, jaar, deadline, contactPerson, contactEmail, contactPhone, code };

    // Resolve all text fields with placeholders
    const heading = esc(s.heading || DEFAULTS.heading);
    const greetingText = esc(replaceTextPlaceholders(s.greeting || DEFAULTS.greeting, vars));
    const bodyRaw = replaceTextPlaceholders(s.bodyText || DEFAULTS.bodyText, vars);
    const ctaText = esc(s.ctaText || DEFAULTS.ctaText);
    const ctaNote = esc(s.ctaNote || '');
    const deadlineContactRaw = replaceTextPlaceholders(s.deadlineContactText || DEFAULTS.deadlineContactText, vars);
    const section1Heading = esc(s.section1Heading || '');
    const section1Raw = replaceTextPlaceholders(s.section1Text || '', vars);
    const section2Heading = esc(s.section2Heading || '');
    const section2Raw = replaceTextPlaceholders(s.section2Text || '', vars);
    const section3Heading = esc(s.section3Heading || '');
    const section3ImageUrl = esc(s.section3ImageUrl || '');
    const section3Raw = replaceTextPlaceholders(s.section3Text || '', vars);
    const closingRaw = replaceTextPlaceholders(s.closingText || DEFAULTS.closingText, vars);
    const signer1Name = esc(s.signer1Name || '');
    const signer1Title = esc(s.signer1Title || '');
    const signer2Name = esc(s.signer2Name || '');
    const signer2Title = esc(s.signer2Title || '');
    const addressRaw = s.address || DEFAULTS.address;
    const phone = esc(s.phone || '');
    const website = esc(s.website || DEFAULTS.website);
    const footerText = esc(s.footerText || DEFAULTS.footerText);
    const webVersionUrl = esc(s.webVersionUrl || '');
    const unsubscribeUrl = esc(s.unsubscribeUrl || '');
    const profileUrl = esc(s.profileUrl || '');
    const privacyUrl = esc(s.privacyUrl || '');
    const socialTwitter = esc(s.socialTwitter || '');
    const socialLinkedin = esc(s.socialLinkedin || '');
    const socialYoutube = esc(s.socialYoutube || '');

    // Build body paragraphs
    const pStyle = `margin:0 0 16px; color:${C.text}; font-size:15px; line-height:1.65; word-spacing:-0.5px;`;
    const bodyHtml = textToHtml(bodyRaw, pStyle);

    // Build deadline/contact HTML with mailto link
    const deadlineContactHtml = textToHtml(deadlineContactRaw, `margin:0 0 16px; color:${C.text}; font-size:14px; line-height:1.65; word-spacing:-0.5px;`)
      .replace(esc(contactEmail), `<a href="mailto:${contactEmail}" style="color:${C.terracotta}; text-decoration:none;">${contactEmail}</a>`);

    // Build closing paragraphs
    const closingHtml = textToHtml(closingRaw, `margin:0 0 4px; color:${C.text}; font-size:15px; line-height:1.65; word-spacing:-0.5px;`);

    // Build address lines
    const addressHtml = esc(addressRaw).replace(/\n/g, '<br>');

    // Pre-header links
    let preheaderHtml = '';
    if (webVersionUrl || unsubscribeUrl) {
      const links = [];
      if (webVersionUrl) links.push(`<a href="${webVersionUrl}" style="color:${C.textMuted}; text-decoration:underline;">Webversie</a>`);
      if (unsubscribeUrl) links.push(`<a href="${unsubscribeUrl}" style="color:${C.textMuted}; text-decoration:underline;">Afmelden</a>`);
      preheaderHtml = `
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:12px 0; text-align:center; font-size:12px; color:${C.textMuted};">
              ${links.join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
            </td>
          </tr>
        </table>`;
    }

    // Section 2 (optional)
    let section2Html = '';
    if (section2Heading) {
      const s2BodyHtml = textToHtml(section2Raw, `margin:0 0 16px; color:${C.text}; font-size:14px; line-height:1.65; word-spacing:-0.5px;`);
      section2Html = `
                      <!-- Divider -->
                      <tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.border}; font-size:0;">&nbsp;</td></tr></table></td></tr>
                      <!-- Section 2 -->
                      <tr>
                        <td style="padding:24px 32px 0;">
                          <h2 style="margin:0 0 12px; color:${C.text}; font-size:18px; font-weight:600; line-height:1.4;">${section2Heading}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 32px 16px;">
                          ${s2BodyHtml}
                        </td>
                      </tr>`;
    }

    // Section 3 (optional)
    let section3Html = '';
    if (section3Heading) {
      const s3BodyHtml = textToHtml(section3Raw, `margin:0 0 16px; color:${C.text}; font-size:14px; line-height:1.65; word-spacing:-0.5px;`);
      const imageHtml = section3ImageUrl
        ? `<tr><td style="padding:0 32px 16px;"><img src="${section3ImageUrl}" alt="" style="max-width:100%; height:auto; border-radius:8px; display:block;" /></td></tr>`
        : '';
      section3Html = `
                      <!-- Divider -->
                      <tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.border}; font-size:0;">&nbsp;</td></tr></table></td></tr>
                      <!-- Section 3 -->
                      <tr>
                        <td style="padding:24px 32px 0;">
                          <h2 style="margin:0 0 12px; color:${C.text}; font-size:18px; font-weight:600; line-height:1.4;">${section3Heading}</h2>
                        </td>
                      </tr>
                      ${imageHtml}
                      <tr>
                        <td style="padding:0 32px 16px;">
                          ${s3BodyHtml}
                        </td>
                      </tr>`;
    }

    // Section 1 (optional, between body and CTA)
    let section1Html = '';
    if (section1Heading) {
      const s1BodyHtml = textToHtml(section1Raw, `margin:0 0 16px; color:${C.text}; font-size:15px; line-height:1.65; word-spacing:-0.5px;`);
      section1Html = `
                      <!-- Section 1 -->
                      <tr>
                        <td style="padding:0 32px 0;">
                          <h2 style="margin:0 0 12px; color:${C.text}; font-size:18px; font-weight:600; line-height:1.4;">${section1Heading}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 32px 8px;">
                          ${s1BodyHtml}
                        </td>
                      </tr>`;
    }

    // CTA note (optional)
    const ctaNoteHtml = ctaNote
      ? `<tr><td style="padding:4px 32px 16px;" align="center"><p style="margin:0; color:${C.textLight}; font-size:13px; font-style:italic;">${ctaNote}</p></td></tr>`
      : '';

    // Signatures
    let signatureHtml = '';
    if (signer1Name || signer2Name) {
      const s1 = signer1Name ? `<td style="vertical-align:top; padding-right:24px;">
                              <p style="margin:0; color:${C.text}; font-size:14px; font-weight:600;">${signer1Name}</p>
                              ${signer1Title ? `<p style="margin:2px 0 0; color:${C.textLight}; font-size:13px;">${signer1Title}</p>` : ''}
                            </td>` : '';
      const s2 = signer2Name ? `<td style="vertical-align:top;">
                              <p style="margin:0; color:${C.text}; font-size:14px; font-weight:600;">${signer2Name}</p>
                              ${signer2Title ? `<p style="margin:2px 0 0; color:${C.textLight}; font-size:13px;">${signer2Title}</p>` : ''}
                            </td>` : '';
      signatureHtml = `
                      <tr>
                        <td style="padding:8px 32px 24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${s1}${s2}</tr></table>
                        </td>
                      </tr>`;
    }

    // Social links
    let socialHtml = '';
    const socialLinks = [];
    if (socialTwitter) socialLinks.push(`<a href="${socialTwitter}" style="display:inline-block; margin:0 6px; color:${C.terracotta}; text-decoration:none; font-size:13px; font-weight:500;">t</a>`);
    if (socialLinkedin) socialLinks.push(`<a href="${socialLinkedin}" style="display:inline-block; margin:0 6px; color:${C.terracotta}; text-decoration:none; font-size:13px; font-weight:500;">in</a>`);
    if (socialYoutube) socialLinks.push(`<a href="${socialYoutube}" style="display:inline-block; margin:0 6px; color:${C.terracotta}; text-decoration:none; font-size:13px; font-weight:500;">yt</a>`);
    if (socialLinks.length > 0) {
      socialHtml = `<tr><td style="padding:8px 0 0; text-align:center;">${socialLinks.join('')}</td></tr>`;
    }

    // Footer links
    let footerLinksHtml = '';
    const footerLinks = [];
    if (unsubscribeUrl) footerLinks.push(`<a href="${unsubscribeUrl}" style="color:${C.textMuted}; text-decoration:underline;">Afmelden</a>`);
    if (profileUrl) footerLinks.push(`<a href="${profileUrl}" style="color:${C.textMuted}; text-decoration:underline;">Profiel wijzigen</a>`);
    if (footerLinks.length > 0) {
      footerLinksHtml = `<tr><td style="padding:12px 0 0; text-align:center; font-size:12px;">${footerLinks.join('&nbsp;&nbsp;&nbsp;')}</td></tr>`;
    }

    // Copyright & privacy
    let copyrightHtml = `<p style="margin:0; color:${C.textMuted}; font-size:11px;">\u00A9${new Date().getFullYear()} ${senderName}`;
    if (privacyUrl) copyrightHtml += `&nbsp;&nbsp;|&nbsp;&nbsp;<a href="${privacyUrl}" style="color:${C.textMuted}; text-decoration:underline;">Privacy</a>`;
    copyrightHtml += '</p>';

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
<body style="margin:0; padding:0; background-color:${C.sand}; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.sand};">
    <tr>
      <td align="center" style="padding:20px 16px 40px;">

        <!-- Pre-header links -->
        ${preheaderHtml}

        <!-- Header -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:${C.terracotta}; border-radius:12px 12px 0 0;">
          <tr>
            <td style="padding:32px 32px 28px; text-align:center;">
              <p style="margin:0 0 4px; color:rgba(255,255,255,0.85); font-size:14px; font-weight:500; letter-spacing:0.3px;">${senderName}</p>
              <h1 style="margin:0; color:${C.white}; font-size:26px; font-weight:700; line-height:1.3; letter-spacing:-0.3px;">
                ${heading}
              </h1>
            </td>
          </tr>
        </table>

        <!-- Content area -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:${C.white};">

                      <!-- Spacer -->
                      <tr><td style="height:8px;"></td></tr>

                      <!-- Greeting -->
                      <tr>
                        <td style="padding:24px 32px 16px;">
                          <p style="margin:0; color:${C.text}; font-size:15px; font-weight:600; line-height:1.5; word-spacing:-0.5px;">
                            ${greetingText}
                          </p>
                        </td>
                      </tr>

                      <!-- Body text -->
                      <tr>
                        <td style="padding:0 32px 8px;">
                          ${bodyHtml}
                        </td>
                      </tr>

                      ${section1Html}

                      <!-- CTA button -->
                      <tr>
                        <td style="padding:8px 32px 8px;" align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${surveyUrl}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="14%" strokecolor="${C.terracotta}" fillcolor="${C.terracotta}">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;">${ctaText}</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background-color:${C.terracotta}; border-radius:6px;">
                                <a href="${surveyUrl}" target="_blank" style="display:inline-block; padding:12px 32px; color:${C.white}; text-decoration:none; font-size:15px; font-weight:600; font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;">${ctaText}</a>
                              </td>
                            </tr>
                          </table>
                          <!--<![endif]-->
                        </td>
                      </tr>

                      ${ctaNoteHtml}

                      <!-- Spacer -->
                      <tr><td style="height:8px;"></td></tr>

                      <!-- Deadline / contact -->
                      <tr>
                        <td style="padding:8px 32px 24px;">
                          ${deadlineContactHtml}
                        </td>
                      </tr>

                      ${section2Html}
                      ${section3Html}

                      <!-- Closing -->
                      <tr>
                        <td style="padding:16px 32px 8px;">
                          ${closingHtml}
                        </td>
                      </tr>

                      ${signatureHtml}

        </table>
        <!-- /Content area -->

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:${C.footerBg}; border-radius:0 0 12px 12px; border-top:1px solid ${C.border};">
          <tr>
            <td style="padding:24px 32px; text-align:center;">
              <p style="margin:0 0 4px; color:${C.terracotta}; font-size:15px; font-weight:700;">${senderName}</p>
              ${socialHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${socialHtml}</table>` : ''}
              <p style="margin:12px 0 0; color:${C.textLight}; font-size:12px; line-height:1.6;">
                ${addressHtml}
              </p>
              ${phone ? `<p style="margin:4px 0 0; color:${C.textLight}; font-size:12px;">${phone}</p>` : ''}
              <p style="margin:4px 0 0; font-size:12px;">
                ${contactEmail ? `<a href="mailto:${contactEmail}" style="color:${C.terracotta}; text-decoration:none;">${contactEmail}</a>` : ''}
                ${contactEmail && website ? '&nbsp;&nbsp;' : ''}
                ${website ? `<a href="https://${website}" style="color:${C.terracotta}; text-decoration:none;">${website}</a>` : ''}
              </p>
            </td>
          </tr>
        </table>

        <!-- Bottom footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          ${footerLinksHtml}
          <tr>
            <td style="padding:12px 20px 0; text-align:center;">
              ${copyrightHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px; text-align:center;">
              <p style="margin:0; color:${C.textMuted}; font-size:11px; line-height:1.5;">
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
  // Build plain-text email
  // ---------------------------------------------------------------------------

  function buildPlainText(recipient, settings) {
    const s = settings || {};
    const naam = recipient?.name || '[naam]';
    const rawCode = recipient?.code || 'ABC-DEF';
    const deadline = s.deadline || '[deadline]';
    const baseSurveyUrl = s.surveyUrl || '';
    const surveyUrl = baseSurveyUrl
      ? baseSurveyUrl + (baseSurveyUrl.includes('?') ? '&' : '?') + 'code=' + encodeURIComponent(rawCode)
      : '';
    const contactPerson = s.contactPerson || '[contactpersoon]';
    const contactEmail = s.contactEmail || '[email]';
    const contactPhone = s.contactPhone || '[telefoon]';
    const senderName = s.senderName || DEFAULTS.senderName;
    const jaar = s.jaar || '[jaar]';

    const vars = { naam, jaar, deadline, contactPerson, contactEmail, contactPhone, code: rawCode };

    const greeting = replaceTextPlaceholders(s.greeting || DEFAULTS.greeting, vars);
    const bodyText = replaceTextPlaceholders(s.bodyText || DEFAULTS.bodyText, vars);
    const closingText = replaceTextPlaceholders(s.closingText || DEFAULTS.closingText, vars);
    const deadlineContactText = replaceTextPlaceholders(s.deadlineContactText || DEFAULTS.deadlineContactText, vars);

    let text = greeting + '\n\n';
    text += bodyText + '\n\n';

    // Section 1 (before CTA)
    const s1h = s.section1Heading || '';
    if (s1h) {
      text += s1h + '\n\n';
      text += replaceTextPlaceholders(s.section1Text || '', vars) + '\n\n';
    }

    if (surveyUrl) {
      text += (s.ctaText || DEFAULTS.ctaText) + ': ' + surveyUrl + '\n';
      if (s.ctaNote) text += s.ctaNote + '\n';
      text += '\n';
    }
    text += deadlineContactText + '\n\n';

    // Section 2
    const s2h = s.section2Heading || '';
    if (s2h) {
      text += '---\n\n';
      text += s2h + '\n\n';
      text += replaceTextPlaceholders(s.section2Text || '', vars) + '\n\n';
    }

    // Section 3
    const s3h = s.section3Heading || '';
    if (s3h) {
      text += '---\n\n';
      text += s3h + '\n\n';
      text += replaceTextPlaceholders(s.section3Text || '', vars) + '\n\n';
    }

    text += closingText + '\n';
    if (s.signer1Name) text += s.signer1Name + (s.signer1Title ? ', ' + s.signer1Title : '') + '\n';
    if (s.signer2Name) text += s.signer2Name + (s.signer2Title ? ', ' + s.signer2Title : '') + '\n';
    text += '\n--\n';
    text += senderName + '\n';
    if (s.address) text += s.address.replace(/\n/g, ', ') + '\n';
    if (s.phone) text += s.phone + '\n';
    if (s.contactEmail) text += s.contactEmail + '\n';
    if (s.website) text += s.website;

    return text;
  }

  // ---------------------------------------------------------------------------
  // Build .eml file (RFC 2822 + MIME multipart/alternative)
  // ---------------------------------------------------------------------------

  function encodeRfc2047(str) {
    return '=?UTF-8?B?' + btoa(unescape(encodeURIComponent(str))) + '?=';
  }

  function encodeQuotedPrintable(str) {
    const utf8 = unescape(encodeURIComponent(str));
    let result = '';
    let lineLen = 0;

    for (let i = 0; i < utf8.length; i++) {
      const c = utf8.charCodeAt(i);

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

      let encoded;
      if ((c >= 33 && c <= 126 && c !== 61) || c === 9 || c === 32) {
        encoded = String.fromCharCode(c);
      } else {
        encoded = '=' + c.toString(16).toUpperCase().padStart(2, '0');
      }

      if (lineLen + encoded.length >= 76) {
        result += '=\r\n';
        lineLen = 0;
      }

      result += encoded;
      lineLen += encoded.length;
    }

    return result;
  }

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

    const toHeader = toName
      ? encodeRfc2047(toName) + ' <' + toEmail + '>'
      : toEmail;

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
    DEFAULTS: DEFAULTS,
    UITNODIGING_V2_DEFAULTS: UITNODIGING_V2_DEFAULTS,
    RESET_DEFAULTS: RESET_DEFAULTS,
    TEMPLATE_PRESETS: TEMPLATE_PRESETS
  };

})();
