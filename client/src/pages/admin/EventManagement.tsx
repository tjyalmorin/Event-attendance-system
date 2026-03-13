import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { Event } from '../../types';
import EditEventModal from '../../components/EditEventModal';
import { useDarkMode } from '../../contexts/DarkModeContext';

/* ─── Google Font: DM Sans + Syne ──────────────────────────────────────── */
const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

    .em-root { font-family: 'DM Sans', sans-serif; }
    .em-display { font-family: 'Outfit', sans-serif; }

    @keyframes em-fade-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes em-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes em-pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: .6; transform: scale(1.4); }
    }
    .em-card {
      animation: em-fade-up .35s ease both;
    }
    .em-card:nth-child(1)  { animation-delay: .03s }
    .em-card:nth-child(2)  { animation-delay: .07s }
    .em-card:nth-child(3)  { animation-delay: .11s }
    .em-card:nth-child(4)  { animation-delay: .15s }
    .em-card:nth-child(5)  { animation-delay: .19s }
    .em-card:nth-child(6)  { animation-delay: .23s }
    .em-card:nth-child(7)  { animation-delay: .27s }
    .em-card:nth-child(8)  { animation-delay: .31s }
    .em-skel {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
      background-size: 400px 100%;
      animation: em-shimmer 1.4s ease infinite;
    }
    .dark .em-skel {
      background: linear-gradient(90deg, #252525 25%, #333 37%, #252525 63%);
      background-size: 400px 100%;
    }
    .em-dot-pulse { animation: em-pulse-dot 1.8s ease-in-out infinite; }
    .em-card-hover {
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }
    .em-card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(220,20,60,.10);
      border-color: rgba(220,20,60,.25) !important;
    }
    .dark .em-card-hover:hover {
      box-shadow: 0 12px 32px rgba(220,20,60,.15);
    }
    .em-img-zoom img {
      transition: transform .4s ease;
    }
    .em-img-zoom:hover img {
      transform: scale(1.06);
    }
    .em-filter-tab {
      transition: all .2s ease;
    }
    .em-filter-tab:hover:not(.active) {
      background: rgba(220,20,60,.06);
      border-color: rgba(220,20,60,.3) !important;
      color: #DC143C !important;
    }
  `}</style>
);

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const ArchiveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const PublishIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
);
const DuplicateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* ─── Computed display status ────────────────────────────────────────────── */
const getDisplayStatus = (event: Event): string => {
  if (event.status === 'draft') return 'draft';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const phDate = new Date(new Date(event.event_date).getTime() + 8 * 60 * 60 * 1000);
  const eventDay = new Date(phDate.getUTCFullYear(), phDate.getUTCMonth(), phDate.getUTCDate());
  if (eventDay.getTime() === today.getTime()) return 'ongoing';
  if (eventDay > today) return 'upcoming';
  return 'completed';
};

/* ─── Status badge config ────────────────────────────────────────────────── */
const statusConfig: Record<string, { pill: string; dot?: boolean; label: string }> = {
  upcoming:  { pill: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40',  label: 'Upcoming' },
  ongoing:   { pill: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40', label: 'Ongoing', dot: true },
  completed: { pill: 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#3a3a3a]', label: 'Completed' },
  draft:     { pill: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700/50', label: 'Draft' },
};

/* ─── Shared Cancel Button ───────────────────────────────────────────────── */
const CancelBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
  >
    Cancel
  </button>
);

/* ─── Shared Modal Shell ─────────────────────────────────────────────────── */
interface ModalShellProps {
  onClose: () => void;
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}
const ModalShell: React.FC<ModalShellProps> = ({ onClose, icon, iconBg = 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400', title, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm em-root">
    <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-hidden shadow-2xl dark:shadow-[0_30px_60px_rgba(0,0,0,.7)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</span>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white em-display">{title}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors">
          <XIcon />
        </button>
      </div>
      <div className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#141414]">{footer}</div>
    </div>
  </div>
);

/* ─── Registration Toast ─────────────────────────────────────────────────── */
const RegistrationToast: React.FC<{ type: 'opened' | 'closed' }> = ({ type }) => {
  const isOpened = type === 'opened';
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-stretch rounded-2xl shadow-2xl overflow-hidden min-w-[280px] em-root border border-gray-100 dark:border-[#2a2a2a]">
      <div className={`w-1 flex-shrink-0 ${isOpened ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-[#1c1c1c]">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOpened ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
          {isOpened ? <GlobeIcon /> : <LockIcon />}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {isOpened ? 'Registration Opened' : 'Registration Closed'}
        </p>
      </div>
    </div>
  );
};

/* ─── Registration Modal ─────────────────────────────────────────────────── */
interface RegistrationModalProps {
  event: Event;
  onClose: () => void;
  onStatusChange: (eventId: number, status: string, event: Event) => void;
}
const RegistrationModal: React.FC<RegistrationModalProps> = ({ event, onClose, onStatusChange }) => {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const registrationUrl = `${window.location.origin}/register/${event.event_id}`;
  const isOpen = event.status === 'open';

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleToggle = async () => {
    setToggling(true);
    const newStatus = isOpen ? 'closed' : 'open';
    await onStatusChange(event.event_id, newStatus, event);
    setToggling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm em-root">
      <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-hidden shadow-2xl dark:shadow-[0_30px_60px_rgba(0,0,0,.7)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#DC143C]/10 text-[#DC143C]"><LinkIcon /></span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white em-display">Registration Link</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[240px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors">
            <XIcon />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* URL row */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3">
            <p className="flex-1 text-sm text-[#DC143C] font-mono truncate">{registrationUrl}</p>
            <button onClick={handleCopy}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                  : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C]'
              }`}>
              {copied ? <><CheckIcon />Copied!</> : <><CopyIcon />Copy</>}
            </button>
          </div>
          {/* Toggle options */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
            <button onClick={() => !isOpen && !toggling && handleToggle()} disabled={toggling}
              className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all ${isOpen ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#222]'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
                <GlobeIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>Open Registration</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Anyone with the link can register</p>
              </div>
              {isOpen && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white"><CheckIcon /></div>}
            </button>
            <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
            <button onClick={() => isOpen && !toggling && handleToggle()} disabled={toggling}
              className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all ${!isOpen ? 'bg-gray-50/80 dark:bg-[#222]/60' : 'hover:bg-gray-50 dark:hover:bg-[#222]'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!isOpen ? 'bg-gray-200 dark:bg-[#333] text-gray-500 dark:text-gray-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
                <LockIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!isOpen ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>Close Registration</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">New registrations are disabled</p>
              </div>
              {!isOpen && <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center flex-shrink-0 text-white"><CheckIcon /></div>}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#141414]">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Status:&nbsp;
            <span className={`font-semibold ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
            {toggling && <svg className="inline ml-2 animate-spin h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-colors hover:bg-gray-800 dark:hover:bg-gray-100">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Archive Modal ──────────────────────────────────────────────────────── */
interface ArchiveModalProps { event: Event; onClose: () => void; onConfirm: () => void; loading: boolean; }
const ArchiveModal: React.FC<ArchiveModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell onClose={onClose} icon={<ArchiveIcon />} iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-500" title="Archive Event"
    footer={
      <><CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100">
          {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Archiving...</> : 'Archive Event'}
        </button>
      </>
    }>
    <p>Archive <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span>? It will be removed from the main view but all data — attendance records, scan logs, and reports — will be preserved.</p>
    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">You can restore this event anytime from the Archive page.</p>
  </ModalShell>
);

/* ─── Trash Modal ────────────────────────────────────────────────────────── */
interface TrashModalProps { event: Event; onClose: () => void; onConfirm: () => void; loading: boolean; }
const TrashModal: React.FC<TrashModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell onClose={onClose} icon={<TrashIcon />} iconBg="bg-red-50 dark:bg-red-900/20 text-[#DC143C]" title="Move to Trash"
    footer={
      <><CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
          {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Moving...</> : 'Move to Trash'}
        </button>
      </>
    }>
    <p>Move <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span> to trash? You can restore it later from the Trash page.</p>
  </ModalShell>
);

/* ─── Publish Modal ──────────────────────────────────────────────────────── */
interface PublishModalProps { event: Event; onClose: () => void; onConfirm: () => void; loading: boolean; }
const PublishModal: React.FC<PublishModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell onClose={onClose} icon={<PublishIcon />} iconBg="bg-[#DC143C]/10 text-[#DC143C]" title="Publish Event"
    footer={
      <><CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
          {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Publishing...</> : 'Publish Event'}
        </button>
      </>
    }>
    <p>Publish <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span>? It will be visible and open for registration.</p>
  </ModalShell>
);

/* ─── Success Toast ──────────────────────────────────────────────────────── */
const SuccessToast: React.FC<{ message: string; onUndo?: () => void }> = ({ message, onUndo }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-stretch bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden min-w-[280px] em-root">
    <div className="w-1 bg-[#DC143C] flex-shrink-0" />
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="w-8 h-8 rounded-full bg-[#DC143C]/10 flex items-center justify-center flex-shrink-0 text-[#DC143C]">
        <CheckIcon />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Done</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>
      </div>
      {onUndo && (
        <button onClick={onUndo} className="ml-2 px-3 py-1.5 text-xs font-bold text-[#DC143C] border border-[#DC143C]/30 rounded-lg hover:bg-[#DC143C]/10 transition-colors flex-shrink-0">
          Undo
        </button>
      )}
    </div>
  </div>
);

/* ─── Skeleton Card ──────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
    <div className="em-skel h-[160px] w-full rounded-none" />
    <div className="p-4 space-y-3">
      <div className="em-skel h-4 w-3/4 rounded-lg" />
      <div className="em-skel h-3 w-1/2 rounded-lg" />
      <div className="em-skel h-3 w-2/3 rounded-lg" />
      <div className="em-skel h-2 w-full rounded-full mt-4" />
      <div className="em-skel h-8 w-full rounded-xl mt-2" />
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const EventManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useDarkMode();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('Last Updated');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [openSortDropdown, setOpenSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [trashingEvent, setTrashingEvent] = useState<Event | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [publishingEvent, setPublishingEvent] = useState<Event | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [archivingEvent, setArchivingEvent] = useState<Event | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [copyingEventId, setCopyingEventId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  const [registrationToast, setRegistrationToast] = useState<'opened' | 'closed' | null>(null);
  const [, setUndoSnapshot] = useState<Event | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    if (location.state?.created) {
      setToast({ message: 'Event created successfully' });
      window.history.replaceState({}, '');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) setOpenSortDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (toast) {
      const duration = toast.onUndo ? 10000 : 3000;
      const timer = setTimeout(() => setToast(null), duration);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (registrationToast) {
      const timer = setTimeout(() => setRegistrationToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [registrationToast]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrash = async () => {
    if (!trashingEvent) return;
    setTrashLoading(true);
    try {
      const snapshot = trashingEvent;
      await api.delete(`/events/${trashingEvent.event_id}`);
      setTrashingEvent(null);
      setUndoSnapshot(snapshot);
      setToast({
        message: 'Event moved to trash',
        onUndo: async () => {
          try {
            await api.post('/events', {
              title: snapshot.title,
              description: snapshot.description || null,
              event_date: snapshot.event_date,
              start_time: snapshot.start_time,
              end_time: snapshot.end_time,
              venue: snapshot.venue,
              capacity: snapshot.capacity || null,
              checkin_cutoff: snapshot.checkin_cutoff || null,
              registration_start: null,
              registration_end: null,
            });
            setToast({ message: 'Event restored successfully' });
            fetchEvents();
          } catch (err) { console.error('Failed to restore event:', err); }
        }
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to trash event:', err);
    } finally { setTrashLoading(false); }
  };

  const handlePublish = async () => {
    if (!publishingEvent) return;
    setPublishLoading(true);
    try {
      await api.put(`/events/${publishingEvent.event_id}`, {
        title: publishingEvent.title,
        description: publishingEvent.description,
        event_date: publishingEvent.event_date,
        start_time: publishingEvent.start_time,
        end_time: publishingEvent.end_time,
        venue: publishingEvent.venue,
        checkin_cutoff: publishingEvent.checkin_cutoff,
        registration_start: publishingEvent.registration_start,
        registration_end: publishingEvent.registration_end,
        status: 'open',
      });
      setPublishingEvent(null);
      setToast({ message: 'Event published successfully' });
      fetchEvents();
    } catch (err) { console.error('Failed to publish event:', err); }
    finally { setPublishLoading(false); }
  };

  const handleArchive = async () => {
    if (!archivingEvent) return;
    setArchiveLoading(true);
    try {
      await api.put(`/events/${archivingEvent.event_id}`, {
        title: archivingEvent.title,
        description: archivingEvent.description,
        event_date: archivingEvent.event_date,
        start_time: archivingEvent.start_time,
        end_time: archivingEvent.end_time,
        venue: archivingEvent.venue,
        checkin_cutoff: archivingEvent.checkin_cutoff,
        registration_start: archivingEvent.registration_start,
        registration_end: archivingEvent.registration_end,
        status: 'archived',
      });
      setArchivingEvent(null);
      setToast({ message: `"${archivingEvent.title}" has been archived` });
      fetchEvents();
    } catch (err) { console.error('Failed to archive event:', err); }
    finally { setArchiveLoading(false); }
  };

  const handleCopy = async (event: Event) => {
    setCopyingEventId(event.event_id);
    try {
      await api.post(`/events/${event.event_id}/copy`);
      setToast({ message: `"Copy of ${event.title}" created as draft` });
      fetchEvents();
    } catch (err) {
      console.error('Failed to copy event:', err);
      setToast({ message: 'Failed to create copy. Please try again.' });
    } finally { setCopyingEventId(null); }
  };

  const handleEditSuccess = () => {
    setEditingEvent(null);
    setToast({ message: 'Event updated successfully' });
    fetchEvents();
  };

  const handleStatusChange = async (event_id: number, status: string, event: Event) => {
    try {
      await api.put(`/events/${event_id}`, {
        title: event.title, description: event.description,
        event_date: event.event_date, start_time: event.start_time,
        end_time: event.end_time, venue: event.venue,
        capacity: event.capacity, checkin_cutoff: event.checkin_cutoff, status,
      });
      setEvents(prev => prev.map(e => e.event_id === event_id ? { ...e, status: status as Event['status'] } : e));
      if (registrationEvent?.event_id === event_id) {
        setRegistrationEvent(prev => prev ? { ...prev, status: status as Event['status'] } : prev);
      }
      setRegistrationToast(status === 'open' ? 'opened' : 'closed');
    } catch (err: any) { console.error('Failed to update status:', err); }
  };

  const filteredEvents = events
    .filter(event => event.status !== 'archived')
    .filter(event => filter === 'all' ? true : getDisplayStatus(event) === filter)
    .filter(event => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return event.title.toLowerCase().includes(q) || (event.venue || '').toLowerCase().includes(q);
    });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'Event Date') return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    if (sortBy === 'Name') return a.title.localeCompare(b.title);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  /* ── Filter tab counts ── */
  const counts = {
    all: events.filter(e => e.status !== 'archived').length,
    upcoming: events.filter(e => getDisplayStatus(e) === 'upcoming').length,
    ongoing: events.filter(e => getDisplayStatus(e) === 'ongoing').length,
    completed: events.filter(e => getDisplayStatus(e) === 'completed').length,
    draft: events.filter(e => e.status === 'draft').length,
  };

  const filterTabs = [
    { key: 'all',       label: 'All Events',  count: counts.all },
    { key: 'upcoming',  label: 'Upcoming',     count: counts.upcoming },
    { key: 'ongoing',   label: 'Ongoing',      count: counts.ongoing },
    { key: 'completed', label: 'Completed',    count: counts.completed },
    ...(user.role === 'admin' ? [{ key: 'draft', label: 'Draft', count: counts.draft }] : []),
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#111] em-root">
      <FontImport />

      {/* ── Floating Header ─────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-8 pt-7 pb-4">
        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-lg shadow-gray-200/60 dark:shadow-[0_8px_32px_rgba(0,0,0,.4)]">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white em-display leading-none">Event Management</h1>
            </div>
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin/events/create')}
                className="flex items-center gap-2 bg-[#DC143C] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#b01030] transition-all hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 active:scale-95"
              >
                <PlusIcon />
                New Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Big Container: Filter Bar + Event Cards ──────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-8 pb-10">
        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-lg shadow-gray-200/60 dark:shadow-[0_8px_32px_rgba(0,0,0,.4)] overflow-visible">

          {/* ── Filter + Search + Sort ── */}
          <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterTabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`em-filter-tab flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    filter === key
                      ? 'active bg-[#DC143C] border-[#DC143C] text-white shadow-sm shadow-red-300/30 dark:shadow-red-900/30'
                      : 'bg-transparent border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {label}
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
              {user.role === 'admin' && <div className="h-5 w-px bg-gray-200 dark:bg-[#2a2a2a] mx-1" />}
              {user.role === 'admin' && (
                <>
                  <button onClick={() => navigate('/admin/events/archive')} title="Archive"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:border-amber-400 hover:text-amber-500 dark:hover:border-amber-700 dark:hover:text-amber-400 transition-all">
                    <ArchiveIcon />
                  </button>
                  <button onClick={() => navigate('/admin/events/trash')} title="Trash"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:border-red-300 hover:text-[#DC143C] dark:hover:border-red-800 dark:hover:text-red-400 transition-all">
                    <TrashIcon />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search event, location, etc"
                  className="w-[240px] pl-10 pr-9 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/15 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <XIcon />
                  </button>
                )}
              </div>

              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setOpenSortDropdown(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all whitespace-nowrap"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
                  </svg>
                  {sortBy}
                  <span className={`transition-transform duration-200 ${openSortDropdown ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                </button>
                {openSortDropdown && (
                  <div className="absolute right-0 top-11 z-50 w-44 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a]">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sort by</p>
                    </div>
                    {[
                      { key: 'Last Updated', label: 'Last Updated' },
                      { key: 'Event Date', label: 'Event Date' },
                      { key: 'Name', label: 'Name' },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => { setSortBy(key); setOpenSortDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          sortBy === key ? 'text-[#DC143C] bg-red-50 dark:bg-[#DC143C]/10 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                        }`}>
                        {label}
                        {sortBy === key && <CheckIcon />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Event Cards ── */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-gray-200 dark:text-gray-700 mb-4"><GridIcon /></div>
                <p className="text-base font-semibold text-gray-500 dark:text-gray-500">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No events found'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                  {searchQuery ? 'Try a different search term.' : 'Create your first event to get started.'}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-sm font-semibold text-[#DC143C] hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-5" ref={dropdownRef}>
                {sortedEvents.map((event) => {
              const phDate = new Date(new Date(event.event_date).getTime() + 8 * 60 * 60 * 1000);
              const displayStatus = getDisplayStatus(event);
              const sc = statusConfig[displayStatus] || statusConfig.draft;
              const isOpen = event.status === 'open';
              const isClosed = event.status === 'closed';
              const isDraft = event.status === 'draft';
              const isCopying = copyingEventId === event.event_id;
              const registered = (event as any).registered_count ?? 0;

              return (
                <div
                  key={event.event_id}
                  onClick={() => navigate(`/admin/events/${event.event_id}`)}
                  className="em-card em-card-hover group bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] flex flex-col cursor-pointer overflow-hidden"
                >
                  {/* ── Poster image ── */}
                  <div className="relative h-[160px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#242424] dark:to-[#1a1a1a] em-img-zoom">
                    {((event as any).preset_url || event.poster_url) ? (
                      <img
                        src={(event as any).preset_url || event.poster_url || ''}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-16 h-16 text-gray-300 dark:text-gray-700">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Status pill — top right */}
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.pill}`}>
                        {sc.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 em-dot-pulse flex-shrink-0" />}
                        {sc.label}
                      </span>
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Title */}
                    <h3 className="em-display text-[17px] font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-3 pb-3 border-b border-gray-100 dark:border-[#2a2a2a]">
                      {event.title}
                    </h3>

                    {/* Date + venue row */}
                    <div className="flex gap-3 mb-4 items-center min-h-[52px]">
                      {/* Big date block */}
                      <div className="flex-shrink-0 text-center w-10">
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{phDate.getUTCDate()}</div>
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">{phDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</div>
                        <div className="text-[10px] font-semibold text-gray-300 dark:text-gray-600 mt-0.5">{phDate.getUTCFullYear()}</div>
                      </div>
                      {/* Divider */}
                      <div className="w-px self-stretch bg-gray-100 dark:bg-[#2a2a2a] flex-shrink-0" />
                      {/* Venue + registered */}
                      <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <LocationIcon />
                          <span className="truncate">{event.venue || 'Venue TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 text-gray-400 dark:text-gray-500"><UsersIcon /></span>
                          <span className="text-sm text-gray-500 dark:text-gray-500">{registered} registered</span>
                          {!isDraft && (isOpen || isClosed) && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isOpen
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#2a2a2a]'
                            }`}>
                              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isOpen ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              {isOpen ? 'Open' : 'Closed'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {user.role === 'admin' && (
                      <div className="mt-auto relative">
                        <button
                          onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === event.event_id ? null : event.event_id); }}
                          className="w-full py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] dark:hover:border-[#DC143C] dark:hover:text-[#DC143C] transition-all"
                        >
                          Actions
                        </button>
                        {openDropdown === event.event_id && (
                          <div
                            onClick={e => e.stopPropagation()}
                            className="absolute bottom-11 left-0 right-0 z-50 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
                          >
                            <button onClick={() => { setEditingEvent(event); setOpenDropdown(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                              <EditIcon /> Edit
                            </button>
                            {event.status === 'draft' ? (
                              <button onClick={() => { setPublishingEvent(event); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                                <PublishIcon /> Publish
                              </button>
                            ) : (
                              <button onClick={() => { setRegistrationEvent(event); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                                <LinkIcon /> Registration
                              </button>
                            )}
                            <button
                              onClick={() => { handleCopy(event); setOpenDropdown(null); }}
                              disabled={isCopying}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
                              {isCopying
                                ? <><svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Copying...</>
                                : <><DuplicateIcon />Create Copy</>
                              }
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
                            {displayStatus === 'completed' && (
                              <button onClick={() => { setArchivingEvent(event); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                                <ArchiveIcon /> Archive
                              </button>
                            )}
                            <button onClick={() => { setTrashingEvent(event); setOpenDropdown(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <TrashIcon /> Trash
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            )}

            {/* ── Showing count ── */}
            {!loading && sortedEvents.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-6 text-center">
                Showing <span className="font-semibold text-gray-600 dark:text-gray-400">{sortedEvents.length}</span> of{' '}
                <span className="font-semibold text-gray-600 dark:text-gray-400">{events.filter(e => e.status !== 'archived').length}</span> events
              </p>
            )}
          </div>{/* end p-6 cards section */}

        </div>{/* end big container card */}
      </div>{/* end outer px-8 pb-10 */}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {editingEvent && <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} onSuccess={handleEditSuccess} />}
      {trashingEvent && <TrashModal event={trashingEvent} onClose={() => setTrashingEvent(null)} onConfirm={handleTrash} loading={trashLoading} />}
      {archivingEvent && <ArchiveModal event={archivingEvent} onClose={() => setArchivingEvent(null)} onConfirm={handleArchive} loading={archiveLoading} />}
      {publishingEvent && <PublishModal event={publishingEvent} onClose={() => setPublishingEvent(null)} onConfirm={handlePublish} loading={publishLoading} />}
      {registrationEvent && <RegistrationModal event={registrationEvent} onClose={() => setRegistrationEvent(null)} onStatusChange={handleStatusChange} />}
      {toast && <SuccessToast message={toast.message} onUndo={toast.onUndo} />}
      {registrationToast && <RegistrationToast type={registrationToast} />}
    </div>
  );
};

export default EventManagement;