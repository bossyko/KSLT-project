/**
 * ОДИН ПРОГОН — И ВСЕ ЧИСЛА СРАЗУ, ПИСЬМОМ В ФАЙЛ.
 *
 * Три проверки 48-й и 50-й падают с «меток нет» и «таблиц группы нет».
 * Причина может быть в данных (групповых матчей в базе нет) или в отрисовке
 * (данные есть, а на экран не попали). Отличить можно только прочитав базу
 * и экран ОДНОВРЕМЕННО, в одном прогоне: из моей оболочки базы не видно —
 * DNS там нет.
 *
 * Эта проба ничего не проверяет и упасть не может. Она читает и складывает
 * числа в tests/reports/diagnostika-metka.json, чтобы их можно было
 * разобрать, а не пересказывать.
 *
 * Только читает. В базу не пишет.
 *
 *     npx playwright test --config=playwright.bez-bazy.config.js \
 *       tests/e2e/diagnostika/sev-metki.spec.js --project=desktop
 */
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

const ТУРНИР = 'test-metka';

test('числа по метке группы — в файл', async ({ page }, testInfo) => {
    /* ОДИН ВИД, А НЕ ПЯТЬ: числа тут про данные, а не про ширину окна.
       Пять прогонов писали бы один и тот же файл друг поверх друга. */
    test.skip(testInfo.project.name !== 'desktop', 'диагностика данных от вида не зависит');

    const отчёт = { турнир: ТУРНИР, когда: new Date().toISOString() };

    /* 1. ЧТО В БАЗЕ. Клиент базы живёт на странице, и обвязка подставила
          ему адрес ТЕСТОВОГО проекта — значит читаем через него. */
    await page.goto('/pages/tournament.html?id=' + ТУРНИР + '&tab=bracket');
    await page.waitForFunction(() => !!window.supabaseClient, null, { timeout: 20000 })
        .catch(() => null);

    отчёт.база = await page.evaluate(async (ид) => {
        if (!window.supabaseClient) return { беда: 'клиента базы на странице нет' };
        const т = await window.supabaseClient.from('tournaments')
            .select('id,title,status,bracket_type,group_count,qualifiers_per_group,manual_group_places')
            .eq('id', ид);
        if (т.error) return { беда: 'tournaments: ' + т.error.message };
        if (!т.data || !т.data.length) return { беда: 'турнира в базе нет' };
        const м = await window.supabaseClient.from('matches')
            .select('id,group_number,round,round_number,status,winner_id,player1_id,player2_id')
            .eq('tournament_id', ид);
        if (м.error) return { турнир: т.data[0], беда: 'matches: ' + м.error.message };
        const все = м.data || [];
        const гр = все.filter(x => x.group_number > 0);
        const поГруппам = {};
        гр.forEach(x => { поГруппам[x.group_number] = (поГруппам[x.group_number] || 0) + 1; });
        return {
            турнир: т.data[0],
            матчейВсего: все.length,
            групповых: гр.length,
            сыграноГрупповых: гр.filter(x => x.status === 'completed').length,
            сеточных: все.filter(x => !x.group_number).length,
            поГруппам: поГруппам,
            сетка: все.filter(x => !x.group_number).map(x => ({
                круг: x.round, номер: x.round_number, состояние: x.status,
                есть1: !!x.player1_id, есть2: !!x.player2_id
            }))
        };
    }, ТУРНИР);

    /* 2. ЧТО НА ПУБЛИЧНОМ ЭКРАНЕ. */
    await page.waitForFunction(
        () => document.querySelectorAll('.td-match-player').length > 0,
        null, { timeout: 20000 }).catch(() => null);

    отчёт.сайт = await page.evaluate(() => ({
        клетокИгрока: document.querySelectorAll('.td-match-player').length,
        плашекМетки: document.querySelectorAll('.td-grp-label').length,
        таблицГруппы: document.querySelectorAll('.td-group-table').length,
        сетокГрупп: document.querySelectorAll('.td-groups-grid').length,
        модульГрупп: !!(window.KSLT_GROUPS && window.KSLT_GROUPS.меткиИгроков),
        модульПравил: !!(window.KSLT_RULES && window.KSLT_RULES.букваГруппы),
        метки: [...document.querySelectorAll('.td-match-player')].map(р => ({
            имя: (р.querySelector('.td-player-name') || {}).textContent &&
                 р.querySelector('.td-player-name').textContent.trim(),
            метка: (р.querySelector('.td-grp-label') || {}).textContent || null
        })),
        первыеСтрокиСетки: document.getElementById('bracketContainer')
            ? document.getElementById('bracketContainer').innerHTML.slice(0, 400) : null
    }));

    /* 3. ЧТО НА АДМИНСКОМ ЭКРАНЕ. Файл этого экрана я не трогал — если и
          там пусто, беда общая, а не в моей правке. */
    await page.goto('/pages/admin.html#tournaments/bracket/' + ТУРНИР);
    await page.waitForSelector('.ad-brk-grp-label', { timeout: 20000 }).catch(() => null);

    отчёт.админка = await page.evaluate(() => ({
        строкИгрока: document.querySelectorAll('.ad-brk-player').length,
        плашекМетки: document.querySelectorAll('.ad-brk-grp-label').length,
        плашекСТекстом: [...document.querySelectorAll('.ad-brk-grp-label')]
            .filter(э => э.textContent.trim()).length,
        блоковГруппы: document.querySelectorAll('.ad-grp-block').length,
        метки: [...document.querySelectorAll('.ad-brk-player')].map(р => ({
            имя: (р.querySelector('.ad-brk-name') || {}).textContent &&
                 р.querySelector('.ad-brk-name').textContent.trim(),
            метка: ((р.querySelector('.ad-brk-grp-label') || {}).textContent || '').trim() || null
        }))
    }));

    const куда = path.join(__dirname, '..', '..', 'reports', 'diagnostika-metka.json');
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.writeFileSync(куда, JSON.stringify(отчёт, null, 2), 'utf8');
    console.log('числа сложены в tests/reports/diagnostika-metka.json');
});

/* ПОЧЕМУ СТРАНИЦА ВИДИТ ОДИН МАТЧ, А СЕВ — СЕМЬ.
   Сев читает базу СЛУЖЕБНЫМ ключом и печатает «матчей в группах 6, в сетке
   1». Страница читает ПУБЛИЧНЫМ и видит только финал. Разница между ключами
   — это правила доступа. Снимаем обе картины рядом: гостем и под админом. */
const анонПроба = require('../../fixtures').test;

анонПроба.describe('чей ключ что видит', () => {

    async function снять(page) {
        await page.goto('/pages/tournament.html?id=' + ТУРНИР + '&tab=bracket');
        await page.waitForFunction(() => !!window.supabaseClient, null, { timeout: 20000 })
            .catch(() => null);
        return await page.evaluate(async (ид) => {
            const c = window.supabaseClient;
            if (!c) return { беда: 'клиента базы нет' };
            const кто = await c.auth.getUser().catch(() => null);
            const свои = await c.from('matches')
                .select('id,group_number,status').eq('tournament_id', ид);
            const завершённые = await c.from('matches')
                .select('id,tournament_id,status').eq('status', 'completed').limit(5);
            const групповые = await c.from('matches')
                .select('id,tournament_id,group_number,round,status,played_at')
                .gt('group_number', 0).limit(5);
            /* ЧИТАЕМ ПО ИМЕНАМ СТРОК, А НЕ ПО ТУРНИРУ. Сев кладёт шесть
               групповых с известными id — если по id их тоже не видно,
               строка скрыта; если видно, значит режет не строка, а запрос. */
            const поИд = await c.from('matches')
                .select('id,tournament_id,group_number,round,status')
                .in('id', [
                    'dd000001-0000-4000-8000-000000000001',
                    'dd000001-0000-4000-8000-000000000002',
                    'dd000001-0000-4000-8000-000000000003',
                    'dd000001-0000-4000-8000-000000000004',
                    'dd000001-0000-4000-8000-000000000005',
                    'dd000001-0000-4000-8000-000000000006',
                    'dd000001-0000-4000-8000-000000000007'
                ]);
            return {
                адресКлиента: (window.KSLT_DB && window.KSLT_DB.url) || null,
                адресВнутри: (c && c.supabaseUrl) || null,
                поИдСколько: (поИд.data || []).length,
                поИдОшибка: поИд.error ? поИд.error.message : null,
                поИдСтроки: (поИд.data || []).map(x => ({
                    хвост: String(x.id).slice(-2), т: x.tournament_id,
                    г: x.group_number, к: x.round, с: x.status })),
                видимыеГрупповые: (групповые.data || []).map(x => ({
                    т: x.tournament_id, г: x.group_number, к: x.round,
                    с: x.status, когда: !!x.played_at })),
                вошёл: !!(кто && кто.data && кто.data.user),
                почта: (кто && кто.data && кто.data.user) ? кто.data.user.email : null,
                своиСколько: (свои.data || []).length,
                своиОшибка: свои.error ? свои.error.message : null,
                своиСтроки: (свои.data || []).map(x => ({ г: x.group_number, с: x.status })),
                завершённыхВидно: (завершённые.data || []).length,
                завершённыхОшибка: завершённые.error ? завершённые.error.message : null,
                групповыхВидно: (групповые.data || []).length,
                групповыхОшибка: групповые.error ? групповые.error.message : null
            };
        }, ТУРНИР);
    }

    анонПроба('гостем', async ({ page }) => {
        const д = await снять(page);
        const куда = path.join(__dirname, '..', '..', 'reports', 'diagnostika-klyuch-gost.json');
        fs.writeFileSync(куда, JSON.stringify(д, null, 2), 'utf8');
    });

    анонПроба.describe('под админом', () => {
        анонПроба.use({ storageState: 'tests/.auth/admin.json' });
        анонПроба('админом', async ({ page }) => {
            const д = await снять(page);
            const куда = path.join(__dirname, '..', '..', 'reports', 'diagnostika-klyuch-admin.json');
            fs.writeFileSync(куда, JSON.stringify(д, null, 2), 'utf8');
        });
    });
});
