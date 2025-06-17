// src/services/apiFlask.js
import axios from "axios";

/* ——— helper: limpa sessão e força volta ao login ——— */
export function logout() {
  localStorage.clear();
  window.location.href = "/login";     // ajuste se sua rota de login for diferente
}

/* ——— instancia Axios ——— */
const api = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL,
  headers: { "ngrok-skip-browser-warning": "true" },
  withCredentials: false,
});

/* ——— request: injeta JWT e corrige Content-Type ——— */
api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem("token");
  if (jwt) config.headers.Authorization = `Bearer ${jwt}`;

  // se for FormData, deixa o browser definir o boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});

/* ——— response: trata expiração/ausência de token ——— */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.msg;

    // 401 → inválido/expirado, 403 → sem permissão,
    // 422 → header Authorization ausente/mal-formado (Flask-JWT-Extended)
    if ([401, 403, 422].includes(status) || msg === "Token has expired") {
      logout();
    }
    return Promise.reject(err);
  }
);

export default api;
