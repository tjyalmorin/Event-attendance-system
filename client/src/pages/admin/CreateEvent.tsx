import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import { useBranches } from '../../hooks/useBranches';
import { getStaffByBranchesApi } from '../../api/events.api';

interface BranchSelection { branch_name: string; teams: string[] }
interface StaffUser { user_id: string; full_name: string; agent_code: string; branch_name: string; email: string }

// ── Icons ──
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Numbered section divider ──
const SectionDivider: React.FC<{ label: string; step: number }> = ({ label, step }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#DC143C] text-white text-[10px] font-bold flex-shrink-0">{step}</span>
    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
  </div>
);

// ── DatePicker custom inputs ──
const DateInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-left focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all flex items-center justify-between gap-2">
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>{value || placeholder}</span>
      <CalendarIcon />
    </button>
  )
);
const TimeInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string; hasError?: boolean }>(
  ({ value, onClick, placeholder, hasError }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-left focus:outline-none focus:ring-2 transition-all flex items-center justify-between gap-2 ${hasError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}>
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>{value || placeholder}</span>
      <ClockIcon />
    </button>
  )
);

// ── Field error ──
const FieldError: React.FC<{ msg?: string }> = ({ msg }) => msg ? (
  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {msg}
  </p>
) : null;

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { branches } = useBranches();

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole: 'admin' | 'staff' = storedUser?.role || 'staff';
  const userBranch: string = storedUser?.branch_name || '';

  const availableBranches = userRole === 'admin'
    ? branches
    : branches.filter(b => b.name === userBranch);

  // ── Refs for scroll-to-first-error ──
  const titleRef     = useRef<HTMLDivElement>(null);
  const eventDateRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const endTimeRef   = useRef<HTMLDivElement>(null);
  const venueRef     = useRef<HTMLDivElement>(null);
  const branchesRef  = useRef<HTMLDivElement>(null);

  // ── Branch/Team state ──
  const [selectedBranches, setSelectedBranches] = useState<BranchSelection[]>([]);
  const [branchesError, setBranchesError] = useState('');
  const [expandedBranches, setExpandedBranches] = useState<string[]>([]);

  // ── Staff state ──
  const [allStaff, setAllStaff] = useState<StaffUser[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    if (userRole === 'staff' && userBranch && branches.length > 0) {
      const staffBranch = branches.find(b => b.name === userBranch);
      if (staffBranch && selectedBranches.length === 0) {
        setSelectedBranches([{ branch_name: staffBranch.name, teams: [] }]);
        setExpandedBranches([staffBranch.name]);
      }
    }
  }, [branches]);

  useEffect(() => {
    if (userRole !== 'admin') return;
    const branchNames = selectedBranches.map(b => b.branch_name);
    if (branchNames.length === 0) { setAllStaff([]); setSelectedStaffIds([]); return; }
    setStaffLoading(true);
    getStaffByBranchesApi(branchNames)
      .then((data: StaffUser[]) => {
        setAllStaff(data);
        setSelectedStaffIds(prev => prev.filter(id => data.some((s: StaffUser) => s.user_id === id)));
      })
      .catch(console.error)
      .finally(() => setStaffLoading(false));
  }, [selectedBranches]);

  const isBranchChecked = (n: string) => selectedBranches.some(b => b.branch_name === n);
  const isTeamChecked = (bn: string, tn: string) => selectedBranches.find(b => b.branch_name === bn)?.teams.includes(tn) ?? false;
  const allTeamsSelected = (bn: string) => {
    const branch = branches.find(b => b.name === bn);
    const sel = selectedBranches.find(b => b.branch_name === bn);
    if (!branch || !sel) return false;
    return (branch.teams ?? []).every(t => sel.teams.includes(t.name));
  };
  const someTeamsSelected = (bn: string) => (selectedBranches.find(b => b.branch_name === bn)?.teams.length ?? 0) > 0;

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
      return { ...b, teams: b.teams.includes(tn) ? b.teams.filter(t => t !== tn) : [...b.teams, tn] };
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
    setSelectedBranches(availableBranches.map(b => ({ branch_name: b.name, teams: (b.teams ?? []).map(t => t.name) })));
    setExpandedBranches(availableBranches.map(b => b.name));
  };

  const deselectAllBranches = () => {
    if (userRole === 'staff') { setSelectedBranches([{ branch_name: userBranch, teams: [] }]); }
    else { setSelectedBranches([]); setExpandedBranches([]); }
  };

  const allBranchesSelected = availableBranches.length > 0 &&
    availableBranches.every(b => isBranchChecked(b.name) && allTeamsSelected(b.name));

  const toggleStaff = (uid: string) => setSelectedStaffIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  const toggleAllStaff = () => setSelectedStaffIds(selectedStaffIds.length === allStaff.length ? [] : allStaff.map(s => s.user_id));

  // ── Form state ──
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [checkinCutoff, setCheckinCutoff] = useState<Date | null>(null);
  const [registrationStart, setRegistrationStart] = useState<Date | null>(null);
  const [registrationEnd, setRegistrationEnd] = useState<Date | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', venue: '' });
  const [showDescription, setShowDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    venue?: string;
  }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterTab, setPosterTab] = useState<'upload' | 'preset'>('upload');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const PRESET_IMAGES = Array.from({ length: 10 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return { id: num, url: `http://localhost:5000/uploads/presets/${num}.webp` };
  });

  const isDirty = () =>
    formData.title.trim() !== '' || formData.description.trim() !== '' || formData.venue.trim() !== '' ||
    eventDate !== null || startTime !== null || endTime !== null ||
    checkinCutoff !== null || registrationStart !== null || registrationEnd !== null || posterFile !== null;

  const handleBack = () => isDirty() ? setShowDiscardConfirm(true) : navigate('/admin/events');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > 100) return;
    if (name === 'description' && value.length > 500) return;
    if (name === 'venue' && value.length > 200) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  const formatTimeDisplay = (date: Date | null) => date ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

  // ── Validate + auto-scroll to first error ──
  const validate = () => {
    const errors: typeof fieldErrors = {};
    let branchErr = '';

    if (!formData.title.trim()) errors.title = 'Event name is required.';
    if (!eventDate) errors.eventDate = 'Event date is required.';
    if (!startTime) errors.startTime = 'Start time is required.';
    if (!endTime) errors.endTime = 'End time is required.';
    if (!formData.venue.trim()) errors.venue = 'Venue is required.';
    if (selectedBranches.length === 0) branchErr = 'Please select at least one branch.';
    else if (selectedBranches.some(b => b.teams.length === 0)) branchErr = 'Please select at least one team for each checked branch.';

    setFieldErrors(errors);
    setBranchesError(branchErr);

    // Scroll to the first field with an error, in DOM order
    const firstErrorRef = [
      errors.title     ? titleRef     : null,
      errors.eventDate ? eventDateRef : null,
      errors.startTime ? startTimeRef : null,
      errors.endTime   ? endTimeRef   : null,
      errors.venue     ? venueRef     : null,
      branchErr        ? branchesRef  : null,
    ].find(Boolean);

    if (firstErrorRef?.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(errors).length === 0 && !branchErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    if (registrationStart && registrationEnd && registrationEnd <= registrationStart) { setError('Registration end must be after registration start.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description || '');
      fd.append('event_date', eventDate ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}` : '');
      fd.append('start_time', formatTime(startTime));
      fd.append('end_time', formatTime(endTime));
      fd.append('venue', formData.venue);
      fd.append('event_branches', JSON.stringify(selectedBranches));
      fd.append('checkin_cutoff', checkinCutoff ? formatTime(checkinCutoff) : '');
      fd.append('registration_start', registrationStart ? registrationStart.toISOString() : '');
      fd.append('registration_end', registrationEnd ? registrationEnd.toISOString() : '');
      fd.append('staff_ids', JSON.stringify(selectedStaffIds));
      if (posterFile) fd.append('poster', posterFile);
      else if (selectedPreset) fd.append('poster_url', `http://localhost:5000/uploads/presets/${selectedPreset}.webp`);
      await api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/admin/events', { state: { created: true } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ title: '', description: '', venue: '' });
    setSelectedBranches(userRole === 'staff' ? [{ branch_name: userBranch, teams: [] }] : []);
    setExpandedBranches(userRole === 'staff' ? [userBranch] : []);
    setBranchesError('');
    setSelectedStaffIds([]);
    setEventDate(null); setStartTime(null); setEndTime(null);
    setCheckinCutoff(null); setRegistrationStart(null); setRegistrationEnd(null);
    setShowDescription(false); setFieldErrors({}); setError('');
    setPosterFile(null); setPosterPreview(null); setPosterTab('upload'); setSelectedPreset(null);
  };

  const advancedStep = userRole === 'admin' && selectedBranches.length > 0 ? 6 : 5;

  return (
    <div className="flex min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <style>{`
        .react-datepicker { font-family: inherit; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
        .dark .react-datepicker { background: #1c1c1c; border-color: #2a2a2a; }
        .react-datepicker__header { background: #fff; border-bottom: 1px solid #f3f4f6; padding: 16px 16px 8px; }
        .dark .react-datepicker__header { background: #1c1c1c; border-bottom-color: #2a2a2a; }
        .react-datepicker__current-month { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .dark .react-datepicker__current-month { color: #fff; }
        .react-datepicker__day-name { color: #9ca3af; font-size: 11px; font-weight: 600; width: 2rem; line-height: 2rem; }
        .react-datepicker__day { width: 2rem; line-height: 2rem; border-radius: 8px; font-size: 13px; color: #374151; transition: all 0.15s; }
        .dark .react-datepicker__day { color: #e5e7eb; }
        .react-datepicker__day:hover { background: #fee2e2; color: #DC143C; }
        .dark .react-datepicker__day:hover { background: rgba(220,20,60,0.15); color: #DC143C; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background: #DC143C !important; color: #fff !important; font-weight: 700; }
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
      `}</style>

      {/* ── Discard Confirm Modal ── */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 dark:text-yellow-400"><WarnIcon /></span>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Discard Changes?</h2>
              </div>
              <button onClick={() => setShowDiscardConfirm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
                <XIcon />
              </button>
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
            <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400">
              Your progress will be lost if you go back now.
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
            <div className="flex items-center justify-end gap-2 px-5 py-4">
              <button type="button" onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
                Keep Editing
              </button>
              <button onClick={() => navigate('/admin/events')}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar userRole={userRole} />

      <div className="flex-1 overflow-auto">
        {/* Page header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center gap-4">
            <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mr-2">
              <ArrowLeftIcon /><span className="font-medium">Back</span>
            </button>
            <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              Event<span className="text-[#DC143C]">.</span>Management
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2a2a] overflow-clip">

            <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] to-[#ff4d6d]" />

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-[#242424]">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Event</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">Fields marked <span className="text-[#DC143C]">*</span> are required</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-7">

                {/* ── 1. Basic Info ── */}
                <SectionDivider step={1} label="Basic Info" />

                {/* Event Name */}
                <div ref={titleRef}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Event Name <span className="text-[#DC143C]">*</span>
                  </label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange}
                    placeholder="e.g., Chasing Dreams — Financial Advisors Summit"
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all ${fieldErrors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}
                  />
                  <FieldError msg={fieldErrors.title} />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formData.title.length}/100</p>
                    {!showDescription && (
                      <button type="button" onClick={() => setShowDescription(true)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-[#DC143C] border border-gray-200 dark:border-[#2a2a2a] rounded-lg hover:border-[#DC143C] transition-colors">
                        + Add description
                      </button>
                    )}
                  </div>
                </div>

                {showDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <button type="button" onClick={() => { setShowDescription(false); setFormData(prev => ({ ...prev, description: '' })); }}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:border-red-400 transition-colors">
                        Remove
                      </button>
                    </div>
                    <textarea name="description" value={formData.description} onChange={handleChange}
                      placeholder="Brief overview of the event..." rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all resize-none" />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formData.description.length}/500</p>
                  </div>
                )}

                {/* Poster */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Event Poster <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    {(posterPreview || selectedPreset) && (
                      <button type="button" onClick={() => { setPosterFile(null); setPosterPreview(null); setSelectedPreset(null); }}
                        className="text-xs font-semibold text-red-600 border border-red-200 dark:border-red-900 rounded-lg px-3 py-1.5 hover:border-red-400 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Shown on the registration page instead of the slideshow if uploaded.</p>

                  {/* Preview */}
                  {(posterPreview || selectedPreset) ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a]" style={{ maxHeight: 200 }}>
                      <img src={posterPreview ?? `http://localhost:5000/uploads/presets/${selectedPreset}.webp`} alt="Poster preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                  ) : (
                    <>
                      {/* Tabs */}
                      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-1">
                        {(['upload', 'preset'] as const).map(tab => (
                          <button key={tab} type="button" onClick={() => setPosterTab(tab)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${posterTab === tab ? 'bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                            {tab === 'upload' ? '↑ Upload Image' : '🖼 Choose Preset'}
                          </button>
                        ))}
                      </div>

                      {posterTab === 'upload' ? (
                        <label className="flex flex-col items-center justify-center gap-2 w-full py-7 bg-gray-50 dark:bg-[#0f0f0f] border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#DC143C] hover:bg-red-50/20 dark:hover:bg-[#DC143C]/5 transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-gray-300 dark:text-gray-600">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">Click to upload</span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">JPG, PNG, WEBP · Max 5MB</span>
                          <input type="file" accept="image/*" className="sr-only"
                            onChange={e => {
                              const file = e.target.files?.[0] ?? null;
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) { setError('Poster image must be under 5MB.'); return; }
                              setPosterFile(file); setPosterPreview(URL.createObjectURL(file)); setSelectedPreset(null); setError('');
                            }} />
                        </label>
                      ) : (
                        <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl">
                          {PRESET_IMAGES.map(preset => (
                            <button key={preset.id} type="button" onClick={() => { setSelectedPreset(preset.id); setPosterFile(null); setPosterPreview(null); }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${selectedPreset === preset.id ? 'border-[#DC143C] shadow-md scale-105' : 'border-transparent hover:border-gray-300 dark:hover:border-[#444]'}`}>
                              <img src={preset.url} alt={`Preset ${preset.id}`} className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23e5e7eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">' + preset.id + '</text></svg>' }} />
                              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white drop-shadow">{preset.id}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ── 2. Schedule ── */}
                <SectionDivider step={2} label="Schedule" />

                <div className="grid grid-cols-3 gap-4">
                  <div ref={eventDateRef}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-[#DC143C]">*</span></label>
                    <DatePicker selected={eventDate}
                      onChange={(date: Date | null) => { setEventDate(date); if (fieldErrors.eventDate) setFieldErrors(p => ({ ...p, eventDate: undefined })); }}
                      dateFormat="MM/dd/yyyy" placeholderText="Pick a date" customInput={<DateInput />} popperPlacement="bottom-start"
                      minDate={new Date()} />
                    <FieldError msg={fieldErrors.eventDate} />
                  </div>
                  <div ref={startTimeRef}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time <span className="text-[#DC143C]">*</span></label>
                    <DatePicker selected={startTime}
                      onChange={(date: Date | null) => { setStartTime(date); if (fieldErrors.startTime) setFieldErrors(p => ({ ...p, startTime: undefined })); }}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa"
                      placeholderText="Pick start time" customInput={<TimeInput hasError={!!fieldErrors.startTime} />} popperPlacement="bottom-start" />
                    <FieldError msg={fieldErrors.startTime} />
                  </div>
                  <div ref={endTimeRef}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time <span className="text-[#DC143C]">*</span></label>
                    <DatePicker selected={endTime}
                      onChange={(date: Date | null) => { setEndTime(date); if (fieldErrors.endTime) setFieldErrors(p => ({ ...p, endTime: undefined })); }}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa"
                      placeholderText="Pick end time" customInput={<TimeInput hasError={!!fieldErrors.endTime} />} popperPlacement="bottom-start" />
                    <FieldError msg={fieldErrors.endTime} />
                  </div>
                </div>

                {eventDate && startTime && endTime && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 rounded-xl -mt-2">
                    <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      The event will be on {eventDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}, from {formatTimeDisplay(startTime)} to {formatTimeDisplay(endTime)}.
                    </p>
                  </div>
                )}

                {/* ── 3. Venue ── */}
                <SectionDivider step={3} label="Venue" />

                <div ref={venueRef}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Venue <span className="text-[#DC143C]">*</span></label>
                  <input type="text" name="venue" value={formData.venue} onChange={handleChange}
                    placeholder="e.g., Makati City, Ayala North Tower 1"
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all ${fieldErrors.venue ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}
                  />
                  <FieldError msg={fieldErrors.venue} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formData.venue.length}/200</p>
                </div>

                {/* ── 4. Branches & Teams ── */}
                <SectionDivider step={4} label={userRole === 'admin' ? 'Branches & Teams' : 'Teams'} />

                <div ref={branchesRef}>
                  {userRole === 'admin' && availableBranches.length > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Select which branches and teams are included in this event.</p>
                      <button type="button" onClick={allBranchesSelected ? deselectAllBranches : selectAllBranches}
                        className="text-xs font-bold text-[#DC143C] hover:text-[#b01030] px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex-shrink-0 ml-4">
                        {allBranchesSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  )}

                  <div className={`rounded-xl border overflow-hidden ${branchesError ? 'border-red-400' : 'border-gray-200 dark:border-[#2a2a2a]'}`}>
                    {availableBranches.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">Loading branches...</div>
                    ) : availableBranches.map((branch, bi) => {
                      const checked = isBranchChecked(branch.name);
                      const expanded = expandedBranches.includes(branch.name);
                      const teams = branch.teams ?? [];
                      const selectedTeamCount = selectedBranches.find(b => b.branch_name === branch.name)?.teams.length ?? 0;
                      const allTeams = allTeamsSelected(branch.name);
                      const someTeams = someTeamsSelected(branch.name);

                      return (
                        <div key={branch.branch_id} className={bi > 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''}>
                          <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${checked ? 'bg-white dark:bg-[#DC143C]/5' : 'bg-white dark:bg-[#1c1c1c]'}`}>
                            <div onClick={() => userRole === 'admin' && toggleBranch(branch.name)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${userRole === 'admin' ? 'cursor-pointer' : 'cursor-default'} ${checked || userRole === 'staff' ? 'border-[#DC143C] bg-[#DC143C]' : 'border-gray-300 dark:border-[#444] bg-white dark:bg-[#0f0f0f] hover:border-[#DC143C]'}`}>
                              {(checked || userRole === 'staff') && (
                                <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3">
                                  <path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div className={`flex-1 flex items-center gap-2.5 min-w-0 ${(checked || userRole === 'staff') && teams.length > 0 ? 'cursor-pointer' : ''}`}
                              onClick={() => (checked || userRole === 'staff') && teams.length > 0 && toggleBranchExpand(branch.name)}>
                              <span className={`font-semibold text-sm ${checked || userRole === 'staff' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                {branch.name}
                              </span>
                              {(checked || userRole === 'staff') && teams.length > 0 && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                                  allTeams ? 'bg-[#DC143C]/10 text-[#DC143C]'
                                  : someTeams ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'
                                }`}>
                                  {selectedTeamCount}/{teams.length} teams
                                </span>
                              )}
                            </div>
                            {(checked || userRole === 'staff') && teams.length > 0 && (
                              <button type="button" onClick={() => toggleBranchExpand(branch.name)}
                                className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#333] transition-all ${expanded ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon />
                              </button>
                            )}
                          </div>

                          {(checked || userRole === 'staff') && expanded && teams.length > 0 && (
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
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {userRole === 'admin'
                      ? 'Registrants will only see teams from the selected branches when signing up.'
                      : 'Select the teams from your branch that are included in this event.'}
                  </p>
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
                      Late after <span className="font-semibold text-gray-600 dark:text-gray-300">{formatTimeDisplay(checkinCutoff)}</span>.
                    </p>
                  )}
                </div>

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
              </div>

              <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
              <div className="flex items-center justify-end gap-2 px-6 py-4">
                <button type="button" onClick={handleClear}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
                  Clear
                </button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md">
                  {loading
                    ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating...</>
                    : 'Create Event'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;