import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../api/axios';
import { Event } from '../../types';
import Sidebar from '../../components/Sidebar';

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

const CalendarPickerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockPickerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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

// ── Shared DatePicker styles ──
const PICKER_STYLES = `
  .overflow-y-auto::-webkit-scrollbar { width: 6px; }
  .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
  .dark .overflow-y-auto::-webkit-scrollbar-track { background: #1c1c1c; }
  .overflow-y-auto::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .dark .overflow-y-auto::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
  .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #DC143C; }
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    overflow: hidden;
  }
  .dark .react-datepicker {
    background: #1c1c1c;
    border-color: #2a2a2a;
    color: #fff;
  }
  .react-datepicker__header {
    background: #fff;
    border-bottom: 1px solid #f3f4f6;
    padding: 16px 16px 8px;
  }
  .dark .react-datepicker__header {
    background: #1c1c1c;
    border-bottom-color: #2a2a2a;
  }
  .react-datepicker__current-month {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  .dark .react-datepicker__current-month { color: #fff; }
  .react-datepicker__day-name {
    color: #9ca3af;
    font-size: 11px;
    font-weight: 600;
    width: 2rem;
    line-height: 2rem;
  }
  .react-datepicker__day {
    width: 2rem;
    line-height: 2rem;
    border-radius: 8px;
    font-size: 13px;
    color: #374151;
    transition: all 0.15s;
  }
  .dark .react-datepicker__day { color: #e5e7eb; }
  .react-datepicker__day:hover {
    background: #fee2e2;
    color: #DC143C;
    border-radius: 8px;
  }
  .dark .react-datepicker__day:hover {
    background: rgba(220,20,60,0.15);
    color: #DC143C;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background: #DC143C !important;
    color: #fff !important;
    border-radius: 8px;
    font-weight: 700;
  }
  .react-datepicker__day--today { font-weight: 700; color: #DC143C; }
  .dark .react-datepicker__day--today { color: #ff6b6b; }
  .react-datepicker__day--outside-month { color: #d1d5db; }
  .dark .react-datepicker__day--outside-month { color: #4b5563; }
  .react-datepicker__navigation-icon::before { border-color: #9ca3af; }
  .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #DC143C; }
  .react-datepicker__month-container { background: #fff; }
  .dark .react-datepicker__month-container { background: #1c1c1c; }
  .react-datepicker__time-container {
    border-left: 1px solid #f3f4f6;
    width: 100px;
  }
  .dark .react-datepicker__time-container {
    border-left-color: #2a2a2a;
    background: #1c1c1c;
  }
  .react-datepicker__time { background: #fff; }
  .dark .react-datepicker__time { background: #1c1c1c !important; }
  .react-datepicker__time-list-item {
    height: auto !important;
    padding: 8px 12px !important;
    font-size: 13px;
    color: #374151;
    border-radius: 6px;
    margin: 2px 6px;
    transition: all 0.15s;
  }
  .dark .react-datepicker__time-list-item { color: #e5e7eb; }
  .react-datepicker__time-list-item:hover {
    background: #fee2e2 !important;
    color: #DC143C !important;
  }
  .dark .react-datepicker__time-list-item:hover {
    background: rgba(220,20,60,0.15) !important;
    color: #DC143C !important;
  }
  .react-datepicker__time-list-item--selected {
    background: #DC143C !important;
    color: #fff !important;
    font-weight: 700;
  }
  .react-datepicker__time-box { width: 100px !important; }
  .react-datepicker-time__header {
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    padding: 10px 0;
  }
  .dark .react-datepicker-time__header { color: #e5e7eb; }
  .react-datepicker__triangle { display: none; }
  .react-datepicker-popper { z-index: 9999 !important; }
  .dark .react-datepicker__time-list::-webkit-scrollbar { width: 4px; }
  .dark .react-datepicker__time-list::-webkit-scrollbar-track { background: #1c1c1c; }
  .dark .react-datepicker__time-list::-webkit-scrollbar-thumb {
    background: #3a3a3a;
    border-radius: 999px;
  }
  .dark .react-datepicker__time-list::-webkit-scrollbar-thumb:hover { background: #DC143C; }
  .dark .react-datepicker__time-list {
    background: #1c1c1c !important;
    scrollbar-color: #3a3a3a #1c1c1c;
  }
  .dark .react-datepicker__time-container .react-datepicker__time { background: #1c1c1c !important; }
  .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box { background: #1c1c1c !important; }
`;

// ── Custom input wrappers ──
const DateInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-left focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all flex items-center justify-between gap-2">
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>
        {value || placeholder}
      </span>
      <CalendarPickerIcon />
    </button>
  )
);

const TimeInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-left focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all flex items-center justify-between gap-2">
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>
        {value || placeholder}
      </span>
      <ClockPickerIcon />
    </button>
  )
);

// ── Computed display status from DB status + event_date ──
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

// ── Status Config (label + badge based on DB status) ──
const statusConfig: Record<string, { badge: string; label: string }> = {
  open:   { badge: 'bg-green-500 text-white',  label: 'OPEN'   },
  closed: { badge: 'bg-red-500 text-white',    label: 'CLOSED' },
  draft:  { badge: 'bg-gray-500 text-white',   label: 'DRAFT'  },
};

const timeStrToDate = (timeStr: string | null | undefined): Date | null => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const dateToTimeStr = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false });
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] to-[#ff4d6d]" />

        <div className="p-7">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registration Link</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[360px]">{event.title}</p>
          </div>

          {/* Link box */}
          <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#DC143C]/10 flex items-center justify-center flex-shrink-0 text-[#DC143C]">
                <LinkIcon />
              </div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest">Registration URL</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm text-[#DC143C] font-mono truncate">{registrationUrl}</p>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  copied
                    ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                    : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C]'
                }`}
              >
                {copied ? <><CheckIcon />Copied!</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          </div>

          {/* Access toggle */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-2xl overflow-hidden">
            {/* Open option */}
            <button
              onClick={() => !isOpen && !toggling && handleToggle()}
              disabled={toggling}
              className={`w-full flex items-center gap-4 px-5 py-4 transition-all text-left ${
                isOpen ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isOpen ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'
              }`}>
                <GlobeIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold transition-colors ${isOpen ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Open Registration
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Anyone with the link can register</p>
              </div>
              {isOpen && (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </button>

            <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

            {/* Closed option */}
            <button
              onClick={() => isOpen && !toggling && handleToggle()}
              disabled={toggling}
              className={`w-full flex items-center gap-4 px-5 py-4 transition-all text-left ${
                !isOpen ? 'bg-gray-50 dark:bg-[#2a2a2a]/50' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                !isOpen ? 'bg-gray-200 dark:bg-[#333] text-gray-500 dark:text-gray-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'
              }`}>
                <LockIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold transition-colors ${!isOpen ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                  Close Registration
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">New registrations are disabled</p>
              </div>
              {!isOpen && (
                <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Status + loading + Done button */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Status:&nbsp;
                <span className={`font-bold ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isOpen ? 'Registration Open' : 'Registration Closed'}
                </span>
              </p>
              {toggling && (
                <svg className="animate-spin h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Edit Modal ──
interface EditModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ event, onClose, onSuccess }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const safeDate = (val: string | null | undefined): Date | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [eventDate, setEventDate] = useState<Date | null>(() => {
    if (!event.event_date) return null;
    const d = new Date(event.event_date);
    if (isNaN(d.getTime())) return null;
    const phDate = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    return new Date(phDate.getUTCFullYear(), phDate.getUTCMonth(), phDate.getUTCDate());
  });
  const [startTime, setStartTime] = useState<Date | null>(timeStrToDate(event.start_time));
  const [endTime, setEndTime] = useState<Date | null>(timeStrToDate(event.end_time));
  const [venue, setVenue] = useState(event.venue || '');
  const [checkinCutoff, setCheckinCutoff] = useState<Date | null>(timeStrToDate(event.checkin_cutoff));
  const [registrationStart, setRegistrationStart] = useState<Date | null>(safeDate(event.registration_start));
  const [registrationEnd, setRegistrationEnd] = useState<Date | null>(safeDate(event.registration_end));
  const [showDescription, setShowDescription] = useState(!!event.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; eventDate?: string; venue?: string }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const originalValues = useRef({
    title: event.title || '',
    description: event.description || '',
    eventDate: (() => {
      if (!event.event_date) return '';
      const d = new Date(event.event_date);
      if (isNaN(d.getTime())) return '';
      const phDate = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      return `${phDate.getUTCFullYear()}-${String(phDate.getUTCMonth()+1).padStart(2,'0')}-${String(phDate.getUTCDate()).padStart(2,'0')}`;
    })(),
    startTime: event.start_time || '',
    endTime: event.end_time || '',
    venue: event.venue || '',
    checkinCutoff: event.checkin_cutoff || '',
    registrationStart: event.registration_start ? new Date(event.registration_start).toISOString() : '',
    registrationEnd: event.registration_end ? new Date(event.registration_end).toISOString() : '',
  });

  const isDirty = () => {
    const orig = originalValues.current;
    const currentEventDate = eventDate
      ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}`
      : '';
    // Compare times at HH:MM precision only (DB may store HH:MM:SS)
    const toHHMM = (t: string) => t ? t.slice(0, 5) : '';
    // Compare registration datetimes rounded to the minute to avoid ms drift
    const toMinute = (d: Date | null) => d ? Math.floor(d.getTime() / 60000).toString() : '';
    const origRegStart = orig.registrationStart ? Math.floor(new Date(orig.registrationStart).getTime() / 60000).toString() : '';
    const origRegEnd = orig.registrationEnd ? Math.floor(new Date(orig.registrationEnd).getTime() / 60000).toString() : '';
    return (
      title !== orig.title ||
      description !== orig.description ||
      currentEventDate !== orig.eventDate ||
      toHHMM(dateToTimeStr(startTime)) !== toHHMM(orig.startTime) ||
      toHHMM(dateToTimeStr(endTime)) !== toHHMM(orig.endTime) ||
      venue !== orig.venue ||
      toHHMM(dateToTimeStr(checkinCutoff)) !== toHHMM(orig.checkinCutoff) ||
      toMinute(registrationStart) !== origRegStart ||
      toMinute(registrationEnd) !== origRegEnd
    );
  };

  const handleClose = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const validate = () => {
    const errors: { title?: string; eventDate?: string; venue?: string } = {};
    if (!title.trim()) errors.title = 'Event name is required.';
    if (!eventDate) errors.eventDate = 'Event date is required.';
    if (!venue.trim()) errors.venue = 'Venue is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.put(`/events/${event.event_id}`, {
        title,
        description: description || null,
        event_date: eventDate ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}` : '',
        start_time: dateToTimeStr(startTime) || null,
        end_time: dateToTimeStr(endTime) || null,
        venue,
        checkin_cutoff: dateToTimeStr(checkinCutoff) || null,
        registration_start: registrationStart ? registrationStart.toISOString() : null,
        registration_end: registrationEnd ? registrationEnd.toISOString() : null,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <style>{PICKER_STYLES}</style>

    {/* Discard Confirmation */}
    {showDiscardConfirm && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Discard changes?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your edits will be lost if you leave now.</p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
              >
                Keep Editing
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] to-[#ff4d6d] flex-shrink-0" />
        <div className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-xl transition-colors">
            <XIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <form id="edit-event-form" onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Event Name <span className="text-[#DC143C]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => { if (e.target.value.length <= 100) setTitle(e.target.value); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: undefined })); }}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.title
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                    : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'
                }`}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {fieldErrors.title}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-500">{title.length}/100 characters</p>
                {!showDescription && (
                  <button type="button" onClick={() => setShowDescription(true)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#DC143C] border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:border-[#DC143C] transition-colors">
                    Add description
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            {showDescription && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Description (Optional)</label>
                  <button type="button" onClick={() => { setShowDescription(false); setDescription(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 dark:border-red-800 rounded-lg hover:border-red-500 transition-colors">
                    Remove description
                  </button>
                </div>
                <textarea value={description} onChange={e => { if (e.target.value.length <= 500) setDescription(e.target.value); }} rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description.length}/500 characters</p>
              </div>
            )}

            {/* Date + Times */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Date <span className="text-[#DC143C]">*</span>
                </label>
                <DatePicker
                  selected={eventDate}
                  onChange={(date: Date | null) => { setEventDate(date); if (fieldErrors.eventDate) setFieldErrors(p => ({ ...p, eventDate: undefined })); }}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Pick a date"
                  customInput={<DateInput />}
                  popperPlacement="bottom-start"
                />
                {fieldErrors.eventDate && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {fieldErrors.eventDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (Start)</label>
                <DatePicker selected={startTime} onChange={(date: Date | null) => setStartTime(date)}
                  showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa"
                  placeholderText="Pick start time" customInput={<TimeInput />} popperPlacement="bottom-start" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (End)</label>
                <DatePicker selected={endTime} onChange={(date: Date | null) => setEndTime(date)}
                  showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa"
                  placeholderText="Pick end time" customInput={<TimeInput />} popperPlacement="bottom-start" />
              </div>
            </div>

            {/* Date + Time summary */}
            {eventDate && startTime && endTime && (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333333] px-4 py-3 rounded-xl">
                <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {`This event will take place on ${eventDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} from ${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} to ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                </p>
              </div>
            )}

            {/* Venue */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Venue <span className="text-[#DC143C]">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={e => { if (e.target.value.length <= 200) setVenue(e.target.value); if (fieldErrors.venue) setFieldErrors(p => ({ ...p, venue: undefined })); }}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.venue
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                    : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'
                }`}
              />
              {fieldErrors.venue && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {fieldErrors.venue}
                </p>
              )}
            </div>

            {/* Check-in Cutoff */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check-in Cutoff (Optional)</label>
              <DatePicker selected={checkinCutoff} onChange={(date: Date | null) => setCheckinCutoff(date)}
                showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Cutoff" dateFormat="h:mm aa"
                placeholderText="Pick cutoff time" customInput={<TimeInput />} popperPlacement="bottom-start" />
            </div>

            {/* Registration Window */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">Registration Window</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Set when participants can register for this event. (Optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Registration Opens</label>
                  <DatePicker
                    selected={registrationStart}
                    onChange={(date: Date | null) => setRegistrationStart(date)}
                    showTimeSelect timeIntervals={15} timeCaption="Time"
                    dateFormat="MMM d, yyyy h:mm aa"
                    placeholderText="Pick start date & time"
                    customInput={<DateInput />}
                    popperPlacement="bottom-start"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Registration Closes</label>
                  <DatePicker
                    selected={registrationEnd}
                    onChange={(date: Date | null) => setRegistrationEnd(date)}
                    showTimeSelect timeIntervals={15} timeCaption="Time"
                    dateFormat="MMM d, yyyy h:mm aa"
                    placeholderText="Pick end date & time"
                    customInput={<DateInput />}
                    popperPlacement="bottom-start"
                    minDate={registrationStart || undefined}
                  />
                </div>
              </div>

              {registrationStart && registrationEnd && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333333] px-4 py-3 rounded-xl mt-3">
                  <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {`Registration open from ${registrationStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at ${registrationStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} until ${registrationEnd.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at ${registrationEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                  </p>
                </div>
              )}

              {registrationStart && registrationEnd && registrationEnd <= registrationStart && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Registration end must be after registration start.
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
          <button type="button" onClick={handleClose}
            className="px-6 py-3 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#333333] transition-all">
            Cancel
          </button>
          <button type="submit" form="edit-event-form" disabled={loading}
            className="px-6 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

// ── Delete Modal ──
interface DeleteModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
          <TrashIcon />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Delete Event</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <span className="font-semibold text-gray-700 dark:text-gray-200">"{event.title}"</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#333333] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</>
            ) : 'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Publish Modal ──
interface PublishModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const PublishModal: React.FC<PublishModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Publish Event</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to publish <span className="font-semibold text-gray-700 dark:text-gray-200">"{event.title}"</span>? It will be visible and open for registration.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#333333] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Publishing...</>
            ) : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>
  </div>
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
        <button onClick={onUndo}
          className="ml-2 px-3 py-1.5 text-xs font-bold text-[#DC143C] border border-[#DC143C]/30 rounded-lg hover:bg-[#DC143C]/10 transition-colors flex-shrink-0">
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
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [publishingEvent, setPublishingEvent] = useState<Event | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setOpenSortDropdown(false);
      }
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

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      const snapshot = deletingEvent;
      await api.delete(`/events/${deletingEvent.event_id}`);
      setDeletingEvent(null);
      setUndoSnapshot(snapshot);
      setToast({
        message: 'Event deleted successfully',
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
      console.error('Failed to delete event:', err);
    } finally {
      setDeleteLoading(false);
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
    .filter(event => filter === 'all' ? true : getDisplayStatus(event) === filter)
    .filter(event => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(q) ||
        (event.venue || '').toLowerCase().includes(q)
      );
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
                <button onClick={() => navigate('/admin/events/create')}
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
          {/* Row 1: Filters + Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'ongoing', label: 'Ongoing' },
                { key: 'completed', label: 'Completed' },
                { key: 'draft', label: 'Draft' },
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
                      {key === 'draft'
                        ? events.filter(e => e.status === 'draft').length
                        : events.filter(e => getDisplayStatus(e) === key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setOpenSortDropdown(prev => !prev)}
                className="flex items-center justify-between gap-2 px-4 py-2 w-[160px] bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#333333] transition-all shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
                </svg>
                <span>{sortBy}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${openSortDropdown ? 'rotate-180' : ''}`}>
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
                    <button key={key}
                      onClick={() => { setSortBy(key); setOpenSortDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        sortBy === key
                          ? 'text-[#DC143C] bg-red-50 dark:bg-[#DC143C]/10 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                      }`}
                    >
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

          {/* Row 2: Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events by name or venue..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
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
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-[#DC143C] hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4" ref={dropdownRef}>
              {sortedEvents.map((event) => {
                const phDate = new Date(new Date(event.event_date).getTime() + 8 * 60 * 60 * 1000);
                return (
                  <div key={event.event_id}
                    onClick={() => navigate(`/admin/events/${event.event_id}`)}
                    className="group bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_24px_0px_rgba(255,255,255,0.12)] transition-all duration-200 cursor-pointer border border-gray-100 dark:border-[#2a2a2a] hover:border-gray-200 dark:hover:border-[#2a2a2a] flex flex-col"
                  >
                    <div className="relative h-[140px] flex-shrink-0 rounded-t-2xl overflow-hidden bg-gray-100 dark:bg-[#2a2a2a]">
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-24 h-24 text-gray-400">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      {/* Title + status badge */}
                      <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-[#2a2a2a]">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 flex-1">
                          {event.title}
                        </h3>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${(statusConfig[event.status] || statusConfig.draft).badge}`}>
                          {(statusConfig[event.status] || statusConfig.draft).label}
                        </span>
                      </div>
                      <div className="flex gap-3 mb-4 min-h-[52px] items-center">
                        <div className="flex-shrink-0 text-center w-10">
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{phDate.getUTCDate()}</div>
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">
                            {phDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                          </div>
                          <div className="text-[10px] font-semibold text-gray-300 dark:text-gray-600 mt-0.5">{phDate.getUTCFullYear()}</div>
                        </div>
                        <div className="w-px bg-gray-100 dark:bg-[#2a2a2a] flex-shrink-0" />
                        <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex-shrink-0"><LocationIcon /></span>
                            <span className="truncate">{event.venue || 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-500">
                            <span className="flex-shrink-0"><UsersIcon /></span>
                            <span>{(event as any).registered_count ?? 0} registered</span>
                          </div>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <div className="mt-auto relative">
                          <button
                            onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === event.event_id ? null : event.event_id); }}
                            className="w-full py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] dark:hover:border-[#DC143C] dark:hover:text-[#DC143C] transition-all"
                          >
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
                                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 19V5M5 12l7-7 7 7"/></svg> Publish
                                </button>
                              ) : (
                                <button onClick={() => { setRegistrationEvent(event); setOpenDropdown(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors">
                                  <LinkIcon /> Registration
                                </button>
                              )}
                              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
                              <button onClick={() => { setDeletingEvent(event); setOpenDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <TrashIcon /> Delete
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

      {editingEvent && <EditModal event={editingEvent} onClose={() => setEditingEvent(null)} onSuccess={handleEditSuccess} />}
      {deletingEvent && <DeleteModal event={deletingEvent} onClose={() => setDeletingEvent(null)} onConfirm={handleDelete} loading={deleteLoading} />}
      {publishingEvent && <PublishModal event={publishingEvent} onClose={() => setPublishingEvent(null)} onConfirm={handlePublish} loading={publishLoading} />}
      {registrationEvent && (
        <RegistrationModal
          event={registrationEvent}
          onClose={() => setRegistrationEvent(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {toast && <SuccessToast message={toast.message} onUndo={toast.onUndo} />}
      {registrationToast && <RegistrationToast type={registrationToast} />}
    </div>
  );
};

export default EventManagement;