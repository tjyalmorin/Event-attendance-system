import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'

// ── Types ─────────────────────────────────────────────────────
type FieldType = 'text' | 'dropdown' | 'radio' | 'checkbox' | 'date'

interface FieldCondition {
  field_key: string
  operator: 'eq' | 'neq'
  value: string
}

interface PageConditionRule {
  field_key: string
  operator: 'eq' | 'neq'
  value: string
}

interface PageConditions {
  logic: 'AND' | 'OR'
  rules: PageConditionRule[]
}

interface FormField {
  _id: string
  field_key: string
  label: string
  field_type: FieldType
  options: string[]
  is_required: boolean
  sort_order: number
  page_number: number
  page_title: string
  page_description: string
  condition: FieldCondition | null
}

interface Page {
  page_number: number
  title: string
  description: string
  conditions: PageConditions | null  // replaces single condition
  is_final: boolean                  // always shown last, ignores conditions
}

const FIELD_TYPES: { type: FieldType; label: string; color: string; bg: string }[] = [
  { type: 'text',     label: 'Text input',    color: '#185FA5', bg: '#E6F1FB' },
  { type: 'dropdown', label: 'Dropdown',      color: '#0F6E56', bg: '#E1F5EE' },
  { type: 'radio',    label: 'Radio buttons', color: '#854F0B', bg: '#FAEEDA' },
  { type: 'checkbox', label: 'Checkbox',      color: '#534AB7', bg: '#EEEDFE' },
  { type: 'date',     label: 'Date picker',   color: '#993556', bg: '#FBEAF0' },
]

const BUILTIN_FIELDS: Omit<FormField, '_id' | 'sort_order' | 'page_number' | 'page_title' | 'page_description' | 'condition'>[] = [
  { field_key: 'agent_code',  label: 'Agent code',  field_type: 'text',     options: [], is_required: true },
  { field_key: 'full_name',   label: 'Full name',   field_type: 'text',     options: [], is_required: true },
  { field_key: 'branch_name', label: 'Branch name', field_type: 'dropdown', options: [], is_required: true },
  { field_key: 'team_name',   label: 'Team name',   field_type: 'dropdown', options: [], is_required: true },
  { field_key: 'agent_type',  label: 'Agent type',  field_type: 'radio',
    options: ['District Manager', 'Area Manager', 'Branch Manager', 'Unit Manager', 'Agent'], is_required: true },
]

let _idCounter = 0
const newId = () => `f_${Date.now()}_${_idCounter++}`

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  _id: newId(), field_key: '', label: '', field_type: 'text', options: [],
  is_required: false, sort_order: 0, page_number: 1, page_title: 'Page 1',
  page_description: '', condition: null, ...overrides,
})

// ── Icons ─────────────────────────────────────────────────────
const IcoGrip = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4.5" cy="3.5" r="1"/><circle cx="9.5" cy="3.5" r="1"/><circle cx="4.5" cy="7" r="1"/><circle cx="9.5" cy="7" r="1"/><circle cx="4.5" cy="10.5" r="1"/><circle cx="9.5" cy="10.5" r="1"/></svg>
const IcoTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const IcoEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoAlert = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoForm = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>

// ── ModalShell ────────────────────────────────────────────────
interface ModalShellProps {
  onClose: () => void; icon: React.ReactNode; iconClass?: string
  title: string; subtitle?: string; children: React.ReactNode
  footer: React.ReactNode; wide?: boolean; scrollable?: boolean
}
const CancelBtn = ({ onClick, label = 'Cancel' }: { onClick: () => void; label?: string }) => (
  <button onClick={onClick} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">{label}</button>
)
const ModalShell: React.FC<ModalShellProps> = ({ onClose, icon, iconClass = 'text-gray-500 dark:text-gray-400', title, subtitle, children, footer, wide = false, scrollable = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className={`bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full mx-4 flex flex-col ${wide ? 'max-w-lg' : 'max-w-md'} ${scrollable ? 'max-h-[90vh]' : ''}`}>
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424] rounded-t-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className={iconClass}>{icon}</span>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"><IcoX /></button>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
      <div className={`px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${scrollable ? 'overflow-y-auto flex-1 [scrollbar-color:theme(colors.gray.300)_transparent] dark:[scrollbar-color:theme(colors.gray.600)_transparent] [scrollbar-width:thin]' : ''}`}>{children}</div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
      <div className="flex justify-end gap-2.5 px-5 py-4 bg-gray-50 dark:bg-[#242424] rounded-b-2xl flex-shrink-0">{footer}</div>
    </div>
  </div>
)

// ── Main component ────────────────────────────────────────────
export default function CreateRegistrationForm() {
  const { event_id } = useParams<{ event_id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const justCreated = (location.state as any)?.justCreated === true

  const [eventTitle, setEventTitle] = useState('')
  const [pages, setPages] = useState<Page[]>([{ page_number: 1, title: 'Basic info', description: '', conditions: null, is_final: false }])
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activePage, setActivePage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDeletePageModal, setShowDeletePageModal] = useState<number | null>(null)
  const [editingPageNum, setEditingPageNum] = useState<number | null>(null)
  const [pageDraft, setPageDraft] = useState<{ title: string; description: string; conditions: PageConditions | null; is_final: boolean }>({ title: '', description: '', conditions: null, is_final: false })

  const selectedField = fields.find(f => f._id === selectedId) ?? null

  // ── localStorage autosave key ─────────────────────────────────
  const DRAFT_KEY = event_id ? `form_draft_${event_id}` : null

  // ── Load — server first, then localStorage fallback ──────────
  useEffect(() => {
    if (!event_id) return
    const load = async () => {
      try {
        const [evRes, fieldsRes] = await Promise.all([
          api.get(`/events/${event_id}`),
          api.get(`/participants/form-fields/${event_id}`).catch(() => ({ data: [] })),
        ])
        setEventTitle(evRes.data.title ?? '')
        const existing: any[] = fieldsRes.data ?? []

        // Check localStorage for a newer draft
        const localRaw = DRAFT_KEY ? localStorage.getItem(DRAFT_KEY) : null
        if (localRaw) {
          try {
            const local = JSON.parse(localRaw)
            // Local draft is newer — prefer it
            setPages(local.pages ?? [{ page_number: 1, title: 'Basic info', description: '', conditions: null }])
            setFields((local.fields ?? []).map((f: any) => ({ ...f, _id: newId() })))
            setLoadingExisting(false)
            return
          } catch { /* malformed local draft, fall through to server */ }
        }

        // No local draft — use server data
        if (existing.length > 0) {
          const pageNums = [...new Set(existing.map((f: any) => f.page_number as number))].sort((a, b) => a - b)
          setPages(pageNums.map(pn => {
            const sample = existing.find((f: any) => f.page_number === pn)
            let conditions = sample?.page_conditions ?? null
            if (!conditions && sample?.page_condition) {
              conditions = { logic: 'AND' as const, rules: [sample.page_condition] }
            }
            return {
              page_number: pn,
              title: sample?.page_title ?? `Page ${pn}`,
              description: sample?.page_description ?? '',
              conditions,
              is_final: sample?.is_final ?? false,
            }
          }))
          setFields(existing.map((f: any) => ({
            ...f, _id: newId(),
            options: Array.isArray(f.options) ? f.options : [],
            condition: f.condition ?? null,
          })))
        } else {
          setFields(BUILTIN_FIELDS.map((bf, i) => makeField({ ...bf, sort_order: i, page_number: 1, page_title: 'Basic info', page_description: '' })))
        }
      } catch { /* ignore */ }
      finally { setLoadingExisting(false) }
    }
    load()
  }, [event_id])

  // ── Autosave to localStorage on every change ─────────────────
  const [hasLocalDraft, setHasLocalDraft] = useState(false)

  useEffect(() => {
    if (loadingExisting || !DRAFT_KEY || fields.length === 0) return
    const draft = { pages, fields: fields.map(f => {
      // Strip _id before saving — it's regenerated on load
      const { _id, ...rest } = f
      return rest
    })}
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setHasLocalDraft(true)
    } catch { /* storage full or unavailable */ }
  }, [pages, fields, loadingExisting])

  // ── Helpers ───────────────────────────────────────────────────
  const pageFields = (pNum: number) => fields.filter(f => f.page_number === pNum).sort((a, b) => a.sort_order - b.sort_order)
  const activePageFields = pageFields(activePage)

  // All radio/dropdown fields that could be condition sources
  const conditionSources = fields.filter(f => (f.field_type === 'radio' || f.field_type === 'dropdown') && f.options.length > 0 && f.field_key)

  // For a field: only earlier fields in the form can be sources
  const sourcesForField = (field: FormField) => conditionSources.filter(src =>
    src._id !== field._id &&
    (src.page_number < field.page_number ||
      (src.page_number === field.page_number && src.sort_order < field.sort_order))
  )

  // For a page: only fields from earlier pages
  const sourcesForPage = (pageNum: number) => conditionSources.filter(src => src.page_number < pageNum)

  const updateField = useCallback((id: string, patch: Partial<FormField>) => {
    setFields(prev => prev.map(f => f._id === id ? { ...f, ...patch } : f))
  }, [])

  const addFieldToPage = (type: FieldType) => {
    const pageFs = fields.filter(f => f.page_number === activePage)
    const maxOrder = pageFs.length > 0 ? Math.max(...pageFs.map(f => f.sort_order)) : -1
    const page = pages.find(p => p.page_number === activePage)!
    const n = makeField({ field_type: type, label: '', field_key: `field_${newId()}`, page_number: activePage, page_title: page.title, page_description: page.description, sort_order: maxOrder + 1, condition: null })
    setFields(prev => [...prev, n])
    setSelectedId(n._id)
  }

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f._id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const addPage = () => {
    const nextNum = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) + 1 : 1
    setPages(prev => [...prev, { page_number: nextNum, title: `Page ${nextNum}`, description: '', conditions: null, is_final: false }])
    setActivePage(nextNum)
  }

  const confirmDeletePage = (num: number) => { if (pages.length > 1) setShowDeletePageModal(num) }

  const executeDeletePage = (num: number) => {
    const remaining = pages.filter(p => p.page_number !== num)
    setPages(remaining)
    setFields(prev => prev.filter(f => f.page_number !== num))
    if (activePage === num) setActivePage(remaining[remaining.length - 1]?.page_number ?? 1)
    setShowDeletePageModal(null)
  }

  const openEditPage = (page: Page) => {
    setPageDraft({ title: page.title, description: page.description, conditions: page.conditions, is_final: page.is_final })
    setEditingPageNum(page.page_number)
  }

  const savePageEdit = () => {
    if (!editingPageNum) return
    const title = pageDraft.title.trim() || `Page ${editingPageNum}`
    // If is_final, clear conditions — final pages always show, no conditions needed
    const conditions = pageDraft.is_final ? null : pageDraft.conditions
    setPages(prev => prev.map(p => p.page_number === editingPageNum
      ? { ...p, title, description: pageDraft.description, conditions, is_final: pageDraft.is_final }
      : p
    ))
    setFields(prev => prev.map(f => f.page_number === editingPageNum
      ? { ...f, page_title: title, page_description: pageDraft.description }
      : f
    ))
    setEditingPageNum(null)
  }

  // Drag reorder within a page
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('fieldId')
    if (sourceId === targetId) return
    setFields(prev => {
      const pageFs = [...prev.filter(f => f.page_number === activePage)].sort((a, b) => a.sort_order - b.sort_order)
      const others = prev.filter(f => f.page_number !== activePage)
      const si = pageFs.findIndex(f => f._id === sourceId)
      const ti = pageFs.findIndex(f => f._id === targetId)
      if (si === -1 || ti === -1) return prev
      const r = [...pageFs]; const [m] = r.splice(si, 1); r.splice(ti, 0, m)
      return [...others, ...r.map((f, i) => ({ ...f, sort_order: i }))]
    })
    setDragOver(null)
  }

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async (andPublish = false) => {
    const invalid = fields.filter(f => !f.label.trim())
    if (invalid.length > 0) { setSelectedId(invalid[0]._id); alert(`${invalid.length} field(s) are missing a label.`); return }
    setSaving(true)
    try {
      const payload = fields.map(f => {
        const page = pages.find(p => p.page_number === f.page_number)
        const key = (f.field_key.trim() || f.label.trim()).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        return {
          field_key: key, label: f.label.trim(), field_type: f.field_type,
          options: f.options.filter(o => o.trim()), is_required: f.is_required,
          sort_order: f.sort_order, page_number: f.page_number,
          page_title: page?.title ?? f.page_title,
          page_description: page?.description ?? f.page_description,
          page_conditions: page?.conditions ?? null,
          is_final:        page?.is_final ?? false,
          condition: f.condition,
        }
      })
      await api.put(`/participants/form-fields/${event_id}`, { fields: payload })
      // Clear local draft — server is now up to date
      if (DRAFT_KEY) { localStorage.removeItem(DRAFT_KEY); setHasLocalDraft(false) }
      if (andPublish) {
        await api.put(`/events/${event_id}`, { status: 'open' })
        navigate(`/admin/events/${event_id}`)
        return
      }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to save form.')
    } finally { setSaving(false); setShowPublishModal(false) }
  }

  if (loadingExisting) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="text-sm text-gray-400">Loading form builder...</div>
    </div>
  )

  const activePg = pages.find(p => p.page_number === activePage)

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f1f3] dark:bg-[#0f0f0f]">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
        <button onClick={() => navigate(`/admin/events/${event_id}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-xl hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to event
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Registration form</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{eventTitle}</div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><IcoCheck /></div>
            <span className="text-gray-400 dark:text-gray-500">Event details</span>
          </div>
          <div className="w-5 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#DC143C] flex items-center justify-center text-white text-[9px] font-bold">2</div>
            <span className="font-semibold text-gray-900 dark:text-white">Registration form</span>
          </div>
          <div className="w-5 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] flex items-center justify-center text-gray-400 text-[9px] font-bold">3</div>
            <span className="text-gray-400 dark:text-gray-500">Publish</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasLocalDraft && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Unsaved local draft
              <button onClick={() => {
                if (DRAFT_KEY) { localStorage.removeItem(DRAFT_KEY); setHasLocalDraft(false) }
                window.location.reload()
              }} className="underline text-amber-700 dark:text-amber-300 hover:no-underline">Discard</button>
            </div>
          )}
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all disabled:opacity-50">
            {saved ? <><IcoCheck /><span className="text-green-600 dark:text-green-400">Saved!</span></> : saving ? 'Saving...' : 'Save draft'}
          </button>
          <button onClick={() => setShowPublishModal(true)} disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50">
            Save & publish →
          </button>
        </div>
      </div>

      {justCreated && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
          <IcoCheck /> Event created! Build your registration form, then save &amp; publish when ready.
        </div>
      )}

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* LEFT sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616] flex flex-col overflow-y-auto">
          <div className="p-3 flex flex-col gap-4">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Add field</div>
              <div className="flex flex-col gap-1">
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} onClick={() => addFieldToPage(ft.type)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-700 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] transition-all text-left">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: ft.bg }}>
                      <span style={{ color: ft.color }}><IcoPlus /></span>
                    </div>
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

            <div>
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Pages</div>
              <div className="flex flex-col gap-1">
                {pages.map(p => (
                  <div key={p.page_number} className="group relative">
                    <button onClick={() => setActivePage(p.page_number)}
                      className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all pr-10 ${
                        activePage === p.page_number
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                      }`}>
                      <span className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${activePage === p.page_number ? 'border-white/40 text-white' : 'border-gray-300 dark:border-[#3a3a3a] text-gray-400'}`}>{p.page_number}</span>
                      <span className="truncate">{p.title}</span>
                      {p.conditions && p.conditions.rules.length > 0 && !p.is_final && <span className={`text-[8px] px-1 py-0.5 rounded font-semibold flex-shrink-0 ${activePage === p.page_number ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>IF</span>}
                      {p.is_final && <span className={`text-[8px] px-1 py-0.5 rounded font-semibold flex-shrink-0 ${activePage === p.page_number ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>LAST</span>}
                    </button>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); openEditPage(p) }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all ${activePage === p.page_number ? 'text-white/70 hover:bg-white/20' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}>
                        <IcoEdit />
                      </button>
                      {pages.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); confirmDeletePage(p.page_number) }}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${activePage === p.page_number ? 'text-white/70 hover:bg-white/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                          <IcoTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addPage}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-dashed border-gray-300 dark:border-[#3a3a3a] text-xs text-gray-400 dark:text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] transition-all mt-1">
                  <IcoPlus /> Add page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER canvas */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">

              {/* Page header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#242424]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#DC143C]">Page {activePage}</span>
                    {activePg?.is_final && (
                      <span className="text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">Always last</span>
                    )}
                    {activePg?.conditions && activePg.conditions.rules.length > 0 && !activePg.is_final && (
                      <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">Conditional page</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{activePg?.title}</div>
                  {activePg?.description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activePg.description}</div>}
                  {activePg?.conditions && activePg.conditions.rules.length > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex flex-wrap gap-1">
                      <span>Shows when</span>
                      {activePg.conditions.rules.map((r, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="font-bold">{activePg.conditions!.logic}</span>}
                          <span><span className="font-semibold">{r.field_key}</span> {r.operator === 'eq' ? '=' : '≠'} <span className="font-semibold">"{r.value}"</span></span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{activePageFields.length} field{activePageFields.length !== 1 ? 's' : ''}</span>
                  <button onClick={() => activePg && openEditPage(activePg)}
                    className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-[#DC143C] transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                    <IcoEdit /> Edit page
                  </button>
                </div>
              </div>

              {activePageFields.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No fields yet — click a field type on the left to add one.</div>
              ) : (
                activePageFields.map(field => (
                  <div key={field._id} draggable
                    onDragStart={e => e.dataTransfer.setData('fieldId', field._id)}
                    onDragOver={e => { e.preventDefault(); setDragOver(field._id) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => handleDrop(e, field._id)}
                    onClick={() => setSelectedId(field._id)}
                    className={`flex items-start gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-[#2a2a2a] cursor-pointer transition-all ${
                      dragOver === field._id ? 'bg-red-50 dark:bg-red-900/10' : ''
                    } ${selectedId === field._id
                        ? 'border-l-2 border-l-[#DC143C] bg-red-50/50 dark:bg-red-900/5'
                        : 'border-l-2 border-l-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}>
                    <div className="text-gray-300 dark:text-gray-600 pt-0.5 cursor-grab"><IcoGrip /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                        {field.label || <span className="text-gray-300 dark:text-gray-600 italic">Untitled field</span>}
                        {field.is_required && <span className="text-[#DC143C] ml-1">*</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: FIELD_TYPES.find(t => t.type === field.field_type)?.bg, color: FIELD_TYPES.find(t => t.type === field.field_type)?.color }}>
                          {FIELD_TYPES.find(t => t.type === field.field_type)?.label}
                        </span>
                        {field.is_required
                          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">Required</span>
                          : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400">Optional</span>
                        }
                        {field.condition && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            If {field.condition.field_key} {field.condition.operator === 'eq' ? '=' : '≠'} "{field.condition.value}"
                          </span>
                        )}
                        {field.options.length > 0 && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{field.options.length} option{field.options.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeField(field._id) }}
                      className="w-7 h-7 rounded-lg border border-gray-100 dark:border-[#2a2a2a] flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0">
                      <IcoTrash />
                    </button>
                  </div>
                ))
              )}

              <button onClick={() => addFieldToPage('text')}
                className="flex items-center gap-1.5 w-full px-5 py-3 text-xs text-gray-400 dark:text-gray-500 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/10 border-t border-dashed border-gray-200 dark:border-[#2a2a2a] transition-all">
                <IcoPlus /> Add field to this page
              </button>
            </div>

            {/* Hint */}
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3">
              <span className="flex-shrink-0 mt-0.5 text-gray-300 dark:text-gray-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
              <span><strong className="text-gray-600 dark:text-gray-300">How paging + conditions work:</strong> Fields on Page 1 are always shown. Pages 2+ can have a <strong className="text-gray-600 dark:text-gray-300">page condition</strong> (set via Edit Page) so the whole page only appears when a previous answer matches. Individual fields can also have their own condition in the right panel.</span>
            </div>
          </div>
        </div>

        {/* RIGHT inspector */}
        <div className="w-60 flex-shrink-0 border-l border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] overflow-y-auto">
          {!selectedField ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 py-10 text-gray-400 dark:text-gray-500">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mb-3 text-gray-300 dark:text-gray-600"><IcoForm /></div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No field selected</p>
              <p className="text-xs">Click any field to edit its settings.</p>
            </div>
          ) : (
            <InspectorPanel key={selectedField._id} field={selectedField} conditionSources={sourcesForField(selectedField)} allFields={fields} onUpdate={patch => updateField(selectedField._id, patch)} />
          )}
        </div>
      </div>

      {/* Publish modal */}
      {showPublishModal && (
        <ModalShell onClose={() => setShowPublishModal(false)} icon={<IcoForm />} iconClass="text-[#DC143C]"
          title="Save & Publish" subtitle="This will open registration immediately"
          footer={<><CancelBtn onClick={() => setShowPublishModal(false)} /><button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">{saving ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Publishing...</> : 'Yes, publish now'}</button></>}>
          <p>The form will be saved and the event will be set to <strong className="text-gray-800 dark:text-gray-200">Open</strong>. Registrants can sign up immediately.</p>
          <p className="mt-3 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 text-amber-700 dark:text-amber-400"><IcoAlert /> If participants have already registered, editing form fields may affect their existing responses.</p>
        </ModalShell>
      )}

      {/* Delete page modal */}
      {showDeletePageModal !== null && (
        <ModalShell onClose={() => setShowDeletePageModal(null)} icon={<IcoTrash />} iconClass="text-red-500 dark:text-red-400"
          title="Delete Page" subtitle={`Page ${showDeletePageModal} — ${pages.find(p => p.page_number === showDeletePageModal)?.title}`}
          footer={<><CancelBtn onClick={() => setShowDeletePageModal(null)} /><button onClick={() => executeDeletePage(showDeletePageModal!)} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all">Delete page</button></>}>
          <p>Delete <strong className="text-gray-800 dark:text-gray-200">"{pages.find(p => p.page_number === showDeletePageModal)?.title}"</strong>?</p>
          <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-medium">All {pageFields(showDeletePageModal).length} field{pageFields(showDeletePageModal).length !== 1 ? 's' : ''} on this page will also be removed.</p>
        </ModalShell>
      )}

      {/* Edit page modal */}
      {editingPageNum !== null && ((): React.ReactElement | null => {
        const pgSources = sourcesForPage(editingPageNum)
        return (
          <ModalShell onClose={() => setEditingPageNum(null)} icon={<IcoEdit />} title={`Edit Page ${editingPageNum}`} subtitle="Title, description, and conditions" wide scrollable
            footer={<><CancelBtn onClick={() => setEditingPageNum(null)} /><button onClick={savePageEdit} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all">Save changes</button></>}>
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Page title</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C] transition-all"
                  value={pageDraft.title} onChange={e => setPageDraft(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Basic info" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Description <span className="font-normal text-gray-400 normal-case">(optional)</span>
                </label>
                <textarea className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C] transition-all resize-none"
                  rows={2} value={pageDraft.description} onChange={e => setPageDraft(p => ({ ...p, description: e.target.value }))} placeholder="Shown below the page title on the form…" />
              </div>
              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

              {/* Always show last toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Always show last</div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    This page will always appear at the end of the form, after all conditional pages — regardless of what the registrant answered. Use this for shared closing questions or confirmations.
                  </p>
                </div>
                <button type="button" onClick={() => setPageDraft(p => ({ ...p, is_final: !p.is_final, conditions: !p.is_final ? null : p.conditions }))}
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${pageDraft.is_final ? 'bg-purple-500' : 'bg-gray-200 dark:bg-[#3a3a3a]'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${pageDraft.is_final ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

              {/* Conditional logic — disabled when is_final */}
              <div className={pageDraft.is_final ? 'opacity-40 pointer-events-none select-none' : ''}>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Conditional page</div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">
                  {pageDraft.is_final
                    ? 'Disabled — "Always show last" pages are always visible.'
                    : 'This entire page only appears when the conditions below are met. Leave empty to always show.'}
                </p>
                {editingPageNum === 1 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">Page 1 always shows and cannot have conditions.</p>
                ) : pgSources.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No radio/dropdown fields on earlier pages yet. Add one first.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pageDraft.conditions && pageDraft.conditions.rules.length > 0 ? (
                      <>
                        {/* AND / OR toggle */}
                        {pageDraft.conditions.rules.length > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Match</span>
                            <div className="flex rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                              {(['AND', 'OR'] as const).map(l => (
                                <button key={l} type="button"
                                  onClick={() => setPageDraft(p => ({ ...p, conditions: { ...p.conditions!, logic: l } }))}
                                  className={`px-3 py-1 text-xs font-semibold transition-colors ${pageDraft.conditions!.logic === l ? 'bg-[#DC143C] text-white' : 'bg-white dark:bg-[#0f0f0f] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}>
                                  {l}
                                </button>
                              ))}
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">conditions</span>
                          </div>
                        )}

                        {/* Rules list */}
                        {pageDraft.conditions.rules.map((rule, idx) => {
                          const src = pgSources.find(f => f.field_key === rule.field_key)
                          return (
                            <div key={idx} className="flex flex-col gap-2 bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rule {idx + 1}</span>
                                <button type="button"
                                  onClick={() => {
                                    const newRules = pageDraft.conditions!.rules.filter((_, i) => i !== idx)
                                    setPageDraft(p => ({ ...p, conditions: newRules.length > 0 ? { ...p.conditions!, rules: newRules } : null }))
                                  }}
                                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 text-sm leading-none">×</button>
                              </div>
                              <select className="w-full px-3 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C]"
                                value={rule.field_key}
                                onChange={e => {
                                  const newRules = [...pageDraft.conditions!.rules]
                                  newRules[idx] = { ...rule, field_key: e.target.value, value: '' }
                                  setPageDraft(p => ({ ...p, conditions: { ...p.conditions!, rules: newRules } }))
                                }}>
                                <option value="">— Select field —</option>
                                {pgSources.map(f => <option key={f._id} value={f.field_key}>{f.label || f.field_key}</option>)}
                              </select>
                              <select className="w-full px-3 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C]"
                                value={rule.operator}
                                onChange={e => {
                                  const newRules = [...pageDraft.conditions!.rules]
                                  newRules[idx] = { ...rule, operator: e.target.value as 'eq' | 'neq' }
                                  setPageDraft(p => ({ ...p, conditions: { ...p.conditions!, rules: newRules } }))
                                }}>
                                <option value="eq">is equal to</option>
                                <option value="neq">is not equal to</option>
                              </select>
                              {src?.options?.length ? (
                                <select className="w-full px-3 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C]"
                                  value={rule.value}
                                  onChange={e => {
                                    const newRules = [...pageDraft.conditions!.rules]
                                    newRules[idx] = { ...rule, value: e.target.value }
                                    setPageDraft(p => ({ ...p, conditions: { ...p.conditions!, rules: newRules } }))
                                  }}>
                                  <option value="">— Select value —</option>
                                  {src.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input className="w-full px-3 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C]"
                                  value={rule.value}
                                  onChange={e => {
                                    const newRules = [...pageDraft.conditions!.rules]
                                    newRules[idx] = { ...rule, value: e.target.value }
                                    setPageDraft(p => ({ ...p, conditions: { ...p.conditions!, rules: newRules } }))
                                  }}
                                  placeholder="Value to match…" />
                              )}
                            </div>
                          )
                        })}

                        <button type="button"
                          onClick={() => setPageDraft(p => ({ ...p, conditions: { ...p.conditions!, rules: [...p.conditions!.rules, { field_key: pgSources[0]?.field_key ?? '', operator: 'eq', value: '' }] } }))}
                          className="self-start text-xs font-semibold text-[#DC143C] hover:underline">
                          + Add another rule
                        </button>
                      </>
                    ) : (
                      <button type="button"
                        onClick={() => setPageDraft(p => ({ ...p, conditions: { logic: 'AND', rules: [{ field_key: pgSources[0]?.field_key ?? '', operator: 'eq', value: pgSources[0]?.options?.[0] ?? '' }] } }))}
                        className="self-start text-xs font-semibold text-[#DC143C] hover:underline">
                        + Add page condition
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ModalShell>
        )
      })()}
    </div>
  )
}

// ── Inspector Panel ───────────────────────────────────────────
interface InspectorProps {
  field: FormField
  conditionSources: FormField[]
  allFields: FormField[]   // for field key reuse dropdown
  onUpdate: (patch: Partial<FormField>) => void
}

function InspectorPanel({ field, conditionSources, allFields, onUpdate }: InspectorProps) {
  const [optionDraft, setOptionDraft] = useState('')

  const inp = "w-full px-3 py-2 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C] transition-all font-sans"
  const lbl = "block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5"
  const divider = "h-px bg-gray-100 dark:bg-[#2a2a2a] my-3"

  const addOption = () => {
    const v = optionDraft.trim()
    if (!v || field.options.includes(v)) return
    onUpdate({ options: [...field.options, v] })
    setOptionDraft('')
  }

  const condSrc = conditionSources.find(f => f.field_key === field.condition?.field_key)

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Field settings</div>

      <div>
        <label className={lbl}>Label</label>
        <input className={inp} value={field.label} onChange={e => onUpdate({ label: e.target.value })} placeholder="e.g. Agent type" />
      </div>

      <div>
        <label className={lbl}>Field key</label>
        {/* Existing keys from other fields (same key = shared answer slot) */}
        {(() => {
          const existingKeys = [...new Set(
            allFields
              .filter(f => f._id !== field._id && f.field_key.trim())
              .map(f => f.field_key)
          )].sort()
          return existingKeys.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <input className={`${inp} font-mono text-xs`} value={field.field_key}
                onChange={e => onUpdate({ field_key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                placeholder="auto from label" />
              <div>
                <div className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Reuse existing key</div>
                <div className="flex flex-wrap gap-1">
                  {existingKeys.map(k => (
                    <button key={k} type="button"
                      onClick={() => onUpdate({ field_key: k })}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                        field.field_key === k
                          ? 'border-[#DC143C] bg-red-50 dark:bg-red-900/20 text-[#DC143C]'
                          : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                      }`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <input className={`${inp} font-mono text-xs`} value={field.field_key}
              onChange={e => onUpdate({ field_key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
              placeholder="auto from label" />
          )
        })()}
      </div>

      <div>
        <label className={lbl}>Field type</label>
        <select className={inp} value={field.field_type}
          onChange={e => onUpdate({ field_type: e.target.value as FieldType, options: [] })}>
          {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
        </select>
      </div>

      {(field.field_type === 'dropdown' || field.field_type === 'radio') && (
        <div>
          <label className={lbl}>Choices</label>
          {field.options.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 italic">No choices yet.</p>}
          <div className="flex flex-col gap-1.5 mb-2">
            {field.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{opt}</span>
                <button onClick={() => onUpdate({ options: field.options.filter((_, j) => j !== i) })}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors text-sm leading-none">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input className={`${inp} flex-1`} value={optionDraft}
              onChange={e => setOptionDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
              placeholder="Add a choice…" />
            <button onClick={addOption} className="px-2.5 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] transition-all">Add</button>
          </div>
        </div>
      )}

      <div className={divider} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
        <button onClick={() => onUpdate({ is_required: !field.is_required })}
          className={`relative w-9 h-5 rounded-full transition-colors ${field.is_required ? 'bg-[#DC143C]' : 'bg-gray-200 dark:bg-[#3a3a3a]'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${field.is_required ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      <div className={divider} />

      <div>
        <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Field condition</div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 leading-relaxed">Show this field only when a specific answer is given earlier.</p>

        {field.condition ? (
          <div className="flex flex-col gap-2 bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Show when…</div>
            <select className={inp} value={field.condition.field_key}
              onChange={e => onUpdate({ condition: { ...field.condition!, field_key: e.target.value, value: '' } })}>
              <option value="">— Select field —</option>
              {conditionSources.map(f => <option key={f._id} value={f.field_key}>{f.label || f.field_key}</option>)}
            </select>
            <select className={inp} value={field.condition.operator}
              onChange={e => onUpdate({ condition: { ...field.condition!, operator: e.target.value as 'eq' | 'neq' } })}>
              <option value="eq">is equal to</option>
              <option value="neq">is not equal to</option>
            </select>
            {condSrc?.options?.length ? (
              <select className={inp} value={field.condition.value}
                onChange={e => onUpdate({ condition: { ...field.condition!, value: e.target.value } })}>
                <option value="">— Select value —</option>
                {condSrc.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className={inp} value={field.condition.value}
                onChange={e => onUpdate({ condition: { ...field.condition!, value: e.target.value } })}
                placeholder="Value to match…" />
            )}
            <button onClick={() => onUpdate({ condition: null })} className="self-start text-xs text-red-500 dark:text-red-400 hover:underline">Remove condition</button>
          </div>
        ) : conditionSources.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Add a radio or dropdown field earlier in the form first.</p>
        ) : (
          <button
            onClick={() => onUpdate({ condition: { field_key: conditionSources[0].field_key, operator: 'eq', value: conditionSources[0].options?.[0] ?? '' } })}
            className="text-xs font-semibold text-[#DC143C] hover:underline">
            + Add condition
          </button>
        )}
      </div>
    </div>
  )
}