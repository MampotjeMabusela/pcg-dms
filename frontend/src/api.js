import axios from "axios";

const DEFAULT_API = "http://localhost:8000";
const PRODUCTION_API = "https://dms-backend.fly.dev";
// Use env var if set (Vercel: VITE_API_BASE=https://dms-backend.fly.dev); otherwise runtime fallback for production
let API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API;
if (
  typeof window !== "undefined" &&
  API_BASE === DEFAULT_API &&
  !window.location.origin.startsWith("http://localhost")
) {
  API_BASE = PRODUCTION_API;
}

const instance = axios.create({
  baseURL: API_BASE,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default instance;
