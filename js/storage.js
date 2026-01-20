/**
 * Storage utility for Monitoring Cultureel Talent naar de Top
 * Provides safe localStorage operations with error handling
 */

const Storage = (function() {
  'use strict';

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  function isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Safely get and parse JSON from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist or parse fails
   * @returns {*} Parsed value or default
   */
  function getJSON(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (e) {
      // Log error in development, but don't expose to user
      if (typeof console !== 'undefined' && CONFIG.isDemoMode && CONFIG.isDemoMode()) {
        console.warn(`Storage.getJSON failed for key "${key}":`, e);
      }
      return defaultValue;
    }
  }

  /**
   * Safely stringify and store JSON in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      // Could be quota exceeded or other storage error
      if (typeof console !== 'undefined' && CONFIG.isDemoMode && CONFIG.isDemoMode()) {
        console.warn(`Storage.setJSON failed for key "${key}":`, e);
      }
      return false;
    }
  }

  /**
   * Remove an item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear multiple keys from localStorage
   * @param {string[]} keys - Array of keys to remove
   * @returns {boolean} Success status (true if all succeeded)
   */
  function removeMultiple(keys) {
    return keys.every(key => remove(key));
  }

  // Session-specific helpers

  /**
   * Get the current session
   * @returns {Object|null} Session object or null
   */
  function getSession() {
    return getJSON(CONFIG.STORAGE_KEYS.SESSION, null);
  }

  /**
   * Save session data
   * @param {Object} sessionData - Session data to save
   * @returns {boolean} Success status
   */
  function saveSession(sessionData) {
    return setJSON(CONFIG.STORAGE_KEYS.SESSION, sessionData);
  }

  /**
   * Check if session is valid (exists and not expired)
   * @returns {boolean}
   */
  function isSessionValid() {
    const session = getSession();
    if (!session || !session.orgCode || !session.timestamp) {
      return false;
    }
    return (Date.now() - session.timestamp) < CONFIG.SESSION_TIMEOUT;
  }

  /**
   * Clear all session-related data
   * @returns {boolean} Success status
   */
  function clearSession() {
    return removeMultiple([
      CONFIG.STORAGE_KEYS.SESSION,
      CONFIG.STORAGE_KEYS.FORM_DATA
    ]);
  }

  /**
   * Get saved form data
   * @returns {Object|null} Form data or null
   */
  function getFormData() {
    return getJSON(CONFIG.STORAGE_KEYS.FORM_DATA, null);
  }

  /**
   * Save form data
   * @param {Object} formData - Form data to save
   * @returns {boolean} Success status
   */
  function saveFormData(formData) {
    return setJSON(CONFIG.STORAGE_KEYS.FORM_DATA, formData);
  }

  /**
   * Clear saved form data
   * @returns {boolean} Success status
   */
  function clearFormData() {
    return remove(CONFIG.STORAGE_KEYS.FORM_DATA);
  }

  // Public API
  return {
    isAvailable,
    getJSON,
    setJSON,
    remove,
    removeMultiple,
    getSession,
    saveSession,
    isSessionValid,
    clearSession,
    getFormData,
    saveFormData,
    clearFormData
  };
})();
