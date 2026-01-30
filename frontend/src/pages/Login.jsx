import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/", { replace: true });
  }, [navigate]);

  React.useEffect(() => {
    if (location.state?.message) setSuccess(location.state.message);
  }, [location]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await api.post("/auth/token", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch (err) {
      let errorMessage = "Login failed";
      if (err.response) {
        if (err.response.status === 401) errorMessage = "Incorrect email or password";
        else if (err.response.status === 422) errorMessage = "Invalid email or password format";
        else errorMessage = err.response.data?.detail || `Login failed: ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = "Cannot connect to server. Check that the API is reachable (local: http://localhost:8000, production: backend URL).";
      } else errorMessage = err.message || "Login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Logo banner - black background to match brand */}
      <header className="bg-black py-4 px-6 flex justify-center items-center shrink-0">
        <img
          src="/logo.png"
          alt="PCG Poree Consulting Group | MindRift"
          className="h-16 w-auto max-w-full object-contain"
        />
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-1">Sign in</h2>
              <p className="text-sm text-slate-500 mb-6">Document Management System</p>
              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-teal-600 font-medium hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-sm text-slate-500 border-t border-slate-200 bg-white/80">
        Created and developed by <strong className="text-slate-700">Mampotje Mabusela</strong>
      </footer>
    </div>
  );
}
