// services/apiFlask.jsx
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_FLASK_URL ||
    "https://18aa-206-84-60-250.ngrok-free.app",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false, // só true se usar cookies
});

/* acrescenta automaticamente o JWT salvo no login */
api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem("token"); // seu token Bearer
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

export default api;
