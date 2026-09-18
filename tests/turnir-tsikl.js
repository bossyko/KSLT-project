/**
 * Сквозной прогон турнира: от заявок до завершения.
 *
 * Проверяет не код по отдельности, а всю цепочку целиком — заявки, замены,
 * жеребьёвку, счета групп, претендентов, доп. матчи, плей-офф и завершение.
 * Половина этой цепочки живёт в браузере (сборка сетки, заполнение клеток),
 * половина — в базе (переходы по сетке, закрытие проходов). Поэтому здесь
 * и браузер, и прямые запросы: шаг делаем как человек, итог читаем из базы.
 *
 * Идёт ТОЛЬКО по тестовой базе, служебным ключом из .env.test. Боевой базы
 * этот файл не касается вовсе — ключа от неё здесь нет.
 *
 * Запуск:  node tests/turnir-tsikl.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');

// ---- Ключи тестовой базы ----

const env = {};
const файлКлючей = path.join(__dirname, '..', '.env.test');
fs.readFileSync(файлКлючей, 'utf8').split('\n').forEach(function(строка) {
    const m = строка.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
});
const URL = env.KSLT_TEST_DB_URL;
const KEY = env.KSLT_TEST_DB_KEY;
const SECRET = env.KSLT_TEST_DB_SECRET;

if (!URL || !SECRET) {
    throw new Error('Нет адреса или служебного ключа тестовой базы в .env.test');
}
if (URL.indexOf('qqkzszesviukopgjbead') !== -1) {
    throw new Error('Это боевая база. Прогон идёт только по тестовой.');
}

const ТУРНИР = 'tsikl-odinochka';
const ПРЕФИКС = 'tsikl-';
const САЙТ = 'http://localhost:8000';

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
        throw new Error(метод + ' ' + путь + ' → ' + ответ.status + ' ' + текст.slice(0, 300));
    }
    return данные;
}

const читать = (путь) => бд('GET', путь);
const писать = (таблица, строки) => бд('POST', таблица, строки, { Prefer: 'return=representation,resolution=merge-duplicates' });
const править = (путь, поля) => бд('PATCH', путь, поля);
const сносить = (путь) => бд('DELETE', путь);

// ---- Отчёт ----

const отчёт = [];
let провалов = 0;

function шаг(название) {
    отчёт.push({ тип: 'шаг', название: название });
    console.log('\n── ' + название);
}

function проверка(что, условие, подробность) {
    отчёт.push({ тип: 'проверка', что: что, ок: !!условие, подробность: подробность || '' });
    if (!условие) провалов++;
    console.log('   ' + (условие ? '✓' : '✗') + ' ' + что + (подробность ? ' — ' + подробность : ''));
    return !!условие;
}

// ---- Подготовка данных ----

const ИГРОКОВ = 28;
const ГРУПП = 7;

function идИгрока(н) { return ПРЕФИКС + String(н).padStart(2, '0'); }

async function убратьПрошлыйПрогон() {
    await сносить('matches?tournament_id=eq.' + ТУРНИР);
    await сносить('tournament_results?tournament_id=eq.' + ТУРНИР);
    await сносить('tournament_registrations?tournament_id=eq.' + ТУРНИР);
    await сносить('tournaments?id=eq.' + ТУРНИР);
    await сносить('players?id=like.' + ПРЕФИКС + '*');
}

async function завестиДанные() {
    const категории = await читать('categories?select=id&limit=20');
    const естьFutures = (категории || []).some(function(к) { return к.id === 'futures'; });
    if (!естьFutures) {
        await писать('categories', [{ id: 'futures', name: 'FUTURES' }]);
    }

    const игроки = [];
    for (let н = 1; н <= ИГРОКОВ + 4; н++) {
        игроки.push({
            id: идИгрока(н),
            name: 'Прогон Игрок ' + String(н).padStart(2, '0'),
            gender: 'men',
            country: '🇰🇬',
            category_id: 'futures',
            is_member: true,
            has_account: false,
            points: 1000 - н * 10
        });
    }
    await писать('players', игроки);

    await писать('tournaments', [{
        id: ТУРНИР,
        title: 'Прогон: одиночный FUTURES',
        date_start: '2026-09-30',
        category_id: 'futures',
        format: 'singles',
        bracket_type: 'round_robin',
        group_count: ГРУПП,
        qualifiers_per_group: 2,
        status: 'registration_closed',
        gender: 'men',
        max_participants: ИГРОКОВ,
        court_count: 4,
        match_duration: 90,
        start_time: '08:00'
    }]);

    const заявки = [];
    for (let н = 1; н <= ИГРОКОВ; н++) {
        заявки.push({
            id: crypto.randomUUID(),
            tournament_id: ТУРНИР,
            player_id: идИгрока(н),
            status: 'approved',
            registered_at: new Date(Date.UTC(2026, 8, 20, 6, н)).toISOString()
        });
    }
    await писать('tournament_registrations', заявки);
    return заявки;
}

// ---- Браузер ----

async function поднятьСервер() {
    const живой = await fetch(САЙТ + '/index.html').then(function() { return true; }).catch(function() { return false; });
    if (живой) return null;
    const процесс = spawn('python3', ['-m', 'http.server', '8000'], {
        cwd: path.join(__dirname, '..'), stdio: 'ignore'
    });
    for (let п = 0; п < 30; п++) {
        await new Promise(function(r) { setTimeout(r, 300); });
        const ок = await fetch(САЙТ + '/index.html').then(function() { return true; }).catch(function() { return false; });
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
    страница.on('console', function(с) {
        if (с.type() === 'error') console.log('     [консоль] ' + с.text().slice(0, 160));
    });
    return { контекст, страница };
}

async function открытьСетку(страница) {
    await страница.goto(САЙТ + '/pages/admin.html#tournaments/bracket/' + ТУРНИР, { waitUntil: 'domcontentloaded' });
    await страница.waitForTimeout(3500);
}

async function подтвердить(страница) {
    const кнопка = страница.locator('#adConfirmOk');
    await кнопка.waitFor({ state: 'visible', timeout: 10000 });
    await кнопка.click();
}

/**
 * Замена игрока руками менеджера: как в жизни — через меню заявки.
 *
 * Прямая правка заявки в базе проверяла бы мою выдумку, а не то, что делает
 * админка: там за заменой тянутся матчи, история и уведомления.
 */
async function заменитьЧерезАдминку(страница, regId, идНового, имяНового) {
    await страница.goto(САЙТ + '/pages/admin.html#tournaments/bracket/' + ТУРНИР, { waitUntil: 'domcontentloaded' });
    await страница.waitForTimeout(3000);
    const вкладка = страница.locator('[data-trn-nav="regs"]');
    if (await вкладка.count()) { await вкладка.first().click(); await страница.waitForTimeout(1500); }

    const меню = страница.locator('.ad-reg-menu:has(.ad-btn-replace[data-reg-id="' + regId + '"]) .ad-reg-menu-btn');
    await меню.first().click();
    await страница.waitForTimeout(400);
    await страница.locator('.ad-btn-replace[data-reg-id="' + regId + '"]').first().click();
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

// ---- Прогон ----

(async function () {
    let сервер = null;
    let браузер = null;
    try {
        шаг('Подготовка тестовой базы');
        await убратьПрошлыйПрогон();
        const заявки = await завестиДанные();
        проверка('заведено ' + ИГРОКОВ + ' заявок', заявки.length === ИГРОКОВ, 'заявок ' + заявки.length);

        шаг('Замена до жеребьёвки — через админку');
        сервер = await поднятьСервер();
        браузер = await chromium.launch({ headless: true });
        const { страница } = await открытьАдминку(браузер);

        // Игрок 28 не приедет, вместо него заходит запасной 29
        const снятая = заявки[ИГРОКОВ - 1];
        await заменитьЧерезАдминку(страница, снятая.id, идИгрока(ИГРОКОВ + 1),
            'Прогон Игрок ' + String(ИГРОКОВ + 1).padStart(2, '0'));
        const послеЗамены = await читать('tournament_registrations?select=id,player_id,status&tournament_id=eq.' + ТУРНИР);
        проверка('замена игрока в заявке прошла',
            послеЗамены.some(function(з) { return з.player_id === идИгрока(ИГРОКОВ + 1); }));
        проверка('заявок осталось ' + ИГРОКОВ, послеЗамены.length === ИГРОКОВ, 'заявок ' + послеЗамены.length);

        шаг('Жеребьёвка через админку');
        await открытьСетку(страница);

        const кнопка = страница.locator('#adBrkGenerateDraw');
        const естьКнопка = await кнопка.count();
        проверка('кнопка жеребьёвки на месте', естьКнопка > 0);
        if (естьКнопка) {
            await кнопка.click();
            await подтвердить(страница);
            await страница.waitForTimeout(6000);
        }

        const матчи = await читать('matches?select=id,round,group_number,match_order,player1_id,player2_id,reg1_id,reg2_id,slot1_label,slot2_label,status&tournament_id=eq.' + ТУРНИР);
        const групповых = матчи.filter(function(м) { return м.group_number; });
        проверка('групповые матчи созданы', групповых.length > 0, 'всего матчей ' + матчи.length + ', групповых ' + групповых.length);

        const поГруппам = {};
        групповых.forEach(function(м) {
            поГруппам[м.group_number] = поГруппам[м.group_number] || new Set();
            if (м.player1_id) поГруппам[м.group_number].add(м.player1_id);
            if (м.player2_id) поГруппам[м.group_number].add(м.player2_id);
        });
        const размеры = Object.keys(поГруппам).sort().map(function(г) { return поГруппам[г].size; });
        проверка('групп ' + ГРУПП + ' и все по 4', размеры.length === ГРУПП && размеры.every(function(р) { return р === 4; }),
            'размеры: ' + размеры.join(', '));

        let круговВерно = true;
        Object.keys(поГруппам).forEach(function(г) {
            const людей = поГруппам[г].size;
            const надо = людей * (людей - 1) / 2;
            const есть = групповых.filter(function(м) { return String(м.group_number) === String(г); }).length;
            if (есть !== надо) круговВерно = false;
        });
        проверка('в каждой группе полный круг', круговВерно);

        const вДвух = {};
        групповых.forEach(function(м) {
            [м.player1_id, м.player2_id].forEach(function(и) {
                if (!и) return;
                вДвух[и] = вДвух[и] || new Set();
                вДвух[и].add(м.group_number);
            });
        });
        проверка('никто не стоит в двух группах',
            Object.keys(вДвух).every(function(и) { return вДвух[и].size === 1; }));

        const встречи = {};
        let дубли = 0;
        групповых.forEach(function(м) {
            if (!м.player1_id || !м.player2_id) return;
            const к = м.group_number + '|' + [м.player1_id, м.player2_id].sort().join('|');
            встречи[к] = (встречи[к] || 0) + 1;
            if (встречи[к] > 1) дубли++;
        });
        проверка('нет встреч, заведённых дважды', дубли === 0, дубли ? 'дублей ' + дубли : '');

        const доп = матчи.filter(function(м) { return м.round === 'IG'; });
        const плей = матчи.filter(function(м) { return !м.group_number && м.round !== 'IG'; });
        проверка('доп. матчи созданы', доп.length > 0, 'доп. матчей ' + доп.length +
            ' (' + доп.map(function(м) { return м.slot1_label + ' vs ' + м.slot2_label; }).join(', ') + ')');
        проверка('сетка плей-офф создана', плей.length > 0, 'клеток ' + плей.length);

        const безСсылок = групповых.filter(function(м) { return !м.reg1_id || !м.reg2_id; }).length;
        проверка('у групповых матчей есть ссылки на заявки', безСсылок === 0,
            безСсылок ? 'без ссылок ' + безСсылок + ' из ' + групповых.length : '');

        шаг('Замена игрока после жеребьёвки');
        // Меняем того, кто уже стоит в группе: состав матчей должен пойти
        // за заявкой, а не остаться со старым именем
        const вГруппе = групповых.find(function(м) { return м.reg1_id && м.player1_id; });
        const ктоБыл = вГруппе.player1_id;
        const запасной = идИгрока(ИГРОКОВ + 2);
        await заменитьЧерезАдминку(страница, вГруппе.reg1_id, запасной,
            'Прогон Игрок ' + String(ИГРОКОВ + 2).padStart(2, '0'));
        await открытьСетку(страница);
        const послеЗаменыВГруппе = await читать('matches?select=id,group_number,player1_id,player2_id,reg1_id,reg2_id&tournament_id=eq.' + ТУРНИР);
        const егоМатчи = послеЗаменыВГруппе.filter(function(м) {
            return м.reg1_id === вГруппе.reg1_id || м.reg2_id === вГруппе.reg1_id;
        });
        const сталНовый = егоМатчи.every(function(м) {
            const свой = м.reg1_id === вГруппе.reg1_id ? м.player1_id : м.player2_id;
            return свой === запасной;
        });
        проверка('замена в группе разошлась по всем матчам', сталНовый && егоМатчи.length === 3,
            'матчей заявки ' + егоМатчи.length + ', был ' + ктоБыл + ' → стал ' + запасной);
        const старыйОстался = послеЗаменыВГруппе.some(function(м) {
            return м.player1_id === ктоБыл || м.player2_id === ктоБыл;
        });
        проверка('прежний игрок нигде не остался', !старыйОстался);

        шаг('Счёт групповых матчей');
        const кСчёту = await читать('matches?select=id,group_number,player1_id,player2_id&tournament_id=eq.' + ТУРНИР + '&group_number=not.is.null');
        for (const м of кСчёту) {
            // Побеждает тот, чей идентификатор меньше: расклад неважен,
            // важно, чтобы места считались и группы закрывались
            const победитель = м.player1_id < м.player2_id ? м.player1_id : м.player2_id;
            const счёт = победитель === м.player1_id ? '6/3 6/4' : '3/6 4/6';
            await править('matches?id=eq.' + м.id, {
                score: счёт, winner_id: победитель, status: 'completed',
                played_at: new Date().toISOString()
            });
        }
        проверка('счёт проставлен всем ' + кСчёту.length + ' групповым', кСчёту.length === 42,
            'матчей ' + кСчёту.length);

        шаг('Что собралось после групп');
        await открытьСетку(страница);
        await страница.waitForTimeout(4000);
        await открытьСетку(страница);
        const послеГрупп = await читать('matches?select=id,round,round_number,group_number,match_order,player1_id,player2_id,slot1_label,slot2_label,status,score,winner_id&tournament_id=eq.' + ТУРНИР);
        const группыПосле = послеГрупп.filter(function(м) { return м.group_number; });
        проверка('групповых матчей по-прежнему 42', группыПосле.length === 42, 'стало ' + группыПосле.length);
        проверка('чужие в группах не появились',
            группыПосле.every(function(м) { return м.player1_id && м.player2_id; }));

        const допПосле = послеГрупп.filter(function(м) { return м.round === 'IG'; });
        проверка('доп. матчи получили участников',
            допПосле.every(function(м) { return м.player1_id && м.player2_id; }),
            допПосле.map(function(м) { return (м.player1_id || '—') + ' vs ' + (м.player2_id || '—'); }).join('; '));

        const первыйКруг = послеГрупп.filter(function(м) { return м.round === 'R1'; });
        const занятоR1 = первыйКруг.reduce(function(н, м) {
            return н + (м.player1_id ? 1 : 0) + (м.player2_id ? 1 : 0);
        }, 0);
        проверка('в первый круг встали 14 из групп', занятоR1 === 14,
            'занято клеток ' + занятоR1 + ' из 16');

        let земляки = 0;
        const группаИгрока = {};
        группыПосле.forEach(function(м) {
            группаИгрока[м.player1_id] = м.group_number;
            группаИгрока[м.player2_id] = м.group_number;
        });
        первыйКруг.forEach(function(м) {
            if (!м.player1_id || !м.player2_id) return;
            if (группаИгрока[м.player1_id] && группаИгрока[м.player1_id] === группаИгрока[м.player2_id]) земляки++;
        });
        проверка('земляки в первом круге не сведены', земляки === 0, земляки ? 'пар землякoв ' + земляки : '');

        шаг('Отмена доп. матча и проход без игры');
        // Первый доп. матч отменяем руками менеджера, второй играем: так
        // видно обе дороги сразу
        const отменяемый = допПосле[0];
        const меткаОтменённого = 'IG' + (отменяемый.match_order || 1);
        const ждавшая = послеГрупп.find(function(м) {
            return м.slot1_label === меткаОтменённого || м.slot2_label === меткаОтменённого;
        });
        const соперникПоСетке = ждавшая
            ? (ждавшая.slot1_label === меткаОтменённого ? ждавшая.player2_id : ждавшая.player1_id)
            : null;

        await открытьСетку(страница);
        const кнопкаОтмены = страница.locator('[data-ig-cancel="' + отменяемый.id + '"]');
        проверка('кнопка отмены доп. матча на месте', await кнопкаОтмены.count() > 0);
        if (await кнопкаОтмены.count()) {
            await кнопкаОтмены.first().click();
            await подтвердить(страница);
            await страница.waitForTimeout(3000);
        }
        await открытьСетку(страница);
        const послеОтмены = await читать('matches?select=id,round,match_order,player1_id,player2_id,slot1_label,slot2_label,status,score,winner_id&tournament_id=eq.' + ТУРНИР);
        const отменённый = послеОтмены.find(function(м) { return м.id === отменяемый.id; });
        проверка('доп. матч помечен отменённым', отменённый && отменённый.status === 'cancelled',
            отменённый ? 'состояние ' + отменённый.status : 'матч потерялся');
        const клеткаСразу = послеОтмены.find(function(м) { return м.id === (ждавшая || {}).id; });
        проверка('метка отменённого снята с клетки',
            клеткаСразу && клеткаСразу.slot1_label !== меткаОтменённого &&
            клеткаСразу.slot2_label !== меткаОтменённого);

        шаг('Второй доп. матч сыгран');
        const игранный = допПосле[1];
        if (игранный && игранный.player1_id) {
            await править('matches?id=eq.' + игранный.id, {
                score: '6/2 6/2', winner_id: игранный.player1_id, status: 'completed',
                played_at: new Date().toISOString()
            });
        }
        // Проход закрывается, когда закрыты все доп. матчи — сыгран или
        // отменён, неважно. Пока хоть один висит, сетка ждёт его
        let послеДоп = [];
        for (let подход = 0; подход < 6; подход++) {
            await открытьСетку(страница);
            await страница.waitForTimeout(2500);
            послеДоп = await читать('matches?select=id,round,round_number,match_order,player1_id,player2_id,slot1_label,slot2_label,status,score,winner_id&tournament_id=eq.' + ТУРНИР);
            const к = послеДоп.find(function(м) { return м.id === (ждавшая || {}).id; });
            if (к && к.status === 'completed') break;
        }
        const клетка = послеДоп.find(function(м) { return м.id === (ждавшая || {}).id; });
        const ктоОстался = клетка ? (клетка.player1_id || клетка.player2_id) : null;
        проверка('соперник отменённого прошёл без игры',
            клетка && клетка.status === 'completed' && клетка.score === 'BYE' &&
            клетка.winner_id === ктоОстался && !!ктоОстался,
            клетка ? 'счёт ' + клетка.score + ', состояние ' + клетка.status +
                ', прошёл ' + клетка.winner_id : '');
        const R1после = послеДоп.filter(function(м) { return м.round === 'R1'; });
        const занято2 = R1после.reduce(function(н, м) {
            return н + (м.player1_id ? 1 : 0) + (м.player2_id ? 1 : 0);
        }, 0);
        проверка('победитель доп. матча встал в сетку, отменённый места никому не отдал',
            занято2 === 15, 'занято клеток ' + занято2 + ' из 16');

        шаг('Плей-офф: переходы делает база');
        for (const м of R1после) {
            if (м.status === 'completed') continue;   // проход без игры уже закрыт
            if (!м.player1_id || !м.player2_id) continue;
            await править('matches?id=eq.' + м.id, {
                score: '6/4 6/4', winner_id: м.player1_id, status: 'completed',
                played_at: new Date().toISOString()
            });
        }
        await new Promise(function(r) { setTimeout(r, 2000); });
        const послеR1 = await читать('matches?select=id,round,round_number,match_order,player1_id,player2_id,status,winner_id,group_number&tournament_id=eq.' + ТУРНИР);
        const чф = послеR1.filter(function(м) { return м.round === 'QF'; });
        const занятоЧФ = чф.reduce(function(н, м) {
            return н + (м.player1_id ? 1 : 0) + (м.player2_id ? 1 : 0);
        }, 0);
        проверка('победители первого круга ушли в четвертьфинал без нашей помощи',
            занятоЧФ === 8, 'занято клеток ' + занятоЧФ + ' из 8');

        шаг('Смена победителя задним числом — та самая дыра');
        const составДо = {};
        послеR1.filter(function(м) { return м.group_number; }).forEach(function(м) {
            составДо[м.id] = м.player1_id + '|' + м.player2_id;
        });
        const правимый = R1после.find(function(м) { return м.player1_id && м.player2_id; });
        const новыйПобедитель = правимый.player2_id;
        const токен = await токенАдмина();
        const правка = await fetch(URL + '/rest/v1/rpc/fic_%D0%BF%D1%80%D0%B0%D0%B2%D0%BA%D0%B0', {
            method: 'POST',
            headers: { apikey: KEY, Authorization: 'Bearer ' + токен, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_матч: правимый.id, p_победитель: новыйПобедитель, p_счёт: '4/6 4/6' })
        });
        проверка('правка результата прошла через базу', правка.ok,
            правка.ok ? '' : 'ответ ' + правка.status + ' ' + (await правка.text()).slice(0, 120));
        const послеПравки = await читать('matches?select=id,group_number,player1_id,player2_id,round,winner_id&tournament_id=eq.' + ТУРНИР);
        let поехало = 0;
        послеПравки.filter(function(м) { return м.group_number; }).forEach(function(м) {
            if (составДо[м.id] !== м.player1_id + '|' + м.player2_id) поехало++;
        });
        проверка('групповые матчи не тронуты', поехало === 0,
            поехало ? 'изменилось матчей ' + поехало : 'все 42 на месте');

        шаг('До финала');
        // Круг за кругом: каждый раз перечитываем базу — клетки следующего
        // круга заполняет она сама, и играть надо по тому, что там встало
        for (const круг of ['QF', 'SF', 'F', '3RD']) {
            const текущие = await читать('matches?select=id,round,player1_id,player2_id,status&tournament_id=eq.' + ТУРНИР + '&round=eq.' + круг);
            const готовы = текущие.filter(function(м) { return м.player1_id && м.player2_id && м.status !== 'completed'; });
            проверка('клетки круга ' + круг + ' заполнены', готовы.length === текущие.length,
                'готово ' + готовы.length + ' из ' + текущие.length);
            for (const м of готовы) {
                await править('matches?id=eq.' + м.id, {
                    score: '6/3 6/3', winner_id: м.player1_id, status: 'completed',
                    played_at: new Date().toISOString()
                });
            }
            await new Promise(function(r) { setTimeout(r, 1500); });
        }

        шаг('Завершение турнира');
        await открытьСетку(страница);
        const кнопкаЗавершить = страница.locator('#adBrkFinalize');
        проверка('кнопка завершения появилась', await кнопкаЗавершить.count() > 0);
        if (await кнопкаЗавершить.count()) {
            await кнопкаЗавершить.first().click();
            await подтвердить(страница);
            await страница.waitForTimeout(9000);
            // Что сказала админка: без этого «не закрылся» ничего не объясняет
            const тост = страница.locator('.ad-toast, .ad-notice-text, .ad-confirm-text');
            if (await тост.count()) {
                const слова = (await тост.allTextContents()).join(' | ').slice(0, 200);
                if (слова.trim()) console.log('     админка сказала: ' + слова);
            }
            await страница.screenshot({
                path: '/Users/bossyko/Documents/Screen/Claude/tsikl-zavershenie.png'
            });
        }

        // Пересчёт очков идёт на два десятка человек и не быстрый: ждём,
        // пока админка допишет статус
        let турнирПосле = [];
        for (let ждём = 0; ждём < 30; ждём++) {
            турнирПосле = await читать('tournaments?select=id,status&id=eq.' + ТУРНИР);
            if ((турнирПосле[0] || {}).status === 'completed') break;
            await new Promise(function(r) { setTimeout(r, 3000); });
        }
        проверка('турнир закрыт', (турнирПосле[0] || {}).status === 'completed',
            'состояние ' + (турнирПосле[0] || {}).status);

        const итоги = await читать('tournament_results?select=player_id,points_earned,round_reached&tournament_id=eq.' + ТУРНИР);
        проверка('итоги записаны', итоги.length > 0, 'строк ' + итоги.length);
        const первый = итоги.find(function(и) { return и.round_reached === 'W'; });
        const второй = итоги.find(function(и) { return и.round_reached === 'F'; });
        проверка('есть победитель и финалист', !!первый && !!второй,
            первый ? 'победитель ' + первый.player_id + ' (' + первый.points_earned + ' очков), финалист ' +
                (второй || {}).player_id + ' (' + (второй || {}).points_earned + ')' : '');
        // Очки за место платит таблица Положения — её в тестовой базе нет
        // (таблица points_by_place не заведена). Пока её нет, сравнивать
        // суммы бессмысленно: начисление уходит в запасное правило
        const естьТаблицаМест = await fetch(URL + '/rest/v1/points_by_place?select=place&limit=1', {
            headers: { apikey: SECRET, Authorization: 'Bearer ' + SECRET }
        }).then(function(о) { return о.ok; });
        if (естьТаблицаМест) {
            проверка('очки за победу больше, чем за финал',
                первый && второй && Number(первый.points_earned) > Number(второй.points_earned));
        } else {
            console.log('   ○ очки по местам не проверены — в тестовой базе нет таблицы points_by_place');
            отчёт.push({ тип: 'проверка', что: 'очки по местам', ок: null,
                подробность: 'не проверено: нет таблицы points_by_place' });
        }

        const очки = await читать('rating_history?select=player_id,points_earned,tournament_id&tournament_id=eq.' + ТУРНИР);
        проверка('очки записаны в историю рейтинга', очки.length > 0, 'строк ' + очки.length);

        const наконец = await читать('matches?select=id,group_number,round,player1_id,player2_id,status&tournament_id=eq.' + ТУРНИР);
        проверка('после всего групповых матчей всё те же 42',
            наконец.filter(function(м) { return м.group_number; }).length === 42);
        проверка('всего матчей всё те же 60', наконец.length === 60, 'стало ' + наконец.length);

        console.log('\n' + '─'.repeat(60));
        console.log(провалов ? 'ПРОВАЛОВ: ' + провалов : 'Все проверки пройдены');
        fs.writeFileSync(path.join(__dirname, 'reports', 'turnir-tsikl.json'),
            JSON.stringify({ отчёт, провалов }, null, 2));
    } catch (беда) {
        console.error('\nПрогон оборвался: ' + беда.message);
        провалов++;
    } finally {
        if (браузер) await браузер.close();
        if (сервер) сервер.kill();
        process.exit(провалов ? 1 : 0);
    }
})();
