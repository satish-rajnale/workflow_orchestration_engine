import React from 'react';

interface WorkflowHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onRun: () => void;
  onDelete: () => void;
  workflowId: string | undefined;
}

export default function WorkflowHeader({
  name,
  onNameChange,
  onSave,
  onRun,
  onDelete,
  workflowId,
}: WorkflowHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Workflow Builder
          </h1>
          <input
            className="text-lg font-medium border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Workflow name"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={onSave}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={onRun}
            disabled={!workflowId}
          >
            Run Workflow
          </button>
          {workflowId && (
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              onClick={onDelete}
            >
              Delete Workflow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
