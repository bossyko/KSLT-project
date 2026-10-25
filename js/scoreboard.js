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
                renderPause(res.data);
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

        /* КОЛОНКИ НЕ ПОДПИСЫВАЮТСЯ. До 13.10 здесь собиралась строка
           setsHeaderHtml с подписями S1/G/P — и НИКУДА не вставлялась:
           замер дал 0 элементов .sb-col-header в DOM и ни одного селектора
           в css. Подписи не оживлены, а сняты: в трансляции ATP, Wimbledon
           и ESPN их нет, смысл несут положение и лайм на двух правых
           колонках. */
        var setsP1Html = '';
        var setsP2Html = '';

        setsData.forEach(function(s) {
            setsP1Html += '<div class="sb-set-val">' + s.g1 + '</div>';
            setsP2Html += '<div class="sb-set-val">' + s.g2 + '</div>';
        });

        // Current game
        if (!isCompleted) {
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
            setsP1Html += '<div class="sb-pts-val">' + KSLT_экранировать(pt1) + '</div>';
            setsP2Html += '<div class="sb-pts-val">' + KSLT_экранировать(pt2) + '</div>';
        }

        /* ТОЧКА, А НЕ ЭМОДЗИ: встроенный браузер OBS рисует `🎾` своим
           шрифтом, и где его нет — будет квадрат. */
        var serveDot = '<span class="sb-serve" aria-hidden="true"></span>';

        root.innerHTML =
            '<div class="sb-board">' +
                '<div class="sb-row sb-row-p1">' +
                    '<div class="sb-name">' +
                        (m.serving_player === 1 ? serveDot : '') +
                        KSLT_экранировать(p1Name) +
                    '</div>' +
                    '<div class="sb-scores">' + setsP1Html + '</div>' +
                '</div>' +
                '<div class="sb-row sb-row-p2">' +
                    '<div class="sb-name">' +
                        (m.serving_player === 2 ? serveDot : '') +
                        KSLT_экранировать(p2Name) +
                    '</div>' +
                    '<div class="sb-scores">' + setsP2Html + '</div>' +
                '</div>' +
            '</div>';
    }

    /**
     * ПЕРЕРЫВ НА ТАБЛО — ДОЛГ С 25.09 ЗАКРЫТ 13.10.
     *
     * Словарь причин лежит в js/live-texts.js и до 13.10 его звала ТОЛЬКО
     * страница матча (js/live-match.js:249). Зритель в зале, который смотрит
     * на табло, видел замерший счёт и не знал почему.
     *
     * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: состояние читается теми же полями и
     * в том же порядке, что на странице матча, — `paused` с причиной, затем
     * перерыв по `break_until` с видом `break_kind`. Своей логики здесь нет.
     *
     * ЧИСЛА НЕ ПОКАЗЫВАЕМ по той же причине, что на странице матча: отсчёт
     * у табло свой не ведётся, а прыгающие цифры читаются как поломка.
     */
    function renderPause(m) {
        var el = document.getElementById('sb-pause');
        if (!el) return;

        var Т = window.KSLTLiveTexts;
        if (!Т) {
            console.error('Не подключён js/live-texts.js — причина перерыва на табло не покажется');
            el.innerHTML = '';
            return;
        }

        var завершён = m.status === 'completed';
        var наПаузе  = m.status === 'paused';
        var разминка = m.status === 'warmup';
        var идётПерерыв = !завершён && !наПаузе && !разминка && Т.остаток(m.break_until) > 0;

        var текст = разминка ? Т.слово('warmup')
                  : наПаузе ? Т.пауза(m.pause_reason)
                  : идётПерерыв ? Т.слово(m.break_kind || 'changeover')
                  : '';

        el.innerHTML = текст ? '<div class="sb-pause">' + KSLT_экранировать(текст) + '</div>' : '';
    }

    function renderLogos(sponsorLogo) {
        var logosEl = document.getElementById('sb-logos');
        if (!logosEl) return;
        var html = '';
        if (sponsorLogo) {
            html += '<img src="' + KSLT_экранировать(sponsorLogo) + '" class="sb-logo-img" alt="Sponsor">';
        }
        html += '<img src="../favicon.svg" class="sb-logo-kslt" alt="KSLT">';
        logosEl.innerHTML = html;
    }

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА. Прежде здесь
       стоял способ через `textContent`: он безопасен в текстовом узле, но
       НЕ ЭКРАНИРУЕТ КАВЫЧКИ ВОВСЕ, а результат подставляется внутрь
       атрибута (`title=`, `src=`, `alt=`) — там кавычка в имени игрока
       или в адресе логотипа закрывает атрибут. Эталон взят дословно у
       `js/kslt-lenta.js`. */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
