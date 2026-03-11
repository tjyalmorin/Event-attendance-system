// client/src/hooks/useBranches.ts
// Drop-in replacement for the old hardcoded branchData.ts
// Usage: const { branches, loading } = useBranches()

import { useState, useEffect } from 'react'
import { getAllBranchesApi, BranchItem } from '../api/branches.api'

let cache: BranchItem[] | null = null // simple module-level cache

export function useBranches() {
  const [branches, setBranches] = useState<BranchItem[]>(cache ?? [])
  const [loading, setLoading]   = useState(!cache)

  useEffect(() => {
    if (cache) { setBranches(cache); setLoading(false); return }
    getAllBranchesApi()
      .then(data => { cache = data; setBranches(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getTeamsForBranch = (branchName: string) =>
    branches.find(b => b.name === branchName)?.teams?.map(t => t.name) ?? []

  const branchNames = branches.map(b => b.name)

  return { branches, branchNames, getTeamsForBranch, loading }
}

// Call this after any create/update/delete in BranchManagement
// so the next hook usage re-fetches fresh data
export function invalidateBranchCache() {
  cache = null
}