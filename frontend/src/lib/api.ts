import axios from 'axios'
import type { AxiosError } from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  const ax = err as AxiosError<{ error?: string; message?: string }>
  if (ax?.response) {
    const data = ax.response.data
    if (data && typeof data === 'object' && (data.error || data.message)) {
      return String(data.error || data.message)
    }
    if (ax.response.status === 503) return 'Storage is unavailable right now. Please retry shortly.'
    if (ax.response.status === 404) return 'The requested resource was not found.'
    if (ax.response.status === 413) return 'The file is larger than the 25 MB upload limit.'
    if (ax.response.status === 422) return 'The file has too many rows for this endpoint.'
    if (ax.response.status >= 500) return 'The server returned an error. This feature may be temporarily unavailable.'
    return fallback
  }
  if (ax?.code === 'ECONNABORTED') return 'The request timed out. Please retry.'
  if (ax?.message === 'Network Error') return 'Cannot reach the SmartCart API. Check that the backend is running.'
  return fallback
}

export function isShape<T>(data: unknown): data is T {
  return data !== null && data !== undefined && typeof data === 'object'
}

export const dashboardApi = {
  getKpis: () => api.get('/dashboard/kpis'),
  getActivity: () => api.get('/dashboard/activity'),
  refresh: () => api.post('/dashboard/refresh'),
}

export const productsApi = {
  getAll: (params?: Record<string, string>) => api.get('/products', { params }),
  getById: (id: number) => api.get('/products/' + id),
  create: (data: object) => api.post('/products', data),
  update: (id: number, data: object) => api.put('/products/' + id, data),
  delete: (id: number) => api.delete('/products/' + id),
  getCategories: () => api.get('/products/meta/categories'),
}

export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id: number) => api.get('/suppliers/' + id),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: number, data: object) => api.put('/suppliers/' + id, data),
  delete: (id: number) => api.delete('/suppliers/' + id),
}

export const stockApi = {
  getAll: () => api.get('/stock'),
  update: (id: number, data: object) => api.put('/stock/' + id, data),
  create: (data: object) => api.post('/stock', data),
}

export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: number) => api.put('/notifications/' + id + '/read'),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  create: (data: object) => api.post('/notifications', data),
  delete: (id: number) => api.delete('/notifications/' + id),
}

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: string) => api.put('/settings/' + key, { value }),
}

export const auditApi = {
  getAll: (params?: Record<string, string>) => api.get('/audit', { params }),
  create: (data: object) => api.post('/audit', data),
}

export const discountsApi = {
  getAll: () => api.get('/discounts'),
  create: (data: object) => api.post('/discounts', data),
  resolve: (id: number, data: object) => api.put('/discounts/' + id + '/resolve', data),
}

export const aiApi = {
  getBriefing: () => api.get('/ai/briefing'),
  predictRisk: (productId: number, data: object) => api.post('/ai/predict-risk/' + productId, data),
  getDiscount: (data: object) => api.post('/ai/discount', data),
  chat: (message: string, history: unknown[] = [], apiKey?: string) =>
    api.post('/ai/chat', { message, history, apiKey }),
  mineRules: () => api.get('/ai/mine-rules'),
  postMineRules: (data: object) => api.post('/ai/mine-rules', data),
  getHeatmap: () => api.get('/ai/heatmap'),
  explainRisk: (data: object) => api.post('/ai/explain-risk', data),
}

export const olapApi = {
  getCube: (groupBy: 'category' | 'zone' | 'month' = 'category') =>
    api.get('/olap/cube', { params: { groupBy } }),
}

/* ---------------------------------------------------------------
   Dataset / multi-store endpoints
   --------------------------------------------------------------- */

export const datasetApi = {
  health: () => api.get('/dataset/health'),
  uploads: (storeId?: number) =>
    api.get('/dataset/uploads', { params: storeId ? { store_id: String(storeId) } : undefined }),
  upload: (form: FormData) =>
    api.post('/dataset/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  getUpload: (id: number) => api.get('/dataset/uploads/' + id),
  rows: (id: number, limit = 50, offset = 0) =>
    api.get(`/dataset/uploads/${id}/rows`, { params: { limit: String(limit), offset: String(offset) } }),
  profile: (id: number) => api.get('/dataset/uploads/' + id + '/profile'),
  exportUrl: (id: number) => `/api/dataset/uploads/${id}/export`,
  remove: (id: number) => api.delete('/dataset/uploads/' + id, { params: { confirm: 'true' } }),
}

export const storesApi = {
  getAll: () => api.get('/stores'),
  get: (id: number) => api.get('/stores/' + id),
  create: (data: object) => api.post('/stores', data),
  update: (id: number, data: object) => api.patch('/stores/' + id, data),
  remove: (id: number) => api.delete('/stores/' + id, { params: { confirm: 'true' } }),
  metrics: (id: number) => api.get(`/stores/${id}/metrics`),
  orderList: (id: number) => api.get(`/stores/${id}/order-list`),
  items: (id: number, params: Record<string, string>) =>
    api.get(`/stores/${id}/items`, { params }),
  createItem: (id: number, data: object) => api.post(`/stores/${id}/items`, data),
  updateItem: (id: number, itemId: string | number, data: object) =>
    api.put(`/stores/${id}/items/${itemId}`, data),
  removeItem: (id: number, itemId: string | number) =>
    api.delete(`/stores/${id}/items/${itemId}`, { params: { confirm: 'true' } }),
}

export const compareApi = {
  getAll: () => api.get('/compare'),
}

export default api
