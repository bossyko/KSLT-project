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

    function createInitialState(bestOf, setFormat) {
        return {
            best_of: bestOf || 3,
            sets_to_win: bestOf === 5 ? 3 : bestOf === 1 ? 1 : 2,
            set_format: setFormat || 'standard',
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
        var isShort = state.set_format === 'short';

        // Check set win
        if (isShort) {
            // Short format: win at 6 (opponent < 5), tiebreak at 5-5
            if (g1 >= 6 && g2 < 5) {
                wonSet(state, 1);
            } else if (g2 >= 6 && g1 < 5) {
                wonSet(state, 2);
            } else if (g1 === 5 && g2 === 5) {
                state.is_tiebreak = true;
                state.tiebreak_p1 = 0;
                state.tiebreak_p2 = 0;
            }
        } else {
            // Standard format: win at 6 with 2-game lead, tiebreak at 6-6
            if (g1 >= 6 && g1 - g2 >= 2) {
                wonSet(state, 1);
            } else if (g2 >= 6 && g2 - g1 >= 2) {
                wonSet(state, 2);
            } else if (g1 === 6 && g2 === 6) {
                state.is_tiebreak = true;
                state.tiebreak_p1 = 0;
                state.tiebreak_p2 = 0;
            }
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
            set_format: state.set_format || 'standard',
            history: state.history
        };
    }

    function dbToState(dbMatch) {
        return {
            best_of: dbMatch.best_of || 3,
            sets_to_win: (dbMatch.best_of || 3) === 5 ? 3 : (dbMatch.best_of || 3) === 1 ? 1 : 2,
            set_format: dbMatch.set_format || 'standard',
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

    var CHANGEOVER_GAME = 180; // 3 minutes between odd games
    var CHANGEOVER_SET = 300;  // 5 minutes between sets

    var umpireKey = null;
    /* ОКНО МЕТКИ. После очка на три секунды открывается пара «Эйс» /
       «Двойная». Метка необязательна: не нажал — розыгрыш записан обычным,
       и одно касание на розыгрыш остаётся одним. */
    var markSeq = null;      // номер розыгрыша, к которому метка относится
    var markUntil = 0;
    var markTimer = null;
    var markSet = null;
    var wakeLock = null;
    var matchData = null;
    var state = null;
    var saveTimeout = null;
    var serveChosen = false;
    var changeoverEndTime = 0;
    var changeoverTotalSec = 0;
    var changeoverInterval = null;

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
            if (state.status === 'live' || state.status === 'warmup') keepAwake();
        });
    }

    /* ЖУРНАЛ РОЗЫГРЫШЕЙ. Отдельно от history: history — это стек отмены,
       полные снимки состояния для кнопки «назад». Журнал хранит РОЗЫГРЫШИ
       и живёт в таблице live_match_points, его читает страница матча.
       Пишется функцией umpire_log_point: судья работает анонимно и
       удостоверяется ключом, прямой записи в таблицу у него нет. */
    function logPoint(entry) {
        var client = window.supabaseClient;
        if (!client) return;
        client.rpc('umpire_log_point', { p_key: umpireKey, p_entry: entry })
            .then(function(res) {
                if (res.error) { console.error('Журнал розыгрыша:', res.error); return; }
                /* Номер нужен метке: она ставится ПО НОМЕРУ, а не на
                   «последний розыгрыш». Вставка уходит асинхронно, и пока
                   она в пути «последним» остаётся предыдущее очко. */
                if (res.data && res.data.ok) markSeq = res.data.seq;
            });
    }

    /* Метка эйса и двойной. Судья и так объявляет их вслух — суждения не
       требуется. «Виннер» и «невынужденную» не спрашиваем: на больших
       турнирах их считает отдельный логгер, а у нас один человек. */
    function markPoint(kind) {
        var client = window.supabaseClient;
        if (!client || markSeq === null) return;
        markSet = (markSet === kind) ? null : kind;
        render();
        client.rpc('umpire_mark_point', { p_key: umpireKey, p_seq: markSeq, p_mark: markSet })
            .then(function(res) {
                if (res.error) console.error('Метка розыгрыша:', res.error);
            });
    }

    function openMarkWindow() {
        markSet = null;
        markUntil = Date.now() + 3000;
        clearTimeout(markTimer);
        markTimer = setTimeout(function() { markUntil = 0; render(); }, 3000);
    }

    function markWindowOpen() {
        return Date.now() < markUntil && markSeq !== null;
    }

    /* ЭКРАН НЕ ГАСНЕТ. Судья держит телефон весь матч, и система усыпляет
       его между розыгрышами. Работает не везде — там, где нет, ведёт себя
       как раньше, молча. */
    function keepAwake() {
        if (!navigator.wakeLock) return;
        navigator.wakeLock.request('screen').then(function(l) {
            wakeLock = l;
            l.addEventListener('release', function() { wakeLock = null; });
        }).catch(function() { /* отказано или не поддержано — не беда */ });
    }

    /* Отмена судьи честно убирает розыгрыш и из ленты зрителя: если судья
       нажал «отменить», этого розыгрыша не было. */
    function undoPoint() {
        var client = window.supabaseClient;
        if (!client) return;
        client.rpc('umpire_undo_point', { p_key: umpireKey })
            .then(function(res) {
                if (res.error) console.error('Отмена розыгрыша:', res.error);
            });
    }

    /* Отпечаток счёта — чтобы отличить отмену РОЗЫГРЫША от отмены выбора
       подачи: обе проходят через один и тот же стек. */
    function scoreFingerprint(st) {
        return [st.current_set, st.sets_data.length, st.current_game_p1,
                st.current_game_p2, st.points_p1, st.points_p2,
                st.tiebreak_p1, st.tiebreak_p2].join('|');
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

    function startChangeover(seconds) {
        clearChangeover();
        changeoverTotalSec = seconds;
        changeoverEndTime = Date.now() + seconds * 1000;
        changeoverInterval = setInterval(function() {
            if (Date.now() >= changeoverEndTime) {
                clearChangeover();
            }
            render();
        }, 1000);
        render();
    }

    function clearChangeover() {
        changeoverEndTime = 0;
        changeoverTotalSec = 0;
        if (changeoverInterval) {
            clearInterval(changeoverInterval);
            changeoverInterval = null;
        }
    }

    function getChangeoverRemaining() {
        if (!changeoverEndTime) return 0;
        var ms = changeoverEndTime - Date.now();
        return ms > 0 ? Math.ceil(ms / 1000) : 0;
    }

    function handleScore(player) {
        if (state.status === 'completed') return;

        // Clear any active changeover — umpire starts scoring
        if (changeoverEndTime) clearChangeover();

        var prevSetsCount = state.sets_data.length;
        var prevGames = state.current_game_p1 + state.current_game_p2;
        var доРозыгрыша = {
            set_no:  state.current_set,
            game_no: prevGames + 1,
            serving: state.serving_player,
            tb:      !!state.is_tiebreak
        };

        state = scorePoint(state, player);
        markSeq = null;          // новый розыгрыш — прежний номер недействителен
        openMarkWindow();
        render();
        saveState();

        /* Запись в журнал — после того, как состояние пересчитано:
           в ленте показывается счёт ПОСЛЕ розыгрыша, как на ATP. */
        (function() {
            var взятГейм = (state.current_game_p1 + state.current_game_p2) > prevGames
                        || state.sets_data.length > prevSetsCount;
            var g1, g2;
            if (state.sets_data.length > prevSetsCount) {
                var завершённый = state.sets_data[state.sets_data.length - 1] || {};
                g1 = завершённый.g1; g2 = завершённый.g2;
            } else {
                g1 = state.current_game_p1; g2 = state.current_game_p2;
            }
            logPoint({
                set_no:  доРозыгрыша.set_no,
                game_no: доРозыгрыша.game_no,
                winner:  player,
                p1: String(доРозыгрыша.tb ? state.tiebreak_p1 : state.points_p1),
                p2: String(доРозыгрыша.tb ? state.tiebreak_p2 : state.points_p2),
                g1: g1, g2: g2,
                game_won: взятГейм ? player : null,
                /* Брейк — гейм, взятый НЕ подающим. */
                is_break: !!(взятГейм && доРозыгрыша.serving && player !== доРозыгрыша.serving),
                is_tiebreak: доРозыгрыша.tb
            });
        })();

        if (state.status === 'completed') return;

        // Set just ended → 5 min changeover
        if (state.sets_data.length > prevSetsCount) {
            startChangeover(CHANGEOVER_SET);
            return;
        }

        // Game just ended (same set) → check odd total for 3 min changeover
        var newGames = state.current_game_p1 + state.current_game_p2;
        if (newGames > prevGames && newGames % 2 === 1 && newGames > 1) {
            startChangeover(CHANGEOVER_GAME);
        }
    }

    function handleUndo() {
        if (changeoverEndTime) clearChangeover();
        var было = scoreFingerprint(state);
        state = undo(state);
        render();
        saveState();
        /* Через этот же стек проходит и выбор подачи. Розыгрыш убираем из
           журнала ТОЛЬКО если счёт действительно изменился, иначе отмена
           выбора подачи стёрла бы чужую запись. */
        if (scoreFingerprint(state) !== было) {
            undoPoint();
            /* Отмена уносит и метку: строки больше нет, помечать нечего. */
            markSeq = null; markSet = null; markUntil = 0;
            clearTimeout(markTimer);
        }
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
            winnerHtml = '<div class="um-winner">' + esc(winnerName) + ' побеждает! ' + state.final_score + '</div>';
        }

        app.innerHTML =
            /* Судья видит, КАКОЙ матч ведёт: до 24.09 на экране были только
               счёт и кнопки, и при двух матчах подряд перепутать было легко. */
            '<div class="um-match-head">' +
                '<div class="um-match-players">' + esc(p1Name) + ' — ' + esc(p2Name) + '</div>' +
                (matchData.tournament_label
                    ? '<div class="um-match-meta">' + esc(matchData.tournament_label) +
                      ' · лучший из ' + (matchData.best_of || 3) + '</div>'
                    : '') +
            '</div>' +
            '<div class="um-status um-status-' + statusClass + '">' + statusLabel + '</div>' +
            winnerHtml +
            '<div class="um-scoreboard">' +
                // Player 1 row
                '<div class="um-player-row' + (state.serving_player === 1 ? ' um-serving' : '') + (state.winner_player === 1 ? ' um-winner-row' : '') + '">' +
                    '<div class="um-serve-dot">' + (state.serving_player === 1 ? '<span></span>' : '') + '</div>' +
                    '<div class="um-player-name">' + esc(p1Name) + '</div>' +
                    '<div class="um-games">' + state.current_game_p1 + '</div>' +
                    '<div class="um-points">' + pts.p1 + '</div>' +
                '</div>' +
                // Player 2 row
                '<div class="um-player-row' + (state.serving_player === 2 ? ' um-serving' : '') + (state.winner_player === 2 ? ' um-winner-row' : '') + '">' +
                    '<div class="um-serve-dot">' + (state.serving_player === 2 ? '<span></span>' : '') + '</div>' +
                    '<div class="um-player-name">' + esc(p2Name) + '</div>' +
                    '<div class="um-games">' + state.current_game_p2 + '</div>' +
                    '<div class="um-points">' + pts.p2 + '</div>' +
                '</div>' +
            '</div>' +
            (setsHtml ? '<div class="um-sets">' + setsHtml + '</div>' : '') +
            (state.is_tiebreak ? '<div class="um-tiebreak-label">Тайбрейк</div>' : '') +
            (function() {
                var rem = getChangeoverRemaining();
                if (!rem) return '';
                var min = Math.floor(rem / 60);
                var sec = rem % 60;
                var timeStr = min + ':' + (sec < 10 ? '0' : '') + sec;
                var isSetBreak = changeoverTotalSec === CHANGEOVER_SET;
                var label = isSetBreak ? 'Перерыв между сетами' : 'Переход';
                var pct = Math.round((rem / changeoverTotalSec) * 100);
                return '<div class="um-changeover">' +
                    '<div class="um-changeover-label">' + label + '</div>' +
                    '<div class="um-changeover-time">' + timeStr + '</div>' +
                    '<div class="um-changeover-bar"><div class="um-changeover-fill" style="width:' + pct + '%;"></div></div>' +
                    '<button class="um-btn um-btn-continue" id="umContinue">Продолжить ▶</button>' +
                '</div>';
            })() +
            (isWarmup
                ? '<div class="um-serve-choice">' +
                    '<div class="um-serve-choice-title">Кто подаёт первым?</div>' +
                    '<div class="um-serve-choice-btns">' +
                        '<button class="um-btn um-btn-serve' + (serveChosen && state.serving_player === 1 ? ' um-btn-serve-active' : '') + '" id="umServe1">' + esc(p1Name) + '</button>' +
                        '<button class="um-btn um-btn-serve' + (serveChosen && state.serving_player === 2 ? ' um-btn-serve-active' : '') + '" id="umServe2">' + esc(p2Name) + '</button>' +
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
            (!isCompleted && !isWarmup && markWindowOpen()
                ? '<div class="um-marks">' +
                    '<button class="um-btn um-btn-mark' + (markSet === 'ace' ? ' is-set' : '') + '" id="umAce">Эйс</button>' +
                    '<button class="um-btn um-btn-mark' + (markSet === 'double' ? ' is-set' : '') + '" id="umDouble">Двойная</button>' +
                  '</div>'
                : '') +
            (!isCompleted && !isWarmup
                ? '<div class="um-bottom-actions">' +
                    '<button class="um-btn um-btn-undo" id="umUndo">↩ Отмена</button>' +
                    '<button class="um-btn um-btn-pause" id="umPause">' + (isPaused ? '▶ Продолжить' : '⏸ Пауза') + '</button>' +
                  '</div>'
                : ''
            );

        // Bind events
        var btnContinue = document.getElementById('umContinue');
        var btnServe1 = document.getElementById('umServe1');
        var btnServe2 = document.getElementById('umServe2');
        var btnStart = document.getElementById('umStart');
        var btnP1 = document.getElementById('umP1');
        var btnP2 = document.getElementById('umP2');
        var btnUndo = document.getElementById('umUndo');
        var btnPause = document.getElementById('umPause');

        if (btnContinue) btnContinue.addEventListener('click', function() { clearChangeover(); render(); });
        if (btnServe1) btnServe1.addEventListener('click', function() { handleChooseServe(1); });
        if (btnServe2) btnServe2.addEventListener('click', function() { handleChooseServe(2); });
        if (btnStart) btnStart.addEventListener('click', handleStart);
        if (btnP1) btnP1.addEventListener('click', function() { handleScore(1); });
        if (btnP2) btnP2.addEventListener('click', function() { handleScore(2); });
        var btnAce = document.getElementById('umAce');
        var btnDouble = document.getElementById('umDouble');
        if (btnAce) btnAce.addEventListener('click', function() { markPoint('ace'); });
        if (btnDouble) btnDouble.addEventListener('click', function() { markPoint('double'); });
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

    /* Браузер снимает блокировку экрана, когда вкладка уходит в фон.
       Судья вернулся — возвращаем. */
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && !wakeLock && state &&
            (state.status === 'live' || state.status === 'warmup')) keepAwake();
    });

    // Init when DOM ready
    if (document.getElementById('um-app')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
})();
