/* ЗАМЕР ШАПКИ ВОШЕДШЕГО (figma-audiences, шаг 4).
   Зовётся вставкой <script> (CSP запрещает eval), кладёт обещание в
   window.__ЗАМЕР.

   ДВА УРОКА, ЗАШИТЫЕ ЗДЕСЬ:
   1. ЗАМЕР В СКРЫТОЙ ВКЛАДКЕ ВРЁТ: переходы заморожены, и панель с
      классом open читается закрытой. Поэтому переходы и анимации
      ГАСЯТСЯ на время замера — состояние применяется мгновенно.
   2. ВИДИМОСТЬ — checkVisibility, а не offsetParent: иначе в счёт
      целей попадают закрытые выпадающие панели (было 44 вместо 10). */
window.__ЗАМЕР = (async function () {
    var гаситель = document.getElementById('__noTrans');
    if (!гаситель) {
        гаситель = document.createElement('style');
        гаситель.id = '__noTrans';
        гаситель.textContent = '*,*::before,*::after{transition:none !important;animation:none !important;}';
        document.head.appendChild(гаситель);
    }
    /* ВИДИМОСТЬ — ОДИН ПРИЗНАК НА ВЕСЬ ПРОЕКТ, И ЭТО checkVisibility.
       Запасной путь через свойства узла здесь НЕ пишется: он был бы
       вторым домом видимости, и сторож check-vidimost-odin-dom ловит
       такие копии счётом. Браузер без checkVisibility у нас не мерит. */
    var виден = function (e) {
        return e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    };
    var R = function (e) {
        var r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
    };
    var ждать = function (мс) { return new Promise(function (r) { setTimeout(r, мс); }); };
    var шапка = document.querySelector('.floating-header');
    var о = {
        вид: window.innerWidth + 'x' + window.innerHeight,
        язык: document.documentElement.lang,
        видимость: document.visibilityState,
        высотаШапки: шапка ? R(шапка).h : null,
        вошёл: !!document.querySelector('.user-dropdown')
    };

    var права = document.querySelector('.nav-right');
    о.справа = права ? [].filter.call(права.children, виден).map(function (e) {
        var r = R(e);
        return (e.className || '').toString().split(' ')[0] + ' ' + r.w + 'x' + r.h;
    }) : null;

    var ав = document.querySelector('.user-dropdown-avatar, .user-dropdown-toggle img');
    if (ав) {
        var s = getComputedStyle(ав);
        о.аватар = R(ав).w + 'x' + R(ав).h + ' радиус ' + s.borderRadius +
            ' ' + (ав.tagName === 'IMG' ? (ав.getAttribute('src') ? 'фото' : 'без фото') : 'заглушка');
    } else {
        var зг = document.querySelector('.user-dropdown-avatar-ph');
        о.аватар = зг ? ('заглушка ' + R(зг).w + 'x' + R(зг).h) : 'нет';
    }

    var цели = [].filter.call(шапка.querySelectorAll('a,button,[role="button"]'), виден).map(function (e) {
        var r = R(e);
        return { к: (e.className || '').toString().split(' ')[0], т: (e.textContent || '').trim().slice(0, 16), w: r.w, h: r.h };
    });
    о.целей = цели.length;
    о.мало44 = цели.filter(function (c) { return Math.min(c.w, c.h) < 44; })
        .map(function (c) { return c.к + ' ' + c.w + 'x' + c.h; });

    /* ПАНЕЛИ — открываются нажатием, меряются ОТКРЫТЫМИ */
    о.панели = {};
    var пары = [
        ['аватар', '.user-dropdown-toggle', '.user-dropdown-menu', '.user-dropdown'],
        ['язык', '.lang-toggle', '.lang-menu', '.lang-dropdown'],
        ['админка', '.admin-nav-toggle', '.admin-nav-menu', '.admin-nav']
    ];
    for (var i = 0; i < пары.length; i++) {
        var имя = пары[i][0], т = document.querySelector(пары[i][1]), п = document.querySelector(пары[i][2]);
        if (!п) { о.панели[имя] = 'нет в разметке'; continue; }
        if (!т || !виден(т)) { о.панели[имя] = 'переключателя не видно'; continue; }
        т.click();
        await ждать(200);
        var откр = виден(п), r = R(п);
        о.панели[имя] = {
            открылась: откр,
            размер: r.w + 'x' + r.h,
            заКраем: r.x < 0 || (r.x + r.w) > window.innerWidth,
            нижеОкна: (r.y + r.h) > window.innerHeight,
            строки: [].map.call(п.querySelectorAll('a,button'), function (e) {
                var rr = R(e); return (e.textContent || '').trim().slice(0, 14) + ' ' + rr.w + 'x' + rr.h;
            }),
            мало44: [].filter.call(п.querySelectorAll('a,button'), function (e) {
                var rr = R(e); return Math.min(rr.w, rr.h) < 44;
            }).length
        };
        т.click();
        await ждать(120);
    }

    /* БОКОВОЙ ЛИСТ — у вошедшего состав другой, чем у гостя */
    var бург = document.querySelector('.burger-menu');
    if (бург && виден(бург)) {
        бург.click();
        await ждать(300);
        var лист = document.querySelector('.mobile-nav');
        if (лист) {
            var узлы = [].filter.call(лист.querySelectorAll('a,button'), виден);
            var пункты = узлы.map(function (e) {
                var rr = R(e); return { т: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 22), w: rr.w, h: rr.h };
            });
            о.боковойЛист = {
                открылся: виден(лист), ширина: R(лист).w, пунктов: пункты.length,
                мало44: пункты.filter(function (p) { return Math.min(p.w, p.h) < 44; })
                    .map(function (p) { return p.т + ' ' + p.w + 'x' + p.h; }),
                естьЯзык: !!лист.querySelector('[data-lang], .mobile-lang, [class*="lang"]'),
                естьВыход: /выйти|чыгуу|sign out|logout/i.test(лист.textContent || ''),
                пункты: пункты.map(function (p) { return p.т + ' ' + p.w + 'x' + p.h; })
            };
        } else { о.боковойЛист = 'листа нет в разметке'; }
        бург.click();
        await ждать(200);
    } else { о.боковойЛист = 'бургера нет на этом виде'; }

    о.переполнение = {
        шапка: шапка ? шапка.scrollWidth > шапка.clientWidth + 1 : null,
        страница: document.documentElement.scrollWidth > window.innerWidth + 1
    };
    гаситель.remove();
    return о;
})();
