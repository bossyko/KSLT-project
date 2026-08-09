/**
 * KSLT admin — визуальный редактор текста новости.
 *
 * Менеджер пишет как в обычном редакторе: жирный, списки, ссылки — кнопками.
 * Тегов он не видит вовсе. HTML остаётся в исходном поле, скрытом от глаз:
 * его читает сохранение, туда же пишет кнопка перевода.
 *
 * Своя реализация, без сторонних библиотек: нужен десяток команд, а готовый
 * редактор потянул бы сотни килобайт и свою вёрстку поверх нашей тёмной темы.
 */
(function() {
    'use strict';

    var A = window.KSLT_ADMIN = window.KSLT_ADMIN || {};

    var BUTTONS = [
        { cmd: 'bold', label: 'Ж', title: 'Жирный', style: 'font-weight:700' },
        { cmd: 'italic', label: 'К', title: 'Курсив', style: 'font-style:italic' },
        { cmd: 'formatBlock', value: 'h3', label: 'Заголовок', title: 'Подзаголовок внутри новости' },
        { cmd: 'insertUnorderedList', label: '• Список', title: 'Маркированный список' },
        { cmd: 'insertOrderedList', label: '1. Список', title: 'Нумерованный список' },
        { cmd: 'createLink', label: 'Ссылка', title: 'Вставить ссылку' },
        { cmd: 'unlink', label: 'Убрать ссылку', title: 'Убрать ссылку' },
        { cmd: 'removeFormat', label: 'Очистить', title: 'Убрать оформление' }
    ];

    /**
     * Превращает textarea в визуальный редактор.
     * @param {string} textareaId
     */
    function attachEditor(textareaId) {
        var textarea = document.getElementById(textareaId);
        if (!textarea || textarea.dataset.editorAttached) return;
        textarea.dataset.editorAttached = '1';

        var wrap = document.createElement('div');
        wrap.className = 'ad-editor';

        var toolbar = document.createElement('div');
        toolbar.className = 'ad-editor-toolbar';
        BUTTONS.forEach(function(b) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ad-editor-btn';
            btn.title = b.title;
            btn.textContent = b.label;
            if (b.style) btn.setAttribute('style', b.style);
            btn.addEventListener('mousedown', function(e) { e.preventDefault(); });  // не терять выделение
            btn.addEventListener('click', function() { run(b, area); });
            toolbar.appendChild(btn);
        });

        var area = document.createElement('div');
        area.className = 'ad-editor-area';
        area.contentEditable = 'true';
        area.innerHTML = textarea.value || '';
        area.setAttribute('data-placeholder', textarea.getAttribute('placeholder') || '');

        wrap.appendChild(toolbar);
        wrap.appendChild(area);
        textarea.parentNode.insertBefore(wrap, textarea);
        textarea.style.display = 'none';

        // Правки уезжают в скрытое поле — его читает сохранение
        area.addEventListener('input', function() {
            textarea.value = A.cleanNewsHtml ? A.cleanNewsHtmlKeepFormatting(area.innerHTML) : area.innerHTML;
        });

        // Вставка из Word и Телеграма приходит со своими цветами и фонами
        area.addEventListener('paste', function(e) {
            e.preventDefault();
            var data = e.clipboardData || window.clipboardData;
            var html = data.getData('text/html');
            var text = data.getData('text/plain');
            var clean = html
                ? (A.cleanNewsHtml ? A.cleanNewsHtml(html) : html)
                : (text || '').split(/\n\s*\n/).map(function(p) {
                      return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
                  }).join('');
            document.execCommand('insertHTML', false, clean);
        });

        // Кнопка перевода пишет прямо в поле — подхватываем и показываем
        textarea.addEventListener('change', function() {
            if (textarea.value !== area.innerHTML) area.innerHTML = textarea.value || '';
        });
    }

    function run(b, area) {
        area.focus();
        if (b.cmd === 'createLink') {
            var url = prompt('Адрес ссылки:', 'https://');
            if (!url) return;
            document.execCommand('createLink', false, url);
            return;
        }
        if (b.cmd === 'formatBlock') {
            document.execCommand('formatBlock', false, b.value);
            return;
        }
        document.execCommand(b.cmd, false, null);
        area.dispatchEvent(new Event('input'));
    }

    /**
     * Та же чистка, что при сохранении, но жирный и курсив остаются:
     * в редакторе ими пользуются осознанно, а не приносят из Word.
     */
    function cleanKeepFormatting(html) {
        if (!html) return '';
        var h = String(html);
        h = h.replace(/\s*style="[^"]*"/gi, '');
        h = h.replace(/\s*class="[^"]*"/gi, '');
        h = h.replace(/<\/?span[^>]*>/gi, '');
        h = h.replace(/<\/?font[^>]*>/gi, '');
        h = h.replace(/&nbsp;/g, ' ');
        h = h.replace(/<div>/gi, '<p>').replace(/<\/div>/gi, '</p>');
        h = h.replace(/<p>(?:\s|<br\s*\/?>)*<\/p>/gi, '');
        return h.trim();
    }

    A.attachEditor = attachEditor;
    A.cleanNewsHtmlKeepFormatting = cleanKeepFormatting;
})();
