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
import api from "../services/apiFlask";

/* ─── Itens fixos do checklist ─── */
const CHECKLIST_ITEMS = [
    { code: 1, description: "CRLV atualizado" },
    { code: 2, description: "CNH atualizada" },
    { code: 3, description: "Motorista e ajudantes uniformizados" },
    { code: 4, description: "Certificado de cronotacógrafo atualizado" },
    { code: 5, description: "Exame toxicológico atualizado" },
    { code: 6, description: "Macaco, triângulo e chave de roda" },
    { code: 7, description: "Cinto de segurança e extintor de incêndio" },
    { code: 8, description: "Funcionamento do limpador de para-brisa e água" },
    { code: 9, description: "Nível de combustível e bomba injetora" },
    { code: 10, description: "Nível de água do radiador e temperatura" },
    { code: 11, description: "Nível do óleo lubrificante e fluido de freio" },
    { code: 12, description: "Sistema elétrico, luzes do painel e bateria" },
    { code: 13, description: "Condição dos pneus, rodas e calibração" },
    { code: 14, description: "Condição geral da cabine, baú e lataria" },
    { code: 15, description: "Espelhos retrovisores e buzina" },
    { code: 16, description: "Faróis, pisca, luz de ré, seta, freio e lanternas" },
    { code: 17, description: "Faixas refletivas, luzes laterais, portas e janelas" },
    { code: 18, description: "Funcionamento do tacógrafo" },
    { code: 19, description: "Motor sem vazamento, ruídos ou fumaça" },
    { code: 20, description: "Carrinho de entrega" },
];

const makeAnswerArray = (items) =>
    items.map((it) => ({ code: it.code, answer: "", obs: "", attachments: [] }));

export default function DriverChecklist() {
    /* ───── estados principais ───── */
    const [vehicles, setVehicles] = useState([]);
    const [answers, setAnswers] = useState(makeAnswerArray(CHECKLIST_ITEMS));
    const [plateInput, setPlateInput] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    /* passo & upload */
    const [currentStep, setCurrentStep] = useState(1); // item desbloqueado
    const [uploading, setUploading] = useState({}); // {code:true|false}

    /* assinatura & ui */
    const [openSignModal, setOpenSignModal] = useState(false);
    const signatureRef = useRef(null);
    const [savedSignature, setSavedSignature] = useState(null);
    const [loading, setLoading] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const showSnackbar = (sev, msg) => {
        setSnackbarSeverity(sev);
        setSnackbarMessage(msg);
        setSnackbarOpen(true);
    };

    /* ───── carrega veículos uma vez ───── */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/vehicles");
                setVehicles(data || []);
            } catch {
                showSnackbar("error", "Falha ao carregar veículos.");
            }
        })();
    }, []);

    /* ───── upload único ───── */
    const uploadFile = async (code, file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("itemCode", code);
        const { data } = await api.post("/inspection/attachments/tmp", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        if (data?.status !== "success")
            throw new Error(`Falha no upload de ${file.name}`);
        return { attachmentId: data.attachmentId, fileName: data.fileName };
    };

    /* ───── mudanças de resposta ───── */
    const handleAnswerChange = (code, field, value) => {
        setAnswers((prev) =>
            prev.map((a) => (a.code === code ? { ...a, [field]: value } : a))
        );
    };

    /* desbloqueia próximo item quando marcar “sim” */
    useEffect(() => {
        const ans = answers.find((a) => a.code === currentStep);
        if (ans && ans.answer === "sim") setCurrentStep(currentStep + 1);
    }, [answers, currentStep]);

    /* ───── anexo imediato ───── */
    const handleItemFileChange = async (code, files) => {
        if (!files.length) return;
        setUploading((u) => ({ ...u, [code]: true }));
        try {
            const uploaded = await Promise.all(files.map((f) => uploadFile(code, f)));
            setAnswers((prev) =>
                prev.map((a) =>
                    a.code === code ? { ...a, attachments: uploaded } : a
                )
            );
            setCurrentStep(code + 1); // libera o próximo
        } catch (err) {
            showSnackbar("error", err.message);
        } finally {
            setUploading((u) => ({ ...u, [code]: false }));
        }
    };

    /* ───── submit passo 1 ───── */
    const handleSubmit = () => {
        if (answers.some((a) => a.answer === ""))
            return showSnackbar("error", "Responda todos os itens.");
        if (answers.some((a) => a.answer === "nao" && a.attachments.length === 0))
            return showSnackbar("error", 'Itens "Não" precisam de anexo.');
        if (!plateInput.trim()) return showSnackbar("error", "Informe a placa.");
        setOpenSignModal(true);
    };

    /* ───── assinatura ───── */
    const handleSaveSignature = () => {
        if (signatureRef.current?.isEmpty())
            return showSnackbar("error", "Assine antes de salvar.");
        setSavedSignature(
            signatureRef.current.getTrimmedCanvas().toDataURL("image/png")
        );
        showSnackbar("success", "Assinatura salva.");
    };
    const handleClearSignature = () => {
        signatureRef.current?.clear();
        setSavedSignature(null);
    };

    /* ───── submit passo 2 ───── */
    const handleConfirmSignature = async () => {
        if (!savedSignature)
            return showSnackbar("error", "Salve a assinatura antes de confirmar.");
        setLoading(true);
        try {
            const placa = selectedVehicle?.placa || plateInput.trim();
            const payload = {
                empresa: "298 - DISTRIBUIDORA PRINCESA",
                placa,
                signature: savedSignature,
                items: answers.map((a) => ({
                    code: a.code,
                    answer: a.answer,
                    obs: a.obs,
                    attachments: a.attachments, // já contém attachmentId
                })),
                isDecendial: false,
            };
            const { data } = await api.post("/inspection/submit", payload);
            if (data?.status !== "success") throw new Error("Falha no envio.");

            showSnackbar("success", "Checklist enviado!");
            setPlateInput("");
            setSelectedVehicle(null);
            setAnswers(makeAnswerArray(CHECKLIST_ITEMS));
            setCurrentStep(1);
        } catch (err) {
            showSnackbar("error", err.message || "Erro ao enviar checklist.");
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
                Checklist de Inspeção
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                    Empresa: 298 - DISTRIBUIDORA PRINCESA
                </Typography>
                <Typography variant="body2">
                    Relação de Itens de Inspeção do Checklist
                </Typography>
            </Paper>

            {/* placa/autocomplete */}
            <Autocomplete
                freeSolo
                value={selectedVehicle || plateInput}
                options={vehicles}
                getOptionLabel={(opt) =>
                    typeof opt === "string"
                        ? opt
                        : opt?.placa
                            ? `${opt.placa} - ${opt.marca || ""} ${opt.modelo || ""}`
                            : ""
                }
                onInputChange={(_, v) => {
                    setPlateInput(v);
                    setSelectedVehicle(null);
                }}
                onChange={(_, n) => {
                    if (typeof n === "string" || !n) {
                        setSelectedVehicle(null);
                        setPlateInput(n || "");
                    } else {
                        setSelectedVehicle(n);
                        setPlateInput(n.placa);
                    }
                }}
                renderInput={(p) => (
                    <TextField {...p} label="Placa do Veículo" sx={{ mb: 2 }} />
                )}
            />

            {/* itens */}
            {CHECKLIST_ITEMS.map((item) => {
                const ans = answers.find((a) => a.code === item.code);
                const bg =
                    ans.answer === "sim"
                        ? "#e0ffe0"
                        : ans.answer === "nao"
                            ? "#ffe0e0"
                            : "inherit";
                const disabled = item.code > currentStep;
                const isUploading = uploading[item.code];

                return (
                    <Paper
                        key={item.code}
                        sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: bg,
                            opacity: disabled ? 0.4 : 1,
                            pointerEvents: disabled ? "none" : "auto",
                        }}
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
                                    label="Sim"
                                    control={<Radio sx={{ "&.Mui-checked": { color: "green" } }} />}
                                />
                                <FormControlLabel
                                    value="nao"
                                    label="Não"
                                    control={<Radio sx={{ "&.Mui-checked": { color: "red" } }} />}
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
                            onChange={(e) =>
                                handleAnswerChange(item.code, "obs", e.target.value)
                            }
                        />

                        {ans.answer === "nao" && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Anexos obrigatórios:
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) =>
                                        handleItemFileChange(
                                            item.code,
                                            Array.from(e.target.files || [])
                                        )
                                    }
                                />
                                {isUploading && (
                                    <Typography variant="body2" color="primary">
                                        Enviando foto...
                                    </Typography>
                                )}
                                {!!ans.attachments.length && !isUploading && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {ans.attachments.map((f) => f.fileName).join(", ")}
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
                    <Box sx={{ border: "1px solid #ccc", height: 200, mb: 2 }}>
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
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Backdrop
                sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}
