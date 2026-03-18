import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getAllBranchesApi,
  createBranchApi,
  updateBranchApi,
  deleteBranchApi,
  createTeamApi,
  updateTeamApi,
  deleteTeamApi,
  BranchItem,
} from '../../api/branches.api'

import {
  getAllAgentTypesApi,
  createAgentTypeApi,
  updateAgentTypeApi,
  deleteAgentTypeApi,
  reorderAgentTypesApi,
  AgentType,
} from '../../api/agent-types.api'

// ── Icons ──────────────────────────────────────────────────
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const TrashIconSm = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const GitBranchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <path d="M18 9a9 9 0 01-9 9"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const ChevronUpSmIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)
const ChevronDownSmIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

// ── Inline editable text ───────────────────────────────────
function InlineEdit({
  value, onSave, onCancel,
}: { value: string; onSave: (v: string) => Promise<void>; onCancel: () => void }) {
  const [val, setVal] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  const submit = async () => {
    if (!val.trim() || val.trim() === value) { onCancel(); return }
    setSaving(true)
    await onSave(val.trim())
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }}
        className="flex-1 h-8 px-3 rounded-lg border-[1.5px] border-[#DC143C] bg-white dark:bg-[#0f0f0f] text-sm text-gray-900 dark:text-white outline-none focus:shadow-[0_0_0_3px_rgba(220,20,60,0.12)]"
        disabled={saving}
      />
      <button onClick={submit} disabled={saving}
        className="h-8 px-3 rounded-lg bg-[#DC143C] text-white text-xs font-bold hover:bg-[#b01030] transition-colors disabled:opacity-50">
        {saving ? '...' : 'Save'}
      </button>
      <button onClick={onCancel} disabled={saving}
        className="h-8 px-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
        Cancel
      </button>
    </div>
  )
}

// ── Shared Cancel Button ───────────────────────────────────
const CancelBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
  >
    Cancel
  </button>
)

// ── Confirm Delete Modal ───────────────────────────────────
interface ConfirmDeleteProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({ message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 overflow-clip">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
        <div className="flex items-center gap-3">
          <span className="text-red-500 dark:text-red-400"><TrashIcon /></span>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"
        >
          <XIcon />
        </button>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      {/* Body */}
      <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <p>{message}</p>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <CancelBtn onClick={onCancel} />
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</>
            : 'Delete'
          }
        </button>
      </div>
    </div>
  </div>
)

// ── Main Component ─────────────────────────────────────────
export default function BranchManagement() {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = storedUser?.role || 'staff'

  const [branches, setBranches] = useState<BranchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set())

  // ── Add branch ──
  const [newBranchName, setNewBranchName] = useState('')
  const [addingBranch, setAddingBranch] = useState(false)
  const [branchError, setBranchError] = useState('')

  // ── Add team ──
  const [addTeamForBranch, setAddTeamForBranch] = useState<number | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [addingTeam, setAddingTeam] = useState(false)
  const [teamError, setTeamError] = useState('')

  // ── Inline edit ──
  const [editingBranch, setEditingBranch] = useState<number | null>(null)
  const [editingTeam, setEditingTeam] = useState<number | null>(null)

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'branch'; id: number; name: string } |
    { type: 'team'; id: number; name: string } | null
  >(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (userRole !== 'admin') { navigate('/admin/settings/profile'); return }
    load()
  }, [])

  const load = async () => {
    try {
      const data = await getAllBranchesApi()
      setBranches(data)
      setExpandedBranches(new Set(data.map(b => b.branch_id)))
    } catch { navigate('/admin/login') }
    finally { setLoading(false) }
  }

  const toggleExpand = (id: number) => {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Branch CRUD ────────────────────────────────────────
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBranchName.trim()) return
    setAddingBranch(true); setBranchError('')
    try {
      const branch = await createBranchApi(newBranchName.trim())
      setBranches(prev => [...prev, branch])
      setExpandedBranches(prev => new Set([...prev, branch.branch_id]))
      setNewBranchName('')
    } catch (err: any) {
      setBranchError(err.response?.data?.error || err.message || 'Failed to create branch')
    } finally { setAddingBranch(false) }
  }

  const handleUpdateBranch = async (branch_id: number, name: string) => {
    const updated = await updateBranchApi(branch_id, name)
    setBranches(prev => prev.map(b => b.branch_id === branch_id ? { ...b, name: updated.name } : b))
    setEditingBranch(null)
  }

  const handleDeleteBranch = async () => {
    if (!deleteTarget || deleteTarget.type !== 'branch') return
    setDeleting(true)
    try {
      await deleteBranchApi(deleteTarget.id)
      setBranches(prev => prev.filter(b => b.branch_id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  // ── Team CRUD ──────────────────────────────────────────
  const handleAddTeam = async (branch_id: number) => {
    if (!newTeamName.trim()) return
    setAddingTeam(true); setTeamError('')
    try {
      const team = await createTeamApi(branch_id, newTeamName.trim())
      setBranches(prev => prev.map(b =>
        b.branch_id === branch_id ? { ...b, teams: [...(b.teams || []), team] } : b
      ))
      setNewTeamName('')
      setAddTeamForBranch(null)
    } catch (err: any) {
      setTeamError(err.response?.data?.error || err.message || 'Failed to create team')
    } finally { setAddingTeam(false) }
  }

  const handleUpdateTeam = async (team_id: number, name: string) => {
    const updated = await updateTeamApi(team_id, name)
    setBranches(prev => prev.map(b => ({
      ...b,
      teams: (b.teams || []).map(t => t.team_id === team_id ? { ...t, name: updated.name } : t)
    })))
    setEditingTeam(null)
  }

  const handleDeleteTeam = async () => {
    if (!deleteTarget || deleteTarget.type !== 'team') return
    setDeleting(true)
    try {
      await deleteTeamApi(deleteTarget.id)
      setBranches(prev => prev.map(b => ({
        ...b,
        teams: (b.teams || []).filter(t => t.team_id !== deleteTarget.id)
      })))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  const totalTeams = branches.reduce((acc, b) => acc + (b.teams?.length ?? 0), 0)

  // ── Agent Types ────────────────────────────────────────────
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([])
  const [atLoading, setAtLoading] = useState(true)
  const [newAtName, setNewAtName] = useState('')
  const [addingAt, setAddingAt] = useState(false)
  const [atError, setAtError] = useState('')
  const [editingAt, setEditingAt] = useState<number | null>(null)
  const [deleteAtTarget, setDeleteAtTarget] = useState<AgentType | null>(null)
  const [deletingAt, setDeletingAt] = useState(false)

  const loadAgentTypes = async () => {
    setAtLoading(true)
    try { setAgentTypes(await getAllAgentTypesApi()) }
    catch { /* silent */ }
    finally { setAtLoading(false) }
  }

  useEffect(() => { loadAgentTypes() }, [])

  const handleAddAgentType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAtName.trim()) return
    setAddingAt(true); setAtError('')
    try {
      await createAgentTypeApi({ name: newAtName.trim() })
      setNewAtName('')
      loadAgentTypes()
    } catch (err: any) {
      setAtError(err.response?.data?.error || err.message || 'Failed to create agent type')
    } finally { setAddingAt(false) }
  }

  const handleUpdateAgentType = async (id: number, name: string) => {
    await updateAgentTypeApi(id, { name })
    setEditingAt(null)
    loadAgentTypes()
  }

  const handleToggleActive = async (at: AgentType) => {
    await updateAgentTypeApi(at.agent_type_id, { is_active: !at.is_active })
    loadAgentTypes()
  }

  const handleDeleteAgentType = async () => {
    if (!deleteAtTarget) return
    setDeletingAt(true)
    try {
      await deleteAgentTypeApi(deleteAtTarget.agent_type_id)
      setDeleteAtTarget(null)
      loadAgentTypes()
    } catch (err: any) {
      setAtError(err.response?.data?.error || err.message || 'Cannot delete: agent type is in use')
      setDeleteAtTarget(null)
    } finally { setDeletingAt(false) }
  }

  const handleMoveAt = async (index: number, dir: 'up' | 'down') => {
    const next = [...agentTypes]
    const swap = dir === 'up' ? index - 1 : index + 1
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setAgentTypes(next)
    await reorderAgentTypesApi(next.map(at => at.agent_type_id))
  }

  const inputClass = "h-[40px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] px-3 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"

  return (
    <div className="flex-1 overflow-auto">

        {/* ── HEADER ── */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center justify-between">
            <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              Branch<span className="text-[#DC143C]">.</span>Management
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/20 text-[#DC143C] text-xs font-bold uppercase tracking-wide">
              <ShieldIcon />Admin Only
            </div>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-8 py-6 space-y-5">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: branches.length, label: 'Total Branches', icon: <GitBranchIcon />, red: true },
              { num: totalTeams,      label: 'Total Teams',    icon: <UsersIcon />,     red: false },
            ].map((s, i) => (
              <div key={i} className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5 pb-6 overflow-hidden">
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${s.red ? 'bg-[#DC143C]/10 text-[#DC143C]' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
                  {s.icon}
                </div>
                <div className={`text-4xl font-extrabold tracking-tight leading-none mb-1 ${s.red ? 'text-[#DC143C]' : 'text-gray-900 dark:text-white'}`}>
                  {loading ? '—' : s.num}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-[#2a2a2a]">
                  <div className="h-full bg-[#DC143C] rounded-r-full" style={{ width: s.red ? '100%' : `${branches.length ? Math.round((totalTeams / Math.max(totalTeams, 1)) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── ADD BRANCH FORM ── */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Add New Branch</h2>
            <form onSubmit={handleAddBranch} className="flex gap-3">
              <input
                className={inputClass + ' flex-1'}
                value={newBranchName}
                onChange={e => { setNewBranchName(e.target.value); setBranchError('') }}
                placeholder="e.g. A3 Diamond"
                maxLength={255}
                disabled={addingBranch}
              />
              <button type="submit" disabled={addingBranch || !newBranchName.trim()}
                className="flex items-center gap-2 h-[40px] px-5 bg-[#DC143C] text-white rounded-xl text-sm font-bold hover:bg-[#b01030] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                <PlusIcon />
                {addingBranch ? 'Adding...' : 'Add Branch'}
              </button>
            </form>
            {branchError && (
              <p className="text-xs text-red-500 mt-2">{branchError}</p>
            )}
          </div>

          {/* ── BRANCH LIST ── */}
          {loading ? (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-12 text-center text-gray-400 text-sm">
              Loading branches...
            </div>
          ) : branches.length === 0 ? (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-12 text-center text-gray-400 text-sm">
              No branches yet. Add one above.
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map(branch => {
                const isExpanded = expandedBranches.has(branch.branch_id)
                const isEditingBranch = editingBranch === branch.branch_id
                const teamCount = branch.teams?.length ?? 0

                return (
                  <div key={branch.branch_id}
                    className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">

                    {/* Branch header row */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      <button onClick={() => toggleExpand(branch.branch_id)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <ChevronDownIcon open={isExpanded} />
                      </button>

                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        {isEditingBranch ? (
                          <InlineEdit
                            value={branch.name}
                            onSave={name => handleUpdateBranch(branch.branch_id, name)}
                            onCancel={() => setEditingBranch(null)}
                          />
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#DC143C] flex-shrink-0" />
                            <span className="font-bold text-gray-900 dark:text-white text-base truncate">
                              {branch.name}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 rounded-full flex-shrink-0">
                              {teamCount} team{teamCount !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>

                      {!isEditingBranch && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingBranch(branch.branch_id); setEditingTeam(null) }}
                            className="p-2 text-gray-400 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-[#DC143C]/10 rounded-lg transition-colors"
                            title="Rename branch"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'branch', id: branch.branch_id, name: branch.name })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete branch"
                          >
                            <TrashIconSm />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Teams section */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-[#2a2a2a] px-5 py-3 space-y-1">

                        {(branch.teams || []).length === 0 && (
                          <p className="text-xs text-gray-400 italic py-1 pl-6">No teams yet</p>
                        )}
                        {(branch.teams || []).map(team => {
                          const isEditingThisTeam = editingTeam === team.team_id
                          return (
                            <div key={team.team_id}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] group transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 ml-3 flex-shrink-0" />

                              {isEditingThisTeam ? (
                                <InlineEdit
                                  value={team.name}
                                  onSave={name => handleUpdateTeam(team.team_id, name)}
                                  onCancel={() => setEditingTeam(null)}
                                />
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{team.name}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => { setEditingTeam(team.team_id); setEditingBranch(null) }}
                                      className="p-1.5 text-gray-400 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-[#DC143C]/10 rounded-lg transition-colors"
                                    >
                                      <EditIcon />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({ type: 'team', id: team.team_id, name: team.name })}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                      <TrashIconSm />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}

                        {/* Add team row */}
                        {addTeamForBranch === branch.branch_id ? (
                          <div className="flex items-center gap-2 px-3 py-2 ml-5">
                            <input
                              autoFocus
                              className={inputClass + ' flex-1'}
                              value={newTeamName}
                              onChange={e => { setNewTeamName(e.target.value); setTeamError('') }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAddTeam(branch.branch_id)
                                if (e.key === 'Escape') { setAddTeamForBranch(null); setNewTeamName(''); setTeamError('') }
                              }}
                              placeholder="Team name"
                              maxLength={255}
                              disabled={addingTeam}
                            />
                            <button onClick={() => handleAddTeam(branch.branch_id)} disabled={addingTeam || !newTeamName.trim()}
                              className="h-[40px] px-4 bg-[#DC143C] text-white rounded-xl text-xs font-bold hover:bg-[#b01030] transition-colors disabled:opacity-50">
                              {addingTeam ? '...' : 'Add'}
                            </button>
                            <button onClick={() => { setAddTeamForBranch(null); setNewTeamName(''); setTeamError('') }}
                              className="h-[40px] px-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                              <XIcon />
                            </button>
                            {teamError && <p className="text-xs text-red-500">{teamError}</p>}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddTeamForBranch(branch.branch_id); setNewTeamName(''); setTeamError('') }}
                            className="flex items-center gap-2 ml-5 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-[#DC143C]/10 rounded-xl transition-colors w-full text-left"
                          >
                            <PlusIcon />
                            Add team
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── AGENT TYPES ── */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Agent Types</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Appears in the registration form dropdown. Controls which custom questions each participant sees.
            </p>

            <form onSubmit={handleAddAgentType} className="flex gap-3 mb-4">
              <input
                className={inputClass + ' flex-1'}
                value={newAtName}
                onChange={e => { setNewAtName(e.target.value); setAtError('') }}
                placeholder="e.g. Senior Unit Manager"
                maxLength={100}
                disabled={addingAt}
              />
              <button type="submit" disabled={addingAt || !newAtName.trim()}
                className="flex items-center gap-2 h-[40px] px-5 bg-[#DC143C] text-white rounded-xl text-sm font-bold hover:bg-[#b01030] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                <PlusIcon />{addingAt ? 'Adding...' : 'Add Type'}
              </button>
            </form>

            {atError && <p className="text-xs text-red-500 mb-3">{atError}</p>}

            {atLoading ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading agent types...</div>
            ) : agentTypes.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center italic">No agent types yet. Add one above.</div>
            ) : (
              <div className="border border-gray-100 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                {agentTypes.map((at, i) => (
                  <div key={at.agent_type_id}
                    className={`flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#1c1c1c] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${i > 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''}`}>

                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button type="button" onClick={() => handleMoveAt(i, 'up')} disabled={i === 0}
                        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5">
                        <ChevronUpSmIcon />
                      </button>
                      <button type="button" onClick={() => handleMoveAt(i, 'down')} disabled={i === agentTypes.length - 1}
                        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5">
                        <ChevronDownSmIcon />
                      </button>
                    </div>

                    {editingAt === at.agent_type_id ? (
                      <InlineEdit
                        value={at.name}
                        onSave={name => handleUpdateAgentType(at.agent_type_id, name)}
                        onCancel={() => setEditingAt(null)}
                      />
                    ) : (
                      <>
                        <span className={`flex-1 text-sm font-medium ${at.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600 line-through'}`}>
                          {at.name}
                        </span>

                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${at.is_active ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-600'}`}>
                          {at.is_active ? 'Active' : 'Inactive'}
                        </span>

                        <button type="button" onClick={() => handleToggleActive(at)}
                          title={at.is_active ? 'Deactivate' : 'Activate'}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg transition-colors">
                          {at.is_active
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18.36 6.64A9 9 0 0 1 20.77 15"/><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/><path d="M12 2v4"/><path d="m2 2 20 20"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </button>

                        <button type="button" onClick={() => { setEditingAt(at.agent_type_id); setEditingBranch(null); setEditingTeam(null) }}
                          className="p-2 text-gray-400 hover:text-[#DC143C] hover:bg-red-50 dark:hover:bg-[#DC143C]/10 rounded-lg transition-colors">
                          <EditIcon />
                        </button>

                        <button type="button" onClick={() => setDeleteAtTarget(at)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <TrashIconSm />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* ── DELETE AGENT TYPE CONFIRM ── */}
      {deleteAtTarget && (
        <ConfirmDelete
          message={`Delete agent type "${deleteAtTarget.name}"? If any participants use this type it will be blocked.`}
          onConfirm={handleDeleteAgentType}
          onCancel={() => setDeleteAtTarget(null)}
          loading={deletingAt}
        />
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <ConfirmDelete
          message={
            deleteTarget.type === 'branch'
              ? `Delete branch "${deleteTarget.name}"? All its teams will also be deleted. This cannot be undone.`
              : `Delete team "${deleteTarget.name}"? This cannot be undone.`
          }
          onConfirm={deleteTarget.type === 'branch' ? handleDeleteBranch : handleDeleteTeam}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}