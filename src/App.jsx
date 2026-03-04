import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import TodaysList from './components/TodaysList'
import AddContactModal from './components/AddContactModal'
import ContactCard from './components/ContactCard'
import EmptyState from './components/EmptyState'
import { format, parseISO, isToday, isPast, isFuture, differenceInDays } from 'date-fns'

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🦊</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">FollowUpFox</h1>
          <p className="mt-1 text-gray-500 text-sm">Never lose a client because you forgot to follow up.</p>
        </div>

        {sent ? (
          <div className="text-center animate-fadeIn">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-lg font-semibold text-gray-900">Check your inbox</h2>
            <p className="mt-2 text-gray-500 text-sm">
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-fox-500 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fox-500 focus:border-transparent text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fox-500 hover:bg-fox-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Sending…' : 'Send magic link →'}
            </button>
            <p className="text-center text-xs text-gray-400">No password. No credit card. Free to start.</p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editContact, setEditContact] = useState(null)

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('follow_up_date', { ascending: true })
    if (!error) setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchContacts() }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleContactSaved = () => {
    fetchContacts()
    setShowAdd(false)
    setEditContact(null)
  }

  const handleSnooze = async (contact, days) => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + days)
    await supabase
      .from('contacts')
      .update({
        follow_up_date: format(newDate, 'yyyy-MM-dd'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id)
    fetchContacts()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    fetchContacts()
  }

  const todayContacts = contacts.filter((c) => {
    const d = parseISO(c.follow_up_date)
    return isToday(d) || (isPast(d) && !isToday(d))
  })

  const upcomingContacts = contacts.filter((c) => {
    const d = parseISO(c.follow_up_date)
    return isFuture(d) && !isToday(d)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦊</span>
            <span className="font-bold text-gray-900">FollowUpFox</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdd(true)}
              className="bg-fox-500 hover:bg-fox-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Add contact
            </button>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-gray-600 text-sm"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : (
          <>
            {/* Today's follow-ups */}
            <TodaysList
              contacts={todayContacts}
              onSnooze={handleSnooze}
              onEdit={(c) => { setEditContact(c); setShowAdd(true) }}
              onDelete={handleDelete}
            />

            {/* Upcoming */}
            {upcomingContacts.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Upcoming
                </h2>
                <div className="space-y-3">
                  {upcomingContacts.map((c) => (
                    <ContactCard
                      key={c.id}
                      contact={c}
                      onSnooze={handleSnooze}
                      onEdit={() => { setEditContact(c); setShowAdd(true) }}
                      onDelete={() => handleDelete(c.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {contacts.length === 0 && <EmptyState onAdd={() => setShowAdd(true)} />}
          </>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showAdd && (
        <AddContactModal
          contact={editContact}
          userId={user.id}
          onSaved={handleContactSaved}
          onClose={() => { setShowAdd(false); setEditContact(null) }}
        />
      )}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-3xl animate-pulse">🦊</span>
      </div>
    )
  }

  return session ? <Dashboard user={session.user} /> : <AuthScreen />
}
