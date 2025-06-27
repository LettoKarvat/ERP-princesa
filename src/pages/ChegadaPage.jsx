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
    Fab
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
    FilterList as FilterIcon,
    Dashboard as DashboardIcon,
    Assessment as AssessmentIcon,
    LocalGasStation as FuelIcon,
    Build as BuildIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Menu as MenuIcon,
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon
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
    fileToBase64
} from "../services/arrivalService";

/* ─────────────────── Funções utilitárias ────────────────── */
const nowISO = () => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
};

const emptyForm = () => ({
    saidaId: "",
    dataChegada: nowISO(),
    horimetroChegada: 0,
    kmChegada: 0,
    motoristaId: "",
    motoristaNome: "",
    editDriver: false,
    assinaturaMotorista: "",
    observacoesChegada: "",
    attachments: []
});

/* ─────────────────────── Componente Principal ─────────────────────── */
export default function ChegadaPage() {
    /* Estados principais */
    const [saidas, setSaidas] = useState([]);
    const [chegadas, setChegadas] = useState([]);
    const [motoristas, setMotoristas] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);

    /* Estados de diálogos */
    const [dlgOpen, setDlgOpen] = useState(false);
    const [sigOpen, setSigOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [cmpData, setCmpData] = useState(null);
    const [compareOpen, setCompareOpen] = useState(false);

    /* Estados de filtros */
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    /* Refs, tema, etc. */
    const sigRef = useRef(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const userRole = localStorage.getItem("role") || "admin";

    /* ─────────── Mini-componente para info compacta ────────── */
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
                '&:hover': {
                    boxShadow: theme.shadows[4]
                }
            }}
        >
            <Icon sx={{ color: theme.palette[accent].main, fontSize: 28 }} />
            <Box>
                <Typography
                    variant="caption"
                    sx={{ fontWeight: "bold", color: "text.secondary", display: 'block' }}
                >
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {value}
                </Typography>
            </Box>
        </Paper>
    );

    /* Carregamento inicial */
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [rawSaidas, rawArrivals, users, vehicles] = await Promise.all([
                getSaidasEmTransito(),
                getAllArrivals(),
                api.get("/users?role=motorista").then(r => r.data),
                api.get("/vehicles").then(r => r.data)
            ]);

            setMotoristas(users);
            const placaById = Object.fromEntries(vehicles.map(v => [v.id, v.placa]));

            // Process departures in transit
            setSaidas(
                rawSaidas.map(c => {
                    const nome = c.motorista?.fullname || "";
                    const mot = users.find(u => u.fullname === nome) || {};
                    return {
                        id: c.id,
                        placa: c.veiculo?.placa ?? placaById[c.veiculo_id] ?? "",
                        km_saida: c.km_saida,
                        horimetro_saida: c.horimetro_saida,
                        motoristaId: mot.id || "",
                        motoristaNome: nome,
                        destino: c.destino?.nome ?? 'Destino não informado',
                        checklist: c
                    };
                })
            );

            // Process arrivals
            setChegadas(
                rawArrivals.map(a => {
                    const cl = a.checklist || {};
                    return {
                        ...a,
                        placa: cl.veiculo?.placa ?? placaById[cl.veiculo_id] ?? "—",
                        status: 'Concluída',
                        criadoPor: 'Sistema',
                        checklist: cl
                    };
                })
            );
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    /* ─────────────── Helpers de formulário ─────────────── */
    function fillFromSaida(id) {
        const s = saidas.find(x => x.id === parseInt(id));
        if (!s) return;
        setForm(f => ({
            ...f,
            saidaId: id,
            kmChegada: s.km_saida,
            horimetroChegada: s.horimetro_saida,
            motoristaId: s.motoristaId,
            motoristaNome: s.motoristaNome,
            editDriver: false
        }));
    }

    const fileChange = e =>
        setForm(f => ({
            ...f,
            attachments: [...f.attachments, ...Array.from(e.target.files || [])]
        }));

    async function upsertArrival(sigURL) {
        const body = {
            dataChegada: form.dataChegada,
            horimetroChegada: +form.horimetroChegada,
            kmChegada: +form.kmChegada,
            motorista1Cheg: form.motoristaId,
            observacoesChegada: form.observacoesChegada,
            assinaturaMotorista: sigURL ?? form.assinaturaMotorista
        };

        let arrivalId;
        if (editId) {
            await updateArrival(editId, body);
            arrivalId = editId;
            alert('Chegada atualizada com sucesso!');
        } else {
            arrivalId = await createArrival(form.saidaId, body);
            alert('Chegada registrada com sucesso!');
        }

        // Add attachments if any
        if (form.attachments.length > 0) {
            for (const file of form.attachments) {
                await addArrivalAttachment(arrivalId, {
                    base64file: await fileToBase64(file),
                    nomeArquivo: file.name,
                    descricao: 'Anexo de chegada'
                });
            }
        }

        setDlgOpen(false);
        setEditId(null);
        await loadData();
    }

    function trySave() {
        const s = saidas.find(x => x.id === parseInt(form.saidaId));
        if ((!s && !editId)) return alert("Selecione saída válida.");
        if (!form.motoristaId) return alert("Informe o motorista.");
        if (s && parseInt(form.kmChegada) < parseInt(s.km_saida)) {
            return alert('KM de chegada deve ser maior que KM de saída.');
        }
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

    const confirmDelete = async id => {
        if (window.confirm("Quer mesmo excluir esta chegada?")) {
            try {
                await deleteArrival(id);
                await loadData();
                alert('Chegada excluída com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir chegada');
            }
        }
    };

    const openDetailsDialog = async (id) => {
        const chegada = chegadas.find(c => c.id === id);
        if (chegada) {
            try {
                // Get detailed checklist data
                const { data: checklistData } = await api.get(`/checklists/operacao/${chegada.checklist.id}`);

                const detailsWithSaida = {
                    ...chegada,
                    saida: {
                        dataSaida: checklistData.data_saida,
                        kmSaida: checklistData.km_saida,
                        horimetroSaida: checklistData.horimetro_saida,
                        destino: checklistData.destino?.nome ?? 'Não informado'
                    }
                };

                setDetailData(detailsWithSaida);
                setDetailOpen(true);
            } catch (error) {
                console.error('Erro ao carregar detalhes:', error);
                setDetailData(chegada);
                setDetailOpen(true);
            }
        }
    };

    const openCompareDialog = async (id) => {
        const chegada = chegadas.find(c => c.id === id);
        if (chegada) {
            try {
                const { data: checklistRaw } = await api.get(`/checklists/operacao/${chegada.checklist.id}`);
                setCmpData({
                    arrival: chegada,
                    checklist: {
                        data_saida: checklistRaw.data_saida,
                        km_saida: checklistRaw.km_saida,
                        horimetro_saida: checklistRaw.horimetro_saida,
                        motoristaNome: checklistRaw.motorista?.fullname || ''
                    }
                });
                setCompareOpen(true);
            } catch (error) {
                console.error('Erro ao carregar dados de comparação:', error);
                alert('Erro ao carregar dados para comparação');
            }
        }
    };

    // Filtered arrivals
    const filteredChegadas = chegadas.filter(chegada => {
        const matchesSearch = chegada.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (chegada.motorista?.fullname || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || chegada.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    /* ──────────────────────────────────────────────────────── */
    /* ─────────────────────────── UI ────────────────────────── */
    /* ──────────────────────────────────────────────────────── */

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Header */}
            <AppBar
                position="static"
                sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: theme.shadows[4]
                }}
            >
                <Toolbar sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <ArrowBackIcon sx={{ color: 'white', fontSize: 32 }} />
                        </Paper>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                                Controle de Chegada
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Registro de retorno de veículos
                            </Typography>
                        </Box>
                    </Box>

                    {/* Stats */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            display: { xs: 'none', md: 'block' }
                        }}
                    >
                        <Grid container spacing={3} alignItems="center">
                            <Grid item>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                                    {saidas.length}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Em trânsito
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                            </Grid>
                            <Grid item>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                                    {chegadas.length}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Chegadas
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Action Buttons */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Chegadas Registradas
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setForm(emptyForm());
                            setEditId(null);
                            setDlgOpen(true);
                        }}
                        sx={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: theme.shadows[4],
                            '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                boxShadow: theme.shadows[8]
                            }
                        }}
                    >
                        Nova Chegada
                    </Button>
                </Box>

                {/* Filtros */}
                <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Buscar por placa ou motorista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
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
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="all">Todos os Status</MenuItem>
                                    <MenuItem value="Concluída">Concluída</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Lista/Cards de chegadas */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : !filteredChegadas.length ? (
                    <Paper elevation={2} sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                        <InIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                            Nenhuma chegada encontrada
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                            Registre a chegada de um veículo em trânsito
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setForm(emptyForm());
                                setEditId(null);
                                setDlgOpen(true);
                            }}
                            sx={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                px: 4,
                                py: 1.5
                            }}
                        >
                            Registrar Nova Chegada
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {filteredChegadas.map(c => (
                            <Grid item xs={12} sm={6} lg={4} key={c.id}>
                                <Card
                                    elevation={3}
                                    sx={{
                                        borderRadius: 3,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: theme.shadows[12]
                                        },
                                        position: 'relative',
                                        overflow: 'visible'
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        {/* Header do Card */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: 'primary.main',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}
                                                >
                                                    <InIcon />
                                                    {c.placa}
                                                </Typography>
                                                <Chip
                                                    label={c.status || 'Concluída'}
                                                    color="success"
                                                    size="small"
                                                    sx={{ mt: 1, fontWeight: 600 }}
                                                />
                                            </Box>

                                            {/* Menu de Ações */}
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Ver detalhes">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openDetailsDialog(c.id)}
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Comparar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openCompareDialog(c.id)}
                                                        sx={{ color: 'info.main' }}
                                                    >
                                                        <CompareIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                {userRole !== "portaria" && (
                                                    <>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setEditId(c.id);
                                                                    setForm({
                                                                        saidaId: c.checklist.id,
                                                                        dataChegada: c.data_chegada ? c.data_chegada.slice(0, 16) : nowISO(),
                                                                        horimetroChegada: c.horimetro_chegada || 0,
                                                                        kmChegada: c.km_chegada || 0,
                                                                        motoristaId: c.motorista?.id || "",
                                                                        motoristaNome: c.motorista?.fullname || "",
                                                                        editDriver: false,
                                                                        assinaturaMotorista: c.assinatura || "",
                                                                        observacoesChegada: c.observacoes || "",
                                                                        attachments: []
                                                                    });
                                                                    setDlgOpen(true);
                                                                }}
                                                                sx={{ color: 'warning.main' }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Excluir">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => confirmDelete(c.id)}
                                                                sx={{ color: 'error.main' }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Informações */}
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {c.motorista?.fullname || 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                <Typography variant="body2">
                                                    {c.data_chegada ? new Date(c.data_chegada).toLocaleString("pt-BR") : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SpeedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                <Typography variant="body2">
                                                    KM: {c.km_chegada || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Divider sx={{ my: 2 }} />

                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Criado por {c.criadoPor || 'Sistema'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>

            {/* FAB para mobile */}
            <Fab
                color="primary"
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    display: { xs: 'flex', md: 'none' },
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
                onClick={() => {
                    setForm(emptyForm());
                    setEditId(null);
                    setDlgOpen(true);
                }}
            >
                <AddIcon />
            </Fab>

            {/* ─────────────────── Dialog Criar/Editar ─────────────────── */}
            <Dialog
                open={dlgOpen}
                onClose={() => setDlgOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InIcon />
                        {editId ? "Editar Chegada" : "Nova Chegada"}
                    </Box>
                    <IconButton
                        onClick={() => setDlgOpen(false)}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        {!editId && (
                            <FormControl fullWidth>
                                <InputLabel>Saída em Trânsito *</InputLabel>
                                <Select
                                    value={form.saidaId}
                                    label="Saída em Trânsito *"
                                    onChange={e => fillFromSaida(e.target.value)}
                                >
                                    {saidas.map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {`${s.placa} • ${s.motoristaNome} • ${s.destino}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Motorista *
                            </Typography>

                            {form.editDriver ? (
                                <Autocomplete
                                    options={motoristas}
                                    getOptionLabel={o => o.fullname}
                                    value={motoristas.find(m => m.id === form.motoristaId) || null}
                                    onChange={(_, v) =>
                                        setForm({
                                            ...form,
                                            motoristaId: v?.id || "",
                                            motoristaNome: v?.fullname || "",
                                            editDriver: false
                                        })
                                    }
                                    renderInput={p => <TextField {...p} variant="outlined" />}
                                />
                            ) : (
                                <Box sx={{ position: "relative" }}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={form.motoristaNome}
                                        InputProps={{ readOnly: true }}
                                    />
                                    <IconButton
                                        sx={{ position: "absolute", right: 8, top: 8 }}
                                        onClick={() => setForm({ ...form, editDriver: true })}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Data/Hora *"
                                    type="datetime-local"
                                    InputLabelProps={{ shrink: true }}
                                    value={form.dataChegada}
                                    onChange={e => setForm({ ...form, dataChegada: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="KM Chegada *"
                                    type="number"
                                    value={form.kmChegada}
                                    onChange={e =>
                                        setForm({ ...form, kmChegada: e.target.value })
                                    }
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Horímetro"
                            type="number"
                            value={form.horimetroChegada}
                            onChange={e =>
                                setForm({ ...form, horimetroChegada: e.target.value })
                            }
                        />

                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Observações"
                            multiline
                            minRows={3}
                            value={form.observacoesChegada}
                            onChange={e =>
                                setForm({ ...form, observacoesChegada: e.target.value })
                            }
                        />

                        {/* Anexos */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Anexos
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<AttachIcon />}
                                sx={{ borderRadius: 2 }}
                            >
                                Selecionar arquivos
                                <input hidden multiple type="file" onChange={fileChange} />
                            </Button>
                            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                                {form.attachments.length} arquivo(s) selecionado(s)
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setDlgOpen(false)}
                        disabled={saving}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={trySave}
                        disabled={!form.motoristaId || saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: 2,
                            minWidth: 120
                        }}
                    >
                        {saving ? "Salvando..." : editId ? "Atualizar" : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─────────────────── Dialog Assinatura ─────────────────── */}
            <Dialog
                open={sigOpen}
                onClose={() => setSigOpen(false)}
                fullScreen={isMobile}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <SignatureIcon />
                    Assinatura
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                        Por favor, assine no campo abaixo:
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, display: 'inline-block' }}>
                        <SignatureCanvas
                            ref={sigRef}
                            penColor="black"
                            canvasProps={{
                                width: isMobile ? window.innerWidth - 80 : 400,
                                height: 200
                            }}
                        />
                    </Paper>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            onClick={() => sigRef.current?.clear()}
                            disabled={saving}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                        >
                            Limpar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setSigOpen(false)}
                        disabled={saving}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={confirmSig}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: 2
                        }}
                    >
                        {saving ? "Confirmando..." : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─────────────────── Dialog Detalhes ─────────────────── */}
            <Dialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                fullWidth
                maxWidth="lg"
                fullScreen={isMobile}
            >
                {detailData && (
                    <>
                        <DialogTitle
                            sx={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                display: "flex",
                                alignItems: "center",
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InIcon />
                                <Box>
                                    <Typography variant="h6">
                                        Detalhes — {detailData.placa}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        {detailData.data_chegada ? new Date(detailData.data_chegada).toLocaleString("pt-BR") : 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton
                                onClick={() => setDetailOpen(false)}
                                sx={{ color: 'white' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent dividers sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Informações da Chegada */}
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                                        <Typography variant="h6" sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 3,
                                            color: 'primary.main',
                                            fontWeight: 600
                                        }}>
                                            <InIcon />
                                            Informações da Chegada
                                        </Typography>
                                        <Stack spacing={2}>
                                            <InfoItem
                                                icon={PersonIcon}
                                                label="Motorista"
                                                value={detailData.motorista?.fullname || 'N/A'}
                                                accent="primary"
                                            />
                                            <InfoItem
                                                icon={SpeedIcon}
                                                label="KM Chegada"
                                                value={`${detailData.km_chegada || 'N/A'} km`}
                                                accent="success"
                                            />
                                            <InfoItem
                                                icon={TimeIcon}
                                                label="Horímetro"
                                                value={`${detailData.horimetro_chegada || 'N/A'}h`}
                                                accent="info"
                                            />
                                        </Stack>
                                    </Paper>
                                </Grid>

                                {/* Dados da Saída */}
                                {detailData.saida && (
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                                            <Typography variant="h6" sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 3,
                                                color: 'secondary.main',
                                                fontWeight: 600
                                            }}>
                                                <OutIcon />
                                                Dados da Saída
                                            </Typography>
                                            <Stack spacing={2}>
                                                <InfoItem
                                                    icon={TimeIcon}
                                                    label="Data Saída"
                                                    value={detailData.saida.dataSaida ? new Date(detailData.saida.dataSaida).toLocaleString("pt-BR") : 'N/A'}
                                                    accent="secondary"
                                                />
                                                <InfoItem
                                                    icon={SpeedIcon}
                                                    label="KM Saída"
                                                    value={`${detailData.saida.kmSaida || 'N/A'} km`}
                                                    accent="warning"
                                                />
                                                <InfoItem
                                                    icon={FlagIcon}
                                                    label="Destino"
                                                    value={detailData.saida.destino || 'N/A'}
                                                    accent="info"
                                                />
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Resumo da Viagem */}
                                {detailData.saida && (
                                    <Grid item xs={12}>
                                        <Paper
                                            elevation={2}
                                            sx={{
                                                p: 3,
                                                borderRadius: 3,
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                                border: '1px solid rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            <Typography variant="h6" sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 3,
                                                color: 'success.main',
                                                fontWeight: 600
                                            }}>
                                                <AssessmentIcon />
                                                Resumo da Viagem
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h4" sx={{
                                                            fontWeight: 700,
                                                            color: 'success.main',
                                                            mb: 1
                                                        }}>
                                                            {(detailData.km_chegada || 0) - (detailData.saida.kmSaida || 0)}
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                            Quilômetros percorridos
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h4" sx={{
                                                            fontWeight: 700,
                                                            color: 'info.main',
                                                            mb: 1
                                                        }}>
                                                            {(detailData.horimetro_chegada || 0) - (detailData.saida.horimetroSaida || 0)}
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                            Horas de operação
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Observações */}
                                {detailData.observacoes && (
                                    <Grid item xs={12}>
                                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                                            <Typography variant="h6" sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 2,
                                                color: 'warning.main',
                                                fontWeight: 600
                                            }}>
                                                <NoteIcon />
                                                Observações
                                            </Typography>
                                            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                                                {detailData.observacoes}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Assinatura */}
                                {detailData.assinatura && (
                                    <Grid item xs={12}>
                                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                                            <Typography variant="h6" sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 1,
                                                mb: 3,
                                                color: 'success.main',
                                                fontWeight: 600
                                            }}>
                                                <SignatureIcon />
                                                Assinatura
                                            </Typography>
                                            <Box
                                                component="img"
                                                src={detailData.assinatura}
                                                alt="assinatura"
                                                sx={{
                                                    maxWidth: "100%",
                                                    borderRadius: 2,
                                                    border: "2px solid",
                                                    borderColor: 'divider',
                                                    boxShadow: theme.shadows[2]
                                                }}
                                            />
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Anexos */}
                                <Grid item xs={12}>
                                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                                        <Typography variant="h6" sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 3,
                                            color: 'primary.main',
                                            fontWeight: 600
                                        }}>
                                            <AttachIcon />
                                            Anexos
                                        </Typography>

                                        {!detailData.anexos?.length ? (
                                            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                                                Nenhum anexo disponível.
                                            </Typography>
                                        ) : (
                                            <Grid container spacing={2}>
                                                {detailData.anexos.map(ar => (
                                                    <Grid item xs={6} sm={4} md={3} key={ar.id}>
                                                        {/\.(jpe?g|png|gif)$/i.test(ar.nome_arquivo) ? (
                                                            <Box
                                                                component="img"
                                                                src={ar.url}
                                                                alt={ar.nome_arquivo}
                                                                sx={{
                                                                    width: "100%",
                                                                    borderRadius: 2,
                                                                    boxShadow: theme.shadows[2]
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label={ar.nome_arquivo}
                                                                clickable
                                                                onClick={() =>
                                                                    window.open(ar.url, "_blank")
                                                                }
                                                                sx={{ width: '100%' }}
                                                            />
                                                        )}
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ p: 3 }}>
                            <Button
                                onClick={() => setDetailOpen(false)}
                                variant="contained"
                                sx={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderRadius: 2
                                }}
                            >
                                Fechar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ─────────────── Dialog Comparação ─────────────── */}
            <Dialog
                open={compareOpen}
                onClose={() => {
                    setCompareOpen(false);
                    setCmpData(null);
                }}
                fullWidth
                maxWidth="md"
                fullScreen={isMobile}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                        color: 'white',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CompareIcon />
                        Comparar Saída × Chegada
                    </Box>
                    <IconButton
                        onClick={() => {
                            setCompareOpen(false);
                            setCmpData(null);
                        }}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                {cmpData && (
                    <DialogContent dividers sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {/* Saída */}
                            <Grid item xs={12} md={6}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 3,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        height: '100%'
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mb: 3,
                                            color: 'primary.main',
                                            fontWeight: 600
                                        }}
                                    >
                                        <OutIcon />
                                        Saída
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TimeIcon sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {new Date(cmpData.checklist.data_saida).toLocaleString("pt-BR")}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                KM: {cmpData.checklist.km_saida}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon sx={{ color: 'text.secondary', transform: "rotate(90deg)" }} />
                                            <Typography variant="body2">
                                                Horímetro: {cmpData.checklist.horimetro_saida}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PersonIcon sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {cmpData.checklist.motoristaNome}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>

                            {/* Chegada */}
                            <Grid item xs={12} md={6}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 3,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        height: '100%'
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mb: 3,
                                            color: 'success.main',
                                            fontWeight: 600
                                        }}
                                    >
                                        <InIcon />
                                        Chegada
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TimeIcon sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {new Date(cmpData.arrival.data_chegada).toLocaleString("pt-BR")}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                KM: {cmpData.arrival.km_chegada}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon sx={{ color: 'text.secondary', transform: "rotate(90deg)" }} />
                                            <Typography variant="body2">
                                                Horímetro: {cmpData.arrival.horimetro_chegada}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PersonIcon sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {cmpData.arrival.motorista?.fullname}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>

                            {/* Resumo */}
                            <Grid item xs={12}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 3,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                                        border: '1px solid rgba(245, 158, 11, 0.2)'
                                    }}
                                >
                                    <Typography variant="h6" sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 3,
                                        color: 'warning.main',
                                        fontWeight: 600
                                    }}>
                                        <AssessmentIcon />
                                        Resumo da Viagem
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h4" sx={{
                                                    fontWeight: 700,
                                                    color: 'success.main',
                                                    mb: 1
                                                }}>
                                                    {cmpData.arrival.km_chegada - cmpData.checklist.km_saida}
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                    Quilômetros percorridos
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h4" sx={{
                                                    fontWeight: 700,
                                                    color: 'info.main',
                                                    mb: 1
                                                }}>
                                                    {cmpData.arrival.horimetro_chegada - cmpData.checklist.horimetro_saida}
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                    Horas de operação
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                )}

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => {
                            setCompareOpen(false);
                            setCmpData(null);
                        }}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                            borderRadius: 2
                        }}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}