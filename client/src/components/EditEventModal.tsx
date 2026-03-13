import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api/axios';
import { Event } from '../types';
import { useBranches } from '../hooks/useBranches';
import { getStaffByBranchesApi, getEventStaffApi } from '../api/events.api';

interface BranchSelection { branch_name: string; teams: string[] }
interface StaffUser { user_id: string; full_name: string; agent_code: string; branch_name: string; email: string }

// ── Icons ──
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);


// ── Preset Images (Cloudinary) ──
const PRESET_IMAGES = [
  { id: 'stock1',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224134/primelog/presets/stock1.jpg' },
  { id: 'stock2',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224137/primelog/presets/stock2.jpg' },
  { id: 'stock3',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224138/primelog/presets/stock3.jpg' },
  { id: 'stock4',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224139/primelog/presets/stock4.jpg' },
  { id: 'stock5',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224141/primelog/presets/stock5.jpg' },
  { id: 'stock6',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224142/primelog/presets/stock6.jpg' },
  { id: 'stock7',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224145/primelog/presets/stock7.jpg' },
  { id: 'stock8',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224146/primelog/presets/stock8.jpg' },
  { id: 'stock9',  url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224147/primelog/presets/stock9.jpg' },
  { id: 'stock10', url: 'https://res.cloudinary.com/dy9ncj3pj/image/upload/v1773224135/primelog/presets/stock10.jpg' },
];

// ── Numbered section divider ──
const SectionDivider: React.FC<{ label: string; step: number }> = ({ label, step }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#DC143C] text-white text-[10px] font-bold flex-shrink-0">{step}</span>
    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
  </div>
);

// ── Field error ──
const FieldError: React.FC<{ msg?: string }> = ({ msg }) => msg ? (
  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {msg}
  </p>
) : null;

// ── Shared DatePicker styles ──
const PICKER_STYLES = `
  .overflow-y-auto::-webkit-scrollbar { width: 6px; }
  .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
  .dark .overflow-y-auto::-webkit-scrollbar-track { background: #1c1c1c; }
  .overflow-y-auto::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .dark .overflow-y-auto::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
  .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #DC143C; }
  .react-datepicker { font-family: inherit; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
  .dark .react-datepicker { background: #1c1c1c; border-color: #2a2a2a; color: #fff; }
  .react-datepicker__header { background: #fff; border-bottom: 1px solid #f3f4f6; padding: 16px 16px 8px; }
  .dark .react-datepicker__header { background: #1c1c1c; border-bottom-color: #2a2a2a; }
  .react-datepicker__current-month { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .dark .react-datepicker__current-month { color: #fff; }
  .react-datepicker__day-name { color: #9ca3af; font-size: 11px; font-weight: 600; width: 2rem; line-height: 2rem; }
  .react-datepicker__day { width: 2rem; line-height: 2rem; border-radius: 8px; font-size: 13px; color: #374151; transition: all 0.15s; }
  .dark .react-datepicker__day { color: #e5e7eb; }
  .react-datepicker__day:hover { background: #fee2e2; color: #DC143C; border-radius: 8px; }
  .dark .react-datepicker__day:hover { background: rgba(220,20,60,0.15); color: #DC143C; }
  .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background: #DC143C !important; color: #fff !important; border-radius: 8px; font-weight: 700; }
  .react-datepicker__day--today { font-weight: 700; color: #DC143C; }
  .dark .react-datepicker__day--today { color: #ff6b6b; }
  .react-datepicker__day--outside-month { color: #d1d5db; }
  .dark .react-datepicker__day--outside-month { color: #4b5563; }
  .react-datepicker__day--disabled { color: #d1d5db !important; cursor: not-allowed !important; background: transparent !important; }
  .dark .react-datepicker__day--disabled { color: #3a3a3a !important; }
  .react-datepicker__navigation-icon::before { border-color: #9ca3af; }
  .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #DC143C; }
  .react-datepicker__month-container { background: #fff; }
  .dark .react-datepicker__month-container { background: #1c1c1c; }
  .react-datepicker__time-container { border-left: 1px solid #f3f4f6; width: 100px; }
  .dark .react-datepicker__time-container { border-left-color: #2a2a2a; background: #1c1c1c; }
  .react-datepicker__time { background: #fff; }
  .dark .react-datepicker__time { background: #1c1c1c !important; }
  .react-datepicker__time-list-item { height: auto !important; padding: 8px 12px !important; font-size: 13px; color: #374151; border-radius: 6px; margin: 2px 6px; transition: all 0.15s; }
  .dark .react-datepicker__time-list-item { color: #e5e7eb; }
  .react-datepicker__time-list-item:hover { background: #fee2e2 !important; color: #DC143C !important; }
  .dark .react-datepicker__time-list-item:hover { background: rgba(220,20,60,0.15) !important; color: #DC143C !important; }
  .react-datepicker__time-list-item--selected { background: #DC143C !important; color: #fff !important; font-weight: 700; }
  .react-datepicker__time-box { width: 100px !important; }
  .react-datepicker-time__header { font-size: 12px; font-weight: 700; color: #374151; padding: 10px 0; }
  .dark .react-datepicker-time__header { color: #e5e7eb; }
  .react-datepicker__triangle { display: none; }
  .react-datepicker-popper { z-index: 9999 !important; }
  .dark .react-datepicker__time-list::-webkit-scrollbar { width: 4px; }
  .dark .react-datepicker__time-list::-webkit-scrollbar-track { background: #1c1c1c; }
  .dark .react-datepicker__time-list::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
  .dark .react-datepicker__time-list::-webkit-scrollbar-thumb:hover { background: #DC143C; }
  .dark .react-datepicker__time-list { background: #1c1c1c !important; scrollbar-color: #3a3a3a #1c1c1c; }
  .dark .react-datepicker__time-container .react-datepicker__time { background: #1c1c1c !important; }
  .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box { background: #1c1c1c !important; }
`;

// ── Custom input wrappers ──
const DateInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-left focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all flex items-center justify-between gap-2">
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>{value || placeholder}</span>
      <CalendarPickerIcon />
    </button>
  )
);

const TimeInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-left focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all flex items-center justify-between gap-2">
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>{value || placeholder}</span>
      <ClockPickerIcon />
    </button>
  )
);

// ── Helpers ──
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

// ── Props ──
interface EditEventModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Cancel Button ──
const CancelBtn: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Cancel' }) => (
  <button type="button" onClick={onClick}
    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
    {label}
  </button>
);

// ── Component ──
const EditEventModal: React.FC<EditEventModalProps> = ({ event, onClose, onSuccess }) => {
  const { branches } = useBranches();

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole: 'admin' | 'staff' = storedUser?.role || 'staff';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const safeDate = (val: string | null | undefined): Date | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // ── Basic fields ──
  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [showDescription, setShowDescription] = useState(!!event.description);
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

  // ── Slideshow images ──
  const [slideshowFiles, setSlideshowFiles] = useState<File[]>([]);
  const [slideshowPreviews, setSlideshowPreviews] = useState<string[]>(() => {
    const existing = (event as any).slideshow_urls;
    return Array.isArray(existing) ? existing : [];
  });
  const [removedSlideshowUrls, setRemovedSlideshowUrls] = useState<string[]>([]);
  const slideshowInputRef = useRef<HTMLInputElement>(null);

  // ── Preset (Card image) ──
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    (event as any).preset_url
      ? (PRESET_IMAGES.find(p => p.url === (event as any).preset_url)?.id ?? null)
      : null
  );
  const [removePreset, setRemovePreset] = useState(false);

  // ── Branches & Teams ──
  const [selectedBranches, setSelectedBranches] = useState<BranchSelection[]>([]);
  const [branchesError, setBranchesError] = useState('');
  const [expandedBranches, setExpandedBranches] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Staff ──
  const [allStaff, setAllStaff] = useState<StaffUser[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // ── UI ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; eventDate?: string; venue?: string }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Initialize branches + staff — fetch full event first if event_branches not in prop
  useEffect(() => {
    if (branches.length === 0) return;
    if (!isInitializing) return;

    const init = (eventBranches: any[]) => {
      const safeBranches = eventBranches.map(b => {
        const hookBranch = branches.find(hb => hb.name === b.branch_name);
        const allTeamNames = (hookBranch?.teams ?? []).map((t: any) => t.name);
        // Backend returns team_names, frontend uses teams — normalize both
        const rawTeams = Array.isArray(b.teams) ? b.teams
          : Array.isArray(b.team_names) ? b.team_names
          : [];
        const teams = rawTeams.length > 0 ? rawTeams : allTeamNames;
        return { branch_name: b.branch_name, teams };
      });
      if (safeBranches.length > 0) {
        setSelectedBranches(safeBranches);
        originalBranches.current = safeBranches;
        setExpandedBranches(safeBranches.map(b => b.branch_name));
        const branchNames = safeBranches.map(b => b.branch_name);
        if (userRole === 'admin') {
          setStaffLoading(true);
          Promise.all([
            getStaffByBranchesApi(branchNames),
            getEventStaffApi(event.event_id),
          ])
            .then(([staffList, assignedStaff]) => {
              setAllStaff(staffList);
              const staffIds = assignedStaff.map((s: any) => s.user_id);
              setSelectedStaffIds(staffIds);
              originalStaffIds.current = staffIds;
            })
            .catch(console.error)
            .finally(() => { setStaffLoading(false); setIsInitializing(false); });
        } else {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    const fromProp: BranchSelection[] = (event as any).event_branches;
    if (Array.isArray(fromProp)) {
      init(fromProp);
    } else {
      api.get(`/events/${event.event_id}`)
        .then(res => init(res.data?.event_branches ?? []))
        .catch(() => setIsInitializing(false));
    }
  }, [branches]);

  // Fetch available staff when branches change (user-driven, not init)
  useEffect(() => {
    if (isInitializing) return;
    if (userRole !== 'admin') return;
    const branchNames = selectedBranches.map(b => b.branch_name);
    if (branchNames.length === 0) { setAllStaff([]); return; }
    setStaffLoading(true);
    getStaffByBranchesApi(branchNames)
      .then((data: StaffUser[]) => {
        setAllStaff(data);
        setSelectedStaffIds(prev => prev.filter(id => data.some(s => s.user_id === id)));
      })
      .catch(console.error)
      .finally(() => setStaffLoading(false));
  }, [selectedBranches]);

  // ── Branch helpers ──
  const isBranchChecked = (n: string) => selectedBranches.some(b => b.branch_name === n);
  const isTeamChecked = (bn: string, tn: string) => (selectedBranches.find(b => b.branch_name === bn)?.teams ?? []).includes(tn) ?? false;
  const allTeamsSelected = (bn: string) => {
    const branch = branches.find(b => b.name === bn);
    const sel = selectedBranches.find(b => b.branch_name === bn);
    if (!branch || !sel) return false;
    return (branch.teams ?? []).every(t => (sel.teams ?? []).includes(t.name));
  };
  const someTeamsSelected = (bn: string) => (selectedBranches.find(b => b.branch_name === bn)?.teams?.length ?? 0) > 0;

  const toggleBranch = (branchName: string) => {
    setBranchesError('');
    if (isBranchChecked(branchName)) {
      setSelectedBranches(prev => prev.filter(b => b.branch_name !== branchName));
      setExpandedBranches(prev => prev.filter(n => n !== branchName));
    } else {
      const branch = branches.find(b => b.name === branchName);
      const allTeams = (branch?.teams ?? []).map(t => t.name);
      setSelectedBranches(prev => [...prev, { branch_name: branchName, teams: allTeams }]);
      setExpandedBranches(prev => [...prev, branchName]);
    }
  };

  const toggleTeam = (bn: string, tn: string) => {
    setBranchesError('');
    setSelectedBranches(prev => prev.map(b => {
      if (b.branch_name !== bn) return b;
      return { ...b, teams: (b.teams ?? []).includes(tn) ? (b.teams ?? []).filter(t => t !== tn) : [...(b.teams ?? []), tn] };
    }));
  };

  const toggleAllTeamsInBranch = (bn: string) => {
    const branch = branches.find(b => b.name === bn);
    if (!branch) return;
    const allTeams = (branch.teams ?? []).map(t => t.name);
    const all = allTeamsSelected(bn);
    setSelectedBranches(prev => prev.map(b => b.branch_name === bn ? { ...b, teams: all ? [] : allTeams } : b));
  };

  const toggleBranchExpand = (bn: string) =>
    setExpandedBranches(prev => prev.includes(bn) ? prev.filter(n => n !== bn) : [...prev, bn]);

  const selectAllBranches = () => {
    setBranchesError('');
    setSelectedBranches(branches.map(b => ({ branch_name: b.name, teams: (b.teams ?? []).map(t => t.name) })));
    setExpandedBranches(branches.map(b => b.name));
  };

  const deselectAllBranches = () => { setSelectedBranches([]); setExpandedBranches([]); };

  const allBranchesSelected = branches.length > 0 && branches.every(b => isBranchChecked(b.name) && allTeamsSelected(b.name));

  // ── Staff helpers ──
  const toggleStaff = (uid: string) => setSelectedStaffIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  const toggleAllStaff = () => setSelectedStaffIds(selectedStaffIds.length === allStaff.length ? [] : allStaff.map(s => s.user_id));

  // ── Dirty check ──
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
  const originalBranches = useRef<BranchSelection[]>([]);
  const originalStaffIds = useRef<string[]>([]);

  const isDirty = () => {
    const orig = originalValues.current;
    const currentEventDate = eventDate
      ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}`
      : '';
    const toHHMM = (t: string) => t ? t.slice(0, 5) : '';
    const toMinute = (d: Date | null) => d ? Math.floor(d.getTime() / 60000).toString() : '';
    const origRegStart = orig.registrationStart ? Math.floor(new Date(orig.registrationStart).getTime() / 60000).toString() : '';
    const origRegEnd = orig.registrationEnd ? Math.floor(new Date(orig.registrationEnd).getTime() / 60000).toString() : '';
    const branchesChanged = JSON.stringify(selectedBranches) !== JSON.stringify(originalBranches.current);
    const staffChanged = JSON.stringify([...selectedStaffIds].sort()) !== JSON.stringify([...originalStaffIds.current].sort());
    return (
      title !== orig.title ||
      description !== orig.description ||
      currentEventDate !== orig.eventDate ||
      toHHMM(dateToTimeStr(startTime)) !== toHHMM(orig.startTime) ||
      toHHMM(dateToTimeStr(endTime)) !== toHHMM(orig.endTime) ||
      venue !== orig.venue ||
      toHHMM(dateToTimeStr(checkinCutoff)) !== toHHMM(orig.checkinCutoff) ||
      toMinute(registrationStart) !== origRegStart ||
      toMinute(registrationEnd) !== origRegEnd ||
      slideshowFiles.length > 0 ||
      removedSlideshowUrls.length > 0 ||
      removePreset ||
      selectedPreset !== ((event as any).preset_url ? (PRESET_IMAGES.find(p => p.url === (event as any).preset_url)?.id ?? null) : null) ||
      branchesChanged ||
      staffChanged
    );
  };

  const handleClose = () => {
    if (isDirty()) setShowDiscardConfirm(true);
    else onClose();
  };

  const validate = () => {
    const errors: { title?: string; eventDate?: string; venue?: string } = {};
    if (!title.trim()) errors.title = 'Event name is required.';
    if (!eventDate) errors.eventDate = 'Event date is required.';
    if (!venue.trim()) errors.venue = 'Venue is required.';
    if (selectedBranches.length === 0) { setBranchesError('Please select at least one branch.'); setFieldErrors(errors); return false; }
    if (selectedBranches.some(b => (b.teams ?? []).length === 0)) { setBranchesError('Please select at least one team for each checked branch.'); setFieldErrors(errors); return false; }
    setBranchesError('');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    if (registrationStart && registrationEnd && registrationEnd <= registrationStart) {
      setError('Registration end must be after registration start.');
      return;
    }
    setLoading(true);
    try {
      // Always use multipart to support slideshow image uploads
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description || '');
      fd.append('event_date', eventDate
        ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}`
        : '');
      fd.append('start_time', dateToTimeStr(startTime) || '');
      fd.append('end_time', dateToTimeStr(endTime) || '');
      fd.append('venue', venue);
      fd.append('checkin_cutoff', dateToTimeStr(checkinCutoff) || '');
      fd.append('registration_start', registrationStart ? registrationStart.toISOString() : '');
      fd.append('registration_end', registrationEnd ? registrationEnd.toISOString() : '');
      fd.append('event_branches', JSON.stringify(selectedBranches));
      fd.append('staff_ids', JSON.stringify(selectedStaffIds));
      slideshowFiles.forEach(f => fd.append('slideshow_images', f));
      if (removedSlideshowUrls.length > 0) fd.append('remove_slideshow_urls', JSON.stringify(removedSlideshowUrls));
      if (selectedPreset) {
        const preset = PRESET_IMAGES.find(p => p.id === selectedPreset);
        if (preset) fd.append('preset_url', preset.url);
      }
      if (removePreset) fd.append('preset_url', '');
      await api.put(`/events/${event.event_id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const advancedStep = userRole === 'admin' && selectedBranches.length > 0 ? 6 : 5;

  return (
    <>
      <style>{PICKER_STYLES}</style>

      {/* ── Discard Confirm Modal ── */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 dark:text-yellow-400"><WarnIcon /></span>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Discard Changes?</h2>
              </div>
              <button onClick={() => setShowDiscardConfirm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
                <XIcon />
              </button>
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
            <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Your edits will be lost if you leave now.
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
            <div className="flex items-center justify-end gap-2 px-5 py-4">
              <CancelBtn onClick={() => setShowDiscardConfirm(false)} label="Keep Editing" />
              <button onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Edit Modal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border-x border-b border-gray-200 dark:border-[#2a2a2a] w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] overflow-clip">

          {/* Red top edge */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] to-[#ff4d6d] flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424] flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400"><EditIcon /></span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Event</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[360px]">{event.title}</p>
              </div>
            </div>
            <button onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
              <XIcon />
            </button>
          </div>
          <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            <form id="edit-event-form" onSubmit={handleSubmit} className="px-5 py-6 space-y-7">

              {/* ── 1. Basic Info ── */}
              <SectionDivider step={1} label="Basic Info" />

              {/* Event Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Event Name <span className="text-[#DC143C]">*</span>
                </label>
                <input type="text" value={title}
                  onChange={e => { if (e.target.value.length <= 100) setTitle(e.target.value); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: undefined })); }}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}
                />
                <FieldError msg={fieldErrors.title} />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{title.length}/100</p>
                  {!showDescription && (
                    <button type="button" onClick={() => setShowDescription(true)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-[#DC143C] border border-gray-200 dark:border-[#2a2a2a] rounded-lg hover:border-[#DC143C] transition-colors">
                      + Add description
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {showDescription && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Description <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <button type="button" onClick={() => { setShowDescription(false); setDescription(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:border-red-400 transition-colors">
                      Remove
                    </button>
                  </div>
                  <textarea value={description} onChange={e => { if (e.target.value.length <= 500) setDescription(e.target.value); }} rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all resize-none" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description.length}/500</p>
                </div>
              )}

              {/* ── Slideshow Images (Registration Page) ── */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Slideshow Images <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {slideshowPreviews.length}/5
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Shown as a slideshow on the <span className="font-semibold text-gray-500 dark:text-gray-400">Registration Page</span>. If none, the default Pru Life slides will show instead.
                </p>

                {/* Image thumbnails */}
                {slideshowPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {slideshowPreviews.map((src, idx) => {
                      const isExisting = idx < ((event as any).slideshow_urls?.length ?? 0) - removedSlideshowUrls.length + (slideshowPreviews.length - slideshowFiles.length - ((event as any).slideshow_urls?.length ?? 0) + removedSlideshowUrls.length);
                      return (
                        <div key={idx} className="relative w-[90px] h-[68px] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] group flex-shrink-0">
                          <img src={src} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                          <button
                            type="button"
                            onClick={() => {
                              const existingUrls: string[] = (event as any).slideshow_urls ?? [];
                              // Determine if this preview is an existing URL or a new file
                              const existingInPreview = slideshowPreviews.filter(p => existingUrls.includes(p));
                              if (existingUrls.includes(src)) {
                                setRemovedSlideshowUrls(prev => [...prev, src]);
                              } else {
                                const newFileIdx = slideshowPreviews.filter(p => !existingUrls.includes(p)).indexOf(src);
                                setSlideshowFiles(prev => prev.filter((_, i) => i !== newFileIdx));
                              }
                              setSlideshowPreviews(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                          <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 drop-shadow">
                            {idx + 1}
                          </span>
                        </div>
                      );
                    })}

                    {/* Add more button */}
                    {slideshowPreviews.length < 5 && (
                      <button
                        type="button"
                        onClick={() => slideshowInputRef.current?.click()}
                        className="w-[90px] h-[68px] rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] hover:border-[#DC143C] hover:bg-red-50/20 dark:hover:bg-[#DC143C]/5 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-600 flex-shrink-0"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span className="text-[10px] font-semibold">Add</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {slideshowPreviews.length === 0 && (
                  <label className="flex flex-col items-center justify-center gap-2 w-full py-7 bg-gray-50 dark:bg-[#0f0f0f] border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#DC143C] hover:bg-red-50/20 dark:hover:bg-[#DC143C]/5 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-gray-300 dark:text-gray-600">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">Click to upload first image</span>
                    <span className="text-xs text-gray-300 dark:text-gray-600">JPG, PNG, WEBP · Max 5MB each · Up to 5 images</span>
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { setError('Each image must be under 5MB.'); return; }
                        if (slideshowPreviews.length >= 5) return;
                        setSlideshowFiles(prev => [...prev, file]);
                        setSlideshowPreviews(prev => [...prev, URL.createObjectURL(file)]);
                        setError('');
                      }} />
                  </label>
                )}

                {/* Hidden input for Add button */}
                <input ref={slideshowInputRef} type="file" accept="image/*" className="sr-only"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = '';
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { setError('Each image must be under 5MB.'); return; }
                    if (slideshowPreviews.length >= 5) return;
                    setSlideshowFiles(prev => [...prev, file]);
                    setSlideshowPreviews(prev => [...prev, URL.createObjectURL(file)]);
                    setError('');
                  }} />
              </div>

              {/* ── Card Preset (EventManagement) ── */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Card Preset <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  {selectedPreset && (
                    <button type="button" onClick={() => { setSelectedPreset(null); setRemovePreset(true); }}
                      className="text-xs font-semibold text-red-600 border border-red-200 dark:border-red-900 rounded-lg px-3 py-1.5 hover:border-red-400 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Shown on the <span className="font-semibold text-gray-500 dark:text-gray-400">Event Management card</span>. Choose a stock photo from the gallery.</p>

                {selectedPreset && (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] mb-3" style={{ maxHeight: 200 }}>
                    <img src={PRESET_IMAGES.find(p => p.id === selectedPreset)?.url ?? ''} alt="Preset preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl">
                  {PRESET_IMAGES.map(preset => (
                    <button key={preset.id} type="button"
                      onClick={() => { setSelectedPreset(selectedPreset === preset.id ? null : preset.id); setRemovePreset(false); }}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${selectedPreset === preset.id ? 'border-[#DC143C] shadow-md scale-105' : 'border-transparent hover:border-gray-300 dark:hover:border-[#444]'}`}>
                      <img src={preset.url} alt={`Preset ${preset.id}`} className="w-full h-full object-cover" />
                      {selectedPreset === preset.id && (
                        <div className="absolute inset-0 bg-[#DC143C]/20 flex items-center justify-center">
                          <div className="bg-[#DC143C] rounded-full p-0.5">
                            <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 2. Schedule ── */}
              <SectionDivider step={2} label="Schedule" />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-[#DC143C]">*</span></label>
                  <DatePicker selected={eventDate}
                    onChange={(date: Date | null) => { setEventDate(date); if (fieldErrors.eventDate) setFieldErrors(p => ({ ...p, eventDate: undefined })); }}
                    dateFormat="MM/dd/yyyy" placeholderText="Pick a date" customInput={<DateInput />} popperPlacement="bottom-start"
                    minDate={new Date()} />
                  <FieldError msg={fieldErrors.eventDate} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                  <DatePicker selected={startTime} onChange={(date: Date | null) => setStartTime(date)}
                    showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa"
                    placeholderText="Pick start time" customInput={<TimeInput />} popperPlacement="bottom-start" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                  <DatePicker selected={endTime} onChange={(date: Date | null) => setEndTime(date)}
                    showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa"
                    placeholderText="Pick end time" customInput={<TimeInput />} popperPlacement="bottom-start" />
                </div>
              </div>

              {eventDate && startTime && endTime && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 rounded-xl -mt-2">
                  <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    The event will be on {eventDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}, from {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} to {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.
                  </p>
                </div>
              )}

              {/* ── 3. Venue ── */}
              <SectionDivider step={3} label="Venue" />

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Venue <span className="text-[#DC143C]">*</span></label>
                <input type="text" value={venue}
                  onChange={e => { if (e.target.value.length <= 200) setVenue(e.target.value); if (fieldErrors.venue) setFieldErrors(p => ({ ...p, venue: undefined })); }}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrors.venue ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}
                />
                <FieldError msg={fieldErrors.venue} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{venue.length}/200</p>
              </div>

              {/* ── 4. Branches & Teams ── */}
              <SectionDivider step={4} label="Branches & Teams" />

              <div>
                {userRole === 'admin' && branches.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Select which branches and teams are included in this event.</p>
                    <button type="button" onClick={allBranchesSelected ? deselectAllBranches : selectAllBranches}
                      className="text-xs font-bold text-[#DC143C] hover:text-[#b01030] px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex-shrink-0 ml-4">
                      {allBranchesSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                )}

                <div className={`rounded-xl border overflow-hidden ${branchesError ? 'border-red-400' : 'border-gray-200 dark:border-[#2a2a2a]'}`}>
                  {branches.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Loading branches...</div>
                  ) : branches.map((branch, bi) => {
                    const checked = isBranchChecked(branch.name);
                    const expanded = expandedBranches.includes(branch.name);
                    const teams = branch.teams ?? [];
                    const selectedTeamCount = selectedBranches.find(b => b.branch_name === branch.name)?.teams?.length ?? 0;
                    const allTeams = allTeamsSelected(branch.name);
                    const someTeams = someTeamsSelected(branch.name);

                    return (
                      <div key={branch.branch_id} className={bi > 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''}>
                        {/* Branch row */}
                        <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${checked ? 'bg-white dark:bg-[#DC143C]/5' : 'bg-white dark:bg-[#1c1c1c]'}`}>
                          <div onClick={() => userRole === 'admin' && toggleBranch(branch.name)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${userRole === 'admin' ? 'cursor-pointer' : 'cursor-default'} ${checked || userRole === 'staff' ? 'border-[#DC143C] bg-[#DC143C]' : 'border-gray-300 dark:border-[#444] bg-white dark:bg-[#0f0f0f] hover:border-[#DC143C]'}`}>
                            {(checked || userRole === 'staff') && (
                              <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3">
                                <path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>

                          <div className={`flex-1 flex items-center gap-2.5 min-w-0 ${checked && teams.length > 0 ? 'cursor-pointer' : ''}`}
                            onClick={() => checked && teams.length > 0 && toggleBranchExpand(branch.name)}>
                            <span className={`font-semibold text-sm ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                              {branch.name}
                            </span>
                            {checked && teams.length > 0 && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                                allTeams ? 'bg-[#DC143C]/10 text-[#DC143C]'
                                : someTeams ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'
                              }`}>
                                {selectedTeamCount}/{teams.length} teams
                              </span>
                            )}
                          </div>

                          {checked && teams.length > 0 && (
                            <button type="button" onClick={() => toggleBranchExpand(branch.name)}
                              className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#333] transition-all ${expanded ? 'rotate-180' : ''}`}>
                              <ChevronDownIcon />
                            </button>
                          )}
                        </div>

                        {/* Teams panel */}
                        {checked && expanded && teams.length > 0 && (
                          <div className="bg-gray-100 dark:bg-[#161616] border-t border-gray-200 dark:border-[#252525] px-4 py-3.5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Select Teams</span>
                              <button type="button" onClick={() => toggleAllTeamsInBranch(branch.name)}
                                className="text-[11px] font-bold text-[#DC143C] hover:text-[#b01030] px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                {allTeams ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {teams.map(team => {
                                const teamChecked = isTeamChecked(branch.name, team.name);
                                return (
                                  <button key={team.team_id} type="button"
                                    onClick={() => toggleTeam(branch.name, team.name)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                      teamChecked
                                        ? 'bg-[#DC143C] border-[#DC143C] text-white shadow-sm'
                                        : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                                    }`}>
                                    {team.name}
                                    {teamChecked && (
                                      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-2.5 h-2.5 opacity-80">
                                        <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
                                      </svg>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <FieldError msg={branchesError} />
              </div>

              {/* ── 5. Assign Staff (admin only) ── */}
              {userRole === 'admin' && selectedBranches.length > 0 && (
                <>
                  <SectionDivider step={5} label="Assign Staff" />
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">Selected staff can access registrants, attendance, and reports for their branch.</p>
                      {allStaff.length > 0 && (
                        <button type="button" onClick={toggleAllStaff}
                          className="text-xs font-bold text-[#DC143C] hover:text-[#b01030] px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex-shrink-0">
                          {selectedStaffIds.length === allStaff.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                    {staffLoading ? (
                      <div className="px-4 py-4 text-center text-sm text-gray-400 rounded-xl border border-gray-200 dark:border-[#2a2a2a]">Loading staff...</div>
                    ) : allStaff.length === 0 ? (
                      <div className="px-4 py-4 text-center text-sm text-gray-400 italic rounded-xl border border-gray-200 dark:border-[#2a2a2a]">No staff accounts found for the selected branches.</div>
                    ) : (
                      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                        {allStaff.map((staff, si) => {
                          const checked = selectedStaffIds.includes(staff.user_id);
                          return (
                            <div key={staff.user_id}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${si > 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''} ${checked ? 'bg-red-50/40 dark:bg-[#DC143C]/5' : 'bg-white dark:bg-[#1c1c1c] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}
                              onClick={() => toggleStaff(staff.user_id)}>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'border-[#DC143C] bg-[#DC143C]' : 'border-gray-300 dark:border-[#444] bg-white dark:bg-[#0f0f0f]'}`}>
                                {checked && <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <span className={`font-semibold text-sm flex-1 ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{staff.full_name}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{staff.agent_code}</span>
                              <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full font-semibold ${checked ? 'bg-[#DC143C]/10 text-[#DC143C]' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'}`}>
                                {staff.branch_name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Advanced Settings ── */}
              <SectionDivider step={advancedStep} label="Advanced Settings" />

              {/* Check-in Cutoff */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Check-in Cutoff <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5">
                  Attendees who check in after this time will be marked <span className="font-semibold text-amber-600 dark:text-amber-400">Late</span>.
                </p>
                <div className="inline-flex items-center gap-1.5">
                  <div className="w-[200px]">
                    <DatePicker selected={checkinCutoff} onChange={(date: Date | null) => setCheckinCutoff(date)}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Cutoff" dateFormat="h:mm aa"
                      placeholderText="e.g., 9:00 AM" customInput={<TimeInput />} popperPlacement="bottom-start" />
                  </div>
                  {checkinCutoff && (
                    <button type="button" onClick={() => setCheckinCutoff(null)}
                      className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0">
                      Remove
                    </button>
                  )}
                </div>
                {checkinCutoff && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Late after <span className="font-semibold text-gray-600 dark:text-gray-300">{checkinCutoff.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>.
                  </p>
                )}
              </div>

              {/* Registration Window */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Registration Window <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Set when participants can register for this event.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Opens</label>
                    <DatePicker selected={registrationStart} onChange={(date: Date | null) => setRegistrationStart(date)}
                      showTimeSelect timeIntervals={15} timeCaption="Time" dateFormat="MMM d, yyyy h:mm aa"
                      placeholderText="Start date & time" customInput={<DateInput />} popperPlacement="bottom-start" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Closes</label>
                    <div className="flex items-center gap-2.5">
                      <DatePicker selected={registrationEnd} onChange={(date: Date | null) => setRegistrationEnd(date)}
                        showTimeSelect timeIntervals={15} timeCaption="Time" dateFormat="MMM d, yyyy h:mm aa"
                        placeholderText="End date & time" customInput={<DateInput />} popperPlacement="bottom-start"
                        minDate={registrationStart || undefined} />
                      {(registrationStart || registrationEnd) && (
                        <button type="button" onClick={() => { setRegistrationStart(null); setRegistrationEnd(null); }}
                          className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {registrationStart && registrationEnd && registrationEnd > registrationStart && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 rounded-xl mt-3">
                    <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Registration will open on {registrationStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at {registrationStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} and will close on {registrationEnd.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at {registrationEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.
                    </p>
                  </div>
                )}
                {registrationStart && registrationEnd && registrationEnd <= registrationStart && (
                  <FieldError msg="Registration end must be after registration start." />
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
          <div className="flex items-center justify-end gap-2 px-5 py-4 flex-shrink-0">
            <CancelBtn onClick={handleClose} />
            <button type="submit" form="edit-event-form" disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
                : 'Save Changes'
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditEventModal;