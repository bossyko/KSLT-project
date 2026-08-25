-- ============================================
-- Порядок в правилах доступа к хранилищу
-- ============================================
--
-- На аватары накопилось тринадцать правил: четыре разрешения на чтение,
-- три на загрузку, три на изменение — все делают одно и то же. Так бывает,
-- когда настройку повторяют несколько раз, а старое не убирают.
--
-- Опаснее другое: «Users delete own avatar» выдано роли public, то есть
-- кому угодно, включая невошедших. Не сработало только потому, что до
-- вчерашнего дня удаление в бакете было запрещено вовсе.
--
-- Оставляем по одному правилу на действие:
--
--   читать      — всем, картинки и так публичные
--   загружать   — вошедшему, только в свою папку
--   изменять    — вошедшему, только свою папку
--   удалять     — вошедшему свою папку; админ и менеджер — что угодно
--
-- Папка пользователя — это его идентификатор: код кабинета грузит аватар
-- по пути «id/avatar.jpg», поэтому первый кусок пути и есть проверка.

BEGIN;

-- ---- Убираем нагромождение ----
DROP POLICY IF EXISTS "Avatars public read"          ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access"         ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read"           ON storage.objects;
DROP POLICY IF EXISTS "Allow public read"            ON storage.objects;

DROP POLICY IF EXISTS "Avatars auth upload"          ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar"      ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads"  ON storage.objects;

DROP POLICY IF EXISTS "Avatars auth update"          ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar"      ON storage.objects;

DROP POLICY IF EXISTS "Users delete own avatar"      ON storage.objects;
DROP POLICY IF EXISTS "Админ и менеджер удаляют файлы" ON storage.objects;

-- ---- Читать: всем ----
-- Обложки новостей, логотипы спонсоров и аватары открыты по прямой ссылке,
-- иначе их не показать на сайте
CREATE POLICY "Чтение файлов — всем"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id IN ('news', 'avatars'));

-- ---- Загружать ----
-- В новости — только сотрудники клуба: это содержимое сайта.
-- В аватары — любой вошедший, но лишь в свою папку.
CREATE POLICY "Загрузка файлов"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR (bucket_id = 'news' AND EXISTS (
            SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- ---- Изменять (перезапись при новой фотографии) ----
CREATE POLICY "Изменение файлов"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR (bucket_id = 'news' AND EXISTS (
            SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- ---- Удалять ----
-- Свой аватар — сам, всё остальное — админ и менеджер
CREATE POLICY "Удаление файлов"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR (bucket_id IN ('news', 'avatars') AND EXISTS (
            SELECT 1 FROM profiles
             WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- ---- Что получилось ----
SELECT cmd AS операция, policyname AS правило, roles AS роли
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;

COMMIT;
