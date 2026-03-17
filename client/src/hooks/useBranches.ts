import { useState, useEffect } from 'react'
import { getAllBranchesApi, BranchItem } from '../api/branches.api'

let cache: BranchItem[] | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useBranches() {
  const isStale = () => Date.now() - cacheTime > CACHE_TTL

  const [branches, setBranches] = useState<BranchItem[]>(!isStale() && cache ? cache : [])
  const [loading, setLoading]   = useState(isStale() || !cache)

  useEffect(() => {
    if (cache && !isStale()) {
      setBranches(cache)
      setLoading(false)
      return
    }
    getAllBranchesApi()
      .then(data => {
        cache     = data
        cacheTime = Date.now()
        setBranches(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getTeamsForBranch = (branchName: string) =>
    branches.find(b => b.name === branchName)?.teams?.map(t => t.name) ?? []

  const branchNames = branches.map(b => b.name)

  return { branches, branchNames, getTeamsForBranch, loading }
}

export function invalidateBranchCache() {
  cache     = null
  cacheTime = 0
}