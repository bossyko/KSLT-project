/**
 * Возврат учётной записи, помеченной на удаление.
 *
 * Человек попросил удалить аккаунт, а через неделю передумал и вошёл.
 * Пока не вышли 30 дней, всё на месте — надо только спросить, оставить
 * или довести удаление до конца. Без этого окна он видел бы пустой
 * кабинет и решил, что данные уже стёрты.
 *
 * Модуль сам ничего не грузит, пока нет входа: для гостя это лишний
 * запрос на каждой странице.
 */
(function () {
    'use strict';

    var GRACE_DAYS = 30;

    var TEXT = {
        ru: {
            title: 'Аккаунт помечен на удаление',
            body: 'Вы просили удалить учётную запись. Она будет удалена насовсем {date} — до этого дня всё можно вернуть.',
            keep: 'Оставить аккаунт',
            leave: 'Всё равно удалить',
            done: 'Аккаунт восстановлен',
            fail: 'Не получилось вернуть аккаунт. Попробуйте ещё раз или напишите нам.'
        },
        en: {
            title: 'Account scheduled for deletion',
            body: 'You asked to delete your account. It will be erased for good on {date} — until then everything can be restored.',
            keep: 'Keep my account',
            leave: 'Delete anyway',
            done: 'Account restored',
            fail: 'Could not restore the account. Please try again or write to us.'
        },
        kg: {
            title: 'Аккаунт өчүрүүгө белгиленген',
            body: 'Сиз аккаунтуңузду өчүрүүнү сурадыңыз. Ал {date} биротоло өчүрүлөт — ага чейин баарын кайтарууга болот.',
            keep: 'Аккаунтту калтыруу',
            leave: 'Баары бир өчүрүү',
            done: 'Аккаунт калыбына келтирилди',
            fail: 'Аккаунтту кайтаруу мүмкүн болгон жок. Кайра аракет кылыңыз же бизге жазыңыз.'
        }
    };

    function lang() {
        var p = window.location.pathname;
        if (p.indexOf('-en') !== -1) return 'en';
        if (p.indexOf('-kg') !== -1) return 'kg';
        return 'ru';
    }

    function locale() {
        var l = lang();
        return l === 'en' ? 'en-US' : 'ru-RU';
    }

    /** Дата, когда учётная запись исчезнет насовсем. */
    function purgeDate(deletedAt) {
        var d = new Date(deletedAt);
        d.setDate(d.getDate() + GRACE_DAYS);
        return d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function render(L, deletedAt, onKeep, onLeave) {
        var overlay = document.createElement('div');
        overlay.className = 'ar-overlay';
        overlay.innerHTML =
            '<div class="ar-box" role="dialog" aria-modal="true">' +
                '<h3 class="ar-title">' + L.title + '</h3>' +
                '<p class="ar-text">' + L.body.replace('{date}', purgeDate(deletedAt)) + '</p>' +
                '<div class="ar-actions">' +
                    '<button class="ar-btn ar-btn-ghost" id="arLeave">' + L.leave + '</button>' +
                    '<button class="ar-btn ar-btn-primary" id="arKeep">' + L.keep + '</button>' +
                '</div>' +
                '<p class="ar-note" id="arNote"></p>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.querySelector('#arKeep').addEventListener('click', function () { onKeep(overlay); });
        overlay.querySelector('#arLeave').addEventListener('click', function () { onLeave(overlay); });
        return overlay;
    }

    async function check() {
        var client = window.supabaseClient;
        if (!client) return;

        var session = await client.auth.getSession();
        if (!session.data || !session.data.session) return;

        var userId = session.data.session.user.id;
        var res = await client.from('profiles').select('deleted_at').eq('id', userId).maybeSingle();
        if (res.error || !res.data || !res.data.deleted_at) return;

        var L = TEXT[lang()];
        render(L, res.data.deleted_at,
            async function keep(overlay) {
                var note = overlay.querySelector('#arNote');
                var btn = overlay.querySelector('#arKeep');
                btn.disabled = true;
                var r = await client.functions.invoke('delete-account', { body: { action: 'restore' } });
                if (r.error) {
                    btn.disabled = false;
                    note.textContent = L.fail;
                    return;
                }
                note.textContent = L.done;
                setTimeout(function () { window.location.reload(); }, 900);
            },
            // Передумал возвращаться — просто выходим. Метка остаётся, срок
            // идёт своим чередом, удаление доведёт до конца ежедневная уборка
            async function leave(overlay) {
                overlay.remove();
                await client.auth.signOut();
                window.location.reload();
            }
        );
    }

    window.KSLT_ACCOUNT_RESTORE = { check: check, graceDays: GRACE_DAYS };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { check(); });
    } else {
        check();
    }
})();
