// ============================================
// KSLT Mobile — Подача заявки на турнир
// ============================================
//
// Те же правила допуска, что на сайте: решение принимает серверная
// функция `tournament-register`. Приложение не выбирает статус само и не
// может подвинуть чужую заявку.
//
// ЗОВ ФУНКЦИИ, ДЕРЕВО РЕШЕНИЙ ПО ОТВЕТУ И ПРИЗНАК «ЗАЯВКА СОЗДАНА» —
// ДОМ (кусок A3.7д): `js/kslt-zayavka.js`. Слова — общий файл
// `js/zayavka-texts.js`. Здесь остался только вид: своя накладка, свои
// кнопки, своё закрытие.
//
// ЧТО ЭТИМ ЗАКРЫТО, ПОМИМО ДВОЙНОЙ ЗАПИСИ:
//
//   1. ВЕТКИ СМЕНЫ НАПАРНИКА ЗДЕСЬ НЕ БЫЛО ВОВСЕ. Ответ
//      `partner_changed` не несёт ни `error`, ни `status`, поэтому он
//      доезжал до последней ветки — и человек после УСПЕШНОЙ замены
//      напарника видел «⛔ Заявка не принята».
//   2. СЛОВ НА КОДЫ ОТКАЗА БЫЛО ДЕВЯТЬ ПРОТИВ ДЕВЯТНАДЦАТИ У САЙТА.
//      Остальные десять показывались человеку СЫРЫМ КОДОМ базы:
//      `category_closed`, `entry_in_draw`, `partner_taken` и так далее.
//   3. ТЕКСТ ВСТАВЛЯЛСЯ В РАЗМЕТКУ КАК ЕСТЬ. Для наших слов это
//      безопасно, но в двух ветках текст приходит ОТ СЕРВЕРА:
//      незнакомый код отказа и `block_reason`, который пишет человек в
//      админке. Экранируем — как это делает сайт с куска 157.
//   4. ВИД ОКНА УЕХАЛ В CSS. Десять правил строкой в <head> сняты,
//      живут в `css/app.css`.

(function () {
    'use strict';

    /** Язык приложения. Сейчас он один (`I18N.ОДИН_ЯЗЫК`), но слова лежат
        на трёх, и выбор делается здесь, а не в доме. */
    function надписи() {
        var T = window.KSLT_ZAYAVKA_TEXTS;
        var I = window.KSLT_I18N;
        return T ? T.of((I && I.lang) || 'ru') : {};
    }

    /**
     * Отправляет заявку на турнир.
     * @param {string} tournamentId
     * @param {Object} [extra] partner_id или partner_external_* для парных
     * @returns {Promise<{ok:boolean, data:Object}>}
     */
    function call(tournamentId, extra) {
        return window.KSLT_ZAYAVKA.зов(window.supabaseClient, tournamentId, extra);
    }

    /**
     * Человеческий текст по ответу функции.
     * @returns {{title:string, text:string, note:string, tone:string, short:string, icon:string}}
     */
    function resultText(data) {
        var Z = window.KSLT_ZAYAVKA;
        var слова = Z.словами(Z.разобрать(data), надписи(), data);
        return {
            tone: слова.тон,
            icon: слова.значок,
            title: слова.титул,
            text: слова.текст,
            note: слова.заметка,
            short: слова.коротко
        };
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /** Показывает окно с результатом подачи. */
    function showModal(info) {
        var старое = document.querySelector('.mob-reg-overlay');
        if (старое) старое.remove();

        var overlay = document.createElement('div');
        overlay.className = 'mob-reg-overlay';
        /* ЗНАЧОК НЕ ЭКРАНИРУЕТСЯ НАМЕРЕННО: его задаёт ДОМ (эмодзи), а не
           человек и не сервер. Остальное — экранируется. */
        overlay.innerHTML =
            '<div class="mob-reg-modal">' +
                '<div class="mob-reg-icon">' + info.icon + '</div>' +
                '<h3 class="mob-reg-title">' + esc(info.title) + '</h3>' +
                '<p class="mob-reg-text">' + esc(info.text) + '</p>' +
                (info.note ? '<div class="mob-reg-note">' + esc(info.note) + '</div>' : '') +
                '<button class="mob-reg-btn' + (info.tone === 'error' ? ' is-error' : '') + '">' +
                    esc(надписи().ok) +
                '</button>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function () { overlay.classList.add('active'); });

        function close() {
            overlay.classList.remove('active');
            setTimeout(function () { overlay.remove(); }, 200);
        }
        overlay.querySelector('.mob-reg-btn').addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    }

    /**
     * Подаёт заявку и показывает результат.
     * @returns {Promise<Object>} info; info.created = false, если заявка не создана
     */
    function submit(tournamentId, extra) {
        return call(tournamentId, extra).then(function (reg) {
            var info = resultText(reg.data);
            showModal(info);
            info.created = window.KSLT_ZAYAVKA.создана(reg.data);
            return info;
        });
    }

    window.KSLT_REG = {
        call: call,
        resultText: resultText,
        showModal: showModal,
        submit: submit
    };
})();
