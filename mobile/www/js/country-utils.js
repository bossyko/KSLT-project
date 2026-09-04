// ========================================
// COUNTRY UTILITIES — KSLT
// flagEmoji, normalizeCountry, countryName, renderCountry
// Self-contained: works with or without countries.js
// ========================================

(function() {
    'use strict';

    /**
     * Convert ISO 3166-1 alpha-2 code to flag emoji
     * @param {string} code — e.g. "KG", "RU"
     * @returns {string} flag emoji or empty string
     */
    function flagEmoji(code) {
        if (!code || code.length !== 2) return '';
        var c = code.toUpperCase();
        return String.fromCodePoint(
            0x1F1E6 + c.charCodeAt(0) - 65,
            0x1F1E6 + c.charCodeAt(1) - 65
        );
    }

    /**
     * Normalize country value: emoji flag → ISO code, or pass through if already code
     * @param {string} val — "🇰🇬" or "KG" or null
     * @returns {string|null} ISO code or null
     */
    function normalizeCountry(val) {
        if (!val) return null;
        val = val.trim();
        if (!val) return null;

        // Already an ISO code (2 uppercase letters)
        if (/^[A-Z]{2}$/.test(val)) return val;

        // Try to extract regional indicator symbols (emoji flag)
        // Regional indicators: U+1F1E6 (🇦) to U+1F1FF (🇿)
        var codePoints = [];
        for (var i = 0; i < val.length;) {
            var cp = val.codePointAt(i);
            if (cp >= 0x1F1E6 && cp <= 0x1F1FF) {
                codePoints.push(cp);
            }
            i += cp > 0xFFFF ? 2 : 1;
        }

        if (codePoints.length === 2) {
            return String.fromCharCode(codePoints[0] - 0x1F1E6 + 65) +
                   String.fromCharCode(codePoints[1] - 0x1F1E6 + 65);
        }

        // Unknown format — return as-is
        return val;
    }

    /**
     * Get country name by ISO code and language
     * @param {string} code — "KG"
     * @param {string} lang — "ru", "en", or "kg"
     * @returns {string} country name or code as fallback
     */
    function countryName(code, lang) {
        if (!code) return '';
        code = code.toUpperCase();
        var countries = window.KSLT_COUNTRIES;
        if (!countries) return code;
        for (var i = 0; i < countries.length; i++) {
            if (countries[i].code === code) {
                return countries[i][lang] || countries[i].en || code;
            }
        }
        return code;
    }

    /**
     * Render country display: flag + optional name
     * @param {string} code — ISO code (or emoji, will be normalized)
     * @param {string} lang — "ru", "en", or "kg"
     * @param {boolean} showName — if true, show "🇰🇬 Кыргызстан"
     * @returns {string} rendered HTML-safe string
     */
    function renderCountry(code, lang, showName) {
        var normalized = normalizeCountry(code);
        if (!normalized) return '';
        var flag = flagEmoji(normalized);
        if (!showName) return flag;
        var name = countryName(normalized, lang || 'ru');
        return flag + ' ' + name;
    }

    // Export
    window.KSLT_COUNTRY = {
        flagEmoji: flagEmoji,
        normalizeCountry: normalizeCountry,
        countryName: countryName,
        renderCountry: renderCountry
    };
})();
