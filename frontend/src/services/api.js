import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      localStorage.removeItem('token')
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export async function loginApi({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function registerApi(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function getTripsApi() {
  const { data } = await api.get('/trips')
  return data
}

export async function createTripApi(payload) {
  const { data } = await api.post('/trips', payload)
  return data
}

export async function createStopApi(tripId, payload) {
  const { data } = await api.post(`/stops/${tripId}`, payload)
  return data
}

export async function createActivityApi(stopId, payload) {
  const { data } = await api.post(`/activities/${stopId}`, payload)
  return data
}

export default api
