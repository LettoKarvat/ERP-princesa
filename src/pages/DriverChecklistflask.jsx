// src/pages/DriverChecklist.jsx
import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import api from "../services/apiFlask";            // <-- agora usa apiFlask.jsx

// se preferir, busque do endpoint /inspection/items
const checklistItems = [
    { code: 1, description: "CRLV atualizado" },
    { code: 2, description: "CNH atualizada" },
    { code: 3, description: "Motorista e ajudantes uniformizados" },
    { code: 4, description: "Certificado de cronotacógrafo atualizado" },
    { code: 5, description: "Exame toxicológico atualizado" },
    { code: 6, description: "Macaco, triângulo e chave de roda" },
    { code: 7, description: "Cinto de segurança e extintor de incêndio" },
    { code: 8, description: "Funcionamento do limpador de para-brisa e abastecimento de água" },
    { code: 9, description: "Nível de combustível e bomba injetora" },
    { code: 10, description: "Nível de água do radiador e temperatura" },
    { code: 11, description: "Nível do óleo lubrificante e fluido de freio" },
    { code: 12, description: "Sistema elétrico, luzes do painel e bateria" },
    { code: 13, description: "Condição dos pneus, rodas e calibração" },
    { code: 14, description: "Condição geral da cabine, do baú e da lataria" },
    { code: 15, description: "Espelhos retrovisores e buzina" },
    { code: 16, description: "Faróis altos/baixos, pisca-alerta, luz de ré, sonorizador, seta, luz de freio e lanternas traseiras" },
    { code: 17, description: "Faixas refletivas e luzes laterais, portas e janelas" },
    { code: 18, description: "Funcionamento do tacógrafo" },
    { code: 19, description: "Motor sem vazamento, ruídos ou fumaça" },
    { code: 20, description: "Carrinho de entrega" },
];



function DriverChecklist() {
    const [answers, setAnswers] = useState(
        checklistItems.map((it) => ({
            code: it.code,
            answer: "",
            obs: "",
            attachments: [], // arquivos File escolhidos localmente
        }))
    );

    const [vehicles, setVehicles] = useState([]);
    const [plateInput, setPlateInput] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [openSignModal, setOpenSignModal] = useState(false);
    const signatureRef = useRef(null);
    const [savedSignature, setSavedSignature] = useState(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");

    const [loading, setLoading] = useState(false);

    /* ─────────────────────────── carregamento inicial ────────────────────────── */
    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const res = await api.get("/vehicles");     // <-- novo endpoint Flask
            setVehicles(res.data || []);
        } catch (err) {
            console.error(err);
            showSnackbar("error", "Falha ao carregar veículos.");
        }
    };

    /* ────────────────────────── helpers visuais ─────────────────────────────── */
    const showSnackbar = (severity, message) => {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    const handleCloseSnackbar = () => setSnackbarOpen(false);

    /* ────────────────────────── manipulação de respostas ────────────────────── */
    const handleAnswerChange = (code, field, value) => {
        setAnswers((prev) =>
            prev.map((ans) => (ans.code === code ? { ...ans, [field]: value } : ans))
        );
    };
    const handleItemFileChange = (code, files) => {
        setAnswers((prev) =>
            prev.map((ans) => (ans.code === code ? { ...ans, attachments: files } : ans))
        );
    };

    /* ────────────────────────── submissão passo-1 (validações) ──────────────── */
    const handleSubmit = () => {
        if (answers.some((a) => a.answer === "")) {
            return showSnackbar("error", "Responda todos os itens antes de enviar.");
        }
        if (
            answers.some(
                (a) => a.answer === "nao" && (!a.attachments || a.attachments.length === 0)
            )
        ) {
            return showSnackbar(
                "error",
                'Itens marcados como "Não" precisam de pelo menos um anexo.'
            );
        }
        if (!plateInput.trim()) {
            return showSnackbar("error", "Informe a placa do veículo.");
        }
        setOpenSignModal(true);
    };

    /* ───────────────────────── assinatura modal ─────────────────────────────── */
    const handleSaveSignature = () => {
        if (signatureRef.current && !signatureRef.current.isEmpty()) {
            setSavedSignature(
                signatureRef.current.getTrimmedCanvas().toDataURL("image/png")
            );
            showSnackbar("success", "Assinatura salva.");
        } else {
            showSnackbar("error", "Faça a assinatura antes de salvar.");
        }
    };
    const handleClearSignature = () => {
        signatureRef.current?.clear();
        setSavedSignature(null);
    };
    const handleCloseSignModal = () => {
        if (!loading) {
            setOpenSignModal(false);
            setSavedSignature(null);
        }
    };

    /* ────────────────────────── upload dos anexos (novo fluxo) ──────────────── */
    const uploadAttachments = async () => {
        const results = {}; // { itemCode: [ {attachmentId,fileName}, ... ] }

        for (const ans of answers) {
            if (ans.answer === "nao" && ans.attachments.length > 0) {
                results[ans.code] = [];

                for (const file of ans.attachments) {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("itemCode", ans.code);

                    const res = await api.post("/inspection/attachments/tmp", fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    if (res.data.status === "success") {
                        results[ans.code].push({
                            attachmentId: res.data.attachmentId,
                            fileName: res.data.fileName,
                        });
                    } else {
                        throw new Error(`Falha ao enviar anexo ${file.name}`);
                    }
                }
            }
        }
        return results;
    };

    /* ───────────────────────── submissão passo-2 (envio final) ──────────────── */
    const handleConfirmSignature = async () => {
        if (!savedSignature) {
            return showSnackbar("error", "Salve a assinatura antes de confirmar.");
        }

        setLoading(true);
        try {
            // 1) envia anexos e obtém IDs
            const attachmentsResults = await uploadAttachments();

            // 2) monta payload
            const finalPlate = selectedVehicle ? selectedVehicle.placa : plateInput.trim();
            const payload = {
                empresa: "298 - DISTRIBUIDORA PRINCESA",
                placa: finalPlate,
                signature: savedSignature,
                items: answers.map((ans) => ({
                    code: ans.code,
                    answer: ans.answer,
                    obs: ans.obs,
                    attachments: attachmentsResults[ans.code] || [],
                })),
            };

            // 3) envia checklist
            const res = await api.post("/inspection/submit", payload);
            if (res.data.status === "success") {
                showSnackbar("success", "Checklist enviado com sucesso!");
                // opcional: resetar formulário
            } else {
                throw new Error("Falha no envio do checklist.");
            }
        } catch (err) {
            console.error(err);
            showSnackbar("error", err.message || "Erro ao enviar checklist.");
        } finally {
            setLoading(false);
            setOpenSignModal(false);
            setSavedSignature(null);
        }
    };

    /* ────────────────────────── UI ────────────────────────── */
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Checklist de Inspeção
            </Typography>

            {/* cabeçalho */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                    Empresa: 298 - DISTRIBUIDORA PRINCESA
                </Typography>
                <Typography variant="body2">
                    Relação de Itens de Inspeção do Checklist
                </Typography>
            </Paper>

            {/* placa + autocomplete */}
            <Autocomplete
                freeSolo
                value={selectedVehicle ? selectedVehicle : plateInput}
                options={vehicles}
                getOptionLabel={(opt) =>
                    typeof opt === "string"
                        ? opt
                        : opt.placa
                            ? `${opt.placa} - ${opt.marca || ""} ${opt.modelo || ""}`
                            : ""
                }
                onInputChange={(_, v) => {
                    setPlateInput(v);
                    setSelectedVehicle(null);
                }}
                onChange={(_, newVal) => {
                    if (typeof newVal === "string") {
                        setSelectedVehicle(null);
                        setPlateInput(newVal);
                    } else if (newVal && newVal.placa) {
                        setSelectedVehicle(newVal);
                        setPlateInput(newVal.placa);
                    } else {
                        setSelectedVehicle(null);
                        setPlateInput("");
                    }
                }}
                renderInput={(p) => (
                    <TextField {...p} label="Placa do Veículo" variant="outlined" sx={{ mb: 2 }} />
                )}
            />

            {/* itens */}
            {checklistItems.map((item) => {
                const ans = answers.find((a) => a.code === item.code);
                const bg =
                    ans.answer === "sim"
                        ? "#e0ffe0"
                        : ans.answer === "nao"
                            ? "#ffe0e0"
                            : "inherit";

                return (
                    <Paper
                        key={item.code}
                        sx={{ p: 2, mb: 2, backgroundColor: bg, transition: "background 0.3s" }}
                    >
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {item.code}. {item.description}
                        </Typography>

                        <FormControl>
                            <FormLabel>Resposta</FormLabel>
                            <RadioGroup
                                row
                                value={ans.answer}
                                onChange={(e) =>
                                    handleAnswerChange(item.code, "answer", e.target.value)
                                }
                            >
                                <FormControlLabel
                                    value="sim"
                                    control={<Radio sx={{ "&.Mui-checked": { color: "green" } }} />}
                                    label="Sim"
                                />
                                <FormControlLabel
                                    value="nao"
                                    control={<Radio sx={{ "&.Mui-checked": { color: "red" } }} />}
                                    label="Não"
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
                            onChange={(e) => handleAnswerChange(item.code, "obs", e.target.value)}
                        />

                        {/* anexos se "nao" */}
                        {ans.answer === "nao" && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Anexos obrigatórios:
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) =>
                                        handleItemFileChange(item.code, Array.from(e.target.files))
                                    }
                                />
                                {ans.attachments.length > 0 && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {ans.attachments.map((f) => f.name).join(", ")}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Paper>
                );
            })}

            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
                Enviar Checklist
            </Button>

            {/* modal assinatura */}
            <Dialog
                open={openSignModal}
                onClose={(e, r) => {
                    if (loading || r === "backdropClick") return;
                    handleCloseSignModal();
                }}
                disableEscapeKeyDown={loading}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Assinatura</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 1 }}>Assine no quadro abaixo:</Typography>
                    <Box sx={{ border: "1px solid #ccc", width: "100%", height: 200, mb: 2 }}>
                        <SignatureCanvas
                            ref={signatureRef}
                            penColor="black"
                            canvasProps={{ width: 500, height: 200, style: { background: "#fff" } }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Button onClick={handleClearSignature} variant="outlined" disabled={loading}>
                            Limpar
                        </Button>
                        <Button onClick={handleSaveSignature} variant="outlined" disabled={loading}>
                            Salvar
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

            {/* snackbar + backdrop */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Backdrop sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}

export default DriverChecklist;
