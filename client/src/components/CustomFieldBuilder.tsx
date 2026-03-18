import React, { useState } from 'react'
import { CustomField, FieldType, AgentType } from '../types'

// ── Icons ──────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const GripIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
    <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
  </svg>
)
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text:     'Short Text',
  textarea: 'Long Text',
  number:   'Number',
  dropdown: 'Dropdown',
  radio:    'Multiple Choice',
  checkbox: 'Checkbox (Yes/No)',
}

const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  text:     'T',
  textarea: '¶',
  number:   '#',
  dropdown: '▾',
  radio:    '◉',
  checkbox: '☑',
}

// ── Draft field (before saving to server) ─────────────────────────────────────
export interface DraftField {
  tempId: string          // client-side only — used for keying before field_id exists
  field_id?: number       // set once saved to server
  label: string
  field_type: FieldType
  options: string[]
  is_required: boolean
  applicable_agent_types: string[]
  is_locked: boolean
}

interface Props {
  fields: DraftField[]
  agentTypes: AgentType[]
  onChange: (fields: DraftField[]) => void
  maxFields?: number
}

// ── Single field editor ────────────────────────────────────────────────────────
const FieldEditor: React.FC<{
  field: DraftField
  index: number
  total: number
  agentTypes: AgentType[]
  onUpdate: (updated: DraftField) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}> = ({ field, index, total, agentTypes, onUpdate, onDelete, onMoveUp, onMoveDown }) => {
  const [expanded, setExpanded] = useState(true)
  const [newOption, setNewOption] = useState('')

  const update = (patch: Partial<DraftField>) => onUpdate({ ...field, ...patch })

  const addOption = () => {
    if (!newOption.trim()) return
    if (field.options.includes(newOption.trim())) return
    update({ options: [...field.options, newOption.trim()] })
    setNewOption('')
  }

  const removeOption = (opt: string) =>
    update({ options: field.options.filter(o => o !== opt) })

  const toggleAgentType = (name: string) => {
    const current = field.applicable_agent_types
    if (current.includes(name)) {
      update({ applicable_agent_types: current.filter(t => t !== name) })
    } else {
      update({ applicable_agent_types: [...current, name] })
    }
  }

  const needsOptions = field.field_type === 'dropdown' || field.field_type === 'radio'

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      field.is_locked
        ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10'
        : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c]'
    }`}>
      {/* Field header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag handle + reorder */}
        <div className="flex flex-col gap-0.5 text-gray-300 dark:text-gray-600 flex-shrink-0">
          <button type="button" onClick={onMoveUp} disabled={index === 0 || field.is_locked}
            className="hover:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronUpIcon />
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1 || field.is_locked}
            className="hover:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronDownIcon />
          </button>
        </div>

        {/* Field type badge */}
        <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
          {FIELD_TYPE_ICONS[field.field_type]}
        </span>

        {/* Label preview */}
        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {field.label || <span className="text-gray-400 dark:text-gray-600 italic">Untitled question</span>}
        </span>

        {/* Lock badge */}
        {field.is_locked && (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
            <LockIcon /> Locked
          </span>
        )}

        {/* Required badge */}
        {field.is_required && !field.is_locked && (
          <span className="text-xs font-semibold text-[#DC143C] flex-shrink-0">Required</span>
        )}

        {/* Expand toggle */}
        <button type="button" onClick={() => setExpanded(p => !p)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0">
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>

        {/* Delete */}
        {!field.is_locked && (
          <button type="button" onClick={onDelete}
            className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Field body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-[#2a2a2a] pt-4">

          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Question Label <span className="text-[#DC143C]">*</span>
            </label>
            <input
              type="text"
              value={field.label}
              disabled={field.is_locked}
              onChange={e => update({ label: e.target.value })}
              placeholder="e.g. What is your monthly target?"
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {field.is_locked && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Label is locked — participants have already answered this question.
              </p>
            )}
          </div>

          {/* Field type + Required row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Field Type
              </label>
              <select
                value={field.field_type}
                disabled={field.is_locked}
                onChange={e => update({ field_type: e.target.value as FieldType, options: [] })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#DC143C] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => !field.is_locked && update({ is_required: !field.is_required })}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    field.is_locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${field.is_required ? 'bg-[#DC143C]' : 'bg-gray-300 dark:bg-[#444]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    field.is_required ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Required</span>
              </label>
            </div>
          </div>

          {/* Options (dropdown / radio only) */}
          {needsOptions && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Options <span className="text-[#DC143C]">*</span>
                <span className="ml-1 font-normal normal-case text-gray-400">(min 2 required)</span>
              </label>

              {field.options.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {field.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg">
                      <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{opt}</span>
                      {!field.is_locked && (
                        <button type="button" onClick={() => removeOption(opt)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!field.is_locked && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                    placeholder="Type an option and press Enter"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C]/20 transition-all"
                  />
                  <button type="button" onClick={addOption}
                    className="px-3 py-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors text-sm font-semibold">
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Applicable agent types */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Show to Agent Types
              <span className="ml-1 font-normal normal-case text-gray-400">
                ({field.applicable_agent_types.length === 0 ? 'All agent types' : `${field.applicable_agent_types.length} selected`})
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {agentTypes.map(at => {
                const selected = field.applicable_agent_types.includes(at.name)
                return (
                  <button
                    key={at.agent_type_id}
                    type="button"
                    onClick={() => toggleAgentType(at.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-[#DC143C] border-[#DC143C] text-white'
                        : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                    }`}
                  >
                    {at.name}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {field.applicable_agent_types.length === 0
                ? 'No filter — this question appears for all agent types.'
                : 'Only selected agent types will see this question during registration.'}
            </p>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Main CustomFieldBuilder ────────────────────────────────────────────────────
const CustomFieldBuilder: React.FC<Props> = ({
  fields,
  agentTypes,
  onChange,
  maxFields = 15,
}) => {
  const addField = () => {
    if (fields.length >= maxFields) return
    const newField: DraftField = {
      tempId:                 `draft-${Date.now()}`,
      label:                  '',
      field_type:             'text',
      options:                [],
      is_required:            false,
      applicable_agent_types: [],
      is_locked:              false,
    }
    onChange([...fields, newField])
  }

  const updateField = (index: number, updated: DraftField) => {
    const next = [...fields]
    next[index] = updated
    onChange(next)
  }

  const deleteField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const next = [...fields]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    onChange(next)
  }

  const lockedCount = fields.filter(f => f.is_locked).length
  const unlockedCount = fields.filter(f => !f.is_locked).length

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {fields.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
          <span>{fields.length}/{maxFields} questions</span>
          {lockedCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <LockIcon /> {lockedCount} locked
            </span>
          )}
        </div>
      )}

      {/* Field list */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <FieldEditor
            key={field.tempId ?? field.field_id}
            field={field}
            index={index}
            total={fields.length}
            agentTypes={agentTypes}
            onUpdate={updated => updateField(index, updated)}
            onDelete={() => deleteField(index)}
            onMoveUp={() => moveField(index, 'up')}
            onMoveDown={() => moveField(index, 'down')}
          />
        ))}
      </div>

      {/* Add question button */}
      {fields.length < maxFields ? (
        <button
          type="button"
          onClick={addField}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-400 dark:text-gray-600 hover:border-[#DC143C] hover:text-[#DC143C] transition-all text-sm font-semibold"
        >
          <PlusIcon />
          Add Question
        </button>
      ) : (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
          Maximum of {maxFields} questions reached.
        </p>
      )}

      {/* Locked fields warning */}
      {lockedCount > 0 && unlockedCount === 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 px-4 py-3 rounded-xl">
          <LockIcon />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            All questions are locked because participants have already answered them.
            You can still add new questions, which will appear blank for existing participants.
          </p>
        </div>
      )}
    </div>
  )
}

export default CustomFieldBuilder