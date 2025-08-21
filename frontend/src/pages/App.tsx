import React from "react";
import { NotificationContainer } from "../components/Notification";
import { Link, Outlet, useNavigate } from "react-router-dom";
import useAuth from "../store/auth";
import ErrorBoundary from "../components/ErrorBoundary";

export default function App() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            Workflow Orchestration Engine
          </Link>
          <nav className="flex gap-4 items-center">
            <Link to="/">Dashboard</Link>
            <Link to="/builder">Builder</Link>
            {token ? (
              <button
                className="px-3 py-1 bg-gray-100 rounded"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Signup</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-12xl mx-auto w-full p-4">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <NotificationContainer />
    </div>
  );
}
