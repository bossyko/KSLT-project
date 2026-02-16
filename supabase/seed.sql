-- ============================================
-- KSLT Seed Data — начальные данные
-- ============================================

-- 9 категорий рейтинга
INSERT INTO categories (id, name, name_en, gender, sort_order) VALUES
    ('men-promasters',  'Pro-Masters',  'Pro-Masters',  'men',   1),
    ('men-masters',     'Masters',      'Masters',      'men',   2),
    ('men-futures',     'Futures',      'Futures',      'men',   3),
    ('men-challenger',  'Challenger',   'Challenger',   'men',   4),
    ('men-tour',        'Tour',         'Tour',         'men',   5),
    ('women-promasters','Pro-Masters',  'Pro-Masters',  'women', 6),
    ('women-masters',   'Masters',      'Masters',      'women', 7),
    ('women-challenger','Challenger',   'Challenger',   'women', 8),
    ('women-tour',      'Tour',         'Tour',         'women', 9);
