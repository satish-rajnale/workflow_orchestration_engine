import { useEffect, useRef } from 'react'
import { eventBus } from '../services/eventBus'

export default function useExecutionWS(workflowId?: number, onMessage?: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    if (!workflowId) return
    const wsUrl = (process.env.REACT_APP_API_BASE_URL || (typeof window !== 'undefined' ? (window as any).__API_BASE_URL__ : undefined) || 'http://localhost:8000' || 'http://localhost:8000').replace('http', 'ws')
    const ws = new WebSocket(`${wsUrl.replace(/\/$/, '')}/ws/executions/${workflowId}`)
    wsRef.current = ws
    ws.onmessage = (evt) => {
      try { 
        const data = JSON.parse(evt.data); 
        onMessage && onMessage(data);
        // Publish to event bus for other components
        eventBus.publish('workflow-execution', data);
      } catch {}
    }
    return () => { ws.close() }
  }, [workflowId])
  return wsRef
}
