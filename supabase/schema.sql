-- ============================================
-- KSLT Database Schema
-- Supabase (PostgreSQL)
-- ============================================

-- 1. CATEGORIES — 9 рейтинговых категорий
CREATE TABLE categories (
    id TEXT PRIMARY KEY,                -- 'men-promasters', 'women-masters'
    name TEXT NOT NULL,                 -- 'Pro-Masters'
    name_en TEXT,
    name_kg TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('men', 'women')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PLAYERS — игроки
CREATE TABLE players (
    id TEXT PRIMARY KEY,                -- 'asanov-timur'
    name TEXT NOT NULL,                 -- 'Тимур Асанов'
    name_en TEXT,                       -- 'Timur Asanov'
    name_kg TEXT,
    photo TEXT,                         -- URL аватара
    country TEXT DEFAULT '🇰🇬',
    category_id TEXT REFERENCES categories(id),
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0,      -- +3, -2, 0
    form TEXT[] DEFAULT '{}',           -- последние 5 матчей: {'W','W','L','W','W'}
    badges TEXT[] DEFAULT '{}',         -- {'champion','top1','streak'}
    is_online BOOLEAN DEFAULT false,
    bio TEXT,
    bio_en TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TOURNAMENTS — турниры
CREATE TABLE tournaments (
    id TEXT PRIMARY KEY,                -- 'spring-open-2026'
    title TEXT NOT NULL,
    title_en TEXT,
    title_kg TEXT,
    description TEXT,
    description_en TEXT,
    date_start DATE,
    date_end DATE,
    location TEXT,
    location_en TEXT,
    category_id TEXT REFERENCES categories(id),
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    max_participants INTEGER,
    prize_fund TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MATCHES — результаты матчей
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id TEXT REFERENCES tournaments(id),
    player1_id TEXT REFERENCES players(id),
    player2_id TEXT REFERENCES players(id),
    score TEXT,                          -- '6:4, 3:6, 7:5'
    winner_id TEXT REFERENCES players(id),
    round TEXT,                          -- 'final', 'semifinal', 'quarterfinal', 'group'
    played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PROFILES — пользователи сайта (расширяет Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    birth_day INT CHECK (birth_day BETWEEN 1 AND 31),
    birth_month INT CHECK (birth_month BETWEEN 1 AND 12),
    birth_year INT,                          -- необязательно
    player_id TEXT REFERENCES players(id),  -- связь с игроком (если есть)
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'player', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. MEMBERSHIPS — членство в клубе
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    starts_at DATE,
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PAYMENTS — платежи
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id),
    membership_id UUID REFERENCES memberships(id),
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'KGS',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    external_id TEXT,                    -- ID транзакции платёжного шлюза
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. COACHES — тренеры
CREATE TABLE coaches (
    id TEXT PRIMARY KEY,                 -- 'ivanov-sergey'
    name TEXT NOT NULL,
    name_en TEXT,
    name_kg TEXT,
    photo TEXT,
    specialization TEXT,
    specialization_en TEXT,
    experience TEXT,
    experience_en TEXT,
    phone TEXT,
    email TEXT,
    price TEXT,
    rating DECIMAL(2,1),
    bio TEXT,
    bio_en TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. COURTS — корты
CREATE TABLE courts (
    id TEXT PRIMARY KEY,                 -- 'dordoi-arena'
    name TEXT NOT NULL,
    name_en TEXT,
    name_kg TEXT,
    address TEXT,
    address_en TEXT,
    photo TEXT,
    surface TEXT CHECK (surface IN ('hard', 'clay', 'grass', 'indoor', 'carpet')),
    phone TEXT,
    price TEXT,
    rating DECIMAL(2,1),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    working_hours TEXT,
    bio TEXT,
    bio_en TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. NEWS — новости
CREATE TABLE news (
    id TEXT PRIMARY KEY,                 -- 'spring-open-results'
    title TEXT NOT NULL,
    title_en TEXT,
    title_kg TEXT,
    slug TEXT UNIQUE,
    content TEXT,
    content_en TEXT,
    excerpt TEXT,
    excerpt_en TEXT,
    image TEXT,
    category TEXT,                       -- 'tournament', 'community', 'interview'
    author TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- INDEXES — для быстрых запросов
-- ============================================

CREATE INDEX idx_players_category ON players(category_id);
CREATE INDEX idx_players_points ON players(points DESC);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_played_at ON matches(played_at DESC);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_date ON tournaments(date_start DESC);
CREATE INDEX idx_memberships_profile ON memberships(profile_id);
CREATE INDEX idx_payments_profile ON payments(profile_id);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_slug ON news(slug);


-- ============================================
-- AUTO-CREATE PROFILE — при регистрации пользователя
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- UPDATED_AT — автообновление timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_players
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Включаем RLS на всех таблицах
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ — все могут читать публичные данные
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Public read courts" ON courts FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);

-- PROFILES — пользователь видит и редактирует только свой профиль
CREATE POLICY "Users read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- MEMBERSHIPS — пользователь видит только своё членство
CREATE POLICY "Users read own membership" ON memberships
    FOR SELECT USING (auth.uid() = profile_id);

-- PAYMENTS — пользователь видит только свои платежи
CREATE POLICY "Users read own payments" ON payments
    FOR SELECT USING (auth.uid() = profile_id);

-- ADMIN — полный доступ для админов
CREATE POLICY "Admin full access categories" ON categories FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access players" ON players FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access tournaments" ON tournaments FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access matches" ON matches FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access memberships" ON memberships FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access payments" ON payments FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access coaches" ON coaches FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access courts" ON courts FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access news" ON news FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- STORAGE — Avatars bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public avatar read" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
