import { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';

export function useWorkflowExecution(workflowId?: number) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!workflowId) return;

    const unsubscribe = eventBus.subscribe('workflow-execution', (data) => {
      // Only process logs for the current workflow
      if (data.execution_id || data.workflow_id === workflowId) {
        setLogs(prev => [...prev, { ...data, timestamp: new Date() }]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [workflowId]);

  const clearLogs = () => {
    setLogs([]);
  };

  return { logs, clearLogs };
}
