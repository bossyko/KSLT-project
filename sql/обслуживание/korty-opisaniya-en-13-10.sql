-- АНГЛИЙСКИЕ ОПИСАНИЯ КОРТОВ — courts.description_en. 13.10.2026
--
-- Слово Кости 13.10: «перевести».
--
-- ОТКУДА. Замер английской страницы корта (`pages/court-en.html`): секция
-- «About the venue» показывала русский текст. Код поле ЧИТАЕТ
-- (`js/courts.js:547`, `row.description_en || row.description`), колонка в
-- базе есть (`sql/схема/courts-kg-columns.sql`) — она пустая у ВСЕХ 31
-- корта. Та же история, что с `name_en` 12.10: не код, а данные.
--
-- ЧТО ПЕРЕВЕДЕНО. Тридцать описаний; тридцать первое (`otshibnik`) пустое и
-- в русской версии — его здесь нет. Сохранены абзацы, подписи разделов
-- («Услуги», «Сезонность», «ВАЖНО») и все оговорки об источниках: текст
-- писался как реестр, и осторожность формулировок — его содержание.
--
-- ЗАПУСКАЕТ КОСТЯ. Проверка результата — ЧТЕНИЕМ БАЗЫ, в конце файла.

BEGIN;

UPDATE courts SET description_en = 'A holiday centre in the village of Baet on the northern shore. One directory states "tennis courts (outdoor and indoor)" outright; a second confirms a tennis court without naming the type. Table tennis is not mentioned in either listing. The grounds also hold an outdoor pool and a heated indoor winter pool, a fitness club and billiards.

Services: Gym, basketball and volleyball courts, outdoor and indoor winter pools, spa salon, water activities.

Season: if the indoor court exists, the venue is year-round; otherwise it is a summer one. An indoor court on Issyk-Kul is rare, so the claim needs checking on site — it may be a sports hall with court markings rather than a full indoor court. No price is published. The phone number belongs to a tour operator acting as agent, not to the centre itself.'
 WHERE id = 'ak-maral';

UPDATE courts SET description_en = 'The largest tennis base in Bishkek, open since 2009. Indoor and outdoor courts of international standard allow training all year round. Coaches of several grades work here, there are groups for children and adults, and its players compete in national and international tournaments. Open 09:00-21:00, by appointment.'
 WHERE id = 'akademiya-tennisa-kr';

UPDATE courts SET description_en = 'One of the two main tournament tennis venues on Issyk-Kul. The hotel advertises an outdoor tennis court (a dedicated post on its official Facebook page, "Outdoor tennis court at Akun Issyk-Kul hotel"), and the press describes it as an "international tennis centre" whose courts "meet international requirements". In August 2026 the Akun international amateur tournament was held here for the third year running, drawing more than 40 players from Kyrgyzstan and Kazakhstan.

Services: Tennis is listed among the hotel''s paid services. The annual Akun international amateur tournament (2024, 2025, 2026), tournament director Asel Makaeva; categories: women''s and men''s doubles, mixed (Tour and Masters).

Season: summer (outdoor court). The hotel also has table tennis listed separately, so the sources are not confused — both are named apart. Neither the surface nor the number of courts is given in any source; the official site aik.kg is stuck in an http/https redirect loop and cannot be read automatically. The phrase "international tennis centre" may be marketing — the actual number of courts has to be confirmed by phone.'
 WHERE id = 'akun-issyk-kul-hotel';

UPDATE courts SET description_en = 'A sports-oriented hotel in Bulan-Sogottu with its own tennis court on an artificial surface. The hotel presents itself as year-round, and tennis is among its paid services alongside basketball and darts. Number of courts: one ("its own tennis court").'
 WHERE id = 'azur-sport-rezort';

UPDATE courts SET description_en = 'A large modern resort in Bosteri.'
 WHERE id = 'baytur-rezort-end-spa';

UPDATE courts SET description_en = 'A private tennis club at 97B Akhunbaev Street in the Oktyabrsky district. It runs groups for children and adults on monthly fees, and the court can also be rented by the hour.'
 WHERE id = 'ervin-tennis-school';

UPDATE courts SET description_en = 'A large family sports and health complex in the Kok-Jar residential area.
Tennis is one of many activities here, alongside the pool, fitness, gymnastics and martial arts.'
 WHERE id = 'family-sport';

UPDATE courts SET description_en = 'A sports and health complex built by Gazprom under its "Gazprom for Children" programme and opened in November 2018 — the ninth such venue in Kyrgyzstan. About 2,500 m², with a capacity of over 300 people a day. The opening announcement states explicitly that the hall is intended, among other things, for tennis training and competition. Open daily 09:00-24:00.

Services: Multi-purpose hall: basketball, volleyball, five-a-side football, boxing, freestyle wrestling, judo, sambo, jiu-jitsu, table tennis; pitch rental; QR payment; ramp and accessible entrance.

IMPORTANT: this is a multi-purpose games hall, not a dedicated tennis court — tennis here is most likely provided by court markings on the floor. There are no separate photographs of a court and no data on the surface. A phone call is needed to confirm that it is tennis proper and not only table tennis. The 2GIS listing is registered to the Jalal-Abad Oblast Football Association.'
 WHERE id = 'fok-gazprom-dzhalal-abad';

UPDATE courts SET description_en = 'A classic Soviet-era sanatorium set in 47 hectares of parkland in Bulan-Sogottu, 20 km from Cholpon-Ata and 270 km from Bishkek. Its list of paid services names "tennis court" and "table tennis" as two separate items. It has its own sandy beach 300 m from the main building.

Services: The tennis court and table tennis are both paid services (listed separately). Free: five-a-side football and sports grounds; paid: gym, sauna, billiards.

Season: summer (outdoor court). Access: paid, for guests. The surface, the number of courts and their condition are described nowhere — for a sanatorium of this age there is a real chance the court is an old asphalt pad. No direct contact details for the sanatorium could be found.'
 WHERE id = 'issyk-kul-aurora-sanatorium';

UPDATE courts SET description_en = 'A multi-purpose sports club at 121 Bakaev Street: an indoor tennis court, a gym, a climbing wall and a phyto-bar. The court is rented from one hour, and a regular weekly slot can be booked through the front desk.
Open all year round, daily 07:30-22:00.'
 WHERE id = 'k2';

UPDATE courts SET description_en = 'The largest tennis venue on the northern shore of Issyk-Kul. The hotel''s official site has a dedicated service page, "Clay tennis courts", and the courts regularly host international and junior tennis tournaments — among them a series of international events covered by the Kyrgyz sports press. The courts are clay and outdoor, open in the warm season. Neither the exact number of courts nor a price list is published on the site.

Services: Junior and international tennis tournaments are held here (the Kapriz Centre Cup); training camps and a camp are advertised. Equipment hire and a coach are not documented.

Season: summer (clay, outdoor courts). Access: most likely paid, both for guests and for outside players — during tournaments the grounds are open to entrants. Condition: judging by the tournaments held in 2024-2026, the courts are in working order. IMPORTANT: kaprizissykkul.kg returns 404s and redirects to automated fetchers, so the courts page could not be read directly — the data comes from the page title in search results and from mirrors.'
 WHERE id = 'kapriz-issyk-kul-resort-hotel';

UPDATE courts SET description_en = 'The largest tennis cluster on Issyk-Kul: four outdoor courts with artificial grass and one indoor court inside the sports complex. The Karven Open amateur tournament was historically held here. Professional tennis instructors work on site, and nearby are 2 pickleball courts, football pitches, a bowling alley and a 25-metre pool.

Services: Professional tennis instructors ("professional tennis and swimming instructors are at your service"); the sports complex is suitable for tennis and table-tennis competitions; 2 pickleball courts. Racket hire is not advertised on the current site.

The indoor court makes the venue year-round — the only one on the lake apart from the indoor court claimed by Ak-Maral. Access: mainly for guests of the resort, though the sports complex is let for camps and competitions. No tennis prices are published on the official site. NOTE: the old Advantour aggregator carries outdated figures (1 indoor + 1 outdoor, $24/hr indoor, $12/hr outdoor, coach $12/hr) — these disagree with the current site and are probably obsolete.'
 WHERE id = 'karven-four-seasons';

UPDATE courts SET description_en = 'A holiday centre in Bulan-Sogottu, 20 km from Cholpon-Ata. Two independent sources list "an outdoor tennis court and a table-tennis hall" — so tennis and table tennis are named apart. The court is free for residents. The complex is open all year and has 45 rooms.

Services: Free for staying guests. Separately: a table-tennis hall, a multi-purpose sports ground (basketball / volleyball / five-a-side), 2 billiard halls.

Season: the outdoor court is a summer one. Access: free for guests of the centre; terms for outside visitors are unknown. The surface and the condition of the court are described nowhere — there is a risk it is an old asphalt or concrete pad. NOTE: no direct contacts for the centre itself could be found; the numbers given belong to tour operators acting as agents.'
 WHERE id = 'karven-issyk-kul';

UPDATE courts SET description_en = 'A premium fitness club at 77 Gogol Street, in business for over 20 years. The tennis court is indoor, laid with a professional TERAFLEX surface, and is open to card-holding members only — there is no hourly rental for outside players.'
 WHERE id = 'karven-sport-club';

UPDATE courts SET description_en = 'A large old Soviet-type sanatorium in Bosteri. In its long list of facilities "tennis courts" and "table tennis" appear as separate entries: "football and volleyball ground, table tennis, billiard room, disco, pool, sauna, gym, solarium, library, cinema hall, winter garden, phyto-bar, tennis courts, disco bar, casino, internet club, fitness centre".

Services: Table tennis is listed as a separate item. Also football and volleyball grounds, billiards, pool, sauna, gym, fitness centre, solarium, cinema hall.

HIGH RISK OF OUTDATED INFORMATION: the list of facilities reads as inherited from the sanatorium''s Soviet-era description (casino, internet club, winter garden) and is almost certainly out of date in part. The courts, if they exist, are probably worn. Season: summer. Price and surface unknown.'
 WHERE id = 'kyrgyzskoe-vzmorye';

UPDATE courts SET description_en = 'The only court on the southern shore of Issyk-Kul with a fully published price list. One outdoor court with artificial grass, professional lighting and reinforced fencing. Rental 500 som/hour, racket hire 150 som/day. The hotel''s site states explicitly that this is tennis proper ("tennis has taken its place... among the most prestigious sports").

Services: Tennis racket hire 150 som/day; professional lighting for evening play; reinforced fencing around the court. No coach is advertised.

Season: an outdoor court, but the lighting extends playing time into the evening. Access: paid, by the price list — probably open to non-residents as well, though this is not stated. The hotel is in the Jeti-Oguz district (Boz-Beshik), not in Cholpon-Ata.'
 WHERE id = 'marco-polo-resort-hotel';

UPDATE courts SET description_en = 'A small 200-bed resort in Bulan-Sogottu, 20 km from Cholpon-Ata, on a 5.36-hectare site. Its price list names tennis and table tennis separately and at different prices — 400 and 200 som/hour respectively, which settles any question of confusion between the two. The grounds have a rose garden and an orchard, plus a private beach area of 1.18 hectares.

Services: Price list: "Tennis court 400 som/hour, Table tennis 200 som/hour, Billiards 400 som/hour, Sauna + pool 1500 som/hour"; also windsurfing, SUP and a gym.

Season: summer. Access: paid, probably for guests and outside visitors alike. The surface and the number of courts are not stated, and the condition of the court is unknown. NOTE: the contact details given belong to the aggregator issykkul.biz, not to the resort — no direct contacts for Meridian could be found.'
 WHERE id = 'meridian';

UPDATE courts SET description_en = 'A resort in Chok-Tal (formerly Vityaz), 1.5 km from Issyk-Kul airport. An outdoor tennis court with an artificial surface is advertised, with table tennis listed separately. Accommodation in cottages and studios, a private beach with a pier, guarded parking for 100 cars.

Services: Table tennis is listed separately as an evening activity. A free outdoor workout area with equipment, children''s playgrounds, a private beach with a pier.

Season: summer. No price for the court is available. NOTE: no contacts are given — every number found belongs to Kazakh tour operators acting as intermediaries (+7 776 756-00-89 and the like) rather than to the resort; I did not invent a number for the venue.'
 WHERE id = 'muras';

UPDATE courts SET description_en = 'A sports complex in the 12th microdistrict, filed under "tennis courts" by a directory built on 2GIS data. Open daily 07:00-20:00, cash payment only. No details about the courts, the surface or prices exist in open sources.

Services: Cash payment only. No other information.

NOTE: found in a single directory only. There are no reviews, and neither kaktus.media nor sxodim mentions this venue — a phone call is needed to confirm that it really is tennis proper.'
 WHERE id = 'olimpus';

UPDATE courts SET description_en = 'A large 29-hectare holiday centre in the village of Sary-Oy, 14 km from Cholpon-Ata. The official site used to carry a dedicated photo-gallery page, "Tennis court" (raduga.kg/about-resort-center/photo-gallery/94-tennis-court.html), and the issykkul.biz directory still lists a tennis court among the facilities.

Services: 2 restaurants, 4 bars, 4 cafés, a spa centre, 2 pools (indoor and outdoor), sauna and hammam, billiards, a water park, 2 conference halls, a 1,000-metre sandy beach with three piers.

RED FLAG: the "Tennis court" page on the official site now returns a 404, and the current version of raduga.kg does not mention tennis in its list of services at all (only spa, baths, saunas, pools, water activities, restaurants and conference services). The court has probably been dismantled, built over or taken out of use. Needs confirming by phone on +996 552 39 40 40.'
 WHERE id = 'raduga';

UPDATE courts SET description_en = 'A state Olympic-reserve tennis school — one of the two state tennis bases in Bishkek. The courts in the 4th microdistrict have been in use for about 30 years, and some 150 children aged 5-18 train here free of charge.
The school runs five major national tournaments every year.'
 WHERE id = 'sdyusshor-po-tennisu-i-silovym-vidam-sporta';

UPDATE courts SET description_en = 'A holiday centre in the village of Korumdu, east of Bosteri. Its list of facilities names "tennis courts" in the plural, while table tennis is not mentioned separately. The grounds hold a water park, indoor and outdoor pools, a spa and a private beach with a 110-metre pier.

Services: Sports grounds, karaoke, billiards, 2 saunas, indoor and outdoor pools, a water park, entertainment programme, spa.

Season: summer. Neither the number of courts, nor the surface, nor a price is given. NOTE: no own website or 2GIS listing could be found for this venue; the phone number in the source (+7 707 990-10-42) belongs to a Kazakh tour operator and has therefore not been entered as a contact. The absence of table tennis from the list does not guarantee that "tennis courts" means tennis proper.'
 WHERE id = 'solemar';

UPDATE courts SET description_en = 'A VIP village of cottages in Chok-Tal. Two independent directories (issykkul.biz and issykkul.com) list "two tennis courts" with equipment hire, and table tennis does not appear in the list — which argues for tennis proper. The grounds include a 25-metre mineral-water pool, with the beach 100 m away.

Services: "Two tennis courts, hire of sports and beach equipment" — equipment hire is confirmed. A 25-metre mineral-water pool, spa, conference services.

Season: summer. IMPORTANT: the issykkul.biz page carries a 2013 price list, so the description of the facilities may be ten years out of date as well; there is a real chance the courts are in poor condition or have already been built over. No source gives a rental price for the courts. The phone numbers are the directory''s general ones for issykkul.com and could not be confirmed as belonging to the venue.'
 WHERE id = 'solnyshko-vip';

UPDATE courts SET description_en = 'A state sports school for tennis and athletics named after S. Zhumanazarov. The office is at 59 Logvinenko Street; the outdoor courts are at 6 Tynystanov Street and 6 Maldybaev Street. The school trains young athletes: the age limit is 25. Equipment is not provided, and the courts are closed in winter.

Services: Classes for children and young people up to 25; equipment is NOT provided — bring your own. Closed in winter.

A seasonal venue. Age limit 25. No social media.'
 WHERE id = 'sportshkola-po-tennisu-i-legkoy-atletike-im-s-zh';

UPDATE courts SET description_en = 'The largest private tennis complex in central Bishkek, about 4,000 m². Hard courts under a roof, with an outdoor court and a fitness studio alongside. Open all year, daily 07:00-23:00.'
 WHERE id = 't-club';

UPDATE courts SET description_en = 'A tennis complex beside Panfilov Park, one of the oldest in Bishkek.'
 WHERE id = 'tay-breyk';

UPDATE courts SET description_en = 'The only confirmed tennis court in the city of Osh, according to 2GIS and the TennisCourtsMap directory. It is in Osh that the Tennis Federation of Kyrgyzstan has run the Osh Open international tournaments and junior events under ATF auspices since 2024 — in 2024 the first tournament of that scale in Osh since independence. No technical details have ever been published.

The tournaments take place in late April and early May, so the court is outdoor and seasonal. 2GIS lists it as a geographic object rather than an organisation — there is no listing with a phone number or prices. It has existed since at least 2013. Linking the Osh Open to this court is a reasoned conclusion, but no publication names the venue outright. The organiser is Nazar Karakozhoev, director of the tennis school.'
 WHERE id = 'tennisnyy-kort-osh';

UPDATE courts SET description_en = 'An object filed under "tennis court" on Yandex Maps in the village of Otuz-Adyr, Osh region. The listing is all but empty: no phone number, no opening hours, no photographs and no reviews. The only tennis venue found in the Osh region outside the city of Osh.

The listing is incomplete and unconfirmed by any independent source; it may be a school or village court. Needs checking on site.'
 WHERE id = 'tennisnyy-kort-otuz-adyr';

UPDATE courts SET description_en = 'A resort in Cholpon-Ata itself, on Aitmatov Alley. On the official site the list of sports facilities names a tennis court and table tennis as two separate entries, which confirms that this is tennis proper. There is also a private beach with a 150-metre pier, an outdoor pool, five-a-side football, basketball and volleyball.

Services: Listed separately are table tennis, volleyball and basketball courts, a five-a-side pitch, a gym, an open-air fitness area, a 15x8 m pool and a 150-metre pier.

Season: summer. The surface, the number of courts and the price are not published on the site; the court is probably free for guests or available for a small fee, but this is unconfirmed. The condition of the court has not been checked.'
 WHERE id = 'tri-korony';

UPDATE courts SET description_en = 'A standalone geographic point on 2GIS marked simply "Tennis court", in the central part of Cholpon-Ata near the shore. Two photographs are attached to the listing, but 2GIS gives no owner name, no phone number and no street address. By its coordinates the object sits in the resort belt on Zhuman Akimaliev Street, between the grounds of the Goluboy Issyk-Kul sanatorium (42.647386, 77.103279) and the shore.

It is most likely a court belonging to one of the resorts or sanatoria of the Cholpon-Ata resort belt — the likeliest candidate being the Goluboy Issyk-Kul sanatorium, whose beach lies alongside — but the attribution is NOT confirmed. Season: summer. Condition unknown. The 2GIS search pages return a 500 error to automated fetchers, so a full sweep of the "Tennis courts" category for Cholpon-Ata could not be carried out.'
 WHERE id = 'unnamed-tennis-court-cholpon-ata';


COMMIT;

-- ── ПРОВЕРКА ЧТЕНИЕМ БАЗЫ ──────────────────────────────────────────────
-- Ждём 30 строк, и ни в одной description_en не содержит кириллицы.

SELECT id, length(description) AS ru, length(description_en) AS en
  FROM courts
 WHERE description_en IS NOT NULL
 ORDER BY id;

-- Сколько опубликованных кортов осталось без английского описания.
-- Ждём 1 — `otshibnik`, у него пусто и по-русски.

SELECT count(*) AS bez_description_en
  FROM courts
 WHERE published_at IS NOT NULL
   AND (description_en IS NULL OR description_en = '' OR description_en ~ '[А-Яа-яЁё]');

-- Поимённо, если число разойдётся с ожидаемым:

SELECT id, left(coalesce(description, ''), 40) AS ru_nachalo
  FROM courts
 WHERE published_at IS NOT NULL
   AND (description_en IS NULL OR description_en = '' OR description_en ~ '[А-Яа-яЁё]')
 ORDER BY id;
