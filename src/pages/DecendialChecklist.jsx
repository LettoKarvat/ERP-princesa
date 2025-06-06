// src/pages/DecendialChecklist.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, TextField, FormControl, FormLabel, RadioGroup,
    FormControlLabel, Radio, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Snackbar, Alert, Backdrop, CircularProgress,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';
import api from '../services/apiFlask';
import { DECENDIAL_ITEMS } from '../constants/DecendialItems';

// Estado inicial: mapeia DECENDIAL_ITEMS para obter { code, answer: '', obs: '', attachments: [] }
const makeAnswerArray = items =>
    items.map(it => ({ code: it.code, answer: '', obs: '', attachments: [] }));

export default function DecendialChecklist() {
    /* ───── estados principais ───── */
    const [vehicles, setVehicles] = useState([]);
    const [answers, setAnswers] = useState(makeAnswerArray(DECENDIAL_ITEMS));
    const [plateInput, setPlateInput] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    /* assinatura & ui */
    const [openSignModal, setOpenSignModal] = useState(false);
    const signatureRef = useRef(null);
    const [savedSignature, setSavedSignature] = useState(null);
    const [loading, setLoading] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');
    const showSnackbar = (sev, msg) => {
        setSnackbarSeverity(sev);
        setSnackbarMessage(msg);
        setSnackbarOpen(true);
    };

    /* ───── carrega veículos uma vez ───── */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/vehicles');
                setVehicles(data || []);
            } catch (err) {
                console.error(err);
                showSnackbar('error', 'Falha ao carregar veículos.');
            }
        })();
    }, []);

    /* ───── helpers de resposta ───── */
    const handleAnswerChange = (code, field, value) =>
        setAnswers(prev => prev.map(a => (a.code === code ? { ...a, [field]: value } : a)));
    const handleItemFileChange = (code, files) =>
        handleAnswerChange(code, 'attachments', files);

    /* ───── upload de anexos (FormData) ───── */
    const uploadAttachments = async answersArr => {
        const result = {};
        for (const ans of answersArr) {
            if (ans.answer === 'nao' && ans.attachments.length) {
                result[ans.code] = [];
                for (const file of ans.attachments) {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('itemCode', ans.code);

                    const { data } = await api.post(
                        '/inspection/attachments/tmp',
                        fd,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );

                    if (data?.status !== 'success')
                        throw new Error(`Falha no upload de ${file.name}`);

                    result[ans.code].push({
                        attachmentId: data.attachmentId,
                        fileName: data.fileName,
                    });
                }
            }
        }
        return result;
    };

    /* ───── submit passo 1 ───── */
    const handleSubmit = () => {
        // faz as mesmas checagens do DriverChecklist:
        if (answers.some(a => a.answer === ''))
            return showSnackbar('error', 'Responda todos os itens.');
        if (answers.some(a => a.answer === 'nao' && a.attachments.length === 0))
            return showSnackbar('error', 'Itens "Não" precisam de anexo.');
        if (!plateInput.trim())
            return showSnackbar('error', 'Informe a placa.');
        setOpenSignModal(true);
    };

    /* ───── assinatura ───── */
    const handleSaveSignature = () => {
        if (signatureRef.current?.isEmpty())
            return showSnackbar('error', 'Assine antes de salvar.');
        setSavedSignature(
            signatureRef.current.getTrimmedCanvas().toDataURL('image/png')
        );
        showSnackbar('success', 'Assinatura salva.');
    };
    const handleClearSignature = () => {
        signatureRef.current?.clear();
        setSavedSignature(null);
    };

    /* ───── submit passo 2 ───── */
    const handleConfirmSignature = async () => {
        if (!savedSignature)
            return showSnackbar('error', 'Salve a assinatura antes de confirmar.');
        setLoading(true);
        try {
            const tmpIds = await uploadAttachments(answers);
            const placa = selectedVehicle?.placa || plateInput.trim();

            // **inclui isDecendial: true no payload**
            const payload = {
                empresa: 'DECENDIAL – FROTA',
                placa,
                signature: savedSignature,
                items: answers.map(a => ({
                    code: a.code,
                    answer: a.answer,
                    obs: a.obs,
                    attachments: tmpIds[a.code] || [],
                })),
                isDecendial: true
            };

            const { data } = await api.post('/inspection/submit', payload);
            if (data?.status !== 'success')
                throw new Error('Falha no envio do checklist decendial.');

            showSnackbar('success', 'Checklist Decendial enviado!');
            // limpa tudo
            setPlateInput('');
            setSelectedVehicle(null);
            setAnswers(makeAnswerArray(DECENDIAL_ITEMS));
        } catch (err) {
            console.error(err);
            showSnackbar('error', err.message || 'Erro ao enviar checklist decendial.');
        } finally {
            setLoading(false);
            setOpenSignModal(false);
            setSavedSignature(null);
        }
    };

    /* ───── UI ───── */
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Checklist Decendial
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                    Empresa: 298 - DISTRIBUIDORA PRINCESA
                </Typography>
                <Typography variant="body2">
                    Relação de Itens de Inspeção Décendial
                </Typography>
            </Paper>

            {/* placa/autocomplete */}
            <Autocomplete
                freeSolo
                value={selectedVehicle || plateInput}
                options={vehicles}
                getOptionLabel={opt =>
                    typeof opt === 'string'
                        ? opt
                        : opt?.placa
                            ? `${opt.placa} – ${opt.marca || ''} ${opt.modelo || ''}`
                            : ''
                }
                onInputChange={(_, v) => { setPlateInput(v); setSelectedVehicle(null); }}
                onChange={(_, n) => {
                    if (typeof n === 'string' || !n) {
                        setSelectedVehicle(null);
                        setPlateInput(n || '');
                    } else {
                        setSelectedVehicle(n);
                        setPlateInput(n.placa);
                    }
                }}
                renderInput={p => (
                    <TextField {...p} label="Placa do Veículo" sx={{ mb: 2 }} />
                )}
            />

            {/* aqui percorremos DECENDIAL_ITEMS em vez de CHECKLIST_ITEMS */}
            {DECENDIAL_ITEMS.map(item => {
                const ans = answers.find(a => a.code === item.code);
                const bg = ans.answer === 'sim'
                    ? '#e0ffe0'
                    : ans.answer === 'nao'
                        ? '#ffe0e0'
                        : 'inherit';

                return (
                    <Paper key={item.code} sx={{ p: 2, mb: 2, backgroundColor: bg }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {item.code}. {item.description}
                        </Typography>

                        <FormControl>
                            <FormLabel>Resposta</FormLabel>
                            <RadioGroup
                                row value={ans.answer}
                                onChange={e => handleAnswerChange(item.code, 'answer', e.target.value)}
                            >
                                <FormControlLabel
                                    value="sim"
                                    label="Sim"
                                    control={<Radio sx={{ '&.Mui-checked': { color: 'green' } }} />}
                                />
                                <FormControlLabel
                                    value="nao"
                                    label="Não"
                                    control={<Radio sx={{ '&.Mui-checked': { color: 'red' } }} />}
                                />
                            </RadioGroup>
                        </FormControl>

                        <TextField
                            label="Observações"
                            fullWidth
                            multiline
                            minRows={2}
                            sx={{ mt: 2 }}
                            value={ans.obs}
                            onChange={e => handleAnswerChange(item.code, 'obs', e.target.value)}
                        />

                        {/* se for “não”, habilita upload de anexos (igual ao DriverChecklist) */}
                        {ans.answer === 'nao' && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Anexos obrigatórios:
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    onChange={e => handleItemFileChange(item.code, Array.from(e.target.files || []))}
                                />
                                {!!ans.attachments.length && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {ans.attachments.map(f => f.name).join(', ')}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Paper>
                );
            })}

            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
                Enviar Checklist Decendial
            </Button>

            {/* modal assinatura */}
            <Dialog
                open={openSignModal}
                onClose={(e, r) => {
                    if (loading || r === 'backdropClick') return;
                    setOpenSignModal(false);
                    setSavedSignature(null);
                }}
                disableEscapeKeyDown={loading}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Assinatura</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 1 }}>Assine abaixo:</Typography>
                    <Box sx={{ border: '1px solid #ccc', height: 200, mb: 2 }}>
                        <SignatureCanvas
                            ref={signatureRef}
                            penColor="black"
                            canvasProps={{ width: 500, height: 200, style: { background: '#fff' } }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={handleClearSignature} variant="outlined" disabled={loading}>
                            Limpar
                        </Button>
                        <Button onClick={handleSaveSignature} variant="outlined" disabled={loading}>
                            Salvar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSignModal(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleConfirmSignature} disabled={loading}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* snackbar + backdrop */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Backdrop sx={{ color: '#fff', zIndex: t => t.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}
