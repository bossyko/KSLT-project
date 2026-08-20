/**
 * KSLT — Live Match Public Page (IIFE)
 * List of live matches + detail view with YouTube embed + realtime live score
 */
(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = {
        loading: isEn ? 'Loading...' : isKg ? 'Жүктөлүүдө...' : 'Загрузка...',
        notFound: isEn ? 'Match not found' : isKg ? 'Матч табылган жок' : 'Матч не найден',
        noVideo: isEn ? 'No broadcast' : isKg ? 'Трансляция жок' : 'Нет трансляции',
        live: 'LIVE',
        warmup: isEn ? 'WARM-UP' : isKg ? 'ДАЯРДОО' : 'РАЗМИНКА',
        paused: isEn ? 'PAUSED' : isKg ? 'ТЫНЫМ' : 'ПАУЗА',
        completed: isEn ? 'COMPLETED' : isKg ? 'АЯКТАГАН' : 'ЗАВЕРШЁН',
        tiebreak: isEn ? 'Tiebreak' : isKg ? 'Тайбрейк' : 'Тайбрейк',
        tournament: isEn ? 'Tournament' : isKg ? 'Турнир' : 'Турнир',
        format: isEn ? 'Format' : isKg ? 'Формат' : 'Формат',
        bestOf: isEn ? 'Best of' : isKg ? 'Лучший из' : 'Лучший из',
        wins: isEn ? 'wins!' : isKg ? 'жеңет!' : 'побеждает!',
        empty: isEn ? 'No live matches' : isKg ? 'Live матч жок' : 'Нет live-матчей',
        emptyText: isEn ? 'No live broadcasts right now. Follow the tournament schedule.' : isKg ? 'Азырынча live-трансляция жок. Мелдеш расписаниесин байкаңыз.' : 'Сейчас нет live-трансляций. Следите за расписанием турниров.',
        backToList: isEn ? 'All matches' : isKg ? 'Бардык матчтар' : 'Все матчи',
        title: isEn ? 'Live Matches' : isKg ? 'Live матчтар' : 'Live-матчи',
        subtitle: isEn ? 'Real-time match broadcasts' : isKg ? 'Реалдуу убакыт трансляциялар' : 'Трансляции матчей в реальном времени'
    };

    var QUERY = '*, player1:players!live_matches_player1_id_fkey(id, name, name_en, name_kg, photo), player2:players!live_matches_player2_id_fkey(id, name, name_en, name_kg, photo)';

    var matchId = null;
    var listChannel = null;
    var matchChannel = null;
    var pollTimer = null;
    var realtimeConnected = false;

    function init() {
        var params = new URLSearchParams(window.location.search);
        matchId = params.get('id');
        if (matchId) {
            // Detail mode: single match
            loadMatch();
            subscribeMatch();
            pollTimer = setInterval(function() {
                if (!realtimeConnected) loadMatch();
            }, 5000);
        } else {
            // List mode: all live matches
            loadList();
            subscribeList();
            pollTimer = setInterval(function() {
                if (!realtimeConnected) loadList();
            }, 5000);
        }
    }

    // ====== LIST MODE ======

    function loadList() {
        var client = window.supabaseClient;
        if (!client) return;
        var container = document.getElementById('lmContainer');
        if (!container) return;

        // Show loading only on first load
        if (!container.querySelector('.lm-list-grid')) {
            container.innerHTML = '<div class="lm-loading">' + L.loading + '</div>';
        }

        client.from('live_matches')
            .select(QUERY)
            .in('status', ['live', 'warmup', 'paused'])
            .order('updated_at', { ascending: false })
            .then(function(res) {
                var matches = (res.data || []);
                renderList(container, matches);
            });
    }

    function renderList(container, matches) {
        if (matches.length === 0) {
            container.innerHTML =
                '<div class="lm-list-header">' +
                    '<h1 class="lm-list-title">' + L.title + '</h1>' +
                    '<p class="lm-list-subtitle">' + L.subtitle + '</p>' +
                '</div>' +
                '<div class="lm-empty">' +
                    '<div class="lm-empty-icon">📺</div>' +
                    '<div class="lm-empty-title">' + L.empty + '</div>' +
                    '<div class="lm-empty-text">' + L.emptyText + '</div>' +
                '</div>';
            return;
        }

        var html = '<div class="lm-list-header">' +
            '<h1 class="lm-list-title">' + L.title + '</h1>' +
            '<p class="lm-list-subtitle">' + L.subtitle + '</p>' +
        '</div>';

        html += '<div class="lm-list-grid">';
        matches.forEach(function(m) {
            var p1 = m.player1 || {};
            var p2 = m.player2 || {};
            var p1Name = getPlayerName(p1, m.player1_name);
            var p2Name = getPlayerName(p2, m.player2_name);
            var setsData = m.sets_data || [];
            var isWarmup = m.status === 'warmup';
            var isPaused = m.status === 'paused';

            var badgeClass = isWarmup ? 'lm-badge-warmup' : isPaused ? 'lm-badge-paused' : '';
            var badgeText = isWarmup ? L.warmup : isPaused ? L.paused : L.live;

            var pageSuffix = isEn ? '-en' : isKg ? '-kg' : '';
            var detailUrl = 'live-match' + pageSuffix + '.html?id=' + m.id;

            html += '<a href="' + detailUrl + '" class="lm-card">' +
                '<div class="lm-card-top">' +
                    '<span class="lm-live-badge ' + badgeClass + '"><span class="lm-dot"></span> ' + badgeText + '</span>' +
                    '<span class="lm-card-info">' + esc(m.tournament_label || '') + '</span>' +
                '</div>' +
                '<div class="lm-card-players">' +
                    '<div class="lm-card-player">' +
                        avatarHtml(p1, p1Name) +
                        '<div class="lm-card-pname">' + esc(p1Name) +
                            (m.serving_player === 1 ? ' <span class="lm-serve-indicator"></span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="lm-card-score">' +
                        renderSetsCompact(setsData, m) +
                    '</div>' +
                    '<div class="lm-card-player lm-card-right">' +
                        avatarHtml(p2, p2Name) +
                        '<div class="lm-card-pname">' + esc(p2Name) +
                            (m.serving_player === 2 ? ' <span class="lm-serve-indicator"></span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                (m.youtube_url ? '<div class="lm-card-video-tag">▶ ' + (isEn ? 'Video' : isKg ? 'Видео' : 'Видео') + '</div>' : '') +
            '</a>';
        });
        html += '</div>';

        container.innerHTML = html;
    }

    function renderSetsCompact(setsData, m) {
        if (!setsData || setsData.length === 0) {
            return '<span class="lm-card-vs">VS</span>';
        }
        var html = '<div class="lm-card-sets">';
        setsData.forEach(function(s) {
            var g1 = s.g1 || 0, g2 = s.g2 || 0;
            html += '<div class="lm-card-set">' +
                '<span' + (g1 > g2 ? ' class="lm-lead"' : '') + '>' + g1 + '</span>' +
                '<span' + (g2 > g1 ? ' class="lm-lead"' : '') + '>' + g2 + '</span>' +
            '</div>';
        });
        // Current game
        if (m.status !== 'completed') {
            html += '<div class="lm-card-set lm-card-set-current">' +
                '<span>' + (m.current_game_p1 || 0) + '</span>' +
                '<span>' + (m.current_game_p2 || 0) + '</span>' +
            '</div>';
        }
        html += '</div>';
        return html;
    }

    function subscribeList() {
        var client = window.supabaseClient;
        if (!client) return;
        listChannel = client.channel('live-list')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_matches'
            }, function() {
                realtimeConnected = true;
                loadList();
            })
            .subscribe(function(status) {
                if (status === 'SUBSCRIBED') {
                    realtimeConnected = true;
                    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                }
            });
    }

    // ====== DETAIL MODE ======

    function loadMatch() {
        var client = window.supabaseClient;
        if (!client) return;

        client.from('live_matches')
            .select(QUERY)
            .eq('id', matchId)
            .single()
            .then(function(res) {
                if (res.error || !res.data) {
                    showError(L.notFound);
                    return;
                }
                render(res.data);
            });
    }

    function subscribeMatch() {
        var client = window.supabaseClient;
        if (!client) return;

        matchChannel = client.channel('live-match-' + matchId)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'live_matches',
                filter: 'id=eq.' + matchId
            }, function() {
                realtimeConnected = true;
                loadMatch();
            })
            .subscribe(function(status) {
                if (status === 'SUBSCRIBED') {
                    realtimeConnected = true;
                    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                }
            });
    }

    function render(m) {
        var container = document.getElementById('lmContainer');
        if (!container) return;

        var p1 = m.player1 || {};
        var p2 = m.player2 || {};
        var p1Name = getPlayerName(p1, m.player1_name);
        var p2Name = getPlayerName(p2, m.player2_name);

        var setsData = m.sets_data || [];
        var isCompleted = m.status === 'completed';
        var isWarmup = m.status === 'warmup';
        var isPaused = m.status === 'paused';

        // Back to list link
        var pageSuffix = isEn ? '-en' : isKg ? '-kg' : '';
        // Ведём на раздел Live главной, а не на список трансляций: список
        // живёт там, и это же место открывает Live в шапке
        var backHtml = '<a href="../index' + pageSuffix + '.html#live" class="lm-back-link">← ' +
            L.backToList + '</a>';

        // YouTube embed
        var ytId = extractYoutubeId(m.youtube_url);
        var videoHtml = '';
        if (ytId) {
            videoHtml = '<div class="lm-video"><div class="lm-video-wrapper">' +
                '<iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=1&rel=0" ' +
                'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
                '</div></div>';
        } else {
            videoHtml = '<div class="lm-video"><div class="lm-no-video">' + L.noVideo + '</div></div>';
        }

        // Status badge
        var badgeClass = isWarmup ? 'lm-badge-warmup' : isPaused ? 'lm-badge-paused' : isCompleted ? 'lm-badge-completed' : '';
        var badgeText = isWarmup ? L.warmup : isPaused ? L.paused : isCompleted ? L.completed : L.live;

        // Build set scores for each player
        var p1SetsHtml = '';
        var p2SetsHtml = '';
        setsData.forEach(function(s) {
            p1SetsHtml += '<div class="lm-set-score">' + s.g1 + '</div>';
            p2SetsHtml += '<div class="lm-set-score">' + s.g2 + '</div>';
        });

        if (!isCompleted) {
            p1SetsHtml += '<div class="lm-set-score lm-current">' + (m.current_game_p1 || 0) + '</div>';
            p2SetsHtml += '<div class="lm-set-score lm-current">' + (m.current_game_p2 || 0) + '</div>';

            var pt1, pt2;
            if (m.is_tiebreak) {
                pt1 = m.tiebreak_p1 || 0;
                pt2 = m.tiebreak_p2 || 0;
            } else {
                pt1 = m.points_p1 || '0';
                pt2 = m.points_p2 || '0';
            }
            p1SetsHtml += '<div class="lm-points-score">' + pt1 + '</div>';
            p2SetsHtml += '<div class="lm-points-score">' + pt2 + '</div>';
        }

        // Score panel
        var scorePanelHtml =
            '<div class="lm-score-panel">' +
                '<div class="lm-live-badge ' + badgeClass + '"><span class="lm-dot"></span> ' + badgeText + '</div>' +
                '<div class="lm-players">' +
                    '<div class="lm-player-row' + (m.serving_player === 1 ? ' lm-serving' : '') + (m.winner_player === 1 ? ' lm-winner-row' : '') + '">' +
                        avatarHtml(p1, p1Name) +
                        '<div class="lm-name-block"><div class="lm-player-name">' +
                            (m.serving_player === 1 ? '<span class="lm-serve-indicator"></span>' : '') +
                            esc(p1Name) +
                        '</div></div>' +
                        '<div class="lm-scores">' + p1SetsHtml + '</div>' +
                    '</div>' +
                    '<div class="lm-player-row' + (m.serving_player === 2 ? ' lm-serving' : '') + (m.winner_player === 2 ? ' lm-winner-row' : '') + '">' +
                        avatarHtml(p2, p2Name) +
                        '<div class="lm-name-block"><div class="lm-player-name">' +
                            (m.serving_player === 2 ? '<span class="lm-serve-indicator"></span>' : '') +
                            esc(p2Name) +
                        '</div></div>' +
                        '<div class="lm-scores">' + p2SetsHtml + '</div>' +
                    '</div>' +
                '</div>' +
                (m.is_tiebreak && !isCompleted ? '<div class="lm-tiebreak-badge">' + L.tiebreak + '</div>' : '') +
                (isCompleted && m.winner_player
                    ? '<div class="lm-winner-block">' +
                        '<div class="lm-winner-text">' + esc(m.winner_player === 1 ? p1Name : p2Name) + ' ' + L.wins + '</div>' +
                        (m.final_score ? '<div class="lm-final-score">' + esc(m.final_score) + '</div>' : '') +
                      '</div>'
                    : ''
                ) +
                '<div class="lm-info">' +
                    (m.tournament_label ? '<div class="lm-info-row"><span>' + L.tournament + '</span><span class="lm-info-val">' + esc(m.tournament_label) + '</span></div>' : '') +
                    '<div class="lm-info-row"><span>' + L.format + '</span><span class="lm-info-val">' + L.bestOf + ' ' + (m.best_of || 3) + '</span></div>' +
                '</div>' +
            '</div>';

        container.innerHTML =
            backHtml +
            '<div class="lm-grid">' +
                videoHtml +
                scorePanelHtml +
            '</div>';
    }

    // ====== HELPERS ======

    function getPlayerName(p, fallbackName) {
        if (isEn && p && p.name_en) return p.name_en;
        if (isKg && p && p.name_kg) return p.name_kg;
        if (p && p.name) return p.name;
        return fallbackName || '—';
    }

    function avatarHtml(player, name) {
        if (player && player.photo) {
            return '<img class="lm-avatar" src="' + esc(player.photo) + '" alt="' + esc(name) + '">';
        }
        var initial = name ? name.charAt(0).toUpperCase() : '?';
        return '<div class="lm-avatar-placeholder">' + initial + '</div>';
    }

    function showError(msg) {
        var container = document.getElementById('lmContainer');
        if (container) container.innerHTML = '<div class="lm-error">' + msg + '</div>';
    }

    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function extractYoutubeId(url) {
        if (!url) return null;
        var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
