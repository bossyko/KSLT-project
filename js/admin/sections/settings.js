// ============================================
// KSLT Admin — Settings (Points Rules + Promotions)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // ---- Promotions state ----
    var _promoGenderFilter = '';
    var _promoCatFilter = '';

    // ---- Main render ----
    async function renderSettingsSection() {
        var container = document.getElementById('ad-settings');
        if (!container) return;

        /* МЕНЕДЖЕР ВИДИТ ТОЛЬКО ТАБЛИЦУ ОЧКОВ, И ТОЛЬКО ГЛАЗАМИ.
           До 03.10 раздел целиком отвечал «Доступ запрещён» всем, кроме
           администратора, — то есть обещанного «менеджер смотрит, но не
           правит» просто не существовало: менеджер не видел экрана вовсе.
           Слово Кости: «изменить очки может только администратор, не
           менеджер» — ИЗМЕНИТЬ, а не увидеть. Макет 03.10 одобрен с блоком
           «менеджер смотрит».
           Остальные вкладки — промоушен и доступ — остаются только
           администратору: они меняют не очки, а правила платформы. */
        var правит = A.currentRole === 'admin';
        if (!правит && A.currentRole !== 'manager') {
            container.innerHTML = '<div class="ad-empty-state"><p>' + (isEn ? 'Access denied' : 'Доступ запрещён') + '</p></div>';
            return;
        }

        var tabs = правит
            ? [
                { key: 'rules', label: L.setSubRules },
                { key: 'promotions', label: L.setSubPromo },
                { key: 'access', label: isEn ? 'Access' : 'Доступ' }
              ]
            : [ { key: 'rules', label: L.setSubRules } ];

        var html = '<div class="ad-rat-tabs" id="setTabs">';
        tabs.forEach(function(t, i) {
            html += '<button class="ad-rat-tab' + (i === 0 ? ' active' : '') + '" data-settab="' + t.key + '">' + t.label + '</button>';
        });
        html += '</div>';

        tabs.forEach(function(t, i) {
            html += '<div class="ad-rat-panel' + (i === 0 ? ' active' : '') + '" id="setPanel' + t.key.charAt(0).toUpperCase() + t.key.slice(1) + '"></div>';
        });

        container.innerHTML = html;

        // Tab switching
        var tabBtns = container.querySelectorAll('.ad-rat-tab[data-settab]');
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                tabBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                container.querySelectorAll('.ad-rat-panel').forEach(function(p) { p.classList.remove('active'); });
                var key = btn.getAttribute('data-settab');
                var panelId = 'setPanel' + key.charAt(0).toUpperCase() + key.slice(1);
                var panel = document.getElementById(panelId);
                if (panel) panel.classList.add('active');
            });
        });

        // Load data then render sub-tabs
        await A.loadTournamentLevels(true);
        /* `points_rules` больше не нужна этому экрану: он правит места.
           Таблица остаётся жива у ручного ввода прошлых результатов
           (`sections/players.js`), и свести его на места — свой кусок. */
        await A.местаВсехУровней(true);
        renderSetRules();
        if (A.currentRole === 'admin') {
            renderSetPromotions();
            renderSetAccess();
        }
    }

    // ---- Доступ: бесплатный период ----
    //
    // До назначенной даты платформа открыта всем, кто зарегистрировался:
    // членство КСЛТ не спрашивается. Дата хранится в базе, поэтому действует
    // сразу и на сайте, и в установленном приложении — без новой сборки.
    // Пустая дата возвращает обычный порядок, доступ по членству.
    async function renderSetAccess() {
        var panel = document.getElementById('setPanelAccess');
        if (!panel) return;

        var r = await A.client.from('app_settings')
            .select('value, updated_at').eq('key', 'free_access_until').maybeSingle();
        var дата = (r.data && r.data.value) ? String(r.data.value).replace(/"/g, '') : '';
        var когда = (r.data && r.data.updated_at)
            ? new Date(r.data.updated_at).toLocaleString(isEn ? 'en-US' : 'ru-RU') : '';

        var сегодня = new Date().toISOString().split('T')[0];
        var идёт = дата && сегодня <= дата;

        panel.innerHTML =
            '<div class="ad-card" style="max-width:520px;">' +
                '<h3 style="margin-bottom:8px;">' +
                    (isEn ? 'Free access for everyone' : 'Бесплатный доступ для всех') + '</h3>' +
                '<p style="color:var(--text-secondary);line-height:1.6;margin-bottom:16px;">' +
                    (isEn
                        ? 'Until this date every signed-in user gets full access without a KSLT membership. Clear the date to return to memberships.'
                        : 'До этой даты полный доступ есть у каждого, кто вошёл, — членство КСЛТ не спрашивается. Пустая дата возвращает обычный порядок.') +
                '</p>' +
                '<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">' +
                    '<div>' +
                        '<label class="ad-field-label">' + (isEn ? 'Free until' : 'Бесплатно до') + '</label>' +
                        '<input type="date" class="ad-field-input" id="setFreeUntil" value="' + дата + '">' +
                    '</div>' +
                    '<button class="ad-btn ad-btn-primary" id="setFreeSave">' +
                        (isEn ? 'Save' : 'Сохранить') + '</button>' +
                    (дата ? '<button class="ad-btn ad-btn-secondary" id="setFreeClear">' +
                        (isEn ? 'Turn off' : 'Выключить') + '</button>' : '') +
                '</div>' +
                '<p style="margin-top:14px;color:' + (идёт ? 'var(--accent)' : 'var(--text-secondary)') + ';">' +
                    (идёт
                        ? (isEn ? 'Free access is on until ' : 'Бесплатный доступ идёт до ') + дата
                        : (дата
                            ? (isEn ? 'The date has passed — access is by membership' : 'Дата прошла — доступ по членству')
                            : (isEn ? 'Access is by membership' : 'Доступ по членству'))) +
                '</p>' +
                (когда ? '<p style="color:var(--text-muted);font-size:0.8rem;">' +
                    (isEn ? 'Changed: ' : 'Менялось: ') + когда + '</p>' : '') +
            '</div>';

        async function сохранить(значение) {
            var кнопки = panel.querySelectorAll('button');
            кнопки.forEach(function(b) { b.disabled = true; });
            var res = await A.client.from('app_settings')
                .update({ value: значение === null ? null : JSON.stringify(значение),
                          updated_at: new Date().toISOString(),
                          updated_by: (window.ksltUser && window.ksltUser.id) || null })
                .eq('key', 'free_access_until');
            if (res.error) {
                кнопки.forEach(function(b) { b.disabled = false; });
                A.showToast(res.error.message, 'error');
                return;
            }
            A.showToast(isEn ? 'Saved' : 'Сохранено', 'success');
            renderSetAccess();
        }

        var save = document.getElementById('setFreeSave');
        if (save) save.addEventListener('click', function() {
            var v = document.getElementById('setFreeUntil').value;
            сохранить(v || null);
        });
        var clear = document.getElementById('setFreeClear');
        if (clear) clear.addEventListener('click', function() { сохранить(null); });
    }

    // ---- Points Rules Sub-tab: ОЧКИ ЗА МЕСТО ----
    //
    // ЭКРАН ПРАВИЛ ДРУГУЮ ТАБЛИЦУ. До 03.10 здесь рисовались строки по
    // СТАДИЯМ (`A.ROUND_KEYS`) и писались в `points_rules`, а начисление
    // читало `points_by_place` — очки по МЕСТАМ. Два определения одного
    // понятия: правка на этом экране ни на что не влияла, и «куда делась
    // таблица на 64 места» объяснялось тем, что экрана у неё не было
    // никогда. Замер 03.10, шаг 2: 320 строк лежат в боевой, полные, без дыр.
    //
    // ПЛАШКА ВМЕСТО ПЕРЕКЛЮЧАТЕЛЯ — слово Кости: «может мы просто туда эту
    // плашку вставим и без переключателя обойдёмся». Двух вкладок быть не
    // может: места 1–4 попали бы в обе, и это снова два определения.
    //
    // МЕНЕДЖЕР СМОТРИТ, НО НЕ ПРАВИТ — слово Кости: «изменить очки может
    // только администратор, не менеджер». Поля без рамки и без фона, кнопок
    // сохранения нет вовсе: наружу выходит только безопасное.
    function renderSetRules() {
        var panel = document.getElementById('setPanelRules');
        if (!panel) return;

        var cachedLevels = A.cachedLevels || [];
        var места = A._местаОчков || [];
        var версия = A._версияОчков;
        var правит = A.currentRole === 'admin';

        var html = '';

        if (cachedLevels.length === 0) {
            html += '<div class="ad-empty-state"><p>' + L.ratNoLevels + '</p></div>';
        } else {
            /* Разбор `{level_id: {место: {id, очки}}}` — чтобы сохранение
               знало id строки и не угадывало её по (level_id, place). */
            var по = {};
            места.forEach(function(с) {
                if (!по[с.level_id]) по[с.level_id] = {};
                по[с.level_id][с.place] = { id: с.id, points: с.points };
            });

            /* СКОЛЬКО СТРОК РИСОВАТЬ — САМЫЙ БОЛЬШОЙ ПРЕДЕЛ, А НЕ 64.
               Если однажды все уровни станут восьмёрками, экран нарисует
               восемь строк, а не 56 прочерков. Число берётся из данных. */
            var строк = 0;
            cachedLevels.forEach(function(lv) {
                строк = Math.max(строк, A.пределМест(lv.id));
            });

            html += '<div class="ad-table-card">';

            html += '<div class="ad-pts-head">' +
                '<div class="ad-pts-who">' +
                    (правит ? L.ratWhoEdits : L.ratWhoViews) +
                '</div>' +
                '<div class="ad-pts-ver">' +
                    (версия
                        ? L.ratVersionInForce
                            .replace('{d}', A.датаПоРусски ? A.датаПоРусски(версия.effective_from) : версия.effective_from)
                            .replace('{w}', версия.per_win)
                            .replace('{e}', версия.per_entry)
                        : L.ratVersionNone) +
                '</div>' +
            '</div>';

            html += '<div class="ad-pts-band"><div class="ad-pts-band-text">' +
                '<b>' + L.ratBandTitle + '</b><br>' +
                '<span>' + L.ratBandKnockoutWho + '</span> ' + L.ratBandKnockout + '<br>' +
                '<span>' + L.ratBandGroupsWho + '</span> ' + L.ratBandGroups +
            '</div></div>';

            html += '<div class="ad-pts-scroll"><table class="ad-pts" id="setRulesTable"><thead><tr>' +
                '<th class="ad-pts-place-h">' + L.ratPlace + '</th>';

            cachedLevels.forEach(function(lv) {
                var name = isEn ? (lv.name_en || lv.name) : lv.name;
                var предел = A.пределМест(lv.id);
                html += '<th>' +
                    '<span>' + A.esc(name) + '</span>' +
                    (предел < строк ? '<span class="ad-pts-limit">' +
                        L.ratPlacesLimit.replace('{n}', предел) + '</span>' : '') +
                    (правит ? '<button class="ad-btn-icon set-del-level" data-level-id="' + lv.id +
                        '" title="' + L.ratDeleteLevel + '">&times;</button>' : '') +
                '</th>';
            });
            html += '</tr></thead><tbody>';

            for (var место = 1; место <= строк; место++) {
                /* Первые четыре места отбиты: они платятся таблицей ВСЕГДА,
                   и в группах тоже (`rating-points.js`, МЕСТ_ПО_ТАБЛИЦЕ). */
                var класс = место <= 4 ? ' class="ad-pts-tbl"' : '';
                html += '<tr' + класс + '><td class="ad-pts-place">' + место + '</td>';
                cachedLevels.forEach(function(lv) {
                    if (место > A.пределМест(lv.id)) {
                        html += '<td><span class="ad-pts-off" title="' +
                            L.ratBeyondLimit + '">&mdash;</span></td>';
                        return;
                    }
                    var с = (по[lv.id] || {})[место];
                    var знач = с ? с.points : 0;
                    html += '<td><input type="number" class="ad-pts-in set-rule-input" ' +
                        'data-level="' + lv.id + '" data-place="' + место + '" ' +
                        'data-id="' + (с ? с.id : '') + '" ' +
                        'value="' + знач + '" min="0"' + (правит ? '' : ' readonly') + '></td>';
                });
                html += '</tr>';
                if (место === 4 && строк > 4) html += '<tr class="ad-pts-sep"><td colspan="' + (cachedLevels.length + 1) + '"></td></tr>';
            }

            html += '</tbody></table></div></div>';
        }

        /* У МЕНЕДЖЕРА КНОПОК НЕТ ВОВСЕ, а не заблокированные.
           Заблокированная кнопка обещает действие, которого не будет; к тому
           же писать ему и не даст RLS (`points_by_place_admin`,
           `sql/схема/versii-tablicy-ochkov.sql`). Наружу выходит только
           безопасное. */
        if (правит) {
            html += '<div class="ad-rat-actions">' +
                '<button class="ad-btn ad-btn-secondary" id="setAddLevelBtn">' + L.ratAddLevel + '</button>' +
                (cachedLevels.length > 0 ? '<button class="ad-btn ad-btn-primary" id="setSaveRulesBtn">' + L.ratSaveRules + '</button>' : '') +
            '</div>';
        }

        panel.innerHTML = html;

        if (правит) {
            var saveBtn = document.getElementById('setSaveRulesBtn');
            if (saveBtn) saveBtn.addEventListener('click', savePointsByPlace);
            var addBtn = document.getElementById('setAddLevelBtn');
            if (addBtn) addBtn.addEventListener('click', showAddLevelModal);
        }

        // Allow only digits in rule inputs
        panel.addEventListener('keydown', function(e) {
            if (!e.target.classList.contains('set-rule-input')) return;
            if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });

        /* УДАЛЕНИЕ УРОВНЯ: СНАЧАЛА ПОСЧИТАТЬ, ПОТОМ СПРАШИВАТЬ.
           До 03.10 здесь стоял `confirm(L.ratDeleteLevelConfirm)` с текстом
           «Удалить этот уровень и все его правила?» — и ни слова о том, что
           турниры этого уровня его ЛИШАТСЯ, а 64 строки таблицы мест уйдут
           навсегда. Этим крестиком 30.09 и осиротели восемь ТБШ: 269 строк
           истории с 37 181 очком перестали быть рейтинговыми, и по какой
           таблице им платили — больше не узнать.
           Теперь числа называются ДО вопроса. */
        panel.addEventListener('click', async function(e) {
            var delBtn = e.target.closest('.set-del-level');
            if (!delBtn) return;
            var levelId = delBtn.getAttribute('data-level-id');
            if (!levelId) return;

            var что = await чтоПотеряетУровень(levelId);
            if (!что) return;

            if (что.турниров > 0) {
                A.showToast(
                    L.ratLevelHasTournaments
                        .replace('{n}', что.турниров)
                        .replace('{m}', что.строкИтогов),
                    'error');
                return;
            }

            if (confirm(L.ratDeleteLevelConfirm.replace('{n}', что.мест))) {
                deleteLevel(levelId);
            }
        });
    }

    function showAddLevelModal() {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:400px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.ratAddLevel + '</h3>' +
                    '<button class="ad-modal-close" id="setLevelModalClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-field" style="margin-bottom:12px;">' +
                        '<label class="ad-field-label">' + L.ratLevelName + '</label>' +
                        '<input type="text" class="ad-field-input" id="setLevelNameInput" placeholder="' + L.ratLevelName + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-bottom:16px;">' +
                        '<label class="ad-field-label">' + L.ratLevelNameEn + '</label>' +
                        '<input type="text" class="ad-field-input" id="setLevelNameEnInput" placeholder="' + L.ratLevelNameEn + '">' +
                    '</div>' +
                    '<div style="display:flex;gap:12px;justify-content:flex-end;">' +
                        '<button class="ad-btn ad-btn-primary" id="setLevelSaveBtn">' + L.save + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('setLevelModalClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Auto-translate RU → EN on blur
        document.getElementById('setLevelNameInput').addEventListener('blur', function() {
            var srcText = this.value.trim();
            var targetEl = document.getElementById('setLevelNameEnInput');
            if (!srcText || targetEl.value.trim()) return;
            targetEl.placeholder = L.translating;
            A.translateFromRu(srcText, 'en').then(function(result) {
                if (!targetEl.value.trim()) targetEl.value = result;
                targetEl.placeholder = L.ratLevelNameEn;
            }).catch(function() {
                targetEl.placeholder = L.ratLevelNameEn;
            });
        });

        document.getElementById('setLevelSaveBtn').addEventListener('click', async function() {
            var name = document.getElementById('setLevelNameInput').value.trim();
            var nameEn = document.getElementById('setLevelNameEnInput').value.trim();
            if (!name) return;
            var cachedLevels = A.cachedLevels || [];
            var sortOrder = cachedLevels.length > 0 ? Math.max.apply(null, cachedLevels.map(function(l) { return l.sort_order || 0; })) + 1 : 1;
            var res = await A.client.from('tournament_levels').insert({ name: name, name_en: nameEn || name, sort_order: sortOrder });
            if (res.error) {
                A.showToast(res.error.message, 'error');
                return;
            }
            overlay.remove();
            A.cachedLevels = [];
            await A.loadTournamentLevels(true);
            await завестиМестаУровня(name);
            await A.местаВсехУровней(true);
            renderSetRules();
        });
    }

    /**
     * НОВЫЙ УРОВЕНЬ БЕЗ МЕСТ НЕ ПЛАТИТ НИЧЕГО.
     *
     * До 03.10 «+ Добавить уровень» заводил строку в `tournament_levels` и
     * строки в `points_rules` — а начисление читает `points_by_place`, где у
     * нового уровня не было НИ ОДНОЙ строки. То есть уровень создавался уже
     * неработающим, и экран этого не показывал: он рисовал раунды.
     *
     * Теперь месту заводится строка — нулём. НОЛЬ ЗДЕСЬ ЧЕСТНЕЕ ЧИСЛА:
     * придумывать шкалу новому уровню я не вправе, а пустая строка не даёт
     * её и ввести (сохранение правит по `id`, а не выдумывает строку).
     *
     * ЕСЛИ ВЕРСИЯ УЖЕ В СИЛЕ, СТОРОЖ ОТКАЖЕТ — и правильно: цена мест
     * задним числом не меняется. Его текст показываем как есть, он
     * объясняет сам, и рядом говорим, что делать. Окна «новая версия с
     * даты» пока нет — это следующий шаг куска.
     */
    async function завестиМестаУровня(имя) {
        await A.loadTournamentLevels(true);
        var уровень = (A.cachedLevels || []).find(function(l) { return l.name === имя; });
        if (!уровень) { A.showToast(L.ratLevelAdded, 'success'); return; }

        var версия = await A.действующаяВерсия(true);
        var предел = A.пределМест(уровень.id);

        var строки = [];
        for (var м = 1; м <= предел; м++) {
            var строка = { level_id: уровень.id, place: м, points: 0 };
            if (версия) строка.version_id = версия.id;
            строки.push(строка);
        }

        var ответ = await A.client.from('points_by_place').insert(строки);
        if (ответ.error) {
            A.showToast(ответ.error.message, 'error');
            A.showToast(L.ratLevelNeedsVersion, 'info');
            return;
        }

        /* РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ, а не ответом без ошибки: RLS
           отказывает молча нулём строк. */
        var сверка = await A.client.from('points_by_place')
            .select('id', { count: 'exact', head: true })
            .eq('level_id', уровень.id);
        if (сверка.error || сверка.count !== предел) {
            A.showToast(L.ratLevelPlacesMismatch
                .replace('{n}', сверка.count === undefined ? '?' : сверка.count)
                .replace('{m}', предел), 'error');
            return;
        }

        A.showToast(L.ratLevelAddedWithPlaces.replace('{n}', предел), 'success');
    }

    /**
     * ЧТО ПОТЕРЯЕТСЯ ВМЕСТЕ С УРОВНЕМ — числами, а не словами.
     *
     * Турниры: `deleteLevel` ставит им `level_id = null`, а
     * `tournament_results` не трогает. Турнир без уровня не рейтинговый
     * (`isUnrankedTournament`, `bracket.js`), значит его история осиротеет:
     * очки лежат, а таблицы за ними больше нет.
     *
     * Места: `points_by_place.level_id` объявлен `ON DELETE CASCADE`
     * (`sql/схема/kategorii-i-ochki.sql:67`) — 64 строки уносит САМА БАЗА,
     * `deleteLevel` их даже не упоминает. Отката нет.
     *
     * `head: true` с `count: 'exact'`: нужны числа, а не строки.
     * Ошибку чтения НЕ глотаем и `0` вместо неё не возвращаем — иначе
     * порог пропустил бы удаление ровно тогда, когда база недоступна.
     */
    async function чтоПотеряетУровень(levelId) {
        var турниры = await A.client.from('tournaments')
            .select('id', { count: 'exact', head: true })
            .eq('level_id', levelId);
        var места = await A.client.from('points_by_place')
            .select('id', { count: 'exact', head: true })
            .eq('level_id', levelId);

        if (турниры.error || места.error) {
            A.showToast((турниры.error || места.error).message, 'error');
            return null;
        }

        var итоги = { count: 0 };
        if (турниры.count > 0) {
            var ид = await A.client.from('tournaments')
                .select('id').eq('level_id', levelId);
            if (ид.error) {
                A.showToast(ид.error.message, 'error');
                return null;
            }
            итоги = await A.client.from('tournament_results')
                .select('id', { count: 'exact', head: true })
                .in('tournament_id', (ид.data || []).map(function(т) { return т.id; }));
            if (итоги.error) {
                A.showToast(итоги.error.message, 'error');
                return null;
            }
        }

        return {
            турниров: турниры.count || 0,
            мест: места.count || 0,
            строкИтогов: итоги.count || 0
        };
    }

    async function deleteLevel(levelId) {
        /* ПОРОГ СТОИТ И ЗДЕСЬ, А НЕ ТОЛЬКО В ОБРАБОТЧИКЕ НАЖАТИЯ.
           Проверка у кнопки — вежливость; проверка у действия — защита.
           ШАГ, КОТОРЫЙ УДАЛЯЕТ, НЕ НАЧИНАЕТСЯ, ПОКА ЧИСЛА НЕ НАЗВАНЫ. */
        var что = await чтоПотеряетУровень(levelId);
        if (!что) return;
        if (что.турниров > 0) {
            A.showToast(
                L.ratLevelHasTournaments
                    .replace('{n}', что.турниров)
                    .replace('{m}', что.строкИтогов),
                'error');
            return;
        }

        // Unlink tournaments from this level, then delete rules, then level
        await A.client.from('tournaments').update({ level_id: null }).eq('level_id', levelId);
        await A.client.from('points_rules').delete().eq('level_id', levelId);
        var res = await A.client.from('tournament_levels').delete().eq('id', levelId);
        if (res.error) {
            A.showToast(res.error.message, 'error');
            return;
        }
        A.showToast(L.ratLevelDeleted, 'success');
        A.cachedLevels = [];
        await A.loadTournamentLevels(true);
        await A.местаВсехУровней(true);
        renderSetRules();
    }

    /**
     * СОХРАНЕНИЕ ОЧКОВ ЗА МЕСТО.
     *
     * ПИШЕМ ТОЛЬКО ИЗМЕНЁННОЕ, а не всю таблицу. Прежний
     * `savePointsRules` собирал все 60 строк и отправлял `upsert` целиком:
     * сторож версий (`sql/схема/versii-tablicy-ochkov.sql`) уронил бы такую
     * запись на первой же строке действующей версии, даже если человек не
     * тронул ни одного числа.
     *
     * ПРАВКА ИДЁТ ПО `id` СТРОКИ, А НЕ ПО ОТБОРУ ЗАНОВО. Правило выведено на
     * ТБШ: между чтением и записью отбор может разойтись.
     *
     * РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ. Ответ без ошибки не значит, что числа
     * легли: сторож отвечает ошибкой, а RLS — молча нулём строк. Поэтому
     * таблица перечитывается, и сверяется, что в базе лежит ровно
     * отправленное.
     */
    async function savePointsByPlace() {
        var поля = document.querySelectorAll('#setRulesTable .set-rule-input');
        var было = {};
        (A._местаОчков || []).forEach(function(с) { было[с.id] = с.points; });

        var правки = [];
        поля.forEach(function(п) {
            var id = п.dataset.id;
            if (!id) return;                        // строки нет в базе — не выдумываем
            var новое = parseInt(п.value, 10);
            if (isNaN(новое) || новое < 0) return;
            if (новое === было[id]) return;         // не тронуто
            правки.push({ id: id, points: новое });
        });

        if (!правки.length) {
            A.showToast(L.ratNothingChanged, 'info');
            return;
        }

        for (var i = 0; i < правки.length; i++) {
            var ответ = await A.client.from('points_by_place')
                .update({ points: правки[i].points })
                .eq('id', правки[i].id);
            if (ответ.error) {
                /* Сторож versions говорит «уже в силе» — это не сбой, а
                   устройство: поправка заводится новой версией с будущей
                   даты. Показываем его текст, он объясняет сам. */
                A.showToast(ответ.error.message, 'error');
                await перечитатьМеста();
                return;
            }
        }

        var сверка = await перечитатьМеста();
        var разошлось = правки.filter(function(п) { return сверка[п.id] !== п.points; });
        if (разошлось.length) {
            A.showToast(L.ratSaveMismatch.replace('{n}', разошлось.length), 'error');
            return;
        }

        A.showToast(L.ratRulesSaved, 'success');
    }

    /** Перечитка таблицы мест: отдаёт `{id: очки}` из базы и перерисовывает экран. */
    async function перечитатьМеста() {
        await A.местаВсехУровней(true);
        renderSetRules();
        var есть = {};
        (A._местаОчков || []).forEach(function(с) { есть[с.id] = с.points; });
        return есть;
    }

    // ---- Promotions Sub-tab ----
    function renderSetPromotions() {
        var panel = document.getElementById('setPanelPromotions');
        if (!panel) return;

        // Gender dropdown
        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">' + L.genderMen + '</option>' +
            '<option value="women">' + L.genderWomen + '</option>';

        // Category dropdown
        var catOpts = '<option value="">' + L.ratAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            catOpts += '<option value="' + c.id + '">' + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-rat-info-banner">' + L.ratTop5Info + '</div>' +
            '<div class="ad-filter-row">' +
                '<select class="ad-field-input ad-filter-select" id="setPromoGenderFilter">' + genderOpts + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="setPromoCatFilter">' + catOpts + '</select>' +
            '</div>' +
            '<div id="setPromotionsBody"></div>';

        document.getElementById('setPromoGenderFilter').addEventListener('change', function() {
            _promoGenderFilter = this.value;
            var catSelect = document.getElementById('setPromoCatFilter');
            var newCatOpts = '<option value="">' + L.ratAllCategories + '</option>';
            A.cachedCategories.forEach(function(c) {
                if (_promoGenderFilter && c.gender !== _promoGenderFilter) return;
                var name = isEn ? (c.name_en || c.name) : c.name;
                newCatOpts += '<option value="' + c.id + '">' + name + '</option>';
            });
            catSelect.innerHTML = newCatOpts;
            _promoCatFilter = '';
            loadPromotions();
        });

        document.getElementById('setPromoCatFilter').addEventListener('change', function() {
            _promoCatFilter = this.value;
            loadPromotions();
        });

        loadPromotions();
    }

    async function loadPromotions() {
        var body = document.getElementById('setPromotionsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        // Load current promotions
        var res = await A.client.from('player_promotions').select('*, players(name, name_en), from_cat:categories!player_promotions_from_category_id_fkey(name, name_en), to_cat:categories!player_promotions_to_category_id_fkey(name, name_en)').order('created_at', { ascending: false });
        var promotions = res.data || [];

        // Build a set of player IDs with active promotions (eligible/transition)
        var activePromotionMap = {};
        promotions.forEach(function(pr) {
            if (pr.status === 'eligible' || pr.status === 'transition') {
                activePromotionMap[pr.player_id] = pr.status;
            }
        });

        // Group categories by gender, sort by sort_order ascending (Tour→Pro-Masters)
        var catsByGender = {};
        A.cachedCategories.forEach(function(c) {
            var g = c.gender || 'other';
            if (!catsByGender[g]) catsByGender[g] = [];
            catsByGender[g].push(c);
        });
        Object.keys(catsByGender).forEach(function(g) {
            catsByGender[g].sort(function(a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
        });

        // Build eligible list
        var eligibleHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Eligible for Promotion' : 'Доступны для промоушена') + '</h3>';
        var hasEligible = false;

        var genders = Object.keys(catsByGender);
        for (var gi = 0; gi < genders.length; gi++) {
            if (_promoGenderFilter && genders[gi] !== _promoGenderFilter) continue;

            var genderCats = catsByGender[genders[gi]];
            var genderLabel = genders[gi] === 'men' ? (isEn ? 'Men' : 'Мужчины') : (isEn ? 'Women' : 'Женщины');

            for (var ci = 0; ci < genderCats.length - 1; ci++) {
                var cat = genderCats[ci];
                var nextCat = genderCats[ci + 1];

                if (_promoCatFilter && cat.id !== _promoCatFilter) continue;

                var catName = isEn ? (cat.name_en || cat.name) : cat.name;
                var nextCatName = isEn ? (nextCat.name_en || nextCat.name) : nextCat.name;

                var plrRes = await A.client.from('players').select('id, name, name_en, points').eq('category_id', cat.id).order('points', { ascending: false }).limit(5);
                var top5 = plrRes.data || [];

                if (top5.length > 0) {
                    hasEligible = true;
                    eligibleHtml += '<div class="ad-table-card" style="margin-bottom:12px;">' +
                        '<div class="ad-table-card-title">' + genderLabel + ': ' + catName + ' → ' + nextCatName + '</div>' +
                        '<div class="ad-table-wrap"><table class="ad-table ad-promo-table"><thead><tr>' +
                        '<th style="width:40px">#</th><th>' + L.ratPlayer + '</th><th style="width:80px">' + L.ratPoints + '</th><th style="width:140px">' + L.ratActions + '</th>' +
                        '</tr></thead><tbody>';

                    top5.forEach(function(p, idx) {
                        var name = isEn ? (p.name_en || p.name) : p.name;
                        var actionCell;
                        if (activePromotionMap[p.id]) {
                            var st = activePromotionMap[p.id];
                            var stLabel = st === 'eligible' ? L.ratEligible : L.ratTransition;
                            actionCell = '<span class="ad-status-badge ad-status-' + st + '">' + stLabel + '</span>';
                        } else {
                            actionCell = '<button class="ad-btn ad-btn-sm ad-btn-primary promo-promote-btn" data-player-id="' + p.id + '" data-from-cat="' + cat.id + '" data-to-cat="' + nextCat.id + '">' + L.ratPromote + '</button>';
                        }
                        eligibleHtml += '<tr><td>' + (idx + 1) + '</td><td>' + A.esc(name) + '</td><td>' + (p.points || 0) + '</td><td>' + actionCell + '</td></tr>';
                    });
                    eligibleHtml += '</tbody></table></div></div>';
                }
            }
        }

        if (!hasEligible) {
            eligibleHtml += '<div class="ad-empty-state"><p>' + L.ratNoPlayers + '</p></div>';
        }

        // Existing promotions history
        var historyHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Promotion History' : 'История промоушенов') + '</h3>';

        var filteredPromotions = promotions;
        if (_promoGenderFilter || _promoCatFilter) {
            filteredPromotions = promotions.filter(function(pr) {
                if (_promoCatFilter) return pr.from_category_id === _promoCatFilter;
                var fromCatObj = A.cachedCategories.find(function(c) { return c.id === pr.from_category_id; });
                return fromCatObj && fromCatObj.gender === _promoGenderFilter;
            });
        }

        if (filteredPromotions.length === 0) {
            historyHtml += '<div class="ad-empty-state"><p>' + L.ratNoPromotions + '</p></div>';
        } else {
            historyHtml += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table ad-promo-history"><thead><tr>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th>' + L.ratFromCat + '</th>' +
                '<th>' + L.ratToCat + '</th>' +
                '<th style="width:70px">' + L.ratSeason + '</th>' +
                '<th style="width:100px">' + L.ratStatus + '</th>' +
                '<th style="width:200px">' + L.ratActions + '</th>' +
            '</tr></thead><tbody>';

            filteredPromotions.forEach(function(pr) {
                var name = pr.players ? (isEn ? (pr.players.name_en || pr.players.name) : pr.players.name) : '?';
                var fromCat = pr.from_cat ? (isEn ? (pr.from_cat.name_en || pr.from_cat.name) : pr.from_cat.name) : '?';
                var toCat = pr.to_cat ? (isEn ? (pr.to_cat.name_en || pr.to_cat.name) : pr.to_cat.name) : '?';
                var statusLabel = pr.status === 'eligible' ? L.ratEligible : pr.status === 'transition' ? L.ratTransition : L.ratCompleted;
                var statusClass = 'ad-status-badge ad-status-' + pr.status;

                var actionsHtml = '';
                if (pr.status === 'eligible') {
                    actionsHtml = '<div class="ad-promo-actions">' +
                        '<button class="ad-btn ad-btn-sm ad-btn-primary promo-transition-btn" data-promo-id="' + pr.id + '">' + L.ratStartTransition + '</button>' +
                        '<button class="ad-btn ad-btn-sm ad-btn-danger promo-cancel-btn" data-promo-id="' + pr.id + '">' + L.ratCancelPromotion + '</button>' +
                    '</div>';
                } else if (pr.status === 'transition') {
                    actionsHtml = '<div class="ad-promo-actions">' +
                        '<button class="ad-btn ad-btn-sm ad-btn-primary promo-complete-btn" data-promo-id="' + pr.id + '">' + L.ratCompletePromotion + '</button>' +
                        '<button class="ad-btn ad-btn-sm ad-btn-danger promo-cancel-btn" data-promo-id="' + pr.id + '">' + L.ratCancelPromotion + '</button>' +
                    '</div>';
                } else {
                    actionsHtml = '—';
                }

                historyHtml += '<tr>' +
                    '<td>' + A.esc(name) + '</td>' +
                    '<td>' + A.esc(fromCat) + '</td>' +
                    '<td>' + A.esc(toCat) + '</td>' +
                    '<td>' + pr.season + '</td>' +
                    '<td><span class="' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td>' + actionsHtml + '</td>' +
                '</tr>';
            });
            historyHtml += '</tbody></table></div></div>';
        }

        body.innerHTML = eligibleHtml + historyHtml;
    }

    async function createPromotion(playerId, fromCatId, toCatId) {
        var season = new Date().getFullYear();
        var res = await A.client.from('player_promotions').insert({
            player_id: playerId,
            from_category_id: fromCatId,
            to_category_id: toCatId,
            season: season,
            status: 'eligible',
            eligible_date: new Date().toISOString().slice(0, 10)
        });
        if (res.error) { A.showToast(res.error.message, 'error'); return; }
        A.showToast(L.ratPromoted, 'success');
        await loadPromotions();
    }

    async function updatePromotionStatus(promotionId, newStatus) {
        if (newStatus === 'transition') {
            var res = await A.client.from('player_promotions').update({ status: 'transition' }).eq('id', promotionId);
            if (res.error) { A.showToast(res.error.message, 'error'); return; }
        } else if (newStatus === 'completed') {
            var prRes = await A.client.from('player_promotions').select('player_id, to_category_id').eq('id', promotionId).single();
            if (prRes.error) { A.showToast(prRes.error.message, 'error'); return; }
            var pr = prRes.data;
            var upd = await A.client.from('player_promotions').update({
                status: 'completed',
                completed_date: new Date().toISOString().slice(0, 10)
            }).eq('id', promotionId);
            if (upd.error) { A.showToast(upd.error.message, 'error'); return; }
            // Move player to new category, reset stats
            var plrUpd = await A.client.from('players').update({
                category_id: pr.to_category_id,
                points: 0,
                wins: 0,
                losses: 0,
                form: [],
                rank_change: 0
            }).eq('id', pr.player_id);
            if (plrUpd.error) { A.showToast(plrUpd.error.message, 'error'); return; }
        }
        A.showToast(newStatus === 'completed' ? L.ratPromotionCompleted : L.ratPromoted, 'success');
        await loadPromotions();
    }

    async function cancelPromotion(promotionId) {
        if (!confirm(L.ratConfirmCancel)) return;
        var res = await A.client.from('player_promotions').delete().eq('id', promotionId);
        if (res.error) { A.showToast(res.error.message, 'error'); return; }
        A.showToast(L.ratPromotionCancelled, 'success');
        await loadPromotions();
    }

    // Promotion action buttons (event delegation)
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.promo-promote-btn');
        if (btn) {
            createPromotion(btn.dataset.playerId, btn.dataset.fromCat, btn.dataset.toCat);
            return;
        }
        btn = e.target.closest('.promo-transition-btn');
        if (btn) {
            updatePromotionStatus(btn.dataset.promoId, 'transition');
            return;
        }
        btn = e.target.closest('.promo-complete-btn');
        if (btn) {
            if (confirm(L.ratConfirmComplete)) {
                updatePromotionStatus(btn.dataset.promoId, 'completed');
            }
            return;
        }
        btn = e.target.closest('.promo-cancel-btn');
        if (btn) {
            cancelPromotion(btn.dataset.promoId);
            return;
        }
    });

    // ---- Export to namespace ----
    A.renderSettingsSection = renderSettingsSection;

})();
