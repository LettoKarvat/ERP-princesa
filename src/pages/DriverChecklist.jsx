// src/pages/DriverChecklist.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Backdrop,
    CircularProgress,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';
import api from '../services/api';

const checklistItems = [
    { code: 1, description: "CRLV do veículo está ok?" },
    { code: 2, description: "CNH está ok?" },
    { code: 3, description: "Está uniformizado?" },
    { code: 4, description: "Certificado de Cronotacógrafo está ok?" },
    { code: 5, description: "Condições Gerais: Lataria, Cabine, Baú." },
    { code: 6, description: "AET está ok?" },
    { code: 7, description: "Exame Toxicológico está em dia?" },
    { code: 8, description: "Condições gerais internas: bancada, tapete, forros, bancos." },
    { code: 9, description: "Condições de Rodagem: Pneus, Rodas, Pressão de Ar." },
    { code: 10, description: "Sistema de Freios: nível de fluido, altura do pedal." },
    { code: 11, description: "Sistema de Arrefecimento: nível de água e temperatura." },
    { code: 12, description: "Sistema de Alimentação: Bomba injetora, combustível." },
    { code: 13, description: "Sistema Elétrico: Painel, iluminação, bateria." },
    { code: 14, description: "Sistema Trator: (Diferencial) Eixo Cardan." },
    { code: 15, description: "Sistema Câmbio: Engate marchas, folgas, ruídos." },
    { code: 16, description: "Parte do motor: vazamentos, ruídos, fumaça." },
    { code: 17, description: "Embreagem: Altura do Pedal, Estressamento." },
    { code: 18, description: "Tacógrafo: marcação, hora, agulha, está conforme." },
    { code: 19, description: "Carrinho de entrega está ok?" },
    { code: 20, description: "Itens de segurança: macaco, triângulo, chave de roda." },
    { code: 21, description: "Possui EPI necessário?" },
];

function DriverChecklist() {
    // Cada item possui resposta, observação e um array de anexos
    const [answers, setAnswers] = useState(
        checklistItems.map((item) => ({
            code: item.code,
            answer: '', // 'sim' ou 'nao'
            obs: '',
            attachments: [],
        }))
    );

    const [vehicles, setVehicles] = useState([]);
    const [plateInput, setPlateInput] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [openSignModal, setOpenSignModal] = useState(false);
    const signatureRef = useRef(null);
    const [savedSignature, setSavedSignature] = useState(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadVehicles();
    }, []);

    // Bloqueia a saída da página enquanto o loading estiver ativo
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (loading) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [loading]);

    const loadVehicles = async () => {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await api.post(
                '/functions/getAllVeiculos',
                {},
                { headers: { 'X-Parse-Session-Token': sessionToken } }
            );
            if (response.data.result) {
                setVehicles(response.data.result);
            }
        } catch (err) {
            console.error('Erro ao carregar veículos:', err);
            showSnackbar('error', 'Falha ao carregar veículos.');
        }
    };

    const showSnackbar = (severity, message) => {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    // Atualiza resposta ou observação de um item
    const handleAnswerChange = (code, field, value) => {
        setAnswers((prev) =>
            prev.map((ans) => (ans.code === code ? { ...ans, [field]: value } : ans))
        );
    };

    // Atualiza o array de arquivos do item
    const handleItemFileChange = (code, files) => {
        setAnswers((prev) =>
            prev.map((ans) => (ans.code === code ? { ...ans, attachments: files } : ans))
        );
    };

    const handleSubmit = () => {
        // Verifica se todos os itens foram respondidos
        const anyEmptyAnswer = answers.some((ans) => ans.answer === '');
        if (anyEmptyAnswer) {
            showSnackbar('error', 'Responda todos os itens antes de enviar.');
            return;
        }
        // Verifica se os itens marcados como "nao" possuem pelo menos um anexo
        const nonCompliantWithoutAttachment = answers.some(
            (ans) => ans.answer === 'nao' && (!ans.attachments || ans.attachments.length === 0)
        );
        if (nonCompliantWithoutAttachment) {
            showSnackbar('error', 'Todos os itens marcados como "Não" devem ter pelo menos um anexo.');
            return;
        }
        // Verifica se a placa foi informada
        if (!plateInput.trim()) {
            showSnackbar('error', 'Informe a placa do veículo.');
            return;
        }

        // Abre o modal de assinatura
        setOpenSignModal(true);
    };

    const handleCloseSignModal = () => {
        // Permite fechar o modal somente se não estiver carregando
        if (!loading) {
            setOpenSignModal(false);
            setSavedSignature(null); // Opcional: limpa a assinatura salva ao fechar o modal
        }
    };

    const handleClearSignature = () => {
        if (signatureRef.current) {
            signatureRef.current.clear();
            setSavedSignature(null);
        }
    };

    // Função para salvar a assinatura (no mobile, por exemplo)
    const handleSaveSignature = () => {
        if (signatureRef.current && !signatureRef.current.isEmpty()) {
            const data = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
            setSavedSignature(data);
            showSnackbar('success', 'Assinatura salva.');
        } else {
            showSnackbar('error', 'Por favor, faça a assinatura antes de salvar.');
        }
    };

    // Converte um arquivo para base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Função para enviar anexos antes do checklist
    const uploadAttachments = async (answers, sessionToken) => {
        const attachmentsResults = {};

        for (const ans of answers) {
            if (ans.answer === 'nao' && ans.attachments?.length > 0) {
                attachmentsResults[ans.code] = [];

                for (const file of ans.attachments) {
                    try {
                        const base64file = await convertFileToBase64(file);
                        // Sanitiza o nome do arquivo removendo espaços e parênteses
                        const sanitizedFileName = file.name.replace(/\s/g, '_').replace(/[()]/g, '');
                        const attachResp = await api.post(
                            '/functions/uploadChecklistAttachmentTemp',
                            {
                                base64file,
                                fileName: sanitizedFileName,
                                itemCode: ans.code,
                            },
                            { headers: { 'X-Parse-Session-Token': sessionToken } }
                        );

                        if (attachResp.data.result && attachResp.data.result.status === 'success') {
                            attachmentsResults[ans.code].push({
                                attachmentId: attachResp.data.result.attachmentId,
                                fileName: sanitizedFileName,
                            });
                        } else {
                            throw new Error(`Falha ao enviar anexo: ${file.name}`);
                        }
                    } catch (error) {
                        throw new Error(`Erro ao enviar anexo ${file.name}: ${error.message}`);
                    }
                }
            }
        }

        return attachmentsResults;
    };

    const handleConfirmSignature = async () => {
        if (!savedSignature) {
            showSnackbar('error', 'Por favor, salve a assinatura antes de confirmar.');
            return;
        }

        setLoading(true);
        const sessionToken = localStorage.getItem('sessionToken');

        try {
            // Envia os anexos e aguarda a resposta com os IDs
            const attachmentsResults = await uploadAttachments(answers, sessionToken);

            const finalPlate = selectedVehicle ? selectedVehicle.placa : plateInput.trim();
            const signatureData = savedSignature;
            const fullname = localStorage.getItem('fullname') || '';
            const role = localStorage.getItem('role') || '';
            const userId = localStorage.getItem('userId') || '';

            const dataToSend = {
                empresa: '298 - DISTRIBUIDORA PRINCESA',
                items: answers.map((ans) => ({
                    code: ans.code,
                    answer: ans.answer,
                    obs: ans.obs,
                    attachments: attachmentsResults[ans.code] || [],
                })),
                placa: finalPlate,
                user: { fullname, role, userId },
                signature: signatureData,
            };

            const response = await api.post('/functions/submitChecklist', dataToSend, {
                headers: { 'X-Parse-Session-Token': sessionToken },
            });

            if (response.data.result && response.data.result.status === 'success') {
                showSnackbar('success', 'Checklist e anexos enviados com sucesso!');
            } else {
                throw new Error(
                    (response.data.result && response.data.result.message) ||
                    'Falha ao enviar checklist.'
                );
            }
        } catch (err) {
            console.error('Erro ao enviar checklist:', err);
            showSnackbar('error', err.message || 'Erro ao enviar checklist.');
        } finally {
            setLoading(false);
            setOpenSignModal(false);
            setSavedSignature(null);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Checklist de Inspeção
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Empresa: 298 - DISTRIBUIDORA PRINCESA
                </Typography>
                <Typography variant="body2">
                    Relação de Itens de Inspeção do Checklist
                </Typography>
            </Paper>

            {/* Campo de placa com Autocomplete freeSolo */}
            <Autocomplete
                freeSolo
                value={selectedVehicle ? selectedVehicle : plateInput}
                onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                        setSelectedVehicle(null);
                        setPlateInput(newValue);
                    } else if (newValue && newValue.placa) {
                        setSelectedVehicle(newValue);
                        setPlateInput(newValue.placa);
                    } else {
                        setSelectedVehicle(null);
                        setPlateInput('');
                    }
                }}
                onInputChange={(event, newInputValue) => {
                    setPlateInput(newInputValue);
                    setSelectedVehicle(null);
                }}
                options={vehicles}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.placa
                        ? `${option.placa} - ${option.marca || ''} ${option.modelo || ''}`
                        : '';
                }}
                renderInput={(params) => (
                    <TextField {...params} label="Placa do Veículo" variant="outlined" sx={{ mb: 2 }} />
                )}
            />

            {/* Lista de itens do checklist */}
            {checklistItems.map((item) => {
                const ans = answers.find((a) => a.code === item.code);
                const bgColor =
                    ans.answer === 'sim'
                        ? '#e0ffe0'
                        : ans.answer === 'nao'
                            ? '#ffe0e0'
                            : 'inherit';

                return (
                    <Paper
                        key={item.code}
                        sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: bgColor,
                            transition: 'background-color 0.3s',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {item.code}. {item.description}
                        </Typography>

                        <FormControl component="fieldset">
                            <FormLabel component="legend">Resposta</FormLabel>
                            <RadioGroup
                                row
                                value={ans?.answer || ''}
                                onChange={(e) => handleAnswerChange(item.code, 'answer', e.target.value)}
                            >
                                <FormControlLabel
                                    value="sim"
                                    label="Sim"
                                    control={
                                        <Radio
                                            sx={{
                                                '&.Mui-checked': {
                                                    color: 'green',
                                                },
                                            }}
                                        />
                                    }
                                />
                                <FormControlLabel
                                    value="nao"
                                    label="Não"
                                    control={
                                        <Radio
                                            sx={{
                                                '&.Mui-checked': {
                                                    color: 'red',
                                                },
                                            }}
                                        />
                                    }
                                />
                            </RadioGroup>
                        </FormControl>

                        <TextField
                            label="Observações"
                            variant="outlined"
                            fullWidth
                            multiline
                            minRows={2}
                            sx={{ mt: 2 }}
                            value={ans?.obs || ''}
                            onChange={(e) => handleAnswerChange(item.code, 'obs', e.target.value)}
                        />

                        {/* Exibe input de arquivo se resposta for "nao" */}
                        {ans.answer === 'nao' && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Anexos obrigatórios para item não conforme:
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) =>
                                        handleItemFileChange(item.code, Array.from(e.target.files))
                                    }
                                />
                                {ans.attachments && ans.attachments.length > 0 && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Arquivos selecionados: {ans.attachments.map((f) => f.name).join(', ')}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Paper>
                );
            })}

            <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleSubmit}
            >
                Enviar Checklist
            </Button>

            {/* Modal de assinatura */}
            <Dialog
                open={openSignModal}
                onClose={(event, reason) => {
                    // Bloqueia o fechamento se estiver carregando ou se for clique no backdrop
                    if (loading || (reason && reason === 'backdropClick')) return;
                    handleCloseSignModal();
                }}
                disableEscapeKeyDown={loading}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Assinatura</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 1 }}>Por favor, assine no quadro abaixo:</Typography>
                    <Box sx={{ border: '1px solid #ccc', width: '100%', height: 200, marginBottom: 2 }}>
                        <SignatureCanvas
                            ref={signatureRef}
                            penColor="black"
                            canvasProps={{
                                width: 500,
                                height: 200,
                                style: { background: '#fff' },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={handleClearSignature} variant="outlined" disabled={loading}>
                            Limpar Assinatura
                        </Button>
                        <Button onClick={handleSaveSignature} variant="outlined" disabled={loading}>
                            Salvar Assinatura
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSignModal} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleConfirmSignature} disabled={loading}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Loading visual */}
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}

export default DriverChecklist;
