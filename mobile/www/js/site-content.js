/**
 * Тексты и картинки, которые можно менять без выкладки.
 *
 * Заглавный экран жил в коде: в index.html на трёх языках и отдельной
 * копией в приложении. Поменять лозунг значило выложить сайт и собрать
 * новое приложение — то есть ждать проверки в магазине.
 *
 * Теперь они лежат в таблице site_content, а этот файл их достаёт. Один
 * файл на сайт и на приложение, как и свод правил.
 *
 * Читает бережно: сначала отдаёт то, что запомнил в прошлый раз, и
 * страница рисуется сразу, даже без сети. Свежее подтягивает следом и
 * сообщает, только если оно и правда изменилось, — лишняя перерисовка
 * мигает на глазах.
 */
(function () {
    'use strict';

    var C = {};
    var STORE = 'kslt_site_content';
    var cache = null;

    function lang() {
        if (window.KSLT_I18N && window.KSLT_I18N.currentLang) return window.KSLT_I18N.currentLang;
        var p = window.location.pathname;
        if (p.indexOf('-en') !== -1) return 'en';
        if (p.indexOf('-kg') !== -1) return 'kg';
        return 'ru';
    }

    function read() {
        if (cache) return cache;
        try {
            cache = JSON.parse(localStorage.getItem(STORE) || 'null');
        } catch (e) {
            cache = null;
        }
        return cache;
    }

    function save(rows) {
        cache = rows;
        try {
            localStorage.setItem(STORE, JSON.stringify(rows));
        } catch (e) {
            // Память телефона переполнена — не беда, просто спросим базу снова
        }
    }

    /**
     * Значение по ключу на нужном языке.
     *
     * fallback — то, что вшито в разметку. Пока база не ответила или если
     * строку ещё не завели, показываем его: пустой экран хуже старого
     * текста.
     */
    C.get = function (key, fallback) {
        var rows = read();
        if (!rows) return fallback || '';

        var row = null;
        rows.forEach(function (r) { if (r.key === key) row = r; });
        if (!row) return fallback || '';

        var l = lang();
        var v = (l === 'en' && row.value_en) || (l === 'kg' && row.value_kg) || row.value;
        return v || fallback || '';
    };

    /**
     * Забрать свежее из базы.
     *
     * onChange вызовется, только если содержимое отличается от
     * запомненного. При первом запуске — вызовется всегда: показывать
     * было нечего.
     */
    C.refresh = function (client, onChange) {
        if (!client) return Promise.resolve(false);

        var before = JSON.stringify(read());

        return client.from('site_content')
            .select('key, value, value_en, value_kg')
            .then(function (r) {
                if (r.error || !r.data) return false;
                var after = JSON.stringify(r.data);
                save(r.data);
                if (after !== before) {
                    if (onChange) onChange();
                    return true;
                }
                return false;
            })
            .catch(function () { return false; });
    };

    C.ready = function () { return !!read(); };

    /**
     * Расставить содержимое по разметке.
     *
     * В коде остаются те же тексты, что и были: они видны, пока база не
     * ответила, и остаются, если строку ещё не завели. Из базы приходит
     * замена — по метке data-content.
     *
     * Картинке подменяем адрес, остальному — текст.
     */
    C.apply = function (root) {
        var scope = root || document;
        scope.querySelectorAll('[data-content]').forEach(function (el) {
            var key = el.getAttribute('data-content');
            var was = el.tagName === 'IMG' ? el.getAttribute('src') : el.textContent.trim();
            var now = C.get(key, was);
            if (!now || now === was) return;

            if (el.tagName === 'IMG') el.setAttribute('src', now);
            else el.textContent = now;
        });
    };

    /**
     * Всё вместе: показать запомненное, затем спросить свежее и, если
     * поменялось, расставить заново.
     */
    C.mount = function (client, root) {
        C.apply(root);
        return C.refresh(client, function () { C.apply(root); });
    };

    // ---- Правовые документы -----------------------------------------

    /**
     * Условия, политика, оферта.
     *
     * Лежат отдельно от коротких надписей: вместе они весят под сорок
     * тысяч знаков, и тянуть их ради подписи на кнопке было бы глупо.
     * Запрашиваются, только когда человек открыл документ, и потом
     * помнятся — второй раз откроется мгновенно и без сети.
     */
    var DOC_STORE = 'kslt_site_doc_';

    function docCached(slug) {
        try {
            return JSON.parse(localStorage.getItem(DOC_STORE + slug) || 'null');
        } catch (e) {
            return null;
        }
    }

    /**
     * Отдаёт { title, body } на языке страницы.
     *
     * onReady зовётся дважды, если есть что показать сразу: первый раз с
     * запомненным, второй — со свежим. Так документ открывается мгновенно
     * и всё равно остаётся актуальным.
     */
    C.document = function (client, slug, onReady) {
        var l = lang();

        function shape(row) {
            if (!row) return null;
            return {
                title: (l === 'en' && row.title_en) || (l === 'kg' && row.title_kg) || row.title || '',
                body: (l === 'en' && row.body_en) || (l === 'kg' && row.body_kg) || row.body || ''
            };
        }

        var was = docCached(slug);
        if (was) onReady(shape(was));

        if (!client) return Promise.resolve(shape(was));

        return client.from('site_documents')
            .select('slug, title, title_en, title_kg, body, body_en, body_kg')
            .eq('slug', slug)
            .maybeSingle()
            .then(function (r) {
                if (r.error || !r.data) return shape(was);
                var fresh = JSON.stringify(r.data);
                if (fresh !== JSON.stringify(was)) {
                    try { localStorage.setItem(DOC_STORE + slug, fresh); } catch (e) {}
                    onReady(shape(r.data));
                }
                return shape(r.data);
            })
            .catch(function () { return shape(was); });
    };

    window.KSLT_CONTENT = C;
})();
