import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import {
  getAllAgentTypesService,
  createAgentTypeService,
  updateAgentTypeService,
  deleteAgentTypeService,
  reorderAgentTypesService,
} from './agent-types.service.js'

export const getAllAgentTypes = asyncHandler(async (req: Request, res: Response) => {
  // Public always gets only active agent types
  const result = await getAllAgentTypesService(false)
  res.json(result)
})

export const getAllAgentTypesAdmin = asyncHandler(async (req: Request, res: Response) => {
  // Admin explicit endpoint gets all including inactive
  const result = await getAllAgentTypesService(true)
  res.json(result)
})

export const createAgentType = asyncHandler(async (req: Request, res: Response) => {
  const result = await createAgentTypeService(req.body.name, req.body.display_order)
  res.status(201).json(result)
})

export const updateAgentType = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateAgentTypeService(Number(req.params.agent_type_id), req.body)
  res.json(result)
})

export const deleteAgentType = asyncHandler(async (req: Request, res: Response) => {
  await deleteAgentTypeService(Number(req.params.agent_type_id))
  res.json({ message: 'Agent type deleted successfully' })
})

export const reorderAgentTypes = asyncHandler(async (req: Request, res: Response) => {
  const result = await reorderAgentTypesService(req.body.ordered_ids)
  res.json(result)
})