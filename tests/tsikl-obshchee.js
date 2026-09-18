/**
 * Общая обвязка сквозных прогонов турнира.
 *
 * Одиночный и парный проходят один и тот же путь: заявки, замены,
 * жеребьёвка, счета, добор, плей-офф, завершение. Разнятся они составом,
 * а не дорогой, поэтому дорога живёт здесь, а сценарии — в своих файлах:
 * turnir-tsikl.js и turnir-tsikl-parnyy.js.
 *
 * Ходит ТОЛЬКО в тестовую базу, служебным ключом из .env.test.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ---- Ключи ----

const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.test'), 'utf8').split('\n').forEach(function(строка) {
    const m = строка.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
});

const URL = env.KSLT_TEST_DB_URL;
const KEY = env.KSLT_TEST_DB_KEY;
const SECRET = env.KSLT_TEST_DB_SECRET;
const САЙТ = 'http://localhost:8000';

if (!URL || !SECRET) throw new Error('Нет адреса или служебного ключа тестовой базы в .env.test');
if (URL.indexOf('qqkzszesviukopgjbead') !== -1) throw new Error('Это боевая база. Прогон идёт только по тестовой.');

// ---- Разговор с базой ----

async function бд(метод, путь, тело, заголовки) {
    const ответ = await fetch(URL + '/rest/v1/' + путь, {
        method: метод,
        headers: Object.assign({
            apikey: SECRET,
            Authorization: 'Bearer ' + SECRET,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
        }, заголовки || {}),
        body: тело ? JSON.stringify(тело) : undefined
    });
    const текст = await ответ.text();
    let данные = null;
    try { данные = текст ? JSON.parse(текст) : null; } catch (e) { данные = текст; }
    if (!ответ.ok) {
        const беда = (данные && данные.message) ? данные.message : текст.slice(0, 300);
        throw new Error(метод + ' ' + путь + ' → ' + ответ.status + ' ' + беда);
    }
    return данные;
}

const читать = (путь) => бд('GET', путь);
const писать = (таблица, строки) => бд('POST', таблица, строки,
    { Prefer: 'return=representation,resolution=merge-duplicates' });
const править = (путь, поля) => бд('PATCH', путь, поля);
const сносить = (путь) => бд('DELETE', путь);

// ---- Отчёт ----

const отчёт = [];
const счёт = { провалов: 0, находок: 0 };

function шаг(название) {
    отчёт.push({ тип: 'шаг', название: название });
    console.log('\n── ' + название);
}

function проверка(что, условие, подробность) {
    отчёт.push({ тип: 'проверка', что: что, ок: !!условие, подробность: подробность || '' });
    if (!условие) счёт.провалов++;
    console.log('   ' + (условие ? '✓' : '✗') + ' ' + что + (подробность ? ' — ' + подробность : ''));
    return !!условие;
}

/**
 * Находка: так система ведёт себя сегодня, и это неправильно.
 *
 * От провала отличается тем, что прогон её ждёт: проверка не сломалась, она
 * поймала известную дыру. Считаем отдельно, чтобы «всё зелено» не означало
 * «всё хорошо».
 */
function находка(что, подробность) {
    отчёт.push({ тип: 'находка', что: что, подробность: подробность || '' });
    счёт.находок++;
    console.log('   ⚠ ' + что + (подробность ? ' — ' + подробность : ''));
}

function пропуск(что, почему) {
    отчёт.push({ тип: 'проверка', что: что, ок: null, подробность: 'не проверено: ' + почему });
    console.log('   ○ ' + что + ' — не проверено: ' + почему);
}

function итог(файлОтчёта) {
    console.log('\n' + '─'.repeat(60));
    console.log(счёт.провалов ? 'ПРОВАЛОВ: ' + счёт.провалов : 'Все проверки пройдены');
    if (счёт.находок) console.log('Известных дыр отмечено: ' + счёт.находок);
    if (файлОтчёта) {
        fs.writeFileSync(path.join(__dirname, 'reports', файлОтчёта),
            JSON.stringify({ отчёт: отчёт, провалов: счёт.провалов }, null, 2));
    }
}

// ---- Браузер ----

async function поднятьСервер() {
    const живой = await fetch(САЙТ + '/index.html').then(() => true).catch(() => false);
    if (живой) return null;
    const процесс = spawn('python3', ['-m', 'http.server', '8000'], {
        cwd: path.join(__dirname, '..'), stdio: 'ignore'
    });
    for (let п = 0; п < 30; п++) {
        await new Promise(function(r) { setTimeout(r, 300); });
        const ок = await fetch(САЙТ + '/index.html').then(() => true).catch(() => false);
        if (ок) return процесс;
    }
    throw new Error('Сервер на 8000 не поднялся');
}

async function открытьАдминку(браузер) {
    const контекст = await браузер.newContext({
        storageState: path.join(__dirname, '.auth', 'admin.json'),
        viewport: { width: 1400, height: 1000 }
    });
    await контекст.addInitScript(function(cfg) { window.KSLT_DB = cfg; }, { url: URL, key: KEY });
    const страница = await контекст.newPage();
    // Ошибки страницы в прогон: молчаливое падение админки иначе выглядит
    // как «ничего не произошло»
    страница.on('console', function(с) {
        const текст = с.text();
        if (с.type() !== 'error') return;
        if (текст.indexOf('Failed to load resource') !== -1) return;
        if (текст.indexOf('X-Frame-Options') !== -1) return;
        console.log('     [страница] ' + текст.slice(0, 200));
    });
    страница.сообщения = [];
    страница.on('console', function(с) { страница.сообщения.push(с.text()); });
    страница.on('pageerror', function(е) {
        console.log('     [страница] ' + String(е.message).slice(0, 200));
    });
    return { контекст, страница };
}

async function открытьСетку(страница, турнир) {
    await страница.goto(САЙТ + '/pages/admin.html#tournaments/bracket/' + турнир, { waitUntil: 'domcontentloaded' });
    await страница.waitForTimeout(3500);
}

async function подтвердить(страница) {
    const кнопка = страница.locator('#adConfirmOk');
    await кнопка.waitFor({ state: 'visible', timeout: 10000 });
    await кнопка.click();
}

/** Что сказала админка: тост или окно. Пусто — значит промолчала. */
async function чтоСказала(страница) {
    const узлы = страница.locator('.ad-toast, .ad-notice-text, .ad-confirm-title, .ad-confirm-text');
    if (!await узлы.count()) return '';
    return (await узлы.allTextContents()).join(' | ').trim().slice(0, 300);
}

/** Закрыть окно, если оно висит: иначе оно перехватывает нажатия. */
async function закрытьОкна(страница) {
    for (const кнопка of ['#adNoticeOk', '#adConfirmCancel']) {
        const узел = страница.locator(кнопка);
        if (await узел.count() && await узел.first().isVisible().catch(() => false)) {
            await узел.first().click().catch(() => {});
            await страница.waitForTimeout(400);
        }
    }
}

/**
 * Замена руками менеджера: через меню заявки, как в жизни.
 *
 * `кого` — 'player' или 'partner': в парном админка сперва спрашивает,
 * кого из двоих меняем.
 */
async function заменитьЧерезАдминку(страница, турнир, regId, идНового, имяНового, кого) {
    await закрытьОкна(страница);
    await страница.goto(САЙТ + '/pages/admin.html#tournaments/bracket/' + турнир, { waitUntil: 'domcontentloaded' });
    await страница.waitForTimeout(3000);
    const вкладка = страница.locator('[data-trn-nav="regs"]');
    if (await вкладка.count()) { await вкладка.first().click(); await страница.waitForTimeout(1500); }

    const меню = страница.locator('.ad-reg-menu:has(.ad-btn-replace[data-reg-id="' + regId + '"]) .ad-reg-menu-btn');
    await меню.first().click();
    await страница.waitForTimeout(400);
    await страница.locator('.ad-btn-replace[data-reg-id="' + regId + '"]').first().click();
    await страница.waitForTimeout(700);

    // Парный: сначала выбор, кого из двоих меняем. В одиночном такого окна
    // нет вовсе, поэтому ждём его только там, где спросили напарника
    const выбор = страница.locator(кого === 'partner' ? '#adReplacePartnerBtn' : '#adReplaceMainBtn');
    if (кого === 'partner') {
        await выбор.waitFor({ state: 'visible', timeout: 8000 });
    }
    if (await выбор.count()) { await выбор.first().click(); await страница.waitForTimeout(800); }

    await страница.locator('#adReplaceSearch').waitFor({ state: 'visible', timeout: 10000 });
    // Окно только что вставлено: обработчик поля вешается следом, и набор
    // раньше него уходит в пустоту
    await страница.waitForTimeout(1200);
    await страница.fill('#adReplaceSearch', имяНового);
    await страница.locator('.ad-replace-search-item[data-player-id="' + идНового + '"]').first().click({ timeout: 10000 });
    await подтвердить(страница);
    await страница.waitForTimeout(2500);
}

/** Вход администратором: правку результата база пускает только от человека. */
async function токенАдмина() {
    const ответ = await fetch(URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.kslt.kg', password: 'TestAdmin1!' })
    });
    const сессия = await ответ.json();
    if (!сессия.access_token) throw new Error('Не вышло войти админом: ' + JSON.stringify(сессия).slice(0, 200));
    return сессия.access_token;
}

module.exports = {
    URL, KEY, SECRET, САЙТ, закрытьОкна,
    читать, писать, править, сносить,
    шаг, проверка, находка, пропуск, итог, счёт, отчёт,
    поднятьСервер, открытьАдминку, открытьСетку, подтвердить, чтоСказала,
    заменитьЧерезАдминку, токенАдмина
};
