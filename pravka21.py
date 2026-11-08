# -*- coding: utf-8 -*-
import io, sys
к = sys.argv[1]
К = chr(96)
def ц(с): return К + с + К

# ── 1. сторож адреса: не обходить папку сборки Capacitor ────────────
p = к + '/tools/check-adres-sayta.js'
s = io.open(p, encoding='utf-8').read()
старый = "            if (/node_modules|\\.git|dist|test-results|tests|^build$/.test(э.name)) return;"
новый = """            /* ПАПКА СБОРКИ — НЕ ИСХОДНИК (08.11). `mobile/ios/App/App/public`
               появляется от `npx cap sync`: туда КОПИРУЕТСЯ `mobile/www`, и
               в гите её нет вовсе (`mobile/ios/.gitignore`, 0 файлов).
               Сторож обходит ДИСК, а не репозиторий, и находил в копии то,
               что в исходнике давно починено. ПРИБОР НЕ ДОЛЖЕН ЧИТАТЬ ТО,
               ЧЕГО НЕТ В РЕПОЗИТОРИИ: иначе он красен от собственной сборки. */
            if (/node_modules|\\.git|dist|test-results|tests|^build$|^public$/.test(э.name)) return;"""
assert s.count(старый) == 2, 'ожидалось два обхода, найдено %d' % s.count(старый)
s = s.replace(старый, новый, 1)
старый2 = "            if (/node_modules|\\.git|dist|test-results|^build$/.test(э.name)) return;"
assert s.count(старый2) == 1, 'второй обход не найден'
s = s.replace(старый2, "            if (/node_modules|\\.git|dist|test-results|^build$|^public$/.test(э.name)) return;")
io.open(p, 'w', encoding='utf-8').write(s)

# ── 2. храповик зовов языка ─────────────────────────────────────────
pv = к + '/tools/check-vybor-yazyka.js'
v = io.open(pv, encoding='utf-8').read()
б = "const ПОЛ_ЗОВОВ = 512;"
н = """/* 08.11: 512 → 513. Зов добавил кусок «места парного турнира»: раздел
   у нерейтинговых зовётся «Места / Places / Орундар», и это ОДИН зов
   выбора на три языка — ровно то, ради чего правило и писано. */
const ПОЛ_ЗОВОВ = 513;"""
assert v.count(б) == 1, 'пол зовов не найден'
io.open(pv, 'w', encoding='utf-8').write(v.replace(б, н))
print('сторож адреса не читает папку сборки; пол зовов языка поднят')
