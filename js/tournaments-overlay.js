// ========================================
// Tournaments — Supabase Overlay
// Loads DB tournaments on top of static data,
// sorts all by date (closest first)
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var client = window.supabaseClient;
    if (!client) return;

    // Run after static data has rendered
    window.addEventListener('load', function() {
        var urlParams = new URLSearchParams(window.location.search);
        var category = urlParams.get('category') || 'tour';
        overlaySupabaseTournaments(category);
    });

    async function overlaySupabaseTournaments(category) {
        try {
            var result = await client.from('tournaments')
                .select('*')
                .like('category_id', '%' + category)
                .in('status', ['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed'])
                .order('date_start', { ascending: true });

            console.log('Supabase tournaments query:', category, result);

            if (!result.data || result.data.length === 0) return;

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
                format: 'Format', participants: 'Participants', prizeFund: 'Prize Fund',
                details: 'Details', register: 'Register', notify: 'Notify Me', calendar: 'Add to calendar'
            } : {
                format: 'Формат', participants: 'Участники', prizeFund: 'Призовой фонд',
                details: 'Подробнее', register: 'Зарегистрироваться', notify: 'Уведомить меня', calendar: 'Добавить в календарь'
            };

            // Convert Supabase data to card format
            var supaItems = result.data.map(function(t) {
                var d = new Date(t.date_start + 'T00:00:00');
                var day = String(d.getDate()).padStart(2, '0');
                var month = months[d.getMonth()];
                var cardStatus = t.status === 'registration_open' ? 'open' : (t.status === 'completed' ? 'past' : 'soon');

                var gender = (t.category_id || '').split('-')[0];
                var genderLabel = gender === 'women'
                    ? (isEn ? '♀ Women' : '♀ Женский')
                    : (isEn ? '♂ Men' : '♂ Мужской');

                return {
                    id: t.id,
                    name: isEn ? (t.title_en || t.title) : t.title,
                    date: { day: day, month: month },
                    _dateSort: t.date_start,
                    location: isEn ? (t.location_en || t.location) : (t.location || ''),
                    time: '',
                    format: formatLabels[t.format] || t.format || '',
                    participants: t.max_participants ? '0/' + t.max_participants : '',
                    prize: t.prize_fund || '',
                    status: cardStatus,
                    statusText: statusLabels[t.status] || statusLabels.upcoming,
                    genderLabel: genderLabel,
                    _fromSupabase: true
                };
            });

            // Add sort date to static items
            var monthMap = isEn
                ? {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
                : {'Янв':'01','Фев':'02','Мар':'03','Апр':'04','Май':'05','Июн':'06','Июл':'07','Авг':'08','Сен':'09','Окт':'10','Ноя':'11','Дек':'12'};

            var staticItems = (tournamentsData.upcoming[category] || []).map(function(t) {
                return Object.assign({}, t, {
                    _dateSort: '2026-' + (monthMap[t.date.month] || '01') + '-' + t.date.day,
                    _fromSupabase: false
                });
            });

            // Combine and sort by date (closest first)
            var all = supaItems.concat(staticItems);
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

                return '<div class="tournament-card" data-status="' + t.status + '">' +
                    '<div class="tournament-card-header">' +
                        '<span class="tournament-date">' +
                            '<span class="date-day">' + t.date.day + '</span>' +
                            '<span class="date-month">' + t.date.month + '</span>' +
                        '</span>' +
                        '<span class="tournament-status ' + t.status + '">' + statusText + '</span>' +
                    '</div>' +
                    '<div class="tournament-card-body">' +
                        (t.genderLabel ? '<span class="tournament-gender-badge">' + t.genderLabel + '</span>' : '') +
                        '<h3>' + t.name + '</h3>' +
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
                        '<a href="' + (isEn ? 'tournament-en.html' : 'tournament.html') + '?id=' + (t._fromSupabase ? t.id : category + '-' + t.id) + '" class="btn-view-bracket" style="margin-right:auto">' + L.details + '</a>' +
                        (t.status === 'open'
                            ? '<button class="btn-register">' + L.register + '</button>'
                            : (t.status === 'past' ? '' : '<button class="btn-notify">' + L.notify + '</button>')) +
                    '</div>' +
                '</div>';
            }).join('');

        } catch (e) {
            console.error('Supabase tournaments overlay error:', e);
        }
    }
})();
