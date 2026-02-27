import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
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

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
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

// ── Status Config ──
const statusConfig: Record<string, { gradient: string; badge: string; label: string }> = {
  upcoming:  { gradient: 'from-blue-600 to-blue-400',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     label: 'UPCOMING'  },
  ongoing:   { gradient: 'from-green-600 to-green-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  label: 'ONGOING'   },
  draft:     { gradient: 'from-gray-600 to-gray-400',   badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',         label: 'DRAFT'     },
  completed: { gradient: 'from-purple-600 to-purple-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'COMPLETED' },
  cancelled: { gradient: 'from-red-600 to-red-400',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          label: 'CANCELLED' },
  open:      { gradient: 'from-green-600 to-green-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  label: 'OPEN'      },
  closed:    { gradient: 'from-gray-600 to-gray-400',   badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',         label: 'CLOSED'    },
};

// ── Edit Modal ──
interface EditModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    eventDate: event.event_date?.split('T')[0] || '',
    startTime: event.start_time || '',
    endTime: event.end_time || '',
    venue: event.venue || '',
    capacity: event.capacity?.toString() || '',
    checkinCutoff: event.checkin_cutoff || '',
  });
  const [showDescription, setShowDescription] = useState(!!event.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > 100) return;
    if (name === 'description' && value.length > 500) return;
    if (name === 'venue' && value.length > 200) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/events/${event.event_id}`, {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.eventDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        venue: formData.venue,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        checkin_cutoff: formData.checkinCutoff || null,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Name</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{formData.title.length}/100 characters</p>
              {!showDescription && (
                <button type="button" onClick={() => setShowDescription(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#DC143C] border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#DC143C] transition-colors">
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
                  className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 dark:border-red-600 rounded-lg hover:border-red-500 transition-colors">
                  Remove description
                </button>
              </div>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/500 characters</p>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (Start)</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (End)</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Venue</label>
            <input type="text" name="venue" value={formData.venue} onChange={handleChange} required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
            />
          </div>

          {/* Capacity & Cutoff */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Capacity (Optional)</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check-in Cutoff (Optional)</label>
              <input type="time" name="checkinCutoff" value={formData.checkinCutoff} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirmation Modal ──
interface DeleteModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ event, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-8">
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
            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
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

// ── Success Toast ──
const SuccessToast: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-4 rounded-2xl shadow-2xl">
    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white">
      <CheckIcon />
    </div>
    <span className="text-sm font-semibold">{message}</span>
  </div>
);

// ── Main Component ──
const EventManagement: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('Last Updated');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      await api.delete(`/events/${deletingEvent.event_id}`);
      setDeletingEvent(null);
      setToast('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setEditingEvent(null);
    setToast('Event updated successfully');
    fetchEvents();
  };

  const filteredEvents = events.filter(event =>
    filter === 'all' ? true : event.status === filter
  );

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'Event Date') return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    if (sortBy === 'Name') return a.title.localeCompare(b.title);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-gray-900">
      <Sidebar userRole={user.role === 'staff' ? 'staff' : 'admin'} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-[1400px] mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[32px] font-bold text-gray-900 dark:text-white tracking-tight">
                Event<span className="font-normal text-gray-400 dark:text-gray-600">.</span>Management
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

        {/* Filters & Sort */}
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'ongoing', label: 'Ongoing' },
                { key: 'draft', label: 'Draft' },
                { key: 'completed', label: 'Completed' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === key
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {label}
                  {key !== 'all' && (
                    <span className="ml-1.5 text-xs opacity-60">{events.filter(e => e.status === key).length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">SORT BY</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm focus:outline-none focus:border-gray-300 dark:focus:border-gray-600">
                <option>Last Updated</option>
                <option>Event Date</option>
                <option>Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="max-w-[1400px] mx-auto px-8 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C]"></div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600"><GridIcon /></div>
              <p className="text-gray-500 dark:text-gray-400">No events found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5" ref={dropdownRef}>
              {sortedEvents.map((event) => {
                const config = statusConfig[event.status] || statusConfig.draft;
                return (
                  <div key={event.event_id}
                    onClick={() => navigate(`/admin/events/${event.event_id}`)}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <div className="flex">
                      {/* Left Gradient */}
                      <div className={`w-[180px] flex-shrink-0 bg-gradient-to-br ${config.gradient} p-6 flex flex-col justify-between text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full -ml-8 -mb-8"></div>
                        <div className="relative z-10">
                          <div className="text-[10px] font-bold tracking-widest opacity-60 mb-1">
                            {new Date(event.event_date).getFullYear()}
                          </div>
                          <div className="text-lg font-bold leading-tight mb-1 line-clamp-2">{event.title}</div>
                          <div className="text-[11px] opacity-75">{event.description || 'No description'}</div>
                        </div>
                      </div>

                      {/* Right Info */}
                      <div className="flex-1 p-5 flex items-center justify-between">
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{event.title}</h3>
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${config.badge}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <LocationIcon />
                              <span>{event.venue || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon />
                              <span>{formatDate(event.event_date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <UsersIcon />
                            <span>{event.capacity ?? '—'}</span>
                          </div>

                          {user.role === 'admin' && (
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === event.event_id ? null : event.event_id); }}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <MoreIcon />
                              </button>

                              {openDropdown === event.event_id && (
                                <div onClick={e => e.stopPropagation()}
                                  className="absolute right-0 top-10 z-20 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                                  <button
                                    onClick={() => { setEditingEvent(event); setOpenDropdown(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <EditIcon /> Edit
                                  </button>
                                  <button
                                    onClick={() => { setDeletingEvent(event); setOpenDropdown(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <TrashIcon /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
      {toast && <SuccessToast message={toast} />}
    </div>
  );
};

export default EventManagement;