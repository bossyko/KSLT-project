#!/usr/bin/env python3
"""
Собирает SQL для переноса новостей с tennis.kg в нашу базу.

На входе:
  import/news-full.json        — выгрузка с tennis.kg (заголовок, текст, картинки, дата)
  import/news-translations.json — переводы на английский и кыргызский (может отсутствовать)

На выходе:
  sql/import-news.sql

Картинки заранее скачаны в import/news-images и должны быть залиты в бакет
`news` в Supabase Storage — адреса в SQL собираются под этот бакет.
"""

import json
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE = 'https://qqkzszesviukopgjbead.supabase.co/storage/v1/object/public/news/'

# Категории берём из админки: results, interview, announcement, world.
# Отчёты о прошедших турнирах — results, анонсы и юбилеи — announcement.
CATEGORY = {
    'SUMMER BREEZE CUP – 2026': 'results',
    'МАЙСКИЙ ЧЕМПИОНАТ КСЛТ': 'announcement',
    'FRIENDS’ CUP 2026': 'results',
    'ABDYSH-ATA SPRING CUP': 'results',
    '4 года вместе с КСЛТ!!!': 'announcement',
    'SUMMER BREEZE CUP-2025': 'announcement',
    '4 ГОДА ВМЕСТЕ С КСЛТ': 'announcement',
    'КСЛТ — 2 года вместе! 🎉🎾': 'announcement',
    'Турнир PORCELANOSA CUP 2023': 'results',
    'Международный праздник тенниса KIA OPEN - 2023!': 'results',
}
DEFAULT_CATEGORY = 'results'

# У одной новости заголовком стоит целое предложение, а подзаголовок пуст.
# В списке она ломает ряд карточек, поэтому заголовок укорачиваем до названия
# турнира, а исходное предложение уходит в описание.
LONG_TITLE = '24 мая на кортах СК Тай-брейк прошел рейтинговый турнир КСЛТ в женском парном разряде в категориях MASTERS и TOUR!'
TITLE_OVERRIDE = {
    LONG_TITLE: 'Рейтинговый турнир КСЛТ — женский парный разряд',
}

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'ң': 'n', 'ө': 'o', 'ү': 'u',
}


def slugify(title):
    s = ''.join(TRANSLIT.get(c, c) for c in title.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:80] or 'news'


def q(value):
    """Строка для SQL. None и пустое — NULL."""
    if value is None or value == '':
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def date_to_ts(ddmmyyyy):
    d, m, y = ddmmyyyy.split('.')
    return '{}-{}-{} 12:00:00+06'.format(y, m, d)


def main():
    news = json.load(open(os.path.join(BASE, 'import/news-full.json'), encoding='utf-8'))

    tr_path = os.path.join(BASE, 'import/news-translations.json')
    translations = json.load(open(tr_path, encoding='utf-8')) if os.path.exists(tr_path) else {}

    rows = []
    seen_slugs = set()

    for n in news:
        title = (n.get('title') or '').strip()
        subtitle = (n.get('subtitle') or '').strip()
        if title in TITLE_OVERRIDE:
            subtitle = subtitle or title      # длинный заголовок становится описанием
            title = TITLE_OVERRIDE[title]
        slug = slugify(title)
        while slug in seen_slugs:
            slug += '-2'
        seen_slugs.add(slug)

        cover = n.get('newsCover')
        gallery = [STORAGE + p.split('/')[-1] for p in (n.get('images') or [])]
        t = translations.get(n['_id'], {})

        rows.append(
            '(' + ', '.join([
                'gen_random_uuid()',
                q(title),
                q(t.get('title_en')),
                q(t.get('title_kg')),
                q(slug),
                q(n.get('content')),
                q(t.get('content_en')),
                q(t.get('content_kg')),
                q(subtitle),
                q(t.get('excerpt_en')),
                q(t.get('excerpt_kg')),
                q(STORAGE + cover.split('/')[-1]) if cover else 'NULL',
                q(CATEGORY.get(n.get('title', '').strip(), CATEGORY.get(title, DEFAULT_CATEGORY))),
                q('КСЛТ'),
                q(date_to_ts(n['createdAt'])) + '::timestamptz',
                q(json.dumps(gallery, ensure_ascii=False)) + '::jsonb',
            ]) + ')'
        )

    sql = [
        '-- ============================================',
        '-- Перенос новостей с tennis.kg',
        '-- Запускать в Supabase SQL Editor целиком.',
        '-- ============================================',
        '--',
        '-- Собрано скриптом import/build-news-sql.py — правки вносить туда,',
        '-- иначе они потеряются при следующей сборке.',
        '--',
        '-- ВАЖНО: до запуска залить import/news-images (49 файлов) в бакет `news`',
        '-- в Supabase Storage, сохранив имена файлов. Иначе картинки не откроются.',
        '--',
        '-- id генерируем сами: у колонки нет значения по умолчанию.',
        '',
        'INSERT INTO news (',
        '  id,',
        '  title, title_en, title_kg,',
        '  slug,',
        '  content, content_en, content_kg,',
        '  excerpt, excerpt_en, excerpt_kg,',
        '  image, category, author, published_at, gallery',
        ') VALUES',
        ',\n'.join(rows) + ';',
        '',
        '-- Проверка',
        'SELECT published_at::date AS дата, category, title,',
        '       jsonb_array_length(gallery) AS фото,',
        "       (title_en IS NOT NULL) AS есть_англ,",
        "       (title_kg IS NOT NULL) AS есть_кырг",
        'FROM news ORDER BY published_at DESC;',
        '',
    ]

    out = os.path.join(BASE, 'sql/import-news.sql')
    open(out, 'w', encoding='utf-8').write('\n'.join(sql))
    print('новостей в переносе:', len(rows))
    print('с переводами:', sum(1 for n in news if translations.get(n['_id'], {}).get('title_en')))
    print('файл:', out)


if __name__ == '__main__':
    main()
