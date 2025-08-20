import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/auth/signup', { email, password })
      navigate('/login')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Signup</h1>
      <form className="space-y-3" onSubmit={submit}>
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Create account</button>
      </form>
      <div className="text-sm mt-3">Have an account? <Link className="text-blue-600" to="/login">Login</Link></div>
    </div>
  )
}
