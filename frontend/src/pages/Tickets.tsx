import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ErrorBoundary from "../components/ErrorBoundary";

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to: number | null;
  created_at: string;
}

function TicketsContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/workflows/tickets");
      setTickets(res.data);
    } catch (e: any) {
      console.error("Failed to load tickets:", e);
      setError(
        e?.response?.data?.detail || "Failed to load tickets. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      await api.post("/workflows/tickets", newTicket);
      setNewTicket({ title: "", description: "" });
      await loadTickets();
    } catch (e: any) {
      console.error("Failed to create ticket:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to create ticket. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <Link to="/" className="text-blue-600">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Link to="/" className="text-blue-600">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Form */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Ticket</h2>
        <form onSubmit={createTicket} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full border p-2 rounded"
              value={newTicket.title}
              onChange={(e) =>
                setNewTicket({ ...newTicket, title: e.target.value })
              }
              required
              disabled={creating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full border p-2 rounded h-20"
              value={newTicket.description}
              onChange={(e) =>
                setNewTicket({ ...newTicket, description: e.target.value })
              }
              required
              disabled={creating}
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded transition-colors ${
              creating
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Ticket"}
          </button>
        </form>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            All Tickets ({tickets.length})
          </h2>
        </div>
        <div className="divide-y">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tickets
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new support ticket.
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {ticket.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ticket.status === "open"
                            ? "bg-yellow-100 text-yellow-800"
                            : ticket.status === "assigned"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created:{" "}
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {ticket.assigned_to && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      Assigned
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Tickets() {
  return (
    <ErrorBoundary>
      <TicketsContent />
    </ErrorBoundary>
  );
}
