// src/services/refuelingService.js
import api from "./apiFlask";

// helper para montar headers com JWT e, se for FormData, Content-Type
function getAuthHeaders(isForm = false) {
    const token = localStorage.getItem("access_token");
    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (isForm) {
        headers["Content-Type"] = "multipart/form-data";
    }
    return headers;
}

// GET  /refuelings
export function fetchRefuelings(params = {}) {
    return api
        .get("/refuelings/", {
            params,
            headers: getAuthHeaders(),
        })
        .then(res => res.data);
}

// POST /refuelings  (FormData)
export function createRefueling(formData) {
    return api
        .post("/refuelings/", formData, {
            headers: getAuthHeaders(true),
        })
        .then(res => res.data);
}

// PATCH /refuelings/:id  (FormData ou JSON)
export function updateRefueling(id, payload, isForm = false) {
    return api
        .patch(`/refuelings/${id}`, payload, {
            headers: getAuthHeaders(isForm),
        })
        .then(res => res.data);
}

// DELETE /refuelings/:id
export function deleteRefueling(id) {
    return api.delete(`/refuelings/${id}`, {
        headers: getAuthHeaders(),
    });
}
