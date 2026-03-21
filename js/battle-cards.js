/**
 * Battle Cards — compact cards with inline voting
 * Used on: homepage (#battleContainer), tournaments-overview (#battleOverviewContainer)
 */
(function() {
    'use strict';

    var client = window.supabaseClient;
    if (!client) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn ? {
        battle: 'BATTLE',
        vs: 'VS',
        votes: 'votes',
        loginToVote: 'Log in to vote',
        votingClosed: 'Voting closed',
        yourVote: 'Your vote',
        alreadyVoted: 'You already voted',
        openIn: 'Open in',
        cancel: 'Cancel',
        voteRecorded: 'Vote recorded!',
        moreDetails: 'More details',
        allBattles: 'All battles'
    } : (isKg ? {
        battle: 'БАТТЛ',
        vs: 'VS',
        votes: 'добуш',
        loginToVote: 'Добуш берүү үчүн кириңиз',
        votingClosed: 'Добуш берүү жабылды',
        yourVote: 'Сиздин добуш',
        alreadyVoted: 'Сиз добуш бергенсиз',
        openIn: 'Ачуу',
        cancel: 'Жокко чыгаруу',
        voteRecorded: 'Добуш кабыл алынды!',
        moreDetails: 'Толугураак',
        allBattles: 'Бардык баттлдар'
    } : {
        battle: 'БАТТЛ',
        vs: 'VS',
        votes: 'голосов',
        loginToVote: 'Войдите, чтобы голосовать',
        votingClosed: 'Голосование закрыто',
        yourVote: 'Ваш голос',
        alreadyVoted: 'Вы уже проголосовали',
        openIn: 'Открыть в',
        cancel: 'Отмена',
        voteRecorded: 'Голос принят!',
        moreDetails: 'Подробнее',
        allBattles: 'Все баттлы'
    });

    var userId = null;
    var userVotes = {};

    function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2);
    }

    function detailUrl(id) {
        var inPages = window.location.pathname.indexOf('/pages/') !== -1;
        var prefix = inPages ? '' : 'pages/';
        var suffix = isEn ? '-en' : (isKg ? '-kg' : '');
        var from = inPages ? 'tournaments' : 'home';
        return prefix + 'challenge' + suffix + '.html?id=' + id + '&from=' + from;
    }

    function getPlayerName(p) {
        if (!p) return '?';
        if (isEn) return p.name_en || p.name || '?';
        if (isKg) return p.name_kg || p.name || '?';
        return p.name || '?';
    }

    // ---- Auth ----
    function checkAuth() {
        return client.auth.getSession().then(function(res) {
            if (res.data && res.data.session) {
                userId = res.data.session.user.id;
            }
            return userId;
        }).catch(function() { return null; });
    }

    // ---- Load user's existing votes ----
    function loadUserVotes(battleIds) {
        if (!userId || !battleIds.length) return Promise.resolve({});
        return client.from('challenge_predictions')
            .select('challenge_id, predicted_winner_id')
            .eq('voter_type', 'site')
            .eq('voter_id', userId)
            .in('challenge_id', battleIds)
            .then(function(res) {
                var map = {};
                (res.data || []).forEach(function(v) {
                    map[v.challenge_id] = v.predicted_winner_id;
                });
                return map;
            }).catch(function() { return {}; });
    }

    // ---- Load active published battles ----
    function loadActiveBattles() {
        return client.from('challenges')
            .select('id, battle_title, status, voting_closed, proposed_date, proposed_time, proposed_venue, counter_date, counter_time, counter_venue, challenger_player_id, opponent_player_id, banner_url, battle_published_at')
            .eq('battle_published', true)
            .neq('status', 'completed')
            .order('battle_published_at', { ascending: false })
            .limit(3)
            .then(function(res) {
                if (res.error || !res.data || !res.data.length) return null;

                // Filter out battles where date has passed
                var today = new Date().toISOString().substring(0, 10);
                var battles = res.data.filter(function(b) {
                    var bd = b.counter_date || b.proposed_date;
                    if (!bd) return true;
                    return bd >= today;
                });
                if (!battles.length) return null;

                // Collect player IDs
                var pIds = [];
                battles.forEach(function(b) {
                    if (pIds.indexOf(b.challenger_player_id) === -1) pIds.push(b.challenger_player_id);
                    if (pIds.indexOf(b.opponent_player_id) === -1) pIds.push(b.opponent_player_id);
                });

                return client.from('players').select('id, name, name_en, name_kg, photo').in('id', pIds).then(function(pRes) {
                    var pMap = {};
                    (pRes.data || []).forEach(function(p) { pMap[p.id] = p; });

                    // Load vote counts for each battle
                    var votePromises = battles.map(function(b) {
                        return client.rpc('get_battle_votes', { p_challenge_id: b.id }).then(function(vRes) {
                            var vm = {};
                            var total = 0;
                            (vRes.data || []).forEach(function(v) {
                                vm[v.player_id] = parseInt(v.votes) || 0;
                                total += parseInt(v.votes) || 0;
                            });
                            return { challengeId: b.id, votes: vm, total: total };
                        });
                    });

                    return Promise.all(votePromises).then(function(vResults) {
                        var votesData = {};
                        vResults.forEach(function(v) { votesData[v.challengeId] = v; });

                        // Load user's votes
                        var battleIds = battles.map(function(b) { return b.id; });
                        return loadUserVotes(battleIds).then(function(uv) {
                            userVotes = uv;
                            return { battles: battles, players: pMap, votes: votesData };
                        });
                    });
                });
            }).catch(function(e) { console.error('Battle cards error:', e); return null; });
    }

    // ---- Render compact battle card ----
    function renderBattleCard(battle, players, votes) {
        var p1 = players[battle.challenger_player_id] || {};
        var p2 = players[battle.opponent_player_id] || {};
        var p1Name = getPlayerName(p1);
        var p2Name = getPlayerName(p2);
        var p1Photo = p1.photo || 'https://placehold.co/60x60/1a1a1a/666?text=?';
        var p2Photo = p2.photo || 'https://placehold.co/60x60/1a1a1a/666?text=?';
        var date = battle.counter_date || battle.proposed_date || '';
        var time = battle.counter_time || battle.proposed_time || '';
        var venue = battle.counter_venue || battle.proposed_venue || '';

        // Votes
        var vData = votes[battle.id] || { votes: {}, total: 0 };
        var v1 = vData.votes[battle.challenger_player_id] || 0;
        var v2 = vData.votes[battle.opponent_player_id] || 0;
        var vTotal = vData.total || 0;
        var pct1 = vTotal > 0 ? Math.round(v1 / vTotal * 100) : 50;
        var pct2 = vTotal > 0 ? 100 - pct1 : 50;

        var myVote = userVotes[battle.id] || null;
        var isClosed = !!battle.voting_closed;

        // Vote section
        var hasVoted = !!myVote;
        var voteHtml = '';
        if (isClosed) {
            voteHtml = '<div class="bc-vote-closed-msg">' + L.votingClosed + '</div>';
        } else if (userId && hasVoted) {
            // Already voted — show result, buttons locked
            var sel1 = myVote === battle.challenger_player_id ? ' bc-vote-selected' : '';
            var sel2 = myVote === battle.opponent_player_id ? ' bc-vote-selected' : '';
            voteHtml =
                '<div class="bc-vote-voted">' + L.yourVote + ':</div>' +
                '<div class="bc-vote-buttons">' +
                    '<button class="bc-vote-btn bc-vote-btn-p1 bc-vote-locked' + sel1 + '" disabled>' +
                        esc(p1Name) +
                    '</button>' +
                    '<button class="bc-vote-btn bc-vote-btn-p2 bc-vote-locked' + sel2 + '" disabled>' +
                        esc(p2Name) +
                    '</button>' +
                '</div>';
        } else if (userId) {
            // Not voted yet — active buttons
            voteHtml =
                '<div class="bc-vote-buttons">' +
                    '<button class="bc-vote-btn bc-vote-btn-p1" data-challenge="' + battle.id + '" data-player="' + battle.challenger_player_id + '">' +
                        esc(p1Name) +
                    '</button>' +
                    '<button class="bc-vote-btn bc-vote-btn-p2" data-challenge="' + battle.id + '" data-player="' + battle.opponent_player_id + '">' +
                        esc(p2Name) +
                    '</button>' +
                '</div>';
        } else {
            voteHtml = '<div class="bc-vote-login">' + L.loginToVote + '</div>';
        }

        // Date+time stylish badge
        var headerMeta = '';
        if (date || time) {
            headerMeta = '<div class="bc-datetime">';
            if (date) headerMeta += '<span class="bc-dt-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + formatDate(date) + '</span>';
            if (date && time) headerMeta += '<span class="bc-dt-sep"></span>';
            if (time) headerMeta += '<span class="bc-dt-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' + esc(time) + '</span>';
            headerMeta += '</div>';
        }

        var bannerHtml = battle.banner_url
            ? '<img class="bc-banner" src="' + esc(battle.banner_url) + '" alt="">'
            : '';

        return '<div class="bc-card" data-battle="' + battle.id + '">' +
            bannerHtml +
            '<div class="bc-card-inner">' +
                '<div class="bc-header">' +
                    '<span class="bc-badge">' + L.battle + '</span>' +
                    headerMeta +
                '</div>' +
                '<div class="bc-title">' + esc(battle.battle_title || 'Battle') + '</div>' +
                '<div class="bc-vs-row">' +
                    '<div class="bc-player">' +
                        '<img src="' + esc(p1Photo) + '" alt="">' +
                        '<span class="bc-player-name">' + esc(p1Name) + '</span>' +
                    '</div>' +
                    '<span class="bc-vs">' + L.vs + '</span>' +
                    '<div class="bc-player">' +
                        '<img src="' + esc(p2Photo) + '" alt="">' +
                        '<span class="bc-player-name">' + esc(p2Name) + '</span>' +
                    '</div>' +
                '</div>' +
                voteHtml +
                '<div class="bc-vote-bar">' +
                    '<div class="bc-bar-p1" style="width:' + pct1 + '%;"></div>' +
                    '<div class="bc-bar-p2" style="width:' + pct2 + '%;"></div>' +
                '</div>' +
                '<div class="bc-vote-stats">' +
                    '<span class="bc-pct bc-pct-p1">' + pct1 + '%</span>' +
                    '<span class="bc-total">' + vTotal + ' ' + L.votes + '</span>' +
                    '<span class="bc-pct bc-pct-p2">' + pct2 + '%</span>' +
                '</div>' +
                (venue ? '<div class="bc-meta"><span class="bc-meta-item bc-meta-venue" data-venue="' + esc(venue) + '">\uD83D\uDCCD ' + esc(venue) + '</span></div>' : '') +
                '<a href="' + detailUrl(battle.id) + '" class="bc-details-link">' + L.moreDetails + ' →</a>' +
            '</div>' +
        '</div>';
    }

    // ---- Vote handler ----
    function handleVote(btn) {
        if (!userId) return;
        if (btn.disabled || btn.classList.contains('bc-vote-locked')) return;

        var challengeId = btn.dataset.challenge;
        var playerId = btn.dataset.player;

        // Already voted — block
        if (userVotes[challengeId]) {
            showToast(L.alreadyVoted);
            return;
        }

        // Disable buttons immediately
        var card = btn.closest('.bc-card');
        card.querySelectorAll('.bc-vote-btn').forEach(function(b) {
            b.disabled = true;
        });
        btn.classList.add('bc-vote-selected');

        // Call RPC
        client.rpc('cast_battle_vote', {
            p_challenge_id: challengeId,
            p_player_id: playerId
        }).then(function(res) {
            if (res.error) {
                console.error('Vote RPC error:', res.error);
                // Re-enable buttons on error
                card.querySelectorAll('.bc-vote-btn').forEach(function(b) { b.disabled = false; });
                btn.classList.remove('bc-vote-selected');
                return;
            }
            var result = res.data;
            if (result && result.ok === false) {
                if (result.error === 'already_voted') {
                    showToast(L.alreadyVoted);
                }
                // Lock buttons — already voted
                card.querySelectorAll('.bc-vote-btn').forEach(function(b) {
                    b.classList.add('bc-vote-locked');
                });
                return;
            }
            // Success
            userVotes[challengeId] = playerId;
            showToast(L.voteRecorded);
            // Lock buttons permanently
            card.querySelectorAll('.bc-vote-btn').forEach(function(b) {
                b.classList.add('bc-vote-locked');
            });
            // Add "Your vote" label
            var btnsWrap = card.querySelector('.bc-vote-buttons');
            if (btnsWrap) {
                var label = document.createElement('div');
                label.className = 'bc-vote-voted';
                label.textContent = L.yourVote + ':';
                btnsWrap.parentNode.insertBefore(label, btnsWrap);
            }
            refreshVotes(challengeId);
        }).catch(function(e) {
            console.error('Vote error:', e);
            card.querySelectorAll('.bc-vote-btn').forEach(function(b) { b.disabled = false; });
            btn.classList.remove('bc-vote-selected');
        });
    }

    // ---- Refresh vote counts after voting ----
    function refreshVotes(challengeId) {
        client.rpc('get_battle_votes', { p_challenge_id: challengeId }).then(function(vRes) {
            var vm = {};
            var total = 0;
            (vRes.data || []).forEach(function(v) {
                vm[v.player_id] = parseInt(v.votes) || 0;
                total += parseInt(v.votes) || 0;
            });

            // Update all cards with this battle ID (homepage + overview might both exist)
            document.querySelectorAll('.bc-card[data-battle="' + challengeId + '"]').forEach(function(card) {
                var btns = card.querySelectorAll('.bc-vote-btn');
                var p1Id = btns[0] ? btns[0].dataset.player : null;
                var p2Id = btns[1] ? btns[1].dataset.player : null;
                if (!p1Id && !p2Id) return;

                var v1 = vm[p1Id] || 0;
                var v2 = vm[p2Id] || 0;
                var pct1 = total > 0 ? Math.round(v1 / total * 100) : 50;
                var pct2 = total > 0 ? 100 - pct1 : 50;

                var bar1 = card.querySelector('.bc-bar-p1');
                var bar2 = card.querySelector('.bc-bar-p2');
                if (bar1) bar1.style.width = pct1 + '%';
                if (bar2) bar2.style.width = pct2 + '%';

                var pcts = card.querySelectorAll('.bc-pct');
                if (pcts[0]) pcts[0].textContent = pct1 + '%';
                if (pcts[1]) pcts[1].textContent = pct2 + '%';

                var totalEl = card.querySelector('.bc-total');
                if (totalEl) totalEl.textContent = total + ' ' + L.votes;

                // Update selected state
                var votedPlayer = userVotes[challengeId];
                card.querySelectorAll('.bc-vote-btn').forEach(function(b) {
                    b.classList.toggle('bc-vote-selected', b.dataset.player === votedPlayer);
                });
            });
        });
    }

    // ---- Toast notification ----
    function showToast(msg) {
        var existing = document.getElementById('bcToast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'bcToast';
        toast.className = 'bc-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(function() { toast.classList.add('bc-toast-show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('bc-toast-show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }

    // ---- Map modal (venue click) ----
    function showMapModal(venue) {
        var existing = document.getElementById('bcMapModal');
        if (existing) existing.remove();

        var q = encodeURIComponent(venue);
        var overlay = document.createElement('div');
        overlay.id = 'bcMapModal';
        overlay.className = 'bc-map-overlay';
        overlay.innerHTML =
            '<div class="bc-map-modal">' +
                '<div class="bc-map-title">' + L.openIn + ':</div>' +
                '<a href="https://2gis.kg/search/' + q + '" target="_blank" class="bc-map-btn bc-map-2gis">2GIS</a>' +
                '<a href="https://www.google.com/maps/search/' + q + '" target="_blank" class="bc-map-btn bc-map-google">Google Maps</a>' +
                '<button class="bc-map-btn bc-map-cancel" id="bcMapCancel">' + L.cancel + '</button>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay || e.target.id === 'bcMapCancel') overlay.remove();
        });
        overlay.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function() { setTimeout(function() { overlay.remove(); }, 200); });
        });
    }

    // ---- Inject cards into a container ----
    function inject(containerId, data) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!data || !data.battles || !data.battles.length) return;

        var html = '';
        data.battles.forEach(function(b) {
            html += renderBattleCard(b, data.players, data.votes);
        });

        // "All battles" link — compute URL based on location
        var inPages = window.location.pathname.indexOf('/pages/') !== -1;
        var prefix = inPages ? '' : 'pages/';
        var suffix = isEn ? '-en' : (isKg ? '-kg' : '');
        var allBattlesUrl = prefix + 'battles-overview' + suffix + '.html';

        container.innerHTML =
            '<div class="section-header"><h2>' + L.battle + '</h2><a href="' + allBattlesUrl + '" class="link-all">' + L.allBattles + ' →</a></div>' +
            '<div class="bc-grid">' + html + '</div>';
        container.style.display = '';

        // Attach vote handlers
        container.querySelectorAll('.bc-vote-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handleVote(btn);
            });
        });

        // Attach venue click handlers
        container.querySelectorAll('.bc-meta-venue').forEach(function(el) {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showMapModal(el.dataset.venue);
            });
        });
    }

    // ---- Init ----
    function init() {
        checkAuth().then(function() {
            return loadActiveBattles();
        }).then(function(data) {
            if (!data) return;
            var path = window.location.pathname;

            if (path === '/' || path.indexOf('index') !== -1) {
                inject('battleContainer', data);
            }
            if (path.indexOf('tournaments-overview') !== -1) {
                inject('battleOverviewContainer', data);
            }
        });
    }

    // Handle both DOMContentLoaded timing scenarios
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
