/**
 * Выгрузка турнирных таблиц: файл для Excel и печать
 * ==================================================
 *
 * Ручная копия на всякий случай: заявки, сетка и расписание запусков должны
 * уезжать из админки в файл. Интернет на корте пропадает, телефон садится —
 * а лист с расписанием лежит в кармане у ведущего.
 *
 * Читаем готовые таблицы прямо из панели, а не собираем данные заново. Так
 * выгрузка не расходится с тем, что менеджер видит на экране: поменяли
 * колонку в таблице — она сама появится и в файле.
 *
 * Служебное в файл не идёт: галочки выбора, кнопки действий и подсказки. Из
 * выпадающего списка посева берём выбранное число, а не весь список.
 *
 * KSLT_ADMIN.экспорт:
 *   вФайл(панель, имя)      — скачать таблицу .xls: колонки, рамки, шапка
 *   напечатать(панель, имя) — печать браузера: на бумагу или в PDF
 */

(function (A) {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;

    var L = isEn
        ? { download: 'Download', print: 'Print', empty: 'Nothing to export yet',
            signDirector: 'Tournament director', signReferee: 'Head referee', signName: 'name' }
        : { download: 'Скачать', print: 'Печать', empty: 'Выгружать пока нечего',
            signDirector: 'Директор турнира', signReferee: 'Главный судья', signName: 'фамилия, имя' };

    /** Текст ячейки без служебного: кнопок, галочек и подсказок. */
    function текстЯчейки(td) {
        var копия = td.cloneNode(true);

        // Кнопки действий, галочки и значки в файле бесполезны
        копия.querySelectorAll('button, input[type="checkbox"], svg, .ad-badge-hint')
            .forEach(function (э) { э.remove(); });

        // Посев и прочие списки: нужно выбранное значение, а не все варианты
        копия.querySelectorAll('select').forEach(function (сп) {
            var текст = сп.options[сп.selectedIndex] ? сп.options[сп.selectedIndex].text : '';
            сп.replaceWith(document.createTextNode(текст));
        });

        // Поля ввода счёта показывают значение, а не пустоту
        копия.querySelectorAll('input').forEach(function (п) {
            п.replaceWith(document.createTextNode(п.value || ''));
        });

        return (копия.textContent || '')
            .replace(/ /g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Служебные колонки таблицы: галочка выбора и «Действия».
     *
     * В файле от них остаются пустые столбцы — читать мешают, а пользы ноль:
     * кнопки на бумаге не нажмёшь. Ищем по строке заголовков, а не по номеру:
     * колонки у разных таблиц стоят по-разному.
     */
    function служебныеКолонки(таблица) {
        var шапка = таблица.querySelector('thead tr') || таблица.querySelector('tr');
        if (!шапка) return {};

        var служебные = {};
        var ячейки = шапка.querySelectorAll('th, td');
        for (var i = 0; i < ячейки.length; i++) {
            var подпись = текстЯчейки(ячейки[i]).toLowerCase();
            var галочка = !подпись && ячейки[i].querySelector('input[type="checkbox"]');
            if (галочка || подпись === 'действия' || подпись === 'actions') служебные[i] = true;
        }
        return служебные;
    }

    /**
     * Все таблицы панели построчно. Заголовки разделов берём тоже — без них
     * непонятно, где основная сетка, а где лист ожидания.
     */
    function строкиПанели(панель) {
        var строки = [];
        var узлы = панель.querySelectorAll('h3, h4, table');

        узлы.forEach(function (узел) {
            if (узел.tagName !== 'TABLE') {
                var подпись = текстЯчейки(узел);
                if (подпись) { строки.push([]); строки.push([подпись]); }
                return;
            }

            var служебные = служебныеКолонки(узел);
            узел.querySelectorAll('tr').forEach(function (tr) {
                var ячейки = [];
                tr.querySelectorAll('th, td').forEach(function (td, i) {
                    if (!служебные[i]) ячейки.push(текстЯчейки(td));
                });
                // Пустых строк в файле быть не должно: они появляются от
                // разделителей и в Excel выглядят как дыры в данных
                if (ячейки.some(function (з) { return з !== ''; })) строки.push(ячейки);
            });
        });

        return строки;
    }

    /** Имя файла: «Futures — заявки — 11.09.2026.xls». */
    function имяФайла(название, что) {
        var д = new Date();
        var дата = String(д.getDate()).padStart(2, '0') + '.' +
                   String(д.getMonth() + 1).padStart(2, '0') + '.' + д.getFullYear();
        return (название + ' - ' + что + ' - ' + дата)
            .replace(/[\\/:*?"<>|]/g, '-') + '.xls';
    }

    /** Экранирование для разметки таблицы. */
    function экр(текст) {
        return String(текст)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /**
     * Скачать таблицы панели — готовой таблицей, а не столбиком текста.
     *
     * Раньше отдавали CSV, и Excel на Mac сваливал всю строку в первую
     * колонку: разделитель он выбирает по настройкам системы, а не по файлу.
     * Отдаём разметку таблицы с расширением .xls — Excel, Numbers и Google
     * Таблицы открывают её как книгу, с колонками, рамками и шапкой.
     *
     * Внизу — кто проводил турнир: те же подписи, что на печати.
     */
    function вФайл(панельId, название, что) {
        var панель = document.getElementById(панельId);
        if (!панель) return;

        var строки = строкиПанели(панель);
        if (!строки.length) { A.showToast(L.empty, 'warning'); return; }

        var ширина = строки.reduce(function (м, с) { return Math.max(м, с.length); }, 1);

        var тело = строки.map(function (строка) {
            // Строка из одной ячейки — это заголовок раздела: «Группа A»,
            // «Лист ожидания». Растягиваем его на всю ширину таблицы
            if (строка.length === 1) {
                return '<tr><td class="раздел" colspan="' + ширина + '">' +
                    экр(строка[0]) + '</td></tr>';
            }
            var шапка = строка === строки[0] || строки.indexOf(строка) === 0;
            var клетка = шапка ? 'th' : 'td';
            var ячейки = строка.map(function (з) {
                return '<' + клетка + '>' + экр(з) + '</' + клетка + '>';
            }).join('');
            return '<tr>' + ячейки + '</tr>';
        }).join('\n');

        var п = A.экспорт && A.экспорт.подписи ? A.экспорт.подписи : {};
        var подписи =
            '<tr><td colspan="' + ширина + '"></td></tr>' +
            '<tr><td class="подпись" colspan="' + ширина + '">' +
                'КСЛТ — Кыргызстанское Сообщество Любителей Тенниса&nbsp;&nbsp;·&nbsp;&nbsp;' +
                '<a href="https://tennis.kg">tennis.kg</a>&nbsp;&nbsp;·&nbsp;&nbsp;' +
                '<a href="https://www.instagram.com/kslt_tennis.kg">@kslt_tennis.kg</a>&nbsp;&nbsp;·&nbsp;&nbsp;' +
                '<a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>' +
            '</td></tr>' +
            '<tr><td class="подпись" colspan="' + ширина + '">' +
                экр(L.signDirector) + ': ' + экр(п.director_name || '____________________') +
                '     ' +
                экр(L.signReferee) + ': ' + экр(п.referee_name || '____________________') +
            '</td></tr>';

        var книга =
            '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head>' +
            '<meta charset="utf-8">' +
            '<style>' +
                'table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12pt; }' +
                'th, td { border: 1px solid #999; padding: 4px 8px; vertical-align: middle; }' +
                'th { background: #ccff00; font-weight: bold; text-align: left; }' +
                'td.раздел { background: #f0f0f0; font-weight: bold; }' +
                'td.подпись { border: none; padding-top: 12px; }' +
                'caption { font-size: 14pt; font-weight: bold; text-align: left; padding-bottom: 8px; }' +
            '</style></head><body>' +
            '<table><caption>' + экр(название + ' — ' + что) + '</caption>' +
            тело + подписи +
            '</table></body></html>';

        var файл = new Blob(['﻿' + книга], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        var ссылка = document.createElement('a');
        ссылка.href = URL.createObjectURL(файл);
        ссылка.download = имяФайла(название, что);
        document.body.appendChild(ссылка);
        ссылка.click();
        document.body.removeChild(ссылка);
        setTimeout(function () { URL.revokeObjectURL(ссылка.href); }, 1000);
    }

    /**
     * Печать панели: на бумагу или в PDF средствами браузера.
     *
     * Печатаем ту же страницу, а не открываем новое окно: всплывающие окна
     * браузер часто блокирует молча, и менеджер решил бы, что кнопка сломана.
     * Остальное со страницы прячет @media print в admin.css.
     */
    function напечатать(панельId, название, что) {
        var панель = document.getElementById(панельId);
        if (!панель) return;

        // Служебные колонки прячем поимённо: CSS не умеет «скрыть седьмой
        // столбец», а пустая колонка «Действия» на листе занимает место и
        // сбивает ширину остальных
        var спрятанные = [];
        панель.querySelectorAll('table').forEach(function (таблица) {
            var служебные = служебныеКолонки(таблица);
            таблица.querySelectorAll('tr').forEach(function (tr) {
                tr.querySelectorAll('th, td').forEach(function (td, i) {
                    if (!служебные[i]) return;
                    td.classList.add('ad-no-print');
                    спрятанные.push(td);
                });
            });
        });

        // Водяной знак — картинкой, а не фоном: фоновую графику браузер
        // печатает только с включённой галочкой в диалоге, и подложка чаще
        // всего просто не попадала бы в файл
        var знак = document.createElement('div');
        знак.className = 'ad-print-watermark';
        знак.innerHTML = '<img src="../images/kslt-logo-print.svg" alt="">';

        // Шапка листа: логотип и название турнира. Стоит на каждой странице —
        // протокол уходит в клуб и на корты по частям, и лист без опознания
        // превращается в бумажку непонятно откуда
        var шапка = document.createElement('div');
        шапка.className = 'ad-print-title';
        шапка.innerHTML =
            // Печатная версия логотипа: буквы «КСЛТ» в основном файле белые
            // и на листе просто исчезают. Здесь они тёмные, фигура остаётся
            // фирменной зелёной
            '<img class="ad-print-logo" src="../images/kslt-logo-print.svg" alt="КСЛТ">' +
            '<span class="ad-print-title-text">' + A.esc(название) + ' — ' + A.esc(что) + '</span>';

        // Подвал: подписи. Контакты — отдельной полосой внизу каждой страницы
        var подвал = подвалПечати();
        var полоса = полосаКлуба();

        панель.prepend(шапка);
        панель.prepend(знак);
        панель.appendChild(подвал);
        // Полоса клуба — в саму страницу, а не в панель: внутри печатной
        // области «прилипание к листу» не работает, и строка выходила один
        // раз в конце. В body она ведёт себя как колонтитул и печатается на
        // каждой странице
        document.body.appendChild(полоса);
        document.body.classList.add('ad-printing');
        панель.classList.add('ad-print-area');

        function прибрать() {
            document.body.classList.remove('ad-printing');
            панель.classList.remove('ad-print-area');
            шапка.remove();
            знак.remove();
            подвал.remove();
            полоса.remove();
            спрятанные.forEach(function (td) { td.classList.remove('ad-no-print'); });
            спрятанные = [];
            window.removeEventListener('afterprint', прибрать);
        }
        window.addEventListener('afterprint', прибрать);

        // Ждём, пока загрузится логотип. Печать срабатывает мгновенно, а
        // картинку браузер тянет с диска: в первый раз она просто не
        // успевала попасть на лист, и протокол уходил без знака клуба
        var картинки = Array.prototype.slice.call(панель.querySelectorAll('.ad-print-logo, .ad-print-watermark img'));
        var ждём = картинки.filter(function (и) { return !и.complete; });

        function печатать() {
            window.print();
            // Safari не всегда шлёт afterprint — убираем следы и по таймеру
            setTimeout(прибрать, 3000);
        }

        if (!ждём.length) { печатать(); return; }

        var осталось = ждём.length;
        var пошли = false;
        var готово = function () {
            if (пошли) return;
            осталось--;
            if (осталось <= 0) { пошли = true; печатать(); }
        };
        ждём.forEach(function (и) {
            и.addEventListener('load', готово);
            и.addEventListener('error', готово);
        });
        // Картинка может не загрузиться вовсе — печатаем без неё, но печатаем
        setTimeout(function () {
            if (!пошли) { пошли = true; печатать(); }
        }, 1500);
    }

    /**
     * Подвал листа: подписи и контакты клуба.
     *
     * Протокол подписывают директор турнира и главный судья. Имена берём из
     * настроек турнира — их вводят один раз; не ввели, остаётся линия, впишут
     * от руки.
     *
     * Ниже — контакты клуба: лист расходится по рукам и живёт дольше, чем
     * страница в браузере.
     */
    function подвалПечати() {
        var т = A.экспорт && A.экспорт.подписи ? A.экспорт.подписи : {};
        var подпись = function(звание, имя) {
            return '<div class="ad-print-sign">' +
                '<div class="ad-print-sign-role">' + звание + '</div>' +
                '<div class="ad-print-sign-line"></div>' +
                '<div class="ad-print-sign-name">' +
                    (имя ? A.esc(имя) : '<span class="ad-print-sign-hint">' + L.signName + '</span>') +
                '</div>' +
            '</div>';
        };

        var блок = document.createElement('div');
        блок.className = 'ad-print-foot';
        блок.innerHTML =
            '<div class="ad-print-signs">' +
                подпись(L.signDirector, т.director_name) +
                подпись(L.signReferee, т.referee_name) +
            '</div>';
        return блок;
    }

    /**
     * Полоса клуба внизу каждой страницы.
     *
     * Лист уходит на корты, в чат и в печать и живёт дольше страницы в
     * браузере — значит должен сам говорить, чей он и где нас найти.
     * Ссылки живые: в PDF по ним переходят прямо из файла.
     *
     * Значки инстаграма и телеграма — те же, что в подвале сайта; сайт и
     * почта своими, в футере их значков нет.
     */
    function полосаКлуба() {
        var значок = function (путь) {
            return '<svg class="ad-print-ico" viewBox="0 0 24 24" fill="currentColor" ' +
                'xmlns="http://www.w3.org/2000/svg"><path d="' + путь + '"/></svg>';
        };

        var сайт = значок('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14A7.9 7.9 0 0 1 4 12c0-.69.1-1.36.26-2h3.38a16.6 16.6 0 0 0 0 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.07 16zm2.95-8H5.07a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.02 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.72 14.72 0 0 1 0-4h4.68a14.72 14.72 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.6 16.6 0 0 0 0-4h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z');
        var почта = значок('M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-8 4.76-8-4.76V6l8 4.76L20 6v2.24z');
        var инста = значок('M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z');
        var телега = значок('M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z');

        var бот = window.KSLT_TG_BOT || 'KSLTennisBot';

        var полоса = document.createElement('div');
        полоса.className = 'ad-print-contacts';
        полоса.innerHTML =
            '<span class="ad-print-club">КСЛТ — Кыргызстанское Сообщество Любителей Тенниса</span>' +
            '<a href="https://tennis.kg">' + сайт + 'tennis.kg</a>' +
            '<a href="https://www.instagram.com/kslt_tennis.kg">' + инста + '@kslt_tennis.kg</a>' +
            '<a href="https://t.me/' + бот + '">' + телега + '@' + бот + '</a>' +
            '<a href="mailto:kslt.kyrgyzstan@gmail.com">' + почта + 'kslt.kyrgyzstan@gmail.com</a>';
        return полоса;
    }

    /** Пара кнопок для шапки вкладки. */
    function кнопки(панельId, что) {
        return '<button class="ad-btn ad-btn-secondary ad-btn-sm ad-export-csv"' +
                   ' data-panel="' + панельId + '" data-what="' + что + '">⤓ ' + L.download + '</button>' +
               '<button class="ad-btn ad-btn-secondary ad-btn-sm ad-export-print"' +
                   ' data-panel="' + панельId + '" data-what="' + что + '">⎙ ' + L.print + '</button>';
    }

    /** Повесить обработчики на кнопки внутри контейнера. */
    function оживить(контейнер, название) {
        контейнер.querySelectorAll('.ad-export-csv').forEach(function (btn) {
            btn.addEventListener('click', function () {
                вФайл(btn.dataset.panel, название, btn.dataset.what);
            });
        });
        контейнер.querySelectorAll('.ad-export-print').forEach(function (btn) {
            btn.addEventListener('click', function () {
                напечатать(btn.dataset.panel, название, btn.dataset.what);
            });
        });
    }

    // Подписи протокола кладёт сюда раздел турнира: модуль выгрузки не
    // ходит в базу сам, он работает с тем, что уже на экране
    A.экспорт = { вФайл: вФайл, напечатать: напечатать, кнопки: кнопки, оживить: оживить,
                  L: L, подписи: null };

})(window.KSLT_ADMIN = window.KSLT_ADMIN || {});
