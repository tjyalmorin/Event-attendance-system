import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrashedEventsApi, restoreEventApi, permanentDeleteEventApi } from '../../api/events.api'
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

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

  const [trashedEvents, setTrashedEvents] = useState<Event[]>([])
  const [trashLoading, setTrashLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [permDeletingId, setPermDeletingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const filteredEvents = trashedEvents.filter(event => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      event.title.toLowerCase().includes(q) ||
      (event.venue ?? '').toLowerCase().includes(q) ||
      (event.event_date ?? '').toLowerCase().includes(q)
    )
  })

  const allSelected = filteredEvents.length > 0 && selected.length === filteredEvents.length
  const someSelected = selected.length > 0

  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : filteredEvents.map(e => e.event_id))
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
    setDeleteLoading(true)
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
    setDeleteLoading(false)
    setToast('Event permanently deleted')
  }

  const pendingDeleteEvents = trashedEvents.filter(e => pendingDeleteIds.includes(e.event_id))

  return (
    <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/events')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon />
                Back
              </button>
              <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
                Event<span className="text-[#DC143C]">.</span>Trash
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[900px] mx-auto px-8 py-8">

          {/* Search bar */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by event name or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#DC143C]/20 focus:border-[#DC143C] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* Select all row + bulk actions */}
          {!trashLoading && filteredEvents.length > 0 && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2.5">
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
                  Select all ({filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''})
                </span>
              </div>

              {someSelected && (
                <div className="flex items-center gap-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-2.5">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-1">
                    {selected.length} selected
                  </span>
                  <div className="w-px h-4 bg-gray-200 dark:bg-[#2a2a2a]" />
                  <button
                    onClick={handleBulkRestore}
                    className="px-4 py-1.5 text-sm font-semibold text-green-600 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    ↩ Restore
                  </button>
                  <button
                    onClick={handleBulkDeleteForeverClick}
                    className="px-4 py-1.5 text-sm font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Forever
                  </button>
                  <button
                    onClick={() => setSelected([])}
                    className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Body */}
          {trashLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DC143C]" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
                  {search ? 'No events match your search' : 'Trash is empty'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {search ? 'Try a different keyword' : 'Deleted events will appear here'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEvents.map(event => {
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
                          {event.event_date}
                          {event.venue ? ` · ${event.venue}` : ''}
                          {' · Deleted '}
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

          {trashedEvents.length > 0 && !search && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
              Deleted events are kept here until permanently removed.
            </p>
          )}
        </div>

      {/* ── Delete Forever Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
              <div className="flex items-center gap-3">
                <span className="text-red-500"><TrashIcon /></span>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Forever?</h2>
              </div>
              <button
                onClick={() => { setShowDeleteConfirm(false); setPendingDeleteIds([]) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"
              >
                <XIcon />
              </button>
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

            {/* Body */}
            <div className="px-5 py-5 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pendingDeleteEvents.length === 1
                  ? <><strong className="text-gray-700 dark:text-gray-200">{pendingDeleteEvents[0].title}</strong> will be permanently deleted and cannot be recovered.</>
                  : <>These <strong className="text-gray-700 dark:text-gray-200">{pendingDeleteEvents.length} events</strong> will be permanently deleted and cannot be recovered.</>
                }
              </p>
              {pendingDeleteEvents.length > 1 && (
                <div className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
                  {pendingDeleteEvents.map((event, idx) => (
                    <div
                      key={event.event_id}
                      className={`px-4 py-2.5 ${idx !== pendingDeleteEvents.length - 1 ? 'border-b border-gray-100 dark:border-[#2a2a2a]' : ''}`}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setPendingDeleteIds([]) }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</>
                  : 'Delete Forever'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <SuccessToast message={toast} />}
    </div>
  )
}

export default TrashBin