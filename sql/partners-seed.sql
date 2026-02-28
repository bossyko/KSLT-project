-- ============================================
-- KSLT — Partners Test Seed
-- Creates test profiles for partners page
-- Run ONCE for testing, delete after
-- ============================================

-- Insert test profiles (using gen_random_uuid for IDs)
-- These are NOT real auth users, just profiles for display testing

INSERT INTO profiles (id, full_name, gender, play_level, preferred_time, last_seen) VALUES
-- Online (last_seen within 5 min)
(gen_random_uuid(), 'Азамат Каримов', 'male', 'advanced', 'evening', NOW() - INTERVAL '1 minute'),
(gen_random_uuid(), 'Айбек Жумабеков', 'male', 'intermediate', 'morning', NOW() - INTERVAL '3 minutes'),
(gen_random_uuid(), 'Динара Абдыкеримова', 'female', 'advanced', 'afternoon', NOW() - INTERVAL '2 minutes'),
(gen_random_uuid(), 'Нурсултан Токтогулов', 'male', 'beginner', 'weekend', NOW()),

-- Offline (last_seen > 5 min ago)
(gen_random_uuid(), 'Бакыт Усенов', 'male', 'intermediate', 'evening', NOW() - INTERVAL '30 minutes'),
(gen_random_uuid(), 'Эрмек Садыков', 'male', 'advanced', 'morning', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 'Алтынай Мамбетова', 'female', 'intermediate', 'afternoon', NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), 'Чынара Бейшенова', 'female', 'beginner', 'evening', NOW() - INTERVAL '45 minutes'),
(gen_random_uuid(), 'Тимур Исаков', 'male', 'advanced', 'weekend', NOW() - INTERVAL '3 hours'),
(gen_random_uuid(), 'Руслан Джолдошев', 'male', 'intermediate', 'morning', NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), 'Миргуль Асанова', 'female', 'advanced', 'evening', NOW() - INTERVAL '12 hours'),
(gen_random_uuid(), 'Данияр Кулматов', 'male', 'beginner', 'afternoon', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'Айгерим Турсунова', 'female', 'intermediate', 'weekend', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'Арсен Байматов', 'male', 'advanced', 'evening', NOW() - INTERVAL '4 hours'),
(gen_random_uuid(), 'Жаркын Эшматов', 'male', 'intermediate', 'morning', NOW() - INTERVAL '5 hours'),
(gen_random_uuid(), 'Назгуль Сыдыкова', 'female', 'beginner', 'afternoon', NOW() - INTERVAL '8 hours'),

-- No last_seen (never visited)
(gen_random_uuid(), 'Кубанычбек Орозалиев', 'male', NULL, NULL, NULL),
(gen_random_uuid(), 'Бегайым Калыкова', 'female', NULL, NULL, NULL),
(gen_random_uuid(), 'Максат Тенизбаев', 'male', 'intermediate', 'evening', NULL),
(gen_random_uuid(), 'Аида Жапарова', 'female', 'advanced', 'morning', NULL);

-- Verify
SELECT full_name, gender, play_level, last_seen FROM profiles WHERE full_name IS NOT NULL ORDER BY last_seen DESC NULLS LAST;
