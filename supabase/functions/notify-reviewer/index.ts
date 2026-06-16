import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = 'https://harmonicapp.netlify.app'
const FROM_EMAIL = 'noahskang@gmail.com'
const FROM_NAME = 'Harmonic'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()

    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
    }

    const { reviewer_email, requester_name } = payload.record as {
      reviewer_email: string
      requester_name: string
    }

    if (!reviewer_email || !requester_name) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', reviewer_email)
      .maybeSingle()

    const hasAccount = !!profile
    const ctaUrl = hasAccount ? `${APP_URL}/pending-reviews` : `${APP_URL}/signup`
    const ctaText = hasAccount ? 'Respond to their request' : 'Create your account'
    const subject = `${requester_name} is asking for your feedback`

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 20px;">

    <div style="margin-bottom:28px;">
      <span style="font-size:18px;font-weight:600;color:#44403c;">Harmonic</span>
    </div>

    <div style="background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;padding:28px 28px 24px;">
      <p style="margin:0 0 12px;font-size:15px;color:#44403c;line-height:1.6;">
        <strong>${requester_name}</strong> has asked for your feedback.
      </p>

      ${!hasAccount ? `
      <p style="margin:0 0 20px;font-size:14px;color:#78716c;line-height:1.7;">
        Harmonic is a space for our community to grow through honest, encouraging feedback.
        It only takes a minute to get set up.
      </p>` : `
      <p style="margin:0 0 20px;font-size:14px;color:#78716c;line-height:1.7;">
        Head to your pending reviews to share your thoughts.
      </p>`}

      <a href="${ctaUrl}"
         style="display:inline-block;background:#44403c;color:#ffffff;padding:11px 22px;
                border-radius:10px;text-decoration:none;font-size:14px;font-weight:500;">
        ${ctaText} →
      </a>
    </div>

    <p style="margin:20px 0 0;font-size:12px;color:#a8a29e;text-align:center;line-height:1.6;">
      You received this because ${requester_name} listed your email for a peer review on Harmonic.
    </p>

  </div>
</body>
</html>`

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: reviewer_email }],
        subject,
        htmlContent: html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Brevo error:', result)
      return new Response(JSON.stringify({ error: result }), { status: 500 })
    }

    console.log('Email sent to', reviewer_email, result.messageId)
    return new Response(JSON.stringify({ ok: true, id: result.messageId }), { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
