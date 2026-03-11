import { z } from 'zod'

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')

export const createUserSchema = z.object({
  agent_code:  z.string().max(50).optional(),
  full_name:   z.string().min(1, 'Full name is required').max(255),
  email:       z.string().email('Invalid email').toLowerCase(),
  password:    strongPassword,
  branch_name: z.string().min(1, 'Branch name is required').max(255),
  team_name:   z.string().max(255).optional().nullable(),
  role:        z.enum(['admin', 'staff'], { error: 'Role must be admin or staff' }),
})

export const updateUserSchema = z.object({
  agent_code:  z.string().max(50).optional().nullable(),
  full_name:   z.string().min(1).max(255).optional(),
  email:       z.string().email('Invalid email').toLowerCase().optional(),
  password:    strongPassword.optional(),
  branch_name: z.string().min(1).max(255).optional(),
  team_name:   z.string().max(255).optional().nullable(),
  role:        z.enum(['admin', 'staff']).optional(),
})

export const updateProfileSchema = z.object({
  full_name:   z.string().min(1).max(255).optional(),
  email:       z.string().email('Invalid email').toLowerCase().optional(),
  branch_name: z.string().min(1).max(255).optional(),
  team_name:   z.string().max(255).optional().nullable(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     strongPassword,
})

export const adminResetPasswordSchema = z.object({
  newPassword: strongPassword,
})