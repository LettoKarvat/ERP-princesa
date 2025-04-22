// src/pages/ChegadaPage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
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
    Divider
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
    AttachFile as AttachIcon,
    BorderColor as SignatureIcon
} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";

import {
    getSaidasEmTransito,
    getAllArrivals,
    createArrival,
    addArrivalAttachment,
    deleteArrival,
    updateArrival,
    fileToBase64
} from "../services/arrivalService";

// dentro de ChegadaPage.jsx

const api = axios.create({
    baseURL: "https://18aa-206-84-60-250.ngrok-free.app",
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
    },
});


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

export default function ChegadaPage() {
    const [saidas, setSaidas] = useState([]);
    const [chegadas, setChegadas] = useState([]);
    const [motoristas, setMotoristas] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);

    const [dlgOpen, setDlgOpen] = useState(false);
    const [sigOpen, setSigOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [cmpData, setCmpData] = useState(null);
    const [compareOpen, setCompareOpen] = useState(false);
    const [deleteAsk, setDeleteAsk] = useState(null);

    const sigRef = useRef(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const userRole = localStorage.getItem("role");

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
                        checklist: c
                    };
                })
            );

            setChegadas(
                rawArrivals.map(a => {
                    const cl = a.checklist || {};
                    return {
                        ...a,
                        placa: cl.veiculo?.placa ?? placaById[cl.veiculo_id] ?? "—",
                        checklist: cl
                    };
                })
            );
        } finally {
            setLoading(false);
        }
    }

    function fillFromSaida(id) {
        const s = saidas.find(x => x.id === id);
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

        const id = editId
            ? (await updateArrival(editId, body), editId)
            : await createArrival(form.saidaId, body);

        if (!editId || form.attachments.length) {
            for (const f of form.attachments) {
                await addArrivalAttachment(id, {
                    base64file: await fileToBase64(f),
                    nomeArquivo: f.name,
                    descricao: "Anexo de chegada"
                });
            }
        }

        setDlgOpen(false);
        setEditId(null);
        loadData();
    }

    function trySave() {
        const s = saidas.find(x => x.id === form.saidaId);
        if ((!s && !editId) || +form.kmChegada < +s?.km_saida)
            return alert("Selecione saída válida e confira KM.");
        if (!form.motoristaId) return alert("Informe o motorista.");
        if (!form.assinaturaMotorista) return setSigOpen(true);
        upsertArrival();
    }

    const confirmSig = () => {
        if (sigRef.current.isEmpty()) return alert("Assine primeiro.");
        const sig = sigRef.current.toDataURL();
        setSigOpen(false);
        upsertArrival(sig);
    };

    const confirmDelete = async id => {
        await deleteArrival(id);
        setDeleteAsk(null);
        loadData();
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography variant="h4" gutterBottom>
                Chegada de Veículos
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setForm(emptyForm());
                        setEditId(null);
                        setDlgOpen(true);
                    }}
                >
                    Nova Chegada
                </Button>
            </Box>

            {loading ? (
                <Typography>Carregando...</Typography>
            ) : !chegadas.length ? (
                <Typography>Nenhuma chegada registrada.</Typography>
            ) : (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {chegadas.map(c => (
                        <Card
                            key={c.id}
                            sx={{
                                width: isMobile ? "100%" : 300,
                                position: "relative",
                                overflow: "visible"
                            }}
                        >
                            <CardContent sx={{ pr: 6, pb: 6 }}>
                                <Typography
                                    fontWeight="bold"
                                    color="primary"
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <InIcon sx={{ mr: 1 }} />
                                    {c.placa}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <TimeIcon sx={{ mr: 0.5 }} />
                                    {c.data_chegada
                                        ? new Date(c.data_chegada).toLocaleString("pt-BR")
                                        : "—"}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <SpeedIcon sx={{ mr: 0.5 }} />
                                    KM: {c.km_chegada ?? "—"}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <PersonIcon sx={{ mr: 0.5 }} />
                                    Motorista: {c.motorista?.fullname ?? "—"}
                                </Typography>
                            </CardContent>

                            <Box
                                sx={{
                                    position: "absolute",
                                    right: 4,
                                    top: 4,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.5
                                }}
                            >
                                <Tooltip title="Detalhes">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setDetailData(c);
                                            setDetailOpen(true);
                                        }}
                                    >
                                        <VisibilityIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Comparar">
                                    <IconButton
                                        size="small"
                                        onClick={async () => {
                                            const { data: checklistRaw } = await api.get(
                                                `/checklists/operacao/${c.checklist.id}`
                                            );
                                            setCmpData({
                                                arrival: c,
                                                checklist: {
                                                    data_saida: checklistRaw.data_saida,
                                                    km_saida: checklistRaw.km_saida,
                                                    horimetro_saida: checklistRaw.horimetro_saida,
                                                    motoristaNome:
                                                        checklistRaw.motorista?.fullname || ""
                                                }
                                            });
                                            setCompareOpen(true);
                                        }}
                                    >
                                        <CompareIcon fontSize="inherit" />
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
                                                        dataChegada: c.data_chegada
                                                            ? c.data_chegada.slice(0, 16)
                                                            : nowISO(),
                                                        horimetroChegada: c.horimetro_chegada,
                                                        kmChegada: c.km_chegada,
                                                        motoristaId: c.motorista?.id || "",
                                                        motoristaNome: c.motorista?.fullname || "",
                                                        editDriver: false,
                                                        assinaturaMotorista: c.assinatura || "",
                                                        observacoesChegada: c.observacoes || "",
                                                        attachments: []
                                                    });
                                                    setDlgOpen(true);
                                                }}
                                            >
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton
                                                size="small"
                                                onClick={async () => {
                                                    if (window.confirm("Quer mesmo excluir esta chegada?")) {
                                                        await confirmDelete(c.id);
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="inherit" color="error" />
                                            </IconButton>
                                        </Tooltip>
                                    </>)}
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Criar/Editar Dialog */}
            <Dialog
                open={dlgOpen}
                onClose={() => setDlgOpen(false)}
                PaperProps={{ sx: { width: isMobile ? "90%" : 600, borderRadius: 3 } }}
            >
                <DialogTitle>
                    {editId ? "Editar Chegada" : "Nova Chegada"}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {!editId && (
                            <>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Saída (em trânsito)
                                </Typography>
                                <Select
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    value={form.saidaId}
                                    onChange={e => fillFromSaida(e.target.value)}
                                >
                                    {saidas.map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {`${s.placa} • KM ${s.km_saida} • ${s.motoristaNome}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </>
                        )}

                        <Typography variant="subtitle2" fontWeight="bold">
                            Motorista
                        </Typography>
                        {form.editDriver ? (
                            <Autocomplete
                                options={motoristas}
                                size="small"
                                getOptionLabel={o => o.fullname}
                                value={
                                    motoristas.find(m => m.id === form.motoristaId) || null
                                }
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
                                    size="small"
                                    variant="outlined"
                                    value={form.motoristaNome}
                                    InputProps={{ readOnly: true }}
                                />
                                <IconButton
                                    size="small"
                                    sx={{ position: "absolute", right: 8, top: 6 }}
                                    onClick={() =>
                                        setForm({ ...form, editDriver: true })
                                    }
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}

                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            label="Data/Hora"
                            type="datetime-local"
                            InputLabelProps={{ shrink: true }}
                            value={form.dataChegada}
                            onChange={e =>
                                setForm({ ...form, dataChegada: e.target.value })
                            }
                        />
                        <TextField
                            fullWidth
                            size="small"
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
                            size="small"
                            variant="outlined"
                            label="KM Chegada"
                            type="number"
                            value={form.kmChegada}
                            onChange={e =>
                                setForm({ ...form, kmChegada: e.target.value })
                            }
                        />

                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            label="Observações"
                            multiline
                            minRows={2}
                            value={form.observacoesChegada}
                            onChange={e =>
                                setForm({ ...form, observacoesChegada: e.target.value })
                            }
                        />

                        <Box>
                            <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                sx={{ mb: 0.5 }}
                            >
                                Anexos
                            </Typography>
                            <Button variant="outlined" component="label" size="small">
                                Selecionar arquivos
                                <input
                                    hidden
                                    multiple
                                    type="file"
                                    onChange={fileChange}
                                />
                            </Button>
                            <Typography variant="caption" sx={{ ml: 1 }}>
                                {form.attachments.length} arquivo(s)
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ pr: 3, pb: 2 }}>
                    <Button onClick={() => setDlgOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={trySave}
                        disabled={!form.motoristaId}
                    >
                        {editId ? "Salvar" : "Criar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assinatura Dialog */}
            <Dialog
                open={sigOpen}
                onClose={() => setSigOpen(false)}
                fullScreen={isMobile}
            >
                <DialogTitle>Assinatura</DialogTitle>
                <DialogContent dividers>
                    <SignatureCanvas
                        ref={sigRef}
                        penColor="black"
                        canvasProps={{
                            width: isMobile ? window.innerWidth - 20 : 300,
                            height: 200
                        }}
                    />
                    <Button sx={{ mt: 1 }} onClick={() => sigRef.current.clear()}>
                        Limpar
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSigOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmSig}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Detalhes Dialog */}
            <Dialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                fullWidth
                maxWidth="md"
            >
                {detailData && (
                    <>
                        <DialogTitle>
                            <InIcon sx={{ mr: 1 }} />
                            Detalhes — {detailData.placa}
                            <IconButton
                                onClick={() => setDetailOpen(false)}
                                sx={{ position: "absolute", right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={2}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <TimeIcon sx={{ mr: 1 }} />
                                    {new Date(detailData.data_chegada).toLocaleString(
                                        "pt-BR"
                                    )}
                                </Box>
                                <Divider />
                                <Grid container spacing={2}>
                                    <Grid
                                        item
                                        xs={6}
                                        sx={{ display: "flex", alignItems: "center" }}
                                    >
                                        <SpeedIcon sx={{ mr: 1 }} /> {detailData.km_chegada} KM
                                    </Grid>
                                    <Grid
                                        item
                                        xs={6}
                                        sx={{ display: "flex", alignItems: "center" }}
                                    >
                                        <SpeedIcon
                                            sx={{ mr: 1, transform: "rotate(90deg)" }}
                                        />{" "}
                                        {detailData.horimetro_chegada} Horímetro
                                    </Grid>
                                </Grid>
                                <Divider />
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <PersonIcon sx={{ mr: 1 }} />{" "}
                                    {detailData.motorista?.fullname}
                                </Box>
                                {detailData.observacoes && (
                                    <>
                                        <Divider />
                                        <Box>
                                            <NoteIcon sx={{ mr: 1 }} /> Observações
                                            <Typography whiteSpace="pre-wrap">
                                                {detailData.observacoes}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                                {detailData.assinatura && (
                                    <>
                                        <Divider />
                                        <Box textAlign="center">
                                            <SignatureIcon sx={{ mr: 1 }} /> Assinatura
                                            <Box
                                                component="img"
                                                src={detailData.assinatura}
                                                alt="assinatura"
                                                sx={{
                                                    maxWidth: "100%",
                                                    borderRadius: 1,
                                                    border: "1px solid"
                                                }}
                                            />
                                        </Box>
                                    </>
                                )}
                                <Divider />
                                <Box>
                                    <AttachIcon sx={{ mr: 1 }} /> Anexos
                                    {!detailData.anexos?.length ? (
                                        <Typography>Sem anexos.</Typography>
                                    ) : (
                                        <Grid container spacing={1}>
                                            {detailData.anexos.map(ar => (
                                                <Grid item key={ar.id} xs={4}>
                                                    {/\.(jpe?g|png|gif)$/i.test(ar.nome_arquivo) ? (
                                                        <Box
                                                            component="img"
                                                            src={ar.url}
                                                            alt={ar.nome_arquivo}
                                                            sx={{ width: "100%", borderRadius: 1 }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label={ar.nome_arquivo}
                                                            clickable
                                                            onClick={() => window.open(ar.url, "_blank")}
                                                        />
                                                    )}
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailOpen(false)}>Fechar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Comparar Saída × Chegada Dialog */}
            <Dialog
                open={compareOpen}
                onClose={() => {
                    setCompareOpen(false);
                    setCmpData(null);
                }}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        backgroundColor: theme.palette.secondary.main,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CompareIcon sx={{ mr: 1 }} /> Comparar Saída × Chegada
                    </Box>
                    <IconButton
                        onClick={() => {
                            setCompareOpen(false);
                            setCmpData(null);
                        }}
                        sx={{ color: "#fff" }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                {cmpData && (
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            {/* Saída */}
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <OutIcon sx={{ mr: 1 }} /> Saída
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <TimeIcon sx={{ mr: 0.5 }} />
                                    {new Date(cmpData.checklist.data_saida).toLocaleString(
                                        "pt-BR"
                                    )}
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <SpeedIcon sx={{ mr: 0.5 }} /> KM:{" "}
                                    {cmpData.checklist.km_saida}
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <SpeedIcon
                                        sx={{ mr: 0.5, transform: "rotate(90deg)" }}
                                    />{" "}
                                    Horímetro: {cmpData.checklist.horimetro_saida}
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <PersonIcon sx={{ mr: 0.5 }} /> Motorista:{" "}
                                    {cmpData.checklist.motoristaNome}
                                </Typography>
                            </Box>
                            <Divider />
                            {/* Chegada */}
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <InIcon
                                        sx={{ mr: 1, color: theme.palette.success.main }}
                                    />{" "}
                                    Chegada
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <TimeIcon sx={{ mr: 0.5 }} />
                                    {new Date(cmpData.arrival.data_chegada).toLocaleString(
                                        "pt-BR"
                                    )}
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <SpeedIcon sx={{ mr: 0.5 }} /> KM:{" "}
                                    {cmpData.arrival.km_chegada}
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <SpeedIcon
                                        sx={{ mr: 0.5, transform: "rotate(90deg)" }}
                                    />{" "}
                                    Horímetro: {cmpData.arrival.horimetro_chegada}
                                </Typography>
                                <Typography
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <PersonIcon sx={{ mr: 0.5 }} /> Motorista:{" "}
                                    {cmpData.arrival.motorista?.fullname}
                                </Typography>
                            </Box>
                        </Stack>
                    </DialogContent>
                )}
                <DialogActions>
                    <Button
                        onClick={() => {
                            setCompareOpen(false);
                            setCmpData(null);
                        }}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
