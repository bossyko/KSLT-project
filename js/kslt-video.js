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

    /** Адрес встраивания по ссылке на публикацию. Пусто — ссылку не разобрали. */
    function адресКадра(url) {
        var s = String(url || '').trim();

        var yt = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
        if (yt) return { вид: 'yt', src: 'https://www.youtube.com/embed/' + yt[1], подпись: 'Видео на YouTube' };

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

    window.KSLT_VIDEO = { вид: вид, адресКадра: адресКадра, кадр: кадр, починитьКадры: починитьКадры };
})();
