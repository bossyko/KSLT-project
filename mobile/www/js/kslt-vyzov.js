/**
 * ВЫЗОВ НА БАТТЛ — ОДИН ДОМ (29.10, по слову Кости).
 *
 * ЧТО БЫЛО, И ЭТО НЕ «НЕ ХВАТАЕТ БЛОКА», А ПОЛОМКА.
 *
 * САЙТ вызов в таблицу НЕ ПИШЕТ: он зовёт серверную функцию
 * `create-challenge` (`js/player.js:2347`), а та через `create_challenge`
 * проверяет восемь условий — вошёл ли, есть ли карточка игрока, не себя
 * ли вызывает, член ли клуба, нашёлся ли соперник, не слишком ли много
 * висящих вызовов, нет ли уже такого вызова, нет ли назначенного матча —
 * и только потом пишет, а заодно отправляет уведомления.
 *
 * ПРИЛОЖЕНИЕ писало В ТАБЛИЦУ НАПРЯМУЮ
 * (`mobile/www/js/screens/player-detail.js`), минуя все восемь проверок,
 * **со статусом `pending`**. А в ограничении самой базы
 * (`challenges_status_check`) допустимы только `active`, `negotiating`,
 * `countered`, `accepted`, `declined`, `expired`, `completed`,
 * `cancelled` — **`pending` ТАМ НЕТ**. То есть вставка отклонялась
 * базой, и человек в приложении получал ошибку при каждом нажатии
 * «Вызвать».
 *
 * И ПРОВЕРКА «ВЫЗОВ УЖЕ ЕСТЬ» РАСХОДИЛАСЬ ТОЖЕ: сайт смотрит В ОБЕ
 * СТОРОНЫ (я его или он меня) по статусам `active` и `accepted`,
 * приложение — в одну сторону и по статусу `pending`, которого не
 * бывает. То есть в приложении она не находила ничего НИКОГДА.
 *
 * ЧЕГО В ДОМЕ НЕТ: ни одного слова и ни одной кнопки. Дом отдаёт КЛЮЧ
 * отказа, слово по ключу находит продукт.
 *
 * Правка правится В ДВУХ МЕСТАХ: побайтовая копия в `mobile/www/js/`.
 */
(function (global) {
    'use strict';

    var API = global.KSLT_VYZOV = {};

    /** Серверная функция, которая решает, можно ли вызвать. */
    API.ФУНКЦИЯ = 'create-challenge';

    /**
     * СТАТУСЫ, ПРИ КОТОРЫХ ВЫЗОВ СЧИТАЕТСЯ ЖИВЫМ.
     *
     * Взяты у сайта и сверены с ограничением базы
     * `challenges_status_check`. Статуса `pending` в базе НЕ
     * СУЩЕСТВУЕТ — приложение искало именно его.
     */
    API.ЖИВЫЕ = ['active', 'accepted'];

    /** Все коды отказа, которые отдаёт `create_challenge`. */
    var ОТКАЗЫ = {
        not_logged_in:      'chalLogin',
        no_player:          'chalNoPlayer',
        opponent_not_found: 'chalNoPlayer',
        self_challenge:     'chalSelf',
        not_member:         'chalNotMember',
        too_many_pending:   'chalLimit',
        already_pending:    'chalExists',
        match_pending:      'chalMatchSet'
    };

    /**
     * КЛЮЧ СЛОВА ПО КОДУ ОТКАЗА.
     *
     * Отдаёт КЛЮЧ, а не текст: у сайта свой словарь на три языка, у
     * приложения свой.
     */
    API.ключОтказа = function (код) {
        return ОТКАЗЫ[код] || 'chalError';
    };

    /** Все ключи, которые дом умеет отдать, — для проверки словарей. */
    API.КЛЮЧИ = (function () {
        var с = ['chalError'];
        for (var к in ОТКАЗЫ) {
            if (с.indexOf(ОТКАЗЫ[к]) === -1) с.push(ОТКАЗЫ[к]);
        }
        return с;
    })();

    /**
     * СОЗДАТЬ ВЫЗОВ.
     *
     * Только через серверную функцию: она одна знает восемь условий, и
     * писать в таблицу мимо неё — значит обойти их все.
     *
     * @returns {Promise<{ок: boolean, ключ?: string, вызов?: string}>}
     */
    API.создать = function (client, соперникId, сообщение) {
        var V = global.KSLT_VHOD;
        if (!V || !V.зовОтИмени) {
            if (global.console && console.error) {
                console.error('KSLT_VYZOV: нет KSLT_VHOD.зовОтИмени — ' +
                    'вызов НЕ ОТПРАВЛЕН; проверьте порядок подключения kslt-vhod.js');
            }
            return Promise.resolve({ ок: false, ключ: 'chalError' });
        }
        var тело = { opponent_player_id: соперникId };
        var м = String(сообщение == null ? '' : сообщение).trim();
        if (м) тело.message = м;

        return V.зовОтИмени(client, API.ФУНКЦИЯ, тело).then(function (д) {
            if (д && д.success) return { ок: true, вызов: д.challenge_id };
            return { ок: false, ключ: API.ключОтказа(д && д.error) };
        }).catch(function () {
            return { ок: false, ключ: 'chalError' };
        });
    };

    /**
     * ЕСТЬ ЛИ УЖЕ ЖИВОЙ ВЫЗОВ МЕЖДУ ДВУМЯ ИГРОКАМИ.
     *
     * СМОТРИМ В ОБЕ СТОРОНЫ. Приложение смотрело только «я его» — и
     * человек, которого уже вызвали, мог вызвать встречно, заведя второй
     * вызов на ту же пару.
     *
     * Отдаёт `{ есть, вид }`, где вид — `'матч'` (вызов принят, игра
     * назначена) или `'ждёт'` (ответа ещё нет). Что показать на кнопке,
     * решает продукт.
     */
    API.занят = function (client, мойId, егоId) {
        if (!client || !мойId || !егоId || мойId === егоId) {
            return Promise.resolve({ есть: false, вид: '' });
        }
        var пара = 'and(challenger_player_id.eq.' + мойId +
                   ',opponent_player_id.eq.' + егоId + ')';
        var обратно = 'and(challenger_player_id.eq.' + егоId +
                      ',opponent_player_id.eq.' + мойId + ')';
        return client.from('challenges')
            .select('status')
            .or(пара + ',' + обратно)
            .in('status', API.ЖИВЫЕ)
            .limit(1)
            .then(function (r) {
                var строка = r.data && r.data[0];
                if (!строка) return { есть: false, вид: '' };
                return { есть: true, вид: строка.status === 'accepted' ? 'матч' : 'ждёт' };
            })
            .catch(function () {
                /* Не смогли спросить — кнопка остаётся живой, откажет
                   серверная функция. Молча глушить кнопку хуже. */
                return { есть: false, вид: '' };
            });
    };

})(typeof window !== 'undefined' ? window : this);
