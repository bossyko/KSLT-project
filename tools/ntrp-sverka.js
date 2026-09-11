/**
 * Сверка таблиц NTRP с карточками игроков
 * =======================================
 *
 * Читающий шаг: ничего не меняет, только показывает, что получится. Заливать
 * заново нельзя — на карточках висят заявки, история матчей и очки, и новая
 * заливка их порвёт. Поэтому обновляем существующие и заводим только тех,
 * кого в базе нет.
 *
 * Имена в таблицах и в базе пишут по-разному: где-то латиницей, где-то с
 * двойными буквами, где-то переставлены имя и фамилия. Сравниваем по ключу —
 * так же, как это делает ensure-player-card при входе игрока.
 *
 * Запуск:  node tools/ntrp-sverka.js
 * Итог:    tools/_ntrp-plan.json — им же пользуется генератор SQL
 */

const fs = require('fs');
const path = require('path');

const ПАПКА = '/Users/bossyko/Documents/Screen';
const ФАЙЛЫ = [
    { файл: 'Мужской список NTRP.xlsx', пол: 'men' },
    { файл: 'Рейтинг жен NTRP_Кыргызстан.xlsx', пол: 'women' }
];

// ---- Ключ имени: «Konstantin Han» и «Константин Хан» должны совпасть ----

const КИРИЛЛИЦА = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
    ң: 'n', ү: 'u', ө: 'o'
};

function транслит(имя) {
    return String(имя || '').toLowerCase().split('').map(function (с) {
        return КИРИЛЛИЦА[с] !== undefined ? КИРИЛЛИЦА[с] : с;
    }).join('');
}

/**
 * Ключ сравнения. Схлопываем двойные буквы, приводим y к i и сортируем слова:
 * «Хан Константин» и «Константин Хан» — один человек.
 */
function ключ(имя) {
    return транслит(имя)
        .replace(/[^a-z]+/g, '-')
        .replace(/y/g, 'i')
        .replace(/(.)\1+/g, '$1')
        .split('-')
        .filter(Boolean)
        .sort()
        .join('-');
}

/**
 * Расстояние между ключами: на сколько букв расходятся написания.
 *
 * Одного ключа мало: «Гудаджанов» и «Гудажанов», «Сейфутдинов» и
 * «Сайфутдинов» — один человек, а ключи разные. Заводить им вторую карточку
 * нельзя: рейтинг уйдёт в пустую, а в заявках останется прежняя.
 */
function расхождение(a, b) {
    if (Math.abs(a.length - b.length) > 3) return 99;
    let пред = [];
    for (let j = 0; j <= b.length; j++) пред[j] = j;
    for (let i = 1; i <= a.length; i++) {
        const тек = [i];
        for (let j = 1; j <= b.length; j++) {
            тек[j] = Math.min(пред[j] + 1, тек[j - 1] + 1,
                пред[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        пред = тек;
    }
    return пред[b.length];
}

// ---- Чтение xlsx без библиотек: это zip с XML внутри ----

function читатьXlsx(путь) {
    const { execFileSync } = require('child_process');
    const код = `
import openpyxl, json, sys
ws = openpyxl.load_workbook(sys.argv[1], data_only=True).worksheets[0]
строки = []
for r in ws.iter_rows(min_row=2, values_only=True):
    n, имя, од, пар = (list(r)+[None]*4)[:4]
    if not имя or n is None: continue
    if not isinstance(од, (int, float)) or not isinstance(пар, (int, float)): continue
    строки.append({'имя': str(имя).strip(), 'од': float(од), 'пар': float(пар)})
print(json.dumps(строки, ensure_ascii=False))
`;
    return JSON.parse(execFileSync('python3', ['-c', код, путь], { maxBuffer: 1 << 24 }));
}

// ---- Сверка ----

/** Карточки игроков из боевой базы: читаются публичным ключом, как это делает сайт. */
function загрузитьИгроков() {
    const { execFileSync } = require('child_process');
    const конфиг = fs.readFileSync(path.join(__dirname, '..', 'js', 'supabase-config.js'), 'utf8');
    const url = (конфиг.match(/'(https:\/\/[a-z0-9]+\.supabase\.co)'/) || [])[1];
    const ключДоступа = (конфиг.match(/'(sb_publishable_[A-Za-z0-9_-]+)'/) || [])[1];
    if (!url || !ключДоступа) throw new Error('не нашёл адрес базы в js/supabase-config.js');

    const поля = 'id,name,name_en,gender,ntrp_singles,ntrp_doubles,is_member,is_guest';
    const ответ = execFileSync('curl', ['-s',
        url + '/rest/v1/players?select=' + поля + '&limit=1000',
        '-H', 'apikey: ' + ключДоступа], { maxBuffer: 1 << 24 }).toString();
    return JSON.parse(ответ);
}

async function главная() {
    const база = загрузитьИгроков();

    // Один ключ может достаться двоим — тёзкам. Держим список, а не одного
    const поКлючу = new Map();
    база.forEach(function (p) {
        [p.name, p.name_en].filter(Boolean).forEach(function (вариант) {
            const к = ключ(вариант);
            if (!поКлючу.has(к)) поКлючу.set(к, []);
            if (поКлючу.get(к).indexOf(p) === -1) поКлючу.get(к).push(p);
        });
    });

    const план = { обновить: [], похожие: [], завести: [], спорные: [], безИзменений: [] };

    ФАЙЛЫ.forEach(function (ф) {
        const строки = читатьXlsx(path.join(ПАПКА, ф.файл));
        строки.forEach(function (с) {
            const найдены = поКлючу.get(ключ(с.имя)) || [];

            if (найдены.length > 1) {
                план.спорные.push({ имя: с.имя, пол: ф.пол, од: с.од, пар: с.пар,
                    кандидаты: найдены.map(function (p) { return p.id + ' (' + p.name + ')'; }) });
                return;
            }
            if (найдены.length === 0) {
                // Прежде чем заводить карточку, ищем почти такое же имя: чаще
                // всего это опечатка в одной из сторон, а не новый человек
                const k = ключ(с.имя);
                let ближайший = null, лучшее = 99;
                база.forEach(function (p) {
                    if (!p.name) return;
                    const d = расхождение(k, ключ(p.name));
                    if (d < лучшее) { лучшее = d; ближайший = p; }
                });

                if (ближайший && лучшее <= 2) {
                    план.похожие.push({
                        файлИмя: с.имя, пол: ф.пол, од: с.од, пар: с.пар,
                        id: ближайший.id, имя: ближайший.name, расхождение: лучшее,
                        былоОд: ближайший.ntrp_singles, былоПар: ближайший.ntrp_doubles
                    });
                    return;
                }
                план.завести.push({ имя: с.имя, пол: ф.пол, од: с.од, пар: с.пар });
                return;
            }

            const p = найдены[0];
            const былоОд = p.ntrp_singles;
            const былоПар = p.ntrp_doubles;
            if (былоОд === с.од && былоПар === с.пар) {
                план.безИзменений.push({ id: p.id, имя: p.name });
                return;
            }
            план.обновить.push({
                id: p.id, имя: p.name, файлИмя: с.имя,
                былоОд: былоОд, сталоОд: с.од,
                былоПар: былоПар, сталоПар: с.пар
            });
        });
    });

    fs.writeFileSync(path.join(__dirname, '_ntrp-plan.json'),
        JSON.stringify(план, null, 2), 'utf8');

    console.log('\n=== Сверка NTRP ===\n');
    console.log('Карточек в базе:            ' + база.length);
    console.log('Совпали, рейтинг тот же:    ' + план.безИзменений.length);
    console.log('Совпали, рейтинг меняется:  ' + план.обновить.length);
    console.log('Похожие — решает Costa:     ' + план.похожие.length);
    console.log('В базе нет — завести:       ' + план.завести.length);
    console.log('Спорные совпадения:         ' + план.спорные.length);

    if (план.обновить.length) {
        console.log('\n--- Меняется рейтинг (первые 25) ---');
        план.обновить.slice(0, 25).forEach(function (о) {
            console.log('  ' + о.имя.padEnd(28) +
                ' од ' + String(о.былоОд).padStart(5) + ' → ' + о.сталоОд +
                '   пар ' + String(о.былоПар).padStart(5) + ' → ' + о.сталоПар);
        });
        if (план.обновить.length > 25) console.log('  ... ещё ' + (план.обновить.length - 25));
    }

    if (план.похожие.length) {
        console.log('\n--- Похожие имена: один человек или двое? ---');
        план.похожие.forEach(function (п) {
            console.log('  в таблице «' + п.файлИмя + '» ~ в базе «' + п.имя + '» [' + п.id + ']' +
                '  расхождение ' + п.расхождение +
                '   од ' + п.былоОд + ' → ' + п.од + ', пар ' + п.былоПар + ' → ' + п.пар);
        });
    }

    if (план.завести.length) {
        console.log('\n--- Новые карточки (первые 25) ---');
        план.завести.slice(0, 25).forEach(function (н) {
            console.log('  ' + н.имя.padEnd(28) + ' ' + н.пол + '  од ' + н.од + '  пар ' + н.пар);
        });
        if (план.завести.length > 25) console.log('  ... ещё ' + (план.завести.length - 25));
    }

    if (план.спорные.length) {
        console.log('\n--- Спорные: один ключ на нескольких ---');
        план.спорные.forEach(function (с) {
            console.log('  ' + с.имя + ' → ' + с.кандидаты.join(' | '));
        });
    }

    console.log('\nПодробности: tools/_ntrp-plan.json\n');
}

главная();
