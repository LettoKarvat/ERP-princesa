import api from './api';

/**
 * Cria um novo checklist (Saída) chamando a Cloud Function "criarChecklistOperacao"
 * Retorna o objeto result desembrulhado: { status, message, data: { objectId } }
 */
export async function criarChecklistOperacao(data) {
    const res = await api.post('/functions/criarChecklistOperacao', data);
    return res.data.result;
}

/**
 * Busca todos os checklistsOperacao (não-deletados) chamando "getAllChecklistsOperacao"
 * Como o Cloud Function retorna diretamente o array, essa função retorna o array de checklists.
 */
export async function getAllChecklistsOperacao() {
    const res = await api.post('/functions/getAllChecklistsOperacao');
    return res.data; // res.data é o array de checklists
}

/**
 * Busca um checklistOperacao por ID chamando "getChecklistOperacaoById"
 * Retorna o objeto result desembrulhado.
 */
export async function getChecklistOperacaoById(objectId) {
    const res = await api.post('/functions/getChecklistOperacaoById', { objectId });
    return res.data.result;
}

/**
 * Edita um checklistOperacao (para atualizar dados de Saída ou registrar Chegada)
 * Retorna o objeto result desembrulhado.
 */
export async function editarChecklistOperacao(data) {
    const res = await api.post('/functions/editarChecklistOperacao', data);
    return res.data.result;
}

/**
 * Adiciona anexo a um checklistOperacao chamando "adicionarAnexoChecklistOperacao"
 * Retorna o objeto result desembrulhado.
 */
export async function adicionarAnexoChecklistOperacao({ checklistId, base64file, nomeArquivo, descricao }) {
    const res = await api.post('/functions/adicionarAnexoChecklistOperacao', {
        checklistId,
        base64file,
        nomeArquivo,
        descricao,
    });
    return res.data.result;
}

/**
 * Converte um File em base64 (removendo o prefixo "data:...")
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
