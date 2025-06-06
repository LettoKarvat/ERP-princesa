import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_FLASK_URL ||
    "https://832f-206-84-60-250.ngrok-free.app",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false,           // ❌ não usamos mais cookies
});

/* ——— coloca o JWT em TODAS as requisições ——— */
api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem("token");
  if (jwt) config.headers.Authorization = `Bearer ${jwt}`;
  return config;
});

export default api;
