// ============================================
// KSLT — Supabase Configuration
// ============================================

var SUPABASE_URL = 'https://qqkzszesviukopgjbead.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G';

// Telegram bot username (for deep link: t.me/BOT?start=PROFILE_ID)
window.KSLT_TG_BOT = 'KSLTennisBot';

// Supabase SDK CDN
// <script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

// Supabase client
var supabaseClient = null;

function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase connected');
        return supabaseClient;
    }
    console.error('Supabase SDK not loaded');
    return null;
}

// Auto-init when loaded (captures OAuth tokens from URL hash)
initSupabase();
