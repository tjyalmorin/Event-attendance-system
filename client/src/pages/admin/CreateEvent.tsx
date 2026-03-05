import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import { useBranches } from '../../hooks/useBranches';

// ── Branch/Team checklist types ──
interface BranchSelection {
  branch_name: string
  teams: string[]
}

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

// ── Custom input wrappers for DatePicker ──
const DateInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button type="button" onClick={onClick} ref={ref}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-left focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all flex items-center justify-between gap-2">
      <span className={value ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>
        {value || placeholder}
      </span>
      <CalendarIcon />
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
      <ClockIcon />
    </button>
  )
);

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { branches } = useBranches();

  // ── Who is creating? ──────────────────────────────────
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole: 'admin' | 'staff' = storedUser?.role || 'staff'
  const userBranch: string = storedUser?.branch_name || ''

  // ── Branch/Team checklist state ───────────────────────
  // For admin: all branches available; for staff: only their branch
  const availableBranches = userRole === 'admin'
    ? branches
    : branches.filter(b => b.name === userBranch)

  const [selectedBranches, setSelectedBranches] = useState<BranchSelection[]>([])
  const [branchesError, setBranchesError] = useState('')

  // Auto-init staff — their branch is pre-selected, no other choice
  useEffect(() => {
    if (userRole === 'staff' && userBranch && branches.length > 0) {
      const staffBranch = branches.find(b => b.name === userBranch)
      if (staffBranch && selectedBranches.length === 0) {
        setSelectedBranches([{ branch_name: staffBranch.name, teams: [] }])
      }
    }
  }, [branches])

  const isBranchChecked = (branchName: string) =>
    selectedBranches.some(b => b.branch_name === branchName)

  const isTeamChecked = (branchName: string, teamName: string) =>
    selectedBranches.find(b => b.branch_name === branchName)?.teams.includes(teamName) ?? false

  const allTeamsSelected = (branchName: string) => {
    const branch = branches.find(b => b.name === branchName)
    const sel = selectedBranches.find(b => b.branch_name === branchName)
    if (!branch || !sel) return false
    return (branch.teams ?? []).every(t => sel.teams.includes(t.name))
  }

  const toggleBranch = (branchName: string) => {
    setBranchesError('')
    if (isBranchChecked(branchName)) {
      setSelectedBranches(prev => prev.filter(b => b.branch_name !== branchName))
    } else {
      // Auto-select all teams when branch is checked
      const branch = branches.find(b => b.name === branchName)
      const allTeams = (branch?.teams ?? []).map(t => t.name)
      setSelectedBranches(prev => [...prev, { branch_name: branchName, teams: allTeams }])
    }
  }

  const toggleTeam = (branchName: string, teamName: string) => {
    setBranchesError('')
    setSelectedBranches(prev => prev.map(b => {
      if (b.branch_name !== branchName) return b
      return {
        ...b,
        teams: b.teams.includes(teamName)
          ? b.teams.filter(t => t !== teamName)
          : [...b.teams, teamName]
      }
    }))
  }

  const toggleAllTeamsInBranch = (branchName: string) => {
    const branch = branches.find(b => b.name === branchName)
    if (!branch) return
    const allTeams = (branch.teams ?? []).map(t => t.name)
    const all = allTeamsSelected(branchName)
    setSelectedBranches(prev => prev.map(b =>
      b.branch_name === branchName ? { ...b, teams: all ? [] : allTeams } : b
    ))
  }

  const selectAllBranches = () => {
    setBranchesError('')
    setSelectedBranches(availableBranches.map(b => ({
      branch_name: b.name,
      teams: (b.teams ?? []).map(t => t.name)
    })))
  }

  const deselectAllBranches = () => {
    if (userRole === 'staff') {
      // Staff can't deselect their branch, only teams
      setSelectedBranches([{ branch_name: userBranch, teams: [] }])
    } else {
      setSelectedBranches([])
    }
  }

  const allBranchesSelected = availableBranches.length > 0 &&
    availableBranches.every(b => isBranchChecked(b.name) && allTeamsSelected(b.name))

  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [checkinCutoff, setCheckinCutoff] = useState<Date | null>(null);
  const [registrationStart, setRegistrationStart] = useState<Date | null>(null);
  const [registrationEnd, setRegistrationEnd] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
  });

  const [showDescription, setShowDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; eventDate?: string; venue?: string }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // ── Dirty check — any field has content ──
  const isDirty = () =>
    formData.title.trim() !== '' ||
    formData.description.trim() !== '' ||
    formData.venue.trim() !== '' ||
    eventDate !== null ||
    startTime !== null ||
    endTime !== null ||
    checkinCutoff !== null ||
    registrationStart !== null ||
    registrationEnd !== null;

  const handleBack = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      navigate('/admin/events');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > 100) return;
    if (name === 'description' && value.length > 500) return;
    if (name === 'venue' && value.length > 200) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatTimeDisplay = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const validate = () => {
    const errors: { title?: string; eventDate?: string; venue?: string } = {};
    if (!formData.title.trim()) errors.title = 'Event name is required.';
    if (!eventDate) errors.eventDate = 'Event date is required.';
    if (!formData.venue.trim()) errors.venue = 'Venue is required.';
    if (selectedBranches.length === 0) {
      setBranchesError('Please select at least one branch.');
      setFieldErrors(errors);
      return false;
    }
    const hasNoTeams = selectedBranches.some(b => b.teams.length === 0)
    if (hasNoTeams) {
      setBranchesError('Please select at least one team for each checked branch.')
      setFieldErrors(errors);
      return false;
    }
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
      await api.post('/events', {
        title: formData.title,
        description: formData.description || null,
        event_date: eventDate ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}` : '',
        start_time: formatTime(startTime) || null,
        end_time: formatTime(endTime) || null,
        venue: formData.venue,
        event_branches: selectedBranches,
        checkin_cutoff: checkinCutoff ? formatTime(checkinCutoff) : null,
        registration_start: registrationStart ? registrationStart.toISOString() : null,
        registration_end: registrationEnd ? registrationEnd.toISOString() : null,
      });
      navigate('/admin/events', { state: { created: true } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ title: '', description: '', venue: '' });
    if (userRole === 'staff') {
      setSelectedBranches([{ branch_name: userBranch, teams: [] }])
    } else {
      setSelectedBranches([]);
    }
    setBranchesError('');
    setEventDate(null);
    setStartTime(null);
    setEndTime(null);
    setCheckinCutoff(null);
    setRegistrationStart(null);
    setRegistrationEnd(null);
    setShowDescription(false);
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <style>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }
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

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Your progress will be lost if you go back now.</p>
              </div>
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => navigate('/admin/events')}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar userRole={userRole} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center gap-4">
            <button onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mr-2">
              <ArrowLeftIcon />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              Event<span className="text-[#DC143C]">.</span>Management
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-sm border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] to-[#ff4d6d]" />
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Event</h2>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">

              {/* Event Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Event Name <span className="text-[#DC143C]">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Chasing Dreams - Financial Advisors Summit"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all ${
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
                  <p className="text-xs text-gray-500 dark:text-gray-500">{formData.title.length}/100 characters</p>
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
                    <button type="button" onClick={() => { setShowDescription(false); setFormData(prev => ({ ...prev, description: '' })); }}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 dark:border-red-800 rounded-lg hover:border-red-500 transition-colors">
                      Remove description
                    </button>
                  </div>
                  <textarea name="description" value={formData.description} onChange={handleChange}
                    placeholder="Brief description of the event..." rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formData.description.length}/500 characters</p>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-4">
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
                    {`This event will take place on ${eventDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} from ${formatTimeDisplay(startTime)} to ${formatTimeDisplay(endTime)}`}
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
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g., Makati City, Ayala North Tower 1"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all ${
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
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formData.venue.length}/200 characters</p>
              </div>

              {/* Branch & Team Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {userRole === 'admin' ? 'Branches & Teams' : 'Teams'} <span className="text-[#DC143C]">*</span>
                  </label>
                  {userRole === 'admin' && availableBranches.length > 0 && (
                    <button type="button"
                      onClick={allBranchesSelected ? deselectAllBranches : selectAllBranches}
                      className="text-xs font-bold text-[#DC143C] hover:text-[#b01030] transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">
                      {allBranchesSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                <div className={`rounded-xl border-[1.5px] overflow-hidden ${branchesError ? 'border-red-400' : 'border-gray-200 dark:border-[#2a2a2a]'}`}>
                  {availableBranches.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Loading branches...</div>
                  ) : availableBranches.map((branch, bi) => {
                    const checked = isBranchChecked(branch.name)
                    const teams = branch.teams ?? []
                    const allTeams = allTeamsSelected(branch.name)

                    return (
                      <div key={branch.branch_id} className={bi > 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''}>
                        {/* Branch row */}
                        <div className={`flex items-center gap-3 px-4 py-3 ${checked ? 'bg-red-50/60 dark:bg-[#DC143C]/5' : 'bg-white dark:bg-[#1c1c1c]'} ${userRole === 'staff' ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'} transition-colors`}
                          onClick={() => userRole === 'admin' && toggleBranch(branch.name)}>
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            userRole === 'staff'
                              ? 'border-[#DC143C] bg-[#DC143C]'
                              : checked
                                ? 'border-[#DC143C] bg-[#DC143C]'
                                : 'border-gray-300 dark:border-[#444] bg-white dark:bg-[#0f0f0f]'
                          }`}>
                            {(checked || userRole === 'staff') && (
                              <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3">
                                <path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className={`font-semibold text-sm flex-1 ${checked || userRole === 'staff' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {branch.name}
                          </span>
                          {(checked || userRole === 'staff') && teams.length > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {selectedBranches.find(b => b.branch_name === branch.name)?.teams.length ?? 0}/{teams.length} teams
                            </span>
                          )}
                        </div>

                        {/* Teams — compact pill tags */}
                        {(checked || userRole === 'staff') && teams.length > 0 && (
                          <div className="bg-gray-50 dark:bg-[#161616] border-t border-gray-100 dark:border-[#2a2a2a] px-4 py-2.5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Teams</span>
                              <button type="button"
                                onClick={e => { e.stopPropagation(); toggleAllTeamsInBranch(branch.name) }}
                                className="text-[11px] font-bold text-[#DC143C] hover:text-[#b01030] px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                {allTeams ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {teams.map(team => {
                                const teamChecked = isTeamChecked(branch.name, team.name)
                                return (
                                  <button key={team.team_id} type="button"
                                    onClick={e => { e.stopPropagation(); toggleTeam(branch.name, team.name) }}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                      teamChecked
                                        ? 'bg-[#DC143C] border-[#DC143C] text-white'
                                        : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                                    }`}>
                                    {team.name}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {branchesError && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {branchesError}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {userRole === 'admin'
                    ? 'Registrants will only see teams from the selected branches when signing up.'
                    : 'Select the teams from your branch that are included in this event.'}
                </p>
              </div>

              {/* Check-in Cutoff */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Check-in Cutoff <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Participants who scan their agent code <span className="font-semibold text-gray-600 dark:text-gray-300">after this time</span> will be marked as <span className="font-semibold text-yellow-600 dark:text-yellow-400">Late</span>. Leave blank if you don't need late tracking.
                </p>
                <DatePicker selected={checkinCutoff} onChange={(date: Date | null) => setCheckinCutoff(date)}
                  showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Cutoff" dateFormat="h:mm aa"
                  placeholderText="e.g., 9:00 AM" customInput={<TimeInput />} popperPlacement="bottom-start" />
                {checkinCutoff && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Anyone checking in after <span className="font-semibold text-gray-700 dark:text-gray-300">{checkinCutoff.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span> will be marked Late.
                  </p>
                )}
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

                {/* Registration window summary */}
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

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={handleClear}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#333333] transition-all">
                  Clear
                </button>
                <button type="submit" disabled={loading}
                  className="px-6 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating...</>
                  ) : 'Create Event'}
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