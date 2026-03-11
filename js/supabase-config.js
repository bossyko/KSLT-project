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
        return supabaseClient;
    }
    console.error('Supabase SDK not loaded');
    return null;
}

// Auto-init when loaded (captures OAuth tokens from URL hash)
initSupabase();

// Update last_seen for logged-in users
(function() {
    var c = window.supabaseClient;
    if (!c) return;
    c.auth.getSession().then(function(res) {
        if (res.data && res.data.session) {
            var uid = res.data.session.user.id;
            c.from('profiles').update({ last_seen: new Date().toISOString() })
              .eq('id', uid).then(function(){});
            // Cache name/avatar for nav dropdown
            c.from('profiles').select('full_name, avatar_url, role').eq('id', uid).single().then(function(r) {
                if (r.data) {
                    if (r.data.full_name) localStorage.setItem('kslt_name', r.data.full_name);
                    if (r.data.avatar_url) localStorage.setItem('kslt_avatar', r.data.avatar_url);
                    if (r.data.role) localStorage.setItem('kslt_role', r.data.role);
                }
            });
        }
    });
})();
