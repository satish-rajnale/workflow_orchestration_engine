import React, { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  type Node,
} from "@xyflow/react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "@xyflow/react/dist/style.css";
import { useWorkflowExecution } from "../hooks/useWorkflowExecution";
import { eventBus } from "../services/eventBus";
import ErrorBoundary from "../components/ErrorBoundary";

export default function Builder() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [showTriggerEditor, setShowTriggerEditor] = useState(false);
  const [triggerEvent, setTriggerEvent] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("{}");
  const [showDelayConfig, setShowDelayConfig] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [showHttpConfig, setShowHttpConfig] = useState(false);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showEdgeEditor, setShowEdgeEditor] = useState(false);
  const [testPayload, setTestPayload] = useState("{}");
  const [isTesting, setIsTesting] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const workflowId = params.id;
  const [name, setName] = useState("New Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
          data: {
            label: `${n.action}`,
            node: n,
            type: n.type || "action",
          },
          position: n.position || { x: 100, y: 100 },
          style: {
            background:
              n.type === "start"
                ? "#10b981"
                : n.type === "branch"
                ? "#f59e0b"
                : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
          },
        }))
      );
      setEdges(
        (def.edges || []).map((e: any) => ({
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
        }))
      );
    })();
  }, [workflowId]);

  const onConnect = (connection: any) =>
    setEdges((eds) => addEdge(connection, eds));

  const save = async () => {
    const definition = {
      triggers: triggers,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type || "action",
        action: n.data?.node?.action || n.data?.label || "notify",
        params: n.data?.node?.params || {},
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
            data: {
              label: `${n.action}`,
              node: n,
              type: n.type || "action",
            },
            position: n.position || { x: 100, y: 100 },
            style: {
              background:
                n.type === "start"
                  ? "#10b981"
                  : n.type === "branch"
                  ? "#f59e0b"
                  : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
            },
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

  const addActionNode = (action: string) => {
    const id = `${Date.now()}`;
    const newNode = {
      id,
      data: {
        label: action,
        node: { id, type: "action", action, params: {} },
        type: "action",
      },
      position: { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 },
      style: {
        background:
          action === "start"
            ? "#10b981"
            : action === "branch"
            ? "#f59e0b"
            : "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "8px 12px",
      },
    };
    setNodes((ns) => [...ns, newNode]);
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
      <div className="space-y-12">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Workflow, Sample Workflows, and Test Payload */}
          <div className="col-span-3 space-y-3">
            <div className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2">Workflow</div>
              <input
                className="w-full border p-2 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={save}
                >
                  Save
                </button>
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={run}
                  disabled={!workflowId}
                >
                  Run
                </button>
                <button
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                  onClick={async () => {
                    try {
                      await api.post("/workflows/tickets", {
                        title: "Test Support Ticket",
                        description:
                          "This is a test ticket to trigger workflows",
                      });
                      setMessage("Test ticket created!");
                      setTimeout(() => setMessage(null), 2000);
                    } catch (e) {
                      setMessage("Failed to create test ticket");
                      setTimeout(() => setMessage(null), 2000);
                    }
                  }}
                >
                  Create Test Ticket
                </button>
              </div>
              {message && (
                <div className="text-sm text-green-700 mt-2">{message}</div>
              )}
            </div>

            <div className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2">Sample Workflows</div>
              <div className="space-y-2">
                <button
                  className="w-full px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                  onClick={() => loadSample("Lead Nurture")}
                >
                  Load Lead Nurture
                </button>
                <button
                  className="w-full px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                  onClick={() => loadSample("Temperature Control")}
                >
                  Load Temperature Control
                </button>
                <button
                  className="w-full px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                  onClick={() => loadSample("Support Ticket Auto-Responder")}
                >
                  Load Support Ticket Auto-Responder
                </button>
              </div>
            </div>

            {/* Test Payload Container */}
            <div className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2">Test Payload</div>
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
                    {isTesting ? "Testing..." : "Test Workflow"}
                  </button>
                </div>
                <textarea
                  className="w-full border p-2 rounded text-xs h-32 font-mono"
                  placeholder="Enter JSON payload for testing..."
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                />
                <div className="text-xs text-gray-500">
                  Use this to test your workflow with custom data
                </div>
              </div>
            </div>
          </div>

          {/* Center - ReactFlow Canvas */}
          <div className="col-span-6 bg-white rounded shadow h-[70vh]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onConnect={onConnect}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={(sel: any) => {
                setSelectedNode(sel.nodes?.[0] || null);
                setSelectedEdge(sel.edges?.[0] || null);
              }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          {/* Right Sidebar - Other Containers */}
          <div className="col-span-3 space-y-3">
            <div className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2">Triggers</div>
              <button
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                onClick={() => setShowTriggerEditor(true)}
              >
                + Add Trigger
              </button>
              {triggers.map((t, i) => (
                <div
                  key={i}
                  className="mt-2 p-2 bg-gray-50 rounded text-xs relative"
                >
                  <button
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                    onClick={() =>
                      setTriggers(triggers.filter((_, index) => index !== i))
                    }
                  >
                    ×
                  </button>
                  Event: {t.event}
                  <br />
                  Condition: {JSON.stringify(t.condition)}
                </div>
              ))}
            </div>
            <div className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2">Add node</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("start")}
                >
                  Start
                </button>
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("delay")}
                >
                  Delay
                </button>
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("notify")}
                >
                  Notify
                </button>
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("http_request")}
                >
                  HTTP
                </button>
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("branch")}
                >
                  Branch
                </button>
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("email")}
                >
                  Email
                </button>
                <button
                  className="px-2 py-1 bg-gray-100 rounded"
                  onClick={() => addActionNode("check_ticket_assigned")}
                >
                  Check Ticket
                </button>
              </div>
            </div>
            {selectedNode && (
              <div className="bg-white rounded shadow p-3">
                <div className="font-semibold">Node config</div>
                <div className="text-sm text-gray-600">
                  id: {selectedNode.id}
                </div>
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs text-gray-600">Action</label>
                    <input
                      className="w-full border p-2 rounded text-sm"
                      value={
                        selectedNode.data?.node?.action ||
                        selectedNode.data?.label
                      }
                      onChange={(e) =>
                        // @ts-ignore
                        setNodes((ns) =>
                          ns.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  data: {
                                    ...n.data,
                                    node: {
                                      ...n.data?.node,
                                      action: e.target.value,
                                    },
                                  },
                                }
                              : n
                          )
                        )
                      }
                    />
                  </div>

                  {/* Delay Node Configuration */}
                  {selectedNode.data?.node?.action === "delay" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          Delay (minutes)
                        </label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded text-sm"
                          value={Math.round(
                            (selectedNode.data?.node?.params?.seconds || 0) / 60
                          )}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 0;
                            const seconds = minutes * 60;
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            seconds,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Node Configuration */}
                  {selectedNode.data?.node?.action === "email" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          To Email
                        </label>
                        <input
                          className="w-full border p-2 rounded text-sm"
                          value={selectedNode.data?.node?.params?.to || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            to: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          From Email (Optional)
                        </label>
                        <input
                          className="w-full border p-2 rounded text-sm"
                          value={selectedNode.data?.node?.params?.from || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            from: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Template
                        </label>
                        <select
                          className="w-full border p-2 rounded text-sm"
                          value={
                            selectedNode.data?.node?.params?.template || ""
                          }
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            template: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        >
                          <option value="">Select template</option>
                          <option value="ack_ticket">
                            Ticket Acknowledgment
                          </option>
                          <option value="escalate_ticket">
                            Ticket Escalation
                          </option>
                          <option value="custom">Custom Template</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Subject</label>
                        <input
                          className="w-full border p-2 rounded text-sm"
                          value={selectedNode.data?.node?.params?.subject || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            subject: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Message Body
                        </label>
                        <textarea
                          className="w-full border p-2 rounded text-sm h-20"
                          value={selectedNode.data?.node?.params?.body || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            body: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                          placeholder="Enter custom message body or use template variables like {{ticket.title}}, {{user.name}}"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          CC (comma separated)
                        </label>
                        <input
                          className="w-full border p-2 rounded text-sm"
                          value={selectedNode.data?.node?.params?.cc || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            cc: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* HTTP Request Node Configuration */}
                  {selectedNode.data?.node?.action === "http_request" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600">URL</label>
                        <input
                          className="w-full border p-2 rounded text-sm"
                          value={selectedNode.data?.node?.params?.url || ""}
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
                                            url: e.target.value,
                                          },
                                        },
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Method</label>
                        <select
                          className="w-full border p-2 rounded text-sm"
                          value={
                            selectedNode.data?.node?.params?.method || "GET"
                          }
                          onChange={(e) =>
                            setNodes((ns) =>
                              ns.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        node: {
                                          ...n.data?.node,
                                          params: {
                                            ...n.data?.node?.params,
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
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Headers (JSON)
                        </label>
                        <textarea
                          className="w-full border p-2 rounded text-xs h-16"
                          value={JSON.stringify(
                            selectedNode.data?.node?.params?.headers || {},
                            null,
                            2
                          )}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value);
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedNode.id
                                    ? {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          node: {
                                            ...n.data?.node,
                                            params: {
                                              ...n.data?.node?.params,
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
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Body (JSON)
                        </label>
                        <textarea
                          className="w-full border p-2 rounded text-xs h-16"
                          value={JSON.stringify(
                            selectedNode.data?.node?.params?.body || {},
                            null,
                            2
                          )}
                          onChange={(e) => {
                            try {
                              const body = JSON.parse(e.target.value);
                              setNodes((ns) =>
                                ns.map((n) =>
                                  n.id === selectedNode.id
                                    ? {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          node: {
                                            ...n.data?.node,
                                            params: {
                                              ...n.data?.node?.params,
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
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-600">Retries</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded text-sm"
                      value={selectedNode.data?.node?.retries || 0}
                      onChange={(e) =>
                        setNodes((ns) =>
                          ns.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  data: {
                                    ...n.data,
                                    node: {
                                      ...n.data?.node,
                                      retries: parseInt(e.target.value) || 0,
                                    },
                                  },
                                }
                              : n
                          )
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            {selectedEdge && (
              <div className="bg-white rounded shadow p-3">
                <div className="font-semibold">Edge Condition</div>
                <div className="text-sm text-gray-600">
                  From {selectedEdge.source} to {selectedEdge.target}
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-600">
                    Condition (JSON)
                  </label>
                  <textarea
                    className="w-full border p-2 rounded text-xs h-20"
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
            )}

            {/* <div className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2">Live logs</div>
              <div className="h-40 overflow-auto text-xs font-mono">
                {logs.map((l, i) => (
                  <div key={i}>{JSON.stringify(l)}</div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
        {/* Live Logs - Horizontal Layout */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">Live Execution Logs</div>
            <button
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              onClick={() => setLogs([])}
            >
              Clear Logs
            </button>
          </div>
          <div
            className="h-32 overflow-auto text-xs font-mono bg-gray-50 p-3 rounded border"
            ref={(el) => {
              if (el && logs.length > 0) {
                el.scrollTop = el.scrollHeight;
              }
            }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-500">
                No execution logs yet. Run a workflow to see live updates.
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((l, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="text-gray-400">
                      [
                      {l.timestamp
                        ? new Date(l.timestamp).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                      ]
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        l.status === "error"
                          ? "bg-red-100 text-red-800"
                          : l.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : l.status === "retry"
                          ? "bg-yellow-100 text-yellow-800"
                          : l.type === "execution_started"
                          ? "bg-purple-100 text-purple-800"
                          : l.type === "execution_finished"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {l.status || l.type || "log"}
                    </span>
                    <span className="text-gray-700">
                      {l.node_id && `Node: ${l.node_id}`}
                      {l.message && ` - ${l.message}`}
                      {l.execution_id && ` (Exec: ${l.execution_id})`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    </ErrorBoundary>
  );
}
