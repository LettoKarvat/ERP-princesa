import api from "./apiFlask";

/* cabeçalhos extras, se um dia precisar */
const authHeaders = () => ({});

/* ——— builder de FormData ——— */
const buildFormData = (payload, attachments = [], signatureBlob = null) => {
    const fd = new FormData();
    fd.append("vehicle_id", payload.vehicle_id);
    fd.append("fuel_type", payload.fuelType);
    fd.append("date", payload.date);
    fd.append("post", payload.post);
    fd.append("liters", payload.liters);
    fd.append("mileage", payload.mileage);

    fd.append("pump", payload.pump || "");
    fd.append("observation", payload.observation || "");
    if (payload.invoiceNumber) fd.append("invoice_number", payload.invoiceNumber);
    if (payload.unitPrice) fd.append("unit_price", payload.unitPrice);

    if (signatureBlob)
        fd.append("signature", signatureBlob, "signature.png");

    attachments.forEach((f) => fd.append("attachments", f, f.name));
    return fd;
};

/* ——— chamadas ——— */
export const fetchRefuelings = (params = {}) =>
    api.get("/refuelings/", { params, headers: authHeaders() }).then(r => r.data);

export const createRefueling = (
    payload,
    attachments = [],
    signatureBlob = null
) => {
    const fd = buildFormData(payload, attachments, signatureBlob);
    return api.post("/refuelings/", fd, { headers: authHeaders() }).then(r => r.data);
};

export const updateRefueling = (
    id,
    payload,
    attachments = [],
    signatureBlob = null
) => {
    const fd = buildFormData(payload, attachments, signatureBlob);
    return api.patch(`/refuelings/${id}`, fd, { headers: authHeaders() }).then(r => r.data);
};

export const deleteRefueling = (id) =>
    api.delete(`/refuelings/${id}`, { headers: authHeaders() });
