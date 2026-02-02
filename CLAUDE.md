# CLAUDE.md — AI Context for Monitoring Cultureel Talent naar de Top 2025

## What This Is
Dutch-language multi-step survey form (vragenlijst) for monitoring cultural diversity in top positions of Dutch organizations. Single-page application, vanilla JS, no framework. Hosted on Netlify, backend on Google Apps Script + Google Sheets.

## Quick Reference

### Build & Run
```bash
npm run dev          # Vite dev server on :3000
npm run build        # src/js/main.js → js/survey.js (IIFE)
npm run build:html   # src/data/survey-data.js → views/survey.html
npm run build && npm run build:html  # Full build (also runs on deploy via postinstall)
```

### Tech Stack
- **Runtime**: Vanilla ES6+ JavaScript, no React/Vue/Angular
- **Build**: Vite 7.3.1 (library mode, IIFE output)
- **CSS**: Single vanilla CSS file (4400+ lines), CSS variables for theming
- **Backend**: Google Apps Script (GAS) endpoint, Google Sheets storage
- **Hosting**: Netlify (static + proxy for CORS fallback)
- **External**: Flatpickr (CDN, date picker), Google Fonts (Inter)

---

## Architecture

### Two JavaScript Worlds
The codebase has TWO separate JS module systems that interop via `window.*`:

**1. Root `/js/` — IIFE modules (pre-Vite, global scope)**
These load via `<script>` tags in `index.html` in order:
```
config.js    → window.CONFIG        (API URL, step fields, storage keys)
constants.js → window.CONSTANTS     (enums, CSS classes, error messages)
storage.js   → window.Storage       (localStorage CRUD)
api.js       → window.ApiClient     (API calls + retry logic) + window.ApiError
auth.js      → window.AuthModule    (login form handler)
survey.js    → window.Survey        (Vite-compiled IIFE from src/js/main.js)
app.js       → window.App           (SPA view controller)
```

**2. `/src/js/` — ES6 modules (compiled by Vite into js/survey.js)**
```
main.js        Entry point, event delegation, initialization orchestrator
state.js       Centralized state store (currentStep, session, labels, maps)
form.js        Save/load/submit form data, auto-save, conditional status
navigation.js  Step transitions, mobile drawer, animations
progress.js    Progress bar, dots, sidebar status icons, alignment rig
validation.js  Field filled checks, conditional logic, incomplete items
likert.js      Likert table pills, custom radios, mobile segmented controls
review.js      Review page accordion generation, inline editing
scroll.js      Scroll position persistence, custom scrollbar, fade gradients
modals.js      All modal dialogs (validation, error, preview, restart, clear)
utils.js       escapeHtml, word counters, date picker init
print.js       Print current form or archived submission
```

**Interop pattern**: ES6 modules read globals (`window.CONFIG`, `window.CONSTANTS`, `window.Storage`, `window.ApiClient`). The IIFE modules read `window.Survey` (exported by Vite build).

### Data Flow
```
src/data/survey-data.js  ──build:html──→  views/survey.html (auto-generated)
src/js/main.js           ──vite build──→  js/survey.js (IIFE bundle)
index.html loads both + root js/ files
```

### HTML Generation
`scripts/build-survey-html.js` reads `SURVEY_STEPS` from survey-data.js and generates `views/survey.html`. This HTML is fetched dynamically by `app.js` and injected into `#survey-view`. **Never edit views/survey.html directly** — edit survey-data.js and rebuild.

---

## File Map

```
/
├── index.html                     Entry point. Contains login view + empty #survey-view
├── survey.html                    Redirect to login (legacy)
├── css/
│   ├── styles.css                 All styles (4423 lines). Login, survey, modals, responsive
│   └── flatpickr-theme.css        Custom Flatpickr theme (terracotta colors)
├── js/                            Root IIFE modules + Vite output
│   ├── config.js                  CONFIG: SCRIPT_URL, STORAGE_KEYS, STEP_FIELDS, SECTION_FIELDS
│   ├── constants.js               CONSTANTS: ANSWERS, CONDITIONAL_*, CSS classes, ERRORS, TIMEOUTS
│   ├── storage.js                 Storage: localStorage wrapper with session/form/archive methods
│   ├── api.js                     ApiClient: dual-endpoint racing, retry with backoff, diagnostics
│   ├── auth.js                    Login handler: split code input, demo mode, public access
│   ├── app.js                     App: SPA controller, view transitions, container transform animation
│   └── survey.js                  [GENERATED] Vite IIFE output from src/js/main.js
├── src/
│   ├── js/                        ES6 source modules (see Architecture section)
│   └── data/
│       └── survey-data.js         SURVEY_STEPS[], LIKERT_OPTIONS[], NAV_ITEMS[]
├── views/
│   └── survey.html                [GENERATED] from survey-data.js by build script
├── components/
│   └── privacy-panel/             Standalone hover-popover overlay component
│       ├── privacy-panel.html     (unused, markup is in index.html)
│       ├── privacy-panel.js       UMD module, auto-initializes on DOMContentLoaded
│       └── privacy-panel.css      Overlay, blur, popovers, safe zones
├── scripts/
│   └── build-survey-html.js       Node script: SURVEY_STEPS → views/survey.html
├── vite.config.js                 Library build: src/js/main.js → js/survey.js (IIFE, no split)
├── netlify.toml                   Deploy config, /api/ proxy to GAS, security headers, no-cache
└── package.json                   Only devDep: vite. Type: module. postinstall: build:html + build
```

---

## Survey Structure (16 Steps)

| Step | ID | Title | Content |
|------|----|-------|---------|
| Welcome | 0 | Welkom | Text input: organisatie name |
| Streefcijfer | 1 | Streefcijfer | Radio cards + conditional fields (percentage, year, achieved) |
| Kwantitatief | 2 | Kwantitatief | Number inputs: werknemers, top, subtop (each with buiten-europa) |
| Bestuursorganen | 3 | Bestuursorganen | Radio cards: heeft_rvb/rvc/rvt + conditional counts, beleid_samenstelling |
| Kwalitatief intro | 4 | Kwalitatief (intro) | Informational only, no fields |
| Leiderschap | 5 | Leiderschap | Likert table: 5 questions (leid_1..5) |
| Strategie | 6 | Strategie | Likert table: 8 questions (strat_1..8) |
| HR Management | 7 | HR Management | Likert table: 14 questions (hr_1..14) |
| Communicatie | 8 | Communicatie | Likert table: 5 questions (comm_1..5) |
| Kennis | 9 | Kennis | Likert table: 8 questions (kennis_1..8) |
| Klimaat | 10 | Klimaat | Likert table: 6 questions (klimaat_1..6) |
| Motivatie | 11 | Motivatie | Textareas: motivatie, blokkade_1, bevorderend_1 |
| Aanvullend | 12 | Aanvullend | Text inputs: vraag_5a_1/2/3, textarea: voorbeeld_organisatie |
| Ondertekenen | 13 | Ondertekenen | Date (flatpickr), text: ondertekenaar, checkbox: bevestiging |
| Review | 14 | Review | Dynamic accordion of incomplete items, inline editing |
| Success | 15 | Success | Submission confirmation, print/new form buttons |

### Likert Scale (steps 5-10)
All tables share 4 options: 0=Niet, 1=Enigszins, 2=Grotendeels, 3=Volledig.
Desktop: HTML table with custom radio overlays + highlight pills.
Mobile (≤768px): Segmented button controls with touch sliding.

### Conditional Fields
Parent selection triggers child fields to show/hide:
```
streefcijfer=Ja          → streefcijfer_percentage, streefcijfer_jaar
definitie_afwijking=Ja   → eigen_definitie
heeft_rvb=Ja             → aantal_rvb, rvb_buiten_europa
heeft_rvc=Ja             → aantal_rvc, rvc_buiten_europa
heeft_rvt=Ja             → aantal_rvt, rvt_buiten_europa
beleid_samenstelling=Anders → beleid_anders_toelichting
```
Conditional sections are `<div class="conditional" id="conditional-{fieldName}">`. Toggle via `.show` CSS class.

---

## State Management

### Central State (`src/js/state.js`)
Exported mutable variables with setter functions:
```js
currentStep: number       // 0-15
previousStep: number      // -1 initially
session: { orgCode, orgName, timestamp, isPublic? }
reviewVisited: boolean
initialReviewItems: array | null
scrollPositions: { [step]: number }
highlighterInitialized: boolean
```
No reactivity — components manually call update functions after state changes.

### localStorage Keys (prefixed `cttt_`)
```
cttt_session           { orgCode, orgName, timestamp, isPublic? }
cttt_form_data         { fieldName: value, ... }
cttt_submitted_forms   [{ id, orgName, submittedAt, data }, ...]
cttt_scroll_positions  { [step]: scrollTop }
```
Session timeout: 24 hours.

---

## API

### Endpoints
```
Primary:  https://script.google.com/macros/s/AKfycbw4ZABLf.../exec
Fallback: /api/ (Netlify proxy, same GAS URL)
```
Both are raced in parallel via `Promise.any()`. First success wins.

### Actions (all GET due to GAS redirect limitation)
| Action | Params | Response |
|--------|--------|----------|
| `checkCode` | `code=XXX-XXX` | `{ success, organisatie, error }` |
| `saveResponses` | `code, data` | `{ success, message, documentUrl? }` |
| `ping` | - | Health check |

### Retry: 3 attempts, exponential backoff (1s, 2s, 4s). Non-retryable: AUTH_REDIRECT, 4xx, PARSE_ERROR.

### Demo Mode
When `CONFIG.SCRIPT_URL` is unset or `'YOUR_GOOGLE_APPS_SCRIPT_URL'`: accepts any XXX-XXX code, archives submissions to localStorage only.

---

## UI / CSS Patterns

### Design System
```css
--salmon: #e8a091;  --salmon-light: #f5c4b8;  --terracotta: #c4785a;
--sand: #f5e6d3;    --cream: #fffbf7;          --teal: #7cc5c0;
--text: #4a3728;    --text-light: #7a6555;
--error: #d64545;   --success: #2d8a4e;
```

### Layout
- Login: `.login-container` with `.login-card` + `.login-info` side by side
- Survey: `.container` with `.index` (sidebar, 260px fixed) + `.content` (flexible)
- Mobile ≤768px: sidebar becomes drawer overlay, single column

### Key CSS Patterns
- **Outline stroke**: `::before` pseudo-element on `.container` and `.login-card`
- **Alignment rig**: `--progress-bar-center-y` CSS var for sidebar-to-content alignment
- **Custom scrollbar**: `.custom-scrollbar` + `.custom-scrollbar-thumb` with JS drag
- **Fade gradients**: `.content-scrollable-wrapper::before/after` with `.at-top`/`.at-bottom`
- **Option cards**: `.option-card.selected`, `.awaiting-conditional`, `.conditional-satisfied`
- **Likert pills**: `.likert-pill-highlight` absolutely positioned in first radio cell

### Animations
- **Login → Survey (desktop)**: 3-phase container transform (measure → clip-path expand → cleanup)
- **Login → Survey (mobile)**: Instant view switch, no animation
- **Step transitions**: `.slide-up` (forward) / `.slide-down` (backward), 400ms
- **Sidebar highlighter**: CSS transition follows active `.index-item`
- **Passing effect**: Desktop only, intermediate sidebar items pulse during navigation

---

## Event System

### Custom Events
```js
document.dispatchEvent(new CustomEvent('generateReview'));     // Triggers review content generation
document.dispatchEvent(new CustomEvent('showStep', { detail: { step } }));
document.dispatchEvent(new Event('surveyVisible'));            // After container transform settles
document.dispatchEvent(new CustomEvent('formDataChanged'));    // From date picker
```

### data-action Delegation
Single click handler on `document` routes all `[data-action]` attributes:
```
goToStep, prevStep, nextStep, toggleComments, resetGroup, resetLikertTable,
logout, printForm, confirmSubmit, toggleAccordion, goToReview, startNewForm,
continueExistingForm, showClearWarning, confirmClearForm, cancelClearForm,
printArchivedForm, closeValidationModal, closeErrorModal, closePreviewModal
```

---

## Module Dependencies (import graph)

```
main.js → state, scroll, navigation, progress, validation, form, modals, likert, review, utils, print
form.js → state, modals, validation, progress, scroll, likert
navigation.js → state, scroll, progress, validation, form, likert
progress.js → state, validation
validation.js → state (CONDITIONAL_PARENT_MAP, LIKERT_LABELS, STEP_LABELS)
review.js → state, validation, progress, form
scroll.js → state
modals.js → utils (escapeHtml)
likert.js → validation (isFieldFilled)
print.js → state, modals, navigation, form
utils.js → (independent)
```

---

## Key Patterns to Know

### Auto-Save
All inputs have debounced (500ms) save to localStorage. Change events save immediately. Form data serialized via `new FormData(form)`.

### Scroll Position Persistence
Each step's scroll position saved to `cttt_scroll_positions`. On step navigation: save current, restore target (with `requestAnimationFrame`).

### Review Page (step 14)
When first visiting review: snapshot incomplete items as `initialReviewItems`. This list is frozen — items show as "now complete" if filled after snapshot but don't disappear. Accordion items support inline editing that syncs back to original form fields.

### Print
Shows all steps simultaneously (adds `.active` to all `.step` elements), triggers `window.print()`, then restores single-step view. For archived forms: temporarily loads archived data, prints, then restores current form data.

### Privacy Panel
Standalone component in `/components/privacy-panel/`. Creates overlay with blur backdrop. Uses hover-triggered popovers with safe zones (prevents closing when moving mouse between trigger and popover). Moves DOM elements into `document.body` overlay container.

### Word Counter (voorbeeld_organisatie)
Uses `contenteditable` div with hidden input sync. Soft limit 200 words, hard limit 220. Excess words colored with gradient (orange → red). Hard limit enforced on keydown + paste.

---

## Common Tasks

### Adding a new survey step
1. Add step object to `SURVEY_STEPS` in `src/data/survey-data.js`
2. Add field names to `CONFIG.STEP_FIELDS[stepId]` in `js/config.js`
3. Add step label to `STEP_LABELS` in `src/js/state.js`
4. Add field labels to `FIELD_LABELS` in `src/js/state.js` (for review page)
5. If Likert: add to `LIKERT_LABELS` in `src/js/state.js`
6. If conditional: add to `CONSTANTS.CONDITIONAL_FIELDS`, `CONDITIONAL_REQUIREMENTS` in `js/constants.js`, and `CONDITIONAL_PARENT_MAP` in `src/js/state.js`
7. Run `npm run build:html && npm run build`

### Adding a new conditional field
1. `js/constants.js`: Add to `CONDITIONAL_FIELDS`, `CONDITIONAL_VALUES` (if non-Ja trigger), `CONDITIONAL_REQUIREMENTS`
2. `src/js/state.js`: Add to `CONDITIONAL_PARENT_MAP`
3. `src/data/survey-data.js`: Add `conditional` property to parent field definition
4. Rebuild

### Modifying CSS
Edit `css/styles.css` directly. No preprocessor. Use existing CSS variables. Mobile styles use `@media (max-width: 768px)`.

### Modifying API behavior
Edit `js/api.js` (IIFE, global `window.ApiClient`). Retry config in `js/constants.js` under `CONSTANTS.RETRY` and `CONSTANTS.TIMEOUTS`.

---

## Important Caveats

1. **`js/survey.js` is generated** — never edit directly. Edit `src/js/*.js` and run `npm run build`.
2. **`views/survey.html` is generated** — never edit directly. Edit `src/data/survey-data.js` and run `npm run build:html`.
3. **All API calls use GET** even for data submission (GAS limitation: POST body lost during redirect).
4. **Number inputs use `type="text" inputmode="numeric"` pattern**, not `type="number"` — intentional for better mobile UX and no spinner.
5. **Config objects are frozen** (`Object.freeze`) — cannot be modified at runtime.
6. **Step 4 has no fields** — it's an informational intro page. `STEP_FIELDS[4]` is `[]`.
7. **The `beleid_samenstelling` radio uses lowercase `'anders'` in survey-data.js** but `'Anders'` in constants.js `CONDITIONAL_VALUES`. The build script generates the HTML with the survey-data value.
8. **Mobile breakpoint is 768px** everywhere. Hardcoded in JS (`likert.js`, `app.js`, `navigation.js`) and CSS.
9. **Session is in localStorage**, not cookies. No cookies at all. This is a deliberate design decision explained in the privacy panel.
10. **The review page freezes its initial state** — `initialReviewItems` captured on first visit, items don't dynamically add/remove after that.
