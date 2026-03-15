import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Auto attach token from localStorage
client.interceptors.request.use(config => {
  const token = localStorage.getItem('vault_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler
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

export default client