// ============================================
// Надписи окна заявки — общие для сайта и приложения (шаг A3.7д, 29.10)
// ============================================
//
// ЧТО БЫЛО. Слова жили ДВАЖДЫ: на сайте — внутри `resultText` склейками
// `pick(en, kg, ru)`, в приложении — ключами `reg.*` в `i18n.js`. И они
// РАЗОШЛИСЬ: у сайта девятнадцать слов на коды отказа, у приложения
// ДЕВЯТЬ. Человек в приложении, которому клуб закрыл категорию, видел на
// экране `category_closed` — сырой код базы вместо объяснения.
//
// Вид окна у сайта и приложения свой и должен таким остаться. А слова
// одни и те же, и держать их в двух файлах — значит однажды поменять в
// одном. Образец — `js/match-score-texts.js` (окно счёта).
//
// РЕШЕНИЕ, КАКОЕ СЛОВО ПОКАЗАТЬ, ЗДЕСЬ НЕ ЖИВЁТ: его принимает дом
// `js/kslt-zayavka.js` и отдаёт КЛЮЧ. Здесь только слова.
//
// Файл общий: побайтовая копия в `mobile/www/js/`.

(function () {
    'use strict';

    var T = {};
    window.KSLT_ZAYAVKA_TEXTS = T;

    T.ru = {
        ok: 'Понятно',

        titleChanged: 'Напарник заменён',
        titleAlready: 'Вы уже подали заявку',
        titleRefused: 'Заявка не принята',
        titleAccepted: 'Заявка принята',
        titleReview: 'Заявка принята — на рассмотрении',

        changedKept: 'Ваше место в турнире сохраняется.',
        inMainDraw: 'Вы в основной сетке.',
        stDraw: 'Вы в основной сетке, жеребьёвка проведена.',
        stPending: 'Заявка ожидает решения администратора.',
        stWaitlist: 'Вы в листе ожидания.',
        stRejected: 'Заявка отклонена администратором.',
        stWithdrawn: 'Заявка была отозвана.',
        stBlocked: 'Заявка не прошла правила допуска.',
        stPrefix: 'Статус: ',

        reviewNoCategory: 'Вам ещё не присвоена категория, поэтому заявка требует рассмотрения.',
        reviewRank: 'Вы занимаете с 11 по 20 место в своей категории — заявка требует одобрения.',
        reviewFull: 'Основная сетка заполнена.',
        reviewAdmin: 'Решение примет администратор.',
        refusedGeneric: 'Вы не проходите по правилам допуска на турнир.',

        noteTopRank: 'Место не закреплено: если заявку подаст игрок категории турнира, вы можете быть перемещены в лист ожидания.',
        noteGuest: 'Напарник — гость: место за вами, но пару подтверждает менеджер.',
        noteGender: 'Состав не совпадает с турниром по полу: место за вами, решение принимает менеджер.',

        shortInDraw: 'В основной сетке',
        shortReview: 'На рассмотрении',
        shortWaitlist: 'В листе ожидания',
        shortRejected: 'Отклонена',
        shortWithdrawn: 'Отозвана',
        shortNotAccepted: 'Не принята',
        shortApplied: 'Заявка подана',
        shortChanged: 'Напарник заменён',

        err: {
            already_registered: 'Вы уже подавали заявку на этот турнир',
            no_player: 'Ваш аккаунт не связан с карточкой игрока',
            no_membership: 'Требуется активное членство KSLT',
            not_paid: 'Сначала оплатите членство',
            banned: 'Ваш аккаунт временно заблокирован',
            registration_closed: 'Регистрация на этот турнир закрыта',
            gender_mismatch: 'Этот турнир для другой гендерной категории',
            partner_gender_required: 'Укажите пол гостя',
            partner_ntrp_required: 'Укажите NTRP гостя',
            partner_gender_mismatch: 'Напарник не подходит турниру по полу',
            mixed_pair_same_gender: 'В миксте пара — мужчина и женщина. Подайте заявку без напарника, пару дополнит менеджер',
            category_closed: 'Эта категория для вас закрыта. Чтобы вернуться в неё, обратитесь в клуб',
            ntrp_too_low: 'Ваш NTRP ниже минимального для турнира',
            ntrp_too_high: 'Ваш NTRP выше максимального для турнира',
            ntrp_combined_exceeded: 'Суммарный NTRP пары превышает лимит турнира',
            partner_taken: 'Этот игрок уже в другой паре этого турнира',
            entry_in_draw: 'Сетка сформирована — состав закрыт. Чтобы сменить напарника, обратитесь в клуб',
            entry_rejected: 'Клуб закрыл вашу заявку на этот турнир. Чтобы вернуться, обратитесь к менеджеру',
            entry_not_active: 'Заявка вне турнира — менять напарника не на чем. Подайте заявку заново, пока регистрация открыта'
        }
    };

    T.en = {
        ok: 'Got it',

        titleChanged: 'Partner changed',
        titleAlready: 'You have already applied',
        titleRefused: 'Application not accepted',
        titleAccepted: 'Application accepted',
        titleReview: 'Application accepted — under review',

        changedKept: 'Your place in the tournament stays.',
        inMainDraw: 'You are in the main draw.',
        stDraw: 'You are in the main draw, the draw has been made.',
        stPending: 'The application is awaiting a decision.',
        stWaitlist: 'You are on the waiting list.',
        stRejected: 'The application was rejected by the administrator.',
        stWithdrawn: 'The application was withdrawn.',
        stBlocked: 'The application did not pass the entry rules.',
        stPrefix: 'Status: ',

        reviewNoCategory: 'Your category is not assigned yet, so the application needs a review.',
        reviewRank: 'You are ranked 11-20 in your category — the application needs approval.',
        reviewFull: 'The main draw is full.',
        reviewAdmin: 'The administrator will make a decision.',
        refusedGeneric: 'You do not meet the tournament entry rules.',

        noteTopRank: 'Your spot is not locked in: if a player of the tournament category applies, you may be moved to the waiting list.',
        noteGuest: 'Your partner is a guest: the place is held, but the manager confirms the pair.',
        noteGender: 'The lineup does not match the tournament by gender: the place is held, the manager decides.',

        shortInDraw: 'In the main draw',
        shortReview: 'Under review',
        shortWaitlist: 'On the waiting list',
        shortRejected: 'Rejected',
        shortWithdrawn: 'Withdrawn',
        shortNotAccepted: 'Not accepted',
        shortApplied: 'Applied',
        shortChanged: 'Partner changed',

        err: {
            already_registered: 'You have already applied for this tournament',
            no_player: 'Your account is not linked to a player profile',
            no_membership: 'Active KSLT membership required',
            not_paid: 'Please pay your membership first',
            banned: 'Your account is temporarily blocked',
            registration_closed: 'Registration for this tournament is closed',
            gender_mismatch: 'This tournament is for another gender category',
            partner_gender_required: 'Choose the guest gender',
            partner_ntrp_required: 'Enter the guest NTRP',
            partner_gender_mismatch: 'Your partner does not fit this tournament by gender',
            mixed_pair_same_gender: 'A mixed pair must be a man and a woman. Register without a partner — the manager will complete the pair',
            category_closed: 'This category is closed for you. Contact the club to reopen it',
            ntrp_too_low: 'Your NTRP is below the tournament minimum',
            ntrp_too_high: 'Your NTRP is above the tournament maximum',
            ntrp_combined_exceeded: 'Combined NTRP of the pair exceeds the tournament limit',
            partner_taken: 'This player is already in another pair of this tournament',
            entry_in_draw: 'The draw is done — the lineup is closed. To change a partner, contact the club',
            entry_rejected: 'The club closed your entry for this tournament. To return, contact a manager',
            entry_not_active: 'This entry is out of the tournament — there is no partner to change. Apply again while registration is open'
        }
    };

    T.kg = {
        ok: 'Түшүндүм',

        titleChanged: 'Өнөктөш алмаштырылды',
        titleAlready: 'Сиз буга чейин арыз бергенсиз',
        titleRefused: 'Арыз кабыл алынган жок',
        titleAccepted: 'Арыз кабыл алынды',
        titleReview: 'Арыз кабыл алынды — каралууда',

        changedKept: 'Мелдештеги орунуңуз сакталат.',
        inMainDraw: 'Сиз негизги сеткадасыз.',
        stDraw: 'Сиз негизги сеткадасыз, жеребьёвка өттү.',
        stPending: 'Арыз чечимди күтүүдө.',
        stWaitlist: 'Сиз күтүү тизмесиндесиз.',
        stRejected: 'Арызды администратор четке какты.',
        stWithdrawn: 'Арыз кайтарылып алынган.',
        stBlocked: 'Арыз катышуу эрежелеринен өткөн жок.',
        stPrefix: 'Абалы: ',

        reviewNoCategory: 'Категорияңыз дайындала элек, ошондуктан арыз каралат.',
        reviewRank: 'Категорияңызда 11-20 орундасыз — арыз бекитүүнү талап кылат.',
        reviewFull: 'Негизги сетка толук.',
        reviewAdmin: 'Чечимди администратор кабыл алат.',
        refusedGeneric: 'Сиз мелдешке катышуу эрежелерине туура келбейсиз.',

        noteTopRank: 'Орун бекитилген эмес: мелдеш категориясындагы оюнчу арыз берсе, сиз күтүү тизмесине өтүшүңүз мүмкүн.',
        noteGuest: 'Өнөктөшүңүз конок: орун сакталат, бирок жупту менеджер ырастайт.',
        noteGender: 'Курам мелдешке жынысы боюнча дал келбейт: орун сакталат, чечимди менеджер кабыл алат.',

        shortInDraw: 'Негизги сеткада',
        shortReview: 'Каралууда',
        shortWaitlist: 'Күтүү тизмесинде',
        shortRejected: 'Четке кагылган',
        shortWithdrawn: 'Кайтарылган',
        shortNotAccepted: 'Кабыл алынган жок',
        shortApplied: 'Арыз берилген',
        shortChanged: 'Өнөктөш алмаштырылды',

        err: {
            already_registered: 'Сиз бул мелдешке буга чейин арыз бергенсиз',
            no_player: 'Аккаунтуңуз оюнчу картасына байланган эмес',
            no_membership: 'KSLT активдүү мүчөлүгү талап кылынат',
            not_paid: 'Адегенде мүчөлүк төлөмүн төлөңүз',
            banned: 'Аккаунтуңуз убактылуу бөгөттөлгөн',
            registration_closed: 'Бул мелдешке каттоо жабык',
            gender_mismatch: 'Бул мелдеш башка жыныс категориясы үчүн',
            partner_gender_required: 'Коноктун жынысын тандаңыз',
            partner_ntrp_required: 'Коноктун NTRP көрсөтүңүз',
            partner_gender_mismatch: 'Өнөктөшүңүз бул мелдешке жынысы боюнча туура келбейт',
            mixed_pair_same_gender: 'Аралаш жупта эркек жана аял болушу керек. Өнөктөшсүз катталыңыз — жупту менеджер толуктайт',
            category_closed: 'Бул категория сиз үчүн жабык. Ачуу үчүн клубга кайрылыңыз',
            ntrp_too_low: 'NTRP көрсөткүчүңүз мелдештин минимумунан төмөн',
            ntrp_too_high: 'NTRP көрсөткүчүңүз мелдештин максимумунан жогору',
            ntrp_combined_exceeded: 'Жуптун жалпы NTRP көрсөткүчү чектен ашты',
            partner_taken: 'Бул оюнчу мелдештин башка жубунда',
            entry_in_draw: 'Сетка тартылды — курам жабык. Өнөктөштү алмаштыруу үчүн клубга кайрылыңыз',
            entry_rejected: 'Клуб бул мелдешке арызыңызды жапты. Кайра кирүү үчүн менеджерге кайрылыңыз',
            entry_not_active: 'Бул арыз мелдештен тышкары — өнөктөштү алмаштырууга болбойт. Каттоо ачык болсо, кайра арыз бериңиз'
        }
    };

    /** Надписи на нужном языке. Неизвестный язык — русский. */
    T.of = function (lang) {
        return T[lang] || T.ru;
    };
})();
