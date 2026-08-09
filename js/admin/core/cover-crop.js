/**
 * KSLT admin — кадрирование обложки новости.
 *
 * Афиши приходят какими угодно: вертикальными, квадратными, со снимка телефона.
 * В карточках списка нужна одна пропорция, иначе сетка разъезжается, поэтому
 * менеджер сам двигает и приближает картинку в рамке и видит, что попадёт
 * на сайт. Исходник при этом сохраняется отдельно и показывается целиком
 * в шапке новости — афишу рисовали, чтобы её прочитали.
 *
 * Работает на Cropper.js, который уже используется в личном кабинете
 * для аватара.
 */
(function() {
    'use strict';

    var A = window.KSLT_ADMIN = window.KSLT_ADMIN || {};

    var ASPECT = 16 / 9;      // близко к пропорциям карточки: режет меньше, чем 3:2
    var OUT_WIDTH = 1280;     // ширина готовой обложки

    /**
     * Открывает окно кадрирования.
     * @param {File} file — выбранный файл
     * @returns {Promise<Blob|null>} обрезанная картинка или null, если отменили
     */
    function cropCover(file) {
        return new Promise(function(resolve) {
            if (typeof Cropper === 'undefined') {
                resolve(null);   // библиотека не подключилась — грузим как есть
                return;
            }

            var reader = new FileReader();
            reader.onload = function(ev) {
                var overlay = document.createElement('div');
                overlay.className = 'ad-crop-overlay';
                overlay.innerHTML =
                    '<div class="ad-crop-modal">' +
                        '<div class="ad-crop-header">' +
                            '<span class="ad-crop-title">Кадрирование обложки</span>' +
                            '<button type="button" class="ad-crop-close">&times;</button>' +
                        '</div>' +
                        '<div class="ad-crop-hint">Двигайте и приближайте — в рамке то, что увидят в списке новостей. ' +
                            'Афиша целиком останется в шапке самой новости.</div>' +
                        '<div class="ad-crop-body"><img class="ad-crop-image" alt=""></div>' +
                        '<div class="ad-crop-footer">' +
                            '<button type="button" class="ad-btn ad-btn-outline ad-crop-cancel">Отмена</button>' +
                            '<button type="button" class="ad-btn ad-btn-primary ad-crop-apply">Применить</button>' +
                        '</div>' +
                    '</div>';
                document.body.appendChild(overlay);

                var img = overlay.querySelector('.ad-crop-image');
                img.src = ev.target.result;

                var cropper = new Cropper(img, {
                    aspectRatio: ASPECT,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 1,
                    background: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true
                });

                function close(result) {
                    cropper.destroy();
                    overlay.remove();
                    resolve(result);
                }

                overlay.querySelector('.ad-crop-close').addEventListener('click', function() { close(null); });
                overlay.querySelector('.ad-crop-cancel').addEventListener('click', function() { close(null); });
                overlay.addEventListener('click', function(e) { if (e.target === overlay) close(null); });

                overlay.querySelector('.ad-crop-apply').addEventListener('click', function() {
                    var canvas = cropper.getCroppedCanvas({
                        width: OUT_WIDTH,
                        height: Math.round(OUT_WIDTH / ASPECT),
                        imageSmoothingQuality: 'high'
                    });
                    if (!canvas) { close(null); return; }
                    canvas.toBlob(function(blob) { close(blob); }, 'image/jpeg', 0.88);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    A.cropCover = cropCover;
})();
