// ============================================
// KSLT Admin — Жалобы и блокировки (Apple 1.2)
// ============================================
//
// ЗАЧЕМ РАЗДЕЛ. Правило App Store 1.2 требует от приложения с
// пользовательским содержимым «a mechanism to report offensive content
// AND TIMELY RESPONSES». Жалоба без экрана разбора — половина требования:
// принять её база умеет с 04.11, а отвечать было не на что смотреть.
// ЗАЩИТА, КОТОРУЮ НИКТО НЕ МОЖЕТ ПРОЧИТАТЬ, НЕ ЗАЩИЩАЕТ (правило 03.11).
//
// ПОЧЕМУ ДАННЫЕ ИДУТ ФУНКЦИЯМИ, А НЕ ЗАПРОСАМИ. Имя пожаловавшегося живёт
// в `profiles`, имя того, на кого жалуются, — в `players`, связывает их
// `profiles.player_id`. Три запроса и порядок между ними — это шов, на
// котором родится беда. Одно определение на одно понятие:
// `sql/схема/apple-1-2-admin.sql`.

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;

    /* Вкладка и фильтр живут в модуле, а не в адресе: раздел не
       глубокоссылочный — на жалобу не дают ссылку, её разбирают. */
    var вкладка = 'zhaloby';
    var фильтрСтатуса = 'new';

    /** Коды причин — те же, что в ограничении базы `content_reports.reason`. */
    var ПРИЧИНЫ = {
        offensive:     'Оскорбление или угрозы',
        spam:          'Реклама или спам',
        fake:          'Выдаёт себя за другого',
        foreign_photo: 'Чужая фотография',
        other:         'Другое'
    };

    var ОБЪЕКТЫ = {
        player: 'Игрок',
        battle: 'Баттл',
        avatar: 'Фотография',
        bio:    'О себе'
    };

    var СТАТУСЫ = {
        new:      'Новая',
        reviewed: 'Разобрана',
        removed:  'Содержимое снято',
        rejected: 'Отклонена'
    };

    // ---- Вход ----
    A.renderSafetySection = function() {
        рисоватьОболочку();
    };
    /* Переключение разделов в боковом меню зовёт `resetMap` — у него своё
       имя для списка. Пусть оба имени ведут в одно место, а не копируют
       отрисовку: одно определение на одно понятие. */
    A.renderSafetyList = A.renderSafetySection;

    function рисоватьОболочку() {
        var где = document.getElementById('ad-safety');
        if (!где) return;

        где.innerHTML =
            '<h2 class="ad-section-title">' + L.sftTitle + '</h2>' +
            '<div class="ad-tabs ad-sft-tabs">' +
                кнопкаВкладки('zhaloby', L.sftTabReports) +
                кнопкаВкладки('blokirovki', L.sftTabBlocks) +
                кнопкаВкладки('bany', L.sftTabBans) +
            '</div>' +
            '<div id="adSftBody" class="ad-sft-body"></div>';

        где.querySelectorAll('.ad-sft-tabs .ad-tab').forEach(function(к) {
            к.addEventListener('click', function() {
                вкладка = к.getAttribute('data-vkladka');
                рисоватьОболочку();
            });
        });

        грузить();
    }

    function кнопкаВкладки(ключ, подпись) {
        return '<button class="ad-tab' + (вкладка === ключ ? ' active' : '') +
               '" data-vkladka="' + ключ + '" type="button">' + подпись + '</button>';
    }

    function грузить() {
        var тело = document.getElementById('adSftBody');
        if (!тело) return;
        тело.innerHTML = '<div class="ad-sft-load">' + L.sftLoading + '</div>';

        /* БАНЫ ЧИТАЮТСЯ ПРЯМО ИЗ `players`, БЕЗ ФУНКЦИИ, И ЭТО НЕ
           НЕБРЕЖНОСТЬ: админка и так читает эту таблицу (`players.js`),
           связывать тут нечего — имя, срок и причина лежат в одной
           строке. Функция нужна там, где данные надо СВЕСТИ. */
        var запрос;
        if (вкладка === 'zhaloby') {
            запрос = A.client.rpc('kslt_zhaloby', { p_status: фильтрСтатуса });
        } else if (вкладка === 'blokirovki') {
            запрос = A.client.rpc('kslt_blokirovki_vse');
        } else {
            /* ДВА БАНА, ОДИН СПИСОК. `ban_user` закрывает ВХОД и живёт в
               `profiles`, `ban_player` закрывает КАРТОЧКУ и живёт в
               `players`. Читать только вторую — значит показывать пусто
               человеку, который минуту назад забанил из «Пользователей».
               Поймано Костей глазами 04.11. */
            запрос = A.client.rpc('kslt_bany_vse');
        }

        запрос.then(function(r) {
            if (r.error) { throw r.error; }
            var д = r.data;
            /* ОТКАЗ ПРАВ ПРИХОДИТ НЕ ОШИБКОЙ, А ОТВЕТОМ. Функция возвращает
               `{error:'forbidden'}` обычным json, и если не разобрать его
               здесь, он молча нарисуется как пустой список — то есть
               соврёт, что жалоб нет. */
            if (д && д.error) {
                тело.innerHTML = пусто(д.error === 'forbidden' ? L.sftForbidden : L.sftLoadError);
                return;
            }
            if (вкладка === 'zhaloby') рисоватьЖалобы(тело, д || []);
            else if (вкладка === 'blokirovki') рисоватьБлокировки(тело, д || []);
            else рисоватьБаны(тело, д || []);
        }).catch(function(e) {
            console.warn('[KSLT] раздел жалоб не прочитан:', (e && e.message) || e);
            тело.innerHTML = пусто(L.sftLoadError);
        });
    }

    function пусто(текст) {
        return '<div class="ad-sft-empty">' + A.esc(текст) + '</div>';
    }

    // ---- Вкладка «Жалобы» ----
    function рисоватьЖалобы(тело, список) {
        var фильтры = '<p class="ad-sft-sub">' + L.sftSub + '</p>' +
                      '<div class="ad-sft-filters">';
        ['new', 'reviewed', 'removed', 'rejected', ''].forEach(function(с) {
            var подпись = с === '' ? L.sftAll : СТАТУСЫ[с];
            фильтры += '<button class="ad-sft-filter' + (фильтрСтатуса === с ? ' active' : '') +
                       '" data-status="' + с + '" type="button">' + подпись + '</button>';
        });
        фильтры += '</div>';

        var тело_ = '';
        if (!список.length) {
            тело_ = пусто(фильтрСтатуса === 'new' ? L.sftNoNew : L.sftNoneHere);
        } else {
            тело_ = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.sftThWhen + '</th>' +
                '<th>' + L.sftThWho + '</th>' +
                '<th>' + L.sftThOnWhom + '</th>' +
                '<th>' + L.sftThWhat + '</th>' +
                '<th>' + L.sftThReason + '</th>' +
                '<th>' + L.sftThNote + '</th>' +
                '<th></th>' +
            '</tr></thead><tbody>';

            список.forEach(function(ж) {
                /* СРОК ВИДЕН ЧИСЛОМ, А НЕ НА ГЛАЗ. Трое суток — это 72
                   часа, и строка, которая к ним подошла, красится сама:
                   разбирающий не должен считать в уме. */
                var часов = Number(ж.chasov || 0);
                var просрок = ж.status === 'new' && часов >= 72;
                var близко  = ж.status === 'new' && часов >= 48 && часов < 72;
                тело_ += '<tr class="' + (просрок ? 'ad-sft-late' : близко ? 'ad-sft-soon' : '') + '">' +
                    '<td>' + A.esc(когда(ж.created_at)) +
                      '<div class="ad-sft-hours">' + часов + ' ' + L.sftHours + '</div></td>' +
                    '<td>' + A.esc(ж.kto || '—') + '</td>' +
                    '<td>' + A.esc(ж.na_kogo || '—') + '</td>' +
                    '<td>' + A.esc(ОБЪЕКТЫ[ж.target_kind] || ж.target_kind) + '</td>' +
                    '<td>' + A.esc(ПРИЧИНЫ[ж.reason] || ж.reason) + '</td>' +
                    '<td class="ad-sft-note">' + A.esc(ж.note || '—') + '</td>' +
                    '<td class="ad-sft-actions">' + действия(ж) + '</td>' +
                '</tr>';
            });
            тело_ += '</tbody></table></div>';
        }

        тело.innerHTML = фильтры + тело_;

        тело.querySelectorAll('.ad-sft-filter').forEach(function(к) {
            к.addEventListener('click', function() {
                фильтрСтатуса = к.getAttribute('data-status');
                грузить();
            });
        });
        тело.querySelectorAll('[data-reshenie]').forEach(function(к) {
            к.addEventListener('click', function() {
                разобрать(к.getAttribute('data-id'), к.getAttribute('data-reshenie'), к);
            });
        });
    }

    function действия(ж) {
        if (ж.status !== 'new') {
            return '<span class="ad-badge">' + A.esc(СТАТУСЫ[ж.status] || ж.status) + '</span>';
        }
        return '<button class="ad-btn ad-btn-sm ad-btn-danger" type="button" ' +
                 'data-id="' + ж.id + '" data-reshenie="removed">' + L.sftRemove + '</button>' +
               '<button class="ad-btn ad-btn-sm" type="button" ' +
                 'data-id="' + ж.id + '" data-reshenie="reviewed">' + L.sftReviewed + '</button>' +
               '<button class="ad-btn ad-btn-sm" type="button" ' +
                 'data-id="' + ж.id + '" data-reshenie="rejected">' + L.sftReject + '</button>';
    }

    function разобрать(id, решение, кнопка) {
        /* РАБОТА, КОТОРАЯ НЕ ВИДНА, НЕОТЛИЧИМА ОТ БЕЗДЕЙСТВИЯ (правило
           03.11): запираем ВСЮ строку, а не одну нажатую кнопку, —
           соседние два решения в эту секунду так же недействительны. */
        var строка = кнопка.closest('tr');
        if (строка) {
            строка.setAttribute('aria-busy', 'true');
            строка.classList.add('ad-sft-busy');
            строка.querySelectorAll('button').forEach(function(б) { б.disabled = true; });
        }

        A.client.rpc('kslt_razobrat_zhalobu', { p_id: id, p_reshenie: решение })
            .then(function(r) {
                if (r.error) { throw r.error; }
                var о = r.data || {};
                if (о.error) { throw new Error(о.error); }
                A.showToast(L.sftDone, 'success');
                грузить();
            })
            .catch(function(e) {
                console.warn('[KSLT] решение по жалобе не записано:', (e && e.message) || e);
                A.showToast(L.sftDoneError, 'error');
                if (строка) {
                    строка.removeAttribute('aria-busy');
                    строка.classList.remove('ad-sft-busy');
                    строка.querySelectorAll('button').forEach(function(б) { б.disabled = false; });
                }
            });
    }

    // ---- Вкладка «Блокировки» ----
    function рисоватьБлокировки(тело, список) {
        if (!список.length) {
            тело.innerHTML = пусто(L.sftNoBlocks);
            return;
        }
        var h = '<p class="ad-sft-hint">' + L.sftBlocksHint + '</p>' +
            '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.sftThWhen + '</th>' +
                '<th>' + L.sftThBlocker + '</th>' +
                '<th>' + L.sftThBlocked + '</th>' +
            '</tr></thead><tbody>';
        список.forEach(function(б) {
            h += '<tr>' +
                '<td>' + A.esc(когда(б.created_at)) + '</td>' +
                '<td>' + A.esc(б.kto || '—') + '</td>' +
                '<td>' + A.esc(б.kogo || '—') + '</td>' +
            '</tr>';
        });
        тело.innerHTML = h + '</tbody></table></div>';
    }

    // ---- Вкладка «Баны клуба» ----
    /* БАН — НЕ БЛОКИРОВКА, И ПОЭТОМУ ОТДЕЛЬНАЯ ВКЛАДКА, А НЕ ОБЩАЯ
       ТАБЛИЦА. Блокировка — личный выбор человека, её никто не
       отменяет. Бан — наказание клуба, его ставит и снимает сотрудник.
       Смешать их в один список значило бы сказать, что это одно и то же.

       СНИМАЕТСЯ БАН НЕ ЗДЕСЬ, А В КАРТОЧКЕ ИГРОКА (`players.js:809`),
       где он и ставится. Второй кнопки не завожу: одно действие живёт
       в одном месте, иначе беда родится ровно на шве. */
    function рисоватьБаны(тело, список) {
        if (!список.length) {
            тело.innerHTML = пусто(L.sftNoBans);
            return;
        }
        var h = '<p class="ad-sft-hint">' + L.sftBansHint + '</p>' +
            '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.sftThPlayer + '</th>' +
                '<th>' + L.sftThWhatClosed + '</th>' +
                '<th>' + L.sftThUntil + '</th>' +
                '<th>' + L.sftThReason + '</th>' +
                '<th>' + L.sftThByWhom + '</th>' +
                '<th></th>' +
            '</tr></thead><tbody>';
        список.forEach(function(б) {
            /* НАВСЕГДА — ЭТО 2099 ГОД, и так уже решено в карточке
               игрока (`players.js:802`). Читаем тот же признак, а не
               заводим свой. */
            var навсегда = new Date(б.do).getFullYear() >= 2099;
            var учётка = б.vid === 'uchyotka';
            h += '<tr>' +
                '<td>' + A.esc(б.kto || '—') + '</td>' +
                /* ЧТО ИМЕННО ЗАКРЫТО — НЕ УКРАШЕНИЕ: один бан не пускает
                   в приложение вовсе, другой только прячет карточку.
                   Снимать их тоже надо разными действиями. */
                '<td>' + (учётка ? L.sftBanAccount : L.sftBanCard) + '</td>' +
                '<td>' + (навсегда ? L.sftForever : A.esc(когда(б.do))) + '</td>' +
                '<td class="ad-sft-note">' + A.esc(б.prichina || '—') + '</td>' +
                '<td>' + A.esc(б.kem || L.sftUnknownWho) + '</td>' +
                '<td class="ad-sft-actions">' +
                  '<button class="ad-btn ad-btn-sm" type="button" data-unban="' +
                    A.esc(б.cel_id) + '" data-vid="' + A.esc(б.vid) + '">' +
                    L.sftUnban + '</button>' +
                '</td>' +
            '</tr>';
        });
        тело.innerHTML = h + '</tbody></table></div>';

        тело.querySelectorAll('[data-unban]').forEach(function(к) {
            к.addEventListener('click', function() { снятьБан(к); });
        });
    }

    /* СНЯТИЕ ЗОВЁТ ТУ ЖЕ ФУНКЦИЮ, ЧТО КАРТОЧКА ИГРОКА, — `unban_player`
       в `admin-manage-user`. Точек входа две, ОПРЕДЕЛЕНИЕ ОДНО: иначе
       завтра одна из них забудет снять `ban_reason`, и беда родится
       ровно на шве. Своего запроса к `players` здесь нет нарочно. */
    function снятьБан(кнопка) {
        var строка = кнопка.closest('tr');
        if (строка) {
            строка.setAttribute('aria-busy', 'true');
            строка.classList.add('ad-sft-busy');
            строка.querySelectorAll('button').forEach(function(б) { б.disabled = true; });
        }
        /* ДЕЙСТВИЕ ВЫБИРАЕТСЯ ПО ВИДУ БАНА. Позвать `unban_player` для
           бана учётной записи значит очистить не ту таблицу и оставить
           человека без входа, сказав ему «готово». */
        var учётка = кнопка.getAttribute('data-vid') === 'uchyotka';
        A.adminAction(учётка ? 'unban_user' : 'unban_player',
            учётка ? { user_id: кнопка.getAttribute('data-unban') }
                   : { player_id: кнопка.getAttribute('data-unban') })
            .then(function() {
                A.showToast(L.sftUnbanDone, 'success');
                грузить();
            })
            .catch(function(e) {
                console.warn('[KSLT] бан не снят:', (e && e.message) || e);
                A.showToast((e && e.message) || L.sftUnbanError, 'error');
                if (строка) {
                    строка.removeAttribute('aria-busy');
                    строка.classList.remove('ad-sft-busy');
                    строка.querySelectorAll('button').forEach(function(б) { б.disabled = false; });
                }
            });
    }

    /** Дата и время: у жалобы важен час, а не только день — срок в часах. */
    function когда(iso) {
        if (!iso) return '—';
        try {
            return window.KSLT_VREMYA.показМомента(iso, 'ru-RU', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return String(iso).slice(0, 16); }
    }

})();
