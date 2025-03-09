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
    { code: 21, description: "Possui EPI necessário?" }
];

function DriverChecklist() {
    // Respostas do checklist
    const [answers, setAnswers] = useState(
        checklistItems.map((item) => ({
            code: item.code,
            answer: '', // 'sim' ou 'nao'
            obs: '',
        }))
    );

    // Lista de veículos (para autocomplete)
    const [vehicles, setVehicles] = useState([]);
    // Valor digitado no autocomplete
    const [plateInput, setPlateInput] = useState('');
    // Veículo selecionado
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Modal de assinatura
    const [openSignModal, setOpenSignModal] = useState(false);
    const signatureRef = useRef(null);

    // Anexos (arquivos) selecionados
    const [attachments, setAttachments] = useState([]);

    // Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info'); // success | error | warning | info

    useEffect(() => {
        loadVehicles();
    }, []);

    // Carrega veículos
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

    // Helper pra exibir snackbar
    const showSnackbar = (severity, message) => {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    // Ao mudar resposta do checklist
    const handleAnswerChange = (code, field, value) => {
        setAnswers((prev) =>
            prev.map((ans) => (ans.code === code ? { ...ans, [field]: value } : ans))
        );
    };

    // Handler do input de arquivo
    const handleFileChange = (e) => {
        if (!e.target.files) return;
        setAttachments(Array.from(e.target.files));
    };

    // Ao clicar em "Enviar Checklist"
    const handleSubmit = () => {
        // Valida se todos estão respondidos
        const anyEmpty = answers.some((ans) => ans.answer === '');
        if (anyEmpty) {
            showSnackbar('error', 'Responda todos os itens antes de enviar.');
            return;
        }

        // Placa
        if (!plateInput.trim()) {
            showSnackbar('error', 'Informe a placa do veículo.');
            return;
        }

        // Abre modal de assinatura
        setOpenSignModal(true);
    };

    // Fechar modal de assinatura
    const handleCloseSignModal = () => {
        setOpenSignModal(false);
    };

    // Limpar assinatura
    const handleClearSignature = () => {
        signatureRef.current.clear();
    };

    // Confirmar assinatura e enviar
    const handleConfirmSignature = async () => {
        if (signatureRef.current && signatureRef.current.isEmpty()) {
            showSnackbar('error', 'Por favor, faça a assinatura antes de confirmar.');
            return;
        }

        const signatureData = signatureRef.current.toDataURL();
        const sessionToken = localStorage.getItem('sessionToken');

        // Essas infos podem vir de localStorage ou do "currentUser" no Parse
        const fullname = localStorage.getItem('fullname') || '';
        const role = localStorage.getItem('role') || '';
        const userId = localStorage.getItem('userId') || '';

        // Placa final
        const finalPlate = selectedVehicle
            ? selectedVehicle.placa
            : plateInput.trim();

        // Monta objeto para enviar ao Cloud Code
        const dataToSend = {
            empresa: '298 - DISTRIBUIDORA PRINCESA',
            items: answers,
            placa: finalPlate,
            user: {
                fullname,
                role,
                userId
            },
            signature: signatureData,
        };

        try {
            const response = await api.post('/functions/submitChecklist', dataToSend, {
                headers: { 'X-Parse-Session-Token': sessionToken },
            });
            console.log('submitChecklist response:', response.data);

            if (response.data.result && response.data.result.status === 'success') {
                // OK, pegamos o checklistId se quiser mandar anexos
                const checklistId = response.data.result.objectId;
                showSnackbar('success', 'Checklist enviado com sucesso!');

                // Se houver anexos, enviamos
                if (attachments.length > 0 && checklistId) {
                    await uploadAttachments(checklistId, attachments, sessionToken);
                }
            } else {
                throw new Error(
                    (response.data.result && response.data.result.message) ||
                    'Falha ao enviar checklist.'
                );
            }
        } catch (err) {
            console.error('Erro ao enviar checklist:', err);
            showSnackbar('error', err.message || 'Erro ao enviar checklist.');
        }
        setOpenSignModal(false);
    };

    // Função para converter arquivo em base64 e enviar
    const uploadAttachments = async (checklistId, files, token) => {
        for (const file of files) {
            try {
                const base64file = await convertFileToBase64(file);
                // Chama a Cloud Function uploadChecklistAttachment
                const attachResp = await api.post(
                    '/functions/uploadChecklistAttachment',
                    {
                        checklistId,
                        base64file,
                        fileName: file.name,
                    },
                    { headers: { 'X-Parse-Session-Token': token } }
                );
                console.log('Anexo resp:', attachResp.data);
                if (attachResp.data.result && attachResp.data.result.status === 'success') {
                    showSnackbar('success', `Anexo ${file.name} enviado.`);
                } else {
                    throw new Error('Falha ao enviar anexo ' + file.name);
                }
            } catch (err) {
                console.error('Erro ao enviar anexo:', err);
                showSnackbar('error', `Erro ao enviar ${file.name}: ${err.message}`);
            }
        }
    };

    // Converter arquivo em base64
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

    // Fechar snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Checklist de Inspeção (Motorista)
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
                    <TextField
                        {...params}
                        label="Placa do Veículo"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                )}
            />

            {/* Itens do checklist */}
            {checklistItems.map((item) => {
                const ans = answers.find((a) => a.code === item.code);

                // Se "sim", fundo verde claro. Se "nao", fundo vermelho claro.
                // Caso contrário, fundo padrão (inherit).
                const bgColor = ans.answer === 'sim'
                    ? '#e0ffe0' // verde claro
                    : ans.answer === 'nao'
                        ? '#ffe0e0' // vermelho claro
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
                                onChange={(e) =>
                                    handleAnswerChange(item.code, 'answer', e.target.value)
                                }
                            >
                                <FormControlLabel
                                    value="sim"
                                    label="Sim"
                                    control={
                                        <Radio
                                            sx={{
                                                // Círculo do radio fica verde quando marcado
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
                                                // Círculo do radio fica vermelho quando marcado
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
                            onChange={(e) =>
                                handleAnswerChange(item.code, 'obs', e.target.value)
                            }
                        />
                    </Paper>
                );
            })}

            {/* Input de anexos */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Anexos (opcional)
                </Typography>
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Arquivos selecionados: {attachments.map((f) => f.name).join(', ')}
                    </Typography>
                )}
            </Paper>

            <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleSubmit}
            >
                Enviar Checklist
            </Button>

            {/* Modal de Assinatura */}
            <Dialog open={openSignModal} onClose={handleCloseSignModal} maxWidth="sm" fullWidth>
                <DialogTitle>Assinatura</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 1 }}>
                        Por favor, assine no quadro abaixo:
                    </Typography>
                    <Box
                        sx={{
                            border: '1px solid #ccc',
                            width: '100%',
                            height: 200,
                            marginBottom: 2,
                        }}
                    >
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
                    <Button onClick={handleClearSignature} variant="outlined">
                        Limpar Assinatura
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSignModal}>Cancelar</Button>
                    <Button variant="contained" onClick={handleConfirmSignature}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar de notificação */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default DriverChecklist;
