#!/usr/bin/env python3
"""
Заносит рейтинг NTRP из списков клуба.

На входе два PDF — мужской и женский списки участников и членов КСЛТ.
В каждом: номер, ФИО и два рейтинга, одиночный и парный. Клуб решил
оставить только одиночный.

    python3 import/build-ntrp-sql.py мужчины.pdf женщины.pdf

На выходе:
    import/ntrp-people.json    — разобранные списки, для проверки глазами
    sql/import-ntrp.sql        — обновление рейтинга и новые карточки

Тонкости, из-за которых нельзя разбирать «в лоб»:

  • Отступы колонок на каждой странице свои — граница между одиночным и
    парным считается для каждой отдельно. С общей границей парный рейтинг
    попадал в одиночный.
  • Порядок «Имя Фамилия» скачет: в одном столбце и «Атхам Исраилов», и
    «Садыков Фуркат». Приводим к одному виду, но осторожно: «Виталий»,
    «Константин», «Дмитрий» кончаются как фамилии, а «Ким», «Пак», «Цой» —
    наоборот, как имена.
  • Кыргызские «кызы» и «уулу» стоят в конце и порядок не меняют.
  • Один человек может быть в списке дважды с разным рейтингом — берём
    наивысший.
"""

import json
import os
import re
import statistics
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPABASE = 'https://qqkzszesviukopgjbead.supabase.co'
ANON = 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G'

ROW = re.compile(r'^\s*(\d+)\s+(\S.*?)(\s{2,})')

TAIL = {'кызы', 'уулу', 'оглы', 'улуу', 'кизи'}

# Имена, которые кончаются как фамилии
FIRST_NAMES = {
    'виталий', 'дмитрий', 'анатолий', 'василий', 'юрий', 'валерий', 'геннадий',
    'аркадий', 'евгений', 'григорий', 'константин', 'валентин', 'мартин', 'максим',
    'ярослав', 'станислав', 'вячеслав', 'мирослав', 'владислав', 'святослав',
}
# Короткие фамилии, которые можно принять за имя
SHORT_SURNAMES = {'ким', 'пак', 'цой', 'кан', 'ли', 'хан', 'тен', 'юн', 'ан',
                  'лим', 'шин', 'сон', 'но', 'кон'}

SURNAME = re.compile(
    r'(ов|ев|ёв|ин|ын|ий|ый|ой|ко|ук|юк|ич|ова|ева|ёва|ина|ына|ая|ская|енко|бекова|баева|уулу)$',
    re.I)

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'ң': 'n', 'ө': 'o', 'ү': 'u',
}


def fetch(table, params=''):
    import urllib.request
    url = SUPABASE + '/rest/v1/' + table + '?' + params
    req = urllib.request.Request(url, headers={'apikey': ANON, 'Authorization': 'Bearer ' + ANON})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode('utf-8'))


def slugify(text):
    s = ''.join(TRANSLIT.get(c, c) for c in text.lower())
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:60] or 'player'


def q(v):
    if v is None or v == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def normalize_name(name):
    parts = name.split()
    if len(parts) < 2 or parts[-1].lower() in TAIL or len(parts) != 2:
        return name
    a, b = parts
    la, lb = a.lower(), b.lower()
    if la in FIRST_NAMES:
        return name
    if lb in SHORT_SURNAMES:
        return name
    if lb in FIRST_NAMES:
        return b + ' ' + a
    return (b + ' ' + a) if SURNAME.search(a) and not SURNAME.search(b) else name


def parse_pdf(path, gender):
    text = subprocess.run(['pdftotext', '-layout', path, '-'],
                          capture_output=True, text=True, check=True).stdout
    rows = []

    for page in text.split('\f'):
        parsed = []
        for line in page.split('\n'):
            if not line.strip():
                continue
            m = ROW.match(line)
            if not m:
                continue
            tail_start = m.end(2)
            nums = [(mm.start() + tail_start, mm.group())
                    for mm in re.finditer(r'\d+(?:\.\d+)?', line[tail_start:])]
            if not nums:
                continue
            parsed.append({'n': int(m.group(1)), 'имя': m.group(2).strip(), 'числа': nums})

        # Граница колонок — посередине между их обычными местами на этой странице
        pairs = [p['числа'] for p in parsed if len(p['числа']) >= 2]
        if pairs:
            left = statistics.median(p[0][0] for p in pairs)
            right = statistics.median(p[1][0] for p in pairs)
            border = (left + right) / 2
        else:
            border = 40

        for p in parsed:
            single = next((v for pos, v in p['числа'] if pos < border), None)
            rows.append({'имя': normalize_name(p['имя']), 'ntrp': single, 'пол': gender})

    return rows


def main():
    if len(sys.argv) < 3:
        print('Укажи два файла: мужской и женский списки')
        return

    people_raw = parse_pdf(sys.argv[1], 'men') + parse_pdf(sys.argv[2], 'women')

    # Один человек мог попасть в список дважды — берём наивысший рейтинг
    best = {}
    for r in people_raw:
        key = (r['имя'], r['пол'])
        val = float(r['ntrp']) if r['ntrp'] else -1
        if key not in best or val > best[key][0]:
            best[key] = (val, r)
    people = [v[1] for v in best.values()]

    # Кто уже заведён: сверяем в обоих порядках имени
    existing = fetch('players', 'select=id,name,gender,ntrp_rating')

    def key(s):
        return re.sub(r'\s+', ' ', s.lower().replace('ё', 'е')).strip()

    def swapped(s):
        p = s.split()
        return p[1] + ' ' + p[0] if len(p) == 2 else s

    index = {}
    for p in existing:
        index[key(p['name'])] = p
        index[key(swapped(p['name']))] = p

    updates, inserts = [], []
    used_ids = {p['id'] for p in existing}

    for r in people:
        hit = index.get(key(r['имя'])) or index.get(key(swapped(r['имя'])))
        if hit:
            r['id'] = hit['id']
            r['вБазе'] = True
            if r['ntrp']:
                updates.append(r)
        else:
            base = slugify(r['имя'])
            pid, n = base, 2
            while pid in used_ids:
                pid = base[:56] + '-' + str(n)
                n += 1
            used_ids.add(pid)
            r['id'] = pid
            r['вБазе'] = False
            inserts.append(r)

    json.dump(people, open(os.path.join(BASE, 'import/ntrp-people.json'), 'w'),
              ensure_ascii=False, indent=1)

    lines = [
        '-- ============================================',
        '-- Рейтинг NTRP из списков клуба',
        '-- ============================================',
        '--',
        '-- Собрано скриптом import/build-ntrp-sql.py — правки вносить туда,',
        '-- иначе они потеряются при следующей сборке.',
        '--',
        '-- Из двух рейтингов берём одиночный: парный клуб отменил.',
        '-- Категорию не трогаем — она придёт отдельным списком.',
        '',
        'BEGIN;',
        '',
        '-- 1. Рейтинг тем, кто уже заведён (призёры из новостей)',
    ]

    for r in updates:
        lines.append('UPDATE players SET ntrp_rating = ' + q(float(r['ntrp'])) +
                     " WHERE id = " + q(r['id']) + ';')

    lines += ['', '-- 2. Остальные участники и члены клуба']
    for r in inserts:
        lines.append(
            'INSERT INTO players (id, name, gender, category_id, ntrp_rating, points, wins, losses) VALUES ('
            + ', '.join([q(r['id']), q(r['имя']), q(r['пол']), q('futures'),
                         q(float(r['ntrp'])) if r['ntrp'] else 'NULL', '0', '0', '0'])
            + ') ON CONFLICT (id) DO NOTHING;')

    lines += [
        '',
        '-- 3. Что получилось',
        'SELECT gender AS пол, COUNT(*) AS игроков,',
        '       COUNT(ntrp_rating) AS с_рейтингом,',
        '       ROUND(AVG(ntrp_rating)::numeric, 2) AS средний',
        'FROM players GROUP BY gender ORDER BY gender;',
        '',
        'COMMIT;',
        '',
    ]

    out = os.path.join(BASE, 'sql/import-ntrp.sql')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines))

    print('в списках:', len(people))
    print('  уже в базе:', len(updates), '— проставим рейтинг')
    print('  новых:', len(inserts))
    print('  без рейтинга в файле:', sum(1 for r in people if not r['ntrp']))
    print('файл:', out)


if __name__ == '__main__':
    main()
