/**
 * ВСЯ ЗАМОРОЗКА ОДНОЙ КОМАНДОЙ.
 *
 * Правила читают код и говорят, не разъехался ли он с принятыми решениями.
 * Прувер берёт КОПИЮ файлов, возвращает в неё прежнее значение и требует,
 * чтобы правило упало — иначе правило ничего не держит.
 *
 *   node tools/check-vse.js          — правила и прувер
 *   node tools/check-vse.js --быстро — только правила, без прувера
 */
const path = require('path');
const { execFileSync } = require('child_process');

const быстро = process.argv.includes('--быстро');
const КУСКИ = [
    ['шапка',                'check-header.js',       'check-header-otkat.js'],
    ['первый экран',        'check-geroy.js',        'check-geroy-otkat.js'],
    ['раздел live',         'check-live.js',         'check-live-otkat.js'],
    ['цвет статусов',       'check-turniry-cvet.js', 'check-turniry-cvet-otkat.js'],
    ['узкие виды турниров', 'check-turniry-vidy.js', 'check-turniry-vidy-otkat.js'],
    ['новости',             'check-novosti.js',      'check-novosti-otkat.js'],
    ['значки',              'check-znachki.js',      'check-znachki-otkat.js'],
    ['коробка-гейт',        'check-korobka.js',      'check-korobka-otkat.js'],
    ['рейтинг',             'check-reyting.js',      'check-reyting-otkat.js'],
    ['давай сыграем',       'check-igroki.js',       'check-igroki-otkat.js'],
    ['где играть',          'check-venues.js',       'check-venues-otkat.js'],
    ['о проекте',           'check-about.js',        'check-about-otkat.js'],
    ['стань спонсором',     'check-sponsor.js',      'check-sponsor-otkat.js'],
    ['спонсоры',            'check-sponsors.js',     'check-sponsors-otkat.js'],
    ['подвал',              'check-footer.js',       'check-footer-otkat.js'],
    ['страница матча',      'check-live-stranica.js','check-live-stranica-otkat.js'],
    ['судейское окно',      'check-sudya.js',        'check-sudya-otkat.js'],
    ['страница турниров',   'check-turniry.js',      'check-turniry-otkat.js'],
    ['лента фильтров',      'check-lenta-filtrov.js', 'check-lenta-filtrov-otkat.js'],
    ['страница турнира',    'check-stranica-turnira.js', 'check-stranica-turnira-otkat.js'],
    ['обложка и вкладки',   'check-oblozhka.js',     'check-oblozhka-otkat.js'],
    ['статус турнира',      'check-status.js',       'check-status-otkat.js'],
    ['форма турнира',       'check-trn-forma.js',    'check-trn-forma-otkat.js'],
    ['вёрстка заявок',      'check-zayavki-verstka.js', 'check-zayavki-verstka-otkat.js'],
    ['оболочка окна',       'check-okno-obolochka.js', 'check-okno-obolochka-otkat.js'],
    ['жеребьёвка',          'check-zhrebiy.js',      'check-zhrebiy-otkat.js'],
    ['места в группе',      'check-mesta-v-gruppe.js','check-mesta-v-gruppe-otkat.js'],
    ['плей-офф',            'check-setka-plei-off.js','check-setka-plei-off-otkat.js'],
    ['алфавит групп',      'check-alfavit-grupp.js','check-alfavit-grupp-otkat.js'],
    ['очки и лиги',        'check-ochki-i-ligi.js','check-ochki-i-ligi-otkat.js'],
    ['проход без игры',    'check-bye-ne-zapiraet.js','check-bye-ne-zapiraet-otkat.js'],
    ['пол турнира',        'check-pol-turnira.js',   'check-pol-turnira-otkat.js'],
    ['порядок очереди',    'check-ochered-poryadok.js','check-ochered-poryadok-otkat.js'],
    ['кнопка «Снять»',     'check-knopka-snyat.js',  'check-knopka-snyat-otkat.js'],
    ['место в рейтинге',   'check-mesto-v-reytinge.js','check-mesto-v-reytinge-otkat.js'],
    ['метка группы',       'check-metka-gruppy.js',    'check-metka-gruppy-otkat.js'],
    ['прогноз выключен',   'check-prognoz-vyklyuchen.js','check-prognoz-vyklyuchen-otkat.js'],
    ['цифры обложки',      'check-cifry-oblozhki.js',  'check-cifry-oblozhki-otkat.js'],
    ['телефон раздела',    'check-telefon-razdela.js', 'check-telefon-razdela-otkat.js'],
    ['обзорная «Услуги»',  'check-uslugi.js',          'check-uslugi-otkat.js'],
    ['страница «Корты»',   'check-korty.js',           'check-korty-otkat.js'],
    ['страница «Тренеры»', 'check-trenery.js',         'check-trenery-otkat.js'],
    ['поиск игрока',       'check-poisk-igroka.js',    'check-poisk-igroka-otkat.js'],
    ['страница «Новости»', 'check-novosti-stranica.js', 'check-novosti-stranica-otkat.js'],
    ['страница новости', 'check-novost-statya.js', 'check-novost-statya-otkat.js'],
    ['админка «Новости»', 'check-admin-novosti.js', 'check-admin-novosti-otkat.js'],
    ['админка «Новости», список', 'check-admin-novosti-spisok.js', 'check-admin-novosti-spisok-otkat.js'],
    ['вкладка «Новости» турнира', 'check-turnir-novost.js', 'check-turnir-novost-otkat.js'],
    ['голоса вызова', 'check-golosa-storony.js', 'check-golosa-storony-otkat.js'],
    ['удаление турнира', 'check-udalenie-turnira.js', 'check-udalenie-turnira-otkat.js'],
    ['шов адреса клетки', 'check-shov-adresa.js', 'check-shov-adresa-otkat.js'],
    /* ФАЙЛ БЫЛ, А В ПРОГОНЕ ЕГО НЕ БЫЛО. check-draw.js лежал в tools/ с
       сентября, считал провалы и никому о них не говорил: ни строки итога,
       ни кода выхода, ни записи здесь. Нашёл Костя вопросом «а что прувер
       не сделал». 09.10 файлу дан код выхода, написан прувер, запись
       заведена. */
    ['жеребьёвка и сетки за места', 'check-draw.js', 'check-draw-otkat.js'],
    ['обзорная «Инфо»', 'check-info-obzor.js', 'check-info-obzor-otkat.js'],
    ['страницы «Инфо»', 'check-info-stranicy.js', 'check-info-stranicy-otkat.js'],
    ['«Цены»', 'check-ceny.js', 'check-ceny-otkat.js'],
    ['страница игрока', 'check-stranica-igroka.js', 'check-stranica-igroka-otkat.js'],
    ['копии сайта в приложении', 'check-mobilnye-kopii.js', 'check-mobilnye-kopii-otkat.js'],
    ['общий слой кабинета', 'check-kabinet-obshchiy.js', 'check-kabinet-obshchiy-otkat.js'],
    ['списки кабинета на телефоне', 'check-kabinet-spiski.js', 'check-kabinet-spiski-otkat.js'],
    ['баллы и платежи кабинета', 'check-kabinet-bally-platezhi.js', 'check-kabinet-bally-platezhi-otkat.js'],
    ['разделы кабинета', 'check-kabinet-razdely.js', 'check-kabinet-razdely-otkat.js'],
    ['шрифт управлений', 'check-shrift-upravleniy.js', 'check-shrift-upravleniy-otkat.js'],
    ['английская ветка кортов', 'check-korty-trenery-angliyskiy.js', 'check-korty-trenery-angliyskiy-otkat.js'],
    ['страница корта и тренера', 'check-stranica-korta.js', 'check-stranica-korta-otkat.js'],
    ['спонсоры и услуги', 'check-sponsory-uslugi.js', 'check-sponsory-uslugi-otkat.js'],
    ['пункт спонсоров в «Инфо»', 'check-menyu-sponsory.js', 'check-menyu-sponsory-otkat.js'],
    ['обзор баттлов и вызов', 'check-battly.js', 'check-battly-otkat.js'],
    ['табло и подтверждение ваучера', 'check-tablo-vaucher.js', 'check-tablo-vaucher-otkat.js'],
    ['ссылки вместо div', 'check-ssylki-kartochek.js', 'check-ssylki-kartochek-otkat.js'],
    ['политика безопасности', 'check-csp.js', 'check-csp-otkat.js'],
    ['ровные ряды', 'check-rovnye-ryady.js', 'check-rovnye-ryady-otkat.js'],
    ['тихий текст', 'check-tihiy-tekst.js', 'check-tihiy-tekst-otkat.js'],
    ['краска акцента', 'check-kraska-akcenta.js', 'check-kraska-akcenta-otkat.js'],
    ['лицо без фотографии', 'check-lico.js', 'check-lico-otkat.js'],
    ['порядок блоков сетки', 'check-poryadok-blokov.js', 'check-poryadok-blokov-otkat.js'],
    ['одно определение на понятие', 'check-odno-opredelenie.js', 'check-odno-opredelenie-otkat.js'],
    ['мёртвое и лишнее', 'check-mertvoe.js', 'check-mertvoe-otkat.js'],
    ['цвет с именем', 'check-cvet-imenem.js', 'check-cvet-imenem-otkat.js'],
    ['отказ одной краской', 'check-otkaz-odnoy-kraskoy.js', 'check-otkaz-odnoy-kraskoy-otkat.js'],
    ['эфир одной краской', 'check-efir-odnoy-kraskoy.js', 'check-efir-odnoy-kraskoy-otkat.js'],
    ['сторона игрока', 'check-storona-odno-opredelenie.js', 'check-storona-odno-opredelenie-otkat.js'],
    ['отсчёт и скидка', 'check-otschet-ozhidanie.js', 'check-otschet-ozhidanie-otkat.js'],
    ['лестница прозрачности', 'check-lestnica-prozrachnosti.js', 'check-lestnica-prozrachnosti-otkat.js'],
    ['версии файлов', 'check-versii-fajlov.js', 'check-versii-fajlov-otkat.js'],
    ['точки останова', 'check-tochki-ostanova.js', 'check-tochki-ostanova-otkat.js'],
    ['посев: половины', 'check-posev-polovin.js', 'check-posev-polovin-otkat.js'],
    ['инлайн-стили в js', 'check-inlayn-stili.js', 'check-inlayn-stili-otkat.js'],
    ['адрес сайта', 'check-adres-sayta.js', 'check-adres-sayta-otkat.js'],
    ['слой админки', 'check-admin-sloy.js', 'check-admin-sloy-otkat.js'],
    ['лестница роли', 'check-lestnica-roli.js', 'check-lestnica-roli-otkat.js'],
    ['радиусы', 'check-radiusy.js', 'check-radiusy-otkat.js'],
    ['время клуба', 'check-vremya-kluba.js', 'check-vremya-kluba-otkat.js'],
    ['движение и межстрочные', 'check-dvizhenie-i-mezhstrochnye.js', 'check-dvizhenie-i-mezhstrochnye-otkat.js'],
    ['сетки плиток', 'check-setki-plitok.js', 'check-setki-plitok-otkat.js'],
    ['тело новости', 'check-telo-novosti.js', 'check-telo-novosti-otkat.js'],
    ['поле содержимого', 'check-pole-soderzhimogo.js', 'check-pole-soderzhimogo-otkat.js'],
    ['лестница окна', 'check-lestnica-okna.js', 'check-lestnica-okna-otkat.js'],
    ['язык вкладки', 'check-yazyk-vkladki.js', 'check-yazyk-vkladki-otkat.js'],
    ['палитра различителей', 'check-palitra-kategoriy.js', 'check-palitra-kategoriy-otkat.js'],
    ['статус «идёт»', 'check-status-idet.js', 'check-status-idet-otkat.js'],
    ['краски холста', 'check-kraski-holsta.js', 'check-kraski-holsta-otkat.js'],
    ['печатная карточка', 'check-kartochka-holsta.js', 'check-kartochka-holsta-otkat.js'],
    ['экранирование html', 'check-ekranirovanie.js', 'check-ekranirovanie-otkat.js'],
    ['разбор счёта', 'check-razbor-schyota.js', 'check-razbor-schyota-otkat.js'],
    ['роль в инлайнах js', 'check-rol-v-inlaynah.js', 'check-rol-v-inlaynah-otkat.js'],
    ['бейдж роли', 'check-rol-badzh.js', 'check-rol-badzh-otkat.js'],
    ['важность', 'check-vazhnost.js', 'check-vazhnost-otkat.js'],
    ['копии функций', 'check-kopii-funkciy.js', 'check-kopii-funkciy-otkat.js'],
    ['отказ от движения', 'check-otkaz-ot-dvizheniya.js', 'check-otkaz-ot-dvizheniya-otkat.js'],
    ['статус турнира', 'check-status-turnira.js', 'check-status-turnira-otkat.js'],
    ['счёт в доме', 'check-schyot-doma.js', 'check-schyot-doma-otkat.js'],
    ['тона бейджа админки', 'check-badge-tona.js', 'check-badge-tona-otkat.js'],
    ['мёртвые классы кабинета', 'check-mertvye-klassy.js', 'check-mertvye-klassy-otkat.js'],
    ['лестница разрядов', 'check-lestnica-razryadov.js', 'check-lestnica-razryadov-otkat.js'],
    ['админка одним языком', 'check-admin-odin-yazyk.js', 'check-admin-odin-yazyk-otkat.js'],
    ['чекбокс и имена', 'check-chekboks-i-imena.js', 'check-chekboks-i-imena-otkat.js'],
    ['липкая шапка и роли кнопок', 'check-lipkaya-shapka-i-rol-knopki.js',
     'check-lipkaya-shapka-i-rol-knopki-otkat.js'],
    ['значок и цель нажатия', 'check-znachok-i-cel-nazhatiya.js',
     'check-znachok-i-cel-nazhatiya-otkat.js'],
    ['окна в одной оболочке', 'check-okna-odna-obolochka.js',
     'check-okna-odna-obolochka-otkat.js'],
    ['тело таблицы', 'check-telo-tablicy.js', 'check-telo-tablicy-otkat.js'],
    ['имена классов', 'check-imena-klassov-zhivye.js', 'check-imena-klassov-zhivye-otkat.js'],
    ['пустое состояние', 'check-pustoe-sostoyanie.js', 'check-pustoe-sostoyanie-otkat.js'],
    ['семь находок обхода', 'check-sem-nahodok.js', 'check-sem-nahodok-otkat.js'],
    ['относительные пути', 'check-puti-otnositelnye.js', 'check-puti-otnositelnye-otkat.js'],
    ['язык страницы', 'check-yazyk-odin-dom.js', 'check-yazyk-odin-dom-otkat.js'],
    ['офлайн-служба', 'check-sluzhba-i-koren.js', 'check-sluzhba-i-koren-otkat.js'],
    ['подписи в словаре', 'check-podpisi-v-slovare.js', 'check-podpisi-v-slovare-otkat.js'],
    ['фразы в словаре', 'check-frazy-v-slovare.js', 'check-frazy-v-slovare-otkat.js'],
    ['выбор языка одним зовом', 'check-vybor-yazyka.js', 'check-vybor-yazyka-otkat.js'],
    ['кыргызский вслух', 'check-kyrgyzskiy-polnyy.js', 'check-kyrgyzskiy-polnyy-otkat.js'],
    ['три пункта долга', 'check-tri-dolga.js', 'check-tri-dolga-otkat.js'],
    ['близнецы и дома', 'check-vitrina.js', 'check-vitrina-otkat.js'],
    ['сотрудник не член клуба', 'check-sotrudnik-ne-chlen.js', 'check-sotrudnik-ne-chlen-otkat.js'],
    ['карточка не заводится сотруднику', 'check-karta-ne-sotrudniku.js', 'check-karta-ne-sotrudniku-otkat.js'],
    ['остаток близнецов', 'check-bliznetsy-ostatok.js', 'check-bliznetsy-ostatok-otkat.js'],
    ['ваучерный блок', 'check-vaucher-blok.js', 'check-vaucher-blok-otkat.js'],
    ['по языкам, а не вперемешку', 'check-yazyk-bez-peremeshki.js', 'check-yazyk-bez-peremeshki-otkat.js'],
    ['нажатия полосы страниц', 'check-polosa-nazhatiya.js', 'check-polosa-nazhatiya-otkat.js'],
    ['печатный лист отчёта', 'check-pechatnyy-list.js', 'check-pechatnyy-list-otkat.js'],
    ['чекбокс массового выбора', 'check-chekboks-vybora.js', 'check-chekboks-vybora-otkat.js'],
    ['запирание фокуса в окне', 'check-lovushka-zapiranie.js', 'check-lovushka-zapiranie-otkat.js']
];

function прогнать(файл) {
    try {
        const out = execFileSync(process.execPath, [path.join(__dirname, файл)], { encoding: 'utf8' });
        return { ок: true, вывод: out };
    } catch (e) { return { ок: false, вывод: (e.stdout || '') + (e.stderr || '') }; }
}
const число = (текст, шаблон) => { const м = текст.match(шаблон); return м ? м[1] : '?'; };

/* ── общая предпосылка: css вообще должен разбираться ────────────────────── */
/* 23.09 в style.css нашлась ЛИШНЯЯ закрывающая скобка (строка 9440, блок
   .sp-offer). Браузер такую ошибку молча проглатывает — страница рисовалась
   как ни в чём не бывало, — а любой инструмент, который считает структуру по
   скобкам, с этого места врёт. Скобка лежала в коде ещё с коммита 21.09.
   Проверка стоит первой: если файл не разбирается, всё остальное считает
   неизвестно что. */
const fs = require('fs');

/* ── общая предпосылка: копии общих правил обязаны совпадать ─────────────── */
/* js/kslt-rules.js лежит копией в mobile/www/js/ — Capacitor раскладывает ту
   папку и в Android, и в iOS. Сверял их tools/check-rules.js, но он НЕ ВХОДИЛ
   в этот бегунок и сгнил молча: 29.09 копии разошлись на 20 строк, и никто
   не узнал. ПРОВЕРКА, НЕ ВХОДЯЩАЯ В ОБЩИЙ БЕГУНОК, МОЛЧА ГНИЁТ — теперь
   входит. Сверяем содержимое, а не дату: дата у копии своя. */
{
    const свой = path.join(__dirname, '..', 'js/kslt-rules.js');
    const копия = path.join(__dirname, '..', 'mobile/www/js/kslt-rules.js');
    if (fs.readFileSync(свой, 'utf8') !== fs.readFileSync(копия, 'utf8')) {
        console.log('\n  \u2717 ОБЩИЕ ПРАВИЛА РАЗОШЛИСЬ\n');
        console.log('    js/kslt-rules.js и mobile/www/js/kslt-rules.js не совпадают.');
        console.log('    Приложение работает по своим правилам, сайт по своим.\n');
        process.exit(1);
    }
}

/* ── общая предпосылка: правила должны СЧИТАТЬ верно ─────────────────────── */
/* Заморозка читает файл как текст: она поймает исчезнувшую функцию, но не
   поймает функцию, которая осталась и стала считать неверно. Проба зовёт
   правила и сверяет числа. Браузера ей не надо — правила чистые. */
{
    const проба = прогнать('proba-pravil.js');
    if (!проба.ок) {
        console.log(проба.вывод);
        process.exit(1);
    }
}

['css/style.css', 'css/tokens.css'].forEach(ф => {
    const s = fs.readFileSync(path.join(__dirname, '..', ф), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[{}]/g, ' '));
    let d = 0, строка = 0, ушло = 0;
    s.split('\n').forEach((l, i) => {
        for (const ch of l) { if (ch === '{') d++; if (ch === '}') d--; }
        if (d < 0 && !ушло) { ушло = 1; строка = i + 1; }
    });
    if (d !== 0 || ушло) {
        console.log('');
        console.log('  ✗ ' + ф + ': скобки не сходятся, баланс ' + d +
                    (строка ? ', в минус ушло на строке ' + строка : ''));
        console.log('    Пока это не починено, остальные проверки считают структуру по битому файлу.');
        console.log('');
        process.exit(1);
    }
});

console.log('');
let плохо = 0;
КУСКИ.forEach(([имя, правила, откат]) => {
    const п = прогнать(правила);
    const строка = п.вывод.match(/\n\s{2}(ок|НЕ ТАК)[^\n]*/);
    if (!п.ок) {
        плохо++;
        console.log('  ✗ ' + имя.padEnd(22) + ' ПРАВИЛА НЕ ДЕРЖАТСЯ');
        console.log(п.вывод.split('\n').filter(l => l.trim().startsWith('✗')).join('\n'));
        return;
    }
    let хвост = (строка ? строка[0] : '').replace(/\s+/g, ' ').trim();
    if (!быстро) {
        const о = прогнать(откат);
        if (!о.ок) {
            плохо++;
            console.log('  ✗ ' + имя.padEnd(22) + ' правила зелёные, но ОТКАТ ИХ НЕ ДОКАЗАЛ');
            console.log(о.вывод.split('\n').filter(l => /[✗~?!]/.test(l)).slice(0, 6).join('\n'));
            return;
        }
        хвост += '   ·   откатов: ' + число(о.вывод, /все (\d+) откатов/);
    }
    console.log('  ✓ ' + имя.padEnd(22) + хвост);
});

console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + КУСКИ.length + ' кусков разъехались с решениями'); console.log(''); process.exit(1); }
console.log('  ок      все ' + КУСКИ.length + ' закрытых кусков держатся' + (быстро ? ' (прувер пропущен)' : ''));
console.log('');
