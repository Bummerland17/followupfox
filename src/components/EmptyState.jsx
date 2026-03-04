export default function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16 animate-fadeIn">
      <div className="text-6xl mb-4">🦊</div>
      <h2 className="text-xl font-bold text-gray-800">No contacts yet</h2>
      <p className="mt-2 text-gray-400 text-sm max-w-xs mx-auto">
        Add your first contact and set a follow-up date. FollowUpFox will remind you every morning.
      </p>
      <button
        onClick={onAdd}
        className="mt-6 bg-fox-500 hover:bg-fox-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
      >
        Add your first contact →
      </button>
    </div>
  )
}
