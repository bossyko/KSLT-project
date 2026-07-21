// ============================================
// KSLT — Tournament Results Notify
// Supabase Edge Function
// ============================================
// Sends tournament results summary to Telegram group.
// POST { tournament_id: "xxx" } with JWT (admin/manager).
// Deduplication via news.results_notified_at field.
//
// Deploy: supabase functions deploy tournament-results-notify --no-verify-jwt
// Required secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_CHAT_ID

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'
const SITE_URL = 'https://kslt.netlify.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Auth: JWT (admin/manager) ---
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const db = createClient(supabaseUrl, serviceKey)

  // Check admin/manager role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return jsonResponse({ error: 'Forbidden: admin/manager only' }, 403)
  }

  try {
    const body = await req.json()
    const tournamentId = body.tournament_id
    if (!tournamentId) {
      return jsonResponse({ error: 'tournament_id required' }, 400)
    }

    // Load tournament
    const { data: tournament, error: tErr } = await db
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()
    if (tErr || !tournament) {
      return jsonResponse({ error: 'Tournament not found' }, 404)
    }

    // Load news article for this tournament
    const { data: newsArticle } = await db
      .from('news')
      .select('id, slug, results_notified_at')
      .eq('tournament_id', tournamentId)
      .maybeSingle()

    if (newsArticle && newsArticle.results_notified_at) {
      return jsonResponse({ error: 'Already notified', notified_at: newsArticle.results_notified_at }, 409)
    }

    // Load results (top players by points)
    const { data: results } = await db
      .from('tournament_results')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('points_earned', { ascending: false })
      .limit(10)

    if (!results || results.length === 0) {
      return jsonResponse({ error: 'No results found' }, 404)
    }

    // Load player names
    const playerIds = results.map((r: any) => r.player_id).filter(Boolean)
    let playerMap: Record<string, any> = {}
    if (playerIds.length > 0) {
      const { data: players } = await db.from('players').select('id, name, name_en').in('id', playerIds)
      if (players) {
        for (const p of players) playerMap[p.id] = p
      }
    }

    // Load registrations for external names and doubles partners
    const { data: registrations } = await db
      .from('tournament_registrations')
      .select('player_id, partner_id, is_external, external_name, partner_external_name')
      .eq('tournament_id', tournamentId)

    const regsMap: Record<string, any> = {}
    if (registrations) {
      for (const r of registrations) {
        if (r.player_id) regsMap[r.player_id] = r
      }
    }

    const isDbl = tournament.format === 'doubles' || tournament.format === 'mixed_doubles'

    // Helper: get player display name
    function getPlayerName(playerId: string): string {
      const p = playerMap[playerId]
      if (p) return p.name || playerId
      const reg = regsMap[playerId]
      if (reg && reg.is_external && reg.external_name) return reg.external_name
      return playerId || '?'
    }

    function getPartner(playerId: string): string {
      if (!isDbl) return ''
      const reg = regsMap[playerId]
      if (!reg) return ''
      if (reg.partner_id) {
        const pp = playerMap[reg.partner_id]
        return pp ? ' / ' + (pp.name || '') : ''
      }
      if (reg.partner_external_name) return ' / ' + reg.partner_external_name
      return ''
    }

    // Filter to captain-only for doubles
    let displayResults = results
    if (isDbl) {
      displayResults = results.filter((r: any) => !!regsMap[r.player_id])
    }

    // Build TG message
    const tName = tournament.title || ''
    let text = `🏆 <b>${escapeHtml(tName)}</b>\n\n`

    const medals = ['🥇', '🥈', '🥉']
    const topN = Math.min(3, displayResults.length)
    for (let i = 0; i < topN; i++) {
      const r = displayResults[i]
      const name = getPlayerName(r.player_id) + getPartner(r.player_id)
      text += `${medals[i]} ${escapeHtml(name)}\n`
    }

    // Article link
    const articleSlug = newsArticle && newsArticle.slug ? newsArticle.slug : ''

    // Inline keyboard with article link
    const keyboard: any = { inline_keyboard: [] }
    if (articleSlug) {
      keyboard.inline_keyboard.push([
        { text: '📰 Подробнее', url: `${SITE_URL}/pages/news.html?slug=${articleSlug}` }
      ])
    }

    // Send to TG group
    const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')
    if (!groupChatId) {
      return jsonResponse({ error: 'TELEGRAM_GROUP_CHAT_ID not configured' }, 500)
    }

    const sent = await sendMessageToGroup(groupChatId, text, keyboard.inline_keyboard.length > 0 ? keyboard : undefined)
    if (!sent) {
      return jsonResponse({ error: 'Failed to send TG message' }, 500)
    }

    // Mark as notified
    if (newsArticle) {
      await db.from('news')
        .update({ results_notified_at: new Date().toISOString() })
        .eq('id', newsArticle.id)
    }

    return jsonResponse({ sent: 1, tournament_id: tournamentId })
  } catch (err) {
    console.error('tournament-results-notify error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})

// --- Helpers ---

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

async function sendMessageToGroup(chatId: string, text: string, replyMarkup?: unknown): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }

  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    }
    if (replyMarkup) body.reply_markup = replyMarkup

    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('TG API error:', data)
      return false
    }
    return true
  } catch (err) {
    console.error('TG send error:', err)
    return false
  }
}
