import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrashedEventsApi, restoreEventApi, permanentDeleteEventApi } from '../../api/events.api'
import { Event } from '../../types'
import Sidebar from '../../components/Sidebar'

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

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Success Toast ──
const SuccessToast: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-stretch bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden min-w-[280px]">
    <div className="w-3 bg-green-500 flex-shrink-0" />
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0 text-green-500">
        <CheckIcon />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800 dark:text-white">Success</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  </div>
)

const TrashBin: React.FC = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [trashedEvents, setTrashedEvents] = useState<Event[]>([])
  const [trashLoading, setTrashLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [permDeletingId, setPermDeletingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchTrashedEvents()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchTrashedEvents = async () => {
    setTrashLoading(true)
    try {
      const data = await getTrashedEventsApi()
      setTrashedEvents(data || [])
    } catch (error) {
      console.error('Failed to fetch trash:', error)
    } finally {
      setTrashLoading(false)
    }
  }

  const allSelected = trashedEvents.length > 0 && selected.length === trashedEvents.length
  const someSelected = selected.length > 0

  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : trashedEvents.map(e => e.event_id))
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleRestore = async (event_id: number) => {
    setRestoringId(event_id)
    try {
      await restoreEventApi(event_id)
      setTrashedEvents(prev => prev.filter(e => e.event_id !== event_id))
      setSelected(prev => prev.filter(id => id !== event_id))
      setToast('Event restored successfully')
    } catch (err) {
      console.error('Failed to restore:', err)
    } finally {
      setRestoringId(null)
    }
  }

  const handleBulkRestore = async () => {
    for (const id of selected) {
      await handleRestore(id)
    }
    setSelected([])
  }

  const handleSingleDeleteForeverClick = (event_id: number) => {
    setPendingDeleteIds([event_id])
    setShowDeleteConfirm(true)
  }

  const handleBulkDeleteForeverClick = () => {
    setPendingDeleteIds(selected)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    for (const id of pendingDeleteIds) {
      setPermDeletingId(id)
      try {
        await permanentDeleteEventApi(id)
        setTrashedEvents(prev => prev.filter(e => e.event_id !== id))
      } catch (err) {
        console.error('Failed to permanently delete:', err)
      }
    }
    setPermDeletingId(null)
    setSelected([])
    setPendingDeleteIds([])
    setShowDeleteConfirm(false)
    setToast('Event permanently deleted')
  }

  const pendingDeleteEvents = trashedEvents.filter(e => pendingDeleteIds.includes(e.event_id))

  return (
    <div className="flex min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <Sidebar userRole={user.role === 'staff' ? 'staff' : 'admin'} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/events')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  <ArrowLeftIcon />
                  Back
                </button>
                <div className="w-px h-5 bg-gray-200 dark:bg-[#2a2a2a]" />
                <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
                  Event<span className="text-[#DC143C]">.</span>Trash
                </h1>
              </div>
              {someSelected && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {selected.length} selected
                  </span>
                  <button
                    onClick={handleBulkRestore}
                    className="px-4 py-2 text-sm font-semibold text-green-600 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    ↩ Restore
                  </button>
                  <button
                    onClick={handleBulkDeleteForeverClick}
                    className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Forever
                  </button>
                  <button
                    onClick={() => setSelected([])}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[900px] mx-auto px-8 py-8">
          {/* Select all row */}
          {!trashLoading && trashedEvents.length > 0 && (
            <div className="flex items-center gap-2.5 mb-4">
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
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Select all ({trashedEvents.length} event{trashedEvents.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Body */}
          {trashLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DC143C]" />
            </div>
          ) : trashedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-500 dark:text-gray-400">Trash is empty</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Deleted events will appear here</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trashedEvents.map(event => {
                const isSelected = selected.includes(event.event_id)
                return (
                  <div
                    key={event.event_id}
                    className={`border rounded-2xl px-5 py-4 transition-all bg-white dark:bg-[#1c1c1c] ${
                      isSelected
                        ? 'border-[#DC143C]/30 dark:border-[#DC143C]/30 bg-red-50 dark:bg-[#DC143C]/5'
                        : 'border-gray-200 dark:border-[#2a2a2a]'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
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
                        onClick={() => handleRestore(event.event_id)}
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

          {/* Footer note */}
          {trashedEvents.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
              Deleted events are kept here until permanently removed.
            </p>
          )}
        </div>
      </div>

      {/* Delete Forever Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
              <div className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-y-auto max-h-[180px]">
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

      {toast && <SuccessToast message={toast} />}
    </div>
  )
}

export default TrashBin