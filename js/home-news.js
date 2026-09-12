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

    var L = isEn
        ? { title: 'News', all: 'All news', empty: 'No news yet',
            cats: { results: 'Results', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' } }
        : (isKg
            ? { title: 'Жаңылыктар', all: 'Бардык жаңылыктар', empty: 'Жаңылыктар али жок',
                cats: { results: 'Жыйынтыктар', interview: 'Интервью', announcement: 'Жарыялоо', world: 'Дүйнөлүк теннис' } }
            : { title: 'Новости', all: 'Все новости', empty: 'Новостей пока нет',
                cats: { results: 'Результаты', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' } });

    var страницаНовостей = isEn ? 'pages/news-en.html' : (isKg ? 'pages/news-kg.html' : 'pages/news.html');

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /** Дата словами: «10 сентября 2026». */
    function дата(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString(isEn ? 'en-US' : (isKg ? 'ky-KG' : 'ru-RU'),
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

        return '<a class="hn-card" href="' + esc(ссылка(row)) + '"' +
                (внешняя ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<div class="hn-img' + (своя ? ' hn-own-cover' : '') + '">' +
                (обложка ? '<img src="' + esc(обложка) + '" alt="" loading="lazy">' : '') +
                '<span class="hn-cat">' + esc(L.cats[row.category] || row.category || '') + '</span>' +
            '</div>' +
            '<div class="hn-body">' +
                '<h3>' + esc(заголовок(row)) + '</h3>' +
                (подпись(row) ? '<p>' + esc(подпись(row)) + '</p>' : '') +
                '<span class="hn-date">' + esc(дата(row.published_at)) + '</span>' +
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

        место.innerHTML = новости.map(карточка).join('');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', загрузить);
    } else {
        загрузить();
    }
})();
