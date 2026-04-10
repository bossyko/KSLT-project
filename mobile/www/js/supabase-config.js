// ============================================
// KSLT Mobile — Supabase Configuration
// ============================================

var SUPABASE_URL = 'https://qqkzszesviukopgjbead.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G';

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
