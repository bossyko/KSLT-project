/**
 * ЗАМЕР: входит ли кнопка «Создать аккаунт» в экран после сокращения формы.
 *
 * ЗАЧЕМ. 21.09 решено убрать из регистрации NTRP, пароль и подтверждение
 * пароля. До того, как добавлять липкое действие внизу карточки, надо
 * проверить, нужно ли оно вообще: может быть, кнопка и так входит в сгиб.
 *
 * КАК. Поля не вычитаются арифметикой, а прячутся в живой странице —
 * раскладку считает браузер, а не я. Меряем до и после, на пяти видах и
 * трёх языках.
 *
 * Запуск: node tools/zamer-sgib-registracii.js   (нужен сервер на :8000)
 */
const { chromium } = require('@playwright/test');

const ВИДЫ = [
    { имя: 'десктоп 1280x800',  w: 1280, h: 800,  тач: false },
    { имя: 'планшет 768x1024',  w: 768,  h: 1024, тач: true },
    { имя: 'планшет 1024x768',  w: 1024, h: 768,  тач: true },
    { имя: 'телефон 375x812',   w: 375,  h: 812,  тач: true },
    { имя: 'телефон 844x390',   w: 844,  h: 390,  тач: true }
];

const СТРАНИЦЫ = [
    ['ru', 'http://localhost:8000/pages/auth.html'],
    ['en', 'http://localhost:8000/pages/auth-en.html'],
    ['kg', 'http://localhost:8000/pages/auth-kg.html']
];

const ЗАМЕР = function () {
    window.scrollTo(0, 0);
    const карточка = document.querySelector('.auth-card');
    const кнопка = document.querySelector('#signupForm .auth-btn');
    const кк = карточка.getBoundingClientRect();
    const кн = кнопка.getBoundingClientRect();
    return {
        карточка: Math.round(кк.height),
        ширинаКарточки: Math.round(кк.width),
        низКнопки: Math.round(кн.bottom),
        экран: window.innerHeight,
        заСгибом: Math.max(0, Math.round(кн.bottom - window.innerHeight))
    };
};

(async () => {
    const браузер = await chromium.launch();
    const строки = [];

    for (const вид of ВИДЫ) {
        for (const [язык, адрес] of СТРАНИЦЫ) {
            const ctx = await браузер.newContext({
                viewport: { width: вид.w, height: вид.h },
                hasTouch: вид.тач,
                isMobile: вид.тач
            });
            const стр = await ctx.newPage();
            await стр.goto(адрес, { waitUntil: 'domcontentloaded' });
            await стр.click('.auth-tab[data-tab="signup"]');
            await стр.click('#signupShowForm');
            await стр.waitForTimeout(200);

            const до = await стр.evaluate(ЗАМЕР);

            // Сколько занимают три блока, которые уходят
            const блоки = await стр.evaluate(function () {
                const карта = {};
                [['NTRP', '#signup-ntrp'], ['пароль', '#signup-password'], ['подтверждение', '#signup-confirm']]
                    .forEach(function (пара) {
                        const поле = document.querySelector(пара[1]);
                        const блок = поле && поле.closest('.auth-field');
                        if (!блок) { карта[пара[0]] = null; return; }
                        const ст = getComputedStyle(блок);
                        карта[пара[0]] = Math.round(блок.getBoundingClientRect().height
                            + parseFloat(ст.marginTop) + parseFloat(ст.marginBottom));
                    });
                return карта;
            });

            // Прячем их и даём браузеру пересчитать
            await стр.evaluate(function () {
                ['#signup-ntrp', '#signup-password', '#signup-confirm'].forEach(function (сел) {
                    const поле = document.querySelector(сел);
                    const блок = поле && поле.closest('.auth-field');
                    if (блок) блок.style.display = 'none';
                });
            });
            await стр.waitForTimeout(150);

            const после = await стр.evaluate(ЗАМЕР);

            строки.push({ вид: вид.имя, язык, до, после, блоки });
            await ctx.close();
        }
    }

    await браузер.close();

    // ---- вывод ----
    console.log('\nБЛОКИ, КОТОРЫЕ УХОДЯТ (высота с полями, px)');
    const первый = строки[0];
    console.log('  NTRP', первый.блоки.NTRP, '· пароль', первый.блоки['пароль'],
                '· подтверждение', первый.блоки['подтверждение'],
                '= ', (первый.блоки.NTRP + первый.блоки['пароль'] + первый.блоки['подтверждение']));

    console.log('\nВИД              ЯЗЫК  КАРТОЧКА ДО/ПОСЛЕ   НИЗ КНОПКИ ДО/ПОСЛЕ   ЭКРАН   ЗА СГИБОМ ДО/ПОСЛЕ');
    строки.forEach(function (с) {
        console.log(
            с.вид.padEnd(17),
            с.язык.padEnd(5),
            String(с.до.карточка).padStart(5) + ' / ' + String(с.после.карточка).padStart(5),
            String(с.до.низКнопки).padStart(9) + ' / ' + String(с.после.низКнопки).padStart(5),
            String(с.до.экран).padStart(7),
            String(с.до.заСгибом).padStart(9) + ' / ' + String(с.после.заСгибом).padStart(5)
        );
    });

    const осталось = строки.filter(function (с) { return с.после.заСгибом > 0; });
    console.log('\nПОСЛЕ СОКРАЩЕНИЯ кнопка всё ещё за сгибом на ' + осталось.length + ' из ' + строки.length + ' сочетаний.');
    osталось_вывод(осталось);
    function osталось_вывод(список) {
        список.forEach(function (с) {
            console.log('   ' + с.вид + ' · ' + с.язык + ' — не хватает ' + с.после.заСгибом + 'px');
        });
    }
})();
