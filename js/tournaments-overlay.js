// ========================================
// Tournaments — Supabase Overlay
// Loads DB tournaments on top of static data,
// sorts all by date (closest first)
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var client = window.supabaseClient;

    // Auth-gate: intercept all "Подробнее" / detail clicks on tournament cards
    var authPage = isEn ? 'auth-en.html' : 'auth.html';
    document.addEventListener('click', function(e) {
        var link = e.target.closest('.btn-view-bracket');
        if (!link) return;
        e.preventDefault();
        var href = link.dataset.href || link.getAttribute('href');
        if (!href || href === '#') return;
        var authToken = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');
        if (authToken) {
            window.location.href = href;
        } else {
            window.location.href = authPage;
        }
    });

    if (!client) return;

    // Format prize fund total: 500000 → "500 000 сом", 0 → "0 сом"
    function formatPrize(num) {
        if (!num) return '0 ' + (isEn ? 'som' : 'сом');
        var str = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return str + ' ' + (isEn ? 'som' : 'сом');
    }

    // Run after static data has rendered
    window.addEventListener('load', function() {
        var urlParams = new URLSearchParams(window.location.search);
        var category = urlParams.get('category') || 'tour';
        overlaySupabaseTournaments(category);
        loadHeroStats(category);
    });

    // Load hero stats from Supabase (tournament count, participants, prize fund)
    // Always overwrites static fallback with real data (even if 0)
    async function loadHeroStats(category) {
        // Friendly — no stats
        var statsBlock = document.querySelector('.tournament-hero-stats');
        if (category === 'friendly') {
            if (statsBlock) statsBlock.style.display = 'none';
            return;
        }
        if (statsBlock) statsBlock.style.display = '';

        var elCount = document.getElementById('statTournaments');
        var elPart = document.getElementById('statParticipants');
        var elPrize = document.getElementById('statPrize');

        try {
            // All tournaments in this category — both men + women (all statuses)
            var result = await client.from('tournaments')
                .select('id, prize_fund')
                .like('category_id', '%-' + category);

            var tournaments = (result.data && !result.error) ? result.data : [];
            var tournamentCount = tournaments.length;

            // Sum prize funds — extract number from text like "100,000 сом" or "500000"
            var totalPrize = 0;
            tournaments.forEach(function(t) {
                if (t.prize_fund != null) {
                    var raw = String(t.prize_fund);
                    console.log('  prize_fund raw [' + t.id + ']:', JSON.stringify(raw));
                    // Try to extract number: take first sequence of digits (possibly with separators)
                    var match = raw.match(/[\d][\d\s,.\u00a0]*/);
                    if (match) {
                        var cleaned = match[0].replace(/[\s,.\u00a0]/g, '');
                        var num = parseInt(cleaned, 10);
                        if (!isNaN(num) && num <= 100000000) totalPrize += num;
                    }
                }
            });
            console.log('Hero stats:', category, '| tournaments:', tournamentCount, '| totalPrize:', totalPrize);

            // Always update tournament count and prize (even if 0)
            if (elCount) elCount.textContent = tournamentCount;
            if (elPrize) {
                elPrize.textContent = formatPrize(totalPrize);
            }

            // Count participants from registrations (separate try — table may not exist yet)
            try {
                var ids = tournaments.map(function(t) { return t.id; });
                if (ids.length > 0) {
                    var regsResult = await client.from('tournament_registrations')
                        .select('*', { count: 'exact', head: true })
                        .in('tournament_id', ids);
                    if (elPart) elPart.textContent = regsResult.count || 0;
                } else {
                    if (elPart) elPart.textContent = '0';
                }
            } catch (re) {
                console.warn('Registrations count unavailable:', re.message);
                if (elPart) elPart.textContent = '0';
            }

        } catch (e) {
            console.error('Hero stats error:', e);
        }
    }

    async function overlaySupabaseTournaments(category) {
        try {
            var result = await client.from('tournaments')
                .select('*')
                .like('category_id', '%-' + category)
                .in('status', ['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed'])
                .order('date_start', { ascending: true });

            console.log('Supabase tournaments query:', category, result);

            if (!result.data || result.data.length === 0) return;

            // Load registration counts per tournament for participant display
            var tIds = result.data.map(function(t) { return t.id; });
            var regCounts = {};
            try {
                if (tIds.length > 0) {
                    var regsResult = await client.from('tournament_registrations')
                        .select('tournament_id')
                        .in('tournament_id', tIds);
                    if (regsResult.data) {
                        regsResult.data.forEach(function(r) {
                            regCounts[r.tournament_id] = (regCounts[r.tournament_id] || 0) + 1;
                        });
                    }
                }
            } catch (re) {
                console.warn('Registration counts unavailable:', re.message);
            }

            var months = isEn
                ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

            var formatLabels = isEn
                ? { singles: 'Singles', doubles: 'Doubles', mixed_doubles: 'Mixed Doubles' }
                : { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' };

            var statusLabels = isEn
                ? { registration_open: 'Registration Open', upcoming: 'Coming Soon', registration_closed: 'Registration Closed', ongoing: 'In Progress', completed: 'Completed' }
                : { registration_open: 'Регистрация открыта', upcoming: 'Скоро открытие', registration_closed: 'Регистрация закрыта', ongoing: 'Идёт', completed: 'Завершён' };

            var L = isEn ? {
                format: 'Format', participants: 'Players', prizeFund: 'Prize',
                gender: 'Gender', details: 'Details', register: 'Register', notify: 'Notify Me', calendar: 'Add to calendar'
            } : {
                format: 'Формат', participants: 'Участники', prizeFund: 'Призовой',
                gender: 'Пол', details: 'Подробнее', register: 'Регистрация', notify: 'Уведомить', calendar: 'В календарь'
            };

            // Convert Supabase data to card format
            var supaItems = result.data.map(function(t) {
                var d = new Date(t.date_start + 'T00:00:00');
                var day = String(d.getDate()).padStart(2, '0');
                var month = months[d.getMonth()];
                var cardStatus = t.status === 'registration_open' ? 'open' : (t.status === 'completed' ? 'past' : 'soon');

                var gender = (t.category_id || '').split('-')[0];
                var cat = (t.category_id || '').replace(/^(men|women)-/, '');
                var genderLabel = (t.format !== 'mixed_doubles' && cat !== 'friendly' && (gender === 'men' || gender === 'women'))
                    ? (gender === 'women'
                        ? (isEn ? '♀ Women' : '♀ Женский')
                        : (isEn ? '♂ Men' : '♂ Мужской'))
                    : '';

                return {
                    id: t.id,
                    name: isEn ? (t.title_en || t.title) : t.title,
                    date: { day: day, month: month },
                    _dateSort: t.date_start,
                    location: isEn ? (t.location_en || t.location) : (t.location || ''),
                    time: '',
                    format: formatLabels[t.format] || t.format || '',
                    participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                    prize: t.prize_fund ? ((/[а-яa-z]/i.test(String(t.prize_fund))) ? String(t.prize_fund) : formatPrize(parseInt(String(t.prize_fund).replace(/[^\d]/g, ''), 10) || 0)) : '',
                    status: cardStatus,
                    statusText: statusLabels[t.status] || statusLabels.upcoming,
                    genderLabel: genderLabel,
                    image: t.image_url || t.image || '',
                    _fromSupabase: true
                };
            });

            // Use static items only as fallback when Supabase returned nothing
            var all;
            if (supaItems.length > 0) {
                all = supaItems;
            } else {
                var monthMap = isEn
                    ? {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
                    : {'Янв':'01','Фев':'02','Мар':'03','Апр':'04','Май':'05','Июн':'06','Июл':'07','Авг':'08','Сен':'09','Окт':'10','Ноя':'11','Дек':'12'};

                all = (tournamentsData.upcoming[category] || []).map(function(t) {
                    return Object.assign({}, t, {
                        _dateSort: '2026-' + (monthMap[t.date.month] || '01') + '-' + t.date.day,
                        _fromSupabase: false
                    });
                });
            }

            // Sort by date (closest first)
            all.sort(function(a, b) {
                return (a._dateSort || '').localeCompare(b._dateSort || '');
            });

            // Re-render grid
            var grid = document.getElementById('tournamentsGrid');
            if (!grid) return;

            grid.innerHTML = all.map(function(t) {
                var statusText = t.statusText || (t.status === 'open'
                    ? (isEn ? 'Registration Open' : 'Регистрация открыта')
                    : (isEn ? 'Coming Soon' : 'Скоро открытие'));

                return '<div class="tournament-card" data-status="' + t.status + '"' +
                    (t.image ? ' style="background-image:url(' + t.image + ')"' : '') + '>' +
                    '<div class="tournament-card-header">' +
                        '<span class="tournament-date">' +
                            '<span class="date-day">' + t.date.day + '</span>' +
                            '<span class="date-month">' + t.date.month + '</span>' +
                        '</span>' +
                        '<span class="tournament-status ' + t.status + '">' + statusText + '</span>' +
                    '</div>' +
                    '<div class="tournament-card-body">' +
                        '<div class="tournament-title-row">' +
                            '<h3>' + t.name + '</h3>' +
                            (t.genderLabel ? '<span class="tournament-gender-badge">' + t.genderLabel + '</span>' : '') +
                        '</div>' +
                        '<div class="tournament-meta">' +
                            '<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + t.location + '</span>' +
                            (t.time ? '<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + t.time + '</span>' : '') +
                        '</div>' +
                        '<div class="tournament-details">' +
                            '<div class="detail-item"><span class="detail-label">' + L.format + '</span><span class="detail-value">' + (t.format || '') + '</span></div>' +
                            '<div class="detail-item"><span class="detail-label">' + L.participants + '</span><span class="detail-value">' + (t.participants || '') + '</span></div>' +
                            '<div class="detail-item"><span class="detail-label">' + L.prizeFund + '</span><span class="detail-value prize">' + (t.prize || '') + '</span></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tournament-card-footer">' +
                        '<button class="btn-calendar" title="' + L.calendar + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button>' +
                        '<button class="btn-view-bracket btn-auth-gate" data-href="' + (isEn ? 'tournament-en.html' : 'tournament.html') + '?id=' + (t._fromSupabase ? t.id : category + '-' + t.id) + '\">' + L.details + '</button>' +
                        (t.status === 'open'
                            ? '<button class="btn-register">' + L.register + '</button>'
                            : (t.status === 'past' ? '' : '<button class="btn-notify">' + L.notify + '</button>')) +
                    '</div>' +
                '</div>';
            }).join('');

            // Hide completed tournaments by default (show only via "Завершённые" filter)
            grid.querySelectorAll('.tournament-card[data-status="past"]').forEach(function(card) {
                card.style.display = 'none';
            });

        } catch (e) {
            console.error('Supabase tournaments overlay error:', e);
        }
    }
})();
