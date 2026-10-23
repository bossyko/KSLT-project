// ============================================
// Главная — блок «Новости»
// ============================================
//
// Четыре последние опубликованные новости с обложками. Раньше на главной новостей
// не было вовсе: про них узнавали только из шапки, и свежая статья могла
// провисеть неделю незамеченной.
//
// Данные те же, что на странице новостей: таблица news, опубликованные —
// у которых проставлена дата публикации. Своей картинки может не быть
// (мировые новости приходят без неё) — тогда берём обложку из общего набора,
// как это делает сама страница новостей.

(function () {
    'use strict';

    var путь = window.location.pathname;
    var isEn = /-en\.html$/.test(путь);
    var isKg = /-kg\.html$/.test(путь);

    var L = KSLT_YAZYK.выбрать({ title: 'News', all: 'All news', empty: 'No news yet',
            cats: { results: 'Results', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' } }, { title: 'Жаңылыктар', all: 'Бардык жаңылыктар', empty: 'Жаңылыктар али жок',
                cats: { results: 'Жыйынтыктар', interview: 'Интервью', announcement: 'Жарыялоо', world: 'Дүйнөлүк теннис' } }, { title: 'Новости', all: 'Все новости', empty: 'Новостей пока нет',
                cats: { results: 'Результаты', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' } });

    var страницаНовостей = KSLT_YAZYK.выбрать('pages/news-en.html', 'pages/news-kg.html', 'pages/news.html');

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    /** Дата словами: «10 сентября 2026». */
    function дата(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        /* ЛОКАЛЬ — ДОМ ЯЗЫКА (кусок 147): `ky-KG` в браузере нет, и она
           молча становилась английской. */
        return d.toLocaleDateString(KSLT_YAZYK.локаль,
            { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function заголовок(row) {
        if (isEn) return row.title_en || row.title;
        if (isKg) return row.title_kg || row.title;
        return row.title;
    }

    function подпись(row) {
        if (isEn) return row.excerpt_en || row.excerpt || '';
        if (isKg) return row.excerpt_kg || row.excerpt || '';
        return row.excerpt || '';
    }

    /**
     * Ссылка на новость. Мировая ведёт прямо к первоисточнику: своей страницы
     * у неё нет, чужой текст мы не перепечатываем.
     */
    function ссылка(row) {
        if (row.source_url && row.category === 'world') return row.source_url;
        return страницаНовостей + '?article=' + encodeURIComponent(row.slug);
    }

    function карточка(row) {
        var своя = !row.image;
        var обложка = row.image || (window.KSLT_NEWS_COVERS
            ? window.KSLT_NEWS_COVERS.путь(row.id || row.slug, '')
            : '');
        var внешняя = row.source_url && row.category === 'world';

        return '<a class="hn-card" href="' + KSLT_экранировать(ссылка(row)) + '"' +
                (внешняя ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<div class="hn-img' + (своя ? ' hn-own-cover' : '') + '">' +
                (обложка ? '<img src="' + KSLT_экранировать(обложка) + '" alt="" loading="lazy">' : '') +
                '<span class="hn-cat">' + KSLT_экранировать(L.cats[row.category] || row.category || '') + '</span>' +
            '</div>' +
            '<div class="hn-body">' +
                '<h3>' + KSLT_экранировать(заголовок(row)) + '</h3>' +
                (подпись(row) ? '<p>' + KSLT_экранировать(подпись(row)) + '</p>' : '') +
                '<span class="hn-date">' + KSLT_экранировать(дата(row.published_at)) + '</span>' +
            '</div>' +
        '</a>';
    }

    async function загрузить() {
        var место = document.getElementById('homeNewsGrid');
        if (!место) return;

        if (typeof supabase === 'undefined' || !window.SUPABASE_URL) return;
        var client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        var res = await client.from('news')
            .select('id, slug, title, title_en, title_kg, excerpt, excerpt_en, excerpt_kg, image, category, published_at, source_url')
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false })
            // Четыре: на телефоне они встают по две в два ряда, на широком
            // экране — в один. Три оставляли дыру в ряду
            .limit(4);

        var новости = res.data || [];
        if (res.error || !новости.length) {
            // Пустой раздел на главной выглядит поломкой — убираем его целиком
            var секция = document.getElementById('news');
            if (секция) секция.style.display = 'none';
            return;
        }

        /* Последней плиткой — «Все новости». Видна только в ленте на телефоне
           боком: у полосы должен быть конец, иначе непонятно, докуда листать.
           В сетке её прячет css — там ту же роль исполняет ссылка в шапке. */
        var все = KSLT_YAZYK.выбрать(
            { href: 'pages/news-en.html', текст: 'All news' },
            { href: 'pages/news-kg.html', текст: 'Бардык жаңылыктар' },
            { href: 'pages/news.html', текст: 'Все новости' });
        место.innerHTML = новости.map(карточка).join('')
            + '<a class="hn-more" href="' + все.href + '">'
            + '<span>' + все.текст + '</span><span aria-hidden="true">→</span></a>';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', загрузить);
    } else {
        загрузить();
    }
})();
