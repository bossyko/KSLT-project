// ========================================
// Battles Overview — Supabase
// ========================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;

    var CAT_LABELS = {
        'men-tour': 'Tour', 'men-futures': 'Futures', 'men-challenger': 'Challenger',
        'men-masters': 'Masters', 'men-promasters': 'Pro-Masters',
        'women-tour': 'Tour', 'women-futures': 'Futures', 'women-challenger': 'Challenger',
        'women-masters': 'Masters', 'women-promasters': 'Pro-Masters'
    };

    var months = isEn
        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        : (isKg
            ? ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
            : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']);

    var L = isEn ? {
        heroTitle: 'Battles',
        heroDesc: 'All KSLT battles — player challenges with community voting',
        heroBadge: 'BATTLES',
        activeTitle: 'Upcoming Battles',
        completedTitle: 'Completed Battles',
        vs: 'VS',
        votes: 'votes',
        details: 'Details',
        empty: 'No battles yet',
        emptyCompleted: 'No completed battles',
        completedBadge: 'Finished', voteBadge: 'Voting',
        showMore: 'Show {n} more', shownOf: '{n} of {total}',
        winner: 'Winner',
        result: 'Result',
        loginToVote: 'Log in to vote',
        votingClosed: 'Voting closed',
        yourVote: 'Your vote',
        voteRecorded: 'Vote recorded!',
        alreadyVoted: 'You already voted',
        searchPlaceholder: 'Search battle...',
        nothingFound: 'Nothing found',
        openIn: 'Open in',
        cancel: 'Cancel'
    } : (isKg ? {
        heroTitle: 'Баттлдар',
        heroDesc: 'KSLT баттлдарынын баары — оюнчулардын чакыруулары жана коомчулуктун добуш берүүсү',
        heroBadge: 'БАТТЛДАР',
        activeTitle: 'Алдыдагы баттлдар',
        completedTitle: 'Аяктаган баттлдар',
        vs: 'VS',
        votes: 'добуш',
        details: 'Толугураак',
        empty: 'Баттлдар жок',
        emptyCompleted: 'Аяктаган баттлдар жок',
        completedBadge: 'Аяктады', voteBadge: 'Добуш берүү',
        showMore: 'Дагы {n} көрсөтүү', shownOf: '{total} ичинен {n}',
        winner: 'Жеңүүчү',
        result: 'Натыйжа',
        loginToVote: 'Добуш берүү үчүн кириңиз',
        votingClosed: 'Добуш берүү жабылды',
        yourVote: 'Сиздин добуш',
        voteRecorded: 'Добуш кабыл алынды!',
        alreadyVoted: 'Сиз добуш бергенсиз',
        searchPlaceholder: 'Баттл издөө...',
        nothingFound: 'Эч нерсе табылган жок',
        openIn: 'Ачуу',
        cancel: 'Жокко чыгаруу'
    } : {
        heroTitle: 'Баттлы',
        heroDesc: 'Все баттлы KSLT — вызовы игроков с голосованием сообщества',
        heroBadge: 'БАТТЛЫ',
        activeTitle: 'Предстоящие баттлы',
        completedTitle: 'Завершённые баттлы',
        vs: 'VS',
        votes: 'гол.',
        details: 'Подробнее',
        empty: 'Баттлов пока нет',
        emptyCompleted: 'Завершённых баттлов нет',
        completedBadge: 'Завершён', voteBadge: 'Голосование',
        showMore: 'Показать ещё {n}', shownOf: 'показано {n} из {total}',
        winner: 'Победитель',
        result: 'Результат',
        loginToVote: 'Войдите, чтобы голосовать',
        votingClosed: 'Голосование закрыто',
        yourVote: 'Ваш голос',
        voteRecorded: 'Голос принят!',
        alreadyVoted: 'Вы уже проголосовали',
        searchPlaceholder: 'Поиск баттла...',
        nothingFound: 'Ничего не найдено',
        openIn: 'Открыть в',
        cancel: 'Отмена'
    });

    var CL = isEn
        ? { days: 'd', hours: 'h', min: 'm', sec: 's', prefix: 'STARTS IN' }
        : (isKg
            ? { days: 'к', hours: 'с', min: 'м', sec: 'с', prefix: 'БАШТАЛАТ' }
            : { days: 'д', hours: 'ч', min: 'м', sec: 'с', prefix: 'СТАРТ ЧЕРЕЗ' });

    var BL = isEn ? {
        total: 'Total this season',
        upcoming: 'Upcoming',
        completed: 'Completed'
    } : (isKg ? {
        total: 'Мезгилде баары',
        upcoming: 'Алдыдагы',
        completed: 'Аяктаган'
    } : {
        total: 'Всего за сезон',
        upcoming: 'Предстоящих',
        completed: 'Завершённых'
    });

    var challengePage = isEn ? 'challenge-en.html' : (isKg ? 'challenge-kg.html' : 'challenge.html');

    // Пламя, а не лист бумаги: заглушка стояла от общего набора значков и
    // на странице баттлов читалась как сломанная картинка
    var emptySvg = '<div class="bo-empty-icon">\uD83D\uDD25</div>';

    var _userId = null;
    var _userVotes = {};
    var _allBattles = [];
    var _players = {};
    var _votesData = {};
    var _searchTimer = null;
    var _countdownInterval = null;

    function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function getPlayerName(p) {
        if (!p) return '?';
        if (isEn) return p.name_en || p.name || '?';
        if (isKg) return p.name_kg || p.name || '?';
        return p.name || '?';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.getDate() + ' ' + months[d.getMonth()];
    }

    function detailUrl(id) {
        return challengePage + '?id=' + id + '&from=battles';
    }

    // Countdown helpers
    function getCountdownHtml(dateStr, timeStr) {
        if (!dateStr) return '';
        var t = timeStr || '00:00';
        var target = new Date(dateStr + 'T' + t + ':00');
        var now = new Date();
        var diff = target.getTime() - now.getTime();
        if (diff <= 0 || diff > 48 * 60 * 60 * 1000) return '';
        var dd = Math.floor(diff / (1000*60*60*24));
        var h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        var m = Math.floor((diff % (1000*60*60)) / (1000*60));
        var s = Math.floor((diff % (1000*60)) / 1000);
        var urgent = diff < 60 * 60 * 1000 ? ' bo-cd-urgent' : '';
        var parts = '<span class="bo-cd-label">' + CL.prefix + '</span>';
        if (dd > 0) parts += '<span class="bo-cd-unit">' + dd + '<small>' + CL.days + '</small></span>';
        parts += '<span class="bo-cd-unit">' + String(h).padStart(2,'0') + '<small>' + CL.hours + '</small></span>';
        parts += '<span class="bo-cd-unit">' + String(m).padStart(2,'0') + '<small>' + CL.min + '</small></span>';
        parts += '<span class="bo-cd-unit">' + String(s).padStart(2,'0') + '<small>' + CL.sec + '</small></span>';
        return '<span class="bo-cd' + urgent + '" data-cd-date="' + dateStr + '" data-cd-time="' + t + '">' + parts + '</span>';
    }

    function updateCountdowns() {
        document.querySelectorAll('.bo-cd[data-cd-date]').forEach(function(el) {
            var dateStr = el.dataset.cdDate;
            var t = el.dataset.cdTime || '00:00';
            var target = new Date(dateStr + 'T' + t + ':00');
            var now = new Date();
            var diff = target.getTime() - now.getTime();
            if (diff <= 0) {
                el.remove();
                return;
            }
            var dd = Math.floor(diff / (1000*60*60*24));
            var h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
            var m = Math.floor((diff % (1000*60*60)) / (1000*60));
            var s = Math.floor((diff % (1000*60)) / 1000);
            if (diff < 60 * 60 * 1000) el.classList.add('bo-cd-urgent'); else el.classList.remove('bo-cd-urgent');
            var parts = '<span class="bo-cd-label">' + CL.prefix + '</span>';
            if (dd > 0) parts += '<span class="bo-cd-unit">' + dd + '<small>' + CL.days + '</small></span>';
            parts += '<span class="bo-cd-unit">' + String(h).padStart(2,'0') + '<small>' + CL.hours + '</small></span>';
            parts += '<span class="bo-cd-unit">' + String(m).padStart(2,'0') + '<small>' + CL.min + '</small></span>';
            parts += '<span class="bo-cd-unit">' + String(s).padStart(2,'0') + '<small>' + CL.sec + '</small></span>';
            el.innerHTML = parts;
        });
    }

    function startCountdownTimer() {
        if (_countdownInterval) clearInterval(_countdownInterval);
        if (document.querySelectorAll('.bo-cd[data-cd-date]').length > 0) {
            _countdownInterval = setInterval(updateCountdowns, 1000);
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        renderHero();
        loadBattles();
        trackPageView('battles-overview');
        initStickySearch();
    }

    function initStickySearch() {
        var wrap = document.getElementById('battlesSearchWrap');
        if (!wrap) return;
        var sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        wrap.parentNode.insertBefore(sentinel, wrap);
        var obs = new IntersectionObserver(function(entries) {
            wrap.classList.toggle('stuck', !entries[0].isIntersecting);
        });
        obs.observe(sentinel);
    }

    function trackPageView(pageName) {
        if (!client) return;
        var key = 'kslt_pv_' + pageName;
        if (sessionStorage.getItem(key)) return;
        client.rpc('increment_page_view', { p_page_name: pageName }).then(function(res) {
            if (!res.error) sessionStorage.setItem(key, '1');
        });
    }

    function renderHero() {
        var el = document.getElementById('battlesHero');
        if (!el) return;
        var heroImg = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80';
        el.innerHTML =
            '<div class="bo-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="bo-hero-overlay"></div>' +
            '<div class="bo-hero-content">' +
                '<span class="bo-hero-badge">' + L.heroBadge + '</span>' +
                '<h1>' + L.heroTitle + '</h1>' +
                '<p>' + L.heroDesc + '</p>' +
                '<div class="bo-hero-stats">' +
                    '<div class="bo-hero-stat"><span class="bo-hero-stat-value" id="boStatTotal">&mdash;</span><span class="bo-hero-stat-label">' + BL.total + '</span></div>' +
                    '<div class="bo-hero-stat"><span class="bo-hero-stat-value" id="boStatUpcoming">&mdash;</span><span class="bo-hero-stat-label">' + BL.upcoming + '</span></div>' +
                    '<div class="bo-hero-stat"><span class="bo-hero-stat-value" id="boStatCompleted">&mdash;</span><span class="bo-hero-stat-label">' + BL.completed + '</span></div>' +
                '</div>' +
            '</div>';
    }

    // Battle is completed if: status=completed, voting manually closed, or match date+time has passed
    function isBattleCompleted(b) {
        if (b.status === 'completed') return true;
        if (b.voting_closed) return true;
        var matchDate = b.proposed_date || '';
        var matchTime = b.proposed_time || '';
        if (matchDate && matchTime) {
            var dt = new Date(matchDate + 'T' + matchTime + ':00+06:00');
            if (!isNaN(dt.getTime()) && Date.now() >= dt.getTime()) return true;
        }
        // If only date (no time), check if the date has passed (end of day Bishkek)
        if (matchDate && !matchTime) {
            var dt2 = new Date(matchDate + 'T23:59:59+06:00');
            if (!isNaN(dt2.getTime()) && Date.now() >= dt2.getTime()) return true;
        }
        return false;
    }

    async function loadBattles() {
        if (!client) return;

        // Check auth
        try {
            var session = await client.auth.getSession();
            if (session.data && session.data.session) {
                _userId = session.data.session.user.id;
            }
        } catch(e) {}

        try {
            // Load all published battles
            var result = await client.from('challenges')
                .select('id, battle_title, status, voting_closed, proposed_date, proposed_time, proposed_venue, challenger_player_id, opponent_player_id, challenger_external_name, opponent_external_name, format, challenger_partner_id, opponent_partner_id, challenger_partner_name, opponent_partner_name, challenger_gender, opponent_gender, challenger_partner_gender, opponent_partner_gender, banner_url, battle_published_at, match_id')
                .eq('battle_published', true)
                .order('battle_published_at', { ascending: false });

            if (result.error || !result.data || !result.data.length) {
                renderSections([], []);
                return;
            }

            var battles = result.data;

            // Collect player IDs
            var pIds = [];
            battles.forEach(function(b) {
                [b.challenger_player_id, b.opponent_player_id,
                 b.challenger_partner_id, b.opponent_partner_id].forEach(function(id) {
                    if (id && pIds.indexOf(id) === -1) pIds.push(id);
                });
            });

            // Load players
            var pRes = await client.from('players').select('id, name, name_en, name_kg, photo, category_id').in('id', pIds);
            (pRes.data || []).forEach(function(p) { _players[p.id] = p; });

            // Load votes for all battles
            var votePromises = battles.map(function(b) {
                return client.rpc('get_battle_votes', { p_challenge_id: b.id }).then(function(vRes) {
                    var vm = {};
                    var total = 0;
                    (vRes.data || []).forEach(function(v) {
                        vm[v.side] = parseInt(v.votes) || 0;
                        total += parseInt(v.votes) || 0;
                    });
                    return { challengeId: b.id, votes: vm, total: total };
                });
            });

            var vResults = await Promise.all(votePromises);
            vResults.forEach(function(v) { _votesData[v.challengeId] = v; });

            // Load user votes
            if (_userId) {
                var battleIds = battles.map(function(b) { return b.id; });
                var uvRes = await client.from('challenge_predictions')
                    .select('challenge_id, predicted_side')
                    .eq('voter_type', 'site')
                    .eq('voter_id', _userId)
                    .in('challenge_id', battleIds);
                (uvRes.data || []).forEach(function(v) {
                    _userVotes[v.challenge_id] = v.predicted_side;
                });
            }

            _allBattles = battles;

            // Split active vs completed
            // Battle is "completed" if: status=completed OR voting_closed OR match time has passed
            var active = battles.filter(function(b) { return !isBattleCompleted(b); });
            var completed = battles.filter(function(b) { return isBattleCompleted(b); });

            // Update hero stats
            var elTotal = document.getElementById('boStatTotal');
            var elUp = document.getElementById('boStatUpcoming');
            var elDone = document.getElementById('boStatCompleted');
            if (elTotal) elTotal.textContent = active.length + completed.length;
            if (elUp) elUp.textContent = active.length;
            if (elDone) elDone.textContent = completed.length;

            renderSections(active, completed);

        } catch(e) {
            console.error('Battles overview error:', e);
            renderSections([], []);
        }
    }

    function renderSections(active, completed) {
        var container = document.getElementById('battlesContent');
        if (!container) return;

        var html = '';

        // Предстоящие: ближайший крупной карточкой, остальные полосами рядом.
        // Одно правило на весь сайт — актуальное крупно, история строкой
        html += '<div class="bo-section">';
        html += '<div class="bo-section-header">';
        html += '<h2 class="bo-section-title"><span>' + L.activeTitle + '</span></h2>';
        if (active.length) html += '<span class="bo-section-count">' + active.length + '</span>';
        html += '</div>';

        if (!active.length) {
            // Пустой раздел занимал пол-экрана: большая иконка посреди
            // пустоты читалась как поломка. Достаточно строки
            html += '<div class="bo-empty-slim">' + L.empty + '</div>';
        } else if (active.length === 1) {
            html += renderFeaturedBattle(active[0], false);
        } else {
            html += '<div class="to-card-grid">';
            html += renderFeaturedBattle(active[0], false);
            html += '<div class="to-side-stack">';
            for (var i = 1; i < active.length; i++) html += renderStripBattle(active[i], false);
            html += '</div></div>';
        }
        html += '</div>';

        // Завершённые: полосами по две в ряд, с подгрузкой по шесть.
        // Раньше страница рисовала их такими же крупными карточками и
        // забирала из базы все разом — на полутора сотнях это заметно
        html += '<div class="bo-section">';
        html += '<div class="bo-section-header">';
        html += '<h2 class="bo-section-title"><span>' + L.completedTitle + '</span></h2>';
        if (completed.length) {
            html += '<span class="bo-section-count">' +
                (completed.length > DONE_FIRST
                    ? L.shownOf.replace('{n}', Math.min(DONE_FIRST, completed.length)).replace('{total}', completed.length)
                    : completed.length) + '</span>';
        }
        html += '</div>';

        if (!completed.length) {
            html += '<div class="bo-empty-slim">' + L.emptyCompleted + '</div>';
        } else {
            _doneShown = Math.min(DONE_FIRST, completed.length);
            html += '<div class="bo-strip-grid" id="boDoneGrid">';
            for (var j = 0; j < _doneShown; j++) html += renderStripBattle(completed[j], true);
            html += '</div>';
            if (completed.length > _doneShown) {
                html += '<div class="bo-more-wrap"><button class="bo-more" id="boDoneMore">' +
                    L.showMore.replace('{n}', Math.min(DONE_STEP, completed.length - _doneShown)) +
                    '</button></div>';
            }
        }
        html += '</div>';

        _doneList = completed;
        container.innerHTML = html;
        attachEvents();
        attachDoneMore();
        initSearch();
        startCountdownTimer();
    }

    /** Сторона крупной карточки: одно фото или два внахлёст. */
    function boSideHtml(side, cat) {
        var pair = side.names.length > 1;
        var html = '<div class="bo-player-side">' +
            '<div class="bo-player-photos' + (pair ? ' bo-pair' : '') + '">';
        side.photos.forEach(function(src) {
            html += '<img class="bo-player-img" src="' +
                esc(src || 'https://placehold.co/80x80/1a1a1a/666?text=?') + '" alt="">';
        });
        html += '</div><div class="bo-player-name' + (pair ? ' bo-pair-names' : '') + '">';
        side.names.forEach(function(n) { html += '<span>' + esc(n) + '</span>'; });
        html += '</div>';
        if (cat) html += '<div class="bo-player-cat">' + cat + '</div>';
        return html + '</div>';
    }

    // Завершённых со временем станет много: показываем часть, остальное по
    // кнопке. Столько же, сколько на странице турниров, — одно поведение
    var DONE_FIRST = 4;
    var DONE_STEP = 6;
    var _doneShown = 0;
    var _doneList = [];

    /**
     * Полоса баттла — та же разметка, что у турниров: дата слева, название
     * и состав в середине, метка справа, афиша приглушённым фоном.
     *
     * У завершённого вместо метки голосования счёт и победитель: на
     * сыгранный баттл смотрят ради результата, а не ради состава.
     */
    function renderStripBattle(b, isCompleted) {
        var BF = window.KSLT_BATTLE_FORMAT;
        var side1 = BF.side(b, 1, _players, getPlayerName);
        var side2 = BF.side(b, 2, _players, getPlayerName);
        var fmt = BF.label(b);

        var d = b.proposed_date ? new Date(b.proposed_date + 'T00:00:00') : null;
        var day = d && !isNaN(d.getTime()) ? d.getDate() : '';
        var month = d && !isNaN(d.getTime()) ? months[d.getMonth()] : '';

        var names = BF.shortSide(side1.names) + ' vs ' + BF.shortSide(side2.names);
        var venue = b.proposed_venue || '';
        var sub = names + (venue ? ' · ' + esc(venue) : '');

        var right = isCompleted
            ? '<span class="bo-strip-badge bo-strip-done">' + L.completedBadge + '</span>'
            : '<span class="bo-strip-badge bo-strip-live">' + L.voteBadge + '</span>';

        var bg = b.banner_url ? ' style="background-image:url(' + esc(b.banner_url) + ')"' : '';

        return '<a class="to-compact bo-strip' + (isCompleted ? ' bo-strip-past' : '') + '" href="' +
                detailUrl(b.id) + '"' + bg + '>' +
            '<div class="to-compact-left"><div class="to-compact-date">' +
                '<span class="to-day">' + day + '</span>' +
                '<span class="to-month">' + month + '</span>' +
            '</div></div>' +
            '<div class="to-compact-info">' +
                '<h4>' + esc(b.battle_title || 'Battle') +
                    (fmt ? '<span class="bo-strip-fmt">' + esc(fmt) + '</span>' : '') + '</h4>' +
                '<div class="bo-strip-sub">' + sub + '</div>' +
            '</div>' +
            '<div class="bo-strip-right">' + right + '</div>' +
        '</a>';
    }

    function renderFeaturedBattle(b, isCompleted) {
        var p1 = _players[b.challenger_player_id] || {};
        var p2 = _players[b.opponent_player_id] || {};
        // Сторона — один человек или пара. Собирает общий модуль, чтобы
        // страница, карточка на главной и объявление говорили одинаково
        var BF = window.KSLT_BATTLE_FORMAT;
        var side1 = BF.side(b, 1, _players, getPlayerName);
        var side2 = BF.side(b, 2, _players, getPlayerName);
        var p1Name = side1.names.join(' / ');
        var p2Name = side2.names.join(' / ');
        var formatLabel = BF.label(b);
        var p1Cat = CAT_LABELS[p1.category_id] || '';
        var p2Cat = CAT_LABELS[p2.category_id] || '';

        var date = b.proposed_date || '';
        var time = b.proposed_time || '';
        var venue = b.proposed_venue || '';

        // Votes
        var vData = _votesData[b.id] || { votes: {}, total: 0 };
        var v1 = vData.votes[1] || 0;
        var v2 = vData.votes[2] || 0;
        var vTotal = vData.total || 0;
        var pct1 = vTotal > 0 ? Math.round(v1 / vTotal * 100) : 50;
        var pct2 = vTotal > 0 ? 100 - pct1 : 50;

        var myVote = _userVotes[b.id] || null;

        // Time-based auto-close voting (same logic as challenge-detail.js)
        var timeExpired = false;
        if (date && time) {
            var matchDt = new Date(date + 'T' + time + ':00+06:00');
            if (!isNaN(matchDt.getTime()) && Date.now() >= matchDt.getTime()) {
                timeExpired = true;
            }
        }
        var isClosed = !!b.voting_closed || isCompleted || timeExpired;

        // Vote section
        var voteHtml = '';
        if (!isCompleted) {
            if (isClosed) {
                voteHtml = '<div class="bo-vote-closed-msg">' + L.votingClosed + '</div>';
            } else if (_userId && myVote) {
                voteHtml = '<div class="bo-vote-status">' + L.yourVote + '</div>' +
                    '<div class="bo-vote-buttons">' +
                        '<button class="bo-vote-btn bo-vote-btn-p1 bo-vote-locked' + (myVote === 1 ? ' bo-vote-selected' : '') + '" disabled>' + esc(BF.shortSide(side1.names)) + '</button>' +
                        '<button class="bo-vote-btn bo-vote-btn-p2 bo-vote-locked' + (myVote === 2 ? ' bo-vote-selected' : '') + '" disabled>' + esc(BF.shortSide(side2.names)) + '</button>' +
                    '</div>';
            } else if (_userId) {
                voteHtml = '<div class="bo-vote-buttons">' +
                    '<button class="bo-vote-btn bo-vote-btn-p1" data-challenge="' + b.id + '" data-side="1">' + esc(BF.shortSide(side1.names)) + '</button>' +
                    '<button class="bo-vote-btn bo-vote-btn-p2" data-challenge="' + b.id + '" data-side="2">' + esc(BF.shortSide(side2.names)) + '</button>' +
                '</div>';
            } else {
                voteHtml = '<div class="bo-vote-login">' + L.loginToVote + '</div>';
            }
        }

        // Score/winner for completed
        var resultHtml = '';
        if (isCompleted) {
            // Winner = player with most votes (approximate for now)
            var winId = v1 >= v2 ? b.challenger_player_id : b.opponent_player_id;
            var winName = v1 >= v2 ? p1Name : p2Name;
            resultHtml =
                '<div class="bo-winner-name">' + L.winner + ': ' + esc(winName) + '</div>';
        }

        var linkHref = detailUrl(b.id);
        var statusClass = isCompleted ? 'completed' : 'active';

        var bgHtml = b.banner_url
            ? '<div class="bo-featured-bg"><img src="' + esc(b.banner_url) + '" alt="" loading="lazy"></div><div class="bo-featured-overlay"></div>'
            : '<div class="bo-featured-overlay" style="background:var(--bg-card)"></div>';

        return '<div class="bo-featured" data-href="' + linkHref + '" data-battle="' + b.id + '">' +
            bgHtml +
            '<div class="bo-featured-content">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
                    '<span class="bo-status ' + statusClass + '">' + (isCompleted ? L.result : L.heroBadge) + '</span>' +
                    getCountdownHtml(date, time) +
                '</div>' +
                '<div class="bo-featured-title">' + esc(b.battle_title || 'Battle') + '</div>' +
                (formatLabel ? '<div class="bo-format">' + esc(formatLabel) + '</div>' : '') +
                '<div class="bo-vs-row">' +
                    boSideHtml(side1, p1Cat) +
                    '<span class="bo-vs-badge">' + L.vs + '</span>' +
                    boSideHtml(side2, p2Cat) +
                '</div>' +
                voteHtml +
                '<div class="bo-vote-bar">' +
                    '<div class="bo-bar-p1" style="width:' + pct1 + '%"></div>' +
                    '<div class="bo-bar-p2" style="width:' + pct2 + '%"></div>' +
                '</div>' +
                '<div class="bo-vote-stats">' +
                    '<span class="bo-pct-p1">' + pct1 + '%</span>' +
                    '<span class="bo-total-votes">' + vTotal + ' ' + L.votes + '</span>' +
                    '<span class="bo-pct-p2">' + pct2 + '%</span>' +
                '</div>' +
                resultHtml +
                '<div class="bo-featured-meta">' +
                    (date ? '<span>📅 ' + formatDate(date) + (time ? ' · ' + esc(time) : '') + '</span>' : '') +
                    (venue ? '<span class="bo-meta-venue" data-venue="' + esc(venue) + '">📍 ' + esc(venue) + '</span>' : '') +
                '</div>' +
                '<span class="bo-featured-link">' + L.details + '</span>' +
            '</div>' +
        '</div>';
    }

    function renderCompactBattle(b, isCompleted) {
        var p1 = _players[b.challenger_player_id] || {};
        var p2 = _players[b.opponent_player_id] || {};
        var p1Name = getPlayerName(p1);
        var p2Name = getPlayerName(p2);
        var p1Photo = p1.photo || 'https://placehold.co/36x36/1a1a1a/666?text=?';
        var p2Photo = p2.photo || 'https://placehold.co/36x36/1a1a1a/666?text=?';

        var date = b.proposed_date || '';
        var venue = b.proposed_venue || '';

        // Votes
        var vData = _votesData[b.id] || { votes: {}, total: 0 };
        var v1 = vData.votes[1] || 0;
        var v2 = vData.votes[2] || 0;
        var vTotal = vData.total || 0;
        var pct1 = vTotal > 0 ? Math.round(v1 / vTotal * 100) : 50;
        var pct2 = vTotal > 0 ? 100 - pct1 : 50;

        var statusClass = isCompleted ? 'completed' : 'active';
        var statusText = isCompleted ? L.result : L.heroBadge;

        // Compact result for completed
        var scoreHtml = '';
        if (isCompleted && vTotal > 0) {
            var compactWinName = v1 >= v2 ? p1Name : p2Name;
            scoreHtml = '<span style="font-size:0.75rem;color:var(--accent);font-weight:700">' + L.winner + ': ' + esc(compactWinName) + '</span>';
        }

        var linkHref = detailUrl(b.id);

        return '<div class="bo-compact" data-href="' + linkHref + '" data-battle="' + b.id + '">' +
            '<div class="bo-compact-left">' +
                '<div class="bo-compact-photos">' +
                    '<img class="bo-compact-photo" src="' + esc(p1Photo) + '" alt="">' +
                    '<img class="bo-compact-photo" src="' + esc(p2Photo) + '" alt="">' +
                '</div>' +
                '<span class="bo-compact-vs">' + L.vs + '</span>' +
            '</div>' +
            '<div class="bo-compact-info">' +
                '<h4>' + esc(b.battle_title || p1Name + ' vs ' + p2Name) + '</h4>' +
                '<div class="bo-compact-sub">' +
                    '<span>' + esc(p1Name) + ' vs ' + esc(p2Name) + '</span>' +
                    (date ? '<span>· ' + formatDate(date) + '</span>' : '') +
                    (venue ? '<span>· ' + esc(venue) + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="bo-compact-right">' +
                '<span class="bo-status ' + statusClass + '">' + statusText + '</span>' +
                scoreHtml +
                (!isCompleted ? '<div class="bo-compact-bar"><div class="bo-bar-p1" style="width:' + pct1 + '%"></div><div class="bo-bar-p2" style="width:' + pct2 + '%"></div></div><span class="bo-compact-pct">' + pct1 + '% / ' + pct2 + '%</span>' : '') +
            '</div>' +
        '</div>';
    }

    // ---- Vote handler ----
    function handleVote(btn) {
        if (!_userId) return;
        if (btn.disabled || btn.classList.contains('bo-vote-locked')) return;

        var challengeId = btn.dataset.challenge;
        var side = parseInt(btn.dataset.side, 10);

        if (_userVotes[challengeId]) {
            showToast(L.alreadyVoted);
            return;
        }

        var card = btn.closest('.bo-featured, .bo-compact');
        card.querySelectorAll('.bo-vote-btn').forEach(function(b) { b.disabled = true; });
        btn.classList.add('bo-vote-selected');

        client.rpc('cast_battle_vote', {
            p_challenge_id: challengeId,
            p_side: side
        }).then(function(res) {
            if (res.error) {
                console.error('Vote error:', res.error);
                card.querySelectorAll('.bo-vote-btn').forEach(function(b) { b.disabled = false; });
                btn.classList.remove('bo-vote-selected');
                return;
            }
            var result = res.data;
            if (result && result.ok === false) {
                if (result.error === 'already_voted') showToast(L.alreadyVoted);
                card.querySelectorAll('.bo-vote-btn').forEach(function(b) { b.classList.add('bo-vote-locked'); });
                return;
            }
            _userVotes[challengeId] = side;
            showToast(L.voteRecorded);
            card.querySelectorAll('.bo-vote-btn').forEach(function(b) { b.classList.add('bo-vote-locked'); });

            var statusEl = card.querySelector('.bo-vote-status');
            if (!statusEl) {
                var btnsWrap = card.querySelector('.bo-vote-buttons');
                if (btnsWrap) {
                    var lbl = document.createElement('div');
                    lbl.className = 'bo-vote-status';
                    lbl.textContent = L.yourVote;
                    btnsWrap.parentNode.insertBefore(lbl, btnsWrap);
                }
            }

            refreshVotes(challengeId);
        }).catch(function(e) {
            console.error('Vote error:', e);
            card.querySelectorAll('.bo-vote-btn').forEach(function(b) { b.disabled = false; });
            btn.classList.remove('bo-vote-selected');
        });
    }

    function refreshVotes(challengeId) {
        client.rpc('get_battle_votes', { p_challenge_id: challengeId }).then(function(vRes) {
            var vm = {};
            var total = 0;
            (vRes.data || []).forEach(function(v) {
                vm[v.side] = parseInt(v.votes) || 0;
                total += parseInt(v.votes) || 0;
            });
            _votesData[challengeId] = { challengeId: challengeId, votes: vm, total: total };

            document.querySelectorAll('[data-battle="' + challengeId + '"]').forEach(function(card) {
                var v1 = vm[1] || 0;
                var v2 = vm[2] || 0;
                var pct1 = total > 0 ? Math.round(v1 / total * 100) : 50;
                var pct2 = total > 0 ? 100 - pct1 : 50;

                var bar1 = card.querySelector('.bo-bar-p1');
                var bar2 = card.querySelector('.bo-bar-p2');
                if (bar1) bar1.style.width = pct1 + '%';
                if (bar2) bar2.style.width = pct2 + '%';

                var pct1El = card.querySelector('.bo-pct-p1');
                var pct2El = card.querySelector('.bo-pct-p2');
                if (pct1El) pct1El.textContent = pct1 + '%';
                if (pct2El) pct2El.textContent = pct2 + '%';

                var totalEl = card.querySelector('.bo-total-votes');
                if (totalEl) totalEl.textContent = total + ' ' + L.votes;

                var votedSide = _userVotes[challengeId];
                card.querySelectorAll('.bo-vote-btn').forEach(function(b) {
                    b.classList.toggle('bo-vote-selected', parseInt(b.dataset.side, 10) === votedSide);
                });
            });
        });
    }

    function showToast(msg) {
        var existing = document.getElementById('boToast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.id = 'boToast';
        toast.className = 'bo-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('bo-toast-show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('bo-toast-show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }

    function showMapModal(venue) {
        var existing = document.getElementById('boMapModal');
        if (existing) existing.remove();
        var q = encodeURIComponent(venue);
        var overlay = document.createElement('div');
        overlay.id = 'boMapModal';
        overlay.className = 'bo-map-overlay';
        overlay.innerHTML =
            '<div class="bo-map-modal">' +
                '<div class="bo-map-title">' + L.openIn + ':</div>' +
                '<a href="https://2gis.kg/search/' + q + '" target="_blank" class="bo-map-btn bo-map-2gis">2GIS</a>' +
                '<a href="https://www.google.com/maps/search/' + q + '" target="_blank" class="bo-map-btn bo-map-google">Google Maps</a>' +
                '<button class="bo-map-btn bo-map-cancel" id="boMapCancel">' + L.cancel + '</button>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay || e.target.id === 'boMapCancel') overlay.remove();
        });
        overlay.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function() { setTimeout(function() { overlay.remove(); }, 200); });
        });
    }

    /**
     * Подгрузка завершённых по кнопке.
     *
     * Не номера страниц: список читают сверху вниз, а номер сбивает —
     * нажал вторую страницу и потерял, где был. Кнопка добавляет снизу,
     * место чтения не меняется. Так же сделано на странице турниров.
     */
    function attachDoneMore() {
        var btn = document.getElementById('boDoneMore');
        if (!btn) return;
        btn.addEventListener('click', function() {
            var grid = document.getElementById('boDoneGrid');
            if (!grid) return;
            var next = _doneList.slice(_doneShown, _doneShown + DONE_STEP);
            grid.insertAdjacentHTML('beforeend', next.map(function(b) {
                return renderStripBattle(b, true);
            }).join(''));
            _doneShown += next.length;

            var left = _doneList.length - _doneShown;
            if (left <= 0) {
                var wrap = btn.closest('.bo-more-wrap');
                if (wrap) wrap.remove();
            } else {
                btn.textContent = L.showMore.replace('{n}', Math.min(DONE_STEP, left));
            }
            var counter = document.querySelectorAll('.bo-section-count');
            if (counter.length > 1) {
                counter[counter.length - 1].textContent =
                    L.shownOf.replace('{n}', _doneShown).replace('{total}', _doneList.length);
            }
        });
    }

    function attachEvents() {
        var container = document.getElementById('battlesContent');
        if (!container) return;

        container.addEventListener('click', function(e) {
            // Vote button
            var voteBtn = e.target.closest('.bo-vote-btn[data-challenge]');
            if (voteBtn) {
                e.preventDefault();
                e.stopPropagation();
                handleVote(voteBtn);
                return;
            }

            // Venue click → map modal
            var venueEl = e.target.closest('.bo-meta-venue');
            if (venueEl) {
                e.preventDefault();
                e.stopPropagation();
                showMapModal(venueEl.dataset.venue);
                return;
            }

            // Card click → navigate
            var card = e.target.closest('.bo-featured[data-href], .bo-compact[data-href]');
            if (card) {
                window.location.href = card.dataset.href;
            }
        });
    }

    function initSearch() {
        var input = document.getElementById('battlesSearch');
        if (!input) return;

        input.addEventListener('input', function() {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(function() {
                var query = input.value.trim().toLowerCase();
                if (!query) {
                    var active = _allBattles.filter(function(b) { return !isBattleCompleted(b); });
                    var completed = _allBattles.filter(function(b) { return isBattleCompleted(b); });
                    renderSections(active, completed);
                    return;
                }
                // Filter by title + player names
                var filtered = _allBattles.filter(function(b) {
                    var title = (b.battle_title || '').toLowerCase();
                    var p1 = _players[b.challenger_player_id];
                    var p2 = _players[b.opponent_player_id];
                    var p1Name = p1 ? (p1.name || '') + ' ' + (p1.name_en || '') + ' ' + (p1.name_kg || '') : '';
                    var p2Name = p2 ? (p2.name || '') + ' ' + (p2.name_en || '') + ' ' + (p2.name_kg || '') : '';
                    var combined = (title + ' ' + p1Name + ' ' + p2Name).toLowerCase();
                    return combined.indexOf(query) !== -1;
                });

                var fActive = filtered.filter(function(b) { return !isBattleCompleted(b); });
                var fCompleted = filtered.filter(function(b) { return isBattleCompleted(b); });

                if (!fActive.length && !fCompleted.length) {
                    var container = document.getElementById('battlesContent');
                    if (container) {
                        container.innerHTML = '<div class="bo-section"><div class="bo-card-grid"><div class="bo-empty">' + emptySvg + '<p>' + L.nothingFound + '</p></div></div></div>';
                    }
                    return;
                }

                renderSections(fActive, fCompleted);
            }, 200);
        });
    }

})();
