// src/pages/ChegadaPage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Paper,
    Button,
    Grid,
    TextField,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stack,
    Tooltip,
    useMediaQuery,
    useTheme,
    Chip,
    Divider,
    CircularProgress,
    InputLabel,
    FormControl,
    AppBar,
    Toolbar,
    Container,
    Fab,
} from "@mui/material";
import {
    Add as AddIcon,
    CompareArrows as CompareIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    LocalShipping as OutIcon,
    DirectionsCar as InIcon,
    AccessTime as TimeIcon,
    Speed as SpeedIcon,
    Person as PersonIcon,
    Note as NoteIcon,
    Flag as FlagIcon,
    AttachFile as AttachIcon,
    BorderColor as SignatureIcon,
    Search as SearchIcon,
    Assessment as AssessmentIcon,
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import SignatureCanvas from "react-signature-canvas";

import api from "../services/apiFlask";
import {
    getSaidasEmTransito,
    getAllArrivals,
    createArrival,
    addArrivalAttachment,
    deleteArrival,
    updateArrival,
    fileToBase64,
} from "../services/arrivalService";

/* ─────────────────── helpers ─────────────────── */
const nowISO = () => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
};

const emptyForm = () => ({
    saidaId: null,
    dataChegada: nowISO(),
    horimetroChegada: 0,
    kmChegada: 0,
    motoristaId: "",
    motoristaNome: "",
    editDriver: false,
    assinaturaMotorista: "",
    observacoesChegada: "",
    attachments: [],
});

/* ─────────────────── componente ─────────────────── */
export default function ChegadaPage() {
    /* state */
    const [saidas, setSaidas] = useState([]);
    const [chegadas, setChegadas] = useState([]);
    const [motoristas, setMotoristas] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);

    /* dialogs */
    const [dlgOpen, setDlgOpen] = useState(false);
    const [sigOpen, setSigOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [cmpData, setCmpData] = useState(null);
    const [compareOpen, setCompareOpen] = useState(false);

    /* filtros */
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    /* refs e theme */
    const sigRef = useRef(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const userRole = localStorage.getItem("role") || "admin";

    /* mini card info */
    const InfoItem = ({ icon: Icon, label, value, accent = "primary" }) => (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette[accent].light}`,
            }}
        >
            <Icon sx={{ color: theme.palette[accent].main, fontSize: 28 }} />
            <Box>
                <Typography
                    variant="caption"
                    sx={{ fontWeight: "bold", color: "text.secondary", display: "block" }}
                >
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {value}
                </Typography>
            </Box>
        </Paper>
    );

    /* carregamento inicial */
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [rawSaidas, rawArrivals, users, vehicles] = await Promise.all([
                getSaidasEmTransito(),
                getAllArrivals(),
                api.get("/users?role=motorista").then((r) => r.data),
                api.get("/vehicles").then((r) => r.data),
            ]);

            setMotoristas(users);
            const placaById = Object.fromEntries(vehicles.map((v) => [v.id, v.placa]));

            /* saidas em trânsito */
            setSaidas(
                rawSaidas.map((c) => {
                    const nome = c.motorista?.fullname || "";
                    const mot = users.find((u) => u.fullname === nome) || {};
                    return {
                        id: c.id,
                        placa: c.veiculo?.placa ?? placaById[c.veiculo_id] ?? "",
                        km_saida: c.km_saida,
                        horimetro_saida: c.horimetro_saida,
                        motoristaId: mot.id || "",
                        motoristaNome: nome,
                        destino: c.destino?.nome ?? "Destino não informado",
                        checklist: c,
                    };
                })
            );

            /* chegadas */
            setChegadas(
                rawArrivals.map((a) => {
                    const cl = a.checklist || {};
                    return {
                        ...a,
                        placa: cl.veiculo?.placa ?? placaById[cl.veiculo_id] ?? "—",
                        status: "Concluída",
                        criadoPor: "Sistema",
                        checklist: cl,
                    };
                })
            );
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }

    /* helpers form */
    function fillFromSaida(rawId) {
        const id = Number(rawId); // garante número
        const s = saidas.find((x) => x.id === id);
        if (!s) return;
        setForm((f) => ({
            ...f,
            saidaId: id,
            kmChegada: s.km_saida,
            horimetroChegada: s.horimetro_saida,
            motoristaId: s.motoristaId,
            motoristaNome: s.motoristaNome,
            editDriver: false,
        }));
    }

    const fileChange = (e) =>
        setForm((f) => ({
            ...f,
            attachments: [...f.attachments, ...Array.from(e.target.files || [])],
        }));

    async function upsertArrival(sigURL) {
        const body = {
            dataChegada: form.dataChegada,
            horimetroChegada: +form.horimetroChegada,
            kmChegada: +form.kmChegada,
            motorista1Cheg: form.motoristaId,
            observacoesChegada: form.observacoesChegada,
            assinaturaMotorista: sigURL ?? form.assinaturaMotorista,
        };

        let arrivalId;
        if (editId) {
            await updateArrival(editId, body);
            arrivalId = editId;
            alert("Chegada atualizada com sucesso!");
        } else {
            arrivalId = await createArrival(form.saidaId, body);
            alert("Chegada registrada com sucesso!");
        }

        if (form.attachments.length) {
            for (const file of form.attachments) {
                await addArrivalAttachment(arrivalId, {
                    base64file: await fileToBase64(file),
                    nomeArquivo: file.name,
                    descricao: "Anexo de chegada",
                });
            }
        }

        setDlgOpen(false);
        setEditId(null);
        await loadData();
    }

    function trySave() {
        const s = saidas.find((x) => x.id === Number(form.saidaId));
        if (!editId && !s) return alert("Selecione saída válida.");
        if (!form.motoristaId) return alert("Informe o motorista.");
        if (s && Number(form.kmChegada) < Number(s.km_saida))
            return alert("KM de chegada deve ser maior que KM de saída.");
        if (!form.assinaturaMotorista) return setSigOpen(true);
        handleUpsert();
    }

    const handleUpsert = async (sigURL) => {
        setSaving(true);
        try {
            await upsertArrival(sigURL);
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar chegada.");
        } finally {
            setSaving(false);
        }
    };

    const confirmSig = async () => {
        if (sigRef.current.isEmpty()) return alert("Assine primeiro.");
        const sig = sigRef.current.toDataURL();
        setSigOpen(false);
        await handleUpsert(sig);
    };

    const confirmDelete = async (id) => {
        if (!window.confirm("Quer mesmo excluir esta chegada?")) return;
        try {
            await deleteArrival(id);
            await loadData();
            alert("Chegada excluída com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir chegada");
        }
    };

    /* filtros */
    const filteredChegadas = chegadas.filter((c) => {
        const txt =
            `${c.placa} ${c.motorista?.fullname || ""}`.toLowerCase();
        return (
            txt.includes(searchTerm.toLowerCase()) &&
            (statusFilter === "all" || c.status === statusFilter)
        );
    });

    /* ───────────────── UI ───────────────── */
    return (
        <Box sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh" }}>
            {/* HEADER */}
            <AppBar
                position="static"
                sx={{ background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
            >
                <Toolbar sx={{ py: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "rgba(255,255,255,0.15)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <ArrowBackIcon sx={{ color: "white", fontSize: 32 }} />
                        </Paper>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: "white" }}>
                                Controle de Chegada
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                Registro de retorno de veículos
                            </Typography>
                        </Box>
                    </Box>

                    {/* stats */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(10px)",
                            display: { xs: "none", md: "block" },
                        }}
                    >
                        <Grid container spacing={3} alignItems="center">
                            <Grid item>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
                                    {saidas.length}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                    Em trânsito
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
                            </Grid>
                            <Grid item>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
                                    {chegadas.length}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                    Chegadas
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Toolbar>
            </AppBar>

            {/* BODY */}
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* ações */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Chegadas Registradas
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setForm(emptyForm());
                            setEditId(null);
                            setDlgOpen(true);
                        }}
                        sx={{ background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
                    >
                        Nova Chegada
                    </Button>
                </Box>

                {/* filtros */}
                <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por placa ou motorista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="Concluída">Concluída</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* cards */}
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress size={60} />
                    </Box>
                ) : !filteredChegadas.length ? (
                    <Paper elevation={2} sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
                        <InIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                            Nenhuma chegada encontrada
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setForm(emptyForm());
                                setEditId(null);
                                setDlgOpen(true);
                            }}
                            sx={{ mt: 2, background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
                        >
                            Registrar Chegada
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {filteredChegadas.map((c) => (
                            <Grid key={c.id} item xs={12} sm={6} lg={4}>
                                <Card elevation={3} sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                            <Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}
                                                >
                                                    <InIcon />
                                                    {c.placa}
                                                </Typography>
                                                <Chip
                                                    label={c.status}
                                                    color="success"
                                                    size="small"
                                                    sx={{ mt: 1, fontWeight: 600 }}
                                                />
                                            </Box>
                                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                                <Tooltip title="Ver detalhes">
                                                    <IconButton onClick={() => setDetailData(c) || setDetailOpen(true)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Comparar">
                                                    <IconButton onClick={() => openCompareDialog(c.id)}>
                                                        <CompareIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {userRole !== "portaria" && (
                                                    <>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                onClick={() => {
                                                                    setEditId(c.id);
                                                                    setForm({
                                                                        saidaId: c.checklist.id,
                                                                        dataChegada: c.data_chegada
                                                                            ? c.data_chegada.slice(0, 16)
                                                                            : nowISO(),
                                                                        horimetroChegada: c.horimetro_chegada || 0,
                                                                        kmChegada: c.km_chegada || 0,
                                                                        motoristaId: c.motorista?.id || "",
                                                                        motoristaNome: c.motorista?.fullname || "",
                                                                        editDriver: false,
                                                                        assinaturaMotorista: c.assinatura || "",
                                                                        observacoesChegada: c.observacoes || "",
                                                                        attachments: [],
                                                                    });
                                                                    setDlgOpen(true);
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Excluir">
                                                            <IconButton onClick={() => confirmDelete(c.id)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>

                                        <Stack spacing={1}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <PersonIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                                                <Typography variant="body2" fontWeight={500}>
                                                    {c.motorista?.fullname || "—"}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <TimeIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                                                <Typography variant="body2">
                                                    {c.data_chegada
                                                        ? new Date(c.data_chegada).toLocaleString("pt-BR")
                                                        : "—"}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <SpeedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                                                <Typography variant="body2">KM: {c.km_chegada || "—"}</Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>

            {/* FAB */}
            <Fab
                color="primary"
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    display: { xs: "flex", md: "none" },
                    background: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
                }}
                onClick={() => {
                    setForm(emptyForm());
                    setEditId(null);
                    setDlgOpen(true);
                }}
            >
                <AddIcon />
            </Fab>

            {/* diálogo criação / edição */}
            <Dialog
                open={dlgOpen}
                onClose={() => setDlgOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle
                    sx={{
                        background: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <InIcon />
                        {editId ? "Editar Chegada" : "Nova Chegada"}
                    </Box>
                    <IconButton onClick={() => setDlgOpen(false)} sx={{ color: "white" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        {!editId && (
                            <FormControl fullWidth>
                                <InputLabel>Saída em Trânsito *</InputLabel>
                                <Select
                                    value={form.saidaId ?? ""}
                                    label="Saída em Trânsito *"
                                    onChange={(e) => fillFromSaida(e.target.value)}
                                    MenuProps={{ disablePortal: true, disableScrollLock: true }}
                                >
                                    {saidas.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {`${s.placa} • ${s.motoristaNome} • ${s.destino}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* motorista */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Motorista *
                            </Typography>
                            {form.editDriver ? (
                                <Autocomplete
                                    options={motoristas}
                                    getOptionLabel={(o) => o.fullname}
                                    value={motoristas.find((m) => m.id === form.motoristaId) || null}
                                    onChange={(_, v) =>
                                        setForm((f) => ({
                                            ...f,
                                            motoristaId: v?.id || "",
                                            motoristaNome: v?.fullname || "",
                                            editDriver: false,
                                        }))
                                    }
                                    renderInput={(p) => <TextField {...p} variant="outlined" />}
                                />
                            ) : (
                                <Box sx={{ position: "relative" }}>
                                    <TextField fullWidth variant="outlined" value={form.motoristaNome} InputProps={{ readOnly: true }} />
                                    <IconButton
                                        sx={{ position: "absolute", right: 8, top: 8 }}
                                        onClick={() => setForm((f) => ({ ...f, editDriver: true }))}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        {/* data/ km */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Data/Hora *"
                                    type="datetime-local"
                                    InputLabelProps={{ shrink: true }}
                                    value={form.dataChegada}
                                    onChange={(e) => setForm((f) => ({ ...f, dataChegada: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="KM Chegada *"
                                    type="number"
                                    value={form.kmChegada}
                                    onChange={(e) => setForm((f) => ({ ...f, kmChegada: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            label="Horímetro"
                            type="number"
                            value={form.horimetroChegada}
                            onChange={(e) => setForm((f) => ({ ...f, horimetroChegada: e.target.value }))}
                        />

                        <TextField
                            fullWidth
                            label="Observações"
                            multiline
                            minRows={3}
                            value={form.observacoesChegada}
                            onChange={(e) => setForm((f) => ({ ...f, observacoesChegada: e.target.value }))}
                        />

                        {/* anexos */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Anexos
                            </Typography>
                            <Button variant="outlined" component="label" startIcon={<AttachIcon />}>
                                Selecionar arquivos
                                <input hidden multiple type="file" onChange={fileChange} />
                            </Button>
                            <Typography variant="caption" sx={{ ml: 2 }}>
                                {form.attachments.length} arquivo(s) selecionado(s)
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDlgOpen(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={saving || !form.motoristaId}
                        onClick={trySave}
                        sx={{ background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
                    >
                        {saving ? "Salvando..." : editId ? "Atualizar" : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* diálogo assinatura */}
            <Dialog open={sigOpen} onClose={() => setSigOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle
                    sx={{
                        background: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <SignatureIcon />
                    Assinatura
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ mb: 2 }}>Por favor, assine abaixo:</Typography>
                    <Paper elevation={2} sx={{ p: 2, display: "inline-block" }}>
                        <SignatureCanvas
                            ref={sigRef}
                            penColor="black"
                            canvasProps={{ width: isMobile ? window.innerWidth - 80 : 400, height: 200 }}
                        />
                    </Paper>
                    <Box sx={{ mt: 2 }}>
                        <Button onClick={() => sigRef.current.clear()} disabled={saving}>
                            Limpar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setSigOpen(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={saving}
                        onClick={confirmSig}
                        sx={{ background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
                    >
                        {saving ? "Confirmando..." : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
