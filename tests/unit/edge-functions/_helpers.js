// Shared test helpers for Edge Function tests
import { vi } from 'vitest'

/**
 * Creates a mock Supabase client with chainable query builder.
 * Usage: const { db, mockTable } = createMockDb()
 */
export function createMockDb() {
  const queryResult = { data: null, error: null, count: null }

  const chain = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(queryResult),
      then: (resolve) => resolve(queryResult),
    }
    // Make builder itself thenable so `await db.from(...).select(...)` works
    builder[Symbol.for('thenable')] = true
    return builder
  }

  const tables = {}
  const db = {
    from: vi.fn((table) => {
      if (!tables[table]) tables[table] = chain()
      return tables[table]
    }),
    auth: {
      admin: {
        inviteUserByEmail: vi.fn(),
        updateUserById: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  }

  return { db, tables }
}

/**
 * Creates a mock Request object.
 */
export function mockRequest(body, { method = 'POST', authHeader = 'Bearer test-jwt' } = {}) {
  return {
    method,
    headers: new Map([
      ['Authorization', authHeader],
      ['Content-Type', 'application/json'],
    ]),
    json: vi.fn().mockResolvedValue(body),
  }
}

/**
 * Parse a Response-like object to get JSON + status.
 */
export async function parseResponse(response) {
  const body = JSON.parse(await response.text())
  return { status: response.status, body }
}
