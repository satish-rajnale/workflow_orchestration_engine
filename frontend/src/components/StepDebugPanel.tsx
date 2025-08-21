import React from 'react';
import { Node } from 'reactflow';

interface StepDebugPanelProps {
  selectedStep: Node | null;
}

export default function StepDebugPanel({ selectedStep }: StepDebugPanelProps) {
  if (!selectedStep) {
    return null;
  }

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Selected Step Data
      </h3>
      <div className="text-xs font-mono bg-gray-50 p-2 rounded max-h-32 overflow-auto">
        <pre>{JSON.stringify(selectedStep.data, null, 2)}</pre>
      </div>
    </div>
  );
}
