import React from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState("viewer");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        email,
        password,
        role
      });
      
      // After successful registration, redirect to login
      navigate("/login", { state: { message: "Registration successful! Please log in." } });
    } catch (err) {
      let errorMessage = "Registration failed";
      
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data?.detail || "Email already registered or invalid data";
        } else {
          errorMessage = err.response.data?.detail || `Registration failed: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = "Cannot connect to the API. On the live site: wait 30–60 sec and try again, or open https://dms-backend.fly.dev in a new tab to wake the backend. Locally: run the backend on http://localhost:8000.";
      } else {
        errorMessage = err.message || "Registration failed";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-black py-4 px-6 flex justify-center items-center shrink-0">
        <img src="/logo.png" alt="PCG Poree Consulting Group | MindRift" className="h-16 w-auto max-w-full object-contain" />
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create Account</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-medium">Email</label>
          <input 
            type="email"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-medium">Password</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-medium">Confirm Password</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-gray-700 font-medium">Role</label>
          <select 
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={role}
            onChange={e => setRole(e.target.value)}
            disabled={isLoading}
          >
            <option value="viewer">Viewer</option>
            <option value="reviewer">Reviewer (Approval Step 1)</option>
            <option value="manager">Manager (Approval Step 2)</option>
            <option value="admin">Finance/Admin (Approval Step 3)</option>
          </select>
        </div>
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
        <p className="mt-4 text-sm text-slate-600 text-center">
          Already have an account? <Link to="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link>
        </p>
      </form>
      </div>
      <footer className="py-4 text-center text-sm text-slate-500 border-t border-slate-200 bg-white/80">
        Created and developed by <strong className="text-slate-700">Mampotje Mabusela</strong>
      </footer>
    </div>
  );
}
