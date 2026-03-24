// ============================================
// Unit tests: battle-publish Edge Function
// Tests auth, validation, publish modes, TG logic
// ============================================

import { describe, it, expect } from 'vitest'

// --- Extracted pure functions ---

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function shouldNotify(prefs, channel, cat) {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

// --- Business logic validator ---

function validatePublish({ profile, body, challenge }) {
  // Auth: staff only
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 }
  }

  // challenge_id required
  if (!body.challenge_id) {
    return { error: 'challenge_id required', status: 400 }
  }

  // Challenge must exist
  if (!challenge) {
    return { error: 'Challenge not found', status: 404 }
  }

  // MODE 1: notify_only — re-send for already published
  if (body.notify_only) {
    if (!challenge.battle_published) {
      return { error: 'Battle not published yet', status: 400 }
    }
    return { ok: true, mode: 'notify_only' }
  }

  // MODE 2: initial publish
  if (!body.title) {
    return { error: 'title required', status: 400 }
  }
  if (challenge.status !== 'accepted') {
    return { error: 'Challenge must be accepted', status: 400 }
  }
  if (challenge.battle_published) {
    return { error: 'Already published', status: 400 }
  }

  return { ok: true, mode: 'publish' }
}

/**
 * Builds TG announcement text.
 */
function buildAnnouncementText(battleTitle, challengerName, opponentName, date, time, venue) {
  let text =
    `⚔️ <b>${escHtml(battleTitle)}</b>\n\n` +
    `🔴 ${escHtml(challengerName)} vs 🔵 ${escHtml(opponentName)}\n`
  if (date) text += `📅 ${date}`
  if (time) text += ` ⏰ ${time}`
  text += '\n'
  if (venue) text += `📍 ${escHtml(venue)}\n`
  text += `\nГолосуйте за победителя! 👇`
  return text
}

// ============================================
// Tests
// ============================================

describe('battle-publish: auth', () => {
  const baseBody = { challenge_id: 'c1', title: 'Title' }
  const baseChallenge = { id: 'c1', status: 'accepted', battle_published: false }

  it('rejects non-staff (user role)', () => {
    const result = validatePublish({ profile: { role: 'user' }, body: baseBody, challenge: baseChallenge })
    expect(result).toEqual({ error: 'Forbidden', status: 403 })
  })

  it('rejects null profile', () => {
    const result = validatePublish({ profile: null, body: baseBody, challenge: baseChallenge })
    expect(result).toEqual({ error: 'Forbidden', status: 403 })
  })

  it('allows admin', () => {
    const result = validatePublish({ profile: { role: 'admin' }, body: baseBody, challenge: baseChallenge })
    expect(result).toEqual({ ok: true, mode: 'publish' })
  })

  it('allows manager', () => {
    const result = validatePublish({ profile: { role: 'manager' }, body: baseBody, challenge: baseChallenge })
    expect(result).toEqual({ ok: true, mode: 'publish' })
  })
})

describe('battle-publish: validation', () => {
  const staffProfile = { role: 'admin' }

  it('rejects missing challenge_id', () => {
    const result = validatePublish({ profile: staffProfile, body: {}, challenge: null })
    expect(result).toEqual({ error: 'challenge_id required', status: 400 })
  })

  it('returns 404 when challenge not found', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1' }, challenge: null })
    expect(result).toEqual({ error: 'Challenge not found', status: 404 })
  })

  it('rejects publish without title', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1' }, challenge: { id: 'c1', status: 'accepted', battle_published: false } })
    expect(result).toEqual({ error: 'title required', status: 400 })
  })

  it('rejects non-accepted challenge', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1', title: 'Battle!' }, challenge: { id: 'c1', status: 'active', battle_published: false } })
    expect(result).toEqual({ error: 'Challenge must be accepted', status: 400 })
  })

  it('rejects already published challenge', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1', title: 'Battle!' }, challenge: { id: 'c1', status: 'accepted', battle_published: true } })
    expect(result).toEqual({ error: 'Already published', status: 400 })
  })

  it('publish succeeds with valid data', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1', title: 'Epic Battle' }, challenge: { id: 'c1', status: 'accepted', battle_published: false } })
    expect(result).toEqual({ ok: true, mode: 'publish' })
  })
})

describe('battle-publish: notify_only mode', () => {
  const staffProfile = { role: 'admin' }

  it('notify_only fails if not published yet', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1', notify_only: true }, challenge: { id: 'c1', status: 'accepted', battle_published: false } })
    expect(result).toEqual({ error: 'Battle not published yet', status: 400 })
  })

  it('notify_only succeeds for published battle', () => {
    const result = validatePublish({ profile: staffProfile, body: { challenge_id: 'c1', notify_only: true }, challenge: { id: 'c1', status: 'accepted', battle_published: true, battle_title: 'Epic Battle' } })
    expect(result).toEqual({ ok: true, mode: 'notify_only' })
  })
})

describe('battle-publish: escHtml()', () => {
  it('escapes HTML entities', () => {
    expect(escHtml('A & B <script>')).toBe('A &amp; B &lt;script&gt;')
  })

  it('handles clean text', () => {
    expect(escHtml('Иванов vs Петров')).toBe('Иванов vs Петров')
  })
})

describe('battle-publish: shouldNotify()', () => {
  it('true when prefs null', () => {
    expect(shouldNotify(null, 'tg', 'challenges')).toBe(true)
  })

  it('true when channel missing', () => {
    expect(shouldNotify({}, 'tg', 'challenges')).toBe(true)
  })

  it('false when category disabled', () => {
    expect(shouldNotify({ tg: { challenges: false } }, 'tg', 'challenges')).toBe(false)
  })
})

describe('battle-publish: buildAnnouncementText()', () => {
  it('includes all fields when present', () => {
    const text = buildAnnouncementText('Epic Battle', 'Иванов', 'Петров', '2026-04-01', '15:00', 'Корт Ала-Арча')
    expect(text).toContain('Epic Battle')
    expect(text).toContain('🔴 Иванов')
    expect(text).toContain('🔵 Петров')
    expect(text).toContain('📅 2026-04-01')
    expect(text).toContain('⏰ 15:00')
    expect(text).toContain('📍 Корт Ала-Арча')
    expect(text).toContain('Голосуйте')
  })

  it('omits date/time/venue when empty', () => {
    const text = buildAnnouncementText('Battle', 'A', 'B', '', '', '')
    expect(text).not.toContain('📅')
    expect(text).not.toContain('⏰')
    expect(text).not.toContain('📍')
  })

  it('escapes HTML in names', () => {
    const text = buildAnnouncementText('<script>', 'A&B', 'C<D', '', '', '')
    expect(text).toContain('&lt;script&gt;')
    expect(text).toContain('A&amp;B')
    expect(text).toContain('C&lt;D')
  })
})
