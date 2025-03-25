// src/services/vehicleService.js
import api from './api';

export async function getAllVeiculos() {
    const res = await api.post('/functions/getAllVeiculos');
    return res.data.result;
}

export async function editarVeiculo(data) {
    const res = await api.post('/functions/editarVeiculo', data);
    return res.data;
}
