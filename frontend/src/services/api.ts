import axios from 'axios'
import useAuth from '../store/auth'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || (typeof window !== 'undefined' ? (window as any).__API_BASE_URL__ : undefined) || 'http://localhost:8000' || 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
