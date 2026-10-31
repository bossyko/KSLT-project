#!/usr/bin/env python3
"""ТИХИЙ СЕРВЕР ДЛЯ ПРОГОНА: МОЛЧИТ ПРО УСПЕХ, ГОВОРИТ ПРО БЕДУ (31.10).

ЗАЧЕМ. `python3 -m http.server` печатает СТРОКУ НА КАЖДЫЙ ЗАПРОС — и
пишет их в stderr, который Playwright подмешивает в свой вывод. На
прогоне в полторы тысячи проверок каждая страница тянет по сорок
файлов, и в выводе остаются только эти строки: какой тест идёт и чем
кончился, разглядеть нельзя. Костя так и сказал 31.10: «не могу понять
сейчас где на каком тест идёт или закончился».

ПОЧЕМУ НЕ `stderr: 'ignore'`. Это заглушило бы и настоящие беды
сервера — отказ порта, права, падение. ТИШИНА НУЖНА ПРО УСПЕХ, А НЕ
ПРО ВСЁ. Поэтому молчим на 2xx и 3xx, а 4xx и 5xx печатаем: ненайденный
файл — это обычно опечатка в теге скрипта, и видеть её надо.

  python3 tools/server-tihiy.py [порт] [папка]
"""
import sys
import os
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler


class ТихийОбработчик(SimpleHTTPRequestHandler):
    """Тот же сервер, но без строки на каждый удачный запрос."""

    def log_request(self, code='-', size='-'):
        try:
            числом = int(code)
        except (TypeError, ValueError):
            числом = 0
        if числом >= 400:
            sys.stderr.write('[сервер] %s %s\n' % (числом, self.path))
            sys.stderr.flush()

    def log_message(self, формат, *доводы):
        """Прочие сообщения сервера — пропускаем как есть: это не шум.

        ОДНА БЕДА — ОДНА СТРОКА. `log_error` зовёт сюда с «code 404,
        message File not found», и это ДУБЛЬ к строке выше, только без
        пути. Путь полезнее, поэтому дубль гасится, а всё остальное
        (отказ порта, обрыв, таймаут) печатается.
        """
        строка = формат % доводы
        if строка.startswith('code '):
            return
        sys.stderr.write('[сервер] ' + строка + '\n')
        sys.stderr.flush()


def главное():
    порт = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    папка = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
    обработчик = partial(ТихийОбработчик, directory=папка)
    сервер = HTTPServer(('', порт), обработчик)
    # Одна строка на запуск — чтобы было видно, что сервер поднялся.
    sys.stderr.write('[сервер] тихий, порт %d, папка %s\n' % (порт, папка))
    sys.stderr.flush()
    try:
        сервер.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    главное()
