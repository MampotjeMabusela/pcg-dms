import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const goBack = () => navigate(-1);

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="PCG DMS" className="h-10 w-auto object-contain" />
          </Link>
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Back to previous page"
          >
            <span className="text-lg leading-none" aria-hidden="true">←</span>
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="hidden sm:flex items-center gap-1">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/upload"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Upload
            </Link>
            <Link
              to="/approvals"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Approvals
            </Link>
            <Link
              to="/reports"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Reports
            </Link>
            <Link
              to="/insights"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              AI Insights
            </Link>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
