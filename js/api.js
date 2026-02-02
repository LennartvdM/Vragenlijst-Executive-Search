/**
 * API Client for Monitoring Cultureel Talent naar de Top
 * Centralizes all backend communication with proper error handling and retries.
 *
 * Strategy: call GAS directly (CORS-enabled for "Anyone" deployments).
 * Falls back to Netlify proxy (/api/) if the direct call fails with CORS.
 */

const ApiClient = (function() {
  'use strict';

  // Patterns that indicate a Google authentication redirect
  const GOOGLE_AUTH_PATTERNS = [
    'accounts.google.com',
    'accounts.youtube.com',
    'ServiceLogin',
    'signin/identifier'
  ];

  /**
   * Check if the API is configured
   * @returns {boolean}
   */
  function isConfigured() {
    return CONFIG.SCRIPT_URL && CONFIG.SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL';
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a URL or string indicates a Google auth redirect
   * @param {string} str - URL or error message to check
   * @returns {boolean}
   */
  function isGoogleAuthRedirect(str) {
    if (!str) return false;
    return GOOGLE_AUTH_PATTERNS.some(pattern => str.includes(pattern));
  }

  /**
   * Log a structured diagnostic block to the console
   * @param {string} level - 'info', 'warn', or 'error'
   * @param {string} title - Block title
   * @param {Object} details - Key-value pairs to log
   */
  function logDiagnostic(level, title, details) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[API] ─── ${title} ───`);
    for (const [key, value] of Object.entries(details)) {
      if (value !== undefined && value !== null && value !== '') {
        fn(`[API]   ${key}: ${value}`);
      }
    }
    fn(`[API] ${'─'.repeat(title.length + 8)}`);
  }

  /**
   * Build the fetch URL for a given base URL, action, and params
   * @param {string} baseUrl - Base endpoint URL
   * @param {string} action - API action
   * @param {Object} params - Request parameters
   * @param {string} method - HTTP method
   * @param {AbortSignal} signal - Abort signal
   * @returns {{url: string, fetchOptions: Object}}
   */
  function buildRequest(baseUrl, action, params, method, signal) {
    const url = new URL(baseUrl, window.location.origin);
    const fetchOptions = { signal, redirect: 'follow' };

    url.searchParams.set('action', action);

    // GAS redirects POST→GET during its 302 execution flow, which drops the
    // request body. To work around this, all data is sent as query parameters
    // using GET. GAS doGet() reads params via e.parameter.
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
    fetchOptions.method = 'GET';

    const urlString = url.toString();

    // Warn if URL is very long (browser limits vary, ~8KB is safe for most)
    if (urlString.length > 7000) {
      console.warn(`[API] URL length is ${urlString.length} chars — may exceed browser limits`);
    }

    return { url: urlString, fetchOptions };
  }

  /**
   * Diagnose a response and return parsed data or throw a descriptive error
   * @param {Response} response - Fetch response
   * @param {string} action - API action name
   * @param {string} endpoint - Which endpoint was used ('direct' or 'proxy')
   * @returns {Promise<Object>} Parsed JSON data
   * @throws {ApiError}
   */
  async function diagnoseResponse(response, action, endpoint) {
    const responseUrl = response.url || '(unknown)';
    const contentType = response.headers.get('content-type') || '(none)';
    const status = response.status;
    const statusText = response.statusText || '';
    const tag = `[${endpoint}]`;

    // Detect opaque redirects (from redirect: 'manual' on proxy fallback)
    if (response.type === 'opaqueredirect') {
      logDiagnostic('error', `${tag} OPAQUE REDIRECT`, {
        'Response URL': responseUrl,
        'Status': `${status}`,
        'Likely cause': 'Netlify proxy cannot resolve GAS redirect chain'
      });
      throw new ApiError('Proxy returned redirect', 'REDIRECT_ERROR', status);
    }

    // Non-OK status
    if (!response.ok) {
      let bodyPreview = '';
      try { bodyPreview = (await response.text()).substring(0, 300); } catch (e) { /* ignore */ }

      logDiagnostic('error', `${tag} HTTP ${status} ERROR`, {
        'Action': action,
        'Status': `${status} ${statusText}`,
        'Response URL': responseUrl,
        'Content-Type': contentType,
        'Body preview': bodyPreview || '(empty)'
      });
      throw new ApiError(`HTTP error: ${status} ${statusText}`, 'HTTP_ERROR', status);
    }

    // Read body
    const text = await response.text();

    // Check if the final URL (after redirects) is a Google login page
    if (isGoogleAuthRedirect(responseUrl)) {
      logDiagnostic('error', `${tag} REDIRECTED TO GOOGLE LOGIN`, {
        'Action': action,
        'Final URL': responseUrl,
        'Problem': 'GAS redirected to Google login instead of returning data',
        'Fix': 'Redeploy GAS: Deploy > New deployment > Web app > Who has access: Anyone'
      });
      throw new ApiError(
        'Server configuratiefout — neem contact op met de beheerder',
        'AUTH_REDIRECT',
        status
      );
    }

    // Check for HTML response (login page or error page instead of JSON)
    if (contentType.includes('text/html') || text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html')) {
      const isAuth = isGoogleAuthRedirect(text);

      logDiagnostic('error', `${tag} ${isAuth ? 'GOOGLE LOGIN PAGE' : 'HTML RESPONSE'} (expected JSON)`, {
        'Action': action,
        'Response URL': responseUrl,
        'Content-Type': contentType,
        'Body preview': text.substring(0, 200).replace(/\n/g, ' '),
        ...(isAuth ? { 'Fix': 'Redeploy GAS with "Anyone" access' } : {})
      });
      throw new ApiError(
        isAuth ? 'Server configuratiefout — neem contact op met de beheerder' : 'Server returned HTML instead of JSON',
        isAuth ? 'AUTH_REDIRECT' : 'PARSE_ERROR',
        status
      );
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      logDiagnostic('error', `${tag} INVALID JSON`, {
        'Action': action,
        'Parse error': parseError.message,
        'Content-Type': contentType,
        'Body preview': text.substring(0, 200)
      });
      throw new ApiError('Invalid JSON response from server', 'PARSE_ERROR');
    }

    return data;
  }

  /**
   * Classify whether an error is retryable
   * @param {Error} error - The error to classify
   * @returns {{retryable: boolean, reason: string}}
   */
  function classifyError(error) {
    if (error.name === 'AbortError') {
      return { retryable: false, reason: 'Request timed out' };
    }
    if (error instanceof ApiError) {
      if (error.code === 'AUTH_REDIRECT') {
        return { retryable: false, reason: 'GAS requires authentication (retrying won\'t help)' };
      }
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return { retryable: false, reason: `Client error ${error.statusCode}` };
      }
      if (error.code === 'PARSE_ERROR') {
        return { retryable: false, reason: 'Non-JSON response (retrying won\'t help)' };
      }
    }
    // Network errors, 5xx, REDIRECT_ERROR are retryable (proxy fallback may help)
    return { retryable: true, reason: '' };
  }

  /**
   * Try a single fetch against a given endpoint
   * @param {string} baseUrl - Endpoint URL
   * @param {string} action - API action
   * @param {Object} params - Request parameters
   * @param {string} method - HTTP method
   * @param {number} timeout - Timeout in ms
   * @param {string} label - Endpoint label for logging
   * @returns {Promise<Object>} Parsed response data
   */
  async function tryEndpoint(baseUrl, action, params, method, timeout, label) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const { url, fetchOptions } = buildRequest(baseUrl, action, params, method, controller.signal);

    // Use redirect: 'manual' for the proxy to detect redirect failures
    if (label === 'proxy') {
      fetchOptions.redirect = 'manual';
    }

    const logUrl = new URL(url, window.location.origin);
    console.log(`[API] ${label}: ${method} ${logUrl.pathname}?action=${logUrl.searchParams.get('action')}`);
    const startTime = performance.now();

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - startTime);
      console.log(`[API] ${label}: response in ${elapsed}ms — status: ${response.status}, type: ${response.type}`);

      return await diagnoseResponse(response, action, label);
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      console.warn(`[API] ${label}: failed in ${elapsed}ms — ${error.message}`);
      throw error;
    }
  }

  /**
   * Race two endpoints in parallel, returning the first successful result.
   * If both fail, throws the most relevant error (non-retryable preferred).
   * @param {string} directUrl - Direct GAS endpoint
   * @param {string} proxyUrl - Proxy endpoint
   * @param {string} action - API action
   * @param {Object} params - Request parameters
   * @param {string} method - HTTP method
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<Object>} Parsed response data from whichever endpoint wins
   */
  async function raceEndpoints(directUrl, proxyUrl, action, params, method, timeout) {
    const directPromise = tryEndpoint(directUrl, action, params, method, timeout, 'direct')
      .then(data => ({ data, source: 'direct' }));
    const proxyPromise = tryEndpoint(proxyUrl, action, params, method, timeout, 'proxy')
      .then(data => ({ data, source: 'proxy' }));

    // Use Promise.any to get the first successful result
    // If both fail, Promise.any throws an AggregateError
    try {
      const result = await Promise.any([directPromise, proxyPromise]);
      console.log(`[API] Won by ${result.source} endpoint`);
      return result.data;
    } catch (aggregateError) {
      // Both failed — pick the best error to propagate
      const errors = aggregateError.errors || [];
      // Prefer non-retryable errors (they carry more specific info)
      const nonRetryable = errors.find(e => !classifyError(e).retryable);
      throw nonRetryable || errors[0] || new ApiError('Both endpoints failed', 'NETWORK_ERROR');
    }
  }

  /**
   * Make an API request. Races direct GAS URL and proxy in parallel.
   * Retries with exponential backoff for transient errors.
   *
   * @param {string} action - The API action to perform
   * @param {Object} params - The data to send
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method: 'GET' or 'POST' (default: 'GET')
   * @param {number} options.maxRetries - Maximum retry attempts (default: CONSTANTS.RETRY.MAX_ATTEMPTS)
   * @param {number} options.timeout - Request timeout in ms (default: CONSTANTS.TIMEOUTS.API_REQUEST)
   * @param {Function} options.onProgress - Callback: (attempt, maxAttempts) => void
   * @returns {Promise<Object>} - The API response
   * @throws {ApiError}
   */
  async function request(action, params = {}, options = {}) {
    const method = options.method || 'GET';
    const maxRetries = options.maxRetries ?? CONSTANTS.RETRY.MAX_ATTEMPTS;
    const timeout = options.timeout ?? CONSTANTS.TIMEOUTS.API_REQUEST;
    const onProgress = options.onProgress || null;

    if (!isConfigured()) {
      throw new ApiError('API not configured', 'CONFIG_ERROR');
    }

    const directUrl = CONFIG.SCRIPT_URL;
    const proxyUrl = CONFIG.PROXY_URL;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (onProgress) onProgress(attempt + 1, maxRetries);

      // Race direct and proxy endpoints in parallel for faster response
      if (proxyUrl) {
        try {
          const data = await raceEndpoints(directUrl, proxyUrl, action, params, method, timeout);
          console.log(`[API] ${action} success:`, data);
          return data;
        } catch (raceError) {
          lastError = raceError;
          const { retryable, reason } = classifyError(raceError);

          if (!retryable) {
            logDiagnostic('error', 'NON-RETRYABLE ERROR', {
              'Action': action,
              'Error': raceError.message,
              'Code': raceError.code || raceError.name,
              'Reason': reason
            });
            if (raceError instanceof ApiError) throw raceError;
            if (raceError.name === 'AbortError') throw new ApiError('Request timed out', 'TIMEOUT_ERROR');
            throw new ApiError(raceError.message, 'NETWORK_ERROR');
          }
        }
      } else {
        // No proxy — try direct only
        try {
          const data = await tryEndpoint(directUrl, action, params, method, timeout, 'direct');
          console.log(`[API] ${action} success (direct):`, data);
          return data;
        } catch (directError) {
          lastError = directError;
          const { retryable, reason } = classifyError(directError);

          if (!retryable) {
            logDiagnostic('error', 'NON-RETRYABLE ERROR', {
              'Action': action,
              'Endpoint': 'direct',
              'Error': directError.message,
              'Code': directError.code || directError.name,
              'Reason': reason
            });
            if (directError instanceof ApiError) throw directError;
            if (directError.name === 'AbortError') throw new ApiError('Request timed out', 'TIMEOUT_ERROR');
            throw new ApiError(directError.message, 'NETWORK_ERROR');
          }
        }
      }

      // Both endpoints failed — retry with backoff
      if (attempt < maxRetries - 1) {
        const delay = CONSTANTS.TIMEOUTS.RETRY_BASE * Math.pow(CONSTANTS.RETRY.BACKOFF_MULTIPLIER, attempt);
        console.log(`[API] Retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
        await sleep(delay);
      }
    }

    logDiagnostic('error', 'ALL RETRIES EXHAUSTED', {
      'Action': action,
      'Attempts': maxRetries,
      'Last error': lastError?.message || '(unknown)',
      'Error code': lastError?.code || lastError?.name || '(unknown)'
    });

    throw lastError || new ApiError('Request failed after retries', 'NETWORK_ERROR');
  }

  /**
   * Validate an organization code
   * @param {string} code - The organization code to validate
   * @returns {Promise<{success: boolean, organizationName?: string, message?: string}>}
   */
  async function validateCode(code, options = {}) {
    const result = await request('checkCode', { code: code }, options);
    return {
      success: result.success,
      organizationName: result.organisatie || '',
      message: result.error || ''
    };
  }

  /**
   * Submit survey data
   * @param {Object} formData - The form data to submit
   * @returns {Promise<{success: boolean, documentUrl?: string, message?: string}>}
   */
  async function submitSurvey(formData) {
    const result = await request('saveResponses', {
      code: formData.orgCode,
      data: formData
    }, { method: 'POST' });
    return {
      success: result.success,
      message: result.message || result.error || ''
    };
  }

  /**
   * Log startup diagnostics: config info + probe both endpoints
   */
  function logStartupDiagnostic() {
    console.log('[API] ─── STARTUP DIAGNOSTIC ───');
    console.log(`[API]   Direct URL: ${CONFIG.SCRIPT_URL || '(not set)'}`);
    console.log(`[API]   Proxy URL: ${CONFIG.PROXY_URL || '(not set)'}`);
    console.log(`[API]   Demo mode: ${CONFIG.isDemoMode()}`);
    console.log(`[API]   Origin: ${window.location.origin}`);
    console.log('[API] ─────────────────────────');

    // Probe direct GAS endpoint
    probeEndpoint(CONFIG.SCRIPT_URL, 'direct');
    // Probe Netlify proxy
    if (CONFIG.PROXY_URL) {
      probeEndpoint(new URL(CONFIG.PROXY_URL, window.location.origin).toString(), 'proxy');
    }
  }

  /**
   * Probe an endpoint to check if it's reachable and returns JSON
   * @param {string} url - Endpoint URL to probe
   * @param {string} label - Label for logging
   */
  function probeEndpoint(url, label) {
    if (!url) return;

    const probeUrl = url + (url.includes('?') ? '&' : '?') + 'action=ping';
    const isProxy = label === 'proxy';

    fetch(probeUrl, { method: 'GET', redirect: isProxy ? 'manual' : 'follow' })
      .then(response => {
        if (response.type === 'opaqueredirect') {
          console.error(`[API] ─── PROBE ${label}: REDIRECT (BAD) ───`);
          console.error(`[API]   Proxy is redirecting instead of proxying`);
          console.error(`[API] ────────────────────────────────`);
          return;
        }

        if (response.ok) {
          response.text().then(body => {
            const isJson = body.trimStart().startsWith('{') || body.trimStart().startsWith('[');
            const isHtml = body.trimStart().startsWith('<!') || body.trimStart().startsWith('<html');
            const isAuth = isGoogleAuthRedirect(body) || isGoogleAuthRedirect(response.url);

            if (isAuth) {
              console.error(`[API] ─── PROBE ${label}: GOOGLE LOGIN (BAD) ───`);
              console.error(`[API]   GAS requires reauthorization`);
              console.error(`[API]   Final URL: ${response.url}`);
              console.error(`[API] ──────────────────────────────────────`);
            } else if (isJson) {
              console.log(`[API] ─── PROBE ${label}: OK ───`);
              console.log(`[API]   Status: ${response.status}`);
              console.log(`[API]   Body: ${body.substring(0, 100)}`);
              console.log(`[API] ──────────────────────`);
            } else {
              console.warn(`[API] ─── PROBE ${label}: UNEXPECTED ───`);
              console.warn(`[API]   Content: ${isHtml ? 'HTML' : 'unknown'}`);
              console.warn(`[API]   Preview: ${body.substring(0, 100)}`);
              console.warn(`[API] ──────────────────────────────`);
            }
          }).catch(() => {});
        } else {
          console.warn(`[API] ─── PROBE ${label}: HTTP ${response.status} ───`);
          console.warn(`[API] ──────────────────────────────`);
        }
      })
      .catch(err => {
        console.error(`[API] ─── PROBE ${label}: FAILED ───`);
        console.error(`[API]   ${err.message}`);
        console.error(`[API] ──────────────────────────`);
      });
  }

  // Defer startup diagnostic so it doesn't compete with login requests
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(logStartupDiagnostic);
  } else {
    setTimeout(logStartupDiagnostic, 2000);
  }

  // Public API
  return {
    isConfigured,
    request,
    validateCode,
    submitSurvey
  };
})();

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code (CONFIG_ERROR, HTTP_ERROR, TIMEOUT_ERROR, NETWORK_ERROR, AUTH_REDIRECT, REDIRECT_ERROR, PARSE_ERROR)
   * @param {number} [statusCode] - HTTP status code if applicable
   */
  constructor(message, code, statusCode = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Make ApiError available globally
window.ApiError = ApiError;

// Make ApiClient available globally
window.ApiClient = ApiClient;
