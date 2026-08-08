// ============================================
// KSLT — Подача заявки на турнир
// Общий модуль для всех точек входа: карточка турнира, страница турнира.
//
// Решение о допуске принимает Edge Function tournament-register:
// клиент не выбирает себе статус и не может подвинуть чужую заявку.
// ============================================

(function() {
    'use strict';

    // ---- Стили модалки (те же классы, что у остальных модалок сайта) ----
    function injectStyles() {
        if (document.getElementById('kslt-reg-modal-styles')) return;
        var style = document.createElement('style');
        style.id = 'kslt-reg-modal-styles';
        style.textContent =
            '.trn-register-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s ease}' +
            '.trn-register-modal-overlay.active{opacity:1}' +
            '.trn-register-modal{background:var(--bg-card,#1a1a1a);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:40px 32px;max-width:420px;width:90%;text-align:center;position:relative;transform:scale(0.95);transition:transform .2s ease}' +
            '.trn-register-modal-overlay.active .trn-register-modal{transform:scale(1)}' +
            '.trn-register-modal-close{position:absolute;top:12px;right:16px;background:none;border:none;color:var(--text-muted,#888);font-size:1.5rem;cursor:pointer;padding:4px 8px;line-height:1}' +
            '.trn-register-modal-close:hover{color:var(--text-primary,#fff)}' +
            '.trn-register-modal-icon{margin-bottom:16px;font-size:2.4rem;line-height:1}' +
            '.trn-register-modal-title{font-size:1.3rem;font-weight:600;color:var(--text-primary,#fff);margin:0 0 12px}' +
            '.trn-register-modal-text{font-size:0.95rem;color:var(--text-muted,#888);max-width:340px;margin:0 auto;line-height:1.5}' +
            '.trn-register-modal-note{margin:18px auto 0;max-width:340px;padding:10px 14px;border-radius:8px;background:rgba(204,255,0,0.07);border:1px solid rgba(204,255,0,0.2);color:var(--text-secondary,#aaa);font-size:0.85rem;line-height:1.45}' +
            '.trn-register-modal-btn{display:inline-block;margin-top:24px;padding:12px 32px;border:none;border-radius:8px;font-weight:600;cursor:pointer;background:var(--accent,#CCFF00);color:#000;transition:opacity .2s}' +
            '.trn-register-modal-btn:hover{opacity:0.9}' +
            '.trn-register-modal-btn.is-error{background:#ff3b30;color:#fff}' +
            '.trn-register-modal-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}' +
            '.trn-register-modal-actions .trn-register-modal-btn{margin-top:24px}' +
            '.trn-register-modal-btn.is-ghost{background:transparent;border:1px solid var(--border,#2a2a2a);color:var(--text-muted,#888)}' +
            '.trn-register-modal-btn.is-ghost:hover{color:var(--text-primary,#fff);border-color:var(--text-muted,#888);opacity:1}';
        document.head.appendChild(style);
    }

    /**
     * Отправляет заявку на турнир.
     * @param {any} client Supabase client
     * @param {string} tournamentId
     * @param {Object} [extra] Партнёр для парных: partner_id или partner_external_*
     * @returns {Promise<{ok:boolean, data:Object}>}
     */
    async function callRegister(client, tournamentId, extra) {
        try {
            var session = await client.auth.getSession();
            var token = session.data.session ? session.data.session.access_token : '';
            var payload = { tournament_id: tournamentId };
            if (extra) {
                for (var k in extra) {
                    if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') payload[k] = extra[k];
                }
            }
            var res = await fetch(SUPABASE_URL + '/functions/v1/tournament-register', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            var data = await res.json();
            return { ok: res.ok, data: data };
        } catch (e) {
            return { ok: false, data: { error: e.message } };
        }
    }

    /**
     * Человеческий текст по ответу функции.
     * @returns {{title:string, text:string, note:string, tone:string, short:string}}
     */
    function resultText(data, isEn, isKg) {
        function pick(en, kg, ru) { return isEn ? en : (isKg ? kg : ru); }

        var errors = {
            already_registered: pick('You have already applied for this tournament',
                'Сиз бул мелдешке буга чейин арыз бергенсиз',
                'Вы уже подавали заявку на этот турнир'),
            no_player: pick('Your account is not linked to a player profile',
                'Аккаунтуңуз оюнчу картасына байланган эмес',
                'Ваш аккаунт не связан с карточкой игрока'),
            no_membership: pick('Active KSLT membership required',
                'KSLT активдүү мүчөлүгү талап кылынат',
                'Требуется активное членство KSLT'),
            not_paid: pick('Please pay your membership first',
                'Адегенде мүчөлүк төлөмүн төлөңүз',
                'Сначала оплатите членство'),
            banned: pick('Your account is temporarily blocked',
                'Аккаунтуңуз убактылуу бөгөттөлгөн',
                'Ваш аккаунт временно заблокирован'),
            registration_closed: pick('Registration for this tournament is closed',
                'Бул мелдешке каттоо жабык',
                'Регистрация на этот турнир закрыта'),
            gender_mismatch: pick('This tournament is for another gender category',
                'Бул мелдеш башка жыныс категориясы үчүн',
                'Этот турнир для другой гендерной категории'),
            ntrp_too_low: pick('Your NTRP is below the tournament minimum',
                'NTRP көрсөткүчүңүз мелдештин минимумунан төмөн',
                'Ваш NTRP ниже минимального для турнира'),
            ntrp_too_high: pick('Your NTRP is above the tournament maximum',
                'NTRP көрсөткүчүңүз мелдештин максимумунан жогору',
                'Ваш NTRP выше максимального для турнира'),
            ntrp_combined_exceeded: pick('Combined NTRP of the pair exceeds the tournament limit',
                'Жуптун жалпы NTRP көрсөткүчү чектен ашты',
                'Суммарный NTRP пары превышает лимит турнира')
        };

        // Заявка уже подана — показываем её текущий статус, а не общий отказ
        if (data && data.error === 'already_registered') {
            var statusText = {
                approved: pick('You are in the main draw.', 'Сиз негизги сеткадасыз.', 'Вы в основной сетке.'),
                draw: pick('You are in the main draw, the draw has been made.',
                    'Сиз негизги сеткадасыз, жеребьёвка өттү.',
                    'Вы в основной сетке, жеребьёвка проведена.'),
                pending: pick('The application is awaiting a decision.',
                    'Арыз чечимди күтүүдө.', 'Заявка ожидает решения администратора.'),
                waitlist: pick('You are on the waiting list.',
                    'Сиз күтүү тизмесиндесиз.', 'Вы в листе ожидания.'),
                rejected: pick('The application was rejected by the administrator.',
                    'Арызды администратор четке какты.', 'Заявка отклонена администратором.'),
                withdrawn: pick('The application was withdrawn.',
                    'Арыз кайтарылып алынган.', 'Заявка была отозвана.'),
                blocked: pick('The application did not pass the entry rules.',
                    'Арыз катышуу эрежелеринен өткөн жок.', 'Заявка не прошла правила допуска.')
            };
            var shortByStatus = {
                approved: pick('In the main draw', 'Негизги сеткада', 'В основной сетке'),
                draw: pick('In the main draw', 'Негизги сеткада', 'В основной сетке'),
                pending: pick('Under review', 'Каралууда', 'На рассмотрении'),
                waitlist: pick('On the waiting list', 'Күтүү тизмесинде', 'В листе ожидания'),
                rejected: pick('Rejected', 'Четке кагылган', 'Отклонена'),
                withdrawn: pick('Withdrawn', 'Кайтарылган', 'Отозвана'),
                blocked: pick('Not accepted', 'Кабыл алынган жок', 'Не принята')
            };
            var isBad = data.status === 'rejected' || data.status === 'blocked';
            return {
                tone: isBad ? 'error' : 'success',
                icon: isBad ? '⛔' : '📋',
                title: pick('You have already applied', 'Сиз буга чейин арыз бергенсиз', 'Вы уже подали заявку'),
                text: statusText[data.status] || pick('Status: ', 'Абалы: ', 'Статус: ') + (data.status || ''),
                note: '',
                short: shortByStatus[data.status] || pick('Applied', 'Арыз берилген', 'Заявка подана')
            };
        }

        if (data && data.error) {
            return {
                tone: 'error', icon: '⛔',
                title: pick('Application not accepted', 'Арыз кабыл алынган жок', 'Заявка не принята'),
                text: errors[data.error] || data.error,
                note: '',
                short: pick('Not accepted', 'Кабыл алынган жок', 'Не принята')
            };
        }

        var status = data && data.status;

        if (status === 'approved') {
            // Игрока нижней категории честно предупреждаем: место не закреплено
            var note = (data.reason === 'top_rank')
                ? pick('Your spot is not locked in: if a player of the tournament category applies, you may be moved to the waiting list.',
                    'Орун бекитилген эмес: мелдеш категориясындагы оюнчу арыз берсе, сиз күтүү тизмесине өтүшүңүз мүмкүн.',
                    'Место не закреплено: если заявку подаст игрок категории турнира, вы можете быть перемещены в лист ожидания.')
                : '';
            return {
                tone: 'success', icon: '✅',
                title: pick('Application accepted', 'Арыз кабыл алынды', 'Заявка принята'),
                text: pick('You are in the main draw.', 'Сиз негизги сеткадасыз.', 'Вы в основной сетке.'),
                note: note,
                short: pick('In the main draw', 'Негизги сеткада', 'В основной сетке')
            };
        }

        if (status === 'waitlist') {
            var reasons = {
                no_category: pick('Your category is not assigned yet, so the application needs a review.',
                    'Категорияңыз дайындала элек, ошондуктан арыз каралат.',
                    'Вам ещё не присвоена категория, поэтому заявка требует рассмотрения.'),
                rank_waitlist: pick('You are ranked 11-20 in your category — the application needs approval.',
                    'Категорияңызда 11-20 орундасыз — арыз бекитүүнү талап кылат.',
                    'Вы занимаете с 11 по 20 место в своей категории — заявка требует одобрения.'),
                draw_full: pick('The main draw is full.', 'Негизги сетка толук.', 'Основная сетка заполнена.')
            };
            return {
                tone: 'success', icon: '⏳',
                title: pick('Application accepted — under review', 'Арыз кабыл алынды — каралууда', 'Заявка принята — на рассмотрении'),
                text: reasons[data.reason] || pick('The administrator will make a decision.',
                    'Чечимди администратор кабыл алат.', 'Решение примет администратор.'),
                note: '',
                short: pick('Under review', 'Каралууда', 'На рассмотрении')
            };
        }

        return {
            tone: 'error', icon: '⛔',
            title: pick('Application not accepted', 'Арыз кабыл алынган жок', 'Заявка не принята'),
            text: (data && data.block_reason) || pick('You do not meet the tournament entry rules.',
                'Сиз мелдешке катышуу эрежелерине туура келбейсиз.',
                'Вы не проходите по правилам допуска на турнир.'),
            note: '',
            short: pick('Not accepted', 'Кабыл алынган жок', 'Не принята')
        };
    }

    /** Показывает модалку с результатом подачи заявки. */
    function showModal(info, isEn, isKg) {
        injectStyles();

        var old = document.querySelector('.trn-register-modal-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'trn-register-modal-overlay';
        overlay.innerHTML =
            '<div class="trn-register-modal">' +
                '<button class="trn-register-modal-close">&times;</button>' +
                '<div class="trn-register-modal-icon">' + info.icon + '</div>' +
                '<h3 class="trn-register-modal-title">' + info.title + '</h3>' +
                '<p class="trn-register-modal-text">' + info.text + '</p>' +
                (info.note ? '<div class="trn-register-modal-note">' + info.note + '</div>' : '') +
                '<button class="trn-register-modal-btn' + (info.tone === 'error' ? ' is-error' : '') + '">' +
                    (isEn ? 'Got it' : (isKg ? 'Түшүндүм' : 'Понятно')) +
                '</button>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('active'); });

        function close() {
            overlay.classList.remove('active');
            setTimeout(function() { overlay.remove(); }, 200);
        }
        overlay.querySelector('.trn-register-modal-close').addEventListener('click', close);
        overlay.querySelector('.trn-register-modal-btn').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    }

    /**
     * Подаёт заявку и показывает результат. Используется и карточкой, и страницей турнира.
     * @returns {Promise<Object>} info из resultText — вызывающий код может обновить кнопку
     */
    async function submit(client, tournamentId, opts) {
        opts = opts || {};
        var isEn = !!opts.isEn;
        var isKg = !!opts.isKg;
        var reg = await callRegister(client, tournamentId, opts.extra);
        var info = resultText(reg.data, isEn, isKg);
        showModal(info, isEn, isKg);
        info.created = !(reg.data && reg.data.error && reg.data.error !== 'already_registered');
        return info;
    }

    /**
     * Подтверждение в том же оформлении, что и остальные модалки страницы.
     * Нативный confirm() выбивается из дизайна и на разных браузерах выглядит
     * по-своему.
     * @returns {Promise<boolean>}
     */
    function confirmModal(opts) {
        injectStyles();

        var old = document.querySelector('.trn-register-modal-overlay');
        if (old) old.remove();

        return new Promise(function(resolve) {
            var overlay = document.createElement('div');
            overlay.className = 'trn-register-modal-overlay';
            overlay.innerHTML =
                '<div class="trn-register-modal">' +
                    '<button class="trn-register-modal-close">&times;</button>' +
                    (opts.icon ? '<div class="trn-register-modal-icon">' + opts.icon + '</div>' : '') +
                    '<h3 class="trn-register-modal-title">' + opts.title + '</h3>' +
                    (opts.text ? '<p class="trn-register-modal-text">' + opts.text + '</p>' : '') +
                    '<div class="trn-register-modal-actions">' +
                        '<button class="trn-register-modal-btn is-ghost" data-no>' + opts.cancelText + '</button>' +
                        '<button class="trn-register-modal-btn' + (opts.tone === 'error' ? ' is-error' : '') + '" data-yes>' + opts.okText + '</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            requestAnimationFrame(function() { overlay.classList.add('active'); });

            var answered = false;
            function close(answer) {
                if (answered) return;
                answered = true;
                overlay.classList.remove('active');
                setTimeout(function() { overlay.remove(); }, 200);
                resolve(answer);
            }
            overlay.querySelector('.trn-register-modal-close').addEventListener('click', function() { close(false); });
            overlay.querySelector('[data-no]').addEventListener('click', function() { close(false); });
            overlay.querySelector('[data-yes]').addEventListener('click', function() { close(true); });
            overlay.addEventListener('click', function(e) { if (e.target === overlay) close(false); });
        });
    }

    /** Короткое сообщение в том же оформлении — вместо alert() */
    function noticeModal(opts, isEn, isKg) {
        showModal({
            icon: opts.icon || '',
            title: opts.title,
            text: opts.text || '',
            note: '',
            tone: opts.tone || ''
        }, isEn, isKg);
    }

    /**
     * Помечает карточки турниров, куда игрок уже подал заявку: кнопка гаснет
     * и подписывается статусом. Раньше она оставалась активной, и человек
     * узнавал о своей заявке только по модалке после нажатия.
     */
    async function markRegistered(client) {
        var btns = Array.prototype.slice.call(document.querySelectorAll('.tournament-card[data-id] .btn-register'));
        if (btns.length === 0 || !client) return;

        var isEn = location.pathname.indexOf('-en') !== -1;
        var isKg = location.pathname.indexOf('-kg') !== -1;

        try {
            var session = await client.auth.getSession();
            if (!session.data.session) return;

            var prof = await client.from('profiles')
                .select('player_id').eq('id', session.data.session.user.id).single();
            var playerId = prof.data && prof.data.player_id;
            if (!playerId) return;

            var ids = [];
            btns.forEach(function(b) {
                var card = b.closest('.tournament-card');
                var id = card && card.dataset ? card.dataset.id : null;
                if (id && ids.indexOf(id) === -1) ids.push(id);
            });
            if (ids.length === 0) return;

            var regs = await client.from('tournament_registrations')
                .select('tournament_id, status')
                .eq('player_id', playerId)
                .in('tournament_id', ids);

            var byTournament = {};
            (regs.data || []).forEach(function(r) {
                // Снятую заявку не показываем: игрок вправе записаться снова
                if (r.status !== 'withdrawn') byTournament[r.tournament_id] = r.status;
            });

            var labels = {
                approved: isEn ? 'You are entered' : (isKg ? 'Сиз катталдыңыз' : 'Вы записаны'),
                pending: isEn ? 'Entry sent' : (isKg ? 'Арыз жөнөтүлдү' : 'Заявка подана'),
                draw: isEn ? 'You are entered' : (isKg ? 'Сиз катталдыңыз' : 'Вы записаны'),
                waitlist: isEn ? 'On the waiting list' : (isKg ? 'Күтүү тизмесинде' : 'В листе ожидания'),
                rejected: isEn ? 'Entry declined' : (isKg ? 'Арыз четке кагылды' : 'Заявка отклонена'),
                blocked: isEn ? 'Not admitted' : (isKg ? 'Уруксат жок' : 'Не допущен')
            };

            btns.forEach(function(btn) {
                var card = btn.closest('.tournament-card');
                var status = card && byTournament[card.dataset.id];
                if (!status) return;
                btn.disabled = true;
                btn.classList.add('is-registered');
                btn.textContent = labels[status] || labels.approved;
            });
        } catch (e) {
            console.warn('[KSLT] mark registered:', e.message);
        }
    }

    window.KSLT_REG = {
        call: callRegister,
        markRegistered: markRegistered,
        resultText: resultText,
        showModal: showModal,
        confirm: confirmModal,
        notice: noticeModal,
        submit: submit
    };
})();
