import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';

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

const DateTimeInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
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

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();

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
    capacity: '',
  });

  const [showDescription, setShowDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > 100) return;
    if (name === 'description' && value.length > 500) return;
    if (name === 'venue' && value.length > 200) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatTimeDisplay = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateForDisplay = () => {
    if (!eventDate || !startTime || !endTime) return '';
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `This event will take place on ${monthNames[eventDate.getMonth()]} ${eventDate.getDate()}, ${eventDate.getFullYear()} from ${formatTimeDisplay(startTime)} to ${formatTimeDisplay(endTime)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !startTime || !endTime) {
      setError('Please fill in date and time fields.');
      return;
    }
    if (!registrationStart || !registrationEnd) {
      setError('Please set the registration window.');
      return;
    }
    if (registrationEnd <= registrationStart) {
      setError('Registration end must be after registration start.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/events', {
        title: formData.title,
        description: formData.description || null,
        event_date: eventDate ? `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}` : '',
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        venue: formData.venue,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        checkin_cutoff: checkinCutoff ? formatTime(checkinCutoff) : null,
        registration_start: registrationStart.toISOString(),
        registration_end: registrationEnd.toISOString(),
      });
      navigate('/admin/events', { state: { created: true } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ title: '', description: '', venue: '', capacity: '' });
    setEventDate(null);
    setStartTime(null);
    setEndTime(null);
    setCheckinCutoff(null);
    setRegistrationStart(null);
    setRegistrationEnd(null);
    setShowDescription(false);
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
      <Sidebar userRole="admin" />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center gap-4">
            <button onClick={() => navigate('/admin/events')}
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Name</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  placeholder="e.g., Chasing Dreams - Financial Advisors Summit" required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
                />
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <DatePicker selected={eventDate} onChange={(date: Date | null) => setEventDate(date)}
                    dateFormat="MM/dd/yyyy" placeholderText="Pick a date" customInput={<DateInput />} popperPlacement="bottom-start" />
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

              {/* Date Summary */}
              {formatDateForDisplay() && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333333] px-4 py-3 rounded-xl">
                  <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">{formatDateForDisplay()}</p>
                </div>
              )}

              {/* Venue */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Venue</label>
                <input type="text" name="venue" value={formData.venue} onChange={handleChange}
                  placeholder="e.g., Makati City, Ayala North Tower 1" required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formData.venue.length}/200 characters</p>
              </div>

              {/* Capacity + Checkin Cutoff */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Capacity (Optional)</label>
                  <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="e.g., 150" min="1"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check-in Cutoff (Optional)</label>
                  <DatePicker selected={checkinCutoff} onChange={(date: Date | null) => setCheckinCutoff(date)}
                    showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Cutoff" dateFormat="h:mm aa"
                    placeholderText="Pick cutoff time" customInput={<TimeInput />} popperPlacement="bottom-start" />
                </div>
              </div>

              {/* ── Registration Window ── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">Registration Window</span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Set when participants can register for this event.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Registration Opens <span className="text-[#DC143C]">*</span>
                    </label>
                    <DatePicker
                      selected={registrationStart}
                      onChange={(date: Date | null) => setRegistrationStart(date)}
                      showTimeSelect
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="MMM d, yyyy h:mm aa"
                      placeholderText="Pick start date & time"
                      customInput={<DateTimeInput />}
                      popperPlacement="bottom-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Registration Closes <span className="text-[#DC143C]">*</span>
                    </label>
                    <DatePicker
                      selected={registrationEnd}
                      onChange={(date: Date | null) => setRegistrationEnd(date)}
                      showTimeSelect
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="MMM d, yyyy h:mm aa"
                      placeholderText="Pick end date & time"
                      customInput={<DateTimeInput />}
                      popperPlacement="bottom-start"
                      minDate={registrationStart || undefined}
                    />
                  </div>
                </div>

                {/* Registration window summary */}
                {registrationStart && registrationEnd && (
                  <div className="flex items-center gap-3 bg-red-50 dark:bg-[#DC143C]/5 border border-red-100 dark:border-[#DC143C]/20 px-4 py-3 rounded-xl mt-3">
                    <div className="w-0.5 h-4 bg-[#DC143C] rounded-full flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Registration open from{' '}
                      <span className="font-semibold text-[#DC143C]">
                        {registrationStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at {registrationStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      {' '}until{' '}
                      <span className="font-semibold text-[#DC143C]">
                        {registrationEnd.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at {registrationEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </p>
                  </div>
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