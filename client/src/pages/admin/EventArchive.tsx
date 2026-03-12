import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Event } from '../../types';

// ── Icons ──
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const RestoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Shared cancel button ──
const CancelBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
  >
    Cancel
  </button>
);

// ── Shared Modal Shell ──
interface ModalShellProps {
  onClose: () => void;
  icon: React.ReactNode;
  iconClass?: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ onClose, icon, iconClass = 'text-gray-500 dark:text-gray-400', title, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
        <div className="flex items-center gap-3">
          <span className={iconClass}>{icon}</span>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
          <XIcon />
        </button>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      {/* Body */}
      <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {children}
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        {footer}
      </div>
    </div>
  </div>
);

// ── Restore Modal ──
const RestoreModal: React.FC<{ event: Event; onClose: () => void; onConfirm: () => void; loading: boolean }> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell
    onClose={onClose}
    icon={<RestoreIcon />}
    title="Restore Event"
    footer={
      <>
        <CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Restoring...</>
            : 'Restore Event'}
        </button>
      </>
    }
  >
    <p>
      Restore <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span> back to the main events page? It will reappear as a completed event.
    </p>
  </ModalShell>
);

// ── Trash Modal ──
const TrashModal: React.FC<{ event: Event; onClose: () => void; onConfirm: () => void; loading: boolean }> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell
    onClose={onClose}
    icon={<TrashIcon />}
    iconClass="text-red-500 dark:text-red-400"
    title="Move to Trash"
    footer={
      <>
        <CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Moving...</>
            : 'Move to Trash'}
        </button>
      </>
    }
  >
    <p>
      Move <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span> to trash? It will be removed from the archive and can be permanently deleted or restored from the Trash Bin.
    </p>
  </ModalShell>
);

// ── Success Toast ──
const SuccessToast: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-stretch bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden min-w-[280px]">
    <div className="w-3 bg-green-500 flex-shrink-0" />
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0 text-green-500">
        <CheckIcon />
      </div>
      <p className="text-sm font-bold text-gray-800 dark:text-white">{message}</p>
    </div>
  </div>
);

// ── Main Component ──
export default function EventArchive() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringEvent, setRestoringEvent] = useState<Event | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [trashingEvent, setTrashingEvent] = useState<Event | null>(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fetchArchived(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchArchived = async () => {
    try {
      const res = await api.get('/events/archived');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch archived events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoringEvent) return;
    setRestoreLoading(true);
    try {
      await api.post(`/events/${restoringEvent.event_id}/restore-archive`);
      const title = restoringEvent.title;
      setRestoringEvent(null);
      setToast(`"${title}" restored successfully`);
      fetchArchived();
    } catch (err) {
      console.error('Failed to restore event:', err);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleTrash = async () => {
    if (!trashingEvent) return;
    setTrashLoading(true);
    try {
      await api.delete(`/events/${trashingEvent.event_id}`);
      const title = trashingEvent.title;
      setTrashingEvent(null);
      setToast(`"${title}" moved to trash`);
      fetchArchived();
    } catch (err) {
      console.error('Failed to trash event:', err);
    } finally {
      setTrashLoading(false);
    }
  };

  const filtered = events.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.venue || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-auto">

        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center gap-4">
            <button onClick={() => navigate('/admin/events')}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mr-2">
              <ArrowLeftIcon />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-[28px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              Event<span className="text-[#DC143C]">.</span>Archive
            </h1>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <span className="font-semibold text-gray-600 dark:text-gray-300">{events.length}</span>
              archived event{events.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 px-12 py-2.5">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Archived events are hidden from the main page. All attendance data, scan logs, and reports are fully preserved. You can restore any event at any time.
          </p>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-5">

          {/* Search */}
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search archived events…"
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            )}
          </div>

          {/* Event grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#252525] flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {searchQuery ? `No archived events found for "${searchQuery}"` : 'No archived events yet'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {!searchQuery && 'Completed events you archive will appear here.'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-[#DC143C] hover:underline">Clear search</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filtered.map(event => {
                const phDate = new Date(new Date(event.event_date).getTime() + 8 * 60 * 60 * 1000);
                const archivedAt = event.updated_at
                  ? new Date(event.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                  : null;
                const posterSrc = event.poster_url
                  ? event.poster_url.startsWith('http')
                    ? event.poster_url
                    : `http://localhost:5000${event.poster_url}`
                  : null;

                return (
                  <div key={event.event_id}
                    onClick={() => navigate(`/admin/events/${event.event_id}`)}
                    className="group bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_24px_0px_rgba(255,255,255,0.05)] transition-all duration-200 cursor-pointer border border-gray-100 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] flex flex-col opacity-90 hover:opacity-100"
                  >
                    {/* Image area */}
                    <div className="relative h-[120px] flex-shrink-0 rounded-t-2xl overflow-hidden bg-gray-100 dark:bg-[#252525]">
                      {posterSrc ? (
                        <img src={posterSrc} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-20 h-20 text-gray-800 dark:text-gray-200">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/50 text-white backdrop-blur-sm">
                          ARCHIVED
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="text-base font-bold text-gray-800 dark:text-white leading-snug line-clamp-2 mb-3 pb-3 border-b border-gray-100 dark:border-[#2a2a2a]">
                        {event.title}
                      </h3>

                      <div className="flex gap-3 mb-4 min-h-[48px] items-center">
                        <div className="flex-shrink-0 text-center w-10">
                          <div className="text-2xl font-extrabold text-gray-700 dark:text-gray-300 leading-none">{phDate.getUTCDate()}</div>
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">{phDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</div>
                          <div className="text-[10px] font-semibold text-gray-300 dark:text-gray-600 mt-0.5">{phDate.getUTCFullYear()}</div>
                        </div>
                        <div className="w-px bg-gray-100 dark:bg-[#2a2a2a] flex-shrink-0" />
                        <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex-shrink-0"><LocationIcon /></span>
                            <span className="truncate">{event.venue || 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex-shrink-0"><UsersIcon /></span>
                            <span>{(event as any).registered_count ?? 0} registered</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        {archivedAt && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                            Archived {archivedAt}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); setRestoringEvent(event); }}
                            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-green-400 hover:text-green-600 dark:hover:border-green-700 dark:hover:text-green-400 transition-all flex items-center justify-center gap-1.5"
                          >
                            <RestoreIcon />
                            Restore
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setTrashingEvent(event); }}
                            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400 transition-all flex items-center justify-center gap-1.5"
                          >
                            <TrashIcon />
                            Trash
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {restoringEvent && <RestoreModal event={restoringEvent} onClose={() => setRestoringEvent(null)} onConfirm={handleRestore} loading={restoreLoading} />}
      {trashingEvent && <TrashModal event={trashingEvent} onClose={() => setTrashingEvent(null)} onConfirm={handleTrash} loading={trashLoading} />}
      {toast && <SuccessToast message={toast} />}
    </div>
  );
}