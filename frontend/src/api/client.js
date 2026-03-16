import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Auto attach token
client.interceptors.request.use(config => {
  const token = localStorage.getItem('vault_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 handler
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vault_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const getCsrfCookie = () =>
  axios.get(`${import.meta.env.VITE_API_BASE}/sanctum/csrf-cookie`, {
    withCredentials: true
  })

export default client