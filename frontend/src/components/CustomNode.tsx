import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface CustomNodeData {
  label: string;
  step: {
    id: string;
    type: string;
    action: string;
    params: any;
  };
  action: string;
  onStepNameChange?: (stepId: string, newName: string) => void;
}

const ACTION_ICONS: { [key: string]: string } = {
  start: '▶️',
  delay: '⏱️',
  notify: '🔔',
  http_request: '🌐',
  branch: '🔀',
  email: '📧',
  check_ticket_assigned: '🎫',
};

const ACTION_COLORS: { [key: string]: string } = {
  start: 'bg-green-100 border-green-300',
  delay: 'bg-yellow-100 border-yellow-300',
  notify: 'bg-blue-100 border-blue-300',
  http_request: 'bg-purple-100 border-purple-300',
  branch: 'bg-orange-100 border-orange-300',
  email: 'bg-red-100 border-red-300',
  check_ticket_assigned: 'bg-indigo-100 border-indigo-300',
};

export default function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [stepName, setStepName] = useState(data.label || id);
  
  const action = data.step?.action || data.action;
  const icon = ACTION_ICONS[action] || '⚙️';
  const colorClass = ACTION_COLORS[action] || 'bg-gray-100 border-gray-300';

  const handleNameChange = (newName: string) => {
    setStepName(newName);
    console.log("handleNameChange", id, newName);
    data.onStepNameChange?.(id, newName);
    setIsEditing(false);
  };

  return (
    <div className={`px-4 py-2 rounded-lg border-2 ${colorClass} min-w-[120px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={stepName}
              onChange={(e) => setStepName(e.target.value)}
              onBlur={() => handleNameChange(stepName)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNameChange(stepName);
                }
              }}
              className="w-full text-xs bg-white border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <div
              className="text-xs font-medium cursor-pointer hover:bg-white hover:bg-opacity-50 rounded px-1 py-0.5"
              onClick={() => setIsEditing(true)}
            >
              {stepName}
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-600 capitalize">
        {action.replace('_', ' ')}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
