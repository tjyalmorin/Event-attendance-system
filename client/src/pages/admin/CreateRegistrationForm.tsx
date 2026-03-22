import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import { FormField, FormFieldType, PageConditions, ConditionRule } from '../../types'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Page {
  page_number: number
  page_label: string
  conditions: PageConditions | null
  is_final: boolean
  fields: FormField[]
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'radio',    label: 'Multiple Choice' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
]

const OPERATORS = [
  { value: 'eq',  label: 'is equal to' },
  { value: 'neq', label: 'is not equal to' },
]

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
const GripIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
    <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
  </svg>
)
const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
)
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Returns all radio/dropdown fields from pages BEFORE the given page_number. */
const sourcesForPage = (pages: Page[], pageNum: number): FormField[] =>
  pages
    .filter(p => p.page_number < pageNum)
    .flatMap(p => p.fields.filter(f => f.type === 'radio' || f.type === 'dropdown'))

/**
 * Build a unique option value: "pageNum__fieldKey"
 * Disambiguates same-key fields on different pages.
 */
const toOptVal = (f: FormField) => `${f.page_number}__${f.field_key}`

/**
 * Find source field by rule.field_key.
 * Exact match on "pageNum__fieldKey" first, fallback to plain field_key.
 */
const findSrc = (sources: FormField[], ruleKey: string): FormField | undefined =>
  sources.find(f => toOptVal(f) === ruleKey) ??
  sources.find(f => f.field_key === ruleKey)

/** Strip "pageNum__" prefix before saving to DB. */
const stripPrefix = (key: string) =>
  key.includes('__') ? key.split('__').slice(1).join('__') : key

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50) || 'field'

const newField = (pageNum: number, sortOrder: number): FormField => ({
  field_key:       '',
  label:           '',
  type:            'text',
  options:         [],
  page_number:     pageNum,
  page_label:      null,
  page_conditions: null,
  condition:       null,
  is_required:     false,
  is_final:        false,
  sort_order:      sortOrder,
})

// ─────────────────────────────────────────────────────────────
// RuleRow — single condition rule
// ─────────────────────────────────────────────────────────────
const RuleRow: React.FC<{
  rule: ConditionRule
  sources: FormField[]
  onChange: (r: ConditionRule) => void
  onRemove: () => void
}> = ({ rule, sources, onChange, onRemove }) => {
  const src = findSrc(sources, rule.field_key)
  const valueOptions = src?.options ?? []

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={rule.field_key}
        onChange={e => onChange({ ...rule, field_key: e.target.value, value: '' })}
        className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#DC143C]"
      >
        {sources.length === 0 && <option value="">— no fields available —</option>}
        {sources.map(f => (
          <option key={toOptVal(f)} value={toOptVal(f)}>
            P{f.page_number} · {f.label || f.field_key}
          </option>
        ))}
      </select>

      <select
        value={rule.operator}
        onChange={e => onChange({ ...rule, operator: e.target.value as 'eq' | 'neq' })}
        className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#DC143C]"
      >
        {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>

      {valueOptions.length > 0 ? (
        <select
          value={rule.value}
          onChange={e => onChange({ ...rule, value: e.target.value })}
          className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#DC143C]"
        >
          <option value="">— select —</option>
          {valueOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          value={rule.value}
          onChange={e => onChange({ ...rule, value: e.target.value })}
          placeholder="value"
          className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 w-28 focus:outline-none focus:border-[#DC143C]"
        />
      )}

      <button onClick={onRemove} className="p-1 text-red-400 hover:text-red-600 transition-colors">
        <TrashIcon />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PageConditionBuilder
// ─────────────────────────────────────────────────────────────
const PageConditionBuilder: React.FC<{
  conditions: PageConditions | null
  sources: FormField[]
  onChange: (c: PageConditions | null) => void
}> = ({ conditions, sources, onChange }) => {
  const makeDefaultRule = (): ConditionRule => {
    const first = sources[0]
    return { field_key: first ? toOptVal(first) : '', operator: 'eq', value: first?.options?.[0] ?? '' }
  }

  if (!conditions) {
    return (
      <button
        onClick={() => sources.length > 0 && onChange({ logic: 'AND', rules: [makeDefaultRule()] })}
        disabled={sources.length === 0}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-[#3a3a3a] px-3 py-1.5 rounded-lg hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PlusIcon /> Add page condition
      </button>
    )
  }

  return (
    <div className="space-y-2 p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 flex-wrap">
          Show this page when
          <select
            value={conditions.logic}
            onChange={e => onChange({ ...conditions, logic: e.target.value as 'AND' | 'OR' })}
            className="h-7 px-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#DC143C]"
          >
            <option value="AND">ALL of the following</option>
            <option value="OR">ANY of the following</option>
          </select>
          are true:
        </div>
        <button onClick={() => onChange(null)} className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors flex-shrink-0">
          Remove
        </button>
      </div>
      <div className="space-y-2">
        {conditions.rules.map((rule, ri) => (
          <RuleRow
            key={ri}
            rule={rule}
            sources={sources}
            onChange={r => {
              const rules = [...conditions.rules]; rules[ri] = r
              onChange({ ...conditions, rules })
            }}
            onRemove={() => {
              const rules = conditions.rules.filter((_, i) => i !== ri)
              if (rules.length === 0) { onChange(null); return }
              onChange({ ...conditions, rules })
            }}
          />
        ))}
      </div>
      <button
        onClick={() => onChange({ ...conditions, rules: [...conditions.rules, makeDefaultRule()] })}
        disabled={sources.length === 0}
        className="flex items-center gap-1 text-xs text-[#DC143C] hover:text-[#b01030] font-semibold transition-colors disabled:opacity-40"
      >
        <PlusIcon /> Add rule
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FieldConditionBuilder
// ─────────────────────────────────────────────────────────────
const FieldConditionBuilder: React.FC<{
  condition: ConditionRule | null
  sources: FormField[]
  onChange: (c: ConditionRule | null) => void
}> = ({ condition, sources, onChange }) => {
  const makeDefault = (): ConditionRule => {
    const first = sources[0]
    return { field_key: first ? toOptVal(first) : '', operator: 'eq', value: first?.options?.[0] ?? '' }
  }

  if (!condition) {
    return (
      <button
        onClick={() => sources.length > 0 && onChange(makeDefault())}
        disabled={sources.length === 0}
        className="text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-[#3a3a3a] px-2.5 py-1 rounded-lg hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + condition
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap p-2 bg-gray-50 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Show if</span>
      <RuleRow rule={condition} sources={sources} onChange={onChange} onRemove={() => onChange(null)} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const CreateRegistrationForm: React.FC = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [eventTitle, setEventTitle] = useState('')
  const [pages, setPages] = useState<Page[]>([
    { page_number: 1, page_label: 'Page 1', conditions: null, is_final: false, fields: [] }
  ])
  const [activePage, setActivePage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const shouldScrollToActive = useRef(false)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // ── Load existing fields ──
  useEffect(() => {
    if (!eventId) return
    Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/participants/form-fields/${eventId}`),
    ])
      .then(([evRes, ffRes]) => {
        setEventTitle(evRes.data.title || '')
        const fields: FormField[] = ffRes.data
        if (fields.length === 0) { setLoading(false); return }

        const pageNums = [...new Set(fields.map(f => f.page_number))].sort((a, b) => a - b)
        const rebuilt: Page[] = pageNums.map(pn => {
          const pFields = fields.filter(f => f.page_number === pn)
          const first = pFields[0]
          return {
            page_number: pn,
            page_label:  first.page_label || `Page ${pn}`,
            conditions:  first.page_conditions ?? null,
            is_final:    pFields.some(f => f.is_final),
            fields:      pFields.map(f => ({ ...f, page_conditions: undefined })),
          }
        })
        setPages(rebuilt)
      })
      .catch(() => setError('Failed to load form data'))
      .finally(() => setLoading(false))
  }, [eventId])

  // ── Scroll to active page ──
  useEffect(() => {
    if (!shouldScrollToActive.current) return
    shouldScrollToActive.current = false
    const el = pageRefs.current[activePage]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activePage, pages.length])

  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number)

  // ── Page operations ──
  const addPage = () => {
    const maxNum = Math.max(...pages.map(p => p.page_number), 0)
    const newNum = maxNum + 1
    setPages(prev => [...prev, { page_number: newNum, page_label: `Page ${newNum}`, conditions: null, is_final: false, fields: [] }])
    shouldScrollToActive.current = true
    setActivePage(newNum)
  }

  const deletePage = (pageNum: number) => {
    if (pages.length === 1) return
    setPages(prev => {
      const remaining = prev.filter(p => p.page_number !== pageNum)
        .sort((a, b) => a.page_number - b.page_number)
        .map((p, i) => ({
          ...p,
          page_number: i + 1,
          fields: p.fields.map(f => ({ ...f, page_number: i + 1 })),
        }))
      return remaining
    })
    setActivePage(prev => (prev > 1 ? prev - 1 : 1))
  }

  const movePage = (pageNum: number, dir: 'up' | 'down') => {
    const idx = sortedPages.findIndex(p => p.page_number === pageNum)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedPages.length) return
    const aNum = sortedPages[idx].page_number
    const bNum = sortedPages[swapIdx].page_number
    setPages(prev => prev.map(p => {
      if (p.page_number === aNum) return { ...p, page_number: bNum, fields: p.fields.map(f => ({ ...f, page_number: bNum })) }
      if (p.page_number === bNum) return { ...p, page_number: aNum, fields: p.fields.map(f => ({ ...f, page_number: aNum })) }
      return p
    }))
    shouldScrollToActive.current = true
    setActivePage(dir === 'up' ? pageNum - 1 : pageNum + 1)
  }

  const updatePageLabel = (pageNum: number, label: string) =>
    setPages(prev => prev.map(p => p.page_number === pageNum ? { ...p, page_label: label } : p))

  const updatePageConditions = (pageNum: number, conditions: PageConditions | null) =>
    setPages(prev => prev.map(p => p.page_number === pageNum ? { ...p, conditions } : p))

  const togglePageFinal = (pageNum: number) =>
    setPages(prev => prev.map(p => ({ ...p, is_final: p.page_number === pageNum ? !p.is_final : false })))

  // ── Field operations ──
  const addField = (pageNum: number) =>
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const maxOrder = Math.max(...p.fields.map(f => f.sort_order), -1)
      return { ...p, fields: [...p.fields, newField(pageNum, maxOrder + 1)] }
    }))

  const updateField = (pageNum: number, idx: number, updated: Partial<FormField> & { _keyManuallySet?: boolean }) => {
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const fields = [...p.fields]
      const current = { ...fields[idx], ...updated }
      // Auto-generate field_key from label unless manually set
      if (updated.label !== undefined && !(fields[idx] as any)._keyManuallySet && !updated._keyManuallySet) {
        current.field_key = slugify(updated.label)
      }
      if (updated._keyManuallySet) (current as any)._keyManuallySet = true
      fields[idx] = current
      return { ...p, fields }
    }))
  }

  const deleteField = (pageNum: number, idx: number) =>
    setPages(prev => prev.map(p =>
      p.page_number !== pageNum ? p : { ...p, fields: p.fields.filter((_, i) => i !== idx) }
    ))

  const moveField = (pageNum: number, idx: number, dir: 'up' | 'down') =>
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const fields = [...p.fields]
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= fields.length) return p;
      [fields[idx], fields[swapIdx]] = [fields[swapIdx], fields[idx]]
      return { ...p, fields: fields.map((f, i) => ({ ...f, sort_order: i })) }
    }))

  const duplicateField = (pageNum: number, idx: number) =>
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const fields = [...p.fields]
      const dup: FormField = { ...fields[idx], field_id: undefined, field_key: fields[idx].field_key + '_copy', sort_order: fields[idx].sort_order + 0.5 }
      fields.splice(idx + 1, 0, dup)
      return { ...p, fields: fields.map((f, i) => ({ ...f, sort_order: i })) }
    }))

  const addOption = (pageNum: number, fi: number) =>
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const fields = [...p.fields]
      fields[fi] = { ...fields[fi], options: [...fields[fi].options, ''] }
      return { ...p, fields }
    }))

  const updateOption = (pageNum: number, fi: number, oi: number, val: string) =>
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const fields = [...p.fields]
      const options = [...fields[fi].options]; options[oi] = val
      fields[fi] = { ...fields[fi], options }
      return { ...p, fields }
    }))

  const removeOption = (pageNum: number, fi: number, oi: number) =>
    setPages(prev => prev.map(p => {
      if (p.page_number !== pageNum) return p
      const fields = [...p.fields]
      fields[fi] = { ...fields[fi], options: fields[fi].options.filter((_, i) => i !== oi) }
      return { ...p, fields }
    }))

  // ── Save ──
  const handleSave = async () => {
    setError(''); setSaving(true)
    const fields: FormField[] = sortedPages.flatMap(page =>
      page.fields.map((f, i) => ({
        ...f,
        page_number:     page.page_number,
        page_label:      page.page_label,
        is_final:        page.is_final,
        sort_order:      i,
        page_conditions: page.conditions ? {
          ...page.conditions,
          rules: page.conditions.rules.map(r => ({ ...r, field_key: stripPrefix(r.field_key) }))
        } : null,
        condition: f.condition ? { ...f.condition, field_key: stripPrefix(f.condition.field_key) } : null,
      }))
    )
    try {
      await api.post(`/participants/form-fields/${eventId}`, { fields })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DC143C]" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f0f1f3] dark:bg-[#0f0f0f]">

      {/* Header */}
      <header className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
        <div className="px-8 h-[76px] flex items-center gap-4">
          <button onClick={() => navigate(`/admin/events/${eventId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
            <ArrowLeftIcon /><span className="font-medium">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[26px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              Form Builder<span className="text-[#DC143C]">.</span>
            </h1>
            {eventTitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{eventTitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => window.open(`/register/${eventId}`, '_blank')}
              className="flex items-center gap-2 border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
              <EyeIcon /> Preview
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[#DC143C] hover:bg-[#b01030] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(220,20,60,0.22)]">
              {saving
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving…</>
                : saved ? '✓ Saved!' : 'Save Form'
              }
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left sidebar: page list */}
        <aside className="w-56 bg-white dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 dark:border-[#2a2a2a]">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pages</p>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {sortedPages.map((page, pi) => (
              <button key={page.page_number} onClick={() => setActivePage(page.page_number)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all ${
                  activePage === page.page_number
                    ? 'bg-[#DC143C] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                }`}>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activePage === page.page_number ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#333] text-gray-600 dark:text-gray-400'
                }`}>{pi + 1}</span>
                <span className="truncate flex-1">{page.page_label || `Page ${page.page_number}`}</span>
                {page.is_final && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-white/20 flex-shrink-0">END</span>}
                {page.conditions && (
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activePage === page.page_number ? 'bg-white/60' : 'bg-amber-400'}`} title="Has conditions" />
                )}
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-100 dark:border-[#2a2a2a]">
            <button onClick={addPage}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-300 dark:border-[#3a3a3a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] text-sm font-semibold transition-all">
              <PlusIcon /> Add Page
            </button>
          </div>
        </aside>

        {/* Main editor */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {sortedPages.map((page, pi) => {
            const sources = sourcesForPage(sortedPages, page.page_number)
            const isActive = activePage === page.page_number

            return (
              <div key={page.page_number}
                ref={el => { pageRefs.current[page.page_number] = el }}
                className={`mb-6 bg-white dark:bg-[#1c1c1c] rounded-2xl border transition-all ${
                  isActive
                    ? 'border-[#DC143C] shadow-[0_0_0_3px_rgba(220,20,60,0.08)]'
                    : 'border-gray-200 dark:border-[#2a2a2a] opacity-60 hover:opacity-80 cursor-pointer'
                }`}
                onClick={() => !isActive && setActivePage(page.page_number)}
              >
                {/* Page header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#DC143C] text-white text-[11px] font-bold flex items-center justify-center">{pi + 1}</span>
                  <input
                    value={page.page_label}
                    onChange={e => updatePageLabel(page.page_number, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder={`Page ${page.page_number}`}
                    className="flex-1 text-sm font-semibold bg-transparent text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); movePage(page.page_number, 'up') }} disabled={pi === 0}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20 transition-colors" title="Move up"><ChevronUpIcon /></button>
                    <button onClick={e => { e.stopPropagation(); movePage(page.page_number, 'down') }} disabled={pi === sortedPages.length - 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20 transition-colors" title="Move down"><ChevronDownIcon /></button>
                    <button
                      onClick={e => { e.stopPropagation(); togglePageFinal(page.page_number) }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        page.is_final
                          ? 'bg-[#DC143C]/10 border-[#DC143C]/30 text-[#DC143C]'
                          : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                      }`}
                      title="Mark as final page — shows Submit button"
                    >
                      {page.is_final ? '✓ Final' : 'Final?'}
                    </button>
                    {sortedPages.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); deletePage(page.page_number) }}
                        className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors" title="Delete page"><TrashIcon /></button>
                    )}
                  </div>
                </div>

                {/* Page conditions (only when active) */}
                {isActive && (
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#161616]/50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Page Visibility Condition</p>
                    <PageConditionBuilder conditions={page.conditions} sources={sources} onChange={c => updatePageConditions(page.page_number, c)} />
                    {sources.length === 0 && page.page_number > 1 && (
                      <p className="text-[11px] text-gray-400 mt-1.5">Add radio or dropdown fields to earlier pages to enable conditions.</p>
                    )}
                  </div>
                )}

                {/* Fields */}
                <div className="p-5 space-y-4">
                  {page.fields.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <p className="text-sm">No fields yet</p>
                      <p className="text-xs mt-1">Click "Add Field" below to start</p>
                    </div>
                  )}

                  {page.fields.map((field, fi) => {
                    const fieldSources = sourcesForPage(sortedPages, page.page_number)
                    return (
                      <div key={fi} className="bg-gray-50 dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4 space-y-3">
                        {/* Field header */}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0"><GripIcon /></span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Field {fi + 1}</span>
                          <div className="flex-1" />
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveField(page.page_number, fi, 'up')} disabled={fi === 0} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"><ChevronUpIcon /></button>
                            <button onClick={() => moveField(page.page_number, fi, 'down')} disabled={fi === page.fields.length - 1} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"><ChevronDownIcon /></button>
                            <button onClick={() => duplicateField(page.page_number, fi)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Duplicate"><CopyIcon /></button>
                            <button onClick={() => deleteField(page.page_number, fi)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"><TrashIcon /></button>
                          </div>
                        </div>

                        {/* Label + Type */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Label <span className="text-[#DC143C]">*</span></label>
                            <input
                              value={field.label}
                              onChange={e => updateField(page.page_number, fi, { label: e.target.value })}
                              placeholder="Question or field label"
                              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-800 dark:text-white focus:outline-none focus:border-[#DC143C] transition-colors"
                            />
                          </div>
                          <div className="w-36 flex-shrink-0">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type</label>
                            <select
                              value={field.type}
                              onChange={e => updateField(page.page_number, fi, {
                                type: e.target.value as FormFieldType,
                                options: ['radio','dropdown','checkbox'].includes(e.target.value) ? field.options : [],
                              })}
                              className="w-full h-9 px-2 text-sm rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#DC143C] transition-colors"
                            >
                              {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Field key */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Field Key <span className="text-gray-400 font-normal">(unique ID)</span>
                          </label>
                          <input
                            value={field.field_key}
                            onChange={e => updateField(page.page_number, fi, { field_key: e.target.value, _keyManuallySet: true } as any)}
                            placeholder="auto_generated_from_label"
                            className="w-full h-9 px-3 text-sm font-mono rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
                          />
                        </div>

                        {/* Options */}
                        {['radio', 'dropdown', 'checkbox'].includes(field.type) && (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Options</label>
                            <div className="space-y-1.5">
                              {field.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 w-4 flex-shrink-0">{oi + 1}.</span>
                                  <input
                                    value={opt}
                                    onChange={e => updateOption(page.page_number, fi, oi, e.target.value)}
                                    placeholder={`Option ${oi + 1}`}
                                    className="flex-1 h-8 px-3 text-sm rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-800 dark:text-white focus:outline-none focus:border-[#DC143C] transition-colors"
                                  />
                                  <button onClick={() => removeOption(page.page_number, fi, oi)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"><TrashIcon /></button>
                                </div>
                              ))}
                              <button onClick={() => addOption(page.page_number, fi)}
                                className="text-xs font-semibold text-[#DC143C] hover:text-[#b01030] transition-colors flex items-center gap-1 mt-1">
                                <PlusIcon /> Add option
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Required toggle */}
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                          <div
                            onClick={() => updateField(page.page_number, fi, { is_required: !field.is_required })}
                            className={`relative w-9 h-5 rounded-full transition-colors ${field.is_required ? 'bg-[#DC143C]' : 'bg-gray-300 dark:bg-[#444]'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${field.is_required ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Required</span>
                        </label>

                        {/* Field condition */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Field Visibility Condition</label>
                          <FieldConditionBuilder
                            condition={field.condition ?? null}
                            sources={fieldSources}
                            onChange={c => updateField(page.page_number, fi, { condition: c })}
                          />
                        </div>
                      </div>
                    )
                  })}

                  <button onClick={() => addField(page.page_number)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] text-sm font-semibold transition-all">
                    <PlusIcon /> Add Field
                  </button>
                </div>
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}

export default CreateRegistrationForm