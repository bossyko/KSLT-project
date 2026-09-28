/**
 * КСЛТ — статус турнира: одно определение на одно понятие.
 *
 * До этого файла статус жил в коде россыпью: вычисление — четырьмя
 * одинаковыми копиями (админка и три файла сайта), подписи — четырьмя
 * наборами на трёх языках. Русские слова разошлись: одно и то же
 * состояние называлось «Скоро», «Скоро открытие», «Предстоящий», а
 * «Регистрация закрыта» в одном месте была сокращена, в трёх — нет.
 * Беда рождается ровно на таком шве, поэтому здесь один источник.
 *
 * Лестница состояний — по словам Кости (28.09):
 *   Скоро        — регистрация ещё не открылась
 *   Рег. открыта — от начала до конца регистрации
 *   Рег. закрыта — регистрация кончилась, турнир ещё не начался
 *   Идёт         — турнир начался
 *   Завершён     — турнир закончился
 *   Отменён      — отдельное состояние, его ставят руками
 */
(function() {
    'use strict';

    var ПОРЯДОК = ['upcoming', 'registration_open', 'registration_closed',
                   'ongoing', 'completed', 'cancelled'];

    var ПОДПИСИ = {
        ru: {
            upcoming: 'Скоро',
            registration_open: 'Рег. открыта',
            registration_closed: 'Рег. закрыта',
            ongoing: 'Идёт',
            completed: 'Завершён',
            cancelled: 'Отменён'
        },
        en: {
            upcoming: 'Coming Soon',
            registration_open: 'Reg. Open',
            registration_closed: 'Reg. Closed',
            ongoing: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled'
        },
        kg: {
            upcoming: 'Жакында',
            registration_open: 'Каттоо ачык',
            registration_closed: 'Каттоо жабык',
            ongoing: 'Жүрүп жатат',
            completed: 'Аяктады',
            cancelled: 'Жокко чыгарылды'
        }
    };

    /**
     * Статус по датам. Даты — строки YYYY-MM-DD, сравниваются как строки:
     * у дат в этом формате порядок строк совпадает с порядком дней.
     */
    function вычислить(regStart, regEnd, dateStart, dateEnd) {
        var сегодня = new Date().toISOString().substring(0, 10);
        if (regStart && сегодня < regStart) return 'upcoming';
        if (regStart && regEnd && сегодня >= regStart && сегодня <= regEnd) return 'registration_open';
        if (dateEnd && сегодня > dateEnd) return 'completed';
        if (dateStart && сегодня >= dateStart) return 'ongoing';
        if (regEnd && сегодня > regEnd) return 'registration_closed';
        return 'upcoming';
    }

    /* Язык не выводим здесь: его уже определяет каждый файл по своему пути,
       и второе определение того же понятия — это шов. Зовущий говорит язык
       сам; без него берём русский */
    function набор(язык) {
        return ПОДПИСИ[язык] || ПОДПИСИ.ru;
    }

    function подпись(статус, язык) {
        return набор(язык)[статус] || статус;
    }

    /** Весь набор подписей — тем, кто раньше держал свою карту */
    function подписи(язык) {
        var из = набор(язык);
        var копия = {};
        ПОРЯДОК.forEach(function(к) { копия[к] = из[к]; });
        return копия;
    }

    window.KSLT_STATUS = {
        ПОРЯДОК: ПОРЯДОК,
        вычислить: вычислить,
        подпись: подпись,
        подписи: подписи
    };
})();
