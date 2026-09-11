// ============================================
// Заявка в парный турнир — окно выбора напарника
// ============================================
//
// В паре заявку подаёт один за двоих, поэтому окно нужно везде, где есть
// кнопка записи: на карточке в списке турниров и на самой странице турнира.
// Раньше оно жило только на странице турнира, и с карточки записаться в
// парный было нельзя — человека уводило читать турнир заново.
//
// Напарник бывает двух видов:
//   из базы — обычный игрок клуба, заявка сразу получает своё место;
//   гость   — человека в базе нет, место за парой держим, но менеджер должен
//             подтвердить: клуб не знает ни его рейтинга, ни того, придёт ли он.
//
// window.KSLT_DOUBLES.открыть({ client, tournament, playerName, onDone })

(function () {
    'use strict';

    var путь = window.location.pathname;
    var isEn = путь.indexOf('-en') !== -1;
    var isKg = путь.indexOf('-kg') !== -1;

    function pick(en, kg, ru) { return isEn ? en : (isKg ? kg : ru); }

    var L = {
        title: pick('Doubles entry', 'Жупта катталуу', 'Заявка в парный турнир'),
        titleChange: pick('Change partner', 'Өнөктөштү алмаштыруу', 'Заменить напарника'),
        you: pick('You', 'Сиз', 'Вы'),
        partner: pick('Partner', 'Өнөктөш', 'Напарник'),
        fromDb: pick('From club', 'Базадан', 'Из базы'),
        guest: pick('Guest', 'Конок', 'Гость'),
        solo: pick('Later', 'Кийин', 'Пока без'),
        genderWarn: pick('Gender does not match the tournament — the manager will review the entry.',
                         'Жынысы мелдешке дал келбейт — арызды менеджер карайт.',
                         'Пол не совпадает с турниром — заявку рассмотрит менеджер.'),
        soloNote: pick('You take a place now and add a partner later. A pair without a partner is not drawn.',
                       'Азыр орун ээлейсиз, өнөктөштү кийин кошосуз. Өнөктөшсүз жуп сеткага кирбейт.',
                       'Место занимается сразу, напарника добавите позже. Без напарника пара в сетку не попадёт.'),
        search: pick('Type name...', 'Атын жазыңыз...', 'Введите имя...'),
        guestName: pick('Guest name', 'Коноктун аты', 'Имя гостя'),
        guestNtrp: pick('NTRP', 'NTRP', 'NTRP'),
        guestGender: pick('Gender', 'Жынысы', 'Пол'),
        men: pick('Men', 'Эркек', 'Мужской'),
        women: pick('Women', 'Аял', 'Женский'),
        send: pick('Send entry', 'Арыз жөнөтүү', 'Подать заявку'),
        cancel: pick('Cancel', 'Жокко чыгаруу', 'Отмена'),
        needPartner: pick('Choose a partner or fill in the guest',
                          'Өнөктөштү тандаңыз же конокту толтуруңуз',
                          'Выберите напарника или заполните гостя'),
        guestNote: pick('A pair with a guest keeps its place, but the manager confirms it.',
                        'Конок менен жуп ордун сактайт, бирок менеджер ырастайт.',
                        'Пара с гостем занимает место, но её подтверждает менеджер.'),
        notFound: pick('Nobody found', 'Эч ким табылган жок', 'Никого не нашли'),
        limit: pick('Pair NTRP limit', 'Жуптун NTRP чеги', 'Лимит NTRP пары')
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /** Открыть окно. Возвращает промис: true — заявка ушла. */
    function открыть(opts) {
        var client = opts.client;
        var t = opts.tournament || {};
        var микст = t.format === 'mixed_doubles';

        var overlay = document.createElement('div');
        overlay.className = 'de-overlay';
        overlay.innerHTML =
            '<div class="de-modal">' +
                '<button class="de-close" type="button">&times;</button>' +
                '<h3 class="de-title">' + (opts.заменить ? L.titleChange : L.title) + '</h3>' +
                (t.title ? '<p class="de-trn">' + esc(t.title) + '</p>' : '') +

                '<div class="de-row"><span class="de-label">' + L.you + '</span>' +
                    '<span class="de-me">' + esc(opts.playerName || '') + '</span></div>' +

                (t.ntrp_combined_max
                    ? '<div class="de-limit">' + L.limit + ': ' + t.ntrp_combined_max + '</div>' : '') +

                '<div class="de-label de-label-block">' + L.partner + '</div>' +
                '<div class="de-switch">' +
                    '<button type="button" class="on" data-mode="db">' + L.fromDb + '</button>' +
                    '<button type="button" data-mode="guest">' + L.guest + '</button>' +
                    '<button type="button" data-mode="solo">' + L.solo + '</button>' +
                '</div>' +

                '<div class="de-block" data-block="db">' +
                    '<input type="text" class="de-input de-search" placeholder="' + L.search + '" autocomplete="off">' +
                    '<div class="de-results"></div>' +
                    '<input type="hidden" class="de-partner-id">' +
                '</div>' +

                '<div class="de-block" data-block="guest" hidden>' +
                    '<input type="text" class="de-input de-guest-name" placeholder="' + L.guestName + '">' +
                    '<div class="de-two">' +
                        '<select class="de-input de-guest-ntrp">' +
                            '<option value="">' + L.guestNtrp + '</option>' +
                            // Других значений в NTRP не бывает: список снимает
                            // вопрос про точку, запятую и «45» вместо 4.5
                            [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7].map(function (v) {
                                return '<option value="' + v + '">' + v.toFixed(1) + '</option>';
                            }).join('') +
                        '</select>' +
                        // Пол выбирается любой: пара с гостем всё равно ждёт
                        // решения менеджера, а в дружеский турнир женщину
                        // заявляют и намеренно — запрещать за него не нам
                        '<select class="de-input de-guest-gender">' +
                            '<option value="">' + L.guestGender + '</option>' +
                            '<option value="men">' + L.men + '</option>' +
                            '<option value="women">' + L.women + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<p class="de-note">' + L.guestNote + '</p>' +
                    '<p class="de-note de-gender-warn" hidden>' + L.genderWarn + '</p>' +
                '</div>' +

                '<div class="de-block" data-block="solo" hidden>' +
                    '<p class="de-note">' + L.soloNote + '</p>' +
                '</div>' +

                '<div class="de-actions">' +
                    '<button type="button" class="de-btn de-cancel">' + L.cancel + '</button>' +
                    '<button type="button" class="de-btn de-send">' + L.send + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function () { overlay.classList.add('active'); });

        var поиск = overlay.querySelector('.de-search');
        var список = overlay.querySelector('.de-results');
        var скрытое = overlay.querySelector('.de-partner-id');

        function закрыть() {
            overlay.classList.remove('active');
            setTimeout(function () { overlay.remove(); }, 180);
        }
        overlay.querySelector('.de-close').addEventListener('click', закрыть);
        overlay.querySelector('.de-cancel').addEventListener('click', закрыть);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) закрыть(); });

        // Переключение способа: чужие поля чистим, чтобы ушло ровно то, что видно
        overlay.querySelectorAll('.de-switch button').forEach(function (кн) {
            кн.addEventListener('click', function () {
                overlay.querySelectorAll('.de-switch button').forEach(function (x) {
                    x.classList.toggle('on', x === кн);
                });
                var режим = кн.dataset.mode;
                overlay.querySelectorAll('.de-block').forEach(function (блок) {
                    блок.hidden = блок.dataset.block !== режим;
                });
                // Поля другого способа чистим: уйти должно ровно то, что видно
                if (режим !== 'db') {
                    скрытое.value = '';
                    поиск.value = '';
                    список.innerHTML = '';
                }
                if (режим !== 'guest') {
                    overlay.querySelector('.de-guest-name').value = '';
                    overlay.querySelector('.de-guest-ntrp').value = '';
                    overlay.querySelector('.de-guest-gender').value = '';
                }
            });
        });

        // Пол гостя не тот, что у турнира — предупреждаем сразу, а не после отправки
        var полеПола = overlay.querySelector('.de-guest-gender');
        полеПола.addEventListener('change', function () {
            var чужой = (t.gender === 'men' || t.gender === 'women') &&
                полеПола.value && полеПола.value !== t.gender;
            overlay.querySelector('.de-gender-warn').hidden = !чужой;
        });

        // Поиск напарника среди игроков клуба
        var таймер;
        поиск.addEventListener('input', function () {
            clearTimeout(таймер);
            скрытое.value = '';
            var q = поиск.value.trim();
            if (q.length < 2) { список.innerHTML = ''; return; }

            таймер = setTimeout(async function () {
                var res = await client.from('players')
                    .select('id, name, name_en, gender, ntrp_singles, ntrp_doubles')
                    .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
                    .limit(8);
                var найдены = (res.data || []).filter(function (p) { return p.id !== opts.playerId; });
                if (!найдены.length) {
                    список.innerHTML = '<div class="de-empty">' + L.notFound + '</div>';
                    return;
                }
                список.innerHTML = найдены.map(function (p) {
                    var имя = isEn ? (p.name_en || p.name) : p.name;
                    var ntrp = p.ntrp_doubles || p.ntrp_singles;
                    return '<div class="de-item" data-id="' + esc(p.id) + '" data-name="' + esc(имя) + '">' +
                        '<span>' + esc(имя) + '</span>' +
                        (ntrp ? '<span class="de-ntrp">NTRP ' + ntrp + '</span>' : '') +
                    '</div>';
                }).join('');

                список.querySelectorAll('.de-item').forEach(function (строка) {
                    строка.addEventListener('click', function () {
                        скрытое.value = строка.dataset.id;
                        поиск.value = строка.dataset.name;
                        список.innerHTML = '';
                    });
                });
            }, 300);
        });

        // Отправка
        overlay.querySelector('.de-send').addEventListener('click', async function () {
            var кнопка = this;
            var режим = overlay.querySelector('.de-switch button.on').dataset.mode;
            var extra = {};
            // Замена: заявка уже есть, меняем в ней только напарника
            if (opts.заменить) extra.change_partner = true;

            if (режим === 'solo') {
                // Заявка без напарника: место занято, пару соберут позже
            } else if (режим === 'guest') {
                var имя = overlay.querySelector('.de-guest-name').value.trim();
                if (!имя) { кнопка.classList.add('de-shake'); setTimeout(function(){ кнопка.classList.remove('de-shake'); }, 400); return; }
                extra.partner_external_name = имя;
                var ntrp = overlay.querySelector('.de-guest-ntrp').value;
                if (ntrp) extra.partner_external_ntrp = Number(ntrp);
                var пол = overlay.querySelector('.de-guest-gender').value;
                if (пол) extra.partner_gender = пол;
                // Микст без пола партнёра не проверить — просим указать
                if (микст && !пол) { кнопка.classList.add('de-shake'); setTimeout(function(){ кнопка.classList.remove('de-shake'); }, 400); return; }
            } else {
                if (!скрытое.value) { кнопка.classList.add('de-shake'); setTimeout(function(){ кнопка.classList.remove('de-shake'); }, 400); return; }
                extra.partner_id = скрытое.value;
            }

            кнопка.disabled = true;
            кнопка.textContent = pick('Sending...', 'Жөнөтүлүүдө...', 'Отправка...');

            var info = await window.KSLT_REG.submit(client, t.id, { isEn: isEn, isKg: isKg, extra: extra });
            закрыть();
            if (opts.onDone) opts.onDone(info);
        });

        стили();
    }

    /** Оформление окна. Держим здесь же: модуль подключается на разные страницы. */
    function стили() {
        if (document.getElementById('de-styles')) return;
        var css = document.createElement('style');
        css.id = 'de-styles';
        css.textContent = [
            '.de-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2000;display:flex;',
            'align-items:center;justify-content:center;opacity:0;transition:opacity .18s}',
            '.de-overlay.active{opacity:1}',
            '.de-modal{position:relative;width:min(420px,92vw);max-height:88vh;overflow-y:auto;',
            'background:var(--bg-card,#111);border:1px solid var(--border-subtle,#262626);',
            'border-radius:16px;padding:24px}',
            '.de-close{position:absolute;top:12px;right:14px;background:none;border:none;color:var(--text-dim,#888);',
            'font-size:24px;line-height:1;cursor:pointer}',
            '.de-title{margin:0 0 4px;font-size:1.15rem;color:var(--text-primary,#fff)}',
            '.de-trn{margin:0 0 16px;font-size:.85rem;color:var(--text-secondary,#aaa)}',
            '.de-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}',
            '.de-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim,#888)}',
            '.de-label-block{display:block;margin:14px 0 8px}',
            '.de-me{font-weight:600;color:var(--text-primary,#fff)}',
            '.de-limit{padding:8px 12px;border-radius:8px;font-size:.82rem;color:var(--accent,#CCFF00);',
            'background:rgba(204,255,0,.08);border:1px solid rgba(204,255,0,.2)}',
            '.de-switch{display:flex;border:1px solid var(--border-subtle,#262626);border-radius:10px;overflow:hidden;margin-bottom:12px}',
            '.de-switch button{flex:1;padding:10px 6px;background:transparent;border:none;color:var(--text-secondary,#aaa);',
            'font-weight:600;font-size:.82rem;white-space:nowrap;cursor:pointer}',
            '.de-switch button+button{border-left:1px solid var(--border-subtle,#262626)}',
            '.de-switch button.on{background:var(--accent,#CCFF00);color:#0A0A0A}',
            '.de-input{width:100%;padding:10px 12px;border-radius:8px;box-sizing:border-box;',
            'background:var(--bg-elevated,#1a1a1a);border:1px solid var(--border-subtle,#262626);color:var(--text-primary,#fff)}',
            '.de-input+.de-input{margin-top:8px}',
            '.de-input:focus{outline:none;border-color:var(--accent,#CCFF00);',
            'box-shadow:0 0 0 2px rgba(204,255,0,.15)}',
            '.de-two{display:flex;gap:8px;margin-top:8px}',
            '.de-two .de-input{margin-top:0}',
            '.de-results{max-height:190px;overflow-y:auto;margin-top:6px}',
            '.de-item{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;',
            'border-radius:8px;cursor:pointer;color:var(--text-primary,#fff);font-size:.9rem}',
            '.de-item:hover{background:rgba(255,255,255,.06)}',
            '.de-ntrp{color:var(--text-dim,#888);font-size:.75rem}',
            '.de-empty{padding:10px;color:var(--text-dim,#888);font-size:.85rem}',
            '.de-note{margin:10px 0 0;font-size:.8rem;color:var(--text-secondary,#aaa);line-height:1.45}',
            '.de-actions{display:flex;gap:10px;margin-top:20px}',
            '.de-btn{flex:1;padding:11px;border-radius:10px;border:none;font-weight:600;cursor:pointer}',
            '.de-cancel{background:transparent;border:1px solid var(--border-subtle,#262626);color:var(--text-secondary,#aaa)}',
            '.de-send{background:var(--accent,#CCFF00);color:#0A0A0A}',
            '.de-send:disabled{opacity:.6;cursor:default}',
            '.de-shake{animation:de-shake .35s}',
            '@keyframes de-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}'
        ].join('');
        document.head.appendChild(css);
    }

    window.KSLT_DOUBLES = { открыть: открыть };
})();
