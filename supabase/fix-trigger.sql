-- Fix: сохраняем телефон и пол в profiles при регистрации

-- Сначала добавим колонку gender в profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Обновляем триггер
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, gender)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновим существующий профиль (твой аккаунт)
UPDATE profiles SET
    phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = profiles.id),
    gender = (SELECT raw_user_meta_data->>'gender' FROM auth.users WHERE id = profiles.id)
WHERE phone IS NULL OR phone = '';
