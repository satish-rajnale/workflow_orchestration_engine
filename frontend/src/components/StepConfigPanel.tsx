import React from 'react';
import { Node } from 'reactflow';

interface StepConfigPanelProps {
  selectedStep: Node | null;
  onStepNameChange: (stepId: string, newName: string) => void;
  onStepActionChange: (stepId: string, newAction: string) => void;
  onStepParamsUpdate: (stepId: string, params: any) => void;
}

export default function StepConfigPanel({
  selectedStep,
  onStepNameChange,
  onStepActionChange,
  onStepParamsUpdate,
}: StepConfigPanelProps) {
  if (!selectedStep) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p>Select a step to configure</p>
        </div>
      </div>
    );
  }

  const currentAction = selectedStep.data.step?.action || selectedStep.data.action;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Step Configuration
        </h3>
        <div className="space-y-4">
          {/* Step ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Step ID
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={selectedStep.data.label || selectedStep.id}
              onChange={(e) => onStepNameChange(selectedStep.id, e.target.value)}
            />
          </div>

          {/* Action Type Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={currentAction}
              onChange={(e) => onStepActionChange(selectedStep.id, e.target.value)}
            >
              <option value="start">Start</option>
              <option value="delay">Delay</option>
              <option value="notify">Notify</option>
              <option value="http_request">HTTP Request</option>
              <option value="branch">Branch</option>
              <option value="email">Email</option>
              <option value="check_ticket_assigned">Check Ticket</option>
            </select>
          </div>

          {/* Step-specific configuration */}
          {currentAction === "delay" && (
            <DelayConfig 
              step={selectedStep} 
              onParamsUpdate={onStepParamsUpdate} 
            />
          )}

          {currentAction === "email" && (
            <EmailConfig 
              step={selectedStep} 
              onParamsUpdate={onStepParamsUpdate} 
            />
          )}

          {currentAction === "http_request" && (
            <HttpRequestConfig 
              step={selectedStep} 
              onParamsUpdate={onStepParamsUpdate} 
            />
          )}

          {currentAction === "notify" && (
            <NotifyConfig 
              step={selectedStep} 
              onParamsUpdate={onStepParamsUpdate} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Individual configuration components
function DelayConfig({ step, onParamsUpdate }: { step: Node; onParamsUpdate: (stepId: string, params: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Delay (seconds)
        </label>
        <input
          type="number"
          min="1"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.seconds || 5}
          onChange={(e) => {
            const seconds = parseInt(e.target.value) || 5;
            onParamsUpdate(step.id, { seconds });
          }}
        />
      </div>
      <div className="text-xs text-gray-500">
        This step will pause the workflow execution for the specified number of seconds
      </div>
    </div>
  );
}

function EmailConfig({ step, onParamsUpdate }: { step: Node; onParamsUpdate: (stepId: string, params: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          To Email
        </label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.to || ""}
          onChange={(e) => onParamsUpdate(step.id, { to: e.target.value })}
          placeholder="Enter email address"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Subject
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.subject || ""}
          onChange={(e) => onParamsUpdate(step.id, { subject: e.target.value })}
          placeholder="Enter email subject"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Body
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.body || ""}
          onChange={(e) => onParamsUpdate(step.id, { body: e.target.value })}
          placeholder="Enter email body"
          rows={4}
        />
      </div>
      <div className="text-xs text-gray-500">
        This step will send an email to the specified address
      </div>
    </div>
  );
}

function HttpRequestConfig({ step, onParamsUpdate }: { step: Node; onParamsUpdate: (stepId: string, params: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Method
        </label>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.method || "GET"}
          onChange={(e) => onParamsUpdate(step.id, { method: e.target.value })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          URL
        </label>
        <input
          type="url"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.url || ""}
          onChange={(e) => onParamsUpdate(step.id, { url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Headers (JSON)
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          value={JSON.stringify(step.data.step?.params?.headers || {}, null, 2)}
          onChange={(e) => {
            try {
              const headers = JSON.parse(e.target.value);
              onParamsUpdate(step.id, { headers });
            } catch {}
          }}
          placeholder='{"Content-Type": "application/json"}'
          rows={3}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Body (JSON)
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          value={JSON.stringify(step.data.step?.params?.body || {}, null, 2)}
          onChange={(e) => {
            try {
              const body = JSON.parse(e.target.value);
              onParamsUpdate(step.id, { body });
            } catch {}
          }}
          placeholder='{"key": "value"}'
          rows={3}
        />
      </div>
      <div className="text-xs text-gray-500">
        This step will make an HTTP request to the specified URL
      </div>
    </div>
  );
}

function NotifyConfig({ step, onParamsUpdate }: { step: Node; onParamsUpdate: (stepId: string, params: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={step.data.step?.params?.message || ""}
          onChange={(e) => onParamsUpdate(step.id, { message: e.target.value })}
          placeholder="Enter notification message"
          rows={3}
        />
      </div>
      <div className="text-xs text-gray-500">
        This step will log a notification message during workflow execution
      </div>
    </div>
  );
}
