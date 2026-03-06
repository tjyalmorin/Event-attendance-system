import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import {
  getAllBranchesService,
  createBranchService,
  updateBranchService,
  deleteBranchService,
  getTeamsByBranchService,
  createTeamService,
  updateTeamService,
  deleteTeamService,
} from './branches.service.js'

// ── Branches ───────────────────────────────────────────────
export const getAllBranches = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await getAllBranchesService())
})

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await createBranchService(req.body.name)
  res.status(201).json(branch)
})

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await updateBranchService(Number(req.params.branch_id), req.body.name)
  res.json(branch)
})

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  await deleteBranchService(Number(req.params.branch_id))
  res.json({ message: 'Branch deleted successfully' })
})

// ── Teams ──────────────────────────────────────────────────
export const getTeamsByBranch = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getTeamsByBranchService(Number(req.params.branch_id)))
})

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const team = await createTeamService(Number(req.params.branch_id), req.body.name)
  res.status(201).json(team)
})

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const team = await updateTeamService(Number(req.params.team_id), req.body.name)
  res.json(team)
})

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  await deleteTeamService(Number(req.params.team_id))
  res.json({ message: 'Team deleted successfully' })
})