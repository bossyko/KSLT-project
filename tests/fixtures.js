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

/**
 * ВИДИМ ЛИ УЗЕЛ — ОДНО ОПРЕДЕЛЕНИЕ НА ВСЕ ПРОБЫ (кусок 196, 27.10).
 *
 * ЗАМЕР: видимость считали САМИ 33 пробы, и считали ПО-РАЗНОМУ. Одни
 * смотрели только сам узел, другие поднимались по предкам. Разошлось это
 * не завтра, а уже: проба 94 брала `display` и `visibility` самого
 * кружка — а скрыт был РОДИТЕЛЬ, неактивная панель рейтинга
 * (`div.rankings-panel [display: none]`). Проба считала 16 кружков
 * «видимыми и схлопнутыми в 0x0» и падала — на правильной вёрстке.
 *
 * СВОЙСТВА УЗЛА НЕ ЗНАЮТ О ПРЕДКАХ. Ровно та же беда была у прибора
 * контраста 13.10: `opacity: 0` на родителе в свойствах узла не виден.
 * Третий раз на этих граблях — поэтому определение одно и живёт здесь.
 *
 * Объявляется ДО загрузки страницы, поэтому доступно любой пробе как
 * `window.КСЛТ_виден(узел)` без подключений и импортов.
 */
function виден(эл) {
    if (!эл) return false;
    var r = эл.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var вид = эл.ownerDocument.defaultView;
    var у = эл;
    while (у) {
        var c = вид.getComputedStyle(у);
        if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false;
        у = у.parentElement;
    }
    return true;
}

const test = base.test.extend({
    context: async ({ context }, use) => {
        await context.addInitScript(function(cfg) {
            window.KSLT_DB = cfg;
        }, { url: db.url, key: db.key });

        await context.addInitScript('window.КСЛТ_виден = ' + виден.toString() + ';');

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

module.exports = { test, expect: base.expect, db, виден };
