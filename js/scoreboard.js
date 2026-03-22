/**
 * KSLT — OBS Scoreboard Overlay
 * Transparent background, Supabase Realtime subscription
 */
(function() {
    'use strict';

    var matchId = null;
    var channel = null;

    function init() {
        var params = new URLSearchParams(window.location.search);
        matchId = params.get('id');
        if (!matchId) {
            // Auto-detect: load latest active live match
            autoDetect();
            return;
        }
        loadMatch();
        subscribeRealtime();
    }

    function autoDetect() {
        var client = window.supabaseClient;
        if (!client) return;
        client.from('live_matches')
            .select('id')
            .in('status', ['live', 'paused', 'warmup'])
            .order('created_at', { ascending: false })
            .limit(1)
            .then(function(res) {
                if (res.data && res.data.length) {
                    matchId = res.data[0].id;
                    loadMatch();
                    subscribeRealtime();
                }
            });
        // Also poll every 30s in case a new match starts
        setInterval(function() {
            client.from('live_matches')
                .select('id')
                .in('status', ['live', 'paused', 'warmup'])
                .order('created_at', { ascending: false })
                .limit(1)
                .then(function(res) {
                    if (res.data && res.data.length && res.data[0].id !== matchId) {
                        // New match detected — switch
                        if (channel) channel.unsubscribe();
                        matchId = res.data[0].id;
                        loadMatch();
                        subscribeRealtime();
                    }
                });
        }, 30000);
    }

    function loadMatch() {
        var client = window.supabaseClient;
        if (!client) return;

        client.from('live_matches')
            .select('*, player1:players!live_matches_player1_id_fkey(name, name_en, photo), player2:players!live_matches_player2_id_fkey(name, name_en, photo)')
            .eq('id', matchId)
            .single()
            .then(function(res) {
                if (res.error || !res.data) return;
                render(res.data);
                renderLogos(res.data.sponsor_logo);
            });
    }

    function subscribeRealtime() {
        var client = window.supabaseClient;
        if (!client) return;

        channel = client.channel('scoreboard-' + matchId)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'live_matches',
                filter: 'id=eq.' + matchId
            }, function(payload) {
                if (payload.new) {
                    // Reload full data to get player joins
                    loadMatch();
                }
            })
            .subscribe();
    }

    function render(m) {
        var root = document.getElementById('sb-root');
        if (!root) return;

        var p1Name = m.player1_name || (m.player1 && m.player1.name) || 'Игрок 1';
        var p2Name = m.player2_name || (m.player2 && m.player2.name) || 'Игрок 2';

        var setsData = m.sets_data || [];
        var isCompleted = m.status === 'completed';

        // Build sets columns
        var setsHeaderHtml = '';
        var setsP1Html = '';
        var setsP2Html = '';

        setsData.forEach(function(s, i) {
            setsHeaderHtml += '<div class="sb-col-header">S' + (i + 1) + '</div>';
            setsP1Html += '<div class="sb-set-val">' + s.g1 + '</div>';
            setsP2Html += '<div class="sb-set-val">' + s.g2 + '</div>';
        });

        // Current game
        if (!isCompleted) {
            setsHeaderHtml += '<div class="sb-col-header">G</div>';
            setsP1Html += '<div class="sb-game-val">' + (m.current_game_p1 || 0) + '</div>';
            setsP2Html += '<div class="sb-game-val">' + (m.current_game_p2 || 0) + '</div>';

            // Points
            var pt1, pt2;
            if (m.is_tiebreak) {
                pt1 = m.tiebreak_p1 || 0;
                pt2 = m.tiebreak_p2 || 0;
            } else {
                pt1 = m.points_p1 || '0';
                pt2 = m.points_p2 || '0';
            }
            setsHeaderHtml += '<div class="sb-col-header">P</div>';
            setsP1Html += '<div class="sb-pts-val">' + pt1 + '</div>';
            setsP2Html += '<div class="sb-pts-val">' + pt2 + '</div>';
        }

        var serveDot = '<span class="sb-serve">🎾</span>';

        root.innerHTML =
            '<div class="sb-board">' +
                '<div class="sb-row sb-row-p1">' +
                    '<div class="sb-name">' +
                        (m.serving_player === 1 ? serveDot : '') +
                        esc(p1Name) +
                    '</div>' +
                    '<div class="sb-scores">' + setsP1Html + '</div>' +
                '</div>' +
                '<div class="sb-row sb-row-p2">' +
                    '<div class="sb-name">' +
                        (m.serving_player === 2 ? serveDot : '') +
                        esc(p2Name) +
                    '</div>' +
                    '<div class="sb-scores">' + setsP2Html + '</div>' +
                '</div>' +
            '</div>';
    }

    function renderLogos(sponsorLogo) {
        var logosEl = document.getElementById('sb-logos');
        if (!logosEl) return;
        var html = '';
        if (sponsorLogo) {
            html += '<img src="' + esc(sponsorLogo) + '" class="sb-logo-img" alt="Sponsor">';
        }
        html += '<img src="../favicon.svg" class="sb-logo-kslt" alt="KSLT">';
        logosEl.innerHTML = html;
    }

    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
