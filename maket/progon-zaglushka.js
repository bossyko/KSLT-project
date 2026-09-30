/**
 * ПРОГОН ЦЕПОЧКИ ЭТАПОВ — стенд с ПИШУЩЕЙ заглушкой базы.
 *
 * Зачем он есть. Стенд `setka-zamer.html` умеет только ЧИТАТЬ: его заглушка
 * на любую запись отвечает «базы нет», поэтому жеребьёвку на нём не запустить.
 * А вопрос Кости — про то, что происходит МЕЖДУ этапами: отражён ли групповой
 * этап целиком прежде, чем появятся доп. матчи, и не встанет ли кто-то в сетку
 * дважды. Это проверяется только настоящим прогоном настоящих функций.
 *
 * ЗАГЛУШКА ПАДАЕТ, А НЕ УГАДЫВАЕТ. Реализованы ровно те формы запроса, которые
 * померены на этом пути (`bracket.js`: generateGroupDraw, создатьПустойПлейофф,
 * заполнитьСлоты, пересчитатьСоставСетки, assignGroupSchedule, проставитьЗаявки).
 * Любой другой метод цепочки роняет прогон с именем метода. Врущий свидетель
 * хуже отсутствующего: если заглушка начнёт додумывать, прогон будет проверять
 * мою выдумку, а не продукт.
 *
 * ЖРЕБИЙ ЗАСЕЯН. `Math.random` подменён на счётный генератор: падение можно
 * повторить тем же номером расклада, а не ловить раз в сто прогонов.
 */
(function () {
    'use strict';
    var A = window.KSLT_ADMIN;

    // ---- Счётный жребий: одно и то же зерно даёт одну и ту же жеребьёвку ----
    var зерно = 1;
    function засеять(н) { зерно = (н >>> 0) || 1; }
    Math.random = function () {
        зерно = (зерно * 1103515245 + 12345) >>> 0;
        return (зерно >>> 8) / 16777216;
    };

    // ---- База в памяти ----
    var Б = { tournaments: [], tournament_registrations: [], matches: [], players: [] };
    var следID = 1;
    function ид(п) { return п + '-' + (следID++); }

    function подходит(строка, ф) {
        for (var i = 0; i < ф.length; i++) {
            var к = ф[i], з = строка[к.поле];
            if (к.вид === 'eq'  && !(з == к.знач)) return false;
            if (к.вид === 'neq' && (z(з) === z(к.знач))) return false;
            if (к.вид === 'is'  && !(к.знач === null ? (з === null || з === undefined) : з === к.знач)) return false;
            if (к.вид === 'gt'  && !(Number(з) > Number(к.знач))) return false;
            if (к.вид === 'in'  && к.знач.indexOf(з) === -1) return false;
        }
        return true;
        function z(v) { return v === undefined ? null : v; }
    }

    function Запрос(таблица) {
        this.таблица = таблица;
        this.ф = [];
        this.порядок = [];
        this.предел = 0;
        this.толькоСчёт = false;
    }
    Запрос.prototype.select = function (_поля, опции) {
        if (опции && опции.head) this.толькоСчёт = true;
        return этот(this);
    };
    Запрос.prototype.eq  = function (п, з) { this.ф.push({ вид: 'eq',  поле: п, знач: з }); return этот(this); };
    Запрос.prototype.neq = function (п, з) { this.ф.push({ вид: 'neq', поле: п, знач: з }); return этот(this); };
    Запрос.prototype.is  = function (п, з) { this.ф.push({ вид: 'is',  поле: п, знач: з }); return этот(this); };
    Запрос.prototype.gt  = function (п, з) { this.ф.push({ вид: 'gt',  поле: п, знач: з }); return этот(this); };
    Запрос.prototype.in  = function (п, з) { this.ф.push({ вид: 'in',  поле: п, знач: з || [] }); return этот(this); };
    Запрос.prototype.order = function (п) { this.порядок.push(п); return этот(this); };
    Запрос.prototype.limit = function (н) { this.предел = н; return этот(this); };

    Запрос.prototype.строки = function () {
        var р = Б[this.таблица] || [];
        var ф = this.ф;
        var итог = р.filter(function (с) { return подходит(с, ф); });
        var пор = this.порядок;
        if (пор.length) {
            итог = итог.slice().sort(function (a, b) {
                for (var i = 0; i < пор.length; i++) {
                    var x = a[пор[i]], y = b[пор[i]];
                    if (x === null || x === undefined) x = -Infinity;
                    if (y === null || y === undefined) y = -Infinity;
                    if (x < y) return -1;
                    if (x > y) return 1;
                }
                return 0;
            });
        }
        if (this.предел) итог = итог.slice(0, this.предел);
        return итог;
    };
    Запрос.prototype.then = function (ф, о) {
        var с = this.строки();
        return Promise.resolve({
            data: this.толькоСчёт ? null : с.map(копия),
            error: null, count: с.length
        }).then(ф, о);
    };
    Запрос.prototype.single = function () {
        var с = this.строки();
        return Promise.resolve(с.length
            ? { data: копия(с[0]), error: null }
            : { data: null, error: { message: 'строки нет' } });
    };
    Запрос.prototype.maybeSingle = function () {
        var с = this.строки();
        return Promise.resolve({ data: с.length ? копия(с[0]) : null, error: null });
    };
    Запрос.prototype.insert = function (что) {
        var это = this;
        var массив = Array.isArray(что) ? что : [что];
        var вставлено = массив.map(function (з) {
            var с = копия(з);
            if (!с.id) с.id = ид(это.таблица);
            Б[это.таблица].push(с);
            return копия(с);
        });
        return обёртка(Promise.resolve({ data: вставлено, error: null }));
    };
    Запрос.prototype.update = function (чем) {
        var это = this;
        this.чем = чем;
        var применить = function () {
            это.строки().forEach(function (сн) {
                var живая = Б[это.таблица].find(function (x) { return x.id === сн.id; });
                if (живая) Object.keys(чем).forEach(function (к) { живая[к] = чем[к]; });
            });
            return { data: null, error: null };
        };
        var отдать = {
            eq:  function (п, з) { это.ф.push({ вид: 'eq',  поле: п, знач: з }); return обёртка(Promise.resolve(применить())); },
            in:  function (п, з) { это.ф.push({ вид: 'in',  поле: п, знач: з }); return обёртка(Promise.resolve(применить())); },
            neq: function (п, з) { это.ф.push({ вид: 'neq', поле: п, знач: з }); return обёртка(Promise.resolve(применить())); },
            is:  function (п, з) { это.ф.push({ вид: 'is',  поле: п, знач: з }); return обёртка(Promise.resolve(применить())); },
            then: function (f, o) { return Promise.resolve(применить()).then(f, o); }
        };
        return обёртка(отдать);
    };
    Запрос.prototype.delete = function () {
        var это = this;
        var применить = function () {
            var убрать = это.строки().map(function (с) { return с.id; });
            Б[это.таблица] = Б[это.таблица].filter(function (с) { return убрать.indexOf(с.id) === -1; });
            return { data: null, error: null };
        };
        return обёртка({
            eq: function (п, з) { это.ф.push({ вид: 'eq', поле: п, знач: з }); return обёртка(Promise.resolve(применить())); },
            in: function (п, з) { это.ф.push({ вид: 'in', поле: п, знач: з }); return обёртка(Promise.resolve(применить())); },
            then: function (f, o) { return Promise.resolve(применить()).then(f, o); }
        });
    };

    function копия(о) { return JSON.parse(JSON.stringify(о)); }

    /* СТОРОЖ ЗАГЛУШКИ. Всё, чего заглушка не умеет, роняет прогон с именем
       метода — а не возвращает «ничего» и не притворяется, что запрос прошёл. */
    function обёртка(о) {
        /* ОБЕЩАНИЕ НЕ ОБОРАЧИВАЕМ. `Promise.prototype.then` требует, чтобы
           получателем был сам Promise, а через Proxy получателем становится
           обёртка — и движок отказывается. Сторож нужен цепочке запроса, а
           готовый ответ в нём не нуждается. */
        if (о && typeof о.then === 'function' && о instanceof Promise) return о;
        return new Proxy(о, {
            get: function (ц, св) {
                if (typeof св === 'symbol') return ц[св];
                if (св in ц) return ц[св];
                throw new Error('ПРОГОН: заглушка базы не умеет .' + String(св) + '() — форма запроса не померена');
            }
        });
    }
    function этот(з) { return обёртка(з); }

    A.client = {
        from: function (таблица) {
            if (!Б[таблица]) Б[таблица] = [];
            return обёртка(new Запрос(таблица));
        },
        rpc: function (имя) {
            throw new Error('ПРОГОН: rpc(' + имя + ') на прогоне не предусмотрен');
        },
        auth: { getSession: function () { return Promise.resolve({ data: { session: null } }); } }
    };
    A.currentRole = 'admin';
    A.currentUserId = 'progon';
    A.showToast = function (т, вид) { (A.прогонСообщения = A.прогонСообщения || []).push((вид || 'info') + ': ' + т); };
    A.showConfirm = function (_т, _п, дальше) { return дальше && дальше(); };

    window.ПРОГОН = { Б: Б, засеять: засеять, копия: копия };
})();
