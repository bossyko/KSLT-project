/**
 * ЗАМЕР КОНТРАСТА ЖИВЬЁМ. Кусок 186, записи 72ж и 72г.
 *
 * Считает контраст КАЖДОГО текстового узла страницы против НАСТОЯЩЕЙ
 * подложки: слои складываются снизу вверх по всей цепочке предков, с
 * накопленной прозрачностью. Градиент не описывается одним числом —
 * поэтому берутся ВСЕ его остановки и из них ХУДШАЯ: узел считается
 * прошедшим, только если проходит на самом светлом месте градиента.
 *
 * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. Этот файл — ЕДИНСТВЕННЫЙ счёт контраста
 * в продукте. Проба `92-tihiy-tekst.spec.js` зовёт его же, а не свою копию
 * формулы: до куска 186 копия была, и именно она объявляла узел на
 * градиенте «не мереным».
 *
 * КАРТИНКА И ГРАДИЕНТ — РАЗНЫЕ ВЕЩИ. Градиент задан красками, и его можно
 * сложить: берём ВСЕ остановки и худшую из них. Фотография числом не
 * описывается вовсе — такой узел честно считается НЕ МЕРЕНЫМ и называется,
 * а не записывается в прошедшие. Значок, нарисованный `data:`-картинкой
 * (стрелка выпадашки), подложкой текста НЕ является: он лежит ПОВЕРХ
 * краски фона у края поля, и краска под текстом остаётся прежней.
 *
 * Зовётся из браузера:
 *   const m = await import('/tools/kontrast.mjs'); m.замер();
 */
export const раз = s => { if (!s) return null;
    let m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+))?\s*\)/i);
    if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    m = s.match(/^#([0-9a-f]{6})$/i);
    if (m) return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16), 1];
    return null; };
const свет = c => { const [r,g,b] = c.map(v => { const s = v/255;
        return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4); });
    return 0.2126*r + 0.7152*g + 0.0722*b; };
export const контраст = (a,b) => { const x = свет(a), y = свет(b);
    return (Math.max(x,y)+0.05) / (Math.min(x,y)+0.05); };
export const поверх = (в, н) => [0,1,2].map(i => в[i]*в[3] + н[i]*(1-в[3]));
/** Фотография — не градиент: её пикселей числом не вывести.
    `data:`-картинка значком подложкой не считается (см. шапку файла). */
const фотография = s => /url\(\s*['"]?(?!data:)/i.test(s || '');
const изГрадиента = s => (!s || s === 'none') ? []
    : (s.match(/rgba?\([^)]+\)/g) || []).map(раз).filter(Boolean);

/** Все возможные подложки узла, сложенные снизу вверх по всей цепочке
    предков. null — узел не меряется: на пути фотография. */
function подложки(эл) {
    const цепь = []; let у = эл;
    while (у) { цепь.unshift(у); у = у.parentElement; }
    let варианты = [[10,10,10]];
    for (const у of цепь) {
        const c = getComputedStyle(у);
        if (фотография(c.backgroundImage)) return null;
        const гр = изГрадиента(c.backgroundImage);
        if (гр.length) {
            const нов = [];
            варианты.forEach(в => гр.forEach(г => нов.push(поверх(г, в))));
            варианты = нов.slice(0, 12);
        }
        const кр = раз(c.backgroundColor);
        if (кр && кр[3] > 0) варианты = варианты.map(в => поверх(кр, в));
    }
    return варианты;
}
function путь(эл) {
    const ч = []; let у = эл;
    while (у && ч.length < 4) {
        let s = у.tagName.toLowerCase();
        if (у.id) { ч.unshift(s + '#' + у.id); break; }
        if (у.className && typeof у.className === 'string')
            s += '.' + у.className.trim().split(/\s+/).slice(0,2).join('.');
        ч.unshift(s); у = у.parentElement;
    }
    return ч.join(' > ');
}

export function замер(сколько) {
    const итог = [], неМерено = [];
    document.querySelectorAll('body *').forEach(эл => {
        if (!([...эл.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1))) return;
        const c = getComputedStyle(эл);
        if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity === 0) return;
        const r = эл.getBoundingClientRect();
        if (!r.width || !r.height) return;
        /* WCAG 1.4.3: неактивное из порога исключено. */
        if (эл.disabled || эл.closest('[disabled]') || эл.getAttribute('aria-disabled') === 'true') return;
        const кр = раз(c.color); if (!кр) return;
        const кегль = parseFloat(c.fontSize), вес = parseInt(c.fontWeight) || 400;
        const порог = (кегль >= 24 || (кегль >= 18.66 && вес >= 700)) ? 3.0 : 4.5;
        const фоны = подложки(эл);
        if (!фоны) { неМерено.push({ путь: путь(эл), текст: эл.textContent.trim().slice(0, 24) }); return; }
        let худший = 99, худФон = null;
        фоны.forEach(ф => {
            const текст = кр[3] < 1 ? поверх(кр, ф) : [кр[0], кр[1], кр[2]];
            const v = контраст(текст, ф);
            if (v < худший) { худший = v; худФон = ф; }
        });
        итог.push({ путь: путь(эл), текст: эл.textContent.trim().slice(0, 24),
            кегль, вес, цвет: c.color,
            фон: худФон ? 'rgb(' + худФон.map(v => Math.round(v)).join(',') + ')' : '?',
            градиент: фоны.length > 1, контраст: +худший.toFixed(2), порог,
            прошёл: худший >= порог });
    });
    const ниже = итог.filter(о => !о.прошёл).sort((a,b) => a.контраст - b.контраст);
    const красных = итог.filter(о => /rgb\(255,\s*71,\s*87\)/.test(о.цвет));
    return {
        адрес: location.pathname + location.search, ширина: innerWidth,
        узлов: итог.length,
        наГрадиенте: итог.filter(о => о.градиент).length,
        наГрадиентеНиже: итог.filter(о => о.градиент && !о.прошёл).length,
        краснымТекстом: красных.length,
        краснымТекстомНиже: красных.filter(о => !о.прошёл).length,
        худшийКрасный: красных.length ? Math.min(...красных.map(о => о.контраст)) : null,
        неМерено: неМерено.length,
        неМереноПримеры: неМерено.slice(0, 4),
        нижеНормы: ниже.length,
        худшие: ниже.slice(0, сколько || 12)
    };
}
