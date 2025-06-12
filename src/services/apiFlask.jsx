import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL || " https://777c-206-84-60-250.ngrok-free.app",
  headers: {
    // 👉 só o default; o Content-Type será ajustado dinamicamente
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false,
});

/* —— injeta JWT e ajusta Content-Type —— */
api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem("token");
  if (jwt) config.headers.Authorization = `Bearer ${jwt}`;

  // se o corpo é FormData removemos o header JSON
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
    // se quiser explicitar (não é obrigatório):
    config.headers["Content-Type"] = "multipart/form-data";
  }

  return config;
});

export default api;
