/**
 * ВОЗВРАТ УДАЛЁННОЙ УЧЁТНОЙ ЗАПИСИ — ОДИН ДОМ (шаг A3.7в, 29.10).
 *
 * ЧТО СВЕДЕНО. Два: проверка метки удаления и САМ ЗОВ функции возврата.
 *
 * ЗОВ РАСХОДИЛСЯ ОПАСНО. Сайт звал
 * `client.functions.invoke('delete-account', { body: { action: 'restore' } })`,
 * приложение собирало `fetch` руками — свой адрес, свой `Authorization`,
 * свой `apikey`, свой разбор ответа. Одно понятие — «вернуть учётную
 * запись» — два способа вызова: поменяется формат заголовков, и один
 * продукт замолчит, а срок будет идти.
 *
 * ПОЧЕМУ ДОМ ЗОВЁТ ЧЕРЕЗ `invoke`, А НЕ ЧЕРЕЗ `fetch`. Замер 29.10:
 * во всём продукте `functions.invoke` стоит ОДИН раз, а `fetch` руками —
 * 47 (35 на сайте, 12 в приложении). То есть большинство — за `fetch`.
 * Но `invoke` сам ставит заголовки и сам разбирает ответ: это РОВНО то
 * место, где приложение расходилось. Дом зовёт `invoke`, когда клиент
 * его умеет, и откатывается на `fetch` — так оба продукта зовут
 * одинаково, а 46 остальных мест остаются своей отдельной работой и
 * записаны в трекер числом.
 *
 * Чего в доме НЕТ: разметка окна и тексты. У сайта окно с `role=dialog`
 * и оснасткой фокуса (кусок 156), у приложения своя накладка с классом
 * `open` и таймером появления — это строение окна продукта.
 *
 * Правка правится В ДВУХ МЕСТАХ: побайтовая копия в `mobile/www/js/`.
 */
(function (global) {
    'use strict';

    var API = global.KSLT_VOZVRAT = {};

    /** Помечена ли учётная запись на удаление: отдаёт метку или null. */
    API.метка = function (client) {
        if (!client) return Promise.resolve(null);
        return client.auth.getSession().then(function (сессия) {
            var с = сессия && сессия.data && сессия.data.session;
            if (!с) return null;
            return client.from('profiles')
                .select('deleted_at')
                .eq('id', с.user.id)
                .maybeSingle()
                .then(function (r) {
                    if (r.error || !r.data) return null;
                    return r.data.deleted_at || null;
                });
        });
    };

    /**
     * ВЕРНУТЬ УЧЁТНУЮ ЗАПИСЬ.
     *
     * Отдаёт `{ ок: true }` либо `{ ок: false, беда: '<текст>' }` —
     * продукт сам решает, что показать человеку.
     */
    API.вернуть = function (client) {
        if (!client) return Promise.resolve({ ок: false, беда: 'нет клиента' });

        if (client.functions && client.functions.invoke) {
            return client.functions
                .invoke('delete-account', { body: { action: 'restore' } })
                .then(function (r) {
                    if (r && r.error) {
                        return { ок: false, беда: r.error.message || String(r.error) };
                    }
                    if (r && r.data && r.data.error) {
                        return { ок: false, беда: String(r.data.error) };
                    }
                    return { ок: true };
                })
                .catch(function (e) {
                    return { ок: false, беда: e && e.message ? e.message : String(e) };
                });
        }

        /* ОТКАТ НА ЗОВ ЧЕРЕЗ ДОМ — для клиента без `functions`. Адрес,
           ключ, заголовки и разбор ответа живут в `js/kslt-zov.js`: до
           30.10 они стояли здесь своей копией, и слепой `r.json()`
           ронял разбор, когда функция падала на сервере, — а это ВОЗВРАТ
           УЧЁТНОЙ ЗАПИСИ, где человеку нужно знать точно. */
        var З = global.KSLT_ZOV;
        if (!З) {
            return Promise.resolve({ ок: false, беда: 'нет дома зова' });
        }
        if (!(global.SUPABASE_URL && global.SUPABASE_ANON_KEY)) {
            return Promise.resolve({ ок: false, беда: 'нет адреса базы' });
        }
        return З.отИмени(client, 'delete-account', { action: 'restore' })
          .then(function (data) {
              if (data && data.error) return { ок: false, беда: String(data.error) };
              return { ок: true };
          })
          .catch(function (e) {
              return { ок: false, беда: e && e.message ? e.message : String(e) };
          });
    };

})(typeof window !== 'undefined' ? window : this);
