#!/usr/bin/env python3
"""Собирает иконки KSLT из настоящего логотипа.

Фигурка теннисиста — вторая фигура в images/kslt-logo.svg. Она широкая и низкая,
поэтому в квадратной иконке её масштабируем по ширине и держим запас по краям:
у Android своя маска, у iOS своя.

Растеризуем через qlmanage — другого конвертера SVG в системе нет. Он заливает
прозрачные места белым, поэтому фон везде задаём явно: лайм у иконок,
чёрный у заставки. Единственная картинка, которой прозрачность нужна
по-настоящему, — круглая иконка старых лаунчеров, её рисуем отдельно в Chrome.
"""
import re, os, subprocess, shutil, sys

ROOT = '/Users/bossyko/Documents/KSLT'
WORK = os.path.join(ROOT, 'import', '.icon-build')
LIME = '#8BC400'
DARK = '#0A0A0A'

svg = open(os.path.join(ROOT, 'images/kslt-logo.svg')).read()
PATHS = re.findall(r'<path[^>]*d="([^"]+)"[^>]*fill="([^"]+)"', svg)
FIGURE = [d for d, f in PATHS if f.lower() != 'white'][0]

BX, BW, BH = 36.0, 62.0, 36.0     # фигурка внутри логотипа 98x36
LW, LH = 98.0, 36.0               # логотип целиком


def centered(size, frac, w, h, x0, body):
    """Кусок логотипа по центру квадрата, шириной frac от стороны."""
    s = size * frac / w
    return ('<g transform="translate(%.3f,%.3f) scale(%.5f)">%s</g>'
            % ((size - w * s) / 2 - x0 * s, (size - h * s) / 2, s, body))


def figure(size, frac, color):
    p = ('<path fill-rule="evenodd" clip-rule="evenodd" d="%s" fill="%s"/>' % (FIGURE, color))
    return centered(size, frac, BW, BH, BX, p)


def logo(size, frac):
    p = ''.join('<path fill-rule="evenodd" clip-rule="evenodd" d="%s" fill="%s"/>' % (d, f)
                for d, f in PATHS)
    return centered(size, frac, LW, LH, 0, p)


def doc(size, body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
            'viewBox="0 0 %d %d">%s</svg>' % (size, size, size, size, body))


def icon(size, frac):
    """Иконка приложения: тёмная фигурка на лаймовом квадрате во весь кадр."""
    return doc(size, '<rect width="%d" height="%d" fill="%s"/>' % (size, size, LIME)
               + figure(size, frac, DARK))


def splash(size, frac):
    """Заставка: логотип целиком на фоне приложения."""
    return doc(size, '<rect width="%d" height="%d" fill="%s"/>' % (size, size, DARK)
               + logo(size, frac))


def render(source_svg, size, dest):
    os.makedirs(WORK, exist_ok=True)
    name = os.path.basename(dest).replace('.png', '')
    src = os.path.join(WORK, name + '.svg')
    open(src, 'w').write(source_svg)
    out = subprocess.run(['qlmanage', '-t', '-s', str(size), '-o', WORK, src],
                         capture_output=True, text=True)
    made = os.path.join(WORK, name + '.svg.png')
    if not os.path.exists(made):
        sys.exit('не отрисовалось: %s\n%s' % (dest, out.stdout + out.stderr))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.move(made, dest)
    print('%-72s %d' % (os.path.relpath(dest, ROOT), size))


# ---- сайт и PWA ------------------------------------------------------------
render(icon(512, 0.72), 192, ROOT + '/images/icons/icon-192.png')
render(icon(512, 0.72), 512, ROOT + '/images/icons/icon-512.png')
# maskable: систему интересуют центральные 80%, фигурку убираем от краёв
render(icon(512, 0.58), 192, ROOT + '/images/icons/icon-192-maskable.png')
render(icon(512, 0.58), 512, ROOT + '/images/icons/icon-512-maskable.png')
render(icon(512, 0.70), 180, ROOT + '/images/icons/apple-touch-icon.png')

# ---- Android ---------------------------------------------------------------
AND = ROOT + '/mobile/android/app/src/main/res'
DENSITY = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, k in DENSITY.items():
    render(icon(512, 0.70), int(round(48 * k)), '%s/mipmap-%s/ic_launcher.png' % (AND, d))
    # у адаптивной иконки безопасная зона — центральные 72 из 108;
    # лайм запечён в слой, цвет фона в ic_launcher_background тот же
    render(icon(512, 0.44), int(round(108 * k)), '%s/mipmap-%s/ic_launcher_foreground.png' % (AND, d))
    render(splash(720, 0.80), int(round(180 * k)), '%s/mipmap-%s/splash_logo.png' % (AND, d))

# круглая иконка нужна только лаунчерам до Android 8 — своей маски у них нет,
# а прозрачные углы qlmanage всё равно зальёт белым. Кладём тот же квадрат:
# на Android 8 и новее файл не используется вовсе.
for d in DENSITY:
    shutil.copy('%s/mipmap-%s/ic_launcher.png' % (AND, d),
                '%s/mipmap-%s/ic_launcher_round.png' % (AND, d))

shutil.rmtree(WORK, ignore_errors=True)
