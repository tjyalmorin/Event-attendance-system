import api from './axios'

export interface CustomField {
  field_id: number
  event_id: number
  label: string
  field_type: 'text' | 'textarea' | 'number' | 'dropdown' | 'radio' | 'checkbox'
  options: string[] | null
  is_required: boolean
  display_order: number
  applicable_agent_types: string[]
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface FieldAnswer {
  field_id: number
  answer: string | null
}

export const getCustomFieldsApi = async (event_id: number): Promise<CustomField[]> => {
  const res = await api.get(`/custom-fields/events/${event_id}/fields`)
  return res.data
}

export const createCustomFieldApi = async (
  event_id: number,
  payload: {
    label: string
    field_type: CustomField['field_type']
    options?: string[] | null
    is_required: boolean
    display_order?: number
    applicable_agent_types?: string[]
  }
): Promise<CustomField> => {
  const res = await api.post(`/custom-fields/events/${event_id}/fields`, payload)
  return res.data
}

export const updateCustomFieldApi = async (
  field_id: number,
  payload: Partial<{
    label: string
    field_type: CustomField['field_type']
    options: string[] | null
    is_required: boolean
    display_order: number
    applicable_agent_types: string[]
  }>
): Promise<CustomField> => {
  const res = await api.put(`/custom-fields/fields/${field_id}`, payload)
  return res.data
}

export const deleteCustomFieldApi = async (field_id: number): Promise<void> => {
  await api.delete(`/custom-fields/fields/${field_id}`)
}

export const reorderCustomFieldsApi = async (
  event_id: number,
  ordered_ids: number[]
): Promise<CustomField[]> => {
  const res = await api.post(`/custom-fields/events/${event_id}/fields/reorder`, { ordered_ids })
  return res.data
}