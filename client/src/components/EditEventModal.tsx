import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api/axios';
import { Event } from '../types';

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

// ── Shared Cancel Button ──
const CancelBtn: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Cancel' }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
  >
    {label}
  </button>
);

// ── Component ──
const EditEventModal: React.FC<EditEventModalProps> = ({ event, onClose, onSuccess }) => {
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
    const toHHMM = (t: string) => t ? t.slice(0, 5) : '';
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
    if (isDirty()) setShowDiscardConfirm(true);
    else onClose();
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

      {/* ── Discard Confirm Modal ── */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 dark:text-yellow-400"><WarnIcon /></span>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Discard Changes?</h2>
              </div>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"
              >
                <XIcon />
              </button>
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
            {/* Body */}
            <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>Your edits will be lost if you leave now.</p>
            </div>
            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4">
              <CancelBtn onClick={() => setShowDiscardConfirm(false)} label="Keep Editing" />
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Edit Modal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] overflow-clip">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424] flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400"><EditIcon /></span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Edit Event</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[360px]">{event.title}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"
            >
              <XIcon />
            </button>
          </div>
          <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            <form id="edit-event-form" onSubmit={handleSubmit} className="px-5 py-5 space-y-5">

              {/* Event Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Event Name <span className="text-[#DC143C]">*</span>
                </label>
                <input type="text" value={title}
                  onChange={e => { if (e.target.value.length <= 100) setTitle(e.target.value); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: undefined })); }}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all resize-none" />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description.length}/500 characters</p>
                </div>
              )}

              {/* Date + Time */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-[#DC143C]">*</span></label>
                  <DatePicker selected={eventDate} onChange={(date: Date | null) => { setEventDate(date); if (fieldErrors.eventDate) setFieldErrors(p => ({ ...p, eventDate: undefined })); }}
                    dateFormat="MM/dd/yyyy" placeholderText="Pick a date" customInput={<DateInput />} popperPlacement="bottom-start" />
                  {fieldErrors.eventDate && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.eventDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (Start)</label>
                  <DatePicker selected={startTime} onChange={(date: Date | null) => setStartTime(date)} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa" placeholderText="Pick start time" customInput={<TimeInput />} popperPlacement="bottom-start" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (End)</label>
                  <DatePicker selected={endTime} onChange={(date: Date | null) => setEndTime(date)} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa" placeholderText="Pick end time" customInput={<TimeInput />} popperPlacement="bottom-start" />
                </div>
              </div>

              {/* Date/time summary */}
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Venue <span className="text-[#DC143C]">*</span></label>
                <input type="text" value={venue}
                  onChange={e => { if (e.target.value.length <= 200) setVenue(e.target.value); if (fieldErrors.venue) setFieldErrors(p => ({ ...p, venue: undefined })); }}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrors.venue ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/20'}`}
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
                <DatePicker selected={checkinCutoff} onChange={(date: Date | null) => setCheckinCutoff(date)} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Cutoff" dateFormat="h:mm aa" placeholderText="Pick cutoff time" customInput={<TimeInput />} popperPlacement="bottom-start" />
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
                    <DatePicker selected={registrationStart} onChange={(date: Date | null) => setRegistrationStart(date)} showTimeSelect timeIntervals={15} timeCaption="Time" dateFormat="MMM d, yyyy h:mm aa" placeholderText="Pick start date & time" customInput={<DateInput />} popperPlacement="bottom-start" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Registration Closes</label>
                    <DatePicker selected={registrationEnd} onChange={(date: Date | null) => setRegistrationEnd(date)} showTimeSelect timeIntervals={15} timeCaption="Time" dateFormat="MMM d, yyyy h:mm aa" placeholderText="Pick end date & time" customInput={<DateInput />} popperPlacement="bottom-start" minDate={registrationStart || undefined} />
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
          <div className="flex items-center justify-end gap-2 px-5 py-4 flex-shrink-0">
            <CancelBtn onClick={handleClose} />
            <button
              type="submit"
              form="edit-event-form"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
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