import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL_API,
  headers: {
    "X-Parse-Application-Id": import.meta.env.VITE_PARSE_APPLICATION_ID,
    "X-Parse-REST-API-Key": import.meta.env.VITE_PARSE_REST_API_KEY,
    "Content-Type": "application/json",
  },
});

// Adicionando o interceptor de resposta
api.interceptors.response.use(
  (response) => {
    // Se a resposta for 2xx, simplesmente retorne
    return response;
  },
  (error) => {
    // Caso seja code 1001 (que você definiu no Cloud Code)
    // ou a mensagem contenha "Invalid session token", então faça logof
    const code = error?.response?.data?.code;
    const message = error?.response?.data?.error || "";

    if (code === 1001 || message.includes("Invalid session token")) {
      // Remove dados de sessão que você esteja armazenando
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("role");

      // Redireciona para a tela de login (ou o que fizer sentido pra sua aplicação)
      window.location.href = "/login";
    }

    // Retorne a rejeição para que o restante do fluxo de erro continue
    return Promise.reject(error);
  }
);

export default api;
