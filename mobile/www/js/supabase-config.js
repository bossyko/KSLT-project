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
