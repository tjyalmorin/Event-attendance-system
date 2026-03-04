import React, { useState } from 'react'
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
  onBulkRestore?: (ids: number[]) => void
  onBulkPermanentDelete?: (ids: number[]) => void
}

const TrashBinPanel: React.FC<TrashBinPanelProps> = ({
  trashedEvents,
  trashLoading,
  restoringId,
  permDeletingId,
  onClose,
  onRestore,
  onPermanentDelete,
  onBulkRestore,
  onBulkPermanentDelete,
}) => {
  const [selected, setSelected] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])

  const allSelected = trashedEvents.length > 0 && selected.length === trashedEvents.length
  const someSelected = selected.length > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([])
    } else {
      setSelected(trashedEvents.map(e => e.event_id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkRestore = () => {
    if (onBulkRestore) {
      onBulkRestore(selected)
    } else {
      selected.forEach(id => onRestore(id))
    }
    setSelected([])
  }

  const handleBulkDeleteForeverClick = () => {
    setPendingDeleteIds(selected)
    setShowDeleteConfirm(true)
  }

  const handleSingleDeleteForeverClick = (event_id: number) => {
    setPendingDeleteIds([event_id])
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (onBulkPermanentDelete) {
      onBulkPermanentDelete(pendingDeleteIds)
    } else {
      pendingDeleteIds.forEach(id => {
        const event = trashedEvents.find(e => e.event_id === id)
        if (event) onPermanentDelete(id, event.title)
      })
    }
    setSelected([])
    setPendingDeleteIds([])
    setShowDeleteConfirm(false)
  }

  const pendingDeleteEvents = trashedEvents.filter(e => pendingDeleteIds.includes(e.event_id))

  return (
    <>
      <style>{`
        .trash-scroll::-webkit-scrollbar { width: 6px; }
        .trash-scroll::-webkit-scrollbar-track { background: transparent; }
        .dark .trash-scroll::-webkit-scrollbar-track { background: #1c1c1c; }
        .trash-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
        .dark .trash-scroll::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
        .trash-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .dark .trash-scroll::-webkit-scrollbar-thumb:hover { background: #DC143C; }
      `}</style>
      {/* Delete Forever Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                <TrashIcon />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Delete Forever?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingDeleteEvents.length === 1
                    ? 'This event will be permanently deleted and cannot be recovered.'
                    : `These ${pendingDeleteEvents.length} events will be permanently deleted and cannot be recovered.`}
                </p>
              </div>

              {/* Event list */}
              <div className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-y-auto trash-scroll max-h-[180px]">
                {pendingDeleteEvents.map((event, idx) => (
                  <div
                    key={event.event_id}
                    className={`px-4 py-2.5 text-left ${idx !== pendingDeleteEvents.length - 1 ? 'border-b border-gray-100 dark:border-[#2a2a2a]' : ''}`}
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setPendingDeleteIds([]) }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {someSelected ? (
              // ── Selection mode header ──
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors border-[#DC143C] bg-[#DC143C]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      {allSelected
                        ? <polyline points="20 6 9 17 4 12"/>
                        : <line x1="5" y1="12" x2="19" y2="12"/>
                      }
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {selected.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkRestore}
                    className="px-3 py-1.5 text-xs font-semibold text-green-600 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    ↩ Restore
                  </button>
                  <button
                    onClick={handleBulkDeleteForeverClick}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Forever
                  </button>
                  <button
                    onClick={() => setSelected([])}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>
              </div>
            ) : (
              // ── Default header ──
              <>
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
              </>
            )}
          </div>

          {/* Select All row — only when there are events */}
          {!trashLoading && trashedEvents.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  allSelected
                    ? 'border-[#DC143C] bg-[#DC143C]'
                    : 'border-gray-300 dark:border-[#3a3a3a] hover:border-[#DC143C]'
                }`}
              >
                {allSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Select all</span>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto trash-scroll px-6 py-5">
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
                {trashedEvents.map(event => {
                  const isSelected = selected.includes(event.event_id)
                  return (
                    <div
                      key={event.event_id}
                      className={`border rounded-2xl px-5 py-4 transition-all ${
                        isSelected
                          ? 'bg-red-50 dark:bg-[#DC143C]/5 border-[#DC143C]/30 dark:border-[#DC143C]/30'
                          : 'bg-gray-50 dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(event.event_id)}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'border-[#DC143C] bg-[#DC143C]'
                              : 'border-gray-300 dark:border-[#3a3a3a] hover:border-[#DC143C]'
                          }`}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
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
                      </div>
                      <div className="flex items-center gap-2 pl-8">
                        <button
                          onClick={() => onRestore(event.event_id)}
                          disabled={restoringId === event.event_id}
                          className="flex-1 py-2 text-xs font-semibold text-green-600 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                        >
                          {restoringId === event.event_id ? 'Restoring...' : '↩ Restore'}
                        </button>
                        <button
                          onClick={() => handleSingleDeleteForeverClick(event.event_id)}
                          disabled={permDeletingId === event.event_id}
                          className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          {permDeletingId === event.event_id ? 'Deleting...' : 'Delete Forever'}
                        </button>
                      </div>
                    </div>
                  )
                })}
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
    </>
  )
}

export default TrashBinPanel