-- ============================================================
-- ЧТО НА САМОМ ДЕЛЕ ПОКАЗЫВАЕТСЯ В ДОКУМЕНТАХ — ЧТЕНИЕ, НЕ ПРАВКА
-- ============================================================
--
-- ПОВОД (06.11). Текст Условий, Политики и Оферты приходит НЕ из файла,
-- а из таблицы `site_documents`: `pages/privacy-policy.html:608` зовёт
-- `KSLT_CONTENT.document`, и ответ базы ЗАМЕЩАЕТ разметку
-- (`box.innerHTML = doc.body`). Разметка в файле — запасной вариант на
-- то время, пока база не ответила.
--
-- Значит правки, сделанные 06.11 в файлах `terms-*`, `offer-kg`,
-- `privacy-policy-*`, на живом сайте могли не появиться вовсе: люди
-- видят базу. Косвенное подтверждение уже есть — на `new.tennis.kg`
-- в пункте 8.3 стоит `www.tennis.kg`, которого в файлах не осталось.
--
-- ПРАВИЛА (`rules`) в базе НЕТ: `pages/rules.html` не имеет
-- `data-document`, его текст живёт в файле. Правки правил видны.
--
-- ЭТОТ ФАЙЛ НИЧЕГО НЕ МЕНЯЕТ. Только читает, чтобы не чинить вслепую.
-- Прогнать в Supabase → SQL Editor и прислать таблицу.

SELECT  slug,
        -- сколько абзацев в каждой редакции: сравним с файлами
        (length(body)    - length(replace(body,    '<p', ''))) / 2 AS ru_abzacev,
        (length(body_en) - length(replace(body_en, '<p', ''))) / 2 AS en_abzacev,
        (length(body_kg) - length(replace(body_kg, '<p', ''))) / 2 AS kg_abzacev,
        -- остался ли адрес с `www`, который мы убрали из файлов 06.11
        (body    LIKE '%www.tennis.kg%')              AS ru_www,
        (body_en LIKE '%www.tennis.kg%')              AS en_www,
        (body_kg LIKE '%www.tennis.kg%')              AS kg_www,
        -- старый адрес на netlify
        (body    LIKE '%kslt.netlify.app%')           AS ru_netlify,
        -- какая редакция лежит в тексте
        (body    LIKE '%26 августа 2026%')            AS ru_redakciya_avgust,
        -- пометка «это проект документа», которую 06.11 снимали
        (body_kg LIKE '%ip-draft-note%')              AS kg_pometka_chernovika,
        updated_at
FROM    public.site_documents
ORDER BY slug;
