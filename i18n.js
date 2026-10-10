const fs = require('fs');
const path = require('path');

// Load all available locales
const locales = {};
const localeDir = path.join(__dirname, 'locales');

try {
  const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));
  files.forEach(file => {
    const langCode = file.replace('.json', '');
    try {
      locales[langCode] = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
    } catch (e) {
      console.error(`Failed to load locale ${langCode}:`, e);
    }
  });
} catch (e) {
  console.error('Failed to load locales directory:', e);
}

// Default language
const DEFAULT_LANGUAGE = 'en';
let currentLanguage = DEFAULT_LANGUAGE;

// Translation function with interpolation
function t(key, params = {}) {
  const keys = key.split('.');
  let value = locales[currentLanguage];
  
  // Traverse the nested object
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fall back to English if key not found in current language
      value = locales[DEFAULT_LANGUAGE];
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          // Return the key if not found in English either
          return key;
        }
      }
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Interpolate parameters
  return value.replace(/\{(\w+)\}/g, (match, param) => {
    return params[param] !== undefined ? params[param] : match;
  });
}

// Set language
function setLanguage(lang) {
  if (locales[lang]) {
    currentLanguage = lang;
    return true;
  }
  return false;
}

// Get current language
function getLanguage() {
  return currentLanguage;
}

// Get available languages
function getAvailableLanguages() {
  return Object.keys(locales);
}

// Check if language is available
function hasLanguage(lang) {
  return !!locales[lang];
}

// For renderer-side use (browser environment)
if (typeof window !== 'undefined') {
  window.i18n = {
    t,
    setLanguage,
    getLanguage,
    getAvailableLanguages,
    hasLanguage,
    DEFAULT_LANGUAGE
  };
}

// For main process use (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    t,
    setLanguage,
    getLanguage,
    getAvailableLanguages,
    hasLanguage,
    DEFAULT_LANGUAGE,
    locales
  };
}
