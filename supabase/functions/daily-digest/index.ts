// Supabase Edge Function: daily-digest
// Schedule: 9:00 AM UTC daily (configure in Supabase dashboard)
// Sends a daily email digest via Resend API to each user with follow-ups due today.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL = 'digest@followupfox.com'

interface Contact {
  id: string
  name: string
  company: string | null
  email: string | null
  notes: string | null
  follow_up_date: string
}

interface UserDigest {
  email: string
  contacts: Contact[]
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // Get all contacts due today or overdue, with user emails via join
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id, name, company, email, notes, follow_up_date,
        user_id,
        users:auth.users!user_id(email)
      `)
      .lte('follow_up_date', today)

    if (error) throw error
    if (!contacts || contacts.length === 0) {
      return new Response('No contacts due today.', { status: 200 })
    }

    // Group by user
    const byUser: Record<string, UserDigest> = {}
    for (const c of contacts) {
      const userEmail = (c as any).users?.email
      if (!userEmail) continue
      if (!byUser[userEmail]) {
        byUser[userEmail] = { email: userEmail, contacts: [] }
      }
      byUser[userEmail].contacts.push(c)
    }

    const results = await Promise.all(
      Object.values(byUser).map((ud) => sendDigest(ud))
    )

    return new Response(
      JSON.stringify({ sent: results.length, details: results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

async function sendDigest(ud: UserDigest): Promise<{ email: string; status: string }> {
  const overdueContacts = ud.contacts.filter((c) => c.follow_up_date < new Date().toISOString().split('T')[0])
  const todayContacts = ud.contacts.filter((c) => c.follow_up_date === new Date().toISOString().split('T')[0])

  const formatContact = (c: Contact) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 12px 8px; font-weight: 600; color: #111827;">${c.name}${c.company ? ` <span style="font-weight:400;color:#6b7280;">@ ${c.company}</span>` : ''}</td>
      <td style="padding: 12px 8px; color: #6b7280; font-size: 13px;">${c.notes ? c.notes.slice(0, 100) + (c.notes.length > 100 ? '…' : '') : '—'}</td>
      <td style="padding: 12px 8px;">${c.email ? `<a href="mailto:${c.email}" style="color: #FF6B35;">${c.email}</a>` : '—'}</td>
    </tr>
  `

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:40px;margin-bottom:8px;">🦊</div>
      <h1 style="margin:0;font-size:22px;color:#111827;">Your follow-ups for today</h1>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    </div>

    ${overdueContacts.length > 0 ? `
    <!-- Overdue -->
    <div style="background:#fff1f0;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:20px;">
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.05em;">
        ⚠️ Overdue (${overdueContacts.length})
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        ${overdueContacts.map(formatContact).join('')}
      </table>
    </div>
    ` : ''}

    ${todayContacts.length > 0 ? `
    <!-- Today -->
    <div style="background:#fff7f4;border:1px solid #fed7c3;border-radius:12px;padding:20px;margin-bottom:20px;">
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#FF6B35;text-transform:uppercase;letter-spacing:.05em;">
        📋 Due today (${todayContacts.length})
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        ${todayContacts.map(formatContact).join('')}
      </table>
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="https://followupfox.com" style="display:inline-block;background:#FF6B35;color:white;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;font-size:14px;">
        Open FollowUpFox →
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:32px;">
      FollowUpFox · <a href="https://followupfox.com" style="color:#9ca3af;">followupfox.com</a><br>
      You're receiving this because you signed up for daily digests.
    </p>
  </div>
</body>
</html>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: ud.email,
      subject: `🦊 ${ud.contacts.length} follow-up${ud.contacts.length > 1 ? 's' : ''} due today`,
      html,
    }),
  })

  const status = res.ok ? 'sent' : `error:${res.status}`
  return { email: ud.email, status }
}
