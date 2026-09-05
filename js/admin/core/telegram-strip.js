// ============================================
// KSLT Admin — своя привязка к Телеграму
// ============================================
//
// Персонал получает через бота то, что нельзя ждать у экрана: спорные счета,
// предложения новостей, заявки на турнир. Но привязку нельзя сделать за
// человека — так устроен Телеграм: связь возникает в тот миг, когда он сам
// нажимает «Старт» у бота по своей ссылке.
//
// Кнопка для этого есть в личном кабинете, вот только персонал туда не
// заходит: после входа админа и менеджера уносит прямо в панель, и о
// привязке новый менеджер попросту не узнает. Молча не получал бы ничего.
//
// Поэтому полоска висит здесь, наверху панели, и пропадает сама, как только
// привязка появилась.

(function() {
    'use strict';

    var A = window.KSLT_ADMIN = window.KSLT_ADMIN || {};

    var БОТ = window.KSLT_TG_BOT || 'KSLTennisBot';

    A.renderTelegramStrip = async function() {
        if (!A.client || !A.currentUserId) return;

        var стар = document.getElementById('adTgStrip');
        if (стар) стар.remove();

        var res = await A.client
            .from('profiles')
            .select('telegram_chat_id')
            .eq('id', A.currentUserId)
            .single();

        // Ошибку глотаем молча: полоска — подсказка, а не работа панели
        if (res.error) return;
        if (res.data && res.data.telegram_chat_id) return;

        var место = document.querySelector('.ad-content');
        if (!место) return;

        var полоса = document.createElement('div');
        полоса.id = 'adTgStrip';
        полоса.className = 'ad-alert-warning';
        полоса.style.cssText = 'display:flex;align-items:center;gap:12px;' +
            'flex-wrap:wrap;margin-bottom:12px;';
        полоса.innerHTML =
            '<span style="flex:1;min-width:220px;">' +
                'Уведомления в Телеграм не подключены. Сюда приходят спорные счета, ' +
                'заявки на турнир и предложения новостей — без привязки они не дойдут.' +
            '</span>' +
            '<a class="ad-btn ad-btn-primary" style="white-space:nowrap;text-decoration:none;" ' +
               'href="https://t.me/' + БОТ + '?start=' + A.currentUserId + '" ' +
               'target="_blank" rel="noopener">Подключить</a>' +
            '<button type="button" class="ad-btn" id="adTgStripCheck" ' +
                'style="white-space:nowrap;">Проверить</button>';

        место.insertBefore(полоса, место.firstChild);

        // Привязка происходит в другом окне, и сама панель об этом не узнает.
        // Кнопка «Проверить» спрашивает заново — не заставлять же перезагружать
        // страницу ради одного поля.
        var кнопка = document.getElementById('adTgStripCheck');
        if (кнопка) {
            кнопка.addEventListener('click', async function() {
                кнопка.disabled = true;
                кнопка.textContent = 'Проверяю…';
                await A.renderTelegramStrip();
                // Полоска осталась — значит привязки всё ещё нет
                var осталась = document.getElementById('adTgStrip');
                if (осталась) A.showToast('Привязка пока не видна. Нажмите «Старт» у бота.', 'warning');
                else A.showToast('Телеграм подключён', 'success');
            });
        }
    };
})();
