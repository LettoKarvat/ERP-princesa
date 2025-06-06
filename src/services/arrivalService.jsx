import api from "./apiflask";

/* ───────── util ───────── */
export const fileToBase64 = (file) =>
    new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });

/* ──────── chegadas (Arrival) ──────── */
export const getAllArrivals = async () => {
    const { data } = await api.get("/arrivals");
    return Array.isArray(data) ? data : [];
};

export const createArrival = async (checklistId, payload) => {
    const { data } = await api.post(`/arrivals/create/${checklistId}`, payload);
    return data.arrivalId;
};

export const addArrivalAttachment = async (arrivalId, body) => {
    await api.post(`/arrivals/${arrivalId}/attachments`, body);
};

/* ──────── saídas “Em trânsito” (Checklist) ──────── */
export const getSaidasEmTransito = async () => {
    const { data } = await api.get("/checklists/operacao");
    if (!Array.isArray(data)) return [];
    return data.filter((c) => c.status === "Em trânsito");
};

export const deleteArrival = (id) => api.delete(`/arrivals/${id}`);
export const updateArrival = (id, body) => api.patch(`/arrivals/${id}`, body);
