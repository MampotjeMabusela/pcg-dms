import axios from "axios";

// Vercel: set VITE_API_BASE=https://dms-backend.fly.dev in project env vars
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const instance = axios.create({
  baseURL: API_BASE,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
