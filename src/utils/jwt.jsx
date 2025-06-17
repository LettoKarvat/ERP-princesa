// src/utils/jwt.js
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    // lidar com caracteres especiais
    const decoded = decodeURIComponent(
      json
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  const data = decodeToken(token);
  return data?.exp && Date.now() < data.exp * 1000;
}
