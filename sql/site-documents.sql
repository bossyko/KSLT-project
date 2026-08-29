-- ============================================================
-- Правовые документы — один текст на сайт и приложение
-- ============================================================
--
-- Условия использования, политика конфиденциальности и публичная оферта
-- лежали текстом прямо в разметке страниц: три документа на трёх языках,
-- девять копий. Правка означала девять правок и выкладку сайта, а в
-- приложении их не было вовсе — на экране регистрации ссылки уводили в
-- браузер, наружу.
--
-- Магазины на это смотрят: политика должна открываться внутри приложения.
--
-- Теперь текст живёт здесь. Правишь один раз — меняется и на сайте, и в
-- приложении, без выкладки и без новой сборки.
--
-- Хранится размеченным текстом, как и было на страницах: списки,
-- заголовки, выделения. Писать может только персонал клуба.
--
-- Файл меняет базу. Читающие запросы — в site-documents-check.sql.

CREATE TABLE IF NOT EXISTS public.site_documents (
    slug        text PRIMARY KEY,
    title       text,
    title_en    text,
    title_kg    text,
    body        text,
    body_en     text,
    body_kg     text,
    updated_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.site_documents IS
    'Условия, политика, оферта. Читают сайт и приложение, правит персонал.';

ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "документы видно всем" ON public.site_documents;
CREATE POLICY "документы видно всем"
    ON public.site_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "документы меняет персонал" ON public.site_documents;
CREATE POLICY "документы меняет персонал"
    ON public.site_documents FOR ALL
    USING (is_staff()) WITH CHECK (is_staff());

DROP TRIGGER IF EXISTS site_documents_touch ON public.site_documents;
CREATE TRIGGER site_documents_touch
    BEFORE UPDATE ON public.site_documents
    FOR EACH ROW EXECUTE FUNCTION public.site_content_touch();

-- ---- Что сейчас на страницах, то и кладём ----
-- Взято со страниц слово в слово, чтобы после перехода ничего не менялось.

INSERT INTO public.site_documents (slug, title, body, title_en, body_en, title_kg, body_kg) VALUES
    ('terms', 'Условия использования', '<div class="ip-draft-note ip-fade-in">
                <span class="ip-draft-note-icon">📝</span>
                <span class="ip-draft-note-text"><strong>Это проект документа.</strong> Он составлен по тому, как платформа работает сейчас, и вступит в силу после проверки и утверждения руководством КСЛТ.</span>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">1. Общие <span>положения</span></h2>
                <p class="ip-about-text">
                    КСЛТ — Кыргызстанское Сообщество Любителей Тенниса — предоставляет платформу для любительского тенниса: сайт и мобильное приложение. Настоящие Условия описывают, как ею пользоваться.
                </p>
                <p class="ip-about-text">
                    Начиная пользоваться платформой — регистрируясь, заходя в личный кабинет или подавая заявку на турнир, — вы соглашаетесь с этими Условиями. Если вы с ними не согласны, пользоваться платформой не следует.
                </p>
                <p class="ip-about-text">
                    Условия дополняются <a href="rules.html">Правилами КСЛТ</a>, которые описывают порядок проведения турниров и рейтинг, <a href="offer.html">Публичной офертой</a>, которая регулирует оплату услуг, и <a href="privacy-policy.html">Политикой конфиденциальности</a>, которая описывает обращение с персональными данными.
                </p>
                <p class="ip-about-text">
                    Платформа доступна лицам, достигшим 14 лет. Участие в рейтинговых турнирах КСЛТ регулируется отдельно — см. Правила, раздел «Категории и уровни турниров».
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">2. Учётная запись</h2>
                <p class="ip-about-text">
                    Для части возможностей нужна регистрация: заявка на турнир, личный кабинет, вызовы на баттлы, уведомления.
                </p>
                <p class="ip-about-text">
                    Регистрируясь, вы указываете достоверные данные о себе. Профиль игрока виден другим участникам сообщества — это часть смысла платформы: соперника нужно знать в лицо.
                </p>
                <p class="ip-about-text">
                    Один человек — одна учётная запись. Создание нескольких учётных записей одним лицом запрещено: рейтинг строится на том, что за именем стоит конкретный игрок.
                </p>
                <p class="ip-about-text">
                    Вы отвечаете за сохранность пароля и за все действия, совершённые под вашей учётной записью. Если вы подозреваете, что доступ получил кто-то ещё, смените пароль и сообщите администрации.
                </p>
                <p class="ip-about-text">
                    КСЛТ отправляет уведомление, когда в учётную запись заходят с нового устройства.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">3. Членство и оплата</h2>
                <p class="ip-about-text">
                    Часть возможностей доступна только членам КСЛТ. Что именно даёт членство, описано на странице <a href="pricing.html">Цены</a> и в <a href="faq.html">FAQ</a>.
                </p>
                <p class="ip-about-text">
                    Размеры взносов устанавливает руководство КСЛТ. Действующие суммы публикуются на странице Цены.
                </p>
                <p class="ip-about-text">
                    Порядок оплаты, оказания услуг и отказа от договора регулируется <a href="offer.html">Публичной офертой</a>.
                </p>
                <p class="ip-about-text">
                    Членство действует в оплаченный период. Порядок приостановки и прекращения членства описан в <a href="rules.html#rules-membership">Правилах, раздел 02</a>.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">4. Турниры и результаты</h2>
                <p class="ip-about-text">
                    Заявка на турнир не означает автоматического включения в сетку: она может попасть в основную сетку, в лист ожидания либо быть отклонена — по правилам конкретного турнира и с учётом рейтинга.
                </p>
                <p class="ip-about-text">
                    КСЛТ вправе отменить, перенести или изменить формат турнира по организационным причинам, уведомив участников.
                </p>
                <p class="ip-about-text">
                    Результаты матчей, начисленные очки и место в рейтинге определяются по <a href="rules.html#rules-ranking">Правилам</a>. Спорные ситуации разбирает главный судья турнира.
                </p>
                <p class="ip-about-text">
                    Результаты матчей, рейтинг и статистика игрока публикуются открыто — в этом смысл рейтинговой системы.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">5. Правила поведения</h2>
                <p class="ip-about-text">
                    Уважительное отношение к другим участникам, судьям и организаторам обязательно — и на корте, и в разделах платформы.
                </p>
                <p class="ip-about-text">
                    Запрещены оскорбления, травля, дискриминация и распространение чужих персональных данных.
                </p>
                <p class="ip-about-text">
                    Запрещены спам, реклама без согласования с КСЛТ, а также автоматизированный сбор данных с платформы.
                </p>
                <p class="ip-about-text">
                    Запрещено выдавать себя за другого человека или за представителя КСЛТ.
                </p>
                <p class="ip-about-text">
                    За нарушение этих правил доступ к платформе может быть ограничен временно или постоянно. Нарушения во время матчей разбираются по <a href="rules.html#rules-conduct">дисциплинарному положению</a>.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">6. Содержимое платформы</h2>
                <p class="ip-about-text">
                    Дизайн, программный код, тексты, логотип и оформление КСЛТ принадлежат КСЛТ. Использовать их без письменного согласия нельзя.
                </p>
                <p class="ip-about-text">
                    Загружая фотографию профиля или иные материалы, вы подтверждаете, что имеете на это право, и разрешаете КСЛТ показывать их на платформе — в профиле, сетках турниров, рейтинге и материалах о турнирах.
                </p>
                <p class="ip-about-text">
                    Вы в любой момент можете заменить или удалить загруженную фотографию в личном кабинете.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">7. Ответственность</h2>
                <p class="ip-about-text">
                    Теннис — физическая активность, и участие в играх и турнирах вы принимаете на себя добровольно. КСЛТ не несёт ответственности за травмы и вред здоровью, полученные во время игры, тренировки или нахождения на территории кортов.
                </p>
                <p class="ip-about-text">
                    КСЛТ не отвечает за качество услуг третьих лиц — кортов, тренеров, спортивных комплексов, — с которыми вы договариваетесь напрямую.
                </p>
                <p class="ip-about-text">
                    Платформа предоставляется «как есть». Мы стараемся, чтобы она работала без перебоев, но не гарантируем полного отсутствия сбоев и перерывов в работе.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">8. Удаление учётной записи</h2>
                <p class="ip-about-text">
                    Вы можете удалить учётную запись в личном кабинете или по запросу к администрации КСЛТ.
                </p>
                <p class="ip-about-text">
                    После удаления профиль перестаёт быть доступен другим участникам. Сыгранные матчи и турнирные результаты остаются в истории турниров: они являются частью спортивных результатов других участников, и удалить их, не исказив чужой рейтинг, невозможно.
                </p>
                <p class="ip-about-text">
                    Порядок обращения с персональными данными после удаления описан в <a href="privacy-policy.html">Политике конфиденциальности</a>.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">9. Изменения условий</h2>
                <p class="ip-about-text">
                    КСЛТ вправе изменять настоящие Условия. Действующая редакция публикуется на этой странице с датой.
                </p>
                <p class="ip-about-text">
                    О существенных изменениях мы сообщаем заранее — уведомлением в приложении или на сайте.
                </p>
                <p class="ip-about-text">
                    Продолжая пользоваться платформой после вступления изменений в силу, вы принимаете новую редакцию.
                </p>
            </div>

            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">10. Связь с нами</h2>
                <p class="ip-about-text">
                    Вопросы по настоящим Условиям, жалобы и обращения — на почту <a href="mailto:info@tennis.kg">info@tennis.kg</a> либо через контакты, указанные внизу страницы.
                </p>
            </div>', 'Terms of Service', '<!-- 1. General Provisions -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">1. General <span>Provisions</span></h2>
                <p class="ip-about-text">
                    KSLT (Kyrgyzstan Social Lawn Tennis) provides a platform (website and mobile application) for the tennis community of Kyrgyzstan.
                </p>
                <p class="ip-about-text">
                    By using the platform, you agree to these terms.
                </p>
                <p class="ip-about-text">
                    The platform is available to persons aged 13 and older.
                </p>
            </div>

            <!-- 2. Registration and Account -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">2. Registration and <span>Account</span></h2>
                <p class="ip-about-text">
                    Full access to platform features requires registration (via email, Google, or Telegram).
                </p>
                <p class="ip-about-text">
                    Users must provide accurate information during registration.
                </p>
                <p class="ip-about-text">
                    Users are responsible for the security of their login credentials.
                </p>
                <p class="ip-about-text">
                    One person = one account. Creating multiple accounts is prohibited.
                </p>
            </div>

            <!-- 3. KSLT Membership -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">3. KSLT <span>Membership</span></h2>
                <p class="ip-about-text">
                    Membership provides extended access to platform features.
                </p>
                <p class="ip-about-text">
                    Membership fees are determined by the current pricing plan and are non-refundable.
                </p>
                <p class="ip-about-text">
                    KSLT reserves the right to modify membership terms with prior notice.
                </p>
            </div>

            <!-- 4. Tournaments and Competitions -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">4. Tournaments and <span>Competitions</span></h2>
                <p class="ip-about-text">
                    Participation in tournaments is governed by KSLT rules.
                </p>
                <p class="ip-about-text">
                    Tournament registration is confirmed by an administrator.
                </p>
                <p class="ip-about-text">
                    KSLT may cancel or reschedule a tournament for organizational reasons.
                </p>
                <p class="ip-about-text">
                    Results and ranking points are determined by the KSLT ranking system.
                </p>
            </div>

            <!-- 5. Code of Conduct -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">5. Code of <span>Conduct</span></h2>
                <p class="ip-about-text">
                    Respectful treatment of other community members is required.
                </p>
                <p class="ip-about-text">
                    Insults, discrimination, and spam are prohibited.
                </p>
                <p class="ip-about-text">
                    The use of bots and automated systems is prohibited.
                </p>
                <p class="ip-about-text">
                    Violations may result in temporary or permanent account suspension.
                </p>
            </div>

            <!-- 6. Intellectual Property -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">6. Intellectual <span>Property</span></h2>
                <p class="ip-about-text">
                    All platform materials (design, code, content) are the property of KSLT.
                </p>
                <p class="ip-about-text">
                    Users grant KSLT the right to use uploaded photos and data for the operation of the platform.
                </p>
            </div>

            <!-- 7. Limitation of Liability -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">7. Limitation of <span>Liability</span></h2>
                <p class="ip-about-text">
                    KSLT is not liable for injuries sustained during sports activities.
                </p>
                <p class="ip-about-text">
                    The platform is provided "as is" without guarantees of uninterrupted operation.
                </p>
                <p class="ip-about-text">
                    KSLT is not responsible for the actions of third parties (coaches, court owners).
                </p>
            </div>

            <!-- 8. Account Deletion -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">8. Account <span>Deletion</span></h2>
                <p class="ip-about-text">
                    Users may delete their account through profile settings.
                </p>
                <p class="ip-about-text">
                    Upon deletion, all personal data is permanently removed.
                </p>
                <p class="ip-about-text">
                    Ranking history may be retained in anonymized form.
                </p>
            </div>

            <!-- 9. Changes to Terms -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">9. Changes to <span>Terms</span></h2>
                <p class="ip-about-text">
                    KSLT will notify users of changes to these terms via the app and website.
                </p>
                <p class="ip-about-text">
                    Continued use of the platform after changes constitutes acceptance of the updated terms.
                </p>
            </div>

            <!-- 10. Contact -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">10. <span>Contact</span></h2>
                <p class="ip-about-text">
                    For any questions regarding these terms of service, please contact us at: <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>
                </p>
                <p class="ip-about-text">
                    Bishkek, Kyrgyzstan
                </p>
                <p class="ip-about-text" style="margin-top: 32px; opacity: 0.6;">
                    Effective date: July 21, 2026
                </p>
            </div>', 'Колдонуу шарттары', '<!-- 1. Жалпы жоболор -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">1. Жалпы <span>жоболор</span></h2>
                <p class="ip-about-text">
                    KSLT (Kyrgyzstan Social Lawn Tennis) Кыргызстандын теннис коомчулугу үчүн платформаны (сайт жана мобилдик тиркеме) сунуштайт.
                </p>
                <p class="ip-about-text">
                    Платформаны колдонуу ушул шарттар менен макулдугуңузду билдирет.
                </p>
                <p class="ip-about-text">
                    Платформа 13 жаштан жогорку адамдар үчүн жеткиликтүү.
                </p>
            </div>

            <!-- 2. Каттоо жана аккаунт -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">2. Каттоо жана <span>аккаунт</span></h2>
                <p class="ip-about-text">
                    Платформанын бардык функцияларына толук кирүү үчүн каттоо зарыл (email, Google же Telegram аркылуу).
                </p>
                <p class="ip-about-text">
                    Колдонуучу каттоодо так маалыматтарды берүүгө милдеттүү.
                </p>
                <p class="ip-about-text">
                    Колдонуучу өзүнүн каттоо маалыматтарынын коопсуздугуна жооптуу.
                </p>
                <p class="ip-about-text">
                    Бир адам = бир аккаунт. Бир нече аккаунт түзүүгө тыюу салынат.
                </p>
            </div>

            <!-- 3. KSLT мүчөлүгү -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">3. KSLT <span>мүчөлүгү</span></h2>
                <p class="ip-about-text">
                    Мүчөлүк платформанын кеңейтилген функцияларына кирүү мүмкүнчүлүгүн берет.
                </p>
                <p class="ip-about-text">
                    Мүчөлүк төлөмдөр учурдагы тариф менен аныкталат жана кайтарылбайт.
                </p>
                <p class="ip-about-text">
                    KSLT алдын ала кабарлоо менен мүчөлүк шарттарын өзгөртүү укугуна ээ.
                </p>
            </div>

            <!-- 4. Мелдештер жана сынактар -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">4. Мелдештер жана <span>сынактар</span></h2>
                <p class="ip-about-text">
                    Мелдештерге катышуу KSLT эрежелери менен жөнгө салынат.
                </p>
                <p class="ip-about-text">
                    Мелдешке каттоо администратор тарабынан тастыкталат.
                </p>
                <p class="ip-about-text">
                    KSLT уюштуруу себептери боюнча мелдешти жокко чыгарууга же жылдырууга укуктуу.
                </p>
                <p class="ip-about-text">
                    Жыйынтыктар жана рейтинг упайлары KSLT рейтинг тутуму менен аныкталат.
                </p>
            </div>

            <!-- 5. Жүрүм-турум эрежелери -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">5. Жүрүм-турум <span>эрежелери</span></h2>
                <p class="ip-about-text">
                    Жамааттын башка катышуучуларына урматтуу мамиле.
                </p>
                <p class="ip-about-text">
                    Кордоо, кемсинтүү, спам тыюу салынат.
                </p>
                <p class="ip-about-text">
                    Ботторду жана автоматташтырылган тутумдарды колдонууга тыюу салынат.
                </p>
                <p class="ip-about-text">
                    Эрежелерди бузуу аккаунтту убактылуу же туруктуу бөгөттөөгө алып келиши мүмкүн.
                </p>
            </div>

            <!-- 6. Интеллектуалдык менчик -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">6. Интеллектуалдык <span>менчик</span></h2>
                <p class="ip-about-text">
                    Платформанын бардык материалдары (дизайн, код, мазмун) KSLTге таандык.
                </p>
                <p class="ip-about-text">
                    Колдонуучу жүктөлгөн сүрөттөрдү жана маалыматтарды платформанын иши үчүн колдонууга KSLT укук берет.
                </p>
            </div>

            <!-- 7. Жоопкерчиликти чектөө -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">7. Жоопкерчиликти <span>чектөө</span></h2>
                <p class="ip-about-text">
                    KSLT спорт менен алектенүүдө алынган жаракаттар үчүн жоопкерчилик тартпайт.
                </p>
                <p class="ip-about-text">
                    Платформа үзгүлтүксүз иштөө кепилдиги жок "болгону боюнча" сунушталат.
                </p>
                <p class="ip-about-text">
                    KSLT үчүнчү жактардын (машыктыруучулар, корт ээлери) аракеттери үчүн жооп бербейт.
                </p>
            </div>

            <!-- 8. Аккаунтту жок кылуу -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">8. Аккаунтту <span>жок кылуу</span></h2>
                <p class="ip-about-text">
                    Колдонуучу профиль жөндөөлөрү аркылуу аккаунтту жок кыла алат.
                </p>
                <p class="ip-about-text">
                    Жок кылууда бардык жеке маалыматтар кайтарылгыс түрдө өчүрүлөт.
                </p>
                <p class="ip-about-text">
                    Рейтинг тарыхы анонимдештирилген түрдө сакталышы мүмкүн.
                </p>
            </div>

            <!-- 9. Шарттарды өзгөртүү -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">9. Шарттарды <span>өзгөртүү</span></h2>
                <p class="ip-about-text">
                    KSLT шарттардын өзгөрүшү жөнүндө тиркеме жана сайт аркылуу кабарлайт.
                </p>
                <p class="ip-about-text">
                    Өзгөрүүлөрдөн кийин платформаны колдонууну улантуу жаңы шарттар менен макулдугуңузду билдирет.
                </p>
            </div>

            <!-- 10. Байланыш -->
            <div class="ip-about-section ip-fade-in">
                <h2 class="ip-about-section-title">10. <span>Байланыш</span></h2>
                <p class="ip-about-text">
                    Колдонуу шарттарына байланыштуу бардык суроолор боюнча байланышыңыз: <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>
                </p>
                <p class="ip-about-text">
                    Бишкек, Кыргызстан
                </p>
                <p class="ip-about-text" style="margin-top: 32px; opacity: 0.6;">
                    Күчүнө кирген күнү: 2026-жылдын 21-июлу
                </p>
            </div>'),
    ('privacy', 'Политика конфиденциальности', '<!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;">Настоящая Политика конфиденциальности определяет порядок сбора, хранения, обработки и защиты персональных данных пользователей сайта <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a> и мобильного приложения KSLT Tennis (далее совместно — «Сервис»). Используя Сервис, вы соглашаетесь с условиями настоящей Политики.</p>
            </div>

            <!-- Table of Contents -->
            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Содержание</div>
                <ol class="ip-toc-list">
                    <li><a href="#pp-general">Общие положения</a></li>
                    <li><a href="#pp-data-collected">Какие данные мы собираем</a></li>
                    <li><a href="#pp-data-purposes">Цели обработки данных</a></li>
                    <li><a href="#pp-third-parties">Третьи стороны</a></li>
                    <li><a href="#pp-storage">Хранение и защита данных</a></li>
                    <li><a href="#pp-user-rights">Права пользователя</a></li>
                    <li><a href="#pp-cookies">Cookies и аналитика</a></li>
                    <li><a href="#pp-changes">Изменения политики</a></li>
                    <li><a href="#pp-contacts">Контактная информация</a></li>
                </ol>
            </div>

            <!-- Section 1: Общие положения -->
            <div class="ip-rules-section ip-fade-in" id="pp-general">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Общие положения
                </h2>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> Оператором персональных данных является КСЛТ (Кыргызстанское Сообщество Любителей Тенниса) — любительское теннисное сообщество, зарегистрированное в г. Бишкек, Кыргызская Республика.</p>
                    <p><strong>1.2.</strong> Настоящая Политика конфиденциальности распространяется на все персональные данные, которые Оператор может получить от Пользователя при использовании сайта <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a> и мобильного приложения KSLT Tennis.</p>
                    <p><strong>1.3.</strong> Регистрация на сайте или в приложении, а также использование Сервиса означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки персональных данных.</p>
                    <p><strong>1.4.</strong> В случае несогласия с условиями Политики конфиденциальности Пользователь должен прекратить использование Сервиса и запросить удаление своего аккаунта.</p>
                </div>
            </div>

            <!-- Section 2: Какие данные собираем -->
            <div class="ip-rules-section ip-fade-in" id="pp-data-collected">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Какие данные мы собираем
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> При регистрации и использовании Сервиса мы собираем следующие данные:</p>
                    <p style="padding-left:20px;"><strong>2.1.1.</strong> <strong>Адрес электронной почты (email)</strong> — обязательно. Используется для создания аккаунта и авторизации.</p>
                    <p style="padding-left:20px;"><strong>2.1.2.</strong> <strong>Имя и фамилия</strong> — обязательно. Используется для идентификации в системе, отображения в рейтинге и на турнирах.</p>
                    <p style="padding-left:20px;"><strong>2.1.3.</strong> <strong>Номер телефона</strong> — опционально. Может использоваться для связи по вопросам участия в турнирах.</p>
                    <p style="padding-left:20px;"><strong>2.1.4.</strong> <strong>Фото профиля (аватар)</strong> — опционально. Загружается пользователем для персонализации профиля.</p>
                    <p style="padding-left:20px;"><strong>2.1.5.</strong> <strong>Рейтинговые данные</strong> — очки, результаты матчей, статистика побед и поражений, категория игрока. Формируются автоматически в ходе участия в турнирах.</p>
                    <p style="padding-left:20px;"><strong>2.1.6.</strong> <strong>Данные об устройстве</strong> — сокращённая строка браузера (user-agent), разрешение экрана и время последнего входа. Хранится их хеш; используется только для защиты учётной записи: при входе с нового устройства владельцу отправляется уведомление.</p>
                    <p style="padding-left:20px;"><strong>2.1.7.</strong> <strong>Данные о платежах</strong> — сумма, дата, способ оплаты и период членства. Используются для учёта членства и отчётности.</p>
                    <p><strong>2.2.</strong> При авторизации через сторонние сервисы (Google, Telegram) мы можем получать базовую информацию профиля: имя, email и фото, которые предоставляются данными сервисами в рамках протокола авторизации.</p>
                    <p><strong>2.3.</strong> Мы не собираем данные о платёжных картах. Все финансовые операции обрабатываются через сторонние платёжные системы.</p>
                    <p><strong>2.4.</strong> В мобильном приложении, если вы разрешили уведомления, сохраняется токен push-уведомлений. Он привязан к устройству, а не к личности, и служит только для доставки сообщений. Отключить уведомления можно в настройках приложения или устройства.</p>
                </div>
            </div>

            <!-- Section 3: Цели обработки -->
            <div class="ip-rules-section ip-fade-in" id="pp-data-purposes">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Цели обработки данных
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Персональные данные обрабатываются в следующих целях:</p>
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> <strong>Регистрация и авторизация</strong> — создание учётной записи, вход в личный кабинет, восстановление доступа.</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> <strong>Идентификация пользователя</strong> — отображение профиля в рейтинге, на страницах турниров и в результатах матчей.</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> <strong>Рейтинговая система</strong> — ведение рейтинга игроков, подсчёт очков, определение категорий, формирование турнирных сеток.</p>
                    <p style="padding-left:20px;"><strong>3.1.4.</strong> <strong>Уведомления</strong> — информирование о турнирах, результатах, изменениях в расписании, членстве и других событиях сообщества через Telegram-бот и email-рассылки.</p>
                    <p style="padding-left:20px;"><strong>3.1.5.</strong> <strong>Улучшение Сервиса</strong> — анализ использования для улучшения функциональности и пользовательского опыта.</p>
                    <p><strong>3.2.</strong> Персональные данные не используются для рекламных целей и не передаются третьим лицам для маркетинга.</p>
                </div>
            </div>

            <!-- Section 4: Третьи стороны -->
            <div class="ip-rules-section ip-fade-in" id="pp-third-parties">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Третьи стороны
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Для функционирования Сервиса мы используем следующие сторонние сервисы, которые могут обрабатывать персональные данные:</p>
                    <p style="padding-left:20px;"><strong>4.1.1.</strong> <strong>Supabase</strong> — хостинг базы данных и система аутентификации. Данные хранятся на серверах Amazon Web Services (AWS). Supabase соответствует стандартам безопасности SOC 2 Type II. Политика конфиденциальности: <a href="https://supabase.com/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">supabase.com/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.2.</strong> <strong>Telegram Bot API</strong> — используется для отправки уведомлений и авторизации через Telegram Login Widget. Обрабатываются: Telegram ID, имя пользователя, фото профиля. Политика конфиденциальности: <a href="https://telegram.org/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">telegram.org/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.3.</strong> <strong>Google (OAuth 2.0)</strong> — используется для авторизации через аккаунт Google. Передаются: email, имя, фото профиля. Политика конфиденциальности: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">policies.google.com/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.4.</strong> <strong>Resend</strong> — сервис email-рассылок. Используется для отправки уведомлений (подтверждение регистрации, напоминания о турнирах, системные сообщения). Обрабатываются: email-адрес, имя получателя. Политика конфиденциальности: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener" style="color: #CCFF00;">resend.com/legal/privacy-policy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.5.</strong> <strong>Firebase Cloud Messaging (Google)</strong> — доставка push-уведомлений в мобильное приложение. Обрабатывается токен устройства. Политика конфиденциальности: firebase.google.com/support/privacy.</p>
                    <p style="padding-left:20px;"><strong>4.1.6.</strong> <strong>Google Analytics</strong> — обезличенная статистика посещений сайта. Политика конфиденциальности: policies.google.com/privacy.</p>
                    <p style="padding-left:20px;"><strong>4.1.7.</strong> <strong>GitHub Pages</strong> — хостинг сайта. При загрузке страниц GitHub обрабатывает технические данные соединения, включая IP-адрес. Политика конфиденциальности: docs.github.com/privacy.</p>
                    <p><strong>4.2.</strong> Мы не продаём и не передаём персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством Кыргызской Республики.</p>
                    <p><strong>4.3.</strong> Все перечисленные сторонние сервисы используются исключительно для обеспечения работоспособности Сервиса и не имеют доступа к данным сверх необходимого для выполнения своих функций.</p>
                </div>
            </div>

            <!-- Section 5: Хранение и защита -->
            <div class="ip-rules-section ip-fade-in" id="pp-storage">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Хранение и защита данных
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Все данные передаются по защищённому протоколу HTTPS с использованием TLS-шифрования.</p>
                    <p><strong>5.2.</strong> Доступ к данным в базе контролируется механизмом Row Level Security (RLS), обеспечивающим изоляцию данных на уровне строк. Каждый пользователь имеет доступ только к своим данным, если иное не предусмотрено ролевой моделью доступа.</p>
                    <p><strong>5.3.</strong> Пароли пользователей хранятся в зашифрованном виде (bcrypt) и недоступны даже администраторам системы.</p>
                    <p><strong>5.4.</strong> Персональные данные хранятся в течение всего периода существования учётной записи пользователя. При удалении аккаунта учётная запись сразу перестаёт отображаться в Сервисе, а персональные данные удаляются через 30 календарных дней. В течение этого срока Пользователь может отменить удаление, войдя в аккаунт.</p>
                    <p><strong>5.5.</strong> Рейтинговые данные (результаты матчей, очки, турнирная статистика) сохраняются в обезличенном виде для ведения истории турниров даже после удаления аккаунта: они относятся к прошедшим соревнованиям, а не к учётной записи. Карточка игрока при этом остаётся с пометкой об удалении аккаунта, а контактные данные из неё убираются.</p>
                    <p><strong>5.6.</strong> Резервные копии базы данных создаются автоматически и хранятся в зашифрованном виде на серверах Supabase (AWS).</p>
                </div>
            </div>

            <!-- Section 6: Права пользователя -->
            <div class="ip-rules-section ip-fade-in" id="pp-user-rights">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">06</span>
                    Права пользователя
                </h2>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Пользователь имеет право:</p>
                    <p style="padding-left:20px;"><strong>6.1.1.</strong> <strong>Просматривать свои данные</strong> — вся информация профиля доступна в личном кабинете (Dashboard) на сайте и в мобильном приложении.</p>
                    <p style="padding-left:20px;"><strong>6.1.2.</strong> <strong>Изменять свои данные</strong> — имя, фамилию, фото профиля, номер телефона можно изменить в настройках профиля.</p>
                    <p style="padding-left:20px;"><strong>6.1.3.</strong> <strong>Удалить свой аккаунт</strong> — самостоятельно в личном кабинете, раздел «Настройки», либо запросом на email <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>. Аккаунт сразу перестаёт отображаться в Сервисе, окончательное удаление данных происходит через 30 календарных дней. Всё это время удаление можно отменить.</p>
                    <p style="padding-left:20px;"><strong>6.1.4.</strong> <strong>Отказаться от уведомлений</strong> — пользователь может в любой момент отключить email-уведомления и Telegram-уведомления в настройках профиля по отдельным категориям (турниры, платежи, новости, системные).</p>
                    <p style="padding-left:20px;"><strong>6.1.5.</strong> <strong>Запросить выгрузку данных</strong> — пользователь может запросить копию всех своих персональных данных, направив запрос на <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>.</p>
                    <p><strong>6.2.</strong> Для реализации своих прав пользователь может обратиться по электронной почте <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a> с указанием email-адреса, привязанного к аккаунту.</p>
                </div>
            </div>

            <!-- Section 7: Cookies и аналитика -->
            <div class="ip-rules-section ip-fade-in" id="pp-cookies">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">07</span>
                    Cookies и аналитика
                </h2>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Сервис использует механизм localStorage браузера для хранения данных сессии авторизации. Это необходимо для поддержания входа пользователя в систему между посещениями.</p>
                    <p><strong>7.2.</strong> Мы не используем сторонние cookies для отслеживания или рекламы.</p>
                    <p><strong>7.3.</strong> Для анализа посещаемости сайта используется Google Analytics. Собираются обезличенные данные: тип устройства, браузер, страна, просмотренные страницы. Эти данные не позволяют идентифицировать конкретного пользователя.</p>
                    <p><strong>7.4.</strong> Пользователь может отключить сбор аналитических данных, используя расширения для браузера, блокирующие скрипты аналитики.</p>
                </div>
            </div>

            <!-- Section 8: Изменения политики -->
            <div class="ip-rules-section ip-fade-in" id="pp-changes">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">08</span>
                    Изменения политики
                </h2>
                <div class="ip-rules-list">
                    <p><strong>8.1.</strong> Оператор оставляет за собой право вносить изменения в настоящую Политику конфиденциальности.</p>
                    <p><strong>8.2.</strong> При внесении существенных изменений пользователи будут уведомлены через мобильное приложение и/или по электронной почте.</p>
                    <p><strong>8.3.</strong> Актуальная версия Политики всегда доступна на странице <a href="https://kslt.kg/pages/privacy-policy.html" style="color: #CCFF00;">kslt.kg/pages/privacy-policy.html</a>.</p>
                    <p><strong>8.4.</strong> Продолжение использования Сервиса после публикации изменений означает согласие пользователя с обновлённой Политикой.</p>
                </div>
            </div>

            <!-- Section 9: Контакты -->
            <div class="ip-rules-section ip-fade-in" id="pp-contacts">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">09</span>
                    Контактная информация
                </h2>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться:</p>
                    <p style="padding-left:20px;"><strong>Email:</strong> <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a></p>
                    <p style="padding-left:20px;"><strong>Организация:</strong> КСЛТ (Кыргызстанское Сообщество Любителей Тенниса)</p>
                    <p style="padding-left:20px;"><strong>Адрес:</strong> г. Бишкек, Кыргызская Республика</p>
                    <p style="padding-left:20px;"><strong>Сайт:</strong> <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a></p>
                </div>
            </div>

            <!-- Effective date -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.6); font-size: 0.95rem; text-align: center; padding: 20px 0;">Редакция от 26 августа 2026 г.</p>
            </div>', 'Privacy Policy', '<!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;">This Privacy Policy defines the procedures for the collection, storage, processing, and protection of personal data of users of the <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a> website and the KSLT Tennis mobile application (hereinafter collectively referred to as the "Service"). By using the Service, you agree to the terms of this Policy.</p>
            </div>

            <!-- Table of Contents -->
            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Table of Contents</div>
                <ol class="ip-toc-list">
                    <li><a href="#pp-general">General Provisions</a></li>
                    <li><a href="#pp-data-collected">Data We Collect</a></li>
                    <li><a href="#pp-data-purposes">Purposes of Data Processing</a></li>
                    <li><a href="#pp-third-parties">Third Parties</a></li>
                    <li><a href="#pp-storage">Data Storage and Protection</a></li>
                    <li><a href="#pp-user-rights">User Rights</a></li>
                    <li><a href="#pp-cookies">Cookies and Analytics</a></li>
                    <li><a href="#pp-changes">Policy Changes</a></li>
                    <li><a href="#pp-contacts">Contact Information</a></li>
                </ol>
            </div>

            <!-- Section 1: General Provisions -->
            <div class="ip-rules-section ip-fade-in" id="pp-general">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    General Provisions
                </h2>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> The personal data operator is KSLT (Kyrgyzstan Social Lawn Tennis) — an amateur tennis community registered in Bishkek, Kyrgyz Republic.</p>
                    <p><strong>1.2.</strong> This Privacy Policy applies to all personal data that the Operator may receive from the User when using the <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a> website and the KSLT Tennis mobile application.</p>
                    <p><strong>1.3.</strong> Registration on the website or in the application, as well as use of the Service, constitutes the User''s unconditional consent to this Policy and the personal data processing conditions specified herein.</p>
                    <p><strong>1.4.</strong> If the User disagrees with the terms of the Privacy Policy, the User must discontinue use of the Service and request deletion of their account.</p>
                </div>
            </div>

            <!-- Section 2: Data We Collect -->
            <div class="ip-rules-section ip-fade-in" id="pp-data-collected">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Data We Collect
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> During registration and use of the Service, we collect the following data:</p>
                    <p style="padding-left:20px;"><strong>2.1.1.</strong> <strong>Email address</strong> — required. Used for account creation and authentication.</p>
                    <p style="padding-left:20px;"><strong>2.1.2.</strong> <strong>First and last name</strong> — required. Used for identification in the system, display in rankings, and at tournaments.</p>
                    <p style="padding-left:20px;"><strong>2.1.3.</strong> <strong>Phone number</strong> — optional. May be used for communication regarding tournament participation.</p>
                    <p style="padding-left:20px;"><strong>2.1.4.</strong> <strong>Profile photo (avatar)</strong> — optional. Uploaded by the user for profile personalization.</p>
                    <p style="padding-left:20px;"><strong>2.1.5.</strong> <strong>Ranking data</strong> — points, match results, win/loss statistics, player category. Generated automatically through tournament participation.</p>
                    <p><strong>2.2.</strong> When authenticating through third-party services (Google, Telegram), we may receive basic profile information: name, email, and photo, which are provided by these services under their authentication protocols.</p>
                    <p><strong>2.3.</strong> We do not collect payment card data. All financial transactions are processed through third-party payment systems.</p>
                </div>
            </div>

            <!-- Section 3: Purposes of Data Processing -->
            <div class="ip-rules-section ip-fade-in" id="pp-data-purposes">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Purposes of Data Processing
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Personal data is processed for the following purposes:</p>
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> <strong>Registration and authentication</strong> — account creation, login to personal dashboard, access recovery.</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> <strong>User identification</strong> — profile display in rankings, on tournament pages, and in match results.</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> <strong>Ranking system</strong> — maintaining player rankings, calculating points, determining categories, and forming tournament brackets.</p>
                    <p style="padding-left:20px;"><strong>3.1.4.</strong> <strong>Notifications</strong> — informing users about tournaments, results, schedule changes, membership, and other community events via Telegram bot and email.</p>
                    <p style="padding-left:20px;"><strong>3.1.5.</strong> <strong>Service improvement</strong> — usage analysis to improve functionality and user experience.</p>
                    <p><strong>3.2.</strong> Personal data is not used for advertising purposes and is not shared with third parties for marketing.</p>
                </div>
            </div>

            <!-- Section 4: Third Parties -->
            <div class="ip-rules-section ip-fade-in" id="pp-third-parties">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Third Parties
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> To ensure the operation of the Service, we use the following third-party services that may process personal data:</p>
                    <p style="padding-left:20px;"><strong>4.1.1.</strong> <strong>Supabase</strong> — database hosting and authentication system. Data is stored on Amazon Web Services (AWS) servers. Supabase complies with SOC 2 Type II security standards. Privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">supabase.com/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.2.</strong> <strong>Telegram Bot API</strong> — used for sending notifications and authentication via Telegram Login Widget. Processed data includes: Telegram ID, username, profile photo. Privacy policy: <a href="https://telegram.org/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">telegram.org/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.3.</strong> <strong>Google (OAuth 2.0)</strong> — used for authentication via Google account. Transferred data includes: email, name, profile photo. Privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">policies.google.com/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.4.</strong> <strong>Resend</strong> — email delivery service. Used for sending notifications (registration confirmation, tournament reminders, system messages). Processed data includes: email address, recipient name. Privacy policy: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener" style="color: #CCFF00;">resend.com/legal/privacy-policy</a>.</p>
                    <p><strong>4.2.</strong> We do not sell or share personal data with third parties, except as required by the laws of the Kyrgyz Republic.</p>
                    <p><strong>4.3.</strong> All listed third-party services are used solely to ensure the operation of the Service and do not have access to data beyond what is necessary to perform their functions.</p>
                </div>
            </div>

            <!-- Section 5: Data Storage and Protection -->
            <div class="ip-rules-section ip-fade-in" id="pp-storage">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Data Storage and Protection
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> All data is transmitted over the secure HTTPS protocol using TLS encryption.</p>
                    <p><strong>5.2.</strong> Access to data in the database is controlled by the Row Level Security (RLS) mechanism, which provides data isolation at the row level. Each user has access only to their own data, unless otherwise specified by the role-based access model.</p>
                    <p><strong>5.3.</strong> User passwords are stored in encrypted form (bcrypt) and are inaccessible even to system administrators.</p>
                    <p><strong>5.4.</strong> Personal data is retained for the entire duration of the user''s account existence. Upon account deletion the account immediately stops being shown in the Service, and personal data is erased after 30 calendar days. During this period the User may cancel the deletion by signing in.</p>
                    <p><strong>5.5.</strong> Ranking data (match results, points, tournament statistics) is retained in anonymized form for tournament history purposes even after account deletion: it belongs to past competitions rather than to the account. The player card remains with a note that the account was deleted, and contact details are removed from it.</p>
                    <p><strong>5.6.</strong> Database backups are created automatically and stored in encrypted form on Supabase (AWS) servers.</p>
                </div>
            </div>

            <!-- Section 6: User Rights -->
            <div class="ip-rules-section ip-fade-in" id="pp-user-rights">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">06</span>
                    User Rights
                </h2>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> The User has the right to:</p>
                    <p style="padding-left:20px;"><strong>6.1.1.</strong> <strong>View their data</strong> — all profile information is available in the personal Dashboard on the website and in the mobile application.</p>
                    <p style="padding-left:20px;"><strong>6.1.2.</strong> <strong>Edit their data</strong> — name, last name, profile photo, and phone number can be changed in profile settings.</p>
                    <p style="padding-left:20px;"><strong>6.1.3.</strong> <strong>Delete their account</strong> — directly in the dashboard under «Settings», or by request to <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>. The account stops being shown in the Service immediately; data is erased for good after 30 calendar days. The deletion can be cancelled at any point during this period.</p>
                    <p style="padding-left:20px;"><strong>6.1.4.</strong> <strong>Opt out of notifications</strong> — the user can disable email and Telegram notifications at any time in profile settings by individual category (tournaments, payments, news, system).</p>
                    <p style="padding-left:20px;"><strong>6.1.5.</strong> <strong>Request data export</strong> — the user can request a copy of all their personal data by sending a request to <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>.</p>
                    <p><strong>6.2.</strong> To exercise their rights, the user may contact us via email at <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a>, specifying the email address linked to their account.</p>
                </div>
            </div>

            <!-- Section 7: Cookies and Analytics -->
            <div class="ip-rules-section ip-fade-in" id="pp-cookies">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">07</span>
                    Cookies and Analytics
                </h2>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> The Service uses the browser''s localStorage mechanism to store authentication session data. This is necessary to maintain the user''s login between visits.</p>
                    <p><strong>7.2.</strong> We do not use third-party cookies for tracking or advertising.</p>
                    <p><strong>7.3.</strong> Google Analytics may be used for website traffic analysis. In this case, anonymized data is collected: device type, browser, country, pages viewed. This data does not allow identification of a specific user.</p>
                    <p><strong>7.4.</strong> The user can disable analytics data collection by using browser extensions that block analytics scripts.</p>
                </div>
            </div>

            <!-- Section 8: Policy Changes -->
            <div class="ip-rules-section ip-fade-in" id="pp-changes">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">08</span>
                    Policy Changes
                </h2>
                <div class="ip-rules-list">
                    <p><strong>8.1.</strong> The Operator reserves the right to make changes to this Privacy Policy.</p>
                    <p><strong>8.2.</strong> In case of significant changes, users will be notified via the mobile application and/or by email.</p>
                    <p><strong>8.3.</strong> The current version of the Policy is always available at <a href="https://kslt.kg/pages/privacy-policy-en.html" style="color: #CCFF00;">kslt.kg/pages/privacy-policy-en.html</a>.</p>
                    <p><strong>8.4.</strong> Continued use of the Service after the publication of changes constitutes the user''s agreement with the updated Policy.</p>
                </div>
            </div>

            <!-- Section 9: Contact Information -->
            <div class="ip-rules-section ip-fade-in" id="pp-contacts">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">09</span>
                    Contact Information
                </h2>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> For any questions regarding the processing of personal data, you may contact us:</p>
                    <p style="padding-left:20px;"><strong>Email:</strong> <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a></p>
                    <p style="padding-left:20px;"><strong>Organization:</strong> KSLT (Kyrgyzstan Social Lawn Tennis)</p>
                    <p style="padding-left:20px;"><strong>Address:</strong> Bishkek, Kyrgyz Republic</p>
                    <p style="padding-left:20px;"><strong>Website:</strong> <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a></p>
                </div>
            </div>

            <!-- Effective date -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.6); font-size: 0.95rem; text-align: center; padding: 20px 0;">Effective date: August 26, 2026</p>
            </div>', 'Купуялык саясаты', '<!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;">Бул Купуялык саясаты <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a> сайтынын жана KSLT Tennis мобилдик тиркемесинин (мындан ары бирге — «Сервис») колдонуучуларынын жеке маалыматтарын чогултуу, сактоо, иштетүү жана коргоо тартибин аныктайт. Сервисти колдонуу менен сиз ушул Саясаттын шарттарына макулдугуңузду билдиресиз.</p>
            </div>

            <!-- Table of Contents -->
            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Мазмуну</div>
                <ol class="ip-toc-list">
                    <li><a href="#pp-general">Жалпы жоболор</a></li>
                    <li><a href="#pp-data-collected">Кандай маалыматтарды чогултабыз</a></li>
                    <li><a href="#pp-data-purposes">Маалыматтарды иштетүүнүн максаттары</a></li>
                    <li><a href="#pp-third-parties">Үчүнчү тараптар</a></li>
                    <li><a href="#pp-storage">Маалыматтарды сактоо жана коргоо</a></li>
                    <li><a href="#pp-user-rights">Колдонуучунун укуктары</a></li>
                    <li><a href="#pp-cookies">Cookies жана аналитика</a></li>
                    <li><a href="#pp-changes">Саясатка өзгөртүүлөр</a></li>
                    <li><a href="#pp-contacts">Байланыш маалыматы</a></li>
                </ol>
            </div>

            <!-- Section 1: Жалпы жоболор -->
            <div class="ip-rules-section ip-fade-in" id="pp-general">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Жалпы жоболор
                </h2>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> Жеке маалыматтардын оператору болуп KSLT (Kyrgyzstan Social Lawn Tennis) — Бишкек шаарында, Кыргыз Республикасында катталган теннис боюнча сүйүүчүлөр жамааты саналат.</p>
                    <p><strong>1.2.</strong> Бул Купуялык саясаты <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a> сайтын жана KSLT Tennis мобилдик тиркемесин колдонууда Оператор Колдонуучудан ала турган бардык жеке маалыматтарга таркатылат.</p>
                    <p><strong>1.3.</strong> Сайтта же тиркемеде каттоодон өтүү, ошондой эле Сервисти колдонуу Колдонуучунун ушул Саясатка жана анда көрсөтүлгөн жеке маалыматтарды иштетүү шарттарына шартсыз макулдугун билдирет.</p>
                    <p><strong>1.4.</strong> Купуялык саясатынын шарттарына макул болбогон учурда Колдонуучу Сервисти колдонууну токтотуп, аккаунтун жок кылууну сурануусу керек.</p>
                </div>
            </div>

            <!-- Section 2: Кандай маалыматтарды чогултабыз -->
            <div class="ip-rules-section ip-fade-in" id="pp-data-collected">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Кандай маалыматтарды чогултабыз
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> Каттоодо жана Сервисти колдонууда биз төмөнкү маалыматтарды чогултабыз:</p>
                    <p style="padding-left:20px;"><strong>2.1.1.</strong> <strong>Электрондук почта дареги (email)</strong> — милдеттүү. Аккаунт түзүү жана авторизациялоо үчүн колдонулат.</p>
                    <p style="padding-left:20px;"><strong>2.1.2.</strong> <strong>Аты-жөнү</strong> — милдеттүү. Тутумда идентификациялоо, рейтингде жана мелдештерде көрсөтүү үчүн колдонулат.</p>
                    <p style="padding-left:20px;"><strong>2.1.3.</strong> <strong>Телефон номери</strong> — милдеттүү эмес. Мелдештерге катышуу маселелери боюнча байланыш үчүн колдонулушу мүмкүн.</p>
                    <p style="padding-left:20px;"><strong>2.1.4.</strong> <strong>Профиль сүрөтү (аватар)</strong> — милдеттүү эмес. Профилди жекелештирүү үчүн колдонуучу тарабынан жүктөлөт.</p>
                    <p style="padding-left:20px;"><strong>2.1.5.</strong> <strong>Рейтинг маалыматтары</strong> — упайлар, матч жыйынтыктары, жеңүүлөр жана утулуулар статистикасы, оюнчунун категориясы. Мелдештерге катышуу учурунда автоматтык түрдө түзүлөт.</p>
                    <p><strong>2.2.</strong> Үчүнчү тараптын кызматтары (Google, Telegram) аркылуу авторизацияланганда биз профилдин негизги маалыматын ала алабыз: аты-жөнү, email жана сүрөт — бул маалыматтар авторизация протоколунун алкагында ошол кызматтар тарабынан берилет.</p>
                    <p><strong>2.3.</strong> Биз төлөм карталары жөнүндө маалыматтарды чогултпайбыз. Бардык финансылык операциялар үчүнчү тараптын төлөм системалары аркылуу иштетилет.</p>
                </div>
            </div>

            <!-- Section 3: Маалыматтарды иштетүүнүн максаттары -->
            <div class="ip-rules-section ip-fade-in" id="pp-data-purposes">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Маалыматтарды иштетүүнүн максаттары
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Жеке маалыматтар төмөнкү максаттарда иштетилет:</p>
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> <strong>Каттоо жана авторизация</strong> — каттоо эсебин түзүү, жеке кабинетке кирүү, кирүү мүмкүнчүлүгүн калыбына келтирүү.</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> <strong>Колдонуучуну идентификациялоо</strong> — рейтингде, мелдеш барактарында жана матч жыйынтыктарында профилди көрсөтүү.</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> <strong>Рейтинг тутуму</strong> — оюнчулардын рейтингин жүргүзүү, упайларды эсептөө, категорияларды аныктоо, мелдеш тармактарын түзүү.</p>
                    <p style="padding-left:20px;"><strong>3.1.4.</strong> <strong>Билдирүүлөр</strong> — мелдештер, жыйынтыктар, расписаниедеги өзгөрүүлөр, мүчөлүк жана жамааттын башка окуялары жөнүндө Telegram-бот жана email-жөнөтүүлөр аркылуу маалымдоо.</p>
                    <p style="padding-left:20px;"><strong>3.1.5.</strong> <strong>Сервисти жакшыртуу</strong> — функционалдуулукту жана колдонуучу тажрыйбасын жакшыртуу үчүн колдонууну анализдөө.</p>
                    <p><strong>3.2.</strong> Жеке маалыматтар жарнамалык максаттарда колдонулбайт жана маркетинг үчүн үчүнчү жактарга берилбейт.</p>
                </div>
            </div>

            <!-- Section 4: Үчүнчү тараптар -->
            <div class="ip-rules-section ip-fade-in" id="pp-third-parties">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Үчүнчү тараптар
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Сервистин иштеши үчүн биз жеке маалыматтарды иштете ала турган төмөнкү үчүнчү тараптын кызматтарын колдонобуз:</p>
                    <p style="padding-left:20px;"><strong>4.1.1.</strong> <strong>Supabase</strong> — маалымат базасынын хостинги жана аутентификация тутуму. Маалыматтар Amazon Web Services (AWS) серверлеринде сакталат. Supabase SOC 2 Type II коопсуздук стандарттарына ылайык келет. Купуялык саясаты: <a href="https://supabase.com/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">supabase.com/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.2.</strong> <strong>Telegram Bot API</strong> — билдирүүлөрдү жөнөтүү жана Telegram Login Widget аркылуу авторизациялоо үчүн колдонулат. Иштетилет: Telegram ID, колдонуучу аты, профиль сүрөтү. Купуялык саясаты: <a href="https://telegram.org/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">telegram.org/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.3.</strong> <strong>Google (OAuth 2.0)</strong> — Google аккаунту аркылуу авторизациялоо үчүн колдонулат. Берилет: email, аты-жөнү, профиль сүрөтү. Купуялык саясаты: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color: #CCFF00;">policies.google.com/privacy</a>.</p>
                    <p style="padding-left:20px;"><strong>4.1.4.</strong> <strong>Resend</strong> — email-жөнөтүү кызматы. Билдирүүлөрдү жөнөтүү үчүн колдонулат (каттоону ырастоо, мелдештер жөнүндө эскертүүлөр, тутумдук билдирүүлөр). Иштетилет: email-дареги, алуучунун аты. Купуялык саясаты: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener" style="color: #CCFF00;">resend.com/legal/privacy-policy</a>.</p>
                    <p><strong>4.2.</strong> Биз жеке маалыматтарды сатпайбыз жана Кыргыз Республикасынын мыйзамдарында каралган учурлардан тышкары үчүнчү жактарга бербейбиз.</p>
                    <p><strong>4.3.</strong> Жогоруда аталган бардык үчүнчү тараптын кызматтары Сервистин иштешин камсыз кылуу үчүн гана колдонулат жана өз функцияларын аткаруу үчүн зарылдан ашык маалыматка жетүү мүмкүнчүлүгүнө ээ эмес.</p>
                </div>
            </div>

            <!-- Section 5: Маалыматтарды сактоо жана коргоо -->
            <div class="ip-rules-section ip-fade-in" id="pp-storage">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Маалыматтарды сактоо жана коргоо
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Бардык маалыматтар TLS-шифрлөө менен корголгон HTTPS протоколу аркылуу берилет.</p>
                    <p><strong>5.2.</strong> Маалымат базасындагы маалыматтарга жетүү Row Level Security (RLS) механизми аркылуу контролдонот, ал саптар деңгээлинде маалыматтардын изоляциясын камсыз кылат. Ар бир колдонуучу ролдук жетүү модели менен башкача каралбаса, өзүнүн маалыматтарына гана жетүү мүмкүнчүлүгүнө ээ.</p>
                    <p><strong>5.3.</strong> Колдонуучулардын сырсөздөрү шифрленген түрдө (bcrypt) сакталат жана тутум администраторлоруна да жеткиликсиз.</p>
                    <p><strong>5.4.</strong> Жеке маалыматтар колдонуучунун каттоо эсеби бар болгон бүт мезгил ичинде сакталат. Аккаунт жок кылынганда каттоо эсеби Сервисте дароо көрсөтүлбөй калат, жеке маалыматтар 30 календардык күндөн кийин өчүрүлөт. Ушул мөөнөт ичинде Колдонуучу аккаунтуна кирип, жок кылууну жокко чыгара алат.</p>
                    <p><strong>5.5.</strong> Рейтинг маалыматтары (матч жыйынтыктары, упайлар, мелдеш статистикасы) аккаунт жок кылынгандан кийин да мелдештердин тарыхын жүргүзүү үчүн жеке маалыматсыз сакталат: алар каттоо эсебине эмес, өткөн мелдештерге таандык. Оюнчунун картасы аккаунт жок кылынгандыгы жөнүндө белги менен калат, ал эми байланыш маалыматтары андан алынып салынат.</p>
                    <p><strong>5.6.</strong> Маалымат базасынын камдык көчүрмөлөрү автоматтык түрдө түзүлүп, Supabase (AWS) серверлеринде шифрленген түрдө сакталат.</p>
                </div>
            </div>

            <!-- Section 6: Колдонуучунун укуктары -->
            <div class="ip-rules-section ip-fade-in" id="pp-user-rights">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">06</span>
                    Колдонуучунун укуктары
                </h2>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Колдонуучунун укуктары:</p>
                    <p style="padding-left:20px;"><strong>6.1.1.</strong> <strong>Өз маалыматтарын көрүү</strong> — профилдин бардык маалыматы сайттагы жана мобилдик тиркемедеги жеке кабинетте (Dashboard) жеткиликтүү.</p>
                    <p style="padding-left:20px;"><strong>6.1.2.</strong> <strong>Өз маалыматтарын өзгөртүү</strong> — аты-жөнү, профиль сүрөтү, телефон номерин профиль жөндөөлөрүндө өзгөртүүгө болот.</p>
                    <p style="padding-left:20px;"><strong>6.1.3.</strong> <strong>Аккаунтун жок кылуу</strong> — жеке кабинеттеги «Жөндөөлөр» бөлүмүндө өз алдынча, же <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a> дарегине суроо-талап жөнөтүү аркылуу. Аккаунт Сервисте дароо көрсөтүлбөй калат, маалыматтар 30 календардык күндөн кийин биротоло өчүрүлөт. Ушул мөөнөт ичинде жок кылууну жокко чыгарууга болот.</p>
                    <p style="padding-left:20px;"><strong>6.1.4.</strong> <strong>Билдирүүлөрдөн баш тартуу</strong> — колдонуучу каалаган убакта профиль жөндөөлөрүндө email-билдирүүлөрдү жана Telegram-билдирүүлөрдү өзүнчө категориялар боюнча (мелдештер, төлөмдөр, жаңылыктар, тутумдук) өчүрө алат.</p>
                    <p style="padding-left:20px;"><strong>6.1.5.</strong> <strong>Маалыматтарды жүктөп алууну суроо</strong> — колдонуучу бардык жеке маалыматтарынын көчүрмөсүн <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a> дарегине суроо-талап жөнөтүп алууга болот.</p>
                    <p><strong>6.2.</strong> Укуктарын ишке ашыруу үчүн колдонуучу <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a> электрондук почтасына аккаунтка байланышкан email-дарегин көрсөтүп кайрыла алат.</p>
                </div>
            </div>

            <!-- Section 7: Cookies жана аналитика -->
            <div class="ip-rules-section ip-fade-in" id="pp-cookies">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">07</span>
                    Cookies жана аналитика
                </h2>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Сервис авторизация сессиясынын маалыматтарын сактоо үчүн браузердин localStorage механизмин колдонот. Бул колдонуучунун тутумга кирүүсүн сессиялар арасында сактоо үчүн зарыл.</p>
                    <p><strong>7.2.</strong> Биз көзөмөлдөө же жарнамалоо үчүн үчүнчү тараптын cookies файлдарын колдонбойбуз.</p>
                    <p><strong>7.3.</strong> Сайтка келүүлөрдү анализдөө үчүн Google Analytics колдонулушу мүмкүн. Мындай учурда жеке маалыматсыз маалыматтар чогултулат: түзмөктүн түрү, браузер, өлкө, каралган барактар. Бул маалыматтар конкреттүү колдонуучуну идентификациялоого мүмкүндүк бербейт.</p>
                    <p><strong>7.4.</strong> Колдонуучу аналитика скрипттерин бөгөттөөчү браузер кеңейтүүлөрүн колдонуп, аналитикалык маалыматтарды чогултууну өчүрө алат.</p>
                </div>
            </div>

            <!-- Section 8: Саясатка өзгөртүүлөр -->
            <div class="ip-rules-section ip-fade-in" id="pp-changes">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">08</span>
                    Саясатка өзгөртүүлөр
                </h2>
                <div class="ip-rules-list">
                    <p><strong>8.1.</strong> Оператор ушул Купуялык саясатына өзгөртүүлөрдү киргизүү укугун өзүнө калтырат.</p>
                    <p><strong>8.2.</strong> Олуттуу өзгөртүүлөр киргизилгенде колдонуучулар мобилдик тиркеме жана/же электрондук почта аркылуу маалымдалат.</p>
                    <p><strong>8.3.</strong> Саясаттын актуалдуу версиясы дайыма <a href="https://kslt.kg/pages/privacy-policy-kg.html" style="color: #CCFF00;">kslt.kg/pages/privacy-policy-kg.html</a> барагында жеткиликтүү.</p>
                    <p><strong>8.4.</strong> Өзгөртүүлөр жарыяланган соң Сервисти колдонууну улантуу колдонуучунун жаңыланган Саясатка макулдугун билдирет.</p>
                </div>
            </div>

            <!-- Section 9: Байланыш маалыматы -->
            <div class="ip-rules-section ip-fade-in" id="pp-contacts">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">09</span>
                    Байланыш маалыматы
                </h2>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> Жеке маалыматтарды иштетүүгө байланышкан бардык суроолор боюнча кайрылсаңыз болот:</p>
                    <p style="padding-left:20px;"><strong>Email:</strong> <a href="mailto:info@tennis.kg" style="color: #CCFF00;">info@tennis.kg</a></p>
                    <p style="padding-left:20px;"><strong>Уюм:</strong> KSLT (Kyrgyzstan Social Lawn Tennis)</p>
                    <p style="padding-left:20px;"><strong>Дарек:</strong> Бишкек ш., Кыргыз Республикасы</p>
                    <p style="padding-left:20px;"><strong>Сайт:</strong> <a href="https://kslt.kg" style="color: #CCFF00;">kslt.kg</a></p>
                </div>
            </div>

            <!-- Effective date -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.6); font-size: 0.95rem; text-align: center; padding: 20px 0;">Күчүнө кирген күнү: 2026-жылдын 26-августу</p>
            </div>'),
    ('offer', 'Публичная оферта', '<!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;">Настоящая публичная оферта представляет собой предложение организатора (исполнителя услуг) заключить договор оказания услуг по организации участия в спортивных теннисных мероприятиях (соревнованиях) на условиях, изложенных в настоящей оферте.</p>
            </div>

            <!-- Table of Contents -->
            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Содержание</div>
                <ol class="ip-toc-list">
                    <li><a href="#offer-terms">Термины и определения</a></li>
                    <li><a href="#offer-conditions">Условия публичной оферты</a></li>
                    <li><a href="#offer-services">Перечень оказываемых услуг</a></li>
                    <li><a href="#offer-service-conditions">Условия оказания услуг</a></li>
                    <li><a href="#offer-refusal">Отказ от договора</a></li>
                </ol>
            </div>

            <!-- Section 1 -->
            <div class="ip-rules-section ip-fade-in" id="offer-terms">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Термины и определения
                </h2>
                <div class="ip-rules-list" style="list-style:none;">
                    <p><strong>1.1.</strong> «Оферта», «Публичная оферта» — настоящее предложение организатора заключить в соответствии со статьями 396, 398 Гражданского кодекса Кыргызской Республики Договор оказания услуг по организации участия в спортивных теннисных мероприятиях на условиях, изложенных ниже.</p>
                    <p><strong>1.2.</strong> «Акцепт оферты» — ответ лица, которому адресована оферта, о ее принятии. Акцепт оферты означает полное и безоговорочное присоединение участника к условиям оферты.</p>
                    <p><strong>1.3.</strong> «Организатор» — Общественный фонд «Кыргызстанское сообщество любителей тенниса», регистрационный No 197575-3301-ОФ, ИНН 01905202110030, юридический адрес: г. Бишкек, пр. Чуй, кв.26, в лице директора Чокоевой Айсулуу Эриковны, действующая на основании Устава, являющийся исполнителем услуг по организации участия в спортивных теннисных мероприятиях (соревнованиях), которое осуществляет организационное, финансовое и иное обеспечение его подготовки и проведения.</p>
                    <p><strong>1.4.</strong> «Договор» — возмездное соглашение об оказании организатором услуг по организации участия в соревновании на условиях оферты. Договор заключается между участником и организатором в отношении конкретного соревнования, на которое зарегистрирован участник. Для заключения договора организатор использует следующие ресурсы в сети Интернет: сайт www.tennis.kg</p>
                    <p><strong>1.5.</strong> «Участник» — физическое лицо, заключившее с организатором договор, путем акцепта настоящей оферты.</p>
                    <p><strong>1.6.</strong> «Соревнование» — спортивное теннисное мероприятие, по поводу которого заключен договор на условиях настоящей оферты.</p>
                    <p><strong>1.7.</strong> «Правила проведения соревнования», «Регламент соревнования» — документ, определяющий условия, порядок проведения и участия в соревновании, по поводу которых заключен договор на условиях настоящей оферты. Правила обязательны для организатора, его персонала, участника и посетителей соревнования. Правила размещаются на сайте организатора www.tennis.kg в сроки, определенные настоящей Офертой.</p>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="ip-rules-section ip-fade-in" id="offer-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Условия публичной оферты
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> Оферта вступает в силу со дня размещения её в сети Интернет на сайте организатора по адресу: www.tennis.kg и действует в течение неопределенного срока.</p>
                    <p><strong>2.2.</strong> Организатор вправе отозвать оферту в любое время либо внести в нее изменения без согласования с участником. Все изменения и дополнения вступают в силу с момента их размещения на сайте www.tennis.kg.</p>
                    <p><strong>2.3.</strong> Акцепт настоящей оферты осуществляется путем прохождения участником процедуры регистрации на соревнование на сайте www.tennis.kg</p>
                    <p><strong>2.4.</strong> Лицо считается заключившим с организатором договор на условиях оферты в момент направления регистрации его заявки на соревнование в личном кабинете на сайте www.tennis.kg, или по телефону указанному им при прохождении процедуры регистрации.</p>
                    <p><strong>2.5.</strong> Местом заключения договора является Кыргызская Республика, город Бишкек.</p>
                    <p><strong>2.6.</strong> Совершением акцепта настоящей оферты участник подтверждает, что он:</p>
                    <p style="padding-left:20px;"><strong>2.6.1.</strong> осведомлен о том, что участие в соревновании сопряжено с риском для жизни и здоровья, требует физического и умственного напряжения, может привести к значительным физическим нагрузкам и опасности получения травм;</p>
                    <p style="padding-left:20px;"><strong>2.6.2.</strong> осведомлен о состоянии своего здоровья и никаких медицинских противопоказаний, препятствующих участию в соревновании, не имеет;</p>
                    <p style="padding-left:20px;"><strong>2.6.3.</strong> осведомлен о том, что участие в соревновании не рекомендуется лицам, имеющим медицинские ограничения для занятий физической культурой и спортом;</p>
                    <p style="padding-left:20px;"><strong>2.6.4.</strong> ознакомлен с условиями оферты;</p>
                    <p style="padding-left:20px;"><strong>2.6.5.</strong> соглашается с безусловным и безоговорочным принятием условий настоящей Оферты и обязуется неукоснительно соблюдать правила проведения Соревнований/Регламент соревнований, требования персонала и организатора;</p>
                    <p style="padding-left:20px;"><strong>2.6.6.</strong> ознакомлен с внутренними документами Организатора, опубликованными на сайте Организатора;</p>
                    <p style="padding-left:20px;"><strong>2.6.7.</strong> берет на себя ответственность за любые возможные негативные последствия своего участия в соревновании;</p>
                    <p style="padding-left:20px;"><strong>2.6.8.</strong> предоставляет согласие на обработку персональных данных в целях исполнения настоящей оферты, информирования о товарах и услугах организатора и (или) партнеров организатора;</p>
                    <p style="padding-left:20px;"><strong>2.6.9.</strong> предоставляет свое согласие на обнародование и дальнейшее использование, в том числе в коммерческих целях, его изображения, полученного во время проведения соревнования.</p>
                </div>
            </div>

            <!-- Section 3 -->
            <div class="ip-rules-section ip-fade-in" id="offer-services">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Перечень оказываемых услуг
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Организатор обязуется оказать, а участник оплатить следующие услуги по организации участия в Соревновании:</p>
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> предоставить участнику право на участие в соревновании, указанном в правилах проведения соревнования и размещенных на сайте www.tennis.kg;</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> предоставить участнику информацию в группе WhatsApp или в личном кабинете на сайте www.tennis.kg о одобрении его заявки;</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> оказать иные сопутствующие услуги (обеспечение участника питьевой водой, мячами, перекусом в ходе проведения соревнования и др.), перечень которых указан в правилах проведения соревнования/Регламенте на сайте www.tennis.kg.</p>
                    <p><strong>3.2.</strong> Информация о дате, времени и месте проведения соревнования, программа соревнований и иная необходимая информация размещается на сайте организатора www.tennis.kg.</p>
                    <p><strong>3.3.</strong> Подробная информация о соревновании может быть доведена до участника иным доступным способом, в том числе путем рассылки по номеру телефона, указанному участником при регистрации.</p>
                    <p><strong>3.4.</strong> Стоимость услуг (взнос) определяется организатором самостоятельно и указывается на сайте в разделе о конкретном соревновании.</p>
                    <p><strong>3.5.</strong> Оплата взноса осуществляется в безналичном порядке способами, указанными на сайте www.tennis.kg. Датой оплаты признается дата списания денежных средств с расчетного счета Участника.</p>
                    <p><strong>3.6.</strong> Все расходы по перечислению денежных средств в счет оплаты взноса, а также расходы на оплату комиссии платежного агента (субагента) несет участник.</p>
                </div>
            </div>

            <!-- Section 4 -->
            <div class="ip-rules-section ip-fade-in" id="offer-service-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Условия оказания услуг
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Услуга оказывается организатором однократно, в дату, время и в месте проведения соревнования, указанном на сайте www.tennis.kg или в сообщении, направленном организатором по номеру телефона участника.</p>
                    <p><strong>4.2.</strong> Участник принимает на себя всю ответственность за свое медицинское состояние в период проведения соревнований, и относит на себя все негативные последствия связанные с нарушением данного условия.</p>
                    <p><strong>4.3.</strong> Организатор обязуется:</p>
                    <p style="padding-left:20px;"><strong>4.3.1.</strong> информировать участника о дате и времени, месте проведения соревнования, а также предоставить иную необходимую для участия информацию;</p>
                    <p style="padding-left:20px;"><strong>4.3.2.</strong> обеспечить участнику допуск к месту проведения соревнования, теннисные корты, при условии соблюдения участником требований, установленных в правилах проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.3.3.</strong> своими силами и средствами обеспечить соблюдение мер общественного порядка и общественной безопасности на территории проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.3.4.</strong> проинформировать участника о результате участия в соревновании путем размещения заключительного протокола соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.3.5.</strong> предоставить участнику электронный протокол соревнований, содержащий имя Участника и занятое им место, путем его размещения на сайте;</p>
                    <p style="padding-left:20px;"><strong>4.3.6.</strong> уведомлять участника об изменении и/или дополнении условий настоящей оферты посредством размещения соответствующей информации на сайте www.tennis.kg.</p>
                    <p><strong>4.4.</strong> Организатор вправе:</p>
                    <p style="padding-left:20px;"><strong>4.4.1.</strong> изменять дату, время и место проведения и отменять соревнования при условии размещения соответствующей информации на сайте www.tennis.kg не позднее, чем за 24 часа до первоначальной даты проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> вносить изменения в программу соревнований, в том числе изменять количество участников, уведомив об этом участника посредством размещения на сайте www.tennis.kg или закрытой группы WhatsApp;</p>
                    <p style="padding-left:20px;"><strong>4.4.3.</strong> устанавливать и изменять правила проведения соревнований, правила нахождения посетителей в месте проведения соревнования, другие правила, связанные с организацией и проведением соревнования, требовать соблюдения указанных правил от участника и других лиц;</p>
                    <p style="padding-left:20px;"><strong>4.4.4.</strong> определять порядок проведения фото- и видео съемки во время соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.4.5.</strong> не допустить участника к участию в соревновании: при отсутствии оплаты членских взносов Организатора; в случае неоплаты участником взноса за турнир; при нахождении участника в состоянии алкогольного, наркотического, токсического опьянения; в случае нарушения участником правил проведения соревнования, иных правил и инструкций организатора, а также положений действующего законодательства Кыргызской Республики.</p>
                    <p><strong>4.5.</strong> Участник обязуется:</p>
                    <p style="padding-left:20px;"><strong>4.5.1.</strong> оплатить взнос за участие в соревновании в установленном организатором сроки и порядке;</p>
                    <p style="padding-left:20px;"><strong>4.5.2.</strong> при оплате взноса и подачи заявки предоставить организатору полные и достоверные сведения о себе: фамилию, имя, отчество; дату рождения (участник должен быть достигшим возраста 18 лет); сведения о контактном телефоне; иные сведения, указанные в качестве обязательных в регистрационной форме;</p>
                    <p style="padding-left:20px;"><strong>4.5.3.</strong> при получении уведомления об одобрении заявки на участие в турнире, дать согласие на обработку организатором персональных данных в целях исполнения настоящей оферты;</p>
                    <p style="padding-left:20px;"><strong>4.5.4.</strong> соблюдать правила проведения соревнований, а также выполнять указания персонала организатора в ходе проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.5.5.</strong> не использовать контент организатора, содержащий результаты его интеллектуальной деятельности, без письменного его согласия, за исключением случаев, установленных законом.</p>
                    <p><strong>4.6.</strong> Участник вправе:</p>
                    <p style="padding-left:20px;"><strong>4.6.1.</strong> снять свою заявку, уведомив об этом организатора турнира за 3 календарных дня до начала турнира и получить возврат взноса. В случае отказа позже чем за 3 дня, Организатор имеет право отказать в возврате взноса.</p>
                    <p style="padding-left:20px;"><strong>4.6.2.</strong> во время проведения соревнования получать от персонала организатора необходимую информацию.</p>
                    <p><strong>4.7.</strong> Организатор не несет ответственности за утрату и повреждение имущества участника, используемого во время соревнования.</p>
                    <p><strong>4.8.</strong> Организатор не несет ответственности за ущерб жизни и здоровью, имуществу участника, нанесенный в результате нарушения участником мер безопасности при проведении соревнования, а также нарушения правил, установленных организатором.</p>
                    <p><strong>4.9.</strong> Организатор не несет ответственности за действия третьих лиц, присутствующих в месте проведения соревнования, не являющихся сотрудниками организатора.</p>
                    <p><strong>4.10.</strong> Споры и разногласия, возникающие в процессе исполнения настоящей оферты, разрешаются сторонами путем переговоров.</p>
                </div>
            </div>

            <!-- Section 5 -->
            <div class="ip-rules-section ip-fade-in" id="offer-refusal">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Отказ от договора
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Участник вправе в одностороннем порядке отказаться от договора за 3 календарных дня до даты проведения соревнования, путем направления уведомления организатору турнира по номеру телефона WhatsApp.</p>
                    <p><strong>5.2.</strong> Организатор при возврате денежных средств, уплаченных в качестве стартового взноса, вправе удержать комиссию, уплаченную участником платежному агенту и (или) банку-посреднику за прием платежа.</p>
                    <p><strong>5.3.</strong> При отказе от договора, не известив организатора об этом за 3 дня, денежные средства, уплаченные в качестве стартового взноса, не возвращаются.</p>
                    <p><strong>5.4.</strong> Организатор имеет право отказаться от договора (от проведения соревнования) путем направления участнику уведомления по номеру телефона в WhatsApp, за 48 часов до времени начала соревнования.</p>
                </div>
            </div>', 'Public Offer', '<div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Table of Contents</div>
                <ol class="ip-toc-list">
                    <li><a href="#offer-terms">Terms and Definitions</a></li>
                    <li><a href="#offer-conditions">Public Offer Conditions</a></li>
                    <li><a href="#offer-services">Services Provided</a></li>
                    <li><a href="#offer-service-conditions">Service Conditions</a></li>
                    <li><a href="#offer-refusal">Contract Termination</a></li>
                </ol>
            </div>

            <!-- Section 1 -->
            <div class="ip-rules-section ip-fade-in" id="offer-terms">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Terms and Definitions
                </h2>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> <strong>"Offer"</strong>, <strong>"Public Offer"</strong> — the present proposal by the Organizer to enter into a Service Agreement in accordance with Articles 396 and 398 of the Civil Code of the Kyrgyz Republic for services related to organizing participation in sports tennis events, under the terms set forth herein.</p>
                    <p><strong>1.2.</strong> <strong>"Acceptance of the Offer"</strong> — a person''s response indicating acceptance thereof. Acceptance of the Offer signifies full and unconditional adherence by the Participant to the terms and conditions of the Offer.</p>
                    <p><strong>1.3.</strong> <strong>"Organizer"</strong> — Public Foundation "Kyrgyzstan Social Lawn Tennis Community" (KSLT), Registration No. 197575-3301-PF, TIN 01905202110030, legal address: Bishkek city, Chuy Ave., apt. 26, represented by Director Chokoeva Aisuluu Erikovna, acting on the basis of the Charter, being the service provider for organizing participation in sports tennis events (competitions), which carries out organizational, financial and other support for their preparation and conduct.</p>
                    <p><strong>1.4.</strong> <strong>"Agreement"</strong> — a compensated agreement on the provision of services by the Organizer for organizing participation in a Competition under the terms of the Offer. The Agreement is concluded between the Participant and the Organizer in relation to a specific Competition for which the Participant has registered. To conclude the Agreement, the Organizer uses the following Internet resources: website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>.</p>
                    <p><strong>1.5.</strong> <strong>"Participant"</strong> — an individual who has entered into the Agreement with the Organizer by accepting this Offer.</p>
                    <p><strong>1.6.</strong> <strong>"Competition"</strong> — a sports tennis event in relation to which the Agreement has been concluded under the terms of this Offer.</p>
                    <p><strong>1.7.</strong> <strong>"Competition Rules"</strong>, <strong>"Competition Regulations"</strong> — a document defining the terms, procedures for conducting and participating in a Competition in relation to which the Agreement has been concluded under the terms of this Offer. The Rules are binding on the Organizer, its staff, the Participant and visitors of the Competition. The Rules are published on the Organizer''s website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a> within the time frames specified in this Offer.</p>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="ip-rules-section ip-fade-in" id="offer-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Public Offer Conditions
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> This Offer enters into force from the date of its publication on the Internet on the Organizer''s website at: <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a> and is valid for an indefinite period.</p>
                    <p><strong>2.2.</strong> The Organizer reserves the right to withdraw the Offer at any time or make amendments to it without the Participant''s consent. All amendments and additions enter into force from the moment of their publication on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>.</p>
                    <p><strong>2.3.</strong> Acceptance of this Offer is performed by the Participant completing the registration procedure for a Competition on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>.</p>
                    <p><strong>2.4.</strong> A person is deemed to have concluded the Agreement with the Organizer under the terms of the Offer at the moment of submitting their registration application for the Competition in their personal account on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>, or by phone number provided during the registration procedure.</p>
                    <p><strong>2.5.</strong> Place of contract conclusion: Kyrgyz Republic, Bishkek city.</p>
                    <p><strong>2.6.</strong> By accepting this Offer, the Participant confirms the following:</p>
                    <p style="padding-left:20px;"><strong>2.6.1.</strong> The Participant is aware that participation in the Competition involves risk to life and health, requires physical and mental exertion, and may lead to significant physical strain and the risk of injury.</p>
                    <p style="padding-left:20px;"><strong>2.6.2.</strong> The Participant is aware of their health condition and has no medical contraindications to participating in the Competition.</p>
                    <p style="padding-left:20px;"><strong>2.6.3.</strong> The Participant is aware that participation in the Competition is not recommended for persons with medical restrictions for physical culture and sports activities.</p>
                    <p style="padding-left:20px;"><strong>2.6.4.</strong> The Participant has read the terms of the Offer.</p>
                    <p style="padding-left:20px;"><strong>2.6.5.</strong> The Participant agrees to the unconditional and unqualified acceptance of the terms of this Offer and undertakes to strictly comply with the Competition Rules/Regulations, the requirements of the staff and the Organizer.</p>
                    <p style="padding-left:20px;"><strong>2.6.6.</strong> The Participant has read the internal documents of the Organizer published on the Organizer''s website.</p>
                    <p style="padding-left:20px;"><strong>2.6.7.</strong> The Participant assumes responsibility for any possible negative consequences of their participation in the Competition.</p>
                    <p style="padding-left:20px;"><strong>2.6.8.</strong> The Participant gives consent to the processing of personal data for the purposes of fulfilling this Offer, and for informing about goods and services of the Organizer and/or the Organizer''s partners.</p>
                    <p style="padding-left:20px;"><strong>2.6.9.</strong> The Participant gives consent to the publication and further use, including for commercial purposes, of their image obtained during the Competition.</p>
                </div>
            </div>

            <!-- Section 3 -->
            <div class="ip-rules-section ip-fade-in" id="offer-services">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Services Provided
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> The Organizer undertakes to provide, and the Participant undertakes to pay for, the following services for organizing participation in the Competition:</p>
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> grant the Participant the right to participate in the Competition specified in the Competition Rules published on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>;</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> provide the Participant with information via WhatsApp group or in the personal account on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a> regarding the approval of their application;</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> provide other related services (supply of drinking water, tennis balls, refreshments during the Competition, etc.), the list of which is specified in the Competition Rules/Regulations on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>.</p>
                    <p><strong>3.2.</strong> Information about the date, time and venue of the Competition, the Competition program and other necessary information is published on the Organizer''s website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>.</p>
                    <p><strong>3.3.</strong> Detailed information about the Competition may be communicated to the Participant by other available means, including by messaging to the phone number provided by the Participant during registration.</p>
                    <p><strong>3.4.</strong> The cost of services (entry fee) is determined by the Organizer independently and is indicated on the website in the section for the specific Competition.</p>
                    <p><strong>3.5.</strong> Payment of the entry fee is made in cashless form through the methods specified on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>. The date of payment is the date of debiting funds from the Participant''s account.</p>
                    <p><strong>3.6.</strong> All expenses for transferring funds to pay the entry fee, as well as expenses for paying the commission of the payment agent (sub-agent), are borne by the Participant.</p>
                </div>
            </div>

            <!-- Section 4 -->
            <div class="ip-rules-section ip-fade-in" id="offer-service-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Service Conditions
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> The service is provided by the Organizer on a one-time basis, on the date, at the time and at the venue of the Competition specified on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a> or in a message sent by the Organizer to the Participant''s phone number.</p>
                    <p><strong>4.2.</strong> The Participant assumes full responsibility for their medical condition during the Competition period, and bears all negative consequences associated with violation of this condition.</p>
                    <p><strong>4.3.</strong> The Organizer undertakes to:</p>
                    <p style="padding-left:20px;"><strong>4.3.1.</strong> inform the Participant of the date, time, and venue of the Competition, and provide other information necessary for participation;</p>
                    <p style="padding-left:20px;"><strong>4.3.2.</strong> provide the Participant with access to the Competition venue and tennis courts, subject to the Participant''s compliance with the requirements set out in the Competition Rules;</p>
                    <p style="padding-left:20px;"><strong>4.3.3.</strong> ensure by its own efforts and means the observance of public order and public safety measures at the Competition venue;</p>
                    <p style="padding-left:20px;"><strong>4.3.4.</strong> inform the Participant of the Competition results by publishing the final Competition protocol;</p>
                    <p style="padding-left:20px;"><strong>4.3.5.</strong> provide the Participant with an electronic Competition protocol containing the Participant''s name and their placement, by publishing it on the website;</p>
                    <p style="padding-left:20px;"><strong>4.3.6.</strong> notify the Participant of amendments and/or additions to the terms of this Offer by publishing the relevant information on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a>.</p>
                    <p><strong>4.4.</strong> The Organizer has the right to:</p>
                    <p style="padding-left:20px;"><strong>4.4.1.</strong> change the date, time and venue, and cancel the Competition, provided that the relevant information is published on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a> no later than 24 hours before the original date of the Competition;</p>
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> make changes to the Competition program, including changing the number of participants, by notifying the Participant through publication on the website <a href="https://www.tennis.kg" target="_blank" rel="noopener noreferrer">www.tennis.kg</a> or the private WhatsApp group;</p>
                    <p style="padding-left:20px;"><strong>4.4.3.</strong> establish and change the Competition rules, rules for visitors at the Competition venue, and other rules related to organizing and conducting the Competition, and require compliance with said rules from the Participant and other persons;</p>
                    <p style="padding-left:20px;"><strong>4.4.4.</strong> determine the procedure for photo and video recording during the Competition;</p>
                    <p style="padding-left:20px;"><strong>4.4.5.</strong> deny the Participant access to the Competition: in the absence of payment of the Organizer''s membership fees; in case of non-payment of the tournament entry fee by the Participant; if the Participant is in a state of alcohol, drug, or toxic intoxication; in case of violation by the Participant of the Competition Rules, other rules and instructions of the Organizer, as well as provisions of the current legislation of the Kyrgyz Republic.</p>
                    <p><strong>4.5.</strong> The Participant undertakes to:</p>
                    <p style="padding-left:20px;"><strong>4.5.1.</strong> pay the entry fee for participation in the Competition within the time frame and in the manner established by the Organizer;</p>
                    <p style="padding-left:20px;"><strong>4.5.2.</strong> when paying the entry fee and submitting the application, provide the Organizer with complete and accurate information: surname, first name, patronymic; date of birth (the Participant must be at least 18 years of age); contact phone number; other information indicated as mandatory in the registration form;</p>
                    <p style="padding-left:20px;"><strong>4.5.3.</strong> upon receiving notification of application approval for participation in the tournament, give consent to the processing of personal data by the Organizer for the purposes of fulfilling this Offer;</p>
                    <p style="padding-left:20px;"><strong>4.5.4.</strong> comply with the Competition Rules, and follow the instructions of the Organizer''s staff during the Competition;</p>
                    <p style="padding-left:20px;"><strong>4.5.5.</strong> not use the Organizer''s content containing the results of its intellectual activity without written consent, except in cases established by law.</p>
                    <p><strong>4.6.</strong> The Participant has the right to:</p>
                    <p style="padding-left:20px;"><strong>4.6.1.</strong> withdraw their application by notifying the tournament Organizer at least 3 calendar days before the start of the tournament and receive a refund of the entry fee. In case of withdrawal later than 3 days, the Organizer has the right to refuse to refund the entry fee.</p>
                    <p style="padding-left:20px;"><strong>4.6.2.</strong> during the Competition, receive necessary information from the Organizer''s staff.</p>
                    <p><strong>4.7.</strong> The Organizer is not liable for the loss or damage of the Participant''s property used during the Competition.</p>
                    <p><strong>4.8.</strong> The Organizer is not liable for damage to the life, health, or property of the Participant caused as a result of the Participant''s violation of safety measures during the Competition, as well as violation of rules established by the Organizer.</p>
                    <p><strong>4.9.</strong> The Organizer is not liable for the actions of third parties present at the Competition venue who are not employees of the Organizer.</p>
                    <p><strong>4.10.</strong> Disputes and disagreements arising in the course of fulfilling this Offer shall be resolved by the parties through negotiation.</p>
                </div>
            </div>

            <!-- Section 5 -->
            <div class="ip-rules-section ip-fade-in" id="offer-refusal">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Contract Termination
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> The Participant has the right to unilaterally withdraw from the Agreement no later than 3 calendar days before the date of the Competition by sending a notification to the tournament Organizer via WhatsApp phone number.</p>
                    <p><strong>5.2.</strong> When refunding funds paid as the entry fee, the Organizer has the right to retain the commission paid by the Participant to the payment agent and/or intermediary bank for accepting the payment.</p>
                    <p><strong>5.3.</strong> In case of withdrawal from the Agreement without notifying the Organizer at least 3 days in advance, funds paid as the entry fee shall not be refunded.</p>
                    <p><strong>5.4.</strong> The Organizer has the right to withdraw from the Agreement (cancel the Competition) by sending the Participant a notification via WhatsApp phone number, no later than 48 hours before the start of the Competition.</p>
                </div>
            </div>', 'Ачык оферта', '<!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;">Бул ачык оферта уюштуруучунун (кызмат көрсөтүүчүнүн) ушул офертада баяндалган шарттарда спорттук теннис иш-чараларына (мелдештерге) катышууну уюштуруу боюнча кызмат көрсөтүү келишимин түзүү сунушу болуп саналат.</p>
            </div>

            <!-- Table of Contents -->
            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Мазмуну</div>
                <ol class="ip-toc-list">
                    <li><a href="#offer-terms">Терминдер жана аныктамалар</a></li>
                    <li><a href="#offer-conditions">Ачык оферта шарттары</a></li>
                    <li><a href="#offer-services">Көрсөтүлүүчү кызматтардын тизмеси</a></li>
                    <li><a href="#offer-service-conditions">Кызмат көрсөтүү шарттары</a></li>
                    <li><a href="#offer-refusal">Келишимден баш тартуу</a></li>
                </ol>
            </div>

            <!-- Section 1 -->
            <div class="ip-rules-section ip-fade-in" id="offer-terms">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Терминдер жана аныктамалар
                </h2>
                <div class="ip-rules-list" style="list-style:none;">
                    <p><strong>1.1.</strong> «Оферта», «Ачык оферта» — уюштуруучунун Кыргыз Республикасынын Жарандык кодексинин 396, 398-беренелерине ылайык төмөндө баяндалган шарттарда спорттук теннис иш-чараларына катышууну уюштуруу боюнча Кызмат көрсөтүү келишимин түзүү сунушу.</p>
                    <p><strong>1.2.</strong> «Оферта акцепти» — офертага багытталган адамдын аны кабыл алуу жөнүндө жообу. Оферта акцепти катышуучунун оферта шарттарына толук жана шартсыз кошулуусун билдирет.</p>
                    <p><strong>1.3.</strong> «Уюштуруучу» — «Кыргызстандык теннис сүйүүчүлөрүнүн коомдоштугу» коомдук фонду, катталуу No 197575-3301-ОФ, ИНН 01905202110030, юридикалык дареги: Бишкек ш., Чүй пр., кв.26, директору Чокоева Айсулуу Эриковнанын жетектөөсүндө, Уставдын негизинде иш алып барат.</p>
                    <p><strong>1.4.</strong> «Келишим» — уюштуруучу тарабынан оферта шарттарында мелдешке катышууну уюштуруу боюнча кызмат көрсөтүү жөнүндө акы төлөмдүү макулдашуу. Келишим катышуучу менен уюштуруучу ортосунда катышуучу катталган конкреттүү мелдеш боюнча түзүлөт. Келишим түзүү үчүн уюштуруучу Интернет тармагында төмөнкү ресурстарды колдонот: www.tennis.kg сайты</p>
                    <p><strong>1.5.</strong> «Катышуучу» — ушул офертаны акцепттөө аркылуу уюштуруучу менен келишим түзгөн жеке адам.</p>
                    <p><strong>1.6.</strong> «Мелдеш» — ушул оферта шарттарында келишим түзүлгөн спорттук теннис иш-чарасы.</p>
                    <p><strong>1.7.</strong> «Мелдешти өткөрүү эрежелери», «Мелдештин регламенти» — ушул оферта шарттарында келишим түзүлгөн мелдешке катышуу шарттарын, тартибин жана катышуу тартибин аныктаган документ. Эрежелер уюштуруучу, анын персоналы, катышуучу жана мелдештин көрүүчүлөрү үчүн милдеттүү. Эрежелер ушул Офертада белгиленген мөөнөттө www.tennis.kg уюштуруучунун сайтына жайгаштырылат.</p>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="ip-rules-section ip-fade-in" id="offer-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Ачык оферта шарттары
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> Оферта уюштуруучунун www.tennis.kg сайтына жайгаштырылган күндөн тартып күчүнө кирет жана белгисиз мөөнөткө иштейт.</p>
                    <p><strong>2.2.</strong> Уюштуруучу офертаны каалаган убакта кайтарып алуу же катышуучу менен макулдашуусуз өзгөртүүлөрдү киргизүүгө укуктуу. Бардык өзгөртүүлөр жана толуктоолор www.tennis.kg сайтында жайгаштырылган учурдан тартып күчүнө кирет.</p>
                    <p><strong>2.3.</strong> Ушул офертанын акцепти катышуучунун www.tennis.kg сайтында мелдешке каттоо процедурасынан өтүүсү аркылуу жүзөгө ашырылат.</p>
                    <p><strong>2.4.</strong> Адам www.tennis.kg сайтындагы жеке кабинетинде мелдешке каттоо арызын жөнөткөн учурда же каттоо учурунда көрсөткөн телефон номери аркылуу оферта шарттарында уюштуруучу менен келишим түзгөн болуп эсептелет.</p>
                    <p><strong>2.5.</strong> Келишим түзүлгөн жер — Кыргыз Республикасы, Бишкек шаары.</p>
                    <p><strong>2.6.</strong> Ушул офертаны акцепттөө менен катышуучу төмөнкүлөрдү тастыктайт:</p>
                    <p style="padding-left:20px;"><strong>2.6.1.</strong> мелдешке катышуу жашоого жана ден соолукка тобокелдик менен байланышкан, физикалык жана акыл-эс чыңалуусун талап кылаарын, олуттуу физикалык жүктөмдөргө жана жаракат алуу коркунучуна алып келиши мүмкүн экенин билет;</p>
                    <p style="padding-left:20px;"><strong>2.6.2.</strong> ден соолугунун абалынан кабардар жана мелдешке катышууга тоскоол болгон медициналык каршы көрсөтмөлөрү жок;</p>
                    <p style="padding-left:20px;"><strong>2.6.3.</strong> дене тарбиясы жана спорт менен машыгууга медициналык чектөөлөрү бар адамдарга мелдешке катышуу сунушталбасын билет;</p>
                    <p style="padding-left:20px;"><strong>2.6.4.</strong> оферта шарттары менен тааныштырылган;</p>
                    <p style="padding-left:20px;"><strong>2.6.5.</strong> ушул Офертанын шарттарын шартсыз жана шартсыз кабыл алууга макул болот жана Мелдештерди/Мелдештердин регламенттерин, персоналдын жана уюштуруучунун талаптарын катуу сактоого милдеттенет;</p>
                    <p style="padding-left:20px;"><strong>2.6.6.</strong> Уюштуруучунун сайтында жарыяланган ички документтери менен таанышкан;</p>
                    <p style="padding-left:20px;"><strong>2.6.7.</strong> мелдешке катышуунун бардык мүмкүн болгон терс кесепеттери үчүн жоопкерчиликти өзүнө алат;</p>
                    <p style="padding-left:20px;"><strong>2.6.8.</strong> ушул офертаны аткаруу, уюштуруучунун жана/же уюштуруучунун өнөктөштөрүнүн товарлары жана кызматтары жөнүндө маалымдоо максатында жеке маалыматтарды иштетүүгө макулдугун берет;</p>
                    <p style="padding-left:20px;"><strong>2.6.9.</strong> мелдеш учурунда алынган сүрөтүн коммерциялык максаттарды кошо алганда, жарыялоого жана андан ары колдонууга макулдугун берет.</p>
                </div>
            </div>

            <!-- Section 3 -->
            <div class="ip-rules-section ip-fade-in" id="offer-services">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Көрсөтүлүүчү кызматтардын тизмеси
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Уюштуруучу Мелдешке катышууну уюштуруу боюнча төмөнкү кызматтарды көрсөтүүгө, ал эми катышуучу төлөөгө милдеттенет:</p>
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> катышуучуга www.tennis.kg сайтында жайгаштырылган мелдештин эрежелеринде көрсөтүлгөн мелдешке катышуу укугун берүү;</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> катышуучуга WhatsApp тобунда же www.tennis.kg сайтындагы жеке кабинетинде арызынын жактырылгандыгы жөнүндө маалымат берүү;</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> башка коштомо кызматтарды көрсөтүү (катышуучуну ичүүчү суу, топтор, мелдеш учурунда тамак менен камсыз кылуу ж.б.), тизмеси www.tennis.kg сайтындагы мелдешти өткөрүү эрежелеринде/Регламентте көрсөтүлгөн.</p>
                    <p><strong>3.2.</strong> Мелдештин күнү, убактысы жана өткөрүлүүчү жери, мелдештердин программасы жана башка зарыл маалымат уюштуруучунун www.tennis.kg сайтында жайгаштырылат.</p>
                    <p><strong>3.3.</strong> Мелдеш жөнүндө толук маалымат катышуучуга башка жеткиликтүү ыкма менен, анын ичинде каттоо учурунда катышуучу көрсөткөн телефон номерине жөнөтүү аркылуу берилиши мүмкүн.</p>
                    <p><strong>3.4.</strong> Кызматтардын наркы (взнос) уюштуруучу тарабынан өз алдынча аныкталат жана конкреттүү мелдеш бөлүмүндө сайтта көрсөтүлөт.</p>
                    <p><strong>3.5.</strong> Взносту төлөө www.tennis.kg сайтында көрсөтүлгөн ыкмалар менен накталай эмес тартипте жүзөгө ашырылат. Төлөм күнү Катышуучунун эсептешүү эсебинен акча каражаттарды алуу күнү болуп эсептелет.</p>
                    <p><strong>3.6.</strong> Взносту төлөө үчүн акча каражаттарды которуу, ошондой эле төлөм агентинин (субагенттин) комиссиясын төлөө менен байланышкан бардык чыгымдарды катышуучу көтөрөт.</p>
                </div>
            </div>

            <!-- Section 4 -->
            <div class="ip-rules-section ip-fade-in" id="offer-service-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Кызмат көрсөтүү шарттары
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Кызмат уюштуруучу тарабынан www.tennis.kg сайтында же уюштуруучу катышуучунун телефон номерине жөнөткөн билдирүүдө көрсөтүлгөн мелдештин күнүндө, убактысында жана жеринде бир жолу көрсөтүлөт.</p>
                    <p><strong>4.2.</strong> Катышуучу мелдештер учурунда өзүнүн медициналык абалы үчүн бардык жоопкерчиликти өзүнө алат жана ушул шартты бузуу менен байланышкан бардык терс кесепеттерди өзүнө жүктөйт.</p>
                    <p><strong>4.3.</strong> Уюштуруучу милдеттенет:</p>
                    <p style="padding-left:20px;"><strong>4.3.1.</strong> катышуучуну мелдештин күнү жана убактысы, өткөрүлүүчү жери жөнүндө маалымдоо, ошондой эле катышуу үчүн зарыл болгон башка маалыматтарды берүү;</p>
                    <p style="padding-left:20px;"><strong>4.3.2.</strong> мелдешти өткөрүү эрежелеринде белгиленген талаптарды катышуучу сактаган шартта, мелдешти өткөрүү жерине, теннис корттордуна кирүүнү камсыз кылуу;</p>
                    <p style="padding-left:20px;"><strong>4.3.3.</strong> мелдешти өткөрүү аймагында коомдук тартипти жана коомдук коопсуздукту сактоо чараларын өз күчү жана каражаттары менен камсыз кылуу;</p>
                    <p style="padding-left:20px;"><strong>4.3.4.</strong> мелдештин жыйынтык протоколун жайгаштыруу аркылуу катышуучуга мелдешке катышуунун натыйжасы жөнүндө маалымдоо;</p>
                    <p style="padding-left:20px;"><strong>4.3.5.</strong> катышуучуга, анын атын жана ээлеген ордун камтыган электрондук мелдеш протоколун сайтка жайгаштыруу аркылуу берүү;</p>
                    <p style="padding-left:20px;"><strong>4.3.6.</strong> ушул офертанын шарттарынын өзгөрүшү жана/же толукталышы жөнүндө тиешелүү маалыматты www.tennis.kg сайтына жайгаштыруу аркылуу катышуучуну кабарлоо.</p>
                    <p><strong>4.4.</strong> Уюштуруучу укуктуу:</p>
                    <p style="padding-left:20px;"><strong>4.4.1.</strong> мелдештин баштапкы күнүнөн кеминде 24 саат мурда www.tennis.kg сайтына тиешелүү маалыматты жайгаштыруу шартында мелдештин күнүн, убактысын жана жерин өзгөртүү жана мелдештерди жокко чыгаруу;</p>
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> мелдештердин программасына өзгөртүүлөрдү киргизүү, анын ичинде катышуучулардын санын өзгөртүү, бул тууралуу катышуучуну www.tennis.kg сайтына же жабык WhatsApp тобуна жайгаштыруу аркылуу билдирүү;</p>
                    <p style="padding-left:20px;"><strong>4.4.3.</strong> мелдештерди өткөрүү эрежелерин, мелдеш өткөрүлгөн жерде көрүүчүлөрдүн болуу эрежелерин, мелдешти уюштуруу жана өткөрүү менен байланышкан башка эрежелерди белгилөө жана өзгөртүү, катышуучудан жана башка адамдардан көрсөтүлгөн эрежелерди сактоону талап кылуу;</p>
                    <p style="padding-left:20px;"><strong>4.4.4.</strong> мелдеш учурунда фото жана видео тартуу тартибин аныктоо;</p>
                    <p style="padding-left:20px;"><strong>4.4.5.</strong> катышуучуну мелдешке катышуудан четтетүү: Уюштуруучунун мүчөлүк акылары төлөнбөгөн учурда; мелдеш үчүн взнос катышуучу тарабынан төлөнбөгөн учурда; катышуучу алкоголдук, баңги, уулуу мас абалында болгондо; катышуучу мелдешти өткөрүү эрежелерин, уюштуруучунун башка эрежелерин жана нускамаларын, ошондой эле Кыргыз Республикасынын колдонулуучу мыйзамдарынын жоболорун бузган учурда.</p>
                    <p><strong>4.5-4.10.</strong> Катышуучунун милдеттенмелери, укуктары жана жоопкерчилик чектери расмий документте толук баяндалган.</p>
                </div>
            </div>

            <!-- Section 5 -->
            <div class="ip-rules-section ip-fade-in" id="offer-refusal">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Келишимден баш тартуу
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Катышуучу мелдеш өткөрүлгөн күнгө чейин 3 календардык күн мурда WhatsApp телефон номери аркылуу уюштуруучуга билдирүү жөнөтүп, келишимден бир тараптуу баш тартууга укуктуу.</p>
                    <p><strong>5.2.</strong> Уюштуруучу старттык взнос катары төлөнгөн акча каражаттарды кайтарып бергенде, катышуучу төлөм агентине жана/же банк-ортомчуга төлөм кабыл алуу үчүн төлөгөн комиссияны алып калууга укуктуу.</p>
                    <p><strong>5.3.</strong> Уюштуруучуга 3 күн мурда билдирбей келишимден баш тарткан учурда, старттык взнос катары төлөнгөн акча каражаттар кайтарылбайт.</p>
                    <p><strong>5.4.</strong> Уюштуруучу мелдештин башталуу убактысына чейин 48 саат мурда катышуучуга WhatsApp телефон номери аркылуу билдирүү жөнөтүп, келишимден (мелдешти өткөрүүдөн) баш тартууга укуктуу.</p>
                </div>
            </div>')
ON CONFLICT (slug) DO NOTHING;   -- повторный запуск ничего не затрёт
