# COPY.md — Alle geschreven tekst in de website

Dit document verzamelt alle user-facing copy, gegroepeerd per locatie/context.
Doel: snel tekst vinden en wijzigen zonder de hele codebase te doorzoeken.

---

## 1. Paginatitels (document.title)

| Context | Titel |
|---------|-------|
| Login | `Inloggen - Monitoring Cultureel Talent naar de Top 2025` |
| Survey | `Monitoring Cultureel Talent naar de Top 2025` |

Bron: `js/app.js` (regels 89, 168, 238, 510, 549, 607), `index.html` (regel 8)

---

## 2. Loginpagina (`index.html`)

### Header
- **H1**: `Monitoring Cultureel Talent naar de Top`
- **Jaarbadge**: `2025`

### Loginformulier
- **Intro**: `Welkom bij de jaarlijkse monitoring. Voer uw organisatiecode in om toegang te krijgen tot het monitoringsformulier.`
- **Demo banner**: `Demo modus - geen backend verbonden`
- **Label**: `Organisatiecode`
- **Placeholders**: `---` (beide velden)
- **Hint**: `Deze code heeft u per e-mail ontvangen`
- **Validatie**: `Vul uw organisatiecode in`
- **Foutmelding**: `Ongeldige organisatiecode. Controleer uw code en probeer opnieuw.`
- **Knop**: `Inloggen`
- **Knop loading**: `Controleren...`
- **Preview link**: `Bekijk inkijkexemplaar →`
- **Footer**: `Nog geen toegangscode ontvangen?` / `info@commissiemonitoring.nl` (JS-obfuscated, geen mailto-link)

### Over de monitoring (login-info)
- **H2**: `Over de monitoring`
- **Tekst**: `De monitoring Cultureel Talent naar de Top brengt jaarlijks de culturele diversiteit in de top van Nederlandse organisaties in kaart.`
- **Lijst**:
  - `Vul uw organisatiegegevens in`
  - `Beantwoord vragen over diversiteitsbeleid`
  - `De CEO/directeur ondertekent digitaal`

### Noscript
- `JavaScript is vereist om in te loggen.`
- `Schakel JavaScript in om door te gaan.`

Bron: `index.html`

---

## 3. Privacy Panel (`index.html`, regels 163-229)

### Deur (altijd zichtbaar)
- **H3**: `Waar is de cookiemelding?`
- **Lead**: `Die is er niet. Wat doen we wél?`

### Kamer (overlay)
- **H3**: `Waar is de cookiemelding?`
- **Tekst 1**: `Websites gebruiken cookies om informatie te onthouden tussen bezoeken. Vaak ook om u te volgen, of om te koppelen aan advertentienetwerken. Daar hoort een melding bij, en toestemming.`
- **Tekst 2**: `Wij gebruiken geen cookies. Nul. Uw browser heeft wel een andere opslagplek: localStorage. Die is van u, niet van ons. Gegevens daar verlaten uw apparaat niet.`
- **Tekst 3**: `Daarom is er geen melding. Er is niets om toestemming voor te vragen.`
- **Tekst 4**: `Wilt u het checken? Open Developer Tools → Application → Cookies. Die lijst is leeg. Kijk daarna bij Local Storage. Daar staat wat dit formulier onthoudt.`

### Trigger links
- `Wat gebeurt er als u op verzenden klikt?`
- `Wat kunt u doen met uw gegevens?`

### Popover: Voortgang
- **H4**: `Uw voortgang`
- **Tekst 1**: `Dit formulier onthoudt waar u was. Als u halverwege stopt en morgen terugkomt, zijn uw antwoorden er nog.`
- **Tekst 2**: `Dat werkt via localStorage, een stukje opslagruimte dat bij uw apparaat hoort. Wij zetten uw antwoorden daar neer onder een sleutel die begint met cttt_.`
- **Tekst 3**: `Wij zien die opslag niet. Het is alsof u een kladblok op uw bureau heeft liggen. Wij staan niet in uw kantoor.`

### Popover: Verzenden
- **H4**: `Het verzenden`
- **Tekst 1**: `Tot nu toe bestaan uw antwoorden alleen op uw apparaat. Wij weten niet dat u er bent.`
- **Tekst 2**: `Dat verandert wanneer u op verzenden klikt. Uw antwoorden gaan dan versleuteld naar een Google-spreadsheet. Eén keer, één richting. Alleen de onderzoeksbeheerder heeft toegang.`
- **Tekst 3**: `Daar stopt het. Niet gedeeld. Niet verkocht. Niet gebruikt om u te profileren.`
- **Tekst 4**: `Na verzending krijgt u een kopie in uw browser. Die blijft van u.`

### Popover: Rechten
- **H4**: `Uw rechten`
- **Tekst 1**: `Wat lokaal staat is van u. Bekijk het in Developer Tools → Local Storage. Verwijder het via uw browsergegevens.`
- **Tekst 2**: `Wat u heeft verzonden staat op onze server. Daar gelden uw AVG-rechten:`
- **Tags**: `Inzage` / `Correctie` / `Verwijdering` / `Overdracht`

Bron: `index.html`

---

## 4. Survey — Sidebar (`scripts/build-survey-html.js`)

- **H2**: `Monitoring Cultureel`
- **Progressie**: `0%` (initieel)
- **Uitloggen knop**: `Uitloggen`
- **Org info**: `-` (placeholder voor naam en code)
- **Navigatie dividers**: `Kwalitatief` (bij stap 4), `Afsluiting` (bij stap 11)
- **Status iconen**: `○` (leeg, initieel)

Bron: `scripts/build-survey-html.js` (renderNavItems)

---

## 5. Survey — Navigatieknoppen

| Knop | Tekst | Context |
|------|-------|---------|
| Volgende | `Volgende` | Stappen 0-12 |
| Vorige | `Vorige` | Stappen 1-14 |
| Controleren | `Controleren` | Stap 13 → review |
| Controle | `Controle` | Terugkeer-knop naar review (klein) |
| Verzenden | `Verzenden` | Review pagina |
| Verzenden... | `Verzenden...` | Loading state |

Bron: `js/constants.js` (UI), `src/js/navigation.js` (showStep), `scripts/build-survey-html.js`

---

## 6. Survey — Inkijkexemplaar banners

- **Titel (boven + onder)**: `Inkijkexemplaar`
- **Subtitel**: `Ingevulde gegevens worden niet verstuurd`

Bron: `scripts/build-survey-html.js` (previewInfoBox)

---

## 7. Survey stappen — Alle vraagteksten

### Stap 0: Welkom
- **Heading**: `Monitoring Cultureel Talent naar de Top 2025`
- **Intro**: `Welkom bij de monitoring tool. In de volgende stappen vragen we naar uw organisatiegegevens en beleid rondom culturele diversiteit.`
- **Veld**: `Naam organisatie (Charter)` / placeholder: `Voer de naam van uw organisatie in`

### Stap 1: Streefcijfer
- **Sectienummer**: `1`
- **Subtitle**: `Heeft uw organisatie een streefcijfer voor culturele diversiteit?`
- **Radio streefcijfer**:
  - `Ja` — `Wij hebben een streefcijfer`
  - `Nee` — `Wij hebben geen streefcijfer`
- **Conditionele velden (bij Ja)**:
  - `Streefcijfer` / placeholder: `bijv. 99%`
  - `Te behalen in` / placeholder: `bijv. 1215`
  - `Is het streefcijfer gehaald?` — `Ja` / `Nee` / `Gedeeltelijk`
- **Radio definitie_afwijking**:
  - Label: `Wijkt uw definitie af van de standaard?`
  - Opties: `Ja` / `Nee`
  - Conditioneel: `Beschrijf uw definitie`

### Stap 2: Kwantitatief
- **Sectienummer**: `2`
- **Subtitle**: `Kwantitatieve gegevens over uw organisatie`
- **Velden**:
  - `Totaal aantal werknemers`
  - `Waarvan herkomst Buiten-Europa`
  - `Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven`
  - `Aantal in de top`
  - `Waarvan herkomst Buiten-Europa`
  - `Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven`
  - `Aantal in de subtop`
  - `Waarvan herkomst Buiten-Europa`
  - `Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven`

(Labels bevatten `<span class="label-highlight">` voor visuele nadruk op: werknemers, Buiten-Europa, top, subtop)

### Stap 3: Bestuursorganen
- **Sectienummer**: `2.1`
- **Subtitle**: `Samenstelling bestuursorganen`
- **Radio heeft_rvb**: `Heeft uw organisatie een Raad van Bestuur?` — `Ja` / `Nee`
  - Conditioneel: `Aantal leden` (placeholder: `bijv. 5`) / `Waarvan Buiten-Europa` (placeholder: `bijv. 1`)
- **Radio heeft_rvc**: `Heeft uw organisatie een Raad van Commissarissen?` — `Ja` / `Nee`
  - Conditioneel: `Aantal leden` / `Waarvan Buiten-Europa`
- **Radio heeft_rvt**: `Heeft uw organisatie een Raad van Toezicht?` — `Ja` / `Nee`
  - Conditioneel: `Aantal leden` / `Waarvan Buiten-Europa`
- **Radio beleid_samenstelling** (label: `Beleid samenstelling`):
  - `Onze organisatie heeft bewust beleid om het aandeel mensen met herkomst Buiten-Europa in de raad van bestuur en/of raad van commissarissen/rvt te vergroten`
  - `Onze organisatie heeft bewust beleid om het aandeel mensen met herkomst Buiten-Europa in hogere managementposities te vergroten`
  - `Anders`
  - Conditioneel: `Toelichting` / placeholder: `Beschrijf uw beleid`

### Stap 4: Kwalitatief (intro)
- **Sectienummer**: `3`
- **Heading**: `Kwalitatieve vragen`
- **Tekst**: `De volgende secties bevatten stellingen over uw diversiteitsbeleid.`

### Stap 5: Leiderschap
- **Sectienummer**: `3.1`
- **Subtitle**: `Leiderschap`
- **Stellingen** (leid_1 t/m leid_5):
  1. `De top heeft zich verbonden (is gecommitteerd) aan de doelstellingen en het beleid voor meer mensen met herkomst Buiten-Europa`
  2. `De top draagt het belang van culturele diversiteit actief uit`
  3. `De top stuurt aanwijsbaar op het bereiken van de gewenste resultaten`
  4. `De top stelt voldoende middelen (financiën, personeel, technologie) ter beschikking om de doelstellingen te kunnen realiseren`
  5. `De top neemt eindverantwoordelijkheid voor het culturele diversiteitsbeleid`

### Stap 6: Strategie
- **Sectienummer**: `3.2`
- **Subtitle**: `Strategie en management`
- **Stellingen** (strat_1 t/m strat_8):
  1. `Culturele diversiteit is een business case voor onze organisatie, d.w.z. voor onze organisatie is het om zakelijke of bedrijfsmatige redenen waardevol om culturele diversiteit te stimuleren`
  2. `De organisatie streeft expliciete doelstellingen voor het aandeel mensen met herkomst Buiten-Europa in de top na`
  3. `Vastgelegd is hoe deze doelstellingen bereikt gaan worden en op welke termijn`
  4. `Bedrijfsonderdelen (business units, afdelingen, teams) rapporteren over het realiseren van culturele diversiteitdoelstellingen (via de planning en controle cyclus)`
  5. `Leidinggevenden worden beoordeeld op het realiseren van culturele diversiteits-doelstellingen i.h.k.v. de periodieke beoordeling`
  6. `Wij evalueren met vastgestelde regelmaat (bijvoorbeeld elk kwartaal) de resultaten van ons culturele diversiteitsbeleid`
  7. `De uitkomsten van evaluaties worden gebruikt om ons culturele diversiteitsbeleid te verbeteren`
  8. `Wij vergelijken ons culturele diversiteitsbeleid met dat van andere organisaties`

### Stap 7: HR Management
- **Sectienummer**: `3.3`
- **Subtitle**: `HR Management`
- **Stellingen** (hr_1 t/m hr_14):
  1. `De organisatie zet bewust maatwerkinstrumenten en regelingen in om de doorstroom van mensen met herkomst Buiten-Europa naar de top en subtop te vergroten`
  2. `Bij de werving van kandidaten voor top- en subtopfuncties wordt doelbewust gestreefd naar culturele diversiteit`
  3. `Subjectiviteit en stereotypering worden tegengegaan door transparante en objectieve selectieprocedures`
  4. `Onze arbeidsmarktcommunicatie reflecteert ons streven naar culturele diversiteit`
  5. `Begeleiding van de carrière-ontwikkeling van mensen met herkomst Buiten-Europa door opleiding en management-development`
  6. `Begeleiding van de carrière-ontwikkeling van mensen met herkomst Buiten-Europa door middel van coaching en mentoring`
  7. `Effectiviteit van onze HR-maatregelen ten behoeve het realiseren van culturele diversiteit wordt gemeten om beleid te kunnen verbeteren`
  8. `Het aandeel met herkomst Buiten-Europa naar functieniveau en naar afdeling (business unit, team) wordt gemeten (is bekend)`
  9. `Bij de personeels-/successie-planning wordt doelbewust gestreefd naar het realiseren van culturele diversiteit`
  10. `Ondersteuning van de carrièreontwikkeling van mensen met herkomst Buiten-Europa door netwerken`
  11. `Ondersteuning van de carrière-ontwikkeling van mensen met herkomst Buiten-Europa door rolmodellen`
  12. `Ons streven naar meer mensen met herkomst Buiten-Europa in de top is geïntegreerd in al onze HR-maatregelen`
  13. `Door empowerment worden mensen met herkomst Buiten-Europa gestimuleerd tot carrièreontwikkeling vanuit eigen kracht`
  14. `Ongewenste uitstroom van talentvolle mensen met herkomst Buiten-Europa wordt voorkomen`

### Stap 8: Communicatie
- **Sectienummer**: `3.4`
- **Subtitle**: `Communicatie`
- **Stellingen** (comm_1 t/m comm_5):
  1. `De organisatie communiceert intern bewust over haar streven om het aandeel mensen met herkomst Buiten-Europa in topfuncties te verhogen`
  2. `De organisatie communiceert extern bewust over haar streven om het aandeel mensen met herkomst Buiten-Europa in topfuncties te verhogen`
  3. `Alle medewerkers in de organisatie zijn op de hoogte van onze strategie en beleid voor culturele diversiteit`
  4. `De organisatie staat extern bekend als cultureel diversiteitsgericht`
  5. `Culturele diversiteit is in onze organisatie zichtbaar in woord en beeld`

### Stap 9: Kennis
- **Sectienummer**: `3.5`
- **Subtitle**: `Kennis en vaardigheden`
- **Stellingen** (kennis_1 t/m kennis_8):
  1. `De organisatie beschikt over inzicht in de maatregelen die culturele diversiteit bevorderen`
  2. `De organisatie beschikt over inzicht in de mechanismen die culturele diversiteit belemmeren`
  3. `Leidinggevenden zijn zich bewust van de meerwaarde van culturele diversiteit`
  4. `Leidinggevenden zijn zich bewust van de mechanismen (zoals stereotypen) die doorstroom van mensen met herkomst Buiten-Europa naar de top belemmeren`
  5. `Leidinggevenden zetten maatregelen in die de doorstroom van mensen met herkomst Buiten-Europa naar de top bevorderen`
  6. `Wij maken voortdurend gebruik van alle beschikbare kennis en ervaring voor het verbeteren van culturele diversiteit`
  7. `Het periodieke medewerkers-tevredenheidsonderzoek wordt gebruikt om te sturen op culturele diversiteit`
  8. `De organisatie weet waarom talentvolle medewerkers met herkomst Buiten-Europa de organisatie verlaten en gebruikt deze kennis om medewerkers te behouden`

### Stap 10: Klimaat
- **Sectienummer**: `3.6`
- **Subtitle**: `Organisatieklimaat`
- **Stellingen** (klimaat_1 t/m klimaat_6):
  1. `Stereotypen, vooroordelen en discriminatie worden in deze organisatie actief bestreden`
  2. `De inzet van specifieke maatregelen om te investeren in mensen met herkomst Buiten-Europa teneinde culturele diversiteit in de top te vergroten, is zonder meer geaccepteerd in de organisatie`
  3. `Culturele verschillen tussen medewerkers worden in de gehele organisatie - op alle niveaus en in de organisatie breed - erkend en gewaardeerd`
  4. `De aandacht voor culturele diversiteit leeft binnen de organisatie - op alle niveaus en in de organisatie breed`
  5. `Leidinggevenden voelen zich verantwoordelijk voor het realiseren van culturele diversiteit`
  6. `De organisatie wordt door medewerkers gezien als culturele diversiteit minded`

### Stap 11: Motivatie
- **Sectienummer**: `4`
- **Subtitle**: `Motivatie en blokkades`
- **Velden**:
  - `Wat is uw belangrijkste motivatie voor diversiteitsbeleid?`
  - `Wat is de grootste blokkade die u ervaart?`
  - `Wat werkt het meest bevorderend?`

### Stap 12: Aanvullend
- **Sectienummer**: `5`
- **Subtitle**: `Aanvullende informatie`
- **Groepslabel**: `Heeft u vragen naar aanleiding van uw strategie en beleid ten behoeve van de toename van het aandeel mensen met herkomst Buiten-Europa in de top, of culturele diversiteit in het algemeen?`
  - `Vraag 1` / `Vraag 2` / `Vraag 3`
- **Textarea**: `Deel een voorbeeld of best practice`

### Stap 13: Ondertekenen
- **Sectienummer**: `6`
- **Subtitle**: `Ondertekening`
- **Velden**:
  - `Datum`
  - `Naam CEO/directeur`
  - `Ik bevestig dat de gegevens naar waarheid zijn ingevuld`

Bron: `src/data/survey-data.js`

---

## 8. Likert schaal labels

Gedeeld door alle Likert-tabellen (stappen 5-10):

| Waarde | Label |
|--------|-------|
| 0 | `Niet` |
| 1 | `Enigszins` |
| 2 | `Grotendeels` |
| 3 | `Volledig` |

Tabelheader: `Gerealiseerd:`

Bron: `src/data/survey-data.js` (LIKERT_OPTIONS), `scripts/build-survey-html.js`

---

## 9. Likert toelichting & opmerkingen

Elke Likert-stap heeft:
- **Toelichting label**: `Toelichting (optioneel)` / placeholder: `Licht uw antwoorden toe...`
- **Opmerkingen toggle**: `Opmerking achterlaten`
- **Opmerkingen placeholder**: `Optioneel: laat hier een opmerking achter`

Toelichting veldnamen: `leiderschap_toelichting`, `strategie_toelichting`, `hr_toelichting`, `communicatie_toelichting`, `kennis_toelichting`, `klimaat_toelichting`

Bron: `scripts/build-survey-html.js` (renderStep)

---

## 10. Review pagina (stap 14)

### Header
- **H1**: `Controleer uw antwoorden`
- **Subtitle**: `Controleer hieronder uw antwoorden voordat u verzendt.`

### Alles compleet
- **H3**: `Alle velden zijn ingevuld!`
- **Tekst**: `Uw formulier is volledig ingevuld. U kunt nu verzenden.`

### Items incompleet
- **Header**: `Niet alle velden zijn ingevuld`
- **Subtitle**: `Klik op een sectie om de velden direct hier in te vullen, of ga naar de betreffende stap.`
- **Checkbox**: `Ik begrijp dat niet alle velden zijn ingevuld en wil toch verzenden`

### Items later alsnog compleet
- **Header**: `Alle secties zijn nu ingevuld!`
- **Subtitle**: `De onderstaande secties waren oorspronkelijk incompleet maar zijn nu ingevuld. U kunt nu verzenden.`

### Accordion items
- **Knop**: `Naar sectie →`
- **Tabel header**: `Stelling` / `Niet` / `Enigszins` / `Grotendeels` / `Volledig`
- **Status formats**:
  - `{n} van {total} ingevuld` (Likert)
  - `{n} veld niet ingevuld` / `{n} velden niet ingevuld` (velden, enkelvoud/meervoud)
  - `Compleet`
- **Foutmelding**: `Kon vragen niet laden.`

### Review inline editing
- **Placeholders**: `Vul hier in...` (tekst), `Selecteer datum` (datum), `0` (nummer)

Bron: `src/js/review.js`, `scripts/build-survey-html.js`

---

## 11. Succespagina (stap 15)

- **H1**: `Bedankt voor uw deelname!`
- **Tekst**: `Uw monitoring is succesvol verzonden.`
- **Knoppen**: `Afdrukken` / `Nieuw formulier`

Bron: `scripts/build-survey-html.js`

---

## 12. Modals

### Herstart keuze modal
- **H2**: `Formulier opnieuw invullen`
- **Tekst**: `U heeft al een formulier ingevuld. Wilt u doorgaan met uw bestaande gegevens of opnieuw beginnen?`
- **Knoppen**: `Doorgaan` / `Opnieuw beginnen`

### Wis waarschuwing modal
- **H2**: `Let op!`
- **Tekst**: `Weet u zeker dat u een leeg formulier wilt starten?` + **vet**: `Uw lokale gegevens worden gewist.`
- **Knoppen**: `Annuleren` / `Ja, wis alles`

### Validatie modal (dynamische content)
- **Standaard H2**: `Nog niet compleet`
- **Standaard tekst**: `Vul alle verplichte velden in.`
- **Knop**: `Begrepen`
- **Dynamische berichten vanuit form.js**:
  - Titel: `Nog niet compleet` / Tekst: `Vul de naam van de CEO/directeur in voordat u het formulier kunt verzenden.` / Link: `Ga naar ondertekenen →`
  - Titel: `Bevestiging vereist` / Tekst: `Bevestig dat de gegevens naar waarheid zijn ingevuld voordat u het formulier kunt verzenden.` / Link: `Ga naar ondertekenen →`

### Fout modal (dynamische content)
- **Standaard H2**: `Er ging iets mis`
- **Standaard tekst**: `Probeer het opnieuw.`
- **Knop**: `Sluiten`
- **Dynamisch vanuit form.js**: Titel: `Verzenden mislukt`

### Inkijkexemplaar modal
- **H2**: `Inkijkexemplaar`
- **Tekst**: `Dit is een openbaar inkijkexemplaar.` + **vet**: `Ingevulde gegevens worden niet verstuurd.`
- **Knop**: `Begrepen`

### Print-foutmelding (print.js)
- Titel: `Niet gevonden`
- Tekst: `Het formulier kon niet worden gevonden.`

Bron: `scripts/build-survey-html.js`, `src/js/form.js`, `src/js/modals.js`, `src/js/print.js`

---

## 13. Gearchiveerde formulieren

- **Badge**: `Laatst verzonden`
- **Knop**: `Print`
- **Datumformaat**: `{dag} {maand} {jaar}, {uur}:{minuut}` (nl-NL locale)

Bron: `src/js/modals.js` (populateArchivedFormsList)

---

## 14. Foutmeldingen (`js/constants.js`)

| Sleutel | Tekst |
|---------|-------|
| INVALID_CODE | `Ongeldige organisatiecode. Controleer uw code en probeer opnieuw.` |
| ENTER_CODE | `Vul beide delen van uw organisatiecode in.` |
| NETWORK_ERROR | `Er ging iets mis bij het controleren van uw code. Probeer het later opnieuw.` |
| SUBMIT_ERROR | `Er ging iets mis bij het verzenden. Probeer het opnieuw.` |
| SESSION_EXPIRED | `Uw sessie is verlopen. Log opnieuw in.` |
| STORAGE_ERROR | `Kan gegevens niet opslaan. Controleer of uw browser localStorage ondersteunt.` |

### Extra foutmeldingen in auth.js
- Server onbeschikbaar: `De server is tijdelijk niet beschikbaar. Probeer het later opnieuw of neem contact op met de beheerder.`
- Ongeldige demo-code: `Ongeldige organisatiecode. Voer een code in het formaat ABC-DEF in.`

### Retry-teksten in auth.js
- `Poging {n} van {max}...`
- `Verbinding maken...`
- `Server reageert niet, opnieuw proberen...`

Bron: `js/constants.js`, `js/auth.js`

---

## 15. Status-iconen en UI-elementen (`js/constants.js`)

| Element | Tekst/Icoon |
|---------|-------------|
| Complete | `✓` |
| Partial | `−` |
| Empty | `○` |
| Knop Volgende | `Volgende` |
| Knop Verzenden | `Verzenden` |
| Knop Verzenden loading | `Verzenden...` |

Bron: `js/constants.js` (CONSTANTS.UI)

---

## 16. Sessie-constanten (`js/constants.js`)

| Sleutel | Waarde |
|---------|--------|
| PUBLIC_CODE | `PUBLIC` |
| PUBLIC_NAME | `Openbare toegang` |

Bron: `js/constants.js` (CONSTANTS.SESSION)

---

## 17. Staplabels voor review (`src/js/state.js`)

| Stap | Label |
|------|-------|
| 0 | `Welkom` |
| 1 | `Streefcijfer` |
| 2 | `Kwantitatief` |
| 3 | `Bestuursorganen` |
| 4 | `Kwalitatief (intro)` |
| 5 | `Leiderschap` |
| 6 | `Strategie` |
| 7 | `HR Management` |
| 8 | `Communicatie` |
| 9 | `Kennis` |
| 10 | `Klimaat` |
| 11 | `Motivatie` |
| 12 | `Aanvullend` |
| 13 | `Ondertekenen` |

Bron: `src/js/state.js` (STEP_LABELS)

---

## 18. Veldlabels voor review (`src/js/state.js`)

| Veldnaam | Label |
|----------|-------|
| organisatie | `Naam organisatie` |
| streefcijfer | `Heeft u een streefcijfer?` |
| streefcijfer_percentage | `Streefcijfer percentage` |
| streefcijfer_jaar | `Streefcijfer jaar` |
| streefcijfer_gehaald | `Streefcijfer gehaald?` |
| definitie_afwijking | `Wijkt definitie af?` |
| eigen_definitie | `Eigen definitie` |
| aantal_werknemers | `Totaal aantal werknemers` |
| werknemers_buiten_europa | `Werknemers Buiten-Europa` |
| aantal_top | `Aantal in de top` |
| top_buiten_europa | `Top Buiten-Europa` |
| aantal_subtop | `Aantal in de subtop` |
| subtop_buiten_europa | `Subtop Buiten-Europa` |
| heeft_rvb | `Heeft u een RvB?` |
| aantal_rvb | `Aantal RvB` |
| rvb_buiten_europa | `RvB Buiten-Europa` |
| heeft_rvc | `Heeft u een RvC?` |
| aantal_rvc | `Aantal RvC` |
| rvc_buiten_europa | `RvC Buiten-Europa` |
| heeft_rvt | `Heeft u een RvT?` |
| aantal_rvt | `Aantal RvT` |
| rvt_buiten_europa | `RvT Buiten-Europa` |
| beleid_samenstelling | `Beleid samenstelling` |
| beleid_samenstelling_anders | `Beleid toelichting` |
| motivatie | `Motivatie` |
| blokkade_1 | `Blokkade 1` |
| bevorderend_1 | `Bevorderend 1` |
| voorbeeld_organisatie | `Voorbeeld organisatie` |
| datum | `Datum` |
| ondertekenaar | `Naam ondertekenaar` |
| bevestiging | `Bevestiging` |

Bron: `src/js/state.js` (FIELD_LABELS)

---

## 19. Likert groepslabels voor review (`src/js/state.js`)

| Tabel ID | Label | Stap |
|----------|-------|------|
| likert-leiderschap | `Leiderschap stellingen` | 5 |
| likert-strategie | `Strategie stellingen` | 6 |
| likert-hr | `HR Management stellingen` | 7 |
| likert-communicatie | `Communicatie stellingen` | 8 |
| likert-kennis | `Kennis stellingen` | 9 |
| likert-klimaat | `Klimaat stellingen` | 10 |

Bron: `src/js/state.js` (LIKERT_LABELS)

---

## 20. Noscript (survey view)

- `JavaScript is vereist voor deze vragenlijst.`
- `Klik hier om terug te gaan naar de inlogpagina`

Bron: `scripts/build-survey-html.js`

---

## 21. Tooltips en ARIA labels

| Element | Tekst |
|---------|-------|
| Reset-knop (radio) | `Wis selectie` (title attr) |
| Reset-knop (Likert) | `Wis selectie` (title attr) |
| Hamburger menu | `Open menu` (aria-label) |

Bron: `scripts/build-survey-html.js`

---

## Waar tekst wijzigen?

| Categorie | Bestand | Na wijziging |
|-----------|---------|--------------|
| Loginpagina | `index.html` | Direct live |
| Privacy panel | `index.html` | Direct live |
| Survey vragen/labels | `src/data/survey-data.js` | `npm run build:html` |
| Likert opties | `src/data/survey-data.js` | `npm run build:html` |
| Review/succes/modals HTML | `scripts/build-survey-html.js` | `npm run build:html` |
| Review JS-teksten | `src/js/review.js` | `npm run build` |
| Form validatie-teksten | `src/js/form.js` | `npm run build` |
| Print foutmeldingen | `src/js/print.js` | `npm run build` |
| Stap/veld/Likert labels | `src/js/state.js` | `npm run build` |
| Foutmeldingen | `js/constants.js` | Direct live |
| UI-knoppen | `js/constants.js` | Direct live |
| Auth-teksten | `js/auth.js` | Direct live |
| Paginatitels | `js/app.js` | Direct live |
