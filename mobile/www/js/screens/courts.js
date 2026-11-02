// ============================================
// KSLT Mobile — Courts Screen
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var CT = window.KSLT_COURTS = {};
  var allCourts = [];
  var currentCity = 'all';
  var currentSurface = 'all';
  var currentCourtFilter = 'all';
  var GUEST_VISIBLE = 5;

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function courtWord(n) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs > 10 && abs < 20) return 'кортов';
    if (last > 1 && last < 5) return 'корта';
    if (last === 1) return 'корт';
    return 'кортов';
  }

  /* 28.10, КУСОК 214: карта покрытий была зашита по-русски, и на
     английском с киргизским фильтр и карточки показывали русские слова.
     Теперь имена берутся из словаря — там же, где их держит сайт. */
  function покрытие(ключ) { return I18N.t('surface.' + ключ); }
  var AMENITY_MAP = {
    locker_rooms: '🔑 Раздевалки', showers: '🚿 Душевые', parking: '🅿️ Парковка',
    racket_rental: '🎾 Прокат', pro_shop: '🛍 Магазин', cafe: '☕ Кафе',
    gym: '💪 Зал', lighting: '💡 Освещение', wifi: '📶 Wi-Fi',
    climate: '❄️ Климат', kids_area: '👶 Детская', video: '📹 Видео'
  };

  CT.load = function() {
    var el = document.getElementById('courtsList');
    if (!el || !supabaseClient) return;
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('courts')
      .select('*')
      .order('promoted', { ascending: false })
      .order('created_at', { ascending: false })
      .then(function(r) {
        allCourts = (r.data || []).map(function(row) {
          var types = row.court_types || [];
          var totalCourts = 0;
          var minPrice = Infinity;
          var hasIndoor = false, hasOutdoor = false;
          types.forEach(function(t) {
            totalCourts += (t.count || 1);
            if (t.price && t.price < minPrice) minPrice = t.price;
            if (t.type === 'indoor') hasIndoor = true;
            if (t.type === 'outdoor') hasOutdoor = true;
          });
          if (minPrice === Infinity) minPrice = 0;

          var address = [row.street, row.building, row.city || 'Бишкек'].filter(Boolean).join(', ');

          return {
            id: row.id,
            city: row.city || 'Бишкек',
            surfaces: types.map(function(t) { return t.surface; }).filter(Boolean),
            name: row.name || I18N.t('courts.court'),
            photo: row.photo || '',
            totalCourts: totalCourts,
            minPrice: minPrice,
            hasIndoor: hasIndoor,
            hasOutdoor: hasOutdoor,
            surface: types.length > 0 ? (покрытие(types[0].surface) || types[0].surface) : '',
            address: address,
            phone: row.phone || '',
            whatsapp: row.whatsapp || '',
            instagram: row.instagram || '',
            schedule: row.schedule || '',
            schedule_en: row.schedule_en || '',
            services: row.additional_services || [],
            description: row.description || '',
            amenities: row.amenities || [],
            gallery: row.gallery || [],
            google_maps_url: row.google_maps_url || '',
            twogis_url: row.twogis_url || '',
            promoted: row.promoted,
            partner: row.partner,
            courtTypes: types
          };
        });
        render();
      });
  };

  CT.filter = function(f) {
    currentCourtFilter = f;
    render();
  };

  CT.filterCity = function(v) { currentCity = v; render(); };
  CT.filterSurface = function(v) { currentSurface = v; render(); };

  /**
   * ТРИ ВЫПАДАШКИ ВМЕСТО ТРЁХ РЯДОВ ЧИПОВ (02.11).
   *
   * Строятся домом `KSLT_VYPADASHKA` — тем же, что на сайте: ОДНО
   * ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. Пункты по-прежнему собираются из самих
   * кортов, а не задаются списком: появится корт в новом городе —
   * появится и пункт.
   *
   * СЧЁТ СЧИТАЕТСЯ ПО ОСТАЛЬНЫМ ФИЛЬТРАМ, А НЕ ПО ВСЕМ КОРТАМ. Число
   * рядом с пунктом отвечает на вопрос «сколько будет, если выбрать
   * это», а не «сколько всего в базе»: иначе выбор показывал бы семь,
   * а список — два.
   */
  function бассейн(кроме) {
    return allCourts.filter(function(c) {
      if (кроме !== 'type' && currentCourtFilter === 'indoor' && !c.hasIndoor) return false;
      if (кроме !== 'type' && currentCourtFilter === 'outdoor' && !c.hasOutdoor) return false;
      if (кроме !== 'city' && currentCity !== 'all' && c.city !== currentCity) return false;
      if (кроме !== 'surface' && currentSurface !== 'all' &&
          (c.surfaces || []).indexOf(currentSurface) === -1) return false;
      return true;
    });
  }

  function renderExtraChips() {
    var box = document.getElementById('courtsFilters');
    if (!box || !window.KSLT_VYPADASHKA) return;

    var типы = бассейн('type');
    var пунктыТипа = [];
    var крытых = типы.filter(function(c) { return c.hasIndoor; }).length;
    var открытых = типы.filter(function(c) { return c.hasOutdoor; }).length;
    if (крытых) пунктыТипа.push({ значение: 'indoor', подпись: 'Indoor', счёт: крытых });
    if (открытых) пунктыТипа.push({ значение: 'outdoor', подпись: 'Outdoor', счёт: открытых });

    var городаПул = бассейн('city');
    var счётГорода = {};
    городаПул.forEach(function(c) {
      if (!c.city) return;
      счётГорода[c.city] = (счётГорода[c.city] || 0) + 1;
    });
    var пунктыГорода = Object.keys(счётГорода).sort().map(function(г) {
      return { значение: г, подпись: г, счёт: счётГорода[г] };
    });

    var покрытияПул = бассейн('surface');
    var счётПокрытия = {};
    покрытияПул.forEach(function(c) {
      (c.surfaces || []).forEach(function(sf) {
        if (!sf) return;
        счётПокрытия[sf] = (счётПокрытия[sf] || 0) + 1;
      });
    });
    var пунктыПокрытия = Object.keys(счётПокрытия).sort().map(function(sf) {
      return { значение: sf, подпись: покрытие(sf) || sf, счёт: счётПокрытия[sf] };
    });

    box.innerHTML =
      KSLT_VYPADASHKA.разметка({ вид: 'type', подпись: I18N.t('courts.typeAll'),
                                 текущее: currentCourtFilter, пункты: пунктыТипа }) +
      KSLT_VYPADASHKA.разметка({ вид: 'city', подпись: I18N.t('courts.cityAll'),
                                 текущее: currentCity, пункты: пунктыГорода }) +
      KSLT_VYPADASHKA.разметка({ вид: 'surface', подпись: I18N.t('courts.surfaceAll'),
                                 текущее: currentSurface, пункты: пунктыПокрытия });

    KSLT_VYPADASHKA.включить(function(вид, значение) {
      if (вид === 'type') CT.filter(значение);
      else if (вид === 'city') CT.filterCity(значение);
      else CT.filterSurface(значение);
    });
  }

  function render() {
    var el = document.getElementById('courtsList');
    if (!el) return;

    renderExtraChips();

    var courtsToShow = allCourts;
    if (currentCourtFilter === 'indoor') {
      courtsToShow = courtsToShow.filter(function(c) { return c.hasIndoor; });
    } else if (currentCourtFilter === 'outdoor') {
      courtsToShow = courtsToShow.filter(function(c) { return c.hasOutdoor; });
    }
    if (currentCity !== 'all') {
      courtsToShow = courtsToShow.filter(function(c) { return c.city === currentCity; });
    }
    if (currentSurface !== 'all') {
      courtsToShow = courtsToShow.filter(function(c) {
        return (c.surfaces || []).indexOf(currentSurface) !== -1;
      });
    }

    if (courtsToShow.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏟</div><div class="empty-title">' + I18N.t('courts.empty') + '</div></div>';
      return;
    }

    var AUTH = window.KSLT_AUTH;
    var isGuest = !(AUTH && AUTH.currentUser);
    var isMember = AUTH && AUTH._membershipStatus;
    var visibleCount = isGuest ? Math.min(GUEST_VISIBLE, courtsToShow.length) : courtsToShow.length;

    var html = '';
    for (var i = 0; i < visibleCount; i++) {
      var c = courtsToShow[i];
      html += '<div class="court-card" data-court-idx="' + i + '"' +
        ' role="listitem" tabindex="0" aria-label="' + esc(c.name || '') + '">';
      if (c.photo) {
        html += '<div class="court-card-photo"><img src="' + esc(c.photo) + '" alt="">';
        if (c.partner) html += '<span class="coach-partner-badge">Партнёр</span>';
        html += '</div>';
      }
      html += '<div class="court-card-body">';
      html += '<div class="coach-card-name">' + esc(c.name) + '</div>';
      html += '<div class="court-card-meta">';
      var typeLabel = c.hasIndoor && c.hasOutdoor ? 'Indoor + Outdoor' : (c.hasIndoor ? 'Indoor' : 'Outdoor');
      html += '<span>🎾 ' + c.totalCourts + ' ' + I18N.t('courts.courts') + '</span>';
      html += '<span>' + typeLabel + '</span>';
      if (c.surface) html += '<span>' + esc(c.surface) + '</span>';
      html += '</div>';
      if (c.address) html += '<div class="court-card-address">📍 ' + esc(c.address) + '</div>';
      if (c.minPrice > 0) html += '<div class="court-card-price">' + I18N.t('courts.from') + ' ' + c.minPrice + ' ' + I18N.t('coaches.perHour') + '</div>';
      html += '</div></div>';
    }

    // Guest blur overlay
    if (isGuest && courtsToShow.length > GUEST_VISIBLE) {
      html += '<div class="rr-guest-overlay" role="listitem">' +
        '<div class="rr-guest-cta">' +
          '<div class="rr-guest-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>' +
          '<div class="rr-guest-title">' + I18N.t('guest.courtsTitle') + '</div>' +
          '<div class="rr-guest-text">' + I18N.t('guest.courtsText') + '</div>' +
          '<button class="rr-guest-btn" id="courtsLoginBtn">' + I18N.t('profile.login') + '</button>' +
        '</div></div>';
    }

    el.innerHTML = html;
    el.setAttribute('role', 'list');
    el.setAttribute('aria-label', I18N.t('courts.title'));

    // Login button
    var loginBtn = document.getElementById('courtsLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        if (AUTH) AUTH.showAuth();
      });
    }

    // Card click → detail
    el.querySelectorAll('.court-card[data-court-idx]').forEach(function(card) {
      card.addEventListener('click', function() {
        var idx = parseInt(card.getAttribute('data-court-idx'));
        if (isGuest) {
          if (AUTH) AUTH.showAuth();
          return;
        }
        openCourtDetail(courtsToShow[idx], isMember);
      });
    });
  }

  function openCourtDetail(c, isMember) {
    if (window.KSLT_APP && window.KSLT_APP.incrementView) {
      window.KSLT_APP.incrementView('increment_court_view', { p_id: c.id });
    }

    var existing = document.getElementById('courtDetailOverlay');
    if (existing) existing.remove();

    var html = '<div class="td-topbar">' +
      '<button class="td-back" id="courtDetailBack">' +
        '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' + I18N.t('common.back') +
      '</button>' +
      '<span class="td-topbar-title">' + I18N.t('court.detail') + '</span>' +
      '<span style="width:60px"></span>' +
    '</div>';

    // Hero image / gallery
    var galleryImages = [c.photo].concat(c.gallery || []).filter(Boolean);
    if (galleryImages.length > 1) {
      html += '<div class="court-gallery" style="overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory">';
      galleryImages.forEach(function(img) {
        html += '<div class="nd-hero-img" style="display:inline-block;width:100%;scroll-snap-align:start;background-image:url(' + img + ')"></div>';
      });
      html += '</div>';
      html += '<div style="text-align:center;padding:4px 0;font-size:11px;color:var(--text-muted)">← ' + I18N.t('court.swipe') + ' (' + galleryImages.length + ') →</div>';
    } else if (c.photo) {
      html += '<div class="nd-hero-img" style="background-image:url(' + c.photo + ')"></div>';
    }

    html += '<div style="padding:16px">';
    html += '<h2 class="pd-name" style="text-align:left">' + esc(c.name) + '</h2>';

    // Type + courts count
    var typeLabel = c.hasIndoor && c.hasOutdoor ? 'Indoor + Outdoor' : (c.hasIndoor ? 'Indoor' : 'Outdoor');
    html += '<div class="pd-meta" style="justify-content:flex-start">';
    html += '<span>🎾 ' + c.totalCourts + ' ' + I18N.t('courts.courts') + '</span>';
    html += '<span>' + typeLabel + '</span>';
    if (c.surface) html += '<span>' + esc(c.surface) + '</span>';
    html += '</div>';

    // Address
    if (c.address) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📍 ' + I18N.t('court.address') + '</h3>';
      html += '<div style="font-size:13px;color:var(--text-sec)">' + esc(c.address) + '</div>';
      if (c.google_maps_url || c.twogis_url) {
        html += '<div style="display:flex;gap:8px;margin-top:8px">';
        if (c.google_maps_url) html += '<a href="' + esc(c.google_maps_url) + '" target="_blank" style="font-size:12px;color:var(--accent)">Google Maps ↗</a>';
        if (c.twogis_url) html += '<a href="' + esc(c.twogis_url) + '" target="_blank" style="font-size:12px;color:var(--accent)">2GIS ↗</a>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Prices table
    if (c.courtTypes.length > 0) {
      html += '<div class="pd-section"><h3 class="pd-section-title">💰 ' + I18N.t('court.prices') + '</h3>';
      html += '<div class="pd-matches-list">';
      c.courtTypes.forEach(function(t) {
        var typeName = t.type === 'indoor' ? 'Indoor' : 'Outdoor';
        var surfName = покрытие(t.surface) || t.surface || '';
        html += '<div class="pd-match" style="cursor:default">';
        html += '<div class="pd-match-info"><div class="pd-match-opp">' + typeName + ' · ' + surfName + '</div><div class="pd-match-tournament">' + (t.count || 1) + ' корт(ов)</div></div>';
        html += '<div class="pd-match-score" style="color:var(--accent)">' + (t.price || '—') + ' сом</div>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // Description
    if (c.description) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📝 ' + I18N.t('court.description') + '</h3>';
      html += '<div style="font-size:13px;color:var(--text-sec);line-height:1.5">' + esc(c.description) + '</div></div>';
    }

    // Amenities
    if (c.amenities.length > 0) {
      html += '<div class="pd-section"><h3 class="pd-section-title">🏗 ' + I18N.t('court.amenities') + '</h3>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
      c.amenities.forEach(function(a) {
        var label = AMENITY_MAP[a] || a;
        html += '<span class="coach-tag">' + label + '</span>';
      });
      html += '</div></div>';
    }

    // Часы работы. На сайте они есть, в приложении не было — а это второе,
    // что спрашивают после адреса
    /* 28.10, кусок 214: было `I18N.currentLang` — расписание на других
       языках не показывалось никогда. */
    var schedule = I18N.поле(c, 'schedule');
    if (schedule) {
      html += '<div class="pd-section"><h3 class="pd-section-title">🕘 ' + I18N.t('court.schedule') + '</h3>';
      html += '<div class="pd-empty-small" style="color:var(--text-sec)">' + esc(schedule) + '</div>';
      html += '</div>';
    }

    // Дополнительные услуги: прокат, раздевалки, тренировки со стенкой
    if (c.services && c.services.length) {
      html += '<div class="pd-section"><h3 class="pd-section-title">➕ ' + I18N.t('court.services') + '</h3><div class="coach-tags">';
      c.services.forEach(function(sv) {
        var name = typeof sv === 'string' ? sv
          : I18N.поле(sv, 'service_name');
        var price = (sv && sv.price) ? ' — ' + sv.price : '';
        if (name) html += '<span class="coach-tag">' + esc(name + price) + '</span>';
      });
      html += '</div></div>';
    }

    // Связь — членам клуба. Значки те же, что у контактов игрока, и имя
    // пользователя достаём общим правилом: в поле попадает и ссылка целиком
    if (isMember && (c.phone || c.whatsapp || c.instagram)) {
      var ICON = window.KSLT_CONTACT_ICONS || {};
      var R = window.KSLT_RULES;
      var rows = [];
      if (c.phone) rows.push([ICON.phone, esc(c.phone), 'tel:' + c.phone, 'phone']);
      if (c.whatsapp) rows.push([ICON.whatsapp, esc(c.whatsapp), R.socialUrl('wa', c.whatsapp), 'wa']);
      if (c.instagram) rows.push([ICON.instagram, '@' + esc(R.handle(c.instagram)), R.socialUrl('ig', c.instagram), 'ig']);

      html += '<div class="pd-section"><h3 class="pd-section-title">📞 ' + I18N.t('court.contact') + '</h3>';
      html += '<div class="gi-contacts">' + rows.map(function(r) {
        return '<a class="gi-contact gi-contact--' + r[3] + '" href="' + r[2] + '" target="_blank" rel="noopener">' +
          '<span class="gi-contact-icon">' + r[0] + '</span><span>' + r[1] + '</span></a>';
      }).join('') + '</div></div>';
    } else if (!isMember && c.phone) {
      html += '<div class="pd-cta-membership"><p>' + I18N.t('court.contactLocked') + '</p></div>';
    }

    html += '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'courtDetailOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML = html;
    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    /* ЧАСТИ ИЩУТСЯ ВНУТРИ СВОЕГО УЗЛА (02.11). `getElementById`
       отдаёт ПЕРВЫЙ подходящий узел во всём документе — не
       обязательно наш: окно собирается кодом и старое остаётся в
       доме ещё 300 мс после закрытия. На знакомстве при первом
       запуске это уже стоило запертого приложения: обработчики
       навесились на кнопки нижнего окна, а нажимали верхнее. */
    overlay.querySelector('#courtDetailBack').addEventListener('click', function() {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    });
  }

})();
