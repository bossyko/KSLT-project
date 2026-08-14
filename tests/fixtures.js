/**
 * Общая обвязка для автотестов.
 *
 * Заменяет `require('@playwright/test')` в файлах проверок: делает то же
 * самое, но перед загрузкой каждой страницы подставляет адрес тестовой базы.
 *
 *     const { test, expect } = require('../fixtures');
 *
 * Сайт читает его из window.KSLT_DB (js/supabase-config.js). Без подстановки
 * страница ушла бы в боевую базу — тысяча шестьсот прогонов оставили бы там
 * мусор и потратили месячную квоту трафика.
 */

const base = require('@playwright/test');
const db = require('./test-db');

/**
 * Картинки, шрифты и видео в проверках не загружаются.
 *
 * Проверки смотрят разметку и данные — фотографии игроков, баннеры баттлов
 * и обложки турниров им не нужны. А весит всё это почти весь трафик прогона:
 * две тысячи проверок, каждая открывает страницу с десятком снимков.
 *
 * Квота Supabase считается на всю организацию, включая тестовый проект, и
 * ею же оплачивается боевой. Пятнадцать прогонов в день съели месячный
 * лимит исходящего трафика и остановили сайт целиком — до конца платёжного
 * периода.
 *
 * Внешние картинки (unsplash, placehold) режем тоже: они ничего не стоят
 * нам, но замедляют прогон и делают его зависимым от чужой доступности.
 */
const HEAVY = /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm)(\?|$)/i;

const test = base.test.extend({
    context: async ({ context }, use) => {
        await context.addInitScript(function(cfg) {
            window.KSLT_DB = cfg;
        }, { url: db.url, key: db.key });

        await context.route('**/*', function(route) {
            const req = route.request();
            const type = req.resourceType();
            if (type === 'image' || type === 'font' || type === 'media' || HEAVY.test(req.url())) {
                // Пустой ответ, а не отказ: у <img> сработает onerror, и
                // подмена на инициалы отработает как в жизни
                return route.fulfill({ status: 200, contentType: 'image/gif', body: '' });
            }
            return route.continue();
        });

        await use(context);
    }
});

module.exports = { test, expect: base.expect, db };
