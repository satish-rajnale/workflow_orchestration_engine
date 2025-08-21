import React, { useState, useEffect } from "react";
import api from "../services/api";

interface EmailStatusProps {
  emailId?: string;
  executionId?: string;
}

interface EmailData {
  id: string;
  to: string;
  subject: string;
  status: "pending" | "sent" | "failed";
  timestamp: string;
  sent_at?: string;
  error?: string;
  execution_id?: string;
  step_id?: string;
}

export default function EmailStatus({
  emailId,
  executionId,
}: EmailStatusProps) {
  const [emailStatus, setEmailStatus] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEmailStatus = async () => {
    if (!emailId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/emails/${emailId}/status`);
      setEmailStatus(response.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to check email status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailId) {
      checkEmailStatus();
      // Poll for status updates every 5 seconds
      const interval = setInterval(checkEmailStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [emailId]);

  if (!emailId) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "failed":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "pending":
        return (
          <svg
            className="w-4 h-4"
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
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Email Status</h3>
        <button
          onClick={checkEmailStatus}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {error && <div className="text-xs text-red-600 mb-3">{error}</div>}

      {emailStatus ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(emailStatus.status)}
            <span
              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                emailStatus.status
              )}`}
            >
              {emailStatus.status.toUpperCase()}
            </span>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <strong>To:</strong> {emailStatus.to}
            </div>
            <div>
              <strong>Subject:</strong> {emailStatus.subject}
            </div>
            <div>
              <strong>Email ID:</strong> {emailStatus.id}
            </div>
            {emailStatus.execution_id && (
              <div>
                <strong>Execution ID:</strong> {emailStatus.execution_id}
              </div>
            )}
            {emailStatus.step_id && (
              <div>
                <strong>Step ID:</strong> {emailStatus.step_id}
              </div>
            )}
            <div>
              <strong>Timestamp:</strong>{" "}
              {new Date(emailStatus.timestamp).toLocaleString()}
            </div>
            {emailStatus.sent_at && (
              <div>
                <strong>Sent At:</strong>{" "}
                {new Date(emailStatus.sent_at).toLocaleString()}
              </div>
            )}
            {emailStatus.error && (
              <div>
                <strong>Error:</strong> {emailStatus.error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          {loading ? "Loading email status..." : "No email status available"}
        </div>
      )}
    </div>
  );
}
