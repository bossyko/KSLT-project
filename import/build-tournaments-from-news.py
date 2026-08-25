#!/usr/bin/env python3
"""
Собирает турниры и пьедесталы из текстов новостей.

Настоящие турниры клуба нигде, кроме новостей, не записаны: в таблице
лежали только отладочные. Тексты устроены единообразно — строка с кубком
называет категорию, следом три строки с медалями:

    🏆 Победители дружеского турнира MEGA CUP в категории FUTURES:
    🥇 Хамит Каракетов и Жанат Кыдралиев
    🥈 Эрбол Кылычев и Эльдияр Боруев
    🥉 Азамат Джумабаев и Айгерим Алижанова

На выходе три файла:
  import/podiums.json      — разобранные пьедесталы, для проверки глазами
  import/podium-people.json — список людей с пометкой, кого нет в базе
  sql/import-tournaments.sql — турниры, игроки и результаты

Очки не начисляем: points_earned = 0. Рейтинг клуб перенесёт отдельно.

Запуск:  python3 import/build-tournaments-from-news.py
"""

import json
import os
import re
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPABASE = 'https://qqkzszesviukopgjbead.supabase.co'
ANON = 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G'

MEDALS = {'🥇': 1, '🥈': 2, '🥉': 3}

# Пол этих игроков в новостях не назван — проставлен вручную клубом.
# Угадывать по окончанию фамилии нельзя: «Кан», «Наво», «кызы» собьют.
GENDER_BY_HAND = {
    'men': [
        'Адиль Валимамедов', 'Азат Сакебаев', 'Азиз Базаков', 'Азим Исаков',
        'Аширали Юсупов', 'Глеб Эртман', 'Жанат Кыдралиев', 'Кирилл Леонтьев',
        'Максим Кан', 'Малик Камалов', 'Марк Гаррета Наво', 'Сардар Умаров',
        'Фуркат Садыков', 'Эрбол Кылычев', 'Эрлан Шекербеков',
    ],
    'women': [
        'Айгерим Алижанова', 'Айдай Орозбаева', 'Альбина Сулайманова',
        'Анастасия Эртман', 'Дарья Мальбекова', 'Камила Ерходжаева',
        'Лариса Янчарук',
    ],
}

# Площадка турнира — по упоминанию в тексте новости
VENUES = [
    ('тай-брейк', 'tay-breyk'), ('тай брейк', 'tay-breyk'), ('tie-break', 'tay-breyk'),
    ('t-club', 't-club'), ('t club', 't-club'), ('т-клуб', 't-club'),
    ('каприз', 'kapriz-issyk-kul-resort-hotel'),
    ('академи', 'akademiya-tennisa-kr'),
    ('ervin', 'ervin-tennis-school'),
    ('олимпус', 'olimpus'), ('olimpus', 'olimpus'),
]

# У KIA Open категории в тексте не названы — проставлены вручную
KIA_CATEGORY = {
    ('mezhdunarodnyy-prazdnik-tennisa-kia-open-2023', 1): 'masters',
    ('mezhdunarodnyy-prazdnik-tennisa-kia-open-2023', 2): 'futures',
}

# Категории клуба — по слову в заголовке блока
CATEGORIES = [
    ('pro-masters', 'promasters'), ('pro masters', 'promasters'), ('promasters', 'promasters'),
    ('masters', 'masters'), ('challenger', 'challenger'), ('challengers', 'challenger'),
    ('futures', 'futures'), ('tour', 'tour'),
]

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'ң': 'n', 'ө': 'o', 'ү': 'u',
}


def fetch(table, params=''):
    url = SUPABASE + '/rest/v1/' + table + '?' + params
    req = urllib.request.Request(url, headers={'apikey': ANON, 'Authorization': 'Bearer ' + ANON})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode('utf-8'))


def slugify(text):
    s = ''.join(TRANSLIT.get(c, c) for c in text.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:60] or 'x'


def plain(html):
    t = re.sub(r'</p>|<br\s*/?>', '\n', html or '')
    t = re.sub(r'<[^>]+>', '', t)
    return t.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&laquo;', '«').replace('&raquo;', '»')


def clean_name(raw):
    """Убирает флаги, скобки и лишние пробелы: «Айгерим Алижанова 🇺🇿🇰🇬» → «Айгерим Алижанова»."""
    s = re.sub(r'[\U0001F1E6-\U0001F1FF]', '', raw)          # флаги
    s = re.sub(r'[\U0001F300-\U0001FAFF☀-➿]', '', s)  # прочие значки
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'[«»"]', '', s)
    return re.sub(r'\s+', ' ', s).strip(' .,-–—')


def split_pair(text):
    """Пара разделена союзом, запятой или косой чертой."""
    parts = re.split(r'\s+и\s+|\s*/\s*|\s*,\s*|\s*&\s*|\s+with\s+', text)
    return [clean_name(p) for p in parts if clean_name(p)]


# «кызы» и «уулу» — дочь и сын в кыргызских именах, пишутся со строчной
NAME_TAIL = {'кызы', 'уулу', 'оглы', 'улуу', 'кизи'}


def looks_like_person(name):
    """Отсеиваем спонсоров и обрывки: имя — это два-три слова с заглавных."""
    if len(name) < 5 or len(name) > 60:
        return False
    words = name.split()
    if len(words) < 2 or len(words) > 3:
        return False
    for w in words:
        if w.lower() in NAME_TAIL:
            continue
        # Двойное имя пишется через дефис: «Александра-Елизавета»
        if not all(re.match(r'^[А-ЯЁA-Z][а-яёa-z]*$', part) for part in w.split('-') if part):
            return False
    return True


def detect_category(title):
    low = title.lower()
    for word, key in CATEGORIES:
        if word in low:
            return key
    return None


def detect_format(title, pair_sizes):
    low = title.lower()
    if 'микст' in low or 'смешанн' in low or 'mixed' in low:
        return 'mixed_doubles'
    if 'парн' in low or 'doubles' in low:
        return 'doubles'
    if 'одиночн' in low or 'singles' in low:
        return 'singles'
    # По составу мест: если везде по одному человеку — одиночный
    return 'singles' if pair_sizes and max(pair_sizes) == 1 else 'doubles'


def detect_gender(title):
    low = title.lower()
    if 'микст' in low or 'смешанн' in low:
        return 'mixed'
    if 'женск' in low or 'победительниц' in low or 'девуш' in low:
        return 'women'
    if 'мужск' in low:
        return 'men'
    return None


def main():
    news = fetch('news', 'select=slug,title,content,published_at,image&content=not.is.null')

    tournaments = []
    people = {}
    taken_ids = set()

    for item in sorted(news, key=lambda x: x.get('published_at') or ''):
        lines = [l.strip() for l in plain(item.get('content')).split('\n') if l.strip()]

        full_text = ' '.join(lines).lower()

        # Число участников в базе обязательное, а в новостях оно есть не
        # всегда. Где написано — берём оттуда, иначе считаем по призёрам:
        # столько людей на турнире точно было
        said = re.search(r'участие\s+(\d+)|(\d+)\s*участник', full_text)
        stated_size = int(next(g for g in said.groups() if g)) if said else None
        # Берём то упоминание, которое стоит в тексте раньше: в новости про
        # MEGA CUP названы и T-club, и Тай-брейк, а турнир шёл в первом
        court = None
        best_at = None
        for word, cid in VENUES:
            at = full_text.find(word)
            if at != -1 and (best_at is None or at < best_at):
                best_at, court = at, cid

        block = None
        blocks = []
        for line in lines:
            # Заголовок блока: с кубком или просто «Мужской парный турнир:»
            plain_head = re.match(r'^(смешанн|мужск|женск|микст)[^:]{0,40}:$', line.strip(), re.I)
            if line.startswith('🏆') or plain_head:
                block = {'заголовок': clean_name(line).rstrip(':'), 'места': []}
                blocks.append(block)
                continue
            m = re.match(r'^([🥇🥈🥉])\s*(.+)$', line)
            if m and block is not None:
                names = [n for n in split_pair(m.group(2)) if looks_like_person(n)]
                if names:
                    block['места'].append({'место': MEDALS[m.group(1)], 'кто': names})

        blocks = [b for b in blocks if b['места']]
        if not blocks:
            continue

        for i, b in enumerate(blocks, 1):
            sizes = [len(p['кто']) for p in b['места']]
            title = b['заголовок']
            cat = detect_category(title) or detect_category(item['title'])
            if not cat:
                cat = KIA_CATEGORY.get((item['slug'], i)) or 'friendly'
            fmt = detect_format(title, sizes)
            gender = detect_gender(title) or detect_gender(item['title'])

            # Название турнира: имя из новости + категория и разряд
            suffix = []
            if cat:
                suffix.append({'promasters': 'Pro-Masters', 'masters': 'Masters',
                               'challenger': 'Challenger', 'futures': 'Futures',
                               'tour': 'Tour', 'friendly': 'дружеский'}[cat])
            suffix.append({'singles': 'одиночный', 'doubles': 'парный', 'mixed_doubles': 'микст'}[fmt])
            if gender == 'women' and fmt != 'mixed_doubles':
                suffix.append('женский')
            elif gender == 'men' and fmt != 'mixed_doubles':
                suffix.append('мужской')

            name = item['title'].strip()
            if len(blocks) > 1:
                # В Summer Breeze два мужских парных: основной и дополнительный.
                # Без пометки названия совпадали до буквы
                if 'дополнительн' in title.lower():
                    suffix.append('дополнительный')

                # Не повторяем то, что уже сказано в заголовке новости:
                # «ДРУЖЕСКИЙ ПАРНЫЙ ТУРНИР — … — дружеский, парный, женский»
                # занимало четыре строки в карточке
                low_name = name.lower()
                suffix = [w for w in suffix if w.lower() not in low_name]
                if suffix:
                    name = name + ' — ' + ', '.join(suffix)

            date = (item.get('published_at') or '')[:10]
            if not date:
                continue                      # черновик — ждёт уточнений

            # Обрезка до 52 знаков срезала хвост «женский»/«мужской», и два
            # турнира получали один адрес, а их призёры слипались в один
            # пьедестал. Различающую часть держим до конца
            tid = slugify(name)[:52] + '-' + date.replace('-', '')[:8]
            base_id, n = tid, 2
            while tid in taken_ids:
                tid = base_id[:50] + '-' + str(n)
                n += 1
            taken_ids.add(tid)

            for place in b['места']:
                for person in place['кто']:
                    people.setdefault(person, {'имя': person, 'турниров': 0})
                    people[person]['турниров'] += 1

            tournaments.append({
                'id': tid,
                'title': name,
                'slug_новости': item['slug'],
                'дата': date,
                'категория': cat,
                'разряд': fmt,
                'пол': gender,
                'обложка': item.get('image'),
                'площадка': court,
                'участников': stated_size or sum(len(p['кто']) for p in b['места']),
                'места': b['места'],
            })

    # Одно событие, две записи: старая новость на сайте и присланная в
    # архиве. Состав призёров совпадает до фамилии — оставляем первую
    by_lineup = {}
    unique = []
    for t in tournaments:
        key = (t['разряд'], t['пол'],
               tuple(sorted(n for m in t['места'] for n in m['кто'])))
        if key in by_lineup:
            by_lineup[key]['дубли'] = by_lineup[key].get('дубли', []) + [t['slug_новости']]
            continue
        by_lineup[key] = t
        unique.append(t)
    tournaments = unique

    # Кого уже знаем в базе
    existing = fetch('players', 'select=id,name')
    known = {}
    for p in existing:
        known[p['name'].lower().replace('ё', 'е').strip()] = p['id']

    def find_player(name):
        key = name.lower().replace('ё', 'е').strip()
        if key in known:
            return known[key]
        parts = key.split()
        if len(parts) == 2:
            swapped = parts[1] + ' ' + parts[0]
            if swapped in known:
                return known[swapped]
        return None

    for name, info in people.items():
        info['id_в_базе'] = find_player(name)
        info['новый'] = info['id_в_базе'] is None

    # Файл для чтения пишем после сборки SQL: пол турнира определяется там,
    # и в JSON попадали ещё не заполненные значения
    json.dump(sorted(people.values(), key=lambda x: -x['турниров']),
              open(os.path.join(BASE, 'import/podium-people.json'), 'w'),
              ensure_ascii=False, indent=1)

    build_sql(tournaments, people)

    json.dump(tournaments, open(os.path.join(BASE, 'import/podiums.json'), 'w'),
              ensure_ascii=False, indent=1)

    print('турниров:', len(tournaments))
    print('людей:', len(people), '| из них новых:', sum(1 for p in people.values() if p['новый']))
    print('мест:', sum(len(t['места']) for t in tournaments))


def q(v):
    if v is None or v == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


# Место на пьедестале — в обозначениях, которые понимает админка
ROUND = {1: 'W', 2: 'F', 3: '3RD'}


def build_sql(tournaments, people):
    lines = [
        '-- ============================================',
        '-- Турниры и призёры из новостей',
        '-- ============================================',
        '--',
        '-- Собрано скриптом import/build-tournaments-from-news.py — правки',
        '-- вносить туда, иначе они потеряются при следующей сборке.',
        '--',
        '-- Очки не начисляем: points_earned = 0. Рейтинг клуб перенесёт',
        '-- отдельно, а карточки игроков сведутся с учётными записями, когда',
        '-- люди начнут регистрироваться.',
        '--',
        '-- Игроки заводятся именем и полом: больше в новостях ничего нет.',
        '',
        'BEGIN;',
        '',
        '-- 0. Прошлая заливка, если была. У части турниров адреса совпадали,',
        '--    и призёры женского и мужского разрядов слиплись в один',
        '--    пьедестал — такие записи надо переписать начисто.',
        '--    В таблице только турниры из новостей, чужого здесь нет.',
        'DELETE FROM tournament_results;',
        'DELETE FROM tournaments;',
        '',
        '-- 1. Игроки-призёры (уже заведённых пропускаем)',
    ]

    # Пол игрока — по турнирам, где он выступал
    gender_of = {}
    for t in tournaments:
        if t['пол'] in ('men', 'women'):
            for place in t['места']:
                for name in place['кто']:
                    gender_of.setdefault(name, t['пол'])

    for gender, names in GENDER_BY_HAND.items():
        for name in names:
            gender_of.setdefault(name, gender)

    # Категория — по самой сильной, в которой человек играл. Иначе все
    # оказались бы в Futures, включая победителей Masters
    RANK = ['promasters', 'masters', 'tour', 'challenger', 'futures', 'friendly']
    category_of = {}
    for t in tournaments:
        cat = t['категория'] or 'friendly'
        for place in t['места']:
            for name in place['кто']:
                cur = category_of.get(name)
                if cur is None or RANK.index(cat) < RANK.index(cur):
                    category_of[name] = cat

    # Дружеские турниры рейтинга не дают: такие игроки идут в Futures
    for name, cat in list(category_of.items()):
        if cat == 'friendly':
            category_of[name] = 'futures'

    # Пол турнира в базе обязателен. Где в заголовке не назван — определяем
    # по составу призёров: только мужчины, только женщины или вперемешку
    for t in tournaments:
        if t['пол']:
            continue
        genders = {gender_of.get(n) for place in t['места'] for n in place['кто']}
        genders.discard(None)
        if genders == {'men'}:
            t['пол'] = 'men'
        elif genders == {'women'}:
            t['пол'] = 'women'
        else:
            t['пол'] = 'mixed'

    ids = {}
    used = set()
    for name, info in sorted(people.items()):
        if info['id_в_базе']:
            ids[name] = info['id_в_базе']
            continue
        base = slugify(name)
        pid, n = base, 2
        while pid in used:
            pid = base + '-' + str(n)
            n += 1
        used.add(pid)
        ids[name] = pid
        lines.append(
            'INSERT INTO players (id, name, gender, category_id, points, wins, losses) VALUES ('
            + ', '.join([q(pid), q(name), q(gender_of.get(name)),
                         q(category_of.get(name, 'futures')), '0', '0', '0'])
            + ') ON CONFLICT (id) DO NOTHING;'
        )

    lines += ['', '-- 2. Турниры']
    for t in tournaments:
        lines.append(
            'INSERT INTO tournaments (id, title, category_id, gender, format, status, '
            'date_start, date_end, image, court_id, max_participants, published_at) VALUES ('
            + ', '.join([
                q(t['id']), q(t['title']), q(t['категория']), q(t['пол']), q(t['разряд']),
                # Обложку не ставим: у новостей это вертикальные афиши, и в
                # карточке турнира они обрезаются, а название ложится поверх
                q('completed'), q(t['дата']), q(t['дата']), 'NULL', q(t['площадка']),
                str(t['участников']),
                q(t['дата'] + ' 09:00:00+06') + '::timestamptz',
            ]) + ') ON CONFLICT (id) DO NOTHING;'
        )

    lines += ['', '-- 3. Пьедесталы. Очки нулевые — начислим, когда перенесём рейтинг']
    for t in tournaments:
        for place in t['места']:
            for name in place['кто']:
                lines.append(
                    'INSERT INTO tournament_results (tournament_id, player_id, round_reached, '
                    'points_earned, season) VALUES ('
                    + ', '.join([q(t['id']), q(ids[name]), q(ROUND[place['место']]), '0',
                                 # Сезон — год турнира, как проставляет админка
                                 t['дата'][:4]])
                    + ') ON CONFLICT (tournament_id, player_id) DO NOTHING;'
                )

    lines += [
        '',
        '-- 4. Что получилось',
        'SELECT t.date_start AS дата, t.category_id AS категория, t.format AS разряд,',
        '       t.title AS турнир, COUNT(r.player_id) AS призёров',
        'FROM tournaments t LEFT JOIN tournament_results r ON r.tournament_id = t.id',
        'GROUP BY t.id, t.date_start, t.category_id, t.format, t.title',
        'ORDER BY t.date_start;',
        '',
        'COMMIT;',
        '',
    ]

    out = os.path.join(BASE, 'sql/import-tournaments.sql')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines))
    print('файл:', out)

    no_gender = sorted(n for n in people if not gender_of.get(n))
    if no_gender:
        print('пол не определён (' + str(len(no_gender)) + '):', ', '.join(no_gender))


if __name__ == '__main__':
    main()
