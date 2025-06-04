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

/* ───────────────────────── state helpers ───────────────────────── */
const makeAnswerArray = (items) =>
    items.map((it) => ({
        code: it.code,
        answer: "",
        obs: "",
        attachments: [],
    }));

function DriverChecklist() {
    /* ──────────────── data state ──────────────── */
    const [items, setItems] = useState([]);                 // ← checklist vindo do backend
    const [answers, setAnswers] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    /* ─────────── placa / veículo selecionado ─────────── */
    const [plateInput, setPlateInput] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    /* ─────────── assinatura & controles ─────────── */
    const [openSignModal, setOpenSignModal] = useState(false);
    const signatureRef = useRef(null);
    const [savedSignature, setSavedSignature] = useState(null);

    /* ─────────── feedback & loading ─────────── */
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [loading, setLoading] = useState(false);

    /* ─────────────────────── effects ─────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const [vRes, iRes] = await Promise.all([
                    api.get("/vehicles"),
                    api.get("/inspection/items"),              // ← novo endpoint
                ]);
                setVehicles(vRes.data || []);
                setItems(iRes.data || []);
                setAnswers(makeAnswerArray(iRes.data || []));
            } catch (err) {
                console.error(err);
                showSnackbar("error", "Falha ao carregar dados iniciais.");
            }
        })();
    }, []);

    /* ─────────────────────── helpers ─────────────────────── */
    const showSnackbar = (severity, message) => {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    const handleCloseSnackbar = () => setSnackbarOpen(false);

    const handleAnswerChange = (code, field, value) =>
        setAnswers((prev) =>
            prev.map((ans) => (ans.code === code ? { ...ans, [field]: value } : ans)),
        );

    const handleItemFileChange = (code, files) =>
        handleAnswerChange(code, "attachments", files);

    /* ─────────────────────── submit (step-1) ─────────────────────── */
    const handleSubmit = () => {
        if (answers.some((a) => a.answer === ""))
            return showSnackbar("error", "Responda todos os itens.");
        if (
            answers.some(
                (a) => a.answer === "nao" && (!a.attachments || a.attachments.length === 0),
            )
        )
            return showSnackbar(
                "error",
                'Itens marcados como "Não" precisam de pelo menos um anexo.',
            );
        if (!plateInput.trim()) return showSnackbar("error", "Informe a placa.");
        setOpenSignModal(true);
    };

    /* ───────────────────── assinatura − modal ───────────────────── */
    const handleSaveSignature = () => {
        if (signatureRef.current?.isEmpty())
            return showSnackbar("error", "Assine antes de salvar.");
        setSavedSignature(
            signatureRef.current.getTrimmedCanvas().toDataURL("image/png"),
        );
        showSnackbar("success", "Assinatura salva.");
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

    /* ─────────────────── upload anexos tmp ─────────────────── */
    const uploadAttachments = async () => {
        const result = {};
        for (const ans of answers) {
            if (ans.answer === "nao" && ans.attachments.length) {
                result[ans.code] = [];
                for (const f of ans.attachments) {
                    const fd = new FormData();
                    fd.append("file", f);
                    fd.append("itemCode", ans.code);
                    const { data } = await api.post("/inspection/attachments/tmp", fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    if (data?.status !== "success")
                        throw new Error(`Falha no upload de ${f.name}`);
                    result[ans.code].push({
                        attachmentId: data.attachmentId,
                        fileName: data.fileName,
                    });
                }
            }
        }
        return result;
    };

    /* ─────────────────── submit (step-2) ─────────────────── */
    const handleConfirmSignature = async () => {
        if (!savedSignature)
            return showSnackbar("error", "Salve a assinatura antes de confirmar.");

        setLoading(true);
        try {
            const tmpIds = await uploadAttachments();
            const placaFinal = selectedVehicle?.placa || plateInput.trim();

            const payload = {
                empresa: "298 - DISTRIBUIDORA PRINCESA",
                placa: placaFinal,
                signature: savedSignature,
                items: answers.map((a) => ({
                    code: a.code,
                    answer: a.answer,
                    obs: a.obs,
                    attachments: tmpIds[a.code] || [],
                })),
            };

            const { data } = await api.post("/inspection/submit", payload);
            if (data?.status !== "success")
                throw new Error("Falha no envio do checklist.");

            showSnackbar("success", "Checklist enviado com sucesso!");
            /* reset */
            setPlateInput("");
            setSelectedVehicle(null);
            setAnswers(makeAnswerArray(items));
        } catch (err) {
            console.error(err);
            showSnackbar("error", err.message || "Erro no envio.");
        } finally {
            setLoading(false);
            setOpenSignModal(false);
            setSavedSignature(null);
        }
    };

    /* ─────────────────────────── UI ─────────────────────────── */
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

            {/* Placa / Autocomplete */}
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
                    <TextField
                        {...p}
                        label="Placa do Veículo"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                )}
            />

            {/* Itens */}
            {items.map((item) => {
                const ans = answers.find((a) => a.code === item.code) || {};
                const bg =
                    ans.answer === "sim"
                        ? "#e0ffe0"
                        : ans.answer === "nao"
                            ? "#ffe0e0"
                            : "inherit";

                return (
                    <Paper
                        key={item.code}
                        sx={{ p: 2, mb: 2, backgroundColor: bg, transition: "background .3s" }}
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
                                            Array.from(e.target.files || []),
                                        )
                                    }
                                />
                                {!!ans.attachments?.length && (
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

            {/* Assinatura */}
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
                            canvasProps={{
                                width: 500,
                                height: 200,
                                style: { background: "#fff" },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Button
                            onClick={handleClearSignature}
                            variant="outlined"
                            disabled={loading}
                        >
                            Limpar
                        </Button>
                        <Button
                            onClick={handleSaveSignature}
                            variant="outlined"
                            disabled={loading}
                        >
                            Salvar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSignModal} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmSignature}
                        disabled={loading}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar & Backdrop */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
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

export default DriverChecklist;
