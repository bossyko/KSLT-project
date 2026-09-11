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
 *   вФайл(панель, имя)      — скачать .csv, Excel открывает его как родной
 *   напечатать(панель, имя) — печать браузера: на бумагу или в PDF
 */

(function (A) {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;

    var L = isEn
        ? { download: 'Download', print: 'Print', empty: 'Nothing to export yet' }
        : { download: 'Скачать', print: 'Печать', empty: 'Выгружать пока нечего' };

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

    /** Одна ячейка в правилах CSV: кавычки удваиваем, всё берём в кавычки. */
    function ячейкаCSV(текст) {
        return '"' + String(текст).replace(/"/g, '""') + '"';
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

    /** Имя файла: «Futures — заявки — 11.09.2026.csv». */
    function имяФайла(название, что) {
        var д = new Date();
        var дата = String(д.getDate()).padStart(2, '0') + '.' +
                   String(д.getMonth() + 1).padStart(2, '0') + '.' + д.getFullYear();
        return (название + ' - ' + что + ' - ' + дата)
            .replace(/[\\/:*?"<>|]/g, '-') + '.csv';
    }

    /**
     * Скачать таблицы панели.
     *
     * Разделитель — точка с запятой: Excel в русской раскладке ждёт именно её,
     * с запятой он валит всю строку в одну ячейку. Впереди BOM, иначе Excel
     * читает кириллицу как «Ð˜Ð³Ñ€Ð¾Ðº».
     */
    function вФайл(панельId, название, что) {
        var панель = document.getElementById(панельId);
        if (!панель) return;

        var строки = строкиПанели(панель);
        if (!строки.length) { A.showToast(L.empty, 'warning'); return; }

        var csv = строки.map(function (строка) {
            return строка.map(ячейкаCSV).join(';');
        }).join('\r\n');

        var файл = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
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

        var шапка = document.createElement('div');
        шапка.className = 'ad-print-title';
        шапка.textContent = название + ' — ' + что;

        панель.prepend(шапка);
        document.body.classList.add('ad-printing');
        панель.classList.add('ad-print-area');

        function прибрать() {
            document.body.classList.remove('ad-printing');
            панель.classList.remove('ad-print-area');
            шапка.remove();
            спрятанные.forEach(function (td) { td.classList.remove('ad-no-print'); });
            спрятанные = [];
            window.removeEventListener('afterprint', прибрать);
        }
        window.addEventListener('afterprint', прибрать);

        window.print();
        // Safari не всегда шлёт afterprint — убираем следы и по таймеру
        setTimeout(прибрать, 3000);
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

    A.экспорт = { вФайл: вФайл, напечатать: напечатать, кнопки: кнопки, оживить: оживить, L: L };

})(window.KSLT_ADMIN = window.KSLT_ADMIN || {});
