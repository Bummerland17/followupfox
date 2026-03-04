import { useState } from 'react'
import { format, parseISO, differenceInDays, isToday, isPast } from 'date-fns'

const SNOOZE_OPTIONS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
]

export default function ContactCard({ contact, onSnooze, onEdit, onDelete, highlighted = false }) {
  const [showSnooze, setShowSnooze] = useState(false)
  const [customDate, setCustomDate] = useState('')

  const followDate = parseISO(contact.follow_up_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = differenceInDays(followDate, today)
  const overdue = diff < 0
  const dueToday = diff === 0

  const statusLabel = dueToday
    ? 'Today'
    : overdue
    ? `${Math.abs(diff)}d overdue`
    : `In ${diff}d`

  const statusColor = dueToday
    ? 'bg-fox-500 text-white'
    : overdue
    ? 'bg-red-100 text-red-600'
    : 'bg-gray-100 text-gray-500'

  const cardBg = highlighted
    ? 'bg-orange-50 border border-fox-200'
    : 'bg-white border border-gray-100'

  const handleCustomSnooze = () => {
    if (!customDate) return
    const d = parseISO(customDate)
    const daysFromNow = differenceInDays(d, today)
    onSnooze(contact, daysFromNow)
    setShowSnooze(false)
    setCustomDate('')
  }

  return (
    <div className={`rounded-xl p-4 shadow-sm ${cardBg} transition-all animate-slideUp`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
            {contact.company && (
              <span className="text-xs text-gray-400 truncate">@ {contact.company}</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="text-xs text-fox-500 hover:underline mt-0.5 block"
            >
              {contact.email}
            </a>
          )}

          {contact.notes && (
            <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{contact.notes}</p>
          )}

          <p className="text-xs text-gray-300 mt-2">
            Follow up: {format(followDate, 'MMM d, yyyy')}
          </p>
        </div>

        {/* Right: actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={() => setShowSnooze(!showSnooze)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Snooze
          </button>
          <button
            onClick={onEdit}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-gray-300 hover:text-red-400 px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Snooze panel */}
      {showSnooze && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center animate-fadeIn">
          <span className="text-xs text-gray-400 mr-1">Snooze to:</span>
          {SNOOZE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => { onSnooze(contact, opt.days); setShowSnooze(false) }}
              className="text-xs bg-fox-500 hover:bg-fox-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              {opt.label}
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-fox-300"
            />
            {customDate && (
              <button
                onClick={handleCustomSnooze}
                className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                Set
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
