import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { realtimeService } from "../services/realtime";
import { eventBus } from "../services/eventBus";

interface JobStatusProps {
  jobId?: string;
  workflowId?: string;
  userId?: string;
}

interface JobData {
  job_id: string;
  job_type: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  scheduled_at: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  cancelled_at?: string;
  error?: string;
  result?: any;
  workflow_id?: string; // Add this field for filtering
  updated_at?: string;
}

export default function JobStatus({
  jobId,
  workflowId,
  userId,
}: JobStatusProps) {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeInitialized, setRealtimeInitialized] = useState(false);

  // Helper function to sort jobs by creation time (latest first)
  const sortJobsByCreationTime = useCallback((jobs: JobData[]): JobData[] => {
    return jobs.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeB - timeA;
    });
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (jobId) {
        response = await api.get(`/jobs/${jobId}`);
        // Ensure the job has job_id field
        const jobData = response.data;
        if (jobData && !jobData.job_id && jobData.id) {
          jobData.job_id = jobData.id;
        }
        setJobs([jobData]);
      } else if (workflowId) {
        // Get all jobs and filter by workflow
        response = await api.get("/jobs");
        const allJobs = response.data;
        const workflowJobs = allJobs
          .filter((job: any) => String(job.workflow_id) === String(workflowId))
          .map((job: any) => {
            // Ensure each job has job_id field
            if (!job.job_id && job.id) {
              job.job_id = job.id;
            }
            return job;
          });
        setJobs(sortJobsByCreationTime(workflowJobs));
      } else {
        // Get active jobs
        response = await api.get("/jobs/active");
        const activeJobs = response.data.map((job: any) => {
          // Ensure each job has job_id field
          if (!job.job_id && job.id) {
            job.job_id = job.id;
          }
          return job;
        });
        setJobs(sortJobsByCreationTime(activeJobs));
      }
    } catch (e: any) {
      console.error("JobStatus loadJobs error:", e);
      setError(e?.response?.data?.detail || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [jobId, workflowId, sortJobsByCreationTime]);

  const cancelJob = async (jobId: string) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      await loadJobs(); // Reload jobs
    } catch (e: any) {
      console.error("JobStatus cancelJob error:", e);
      setError(e?.response?.data?.detail || "Failed to cancel job");
    }
  };

  // Memoized handlers for real-time updates
  const handleJobUpdate = useCallback(
    (data: any) => {
      console.log("📡 Received job update:", data);

      // If we have complete job data, update the jobs list
      if (data.data && data.data.job_id) {
        setJobs((prevJobs) => {
          const existingJobIndex = prevJobs.findIndex(
            (job) => job.job_id === data.job_id
          );

          if (existingJobIndex >= 0) {
            // Update existing job with complete data
            const updatedJobs = [...prevJobs];
            updatedJobs[existingJobIndex] = {
              ...updatedJobs[existingJobIndex],
              ...data.data,
              job_id: data.job_id, // Ensure job_id is preserved
            };
            return updatedJobs;
          } else {
            // Add new job if it doesn't exist
            console.log("📡 Adding new job to list:", data.data);
            const newJob = { ...data.data, job_id: data.job_id };
            const updatedJobs = [...prevJobs, newJob];

            // Sort by creation time, latest first
            return sortJobsByCreationTime(updatedJobs);
          }
        });
      } else {
        // If we don't have complete data, refresh the jobs list
        console.log("📡 Incomplete job data received, refreshing jobs list...");
        loadJobs();
      }
    },
    [sortJobsByCreationTime, loadJobs]
  );

  const handleJobListUpdate = useCallback(
    (data: any) => {
      console.log("📡 Received job list update:", data);
      if (data.jobs && Array.isArray(data.jobs)) {
        const mappedJobs = data.jobs.map((job: any) => ({
          ...job,
          job_id: job.job_id || job.id,
        }));
        setJobs(sortJobsByCreationTime(mappedJobs));
      }
    },
    [sortJobsByCreationTime]
  );

  // Listen for refresh events from Builder
  useEffect(() => {
    const handleRefreshJobs = (data: any) => {
      if (data.workflowId && workflowId && data.workflowId === workflowId) {
        console.log("🔄 Received refresh request for workflow", workflowId);
        loadJobs();
      }
    };

    const unsubscribe = eventBus.subscribe("refresh-jobs", handleRefreshJobs);

    return () => {
      unsubscribe();
    };
  }, [workflowId, loadJobs]);

  // Initialize real-time service
  useEffect(() => {
    const initializeRealtime = async () => {
      if (userId && !realtimeInitialized) {
        try {
          console.log("🔄 Initializing real-time service for user:", userId);
          if (realtimeService.isInitialized()) {
            console.log("🔄 Real-time service already initialized");
            setRealtimeInitialized(true);
            return;
          }
          await realtimeService.initialize();
          setRealtimeInitialized(true);
          console.log("✅ Real-time service initialized successfully");
        } catch (error) {
          console.error("❌ Failed to initialize real-time service:", error);
        }
      }
    };

    initializeRealtime();
  }, [userId, realtimeInitialized]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!realtimeInitialized || !userId) {
      console.log("⏳ Waiting for real-time initialization or userId...", {
        realtimeInitialized,
        userId,
      });
      return;
    }

    console.log("🔗 Setting up real-time subscriptions for user:", userId);

    // Subscribe to specific job updates if jobId is provided
    if (jobId) {
      console.log("📡 Subscribing to job updates for jobId:", jobId);
      realtimeService.subscribeToJobUpdates(jobId, handleJobUpdate);
    }

    // Subscribe to user job updates
    console.log("📡 Subscribing to user job updates for userId:", userId);
    realtimeService.subscribeToUserJobUpdates(userId, handleJobUpdate);

    // Subscribe to job list updates
    console.log("📡 Subscribing to job list updates for userId:", userId);
    realtimeService.subscribeToJobListUpdates(userId, handleJobListUpdate);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up real-time subscriptions");
      if (jobId) {
        realtimeService.unsubscribeFromJobUpdates(jobId, handleJobUpdate);
      }
      realtimeService.unsubscribeFromUserJobUpdates(userId, handleJobUpdate);
      realtimeService.unsubscribeFromJobListUpdates(
        userId,
        handleJobListUpdate
      );
    };
  }, [
    realtimeInitialized,
    userId,
    jobId,
    handleJobUpdate,
    handleJobListUpdate,
  ]);

  // Load initial data and refresh periodically for workflow jobs
  useEffect(() => {
    console.log("🔄 JobStatus: Loading initial data", { jobId, workflowId });
    if (jobId || workflowId) {
      loadJobs();
    }
  }, [jobId, workflowId, loadJobs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
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
      case "cancelled":
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
      case "running":
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case "workflow_execution":
        return "Workflow Execution";
      case "email_send":
        return "Email Send";
      case "delay":
        return "Delay";
      default:
        return jobType
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const formatResult = (result: any): string => {
    if (result === null || result === undefined) {
      return "No result";
    }
    if (typeof result === "string") {
      return result;
    }
    if (typeof result === "object") {
      try {
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return String(result);
      }
    }
    return String(result);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  if (!jobId && !workflowId) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Job Status</h3>
        <div className="flex items-center gap-2">
          {realtimeInitialized && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          )}
          <button
            onClick={loadJobs}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-red-600 mb-3">{error}</div>}

      {jobs.length === 0 ? (
        <div className="text-xs text-gray-500">
          {loading ? "Loading jobs..." : "No jobs found"}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, index) => (
            <div
              key={job.job_id}
              className="border border-gray-200 rounded p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status.toUpperCase()}
                  </span>
                  {job.workflow_id && (
                    <span className="text-xs text-gray-500">
                      (Run #{jobs.length - index})
                    </span>
                  )}
                </div>
                {job.status === "pending" && (
                  <button
                    onClick={() => cancelJob(job.job_id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  <strong>Job ID:</strong> {job.job_id || "N/A"}
                </div>
                <div>
                  <strong>Type:</strong>{" "}
                  {getJobTypeLabel(job.job_type || "unknown")}
                </div>
                <div>
                  <strong>Created:</strong> {formatDate(job.created_at)}
                </div>
                <div>
                  <strong>Scheduled:</strong> {formatDate(job.scheduled_at)}
                </div>
                {job.started_at && (
                  <div>
                    <strong>Started:</strong> {formatDate(job.started_at)}
                  </div>
                )}
                {job.completed_at && (
                  <div>
                    <strong>Completed:</strong> {formatDate(job.completed_at)}
                  </div>
                )}
                {job.failed_at && (
                  <div>
                    <strong>Failed:</strong> {formatDate(job.failed_at)}
                  </div>
                )}
                {job.cancelled_at && (
                  <div>
                    <strong>Cancelled:</strong> {formatDate(job.cancelled_at)}
                  </div>
                )}
                {job.error && (
                  <div>
                    <strong>Error:</strong> {String(job.error)}
                  </div>
                )}
                {job.result !== undefined && job.result !== null && (
                  <div>
                    <strong>Result:</strong> {formatResult(job.result)}
                  </div>
                )}
                {job.updated_at && (
                  <div>
                    <strong>Last Updated:</strong> {formatDate(job.updated_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
