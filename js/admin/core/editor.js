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
        { cmd: 'removeFormat', label: 'Очистить', title: 'Убрать оформление' },
        { cmd: 'insertPhoto', label: '🖼 Фото', title: 'Вставить фото в это место текста' },
        { cmd: 'insertVideo', label: '▶ Видео', title: 'Вставить видео по ссылке — YouTube, Vimeo, Instagram' }
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
        area.addEventListener('keyup', remember);
        area.addEventListener('mouseup', remember);
        area.addEventListener('blur', remember);

        area.addEventListener('input', function() {
            textarea.value = A.cleanNewsHtml ? A.cleanNewsHtmlKeepFormatting(area.innerHTML) : area.innerHTML;
            // Предпросмотр слушает событие поля, а печатают теперь в редакторе
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
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

    var savedRange = null;

    function remember() {
        var sel = window.getSelection();
        if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();
    }

    function restore(area, range) {
        area.focus();
        if (!range) return;
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function run(b, area) {
        area.focus();
        if (b.cmd === 'insertPhoto') { insertPhoto(area); return; }
        if (b.cmd === 'insertVideo') { insertVideo(area); return; }
        if (b.cmd === 'createLink') {
            /* СВОЯ ОБОЛОЧКА, А НЕ `prompt()`. Системное окно браузера — чужое
               по виду, не нашей тёмной темы, не переводится и не знает нашей
               ловушки Tab. В админке оболочка окна одна на всех с 04.10
               («ОКНО СТРОИТ ОДНА ОБОЛОЧКА», 21 правило), и у неё уже есть
               спрос с полем — A.showPromptAsync. Поле ОДНО, значит по
               описанию Modal 26:143 это ширина sm 400. */
            var где = savedRange;
            A.showPromptAsync({
                title: 'Ссылка',
                text: 'Куда ведёт выделенный текст',
                placeholder: 'https://',
                value: 'https://',
                okLabel: 'Вставить'
            }).then(function(url) {
                if (!url || url === 'https://') return;
                restore(area, где);
                document.execCommand('createLink', false, url);
                area.dispatchEvent(new Event('input'));
            });
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
     * Фото грузятся в тот же бакет, что и обложка новости.
     * Выбирать можно сразу несколько: после турнира их всегда пачка,
     * и загружать по одной — мучение.
     */
    function insertPhoto(area) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.addEventListener('change', async function() {
            var files = Array.prototype.slice.call(input.files || []);
            if (!files.length || !A.uploadImage) return;

            var saved = savedRange;
            var urls = [];
            for (var i = 0; i < files.length; i++) {
                var url = await A.uploadImage(files[i], 'news-');
                if (url) urls.push(url);
            }
            if (!urls.length) return;

            restore(area, saved);
            var html = urls.map(function(u) {
                return '<figure><img src="' + u + '" alt=""></figure>';
            }).join('') + '<p><br></p>';
            document.execCommand('insertHTML', false, html);
            area.dispatchEvent(new Event('input'));
        });
        input.click();
    }

    /**
     * Видео берём ссылкой, а не файлом: ролик с турнира весит сотни мегабайт,
     * хранилище проекта на это не рассчитано, да и грузиться у зрителя будет
     * дольше самой новости. YouTube и Vimeo отдают его сами.
     */
    function insertVideo(area) {
        var где = savedRange;
        A.showPromptAsync({
            title: 'Видео',
            text: 'YouTube, Vimeo или Instagram — ссылка на одну публикацию',
            placeholder: 'https://',
            value: 'https://',
            okLabel: 'Вставить'
        }).then(function(url) {
            if (!url || url === 'https://') return;
            var embed = toEmbed(url.trim());
            if (!embed) {
                /* Ошибку показываем тостом админки, а не `alert`-ом: тост
                   не перехватывает управление и не ломает ввод. */
                A.showToast('Не разобрал ссылку. Нужна ссылка на ОДНУ публикацию: ' +
                            'youtube.com/watch, youtu.be, vimeo.com или instagram.com/reel', 'error');
                return;
            }
            restore(area, где);
            document.execCommand('insertHTML', false,
                '<figure class="news-video-figure">' + embed + '</figure><p><br></p>');
            area.dispatchEvent(new Event('input'));
        });
    }

    /**
     * РАЗБОР ССЫЛКИ ЖИВЁТ В `js/kslt-video.js` — одно определение на одно
     * понятие: тем же разбором страница новости чинит кадры, сохранённые
     * раньше. Здесь осталась только обёртка на случай, если общий файл не
     * подключился: тогда редактор честно скажет «не разобрал ссылку».
     */
    function toEmbed(url) {
        return window.KSLT_VIDEO ? window.KSLT_VIDEO.кадр(url) : '';
    }

    /**
     * Та же чистка, что при сохранении, но жирный и курсив остаются:
     * в редакторе ими пользуются осознанно, а не приносят из Word.
     */
    function cleanKeepFormatting(html) {
        if (!html) return '';
        var h = String(html);
        h = h.replace(/\s*style="[^"]*"/gi, '');
        /* Свои классы остаются: `news-video-ig` ставит сам редактор, и
           срезать его значило бы сломать вертикальный кадр (см. utils.js) */
        h = A.оставитьСвоиКлассы ? A.оставитьСвоиКлассы(h) : h;
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
