/**
 * ПЕЧАТНАЯ КАРТОЧКА НА ХОЛСТЕ — ОДНО ОПРЕДЕЛЕНИЕ НА ВЕСЬ ПРОДУКТ.
 *
 * Картинку ваучера рисовали ТРИ раза: на странице кортов, на странице
 * тренеров и в кабинете. Замер 19.10: рисование у кортов и тренеров
 * совпадало СЛОВО В СЛОВО (60 строк, сходство 1.00), у кабинета — 0.95.
 * Четвёртый рисовальщик, QR профиля игрока, делит с ними РАМКУ, но
 * содержимое у него своё — поэтому дом отдаёт рамку частями (`фон`,
 * `шапка`, `qrНаБелом`, `подписьСкана`, `подвал`), а середину каждый
 * рисует свою. Общее — общим, разное — разным.
 *
 * БЕДА РОДИЛАСЬ РОВНО НА ШВЕ, как и обещает правило. Кабинет научился
 * проверять пустые значения, корты и тренеры — нет: ваучер без скидки
 * рисовал «-undefined%» на картинке, которую человек скачивает и
 * показывает в клубе. Третья копия знала, две не знали.
 *
 * ЧТО ЕЩЁ НАШЁЛ ЗАМЕР:
 *   `ctx.strokeStyle = 'var(--alpha-lime-20)'` в ЧЕТЫРЁХ копиях — холст
 *   var() не понимает, и разделительная линия не рисовалась ВОВСЕ;
 *   46 красок числом; кегли 10 · 13 · 15 мимо шкалы;
 *   три текста ниже порога WCAG 4.5 — 3.81, 3.20 и 2.26.
 *
 * ПОРОГ ЗДЕСЬ СТРОЖЕ, ЧЕМ НА ЭКРАНЕ: это картинка, которую показывают с
 * телефона в клубе, случается — на солнце. Поднято до ступени 0.50 —
 * наименьшей на лестнице прозрачности, дающей 4.5 на ОБОИХ концах
 * градиента (верх 5.34, низ 5.12).
 *
 *     KSLT_VAUCHER.нарисовать({ qrCanvas, скидка, услуга, заведение,
 *                               срок, язык }) -> canvas
 *     KSLT_VAUCHER.скачать(карточка, имяФайла)
 *
 * Требует дом красок `js/kslt-kraska.js`: холст css-переменных не
 * понимает, и единственный законный способ взять цвет здесь — дом.
 */
(function () {
    'use strict';

    /* Размеры карточки. НАМЕРЕНО: это печатная картинка, а не экран
       продукта, и её ширина к шкале точек останова не относится. */
    var Ш = 380;
    var В = 520;

    /* ЛЕСТНИЦА ТИХОГО ТЕКСТА НА КАРТОЧКЕ — три ступени, не набор:
       0.50 тихое и читаемое, 0.60 среднее, 1 главное. Ступень 0.50 взята
       не на глаз: ниже неё контраст к градиенту падает под 4.5. */
    var ТИХО = 0.50;
    var СРЕДНЕ = 0.60;

    function краска(имя, альфа) {
        return window.KSLT_KRASKA.цвет(имя, альфа);
    }

    /** Прямоугольник со скруглением. Жил в трёх файлах одинаково. */
    function скруглённый(ctx, x, y, ш, в, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + ш - r, y);
        ctx.quadraticCurveTo(x + ш, y, x + ш, y + r);
        ctx.lineTo(x + ш, y + в - r);
        ctx.quadraticCurveTo(x + ш, y + в, x + ш - r, y + в);
        ctx.lineTo(x + r, y + в);
        ctx.quadraticCurveTo(x, y + в, x, y + в - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function шрифт(кегль, жирный) {
        return (жирный ? 'bold ' : '') + кегль + 'px Inter, Arial, sans-serif';
    }

    /* ---- ЧАСТИ РАМКИ. Общие у ваучера и у QR профиля ---- */

    /** Фирменный переход фона. Высота своя у каждой карточки. */
    function фон(ctx, ш, в) {
        var переход = ctx.createLinearGradient(0, 0, 0, в);
        переход.addColorStop(0, краска('--vch-card-top'));
        переход.addColorStop(1, краска('--vch-card-bottom'));
        ctx.fillStyle = переход;
        ctx.fillRect(0, 0, ш, в);
    }

    /* ИМЯ И РАСШИФРОВКА — ТЕ ЖЕ, ЧТО ВО ВСЁМ ПРОДУКТЕ, А НЕ СВОИ.
       Знак кириллицей на русском и латиницей на прочих — правило обложки,
       решённое 04.10 (`isEn || isKg ? 'KSLT' : 'КСЛТ'`), здесь оно просто
       донесено. Расшифровка взята дословно из титула, героя, подвала и
       печати выгрузки: «Кыргызстанское Сообщество Любителей Тенниса».
       Аббревиатура в строку НЕ входит — замер 19.10: «КСЛТ — » плюс
       расшифровка даёт 320.2 при полосе 300. Да и не нужна: знак стоит
       строкой выше. Капс тоже не входит (321.7). */
    var ЗНАК = { ru: 'КСЛТ', en: 'KSLT', kg: 'KSLT' };
    var РАСШИФРОВКА = {
        ru: 'Кыргызстанское Сообщество Любителей Тенниса',
        en: 'Kyrgyzstan Social Lawn Tennis',
        kg: 'Кыргызстан Теннис Ышкыбоздорунун Коомчулугу'
    };

    /** Полоса акцента, знак, расшифровка и разделитель — до y = 75. */
    function шапка(ctx, ш, язык) {
        язык = язык || 'ru';
        ctx.fillStyle = краска('--accent');
        ctx.fillRect(0, 0, ш, 4);

        ctx.textAlign = 'center';

        ctx.fillStyle = краска('--accent');
        ctx.font = шрифт(26, true);
        ctx.fillText(ЗНАК[язык], ш / 2, 42);

        ctx.fillStyle = краска('--neutral-white', ТИХО);
        ctx.font = шрифт(11);
        ctx.fillText(РАСШИФРОВКА[язык], ш / 2, 60);

        /* Разделитель. В прежних копиях стоял var(--alpha-lime-20) —
           холст его не понимал, и линии НЕ БЫЛО ВОВСЕ ни на одной из
           четырёх карточек. */
        ctx.strokeStyle = краска('--accent', 0.20);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 75);
        ctx.lineTo(ш - 40, 75);
        ctx.stroke();
    }

    /** QR на белой подложке. Чёрное по белому — требование считывания. */
    function qrНаБелом(ctx, qrCanvas, ш, qrY, qrР) {
        var поле = 12;
        var qrX = (ш - qrР) / 2;
        ctx.fillStyle = '#ffffff';
        скруглённый(ctx, qrX - поле, qrY - поле, qrР + поле * 2, qrР + поле * 2, 12);
        ctx.fill();
        ctx.drawImage(qrCanvas, qrX, qrY, qrР, qrР);
        return qrY + qrР + поле;
    }

    /** Подпись под QR: что будет, если его отсканировать. */
    function подписьСкана(ctx, ш, y, текст) {
        ctx.fillStyle = краска('--neutral-white', ТИХО);
        ctx.font = шрифт(11);
        ctx.fillText(текст, ш / 2, y + 22);
    }

    /** Нижняя полоса акцента и адрес сайта. */
    function подвал(ctx, ш, в) {
        ctx.fillStyle = краска('--accent');
        ctx.fillRect(0, в - 4, ш, 4);

        ctx.fillStyle = краска('--neutral-white', ТИХО);
        ctx.font = шрифт(11);
        ctx.fillText(window.KSLT_SAYT.подпись, ш / 2, в - 14);
    }

    var ПОДПИСЬ_СКАНА = {
        ru: 'Отсканируйте QR для проверки скидки',
        en: 'Scan QR to verify discount',
        kg: 'Арзандатууну текшерүү үчүн QR сканерлеңиз'
    };

    window.KSLT_VAUCHER = {
        Ш: Ш,
        В: В,
        скруглённый: скруглённый,

        /**
         * @param {Object} o
         * @param {HTMLCanvasElement} o.qrCanvas холст с QR-кодом
         * @param {number|string} [o.скидка]    процент; пусто — блока нет
         * @param {string} [o.услуга]
         * @param {string} [o.заведение]
         * @param {string} [o.срок]             готовая строка срока
         * @param {string} [o.язык]             'ru' | 'en' | 'kg'
         * @returns {HTMLCanvasElement|null} null, если QR не нарисован
         */
        нарисовать: function (o) {
            if (!o || !o.qrCanvas) return null;

            var c = document.createElement('canvas');
            c.width = Ш;
            c.height = В;
            var ctx = c.getContext('2d');

            var язык = o.язык === 'en' ? 'en' : (o.язык === 'kg' ? 'kg' : 'ru');

            фон(ctx, Ш, В);
            шапка(ctx, Ш, язык);

            /* УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ: нет скидки — нет блока, а не
               «-undefined%». Проверка жила только в копии кабинета. */
            if (o.скидка || o.скидка === 0) {
                ctx.fillStyle = краска('--accent');
                ctx.font = шрифт(32, true);
                ctx.fillText('-' + o.скидка + '%', Ш / 2, 112);
            }

            ctx.fillStyle = краска('--neutral-white');
            ctx.font = шрифт(16, true);
            ctx.fillText(o.услуга || '', Ш / 2, 138);

            ctx.fillStyle = краска('--neutral-white', СРЕДНЕ);
            ctx.font = шрифт(14);
            ctx.fillText(o.заведение || '', Ш / 2, 160);

            var низQR = qrНаБелом(ctx, o.qrCanvas, Ш, 180, 200);

            подписьСкана(ctx, Ш, низQR, ПОДПИСЬ_СКАНА[язык]);

            if (o.срок) {
                ctx.fillStyle = краска('--neutral-white', СРЕДНЕ);
                ctx.font = шрифт(12);
                ctx.fillText(o.срок, Ш / 2, низQR + 44);
            }

            подвал(ctx, Ш, В);
            return c;
        },

        /**
         * КАРТОЧКА QR ПРОФИЛЯ. Рамка та же, середина своя: имя игрока и
         * его разряд вместо скидки и услуги, и высота на 40 меньше —
         * строк меньше.
         *
         * @param {Object} o
         * @param {HTMLCanvasElement} o.qrCanvas
         * @param {string} [o.имя]
         * @param {string} [o.разряд]
         * @param {string} [o.подпись] что даст сканирование
         * @param {string} [o.язык]    'ru' | 'en' | 'kg'
         * @returns {HTMLCanvasElement|null}
         */
        профиль: function (o) {
            if (!o || !o.qrCanvas) return null;

            var в = 480;
            var c = document.createElement('canvas');
            c.width = Ш;
            c.height = в;
            var ctx = c.getContext('2d');

            фон(ctx, Ш, в);
            шапка(ctx, Ш, o.язык === 'en' ? 'en' : (o.язык === 'kg' ? 'kg' : 'ru'));

            ctx.fillStyle = краска('--neutral-white');
            ctx.font = шрифт(18, true);
            ctx.fillText(o.имя || '', Ш / 2, 105);

            if (o.разряд) {
                ctx.fillStyle = краска('--accent');
                ctx.font = шрифт(14);
                ctx.fillText(o.разряд, Ш / 2, 128);
            }

            var низQR = qrНаБелом(ctx, o.qrCanvas, Ш, 150, 200);
            подписьСкана(ctx, Ш, низQR, o.подпись || '');

            подвал(ctx, Ш, в);
            return c;
        },

        /** Отдать карточку человеку файлом. */
        скачать: function (карточка, имяФайла) {
            if (!карточка) return false;
            var a = document.createElement('a');
            a.download = имяФайла;
            a.href = карточка.toDataURL('image/png');
            a.click();
            return true;
        }
    };
})();
