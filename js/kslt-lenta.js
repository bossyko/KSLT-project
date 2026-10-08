/**
 * КСЛТ — ЛЕНТА КАДРОВ НОВОСТИ: сборка и переключение.
 *
 * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. Ленту показывают ДВА места: страница
 * новости и предпросмотр в админке. Пока сборщик жил только в js/news.js,
 * у админки был свой — и он собирал одни снимки: Костя видел, что «в
 * предпросмотре видео идёт отдельно, не как на публичной».
 *
 * Здесь же лежит правило 08.10: отношение коробки снимается с ПЕРВОГО
 * кадра и при листании не меняется, иначе коробка прыгает.
 */
(function() {
    'use strict';

    /** Подпись кнопки кадра приходит снаружи: у страницы она на трёх языках. */
    var ПОДПИСЬ = 'Открыть';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function getLabels() { return { viewerTitle: ПОДПИСЬ }; }

function собратьСнимкиВГалерею(root) {
    root.querySelectorAll('.news-html').forEach(function(тело) {
        var дети = Array.prototype.slice.call(тело.children);
        var набор = [];     // кадры группы: фигуры со снимком или с видео
        var пустые = [];    // пустые абзацы ВНУТРИ группы — их же и уберём

        /** Что в этой фигуре: снимок, видео или ничего из этого. */
        function чтоВФигуре(эл) {
            if (!эл || эл.tagName !== 'FIGURE') return null;
            var видео = эл.querySelector('iframe[src]');
            if (видео) {
                var вид = window.KSLT_VIDEO ? window.KSLT_VIDEO.вид(видео.getAttribute('src')) : '';
                return { вид: 'видео', тип: вид || 'yt', адрес: видео.src };
            }
            var снимок = эл.querySelector('img');
            if (снимок && !эл.textContent.trim()) return { вид: 'фото', адрес: снимок.src };
            return null;
        }

        /** Пустой абзац: редактор ставит `<p><br></p>` после КАЖДОЙ вставки. */
        function пустойАбзац(эл) {
            return эл.tagName === 'P' && !эл.textContent.trim() && !эл.querySelector('img, iframe');
        }

        function закрыть() {
            if (набор.length < 2) { набор = []; пустые = []; return; }
            var кадры = набор.map(function(п) { return п.данные; });
            var фото = кадры.filter(function(к) { return к.вид === 'фото'; })
                            .map(function(к) { return к.адрес; });
            var блок = document.createElement('div');
            блок.className = 'news-carousel';
            блок.dataset.kadry = JSON.stringify(кадры);
            /* Смотрелка листает только СНИМКИ: видео на весь экран открывает
               не она, а сам проигрыватель. */
            блок.dataset.photos = JSON.stringify(фото);
            var первый = кадры[0];
            блок.innerHTML =
                '<div class="news-carousel-stage">' +
                    '<button class="news-carousel-nav news-carousel-prev" aria-label="Предыдущее">&#8249;</button>' +
                    '<button type="button" class="news-carousel-kadr" aria-label="' + getLabels().viewerTitle + '">' +
                        '<img class="news-carousel-main" src="' + esc(первый.вид === 'фото' ? первый.адрес : '') + '" alt="" data-index="0">' +
                    '</button>' +
                    /* Короб видео стоит рядом с кадром, а не вместо него:
                       переключение меняет видимость, а не разметку — иначе
                       при каждом шаге пересоздавался бы проигрыватель. */
                    '<div class="news-carousel-video" hidden></div>' +
                    '<button class="news-carousel-nav news-carousel-next" aria-label="Следующее">&#8250;</button>' +
                    '<div class="news-carousel-count">1 / ' + кадры.length + '</div>' +
                '</div>' +
                '<div class="news-carousel-thumbs">' +
                    кадры.map(function(к, i) {
                        var активна = i === 0 ? ' active' : '';
                        if (к.вид === 'видео') {
                            /* У ВИДЕО МИНИАТЮРЫ НЕТ, И ЭТО НЕ ЛЕНЬ: кадр
                               инстаграма закрыт, картинку оттуда не достать
                               без их ключа. Плитка со знаком «играть» честнее
                               чужого снимка, выданного за кадр ролика. */
                            return '<button class="news-carousel-thumb news-carousel-thumb--video' + активна +
                                '" data-index="' + i + '" aria-label="Видео ' + (i + 1) + '">' +
                                '<span class="news-carousel-igrat">&#9654;</span></button>';
                        }
                        return '<button class="news-carousel-thumb' + активна + '" data-index="' + i + '">' +
                            '<img src="' + esc(к.адрес) + '" alt="" loading="lazy">' +
                        '</button>';
                    }).join('') +
                '</div>';
            набор[0].эл.parentNode.insertBefore(блок, набор[0].эл);
            набор.forEach(function(п) { п.эл.remove(); });
            пустые.forEach(function(п) { п.remove(); });
            набор = []; пустые = [];
        }

        дети.forEach(function(эл) {
            var данные = чтоВФигуре(эл);
            if (данные) { набор.push({ эл: эл, данные: данные }); return; }
            /* ПУСТОЙ АБЗАЦ ГРУППУ НЕ РАЗРЫВАЕТ. Редактор вставляет его после
               каждой фотографии и каждого видео (editor.js), и из-за него
               видео оказывалось «отдельно от фотографий» — замер 08.10
               показал в тексте: FIGURE · FIGURE · P · карусель. */
            if (набор.length && пустойАбзац(эл)) { пустые.push(эл); return; }
            закрыть();
        });
        закрыть();
    });
}

function отношениеКоробки(wrap, кадр) {
    if (!кадр) return;
    /* Старая запись — просто адрес снимка. Новая — кадр ленты со своим видом. */
    var вид = typeof кадр === 'string' ? 'фото' : кадр.вид;
    var адрес = typeof кадр === 'string' ? кадр : кадр.адрес;

    if (вид === 'видео') {
        /* У РОЛИКА ОТНОШЕНИЕ ИЗВЕСТНО ЗАРАНЕЕ, И ЗАМЕРИТЬ ЕГО НЕЧЕМ: кадр
           чужой, в него не заглянуть. Инстаграм ставит вертикальную рамку
           9:16, YouTube и Vimeo — горизонтальную 16:9. */
        /* 4/5 — форма кадра инстаграма без его шапки и лайков (см.
           --ig-kadr в css/news.css, посчитано по снимку живого кадра) */
        wrap.style.setProperty('--kadr-shirina-k',
            (кадр.тип === 'ig' ? (4 / 5) : (16 / 9)).toFixed(4));
        return;
    }
    if (!адрес) return;
    var пробник = new Image();
    пробник.onload = function () {
        if (!пробник.naturalWidth || !пробник.naturalHeight) return;
        wrap.style.setProperty('--kadr-shirina-k',
            (пробник.naturalWidth / пробник.naturalHeight).toFixed(4));
    };
    пробник.src = адрес;
}

function завестиКарусель(wrap, кадры) {
    if (!wrap || !кадры || кадры.length < 2) return;

    отношениеКоробки(wrap, кадры[0]);

    var main = wrap.querySelector('.news-carousel-main');
    var короб = wrap.querySelector('.news-carousel-video');
    var кадрКнопка = wrap.querySelector('.news-carousel-kadr');
    var count = wrap.querySelector('.news-carousel-count');
    var thumbs = Array.prototype.slice.call(wrap.querySelectorAll('.news-carousel-thumb'));
    var index = 0;

    /* ЗВУК НЕ ДОЛЖЕН ПЕРЕЖИВАТЬ КАДР — слово Кости 08.10: «если я перехожу
       в карусели с видео дальше, видео должно останавливаться и уходить на
       начало, и звука не должно быть».
       Чужой проигрыватель не слушается ни паузы, ни перемотки: кадр закрыт,
       управлять им изнутри нечем. Единственное, что мы можем, — УБРАТЬ ЕГО.
       Поэтому ролик живёт ровно столько, сколько показан: ушли с кадра —
       рамка снесена, звук смолк, при возврате ролик открывается с начала.
       Цена названа честно: возврат на тот же ролик — это новая загрузка. */
    function убратьВидео() {
        if (короб) короб.innerHTML = '';
    }

    function показатьВидео(кадр) {
        if (!короб) return;
        убратьВидео();
        var рамка = document.createElement('span');
        рамка.className = 'news-carousel-ramka';
        var свой = document.createElement('iframe');
        свой.className = 'news-video news-video-' + (кадр.тип || 'yt');
        свой.src = кадр.адрес;
        свой.setAttribute('frameborder', '0');
        свой.setAttribute('allowfullscreen', '');
        свой.setAttribute('title', getLabels().viewerTitle || 'Видео');
        свой.dataset.adres = кадр.адрес;
        рамка.appendChild(свой);
        короб.appendChild(рамка);
        короб.hidden = false;
        if (кадрКнопка) кадрКнопка.hidden = true;
    }

    function показатьСнимок(кадр) {
        /* Снести рамку, а не спрятать: спрятанный кадр продолжает играть */
        убратьВидео();
        main.src = кадр.адрес;
        main.dataset.index = index;
        if (кадрКнопка) кадрКнопка.hidden = false;
        if (короб) короб.hidden = true;
    }

    function show(i) {
        index = (i + кадры.length) % кадры.length;
        var кадр = кадры[index];
        if (кадр.вид === 'видео') показатьВидео(кадр); else показатьСнимок(кадр);
        /* ОТНОШЕНИЕ КОРОБКИ НЕ ТРОГАЕМ: оно снято с ПЕРВОГО кадра (решение
           08.10), иначе коробка прыгала бы на каждом листании. Ролик
           вписывается внутрь неё своей рамкой, а не растягивает её. */
        count.textContent = (index + 1) + ' / ' + кадры.length;
        thumbs.forEach(function(t, n) { t.classList.toggle('active', n === index); });
        var active = thumbs[index];
        if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }

    wrap.querySelector('.news-carousel-prev').addEventListener('click', function() { show(index - 1); });
    wrap.querySelector('.news-carousel-next').addEventListener('click', function() { show(index + 1); });
    thumbs.forEach(function(t) {
        t.addEventListener('click', function() { show(Number(t.dataset.index)); });
    });

    show(0);
    листалкаМиниатюр(wrap);
}

function листалкаМиниатюр(wrap) {
    var лента = wrap.querySelector('.news-carousel-thumbs');
    if (!лента || лента.parentNode.classList.contains('news-thumbs-row')) return;

    var ряд = document.createElement('div');
    ряд.className = 'news-thumbs-row';
    лента.parentNode.insertBefore(ряд, лента);

    var назад = document.createElement('button');
    назад.className = 'news-thumbs-nav news-thumbs-back';
    назад.type = 'button';
    назад.innerHTML = '&#8249;';

    var вперёд = document.createElement('button');
    вперёд.className = 'news-thumbs-nav news-thumbs-fwd';
    вперёд.type = 'button';
    вперёд.innerHTML = '&#8250;';

    ряд.appendChild(назад);
    ряд.appendChild(лента);
    ряд.appendChild(вперёд);

    function шаг(сторона) {
        лента.scrollBy({ left: сторона * Math.round(лента.clientWidth * 0.8), behavior: 'smooth' });
    }
    назад.addEventListener('click', function() { шаг(-1); });
    вперёд.addEventListener('click', function() { шаг(1); });

    function обновить() {
        var влезает = лента.scrollWidth <= лента.clientWidth + 1;
        ряд.classList.toggle('news-thumbs-fits', влезает);
        назад.disabled = лента.scrollLeft <= 0;
        вперёд.disabled = лента.scrollLeft + лента.clientWidth >= лента.scrollWidth - 1;
    }
    лента.addEventListener('scroll', обновить);
    window.addEventListener('resize', обновить);
    setTimeout(обновить, 0);
}

    window.KSLT_LENTA = {
        собрать: function(root, подпись) {
            if (подпись) ПОДПИСЬ = подпись;
            собратьСнимкиВГалерею(root);
        },
        завести: function(wrap, кадры, подпись) {
            if (подпись) ПОДПИСЬ = подпись;
            завестиКарусель(wrap, кадры);
        },
        отношение: отношениеКоробки
    };
})();
