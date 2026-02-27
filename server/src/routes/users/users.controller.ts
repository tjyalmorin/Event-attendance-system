import { Request, Response } from 'express'
import { createUserService, getAllUsersService, softDeleteUserService } from './users.service.js'

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await createUserService(req.body)
    res.status(201).json(user)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUsersService()
    res.json(users)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await softDeleteUserService(req.params.user_id)
    res.json({ message: 'User deleted successfully' })
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
}