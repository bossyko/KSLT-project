/* ═══ МАСКА JS: комментарии, строки И РЕГУЛЯРНЫЕ ЛИТЕРАЛЫ → пробелы ══════
   Маска, не знающая регулярок, слепнет на `.replace(/"/g, …)`: кавычка
   внутри регулярки открывает мнимую строку, и дальше прибор читает небо.
   Поймано 22.10 на куске 118 — 376 тернарников из шести файлов были
   невидимы, и прибор доложил «ноль».
   Границы и переводы строк сохраняются знак в знак. */
const ПОСЛЕ_ЧЕГО_РЕГУЛЯРКА = /[({\[,;:=!&|?+\-*%^~<>]$/;
const СЛОВА_ПЕРЕД = /\b(return|typeof|instanceof|in|of|new|delete|void|case|do|else|yield|await)$/;

function маска(t) {
    let o = '', i = 0; const n = t.length;
    const предыдущийЗнак = () => { let j = o.length - 1; while (j >= 0 && /\s/.test(o[j])) j--; return j >= 0 ? o.slice(0, j + 1) : ''; };
    while (i < n) {
        const c = t[i], d = t[i + 1];
        if (c === '/' && d === '/') { while (i < n && t[i] !== '\n') { o += ' '; i++; } continue; }
        if (c === '/' && d === '*') { while (i < n && !(t[i] === '*' && t[i + 1] === '/')) { o += (t[i] === '\n' ? '\n' : ' '); i++; } o += '  '; i += 2; continue; }
        if (c === '"' || c === "'" || c === '`') {
            const q = c; o += ' '; i++;
            while (i < n && t[i] !== q) { if (t[i] === '\\') { o += '  '; i += 2; continue; } o += (t[i] === '\n' ? '\n' : ' '); i++; }
            o += ' '; i++; continue;
        }
        if (c === '/') {
            const до = предыдущийЗнак();
            const этоРегулярка = до === '' || ПОСЛЕ_ЧЕГО_РЕГУЛЯРКА.test(до) || СЛОВА_ПЕРЕД.test(до);
            if (этоРегулярка) {
                o += ' '; i++; let вКлассе = false;
                while (i < n) {
                    const e = t[i];
                    if (e === '\\') { o += '  '; i += 2; continue; }
                    if (e === '\n') break;            /* незакрытая — значит это было деление */
                    if (e === '[') вКлассе = true;
                    else if (e === ']') вКлассе = false;
                    else if (e === '/' && !вКлассе) { o += ' '; i++; break; }
                    o += ' '; i++;
                }
                while (i < n && /[gimsuyvd]/.test(t[i])) { o += ' '; i++; }
                continue;
            }
        }
        o += c; i++;
    }
    return o;
}
module.exports = { маска };
