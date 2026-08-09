// @ts-nocheck
// ============================================
// KSLT Admin — Utility Functions
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    /**
     * Sets up bulk-delete UI (checkboxes + delete button) for an admin table.
     * @param {{ tableId: string, tableName: string, confirmMsg?: string, reloadFn: function }} opts
     */
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
    /**
     * Returns HTML for a bulk-select checkbox table cell.
     * @param {string} id - Row identifier
     * @returns {string} HTML string
     */
    function bulkCheckboxTd(id) {
        return '<td class="ad-bulk-cell" style="width:36px;text-align:center;">' +
            '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">' +
        '</td>';
    }

    /**
     * Transliterates Cyrillic text to Latin.
     * @param {string} text
     * @returns {string}
     */
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

    /**
     * Creates a URL-friendly slug from Russian text.
     * @param {string} text
     * @returns {string}
     */
    function slugify(text) {
        var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        return text.toLowerCase().split('').map(function(c) { return map[c] || c; }).join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Escapes HTML entities (& " < >).
     * @param {*} str
     * @returns {string}
     */
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /**
     * Returns ' selected' attribute if article[field] === value.
     * @param {Object} article
     * @param {string} field
     * @param {*} value
     * @returns {string}
     */
    function sel(article, field, value) {
        return (article && article[field] === value) ? ' selected' : '';
    }

    /**
     * Converts ISO date string to local YYYY-MM-DDTHH:MM format.
     * @param {string} isoStr
     * @returns {string}
     */
    function formatDateLocal(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        if (isNaN(d)) return '';
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    /**
     * Shows a toast notification (auto-dismiss 3s).
     * @param {string} message
     * @param {string} [type='success'] - 'success' | 'error' | 'warning' | 'info'
     */
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

    /**
     * Shows a confirm dialog modal.
     * @param {string} title
     * @param {string} text
     * @param {function} onConfirm - Called when user confirms
     * @param {string} [confirmLabel] - Custom confirm button text
     * @param {function} [onCancel] - Called when user cancels
     */
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
        document.getElementById('adConfirmOk').addEventListener('click', async function() { await onConfirm(); overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
    }

    /**
     * Promise-based confirm dialog.
     * @param {string} title
     * @param {string} [text]
     * @param {string} [confirmLabel]
     * @returns {Promise<boolean>}
     */
    function showConfirmAsync(title, text, confirmLabel) {
        return new Promise(function(resolve) {
            showConfirm(
                title,
                text || '',
                function() { resolve(true); },
                confirmLabel || L.confirm || 'OK',
                function() { resolve(false); }
            );
        });
    }

    // ---- Translation (MyMemory API, free, no key) ----

    /**
     * Auto-translates filled form fields to empty ones using MyMemory API.
     * @param {string} ruId - Russian field input ID
     * @param {string} enId - English field input ID
     * @param {string} [kgId] - Kyrgyz field input ID
     * @param {HTMLButtonElement} btn - Trigger button (for loading state)
     */
    async function translateToEmpty(ruId, enId, kgId, btn) {
        var ruEl = document.getElementById(ruId);
        var enEl = document.getElementById(enId);
        var kgEl = kgId ? document.getElementById(kgId) : null;

        var ruVal = ruEl ? ruEl.value.trim() : '';
        var enVal = enEl ? enEl.value.trim() : '';
        var kgVal = kgEl ? kgEl.value.trim() : '';

        // Detect active language tab — translate FROM the currently visible tab
        var activeLang = '';
        var card = btn.closest('.ad-form-card');
        if (card) {
            var activeTab = card.querySelector('.ad-lang-tab.active');
            if (activeTab) activeLang = activeTab.dataset.lang;
        }

        // Find source: active tab first, then first non-empty
        var srcLang = '';
        var srcText = '';
        if (activeLang === 'ru' && ruVal) { srcLang = 'ru'; srcText = ruVal; }
        else if (activeLang === 'en' && enVal) { srcLang = 'en'; srcText = enVal; }
        else if (activeLang === 'kg' && kgVal) { srcLang = 'kg'; srcText = kgVal; }
        else if (ruVal) { srcLang = 'ru'; srcText = ruVal; }
        else if (enVal) { srcLang = 'en'; srcText = enVal; }
        else if (kgVal) { srcLang = 'kg'; srcText = kgVal; }

        if (!srcText) {
            showToast(L.fillRuFirst, 'error');
            return;
        }

        // Переводим в пустые. Поле, где лежит копия исходника, тоже считаем
        // пустым: так бывает после неудачного перевода — раньше туда писался
        // исходный текст, и повторное нажатие отвечало «всё уже заполнено».
        function isEmptyTarget(val) { return !val || val === srcText; }

        var targets = [];
        if (ruEl && srcLang !== 'ru' && isEmptyTarget(ruVal)) targets.push({ el: ruEl, lang: 'ru' });
        if (enEl && srcLang !== 'en' && isEmptyTarget(enVal)) targets.push({ el: enEl, lang: 'en' });
        if (kgEl && srcLang !== 'kg' && isEmptyTarget(kgVal)) targets.push({ el: kgEl, lang: 'kg' });

        if (targets.length === 0) {
            showToast(isEn ? 'All fields are already filled' : 'Все поля уже заполнены', 'info');
            return;
        }

        var origLabel = btn.textContent;
        btn.textContent = L.translating;
        btn.disabled = true;

        try {
            var failed = [];
            for (var i = 0; i < targets.length; i++) {
                var result = await translateText(srcText, srcLang, targets[i].lang);
                // Сервис при отказе возвращает исходную строку. Записать её —
                // значит выдать непереведённое за перевод, поэтому пропускаем.
                if (!result || result === srcText) {
                    failed.push(targets[i].lang.toUpperCase());
                    continue;
                }
                targets[i].el.value = result;
                // Над полем может стоять визуальный редактор — пусть перерисуется
                targets[i].el.dispatchEvent(new Event('change'));
            }
            if (failed.length === targets.length) {
                showToast(isEn ? 'Translation service did not respond. Fields left empty.'
                               : 'Сервис перевода не ответил. Поля оставлены пустыми — переведите вручную.', 'error');
            } else if (failed.length) {
                showToast((isEn ? 'Not translated: ' : 'Не переведено: ') + failed.join(', '), 'warning');
            }
        } catch (e) {
            showToast(L.translateError, 'error');
        }

        btn.textContent = origLabel;
        btn.disabled = false;
    }

    /**
     * Translates Russian text to target language.
     * @param {string} text
     * @param {string} targetLang - 'ru' | 'en' | 'kg'
     * @returns {Promise<string>}
     */
    async function translateFromRu(text, targetLang) {
        return translateText(text, 'ru', targetLang);
    }

    /**
     * Translates text via MyMemory API with chunking for long strings.
     * @param {string} text
     * @param {string} fromLang - Source language code
     * @param {string} toLang - Target language code
     * @returns {Promise<string>}
     */
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


    /**
     * Compresses an image file using canvas.
     * @param {File} file - Original file
     * @param {number} maxWidth - Max width in px
     * @param {number} quality - JPEG quality 0-1
     * @returns {Promise<{blob: Blob, ext: string}>}
     */
    function compressImage(file, maxWidth, quality) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                var w = img.width;
                var h = img.height;
                if (w > maxWidth) {
                    h = Math.round(h * maxWidth / w);
                    w = maxWidth;
                }
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(function(blob) {
                    if (blob) {
                        resolve({ blob: blob, ext: 'jpg' });
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                }, 'image/jpeg', quality);
                URL.revokeObjectURL(img.src);
            };
            img.onerror = function() {
                URL.revokeObjectURL(img.src);
                reject(new Error('Image load failed'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    var MAX_FILE_SIZE = 5 * 1024 * 1024;      // 5 MB hard limit
    var COMPRESS_THRESHOLD = 500 * 1024;        // compress if > 500 KB
    var COMPRESS_MAX_WIDTH = 1200;              // resize to 1200px width
    var COMPRESS_QUALITY = 0.82;                // JPEG quality 82%

    /**
     * Uploads an image to Supabase Storage (news bucket).
     * Auto-compresses large images (>500KB → 1200px, quality 82%).
     * @param {File} file - The file to upload
     * @param {string} prefix - Filename prefix (e.g. 'news-', 'coach-')
     * @returns {Promise<string|null>} Public URL or null on failure
     */
    async function uploadImage(file, prefix) {
        if (!A.client || !file) return null;

        // Validate format
        var allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.indexOf(file.type) === -1) {
            showToast(L.uploadFormatError || 'Формат: JPEG, PNG, WebP, GIF', 'error');
            return null;
        }

        // Hard size limit (before compression)
        if (file.size > MAX_FILE_SIZE) {
            showToast(L.uploadSizeError || 'Макс. размер файла: 5 МБ', 'error');
            return null;
        }

        var uploadBlob = file;
        var ext = file.name.split('.').pop().toLowerCase();

        // Auto-compress if > 500 KB
        if (file.size > COMPRESS_THRESHOLD && file.type !== 'image/gif') {
            try {
                var compressed = await compressImage(file, COMPRESS_MAX_WIDTH, COMPRESS_QUALITY);
                uploadBlob = compressed.blob;
                ext = compressed.ext;
                var saved = Math.round((1 - uploadBlob.size / file.size) * 100);
                if (saved > 5) {
                    showToast((L.imageCompressed || 'Сжато') + ': ' + formatBytes(file.size) + ' → ' + formatBytes(uploadBlob.size) + ' (-' + saved + '%)');
                }
            } catch (e) {
                // Compression failed — upload original
            }
        }

        var filename = (prefix || '') + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;
        try {
            var result = await A.client.storage.from('news').upload(filename, uploadBlob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'image/' + (ext === 'jpg' ? 'jpeg' : ext)
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

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Exports data as a CSV file download (UTF-8 BOM for Excel).
     * @param {string} filename
     * @param {string[]} headers
     * @param {Array<Array<*>>} rows
     */
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

    /**
     * Escapes and quotes a CSV cell value.
     * @param {*} val
     * @returns {string}
     */
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
    A.showConfirmAsync = showConfirmAsync;

    /**
     * Приводит текст новости к нашей разметке.
     *
     * Менеджер пишет в обычное поле: может набрать простой текст, а может
     * вставить из Word или Телеграма — тогда прилетают инлайновые цвета, белый
     * фон и всё подряд в <strong>. На тёмной теме это выглядит как белые плашки
     * поверх страницы. Здесь остаются только абзацы, переносы, ссылки и списки,
     * а простой текст сам раскладывается по абзацам.
     *
     * @param {string} html
     * @returns {string}
     */
    function cleanNewsHtml(html) {
        if (!html) return '';
        var h = String(html).trim();

        // Текст без единого тега — раскладываем по пустым строкам
        if (!/<[a-z][\s\S]*>/i.test(h)) {
            return h.split(/\n\s*\n/)
                .map(function(block) { return block.trim(); })
                .filter(Boolean)
                .map(function(block) { return '<p>' + block.replace(/\n/g, '<br>') + '</p>'; })
                .join('');
        }

        h = h.replace(/\s*style="[^"]*"/gi, '');
        h = h.replace(/\s*class="[^"]*"/gi, '');
        h = h.replace(/<\/?span[^>]*>/gi, '');
        h = h.replace(/<\/?(?:strong|b)[^>]*>/gi, '');
        h = h.replace(/<\/?font[^>]*>/gi, '');
        h = h.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
        h = h.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>');
        h = h.replace(/&nbsp;/g, ' ');
        h = h.replace(/<p>\s+/gi, '<p>').replace(/\s+<\/p>/gi, '</p>');
        return h.trim();
    }


    /**
     * Чистка при сохранении — мягкая.
     *
     * Жирный, курсив и пустые строки между абзацами ставит сам менеджер в
     * редакторе, и сохранение не вправе их выбрасывать: текст после кнопки
     * «Сохранить» должен выглядеть так же, как до неё. Вычищаем только то,
     * что приносит вставка из Word: инлайновые цвета, фоны, шрифты и обёртки.
     *
     * @param {string} html
     * @returns {string}
     */
    function cleanNewsHtmlOnSave(html) {
        if (!html) return '';
        var h = String(html).trim();

        // Простой текст без единого тега — раскладываем по абзацам
        if (!/<[a-z][\s\S]*>/i.test(h)) return cleanNewsHtml(h);

        h = h.replace(/\s*style="[^"]*"/gi, '');
        h = h.replace(/\s*class="[^"]*"/gi, '');
        h = h.replace(/<\/?span[^>]*>/gi, '');
        h = h.replace(/<\/?font[^>]*>/gi, '');
        h = h.replace(/<div>/gi, '<p>').replace(/<\/div>/gi, '</p>');
        h = h.replace(/&nbsp;/g, ' ');
        return h.trim();
    }

    A.esc = esc;
    A.cleanNewsHtmlOnSave = cleanNewsHtmlOnSave;
    A.cleanNewsHtml = cleanNewsHtml;
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

    // NTRP select options helper (1.0 - 7.0, step 0.25)
    A.ntrpOptions = function(selectedVal, opts) {
        opts = opts || {};
        var min = opts.min || 1.0;
        var max = opts.max || 7.0;
        var step = opts.step || 0.25;
        var emptyLabel = opts.emptyLabel || '—';
        // Round selected value to nearest step
        var selNum = selectedVal ? Math.round(parseFloat(selectedVal) / step) * step : null;
        var html = '<option value="">' + emptyLabel + '</option>';
        for (var v = min; v <= max + 0.01; v += step) {
            var val = v.toFixed(2).replace(/0$/, '');
            var sel = (selNum !== null && Math.abs(v - selNum) < 0.001) ? ' selected' : '';
            html += '<option value="' + val + '"' + sel + '>' + val + '</option>';
        }
        return html;
    };

})();
