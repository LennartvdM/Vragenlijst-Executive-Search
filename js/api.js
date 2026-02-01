/**
 * API Client for Monitoring Cultureel Talent naar de Top
 * Centralizes all backend communication with proper error handling and retries
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
   * Check if a URL or error message indicates a Google auth redirect
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
   * Build the fetch URL and options for a request
   * @param {string} action - API action
   * @param {Object} params - Request parameters
   * @param {string} method - HTTP method
   * @param {AbortSignal} signal - Abort signal
   * @returns {{url: URL, fetchOptions: Object}}
   */
  function buildRequest(action, params, method, signal) {
    const url = new URL(CONFIG.SCRIPT_URL, window.location.origin);
    const fetchOptions = { signal, method, redirect: 'manual' };

    url.searchParams.set('action', action);

    if (method === 'POST') {
      fetchOptions.headers = { 'Content-Type': 'text/plain' };
      fetchOptions.body = JSON.stringify(params);
    } else {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    return { url, fetchOptions };
  }

  /**
   * Diagnose a response and return parsed data or throw a descriptive error
   * @param {Response} response - Fetch response
   * @param {string} action - API action name
   * @returns {Promise<Object>} Parsed JSON data
   * @throws {ApiError}
   */
  async function diagnoseResponse(response, action) {
    const responseUrl = response.url || '(unknown)';
    const contentType = response.headers.get('content-type') || '(none)';
    const status = response.status;
    const statusText = response.statusText || '';

    // Detect redirects (status 0xx, 3xx) — with redirect: 'manual' these come through as opaque-redirect
    if (response.type === 'opaqueredirect' || (status >= 300 && status < 400)) {
      const location = response.headers.get('location') || '(not exposed by browser)';

      if (isGoogleAuthRedirect(location) || isGoogleAuthRedirect(responseUrl)) {
        logDiagnostic('error', 'GOOGLE AUTH REDIRECT DETECTED', {
          'Problem': 'Google Apps Script is redirecting to login instead of responding with data',
          'Redirect to': location,
          'Response URL': responseUrl,
          'Status': `${status} ${statusText}`,
          'Likely cause': 'The GAS Web App deployment needs reauthorization or is not set to "Anyone" access',
          'Fix': 'Redeploy the Google Apps Script: Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone'
        });
        throw new ApiError(
          'Google Apps Script requires authentication — redeploy with "Anyone" access',
          'AUTH_REDIRECT',
          status
        );
      }

      logDiagnostic('warn', 'UNEXPECTED REDIRECT', {
        'Location': location,
        'Response URL': responseUrl,
        'Status': `${status} ${statusText}`,
        'Response type': response.type
      });
      throw new ApiError(`Unexpected redirect (${status})`, 'REDIRECT_ERROR', status);
    }

    // Non-OK status
    if (!response.ok) {
      let bodyPreview = '';
      try { bodyPreview = (await response.text()).substring(0, 300); } catch (e) { /* ignore */ }

      logDiagnostic('error', `HTTP ${status} ERROR`, {
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

    // Check for HTML response (indicates proxy returned a web page instead of JSON)
    if (contentType.includes('text/html') || text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html')) {
      const isGoogleAuth = isGoogleAuthRedirect(text) || isGoogleAuthRedirect(responseUrl);

      logDiagnostic('error', isGoogleAuth ? 'GOOGLE LOGIN PAGE RETURNED' : 'HTML RESPONSE (expected JSON)', {
        'Action': action,
        'Response URL': responseUrl,
        'Content-Type': contentType,
        'Body preview': text.substring(0, 300).replace(/\n/g, ' '),
        ...(isGoogleAuth ? {
          'Problem': 'The Netlify proxy followed the redirect and returned Google\'s login page',
          'Fix': 'Redeploy the Google Apps Script with "Anyone" access'
        } : {
          'Problem': 'Expected JSON but received HTML — the proxy may be returning an error page'
        })
      });

      throw new ApiError(
        isGoogleAuth
          ? 'Google Apps Script requires authentication — redeploy with "Anyone" access'
          : 'Server returned HTML instead of JSON',
        isGoogleAuth ? 'AUTH_REDIRECT' : 'PARSE_ERROR',
        status
      );
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      logDiagnostic('error', 'INVALID JSON RESPONSE', {
        'Action': action,
        'Response URL': responseUrl,
        'Content-Type': contentType,
        'Parse error': parseError.message,
        'Body preview': text.substring(0, 300)
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
      // Auth redirects will never resolve by retrying
      if (error.code === 'AUTH_REDIRECT') {
        return { retryable: false, reason: 'Google Apps Script authentication issue (retrying won\'t help)' };
      }
      // Unexpected redirects are also not retryable
      if (error.code === 'REDIRECT_ERROR') {
        return { retryable: false, reason: 'Server redirect issue (retrying won\'t help)' };
      }
      // Client errors (4xx) are not retryable
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return { retryable: false, reason: `Client error ${error.statusCode}` };
      }
      // Parse errors from HTML responses won't fix themselves
      if (error.code === 'PARSE_ERROR') {
        return { retryable: false, reason: 'Server returned non-JSON response (retrying won\'t help)' };
      }
    }
    // Network errors, 5xx, etc. are retryable
    return { retryable: true, reason: '' };
  }

  /**
   * Make an API request with retry logic
   * @param {string} action - The API action to perform
   * @param {Object} params - The data to send
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method: 'GET' or 'POST' (default: 'GET')
   * @param {number} options.maxRetries - Maximum retry attempts (default: CONSTANTS.RETRY.MAX_ATTEMPTS)
   * @param {number} options.timeout - Request timeout in ms (default: CONSTANTS.TIMEOUTS.API_REQUEST)
   * @param {Function} options.onProgress - Callback for retry progress: (attempt, maxAttempts) => void
   * @returns {Promise<Object>} - The API response
   * @throws {ApiError} - On request failure after all retries
   */
  async function request(action, params = {}, options = {}) {
    const method = options.method || 'GET';
    const maxRetries = options.maxRetries ?? CONSTANTS.RETRY.MAX_ATTEMPTS;
    const timeout = options.timeout ?? CONSTANTS.TIMEOUTS.API_REQUEST;
    const onProgress = options.onProgress || null;

    if (!isConfigured()) {
      throw new ApiError('API not configured', 'CONFIG_ERROR');
    }

    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (onProgress) {
        onProgress(attempt + 1, maxRetries);
      }

      const startTime = performance.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const { url, fetchOptions } = buildRequest(action, params, method, controller.signal);

        console.log(`[API] ${method} ${url.toString()} (attempt ${attempt + 1}/${maxRetries})`);
        const response = await fetch(url.toString(), fetchOptions);
        clearTimeout(timeoutId);

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[API] Response in ${elapsed}ms — status: ${response.status}, type: ${response.type}`);

        const data = await diagnoseResponse(response, action);
        console.log(`[API] ${action} success:`, data);
        return data;

      } catch (error) {
        lastError = error;
        const elapsed = Math.round(performance.now() - startTime);
        const { retryable, reason } = classifyError(error);

        if (!retryable) {
          logDiagnostic('error', 'NON-RETRYABLE ERROR', {
            'Action': action,
            'Error': error.message,
            'Code': error.code || error.name,
            'Reason': reason,
            'Elapsed': `${elapsed}ms`
          });
          if (error instanceof ApiError) throw error;
          if (error.name === 'AbortError') throw new ApiError('Request timed out', 'TIMEOUT_ERROR');
          throw new ApiError(error.message, 'NETWORK_ERROR');
        }

        // Retryable error
        const isGoogleCORS = error.message === 'Failed to fetch' && isGoogleAuthRedirect(error.stack || '');
        if (error.message === 'Failed to fetch') {
          logDiagnostic('warn', `FETCH FAILED (attempt ${attempt + 1}/${maxRetries})`, {
            'Action': action,
            'Elapsed': `${elapsed}ms`,
            'Error': error.message,
            'Possible causes': [
              'Network connectivity issue',
              'CORS error (check browser Network tab for blocked requests)',
              'DNS resolution failure',
              'Netlify proxy not routing correctly',
              isGoogleCORS ? 'Google Apps Script auth redirect causing CORS block' : null
            ].filter(Boolean).join('; '),
            'Tip': 'Open browser DevTools > Network tab and look for red/blocked requests to see the actual URL'
          });
        } else {
          console.warn(`[API] ${action} attempt ${attempt + 1} failed (${elapsed}ms): ${error.message}`);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = CONSTANTS.TIMEOUTS.RETRY_BASE * Math.pow(CONSTANTS.RETRY.BACKOFF_MULTIPLIER, attempt);
          console.log(`[API] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
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
   * @param {string} code - Error code (CONFIG_ERROR, HTTP_ERROR, TIMEOUT_ERROR, NETWORK_ERROR)
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
