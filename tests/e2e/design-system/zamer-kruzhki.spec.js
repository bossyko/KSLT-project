/**
 * ОДНОРАЗОВЫЙ ЗАМЕР (кусок 194, 27.10). Не правило и не заморозка.
 * Проба 94 упала на tablet-landscape: 16 кружков из 25 схлопнуты в 0x0.
 * Этот замер называет ИХ — класс, тег и цепочку родителей с размерами,
 * чтобы не угадывать, кто и из-за кого. Удалить после разбора.
 *
 *   npx playwright test tests/e2e/design-system/zamer-kruzhki.spec.js --reporter=line
 */
const { test } = require('../../fixtures');

test('кто схлопнулся', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    const р = await page.evaluate(() => {
        const карта = э => {
            const к = э.getBoundingClientRect(), с = getComputedStyle(э);
            const цепь = [];
            let у = э.parentElement, n = 0;
            while (у && n < 5) {
                const ск = у.getBoundingClientRect(), сс = getComputedStyle(у);
                цепь.push(у.tagName.toLowerCase() + '.' +
                    String(у.className || '').split(' ').filter(Boolean).slice(0, 3).join('.') +
                    ' [' + Math.round(ск.width) + 'x' + Math.round(ск.height) +
                    ' ' + сс.display + (сс.overflow !== 'visible' ? ' ovf:' + сс.overflow : '') + ']');
                у = у.parentElement; n++;
            }
            return { класс: String(э.className || ''), тег: э.tagName.toLowerCase(),
                     буквы: (э.textContent || '').trim(),
                     размер: Math.round(к.width) + 'x' + Math.round(к.height),
                     display: с.display, w: с.width, h: с.height, цепь: цепь };
        };
        const все = [...document.querySelectorAll('.avatar-initials')];
        const нулевые = все.filter(э => {
            const к = э.getBoundingClientRect();
            return к.width < 8 || к.height < 8;
        });
        const свод = {};
        нулевые.forEach(э => {
            const к = карта(э);
            const ключ = к.тег + '.' + к.класс + '  ←  ' + (к.цепь[0] || '—');
            свод[ключ] = (свод[ключ] || 0) + 1;
        });
        return {
            ширина: innerWidth,
            всего: все.length,
            нулевых: нулевые.length,
            свод: свод,
            живые: [...new Set(все.filter(э => э.getBoundingClientRect().width >= 8)
                .map(э => String(э.className) + ' = ' +
                    Math.round(э.getBoundingClientRect().width) + 'x' +
                    Math.round(э.getBoundingClientRect().height)))],
            примеры: нулевые.slice(0, 4).map(карта)
        };
    });
    console.log('\n' + JSON.stringify(р, null, 1) + '\n');
});
