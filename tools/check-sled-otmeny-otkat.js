/**
 * ПРУВЕР СТОРОЖА СЛЕДА ОТМЕНЫ.
 *
 * Откаты — настоящее прежнее состояние (update из браузера, писавший
 * только статус) плюс три обхода, которые правило обязано ловить: время
 * и имя, переданные снаружи аргументами; пустая причина, ставшая
 * причиной; непрочитанный ответ функции.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
const ФАЙЛЫ = [
    'tools/check-sled-otmeny.js',
    'js/admin/sections/vouchers.js',
    'sql/схема/skidka-otmena-sled-11nov.sql',
];

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'sled-'));
    for (const ф of ФАЙЛЫ) {
        const куда = path.join(двор, ф);
        fs.mkdirSync(path.dirname(куда), { recursive: true });
        fs.copyFileSync(path.join(корень, ф), куда);
    }
    return двор;
}

function замена(файл, было, стало) {
    return function (двор) {
        const п = path.join(двор, файл);
        const т = fs.readFileSync(п, 'utf8');
        const n = т.split(было).length - 1;
        if (n !== 1) return `якорь встречается ${n} раз`;
        fs.writeFileSync(п, т.replace(было, стало));
    };
}

const ОТКАТЫ = [
    {
        имя: 'отмена снова пишет статус из браузера',
        правка: замена('js/admin/sections/vouchers.js',
            "var result = await A.client.rpc('cancel_voucher', { p_id: id, p_reason: причина });",
            "var result = await A.client.from('discount_vouchers').update({ status: 'cancelled' }).eq('id', id).select('id');"),
        ждём: /не зовёт серверную функцию cancel_voucher/,
    },
    {
        имя: 'ответ функции перестал читаться',
        правка(двор) {
            const п = path.join(двор, 'js/admin/sections/vouchers.js');
            let т = fs.readFileSync(п, 'utf8');
            const i = т.indexOf('async function cancelVoucher');
            const j = т.indexOf('\n    }', i);
            const кусок = т.slice(i, j);
            fs.writeFileSync(п, т.slice(0, i) + кусок.replace(/\w*\.error/g, 'null') + т.slice(j));
        },
        ждём: /не читает ответ функции/,
    },
    {
        имя: 'удаление дотянулось до действующей скидки',
        правка: замена('js/admin/sections/vouchers.js',
            ".in('status', ['cancelled', 'expired'])",
            ".in('status', ['active', 'cancelled', 'expired'])"),
        ждём: /допускает статус active/,
    },
    {
        имя: 'удаление перестало ограничивать статусы вовсе',
        правка: замена('js/admin/sections/vouchers.js',
            ".in('status', ['cancelled', 'expired'])",
            ''),
        ждём: /больше не ограничивает статусы/,
    },
    {
        имя: 'колонка причины исчезла из миграции',
        правка: замена('sql/схема/skidka-otmena-sled-11nov.sql',
            'ADD COLUMN IF NOT EXISTS cancel_reason text;',
            'ADD COLUMN IF NOT EXISTS cancel_note text;'),
        ждём: /не добавляет колонку cancel_reason/,
    },
    {
        имя: 'время берётся не у сервера',
        правка: замена('sql/схема/skidka-otmena-sled-11nov.sql',
            'cancelled_at  = now(),',
            'cancelled_at  = p_when,'),
        ждём: /не ставит cancelled_at = now\(\)/,
    },
    {
        имя: 'имя и время пролезают аргументами функции',
        правка: замена('sql/схема/skidka-otmena-sled-11nov.sql',
            'cancel_voucher(p_id uuid, p_reason text DEFAULT NULL)',
            'cancel_voucher(p_id uuid, p_reason text DEFAULT NULL, p_by uuid DEFAULT NULL)'),
        ждём: /принимает лишние аргументы/,
    },
    {
        имя: 'пустая причина снова становится причиной',
        правка: замена('sql/схема/skidka-otmena-sled-11nov.sql',
            "v_reason := nullif(btrim(coalesce(p_reason, '')), '');",
            'v_reason := p_reason;'),
        ждём: /не отсекает пустую причину/,
    },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error(`  ✗ ${о.имя}: ${беда}`); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-sled-otmeny.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер следа отмены: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);
