import React, { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  type Node,
  Handle,
  Position,
} from "@xyflow/react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "@xyflow/react/dist/style.css";
import { useWorkflowExecution } from "../hooks/useWorkflowExecution";
import { eventBus } from "../services/eventBus";
import ErrorBoundary from "../components/ErrorBoundary";
import EmailStatus from "../components/EmailStatus";
import JobStatus from "../components/JobStatus";
import useAuth from "../store/auth";
import WorkflowHeader from "../components/WorkflowHeader";
import LeftSidebar from "../components/LeftSidebar";
import StepConfigPanel from "../components/StepConfigPanel";

// Custom Node Component with Icons
const CustomNode = ({ data }: { data: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [stepName, setStepName] = useState(
    data.label || data.step?.id || "New Step"
  );

  const getIcon = (action: string) => {
    switch (action) {
      case "start":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "delay":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "notify":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 004 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-1.81 1.19z"
            />
          </svg>
        );
      case "http_request":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "branch":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "email":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "check_ticket_assigned":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        );
    }
  };

  const getStepColor = (action: string) => {
    switch (action) {
      case "start":
        return "bg-green-500";
      case "delay":
        return "bg-yellow-500";
      case "notify":
        return "bg-blue-500";
      case "http_request":
        return "bg-purple-500";
      case "branch":
        return "bg-orange-500";
      case "email":
        return "bg-indigo-500";
      case "check_ticket_assigned":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleNameChange = (newName: string) => {
    setStepName(newName);
    console.log("handleNameChange", data.id, newName);
    data.onStepNameChange?.(data.id, newName);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`p-2 rounded-lg ${getStepColor(
              data.step?.action || data.action
            )} text-white`}
          >
            {getIcon(data.step?.action || data.action)}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                onBlur={() => handleNameChange(stepName)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleNameChange(stepName)
                }
                className="w-full text-sm font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <div
                className="text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                onClick={() => setIsEditing(true)}
              >
                {stepName}
              </div>
            )}
            <div className="text-xs text-gray-500 capitalize">
              {data.step?.action?.replace(/_/g, " ") ||
                data.action?.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        {data.step?.params && Object.keys(data.step.params).length > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            {Object.entries(data.step.params).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="truncate ml-2">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function Builder() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [showTriggerEditor, setShowTriggerEditor] = useState(false);
  const [triggerEvent, setTriggerEvent] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("{}");
  const [showDelayConfig, setShowDelayConfig] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [showHttpConfig, setShowHttpConfig] = useState(false);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [showEdgeEditor, setShowEdgeEditor] = useState(false);
  const [testPayload, setTestPayload] = useState("{}");
  const [isTesting, setIsTesting] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const workflowId = params.id;
  const [name, setName] = useState("New Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStep, setSelectedStep] = useState<Node | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuth();

  console.log("user", user);

  useEffect(() => {
    if (!workflowId) return;
    (async () => {
      const res = await api.get(`/workflows/${workflowId}`);
      console.log("ewdass", res.data);
      setName(res.data.name);
      const def = res.data.definition;
      setTriggers(def.triggers || []);
      setNodes(
        (def.nodes || []).map((n: any) => ({
          id: n.id,
          type: "custom",
          data: {
            label: n.id,
            step: n,
            action: n.action,
            onStepNameChange: handleStepNameChange,
          },
          position: n.position || { x: 100, y: 100 },
        }))
      );
      setEdges(
        (def.edges || []).map((e: any) => ({
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          data: { condition: e.condition },
        }))
      );
    })();
  }, [workflowId]);

  const handleStepNameChange = (stepId: string, newName: string) => {
    setNodes((ns: any) =>
      (ns as any[]).map((n: any) =>
        n.id === stepId
          ? {
              ...n,
              data: {
                ...n.data,
                label: newName,
                step: {
                  ...n.data.step,
                  id: newName,
                },
              },
            }
          : n
      )
    );
  };

  const updateStepParams = (stepId: string, params: any) => {
    console.log("updateStepParams", stepId, params);
    setNodes((ns: any) =>
      (ns as any[]).map((n: any) =>
        n.id === stepId
          ? {
              ...n,
              data: {
                ...n.data,
                step: {
                  ...n.data.step,
                  params: {
                    ...n.data.step?.params,
                    ...params,
                  },
                },
              },
            }
          : n
      )
    );
  };

  const onConnect = (connection: any) =>
    setEdges((eds) => addEdge(connection, eds));

  const save = async () => {
    const definition = {
      triggers: triggers,
      nodes: nodes.map((n) => ({
        id: n.data.label || n.id,
        type: n.data.step?.type || "action",
        action: n.data.step?.action || n.data.action || "notify",
        params: n.data.step?.params || {},
        position: n.position,
      })),
      edges: edges.map((e) => ({
        source: e.source as string,
        target: e.target as string,
        condition: e.data?.condition,
      })),
    };
    if (workflowId) {
      await api.put(`/workflows/${workflowId}`, { name, definition });
    } else {
      const res = await api.post("/workflows", { name, definition });
      navigate(`/builder/${res.data.id}`);
    }
    setMessage("Saved!");
    setTimeout(() => setMessage(null), 1500);
  };

  const run = async () => {
    if (!workflowId) return;
    await api.post(`/workflows/${workflowId}/run`);
    setMessage("Execution started");
    setTimeout(() => setMessage(null), 1500);
    eventBus.publish("notification", {
      type: "info",
      message: `Workflow execution started for ${name}`,
      duration: 3000,
    });

    // Trigger a refresh of job status after a short delay
    // setTimeout(() => {
    //   eventBus.publish("refresh-jobs", { workflowId });
    // }, 1000);
  };

  const testWorkflow = async () => {
    if (!workflowId) return;
    try {
      setIsTesting(true);
      const payload = JSON.parse(testPayload || "{}");
      await api.post(`/workflows/${workflowId}/test`, { payload });
      setMessage("Test execution started with custom payload!");
      setTimeout(() => setMessage(null), 2000);
      eventBus.publish("notification", {
        type: "info",
        message: `Workflow test started with custom payload`,
        duration: 3000,
      });
    } catch (e: any) {
      setMessage("Invalid JSON payload or test failed");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setIsTesting(false);
    }
  };

  // attach websocket for live updates
  const [logs, setLogs] = React.useState<any[]>([]);
  const wsRef = (require("../hooks/useExecutionWS").default as any)(
    workflowId ? Number(workflowId) : undefined,
    (evt: any) => setLogs((ls) => [...ls, evt])
  );

  const loadSample = async (sampleName: string) => {
    try {
      const res = await api.get("/workflows/samples");
      const sample = res.data.find((s: any) => s.name === sampleName);
      if (sample) {
        setName(sample.name);
        setTriggers(sample.definition.triggers || []);
        setNodes(
          (sample.definition.nodes || []).map((n: any) => ({
            id: n.id,
            type: "custom",
            data: {
              label: n.id,
              step: n,
              action: n.action,
              onStepNameChange: handleStepNameChange,
            },
            position: n.position || { x: 100, y: 100 },
          }))
        );
        setEdges(
          (sample.definition.edges || []).map((e: any) => ({
            id: `${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            data: { condition: e.condition },
          }))
        );
        setMessage("Sample loaded!");
        setTimeout(() => setMessage(null), 1500);
      }
    } catch (e) {
      setMessage("Failed to load sample");
      console.error("Sample load error", e);
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const addStep = (action: string) => {
    const id = `step_${Date.now()}`;
    const newStep = {
      id,
      type: "custom",
      data: {
        label: id,
        step: { id, type: "action", action, params: {} },
        action: action,
        onStepNameChange: handleStepNameChange,
      },
      position: { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 },
    };
    setNodes((ns) => [...ns, newStep]);
  };

  const generateSamplePayload = () => {
    const samplePayload = {
      ticket: {
        id: 123,
        title: "Sample Support Ticket",
        description: "This is a sample ticket for testing",
        status: "open",
        assigned_to: null,
        created_at: new Date().toISOString(),
        priority: "medium",
        category: "technical",
      },
      user: {
        id: 456,
        name: "John Doe",
        email: "john@example.com",
        role: "customer",
      },
      metadata: {
        source: "web",
        browser: "Chrome",
        ip_address: "192.168.1.1",
      },
    };
    setTestPayload(JSON.stringify(samplePayload, null, 2));
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Workflow Builder
              </h1>
              <input
                className="text-lg font-medium border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workflow name"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={save}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={run}
                disabled={!workflowId}
              >
                Run Workflow
              </button>
              {workflowId && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this workflow? This action cannot be undone."
                      )
                    ) {
                      try {
                        await api.delete(`/workflows/${workflowId}`);
                        setMessage("Workflow deleted successfully!");
                        setTimeout(() => {
                          navigate("/");
                        }, 1500);
                      } catch (e: any) {
                        setMessage("Failed to delete workflow");
                        setTimeout(() => setMessage(null), 2000);
                      }
                    }
                  }}
                >
                  Delete Workflow
                </button>
              )}
            </div>
          </div>
          {message && (
            <div className="mt-2 text-sm text-green-600">{message}</div>
          )}
        </div>

        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Sample Workflows */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Sample Workflows
              </h3>
              <div className="space-y-2">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => loadSample("Lead Nurture")}
                >
                  Lead Nurture
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => loadSample("Temperature Control")}
                >
                  Temperature Control
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => loadSample("Support Ticket Auto-Responder")}
                >
                  Support Ticket Auto-Responder
                </button>
              </div>
            </div>

            {/* Add Steps */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Add Steps
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("start")}
                >
                  Start
                </button>
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("delay")}
                >
                  Delay
                </button>
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("notify")}
                >
                  Notify
                </button>
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("http_request")}
                >
                  HTTP Request
                </button>
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("branch")}
                >
                  Branch
                </button>
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("email")}
                >
                  Email
                </button>
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => addStep("check_ticket_assigned")}
                >
                  Check Ticket
                </button>
              </div>
            </div>

            {/* Test Payload */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Test Payload
              </h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    onClick={generateSamplePayload}
                  >
                    Generate Sample
                  </button>
                  <button
                    className={`px-2 py-1 rounded text-xs ${
                      isTesting
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                    onClick={testWorkflow}
                    disabled={isTesting || !workflowId}
                  >
                    {isTesting ? "Testing..." : "Test"}
                  </button>
                </div>
                <textarea
                  className="w-full border p-2 rounded text-xs h-24 font-mono"
                  placeholder="Enter JSON payload for testing..."
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                />
              </div>
            </div>

            {/* Selected Step Debug */}
            {selectedStep && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Selected Step Data
                </h3>
                <div className="text-xs font-mono bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                  <pre>{JSON.stringify(selectedStep.data, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Triggers */}
            <div className="p-4 flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Triggers
              </h3>
              <button
                className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                onClick={() => setShowTriggerEditor(true)}
              >
                + Add Trigger
              </button>
              <div className="mt-3 space-y-2">
                {triggers.map((t, i) => (
                  <div
                    key={i}
                    className="p-2 bg-gray-50 rounded text-xs relative"
                  >
                    <button
                      className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                      onClick={() =>
                        setTriggers(triggers.filter((_, index) => index !== i))
                      }
                    >
                      ×
                    </button>
                    <div className="font-medium">{t.event}</div>
                    <div className="text-gray-600">
                      {JSON.stringify(t.condition)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onConnect={onConnect}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={(sel: any) => {
                setSelectedStep(sel.nodes?.[0] || null);
                setSelectedEdge(sel.edges?.[0] || null);
              }}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            {selectedStep ? (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Step Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Step ID
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={selectedStep.data.label || selectedStep.id}
                      onChange={(e) =>
                        handleStepNameChange(selectedStep.id, e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={
                        selectedStep.data.step?.action ||
                        selectedStep.data.action
                      }
                      onChange={(e) => {
                        setNodes((ns) =>
                          ns.map((n) =>
                            n.id === selectedStep.id
                              ? {
                                  ...n,
                                  data: {
                                    ...n.data,
                                    step: {
                                      ...n.data.step,
                                      action: e.target.value,
                                    },
                                    action: e.target.value,
                                  },
                                }
                              : n
                          )
                        );
                      }}
                    >
                      <option value="start">Start</option>
                      <option value="delay">Delay</option>
                      <option value="notify">Notify</option>
                      <option value="http_request">HTTP Request</option>
                      <option value="branch">Branch</option>
                      <option value="email">Email</option>
                      <option value="check_ticket_assigned">
                        Check Ticket
                      </option>
                    </select>
                  </div>
                  ;{/* Step-specific configuration */}
                  {(selectedStep.data.step?.action ||
                    selectedStep.data.action) === "delay" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Delay (seconds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedStep.data.step?.params?.seconds || 5}
                          onChange={(e) => {
                            const seconds = parseInt(e.target.value) || 5;
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedStep.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        step: {
                                          ...n.data.step,
                                          params: {
                                            ...n.data.step?.params,
                                            seconds,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                          placeholder="5"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Delay execution for the specified number of seconds
                      </div>
                    </div>
                  ) : null}
                  {(selectedStep.data.step?.action ||
                    selectedStep.data.action) === "email" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          To Email
                        </label>
                        <input
                          type="email"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedStep.data.step?.params?.to || ""}
                          onChange={(e) =>
                            updateStepParams(selectedStep.id, {
                              to: e.target.value,
                            })
                          }
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
                          value={selectedStep.data.step?.params?.subject || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedStep.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        step: {
                                          ...n.data.step,
                                          params: {
                                            ...n.data.step?.params,
                                            subject: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                          placeholder="Enter email subject"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Body
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedStep.data.step?.params?.body || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedStep.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        step: {
                                          ...n.data.step,
                                          params: {
                                            ...n.data.step?.params,
                                            body: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                          placeholder="Enter email body"
                          rows={3}
                        />
                      </div>

                      {/* Email Status Component */}
                      <EmailStatus
                        emailId={selectedStep.data.step?.params?.last_email_id}
                        executionId={
                          selectedStep.data.step?.params?.execution_id
                        }
                      />
                    </div>
                  )}
                  {(selectedStep.data.step?.action ||
                    selectedStep.data.action) === "http_request" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Method
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={
                            selectedStep.data.step?.params?.method || "GET"
                          }
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedStep.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        step: {
                                          ...n.data.step,
                                          params: {
                                            ...n.data.step?.params,
                                            method: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
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
                          value={selectedStep.data.step?.params?.url || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedStep.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        step: {
                                          ...n.data.step,
                                          params: {
                                            ...n.data.step?.params,
                                            url: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                          placeholder="https://api.example.com/endpoint"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Headers (JSON)
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          value={JSON.stringify(
                            selectedStep.data.step?.params?.headers || {},
                            null,
                            2
                          )}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value);
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedStep.id
                                    ? {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          step: {
                                            ...n.data.step,
                                            params: {
                                              ...n.data.step?.params,
                                              headers,
                                            },
                                          },
                                        },
                                      }
                                    : n
                                )
                              );
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
                          value={JSON.stringify(
                            selectedStep.data.step?.params?.body || {},
                            null,
                            2
                          )}
                          onChange={(e) => {
                            try {
                              const body = JSON.parse(e.target.value);
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedStep.id
                                    ? {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          step: {
                                            ...n.data.step,
                                            params: {
                                              ...n.data.step?.params,
                                              body,
                                            },
                                          },
                                        },
                                      }
                                    : n
                                )
                              );
                            } catch {}
                          }}
                          placeholder='{"key": "value"}'
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  {(selectedStep.data.step?.action ||
                    selectedStep.data.action) === "notify" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedStep.data.step?.params?.message || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedStep.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        step: {
                                          ...n.data.step,
                                          params: {
                                            ...n.data.step?.params,
                                            message: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                          placeholder="Enter notification message"
                          rows={3}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        This step will log a notification message during
                        workflow execution
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedEdge ? (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Edge Condition
                </h3>
                <div className="space-y-3">
                  <div className="text-xs text-gray-600">
                    From {selectedEdge.source} to {selectedEdge.target}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Condition (JSON)
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs h-20 font-mono"
                      value={JSON.stringify(
                        selectedEdge.data?.condition || {},
                        null,
                        2
                      )}
                      onChange={(e) => {
                        try {
                          const condition = JSON.parse(e.target.value);
                          setEdges((es) =>
                            es.map((edge) =>
                              edge.id === selectedEdge.id
                                ? { ...edge, data: { ...edge.data, condition } }
                                : edge
                            )
                          );
                        } catch {}
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Workflow Status
                </h3>

                <div className="mt-4 text-center text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm">
                    Select a step or connection to configure
                  </p>
                </div>
                {/* Job Status Component */}
                <JobStatus
                  workflowId={workflowId ? parseInt(workflowId) : undefined}
                  userId={user?.id?.toString()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Logs */}
        <div className="h-48 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Execution Logs
            </h3>
            <button
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              onClick={() => setLogs([])}
            >
              Clear
            </button>
          </div>
          <div className="h-32 overflow-auto p-4">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                No execution logs yet. Run a workflow to see live updates.
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((l, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-400">
                      [
                      {l.timestamp
                        ? new Date(l.timestamp).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                      ]
                    </span>
                    <span
                      className={`px-2 py-1 rounded ${
                        l.status === "error"
                          ? "bg-red-100 text-red-800"
                          : l.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {l.status || l.type || "log"}
                    </span>
                    <span className="text-gray-700">
                      {l.node_id && `Step: ${l.node_id}`}
                      {l.message && ` - ${l.message}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trigger Editor Modal */}
        {showTriggerEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Trigger</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Event</label>
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="e.g., ticket.created"
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Condition (JSON)
                  </label>
                  <textarea
                    className="w-full border p-2 rounded h-20 text-xs"
                    placeholder='{"op": "eq", "path": "ticket_assigned", "value": false}'
                    value={triggerCondition}
                    onChange={(e) => setTriggerCondition(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => {
                      try {
                        const condition = JSON.parse(triggerCondition || "{}");
                        const newTrigger = {
                          event: triggerEvent,
                          condition: condition,
                        };
                        setTriggers([...triggers, newTrigger]);
                        setTriggerEvent("");
                        setTriggerCondition("{}");
                        setShowTriggerEditor(false);
                      } catch (e) {
                        alert("Invalid JSON condition");
                      }
                    }}
                  >
                    Add
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                    onClick={() => {
                      setTriggerEvent("");
                      setTriggerCondition("{}");
                      setShowTriggerEditor(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
