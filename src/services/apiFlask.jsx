// src/services/apiFlask.js
import axios from "axios";

/* ——— helper para limpar sessão e voltar ao login ——— */
export function logout() {
  localStorage.clear();
  window.location.href = "/";        // ajuste a rota se o login não for "/"
}

const api = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false,
});

/* —— injeta JWT e ajusta Content-Type —— */
api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem("token");
  if (jwt) config.headers.Authorization = `Bearer ${jwt}`;

  // se o corpo é FormData, remove o JSON default
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
    config.headers["Content-Type"] = "multipart/form-data";
  }
  return config;
});

/* —— captura 401 ou token expirado e desloga —— */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 ||
      error.response?.data?.msg === "Token has expired"
    ) {
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
