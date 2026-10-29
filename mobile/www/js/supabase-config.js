// ============================================
// KSLT Mobile — Supabase Configuration
// ============================================

/**
 * Адрес базы.
 *
 * Как и на сайте, переключается через window.KSLT_DB — его подставляют
 * автопроверки до загрузки. Раньше адрес был зашит намертво, и любая
 * проверка, открывавшая приложение, ходила в боевую базу: оставляла там
 * мусор и тратила квоту. Сайт от этого ушёл давно, приложение — нет.
 *
 * Ничего не подставили — работаем с боевой, как и должно быть у человека
 * на телефоне.
 */
var SUPABASE_URL = (window.KSLT_DB && window.KSLT_DB.url) ||
    'https://qqkzszesviukopgjbead.supabase.co';
var SUPABASE_ANON_KEY = (window.KSLT_DB && window.KSLT_DB.key) ||
    'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G';

/**
 * АДРЕС САЙТА — ОДНО ОПРЕДЕЛЕНИЕ НА ВЕСЬ ПРОДУКТ.
 *
 * На сайте тот же `KSLT_SAYT` берёт адрес У БРАУЗЕРА
 * (`js/supabase-config.js`): на каком домене открыли, туда и ведёт
 * ссылка. У приложения домена нет вовсе — оно живёт по `capacitor://`
 * и `file://`, поэтому `location.origin` здесь не годится и адрес
 * приходится знать. Понятие одно, способ узнать — разный, и это
 * свойство среды, а не вольность.
 *
 * ЗАЧЕМ ЭТО ЗАВЕДЕНО (замер 29.10, шаг A3.4). В
 * `screens/home-blocks.js:73` стояло
 * `window.KSLT_SITE_URL || 'https://kslt.netlify.app'`, а
 * `KSLT_SITE_URL` НЕ ОБЪЯВЛЕН НИГДЕ — это единственное его упоминание
 * во всём приложении. Значит `||` срабатывал всегда, и адрес был
 * зашит намертво, но ВЫГЛЯДЕЛ настройкой. Настройка, которую никто не
 * ставит, хуже зашитого числа: зашитое видно, а эта врёт читающему.
 *
 * При переезде на свой домен правится ЭТА строка и только она.
 */
window.KSLT_SAYT = window.KSLT_SAYT || {
    адрес:   'https://kslt.netlify.app',
    подпись: 'kslt.netlify.app'
};

window.KSLT_TG_BOT = 'KSLTennisBot';

var supabaseClient = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  }
  console.error('Supabase SDK not loaded');
  return null;
}

initSupabase();
