// ============================================
// KSLT Admin — Utility Functions
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    function setupBulkDelete(opts) {
        var table = document.getElementById(opts.tableId);
        if (!table) return;

        // Guard: don't set up twice
        if (table.querySelector('.ad-bulk-all')) return;

        var thead = table.querySelector('thead tr');
        if (!thead) return;

        // Add checkbox header
        var thCheck = document.createElement('th');
        thCheck.style.width = '36px';
        thCheck.innerHTML = '<input type="checkbox" class="ad-bulk-all" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">';
        thead.insertBefore(thCheck, thead.firstChild);

        // Add bulk delete button (hidden initially)
        var btnWrap = document.createElement('div');
        btnWrap.className = 'ad-bulk-actions';
        btnWrap.style.display = 'none';
        btnWrap.innerHTML = '<button class="ad-btn ad-btn-danger ad-btn-sm ad-bulk-delete-btn">' + L.deleteSelected + ' (<span class="ad-bulk-count">0</span>)</button>';
        table.parentNode.parentNode.insertBefore(btnWrap, table.parentNode);

        var checkAll = thCheck.querySelector('.ad-bulk-all');
        var bulkBtn = btnWrap.querySelector('.ad-bulk-delete-btn');
        var countEl = btnWrap.querySelector('.ad-bulk-count');

        function updateBulkUI() {
            var checked = table.querySelectorAll('tbody .ad-bulk-item:checked');
            var total = table.querySelectorAll('tbody .ad-bulk-item');
            var count = checked.length;
            btnWrap.style.display = count > 0 ? 'flex' : 'none';
            countEl.textContent = count;
            checkAll.checked = total.length > 0 && count === total.length;
        }

        // Select all
        checkAll.addEventListener('change', function() {
            var boxes = table.querySelectorAll('tbody .ad-bulk-item');
            boxes.forEach(function(cb) { cb.checked = checkAll.checked; });
            updateBulkUI();
        });

        // Individual checkboxes (delegate)
        table.addEventListener('change', function(e) {
            if (e.target.classList.contains('ad-bulk-item')) {
                updateBulkUI();
            }
        });

        // Prevent row click when clicking checkbox
        table.addEventListener('click', function(e) {
            if (e.target.classList.contains('ad-bulk-item') || e.target.closest('.ad-bulk-cell')) {
                e.stopPropagation();
            }
        });

        // Bulk delete
        bulkBtn.addEventListener('click', function() {
            var checked = table.querySelectorAll('tbody .ad-bulk-item:checked');
            var ids = [];
            checked.forEach(function(cb) { ids.push(cb.dataset.bulkId); });
            if (ids.length === 0) return;

            showConfirm(opts.confirmMsg || L.deleteSelectedConfirm, L.deleteConfirmText, async function() {
                var result = await A.client.from(opts.tableName).delete().in('id', ids);
                if (result.error) {
                    showToast(result.error.message, 'error');
                } else {
                    showToast(isEn ? 'Deleted ' + ids.length + ' items' : 'Удалено: ' + ids.length, 'success');
                    opts.reloadFn();
                }
            });
        });
    }

    /**
     * Returns checkbox TD html for a row.
     */
    function bulkCheckboxTd(id) {
        return '<td class="ad-bulk-cell" style="width:36px;text-align:center;">' +
            '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">' +
        '</td>';
    }

    function transliterate(text) {
        var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        return text.split('').map(function(c) {
            var lower = c.toLowerCase();
            var mapped = map[lower];
            if (mapped === undefined) return c;
            if (mapped === '') return '';
            if (c !== lower) return mapped.charAt(0).toUpperCase() + mapped.slice(1);
            return mapped;
        }).join('');
    }

    function slugify(text) {
        var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        return text.toLowerCase().split('').map(function(c) { return map[c] || c; }).join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function sel(article, field, value) {
        return (article && article[field] === value) ? ' selected' : '';
    }

    function formatDateLocal(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        if (isNaN(d)) return '';
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    // ---- Toast ----
    function showToast(message, type) {
        var existing = document.querySelector('.ad-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'ad-toast ad-toast-' + (type || 'success');
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('ad-toast-show');
        });

        setTimeout(function() {
            toast.classList.remove('ad-toast-show');
            setTimeout(function() { toast.remove(); }, 400);
        }, 3000);
    }

    // ---- Confirm Modal ----
    function showConfirm(title, text, onConfirm, confirmLabel, onCancel) {
        var btnLabel = confirmLabel || L.delete;
        var btnClass = confirmLabel ? 'ad-btn-primary' : 'ad-btn-danger';
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
            '<div class="ad-confirm-modal">' +
                '<div class="ad-confirm-title">' + title + '</div>' +
                '<div class="ad-confirm-text">' + text + '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adConfirmCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ' + btnClass + '" id="adConfirmOk">' + btnLabel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        function dismiss() { overlay.remove(); if (onCancel) onCancel(); }
        document.getElementById('adConfirmCancel').addEventListener('click', dismiss);
        document.getElementById('adConfirmOk').addEventListener('click', function() { overlay.remove(); onConfirm(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
    }

    // ---- Translation (MyMemory API, free, no key) ----

    // Translate filled field(s) to empty ones (auto-detect source language)
    async function translateToEmpty(ruId, enId, kgId, btn) {
        var ruEl = document.getElementById(ruId);
        var enEl = document.getElementById(enId);
        var kgEl = kgId ? document.getElementById(kgId) : null;

        var ruVal = ruEl ? ruEl.value.trim() : '';
        var enVal = enEl ? enEl.value.trim() : '';
        var kgVal = kgEl ? kgEl.value.trim() : '';

        // Find source: first non-empty
        var srcLang = '';
        var srcText = '';
        if (ruVal) { srcLang = 'ru'; srcText = ruVal; }
        else if (enVal) { srcLang = 'en'; srcText = enVal; }
        else if (kgVal) { srcLang = 'kg'; srcText = kgVal; }

        if (!srcText) {
            showToast(L.fillRuFirst, 'error');
            return;
        }

        // Determine targets
        var targets = [];
        if (!ruVal && ruEl && srcLang !== 'ru') targets.push({ el: ruEl, lang: 'ru' });
        if (!enVal && enEl && srcLang !== 'en') targets.push({ el: enEl, lang: 'en' });
        if (!kgVal && kgEl && srcLang !== 'kg') targets.push({ el: kgEl, lang: 'kg' });

        if (targets.length === 0) {
            showToast(L.allFieldsFilled, 'info');
            return;
        }

        var origLabel = btn.textContent;
        btn.textContent = L.translating;
        btn.disabled = true;

        try {
            var failed = 0;
            for (var i = 0; i < targets.length; i++) {
                var result = await translateText(srcText, srcLang, targets[i].lang);
                targets[i].el.value = result;
                if (result === srcText) failed++;
            }
            if (failed > 0) {
                showToast(isEn ? 'Some translations may be inaccurate. Check and edit manually.' : 'Некоторые переводы могут быть неточными. Проверьте и отредактируйте вручную.', 'warning');
            }
        } catch (e) {
            showToast(L.translateError, 'error');
        }

        btn.textContent = origLabel;
        btn.disabled = false;
    }

    async function translateFromRu(text, targetLang) {
        return translateText(text, 'ru', targetLang);
    }

    async function translateText(text, fromLang, toLang) {
        var langMap = { ru: 'ru', en: 'en', kg: 'ky' };
        var from = langMap[fromLang] || fromLang;
        var to = langMap[toLang] || toLang;

        // Split long text into chunks (API limit ~500 chars)
        var lines = text.split('\n');
        var chunks = [];
        var current = '';

        for (var i = 0; i < lines.length; i++) {
            var next = current ? current + '\n' + lines[i] : lines[i];
            if (next.length > 450 && current) {
                chunks.push(current);
                current = lines[i];
            } else {
                current = next;
            }
        }
        if (current) chunks.push(current);

        var results = [];
        for (var j = 0; j < chunks.length; j++) {
            var url = 'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(chunks[j]) + '&langpair=' + from + '|' + to;
            var resp = await fetch(url);
            var data = await resp.json();
            if (data.responseData && data.responseData.translatedText) {
                results.push(data.responseData.translatedText);
            } else {
                results.push(chunks[j]);
            }
        }

        return results.join('\n');
    }


    // ---- Consolidated Upload Image ----
    async function uploadImage(file, prefix) {
        if (!A.client || !file) return null;
        var ext = file.name.split('.').pop().toLowerCase();
        var filename = (prefix || '') + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;
        try {
            var result = await A.client.storage.from('news').upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (result.error) {
                showToast('Storage: ' + (result.error.message || result.error.statusCode || JSON.stringify(result.error)), 'error');
                return null;
            }
            var urlResult = A.client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            return null;
        }
    }

    // ---- CSV Export (Excel-compatible) ----
    function exportCsv(filename, headers, rows) {
        var BOM = '\uFEFF';
        var csvRows = [];
        csvRows.push(headers.map(csvCell).join(','));
        for (var i = 0; i < rows.length; i++) {
            csvRows.push(rows[i].map(csvCell).join(','));
        }
        var csvString = BOM + csvRows.join('\r\n');
        var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function csvCell(val) {
        var s = val === null || val === undefined ? '' : String(val);
        if (s.indexOf('"') !== -1 || s.indexOf(',') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    // ---- Export to namespace ----
    A.showToast = showToast;
    A.showConfirm = showConfirm;
    A.esc = esc;
    A.sel = sel;
    A.transliterate = transliterate;
    A.slugify = slugify;
    A.formatDateLocal = formatDateLocal;
    A.translateFromRu = translateFromRu;
    A.translateToEmpty = translateToEmpty;
    A.translateText = translateText;
    A.setupBulkDelete = setupBulkDelete;
    A.bulkCheckboxTd = bulkCheckboxTd;
    A.uploadImage = uploadImage;
    A.exportCsv = exportCsv;

})();
