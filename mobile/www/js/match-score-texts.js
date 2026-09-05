// ============================================
// Надписи окна счёта — общие для сайта и приложения
// ============================================
//
// Вид у сайта и приложения свой и должен таким остаться: на телефоне окно
// выезжает снизу, на сайте открывается посередине. А вот слова одни и те же,
// и держать их в двух файлах — значит однажды поменять в одном.
//
// Файл общий: сверяется проверкой tools/check-rules.js.

(function () {
    'use strict';

    var T = {};
    window.KSLT_SCORE_TEXTS = T;

    T.ru = {
        titleEnter: 'Счёт матча',
        titleConfirm: 'Подтвердите счёт',
        date: 'Дата матча',
        player: 'Игрок',
        set: 'Сет',
        hint: 'Впишите геймы в каждом сете. Победителя считаем из счёта.',
        send: 'Отправить счёт',
        confirm: 'Подтвердить',
        dispute: 'Не согласен',
        confirmText: 'вписал счёт. Всё верно?',
        autoNote: 'Не ответите в течение суток — счёт примется как есть.',
        youWon: 'Вы выиграли',
        youLost: 'Вы проиграли',
        sent: 'Счёт отправлен — ждём соперника',
        confirmed: 'Счёт подтверждён',
        disputed: 'Матч ушёл организатору',
        errBad: 'Проверьте счёт: геймы в сете не могут быть равны',
        errNoWinner: 'По сетам никто не выиграл — проверьте счёт',
        errOwn: 'Свой счёт подтверждает соперник',
        errFinal: 'Счёт уже окончательный — обратитесь к организатору',
        errNotPlayer: 'Вы не играете в этом матче',
        alreadyDone: 'Счёт уже подтверждён',
        alreadySent: 'Счёт уже вписан — ждём соперника',
        err: 'Не удалось сохранить счёт',
        loading: 'Загрузка...',
        todo: 'Ждёт вашего ответа',
        enterShort: 'счёт',
        confirmShort: 'подтвердить',
        waiting: 'ждём соперника',
        sentShort: 'ждём подтверждения',
        entered: 'вписал счёт',
        battle: 'Баттл'
    };

    T.en = {
        titleEnter: 'Match score',
        titleConfirm: 'Confirm the score',
        date: 'Match date',
        player: 'Player',
        set: 'Set',
        hint: 'Enter games won in each set. The winner is worked out from the score.',
        send: 'Submit score',
        confirm: 'Confirm',
        dispute: 'Not correct',
        confirmText: 'entered the score. Is it right?',
        autoNote: 'If you do not answer within a day, the score is accepted as is.',
        youWon: 'You won',
        youLost: 'You lost',
        sent: 'Score sent — waiting for your opponent',
        confirmed: 'Score confirmed',
        disputed: 'Sent to the organiser',
        errBad: 'Check the score: games in a set cannot be equal',
        errNoWinner: 'Nobody won by sets — check the score',
        errOwn: 'Your own score is confirmed by the opponent',
        errFinal: 'The score is already final — ask the organiser',
        errNotPlayer: 'You are not playing in this match',
        alreadyDone: 'The score is already confirmed',
        alreadySent: 'The score is already entered — waiting for the opponent',
        err: 'Could not save the score',
        loading: 'Loading...',
        todo: 'Needs your answer',
        enterShort: 'score',
        confirmShort: 'confirm',
        waiting: 'waiting for opponent',
        sentShort: 'waiting for confirmation',
        entered: 'entered the score',
        battle: 'Battle'
    };

    T.kg = {
        titleEnter: 'Оюндун эсеби',
        titleConfirm: 'Эсепти ырастаңыз',
        date: 'Оюндун күнү',
        player: 'Оюнчу',
        set: 'Сет',
        hint: 'Ар бир сетте алынган геймдерди жазыңыз. Жеңүүчү эсептен чыгарылат.',
        send: 'Эсепти жөнөтүү',
        confirm: 'Ырастоо',
        dispute: 'Туура эмес',
        confirmText: 'эсепти жазды. Туурабы?',
        autoNote: 'Бир күндүн ичинде жооп болбосо, эсеп ушул бойдон кабыл алынат.',
        youWon: 'Сиз жеңдиңиз',
        youLost: 'Сиз жеңилдиңиз',
        sent: 'Эсеп жөнөтүлдү — каршылашты күтөбүз',
        confirmed: 'Эсеп ырасталды',
        disputed: 'Уюштуруучуга жөнөтүлдү',
        errBad: 'Эсепти текшериңиз: сеттеги геймдер бирдей болбойт',
        errNoWinner: 'Сеттер боюнча жеңүүчү жок — эсепти текшериңиз',
        errOwn: 'Өз эсебиңизди каршылаш ырастайт',
        errFinal: 'Эсеп мурун бекитилген — уюштуруучуга кайрылыңыз',
        errNotPlayer: 'Сиз бул оюнда ойнобойсуз',
        alreadyDone: 'Эсеп мурун ырасталган',
        alreadySent: 'Эсеп жазылган — каршылашты күтөбүз',
        err: 'Эсеп сакталган жок',
        loading: 'Жүктөлүүдө...',
        todo: 'Жооп күтөт',
        enterShort: 'эсеп',
        confirmShort: 'ырастоо',
        waiting: 'каршылашты күтөбүз',
        sentShort: 'ырастоону күтөбүз',
        entered: 'эсепти жазды',
        battle: 'Баттл'
    };

    /** Надписи на нужном языке. Неизвестный язык — русский. */
    T.of = function (lang) {
        return T[lang] || T.ru;
    };
})();
