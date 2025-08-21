import React from 'react';

interface TestPayloadPanelProps {
  testPayload: string;
  onTestPayloadChange: (payload: string) => void;
  onGenerateSample: () => void;
  onTestWorkflow: () => void;
  isTesting: boolean;
  workflowId: string | undefined;
}

export default function TestPayloadPanel({
  testPayload,
  onTestPayloadChange,
  onGenerateSample,
  onTestWorkflow,
  isTesting,
  workflowId,
}: TestPayloadPanelProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Test Payload
      </h3>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
            onClick={onGenerateSample}
          >
            Generate Sample
          </button>
          <button
            className={`px-2 py-1 rounded text-xs ${
              isTesting
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            onClick={onTestWorkflow}
            disabled={isTesting || !workflowId}
          >
            {isTesting ? "Testing..." : "Test"}
          </button>
        </div>
        <textarea
          className="w-full border p-2 rounded text-xs h-24 font-mono"
          placeholder="Enter JSON payload for testing..."
          value={testPayload}
          onChange={(e) => onTestPayloadChange(e.target.value)}
        />
      </div>
    </div>
  );
}
