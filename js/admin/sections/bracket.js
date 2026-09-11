// ============================================
// KSLT Admin — Bracket Management
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // NTRP is now managed manually by admin (no auto-calculation)

    // ---- Doubles helpers ----

    function isDoublesTournament(tournament) {
        return tournament && (tournament.format === 'doubles' || tournament.format === 'mixed_doubles');
    }

    /**
     * Get display name for a team (doubles) or single player.
     * For doubles: "Фамилия И. / Фамилия И." or "Фамилия И. / ExtName"
     * @param {string} playerId - captain player_id
     * @param {Object} regsMap - map playerId → registration
     * @param {Object} playersMap - map playerId → player
     * @param {boolean} isDoubles - is doubles tournament
     * @returns {string}
     */
    function getTeamDisplayName(playerId, regsMap, playersMap, isDoubles) {
        var p = playersMap[playerId];
        var captainName = p ? A.esc(isEn ? (p.name_en || p.name) : p.name) : (playerId ? 'TBD' : 'BYE');

        if (!isDoubles) return captainName;

        var reg = regsMap ? regsMap[playerId] : null;
        if (!reg) return captainName;

        var partnerName = '';
        if (reg.partner_id) {
            var pp = playersMap[reg.partner_id];
            partnerName = pp ? A.esc(isEn ? (pp.name_en || pp.name) : pp.name) : '?';
        } else if (reg.partner_external_name) {
            partnerName = A.esc(reg.partner_external_name);
        }

        if (partnerName) {
            return '<span class="ad-team-name">' + captainName + ' / ' + partnerName + '</span>';
        }
        return captainName;
    }

    /**
     * Build regsMap: player_id → registration (for doubles lookup).
     * Also handles external registrations (player_id = null) using a synthetic key.
     */
    function buildRegsMap(registrations) {
        var map = {};
        registrations.forEach(function(r) {
            var key = r.player_id || ('ext_' + r.id);
            map[key] = r;
        });
        return map;
    }

    function validateNtrpCombined(ntrp1, ntrp2, max) {
        if (!max) return true;
        if (!ntrp1 || !ntrp2) return true; // can't validate without both
        return (ntrp1 + ntrp2) <= max;
    }

    function validateMixedDoublesGender(gender1, gender2) {
        if (!gender1 || !gender2) return true; // can't validate without both
        return (gender1 !== gender2);
    }

    /**
     * Get combined points for a doubles team for seeding.
     */
    function getTeamPoints(reg, playersMap) {
        var captainPts = 0;
        if (reg.player_id && playersMap[reg.player_id]) {
            captainPts = playersMap[reg.player_id].points || 0;
        }
        var partnerPts = 0;
        if (reg.partner_id && playersMap[reg.partner_id]) {
            partnerPts = playersMap[reg.partner_id].points || 0;
        }
        return captainPts + partnerPts;
    }

    /**
     * Сумма NTRP пары — по ней сеются пары в парном турнире. У своих берём
     * парный рейтинг (нет его — одиночный), у приглашённых — то число, что
     * вписали руками при заявке.
     */
    function ntrpПары(p) {
        return window.KSLT_RULES.ntrpПары(p.ntrp_singles, p.ntrp_doubles) || 0;
    }

    /**
     * Парный рейтинг не проставлен. Заявку это не отменяет: пара играет, а в
     * сумму пока идёт одиночный. Но менеджер должен вписать парный руками —
     * поэтому такая заявка помечена и требует действия.
     */
    function безПарного(p) {
        return !!(p && p.id) && (p.ntrp_doubles === null || p.ntrp_doubles === undefined);
    }

    /** Клетка NTRP в заявке: число, а если парного нет — кнопка «вписать». */
    function ячейкаNtrpПары(p) {
        var стиль = 'text-align:center;font-size:0.85rem;color:#ce93d8;font-weight:600;';
        if (!p || !p.id) return '<td style="' + стиль + '">—</td>';
        if (!безПарного(p)) return '<td style="' + стиль + '">' + ntrpПары(p) + '</td>';
        var одиночный = ntrpПары(p);
        return '<td style="text-align:center;padding:4px;">' +
            '<button class="ad-ntrp-fix" data-player-id="' + A.esc(p.id) + '"' +
            ' data-player-name="' + A.esc(p.name || p.id) + '"' +
            ' data-singles="' + (p.ntrp_singles || '') + '"' +
            ' title="' + L.dblNtrpNeedHint + '"' +
            ' style="padding:2px 8px;border:1px solid #ffb300;border-radius:4px;background:rgba(255,179,0,0.12);color:#ffb300;cursor:pointer;font-size:0.75rem;font-weight:700;white-space:nowrap;">' +
            '\u26A0 ' + (одиночный || '—') + '</button></td>';
    }

    /**
     * Групповой матч ни на что дальше не влияет: в группе каждая пара играет
     * с каждой, и результат одной встречи не переносит людей в другие клетки.
     * Правка сетки — про олимпийку, где победитель едет дальше; в группе её
     * применять нельзя, иначе стираются чужие матчи с теми же номерами.
     */
    function групповой(m) {
        return !!(m && m.group_number);
    }

    /** Число без лишних нулей: 8.75 остаётся 8.75, а 7.00 показывается как 7. */
    function дробь(n) {
        return String(Math.round((Number(n) || 0) * 100) / 100);
    }

    /** Время отправки в виде «09:40». Пусто, если не отправляли. */
    function часы(когда) {
        if (!когда) return '';
        var д = new Date(когда);
        if (isNaN(д.getTime())) return '';
        return ('0' + д.getHours()).slice(-2) + ':' + ('0' + д.getMinutes()).slice(-2);
    }

    /** Дата и время отправки: «10.09.26 00:42», по местным часам. */
    function датаВремя(когда) {
        if (!когда) return '';
        var д = new Date(когда);
        if (isNaN(д.getTime())) return '';
        return ('0' + д.getDate()).slice(-2) + '.' + ('0' + (д.getMonth() + 1)).slice(-2) + '.' +
               String(д.getFullYear()).slice(2) + ' ' + часы(когда);
    }

    /** Первый номер пары — больший из двух рейтингов. */
    function сильнейшийВПаре(reg, playersMap) {
        var свой = reg.player_id && playersMap[reg.player_id]
            ? ntrpПары(playersMap[reg.player_id]) : (reg.external_ntrp || 0);
        var партнёр = reg.partner_id && playersMap[reg.partner_id]
            ? ntrpПары(playersMap[reg.partner_id]) : (reg.partner_external_ntrp || 0);
        return Math.max(Number(свой) || 0, Number(партнёр) || 0);
    }

    function getTeamNtrp(reg, playersMap) {
        var captainNtrp = 0;
        if (reg.player_id && playersMap[reg.player_id]) {
            captainNtrp = ntrpПары(playersMap[reg.player_id]);
        } else if (reg.external_ntrp) {
            captainNtrp = reg.external_ntrp;
        }
        var partnerNtrp = 0;
        if (reg.partner_id && playersMap[reg.partner_id]) {
            partnerNtrp = ntrpПары(playersMap[reg.partner_id]);
        } else if (reg.partner_external_ntrp) {
            partnerNtrp = reg.partner_external_ntrp;
        }
        return captainNtrp + partnerNtrp;
    }

    /**
     * Open modal to assign a partner to a registration (admin action).
     * Supports: KSLT player search or external player name entry.
     */
    /**
     * Окно «вписать парный рейтинг». Заявку не трогаем: она принята и стоит в
     * списке. Здесь менеджер ставит человеку парный NTRP, после чего пара
     * считается по нему, а пометка с заявки уходит.
     */
    function открытьОкноПарного(playerId, playerName, singles, tournamentId) {
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
            '<div class="ad-confirm-modal">' +
                '<div class="ad-confirm-title">' + L.dblNtrpNeedTitle + '</div>' +
                '<div class="ad-confirm-text" style="text-align:left;margin-bottom:14px;color:var(--text-secondary);">' +
                    A.esc(playerName) +
                    (singles ? ' \u00b7 ' + L.plrNtrpSingles + ' ' + A.esc(singles) : '') +
                '</div>' +
                '<div class="ad-field" style="text-align:left;">' +
                    '<label class="ad-field-label">' + L.plrNtrpDoubles + '</label>' +
                    '<select class="ad-field-input" id="adDblNtrpValue">' + A.ntrpOptions(null) + '</select>' +
                '</div>' +
                '<div class="ad-confirm-actions" style="gap:8px;margin-top:16px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adDblNtrpSave">' + L.save + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adDblNtrpCancel">' + L.cancel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        function dismiss() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
        document.getElementById('adDblNtrpCancel').addEventListener('click', dismiss);

        document.getElementById('adDblNtrpSave').addEventListener('click', async function() {
            var знач = parseFloat(document.getElementById('adDblNtrpValue').value);
            if (!знач) { A.showToast(L.dblNtrpNeedTitle, 'error'); return; }
            var res = await A.client.from('players').update({ ntrp_doubles: знач }).eq('id', playerId);
            if (res.error) { A.showToast(res.error.message, 'error'); return; }
            dismiss();
            A.showToast(L.saved, 'success');
            renderBracketManagement(tournamentId, 'registrations');
        });
    }

    function openPartnerModal(regId, tournament, tournamentId, registrations) {
        var isMixed = tournament.format === 'mixed_doubles';

        // Collect already-used player IDs in this tournament
        // Снятые заявки не занимают человека: он снова свободен для пары
        var usedIds = {};
        registrations.forEach(function(r) {
            if (r.status === 'withdrawn' || r.status === 'rejected') return;
            if (r.player_id) usedIds[r.player_id] = true;
            if (r.partner_id) usedIds[r.partner_id] = true;
        });

        // Сначала выбор, кого добавляем: игрока с карточкой или гостя. Раньше
        // оба способа стояли на экране разом, и было непонятно, что заполнять
        var modalHtml =
            '<div style="display:flex;flex-direction:column;gap:12px;min-width:320px;">' +
                '<div class="ad-mode-switch" id="adPartnerMode">' +
                    '<button type="button" class="on" data-mode="db">' + L.regAddFromDb.replace('+ ', '') + '</button>' +
                    '<button type="button" data-mode="guest">' + L.regGuest + '</button>' +
                '</div>' +
                '<div id="adPartnerDbBlock">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.doublesPartnerSearch + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPartnerSearch" placeholder="' + (isEn ? 'Type name...' : 'Введите имя...') + '" autocomplete="off">' +
                        '<div id="adPartnerResults" style="max-height:180px;overflow-y:auto;margin-top:4px;"></div>' +
                        '<input type="hidden" id="adPartnerSelectedId" value="">' +
                    '</div>' +
                    '<div id="adPartnerCard" style="display:none;margin-top:8px;padding:10px 12px;border:1px solid var(--border-subtle);border-radius:8px;font-size:0.85rem;color:var(--text-secondary);"></div>' +
                '</div>' +
                '<div id="adPartnerGuestBlock" style="display:none;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.doublesExtPartnerName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPartnerExtName" placeholder="' + L.doublesExtPartnerName + '">' +
                    '</div>' +
                    '<div style="display:flex;gap:12px;margin-top:10px;">' +
                        '<div class="ad-field" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.doublesExtPartnerNtrp + '</label>' +
                            '<input type="number" class="ad-field-input" id="adPartnerExtNtrp" min="1.0" max="7.0" step="0.5" placeholder="3.0">' +
                        '</div>' +
                        '<div class="ad-field" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.doublesExtPartnerGender + '</label>' +
                            '<select class="ad-field-input" id="adPartnerExtGender">' +
                                '<option value="">—</option>' +
                                '<option value="men">' + L.genderMen + '</option>' +
                                '<option value="women">' + L.genderWomen + '</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        A.showConfirm(L.doublesAddPartner, modalHtml, async function() {
            var selectedId = document.getElementById('adPartnerSelectedId').value.trim();
            var extName = document.getElementById('adPartnerExtName').value.trim();
            var extNtrp = parseFloat(document.getElementById('adPartnerExtNtrp').value) || null;
            var extGender = document.getElementById('adPartnerExtGender').value || null;

            if (!selectedId && !extName) {
                A.showToast(isEn ? 'Select a partner or enter external name' : 'Выберите партнёра или введите имя', 'error');
                return;
            }

            var updateData = {};
            if (selectedId) {
                // KSLT player partner
                updateData.partner_id = selectedId;
                updateData.partner_external_name = null;
                updateData.partner_external_ntrp = null;
                updateData.partner_gender = null;

                // Mixed doubles gender check
                if (isMixed) {
                    var reg = registrations.find(function(r) { return r.id === regId; });
                    if (reg && reg.player_id) {
                        var captainRes = await A.client.from('players').select('gender').eq('id', reg.player_id).single();
                        var partnerRes = await A.client.from('players').select('gender').eq('id', selectedId).single();
                        if (captainRes.data && partnerRes.data) {
                            if (!validateMixedDoublesGender(captainRes.data.gender, partnerRes.data.gender)) {
                                A.showToast(L.doublesGenderError, 'error');
                                return;
                            }
                        }
                    }
                }
            } else {
                // External partner
                updateData.partner_id = null;
                updateData.partner_external_name = extName;
                updateData.partner_external_ntrp = extNtrp;
                updateData.partner_gender = extGender;

                // Mixed doubles gender check for external
                if (isMixed && extGender) {
                    var reg = registrations.find(function(r) { return r.id === regId; });
                    if (reg && reg.player_id) {
                        var captainRes2 = await A.client.from('players').select('gender').eq('id', reg.player_id).single();
                        if (captainRes2.data && !validateMixedDoublesGender(captainRes2.data.gender, extGender)) {
                            A.showToast(L.doublesGenderError, 'error');
                            return;
                        }
                    }
                }
            }

            // NTRP combined check
            if (tournament.ntrp_combined_max) {
                var reg = registrations.find(function(r) { return r.id === regId; });
                var captainNtrp = null;
                if (reg && reg.player_id) {
                    var cnRes = await A.client.from('players').select('ntrp_singles, ntrp_doubles').eq('id', reg.player_id).single();
                    captainNtrp = cnRes.data ? ntrpПары(cnRes.data) : null;
                } else if (reg) {
                    captainNtrp = reg.external_ntrp;
                }
                var partnerNtrp = selectedId ? null : extNtrp;
                if (selectedId) {
                    var pnRes = await A.client.from('players').select('ntrp_singles, ntrp_doubles').eq('id', selectedId).single();
                    partnerNtrp = pnRes.data ? ntrpПары(pnRes.data) : null;
                }
                if (!validateNtrpCombined(captainNtrp, partnerNtrp, tournament.ntrp_combined_max)) {
                    A.showToast(L.doublesNtrpCombinedError + ': ' +
                        дробь(Number(captainNtrp) + Number(partnerNtrp)) + ' \u203A ' +
                        дробь(tournament.ntrp_combined_max), 'error');
                    return;
                }
            }

            var upRes = await A.client.from('tournament_registrations').update(updateData).eq('id', regId);
            if (upRes.error) { A.showToast(upRes.error.message, 'error'); return; }
            A.showToast(isEn ? 'Partner added' : 'Партнёр добавлен', 'success');
            renderBracketManagement(tournamentId, 'registrations');
        }, isEn ? 'Save' : 'Сохранить');

        // Wire up player search
        setTimeout(function() {
            var searchInput = document.getElementById('adPartnerSearch');
            var resultsDiv = document.getElementById('adPartnerResults');
            var hiddenInput = document.getElementById('adPartnerSelectedId');
            if (!searchInput) return;

            // Переключение способа: у гостя чистим выбранного игрока и наоборот,
            // иначе сохранится не то, что человек видел на экране
            var переключатель = document.getElementById('adPartnerMode');
            if (переключатель) {
                переключатель.querySelectorAll('button').forEach(function(кн) {
                    кн.addEventListener('click', function() {
                        переключатель.querySelectorAll('button').forEach(function(x) {
                            x.classList.toggle('on', x === кн);
                        });
                        var гость = кн.dataset.mode === 'guest';
                        document.getElementById('adPartnerDbBlock').style.display = гость ? 'none' : '';
                        document.getElementById('adPartnerGuestBlock').style.display = гость ? '' : 'none';
                        if (гость) {
                            hiddenInput.value = '';
                            searchInput.value = '';
                            resultsDiv.innerHTML = '';
                            document.getElementById('adPartnerCard').style.display = 'none';
                        } else {
                            document.getElementById('adPartnerExtName').value = '';
                            document.getElementById('adPartnerExtNtrp').value = '';
                            document.getElementById('adPartnerExtGender').value = '';
                        }
                    });
                });
            }

            var searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                var q = searchInput.value.trim();
                if (q.length < 2) { resultsDiv.innerHTML = ''; return; }

                searchTimeout = setTimeout(async function() {
                    var res = await A.client.from('players')
                        .select('id, name, name_en, gender, ntrp_singles, ntrp_doubles, category_id')
                        .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
                        .limit(10);
                    var players = (res.data || []).filter(function(p) { return !usedIds[p.id]; });

                    if (players.length === 0) {
                        resultsDiv.innerHTML = '<div style="padding:8px;color:var(--text-dim);font-size:0.85rem;">' +
                            (isEn ? 'No players found' : 'Игроков не найдено') + '</div>';
                        return;
                    }

                    var html = '';
                    players.forEach(function(p) {
                        var pName = isEn ? (p.name_en || p.name) : p.name;
                        var genderIcon = p.gender === 'men' ? '♂' : (p.gender === 'women' ? '♀' : '');
                        html += '<div class="ad-partner-search-item" data-player-id="' + p.id + '" ' +
                            'style="padding:6px 10px;cursor:pointer;border-radius:4px;font-size:0.9rem;display:flex;justify-content:space-between;align-items:center;">' +
                            '<span>' + A.esc(pName) + ' ' + genderIcon + '</span>' +
                            (ntrpПары(p) ? '<span style="color:var(--text-dim);font-size:0.75rem;">NTRP ' + ntrpПары(p) + '</span>' : '') +
                        '</div>';
                    });
                    resultsDiv.innerHTML = html;

                    resultsDiv.querySelectorAll('.ad-partner-search-item').forEach(function(item) {
                        item.addEventListener('click', function() {
                            hiddenInput.value = item.dataset.playerId;
                            searchInput.value = item.querySelector('span').textContent.trim();
                            resultsDiv.innerHTML = '';
                            // Clear external fields
                            var extNameEl = document.getElementById('adPartnerExtName');
                            if (extNameEl) extNameEl.value = '';

                            // У игрока с карточкой пол и рейтинг брать неоткуда,
                            // кроме карточки — показываем, что подтянулось
                            var выбран = players.find(function(x) { return x.id === item.dataset.playerId; });
                            var карточка = document.getElementById('adPartnerCard');
                            if (выбран && карточка) {
                                var пол = выбран.gender === 'women' ? L.genderWomen
                                    : (выбран.gender === 'men' ? L.genderMen : '\u2014');
                                var рейтинг = ntrpПары(выбран) ? 'NTRP ' + ntrpПары(выбран) : L.dblNtrpNeedTitle;
                                карточка.innerHTML = A.esc(isEn ? (выбран.name_en || выбран.name) : выбран.name) +
                                    ' \u00B7 ' + пол + ' \u00B7 ' + рейтинг;
                                карточка.style.display = '';
                            }
                        });
                    });
                }, 300);
            });
        }, 100);
    }

    // ---- Replace Player Modal ----
    // target: 'player' (main) or 'partner' (doubles partner)
    /**
     * Привязать поиск игрока к паре «поле ввода — список результатов».
     *
     * Тот же поиск нужен в трёх окнах: добавить партнёра, заменить одного,
     * заменить пару целиком. Раньше он был написан заново в каждом.
     */
    function привязатьПоиск(поле, список, скрытое, занятые) {
        if (!поле) return;
        var таймер;
        поле.addEventListener('input', function() {
            clearTimeout(таймер);
            var q = поле.value.trim();
            if (скрытое) скрытое.value = '';
            if (q.length < 2) { список.innerHTML = ''; return; }

            таймер = setTimeout(async function() {
                var res = await A.client.from('players')
                    .select('id, name, name_en, gender, ntrp_singles, ntrp_doubles')
                    .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
                    .limit(10);
                var найдены = (res.data || []).filter(function(p) { return !(занятые && занятые[p.id]); });
                if (!найдены.length) {
                    список.innerHTML = '<div style="padding:8px;color:var(--text-dim);font-size:0.85rem;">' +
                        (isEn ? 'No players found' : 'Игроков не найдено') + '</div>';
                    return;
                }
                var html = '';
                найдены.forEach(function(p) {
                    var имя = isEn ? (p.name_en || p.name) : p.name;
                    var пол = p.gender === 'men' ? '\u2642' : (p.gender === 'women' ? '\u2640' : '');
                    html += '<div class="ad-partner-search-item" data-player-id="' + p.id + '" ' +
                        'data-player-name="' + A.esc(имя) + '" ' +
                        'style="padding:6px 10px;cursor:pointer;border-radius:4px;font-size:0.9rem;' +
                        'display:flex;justify-content:space-between;align-items:center;">' +
                        '<span>' + A.esc(имя) + ' ' + пол + '</span>' +
                        (ntrpПары(p) ? '<span style="color:var(--text-dim);font-size:0.75rem;">NTRP ' + ntrpПары(p) + '</span>' : '') +
                    '</div>';
                });
                список.innerHTML = html;

                список.querySelectorAll('.ad-partner-search-item').forEach(function(строка) {
                    строка.addEventListener('click', function() {
                        if (скрытое) скрытое.value = строка.dataset.playerId;
                        поле.value = строка.dataset.playerName;
                        список.innerHTML = '';
                    });
                });
            }, 300);
        });
    }

    /**
     * Записать замену в историю турнира.
     *
     * Нужна админке: через неделю никто не вспомнит, почему в группе играл
     * человек, которого нет в первоначальных заявках. Игрокам не показываем.
     */
    async function записатьЗамену(tournamentId, regId, сторона, прежний, новый, имяПрежнего, имяНового) {
        try {
            var сессия = await A.client.auth.getSession();
            await A.client.from('registration_changes').insert({
                tournament_id: tournamentId,
                registration_id: regId,
                side: сторона,
                old_player_id: прежний || null,
                new_player_id: новый || null,
                old_name: имяПрежнего || null,
                new_name: имяНового || null,
                changed_by: сессия.data.session ? сессия.data.session.user.id : null
            });
        } catch (e) {
            console.warn('[KSLT] замену не записали в историю:', e.message);
        }
    }

    /**
     * Сказать людям о замене: новому — что он заявлен, снятому — что его
     * заменили, напарнику — с кем он теперь играет.
     *
     * Ошибку не показываем окном: замена уже прошла, и падать из-за
     * недошедшего уведомления неправильно — пишем в консоль.
     */
    async function сообщитьОЗамене(tournamentId, regId, прежний, новый, имяГостя) {
        try {
            var сессия = await A.client.auth.getSession();
            await fetch(SUPABASE_URL + '/functions/v1/match-notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + (сессия.data.session ? сессия.data.session.access_token : '')
                },
                body: JSON.stringify({
                    replacement: {
                        tournament_id: tournamentId,
                        registration_id: regId,
                        old_player_id: прежний || null,
                        new_player_id: новый || null,
                        new_name: имяГостя || null
                    }
                })
            });
        } catch (e) {
            console.warn('[KSLT] уведомление о замене не ушло:', e.message);
        }
    }

    /**
     * Сказать игроку и его напарнику, что менеджер тронул их заявку.
     *
     * Без этого человек заходил на страницу турнира и видел прежнее
     * состояние: сняли с сетки — а он до последнего собирался играть.
     *
     * Событие: waitlist | draw | rejected | withdrawn | guest_ok | guest_removed.
     * Уведомление не должно ломать саму операцию — она уже прошла, поэтому
     * ошибку пишем только в консоль.
     */
    async function сообщитьОЗаявке(regId, событие) {
        try {
            var сессия = await A.client.auth.getSession();
            await fetch(SUPABASE_URL + '/functions/v1/match-notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + (сессия.data.session ? сессия.data.session.access_token : '')
                },
                body: JSON.stringify({ entry: { registration_id: regId, event: событие } })
            });
        } catch (e) {
            console.warn('[KSLT] уведомление о заявке не ушло:', e.message);
        }
    }

    /** То же для списка заявок сразу — например, когда поднялась вся очередь. */
    async function сообщитьОЗаявках(ids, событие) {
        for (var i = 0; i < ids.length; i++) await сообщитьОЗаявке(ids[i], событие);
    }

    /** Есть ли ещё место в основной сетке. Без предела мест считаем, что есть. */
    async function естьМесто(tournamentId) {
        var т = await A.client.from('tournaments')
            .select('max_participants').eq('id', tournamentId).single();
        var всего = (т.data && т.data.max_participants) || 0;
        if (!всего) return true;

        var занято = await A.client.from('tournament_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .in('status', ['approved', 'pending', 'draw']);
        return (занято.count || 0) < всего;
    }

    /**
     * Поднять первых из листа ожидания, пока в основной сетке есть места.
     *
     * Очередь честная — по времени подачи. Menеджер может протолкнуть кого-то
     * руками, но обычный ход событий не должен требовать его внимания.
     */
    async function поднятьИзОчереди(tournamentId) {
        var т = await A.client.from('tournaments')
            .select('max_participants').eq('id', tournamentId).single();
        var всего = (т.data && т.data.max_participants) || 0;
        if (!всего) return;

        var занято = await A.client.from('tournament_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .in('status', ['approved', 'pending', 'draw']);
        var свободно = всего - (занято.count || 0);
        if (свободно <= 0) return;

        var очередь = await A.client.from('tournament_registrations')
            .select('id').eq('tournament_id', tournamentId).eq('status', 'waitlist')
            .order('registered_at', { ascending: true }).limit(свободно);
        var ids = (очередь.data || []).map(function(r) { return r.id; });
        if (!ids.length) return;

        await A.client.from('tournament_registrations')
            .update({ status: 'approved' }).in('id', ids);

        await сообщитьОЗаявках(ids, 'draw');
    }

    /** Имя стороны заявки: игрок с карточкой, гость или общее слово. */
    function имяСтороны(reg, сторона, playersMap) {
        playersMap = playersMap || {};
        if (!reg) return '\u2014';
        if (сторона === 'partner') {
            var п = reg.partner_id && playersMap[reg.partner_id];
            if (п) return isEn ? (п.name_en || п.name) : п.name;
            return reg.partner_external_name || L.regReplacePartner;
        }
        var и = reg.player_id && playersMap[reg.player_id];
        if (и) return isEn ? (и.name_en || и.name) : и.name;
        return reg.external_name || L.regReplaceMain;
    }

    /**
     * Заменить пару целиком — одним окном, а не двумя заходами.
     *
     * Место в сетке принадлежит заявке: группа, посев и позиция остаются, а на
     * корт выходят другие люди. В матчах переписываем первого номера — именно
     * он там записан.
     */
    function openReplacePairModal(regId, tournament, tournamentId, registrations, playersMap) {
        var reg = registrations.find(function(r) { return r.id === regId; });
        if (!reg) return;

        var занятые = {};
        registrations.forEach(function(r) {
            if (r.id === regId) return;
            if (r.status === 'withdrawn' || r.status === 'rejected') return;
            if (r.player_id) занятые[r.player_id] = true;
            if (r.partner_id) занятые[r.partner_id] = true;
        });

        var поле = function(подпись, id) {
            return '<div class="ad-field">' +
                '<label class="ad-field-label">' + подпись + '</label>' +
                '<input type="text" class="ad-field-input" id="' + id + 'Search" placeholder="' +
                    (isEn ? 'Type name...' : 'Введите имя...') + '" autocomplete="off">' +
                '<div id="' + id + 'Results" style="max-height:150px;overflow-y:auto;margin-top:4px;"></div>' +
                '<input type="hidden" id="' + id + 'Id" value="">' +
            '</div>';
        };

        var html =
            '<div style="display:flex;flex-direction:column;gap:14px;min-width:340px;">' +
                '<div style="color:var(--text-secondary);font-size:0.85rem;">' +
                    L.regReplacePairHint + '</div>' +
                поле(L.regReplaceMain, 'adPairFirst') +
                поле(L.regReplacePartner, 'adPairSecond') +
            '</div>';

        A.showConfirm(L.regReplacePair, html, async function() {
            var первый = document.getElementById('adPairFirstId').value.trim();
            var второй = document.getElementById('adPairSecondId').value.trim();
            if (!первый || !второй) {
                A.showToast(L.regReplacePairNeedBoth, 'error');
                return;
            }
            if (первый === второй) {
                A.showToast(L.regReplacePairSame, 'error');
                return;
            }

            // Сыгранную пару не меняем: её счета принадлежат тем, кто играл
            var прежний = reg.player_id;
            var вМатчах = 0;
            if (прежний) {
                var мРес = await A.client.from('matches')
                    .select('id, status, score')
                    .eq('tournament_id', tournamentId)
                    .or('player1_id.eq.' + прежний + ',player2_id.eq.' + прежний);
                var мои = мРес.data || [];
                if (мои.some(function(m) { return m.status === 'completed' && m.score && m.score !== 'BYE'; })) {
                    A.showToast(L.regReplacePlayed, 'error');
                    return;
                }
                вМатчах = мои.length;
            }

            var правка = await A.client.from('tournament_registrations').update({
                player_id: первый,
                is_external: false,
                external_name: null,
                external_country: null,
                external_ntrp: null,
                partner_id: второй,
                partner_external_name: null,
                partner_external_ntrp: null,
                partner_gender: null
            }).eq('id', regId);
            if (правка.error) { A.showToast(правка.error.message, 'error'); return; }

            if (вМатчах && прежний) {
                var м1 = await A.client.from('matches').update({ player1_id: первый })
                    .eq('tournament_id', tournamentId).eq('player1_id', прежний);
                var м2 = await A.client.from('matches').update({ player2_id: первый })
                    .eq('tournament_id', tournamentId).eq('player2_id', прежний);
                if (м1.error || м2.error) {
                    A.showToast((м1.error || м2.error).message, 'error');
                    return;
                }
            }

            A.showToast(L.regReplacePairDone, 'success');
            записатьЗамену(tournamentId, regId, 'pair', прежний, первый,
                имяСтороны(reg, 'player', playersMap), null);
            if (reg.partner_id) {
                записатьЗамену(tournamentId, regId, 'partner', reg.partner_id, второй,
                    имяСтороны(reg, 'partner', playersMap), null);
            }
            сообщитьОЗамене(tournamentId, regId, прежний, первый, null);
            if (reg.partner_id) сообщитьОЗамене(tournamentId, regId, reg.partner_id, второй, null);
            renderBracketManagement(tournamentId, 'registrations');
        }, isEn ? 'Save' : 'Сохранить');

        setTimeout(function() {
            привязатьПоиск(document.getElementById('adPairFirstSearch'),
                           document.getElementById('adPairFirstResults'),
                           document.getElementById('adPairFirstId'), занятые);
            привязатьПоиск(document.getElementById('adPairSecondSearch'),
                           document.getElementById('adPairSecondResults'),
                           document.getElementById('adPairSecondId'), занятые);
        }, 100);
    }

    function openReplaceModal(regId, target, tournament, tournamentId, registrations, playersMap) {
        var reg = registrations.find(function(r) { return r.id === regId; });
        if (!reg) return;

        // Тот же выбор, что при добавлении: игрок с карточкой или гость.
        // Место в сетке при замене остаётся за заявкой — меняется только тот,
        // кто выйдет на корт
        var modalHtml =
            '<div style="display:flex;flex-direction:column;gap:12px;min-width:340px;">' +
                '<div class="ad-mode-switch" id="adReplaceMode">' +
                    '<button type="button" class="on" data-mode="db">' + L.regAddFromDb.replace('+ ', '') + '</button>' +
                    '<button type="button" data-mode="guest">' + L.regGuest + '</button>' +
                '</div>' +
                '<div id="adReplaceDbBlock">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.regFromDb + '</label>' +
                        '<input type="text" class="ad-field-input" id="adReplaceSearch" placeholder="' + L.regSearchPlayer + '" autocomplete="off">' +
                        '<div id="adReplaceResults" style="max-height:180px;overflow-y:auto;margin-top:4px;"></div>' +
                        '<input type="hidden" id="adReplaceSelectedId" value="">' +
                    '</div>' +
                '</div>' +
                '<div id="adReplaceGuestBlock" style="display:none;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.regExternalName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adReplaceExtName" placeholder="' + L.regExternalName + '">' +
                    '</div>' +
                    '<div style="display:flex;gap:12px;margin-top:10px;">' +
                        '<div class="ad-field" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.regExternalCountry + '</label>' +
                            '<input type="text" class="ad-field-input" id="adReplaceExtCountry" placeholder="🇰🇬" style="font-size:1.3rem;text-align:center;">' +
                        '</div>' +
                        '<div class="ad-field" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.regExternalNtrp + '</label>' +
                            '<input type="number" class="ad-field-input" id="adReplaceExtNtrp" min="1.0" max="7.0" step="0.5" placeholder="3.0">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        A.showConfirm(L.regReplace, modalHtml, async function() {
            var selectedId = document.getElementById('adReplaceSelectedId').value.trim();
            var extName = document.getElementById('adReplaceExtName').value.trim();
            var extCountry = document.getElementById('adReplaceExtCountry').value.trim() || null;
            var extNtrp = parseFloat(document.getElementById('adReplaceExtNtrp').value) || null;

            if (!selectedId && !extName) {
                A.showToast(isEn ? 'Select a player or enter external name' : 'Выберите игрока или введите имя', 'error');
                return;
            }

            var updateData = {};

            if (target === 'partner') {
                // Replace partner
                if (selectedId) {
                    updateData.partner_id = selectedId;
                    updateData.partner_external_name = null;
                    updateData.partner_external_ntrp = null;
                } else {
                    updateData.partner_id = null;
                    updateData.partner_external_name = extName;
                    updateData.partner_external_ntrp = extNtrp;
                }
            } else {
                // Replace main player
                if (selectedId) {
                    updateData.player_id = selectedId;
                    updateData.is_external = false;
                    updateData.external_name = null;
                    updateData.external_country = null;
                    updateData.external_ntrp = null;
                } else {
                    updateData.player_id = null;
                    updateData.is_external = true;
                    updateData.external_name = extName;
                    updateData.external_country = extCountry;
                    updateData.external_ntrp = extNtrp;
                }
            }

            // ---- Замена на месте, когда сетка уже есть ----
            //
            // Место в сетке принадлежит заявке, а не человеку: группа, посев и
            // позиция остаются. Но в матчах записан игрок, поэтому его надо
            // переписать и там, иначе в таблице группы останется прежнее имя.
            //
            // Меняем только пока эта сторона не сыграла: у сыгранных матчей
            // счёт принадлежит тем, кто играл, и передавать его новым нельзя.
            var прежний = target === 'partner' ? reg.partner_id : reg.player_id;
            var новый = selectedId || null;
            var вМатчах = 0;

            if (прежний && target !== 'partner') {
                var мРес = await A.client.from('matches')
                    .select('id, status, score')
                    .eq('tournament_id', tournamentId)
                    .or('player1_id.eq.' + прежний + ',player2_id.eq.' + прежний);
                var мои = мРес.data || [];
                var сыграно = мои.filter(function(m) {
                    return m.status === 'completed' && m.score && m.score !== 'BYE';
                });
                if (сыграно.length) {
                    A.showToast(L.regReplacePlayed, 'error');
                    return;
                }
                вМатчах = мои.length;
            }

            var upRes = await A.client.from('tournament_registrations').update(updateData).eq('id', regId);
            if (upRes.error) { A.showToast(upRes.error.message, 'error'); return; }

            // Первый номер стоит в матчах — переписываем обе стороны
            if (вМатчах && прежний && новый) {
                var м1 = await A.client.from('matches').update({ player1_id: новый })
                    .eq('tournament_id', tournamentId).eq('player1_id', прежний);
                var м2 = await A.client.from('matches').update({ player2_id: новый })
                    .eq('tournament_id', tournamentId).eq('player2_id', прежний);
                if (м1.error || м2.error) {
                    A.showToast((м1.error || м2.error).message, 'error');
                    return;
                }
            }

            A.showToast(isEn ? 'Player replaced' : 'Игрок заменён', 'success');
            записатьЗамену(tournamentId, regId, target === 'partner' ? 'partner' : 'player',
                прежний, новый,
                прежний ? имяСтороны(reg, target === 'partner' ? 'partner' : 'player', playersMap) : null,
                новый ? null : extName);
            сообщитьОЗамене(tournamentId, regId, прежний, новый, extName);
            renderBracketManagement(tournamentId, 'registrations');
        }, isEn ? 'Save' : 'Сохранить');

        // Wire up player search
        setTimeout(function() {
            var searchInput = document.getElementById('adReplaceSearch');
            var resultsDiv = document.getElementById('adReplaceResults');
            var hiddenInput = document.getElementById('adReplaceSelectedId');
            if (!searchInput) return;

            // Переключение способа замены: чужие поля чистим, чтобы сохранилось
            // ровно то, что человек видел на экране
            var режим = document.getElementById('adReplaceMode');
            if (режим) {
                режим.querySelectorAll('button').forEach(function(кн) {
                    кн.addEventListener('click', function() {
                        режим.querySelectorAll('button').forEach(function(x) {
                            x.classList.toggle('on', x === кн);
                        });
                        var гость = кн.dataset.mode === 'guest';
                        document.getElementById('adReplaceDbBlock').style.display = гость ? 'none' : '';
                        document.getElementById('adReplaceGuestBlock').style.display = гость ? '' : 'none';
                        if (гость) {
                            hiddenInput.value = '';
                            searchInput.value = '';
                            resultsDiv.innerHTML = '';
                        } else {
                            document.getElementById('adReplaceExtName').value = '';
                            document.getElementById('adReplaceExtCountry').value = '';
                            document.getElementById('adReplaceExtNtrp').value = '';
                        }
                    });
                });
            }

            var searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                var q = searchInput.value.trim();
                if (q.length < 2) { resultsDiv.innerHTML = ''; return; }

                searchTimeout = setTimeout(async function() {
                    var res = await A.client.from('players')
                        .select('id, name, name_en, photo, category_id, ntrp_singles')
                        .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
                        .limit(10);
                    var players = res.data || [];

                    if (players.length === 0) {
                        resultsDiv.innerHTML = '<div style="padding:8px;color:var(--text-dim);font-size:0.85rem;">' +
                            (isEn ? 'No players found' : 'Игроков не найдено') + '</div>';
                        return;
                    }

                    var html = '';
                    players.forEach(function(p) {
                        var pName = isEn ? (p.name_en || p.name) : p.name;
                        var catLabel = p.category_id ? p.category_id.charAt(0).toUpperCase() + p.category_id.slice(1) : '';
                        var ntrpLabel = p.ntrp_singles ? ('NTRP ' + p.ntrp_singles) : '';
                        var meta = [catLabel, ntrpLabel].filter(Boolean).join(' · ');
                        html += '<div class="ad-replace-search-item" data-player-id="' + p.id + '" ' +
                            'style="padding:6px 10px;cursor:pointer;border-radius:4px;font-size:0.9rem;display:flex;justify-content:space-between;align-items:center;">' +
                            '<span>' + A.esc(pName) + '</span>' +
                            (meta ? '<span style="color:var(--text-dim);font-size:0.75rem;">' + meta + '</span>' : '') +
                        '</div>';
                    });
                    resultsDiv.innerHTML = html;

                    resultsDiv.querySelectorAll('.ad-replace-search-item').forEach(function(item) {
                        item.addEventListener('mouseenter', function() { item.style.background = 'rgba(255,255,255,0.05)'; });
                        item.addEventListener('mouseleave', function() { item.style.background = ''; });
                        item.addEventListener('click', function() {
                            hiddenInput.value = item.dataset.playerId;
                            searchInput.value = item.querySelector('span').textContent.trim();
                            resultsDiv.innerHTML = '';
                            // Clear external fields
                            document.getElementById('adReplaceExtName').value = '';
                        });
                    });
                }, 300);
            });
        }, 100);
    }

    /**
     * Expand results for doubles: for each captain result, add partner result row.
     * Only KSLT partners (partner_id) get results; external partners don't.
     * @param {Array} results - captain results [{player_id, round_reached, points_earned, ...}]
     * @param {Array} registrations - tournament registrations
     * @param {boolean} isDbl - is doubles tournament
     * @returns {Array} expanded results
     */
    function expandDoublesResults(results, registrations, isDbl) {
        if (!isDbl) return results;

        var regsMap = {};
        registrations.forEach(function(r) {
            if (r.player_id) regsMap[r.player_id] = r;
        });

        var expanded = [];
        results.forEach(function(res) {
            // Captain result - mark as doubles
            var captainRow = {};
            Object.keys(res).forEach(function(k) { captainRow[k] = res[k]; });
            captainRow.is_doubles = true;
            expanded.push(captainRow);

            // Partner result (only KSLT players)
            var reg = regsMap[res.player_id];
            if (reg && reg.partner_id) {
                var partnerRow = {};
                Object.keys(res).forEach(function(k) { partnerRow[k] = res[k]; });
                partnerRow.player_id = reg.partner_id;
                partnerRow.partner_id = res.player_id;
                partnerRow.is_doubles = true;
                expanded.push(partnerRow);
            }
        });

        return expanded;
    }

    /**
     * Парный счёт игроков турнира.
     *
     * Раньше здесь считались победы, поражения, форма и очки за пары —
     * прямо в браузере, по одному игроку за запрос. Считалось только когда
     * менеджер сохранял результаты, и только по капитанам: напарник в матче
     * не записан, и своих парных побед не видел.
     *
     * Теперь это делает база, функцией recalc_pair_stats, которую зовёт
     * триггер после каждого матча. Здесь остался вызов на случай, когда
     * результаты правят задним числом: триггер отработает на матчах, а эта
     * строка обновит всех, кого назвал менеджер.
     *
     * Очки за пары и форма парных матчей удалены: рейтинг у нас одиночный,
     * а эти числа никто не показывал.
     */
    async function recalcDoublesPoints(playerIds) {
        var unique = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });
        if (unique.length === 0) return;

        var res = await A.client.rpc('recalc_pair_stats', { p_ids: unique });
        if (res.error) {
            console.error('[KSLT] парный счёт не пересчитан:', res.error.message || res.error);
        }
    }

    // Friendly — турниры для практики: рейтинговые очки не начисляются никогда,
    // какой бы уровень турнира админ ни выставил
    /**
     * Сколько сеяных нужно турниру.
     *
     * В групповых — по числу групп: сеяные разводятся по одному в группу.
     * В олимпийке — четверть сетки, как в правилах ATP и WTA: 8 участников —
     * двое сеяных, 16 — четверо, 32 — восемь.
     */
    function нормаСеяных(tournament) {
        if (!tournament) return 0;
        var тип = tournament.bracket_type;
        if (тип === 'round_robin' || тип === 'group_league') {
            return tournament.group_count || 2;
        }
        var размер = tournament.draw_size || 16;
        return Math.max(2, Math.floor(размер / 4));
    }

    /** Посев ставит менеджер руками только в нерейтинговых турнирах. */
    function посевРуками(tournament) {
        return isFriendlyTournament(tournament);
    }

    function isFriendlyTournament(tournament) {
        return !!(tournament && tournament.category_id === 'friendly');
    }

    // Рейтинг ведётся только в одиночном разряде. Парные и микст турниры
    // играются и попадают в историю игр, но очков не дают.
    function isUnrankedTournament(tournament) {
        if (!tournament) return false;
        if (isFriendlyTournament(tournament)) return true;
        return tournament.format === 'doubles' || tournament.format === 'mixed_doubles';
    }

    // Обнуляет очки в результатах турнира без рейтинга (сами результаты сохраняются)
    function stripFriendlyPoints(tournament, rows) {
        if (isUnrankedTournament(tournament)) {
            (rows || []).forEach(function(r) { r.points_earned = 0; });
        }
        return rows;
    }

    // ---- Save Rating History on finalization ----
    async function saveRatingHistory(tournament, results, isDbl) {
        // Delete old entries for this tournament (re-finalization safe)
        await A.client.from('rating_history').delete().eq('tournament_id', tournament.id);

        // Турниры без рейтинга — Friendly, парные и микст — в рейтинг не попадают
        if (isUnrankedTournament(tournament)) {
            A.showToast(isEn ? 'No rating points awarded for this tournament'
                             : 'Рейтинговые очки за этот турнир не начисляются', 'success');
            return;
        }

        if (!results || results.length === 0) return;

        var rows = results.map(function(r) {
            return {
                player_id: r.player_id,
                tournament_name: tournament.title,
                // Очки идут в категорию турнира, а не игрока: гость из нижней
                // категории получает очки той, где сыграл
                category_id: tournament.category_id || null,
                tournament_id: tournament.id,
                points_earned: r.points_earned || 0,
                // День окончания, а не начала: очки присуждаются по итогу
                // турнира. Из 45 сыгранных турниров 42 идут больше одного
                // дня, и на графике рост начинался раньше, чем турнир кончился
                recorded_at: tournament.date_end || tournament.date_start,
                is_doubles: isDbl || false
            };
        });

        await A.client.from('rating_history').insert(rows);
    }

    // Round mapping: round_number → round_reached key for points
    var ROUND_TO_KEY = {};
    // Will be populated dynamically based on draw_size

    function getRoundKey(roundNumber, totalRounds) {
        // For losers: roundsFromEnd = which round they lost in
        // Lost in Final → F, Lost in SF → SF, Lost in QF → QF, etc.
        var roundsFromEnd = totalRounds - roundNumber;
        if (roundsFromEnd === 0) return 'F';   // lost in Final
        if (roundsFromEnd === 1) return 'SF';  // lost in Semifinal
        if (roundsFromEnd === 2) return 'QF';  // lost in Quarterfinal
        if (roundsFromEnd === 3) return 'R16';
        if (roundsFromEnd === 4) return 'R32';
        if (roundsFromEnd === 5) return 'R64';
        return 'R' + Math.pow(2, roundsFromEnd + 1);
    }

    // Round names for bracket display
    function getRoundName(roundNum, totalRounds, drawSize) {
        var roundsFromEnd = totalRounds - roundNum;
        if (roundsFromEnd === 0) return L.roundF;
        if (roundsFromEnd === 1) return L.roundSF;
        if (roundsFromEnd === 2) return L.roundQF;
        if (roundsFromEnd === 3) return L.roundR16;
        if (roundsFromEnd === 4) return isEn ? 'Round of 32' : '1/16 финала';
        if (roundsFromEnd === 5) return isEn ? 'Round of 64' : '1/32 финала';
        return isEn ? 'Round ' + roundNum : 'Раунд ' + roundNum;
    }

    // ---- Render Bracket Management View ----
    // Called after saving a tournament that has bracket_type set, or from edit view
    async function renderBracketManagement(tournamentId, forceTab) {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        A.setAdminHash('tournaments', 'bracket', tournamentId);

        // Ensure levels are loaded for results display
        await A.loadTournamentLevels();

        // Load tournament
        var tRes = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
        if (tRes.error || !tRes.data) {
            A.showToast(tRes.error ? tRes.error.message : 'Tournament not found', 'error');
            return;
        }
        var tournament = tRes.data;

        // Load registrations (include partner fields)
        var regRes = await A.client.from('tournament_registrations')
            .select('*, players:player_id(id, name, name_en, points, category_id)')
            .eq('tournament_id', tournamentId)
            .order('registered_at', { ascending: true });
        var registrations = regRes.data || [];
        var isDbl = isDoublesTournament(tournament);
        var regsMap = buildRegsMap(registrations);

        // Load matches
        var matchRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: true })
            .order('match_order', { ascending: true });
        var matches = matchRes.data || [];

        // Группа доиграла — её места окончательны, и ждать остальные группы
        // незачем: ставим людей в слоты плей-офф, которые их ждут
        if (await заполнитьСлоты(tournament, matches)) {
            var свежие = await A.client.from('matches')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('round_number', { ascending: true })
                .order('match_order', { ascending: true });
            matches = свежие.data || matches;
        }

        // Load players map for display (include partner_ids)
        var playerIds = [];
        registrations.forEach(function(r) {
            if (r.player_id) playerIds.push(r.player_id);
            if (r.partner_id) playerIds.push(r.partner_id);
        });
        matches.forEach(function(m) {
            if (m.player1_id) playerIds.push(m.player1_id);
            if (m.player2_id) playerIds.push(m.player2_id);
            if (m.winner_id) playerIds.push(m.winner_id);
        });
        playerIds = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        var playersMap = {};
        if (playerIds.length > 0) {
            var plRes = await A.client.from('players').select('id, name, name_en, points, category_id, gender, ntrp_singles, ntrp_doubles').in('id', playerIds);
            (plRes.data || []).forEach(function(p) { playersMap[p.id] = p; });

            // Compute rank within category: load all players for relevant categories
            var catIds = [];
            (plRes.data || []).forEach(function(p) {
                if (p.category_id && catIds.indexOf(p.category_id) === -1) catIds.push(p.category_id);
            });
            if (catIds.length > 0) {
                var rankRes = await A.client.from('players').select('id, points, category_id').in('category_id', catIds).order('points', { ascending: false });
                var catGroups = {};
                (rankRes.data || []).forEach(function(p) {
                    var cat = p.category_id;
                    if (!catGroups[cat]) catGroups[cat] = [];
                    catGroups[cat].push(p.id);
                });
                // Already sorted by points DESC — index = rank
                Object.keys(catGroups).forEach(function(cat) {
                    catGroups[cat].forEach(function(pid, idx) {
                        if (playersMap[pid]) playersMap[pid].rank = idx + 1;
                    });
                });
            }
        }

        // Пометка «Задолженность» — про неоплаченное членство. Пока идёт
        // бесплатный период, платить не за что, и метка стояла бы у всех
        var бесплатно = false;
        try {
            var нс = await A.client.from('app_settings').select('value').eq('key', 'free_access_until').maybeSingle();
            var до = нс.data && нс.data.value ? String(нс.data.value).replace(/"/g, '') : '';
            бесплатно = !!до && до !== 'null' && new Date().toISOString().slice(0, 10) <= до;
        } catch (e) { /* настройки нет — работаем по членству */ }

        // Load membership status for debt labels
        var debtPlayerIds = {};
        var regPlayerIds = бесплатно ? [] : registrations.map(function(r) { return r.player_id; }).filter(Boolean);
        if (regPlayerIds.length > 0) {
            // Get profile_ids linked to these player_ids
            var profRes = await A.client.from('profiles').select('id, player_id').in('player_id', regPlayerIds);
            var profileIds = (profRes.data || []).map(function(p) { return p.id; });
            var playerProfileMap = {};
            (profRes.data || []).forEach(function(p) { playerProfileMap[p.player_id] = p.id; });

            // Load active memberships for these profiles
            var activeMemberIds = {};
            if (profileIds.length > 0) {
                var memRes = await A.client.from('memberships')
                    .select('profile_id')
                    .in('profile_id', profileIds)
                    .eq('status', 'active')
                    .gte('expires_at', new Date().toISOString());
                (memRes.data || []).forEach(function(m) { activeMemberIds[m.profile_id] = true; });
            }

            // Mark players with debt (no active membership)
            regPlayerIds.forEach(function(pid) {
                var profId = playerProfileMap[pid];
                if (!profId || !activeMemberIds[profId]) {
                    debtPlayerIds[pid] = true;
                }
            });
        }

        var hasMatches = matches.length > 0;
        var isRegOpen = tournament.status === 'registration_open';
        var canGenerate = !hasMatches && registrations.filter(function(r) { return r.status === 'approved'; }).length >= 2;
        // Пустые клетки в счёт не идут: сетка строится на степень двойки, и
        // при 22 участниках из 32 мест десять выдуманные. Такие матчи никем
        // не заполнятся никогда, а турнир из-за них нельзя было завершить.
        // Турнир доигран, когда сыграны все клетки, которые вообще будут
        // заполнены, а не только те, где сейчас стоят люди. В сетке «все
        // места» половина клеток пустует до последнего круга: пока считали по
        // текущим, кнопка «Завершить» появлялась на середине турнира, и его
        // можно было закрыть, не доиграв.
        var allCompleted = hasMatches && (function() {
            var D = window.KSLT_DRAW;
            if (tournament.bracket_type === 'fic' && D && D.итоги) {
                var размер = tournament.draw_size || 16;
                var и = D.итоги(размер, matches.map(function(m) {
                    return {
                        круг: m.round_number, номер: m.match_order,
                        людей: (m.player1_id ? 1 : 0) + (m.player2_id ? 1 : 0)
                    };
                }));
                return matches.every(function(m) {
                    var сколько = и[m.round_number + ':' + m.match_order];
                    if (!сколько) return true;          // такой клетки в турнире нет
                    return m.status === 'completed';
                });
            }
            return matches.every(function(m) {
                if (!m.player1_id && !m.player2_id) return true;
                return m.status === 'completed';
            });
        })();
        var anyCompleted = hasMatches && matches.some(function(m) { return m.status === 'completed'; });
        var isTournamentCompleted = tournament.status === 'completed';

        // Load tournament_results if completed
        var tournamentResults = [];
        if (isTournamentCompleted) {
            var trRes = await A.client.from('tournament_results')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('points_earned', { ascending: false });
            tournamentResults = trRes.data || [];
        }

        // Build tabs
        var activeTab = forceTab || (isTournamentCompleted ? 'results' : (hasMatches ? 'bracket' : 'registrations'));
        // Сетки ещё нет — показывать нечего, отправляем на заявки
        if (activeTab === 'bracket' && !hasMatches) activeTab = 'registrations';

        // Friendly: вкладки «Результаты» нет — очки не начисляются, там одни нули.
        // Завершённый дружеский турнир открываем на сетке, а не на скрытой вкладке.
        var isFriendly = isFriendlyTournament(tournament);
        if (isFriendly && activeTab === 'results') activeTab = hasMatches ? 'bracket' : 'registrations';

        // Determine which nav tab is active
        var navActive = (activeTab === 'registrations') ? 'regs' :
                        (activeTab === 'schedule') ? 'schedule' :
                        (activeTab === 'news') ? 'news' :
                        (activeTab === 'results') ? 'points' : 'bracket';

        var html = '<div class="ad-brk-sticky-header">' +
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + A.esc(isEn ? (tournament.title_en || tournament.title) : tournament.title) + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adBrkBack">' + L.back + '</button>' +
            '</div>' +
            '<div class="ad-tabs ad-trn-nav-tabs">' +
            '<button class="ad-tab" data-trn-nav="edit">' + L.trnTabEdit + '</button>' +
            '<button class="ad-tab' + (navActive === 'regs' ? ' active' : '') + '" data-trn-nav="regs">' + L.trnTabRegs +
                ' <span class="ad-badge">' + (tournament.max_participants || '?') +
                '/' + registrations.filter(function(r) { return r.status === 'approved' || r.status === 'draw' || r.status === 'waitlist'; }).length + '</span>' +
            '</button>' +
            '<button class="ad-tab' + (navActive === 'bracket' ? ' active' : '') + '" data-trn-nav="bracket">' + (tournament.bracket_type === 'round_robin' || tournament.bracket_type === 'group_league' ? L.groupLabel : L.trnTabBracket) + '</button>' +
            '<button class="ad-tab' + (navActive === 'schedule' ? ' active' : '') + '" data-trn-nav="schedule">' + L.trnTabSchedule + '</button>' +
            (isFriendly ? '' : '<button class="ad-tab' + (navActive === 'points' ? ' active' : '') + '" data-trn-nav="points">' + L.trnTabPoints + '</button>') +
            (isTournamentCompleted ? '<button class="ad-tab' + (navActive === 'news' ? ' active' : '') + '" data-trn-nav="news">📰 ' + L.trnTabNews + '</button>' : '') +
            '</div>' +
        '</div>'; // /ad-brk-sticky-header

        // Ручная копия: заявки, сетка и расписание уезжают в файл или на
        // бумагу. На корте интернет пропадает, а лист с расписанием — нет
        var названиеТурнира = isEn ? (tournament.title_en || tournament.title) : tournament.title;
        function шапкаВыгрузки(панельId, что) {
            if (!A.экспорт) return '';
            return '<div class="ad-export-bar">' + A.экспорт.кнопки(панельId, что) + '</div>';
        }

        /** Свести кнопки выгрузки сетки в одну строку с «Пересоздать жеребьёвку». */
        function собратьКнопкиСетки(место) {
            var панель = место.querySelector('#adBrkBracketPanel');
            if (!панель) return;
            var полоса = панель.querySelector('.ad-export-bar');
            var пересоздать = панель.querySelector('#adBrkRegenerate');
            // Кнопки пересоздания нет — сетку уже играют, полоса остаётся своя
            if (!полоса || !пересоздать) return;

            var строка = пересоздать.parentElement;
            while (полоса.firstChild) строка.insertBefore(полоса.firstChild, пересоздать);
            полоса.remove();
        }

        // Registrations panel
        html += '<div class="ad-brk-panel" id="adBrkRegPanel" style="padding-top:8px;' + (activeTab !== 'registrations' ? 'display:none;' : '') + '">';
        html += шапкаВыгрузки('adBrkRegPanel', L.trnTabRegs);
        // Сетка сформирована — состав больше не трогаем: заявка это и есть
        // место в сетке, и убрать её значит оставить в матчах игрока, которого
        // в заявках уже нет
        var сеткаЕсть = matches.length > 0;
        html += renderRegistrationsPanel(tournament, registrations, playersMap, canGenerate, debtPlayerIds, isDbl, regsMap, сеткаЕсть);
        html += '</div>';

        // Bracket / Group panel
        html += '<div class="ad-brk-panel" id="adBrkBracketPanel" style="padding-top:8px;' + (activeTab !== 'bracket' ? 'display:none;' : '') + '">';
        if (hasMatches) html += шапкаВыгрузки('adBrkBracketPanel',
            (tournament.bracket_type === 'round_robin' || tournament.bracket_type === 'group_league') ? L.groupLabel : L.trnTabBracket);
        // Счета, которые вписали сами игроки: ждущие подтверждения и спорные.
        // Менеджер и так заходит в сетку, отдельной вкладки не нужно
        html += renderScoreQueue(matches, playersMap, isDbl, regsMap);
        if (hasMatches) {
            if (tournament.bracket_type === 'group_league') {
                html += renderGroupLeaguePanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap);
            } else if (tournament.bracket_type === 'round_robin') {
                html += renderGroupPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap);
            } else if (tournament.bracket_type === 'fic') {
                html += renderFicBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap);
            } else {
                html += renderBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap);
            }
        } else {
            html += '<div class="ad-empty-state" style="margin-top:24px;"><p>' + (isEn ? 'No bracket generated yet. Approve registrations and generate draw.' : 'Сетка ещё не сгенерирована. Одобрите заявки и сгенерируйте жеребьёвку.') + '</p></div>';
        }
        html += '</div>';

        // Schedule panel
        if (hasMatches) {
            html += '<div class="ad-brk-panel" id="adBrkSchedulePanel" style="' + (activeTab !== 'schedule' ? 'display:none;' : '') + '">';
            html += шапкаВыгрузки('adBrkSchedulePanel', L.trnTabSchedule);
            html += renderSchedulePanel(matches, playersMap, tournament, regsMap);
            html += '</div>';
        }

        // Results panel (only for completed tournaments)
        if (isTournamentCompleted) {
            html += '<div class="ad-brk-panel" id="adBrkResultsPanel" style="' + (activeTab !== 'results' ? 'display:none;' : '') + '">';
            html += renderResultsPanel(tournament, tournamentResults, playersMap, matches, registrations, isDbl);
            html += '<div style="text-align:right;margin-top:16px;">' +
                '<button class="ad-btn ad-btn-primary" id="adBrkRecalcPoints">' +
                (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button></div>';
            html += '</div>';

            // News panel
            html += '<div class="ad-brk-panel" id="adBrkNewsPanel" style="padding-top:8px;' + (activeTab !== 'news' ? 'display:none;' : '') + '">';
            html += '<div id="adBrkNewsContent"><div style="text-align:center;padding:40px;color:var(--text-secondary);">⏳ ' + (isEn ? 'Loading...' : 'Загрузка...') + '</div></div>';
            html += '</div>';
        }

        container.innerHTML = html;

        // Кнопки выгрузки: читают таблицы своей панели, поэтому вешаем их
        // сразу после отрисовки — до того, как менеджер что-то нажмёт
        if (A.экспорт) A.экспорт.оживить(container, названиеТурнира);

        // У сетки уже есть своя строка действий — «Пересоздать жеребьёвку».
        // Кнопки выгрузки ставим в неё же: две полосы кнопок одна над другой
        // занимали место и выглядели как разные разделы
        собратьКнопкиСетки(container);

        // Матчи за места ставим под их круг: считаем по месту, а не в уме —
        // между кругами есть узкие столбцы с линиями, и на глаз ширину
        // не угадать
        // Ждём, пока браузер разложит столбцы: сразу после отрисовки их
        // ширина ещё не окончательная, и сдвиг брался от старых позиций.
        requestAnimationFrame(function() {
            выровнятьМатчиЗаМеста(container);
        });

        // Navigation tabs — switch panels without re-render
        container.querySelectorAll('[data-trn-nav]').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var nav = tab.dataset.trnNav;
                if (nav === 'edit') { A.loadAndEditTournament(tournamentId); return; }
                // Map nav value → panel tab value
                var panelTab = (nav === 'regs') ? 'registrations' :
                               (nav === 'points') ? 'results' : nav;
                // Update active tab highlight
                container.querySelectorAll('[data-trn-nav]').forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                // Hide floating bar when switching away from registrations
                if (panelTab !== 'registrations' && floatingBar) floatingBar.style.display = 'none';
                // Toggle panels
                document.getElementById('adBrkRegPanel').style.display = panelTab === 'registrations' ? '' : 'none';
                document.getElementById('adBrkBracketPanel').style.display = panelTab === 'bracket' ? '' : 'none';
                // У завершённого турнира админка открывается на «Результатах»,
                // и сетка в этот момент спрятана: у скрытого блока все размеры
                // нулевые, и матчи за места вставали слева. Считаем сдвиг
                // заново, когда сетку показали.
                if (panelTab === 'bracket') {
                    requestAnimationFrame(function() {
                        выровнятьМатчиЗаМеста(container);
                    });
                }
                var schedPanel = document.getElementById('adBrkSchedulePanel');
                if (schedPanel) schedPanel.style.display = panelTab === 'schedule' ? '' : 'none';
                var resPanel = document.getElementById('adBrkResultsPanel');
                if (resPanel) resPanel.style.display = panelTab === 'results' ? '' : 'none';
                var newsPanel = document.getElementById('adBrkNewsPanel');
                if (newsPanel) {
                    newsPanel.style.display = panelTab === 'news' ? '' : 'none';
                    // Lazy-load news panel on first open
                    if (panelTab === 'news' && !newsPanel.dataset.loaded) {
                        newsPanel.dataset.loaded = '1';
                        initNewsPanel(tournament, tournamentResults, playersMap, matches, registrations, isDbl);
                    }
                }
            });
        });

        // If news tab is active on initial load, init immediately
        if (activeTab === 'news') {
            var np = document.getElementById('adBrkNewsPanel');
            if (np) { np.dataset.loaded = '1'; initNewsPanel(tournament, tournamentResults, playersMap, matches, registrations, isDbl); }
        }

        // Back button → return to tournament form (not list)
        document.getElementById('adBrkBack').addEventListener('click', function() {
            A.loadAndEditTournament(tournamentId);
        });

        // ---- Перестановка запусков ----
        //
        // Меняем местами сами игры: время и корт остаются на месте, переезжает
        // пара. Так порядок правится одним нажатием, а подменить игрока в уже
        // расставленной сетке нельзя — это дело жеребьёвки, а не расписания.
        container.querySelectorAll('.ad-sched-up, .ad-sched-down').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var строка = btn.closest('tr');
                var соседняя = btn.classList.contains('ad-sched-up')
                    ? строка.previousElementSibling : строка.nextElementSibling;
                if (!соседняя || !соседняя.dataset.matchId) return;

                var я = matches.find(function(m) { return m.id === строка.dataset.matchId; });
                var он = matches.find(function(m) { return m.id === соседняя.dataset.matchId; });
                if (!я || !он) return;

                btn.disabled = true;
                var r1 = await A.client.from('matches')
                    .update({ scheduled_time: он.scheduled_time, court: он.court }).eq('id', я.id);
                var r2 = await A.client.from('matches')
                    .update({ scheduled_time: я.scheduled_time, court: я.court }).eq('id', он.id);
                if (r1.error || r2.error) {
                    btn.disabled = false;
                    A.showToast((r1.error || r2.error).message, 'error');
                    return;
                }
                // Перестановка — то же изменение расписания, что правка времени.
                // В базу она уходит сразу, поэтому и отметку о сохранении
                // двигаем сразу: подпись под таблицей не должна врать
                await A.client.from('tournaments')
                    .update({ schedule_saved_at: new Date().toISOString() })
                    .eq('id', tournamentId);
                renderBracketManagement(tournamentId, 'schedule');
            });
        });

        // ---- Статус игры прямо в очереди ----
        //
        // «Ожидает» и «играют» ставит человек, ведущий турнир. «Сыгран»
        // приходит сам вместе со счётом — руками его не выставляем
        container.querySelectorAll('.ad-sched-status').forEach(function(кн) {
            кн.addEventListener('click', async function() {
                var переключатель = кн.closest('.ad-sched-switch');
                var статус = кн.dataset.status;
                if (кн.classList.contains('on')) return;

                var r = await A.client.from('matches')
                    .update({ status: статус }).eq('id', переключатель.dataset.match);
                if (r.error) { A.showToast(r.error.message, 'error'); return; }

                переключатель.querySelectorAll('.ad-sched-status').forEach(function(x) {
                    x.classList.toggle('on', x === кн);
                });
                var строка = кн.closest('tr');
                if (строка) строка.classList.toggle('ad-sched-row-live', статус === 'live');

                // Пара вышла на корт — звать её больше некуда. Вернули «Ждёт» —
                // «На корт» снова живая, а «Готовьтесь» только если не звали
                if (строка) {
                    var готовьтесь = строка.querySelector('.ad-call-ready');
                    var наКорт = строка.querySelector('.ad-call-go');
                    if (наКорт) наКорт.disabled = (статус === 'live');
                    if (готовьтесь) {
                        готовьтесь.disabled = (статус === 'live') ||
                            готовьтесь.classList.contains('ad-call-done');
                    }
                }
            });
        });

        // ---- Зов на корт ----
        //
        // Освободился корт — человек ставит его паре и зовёт. Уходит пуш и
        // телеграм всем четверым, а не крик через весь клуб
        container.querySelectorAll('.ad-call-ready, .ad-call-go').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var кнС = document.getElementById('adSchedSave');
                if (кнС && !кнС.disabled) {
                    A.showToast(L.schedSaveFirst, 'warning');
                    return;
                }
                var зовём = btn.classList.contains('ad-call-go');

                // Звать на корт без номера незачем: «пройдите на корт» — а на
                // какой? Корт ставится по ходу дня, и к зову он уже известен
                if (зовём) {
                    var полеКорта = btn.closest('tr').querySelector('.ad-sched-court');
                    var корт = полеКорта ? полеКорта.value : '';
                    if (!корт) { A.showToast(L.schedCourtFirst, 'warning'); return; }
                }

                btn.disabled = true;
                try {
                    var sess = await A.client.auth.getSession();
                    var res = await fetch(SUPABASE_URL + '/functions/v1/match-notify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + (sess.data.session ? sess.data.session.access_token : '')
                        },
                        body: JSON.stringify({ match_id: btn.dataset.match, kind: зовём ? 'go' : 'ready' })
                    });
                    var д = await res.json();
                    if (!res.ok || д.error) {
                        A.showToast(д.error || 'Ошибка', 'error');
                        // Матч успели сыграть, пока страница висела открытой:
                        // закрываем обе кнопки, чтобы не звать людей зря
                        if (res.status === 409) {
                            btn.parentNode.querySelectorAll('button').forEach(function(б) {
                                б.disabled = true;
                                б.classList.add('ad-call-done');
                            });
                            return;
                        }
                        btn.disabled = false;
                        return;
                    }

                    var время = часы(д.at || new Date().toISOString());
                    btn.classList.add('ad-call-done');
                    if (зовём) {
                        // Позвали — кнопка становится «Ещё раз» и помнит время
                        btn.classList.remove('ad-btn-primary');
                        btn.classList.add('ad-btn-secondary');
                        btn.textContent = L.schedCallAgain + ' ' + время;
                        btn.title = L.schedCalled + ' ' + время;
                        var рядом = btn.parentNode.querySelector('.ad-call-ready');
                        if (рядом && !рядом.disabled) {
                            рядом.disabled = true;
                            рядом.classList.add('ad-call-done');
                            рядом.title = L.schedCalled + ' ' + время;
                        }
                    } else {
                        // Предупредили — второй раз не шлём
                        btn.textContent = '\u2713 ' + время;
                        btn.title = L.schedCalledReady + ' ' + время;
                    }

                    if (д.already) { A.showToast(L.schedCalledAlready, 'info'); return; }
                    A.showToast((зовём ? L.schedCalled : L.schedCalledReady) +
                        ' \u00B7 ' + ((д.sent || 0) + (д.push_sent || 0)), 'success');
                } catch (e) {
                    A.showToast(String(e), 'error');
                }
                // «Готовьтесь» больше не оживает: предупреждение одно
                if (зовём) setTimeout(function() { btn.disabled = false; }, 3000);
            });
        });

        // ---- Schedule save handler ----
        var saveSchedBtn = document.getElementById('adSchedSave');
        if (saveSchedBtn) {
            saveSchedBtn.addEventListener('click', async function() {
                var rows = container.querySelectorAll('[data-match-id]');
                var updates = [];
                rows.forEach(function(row) {
                    var matchId = row.dataset.matchId;
                    var timeInput = row.querySelector('.ad-sched-time');
                    var courtEl = row.querySelector('.ad-sched-court');
                    if (!timeInput) return; // completed match, skip

                    // Только время и корт: кто с кем играет, расписание не решает
                    var updateData = {
                        scheduled_time: timeInput.value || null,
                        court: courtEl ? (courtEl.value || null) : null
                    };

                    updates.push(
                        A.client.from('matches').update(updateData).eq('id', matchId)
                    );
                });
                if (updates.length) {
                    saveSchedBtn.disabled = true;
                    await Promise.all(updates);
                    await A.client.from('tournaments')
                        .update({ schedule_saved_at: new Date().toISOString() })
                        .eq('id', tournamentId);
                    A.showToast(L.schedSaved);
                    renderBracketManagement(tournamentId, 'schedule');
                }
            });
        }

        // Время вводится руками в 24-часовом виде: цифры, двоеточие ставится
        // само, часы не больше 23, минуты не больше 59. Ни списков, ни
        // подсказок браузера — на площадке это только мешает
        container.querySelectorAll('.ad-sched-time').forEach(function(поле) {
            поле.addEventListener('focus', function() { поле.select(); });

            поле.addEventListener('input', function() {
                var цифры = поле.value.replace(/\D/g, '').slice(0, 4);
                if (цифры.length >= 1) {
                    // Первая цифра больше двух — это сразу час: 9 → 09
                    if (Number(цифры[0]) > 2) цифры = '0' + цифры.slice(0, 3);
                }
                if (цифры.length >= 2 && Number(цифры.slice(0, 2)) > 23) цифры = '23' + цифры.slice(2);
                if (цифры.length >= 4 && Number(цифры.slice(2, 4)) > 59) цифры = цифры.slice(0, 2) + '59';
                поле.value = цифры.length > 2 ? цифры.slice(0, 2) + ':' + цифры.slice(2) : цифры;
            });

            поле.addEventListener('blur', function() {
                var цифры = поле.value.replace(/\D/g, '');
                if (!цифры) { поле.value = ''; return; }
                // Одна цифра — это час: «9» значит 09:00, а не 90-й час
                if (цифры.length === 1) цифры = '0' + цифры;
                while (цифры.length < 4) цифры += '0';
                var ч = Math.min(23, Number(цифры.slice(0, 2)));
                var м = Math.min(59, Number(цифры.slice(2, 4)));
                поле.value = ('0' + ч).slice(-2) + ':' + ('0' + м).slice(-2);
            });
        });

        // Кнопка сохранения оживает от правки времени или корта. Стрелки и
        // статус пишутся в базу сразу — им сохранение не нужно
        container.querySelectorAll('.ad-sched-time, .ad-sched-court').forEach(function(поле) {
            var оживить = function() {
                var кн = document.getElementById('adSchedSave');
                if (кн) кн.disabled = false;
                // Пока правки не сохранены, звать нельзя: людям уйдёт время и
                // корт из базы, а на экране у ведущего уже другие
                container.querySelectorAll('.ad-call-ready, .ad-call-go').forEach(function(б) {
                    б.disabled = true;
                });
            };
            поле.addEventListener('input', оживить);
            поле.addEventListener('change', оживить);
        });

        // ---- Schedule notify handler ----
        var notifySchedBtn = document.getElementById('adSchedNotify');
        if (notifySchedBtn) {
            notifySchedBtn.addEventListener('click', function() {
                // Разослать несохранённое расписание — значит разослать то,
                // чего в базе нет: людям придёт одно, а на площадке другое
                var кнС = document.getElementById('adSchedSave');
                if (кнС && !кнС.disabled) {
                    A.showToast(L.schedSaveFirst, 'warning');
                    return;
                }
                var уже = notifySchedBtn.dataset.sent
                    ? '<p style="margin:0 0 8px;">' + L.schedNotifiedAt + ' ' +
                      A.esc(notifySchedBtn.dataset.sent) + '</p>' : '';
                A.showConfirm(L.schedNotifyConfirm, уже, async function() {
                    notifySchedBtn.disabled = true;
                    notifySchedBtn.textContent = '📢 ...';
                    try {
                        var session = await A.client.auth.getSession();
                        var token = session.data.session ? session.data.session.access_token : '';
                        var res = await fetch(SUPABASE_URL + '/functions/v1/match-notify', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/json',
                                'apikey': SUPABASE_ANON_KEY
                            },
                            body: JSON.stringify({ tournament_id: tournamentId })
                        });
                        var result = await res.json();
                        if (!res.ok) {
                            throw new Error(result.error || 'HTTP ' + res.status);
                        }
                        if (result.sent === 0 && result.noTelegram > 0) {
                            A.showToast(L.schedNotifyNone, 'warning');
                        } else {
                            A.showToast(L.schedNotifySent + ' (' + result.sent + ')', 'success');
                        }
                        // Отметка не записалась — дата пропадёт при обновлении
                        // страницы, и лучше узнать об этом сразу
                        if (result.saved === false) {
                            A.showToast('Отметка о рассылке не сохранилась: ' +
                                (result.save_error || '—'), 'warning');
                        }

                        // Кнопка остаётся живой: расписание меняется, и повтор нужен
                        var отправлено = датаВремя(result.at || new Date().toISOString());
                        notifySchedBtn.dataset.sent = отправлено;
                        notifySchedBtn.disabled = false;
                        notifySchedBtn.textContent = '📢 ' + L.schedNotify;
                        var подпись = notifySchedBtn.parentNode.querySelector('.ad-sched-sent');
                        if (!подпись) {
                            подпись = document.createElement('span');
                            подпись.className = 'ad-sched-sent';
                            notifySchedBtn.parentNode.insertBefore(подпись, notifySchedBtn);
                        }
                        подпись.textContent = L.schedNotifiedAt + ' ' + отправлено;
                    } catch (err) {
                        A.showToast(err.message || 'Error', 'error');
                        notifySchedBtn.disabled = false;
                        notifySchedBtn.textContent = '📢 ' + L.schedNotify;
                    }
                }, '📢 ' + L.schedNotify);
            });
        }

        // ---- Recalculate points button ----
        var recalcBtn = document.getElementById('adBrkRecalcPoints');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', async function() {
                this.disabled = true;
                this.textContent = isEn ? 'Recalculating...' : 'Пересчёт...';
                try {
                    // Reload fresh tournament (in case level was changed)
                    var freshTrn = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
                    var trn = freshTrn.data || tournament;
                    // Reload fresh matches
                    var freshM = await A.client.from('matches').select('*')
                        .eq('tournament_id', tournamentId)
                        .order('round_number').order('match_order');
                    var freshMatches = freshM.data || [];
                    // Reload fresh players map
                    var pIds = [];
                    freshMatches.forEach(function(m) {
                        if (m.player1_id && pIds.indexOf(m.player1_id) === -1) pIds.push(m.player1_id);
                        if (m.player2_id && pIds.indexOf(m.player2_id) === -1) pIds.push(m.player2_id);
                    });
                    var freshPM = {};
                    if (pIds.length) {
                        var plR = await A.client.from('players').select('id, name, name_en, points, category_id').in('id', pIds);
                        (plR.data || []).forEach(function(p) { freshPM[p.id] = p; });
                    }
                    if (trn.bracket_type === 'group_league') {
                        await finalizeGroupLeagueTournament(trn, freshMatches, freshPM);
                    } else if (trn.bracket_type === 'round_robin') {
                        await finalizeGroupTournament(trn, freshMatches, freshPM);
                    } else {
                        await finalizeTournament(trn, freshMatches, freshPM);
                    }
                    renderBracketManagement(tournamentId, 'results');
                } catch (err) {
                    A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
                    var btn = document.getElementById('adBrkRecalcPoints');
                    if (btn) { btn.disabled = false; btn.textContent = isEn ? 'Recalculate Points' : 'Пересчитать очки'; }
                }
            });
        }

        // ---- Floating action bar for registration removal ----
        var floatingBar = document.createElement('div');
        floatingBar.className = 'ad-reg-floating-bar';
        floatingBar.style.display = 'none';
        floatingBar.innerHTML =
            '<span class="ad-reg-floating-count"></span>' +
            '<button class="ad-btn ad-btn-sm ad-btn-danger ad-reg-floating-remove">' + L.regRemoveSelected + '</button>';
        document.body.appendChild(floatingBar);

        function updateFloatingBar() {
            var allChecked = container.querySelectorAll('.ad-reg-check:checked');
            if (allChecked.length > 0) {
                floatingBar.style.display = '';
                floatingBar.querySelector('.ad-reg-floating-count').textContent =
                    (isEn ? 'Selected: ' : 'Выбрано: ') + allChecked.length;
                floatingBar.querySelector('.ad-reg-floating-remove').textContent =
                    L.regRemoveSelected + ' (' + allChecked.length + ')';
            } else {
                floatingBar.style.display = 'none';
            }
        }

        // Cleanup floating bar when leaving this view
        var origCleanup = container._cleanupFloatingBar;
        if (origCleanup) origCleanup();
        container._cleanupFloatingBar = function() { floatingBar.remove(); };

        // Registration checkboxes: select all
        container.querySelectorAll('.ad-reg-check-all').forEach(function(allCb) {
            allCb.addEventListener('change', function() {
                var group = allCb.dataset.group;
                container.querySelectorAll('.ad-reg-check[data-group="' + group + '"]').forEach(function(cb) {
                    cb.checked = allCb.checked;
                });
                updateFloatingBar();
            });
        });

        // Registration checkboxes: individual toggle
        container.querySelectorAll('.ad-reg-check').forEach(function(cb) {
            cb.addEventListener('change', function() {
                updateFloatingBar();
            });
        });

        // Waitlist: approve (move to main) buttons
        container.querySelectorAll('.ad-btn-approve').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                btn.disabled = true;
                await A.client.from('tournament_registrations').update({ status: 'approved' }).eq('id', regId);
                await сообщитьОЗаявке(regId, 'draw');
                A.showToast(L.regMovedToMain);
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // Waitlist: reject buttons
        container.querySelectorAll('.ad-btn-reject').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                btn.disabled = true;
                await A.client.from('tournament_registrations').update({ status: 'rejected' }).eq('id', regId);
                await сообщитьОЗаявке(regId, 'rejected');

                // Отказать можно и тому, кто стоял в сетке: место освободилось,
                // и первый из очереди занимает его сам
                await поднятьИзОчереди(tournamentId);

                A.showToast(L.regRejected);
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // Main draw: move to waitlist buttons
        container.querySelectorAll('.ad-btn-to-waitlist').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                btn.disabled = true;
                await A.client.from('tournament_registrations').update({ status: 'waitlist' }).eq('id', regId);
                await сообщитьОЗаявке(regId, 'waitlist');

                // Место освободилось — первый из очереди занимает его сам.
                // Раньше место просто повисало, и лист ожидания стоял, пока
                // менеджер не вспоминал поднять кого-то руками
                await поднятьИзОчереди(tournamentId);

                A.showToast(L.regMovedToWaitlist);
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // ---- Вернуть заявку в турнир ----
        //
        // Отказ бывает ошибочным, и до сих пор исправить его было нечем: и
        // отклонённые, и снятые оставались вне игры навсегда. Возвращаем со
        // своим прежним временем подачи — очередь не переписываем.
        //
        // Куда вернётся, решают места: свободно — в основную сетку, занято —
        // в лист ожидания. Отдать чужое место было бы нечестно.
        container.querySelectorAll('.ad-btn-restore').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                btn.disabled = true;

                var куда = (await естьМесто(tournamentId)) ? 'approved' : 'waitlist';
                var r = await A.client.from('tournament_registrations')
                    .update({ status: куда }).eq('id', regId);
                if (r.error) { A.showToast(r.error.message, 'error'); btn.disabled = false; return; }

                await сообщитьОЗаявке(regId, куда === 'approved' ? 'draw' : 'waitlist');
                A.showToast(куда === 'approved' ? L.regRestoredDraw : L.regRestoredWait, 'success');
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // Add External Participant button
        var extBtn = document.getElementById('adBrkAddExternal');
        if (extBtn) {
            extBtn.addEventListener('click', function() {
                var modalHtml =
                    '<div style="display:flex;flex-direction:column;gap:12px;min-width:300px;">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.regExternalName + ' *</label>' +
                            '<input type="text" class="ad-field-input" id="adExtName" placeholder="' + (isEn ? 'John Smith' : 'Иванов Иван') + '">' +
                        '</div>' +
                        '<div style="display:flex;gap:12px;">' +
                            '<div class="ad-field" style="flex:1;">' +
                                '<label class="ad-field-label">' + L.regExternalCountry + '</label>' +
                                '<input type="text" class="ad-field-input" id="adExtCountry" placeholder="🇰🇬" style="font-size:1.3rem;text-align:center;">' +
                            '</div>' +
                            '<div class="ad-field" style="flex:1;">' +
                                '<label class="ad-field-label">' + L.regExternalNtrp + '</label>' +
                                '<input type="number" class="ad-field-input" id="adExtNtrp" min="1.0" max="7.0" step="0.5" placeholder="3.0">' +
                            '</div>' +
                        '</div>' +
                        (isDbl ? (
                        '<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0;">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.doublesExtPartnerName + '</label>' +
                            '<input type="text" class="ad-field-input" id="adExtPartnerName" placeholder="' + (isEn ? 'Partner Name' : 'Имя партнёра') + '">' +
                        '</div>' +
                        '<div style="display:flex;gap:12px;">' +
                            '<div class="ad-field" style="flex:1;">' +
                                '<label class="ad-field-label">' + L.doublesExtPartnerNtrp + '</label>' +
                                '<input type="number" class="ad-field-input" id="adExtPartnerNtrp" min="1.0" max="7.0" step="0.5" placeholder="3.0">' +
                            '</div>' +
                            '<div class="ad-field" style="flex:1;">' +
                                '<label class="ad-field-label">' + L.doublesExtPartnerGender + '</label>' +
                                '<select class="ad-field-input" id="adExtPartnerGender">' +
                                    '<option value="">—</option>' +
                                    '<option value="men">' + L.genderMen + '</option>' +
                                    '<option value="women">' + L.genderWomen + '</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>'
                        ) : '') +
                    '</div>';
                A.showConfirm(L.regAddExternal, modalHtml, async function() {
                    var extName = document.getElementById('adExtName').value.trim();
                    if (!extName) { A.showToast(isEn ? 'Name is required' : 'Имя обязательно', 'error'); return; }
                    var extCountry = document.getElementById('adExtCountry').value.trim() || null;
                    var extNtrp = parseFloat(document.getElementById('adExtNtrp').value) || null;

                    var insertData = {
                        tournament_id: tournamentId,
                        player_id: null,
                        is_external: true,
                        external_name: extName,
                        external_country: extCountry,
                        external_ntrp: extNtrp,
                        status: 'approved'
                    };

                    // Doubles: add partner fields
                    if (isDbl) {
                        var partnerNameEl = document.getElementById('adExtPartnerName');
                        var partnerNtrpEl = document.getElementById('adExtPartnerNtrp');
                        var partnerGenderEl = document.getElementById('adExtPartnerGender');
                        if (partnerNameEl && partnerNameEl.value.trim()) {
                            insertData.partner_external_name = partnerNameEl.value.trim();
                            insertData.partner_external_ntrp = partnerNtrpEl ? (parseFloat(partnerNtrpEl.value) || null) : null;
                            insertData.partner_gender = partnerGenderEl ? (partnerGenderEl.value || null) : null;

                            // NTRP combined check
                            if (tournament.ntrp_combined_max && extNtrp && insertData.partner_external_ntrp) {
                                if (!validateNtrpCombined(extNtrp, insertData.partner_external_ntrp, tournament.ntrp_combined_max)) {
                                    A.showToast(L.doublesNtrpCombinedError + ': ' +
                                        дробь(Number(extNtrp) + Number(insertData.partner_external_ntrp)) + ' \u203A ' +
                                        дробь(tournament.ntrp_combined_max), 'error');
                                    return;
                                }
                            }
                        }
                    }

                    // Мест столько, сколько выставлено в турнире. Сверх этого
                    // заявка не пропадает, а встаёт в лист ожидания
                    var всегоМест = tournament.max_participants || 0;
                    var занято = registrations.filter(function(r) {
                        return r.status === 'approved' || r.status === 'pending' || r.status === 'draw';
                    }).length;
                    var вСетку = !всегоМест || занято < всегоМест;
                    if (!вСетку) insertData.status = 'waitlist';

                    var insRes = await A.client.from('tournament_registrations').insert(insertData);
                    if (insRes.error) { A.showToast(insRes.error.message, 'error'); return; }
                    if (вСетку) {
                        A.showToast(L.regExternalAdded);
                    } else {
                        A.showNotice(L.regWaitlistTitle,
                            '<p style="margin:0;">' + A.esc(extName) + ' \u2014 ' + L.regAddedToWaitlist + '</p>');
                    }
                    renderBracketManagement(tournamentId, 'registrations');
                }, isEn ? 'Add' : 'Добавить');
            });
        }

        // Add from Database button
        var dbBtn = document.getElementById('adBrkAddFromDb');
        if (dbBtn) {
            dbBtn.addEventListener('click', function() {
                // Снятая заявка не считается: строка остаётся в базе со статусом
                // «снят», и раньше из-за неё человека нельзя было вернуть —
                // поиск говорил «уже зарегистрирован»
                var живые = registrations.filter(function(r) {
                    return r.status !== 'withdrawn' && r.status !== 'rejected';
                });
                var existingIds = живые.map(function(r) { return r.player_id; }).filter(Boolean);
                var снятые = {};
                registrations.forEach(function(r) {
                    if (r.player_id && (r.status === 'withdrawn' || r.status === 'rejected')) {
                        снятые[r.player_id] = r.id;
                    }
                });
                // Мужской или женский турнир — тогда чужой пол подсвечиваем и
                // спрашиваем подтверждение. В миксте оба пола свои
                var полТурнира = (tournament.gender === 'men' || tournament.gender === 'women')
                    ? tournament.gender : null;

                // Create modal overlay
                var overlay = document.createElement('div');
                overlay.className = 'ad-confirm-overlay';
                overlay.innerHTML =
                    '<div class="ad-confirm-modal" style="min-width:380px;">' +
                        '<div class="ad-confirm-title">' + L.regAddFromDb + '</div>' +
                        '<div class="ad-confirm-text" style="text-align:left;">' +
                            '<input type="text" class="ad-field-input" id="adDbSearchInput" placeholder="' + L.regSearchPlayer + '">' +
                            '<div id="adDbSearchResults" style="max-height:300px;overflow-y:auto;margin-top:12px;"></div>' +
                        '</div>' +
                        '<div class="ad-confirm-actions">' +
                            '<button class="ad-btn ad-btn-secondary" id="adDbClose">' + L.cancel + '</button>' +
                        '</div>' +
                    '</div>';
                document.body.appendChild(overlay);

                var добавлено = 0;

                // Мест столько, сколько выставлено в турнире. Сверх этого
                // заявка не пропадает, а становится в лист ожидания — так же,
                // как при подаче с сайта
                function местоЕсть() {
                    var всего = tournament.max_participants || 0;
                    if (!всего) return true;
                    var занято = живые.filter(function(r) {
                        return r.status === 'approved' || r.status === 'pending' || r.status === 'draw';
                    }).length + добавлено;
                    return занято < всего;
                }

                var searchInput = document.getElementById('adDbSearchInput');
                var resultsDiv = document.getElementById('adDbSearchResults');
                var debounceTimer = null;
                var addedAny = false;

                function closeModal() {
                    overlay.remove();
                    if (addedAny) renderBracketManagement(tournamentId, 'registrations');
                }
                document.getElementById('adDbClose').addEventListener('click', closeModal);
                overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
                searchInput.focus();

                searchInput.addEventListener('input', function() {
                    clearTimeout(debounceTimer);
                    var q = searchInput.value.trim();
                    if (q.length < 2) { resultsDiv.innerHTML = ''; return; }
                    debounceTimer = setTimeout(async function() {
                        var res = await A.client.from('players')
                            .select('id, name, name_en, photo, category_id, ntrp_singles, gender')
                            .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
                            .limit(10);
                        var players = res.data || [];
                        if (players.length === 0) {
                            resultsDiv.innerHTML = '<div style="color:var(--text-secondary);padding:12px;text-align:center;">' +
                                (isEn ? 'No players found' : 'Игроки не найдены') + '</div>';
                            return;
                        }
                        var html = '';
                        players.forEach(function(p) {
                            var alreadyIn = existingIds.indexOf(p.id) !== -1;
                            var catLabel = p.category_id ? p.category_id.charAt(0).toUpperCase() + p.category_id.slice(1) : '—';
                            var ntrpLabel = p.ntrp_singles ? ('NTRP ' + p.ntrp_singles) : '';
                            // Пол показываем всегда: раньше менеджер не видел,
                            // кого добавляет, и женщина уходила в мужской турнир
                            var полLabel = p.gender === 'women' ? L.genderWomen
                                : (p.gender === 'men' ? L.genderMen : '');
                            var чужой = полТурнира && p.gender && p.gender !== полТурнира;
                            var photoHtml = p.photo
                                ? '<img src="' + A.esc(p.photo) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
                                : '<div style="width:32px;height:32px;border-radius:50%;background:var(--card-bg);display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:14px;">—</div>';
                            var nameDisplay = isEn ? (p.name_en || p.name) : p.name;
                            html += '<div data-player-id="' + p.id + '" data-gender="' + (p.gender || '') + '" data-player-name="' + A.esc(nameDisplay) + '" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:' + (alreadyIn ? 'default' : 'pointer') + ';opacity:' + (alreadyIn ? '0.5' : '1') + ';" ' + (alreadyIn ? '' : 'data-can-add="1"') + '>' +
                                photoHtml +
                                '<div style="flex:1;">' +
                                    '<div style="font-weight:500;color:var(--text-primary);">' + A.esc(nameDisplay) + '</div>' +
                                    '<div style="font-size:0.8rem;color:' + (чужой ? '#ffb300' : 'var(--text-secondary)') + ';">' +
                                        (полLabel ? полLabel + ' · ' : '') + catLabel + (ntrpLabel ? ' · ' + ntrpLabel : '') + '</div>' +
                                '</div>' +
                                (alreadyIn ? '<span style="font-size:0.75rem;color:var(--accent);">' + L.regAlreadyRegistered + '</span>' : '') +
                            '</div>';
                        });
                        resultsDiv.innerHTML = html;

                        // Click handlers for results
                        resultsDiv.querySelectorAll('[data-can-add="1"]').forEach(function(row) {
                            row.addEventListener('mouseenter', function() { row.style.background = 'rgba(255,255,255,0.05)'; });
                            row.addEventListener('mouseleave', function() { row.style.background = ''; });
                            row.addEventListener('click', function() {
                                var playerId = row.dataset.playerId;
                                var пол = row.dataset.gender;


                                // Чужой пол — спрашиваем нашим окном, а не
                                // системным: то и выглядит чужим, и имя в нём
                                // терялось
                                if (полТурнира && пол && пол !== полТурнира) {
                                    var имя = row.dataset.playerName || '';
                                    A.showConfirm(L.regGenderWarnTitle,
                                        '<p style="margin:0;">' + A.esc(имя) + ' — ' +
                                        (пол === 'women' ? L.genderWomen : L.genderMen) + '. ' +
                                        L.regGenderWarn + '</p>',
                                        function() { добавить(); }, L.regGenderWarnOk);
                                    return;
                                }
                                добавить();
                            });

                            async function добавить() {
                                var playerId = row.dataset.playerId;
                                row.style.opacity = '0.5';
                                row.style.pointerEvents = 'none';
                                // Был снят — возвращаем прежнюю строку: вставка
                                // упёрлась бы в запрет повторной заявки
                                var вСетку = местоЕсть();
                                var insRes = снятые[playerId]
                                    ? await A.client.from('tournament_registrations').update({
                                        status: вСетку ? 'approved' : 'waitlist',
                                        group_number: null,
                                        seed_number: null,
                                        draw_position: null,
                                        // Возвращается один человек, а не прежняя
                                        // пара: напарника он подберёт заново
                                        partner_id: null,
                                        partner_external_name: null,
                                        partner_external_ntrp: null,
                                        partner_gender: null,
                                        registered_at: new Date().toISOString()
                                    }).eq('id', снятые[playerId])
                                    : await A.client.from('tournament_registrations').insert({
                                        tournament_id: tournamentId,
                                        player_id: playerId,
                                        status: вСетку ? 'approved' : 'waitlist'
                                    });
                                if (insRes.error) {
                                    A.showToast(insRes.error.message, 'error');
                                    row.style.opacity = '1';
                                    row.style.pointerEvents = '';
                                    return;
                                }
                                existingIds.push(playerId);
                                добавлено++;
                                addedAny = true;
                                if (вСетку) {
                                    A.showToast(isEn ? 'Player added' : 'Игрок добавлен');
                                } else {
                                    // Лист ожидания — новость не мимолётная,
                                    // показываем окном, а не всплывашкой. Окно
                                    // поиска закрываем само: два окна разом не
                                    // живут, и второе снесло бы первое рывком
                                    overlay.remove();
                                    A.showNotice(L.regWaitlistTitle,
                                        '<p style="margin:0;">' + A.esc(row.dataset.playerName || '') +
                                        ' \u2014 ' + L.regAddedToWaitlist + '</p>');
                                }
                                // Список под окном перерисовываем сразу: раньше
                                // изменения были видны только после перезагрузки
                                renderBracketManagement(tournamentId, 'registrations');
                                row.removeAttribute('data-can-add');
                                row.querySelector('[style*="flex:1"]').insertAdjacentHTML('afterend',
                                    '<span style="font-size:0.75rem;color:var(--accent);">' + L.regAlreadyRegistered + '</span>');
                            }
                        });
                    }, 300);
                });
            });
        }

        // ---- Гость в паре: подтвердить или убрать ----
        container.querySelectorAll('.ad-btn-guest-ok').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                btn.disabled = true;
                var r = await A.client.from('tournament_registrations')
                    .update({ guest_confirmed: true }).eq('id', btn.dataset.regId);
                if (r.error) { A.showToast(r.error.message, 'error'); btn.disabled = false; return; }
                await сообщитьОЗаявке(btn.dataset.regId, 'guest_ok');
                A.showToast(L.regGuestConfirmed, 'success');
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        container.querySelectorAll('.ad-btn-guest-drop').forEach(function(btn) {
            btn.addEventListener('click', function() {
                A.showConfirm(L.regGuestDrop, '<p style="margin:0;">' + L.regGuestDropHint + '</p>',
                    async function() {
                        var r = await A.client.from('tournament_registrations').update({
                            partner_external_name: null,
                            partner_external_ntrp: null,
                            partner_gender: null,
                            guest_confirmed: false
                        }).eq('id', btn.dataset.regId);
                        if (r.error) { A.showToast(r.error.message, 'error'); return; }
                        await сообщитьОЗаявке(btn.dataset.regId, 'guest_removed');
                        A.showToast(L.regGuestDropped, 'success');
                        renderBracketManagement(tournamentId, 'registrations');
                    }, L.regGuestDropShort);
            });
        });

        // ---- Посев руками ----
        //
        // Один номер — одна заявка. Если номер занят, меняем владельцев
        // местами: менеджер обычно и хочет «сделать эту пару первой», а не
        // получить двух первых
        container.querySelectorAll('.ad-reg-seed').forEach(function(поле) {
            поле.addEventListener('change', async function() {
                var regId = поле.dataset.regId;
                var номер = поле.value ? Number(поле.value) : null;
                поле.disabled = true;

                var ответ = await A.client.from('tournament_registrations')
                    .update({ seed_number: номер }).eq('id', regId);
                if (ответ.error) {
                    A.showToast(ответ.error.message, 'error');
                    поле.disabled = false;
                    return;
                }
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // Floating bar: remove button
        floatingBar.querySelector('.ad-reg-floating-remove').addEventListener('click', function() {
            var checked = container.querySelectorAll('.ad-reg-check:checked');
            if (checked.length === 0) return;

            var ids = [];
            var names = [];
            checked.forEach(function(cb) {
                ids.push(cb.dataset.regId);
                names.push(cb.dataset.playerName || '—');
            });

            var namesList = names.map(function(n) { return '• ' + n; }).join('<br>');
            var confirmText = '<div style="text-align:left;margin-top:8px;max-height:200px;overflow-y:auto;font-size:0.9rem;line-height:1.6;">' + namesList + '</div>';

            A.showConfirm(L.regRemoveConfirm, confirmText, async function() {
                await removeRegistrations(ids, tournamentId);
                floatingBar.remove();
                renderBracketManagement(tournamentId, 'registrations');
            }, L.regRemoveSelected);
        });

        // Кнопка «вписать парный рейтинг» в клетке NTRP
        container.querySelectorAll('.ad-ntrp-fix').forEach(function(btn) {
            btn.addEventListener('click', function() {
                открытьОкноПарного(btn.dataset.playerId, btn.dataset.playerName,
                                   btn.dataset.singles, tournamentId);
            });
        });

        // Add Partner buttons (doubles only)
        if (isDbl) {
            container.querySelectorAll('.ad-btn-add-partner').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var regId = btn.dataset.regId;
                    openPartnerModal(regId, tournament, tournamentId, registrations);
                });
            });
        }

        // Replace player buttons
        container.querySelectorAll('.ad-btn-replace').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var regId = btn.dataset.regId;
                if (isDbl) {
                    // Doubles: ask who to replace
                    var reg = registrations.find(function(r) { return r.id === regId; });
                    var hasPartner = reg && (reg.partner_id || reg.partner_external_name);
                    if (hasPartner) {
                        // Show choice modal: main player or partner
                        var choiceOverlay = document.createElement('div');
                        choiceOverlay.className = 'ad-confirm-overlay';
                        choiceOverlay.innerHTML =
                            '<div class="ad-confirm-modal">' +
                                '<div class="ad-confirm-title">' + L.regReplaceWho + '</div>' +
                                // Игроки рядом, пара — отдельной строкой снизу:
                                // это выбор другого уровня, а не третий игрок
                                '<div class="ad-replace-who">' +
                                    '<div class="ad-replace-who-row">' +
                                        '<button class="ad-btn ad-btn-secondary" id="adReplaceMainBtn">' +
                                            A.esc(имяСтороны(reg, 'player', playersMap)) + '</button>' +
                                        '<button class="ad-btn ad-btn-secondary" id="adReplacePartnerBtn">' +
                                            A.esc(имяСтороны(reg, 'partner', playersMap)) + '</button>' +
                                    '</div>' +
                                    '<button class="ad-btn ad-btn-primary" id="adReplacePairBtn">' +
                                        L.regReplacePair + '</button>' +
                                '</div>' +
                            '</div>';
                        document.body.appendChild(choiceOverlay);
                        choiceOverlay.addEventListener('click', function(e) { if (e.target === choiceOverlay) choiceOverlay.remove(); });
                        document.getElementById('adReplaceMainBtn').addEventListener('click', function() {
                            choiceOverlay.remove();
                            openReplaceModal(regId, 'player', tournament, tournamentId, registrations, playersMap);
                        });
                        document.getElementById('adReplacePairBtn').addEventListener('click', function() {
                            choiceOverlay.remove();
                            openReplacePairModal(regId, tournament, tournamentId, registrations, playersMap);
                        });
                        document.getElementById('adReplacePartnerBtn').addEventListener('click', function() {
                            choiceOverlay.remove();
                            openReplaceModal(regId, 'partner', tournament, tournamentId, registrations, playersMap);
                        });
                    } else {
                        // No partner yet — replace main player
                        openReplaceModal(regId, 'player', tournament, tournamentId, registrations, playersMap);
                    }
                } else {
                    // Singles: replace main player directly
                    openReplaceModal(regId, 'player', tournament, tournamentId, registrations, playersMap);
                }
            });
        });

        // Generate draw button
        var genBtn = document.getElementById('adBrkGenerateDraw');
        if (genBtn) {
            genBtn.addEventListener('click', function() {
                A.showConfirm(L.generateDrawConfirm, '', async function() {
                    // Пока идёт жеребьёвка, кнопку гасим и подписываем: запрос
                    // не мгновенный, и второе нажатие успевало уйти в базу
                    genBtn.disabled = true;
                    genBtn.textContent = L.drawRunning;
                    await generateBracketDraw(tournament, registrations, playersMap);
                    renderBracketManagement(tournamentId);
                }, L.generateDraw);
            });
        }

        // Score entry buttons
        container.querySelectorAll('[data-match-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var matchId = btn.dataset.matchEdit;
                var match = matches.find(function(m) { return m.id === matchId; });
                if (match) {
                    var rowPlayer = btn.dataset.rowPlayer || null;
                    openScoreModal(match, playersMap, tournamentId, rowPlayer, isDbl, regsMap, tournament.set_format);
                }
            });
        });

        // Проход без игры: отмечаем победителем того, кто есть, и база
        // сама уводит его в следующий круг.
        container.querySelectorAll('[data-match-bye]').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var matchId = btn.dataset.matchBye;
                var match = matches.find(function(m) { return m.id === matchId; });
                if (!match) return;
                var кто = match.player1_id || match.player2_id;
                if (!кто) return;
                btn.disabled = true;
                var r = await A.client.from('matches').update({
                    winner_id: кто,
                    score: 'BYE',
                    status: 'completed',
                    played_at: new Date().toISOString()
                }).eq('id', matchId);
                if (r.error) {
                    btn.disabled = false;
                    A.showToast(r.error.message, 'error');
                    return;
                }
                A.showToast(isEn ? 'Advanced' : 'Проведён дальше', 'success');
                renderBracketManagement(tournamentId, 'bracket');
            });
        });

        // Снятие результата: матч возвращается в «не сыгран»
        container.querySelectorAll('[data-match-clear]').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var matchId = btn.dataset.matchClear;
                var этот = matches.find(function(m) { return m.id === matchId; });
                if (групповой(этот)) {
                    // В группе снимаем результат прямо у матча: зависимых нет
                    btn.disabled = true;
                    var сн = await A.client.from('matches').update({
                        winner_id: null, score: null, status: 'upcoming', played_at: null
                    }).eq('id', matchId);
                    if (сн.error) { btn.disabled = false; A.showToast(сн.error.message, 'error'); return; }
                    renderBracketManagement(tournamentId, 'bracket');
                    return;
                }
                var зависимые = await затронутыеМатчи(matchId);
                if (зависимые === null) return;
                var согласен = await спроситьПравку(зависимые,
                    isEn ? 'Clearing the result' : 'Снятие результата');
                if (!согласен) return;
                btn.disabled = true;
                var пр = await A.client.rpc('fic_правка', {
                    p_матч: matchId, p_победитель: null, p_счёт: null
                });
                if (пр.error) {
                    btn.disabled = false;
                    A.showToast(пр.error.message, 'error');
                    return;
                }
                предложитьОткат(tournamentId, (пр.data && пр.data.затронуто) || 0);
            });
        });

        // Отмена прохода: клетку открываем заново и пересобираем сетку по
        // настоящим счетам — иначе тот, кого уже провели дальше, останется
        // стоять в следующем круге.
        container.querySelectorAll('[data-match-unbye]').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var matchId = btn.dataset.matchUnbye;
                btn.disabled = true;
                var r = await A.client.from('matches').update({
                    winner_id: null, score: null, status: 'upcoming', played_at: null
                }).eq('id', matchId);
                if (r.error) {
                    btn.disabled = false;
                    A.showToast(r.error.message, 'error');
                    return;
                }
                var п = await A.client.rpc('fic_пересобрать', { p_турнир: tournamentId });
                if (п.error) {
                    A.showToast(п.error.message, 'error');
                    return;
                }
                A.showToast(isEn ? 'Undone' : 'Проход отменён', 'success');
                renderBracketManagement(tournamentId, 'bracket');
            });
        });

        // Manual group place selects
        container.querySelectorAll('.ad-grp-place-select').forEach(function(sel) {
            sel.addEventListener('change', async function() {
                var groupNum = sel.dataset.group;
                var playerId = sel.dataset.player;
                var newPlace = parseInt(sel.value, 10);

                // Load current manual_group_places
                var mgp = JSON.parse(JSON.stringify(tournament.manual_group_places || {}));
                if (!mgp[groupNum]) mgp[groupNum] = {};

                // Find other tied player who currently has this place and swap
                var oldPlace = null;
                // Get all selects for this group
                var groupSelects = container.querySelectorAll('.ad-grp-place-select[data-group="' + groupNum + '"]');
                groupSelects.forEach(function(gs) {
                    if (gs.dataset.player !== playerId && parseInt(gs.value, 10) === newPlace) {
                        // This player currently has the place we want — find our old place to swap
                        oldPlace = mgp[groupNum][playerId] || null;
                    }
                });

                // Get current place of the player before change (from other selects' perspective)
                var currentPlaces = {};
                groupSelects.forEach(function(gs) {
                    currentPlaces[gs.dataset.player] = parseInt(gs.value, 10);
                });
                // The old place of current player (before this change)
                var prevPlace = currentPlaces[playerId];
                // Overwrite: set new place for this player, swap with whoever had it
                mgp[groupNum][playerId] = newPlace;
                groupSelects.forEach(function(gs) {
                    if (gs.dataset.player !== playerId && parseInt(gs.value, 10) === newPlace) {
                        mgp[groupNum][gs.dataset.player] = prevPlace;
                    }
                });

                // Save to DB
                var { error } = await A.client.from('tournaments')
                    .update({ manual_group_places: mgp })
                    .eq('id', tournament.id);
                if (error) {
                    A.showToast(error.message, 'error');
                } else {
                    tournament.manual_group_places = mgp;
                    A.showToast(L.tiedPlaceSaved, 'success');
                    renderBracketManagement(tournamentId, 'bracket');
                }
            });
        });

        // Regenerate draw button
        var regenBtn = document.getElementById('adBrkRegenerate');
        if (regenBtn) {
            regenBtn.addEventListener('click', function() {
                A.showConfirm(L.regenerateConfirm, '', async function() {
                    regenBtn.disabled = true;
                    regenBtn.textContent = L.drawRunning;
                    await regenerateDraw(tournament, tournamentId);
                }, L.regenerateDraw);
            });
        }

        // Playoff Format choice button (groups done, no IG yet)
        var formatBtn = document.getElementById('adBrkPlayoffFormat');
        if (formatBtn) {
            formatBtn.addEventListener('click', function() {
                showPlayoffFormatModal(tournament, matches, playersMap, tournamentId);
            });
        }

        // Generate Leagues button (group_league type)
        var genLeaguesBtn = document.getElementById('adBrkGenLeagues');
        if (genLeaguesBtn) {
            genLeaguesBtn.addEventListener('click', function() {
                A.showConfirm(L.generateLeaguesConfirm, '', async function() {
                    await generateLeaguePlayoffs(tournament, matches, playersMap);
                    renderBracketManagement(tournamentId, 'bracket');
                }, L.generateLeagues);
            });
        }

        // Generate Playoff button (after IG or direct)
        var genPlayoffBtn = document.getElementById('adBrkGenPlayoff');
        if (genPlayoffBtn) {
            genPlayoffBtn.addEventListener('click', function() {
                A.showConfirm(L.generatePlayoffConfirm, '', async function() {
                    await generatePlayoffDraw(tournament, matches, playersMap);
                    renderBracketManagement(tournamentId, 'bracket');
                }, L.generatePlayoff);
            });
        }

        // Finalize button
        var finBtn = document.getElementById('adBrkFinalize');
        if (finBtn) {
            finBtn.addEventListener('click', function() {
                A.showConfirm(L.finalizeConfirm, '', async function() {
                    // Подсчёт очков идёт несколько секунд, и всё это время
                    // кнопка оставалась живой: второе нажатие запускало счёт
                    // заново поверх первого.
                    finBtn.disabled = true;
                    finBtn.textContent = isEn ? 'Counting points…' : 'Считаю очки…';
                    try {
                        await finalizeTournament(tournament, matches, playersMap);
                    } catch (e) {
                        finBtn.disabled = false;
                        finBtn.textContent = L.finalizeTournament;
                        A.showToast(e && e.message ? e.message : String(e), 'error');
                        return;
                    }
                    renderBracketManagement(tournamentId);
                }, L.finalizeTournament);
            });
        }

        // Recalculate points button (for completed tournaments)
        var recalcBtn = document.getElementById('adBrkRecalc');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', async function() {
                recalcBtn.disabled = true;
                recalcBtn.textContent = isEn ? 'Recalculating...' : 'Пересчёт...';
                // Reload fresh matches from DB before recalculating
                var freshRes = await A.client.from('matches').select('*')
                    .eq('tournament_id', tournamentId)
                    .order('round_number', { ascending: true })
                    .order('match_order', { ascending: true });
                var freshMatches = freshRes.data || matches;
                await finalizeTournament(tournament, freshMatches, playersMap);
                renderBracketManagement(tournamentId);
            });
        }

        // История замен: кого на кого меняли в этом турнире
        var местоИстории = document.getElementById('adRegChanges');
        if (местоИстории) отрисоватьИсториюЗамен(местоИстории, tournamentId);

        // Async: render X-slot assignment dropdowns if IG path is active
        var xSlotContainer = document.getElementById('adXSlotContainer');
        if (xSlotContainer) {
            renderXSlotSection(xSlotContainer, tournamentId);
        }
    }

    /**
     * История замен в заявках — только для админки.
     *
     * Показываем последние двадцать: кого на кого, когда и кто менял. Пусто —
     * блока нет вовсе, чтобы не занимать место у турниров без замен.
     */
    async function отрисоватьИсториюЗамен(место, tournamentId) {
        var res = await A.client.from('registration_changes')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('created_at', { ascending: false })
            .limit(20);
        var строки = res.data || [];
        if (res.error || !строки.length) { место.innerHTML = ''; return; }

        var ids = [];
        строки.forEach(function(r) {
            if (r.old_player_id) ids.push(r.old_player_id);
            if (r.new_player_id) ids.push(r.new_player_id);
        });
        var кто = {};
        if (ids.length) {
            var plRes = await A.client.from('players').select('id, name').in('id', ids);
            (plRes.data || []).forEach(function(p) { кто[p.id] = p.name; });
        }

        var авторы = {};
        var авторIds = строки.map(function(r) { return r.changed_by; }).filter(Boolean);
        if (авторIds.length) {
            var prRes = await A.client.from('profiles').select('id, full_name').in('id', авторIds);
            (prRes.data || []).forEach(function(p) { авторы[p.id] = p.full_name; });
        }

        var подписьСтороны = {
            player: L.regReplaceMain,
            partner: L.regReplacePartner,
            pair: L.regReplacePair
        };

        var html = '<h3 class="ad-reg-section-title" style="margin-top:24px;">' + L.regChangesTitle +
            ' <span class="ad-badge">' + строки.length + '</span></h3>' +
            '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                '<th style="width:150px;">' + L.regChangesWhen + '</th>' +
                '<th style="width:120px;">' + L.regChangesSide + '</th>' +
                '<th>' + L.regChangesWho + '</th>' +
                '<th style="width:180px;">' + L.regChangesBy + '</th>' +
            '</tr></thead><tbody>';

        строки.forEach(function(r) {
            var было = кто[r.old_player_id] || r.old_name || '\u2014';
            var стало = кто[r.new_player_id] || r.new_name || '\u2014';
            html += '<tr>' +
                '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' +
                    датаВремя(r.created_at) + '</td>' +
                '<td style="font-size:0.8rem;">' + (подписьСтороны[r.side] || r.side) + '</td>' +
                '<td>' + A.esc(было) + ' <span style="color:var(--text-dim);">\u2192</span> ' +
                    '<span style="color:var(--accent);">' + A.esc(стало) + '</span></td>' +
                '<td style="font-size:0.8rem;color:var(--text-secondary);">' +
                    A.esc(авторы[r.changed_by] || '\u2014') + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';
        место.innerHTML = html;
    }

    // ---- Registrations Panel HTML ----
    function renderRegistrationsPanel(tournament, registrations, playersMap, canGenerate, debtPlayerIds, isDbl, regsMap, заморожено) {
        var html = '';
        if (заморожено) {
            html += '<div class="ad-sched-note">' + L.regFrozen + '</div>';
        }
        var maxPart = tournament.max_participants || 16;
        debtPlayerIds = debtPlayerIds || {};

        // Split by status (not overflow)
        // «draw» — заявка, уже попавшая в сетку при жеребьёвке. Это та же
        // основная сетка: без неё раздел «Заявки» оказывался пустым, хотя в
        // счётчике стояло 12 из 12
        var mainDraw = registrations.filter(function(r) {
                return r.status === 'approved' || r.status === 'pending' || r.status === 'draw';
            })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var waitlistRegs = registrations.filter(function(r) { return r.status === 'waitlist'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var rejected = registrations.filter(function(r) { return r.status === 'rejected'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var withdrawn = registrations.filter(function(r) { return r.status === 'withdrawn'; });
        // Заявки, не прошедшие правила допуска. Хранятся ради статистики:
        // сколько человек хотело попасть на турнир и почему не пустили.
        var blocked = registrations.filter(function(r) { return r.status === 'blocked'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });

        // Doubles: warn about unpaired registrations
        if (isDbl) {
            var unpaired = mainDraw.filter(function(r) { return !r.partner_id && !r.partner_external_name; });
            if (unpaired.length > 0) {
                html += '<div class="ad-alert ad-alert-warning" style="margin-bottom:12px;">' +
                    '⚠ ' + L.doublesUnpaired + ' (' + unpaired.length + ')' +
                '</div>';
            }
        }

        // Add buttons will be placed in the Main Draw header row below

        if (mainDraw.length === 0 && waitlistRegs.length === 0 && rejected.length === 0 && withdrawn.length === 0 && blocked.length === 0) {
            html += '<div class="ad-empty-state"><p>' + L.noRegistrations + '</p></div>';
        } else {
            // Посев ставит менеджер руками — колонка есть только там, где это
            // нужно: в рейтинговых турнирах сеет рейтинг, а не человек
            var руками = посевРуками(tournament);
            var норма = нормаСеяных(tournament);
            var thSeed = руками
                ? '<th style="width:78px;text-align:center;">' + L.regSeedCol + '</th>' : '';

            // Какие номера уже разобраны
            var занятыеНомера = {};
            registrations.forEach(function(r) {
                if (r.seed_number) занятыеНомера[Number(r.seed_number)] = true;
            });

            var thCategory = isEn ? 'Category' : 'Категория';
            var thRegTime = isEn ? 'Registered' : 'Регистрация';
            var thActions = isEn ? 'Actions' : 'Действия';
            var regTableHead;
            if (isDbl) {
                // Doubles: # | NTRP | Имя | NTRP | Партнёр | Общий NTRP | Регистрация | Действия
                var thCombinedNtrp = isEn ? 'Total NTRP' : 'Общий NTRP';
                regTableHead = '<th style="width:32px;"><input type="checkbox" class="ad-reg-check-all" data-group="GRP"' + (заморожено ? ' disabled' : '') + '></th>' +
                    '<th style="width:32px;text-align:center;padding:4px 6px;">#</th>' +
                    '<th style="text-align:center;width:50px;">NTRP</th>' +
                    '<th>' + L.plrName + '</th>' +
                    '<th style="text-align:center;width:50px;">NTRP</th>' +
                    '<th>' + L.doublesPartner + '</th>' +
                    '<th style="text-align:center;width:80px;">' + thCombinedNtrp + '</th>' +
                    thSeed +
                    '<th>' + thRegTime + '</th>' +
                    '<th style="width:150px;text-align:center;">' + thActions + '</th>';
            } else {
                // Singles: # | Ранг | Имя | Категория | Регистрация | Действия
                var thRank = isEn ? 'Rank' : 'Ранг';
                regTableHead = '<th style="width:32px;"><input type="checkbox" class="ad-reg-check-all" data-group="GRP"' + (заморожено ? ' disabled' : '') + '></th>' +
                    '<th style="width:32px;text-align:center;padding:4px 6px;">#</th>' +
                    '<th style="width:32px;text-align:center;padding:4px 6px;">' + thRank + '</th>' +
                    '<th>' + L.plrName + '</th>' +
                    '<th>' + thCategory + '</th>' +
                    thSeed +
                    '<th>' + thRegTime + '</th>' +
                    '<th style="width:150px;text-align:center;">' + thActions + '</th>';
            }

            // Overflow warning
            if (mainDraw.length > maxPart) {
                html += '<div class="ad-alert ad-alert-warning" style="margin-bottom:12px;">' +
                    (isEn ? 'Warning: ' : 'Внимание: ') + mainDraw.length + ' ' + L.regCount + ', ' +
                    (isEn ? 'but max participants is ' : 'но макс. участников — ') + maxPart +
                '</div>';
            }

            // Сколько заявок ждут парный рейтинг: менеджер должен вписать
            // его руками, иначе пара считается по одиночному
            if (isDbl) {
                var ждут = {};
                registrations.forEach(function(r) {
                    if (r.status === 'withdrawn') return;
                    [r.player_id, r.partner_id].forEach(function(id) {
                        if (id && playersMap[id] && безПарного(playersMap[id])) ждут[id] = true;
                    });
                });
                var ждутЧисло = Object.keys(ждут).length;
                if (ждутЧисло > 0) {
                    html += '<div style="margin-bottom:12px;padding:10px 14px;border:1px solid rgba(255,179,0,0.35);' +
                        'border-radius:8px;background:rgba(255,179,0,0.08);color:#ffb300;font-size:0.88rem;font-weight:600;">' +
                        '\u26A0 ' + L.dblNtrpNeedTitle + ': ' + ждутЧисло +
                        '<div style="font-weight:400;color:var(--text-secondary);font-size:0.82rem;margin-top:4px;">' +
                        L.dblNtrpNeedHint + '</div></div>';
                }
            }

            // Пары с гостем ждут решения: место за ними держится, но клуб не
            // знает ни рейтинга гостя, ни того, придёт ли он
            var сГостем = registrations.filter(function(r) {
                return r.partner_external_name && !r.guest_confirmed &&
                    r.status !== 'withdrawn' && r.status !== 'rejected';
            });
            if (сГостем.length) {
                html += '<div class="ad-alert ad-alert-warning" style="margin-bottom:12px;">' +
                    '\u26A0 ' + L.regGuestWait + ': ' + сГостем.length +
                    '<div style="font-weight:400;color:var(--text-secondary);font-size:0.82rem;margin-top:4px;">' +
                    L.regGuestWaitHint + '</div></div>';
            }

            // Сколько сеяных уже расставлено. Пока не добрали — жеребьёвка
            // не запустится, и лучше сказать об этом заранее
            if (руками && норма > 0) {
                var расставлено = mainDraw.filter(function(r) { return r.seed_number; }).length;
                var хватает = расставлено >= норма;
                html += '<div class="ad-alert ' + (хватает ? 'ad-alert-info' : 'ad-alert-warning') +
                    '" style="margin-bottom:12px;">' +
                    (хватает ? '\u2713 ' : '\u26A0 ') +
                    L.regSeedCount.replace('{n}', расставлено).replace('{m}', норма) +
                    (хватает ? '' : ' \u00B7 ' + L.regSeedHint) +
                '</div>';
            }

            // ---- Main Draw ----
            var reservedSpots = tournament.reserved_spots || 0;
            var badgeText = mainDraw.length + '/' + maxPart;
            if (reservedSpots > 0) {
                badgeText += ' (' + reservedSpots + ' ' + (isEn ? 'reserved' : 'резерв') + ')';
            }
            html += '<h3 class="ad-reg-section-title">' + L.regMainDraw + ' <span class="ad-badge">' + badgeText + '</span></h3>';
            html += заморожено ? '' :
                '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px;">' +
                '<button id="adBrkAddFromDb" style="padding:6px 14px;border:1px solid var(--accent);border-radius:6px;background:rgba(204,255,0,0.1);color:var(--accent);cursor:pointer;font-size:0.85rem;font-weight:600;">' + L.regAddFromDb + '</button>' +
                '<button id="adBrkAddExternal" style="padding:6px 14px;border:1px solid var(--accent);border-radius:6px;background:rgba(204,255,0,0.1);color:var(--accent);cursor:pointer;font-size:0.85rem;font-weight:600;">' + L.regAddExternal + '</button>' +
            '</div>';
            if (mainDraw.length > 0) {
                html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                    regTableHead.replace('GRP', 'main') +
                '</tr></thead><tbody>';
                mainDraw.forEach(function(reg, idx) {
                    html += renderRegRow(reg, idx + 1, playersMap, 'main', debtPlayerIds, isDbl,
                                         заморожено, руками ? норма : 0, занятыеНомера);
                });
                html += '</tbody></table></div>';
            } else {
                html += '<div class="ad-empty-state" style="padding:16px 0;"><p>' + L.noRegistrations + '</p></div>';
            }

            // ---- Waitlist ----
            html += '<h3 class="ad-reg-section-title" style="margin-top:24px;">' + L.regWaitlist + ' <span class="ad-badge">' + waitlistRegs.length + '</span></h3>';
            if (waitlistRegs.length > 0) {
                html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                    regTableHead.replace('GRP', 'wait') +
                '</tr></thead><tbody>';
                waitlistRegs.forEach(function(reg, idx) {
                    html += renderRegRow(reg, idx + 1, playersMap, 'wait', debtPlayerIds, isDbl,
                                         заморожено, руками ? норма : 0, занятыеНомера);
                });
                html += '</tbody></table></div>';
            } else {
                html += '<div class="ad-empty-state" style="padding:16px 0;"><p>' + L.regNoWaitlist + '</p></div>';
            }

            // ---- Rejected (admin only) ----
            // ---- Вне турнира: отказ менеджера и снявшиеся сами ----
            //
            // Раньше отклонённые висели списком без единой кнопки, а снятые не
            // показывались вовсе — заявка просто исчезала с глаз, и вернуть её
            // было нечем. Оба случая означают одно: пары в турнире нет. Значит
            // и место им одно, с обратным ходом, если отказали по ошибке.
            var внеТурнира = rejected.concat(withdrawn)
                .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });

            if (внеТурнира.length > 0) {
                html += '<h3 class="ad-reg-section-title" style="margin-top:24px;color:#f44336;">' + L.regOut +
                    ' <span class="ad-badge" style="background:rgba(244,67,54,0.15);color:#f44336;">' +
                    внеТурнира.length + '</span></h3>';
                html += '<p style="margin:-4px 0 10px;font-size:0.8rem;color:var(--text-dim);">' + L.regOutHint + '</p>';
                html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                    '<th style="width:32px;text-align:center;padding:4px 6px;">#</th>' +
                    '<th>' + L.plrName + '</th>' +
                    (isDbl ? '<th>' + L.doublesPartner + '</th>' : '<th>' + (isEn ? 'Category' : 'Категория') + '</th>') +
                    '<th>' + L.regOutWhy + '</th>' +
                    '<th>' + (isEn ? 'Registered' : 'Регистрация') + '</th>' +
                    '<th style="width:110px;text-align:center;">' + thActions + '</th>' +
                '</tr></thead><tbody>';

                внеТурнира.forEach(function(reg, idx) {
                    var player = reg.players || playersMap[reg.player_id] || {};
                    var pName = isEn ? (player.name_en || player.name || reg.player_id) : (player.name || reg.player_id);
                    // Напарника может и не быть — тогда прочерк. `имяСтороны`
                    // в этом случае отдаёт подпись кнопки «Напарник», и в
                    // таблице выходило слово вместо имени
                    var вторая = isDbl
                        ? ((reg.partner_id || reg.partner_external_name)
                            ? имяСтороны(reg, 'partner', playersMap) : '\u2014')
                        : (function() {
                            var catId = player.category_id || (playersMap[reg.player_id] || {}).category_id || '';
                            var ч = catId.split('-');
                            return ч.length > 1
                                ? ч.slice(1).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('-')
                                : (catId || '\u2014');
                        })();
                    var причина = reg.status === 'rejected' ? L.regOutByManager : L.regOutByPlayer;
                    var regDT = '';
                    if (reg.registered_at) {
                        var d = new Date(reg.registered_at);
                        regDT = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                            ' <span style="color:var(--text-dim);">' +
                            d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' }) + '</span>';
                    }
                    html += '<tr style="opacity:0.65;">' +
                        '<td style="text-align:center;padding:4px 6px;">' + (idx + 1) + '</td>' +
                        '<td>' + A.esc(pName) + '</td>' +
                        '<td style="font-size:0.8rem;">' + A.esc(вторая) + '</td>' +
                        '<td style="font-size:0.8rem;color:var(--text-secondary);">' + A.esc(причина) + '</td>' +
                        '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' + regDT + '</td>' +
                        '<td style="text-align:center;">' +
                            '<button class="ad-reg-act ad-btn-restore" data-reg-id="' + reg.id + '"' +
                            ' title="' + L.regRestoreTitle + '" style="color:#4caf50;background:none;border:none;' +
                            'cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regRestore + '</button>' +
                        '</td>' +
                    '</tr>';
                });
                html += '</tbody></table></div>';
            }

            // ---- Заблокированные: не прошли правила допуска ----
            if (blocked.length > 0) {
                var blkTitle = isEn ? 'Blocked applications' : 'Заблокированные заявки';
                var blkHint = isEn
                    ? 'Did not pass the entry rules. Kept for statistics — shows how many wanted to join.'
                    : 'Не прошли правила допуска. Сохраняются для статистики — видно, сколько человек хотело участвовать.';
                html += '<h3 class="ad-reg-section-title" style="margin-top:24px;color:#ff9800;">' + blkTitle +
                    ' <span class="ad-badge" style="background:rgba(255,152,0,0.15);color:#ff9800;">' + blocked.length + '</span></h3>';
                html += '<p style="margin:-4px 0 10px;font-size:0.8rem;color:var(--text-dim);">' + blkHint + '</p>';
                html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                    '<th style="width:32px;text-align:center;padding:4px 6px;">#</th>' +
                    '<th>' + L.plrName + '</th>' +
                    '<th>' + (isEn ? 'Category' : 'Категория') + '</th>' +
                    '<th>' + (isEn ? 'Reason' : 'Причина') + '</th>' +
                    '<th>' + (isEn ? 'Registered' : 'Регистрация') + '</th>' +
                '</tr></thead><tbody>';
                blocked.forEach(function(reg, idx) {
                    var bPlayer = reg.players || playersMap[reg.player_id] || {};
                    var bName = isEn ? (bPlayer.name_en || bPlayer.name || reg.player_id) : (bPlayer.name || reg.player_id);
                    var bCat = bPlayer.category_id || (playersMap[reg.player_id] || {}).category_id || '—';
                    var bDT = '';
                    if (reg.registered_at) {
                        var bd = new Date(reg.registered_at);
                        bDT = bd.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                            ' <span style="color:var(--text-dim);">' +
                            bd.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' }) + '</span>';
                    }
                    html += '<tr style="opacity:0.75;">' +
                        '<td style="text-align:center;padding:4px 6px;">' + (idx + 1) + '</td>' +
                        '<td>' + A.esc(bName) + '</td>' +
                        '<td style="font-size:0.8rem;">' + A.esc(bCat) + '</td>' +
                        '<td style="font-size:0.8rem;color:var(--text-secondary);">' + A.esc(reg.block_reason || '—') + '</td>' +
                        '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' + bDT + '</td>' +
                    '</tr>';
                });
                html += '</tbody></table></div>';
            }
        }

        // История замен — грузится отдельно, чтобы не задерживать таблицу
        html += '<div id="adRegChanges"></div>';

        // Generate draw button
        if (canGenerate && tournament.bracket_type) {
            var drawSize = tournament.draw_size || 16;
            html += '<div style="margin-top:16px;text-align:center;">' +
                '<p style="margin-bottom:8px;">' + mainDraw.length + ' ' + L.regCount + ' / ' + drawSize + '</p>' +
                '<button class="ad-btn ad-btn-primary" id="adBrkGenerateDraw">' + L.generateDraw + '</button>' +
            '</div>';
        }

        return html;
    }

    function renderRegRow(reg, num, playersMap, group, debtPlayerIds, isDbl, заморожено, нормаПосева, занятыеНомера) {
        debtPlayerIds = debtPlayerIds || {};
        var isExternal = reg.is_external;
        var player = isExternal ? null : (reg.players || playersMap[reg.player_id] || {});
        var pmEntry = isExternal ? {} : (playersMap[reg.player_id] || {});
        var pName = isExternal
            ? (reg.external_name || (isEn ? 'Guest' : 'Гость'))
            : (isEn ? (player.name_en || player.name || reg.player_id) : (player.name || reg.player_id));
        // Значок посева рядом с именем нужен только там, где нет своей колонки:
        // в рейтинговых турнирах посев ставит рейтинг, и показать его больше
        // негде. Где менеджер сеет руками, колонка «Посев» уже есть — значок
        // дублировал её и переносил фамилию на третью строку, раздувая таблицу
        var seedHtml = (reg.seed_number && !нормаПосева)
            ? ' <span class="ad-badge ad-badge-accent">[' + reg.seed_number + ']</span>' : '';
        var hasDebt = !isExternal && debtPlayerIds[reg.player_id];
        var debtBadge = hasDebt
            ? ' <span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:700;background:rgba(244,67,54,0.15);color:#f44336;margin-left:4px;">' + L.regDebt + '</span>'
            : '';
        var externalBadge = isExternal
            ? ' <span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:700;background:rgba(33,150,243,0.15);color:#2196f3;margin-left:4px;">' + (reg.external_country || 'EXT') + '</span>'
            : '';
        // NTRP for main player
        var playerNtrp = isExternal ? (reg.external_ntrp || null)
            : (isDbl ? (ntrpПары(pmEntry) || null) : (pmEntry.ntrp_singles || null));
        var ntrpBadge = playerNtrp
            ? ' <span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.65rem;font-weight:700;background:rgba(156,39,176,0.15);color:#ce93d8;margin-left:4px;">' + playerNtrp + '</span>'
            : '';

        var catId = isExternal ? '' : (player.category_id || pmEntry.category_id || '');
        var catParts = catId.split('-');
        var catLabel = isExternal ? '—' : (catParts.length > 1
            ? catParts.slice(1).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('-')
            : catId || '—');
        var rankVal = isExternal ? '—' : (pmEntry.rank || '—');
        var regDT = '';
        if (reg.registered_at) {
            var d = new Date(reg.registered_at);
            regDT = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                ' <span style="color:var(--text-dim);">' +
                d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '</span>';
        }
        // Посев руками: список чисел до нормы. Больше нормы номеров не бывает —
        // сеяных ровно столько, сколько мест под них в сетке
        var посевTd = '';
        if (нормаПосева) {
            // Занятые номера не показываем вовсе: так двух первых не бывает по
            // устройству, а не по проверке. Чтобы отдать номер другой паре,
            // сначала снимают его прочерком — тогда он снова появится у всех
            var опции = '<option value="">\u2014</option>';
            for (var с = 1; с <= нормаПосева; с++) {
                var свой = Number(reg.seed_number) === с;
                if (!свой && занятыеНомера && занятыеНомера[с]) continue;
                опции += '<option value="' + с + '"' + (свой ? ' selected' : '') + '>' + с + '</option>';
            }
            посевTd = '<td style="text-align:center;">' +
                '<select class="ad-reg-seed" data-reg-id="' + reg.id + '"' +
                (заморожено ? ' disabled' : '') + '>' + опции + '</select></td>';
        }

        // Сетка сформирована — состав закрыт: снимать и одобрять поздно, место
        // в сетке уже разыграно. А замена на месте разрешена: человек выбыл,
        // вместо него выходит другой, место и посев остаются за заявкой
        var стоп = заморожено ? ' disabled style="opacity:0.35;cursor:not-allowed;' : ' style="';
        var стопЗамены = ' style="';
        var actionsTd = '<td style="text-align:center;white-space:nowrap;"><div style="display:flex;gap:6px;justify-content:center;align-items:center;">';

        // Гость ждёт решения: подтвердить пару или убрать напарника. Заявку
        // целиком не снимаем — первый номер не виноват, найдёт другого
        if (reg.partner_external_name && !reg.guest_confirmed) {
            actionsTd += '<button class="ad-reg-act ad-btn-guest-ok" data-reg-id="' + reg.id + '"' +
                ' title="' + L.regGuestOk + '" style="color:#4caf50;font-size:0.8rem;font-weight:600;">' +
                L.regGuestOkShort + '</button>' +
                '<button class="ad-reg-act ad-btn-guest-drop" data-reg-id="' + reg.id + '"' +
                ' title="' + L.regGuestDrop + '" style="color:#f44336;font-size:0.8rem;font-weight:600;">' +
                L.regGuestDropShort + '</button>';
        }

        if (group === 'main') {
            actionsTd += '<button class="ad-reg-act ad-btn-replace" data-reg-id="' + reg.id + '" title="' + L.regReplace + '"' + стопЗамены + 'color:#42a5f5;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regReplaceShort + '</button>';
            actionsTd += '<button class="ad-reg-act ad-btn-to-waitlist" data-reg-id="' + reg.id + '" title="' + L.regMoveToWaitlist + '"' + стоп + 'color:#FFA726;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regMoveToWaitlistShort + '</button>';
            // Отказ из сетки: человек не придёт совсем. Раньше его можно было
            // только задвинуть в очередь, где он никого не ждал, либо снести
            // скопом — и заявка пропадала из всех списков без следа
            actionsTd += '<button class="ad-reg-act ad-btn-reject" data-reg-id="' + reg.id + '" title="' + L.regReject + '"' + стоп + 'color:#f44336;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regReject + '</button>';
        } else if (group === 'wait') {
            actionsTd += '<button class="ad-reg-act ad-btn-replace" data-reg-id="' + reg.id + '" title="' + L.regReplace + '"' + стопЗамены + 'color:#42a5f5;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regReplaceShort + '</button>';
            actionsTd += '<button class="ad-reg-act ad-btn-approve" data-reg-id="' + reg.id + '" title="' + L.regMoveToMain + '"' + стоп + 'color:#4caf50;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regMoveToMainShort + '</button>' +
                '<button class="ad-reg-act ad-btn-reject" data-reg-id="' + reg.id + '" title="' + L.regReject + '"' + стоп + 'color:#f44336;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:600;padding:2px 6px;">' + L.regReject + '</button>';
        }
        actionsTd += '</div></td>';

        // Partner column for doubles
        var partnerTd = '';
        var combinedNtrpTd = '';
        if (isDbl) {
            var partnerDisplay = '';
            var partnerNtrp = null;
            if (reg.partner_id) {
                var pp = playersMap[reg.partner_id];
                partnerNtrp = pp ? (ntrpПары(pp) || null) : null;
                partnerDisplay = pp ? A.esc(isEn ? (pp.name_en || pp.name) : pp.name) : '?';
            } else if (reg.partner_external_name) {
                partnerNtrp = reg.partner_external_ntrp || null;
                partnerDisplay = A.esc(reg.partner_external_name) +
                    ' <span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:700;background:rgba(33,150,243,0.15);color:#2196f3;margin-left:4px;">EXT</span>';
            } else {
                partnerDisplay = '<span style="color:var(--text-dim);font-style:italic;">' + L.doublesNoPartner + '</span>' +
                    '<br><button class="ad-btn-add-partner" data-reg-id="' + reg.id + '"' + (заморожено ? ' disabled' : '') + ' style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;padding:3px 10px;border:1px solid var(--accent);border-radius:4px;background:rgba(204,255,0,0.08);color:var(--accent);cursor:pointer;font-size:0.7rem;font-weight:600;white-space:nowrap;">+ ' + L.doublesAddPartner + '</button>';
            }
            partnerTd = '<td style="font-size:0.85rem;">' + partnerDisplay + '</td>';

            // Combined NTRP column — always calculate, missing = 0
            // Сумму показываем как есть, до сотых: у турнира лимит вроде
            // 8.75, а округление до десятых превращало её в 8.8 — и пара
            // выглядела как не проходящая по допуску
            var combinedNtrp = (playerNtrp || 0) + (partnerNtrp || 0);
            combinedNtrpTd = '<td style="text-align:center;font-size:0.85rem;font-weight:600;color:var(--accent);">' +
                дробь(combinedNtrp) + '</td>';
        }

        var rowStyle = hasDebt ? ' style="background:rgba(244,67,54,0.04);"' : '';
        if (isDbl) {
            // Doubles row: # | NTRP | Имя | NTRP | Партнёр | Общий NTRP | Регистрация | Действия
            // У своих показываем парный рейтинг, а если он не проставлен —
            // кнопку «вписать». У приглашённых число вбито руками при заявке
            var playerNtrpTd = isExternal
                ? '<td style="text-align:center;font-size:0.85rem;color:#ce93d8;font-weight:600;">' + (playerNtrp || '—') + '</td>'
                : ячейкаNtrpПары(pmEntry);
            var partnerNtrpTd;
            if (reg.partner_id) {
                partnerNtrpTd = ячейкаNtrpПары(playersMap[reg.partner_id]);
            } else {
                partnerNtrpTd = '<td style="text-align:center;font-size:0.85rem;color:#ce93d8;font-weight:600;">' +
                    (reg.partner_external_ntrp || '\u2014') + '</td>';
            }

            return '<tr' + rowStyle + '>' +
                '<td><input type="checkbox" class="ad-reg-check" data-group="' + group + '" data-reg-id="' + reg.id + '" data-player-name="' + A.esc(pName) + '"' + (заморожено ? ' disabled' : '') + '></td>' +
                '<td style="text-align:center;padding:4px 6px;">' + num + '</td>' +
                playerNtrpTd +
                '<td>' + A.esc(pName) + seedHtml + debtBadge + externalBadge + '</td>' +
                partnerNtrpTd +
                partnerTd +
                combinedNtrpTd +
                посевTd +
                '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' + regDT + '</td>' +
                actionsTd +
            '</tr>';
        } else {
            // Singles row: # | Ранг | Имя | Категория | Регистрация | Действия
            return '<tr' + rowStyle + '>' +
                '<td><input type="checkbox" class="ad-reg-check" data-group="' + group + '" data-reg-id="' + reg.id + '" data-player-name="' + A.esc(pName) + '"' + (заморожено ? ' disabled' : '') + '></td>' +
                '<td style="text-align:center;padding:4px 6px;">' + num + '</td>' +
                '<td style="text-align:center;padding:4px 6px;font-size:0.65rem;color:var(--accent);font-weight:600;">' + rankVal + '</td>' +
                '<td>' + A.esc(pName) + seedHtml + debtBadge + externalBadge + '</td>' +
                '<td style="font-size:0.8rem;">' + A.esc(catLabel) + '</td>' +
                посевTd +
                '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' + regDT + '</td>' +
                actionsTd +
            '</tr>';
        }
    }

    // ---- Расписание запусков: одна очередь ----
    //
    // Раньше таблица делилась по кортам, и жеребьёвка привязывала корт к
    // группе: одна пара выходила три раза подряд на своём корте, а соседние
    // стояли пустыми. В день турнира ведут очередь — кто следующий, тот и
    // идёт на первый освободившийся корт.
    //
    // Поэтому здесь один список по времени. Время первых запусков (по числу
    // кортов) точное, дальше ориентировочное: игры кончаются кто когда.
    function renderSchedulePanel(matches, playersMap, tournament, regsMap) {
        var парный = isDoublesTournament(tournament);
        var courtCount = (tournament && tournament.court_count) || 2;
        var groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        var очередь = matches.filter(function(m) {
            return m.scheduled_time && m.score !== 'BYE';
        });

        if (!очередь.length) {
            return '<div class="ad-empty-state"><p>' +
                (isEn ? 'No schedule assigned yet.' : 'Расписание ещё не назначено.') + '</p></div>';
        }

        очередь.sort(function(a, b) {
            var t = String(a.scheduled_time).localeCompare(String(b.scheduled_time));
            if (t) return t;
            var c = String(a.court || '').localeCompare(String(b.court || ''), undefined, { numeric: true });
            if (c) return c;
            return (a.match_order || 0) - (b.match_order || 0);
        });

        var courtOpts = '<option value="">—</option>';
        for (var ci = 1; ci <= courtCount; ci++) {
            courtOpts += '<option value="' + ci + '">' + L.schedCourtTitle + ' ' + ci + '</option>';
        }

        var html = '<div class="ad-sched-note">' + L.schedApproxNote + '</div>';

        html += '<div class="ad-sched-section ad-sched-wrap"><table class="ad-table ad-sched-table">' +
            '<thead><tr>' +
                '<th class="sched-num">№</th>' +
                '<th class="sched-time">' + L.schedTime + '</th>' +
                '<th class="sched-round">' + L.schedRound + '</th>' +
                '<th class="sched-p">' + (isEn ? 'Pair 1' : 'Пара 1') + '</th>' +
                '<th class="sched-vs"></th>' +
                '<th class="sched-p">' + (isEn ? 'Pair 2' : 'Пара 2') + '</th>' +
                '<th class="sched-court">' + L.schedCourt + '</th>' +
                '<th class="sched-status">' + L.thStatus + '</th>' +
                '<th class="sched-call">' + L.schedCallHead + '</th>' +
            '</tr></thead><tbody>';

        очередь.forEach(function(m, idx) {
            var сыгран = m.status === 'completed';
            var время = m.scheduled_time ? m.scheduled_time.slice(0, 5) : '';

            var круг = m.round || '';
            if (m.group_number) круг = L.groupLabel + ' ' + (groupLetters[m.group_number - 1] || m.group_number);

            var стрелки = сыгран ? '' :
                '<div class="ad-sched-move">' +
                    (idx > 0 ? '<button class="ad-sched-up" data-match="' + m.id + '" title="' + L.schedUp + '">\u25B2</button>' : '') +
                    (idx < очередь.length - 1 ? '<button class="ad-sched-down" data-match="' + m.id + '" title="' + L.schedDown + '">\u25BC</button>' : '') +
                '</div>';

            var времяHtml = сыгран
                ? '<span style="font-weight:600;">' + (время || '\u2014') + '</span>'
                : '<input type="text" class="ad-sched-time" value="' + время + '" placeholder="00:00" ' +
                  'maxlength="5" inputmode="numeric" autocomplete="off">';

            var пара1 = m.player1_id ? getTeamDisplayName(m.player1_id, regsMap, playersMap, парный) : '\u2014';
            var пара2 = m.player2_id ? getTeamDisplayName(m.player2_id, regsMap, playersMap, парный) : '\u2014';

            var кортHtml = сыгран
                ? '<span>' + (m.court ? L.schedCourtTitle + ' ' + A.esc(String(m.court)) : '\u2014') + '</span>'
                : '<select class="ad-sched-court">' +
                    courtOpts.replace('value="' + m.court + '"', 'value="' + m.court + '" selected') +
                  '</select>';

            // Сыгранным статус ставит счёт: руками его не выставляем, иначе в
            // таблице группы окажется результат, которого не было
            var статусHtml = сыгран
                ? '<span class="ad-badge ad-badge-success">' + L.schedStDone + '</span>'
                : '<div class="ad-sched-switch" data-match="' + m.id + '">' +
                    '<button type="button" class="ad-sched-status' + (m.status === 'live' ? '' : ' on') + '" data-status="upcoming">' + L.schedStSoon + '</button>' +
                    '<button type="button" class="ad-sched-status' + (m.status === 'live' ? ' on' : '') + '" data-status="live">' + L.schedStLive + '</button>' +
                  '</div>';

            // «Готовьтесь» уходит один раз и потом только показывает время.
            // «На корт» можно повторить — вдруг пару не услышали
            var предупредили = часы(m.called_ready_at);
            var позвали = часы(m.called_go_at);
            // Звать имеет смысл только тех, кто ещё ждёт: игра идёт — люди на
            // корте, а «Готовьтесь» после зова опоздало, они уже идут
            var играют = m.status === 'live';
            var готовоЗакрыто = предупредили || позвали || играют;
            var зовHtml = сыгран ? '' :
                '<div class="ad-sched-call">' +
                    '<button class="ad-btn ad-btn-sm ad-btn-secondary ad-call-ready' +
                        ((предупредили || позвали) ? ' ad-call-done' : '') + '" data-match="' + m.id + '"' +
                        (готовоЗакрыто ? ' disabled' : '') +
                        (предупредили ? ' title="' + L.schedCalledReady + ' ' + предупредили + '"' : '') + '>' +
                        (предупредили ? '\u2713 ' + предупредили : L.schedCallReady) + '</button>' +
                    '<button class="ad-btn ad-btn-sm ' + (позвали ? 'ad-btn-secondary ad-call-done' : 'ad-btn-primary') +
                        ' ad-call-go" data-match="' + m.id + '"' +
                        (играют ? ' disabled' : '') +
                        (позвали ? ' title="' + L.schedCalled + ' ' + позвали + '"' : '') + '>' +
                        (позвали ? L.schedCallAgain + ' ' + позвали : L.schedCallGo) + '</button>' +
                '</div>';

            // Сыгранные гаснут: очередь читается вперёд, а прошедшее не
            // мешает. Совсем не прячем — время и пары ещё смотрят
            var классСтроки = сыгран ? ' class="ad-sched-row-done"'
                : (m.status === 'live' ? ' class="ad-sched-row-live"' : '');
            html += '<tr data-match-id="' + m.id + '"' + классСтроки + '>' +
                '<td style="text-align:center;color:var(--text-dim);">' + (idx + 1) + стрелки + '</td>' +
                '<td>' + времяHtml + '</td>' +
                '<td><span class="ad-badge">' + круг + '</span></td>' +
                '<td>' + пара1 + '</td>' +
                '<td class="sched-vs">vs</td>' +
                '<td>' + пара2 + '</td>' +
                '<td>' + кортHtml + '</td>' +
                '<td class="sched-status">' + статусHtml + '</td>' +
                '<td class="sched-call">' + зовHtml + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';

        // Когда рассылали расписание в прошлый раз. Повторять можно — очередь
        // меняется, — но вслепую жать не приходится
        var рассылали = датаВремя(tournament.schedule_notified_at);
        var сохраняли = датаВремя(tournament.schedule_saved_at);
        html += '<div class="ad-sched-foot">' +
            '<div class="ad-sched-stamps">' +
                (сохраняли ? '<span class="ad-sched-sent">' + L.schedSavedAt + ' ' + сохраняли + '</span>' : '') +
                (рассылали ? '<span class="ad-sched-sent">' + L.schedNotifiedAt + ' ' + рассылали + '</span>' : '') +
            '</div>' +
            '<button class="ad-btn ad-btn-secondary" id="adSchedNotify"' +
                (рассылали ? ' data-sent="' + рассылали + '"' : '') + '>\uD83D\uDCE2 ' + L.schedNotify + '</button>' +
            // Сохранять нечего, пока время и корты не трогали
            '<button class="ad-btn ad-btn-primary" id="adSchedSave" disabled>' + L.schedSave + '</button>' +
        '</div>';

        return html;
    }

    // ---- Group Panel HTML (Round-Robin) ----
    /**
     * Каким будет плей-офф — видно сразу после жеребьёвки групп.
     *
     * Размер сетки и свободные места считаются из настроек: сколько групп и
     * сколько выходит из каждой. Пары первого круга собираются тем же
     * правилом, что и настоящая жеребьёвка: победители групп — сеяные и
     * расходятся по позициям посева, проход без игры достаётся первым из них,
     * остальные занимают оставшиеся места.
     *
     * Слоты подписаны «A1», «B2» — место в своей группе. Как только группа
     * доиграна, вместо подписи встаёт имя: ждать остальные группы не нужно.
     */
    function предпросмотрПлейофф(tournament, grpMatches, playersMap, groupCount, qualifiers, regsMap, isDbl) {
        var букв = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        // Кто уже известен: в доигранной группе места окончательны
        var именаСлотов = {};
        for (var g = 1; g <= groupCount; g++) {
            var матчиГруппы = grpMatches.filter(function(m) { return m.group_number === g; });
            if (!матчиГруппы.length) continue;
            var всеСыграны = матчиГруппы.every(function(m) { return m.status === 'completed'; });
            if (!всеСыграны) continue;

            var игроки = [];
            матчиГруппы.forEach(function(m) {
                if (m.player1_id && игроки.indexOf(m.player1_id) === -1) игроки.push(m.player1_id);
                if (m.player2_id && игроки.indexOf(m.player2_id) === -1) игроки.push(m.player2_id);
            });
            var места = calculateGroupStandings(игроки, матчиГруппы, playersMap);
            места.forEach(function(м) {
                именаСлотов[(букв[g - 1] || g) + м.place] = м.playerId;
            });
        }

        // Слоты: сначала победители групп — они сеяные, потом вторые места и дальше
        var слоты = [];
        for (var место = 1; место <= qualifiers; место++) {
            for (var гр = 1; гр <= groupCount; гр++) {
                слоты.push((букв[гр - 1] || гр) + место);
            }
        }
        if (слоты.length < 2) return '';

        var размер = 2;
        while (размер < слоты.length) размер *= 2;

        var позицииПосева = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[размер])
            ? SEED_POSITIONS[размер]
            : (размер === 16 ? [1, 16, 9, 8, 5, 12, 13, 4]
                : (размер === 8 ? [1, 8, 5, 4] : (размер === 4 ? [1, 4, 3, 2] : [1, 2])));

        var сетка = new Array(размер);
        var сеяных = Math.min(groupCount, позицииПосева.length);
        for (var с = 0; с < сеяных; с++) сетка[позицииПосева[с] - 1] = слоты[с];

        // Свободные места отдаём соперникам верхних сеяных: так сильнейшие
        // проходят первый круг без игры — правило то же, что в жеребьёвке
        var свободно = Math.max(0, размер - слоты.length);
        var проходБезИгры = {};
        for (var b = 0; b < свободно && b < позицииПосева.length; b++) {
            var и = позицииПосева[b] - 1;
            проходБезИгры[(и % 2 === 0) ? и + 1 : и - 1] = true;
        }

        var остальные = слоты.slice(сеяных);
        for (var п = 0; п < размер && остальные.length; п++) {
            if (сетка[п] || проходБезИгры[п]) continue;
            сетка[п] = остальные.shift();
        }

        function подпись(слот) {
            if (!слот) return '<span style="color:var(--text-dim);">' + L.byeLabel + '</span>';
            var id = именаСлотов[слот];
            if (!id) return '<span style="color:var(--text-secondary);">' + слот + '</span>';
            // Имена берём тем же способом, что и настоящая сетка: в парном
            // турнире показываются оба, в одиночном — игрок
            var имя;
            if (isDbl && regsMap) {
                имя = getTeamDisplayName(id, regsMap, playersMap, true);
            } else {
                var и = playersMap[id];
                имя = A.esc(и ? (isEn ? (и.name_en || и.name) : и.name) : id);
            }
            return '<b>' + имя + '</b> <span style="color:var(--text-dim);font-size:0.75rem;">' + слот + '</span>';
        }

        var сыгранныхГрупп = 0;
        for (var гг = 1; гг <= groupCount; гг++) {
            var мг = grpMatches.filter(function(m) { return m.group_number === гг; });
            if (мг.length && мг.every(function(m) { return m.status === 'completed'; })) сыгранныхГрупп++;
        }

        var html = '<div class="ad-grp-playoff-section" style="margin-top:24px;">';
        html += '<div class="ad-grp-section-title">' + L.playoffPreviewTitle + '</div>';
        html += '<p style="margin:-4px 0 12px;font-size:0.8rem;color:var(--text-dim);">' +
            L.playoffPreviewHint
                .replace('{done}', сыгранныхГрупп)
                .replace('{all}', groupCount)
                .replace('{size}', размер)
                .replace('{free}', свободно) + '</p>';

        html += '<div class="ad-table-card"><table class="ad-table"><tbody>';
        for (var м = 0; м < размер; м += 2) {
            html += '<tr>' +
                '<td style="width:36px;text-align:center;color:var(--text-dim);">' + (м / 2 + 1) + '</td>' +
                '<td>' + подпись(сетка[м]) + '</td>' +
                '<td style="width:40px;text-align:center;color:var(--text-dim);">vs</td>' +
                '<td>' + подпись(сетка[м + 1]) + '</td>' +
            '</tr>';
        }
        html += '</tbody></table></div></div>';
        return html;
    }

    // ---- Helpers to distinguish group vs playoff matches ----
    function isGroupMatch(m) { return m.group_number && m.group_number > 0; }
    function isIGMatch(m) { return m.round === 'IG'; }
    function isPlayoffMatch(m) { return !m.group_number && m.round && m.round !== 'IG' && m.round.charAt(0) !== 'G' && !isPLMatch(m) && !isCLMatch(m); }

    // Group League helpers
    function isPLMatch(m) { return m.round && m.round.indexOf('PL-') === 0; }
    function isCLMatch(m) { return m.round && m.round.indexOf('CL-') === 0; }
    function isLeagueMatch(m) { return isPLMatch(m) || isCLMatch(m); }
    function getLeaguePrefix(m) {
        if (isPLMatch(m)) return 'PL';
        if (isCLMatch(m)) return 'CL';
        return null;
    }

    /**
     * Счета от игроков: что ждёт подтверждения и с чем не согласились.
     *
     * Раньше счёт мог появиться только от менеджера, и следить было не за
     * чем. Теперь его вписывают сами игроки — и менеджеру нужно видеть две
     * вещи: где ещё нет ответа второго и где спор.
     *
     * Пусто — блока нет вовсе.
     */
    function renderScoreQueue(matches, playersMap, isDbl, regsMap) {
        var ждут = matches.filter(function (m) { return m.score_status === 'pending'; });
        var спорные = matches.filter(function (m) { return m.score_status === 'disputed'; });
        if (!ждут.length && !спорные.length) return '';

        function имя(id) {
            if (!id) return '—';
            if (isDbl) return getTeamDisplayName(id, regsMap, playersMap, true).replace(/<[^>]*>/g, '');
            var p = playersMap[id] || {};
            return isEn ? (p.name_en || p.name || id) : (p.name || id);
        }

        function строки(список, вид) {
            return список.map(function (m) {
                return '<div class="ad-sq-row ad-sq-' + вид + '">' +
                    '<span class="ad-sq-pair">' + A.esc(имя(m.player1_id)) + ' \u2014 ' +
                        A.esc(имя(m.player2_id)) + '</span>' +
                    '<span class="ad-sq-score">' + A.esc(String(m.score || '').replace(/\//g, ':')) + '</span>' +
                    (m.score_dispute_note
                        ? '<span class="ad-sq-note">' + A.esc(m.score_dispute_note) + '</span>' : '') +
                    '<button class="ad-btn ad-btn-sm ad-sq-fix" data-match-edit="' + m.id + '">' +
                        (isEn ? 'Edit' : 'Править') + '</button>' +
                '</div>';
            }).join('');
        }

        var html = '<div class="ad-score-queue">';
        if (спорные.length) {
            html += '<div class="ad-sq-title ad-sq-title-hot">' +
                (isEn ? 'Disputed scores' : 'Спорные счета') + ' (' + спорные.length + ')</div>' +
                строки(спорные, 'hot');
        }
        if (ждут.length) {
            html += '<div class="ad-sq-title">' +
                (isEn ? 'Waiting for confirmation' : 'Ждут подтверждения') + ' (' + ждут.length + ')</div>' +
                '<div class="ad-sq-hint">' + (isEn
                    ? 'The opponent has not answered yet. Open the score and save it — that closes the match and moves the bracket on.'
                    : 'Соперник ещё не ответил. Откройте счёт и сохраните — это закроет матч и двинет сетку.') + '</div>' +
                строки(ждут, 'wait');
        }
        return html + '</div>';
    }

    function renderGroupPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap) {
        var groupCount = tournament.group_count || 2;
        var qualifiers = tournament.qualifiers_per_group || 2;
        var html = '';
        var groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Split matches into group, IG, and playoff
        var grpMatches = matches.filter(isGroupMatch);
        var igMatches = matches.filter(isIGMatch);
        var plMatches = matches.filter(isPlayoffMatch);
        var hasPlayoff = plMatches.length > 0;
        var hasIG = igMatches.length > 0;
        var allIGCompleted = hasIG && igMatches.every(function(m) { return m.status === 'completed'; });

        // Group completion: all GROUP matches completed
        var allGroupCompleted = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });
        var anyGroupCompleted = grpMatches.some(function(m) { return m.status === 'completed'; });

        // Playoff completion
        var allPlayoffCompleted = hasPlayoff && plMatches.every(function(m) { return m.status === 'completed'; });

        // Overall completion (IG must also be complete if present)
        var totalAllCompleted = allGroupCompleted && (!hasIG || allIGCompleted) && (!hasPlayoff || allPlayoffCompleted);

        // Top buttons (only regenerate before any results)
        if (!anyGroupCompleted && !isTournamentCompleted) {
            html += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">';
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
            html += '</div>';
        }

        // Кто на самом деле попал в плей-офф.
        //
        // Считать по месту в группе мало: когда вышедших меньше, чем мест в
        // сетке, система добирает лучшие третьи места — и в таблице они
        // ничем не отличались от третьих, которые остались за бортом.
        // Берём правду из самой сетки: кто стоит в её матчах, тот и прошёл.
        var вПлейофф = {};
        plMatches.concat(igMatches).forEach(function(m) {
            if (m.player1_id) вПлейофф[m.player1_id] = true;
            if (m.player2_id) вПлейофф[m.player2_id] = true;
        });

        // Build playerGroupLabel map: playerId → "A1", "B2", "C3" etc.
        var playerGroupLabel = {};
        for (var g = 1; g <= groupCount; g++) {
            var gm = grpMatches.filter(function(m) { return m.group_number === g; });
            var pids = [];
            gm.forEach(function(m) {
                if (m.player1_id && pids.indexOf(m.player1_id) === -1) pids.push(m.player1_id);
                if (m.player2_id && pids.indexOf(m.player2_id) === -1) pids.push(m.player2_id);
            });
            var st = calculateGroupStandings(pids, gm, playersMap);
            st.sort(function(a, b) { return a.place - b.place; });
            var letter = groupLetters[g - 1] || String(g);
            st.forEach(function(s) { playerGroupLabel[s.playerId] = letter + s.place; });
        }

        // Правило выхода — над таблицами. Раньше о нём нигде не говорилось:
        // подсветка показывала, кто прошёл, но не объясняла, почему именно
        // столько. Менеджер знал правило из настроек, игрок — ниоткуда
        html += '<div class="ad-sched-note" style="margin-bottom:12px;">' +
            L.groupRule.replace('{n}', qualifiers).replace('{groups}', groupCount) + '</div>';

        // ---- Group tables (FIRST) ----
        for (var g = 1; g <= groupCount; g++) {
            var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
            if (!groupMatchesG.length) continue;

            // Collect unique player IDs in this group
            var playerIds = [];
            groupMatchesG.forEach(function(m) {
                if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
            });

            // Calculate standings
            var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
            var groupHasResults = groupMatchesG.some(function(m) { return m.status === 'completed'; });

            // Apply manual group place overrides
            var manualPlaces = tournament.manual_group_places || {};
            var gKey = String(g);
            if (manualPlaces[gKey]) {
                var overrides = manualPlaces[gKey];
                standings.forEach(function(st) {
                    if (overrides[st.playerId] !== undefined) {
                        st.place = overrides[st.playerId];
                    }
                });
            }

            // Detect tie groups (players with same wins)
            var tieGroups = {};
            standings.forEach(function(st) {
                var key = st.wins;
                if (!tieGroups[key]) tieGroups[key] = [];
                tieGroups[key].push(st.playerId);
            });
            // Only keep groups with 2+ players
            var tiedPlayerIds = {};
            Object.keys(tieGroups).forEach(function(key) {
                if (tieGroups[key].length >= 2) {
                    tieGroups[key].forEach(function(pid) { tiedPlayerIds[pid] = tieGroups[key]; });
                }
            });

            // Stable order: by seed (ascending), unseeded keep draw order
            standings.sort(function(a, b) {
                var sa = a.seed || 9999;
                var sb = b.seed || 9999;
                if (sa !== sb) return sa - sb;
                return playerIds.indexOf(a.playerId) - playerIds.indexOf(b.playerId);
            });

            // Build matrix table
            var letter = groupLetters[g - 1] || String(g);
            html += '<div class="ad-grp-block">';
            html += '<div class="ad-grp-title">' + L.groupLabel + ' ' + letter + '</div>';
            html += '<div class="ad-table-wrap" style="overflow-x:auto;">';
            html += '<table class="ad-table ad-grp-matrix">';

            // Header
            html += '<thead><tr>';
            html += '<th style="width:30px;">№</th>';
            html += '<th>' + (isEn ? 'Player' : 'Игрок') + '</th>';
            for (var c = 0; c < standings.length; c++) {
                html += '<th class="ad-grp-score" style="width:60px;text-align:center;">' + (c + 1) + '</th>';
            }
            html += '<th class="ad-grp-pts" style="width:40px;text-align:center;">' + L.groupWins + '</th>';
            html += '<th class="ad-grp-place" style="width:50px;text-align:center;">' + L.groupPlace + '</th>';
            html += '</tr></thead>';

            // Body
            html += '<tbody>';
            for (var row = 0; row < standings.length; row++) {
                var st = standings[row];
                var p = playersMap[st.playerId] || {};
                var pName = isDbl
                    ? getTeamDisplayName(st.playerId, regsMap, playersMap, true)
                    : A.esc(isEn ? (p.name_en || p.name || '?') : (p.name || '?'));
                var seedHtml = st.seed ? ' <span class="ad-badge" style="font-size:0.65rem;">[' + st.seed + ']</span>' : '';
                // Прошёл — значит стоит в сетке. Пока её нет, показываем
                // ожидание по месту: первые qualifiers идут дальше
                var isQualified = hasPlayoff || hasIG
                    ? !!вПлейофф[st.playerId]
                    : (st.place <= qualifiers && allGroupCompleted);
                // Добран сверх нормы: место ниже проходного, а в сетке стоит
                var добран = isQualified && st.place > qualifiers;

                html += '<tr' + (isQualified && hasPlayoff ? ' style="background:rgba(204,255,0,0.06);"' : '') + '>';
                html += '<td style="font-weight:600;text-align:center;">' + (row + 1) + '</td>';
                html += '<td style="white-space:nowrap;">' + pName + seedHtml +
                    (isQualified && hasPlayoff ? ' <span style="color:var(--accent);font-size:0.65rem;">&#9654;</span>' : '') +
                    (добран ? ' <span class="ad-badge" style="background:rgba(204,255,0,0.15);color:var(--accent);font-size:0.6rem;" title="' +
                        L.qualAddedHint + '">' + L.qualAdded + '</span>' : '') + '</td>';

                for (var col = 0; col < standings.length; col++) {
                    if (row === col) {
                        // Diagonal
                        html += '<td class="ad-grp-diag">&times;</td>';
                    } else {
                        var opponentId = standings[col].playerId;
                        var match = findGroupMatch(groupMatchesG, st.playerId, opponentId);
                        if (match && match.status === 'completed' && match.score) {
                            var scoreDisplay = formatGroupScore(match, st.playerId);
                            var isWin = match.winner_id === st.playerId;
                            html += '<td class="ad-grp-score ' + (isWin ? 'ad-grp-win' : 'ad-grp-loss') + '" ' +
                                'data-match-edit="' + match.id + '" data-row-player="' + st.playerId + '" style="cursor:pointer;text-align:center;">' +
                                scoreDisplay + '</td>';
                        } else if (match) {
                            html += '<td class="ad-grp-score ad-grp-pending" data-match-edit="' + match.id + '" data-row-player="' + st.playerId + '" ' +
                                'style="cursor:pointer;text-align:center;">—</td>';
                        } else {
                            html += '<td class="ad-grp-score" style="text-align:center;">—</td>';
                        }
                    }
                }

                html += '<td class="ad-grp-pts" style="text-align:center;font-weight:600;">' + st.wins + '</td>';
                if (!groupHasResults) {
                    html += '<td class="ad-grp-place" style="text-align:center;font-weight:700;">—</td>';
                } else if (tiedPlayerIds[st.playerId] && !isTournamentCompleted) {
                    // Tied player — render select
                    var tiedGroup = tiedPlayerIds[st.playerId];
                    var tiedStandings = standings.filter(function(s) { return tiedGroup.indexOf(s.playerId) !== -1; });
                    var minPlace = Math.min.apply(null, tiedStandings.map(function(s) { return s.place; }));
                    html += '<td class="ad-grp-place" style="text-align:center;">' +
                        '<select class="ad-grp-place-select" data-group="' + g + '" data-player="' + st.playerId + '" ' +
                        'style="background:rgba(204,255,0,0.1);color:var(--accent);border:1px solid var(--accent);border-radius:4px;' +
                        'font-weight:700;font-size:0.85rem;padding:2px 4px;cursor:pointer;text-align:center;width:42px;">';
                    for (var pi = 0; pi < tiedGroup.length; pi++) {
                        var placeVal = minPlace + pi;
                        html += '<option value="' + placeVal + '"' + (placeVal === st.place ? ' selected' : '') + '>' + placeVal + '</option>';
                    }
                    html += '</select></td>';
                } else {
                    var placeAccent = st.place <= qualifiers;
                    html += '<td class="ad-grp-place" style="text-align:center;font-weight:700;' +
                        (placeAccent ? 'color:var(--accent);' : '') + '">' + st.place + '</td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table></div></div>';
        }

        // ---- IG matches section (after groups) — SE-style bracket ----
        if (hasIG) {
            html += '<div class="ad-ig-section" style="margin-top:24px;">';
            html += '<div class="ad-grp-section-title">' + L.igStageTitle + '</div>';
            html += '<div class="ad-ig-matches-grid">';
            igMatches.sort(function(a, b) { return a.match_order - b.match_order; });
            igMatches.forEach(function(m) {
                // Пока группы не доиграны, участников нет — показываем метку
                // слота: «B3» значит третье место группы B. Раньше здесь
                // выводилось «BYE», будто играть некому
                function имяУчастникаДоп(id, метка) {
                    if (!id) {
                        return метка
                            ? '<span style="color:var(--text-secondary);">' + A.esc(метка) + '</span>'
                            : '<span style="color:var(--text-dim);">' + L.byeLabel + '</span>';
                    }
                    if (isDbl) return getTeamDisplayName(id, regsMap, playersMap, true);
                    var и = playersMap[id] || {};
                    return A.esc(isEn ? (и.name_en || и.name || '?') : (и.name || '?'));
                }
                var p1Name = имяУчастникаДоп(m.player1_id, m.slot1_label);
                var p2Name = имяУчастникаДоп(m.player2_id, m.slot2_label);
                var p1Label = playerGroupLabel[m.player1_id] || '';
                var p2Label = playerGroupLabel[m.player2_id] || '';
                var isCompleted = m.status === 'completed';
                var isP1Win = isCompleted && m.winner_id === m.player1_id;
                var isP2Win = isCompleted && m.winner_id === m.player2_id;

                var p1Scores = [], p2Scores = [];
                var igOutcome = '';
                if (isCompleted && m.score) {
                    var igEx = extractOutcome(m.score);
                    igOutcome = igEx.outcome;
                    (igEx.sets ? igEx.sets.split(' ') : []).forEach(function(s) {
                        var pr = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                        if (pr) {
                            p1Scores.push(pr[1] + (pr[3] ? '<sup>' + pr[3] + '</sup>' : ''));
                            p2Scores.push(pr[2] + (pr[4] ? '<sup>' + pr[4] + '</sup>' : ''));
                        }
                    });
                }

                var canEdit = m.player1_id && m.player2_id;
                var matchClass = 'ad-brk-match' + (isCompleted ? ' completed' : '');
                html += '<div class="' + matchClass + '">';
                // Player 1
                var p1LblHtml = p1Label ? '<span class="ad-brk-grp-label">' + p1Label + '</span> ' : '';
                html += '<div class="ad-brk-player' + (isP1Win ? ' winner' : (isP2Win ? ' loser' : '')) + '">' +
                    p1LblHtml +
                    '<span class="ad-brk-name">' + p1Name + '</span><span class="ad-brk-sets">';
                p1Scores.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                // Player 2
                var p2LblHtml = p2Label ? '<span class="ad-brk-grp-label">' + p2Label + '</span> ' : '';
                html += '<div class="ad-brk-player' + (isP2Win ? ' winner' : (isP1Win ? ' loser' : '')) + '">' +
                    p2LblHtml +
                    '<span class="ad-brk-name">' + p2Name + '</span><span class="ad-brk-sets">';
                p2Scores.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                if (igOutcome) html += '<span class="ad-brk-outcome">' + igOutcome + '</span>';
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + m.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }
                html += '</div>';
            });
            html += '</div>'; // /ad-ig-matches-grid
            html += '</div>'; // /ad-ig-section
        }

        // Кого добрали сверх нормы — и почему. Без этой строки в таблице
        // видно только, что одно третье место прошло, а другое нет
        if (hasPlayoff || hasIG) {
            var добранные = [];
            for (var гд = 1; гд <= groupCount; гд++) {
                var мгд = grpMatches.filter(function(m) { return m.group_number === гд; });
                if (!мгд.length) continue;
                var игрокиГ = [];
                мгд.forEach(function(m) {
                    if (m.player1_id && игрокиГ.indexOf(m.player1_id) === -1) игрокиГ.push(m.player1_id);
                    if (m.player2_id && игрокиГ.indexOf(m.player2_id) === -1) игрокиГ.push(m.player2_id);
                });
                calculateGroupStandings(игрокиГ, мгд, playersMap).forEach(function(ст) {
                    if (ст.place > qualifiers && вПлейофф[ст.playerId]) {
                        var имяД = isDbl && regsMap
                            ? getTeamDisplayName(ст.playerId, regsMap, playersMap, true)
                            : A.esc((playersMap[ст.playerId] || {}).name || ст.playerId);
                        добранные.push(имяД + ' (' + (groupLetters[гд - 1] || гд) + ст.place + ')');
                    }
                });
            }
            if (добранные.length) {
                html += '<div class="ad-sched-note" style="margin-top:12px;">' +
                    L.qualExplain.replace('{who}', добранные.join(', ')) + '</div>';
            }
        }

        // Плей-офф ещё не создан — показываем, каким он будет.
        //
        // Раньше сетка появлялась только после последней группы, и до этого
        // никто не знал ни своих соперников, ни того, кому достанется проход
        // без игры. А расклад известен сразу после жеребьёвки: сколько групп
        // и сколько выходит — оттуда и размер сетки, и число свободных мест.
        if (!hasPlayoff && !hasIG && !isTournamentCompleted) {
            html += предпросмотрПлейофф(tournament, grpMatches, playersMap,
                                        groupCount, qualifiers, regsMap, isDbl);
        }

        // X-slot assignment placeholder (always present when playoff exists, populated async)
        if (hasPlayoff) {
            html += '<div id="adXSlotContainer"></div>';
        }

        // ---- Playoff bracket (after IG, after groups) ----
        if (hasPlayoff) {
            html += '<div class="ad-grp-playoff-section" style="margin-top:24px;">';
            html += '<div class="ad-grp-section-title">' + L.playoffTitle + '</div>';
            var plR1 = plMatches.filter(function(m) { return m.round_number === 1; });
            var plDrawSize = 1;
            while (plDrawSize < plR1.length * 2) plDrawSize *= 2;
            if (plDrawSize < 2) plDrawSize = plMatches.length * 2;
            html += renderPlayoffBracketHtml(plMatches, playersMap, plDrawSize, playerGroupLabel, regsMap, isDbl);
            html += '</div>';
        }

        // Action buttons (bottom)
        html += '<div style="display:flex;justify-content:center;gap:12px;margin-top:24px;padding:16px 0;">';
        if (allGroupCompleted && !hasPlayoff && !hasIG && !isTournamentCompleted) {
            // Always show format modal — it auto-detects IG availability
            html += '<button class="ad-btn ad-btn-primary" id="adBrkPlayoffFormat" style="font-size:1rem;padding:12px 32px;">' + L.playoffFormatTitle + '</button>';
        }
        if (!isTournamentCompleted) {
            // Кнопку показываем всегда. Раньше она просто не появлялась, пока
            // не записан последний счёт, и менеджер гадал, чего не хватает
            var незаписано = matches.filter(function(m) {
                return m.status !== 'completed' && m.player1_id && m.player2_id;
            }).length;
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize"' +
                (totalAllCompleted ? '' : ' disabled title="' + L.finalizeLeft.replace('{n}', незаписано) + '"') +
                ' style="font-size:1rem;padding:12px 32px;' +
                (totalAllCompleted ? '' : 'opacity:0.45;cursor:not-allowed;') + '">' +
                L.finalizeTournament + '</button>';
            if (!totalAllCompleted && незаписано > 0) {
                html += '<div class="ad-sched-note" style="margin-top:10px;flex-basis:100%;">' +
                    L.finalizeLeft.replace('{n}', незаписано) + '</div>';
            }
        }
        html += '</div>';

        return html;
    }

    // ---- Render Playoff bracket HTML (reuses bracket logic for SE matches) ----
    function renderPlayoffBracketHtml(plMatches, playersMap, drawSize, playerGroupLabel, regsMap, isDbl) {
        playerGroupLabel = playerGroupLabel || {};
        var totalRounds = Math.log2(drawSize);
        var html = '';

        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [], outcome: '' };
            var ex = extractOutcome(score);
            var sets = ex.sets ? ex.sets.split(' ') : [];
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets, outcome: ex.outcome };
        }

        html += '<div class="ad-brk-scroll"><div class="ad-brk-grid">';

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = plMatches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            var roundName = getRoundName(r, totalRounds, drawSize);

            html += '<div class="ad-brk-round">';
            html += '<div class="ad-brk-title">' + roundName + '</div>';
            html += '<div class="ad-brk-matches">';

            roundMatches.forEach(function(match) {
                var p1 = playersMap[match.player1_id];
                var p2 = playersMap[match.player2_id];
                // Group labels for playoff display
                var p1GrpLbl = match.player1_id && playerGroupLabel[match.player1_id] ? playerGroupLabel[match.player1_id] : '';
                var p2GrpLbl = match.player2_id && playerGroupLabel[match.player2_id] ? playerGroupLabel[match.player2_id] : '';
                // X-slot: R1 empty slot (not BYE) — show [X] marker in accent color
                var isR1 = match.round_number === 1 && match.round !== 'IG';
                var isByeMatch = match.score === 'BYE';
                var isXSlotP1 = isR1 && !match.player1_id && match.status !== 'completed';
                var isXSlotP2 = isR1 && !match.player2_id && match.status !== 'completed';
                var xSlotMark = '<span style="color:var(--accent);font-weight:600;">' + L.xSlot + '</span>';
                var byeMark = '<span style="color:var(--text-dim);font-style:italic;">BYE</span>';
                var p1Name, p2Name;
                function emptySlotName(isXSlot, isByeSide, метка) {
                    if (isByeSide) return byeMark;
                    // Слот знает, кого ждёт: «A1» — победитель группы A.
                    // Это понятнее, чем безликое TBD, и видно сразу после
                    // жеребьёвки, когда групп ещё никто не доиграл
                    if (метка) return '<span style="color:var(--text-secondary);">' + A.esc(метка) + '</span>';
                    if (isXSlot) return xSlotMark;
                    return '<span style="color:var(--text-dim);">TBD</span>';
                }
                if (isDbl && regsMap) {
                    p1Name = match.player1_id ? getTeamDisplayName(match.player1_id, regsMap, playersMap, true) : emptySlotName(isXSlotP1, isByeMatch && !match.player1_id, match.slot1_label);
                    p2Name = match.player2_id ? getTeamDisplayName(match.player2_id, regsMap, playersMap, true) : emptySlotName(isXSlotP2, isByeMatch && !match.player2_id, match.slot2_label);
                } else {
                    p1Name = p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : emptySlotName(isXSlotP1, isByeMatch && !match.player1_id, match.slot1_label));
                    p2Name = p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : emptySlotName(isXSlotP2, isByeMatch && !match.player2_id, match.slot2_label));
                }

                var isCompleted = match.status === 'completed';
                var isBye = match.score === 'BYE';
                var p1Winner = isCompleted && match.winner_id === match.player1_id;
                var p2Winner = isCompleted && match.winner_id === match.player2_id;
                var canEdit = match.player1_id && match.player2_id && !isBye;

                var matchClass = 'ad-brk-match' + (isCompleted ? ' completed' : '') + (match.status === 'live' ? ' live' : '');
                var setData = parseSets(match.score);

                html += '<div class="' + matchClass + '">';
                if (match.scheduled_time) {
                    var schedInfo = match.scheduled_time.slice(0, 5);
                    if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
                    html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
                }
                // Player 1 with group label (always render placeholders for alignment)
                // Место под посев держим всегда, даже когда его нет: иначе
                // имена в соседних строках начинаются с разных мест и сетка
                // читается лесенкой
                var p1SeedHtml = '<span class="ad-brk-seed">' + (match.seed1 ? '[' + match.seed1 + ']' : '') + '</span>';
                var p1LblHtml = '<span class="ad-brk-grp-label">' + (p1GrpLbl || '') + '</span>';
                html += '<div class="ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : '')) + '">' +
                    p1SeedHtml + p1LblHtml +
                    '<span class="ad-brk-name">' + p1Name + '</span><span class="ad-brk-sets">';
                setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                // Player 2 with group label (always render placeholders for alignment)
                var p2SeedHtml = '<span class="ad-brk-seed">' + (match.seed2 ? '[' + match.seed2 + ']' : '') + '</span>';
                var p2LblHtml = '<span class="ad-brk-grp-label">' + (p2GrpLbl || '') + '</span>';
                html += '<div class="ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : '')) + '">' +
                    p2SeedHtml + p2LblHtml +
                    '<span class="ad-brk-name">' + p2Name + '</span><span class="ad-brk-sets">';
                setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                if (setData.outcome) html += '<span class="ad-brk-outcome">' + setData.outcome + '</span>';
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }
                html += '</div>';
            });

            html += '</div>'; // /ad-brk-matches
            html += '</div>'; // /ad-brk-round

            if (r < totalRounds) {
                var pairCount = Math.floor(roundMatches.length / 2);
                html += '<div class="ad-brk-connector">';
                html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                html += '<div class="ad-brk-connector-inner">';
                for (var ci = 0; ci < pairCount; ci++) {
                    html += '<div class="ad-brk-conn-pair"><div class="ad-brk-conn-top"></div><div class="ad-brk-conn-mid"></div><div class="ad-brk-conn-bottom"></div></div>';
                }
                html += '</div></div>';
            }
        }

        html += '</div></div>'; // /ad-brk-grid, /ad-brk-scroll

        // 3rd place — separate block, aligned right (under final column)
        var thirdMatch = plMatches.find(function(m) { return m.round === '3RD'; });
        if (thirdMatch) {
            // В парном турнире матч за третье место играют пары, а не один
            // человек: раньше здесь показывался только первый номер, и по
            // сетке нельзя было понять, кто вообще выходит на корт
            var tp1 = playersMap[thirdMatch.player1_id];
            var tp2 = playersMap[thirdMatch.player2_id];
            var tp1Name, tp2Name;
            if (isDbl && regsMap) {
                tp1Name = thirdMatch.player1_id ? getTeamDisplayName(thirdMatch.player1_id, regsMap, playersMap, true) : '—';
                tp2Name = thirdMatch.player2_id ? getTeamDisplayName(thirdMatch.player2_id, regsMap, playersMap, true) : '—';
            } else {
                tp1Name = tp1 ? A.esc(isEn ? (tp1.name_en || tp1.name) : tp1.name) : (thirdMatch.player1_id ? 'TBD' : '—');
                tp2Name = tp2 ? A.esc(isEn ? (tp2.name_en || tp2.name) : tp2.name) : (thirdMatch.player2_id ? 'TBD' : '—');
            }
            var tCompleted = thirdMatch.status === 'completed';
            var tp1Win = tCompleted && thirdMatch.winner_id === thirdMatch.player1_id;
            var tp2Win = tCompleted && thirdMatch.winner_id === thirdMatch.player2_id;
            var tCanEdit = thirdMatch.player1_id && thirdMatch.player2_id && thirdMatch.score !== 'BYE';
            var tSetData = parseSets(thirdMatch.score);

            html += '<div style="margin-top:20px;display:flex;justify-content:flex-end;">';
            html += '<div style="width:220px;">';
            html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + L.round3rd + '</div>';
            html += '<div class="ad-brk-match' + (tCompleted ? ' completed' : '') + '">';
            if (thirdMatch.scheduled_time) {
                html += '<div class="ad-brk-schedule">' + thirdMatch.scheduled_time.slice(0, 5) +
                    (thirdMatch.court ? ' · ' + (isEn ? 'Court ' : 'Корт ') + thirdMatch.court : '') + '</div>';
            }
            html += '<div class="ad-brk-player' + (tp1Win ? ' winner' : (tp2Win ? ' loser' : '')) + '">' +
                '<span class="ad-brk-name">' + tp1Name + '</span><span class="ad-brk-sets">';
            tSetData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            html += '<div class="ad-brk-player' + (tp2Win ? ' winner' : (tp1Win ? ' loser' : '')) + '">' +
                '<span class="ad-brk-name">' + tp2Name + '</span><span class="ad-brk-sets">';
            tSetData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            if (tSetData.outcome) html += '<span class="ad-brk-outcome">' + tSetData.outcome + '</span>';
            if (tCanEdit) {
                html += '<button class="ad-brk-edit" data-match-edit="' + thirdMatch.id + '">' +
                    (tCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
            }
            html += '</div></div></div>';
        }

        return html;
    }

    // ---- Find match between two players in group ----
    function findGroupMatch(matches, p1Id, p2Id) {
        for (var i = 0; i < matches.length; i++) {
            var m = matches[i];
            if ((m.player1_id === p1Id && m.player2_id === p2Id) ||
                (m.player1_id === p2Id && m.player2_id === p1Id)) {
                return m;
            }
        }
        return null;
    }

    // ---- Format score from perspective of a specific player ----
    function formatGroupScore(match, perspectiveId) {
        if (!match.score) return '—';
        var ex = extractOutcome(match.score);
        var sets = ex.sets ? ex.sets.split(' ') : [];
        var needFlip = match.player1_id !== perspectiveId;
        var suffix = ex.outcome ? ' ' + ex.outcome : '';

        return sets.map(function(s) {
            // Parse "6/3" or "7/6(7-5)"
            var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
            if (!m) return s;
            var a = m[1], b = m[2], tb1 = m[3], tb2 = m[4];
            if (needFlip) {
                var tmp = a; a = b; b = tmp;
                if (tb1) { tmp = tb1; tb1 = tb2; tb2 = tmp; }
            }
            var setStr = a + ':' + b;
            if (tb1 && tb2) {
                var loserTb = parseInt(a) > parseInt(b) ? tb2 : tb1;
                setStr += '<sup>' + loserTb + '</sup>';
            }
            return setStr;
        }).join(' ') + suffix;
    }

    // ---- Parse score into sets/games for standings ----
    function parseScoreSetsGames(score, playerId, match) {
        var result = { setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
        if (!score || score === 'BYE') return result;

        var isPlayer1 = match.player1_id === playerId;
        var ex = extractOutcome(score);
        var sets = ex.sets ? ex.sets.split(' ') : [];

        sets.forEach(function(s) {
            var m = s.match(/^(\d+)\/(\d+)/);
            if (!m) return;
            var s1 = parseInt(m[1], 10);
            var s2 = parseInt(m[2], 10);
            var pGames = isPlayer1 ? s1 : s2;
            var oGames = isPlayer1 ? s2 : s1;
            result.gamesWon += pGames;
            result.gamesLost += oGames;
            if (pGames > oGames) result.setsWon++;
            else result.setsLost++;
        });

        return result;
    }

    // ---- Calculate Group Standings (ITF Tiebreaking) ----
    function calculateGroupStandings(playerIds, groupMatches, playersMap) {
        // Build per-player stats
        var stats = {};
        playerIds.forEach(function(pid) {
            stats[pid] = {
                playerId: pid,
                wins: 0,
                losses: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
                place: 0,
                seed: null
            };
        });

        // Find seeds from matches
        groupMatches.forEach(function(m) {
            if (m.seed1 && stats[m.player1_id]) stats[m.player1_id].seed = m.seed1;
            if (m.seed2 && stats[m.player2_id]) stats[m.player2_id].seed = m.seed2;
        });

        // Accumulate completed match stats
        var completedMatches = groupMatches.filter(function(m) {
            return m.status === 'completed' && m.winner_id && m.score && m.score !== 'BYE';
        });

        completedMatches.forEach(function(m) {
            if (stats[m.winner_id]) stats[m.winner_id].wins++;
            var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
            if (stats[loserId]) stats[loserId].losses++;

            // Sets & games
            [m.player1_id, m.player2_id].forEach(function(pid) {
                if (!stats[pid]) return;
                var sg = parseScoreSetsGames(m.score, pid, m);
                stats[pid].setsWon += sg.setsWon;
                stats[pid].setsLost += sg.setsLost;
                stats[pid].gamesWon += sg.gamesWon;
                stats[pid].gamesLost += sg.gamesLost;
            });
        });

        var arr = playerIds.map(function(pid) { return stats[pid]; });

        // Sort by wins DESC first
        arr.sort(function(a, b) { return b.wins - a.wins; });

        // ITF Tiebreaking: group players with same wins, then resolve
        var place = 1;
        var i = 0;
        while (i < arr.length) {
            // Find cluster of same wins
            var j = i;
            while (j < arr.length && arr[j].wins === arr[i].wins) j++;
            var cluster = arr.slice(i, j);

            if (cluster.length === 1) {
                cluster[0].place = place;
            } else if (cluster.length === 2) {
                // Head-to-head
                var h2h = findGroupMatch(completedMatches, cluster[0].playerId, cluster[1].playerId);
                if (h2h && h2h.winner_id) {
                    if (h2h.winner_id === cluster[0].playerId) {
                        cluster[0].place = place;
                        cluster[1].place = place + 1;
                    } else {
                        cluster[1].place = place;
                        cluster[0].place = place + 1;
                    }
                } else {
                    // Unresolved — set% then game%
                    resolveByPercentages(cluster, completedMatches, place);
                }
            } else {
                // 3+ players tied: recalc stats among themselves only
                resolveMultiWayTie(cluster, completedMatches, place);
            }

            place += cluster.length;
            i = j;
        }

        // Re-sort by place
        arr.sort(function(a, b) { return a.place - b.place; });
        return arr;
    }

    // ---- Resolve tie by set% then game% ----
    function resolveByPercentages(cluster, matches, startPlace) {
        cluster.sort(function(a, b) {
            var aSetPct = a.setsWon + a.setsLost > 0 ? a.setsWon / (a.setsWon + a.setsLost) : 0;
            var bSetPct = b.setsWon + b.setsLost > 0 ? b.setsWon / (b.setsWon + b.setsLost) : 0;
            if (bSetPct !== aSetPct) return bSetPct - aSetPct;

            var aGamePct = a.gamesWon + a.gamesLost > 0 ? a.gamesWon / (a.gamesWon + a.gamesLost) : 0;
            var bGamePct = b.gamesWon + b.gamesLost > 0 ? b.gamesWon / (b.gamesWon + b.gamesLost) : 0;
            return bGamePct - aGamePct;
        });
        for (var k = 0; k < cluster.length; k++) {
            cluster[k].place = startPlace + k;
        }
    }

    // ---- Resolve 3+ way tie (recalc stats among tied players only) ----
    function resolveMultiWayTie(cluster, allCompletedMatches, startPlace) {
        var tiedIds = cluster.map(function(c) { return c.playerId; });

        // Filter matches to only those between tied players
        var subMatches = allCompletedMatches.filter(function(m) {
            return tiedIds.indexOf(m.player1_id) !== -1 && tiedIds.indexOf(m.player2_id) !== -1;
        });

        // Recalculate stats among tied players only
        var subStats = {};
        tiedIds.forEach(function(pid) {
            subStats[pid] = { wins: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
        });

        subMatches.forEach(function(m) {
            if (subStats[m.winner_id]) subStats[m.winner_id].wins++;

            [m.player1_id, m.player2_id].forEach(function(pid) {
                if (!subStats[pid]) return;
                var sg = parseScoreSetsGames(m.score, pid, m);
                subStats[pid].setsWon += sg.setsWon;
                subStats[pid].setsLost += sg.setsLost;
                subStats[pid].gamesWon += sg.gamesWon;
                subStats[pid].gamesLost += sg.gamesLost;
            });
        });

        // Sort: sub-wins → set% → game%
        cluster.sort(function(a, b) {
            var sa = subStats[a.playerId], sb = subStats[b.playerId];
            if (sb.wins !== sa.wins) return sb.wins - sa.wins;

            var aSetPct = sa.setsWon + sa.setsLost > 0 ? sa.setsWon / (sa.setsWon + sa.setsLost) : 0;
            var bSetPct = sb.setsWon + sb.setsLost > 0 ? sb.setsWon / (sb.setsWon + sb.setsLost) : 0;
            if (bSetPct !== aSetPct) return bSetPct - aSetPct;

            var aGamePct = sa.gamesWon + sa.gamesLost > 0 ? sa.gamesWon / (sa.gamesWon + sa.gamesLost) : 0;
            var bGamePct = sb.gamesWon + sb.gamesLost > 0 ? sb.gamesWon / (sb.gamesWon + sb.gamesLost) : 0;
            return bGamePct - aGamePct;
        });

        for (var k = 0; k < cluster.length; k++) {
            cluster[k].place = startPlace + k;
        }
    }

    // ---- Bracket Panel HTML ----
    function renderBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);
        var html = '';

        // Parse score into per-set arrays for each player
        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [], outcome: '' };
            var ex = extractOutcome(score);
            var sets = ex.sets ? ex.sets.split(' ') : [];
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets, outcome: ex.outcome };
        }

        // Visual bracket with connectors
        html += '<div class="ad-brk-scroll">' +
                '<div class="ad-brk-grid">';

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = matches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            var roundName = getRoundName(r, totalRounds, drawSize);

            // Round column
            html += '<div class="ad-brk-round">';
            html += '<div class="ad-brk-title">' + roundName + '</div>';
            html += '<div class="ad-brk-matches">';

            roundMatches.forEach(function(match) {
                var p1 = playersMap[match.player1_id];
                var p2 = playersMap[match.player2_id];
                var p1Name = isDbl
                    ? getTeamDisplayName(match.player1_id, regsMap, playersMap, true)
                    : (p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : 'BYE'));
                var p2Name = isDbl
                    ? getTeamDisplayName(match.player2_id, regsMap, playersMap, true)
                    : (p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : 'BYE'));

                var isCompleted = match.status === 'completed';
                var isBye = match.score === 'BYE';
                var p1Winner = isCompleted && match.winner_id === match.player1_id;
                var p2Winner = isCompleted && match.winner_id === match.player2_id;
                var canEdit = match.player1_id && match.player2_id && !isBye;

                var matchClass = 'ad-brk-match';
                if (isCompleted) matchClass += ' completed';
                if (match.status === 'live') matchClass += ' live';

                var setData = parseSets(match.score);

                html += '<div class="' + matchClass + '">';

                // Schedule info
                if (match.scheduled_time) {
                    var schedInfo = match.scheduled_time.slice(0, 5);
                    if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
                    html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
                }

                // Player 1 row
                var p1Class = 'ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : ''));
                html += '<div class="' + p1Class + '">' +
                    (match.seed1 ? '<span class="ad-brk-seed">[' + match.seed1 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p1Name + '</span>' +
                    '<span class="ad-brk-sets">';
                setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';

                // Player 2 row
                var p2Class = 'ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : ''));
                html += '<div class="' + p2Class + '">' +
                    (match.seed2 ? '<span class="ad-brk-seed">[' + match.seed2 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p2Name + '</span>' +
                    '<span class="ad-brk-sets">';
                setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                if (setData.outcome) html += '<span class="ad-brk-outcome">' + setData.outcome + '</span>';

                // Edit score button
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }

                html += '</div>'; // /ad-brk-match
            });

            html += '</div>'; // /ad-brk-matches
            html += '</div>'; // /ad-brk-round

            // Connector column between rounds (not after last round)
            if (r < totalRounds) {
                var pairCount = Math.floor(roundMatches.length / 2);
                html += '<div class="ad-brk-connector">';
                html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                html += '<div class="ad-brk-connector-inner">';
                for (var i = 0; i < pairCount; i++) {
                    html += '<div class="ad-brk-conn-pair">' +
                        '<div class="ad-brk-conn-top"></div>' +
                        '<div class="ad-brk-conn-mid"></div>' +
                        '<div class="ad-brk-conn-bottom"></div>' +
                    '</div>';
                }
                html += '</div></div>';
            }
        }

        html += '</div>'; // /ad-brk-grid
        html += '</div>'; // /ad-brk-scroll

        // 3rd place — separate block under bracket
        var thirdMatch = matches.find(function(m) { return m.round === '3RD'; });
        if (thirdMatch) {
            // В парном на корт выходят двое: показываем пару целиком
            var tp1 = playersMap[thirdMatch.player1_id];
            var tp2 = playersMap[thirdMatch.player2_id];
            var tp1Name, tp2Name;
            if (isDbl && regsMap) {
                tp1Name = thirdMatch.player1_id ? getTeamDisplayName(thirdMatch.player1_id, regsMap, playersMap, true) : '—';
                tp2Name = thirdMatch.player2_id ? getTeamDisplayName(thirdMatch.player2_id, regsMap, playersMap, true) : '—';
            } else {
                tp1Name = tp1 ? A.esc(isEn ? (tp1.name_en || tp1.name) : tp1.name) : (thirdMatch.player1_id ? 'TBD' : '—');
                tp2Name = tp2 ? A.esc(isEn ? (tp2.name_en || tp2.name) : tp2.name) : (thirdMatch.player2_id ? 'TBD' : '—');
            }
            var tCompleted = thirdMatch.status === 'completed';
            var tBye = thirdMatch.score === 'BYE';
            var tp1Win = tCompleted && thirdMatch.winner_id === thirdMatch.player1_id;
            var tp2Win = tCompleted && thirdMatch.winner_id === thirdMatch.player2_id;
            var tCanEdit = thirdMatch.player1_id && thirdMatch.player2_id && !tBye;
            var tSetData = parseSets(thirdMatch.score);
            var tMatchClass = 'ad-brk-match' + (tCompleted ? ' completed' : '') + (thirdMatch.status === 'live' ? ' live' : '');

            html += '<div style="margin-top:20px;max-width:220px;">';
            html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + L.round3rd + '</div>';
            html += '<div class="' + tMatchClass + '">';
            if (thirdMatch.scheduled_time) {
                html += '<div class="ad-brk-schedule">' + thirdMatch.scheduled_time.slice(0, 5) +
                    (thirdMatch.court ? ' · ' + (isEn ? 'Court ' : 'Корт ') + thirdMatch.court : '') + '</div>';
            }
            html += '<div class="ad-brk-player' + (tp1Win ? ' winner' : (tp2Win ? ' loser' : '')) + '">' +
                (thirdMatch.seed1 ? '<span class="ad-brk-seed">[' + thirdMatch.seed1 + ']</span>' : '') +
                '<span class="ad-brk-name">' + tp1Name + '</span><span class="ad-brk-sets">';
            tSetData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            html += '<div class="ad-brk-player' + (tp2Win ? ' winner' : (tp1Win ? ' loser' : '')) + '">' +
                (thirdMatch.seed2 ? '<span class="ad-brk-seed">[' + thirdMatch.seed2 + ']</span>' : '') +
                '<span class="ad-brk-name">' + tp2Name + '</span><span class="ad-brk-sets">';
            tSetData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            if (tSetData.outcome) html += '<span class="ad-brk-outcome">' + tSetData.outcome + '</span>';
            if (tCanEdit) {
                html += '<button class="ad-brk-edit" data-match-edit="' + thirdMatch.id + '">' +
                    (tCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
            }
            html += '</div></div>';
        }

        // Action buttons
        html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
        if (!anyCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
        }
        if (allCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize">' + L.finalizeTournament + '</button>';
        }
        html += '</div>';

        if (isTournamentCompleted) {
            html += '<div style="text-align:center;margin-top:16px;">' +
                '<span style="color:var(--accent);font-weight:600;">' + (isEn ? 'Tournament completed.' : 'Турнир завершён.') + '</span>' +
                '&nbsp;&nbsp;<button class="ad-btn ad-btn-sm ad-btn-secondary" id="adBrkRecalc">' + (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button>' +
            '</div>';
        }

        return html;
    }

    // ---- FIC Sections Definition ----
    function getFicSections(drawSize, lang) {
        // Таблица блоков — в общем своде правил: её же читают сайт и
        // приложение. Здесь была своя копия, вторая из трёх.
        return (window.KSLT_RULES && window.KSLT_RULES.ficSections)
            ? window.KSLT_RULES.ficSections(drawSize, lang)
            : [];
    }

    // ---- FIC Match Card Renderer ----
    function renderFicMatchCard(match, playersMap, parseSets, isDbl, regsMap) {
        var p1 = playersMap[match.player1_id];
        var p2 = playersMap[match.player2_id];
        var p1Name = isDbl
            ? getTeamDisplayName(match.player1_id, regsMap, playersMap, true)
            : (p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : 'BYE'));
        var p2Name = isDbl
            ? getTeamDisplayName(match.player2_id, regsMap, playersMap, true)
            : (p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : 'BYE'));

        var isCompleted = match.status === 'completed';
        var isBye = match.score === 'BYE';
        // «BYE» пишем там, где соперника не будет вовсе: в клетке окажется
        // ровно один человек. Пока ждём второго — слот пустой, иначе
        // выходило, будто половина сетки прошла без игры.
        var ждём = ждётСоперника(match);
        var этоПроход = итогКлетки(match) === 1;
        if (!match.player1_id) p1Name = (этоПроход && match.player2_id) ? 'BYE' : '';
        if (!match.player2_id) p2Name = (этоПроход && match.player1_id) ? 'BYE' : '';
        // Проход без игры подсвечиваем по самой клетке, а не по записи в базе:
        // соперника нет — значит идёт дальше тот, кто стоит. Иначе у клетки
        // с непроставленным победителем имя оставалось тёмным, будто человек
        // проиграл.
        var проходП1 = !!match.player1_id && !match.player2_id && (isBye || isCompleted);
        var проходП2 = !!match.player2_id && !match.player1_id && (isBye || isCompleted);
        var p1Winner = (isCompleted && match.winner_id === match.player1_id) || проходП1;
        var p2Winner = (isCompleted && match.winner_id === match.player2_id) || проходП2;
        // Счёт правим у любой пары, даже если клетку по ошибке закрыли
        // проходом: иначе такую ошибку из админки не исправить.
        var canEdit = match.player1_id && match.player2_id;

        var matchClass = 'ad-brk-match';
        if (isCompleted) matchClass += ' completed';
        if (match.status === 'live') matchClass += ' live';

        var setData = parseSets(match.score);
        var html = '<div class="' + matchClass + '">';

        if (match.scheduled_time) {
            var schedInfo = match.scheduled_time.slice(0, 5);
            if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
            html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
        }

        var p1Class = 'ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : ''));
        // Номер сеяного пишем только рядом с человеком. Пустой слот — это
        // «соперника нет», и подпись «[22] BYE» вводила в заблуждение:
        // выглядело так, будто двадцать второй сеяный куда-то делся.
        html += '<div class="' + p1Class + '">' +
            (match.player1_id && match.seed1 ? '<span class="ad-brk-seed">[' + match.seed1 + ']</span>' : '') +
            '<span class="ad-brk-name">' + p1Name + '</span>' +
            '<span class="ad-brk-sets">';
        setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
        html += '</span></div>';

        var p2Class = 'ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : ''));
        html += '<div class="' + p2Class + '">' +
            (match.player2_id && match.seed2 ? '<span class="ad-brk-seed">[' + match.seed2 + ']</span>' : '') +
            '<span class="ad-brk-name">' + p2Name + '</span>' +
            '<span class="ad-brk-sets">';
        setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
        html += '</span></div>';
        if (setData.outcome) html += '<span class="ad-brk-outcome">' + setData.outcome + '</span>';

        // Полоса действия есть всегда, даже пустая. Иначе блоки получаются
        // разной высоты — у пары с проходом кнопки нет, — и позиция матчей
        // в следующем круге накапливает расхождение от круга к кругу.
        if (canEdit) {
            // Обе кнопки — в одну полосу. Второй строкой карточка становится
            // выше соседних, а вся раскладка держится на одинаковой высоте:
            // соединительные линии считаются от середины блока.
            var снятие = isCompleted && !isBye;
            if (снятие) html += '<div class="ad-brk-actions">';
            html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
            if (снятие) {
                html += '<button class="ad-brk-edit ad-brk-clear" data-match-clear="' +
                    match.id + '">' + (isEn ? 'Clear' : 'Снять') + '</button>';
                html += '</div>';
            }
        } else if (этоПроход) {
            // Настоящий проход: соперника не будет вовсе, человек идёт дальше
            // сам. Кнопок здесь нет — ни провести, ни отменить: отменять
            // нечего, клетка тут же закроется снова.
            html += '<div class="ad-brk-edit ad-brk-edit-empty">&nbsp;</div>';
        } else if (isCompleted && isBye && (match.player1_id || match.player2_id)) {
            // Проход поставлен руками — его можно снять.
            html += '<button class="ad-brk-edit" data-match-unbye="' + match.id + '">' +
                (isEn ? 'Undo' : 'Отменить проход') + '</button>';
        } else {
            html += '<div class="ad-brk-edit ad-brk-edit-empty">&nbsp;</div>';
        }

        html += '</div>';
        return html;
    }

    // ---- FIC Bracket Panel ----
    /** Сдвигает матчи за места под столбец их круга. */
    function выровнятьМатчиЗаМеста(корень) {
        if (!корень) return;
        корень.querySelectorAll('.ad-fic-section').forEach(function(блок) {
            var сетка = блок.querySelector('.ad-brk-grid');
            if (!сетка) return;
            var столбцы = Array.prototype.filter.call(сетка.children, function(e) {
                return e.classList.contains('ad-brk-round');
            });
            блок.querySelectorAll('.ad-brk-place').forEach(function(матч) {
                var цель = столбцы[parseInt(матч.getAttribute('data-round'), 10) - 1];
                if (!цель) return;
                // Дальше правого края не уводим: в сетке на 64 столбец финала
                // стоит так далеко, что карточка уезжала за экран и обрезалась.
                var сдвиг = цель.offsetLeft - сетка.offsetLeft;
                var предел = Math.max(0, блок.clientWidth - матч.offsetWidth - 8);
                матч.style.marginLeft = Math.min(сдвиг, предел) + 'px';
            });
        });
    }

    /** Есть ли в матче хоть один игрок. Пустые не рисуем: сетка строится на
     *  степень двойки, и при 24 участниках из 32 мест восемь пустуют. */
    function живой(m) { return !!(m && (m.player1_id || m.player2_id)); }

    // Сколько человек окажется в каждой клетке. Считает общий файл
    // bracket-draw.js — тот же счёт, что и в базе. Здесь только храним
    // ответ на время отрисовки.
    var итоги = {};

    function собратьИтоги(matches, drawSize) {
        итоги = {};
        var D = window.KSLT_DRAW;
        if (!D || !D.итоги) return;
        итоги = D.итоги(drawSize, matches.map(function(m) {
            return {
                круг: m.round_number,
                номер: m.match_order,
                людей: (m.player1_id ? 1 : 0) + (m.player2_id ? 1 : 0)
            };
        }));
    }

    /** Сколько человек в клетке окажется в итоге. */
    function итогКлетки(m) {
        var и = итоги[m.round_number + ':' + m.match_order];
        return и === undefined ? 2 : и;
    }

    /** Ждём ли ещё людей в эту клетку. */
    function ждётСоперника(m) {
        var стоит = (m.player1_id ? 1 : 0) + (m.player2_id ? 1 : 0);
        return итогКлетки(m) > стоит;
    }

    /** Есть ли в блоке хоть один человек: пустые блоки не показываем, они
     *  появятся сами, когда туда приедет первый проигравший. */
    function вБлокеЕстьЛюди(section, matches) {
        var клетки = [];
        section.rounds.forEach(function(rd) {
            клетки.push([rd.roundNum, rd.matchStart, rd.matchEnd]);
        });
        if (section.placeMatch) {
            клетки.push([section.placeMatch.roundNum,
                         section.placeMatch.matchOrder, section.placeMatch.matchOrder]);
        }
        return matches.some(function(m) {
            if (!m.player1_id && !m.player2_id) return false;
            return клетки.some(function(к) {
                return m.round_number === к[0] && m.match_order >= к[1] && m.match_order <= к[2];
            });
        });
    }

    // Кого уже провели, но он не доехал: победитель проставлен, а в клетке
    // следующего круга его нет.
    var _подтолкнули = {};

    function отставшиеОтСетки(matches, drawSize) {
        var D = window.KSLT_DRAW;
        if (!D || !D.адрес) return [];
        var по = {};
        matches.forEach(function(m) { по[m.round_number + ':' + m.match_order] = m; });
        var кругов = Math.round(Math.log(drawSize) / Math.log(2));
        var список = [];
        matches.forEach(function(m) {
            if (!m.winner_id || m.round_number >= кругов) return;
            var куда = D.адрес(drawSize, m.round_number, m.match_order, true);
            if (!куда) return;
            var цель = по[(m.round_number + 1) + ':' + куда];
            if (!цель) return;
            if (цель.player1_id !== m.winner_id && цель.player2_id !== m.winner_id) {
                список.push(m.id);
            }
        });
        return список;
    }

    /** Есть ли клетки, где человек стоит один и соперника не будет: их
     *  закрываем сами, без кнопок. */
    function естьНезакрытыеПроходы(matches) {
        return matches.some(function(m) {
            if (m.winner_id) return false;
            var стоит = (m.player1_id ? 1 : 0) + (m.player2_id ? 1 : 0);
            return стоит === 1 && итогКлетки(m) === 1;
        });
    }

    function renderFicBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap) {
        var drawSize = tournament.draw_size || 16;
        собратьИтоги(matches, drawSize);

        // Проход без игры проводим сами: человеку нечего решать, соперника
        // не будет. Закрываем в базе и перерисовываем.
        if (естьНезакрытыеПроходы(matches)) {
            A.client.rpc('fic_закрыть_проходы', { p_турнир: tournament.id })
                .then(function(r) {
                    if (!r.error) renderBracketManagement(tournament.id, 'bracket');
                });
        }

        // Самоисправление: победитель есть, а в своей клетке следующего круга
        // он не стоит. Так бывало после старых правок — человек оставался на
        // месте, и сетка вставала. Подталкиваем его один раз за отрисовку.
        var отставшие = отставшиеОтСетки(matches, drawSize);
        if (отставшие.length && !_подтолкнули[tournament.id]) {
            _подтолкнули[tournament.id] = true;
            Promise.all(отставшие.map(function(id) {
                return A.client.rpc('advance_bracket_winner', { p_match_id: id });
            })).then(function() {
                renderBracketManagement(tournament.id, 'bracket');
            });
        }
        var sections = getFicSections(drawSize, isEn ? 'en' : 'ru');
        var html = '';

        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [], outcome: '' };
            var ex = extractOutcome(score);
            var sets = ex.sets ? ex.sets.split(' ') : [];
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets, outcome: ex.outcome };
        }

        // Сколько человек на самом деле в сетке
        var вСетке = {};
        matches.forEach(function(m) {
            if (m.round_number !== 1) return;
            if (m.player1_id) вСетке[m.player1_id] = 1;
            if (m.player2_id) вСетке[m.player2_id] = 1;
        });
        var участников = Object.keys(вСетке).length || (tournament.draw_size || 0);

        sections.forEach(function(section) {
            // Прячем только те ветки, чьих мест в этом турнире не бывает:
            // сетка строится на степень двойки, и при 22 участниках из 32
            // мест десять выдуманные — ветки «25-28» и «29-32» пустуют
            // всегда. Ветки, где игроков ещё нет, но они там будут,
            // показываем: иначе половина сетки исчезает на середине турнира.
            if (section.первоеМесто > участников) return;
            // И пока в блоке нет ни одного человека — тоже не рисуем: блоки
            // появляются по мере игры, а не висят пустыми с самого начала.
            if (!вБлокеЕстьЛюди(section, matches)) return;

            html += '<div class="ad-fic-section">';
            html += '<div class="ad-fic-section-title">' + section.label + '</div>';

            // Mini SE bracket for this section
            html += '<div class="ad-brk-scroll"><div class="ad-brk-grid' +
                    (drawSize >= 64 ? ' ad-brk-grid--big' : '') + '">';

            // Круги у всех блоков общие: полуфинал за 5-8 место стоит под
            // общим полуфиналом, а матчи за места — в одном ряду с финалом.
            // Недостающие слева круги закрываем пустыми столбцами вместе с
            // узкой колонкой под соединительные линии: без неё блоки
            // расходятся с основной сеткой на её ширину.
            for (var пусто = 1; пусто < section.rounds[0].roundNum; пусто++) {
                html += '<div class="ad-brk-round">' +
                        '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>' +
                        '<div class="ad-brk-matches"></div></div>' +
                        '<div class="ad-brk-connector"></div>';
            }

            section.rounds.forEach(function(rd, ri) {
                var roundMatches = matches.filter(function(m) {
                    return m.round_number === rd.roundNum &&
                           m.match_order >= rd.matchStart &&
                           m.match_order <= rd.matchEnd;
                }).sort(function(a, b) { return a.match_order - b.match_order; });

                html += '<div class="ad-brk-round">';
                html += '<div class="ad-brk-title">' + rd.name + '</div>';
                html += '<div class="ad-brk-matches">';

                roundMatches.forEach(function(match) {
                    // Пустые клетки внутри живой ветки показываем как есть:
                    // там стоит BYE, и видно, что соперника не будет.
                    html += renderFicMatchCard(match, playersMap, parseSets, isDbl, regsMap);
                });

                html += '</div></div>';


                // Connector column between rounds (not after last)
                if (ri < section.rounds.length - 1) {
                    var pairCount = Math.floor(roundMatches.length / 2);
                    if (pairCount > 0) {
                        html += '<div class="ad-brk-connector">';
                        html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                        html += '<div class="ad-brk-connector-inner">';
                        for (var i = 0; i < pairCount; i++) {
                            html += '<div class="ad-brk-conn-pair">' +
                                '<div class="ad-brk-conn-top"></div>' +
                                '<div class="ad-brk-conn-mid"></div>' +
                                '<div class="ad-brk-conn-bottom"></div>' +
                            '</div>';
                        }
                        html += '</div></div>';
                    }
                }
            });

            html += '</div></div>'; // /ad-brk-grid /ad-brk-scroll

            // Матч за место — под сеткой ветки, в столбце своего круга.
            // Сдвиг считаем после отрисовки: между кругами стоят узкие
            // столбцы с линиями, и на глаз их ширину не угадать.
            if (section.placeMatch) {
                var pmЗдесь = matches.find(function(m) {
                    return m.round_number === section.placeMatch.roundNum &&
                           m.match_order === section.placeMatch.matchOrder;
                });
                if (pmЗдесь && живой(pmЗдесь)) {
                    html += '<div class="ad-brk-place" data-round="' +
                            section.placeMatch.roundNum +
                            '" style="margin-top:12px;max-width:220px;">';
                    html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' +
                            section.placeMatch.label + '</div>';
                    html += renderFicMatchCard(pmЗдесь, playersMap, parseSets, isDbl, regsMap);
                    html += '</div>';
                }
            }

            html += '</div>'; // /ad-fic-section
        });

        // Action buttons
        html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
        if (!anyCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
        }
        if (allCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize">' + L.finalizeTournament + '</button>';
        }
        html += '</div>';

        if (isTournamentCompleted) {
            html += '<div style="text-align:center;margin-top:16px;">' +
                '<span style="color:var(--accent);font-weight:600;">' + (isEn ? 'Tournament completed.' : 'Турнир завершён.') + '</span>' +
                '&nbsp;&nbsp;<button class="ad-btn ad-btn-sm ad-btn-secondary" id="adBrkRecalc">' + (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button>' +
            '</div>';
        }

        return html;
    }

    // ---- Results Panel (points summary) ----
    function renderResultsPanel(tournament, results, playersMap, matches, registrations, isDbl) {
        // Round labels for display
        var roundLabels = isEn
            ? { W: 'Winner', F: 'Finalist', '3RD': '3rd Place', '4TH': '4th Place', SF: 'Semifinal', QF: 'Quarterfinal', R16: 'Round of 16', R32: 'Round of 32', R64: 'Round of 64',
                G1: '1st in Group', G2: '2nd in Group', G3: '3rd in Group', G4: '4th in Group', G5: '5th in Group', G6: '6th in Group' }
            : { W: 'Победитель', F: 'Финалист', '3RD': '3-е место', '4TH': '4-е место', SF: 'Полуфинал', QF: 'Четвертьфинал', R16: '1/8 финала', R32: '1/16 финала', R64: '1/32 финала',
                G1: '1-е в группе', G2: '2-е в группе', G3: '3-е в группе', G4: '4-е в группе', G5: '5-е в группе', G6: '6-е в группе' };

        var roundOrder = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 5, QF: 6, R16: 7, R32: 8, R64: 9,
            G3: 10, G4: 11, G5: 12, G6: 13 };
        var placeByRound = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 4, QF: 5, R16: 9, R32: 17, R64: 33 };

        // Build registrations lookup for external player names
        var regsById = {};
        (registrations || []).forEach(function(r) {
            var key = r.player_id || ('ext_' + r.id);
            regsById[key] = r;
        });

        // Helper: get player display name with EXT badge
        function getResultName(playerId) {
            var p = playersMap[playerId];
            if (p) {
                var name = isEn ? (p.name_en || p.name) : p.name;
                return A.esc(name);
            }
            // Player not in playersMap — check registrations for external name
            var reg = regsById[playerId];
            if (reg && reg.is_external && reg.external_name) {
                return A.esc(reg.external_name) + ' <span style="background:#ff9800;color:#000;font-size:0.65rem;padding:1px 5px;border-radius:4px;margin-left:4px;font-weight:700;">EXT</span>';
            }
            return playerId || '?';
        }

        // Helper: get partner display for doubles
        function getPartnerDisplay(playerId) {
            if (!isDbl) return '';
            var reg = regsById[playerId];
            if (!reg) return '';
            if (reg.partner_id) {
                var pp = playersMap[reg.partner_id];
                if (pp) return ' / ' + A.esc(isEn ? (pp.name_en || pp.name) : pp.name);
                return ' / ?';
            }
            if (reg.partner_external_name) {
                return ' / ' + A.esc(reg.partner_external_name) +
                    ' <span style="background:#ff9800;color:#000;font-size:0.65rem;padding:1px 5px;border-radius:4px;margin-left:2px;font-weight:700;">EXT</span>';
            }
            return '';
        }

        // Sort results
        function sortResults(arr) {
            arr.sort(function(a, b) {
                var ptsA = a.points_earned || 0;
                var ptsB = b.points_earned || 0;
                if (ptsA !== ptsB) return ptsB - ptsA;
                var orderA = roundOrder[a.round_reached] || 99;
                var orderB = roundOrder[b.round_reached] || 99;
                return orderA - orderB;
            });
        }

        // Render a results table
        function renderTable(tableResults) {
            var tbl = '<div class="ad-table-card"><div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table">' +
                '<thead><tr>' +
                    '<th style="width:50px;">' + L.resPlace + '</th>' +
                    '<th>' + L.resPlayer + '</th>' +
                    '<th>' + L.resRound + '</th>' +
                    '<th style="text-align:right;">' + L.resPoints + '</th>' +
                '</tr></thead><tbody>';

            tableResults.forEach(function(r, idx) {
                var place = placeByRound[r.round_reached] || (idx + 1);
                var pName = getResultName(r.player_id) + getPartnerDisplay(r.player_id);
                var roundLabel = roundLabels[r.round_reached] || r.round_reached;
                var isWinner = r.round_reached === 'W';
                var isFinalist = r.round_reached === 'F';
                var isExt = !playersMap[r.player_id];

                var medal = '';
                if (place === 1) medal = '<span style="margin-right:4px;">🥇</span>';
                else if (place === 2) medal = '<span style="margin-right:4px;">🥈</span>';
                else if (place === 3) medal = '<span style="margin-right:4px;">🥉</span>';

                tbl += '<tr style="' + (isWinner ? 'background:rgba(204,255,0,0.08);' : '') + '">' +
                    '<td style="font-weight:600;text-align:center;">' + medal + place + '</td>' +
                    '<td style="' + (isWinner ? 'font-weight:700;color:var(--accent);' : (isFinalist ? 'font-weight:600;' : '')) + '">' + pName + '</td>' +
                    '<td>' + roundLabel + '</td>' +
                    '<td style="text-align:right;font-weight:700;' + (isExt ? 'color:var(--text-secondary);' : 'color:var(--accent);') + 'font-size:1.1rem;">' + (r.points_earned || 0) + '</td>' +
                '</tr>';
            });

            tbl += '</tbody></table></div></div>';
            return tbl;
        }

        // Total stats
        var totalPoints = 0;
        results.forEach(function(r) { totalPoints += r.points_earned || 0; });

        var html = '';

        // Summary header
        html += '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + L.resTotalPlayers + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">' + results.length + '</div>' +
            '</div>' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + (isEn ? 'Total Points Distributed' : 'Всего очков распределено') + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--accent);">' + totalPoints + '</div>' +
            '</div>' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + (isEn ? 'Tournament Level' : 'Уровень турнира') + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">' + (function() {
                    if (!tournament.level_id) return '—';
                    var lv = A.cachedLevels.find(function(l) { return l.id === tournament.level_id; });
                    return lv ? A.esc(isEn ? (lv.name_en || lv.name) : lv.name) : '—';
                })() + '</div>' +
            '</div>' +
        '</div>';

        // Group League: split by Высшая лига / Утешительная лига
        if (tournament.bracket_type === 'group_league' && matches && matches.length > 0) {
            // Determine PL / CL player IDs from matches
            var plPlayerIds = {};
            var clPlayerIds = {};
            matches.forEach(function(m) {
                if (isPLMatch(m)) {
                    if (m.player1_id) plPlayerIds[m.player1_id] = true;
                    if (m.player2_id) plPlayerIds[m.player2_id] = true;
                } else if (isCLMatch(m)) {
                    if (m.player1_id) clPlayerIds[m.player1_id] = true;
                    if (m.player2_id) clPlayerIds[m.player2_id] = true;
                }
            });

            // Filter and sort for doubles: captain-only results (skip partner duplicates from expandDoublesResults)
            var captainResults = isDbl ? results.filter(function(r) {
                return !!regsById[r.player_id]; // Only captain entries (those who have registration)
            }) : results;

            var plResults = captainResults.filter(function(r) { return plPlayerIds[r.player_id]; });
            var clResults = captainResults.filter(function(r) { return clPlayerIds[r.player_id]; });

            sortResults(plResults);
            sortResults(clResults);

            // Premier League section
            if (plResults.length > 0) {
                html += '<h3 style="margin:20px 0 12px;color:var(--accent);font-size:1.1rem;display:flex;align-items:center;gap:8px;">' +
                    '<span style="font-size:1.2rem;">🏆</span> ' +
                    (isEn ? 'Premier League' : 'Высшая лига') +
                    ' <span style="font-size:0.8rem;color:var(--text-secondary);font-weight:400;">(' + plResults.length + (isEn ? ' players' : ' уч.') + ')</span>' +
                '</h3>';
                html += renderTable(plResults);
            }

            // Consolation League section
            if (clResults.length > 0) {
                html += '<h3 style="margin:20px 0 12px;color:var(--text-secondary);font-size:1.1rem;display:flex;align-items:center;gap:8px;">' +
                    '<span style="font-size:1.2rem;">🎯</span> ' +
                    (isEn ? 'Consolation League' : 'Утешительная лига') +
                    ' <span style="font-size:0.8rem;color:var(--text-secondary);font-weight:400;">(' + clResults.length + (isEn ? ' players' : ' уч.') + ')</span>' +
                '</h3>';
                html += renderTable(clResults);
            }
        } else {
            // Standard results: single table
            // For doubles: show captain-only (partner is displayed inline via getPartnerDisplay)
            var displayResults = isDbl ? results.filter(function(r) {
                return !!regsById[r.player_id];
            }) : results;
            sortResults(displayResults);
            html += renderTable(displayResults);
        }

        return html;
    }

    /**
     * Отказать сразу нескольким заявкам — той же кнопкой, что раньше «удаляла».
     *
     * Статус ставим тот же, что при отказе по одной: отказ менеджера и уход
     * игрока — разные события, и в списке «Вне турнира» они подписаны по-разному.
     * Раньше здесь ставился withdrawn, и снятые менеджером выглядели так, будто
     * ушли сами.
     *
     * Очередь двигает общая `поднятьИзОчереди`. Свой подъём тут поднимал из
     * `pending`, хотя очередь давно живёт в `waitlist`, а `pending` — это заявка
     * на рассмотрении, которая место уже занимает. То есть поднимал не тех.
     */
    async function removeRegistrations(regIds, tournamentId) {
        var res = await A.client.from('tournament_registrations')
            .update({ status: 'rejected' }).in('id', regIds);
        if (res.error) { A.showToast(res.error.message, 'error'); return; }

        await сообщитьОЗаявках(regIds, 'rejected');
        await поднятьИзОчереди(tournamentId);

        A.showToast(isEn ? 'Entries rejected' : 'Заявкам отказано', 'success');
    }

    // Сносит матчи турнира и убеждается, что их не осталось.
    //
    // Молчаливый недосмотр здесь дорого стоит: если старые матчи уцелеют,
    // новая сетка ляжет поверх старой, и в таблице групп одна пара окажется
    // сразу в двух группах. Поэтому сначала отпускаем записи, которые держат
    // матчи, а после удаления пересчитываем — и если что-то осталось, лучше
    // остановиться и сказать об этом, чем рисовать кашу.
    async function снестиМатчиТурнира(tournamentId) {
        var спис = await A.client.from('matches').select('id').eq('tournament_id', tournamentId);
        if (спис.error) return { ok: false, message: спис.error.message };
        var ids = (спис.data || []).map(function(m) { return m.id; });
        if (!ids.length) return { ok: true };

        // Трансляция живёт своей жизнью: не удаляем её, а отвязываем от матча
        await A.client.from('live_matches').update({ match_id: null }).in('match_id', ids);

        var delRes = await A.client.from('matches').delete().eq('tournament_id', tournamentId);
        if (delRes.error) return { ok: false, message: delRes.error.message };

        var сколько = await A.client.from('matches')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId);
        if (сколько.error) return { ok: false, message: сколько.error.message };
        if (сколько.count) {
            return { ok: false, message: (isEn
                ? 'Old matches were not deleted: ' + сколько.count + ' left. Draw stopped.'
                : 'Старые матчи не удалились: осталось ' + сколько.count + '. Жеребьёвка остановлена.') };
        }
        return { ok: true };
    }

    // ---- Regenerate Draw ----
    async function regenerateDraw(tournament, tournamentId) {
        if (жеребимСейчас) {
            A.showToast(L.drawInProgress, 'warning');
            return;
        }
        жеребимСейчас = true;
        try {
            // 1. Delete all matches
            var снос = await снестиМатчиТурнира(tournamentId);
            if (!снос.ok) { A.showToast(снос.message, 'error'); return; }

            // 2. Reset registrations: draw → approved, clear group_number & seed_number
            await A.client.from('tournament_registrations').update({
                status: 'approved',
                group_number: null,
                seed_number: null,
                draw_position: null
            }).eq('tournament_id', tournamentId).eq('status', 'draw');

            // 3. Reset tournament status
            await A.client.from('tournaments').update({ status: 'registration_open' }).eq('id', tournamentId);

            // 4. Re-fetch tournament and registrations, then generate
            var tRes = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
            var freshTournament = tRes.data || tournament;

            var regRes = await A.client.from('tournament_registrations')
                .select('*, players:player_id(id, name, name_en, points, category_id)')
                .eq('tournament_id', tournamentId)
                .order('registered_at', { ascending: true });
            var registrations = regRes.data || [];

            var playerIds = [];
            registrations.forEach(function(r) { if (r.player_id) playerIds.push(r.player_id); });
            playerIds = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });
            var playersMap = {};
            if (playerIds.length > 0) {
                var plRes = await A.client.from('players')
                    .select('id, name, name_en, points, ntrp_singles, ntrp_doubles').in('id', playerIds);
                (plRes.data || []).forEach(function(p) { playersMap[p.id] = p; });
            }

            await генерироватьСетку(freshTournament, registrations, playersMap);
            renderBracketManagement(tournamentId);
        } catch (err) {
            console.error('Regenerate draw error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        } finally {
            жеребимСейчас = false;
        }
    }

    // ---- Generate Bracket Draw ----
    // Жеребьёвка идёт прямо сейчас. Два запуска подряд складывали две
    // раскладки в одну сетку: заявки оставались от последней, а матчи — от
    // обеих, и пара оказывалась сразу в двух группах
    var жеребимСейчас = false;

    async function generateBracketDraw(tournament, registrations, playersMap) {
        if (жеребимСейчас) {
            A.showToast(L.drawInProgress, 'warning');
            return;
        }
        жеребимСейчас = true;
        try {
            return await генерироватьСетку(tournament, registrations, playersMap);
        } finally {
            жеребимСейчас = false;
        }
    }

    async function генерироватьСетку(tournament, registrations, playersMap) {
        // Сетку рисуем только на пустом месте: остатки прежней дадут кашу,
        // где одна пара стоит сразу в двух группах
        var было = await A.client.from('matches')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);
        if (было.count) {
            A.showToast(isEn
                ? 'Matches already exist (' + было.count + '). Delete the draw first.'
                : 'Матчи уже есть (' + было.count + '). Сначала снеси прежнюю сетку.', 'error');
            return;
        }

        var drawSize = tournament.draw_size || 16;
        var bracketType = tournament.bracket_type || 'single_elimination';
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;

        // Get approved registrations
        var isDbl = isDoublesTournament(tournament);
        var approved = registrations.filter(function(r) { return r.status === 'approved'; });

        // Doubles: filter out unpaired registrations
        if (isDbl) {
            var paired = approved.filter(function(r) { return r.partner_id || r.partner_external_name; });
            var unpairedCount = approved.length - paired.length;
            if (unpairedCount > 0) {
                A.showToast((isEn ? 'Excluded ' : 'Исключено ') + unpairedCount + (isEn ? ' unpaired registrations' : ' незапаренных заявок'), 'warning');
            }
            approved = paired;
        }

        if (approved.length < 2) {
            A.showToast(isEn ? 'Need at least 2 approved players' : 'Нужно минимум 2 одобренных игрока', 'error');
            return;
        }

        // ---- Ручной посев в нерейтинговых турнирах ----
        //
        // Здесь рейтинга нет, поэтому сеет человек: он знает, кто на площадке
        // сильнее. Пока сеяных меньше нормы, жеребить нечего — сеяные должны
        // разойтись по группам по одному
        if (посевРуками(tournament)) {
            var норма = нормаСеяных(tournament);
            var сеяные = approved.filter(function(r) { return r.seed_number; })
                .sort(function(a, b) { return Number(a.seed_number) - Number(b.seed_number); });

            if (сеяные.length < норма) {
                // Отказ окном, а не всплывашкой: жеребьёвку жмут раз в турнир,
                // и причину надо прочесть, а не поймать взглядом
                A.showNotice(L.regSeedNotEnoughTitle,
                    '<p style="margin:0;">' + L.regSeedNotEnough
                        .replace('{n}', сеяные.length).replace('{m}', норма) + '</p>',
                    null, 'warn');
                return;
            }

            var прочие = approved.filter(function(r) { return !r.seed_number; });
            for (var пi = прочие.length - 1; пi > 0; пi--) {
                var пj = Math.floor(Math.random() * (пi + 1));
                var пt = прочие[пi]; прочие[пi] = прочие[пj]; прочие[пj] = пt;
            }
            approved = сеяные.concat(прочие);
        } else

        // Sort by points DESC (seeded first); doubles: NTRP sum, fallback to points
        if (isDbl) {
            approved.sort(function(a, b) {
                var ntrpA = getTeamNtrp(a, playersMap);
                var ntrpB = getTeamNtrp(b, playersMap);
                if (ntrpA || ntrpB) {
                    if ((ntrpB || 0) !== (ntrpA || 0)) return (ntrpB || 0) - (ntrpA || 0);
                    // Суммы равны — выше та пара, у кого сильнее первый номер:
                    // 4.5 и 3 играют сильнее, чем 4 и 3.5, хотя сумма одна
                    var стA = сильнейшийВПаре(a, playersMap);
                    var стB = сильнейшийВПаре(b, playersMap);
                    if (стB !== стA) return стB - стA;
                }
                return getTeamPoints(b, playersMap) - getTeamPoints(a, playersMap);
            });
        } else {
            // Посев по очкам в категории ТУРНИРА: гость из нижней категории
            // сеется по тому, что набрал здесь, а не по своим домашним очкам
            var catPoints = {};
            if (tournament.category_id) {
                var pcIds = approved.map(function(r) { return r.player_id; }).filter(Boolean);
                if (pcIds.length > 0) {
                    var pcRes = await A.client.from('player_categories')
                        .select('player_id, points')
                        .eq('category_id', tournament.category_id)
                        .in('player_id', pcIds);
                    (pcRes.data || []).forEach(function(r) { catPoints[r.player_id] = r.points || 0; });
                }
            }
            approved.sort(function(a, b) {
                var pA = catPoints[a.player_id] || 0;
                var pB = catPoints[b.player_id] || 0;
                if (pB !== pA) return pB - pA;
                // Очки равны — выше тот, у кого сильнее одиночный NTRP.
                // То же правило, что в таблице рейтинга
                var nA = Number((playersMap[a.player_id] || {}).ntrp_singles || 0);
                var nB = Number((playersMap[b.player_id] || {}).ntrp_singles || 0);
                return nB - nA;
            });
        }

        // Dispatch to group draw for round_robin
        if (bracketType === 'round_robin') {
            await generateGroupDraw(tournament, approved, playersMap);
            return;
        }

        // Dispatch to group_league draw
        if (bracketType === 'group_league') {
            await generateGroupLeagueDraw(tournament, approved, playersMap);
            return;
        }

        // Dispatch to FIC draw
        if (bracketType === 'fic') {
            await generateFicDraw(tournament, approved, playersMap);
            return;
        }

        // Determine seed count
        var seedCount = 0;
        if (bracketType === 'single_elimination') {
            seedCount = drawSize >= 32 ? 8 : (drawSize >= 16 ? 4 : 2);
            seedCount = Math.min(seedCount, approved.length);
        }

        // Seed positions from SEED_POSITIONS (global from tournament-generator.js)
        var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
            ? SEED_POSITIONS[drawSize]
            : (drawSize === 8 ? [1, 8, 5, 4] : [1, 16, 9, 8]);

        // Build draw array
        var draw = new Array(drawSize);
        for (var i = 0; i < drawSize; i++) draw[i] = null;

        // Place seeded players
        for (var s = 0; s < seedCount && s < seedPositions.length; s++) {
            draw[seedPositions[s] - 1] = {
                player_id: approved[s].player_id,
                seed: s + 1,
                reg_id: approved[s].id
            };
        }

        // Fisher-Yates shuffle for unseeded
        var unseeded = approved.slice(seedCount);
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i];
            unseeded[i] = unseeded[j];
            unseeded[j] = tmp;
        }

        // Fill empty slots
        var emptySlots = [];
        for (var i = 0; i < drawSize; i++) {
            if (draw[i] === null) emptySlots.push(i);
        }
        for (var i = 0; i < unseeded.length && i < emptySlots.length; i++) {
            draw[emptySlots[i]] = {
                player_id: unseeded[i].player_id,
                seed: null,
                reg_id: unseeded[i].id
            };
        }

        // Generate matches
        var totalRounds = Math.log2(drawSize);
        var matchesToInsert = [];

        // First round
        var matchOrder = 0;
        for (var i = 0; i < drawSize; i += 2) {
            matchOrder++;
            var slot1 = draw[i];
            var slot2 = draw[i + 1];

            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: slot1 ? slot1.player_id : null,
                player2_id: slot2 ? slot2.player_id : null,
                round: 'R1',
                round_number: 1,
                match_order: matchOrder,
                status: 'upcoming',
                seed1: slot1 ? slot1.seed : null,
                seed2: slot2 ? slot2.seed : null
            });
        }

        // Subsequent rounds (empty)
        for (var r = 2; r <= totalRounds; r++) {
            var matchesInRound = drawSize / Math.pow(2, r);
            for (var m = 1; m <= matchesInRound; m++) {
                var roundPrefix = r === totalRounds ? 'F' :
                                  r === totalRounds - 1 ? 'SF' :
                                  r === totalRounds - 2 ? 'QF' : 'R' + r;
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: null,
                    player2_id: null,
                    round: roundPrefix,
                    round_number: r,
                    match_order: m,
                    status: 'upcoming',
                    seed1: null,
                    seed2: null
                });
            }
        }

        // 3rd place match (between SF losers)
        matchesToInsert.push({
            tournament_id: tournament.id,
            player1_id: null,
            player2_id: null,
            round: '3RD',
            round_number: totalRounds,
            match_order: 0,
            status: 'upcoming',
            seed1: null,
            seed2: null
        });

        // Handle BYEs in first round: if one player is null, auto-advance
        for (var i = 0; i < matchesToInsert.length; i++) {
            var match = matchesToInsert[i];
            if (match.round_number !== 1) continue;

            if (match.player1_id && !match.player2_id) {
                match.winner_id = match.player1_id;
                match.status = 'completed';
                match.score = 'BYE';
            } else if (!match.player1_id && match.player2_id) {
                match.winner_id = match.player2_id;
                match.status = 'completed';
                match.score = 'BYE';
            }
        }

        // Insert matches into DB
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Auto-advance BYE winners to round 2
        var r1Matches = matchesToInsert.filter(function(m) { return m.round_number === 1; });
        var r2Matches = matchesToInsert.filter(function(m) { return m.round_number === 2; });

        // We need the actual inserted match IDs to update round 2
        // Re-fetch matches from DB
        var freshRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var freshMatches = freshRes.data || [];

        // Advance BYE winners
        var r1Fresh = freshMatches.filter(function(m) { return m.round_number === 1; });
        var r2Fresh = freshMatches.filter(function(m) { return m.round_number === 2; });

        for (var i = 0; i < r1Fresh.length; i++) {
            var m = r1Fresh[i];
            if (m.winner_id && m.score === 'BYE') {
                // Match i in R1 → goes to match ceil((i+1)/2) in R2, slot depends on odd/even
                var nextMatchIdx = Math.floor(i / 2);
                if (nextMatchIdx < r2Fresh.length) {
                    var nextMatch = r2Fresh[nextMatchIdx];
                    var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                    var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                    var updateData = {};
                    updateData[updateField] = m.winner_id;
                    updateData[seedField] = (i % 2 === 0) ? m.seed1 : m.seed2;
                    await A.client.from('matches').update(updateData).eq('id', nextMatch.id);
                }
            }
        }

        // Update tournament_registrations with seed_number and draw_position
        for (var i = 0; i < drawSize; i++) {
            if (draw[i]) {
                await A.client.from('tournament_registrations').update({
                    seed_number: draw[i].seed,
                    draw_position: i + 1
                }).eq('id', draw[i].reg_id);
            }
        }

        // Auto-assign schedule (court + time) for generated matches
        await assignSchedule(tournament);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    // ---- Generate FIC (Full Individual Consolation) Draw ----
    async function generateFicDraw(tournament, approved, playersMap) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.round(Math.log(drawSize) / Math.log(2));
        var halfDraw = drawSize / 2;
        var D = window.KSLT_DRAW;

        if (!D) {
            A.showToast('Не загружен js/bracket-draw.js', 'error');
            return;
        }

        // Зерно жеребьёвки заводим один раз и храним с турниром: пересборка
        // сетки должна давать ту же расстановку, а не новую.
        var зерно = tournament.draw_seed;
        if (!зерно) {
            зерно = D.новоеЗерно();
            await A.client.from('tournaments').update({ draw_seed: зерно }).eq('id', tournament.id);
            tournament.draw_seed = зерно;
        }

        // Раскладка по линиям сетки: сеяные на постоянных местах, проходы
        // без игры верхним сеяным, остальные по свободным линиям тем же
        // жребием. Считает общий файл, его же проверяет tools/check-draw.js.
        var участники = approved.map(function(r) {
            return { player_id: r.player_id, reg_id: r.id };
        });
        var линии = D.разложить(drawSize, участники, зерно);
        var сеяных = Math.min(D.сколькоСеяных(drawSize), участники.length);

        var посевПоИгроку = {};
        участники.forEach(function(у, i) {
            if (i < сеяных) посевПоИгроку[у.player_id] = i + 1;
        });

        var matchesToInsert = [];

        // Первый круг: пары по линиям
        for (var i = 0; i < drawSize; i += 2) {
            var slot1 = линии[i];
            var slot2 = линии[i + 1];
            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: slot1 ? slot1.player_id : null,
                player2_id: slot2 ? slot2.player_id : null,
                round: 'FIC-R1',
                round_number: 1,
                match_order: (i / 2) + 1,
                status: 'upcoming',
                seed1: slot1 ? (посевПоИгроку[slot1.player_id] || null) : null,
                seed2: slot2 ? (посевПоИгроку[slot2.player_id] || null) : null
            });
        }

        // Остальные круги — пустые клетки, их заполнит перевод по матчам
        for (var r = 2; r <= totalRounds; r++) {
            for (var m = 1; m <= halfDraw; m++) {
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: null,
                    player2_id: null,
                    round: 'FIC-R' + r,
                    round_number: r,
                    match_order: m,
                    status: 'upcoming',
                    seed1: null,
                    seed2: null
                });
            }
        }


        // Insert matches into DB
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Re-fetch matches from DB to get IDs
        var freshRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var freshMatches = freshRes.data || [];

        // Проходы без игры отмечаем отдельным изменением, а не при вставке:
        // расстановка в базе срабатывает на изменение матча, и записанный
        // сразу победитель никуда не двигался.
        var проходы = freshMatches.filter(function(m) {
            return m.round_number === 1 && !m.winner_id &&
                   ((m.player1_id && !m.player2_id) || (!m.player1_id && m.player2_id));
        });
        for (var i = 0; i < проходы.length; i++) {
            await A.client.from('matches').update({
                winner_id: проходы[i].player1_id || проходы[i].player2_id,
                score: 'BYE',
                status: 'completed',
                played_at: new Date().toISOString()
            }).eq('id', проходы[i].id);
        }
        if (проходы.length) {
            freshRes = await A.client.from('matches')
                .select('*')
                .eq('tournament_id', tournament.id)
                .order('round_number').order('match_order');
            freshMatches = freshRes.data || [];
        }

        // Посев и линия сетки — в заявку, чтобы их было видно в списке
        for (var i = 0; i < drawSize; i++) {
            var слот = линии[i];
            if (слот) {
                await A.client.from('tournament_registrations').update({
                    seed_number: посевПоИгроку[слот.player_id] || null,
                    draw_position: i + 1
                }).eq('id', слот.reg_id);
            }
        }

        // Auto-assign schedule
        await assignFicSchedule(tournament);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    // ---- Round-Robin Rounds (circle method) ----
    // Returns array of rounds, each round is array of {p1, p2} pairs
    // Players don't appear twice in the same round
    function generateRoundRobinRounds(players) {
        var n = players.length;
        if (n < 2) return [];

        // If odd, add a dummy (BYE) player that we'll filter out
        var list = players.slice();
        var hasGhost = false;
        if (n % 2 !== 0) {
            list.push(null); // ghost/BYE
            hasGhost = true;
            n = list.length;
        }

        var rounds = [];
        var numRounds = n - 1;
        var half = n / 2;

        // Fix first player, rotate the rest (circle method)
        // positions[0] is fixed, positions[1..n-1] rotate
        var positions = [];
        for (var i = 0; i < n; i++) positions.push(i);

        for (var r = 0; r < numRounds; r++) {
            var roundPairs = [];
            for (var i = 0; i < half; i++) {
                var p1Idx = positions[i];
                var p2Idx = positions[n - 1 - i];
                var p1 = list[p1Idx];
                var p2 = list[p2Idx];
                // Skip if either is ghost (BYE)
                if (p1 === null || p2 === null) continue;
                roundPairs.push({ p1: p1, p2: p2 });
            }
            rounds.push(roundPairs);

            // Rotate: keep positions[0] fixed, shift rest clockwise
            var last = positions[n - 1];
            for (var i = n - 1; i > 1; i--) {
                positions[i] = positions[i - 1];
            }
            positions[1] = last;
        }

        return rounds;
    }

    // ---- Generate Group Draw (Round-Robin) ----
    async function generateGroupDraw(tournament, approvedSorted, playersMap) {
        var groupCount = tournament.group_count || 2;
        var maxPart = tournament.max_participants || approvedSorted.length;

        // Take only main draw (first maxPart players), rest = waitlist
        var mainDraw = approvedSorted.slice(0, maxPart);
        var totalPlayers = mainDraw.length;

        if (groupCount < 2) {
            A.showToast(isEn ? 'Need at least 2 groups' : 'Нужно минимум 2 группы', 'error');
            return;
        }
        if (totalPlayers < groupCount * 2) {
            A.showToast(isEn ? 'Need at least 2 players per group' : 'Нужно минимум 2 игрока в группе', 'error');
            return;
        }

        // Seed count: top N players (1 per group)
        var seedCount = Math.min(groupCount, totalPlayers);

        // Split: seeded (top N) + unseeded (rest shuffled)
        var seeded = mainDraw.slice(0, seedCount);
        var unseeded = mainDraw.slice(seedCount);

        // Fisher-Yates shuffle unseeded
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i];
            unseeded[i] = unseeded[j];
            unseeded[j] = tmp;
        }

        // Combined list: seeded first, then shuffled unseeded
        var allPlayers = seeded.concat(unseeded);

        // S-curve (snake) distribution into groups
        // Incomplete last pass fills from group A forward (not snake-reversed)
        var groups = [];
        for (var g = 0; g < groupCount; g++) groups.push([]);

        var fullPasses = Math.floor(allPlayers.length / groupCount);
        var remainder = allPlayers.length % groupCount;

        for (var idx = 0; idx < allPlayers.length; idx++) {
            var pass = Math.floor(idx / groupCount);
            var posInPass = idx % groupCount;
            var groupIdx;
            if (pass < fullPasses) {
                // Full passes: snake pattern
                groupIdx = (pass % 2 === 0) ? posInPass : (groupCount - 1 - posInPass);
            } else {
                // Incomplete last pass: fill A, B, C... forward
                groupIdx = posInPass;
            }
            groups[groupIdx].push({
                reg: allPlayers[idx],
                seed: idx < seedCount ? (idx + 1) : null
            });
        }

        // Generate round-robin matches using circle method (non-conflicting pairs per round)
        var matchesToInsert = [];
        for (var g = 0; g < groupCount; g++) {
            var gPlayers = groups[g];
            var rrRounds = generateRoundRobinRounds(gPlayers);
            var matchOrder = 0;

            for (var rr = 0; rr < rrRounds.length; rr++) {
                for (var mp = 0; mp < rrRounds[rr].length; mp++) {
                    matchOrder++;
                    var pair = rrRounds[rr][mp];
                    matchesToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: pair.p1.reg.player_id,
                        player2_id: pair.p2.reg.player_id,
                        round: 'G' + (g + 1),
                        round_number: rr + 1,
                        match_order: matchOrder,
                        group_number: g + 1,
                        status: 'upcoming',
                        seed1: pair.p1.seed,
                        seed2: pair.p2.seed
                    });
                }
            }
        }

        // Insert matches
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Update registrations: group_number, seed_number, status → draw (batch)
        var regUpdates = [];
        for (var g = 0; g < groupCount; g++) {
            for (var p = 0; p < groups[g].length; p++) {
                var entry = groups[g][p];
                regUpdates.push(
                    A.client.from('tournament_registrations').update({
                        group_number: g + 1,
                        seed_number: entry.seed,
                        status: 'draw'
                    }).eq('id', entry.reg.id)
                );
            }
        }
        await Promise.all(regUpdates);

        // Сетка плей-офф создаётся здесь же, пустой: имён пока нет, но
        // известно, кто куда придёт. Дальше она заполняется сама, по мере
        // того как группы доигрывают
        if (tournament.bracket_type === 'round_robin') {
            await создатьПустойПлейофф(tournament, groupCount);
        }

        // Auto-assign schedule
        await assignGroupSchedule(tournament, matchesToInsert.length);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    /**
     * Пустая сетка плей-офф — сразу после жеребьёвки групп.
     *
     * Раньше её собирали в конце, когда доиграна последняя группа: до этого
     * никто не знал ни своих соперников, ни того, кому достанется проход без
     * игры. А всё известно заранее: сколько групп, сколько выходит, какой
     * формат — из настроек турнира.
     *
     * Игроков не ставим, ставим метки: «A1» — победитель группы A, «B2» —
     * второе место группы B, «IG1» — победитель первого доп. матча. Когда
     * группа доигрывает, `заполнитьСлоты` подставляет имена.
     *
     * Расстановка та же, что и при ручной сборке: победители групп идут на
     * позиции посева, слабейшие — к верхним сеяным, земляки не сводятся.
     */
    async function создатьПустойПлейофф(tournament, groupCount) {
        var qualifiers = tournament.qualifiers_per_group || 2;
        var букв = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        // Прямые: места 1..qualifiers из каждой группы
        var прямые = [];
        for (var м = 1; м <= qualifiers; м++) {
            for (var г = 0; г < groupCount; г++) {
                прямые.push({ метка: (букв[г] || (г + 1)) + м, группа: г, место: м });
            }
        }
        if (прямые.length < 2) return;

        var размер = 2;
        while (размер < прямые.length) размер *= 2;
        var свободно = размер - прямые.length;

        // Доп. матчи: разыгрывают свободные места между теми, кто не прошёл.
        // Сильнейшие из них проходят без игры — как сеяные в квалификации
        // Что делать со свободными местами, решает настройка турнира. По
        // умолчанию их разыгрывают доп. матчами: место должно достаться за
        // победу. Клуб может выбрать «Прямой» — тогда сильнейшие просто
        // проходят первый круг без игры
        var формат = tournament.playoff_format || 'ig';
        var допМатчи = [];
        var черезДоп = [];
        if (формат !== 'direct' && свободно > 0) {
            // Претенденты — те, кто занял место сразу под проходным. Кто из
            // них сильнее, до конца групп неизвестно, поэтому метки не
            // привязаны к группе: Q1 — лучший из них, Q2 — следующий и так
            // далее. Иначе мы бы решили за результат: отправили бы в доп.
            // матч того, кто на деле оказался сильнейшим
            var всегоПретендентов = groupCount;
            var матчей = Math.max(0, Math.min(всегоПретендентов, свободно * 2) - свободно);
            var безИгры = свободно - матчей;

            var номерQ = 1;
            for (var б = 0; б < безИгры; б++) {
                черезДоп.push({ метка: 'Q' + номерQ, группа: -1 });
                номерQ++;
            }
            // Остальные играют между собой: сильнейший из оставшихся со
            // слабейшим, как в квалификации
            var очередь = [];
            for (var о = 0; о < матчей * 2; о++) { очередь.push('Q' + номерQ); номерQ++; }
            for (var д = 0; д < матчей; д++) {
                var сильный = очередь[д];
                var слабый = очередь[очередь.length - 1 - д];
                if (!сильный || !слабый || сильный === слабый) break;
                допМатчи.push({ первый: { метка: сильный }, второй: { метка: слабый }, номер: д + 1 });
                черезДоп.push({ метка: 'IG' + (д + 1), группа: -1 });
            }
        }

        var все = прямые.concat(черезДоп);
        var byeCount = Math.max(0, размер - все.length);

        var позицииПосева = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[размер])
            ? SEED_POSITIONS[размер]
            : (размер === 16 ? [1, 16, 9, 8, 5, 12, 13, 4]
                : (размер === 8 ? [1, 8, 5, 4] : (размер === 4 ? [1, 4, 3, 2] : [1, 2])));

        var сетка = new Array(размер);
        for (var и = 0; и < размер; и++) сетка[и] = null;

        // Победители групп — на позиции посева
        var первыеМеста = все.filter(function(у) { return у.место === 1; });
        var остальные = все.filter(function(у) { return у.место !== 1; });
        for (var с = 0; с < первыеМеста.length && с < позицииПосева.length; с++) {
            сетка[позицииПосева[с] - 1] = { метка: первыеМеста[с].метка, группа: первыеМеста[с].группа, посев: с + 1 };
        }

        // Проход без игры — соперникам верхних сеяных
        var занятоBye = {};
        for (var б2 = 0; б2 < byeCount && б2 < позицииПосева.length; б2++) {
            var идх = позицииПосева[б2] - 1;
            занятоBye[(идх % 2 === 0) ? идх + 1 : идх - 1] = true;
        }

        // Слабейшие первыми, и на самые трудные места — как в ручной сборке
        остальные.sort(function(a, b) { return (b.место || 99) - (a.место || 99); });

        var свободныеСлоты = [];
        for (var сл = 0; сл < размер; сл++) {
            if (!сетка[сл] && !занятоBye[сл]) свободныеСлоты.push(сл);
        }
        var силаСлота = {};
        свободныеСлоты.forEach(function(слот) {
            var сосед = сетка[(слот % 2 === 0) ? слот + 1 : слот - 1];
            силаСлота[слот] = сосед && сосед.посев ? сосед.посев : 999;
        });
        свободныеСлоты.sort(function(a, b) { return силаСлота[a] - силаСлота[b]; });

        остальные.forEach(function(у) {
            // Земляков не сводим: они уже играли в группе
            var выбран = -1;
            for (var к = 0; к < свободныеСлоты.length; к++) {
                var слот = свободныеСлоты[к];
                var сосед = сетка[(слот % 2 === 0) ? слот + 1 : слот - 1];
                if (сосед && у.группа >= 0 && сосед.группа === у.группа) continue;
                выбран = к;
                break;
            }
            if (выбран === -1) выбран = 0;
            if (!свободныеСлоты.length) return;
            сетка[свободныеСлоты[выбран]] = { метка: у.метка, группа: у.группа, посев: null };
            свободныеСлоты.splice(выбран, 1);
        });

        // ---- Матчи ----
        var кВставке = [];
        var порядок = 0;

        допМатчи.forEach(function(дм) {
            порядок++;
            кВставке.push({
                tournament_id: tournament.id,
                player1_id: null, player2_id: null,
                slot1_label: дм.первый.метка, slot2_label: дм.второй.метка,
                round: 'IG', round_number: 1, match_order: порядок,
                group_number: null, status: 'upcoming'
            });
        });

        var кругов = Math.log2(размер);
        порядок = 0;
        for (var сл2 = 0; сл2 < размер; сл2 += 2) {
            порядок++;
            var л = сетка[сл2], пр = сетка[сл2 + 1];
            кВставке.push({
                tournament_id: tournament.id,
                player1_id: null, player2_id: null,
                slot1_label: л ? л.метка : null,
                slot2_label: пр ? пр.метка : null,
                round: 'R1', round_number: 1, match_order: порядок,
                group_number: null, status: 'upcoming',
                seed1: л ? л.посев : null, seed2: пр ? пр.посев : null
            });
        }

        for (var р = 2; р <= кругов; р++) {
            var вКруге = размер / Math.pow(2, р);
            for (var м2 = 1; м2 <= вКруге; м2++) {
                кВставке.push({
                    tournament_id: tournament.id,
                    player1_id: null, player2_id: null,
                    round: р === кругов ? 'F' : (р === кругов - 1 ? 'SF' : (р === кругов - 2 ? 'QF' : 'R' + р)),
                    round_number: р, match_order: м2,
                    group_number: null, status: 'upcoming'
                });
            }
        }

        // Матч за третье место
        кВставке.push({
            tournament_id: tournament.id,
            player1_id: null, player2_id: null,
            round: '3RD', round_number: кругов, match_order: 99,
            group_number: null, status: 'upcoming'
        });

        var ответ = await A.client.from('matches').insert(кВставке);
        if (ответ.error) {
            console.warn('[KSLT] пустую сетку плей-офф создать не удалось:', ответ.error.message);
        }
    }

    /**
     * Поставить людей в слоты, которые их ждут.
     *
     * Слот помечен «A1» или «IG2»: победитель группы A, победитель второго
     * доп. матча. Как только источник известен — группа доиграна или доп.
     * матч сыгран, — метка превращается в имя.
     *
     * Возвращает true, если что-то заполнили: тогда сетку нужно перечитать.
     */
    async function заполнитьСлоты(tournament, matches) {
        var сМетками = matches.filter(function(m) {
            return (m.slot1_label && !m.player1_id) || (m.slot2_label && !m.player2_id);
        });
        if (!сМетками.length) return false;

        var букв = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var кто = {};

        // Места в доигранных группах
        var grpMatches = matches.filter(isGroupMatch);
        var groupCount = tournament.group_count || 2;
        for (var г = 1; г <= groupCount; г++) {
            var мг = grpMatches.filter(function(m) { return m.group_number === г; });
            if (!мг.length) continue;
            if (!мг.every(function(m) { return m.status === 'completed'; })) continue;

            var игроки = [];
            мг.forEach(function(m) {
                if (m.player1_id && игроки.indexOf(m.player1_id) === -1) игроки.push(m.player1_id);
                if (m.player2_id && игроки.indexOf(m.player2_id) === -1) игроки.push(m.player2_id);
            });
            calculateGroupStandings(игроки, мг, {}).forEach(function(ст) {
                кто[(букв[г - 1] || г) + ст.place] = ст.playerId;
            });
        }

        // Претенденты по силе: Q1 — лучший из тех, кто не прошёл напрямую.
        // Ранжировать их можно только когда доиграны все группы: пока хоть
        // одна в игре, порядок может перевернуться
        var qualifiers = tournament.qualifiers_per_group || 2;
        var всеГруппыСыграны = true;
        var претенденты = [];
        for (var гп = 1; гп <= groupCount; гп++) {
            var мгп = grpMatches.filter(function(m) { return m.group_number === гп; });
            if (!мгп.length) continue;
            if (!мгп.every(function(m) { return m.status === 'completed'; })) { всеГруппыСыграны = false; break; }

            var игрокиП = [];
            мгп.forEach(function(m) {
                if (m.player1_id && игрокиП.indexOf(m.player1_id) === -1) игрокиП.push(m.player1_id);
                if (m.player2_id && игрокиП.indexOf(m.player2_id) === -1) игрокиП.push(m.player2_id);
            });
            calculateGroupStandings(игрокиП, мгп, {}).forEach(function(ст) {
                if (ст.place === qualifiers + 1) претенденты.push(ст);
            });
        }
        if (всеГруппыСыграны && претенденты.length) {
            претенденты.sort(function(a, b) {
                if (b.wins !== a.wins) return b.wins - a.wins;
                var aс = a.setsWon + a.setsLost > 0 ? a.setsWon / (a.setsWon + a.setsLost) : 0;
                var bс = b.setsWon + b.setsLost > 0 ? b.setsWon / (b.setsWon + b.setsLost) : 0;
                if (bс !== aс) return bс - aс;
                var aг = a.gamesWon + a.gamesLost > 0 ? a.gamesWon / (a.gamesWon + a.gamesLost) : 0;
                var bг = b.gamesWon + b.gamesLost > 0 ? b.gamesWon / (b.gamesWon + b.gamesLost) : 0;
                return bг - aг;
            });
            претенденты.forEach(function(ст, и) { кто['Q' + (и + 1)] = ст.playerId; });
        }

        // Победители доп. матчей
        matches.filter(isIGMatch).forEach(function(m, i) {
            if (m.status === 'completed' && m.winner_id) {
                кто['IG' + (m.match_order || (i + 1))] = m.winner_id;
            }
        });

        var правки = [];
        сМетками.forEach(function(m) {
            var изменения = {};
            if (m.slot1_label && !m.player1_id && кто[m.slot1_label]) изменения.player1_id = кто[m.slot1_label];
            if (m.slot2_label && !m.player2_id && кто[m.slot2_label]) изменения.player2_id = кто[m.slot2_label];
            if (Object.keys(изменения).length) {
                правки.push(A.client.from('matches').update(изменения).eq('id', m.id));
            }
        });

        if (!правки.length) return false;
        await Promise.all(правки);
        return true;
    }

    // ---- Playoff Format Modal (auto-detect IG vs Direct based on group sizes) ----
    function showPlayoffFormatModal(tournament, matches, playersMap, tournamentId) {
        var groupCount = tournament.group_count || 2;
        var qualifiers = tournament.qualifiers_per_group || 2;
        var grpMatches = matches.filter(isGroupMatch);

        // Detect group sizes and IG candidates
        var has3PlayerGroups = false;
        var candidateCount = 0;
        for (var g = 1; g <= groupCount; g++) {
            var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
            var pids = [];
            groupMatchesG.forEach(function(m) {
                if (m.player1_id && pids.indexOf(m.player1_id) === -1) pids.push(m.player1_id);
                if (m.player2_id && pids.indexOf(m.player2_id) === -1) pids.push(m.player2_id);
            });
            if (pids.length <= 3) {
                has3PlayerGroups = true;
                if (pids.length >= 3) candidateCount++;
            }
        }

        var directCount = groupCount * qualifiers;
        var dSize = 2;
        while (dSize < directCount) dSize *= 2;
        var freeSlots = dSize - directCount;
        var hasCandidates = has3PlayerGroups && candidateCount > 0;

        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';

        var infoHtml = '<p style="margin-bottom:8px;">' + L.igDirectQualifiers + ': <b>' + directCount + '</b></p>';
        if (hasCandidates) {
            infoHtml += '<p style="margin-bottom:8px;">' + L.igCandidates + ': <b>' + candidateCount + '</b></p>';
            infoHtml += '<p style="margin-bottom:8px;">' + L.candidateFreeSlots + ': <b>' + freeSlots + '</b></p>';
        }

        overlay.innerHTML =
            '<div class="ad-confirm-modal">' +
                '<div class="ad-confirm-title">' + L.playoffFormatTitle + '</div>' +
                '<div class="ad-confirm-text" style="text-align:left;margin-bottom:16px;color:var(--text-secondary);">' + infoHtml + '</div>' +
                '<div class="ad-confirm-actions" style="flex-direction:column;gap:8px;">' +
                    (hasCandidates
                        ? '<button class="ad-btn ad-btn-primary" id="adFormatIG" style="width:100%;">' + L.playoffWithIG + '</button>'
                        : '') +
                    '<button class="ad-btn ' + (hasCandidates ? 'ad-btn-secondary' : 'ad-btn-primary') + '" id="adFormatDirect" style="width:100%;">' + L.playoffDirect + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adFormatCancel" style="width:100%;">' + L.cancel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        function dismiss() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
        document.getElementById('adFormatCancel').addEventListener('click', dismiss);

        document.getElementById('adFormatDirect').addEventListener('click', async function() {
            dismiss();
            A.showConfirm(L.generatePlayoffConfirm, '', async function() {
                await generatePlayoffDraw(tournament, matches, playersMap);
                renderBracketManagement(tournamentId, 'bracket');
            }, L.generatePlayoff);
        });

        var igBtn = document.getElementById('adFormatIG');
        if (igBtn) {
            igBtn.addEventListener('click', function() {
                dismiss();
                showCandidateSelectionModal(tournament, matches, playersMap, tournamentId);
            });
        }
    }

    // ---- Candidate Selection Modal: admin picks auto-pass / IG / out for each 3rd place ----
    function showCandidateSelectionModal(tournament, matches, playersMap, tournamentId) {
        var groupCount = tournament.group_count || 2;
        var qualifiers = tournament.qualifiers_per_group || 2;
        var grpMatches = matches.filter(isGroupMatch);

        // Build standings + candidates (same logic as generateIGMatches steps 1-4)
        var groupStandings = [];
        var groupSizes = [];
        for (var g = 1; g <= groupCount; g++) {
            var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
            var playerIds = [];
            groupMatchesG.forEach(function(m) {
                if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
            });
            var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
            var mgp = tournament.manual_group_places || {};
            if (mgp[String(g)]) {
                var ov = mgp[String(g)];
                standings.forEach(function(st) {
                    if (ov[st.playerId] !== undefined) st.place = ov[st.playerId];
                });
            }
            standings.sort(function(a, b) { return a.place - b.place; });
            groupStandings.push(standings);
            groupSizes.push(playerIds.length);
        }

        var directQualifiers = [];
        for (var g2 = 0; g2 < groupCount; g2++) {
            for (var p2 = 0; p2 < Math.min(qualifiers, groupStandings[g2].length); p2++) {
                directQualifiers.push({
                    playerId: groupStandings[g2][p2].playerId,
                    groupIdx: g2,
                    place: groupStandings[g2][p2].place
                });
            }
        }

        var drawSize = 2;
        while (drawSize < directQualifiers.length) drawSize *= 2;
        var freeSlots = drawSize - directQualifiers.length;

        var candidates = [];
        for (var g3 = 0; g3 < groupCount; g3++) {
            if (groupSizes[g3] <= 3) {
                var third = groupStandings[g3].find(function(s) { return s.place === 3; });
                if (third) {
                    candidates.push({
                        playerId: third.playerId,
                        groupIdx: g3,
                        wins: third.wins,
                        losses: third.losses,
                        setRatio: third.setsWon + third.setsLost > 0 ? third.setsWon / (third.setsWon + third.setsLost) : 0,
                        gameRatio: third.gamesWon + third.gamesLost > 0 ? third.gamesWon / (third.gamesWon + third.gamesLost) : 0
                    });
                }
            }
        }

        if (candidates.length === 0) {
            A.showToast(L.igNoNeeded, 'info');
            return;
        }

        // Default actions: if all fit → auto, otherwise best → auto, rest → ig
        var defaultActions = [];
        if (candidates.length <= freeSlots) {
            for (var dc = 0; dc < candidates.length; dc++) defaultActions.push('auto');
        } else {
            candidates.sort(function(a, b) {
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.setRatio !== a.setRatio) return b.setRatio - a.setRatio;
                return b.gameRatio - a.gameRatio;
            });
            var autoCount = Math.max(0, freeSlots - Math.ceil((candidates.length - freeSlots)));
            for (var dc2 = 0; dc2 < candidates.length; dc2++) {
                defaultActions.push(dc2 < autoCount ? 'auto' : 'ig');
            }
        }

        // Build modal HTML
        var isDoubles = tournament.format === 'doubles';
        var regsMap = {};
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';

        var rowsHtml = '';
        for (var ci = 0; ci < candidates.length; ci++) {
            var c = candidates[ci];
            var pName = playersMap[c.playerId]
                ? A.esc(isEn ? (playersMap[c.playerId].name_en || playersMap[c.playerId].name) : playersMap[c.playerId].name)
                : 'ID:' + c.playerId;
            var groupLetter = String.fromCharCode(65 + c.groupIdx);
            rowsHtml +=
                '<tr style="border-bottom:1px solid var(--border-subtle, #222);">' +
                    '<td style="padding:8px 10px;color:var(--text-primary, #fff);">' + pName + '</td>' +
                    '<td style="padding:8px 10px;text-align:center;color:var(--accent, #CCFF00);font-weight:600;">' + groupLetter + '</td>' +
                    '<td style="padding:8px 10px;text-align:center;color:var(--text-secondary, #aaa);">' + c.wins + '-' + (c.losses || 0) + '</td>' +
                    '<td style="padding:8px 10px;">' +
                        '<select data-candidate-idx="' + ci + '" style="padding:5px 10px;font-size:13px;background:var(--bg-primary, #111);color:var(--text-primary, #fff);border:1px solid var(--border-subtle, #333);border-radius:6px;cursor:pointer;outline:none;">' +
                            '<option value="auto"' + (defaultActions[ci] === 'auto' ? ' selected' : '') + '>' + L.candidateActionAuto + '</option>' +
                            '<option value="ig"' + (defaultActions[ci] === 'ig' ? ' selected' : '') + '>' + L.candidateActionIG + '</option>' +
                            '<option value="out">' + L.candidateActionOut + '</option>' +
                        '</select>' +
                    '</td>' +
                '</tr>';
        }

        overlay.innerHTML =
            '<div class="ad-confirm-modal" style="max-width:540px;text-align:left;">' +
                '<div class="ad-confirm-title" style="text-align:center;font-size:1.15rem;margin-bottom:12px;">' + L.candidateSelectionTitle + '</div>' +
                '<p style="text-align:center;color:var(--text-secondary, #aaa);margin-bottom:16px;font-size:14px;">' +
                    L.candidateFreeSlots + ': <b style="color:var(--accent, #CCFF00);">' + freeSlots + '</b>' +
                '</p>' +
                '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">' +
                    '<thead><tr style="border-bottom:2px solid var(--border-subtle, #333);">' +
                        '<th style="padding:8px 10px;text-align:left;color:var(--text-secondary, #aaa);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">' + (isEn ? 'Player' : 'Игрок') + '</th>' +
                        '<th style="padding:8px 10px;text-align:center;color:var(--text-secondary, #aaa);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">' + L.candidateGroup + '</th>' +
                        '<th style="padding:8px 10px;text-align:center;color:var(--text-secondary, #aaa);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">' + L.candidateWL + '</th>' +
                        '<th style="padding:8px 10px;color:var(--text-secondary, #aaa);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">' + (isEn ? 'Action' : 'Действие') + '</th>' +
                    '</tr></thead>' +
                    '<tbody>' + rowsHtml + '</tbody>' +
                '</table>' +
                '<div id="adCandidateSummary" style="text-align:center;color:var(--text-secondary, #aaa);font-size:13px;margin-bottom:8px;padding:8px;background:var(--bg-primary, #111);border-radius:6px;"></div>' +
                '<div id="adCandidateError" style="text-align:center;color:var(--danger, #ff4444);font-size:13px;margin-bottom:8px;display:none;"></div>' +
                '<div class="ad-confirm-actions" style="margin-top:16px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adCandidateConfirm">' + L.candidateConfirm + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adCandidateCancel">' + L.cancel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        function dismiss() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
        document.getElementById('adCandidateCancel').addEventListener('click', dismiss);

        // Live summary update
        function updateSummary() {
            var selects = overlay.querySelectorAll('select[data-candidate-idx]');
            var autoC = 0, igC = 0, outC = 0;
            for (var si = 0; si < selects.length; si++) {
                var v = selects[si].value;
                if (v === 'auto') autoC++;
                else if (v === 'ig') igC++;
                else outC++;
            }
            var igMatches = Math.floor(igC / 2);
            var igWinners = igMatches;
            var summaryEl = document.getElementById('adCandidateSummary');
            var errorEl = document.getElementById('adCandidateError');

            summaryEl.textContent = L.candidateAutoCount + ': ' + autoC +
                ' | ' + L.candidateIGCount + ': ' + igMatches +
                ' (' + igC + ' ' + (isEn ? 'players' : 'игроков') + ')' +
                ' | ' + L.candidateOutCount + ': ' + outC;

            // Validate
            var err = '';
            if (igC > 0 && igC % 2 !== 0) {
                err = L.candidateIGOddError;
            } else if (autoC + igWinners > freeSlots) {
                err = L.candidateOverflowError;
            }
            errorEl.textContent = err;
            errorEl.style.display = err ? 'block' : 'none';
            document.getElementById('adCandidateConfirm').disabled = !!err;
        }
        updateSummary();

        var selects = overlay.querySelectorAll('select[data-candidate-idx]');
        for (var si2 = 0; si2 < selects.length; si2++) {
            selects[si2].addEventListener('change', updateSummary);
        }

        // Confirm
        document.getElementById('adCandidateConfirm').addEventListener('click', async function() {
            var sels = overlay.querySelectorAll('select[data-candidate-idx]');
            var manualAutoPass = [];
            var manualIGParticipants = [];
            for (var fi = 0; fi < sels.length; fi++) {
                var idx = parseInt(sels[fi].getAttribute('data-candidate-idx'));
                var val = sels[fi].value;
                if (val === 'auto') {
                    manualAutoPass.push(candidates[idx]);
                } else if (val === 'ig') {
                    manualIGParticipants.push(candidates[idx]);
                }
                // 'out' → skip
            }
            dismiss();
            await generateIGMatches(tournament, matches, playersMap, manualAutoPass, manualIGParticipants);
            renderBracketManagement(tournamentId, 'bracket');
        });
    }

    // ---- Generate Inter-Group (IG) Matches + Playoff Bracket simultaneously ----
    // Accepts manual distribution from showCandidateSelectionModal
    async function generateIGMatches(tournament, matches, playersMap, manualAutoPass, manualIGParticipants) {
        try {
            var groupCount = tournament.group_count || 2;
            var qualifiers = tournament.qualifiers_per_group || 2;
            var grpMatches = matches.filter(isGroupMatch);

            // 1. Get standings for each group
            var groupStandings = [];
            for (var g = 1; g <= groupCount; g++) {
                var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                var playerIds = [];
                groupMatchesG.forEach(function(m) {
                    if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                    if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                });
                var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                var mgpIG = tournament.manual_group_places || {};
                if (mgpIG[String(g)]) {
                    var ovIG = mgpIG[String(g)];
                    standings.forEach(function(st) {
                        if (ovIG[st.playerId] !== undefined) st.place = ovIG[st.playerId];
                    });
                }
                standings.sort(function(a, b) { return a.place - b.place; });
                groupStandings.push(standings);
            }

            // 2. Collect direct qualifiers: 1st + 2nd from ALL groups
            var directQualifiers = [];
            for (var g = 0; g < groupCount; g++) {
                for (var p = 0; p < Math.min(qualifiers, groupStandings[g].length); p++) {
                    directQualifiers.push({
                        playerId: groupStandings[g][p].playerId,
                        groupIdx: g,
                        place: groupStandings[g][p].place
                    });
                }
            }

            // 4. Use manual distribution from modal (moved BEFORE drawSize calc)
            var autoPassPlayers = manualAutoPass || [];
            var igToInsert = [];
            var igOrder = 0;

            if (manualIGParticipants && manualIGParticipants.length >= 2) {
                // Cross-group IG pairing: interleave by group to avoid same-group pairs
                var igSorted = manualIGParticipants.slice();
                igSorted.sort(function(a, b) { return a.groupIdx - b.groupIdx; });
                var interleaved = [];
                var half = Math.ceil(igSorted.length / 2);
                for (var il = 0; il < half; il++) {
                    interleaved.push(igSorted[il]);
                    if (il + half < igSorted.length) interleaved.push(igSorted[il + half]);
                }

                for (var ip = 0; ip < interleaved.length - 1; ip += 2) {
                    igOrder++;
                    igToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: interleaved[ip].playerId,
                        player2_id: interleaved[ip + 1].playerId,
                        round: 'IG', round_number: 0, match_order: igOrder,
                        group_number: null, status: 'upcoming', seed1: null, seed2: null
                    });
                }
            }

            // 3. Determine draw size (includes direct + auto-pass + IG winners)
            var totalPlayoffPlayers = directQualifiers.length + autoPassPlayers.length + igToInsert.length;
            var drawSize = 2;
            while (drawSize < totalPlayoffPlayers) drawSize *= 2;

            // 5. Build SE playoff bracket
            var totalRounds = Math.log2(drawSize);

            // Seed positions
            var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
                ? SEED_POSITIONS[drawSize]
                : (drawSize === 16 ? [1, 16, 9, 8, 5, 12, 13, 4] : (drawSize === 8 ? [1, 8, 5, 4] : (drawSize === 4 ? [1, 4, 3, 2] : [1, 2])));

            // Separate 1st-place finishers (seeds), 2nd-place, and auto-pass (3rd)
            var firstPlaces = directQualifiers.filter(function(q) { return q.place === 1; });
            var secondPlaces = directQualifiers.filter(function(q) { return q.place === 2; });
            // Auto-pass: placed directly in draw (like extra qualifiers)
            var autoPassToPlace = autoPassPlayers.map(function(ap) {
                return { playerId: ap.playerId, groupIdx: ap.groupIdx, place: 3 };
            });

            // Build draw array
            var draw = new Array(drawSize);
            for (var d = 0; d < drawSize; d++) draw[d] = null;

            // Place 1st places at seed positions
            for (var s = 0; s < firstPlaces.length && s < seedPositions.length; s++) {
                draw[seedPositions[s] - 1] = {
                    player_id: firstPlaces[s].playerId,
                    seed: s + 1,
                    groupIdx: firstPlaces[s].groupIdx
                };
            }

            // X-slots = only IG winners (assigned manually after IG matches complete)
            var xSlotCount = igToInsert.length;
            var totalPlaced = directQualifiers.length + autoPassToPlace.length;
            var totalEmpty = drawSize - totalPlaced;
            var byeCount = Math.max(0, totalEmpty - xSlotCount);

            // Reserve BYE positions: opposite top seeds (seed [1] first, then [2], etc.)
            var byeReserved = {};
            for (var bri = 0; bri < byeCount && bri < seedPositions.length; bri++) {
                var seedIdx = seedPositions[bri] - 1; // 0-indexed
                var oppIdx = (seedIdx % 2 === 0) ? seedIdx + 1 : seedIdx - 1;
                byeReserved[oppIdx] = true;
            }

            // Place 2nd places: cross-seeded (avoid same-group in R1 and bracket half)
            var halfSize = Math.max(drawSize / 2, 2);
            // Shuffle 2nd places first for randomness
            for (var i = secondPlaces.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = secondPlaces[i]; secondPlaces[i] = secondPlaces[j]; secondPlaces[j] = tmp;
            }
            // Sort by most-constrained group first
            var groupCounts = {};
            directQualifiers.forEach(function(q) {
                groupCounts[q.groupIdx] = (groupCounts[q.groupIdx] || 0) + 1;
            });
            secondPlaces.sort(function(a, b) {
                return (groupCounts[b.groupIdx] || 0) - (groupCounts[a.groupIdx] || 0);
            });

            // Place 2nd places avoiding same-group R1 opponents + skip BYE-reserved slots
            var emptySlots = [];
            for (var i = 0; i < drawSize; i++) {
                if (draw[i] === null && !byeReserved[i]) emptySlots.push(i);
            }

            function getGroupsInHalf(halfIdx) {
                var groups = [];
                var start = halfIdx * halfSize;
                for (var hi = start; hi < start + halfSize; hi++) {
                    if (draw[hi] && draw[hi].groupIdx >= 0) groups.push(draw[hi].groupIdx);
                }
                return groups;
            }

            for (var a = 0; a < secondPlaces.length; a++) {
                var player = secondPlaces[a];
                var bestSlotIdx = -1;
                var bestScore = -1;
                for (var si = 0; si < emptySlots.length; si++) {
                    var slot = emptySlots[si];
                    var score = 0;
                    var opponentSlot = (slot % 2 === 0) ? slot + 1 : slot - 1;
                    var opponent = draw[opponentSlot];
                    if (opponent && opponent.groupIdx === player.groupIdx) {
                        score = 0;
                    } else {
                        var halfIdx = Math.floor(slot / halfSize);
                        var groupsInHalf = getGroupsInHalf(halfIdx);
                        score = (groupsInHalf.indexOf(player.groupIdx) === -1) ? 2 : 1;
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestSlotIdx = si;
                        if (score === 2) break;
                    }
                }
                if (bestSlotIdx === -1) bestSlotIdx = 0;

                // Cross-seeding fix: if bestScore === 0 (all slots cause same-group R1),
                // try to swap an already-placed player to resolve the conflict
                if (bestScore === 0 && emptySlots.length > 0) {
                    var chosenSlot = emptySlots[bestSlotIdx];
                    var oppSlot = (chosenSlot % 2 === 0) ? chosenSlot + 1 : chosenSlot - 1;
                    var conflictOpp = draw[oppSlot];
                    if (conflictOpp && conflictOpp.groupIdx === player.groupIdx && !conflictOpp.seed) {
                        // Find a placed non-seed player from a different group that can swap
                        var swapped = false;
                        for (var sw = 0; sw < drawSize; sw++) {
                            if (draw[sw] && !draw[sw].seed && draw[sw].groupIdx !== player.groupIdx && sw !== oppSlot) {
                                var swOpp = (sw % 2 === 0) ? sw + 1 : sw - 1;
                                var swOppEntry = draw[swOpp];
                                // Swap candidate (draw[sw]) with conflictOpp (draw[oppSlot])
                                // Check: draw[sw] at oppSlot won't conflict, conflictOpp at sw won't conflict
                                var swGroupOk = (!swOppEntry || swOppEntry.groupIdx !== conflictOpp.groupIdx);
                                var playerOkWithSw = (draw[sw].groupIdx !== player.groupIdx);
                                if (swGroupOk && playerOkWithSw) {
                                    // Swap draw[sw] ↔ draw[oppSlot]
                                    var swapTmp = draw[sw];
                                    draw[sw] = draw[oppSlot];
                                    draw[oppSlot] = swapTmp;
                                    swapped = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                draw[emptySlots[bestSlotIdx]] = {
                    player_id: player.playerId,
                    seed: null,
                    groupIdx: player.groupIdx
                };
                emptySlots.splice(bestSlotIdx, 1);
            }

            // Place auto-pass players (3rd places) with same cross-seeding logic
            for (var ap = 0; ap < autoPassToPlace.length; ap++) {
                var apPlayer = autoPassToPlace[ap];
                var apBestIdx = -1;
                var apBestScore = -1;
                for (var apsi = 0; apsi < emptySlots.length; apsi++) {
                    var apSlot = emptySlots[apsi];
                    var apScore = 0;
                    var apOppSlot = (apSlot % 2 === 0) ? apSlot + 1 : apSlot - 1;
                    var apOpp = draw[apOppSlot];
                    if (apOpp && apOpp.groupIdx === apPlayer.groupIdx) {
                        apScore = 0;
                    } else {
                        var apHalf = Math.floor(apSlot / halfSize);
                        var apGroupsInHalf = getGroupsInHalf(apHalf);
                        apScore = (apGroupsInHalf.indexOf(apPlayer.groupIdx) === -1) ? 2 : 1;
                    }
                    if (apScore > apBestScore) {
                        apBestScore = apScore;
                        apBestIdx = apsi;
                        if (apScore === 2) break;
                    }
                }
                if (apBestIdx === -1) apBestIdx = 0;

                // Cross-seeding swap fix for auto-pass
                if (apBestScore === 0 && emptySlots.length > 0) {
                    var apChosen = emptySlots[apBestIdx];
                    var apOppSlot2 = (apChosen % 2 === 0) ? apChosen + 1 : apChosen - 1;
                    var apConflict = draw[apOppSlot2];
                    if (apConflict && apConflict.groupIdx === apPlayer.groupIdx && !apConflict.seed) {
                        for (var apsw = 0; apsw < drawSize; apsw++) {
                            if (draw[apsw] && !draw[apsw].seed && draw[apsw].groupIdx !== apPlayer.groupIdx && apsw !== apOppSlot2) {
                                var apSwOpp = (apsw % 2 === 0) ? apsw + 1 : apsw - 1;
                                var apSwEntry = draw[apSwOpp];
                                if (!apSwEntry || apSwEntry.groupIdx !== apConflict.groupIdx) {
                                    var apSwTmp = draw[apsw];
                                    draw[apsw] = draw[apOppSlot2];
                                    draw[apOppSlot2] = apSwTmp;
                                    break;
                                }
                            }
                        }
                    }
                }

                draw[emptySlots[apBestIdx]] = {
                    player_id: apPlayer.playerId,
                    seed: null,
                    groupIdx: apPlayer.groupIdx
                };
                emptySlots.splice(apBestIdx, 1);
            }

            // Generate R1 matches
            var playoffToInsert = [];
            var plMatchOrder = 0;
            for (var d = 0; d < drawSize; d += 2) {
                plMatchOrder++;
                var slot1 = draw[d];
                var slot2 = draw[d + 1];
                var isBye = byeReserved[d] || byeReserved[d + 1];
                var hasPlayer = slot1 || slot2;
                var mObj = {
                    tournament_id: tournament.id,
                    player1_id: slot1 ? slot1.player_id : null,
                    player2_id: slot2 ? slot2.player_id : null,
                    round: 'R1', round_number: 1, match_order: plMatchOrder,
                    group_number: null,
                    status: (isBye && hasPlayer) ? 'completed' : 'upcoming',
                    winner_id: (isBye && hasPlayer) ? (slot1 ? slot1.player_id : slot2.player_id) : null,
                    score: (isBye && hasPlayer) ? 'BYE' : null,
                    seed1: slot1 ? slot1.seed : null,
                    seed2: slot2 ? slot2.seed : null
                };
                playoffToInsert.push(mObj);
            }

            // Subsequent rounds
            for (var r = 2; r <= totalRounds; r++) {
                var matchesInRound = drawSize / Math.pow(2, r);
                for (var mr = 1; mr <= matchesInRound; mr++) {
                    var roundPrefix = r === totalRounds ? 'F' :
                                      r === totalRounds - 1 ? 'SF' :
                                      r === totalRounds - 2 ? 'QF' : 'R' + r;
                    playoffToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: null, player2_id: null,
                        round: roundPrefix, round_number: r, match_order: mr,
                        group_number: null, status: 'upcoming',
                        seed1: null, seed2: null
                    });
                }
            }

            // 3rd place match
            playoffToInsert.push({
                tournament_id: tournament.id,
                player1_id: null, player2_id: null,
                round: '3RD', round_number: totalRounds, match_order: 0,
                group_number: null, status: 'upcoming',
                seed1: null, seed2: null
            });

            // 7. Insert all matches (IG + playoff)
            var allToInsert = igToInsert.concat(playoffToInsert);
            var insertRes = await A.client.from('matches').insert(allToInsert);
            if (insertRes.error) {
                A.showToast(insertRes.error.message, 'error');
                return;
            }

            // 8. Auto-advance BYE winners to R2
            if (byeCount > 0) {
                var freshRes = await A.client.from('matches')
                    .select('*')
                    .eq('tournament_id', tournament.id)
                    .is('group_number', null)
                    .neq('round', 'IG')
                    .order('round_number').order('match_order');
                var freshPlMatches = freshRes.data || [];
                var r1Fresh = freshPlMatches.filter(function(m) { return m.round_number === 1; });
                var r2Fresh = freshPlMatches.filter(function(m) { return m.round_number === 2; });

                for (var bi2 = 0; bi2 < r1Fresh.length; bi2++) {
                    var bm = r1Fresh[bi2];
                    if (bm.winner_id && bm.score === 'BYE' && r2Fresh.length > 0) {
                        var nextIdx = Math.floor(bi2 / 2);
                        if (nextIdx < r2Fresh.length) {
                            var nextMatch = r2Fresh[nextIdx];
                            var upField = (bi2 % 2 === 0) ? 'player1_id' : 'player2_id';
                            var sdField = (bi2 % 2 === 0) ? 'seed1' : 'seed2';
                            var upData = {};
                            upData[upField] = bm.winner_id;
                            upData[sdField] = bm.seed1 || bm.seed2 || null;
                            await A.client.from('matches').update(upData).eq('id', nextMatch.id);
                        }
                    }
                }
            }

            // 9. Store IG info in tournament metadata for X-slot assignment
            // auto_pass are already placed in draw, only IG winners need X-slot assignment
            var igMeta = {
                auto_pass_players: autoPassPlayers.map(function(c) {
                    return { playerId: c.playerId, groupIdx: c.groupIdx };
                }),
                auto_pass_placed: true,
                ig_match_count: igToInsert.length,
                x_slot_count: xSlotCount,
                bye_count: byeCount
            };
            await A.client.from('tournaments').update({ ig_meta: igMeta }).eq('id', tournament.id);

            var msg = isEn
                ? 'Bracket created: ' + directQualifiers.length + ' direct, ' +
                  autoPassPlayers.length + ' auto-pass, ' + igToInsert.length + ' IG matches, ' +
                  byeCount + ' BYEs'
                : 'Сетка создана: ' + directQualifiers.length + ' прямых, ' +
                  autoPassPlayers.length + ' авто-проход, ' + igToInsert.length + ' доп. матчей, ' +
                  byeCount + ' BYE';
            A.showToast(msg, 'success');
        } catch (err) {
            console.error('Generate IG matches error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Generate Playoff Draw from Group Winners (Direct path, no IG) ----
    async function generatePlayoffDraw(tournament, matches, playersMap) {
        try {
            var groupCount = tournament.group_count || 2;
            var qualifiers = tournament.qualifiers_per_group || 2;
            var grpMatches = matches.filter(isGroupMatch);

            // 1. Get standings for each group — Direct path: top-N from each group
            var allQualified = [];
            {
                var allGroupStandings = [];
                for (var g = 1; g <= groupCount; g++) {
                    var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                    var playerIds = [];
                    groupMatchesG.forEach(function(m) {
                        if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                        if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                    });
                    var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                    // Apply manual overrides
                    var mgpDirect = tournament.manual_group_places || {};
                    if (mgpDirect[String(g)]) {
                        var ovDirect = mgpDirect[String(g)];
                        standings.forEach(function(st) {
                            if (ovDirect[st.playerId] !== undefined) st.place = ovDirect[st.playerId];
                        });
                    }
                    standings.sort(function(a, b) { return a.place - b.place; });
                    allGroupStandings.push({ groupIdx: g - 1, standings: standings });

                    for (var p = 0; p < Math.min(qualifiers, standings.length); p++) {
                        allQualified.push({
                            playerId: standings[p].playerId,
                            groupIdx: g - 1,
                            place: standings[p].place
                        });
                    }
                }

                // Best 3rd place: if odd group count and not enough qualifiers, fill from best next-place finishers
                if (groupCount % 2 !== 0) {
                    var nextPlace = qualifiers + 1; // typically 3rd place
                    var drawSizeCheck = 2;
                    while (drawSizeCheck < allQualified.length) drawSizeCheck *= 2;

                    if (allQualified.length < drawSizeCheck) {
                        // Collect all players at nextPlace across groups
                        var candidates = [];
                        allGroupStandings.forEach(function(gs) {
                            var st = gs.standings.find(function(s) { return s.place === nextPlace; });
                            if (st) {
                                candidates.push({
                                    playerId: st.playerId,
                                    groupIdx: gs.groupIdx,
                                    place: nextPlace,
                                    wins: st.wins,
                                    setRatio: st.setsWon + st.setsLost > 0 ? st.setsWon / (st.setsWon + st.setsLost) : 0,
                                    gameRatio: st.gamesWon + st.gamesLost > 0 ? st.gamesWon / (st.gamesWon + st.gamesLost) : 0
                                });
                            }
                        });

                        // Sort: wins DESC → set ratio DESC → game ratio DESC
                        candidates.sort(function(a, b) {
                            if (b.wins !== a.wins) return b.wins - a.wins;
                            if (b.setRatio !== a.setRatio) return b.setRatio - a.setRatio;
                            return b.gameRatio - a.gameRatio;
                        });

                        // Fill up to drawSize
                        var slotsToFill = drawSizeCheck - allQualified.length;
                        for (var c = 0; c < Math.min(slotsToFill, candidates.length); c++) {
                            allQualified.push({
                                playerId: candidates[c].playerId,
                                groupIdx: candidates[c].groupIdx,
                                place: candidates[c].place
                            });
                        }
                    }
                }
            }

            if (allQualified.length < 2) {
                A.showToast(isEn ? 'Need at least 2 qualified players' : 'Нужно минимум 2 вышедших игроков', 'error');
                return;
            }

            // 2. Determine draw_size: nearest power of 2 >= qualified count
            var drawSize = 2;
            while (drawSize < allQualified.length) drawSize *= 2;

            var totalRounds = Math.log2(drawSize);
            var seedCount = Math.min(groupCount, drawSize);

            // 3. Cross-seeding: 1st places are seeds, rest fill remaining slots
            // Seed positions from SEED_POSITIONS
            var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
                ? SEED_POSITIONS[drawSize]
                : (drawSize === 16 ? [1, 16, 9, 8, 5, 12, 13, 4] : (drawSize === 8 ? [1, 8, 5, 4] : (drawSize === 4 ? [1, 4, 3, 2] : [1, 2])));

            // Separate 1st-place finishers (seeds) and rest
            var firstPlaces = allQualified.filter(function(q) { return q.place === 1; });
            var otherPlaces = allQualified.filter(function(q) { return q.place > 1; });

            // Build draw array
            var draw = new Array(drawSize);
            for (var i = 0; i < drawSize; i++) draw[i] = null;

            // Place seeds (1st place finishers) at seed positions
            for (var s = 0; s < firstPlaces.length && s < seedPositions.length; s++) {
                draw[seedPositions[s] - 1] = {
                    player_id: firstPlaces[s].playerId,
                    seed: s + 1,
                    groupIdx: firstPlaces[s].groupIdx
                };
            }

            // Reserve BYE positions opposite top seeds BEFORE placing others
            var byeCountDirect = Math.max(0, drawSize - allQualified.length);
            var byeReservedDirect = {};
            for (var bri = 0; bri < byeCountDirect && bri < seedPositions.length; bri++) {
                var seedIdxD = seedPositions[bri] - 1;
                var oppIdxD = (seedIdxD % 2 === 0) ? seedIdxD + 1 : seedIdxD - 1;
                byeReservedDirect[oppIdxD] = true;
            }

            // Порядок расстановки: слабейшие первыми.
            //
            // Раньше оставшиеся места раздавались случайно, лишь бы не свести
            // соседей по группе. Из-за этого двое добранных с третьих мест
            // попадали друг на друга, и один выходил в полуфинал, не встретив
            // ни одного победителя группы. Теперь худшее место идёт к первому
            // сеяному, следующее — ко второму: слабый обязан обыграть сильного,
            // а не такого же слабого.
            var groupCounts = {};
            allQualified.forEach(function(q) {
                groupCounts[q.groupIdx] = (groupCounts[q.groupIdx] || 0) + 1;
            });
            // Перемешиваем — внутри одного места порядок не должен быть
            // предсказуемым
            for (var i = otherPlaces.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = otherPlaces[i];
                otherPlaces[i] = otherPlaces[j];
                otherPlaces[j] = tmp;
            }
            otherPlaces.sort(function(a, b) {
                // Сначала те, кто занял место ниже: третьи раньше вторых
                if (b.place !== a.place) return b.place - a.place;
                // При равном месте — сперва самая многочисленная группа: ей
                // труднее найти слот, где нет своих
                return (groupCounts[b.groupIdx] || 0) - (groupCounts[a.groupIdx] || 0);
            });

            // Place others avoiding same-group in R1 AND same bracket half + skip BYE-reserved
            var emptySlots = [];
            for (var i = 0; i < drawSize; i++) {
                if (draw[i] === null && !byeReservedDirect[i]) emptySlots.push(i);
            }

            // Свободные места перебираем от самых трудных: сначала те, где
            // соперник — верхний сеяный. Тогда слабейший встаёт против первого
            // номера, а не против такого же добранного
            var силаСлота = {};
            emptySlots.forEach(function (слот) {
                var рядом = draw[(слот % 2 === 0) ? слот + 1 : слот - 1];
                // Чем меньше номер сеяного, тем труднее слот. Нет сеяного рядом
                // — слот считается лёгким и уходит в конец очереди
                силаСлота[слот] = рядом && рядом.seed ? рядом.seed : 999;
            });
            emptySlots.sort(function (a, b) { return силаСлота[a] - силаСлота[b]; });

            var halfSize = Math.max(drawSize / 2, 2);

            function getGroupsInHalf(halfIdx) {
                var groups = [];
                var start = halfIdx * halfSize;
                for (var hi = start; hi < start + halfSize; hi++) {
                    if (draw[hi] && draw[hi].groupIdx >= 0) groups.push(draw[hi].groupIdx);
                }
                return groups;
            }

            var unplaced = otherPlaces.slice();

            for (var attempt = 0; attempt < unplaced.length; attempt++) {
                var player = unplaced[attempt];
                var bestSlotIdx = -1;
                var bestScore = -1;

                for (var si = 0; si < emptySlots.length; si++) {
                    var slot = emptySlots[si];
                    var score = 0;

                    // Check R1 opponent (adjacent slot)
                    var opponentSlot = (slot % 2 === 0) ? slot + 1 : slot - 1;
                    var opponent = draw[opponentSlot];
                    if (opponent && opponent.groupIdx === player.groupIdx) {
                        score = 0; // Same group in R1 — worst
                    } else {
                        // Check bracket half
                        var halfIdx = Math.floor(slot / halfSize);
                        var groupsInHalf = getGroupsInHalf(halfIdx);
                        if (groupsInHalf.indexOf(player.groupIdx) === -1) {
                            score = 2; // No same-group in half — best
                        } else {
                            score = 1; // Same group in half but not in R1
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestSlotIdx = si;
                        if (score === 2) break; // optimal
                    }
                }

                if (bestSlotIdx === -1) bestSlotIdx = 0;

                // Cross-seeding fix: if bestScore === 0, try swap to resolve same-group R1
                if (bestScore === 0 && emptySlots.length > 0) {
                    var chosenSlotD = emptySlots[bestSlotIdx];
                    var oppSlotD = (chosenSlotD % 2 === 0) ? chosenSlotD + 1 : chosenSlotD - 1;
                    var conflictOppD = draw[oppSlotD];
                    if (conflictOppD && conflictOppD.groupIdx === player.groupIdx && !conflictOppD.seed) {
                        for (var sw = 0; sw < drawSize; sw++) {
                            if (draw[sw] && !draw[sw].seed && draw[sw].groupIdx !== player.groupIdx && sw !== oppSlotD) {
                                var swOppD = (sw % 2 === 0) ? sw + 1 : sw - 1;
                                var swOppEntryD = draw[swOppD];
                                var swGroupOkD = (!swOppEntryD || swOppEntryD.groupIdx !== conflictOppD.groupIdx);
                                if (swGroupOkD) {
                                    var swapTmpD = draw[sw];
                                    draw[sw] = draw[oppSlotD];
                                    draw[oppSlotD] = swapTmpD;
                                    break;
                                }
                            }
                        }
                    }
                }

                draw[emptySlots[bestSlotIdx]] = {
                    player_id: player.playerId,
                    seed: null,
                    groupIdx: player.groupIdx
                };
                emptySlots.splice(bestSlotIdx, 1);
            }

            // 4. Generate playoff matches
            var matchesToInsert = [];
            var matchOrder = 0;

            // First round
            for (var i = 0; i < drawSize; i += 2) {
                matchOrder++;
                var slot1 = draw[i];
                var slot2 = draw[i + 1];
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: slot1 ? slot1.player_id : null,
                    player2_id: slot2 ? slot2.player_id : null,
                    round: 'R1',
                    round_number: 1,
                    match_order: matchOrder,
                    group_number: null,
                    status: 'upcoming',
                    seed1: slot1 ? slot1.seed : null,
                    seed2: slot2 ? slot2.seed : null
                });
            }

            // Subsequent rounds
            for (var r = 2; r <= totalRounds; r++) {
                var matchesInRound = drawSize / Math.pow(2, r);
                for (var m = 1; m <= matchesInRound; m++) {
                    var roundPrefix = r === totalRounds ? 'F' :
                                      r === totalRounds - 1 ? 'SF' :
                                      r === totalRounds - 2 ? 'QF' : 'R' + r;
                    matchesToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: null,
                        player2_id: null,
                        round: roundPrefix,
                        round_number: r,
                        match_order: m,
                        group_number: null,
                        status: 'upcoming',
                        seed1: null,
                        seed2: null
                    });
                }
            }

            // 3rd place match
            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: null,
                player2_id: null,
                round: '3RD',
                round_number: totalRounds,
                match_order: 0,
                group_number: null,
                status: 'upcoming',
                seed1: null,
                seed2: null
            });

            // Handle BYEs in first round
            for (var i = 0; i < matchesToInsert.length; i++) {
                var match = matchesToInsert[i];
                if (match.round_number !== 1) continue;
                if (match.player1_id && !match.player2_id) {
                    match.winner_id = match.player1_id;
                    match.status = 'completed';
                    match.score = 'BYE';
                } else if (!match.player1_id && match.player2_id) {
                    match.winner_id = match.player2_id;
                    match.status = 'completed';
                    match.score = 'BYE';
                }
            }

            // Insert playoff matches
            var insertRes = await A.client.from('matches').insert(matchesToInsert);
            if (insertRes.error) {
                A.showToast(insertRes.error.message, 'error');
                return;
            }

            // Auto-advance BYE winners
            var freshRes = await A.client.from('matches')
                .select('*')
                .eq('tournament_id', tournament.id)
                .is('group_number', null)
                .order('round_number').order('match_order');
            var freshPlMatches = freshRes.data || [];

            var r1Fresh = freshPlMatches.filter(function(m) { return m.round_number === 1; });
            var r2Fresh = freshPlMatches.filter(function(m) { return m.round_number === 2; });

            for (var i = 0; i < r1Fresh.length; i++) {
                var m = r1Fresh[i];
                if (m.winner_id && m.score === 'BYE' && r2Fresh.length > 0) {
                    var nextMatchIdx = Math.floor(i / 2);
                    if (nextMatchIdx < r2Fresh.length) {
                        var nextMatch = r2Fresh[nextMatchIdx];
                        var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                        var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                        var updateData = {};
                        updateData[updateField] = m.winner_id;
                        updateData[seedField] = (i % 2 === 0) ? m.seed1 : m.seed2;
                        await A.client.from('matches').update(updateData).eq('id', nextMatch.id);
                    }
                }
            }

            // Schedule playoff matches
            await assignPlayoffSchedule(tournament);

            A.showToast(isEn ? 'Playoff bracket generated' : 'Сетка плей-офф сформирована', 'success');
        } catch (err) {
            console.error('Generate playoff draw error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Schedule for playoff matches (after group stage) ----
    async function assignPlayoffSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var scheduledDay = tournament.date_start || null;

        // Fetch playoff matches
        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .is('group_number', null)
            .order('round_number').order('match_order');
        var plMatches = res.data || [];
        if (!plMatches.length) return;

        // Find latest group match time to start playoff after
        var grpRes = await A.client.from('matches')
            .select('scheduled_time')
            .eq('tournament_id', tournament.id)
            .gt('group_number', 0)
            .order('scheduled_time', { ascending: false })
            .limit(1);
        var lastGroupTime = (grpRes.data && grpRes.data[0] && grpRes.data[0].scheduled_time) || '09:00';

        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        var currentMin = timeToMin(lastGroupTime.slice(0, 5)) + matchDuration;

        // Group by round_number
        var roundsMap = {};
        plMatches.forEach(function(m) {
            var rn = m.round_number;
            if (!roundsMap[rn]) roundsMap[rn] = [];
            roundsMap[rn].push(m);
        });
        var totalRounds = Math.max.apply(null, Object.keys(roundsMap).map(Number));

        var plSchedUpdates = [];
        var finalTime = null;

        for (var r = 1; r <= totalRounds; r++) {
            var roundM = (roundsMap[r] || []).sort(function(a, b) { return a.match_order - b.match_order; });
            var playable = roundM.filter(function(m) { return m.status === 'upcoming' && m.score !== 'BYE'; });
            if (!playable.length) continue;

            var waveStartMin = currentMin;
            for (var i = 0; i < playable.length; i++) {
                var waveIndex = Math.floor(i / courtCount);
                var courtIndex = i % courtCount;
                var matchTime = waveStartMin + waveIndex * matchDuration;
                var timeStr = minToTime(matchTime);

                // Remember final's time for 3rd place
                if (playable[i].round === 'F') finalTime = timeStr;

                plSchedUpdates.push(
                    A.client.from('matches').update({
                        scheduled_time: timeStr,
                        scheduled_day: scheduledDay,
                        court: null
                    }).eq('id', playable[i].id)
                );

                var waveEnd = matchTime + matchDuration;
                if (waveEnd > currentMin) currentMin = waveEnd;
            }
        }

        // 3rd place match — same time as Final
        var thirdM = plMatches.find(function(m) { return m.round === '3RD'; });
        if (thirdM && finalTime) {
            plSchedUpdates.push(
                A.client.from('matches').update({
                    scheduled_time: finalTime,
                    scheduled_day: scheduledDay,
                    court: null
                }).eq('id', thirdM.id)
            );
        }

        await Promise.all(plSchedUpdates);
    }

    // ---- Расписание группового этапа: общая очередь ----
    //
    // Раньше корт закреплялся за группой: при трёх группах и четырёх кортах
    // одна пара выходила три раза подряд на своём корте, а свободный корт
    // стоял пустым. Теперь очередь общая: игры идут волнами по числу кортов,
    // корты раздаются по кругу, а пара не попадает в две волны подряд, если
    // есть кем её заменить.
    //
    // Время первой волны точное, дальше — ориентировочное: матч кончается
    // когда кончается. Об этом сказано в самом расписании и в рассылке.
    async function assignGroupSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var startTime = tournament.start_time ? tournament.start_time.slice(0, 5) : '09:00';
        var scheduledDay = tournament.date_start || null;
        // Волны идут встык: время матча и есть шаг расписания. Перерыв между
        // запусками убрали — менеджеры не понимали, зачем он, а на корте
        // задержки всё равно свои, и они в расписании не видны
        var interval = matchDuration;

        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .gt('group_number', 0)
            .order('round_number').order('group_number').order('match_order');
        var allMatches = res.data || [];
        if (!allMatches.length) return;

        function timeToMin(t) {
            var parts = String(t).split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function minToTime(m) {
            var h = Math.floor(m / 60), mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }
        function занятые(матч) {
            return [матч.player1_id, матч.player2_id].filter(Boolean);
        }
        function пересекается(матч, кто) {
            return занятые(матч).some(function(id) { return кто.indexOf(id) !== -1; });
        }

        // Порядок ожидания: круг за кругом, а внутри круга — по очереди из
        // разных групп, чтобы соседние запуски не были из одной
        var ждут = [];
        var кругов = 0;
        allMatches.forEach(function(m) { if (m.round_number > кругов) кругов = m.round_number; });
        for (var круг = 1; круг <= кругов; круг++) {
            var вКруге = allMatches.filter(function(m) { return m.round_number === круг; });
            var поГруппам = {};
            вКруге.forEach(function(m) {
                var g = m.group_number || 0;
                if (!поГруппам[g]) поГруппам[g] = [];
                поГруппам[g].push(m);
            });
            var группы = Object.keys(поГруппам);
            var осталось = true;
            var шаг = 0;
            while (осталось) {
                осталось = false;
                группы.forEach(function(g) {
                    var список = поГруппам[g];
                    if (шаг < список.length) { ждут.push(список[шаг]); осталось = true; }
                });
                шаг++;
            }
        }

        var schedUpdates = [];
        var текущее = timeToMin(startTime);
        var прошлаяВолна = [];
        var волн = 0;

        while (ждут.length) {
            var волна = [];
            var игроки = [];

            while (волна.length < courtCount && ждут.length) {
                // Сначала ищем тех, кто не играл в прошлой волне
                var i = -1;
                for (var k = 0; k < ждут.length; k++) {
                    if (!пересекается(ждут[k], игроки) && !пересекается(ждут[k], прошлаяВолна)) { i = k; break; }
                }
                // Все оставшиеся играли только что — берём любого, кто не занят
                // в этой же волне: подряд лучше, чем простаивающий корт
                if (i === -1) {
                    for (var k2 = 0; k2 < ждут.length; k2++) {
                        if (!пересекается(ждут[k2], игроки)) { i = k2; break; }
                    }
                }
                if (i === -1) break;

                var матч = ждут.splice(i, 1)[0];
                волна.push(матч);
                игроки = игроки.concat(занятые(матч));
            }

            if (!волна.length) break;

            // Корт проставляем только первым запускам — по числу кортов.
            // Дальше заранее не угадать: освободиться может любой, и ставит
            // его ведущий турнира, когда это случится
            var перваяВолна = (волн === 0);

            волна.forEach(function(m, idx) {
                schedUpdates.push(
                    A.client.from('matches').update({
                        scheduled_time: minToTime(текущее),
                        scheduled_day: scheduledDay,
                        court: перваяВолна ? String((idx % courtCount) + 1) : null
                    }).eq('id', m.id)
                );
            });

            волн++;
            прошлаяВолна = игроки;
            текущее += interval;
        }

        await Promise.all(schedUpdates);
    }

    // ---- Auto Schedule Assignment ----
    async function assignSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var startTime = tournament.start_time ? tournament.start_time.slice(0, 5) : '09:00';
        var scheduledDay = tournament.date_start || null;
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);

        // Fetch fresh matches after BYE processing
        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var allMatches = res.data || [];
        if (!allMatches.length) return;

        // Helper: parse "HH:MM" to total minutes
        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        // Helper: total minutes to "HH:MM"
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        // Group by round_number
        var roundsMap = {};
        allMatches.forEach(function(m) {
            var rn = m.round_number;
            if (!roundsMap[rn]) roundsMap[rn] = [];
            roundsMap[rn].push(m);
        });

        var updates = [];
        var currentStartMin = timeToMin(startTime);

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = roundsMap[r] || [];
            // Sort by match_order
            roundMatches.sort(function(a, b) { return a.match_order - b.match_order; });

            // Filter only playable matches (exclude completed BYEs)
            var playable = roundMatches.filter(function(m) {
                return m.status === 'upcoming' && m.score !== 'BYE';
            });

            if (!playable.length) continue;

            // Distribute in waves of courtCount
            var waveStartMin = currentStartMin;
            var lastWaveEndMin = currentStartMin;

            for (var i = 0; i < playable.length; i++) {
                var waveIndex = Math.floor(i / courtCount);
                var courtIndex = i % courtCount;

                var matchTime = waveStartMin + waveIndex * matchDuration;
                // Court number only for first wave of each round
                var courtNum = (waveIndex === 0) ? (courtIndex + 1) : null;

                updates.push({
                    id: playable[i].id,
                    scheduled_time: minToTime(matchTime),
                    scheduled_day: scheduledDay,
                    court: courtNum ? String(courtNum) : null
                });

                var waveEnd = matchTime + matchDuration;
                if (waveEnd > lastWaveEndMin) lastWaveEndMin = waveEnd;
            }

            // Следующий круг начинается сразу за последней волной
            currentStartMin = lastWaveEndMin;
        }

        // Handle 3rd place match — same time as Final
        var thirdMatch = allMatches.find(function(m) { return m.round === '3RD'; });
        var finalMatch = allMatches.find(function(m) { return m.round_number === totalRounds; });
        if (thirdMatch && finalMatch) {
            var finalUpdate = updates.find(function(u) { return u.id === finalMatch.id; });
            if (finalUpdate) {
                updates.push({
                    id: thirdMatch.id,
                    scheduled_time: finalUpdate.scheduled_time,
                    scheduled_day: scheduledDay,
                    court: null
                });
            }
        }

        // Batch update (parallel)
        await Promise.all(updates.map(function(u) {
            return A.client.from('matches').update({
                scheduled_time: u.scheduled_time,
                scheduled_day: u.scheduled_day,
                court: u.court
            }).eq('id', u.id);
        }));
    }

    // ---- FIC Schedule Assignment ----
    async function assignFicSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var startTime = tournament.start_time ? tournament.start_time.slice(0, 5) : '09:00';
        var scheduledDay = tournament.date_start || null;
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);
        var halfDraw = drawSize / 2;

        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var allMatches = res.data || [];
        if (!allMatches.length) return;

        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        var updates = [];
        // Track end times keyed by 'R-M'
        var matchEndTime = {};

        // Round 1: wave-based (same as SE)
        var r1Matches = allMatches.filter(function(m) { return m.round_number === 1; })
            .sort(function(a, b) { return a.match_order - b.match_order; });
        var playableR1 = r1Matches.filter(function(m) { return m.status === 'upcoming' && m.score !== 'BYE'; });

        var currentStartMin = timeToMin(startTime);
        var lastR1End = currentStartMin;

        for (var i = 0; i < playableR1.length; i++) {
            var waveIndex = Math.floor(i / courtCount);
            var courtIndex = i % courtCount;
            var matchTime = currentStartMin + waveIndex * matchDuration;
            var courtNum = (waveIndex === 0) ? (courtIndex + 1) : null;

            updates.push({
                id: playableR1[i].id,
                scheduled_time: minToTime(matchTime),
                scheduled_day: scheduledDay,
                court: courtNum ? String(courtNum) : null
            });

            var waveEnd = matchTime + matchDuration;
            if (waveEnd > lastR1End) lastR1End = waveEnd;
            matchEndTime['1-' + playableR1[i].match_order] = waveEnd;
        }

        // BYE matches in R1: set endTime = startTime (instant)
        r1Matches.forEach(function(m) {
            if (m.score === 'BYE' || m.status === 'completed') {
                matchEndTime['1-' + m.match_order] = timeToMin(startTime);
            }
        });

        // Rounds 2+: dependency-based
        var quarterDraw = drawSize / 4;
        for (var r = 2; r <= totalRounds; r++) {
            var roundMatches = allMatches.filter(function(m) { return m.round_number === r; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            roundMatches.forEach(function(m) {
                var mo = m.match_order;
                // Determine feeder matches from R-1
                var feeder1End = 0, feeder2End = 0;

                if (mo <= quarterDraw) {
                    // Winners bracket: feeders = winners from (R-1, 2*M-1) and (R-1, 2*M)
                    var f1 = (r - 1) + '-' + (2 * mo - 1);
                    var f2 = (r - 1) + '-' + (2 * mo);
                    feeder1End = matchEndTime[f1] || lastR1End;
                    feeder2End = matchEndTime[f2] || lastR1End;
                } else {
                    // Losers bracket: feeders = losers from (R-1, 2*(M-N/4)-1) and (R-1, 2*(M-N/4))
                    var loserBase = mo - quarterDraw;
                    var f1 = (r - 1) + '-' + (2 * loserBase - 1);
                    var f2 = (r - 1) + '-' + (2 * loserBase);
                    feeder1End = matchEndTime[f1] || lastR1End;
                    feeder2End = matchEndTime[f2] || lastR1End;
                }

                var earliestStart = Math.max(feeder1End, feeder2End);
                matchEndTime[r + '-' + mo] = earliestStart + matchDuration;

                updates.push({
                    id: m.id,
                    scheduled_time: minToTime(earliestStart),
                    scheduled_day: scheduledDay,
                    court: null
                });
            });
        }

        await Promise.all(updates.map(function(u) {
            return A.client.from('matches').update({
                scheduled_time: u.scheduled_time,
                scheduled_day: u.scheduled_day,
                court: u.court
            }).eq('id', u.id);
        }));
    }

    // ---- Score Entry Modal ----
    // Tennis score validation
    function isValidSet(a, b, format) {
        a = parseInt(a); b = parseInt(b);
        if (isNaN(a) || isNaN(b)) return false;
        if (format === 'short') {
            // Short: 6-0..6-4 normal, 6-5 tiebreak. No 7-5 or 7-6.
            if (a < 0 || b < 0 || a > 6 || b > 6) return false;
            if ((a === 6 && b <= 4) || (b === 6 && a <= 4)) return true;
            if ((a === 6 && b === 5) || (b === 6 && a === 5)) return true;
            return false;
        }
        // Standard
        if (a < 0 || b < 0 || a > 7 || b > 7) return false;
        // Normal win: 6-0..6-4
        if ((a === 6 && b <= 4) || (b === 6 && a <= 4)) return true;
        // 7-5
        if ((a === 7 && b === 5) || (b === 7 && a === 5)) return true;
        // Tiebreak: 7-6
        if ((a === 7 && b === 6) || (b === 7 && a === 6)) return true;
        return false;
    }

    var MATCH_OUTCOMES = ['RET', 'W/O', 'DEF', 'NA'];

    function extractOutcome(score) {
        if (!score || score === 'BYE') return { sets: score || '', outcome: '' };
        var parts = score.split(' ');
        var outcome = '';
        if (parts.length > 0 && MATCH_OUTCOMES.indexOf(parts[parts.length - 1]) !== -1) {
            outcome = parts.pop();
        }
        return { sets: parts.join(' '), outcome: outcome };
    }

    function formatScoreDisplay(score) {
        if (!score || score === 'BYE') return score || '';
        var ex = extractOutcome(score);
        var suffix = ex.outcome ? '  ' + ex.outcome : '';
        if (!ex.sets) return ex.outcome || '';
        return ex.sets.split(' ').map(function(set) {
            var p = set.split('/');
            return p[0] + ':' + (p[1] || '0');
        }).join('  ') + suffix;
    }

    // ---- Правка результата задним числом ----
    //
    // Судья правит счёт, и вместе с победителем меняется всё, что дальше по
    // сетке. Раньше новый человек ехал вперёд, а счета матчей, которых он не
    // играл, оставались на месте — просто с другим именем. Теперь так: перед
    // правкой показываем список затронутого, после подтверждения зависимые
    // матчи очищаются, и есть один шаг назад.

    async function затронутыеМатчи(matchId) {
        var r = await A.client.rpc('fic_затронутые', { p_матч: matchId });
        if (r.error) { A.showToast(r.error.message, 'error'); return null; }
        return r.data || [];
    }

    /** Окно со списком затронутого. Возвращает true, если судья согласился. */
    function спроситьПравку(список, заголовок) {
        return new Promise(function(resolve) {
            var строки = список.map(function(z) {
                return '<tr>' +
                    '<td>' + A.esc(z.круг + '-' + z.номер) + '</td>' +
                    '<td>' + A.esc(z.игрок_1) + ' — ' + A.esc(z.игрок_2) + '</td>' +
                    '<td>' + A.esc(z.счёт || '—') + '</td>' +
                    '<td>' + A.esc(z.победитель || '—') + '</td>' +
                '</tr>';
            }).join('');
            var overlay = document.createElement('div');
            overlay.className = 'ad-modal-overlay';
            overlay.innerHTML =
                '<div class="ad-modal" style="max-width:640px;">' +
                    '<div class="ad-modal-header"><h3>' + A.esc(заголовок) + '</h3></div>' +
                    '<div class="ad-modal-body">' +
                        '<p style="margin-bottom:12px;">' +
                        (isEn ? 'Scores below will be cleared and the player from this match replaced. Opponents from other matches stay in place.'
                              : 'У этих матчей снимется счёт, а игрок из этого матча заменится. Соперники, пришедшие из других матчей, останутся на местах.') +
                        '</p>' +
                        (список.length
                            ? '<table class="ad-table"><thead><tr>' +
                              '<th>' + (isEn ? 'Cell' : 'Клетка') + '</th>' +
                              '<th>' + (isEn ? 'Pair' : 'Пара') + '</th>' +
                              '<th>' + (isEn ? 'Score' : 'Счёт') + '</th>' +
                              '<th>' + (isEn ? 'Winner' : 'Победитель') + '</th>' +
                              '</tr></thead><tbody>' + строки + '</tbody></table>'
                            : '<p>' + (isEn ? 'Nothing depends on this match.'
                                            : 'От этого матча ничего не зависит.') + '</p>') +
                    '</div>' +
                    '<div class="ad-modal-footer">' +
                        '<button class="ad-btn" data-нет>' + (isEn ? 'Cancel' : 'Отмена') + '</button>' +
                        '<button class="ad-btn ad-btn-primary" data-да>' +
                        (isEn ? 'Apply' : 'Применить') + '</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(overlay);
            overlay.querySelector('[data-нет]').addEventListener('click', function() {
                overlay.remove(); resolve(false);
            });
            overlay.querySelector('[data-да]').addEventListener('click', function() {
                overlay.remove(); resolve(true);
            });
        });
    }

    /** Окно после правки: с кнопкой вернуть всё как было. */
    function предложитьОткат(tournamentId, сколько) {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:420px;">' +
                '<div class="ad-modal-header"><h3>' +
                (isEn ? 'Bracket rebuilt' : 'Сетка пересобрана') + '</h3></div>' +
                '<div class="ad-modal-body"><p>' +
                (isEn ? 'Cleared matches: ' : 'Очищено матчей: ') + сколько +
                '</p></div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn" data-откат>' +
                    (isEn ? 'Undo' : 'Отменить правку') + '</button>' +
                    '<button class="ad-btn ad-btn-primary" data-ок>' +
                    (isEn ? 'Done' : 'Хорошо') + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.querySelector('[data-ок]').addEventListener('click', function() {
            overlay.remove();
            renderBracketManagement(tournamentId, 'bracket');
        });
        overlay.querySelector('[data-откат]').addEventListener('click', async function() {
            var r = await A.client.rpc('fic_откатить', { p_турнир: tournamentId });
            overlay.remove();
            if (r.error) { A.showToast(r.error.message, 'error'); return; }
            A.showToast(isEn ? 'Reverted' : 'Вернули как было', 'success');
            renderBracketManagement(tournamentId, 'bracket');
        });
    }

    function openScoreModal(match, playersMap, tournamentId, rowPlayerId, isDbl, regsMap, setFormat) {
        // Swap display order if rowPlayer is player2 (so row player always on top)
        // Цифры в окне всегда со стороны победителя. Если матч уже сыгран —
        // показываем в том же порядке, чтобы правка выглядела так же, как ввод.
        var swapped = match.winner_id
            ? (match.winner_id === match.player2_id)
            : !!(rowPlayerId && rowPlayerId === match.player2_id);
        var displayP1Id = swapped ? match.player2_id : match.player1_id;
        var displayP2Id = swapped ? match.player1_id : match.player2_id;
        var displaySeed1 = swapped ? match.seed2 : match.seed1;
        var displaySeed2 = swapped ? match.seed1 : match.seed2;

        var p1 = playersMap[displayP1Id] || {};
        var p2 = playersMap[displayP2Id] || {};
        var p1Name, p2Name;
        if (isDbl) {
            p1Name = getTeamDisplayName(displayP1Id, regsMap, playersMap, true).replace(/<[^>]*>/g, '');
            p2Name = getTeamDisplayName(displayP2Id, regsMap, playersMap, true).replace(/<[^>]*>/g, '');
        } else {
            p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
            p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');
        }

        // Parse existing score: "6/4 7/6(11-9) 6/3 RET" → sets + tiebreaks + outcome
        var existingOutcome = '';
        var rawScore = (match.score && match.score !== 'BYE') ? match.score : '';
        var existingSets = rawScore ? rawScore.split(' ') : [];
        if (existingSets.length > 0 && MATCH_OUTCOMES.indexOf(existingSets[existingSets.length - 1]) !== -1) {
            existingOutcome = existingSets.pop();
        }
        var sv = [['','','',''],['','','',''],['','','','']];
        for (var i = 0; i < 3; i++) {
            if (existingSets[i]) {
                var tbMatch = existingSets[i].match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (tbMatch) {
                    sv[i] = swapped
                        ? [tbMatch[2], tbMatch[1], tbMatch[4] || '', tbMatch[3] || '']
                        : [tbMatch[1], tbMatch[2], tbMatch[3] || '', tbMatch[4] || ''];
                } else {
                    var oldMatch = existingSets[i].match(/^(\d+)\/(\d+)(?:\((\d+)\))?$/);
                    if (oldMatch) {
                        sv[i] = swapped
                            ? [oldMatch[2], oldMatch[1], '', oldMatch[3] || '']
                            : [oldMatch[1], oldMatch[2], '', oldMatch[3] || ''];
                    }
                }
            }
        }
        // Pre-fill "who retired" for non-Normal outcomes (retired = loser)
        var existingRetiredId = '';
        if (existingOutcome && match.winner_id) {
            existingRetiredId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;
        }

        // Determine initial visible sets count from existing data
        var visibleSets = 1;
        if (existingSets.length >= 3) visibleSets = 3;
        else if (existingSets.length === 2) visibleSets = 2;

        function setRowHtml(setNum, vals) {
            var id1 = 'adS' + setNum + 'P1';
            var id2 = 'adS' + setNum + 'P2';
            var idTB1 = 'adS' + setNum + 'TB1';
            var idTB2 = 'adS' + setNum + 'TB2';
            return '<div class="ad-score-set-row" data-set="' + setNum + '" id="adSetRow' + setNum + '">' +
                '<label class="ad-field-label" style="min-width:52px;text-align:right;" id="adSetLabel' + setNum + '">' +
                    (isEn ? 'Set ' : 'Сет ') + setNum + '</label>' +
                '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-set-game" id="' + id1 + '" value="' + vals[0] + '">' +
                '<span style="font-weight:600;">:</span>' +
                '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-set-game" id="' + id2 + '" value="' + vals[1] + '">' +
                '<span class="ad-tb-wrap" id="' + idTB1 + 'Wrap" style="display:none;">' +
                    '<span style="font-size:11px;color:var(--text-secondary);margin-left:8px;">TB</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB1 + '" value="' + vals[2] + '">' +
                    '<span style="font-weight:600;font-size:11px;">:</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB2 + '" value="' + vals[3] + '">' +
                '</span>' +
            '</div>';
        }

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            // Окно чуть шире: в парном турнире в заголовке два имени через
            // косую черту, и в 400 точек они не помещались
            '<div class="ad-modal" style="max-width:460px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.enterScore + '</h3>' +
                    '<button class="ad-modal-close" id="adScoreClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div style="text-align:center;margin-bottom:16px;">' +
                        '<div style="font-weight:600;">' + A.esc(p1Name) + (displaySeed1 ? ' <span style="color:var(--accent);font-size:11px;">[' + displaySeed1 + ']</span>' : '') + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:12px;margin:4px 0;">' + L.vsLabel + '</div>' +
                        '<div style="font-weight:600;">' + A.esc(p2Name) + (displaySeed2 ? ' <span style="color:var(--accent);font-size:11px;">[' + displaySeed2 + ']</span>' : '') + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:11px;margin-top:8px;">' +
                            (isEn ? 'Enter the score from the winner\'s side'
                                  : 'Счёт пиши со стороны победителя') + '</div>' +
                    '</div>' +
                    '<div id="adSetsContainer">' +
                        setRowHtml(1, sv[0]) +
                        setRowHtml(2, sv[1]) +
                        setRowHtml(3, sv[2]) +
                    '</div>' +
                    '<div id="adSetButtons" style="display:flex;gap:8px;justify-content:center;margin-top:8px;">' +
                        '<button class="ad-btn ad-btn-secondary" id="adAddSet" style="font-size:0.8rem;padding:4px 12px;">' + L.addSet + '</button>' +
                        '<button class="ad-btn ad-btn-secondary" id="adRemoveSet" style="font-size:0.8rem;padding:4px 12px;">' + L.removeSet + '</button>' +
                        '<button class="ad-btn ad-btn-secondary" id="adSuperTb" style="font-size:0.8rem;padding:4px 12px;">' +
                            (isEn ? '+ Super TB' : '+ Супер ТБ') + '</button>' +
                    '</div>' +
                    '<div style="margin-top:16px;">' +
                        '<label class="ad-field-label" style="text-align:center;display:block;margin-bottom:6px;">' + L.matchOutcome + '</label>' +
                        '<div id="adOutcomeChips" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">' +
                            '<button class="ad-outcome-chip' + (!existingOutcome ? ' active' : '') + '" data-outcome="">' + L.outcomeNormal + '</button>' +
                            '<button class="ad-outcome-chip' + (existingOutcome === 'RET' ? ' active' : '') + '" data-outcome="RET">' + L.outcomeRET + '</button>' +
                            '<button class="ad-outcome-chip' + (existingOutcome === 'W/O' ? ' active' : '') + '" data-outcome="W/O">' + L.outcomeWO + '</button>' +
                            '<button class="ad-outcome-chip' + (existingOutcome === 'DEF' ? ' active' : '') + '" data-outcome="DEF">' + L.outcomeDEF + '</button>' +
                            '<button class="ad-outcome-chip' + (existingOutcome === 'NA' ? ' active' : '') + '" data-outcome="NA">N/A</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="adRetiredBlock" style="margin-top:12px;text-align:center;display:' + (existingOutcome ? 'block' : 'none') + ';">' +
                        '<label class="ad-field-label">' + L.whoRetired + '</label>' +
                        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">' +
                            '<button class="ad-btn ad-btn-secondary ad-retired-btn' + (existingRetiredId === displayP1Id ? ' active' : '') + '" data-retired="' + displayP1Id + '" style="font-size:0.85rem;padding:8px 14px;white-space:normal;line-height:1.3;">' + A.esc(p1Name) + '</button>' +
                            '<button class="ad-btn ad-btn-secondary ad-retired-btn' + (existingRetiredId === displayP2Id ? ' active' : '') + '" data-retired="' + displayP2Id + '" style="font-size:0.85rem;padding:8px 14px;white-space:normal;line-height:1.3;">' + A.esc(p2Name) + '</button>' +
                        '</div>' +
                        '<input type="hidden" id="adRetiredPlayer" value="' + (existingRetiredId || '') + '">' +
                    '</div>' +
                    '<div style="margin-top:12px;text-align:center;">' +
                        '<label class="ad-field-label">' + L.matchWinner + '</label>' +
                        // В столбик и во всю ширину: имена пары в строку не
                        // помещались и вылезали за края окна
                        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">' +
                            '<button class="ad-btn ad-btn-secondary ad-winner-btn" data-winner="' + displayP1Id + '" style="font-size:0.85rem;padding:8px 14px;white-space:normal;line-height:1.3;">' + A.esc(p1Name) + '</button>' +
                            '<button class="ad-btn ad-btn-secondary ad-winner-btn" data-winner="' + displayP2Id + '" style="font-size:0.85rem;padding:8px 14px;white-space:normal;line-height:1.3;">' + A.esc(p2Name) + '</button>' +
                        '</div>' +
                        '<div id="adWinnerDisplay" style="padding:8px;font-size:0.95rem;"></div>' +
                        '<input type="hidden" id="adScoreWinner" value="' + (match.winner_id || '') + '">' +
                        '<input type="hidden" id="adSelectedOutcome" value="' + (existingOutcome || '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-primary" id="adScoreSave">' + L.saveScore + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var currentSets = visibleSets;
        setTimeout(function() { нарисоватьСупер(); }, 0);

        function updateSetsVisibility() {
            for (var s = 1; s <= 3; s++) {
                var row = document.getElementById('adSetRow' + s);
                if (row) row.style.display = s <= currentSets ? '' : 'none';
            }
            document.getElementById('adAddSet').style.display = currentSets < 3 ? '' : 'none';
            document.getElementById('adRemoveSet').style.display = currentSets > 1 ? '' : 'none';
            // Clear hidden sets
            for (var s = currentSets + 1; s <= 3; s++) {
                var p1Input = document.getElementById('adS' + s + 'P1');
                var p2Input = document.getElementById('adS' + s + 'P2');
                var tb1Input = document.getElementById('adS' + s + 'TB1');
                var tb2Input = document.getElementById('adS' + s + 'TB2');
                if (p1Input) p1Input.value = '';
                if (p2Input) p2Input.value = '';
                if (tb1Input) tb1Input.value = '';
                if (tb2Input) tb2Input.value = '';
            }
            updateState();
        }

        // ---- Кто сверху ----
        //
        // Счёт на бумаге записан со стороны победителя, а в клетке порядок
        // свой. Раньше приходилось вводить зеркально. Теперь имя можно
        // поставить наверх, и первые цифры будут его.
        var _p1 = displayP1Id, _p2 = displayP2Id;
        var _имя1 = p1Name, _имя2 = p2Name, _посев1 = displaySeed1, _посев2 = displaySeed2;

        function нарисоватьИмена() {
            var верх = document.getElementById('adNameTop');
            var низ = document.getElementById('adNameBottom');
            верх.innerHTML = A.esc(_имя1) + (_посев1 ? ' <span style="color:var(--accent);font-size:11px;">[' + _посев1 + ']</span>' : '');
            низ.innerHTML = A.esc(_имя2) + (_посев2 ? ' <span style="color:var(--accent);font-size:11px;">[' + _посев2 + ']</span>' : '');
        }

        function поменятьМестами() {
            swapped = !swapped;
            var t;
            t = _p1; _p1 = _p2; _p2 = t;
            t = _имя1; _имя1 = _имя2; _имя2 = t;
            t = _посев1; _посев1 = _посев2; _посев2 = t;
            // Цифры едут вместе с именами: что набрано, остаётся у своего игрока
            for (var s = 1; s <= 3; s++) {
                var a = document.getElementById('adS' + s + 'P1');
                var b = document.getElementById('adS' + s + 'P2');
                var ta = document.getElementById('adS' + s + 'TB1');
                var tb = document.getElementById('adS' + s + 'TB2');
                var v = a.value; a.value = b.value; b.value = v;
                v = ta.value; ta.value = tb.value; tb.value = v;
            }
            нарисоватьИмена();
            обновитьКнопкиСнятия();
            updateState();
        }

        // Победителя называет человек, а не счёт: нажал на имя — оно и
        // записано. Цифры при этом всегда со стороны победителя, разворот в
        // порядок базы делаем сами при сохранении.
        overlay.querySelectorAll('.ad-winner-btn').forEach(function(кн) {
            кн.addEventListener('click', function() {
                overlay.querySelectorAll('.ad-winner-btn').forEach(function(x) {
                    x.classList.remove('active');
                });
                кн.classList.add('active');
                document.getElementById('adScoreWinner').value = кн.dataset.winner;
                updateState();
            });
        });

        /** Кнопки «кто снялся» подписаны именами — их порядок тоже меняется. */
        function обновитьКнопкиСнятия() {
            var кнопки = overlay.querySelectorAll('.ad-retired-btn');
            if (кнопки.length === 2) {
                кнопки[0].dataset.retired = _p1;
                кнопки[0].textContent = _имя1;
                кнопки[1].dataset.retired = _p2;
                кнопки[1].textContent = _имя2;
            }
        }

        // ---- Супер тай-брейк ----
        //
        // Иногда третий сет не играют, а разыгрывают решающий тай-брейк до
        // десяти с разницей в два. В таблице ТБШ он записан обычным сетом:
        // «3/6 6/4 10/5». Так и храним.
        var _суперТБ = (function() {
            var третий = existingSets[2];
            if (!третий) return false;
            var м = третий.match(/^(\d+)\/(\d+)$/);
            return !!(м && (+м[1] >= 10 || +м[2] >= 10));
        })();

        function нарисоватьСупер() {
            var подпись = document.getElementById('adSetLabel3');
            if (подпись) подпись.textContent = _суперТБ ? (isEn ? 'Super TB' : 'Супер ТБ')
                                                        : (isEn ? 'Set 3' : 'Сет 3');
            var кн = document.getElementById('adSuperTb');
            if (кн) кн.classList.toggle('active', _суперТБ);
            var обёртка = document.getElementById('adS3TB1Wrap');
            if (обёртка && _суперТБ) обёртка.style.display = 'none';
        }

        document.getElementById('adSuperTb').addEventListener('click', function() {
            _суперТБ = !_суперТБ;
            if (_суперТБ && currentSets < 3) currentSets = 3;
            updateSetsVisibility();
            нарисоватьСупер();
        });

        document.getElementById('adAddSet').addEventListener('click', function() {
            if (currentSets < 3) { currentSets++; updateSetsVisibility(); }
        });
        document.getElementById('adRemoveSet').addEventListener('click', function() {
            if (currentSets > 1) { currentSets--; updateSetsVisibility(); }
        });

        // Show/hide tiebreak inputs based on format
        var _setFormat = setFormat || 'standard';
        function checkTiebreaks() {
            for (var s = 1; s <= 3; s++) {
                var p1El = document.getElementById('adS' + s + 'P1');
                var p2El = document.getElementById('adS' + s + 'P2');
                if (!p1El || !p2El) continue;
                var v1 = parseInt(p1El.value) || 0;
                var v2 = parseInt(p2El.value) || 0;
                var tbWrap = document.getElementById('adS' + s + 'TB1Wrap');
                if (tbWrap && s === 3 && _суперТБ) { tbWrap.style.display = 'none'; continue; }
                if (tbWrap) {
                    var isTb = _setFormat === 'short'
                        ? ((v1 === 6 && v2 === 5) || (v1 === 5 && v2 === 6))
                        : ((v1 === 7 && v2 === 6) || (v1 === 6 && v2 === 7));
                    tbWrap.style.display = isTb ? 'inline-flex' : 'none';
                }
            }
        }

        function updateState() {
            checkTiebreaks();
            var winnerDisplay = document.getElementById('adWinnerDisplay');
            var поле = document.getElementById('adScoreWinner');
            var outcome = document.getElementById('adSelectedOutcome').value;

            // При снятии победитель понятен сам: это тот, кто не снялся
            if (outcome) {
                var retiredId = document.getElementById('adRetiredPlayer').value;
                if (retiredId) {
                    поле.value = retiredId === _p1 ? _p2 : _p1;
                }
            }

            var кто = поле.value;
            overlay.querySelectorAll('.ad-winner-btn').forEach(function(кн) {
                кн.classList.toggle('active', кн.dataset.winner === кто);
            });

            if (кто) {
                var п = playersMap[кто] || {};
                var имя = isDbl
                    ? getTeamDisplayName(кто, regsMap, playersMap, true).replace(/<[^>]*>/g, '')
                    : (isEn ? (п.name_en || п.name || '?') : (п.name || '?'));
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' +
                    A.esc(имя) + '</span>';
            } else {
                winnerDisplay.innerHTML = '<span style="color:var(--text-secondary);font-size:0.85rem;">' +
                    (isEn ? 'Tap the winner' : 'Нажми на имя победителя') + '</span>';
            }
        }

        function bindInputEvents() {
            overlay.querySelectorAll('.ad-set-game').forEach(function(input) {
                input.removeEventListener('input', input._handler);
                input._handler = function() {
                    // В обычном сете цифра одна и не больше семи. В решающем
                    // тай-брейке счёт двузначный и любой: 10/8, 11/9, 12/10 —
                    // раньше маска выбрасывала всё, что больше семёрки, и
                    // ввести супертай было нельзя.
                    var этоСупер = _суперТБ && /^adS3P[12]$/.test(input.id);
                    var v;
                    if (этоСупер) {
                        v = input.value.replace(/[^0-9]/g, '').slice(0, 2);
                    } else {
                        v = input.value.replace(/[^0-7]/g, '');
                        if (v.length > 1) v = v.charAt(v.length - 1);
                    }
                    input.value = v;
                    updateState();
                    if (!этоСупер && v.length === 1) {
                        var allInputs = Array.from(overlay.querySelectorAll('.ad-set-game:not([style*="display: none"] *), .ad-tb-input'));
                        var visibleInputs = allInputs.filter(function(el) { return el.offsetParent !== null; });
                        var idx = visibleInputs.indexOf(input);
                        if (idx >= 0 && idx < visibleInputs.length - 1) visibleInputs[idx + 1].focus();
                    }
                };
                input.addEventListener('input', input._handler);
            });
            overlay.querySelectorAll('.ad-tb-input').forEach(function(input) {
                input.removeEventListener('input', input._tbHandler);
                input._tbHandler = function() {
                    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 2);
                    updateState();
                };
                input.addEventListener('input', input._tbHandler);
            });
        }

        bindInputEvents();
        updateSetsVisibility();

        // Inject outcome chip styles
        if (!document.getElementById('adOutcomeStyles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'adOutcomeStyles';
            styleEl.textContent = '.ad-outcome-chip{padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.8rem;transition:all .15s;}' +
                '.ad-outcome-chip:hover{border-color:var(--accent);color:var(--text-primary);}' +
                '.ad-outcome-chip.active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600;}' +
                '.ad-retired-btn.active{background:var(--accent) !important;color:#000 !important;border-color:var(--accent) !important;font-weight:600;}' +
                '.ad-brk-outcome{display:inline-block;font-size:0.6rem;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(204,255,0,0.15);color:var(--accent);margin-left:4px;vertical-align:middle;}';
            document.head.appendChild(styleEl);
        }

        // Outcome chips
        var selectedOutcome = existingOutcome || '';
        overlay.querySelectorAll('.ad-outcome-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                overlay.querySelectorAll('.ad-outcome-chip').forEach(function(c) { c.classList.remove('active'); });
                chip.classList.add('active');
                selectedOutcome = chip.dataset.outcome;
                document.getElementById('adSelectedOutcome').value = selectedOutcome;
                var retiredBlock = document.getElementById('adRetiredBlock');
                if (selectedOutcome) {
                    retiredBlock.style.display = 'block';
                } else {
                    retiredBlock.style.display = 'none';
                    document.getElementById('adRetiredPlayer').value = '';
                    overlay.querySelectorAll('.ad-retired-btn').forEach(function(b) { b.classList.remove('active'); });
                }
                updateState();
            });
        });

        // Retired player buttons
        overlay.querySelectorAll('.ad-retired-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                overlay.querySelectorAll('.ad-retired-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                document.getElementById('adRetiredPlayer').value = btn.dataset.retired;
                updateState();
            });
        });

        // Close
        document.getElementById('adScoreClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Save
        document.getElementById('adScoreSave').addEventListener('click', async function() {
            var outcome = document.getElementById('adSelectedOutcome').value;

            if (outcome === 'W/O') {
                // Walkover — no sets needed, just check winner
                var retiredId = document.getElementById('adRetiredPlayer').value;
                if (!retiredId) {
                    A.showToast(L.whoRetired, 'error');
                    return;
                }
            } else if (outcome) {
                // RET/DEF/NA — at least one set must have data, no strict validation
                var hasAnySet = false;
                for (var s = 1; s <= currentSets; s++) {
                    var v1 = document.getElementById('adS' + s + 'P1').value;
                    var v2 = document.getElementById('adS' + s + 'P2').value;
                    if (v1 !== '' && v2 !== '') { hasAnySet = true; break; }
                }
                if (!hasAnySet) {
                    A.showToast((isEn ? 'Fill in at least one set' : 'Заполните хотя бы один сет'), 'error');
                    return;
                }
                var retiredId = document.getElementById('adRetiredPlayer').value;
                if (!retiredId) {
                    A.showToast(L.whoRetired, 'error');
                    return;
                }
            } else {
                // Normal — validate all visible sets strictly
                for (var s = 1; s <= currentSets; s++) {
                    var v1 = document.getElementById('adS' + s + 'P1').value;
                    var v2 = document.getElementById('adS' + s + 'P2').value;
                    if (v1 === '' || v2 === '') {
                        A.showToast((isEn ? 'Fill in Set ' : 'Заполните сет ') + s, 'error');
                        return;
                    }
                    var этоСупер = (s === 3 && _суперТБ);
                    if (этоСупер) {
                        var a = +v1, b = +v2;
                        if (!(Math.max(a, b) >= 10 && Math.abs(a - b) >= 2)) {
                            A.showToast(isEn ? 'Super tiebreak: to 10, margin 2'
                                             : 'Супер тай-брейк: до 10, разница в два', 'error');
                            return;
                        }
                    } else if (!isValidSet(v1, v2, _setFormat)) {
                        A.showToast((isEn ? 'Invalid Set ' : 'Некорректный счёт сета ') + s, 'error');
                        return;
                    }
                }
            }

            var winnerId = document.getElementById('adScoreWinner').value;
            if (!winnerId) {
                A.showToast(isEn ? 'Cannot determine winner' : 'Невозможно определить победителя', 'error');
                return;
            }

            // Build score string (swap back to DB order if display was swapped)
            function buildSet(num) {
                var v1 = document.getElementById('adS' + num + 'P1').value;
                var v2 = document.getElementById('adS' + num + 'P2').value;
                if (v1 === '' || v2 === '') return null;
                var tb1 = document.getElementById('adS' + num + 'TB1').value;
                var tb2 = document.getElementById('adS' + num + 'TB2').value;
                // В окне цифры со стороны победителя; в базе первым идёт
                // player1. Разворачиваем, если победил второй.
                var зеркало = winnerId && winnerId === match.player2_id;
                var dbV1 = зеркало ? v2 : v1;
                var dbV2 = зеркало ? v1 : v2;
                var dbTB1 = зеркало ? tb2 : tb1;
                var dbTB2 = зеркало ? tb1 : tb2;
                var setStr = dbV1 + '/' + dbV2;
                var hasTb = _setFormat === 'short'
                    ? ((+dbV1 === 6 && +dbV2 === 5) || (+dbV1 === 5 && +dbV2 === 6))
                    : ((+dbV1 === 7 && +dbV2 === 6) || (+dbV1 === 6 && +dbV2 === 7));
                if (dbTB1 !== '' && dbTB2 !== '' && hasTb) {
                    setStr += '(' + dbTB1 + '-' + dbTB2 + ')';
                }
                return setStr;
            }

            var scoreParts = [];
            for (var s = 1; s <= currentSets; s++) {
                var setStr = buildSet(s);
                if (setStr) scoreParts.push(setStr);
            }
            var scoreStr = scoreParts.join(' ');
            if (outcome) scoreStr = scoreStr ? scoreStr + ' ' + outcome : outcome;

            var updateData = {
                score: scoreStr,
                winner_id: winnerId,
                status: 'completed',
                played_at: new Date().toISOString(),
                // Счёт от менеджера окончательный: подтверждать его некому и
                // незачем. Заодно это способ закрыть матч, который игроки
                // вписали, но второй так и не подтвердил — иначе сетка стоит
                score_status: 'confirmed',
                score_confirmed_at: new Date().toISOString()
            };

            // Победитель поменялся у уже сыгранного матча — это пересборка:
            // показываем, что будет стёрто, и спрашиваем. Всё остальное —
            // обычная запись счёта.
            var меняемПобедителя = match.winner_id && match.winner_id !== winnerId && !групповой(match);
            if (меняемПобедителя) {
                var зависимые = await затронутыеМатчи(match.id);
                if (зависимые === null) return;
                var согласен = await спроситьПравку(зависимые,
                    isEn ? 'Changing the winner' : 'Смена победителя');
                if (!согласен) return;
                var пр = await A.client.rpc('fic_правка', {
                    p_матч: match.id, p_победитель: winnerId, p_счёт: scoreStr
                });
                if (пр.error) { A.showToast(пр.error.message, 'error'); return; }
                overlay.remove();
                предложитьОткат(tournamentId, (пр.data && пр.data.затронуто) || 0);
                return;
            }

            var res = await A.client.from('matches').update(updateData).eq('id', match.id);
            if (res.error) {
                A.showToast(res.error.message, 'error');
                return;
            }

            // Кто выходит в следующий круг, решает база: триггер на матче
            // зовёт advance_bracket_winner. Раньше это считалось здесь, и
            // сетка двигалась, только пока открыта эта страница
            //
            // Допматчи остались за менеджером: там из нескольких вариантов
            // выбирает человек, и это задумано так
            if (match.round === 'IG') {
                await tryFillPlayoffFromIG(tournamentId);
            }

            overlay.remove();
            A.showToast(L.saved, 'success');
            // Остаёмся в сетке: у завершённого турнира админка открывается на
            // «Результатах», и после каждого сохранения счёта вкладка
            // переключалась сама.
            renderBracketManagement(tournamentId, 'bracket');
        });
    }

    // ---- Handle IG completion: auto-fill X-slots with IG winners ----
    async function tryFillPlayoffFromIG(tournamentId) {
        try {
            // Check if ALL IG matches are done
            var igRes = await A.client.from('matches').select('*')
                .eq('tournament_id', tournamentId).eq('round', 'IG');
            var igAll = igRes.data || [];
            if (igAll.length === 0) return;
            var allDone = igAll.every(function(m) { return m.status === 'completed' && m.winner_id; });
            if (!allDone) return;

            // Collect IG winners
            var igWinners = [];
            igAll.forEach(function(m) {
                if (m.winner_id) igWinners.push(m.winner_id);
            });
            if (igWinners.length === 0) return;

            // Build player→group map from group matches
            var grpRes = await A.client.from('matches').select('player1_id, player2_id, group_number')
                .eq('tournament_id', tournamentId).not('group_number', 'is', null);
            var playerGroup = {};
            (grpRes.data || []).forEach(function(m) {
                if (m.player1_id) playerGroup[m.player1_id] = m.group_number;
                if (m.player2_id) playerGroup[m.player2_id] = m.group_number;
            });

            // Find X-slots: R1 PLAYOFF matches with one empty side (not BYE)
            var r1Res = await A.client.from('matches').select('*')
                .eq('tournament_id', tournamentId).eq('round_number', 1)
                .is('group_number', null).neq('round', 'IG').order('match_order');
            var r1Matches = r1Res.data || [];

            var xSlots = [];
            r1Matches.forEach(function(rm) {
                if (rm.player1_id && !rm.player2_id && rm.score !== 'BYE') {
                    xSlots.push({ matchId: rm.id, field: 'player2_id', opponentId: rm.player1_id,
                                  opponentSeed: rm.seed1 || 999, matchOrder: rm.match_order });
                } else if (!rm.player1_id && rm.player2_id && rm.score !== 'BYE') {
                    xSlots.push({ matchId: rm.id, field: 'player1_id', opponentId: rm.player2_id,
                                  opponentSeed: rm.seed2 || 999, matchOrder: rm.match_order });
                } else if (!rm.player1_id && !rm.player2_id) {
                    xSlots.push({ matchId: rm.id, field: 'player1_id', opponentId: null,
                                  opponentSeed: 999, matchOrder: rm.match_order });
                }
            });

            // Победители доп. матчей идут на сеяных, начиная с первого: они
            // прошли не напрямую, и лёгкой дороги в полуфинал у них быть не
            // должно. Слот без сеяного соперника уходит в конец очереди
            xSlots.sort(function (a, b) { return a.opponentSeed - b.opponentSeed; });

            if (xSlots.length === 0) return;

            // Filter winners not already placed in R1
            var alreadyInR1 = [];
            r1Matches.forEach(function(rm) {
                if (rm.player1_id) alreadyInR1.push(rm.player1_id);
                if (rm.player2_id) alreadyInR1.push(rm.player2_id);
            });
            var unplacedWinners = igWinners.filter(function(wId) {
                return alreadyInR1.indexOf(wId) === -1;
            });
            if (unplacedWinners.length === 0) return;

            // Раньше при нескольких победителях система отправляла менеджера
            // расставлять их руками. Правило одно для всех, кто прошёл не
            // напрямую, — сажаем на сеяных по порядку, и выбирать нечего.
            // Расставить иначе по-прежнему можно: замена участника на месте
            // никуда не делась
            //
            // Внутри порядка держим правило «не сводить своих по группе»:
            // оно важнее, чем номер сеяного
            for (var w = 0; w < unplacedWinners.length && xSlots.length > 0; w++) {
                var winnerId = unplacedWinners[w];
                var winnerGroup = playerGroup[winnerId] || 0;
                // Find best X-slot: prefer different group from opponent
                var bestIdx = 0;
                var bestScore = -1;
                for (var xs = 0; xs < xSlots.length; xs++) {
                    var oppGroup = playerGroup[xSlots[xs].opponentId] || 0;
                    var score = (oppGroup > 0 && oppGroup === winnerGroup) ? 0 : 1;
                    if (score > bestScore) {
                        bestScore = score;
                        bestIdx = xs;
                        if (score === 1) break;
                    }
                }
                var slot = xSlots[bestIdx];
                var upd = {};
                upd[slot.field] = winnerId;
                await A.client.from('matches').update(upd).eq('id', slot.matchId);
                xSlots.splice(bestIdx, 1);
            }

            // Handle BYEs: R1 PLAYOFF matches with one filled + one still empty
            var r1Fresh = await A.client.from('matches').select('*')
                .eq('tournament_id', tournamentId).eq('round_number', 1)
                .is('group_number', null).neq('round', 'IG').order('match_order');
            var r1List = r1Fresh.data || [];
            for (var bi = 0; bi < r1List.length; bi++) {
                var bm = r1List[bi];
                if (bm.player1_id && !bm.player2_id && bm.status !== 'completed') {
                    await A.client.from('matches').update({ winner_id: bm.player1_id, status: 'completed', score: 'BYE' }).eq('id', bm.id);
                } else if (!bm.player1_id && bm.player2_id && bm.status !== 'completed') {
                    await A.client.from('matches').update({ winner_id: bm.player2_id, status: 'completed', score: 'BYE' }).eq('id', bm.id);
                }
            }

            // Auto-advance BYE winners to R2
            r1Fresh = await A.client.from('matches').select('*')
                .eq('tournament_id', tournamentId).eq('round_number', 1)
                .is('group_number', null).neq('round', 'IG').order('match_order');
            var r2Res = await A.client.from('matches').select('*')
                .eq('tournament_id', tournamentId).eq('round_number', 2).order('match_order');
            r1List = r1Fresh.data || [];
            var r2List = r2Res.data || [];
            for (var bi2 = 0; bi2 < r1List.length; bi2++) {
                var bm2 = r1List[bi2];
                if (bm2.winner_id && bm2.score === 'BYE' && r2List.length > 0) {
                    var nextIdx = Math.floor(bi2 / 2);
                    if (nextIdx < r2List.length) {
                        var upField = (bi2 % 2 === 0) ? 'player1_id' : 'player2_id';
                        var sdField = (bi2 % 2 === 0) ? 'seed1' : 'seed2';
                        var upData = {};
                        upData[upField] = bm2.winner_id;
                        upData[sdField] = bm2.seed1 || bm2.seed2 || null;
                        await A.client.from('matches').update(upData).eq('id', r2List[nextIdx].id);
                    }
                }
            }

            console.log('[tryFillPlayoffFromIG] Auto-placed', unplacedWinners.length, 'IG winners into X-slots');
        } catch (err) {
            console.error('[tryFillPlayoffFromIG] Error:', err);
        }
    }

    // ---- Render X-slot assignment section (dropdowns for admin to assign players) ----
    async function renderXSlotSection(container, tournamentId) {
        try {
        // Load tournament meta
        var trnRes = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
        var tournament = trnRes.data;
        if (!tournament) return;
        var igMeta = tournament.ig_meta || {};

        // Load IG matches (completed winners)
        var igRes = await A.client.from('matches').select('*')
            .eq('tournament_id', tournamentId).eq('round', 'IG');
        var igAll = igRes.data || [];
        var allIGDone = igAll.length === 0 || igAll.every(function(m) { return m.status === 'completed' && m.winner_id; });
        if (!allIGDone && igAll.length > 0) return;

        // Collect available players for X-slots: only IG winners
        // (auto-pass players are already placed directly in the draw)
        var availablePlayers = [];
        // Auto-pass from ig_meta — only if NOT already placed in draw (legacy support)
        if (!igMeta.auto_pass_placed) {
            (igMeta.auto_pass_players || []).forEach(function(ap) {
                availablePlayers.push({ playerId: ap.playerId, groupIdx: ap.groupIdx, source: 'auto_pass' });
            });
        }
        // IG winners
        igAll.forEach(function(m) {
            if (m.winner_id) {
                availablePlayers.push({ playerId: m.winner_id, groupIdx: -1, source: 'ig_winner' });
            }
        });

        if (availablePlayers.length === 0 && igAll.length === 0) return;

        // Build player→group map from group matches
        var grpRes = await A.client.from('matches').select('*')
            .eq('tournament_id', tournamentId)
            .not('group_number', 'is', null);
        var grpMatches = grpRes.data || [];
        var playerGroup = {};
        grpMatches.forEach(function(m) {
            if (m.player1_id) playerGroup[m.player1_id] = m.group_number;
            if (m.player2_id) playerGroup[m.player2_id] = m.group_number;
        });

        // Fix groupIdx for IG winners using playerGroup map
        availablePlayers.forEach(function(ap) {
            if (ap.groupIdx === -1 && playerGroup[ap.playerId]) {
                ap.groupIdx = playerGroup[ap.playerId] - 1;
            }
        });

        // Load R1 PLAYOFF matches to find X-slots (exclude group matches)
        var r1Res = await A.client.from('matches').select('*')
            .eq('tournament_id', tournamentId).eq('round_number', 1)
            .is('group_number', null).neq('round', 'IG')
            .order('match_order');
        var r1Matches = r1Res.data || [];

        // X-slots: R1 matches with one empty side (and opponent is filled)
        var xSlots = [];
        r1Matches.forEach(function(rm) {
            if (rm.player1_id && !rm.player2_id && rm.score !== 'BYE') {
                xSlots.push({ matchId: rm.id, field: 'player2_id', opponentId: rm.player1_id, matchOrder: rm.match_order });
            } else if (!rm.player1_id && rm.player2_id && rm.score !== 'BYE') {
                xSlots.push({ matchId: rm.id, field: 'player1_id', opponentId: rm.player2_id, matchOrder: rm.match_order });
            } else if (!rm.player1_id && !rm.player2_id) {
                // Both empty — 2 X-slots in same match
                xSlots.push({ matchId: rm.id, field: 'player1_id', opponentId: null, matchOrder: rm.match_order });
                xSlots.push({ matchId: rm.id, field: 'player2_id', opponentId: null, matchOrder: rm.match_order });
            }
        });

        // Filter: remove X-slots that are already assigned
        var alreadyAssigned = [];
        r1Matches.forEach(function(rm) {
            if (rm.player1_id) alreadyAssigned.push(rm.player1_id);
            if (rm.player2_id) alreadyAssigned.push(rm.player2_id);
        });
        var unassignedPlayers = availablePlayers.filter(function(ap) {
            return alreadyAssigned.indexOf(ap.playerId) === -1;
        });

        if (unassignedPlayers.length === 0 || xSlots.length === 0) return;

        // Load player names (unassigned + opponents for display)
        var pIds = unassignedPlayers.map(function(ap) { return ap.playerId; });
        xSlots.forEach(function(xs) { if (xs.opponentId && pIds.indexOf(xs.opponentId) === -1) pIds.push(xs.opponentId); });
        var plRes = await A.client.from('players').select('id, name, name_en').in('id', pIds);
        var plData = plRes.data || [];
        var plMap = {};
        plData.forEach(function(p) { plMap[p.id] = p; });

        // Build UI
        var html = '<div class="ad-xslot-section" style="margin-top:24px;padding:16px;background:var(--bg-elevated);border-radius:12px;border:1px solid var(--border);">';
        html += '<div class="ad-grp-section-title" style="margin-bottom:8px;">' + L.xSlotAssign + '</div>';
        html += '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">' + L.xSlotExplanation + '</p>';

        xSlots.forEach(function(xs, idx) {
            var opponentGroup = xs.opponentId ? (playerGroup[xs.opponentId] || 0) : 0;
            var opponentName = '';
            if (xs.opponentId) {
                var opP = plMap[xs.opponentId] || {};
                if (!opP.name) {
                    // Opponent might not be in our plMap, load from alreadyAssigned context
                    // We'll use a generic label
                    opponentName = 'M' + xs.matchOrder;
                } else {
                    opponentName = isEn ? (opP.name_en || opP.name) : opP.name;
                }
            }

            html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
            html += '<span style="min-width:80px;color:var(--text-dim);font-size:0.85rem;">' +
                (isEn ? 'Match ' : 'Матч ') + xs.matchOrder +
                (opponentName ? ' vs ' + A.esc(opponentName) : '') +
                '</span>';
            html += '<select class="ad-input" data-xslot-idx="' + idx + '" data-match-id="' + xs.matchId + '" data-field="' + xs.field + '" data-opponent-group="' + opponentGroup + '" style="flex:1;max-width:300px;">';
            html += '<option value="">' + L.xSlotSelectPlayer + '</option>';
            unassignedPlayers.forEach(function(ap) {
                var pInfo = plMap[ap.playerId] || {};
                var pName = isEn ? (pInfo.name_en || pInfo.name || ap.playerId) : (pInfo.name || ap.playerId);
                var pGroup = ap.groupIdx + 1;
                var disabled = (opponentGroup > 0 && pGroup === opponentGroup) ? ' disabled' : '';
                var label = pName + ' (' + L.groupLabel + ' ' + pGroup + ')';
                if (ap.source === 'auto_pass') label += ' [AP]';
                html += '<option value="' + ap.playerId + '"' + disabled + '>' + A.esc(label) + '</option>';
            });
            html += '</select>';
            html += '</div>';
        });

        html += '<div style="margin-top:16px;text-align:center;">';
        html += '<button class="ad-btn ad-btn-primary" id="adXSlotConfirm">' + L.xSlotConfirm + '</button>';
        html += '</div>';
        html += '</div>';

        container.insertAdjacentHTML('beforeend', html);

        // Cross-group filter: when a player is selected in one dropdown, disable them in others
        var allDropdowns = container.querySelectorAll('select[data-xslot-idx]');
        function updateDropdownAvailability() {
            var selected = {};
            allDropdowns.forEach(function(sel) {
                if (sel.value) selected[sel.value] = true;
            });
            allDropdowns.forEach(function(sel) {
                var opts = sel.querySelectorAll('option');
                var opponentGroup = parseInt(sel.getAttribute('data-opponent-group')) || 0;
                opts.forEach(function(opt) {
                    if (!opt.value) return;
                    var playerGroupNum = 0;
                    unassignedPlayers.forEach(function(ap) {
                        if (ap.playerId === opt.value) playerGroupNum = ap.groupIdx + 1;
                    });
                    // Disable if: same group as opponent OR already selected elsewhere
                    var isSameGroup = opponentGroup > 0 && playerGroupNum === opponentGroup;
                    var isSelectedElsewhere = selected[opt.value] && sel.value !== opt.value;
                    opt.disabled = isSameGroup || isSelectedElsewhere;
                });
            });
        }
        allDropdowns.forEach(function(sel) {
            sel.addEventListener('change', updateDropdownAvailability);
        });

        // Confirm button
        var confirmBtn = document.getElementById('adXSlotConfirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async function() {
                confirmBtn.disabled = true;
                var updates = [];
                allDropdowns.forEach(function(sel) {
                    if (sel.value) {
                        var upd = {};
                        upd[sel.getAttribute('data-field')] = sel.value;
                        updates.push(
                            A.client.from('matches').update(upd).eq('id', sel.getAttribute('data-match-id'))
                        );
                    }
                });
                if (updates.length === 0) {
                    A.showToast(isEn ? 'Select at least one player' : 'Выберите хотя бы одного игрока', 'error');
                    confirmBtn.disabled = false;
                    return;
                }
                await Promise.all(updates);

                // Handle BYEs: after X-slot assignment, check R1 PLAYOFF matches
                var r1Fresh = await A.client.from('matches').select('*')
                    .eq('tournament_id', tournamentId).eq('round_number', 1)
                    .is('group_number', null).neq('round', 'IG')
                    .order('match_order');
                var r1Data = r1Fresh.data || [];
                for (var i = 0; i < r1Data.length; i++) {
                    var rm = r1Data[i];
                    if (rm.player1_id && !rm.player2_id && rm.status !== 'completed') {
                        await A.client.from('matches').update({ winner_id: rm.player1_id, status: 'completed', score: 'BYE' }).eq('id', rm.id);
                    } else if (!rm.player1_id && rm.player2_id && rm.status !== 'completed') {
                        await A.client.from('matches').update({ winner_id: rm.player2_id, status: 'completed', score: 'BYE' }).eq('id', rm.id);
                    }
                }

                // Auto-advance BYE winners to R2
                r1Fresh = await A.client.from('matches').select('*')
                    .eq('tournament_id', tournamentId).eq('round_number', 1)
                    .is('group_number', null).neq('round', 'IG')
                    .order('match_order');
                var r2Res = await A.client.from('matches').select('*')
                    .eq('tournament_id', tournamentId).eq('round_number', 2)
                    .order('match_order');
                var r1List = r1Fresh.data || [];
                var r2List = r2Res.data || [];

                for (var i = 0; i < r1List.length; i++) {
                    var m = r1List[i];
                    if (m.winner_id && m.score === 'BYE' && r2List.length > 0) {
                        var nextMatchIdx = Math.floor(i / 2);
                        if (nextMatchIdx < r2List.length) {
                            var nextMatch = r2List[nextMatchIdx];
                            var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                            var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                            var updData = {};
                            updData[updateField] = m.winner_id;
                            updData[seedField] = m.seed1 || m.seed2;
                            await A.client.from('matches').update(updData).eq('id', nextMatch.id);
                        }
                    }
                }

                A.showToast(L.xSlotSaved, 'success');
                renderBracketManagement(tournamentId, 'bracket');
            });
        }
        } catch(err) { console.error('X-slot render error:', err); }
    }

    // ---- Finalize Tournament ----
    async function finalizeTournament(tournament, matches, playersMap) {
        // Dispatch to group_league finalization
        if (tournament.bracket_type === 'group_league') {
            await finalizeGroupLeagueTournament(tournament, matches, playersMap);
            return;
        }
        // Dispatch to group finalization for round_robin
        if (tournament.bracket_type === 'round_robin') {
            await finalizeGroupTournament(tournament, matches, playersMap);
            return;
        }
        // Dispatch to FIC finalization
        if (tournament.bracket_type === 'fic') {
            await finalizeFicTournament(tournament, matches, playersMap);
            return;
        }

        try {
            var drawSize = tournament.draw_size || 16;
            var totalRounds = Math.log2(drawSize);
            var season = new Date().getFullYear();

            // Load points rules for this tournament's level
            var rulesMap = {};
            // Friendly очков не даёт — правила не грузим, считать нечего
            if (tournament.level_id && !isUnrankedTournament(tournament)) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            // Determine round_reached for each player
            var playerResults = {}; // player_id → { round_reached, points_earned }

            // Find the final match to determine winner (exclude 3RD place match)
            var finalMatch = matches.find(function(m) { return m.round_number === totalRounds && m.round !== '3RD'; });

            if (finalMatch && finalMatch.winner_id) {
                // Winner
                playerResults[finalMatch.winner_id] = {
                    round_reached: 'W',
                    points_earned: rulesMap['W'] || 0
                };
                // Finalist (loser of final)
                var finalist = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                if (finalist) {
                    playerResults[finalist] = {
                        round_reached: 'F',
                        points_earned: rulesMap['F'] || 0
                    };
                }
            }

            // 3rd place match: winner = 3rd, loser excluded from results
            var thirdPlaceExclude = {};
            var thirdPlaceMatch = matches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
            if (thirdPlaceMatch) {
                playerResults[thirdPlaceMatch.winner_id] = {
                    round_reached: '3RD',
                    points_earned: rulesMap['3RD'] || rulesMap['SF'] || 0
                };
                // Mark loser as excluded (won't appear in results)
                var thirdLoserId = thirdPlaceMatch.winner_id === thirdPlaceMatch.player1_id ? thirdPlaceMatch.player2_id : thirdPlaceMatch.player1_id;
                if (thirdLoserId) thirdPlaceExclude[thirdLoserId] = true;
            }

            // Other players: lost in their round
            matches.forEach(function(m) {
                if (m.status !== 'completed' || !m.winner_id) return;
                if (m.score === 'BYE') return; // Skip BYEs
                if (m.round === '3RD') return; // Handled above

                var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                if (!loserId || playerResults[loserId] || thirdPlaceExclude[loserId]) return;

                // Player lost in round m.round_number → their round_reached is based on that
                var roundKey = getRoundKey(m.round_number, totalRounds);
                playerResults[loserId] = {
                    round_reached: roundKey,
                    points_earned: rulesMap[roundKey] || 0
                };
            });

            // Upsert tournament_results
            var isDbl = isDoublesTournament(tournament);
            var toUpsert = [];
            Object.keys(playerResults).forEach(function(pid) {
                if (!pid || pid === 'null' || pid === 'undefined') return; // Skip external players
                toUpsert.push({
                    tournament_id: tournament.id,
                    player_id: pid,
                    round_reached: playerResults[pid].round_reached,
                    points_earned: playerResults[pid].points_earned,
                    season: season,
                    category_id: tournament.category_id
                });
            });

            // Doubles: expand results to include partners
            if (isDbl) {
                var regRes2 = await A.client.from('tournament_registrations')
                    .select('player_id, partner_id, partner_external_name')
                    .eq('tournament_id', tournament.id);
                toUpsert = expandDoublesResults(toUpsert, regRes2.data || [], true);
            }

            toUpsert = stripFriendlyPoints(tournament, toUpsert);

            if (toUpsert.length > 0) {
                // Clean up old results before inserting (prevents duplicates from re-finalization)
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);

                var upsRes = await A.client.from('tournament_results').insert(toUpsert);
                if (upsRes.error) {
                    A.showToast(upsRes.error.message, 'error');
                    return;
                }

                // Recalculate player points
                var resultPlayerIds = toUpsert.map(function(r) { return r.player_id; });
                if (isDbl) {
                    await recalcDoublesPoints(resultPlayerIds);
                } else {
                    await A.recalcPlayerPoints(resultPlayerIds);
                }
                await saveRatingHistory(tournament, toUpsert, isDbl);
            }

            // Update player form arrays (W/L from recent matches)
            var allPlayerIds = Object.keys(playerResults);
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);

                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });

                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            // Update tournament status
            var statusRes = await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            if (statusRes.error) {
                A.showToast(statusRes.error.message, 'error');
                return;
            }

            // Loyalty: earn points for all approved participants (includes partners)
            await earnTournamentLoyalty(tournament.id);

            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Finalize FIC Tournament ----
    async function finalizeFicTournament(tournament, matches, playersMap) {
        try {
            var drawSize = tournament.draw_size || 16;
            var totalRounds = Math.log2(drawSize);
            var halfDraw = drawSize / 2;
            var season = new Date().getFullYear();

            // Load points rules
            var rulesMap = {};
            // Friendly очков не даёт — правила не грузим, считать нечего
            if (tournament.level_id && !isUnrankedTournament(tournament)) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }


            // Map place → points round_key
            function placeToRoundKey(place) {
                if (place === 1) return 'W';
                if (place === 2) return 'F';
                if (place === 3) return '3RD';
                if (place === 4) return '4TH';
                if (place <= 6) return 'SF';
                if (place <= 8) return 'QF';
                if (place <= 16) return 'R16';
                if (place <= 32) return 'R32';
                return 'R32';
            }

            var playerResults = {};

            // Final round matches determine all places via bit-reversal
            var finalRoundMatches = matches.filter(function(m) {
                return m.round_number === totalRounds;
            }).sort(function(a, b) { return a.match_order - b.match_order; });

            finalRoundMatches.forEach(function(m) {
                if (m.status !== 'completed' || !m.winner_id) return;

                // Место читается прямо по номеру матча последнего круга:
                // первый разыгрывает места 1-2, второй 3-4, третий 5-6 и так
                // далее. Раньше здесь стоял переворот битов — он был написан
                // под прежнюю нумерацию, и места выходили не те: третье
                // доставалось человеку из нижней ветки, а 7-8 пропадали.
                var winnerPlace = (m.match_order - 1) * 2 + 1;
                var loserPlace = winnerPlace + 1;

                var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;

                var winnerKey = placeToRoundKey(winnerPlace);
                playerResults[m.winner_id] = {
                    round_reached: winnerKey,
                    points_earned: rulesMap[winnerKey] || 0,
                    place: winnerPlace
                };

                if (loserId) {
                    var loserKey = placeToRoundKey(loserPlace);
                    playerResults[loserId] = {
                        round_reached: loserKey,
                        points_earned: rulesMap[loserKey] || 0,
                        place: loserPlace
                    };
                }
            });

            // Upsert tournament_results
            var isDblFic = isDoublesTournament(tournament);
            var toUpsert = [];
            Object.keys(playerResults).forEach(function(pid) {
                toUpsert.push({
                    tournament_id: tournament.id,
                    player_id: pid,
                    round_reached: playerResults[pid].round_reached,
                    points_earned: playerResults[pid].points_earned,
                    season: season,
                    category_id: tournament.category_id
                });
            });

            if (isDblFic) {
                var ficRegRes = await A.client.from('tournament_registrations')
                    .select('player_id, partner_id, partner_external_name')
                    .eq('tournament_id', tournament.id);
                toUpsert = expandDoublesResults(toUpsert, ficRegRes.data || [], true);
            }

            toUpsert = stripFriendlyPoints(tournament, toUpsert);

            if (toUpsert.length > 0) {
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);
                var upsRes = await A.client.from('tournament_results').insert(toUpsert);
                if (upsRes.error) {
                    A.showToast(upsRes.error.message, 'error');
                    return;
                }
                var ficResultIds = toUpsert.map(function(r) { return r.player_id; });
                if (isDblFic) {
                    await recalcDoublesPoints(ficResultIds);
                } else {
                    await A.recalcPlayerPoints(ficResultIds);
                }
                await saveRatingHistory(tournament, toUpsert, isDblFic);
            }

            // Update player form arrays (W/L from recent matches)
            var allPlayerIds = Object.keys(playerResults);
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);

                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });

                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            // Update tournament status
            var statusRes = await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            if (statusRes.error) {
                A.showToast(statusRes.error.message, 'error');
                return;
            }

            // Loyalty: earn points for all approved participants
            await earnTournamentLoyalty(tournament.id);

            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize FIC tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Finalize Group Tournament ----
    async function finalizeGroupTournament(tournament, matches, playersMap) {
        try {
            var groupCount = tournament.group_count || 2;
            var qualifiers = tournament.qualifiers_per_group || 2;
            var season = new Date().getFullYear();

            // Load points rules
            var rulesMap = {};
            // Friendly очков не даёт — правила не грузим, считать нечего
            if (tournament.level_id && !isUnrankedTournament(tournament)) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            // Auto-fill G3-G6 if not set in rules (proportional to W)
            var wPts = rulesMap['W'] || 0;
            var groupFallback = { G3: 0.12, G4: 0.06, G5: 0.03, G6: 0.01 };
            ['G3', 'G4', 'G5', 'G6'].forEach(function(gk) {
                if (!rulesMap[gk] && wPts > 0) {
                    rulesMap[gk] = Math.round(wPts * groupFallback[gk]);
                }
            });

            var toUpsert = [];
            var plMatches = matches.filter(isPlayoffMatch);
            var hasPlayoff = plMatches.length > 0;

            if (hasPlayoff) {
                // --- Combined finalization: playoff places + group places for non-qualified ---
                var plDrawSize = 2;
                var plR1 = plMatches.filter(function(m) { return m.round_number === 1; });
                while (plDrawSize < plR1.length * 2) plDrawSize *= 2;
                var plTotalRounds = Math.log2(plDrawSize);

                var playerResults = {};

                // Final → W / F
                var finalMatch = plMatches.find(function(m) { return m.round_number === plTotalRounds && m.round !== '3RD'; });
                if (finalMatch && finalMatch.winner_id) {
                    playerResults[finalMatch.winner_id] = { round_reached: 'W', points_earned: rulesMap['W'] || 0 };
                    var finalist = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                    if (finalist) playerResults[finalist] = { round_reached: 'F', points_earned: rulesMap['F'] || 0 };
                }

                // 3rd place match
                var thirdPM = plMatches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
                if (thirdPM) {
                    playerResults[thirdPM.winner_id] = { round_reached: '3RD', points_earned: rulesMap['3RD'] || rulesMap['SF'] || 0 };
                    var thirdLoserId = thirdPM.winner_id === thirdPM.player1_id ? thirdPM.player2_id : thirdPM.player1_id;
                    if (thirdLoserId) {
                        playerResults[thirdLoserId] = { round_reached: '4TH', points_earned: rulesMap['4TH'] || rulesMap['SF'] || 0 };
                    }
                }

                // Other playoff losers
                plMatches.forEach(function(m) {
                    if (m.status !== 'completed' || !m.winner_id || m.score === 'BYE' || m.round === '3RD') return;
                    var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                    if (!loserId || playerResults[loserId]) return;
                    var roundKey = getRoundKey(m.round_number, plTotalRounds);
                    playerResults[loserId] = { round_reached: roundKey, points_earned: rulesMap[roundKey] || 0 };
                });

                // Add playoff results
                Object.keys(playerResults).forEach(function(pid) {
                    toUpsert.push({
                        tournament_id: tournament.id,
                        player_id: pid,
                        round_reached: playerResults[pid].round_reached,
                        points_earned: playerResults[pid].points_earned,
                        season: season,
                        category_id: tournament.category_id
                    });
                });

                // Collect qualified player IDs (in playoff)
                var qualifiedIds = {};
                plMatches.forEach(function(m) {
                    if (m.player1_id) qualifiedIds[m.player1_id] = true;
                    if (m.player2_id) qualifiedIds[m.player2_id] = true;
                });

                // Non-qualified group players → G3, G4, etc.
                var grpMatches = matches.filter(isGroupMatch);
                for (var g = 1; g <= groupCount; g++) {
                    var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                    var playerIds = [];
                    groupMatchesG.forEach(function(m) {
                        if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                        if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                    });
                    var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                    standings.sort(function(a, b) { return a.place - b.place; });

                    standings.forEach(function(st) {
                        if (qualifiedIds[st.playerId]) return; // already in playoff results
                        var roundKey = 'G' + st.place;
                        toUpsert.push({
                            tournament_id: tournament.id,
                            player_id: st.playerId,
                            round_reached: roundKey,
                            points_earned: rulesMap[roundKey] || 0,
                            season: season,
                            category_id: tournament.category_id
                        });
                    });
                }
            } else {
                // --- Pure group finalization (no playoff) ---
                var grpMatches = matches.filter(isGroupMatch);
                for (var g = 1; g <= groupCount; g++) {
                    var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                    var playerIds = [];
                    groupMatchesG.forEach(function(m) {
                        if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                        if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                    });
                    var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                    standings.sort(function(a, b) { return a.place - b.place; });

                    standings.forEach(function(st) {
                        var roundKey = 'G' + st.place;
                        toUpsert.push({
                            tournament_id: tournament.id,
                            player_id: st.playerId,
                            round_reached: roundKey,
                            points_earned: rulesMap[roundKey] || 0,
                            season: season,
                            category_id: tournament.category_id
                        });
                    });
                }
            }

            // Doubles expansion
            var isDblGrp = isDoublesTournament(tournament);
            if (isDblGrp) {
                var grpRegRes = await A.client.from('tournament_registrations')
                    .select('player_id, partner_id, partner_external_name')
                    .eq('tournament_id', tournament.id);
                toUpsert = expandDoublesResults(toUpsert, grpRegRes.data || [], true);
            }

            toUpsert = stripFriendlyPoints(tournament, toUpsert);

            if (toUpsert.length > 0) {
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);
                var insRes = await A.client.from('tournament_results').insert(toUpsert);
                if (insRes.error) {
                    A.showToast(insRes.error.message, 'error');
                    return;
                }
                var grpResultIds = toUpsert.map(function(r) { return r.player_id; });
                if (isDblGrp) {
                    await recalcDoublesPoints(grpResultIds);
                } else {
                    await A.recalcPlayerPoints(grpResultIds);
                }
                await saveRatingHistory(tournament, toUpsert, isDblGrp);
            }

            // Update player form arrays
            var allPlayerIds = toUpsert.map(function(r) { return r.player_id; });
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);
                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });
                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);

            // Loyalty: earn points for all approved participants
            await earnTournamentLoyalty(tournament.id);

            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize group tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Hook: Add "Bracket" button to tournament list ----
    // Extend renderTournamentsList to add bracket management button


    // ============================================
    // GROUP LEAGUE: Groups + Leagues bracket type
    // ============================================

    // ---- Generate Group League Draw (fixed group size = 4) ----
    async function generateGroupLeagueDraw(tournament, approvedSorted, playersMap) {
        var groupCount = tournament.group_count || 2;
        var maxPart = tournament.max_participants || approvedSorted.length;
        var mainDraw = approvedSorted.slice(0, maxPart);
        var totalPlayers = mainDraw.length;

        if (groupCount < 2) {
            A.showToast(isEn ? 'Need at least 2 groups' : 'Нужно минимум 2 группы', 'error');
            return;
        }
        if (totalPlayers < groupCount * 2) {
            A.showToast(isEn ? 'Need at least 2 players per group' : 'Нужно минимум 2 игрока в группе', 'error');
            return;
        }

        // Seed count: top N players (1 per group)
        var seedCount = Math.min(groupCount, totalPlayers);

        // Split: seeded (top N) + unseeded (rest shuffled)
        var seeded = mainDraw.slice(0, seedCount);
        var unseeded = mainDraw.slice(seedCount);

        // Fisher-Yates shuffle unseeded
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i]; unseeded[i] = unseeded[j]; unseeded[j] = tmp;
        }

        var allPlayers = seeded.concat(unseeded);

        // S-curve (snake) distribution — same as round_robin
        // Incomplete last pass fills from group A forward
        var groups = [];
        for (var g = 0; g < groupCount; g++) groups.push([]);

        var fullPasses = Math.floor(allPlayers.length / groupCount);
        var remainder = allPlayers.length % groupCount;

        for (var idx = 0; idx < allPlayers.length; idx++) {
            var pass = Math.floor(idx / groupCount);
            var posInPass = idx % groupCount;
            var groupIdx;
            if (pass < fullPasses) {
                groupIdx = (pass % 2 === 0) ? posInPass : (groupCount - 1 - posInPass);
            } else {
                groupIdx = posInPass;
            }
            groups[groupIdx].push({
                reg: allPlayers[idx],
                seed: idx < seedCount ? (idx + 1) : null
            });
        }

        // Generate round-robin matches within each group (circle method)
        var matchesToInsert = [];
        for (var g = 0; g < groupCount; g++) {
            var gPlayers = groups[g];
            var rrRounds = generateRoundRobinRounds(gPlayers);
            var matchOrder = 0;

            for (var rr = 0; rr < rrRounds.length; rr++) {
                for (var mp = 0; mp < rrRounds[rr].length; mp++) {
                    matchOrder++;
                    var pair = rrRounds[rr][mp];
                    matchesToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: pair.p1.reg.player_id,
                        player2_id: pair.p2.reg.player_id,
                        round: 'G' + (g + 1),
                        round_number: rr + 1,
                        match_order: matchOrder,
                        group_number: g + 1,
                        status: 'upcoming',
                        seed1: pair.p1.seed,
                        seed2: pair.p2.seed
                    });
                }
            }
        }

        // Insert matches
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Update registrations: group_number, seed_number, status → draw
        var regUpdates = [];
        for (var g = 0; g < groupCount; g++) {
            for (var p = 0; p < groups[g].length; p++) {
                var entry = groups[g][p];
                regUpdates.push(
                    A.client.from('tournament_registrations').update({
                        group_number: g + 1,
                        seed_number: entry.seed,
                        status: 'draw'
                    }).eq('id', entry.reg.id)
                );
            }
        }
        await Promise.all(regUpdates);

        // Auto-assign schedule
        await assignGroupSchedule(tournament, matchesToInsert.length);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    // ---- Generate League Playoffs from Group Standings ----
    async function generateLeaguePlayoffs(tournament, matches, playersMap) {
        try {
            var groupCount = tournament.group_count || 2;
            var grpMatches = matches.filter(isGroupMatch);

            // 1. Get standings for each group
            var qualifiers = tournament.qualifiers_per_group || 2;
            var plQualified = []; // top qualifiers → Premier League (places 1..qualifiers)
            var clQualified = []; // rest → Consolation League (places qualifiers+1..end)

            for (var g = 1; g <= groupCount; g++) {
                var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                var playerIds = [];
                groupMatchesG.forEach(function(m) {
                    if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                    if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                });
                var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);

                // Apply manual overrides
                var mgp = tournament.manual_group_places || {};
                if (mgp[String(g)]) {
                    var ov = mgp[String(g)];
                    standings.forEach(function(st) {
                        if (ov[st.playerId] !== undefined) st.place = ov[st.playerId];
                    });
                }
                standings.sort(function(a, b) { return a.place - b.place; });

                // Top qualifiers → PL, rest → CL
                for (var qi = 0; qi < standings.length; qi++) {
                    var st = standings[qi];
                    var entry = {
                        playerId: st.playerId,
                        groupIdx: g - 1,
                        place: st.place,
                        wins: st.wins,
                        setsWon: st.setsWon,
                        setsLost: st.setsLost,
                        gamesWon: st.gamesWon,
                        gamesLost: st.gamesLost
                    };
                    if (st.place <= qualifiers) {
                        plQualified.push(entry);
                    } else {
                        clQualified.push(entry);
                    }
                }
            }

            if (plQualified.length < 2 || clQualified.length < 2) {
                A.showToast(isEn ? 'Not enough players for leagues (PL:' + plQualified.length + ', CL:' + clQualified.length + ')' : 'Недостаточно игроков для лиг (Высшая:' + plQualified.length + ', Утеш.:' + clQualified.length + ')', 'error');
                return;
            }

            // 2. Build both league brackets
            var plMatches = buildLeagueSEBracket(tournament, plQualified, 'PL');
            var clMatches = buildLeagueSEBracket(tournament, clQualified, 'CL');

            // 3. Insert all matches
            var allToInsert = plMatches.concat(clMatches);
            var insertRes = await A.client.from('matches').insert(allToInsert);
            if (insertRes.error) {
                A.showToast(insertRes.error.message, 'error');
                return;
            }

            // 4. Auto-advance BYE winners for both leagues
            await advanceLeagueByes(tournament.id, 'PL');
            await advanceLeagueByes(tournament.id, 'CL');

            A.showToast(isEn ? 'League brackets generated' : 'Сетки лиг сформированы', 'success');
        } catch (err) {
            console.error('Generate league playoffs error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Build SE Bracket for a League (PL or CL) ----
    function buildLeagueSEBracket(tournament, qualified, prefix) {
        var drawSize = 2;
        while (drawSize < qualified.length) drawSize *= 2;
        var totalRounds = Math.log2(drawSize);

        // Seeds: best place in each group gets seeded, rest are unseeded
        // For PL: place=1 are seeds. For CL: the lowest place value = seeds
        var minPlace = qualified.reduce(function(min, q) { return q.place < min ? q.place : min; }, 9999);
        var seeds = qualified.filter(function(q) { return q.place === minPlace; });
        var unseeded = qualified.filter(function(q) { return q.place !== minPlace; });

        // Sort seeds by group performance: wins DESC → set% DESC → game% DESC
        // Best performer = seed 1 → gets best BYE position
        seeds.sort(function(a, b) {
            if (b.wins !== a.wins) return b.wins - a.wins;
            var aSetPct = a.setsWon + a.setsLost > 0 ? a.setsWon / (a.setsWon + a.setsLost) : 0;
            var bSetPct = b.setsWon + b.setsLost > 0 ? b.setsWon / (b.setsWon + b.setsLost) : 0;
            if (bSetPct !== aSetPct) return bSetPct - aSetPct;
            var aGamePct = a.gamesWon + a.gamesLost > 0 ? a.gamesWon / (a.gamesWon + a.gamesLost) : 0;
            var bGamePct = b.gamesWon + b.gamesLost > 0 ? b.gamesWon / (b.gamesWon + b.gamesLost) : 0;
            return bGamePct - aGamePct;
        });

        var seedCount = Math.min(seeds.length, drawSize);

        var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
            ? SEED_POSITIONS[drawSize]
            : (drawSize === 8 ? [1, 8, 5, 4] : (drawSize === 4 ? [1, 4, 3, 2] : [1, 2]));

        // Build draw array
        var draw = new Array(drawSize);
        for (var i = 0; i < drawSize; i++) draw[i] = null;

        // Place seeds at ITF positions
        for (var s = 0; s < seeds.length && s < seedPositions.length; s++) {
            draw[seedPositions[s] - 1] = {
                player_id: seeds[s].playerId,
                seed: s + 1,
                groupIdx: seeds[s].groupIdx
            };
        }

        // Reserve BYE slots opposite to top seeds
        // Top seeds get BYE advantage: seed1 → BYE opponent, seed2 → BYE opponent, etc.
        var numByes = drawSize - qualified.length;
        var byeSlots = {};
        for (var b = 0; b < numByes && b < seedPositions.length; b++) {
            var seedSlot = seedPositions[b] - 1; // 0-indexed
            var byeSlot = (seedSlot % 2 === 0) ? seedSlot + 1 : seedSlot - 1;
            if (draw[byeSlot] === null) {
                byeSlots[byeSlot] = true;
            }
        }

        // Shuffle unseeded
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i]; unseeded[i] = unseeded[j]; unseeded[j] = tmp;
        }

        // Sort unseeded by most-constrained group first
        var groupCounts = {};
        qualified.forEach(function(q) { groupCounts[q.groupIdx] = (groupCounts[q.groupIdx] || 0) + 1; });
        unseeded.sort(function(a, b) { return (groupCounts[b.groupIdx] || 0) - (groupCounts[a.groupIdx] || 0); });

        // Place unseeded with cross-group avoidance (skip reserved BYE slots)
        var emptySlots = [];
        for (var i = 0; i < drawSize; i++) { if (draw[i] === null && !byeSlots[i]) emptySlots.push(i); }

        var halfSize = Math.max(drawSize / 2, 2);

        for (var ui = 0; ui < unseeded.length; ui++) {
            var player = unseeded[ui];
            var bestSlotIdx = -1;
            var bestScore = -1;

            for (var si = 0; si < emptySlots.length; si++) {
                var slot = emptySlots[si];
                var score = 0;

                // Check R1 opponent (adjacent slot)
                var opponentSlot = (slot % 2 === 0) ? slot + 1 : slot - 1;
                var opponent = draw[opponentSlot];
                if (opponent && opponent.groupIdx === player.groupIdx) {
                    score = 0; // Same group in R1 — worst
                } else {
                    var halfIdx = Math.floor(slot / halfSize);
                    var sameInHalf = false;
                    var start = halfIdx * halfSize;
                    for (var hi = start; hi < start + halfSize; hi++) {
                        if (draw[hi] && draw[hi].groupIdx === player.groupIdx) { sameInHalf = true; break; }
                    }
                    score = sameInHalf ? 1 : 2;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestSlotIdx = si;
                    if (score === 2) break;
                }
            }

            if (bestSlotIdx === -1) bestSlotIdx = 0;
            draw[emptySlots[bestSlotIdx]] = {
                player_id: player.playerId,
                seed: null,
                groupIdx: player.groupIdx
            };
            emptySlots.splice(bestSlotIdx, 1);
        }

        // Generate R1 matches
        var matchesToInsert = [];
        var matchOrder = 0;

        for (var i = 0; i < drawSize; i += 2) {
            matchOrder++;
            var slot1 = draw[i];
            var slot2 = draw[i + 1];
            var m = {
                tournament_id: tournament.id,
                player1_id: slot1 ? slot1.player_id : null,
                player2_id: slot2 ? slot2.player_id : null,
                round: prefix + '-R1',
                round_number: 1,
                match_order: matchOrder,
                group_number: null,
                status: 'upcoming',
                seed1: slot1 ? slot1.seed : null,
                seed2: slot2 ? slot2.seed : null
            };

            // Handle BYE
            if (m.player1_id && !m.player2_id) {
                m.winner_id = m.player1_id; m.status = 'completed'; m.score = 'BYE';
            } else if (!m.player1_id && m.player2_id) {
                m.winner_id = m.player2_id; m.status = 'completed'; m.score = 'BYE';
            }

            matchesToInsert.push(m);
        }

        // Subsequent rounds
        for (var r = 2; r <= totalRounds; r++) {
            var matchesInRound = drawSize / Math.pow(2, r);
            for (var mi = 1; mi <= matchesInRound; mi++) {
                var roundLabel = r === totalRounds ? prefix + '-F' :
                                 r === totalRounds - 1 ? prefix + '-SF' :
                                 r === totalRounds - 2 ? prefix + '-QF' : prefix + '-R' + r;
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: null, player2_id: null,
                    round: roundLabel,
                    round_number: r,
                    match_order: mi,
                    group_number: null,
                    status: 'upcoming',
                    seed1: null, seed2: null
                });
            }
        }

        // 3rd place match
        matchesToInsert.push({
            tournament_id: tournament.id,
            player1_id: null, player2_id: null,
            round: prefix + '-3RD',
            round_number: totalRounds,
            match_order: 0,
            group_number: null,
            status: 'upcoming',
            seed1: null, seed2: null
        });

        return matchesToInsert;
    }

    // ---- Auto-advance BYE winners for a league ----
    async function advanceLeagueByes(tournamentId, prefix) {
        var freshRes = await A.client.from('matches').select('*')
            .eq('tournament_id', tournamentId)
            .like('round', prefix + '-%')
            .order('round_number').order('match_order');
        var allM = freshRes.data || [];

        var r1 = allM.filter(function(m) { return m.round_number === 1; });
        var r2 = allM.filter(function(m) { return m.round_number === 2 && m.round !== prefix + '-3RD'; });

        for (var i = 0; i < r1.length; i++) {
            var m = r1[i];
            if (m.winner_id && m.score === 'BYE' && r2.length > 0) {
                var nextMatchIdx = Math.floor(i / 2);
                if (nextMatchIdx < r2.length) {
                    var nextMatch = r2[nextMatchIdx];
                    var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                    var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                    var updateData = {};
                    updateData[updateField] = m.winner_id;
                    updateData[seedField] = (i % 2 === 0) ? m.seed1 : m.seed2;
                    await A.client.from('matches').update(updateData).eq('id', nextMatch.id);
                }
            }
        }
    }

    // ---- Render Group League Panel (admin) ----
    function renderGroupLeaguePanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted, isDbl, regsMap) {
        var groupCount = tournament.group_count || 2;
        var html = '';
        var groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Split matches
        var grpMatches = matches.filter(isGroupMatch);
        var plMatches = matches.filter(isPLMatch);
        var clMatches = matches.filter(isCLMatch);
        var hasLeagues = plMatches.length > 0 || clMatches.length > 0;

        // Group completion
        var allGroupCompleted = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });
        var anyGroupCompleted = grpMatches.some(function(m) { return m.status === 'completed'; });

        // League completion
        var allPLCompleted = plMatches.length > 0 && plMatches.every(function(m) { return m.status === 'completed'; });
        var allCLCompleted = clMatches.length > 0 && clMatches.every(function(m) { return m.status === 'completed'; });
        var allLeaguesCompleted = hasLeagues && allPLCompleted && allCLCompleted;

        // Overall
        var totalAllCompleted = allGroupCompleted && (!hasLeagues || allLeaguesCompleted);

        // Regenerate button (only before any results)
        if (!anyGroupCompleted && !isTournamentCompleted) {
            html += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">';
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
            html += '</div>';
        }

        // Build playerGroupLabel map
        var playerGroupLabel = {};
        for (var g = 1; g <= groupCount; g++) {
            var gm = grpMatches.filter(function(m) { return m.group_number === g; });
            var pids = [];
            gm.forEach(function(m) {
                if (m.player1_id && pids.indexOf(m.player1_id) === -1) pids.push(m.player1_id);
                if (m.player2_id && pids.indexOf(m.player2_id) === -1) pids.push(m.player2_id);
            });
            var st = calculateGroupStandings(pids, gm, playersMap);

            var mgp = tournament.manual_group_places || {};
            if (mgp[String(g)]) {
                var ov = mgp[String(g)];
                st.forEach(function(s) { if (ov[s.playerId] !== undefined) s.place = ov[s.playerId]; });
            }
            st.sort(function(a, b) { return a.place - b.place; });
            var letter = groupLetters[g - 1] || String(g);
            st.forEach(function(s) { playerGroupLabel[s.playerId] = letter + s.place; });
        }

        // ---- Group tables ----
        for (var g = 1; g <= groupCount; g++) {
            var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
            if (!groupMatchesG.length) continue;

            var playerIds = [];
            groupMatchesG.forEach(function(m) {
                if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
            });

            var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
            var groupHasResults = groupMatchesG.some(function(m) { return m.status === 'completed'; });

            var manualPlaces = tournament.manual_group_places || {};
            var gKey = String(g);
            if (manualPlaces[gKey]) {
                var overrides = manualPlaces[gKey];
                standings.forEach(function(st) {
                    if (overrides[st.playerId] !== undefined) st.place = overrides[st.playerId];
                });
            }

            var tieGroups = {};
            standings.forEach(function(st) {
                var key = st.wins; if (!tieGroups[key]) tieGroups[key] = [];
                tieGroups[key].push(st.playerId);
            });
            var tiedPlayerIds = {};
            Object.keys(tieGroups).forEach(function(key) {
                if (tieGroups[key].length >= 2) {
                    tieGroups[key].forEach(function(pid) { tiedPlayerIds[pid] = tieGroups[key]; });
                }
            });

            standings.sort(function(a, b) {
                var sa = a.seed || 9999; var sb = b.seed || 9999;
                if (sa !== sb) return sa - sb;
                return playerIds.indexOf(a.playerId) - playerIds.indexOf(b.playerId);
            });

            var letter = groupLetters[g - 1] || String(g);
            html += '<div class="ad-grp-block">';
            html += '<div class="ad-grp-title">' + L.groupLabel + ' ' + letter + '</div>';
            html += '<div class="ad-table-wrap" style="overflow-x:auto;">';
            html += '<table class="ad-table ad-grp-matrix">';
            html += '<thead><tr>';
            html += '<th style="width:30px;">№</th>';
            html += '<th>' + (isEn ? 'Player' : 'Игрок') + '</th>';
            for (var c = 0; c < standings.length; c++) {
                html += '<th class="ad-grp-score" style="width:60px;text-align:center;">' + (c + 1) + '</th>';
            }
            html += '<th class="ad-grp-pts" style="width:40px;text-align:center;">' + L.groupWins + '</th>';
            html += '<th class="ad-grp-place" style="width:50px;text-align:center;">' + L.groupPlace + '</th>';
            html += '</tr></thead>';

            html += '<tbody>';
            for (var row = 0; row < standings.length; row++) {
                var st = standings[row];
                var p = playersMap[st.playerId] || {};
                var pName = isDbl
                    ? getTeamDisplayName(st.playerId, regsMap, playersMap, true)
                    : A.esc(isEn ? (p.name_en || p.name || '?') : (p.name || '?'));
                var seedHtml = st.seed ? ' <span class="ad-badge" style="font-size:0.65rem;">[' + st.seed + ']</span>' : '';
                // Highlight: top half of qualifiers → PL (green), bottom half → CL (dim)
                var glQualifiers = tournament.qualifiers_per_group || 4;
                var glPlCutoff = Math.floor(Math.min(glQualifiers, standings.length) / 2);
                var isPLRow = st.place <= glPlCutoff && allGroupCompleted;
                var isCLRow = st.place > glPlCutoff && st.place <= glQualifiers && allGroupCompleted;

                html += '<tr' + (isPLRow && hasLeagues ? ' style="background:rgba(204,255,0,0.06);"' : '') +
                    (isCLRow && hasLeagues ? ' style="background:rgba(255,255,255,0.03);"' : '') + '>';
                html += '<td style="font-weight:600;text-align:center;">' + (row + 1) + '</td>';
                html += '<td style="white-space:nowrap;">' + pName + seedHtml +
                    (isPLRow && hasLeagues ? ' <span style="color:var(--accent);font-size:0.65rem;">&#9654;</span>' : '') +
                    (isCLRow && hasLeagues ? ' <span style="color:var(--text-dim);font-size:0.65rem;">&#9654;</span>' : '') + '</td>';

                for (var col = 0; col < standings.length; col++) {
                    if (row === col) {
                        html += '<td class="ad-grp-diag">&times;</td>';
                    } else {
                        var opponentId = standings[col].playerId;
                        var match = findGroupMatch(groupMatchesG, st.playerId, opponentId);
                        if (match && match.status === 'completed' && match.score) {
                            var scoreDisplay = formatGroupScore(match, st.playerId);
                            var isWin = match.winner_id === st.playerId;
                            html += '<td class="ad-grp-score ' + (isWin ? 'ad-grp-win' : 'ad-grp-loss') + '" ' +
                                'data-match-edit="' + match.id + '" data-row-player="' + st.playerId + '" style="cursor:pointer;text-align:center;">' +
                                scoreDisplay + '</td>';
                        } else if (match) {
                            html += '<td class="ad-grp-score ad-grp-pending" data-match-edit="' + match.id + '" data-row-player="' + st.playerId + '" ' +
                                'style="cursor:pointer;text-align:center;">—</td>';
                        } else {
                            html += '<td class="ad-grp-score" style="text-align:center;">—</td>';
                        }
                    }
                }

                html += '<td class="ad-grp-pts" style="text-align:center;font-weight:600;">' + st.wins + '</td>';
                if (!groupHasResults) {
                    html += '<td class="ad-grp-place" style="text-align:center;font-weight:700;">—</td>';
                } else if (tiedPlayerIds[st.playerId] && !isTournamentCompleted) {
                    var tiedGroup = tiedPlayerIds[st.playerId];
                    var tiedStandings = standings.filter(function(s) { return tiedGroup.indexOf(s.playerId) !== -1; });
                    var minPlace = Math.min.apply(null, tiedStandings.map(function(s) { return s.place; }));
                    html += '<td class="ad-grp-place" style="text-align:center;">' +
                        '<select class="ad-grp-place-select" data-group="' + g + '" data-player="' + st.playerId + '" ' +
                        'style="background:rgba(204,255,0,0.1);color:var(--accent);border:1px solid var(--accent);border-radius:4px;' +
                        'font-weight:700;font-size:0.85rem;padding:2px 4px;cursor:pointer;text-align:center;width:42px;">';
                    for (var pi = 0; pi < tiedGroup.length; pi++) {
                        var placeVal = minPlace + pi;
                        html += '<option value="' + placeVal + '"' + (placeVal === st.place ? ' selected' : '') + '>' + placeVal + '</option>';
                    }
                    html += '</select></td>';
                } else {
                    var glQualifiers2 = tournament.qualifiers_per_group || 2;
                    var placeAccent = st.place <= glQualifiers2;
                    html += '<td class="ad-grp-place" style="text-align:center;font-weight:700;' +
                        (placeAccent ? 'color:var(--accent);' : '') + '">' + st.place + '</td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table></div></div>';
        }

        // ---- League brackets ----
        if (hasLeagues) {
            html += '<div class="ad-dual-league" style="display:flex;gap:24px;margin-top:24px;">';

            // Premier League
            html += '<div class="ad-league-bracket" style="flex:1;min-width:0;">';
            html += '<div class="ad-grp-section-title" style="color:var(--accent);">' + L.premierLeague + '</div>';
            var plR1 = plMatches.filter(function(m) { return m.round_number === 1; });
            var plDrawSize = 1;
            while (plDrawSize < plR1.length * 2) plDrawSize *= 2;
            if (plDrawSize < 2) plDrawSize = plMatches.length * 2;
            html += renderLeagueBracketHtml(plMatches, playersMap, plDrawSize, 'PL', playerGroupLabel);
            html += '</div>';

            // Consolation League
            html += '<div class="ad-league-bracket" style="flex:1;min-width:0;">';
            html += '<div class="ad-grp-section-title" style="color:var(--text-secondary);">' + L.consolationLeague + '</div>';
            var clR1 = clMatches.filter(function(m) { return m.round_number === 1; });
            var clDrawSize = 1;
            while (clDrawSize < clR1.length * 2) clDrawSize *= 2;
            if (clDrawSize < 2) clDrawSize = clMatches.length * 2;
            html += renderLeagueBracketHtml(clMatches, playersMap, clDrawSize, 'CL', playerGroupLabel);
            html += '</div>';

            html += '</div>'; // /ad-dual-league
        }

        // Action buttons
        html += '<div style="display:flex;justify-content:center;gap:12px;margin-top:24px;padding:16px 0;">';
        if (allGroupCompleted && !hasLeagues && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkGenLeagues" style="font-size:1rem;padding:12px 32px;">' + L.generateLeagues + '</button>';
        }
        if (totalAllCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize" style="font-size:1rem;padding:12px 32px;">' + L.finalizeTournament + '</button>';
        }
        html += '</div>';

        return html;
    }

    // ---- Render SE bracket HTML for a league (PL or CL) ----
    function renderLeagueBracketHtml(leagueMatches, playersMap, drawSize, prefix, playerGroupLabel) {
        // Filter out 3RD match, render as regular SE bracket
        var nonThird = leagueMatches.filter(function(m) { return m.round !== prefix + '-3RD'; });
        var totalRounds = Math.log2(drawSize);

        // Reuse renderPlayoffBracketHtml logic but with league-specific round names
        function leagueRoundName(roundNum, totalR) {
            var roundsFromEnd = totalR - roundNum;
            if (roundsFromEnd === 0) return L.roundF;
            if (roundsFromEnd === 1) return L.roundSF;
            if (roundsFromEnd === 2) return L.roundQF;
            if (roundsFromEnd === 3) return L.roundR16;
            return isEn ? 'Round ' + roundNum : 'Раунд ' + roundNum;
        }

        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [], outcome: '' };
            var ex = extractOutcome(score);
            var sets = ex.sets ? ex.sets.split(' ') : [];
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets, outcome: ex.outcome };
        }

        var html = '<div class="ad-brk-scroll"><div class="ad-brk-grid">';

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = nonThird.filter(function(m) { return m.round_number === r; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            var roundName = leagueRoundName(r, totalRounds);

            html += '<div class="ad-brk-round">';
            html += '<div class="ad-brk-title">' + roundName + '</div>';
            html += '<div class="ad-brk-matches">';

            roundMatches.forEach(function(match) {
                var p1 = playersMap[match.player1_id];
                var p2 = playersMap[match.player2_id];
                var p1GrpLbl = match.player1_id && playerGroupLabel[match.player1_id] ? playerGroupLabel[match.player1_id] : '';
                var p2GrpLbl = match.player2_id && playerGroupLabel[match.player2_id] ? playerGroupLabel[match.player2_id] : '';
                var p1Name = p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : '<span style="color:var(--text-dim);">TBD</span>');
                var p2Name = p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : '<span style="color:var(--text-dim);">TBD</span>');

                var isCompleted = match.status === 'completed';
                var isBye = match.score === 'BYE';
                var p1Winner = isCompleted && match.winner_id === match.player1_id;
                var p2Winner = isCompleted && match.winner_id === match.player2_id;
                var canEdit = match.player1_id && match.player2_id && !isBye;

                var matchClass = 'ad-brk-match' + (isCompleted ? ' completed' : '');
                var setData = parseSets(match.score);

                html += '<div class="' + matchClass + '">';
                if (match.scheduled_time) {
                    var schedInfo = match.scheduled_time.slice(0, 5);
                    if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
                    html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
                }
                var p1SeedHtml = '<span class="ad-brk-seed">' + (match.seed1 ? '[' + match.seed1 + ']' : '') + '</span>';
                var p1LblHtml = '<span class="ad-brk-grp-label">' + (p1GrpLbl || '') + '</span>';
                html += '<div class="ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : '')) + '">' +
                    p1SeedHtml + p1LblHtml +
                    '<span class="ad-brk-name">' + p1Name + '</span><span class="ad-brk-sets">';
                setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                var p2SeedHtml = '<span class="ad-brk-seed">' + (match.seed2 ? '[' + match.seed2 + ']' : '') + '</span>';
                var p2LblHtml = '<span class="ad-brk-grp-label">' + (p2GrpLbl || '') + '</span>';
                html += '<div class="ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : '')) + '">' +
                    p2SeedHtml + p2LblHtml +
                    '<span class="ad-brk-name">' + p2Name + '</span><span class="ad-brk-sets">';
                setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                if (setData.outcome) html += '<span class="ad-brk-outcome">' + setData.outcome + '</span>';
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }
                html += '</div>';
            });

            html += '</div></div>'; // /ad-brk-matches /ad-brk-round

            if (r < totalRounds) {
                var pairCount = Math.floor(roundMatches.length / 2);
                html += '<div class="ad-brk-connector">';
                html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                html += '<div class="ad-brk-connector-inner">';
                for (var ci = 0; ci < pairCount; ci++) {
                    html += '<div class="ad-brk-conn-pair"><div class="ad-brk-conn-top"></div><div class="ad-brk-conn-mid"></div><div class="ad-brk-conn-bottom"></div></div>';
                }
                html += '</div></div>';
            }
        }

        html += '</div></div>'; // /ad-brk-grid /ad-brk-scroll

        // 3rd place match
        var thirdMatch = leagueMatches.find(function(m) { return m.round === prefix + '-3RD'; });
        if (thirdMatch) {
            var tp1 = playersMap[thirdMatch.player1_id];
            var tp2 = playersMap[thirdMatch.player2_id];
            var tp1Name = tp1 ? A.esc(isEn ? (tp1.name_en || tp1.name) : tp1.name) : (thirdMatch.player1_id ? 'TBD' : '—');
            var tp2Name = tp2 ? A.esc(isEn ? (tp2.name_en || tp2.name) : tp2.name) : (thirdMatch.player2_id ? 'TBD' : '—');
            var tCompleted = thirdMatch.status === 'completed';
            var tp1Win = tCompleted && thirdMatch.winner_id === thirdMatch.player1_id;
            var tp2Win = tCompleted && thirdMatch.winner_id === thirdMatch.player2_id;
            var tCanEdit = thirdMatch.player1_id && thirdMatch.player2_id && thirdMatch.score !== 'BYE';
            var tSetData = parseSets(thirdMatch.score);

            html += '<div style="margin-top:16px;display:flex;justify-content:flex-end;">';
            html += '<div style="width:220px;">';
            html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + L.round3rd + '</div>';
            html += '<div class="ad-brk-match' + (tCompleted ? ' completed' : '') + '">';
            html += '<div class="ad-brk-player' + (tp1Win ? ' winner' : (tp2Win ? ' loser' : '')) + '">' +
                '<span class="ad-brk-name">' + tp1Name + '</span><span class="ad-brk-sets">';
            tSetData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            html += '<div class="ad-brk-player' + (tp2Win ? ' winner' : (tp1Win ? ' loser' : '')) + '">' +
                '<span class="ad-brk-name">' + tp2Name + '</span><span class="ad-brk-sets">';
            tSetData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            if (tSetData.outcome) html += '<span class="ad-brk-outcome">' + tSetData.outcome + '</span>';
            if (tCanEdit) {
                html += '<button class="ad-brk-edit" data-match-edit="' + thirdMatch.id + '">' +
                    (tCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
            }
            html += '</div></div></div>';
        }

        return html;
    }

    // ---- Finalize Group League Tournament ----
    async function finalizeGroupLeagueTournament(tournament, matches, playersMap) {
        try {
            var groupCount = tournament.group_count || 2;
            var season = new Date().getFullYear();

            // Load points rules
            var rulesMap = {};
            // Friendly очков не даёт — правила не грузим, считать нечего
            if (tournament.level_id && !isUnrankedTournament(tournament)) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            var toUpsert = [];

            // Process each league
            function processLeague(leagueMatches, multiplier, prefix) {
                if (leagueMatches.length === 0) return;

                var lR1 = leagueMatches.filter(function(m) { return m.round_number === 1; });
                var lDrawSize = 1;
                while (lDrawSize < lR1.length * 2) lDrawSize *= 2;
                var lTotalRounds = Math.log2(lDrawSize);
                var playerResults = {};

                // Final → W / F
                var finalMatch = leagueMatches.find(function(m) {
                    return m.round_number === lTotalRounds && m.round !== prefix + '-3RD';
                });
                if (finalMatch && finalMatch.winner_id) {
                    playerResults[finalMatch.winner_id] = { round_reached: 'W', points_earned: Math.round((rulesMap['W'] || 0) * multiplier) };
                    var finalist = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                    if (finalist) playerResults[finalist] = { round_reached: 'F', points_earned: Math.round((rulesMap['F'] || 0) * multiplier) };
                }

                // 3rd place match
                var thirdPM = leagueMatches.find(function(m) { return m.round === prefix + '-3RD' && m.status === 'completed' && m.winner_id; });
                if (thirdPM) {
                    playerResults[thirdPM.winner_id] = { round_reached: '3RD', points_earned: Math.round((rulesMap['3RD'] || rulesMap['SF'] || 0) * multiplier) };
                    var thirdLoserId = thirdPM.winner_id === thirdPM.player1_id ? thirdPM.player2_id : thirdPM.player1_id;
                    if (thirdLoserId) {
                        playerResults[thirdLoserId] = { round_reached: '4TH', points_earned: Math.round((rulesMap['4TH'] || rulesMap['SF'] || 0) * multiplier) };
                    }
                }

                // Other losers
                leagueMatches.forEach(function(m) {
                    if (m.status !== 'completed' || !m.winner_id || m.score === 'BYE' || m.round === prefix + '-3RD') return;
                    var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                    if (!loserId || playerResults[loserId]) return;
                    var roundKey = getRoundKey(m.round_number, lTotalRounds);
                    playerResults[loserId] = { round_reached: roundKey, points_earned: Math.round((rulesMap[roundKey] || 0) * multiplier) };
                });

                Object.keys(playerResults).forEach(function(pid) {
                    if (!pid || pid === 'null' || pid === 'undefined') return; // Skip external players (no player_id)
                    toUpsert.push({
                        tournament_id: tournament.id,
                        player_id: pid,
                        round_reached: playerResults[pid].round_reached,
                        points_earned: playerResults[pid].points_earned,
                        season: season,
                        category_id: tournament.category_id
                    });
                });
            }

            // Premier League: full points (multiplier 1.0)
            processLeague(matches.filter(isPLMatch), 1.0, 'PL');

            // Consolation League: half points (multiplier 0.5)
            processLeague(matches.filter(isCLMatch), 0.5, 'CL');

            // Doubles expansion
            var isDblGL = isDoublesTournament(tournament);
            if (isDblGL) {
                var glRegRes = await A.client.from('tournament_registrations')
                    .select('player_id, partner_id, partner_external_name')
                    .eq('tournament_id', tournament.id);
                toUpsert = expandDoublesResults(toUpsert, glRegRes.data || [], true);
            }

            toUpsert = stripFriendlyPoints(tournament, toUpsert);

            if (toUpsert.length > 0) {
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);
                var insRes = await A.client.from('tournament_results').insert(toUpsert);
                if (insRes.error) {
                    A.showToast(insRes.error.message, 'error');
                    return;
                }
                var glResultIds = toUpsert.map(function(r) { return r.player_id; });
                if (isDblGL) {
                    await recalcDoublesPoints(glResultIds);
                } else {
                    await A.recalcPlayerPoints(glResultIds);
                }
                await saveRatingHistory(tournament, toUpsert, isDblGL);
            }

            // Update player form arrays
            var allPlayerIds = toUpsert.map(function(r) { return r.player_id; });
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);
                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });
                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            await earnTournamentLoyalty(tournament.id);
            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize group league tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Loyalty: earn points for tournament participants ----
    async function earnTournamentLoyalty(tournamentId) {
        if (!A.earnLoyaltyPoints) return;
        try {
            // Get all approved participants (include partner_id for doubles)
            var regRes = await A.client.from('tournament_registrations')
                .select('player_id, partner_id')
                .eq('tournament_id', tournamentId)
                .in('status', ['approved', 'draw']);

            var regs = regRes.data || [];
            if (regs.length === 0) return;

            // Collect all player IDs (captains + KSLT partners)
            var playerIds = [];
            regs.forEach(function(r) {
                if (r.player_id) playerIds.push(r.player_id);
                if (r.partner_id) playerIds.push(r.partner_id);
            });
            playerIds = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

            var profRes = await A.client.from('profiles')
                .select('id, player_id')
                .in('player_id', playerIds);

            var profiles = profRes.data || [];
            for (var i = 0; i < profiles.length; i++) {
                await A.earnLoyaltyPoints(profiles[i].id, 'tournament', tournamentId, null);
            }
        } catch (e) {
            console.error('Tournament loyalty earn error:', e);
        }
    }

    // ============================================================
    // ---- Tournament News Panel ----
    // ============================================================

    /**
     * Generate article content from tournament results.
     * Returns { title, titleEn, excerpt, excerptEn, content, contentEn }.
     */
    function generateArticleContent(tournament, results, playersMap, matches, registrations, isDbl) {
        var tName = tournament.title || '';
        var tNameEn = tournament.title_en || tName;

        // Build regs lookup
        var regsById = {};
        (registrations || []).forEach(function(r) {
            regsById[r.player_id || ('ext_' + r.id)] = r;
        });

        // Helpers for player names
        function pName(playerId) {
            var p = playersMap[playerId];
            if (p) return p.name || playerId;
            var reg = regsById[playerId];
            if (reg && reg.is_external && reg.external_name) return reg.external_name;
            return playerId || '?';
        }
        function pNameEn(playerId) {
            var p = playersMap[playerId];
            if (p) return p.name_en || p.name || playerId;
            var reg = regsById[playerId];
            if (reg && reg.is_external && reg.external_name) return reg.external_name;
            return playerId || '?';
        }
        function partnerName(playerId, lang) {
            if (!isDbl) return '';
            var reg = regsById[playerId];
            if (!reg) return '';
            if (reg.partner_id) {
                var pp = playersMap[reg.partner_id];
                if (pp) return ' / ' + (lang === 'en' ? (pp.name_en || pp.name) : pp.name);
                return '';
            }
            if (reg.partner_external_name) return ' / ' + reg.partner_external_name;
            return '';
        }
        function fullName(playerId, lang) {
            return (lang === 'en' ? pNameEn(playerId) : pName(playerId)) + partnerName(playerId, lang);
        }

        // Participant count (for doubles count captain regs only)
        var participantCount = isDbl
            ? (registrations || []).filter(function(r) { return r.status === 'draw' || r.status === 'approved'; }).length
            : (registrations || []).filter(function(r) { return r.status === 'draw' || r.status === 'approved'; }).length;

        var participantWord = isDbl
            ? (isEn ? 'pairs' : 'пар')
            : (isEn ? 'players' : (participantCount === 1 ? 'игрок' : (participantCount < 5 ? 'игрока' : 'игроков')));

        var participantWordEn = isDbl ? 'pairs' : 'players';

        // Sort results by points descending
        var sortedResults = (results || []).slice();
        sortedResults.sort(function(a, b) { return (b.points_earned || 0) - (a.points_earned || 0); });

        // For doubles: filter to captain-only results
        if (isDbl) {
            sortedResults = sortedResults.filter(function(r) { return !!regsById[r.player_id]; });
        }

        // Total points
        var totalPoints = 0;
        sortedResults.forEach(function(r) { totalPoints += r.points_earned || 0; });

        // Group league detection
        var isGroupLeague = tournament.bracket_type === 'group_league' && matches && matches.length > 0;

        // Build content
        function buildContent(lang) {
            var lines = [];
            var intro = lang === 'en'
                ? 'Tournament "' + tNameEn + '" is complete! ' + participantCount + ' ' + participantWordEn + ' competed.'
                : 'Турнир «' + tName + '» завершён! В соревнованиях приняли участие ' + participantCount + ' ' + participantWord + '.';
            if (isDbl) {
                intro += lang === 'en' ? ' Format: doubles.' : ' Формат: парный.';
            }
            if (isGroupLeague) {
                intro += lang === 'en'
                    ? ' The tournament featured a group stage with league playoffs.'
                    : ' Турнир проходил в формате группового этапа с выходом в лиги.';
            }
            lines.push(intro);

            lines.push(lang === 'en' ? 'Congratulations to the winners!' : 'Поздравляем победителей!');

            if (isGroupLeague) {
                // Split results by PL / CL
                var plPlayerIds = {};
                var clPlayerIds = {};
                matches.forEach(function(m) {
                    if (isPLMatch(m)) {
                        if (m.player1_id) plPlayerIds[m.player1_id] = true;
                        if (m.player2_id) plPlayerIds[m.player2_id] = true;
                    } else if (isCLMatch(m)) {
                        if (m.player1_id) clPlayerIds[m.player1_id] = true;
                        if (m.player2_id) clPlayerIds[m.player2_id] = true;
                    }
                });
                var plResults = sortedResults.filter(function(r) { return plPlayerIds[r.player_id]; });
                var clResults = sortedResults.filter(function(r) { return clPlayerIds[r.player_id]; });

                // Premier League
                lines.push(lang === 'en' ? 'Premier League' : 'Высшая лига');
                var plLines = [];
                var medals = ['🥇', '🥈', '🥉'];
                for (var i = 0; i < Math.min(3, plResults.length); i++) {
                    plLines.push(medals[i] + ' ' + fullName(plResults[i].player_id, lang) + ' — ' + (plResults[i].points_earned || 0) + (lang === 'en' ? ' pts' : ' очков'));
                }
                lines.push(plLines.join('\n'));

                // Consolation League
                if (clResults.length > 0) {
                    lines.push(lang === 'en' ? 'Consolation League' : 'Утешительная лига');
                    var clLines = [];
                    for (var j = 0; j < Math.min(3, clResults.length); j++) {
                        clLines.push(medals[j] + ' ' + fullName(clResults[j].player_id, lang) + ' — ' + (clResults[j].points_earned || 0) + (lang === 'en' ? ' pts' : ' очков'));
                    }
                    lines.push(clLines.join('\n'));
                }
            } else {
                // Standard tournament
                lines.push(lang === 'en' ? 'Prize Places' : 'Призовые места');
                var stdMedals = ['🥇', '🥈', '🥉'];
                var stdLines = [];
                for (var k = 0; k < Math.min(3, sortedResults.length); k++) {
                    stdLines.push(stdMedals[k] + ' ' + fullName(sortedResults[k].player_id, lang) + ' — ' + (sortedResults[k].points_earned || 0) + (lang === 'en' ? ' pts' : ' очков'));
                }
                lines.push(stdLines.join('\n'));
            }

            var outro = lang === 'en'
                ? 'A total of ' + totalPoints + ' rating points were distributed. Thank you to all participants for a great game!'
                : 'Всего распределено ' + totalPoints + ' рейтинговых очков. Благодарим всех участников за отличную игру!';
            lines.push(outro);

            return lines.join('\n\n');
        }

        // Build excerpt
        var winner = sortedResults.length > 0 ? fullName(sortedResults[0].player_id, 'ru') : '';
        var winnerEn = sortedResults.length > 0 ? fullName(sortedResults[0].player_id, 'en') : '';
        var excerpt = 'Результаты турнира «' + tName + '».' + (winner ? ' Победитель: ' + winner : '');
        var excerptEn = 'Results: ' + tNameEn + '.' + (winnerEn ? ' Winner: ' + winnerEn : '');

        return {
            title: 'Результаты: ' + tName,
            titleEn: 'Results: ' + tNameEn,
            excerpt: excerpt,
            excerptEn: excerptEn,
            content: buildContent('ru'),
            contentEn: buildContent('en')
        };
    }

    /**
     * Initialize the news panel: load existing article or generate template.
     */
    async function initNewsPanel(tournament, results, playersMap, matches, registrations, isDbl) {
        var container = document.getElementById('adBrkNewsContent');
        if (!container) return;

        // Check if article already exists for this tournament
        var existing = null;
        var res = await A.client.from('news').select('*').eq('tournament_id', tournament.id).maybeSingle();
        if (res.data) existing = res.data;

        // Generate template content
        var generated = generateArticleContent(tournament, results, playersMap, matches, registrations, isDbl);

        // Render the panel
        renderNewsPanel(container, tournament, existing, generated);
    }

    /**
     * Render the News panel UI.
     */
    function renderNewsPanel(container, tournament, existing, generated) {
        // State from existing article or generated template
        var title = existing ? existing.title : generated.title;
        var titleEn = existing ? (existing.title_en || '') : generated.titleEn;
        var titleKg = existing ? (existing.title_kg || '') : '';
        var excerpt = existing ? (existing.excerpt || '') : generated.excerpt;
        var excerptEn = existing ? (existing.excerpt_en || '') : generated.excerptEn;
        var excerptKg = existing ? (existing.excerpt_kg || '') : '';
        var content = existing ? (existing.content || '') : generated.content;
        var contentEn = existing ? (existing.content_en || '') : generated.contentEn;
        var contentKg = existing ? (existing.content_kg || '') : '';
        var galleryUrls = existing && existing.gallery ? existing.gallery.slice() : [];
        var newsId = existing ? existing.id : null;
        var publishedAt = existing ? existing.published_at : null;
        var tgSentAt = existing ? existing.results_notified_at : null;
        var slug = existing ? existing.slug : A.slugify(generated.title);

        // Status label
        var statusHtml = '';
        if (tgSentAt) {
            statusHtml = '<span style="color:#4caf50;font-weight:600;">✅ ' + L.trnNewsTgSent + '</span>';
        } else if (publishedAt) {
            var d = new Date(publishedAt);
            var dateStr = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
            statusHtml = '<span style="color:var(--accent);font-weight:600;">📰 ' + L.trnNewsPublished + ' ' + dateStr + '</span>';
        } else if (existing) {
            statusHtml = '<span style="color:var(--text-secondary);">📝 ' + L.trnNewsDraft + '</span>';
        } else {
            statusHtml = '<span style="color:var(--text-secondary);">✨ ' + L.trnNewsGenerated + '</span>';
        }

        var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h3 style="margin:0;font-size:1.1rem;">📰 ' + L.trnTabNews + '</h3>' +
            '<div id="adNewsStatus">' + statusHtml + '</div>' +
        '</div>';

        // Title card with lang tabs
        html += '<div class="ad-form-card">' +
            '<div class="ad-form-card-title">' + L.trnNewsTitle + '</div>' +
            '<div class="ad-lang-tabs" id="adTrnNewsTitleTabs">' +
                '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
            '</div>' +
            '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                '<div class="ad-field"><input type="text" class="ad-field-input" id="adTrnNewsTitle" placeholder="' + L.trnNewsTitle + ' (RU)" value="' + A.esc(title) + '"></div>' +
            '</div>' +
            '<div class="ad-lang-panel" data-lang-panel="en">' +
                '<div class="ad-field"><input type="text" class="ad-field-input" id="adTrnNewsTitleEn" placeholder="' + L.trnNewsTitle + ' (EN)" value="' + A.esc(titleEn) + '"></div>' +
            '</div>' +
            '<div class="ad-lang-panel" data-lang-panel="kg">' +
                '<div class="ad-field"><input type="text" class="ad-field-input" id="adTrnNewsTitleKg" placeholder="' + L.trnNewsTitle + ' (KG)" value="' + A.esc(titleKg) + '"></div>' +
            '</div>' +
            '<button type="button" class="ad-btn-translate-all" data-ru="adTrnNewsTitle" data-en="adTrnNewsTitleEn" data-kg="adTrnNewsTitleKg">&#127760; ' + L.translateAllBtn + '</button>' +
        '</div>';

        // Content card with lang tabs
        html += '<div class="ad-form-card">' +
            '<div class="ad-form-card-title">' + L.trnNewsContent + '</div>' +
            '<div class="ad-lang-tabs" id="adTrnNewsContentTabs">' +
                '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
            '</div>' +
            '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                '<div class="ad-field"><textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adTrnNewsContent" placeholder="' + L.trnNewsContent + ' (RU)">' + A.esc(content) + '</textarea></div>' +
            '</div>' +
            '<div class="ad-lang-panel" data-lang-panel="en">' +
                '<div class="ad-field"><textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adTrnNewsContentEn" placeholder="' + L.trnNewsContent + ' (EN)">' + A.esc(contentEn) + '</textarea></div>' +
            '</div>' +
            '<div class="ad-lang-panel" data-lang-panel="kg">' +
                '<div class="ad-field"><textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adTrnNewsContentKg" placeholder="' + L.trnNewsContent + ' (KG)">' + A.esc(contentKg) + '</textarea></div>' +
            '</div>' +
            '<button type="button" class="ad-btn-translate-all" data-ru="adTrnNewsContent" data-en="adTrnNewsContentEn" data-kg="adTrnNewsContentKg">&#127760; ' + L.translateAllBtn + '</button>' +
        '</div>';

        // Excerpt card with lang tabs
        html += '<div class="ad-form-card">' +
            '<div class="ad-form-card-title">' + L.trnNewsExcerpt + '</div>' +
            '<div class="ad-lang-tabs" id="adTrnNewsExcerptTabs">' +
                '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
            '</div>' +
            '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                '<div class="ad-field"><textarea class="ad-field-input ad-field-textarea" id="adTrnNewsExcerpt" placeholder="' + L.trnNewsExcerpt + ' (RU)">' + A.esc(excerpt) + '</textarea></div>' +
            '</div>' +
            '<div class="ad-lang-panel" data-lang-panel="en">' +
                '<div class="ad-field"><textarea class="ad-field-input ad-field-textarea" id="adTrnNewsExcerptEn" placeholder="' + L.trnNewsExcerpt + ' (EN)">' + A.esc(excerptEn) + '</textarea></div>' +
            '</div>' +
            '<div class="ad-lang-panel" data-lang-panel="kg">' +
                '<div class="ad-field"><textarea class="ad-field-input ad-field-textarea" id="adTrnNewsExcerptKg" placeholder="' + L.trnNewsExcerpt + ' (KG)">' + A.esc(excerptKg) + '</textarea></div>' +
            '</div>' +
            '<button type="button" class="ad-btn-translate-all" data-ru="adTrnNewsExcerpt" data-en="adTrnNewsExcerptEn" data-kg="adTrnNewsExcerptKg">&#127760; ' + L.translateAllBtn + '</button>' +
        '</div>';

        // Gallery card
        html += '<div class="ad-form-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
                '<div class="ad-form-card-title" style="margin:0;">' + L.trnNewsPhotos + ' (<span id="adTrnPhotoCount">' + galleryUrls.length + '</span>/10)</div>' +
                '<label class="ad-btn ad-btn-secondary" style="cursor:pointer;font-size:0.85rem;">' +
                    '📷 ' + L.trnNewsUploadPhotos +
                    '<input type="file" id="adTrnPhotoInput" multiple accept="image/*" style="display:none;">' +
                '</label>' +
            '</div>' +
            '<div id="adTrnPhotoGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;"></div>' +
        '</div>';

        // Actions
        var publishBtnLabel = publishedAt ? (isEn ? '📰 Update Publication' : '📰 Обновить публикацию') : '📰 ' + L.trnNewsPublish;
        var tgBtnLabel = tgSentAt ? tgSentLabel() : '📢 ' + L.trnNewsSendTg;
        var tgDisabled = !publishedAt || tgSentAt;

        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;">' +
            '<button class="ad-btn ad-btn-secondary" id="adTrnNewsSave">💾 ' + L.trnNewsSaveDraft + '</button>' +
            '<button class="ad-btn ad-btn-primary" id="adTrnNewsPublish">' + publishBtnLabel + '</button>' +
            '<button class="ad-btn ad-btn-secondary" id="adTrnNewsTg" ' + (tgDisabled ? 'disabled style="opacity:0.5;"' : '') + '>' + tgBtnLabel + '</button>' +
        '</div>';

        container.innerHTML = html;

        // --- Lang tabs switching ---
        container.querySelectorAll('.ad-lang-tabs').forEach(function(tabsContainer) {
            tabsContainer.querySelectorAll('.ad-lang-tab').forEach(function(tab) {
                tab.addEventListener('click', function() {
                    var lang = tab.dataset.lang;
                    var card = tabsContainer.closest('.ad-form-card');
                    if (!card) return;
                    card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.remove('active'); });
                    tab.classList.add('active');
                    card.querySelectorAll('.ad-lang-panel').forEach(function(p) {
                        p.classList.toggle('active', p.dataset.langPanel === lang);
                    });
                });
            });
        });

        // --- Translate ALL — "Перевести в пустые" buttons (delegate) ---
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate-all');
            if (!btn) return;
            A.translateToEmpty(btn.dataset.ru, btn.dataset.en, btn.dataset.kg, btn);
        });

        // --- Gallery state & rendering ---
        var currentGallery = galleryUrls.slice();

        // --- Отслеживание изменений ---
        // Рассылку можно повторить только если публикацию реально обновили.
        // Черновик — заготовка, слепки не трогает.
        function newsSnapshot() {
            var d = collectNewsData(false);
            d.published_at = null; // дата публикации в сравнении не участвует
            return JSON.stringify(d);
        }
        // Дата и время отправки: «04.08 в 14:32»
        function fmtSent(iso) {
            var d = new Date(iso);
            var p = function(n) { return String(n).padStart(2, '0'); };
            return p(d.getDate()) + '.' + p(d.getMonth() + 1) +
                (isEn ? ' at ' : ' в ') + p(d.getHours()) + ':' + p(d.getMinutes());
        }
        function tgSentLabel() {
            if (!tgSentAt) return '';
            return '✅ ' + L.trnNewsTgSent + ' ' + fmtSent(tgSentAt);
        }
        var publishedSnapshot = newsSnapshot();                  // что сейчас опубликовано
        var sentSnapshot = tgSentAt ? publishedSnapshot : null;  // что ушло в последнюю рассылку

        function refreshNewsButtons() {
            var pubBtn = document.getElementById('adTrnNewsPublish');
            var tgBtn = document.getElementById('adTrnNewsTg');
            if (!pubBtn || !tgBtn) return;

            // До первой публикации кнопка публикации всегда доступна
            if (publishedAt) pubBtn.disabled = (newsSnapshot() === publishedSnapshot);

            // Рассылка: только по опубликованному и только если публикация менялась после отправки
            var canSend = !!publishedAt && publishedSnapshot !== sentSnapshot;
            tgBtn.disabled = !canSend;
            tgBtn.style.opacity = canSend ? '' : '0.5';
            tgBtn.textContent = canSend
                ? '📢 ' + (sentSnapshot ? L.trnNewsResendTg : L.trnNewsSendTg)
                : (tgSentAt ? tgSentLabel() : '📢 ' + L.trnNewsSendTg);
        }

        renderPhotoGrid();
        refreshNewsButtons();

        // Любая правка в полях формы пересчитывает состояние кнопок
        container.addEventListener('input', refreshNewsButtons);

        function renderPhotoGrid() {
            var grid = document.getElementById('adTrnPhotoGrid');
            if (!grid) return;
            var countEl = document.getElementById('adTrnPhotoCount');
            if (countEl) countEl.textContent = currentGallery.length;

            if (currentGallery.length === 0) {
                grid.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;grid-column:1/-1;">' +
                    (isEn ? 'No photos yet' : 'Фото ещё нет') + '</div>';
                return;
            }
            var ph = '';
            currentGallery.forEach(function(url, idx) {
                ph += '<div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;border:1px solid var(--border);">' +
                    '<img src="' + A.esc(url) + '" style="width:100%;height:100%;object-fit:cover;">' +
                    '<button class="ad-trn-photo-remove" data-photo-idx="' + idx + '" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;">&times;</button>' +
                '</div>';
            });
            grid.innerHTML = ph;

            // Remove photo handlers
            grid.querySelectorAll('.ad-trn-photo-remove').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var idx = parseInt(btn.dataset.photoIdx);
                    currentGallery.splice(idx, 1);
                    renderPhotoGrid();
                    refreshNewsButtons();
                });
            });
        }

        // Photo upload
        var photoInput = document.getElementById('adTrnPhotoInput');
        if (photoInput) {
            photoInput.addEventListener('change', async function() {
                var files = Array.from(photoInput.files || []);
                var remaining = 10 - currentGallery.length;
                if (remaining <= 0) {
                    A.showToast(isEn ? 'Max 10 photos' : 'Максимум 10 фото', 'error');
                    return;
                }
                files = files.slice(0, remaining);
                for (var i = 0; i < files.length; i++) {
                    var url = await A.uploadImage(files[i], 'news');
                    if (url) {
                        currentGallery.push(url);
                        renderPhotoGrid();
                        refreshNewsButtons();
                    }
                }
                photoInput.value = '';
            });
        }

        // --- Collect data helper ---
        function collectNewsData(doPublish) {
            var t = (document.getElementById('adTrnNewsTitle') || {}).value || '';
            var s = slug || A.slugify(t);
            return {
                title: t.trim(),
                title_en: ((document.getElementById('adTrnNewsTitleEn') || {}).value || '').trim(),
                title_kg: ((document.getElementById('adTrnNewsTitleKg') || {}).value || '').trim(),
                slug: s,
                excerpt: ((document.getElementById('adTrnNewsExcerpt') || {}).value || '').trim(),
                excerpt_en: ((document.getElementById('adTrnNewsExcerptEn') || {}).value || '').trim(),
                excerpt_kg: ((document.getElementById('adTrnNewsExcerptKg') || {}).value || '').trim(),
                content: ((document.getElementById('adTrnNewsContent') || {}).value || '').trim(),
                content_en: ((document.getElementById('adTrnNewsContentEn') || {}).value || '').trim(),
                content_kg: ((document.getElementById('adTrnNewsContentKg') || {}).value || '').trim(),
                category: 'results',
                tournament_id: tournament.id,
                gallery: currentGallery,
                content_images: currentGallery.length > 0 ? [{ url: currentGallery[0], after_paragraph: 1 }] : [],
                image: currentGallery.length > 0 ? currentGallery[0] : null,
                published_at: doPublish ? new Date().toISOString() : (publishedAt || null)
            };
        }

        // --- Save Draft ---
        document.getElementById('adTrnNewsSave').addEventListener('click', async function() {
            var btn = this;
            btn.disabled = true;
            btn.textContent = '💾 ...';
            try {
                var data = collectNewsData(false);
                if (!data.title) {
                    A.showToast(isEn ? 'Title is required' : 'Заголовок обязателен', 'error');
                    btn.disabled = false;
                    btn.textContent = '💾 ' + L.trnNewsSaveDraft;
                    return;
                }
                var result;
                if (newsId) {
                    result = await A.client.from('news').update(data).eq('id', newsId);
                } else {
                    data.id = crypto.randomUUID();
                    result = await A.client.from('news').insert(data);
                    if (!result.error) newsId = data.id;
                }
                if (result.error) throw new Error(result.error.message);
                slug = data.slug;
                A.showToast(L.saved, 'success');
                var statusEl = document.getElementById('adNewsStatus');
                if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-secondary);">📝 ' + L.trnNewsDraft + '</span>';
            } catch (e) {
                A.showToast(e.message || 'Error', 'error');
            }
            btn.disabled = false;
            btn.textContent = '💾 ' + L.trnNewsSaveDraft;
        });

        // --- Publish ---
        document.getElementById('adTrnNewsPublish').addEventListener('click', async function() {
            var btn = this;
            btn.disabled = true;
            btn.textContent = '📰 ...';
            try {
                var data = collectNewsData(true);
                // Публикацию обновили — снимаем серверную отметку о рассылке,
                // иначе tournament-results-notify вернёт 409 «Already notified»
                data.results_notified_at = null;
                if (!data.title) {
                    A.showToast(isEn ? 'Title is required' : 'Заголовок обязателен', 'error');
                    btn.disabled = false;
                    btn.textContent = '📰 ' + L.trnNewsPublish;
                    return;
                }
                var result;
                if (newsId) {
                    result = await A.client.from('news').update(data).eq('id', newsId);
                } else {
                    data.id = crypto.randomUUID();
                    result = await A.client.from('news').insert(data);
                    if (!result.error) newsId = data.id;
                }
                if (result.error) throw new Error(result.error.message);
                publishedAt = data.published_at;
                slug = data.slug;
                A.showToast(isEn ? 'Published!' : 'Опубликовано!', 'success');
                var statusEl = document.getElementById('adNewsStatus');
                if (statusEl) {
                    var d = new Date(publishedAt);
                    var ds = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
                    statusEl.innerHTML = '<span style="color:var(--accent);font-weight:600;">📰 ' + L.trnNewsPublished + ' ' + ds + '</span>';
                }
                // Публикация обновлена — фиксируем новый слепок.
                // Если он отличается от отправленного, рассылка станет доступна повторно.
                publishedSnapshot = newsSnapshot();
            } catch (e) {
                A.showToast(e.message || 'Error', 'error');
            }
            btn.disabled = false;
            btn.textContent = isEn ? '📰 Update Publication' : '📰 Обновить публикацию';
            refreshNewsButtons();
        });

        // --- Send TG ---
        document.getElementById('adTrnNewsTg').addEventListener('click', function() {
            var tgBtn = this;
            if (!publishedAt) {
                A.showToast(isEn ? 'Publish the article first' : 'Сначала опубликуйте статью', 'error');
                return;
            }
            // При повторе честно предупреждаем: подписчики получат уведомление второй раз
            var confirmMsg;
            if (tgSentAt) {
                confirmMsg = L.trnNewsResendConfirm.replace('{date}', fmtSent(tgSentAt));
            } else {
                confirmMsg = isEn ? 'Send results to Telegram group?' : 'Отправить результаты в TG группу?';
            }
            A.showConfirm(isEn ? 'Telegram' : 'Telegram', confirmMsg, async function() {
                tgBtn.disabled = true;
                tgBtn.textContent = '📢 ...';
                try {
                    var session = await A.client.auth.getSession();
                    var token = session.data.session ? session.data.session.access_token : '';
                    var res = await fetch(SUPABASE_URL + '/functions/v1/tournament-results-notify', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({ tournament_id: tournament.id })
                    });
                    var result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'HTTP ' + res.status);
                    tgSentAt = new Date().toISOString();
                    A.showToast(isEn ? 'Sent to Telegram!' : 'Отправлено в Telegram!', 'success');
                    var statusEl = document.getElementById('adNewsStatus');
                    if (statusEl) statusEl.innerHTML = '<span style="color:#4caf50;font-weight:600;">✅ ' + L.trnNewsTgSent + ' ' + fmtSent(tgSentAt) + '</span>';
                    // Отправили текущую публикацию — кнопка гаснет до следующего обновления
                    sentSnapshot = publishedSnapshot;
                    refreshNewsButtons();
                } catch (e) {
                    var msg = e.message || 'Error';
                    if (msg === 'Already notified') {
                        msg = isEn
                            ? 'Already sent. Update the publication to send again.'
                            : 'Рассылка уже отправлена. Чтобы отправить снова, обновите публикацию.';
                    }
                    A.showToast(msg, 'error');
                    refreshNewsButtons();
                }
            }, isEn ? 'Send' : 'Отправить');
        });
    }

    // ---- Export to namespace ----
    A.recalcDoublesPoints = recalcDoublesPoints;
    A.renderBracketManagement = renderBracketManagement;

})();
