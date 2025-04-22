// services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL || "https://18aa-206-84-60-250.ngrok-free.app",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // para pular o aviso do Ngrok
  },
  withCredentials: true, // se você usar cookies de sessão
});

export default api;
