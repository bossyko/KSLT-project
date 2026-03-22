/**
 * KSLT — Tennis Umpire Engine + UI
 * Pure scoring logic + umpire page controller
 */
(function() {
    'use strict';

    // ============================================================
    // TENNIS ENGINE — pure scoring logic
    // ============================================================

    var POINTS = ['0', '15', '30', '40'];

    function createInitialState(bestOf) {
        return {
            best_of: bestOf || 3,
            sets_to_win: bestOf === 5 ? 3 : bestOf === 1 ? 1 : 2,
            serving_player: 1,
            points_p1: '0',
            points_p2: '0',
            current_set: 1,
            sets_data: [],
            current_game_p1: 0,
            current_game_p2: 0,
            is_tiebreak: false,
            tiebreak_p1: 0,
            tiebreak_p2: 0,
            status: 'warmup',
            winner_player: null,
            final_score: null,
            history: []
        };
    }

    function cloneState(s) {
        return JSON.parse(JSON.stringify(s));
    }

    function pushHistory(state) {
        var snap = cloneState(state);
        delete snap.history;
        state.history.push(snap);
        // Keep last 200 entries
        if (state.history.length > 200) state.history = state.history.slice(-200);
    }

    function undo(state) {
        if (!state.history.length) return state;
        var prev = state.history.pop();
        prev.history = state.history;
        return prev;
    }

    function switchServe(state) {
        state.serving_player = state.serving_player === 1 ? 2 : 1;
    }

    function wonSet(state, player) {
        var g1 = state.current_game_p1;
        var g2 = state.current_game_p2;
        var tb1 = state.is_tiebreak ? state.tiebreak_p1 : null;
        var tb2 = state.is_tiebreak ? state.tiebreak_p2 : null;

        state.sets_data.push({ g1: g1, g2: g2, tb1: tb1, tb2: tb2 });
        state.current_game_p1 = 0;
        state.current_game_p2 = 0;
        state.is_tiebreak = false;
        state.tiebreak_p1 = 0;
        state.tiebreak_p2 = 0;
        state.points_p1 = '0';
        state.points_p2 = '0';
        state.current_set++;

        // Check match win
        var setsWon1 = 0, setsWon2 = 0;
        state.sets_data.forEach(function(s) {
            if (s.g1 > s.g2) setsWon1++;
            else setsWon2++;
        });

        if (player === 1 && setsWon1 >= state.sets_to_win) {
            state.status = 'completed';
            state.winner_player = 1;
            state.final_score = buildFinalScore(state.sets_data);
        } else if (player === 2 && setsWon2 >= state.sets_to_win) {
            state.status = 'completed';
            state.winner_player = 2;
            state.final_score = buildFinalScore(state.sets_data);
        }
    }

    function wonGame(state, player) {
        if (player === 1) state.current_game_p1++;
        else state.current_game_p2++;

        state.points_p1 = '0';
        state.points_p2 = '0';

        var g1 = state.current_game_p1;
        var g2 = state.current_game_p2;

        // Check set win
        if (g1 >= 6 && g1 - g2 >= 2) {
            wonSet(state, 1);
        } else if (g2 >= 6 && g2 - g1 >= 2) {
            wonSet(state, 2);
        } else if (g1 === 6 && g2 === 6) {
            // Tiebreak
            state.is_tiebreak = true;
            state.tiebreak_p1 = 0;
            state.tiebreak_p2 = 0;
        }

        if (!state.is_tiebreak) {
            switchServe(state);
        }
    }

    function scoreTiebreakPoint(state, player) {
        if (player === 1) state.tiebreak_p1++;
        else state.tiebreak_p2++;

        var tb1 = state.tiebreak_p1;
        var tb2 = state.tiebreak_p2;

        // Switch serve: after 1st point, then every 2 points
        var totalTbPoints = tb1 + tb2;
        if (totalTbPoints === 1 || (totalTbPoints > 1 && (totalTbPoints - 1) % 2 === 0)) {
            switchServe(state);
        }

        // Check tiebreak win: 7+ with 2+ lead
        if (tb1 >= 7 && tb1 - tb2 >= 2) {
            state.current_game_p1++;
            wonSet(state, 1);
            if (state.status !== 'completed') switchServe(state);
        } else if (tb2 >= 7 && tb2 - tb1 >= 2) {
            state.current_game_p2++;
            wonSet(state, 2);
            if (state.status !== 'completed') switchServe(state);
        }
    }

    function scorePoint(state, player) {
        if (state.status === 'completed') return state;

        pushHistory(state);

        if (state.status === 'warmup') {
            state.status = 'live';
        }

        // Tiebreak
        if (state.is_tiebreak) {
            scoreTiebreakPoint(state, player);
            return state;
        }

        // Regular game scoring
        var pp1 = state.points_p1;
        var pp2 = state.points_p2;

        if (player === 1) {
            if (pp1 === 'AD') {
                // Win game
                wonGame(state, 1);
            } else if (pp1 === '40') {
                if (pp2 === '40') {
                    // Deuce → AD
                    state.points_p1 = 'AD';
                } else if (pp2 === 'AD') {
                    // Back to deuce
                    state.points_p2 = '40';
                } else {
                    // Win game
                    wonGame(state, 1);
                }
            } else {
                // 0→15→30→40
                var idx = POINTS.indexOf(pp1);
                state.points_p1 = POINTS[idx + 1];
            }
        } else {
            if (pp2 === 'AD') {
                wonGame(state, 2);
            } else if (pp2 === '40') {
                if (pp1 === '40') {
                    state.points_p2 = 'AD';
                } else if (pp1 === 'AD') {
                    state.points_p1 = '40';
                } else {
                    wonGame(state, 2);
                }
            } else {
                var idx2 = POINTS.indexOf(pp2);
                state.points_p2 = POINTS[idx2 + 1];
            }
        }

        return state;
    }

    function buildFinalScore(setsData) {
        return setsData.map(function(s) {
            var base = s.g1 + '/' + s.g2;
            if (s.tb1 !== null && s.tb1 !== undefined) {
                var loserTb = Math.min(s.tb1, s.tb2);
                base += '(' + loserTb + ')';
            }
            return base;
        }).join(' ');
    }

    function stateToDb(state) {
        return {
            serving_player: state.serving_player,
            points_p1: state.points_p1,
            points_p2: state.points_p2,
            current_set: state.current_set,
            sets_data: state.sets_data,
            current_game_p1: state.current_game_p1,
            current_game_p2: state.current_game_p2,
            is_tiebreak: state.is_tiebreak,
            tiebreak_p1: state.tiebreak_p1,
            tiebreak_p2: state.tiebreak_p2,
            status: state.status,
            winner_player: state.winner_player,
            final_score: state.final_score,
            history: state.history
        };
    }

    function dbToState(dbMatch) {
        return {
            best_of: dbMatch.best_of || 3,
            sets_to_win: (dbMatch.best_of || 3) === 5 ? 3 : (dbMatch.best_of || 3) === 1 ? 1 : 2,
            serving_player: dbMatch.serving_player || 1,
            points_p1: dbMatch.points_p1 || '0',
            points_p2: dbMatch.points_p2 || '0',
            current_set: dbMatch.current_set || 1,
            sets_data: dbMatch.sets_data || [],
            current_game_p1: dbMatch.current_game_p1 || 0,
            current_game_p2: dbMatch.current_game_p2 || 0,
            is_tiebreak: dbMatch.is_tiebreak || false,
            tiebreak_p1: dbMatch.tiebreak_p1 || 0,
            tiebreak_p2: dbMatch.tiebreak_p2 || 0,
            status: dbMatch.status || 'warmup',
            winner_player: dbMatch.winner_player || null,
            final_score: dbMatch.final_score || null,
            history: dbMatch.history || []
        };
    }

    // ============================================================
    // UMPIRE UI — page controller
    // ============================================================

    var umpireKey = null;
    var matchData = null;
    var state = null;
    var saveTimeout = null;
    var serveChosen = false;

    function init() {
        var params = new URLSearchParams(window.location.search);
        umpireKey = params.get('key');
        if (!umpireKey) {
            document.getElementById('um-app').innerHTML = '<div class="um-error">Неверная ссылка судьи</div>';
            return;
        }
        loadMatch();
    }

    function loadMatch() {
        var client = window.supabaseClient;
        if (!client) {
            document.getElementById('um-app').innerHTML = '<div class="um-error">Ошибка загрузки</div>';
            return;
        }

        client.rpc('get_live_by_umpire_key', { p_key: umpireKey }).then(function(res) {
            if (res.error || !res.data || !res.data.ok) {
                document.getElementById('um-app').innerHTML = '<div class="um-error">Матч не найден</div>';
                return;
            }
            matchData = res.data.match;
            state = dbToState(matchData);
            render();
        });
    }

    function saveState() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            var client = window.supabaseClient;
            if (!client) return;
            var dbState = stateToDb(state);
            client.rpc('umpire_save_state', { p_key: umpireKey, p_state: dbState }).then(function(res) {
                if (res.error) console.error('Save error:', res.error);
            });
        }, 300);
    }

    function handleScore(player) {
        if (state.status === 'completed') return;
        state = scorePoint(state, player);
        render();
        saveState();
    }

    function handleUndo() {
        state = undo(state);
        render();
        saveState();
    }

    function handleChooseServe(player) {
        state.serving_player = player;
        serveChosen = true;
        render();
        saveState();
    }

    function handleStart() {
        if (state.status === 'warmup') {
            state.status = 'live';
            pushHistory(state);
            render();
            saveState();
        }
    }

    function handlePause() {
        if (state.status === 'live') {
            state.status = 'paused';
            render();
            saveState();
        } else if (state.status === 'paused') {
            state.status = 'live';
            render();
            saveState();
        }
    }

    function getPointDisplay(p1, p2, isTb) {
        if (isTb) return { p1: state.tiebreak_p1.toString(), p2: state.tiebreak_p2.toString() };
        return { p1: p1, p2: p2 };
    }

    function render() {
        var app = document.getElementById('um-app');
        if (!app || !state) return;

        var p1Name = matchData.player1_name || 'Игрок 1';
        var p2Name = matchData.player2_name || 'Игрок 2';

        var pts = getPointDisplay(state.points_p1, state.points_p2, state.is_tiebreak);
        var isCompleted = state.status === 'completed';
        var isWarmup = state.status === 'warmup';
        var isPaused = state.status === 'paused';

        // Sets display
        var setsHtml = '';
        state.sets_data.forEach(function(s, i) {
            setsHtml += '<div class="um-set-score"><span class="um-set-label">Сет ' + (i + 1) + '</span>';
            setsHtml += '<span class="um-set-val">' + s.g1 + '</span>';
            setsHtml += '<span class="um-set-sep">:</span>';
            setsHtml += '<span class="um-set-val">' + s.g2 + '</span>';
            if (s.tb1 !== null && s.tb1 !== undefined) {
                setsHtml += '<span class="um-set-tb">(' + Math.min(s.tb1, s.tb2) + ')</span>';
            }
            setsHtml += '</div>';
        });

        // Status label
        var statusLabel = isWarmup ? 'Разминка' : isPaused ? 'Пауза' : isCompleted ? 'Матч завершён' : 'Live';
        var statusClass = isWarmup ? 'warmup' : isPaused ? 'paused' : isCompleted ? 'completed' : 'live';

        // Winner banner
        var winnerHtml = '';
        if (isCompleted) {
            var winnerName = state.winner_player === 1 ? p1Name : p2Name;
            winnerHtml = '<div class="um-winner">🏆 ' + winnerName + ' побеждает! ' + state.final_score + '</div>';
        }

        app.innerHTML =
            '<div class="um-status um-status-' + statusClass + '">' + statusLabel + '</div>' +
            winnerHtml +
            '<div class="um-scoreboard">' +
                // Player 1 row
                '<div class="um-player-row' + (state.serving_player === 1 ? ' um-serving' : '') + (state.winner_player === 1 ? ' um-winner-row' : '') + '">' +
                    '<div class="um-serve-dot">' + (state.serving_player === 1 ? '🎾' : '') + '</div>' +
                    '<div class="um-player-name">' + esc(p1Name) + '</div>' +
                    '<div class="um-games">' + state.current_game_p1 + '</div>' +
                    '<div class="um-points">' + pts.p1 + '</div>' +
                '</div>' +
                // Player 2 row
                '<div class="um-player-row' + (state.serving_player === 2 ? ' um-serving' : '') + (state.winner_player === 2 ? ' um-winner-row' : '') + '">' +
                    '<div class="um-serve-dot">' + (state.serving_player === 2 ? '🎾' : '') + '</div>' +
                    '<div class="um-player-name">' + esc(p2Name) + '</div>' +
                    '<div class="um-games">' + state.current_game_p2 + '</div>' +
                    '<div class="um-points">' + pts.p2 + '</div>' +
                '</div>' +
            '</div>' +
            (setsHtml ? '<div class="um-sets">' + setsHtml + '</div>' : '') +
            (state.is_tiebreak ? '<div class="um-tiebreak-label">Тайбрейк</div>' : '') +
            (isWarmup
                ? '<div class="um-serve-choice">' +
                    '<div class="um-serve-choice-title">Кто подаёт первым?</div>' +
                    '<div class="um-serve-choice-btns">' +
                        '<button class="um-btn um-btn-serve' + (serveChosen && state.serving_player === 1 ? ' um-btn-serve-active' : '') + '" id="umServe1">🎾 ' + esc(p1Name) + '</button>' +
                        '<button class="um-btn um-btn-serve' + (serveChosen && state.serving_player === 2 ? ' um-btn-serve-active' : '') + '" id="umServe2">🎾 ' + esc(p2Name) + '</button>' +
                    '</div>' +
                  '</div>'
                : '') +
            '<div class="um-actions">' +
                (isWarmup
                    ? (serveChosen
                        ? '<button class="um-btn um-btn-start" id="umStart">Начать матч</button>'
                        : '')
                    : isCompleted
                        ? ''
                        : '<button class="um-btn um-btn-p1" id="umP1">Очко<br>' + esc(p1Name) + '</button>' +
                          '<button class="um-btn um-btn-p2" id="umP2">Очко<br>' + esc(p2Name) + '</button>'
                ) +
            '</div>' +
            (!isCompleted && !isWarmup
                ? '<div class="um-bottom-actions">' +
                    '<button class="um-btn um-btn-undo" id="umUndo">↩ Отмена</button>' +
                    '<button class="um-btn um-btn-pause" id="umPause">' + (isPaused ? '▶ Продолжить' : '⏸ Пауза') + '</button>' +
                  '</div>'
                : ''
            );

        // Bind events
        var btnServe1 = document.getElementById('umServe1');
        var btnServe2 = document.getElementById('umServe2');
        var btnStart = document.getElementById('umStart');
        var btnP1 = document.getElementById('umP1');
        var btnP2 = document.getElementById('umP2');
        var btnUndo = document.getElementById('umUndo');
        var btnPause = document.getElementById('umPause');

        if (btnServe1) btnServe1.addEventListener('click', function() { handleChooseServe(1); });
        if (btnServe2) btnServe2.addEventListener('click', function() { handleChooseServe(2); });
        if (btnStart) btnStart.addEventListener('click', handleStart);
        if (btnP1) btnP1.addEventListener('click', function() { handleScore(1); });
        if (btnP2) btnP2.addEventListener('click', function() { handleScore(2); });
        if (btnUndo) btnUndo.addEventListener('click', handleUndo);
        if (btnPause) btnPause.addEventListener('click', handlePause);
    }

    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // Export engine for scoreboard/live-match reuse
    window.TennisEngine = {
        createInitialState: createInitialState,
        scorePoint: scorePoint,
        undo: undo,
        buildFinalScore: buildFinalScore,
        stateToDb: stateToDb,
        dbToState: dbToState
    };

    // Init when DOM ready
    if (document.getElementById('um-app')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
})();
