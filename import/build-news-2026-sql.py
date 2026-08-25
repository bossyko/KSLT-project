#!/usr/bin/env python3
"""
Собирает SQL для новостей о турнирах 2026 года.

Записи пришли отдельным архивом (kslt-2026-handoff) в той же схеме, что и
import/news-full.json. Отдельный скрипт, а не общий build-news-sql.py,
потому что тот собирает разом весь файл — прежние новости уже в базе, и
повторная вставка создала бы их заново.

На входе:
  import/news-2026.json        — 11 записей, готовых к публикации
  import/news-2026-drafts.json — 4 записи, которым не хватает данных

На выходе:
  sql/import-news-2026.sql

Черновики отличаются пустым published_at: сайт показывает только записи
с датой публикации, а в админке такие помечены как «Черновик» и видны
через фильтр по статусу. Причина, по которой запись ждёт правки,
дописана в начало текста — чтобы не искать её в переписке.

Обложки должны лежать в бакете `news` в Supabase Storage под теми же
именами, что в архиве.
"""

import json
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE = 'https://qqkzszesviukopgjbead.supabase.co/storage/v1/object/public/news/'

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
    if value is None or value == '':
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def date_to_ts(value):
    """25.01.2026 → 2026-01-25 09:00:00+06 (время подставляем утреннее)."""
    d, m, y = value.split('.')
    return '%s-%s-%s 09:00:00+06' % (y, m, d)


def build_rows(news, seen_slugs, draft=False):
    rows = []
    for n in news:
        title = (n.get('title') or '').strip()
        slug = slugify(title)
        while slug in seen_slugs:
            slug += '-2'
        seen_slugs.add(slug)

        cover = n.get('newsCover')
        gallery = [STORAGE + p.split('/')[-1] for p in (n.get('images') or [])]

        content = n.get('content') or ''
        if draft and n.get('_draftReason'):
            content = ('<p><strong>Черновик: ' + n['_draftReason'] +
                       '.</strong></p>' + content)

        published = 'NULL'
        if not draft and n.get('createdAt'):
            published = q(date_to_ts(n['createdAt'])) + '::timestamptz'

        rows.append(
            '(' + ', '.join([
                'gen_random_uuid()',
                q(title),
                q(slug),
                q(content),
                q(n.get('subtitle')),
                q(STORAGE + cover.split('/')[-1]) if cover else 'NULL',
                q(n.get('category') or 'results'),
                q('КСЛТ'),
                published,
                q(json.dumps(gallery, ensure_ascii=False)) + '::jsonb',
            ]) + ')'
        )
    return rows


def main():
    seen_slugs = set()
    news = json.load(open(os.path.join(BASE, 'import/news-2026.json'), encoding='utf-8'))
    drafts_path = os.path.join(BASE, 'import/news-2026-drafts.json')
    drafts = json.load(open(drafts_path, encoding='utf-8')) if os.path.exists(drafts_path) else []

    rows = build_rows(news, seen_slugs)
    draft_rows = build_rows(drafts, seen_slugs, draft=True)

    sql = [
        '-- ============================================',
        '-- Новости о турнирах 2026 года',
        '-- ============================================',
        '--',
        '-- Собрано скриптом import/build-news-2026-sql.py — правки вносить',
        '-- туда, иначе они потеряются при следующей сборке.',
        '--',
        '-- ДО ЗАПУСКА: залить обложки из import/news-images в бакет `news`',
        '-- в Supabase Storage, сохранив имена файлов. Иначе картинки не',
        '-- откроются, а записи встанут.',
        '--',
        '-- Записи без обложки заведены намеренно: афиш к этим турнирам',
        '-- в архиве не было.',
        '',
        'BEGIN;',
        '',
        'INSERT INTO news (',
        '  id, title, slug, content, excerpt, image, category, author, published_at, gallery',
        ') VALUES',
        ',\n'.join(rows) + ';',
        '',
        '-- Четыре записи, которым не хватает данных, заводим черновиками:',
        '-- published_at пустой, поэтому на сайте они не появятся, а в админке',
        '-- будут помечены как «Черновик». Причина дописана в начало текста.',
        'INSERT INTO news (',
        '  id, title, slug, content, excerpt, image, category, author, published_at, gallery',
        ') VALUES',
        ',\n'.join(draft_rows) + ';',
        '',
        '-- Правка к уже опубликованной записи: турнир шёл 16–19 июля, а не 16–18.',
        '-- Подтверждается афишей, анонсом регламента и объявлением о регистрации —',
        '-- итоги объявляли 19-го.',
        "UPDATE news SET excerpt = replace(excerpt, 'С 16 по 18 июля', 'С 16 по 19 июля'),",
        "                content = replace(content, 'С 16 по 18 июля', 'С 16 по 19 июля')",
        " WHERE slug = 'summer-breeze-cup-2026';",
        '',
        '-- Проверка: свежие записи сверху',
        'SELECT published_at::date AS дата, category, title,',
        '       (image IS NOT NULL) AS есть_обложка,',
        "       CASE WHEN published_at IS NULL THEN 'черновик' ELSE 'опубликовано' END AS статус",
        'FROM news ORDER BY published_at DESC NULLS FIRST LIMIT 25;',
        '',
        'COMMIT;',
        '',
    ]

    out = os.path.join(BASE, 'sql/import-news-2026.sql')
    open(out, 'w', encoding='utf-8').write('\n'.join(sql))
    print('к публикации:', len(rows), '| черновиков:', len(draft_rows))
    print('файл:', out)


if __name__ == '__main__':
    main()
