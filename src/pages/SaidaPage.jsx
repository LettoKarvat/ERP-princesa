/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from 'react';
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
    Paper,
    Chip,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    InputAdornment,
    Autocomplete,
    Container,
    Avatar,
    Drawer,
    ListItemIcon,
    ListItemButton,
    Fab,
    CardActions,
} from '@mui/material';
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
    LocationOn as LocationOnIcon,
    MyLocation as MyLocationIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Save as SaveIcon,
    Clear as ClearIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    DirectionsCar as DirectionsCarIcon,
    Assignment as AssignmentIcon,
    BarChart as BarChartIcon,
    People as PeopleIcon,
    LocalGasStation as LocalGasStationIcon,
    Build as BuildIcon,
    ExitToApp as ExitToAppIcon,
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    ChecklistRtl as ChecklistRtlIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import api from '../services/apiFlask';

/* ───────── helpers ───────── */
const toBase64 = (file) =>
    new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });

const isImage = (name = '') => /\.(png|jpe?g|gif|bmp|webp)$/i.test(name);

const nowLocalISO = () => {
    const dt = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return dt.toISOString().slice(0, 16);
};

const initialSaidaForm = () => ({
    empresa: '298 DISTRIBUIDORA PRINCESA',
    departamento: '100 TRANSPORTE URBANO',
    vehicle: '',
    semiReboque: '',
    placaSemiReboque: '',
    kmSaida: 0,
    dataSaida: nowLocalISO(),
    horimetroSaida: 0,
    motorista1: '',
    motivoSaida: '',
    origem: '',
    destino: '',
    observacoesSaida: '',
    attachments: [],
    assinaturaMotorista: '',
});

/* ───────── sidebar ───────── */
const Sidebar = ({ open, onClose }) => {
    const [expanded, setExpanded] = useState({});
    const toggle = (k) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

    const items = [
        { icon: DashboardIcon, label: 'Dashboard' },
        { icon: DirectionsCarIcon, label: 'Veículos' },
        {
            icon: ChecklistRtlIcon,
            label: 'Controle de Portaria',
            active: true,
            submenu: ['Checklist Decendial'],
        },
        { icon: BarChartIcon, label: 'Consumo' },
        { icon: LocalGasStationIcon, label: 'Abastecimento' },
        { icon: BuildIcon, label: 'Troca de Peças' },
        { icon: PeopleIcon, label: 'Usuários' },
        { icon: AssignmentIcon, label: 'Checklist Diário' },
    ];

    return (
        <Drawer
            variant="temporary"
            anchor="left"
            open={open}
            onClose={onClose}
            sx={{ '& .MuiDrawer-paper': { width: 280, bgcolor: '#1e293b', color: 'white', borderRight: 'none' } }}
        >
            {/* logo */}
            <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 32, bgcolor: '#dc2626', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            P
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Princesa
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            do Pará
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* items */}
            <List sx={{ p: 2, flexGrow: 1 }}>
                {items.map((it) => (
                    <Box key={it.label}>
                        <ListItemButton
                            onClick={() => it.submenu && toggle(it.label)}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                bgcolor: it.active ? '#2563eb' : 'transparent',
                                color: it.active ? 'white' : '#cbd5e1',
                                '&:hover': { bgcolor: it.active ? '#2563eb' : '#334155', color: 'white' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                <it.icon />
                            </ListItemIcon>
                            <ListItemText primary={it.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                            {it.submenu && (expanded[it.label] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                        </ListItemButton>

                        {it.submenu && expanded[it.label] && (
                            <List sx={{ pl: 4, py: 0 }}>
                                {it.submenu.map((sub) => (
                                    <ListItemButton
                                        key={sub}
                                        sx={{ borderRadius: 2, mb: 0.5, color: '#94a3b8', '&:hover': { bgcolor: '#334155', color: 'white' } }}
                                    >
                                        <ListItemText primary={sub} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                    </Box>
                ))}
            </List>

            {/* bottom */}
            <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
                <ListItemButton sx={{ borderRadius: 2, color: '#cbd5e1', '&:hover': { bgcolor: '#334155', color: 'white' } }}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                        <ExitToAppIcon />
                    </ListItemIcon>
                    <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.875rem' }} />
                </ListItemButton>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#64748b', mt: 1 }}>
                    Suporte
                </Typography>
            </Box>
        </Drawer>
    );
};

/* ───────── signature pad ───────── */
const SignaturePad = ({ onSave, onClear, onCancel }) => {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);

    const start = (e) => {
        setDrawing(true);
        const c = canvasRef.current;
        const r = c.getBoundingClientRect();
        const ctx = c.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };
    const draw = (e) => {
        if (!drawing) return;
        const c = canvasRef.current;
        const r = c.getBoundingClientRect();
        const ctx = c.getContext('2d');
        ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
        ctx.stroke();
    };
    const stop = () => setDrawing(false);
    const clear = () => {
        const c = canvasRef.current;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        onClear?.();
    };
    const save = () => onSave?.(canvasRef.current.toDataURL());

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, border: '2px dashed #ccc', borderRadius: 2 }}>
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    style={{ border: '1px solid #ddd', borderRadius: 4, cursor: 'crosshair', width: '100%', maxWidth: 400 }}
                    onMouseDown={start}
                    onMouseMove={draw}
                    onMouseUp={stop}
                    onMouseLeave={stop}
                />
            </Paper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={clear} startIcon={<ClearIcon />} variant="outlined">
                    Limpar
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onCancel} variant="outlined">
                        Cancelar
                    </Button>
                    <Button onClick={save} variant="contained" startIcon={<SaveIcon />} sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                        Confirmar
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

/* ───────── page ───────── */
export default function VehicleDepartureSystem() {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    /* ---------- state ---------- */
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [checklists, setChecklists] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [origins, setOrigins] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const [openDialog, setOpenDialog] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
    const [openOriginModal, setOpenOriginModal] = useState(false);
    const [openDestinationModal, setOpenDestinationModal] = useState(false);
    const [openSignature, setOpenSignature] = useState(false);
    const [attachmentModal, setAttachmentModal] = useState({ open: false, file: null });

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newSaida, setNewSaida] = useState(initialSaidaForm());
    const [initialKm, setInitialKm] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [detailsData, setDetailsData] = useState(null);

    const [newOrigin, setNewOrigin] = useState('');
    const [newDestination, setNewDestination] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const currentUserName = localStorage.getItem('fullname') || '';
    const userRole = localStorage.getItem('role') || 'admin';

    /* ---------- load ---------- */
    useEffect(() => {
        (async () => {
            await Promise.all([
                loadChecklists(),
                loadVehicles(),
                loadDrivers(),
                loadOrigins(),
                loadDestinations(),
            ]);
        })();
    }, []);

    const loadChecklists = async () => {
        setLoadingList(true);
        try {
            const { data } = await api.get('/checklists/operacao');
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
            console.error(err);
        } finally {
            setLoadingList(false);
        }
    };

    const loadVehicles = async () => {
        try {
            const { data } = await api.get('/vehicles/available');
            setVehicles(data);
        } catch { }
    };
    const loadDrivers = async () => {
        try {
            const { data } = await api.get('/users?role=motorista');
            setDrivers(data);
        } catch { }
    };
    const loadOrigins = async () => {
        try {
            const { data } = await api.get('/departures/origins');
            setOrigins(data);
        } catch { }
    };
    const loadDestinations = async () => {
        try {
            const { data } = await api.get('/departures/reasons');
            setDestinations(data);
        } catch { }
    };

    /* ---------- CRUD ---------- */
    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditingId(null);
        setNewSaida(initialSaidaForm());
        setInitialKm(0);
        setOpenDialog(true);
    };

    const handleOpenEdit = async (id) => {
        try {
            const { data } = await api.get(`/checklists/operacao/${id}`);
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
                origem: data.origem.id,
                destino: data.destino.id,
                observacoesSaida: data.observacoes_saida,
                attachments: [],
                assinaturaMotorista: data.assinatura_saida,
            });
            setInitialKm(data.km_saida);
            setIsEditing(true);
            setEditingId(id);
            setOpenDialog(true);
        } catch (err) {
            console.error(err);
            alert('Não foi possível carregar para edição.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente excluir este checklist?')) return;
        try {
            await api.delete(`/checklists/operacao/${id}`);
            await loadChecklists();
        } catch (err) {
            console.error(err);
            alert('Falha ao excluir.');
        }
    };

    const handleAttachments = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length) {
            setNewSaida((p) => ({ ...p, attachments: [...p.attachments, ...files] }));
        }
    };

    const handleSave = () => {
        if (!newSaida.motorista1) return alert('Selecione o Motorista.');
        if (!newSaida.kmSaida) return alert('Informe o KM de saída.');
        if (!newSaida.motivoSaida.trim()) return alert('Explique o Motivo.');
        if (!newSaida.origem) return alert('Selecione a Origem.');
        if (!newSaida.destino) return alert('Selecione o Destino.');
        // anexos agora são opcionais
        if (+newSaida.kmSaida < +initialKm) return alert('KM não pode ser menor.');
        if (!newSaida.assinaturaMotorista.trim()) {
            setOpenSignature(true);
            return;
        }
        submitSaida(newSaida.assinaturaMotorista);
    };

    const submitSaida = async (signature) => {
        setIsSaving(true);
        try {
            const payload = {
                veiculoId: newSaida.vehicle,
                dataSaida: newSaida.dataSaida,
                kmSaida: +newSaida.kmSaida,
                horimetroSaida: +newSaida.horimetroSaida,
                motorista1Saida: newSaida.motorista1,
                motivoSaida: newSaida.motivoSaida,
                origemId: newSaida.origem,
                destinoId: newSaida.destino,
                observacoesSaida: newSaida.observacoesSaida,
                assinaturaSaida: signature,
                empresa: newSaida.empresa,
                departamento: newSaida.departamento,
                semiReboque: newSaida.semiReboque,
                placaSemiReboque: newSaida.placaSemiReboque,
                criadoPorNome: currentUserName,
            };

            let res;
            if (isEditing) res = await api.patch(`/checklists/operacao/${editingId}`, payload);
            else res = await api.post('/checklists/operacao', payload);

            const cid = res.data.id || editingId;
            if (!isEditing && newSaida.attachments.length) {
                for (const file of newSaida.attachments) {
                    await api.post(`/checklists/operacao/${cid}/attachments`, {
                        base64file: await toBase64(file),
                        nomeArquivo: file.name,
                        descricao: 'Saída',
                    });
                }
            }

            alert(isEditing ? 'Checklist atualizado!' : 'Saída criada com sucesso!');
            setOpenDialog(false);
            await loadChecklists();
        } catch (err) {
            console.error(err);
            alert('Falha ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const signatureRef = useRef(null);
    const handleConfirmSignature = () => {
        if (signatureRef.current.isEmpty()) return alert('Assine antes de confirmar.');
        const sig = signatureRef.current.toDataURL();
        setNewSaida((p) => ({ ...p, assinaturaMotorista: sig }));
        setOpenSignature(false);
        submitSaida(sig);
    };

    const openDetailsDialog = async (id) => {
        try {
            const { data } = await api.get(`/checklists/operacao/${id}`);
            setDetailsData(data);
            setOpenDetails(true);
        } catch (err) {
            console.error(err);
            alert('Não foi possível obter detalhes.');
        }
    };

    /* ---------- origin/dest CRUD ---------- */
    const handleAddOrigin = async () => {
        if (!newOrigin.trim()) return;
        try {
            await api.post('/departures/origins', { nome: newOrigin.trim() });
            setNewOrigin('');
            await loadOrigins();
            setOpenOriginModal(false);
        } catch {
            alert('Falha ao criar origem.');
        }
    };
    const handleDeleteOrigin = async (id) => {
        try {
            await api.delete(`/departures/origins/${id}`);
            await loadOrigins();
        } catch { }
    };
    const handleAddDestination = async () => {
        if (!newDestination.trim()) return;
        try {
            await api.post('/departures/reasons', { nome: newDestination.trim() });
            setNewDestination('');
            await loadDestinations();
            setOpenDestinationModal(false);
        } catch {
            alert('Falha ao criar destino.');
        }
    };
    const handleDeleteDestination = async (id) => {
        try {
            await api.delete(`/departures/reasons/${id}`);
            await loadDestinations();
        } catch { }
    };

    /* ---------- filters ---------- */
    const filtered = checklists.filter(
        (c) =>
            (c.placaVeiculo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.motoristaNome?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (statusFilter === 'all' || c.status === statusFilter)
    );

    /* ---------- render ---------- */
    return (
        <Box sx={{ flexGrow: 1, bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex' }}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <Box sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box sx={{ background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)', color: 'white' }}>
                    <Box sx={{ px: 4, py: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                            <IconButton onClick={() => setSidebarOpen(true)} sx={{ display: { xs: 'block', md: 'none' }, color: 'white', mr: 2 }}>
                                <MenuIcon />
                            </IconButton>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(59,130,246,0.3)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                                    <DriveEtaIcon sx={{ fontSize: 32, color: 'rgba(219,234,254,0.9)' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Controle de Saída
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'rgba(219,234,254,0.8)' }}>
                                        Controle completo de veículos
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: { xs: 'none', lg: 'block' },
                                    bgcolor: 'rgba(59,130,246,0.2)',
                                    borderRadius: 3,
                                    p: 3,
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(219,234,254,0.9)' }}>
                                            {checklists.filter((c) => c.status === 'Em trânsito').length}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(219,234,254,0.7)' }}>
                                            Em trânsito
                                        </Typography>
                                    </Box>
                                    <Box sx={{ width: 1, height: 32, bgcolor: 'rgba(59,130,246,0.3)' }} />
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'rgba(219,234,254,0.9)' }}>
                                            {checklists.filter((c) => c.status === 'Concluída').length}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(219,234,254,0.7)' }}>
                                            Concluídas
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Button
                                onClick={handleOpenCreate}
                                variant="contained"
                                startIcon={<AddIcon />}
                                sx={{
                                    bgcolor: 'white',
                                    color: '#2563eb',
                                    fontWeight: 600,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3,
                                    boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
                                    '&:hover': { bgcolor: 'rgba(219,234,254,0.9)', transform: 'translateY(-1px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
                                }}
                            >
                                Registrar Nova Saída
                            </Button>

                        </Box>
                    </Box>
                </Box>

                {/* Content */}
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    {/* Quick Actions */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Button
                                onClick={() => setOpenOriginModal(true)}
                                variant="contained"
                                startIcon={<LocationOnIcon />}
                                sx={{ bgcolor: '#475569', color: 'white', px: 3, py: 1.5, borderRadius: 3, '&:hover': { bgcolor: '#334155' } }}
                            >
                                Gerenciar Origens
                            </Button>
                            <Button
                                onClick={() => setOpenDestinationModal(true)}
                                variant="contained"
                                startIcon={<MyLocationIcon />}
                                sx={{ bgcolor: '#475569', color: 'white', px: 3, py: 1.5, borderRadius: 3, '&:hover': { bgcolor: '#334155' } }}
                            >
                                Gerenciar Destinos
                            </Button>
                        </Box>
                    </Box>

                    {/* Filters */}
                    <Paper sx={{ p: 4, mb: 4, bgcolor: '#475569', color: 'white', borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    placeholder="Buscar por placa ou motorista..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: '#94a3b8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: '#334155',
                                            color: 'white',
                                            borderRadius: 3,
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                                        },
                                    }}
                                    sx={{ '& .MuiInputBase-input::placeholder': { color: '#94a3b8' } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#94a3b8' }}>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        startAdornment={<FilterListIcon sx={{ mr: 1, color: '#94a3b8' }} />}
                                        sx={{
                                            bgcolor: '#334155',
                                            color: 'white',
                                            borderRadius: 3,
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                                        }}
                                    >
                                        <MenuItem value="all">Todos os Status</MenuItem>
                                        <MenuItem value="Em trânsito">Em Trânsito</MenuItem>
                                        <MenuItem value="Concluída">Concluída</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Grid */}
                    {loadingList ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress size={60} sx={{ color: '#2563eb' }} />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                            <Avatar sx={{ bgcolor: '#e2e8f0', width: 96, height: 96, mx: 'auto', mb: 3 }}>
                                <DriveEtaIcon sx={{ fontSize: 48, color: '#64748b' }} />
                            </Avatar>
                            <Typography variant="h5" sx={{ color: '#475569', mb: 2, fontWeight: 600 }}>
                                Nenhum checklist encontrado
                            </Typography>
                            <Typography sx={{ color: '#64748b', mb: 4 }}>Comece registrando uma nova saída de veículo</Typography>
                            <Button
                                onClick={handleOpenCreate}
                                variant="contained"
                                startIcon={<AddIcon />}
                                sx={{
                                    bgcolor: '#2563eb',
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3,
                                    boxShadow: '0 10px 25px -3px rgba(37,99,235,0.3)',
                                    '&:hover': {
                                        bgcolor: '#1d4ed8',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 20px 25px -5px rgba(37,99,235,0.4)',
                                    },
                                }}
                            >
                                Registrar Nova Saída
                            </Button>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {filtered.map((checklist) => (
                                <Grid item xs={12} sm={6} lg={4} key={checklist.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            bgcolor: '#475569',
                                            color: 'white',
                                            borderRadius: 3,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                <Avatar sx={{ bgcolor: '#2563eb', mr: 2, width: 48, height: 48 }}>
                                                    <DirectionsCarIcon />
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {checklist.placaVeiculo}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                                                        {new Date(checklist.dataSaida).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ mb: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                    <PersonIcon sx={{ fontSize: 16, mr: 1, color: '#cbd5e1' }} />
                                                    <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                                                        {checklist.motoristaNome}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                    <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: '#cbd5e1' }} />
                                                    <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                                                        {new Date(checklist.dataSaida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label={checklist.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor:
                                                            checklist.status === 'Em trânsito'
                                                                ? 'rgba(245,158,11,0.2)'
                                                                : checklist.status === 'Concluída'
                                                                    ? 'rgba(34,197,94,0.2)'
                                                                    : 'rgba(148,163,184,0.2)',
                                                        color:
                                                            checklist.status === 'Em trânsito'
                                                                ? '#fbbf24'
                                                                : checklist.status === 'Concluída'
                                                                    ? '#22c55e'
                                                                    : '#94a3b8',
                                                        border: `1px solid ${checklist.status === 'Em trânsito'
                                                            ? 'rgba(245,158,11,0.3)'
                                                            : checklist.status === 'Concluída'
                                                                ? 'rgba(34,197,94,0.3)'
                                                                : 'rgba(148,163,184,0.3)'
                                                            }`,
                                                        fontWeight: 500,
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    por {checklist.criadoPor}
                                                </Typography>
                                            </Box>
                                        </CardContent>

                                        <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 2, px: 3 }}>
                                            <IconButton
                                                size="small"
                                                title="Ver detalhes"
                                                sx={{ color: '#cbd5e1', '&:hover': { bgcolor: '#334155' } }}
                                                onClick={() => openDetailsDialog(checklist.id)}
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            {userRole !== 'portaria' && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        title="Editar"
                                                        sx={{ color: '#60a5fa', '&:hover': { bgcolor: '#334155' } }}
                                                        onClick={() => handleOpenEdit(checklist.id)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        title="Excluir"
                                                        sx={{ color: '#f87171', '&:hover': { bgcolor: '#334155' } }}
                                                        onClick={() => handleDelete(checklist.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* FAB */}
                    <Fab
                        color="primary"
                        aria-label="add"
                        onClick={handleOpenCreate}
                        sx={{ position: 'fixed', bottom: 24, right: 24, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                        <AddIcon />
                    </Fab>
                </Container>
            </Box>

            {/* ───────── Origin Modal ───────── */}
            <Dialog
                open={openOriginModal}
                onClose={() => setOpenOriginModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { bgcolor: '#475569', color: 'white', borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #334155' }}>
                    <LocationOnIcon />
                    Gerenciar Origens
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: '#334155' }}>
                    <TextField
                        fullWidth
                        label="Nova origem"
                        value={newOrigin}
                        onChange={(e) => setNewOrigin(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddOrigin()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end" sx={{ color: 'white' }} onClick={handleAddOrigin}>
                                        <AddIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } },
                        }}
                        InputLabelProps={{ sx: { color: '#94a3b8' } }}
                        sx={{ mb: 3 }}
                    />
                    <List>
                        {origins.map((o) => (
                            <ListItem key={o.id} sx={{ bgcolor: '#334155', borderRadius: 2, mb: 1 }}>
                                <ListItemText primary={o.nome} sx={{ color: 'white' }} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" sx={{ color: '#f87171' }} onClick={() => handleDeleteOrigin(o.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #334155' }}>
                    <Button onClick={() => setOpenOriginModal(false)} sx={{ color: '#cbd5e1' }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ───────── Destination Modal ───────── */}
            <Dialog
                open={openDestinationModal}
                onClose={() => setOpenDestinationModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { bgcolor: '#475569', color: 'white', borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #334155' }}>
                    <MyLocationIcon />
                    Gerenciar Destinos
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: '#334155' }}>
                    <TextField
                        fullWidth
                        label="Novo destino"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddDestination()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end" sx={{ color: 'white' }} onClick={handleAddDestination}>
                                        <AddIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } },
                        }}
                        InputLabelProps={{ sx: { color: '#94a3b8' } }}
                        sx={{ mb: 3 }}
                    />
                    <List>
                        {destinations.map((d) => (
                            <ListItem key={d.id} sx={{ bgcolor: '#334155', borderRadius: 2, mb: 1 }}>
                                <ListItemText primary={d.nome} sx={{ color: 'white' }} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" sx={{ color: '#f87171' }} onClick={() => handleDeleteDestination(d.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #334155' }}>
                    <Button onClick={() => setOpenDestinationModal(false)} sx={{ color: '#cbd5e1' }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ───────── Create/Edit Dialog ───────── */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                fullWidth
                maxWidth="md"
                fullScreen={fullScreen}
                PaperProps={{ sx: { bgcolor: '#475569', color: 'white', borderRadius: 3 } }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #334155' }}>{isEditing ? 'Editar Checklist' : 'Nova Saída'}</DialogTitle>
                <DialogContent dividers sx={{ borderColor: '#334155' }}>
                    <Grid container spacing={3}>
                        {/* veículo */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={vehicles}
                                getOptionLabel={(o) => `${o.placa} - ${o.marca} ${o.modelo}`}
                                value={vehicles.find((v) => v.id === newSaida.vehicle) || null}
                                onChange={(_, v) => {
                                    if (v) {
                                        setNewSaida((p) => ({
                                            ...p,
                                            vehicle: v.id,
                                            kmSaida: v.quilometragem || 0,
                                            horimetroSaida: v.horimetro !== undefined ? v.horimetro : v.quilometragem || 0,
                                        }));
                                        setInitialKm(v.quilometragem || 0);
                                    } else {
                                        setNewSaida((p) => ({ ...p, vehicle: '', kmSaida: 0, horimetroSaida: 0 }));
                                        setInitialKm(0);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Veículo *"
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } },
                                        }}
                                        InputLabelProps={{ sx: { color: '#94a3b8' } }}
                                    />
                                )}
                                sx={{ '& .MuiAutocomplete-popupIndicator': { color: '#94a3b8' }, '& .MuiAutocomplete-clearIndicator': { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* motorista */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={drivers}
                                getOptionLabel={(o) => o.fullname}
                                value={drivers.find((d) => d.id === newSaida.motorista1) || null}
                                onChange={(_, v) => setNewSaida((p) => ({ ...p, motorista1: v?.id || '' }))}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Motorista *"
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } },
                                        }}
                                        InputLabelProps={{ sx: { color: '#94a3b8' } }}
                                    />
                                )}
                                sx={{ '& .MuiAutocomplete-popupIndicator': { color: '#94a3b8' }, '& .MuiAutocomplete-clearIndicator': { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* origem */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel sx={{ color: '#94a3b8' }}>Origem *</InputLabel>
                                <Select
                                    value={newSaida.origem}
                                    label="Origem *"
                                    onChange={(e) => setNewSaida((p) => ({ ...p, origem: e.target.value }))}
                                    sx={{ bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                                >
                                    {origins.map((o) => (
                                        <MenuItem key={o.id} value={o.id}>
                                            {o.nome}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* destino */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel sx={{ color: '#94a3b8' }}>Destino *</InputLabel>
                                <Select
                                    value={newSaida.destino}
                                    label="Destino *"
                                    onChange={(e) => setNewSaida((p) => ({ ...p, destino: e.target.value }))}
                                    sx={{ bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                                >
                                    {destinations.map((d) => (
                                        <MenuItem key={d.id} value={d.id}>
                                            {d.nome}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* km */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="KM de Saída *"
                                type="number"
                                required
                                value={newSaida.kmSaida}
                                onChange={(e) => {
                                    const km = +e.target.value;
                                    if (km >= initialKm) setNewSaida((p) => ({ ...p, kmSaida: km }));
                                }}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* data/hora */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Data/Hora de Saída *"
                                type="datetime-local"
                                required
                                InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
                                value={newSaida.dataSaida}
                                onChange={(e) => setNewSaida((p) => ({ ...p, dataSaida: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                            />
                        </Grid>

                        {/* horimetro */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Horímetro"
                                type="number"
                                value={newSaida.horimetroSaida}
                                onChange={(e) => setNewSaida((p) => ({ ...p, horimetroSaida: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* motivo */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Motivo *"
                                required
                                value={newSaida.motivoSaida}
                                onChange={(e) => setNewSaida((p) => ({ ...p, motivoSaida: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* semi */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Semi-reboque"
                                value={newSaida.semiReboque}
                                onChange={(e) => setNewSaida((p) => ({ ...p, semiReboque: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* placa semi */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Placa do Semi"
                                value={newSaida.placaSemiReboque}
                                onChange={(e) => setNewSaida((p) => ({ ...p, placaSemiReboque: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* dep */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Departamento"
                                value={newSaida.departamento}
                                onChange={(e) => setNewSaida((p) => ({ ...p, departamento: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* obs */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observações"
                                multiline
                                rows={3}
                                value={newSaida.observacoesSaida}
                                onChange={(e) => setNewSaida((p) => ({ ...p, observacoesSaida: e.target.value }))}
                                InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                            />
                        </Grid>

                        {/* anexos */}
                        {!isEditing && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: '#94a3b8' }}>
                                    Anexos
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleAttachments}
                                    InputProps={{ sx: { bgcolor: '#334155', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } } }}
                                />
                                {newSaida.attachments.length > 0 && (
                                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                                        {newSaida.attachments.length} arquivo(s) selecionado(s)
                                    </Typography>
                                )}
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #334155' }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: '#cbd5e1' }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isSaving}
                        startIcon={isSaving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
                        sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                        {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ───────── Signature Dialog ───────── */}
            <Dialog open={openSignature} onClose={() => setOpenSignature(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GestureIcon />
                    Assinatura do Motorista
                </DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 2 }}>Por favor, assine no campo abaixo:</Typography>
                    <SignatureCanvas
                        ref={signatureRef}
                        penColor="black"
                        canvasProps={{ width: fullScreen ? window.innerWidth - 20 : 400, height: 200, className: 'sigCanvas' }}
                    />
                    <Button onClick={() => signatureRef.current.clear()} startIcon={<ClearIcon />} sx={{ mt: 1 }}>
                        Limpar
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSignature(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleConfirmSignature} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Confirmar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ───────── Details Dialog ───────── */}
            <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth maxWidth="md" fullScreen={fullScreen} PaperProps={{ sx: { bgcolor: '#475569', color: 'white', borderRadius: 3 } }}>
                {detailsData && (
                    <Box sx={{ background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)', color: 'white', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <DriveEtaIcon />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {detailsData.veiculo?.placa || 'Veículo'} • {new Date(detailsData.data_saida).toLocaleString('pt-BR')}
                        </Typography>
                        <IconButton onClick={() => setOpenDetails(false)} sx={{ color: 'inherit' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                )}
                <DialogContent dividers sx={{ p: 4, borderColor: '#334155' }}>
                    {!detailsData ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: '#2563eb' }} />
                        </Box>
                    ) : (
                        <>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#334155', borderColor: '#475569' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <InfoIcon sx={{ mr: 1, color: '#60a5fa' }} />
                                            <Typography variant="h6" sx={{ color: 'white' }}>
                                                Informações da Viagem
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Motorista:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.motorista?.fullname}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>KM de Saída:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.km_saida}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Horímetro:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.horimetro_saida}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Motivo:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.motivo_saida}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Origem:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.origem?.nome || detailsData.origem}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Destino:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.destino?.nome || detailsData.destino}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#334155', borderColor: '#475569' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <BusinessIcon sx={{ mr: 1, color: '#34d399' }} />
                                            <Typography variant="h6" sx={{ color: 'white' }}>
                                                Informações da Empresa
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Empresa:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.empresa}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Departamento:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.departamento}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ color: '#94a3b8' }}>Criado por:</Typography>
                                                <Typography sx={{ color: 'white' }}>{detailsData.criado_por_nome}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {detailsData.observacoes_saida && (
                                <Paper variant="outlined" sx={{ p: 3, mt: 3, bgcolor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <ChatBubbleOutlineIcon sx={{ mr: 1, color: '#fbbf24' }} />
                                        <Typography variant="h6" sx={{ color: 'white' }}>
                                            Observações
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{detailsData.observacoes_saida}</Typography>
                                </Paper>
                            )}

                            {detailsData.assinatura_saida && (
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 3, mt: 3, textAlign: 'center', bgcolor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                        <GestureIcon sx={{ mr: 1, color: '#a855f7' }} />
                                        <Typography variant="h6" sx={{ color: 'white' }}>
                                            Assinatura do Motorista
                                        </Typography>
                                    </Box>
                                    <Box
                                        component="img"
                                        src={detailsData.assinatura_saida}
                                        alt="Assinatura"
                                        sx={{ maxWidth: '100%', border: '1px solid', borderColor: '#475569', borderRadius: 1, bgcolor: 'white' }}
                                    />
                                </Paper>
                            )}

                            <Paper variant="outlined" sx={{ p: 3, mt: 3, bgcolor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AttachFileIcon sx={{ mr: 1, color: '#22c55e' }} />
                                    <Typography variant="h6" sx={{ color: 'white' }}>
                                        Anexos
                                    </Typography>
                                </Box>
                                {!detailsData.anexos?.length ? (
                                    <Typography sx={{ color: '#94a3b8' }}>Nenhum anexo disponível.</Typography>
                                ) : (
                                    <Grid container spacing={2}>
                                        {detailsData.anexos.map((a) => (
                                            <Grid item xs={6} sm={4} md={3} key={a.id}>
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2,
                                                        textAlign: 'center',
                                                        cursor: 'pointer',
                                                        bgcolor: '#334155',
                                                        borderColor: '#475569',
                                                        '&:hover': { bgcolor: '#1e293b' },
                                                    }}
                                                    onClick={() => window.open(a.url, '_blank')}
                                                >
                                                    {isImage(a.nome_arquivo) ? (
                                                        <img src={a.url} alt={a.nome_arquivo} style={{ maxWidth: '100%', maxHeight: 120 }} />
                                                    ) : (
                                                        <PictureAsPdfIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                                                    )}
                                                    <Typography variant="caption" sx={{ wordBreak: 'break-word', color: '#e2e8f0' }}>
                                                        {a.nome_arquivo}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Paper>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
