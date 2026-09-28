-- ОДНО УВЕДОМЛЕНИЕ ИГРОКУ НА ВСЕ СЛУЧАИ РАССМОТРЕНИЯ.
--
-- Решение Кости 28.09: «одно правило и одно уведомление, проще и ясно».
-- Причина игроку не называется — она может быть не одна, может измениться
-- после правки данных, и решает её всё равно человек.
--
-- Заодно чинится находка: прежний текст был зашит в index.ts по-русски,
-- мимо переводчика т(), и англо- или кыргызоязычный игрок получал русское
-- сообщение. Теперь строка живёт здесь, рядом с остальными, и её можно
-- вычитать и поправить без выкладки функции.

INSERT INTO public.notification_texts (key, ru, en, kg) VALUES
('trn_review_title',
 'Заявка на рассмотрении',
 'Application under review',
 'Арыз каралууда'),
('trn_review_body',
 'Ваша заявка на «{турнир}» принята и передана на рассмотрение. Место за вами держится по времени подачи, решение примет менеджер клуба.',
 'Your application for "{турнир}" has been accepted and passed for review. Your place is held by the time you applied; the club manager will decide.',
 'Сиздин «{турнир}» мелдешине арызыңыз кабыл алынып, каралууга берилди. Орун арыз берген убактыңыз боюнча сакталат, чечимди клубдун менеджери кабыл алат.')
ON CONFLICT (key) DO UPDATE
   SET ru = EXCLUDED.ru, en = EXCLUDED.en, kg = EXCLUDED.kg;

-- ПРОВЕРКА
SELECT key, left(ru, 40) AS ru, left(en, 40) AS en, left(kg, 40) AS kg
FROM public.notification_texts
WHERE key IN ('trn_review_title', 'trn_review_body')
ORDER BY key;
