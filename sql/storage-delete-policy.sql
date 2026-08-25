    -- ============================================
    -- Право удалять файлы хранилища
    -- ============================================
    --
    -- У бакета `news` нет правила на удаление, и Supabase на попытку удалить
    -- не отдаёт ошибку — он молча возвращает пустой список. Из-за этого при
    -- переезде по папкам оригиналы остались в корне: каждый файл лежит
    -- дважды, лишние восемьдесят мегабайт.
    --
    -- Разрешаем удаление только администраторам и менеджерам — так же, как
    -- сделано в остальных правилах проекта. Обычному вошедшему пользователю
    -- удаление файлов ни к чему.

    DROP POLICY IF EXISTS "Админ и менеджер удаляют файлы" ON storage.objects;

    CREATE POLICY "Админ и менеджер удаляют файлы"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
            bucket_id IN ('news', 'avatars')
            AND EXISTS (
                SELECT 1 FROM profiles
                 WHERE id = auth.uid()
                   AND role IN ('admin', 'manager')
            )
        );

    -- Проверка: какие правила теперь стоят на хранилище
    SELECT policyname AS правило, cmd AS операция, roles AS роли
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY cmd, policyname;
