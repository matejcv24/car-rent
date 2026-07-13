import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleettrack_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fleettrack_token')
      window.dispatchEvent(new Event('fleettrack:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export const getApiErrors = (error) => error.response?.data?.errors ?? {}
export const getApiMessage = (error, fallback = 'Something went wrong.') =>
  error.response?.data?.message ?? fallback

export default api
