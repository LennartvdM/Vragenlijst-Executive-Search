# Front-end Code Audit

Audit van de Monitoring Cultureel Talent naar de Top 2026 front-end codebase.
Datum: 5 februari 2026

---

## Samenvatting

De codebase is functioneel solide en goed gestructureerd voor een vanilla JS project. De modulaire opzet (IIFE + ES6 via Vite) werkt, de state management is helder, en de API-client is robuust. Maar er is **technische schuld** opgebouwd: duplicatie, inconsistenties tussen configuratielagen, en twee concrete bugs. Hieronder alles gegroepeerd per categorie.

---

## 1. Bugs (functionele fouten)

### 1.1 `CONSTANTS.CSS.VISIBLE` bestaat niet
**Bestanden:** `src/js/form.js:249`, `src/js/form.js:253`

`clearFormAndRestart()` verwijdert `CONSTANTS.CSS.VISIBLE` van elementen, maar die key bestaat niet in `js/constants.js`. Het `CSS`-object bevat `SHOW`, niet `VISIBLE`. Hierdoor worden conditionele secties en commentaarvelden **niet gereset** bij "formulier wissen".

```js
// form.js:248-254 — bug: CONSTANTS.CSS.VISIBLE is undefined
document.querySelectorAll('.conditional').forEach(conditional => {
  conditional.classList.remove(window.CONSTANTS.CSS.VISIBLE); // undefined → no-op
});
document.querySelectorAll('.comments-field').forEach(field => {
  field.classList.remove(window.CONSTANTS.CSS.VISIBLE); // undefined → no-op
});
```

**Fix:** Vervang `CONSTANTS.CSS.VISIBLE` door `CONSTANTS.CSS.SHOW`, of voeg `VISIBLE: 'show'` toe aan `CONSTANTS.CSS`.

### 1.2 Fieldnaam-mismatch `beleid_anders_toelichting` vs `beleid_samenstelling_anders`
**Bestanden:** `js/constants.js:61` vs `src/data/survey-data.js:145`, `src/js/state.js:96,152`

De HTML wordt gegenereerd met veldnaam `beleid_samenstelling_anders` (uit survey-data.js), maar `CONDITIONAL_REQUIREMENTS` in constants.js verwijst naar `beleid_anders_toelichting`. Dit betekent dat de voltooiings-check voor "Anders → toelichting" nooit het juiste veld vindt — het veld lijkt altijd leeg.

```js
// constants.js:59-62
beleid_samenstelling: {
  triggerValue: 'Anders',
  requiredFields: ['beleid_anders_toelichting']  // ← veld bestaat niet in DOM
}
```

```js
// survey-data.js:145 — het echte veld heet:
{ type: 'text', name: 'beleid_samenstelling_anders', ... }
```

**Fix:** Wijzig `beleid_anders_toelichting` naar `beleid_samenstelling_anders` in constants.js.

### 1.3 Case-mismatch `anders` vs `Anders`
**Bestanden:** `src/data/survey-data.js:140,143` vs `js/constants.js:33,60`

In survey-data.js is de radioknop-value `'anders'` (lowercase), maar constants.js verwacht `'Anders'` (capitalized) als trigger. De build-script genereert HTML met `value="anders"`, dus de conditional check `value === 'Anders'` faalt altijd.

**Fix:** Maak de casing consistent — óf overal `'Anders'` óf overal `'anders'`.

---

## 2. Dode code & ongebruikte elementen

### 2.1 `CONSTANTS.API_ACTIONS` wordt nergens gebruikt
**Bestand:** `js/constants.js:86-89`

De constanten `VALIDATE_CODE` en `SUBMIT_SURVEY` zijn gedefinieerd maar worden nergens geïmporteerd of gelezen. De api.js en auth.js gebruiken hardcoded strings (`'checkCode'`, `'saveResponses'`).

### 2.2 `Storage.deleteSubmittedForm()` wordt nergens aangeroepen
**Bestand:** `js/storage.js:200-204`

De functie is gedefinieerd en geëxporteerd maar nergens in de codebase gebruikt.

### 2.3 `AuthModule` re-exporteert Storage functies zonder toevoeging
**Bestand:** `js/auth.js:369-374`

`window.AuthModule` wrapped simpelweg `Storage.getSession`, `clearSession`, `saveSession`, `isSessionValid` — dezelfde functies die al via `window.Storage` beschikbaar zijn. Nergens in de codebase wordt `AuthModule` gelezen.

### 2.4 Dubbele DOMContentLoaded-initialisatie in main.js
**Bestand:** `src/js/main.js:366-376`

Er is een `DOMContentLoaded` listener die `initSurvey()` aanroept als `monitoringForm` bestaat. Maar `initSurvey()` wordt ook al aangeroepen door `App.init()` via `initializeSurvey()`. Bij directe navigatie naar een pagina met het formulier wordt `initSurvey()` potentieel twee keer uitgevoerd.

### 2.5 `js/color-lab.js` is alleen gebruikt door `palette-k8x2.html`
**Bestand:** `js/color-lab.js` (425 regels)

Dit bestand is alleen gekoppeld aan een palette HTML-pagina, niet aan de survey. Als dit een ontwikkeltool is, hoort het niet in de productie-js map.

---

## 3. Duplicatie & herhalingspatronen

### 3.1 `updateAllSections()` + `updateIndexStatus()` worden 22x samen aangeroepen
**Bestanden:** `main.js`, `form.js`, `navigation.js`, `review.js`

Dit paar wordt bijna altijd samen aangeroepen. Het zou een enkele `updateProgress()` wrapper moeten zijn, of `updateIndexStatus` zou automatisch door `updateAllSections` getriggerd moeten worden.

### 3.2 Dubbele button-update logica (top + bottom)
**Bestand:** `src/js/navigation.js:80-138`

De `showStep()` functie bevat aparte variabelen en logica voor `btnPrev`/`btnPrevTop`, `btnNext`/`btnNextTop`, `progressDots`/`progressDotsTop`. Dit zijn steeds bijna identieke blokken. Een helper-functie voor "update button pair" zou dit halveren.

### 3.3 Conditional trigger-value logica herhaald op 3 plekken
**Bestanden:** `main.js:258-261`, `form.js:46-48`

Dezelfde patroon om de trigger-value te bepalen:
```js
const triggerValue = CONSTANTS.CONDITIONAL_VALUES && CONSTANTS.CONDITIONAL_VALUES[name]
  ? CONSTANTS.CONDITIONAL_VALUES[name]
  : CONSTANTS.ANSWERS.YES;
```
Dit zou een utility-functie moeten zijn.

### 3.4 Modal show/hide patroon herhaald 7x
**Bestand:** `src/js/modals.js`

Elke modal heeft een aparte show/hide functie die hetzelfde doet: `modal.style.display = 'flex'` + `body.overflow = 'hidden'` (show) of `'none'` + `''` (hide). Dit zou een generieke `toggleModal(id, visible)` kunnen zijn.

---

## 4. Inconsistenties

### 4.1 `var` vs `const`/`let` mixing
**Bestanden:** `js/auth.js`, `js/app.js`

De root IIFE-modules gebruiken `var` overal, terwijl de ES6-modules `const`/`let` gebruiken. Dit is niet per se fout (IIFE's draaien buiten Vite), maar `auth.js` mengt `var` met `const` in de `handleLogin` functie (regel 288: `const isServerConfig`). Kies één stijl per bestand.

### 4.2 Magic number `768` hardcoded op 4 plekken
**Bestanden:** `src/js/navigation.js:169`, `src/js/likert.js:129`, `src/js/help.js:425`, `js/app.js:223,537`

De mobile breakpoint wordt overal als literal `768` gebruikt. Dit zou een `CONFIG.MOBILE_BREAKPOINT` of `CONSTANTS.BREAKPOINTS.MOBILE` moeten zijn.

### 4.3 Magic number `13` hardcoded in navigation.js
**Bestand:** `src/js/navigation.js:105,202,205`

De stap-index voor "Ondertekenen" wordt als literal `13` gebruikt in plaats van via `CONFIG`. Andere speciale stappen (`REVIEW_STEP`, `SUCCESS_STEP`) worden wél via CONFIG aangesproken.

### 4.4 `submitSurvey()` stuurt `method: 'POST'` mee, maar alles gaat als GET
**Bestand:** `src/js/form.js:152`, `js/api.js:85-86`

`submitSurvey` wordt aangeroepen met `{ method: 'POST' }`, maar `buildRequest()` in api.js zet altijd `fetchOptions.method = 'GET'` ongeacht de meegegeven methode. De `method` parameter is dus misleidend — het wordt wel gebruikt om mutating vs read-only te bepalen voor racing-strategie, maar niet als HTTP-methode.

### 4.5 `scroll.js` gebruikt raw `localStorage` in plaats van `window.Storage`
**Bestand:** `src/js/scroll.js:13,28,211`

De scroll module leest en schrijft direct naar `localStorage` terwijl de rest van de codebase `window.Storage` (met error handling) gebruikt.

---

## 5. Structurele observaties

### 5.1 CSS is 5094 regels in één bestand
**Bestand:** `css/styles.css`

Een enkel CSS-bestand van 5000+ regels is lastig te navigeren. Dit is geen blokkerend probleem (geen preprocessor, geen build step voor CSS), maar maakt het moeilijk om overlap en dode selectors te vinden.

**Suggestie:** Op z'n minst duidelijke sectiemarkers/TOC toevoegen, of opsplitsen in meerdere bestanden als CSS-bundling wordt toegevoegd.

### 5.2 `window.*` bridge tussen twee module-systemen
De interop via `window.CONFIG`, `window.CONSTANTS`, etc. werkt maar is fragiel. Er is geen compile-time check dat de globals bestaan wanneer ES6-modules ze lezen. Een typo als `window.CONSTATNTS` zou pas runtime falen.

### 5.3 Event-systeem vs directe imports
Sommige communicatie gaat via custom events (`generateReview`, `showStep`, `surveyVisible`, `formDataChanged`) en andere via directe imports. Er is geen duidelijke lijn welk patroon wanneer wordt gebruikt.

---

## 6. Opschoonsuggesties (laaghangend fruit)

| # | Wat | Waar | Impact |
|---|-----|------|--------|
| 1 | Verwijder `CONSTANTS.API_ACTIONS` | `constants.js` | Minder verwarrend |
| 2 | Verwijder `Storage.deleteSubmittedForm` | `storage.js` | Of implementeer delete-UI |
| 3 | Verwijder `window.AuthModule` | `auth.js` | Dode code |
| 4 | Verplaats `color-lab.js` uit `js/` | `js/color-lab.js` | Schonere productie-map |
| 5 | Extract `getTriggerValue(name)` helper | `main.js`, `form.js` | Minder duplicatie |
| 6 | Extract `updateButtonPair(id, topId, props)` | `navigation.js` | Minder duplicatie |
| 7 | Maak `toggleModal(id, show)` generiek | `modals.js` | ~50 regels minder |
| 8 | Centraliseer `MOBILE_BREAKPOINT` | `config.js` of `constants.js` | Eén bron van waarheid |
| 9 | Gebruik `CONFIG.SIGN_STEP` i.p.v. literal `13` | `navigation.js` | Consistentie |
| 10 | Laat `scroll.js` `window.Storage` gebruiken | `scroll.js` | Consistente error handling |

---

## 7. Wat goed gaat

- **Modulaire opzet** is helder: state.js als single source of truth, duidelijke module-grenzen
- **API-client** is robuust: dual-endpoint racing, diagnostische logging, retry met backoff
- **Storage abstractie** is netjes: error handling, typed helpers, session timeout
- **Event delegation** in main.js is schoon: één handler, data-action routing
- **Accessibility**: radio cards, keyboard navigation, ARIA waar nodig
- **Auto-save** met debounce voorkomt data-verlies
- **Print functionaliteit** is goed doordacht (archief + huidige form)
- **CLAUDE.md** is uitstekend — maakt onboarding voor zowel mens als AI efficiënt
