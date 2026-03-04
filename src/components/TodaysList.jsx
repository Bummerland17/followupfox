import ContactCard from './ContactCard'

export default function TodaysList({ contacts, onSnooze, onEdit, onDelete }) {
  if (contacts.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Follow up today
          </h2>
          <span className="bg-gray-100 text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full">0</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-medium text-gray-700">You're all caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No follow-ups due today.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-fox-600 uppercase tracking-wider">
          Follow up today
        </h2>
        <span className="bg-fox-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {contacts.length}
        </span>
      </div>

      <div className="space-y-3">
        {contacts.map((c) => (
          <ContactCard
            key={c.id}
            contact={c}
            highlighted={true}
            onSnooze={onSnooze}
            onEdit={() => onEdit(c)}
            onDelete={() => onDelete(c.id)}
          />
        ))}
      </div>
    </section>
  )
}
