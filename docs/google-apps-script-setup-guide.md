# Google Apps Script Setup Guide

Give this entire document to Claude in the Chrome extension. It contains everything needed to set up the backend.

---

## Context

I have a Dutch-language survey app (vanilla JS, hosted on Netlify) that submits form data to a Google Apps Script web app, which stores it in a Google Sheet. I cloned the repo from another project and need to set up a fresh Google Sheet + Apps Script backend.

The frontend is already built. I just need you to help me create:
1. A Google Sheet with the right structure
2. A Google Apps Script (`Code.gs`) that handles the API

## How the frontend calls the API

All requests are **GET** (even submissions — GAS drops POST body during its redirect). The frontend appends everything as query parameters.

The base URL is the GAS web app deployment URL. The frontend sends `?action=X&param=Y`.

### API actions the script must handle (in `doGet(e)`)

#### 1. `checkCode` — Validate an organization code
- **Params**: `e.parameter.code` (string, format `XXX-XXX`, e.g. `YAW-PGP`)
- **Expected response on success**: `{ "success": true, "organisatie": "Bureau Name Here" }`
- **Expected response on failure**: `{ "success": false, "error": "Code niet gevonden" }`
- **Logic**: Look up the code in a "Codes" sheet. If found, return the organization name. If not, return error.

#### 2. `saveResponses` — Save survey submission
- **Params**:
  - `e.parameter.code` — the org code (string)
  - `e.parameter.data` — JSON string containing all form fields
- **Expected response**: `{ "success": true, "message": "Gegevens opgeslagen" }`
- **Logic**: Parse `data` as JSON. Write a new row to the "Responses" sheet. The data object contains 40-60 key/value pairs (all the form fields). Also include a timestamp and the org code.

#### 3. `ping` — Health check
- **No params**
- **Response**: `{ "success": true, "message": "pong" }`

### Response format

All responses must be returned as:
```js
ContentService.createTextOutput(JSON.stringify(responseObj))
  .setMimeType(ContentService.MimeType.JSON);
```

## Google Sheet structure

### Sheet 1: "Codes"
Two columns:
| Code | Organisatie |
|------|-------------|
| YAW-PGP | Bureau Voorbeeld |
| ABC-DEF | Testorganisatie |

Add a few example rows so I can test.

### Sheet 2: "Responses"
This is where submissions land. The first row should be headers. The columns should be:
- `timestamp` (ISO string, generated server-side)
- `orgCode` (from `e.parameter.code`)
- Then **every key from the parsed `data` JSON**, written dynamically

Since the form fields may change over time, the script should handle this dynamically:
- Read existing headers from row 1
- For any new keys in the submitted data that aren't in the headers yet, append them as new columns
- Write the values in the correct column positions

This way we never need to manually update the sheet structure when form fields change.

## Form fields reference

These are the field names that come in the `data` JSON. You don't need to hardcode these — the dynamic column approach handles them — but here they are for reference:

**Step 0 (Welcome):** `organisatie`
**Step 1 (Streefcijfer):** `streef_minimum`, `streef_gemiddeld`
**Step 2 (Plaatsingen):** `aantal_geplaatst`, `geplaatst_vrouw`, `geplaatst_rvb`, `rvb_vrouw`, `geplaatst_rvc_rvt`, `rvc_rvt_vrouw`
**Step 3 (Longlist):** `longlist_totaal`, `longlist_vrouw`, `longlist_rvb`, `longlist_rvb_vrouw`, `longlist_rvc_rvt`, `longlist_rvc_rvt_vrouw`
**Step 4 (Shortlist):** `shortlist_totaal`, `shortlist_vrouw`, `shortlist_rvb`, `shortlist_rvb_vrouw`, `shortlist_rvc_rvt`, `shortlist_rvc_rvt_vrouw`
**Step 5 (Verzoeken):** `verzoek_vrouw`, `verzoek_man`
**Step 6 (Redenen):** `reden_niet_vrouw_1`, `reden_niet_vrouw_2`, `reden_wel_vrouw_1`, `reden_wel_vrouw_2`
**Step 7 (Aanbod):** `aanbod_vrouw`, `reden_onvoldoende_1`, `reden_onvoldoende_2`, `sector_voorloper`, `sector_achterblijver`
**Step 8 (M/V):** `aandacht_mv`, `reden_niet_aandacht`, `ondersteuning_selectie`, `reden_niet_ondersteuning`
**Step 9 (Belemmeringen):** `belemmering_vrouw_1..3`, `ondersteuning_vrouw_1..3`
**Step 10 (Kweekvijver):** `investering_kweekvijver`, `reden_niet_investering`, `waarborg_kwaliteiten`, `best_practices_vrouwen`
**Step 11 (Cultureel):** `aandacht_cultureel`, `verzoek_bicultureel`, `aanbod_bicultureel`, `belemmering_bicultureel_1..3`, `best_practices_bicultureel`
**Step 12 (Aanvullend):** `nieuwe_themas`, `opmerkingen_vragen`
**Step 13 (Ondertekenen):** `datum`, `ondertekenaar`, `bevestiging`

Plus metadata added by the frontend: `timestamp`, `orgCode`, `orgName`

Plus optional comment fields per step: `opmerkingen_stap_0` through `opmerkingen_stap_12`

## Deployment requirements

The script must be deployed as:
- **Execute as**: Me
- **Who has access**: **Anyone** (not "Anyone with Google account" — must be fully public, otherwise CORS and auth redirects break)

## What I need you to produce

1. The complete `Code.gs` file I can paste into the Apps Script editor
2. Step-by-step instructions for:
   - Creating the Google Sheet
   - Opening the Apps Script editor (Extensions > Apps Script)
   - Pasting the code
   - Deploying as a web app
   - Getting the deployment URL
3. Tell me where to paste the URL in my project (it goes in `js/config.js` as the `SCRIPT_URL` value)

Keep it simple and production-ready. No unnecessary complexity.
