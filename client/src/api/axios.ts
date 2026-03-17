import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

const PUBLIC_PATHS = ['/register', '/confirmation', '/admin/login', '/admin/forgot-password']

const isPublicRoute = () =>
  PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path))

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401 && !isPublicRoute()) {
      localStorage.removeItem('authToken')
      window.location.href = '/admin/login'
      return Promise.reject(error)
    }

    if (status === 503) {
      console.warn('⚠️ Server is under high load. Please retry in a moment.')
      return Promise.reject(new Error('Server is busy, please retry in a moment.'))
    }

    if (status === 500) {
      console.error('❌ Internal server error.')
      return Promise.reject(new Error('Something went wrong on the server. Please try again.'))
    }

    return Promise.reject(error)
  }
)

export default api