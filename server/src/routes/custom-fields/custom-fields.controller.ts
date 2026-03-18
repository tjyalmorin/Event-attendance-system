import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import {
  getCustomFieldsByEventService,
  createCustomFieldService,
  updateCustomFieldService,
  deleteCustomFieldService,
  reorderCustomFieldsService,
} from './custom-fields.service.js'

export const getCustomFieldsByEvent = asyncHandler(async (req: Request, res: Response) => {
  const fields = await getCustomFieldsByEventService(Number(req.params.event_id))
  res.json(fields)
})

export const createCustomField = asyncHandler(async (req: Request, res: Response) => {
  const field = await createCustomFieldService(Number(req.params.event_id), req.body)
  res.status(201).json(field)
})

export const updateCustomField = asyncHandler(async (req: Request, res: Response) => {
  const field = await updateCustomFieldService(Number(req.params.field_id), req.body)
  res.json(field)
})

export const deleteCustomField = asyncHandler(async (req: Request, res: Response) => {
  await deleteCustomFieldService(Number(req.params.field_id))
  res.json({ message: 'Custom field deleted successfully' })
})

export const reorderCustomFields = asyncHandler(async (req: Request, res: Response) => {
  const fields = await reorderCustomFieldsService(
    Number(req.params.event_id),
    req.body.ordered_ids
  )
  res.json(fields)
})