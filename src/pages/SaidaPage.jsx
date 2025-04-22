// src/pages/SaidaPage.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
    Box,
    Typography,
    Button,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    IconButton,
    Divider,
    Paper,
    Chip,
    CircularProgress,
} from "@mui/material";
import {
    Add as AddIcon,
    Visibility as VisibilityIcon,
    DriveEta as DriveEtaIcon,
    Close as CloseIcon,
    Info as InfoIcon,
    Business as BusinessIcon,
    ChatBubbleOutline as ChatBubbleOutlineIcon,
    Gesture as GestureIcon,
    AttachFile as AttachFileIcon,
    PictureAsPdf as PictureAsPdfIcon,
    InsertDriveFile as InsertDriveFileIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import Autocomplete from "@mui/material/Autocomplete";

// src/pages/SaidaPage.jsx

// ───────────────────────── helpers ──────────────────────────
const apiFlask = axios.create({
    baseURL: import.meta.env.VITE_FLASK_URL ||
        "https://18aa-206-84-60-250.ngrok-free.app",
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", // pula aviso do Ngrok
    },
});


const toBase64 = (f) =>
    new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(f);
    });

const isImage = (name = "") => /\.(png|jpe?g|gif|bmp|webp)$/i.test(name);

const nowLocalISO = () => {
    const dt = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return dt.toISOString().slice(0, 16);
};

const initialSaidaForm = () => ({
    empresa: "298 DISTRIBUIDORA PRINCESA",
    departamento: "100 TRANSPORTE URBANO",
    vehicle: "",
    semiReboque: "",
    placaSemiReboque: "",
    kmSaida: 0,
    dataSaida: nowLocalISO(),
    horimetroSaida: 0,
    motorista1: "",
    motivoSaida: "",
    destino: "",
    observacoesSaida: "",
    attachments: [],
    assinaturaMotorista: "",
});

// ───────────────────────── component ─────────────────────────
export default function SaidaPage() {
    const [checklists, setChecklists] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    // detalhes
    const [openDetails, setOpenDetails] = useState(false);
    const [detailsData, setDetailsData] = useState(null);

    // visualização ampliada de anexo
    const [attachmentModal, setAttachmentModal] = useState({ open: false, file: null });

    // criação / edição
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newSaida, setNewSaida] = useState(initialSaidaForm());
    const [initialKm, setInitialKm] = useState(0);

    const [openSignature, setOpenSignature] = useState(false);
    const signatureRef = useRef(null);

    const [vehicles, setVehicles] = useState([]);
    const [motoristas, setMotoristas] = useState([]);

    const currentUserName = localStorage.getItem("fullname") || "";

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const [isSaving, setIsSaving] = useState(false);


    // ───────────────────── lifecycle ──────────────────────
    useEffect(() => {
        (async () => {
            await Promise.all([loadChecklists(), loadVehicles(), loadUsers()]);
        })();
    }, []);

    const loadChecklists = async () => {
        try {
            setLoadingList(true);
            const { data } = await apiFlask.get("/checklists/operacao");
            console.log('data', data);
            setChecklists(
                data.map((c) => ({
                    id: c.id,
                    placaVeiculo: c.veiculo?.placa,
                    motoristaNome: c.motorista?.fullname,
                    dataSaida: c.data_saida,
                    criadoPor: c.criado_por_nome,
                    status: c.status,
                }))
            );
        } catch (err) {
            console.error("Erro ao listar checklists:", err);
        } finally {
            setLoadingList(false);
        }
    };

    const loadVehicles = async () => {
        try {
            const { data } = await apiFlask.get('/vehicles/available');

            setVehicles(data);
        } catch { }
    };

    const loadUsers = async () => {
        try {
            const { data } = await apiFlask.get("/users?role=motorista");
            setMotoristas(data);
        } catch { }
    };

    // ───────────────────── handlers ──────────────────────
    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditingId(null);
        setNewSaida(initialSaidaForm());
        setInitialKm(0);
        setOpenDialog(true);
    };

    const handleOpenEdit = async (id) => {
        try {
            const { data } = await apiFlask.get(`/checklists/operacao/${id}`);
            setNewSaida({
                empresa: data.empresa,
                departamento: data.departamento,
                vehicle: data.veiculo.id,
                semiReboque: data.semi_reboque,
                placaSemiReboque: data.placa_semi_reboque,
                kmSaida: data.km_saida,
                dataSaida: data.data_saida.slice(0, 16),
                horimetroSaida: data.horimetro_saida,
                motorista1: data.motorista.id,
                motivoSaida: data.motivo_saida,
                destino: data.destino,
                observacoesSaida: data.observacoes_saida,
                attachments: [],
                assinaturaMotorista: data.assinatura_saida,
            });
            setInitialKm(data.km_saida);
            setIsEditing(true);
            setEditingId(id);
            setOpenDialog(true);
        } catch (err) {
            console.error("Erro ao carregar checklist para edição:", err);
            alert("Não foi possível carregar os dados para edição.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir este checklist?")) return;
        try {
            await apiFlask.delete(`/checklists/operacao/${id}`);
            await loadChecklists();
        } catch (err) {
            console.error("Erro ao deletar checklist:", err);
            alert("Falha ao excluir.");
        }
    };

    const handleClose = () => setOpenDialog(false);

    const handleAttachments = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length) {
            setNewSaida((p) => ({ ...p, attachments: [...p.attachments, ...files] }));
        }
    };

    // 2) handleSave: valida antes de submeter
    const handleSave = () => {
        if (!newSaida.motorista1) {
            return alert("Por favor, selecione o Motorista.");
        }
        if (!newSaida.kmSaida) {
            return alert("Por favor, informe o KM de saída.");
        }
        if (!newSaida.motivoSaida.trim()) {
            return alert("Por favor, explique o Motivo da saída.");
        }
        if (!newSaida.destino.trim()) {
            return alert("Por favor, informe o Destino.");
        }
        if (!isEditing && !newSaida.attachments.length) {
            return alert("Anexos são obrigatórios!");
        }
        if (+newSaida.kmSaida < +initialKm) {
            return alert("KM não pode ser menor que a atual.");
        }
        if (!newSaida.assinaturaMotorista.trim()) {
            setOpenSignature(true);
            return;
        }

        submitSaida(newSaida.assinaturaMotorista);


    };


    const submitSaida = async (signature) => {
        try {
            const payload = {
                veiculoId: newSaida.vehicle,
                dataSaida: newSaida.dataSaida,
                kmSaida: +newSaida.kmSaida,
                horimetroSaida: +newSaida.horimetroSaida,
                motorista1Saida: newSaida.motorista1,
                motivoSaida: newSaida.motivoSaida,
                destino: newSaida.destino,
                observacoesSaida: newSaida.observacoesSaida,
                assinaturaSaida: signature,
                empresa: newSaida.empresa,
                departamento: newSaida.departamento,
                semiReboque: newSaida.semiReboque,
                placaSemiReboque: newSaida.placaSemiReboque,
                criadoPorNome: currentUserName,
            };

            let result;
            if (isEditing) {
                result = await apiFlask.patch(
                    `/checklists/operacao/${editingId}`,
                    payload
                );
            } else {
                result = await apiFlask.post("/checklists/operacao", payload);
            }

            const id = result.data.id || result.data.objectId || editingId;
            if (!isEditing) {
                for (const file of newSaida.attachments) {
                    await apiFlask.post(`/checklists/operacao/${id}/attachments`, {
                        base64file: await toBase64(file),
                        nomeArquivo: file.name,
                        descricao: "Saída",
                    });
                }
            }

            alert(isEditing ? "Checklist atualizado!" : "Saída criada com sucesso!");
            setOpenDialog(false);
            await loadChecklists();
        } catch (err) {
            console.error(err);
            alert("Falha ao salvar.");
        } finally {
            setIsSaving(false);           // libera o botão
            // await loadChecklists();       // atualiza a lista
            // ou, se preferir recarregar a página inteira:
            window.location.reload();
        }
    };

    const handleConfirmSignature = () => {
        if (signatureRef.current.isEmpty()) {
            return alert("Assine antes de confirmar.");
        }

        setIsSaving(true);
        const sig = signatureRef.current.toDataURL();
        setNewSaida((p) => ({ ...p, assinaturaMotorista: sig }));
        setOpenSignature(false);
        submitSaida(sig);
    };

    const openDetailsDialog = async (id) => {
        try {
            const { data } = await apiFlask.get(`/checklists/operacao/${id}`);
            setDetailsData(data);
            setOpenDetails(true);
        } catch (err) {
            console.error(err);
            alert("Não foi possível obter detalhes.");
        }
    };

    // troque sua versão atual por:
    const handleOpenAttachment = async (file) => {
        try {
            // busca o blob com o header p/ pular aviso
            const res = await apiFlask.get(
                `/checklists/operacao/${file.id}/attachments/${file.nome_arquivo}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    responseType: "blob",
                }
            );
            // cria URL temporária
            const blobUrl = URL.createObjectURL(res.data);
            setAttachmentModal({ open: true, file: { ...file, blobUrl } });
        } catch (err) {
            console.error("Erro ao carregar blob:", err);
        }
    };

    const handleCloseAttachment = () =>
        setAttachmentModal({ open: false, file: null });

    // ───── sub‑components ─────
    const SectionTitle = ({ icon, text }) => (
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box sx={{ mr: 1, color: "text.secondary" }}>{icon}</Box>
            <Typography variant="subtitle1" fontWeight="bold">
                {text}
            </Typography>
        </Box>
    );

    const InfoRow = ({ label, value }) =>
        value ? (
            <Box sx={{ display: "flex", mb: 0.5 }}>
                <Typography
                    sx={{ fontWeight: "medium", width: 130, color: "text.secondary" }}
                >
                    {label}:
                </Typography>
                <Typography>{value}</Typography>
            </Box>
        ) : null;

    const ImageThumb = ({ src, alt, onClick }) => (
        <Box
            component="img"
            src={src}
            alt={alt}
            onClick={onClick}
            sx={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
                "&:hover": { boxShadow: 3 },
            }}
        />
    );

    const FileChip = ({ file }) => (
        <Chip
            icon={
                /\.pdf$/i.test(file.nome_arquivo) ? (
                    <PictureAsPdfIcon />
                ) : (
                    <InsertDriveFileIcon />
                )
            }
            label={file.nome_arquivo}
            onClick={() => window.open(file.url, "_blank", "noopener")}
            clickable
            sx={{ ".MuiChip-icon": { ml: 0.5 } }}
        />
    );

    // ───────────────────── render ──────────────────────
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Saída de Veículos
            </Typography>

            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
            >
                Nova Saída
            </Button>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Checklists Criados
            </Typography>

            {loadingList ? (
                <Typography>Carregando...</Typography>
            ) : checklists.length === 0 ? (
                <Typography>Nenhum checklist encontrado.</Typography>
            ) : (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {checklists.map((ch) => {
                        const hora = ch.dataSaida
                            ? new Date(ch.dataSaida).toLocaleString("pt-BR")
                            : "N/A";
                        return (
                            <Card key={ch.id} sx={{ width: 280, position: "relative" }}>
                                <CardContent>
                                    <Typography fontWeight="bold">
                                        Placa: {ch.placaVeiculo || "N/A"}
                                    </Typography>
                                    <Typography>Horário: {hora}</Typography>
                                    <Typography>Motorista: {ch.motoristaNome || "N/A"}</Typography>
                                    <Typography color="text.secondary">
                                        Criado por: {ch.criadoPor}
                                    </Typography>

                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={ch.status}
                                            size="small"
                                            color={
                                                ch.status === "Em trânsito"
                                                    ? "warning"
                                                    : ch.status === "Concluída"
                                                        ? "success"
                                                        : "default"
                                            }
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            display: "flex",
                                            gap: 1,
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            title="Ver detalhes"
                                            onClick={() => openDetailsDialog(ch.id)}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            title="Editar"
                                            onClick={() => handleOpenEdit(ch.id)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            title="Excluir"
                                            onClick={() => handleDelete(ch.id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>

            )}

            {/* ──────────── DIALOG NOVA / EDITAR SAÍDA ──────────── */}
            <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>{isEditing ? "Editar Checklist" : "Nova Saída"}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {/* Veículo */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={vehicles}
                                getOptionLabel={o => `${o.placa} - ${o.marca} ${o.modelo}`}
                                onChange={(_, v) => {
                                    if (v) {
                                        setNewSaida(p => ({
                                            ...p,
                                            vehicle: v.id,
                                            kmSaida: v.quilometragem || 0,
                                            horimetroSaida:
                                                v.horimetro !== undefined
                                                    ? v.horimetro
                                                    : v.quilometragem || 0,
                                        }));
                                        setInitialKm(v.quilometragem || 0);
                                    } else {
                                        setNewSaida(p => ({
                                            ...p,
                                            vehicle: "",
                                            kmSaida: 0,
                                            horimetroSaida: 0,
                                        }));
                                        setInitialKm(0);
                                    }
                                }}
                                value={vehicles.find(v => v.id === newSaida.vehicle) || null}
                                renderInput={params => (
                                    <TextField {...params} label="Veículo (Placa)" />
                                )}
                            />
                        </Grid>

                        {/* Motorista (obrigatório) */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={motoristas}
                                getOptionLabel={o => o.fullname}
                                onChange={(_, v) =>
                                    setNewSaida(p => ({ ...p, motorista1: v?.id || "" }))
                                }
                                value={motoristas.find(u => u.id === newSaida.motorista1) || null}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label="Motorista *"
                                        required
                                    />
                                )}
                            />
                        </Grid>

                        {/* Departamento */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Departamento"
                                fullWidth
                                value={newSaida.departamento}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, departamento: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Semi‑reboque */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Semi‑reboque"
                                fullWidth
                                value={newSaida.semiReboque}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, semiReboque: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Placa do Semi */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Placa do Semi"
                                fullWidth
                                value={newSaida.placaSemiReboque}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, placaSemiReboque: e.target.value })
                                }
                            />
                        </Grid>

                        {/* KM Saída (obrigatório) */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="KM Saída *"
                                type="number"
                                fullWidth
                                required
                                value={newSaida.kmSaida}
                                onChange={e => {
                                    const km = +e.target.value;
                                    if (km >= initialKm) {
                                        setNewSaida({ ...newSaida, kmSaida: km });
                                    }
                                }}
                            />
                        </Grid>

                        {/* Data/Hora de Saída */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Data/Hora de Saída"
                                type="datetime-local"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newSaida.dataSaida}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, dataSaida: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Horímetro */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Horímetro"
                                type="number"
                                fullWidth
                                value={newSaida.horimetroSaida}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, horimetroSaida: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Motivo (obrigatório) */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Motivo *"
                                fullWidth
                                required
                                value={newSaida.motivoSaida}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, motivoSaida: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Destino (obrigatório) */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Destino *"
                                fullWidth
                                required
                                value={newSaida.destino}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, destino: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Observações */}
                        <Grid item xs={12}>
                            <TextField
                                label="Observações"
                                fullWidth
                                multiline
                                minRows={2}
                                value={newSaida.observacoesSaida}
                                onChange={e =>
                                    setNewSaida({ ...newSaida, observacoesSaida: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Anexos (só no create) */}
                        {!isEditing && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">
                                    Anexos <span style={{ color: "red" }}>*</span>
                                </Typography>
                                <TextField
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleAttachments}
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>


                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving
                            ? "Salvando..."
                            : isEditing
                                ? "Atualizar"
                                : "Salvar"}
                    </Button>

                </DialogActions>
            </Dialog>

            {/* ──────────── DIALOG ASSINATURA ──────────── */}
            <Dialog
                open={openSignature}
                onClose={() => setOpenSignature(false)}
                fullScreen={fullScreen}
            >
                <DialogTitle>Assinatura do Motorista</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 2 }}>Por favor, assine abaixo:</Typography>
                    <SignatureCanvas
                        ref={signatureRef}
                        penColor="black"
                        canvasProps={{
                            width: fullScreen ? window.innerWidth - 20 : 300,
                            height: 200,
                            className: "sigCanvas",
                        }}
                    />
                    <Button onClick={() => signatureRef.current.clear()} sx={{ mt: 1 }}>
                        Limpar Assinatura
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSignature(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmSignature}
                        disabled={isSaving}
                    >
                        {isSaving ? "Salvando..." : "Confirmar"}
                    </Button>
                </DialogActions>

            </Dialog>

            {/* ──────────── DIALOG DETALHES ──────────── */}
            <Dialog
                open={openDetails}
                onClose={() => setOpenDetails(false)}
                fullWidth
                maxWidth="md"
            >
                {detailsData && (
                    <Box
                        sx={{
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <DriveEtaIcon />
                        <Typography variant="h6" flexGrow={1}>
                            {detailsData.veiculo?.placa || "Veículo"} •{" "}
                            {new Date(detailsData.data_saida).toLocaleString("pt-BR")}
                        </Typography>
                        <IconButton
                            aria-label="Fechar"
                            onClick={() => setOpenDetails(false)}
                            sx={{ color: "inherit" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                )}
                <DialogContent dividers sx={{ p: 3 }}>
                    {!detailsData ? (
                        <Box textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <SectionTitle icon={<InfoIcon />} text="Informações" />
                                        <InfoRow
                                            label="Motorista"
                                            value={detailsData.motorista?.fullname}
                                        />
                                        <InfoRow
                                            label="KM Saída"
                                            value={detailsData.km_saida}
                                        />
                                        <InfoRow
                                            label="Horímetro"
                                            value={detailsData.horimetro_saida}
                                        />
                                        <InfoRow
                                            label="Motivo"
                                            value={detailsData.motivo_saida}
                                        />
                                        <InfoRow
                                            label="Destino"
                                            value={detailsData.destino}
                                        />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <SectionTitle icon={<BusinessIcon />} text="Empresa" />
                                        <InfoRow
                                            label="Empresa"
                                            value={detailsData.empresa}
                                        />
                                        <InfoRow
                                            label="Departamento"
                                            value={detailsData.departamento}
                                        />
                                        <InfoRow
                                            label="Semi‑reboque"
                                            value={detailsData.semi_reboque}
                                        />
                                        <InfoRow
                                            label="Placa Semi"
                                            value={detailsData.placa_semi_reboque}
                                        />
                                        <InfoRow
                                            label="Criado por"
                                            value={detailsData.criado_por_nome}
                                        />
                                    </Paper>
                                </Grid>
                            </Grid>

                            {detailsData.observacoes_saida && (
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, mt: 3, bgcolor: "grey.50" }}
                                >
                                    <SectionTitle
                                        icon={<ChatBubbleOutlineIcon />}
                                        text="Observações"
                                    />
                                    <Typography whiteSpace="pre-wrap">
                                        {detailsData.observacoes_saida}
                                    </Typography>
                                </Paper>
                            )}

                            {detailsData.assinatura_saida && (
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, mt: 3, textAlign: "center" }}
                                >
                                    <SectionTitle
                                        icon={<GestureIcon />}
                                        text="Assinatura do Motorista"
                                    />
                                    <Box
                                        component="img"
                                        src={detailsData.assinatura_saida}
                                        alt="Assinatura"
                                        sx={{
                                            mt: 1,
                                            maxWidth: "100%",
                                            borderRadius: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    />
                                </Paper>
                            )}

                            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
                                <SectionTitle icon={<AttachFileIcon />} text="Anexos" />

                                {!detailsData.anexos?.length ? (
                                    <Typography>Nenhum anexo enviado.</Typography>
                                ) : (
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        {detailsData.anexos.map((a) =>
                                            isImage(a.nome_arquivo) ? (
                                                <ImageThumb
                                                    key={a.id}
                                                    src={a.url}
                                                    alt={a.nome_arquivo}
                                                    onClick={() => handleOpenAttachment(a)}
                                                />
                                            ) : (
                                                <FileChip key={a.id} file={a} />
                                            )
                                        )}
                                    </Box>
                                )}
                            </Paper>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ──────────── MODAL ANEXO GRANDE ──────────── */}
            <Dialog
                open={attachmentModal.open}
                onClose={handleCloseAttachment}
                maxWidth="lg"
                fullWidth
            >
                {attachmentModal.file && (
                    <>
                        <DialogTitle>{attachmentModal.file.nome_arquivo}</DialogTitle>
                        <DialogContent dividers sx={{ p: 0 }}>
                            {isImage(attachmentModal.file.nome_arquivo) ? (
                                <img
                                    src={attachmentModal.file.blobUrl}
                                    alt={attachmentModal.file.nome_arquivo}
                                    style={{ width: "100%", height: "auto" }}
                                />
                            ) : (
                                <iframe
                                    src={attachmentModal.file.blobUrl}
                                    title={attachmentModal.file.nome_arquivo}
                                    style={{ width: "100%", height: "80vh", border: 0 }}
                                />
                            )}
                        </DialogContent>


                    </>
                )}
            </Dialog>
        </Box>
    );
}
