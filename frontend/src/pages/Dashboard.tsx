import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface Workflow { id: number; name: string }

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/workflows')
        setWorkflows(res.data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load')
      }
    })()
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-semibold">Workflows</h1>
        <Link to="/builder" className="px-3 py-2 bg-blue-600 text-white rounded">New Workflow</Link>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <ul className="divide-y bg-white rounded shadow">
        {workflows.map(w => (
          <li key={w.id} className="p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{w.name}</div>
              <Link to={`/builder/${w.id}`} className="text-blue-600 text-sm">Edit</Link>
            </div>
            <Link to={`/builder/${w.id}`} className="px-3 py-1 bg-gray-100 rounded">Open</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
