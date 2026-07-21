#!/usr/bin/env node
// ============================================
// KSLT Mobile — Smoke & Regression Tests
// ============================================
// Static analysis tests: syntax, i18n keys, DOM IDs,
// auth flow, registration logic, doubles registration.
//
// Run: node mobile/tests/smoke-regression.js
// ============================================

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
var WWW = path.join(ROOT, 'www');
var passed = 0;
var failed = 0;
var warnings = 0;

function ok(msg) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
function fail(msg) { failed++; console.log('  \x1b[31m✗\x1b[0m ' + msg); }
function warn(msg) { warnings++; console.log('  \x1b[33m⚠\x1b[0m ' + msg); }
function section(name) { console.log('\n\x1b[1m' + name + '\x1b[0m'); }

// ============================
// 1. SMOKE: Syntax Check
// ============================
section('1. Syntax Check — All JS Files');

var jsFiles = [
  'js/supabase-config.js',
  'js/i18n.js',
  'js/auth.js',
  'js/app.js',
  'js/screens/home.js',
  'js/screens/tournaments.js',
  'js/screens/rating.js',
  'js/screens/news.js',
  'js/screens/profile.js',
  'js/screens/battles.js',
  'js/screens/coaches.js',
  'js/screens/courts.js',
  'js/screens/live.js',
  'js/screens/partners.js',
  'js/screens/player-detail.js'
];

jsFiles.forEach(function(f) {
  var fullPath = path.join(WWW, f);
  if (!fs.existsSync(fullPath)) {
    warn(f + ' — file not found');
    return;
  }
  try {
    var code = fs.readFileSync(fullPath, 'utf8');
    new vm.Script(code, { filename: f });
    ok(f + ' — syntax OK');
  } catch (e) {
    fail(f + ' — SYNTAX ERROR: ' + e.message);
  }
});

// ============================
// 2. SMOKE: HTML Integrity
// ============================
section('2. HTML — index.html Integrity');

var htmlPath = path.join(WWW, 'index.html');
var html = fs.readFileSync(htmlPath, 'utf8');

// Check critical screen IDs exist
var criticalIds = [
  'authScreen', 'screenHome', 'screenTournaments', 'screenRating',
  'screenNews', 'screenProfile', 'tournamentList', 'ratingContent',
  'ratingGender', 'ratingCatBtn', 'ratingCatSheet', 'ratingCatOptions',
  'ratingSearch', 'ratingTypeToggle', 'tdOverlay'
];

criticalIds.forEach(function(id) {
  if (html.indexOf('id="' + id + '"') !== -1) {
    ok('DOM id="' + id + '" found');
  } else {
    fail('DOM id="' + id + '" NOT FOUND in index.html');
  }
});

// Check rating type toggle buttons
if (html.indexOf('data-type="singles"') !== -1 && html.indexOf('data-type="doubles"') !== -1) {
  ok('Rating type toggle (singles/doubles) buttons present');
} else {
  fail('Rating type toggle buttons missing');
}

// ============================
// 3. SMOKE: i18n Completeness
// ============================
section('3. i18n — Key Completeness');

var i18nCode = fs.readFileSync(path.join(WWW, 'js/i18n.js'), 'utf8');

// Extract all defined keys
var definedKeys = {};
var keyRegex = /'([a-zA-Z0-9_.]+)'\s*:\s*\{/g;
var match;
while ((match = keyRegex.exec(i18nCode)) !== null) {
  if (match[1] !== 'ru' && match[1] !== 'en' && match[1] !== 'kg') {
    definedKeys[match[1]] = true;
  }
}

// New registration/doubles keys that must exist
var requiredNewKeys = [
  'trn.joinWaitlist', 'trn.slotsFull', 'trn.partnerSelect',
  'trn.partnerSearch', 'trn.soloReg', 'trn.registering',
  'trn.regSent', 'trn.regSoloSent', 'trn.noPlayersFound',
  'trn.ntrpExceed', 'trn.mixedGender', 'trn.regAsPartner',
  'trn.addPartner', 'trn.partnerAdded', 'trn.waitlistSolo',
  'rating.singles', 'rating.doubles'
];

requiredNewKeys.forEach(function(key) {
  if (definedKeys[key]) {
    ok('i18n key "' + key + '" defined');
  } else {
    fail('i18n key "' + key + '" MISSING');
  }
});

// Check each new key has all 3 languages
var newKeyLangCheck = [
  'trn.joinWaitlist', 'trn.slotsFull', 'trn.partnerSelect',
  'rating.singles', 'rating.doubles'
];

newKeyLangCheck.forEach(function(key) {
  var pattern = "'" + key + "'";
  var idx = i18nCode.indexOf(pattern);
  if (idx === -1) return;
  var line = i18nCode.substring(idx, i18nCode.indexOf('\n', idx));
  var hasRu = line.indexOf(' ru:') !== -1;
  var hasEn = line.indexOf(' en:') !== -1;
  var hasKg = line.indexOf(' kg:') !== -1;
  if (hasRu && hasEn && hasKg) {
    ok('i18n "' + key + '" has all 3 languages (ru/en/kg)');
  } else {
    fail('i18n "' + key + '" missing language: ' + (!hasRu ? 'ru ' : '') + (!hasEn ? 'en ' : '') + (!hasKg ? 'kg' : ''));
  }
});

// ============================
// 4. REGRESSION: Auth Module
// ============================
section('4. Regression — Auth Module');

var authCode = fs.readFileSync(path.join(WWW, 'js/auth.js'), 'utf8');

// Auth API completeness
var authMethods = [
  'AUTH.checkSession', 'AUTH.loadProfile', 'AUTH.login',
  'AUTH.register', 'AUTH.logout', 'AUTH.checkMembership',
  'AUTH.showAuth', 'AUTH.telegramAuth', 'AUTH.verifyTelegramOtp',
  'AUTH.loginGoogle', 'AUTH.resetPassword', 'AUTH.setupAuthUI'
];

authMethods.forEach(function(method) {
  if (authCode.indexOf(method) !== -1) {
    ok(method + '() exists');
  } else {
    fail(method + '() MISSING from auth.js');
  }
});

// Auth state management
if (authCode.indexOf('AUTH.currentUser = null') !== -1) ok('AUTH.currentUser initialized');
else fail('AUTH.currentUser not initialized');

if (authCode.indexOf('AUTH.currentProfile = null') !== -1) ok('AUTH.currentProfile initialized');
else fail('AUTH.currentProfile not initialized');

if (authCode.indexOf('AUTH._membershipStatus') !== -1) ok('AUTH._membershipStatus cached');
else fail('AUTH._membershipStatus not found');

// Session check flow
if (authCode.indexOf('getSession') !== -1) ok('Auth uses getSession() for session check');
else fail('Auth missing getSession()');

// Profile retry logic
if (authCode.indexOf('retries < 3') !== -1) ok('Profile retry logic (3 retries) present');
else fail('Profile retry logic missing');

// Profile fallback creation
if (authCode.indexOf('insert({') !== -1 && authCode.indexOf("role: 'user'") !== -1) ok('Profile fallback creation with role:user');
else fail('Profile fallback creation missing');

// Logout clears state
if (authCode.indexOf('AUTH.currentUser = null') !== -1 &&
    authCode.indexOf('AUTH.currentProfile = null') !== -1) ok('Logout clears user state');
else fail('Logout does not clear state properly');

// Password validation
if (authCode.indexOf('pass.length < 6') !== -1) ok('Registration validates password >= 6 chars');
else fail('Password validation missing');

// Duplicate email detection
if (authCode.indexOf('identities.length === 0') !== -1) ok('Duplicate email detection via identities check');
else fail('Duplicate email detection missing');

// Email verification flow
if (authCode.indexOf('res.data.session') !== -1 && authCode.indexOf('verifyEmail') !== -1) ok('Email verification flow exists');
else fail('Email verification flow missing');

// Google OAuth
if (authCode.indexOf("provider: 'google'") !== -1) ok('Google OAuth configured');
else fail('Google OAuth missing');

// Telegram auth callback
if (authCode.indexOf('_onMobileTgAuth') !== -1) ok('Telegram auth callback defined');
else fail('Telegram auth callback missing');

// Telegram new user flow
if (authCode.indexOf("'new_user'") !== -1) ok('Telegram new user registration flow exists');
else fail('Telegram new user flow missing');

// last_seen update
if (authCode.indexOf('last_seen') !== -1) ok('last_seen tracked on login');
else fail('last_seen tracking missing');

// ============================
// 5. REGRESSION: Registration Flow (Tournaments)
// ============================
section('5. Regression — Tournament Registration');

var trnCode = fs.readFileSync(path.join(WWW, 'js/screens/tournaments.js'), 'utf8');

// Core registration function exists
if (trnCode.indexOf('checkAndRenderRegistration') !== -1) ok('checkAndRenderRegistration() exists');
else fail('checkAndRenderRegistration() MISSING');

// Auth check (not logged in)
if (trnCode.indexOf('AUTH.currentUser') !== -1) ok('Auth check: user logged in');
else fail('Missing auth check for logged in user');

// Player_id check
if (trnCode.indexOf('profile.player_id') !== -1) ok('Player link check: player_id');
else fail('Missing player_id check');

// Ban check
if (trnCode.indexOf('banned_until') !== -1) ok('Ban check present');
else fail('Ban check missing');

// Membership check
if (trnCode.indexOf('AUTH.checkMembership') !== -1) ok('Membership check present');
else fail('Membership check missing');

// Category mismatch → waitlist
if (trnCode.indexOf('category_id') !== -1 && trnCode.indexOf("'waitlist'") !== -1) ok('Category mismatch → waitlist logic');
else fail('Category mismatch → waitlist logic missing');

// Already registered check
if (trnCode.indexOf('existingReg') !== -1) ok('Already registered check present');
else fail('Already registered check missing');

// Unique constraint error handling
if (trnCode.indexOf("'unique'") !== -1) ok('Duplicate registration error handling');
else fail('Duplicate registration error handling missing');

// Status labels for existing registration
['pending', 'approved', 'waitlist', 'rejected', 'withdrawn'].forEach(function(s) {
  if (trnCode.indexOf("'" + s + "'") !== -1 || trnCode.indexOf('"' + s + '"') !== -1 || trnCode.indexOf(s + ':') !== -1) {
    ok('Status "' + s + '" handled');
  } else {
    fail('Status "' + s + '" NOT handled');
  }
});

// ============================
// 6. NEW FEATURES: Doubles Registration
// ============================
section('6. New Feature — Doubles Registration');

// Doubles format detection
if (trnCode.indexOf("t.format === 'doubles'") !== -1 &&
    trnCode.indexOf("t.format === 'mixed_doubles'") !== -1) ok('Doubles format detection (doubles + mixed_doubles)');
else fail('Doubles format detection missing');

// isDbl variable
if (trnCode.indexOf('isDbl') !== -1) ok('isDbl flag computed');
else fail('isDbl flag missing');

// Doubles modal function
if (trnCode.indexOf('showDoublesModal') !== -1) ok('showDoublesModal() function exists');
else fail('showDoublesModal() function MISSING');

// Partner search input
if (trnCode.indexOf('mobPartnerSearch') !== -1) ok('Partner search input (mobPartnerSearch) present');
else fail('Partner search input missing');

// Partner search query (Supabase)
if (trnCode.indexOf("'name.ilike.%'") !== -1 || trnCode.indexOf("name.ilike.%") !== -1) ok('Partner search queries Supabase');
else fail('Partner search query missing');

// Solo registration option
if (trnCode.indexOf('mobDoublesRegSolo') !== -1) ok('Solo registration button present');
else fail('Solo registration button missing');

// Register with partner
if (trnCode.indexOf('mobDoublesRegWithPartner') !== -1) ok('Register with partner button present');
else fail('Register with partner button missing');

// Partner selection (hidden input)
if (trnCode.indexOf('mobPartnerSelectedId') !== -1) ok('Partner selection state (hidden input) present');
else fail('Partner selection state missing');

// Cancel button
if (trnCode.indexOf('mobDoublesCancel') !== -1) ok('Cancel button in doubles modal');
else fail('Cancel button missing in doubles modal');

// partner_id in registration insert
if (trnCode.indexOf('partner_id: partnerId') !== -1) ok('partner_id sent in registration insert');
else fail('partner_id not sent in registration');

// Registered as partner check
if (trnCode.indexOf('partner_id') !== -1 && trnCode.indexOf('asPartner') !== -1) ok('Already registered as partner check');
else fail('Missing partner registration check');

// Add partner to existing registration (update mode)
if (trnCode.indexOf('existingRegId') !== -1) ok('Add partner to existing registration (update mode)');
else fail('Update mode for adding partner missing');

// ============================
// 7. NEW FEATURES: NTRP Combined Validation
// ============================
section('7. New Feature — NTRP Combined Validation');

if (trnCode.indexOf('ntrp_combined_max') !== -1) ok('ntrp_combined_max field checked');
else fail('ntrp_combined_max not checked');

if (trnCode.indexOf('captainNtrp') !== -1) ok('captainNtrp computed from player data');
else fail('captainNtrp missing');

if (trnCode.indexOf('ntrp_rating') !== -1) ok('ntrp_rating loaded from players table');
else fail('ntrp_rating not loaded');

if (trnCode.indexOf('ntrpExceed') !== -1) ok('NTRP exceed alert uses i18n key');
else fail('NTRP exceed alert missing');

// Combined NTRP calculation
if (trnCode.indexOf('captainNtrp + partnerNtrp') !== -1 ||
    trnCode.indexOf('captainNtrp +') !== -1) ok('Combined NTRP calculated (captain + partner)');
else fail('Combined NTRP calculation missing');

// NTRP hint in modal
if (trnCode.indexOf('ntrpHint') !== -1) ok('NTRP hint displayed in modal');
else fail('NTRP hint missing from modal');

// ============================
// 8. NEW FEATURES: Mixed Doubles Gender Validation
// ============================
section('8. New Feature — Mixed Doubles Gender Validation');

if (trnCode.indexOf('isMixed') !== -1) ok('isMixed flag computed');
else fail('isMixed flag missing');

if (trnCode.indexOf('gender') !== -1 && trnCode.indexOf('captGender') !== -1) ok('Gender validation: captain gender loaded');
else fail('Captain gender not loaded for validation');

if (trnCode.indexOf('captGender === partGender') !== -1) ok('Gender validation: same gender blocked');
else fail('Same gender not blocked for mixed doubles');

if (trnCode.indexOf('mixedGender') !== -1) ok('Mixed gender alert uses i18n key');
else fail('Mixed gender alert missing');

// ============================
// 9. NEW FEATURES: Waitlist Overflow
// ============================
section('9. New Feature — Waitlist Overflow');

// Online slots calculation
if (trnCode.indexOf('max_participants') !== -1 && trnCode.indexOf('reserved_spots') !== -1) ok('Online slots = max_participants - reserved_spots');
else fail('Online slots calculation missing');

if (trnCode.indexOf('onlineSlotsFull') !== -1) ok('onlineSlotsFull flag computed');
else fail('onlineSlotsFull flag missing');

// Active registrations count
if (trnCode.indexOf('activeRegCount') !== -1) ok('Active registrations counted');
else fail('Active registrations count missing');

// Waitlist button when slots full
if (trnCode.indexOf('data-waitlist="1"') !== -1) ok('Waitlist button with data-waitlist attribute');
else fail('Waitlist button with data-waitlist missing');

if (trnCode.indexOf("btn.dataset.waitlist === '1'") !== -1) ok('Waitlist flag checked on registration');
else fail('Waitlist flag not checked');

// Slots full message
if (trnCode.indexOf('trn.slotsFull') !== -1) ok('Slots full message shown (i18n)');
else fail('Slots full message missing');

if (trnCode.indexOf('trn.joinWaitlist') !== -1) ok('Join waitlist button text (i18n)');
else fail('Join waitlist text missing');

// ============================
// 10. NEW FEATURES: Doubles Rating Toggle
// ============================
section('10. New Feature — Doubles Rating Toggle');

var ratingCode = fs.readFileSync(path.join(WWW, 'js/screens/rating.js'), 'utf8');

if (ratingCode.indexOf('currentRatingType') !== -1) ok('currentRatingType state variable exists');
else fail('currentRatingType state variable missing');

if (ratingCode.indexOf('initRatingTypeToggle') !== -1) ok('initRatingTypeToggle() function exists');
else fail('initRatingTypeToggle() function missing');

if (ratingCode.indexOf('ratingTypeToggle') !== -1) ok('ratingTypeToggle DOM element referenced');
else fail('ratingTypeToggle DOM element not referenced');

if (ratingCode.indexOf('doubles_points') !== -1) ok('doubles_points field used for doubles ranking');
else fail('doubles_points field not used');

if (ratingCode.indexOf("currentRatingType === 'doubles'") !== -1) ok('Conditional doubles_points vs points display');
else fail('Conditional points display missing');

// Doubles filter: only show players with doubles_points > 0
if (ratingCode.indexOf('doubles_points || 0) > 0') !== -1) ok('Filter out players with 0 doubles_points');
else fail('No filter for 0 doubles_points players');

// ============================
// 11. CSS — Rating Type Toggle
// ============================
section('11. CSS — Rating Type Toggle');

var cssPath = path.join(WWW, 'css/app.css');
var css = fs.readFileSync(cssPath, 'utf8');

if (css.indexOf('.rating-type-btn') !== -1) ok('CSS .rating-type-btn defined');
else fail('CSS .rating-type-btn MISSING');

if (css.indexOf('.rating-type-btn.active') !== -1) ok('CSS .rating-type-btn.active defined');
else fail('CSS .rating-type-btn.active MISSING');

if (css.indexOf('rating-type-btn.active') !== -1 && css.indexOf('[data-theme="light"]') !== -1) ok('Light theme override for rating-type-btn');
else warn('Light theme override may be missing for rating-type-btn');

// ============================
// 12. REGRESSION: Existing features preserved
// ============================
section('12. Regression — Existing Features Preserved');

// Tournaments: cards, filter, pagination
if (trnCode.indexOf('T.load') !== -1) ok('T.load() preserved');
else fail('T.load() missing');

if (trnCode.indexOf('T.filter') !== -1) ok('T.filter() preserved');
else fail('T.filter() missing');

if (trnCode.indexOf('T.search') !== -1) ok('T.search() preserved');
else fail('T.search() missing');

if (trnCode.indexOf('T.refresh') !== -1) ok('T.refresh() preserved');
else fail('T.refresh() missing');

if (trnCode.indexOf('T.setupPullToRefresh') !== -1) ok('T.setupPullToRefresh() preserved');
else fail('T.setupPullToRefresh() missing');

if (trnCode.indexOf('renderCard') !== -1) ok('renderCard() preserved');
else fail('renderCard() missing');

if (trnCode.indexOf('renderLoadMore') !== -1) ok('renderLoadMore() preserved');
else fail('renderLoadMore() missing');

if (trnCode.indexOf('openTournamentOverlay') !== -1) ok('openTournamentOverlay() preserved');
else fail('openTournamentOverlay() missing');

// Rating: existing features
if (ratingCode.indexOf('R.load') !== -1) ok('R.load() preserved');
else fail('R.load() missing');

if (ratingCode.indexOf('initGenderToggle') !== -1) ok('initGenderToggle() preserved');
else fail('initGenderToggle() missing');

if (ratingCode.indexOf('initCategoryDropdown') !== -1) ok('initCategoryDropdown() preserved');
else fail('initCategoryDropdown() missing');

if (ratingCode.indexOf('initSearch') !== -1) ok('initSearch() preserved');
else fail('initSearch() missing');

if (ratingCode.indexOf('GUEST_VISIBLE') !== -1) ok('Guest access restriction preserved');
else fail('Guest access restriction missing');

// ============================
// SUMMARY
// ============================
console.log('\n' + '='.repeat(50));
console.log('\x1b[1mResults:\x1b[0m');
console.log('  \x1b[32mPassed: ' + passed + '\x1b[0m');
if (failed > 0) console.log('  \x1b[31mFailed: ' + failed + '\x1b[0m');
if (warnings > 0) console.log('  \x1b[33mWarnings: ' + warnings + '\x1b[0m');
console.log('  Total:  ' + (passed + failed + warnings));
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n\x1b[31mSOME TESTS FAILED!\x1b[0m');
  process.exit(1);
} else {
  console.log('\n\x1b[32mALL TESTS PASSED!\x1b[0m');
  process.exit(0);
}
