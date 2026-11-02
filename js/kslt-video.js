/**
 * КСЛТ — ВНЕШНЕЕ ВИДЕО: ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ.
 *
 * «Что это за ссылка и каким кадром её показывать» нужно ДВУМ сторонам:
 * редактору админки (вставляет кадр) и странице новости (чинит кадры,
 * сохранённые раньше — у них классов нет). Пока это жило только в
 * редакторе, страница не знала, вертикальный перед ней ролик или
 * горизонтальный, и ставила всем 16:9.
 *
 * Правка 08.10: КЛАССЫ СРЕЗАЛА НАША ЖЕ ЧИСТКА. `cleanNewsHtmlOnSave`
 * выбрасывала `class="..."` целиком — вместе с `news-video-ig`, который
 * редактор только что поставил. В базе лежат голые iframe, и правило
 * вертикального кадра к ним не применялось никогда.
 */
(function() {
    'use strict';

    /** Вид ролика по адресу: 'yt' · 'vm' · 'ig' · '' (чужой). */
    function вид(url) {
        if (!url) return '';
        var s = String(url);
        if (/(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/.test(s)) return 'yt';
        if (/vimeo\.com/.test(s)) return 'vm';
        if (/instagram\.com/.test(s)) return 'ig';
        return '';
    }

    /**
     * ОПОЗНАВАТЕЛЬ YOUTUBE — ОДИН НА ПРОДУКТ.
     *
     * ДО 02.11 ИХ БЫЛО ТРИ, И ЗНАЛИ ОНИ РАЗНОЕ. Этот дом понимал
     * `watch?v=`, `embed/` и `shorts/`; `js/live-match.js:676` и
     * `mobile/www/js/screens/live.js:368` — `watch?v=`, `embed/` и
     * `live/`. То есть ДОМ НЕ ЗНАЛ ИМЕННО ТОТ ВИД ССЫЛКИ, КОТОРЫЙ
     * АДМИНКА САМА И ПРЕДЛАГАЕТ ВВЕСТИ: подсказка в поле трансляции
     * гласит `https://youtube.com/live/...`. Беда родилась ровно на шве
     * и ждала первой же трансляции, вставленной в новость.
     *
     * ЧТО ПОНИМАЕТ ТЕПЕРЬ, и каждый вид — не выдумка, а то, что отдаёт
     * сам YouTube кнопкой «Поделиться» или адресной строкой:
     *   youtu.be/ID · youtu.be/ID?si=…  — короткая ссылка и её хвост
     *   watch?v=ID · watch?app=desktop&v=ID — длинная, с любым порядком
     *   live/ID — трансляция, то самое, что просит админка
     *   embed/ID — уже встроенная
     *   shorts/ID — вертикальный ролик
     *   v/ID — старая форма, она ещё встречается в сохранённых новостях
     *   studio.youtube.com/video/ID/livestreaming — адрес ИЗ СТУДИИ
     *     автора. Публичной ссылкой он не является, но именно его чаще
     *     всего и копируют: трансляцию заводят в студии, и адресная
     *     строка в этот момент показывает её. Имя там то же, и кадр по
     *     нему открывается, поэтому принимаем и его — иначе человек
     *     вставит ссылку, увидит отказ и не поймёт, чем она плоха.
     * Домен берётся с `m.` и `www.`, а также `youtube-nocookie.com`.
     *
     * ДЛИНА ИМЕНИ 11 ЗНАКОВ — ЭТО ФОРМАТ YOUTUBE, А НЕ НАША ДОГАДКА, и
     * проверять её надо: без этого `youtu.be/` с мусором отдаст «имя»
     * из трёх букв, кадр откроется пустым, и человек увидит чёрный
     * прямоугольник вместо объяснения.
     */
    function ytId(url) {
        var s = String(url || '').trim();
        if (!/(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/.test(s)) return null;

        /* Сначала то, где имя стоит в пути. */
        var п = s.match(/(?:youtu\.be|youtube\.com|youtube-nocookie\.com)\/(?:live|embed|shorts|video|v)?\/?([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
        if (п) return п[1];

        /* Потом — где оно довод `v`, с любым порядком доводов. */
        var д = s.match(/[?&]v=([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
        if (д) return д[1];

        return null;
    }

    /** Адрес встраивания по ссылке на публикацию. Пусто — ссылку не разобрали. */
    function адресКадра(url) {
        var s = String(url || '').trim();

        var yt = ytId(s);
        if (yt) return { вид: 'yt', src: 'https://www.youtube.com/embed/' + yt, подпись: 'Видео на YouTube' };

        var vm = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (vm) return { вид: 'vm', src: 'https://player.vimeo.com/video/' + vm[1], подпись: 'Видео на Vimeo' };

        /* ИМЯ АККАУНТА В АДРЕСЕ НЕОБЯЗАТЕЛЬНО, А КНОПКА «ПОДЕЛИТЬСЯ» ЕГО
           СТАВИТ: инстаграм отдаёт `instagram.com/kslt_tennis.kg/reel/…`.
           `reels` и `tv` — те же посты, только другим словом. */
        var ig = s.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/);
        if (ig) {
            var имя = ig[1] === 'reels' ? 'reel' : ig[1];
            return { вид: 'ig', src: 'https://www.instagram.com/' + имя + '/' + ig[2] + '/embed',
                     подпись: 'Публикация в Instagram' };
        }
        return null;
    }

    /** Готовый кадр для вставки в текст новости. */
    function кадр(url) {
        var а = адресКадра(url);
        if (!а) return '';
        return '<iframe class="news-video news-video-' + а.вид + '" src="' + а.src +
               '" frameborder="0" allowfullscreen title="' + а.подпись + '"></iframe>';
    }

    /**
     * Починка уже сохранённого текста: проставить классы кадрам, у которых
     * их нет, и обернуть голый кадр в `figure`. Нужна для новостей, которые
     * завели до 08.10: в базе они лежат без классов, и вертикальный ролик
     * показывался в горизонтальной коробке — с полосой прокрутки внутри.
     * РАЗМЕТКУ ЧИНИМ ПРИ ОТРИСОВКЕ, А НЕ В ДАННЫХ: база — никогда без слова.
     */
    function починитьКадры(корень) {
        if (!корень) return 0;
        var починено = 0;

        /* ОДИН КОРОБ — ОДИН КАДР. ЧТЕНИЕ БАЗЫ 08.10 (новость `proba`):
           ДВА `<iframe>` лежали внутри ОДНОГО `<figure>` — старый ролик и
           новый. Редактор вставляет кадр туда, где стоит курсор, и если он
           стоял внутри короба, второй кадр оказывается соседом первого.
           Лента брала у короба ПЕРВЫЙ кадр, и новое видео не показывалось
           нигде: ни на странице, ни в предпросмотре. Разносим по своим
           коробам — после этого каждый кадр виден и каждый листается. */
        Array.prototype.forEach.call(корень.querySelectorAll('figure'), function(короб) {
            var медиа = короб.querySelectorAll('iframe[src], img');
            if (медиа.length < 2) return;
            /* Порядок держим указателем: вставлять каждый «сразу после
               короба» значило бы развернуть их задом наперёд. */
            var последний = короб;
            Array.prototype.slice.call(медиа, 1).forEach(function(лишний) {
                var свой = document.createElement('figure');
                свой.className = короб.className;
                свой.appendChild(лишний);
                последний.parentNode.insertBefore(свой, последний.nextSibling);
                последний = свой;
                починено++;
            });
        });

        Array.prototype.forEach.call(корень.querySelectorAll('iframe[src]'), function(кадр) {
            var в = вид(кадр.getAttribute('src'));
            if (!в) return;
            if (!кадр.classList.contains('news-video')) { кадр.classList.add('news-video'); починено++; }
            if (!кадр.classList.contains('news-video-' + в)) kadrKlass(кадр, в);
            var род = кадр.parentElement;
            if (род && род.tagName !== 'FIGURE') {
                var ф = document.createElement('figure');
                ф.className = 'news-video-figure';
                род.insertBefore(ф, кадр);
                ф.appendChild(кадр);
                починено++;
            } else if (род) {
                род.classList.add('news-video-figure');
            }
        });
        return починено;
    }

    function kadrKlass(кадр, в) { кадр.classList.add('news-video-' + в); }

    window.KSLT_VIDEO = { вид: вид, ytId: ytId, адресКадра: адресКадра, кадр: кадр, починитьКадры: починитьКадры };
})();
