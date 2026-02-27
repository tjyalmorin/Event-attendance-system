import api from './axios'
import { AdminGrant, GrantAdminPayload } from '../types'

/**
 * Grant temporary admin access to staff for event
 */
export const grantAdminAccessApi = async (payload: GrantAdminPayload): Promise<{ grant: AdminGrant }> => {
  const res = await api.post('/users/admin-grant', payload)
  return res.data
}

/**
 * Get all active admin grants for current user
 */
export const getMyAdminGrantsApi = async (): Promise<AdminGrant[]> => {
  const res = await api.get('/users/admin-grants/me')
  return res.data
}

/**
 * Get all admin grants for an event (SuperAdmin only)
 */
export const getEventAdminGrantsApi = async (eventId: number): Promise<AdminGrant[]> => {
  const res = await api.get(`/events/${eventId}/admin-grants`)
  return res.data
}

/**
 * Revoke admin access early
 */
export const revokeAdminAccessApi = async (grantId: number): Promise<void> => {
  await api.delete(`/users/admin-grant/${grantId}`)
}
