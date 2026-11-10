/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «КЛУБНЫЙ ВЗНОС». На КОПИИ.
 *   node tools/check-klubnyy-vznos-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ, а не на номере строки.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vznos-'));
/* КОПИЯ, НЕПОЛНАЯ ОТНОСИТЕЛЬНО ПРОВЕРЯЕМОГО, НИЧЕГО НЕ ДОКАЗЫВАЕТ —
   пятый раз за четверо суток. Сторож читает mobile и лежит в tools. */
['tools', 'mobile/www', 'tests/e2e'].forEach(д => {
    fs.mkdirSync(path.join(песок, д), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true });
});

const ПЛАТФ = 'mobile/www/js/kslt-platforma.js',
      ПАРТН = 'mobile/www/js/screens/partners.js',
      КАРТ  = 'mobile/www/js/screens/player-detail.js',
      ЯЗЫКИ = 'mobile/www/js/i18n.js',
      ДОМ   = 'mobile/www/index.html',
      ПРОБА = 'tests/e2e/features/46-klubnyy-vznos.spec.js';
const ФАЙЛЫ = [ПЛАТФ, ПАРТН, КАРТ, ЯЗЫКИ, ДОМ, ПРОБА];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правки) {
    ФАЙЛЫ.forEach(ф => {
        const п = (правки || []).find(([и]) => и === ф);
        let текст = исходник[ф];
        if (п) текст = текст.split(п[1]).join(п[2]);
        fs.writeFileSync(path.join(песок, ф), текст);
    });
    try {
        const вывод = execFileSync(process.execPath,
            [path.join(песок, 'tools/check-klubnyy-vznos.js')], { encoding: 'utf8' });
        return { упало: false, вывод };
    } catch (e) {
        return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') };
    }
}

const ОТКАТЫ = [
    ['отнять у пробы взноса общий помощник', [[ПРОБА,
      "const { нажатьСквозьПомехи } = require('../../pomoshniki/nazhatie');",
      "var нажатьСквозьПомехи = async (p, s) => { await p.locator(s).click(); return []; };"]],
     'проба взноса зовёт общий помощник'],

    ['завести пробе свою копию приёма', [[ПРОБА,
      "    const помехиМеню = await нажатьСквозьПомехи(page, '#menuBtn');",
      "    const нажатьСквозьПомехи2 = async () => [];\n    function нажатьСквозьПомехи(p, s) { return p.locator(s).click(); }\n    const помехиМеню = await нажатьСквозьПомехи(page, '#menuBtn');"]],
     'приём расчистки пути не копируется по пробам'],

    ['вернуть приглашение за взнос', [[ПАРТН,
      "if (!isGuest) {\n        html += '<button class=\"partner-invite-btn\"",
      "if (AUTH._membershipStatus) {\n        html += '<button class=\"partner-invite-btn\""]],
     'приглашение партнёра открыто всем вошедшим'],

    ['вернуть вызов за взнос', [[КАРТ,
      "if (access !== 'guest' && естьЧеловек && !_zablokirovan)",
      "if (access === 'member' && естьЧеловек && !_zablokirovan)"]],
     'вызов и приглашение в карточке открыты всем вошедшим'],

    ['оставить обработчик только членам', [[КАРТ,
      "if (access !== 'guest') {\n      var chalBtn",
      "if (access === 'member') {\n      var chalBtn"]],
     'обработчик кнопок вешается тому же кругу, что и кнопки'],

    ['вернуть призыв «нужно членство»', [[ЯЗЫКИ,
      "    'pd.challenge':",
      "    'pd.memberCta':      { ru: 'Для вызовов нужно членство' },\n    'pd.challenge':"]],
     'на месте снятого замка не стоит призыв к оплате'],

    ['вернуть ссылку на оплату в окно взноса', [[ПАРТН,
      "I18N.t('pricing.atClub') + '</p>' +",
      "I18N.t('pricing.atClub') + '</p>' +\n        '<a href=\"https://t.me/kslt_admin\">Telegram</a>' +"]],
     'в окне взноса нет ссылки на оплату'],

    ['вернуть строку «как оплатить»', [[ПАРТН,
      "I18N.t('pricing.atClub')",
      "I18N.t('pricing.howToPay')"]],
     'строка «как оплатить» не показывается в окне взноса'],

    ['показывать цену и на витрине Apple', [[ПЛАТФ,
      "return ПЛАТФОРМА !== 'ios';",
      "return true;"]],
     'цена скрыта именно на витрине Apple'],

    ['завязать цену на имя платформы', [[ПАРТН,
      "П.ценуПоказываем()",
      "П.имя !== 'ios'"]],
     'цена спрашивает правило, а не имя платформы'],

    ['завести второе определение платформы', [[КАРТ,
      "  // ---- Access check ----",
      "  var п = window.Capacitor && window.Capacitor.getPlatform();\n  // ---- Access check ----"]],
     'второго определения платформы не заводится'],

    ['подключить платформу после экранов', [[ДОМ,
      '<script src="js/kslt-platforma.js?v=1"></script>\n',
      '']],
     'признак платформы подключён раньше экранов'],

    ['вернуть в выгоды полный рейтинг', [[ЯЗЫКИ,
      "'pricing.feat2':             { ru: 'Скидки у тренеров клуба',",
      "'pricing.feat2':             { ru: 'Полный рейтинг и статистика',"]],
     'в выгодах взноса нет обещания «рейтинг»'],

    ['вернуть в выгоды систему вызовов', [[ЯЗЫКИ,
      "'pricing.feat5':             { ru: 'Контакты игроков клуба',",
      "'pricing.feat5':             { ru: 'Система вызовов между игроками',"]],
     'в выгодах взноса нет обещания «вызов»'],

    ['вернуть в выгоды программу лояльности', [[ЯЗЫКИ,
      "'pricing.feat6':             { ru: 'Клубные тренировки и сборы',",
      "'pricing.feat6':             { ru: 'Программа лояльности (баллы)',"]],
     'в выгодах взноса нет обещания «лояльност»'],

    ['вернуть обещание доступа ко всем функциям', [[ЯЗЫКИ,
      "'profile.getMembership':  { ru: 'Участие в турнирах и скидки в клубе', en: 'Tournament entry and club discounts',",
      "'profile.getMembership':  { ru: 'Оформите для доступа ко всем функциям', en: 'Get access to all features',"]],
     'кабинет не обещает доступ ко всем функциям за взнос'],

    ['вернуть название «Членство»', [[ЯЗЫКИ,
      "'menu.pricing':     { ru: 'Клубный взнос', en: 'Club fee',     kg: 'Клуб төгүмү' },",
      "'menu.pricing':     { ru: 'Членство',     en: 'Membership',    kg: 'Мүчөлүк' },"]],
     'взнос назван взносом, а не подпиской'],

    ['вернуть FAQ, отсылающий оформлять в приложении', [[ПАРТН,
      "<h4>Как вступить в клуб КСЛТ?</h4>",
      "<h4>Как стать членом КСЛТ?</h4><p>оформите членство через раздел «Членство»</p>"]],
     'FAQ не отсылает оформлять взнос внутри приложения'],

    /* ОТКАТ ОБЯЗАН ВЕРНУТЬ ПРЕЖНЕЕ СОСТОЯНИЕ, А НЕ ПРОСТО СЛОМАТЬ ВЕТКУ.
       Первая редакция меняла условие на `if (false)` — и правило честно
       оставалось зелёным, потому что зов `C.getPlatform()` никуда не
       девался, он просто переставал исполняться. Прибор читает ФАЙЛ, а не
       поток исполнения. Теперь откат возвращает именно угадывание. */
    ['отнять у платформы зов Capacitor', [[ПЛАТФ,
      "    var C = global.Capacitor;\n    if (C && typeof C.getPlatform === 'function') {\n      try {\n        var п = C.getPlatform();",
      "    var C = null;\n    if (/iPhone|iPad/.test(navigator.userAgent)) {\n      try {\n        var п = 'ios';"]],
     'платформа берётся у Capacitor, а не угадывается'],

    ['убрать одну выгоду из словаря', [[ЯЗЫКИ,
      "    'pricing.feat6':",
      "    'pricing.ne6':"]],
     'выгод взноса в словаре по-прежнему шесть'],
];

console.log('\n  ПРУВЕР «КЛУБНЫЙ ВЗНОС» — на копии\n');
let плохих = 0;
const чистый = прогон(null);
if (чистый.упало) { console.log('  x чистая копия уже падает:\n' + чистый.вывод); плохих++; }
else console.log('  v чистая копия зелёная');

ОТКАТЫ.forEach(([имя, правки, ждём]) => {
    let беда = null;
    правки.forEach(([ф, было]) => {
        const n = исходник[ф].split(было).length - 1;
        if (n !== 1) беда = 'якорь встречается ' + n + ' раз в ' + ф;
    });
    if (беда) { console.log('  ? ' + имя + '  ->  ' + беда); плохих++; return; }
    const р = прогон(правки);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
прогон(null);
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' не доказали правило\n');
    process.exitCode = 1;
}
