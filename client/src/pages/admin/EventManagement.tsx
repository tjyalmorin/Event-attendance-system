import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { Event } from '../../types';
import Sidebar from '../../components/Sidebar';
import EditEventModal from '../../components/EditEventModal';

// ── SVG Icons ──
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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

// ── Computed display status ──
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

// Timeline badge config
const timelineConfig: Record<string, { badge: string; label: string; dot?: boolean }> = {
  upcoming:  { badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50', label: 'UPCOMING' },
  ongoing:   { badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50', label: 'ONGOING', dot: true },
  completed: { badge: 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#3a3a3a]', label: 'COMPLETED' },
  draft:     { badge: 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-[#3a3a3a]', label: 'DRAFT' },
};

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

// ── Registration Toast ──
const RegistrationToast: React.FC<{ type: 'opened' | 'closed' }> = ({ type }) => {
  const isOpened = type === 'opened';
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-stretch rounded-xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden min-w-[280px]">
      <div className={`w-3 flex-shrink-0 ${isOpened ? 'bg-green-500' : 'bg-gray-400'}`} />
      <div className="flex items-center gap-3 px-4 py-4 flex-1 bg-white dark:bg-[#1c1c1c]">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isOpened ? 'border-green-500 text-green-500' : 'border-gray-400 text-gray-400'}`}>
          {isOpened ? <GlobeIcon /> : <LockIcon />}
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {isOpened ? 'Registration Opened' : 'Registration Closed'}
        </p>
      </div>
    </div>
  );
};

// ── Registration Modal ──
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400"><LinkIcon /></span>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Registration Link</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[260px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
            <XIcon />
          </button>
        </div>
        <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3">
            <p className="flex-1 text-sm text-[#DC143C] font-mono truncate">{registrationUrl}</p>
            <button onClick={handleCopy}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                  : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C]'
              }`}>
              {copied ? <><CheckIcon />Copied!</> : <><CopyIcon />Copy</>}
            </button>
          </div>
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
            <button onClick={() => !isOpen && !toggling && handleToggle()} disabled={toggling}
              className={`w-full flex items-center gap-4 px-4 py-3.5 transition-all text-left ${isOpen ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
                <GlobeIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isOpen ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Open Registration</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Anyone with the link can register</p>
              </div>
              {isOpen && <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"/></svg></div>}
            </button>
            <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
            <button onClick={() => isOpen && !toggling && handleToggle()} disabled={toggling}
              className={`w-full flex items-center gap-4 px-4 py-3.5 transition-all text-left ${!isOpen ? 'bg-gray-50 dark:bg-[#2a2a2a]/50' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!isOpen ? 'bg-gray-200 dark:bg-[#333] text-gray-500 dark:text-gray-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
                <LockIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!isOpen ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>Close Registration</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">New registrations are disabled</p>
              </div>
              {!isOpen && <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"/></svg></div>}
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Status:&nbsp;
              <span className={`font-bold ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {isOpen ? 'Registration Open' : 'Registration Closed'}
              </span>
            </p>
            {toggling && <svg className="animate-spin h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Archive Modal ──
interface ArchiveModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell
    onClose={onClose}
    icon={<ArchiveIcon />}
    title="Archive Event"
    footer={
      <>
        <CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Archiving...</>
            : 'Archive Event'}
        </button>
      </>
    }
  >
    <p>
      Archive <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span>? It will be removed from the main view but all data — attendance records, scan logs, and reports — will be preserved.
    </p>
    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">You can restore this event anytime from the Archive page.</p>
  </ModalShell>
);

// ── Trash Modal ──
interface TrashModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const TrashModal: React.FC<TrashModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell
    onClose={onClose}
    icon={<TrashIcon />}
    iconClass="text-red-500 dark:text-red-400"
    title="Trash Event"
    footer={
      <>
        <CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Moving to Trash...</>
            : 'Move to Trash'}
        </button>
      </>
    }
  >
    <p>
      Move <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span> to trash? You can restore it later from the Trash page.
    </p>
  </ModalShell>
);

// ── Publish Modal ──
interface PublishModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const PublishModal: React.FC<PublishModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <ModalShell
    onClose={onClose}
    icon={<PublishIcon />}
    title="Publish Event"
    footer={
      <>
        <CancelBtn onClick={onClose} />
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Publishing...</>
            : 'Publish Event'}
        </button>
      </>
    }
  >
    <p>
      Publish <span className="font-semibold text-gray-800 dark:text-gray-200">"{event.title}"</span>? It will be visible and open for registration.
    </p>
  </ModalShell>
);

// ── Success Toast ──
const SuccessToast: React.FC<{ message: string; onUndo?: () => void }> = ({ message, onUndo }) => (
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
      {onUndo && (
        <button onClick={onUndo} className="ml-2 px-3 py-1.5 text-xs font-bold text-[#DC143C] border border-[#DC143C]/30 rounded-lg hover:bg-[#DC143C]/10 transition-colors flex-shrink-0">
          Undo
        </button>
      )}
    </div>
  </div>
);

// ── Main Component ──
const EventManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
          } catch (err) {
            console.error('Failed to restore event:', err);
          }
        }
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to trash event:', err);
    } finally {
      setTrashLoading(false);
    }
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
    } catch (err) {
      console.error('Failed to publish event:', err);
    } finally {
      setPublishLoading(false);
    }
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
    } catch (err) {
      console.error('Failed to archive event:', err);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setEditingEvent(null);
    setToast({ message: 'Event updated successfully' });
    fetchEvents();
  };

  const handleStatusChange = async (event_id: number, status: string, event: Event) => {
    try {
      await api.put(`/events/${event_id}`, {
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        venue: event.venue,
        capacity: event.capacity,
        checkin_cutoff: event.checkin_cutoff,
        status,
      });
      setEvents(prev => prev.map(e => e.event_id === event_id ? { ...e, status: status as Event['status'] } : e));
      if (registrationEvent?.event_id === event_id) {
        setRegistrationEvent(prev => prev ? { ...prev, status: status as Event['status'] } : prev);
      }
      setRegistrationToast(status === 'open' ? 'opened' : 'closed');
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
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

  return (
    <div className="flex min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <Sidebar userRole={user.role === 'staff' ? 'staff' : 'admin'} />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
                Event<span className="text-[#DC143C]">.</span>Management
              </h1>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/events/create')}
                  className="flex items-center gap-2 bg-[#DC143C] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#b01030] transition-all hover:shadow-lg">
                  <PlusIcon />
                  Create Event
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters + Search + Sort */}
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'ongoing', label: 'Ongoing' },
                { key: 'completed', label: 'Completed' },
                ...(user.role === 'admin' ? [{ key: 'draft', label: 'Draft' }] : []),
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    filter === key
                      ? 'bg-[#DC143C] border-[#DC143C] text-white shadow-sm shadow-red-200'
                      : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                  }`}
                >
                  {label}
                  {key !== 'all' && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {key === 'draft' ? events.filter(e => e.status === 'draft').length : events.filter(e => getDisplayStatus(e) === key).length}
                    </span>
                  )}
                </button>
              ))}
              {user.role === 'admin' && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => navigate('/admin/events/archive')} title="Archive"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-400 hover:border-amber-400 hover:text-amber-500 dark:hover:border-amber-700 dark:hover:text-amber-400 transition-all">
                    <ArchiveIcon />
                  </button>
                  <button onClick={() => navigate('/admin/events/trash')} title="Trash"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-400 hover:border-red-300 hover:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400 transition-all">
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
            <div className="relative" ref={sortDropdownRef}>
              <button onClick={() => setOpenSortDropdown(prev => !prev)}
                className="flex items-center justify-between gap-2 px-4 py-2 w-[160px] bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#333333] transition-all shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
                </svg>
                <span>{sortBy}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${openSortDropdown ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {openSortDropdown && (
                <div className="absolute right-0 top-11 z-50 w-44 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sort by</p>
                  </div>
                  {[
                    { key: 'Last Updated', label: 'Last Updated' },
                    { key: 'Event Date', label: 'Event Date' },
                    { key: 'Name', label: 'Name' },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => { setSortBy(key); setOpenSortDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${sortBy === key ? 'text-[#DC143C] bg-red-50 dark:bg-[#DC143C]/10 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}>
                      {label}
                      {sortBy === key && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#DC143C]">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events by name or venue..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            )}
          </div>
        </div>

        {/* Event Cards */}
        <div className="max-w-[1400px] mx-auto px-8 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C]"></div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600"><GridIcon /></div>
              <p className="text-gray-500 dark:text-gray-500">
                {searchQuery ? `No events found for "${searchQuery}"` : 'No events found'}
              </p>
              {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-[#DC143C] hover:underline">Clear search</button>}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4" ref={dropdownRef}>
              {sortedEvents.map((event) => {
                const phDate = new Date(new Date(event.event_date).getTime() + 8 * 60 * 60 * 1000);
                const displayStatus = getDisplayStatus(event);
                const tl = timelineConfig[displayStatus] || timelineConfig.draft;
                const isOpen = event.status === 'open';
                const isClosed = event.status === 'closed';
                const isDraft = event.status === 'draft';
                return (
                  <div key={event.event_id}
                    onClick={() => navigate(`/admin/events/${event.event_id}`)}
                    className="group bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_24px_0px_rgba(255,255,255,0.05)] transition-all duration-200 cursor-pointer border border-gray-100 dark:border-[#2a2a2a] hover:border-gray-200 dark:hover:border-[#3a3a3a] flex flex-col"
                  >
                    <div className="relative h-[140px] flex-shrink-0 rounded-t-2xl overflow-hidden bg-gray-100 dark:bg-[#2a2a2a]">
                      {((event as any).preset_url || event.poster_url) ? (
                        <img
                          src={(event as any).preset_url || event.poster_url || ''}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-24 h-24 text-gray-400">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${tl.badge}`}>
                          {tl.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
                          {tl.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-3 pb-3 border-b border-gray-100 dark:border-[#2a2a2a]">{event.title}</h3>
                      <div className="flex gap-3 mb-4 min-h-[52px] items-center">
                        <div className="flex-shrink-0 text-center w-10">
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{phDate.getUTCDate()}</div>
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">{phDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</div>
                          <div className="text-[10px] font-semibold text-gray-300 dark:text-gray-600 mt-0.5">{phDate.getUTCFullYear()}</div>
                        </div>
                        <div className="w-px bg-gray-100 dark:bg-[#2a2a2a] flex-shrink-0" />
                        <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex-shrink-0"><LocationIcon /></span>
                            <span className="truncate">{event.venue || 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 text-gray-400 dark:text-gray-500"><UsersIcon /></span>
                            <span className="text-sm text-gray-500 dark:text-gray-500">{(event as any).registered_count ?? 0} registered</span>
                            {!isDraft && (
                              <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isOpen
                                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                  : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#2a2a2a]'
                              }`}>
                                <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {isOpen ? 'Open' : isClosed ? 'Closed' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <div className="mt-auto relative">
                          <button onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === event.event_id ? null : event.event_id); }}
                            className="w-full py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] dark:hover:border-[#DC143C] dark:hover:text-[#DC143C] transition-all">
                            Actions
                          </button>
                          {openDropdown === event.event_id && (
                            <div onClick={e => e.stopPropagation()}
                              className="absolute bottom-11 left-0 right-0 z-50 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                              <button onClick={() => { setEditingEvent(event); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors">
                                <EditIcon /> Edit
                              </button>
                              {event.status === 'draft' ? (
                                <button onClick={() => { setPublishingEvent(event); setOpenDropdown(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors">
                                  <PublishIcon /> Publish
                                </button>
                              ) : (
                                <button onClick={() => { setRegistrationEvent(event); setOpenDropdown(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors">
                                  <LinkIcon /> Registration
                                </button>
                              )}
                              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
                              {displayStatus === 'completed' && (
                                <button onClick={() => { setArchivingEvent(event); setOpenDropdown(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors">
                                  <ArchiveIcon /> Archive
                                </button>
                              )}
                              <button onClick={() => { setTrashingEvent(event); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
        </div>
      </div>

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