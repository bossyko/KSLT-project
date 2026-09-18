/**
 * Сквозной прогон парного турнира: микст, 20 пар, шесть групп.
 *
 * Парный отличается от одиночного не дорогой, а составом: в заявке двое,
 * место в сетке принадлежит заявке, напарник меняется отдельно от капитана,
 * а гость может прийти и с карточкой, и без неё. Всё это здесь и проходим —
 * от подачи заявок до начисления очков.
 *
 * Дорога общая и живёт в tsikl-obshchee.js. Ходит только в тестовую базу.
 *
 * Запуск:  node tests/turnir-tsikl-parnyy.js
 */

const { chromium } = require('@playwright/test');
const О = require('./tsikl-obshchee');

const ТУРНИР = 'tsikl-parnyy';
const ПРЕФИКС = 'tspar-';
const ПАР = 20;
const ГРУПП = 6;

const мужчина = (н) => ПРЕФИКС + 'm' + String(н).padStart(2, '0');
const женщина = (н) => ПРЕФИКС + 'w' + String(н).padStart(2, '0');
const имяМ = (н) => 'Парный Игрок ' + String(н).padStart(2, '0');
const имяЖ = (н) => 'Парная Игрокиня ' + String(н).padStart(2, '0');

async function убратьПрошлыйПрогон() {
    await О.сносить('matches?tournament_id=eq.' + ТУРНИР);
    await О.сносить('tournament_results?tournament_id=eq.' + ТУРНИР);
    await О.сносить('rating_history?tournament_id=eq.' + ТУРНИР);
    await О.сносить('tournament_registrations?tournament_id=eq.' + ТУРНИР);
    await О.сносить('tournaments?id=eq.' + ТУРНИР);
    await О.сносить('players?id=like.' + ПРЕФИКС + '*');
}

async function завестиДанные() {
    const категории = await О.читать('categories?select=id&limit=20');
    if (!(категории || []).some(function(к) { return к.id === 'futures'; })) {
        await О.писать('categories', [{ id: 'futures', name: 'FUTURES' }]);
    }

    const карточки = [];
    for (let н = 1; н <= ПАР + 2; н++) {
        карточки.push({ id: мужчина(н), name: имяМ(н), gender: 'men', country: '🇰🇬',
            category_id: 'futures', is_member: true, is_guest: false, has_account: false,
            points: 900 - н * 5 });
        карточки.push({ id: женщина(н), name: имяЖ(н), gender: 'women', country: '🇰🇬',
            category_id: 'futures', is_member: true, is_guest: false, has_account: false,
            points: 880 - н * 5 });
    }
    // Гостья с карточкой: в клубе не состоит, но показать её есть где
    карточки.push({ id: ПРЕФИКС + 'gost', name: 'Парная Гостья С Карточкой', gender: 'women',
        country: '🇰🇬', category_id: 'futures', is_member: false, is_guest: true,
        has_account: false, points: 0 });
    // Карточка для той, что подаётся одним именем: понадобится на лечении
    карточки.push({ id: ПРЕФИКС + 'gost2', name: 'Парная Гостья Без Карточки', gender: 'women',
        country: '🇰🇬', category_id: 'futures', is_member: false, is_guest: true,
        has_account: false, points: 0 });
    await О.писать('players', карточки);

    await О.писать('tournaments', [{
        id: ТУРНИР,
        title: 'Прогон: микст FUTURES',
        date_start: '2026-10-05',
        category_id: 'futures',
        format: 'mixed_doubles',
        bracket_type: 'round_robin',
        group_count: ГРУПП,
        qualifiers_per_group: 2,
        status: 'registration_closed',
        gender: 'mixed',
        max_participants: ПАР,
        court_count: 4,
        match_duration: 90,
        start_time: '08:00'
    }]);

    const заявки = [];
    for (let н = 1; н <= ПАР; н++) {
        // Ключи у всех строк одни и те же: PostgREST не берёт пачку, где
        // объекты разной формы
        const заявка = {
            id: crypto.randomUUID(),
            tournament_id: ТУРНИР,
            status: 'approved',
            gender_confirmed: true,
            registered_at: new Date(Date.UTC(2026, 9, 1, 6, н)).toISOString(),
            player_id: мужчина(н),
            partner_id: женщина(н),
            is_external: false,
            external_name: null,
            external_gender: null,
            partner_external_name: null,
            partner_gender: null
        };
        if (н === ПАР - 1) {
            // Гостья без карточки подаёт заявку: имя строкой, как заводит
            // менеджер кнопкой «Добавить гостя»
            заявка.player_id = null;
            заявка.is_external = true;
            заявка.external_name = 'Парная Гостья Без Карточки';
            заявка.external_gender = 'women';
            заявка.partner_id = мужчина(н);
        } else if (н === ПАР) {
            // Гостья с карточкой — напарница
            заявка.partner_id = ПРЕФИКС + 'gost';
        } else if (н === ПАР - 2) {
            // Напарница без карточки, одним именем в заявке
            заявка.partner_id = null;
            заявка.partner_external_name = 'Парная Внешняя Напарница';
            заявка.partner_gender = 'women';
        }
        заявки.push(заявка);
    }
    await О.писать('tournament_registrations', заявки);
    return заявки;
}

(async function () {
    let сервер = null;
    let браузер = null;
    try {
        О.шаг('Подготовка: 20 пар, среди них гости');
        await убратьПрошлыйПрогон();
        const заявки = await завестиДанные();
        О.проверка('заведено ' + ПАР + ' заявок', заявки.length === ПАР, 'заявок ' + заявки.length);
        const сГостями = await О.читать('tournament_registrations?select=id,player_id,partner_id,external_name,partner_external_name&tournament_id=eq.' + ТУРНИР);
        О.проверка('пара с гостьей без карточки заведена',
            сГостями.some(function(з) { return !з.player_id && з.external_name; }));
        О.проверка('пара с напарницей без карточки заведена',
            сГостями.some(function(з) { return з.partner_external_name; }));
        О.проверка('пара с гостьей, у которой карточка есть, заведена',
            сГостями.some(function(з) { return з.partner_id === ПРЕФИКС + 'gost'; }));

        сервер = await О.поднятьСервер();
        браузер = await chromium.launch({ headless: true });
        const { страница } = await О.открытьАдминку(браузер);

        О.шаг('Гость заводится через админку');
        // Не строкой в заявке, а карточкой: иначе его сторона в матчах
        // пустая и пара пропадает с экранов
        await О.открытьСетку(страница, ТУРНИР);
        const вкладкаЗаявок = страница.locator('[data-trn-nav="regs"]');
        if (await вкладкаЗаявок.count()) { await вкладкаЗаявок.first().click(); await страница.waitForTimeout(1200); }
        const кнопкаГостя = страница.locator('#adBrkAddExternal');
        О.проверка('кнопка «добавить гостя» на месте', await кнопкаГостя.count() > 0);
        if (await кнопкаГостя.count()) {
            await кнопкаГостя.first().click();
            await страница.locator('#adExtName').waitFor({ state: 'visible', timeout: 10000 });
            await страница.fill('#adExtName', 'Прогонный Гость Новый');
            await страница.fill('#adExtNtrp', '3.5');
            await страница.selectOption('#adExtGender', 'men');
            await страница.fill('#adExtPartnerName', 'Прогонная Гостья Новая');
            await страница.fill('#adExtPartnerNtrp', '3');
            await страница.selectOption('#adExtPartnerGender', 'women');
            await О.подтвердить(страница);
            await страница.waitForTimeout(3500);
        }
        // Ищем по имени, а не по времени подачи: у заявок прогона даты
        // выставлены вперёд, и «последняя» была бы не та
        const карточкаНового = (await О.читать('players?select=id,name,is_guest,gender&name=eq.' +
            encodeURIComponent('Прогонный Гость Новый')))[0] || {};
        const заявкаГостя = (карточкаНового.id
            ? await О.читать('tournament_registrations?select=id,player_id,partner_id,external_name,partner_external_name,status&tournament_id=eq.' + ТУРНИР + '&player_id=eq.' + карточкаНового.id)
            : [])[0] || {};
        О.проверка('у заведённого гостя есть карточка, а не имя строкой',
            !!заявкаГостя.player_id && !заявкаГостя.external_name,
            'карточка ' + заявкаГостя.player_id + ', имя строкой: ' + заявкаГостя.external_name);
        О.проверка('у его напарницы тоже карточка',
            !!заявкаГостя.partner_id && !заявкаГостя.partner_external_name,
            'карточка ' + заявкаГостя.partner_id);
        const карточкиГостей = await О.читать('players?select=id,name,is_guest,gender&id=in.(' +
            [заявкаГостя.player_id, заявкаГостя.partner_id].filter(Boolean).join(',') + ')');
        О.проверка('карточки помечены гостевыми',
            карточкиГостей.length === 2 && карточкиГостей.every(function(к) { return к.is_guest; }),
            карточкиГостей.map(function(к) { return к.id + ' (' + к.gender + ')'; }).join(', '));

        // Тот же гость второй раз — карточка должна найтись, а не завестись заново
        if (await кнопкаГостя.count()) {
            await О.закрытьОкна(страница);
            await О.открытьСетку(страница, ТУРНИР);
            if (await вкладкаЗаявок.count()) { await вкладкаЗаявок.first().click(); await страница.waitForTimeout(1200); }
            await страница.locator('#adBrkAddExternal').first().click();
            await страница.locator('#adExtName').waitFor({ state: 'visible', timeout: 10000 });
            await страница.fill('#adExtName', 'Прогонный Гость Новый');
            await страница.fill('#adExtNtrp', '3.5');
            await страница.selectOption('#adExtGender', 'men');
            await О.подтвердить(страница);
            await страница.waitForTimeout(3000);
        }
        const двойники = await О.читать('players?select=id,name&name=eq.' + encodeURIComponent('Прогонный Гость Новый'));
        О.проверка('второй раз карточка не заводится', двойники.length === 1,
            'карточек с этим именем: ' + двойники.length);
        // Лишние заявки убираем, чтобы состав остался прежним
        await О.сносить('tournament_registrations?tournament_id=eq.' + ТУРНИР + '&player_id=in.(' +
            [заявкаГостя.player_id].filter(Boolean).join(',') + ')');

        await О.закрытьОкна(страница);

        О.шаг('Состав микста: напарница меняется на мужчину');
        const параДляПола = заявки[0];
        await О.заменитьЧерезАдминку(страница, ТУРНИР, параДляПола.id,
            мужчина(ПАР + 1), имяМ(ПАР + 1), 'partner');
        const послеПола = await О.читать('tournament_registrations?select=id,partner_id,gender_confirmed&id=eq.' + параДляПола.id);
        const отметкаПоставлена = (послеПола[0] || {}).gender_confirmed === false;
        if (отметкаПоставлена) О.проверка('пара из двух мужчин помечена как ждущая решения', true,
            'напарник теперь ' + (послеПола[0] || {}).partner_id);
        else О.находка('замена напарника не проверяет пол в миксте',
            'напарник теперь ' + (послеПола[0] || {}).partner_id + ' — мужчина, а отметка состава осталась ' +
            (послеПола[0] || {}).gender_confirmed + '. Карточку нового берут из списка участников турнира, ' +
            'а его там нет: пол выходит неизвестным, и правило микста молчит');

        О.шаг('Жеребьёвка при несошедшемся составе');
        // Отметку ставим сами: выше видно, что сама админка её при замене не
        // выставляет. Проверяем здесь другое — встаёт ли жеребьёвка, когда
        // отметка есть
        await О.править('tournament_registrations?id=eq.' + параДляПола.id, { gender_confirmed: false });
        await О.открытьСетку(страница, ТУРНИР);
        const кнопкаЖеребьёвки = страница.locator('#adBrkGenerateDraw');
        if (await кнопкаЖеребьёвки.count()) {
            await кнопкаЖеребьёвки.first().click();
            await О.подтвердить(страница);
            await страница.waitForTimeout(4000);
        }
        const матчиПослеПопытки = await О.читать('matches?select=id&tournament_id=eq.' + ТУРНИР);
        О.проверка('жеребьёвка остановлена, сетки нет', матчиПослеПопытки.length === 0,
            'матчей ' + матчиПослеПопытки.length + '; админка: ' + (await О.чтоСказала(страница)));

        О.шаг('Состав поправлен — жеребьёвка идёт');
        await О.заменитьЧерезАдминку(страница, ТУРНИР, параДляПола.id,
            женщина(1), имяЖ(1), 'partner');
        await О.править('tournament_registrations?id=eq.' + параДляПола.id, { gender_confirmed: true });
        const сноваЖенщина = await О.читать('tournament_registrations?select=partner_id,gender_confirmed&id=eq.' + параДляПола.id);
        О.проверка('состав снова сошёлся',
            (сноваЖенщина[0] || {}).gender_confirmed === true &&
            (сноваЖенщина[0] || {}).partner_id === женщина(1));

        async function жеребить() {
            await О.закрытьОкна(страница);
            await О.открытьСетку(страница, ТУРНИР);
            const кнопка = страница.locator('#adBrkGenerateDraw');
            if (!await кнопка.count()) return false;
            страница.сообщения.length = 0;
            await кнопка.first().click();
            await О.подтвердить(страница);
            await страница.waitForTimeout(7000);
            return true;
        }

        /** Та самая правка, которой лечили боевой микст: карточка в заявку и в матчи. */
        async function вылечитьГостью(идЗаявки) {
            await О.править('tournament_registrations?id=eq.' + идЗаявки, {
                player_id: ПРЕФИКС + 'gost2', is_external: false, external_name: null
            });
            await О.править('matches?tournament_id=eq.' + ТУРНИР + '&reg1_id=eq.' + идЗаявки +
                '&player1_id=is.null', { player1_id: ПРЕФИКС + 'gost2' });
            await О.править('matches?tournament_id=eq.' + ТУРНИР + '&reg2_id=eq.' + идЗаявки +
                '&player2_id=is.null', { player2_id: ПРЕФИКС + 'gost2' });
        }

        О.проверка('кнопка жеребьёвки на месте', await жеребить());

        let матчи = await О.читать('matches?select=id,round,group_number,match_order,player1_id,player2_id,reg1_id,reg2_id,slot1_label,slot2_label,status&tournament_id=eq.' + ТУРНИР);
        if (!матчи.length) {
            // Сторож считает участников группы по игрокам в матчах. Пара без
            // карточки туда не попадает, её группа кажется меньше на одного,
            // и жеребьёвка отменяется целиком — с жалобой на неровные группы,
            // хотя по заявкам всё ровно
            const жалоба = (страница.сообщения || []).filter(function(т) {
                return т.indexOf('жеребьёвка остановлена') !== -1 || т.indexOf('Жеребьёвка отменена') !== -1;
            }).slice(-1)[0] || (await О.чтоСказала(страница));
            О.находка('пара без карточки срывает жеребьёвку целиком', жалоба.slice(0, 180));

            const бк = (await О.читать('tournament_registrations?select=id&tournament_id=eq.' + ТУРНИР + '&player_id=is.null'))[0];
            await вылечитьГостью(бк.id);
            await жеребить();
            матчи = await О.читать('matches?select=id,round,group_number,match_order,player1_id,player2_id,reg1_id,reg2_id,slot1_label,slot2_label,status&tournament_id=eq.' + ТУРНИР);
        }
        const групповых = матчи.filter(function(м) { return м.group_number; });
        О.проверка('сетка собрана', матчи.length > 0,
            'всего матчей ' + матчи.length + ', групповых ' + групповых.length +
            (матчи.length ? '' : '; админка: ' + (await О.чтоСказала(страница))));
        if (!матчи.length) throw new Error('Жеребьёвка не собрала сетку — дальше идти незачем');

        // В парном считаем пары, а не людей: группа держит заявки
        const парыВГруппе = {};
        групповых.forEach(function(м) {
            парыВГруппе[м.group_number] = парыВГруппе[м.group_number] || new Set();
            if (м.reg1_id) парыВГруппе[м.group_number].add(м.reg1_id);
            if (м.reg2_id) парыВГруппе[м.group_number].add(м.reg2_id);
        });
        const размеры = Object.keys(парыВГруппе).sort(function(a, b) { return a - b; })
            .map(function(г) { return парыВГруппе[г].size; });
        О.проверка('шесть групп, 20 пар', размеры.length === ГРУПП &&
            размеры.reduce(function(с, р) { return с + р; }, 0) === ПАР, 'размеры: ' + размеры.join(', '));
        О.проверка('группы ровные, разница не больше одной пары',
            Math.max.apply(null, размеры) - Math.min.apply(null, размеры) <= 1);

        let круговВерно = true;
        Object.keys(парыВГруппе).forEach(function(г) {
            const пар = парыВГруппе[г].size;
            const надо = пар * (пар - 1) / 2;
            const есть = групповых.filter(function(м) { return String(м.group_number) === String(г); }).length;
            if (есть !== надо) круговВерно = false;
        });
        О.проверка('в каждой группе полный круг', круговВерно);

        const вДвух = {};
        групповых.forEach(function(м) {
            [м.reg1_id, м.reg2_id].forEach(function(з) {
                if (!з) return;
                вДвух[з] = вДвух[з] || new Set();
                вДвух[з].add(м.group_number);
            });
        });
        О.проверка('ни одна пара не стоит в двух группах',
            Object.keys(вДвух).every(function(з) { return вДвух[з].size === 1; }));

        const встречи = {};
        let дубли = 0;
        групповых.forEach(function(м) {
            if (!м.reg1_id || !м.reg2_id) return;
            const к = м.group_number + '|' + [м.reg1_id, м.reg2_id].sort().join('|');
            встречи[к] = (встречи[к] || 0) + 1;
            if (встречи[к] > 1) дубли++;
        });
        О.проверка('нет встреч, заведённых дважды', дубли === 0, дубли ? 'дублей ' + дубли : '');

        О.шаг('Гости в сетке');
        const заявкиТеперь = await О.читать('tournament_registrations?select=id,player_id,partner_id,external_name,partner_external_name,group_number&tournament_id=eq.' + ТУРНИР);
        // Заявка гостьи: до лечения у неё нет карточки, после — стоит наша
        const безКарточки = заявкиТеперь.find(function(з) {
            return (!з.player_id && з.external_name) || з.player_id === ПРЕФИКС + 'gost2';
        });
        const ужеВылечена = !!(безКарточки && безКарточки.player_id);
        const сВнешнейНапарницей = заявкиТеперь.find(function(з) { return з.partner_external_name; });
        const сГостьейКарточкой = заявкиТеперь.find(function(з) { return з.partner_id === ПРЕФИКС + 'gost'; });

        О.проверка('пара с гостьей, у которой есть карточка, попала в группу',
            !!(сГостьейКарточкой && сГостьейКарточкой.group_number),
            'группа ' + (сГостьейКарточкой || {}).group_number);
        О.проверка('пара с внешней напарницей попала в группу и видна',
            !!(сВнешнейНапарницей && сВнешнейНапарницей.group_number) &&
            групповых.some(function(м) {
                return (м.reg1_id === сВнешнейНапарницей.id && м.player1_id) ||
                       (м.reg2_id === сВнешнейНапарницей.id && м.player2_id);
            }), 'капитан с карточкой — сторона матча заполнена');

        const матчиГостьи = групповых.filter(function(м) {
            return безКарточки && (м.reg1_id === безКарточки.id || м.reg2_id === безКарточки.id);
        });
        if (!ужеВылечена) {
            const пустыхСторон = матчиГостьи.filter(function(м) {
                return м.reg1_id === безКарточки.id ? !м.player1_id : !м.player2_id;
            }).length;
            О.находка('пара без карточки не видна в группе',
                'матчей у пары ' + матчиГостьи.length + ', пустых сторон ' + пустыхСторон +
                ' — пока карточки нет, пара не показывается и её встречи нельзя сыграть');
        }

        О.шаг('Лечение: гостье подставляют карточку');
        // Ровно то, чем правили боевой микст: карточка в заявку и в матчи,
        // по ссылке на заявку. Жеребьёвка при этом не пересобирается
        if (!ужеВылечена) await вылечитьГостью(безКарточки.id);
        const послеЛечения = (await О.читать('matches?select=id,group_number,player1_id,player2_id,reg1_id,reg2_id&tournament_id=eq.' + ТУРНИР + '&group_number=not.is.null'));
        const пустыеПосле = послеЛечения.filter(function(м) { return !м.player1_id || !м.player2_id; }).length;
        О.проверка('после карточки пустых сторон не осталось', пустыеПосле === 0,
            'пустых сторон ' + пустыеПосле);
        const группаГостьи = послеЛечения.filter(function(м) {
            return м.reg1_id === безКарточки.id || м.reg2_id === безКарточки.id;
        });
        О.проверка('пара гостьи стоит в своих трёх встречах', группаГостьи.length === 3,
            'встреч ' + группаГостьи.length);

        О.шаг('Замены после жеребьёвки');
        const параСКапитаном = заявкиТеперь.find(function(з) {
            return з.player_id && з.partner_id && з.partner_id !== ПРЕФИКС + 'gost';
        });
        const прежнийКапитан = параСКапитаном.player_id;
        await О.заменитьЧерезАдминку(страница, ТУРНИР, параСКапитаном.id,
            мужчина(ПАР + 2), имяМ(ПАР + 2), 'player');
        const послеКапитана = await О.читать('matches?select=id,group_number,player1_id,player2_id,reg1_id,reg2_id&tournament_id=eq.' + ТУРНИР);
        const матчиПары = послеКапитана.filter(function(м) {
            return м.reg1_id === параСКапитаном.id || м.reg2_id === параСКапитаном.id;
        });
        const капитанСменился = матчиПары.every(function(м) {
            const свой = м.reg1_id === параСКапитаном.id ? м.player1_id : м.player2_id;
            return свой === мужчина(ПАР + 2);
        });
        О.проверка('замена капитана разошлась по всем матчам пары',
            матчиПары.length > 0 && капитанСменился,
            'матчей пары ' + матчиПары.length + ', был ' + прежнийКапитан);
        О.проверка('прежний капитан нигде не остался',
            !послеКапитана.some(function(м) {
                return м.player1_id === прежнийКапитан || м.player2_id === прежнийКапитан;
            }));

        const параСНапарницей = заявкиТеперь.find(function(з) {
            return з.id !== параСКапитаном.id && з.player_id && з.partner_id && з.partner_id !== ПРЕФИКС + 'gost';
        });
        await О.заменитьЧерезАдминку(страница, ТУРНИР, параСНапарницей.id,
            женщина(ПАР + 1), имяЖ(ПАР + 1), 'partner');
        const послеНапарницы = await О.читать('tournament_registrations?select=id,player_id,partner_id&id=eq.' + параСНапарницей.id);
        О.проверка('напарница сменилась в заявке',
            (послеНапарницы[0] || {}).partner_id === женщина(ПАР + 1));
        const матчиПары2 = (await О.читать('matches?select=id,reg1_id,reg2_id,player1_id,player2_id&tournament_id=eq.' + ТУРНИР))
            .filter(function(м) { return м.reg1_id === параСНапарницей.id || м.reg2_id === параСНапарницей.id; });
        О.проверка('капитан пары в матчах не тронут',
            матчиПары2.every(function(м) {
                const свой = м.reg1_id === параСНапарницей.id ? м.player1_id : м.player2_id;
                return свой === параСНапарницей.player_id;
            }), 'место в сетке принадлежит заявке, а не напарнице');

        О.шаг('Счёт групповых матчей');
        const кСчёту = await О.читать('matches?select=id,group_number,player1_id,player2_id&tournament_id=eq.' + ТУРНИР + '&group_number=not.is.null');
        let пропущено = 0;
        for (const м of кСчёту) {
            if (!м.player1_id || !м.player2_id) { пропущено++; continue; }
            const победитель = м.player1_id < м.player2_id ? м.player1_id : м.player2_id;
            const счёт = победитель === м.player1_id ? '6/3 6/4' : '3/6 4/6';
            await О.править('matches?id=eq.' + м.id, {
                score: счёт, winner_id: победитель, status: 'completed',
                played_at: new Date().toISOString()
            });
        }
        О.проверка('счёт проставлен групповым матчам', кСчёту.length > 0,
            'матчей ' + кСчёту.length + (пропущено ? ', без счёта остались ' + пропущено +
            ' — это встречи пары без карточки' : ''));

        О.шаг('Что собралось после групп');
        await О.открытьСетку(страница, ТУРНИР);
        await страница.waitForTimeout(3000);
        await О.открытьСетку(страница, ТУРНИР);
        const послеГрупп = await О.читать('matches?select=id,round,round_number,group_number,match_order,player1_id,player2_id,reg1_id,reg2_id,slot1_label,slot2_label,status,score,winner_id&tournament_id=eq.' + ТУРНИР);
        О.проверка('групповых матчей столько же', послеГрупп.filter(function(м) { return м.group_number; }).length === групповых.length,
            'было ' + групповых.length + ', стало ' + послеГрупп.filter(function(м) { return м.group_number; }).length);

        const доп = послеГрупп.filter(function(м) { return м.round === 'IG'; });
        О.проверка('доп. матчи есть', доп.length > 0, 'доп. матчей ' + доп.length);
        const R1 = послеГрупп.filter(function(м) { return м.round === 'R1'; });
        const занято = R1.reduce(function(н, м) { return н + (м.player1_id ? 1 : 0) + (м.player2_id ? 1 : 0); }, 0);
        О.проверка('клетки первого круга заполняются', занято > 0, 'занято ' + занято + ' из 16');

        О.шаг('Отмена доп. матча');
        const отменяемый = доп[0];
        const метка = 'IG' + (отменяемый.match_order || 1);
        const ждавшая = послеГрупп.find(function(м) {
            return м.slot1_label === метка || м.slot2_label === метка;
        });
        await О.открытьСетку(страница, ТУРНИР);
        const кнопкаОтмены = страница.locator('[data-ig-cancel="' + отменяемый.id + '"]');
        О.проверка('кнопка отмены доп. матча на месте', await кнопкаОтмены.count() > 0);
        if (await кнопкаОтмены.count()) {
            await кнопкаОтмены.first().click();
            await О.подтвердить(страница);
            await страница.waitForTimeout(3000);
        }
        const послеОтмены = await О.читать('matches?select=id,status,slot1_label,slot2_label&tournament_id=eq.' + ТУРНИР);
        const отменённый = послеОтмены.find(function(м) { return м.id === отменяемый.id; });
        О.проверка('доп. матч помечен отменённым', отменённый && отменённый.status === 'cancelled');

        О.шаг('Второй доп. матч сыгран, проход закрывается');
        for (const м of доп.slice(1)) {
            if (!м.player1_id || !м.player2_id) continue;
            await О.править('matches?id=eq.' + м.id, {
                score: '6/2 6/2', winner_id: м.player1_id, status: 'completed',
                played_at: new Date().toISOString()
            });
        }
        let послеДоп = [];
        for (let подход = 0; подход < 6; подход++) {
            await О.открытьСетку(страница, ТУРНИР);
            await страница.waitForTimeout(2500);
            послеДоп = await О.читать('matches?select=id,round,round_number,match_order,player1_id,player2_id,slot1_label,slot2_label,status,score,winner_id&tournament_id=eq.' + ТУРНИР);
            const к = послеДоп.find(function(м) { return м.id === (ждавшая || {}).id; });
            if (к && к.status === 'completed') break;
        }
        const клетка = послеДоп.find(function(м) { return м.id === (ждавшая || {}).id; });
        const ктоОстался = клетка ? (клетка.player1_id || клетка.player2_id) : null;
        О.проверка('соперник отменённого прошёл без игры',
            клетка && клетка.status === 'completed' && клетка.score === 'BYE' &&
            клетка.winner_id === ктоОстался && !!ктоОстался,
            клетка ? 'счёт ' + клетка.score + ', состояние ' + клетка.status : '');

        О.шаг('Плей-офф до финала');
        for (const круг of ['R1', 'QF', 'SF', 'F', '3RD']) {
            const текущие = await О.читать('matches?select=id,round,player1_id,player2_id,status&tournament_id=eq.' + ТУРНИР + '&round=eq.' + круг);
            const готовы = текущие.filter(function(м) {
                return м.player1_id && м.player2_id && м.status !== 'completed';
            });
            О.проверка('клетки круга ' + круг + ' заполнены',
                готовы.length + текущие.filter(function(м) { return м.status === 'completed'; }).length === текущие.length,
                'готово ' + готовы.length + ', закрыто ранее ' +
                текущие.filter(function(м) { return м.status === 'completed'; }).length +
                ', всего ' + текущие.length);
            for (const м of готовы) {
                await О.править('matches?id=eq.' + м.id, {
                    score: '6/3 6/3', winner_id: м.player1_id, status: 'completed',
                    played_at: new Date().toISOString()
                });
            }
            await new Promise(function(r) { setTimeout(r, 1800); });
        }

        О.шаг('Завершение турнира');
        await О.открытьСетку(страница, ТУРНИР);
        const завершить = страница.locator('#adBrkFinalize');
        О.проверка('кнопка завершения появилась', await завершить.count() > 0);
        if (await завершить.count()) {
            await завершить.first().click();
            await О.подтвердить(страница);
            await страница.waitForTimeout(9000);
        }
        let турнирПосле = [];
        for (let ждём = 0; ждём < 30; ждём++) {
            турнирПосле = await О.читать('tournaments?select=id,status&id=eq.' + ТУРНИР);
            if ((турнирПосле[0] || {}).status === 'completed') break;
            await new Promise(function(r) { setTimeout(r, 3000); });
        }
        О.проверка('турнир закрыт', (турнирПосле[0] || {}).status === 'completed',
            'состояние ' + (турнирПосле[0] || {}).status + '; админка: ' + (await О.чтоСказала(страница)));

        const итоги = await О.читать('tournament_results?select=player_id,partner_id,points_earned,round_reached,is_doubles&tournament_id=eq.' + ТУРНИР);
        О.проверка('итоги записаны', итоги.length > 0, 'строк ' + итоги.length);
        О.проверка('очки достались обоим в паре',
            итоги.some(function(и) { return и.is_doubles; }) &&
            итоги.filter(function(и) { return и.round_reached === 'W'; }).length >= 2,
            'строк с победой ' + итоги.filter(function(и) { return и.round_reached === 'W'; }).length);

        // Парные очки считает функция базы recalc_pair_stats — в тестовой
        // базе её нет, и история рейтинга остаётся пустой. Это стенд, а не
        // поломка: в боевой функция на месте
        const естьПарныйПересчёт = await fetch(О.URL + '/rest/v1/rpc/recalc_pair_stats', {
            method: 'POST',
            headers: { apikey: О.SECRET, Authorization: 'Bearer ' + О.SECRET, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_ids: [] })
        }).then(function(о) { return о.status !== 404; });
        const история = await О.читать('rating_history?select=player_id,points_earned,is_doubles&tournament_id=eq.' + ТУРНИР);
        if (естьПарныйПересчёт) {
            О.проверка('очки ушли в историю рейтинга', история.length > 0, 'строк ' + история.length);
        } else {
            О.пропуск('очки в истории рейтинга', 'в тестовой базе нет функции recalc_pair_stats');
        }

        О.итог('turnir-tsikl-parnyy.json');
    } catch (беда) {
        console.error('\nПрогон оборвался: ' + беда.message);
        О.счёт.провалов++;
        О.итог('turnir-tsikl-parnyy.json');
    } finally {
        if (браузер) await браузер.close();
        if (сервер) сервер.kill();
        process.exit(О.счёт.провалов ? 1 : 0);
    }
})();
