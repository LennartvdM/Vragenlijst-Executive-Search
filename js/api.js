/**
 * API Client for Monitoring Cultureel Talent naar de Top
 * Centralizes all backend communication with proper error handling and retries
 */

const ApiClient = (function() {
  'use strict';

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

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const url = new URL(CONFIG.SCRIPT_URL, window.location.origin);
        const fetchOptions = { signal: controller.signal, method, redirect: 'follow' };

        if (method === 'POST') {
          // POST: action as query param, data in request body
          url.searchParams.set('action', action);
          fetchOptions.headers = { 'Content-Type': 'text/plain' };
          fetchOptions.body = JSON.stringify(params);
        } else {
          // GET: everything as query params
          url.searchParams.set('action', action);
          for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'object') {
              url.searchParams.set(key, JSON.stringify(value));
            } else {
              url.searchParams.set(key, value);
            }
          }
        }

        console.log(`[API] ${method} ${url.toString()} (attempt ${attempt + 1}/${maxRetries})`);
        const response = await fetch(url.toString(), fetchOptions);

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`[API] HTTP error ${response.status} for ${action}`);
          throw new ApiError(
            `HTTP error: ${response.status}`,
            'HTTP_ERROR',
            response.status
          );
        }

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`[API] Invalid JSON response for ${action}:`, text.substring(0, 200));
          throw new ApiError('Invalid JSON response from server', 'PARSE_ERROR');
        }
        console.log(`[API] ${action} success:`, data);
        return data;

      } catch (error) {
        lastError = error;
        console.error(`[API] ${action} attempt ${attempt + 1} failed:`, error.message);

        // Don't retry on abort (timeout) or non-network errors
        if (error.name === 'AbortError') {
          throw new ApiError('Request timed out', 'TIMEOUT_ERROR');
        }

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = CONSTANTS.TIMEOUTS.RETRY_BASE * Math.pow(CONSTANTS.RETRY.BACKOFF_MULTIPLIER, attempt);
          await sleep(delay);
        }
      }
    }

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
