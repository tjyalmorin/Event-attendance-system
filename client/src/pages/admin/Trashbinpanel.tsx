import { Event } from '../../types'

// ── Icons ──
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ── Props ──
interface TrashBinPanelProps {
  trashedEvents: Event[]
  trashLoading: boolean
  restoringId: number | null
  permDeletingId: number | null
  onClose: () => void
  onRestore: (event_id: number) => void
  onPermanentDelete: (event_id: number, title: string) => void
}

const TrashBinPanel: React.FC<TrashBinPanelProps> = ({
  trashedEvents,
  trashLoading,
  restoringId,
  permDeletingId,
  onClose,
  onRestore,
  onPermanentDelete,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl h-full bg-white dark:bg-[#1c1c1c] border-l border-gray-200 dark:border-[#2a2a2a] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
              <TrashIcon />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Trash</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {trashedEvents.length} deleted event{trashedEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {trashLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC143C]" />
            </div>
          ) : trashedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-300 dark:text-gray-600">
                <TrashIcon />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">Trash is empty</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trashedEvents.map(event => (
                <div
                  key={event.event_id}
                  className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl px-5 py-4"
                >
                  <div className="mb-3">
                    <div className="font-semibold text-gray-800 dark:text-white text-sm leading-snug">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {event.event_date} · Deleted{' '}
                      {(event as any).deleted_at
                        ? new Date((event as any).deleted_at).toLocaleDateString('en-PH')
                        : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRestore(event.event_id)}
                      disabled={restoringId === event.event_id}
                      className="flex-1 py-2 text-xs font-semibold text-green-600 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                    >
                      {restoringId === event.event_id ? 'Restoring...' : '↩ Restore'}
                    </button>
                    <button
                      onClick={() => onPermanentDelete(event.event_id, event.title)}
                      disabled={permDeletingId === event.event_id}
                      className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {permDeletingId === event.event_id ? 'Deleting...' : 'Delete Forever'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Deleted events are kept here until permanently removed.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TrashBinPanel