import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Stack,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    CompareArrows,
    Close as CloseIcon,
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import * as XLSX from 'xlsx';

// Importa o serviço
import {
    getAllChecklists,
    editarChecklist,
    adicionarAnexoChecklist,
    fileToBase64,
} from '../services/checklistService';

function initialChegadaForm() {
    return {
        saidaId: '',
        dataChegada: '',
        horimetroChegada: 0,
        kmChegada: 0,
        motorista1Cheg: '',
        assinaturaMotorista: '',
        observacoesChegada: '',
        attachments: [],
    };
}

export default function ChegadaPage() {
    // Estados
    const [saidas, setSaidas] = useState([]);    // Saídas abertas (sem dataChegada)
    const [chegadas, setChegadas] = useState([]); // Chegadas já registradas (com dataChegada)
    const [openChegadaDialog, setOpenChegadaDialog] = useState(false);
    const [newChegada, setNewChegada] = useState(initialChegadaForm());
    const [openSignatureModal, setOpenSignatureModal] = useState(false);
    const [signatureContext, setSignatureContext] = useState(null); // 'chegada'
    const signatureRef = useRef(null);
    const [compareData, setCompareData] = useState(null);
    const [openCompareDialog, setOpenCompareDialog] = useState(false);

    // Responsividade
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const gridSpacing = fullScreen ? 1 : 2;

    // Ao montar o componente, busca checklists do Parse
    useEffect(() => {
        fetchChecklists();
    }, []);

    async function fetchChecklists() {
        try {
            const allChecklists = await getAllChecklists();
            // Filtra "saídas" (sem dataChegada) e "chegadas" (com dataChegada)
            const saidasAbertas = allChecklists.filter((c) => !c.dataChegada);
            const chegadasFeitas = allChecklists.filter((c) => c.dataChegada);

            setSaidas(saidasAbertas);
            setChegadas(chegadasFeitas);
        } catch (error) {
            console.error('Erro ao buscar checklists:', error);
        }
    }

    // Configuração das colunas da tabela
    const chegadaColumns = [
        // Precisamos de getRowId no DataGrid para usar objectId como ID
        { field: 'objectId', headerName: 'ID', width: 150 },
        {
            field: 'dataChegada',
            headerName: 'Data/Hora Chegada',
            width: 160,
            valueGetter: (params) => {
                const dt = params.row.dataChegada;
                if (!dt) return '';
                return new Date(dt).toLocaleString('pt-BR');
            },
        },
        { field: 'kmChegada', headerName: 'KM Chegada', width: 110 },
        {
            field: 'actions',
            headerName: 'Comparar',
            width: 100,
            renderCell: (params) => (
                <Tooltip title="Comparar Saída vs Chegada">
                    <IconButton color="primary" onClick={() => handleCompare(params.row)}>
                        <CompareArrows />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    // Abre/fecha diálogo de Nova Chegada
    const handleOpenChegadaDialog = () => {
        setNewChegada(initialChegadaForm());
        setOpenChegadaDialog(true);
    };

    const handleCloseChegadaDialog = () => {
        setOpenChegadaDialog(false);
    };

    // Ao salvar a Chegada, chamamos a Cloud Function editarChecklist
    const handleSaveChegada = async () => {
        try {
            const saidaId = newChegada.saidaId;
            if (!saidaId) {
                alert('Selecione uma saída válida!');
                return;
            }

            // Localiza a saída correspondente (opcional, se quiser validar KM, etc.)
            const saidaRef = saidas.find((s) => s.objectId === saidaId);
            if (!saidaRef) {
                alert('Saída não encontrada!');
                return;
            }

            // Valida KM
            if (Number(newChegada.kmChegada) < Number(saidaRef.kmSaida)) {
                alert('KM Chegada não pode ser menor que o KM Saída registrado!');
                return;
            }

            // Verifica se tem anexos
            if (!newChegada.attachments || newChegada.attachments.length === 0) {
                alert('Anexos são obrigatórios para a Chegada!');
                return;
            }

            // Verifica se tem assinatura
            if (!newChegada.assinaturaMotorista || newChegada.assinaturaMotorista.trim() === '') {
                setSignatureContext('chegada');
                setOpenSignatureModal(true);
                return;
            }

            // Se passou por todas as validações, chama a função final
            await finalSaveChegada();
        } catch (error) {
            console.error('Erro ao salvar Chegada:', error);
            alert(error.message);
        }
    };

    // Salva efetivamente a chegada no Parse
    const finalSaveChegada = async () => {
        try {
            const saidaId = newChegada.saidaId;
            // Monta objeto pra atualizar
            const payload = {
                objectId: saidaId,
                dataChegada: newChegada.dataChegada,
                horimetroChegada: Number(newChegada.horimetroChegada) || 0,
                kmChegada: Number(newChegada.kmChegada) || 0,
                motorista1Cheg: newChegada.motorista1Cheg, // se for string normal
                observacoesChegada: newChegada.observacoesChegada,
                // Exemplo: marca status como "Concluído"
                status: 'Concluído',
            };

            // Assinatura do motorista
            // Se quiser salvar a assinatura em outro campo do checklist,
            // você pode criar um campo "assinaturaMotoristaChegada" no Parse.
            // A Cloud Function teria que aceitar esse campo. Exemplo:
            // payload.assinaturaMotoristaCheg = newChegada.assinaturaMotorista;

            // Chama a Cloud Function
            await editarChecklist(payload);

            // Faz upload dos anexos (se houver)
            for (let file of newChegada.attachments) {
                const base64file = await fileToBase64(file);
                await adicionarAnexoChecklist({
                    checklistId: saidaId,
                    base64file,
                    nomeArquivo: file.name,
                    descricao: 'Anexo de chegada',
                });
            }

            // Fecha o diálogo e atualiza a lista
            setOpenChegadaDialog(false);
            fetchChecklists();
        } catch (error) {
            console.error('Erro ao salvar Chegada:', error);
            alert(error.message);
        }
    };

    // Lida com anexos no input file
    const handleChegadaAttachments = (e) => {
        const files = e.target.files;
        if (!files) return;
        // Precisamos armazenar os próprios objetos File, não só o nome
        setNewChegada((prev) => ({
            ...prev,
            attachments: [...prev.attachments, ...files],
        }));
    };

    // Lógica de assinatura
    const handleConfirmSignature = () => {
        if (signatureRef.current.isEmpty()) {
            alert('Por favor, assine antes de confirmar.');
            return;
        }
        const signatureData = signatureRef.current.toDataURL();

        if (signatureContext === 'chegada') {
            setNewChegada((prev) => ({ ...prev, assinaturaMotorista: signatureData }));
            setOpenSignatureModal(false);
            // Continua o fluxo do finalSaveChegada
            finalSaveChegada();
        }

        setSignatureContext(null);
    };

    // Abre o modal de comparação
    const handleCompare = (chegada) => {
        setCompareData(chegada);
        setOpenCompareDialog(true);
    };

    // Exportar chegadas para Excel
    const exportChegadasToExcel = () => {
        const headers = [
            'ID Checklist',
            'Data/Hora Chegada',
            'Horímetro Chegada',
            'KM Chegada',
            'Motorista (Chegada)',
            'Observações Chegada',
        ];
        const data = [headers];

        chegadas.forEach((c) => {
            const dataChegadaFormatted = c.dataChegada
                ? new Date(c.dataChegada).toLocaleString('pt-BR')
                : '';
            data.push([
                c.objectId,
                dataChegadaFormatted,
                c.horimetroChegada || 0,
                c.kmChegada || 0,
                c.motorista1Cheg || '',
                c.observacoesChegada || '',
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        // Formatação básica do cabeçalho
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4F81BD' } },
            };
        }
        worksheet['!cols'] = [
            { wpx: 120 },
            { wpx: 140 },
            { wpx: 120 },
            { wpx: 120 },
            { wpx: 200 },
            { wpx: 200 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Chegadas');
        XLSX.writeFile(workbook, 'chegadas.xlsx');
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Chegada de Veículos
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenChegadaDialog}>
                    Nova Chegada
                </Button>
            </Box>
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Chegadas</Typography>
                        <Button variant="outlined" onClick={exportChegadasToExcel}>
                            Exportar Chegadas para Excel
                        </Button>
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <DataGrid
                            rows={chegadas}
                            columns={chegadaColumns}
                            pageSize={5}
                            autoHeight
                            getRowId={(row) => row.objectId} // Importante!
                            sx={{
                                bgcolor: 'background.paper',
                                '& .MuiDataGrid-cell': { fontSize: '0.875rem' },
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Diálogo para Nova Chegada */}
            <Dialog
                open={openChegadaDialog}
                onClose={handleCloseChegadaDialog}
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen}
            >
                <DialogTitle>Nova Chegada</DialogTitle>
                <DialogContent dividers>
                    {fullScreen ? (
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Saída (disponível)</InputLabel>
                                <Select
                                    value={newChegada.saidaId}
                                    label="Saída (disponível)"
                                    onChange={(e) => setNewChegada({ ...newChegada, saidaId: e.target.value })}
                                >
                                    {saidas.map((s) => (
                                        <MenuItem key={s.objectId} value={s.objectId}>
                                            {`ID ${s.objectId} - KM Saída: ${s.kmSaida || 0}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Data/Hora de Chegada"
                                type="datetime-local"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newChegada.dataChegada}
                                onChange={(e) => setNewChegada({ ...newChegada, dataChegada: e.target.value })}
                            />
                            <TextField
                                label="Horímetro (Chegada)"
                                type="number"
                                fullWidth
                                value={newChegada.horimetroChegada}
                                onChange={(e) => setNewChegada({ ...newChegada, horimetroChegada: e.target.value })}
                            />
                            <TextField
                                label="KM (Chegada)"
                                type="number"
                                fullWidth
                                value={newChegada.kmChegada}
                                onChange={(e) => setNewChegada({ ...newChegada, kmChegada: e.target.value })}
                            />
                            <TextField
                                label="1° Motorista (Chegada)"
                                fullWidth
                                value={newChegada.motorista1Cheg}
                                onChange={(e) => setNewChegada({ ...newChegada, motorista1Cheg: e.target.value })}
                            />
                            <TextField
                                label="Observações (Chegada)"
                                multiline
                                minRows={2}
                                fullWidth
                                value={newChegada.observacoesChegada}
                                onChange={(e) =>
                                    setNewChegada({ ...newChegada, observacoesChegada: e.target.value })
                                }
                            />
                            <Box>
                                <Typography variant="subtitle2">
                                    Anexos (Chegada) <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <TextField
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleChegadaAttachments}
                                    fullWidth
                                />
                            </Box>
                        </Stack>
                    ) : (
                        <Grid container spacing={gridSpacing}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Saída (disponível)</InputLabel>
                                    <Select
                                        value={newChegada.saidaId}
                                        label="Saída (disponível)"
                                        onChange={(e) => setNewChegada({ ...newChegada, saidaId: e.target.value })}
                                    >
                                        {saidas.map((s) => (
                                            <MenuItem key={s.objectId} value={s.objectId}>
                                                {`ID ${s.objectId} - KM Saída: ${s.kmSaida || 0}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Data/Hora de Chegada"
                                    type="datetime-local"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={newChegada.dataChegada}
                                    onChange={(e) => setNewChegada({ ...newChegada, dataChegada: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Horímetro (Chegada)"
                                    type="number"
                                    fullWidth
                                    value={newChegada.horimetroChegada}
                                    onChange={(e) =>
                                        setNewChegada({ ...newChegada, horimetroChegada: e.target.value })
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="KM (Chegada)"
                                    type="number"
                                    fullWidth
                                    value={newChegada.kmChegada}
                                    onChange={(e) => setNewChegada({ ...newChegada, kmChegada: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="1° Motorista (Chegada)"
                                    fullWidth
                                    value={newChegada.motorista1Cheg}
                                    onChange={(e) =>
                                        setNewChegada({ ...newChegada, motorista1Cheg: e.target.value })
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Observações (Chegada)"
                                    multiline
                                    minRows={2}
                                    fullWidth
                                    value={newChegada.observacoesChegada}
                                    onChange={(e) =>
                                        setNewChegada({ ...newChegada, observacoesChegada: e.target.value })
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">
                                    Anexos (Chegada) <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <TextField
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleChegadaAttachments}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseChegadaDialog}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveChegada}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para Assinatura */}
            <Dialog
                open={openSignatureModal}
                onClose={() => setOpenSignatureModal(false)}
                fullScreen={fullScreen}
            >
                <DialogTitle>Assinatura do Motorista</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Por favor, assine abaixo:
                    </Typography>
                    <SignatureCanvas
                        ref={signatureRef}
                        penColor="black"
                        canvasProps={{
                            width: fullScreen ? window.innerWidth - 20 : 300,
                            height: 200,
                            className: 'sigCanvas',
                        }}
                    />
                    <Button onClick={() => signatureRef.current.clear()} sx={{ mt: 1 }}>
                        Limpar Assinatura
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSignatureModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleConfirmSignature}>
                        Confirmar Assinatura
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para Comparar Saída x Chegada */}
            <Dialog
                open={openCompareDialog}
                onClose={() => {
                    setCompareData(null);
                    setOpenCompareDialog(false);
                }}
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen}
            >
                <DialogTitle>
                    Comparar Saída x Chegada
                    <IconButton
                        onClick={() => {
                            setCompareData(null);
                            setOpenCompareDialog(false);
                        }}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                {compareData && (
                    <DialogContent dividers>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            <strong>ID Checklist:</strong> {compareData.objectId}
                        </Typography>
                        <Grid container spacing={gridSpacing}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6" gutterBottom>
                                    Saída
                                </Typography>
                                <Typography>
                                    <strong>Data/Hora:</strong>{' '}
                                    {compareData.dataSaida
                                        ? new Date(compareData.dataSaida).toLocaleString('pt-BR')
                                        : ''}
                                </Typography>
                                <Typography>
                                    <strong>KM Saída:</strong> {compareData.kmSaida}
                                </Typography>
                                <Typography>
                                    <strong>Horímetro:</strong> {compareData.horimetroSaida}
                                </Typography>
                                <Typography>
                                    <strong>Motorista:</strong> {compareData.motorista1Saida || ''}
                                </Typography>
                                <Typography>
                                    <strong>Motivo:</strong> {compareData.motivoSaida || ''}
                                </Typography>
                                <Typography>
                                    <strong>Destino:</strong> {compareData.destino || ''}
                                </Typography>
                                <Typography sx={{ mt: 1 }}>
                                    <strong>Observações:</strong> {compareData.observacoesSaida || ''}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6" gutterBottom>
                                    Chegada
                                </Typography>
                                <Typography>
                                    <strong>Data/Hora:</strong>{' '}
                                    {compareData.dataChegada
                                        ? new Date(compareData.dataChegada).toLocaleString('pt-BR')
                                        : ''}
                                </Typography>
                                <Typography>
                                    <strong>KM Chegada:</strong> {compareData.kmChegada}
                                </Typography>
                                <Typography>
                                    <strong>Horímetro:</strong> {compareData.horimetroChegada}
                                </Typography>
                                <Typography>
                                    <strong>Motorista:</strong> {compareData.motorista1Cheg || ''}
                                </Typography>
                                <Typography sx={{ mt: 1 }}>
                                    <strong>Observações:</strong> {compareData.observacoesChegada || ''}
                                </Typography>
                            </Grid>
                        </Grid>
                    </DialogContent>
                )}
            </Dialog>
        </Box>
    );
}
