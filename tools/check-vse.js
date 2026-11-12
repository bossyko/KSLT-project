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

/* ══════════════════════════════════════════════════════════════════════
   СРЕЗ-ДЕРЕВО В КОРНЕ ОБМАНЫВАЕТ ВСЁ, ЧТО ХОДИТ ПО ДЕРЕВУ (31.10).

   ЗАМЕР. Для сверки проб со старым продуктом 30.10 я завёл срез-дерево
   `_bazovy` (`git worktree`) ПРЯМО В КОРНЕ — 40 МБ прежнего продукта.
   Следующий же общий прогон дал 14 красных кусков подряд: «копии,
   которые совпадали, совпадают до сих пор», «адрес сайта нигде не зашит
   строкой», «страниц с манифестом 92», «линтер по всему корню чист» и
   так далее. Ни одна из этих находок не настоящая — приборы читали
   ПРОШЛЫЙ продукт как нынешний.

   ПОЧЕМУ НЕ УЧИТЬ ПРИБОРЫ. Посчитано: по дереву ходят 89 приборов, про
   `_bazovy` знают 4. Дописать имя в 85 списков исключений — это 85
   мест, где его потом забудут, то есть ровно та беда, от которой
   заводятся дома. Дешевле не держать срез-дерево в корне вовсе: оно
   нужно на один прогон сверки и создаётся одной командой.

   Поэтому бегунок не начинается, пока в корне лежит срез-дерево, и
   говорит, что именно убрать. Красные 14 кусков назвали бы беду 14
   раз и ни разу верно.
   ══════════════════════════════════════════════════════════════════════ */
(function срезВКорне() {
    let список = '';
    try {
        список = execFileSync('git', ['worktree', 'list'],
            { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    } catch (e) { return; }          /* не git — и говорить не о чем */
    const корень = path.resolve(path.join(__dirname, '..'));
    const чужие = список.split('\n')
        .map(с => с.split(' ')[0])
        .filter(Boolean)
        .filter(п => п !== корень && п.startsWith(корень + path.sep));
    if (!чужие.length) return;
    console.log('');
    console.log('  ОСТАНОВ  в корне лежит срез-дерево, и приборы читают его');
    console.log('           как нынешний продукт:');
    чужие.forEach(п => console.log('             ' + path.relative(корень, п)));
    console.log('');
    console.log('           убрать:   git worktree remove ' +
                path.relative(корень, чужие[0]));
    console.log('           вернуть:  git worktree add ' +
                path.relative(корень, чужие[0]) + ' <срез>');
    console.log('');
    process.exit(1);
})();
const КУСКИ = [
    ['шапка',                'check-header.js',       'check-header-otkat.js'],
    ['первый экран',        'check-geroy.js',        'check-geroy-otkat.js'],
    ['раздел live',         'check-live.js',         'check-live-otkat.js'],
    ['цвет статусов',       'check-turniry-cvet.js', 'check-turniry-cvet-otkat.js'],
    ['узкие виды турниров', 'check-turniry-vidy.js', 'check-turniry-vidy-otkat.js'],
    ['новости',             'check-novosti.js',      'check-novosti-otkat.js'],
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
    /* ИМЯ РАЗВЕДЕНО 29.10: в бегунке было ДВА куска с именем «статус
       турнира» (этот и `check-status.js` выше), и отчёт становился
       неоднозначным — я сам пошёл проверять не тот прувер и решил, что
       падение «мерцает». ОДНО ИМЯ НА ОДИН КУСОК. */
    ['статус турнира — один дом', 'check-status-turnira.js', 'check-status-turnira-otkat.js'],
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
    ['запирание фокуса в окне', 'check-lovushka-zapiranie.js', 'check-lovushka-zapiranie-otkat.js'],
    ['окно H2H в двух копиях', 'check-h2h-dvazhdy.js', 'check-h2h-dvazhdy-otkat.js'],
    ['счёт контраста один', 'check-odin-schyot-kontrasta.js', 'check-odin-schyot-kontrasta-otkat.js'],
    ['возраст один на продукт', 'check-vozrast-odin.js', 'check-vozrast-odin-otkat.js'],
    ['сверка ключом', 'check-sverka-kluchom.js', 'check-sverka-kluchom-otkat.js'],
    ['разделитель тысяч', 'check-razdelitel-tysyach.js', 'check-razdelitel-tysyach-otkat.js'],
    ['публикация турнира', 'check-publikaciya-turnira.js', 'check-publikaciya-turnira-otkat.js'],
    ['случайный порядок и дома', 'check-sluchaynyy-poryadok.js', 'check-sluchaynyy-poryadok-otkat.js'],
    ['оснастка окон', 'check-osnastka-okon.js', 'check-osnastka-okon-otkat.js'],
    ['данные в разметке', 'check-dannye-v-razmetku.js', 'check-dannye-v-razmetku-otkat.js'],
    ['отсчёт до начала', 'check-otschet.js', 'check-otschet-otkat.js'],
    ['css в строках js', 'check-css-v-js.js', 'check-css-v-js-otkat.js'],
    ['оформление именем', 'check-oformlenie-imenem.js', 'check-oformlenie-imenem-otkat.js'],
    ['договор имени', 'check-dogovor-imeni.js', 'check-dogovor-imeni-otkat.js'],
    ['селектор через дом', 'check-selektor-cherez-dom.js', 'check-selektor-cherez-dom-otkat.js'],
    ['видимость — один дом', 'check-vidimost-odin-dom.js', 'check-vidimost-odin-dom-otkat.js'],
    ['схема не двоится', 'check-shema-ne-dvoitsya.js', 'check-shema-ne-dvoitsya-otkat.js'],
    ['телефон лёжа', 'check-vid-lezha.js', 'check-vid-lezha-otkat.js'],
    /* ВНЕСЁН 27.10, КУСКОМ 199. Сторож входа жил СБОКУ: два его правила не
       держались, и оба — из-за собственных признаков (опечатка `\\s` и
       граница 480, которой на шкале нет). Никто этого не видел, потому что
       его не гонял `check-vse`. СТОРОЖ, КОТОРОГО НЕ ГОНЯЮТ, НЕ СТОРОЖ. */
    ['вход', 'check-auth.js', 'check-auth-otkat.js'],
    ['фокус после перерисовки', 'check-fokus-posle-pererisovki.js',
     'check-fokus-posle-pererisovki-otkat.js'],
    ['действие над пользователем', 'check-deystvie-nad-polzovatelem.js',
     'check-deystvie-nad-polzovatelem-otkat.js'],
    ['тосты админки без копий', 'check-tosty-bez-kopiy.js',
     'check-tosty-bez-kopiy-otkat.js'],
    ['удаление аккаунта', 'check-udalenie-akkaunta.js',
     'check-udalenie-akkaunta-otkat.js'],
    ['спонсор на экране загрузки', 'check-sponsor-na-zagruzke.js',
     'check-sponsor-na-zagruzke-otkat.js'],
    ['имена в коде', 'check-imena-v-kode.js',
     'check-imena-v-kode-otkat.js'],
    ['светлая тема приложения', 'check-svetlaya-tema-prilozheniya.js',
     'check-svetlaya-tema-prilozheniya-otkat.js'],
    ['рейтинг приложения', 'check-reyting-prilozheniya.js',
     'check-reyting-prilozheniya-otkat.js'],
    ['числа клуба', 'check-chisla-kluba.js',
     'check-chisla-kluba-otkat.js'],
    ['главная приложения', 'check-glavnaya-prilozheniya.js',
     'check-glavnaya-prilozheniya-otkat.js'],
    ['шкала всего приложения', 'check-shkala-prilozheniya.js',
     'check-shkala-prilozheniya-otkat.js'],
    ['словарь приложения', 'check-slovar-prilozheniya.js',
     'check-slovar-prilozheniya-otkat.js'],
    ['доступность приложения', 'check-dostupnost-prilozheniya.js',
     'check-dostupnost-prilozheniya-otkat.js'],
    ['экран турнира приложения', 'check-ekran-turnira-prilozheniya.js',
     'check-ekran-turnira-prilozheniya-otkat.js'],
    ['сетка плей-офф приложения', 'check-setka-prilozheniya.js',
     'check-setka-prilozheniya-otkat.js'],
    ['статус и имена приложения', 'check-status-i-imena-prilozheniya.js',
     'check-status-i-imena-prilozheniya-otkat.js'],
    ['новости приложения', 'check-novosti-prilozheniya.js',
     'check-novosti-prilozheniya-otkat.js'],
    ['лента и группа приложения', 'check-lenta-prilozheniya.js',
     'check-lenta-prilozheniya-otkat.js'],
    ['табло турнира приложения', 'check-tablo-turnira-prilozheniya.js',
     'check-tablo-turnira-prilozheniya-otkat.js'],
    ['выпуск приложения', 'check-vypusk-prilozheniya.js',
     'check-vypusk-prilozheniya-otkat.js'],
    ['одни классы в двух продуктах', 'check-odni-klassy.js',
     'check-odni-klassy-otkat.js'],
    ['адрес сайта в приложении — одно определение',
     'check-adres-sayta-prilozheniya.js',
     'check-adres-sayta-prilozheniya-otkat.js'],
    ['данные графика рейтинга — один дом',
     'check-grafik-dannye.js', 'check-grafik-dannye-otkat.js'],
    ['один язык, пока языки убраны',
     'check-odin-yazyk.js', 'check-odin-yazyk-otkat.js'],
    ['процент побед — одно определение',
     'check-procent-pobed.js', 'check-procent-pobed-otkat.js'],
    ['плитка числа с подписью — один дом',
     'check-plitki.js', 'check-plitki-otkat.js'],
    ['разбивка по категориям — один дом',
     'check-kategorii.js', 'check-kategorii-otkat.js'],
    ['одно имя файла — одно тело, или названная причина',
     'check-kopii-js.js', 'check-kopii-js-otkat.js'],
    ['срок возврата удалённого аккаунта — одно число',
     'check-srok-vozvrata.js', 'check-srok-vozvrata-otkat.js'],
    ['поздравление с достижением — один дом',
     'check-pozdravlenie.js', 'check-pozdravlenie-otkat.js'],
    ['возврат учётной записи — один дом',
     'check-vozvrat.js', 'check-vozvrat-otkat.js'],
    ['счёт матча — один дом',
     'check-schyot-matcha.js', 'check-schyot-matcha-otkat.js'],
    ['заявка на турнир — один дом',
     'check-zayavka.js', 'check-zayavka-otkat.js'],
    ['вход — один дом',
     'check-vhod.js', 'check-vhod-otkat.js'],
    ['уведомления — экран не расходится с сервером',
     'check-uvedomleniya.js', 'check-uvedomleniya-otkat.js'],
    /* СОГЛАСИЯ (кусок Ю, 07.11) — журнал, четыре цели, выгрузка своих
       данных и МОЛЧАНИЕ БЕЗ СОГЛАСИЯ. Стоит рядом с уведомлениями
       нарочно: они читают одни и те же файлы, и расходиться им нельзя. */
    ['согласия — молчим без согласия',
     'check-soglasiya.js', 'check-soglasiya-otkat.js'],
    /* БЕЗ РЕЙТИНГА (кусок «Open Friendly», 07.11) — признак «дружеский
       турнир» перестал быть зашитым словом и стал свойством категории.
       Держит и клиент, и сервер, и базу: трое должны отвечать одно. */
    ['без рейтинга — признак из данных',
     'check-bez-reytinga.js', 'check-bez-reytinga-otkat.js'],
    /* КАБИНЕТА ИГРОКА У СОТРУДНИКА НЕТ (кусок «вход админа», 07.11).
       Решение 27.02 восемь месяцев не держалось ничем — ноль правил и
       ноль проб — и отъехало тремя путями. Внесено здесь в тот же день:
       НЕПРОГНАННЫЙ СТОРОЖ — НЕ СТОРОЖ. */
    ['кабинет — сотруднику его нет',
     'check-kabinet-ne-sotrudniku.js', 'check-kabinet-ne-sotrudniku-otkat.js'],
    /* ПОЛНОТА ПРОГОНА (07.11). Три пары, которых здесь не было: сторож
       шкалы кеглей сайта и сторож правил клуба стояли месяцами ВНЕ
       прогона и без пруверов — их правила не держали ничего. Третья пара
       стережёт это впредь: СТОРОЖ, КОТОРОГО НЕ ГОНЯЮТ, НЕ СТОРОЖИТ
       НИЧЕГО, и беда уже приходила дважды (29.10 и 27.10). */
    ['шкала кеглей сайта', 'check-shkala.js', 'check-shkala-otkat.js'],
    ['правила клуба и копии приложения', 'check-rules.js', 'check-rules-otkat.js'],
    ['полнота прогона', 'check-polnota-progona.js', 'check-polnota-progona-otkat.js'],
    ['подпись лиги, пьедестал мест и пара в клетке', 'check-podpis-ligi.js', 'check-podpis-ligi-otkat.js'],
    ['дата рождения — необязательна',
     'check-data-rozhdeniya.js', 'check-data-rozhdeniya-otkat.js'],
    ['окна приложения — ни одно без оснастки',
     'check-okna-prilozheniya.js', 'check-okna-prilozheniya-otkat.js'],
    ['документы достижимы из приложения',
     'check-dokumenty-prilozheniya.js', 'check-dokumenty-prilozheniya-otkat.js'],
    ['тай-брейк вписывает игрок',
     'check-tay-breyk.js', 'check-tay-breyk-otkat.js'],
    ['вызов на баттл — один дом',
     'check-vyzov.js', 'check-vyzov-otkat.js'],
    ['значки у имени — один дом',
     'check-znachki.js', 'check-znachki-otkat.js'],
    ['онлайн снят с рейтинга',
     'check-onlayn.js', 'check-onlayn-otkat.js'],
    ['зов серверной функции — один дом',
     'check-zov.js', 'check-zov-otkat.js'],
    ['настройки базы — один дом',
     'check-baza.js', 'check-baza-otkat.js'],
    ['строки категорий в кабинете — одно определение',
     'check-stroki-kategoriy.js', 'check-stroki-kategoriy-otkat.js'],
    ['экран баттла приложения — карта и отменённый баттл',
     'check-ekran-battla.js', 'check-ekran-battla-otkat.js'],
    ['токены из js объявлены в css',
     'check-tokeny-iz-js.js', 'check-tokeny-iz-js-otkat.js'],

    ['выход из аккаунта только по ответу сервера',
     'check-vyhod-po-otvetu.js', 'check-vyhod-po-otvetu-otkat.js'],

    ['пробы идут через обвязку, а не мимо неё',
     'check-proby-cherez-obvyazku.js', 'check-proby-cherez-obvyazku-otkat.js'],

    ['предел пробы больше суммы её ожиданий',
     'check-predely-prob.js', 'check-predely-prob-otkat.js'],

    ['класс картинки не носит данные',
     'check-klass-kartinki.js', 'check-klass-kartinki-otkat.js'],

    /* ── 04.11: ДОГНАТЬ СПИСОК ────────────────────────────────────────────
       Двадцать пар лежали на диске и НЕ стояли в этом списке — значит общий
       бегунок их не гонял ни разу. Это ровно та беда, про которую написано
       в check-vse-srezom.js: БЕГУНОК, КОТОРЫЙ НЕ ЗАПУСКАЮТ, МОЛЧА ГНИЁТ.
       Теперь за полнотой списка следит правило `check-spisok-par.js`. */
    ['бекап заперт',
     'check-bekap-zaperto.js', 'check-bekap-zaperto-otkat.js'],
    ['безопасная зона',
     'check-bezopasnaya-zona.js', 'check-bezopasnaya-zona-otkat.js'],
    ['исход матча',
     'check-ishod-matcha.js', 'check-ishod-matcha-otkat.js'],
    ['лиги с первого дня',
     'check-ligi-s-pervogo-dnya.js', 'check-ligi-s-pervogo-dnya-otkat.js'],
    ['один переключатель темы',
     'check-odin-pereklyuchatel-temy.js', 'check-odin-pereklyuchatel-temy-otkat.js'],
    ['отсечка',
     'check-otsechka.js', 'check-otsechka-otkat.js'],
    ['перестановка места',
     'check-perestanovka-mesta.js', 'check-perestanovka-mesta-otkat.js'],
    ['посев двое от группы',
     'check-posev-dvoe-ot-gruppy.js', 'check-posev-dvoe-ot-gruppy-otkat.js'],
    ['правило пароля',
     'check-pravilo-parolya.js', 'check-pravilo-parolya-otkat.js'],
    ['приложение само себе',
     'check-prilozhenie-samo-sebe.js', 'check-prilozhenie-samo-sebe-otkat.js'],
    ['свой QR',
     'check-qr-svoy.js', 'check-qr-svoy-otkat.js'],
    ['складка',
     'check-skladka.js', 'check-skladka-otkat.js'],
    ['страна и глаз',
     'check-strana-i-glaz.js', 'check-strana-i-glaz-otkat.js'],
    ['свой узел',
     'check-svoy-uzel.js', 'check-svoy-uzel-otkat.js'],
    ['вход с Apple',
     'check-vhod-s-apple.js', 'check-vhod-s-apple-otkat.js'],
    ['витрина игроков',
     'check-vitrina-igrokov.js', 'check-vitrina-igrokov-otkat.js'],
    ['выпадашка',
     'check-vypadashka.js', 'check-vypadashka-otkat.js'],
    ['youtube — один разбор',
     'check-youtube-odin-razbor.js', 'check-youtube-odin-razbor-otkat.js'],
    ['жалобы и блокировки',
     'check-zhaloby-i-blokirovki.js', 'check-zhaloby-i-blokirovki-otkat.js'],
    ['журнал матча',
     'check-zhurnal-matcha.js', 'check-zhurnal-matcha-otkat.js'],

    /* ВНЕСЕНЫ 07.11. Тринадцать сторожей, заведённых 05–07.11, лежали
       СБОКУ от бегунка: их пруверы были написаны и ни разу не гонялись.
       Ровно та беда, что записана выше про `check-auth` 27.10 — СТОРОЖ,
       КОТОРОГО НЕ ГОНЯЮТ, НЕ СТОРОЖ, — и повторённая мной тринадцать
       раз за три дня. Сторож над списком про это и говорил; я не гонял
       и его. Пара заводится в тот же день, что и прувер. */
    ['горизонтальный вид',
     'check-gorizontalnyy-vid.js', 'check-gorizontalnyy-vid-otkat.js'],
    ['три редакции документа',
     'check-dokumenty-tri-redakcii.js', 'check-dokumenty-tri-redakcii-otkat.js'],
    ['фокус в окне',
     'check-fokus-v-okne.js', 'check-fokus-v-okne-otkat.js'],
    ['имя лиги',
     'check-imya-ligi.js', 'check-imya-ligi-otkat.js'],
    ['окно-вопрос',
     'check-okno-vopros.js', 'check-okno-vopros-otkat.js'],
    ['отмена battle',
     'check-otmena-battla.js', 'check-otmena-battla-otkat.js'],
    ['шторка',
     'check-shtorka.js', 'check-shtorka-otkat.js'],
    ['витрина прав',
     'check-vitrina-prava.js', 'check-vitrina-prava-otkat.js'],
    ['скрытый номер',
     'check-skrytyy-nomer.js', 'check-skrytyy-nomer-otkat.js'],
    ['молчащие пробы',
     'check-molchashchie-proby.js', 'check-molchashchie-proby-otkat.js'],
    ['правовые документы',
     'check-pravovye-dokumenty.js', 'check-pravovye-dokumenty-otkat.js'],
    ['двойная связь',
     'check-dvoynaya-svyaz.js', 'check-dvoynaya-svyaz-otkat.js'],
    ['ключ заданий',
     'check-cron-klyuch.js', 'check-cron-klyuch-otkat.js'],
    ['кабинеты не расходятся',
     'check-kabinety-ne-rashodyatsya.js', 'check-kabinety-ne-rashodyatsya-otkat.js'],

    ['выгрузки админки',
     'check-vygruzki.js', 'check-vygruzki-otkat.js'],
    ['ряд действий формы',
     'check-ryad-deystviy.js', 'check-ryad-deystviy-otkat.js'],
    ['границы раскладки',
     'check-granicy.js', 'check-granicy-otkat.js'],
    ['просмотры',
     'check-prosmotry.js', 'check-prosmotry-otkat.js'],
    ['показ даты',
     'check-pokaz-daty.js', 'check-pokaz-daty-otkat.js'],
    ['след отмены скидки',
     'check-sled-otmeny.js', 'check-sled-otmeny-otkat.js'],
    ['хвост входа',
     'check-hvost-vhoda.js', 'check-hvost-vhoda-otkat.js'],
    ['состав блоков по языкам',
     'check-sostav-yazykov.js', 'check-sostav-yazykov-otkat.js'],
    ['окно спонсора',
     'check-okno-sponsora.js', 'check-okno-sponsora-otkat.js'],

    /* ТРИ ПАРЫ, ЛЕЖАВШИЕ МИМО СПИСКА. Пруверы к ним написаны и лежат на
       диске, но общий бегунок их не звал — то есть они не гонялись ни
       разу с того дня, как появились. Внесены 11.11. */
    ['клубный взнос',
     'check-klubnyy-vznos.js', 'check-klubnyy-vznos-otkat.js'],
    ['сведения о поставщике',
     'check-svedeniya-o-postavshchike.js', 'check-svedeniya-o-postavshchike-otkat.js'],
    ['карта и сетка на телефоне',
     'check-telefon-karta-i-setka.js', 'check-telefon-karta-i-setka-otkat.js'],

    /* СТОРОЖ НАД ЭТИМ САМЫМ СПИСКОМ: он падает, когда пара заведена, а в
       список не внесена, и когда одна пара стоит в нём дважды. */
    ['список пар полон',
     'check-spisok-par.js', 'check-spisok-par-otkat.js']
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
