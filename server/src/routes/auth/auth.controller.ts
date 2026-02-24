import { Request, Response } from 'express'
import { loginService, getMeService } from './auth.service.js'

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }
    const data = await loginService(email, password)
    res.json(data)
  } catch (err: any) {
    res.status(401).json({ error: err.message })
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getMeService(req.user!.user_id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}