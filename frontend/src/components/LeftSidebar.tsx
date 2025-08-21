import React from 'react';
import { Node } from 'reactflow';
import StepSelector from './StepSelector';
import TestPayloadPanel from './TestPayloadPanel';
import StepDebugPanel from './StepDebugPanel';

interface LeftSidebarProps {
  selectedStep: Node | null;
  testPayload: string;
  onAddStep: (action: string) => void;
  onTestPayloadChange: (payload: string) => void;
  onGenerateSample: () => void;
  onTestWorkflow: () => void;
  isTesting: boolean;
  workflowId: string | undefined;
}

export default function LeftSidebar({
  selectedStep,
  testPayload,
  onAddStep,
  onTestPayloadChange,
  onGenerateSample,
  onTestWorkflow,
  isTesting,
  workflowId,
}: LeftSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Step Selector */}
      <StepSelector onAddStep={onAddStep} />
      
      {/* Test Payload */}
      <TestPayloadPanel
        testPayload={testPayload}
        onTestPayloadChange={onTestPayloadChange}
        onGenerateSample={onGenerateSample}
        onTestWorkflow={onTestWorkflow}
        isTesting={isTesting}
        workflowId={workflowId}
      />

      {/* Selected Step Debug */}
      <StepDebugPanel selectedStep={selectedStep} />

      {/* Triggers Section - Placeholder for future */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Triggers
        </h3>
        <button className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
          + Add Trigger
        </button>
      </div>
    </div>
  );
}
