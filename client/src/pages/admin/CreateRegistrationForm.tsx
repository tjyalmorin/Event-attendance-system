import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

// ── Types ─────────────────────────────────────────────────────
type FieldType = 'text' | 'dropdown' | 'radio' | 'checkbox' | 'date'

interface ConditionRule { field_key: string; operator: 'eq' | 'neq'; value: string }
interface Conditions { logic: 'AND' | 'OR'; rules: ConditionRule[] }

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
  condition: ConditionRule | null
}

interface Page {
  page_number: number
  title: string
  description: string
  is_final: boolean
  conditions: Conditions | null
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
const IcoGrip  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4.5" cy="3.5" r="1"/><circle cx="9.5" cy="3.5" r="1"/><circle cx="4.5" cy="7" r="1"/><circle cx="9.5" cy="7" r="1"/><circle cx="4.5" cy="10.5" r="1"/><circle cx="9.5" cy="10.5" r="1"/></svg>
const IcoTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const IcoEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoPlus  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoAlert = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoForm  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>

// ── Modal shell ────────────────────────────────────────────────
const CancelBtn = ({ onClick, label = 'Cancel' }: { onClick: () => void; label?: string }) => (
  <button onClick={onClick} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">{label}</button>
)

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; iconClass?: string
  title: string; subtitle?: string; children: React.ReactNode
  footer: React.ReactNode; wide?: boolean; scrollable?: boolean
}> = ({ onClose, icon, iconClass = 'text-gray-500', title, subtitle, children, footer, wide = false, scrollable = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className={`bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] w-full mx-4 flex flex-col ${wide ? 'max-w-lg' : 'max-w-md'} ${scrollable ? 'max-h-[90vh]' : ''}`}>
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424] rounded-t-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className={iconClass}>{icon}</span>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"><IcoX /></button>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
      <div className={`px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${scrollable ? 'overflow-y-auto flex-1' : ''}`}>{children}</div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
      <div className="flex justify-end gap-2.5 px-5 py-4 bg-gray-50 dark:bg-[#242424] rounded-b-2xl flex-shrink-0">{footer}</div>
    </div>
  </div>
)

// ── Condition builder (reusable) ───────────────────────────────
const ConditionBuilder: React.FC<{
  conditions: Conditions | null
  sources: FormField[]
  onChange: (c: Conditions | null) => void
}> = ({ conditions, sources, onChange }) => {
  // rule.field_key stored as "pageNum__fieldKey" internally so we can
  // disambiguate same-key fields across pages. Stripped to plain fieldKey
  // before saving to DB (in handleSave).
  const toOptVal   = (f: FormField) => `${f.page_number}__${f.field_key}`
  const findSrc    = (ruleKey: string) =>
    sources.find(f => toOptVal(f) === ruleKey)           // exact match (new format)
    ?? sources.find(f => f.field_key === ruleKey)        // fallback for old plain format

  const defaultKey = sources[0] ? toOptVal(sources[0]) : ''

  if (sources.length === 0) return (
    <p className="text-xs text-gray-400 italic">No radio or dropdown fields found on earlier pages.</p>
  )
  if (!conditions || conditions.rules.length === 0) return (
    <button type="button"
      onClick={() => onChange({ logic: 'AND', rules: [{ field_key: defaultKey, operator: 'eq', value: sources[0]?.options?.[0] ?? '' }] })}
      className="text-xs text-[#DC143C] hover:underline">+ Add condition</button>
  )
  return (
    <div className="flex flex-col gap-2">
      {conditions.rules.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Match</span>
          {(['AND', 'OR'] as const).map(l => (
            <button key={l} type="button" onClick={() => onChange({ ...conditions, logic: l })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${conditions.logic === l ? 'bg-[#DC143C] border-[#DC143C] text-white' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C]'}`}>
              {l}
            </button>
          ))}
          <span className="text-xs text-gray-400">conditions</span>
        </div>
      )}
      {conditions.rules.map((rule, i) => {
        const src = findSrc(rule.field_key)
        // If src found but rule was in old plain format, upgrade to new format for display
        const selectVal = src ? toOptVal(src) : rule.field_key
        return (
          <div key={i} className="flex items-center gap-1.5 flex-wrap">
            <select className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-[#DC143C]"
              value={selectVal}
              onChange={e => {
                const r = [...conditions.rules]
                // Store "pageNum__fieldKey" — stripped to plain in handleSave before DB
                r[i] = { ...rule, field_key: e.target.value, value: '' }
                onChange({ ...conditions, rules: r })
              }}>
              <option value="">— field —</option>
              {sources.map(f => (
                <option key={f._id} value={toOptVal(f)}>
                  Page {f.page_number} · {f.label || f.field_key}
                </option>
              ))}
            </select>
            <select className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-[#DC143C]"
              value={rule.operator}
              onChange={e => { const r = [...conditions.rules]; r[i] = { ...rule, operator: e.target.value as 'eq' | 'neq' }; onChange({ ...conditions, rules: r }) }}>
              <option value="eq">is</option>
              <option value="neq">is not</option>
            </select>
            {src?.options?.length ? (
              <select className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-[#DC143C]"
                value={rule.value}
                onChange={e => { const r = [...conditions.rules]; r[i] = { ...rule, value: e.target.value }; onChange({ ...conditions, rules: r }) }}>
                <option value="">— value —</option>
                {src.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-[#DC143C]"
                value={rule.value} placeholder="value"
                onChange={e => { const r = [...conditions.rules]; r[i] = { ...rule, value: e.target.value }; onChange({ ...conditions, rules: r }) }} />
            )}
            <button onClick={() => { const r = conditions.rules.filter((_, j) => j !== i); onChange(r.length > 0 ? { ...conditions, rules: r } : null) }}
              className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0">×</button>
          </div>
        )
      })}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange({ ...conditions, rules: [...conditions.rules, { field_key: defaultKey, operator: 'eq', value: '' }] })}
          className="text-xs text-[#DC143C] hover:underline">+ Add rule</button>
        <button type="button" onClick={() => onChange(null)}
          className="text-xs text-gray-400 hover:text-red-500 hover:underline">Remove all</button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function CreateRegistrationForm() {
  const { event_id } = useParams<{ event_id: string }>()
  const navigate = useNavigate()

  const [eventTitle, setEventTitle] = useState('')
  const [pages, setPages] = useState<Page[]>([{ page_number: 1, title: 'Basic info', description: '', is_final: false, conditions: null }])
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activePage, setActivePage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [dragOverField, setDragOverField] = useState<string | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDeletePageModal, setShowDeletePageModal] = useState<number | null>(null)
  const [editingPageNum, setEditingPageNum] = useState<number | null>(null)
  const [pageDraft, setPageDraft] = useState<{ title: string; description: string; is_final: boolean; conditions: Conditions | null }>
    ({ title: '', description: '', is_final: false, conditions: null })

  // Page drag

  const DRAFT_KEY = event_id ? `form_draft_${event_id}` : null
  const selectedField = fields.find(f => f._id === selectedId) ?? null

  // ── Load ──────────────────────────────────────────────────────
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

        const localRaw = DRAFT_KEY ? localStorage.getItem(DRAFT_KEY) : null
        if (localRaw) {
          try {
            const local = JSON.parse(localRaw)
            setPages(local.pages ?? [{ page_number: 1, title: 'Basic info', description: '', is_final: false, conditions: null }])
            setFields((local.fields ?? []).map((f: any) => ({ ...f, _id: newId() })))
            setLoadingExisting(false)
            return
          } catch {}
        }

        if (existing.length > 0) {
          const pageNums = [...new Set(existing.map((f: any) => f.page_number as number))].sort((a, b) => a - b)
          setPages(pageNums.map(pn => {
            const sample = existing.find((f: any) => f.page_number === pn)
            let conditions: Conditions | null = sample?.page_conditions ?? null
            if (!conditions && sample?.page_condition) {
              conditions = { logic: 'AND', rules: [sample.page_condition] }
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
      } catch {}
      finally { setLoadingExisting(false) }
    }
    load()
  }, [event_id])

  // ── Autosave ──────────────────────────────────────────────────
  const [hasLocalDraft, setHasLocalDraft] = useState(false)
  useEffect(() => {
    if (loadingExisting || !DRAFT_KEY || fields.length === 0) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ pages, fields: fields.map(({ _id, ...rest }) => rest) }))
      setHasLocalDraft(true)
    } catch {}
  }, [pages, fields, loadingExisting])

  // ── Derived ───────────────────────────────────────────────────
  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number)
  const regularPages = sortedPages.filter(p => !p.is_final)
  const finalPages   = sortedPages.filter(p => p.is_final)
  const pageFields   = (pNum: number) => fields.filter(f => f.page_number === pNum).sort((a, b) => a.sort_order - b.sort_order)

  // Sources for page condition: radio/dropdown on all earlier pages
  const sourcesForPage = (pageNum: number) => {
    const idx = sortedPages.findIndex(p => p.page_number === pageNum)
    const priorNums = sortedPages.slice(0, idx).map(p => p.page_number)
    return fields.filter(f =>
      priorNums.includes(f.page_number) &&
      (f.field_type === 'radio' || f.field_type === 'dropdown') &&
      f.options.length > 0 && f.field_key
    )
  }

  // Sources for field condition: earlier radio/dropdown fields
  const sourcesForField = (field: FormField) =>
    fields.filter(f =>
      f._id !== field._id &&
      (f.field_type === 'radio' || f.field_type === 'dropdown') &&
      f.options.length > 0 && f.field_key &&
      (f.page_number < field.page_number ||
        (f.page_number === field.page_number && f.sort_order < field.sort_order))
    )

  const updateField = useCallback((id: string, patch: Partial<FormField>) => {
    setFields(prev => prev.map(f => f._id === id ? { ...f, ...patch } : f))
  }, [])

  const addFieldToPage = (type: FieldType) => {
    const pageFs = fields.filter(f => f.page_number === activePage)
    const maxOrder = pageFs.length > 0 ? Math.max(...pageFs.map(f => f.sort_order)) : -1
    const page = pages.find(p => p.page_number === activePage)!
    const n = makeField({ field_type: type, label: '', field_key: `field_${newId()}`, page_number: activePage, page_title: page.title, page_description: page.description, sort_order: maxOrder + 1 })
    setFields(prev => [...prev, n])
    setSelectedId(n._id)
  }

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f._id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // ── Page management ───────────────────────────────────────────
  const shouldScrollToActive = React.useRef(false)

  // Scroll canvas to active page whenever it changes due to a move
  useEffect(() => {
    if (!shouldScrollToActive.current) return
    shouldScrollToActive.current = false
    const container = document.getElementById('canvas-scroll-container')
    const pageEl = document.getElementById(`page-card-${activePage}`)
    if (!container || !pageEl) return
    const containerRect = container.getBoundingClientRect()
    const pageRect = pageEl.getBoundingClientRect()
    const offset = pageRect.top - containerRect.top + container.scrollTop - 80
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }, [activePage])

  const movePageUp = (pageNum: number) => {
    const sorted = [...pages].sort((a, b) => a.page_number - b.page_number)
    const idx = sorted.findIndex(p => p.page_number === pageNum)
    if (idx <= 0) return
    // The two pages being swapped
    const numA = sorted[idx - 1].page_number  // goes up (takes pageNum's spot)
    const numB = sorted[idx].page_number      // = pageNum, goes down (takes numA's spot)
    // Swap their page_numbers in pages array
    setPages(prev => prev.map(p => {
      if (p.page_number === numA) return { ...p, page_number: numB }
      if (p.page_number === numB) return { ...p, page_number: numA }
      return p
    }))
    // Swap field assignments
    setFields(prev => prev.map(f => {
      if (f.page_number === numA) return { ...f, page_number: numB }
      if (f.page_number === numB) return { ...f, page_number: numA }
      return f
    }))
    // Follow the moved page — it's now at numA's old spot
    shouldScrollToActive.current = true
    setActivePage(numA)
  }

  const movePageDown = (pageNum: number) => {
    const sorted = [...pages].sort((a, b) => a.page_number - b.page_number)
    const idx = sorted.findIndex(p => p.page_number === pageNum)
    if (idx >= sorted.length - 1) return
    // The two pages being swapped
    const numA = sorted[idx].page_number      // = pageNum, goes down
    const numB = sorted[idx + 1].page_number  // goes up (takes pageNum's spot)
    // Swap their page_numbers in pages array
    setPages(prev => prev.map(p => {
      if (p.page_number === numA) return { ...p, page_number: numB }
      if (p.page_number === numB) return { ...p, page_number: numA }
      return p
    }))
    // Swap field assignments
    setFields(prev => prev.map(f => {
      if (f.page_number === numA) return { ...f, page_number: numB }
      if (f.page_number === numB) return { ...f, page_number: numA }
      return f
    }))
    // Follow the moved page — it's now at numB's old spot
    shouldScrollToActive.current = true
    setActivePage(numB)
  }

  const addPage = () => {
    const nextNum = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) + 1 : 1
    setPages(prev => [...prev, { page_number: nextNum, title: `Page ${nextNum}`, description: '', is_final: false, conditions: null }])
    shouldScrollToActive.current = true
    setActivePage(nextNum)
    setSelectedId(null)
  }

  // Insert a new blank page right after the given page number, shifting later pages up
  const addPageAfter = (afterPageNum: number) => {
    const sorted = [...pages].sort((a, b) => a.page_number - b.page_number)
    const insertAt = sorted.findIndex(p => p.page_number === afterPageNum) + 1
    const newPageNum = afterPageNum + 1

    // Shift all pages with page_number > afterPageNum up by 1
    const shiftedPages = sorted.map(p =>
      p.page_number > afterPageNum ? { ...p, page_number: p.page_number + 1 } : p
    )
    // Insert new page at the right spot
    const newPage = { page_number: newPageNum, title: `Page ${insertAt + 1}`, description: '', is_final: false, conditions: null }
    setPages([...shiftedPages, newPage])

    // Shift fields accordingly
    setFields(prev => prev.map(f =>
      f.page_number > afterPageNum ? { ...f, page_number: f.page_number + 1 } : f
    ))

    shouldScrollToActive.current = true
    setActivePage(newPageNum)
    setSelectedId(null)
  }

  const duplicatePage = (pageNum: number) => {
    const nextNum = Math.max(...pages.map(p => p.page_number)) + 1
    const sourcePage = pages.find(p => p.page_number === pageNum)
    if (!sourcePage) return
    // Clone the page with a new number
    setPages(prev => [...prev, {
      ...sourcePage,
      page_number: nextNum,
      title: `${sourcePage.title} (copy)`,
    }])
    // Clone all fields from source page onto new page
    setFields(prev => [
      ...prev,
      ...prev
        .filter(f => f.page_number === pageNum)
        .map(f => ({ ...f, _id: `f_${Date.now()}_${Math.random()}`, page_number: nextNum }))
    ])
    shouldScrollToActive.current = true
    setActivePage(nextNum)
    setSelectedId(null)
  }

  const executeDeletePage = (num: number) => {
    const remaining = [...pages].filter(p => p.page_number !== num).sort((a, b) => a.page_number - b.page_number)
    const numMap = new Map(remaining.map((p, i) => [p.page_number, i + 1]))
    setPages(remaining.map(p => ({ ...p, page_number: numMap.get(p.page_number)! })))
    setFields(prev =>
      prev.filter(f => f.page_number !== num)
          .map(f => ({ ...f, page_number: numMap.get(f.page_number) ?? f.page_number }))
    )
    setActivePage(activePage === num
      ? (remaining[remaining.length - 1] ? numMap.get(remaining[remaining.length - 1].page_number)! : 1)
      : (numMap.get(activePage) ?? 1)
    )
    setShowDeletePageModal(null)
  }

  const openEditPage = (page: Page) => {
    setPageDraft({ title: page.title, description: page.description, is_final: page.is_final, conditions: page.conditions })
    setEditingPageNum(page.page_number)
  }

  const savePageEdit = () => {
    if (!editingPageNum) return
    const title = pageDraft.title.trim() || `Page ${editingPageNum}`
    const conditions = pageDraft.is_final ? null : pageDraft.conditions
    setPages(prev => prev.map(p => p.page_number === editingPageNum
      ? { ...p, title, description: pageDraft.description, is_final: pageDraft.is_final, conditions }
      : p
    ))
    setFields(prev => prev.map(f => f.page_number === editingPageNum
      ? { ...f, page_title: title, page_description: pageDraft.description }
      : f
    ))
    setEditingPageNum(null)
  }

  // ── Page drag & drop ──────────────────────────────────────────


  // Gap zone — insertion line between pages
  // ── Field drag reorder ────────────────────────────────────────
  const handleFieldDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('fieldId')
    if (sourceId === targetId) return
    setFields(prev => {
      const pageFs = [...prev.filter(f => f.page_number === activePage)].sort((a, b) => a.sort_order - b.sort_order)
      const others  = prev.filter(f => f.page_number !== activePage)
      const si = pageFs.findIndex(f => f._id === sourceId)
      const ti = pageFs.findIndex(f => f._id === targetId)
      if (si === -1 || ti === -1) return prev
      const r = [...pageFs]; const [m] = r.splice(si, 1); r.splice(ti, 0, m)
      return [...others, ...r.map((f, i) => ({ ...f, sort_order: i }))]
    })
    setDragOverField(null)
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
          page_conditions: page?.conditions ? {
            ...page.conditions,
            rules: page.conditions.rules.map(r => ({
              ...r,
              // Strip "pageNum__" prefix before saving to DB
              field_key: r.field_key.includes('__') ? r.field_key.split('__').slice(1).join('__') : r.field_key,
            }))
          } : null,
          is_final: page?.is_final ?? false,
          condition: f.condition,
          section_key: null, section_label: null, section_conditions: null,
        }
      })
      await api.put(`/participants/form-fields/${event_id}`, { fields: payload })
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <style>{`
        /* Scrollbar — light mode */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        /* Scrollbar — dark mode */
        .dark ::-webkit-scrollbar-track { background: transparent; }
        .dark ::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #DC143C; }
      `}</style>

      {/* ── Top bar ── */}
      <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="px-12 h-[76px] flex items-center gap-4">
          <button onClick={() => navigate(`/admin/events/${event_id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mr-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
            Registration<span className="text-[#DC143C]">.</span>Form
          </h1>
          <span className="text-sm text-gray-400 dark:text-gray-500 font-normal truncate max-w-xs">{eventTitle}</span>
          <div className="flex-1" />
          {hasLocalDraft && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
              Unsaved draft
              <button onClick={() => { if (DRAFT_KEY) { localStorage.removeItem(DRAFT_KEY); setHasLocalDraft(false) } window.location.reload() }} className="underline">Discard</button>
            </div>
          )}
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all disabled:opacity-50">
            {saved ? <><IcoCheck /><span className="text-green-600">Saved!</span></> : saving ? 'Saving...' : 'Save draft'}
          </button>
          <button onClick={() => setShowPublishModal(true)} disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(220,20,60,0.22)]">
            Save & publish →
          </button>
        </div>
      </div>

      {/* ── 3-col layout ── */}
      {/* Fixed height, sidebars scroll internally, only center scrolls */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 76px)' }}>

        {/* LEFT sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616] flex flex-col overflow-y-auto" style={{ height: '100%' }}>
          <div className="p-3 flex flex-col gap-3">

            {/* Add field */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Add field</div>
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

            {/* Pages */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 px-1">Pages</div>
              <div className="flex flex-col">

                {regularPages.map(p => (
                  <div key={p.page_number} className="group relative flex items-center gap-1">
                    <button
                      onClick={() => { setActivePage(p.page_number); setSelectedId(null) }}
                      className={`flex-1 flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all min-w-0 ${
                        activePage === p.page_number
                          ? 'bg-[#DC143C] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${activePage === p.page_number ? 'border-white/50 text-white' : 'border-gray-300 dark:border-[#444] text-gray-400'}`}>{p.page_number}</span>
                      <span className="truncate flex-1 text-left">{p.title}</span>
                      {p.conditions && p.conditions.rules.length > 0 && (
                        <span className={`text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0 ${activePage === p.page_number ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>IF</span>
                      )}
                    </button>
                    {/* Up/Down arrows + actions */}
                    <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => movePageUp(p.page_number)} disabled={sortedPages.indexOf(p) === 0}
                        className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-[#DC143C] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button onClick={() => movePageDown(p.page_number)} disabled={sortedPages.indexOf(p) === sortedPages.length - 1}
                        className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-[#DC143C] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => openEditPage(p)} title="Edit page"
                        className={`w-5 h-5 rounded flex items-center justify-center ${activePage === p.page_number ? 'text-[#DC143C]' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333]'}`}><IcoEdit /></button>
                      <button onClick={() => duplicatePage(p.page_number)} title="Duplicate page"
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/20">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      </button>
                      {pages.length > 1 && (
                        <button onClick={() => setShowDeletePageModal(p.page_number)} title="Delete page"
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><IcoTrash /></button>
                      )}
                    </div>
                  </div>
                ))}


                {finalPages.length > 0 && (
                  <div className="mt-1">
                    <div className="text-[9px] font-semibold text-purple-400 dark:text-purple-500 uppercase tracking-widest px-2 mb-0.5">Always last</div>
                    {finalPages.map(p => (
                      <div key={p.page_number}

                        onClick={() => { setActivePage(p.page_number); setSelectedId(null) }}
                        className={`group relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing transition-all pr-12 ${
                          activePage === p.page_number ? 'bg-[#DC143C] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${activePage === p.page_number ? 'border-white/50 text-white' : 'border-gray-300 dark:border-[#444] text-gray-400'}`}>{p.page_number}</span>
                        <span className="truncate flex-1">{p.title}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0 ${activePage === p.page_number ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>LAST</span>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); openEditPage(p) }}
                            className={`w-5 h-5 rounded flex items-center justify-center ${activePage === p.page_number ? 'text-white/70 hover:bg-white/20' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-[#333]'}`}><IcoEdit /></button>
                          {pages.length > 1 && (
                            <button onClick={e => { e.stopPropagation(); setShowDeletePageModal(p.page_number) }}
                              className={`w-5 h-5 rounded flex items-center justify-center ${activePage === p.page_number ? 'text-white/70 hover:bg-white/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}><IcoTrash /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={addPage}
                  className="flex items-center justify-center gap-1.5 mt-2 px-2.5 py-2 rounded-lg border border-dashed border-gray-300 dark:border-[#3a3a3a] text-xs text-gray-400 dark:text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                  <IcoPlus /> Add page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER canvas — scrolls */}
        <div className="flex-1 overflow-y-auto bg-[#f0f1f3] dark:bg-[#0f0f0f]" id="canvas-scroll-container">
          <div className="max-w-2xl mx-auto pl-5 pr-14 py-8 flex flex-col gap-10">
            {sortedPages.map((page) => {
              const pFields = pageFields(page.page_number)
              const isActive = activePage === page.page_number

              const pageIdx = sortedPages.indexOf(page)
              return (
                <div key={page.page_number} className="relative flex gap-3">

                  {/* ── Right-side up/down controls — only on active page ── */}
                  {isActive && (
                    <div className="absolute -right-14 top-0 flex flex-col items-center gap-1">
                      <button
                        onClick={() => movePageUp(page.page_number)}
                        disabled={pageIdx === 0}
                        title="Move up"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-500 hover:text-[#DC143C] hover:border-[#DC143C] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <span className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap leading-none py-0.5">Move</span>
                      <button
                        onClick={() => movePageDown(page.page_number)}
                        disabled={pageIdx === sortedPages.length - 1}
                        title="Move down"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-500 hover:text-[#DC143C] hover:border-[#DC143C] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                  )}

                  {/* ── Page card + attached condition tag ── */}
                  <div className="flex-1 flex flex-col">

                  {/* Page card — always fully rounded */}
                  <div
                    id={`page-card-${page.page_number}`}
                    className={`bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] overflow-hidden rounded-2xl transition-all cursor-default ${
                      isActive ? 'shadow-md ring-1 ring-[#DC143C]/15' : 'shadow-sm'
                    }`}
                    onClick={() => { if (!isActive) { setActivePage(page.page_number); setSelectedId(null) } }}
                  >
                    {/* Condition strip — inside card at top, only when conditions exist */}
                    {page.conditions && page.conditions.rules.length > 0 && !page.is_final && (
                      <div className="flex items-center gap-2 flex-wrap px-4 py-2 bg-amber-50 dark:bg-amber-900/15 border-b border-amber-200 dark:border-amber-700/30">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 flex-shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                        <span className="text-[9px] font-bold text-amber-500 dark:text-amber-600 uppercase tracking-wide flex-shrink-0">Show if</span>
                        {page.conditions.rules.map((r, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <span className="text-[9px] font-bold text-amber-400 dark:text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                                {page.conditions!.logic}
                              </span>
                            )}
                            <span className="text-[10px] font-mono">
                              <span className="font-semibold text-amber-700 dark:text-amber-400">{r.field_key}</span>
                              <span className="text-amber-400 dark:text-amber-600 mx-1">{r.operator === 'eq' ? '=' : '≠'}</span>
                              <span className="text-amber-600 dark:text-amber-500">"{r.value}"</span>
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                    {/* Page header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#2a2a2a] ${isActive ? 'bg-gray-50 dark:bg-[#242424]' : 'bg-gray-50 dark:bg-[#242424] cursor-pointer'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? 'bg-[#DC143C] text-white' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300'}`}>
                          {page.page_number}
                        </span>
                        <span className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                          {page.title}
                        </span>
                        {page.is_final && <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded flex-shrink-0">LAST</span>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); openEditPage(page) }}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#DC143C] transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                          <IcoEdit /> Edit
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); duplicatePage(page.page_number) }}
                          title="Duplicate page"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#DC143C] transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          Duplicate
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); setShowDeletePageModal(page.page_number) }}
                            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                            <IcoTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fields */}
                    {pFields.length === 0 ? (
                      <div
                        className={`py-8 text-center text-sm text-gray-300 dark:text-gray-600 ${!isActive ? 'opacity-50' : ''}`}
                        onClick={() => { setActivePage(page.page_number); setSelectedId(null) }}
                      >
                        No fields — click to add
                      </div>
                    ) : (
                      pFields.map(field => (
                        <div key={field._id} draggable
                          onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('fieldId', field._id) }}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverField(field._id) }}
                          onDragLeave={() => setDragOverField(null)}
                          onDrop={e => { e.stopPropagation(); handleFieldDrop(e, field._id) }}
                          onClick={e => { e.stopPropagation(); setActivePage(page.page_number); setSelectedId(field._id) }}
                          className={`flex items-start gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] last:border-b-0 cursor-pointer transition-all ${
                            dragOverField === field._id ? 'bg-red-50 dark:bg-red-900/10' : ''
                          } ${selectedId === field._id
                            ? 'border-l-2 border-l-[#DC143C] bg-red-50/40 dark:bg-red-900/5'
                            : 'border-l-2 border-l-transparent hover:bg-gray-50/80 dark:hover:bg-[#1a1a1a]'
                          } ${!isActive ? 'opacity-60' : ''}`}
                        >
                          <div className="text-gray-300 dark:text-gray-600 pt-0.5 cursor-grab flex-shrink-0"><IcoGrip /></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {field.label || <span className="text-gray-300 italic">Untitled field</span>}
                              {field.is_required && <span className="text-[#DC143C] ml-1">*</span>}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: FIELD_TYPES.find(t => t.type === field.field_type)?.bg, color: FIELD_TYPES.find(t => t.type === field.field_type)?.color }}>
                                {FIELD_TYPES.find(t => t.type === field.field_type)?.label}
                              </span>
                              {field.is_required
                                ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600">Required</span>
                                : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-500">Optional</span>
                              }
                              {field.condition && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                  if {field.condition.field_key} {field.condition.operator === 'eq' ? '=' : '≠'} "{field.condition.value}"
                                </span>
                              )}
                              {field.options.length > 0 && (
                                <span className="text-[10px] text-gray-400">{field.options.join(', ')}</span>
                              )}
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); removeField(field._id) }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 mt-0.5">
                            <IcoTrash />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Add field button — only on active page */}
                    {isActive && (
                      <button onClick={e => { e.stopPropagation(); addFieldToPage('text') }}
                        className="flex items-center gap-1.5 w-full px-5 py-2.5 text-xs text-gray-400 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/10 border-t border-dashed border-gray-200 dark:border-[#2a2a2a] transition-all">
                        <IcoPlus /> Add field to this page
                      </button>
                    )}
                  </div>

                  {/* Add page after — below the card, only on active page, same style as bottom Add page */}
                  {isActive && (
                    <button
                      onClick={() => addPageAfter(page.page_number)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] text-xs text-gray-400 dark:text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] dark:hover:border-[#DC143C] dark:hover:text-[#DC143C] transition-all mt-3">
                      <IcoPlus /> Add page after this
                    </button>
                  )}
                  </div>
                </div>
              )
            })}

            {/* Add page button */}
            <button onClick={addPage}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-400 dark:text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] dark:hover:border-[#DC143C] dark:hover:text-[#DC143C] transition-all mt-1">
              <IcoPlus /> Add page
            </button>
          </div>
        </div>

        {/* RIGHT inspector */}
        <div className="w-60 flex-shrink-0 border-l border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex flex-col overflow-y-auto" style={{ height: '100%' }}>
          {!selectedField ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 py-10 text-gray-400">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mb-3 text-gray-300"><IcoForm /></div>
              <p className="text-sm font-medium text-gray-500 mb-1">No field selected</p>
              <p className="text-xs">Click any field to edit its settings.</p>
            </div>
          ) : (
            <React.Fragment key={selectedField._id}>
              <InspectorPanel field={selectedField} conditionSources={sourcesForField(selectedField)} allFields={fields} onUpdate={patch => updateField(selectedField._id, patch)} />
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Publish modal */}
      {showPublishModal && (
        <ModalShell onClose={() => setShowPublishModal(false)} icon={<IcoForm />} iconClass="text-[#DC143C]"
          title="Save & Publish" subtitle="This will open registration immediately"
          footer={<><CancelBtn onClick={() => setShowPublishModal(false)} /><button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl disabled:opacity-50">{saving ? 'Publishing...' : 'Yes, publish now'}</button></>}>
          <p>The event will be set to <strong className="text-gray-800 dark:text-gray-200">Open</strong> and registrants can sign up immediately.</p>
          <p className="mt-3 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 text-amber-700 dark:text-amber-400"><IcoAlert /> Editing fields after participants have registered may affect existing responses.</p>
        </ModalShell>
      )}

      {/* Delete page modal */}
      {showDeletePageModal !== null && (
        <ModalShell onClose={() => setShowDeletePageModal(null)} icon={<IcoTrash />} iconClass="text-red-500"
          title="Delete Page" subtitle={pages.find(p => p.page_number === showDeletePageModal)?.title}
          footer={<><CancelBtn onClick={() => setShowDeletePageModal(null)} /><button onClick={() => executeDeletePage(showDeletePageModal!)} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl">Delete page</button></>}>
          <p>All {pageFields(showDeletePageModal).length} field{pageFields(showDeletePageModal).length !== 1 ? 's' : ''} on this page will also be removed.</p>
        </ModalShell>
      )}

      {/* Edit page modal */}
      {editingPageNum !== null && (() => {
        const sources = sourcesForPage(editingPageNum)
        return (
          <ModalShell onClose={() => setEditingPageNum(null)} icon={<IcoEdit />}
            title={`Edit Page ${editingPageNum}`} subtitle="Title, description, and visibility"
            wide scrollable
            footer={<><CancelBtn onClick={() => setEditingPageNum(null)} /><button onClick={savePageEdit} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl">Save</button></>}>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Title</label>
                <input className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm outline-none focus:border-[#DC143C] text-gray-900 dark:text-white"
                  value={pageDraft.title} onChange={e => setPageDraft(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Basic info" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Description <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <textarea className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm outline-none focus:border-[#DC143C] resize-none text-gray-900 dark:text-white"
                  rows={2} value={pageDraft.description} onChange={e => setPageDraft(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

              {/* Always last */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Always show last</div>
                  <p className="text-xs text-gray-400 leading-relaxed">Pin this page at the end, after all conditional pages. Good for submission confirmations.</p>
                </div>
                <button type="button"
                  onClick={() => setPageDraft(p => ({ ...p, is_final: !p.is_final, conditions: !p.is_final ? null : p.conditions }))}
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${pageDraft.is_final ? 'bg-purple-500' : 'bg-gray-200 dark:bg-[#3a3a3a]'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${pageDraft.is_final ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

              {/* Condition */}
              <div className={pageDraft.is_final ? 'opacity-40 pointer-events-none select-none' : ''}>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Show this page if...</div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  {editingPageNum === 1
                    ? 'Page 1 always shows first and cannot have conditions.'
                    : pageDraft.is_final
                    ? 'Disabled — always-last pages are always visible.'
                    : 'This page only appears when the condition is met. Leave empty to always show.'}
                </p>
                {editingPageNum !== 1 && !pageDraft.is_final && (
                  <ConditionBuilder
                    conditions={pageDraft.conditions}
                    sources={sources}
                    onChange={c => setPageDraft(p => ({ ...p, conditions: c }))}
                  />
                )}
              </div>
            </div>
          </ModalShell>
        )
      })()}
    </div>
  )
}

function InspectorPanel({ field, conditionSources, allFields, onUpdate }: {
  field: FormField; conditionSources: FormField[]; allFields: FormField[]
  onUpdate: (patch: Partial<FormField>) => void
}) {
  const [optionDraft, setOptionDraft] = useState('')
  const [editingOptIdx, setEditingOptIdx] = useState<number | null>(null)
  const [editingOptVal, setEditingOptVal] = useState('')
  const [dragOptIdx, setDragOptIdx] = useState<number | null>(null)
  const [dragOverOptIdx, setDragOverOptIdx] = useState<number | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditingOptIdx(null)
    setEditingOptVal('')
    setOptionDraft('')
  }, [field._id])

  useEffect(() => {
    if (editingOptIdx !== null) editInputRef.current?.focus()
  }, [editingOptIdx])

  const inp = "w-full px-3 py-2 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#DC143C] transition-all"
  const lbl = "block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5"
  const condSrc = conditionSources.find(f => f.field_key === field.condition?.field_key)

  const addOption = () => {
    const v = optionDraft.trim()
    if (!v || field.options.includes(v)) return
    onUpdate({ options: [...field.options, v] })
    setOptionDraft('')
  }

  const commitEdit = () => {
    if (editingOptIdx === null) return
    const v = editingOptVal.trim()
    if (v && !field.options.filter((_, i) => i !== editingOptIdx).includes(v)) {
      const updated = [...field.options]
      updated[editingOptIdx] = v
      onUpdate({ options: updated })
    }
    setEditingOptIdx(null)
    setEditingOptVal('')
  }

  const handleOptDrop = (targetIdx: number) => {
    if (dragOptIdx === null || dragOptIdx === targetIdx) { setDragOptIdx(null); setDragOverOptIdx(null); return }
    const opts = [...field.options]
    const [moved] = opts.splice(dragOptIdx, 1)
    opts.splice(targetIdx, 0, moved)
    onUpdate({ options: opts })
    setDragOptIdx(null)
    setDragOverOptIdx(null)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Field settings</div>

      <div>
        <label className={lbl}>Label</label>
        <input className={inp} value={field.label} onChange={e => onUpdate({ label: e.target.value })} placeholder="e.g. Agent type" />
      </div>

      <div>
        <label className={lbl}>Field key</label>
        {(() => {
          const existingKeys = [...new Set(allFields.filter(f => f._id !== field._id && f.field_key.trim()).map(f => f.field_key))].sort()
          return (
            <div className="flex flex-col gap-1.5">
              <input className={`${inp} font-mono text-xs`} value={field.field_key}
                onChange={e => onUpdate({ field_key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                placeholder="auto from label" />
              {existingKeys.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {existingKeys.map(k => (
                    <button key={k} type="button" onClick={() => onUpdate({ field_key: k })}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${field.field_key === k ? 'border-[#DC143C] bg-red-50 dark:bg-red-900/20 text-[#DC143C]' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C]'}`}>
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <div>
        <label className={lbl}>Field type</label>
        <select className={inp} value={field.field_type} onChange={e => {
          const newType = e.target.value as FieldType
          const keepOptions = (field.field_type === 'dropdown' || field.field_type === 'radio') &&
                              (newType === 'dropdown' || newType === 'radio')
          onUpdate({ field_type: newType, ...(!keepOptions ? { options: [] } : {}) })
        }}>
          {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
        </select>
      </div>

      {(field.field_type === 'dropdown' || field.field_type === 'radio') && (
        <div>
          <label className={lbl}>Choices</label>
          {/* Draggable, inline-editable choice list */}
          <div className="flex flex-col gap-0.5 mb-2">
            {field.options.map((opt, i) => (
              <div key={i}
                draggable
                onDragStart={e => { e.stopPropagation(); setDragOptIdx(i) }}
                onDragEnd={() => { setDragOptIdx(null); setDragOverOptIdx(null) }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverOptIdx(i) }}
                onDragLeave={() => setDragOverOptIdx(null)}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); handleOptDrop(i) }}
                className={`flex items-center gap-1.5 group rounded-lg transition-all ${
                  dragOverOptIdx === i && dragOptIdx !== i ? 'bg-red-50 dark:bg-red-900/10 -translate-y-0.5' : ''
                } ${dragOptIdx === i ? 'opacity-40' : ''}`}
              >
                <span className="text-gray-200 dark:text-gray-700 cursor-grab flex-shrink-0 pl-0.5">
                  <IcoGrip />
                </span>
                {editingOptIdx === i ? (
                  <input
                    ref={editInputRef}
                    className="flex-1 px-2 py-1 text-xs bg-white dark:bg-[#0f0f0f] border border-[#DC143C] rounded-lg outline-none text-gray-900 dark:text-white"
                    value={editingOptVal}
                    onChange={e => setEditingOptVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                      if (e.key === 'Escape') { setEditingOptIdx(null); setEditingOptVal('') }
                    }}
                  />
                ) : (
                  <span
                    className="flex-1 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-text truncate"
                    onClick={() => { setEditingOptIdx(i); setEditingOptVal(opt) }}
                    title="Click to edit"
                  >
                    {opt}
                  </span>
                )}
                <button
                  onClick={() => onUpdate({ options: field.options.filter((_, j) => j !== i) })}
                  className="w-5 h-5 flex items-center justify-center rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Remove choice"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
          {/* Add new choice */}
          <div className="flex gap-1.5">
            <input className={`${inp} flex-1 text-xs py-1.5`} value={optionDraft}
              onChange={e => setOptionDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
              placeholder="Add a choice…" />
            <button onClick={addOption} className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-xs font-semibold text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] transition-all">Add</button>
          </div>
        </div>
      )}

      <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
        <button onClick={() => onUpdate({ is_required: !field.is_required })}
          className={`relative w-9 h-5 rounded-full transition-colors ${field.is_required ? 'bg-[#DC143C]' : 'bg-gray-200 dark:bg-[#3a3a3a]'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${field.is_required ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />

      <div>
        <label className={lbl}>Show this field if...</label>
        {field.condition ? (
          <div className="flex flex-col gap-2 bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3">
            <select className={inp} value={field.condition.field_key}
              onChange={e => onUpdate({ condition: { ...field.condition!, field_key: e.target.value, value: '' } })}>
              <option value="">— field —</option>
              {conditionSources.map(f => <option key={f._id} value={f.field_key}>Page {f.page_number} · {f.label || f.field_key}</option>)}
            </select>
            <select className={inp} value={field.condition.operator}
              onChange={e => onUpdate({ condition: { ...field.condition!, operator: e.target.value as 'eq' | 'neq' } })}>
              <option value="eq">is</option>
              <option value="neq">is not</option>
            </select>
            {condSrc?.options?.length ? (
              <select className={inp} value={field.condition.value}
                onChange={e => onUpdate({ condition: { ...field.condition!, value: e.target.value } })}>
                <option value="">— value —</option>
                {condSrc.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className={inp} value={field.condition.value} placeholder="value"
                onChange={e => onUpdate({ condition: { ...field.condition!, value: e.target.value } })} />
            )}
            <button onClick={() => onUpdate({ condition: null })} className="self-start text-xs text-red-500 hover:underline">Remove condition</button>
          </div>
        ) : conditionSources.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Add a radio or dropdown field earlier first.</p>
        ) : (
          <button onClick={() => onUpdate({ condition: { field_key: conditionSources[0].field_key, operator: 'eq', value: conditionSources[0].options?.[0] ?? '' } })}
            className="text-xs text-[#DC143C] hover:underline">+ Add condition</button>
        )}
      </div>
    </div>
  )
}