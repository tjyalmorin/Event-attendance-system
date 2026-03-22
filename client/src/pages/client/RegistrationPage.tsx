import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { getEventByTokenApi } from '../../api/events.api'
import { registerParticipantApi } from '../../api/participants.api'
import { Event } from '../../types'
import { useBranches } from '../../hooks/useBranches'
import pruLogo from '../../assets/pru.webp'
import imgFamily     from '../../assets/Family.webp'
import imgInvest     from '../../assets/Invest.webp'
import imgHealth     from '../../assets/Health.webp'
import imgRetirement from '../../assets/Retirement.webp'
import imgTeam       from '../../assets/Team.webp'

// ── SVG Icon Components ────────────────────────────────────────
const IconTrendingUp = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconTarget = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)

const IconBarChart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const IconHeart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconActivity = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const IconZap = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const IconSunrise = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 18a5 5 0 0 0-10 0" /><line x1="12" y1="2" x2="12" y2="9" />
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" />
    <line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
    <line x1="23" y1="22" x2="1" y2="22" /><polyline points="8 6 12 2 16 6" />
  </svg>
)

const IconCalendar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconUsers = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconAward = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
)

const IconBook = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const IconLock = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconHome = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconMapPin = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconAlertTriangle = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconInfo = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const IconX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconArrowRight = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconDollarSign = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

// ── Custom Select (matches AccountManagement style) ──────────────
interface SelectOption { label: string; value: string }
interface CustomSelectProps {
  value: string
  onChange: (val: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  centered?: boolean
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = 'Select...', disabled = false, centered = false }) => {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    // Only close on scroll events outside the dropdown itself
    const onScroll = (e: UIEvent) => {
      if (dropRef.current?.contains(e.target as Node)) return
      close()
    }
    window.addEventListener('scroll', onScroll as EventListener, true)
    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll as EventListener, true)
    }
  }, [open])

  const handleOpen = () => {
    if (disabled) return
    if (btnRef.current) {
      requestAnimationFrame(() => {
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        let top: number
        if (centered) {
          const dropHeight = Math.min(options.length * 42, 208)
          const centeredTop = rect.top + rect.height / 2 - dropHeight / 2
          top = Math.max(12, Math.min(centeredTop, window.innerHeight - dropHeight - 12))
        } else {
          top = rect.bottom + 4
        }
        setDropPos({ top, left: rect.left, width: rect.width })
        setOpen(p => !p)
      })
    }
  }

  const dropdown = open ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width,
        zIndex: 99999, background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.14)', overflow: 'hidden',
      }}
    >
      <div
        style={{ maxHeight: 208, overflowY: 'auto' }}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { onChange(opt.value); setOpen(false) }}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 16px',
              fontSize: 13, border: 'none', cursor: 'pointer',
              background: opt.value === value ? 'rgba(220,20,60,0.07)' : 'white',
              color: opt.value === value ? '#DC143C' : '#374151',
              fontWeight: opt.value === value ? 600 : 400,
              display: 'block',
            }}
            onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
            onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'white' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        style={{
          height: 44, width: '100%', borderRadius: 12,
          border: `1.5px solid ${open ? '#DC143C' : '#e5e7eb'}`,
          background: open ? 'white' : '#f9fafb',
          padding: '0 14px', fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          outline: 'none', opacity: disabled ? 0.45 : 1,
          boxShadow: open ? '0 0 0 3px rgba(220,20,60,0.08)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color: selected ? '#1f2937' : '#9ca3af' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke={open ? '#DC143C' : '#9ca3af'} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" width="13" height="13"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {dropdown}
    </>
  )
}


interface EventBranchEntry {
  branch_name: string
  team_names: string[]
}

interface EventWithBranches extends Event {
  event_branches?: EventBranchEntry[]
}

// ── Slideshow data ────────────────────────────────────────────────
const slides = [
  {
    tag: 'Life Insurance',
    headline: 'Protect What\nMatters Most',
    desc: 'Comprehensive life coverage tailored for Filipino families, backed by Prudential\'s global strength.',
    pills: [
      { icon: <IconHome size={15} color="white" />, name: 'Family Protection' },
      { icon: <IconDollarSign size={15} color="white" />, name: 'Wealth Builder' },
      { icon: <IconLock size={15} color="white" />, name: 'Guaranteed' },
    ],
    image: imgFamily,
  },
  {
    tag: 'Investment',
    headline: 'Grow Your\nFuture Today',
    desc: 'Variable life products combining protection with long-term investment growth.',
    pills: [
      { icon: <IconTrendingUp size={15} color="white" />, name: 'VUL Plans' },
      { icon: <IconTarget size={15} color="white" />, name: 'Goal Planner' },
      { icon: <IconBarChart size={15} color="white" />, name: 'Projections' },
    ],
    image: imgInvest,
  },
  {
    tag: 'Health & Wellness',
    headline: 'Your Health,\nOur Priority',
    desc: 'Critical illness and medical coverage so you can focus on recovery, not the bills.',
    pills: [
      { icon: <IconHeart size={15} color="white" />, name: 'Critical Illness' },
      { icon: <IconActivity size={15} color="white" />, name: 'Medical' },
      { icon: <IconZap size={15} color="white" />, name: 'Wellness' },
    ],
    image: imgHealth,
  },
  {
    tag: 'Retirement',
    headline: 'Retire with\nConfidence',
    desc: 'Pension and annuity solutions designed for the comfort you deserve.',
    pills: [
      { icon: <IconSunrise size={15} color="white" />, name: 'Pension Plan' },
      { icon: <IconCalendar size={15} color="white" />, name: 'Annuity' },
      { icon: <IconTarget size={15} color="white" />, name: 'Planning' },
    ],
    image: imgRetirement,
  },
  {
    tag: 'Join Us',
    headline: 'Build a Career\nYou\'re Proud Of',
    desc: 'Become part of the PruLife UK advisor network and help clients secure their future.',
    pills: [
      { icon: <IconUsers size={15} color="white" />, name: 'Commission' },
      { icon: <IconAward size={15} color="white" />, name: 'Recognition' },
      { icon: <IconBook size={15} color="white" />, name: 'Training' },
    ],
    image: imgTeam,
  },
]

// ── Helpers ───────────────────────────────────────────────────────
const formatTime12h = (time: string) => {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── Types ─────────────────────────────────────────────────────────
type RegStep = 'landing' | 'form' | 'success'

interface FormField {
  field_id?: number
  field_key: string
  label: string
  field_type: 'text' | 'dropdown' | 'radio' | 'checkbox' | 'date'
  options?: string[] | null
  is_required: boolean
  sort_order: number
  page_number: number
  page_title?: string | null
  page_description?: string | null
  page_condition?: { field_key: string; operator: 'eq' | 'neq'; value: string } | null  // legacy
  page_conditions?: { logic: 'AND' | 'OR'; rules: { field_key: string; operator: 'eq' | 'neq'; value: string }[] } | null
  is_final?: boolean
  condition?: { field_key: string; operator: 'eq' | 'neq'; value: string } | null
  section_key?: string | null
  section_conditions?: { logic: 'AND' | 'OR'; rules: { field_key: string; operator: 'eq' | 'neq'; value: string }[] } | null
}

interface FormPage {
  page_number: number
  page_title: string
  page_description: string
  page_condition: { field_key: string; operator: 'eq' | 'neq'; value: string } | null  // legacy
  page_conditions: { logic: 'AND' | 'OR'; rules: { field_key: string; operator: 'eq' | 'neq'; value: string }[] } | null
  is_final: boolean
  section_key: string | null
  section_conditions: { logic: 'AND' | 'OR'; rules: { field_key: string; operator: 'eq' | 'neq'; value: string }[] } | null
  fields: FormField[]
}

interface EventWithFormFields extends EventWithBranches {
  form_fields?: FormField[]
}

export default function RegistrationPage() {
  const { token } = useParams()
  const [event, setEvent] = useState<EventWithFormFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ── Slideshow state ──────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [panelHovered, setPanelHovered] = useState(false)
  const [mobileBannerTapped, setMobileBannerTapped] = useState(false)
  const mobileTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPausedRef = useRef(false)

  // ── Registration flow state ──────────────────────────────────
  const [step, setStep] = useState<RegStep>('landing')
  // currentPageNum stores the page_number (not array index) of the active page
  // Using page_number means conditional filtering never causes index misalignment
  const [currentPageNum, setCurrentPageNum] = useState<number | 'confirm'>(0) // 0 = not started
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [pageErrors, setPageErrors] = useState<Record<string, string>>({})
  const [registeredParticipant, setRegisteredParticipant] = useState<any>(null)

  const { branches: allBranches } = useBranches()

  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLightboxOpen(false); setIsPaused(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    getEventByTokenApi(token)
      .then(data => setEvent(data as EventWithFormFields))
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (event) {
      document.title = `${event.title} — Registration | A1 Prime Branch`
    } else {
      document.title = 'Registration | A1 Prime Branch'
    }
    return () => { document.title = 'PrimeLog: Event Attendance System — A1 Prime Branch' }
  }, [event])

  // ── Slideshow helpers ────────────────────────────────────────
  const slideshowUrls: string[] = Array.isArray((event as any)?.slideshow_urls) && (event as any).slideshow_urls.length > 0
    ? (event as any).slideshow_urls : []
  const useCustomSlideshow = slideshowUrls.length > 0
  const activeSlideCount = useCustomSlideshow ? slideshowUrls.length : slides.length

  const startInterval = (count: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) setCurrentSlide(prev => (prev + 1) % count)
    }, 4500)
  }
  useEffect(() => {
    startInterval(activeSlideCount)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeSlideCount])

  const goToSlide = (i: number) => { setCurrentSlide(i); startInterval(activeSlideCount) }
  const goPrev = () => goToSlide((currentSlide - 1 + activeSlideCount) % activeSlideCount)
  const goNext = () => goToSlide((currentSlide + 1) % activeSlideCount)

  // ── Form builder helpers ─────────────────────────────────────
  const formFields: FormField[] = (event as any)?.form_fields ?? []

  // Build pages from form_fields; if none, fall back to legacy fixed fields
  const allPages: FormPage[] = (() => {
    if (formFields.length === 0) {
      return [{
        page_number: 1,
        page_title: 'Your details',
        page_description: '',
        page_condition: null,
        page_conditions: null,
        is_final: false,
        section_key: null,
        section_conditions: null,
        fields: [
          { field_key: 'agent_code', label: 'Agent code', field_type: 'text', is_required: true, sort_order: 0, page_number: 1 },
          { field_key: 'full_name', label: 'Full name', field_type: 'text', is_required: true, sort_order: 1, page_number: 1 },
          { field_key: 'branch_name', label: 'Branch name', field_type: 'dropdown', is_required: true, sort_order: 2, page_number: 1 },
          { field_key: 'team_name', label: 'Team name', field_type: 'dropdown', is_required: true, sort_order: 3, page_number: 1 },
          { field_key: 'agent_type', label: 'Agent type', field_type: 'radio', options: ['District Manager', 'Area Manager', 'Branch Manager', 'Unit Manager', 'Agent'], is_required: true, sort_order: 4, page_number: 1 },
        ],
      }]
    }
    const pageNums = [...new Set(formFields.map(f => f.page_number))].sort((a, b) => a - b)
    const built = pageNums.map(pn => {
      const fields = formFields.filter(f => f.page_number === pn).sort((a, b) => a.sort_order - b.sort_order)
      const sample = fields[0]
      return {
        page_number: pn,
        page_title: sample?.page_title ?? `Page ${pn}`,
        page_description: sample?.page_description ?? '',
        page_condition: sample?.page_condition ?? null,
        page_conditions: sample?.page_conditions ?? null,
        is_final: sample?.is_final ?? false,
        section_key: sample?.section_key ?? null,
        section_conditions: sample?.section_conditions ?? null,
        fields,
      }
    })
    // Final pages always go last
    const regular = built.filter(p => !p.is_final)
    const finals  = built.filter(p => p.is_final)
    return [...regular, ...finals]
  })()

  // Evaluate a single condition rule against current answers
  const evalRule = (rule: { field_key: string; operator: 'eq' | 'neq'; value: string }, ans: Record<string, string>): boolean => {
    // Strip "pageNum__" prefix if present (safety net for any stored data with prefix)
    const key = rule.field_key.includes('__') ? rule.field_key.split('__').slice(1).join('__') : rule.field_key
    const userVal = ans[key] ?? ''
    return rule.operator === 'eq' ? userVal === rule.value : userVal !== rule.value
  }

  // Evaluate whether a page should be shown
  const isPageVisible = (page: FormPage, ans: Record<string, string>): boolean => {
    // Final pages are always visible
    if (page.is_final) return true
    // Section-level condition — this is the primary mechanism now
    if (page.section_key && page.section_conditions?.rules?.length) {
      const { logic, rules } = page.section_conditions
      const sectionVisible = logic === 'AND' ? rules.every(r => evalRule(r, ans)) : rules.some(r => evalRule(r, ans))
      if (!sectionVisible) return false
    }
    // Legacy page-level conditions (kept for backwards compat)
    if (page.page_conditions && page.page_conditions.rules.length > 0) {
      const { logic, rules } = page.page_conditions
      if (logic === 'AND') return rules.every(r => evalRule(r, ans))
      return rules.some(r => evalRule(r, ans))
    }
    if (page.page_condition) return evalRule(page.page_condition, ans)
    return true
  }

  // Only show pages whose conditions are met — recomputed reactively from answers
  const pages = allPages.filter(p => isPageVisible(p, answers))

  const totalPages = pages.length
  const isConfirmScreen = currentPageNum === 'confirm'

  // Find the active page by page_number — safe even when pages is re-filtered
  const activePage = isConfirmScreen ? undefined : pages.find(p => p.page_number === currentPageNum) ?? pages[0]

  // Position of activePage within the current filtered pages array (0-indexed)
  const activeIndex = activePage ? pages.findIndex(p => p.page_number === activePage.page_number) : 0

  // Evaluate if a field's condition is met given current answers
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.condition) return true
    const { field_key, operator, value } = field.condition
    const userVal = answers[field_key] ?? ''
    return operator === 'eq' ? userVal === value : userVal !== value
  }

  // Visible fields on current page (conditions evaluated)
  const visibleFields = activePage?.fields.filter(isFieldVisible) ?? []

  // Branch / team helpers for legacy dropdown fields
  const availableBranches = (() => {
    const eventBranchConfig = event?.event_branches
    if (!eventBranchConfig || eventBranchConfig.length === 0) return allBranches
    return allBranches
      .filter(b => eventBranchConfig.some(eb => eb.branch_name === b.name))
      .map(b => {
        const eb = eventBranchConfig.find(eb => eb.branch_name === b.name)!
        return { ...b, teams: (b.teams ?? []).filter(t => eb.team_names.includes(t.name)) }
      })
  })()

  const setAnswer = (key: string, value: string) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value }
      // Reset individual fields whose condition on this key is no longer met
      formFields.forEach(f => {
        if (f.condition?.field_key === key) {
          const met = f.condition.operator === 'eq' ? value === f.condition.value : value !== f.condition.value
          if (!met) delete next[f.field_key]
        }
      })
      if (key === 'branch_name') delete next['team_name']
      return next
    })
    setPageErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  // ── Page validation ──────────────────────────────────────────
  const validateCurrentPage = (): boolean => {
    const errs: Record<string, string> = {}
    for (const field of visibleFields) {
      if (!field.is_required) continue
      const val = answers[field.field_key] ?? ''
      if (!val.trim()) errs[field.field_key] = `${field.label} is required`
      if (field.field_key === 'agent_code' && val && val.length !== 8)
        errs[field.field_key] = 'Agent code must be exactly 8 digits'
    }
    setPageErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentPage()) return
    // Find the next visible page after the current one
    if (activeIndex < totalPages - 1) {
      setCurrentPageNum(pages[activeIndex + 1].page_number)
      setError('')
    } else {
      setCurrentPageNum('confirm')
    }
  }

  const handleBack = () => {
    if (isConfirmScreen) {
      // Back from confirm → go to last visible page
      setCurrentPageNum(pages[totalPages - 1]?.page_number ?? 0)
    } else if (activeIndex > 0) {
      setCurrentPageNum(pages[activeIndex - 1].page_number)
    } else {
      setStep('landing')
    }
  }

  const handleConfirmSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // Only include answers from currently visible pages AND visible fields
      const visibleFieldKeys = new Set(
        pages.flatMap(p => p.fields.filter(isFieldVisible).map(f => f.field_key))
      )
      const filteredAnswers: Record<string, string> = {}
      Object.entries(answers).forEach(([k, v]) => {
        if (visibleFieldKeys.has(k)) filteredAnswers[k] = v
      })

      // Split into core fields vs custom_responses
      const coreKeys = ['agent_code', 'full_name', 'branch_name', 'team_name', 'agent_type']
      const custom_responses: Record<string, string> = {}
      const core: Record<string, string> = {}
      Object.entries(filteredAnswers).forEach(([k, v]) => {
        if (coreKeys.includes(k)) core[k] = v
        else custom_responses[k] = v
      })
      const payload = { ...core, custom_responses }
      const data = await registerParticipantApi(event!.event_id, payload)
      setRegisteredParticipant(data.participant)
      setStep('success')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
      setCurrentPageNum(pages[totalPages - 1]?.page_number ?? 0)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Field renderer ───────────────────────────────────────────
  const renderField = (field: FormField) => {
    const val = answers[field.field_key] ?? ''
    const err = pageErrors[field.field_key]
    const inputStyle: React.CSSProperties = {
      height: 44, width: '100%', borderRadius: 12,
      border: `1.5px solid ${err ? '#dc2626' : '#e5e7eb'}`,
      background: '#f9fafb', padding: '0 14px', fontSize: 13,
      outline: 'none', fontFamily: 'inherit', color: '#1f2937',
      boxSizing: 'border-box',
    }

    if (field.field_key === 'branch_name') {
      return (
        <CustomSelect
          value={val}
          onChange={v => { setAnswer('branch_name', v); setAnswer('team_name', '') }}
          placeholder="— Select branch —"
          options={availableBranches.map(b => ({ label: b.name, value: b.name }))}
        />
      )
    }
    if (field.field_key === 'team_name') {
      const branch = availableBranches.find(b => b.name === answers['branch_name'])
      const teams = branch?.teams?.map(t => t.name) ?? []
      return (
        <CustomSelect
          value={val}
          onChange={v => setAnswer('team_name', v)}
          placeholder={answers['branch_name'] ? '— Select team —' : '— Select branch first —'}
          options={teams.map(t => ({ label: t, value: t }))}
          disabled={!answers['branch_name']}
        />
      )
    }

    switch (field.field_type) {
      case 'text':
        return (
          <input
            className="pru-input"
            value={val}
            onChange={e => {
              let v = e.target.value
              if (field.field_key === 'agent_code') v = v.replace(/\D/g, '').slice(0, 8)
              setAnswer(field.field_key, v)
            }}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            inputMode={field.field_key === 'agent_code' ? 'numeric' : undefined}
            style={inputStyle}
          />
        )
      case 'date':
        return <input type="date" value={val} onChange={e => setAnswer(field.field_key, e.target.value)} style={inputStyle} />
      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <div
              onClick={() => setAnswer(field.field_key, val === 'true' ? '' : 'true')}
              style={{
                width: 20, height: 20, borderRadius: 6, border: `2px solid ${val === 'true' ? '#DC143C' : '#d1d5db'}`,
                background: val === 'true' ? '#DC143C' : 'white', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}
            >
              {val === 'true' && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: 13, color: '#374151' }}>{field.label}</span>
          </div>
        )
      case 'dropdown':
        return (
          <CustomSelect
            value={val}
            onChange={v => setAnswer(field.field_key, v)}
            placeholder={`— Select ${field.label.toLowerCase()} —`}
            options={(field.options ?? []).map(o => ({ label: o, value: o }))}
          />
        )
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(field.options ?? []).map(opt => (
              <div
                key={opt}
                onClick={() => setAnswer(field.field_key, opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${val === opt ? '#DC143C' : '#e5e7eb'}`,
                  background: val === opt ? 'rgba(220,20,60,0.04)' : '#f9fafb',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${val === opt ? '#DC143C' : '#d1d5db'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {val === opt && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC143C' }} />}
                </div>
                <span style={{ fontSize: 13, color: '#1f2937', fontWeight: val === opt ? 600 : 400 }}>{opt}</span>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.spinnerWrap}>
        <div className="pru-spinner" />
        <p style={s.loadingText}>Loading registration...</p>
      </div>
    </div>
  )

  if (!event) return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.stateCard}>
        <div style={{ ...s.stateIcon, background: '#c0392b' }}>
          <IconX size={22} color="white" />
        </div>
        <h2 style={s.stateTitle}>Event Not Found</h2>
        <p style={s.stateText}>This event link may be invalid or expired.</p>
      </div>
    </div>
  )

  if (event.status !== 'open') return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.stateCard}>
        <div style={{ ...s.stateIcon, background: '#92400e' }}>
          <IconLock size={22} color="white" />
        </div>
        <h2 style={s.stateTitle}>Registration Closed</h2>
        <p style={s.stateText}>This event is not accepting registrations right now.</p>
      </div>
    </div>
  )

  // ── Confirmed non-null from here ─────────────────────────────
  const confirmedSlideshowUrls: string[] = Array.isArray((event as any).slideshow_urls) && (event as any).slideshow_urls.length > 0
    ? (event as any).slideshow_urls : []
  const confirmedUseCustom = confirmedSlideshowUrls.length > 0

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const timeRange = event.start_time && event.end_time
    ? `${formatTime12h(event.start_time)} – ${formatTime12h(event.end_time)}`
    : event.start_time ? formatTime12h(event.start_time) : ''

  // ── STEP: SUCCESS ─────────────────────────────────────────────
  if (step === 'success') return (
    <div style={s.page} className="pru-page">
      <Styles />
      <div style={s.card} className="pru-card">
        <div style={{ ...s.formPanel, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }} className="pru-form-panel">
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: FONT, fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8 }}>
            You're registered!
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, lineHeight: 1.6 }}>
            Your registration for <strong style={{ color: '#111827' }}>{event.title}</strong> is confirmed.
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            Present your QR code at the event entrance. Check your details below.
          </p>
          {registeredParticipant && (
            <div style={{
              marginTop: 24, background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 14, padding: '18px 20px', width: '100%', textAlign: 'left',
            }}>
              {[
                { label: 'Full name', value: registeredParticipant.full_name },
                { label: 'Agent code', value: registeredParticipant.agent_code },
                { label: 'Branch', value: registeredParticipant.branch_name },
                { label: 'Team', value: registeredParticipant.team_name },
                { label: 'Agent type', value: registeredParticipant.agent_type },
              ].filter(r => r.value).map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right panel — slideshow still visible */}
        <RightSlideshowPanel
          confirmedUseCustom={confirmedUseCustom}
          confirmedSlideshowUrls={confirmedSlideshowUrls}
          slides={slides}
          currentSlide={currentSlide}
          panelHovered={panelHovered}
          isPaused={isPaused}
          activeSlideCount={activeSlideCount}
          setPanelHovered={setPanelHovered}
          setLightboxOpen={setLightboxOpen}
          setIsPaused={setIsPaused}
          goPrev={goPrev}
          goNext={goNext}
          goToSlide={goToSlide}
          event={event}
          formattedDate={formattedDate}
          timeRange={timeRange}
          s={s}
        />
      </div>
    </div>
  )

  // ── STEP: LANDING ─────────────────────────────────────────────
  if (step === 'landing') return (
    <div style={s.page} className="pru-page">
      <Styles />
      <div style={s.card} className="pru-card">
        {/* Left panel — event info + register button */}
        <div style={s.formPanel} className="pru-form-panel">
          {/* Logo */}
          <div style={s.logo} className="pru-logo">
            <div style={s.logoMark}>
              <img src={pruLogo} alt="PRU LIFE UK" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 0 }} />
            </div>
            <div>
              <div style={s.logoName}>A1<span style={{ color: '#DC143C' }}>PRIME</span><span style={{ color: '#DC143C' }}>.</span></div>
              <div style={s.logoSub}>Pru Life UK — A1 Prime Branch</div>
            </div>
          </div>

          {/* Mobile-only slideshow banner */}
          <div className="pru-mobile-banner">
            <MobileSlideshowBanner
              confirmedUseCustom={confirmedUseCustom}
              confirmedSlideshowUrls={confirmedSlideshowUrls}
              slides={slides}
              currentSlide={currentSlide}
              activeSlideCount={activeSlideCount}
              mobileBannerTapped={mobileBannerTapped}
              isPaused={isPaused}
              mobileTapTimer={mobileTapTimer}
              setMobileBannerTapped={setMobileBannerTapped}
              setLightboxOpen={setLightboxOpen}
              setIsPaused={setIsPaused}
              goPrev={goPrev}
              goNext={goNext}
              goToSlide={goToSlide}
            />
          </div>

          {/* Event title */}
          <div style={{ marginBottom: 14 }} className="pru-event-title">
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1f2937', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
              {event.title}
            </div>
          </div>

          {/* Event info: date, venue, description */}
          <div style={s.eventInfoBox} className="pru-info-box">
            <div style={s.infoRow}>
              <div style={s.infoRowLeft}>
                <span style={{ ...s.infoIconBadge, background: '#f3f4f6' }}><IconCalendar size={14} color="#6b7280" /></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                <div style={s.infoRowValue}>{formattedDate}</div>
                {timeRange && <div style={{ fontSize: 12.5, color: '#6b7280' }}>{timeRange}</div>}
              </div>
            </div>
            <div style={s.infoRow}>
              <div style={s.infoRowLeft}>
                <span style={{ ...s.infoIconBadge, background: '#f3f4f6' }}><IconMapPin size={14} color="#6b7280" /></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                <div style={s.infoRowValue}>Venue</div>
                <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>{event.venue || '—'}</div>
              </div>
            </div>
            {event.description && (
              <div style={s.infoRow}>
                <div style={s.infoRowLeft}>
                  <span style={{ ...s.infoIconBadge, background: '#f3f4f6' }}><IconInfo size={14} color="#6b7280" /></span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <div style={s.infoRowValue}>Details</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 }}>{event.description}</div>
                </div>
              </div>
            )}
            {/* Slots remaining */}
            {event.capacity && (
              <div style={s.infoRow}>
                <div style={s.infoRowLeft}>
                  <span style={{ ...s.infoIconBadge, background: '#f3f4f6' }}><IconUsers size={14} color="#6b7280" /></span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <div style={s.infoRowValue}>Slots</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280' }}>
                    {(event as any).registered_count ?? 0} / {event.capacity} registered
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Register button */}
          <button
            onClick={() => { setStep('form'); setCurrentPageNum(pages[0]?.page_number ?? 1) }}
            className="pru-btn"
            style={{ marginTop: 8 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Register now <IconArrowRight size={16} color="white" />
            </span>
          </button>
        </div>

        {/* Right panel — slideshow */}
        <RightSlideshowPanel
          confirmedUseCustom={confirmedUseCustom}
          confirmedSlideshowUrls={confirmedSlideshowUrls}
          slides={slides}
          currentSlide={currentSlide}
          panelHovered={panelHovered}
          isPaused={isPaused}
          activeSlideCount={activeSlideCount}
          setPanelHovered={setPanelHovered}
          setLightboxOpen={setLightboxOpen}
          setIsPaused={setIsPaused}
          goPrev={goPrev}
          goNext={goNext}
          goToSlide={goToSlide}
          event={event}
          formattedDate={formattedDate}
          timeRange={timeRange}
          s={s}
        />
      </div>
      {/* Lightbox */}
      <SlideshowLightbox
        open={lightboxOpen}
        onClose={() => { setLightboxOpen(false); setIsPaused(false) }}
        confirmedUseCustom={confirmedUseCustom}
        confirmedSlideshowUrls={confirmedSlideshowUrls}
        slides={slides}
        currentSlide={currentSlide}
        activeSlideCount={activeSlideCount}
        goPrev={goPrev}
        goNext={goNext}
      />
    </div>
  )

  // ── STEP: FORM (multi-page questions + confirm screen) ────────

  return (
    <div style={s.page} className="pru-page">
      <Styles />
      <div style={s.card} className="pru-card">

        {/* Left panel — form */}
        <div style={s.formPanel} className="pru-form-panel">

          {/* Progress bar — dynamic, no step count */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                {isConfirmScreen ? 'Review & confirm' : (activePage?.page_title ?? 'Your details')}
              </div>
              {activePage?.page_description && !isConfirmScreen && (
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{activePage.page_description}</div>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 2,
                background: '#DC143C',
                transition: 'width 0.35s ease',
                width: isConfirmScreen
                  ? '100%'
                  : totalPages > 0 ? `${((activeIndex) / totalPages) * 100}%` : '0%',
              }} />
            </div>
          </div>

          {/* ── CONFIRM SCREEN ── */}
          {isConfirmScreen ? (
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Review your details
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18, lineHeight: 1.6 }}>
                Please check everything before submitting.
              </p>

              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                {Object.entries(answers).filter(([, v]) => v).map(([key, val], i, arr) => {
                  // Find the field label — use allPages so conditional page fields are found
                  const allFields = allPages.flatMap(p => p.fields)
                  const field = allFields.find(f => f.field_key === key)
                  const label = field?.label ?? key.replace(/_/g, ' ')
                  return (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none', gap: 12,
                    }}>
                      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
                      <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, textAlign: 'right' }}>
                        {val === 'true' ? 'Yes' : val}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC143C', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 500 }}>Registering for</div>
                  <div style={{ fontSize: 13, color: '#111827', fontWeight: 700, lineHeight: 1.3 }}>{event.title}</div>
                </div>
              </div>

              {error && (
                <div style={s.errorBanner}>
                  <IconAlertTriangle size={15} color="#dc2626" />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleBack} style={{
                  flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #e5e7eb',
                  background: 'white', fontSize: 13, fontWeight: 600, color: '#374151',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  ← Back
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="pru-btn"
                  style={{ flex: 2, margin: 0 }}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="btn-spinner" /> Submitting...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Confirm registration <IconArrowRight size={15} color="white" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ── FORM PAGE ── */
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {activePage?.page_title ?? 'Your details'}
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
                {activePage?.page_description || 'Fill in the fields below to continue.'}
              </p>

              <div style={s.formGrid}>
                {visibleFields.map(field => (
                  <div key={field.field_key} style={s.field}>
                    {/* Label — hidden for checkbox since it's inline */}
                    {field.field_type !== 'checkbox' && (
                      <label style={s.label}>
                        {field.label.toUpperCase()}
                        {!field.is_required && (
                          <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, textTransform: 'none', fontSize: 11, letterSpacing: 0 }}>
                            (Optional)
                          </span>
                        )}
                      </label>
                    )}

                    {/* Condition hint */}
                    {field.condition && (
                      <div style={{
                        fontSize: 10, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a',
                        borderRadius: 6, padding: '3px 8px', marginBottom: 6, display: 'inline-block',
                      }}>
                        Shown because: {field.condition.field_key.replace(/_/g, ' ')} = {field.condition.value}
                      </div>
                    )}

                    {renderField(field)}

                    {pageErrors[field.field_key] && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>
                        {pageErrors[field.field_key]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div style={s.errorBanner}>
                  <IconAlertTriangle size={15} color="#dc2626" />
                  <span>{error}</span>
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleBack} style={{
                  flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #e5e7eb',
                  background: 'white', fontSize: 13, fontWeight: 600, color: '#374151',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  ← Back
                </button>
                <button onClick={handleNext} className="pru-btn" style={{ flex: 2, margin: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {activeIndex < totalPages - 1 ? 'Next' : 'Review'} <IconArrowRight size={15} color="white" />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — slideshow */}
        <RightSlideshowPanel
          confirmedUseCustom={confirmedUseCustom}
          confirmedSlideshowUrls={confirmedSlideshowUrls}
          slides={slides}
          currentSlide={currentSlide}
          panelHovered={panelHovered}
          isPaused={isPaused}
          activeSlideCount={activeSlideCount}
          setPanelHovered={setPanelHovered}
          setLightboxOpen={setLightboxOpen}
          setIsPaused={setIsPaused}
          goPrev={goPrev}
          goNext={goNext}
          goToSlide={goToSlide}
          event={event}
          formattedDate={formattedDate}
          timeRange={timeRange}
          s={s}
        />
      </div>

      {/* Lightbox */}
      <SlideshowLightbox
        open={lightboxOpen}
        onClose={() => { setLightboxOpen(false); setIsPaused(false) }}
        confirmedUseCustom={confirmedUseCustom}
        confirmedSlideshowUrls={confirmedSlideshowUrls}
        slides={slides}
        currentSlide={currentSlide}
        activeSlideCount={activeSlideCount}
        goPrev={goPrev}
        goNext={goNext}
      />
    </div>
  )
}

// ── Helper: Right slideshow panel ────────────────────────────
interface SlideshowPanelProps {
  confirmedUseCustom: boolean
  confirmedSlideshowUrls: string[]
  slides: typeof slides
  currentSlide: number
  panelHovered: boolean
  isPaused: boolean
  activeSlideCount: number
  setPanelHovered: (v: boolean) => void
  setLightboxOpen: (v: boolean) => void
  setIsPaused: (fn: (p: boolean) => boolean) => void
  goPrev: () => void
  goNext: () => void
  goToSlide: (i: number) => void
  event: any
  formattedDate: string
  timeRange: string
  s: any
}

const RightSlideshowPanel: React.FC<SlideshowPanelProps> = ({
  confirmedUseCustom, confirmedSlideshowUrls, slides, currentSlide,
  panelHovered, isPaused, activeSlideCount,
  setPanelHovered, setLightboxOpen, setIsPaused,
  goPrev, goNext, goToSlide, event: _event, formattedDate: _formattedDate, timeRange: _timeRange, s,
}) => (
  <div
    style={{ ...s.visualPanel, cursor: 'zoom-in' }}
    className="pru-visual-panel"
    onMouseEnter={() => setPanelHovered(true)}
    onMouseLeave={() => setPanelHovered(false)}
    onClick={() => { setLightboxOpen(true); setIsPaused(p => !p || true) }}
  >
    {/* Prev/Next/Pause buttons */}
    {activeSlideCount > 1 && (
      <>
        <button onClick={e => { e.stopPropagation(); goPrev() }} style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: panelHovered ? 1 : 0, transition: 'opacity 0.2s ease',
          pointerEvents: panelHovered ? 'auto' : 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); goNext() }} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: panelHovered ? 1 : 0, transition: 'opacity 0.2s ease',
          pointerEvents: panelHovered ? 'auto' : 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); setIsPaused(p => !p) }} style={{
          position: 'absolute', bottom: 16, right: 16,
          zIndex: 10, width: 42, height: 42, borderRadius: 10,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: panelHovered ? 1 : 0, transition: 'opacity 0.2s ease',
          pointerEvents: panelHovered ? 'auto' : 'none',
        }}>
          {isPaused
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          }
        </button>
      </>
    )}

    {/* Slides */}
    {confirmedUseCustom ? (
      <>
        {confirmedSlideshowUrls.map((url, i) => (
          <div key={i} style={{ ...s.slide, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', opacity: i === currentSlide ? 1 : 0, zIndex: i === currentSlide ? 1 : 0 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
          </div>
        ))}
        {confirmedSlideshowUrls.length > 1 && (
          <div style={s.dots}>
            {confirmedSlideshowUrls.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); goToSlide(i) }} style={{ ...s.dot, width: i === currentSlide ? 20 : 6, background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </div>
        )}
      </>
    ) : (
      <>
        {slides.map((sl, i) => (
          <div key={i} style={{ ...s.slide, backgroundImage: `url(${sl.image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === currentSlide ? 1 : 0, zIndex: i === currentSlide ? 1 : 0 }}>
            <div style={s.slidePattern} />
            <div style={s.slideOverlay} />
            <div style={s.slideContent}>
              <div style={s.slideTag}>{sl.tag}</div>
              <div style={s.slideHeadline}>{sl.headline.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}</div>
              <div style={s.slideDesc}>{sl.desc}</div>
              <div style={s.pillsGrid}>
                {sl.pills.map((p, j) => (
                  <div key={j} style={s.pill}>
                    <div style={s.pillIcon}>{p.icon}</div>
                    <div style={s.pillName}>{p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div style={s.dots}>
          {slides.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); goToSlide(i) }} style={{ ...s.dot, width: i === currentSlide ? 20 : 6, background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </div>
        {/* PRU badge */}
        <div style={s.topBadge}>
          <div style={s.badgeIcon}>
            <img src={pruLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={s.badgeName}>PRU Life UK</div>
            <div style={s.badgeSub}>A1 Prime Branch</div>
          </div>
        </div>
      </>
    )}
  </div>
)

// ── Helper: Mobile slideshow banner ───────────────────────────
interface MobileBannerProps {
  confirmedUseCustom: boolean
  confirmedSlideshowUrls: string[]
  slides: typeof slides
  currentSlide: number
  activeSlideCount: number
  mobileBannerTapped: boolean
  isPaused: boolean
  mobileTapTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  setMobileBannerTapped: (v: boolean) => void
  setLightboxOpen: (v: boolean) => void
  setIsPaused: (v: boolean) => void
  goPrev: () => void
  goNext: () => void
  goToSlide: (i: number) => void
}

const MobileSlideshowBanner: React.FC<MobileBannerProps> = ({
  confirmedUseCustom, confirmedSlideshowUrls, slides, currentSlide,
  activeSlideCount, mobileBannerTapped, isPaused: _isPaused, mobileTapTimer,
  setMobileBannerTapped, setLightboxOpen, setIsPaused, goPrev, goNext, goToSlide,
}) => (
  <div
    style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#111', borderRadius: 12, overflow: 'hidden', marginBottom: 16, cursor: 'zoom-in' }}
    onClick={() => {
      if (!mobileBannerTapped) { setLightboxOpen(true); setIsPaused(true) }
      setMobileBannerTapped(true)
      if (mobileTapTimer.current) clearTimeout(mobileTapTimer.current)
      mobileTapTimer.current = setTimeout(() => setMobileBannerTapped(false), 3000)
    }}
  >
    {confirmedUseCustom ? (
      confirmedSlideshowUrls.map((url, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: i === currentSlide ? 1 : 0, transition: 'opacity 0.9s ease', zIndex: i === currentSlide ? 1 : 0 }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ))
    ) : (
      slides.map((sl, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${sl.image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === currentSlide ? 1 : 0, transition: 'opacity 0.9s ease', zIndex: i === currentSlide ? 1 : 0 }} />
      ))
    )}
    {/* Controls */}
    {activeSlideCount > 1 && (
      <>
        <button onClick={e => { e.stopPropagation(); goPrev() }} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: mobileBannerTapped ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: mobileBannerTapped ? 'auto' : 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); goNext() }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: mobileBannerTapped ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: mobileBannerTapped ? 'auto' : 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
          {Array.from({ length: activeSlideCount }).map((_, i) => (
            <div key={i} onClick={() => goToSlide(i)} style={{ width: i === currentSlide ? 20 : 6, height: 6, borderRadius: 3, background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)', transition: 'width 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
      </>
    )}
  </div>
)

// ── Helper: Lightbox ──────────────────────────────────────────
interface LightboxProps {
  open: boolean
  onClose: () => void
  confirmedUseCustom: boolean
  confirmedSlideshowUrls: string[]
  slides: typeof slides
  currentSlide: number
  activeSlideCount: number
  goPrev: () => void
  goNext: () => void
}

const SlideshowLightbox: React.FC<LightboxProps> = ({
  open, onClose, confirmedUseCustom, confirmedSlideshowUrls,
  slides, currentSlide, activeSlideCount, goPrev, goNext,
}) => {
  if (!open) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      {activeSlideCount > 1 && (
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>
          {currentSlide + 1} / {activeSlideCount}
        </div>
      )}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {confirmedUseCustom ? (
          <img src={confirmedSlideshowUrls[currentSlide]} alt="" style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12, display: 'block' }} />
        ) : (
          <div style={{ width: '70vw', maxWidth: 800, height: '80vh', backgroundImage: `url(${slides[currentSlide]?.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12 }} />
        )}
        {activeSlideCount > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); goPrev() }} style={{ position: 'absolute', left: -56, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); goNext() }} style={{ position: 'absolute', right: -56, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}


// ── Styles component ──────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }

      .pru-form-panel {
        scrollbar-width: thin;
        scrollbar-color: #e5e7eb transparent;
      }
      .pru-form-panel::-webkit-scrollbar { width: 4px; }
      .pru-form-panel::-webkit-scrollbar-track { background: transparent; }
      .pru-form-panel::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      .pru-form-panel::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      .pru-input {
        width: 100%;
        padding: 13px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f9fafb;
        color: #1f2937;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        appearance: auto;
      }
      select.pru-input { cursor: pointer; }
      select.pru-input:disabled { opacity: 0.5; cursor: not-allowed; }
      .pru-input:focus {
        border-color: #DC143C;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(220,20,60,0.08);
      }
      .pru-input::placeholder { color: #9ca3af; }

      .pru-btn {
        width: 100%;
        padding: 14px;
        background: #DC143C;
        color: white;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 700;
        font-size: 15px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
        box-shadow: 0 4px 18px rgba(220,20,60,0.22);
      }
      .pru-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        background: #b01030;
        box-shadow: 0 6px 24px rgba(220,20,60,0.28);
      }
      .pru-btn:active:not(:disabled) { transform: translateY(0); }
      .pru-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      .pru-spinner {
        width: 44px; height: 44px;
        border: 3px solid #e5e7eb;
        border-top-color: #DC143C;
        border-radius: 50%;
        animation: pru-spin 0.75s linear infinite;
      }
      .btn-spinner {
        display: inline-block;
        width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: pru-spin 0.6s linear infinite;
      }
      @keyframes pru-spin { to { transform: rotate(360deg); } }

      @media (max-width: 768px) {
        .pru-visual-panel { display: none !important; }
        .pru-mobile-banner { display: block !important; }
        .pru-card {
          grid-template-columns: 1fr !important;
          border-radius: 16px !important;
          min-height: unset !important;
          overflow: visible !important;
        }
        .pru-form-panel {
          border-radius: 16px !important;
          min-height: unset !important;
        }
        .pru-page {
          padding: 16px !important;
          align-items: flex-start !important;
        }
        /* More breathing room on mobile — logo and banner get extra space */
        .pru-form-panel {
          padding: 28px 24px 32px !important;
          gap: 0;
        }
        /* Logo bottom margin */
        .pru-logo { margin-bottom: 24px !important; }
        /* Banner bottom margin already set inline (20px) */
        /* Event title — more gap above form */
        .pru-event-title { margin-bottom: 12px !important; }
        /* Info box — tighter bottom margin before form */
        .pru-info-box { margin-bottom: 16px !important; }
      }
      @media (min-width: 769px) {
        .pru-mobile-banner { display: none !important; }
      }
    `}</style>
  )
}

// ── Inline styles ─────────────────────────────────────────────
const FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0f1f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: FONT,
  },
  fullPage: {
    minHeight: '100vh',
    background: '#f0f1f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT,
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
    maxWidth: 1100,
    minHeight: 'min(620px, 88vh)',
    borderRadius: 10,
    boxShadow: '0 28px 80px rgba(220,20,60,0.08), 0 8px 24px rgba(0,0,0,0.08)',
    background: '#fff',
    overflow: 'hidden',
    alignItems: 'stretch',
  },

  // ── Form Panel ─────────────────────────────────────────────
  formPanel: {
    padding: '28px 36px 32px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '10px 0 0 10px',
    minHeight: 'min(620px, 88vh)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  logoMark: {
    width: 40, height: 40,
    background: '#fff',
    borderRadius: 9,
    border: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    padding: 2,
  },
  logoName: {
    fontFamily: FONT,
    fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em',
  },
  logoSub: { fontSize: 11, color: '#6b7280', letterSpacing: '0.2px', marginTop: 1 },

  // ── Event Info Unified Box ─────────────────────────────────
  eventInfoBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '4px 0',
    marginBottom: 14,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '11px 16px',
  },
  infoRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
    paddingTop: 1,
    flexShrink: 0,
  },
  infoIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoRowValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1f2937',
    lineHeight: 1.4,
    flex: 1,
  },
  infoRowSub: {
    fontSize: 12,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  infoDivider: {
    height: 1,
    background: '#e5e7eb',
    margin: '0 16px',
  },
  infoLabelDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#DC143C',
    flexShrink: 0,
    display: 'inline-block',
  },
  infoCardIconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  heading: {
    fontFamily: FONT,
    fontSize: '1.7rem', fontWeight: 800, color: '#1f2937',
    lineHeight: 1.15, marginBottom: 4, letterSpacing: '-0.03em',
  },
  subheading: { fontSize: 13.5, color: '#6b7280', marginBottom: 16 },

  errorBanner: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: 12, padding: '10px 14px', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
  formGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 11, fontWeight: 700, color: '#6b7280',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
  },

  notice: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
    padding: '10px 13px', fontSize: 12, color: '#92400e',
  },

  // ── Visual Panel ───────────────────────────────────────────
  visualPanel: {
    position: 'relative', overflow: 'hidden', background: '#DC143C',
    borderRadius: '0 10px 10px 0',
    minHeight: 'min(620px, 88vh)',
  },

  // ── Poster mode ────────────────────────────────────────────
  posterWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  posterImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.0) 100%)',
    padding: '32px 28px 28px',
    color: 'white',
    zIndex: 2,
  },
  posterEventLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#DC143C',
    background: 'rgba(255,255,255,0.95)',
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    marginBottom: 10,
  },
  posterEventTitle: {
    fontFamily: FONT,
    fontSize: '1.4rem',
    fontWeight: 800,
    lineHeight: 1.25,
    marginBottom: 10,
    letterSpacing: '-0.02em',
  },
  posterEventMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Slideshow mode ─────────────────────────────────────────
  slide: {
    position: 'absolute', inset: 0, transition: 'opacity 0.9s ease',
  },
  slidePattern: {
    position: 'absolute', inset: 0, opacity: 0.05,
    backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 22px)',
  },
  slideOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.05) 55%)',
  },
  slideContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '36px 32px 52px', color: 'white',
    zIndex: 2,
  },
  slideTag: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.22)',
    padding: '4px 12px', borderRadius: 20,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  slideHeadline: {
    fontFamily: FONT,
    fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.25,
    marginBottom: 10, letterSpacing: '-0.02em',
  },
  slideDesc: {
    fontSize: 12.5, opacity: 0.75, lineHeight: 1.65, maxWidth: 280, marginBottom: 20,
  },
  pillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  pill: {
    background: 'rgba(255,255,255,0.11)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10,
    padding: '10px 8px', textAlign: 'center' as const,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  pillIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  pillName: { fontSize: 10, fontWeight: 600, opacity: 0.88, lineHeight: 1.3, color: 'white' },

  topBadge: {
    position: 'absolute', top: 22, left: 22, zIndex: 10,
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12,
    padding: '8px 14px',
    display: 'flex', alignItems: 'center', gap: 9, color: 'white',
  },
  badgeIcon: {
    width: 28, height: 28,
    background: 'white',
    borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    padding: 2,
    flexShrink: 0,
  },
  badgeName: { fontSize: 12, fontWeight: 700 },
  badgeSub: { fontSize: 10, opacity: 0.6 },

  dots: {
    position: 'absolute', bottom: 18, right: 28, zIndex: 10,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  dot: {
    height: 6, borderRadius: 3, cursor: 'pointer',
    transition: 'width 0.3s ease, background 0.3s ease',
  },

  // ── State screens ──────────────────────────────────────────
  spinnerWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  stateCard: {
    background: '#fff', borderRadius: 18, padding: '44px 36px',
    textAlign: 'center' as const, maxWidth: 360,
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  stateIcon: {
    width: 56, height: 56, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  stateTitle: {
    fontFamily: FONT,
    fontSize: 20, fontWeight: 800, color: '#1f2937', marginBottom: 8,
  },
  stateText: { fontSize: 13, color: '#6b7280' },
}