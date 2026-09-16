-- ============================================================
-- Тексты уведомлений на трёх языках
-- ============================================================
--
-- Всё, что платформа пишет человеку: телеграм-бот, письма, push,
-- колокольчик на сайте. Раньше каждая функция держала строки у себя, и
-- одно и то же сообщение в разных местах звучало по-разному.
--
-- Почему в базе, а не в коде: переводы вычитывают люди со стороны. Правку
-- в таблице видно сразу, а правка в коде означала бы выкладку пятнадцати
-- функций из-за одной запятой.
--
-- Язык человека лежит в profiles.lang. Нет перевода — берётся русский.
--
-- Запускать можно повторно: тексты перезаписываются по ключу.

BEGIN;

CREATE TABLE IF NOT EXISTS public.notification_texts (
  key  text PRIMARY KEY,
  ru   text NOT NULL,
  kg   text,
  en   text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notification_texts IS
  'Тексты уведомлений. ru обязателен, kg и en могут быть пустыми — тогда берётся русский.';

-- Читать может кто угодно: тексты не секрет, а функции ходят под сервисной
-- ролью. Писать — только через SQL, руками администратора
ALTER TABLE public.notification_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Тексты читают все" ON public.notification_texts;
CREATE POLICY "Тексты читают все" ON public.notification_texts
  FOR SELECT USING (true);

INSERT INTO public.notification_texts (key, ru, kg, en) VALUES
  ('link_ok', '{имя}ваш Telegram подключён к КСЛТ ✅

Сюда будут приходить приглашения на игру, вызовы и напоминания о членстве.', '{имя}Telegram КСЛТка туташтырылды ✅

Бул жерге оюнга чакыруулар, чакырыктар жана мүчөлүк тууралуу эскертүүлөр келет.', '{имя}your Telegram account has been connected to KSLT ✅

Game invitations, match challenges and membership reminders will be delivered here.'),
  ('link_bad', 'Ссылка не подходит. Нажмите «Подключить Telegram» в личном кабинете КСЛТ.', 'Шилтеме туура келбейт. КСЛТ жеке кабинетиңизден «Telegram туташтыруу» баскычын басыңыз.', 'This link is not valid. Please use the “Connect Telegram” button in your KSLT dashboard.'),
  ('link_error', 'Не получилось подключить аккаунт. Попробуйте ещё раз чуть позже.', 'Аккаунтту туташтыруу мүмкүн болбоду. Бир аздан кийин кайра аракет кылыңыз.', 'We were unable to connect your account. Please try again a little later.'),
  ('link_again', 'Ваш Telegram подключён к КСЛТ ✅

Вы будете получать уведомления о приглашениях на игру и напоминания здесь.', 'Telegram КСЛТка туташтырылды ✅

Оюнга чакыруулар жана эскертүүлөр ушул жерге келет.', 'Your Telegram account is connected to KSLT ✅

Game invitations and reminders will be delivered here.'),
  ('welcome', 'Добро пожаловать в KSLT Tennis Bot! 🎾

Чтобы подключить аккаунт, нажмите «Подключить Telegram» в личном кабинете:
{ссылка}', 'KSLT Tennis Ботуна кош келиңиз! 🎾

Аккаунтту туташтыруу үчүн жеке кабинеттен «Telegram туташтыруу» баскычын басыңыз:
{ссылка}', 'Welcome to the KSLT Tennis Bot 🎾

To connect your account, please press “Connect Telegram” in your dashboard:
{ссылка}'),
  ('unknown_cmd', 'Нажмите /start или подключите аккаунт через личный кабинет КСЛТ.

Команды:
/membership — заявка на членство
/notifications — настройки уведомлений', '/start басыңыз же аккаунтту КСЛТ жеке кабинети аркылуу туташтырыңыз.

Буйруктар:
/membership — мүчөлүккө арыз
/notifications — эскертүү жөндөөлөрү', 'Please press /start or connect your account from the KSLT dashboard.

Commands:
/membership — membership request
/notifications — notification settings'),
  ('link_first', 'Сначала привяжите Telegram к аккаунту КСЛТ:
{ссылка}', 'Адегенде Телеграмды КСЛТ аккаунтуна туташтырыңыз:
{ссылка}', 'Please connect Telegram to your KSLT account first:
{ссылка}'),
  ('link_via_dashboard', 'Привяжите Telegram к аккаунту КСЛТ через личный кабинет.', 'Телеграмды КСЛТ аккаунтуна жеке кабинет аркылуу туташтырыңыз.', 'Please connect Telegram to your KSLT account from your dashboard.'),
  ('invite_declined_you', 'Приглашение отклонено.', 'Чакыруу четке кагылды.', 'The invitation has been declined.'),
  ('invite_declined_sender', '{имя} отклонил(а) приглашение на игру.', '{имя} оюнга чакырууну четке какты.', '{имя} has declined your game invitation.'),
  ('mem_active', 'У вас уже есть активное членство КСЛТ до {дата} ✅', 'Сизде {дата} чейин жарактуу КСЛТ мүчөлүгү бар ✅', 'You already have an active KSLT membership, valid until {дата} ✅'),
  ('mem_pending', 'У вас уже есть активная заявка на рассмотрении. Ожидайте подтверждения.', 'Сизде каралып жаткан арыз бар. Ырастоону күтүңүз.', 'Your request is already under review. Please await confirmation.'),
  ('mem_unfinished', 'У вас есть незавершённая заявка. Отправьте скриншот чека об оплате.', 'Сизде аягына чыкпаган арыз бар. Төлөм чегинин скриншотун жөнөтүңүз.', 'You have an unfinished request. Please send a screenshot of the payment receipt.'),
  ('mem_price', '💰 К оплате: <b>{сумма} сом</b> за {месяцев} мес.

Реквизиты для оплаты:
{ссылка}

📸 Отправьте скриншот чека об оплате в этот чат.', '💰 Төлөөгө: <b>{сумма} сом</b> — {месяцев} ай.

Төлөм реквизиттери:
{ссылка}

📸 Төлөм чегинин скриншотун ушул чатка жөнөтүңүз.', '💰 Amount due: <b>{сумма} KGS</b> for {месяцев} months.

Payment details:
{ссылка}

📸 Please send a screenshot of the receipt to this chat.'),
  ('mem_sent', '✅ Заявка отправлена на рассмотрение. Ожидайте подтверждения.', '✅ Арыз каралууга жөнөтүлдү. Ырастоону күтүңүз.', '✅ Your request has been submitted for review. Please await confirmation.'),
  ('mem_approved', '✅ <b>Членство КСЛТ активировано!</b>

Действует до: {дата}
Добро пожаловать! 🎾', '✅ <b>КСЛТ мүчөлүгү жандырылды!</b>

{дата} чейин жарактуу
Кош келиңиз! 🎾', '✅ <b>Your KSLT membership has been activated.</b>

Valid until: {дата}
Welcome to the club 🎾'),
  ('mem_rejected', '❌ Заявка на членство отклонена.

Обратитесь к менеджеру для уточнения.', '❌ Мүчөлүккө арыз четке кагылды.

Тактоо үчүн менеджерге кайрылыңыз.', '❌ Your membership request has been declined.

Please contact the manager for further details.'),
  ('trn_accepted', '✅ <b>Заявка принята</b>

🏆 {турнир}

Вы в основной сетке.', '✅ <b>Арыз кабыл алынды</b>

🏆 {турнир}

Сиз негизги торчодосуз.', '✅ <b>Entry accepted</b>

🏆 {турнир}

You have been placed in the main draw.'),
  ('trn_pending', '⏳ <b>Заявка принята — на рассмотрении</b>

🏆 {турнир}

{причина}', '⏳ <b>Арыз кабыл алынды — каралууда</b>

🏆 {турнир}

{причина}', '⏳ <b>Entry received — under review</b>

🏆 {турнир}

{причина}'),
  ('trn_blocked', '⛔ <b>Заявка не принята</b>

🏆 {турнир}

{причина}', '⛔ <b>Арыз кабыл алынган жок</b>

🏆 {турнир}

{причина}', '⛔ <b>Entry not accepted</b>

🏆 {турнир}

{причина}'),
  ('trn_admin_decides', 'Решение примет администратор.', 'Чечимди администратор кабыл алат.', 'The administrator will make the decision.'),
  ('trn_rules', 'Вы не проходите по правилам допуска.', 'Сиз катышуу эрежелерине туура келбейсиз.', 'You do not meet the entry requirements.'),
  ('mail_otp_subject', 'Код подтверждения КСЛТ', 'КСЛТ ырастоо коду', 'KSLT verification code'),
  ('mail_otp_body', 'Ваш код для {действие}:

{код}

Код действителен 10 минут.
Если вы не запрашивали код — не обращайте внимания на это письмо.', '{действие} үчүн кодуңуз:

{код}

Код 10 мүнөт жарактуу.
Эгер сиз код сурабаган болсоңуз, бул катка көңүл бурбаңыз.', 'Your code for {действие}:

{код}

The code is valid for 10 minutes.
If you did not request it, please disregard this email.'),
  ('mail_otp_flow_register', 'регистрации', 'катталуу', 'registration'),
  ('mail_otp_flow_forgot', 'сброса пароля', 'сыр сөздү калыбына келтирүү', 'password reset'),
  ('mail_mem_ok_subject', 'Членство КСЛТ активировано', 'КСЛТ мүчөлүгү жандырылды', 'Your KSLT membership has been activated'),
  ('mail_mem_ok_body', '{имя}, ваше членство КСЛТ активировано.

📅 Действует до: {дата}

Теперь вам доступны все возможности клуба: рейтинг, вызовы на матч, скидки у партнёров.', '{имя}, КСЛТ мүчөлүгүңүз жандырылды.

📅 {дата} чейин жарактуу

Эми клубдун бардык мүмкүнчүлүктөрү ачык: рейтинг, матчка чакырыктар, өнөктөштөрдөн арзандатуулар.', '{имя}, your KSLT membership has been activated.

📅 Valid until: {дата}

You now have access to all club benefits: the rating, match challenges and partner discounts.'),
  ('mail_mem_soon_subject', '⏰ Членство КСЛТ истекает через 7 дней', '⏰ КСЛТ мүчөлүгүңүз 7 күндөн кийин бүтөт', '⏰ Your KSLT membership expires in 7 days'),
  ('mail_mem_soon_body', 'Здравствуйте, {имя}.

Ваше членство КСЛТ истекает {дата}.

Для продления оплатите {сумма} сом за месяц.', 'Саламатсызбы, {имя}.

КСЛТ мүчөлүгүңүз {дата} бүтөт.

Узартуу үчүн айына {сумма} сом төлөңүз.', 'Dear {имя},

Your KSLT membership expires on {дата}.

To renew, please pay {сумма} KGS per month.'),
  ('mail_mem_end_subject', '❌ Членство КСЛТ истекло', '❌ КСЛТ мүчөлүгү бүттү', '❌ Your KSLT membership has expired'),
  ('mail_mem_end_body', '{имя}, ваше членство КСЛТ истекло.

Для продления воспользуйтесь Telegram-ботом или оплатите на сайте.', '{имя}, КСЛТ мүчөлүгүңүз бүттү.

Узартуу үчүн Telegram-ботту колдонуңуз же сайттан төлөңүз.', '{имя}, your KSLT membership has expired.

To renew, please use the Telegram bot or pay on the website.'),
  ('mail_invite_subject', '🎾 Приглашение на игру от {имя}', '🎾 {имя} оюнга чакырат', '🎾 Game invitation from {имя}'),
  ('mail_invite_body', 'Примите приглашение — и вы обменяетесь контактами.

Ответить можно в приложении или в личном кабинете.', 'Чакырууну кабыл алыңыз — ошондо байланыш маалыматтарыңыз менен алмашасыздар.

Жооп берүү колдонмодон же жеке кабинеттен мүмкүн.', 'Accept the invitation and you will exchange contact details.

You may reply in the app or in your dashboard.'),
  ('mail_invite_yes', 'Откройте кабинет — там его контакты. Дальше договоритесь сами.', 'Жеке кабинетти ачыңыз — анда анын байланыштары бар. Андан ары өзүңүз макулдашасыздар.', 'Open your dashboard to find their contact details and arrange the game.'),
  ('mail_invite_no', 'Ничего страшного — предложите игру другому.', 'Кам санабаңыз — оюнду башка бирөөгө сунуштаңыз.', 'Not a problem — you may offer the game to someone else.'),
  ('mail_challenge_subject', '🔥 Вызов на матч от {имя}', '🔥 {имя} матчка чакырат', '🔥 Match challenge from {имя}'),
  ('mail_challenge_body', '📅 {дата} ⏰ {время}
📍 {место}

Ответить можно в приложении или в личном кабинете.', '📅 {дата} ⏰ {время}
📍 {место}

Жооп берүү колдонмодон же жеке кабинеттен мүмкүн.', '📅 {дата} ⏰ {время}
📍 {место}

You may reply in the app or in your dashboard.'),
  ('mail_trn_open_subject', '🎾 Регистрация открыта: {турнир}', '🎾 Катталуу ачылды: {турнир}', '🎾 Registration is open: {турнир}'),
  ('mail_trn_soon_subject', '🔔 Турнир {когда}: {турнир}', '🔔 Турнир {когда}: {турнир}', '🔔 Tournament {когда}: {турнир}'),
  ('mail_trn_soon_body', 'Здравствуйте, {имя}.

Вы записаны на турнир:
📅 {даты}
📍 {место}', 'Саламатсызбы, {имя}.

Сиз турнирге катталгансыз:
📅 {даты}
📍 {место}', 'Dear {имя},

You are entered in the tournament:
📅 {даты}
📍 {место}'),
  ('mail_schedule_subject', '📋 Расписание: {турнир}', '📋 Жадыбал: {турнир}', '📋 Schedule: {турнир}'),
  ('mail_match_soon_subject', '🎾 Ваш матч скоро: {турнир}', '🎾 Матчыңыз жакында: {турнир}', '🎾 Your match is coming up: {турнир}'),
  ('mail_security_subject', 'Безопасность аккаунта КСЛТ', 'КСЛТ аккаунтунун коопсуздугу', 'KSLT account security'),
  ('mail_security_body', '{имя}, здравствуйте.

В вашей учётной записи произошло изменение.

Если это были вы — ничего делать не нужно. Если нет — сразу смените пароль.', 'Саламатсызбы, {имя}.

Аккаунтуңузда өзгөрүү болду.

Эгер бул сиз болсоңуз — эч нерсе кылуунун кажети жок. Эгер сиз эмес болсоңуз — сыр сөздү дароо алмаштырыңыз.', 'Dear {имя},

A change has been made to your account.

If this was you, no action is required. If it was not, please change your password immediately.'),
  ('mail_dispute_subject', 'КСЛТ · спорный счёт матча', 'КСЛТ · талаштуу матч эсеби', 'KSLT · disputed match score'),
  ('mail_trn_when_3days', 'через 3 дня', '3 күндөн кийин', 'in 3 days'),
  ('mail_trn_when_tomorrow', 'завтра', 'эртең', 'tomorrow'),
  ('mail_trn_start', 'Начало', 'Башталышы', 'Start'),
  ('mail_trn_good_luck', 'Удачи на корте! 🎾', 'Кортто ийгилик! 🎾', 'Good luck on court 🎾'),
  ('mail_trn_queue_note', 'Ваши игры отмечены ▶. Точно ко времени идут первые запуски — по числу кортов. Дальше время ориентировочное: игра начнётся, как освободится корт.', 'Сиздин оюндарыңыз ▶ менен белгиленген. Так убагында биринчи чыгуулар башталат — корттордун санына жараша. Андан ары убакыт болжолдуу: корт бошогондо оюн башталат.', 'Your matches are marked with ▶. Only the first round starts exactly on time — as many matches as there are courts. Later times are approximate: a match begins once a court is free.'),
  ('invite_title', 'Приглашение на игру', 'Оюнга чакыруу', 'Game invitation'),
  ('invite_short', '{имя} предлагает сыграть в теннис', '{имя} теннис ойноону сунуштайт', '{имя} invites you to play tennis'),
  ('invite_tg', '🎾 <b>Приглашение на игру</b>

{имя} предлагает вам сыграть в теннис.

Откройте приложение или сайт, чтобы принять или отклонить.', '🎾 <b>Оюнга чакыруу</b>

{имя} сизге теннис ойноону сунуштайт.

Кабыл алуу же четке кагуу үчүн колдонмону же сайтты ачыңыз.', '🎾 <b>Game invitation</b>

{имя} invites you to play tennis.

Open the app or the website to accept or decline.'),
  ('btn_open_invite', '🎾 Открыть приглашение', '🎾 Чакырууну ачуу', '🎾 Open the invitation'),
  ('btn_open_dashboard', '🎾 Открыть кабинет', '🎾 Жеке кабинетти ачуу', '🎾 Open dashboard'),
  ('challenge_title', 'Вызов на матч', 'Матчка чакырык', 'Match challenge'),
  ('challenge_short', '{имя} вызывает вас на матч', '{имя} сизди матчка чакырат', '{имя} has challenged you to a match'),
  ('challenge_tg', '🔥 <b>Вызов на матч</b>

{имя} вызывает вас на баттл.', '🔥 <b>Матчка чакырык</b>

{имя} сизди баттлга чакырат.', '🔥 <b>Match challenge</b>

{имя} has challenged you to a battle.'),
  ('challenge_tg_tail', 'Принять или отклонить — в личном кабинете КСЛТ.', 'Кабыл алуу же четке кагуу — КСЛТ жеке кабинетинде.', 'Accept or decline in your KSLT dashboard.'),
  ('challenge_with_message', '{имя} вызывает вас на баттл: «{сообщение}»', '{имя} сизди баттлга чакырат: «{сообщение}»', '{имя} has challenged you to a battle: “{сообщение}”'),
  ('challenge_no_message', '{имя} вызывает вас на баттл', '{имя} сизди баттлга чакырат', '{имя} has challenged you to a battle'),
  ('invite_accepted_title', 'Приглашение принято', 'Чакыруу кабыл алынды', 'Invitation accepted'),
  ('invite_declined_title', 'Приглашение отклонено', 'Чакыруу четке кагылды', 'Invitation declined'),
  ('invite_accepted_text', '{имя} принял ваше приглашение сыграть. Откройте кабинет — там его контакты.', '{имя} оюнга чакырууңузду кабыл алды. Жеке кабинетти ачыңыз — анда анын байланыштары бар.', '{имя} has accepted your game invitation. Open your dashboard to find their contact details.'),
  ('invite_declined_text', '{имя} отказался от игры.', '{имя} оюндан баш тартты.', '{имя} has declined the game.'),
  ('challenge_accepted_title', 'Вызов принят', 'Чакырык кабыл алынды', 'Challenge accepted'),
  ('challenge_declined_title', 'Вызов отклонён', 'Чакырык четке кагылды', 'Challenge declined'),
  ('challenge_accepted_text', '{имя} принял ваш вызов.', '{имя} чакырыгыңызды кабыл алды.', '{имя} has accepted your challenge.'),
  ('challenge_declined_text', '{имя} отклонил ваш вызов.', '{имя} чакырыгыңызды четке какты.', '{имя} has declined your challenge.'),
  ('match_soon_title', 'Ваш матч скоро', 'Матчыңыз жакында', 'Your match is coming up'),
  ('match_soon_tg', '🎾 <b>Ваш матч скоро!</b>', '🎾 <b>Матчыңыз жакында!</b>', '🎾 <b>Your match is coming up</b>'),
  ('match_good_luck', '💪 Удачи!', '💪 Ийгилик!', '💪 Good luck'),
  ('match_court_tbd', 'корт уточняется', 'корт такталууда', 'court to be confirmed'),
  ('match_launch_short', 'запуск №{номер}', '№{номер} чыгуу', 'wave {номер}'),
  ('trn_reg_open_tg', '🎾 <b>Регистрация открыта!</b>', '🎾 <b>Катталуу ачылды!</b>', '🎾 <b>Registration is open</b>'),
  ('btn_register', '✅ Записаться', '✅ Катталуу', '✅ Enter'),
  ('btn_site', '🔗 На сайт', '🔗 Сайтка', '🔗 Website')
ON CONFLICT (key) DO UPDATE
  SET ru = EXCLUDED.ru,
      kg = EXCLUDED.kg,
      en = EXCLUDED.en,
      updated_at = now();

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================

SELECT count(*) AS всего FROM public.notification_texts;
-- Ожидаем 78.

SELECT count(*) AS без_кыргызского FROM public.notification_texts WHERE kg IS NULL OR kg = '';
SELECT count(*) AS без_английского  FROM public.notification_texts WHERE en IS NULL OR en = '';

-- Посмотреть любой текст:
-- SELECT * FROM public.notification_texts WHERE key = 'link_ok';
