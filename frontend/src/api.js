import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const LOG_ENDPOINT = "http://127.0.0.1:7242/ingest/d8b408c8-f07f-4c53-b6e5-412d747aad21";

const instance = axios.create({
  baseURL: API_BASE,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // #region agent log
  try {
    fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "api.js:request",
        message: "API request",
        data: { url: config.url, method: config.method, hasToken: !!token, baseURL: config.baseURL },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H1,H2,H4",
      }),
    }).catch(() => {});
  } catch (_) {}
  // #endregion
  return config;
});

instance.interceptors.response.use(
  (res) => {
    // #region agent log
    try {
      fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "api.js:response",
          message: "API response OK",
          data: { url: res.config?.url, status: res.status },
          timestamp: Date.now(),
          sessionId: "debug-session",
          hypothesisId: "H1,H3",
        }),
      }).catch(() => {});
    } catch (_) {}
    // #endregion
    return res;
  },
  (err) => {
    // #region agent log
    try {
      fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "api.js:responseError",
          message: "API response error",
          data: {
            url: err.config?.url,
            status: err.response?.status,
            hasRequest: !!err.request,
            message: err.message || String(err),
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          hypothesisId: "H1,H2,H3,H4",
        }),
      }).catch(() => {});
    } catch (_) {}
    // #endregion
    return Promise.reject(err);
  }
);

export default instance;
