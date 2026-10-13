/**
 * ПРОБНАЯ ВИТРИНА НОВОСТЕЙ — КОМПОНЕНТ БЕЗ ДАННЫХ.
 *
 * В базе прогона новостей нет, а проверять надо РАСКЛАДКУ: бенто-сетку,
 * высоты карточек, обрезку заголовка. Данные здесь не при чём — нужен
 * КОМПОНЕНТ. Карточки доливаются ТОЙ ЖЕ разметкой, что отдаёт
 * `js/news.js` → renderGrid.
 *
 * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: до 13.10 разметка жила внутри
 * `67-novosti.spec.js`, и вторая проба (90, ровные ряды) завела бы вторую
 * копию — беда родилась бы ровно на шве между ними. Теперь копия одна, и
 * за её числом следит сторож в `tools/check-rovnye-ryady.js`.
 */

/** Доливает карточки той же разметкой, что отдаёт
 *  `js/news.js` → renderGrid. Возвращает функцию-уборщицу. */
const ПРОБНАЯ_ВИТРИНА = `(сколько) => {
    const сетка = document.getElementById('newsBento');
    if (!сетка) return null;
    for (let i = 0; i < сколько; i++) {
        const крупная = i === 0 && !document.querySelector('.news-grid > .tc');
        const a = document.createElement('a');
        a.href = '#проба';
        a.className = 'tc проба' + (крупная ? ' tc-featured' : '');
        a.innerHTML =
            '<div class="tc-image"><div class="tc-noimage">🎾</div>' +
                '<span class="tc-badge">Результаты</span></div>' +
            '<div class="tc-body">' +
                '<span class="tc-date">5 сентября 2026 г.</span>' +
                (крупная ? '<h2 class="tc-title">' : '<h3 class="tc-title">') +
                'Завершение и итоги ТБШ 2026 — рейтинговый турнир высшей категории' +
                (крупная ? '</h2>' : '</h3>') +
                (крупная ? '<p class="tc-desc">Подзаголовок пробы</p>' : '') +
                '<div class="tc-meta"><span>1 мин чтения</span></div>' +
            '</div>';
        сетка.appendChild(a);
    }
    return { было: сколько };
}`;

const УБРАТЬ_ПРОБУ = `() => {
    document.querySelectorAll('.news-grid > .tc.проба').forEach(e => e.remove());
}`;

module.exports = { ВИТРИНА: ПРОБНАЯ_ВИТРИНА, УБРАТЬ: УБРАТЬ_ПРОБУ };
