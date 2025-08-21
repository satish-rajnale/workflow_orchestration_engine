import React from 'react';

interface StepSelectorProps {
  onAddStep: (action: string) => void;
}

const STEP_TYPES = [
  { id: 'start', label: 'Start', icon: '▶️' },
  { id: 'delay', label: 'Delay', icon: '⏱️' },
  { id: 'notify', label: 'Notify', icon: '🔔' },
  { id: 'http_request', label: 'HTTP Request', icon: '🌐' },
  { id: 'branch', label: 'Branch', icon: '🔀' },
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'check_ticket_assigned', label: 'Check Ticket', icon: '🎫' },
];

export default function StepSelector({ onAddStep }: StepSelectorProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Add Steps
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {STEP_TYPES.map((stepType) => (
          <button
            key={stepType.id}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            onClick={() => onAddStep(stepType.id)}
          >
            <span>{stepType.icon}</span>
            <span>{stepType.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
