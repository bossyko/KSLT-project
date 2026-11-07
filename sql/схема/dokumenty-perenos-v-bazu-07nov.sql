-- ============================================================
-- ПЕРЕНОС ДОКУМЕНТОВ ИЗ ФАЙЛОВ В БАЗУ — 06.11.2026
-- ============================================================
--
-- СОБРАНО: tools/sobrat-perenos-dokumentov.js. Руками не правится:
-- поправь файл страницы и собери заново, иначе файл и база разойдутся
-- снова, а именно от этого весь кусок.
--
-- ПОВОД. На сайте и в приложении текст документов берётся из
-- site_documents (js/site-content.js:177), и ответ базы ЗАМЕЩАЕТ
-- разметку страницы. Работа 06.11 — выравнивание трёх редакций,
-- 13 дописанных пунктов кыргызской оферты, снятие черновой пометки,
-- адрес без www — легла в файлы, то есть в запасной вариант.
--
-- ЗАМЕР БАЗЫ 06.11 (до переноса):
--   offer   ru 64 · en 63 · kg 52   www: во всех трёх
--   terms   ru 35 · en 31 · kg 31   www: нет
--   privacy ru 60 · en 54 · kg 54   www: во всех трёх, редакция августа
-- В ФАЙЛАХ ПОСЛЕ ПРАВОК 06.11:
--   offer   ru 64 · en 63 · kg 64
--   terms   ru 35 · en 35 · kg 35
--
-- PRIVACY СЮДА НЕ ВХОДИТ НАМЕРЕННО: политика переписывается по
-- редакции, утверждённой приказом № 1 от 3 ноября 2026, и поедет
-- отдельным файлом.
--
-- ЭТОТ ФАЙЛ МЕНЯЕТ БАЗУ. Прогонять по слову Кости.
-- ПОСЛЕ ПРОГОНА — перечитать базу: sql/схема/dokumenty-chto-v-baze-06nov.sql

-- ---- offer ----------------------------------------------------
INSERT INTO public.site_documents (slug, title, title_en, title_kg, body, body_en, body_kg)
VALUES ('offer',
        NULL, NULL, NULL,
        $kslt$
            <!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">Настоящая публичная оферта представляет собой предложение организатора (исполнителя услуг) заключить договор оказания услуг по организации участия в спортивных теннисных мероприятиях (соревнованиях) на условиях, изложенных в настоящей оферте.</p>
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
                    <p><strong>1.3.</strong> «Организатор» — Общественный фонд «Кыргызстанское сообщество любителей тенниса», регистрационный No 197575-3301-ОФ, ИНН 01905202110030, юридический адрес: Кыргызская Республика, г. Бишкек, Свердловский район, пр. Чуй, 127, кв. 26, в лице директора Чокоевой Айсулуу Эриковны, действующая на основании Устава, являющийся исполнителем услуг по организации участия в спортивных теннисных мероприятиях (соревнованиях), которое осуществляет организационное, финансовое и иное обеспечение его подготовки и проведения.</p>
                    <p><strong>1.4.</strong> «Договор» — возмездное соглашение об оказании организатором услуг по организации участия в соревновании на условиях оферты. Договор заключается между участником и организатором в отношении конкретного соревнования, на которое зарегистрирован участник. Для заключения договора организатор использует следующие ресурсы в сети Интернет: сайт tennis.kg</p>
                    <p><strong>1.5.</strong> «Участник» — физическое лицо, заключившее с организатором договор, путем акцепта настоящей оферты.</p>
                    <p><strong>1.6.</strong> «Соревнование» — спортивное теннисное мероприятие, по поводу которого заключен договор на условиях настоящей оферты.</p>
                    <p><strong>1.7.</strong> «Правила проведения соревнования», «Регламент соревнования» — документ, определяющий условия, порядок проведения и участия в соревновании, по поводу которых заключен договор на условиях настоящей оферты. Правила обязательны для организатора, его персонала, участника и посетителей соревнования. Правила размещаются на сайте организатора tennis.kg в сроки, определенные настоящей Офертой.</p>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="ip-rules-section ip-fade-in" id="offer-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Условия публичной оферты
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> Оферта вступает в силу со дня размещения её в сети Интернет на сайте организатора по адресу: tennis.kg и действует в течение неопределенного срока.</p>
                    <p><strong>2.2.</strong> Организатор вправе отозвать оферту в любое время либо внести в нее изменения без согласования с участником. Все изменения и дополнения вступают в силу с момента их размещения на сайте tennis.kg.</p>
                    <p><strong>2.3.</strong> Акцепт настоящей оферты осуществляется путем прохождения участником процедуры регистрации на соревнование на сайте tennis.kg</p>
                    <p><strong>2.4.</strong> Лицо считается заключившим с организатором договор на условиях оферты в момент направления регистрации его заявки на соревнование в личном кабинете на сайте tennis.kg, или по телефону указанному им при прохождении процедуры регистрации.</p>
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
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> предоставить участнику право на участие в соревновании, указанном в правилах проведения соревнования и размещенных на сайте tennis.kg;</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> предоставить участнику информацию в группе WhatsApp, в приложении «KSLT Tennis» или в личном кабинете на сайте tennis.kg о одобрении его заявки;</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> оказать иные сопутствующие услуги (обеспечение участника питьевой водой, мячами, перекусом в ходе проведения соревнования и др.), перечень которых указан в правилах проведения соревнования/Регламенте на сайте tennis.kg.</p>
                    <p><strong>3.2.</strong> Информация о дате, времени и месте проведения соревнования, программа соревнований и иная необходимая информация размещается на сайте организатора tennis.kg.</p>
                    <p><strong>3.3.</strong> Подробная информация о соревновании может быть доведена до участника иным доступным способом, в том числе путем рассылки по номеру телефона, указанному участником при регистрации.</p>
                    <p><strong>3.4.</strong> Стоимость услуг (взнос) определяется организатором самостоятельно и указывается на сайте в разделе о конкретном соревновании.</p>
                    <p><strong>3.5.</strong> Оплата взноса осуществляется в безналичном порядке способами, указанными на сайте tennis.kg. Датой оплаты признается дата списания денежных средств с расчетного счета Участника.</p>
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
                    <p><strong>4.1.</strong> Услуга оказывается организатором однократно, в дату, время и в месте проведения соревнования, указанном на сайте tennis.kg или в сообщении, направленном организатором по номеру телефона участника.</p>
                    <p><strong>4.2.</strong> Участник принимает на себя всю ответственность за свое медицинское состояние в период проведения соревнований, и относит на себя все негативные последствия связанные с нарушением данного условия.</p>
                    <p><strong>4.3.</strong> Организатор обязуется:</p>
                    <p style="padding-left:20px;"><strong>4.3.1.</strong> информировать участника о дате и времени, месте проведения соревнования, а также предоставить иную необходимую для участия информацию;</p>
                    <p style="padding-left:20px;"><strong>4.3.2.</strong> обеспечить участнику допуск к месту проведения соревнования, теннисные корты, при условии соблюдения участником требований, установленных в правилах проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.3.3.</strong> своими силами и средствами обеспечить соблюдение мер общественного порядка и общественной безопасности на территории проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.3.4.</strong> проинформировать участника о результате участия в соревновании путем размещения заключительного протокола соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.3.5.</strong> предоставить участнику электронный протокол соревнований, содержащий имя Участника и занятое им место, путем его размещения на сайте;</p>
                    <p style="padding-left:20px;"><strong>4.3.6.</strong> уведомлять участника об изменении и/или дополнении условий настоящей оферты посредством размещения соответствующей информации на сайте tennis.kg.</p>
                    <p><strong>4.4.</strong> Организатор вправе:</p>
                    <p style="padding-left:20px;"><strong>4.4.1.</strong> изменять дату, время и место проведения и отменять соревнования при условии размещения соответствующей информации на сайте tennis.kg не позднее, чем за 24 часа до первоначальной даты проведения соревнования;</p>
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> вносить изменения в программу соревнований, в том числе изменять количество участников, уведомив об этом участника посредством размещения на сайте tennis.kg, в приложении «KSLT Tennis» или в закрытой группе WhatsApp;</p>
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
                    <p><strong>5.4.</strong> Организатор имеет право отказаться от договора (от проведения соревнования) путем направления участнику уведомления по номеру телефона в WhatsApp либо через приложение «KSLT Tennis», за 48 часов до времени начала соревнования.</p>
                </div>
            </div>
$kslt$,
        $kslt$
            <div class="ip-toc ip-fade-in">
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
                    <p><strong>1.2.</strong> <strong>"Acceptance of the Offer"</strong> — a person's response indicating acceptance thereof. Acceptance of the Offer signifies full and unconditional adherence by the Participant to the terms and conditions of the Offer.</p>
                    <p><strong>1.3.</strong> <strong>"Organizer"</strong> — Public Foundation "Kyrgyzstan Social Lawn Tennis Community" (KSLT), Registration No. 197575-3301-PF, TIN 01905202110030, legal address: Kyrgyz Republic, Bishkek city, Sverdlovsky district, Chuy Ave. 127, apt. 26, represented by Director Chokoeva Aisuluu Erikovna, acting on the basis of the Charter, being the service provider for organizing participation in sports tennis events (competitions), which carries out organizational, financial and other support for their preparation and conduct.</p>
                    <p><strong>1.4.</strong> <strong>"Agreement"</strong> — a compensated agreement on the provision of services by the Organizer for organizing participation in a Competition under the terms of the Offer. The Agreement is concluded between the Participant and the Organizer in relation to a specific Competition for which the Participant has registered. To conclude the Agreement, the Organizer uses the following Internet resources: website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>.</p>
                    <p><strong>1.5.</strong> <strong>"Participant"</strong> — an individual who has entered into the Agreement with the Organizer by accepting this Offer.</p>
                    <p><strong>1.6.</strong> <strong>"Competition"</strong> — a sports tennis event in relation to which the Agreement has been concluded under the terms of this Offer.</p>
                    <p><strong>1.7.</strong> <strong>"Competition Rules"</strong>, <strong>"Competition Regulations"</strong> — a document defining the terms, procedures for conducting and participating in a Competition in relation to which the Agreement has been concluded under the terms of this Offer. The Rules are binding on the Organizer, its staff, the Participant and visitors of the Competition. The Rules are published on the Organizer's website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> within the time frames specified in this Offer.</p>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="ip-rules-section ip-fade-in" id="offer-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Public Offer Conditions
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> This Offer enters into force from the date of its publication on the Internet on the Organizer's website at: <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> and is valid for an indefinite period.</p>
                    <p><strong>2.2.</strong> The Organizer reserves the right to withdraw the Offer at any time or make amendments to it without the Participant's consent. All amendments and additions enter into force from the moment of their publication on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>.</p>
                    <p><strong>2.3.</strong> Acceptance of this Offer is performed by the Participant completing the registration procedure for a Competition on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>.</p>
                    <p><strong>2.4.</strong> A person is deemed to have concluded the Agreement with the Organizer under the terms of the Offer at the moment of submitting their registration application for the Competition in their personal account on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>, or by phone number provided during the registration procedure.</p>
                    <p><strong>2.5.</strong> Place of contract conclusion: Kyrgyz Republic, Bishkek city.</p>
                    <p><strong>2.6.</strong> By accepting this Offer, the Participant confirms the following:</p>
                    <p style="padding-left:20px;"><strong>2.6.1.</strong> The Participant is aware that participation in the Competition involves risk to life and health, requires physical and mental exertion, and may lead to significant physical strain and the risk of injury.</p>
                    <p style="padding-left:20px;"><strong>2.6.2.</strong> The Participant is aware of their health condition and has no medical contraindications to participating in the Competition.</p>
                    <p style="padding-left:20px;"><strong>2.6.3.</strong> The Participant is aware that participation in the Competition is not recommended for persons with medical restrictions for physical culture and sports activities.</p>
                    <p style="padding-left:20px;"><strong>2.6.4.</strong> The Participant has read the terms of the Offer.</p>
                    <p style="padding-left:20px;"><strong>2.6.5.</strong> The Participant agrees to the unconditional and unqualified acceptance of the terms of this Offer and undertakes to strictly comply with the Competition Rules/Regulations, the requirements of the staff and the Organizer.</p>
                    <p style="padding-left:20px;"><strong>2.6.6.</strong> The Participant has read the internal documents of the Organizer published on the Organizer's website.</p>
                    <p style="padding-left:20px;"><strong>2.6.7.</strong> The Participant assumes responsibility for any possible negative consequences of their participation in the Competition.</p>
                    <p style="padding-left:20px;"><strong>2.6.8.</strong> The Participant gives consent to the processing of personal data for the purposes of fulfilling this Offer, and for informing about goods and services of the Organizer and/or the Organizer's partners.</p>
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
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> grant the Participant the right to participate in the Competition specified in the Competition Rules published on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>;</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> provide the Participant with information via WhatsApp group, in the «KSLT Tennis» application or in the personal account on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> regarding the approval of their application;</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> provide other related services (supply of drinking water, tennis balls, refreshments during the Competition, etc.), the list of which is specified in the Competition Rules/Regulations on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>.</p>
                    <p><strong>3.2.</strong> Information about the date, time and venue of the Competition, the Competition program and other necessary information is published on the Organizer's website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>.</p>
                    <p><strong>3.3.</strong> Detailed information about the Competition may be communicated to the Participant by other available means, including by messaging to the phone number provided by the Participant during registration.</p>
                    <p><strong>3.4.</strong> The cost of services (entry fee) is determined by the Organizer independently and is indicated on the website in the section for the specific Competition.</p>
                    <p><strong>3.5.</strong> Payment of the entry fee is made in cashless form through the methods specified on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>. The date of payment is the date of debiting funds from the Participant's account.</p>
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
                    <p><strong>4.1.</strong> The service is provided by the Organizer on a one-time basis, on the date, at the time and at the venue of the Competition specified on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> or in a message sent by the Organizer to the Participant's phone number.</p>
                    <p><strong>4.2.</strong> The Participant assumes full responsibility for their medical condition during the Competition period, and bears all negative consequences associated with violation of this condition.</p>
                    <p><strong>4.3.</strong> The Organizer undertakes to:</p>
                    <p style="padding-left:20px;"><strong>4.3.1.</strong> inform the Participant of the date, time, and venue of the Competition, and provide other information necessary for participation;</p>
                    <p style="padding-left:20px;"><strong>4.3.2.</strong> provide the Participant with access to the Competition venue and tennis courts, subject to the Participant's compliance with the requirements set out in the Competition Rules;</p>
                    <p style="padding-left:20px;"><strong>4.3.3.</strong> ensure by its own efforts and means the observance of public order and public safety measures at the Competition venue;</p>
                    <p style="padding-left:20px;"><strong>4.3.4.</strong> inform the Participant of the Competition results by publishing the final Competition protocol;</p>
                    <p style="padding-left:20px;"><strong>4.3.5.</strong> provide the Participant with an electronic Competition protocol containing the Participant's name and their placement, by publishing it on the website;</p>
                    <p style="padding-left:20px;"><strong>4.3.6.</strong> notify the Participant of amendments and/or additions to the terms of this Offer by publishing the relevant information on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>.</p>
                    <p><strong>4.4.</strong> The Organizer has the right to:</p>
                    <p style="padding-left:20px;"><strong>4.4.1.</strong> change the date, time and venue, and cancel the Competition, provided that the relevant information is published on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> no later than 24 hours before the original date of the Competition;</p>
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> make changes to the Competition program, including changing the number of participants, by notifying the Participant through publication on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a>, in the «KSLT Tennis» application or in the private WhatsApp group;</p>
                    <p style="padding-left:20px;"><strong>4.4.3.</strong> establish and change the Competition rules, rules for visitors at the Competition venue, and other rules related to organizing and conducting the Competition, and require compliance with said rules from the Participant and other persons;</p>
                    <p style="padding-left:20px;"><strong>4.4.4.</strong> determine the procedure for photo and video recording during the Competition;</p>
                    <p style="padding-left:20px;"><strong>4.4.5.</strong> deny the Participant access to the Competition: in the absence of payment of the Organizer's membership fees; in case of non-payment of the tournament entry fee by the Participant; if the Participant is in a state of alcohol, drug, or toxic intoxication; in case of violation by the Participant of the Competition Rules, other rules and instructions of the Organizer, as well as provisions of the current legislation of the Kyrgyz Republic.</p>
                    <p><strong>4.5.</strong> The Participant undertakes to:</p>
                    <p style="padding-left:20px;"><strong>4.5.1.</strong> pay the entry fee for participation in the Competition within the time frame and in the manner established by the Organizer;</p>
                    <p style="padding-left:20px;"><strong>4.5.2.</strong> when paying the entry fee and submitting the application, provide the Organizer with complete and accurate information: surname, first name, patronymic; date of birth (the Participant must be at least 18 years of age); contact phone number; other information indicated as mandatory in the registration form;</p>
                    <p style="padding-left:20px;"><strong>4.5.3.</strong> upon receiving notification of application approval for participation in the tournament, give consent to the processing of personal data by the Organizer for the purposes of fulfilling this Offer;</p>
                    <p style="padding-left:20px;"><strong>4.5.4.</strong> comply with the Competition Rules, and follow the instructions of the Organizer's staff during the Competition;</p>
                    <p style="padding-left:20px;"><strong>4.5.5.</strong> not use the Organizer's content containing the results of its intellectual activity without written consent, except in cases established by law.</p>
                    <p><strong>4.6.</strong> The Participant has the right to:</p>
                    <p style="padding-left:20px;"><strong>4.6.1.</strong> withdraw their application by notifying the tournament Organizer at least 3 calendar days before the start of the tournament and receive a refund of the entry fee. In case of withdrawal later than 3 days, the Organizer has the right to refuse to refund the entry fee.</p>
                    <p style="padding-left:20px;"><strong>4.6.2.</strong> during the Competition, receive necessary information from the Organizer's staff.</p>
                    <p><strong>4.7.</strong> The Organizer is not liable for the loss or damage of the Participant's property used during the Competition.</p>
                    <p><strong>4.8.</strong> The Organizer is not liable for damage to the life, health, or property of the Participant caused as a result of the Participant's violation of safety measures during the Competition, as well as violation of rules established by the Organizer.</p>
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
                    <p><strong>5.4.</strong> The Organizer has the right to withdraw from the Agreement (cancel the Competition) by sending the Participant a notification via WhatsApp phone number or through the «KSLT Tennis» application, no later than 48 hours before the start of the Competition.</p>
                </div>
            </div>
$kslt$,
        $kslt$
            <!-- Preamble -->
            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">Бул ачык оферта уюштуруучунун (кызмат көрсөтүүчүнүн) ушул офертада баяндалган шарттарда спорттук теннис иш-чараларына (мелдештерге) катышууну уюштуруу боюнча кызмат көрсөтүү келишимин түзүү сунушу болуп саналат.</p>
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
                    <p><strong>1.3.</strong> «Уюштуруучу» — «Кыргызстандык теннис сүйүүчүлөрүнүн коомдоштугу» коомдук фонду, катталуу No 197575-3301-ОФ, ИНН 01905202110030, юридикалык дареги: Кыргыз Республикасы, Бишкек ш., Свердлов району, Чүй пр., 127, 26-батир, директору Чокоева Айсулуу Эриковнанын жетектөөсүндө, Уставдын негизинде иш алып барат.</p>
                    <p><strong>1.4.</strong> «Келишим» — уюштуруучу тарабынан оферта шарттарында мелдешке катышууну уюштуруу боюнча кызмат көрсөтүү жөнүндө акы төлөмдүү макулдашуу. Келишим катышуучу менен уюштуруучу ортосунда катышуучу катталган конкреттүү мелдеш боюнча түзүлөт. Келишим түзүү үчүн уюштуруучу Интернет тармагында төмөнкү ресурстарды колдонот: tennis.kg сайты</p>
                    <p><strong>1.5.</strong> «Катышуучу» — ушул офертаны акцепттөө аркылуу уюштуруучу менен келишим түзгөн жеке адам.</p>
                    <p><strong>1.6.</strong> «Мелдеш» — ушул оферта шарттарында келишим түзүлгөн спорттук теннис иш-чарасы.</p>
                    <p><strong>1.7.</strong> «Мелдешти өткөрүү эрежелери», «Мелдештин регламенти» — ушул оферта шарттарында келишим түзүлгөн мелдешке катышуу шарттарын, тартибин жана катышуу тартибин аныктаган документ. Эрежелер уюштуруучу, анын персоналы, катышуучу жана мелдештин көрүүчүлөрү үчүн милдеттүү. Эрежелер ушул Офертада белгиленген мөөнөттө tennis.kg уюштуруучунун сайтына жайгаштырылат.</p>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="ip-rules-section ip-fade-in" id="offer-conditions">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Ачык оферта шарттары
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> Оферта уюштуруучунун tennis.kg сайтына жайгаштырылган күндөн тартып күчүнө кирет жана белгисиз мөөнөткө иштейт.</p>
                    <p><strong>2.2.</strong> Уюштуруучу офертаны каалаган убакта кайтарып алуу же катышуучу менен макулдашуусуз өзгөртүүлөрдү киргизүүгө укуктуу. Бардык өзгөртүүлөр жана толуктоолор tennis.kg сайтында жайгаштырылган учурдан тартып күчүнө кирет.</p>
                    <p><strong>2.3.</strong> Ушул офертанын акцепти катышуучунун tennis.kg сайтында мелдешке каттоо процедурасынан өтүүсү аркылуу жүзөгө ашырылат.</p>
                    <p><strong>2.4.</strong> Адам tennis.kg сайтындагы жеке кабинетинде мелдешке каттоо арызын жөнөткөн учурда же каттоо учурунда көрсөткөн телефон номери аркылуу оферта шарттарында уюштуруучу менен келишим түзгөн болуп эсептелет.</p>
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
                    <p style="padding-left:20px;"><strong>3.1.1.</strong> катышуучуга tennis.kg сайтында жайгаштырылган мелдештин эрежелеринде көрсөтүлгөн мелдешке катышуу укугун берүү;</p>
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> катышуучуга WhatsApp тобунда, «KSLT Tennis» тиркемесинде же tennis.kg сайтындагы жеке кабинетинде арызынын жактырылгандыгы жөнүндө маалымат берүү;</p>
                    <p style="padding-left:20px;"><strong>3.1.3.</strong> башка коштомо кызматтарды көрсөтүү (катышуучуну ичүүчү суу, топтор, мелдеш учурунда тамак менен камсыз кылуу ж.б.), тизмеси tennis.kg сайтындагы мелдешти өткөрүү эрежелеринде/Регламентте көрсөтүлгөн.</p>
                    <p><strong>3.2.</strong> Мелдештин күнү, убактысы жана өткөрүлүүчү жери, мелдештердин программасы жана башка зарыл маалымат уюштуруучунун tennis.kg сайтында жайгаштырылат.</p>
                    <p><strong>3.3.</strong> Мелдеш жөнүндө толук маалымат катышуучуга башка жеткиликтүү ыкма менен, анын ичинде каттоо учурунда катышуучу көрсөткөн телефон номерине жөнөтүү аркылуу берилиши мүмкүн.</p>
                    <p><strong>3.4.</strong> Кызматтардын наркы (взнос) уюштуруучу тарабынан өз алдынча аныкталат жана конкреттүү мелдеш бөлүмүндө сайтта көрсөтүлөт.</p>
                    <p><strong>3.5.</strong> Взносту төлөө tennis.kg сайтында көрсөтүлгөн ыкмалар менен накталай эмес тартипте жүзөгө ашырылат. Төлөм күнү Катышуучунун эсептешүү эсебинен акча каражаттарды алуу күнү болуп эсептелет.</p>
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
                    <p><strong>4.1.</strong> Кызмат уюштуруучу тарабынан tennis.kg сайтында же уюштуруучу катышуучунун телефон номерине жөнөткөн билдирүүдө көрсөтүлгөн мелдештин күнүндө, убактысында жана жеринде бир жолу көрсөтүлөт.</p>
                    <p><strong>4.2.</strong> Катышуучу мелдештер учурунда өзүнүн медициналык абалы үчүн бардык жоопкерчиликти өзүнө алат жана ушул шартты бузуу менен байланышкан бардык терс кесепеттерди өзүнө жүктөйт.</p>
                    <p><strong>4.3.</strong> Уюштуруучу милдеттенет:</p>
                    <p style="padding-left:20px;"><strong>4.3.1.</strong> катышуучуну мелдештин күнү жана убактысы, өткөрүлүүчү жери жөнүндө маалымдоо, ошондой эле катышуу үчүн зарыл болгон башка маалыматтарды берүү;</p>
                    <p style="padding-left:20px;"><strong>4.3.2.</strong> мелдешти өткөрүү эрежелеринде белгиленген талаптарды катышуучу сактаган шартта, мелдешти өткөрүү жерине, теннис корттордуна кирүүнү камсыз кылуу;</p>
                    <p style="padding-left:20px;"><strong>4.3.3.</strong> мелдешти өткөрүү аймагында коомдук тартипти жана коомдук коопсуздукту сактоо чараларын өз күчү жана каражаттары менен камсыз кылуу;</p>
                    <p style="padding-left:20px;"><strong>4.3.4.</strong> мелдештин жыйынтык протоколун жайгаштыруу аркылуу катышуучуга мелдешке катышуунун натыйжасы жөнүндө маалымдоо;</p>
                    <p style="padding-left:20px;"><strong>4.3.5.</strong> катышуучуга, анын атын жана ээлеген ордун камтыган электрондук мелдеш протоколун сайтка жайгаштыруу аркылуу берүү;</p>
                    <p style="padding-left:20px;"><strong>4.3.6.</strong> ушул офертанын шарттарынын өзгөрүшү жана/же толукталышы жөнүндө тиешелүү маалыматты tennis.kg сайтына жайгаштыруу аркылуу катышуучуну кабарлоо.</p>
                    <p><strong>4.4.</strong> Уюштуруучу укуктуу:</p>
                    <p style="padding-left:20px;"><strong>4.4.1.</strong> мелдештин баштапкы күнүнөн кеминде 24 саат мурда tennis.kg сайтына тиешелүү маалыматты жайгаштыруу шартында мелдештин күнүн, убактысын жана жерин өзгөртүү жана мелдештерди жокко чыгаруу;</p>
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> мелдештердин программасына өзгөртүүлөрдү киргизүү, анын ичинде катышуучулардын санын өзгөртүү, бул тууралуу катышуучуну tennis.kg сайтына, «KSLT Tennis» тиркемесине же жабык WhatsApp тобуна жайгаштыруу аркылуу билдирүү;</p>
                    <p style="padding-left:20px;"><strong>4.4.3.</strong> мелдештерди өткөрүү эрежелерин, мелдеш өткөрүлгөн жерде көрүүчүлөрдүн болуу эрежелерин, мелдешти уюштуруу жана өткөрүү менен байланышкан башка эрежелерди белгилөө жана өзгөртүү, катышуучудан жана башка адамдардан көрсөтүлгөн эрежелерди сактоону талап кылуу;</p>
                    <p style="padding-left:20px;"><strong>4.4.4.</strong> мелдеш учурунда фото жана видео тартуу тартибин аныктоо;</p>
                    <p style="padding-left:20px;"><strong>4.4.5.</strong> катышуучуну мелдешке катышуудан четтетүү: Уюштуруучунун мүчөлүк акылары төлөнбөгөн учурда; мелдеш үчүн взнос катышуучу тарабынан төлөнбөгөн учурда; катышуучу алкоголдук, баңги, уулуу мас абалында болгондо; катышуучу мелдешти өткөрүү эрежелерин, уюштуруучунун башка эрежелерин жана нускамаларын, ошондой эле Кыргыз Республикасынын колдонулуучу мыйзамдарынын жоболорун бузган учурда.</p>
                    <p><strong>4.5.</strong> Катышуучу милдеттенет:</p>
                    <p style="padding-left:20px;"><strong>4.5.1.</strong> мелдешке катышуу үчүн төгүмдү уюштуруучу белгилеген мөөнөттө жана тартипте төлөөгө;</p>
                    <p style="padding-left:20px;"><strong>4.5.2.</strong> төгүмдү төлөөдө жана арыз берүүдө уюштуруучуга өзү жөнүндө толук жана чыныгы маалыматтарды берүүгө: фамилиясын, атын, атасынын атын; туулган күнүн (катышуучу 18 жашка толгон болушу керек); байланыш телефону жөнүндө маалыматты; каттоо формасында милдеттүү деп көрсөтүлгөн башка маалыматтарды;</p>
                    <p style="padding-left:20px;"><strong>4.5.3.</strong> мелдешке катышуу арызы жактырылгандыгы жөнүндө билдирүү алганда, ушул офертаны аткаруу максатында уюштуруучунун жеке маалыматтарды иштетүүсүнө макулдук берүүгө;</p>
                    <p style="padding-left:20px;"><strong>4.5.4.</strong> мелдештерди өткөрүү эрежелерин сактоого, ошондой эле мелдештин жүрүшүндө уюштуруучунун персоналынын көрсөтмөлөрүн аткарууга;</p>
                    <p style="padding-left:20px;"><strong>4.5.5.</strong> уюштуруучунун интеллектуалдык ишинин натыйжаларын камтыган контентин анын жазуу жүзүндөгү макулдугусуз колдонбоого, мыйзамда белгиленген учурлардан тышкары.</p>
                    <p><strong>4.6.</strong> Катышуучу укуктуу:</p>
                    <p style="padding-left:20px;"><strong>4.6.1.</strong> мелдеш башталаардан 3 календардык күн мурун мелдештин уюштуруучусуна билдирип, арызын алып салууга жана төгүмдү кайтарып алууга. 3 күндөн кеч баш тартканда, Уюштуруучу төгүмдү кайтаруудан баш тартууга укуктуу.</p>
                    <p style="padding-left:20px;"><strong>4.6.2.</strong> мелдештин өткөрүлүшү учурунда уюштуруучунун персоналынан керектүү маалыматты алууга.</p>
                    <p><strong>4.7.</strong> Уюштуруучу мелдештин учурунда колдонулган катышуучунун мүлкүнүн жоголушу жана бузулушу үчүн жоопкерчилик тартпайт.</p>
                    <p><strong>4.8.</strong> Уюштуруучу катышуучунун мелдешти өткөрүүдөгү коопсуздук чараларын бузуусунун, ошондой эле уюштуруучу белгилеген эрежелерди бузуусунун натыйжасында катышуучунун өмүрүнө, ден соолугуна жана мүлкүнө келтирилген зыян үчүн жоопкерчилик тартпайт.</p>
                    <p><strong>4.9.</strong> Уюштуруучу мелдеш өткөрүлүп жаткан жерде бар болгон, уюштуруучунун кызматкерлери болбогон үчүнчү жактардын аракеттери үчүн жоопкерчилик тартпайт.</p>
                    <p><strong>4.10.</strong> Ушул офертаны аткаруу процессинде келип чыккан талаштар жана пикир келишпестиктер тараптар тарабынан сүйлөшүүлөр жолу менен чечилет.</p>
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
                    <p><strong>5.4.</strong> Уюштуруучу мелдештин башталуу убактысына чейин 48 саат мурда катышуучуга WhatsApp телефон номери аркылуу же «KSLT Tennis» тиркемеси аркылуу билдирүү жөнөтүп, келишимден (мелдешти өткөрүүдөн) баш тартууга укуктуу.</p>
                </div>
            </div>
$kslt$)
ON CONFLICT (slug) DO UPDATE SET
    body    = EXCLUDED.body,
    body_en = EXCLUDED.body_en,
    body_kg = EXCLUDED.body_kg,
    title    = COALESCE(public.site_documents.title,    EXCLUDED.title),
    title_en = COALESCE(public.site_documents.title_en, EXCLUDED.title_en),
    title_kg = COALESCE(public.site_documents.title_kg, EXCLUDED.title_kg);

-- ---- terms ----------------------------------------------------
INSERT INTO public.site_documents (slug, title, title_en, title_kg, body, body_en, body_kg)
VALUES ('terms',
        NULL, NULL, NULL,
        $kslt$            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">Утверждено приказом руководителя ОФ «КСЛТ» № 1 от 3 ноября 2026 г.</p>
                <p class="ip-doc-approved-line">Редакция от 3 ноября 2026 г.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">Настоящее Пользовательское соглашение заключается между ОФ «КСЛТ» и каждым, кто пользуется сайтом <a href="https://tennis.kg">tennis.kg</a> и приложениями «KSLT Tennis». Полный текст приведён ниже и имеет силу целиком.</p>
            </div>

            <div class="ip-doc-gist ip-fade-in">
                <div class="ip-doc-gist-title">Коротко о главном</div>
                <p class="ip-doc-gist-note">Это краткое изложение для удобства чтения. Оно не заменяет документ: действует полный текст ниже.</p>
                <ul class="ip-doc-gist-list">
                    <li><strong>Что это.</strong> Договор между вами и КСЛТ о пользовании сервисом: рейтингом, турнирами, баттлами, поиском партнёра, каталогами кортов и тренеров.</li>
                    <li><strong>Когда он заключён.</strong> Когда вы ставите отметку при регистрации или впервые входите через Google, Apple или Telegram.</li>
                    <li><strong>Что бесплатно.</strong> Всё, кроме взносов со страницы «Цены»: вступительного, членских и турнирных. Смотреть рейтинг, турниры и новости можно без регистрации.</li>
                    <li><strong>Чего нельзя.</strong> Оскорблять и преследовать, выдавать себя за другого, заводить второй аккаунт, вносить ложные результаты, собирать данные роботом.</li>
                    <li><strong>Ваши материалы — ваши.</strong> Фото и сообщения остаются вашими; мы показываем их только внутри сервиса. За его пределами — с отдельного согласия.</li>
                    <li><strong>Если что-то не так.</strong> Жалоба через «Обратную связь» или почтой; ответ в срок до 5 рабочих дней. Споры о счёте матча решает главный судья.</li>
                    <li><strong>Уйти можно в любой момент.</strong> Удаление аккаунта в профиле или письмом, с расчётом по оплаченному членству.</li>
                </ul>
            </div>

            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Содержание</div>
                <ol class="ip-toc-list">
                    <li><a href="#ua-1">Предмет и стороны</a></li>
                    <li><a href="#ua-2">Сведения о поставщике Сервиса</a></li>
                    <li><a href="#ua-3">Заключение Соглашения</a></li>
                    <li><a href="#ua-4">Учётная запись</a></li>
                    <li><a href="#ua-5">Членство и платные услуги</a></li>
                    <li><a href="#ua-6">Правила поведения</a></li>
                    <li><a href="#ua-7">Контент пользователей</a></li>
                    <li><a href="#ua-8">Интеллектуальная собственность КСЛТ</a></li>
                    <li><a href="#ua-9">Ответственность</a></li>
                    <li><a href="#ua-10">Жалобы и споры</a></li>
                    <li><a href="#ua-11">Отказ от Сервиса и удаление учётной записи</a></li>
                    <li><a href="#ua-12">Изменение Соглашения</a></li>
                    <li><a href="#ua-13">Особые условия для пользователей iOS</a></li>
                    <li><a href="#ua-14">Заключительные положения</a></li>
                </ol>
                <button type="button" class="ip-doc-expand" data-doc-expand>Раскрыть все разделы</button>
            </div>

            <details class="ip-doc-fold ip-fade-in" id="ua-1">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">01</span>Предмет и стороны</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> Настоящее Пользовательское соглашение (далее — Соглашение) заключается между Общественным фондом «Кыргызстанское сообщество любителей тенниса» (далее — КСЛТ, поставщик цифрового сервиса) и физическим лицом, использующим сайт <a href="https://tennis.kg">tennis.kg</a> (далее — Сайт) и мобильные приложения «KSLT Tennis» для Android и iOS (далее — Приложение) (далее — Пользователь).</p>
                    <p><strong>1.2.</strong> КСЛТ предоставляет Пользователю доступ к цифровому сервису любительского тенниса (далее — Сервис): рейтингу игроков, календарю и сеткам турниров, заявкам на турниры, баттлам (вызовам на матч), разделам «Live», «Поиск игрока», каталогам кортов и тренеров, новостям, уведомлениям. Пользователь обязуется соблюдать правила пользования Сервисом (ст. 114 Цифрового кодекса Кыргызской Республики).</p>
                    <p><strong>1.3.</strong> Неотъемлемыми частями Соглашения являются: Политика конфиденциальности; Правила КСЛТ (включая Систему рейтинга и Дисциплинарное положение); Публичная оферта на участие в турнирах — в части платных услуг. Документы опубликованы на Сайте и в Приложении (Профиль → Документы).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-2">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">02</span>Сведения о поставщике Сервиса (ст. 33 Цифрового кодекса)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>Полное наименование:</strong> Общественный фонд «Кыргызстанское сообщество любителей тенниса» («Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду)</p>
                    <p><strong>Регистрационный номер:</strong> 197575-3301-ОФ (Единый государственный реестр юридических лиц, Чуй-Бишкекское управление юстиции, дата первичной регистрации 19.05.2021)</p>
                    <p><strong>ИНН:</strong> 01905202110030; код ОКПО: 31147180</p>
                    <p><strong>Юридический адрес:</strong> Кыргызская Республика, г. Бишкек, Свердловский район, пр. Чуй, 127, кв. 26</p>
                    <p><strong>Руководитель:</strong> Чокоева Айсулуу Эриковна</p>
                    <p><strong>Электронная почта:</strong> <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; телефон / WhatsApp: +996 555 777703</p>
                    <p><strong>Применимое законодательство:</strong> Цифровой кодекс Кыргызской Республики от 31 июля 2025 года № 178, Гражданский кодекс Кыргызской Республики, законодательство о защите прав потребителей.</p>
                    <p><strong>Для подключения к Сервису необходимы:</strong> устройство с доступом в интернет; актуальная версия браузера или Приложения (Android 8.0 и выше, iOS 15 и выше); регистрация учётной записи.</p>
                    <p><strong>Ограничения использования:</strong> Сервис доступен лицам от 14 лет. Участие в турнирах — по условиям Публичной оферты. Часть функций доступна только членам КСЛТ с оплаченным членством.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-3">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">03</span>Заключение Соглашения</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Соглашение заключается, когда Пользователь при регистрации проставляет отметку «Я принимаю Пользовательское соглашение и ознакомлен(а) с Политикой конфиденциальности» и нажимает кнопку «Создать аккаунт», либо впервые входит в Сервис через Google, Apple или Telegram и подтверждает принятие Соглашения. Отметка не проставляется заранее.</p>
                    <p><strong>3.2.</strong> Вся информация, которую КСЛТ обязан предоставить Пользователю, доступна до заключения Соглашения (ч. 2 ст. 114 Цифрового кодекса).</p>
                    <p><strong>3.3.</strong> КСЛТ хранит запись о заключении Соглашения (идентификатор Пользователя, дату и время, редакцию Соглашения, способ принятия) в течение срока действия Соглашения и 3 лет после его прекращения. Пользователь может в любое время скачать действующую и ранее принятые редакции (ч. 4 ст. 114).</p>
                    <p><strong>3.4.</strong> Просмотр общедоступных страниц (рейтинг, турниры, новости) без регистрации допускается. На такой просмотр распространяются разделы 6, 8 и 9 Соглашения.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-4">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">04</span>Учётная запись</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Пользователь указывает достоверные имя, фамилию, адрес электронной почты, дату рождения и пол и поддерживает их в актуальном состоянии. Один человек может иметь только одну учётную запись. Регистрация от имени другого лица запрещена (ч. 1 ст. 116 Цифрового кодекса).</p>
                    <p><strong>4.2.</strong> Пользователь самостоятельно обеспечивает конфиденциальность пароля и отвечает за действия, совершённые под его учётной записью, пока не сообщит КСЛТ о несанкционированном доступе. О входе с нового устройства КСЛТ уведомляет Пользователя.</p>
                    <p><strong>4.3.</strong> Имя, фамилия, фото профиля, категория, рейтинг, результаты матчей и турниров видны всем посетителям Сервиса. Иные данные обрабатываются согласно Политике конфиденциальности.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-5">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">05</span>Членство и платные услуги</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Сервис бесплатен, за исключением услуг, указанных на странице «Цены»: вступительного взноса, членских взносов (ежемесячного или годового) и взносов за участие в турнирах. Порядок оплаты, возврата и отказа от участия в турнире определяется Публичной офертой.</p>
                    <p><strong>5.2.</strong> Пользователь-потребитель вправе в любое время отказаться от платного членства с возвратом уплаченных денежных средств за вычетом стоимости членства за период до получения КСЛТ заявления об отказе (п. 1 ч. 4 ст. 116 Цифрового кодекса). Заявление направляется на <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> или через Приложение. Возврат производится тем же способом, каким была произведена оплата, в течение 30 рабочих дней.</p>
                    <p><strong>5.3.</strong> Если оплата производится через Приложение: покупки в Приложении на iOS и Android оформляются через платёжные системы Apple и Google по их правилам. Возврат таких платежей осуществляется в порядке, установленном Apple и Google.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-6">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">06</span>Правила поведения</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Пользователю запрещается:</p>
                    <ul class="ip-doc-list">
                        <li>размещать информацию, распространение которой запрещено законодательством Кыргызской Республики, в том числе оскорбления, угрозы, дискриминационные высказывания, порнографию, призывы к насилию;</li>
                        <li>преследовать других пользователей, размещать чужие персональные данные без их согласия;</li>
                        <li>выдавать себя за другое лицо, создавать несколько учётных записей, вносить заведомо недостоверные результаты матчей;</li>
                        <li>рассылать спам и рекламу без согласования с КСЛТ;</li>
                        <li>автоматически собирать данные Сервиса (парсинг), вмешиваться в его работу, обходить технические ограничения;</li>
                        <li>нарушать права интеллектуальной собственности других лиц (ч. 3 ст. 116 Цифрового кодекса).</li>
                    </ul>
                    <p><strong>6.2.</strong> Поведение на корте и во время турниров регулируется Правилами КСЛТ и Дисциплинарным положением.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-7">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">07</span>Контент пользователей</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Права на фото профиля, сообщения и иные материалы, которые Пользователь размещает в Сервисе (далее — Контент), принадлежат Пользователю (ч. 2 ст. 116, ч. 2 ст. 117 Цифрового кодекса).</p>
                    <p><strong>7.2.</strong> Размещая Контент, Пользователь подтверждает, что вправе им распоряжаться, и предоставляет КСЛТ безвозмездную простую (неисключительную) лицензию на воспроизведение и показ Контента в Сервисе — на Сайте, в Приложении, в уведомлениях Сервиса — на срок размещения Контента. Лицензия прекращается при удалении Контента или учётной записи. Использование Контента за пределами Сервиса (соцсети, реклама, печать) допускается только с отдельного согласия Пользователя.</p>
                    <p><strong>7.3.</strong> Каждый пользователь может пожаловаться на Контент или поведение другого пользователя (кнопка «Пожаловаться») и заблокировать его (кнопка «Заблокировать»): после блокировки пользователи не видят сообщений и вызовов друг друга.</p>
                    <p><strong>7.4.</strong> КСЛТ удаляет Контент, содержащий информацию, распространение которой запрещено законодательством Кыргызской Республики, и вправе приостановить доступ к Сервису Пользователю, нарушающему Соглашение, до устранения нарушения (п. 8 ч. 1 ст. 117, ч. 1 ст. 120 Цифрового кодекса). При повторных или грубых нарушениях учётная запись может быть заблокирована в соответствии с Дисциплинарным положением.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-8">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">08</span>Интеллектуальная собственность КСЛТ</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>8.1.</strong> Название и логотип КСЛТ, дизайн, программный код, тексты, базы данных рейтинга и иные материалы Сервиса принадлежат КСЛТ или используются им на законных основаниях. Пользователю предоставляется право использовать Приложение и Сайт только для личного некоммерческого пользования Сервисом. Копирование, изменение, декомпиляция, распространение материалов Сервиса без письменного согласия КСЛТ запрещены.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-9">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">09</span>Ответственность</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> Сервис предоставляется «как есть». КСЛТ стремится обеспечить его бесперебойную работу, но не гарантирует отсутствие перерывов, вызванных техническими сбоями, действиями провайдеров и обработчиков, плановыми работами. О плановых работах продолжительностью более 2 часов КСЛТ сообщает заранее в Сервисе. Время таких работ, а также работ по устранению аварий, не учитывается при определении ответственности.</p>
                    <p><strong>9.2.</strong> Стороны в соответствии с ч. 2 ст. 120 Цифрового кодекса устанавливают иной размер ответственности за недоступность Сервиса. Бесплатные функции: КСЛТ не несёт ответственности за их недоступность. Платное членство: при недоступности Сервиса по вине КСЛТ более 48 часов подряд Пользователь вправе потребовать продления членства на период недоступности либо возврата стоимости членства за этот период. Это не ограничивает права Пользователя, предусмотренные ч. 5 ст. 120 Цифрового кодекса и законодательством о защите прав потребителей.</p>
                    <p><strong>9.3.</strong> КСЛТ не отвечает за качество услуг третьих лиц, указанных в каталогах кортов и тренеров, и за договорённости, которые пользователи заключают между собой через раздел «Поиск игрока». Участие в играх и турнирах добровольно. Пользователь сам оценивает состояние своего здоровья.</p>
                    <p><strong>9.4.</strong> Пользователь возмещает КСЛТ убытки, причинённые нарушением Соглашения, в соответствии с гражданским законодательством.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-10">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">10</span>Жалобы и споры (ст. 119 Цифрового кодекса)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>10.1.</strong> Жалобы о качестве Сервиса, нарушении прав интеллектуальной собственности или цифровых прав, нарушении правил пользования, незаконном распространении информации и иных нарушениях подаются через форму «Обратная связь» в Приложении и на Сайте или по адресу <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>.</p>
                    <p><strong>10.2.</strong> Если жалоба касается действий другого пользователя, КСЛТ сообщает ему о жалобе и предоставляет относящиеся к ней данные. КСЛТ принимает меры по устранению нарушения в срок не более 5 рабочих дней. Если требуется больше времени, КСЛТ в те же 5 рабочих дней сообщает заявителю срок и его обоснование. О принятых мерах заявитель уведомляется тем же способом, каким направил жалобу.</p>
                    <p><strong>10.3.</strong> Споры о результатах матчей решает главный судья турнира в соответствии с Правилами КСЛТ. Споры между пользователями, связанные с использованием Сервиса, рассматривает администрация КСЛТ с уведомлением всех затронутых лиц и с предоставлением им возможности изложить свою позицию.</p>
                    <p><strong>10.4.</strong> Решение КСЛТ по жалобе или спору может быть обжаловано в обязательном досудебном порядке в уполномоченный отраслевой регулятор, а при несогласии с его решением — в суд Кыргызской Республики (ч. 5 ст. 119 Цифрового кодекса). Вопросы обработки персональных данных могут быть обжалованы в Государственное агентство по защите персональных данных при Кабинете Министров Кыргызской Республики или в суд.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-11">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">11</span>Отказ от Сервиса и удаление учётной записи</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>11.1.</strong> Пользователь вправе в любое время отказаться от Сервиса, удалив учётную запись в Приложении (Профиль → Настройки → «Удалить аккаунт»), на Сайте или письмом на <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>.</p>
                    <p><strong>11.2.</strong> При отказе КСЛТ (ст. 118 Цифрового кодекса): производит расчёт по платному членству (п. 5.2); показывает Пользователю, какие данные о нём хранятся, и предлагает скачать их копию; удаляет данные в порядке, описанном в Политике конфиденциальности; сообщает, какие записи сохраняются в силу закона (история турниров, записи о заключении Соглашения, платёжные документы).</p>
                    <p><strong>11.3.</strong> Запрос на удаление учётной записи считается решением Пользователя об удалении его цифровых записей. Если Пользователь отказался от Сервиса иным способом и не сообщил решение о своих записях, они удаляются по истечении календарного года, следующего за годом отказа (ч. 2 ст. 118).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-12">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">12</span>Изменение Соглашения</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>12.1.</strong> О внесении изменений КСЛТ уведомляет Пользователя в Приложении и по электронной почте не менее чем за один месяц до их вступления в силу (ч. 5 ст. 114 Цифрового кодекса). Соглашение считается изменённым с даты, указанной в уведомлении.</p>
                    <p><strong>12.2.</strong> Если до этой даты Пользователь заявит о несогласии с изменениями, Соглашение прекращается, а КСЛТ возвращает уплаченные Пользователем денежные средства за вычетом стоимости Сервиса до получения заявления о несогласии.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-13">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">13</span>Особые условия для пользователей iOS (App Store)</h2></summary>
                <div class="ip-rules-list">
                    <ul class="ip-doc-list">
                        <li>Соглашение заключено между Пользователем и КСЛТ, а не с Apple Inc. Ответственность за Приложение и его содержание несёт КСЛТ.</li>
                        <li>Пользователю предоставляется непередаваемое право использовать Приложение на устройствах Apple, которыми он владеет или управляет, в соответствии с правилами использования App Store.</li>
                        <li>Техническую поддержку Приложения оказывает КСЛТ. Apple не обязана оказывать поддержку и обслуживание Приложения.</li>
                        <li>Если Приложение не соответствует применимым гарантиям, Пользователь может уведомить Apple, и Apple вернёт стоимость покупки Приложения (если она была). В остальном Apple не несёт гарантийных обязательств.</li>
                        <li>Претензии, связанные с Приложением (в том числе о соответствии законодательству, защите прав потребителей, нарушении прав интеллектуальной собственности третьих лиц), рассматривает КСЛТ.</li>
                        <li>Пользователь подтверждает, что не находится в стране, в отношении которой действует эмбарго США, и не включён в санкционные списки США.</li>
                        <li>Apple Inc. и её дочерние компании являются третьими лицами-выгодоприобретателями по Соглашению и вправе требовать его исполнения от Пользователя.</li>
                    </ul>
                    <p>Пользователи Android также соблюдают условия Google Play. Google LLC не является стороной Соглашения.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-14">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">14</span>Заключительные положения</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>14.1.</strong> Соглашение действует бессрочно до его прекращения по разделам 11 и 12. КСЛТ вправе прекратить Соглашение при грубом или неоднократном нарушении Пользователем раздела 6.</p>
                    <p><strong>14.2.</strong> К Соглашению применяется право Кыргызской Республики. Соглашение публикуется на русском, кыргызском и английском языках. При расхождении текстов приоритет имеет текст на русском языке.</p>
                    <p><strong>14.3.</strong> Если какое-либо положение Соглашения будет признано недействительным, остальные положения сохраняют силу.</p>
                </div>
            </details>

            <div class="ip-doc-sign ip-fade-in">
                <p class="ip-doc-sign-role">Председатель Правления КСЛТ</p>
                <p class="ip-doc-sign-name">Чокоева А. Э.</p>
                <p class="ip-doc-revision">Редакция от 3 ноября 2026 г. Утверждена приказом № 1 от 3 ноября 2026 г.</p>
                <button type="button" class="ip-doc-print" data-doc-print>Распечатать или сохранить PDF</button>
            </div>$kslt$,
        $kslt$            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">Approved by Order No. 1 of the Head of the KSLT Public Foundation, 3 November 2026.</p>
                <p class="ip-doc-approved-line">Edition of 3 November 2026.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">This User Agreement is concluded between the KSLT Public Foundation and every person who uses the <a href="https://tennis.kg">tennis.kg</a> website and the «KSLT Tennis» applications. The full text is given below and applies in full. In case of any discrepancy, the Russian edition prevails.</p>
            </div>

            <div class="ip-doc-gist ip-fade-in">
                <div class="ip-doc-gist-title">In short</div>
                <p class="ip-doc-gist-note">This is a short summary for convenience. It does not replace the document: the full text below is what applies.</p>
                <ul class="ip-doc-gist-list">
                    <li><strong>What this is.</strong> A contract between you and KSLT about using the service: the rating, tournaments, battles, partner search, court and coach directories.</li>
                    <li><strong>When it is concluded.</strong> When you tick the box at registration or sign in for the first time with Google, Apple or Telegram.</li>
                    <li><strong>What is free.</strong> Everything except the fees listed on the «Prices» page: the joining fee, membership fees and tournament fees. The rating, tournaments and news can be viewed without registering.</li>
                    <li><strong>What is not allowed.</strong> Insulting or harassing others, impersonation, a second account, false match results, automated data collection.</li>
                    <li><strong>Your content stays yours.</strong> Photos and messages remain yours; we display them inside the service only. Outside it — with your separate consent.</li>
                    <li><strong>If something is wrong.</strong> Complain through «Feedback» or by e-mail; we respond within 5 working days. Disputes about a match score are decided by the tournament referee.</li>
                    <li><strong>You can leave at any time.</strong> Delete your account in the profile or by e-mail, with a settlement for paid membership.</li>
                </ul>
            </div>

            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Contents</div>
                <ol class="ip-toc-list">
                    <li><a href="#ua-1">Subject and parties</a></li>
                    <li><a href="#ua-2">Details of the Service provider</a></li>
                    <li><a href="#ua-3">Conclusion of the Agreement</a></li>
                    <li><a href="#ua-4">Account</a></li>
                    <li><a href="#ua-5">Membership and paid services</a></li>
                    <li><a href="#ua-6">Rules of conduct</a></li>
                    <li><a href="#ua-7">User content</a></li>
                    <li><a href="#ua-8">KSLT intellectual property</a></li>
                    <li><a href="#ua-9">Liability</a></li>
                    <li><a href="#ua-10">Complaints and disputes</a></li>
                    <li><a href="#ua-11">Withdrawal from the Service and account deletion</a></li>
                    <li><a href="#ua-12">Changes to the Agreement</a></li>
                    <li><a href="#ua-13">Special terms for iOS users</a></li>
                    <li><a href="#ua-14">Final provisions</a></li>
                </ol>
                <button type="button" class="ip-doc-expand" data-doc-expand>Expand all sections</button>
            </div>

            <details class="ip-doc-fold ip-fade-in" id="ua-1">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">01</span>Subject and parties</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> This User Agreement (hereinafter — the Agreement) is concluded between the Public Foundation «Kyrgyzstan Community of Tennis Enthusiasts» (hereinafter — KSLT, the digital service provider) and the natural person using the <a href="https://tennis.kg">tennis.kg</a> website (hereinafter — the Site) and the «KSLT Tennis» mobile applications for Android and iOS (hereinafter — the Application) (hereinafter — the User).</p>
                    <p><strong>1.2.</strong> KSLT provides the User with access to the amateur tennis digital service (hereinafter — the Service): the player rating, the tournament calendar and draws, tournament entries, battles (match challenges), the «Live» and «Find a player» sections, court and coach directories, news and notifications. The User undertakes to follow the rules of using the Service (Article 114 of the Digital Code of the Kyrgyz Republic).</p>
                    <p><strong>1.3.</strong> The following form an integral part of the Agreement: the Privacy Policy; the KSLT Rules (including the Rating System and the Disciplinary Regulation); the Public Offer for tournament participation — as regards paid services. The documents are published on the Site and in the Application (Profile → Documents).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-2">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">02</span>Details of the Service provider (Article 33 of the Digital Code)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>Full name:</strong> Public Foundation «Kyrgyzstan Community of Tennis Enthusiasts» («Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду)</p>
                    <p><strong>Registration number:</strong> 197575-3301-ОФ (Unified State Register of Legal Entities, Chuy-Bishkek Department of Justice, first registered 19.05.2021)</p>
                    <p><strong>Taxpayer number (INN):</strong> 01905202110030; OKPO code: 31147180</p>
                    <p><strong>Registered address:</strong> Kyrgyz Republic, Bishkek, Sverdlovsky district, Chuy Avenue 127, apt. 26</p>
                    <p><strong>Head:</strong> Aisuluu Erikovna Chokoeva</p>
                    <p><strong>E-mail:</strong> <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; phone / WhatsApp: +996 555 777703</p>
                    <p><strong>Applicable law:</strong> the Digital Code of the Kyrgyz Republic of 31 July 2025 No. 178, the Civil Code of the Kyrgyz Republic, consumer protection legislation.</p>
                    <p><strong>To connect to the Service you need:</strong> a device with internet access; a current version of a browser or of the Application (Android 8.0 and above, iOS 15 and above); a registered account.</p>
                    <p><strong>Usage limits:</strong> the Service is available to persons aged 14 and over. Participation in tournaments is governed by the Public Offer. Some features are available only to KSLT members with paid membership.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-3">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">03</span>Conclusion of the Agreement</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> The Agreement is concluded when the User ticks the box «I accept the User Agreement and have read the Privacy Policy» at registration and presses «Create account», or signs in to the Service for the first time with Google, Apple or Telegram and confirms acceptance of the Agreement. The box is not ticked in advance.</p>
                    <p><strong>3.2.</strong> All information that KSLT is obliged to provide to the User is available before the Agreement is concluded (part 2 Article 114 of the Digital Code).</p>
                    <p><strong>3.3.</strong> KSLT keeps a record of the conclusion of the Agreement (User identifier, date and time, edition of the Agreement, method of acceptance) for the term of the Agreement and 3 years after its termination. The User may at any time download the current and previously accepted editions (part 4 Article 114).</p>
                    <p><strong>3.4.</strong> Viewing public pages (rating, tournaments, news) without registration is permitted. Sections 6, 8 and 9 of the Agreement apply to such viewing.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-4">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">04</span>Account</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> The User provides accurate first and last name, e-mail address, date of birth and gender and keeps them up to date. One person may have only one account. Registering on behalf of another person is prohibited (part 1 Article 116 of the Digital Code).</p>
                    <p><strong>4.2.</strong> The User keeps the password confidential and is responsible for actions performed under their account until they notify KSLT of unauthorised access. KSLT notifies the User of a sign-in from a new device.</p>
                    <p><strong>4.3.</strong> First and last name, profile photo, category, rating, match and tournament results are visible to all visitors of the Service. Other data is processed in accordance with the Privacy Policy.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-5">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">05</span>Membership and paid services</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> The Service is free, except for the services listed on the «Prices» page: the joining fee, membership fees (monthly or annual) and tournament entry fees. Payment, refunds and withdrawal from a tournament are governed by the Public Offer.</p>
                    <p><strong>5.2.</strong> A consumer User may at any time withdraw from paid membership with a refund of the amounts paid, less the cost of membership for the period up to KSLT's receipt of the withdrawal notice (clause 1 part 4 Article 116 of the Digital Code). The notice is sent to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> or through the Application. The refund is made by the same method as the payment, within 30 working days.</p>
                    <p><strong>5.3.</strong> If payment is made through the Application: in-app purchases on iOS and Android are processed by the Apple and Google payment systems under their rules. Refunds of such payments are made in the manner established by Apple and Google.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-6">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">06</span>Rules of conduct</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> The User must not:</p>
                    <ul class="ip-doc-list">
                        <li>post information whose distribution is prohibited by the law of the Kyrgyz Republic, including insults, threats, discriminatory statements, pornography and calls to violence;</li>
                        <li>harass other users or post other people's personal data without their consent;</li>
                        <li>impersonate another person, create multiple accounts, or enter knowingly false match results;</li>
                        <li>send spam or advertising without agreement with KSLT;</li>
                        <li>collect Service data automatically (scraping), interfere with its operation, or circumvent technical restrictions;</li>
                        <li>infringe the intellectual property rights of others (part 3 Article 116 of the Digital Code).</li>
                    </ul>
                    <p><strong>6.2.</strong> Conduct on court and during tournaments is governed by the KSLT Rules and the Disciplinary Regulation.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-7">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">07</span>User content</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Rights to the profile photo, messages and other materials that the User posts in the Service (hereinafter — Content) belong to the User (part 2 Article 116, part 2 Article 117 of the Digital Code).</p>
                    <p><strong>7.2.</strong> By posting Content, the User confirms that they are entitled to dispose of it and grants KSLT a free simple (non-exclusive) licence to reproduce and display the Content within the Service — on the Site, in the Application and in Service notifications — for the period the Content is posted. The licence ends when the Content or the account is deleted. Use of the Content outside the Service (social media, advertising, print) is permitted only with the User's separate consent.</p>
                    <p><strong>7.3.</strong> Any user may report Content or the behaviour of another user (the «Report» button) and block them (the «Block» button): after blocking, the users do not see each other's messages and challenges.</p>
                    <p><strong>7.4.</strong> KSLT removes Content containing information whose distribution is prohibited by the law of the Kyrgyz Republic, and may suspend access to the Service for a User who breaches the Agreement until the breach is remedied (clause 8 part 1 Article 117, part 1 Article 120 of the Digital Code). In case of repeated or serious breaches, the account may be blocked in accordance with the Disciplinary Regulation.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-8">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">08</span>KSLT intellectual property</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>8.1.</strong> The KSLT name and logo, the design, the software code, texts, rating databases and other materials of the Service belong to KSLT or are used by it on lawful grounds. The User is granted the right to use the Application and the Site solely for personal non-commercial use of the Service. Copying, modification, decompilation and distribution of Service materials without KSLT's written consent are prohibited.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-9">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">09</span>Liability</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> The Service is provided «as is». KSLT seeks to keep it running without interruption but does not guarantee the absence of interruptions caused by technical failures, the actions of providers and processors, or planned maintenance. KSLT announces planned maintenance longer than 2 hours in advance in the Service. The time of such maintenance, and of work to remedy failures, is not counted when determining liability.</p>
                    <p><strong>9.2.</strong> In accordance with part 2 Article 120 of the Digital Code, the parties establish a different measure of liability for unavailability of the Service. Free features: KSLT bears no liability for their unavailability. Paid membership: if the Service is unavailable through KSLT's fault for more than 48 consecutive hours, the User may require an extension of membership for the period of unavailability or a refund of the membership cost for that period. This does not limit the User's rights under part 5 Article 120 of the Digital Code and consumer protection legislation.</p>
                    <p><strong>9.3.</strong> KSLT is not responsible for the quality of third-party services listed in the court and coach directories, nor for arrangements users make between themselves through the «Find a player» section. Participation in games and tournaments is voluntary. The User assesses their own state of health.</p>
                    <p><strong>9.4.</strong> The User compensates KSLT for losses caused by a breach of the Agreement, in accordance with civil law.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-10">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">10</span>Complaints and disputes (Article 119 of the Digital Code)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>10.1.</strong> Complaints about the quality of the Service, infringement of intellectual property or digital rights, breach of the rules of use, unlawful distribution of information and other breaches are submitted through the «Feedback» form in the Application and on the Site or to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>.</p>
                    <p><strong>10.2.</strong> If a complaint concerns the actions of another user, KSLT informs that user of the complaint and provides the related data. KSLT takes measures to remedy the breach within no more than 5 working days. If more time is required, KSLT informs the complainant within those same 5 working days of the period and the reasons for it. The complainant is notified of the measures taken by the same means as the complaint was submitted.</p>
                    <p><strong>10.3.</strong> Disputes about match results are decided by the tournament referee in accordance with the KSLT Rules. Disputes between users relating to the use of the Service are considered by the KSLT administration, with notice to all affected persons and an opportunity for them to state their position.</p>
                    <p><strong>10.4.</strong> A KSLT decision on a complaint or dispute may be appealed, under a mandatory pre-trial procedure, to the authorised sectoral regulator and, if its decision is disputed, to a court of the Kyrgyz Republic (part 5 Article 119 of the Digital Code). Matters of personal data processing may be appealed to the State Agency for Personal Data Protection under the Cabinet of Ministers of the Kyrgyz Republic or to a court.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-11">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">11</span>Withdrawal from the Service and account deletion</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>11.1.</strong> The User may at any time withdraw from the Service by deleting their account in the Application (Profile → Settings → «Delete account»), on the Site, or by e-mail to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>.</p>
                    <p><strong>11.2.</strong> Upon withdrawal, KSLT (Article 118 of the Digital Code): settles paid membership (clause 5.2); shows the User what data about them is stored and offers to download a copy of it; deletes the data in the manner described in the Privacy Policy; states which records are retained by law (tournament history, records of the conclusion of the Agreement, payment documents).</p>
                    <p><strong>11.3.</strong> A request to delete the account is treated as the User's decision to delete their digital records. If the User withdrew from the Service by other means and did not state a decision about their records, those records are deleted at the end of the calendar year following the year of withdrawal (part 2 Article 118).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-12">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">12</span>Changes to the Agreement</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>12.1.</strong> KSLT notifies the User of changes in the Application and by e-mail at least one month before they take effect (part 5 Article 114 of the Digital Code). The Agreement is deemed amended from the date stated in the notice.</p>
                    <p><strong>12.2.</strong> If before that date the User declares disagreement with the changes, the Agreement terminates and KSLT refunds the amounts paid by the User, less the cost of the Service up to receipt of the declaration of disagreement.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-13">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">13</span>Special terms for iOS users (App Store)</h2></summary>
                <div class="ip-rules-list">
                    <ul class="ip-doc-list">
                        <li>The Agreement is concluded between the User and KSLT, not with Apple Inc. KSLT is responsible for the Application and its content.</li>
                        <li>The User is granted a non-transferable right to use the Application on Apple devices that they own or control, in accordance with the App Store usage rules.</li>
                        <li>Technical support for the Application is provided by KSLT. Apple has no obligation to provide support or maintenance for the Application.</li>
                        <li>If the Application fails to conform to any applicable warranty, the User may notify Apple, and Apple will refund the purchase price of the Application (if any). Otherwise Apple has no warranty obligations.</li>
                        <li>Claims relating to the Application (including as to compliance with law, consumer protection, or infringement of third-party intellectual property rights) are handled by KSLT.</li>
                        <li>The User confirms that they are not located in a country subject to a US embargo and are not on any US sanctions list.</li>
                        <li>Apple Inc. and its subsidiaries are third-party beneficiaries of the Agreement and may enforce it against the User.</li>
                    </ul>
                    <p>Android users also comply with the Google Play terms. Google LLC is not a party to the Agreement.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-14">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">14</span>Final provisions</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>14.1.</strong> The Agreement is open-ended until terminated under sections 11 and 12. KSLT may terminate the Agreement in case of a serious or repeated breach of section 6 by the User.</p>
                    <p><strong>14.2.</strong> The Agreement is governed by the law of the Kyrgyz Republic. The Agreement is published in Russian, Kyrgyz and English. In case of discrepancy between the texts, the Russian text prevails.</p>
                    <p><strong>14.3.</strong> If any provision of the Agreement is found invalid, the remaining provisions remain in force.</p>
                </div>
            </details>

            <div class="ip-doc-sign ip-fade-in">
                <p class="ip-doc-sign-role">Chair of the Board of KSLT</p>
                <p class="ip-doc-sign-name">A. E. Chokoeva</p>
                <p class="ip-doc-revision">Edition of 3 November 2026. Approved by Order No. 1 of 3 November 2026.</p>
                <button type="button" class="ip-doc-print" data-doc-print>Print or save as PDF</button>
            </div>$kslt$,
        $kslt$            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">«КСЛТ» Коомдук фондунун жетекчисинин 2026-жылдын 3-ноябрындагы № 1 буйругу менен бекитилген.</p>
                <p class="ip-doc-approved-line">2026-жылдын 3-ноябрындагы редакциясы.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">Бул Колдонуучу макулдашуусу «КСЛТ» Коомдук фонду менен <a href="https://tennis.kg">tennis.kg</a> сайтын жана «KSLT Tennis» тиркемелерин колдонгон ар бир адамдын ортосунда түзүлөт. Толук тексти төмөндө келтирилген жана толугу менен колдонулат. Айырмачылык болгон учурда орус тилиндеги редакция колдонулат.</p>
            </div>

            <div class="ip-doc-gist ip-fade-in">
                <div class="ip-doc-gist-title">Кыскача эң негизгиси</div>
                <p class="ip-doc-gist-note">Бул окууга ыңгайлуу болушу үчүн кыскача баяндама. Ал документти алмаштырбайт: төмөндөгү толук текст колдонулат.</p>
                <ul class="ip-doc-gist-list">
                    <li><strong>Бул эмне.</strong> Сиз менен КСЛТнин ортосундагы кызматты колдонуу жөнүндө келишим: рейтинг, мелдештер, баттлдар, өнөктөш издөө, корттордун жана машыктыруучулардын каталогдору.</li>
                    <li><strong>Ал качан түзүлөт.</strong> Катталууда белги койгонуңузда же Google, Apple же Telegram аркылуу биринчи жолу киргениңизде.</li>
                    <li><strong>Эмне акысыз.</strong> «Баалар» барагындагы төгүмдөрдөн башкасынын баары: кирүү, мүчөлүк жана мелдеш төгүмдөрү. Рейтингди, мелдештерди жана жаңылыктарды катталбай эле көрүүгө болот.</li>
                    <li><strong>Эмнеге болбойт.</strong> Кемсинтүүгө жана куугунтуктоого, башка адам болуп көрүнүүгө, экинчи аккаунт ачууга, жалган жыйынтык киргизүүгө, маалыматты робот менен чогултууга.</li>
                    <li><strong>Сиздин материалдарыңыз — сиздики.</strong> Сүрөттөр жана билдирүүлөр сиздики бойдон калат; биз аларды кызматтын ичинде гана көрсөтөбүз. Андан тышкары — өзүнчө макулдук менен.</li>
                    <li><strong>Эгер бир нерсе туура эмес болсо.</strong> «Кайтарым байланыш» аркылуу же почта менен даттануу; жооп 5 жумуш күнүнө чейин. Оюндун эсеби боюнча талашты башкы судья чечет.</li>
                    <li><strong>Каалаган убакта кетүүгө болот.</strong> Аккаунтту профилде же кат менен өчүрүү, төлөнгөн мүчөлүк боюнча эсептешүү менен.</li>
                </ul>
            </div>

            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Мазмуну</div>
                <ol class="ip-toc-list">
                    <li><a href="#ua-1">Предмети жана тараптары</a></li>
                    <li><a href="#ua-2">Кызмат жөнүндө маалымат</a></li>
                    <li><a href="#ua-3">Макулдашууну түзүү</a></li>
                    <li><a href="#ua-4">Аккаунт</a></li>
                    <li><a href="#ua-5">Мүчөлүк жана акы төлөнүүчү кызматтар</a></li>
                    <li><a href="#ua-6">Жүрүм-турум эрежелери</a></li>
                    <li><a href="#ua-7">Колдонуучулардын материалдары</a></li>
                    <li><a href="#ua-8">КСЛТнин интеллектуалдык менчиги</a></li>
                    <li><a href="#ua-9">Жоопкерчилик</a></li>
                    <li><a href="#ua-10">Даттануулар жана талаштар</a></li>
                    <li><a href="#ua-11">Кызматтан баш тартуу жана аккаунтту өчүрүү</a></li>
                    <li><a href="#ua-12">Макулдашууну өзгөртүү</a></li>
                    <li><a href="#ua-13">iOS колдонуучулары үчүн өзгөчө шарттар</a></li>
                    <li><a href="#ua-14">Корутунду жоболор</a></li>
                </ol>
                <button type="button" class="ip-doc-expand" data-doc-expand>Бардык бөлүмдөрдү ачуу</button>
            </div>

            <details class="ip-doc-fold ip-fade-in" id="ua-1">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">01</span>Предмети жана тараптары</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> Бул Колдонуучу макулдашуусу (мындан ары — Макулдашуу) «Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду (мындан ары — КСЛТ, санариптик кызматтын жеткирүүчүсү) менен <a href="https://tennis.kg">tennis.kg</a> сайтын (мындан ары — Сайт) жана Android жана iOS үчүн «KSLT Tennis» мобилдик тиркемелерин (мындан ары — Тиркеме) колдонгон жеке адамдын (мындан ары — Колдонуучу) ортосунда түзүлөт.</p>
                    <p><strong>1.2.</strong> КСЛТ Колдонуучуга ышкыбоз теннистин санариптик кызматына (мындан ары — Кызмат) жетүү мүмкүнчүлүгүн берет: оюнчулардын рейтинги, мелдештердин календары жана торчолору, мелдештерге арыздар, баттлдар (оюнга чакырыктар), «Live» жана «Оюнчу издөө» бөлүмдөрү, корттордун жана машыктыруучулардын каталогдору, жаңылыктар, билдирүүлөр. Колдонуучу Кызматты колдонуу эрежелерин сактоого милдеттенет (Кыргыз Республикасынын Санариптик кодексинин 114-беренеси).</p>
                    <p><strong>1.3.</strong> Макулдашуунун ажырагыс бөлүктөрү: Купуялык саясаты; КСЛТнин Эрежелери (Рейтинг системасын жана Тартиптик жобону кошо алганда); мелдештерге катышуу боюнча Ачык оферта — акы төлөнүүчү кызматтар бөлүгүндө. Документтер Сайтта жана Тиркемеде (Профиль → Документтер) жарыяланган.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-2">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">02</span>Кызматтын жеткирүүчүсү жөнүндө маалымат (Санариптик кодекстин 33-беренеси)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>Толук аталышы:</strong> «Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду</p>
                    <p><strong>Каттоо номери:</strong> 197575-3301-ОФ (Юридикалык жактардын бирдиктүү мамлекеттик реестри, Чүй-Бишкек юстиция башкармалыгы, алгачкы каттоо күнү 19.05.2021)</p>
                    <p><strong>ИНН:</strong> 01905202110030; ОКПО коду: 31147180</p>
                    <p><strong>Юридикалык дареги:</strong> Кыргыз Республикасы, Бишкек шаары, Свердлов району, Чүй проспекти, 127, 26-батир</p>
                    <p><strong>Жетекчиси:</strong> Чокоева Айсулуу Эриковна</p>
                    <p><strong>Электрондук почта:</strong> <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; телефон / WhatsApp: +996 555 777703</p>
                    <p><strong>Колдонулуучу мыйзамдар:</strong> Кыргыз Республикасынын 2025-жылдын 31-июлундагы № 178 Санариптик кодекси, Кыргыз Республикасынын Жарандык кодекси, керектөөчүлөрдүн укуктарын коргоо жөнүндө мыйзамдар.</p>
                    <p><strong>Кызматка туташуу үчүн зарыл:</strong> интернетке жетүүсү бар түзмөк; браузердин же Тиркеменин учурдагы версиясы (Android 8.0 жана андан жогору, iOS 15 жана андан жогору); аккаунт каттоо.</p>
                    <p><strong>Колдонуу чектөөлөрү:</strong> Кызмат 14 жаштан жогорку адамдарга жеткиликтүү. Мелдештерге катышуу — Ачык офертанын шарттары боюнча. Айрым функциялар мүчөлүгү төлөнгөн КСЛТ мүчөлөрүнө гана жеткиликтүү.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-3">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">03</span>Макулдашууну түзүү</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Макулдашуу Колдонуучу катталууда «Мен Колдонуучу макулдашуусун кабыл алам жана Купуялык саясаты менен таанышкам» деген белгини койгондо жана «Аккаунт түзүү» баскычын басканда, же Кызматка Google, Apple же Telegram аркылуу биринчи жолу кирип, Макулдашууну кабыл алганын ырастаганда түзүлөт. Белги алдын ала коюлбайт.</p>
                    <p><strong>3.2.</strong> КСЛТ Колдонуучуга берүүгө милдеттүү болгон бардык маалымат Макулдашуу түзүлгөнгө чейин жеткиликтүү (Санариптик кодекстин 114-беренесинин 2-бөлүгү).</p>
                    <p><strong>3.3.</strong> КСЛТ Макулдашуунун түзүлгөнү жөнүндө жазууну (Колдонуучунун идентификатору, күнү жана убактысы, Макулдашуунун редакциясы, кабыл алуу ыкмасы) Макулдашуунун мөөнөтү ичинде жана ал токтотулгандан кийин 3 жыл сактайт. Колдонуучу каалаган убакта колдонуудагы жана мурда кабыл алынган редакцияларды жүктөп ала алат (114-берененин 4-бөлүгү).</p>
                    <p><strong>3.4.</strong> Жалпыга жеткиликтүү барактарды (рейтинг, мелдештер, жаңылыктар) катталбастан көрүүгө жол берилет. Мындай көрүүгө Макулдашуунун 6, 8 жана 9-бөлүмдөрү колдонулат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-4">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">04</span>Аккаунт</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Колдонуучу аты-жөнүн, электрондук почта дарегин, туулган күнүн жана жынысын туура көрсөтөт жана аларды жаңыртып турат. Бир адамда бир гана аккаунт болушу мүмкүн. Башка адамдын атынан катталууга тыюу салынат (Санариптик кодекстин 116-беренесинин 1-бөлүгү).</p>
                    <p><strong>4.2.</strong> Колдонуучу сырсөздүн купуялыгын өз алдынча камсыз кылат жана уруксатсыз кирүү жөнүндө КСЛТге билдиргенге чейин өз аккаунту аркылуу жасалган аракеттер үчүн жооп берет. Жаңы түзмөктөн киргени жөнүндө КСЛТ Колдонуучуга билдирет.</p>
                    <p><strong>4.3.</strong> Аты, фамилиясы, профилдин сүрөтү, категориясы, рейтинги, оюндардын жана мелдештердин жыйынтыктары Кызматтын бардык конокторуна көрүнөт. Башка маалыматтар Купуялык саясатына ылайык иштетилет.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-5">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">05</span>Мүчөлүк жана акы төлөнүүчү кызматтар</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> «Баалар» барагында көрсөтүлгөн кызматтардан тышкары Кызмат акысыз: кирүү төгүмү, мүчөлүк төгүмдөрү (айлык же жылдык) жана мелдештерге катышуу төгүмдөрү. Төлөө, кайтаруу жана мелдешке катышуудан баш тартуу тартиби Ачык оферта менен аныкталат.</p>
                    <p><strong>5.2.</strong> Керектөөчү-Колдонуучу каалаган убакта акы төлөнүүчү мүчөлүктөн баш тартууга жана КСЛТ баш тартуу арызын алганга чейинки мезгил үчүн мүчөлүктүн наркын кемитип, төлөнгөн акчаны кайтарып алууга укуктуу (Санариптик кодекстин 116-беренесинин 4-бөлүгүнүн 1-пункту). Арыз <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дарегине же Тиркеме аркылуу жөнөтүлөт. Кайтаруу төлөм жасалган ыкма менен 30 жумуш күнүнүн ичинде жүргүзүлөт.</p>
                    <p><strong>5.3.</strong> Эгерде төлөм Тиркеме аркылуу жүргүзүлсө: iOS жана Android'деги Тиркемедеги сатып алуулар Apple жана Google төлөм системалары аркылуу алардын эрежелери боюнча таризделет. Мындай төлөмдөрдү кайтаруу Apple жана Google белгилеген тартипте жүргүзүлөт.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-6">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">06</span>Жүрүм-турум эрежелери</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Колдонуучуга тыюу салынат:</p>
                    <ul class="ip-doc-list">
                        <li>Кыргыз Республикасынын мыйзамдары менен таркатууга тыюу салынган маалыматты, анын ичинде кемсинтүүлөрдү, коркутууларды, дискриминациялык сөздөрдү, порнографияны, зомбулукка чакырыктарды жайгаштырууга;</li>
                        <li>башка колдонуучуларды куугунтуктоого, башкалардын жеке маалыматтарын алардын макулдугусуз жайгаштырууга;</li>
                        <li>башка адам болуп көрүнүүгө, бир нече аккаунт түзүүгө, оюндардын жалган жыйынтыктарын киргизүүгө;</li>
                        <li>КСЛТ менен макулдашпастан спам жана жарнама таркатууга;</li>
                        <li>Кызматтын маалыматтарын автоматтык түрдө чогултууга (парсинг), анын ишине кийлигишүүгө, техникалык чектөөлөрдү айланып өтүүгө;</li>
                        <li>башка адамдардын интеллектуалдык менчик укуктарын бузууга (Санариптик кодекстин 116-беренесинин 3-бөлүгү).</li>
                    </ul>
                    <p><strong>6.2.</strong> Корттогу жана мелдештердеги жүрүм-турум КСЛТнин Эрежелери жана Тартиптик жобо менен жөнгө салынат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-7">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">07</span>Колдонуучулардын материалдары</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Колдонуучу Кызматка жайгаштырган профилдин сүрөтүнө, билдирүүлөргө жана башка материалдарга (мындан ары — Материалдар) болгон укуктар Колдонуучуга таандык (Санариптик кодекстин 116-беренесинин 2-бөлүгү, 117-беренесинин 2-бөлүгү).</p>
                    <p><strong>7.2.</strong> Материалдарды жайгаштырууда Колдонуучу аларды тескөөгө укуктуу экенин ырастайт жана КСЛТге Материалдарды Кызматтын ичинде — Сайтта, Тиркемеде, Кызматтын билдирүүлөрүндө — кайра чыгарууга жана көрсөтүүгө акысыз жөнөкөй (өзгөчө эмес) лицензия берет, Материалдар жайгаштырылган мөөнөткө. Материалдар же аккаунт өчүрүлгөндө лицензия токтотулат. Материалдарды Кызматтан тышкары (социалдык тармактар, жарнама, басма) колдонууга Колдонуучунун өзүнчө макулдугу менен гана жол берилет.</p>
                    <p><strong>7.3.</strong> Ар бир колдонуучу башка колдонуучунун Материалдарына же жүрүм-турумуна даттана алат («Арыздануу» баскычы) жана аны бөгөттөй алат («Бөгөттөө» баскычы): бөгөттөлгөндөн кийин колдонуучулар бири-биринин билдирүүлөрүн жана чакырыктарын көрүшпөйт.</p>
                    <p><strong>7.4.</strong> КСЛТ Кыргыз Республикасынын мыйзамдары менен таркатууга тыюу салынган маалыматты камтыган Материалдарды өчүрөт жана Макулдашууну бузган Колдонуучунун Кызматка жетүүсүн бузуу жоюлганга чейин токтотууга укуктуу (Санариптик кодекстин 117-беренесинин 1-бөлүгүнүн 8-пункту, 120-беренесинин 1-бөлүгү). Кайталанган же одоно бузуулар болгондо аккаунт Тартиптик жобого ылайык бөгөттөлүшү мүмкүн.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-8">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">08</span>КСЛТнин интеллектуалдык менчиги</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>8.1.</strong> КСЛТнин аталышы жана логотиби, дизайн, программалык код, тексттер, рейтингдин маалымат базалары жана Кызматтын башка материалдары КСЛТге таандык же ал тарабынан мыйзамдуу негизде колдонулат. Колдонуучуга Тиркемени жана Сайтты Кызматты жеке коммерциялык эмес колдонуу үчүн гана пайдалануу укугу берилет. Кызматтын материалдарын КСЛТнин жазуу жүзүндөгү макулдугусуз көчүрүүгө, өзгөртүүгө, декомпиляциялоого, таркатууга тыюу салынат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-9">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">09</span>Жоопкерчилик</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> Кызмат «кандай болсо, ошондой» берилет. КСЛТ анын үзгүлтүксүз иштешин камсыз кылууга умтулат, бирок техникалык бузулуулардан, провайдерлердин жана иштетүүчүлөрдүн аракеттеринен, пландуу иштерден улам үзгүлтүктөрдүн жоктугуна кепилдик бербейт. 2 сааттан ашык пландуу иштер жөнүндө КСЛТ Кызматта алдын ала билдирет. Мындай иштердин, ошондой эле кырсыктарды жоюу боюнча иштердин убактысы жоопкерчиликти аныктоодо эсепке алынбайт.</p>
                    <p><strong>9.2.</strong> Тараптар Санариптик кодекстин 120-беренесинин 2-бөлүгүнө ылайык Кызматтын жеткиликсиздиги үчүн жоопкерчиликтин башка өлчөмүн белгилешет. Акысыз функциялар: КСЛТ алардын жеткиликсиздиги үчүн жоопкерчилик тартпайт. Акы төлөнүүчү мүчөлүк: КСЛТнин күнөөсү боюнча Кызмат 48 сааттан ашык катары менен жеткиликсиз болсо, Колдонуучу мүчөлүктү жеткиликсиз мезгилге узартууну же ошол мезгил үчүн мүчөлүктүн наркын кайтарууну талап кылууга укуктуу. Бул Санариптик кодекстин 120-беренесинин 5-бөлүгүндө жана керектөөчүлөрдүн укуктарын коргоо жөнүндө мыйзамдарда каралган Колдонуучунун укуктарын чектебейт.</p>
                    <p><strong>9.3.</strong> КСЛТ корттордун жана машыктыруучулардын каталогдорунда көрсөтүлгөн үчүнчү жактардын кызматтарынын сапаты үчүн жана колдонуучулардын «Оюнчу издөө» бөлүмү аркылуу өз ара түзгөн макулдашуулары үчүн жооп бербейт. Оюндарга жана мелдештерге катышуу ыктыярдуу. Колдонуучу өз ден соолугунун абалын өзү баалайт.</p>
                    <p><strong>9.4.</strong> Колдонуучу Макулдашууну бузуу менен келтирилген зыянды жарандык мыйзамдарга ылайык КСЛТге ордун толтурат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-10">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">10</span>Даттануулар жана талаштар (Санариптик кодекстин 119-беренеси)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>10.1.</strong> Кызматтын сапаты, интеллектуалдык менчик же санариптик укуктардын бузулушу, колдонуу эрежелеринин бузулушу, маалыматтын мыйзамсыз таркатылышы жана башка бузуулар жөнүндө даттануулар Тиркемедеги жана Сайттагы «Кайтарым байланыш» формасы аркылуу же <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дареги боюнча берилет.</p>
                    <p><strong>10.2.</strong> Эгерде даттануу башка колдонуучунун аракеттерине тийиштүү болсо, КСЛТ ага даттануу жөнүндө билдирет жана ага тиешелүү маалыматтарды берет. КСЛТ бузууну жоюу боюнча чараларды 5 жумуш күнүнөн ашпаган мөөнөттө көрөт. Көбүрөөк убакыт талап кылынса, КСЛТ ошол эле 5 жумуш күнүнүн ичинде арыз ээсине мөөнөттү жана анын негиздемесин билдирет. Көрүлгөн чаралар жөнүндө арыз ээсине даттануу жөнөтүлгөн ыкма менен билдирилет.</p>
                    <p><strong>10.3.</strong> Оюндардын жыйынтыктары боюнча талаштарды мелдештин башкы судьясы КСЛТнин Эрежелерине ылайык чечет. Кызматты колдонууга байланыштуу колдонуучулардын ортосундагы талаштарды КСЛТнин администрациясы бардык тиешелүү адамдарга билдирүү менен жана аларга өз позициясын баяндоого мүмкүнчүлүк берүү менен карайт.</p>
                    <p><strong>10.4.</strong> КСЛТнин даттануу же талаш боюнча чечимине милдеттүү сотко чейинки тартипте ыйгарым укуктуу тармактык жөнгө салуучуга, ал эми анын чечими менен макул болбогон учурда — Кыргыз Республикасынын сотуна даттанууга болот (Санариптик кодекстин 119-беренесинин 5-бөлүгү). Жеке маалыматтарды иштетүү маселелери боюнча Кыргыз Республикасынын Министрлер Кабинетине караштуу Жеке маалыматтарды коргоо боюнча мамлекеттик агенттикке же сотко даттанууга болот.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-11">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">11</span>Кызматтан баш тартуу жана аккаунтту өчүрүү</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>11.1.</strong> Колдонуучу каалаган убакта Кызматтан баш тартууга укуктуу, аккаунтту Тиркемеде (Профиль → Жөндөөлөр → «Аккаунтту өчүрүү»), Сайтта же <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дарегине кат жөнөтүү менен өчүрүп.</p>
                    <p><strong>11.2.</strong> Баш тартууда КСЛТ (Санариптик кодекстин 118-беренеси): акы төлөнүүчү мүчөлүк боюнча эсептешүү жүргүзөт (5.2-пункт); Колдонуучуга ал жөнүндө кандай маалыматтар сакталарын көрсөтөт жана алардын көчүрмөсүн жүктөп алууну сунуштайт; маалыматтарды Купуялык саясатында сүрөттөлгөн тартипте өчүрөт; мыйзам боюнча кайсы жазуулар сакталарын билдирет (мелдештердин тарыхы, Макулдашуунун түзүлгөнү жөнүндө жазуулар, төлөм документтери).</p>
                    <p><strong>11.3.</strong> Аккаунтту өчүрүү боюнча суроо-талап Колдонуучунун өз санариптик жазууларын өчүрүү жөнүндө чечими катары эсептелет. Эгерде Колдонуучу Кызматтан башка жол менен баш тартып, өз жазуулары жөнүндө чечимин билдирбесе, алар баш тартуу жылынан кийинки календардык жыл аяктаганда өчүрүлөт (118-берененин 2-бөлүгү).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-12">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">12</span>Макулдашууну өзгөртүү</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>12.1.</strong> Өзгөртүүлөр киргизилгени жөнүндө КСЛТ Колдонуучуга Тиркемеде жана электрондук почта аркылуу алар күчүнө киргенге чейин кеминде бир ай мурун билдирет (Санариптик кодекстин 114-беренесинин 5-бөлүгү). Макулдашуу билдирүүдө көрсөтүлгөн күндөн тартып өзгөртүлгөн болуп эсептелет.</p>
                    <p><strong>12.2.</strong> Эгерде ошол күнгө чейин Колдонуучу өзгөртүүлөр менен макул эмес экенин билдирсе, Макулдашуу токтотулат, ал эми КСЛТ макул эместик жөнүндө арыз алынганга чейинки Кызматтын наркын кемитип, Колдонуучу төлөгөн акчаны кайтарат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-13">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">13</span>iOS колдонуучулары үчүн өзгөчө шарттар (App Store)</h2></summary>
                <div class="ip-rules-list">
                    <ul class="ip-doc-list">
                        <li>Макулдашуу Колдонуучу менен КСЛТнин ортосунда түзүлгөн, Apple Inc. менен эмес. Тиркеме жана анын мазмуну үчүн жоопкерчиликти КСЛТ тартат.</li>
                        <li>Колдонуучуга Тиркемени өзү ээлик кылган же башкарган Apple түзмөктөрүндө App Store колдонуу эрежелерине ылайык пайдаланууга өткөрүлбөс укук берилет.</li>
                        <li>Тиркемеге техникалык колдоону КСЛТ көрсөтөт. Apple Тиркемеге колдоо жана тейлөө көрсөтүүгө милдеттүү эмес.</li>
                        <li>Эгерде Тиркеме колдонулуучу кепилдиктерге дал келбесе, Колдонуучу Apple'га билдире алат, Apple Тиркеменин сатып алуу наркын кайтарат (эгерде ал болсо). Калган учурда Apple кепилдик милдеттенмелерин тартпайт.</li>
                        <li>Тиркемеге байланыштуу доолорду (анын ичинде мыйзамдарга ылайыктуулугу, керектөөчүлөрдүн укуктарын коргоо, үчүнчү жактардын интеллектуалдык менчик укуктарынын бузулушу боюнча) КСЛТ карайт.</li>
                        <li>Колдонуучу АКШнын эмбаргосу колдонулган өлкөдө жүрбөгөнүн жана АКШнын санкциялык тизмелерине кирбегенин ырастайт.</li>
                        <li>Apple Inc. жана анын туунду компаниялары Макулдашуу боюнча үчүнчү жак-пайда алуучулар болуп саналат жана Колдонуучудан анын аткарылышын талап кылууга укуктуу.</li>
                    </ul>
                    <p>Android колдонуучулары ошондой эле Google Play шарттарын сакташат. Google LLC Макулдашуунун тарабы болуп саналбайт.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="ua-14">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">14</span>Корутунду жоболор</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>14.1.</strong> Макулдашуу 11 жана 12-бөлүмдөр боюнча токтотулганга чейин мөөнөтсүз колдонулат. Колдонуучу 6-бөлүмдү одоно же кайталап бузган учурда КСЛТ Макулдашууну токтотууга укуктуу.</p>
                    <p><strong>14.2.</strong> Макулдашууга Кыргыз Республикасынын укугу колдонулат. Макулдашуу орус, кыргыз жана англис тилдеринде жарыяланат. Тексттер ортосунда айырмачылык болгон учурда орус тилиндеги текст артыкчылыкка ээ.</p>
                    <p><strong>14.3.</strong> Эгерде Макулдашуунун кандайдыр бир жобосу жараксыз деп табылса, калган жоболор күчүндө калат.</p>
                </div>
            </details>

            <div class="ip-doc-sign ip-fade-in">
                <p class="ip-doc-sign-role">КСЛТнин Башкармалыгынын Төрагасы</p>
                <p class="ip-doc-sign-name">Чокоева А. Э.</p>
                <p class="ip-doc-revision">2026-жылдын 3-ноябрындагы редакциясы. 2026-жылдын 3-ноябрындагы № 1 буйругу менен бекитилген.</p>
                <button type="button" class="ip-doc-print" data-doc-print>Басып чыгаруу же PDF сактоо</button>
            </div>$kslt$)
ON CONFLICT (slug) DO UPDATE SET
    body    = EXCLUDED.body,
    body_en = EXCLUDED.body_en,
    body_kg = EXCLUDED.body_kg,
    title    = COALESCE(public.site_documents.title,    EXCLUDED.title),
    title_en = COALESCE(public.site_documents.title_en, EXCLUDED.title_en),
    title_kg = COALESCE(public.site_documents.title_kg, EXCLUDED.title_kg);

-- ---- privacy ----------------------------------------------------
INSERT INTO public.site_documents (slug, title, title_en, title_kg, body, body_en, body_kg)
VALUES ('privacy',
        NULL, NULL, NULL,
        $kslt$            <!-- ВЫЖИМКА. Не заменяет документ и прямо об этом говорит: человек
                 должен понимать, что читает пересказ, а не текст, имеющий силу. -->
            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">Утверждено приказом руководителя ОФ «КСЛТ» № 1 от 3 ноября 2026 г.</p>
                <p class="ip-doc-approved-line">Редакция от 3 ноября 2026 г.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">Настоящая Политика определяет порядок обработки персональных данных пользователей сайта <a href="https://tennis.kg">tennis.kg</a> и мобильных приложений «KSLT Tennis». Полный текст приведён ниже и имеет силу целиком.</p>
            </div>

            <div class="ip-doc-gist ip-fade-in">
                <div class="ip-doc-gist-title">Коротко о главном</div>
                <p class="ip-doc-gist-note">Это краткое изложение для удобства чтения. Оно не заменяет документ: действует полный текст ниже.</p>
                <ul class="ip-doc-gist-list">
                    <li><strong>Что собираем.</strong> Имя и фамилию, почту, дату рождения, пол — без них нельзя вести рейтинг и составлять сетки. Телефон и фото — по желанию.</li>
                    <li><strong>Что видно всем.</strong> Имя, фото, категория, место и очки в рейтинге, результаты матчей. Почта, дата рождения и платежи не публикуются никогда.</li>
                    <li><strong>Телефон и Telegram.</strong> Показываются другим игрокам только если вы сами включили это в профиле, и выключаются там же.</li>
                    <li><strong>Кому передаём.</strong> Supabase, Google, Telegram, Resend — чтобы работали база, вход, уведомления и письма. Данные не продаются и не используются для чужой рекламы.</li>
                    <li><strong>Удаление аккаунта.</strong> В профиле или письмом. 30 дней на возврат, потом окончательно; результаты турниров остаются в протоколах.</li>
                    <li><strong>Ваши права.</strong> Получить свои данные, исправить, забрать копию, отозвать согласие, возразить, пожаловаться регулятору. Ответ — до 7 рабочих дней.</li>
                </ul>
            </div>

            <!-- Оглавление: якоря внутри раскрывашек, поэтому переход их открывает —
                 за это отвечает обработчик в конце страницы. -->
            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Содержание</div>
                <ol class="ip-toc-list">
                    <li><a href="#pp-1">Общие положения</a></li>
                    <li><a href="#pp-2">Сведения о владельце персональных записей</a></li>
                    <li><a href="#pp-3">Какие данные мы обрабатываем, зачем и на каком основании</a></li>
                    <li><a href="#pp-4">Публичная информация</a></li>
                    <li><a href="#pp-5">Автоматическое принятие решений</a></li>
                    <li><a href="#pp-6">Кому передаются данные</a></li>
                    <li><a href="#pp-7">Трансграничная передача</a></li>
                    <li><a href="#pp-8">Сроки хранения</a></li>
                    <li><a href="#pp-9">Права пользователя</a></li>
                    <li><a href="#pp-10">Удаление учётной записи</a></li>
                    <li><a href="#pp-11">Защита данных</a></li>
                    <li><a href="#pp-12">Дети</a></li>
                    <li><a href="#pp-13">Cookie и локальное хранилище</a></li>
                    <li><a href="#pp-14">Изменение Политики</a></li>
                    <li><a href="#pp-15">Контакты</a></li>
                </ol>
                <button type="button" class="ip-doc-expand" data-doc-expand>Раскрыть все разделы</button>
            </div>

            <details class="ip-doc-fold ip-fade-in" id="pp-1">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">01</span>Общие положения</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> Настоящая Политика определяет, какие персональные данные пользователей обрабатывает Общественный фонд «Кыргызстанское сообщество любителей тенниса» (далее — КСЛТ, «мы»), в каких целях и на каких основаниях, кому они передаются, как долго хранятся и какие права есть у пользователей. Политика применяется к сайту <a href="https://tennis.kg">tennis.kg</a> (далее — Сайт), мобильным приложениям «KSLT Tennis» для Android и iOS (далее — Приложение) и связанным с ними сервисам: рейтингу, турнирам, баттлам, поиску партнёра, каталогам кортов и тренеров, новостям, Telegram-боту и рассылкам (вместе — Сервис).</p>
                    <p><strong>1.2.</strong> Политика разработана в соответствии с Цифровым кодексом Кыргызской Республики от 31 июля 2025 года № 178 (далее — Цифровой кодекс), в том числе главой 11 «Обработка персональных данных», статьями 33, 44, 73–89 и 114–120. С 5 февраля 2026 года Цифровой кодекс заменил Закон Кыргызской Республики «Об информации персонального характера».</p>
                    <p><strong>1.3.</strong> Термины используются в значениях, установленных Цифровым кодексом. Персональные данные — цифровые данные, содержащие информацию о физическом лице, которое может быть по ним идентифицировано. Обработка — любое действие с данными: сбор, запись, хранение, изменение, использование, передача, обезличивание, удаление и т.п. Пользователь — физическое лицо, использующее Сервис (субъект персональных данных).</p>
                    <p><strong>1.4.</strong> КСЛТ является владельцем персональных записей, то есть лицом, которое определяет цели и способы обработки персональных данных пользователей Сервиса.</p>
                    <p><strong>1.5.</strong> Политика доступна до регистрации и в любой момент после неё: на Сайте, в Приложении (раздел «Профиль» → «Документы») и на страницах Приложения в Google Play и App Store. Её можно сохранить и распечатать.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-2">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">02</span>Сведения о владельце персональных записей</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>Полное наименование:</strong> Общественный фонд «Кыргызстанское сообщество любителей тенниса» («Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду)</p>
                    <p><strong>Регистрационный номер:</strong> 197575-3301-ОФ (Единый государственный реестр юридических лиц, Чуй-Бишкекское управление юстиции, дата первичной регистрации 19.05.2021)</p>
                    <p><strong>ИНН:</strong> 01905202110030; код ОКПО: 31147180</p>
                    <p><strong>Юридический адрес:</strong> Кыргызская Республика, г. Бишкек, Свердловский район, пр. Чуй, 127, кв. 26</p>
                    <p><strong>Руководитель:</strong> Чокоева Айсулуу Эриковна</p>
                    <p><strong>Электронная почта:</strong> <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; телефон / WhatsApp: +996 555 777703</p>
                    <p><strong>Ответственный за обработку персональных данных:</strong> Константин Хан, электронная почта для обращений по персональным данным: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> (тема письма «Персональные данные»).</p>
                    <p><strong>Место обработки персональных данных:</strong> Кыргызская Республика (КСЛТ) и серверы обработчиков, указанных в разделе 6 (в том числе за пределами Кыргызской Республики).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-3">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">03</span>Какие данные мы обрабатываем, зачем и на каком основании</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Мы обрабатываем только те данные, которые нужны для указанных целей (принцип минимизации, ст. 78 Цифрового кодекса). Перечень данных, цели и основания обработки приведены в таблице.</p>
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Цель</th><th>Данные</th><th>Основание (ст. 79 Цифрового кодекса)</th></tr></thead>
                            <tbody>
                                <tr>
                                    <td>Регистрация, вход, ведение учётной записи, восстановление пароля</td>
                                    <td>Имя, фамилия, адрес электронной почты, пароль (хранится только в виде хеша bcrypt), дата рождения, пол; при входе через Google — имя, e-mail, фото профиля Google; при входе через Telegram — Telegram ID, имя пользователя, фото</td>
                                    <td>Исполнение пользовательского соглашения (п. 1 ч. 1)</td>
                                </tr>
                                <tr>
                                    <td>Ведение рейтинга, участие в турнирах и баттлах, формирование сеток, публикация результатов</td>
                                    <td>Имя, фамилия, пол, возрастная группа, категория (тур), очки, результаты матчей, статистика побед и поражений, история турниров</td>
                                    <td>Исполнение пользовательского соглашения и публичной оферты (п. 1 ч. 1)</td>
                                </tr>
                                <tr>
                                    <td>Членство и оплата услуг</td>
                                    <td>Сумма, дата и способ платежа, период членства, статус взносов. Данные банковских карт КСЛТ не получает и не хранит</td>
                                    <td>Исполнение договора (п. 1 ч. 1); выполнение обязанностей по бухгалтерскому учёту (п. 2 ч. 1)</td>
                                </tr>
                                <tr>
                                    <td>Безопасность учётной записи (уведомление о входе с нового устройства, защита от взлома)</td>
                                    <td>Хеш user-agent браузера, разрешение экрана, время последнего входа, IP-адрес</td>
                                    <td>Законный интерес КСЛТ и пользователя в защите аккаунта (п. 5 ч. 1)</td>
                                </tr>
                                <tr>
                                    <td>Служебные уведомления о турнирах, заявках, матчах, изменении документов</td>
                                    <td>Адрес электронной почты, Telegram ID, токен push-уведомлений устройства</td>
                                    <td>Исполнение соглашения (п. 1 ч. 1); для направления уведомлений на контактные данные — согласие пользователя (ст. 44)</td>
                                </tr>
                                <tr>
                                    <td>Рассмотрение обращений, жалоб и споров</td>
                                    <td>Данные, указанные в обращении, переписка, сведения о спорной ситуации</td>
                                    <td>Выполнение обязанностей по ст. 119 Цифрового кодекса (п. 2 ч. 1)</td>
                                </tr>
                                <tr>
                                    <td>Статистика посещаемости и улучшение Сервиса</td>
                                    <td>Обезличенные данные Google Analytics (страницы, устройство, приблизительное местоположение по IP)</td>
                                    <td>Законный интерес КСЛТ (п. 5 ч. 1); ст. 50 (обезличенные записи)</td>
                                </tr>
                                <tr>
                                    <td>Дополнительные цели: показ телефона/Telegram в разделе «Поиск игрока», публикация фото и видео с турниров в соцсетях КСЛТ, новостные и рекламные рассылки</td>
                                    <td>Указаны в Согласии на обработку персональных данных</td>
                                    <td>Отдельное добровольное согласие пользователя по каждой цели (ч. 2 ст. 79)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p><strong>3.2.</strong> Обязательными для регистрации являются имя, фамилия, адрес электронной почты, дата рождения и пол. Без них невозможно создать учётную запись, вести рейтинг и формировать сетки по категориям. Номер телефона и фото профиля указываются по желанию.</p>
                    <p><strong>3.3.</strong> Согласие на обработку персональных данных запрашивается только для целей, указанных в последней строке таблицы. Отказ от любой из этих целей не ограничивает доступ к основным функциям Сервиса.</p>
                    <p><strong>3.4.</strong> Мы не обрабатываем специальные категории персональных данных (сведения о здоровье, расовой или этнической принадлежности, религиозных и политических взглядах, биометрические и генетические данные). Пожалуйста, не указывайте такие сведения в профиле и сообщениях.</p>
                    <p><strong>3.5.</strong> Мы не используем персональные данные для рекламы третьих лиц и не продаём их.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-4">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">04</span>Публичная информация</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Сервис является открытым рейтингом любительского тенниса. Поэтому следующие сведения о пользователе видны всем посетителям Сайта и Приложения: имя и фамилия, фото профиля (если загружено), категория, место и очки в рейтинге, результаты матчей и турниров, участие в баттлах.</p>
                    <p><strong>4.2.</strong> Адрес электронной почты, дата рождения, платёжные сведения и технические данные не публикуются. Телефон и Telegram показываются другим пользователям только при наличии отдельного согласия.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-5">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">05</span>Автоматическое принятие решений</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Очки, место в рейтинге и категория (Futures, Challenger, Tour, Masters, Pro-Masters) рассчитываются автоматически по результатам матчей в соответствии с Правилами КСЛТ, разделом «Система рейтинга», опубликованным на Сайте. От этого зависит, в турнирах какой категории пользователь может участвовать.</p>
                    <p><strong>5.2.</strong> Пользователь вправе запросить пояснение расчёта своих очков, оспорить его у главного судьи турнира или в администрации КСЛТ, а также направить возражение против автоматической обработки (ст. 84 Цифрового кодекса). Решение по возражению принимает работник КСЛТ.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-6">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">06</span>Кому передаются данные (обработчики и получатели)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Для работы Сервиса КСЛТ поручает обработку данных следующим лицам (обработчикам) или передаёт данные следующим получателям:</p>
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Лицо, местонахождение</th><th>Функция</th><th>Какие данные</th><th>Основание</th></tr></thead>
                            <tbody>
                                <tr>
                                    <td>Разработчики: Константин Хан и Татьяна Нечаева, Кыргызская Республика</td>
                                    <td>Разработка и техническая поддержка Сайта и Приложения</td>
                                    <td>Все данные Сервиса в объёме, необходимом для поддержки</td>
                                    <td>Договор № 1 от 01.06.2026 (поручение на обработку, ст. 86)</td>
                                </tr>
                                <tr>
                                    <td>Supabase Inc., США (серверы Amazon Web Services, регион us-east-1 — Северная Вирджиния, США)</td>
                                    <td>База данных, аутентификация, резервные копии</td>
                                    <td>Все данные учётных записей</td>
                                    <td>Условия обслуживания и соглашение об обработке данных (DPA) Supabase</td>
                                </tr>
                                <tr>
                                    <td>Google LLC, США</td>
                                    <td>Вход через Google (OAuth), push-уведомления Firebase Cloud Messaging, статистика Google Analytics</td>
                                    <td>Имя, e-mail, фото Google; токен устройства; обезличенные данные посещений</td>
                                    <td>Условия Google и Google Ads Data Processing Terms</td>
                                </tr>
                                <tr>
                                    <td>Telegram Messenger Inc. / Telegram FZ-LLC, ОАЭ</td>
                                    <td>Вход через Telegram, уведомления Telegram-ботом</td>
                                    <td>Telegram ID, имя пользователя, фото, тексты уведомлений</td>
                                    <td>Условия Telegram Bot API</td>
                                </tr>
                                <tr>
                                    <td>Resend Inc., США</td>
                                    <td>Отправка служебных писем</td>
                                    <td>E-mail, имя получателя, текст письма</td>
                                    <td>Условия обслуживания и DPA Resend</td>
                                </tr>
                                <!-- ХОСТИНГ САЙТА: ЗАПОЛНЕНО 07.11.2026.
                                     Оператор — Contabo GmbH (Мюнхен, Германия): сторона
                                     договора названа Тати. Размещение серверов — США,
                                     Сент-Луис, Миссури: СВЕРЕНО ЗАМЕРОМ, а не со слов —
                                     tennis.kg ведёт на 209.145.52.153, обратное имя
                                     vmi2366528.contaboserver.net, владелец AS40021
                                     Contabo Inc. Геолокация по адресу — ориентир; точный
                                     регион виден в панели Contabo у Тати.
                                     ПРЕЖНЯЯ ПОМЕТКА И ЕЁ ПРИЧИНА: -->
                                <!-- ХОСТИНГ САЙТА: СТРОКА НЕ ЗАПОЛНЕНА.
                                     Прежняя редакция называла хостингом GitHub, и это
                                     неправда: сайт переезжает на сервер, а чей он и в
                                     какой стране — ждёт ответа. Пока строка помечена,
                                     документ выкладывать нельзя: от страны зависит
                                     раздел 7 о трансграничной передаче.
                                     Сторож `check-politika.js` падает на этой пометке. -->
                                <tr>
                                    <td>Contabo GmbH, Вельфенштрассе 22, 81541 Мюнхен, Германия; серверы размещены в США (Сент-Луис, штат Миссури)</td>
                                    <td>Хостинг Сайта</td>
                                    <td>IP-адрес и технические данные запроса</td>
                                    <td>Условия обслуживания и политика конфиденциальности Contabo</td>
                                </tr>
                                <tr>
                                    <td>Платёжный провайдер: ДемирБанк, проспект Чуй, 304, Бишкек, Кыргызская Республика</td>
                                    <td>Приём платежей (после подключения онлайн-оплаты)</td>
                                    <td>Сумма, дата, идентификатор платежа</td>
                                    <td>Договор № 1 от 02.11.2026</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p><strong>6.2.</strong> Каждый обработчик обрабатывает данные только по поручению КСЛТ и в указанных целях. КСЛТ отвечает за действия обработчиков как за свои собственные (ст. 38 Цифрового кодекса). Перечень обработчиков обновляется при изменении состава.</p>
                    <p><strong>6.3.</strong> Данные также могут быть предоставлены государственным органам Кыргызской Республики в случаях и порядке, установленных законом.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-7">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">07</span>Трансграничная передача</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Серверы Supabase, Google, Resend и Contabo (хостинг Сайта) находятся в США, Telegram — в ОАЭ и других странах. Перед передачей КСЛТ проверяет, включено ли государство в перечень государств, обеспечивающих адекватную защиту персональных данных, утверждённый отраслевым регулятором (ч. 3 ст. 89 Цифрового кодекса).</p>
                    <p><strong>7.2.</strong> Если государство не включено в перечень, передача осуществляется, поскольку она необходима для заключения и исполнения пользовательского соглашения, стороной которого является пользователь (п. 4 ч. 4 ст. 89), и на условиях договоров с обработчиками, обеспечивающих защиту данных (п. 6 ч. 4 ст. 89). Переданные данные обрабатываются в соответствии с законодательством страны получателя (ч. 5 ст. 89).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-8">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">08</span>Сроки хранения</h2></summary>
                <div class="ip-rules-list">
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Данные</th><th>Срок хранения</th></tr></thead>
                            <tbody>
                                <tr><td>Данные учётной записи</td><td>Пока учётная запись действует. После удаления учётной записи — 30 дней (возможность отменить удаление), затем удаляются</td></tr>
                                <tr><td>Результаты матчей и турниров, история рейтинга</td><td>Бессрочно в составе турнирной истории; после удаления учётной записи — в обезличенном виде либо с указанием только имени и фамилии в протоколах турниров (п. 2 ч. 2 ст. 83 — архивные и статистические цели)</td></tr>
                                <tr><td>Записи о заключении и исполнении пользовательского соглашения, о полученных согласиях</td><td>Срок действия соглашения и 3 года после его прекращения (ч. 4 ст. 114 Цифрового кодекса)</td></tr>
                                <tr><td>Платёжные сведения</td><td>Срок, установленный законодательством о бухгалтерском учёте</td></tr>
                                <tr><td>Технические данные о входах</td><td>12 месяцев</td></tr>
                                <tr><td>Обращения и жалобы</td><td>3 года после рассмотрения</td></tr>
                                <tr><td>Данные, обрабатываемые по согласию</td><td>До отзыва согласия или удаления учётной записи</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-9">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">09</span>Права пользователя</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> Пользователь вправе:</p>
                    <ul class="ip-doc-list">
                        <li>получить информацию об обработке своих данных в объёме ч. 1 ст. 73 Цифрового кодекса;</li>
                        <li>получить доступ ко всем своим данным или их копию (ч. 4 ст. 73);</li>
                        <li>исправить или дополнить свои данные (ст. 75) — самостоятельно в профиле или по запросу;</li>
                        <li>получить свои данные в машиночитаемом формате или потребовать их передачи другому владельцу записей (ст. 76);</li>
                        <li>потребовать удаления данных (ст. 83), в том числе удалить учётную запись (раздел 10);</li>
                        <li>возразить против обработки определёнными способами или в определённых целях (ст. 84);</li>
                        <li>потребовать ограничения обработки на время рассмотрения возражения или исправления данных (ст. 85);</li>
                        <li>отозвать любое согласие в настройках профиля или письмом — так же просто, как оно было дано (ч. 5 ст. 79);</li>
                        <li>отказаться от Сервиса и получить сведения о своих данных (ст. 118);</li>
                        <li>обжаловать действия КСЛТ в Государственное агентство по защите персональных данных при Кабинете Министров Кыргызской Республики или в суд.</li>
                    </ul>
                    <p><strong>9.2.</strong> Запросы направляются на <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> или через раздел «Профиль» → «Мои данные» в Приложении. Для подтверждения личности мы можем попросить отправить запрос с адреса электронной почты, указанного в учётной записи (ч. 2 ст. 37).</p>
                    <p><strong>9.3.</strong> Сроки ответа: информация об обработке, доступ к данным, исправление, решение по возражению — не более 7 рабочих дней со дня получения запроса. Об ограничении обработки или его снятии сообщаем не позднее следующего рабочего дня. Удаление по основаниям ст. 83 производится незамедлительно, с учётом 30-дневного срока на отмену удаления, если пользователь не попросил удалить сразу.</p>
                    <p><strong>9.4.</strong> Отказ предоставить обязательные данные (п. 3.2) означает, что зарегистрироваться и участвовать в рейтинге и турнирах будет невозможно. Отказ от согласий на дополнительные цели последствий для основных функций не имеет.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-10">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">10</span>Удаление учётной записи</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>10.1.</strong> Удалить учётную запись можно в Приложении (Профиль → Настройки → «Удалить аккаунт»), на Сайте (Профиль → Настройки) или письмом на <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>. Подробный порядок опубликован на странице <a href="https://tennis.kg/pages/delete-account.html">tennis.kg/pages/delete-account.html</a>.</p>
                    <p><strong>10.2.</strong> После удаления профиль сразу перестаёт быть виден другим пользователям. Через 30 дней персональные данные удаляются окончательно. Сохраняются только данные, указанные в разделе 8, которые КСЛТ обязан или вправе хранить по закону, о чём пользователю сообщается при удалении (ч. 3 ст. 118).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-11">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">11</span>Защита данных</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>11.1.</strong> КСЛТ принимает организационные и технические меры защиты (ст. 78, 88 Цифрового кодекса): передача данных только по HTTPS (TLS), разграничение доступа на уровне строк базы данных (Row Level Security), хранение паролей в виде хешей, шифрование резервных копий, ограничение круга лиц с доступом к данным, учёт операций с персональными записями, обучение работников и волонтёров.</p>
                    <p><strong>11.2.</strong> При утечке персональных данных КСЛТ принимает меры по её устранению и уведомляет пострадавших пользователей и отраслевого регулятора в порядке, установленном законодательством.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-12">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">12</span>Дети</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>12.1.</strong> Сервис предназначен для лиц от 14 лет. Пользователи от 14 до 18 лет дают согласие на обработку своих данных самостоятельно (ч. 3 ст. 81 Цифрового кодекса). Участие в турнирах — по условиям публичной оферты.</p>
                    <p><strong>12.2.</strong> Если нам станет известно, что зарегистрировался ребёнок младше 14 лет без согласия законного представителя, учётная запись будет удалена. Законный представитель может сообщить об этом на <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-13">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">13</span>Cookie и локальное хранилище</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>13.1.</strong> Сайт использует локальное хранилище браузера (localStorage) только для сохранения входа в учётную запись и настроек (язык). Рекламные и сторонние трекинговые cookie не используются. Google Analytics собирает обезличенную статистику. Её можно отключить расширениями браузера.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-14">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">14</span>Изменение Политики</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>14.1.</strong> О существенных изменениях Политики мы уведомляем пользователей в Приложении и по электронной почте не менее чем за один месяц до вступления изменений в силу. Новая цель обработки, для которой нет основания по ч. 1 ст. 79, вводится только после получения согласия пользователя (ч. 2 ст. 78). Действующая и предыдущие редакции доступны на Сайте.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-15">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">15</span>Контакты</h2></summary>
                <div class="ip-rules-list">
                    <p>По всем вопросам обработки персональных данных: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; почтовый адрес: Кыргызская Республика, г. Бишкек, Свердловский район, пр. Чуй, 127, кв. 26, ОФ «КСЛТ».</p>
                </div>
            </details>

            <div class="ip-doc-sign ip-fade-in">
                <p class="ip-doc-sign-role">Председатель Правления КСЛТ</p>
                <p class="ip-doc-sign-name">Чокоева А. Э.</p>
                <p class="ip-doc-revision">Редакция от 3 ноября 2026 г. Утверждена приказом № 1 от 3 ноября 2026 г.</p>
                <button type="button" class="ip-doc-print" data-doc-print>Распечатать или сохранить PDF</button>
            </div>$kslt$,
        $kslt$            <!-- MACHINE TRANSLATION of the Russian edition approved by Order No. 1.
                 The Russian text is the one that was approved; this is a convenience
                 translation and is marked as such in the document itself. -->
            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">Approved by Order No. 1 of the Head of the KSLT Public Foundation, 3 November 2026.</p>
                <p class="ip-doc-approved-line">Edition of 3 November 2026.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">This Policy sets out how personal data of users of the <a href="https://tennis.kg">tennis.kg</a> website and the «KSLT Tennis» mobile applications is processed. The full text is given below and applies in full. In case of any discrepancy, the Russian edition prevails.</p>
            </div>

            <div class="ip-doc-gist ip-fade-in">
                <div class="ip-doc-gist-title">In short</div>
                <p class="ip-doc-gist-note">This is a short summary for convenience. It does not replace the document: the full text below is what applies.</p>
                <ul class="ip-doc-gist-list">
                    <li><strong>What we collect.</strong> First and last name, e-mail, date of birth, gender — without these we cannot maintain the rating or build draws. Phone number and photo are optional.</li>
                    <li><strong>What everyone can see.</strong> Name, profile photo, category, rating position and points, match results. E-mail, date of birth and payment details are never published.</li>
                    <li><strong>Phone and Telegram.</strong> Shown to other players only if you switched this on in your profile, and switched off in the same place.</li>
                    <li><strong>Who we share with.</strong> Supabase, Google, Telegram, Resend — so that the database, sign-in, notifications and e-mails work. Data is not sold and is not used for third-party advertising.</li>
                    <li><strong>Deleting your account.</strong> In your profile or by e-mail. 30 days to change your mind, then permanent; tournament results remain in the protocols.</li>
                    <li><strong>Your rights.</strong> Obtain your data, correct it, take a copy, withdraw consent, object, complain to the regulator. We reply within 7 working days.</li>
                </ul>
            </div>

            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Contents</div>
                <ol class="ip-toc-list">
                    <li><a href="#pp-1">General provisions</a></li>
                    <li><a href="#pp-2">Details of the owner of personal records</a></li>
                    <li><a href="#pp-3">What data we process, why and on what grounds</a></li>
                    <li><a href="#pp-4">Public information</a></li>
                    <li><a href="#pp-5">Automated decision-making</a></li>
                    <li><a href="#pp-6">Who the data is shared with</a></li>
                    <li><a href="#pp-7">Cross-border transfer</a></li>
                    <li><a href="#pp-8">Retention periods</a></li>
                    <li><a href="#pp-9">User rights</a></li>
                    <li><a href="#pp-10">Deleting an account</a></li>
                    <li><a href="#pp-11">Data protection</a></li>
                    <li><a href="#pp-12">Children</a></li>
                    <li><a href="#pp-13">Cookies and local storage</a></li>
                    <li><a href="#pp-14">Changes to the Policy</a></li>
                    <li><a href="#pp-15">Contacts</a></li>
                </ol>
                <button type="button" class="ip-doc-expand" data-doc-expand>Expand all sections</button>
            </div>

            <details class="ip-doc-fold ip-fade-in" id="pp-1">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">01</span>General provisions</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> This Policy sets out what personal data of users is processed by the Public Foundation «Kyrgyzstan Community of Tennis Enthusiasts» (hereinafter — KSLT, «we»), for what purposes and on what grounds, who it is shared with, how long it is kept and what rights users have. The Policy applies to the <a href="https://tennis.kg">tennis.kg</a> website (hereinafter — the Site), the «KSLT Tennis» mobile applications for Android and iOS (hereinafter — the Application) and the related services: rating, tournaments, battles, partner search, court and coach directories, news, the Telegram bot and mailings (together — the Service).</p>
                    <p><strong>1.2.</strong> The Policy has been drawn up in accordance with the Digital Code of the Kyrgyz Republic of 31 July 2025 No. 178 (hereinafter — the Digital Code), including Chapter 11 «Processing of personal data», Articles 33, 44, 73–89 and 114–120. From 5 February 2026 the Digital Code replaced the Law of the Kyrgyz Republic «On personal information».</p>
                    <p><strong>1.3.</strong> Terms are used with the meanings established by the Digital Code. Personal data means digital data containing information about a natural person who can be identified by it. Processing means any operation with data: collection, recording, storage, alteration, use, transfer, anonymisation, deletion and so on. User means a natural person using the Service (the data subject).</p>
                    <p><strong>1.4.</strong> KSLT is the owner of personal records, that is, the party that determines the purposes and means of processing users' personal data.</p>
                    <p><strong>1.5.</strong> The Policy is available before registration and at any time afterwards: on the Site, in the Application («Profile» → «Documents») and on the Application's pages in Google Play and the App Store. It can be saved and printed.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-2">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">02</span>Details of the owner of personal records</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>Full name:</strong> Public Foundation «Kyrgyzstan Community of Tennis Enthusiasts» («Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду)</p>
                    <p><strong>Registration number:</strong> 197575-3301-ОФ (Unified State Register of Legal Entities, Chuy-Bishkek Department of Justice, first registered 19.05.2021)</p>
                    <p><strong>Taxpayer number (INN):</strong> 01905202110030; OKPO code: 31147180</p>
                    <p><strong>Registered address:</strong> Kyrgyz Republic, Bishkek, Sverdlovsky district, Chuy Avenue 127, apt. 26</p>
                    <p><strong>Head:</strong> Aisuluu Erikovna Chokoeva</p>
                    <p><strong>E-mail:</strong> <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; phone / WhatsApp: +996 555 777703</p>
                    <p><strong>Person responsible for personal data processing:</strong> Konstantin Khan, e-mail for personal data enquiries: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> (subject line «Personal data»).</p>
                    <p><strong>Place of processing:</strong> the Kyrgyz Republic (KSLT) and the servers of the processors listed in section 6 (including outside the Kyrgyz Republic).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-3">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">03</span>What data we process, why and on what grounds</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> We process only the data needed for the stated purposes (minimisation principle, Article 78 of the Digital Code). The data, purposes and grounds for processing are set out in the table.</p>
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Purpose</th><th>Data</th><th>Ground (Article 79 of the Digital Code)</th></tr></thead>
                            <tbody>
                                <tr>
                                    <td>Registration, sign-in, account management, password recovery</td>
                                    <td>First and last name, e-mail address, password (stored only as a bcrypt hash), date of birth, gender; when signing in with Google — name, e-mail, Google profile photo; when signing in with Telegram — Telegram ID, username, photo</td>
                                    <td>Performance of the user agreement (clause 1 part 1)</td>
                                </tr>
                                <tr>
                                    <td>Maintaining the rating, participation in tournaments and battles, building draws, publishing results</td>
                                    <td>First and last name, gender, age group, category (tour), points, match results, win and loss statistics, tournament history</td>
                                    <td>Performance of the user agreement and the public offer (clause 1 part 1)</td>
                                </tr>
                                <tr>
                                    <td>Membership and payment for services</td>
                                    <td>Amount, date and method of payment, membership period, status of fees. KSLT does not receive or store bank card details</td>
                                    <td>Performance of the contract (clause 1 part 1); compliance with accounting obligations (clause 2 part 1)</td>
                                </tr>
                                <tr>
                                    <td>Account security (notification of sign-in from a new device, protection against account takeover)</td>
                                    <td>Hash of the browser user-agent, screen resolution, time of last sign-in, IP address</td>
                                    <td>Legitimate interest of KSLT and the user in protecting the account (clause 5 part 1)</td>
                                </tr>
                                <tr>
                                    <td>Service notifications about tournaments, entries, matches and changes to the documents</td>
                                    <td>E-mail address, Telegram ID, device push notification token</td>
                                    <td>Performance of the agreement (clause 1 part 1); for notifications sent to contact details — the user's consent (Article 44)</td>
                                </tr>
                                <tr>
                                    <td>Handling enquiries, complaints and disputes</td>
                                    <td>Data provided in the enquiry, correspondence, details of the disputed situation</td>
                                    <td>Compliance with obligations under Article 119 of the Digital Code (clause 2 part 1)</td>
                                </tr>
                                <tr>
                                    <td>Traffic statistics and improvement of the Service</td>
                                    <td>Anonymised Google Analytics data (pages, device, approximate location by IP)</td>
                                    <td>Legitimate interest of KSLT (clause 5 part 1); Article 50 (anonymised records)</td>
                                </tr>
                                <tr>
                                    <td>Additional purposes: showing phone/Telegram in the «Find a player» section, publishing photos and videos from tournaments on KSLT social media, newsletters and promotional mailings</td>
                                    <td>Set out in the Consent to the processing of personal data</td>
                                    <td>Separate voluntary consent of the user for each purpose (part 2 Article 79)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p><strong>3.2.</strong> First and last name, e-mail address, date of birth and gender are mandatory for registration. Without them it is impossible to create an account, maintain the rating and build draws by category. Phone number and profile photo are optional.</p>
                    <p><strong>3.3.</strong> Consent to the processing of personal data is requested only for the purposes listed in the last row of the table. Refusing any of these purposes does not limit access to the core features of the Service.</p>
                    <p><strong>3.4.</strong> We do not process special categories of personal data (health, racial or ethnic origin, religious and political views, biometric and genetic data). Please do not provide such information in your profile or messages.</p>
                    <p><strong>3.5.</strong> We do not use personal data for third-party advertising and do not sell it.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-4">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">04</span>Public information</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> The Service is an open amateur tennis rating. Therefore the following information about a user is visible to all visitors of the Site and the Application: first and last name, profile photo (if uploaded), category, rating position and points, match and tournament results, participation in battles.</p>
                    <p><strong>4.2.</strong> E-mail address, date of birth, payment details and technical data are not published. Phone and Telegram are shown to other users only where separate consent has been given.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-5">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">05</span>Automated decision-making</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Points, rating position and category (Futures, Challenger, Tour, Masters, Pro-Masters) are calculated automatically from match results in accordance with the KSLT Rules, section «Rating system», published on the Site. This determines the category of tournaments a user may enter.</p>
                    <p><strong>5.2.</strong> A user may request an explanation of how their points were calculated, dispute it with the tournament referee or with the KSLT administration, and object to automated processing (Article 84 of the Digital Code). The objection is decided by a KSLT officer.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-6">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">06</span>Who the data is shared with (processors and recipients)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> To operate the Service, KSLT entrusts the processing of data to the following persons (processors) or transfers data to the following recipients:</p>
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Party, location</th><th>Function</th><th>What data</th><th>Ground</th></tr></thead>
                            <tbody>
                                <tr>
                                    <td>Developers: Konstantin Khan and Tatiana Nechaeva, Kyrgyz Republic</td>
                                    <td>Development and technical support of the Site and the Application</td>
                                    <td>All Service data to the extent needed for support</td>
                                    <td>Contract No. 1 of 01.06.2026 (processing instruction, Article 86)</td>
                                </tr>
                                <tr>
                                    <td>Supabase Inc., USA (Amazon Web Services servers, region us-east-1 — Northern Virginia, USA)</td>
                                    <td>Database, authentication, backups</td>
                                    <td>All account data</td>
                                    <td>Supabase Terms of Service and Data Processing Agreement (DPA)</td>
                                </tr>
                                <tr>
                                    <td>Google LLC, USA</td>
                                    <td>Sign-in with Google (OAuth), Firebase Cloud Messaging push notifications, Google Analytics statistics</td>
                                    <td>Name, e-mail, Google photo; device token; anonymised visit data</td>
                                    <td>Google Terms and Google Ads Data Processing Terms</td>
                                </tr>
                                <tr>
                                    <td>Telegram Messenger Inc. / Telegram FZ-LLC, UAE</td>
                                    <td>Sign-in with Telegram, notifications via the Telegram bot</td>
                                    <td>Telegram ID, username, photo, notification texts</td>
                                    <td>Telegram Bot API Terms</td>
                                </tr>
                                <tr>
                                    <td>Resend Inc., USA</td>
                                    <td>Sending service e-mails</td>
                                    <td>E-mail, recipient name, message text</td>
                                    <td>Resend Terms of Service and DPA</td>
                                </tr>
                                <tr>
                                    <td>Contabo GmbH, Welfenstrasse 22, 81541 Munich, Germany; servers located in the USA (St. Louis, Missouri)</td>
                                    <td>Hosting of the Site</td>
                                    <td>IP address and technical request data</td>
                                    <td>Contabo Terms of Service and Privacy Policy</td>
                                </tr>
                                <tr>
                                    <td>Payment provider: DemirBank, Chuy Avenue 304, Bishkek, Kyrgyz Republic</td>
                                    <td>Accepting payments (once online payment is enabled)</td>
                                    <td>Amount, date, payment identifier</td>
                                    <td>Contract No. 1 of 02.11.2026</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p><strong>6.2.</strong> Each processor processes data only on the instruction of KSLT and for the stated purposes. KSLT is liable for the actions of processors as for its own (Article 38 of the Digital Code). The list of processors is updated when the composition changes.</p>
                    <p><strong>6.3.</strong> Data may also be provided to state authorities of the Kyrgyz Republic in the cases and in the manner established by law.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-7">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">07</span>Cross-border transfer</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> The servers of Supabase, Google, Resend and Contabo (hosting of the Site) are located in the USA, Telegram — in the UAE and other countries. Before any transfer, KSLT checks whether the country is included in the list of states providing adequate protection of personal data approved by the sectoral regulator (part 3 Article 89 of the Digital Code).</p>
                    <p><strong>7.2.</strong> If a country is not on the list, the transfer takes place because it is necessary for the conclusion and performance of the user agreement to which the user is a party (clause 4 part 4 Article 89), and on the terms of contracts with processors that ensure the protection of data (clause 6 part 4 Article 89). Transferred data is processed in accordance with the law of the recipient's country (part 5 Article 89).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-8">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">08</span>Retention periods</h2></summary>
                <div class="ip-rules-list">
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Data</th><th>Retention period</th></tr></thead>
                            <tbody>
                                <tr><td>Account data</td><td>While the account is active. After the account is deleted — 30 days (the deletion can be cancelled), then erased</td></tr>
                                <tr><td>Match and tournament results, rating history</td><td>Indefinitely as part of the tournament history; after the account is deleted — anonymised or with first and last name only in tournament protocols (clause 2 part 2 Article 83 — archival and statistical purposes)</td></tr>
                                <tr><td>Records of the conclusion and performance of the user agreement and of consents obtained</td><td>The term of the agreement and 3 years after its termination (part 4 Article 114 of the Digital Code)</td></tr>
                                <tr><td>Payment details</td><td>The period established by accounting legislation</td></tr>
                                <tr><td>Technical sign-in data</td><td>12 months</td></tr>
                                <tr><td>Enquiries and complaints</td><td>3 years after they are dealt with</td></tr>
                                <tr><td>Data processed on the basis of consent</td><td>Until consent is withdrawn or the account is deleted</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-9">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">09</span>User rights</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> A user has the right to:</p>
                    <ul class="ip-doc-list">
                        <li>obtain information about the processing of their data to the extent set out in part 1 Article 73 of the Digital Code;</li>
                        <li>obtain access to all of their data or a copy of it (part 4 Article 73);</li>
                        <li>correct or supplement their data (Article 75) — in the profile or upon request;</li>
                        <li>receive their data in a machine-readable format or require its transfer to another owner of records (Article 76);</li>
                        <li>require the deletion of data (Article 83), including deletion of the account (section 10);</li>
                        <li>object to processing by certain means or for certain purposes (Article 84);</li>
                        <li>require the restriction of processing while an objection is considered or data is corrected (Article 85);</li>
                        <li>withdraw any consent in the profile settings or by e-mail — as easily as it was given (part 5 Article 79);</li>
                        <li>refuse the Service and obtain information about their data (Article 118);</li>
                        <li>appeal against the actions of KSLT to the State Agency for Personal Data Protection under the Cabinet of Ministers of the Kyrgyz Republic or to a court.</li>
                    </ul>
                    <p><strong>9.2.</strong> Requests are sent to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> or through «Profile» → «My data» in the Application. To verify identity we may ask that the request be sent from the e-mail address registered to the account (part 2 Article 37).</p>
                    <p><strong>9.3.</strong> Response times: information about processing, access to data, correction and a decision on an objection — no more than 7 working days from receipt of the request. We notify of a restriction of processing or its lifting no later than the next working day. Deletion on the grounds of Article 83 is carried out without delay, subject to the 30-day period for cancelling deletion, unless the user has asked for immediate deletion.</p>
                    <p><strong>9.4.</strong> Refusal to provide the mandatory data (clause 3.2) means that registration and participation in the rating and tournaments will not be possible. Refusing consent for additional purposes has no consequences for the core features.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-10">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">10</span>Deleting an account</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>10.1.</strong> An account can be deleted in the Application (Profile → Settings → «Delete account»), on the Site (Profile → Settings) or by e-mail to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>. The detailed procedure is published at <a href="https://tennis.kg/pages/delete-account-en.html">tennis.kg/pages/delete-account-en.html</a>.</p>
                    <p><strong>10.2.</strong> After deletion the profile immediately stops being visible to other users. After 30 days personal data is erased permanently. Only the data listed in section 8 is kept, which KSLT is obliged or entitled to keep by law, of which the user is informed at the time of deletion (part 3 Article 118).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-11">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">11</span>Data protection</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>11.1.</strong> KSLT takes organisational and technical protection measures (Articles 78, 88 of the Digital Code): data transfer over HTTPS (TLS) only, row-level access control in the database (Row Level Security), storage of passwords as hashes, encryption of backups, limiting the number of people with access to data, logging of operations with personal records, training of staff and volunteers.</p>
                    <p><strong>11.2.</strong> In the event of a personal data breach, KSLT takes measures to remedy it and notifies affected users and the sectoral regulator in the manner established by law.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-12">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">12</span>Children</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>12.1.</strong> The Service is intended for persons aged 14 and over. Users aged 14 to 18 give consent to the processing of their data themselves (part 3 Article 81 of the Digital Code). Participation in tournaments is governed by the public offer.</p>
                    <p><strong>12.2.</strong> If we become aware that a child under 14 has registered without the consent of a legal representative, the account will be deleted. A legal representative may report this to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-13">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">13</span>Cookies and local storage</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>13.1.</strong> The Site uses browser local storage (localStorage) only to keep the user signed in and to store settings (language). Advertising and third-party tracking cookies are not used. Google Analytics collects anonymised statistics. It can be disabled with browser extensions.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-14">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">14</span>Changes to the Policy</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>14.1.</strong> We notify users of material changes to the Policy in the Application and by e-mail at least one month before the changes take effect. A new purpose of processing for which there is no ground under part 1 Article 79 is introduced only after the user's consent has been obtained (part 2 Article 78). The current and previous editions are available on the Site.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-15">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">15</span>Contacts</h2></summary>
                <div class="ip-rules-list">
                    <p>For all questions about the processing of personal data: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; postal address: Kyrgyz Republic, Bishkek, Sverdlovsky district, Chuy Avenue 127, apt. 26, KSLT Public Foundation.</p>
                </div>
            </details>

            <div class="ip-doc-sign ip-fade-in">
                <p class="ip-doc-sign-role">Chair of the Board of KSLT</p>
                <p class="ip-doc-sign-name">A. E. Chokoeva</p>
                <p class="ip-doc-revision">Edition of 3 November 2026. Approved by Order No. 1 of 3 November 2026.</p>
                <button type="button" class="ip-doc-print" data-doc-print>Print or save as PDF</button>
            </div>$kslt$,
        $kslt$            <!-- МАШИНАЛЫК КОТОРМО. Түп нуска — орус тилиндеги редакция, № 1 буйрук
                 менен бекитилген. Котормо эне тилинде сүйлөгөн адам тарабынан
                 текшерилген эмес. -->
            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">«КСЛТ» Коомдук фондунун жетекчисинин 2026-жылдын 3-ноябрындагы № 1 буйругу менен бекитилген.</p>
                <p class="ip-doc-approved-line">2026-жылдын 3-ноябрындагы редакциясы.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <p class="ip-doc-lead">Бул Саясат <a href="https://tennis.kg">tennis.kg</a> сайтынын жана «KSLT Tennis» мобилдик тиркемелеринин колдонуучуларынын жеке маалыматтарын иштетүү тартибин аныктайт. Толук тексти төмөндө келтирилген жана толугу менен колдонулат. Айырмачылык болгон учурда орус тилиндеги редакция колдонулат.</p>
            </div>

            <div class="ip-doc-gist ip-fade-in">
                <div class="ip-doc-gist-title">Кыскача эң негизгиси</div>
                <p class="ip-doc-gist-note">Бул окууга ыңгайлуу болушу үчүн кыскача баяндама. Ал документти алмаштырбайт: төмөндөгү толук текст колдонулат.</p>
                <ul class="ip-doc-gist-list">
                    <li><strong>Эмнени чогултабыз.</strong> Аты-жөнүн, электрондук почтаны, туулган күндү, жынысын — аларсыз рейтинг жүргүзүүгө жана торчолорду түзүүгө болбойт. Телефон жана сүрөт — каалоо боюнча.</li>
                    <li><strong>Эмне баарына көрүнөт.</strong> Аты-жөнү, сүрөтү, категориясы, рейтингдеги орду жана упайлары, оюндардын жыйынтыктары. Электрондук почта, туулган күн жана төлөмдөр эч качан жарыяланбайт.</li>
                    <li><strong>Телефон жана Telegram.</strong> Башка оюнчуларга профилде өзүңүз күйгүзгөн учурда гана көрүнөт, ошол эле жерден өчүрүлөт.</li>
                    <li><strong>Кимге беребиз.</strong> Supabase, Google, Telegram, Resend — база, кирүү, билдирүүлөр жана каттар иштеши үчүн. Маалыматтар сатылбайт жана бөтөн жарнамага колдонулбайт.</li>
                    <li><strong>Аккаунтту өчүрүү.</strong> Профилде же кат менен. Кайтаруу үчүн 30 күн, андан кийин биротоло; мелдештердин жыйынтыктары протоколдордо калат.</li>
                    <li><strong>Сиздин укуктарыңыз.</strong> Маалыматыңызды алуу, оңдоо, көчүрмөсүн алуу, макулдукту кайтарып алуу, каршы пикир билдирүү, жөнгө салуучуга даттануу. Жооп — 7 жумуш күнүнө чейин.</li>
                </ul>
            </div>

            <div class="ip-toc ip-fade-in">
                <div class="ip-toc-title">Мазмуну</div>
                <ol class="ip-toc-list">
                    <li><a href="#pp-1">Жалпы жоболор</a></li>
                    <li><a href="#pp-2">Жеке жазуулардын ээси жөнүндө маалымат</a></li>
                    <li><a href="#pp-3">Кандай маалыматтарды иштетебиз, эмне үчүн жана кандай негизде</a></li>
                    <li><a href="#pp-4">Ачык маалымат</a></li>
                    <li><a href="#pp-5">Автоматтык чечим кабыл алуу</a></li>
                    <li><a href="#pp-6">Маалыматтар кимге берилет</a></li>
                    <li><a href="#pp-7">Чек ара аркылуу берүү</a></li>
                    <li><a href="#pp-8">Сактоо мөөнөттөрү</a></li>
                    <li><a href="#pp-9">Колдонуучунун укуктары</a></li>
                    <li><a href="#pp-10">Аккаунтту өчүрүү</a></li>
                    <li><a href="#pp-11">Маалыматтарды коргоо</a></li>
                    <li><a href="#pp-12">Балдар</a></li>
                    <li><a href="#pp-13">Cookie жана жергиликтүү сактагыч</a></li>
                    <li><a href="#pp-14">Саясатты өзгөртүү</a></li>
                    <li><a href="#pp-15">Байланыш</a></li>
                </ol>
                <button type="button" class="ip-doc-expand" data-doc-expand>Бардык бөлүмдөрдү ачуу</button>
            </div>

            <details class="ip-doc-fold ip-fade-in" id="pp-1">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">01</span>Жалпы жоболор</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>1.1.</strong> Бул Саясат «Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду (мындан ары — КСЛТ, «биз») колдонуучулардын кайсы жеке маалыматтарын, кандай максаттарда жана кандай негиздерде иштетерин, алар кимге берилерин, канча убакыт сакталарын жана колдонуучулардын кандай укуктары бар экенин аныктайт. Саясат <a href="https://tennis.kg">tennis.kg</a> сайтына (мындан ары — Сайт), Android жана iOS үчүн «KSLT Tennis» мобилдик тиркемелерине (мындан ары — Тиркеме) жана алар менен байланышкан кызматтарга: рейтингге, мелдештерге, баттлдарга, өнөктөш издөөгө, корттордун жана машыктыруучулардын каталогдоруна, жаңылыктарга, Telegram ботуна жана таркатууларга (чогуусу менен — Кызмат) колдонулат.</p>
                    <p><strong>1.2.</strong> Саясат Кыргыз Республикасынын 2025-жылдын 31-июлундагы № 178 Санариптик кодексине (мындан ары — Санариптик кодекс), анын ичинде «Жеке маалыматтарды иштетүү» 11-главасына, 33, 44, 73–89 жана 114–120-беренелерине ылайык иштелип чыккан. 2026-жылдын 5-февралынан тартып Санариптик кодекс Кыргыз Республикасынын «Жеке мүнөздөгү маалымат жөнүндө» Мыйзамын алмаштырды.</p>
                    <p><strong>1.3.</strong> Терминдер Санариптик кодексте белгиленген маанилерде колдонулат. Жеке маалыматтар — алар боюнча аныкталышы мүмкүн болгон жеке адам жөнүндө маалыматты камтыган санариптик маалыматтар. Иштетүү — маалыматтар менен жасалган ар кандай аракет: чогултуу, жазуу, сактоо, өзгөртүү, колдонуу, берүү, ээсиздендирүү, өчүрүү жана башкалар. Колдонуучу — Кызматты колдонгон жеке адам (жеке маалыматтардын субъекти).</p>
                    <p><strong>1.4.</strong> КСЛТ жеке жазуулардын ээси, башкача айтканда Кызматтын колдонуучуларынын жеке маалыматтарын иштетүүнүн максаттарын жана ыкмаларын аныктоочу жак болуп саналат.</p>
                    <p><strong>1.5.</strong> Саясат катталганга чейин жана андан кийин каалаган убакта жеткиликтүү: Сайтта, Тиркемеде («Профиль» → «Документтер») жана Тиркеменин Google Play жана App Store барактарында. Аны сактап алууга жана басып чыгарууга болот.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-2">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">02</span>Жеке жазуулардын ээси жөнүндө маалымат</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>Толук аталышы:</strong> «Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду</p>
                    <p><strong>Каттоо номери:</strong> 197575-3301-ОФ (Юридикалык жактардын бирдиктүү мамлекеттик реестри, Чүй-Бишкек юстиция башкармалыгы, алгачкы каттоо күнү 19.05.2021)</p>
                    <p><strong>ИНН:</strong> 01905202110030; ОКПО коду: 31147180</p>
                    <p><strong>Юридикалык дареги:</strong> Кыргыз Республикасы, Бишкек шаары, Свердлов району, Чүй проспекти, 127, 26-батир</p>
                    <p><strong>Жетекчиси:</strong> Чокоева Айсулуу Эриковна</p>
                    <p><strong>Электрондук почта:</strong> <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; телефон / WhatsApp: +996 555 777703</p>
                    <p><strong>Жеке маалыматтарды иштетүү үчүн жооптуу адам:</strong> Константин Хан, жеке маалыматтар боюнча кайрылуулар үчүн электрондук почта: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> (каттын темасы «Жеке маалыматтар»).</p>
                    <p><strong>Жеке маалыматтарды иштетүү орду:</strong> Кыргыз Республикасы (КСЛТ) жана 6-бөлүмдө көрсөтүлгөн иштетүүчүлөрдүн серверлери (анын ичинде Кыргыз Республикасынан тышкары).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-3">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">03</span>Кандай маалыматтарды иштетебиз, эмне үчүн жана кандай негизде</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Биз көрсөтүлгөн максаттар үчүн керектүү маалыматтарды гана иштетебиз (минималдаштыруу принциби, Санариптик кодекстин 78-беренеси). Маалыматтардын тизмеси, максаттары жана иштетүү негиздери таблицада келтирилген.</p>
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Максаты</th><th>Маалыматтар</th><th>Негизи (Санариптик кодекстин 79-беренеси)</th></tr></thead>
                            <tbody>
                                <tr>
                                    <td>Каттоо, кирүү, аккаунтту жүргүзүү, сырсөздү калыбына келтирүү</td>
                                    <td>Аты, фамилиясы, электрондук почта дареги, сырсөз (bcrypt хеши түрүндө гана сакталат), туулган күнү, жынысы; Google аркылуу киргенде — аты, e-mail, Google профилинин сүрөтү; Telegram аркылуу киргенде — Telegram ID, колдонуучунун аты, сүрөтү</td>
                                    <td>Колдонуучу макулдашуусун аткаруу (1-бөлүктүн 1-пункту)</td>
                                </tr>
                                <tr>
                                    <td>Рейтинг жүргүзүү, мелдештерге жана баттлдарга катышуу, торчолорду түзүү, жыйынтыктарды жарыялоо</td>
                                    <td>Аты, фамилиясы, жынысы, жаш тобу, категориясы (тур), упайлары, оюндардын жыйынтыктары, жеңиштердин жана жеңилүүлөрдүн статистикасы, мелдештердин тарыхы</td>
                                    <td>Колдонуучу макулдашуусун жана ачык офертаны аткаруу (1-бөлүктүн 1-пункту)</td>
                                </tr>
                                <tr>
                                    <td>Мүчөлүк жана кызматтарды төлөө</td>
                                    <td>Төлөмдүн суммасы, күнү жана ыкмасы, мүчөлүк мезгили, взносторддун абалы. Банк карталарынын маалыматтарын КСЛТ албайт жана сактабайт</td>
                                    <td>Келишимди аткаруу (1-бөлүктүн 1-пункту); бухгалтердик эсеп боюнча милдеттерди аткаруу (1-бөлүктүн 2-пункту)</td>
                                </tr>
                                <tr>
                                    <td>Аккаунттун коопсуздугу (жаңы түзмөктөн киргени жөнүндө билдирүү, бузуудан коргоо)</td>
                                    <td>Браузердин user-agent хеши, экрандын чечилиши, акыркы кирүүнүн убактысы, IP-дарек</td>
                                    <td>КСЛТнин жана колдонуучунун аккаунтту коргоодогу мыйзамдуу кызыкчылыгы (1-бөлүктүн 5-пункту)</td>
                                </tr>
                                <tr>
                                    <td>Мелдештер, арыздар, оюндар, документтердин өзгөрүшү жөнүндө кызматтык билдирүүлөр</td>
                                    <td>Электрондук почта дареги, Telegram ID, түзмөктүн push-билдирүү токени</td>
                                    <td>Макулдашууну аткаруу (1-бөлүктүн 1-пункту); байланыш маалыматтарына билдирүү жөнөтүү үчүн — колдонуучунун макулдугу (44-берене)</td>
                                </tr>
                                <tr>
                                    <td>Кайрылууларды, даттанууларды жана талаш-тартыштарды кароо</td>
                                    <td>Кайрылууда көрсөтүлгөн маалыматтар, кат алышуу, талаштуу кырдаал жөнүндө маалымат</td>
                                    <td>Санариптик кодекстин 119-беренеси боюнча милдеттерди аткаруу (1-бөлүктүн 2-пункту)</td>
                                </tr>
                                <tr>
                                    <td>Кирүүлөрдүн статистикасы жана Кызматты жакшыртуу</td>
                                    <td>Google Analytics'тин ээсиздендирилген маалыматтары (барактар, түзмөк, IP боюнча болжолдуу жайгашуу)</td>
                                    <td>КСЛТнин мыйзамдуу кызыкчылыгы (1-бөлүктүн 5-пункту); 50-берене (ээсиздендирилген жазуулар)</td>
                                </tr>
                                <tr>
                                    <td>Кошумча максаттар: «Оюнчу издөө» бөлүмүндө телефонду/Telegram'ды көрсөтүү, мелдештердин сүрөттөрүн жана видеолорун КСЛТнин социалдык тармактарында жарыялоо, жаңылык жана жарнама таркатуулары</td>
                                    <td>Жеке маалыматтарды иштетүүгө Макулдукта көрсөтүлгөн</td>
                                    <td>Ар бир максат боюнча колдонуучунун өзүнчө ыктыярдуу макулдугу (79-берененин 2-бөлүгү)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p><strong>3.2.</strong> Каттоо үчүн аты, фамилиясы, электрондук почта дареги, туулган күнү жана жынысы милдеттүү. Аларсыз аккаунт түзүүгө, рейтинг жүргүзүүгө жана категориялар боюнча торчолорду түзүүгө болбойт. Телефон номери жана профилдин сүрөтү каалоо боюнча көрсөтүлөт.</p>
                    <p><strong>3.3.</strong> Жеке маалыматтарды иштетүүгө макулдук таблицанын акыркы сабында көрсөтүлгөн максаттар үчүн гана суралат. Бул максаттардын кайсынысынан болбосун баш тартуу Кызматтын негизги функцияларына жетүүнү чектебейт.</p>
                    <p><strong>3.4.</strong> Биз жеке маалыматтардын өзгөчө категорияларын (ден соолук, расалык же этникалык таандыктык, диний жана саясий көз караштар, биометрикалык жана генетикалык маалыматтар) иштетпейбиз. Мындай маалыматтарды профилде жана билдирүүлөрдө көрсөтпөңүз.</p>
                    <p><strong>3.5.</strong> Биз жеке маалыматтарды үчүнчү жактардын жарнамасы үчүн колдонбойбуз жана аларды сатпайбыз.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-4">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">04</span>Ачык маалымат</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> Кызмат — ышкыбоз теннистин ачык рейтинги. Ошондуктан колдонуучу жөнүндө төмөнкү маалыматтар Сайттын жана Тиркеменин бардык конокторуна көрүнөт: аты жана фамилиясы, профилдин сүрөтү (жүктөлгөн болсо), категориясы, рейтингдеги орду жана упайлары, оюндардын жана мелдештердин жыйынтыктары, баттлдарга катышуусу.</p>
                    <p><strong>4.2.</strong> Электрондук почта дареги, туулган күнү, төлөм маалыматтары жана техникалык маалыматтар жарыяланбайт. Телефон жана Telegram башка колдонуучуларга өзүнчө макулдук болгондо гана көрсөтүлөт.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-5">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">05</span>Автоматтык чечим кабыл алуу</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> Упайлар, рейтингдеги орун жана категория (Futures, Challenger, Tour, Masters, Pro-Masters) Сайтта жарыяланган КСЛТнин Эрежелеринин «Рейтинг системасы» бөлүмүнө ылайык оюндардын жыйынтыктары боюнча автоматтык түрдө эсептелет. Колдонуучу кайсы категориядагы мелдештерге катыша аларын ушул аныктайт.</p>
                    <p><strong>5.2.</strong> Колдонуучу өзүнүн упайларынын эсебин түшүндүрүүнү суроого, аны мелдештин башкы судьясында же КСЛТнин администрациясында талашууга, ошондой эле автоматтык иштетүүгө каршы пикир билдирүүгө укуктуу (Санариптик кодекстин 84-беренеси). Каршы пикир боюнча чечимди КСЛТнин кызматкери кабыл алат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-6">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">06</span>Маалыматтар кимге берилет (иштетүүчүлөр жана алуучулар)</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Кызматтын иштеши үчүн КСЛТ маалыматтарды иштетүүнү төмөнкү жактарга (иштетүүчүлөргө) тапшырат же маалыматтарды төмөнкү алуучуларга берет:</p>
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Жак, жайгашкан жери</th><th>Функциясы</th><th>Кандай маалыматтар</th><th>Негизи</th></tr></thead>
                            <tbody>
                                <tr>
                                    <td>Иштеп чыгуучулар: Константин Хан жана Татьяна Нечаева, Кыргыз Республикасы</td>
                                    <td>Сайтты жана Тиркемени иштеп чыгуу жана техникалык колдоо</td>
                                    <td>Колдоо үчүн керектүү көлөмдө Кызматтын бардык маалыматтары</td>
                                    <td>01.06.2026-жылдагы № 1 келишим (иштетүүгө тапшырма, 86-берене)</td>
                                </tr>
                                <tr>
                                    <td>Supabase Inc., АКШ (Amazon Web Services серверлери, us-east-1 региону — Түндүк Вирджиния, АКШ)</td>
                                    <td>Маалыматтар базасы, аутентификация, резервдик көчүрмөлөр</td>
                                    <td>Аккаунттардын бардык маалыматтары</td>
                                    <td>Supabase'тин тейлөө шарттары жана маалыматтарды иштетүү келишими (DPA)</td>
                                </tr>
                                <tr>
                                    <td>Google LLC, АКШ</td>
                                    <td>Google аркылуу кирүү (OAuth), Firebase Cloud Messaging push-билдирүүлөрү, Google Analytics статистикасы</td>
                                    <td>Аты, e-mail, Google сүрөтү; түзмөктүн токени; кирүүлөрдүн ээсиздендирилген маалыматтары</td>
                                    <td>Google'дун шарттары жана Google Ads Data Processing Terms</td>
                                </tr>
                                <tr>
                                    <td>Telegram Messenger Inc. / Telegram FZ-LLC, БАЭ</td>
                                    <td>Telegram аркылуу кирүү, Telegram бот аркылуу билдирүүлөр</td>
                                    <td>Telegram ID, колдонуучунун аты, сүрөтү, билдирүүлөрдүн тексттери</td>
                                    <td>Telegram Bot API шарттары</td>
                                </tr>
                                <tr>
                                    <td>Resend Inc., АКШ</td>
                                    <td>Кызматтык каттарды жөнөтүү</td>
                                    <td>E-mail, алуучунун аты, каттын тексти</td>
                                    <td>Resend'дин тейлөө шарттары жана DPA</td>
                                </tr>
                                <tr>
                                    <td>Contabo GmbH, Вельфенштрассе 22, 81541 Мюнхен, Германия; серверлер АКШда (Сент-Луис, Миссури штаты) жайгашкан</td>
                                    <td>Сайттын хостинги</td>
                                    <td>IP-дарек жана суроо-талаптын техникалык маалыматтары</td>
                                    <td>Contabo'нун тейлөө шарттары жана купуялык саясаты</td>
                                </tr>
                                <tr>
                                    <td>Төлөм провайдери: ДемирБанк, Чүй проспекти, 304, Бишкек, Кыргыз Республикасы</td>
                                    <td>Төлөмдөрдү кабыл алуу (онлайн төлөм кошулгандан кийин)</td>
                                    <td>Сумма, күнү, төлөмдүн идентификатору</td>
                                    <td>02.11.2026-жылдагы № 1 келишим</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p><strong>6.2.</strong> Ар бир иштетүүчү маалыматтарды КСЛТнин тапшырмасы боюнча жана көрсөтүлгөн максаттарда гана иштетет. КСЛТ иштетүүчүлөрдүн аракеттери үчүн өзүнүкүндөй жооп берет (Санариптик кодекстин 38-беренеси). Иштетүүчүлөрдүн тизмеси курам өзгөргөндө жаңыртылат.</p>
                    <p><strong>6.3.</strong> Маалыматтар ошондой эле мыйзамда белгиленген учурларда жана тартипте Кыргыз Республикасынын мамлекеттик органдарына берилиши мүмкүн.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-7">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">07</span>Чек ара аркылуу берүү</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Supabase, Google, Resend жана Contabo'нун (Сайттын хостинги) серверлери АКШда, Telegram — БАЭде жана башка өлкөлөрдө жайгашкан. Берүүдөн мурун КСЛТ тармактык жөнгө салуучу тарабынан бекитилген жеке маалыматтарды адекваттуу коргоону камсыз кылган мамлекеттердин тизмесине өлкө киргизилгенин текшерет (Санариптик кодекстин 89-беренесинин 3-бөлүгү).</p>
                    <p><strong>7.2.</strong> Эгерде мамлекет тизмеге киргизилбесе, берүү колдонуучу тарап болгон колдонуучу макулдашуусун түзүү жана аткаруу үчүн зарыл болгондуктан (89-берененин 4-бөлүгүнүн 4-пункту) жана маалыматтарды коргоону камсыз кылган иштетүүчүлөр менен түзүлгөн келишимдердин шарттарында (89-берененин 4-бөлүгүнүн 6-пункту) жүргүзүлөт. Берилген маалыматтар алуучунун өлкөсүнүн мыйзамдарына ылайык иштетилет (89-берененин 5-бөлүгү).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-8">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">08</span>Сактоо мөөнөттөрү</h2></summary>
                <div class="ip-rules-list">
                    <div class="ip-doc-table-wrap">
                        <table class="ip-doc-table">
                            <thead><tr><th>Маалыматтар</th><th>Сактоо мөөнөтү</th></tr></thead>
                            <tbody>
                                <tr><td>Аккаунттун маалыматтары</td><td>Аккаунт колдонулуп турганда. Аккаунт өчүрүлгөндөн кийин — 30 күн (өчүрүүнү жокко чыгаруу мүмкүнчүлүгү), андан кийин жок кылынат</td></tr>
                                <tr><td>Оюндардын жана мелдештердин жыйынтыктары, рейтингдин тарыхы</td><td>Мелдеш тарыхынын курамында мөөнөтсүз; аккаунт өчүрүлгөндөн кийин — ээсиздендирилген түрдө же мелдештердин протоколдорунда аты-жөнү гана көрсөтүлүп (83-берененин 2-бөлүгүнүн 2-пункту — архивдик жана статистикалык максаттар)</td></tr>
                                <tr><td>Колдонуучу макулдашуусун түзүү жана аткаруу, алынган макулдуктар жөнүндө жазуулар</td><td>Макулдашуунун мөөнөтү жана ал токтотулгандан кийин 3 жыл (Санариптик кодекстин 114-беренесинин 4-бөлүгү)</td></tr>
                                <tr><td>Төлөм маалыматтары</td><td>Бухгалтердик эсеп жөнүндө мыйзамдарда белгиленген мөөнөт</td></tr>
                                <tr><td>Кирүүлөр жөнүндө техникалык маалыматтар</td><td>12 ай</td></tr>
                                <tr><td>Кайрылуулар жана даттануулар</td><td>Каралгандан кийин 3 жыл</td></tr>
                                <tr><td>Макулдук боюнча иштетилген маалыматтар</td><td>Макулдук кайтарылып алынганга же аккаунт өчүрүлгөнгө чейин</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-9">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">09</span>Колдонуучунун укуктары</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>9.1.</strong> Колдонуучу төмөнкүлөргө укуктуу:</p>
                    <ul class="ip-doc-list">
                        <li>Санариптик кодекстин 73-беренесинин 1-бөлүгүндөгү көлөмдө өз маалыматтарын иштетүү жөнүндө маалымат алууга;</li>
                        <li>өз маалыматтарынын баарына же алардын көчүрмөсүнө жетүүгө (73-берененин 4-бөлүгү);</li>
                        <li>өз маалыматтарын оңдоого же толуктоого (75-берене) — профилде өз алдынча же суроо-талап боюнча;</li>
                        <li>өз маалыматтарын машина окуй турган форматта алууга же аларды башка жазуу ээсине берүүнү талап кылууга (76-берене);</li>
                        <li>маалыматтарды жок кылууну талап кылууга (83-берене), анын ичинде аккаунтту өчүрүүгө (10-бөлүм);</li>
                        <li>белгилүү ыкмалар менен же белгилүү максаттарда иштетүүгө каршы пикир билдирүүгө (84-берене);</li>
                        <li>каршы пикир каралып жатканда же маалыматтар оңдолуп жатканда иштетүүнү чектөөнү талап кылууга (85-берене);</li>
                        <li>каалаган макулдукту профилдин жөндөөлөрүндө же кат менен кайтарып алууга — ал берилгендей эле жөнөкөй (79-берененин 5-бөлүгү);</li>
                        <li>Кызматтан баш тартууга жана өз маалыматтары жөнүндө маалымат алууга (118-берене);</li>
                        <li>КСЛТнин аракеттерине Кыргыз Республикасынын Министрлер Кабинетине караштуу Жеке маалыматтарды коргоо боюнча мамлекеттик агенттикке же сотко даттанууга.</li>
                    </ul>
                    <p><strong>9.2.</strong> Суроо-талаптар <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дарегине же Тиркемедеги «Профиль» → «Менин маалыматтарым» бөлүмү аркылуу жөнөтүлөт. Инсандыгын ырастоо үчүн биз суроо-талапты аккаунтта көрсөтүлгөн электрондук почта дарегинен жөнөтүүнү сурашыбыз мүмкүн (37-берененин 2-бөлүгү).</p>
                    <p><strong>9.3.</strong> Жооп берүү мөөнөттөрү: иштетүү жөнүндө маалымат, маалыматтарга жетүү, оңдоо, каршы пикир боюнча чечим — суроо-талап алынган күндөн тартып 7 жумуш күнүнөн ашпайт. Иштетүүнүн чектелгени же чектөөнүн алынганы жөнүндө кийинки жумуш күнүнөн кечиктирбей билдиребиз. 83-берененин негиздери боюнча жок кылуу токтоосуз жүргүзүлөт, эгерде колдонуучу дароо өчүрүүнү сурабаса, өчүрүүнү жокко чыгаруунун 30 күндүк мөөнөтү эске алынат.</p>
                    <p><strong>9.4.</strong> Милдеттүү маалыматтарды берүүдөн баш тартуу (3.2-пункт) катталууга жана рейтингге, мелдештерге катышууга мүмкүн болбой турганын билдирет. Кошумча максаттарга макулдуктан баш тартуу негизги функцияларга таасир этпейт.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-10">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">10</span>Аккаунтту өчүрүү</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>10.1.</strong> Аккаунтту Тиркемеде (Профиль → Жөндөөлөр → «Аккаунтту өчүрүү»), Сайтта (Профиль → Жөндөөлөр) же <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дарегине кат жөнөтүү менен өчүрүүгө болот. Толук тартиби <a href="https://tennis.kg/pages/delete-account-kg.html">tennis.kg/pages/delete-account-kg.html</a> барагында жарыяланган.</p>
                    <p><strong>10.2.</strong> Өчүрүлгөндөн кийин профиль дароо башка колдонуучуларга көрүнбөй калат. 30 күндөн кийин жеке маалыматтар биротоло жок кылынат. КСЛТ мыйзам боюнча сактоого милдеттүү же укуктуу болгон, 8-бөлүмдө көрсөтүлгөн маалыматтар гана сакталат, бул жөнүндө колдонуучуга өчүрүүдө билдирилет (118-берененин 3-бөлүгү).</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-11">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">11</span>Маалыматтарды коргоо</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>11.1.</strong> КСЛТ уюштуруучулук жана техникалык коргоо чараларын көрөт (Санариптик кодекстин 78, 88-беренелери): маалыматтарды HTTPS (TLS) аркылуу гана берүү, маалыматтар базасынын саптар деңгээлинде жетүүнү бөлүштүрүү (Row Level Security), сырсөздөрдү хеш түрүндө сактоо, резервдик көчүрмөлөрдү шифрлөө, маалыматтарга жетүүчү адамдардын чөйрөсүн чектөө, жеке жазуулар менен жасалган иштерди эсепке алуу, кызматкерлерди жана ыктыярчыларды окутуу.</p>
                    <p><strong>11.2.</strong> Жеке маалыматтар агып чыккан учурда КСЛТ аны жоюу боюнча чараларды көрөт жана мыйзамдарда белгиленген тартипте жабыркаган колдонуучуларга жана тармактык жөнгө салуучуга билдирет.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-12">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">12</span>Балдар</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>12.1.</strong> Кызмат 14 жаштан жогорку адамдарга арналган. 14төн 18 жашка чейинки колдонуучулар өз маалыматтарын иштетүүгө макулдукту өз алдынча беришет (Санариптик кодекстин 81-беренесинин 3-бөлүгү). Мелдештерге катышуу — ачык офертанын шарттары боюнча.</p>
                    <p><strong>12.2.</strong> Эгерде мыйзамдуу өкүлүнүн макулдугусуз 14 жашка толо элек бала катталганы бизге белгилүү болсо, аккаунт өчүрүлөт. Мыйзамдуу өкүл бул жөнүндө <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дарегине билдире алат.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-13">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">13</span>Cookie жана жергиликтүү сактагыч</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>13.1.</strong> Сайт браузердин жергиликтүү сактагычын (localStorage) аккаунтка кирүүнү жана жөндөөлөрдү (тил) сактоо үчүн гана колдонот. Жарнамалык жана үчүнчү тараптын көзөмөлдөөчү cookie файлдары колдонулбайт. Google Analytics ээсиздендирилген статистиканы чогултат. Аны браузердин кеңейтүүлөрү менен өчүрүүгө болот.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-14">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">14</span>Саясатты өзгөртүү</h2></summary>
                <div class="ip-rules-list">
                    <p><strong>14.1.</strong> Саясаттагы олуттуу өзгөртүүлөр жөнүндө биз колдонуучуларга Тиркемеде жана электрондук почта аркылуу өзгөртүүлөр күчүнө киргенге чейин кеминде бир ай мурун билдиребиз. 79-берененин 1-бөлүгү боюнча негизи жок жаңы иштетүү максаты колдонуучунун макулдугу алынгандан кийин гана киргизилет (78-берененин 2-бөлүгү). Колдонуудагы жана мурунку редакциялар Сайтта жеткиликтүү.</p>
                </div>
            </details>

            <details class="ip-doc-fold ip-fade-in" id="pp-15">
                <summary class="ip-doc-fold-head"><h2 class="ip-rules-section-title"><span class="ip-rules-section-num">15</span>Байланыш</h2></summary>
                <div class="ip-rules-list">
                    <p>Жеке маалыматтарды иштетүү боюнча бардык суроолор: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a>; почта дареги: Кыргыз Республикасы, Бишкек шаары, Свердлов району, Чүй проспекти, 127, 26-батир, «КСЛТ» Коомдук фонду.</p>
                </div>
            </details>

            <div class="ip-doc-sign ip-fade-in">
                <p class="ip-doc-sign-role">КСЛТнин Башкармалыгынын Төрагасы</p>
                <p class="ip-doc-sign-name">Чокоева А. Э.</p>
                <p class="ip-doc-revision">2026-жылдын 3-ноябрындагы редакциясы. 2026-жылдын 3-ноябрындагы № 1 буйругу менен бекитилген.</p>
                <button type="button" class="ip-doc-print" data-doc-print>Басып чыгаруу же PDF сактоо</button>
            </div>$kslt$)
ON CONFLICT (slug) DO UPDATE SET
    body    = EXCLUDED.body,
    body_en = EXCLUDED.body_en,
    body_kg = EXCLUDED.body_kg,
    title    = COALESCE(public.site_documents.title,    EXCLUDED.title),
    title_en = COALESCE(public.site_documents.title_en, EXCLUDED.title_en),
    title_kg = COALESCE(public.site_documents.title_kg, EXCLUDED.title_kg);

-- ---- delete-account ----------------------------------------------------
INSERT INTO public.site_documents (slug, title, title_en, title_kg, body, body_en, body_kg)
VALUES ('delete-account',
        'Удаление аккаунта', 'Account deletion', 'Аккаунтту өчүрүү',
        $kslt$            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">Редакция от 3 ноября 2026 г.</p>
                <p class="ip-doc-approved-line">Эта страница открывается без входа в аккаунт. Её адрес указывается в Google Play Console («Безопасность данных» → «Удаление аккаунта») и в App Store Connect.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Кто удаляет данные
                </h2>
                <div class="ip-rules-list">
                    <p>Общественный фонд «Кыргызстанское сообщество любителей тенниса» (рег. № 197575-3301-ОФ, г. Бишкек, пр. Чуй, 127, кв. 26), владелец сайта <a href="https://tennis.kg">tennis.kg</a> и приложений «KSLT Tennis» для Android и iOS.</p>
                    <p>Вопросы: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a></p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Как удалить аккаунт
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> <strong>В приложении:</strong> Профиль → Настройки → «Удалить аккаунт» → подтвердите удаление.</p>
                    <p><strong>2.2.</strong> <strong>На сайте:</strong> войдите в <a href="dashboard.html">личный кабинет</a> → Настройки → «Удалить аккаунт» и подтвердите в появившемся окне.</p>
                    <p><strong>2.3.</strong> <strong>Без входа в аккаунт:</strong> напишите на <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> с адреса, указанного в учётной записи, тема «Удаление аккаунта». Мы удалим аккаунт в течение 7 рабочих дней и сообщим об этом.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Что происходит сразу
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Профиль перестаёт быть виден другим пользователям, аккаунт скрывается из общих списков в тот же момент.</p>
                    <p><strong>3.2.</strong> Вход в аккаунт блокируется, рассылки прекращаются.</p>
                    <p><strong>3.3.</strong> Тридцать дней аккаунт можно вернуть: просто войдите, и мы предложим восстановить. Пока срок не вышел, ничего не стирается безвозвратно.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    Что удаляется через 30 дней
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> <strong>Учётная запись входа</strong> — имя и фамилия в профиле, почта, дата рождения, пол, телефон, фото, пароль и привязки Google и Telegram.</p>
                    <p><strong>4.2.</strong> <strong>Токены уведомлений и технические данные о входах.</strong></p>
                    <p><strong>4.3.</strong> <strong>Баллы лояльности и выданные скидки.</strong></p>
                    <p><strong>4.4.</strong> <strong>Настройки уведомлений и все согласия.</strong></p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Что остаётся и почему
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> <strong>Карточка игрока с результатами матчей и набранными очками остаётся.</strong> Эти результаты принадлежат турнирам, в которых вы играли: они часть истории чужих матчей, сеток и рейтинга, и стереть их значило бы изменить итоги прошедших соревнований. В турнирной истории они хранятся в обезличенном виде или только с именем и фамилией в протоколах турниров (архивные и статистические цели, п. 2 ч. 2 ст. 83 Цифрового кодекса КР).</p>
                    <p><strong>5.2.</strong> Связи с учётной записью у карточки больше нет — на ней появляется метка «Аккаунт удалён».</p>
                    <p><strong>5.3.</strong> <strong>Записи о принятии Пользовательского соглашения и согласий</strong> — 3 года после удаления (ч. 4 ст. 114 Цифрового кодекса КР).</p>
                    <p><strong>5.4.</strong> <strong>Сведения о платежах</strong> — в течение срока, установленного законодательством о бухгалтерском учёте.</p>
                    <p><strong>5.5.</strong> Фамилия, имя и почта остаются в служебном журнале удалённых: по нему клуб может ответить, если вы вернётесь с вопросом о своём аккаунте.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">06</span>
                    Как вернуть в течение 30 дней
                </h2>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Войдите тем же способом, которым входили раньше.</p>
                    <p><strong>6.2.</strong> Мы покажем предложение восстановить аккаунт — подтвердите, и всё вернётся: рейтинг, баллы и настройки.</p>
                    <p><strong>6.3.</strong> После тридцати дней восстановить нельзя.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">07</span>
                    Удалить не всё, а часть
                </h2>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Отдельные данные — фото, телефон, ссылки на соцсети — можно убрать в <a href="dashboard.html">личном кабинете</a>, не удаляя аккаунт.</p>
                    <p><strong>7.2.</strong> Там же выключается показ телефона и Telegram другим игрокам.</p>
                </div>
            </div>$kslt$,
        $kslt$            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">Edition of 3 November 2026.</p>
                <p class="ip-doc-approved-line">This page opens without signing in. Its address is given in Google Play Console («Data safety» → «Account deletion») and in App Store Connect.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Who deletes the data
                </h2>
                <div class="ip-rules-list">
                    <p>The Public Foundation «Kyrgyzstan Community of Tennis Enthusiasts» (reg. No. 197575-3301-ОФ, Bishkek, Chuy Avenue 127, apt. 26), owner of the <a href="https://tennis.kg">tennis.kg</a> website and of the «KSLT Tennis» applications for Android and iOS.</p>
                    <p>Questions: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a></p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    How to delete your account
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> <strong>In the app:</strong> Profile → Settings → «Delete account» → confirm the deletion.</p>
                    <p><strong>2.2.</strong> <strong>On the website:</strong> sign in to your <a href="dashboard-en.html">account area</a> → Settings → «Delete account» and confirm in the dialog.</p>
                    <p><strong>2.3.</strong> <strong>Without signing in:</strong> write to <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> from the address registered to the account, subject «Account deletion». We will delete the account within 7 working days and confirm it.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    What happens immediately
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> The profile stops being visible to other users and disappears from public lists at once.</p>
                    <p><strong>3.2.</strong> Signing in is blocked and mailings stop.</p>
                    <p><strong>3.3.</strong> For thirty days the account can be restored: just sign in and we will offer to bring it back. Until that period ends, nothing is erased permanently.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    What is deleted after 30 days
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> <strong>The sign-in account</strong> — first and last name in the profile, e-mail, date of birth, gender, phone, photo, password and the Google and Telegram links.</p>
                    <p><strong>4.2.</strong> <strong>Notification tokens and technical sign-in data.</strong></p>
                    <p><strong>4.3.</strong> <strong>Loyalty points and issued discounts.</strong></p>
                    <p><strong>4.4.</strong> <strong>Notification settings and all consents.</strong></p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    What remains and why
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> <strong>The player card with match results and points earned remains.</strong> Those results belong to the tournaments you played in: they are part of the history of other people's matches, draws and the rating, and erasing them would change the outcome of past competitions. In the tournament history they are kept anonymised or with first and last name only in tournament protocols (archival and statistical purposes, clause 2 part 2 Article 83 of the Digital Code of the KR).</p>
                    <p><strong>5.2.</strong> The card is no longer linked to the account — it is marked «Account deleted».</p>
                    <p><strong>5.3.</strong> <strong>Records of acceptance of the User Agreement and of consents</strong> — 3 years after deletion (part 4 Article 114 of the Digital Code of the KR).</p>
                    <p><strong>5.4.</strong> <strong>Payment details</strong> — for the period established by accounting legislation.</p>
                    <p><strong>5.5.</strong> Last name, first name and e-mail remain in the internal log of deleted accounts, so that the club can answer if you come back with a question about your account.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">06</span>
                    How to restore within 30 days
                </h2>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Sign in the same way you did before.</p>
                    <p><strong>6.2.</strong> We will offer to restore the account — confirm, and everything comes back: rating, points and settings.</p>
                    <p><strong>6.3.</strong> After thirty days restoration is not possible.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">07</span>
                    Deleting part of your data instead
                </h2>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Individual items — photo, phone, social media links — can be removed in your <a href="dashboard-en.html">account area</a> without deleting the account.</p>
                    <p><strong>7.2.</strong> The same place switches off showing your phone and Telegram to other players.</p>
                </div>
            </div>$kslt$,
        $kslt$            <div class="ip-doc-approved ip-fade-in">
                <p class="ip-doc-approved-line">2026-жылдын 3-ноябрындагы редакциясы.</p>
                <p class="ip-doc-approved-line">Бул барак аккаунтка кирбестен ачылат. Анын дареги Google Play Console'до («Маалымат коопсуздугу» → «Аккаунтту өчүрүү») жана App Store Connect'те көрсөтүлөт.</p>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">01</span>
                    Маалыматтарды ким өчүрөт
                </h2>
                <div class="ip-rules-list">
                    <p>«Кыргызстан теннис сүйүүчүлөрүн коомчулугу» Коомдук фонду (кат. № 197575-3301-ОФ, Бишкек шаары, Чүй проспекти, 127, 26-батир), <a href="https://tennis.kg">tennis.kg</a> сайтынын жана Android менен iOS үчүн «KSLT Tennis» тиркемелеринин ээси.</p>
                    <p>Суроолор: <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a></p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">02</span>
                    Аккаунтту кантип өчүрүү керек
                </h2>
                <div class="ip-rules-list">
                    <p><strong>2.1.</strong> <strong>Тиркемеде:</strong> Профиль → Жөндөөлөр → «Аккаунтту өчүрүү» → өчүрүүнү ырастаңыз.</p>
                    <p><strong>2.2.</strong> <strong>Сайтта:</strong> <a href="dashboard-kg.html">жеке кабинетке</a> кириңиз → Жөндөөлөр → «Аккаунтту өчүрүү» жана ачылган терезеде ырастаңыз.</p>
                    <p><strong>2.3.</strong> <strong>Аккаунтка кирбестен:</strong> аккаунтта көрсөтүлгөн даректен <a href="mailto:kslt.kyrgyzstan@gmail.com">kslt.kyrgyzstan@gmail.com</a> дарегине «Аккаунтту өчүрүү» темасы менен жазыңыз. Биз аккаунтту 7 жумуш күнүнүн ичинде өчүрүп, бул жөнүндө билдиребиз.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">03</span>
                    Дароо эмне болот
                </h2>
                <div class="ip-rules-list">
                    <p><strong>3.1.</strong> Профиль башка колдонуучуларга көрүнбөй калат, аккаунт жалпы тизмелерден ошол замат жашырылат.</p>
                    <p><strong>3.2.</strong> Аккаунтка кирүү бөгөттөлөт, таркатуулар токтотулат.</p>
                    <p><strong>3.3.</strong> Отуз күн ичинде аккаунтту кайтарууга болот: жөн гана кириңиз, биз калыбына келтирүүнү сунуштайбыз. Мөөнөт бүтө электе эч нерсе биротоло өчүрүлбөйт.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">04</span>
                    30 күндөн кийин эмне өчүрүлөт
                </h2>
                <div class="ip-rules-list">
                    <p><strong>4.1.</strong> <strong>Кирүү аккаунту</strong> — профилдеги аты-жөнү, почта, туулган күнү, жынысы, телефону, сүрөтү, сырсөзү жана Google менен Telegram байланыштары.</p>
                    <p><strong>4.2.</strong> <strong>Билдирүү токендери жана кирүүлөр жөнүндө техникалык маалыматтар.</strong></p>
                    <p><strong>4.3.</strong> <strong>Лоялдуулук упайлары жана берилген арзандатуулар.</strong></p>
                    <p><strong>4.4.</strong> <strong>Билдирүүлөрдүн жөндөөлөрү жана бардык макулдуктар.</strong></p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">05</span>
                    Эмне калат жана эмне үчүн
                </h2>
                <div class="ip-rules-list">
                    <p><strong>5.1.</strong> <strong>Оюндардын жыйынтыктары жана топтолгон упайлары менен оюнчунун карточкасы калат.</strong> Бул жыйынтыктар сиз ойногон мелдештерге таандык: алар башкалардын оюндарынын, торчолордун жана рейтингдин тарыхынын бир бөлүгү, аларды өчүрүү өткөн мелдештердин жыйынтыктарын өзгөртмөк. Мелдеш тарыхында алар ээсиздендирилген түрдө же мелдештердин протоколдорунда аты-жөнү гана көрсөтүлүп сакталат (архивдик жана статистикалык максаттар, КР Санариптик кодексинин 83-беренесинин 2-бөлүгүнүн 2-пункту).</p>
                    <p><strong>5.2.</strong> Карточканын аккаунт менен байланышы жок — анда «Аккаунт өчүрүлдү» белгиси пайда болот.</p>
                    <p><strong>5.3.</strong> <strong>Колдонуучу макулдашуусун жана макулдуктарды кабыл алуу жөнүндө жазуулар</strong> — өчүрүлгөндөн кийин 3 жыл (КР Санариптик кодексинин 114-беренесинин 4-бөлүгү).</p>
                    <p><strong>5.4.</strong> <strong>Төлөмдөр жөнүндө маалыматтар</strong> — бухгалтердик эсеп жөнүндө мыйзамдарда белгиленген мөөнөттө.</p>
                    <p><strong>5.5.</strong> Аты-жөнү жана почтасы өчүрүлгөндөрдүн кызматтык журналында калат: ал боюнча клуб сиз аккаунтуңуз жөнүндө суроо менен кайрылсаңыз жооп бере алат.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">06</span>
                    30 күндүн ичинде кантип кайтаруу керек
                </h2>
                <div class="ip-rules-list">
                    <p><strong>6.1.</strong> Мурда киргениңиздей эле кириңиз.</p>
                    <p><strong>6.2.</strong> Биз аккаунтту калыбына келтирүүнү сунуштайбыз — ырастаңыз, баары кайтып келет: рейтинг, упайлар жана жөндөөлөр.</p>
                    <p><strong>6.3.</strong> Отуз күндөн кийин калыбына келтирүүгө болбойт.</p>
                </div>
            </div>

            <div class="ip-rules-section ip-fade-in">
                <h2 class="ip-rules-section-title">
                    <span class="ip-rules-section-num">07</span>
                    Баарын эмес, бир бөлүгүн өчүрүү
                </h2>
                <div class="ip-rules-list">
                    <p><strong>7.1.</strong> Айрым маалыматтарды — сүрөт, телефон, социалдык тармактарга шилтемелер — аккаунтту өчүрбөстөн <a href="dashboard-kg.html">жеке кабинетте</a> алып салууга болот.</p>
                    <p><strong>7.2.</strong> Ошол эле жерде телефонду жана Telegram'ды башка оюнчуларга көрсөтүү өчүрүлөт.</p>
                </div>
            </div>$kslt$)
ON CONFLICT (slug) DO UPDATE SET
    body    = EXCLUDED.body,
    body_en = EXCLUDED.body_en,
    body_kg = EXCLUDED.body_kg,
    title    = COALESCE(public.site_documents.title,    EXCLUDED.title),
    title_en = COALESCE(public.site_documents.title_en, EXCLUDED.title_en),
    title_kg = COALESCE(public.site_documents.title_kg, EXCLUDED.title_kg);

-- ---- ПРОВЕРКА СРАЗУ ПОСЛЕ ПРАВКИ ----------------------------------
-- Читает то, что легло. Абзацы должны совпасть с «в файлах» выше,
-- а www — исчезнуть.
SELECT  slug,
        (length(body)    - length(replace(body,    '<p', ''))) / 2 AS ru_abzacev,
        (length(body_en) - length(replace(body_en, '<p', ''))) / 2 AS en_abzacev,
        (length(body_kg) - length(replace(body_kg, '<p', ''))) / 2 AS kg_abzacev,
        (body    LIKE '%www.tennis.kg%'
         OR body_en LIKE '%www.tennis.kg%'
         OR body_kg LIKE '%www.tennis.kg%')                        AS gde_to_ostalsya_www,
        updated_at
FROM    public.site_documents
WHERE   slug IN ('offer', 'terms', 'privacy', 'delete-account')
ORDER BY slug;
