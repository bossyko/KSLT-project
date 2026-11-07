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
UPDATE public.site_documents SET
    body    = $kslt$
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
                    <p><strong>1.3.</strong> «Организатор» — Общественный фонд «Кыргызстанское сообщество любителей тенниса», регистрационный No 197575-3301-ОФ, ИНН 01905202110030, юридический адрес: г. Бишкек, пр. Чуй, кв.26, в лице директора Чокоевой Айсулуу Эриковны, действующая на основании Устава, являющийся исполнителем услуг по организации участия в спортивных теннисных мероприятиях (соревнованиях), которое осуществляет организационное, финансовое и иное обеспечение его подготовки и проведения.</p>
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
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> предоставить участнику информацию в группе WhatsApp или в личном кабинете на сайте tennis.kg о одобрении его заявки;</p>
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
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> вносить изменения в программу соревнований, в том числе изменять количество участников, уведомив об этом участника посредством размещения на сайте tennis.kg или закрытой группы WhatsApp;</p>
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
            </div>
$kslt$,
    body_en = $kslt$
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
                    <p><strong>1.3.</strong> <strong>"Organizer"</strong> — Public Foundation "Kyrgyzstan Social Lawn Tennis Community" (KSLT), Registration No. 197575-3301-PF, TIN 01905202110030, legal address: Bishkek city, Chuy Ave., apt. 26, represented by Director Chokoeva Aisuluu Erikovna, acting on the basis of the Charter, being the service provider for organizing participation in sports tennis events (competitions), which carries out organizational, financial and other support for their preparation and conduct.</p>
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
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> provide the Participant with information via WhatsApp group or in the personal account on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> regarding the approval of their application;</p>
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
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> make changes to the Competition program, including changing the number of participants, by notifying the Participant through publication on the website <a href="https://tennis.kg" target="_blank" rel="noopener noreferrer">tennis.kg</a> or the private WhatsApp group;</p>
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
                    <p><strong>5.4.</strong> The Organizer has the right to withdraw from the Agreement (cancel the Competition) by sending the Participant a notification via WhatsApp phone number, no later than 48 hours before the start of the Competition.</p>
                </div>
            </div>
$kslt$,
    body_kg = $kslt$
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
                    <p><strong>1.3.</strong> «Уюштуруучу» — «Кыргызстандык теннис сүйүүчүлөрүнүн коомдоштугу» коомдук фонду, катталуу No 197575-3301-ОФ, ИНН 01905202110030, юридикалык дареги: Бишкек ш., Чүй пр., кв.26, директору Чокоева Айсулуу Эриковнанын жетектөөсүндө, Уставдын негизинде иш алып барат.</p>
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
                    <p style="padding-left:20px;"><strong>3.1.2.</strong> катышуучуга WhatsApp тобунда же tennis.kg сайтындагы жеке кабинетинде арызынын жактырылгандыгы жөнүндө маалымат берүү;</p>
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
                    <p style="padding-left:20px;"><strong>4.4.2.</strong> мелдештердин программасына өзгөртүүлөрдү киргизүү, анын ичинде катышуучулардын санын өзгөртүү, бул тууралуу катышуучуну tennis.kg сайтына же жабык WhatsApp тобуна жайгаштыруу аркылуу билдирүү;</p>
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
                    <p><strong>5.4.</strong> Уюштуруучу мелдештин башталуу убактысына чейин 48 саат мурда катышуучуга WhatsApp телефон номери аркылуу билдирүү жөнөтүп, келишимден (мелдешти өткөрүүдөн) баш тартууга укуктуу.</p>
                </div>
            </div>
$kslt$
WHERE slug = 'offer';

-- ---- terms ----------------------------------------------------
UPDATE public.site_documents SET
    body    = $kslt$            <div class="ip-doc-approved ip-fade-in">
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
    body_en = $kslt$            <div class="ip-doc-approved ip-fade-in">
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
    body_kg = $kslt$            <div class="ip-doc-approved ip-fade-in">
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
            </div>$kslt$
WHERE slug = 'terms';

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
WHERE   slug IN ('offer', 'terms', 'privacy')
ORDER BY slug;
