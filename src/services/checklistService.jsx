// src/services/checklistService.js
import api from './api';

/**
 * Cria um novo checklist (Saída) chamando a Cloud Function "criarChecklist"
 * @param {Object} data - Objeto com os campos necessários (veiculoId, dataSaida, kmSaida, etc.)
 * @returns {Object} Resposta do Parse (status, message, data)
 */
export async function criarChecklist(data) {
    const res = await api.post('/functions/criarChecklist', data);
    return res.data; // Ajuste se precisar de res.data.result
}

/**
 * Busca todos os checklists (não-deletados), chamando "getAllChecklists"
 * @returns {Array} Array de checklists
 */
export async function getAllChecklists() {
    const res = await api.post('/functions/getAllChecklists');
    return res.data.result; // Ajuste conforme a resposta do seu backend
}

/**
 * Edita um checklist (para atualizar dados de Saída ou registrar Chegada)
 * chamando "editarChecklist"
 * @param {Object} data - Objeto com campos a atualizar (objectId, dataSaida, kmSaida, dataChegada, etc.)
 * @returns {Object} Resposta do Parse
 */
export async function editarChecklist(data) {
    const res = await api.post('/functions/editarChecklist', data);
    return res.data;
}

/**
 * Adiciona anexo a um checklist chamando "adicionarAnexoChecklist"
 * @param {Object} params
 * @param {string} params.checklistId - ID do checklist no Parse
 * @param {string} params.base64file - Arquivo em base64 (sem prefixo "data:...")
 * @param {string} params.nomeArquivo - Nome do arquivo (ex: "foto1.jpg")
 * @param {string} [params.descricao] - Descrição opcional
 * @returns {Object} Resposta do Parse
 */
export async function adicionarAnexoChecklist({ checklistId, base64file, nomeArquivo, descricao }) {
    const res = await api.post('/functions/adicionarAnexoChecklist', {
        checklistId,
        base64file,
        nomeArquivo,
        descricao,
    });
    return res.data;
}

/**
 * Converte um File em base64 (removendo o prefixo "data:...")
 * @param {File} file - Arquivo (ex: proveniente de um input type="file")
 * @returns {Promise<string>} Base64 do arquivo (apenas a parte após a vírgula)
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
}
