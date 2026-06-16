import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // Verify caller is authenticated
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // Verify caller is an admin (use service role to bypass RLS)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!callerProfile?.is_admin) return json({ error: 'Forbidden' }, 403)

    const { action, user_id } = await req.json() as { action: string; user_id: string }

    if (!user_id) return json({ error: 'user_id required' }, 400)

    if (action === 'delete_user') {
      // Delete auth user — cascades to profile and all related rows
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    if (action === 'reset_user') {
      // Clear all reviews and requests; keep the account
      const [a, b, c] = await Promise.all([
        adminClient.from('self_reviews').delete().eq('user_id', user_id),
        adminClient.from('peer_reviews').delete().or(`reviewer_id.eq.${user_id},reviewee_id.eq.${user_id}`),
        adminClient.from('review_requests').delete().or(`requester_id.eq.${user_id},reviewer_id.eq.${user_id}`),
      ])
      const error = a.error || b.error || c.error
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
