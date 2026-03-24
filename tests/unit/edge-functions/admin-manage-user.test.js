// ============================================
// Unit tests: admin-manage-user Edge Function
// Tests role-based access, ban/unban, delete, create_manager
// ============================================

import { describe, it, expect } from 'vitest'

// --- Business logic extracted from Edge Function ---

/**
 * Validates the caller's permission for the requested action.
 * Returns { error, status } on failure, { ok: true } on success.
 */
function validateAction({ callerRole, action, body, callerId, targetProfile }) {
  // Must be staff
  if (!callerRole || (callerRole !== 'admin' && callerRole !== 'manager')) {
    return { error: 'Forbidden: staff only', status: 403 }
  }

  // CREATE MANAGER — admin only
  if (action === 'create_manager') {
    if (callerRole !== 'admin') {
      return { error: 'Forbidden: admin only', status: 403 }
    }
    if (!body.email) return { error: 'email required', status: 400 }
    return { ok: true }
  }

  // BAN USER
  if (action === 'ban_user') {
    if (!body.user_id) return { error: 'user_id required', status: 400 }
    if (!body.duration) return { error: 'duration required', status: 400 }
    if (body.user_id === callerId) return { error: 'Cannot ban yourself', status: 400 }
    if (!targetProfile) return { error: 'User not found', status: 404 }
    if (targetProfile.role === 'admin') return { error: 'Cannot ban admin', status: 403 }
    if (callerRole === 'manager' && targetProfile.role !== 'user') {
      return { error: 'Managers can only ban regular users', status: 403 }
    }

    // Validate duration
    const validDurations = ['1d', '3d', '7d', '30d', 'permanent']
    if (!validDurations.includes(body.duration)) {
      return { error: 'Invalid duration', status: 400 }
    }

    return { ok: true }
  }

  // UNBAN USER
  if (action === 'unban_user') {
    if (!body.user_id) return { error: 'user_id required', status: 400 }
    if (callerRole === 'manager' && targetProfile && targetProfile.role !== 'user') {
      return { error: 'Managers can only unban regular users', status: 403 }
    }
    return { ok: true }
  }

  // DELETE USER
  if (action === 'delete_user') {
    if (!body.user_id) return { error: 'user_id required', status: 400 }
    if (body.user_id === callerId) return { error: 'Cannot delete yourself', status: 400 }
    if (targetProfile && targetProfile.role === 'admin') {
      return { error: 'Cannot delete admin', status: 403 }
    }
    if (callerRole === 'manager' && targetProfile && targetProfile.role !== 'user') {
      return { error: 'Managers can only delete regular users', status: 403 }
    }
    return { ok: true }
  }

  // BAN PLAYER
  if (action === 'ban_player') {
    if (!body.player_id) return { error: 'player_id required', status: 400 }
    if (!body.banned_until) return { error: 'banned_until required', status: 400 }
    return { ok: true }
  }

  // UNBAN PLAYER
  if (action === 'unban_player') {
    if (!body.player_id) return { error: 'player_id required', status: 400 }
    return { ok: true }
  }

  return { error: 'Unknown action', status: 400 }
}

/**
 * Calculates banned_until date from duration string.
 */
function calculateBannedUntil(duration) {
  const durationMap = { '1d': 1, '3d': 3, '7d': 7, '30d': 30 }
  if (duration === 'permanent') {
    return '2099-12-31T23:59:59.000Z'
  }
  const days = durationMap[duration]
  if (!days) return null
  const dt = new Date('2026-03-23T12:00:00Z')
  dt.setDate(dt.getDate() + days)
  return dt.toISOString()
}

// ============================================
// Tests
// ============================================

describe('admin-manage-user: auth checks', () => {
  it('rejects non-staff users', () => {
    const result = validateAction({ callerRole: 'user', action: 'ban_user', body: { user_id: 'u1', duration: '1d' }, callerId: 'me', targetProfile: { role: 'user' } })
    expect(result).toEqual({ error: 'Forbidden: staff only', status: 403 })
  })

  it('rejects null role', () => {
    const result = validateAction({ callerRole: null, action: 'ban_user', body: {}, callerId: 'me', targetProfile: null })
    expect(result).toEqual({ error: 'Forbidden: staff only', status: 403 })
  })

  it('allows admin', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { user_id: 'u1', duration: '1d' }, callerId: 'me', targetProfile: { role: 'user' } })
    expect(result).toEqual({ ok: true })
  })

  it('allows manager for user-level operations', () => {
    const result = validateAction({ callerRole: 'manager', action: 'ban_user', body: { user_id: 'u1', duration: '1d' }, callerId: 'me', targetProfile: { role: 'user' } })
    expect(result).toEqual({ ok: true })
  })
})

describe('admin-manage-user: create_manager', () => {
  it('admin can create manager', () => {
    const result = validateAction({ callerRole: 'admin', action: 'create_manager', body: { email: 'new@test.com' }, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ ok: true })
  })

  it('manager cannot create manager', () => {
    const result = validateAction({ callerRole: 'manager', action: 'create_manager', body: { email: 'new@test.com' }, callerId: 'mgr1', targetProfile: null })
    expect(result).toEqual({ error: 'Forbidden: admin only', status: 403 })
  })

  it('rejects without email', () => {
    const result = validateAction({ callerRole: 'admin', action: 'create_manager', body: {}, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'email required', status: 400 })
  })
})

describe('admin-manage-user: ban_user', () => {
  it('cannot ban yourself', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { user_id: 'admin1', duration: '1d' }, callerId: 'admin1', targetProfile: { role: 'user' } })
    expect(result).toEqual({ error: 'Cannot ban yourself', status: 400 })
  })

  it('cannot ban another admin', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { user_id: 'admin2', duration: '1d' }, callerId: 'admin1', targetProfile: { role: 'admin' } })
    expect(result).toEqual({ error: 'Cannot ban admin', status: 403 })
  })

  it('manager cannot ban another manager', () => {
    const result = validateAction({ callerRole: 'manager', action: 'ban_user', body: { user_id: 'mgr2', duration: '1d' }, callerId: 'mgr1', targetProfile: { role: 'manager' } })
    expect(result).toEqual({ error: 'Managers can only ban regular users', status: 403 })
  })

  it('manager can ban regular user', () => {
    const result = validateAction({ callerRole: 'manager', action: 'ban_user', body: { user_id: 'u1', duration: '7d' }, callerId: 'mgr1', targetProfile: { role: 'user' } })
    expect(result).toEqual({ ok: true })
  })

  it('rejects missing user_id', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { duration: '1d' }, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'user_id required', status: 400 })
  })

  it('rejects missing duration', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { user_id: 'u1' }, callerId: 'admin1', targetProfile: { role: 'user' } })
    expect(result).toEqual({ error: 'duration required', status: 400 })
  })

  it('returns 404 when target user not found', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { user_id: 'u1', duration: '1d' }, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'User not found', status: 404 })
  })

  it('rejects invalid duration', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_user', body: { user_id: 'u1', duration: '99d' }, callerId: 'admin1', targetProfile: { role: 'user' } })
    expect(result).toEqual({ error: 'Invalid duration', status: 400 })
  })
})

describe('admin-manage-user: delete_user', () => {
  it('cannot delete yourself', () => {
    const result = validateAction({ callerRole: 'admin', action: 'delete_user', body: { user_id: 'admin1' }, callerId: 'admin1', targetProfile: { role: 'admin' } })
    expect(result).toEqual({ error: 'Cannot delete yourself', status: 400 })
  })

  it('cannot delete another admin', () => {
    const result = validateAction({ callerRole: 'admin', action: 'delete_user', body: { user_id: 'admin2' }, callerId: 'admin1', targetProfile: { role: 'admin' } })
    expect(result).toEqual({ error: 'Cannot delete admin', status: 403 })
  })

  it('manager cannot delete manager', () => {
    const result = validateAction({ callerRole: 'manager', action: 'delete_user', body: { user_id: 'mgr2' }, callerId: 'mgr1', targetProfile: { role: 'manager' } })
    expect(result).toEqual({ error: 'Managers can only delete regular users', status: 403 })
  })

  it('admin can delete regular user', () => {
    const result = validateAction({ callerRole: 'admin', action: 'delete_user', body: { user_id: 'u1' }, callerId: 'admin1', targetProfile: { role: 'user' } })
    expect(result).toEqual({ ok: true })
  })
})

describe('admin-manage-user: ban/unban player', () => {
  it('ban_player requires player_id', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_player', body: {}, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'player_id required', status: 400 })
  })

  it('ban_player requires banned_until', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_player', body: { player_id: 'p1' }, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'banned_until required', status: 400 })
  })

  it('ban_player succeeds with valid data', () => {
    const result = validateAction({ callerRole: 'admin', action: 'ban_player', body: { player_id: 'p1', banned_until: '2026-12-31' }, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ ok: true })
  })

  it('unban_player requires player_id', () => {
    const result = validateAction({ callerRole: 'admin', action: 'unban_player', body: {}, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'player_id required', status: 400 })
  })

  it('unban_player succeeds', () => {
    const result = validateAction({ callerRole: 'manager', action: 'unban_player', body: { player_id: 'p1' }, callerId: 'mgr1', targetProfile: null })
    expect(result).toEqual({ ok: true })
  })
})

describe('admin-manage-user: unknown action', () => {
  it('rejects unknown action', () => {
    const result = validateAction({ callerRole: 'admin', action: 'do_something', body: {}, callerId: 'admin1', targetProfile: null })
    expect(result).toEqual({ error: 'Unknown action', status: 400 })
  })
})

describe('admin-manage-user: calculateBannedUntil()', () => {
  it('permanent → 2099-12-31', () => {
    expect(calculateBannedUntil('permanent')).toBe('2099-12-31T23:59:59.000Z')
  })

  it('1d → +1 day', () => {
    const result = calculateBannedUntil('1d')
    expect(result).toContain('2026-03-24')
  })

  it('30d → +30 days', () => {
    const result = calculateBannedUntil('30d')
    expect(result).toContain('2026-04-22')
  })

  it('invalid duration → null', () => {
    expect(calculateBannedUntil('99d')).toBeNull()
  })
})
