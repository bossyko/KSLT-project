    -- ============================================
    -- Add missing women-futures category and players
    -- Run in Supabase SQL Editor
    -- ============================================

    -- 1. Add women-futures category (if not exists)
    INSERT INTO categories (id, name, name_en, gender, sort_order)
    VALUES ('women-futures', 'Futures', 'Futures', 'women', 10)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Add 15 women-futures players
    INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
    ('orozbekova-aijamal', 'Айжамал Орозбекова', 'Aizhamal Orozbekova', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 950, 11, 3, 3, ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], true),
    ('tashbaeva-zarina', 'Зарина Ташбаева', 'Zarina Tashbaeva', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 890, 9, 4, 1, ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
    ('kaparova-gulzat', 'Гулзат Капарова', 'Gulzat Kaparova', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 840, 8, 5, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
    ('nuralieva-madina', 'Мадина Нуралиева', 'Madina Nuralieva', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇿', 'women-futures', 800, 8, 6, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
    ('sydykova-aijan', 'Айжан Сыдыкова', 'Aizhan Sydykova', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 760, 7, 6, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], true),
    ('asanbekova-nuriza', 'Нуриза Асанбекова', 'Nuriza Asanbekova', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 720, 7, 7, 0, ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], false),
    ('dzhumalieva-sezim', 'Сезим Джумалиева', 'Sezim Dzhumalieva', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 680, 6, 8, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
    ('baitikova-elmira', 'Эльмира Байтикова', 'Elmira Baitikova', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-futures', 640, 6, 8, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
    ('moldoeva-nurgul', 'Нургуль Молдоева', 'Nurgul Moldoeva', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 600, 5, 9, 0, ARRAY['L','W','L','W','L'], ARRAY['newbie'], false),
    ('toktogulova-aidai', 'Айдай Токтогулова', 'Aidai Toktogulova', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 560, 5, 9, -1, ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], true),
    ('kenenbaeva-aisuluu', 'Айсулуу Кененбаева', 'Aisuluu Kenenbaeva', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 520, 4, 10, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
    ('rysbaeva-kanykei', 'Каныкей Рысбаева', 'Kanykei Rysbaeva', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 480, 4, 10, 0, ARRAY['L','L','W','W','L'], ARRAY['newbie'], false),
    ('abdyldaeva-zhyldyz', 'Жылдыз Абдылдаева', 'Zhyldyz Abdyldaeva', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 440, 3, 11, 12, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
    ('kozhomkulova-asel', 'Асель Кожомкулова', 'Asel Kozhomkulova', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 400, 3, 11, -2, ARRAY['L','L','W','L','W'], ARRAY['newbie'], false),
    ('temirova-begaiym', 'Бегайым Темирова', 'Begaiym Temirova', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-futures', 360, 2, 12, 0, ARRAY['L','W','L','L','L'], ARRAY['newbie'], false)
    ON CONFLICT (id) DO NOTHING;
