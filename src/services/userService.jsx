// src/services/userService.js
import api from './api';

/**
 * Lista motoristas, chamando "listarMotoristas" no Cloud Function
 * que retorna algo como { result: [ { objectId, fullname, ... }, ... ] }
 */
export async function listarMotoristas() {
    const res = await api.post('/functions/listarMotoristas');
    // Se a CF retornar { result: [ ... ] }, pegamos "res.data.result"
    return res.data.result.result; // Agora sim, retorna o array
}
