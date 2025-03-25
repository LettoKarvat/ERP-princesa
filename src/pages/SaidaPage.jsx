import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import * as XLSX from 'xlsx';
import Autocomplete from '@mui/material/Autocomplete';

// Serviços do Parse (Cloud Functions) para Checklist
import {
    criarChecklist,
    adicionarAnexoChecklist,
    fileToBase64,
} from '../services/checklistService';

// Serviço para obter veículos (se quiser exibir no Autocomplete)
import { getAllVeiculos } from '../services/vehicleService';

function initialSaidaForm() {
    return {
        empresa: '298 DISTRIBUIDORA PRINCESA',
        departamento: '100 TRANSPORTE URBANO',
        // Armazenamos o objectId do Veiculo
        vehicle: '',
        semiReboque: '',
        placaSemiReboque: '',
        kmSaida: 0,
        dataSaida: '',
        horimetroSaida: 0,
        inspecionadoPor: '', // será preenchido do localStorage
        motorista1: '',
        motivoSaida: '',
        destino: '',
        observacoesSaida: '',
        attachments: [],
        closed: false,
        assinaturaMotorista: '',
    };
}

export default function SaidaPage() {
    // Armazenamento local só para exibir na tabela (opcional)
    const [saidas, setSaidas] = useState([]);

    // Estado do formulário de Saída
    const [openSaidaDialog, setOpenSaidaDialog] = useState(false);
    const [newSaida, setNewSaida] = useState(initialSaidaForm());

    // Diálogo de assinatura
    const [openSignatureModal, setOpenSignatureModal] = useState(false);
    const [signatureContext, setSignatureContext] = useState(null); // 'saida'
    const signatureRef = useRef(null);

    // Lista de veículos buscados do Parse
    const [vehicles, setVehicles] = useState([]);
    // Armazena o valor inicial do KM do veículo (para comparar e não deixar diminuir)
    const [initialKm, setInitialKm] = useState(0);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // Colunas da DataGrid (apenas para exibir localmente)
    const saidaColumns = [
        { field: 'empresa', headerName: 'Empresa', width: 200 },
        { field: 'vehicle', headerName: 'Placa (Veículo)', width: 130 },
        {
            field: 'dataSaida',
            headerName: 'Data/Hora Saída',
            width: 160,
            valueGetter: (params) => {
                const dt = params.row.dataSaida;
                if (!dt) return '';
                return new Date(dt).toLocaleString('pt-BR');
            },
        },
        { field: 'kmSaida', headerName: 'KM Saída', width: 100 },
        { field: 'motivoSaida', headerName: 'Motivo', width: 150 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (params.row.closed ? 'Fechada' : 'Aberta'),
        },
    ];

    // Carrega veículos do Parse ao montar
    useEffect(() => {
        async function fetchVehicles() {
            try {
                const veiculos = await getAllVeiculos();
                setVehicles(veiculos);
            } catch (error) {
                console.error('Erro ao buscar veículos:', error);
            }
        }
        fetchVehicles();
    }, []);

    // Abre o diálogo de Nova Saída
    const handleOpenSaidaDialog = () => {
        // Lê o nome do usuário do localStorage
        const localFullname = localStorage.getItem('fullname') || '';

        // Inicializa o formulário, preenchendo "inspecionadoPor"
        setNewSaida({
            ...initialSaidaForm(),
            inspecionadoPor: localFullname,
        });
        setInitialKm(0);
        setOpenSaidaDialog(true);
    };

    const handleCloseSaidaDialog = () => {
        setOpenSaidaDialog(false);
    };

    // Tenta salvar a Saída
    const handleSaveSaida = () => {
        // Verifica se há anexos
        if (!newSaida.attachments || newSaida.attachments.length === 0) {
            alert('Anexos são obrigatórios para a Saída!');
            return;
        }
        // Valida que o KM informado não seja menor que o valor inicial
        if (Number(newSaida.kmSaida) < Number(initialKm)) {
            return; // Simplesmente não faz nada se for menor
        }
        // Verifica se já assinou
        if (!newSaida.assinaturaMotorista || newSaida.assinaturaMotorista.trim() === '') {
            setSignatureContext('saida');
            setOpenSignatureModal(true);
            return;
        }
        finalSaveSaida();
    };

    // Salva de fato no Parse e envia anexos
    const finalSaveSaida = async () => {
        try {
            // Monta o payload esperado pela Cloud Function "criarChecklist"
            // Ajuste os campos conforme seu "criarChecklist" no backend
            const payload = {
                veiculoId: newSaida.vehicle,             // objectId do Veiculo
                dataSaida: newSaida.dataSaida,           // string datetime
                kmSaida: Number(newSaida.kmSaida),
                horimetroSaida: Number(newSaida.horimetroSaida),
                motorista1Saida: newSaida.motorista1,    // Se seu backend espera ID de usuário, ajuste
                motivoSaida: newSaida.motivoSaida,
                destino: newSaida.destino,
                observacoesSaida: newSaida.observacoesSaida,
                // Se quiser vincular o inspecionadoPor a um Parse.User, precisa do ID.
                // Se for só texto, use "observacoesSaida" ou outro campo. 
                // Exemplo: inspecionadoPorId: ??? 
            };

            // Cria o checklist no Parse
            const response = await criarChecklist(payload);
            console.log('Checklist criado:', response);
            const { objectId } = response.data; // ID do checklist criado

            // Faz upload dos anexos
            // Mas primeiro precisamos converter cada File em base64 (caso "attachments" guarde File)
            for (let file of newSaida.attachments) {
                // Se "attachments" guardar só o nome, precisa mudar a forma de armazenar. 
                // Se guardar o objeto File, faça:
                if (file instanceof File) {
                    const base64file = await fileToBase64(file);
                    await adicionarAnexoChecklist({
                        checklistId: objectId,
                        base64file,
                        nomeArquivo: file.name,
                        descricao: 'Saída',
                    });
                }
            }

            // Opcional: atualiza a lista local (só para exibir)
            const newId = saidas.length ? saidas[saidas.length - 1].id + 1 : 1;
            const saidaLocal = {
                ...newSaida,
                id: newId,
                // Armazena no local para exibir. "vehicle" poderia ser a placa, etc.
                status: 'Em andamento',
            };
            setSaidas((prev) => [...prev, saidaLocal]);

            // Fecha o diálogo
            setOpenSaidaDialog(false);
        } catch (error) {
            console.error('Erro ao criar checklist no Parse:', error);
            alert('Falha ao criar checklist no backend.');
        }
    };

    // Lida com anexos no input file
    const handleSaidaAttachments = (e) => {
        const files = e.target.files;
        if (!files) return;
        // Se quisermos armazenar o File
        const fileList = Array.from(files);
        setNewSaida((prev) => ({
            ...prev,
            attachments: [...prev.attachments, ...fileList],
        }));
    };

    // Diálogo de assinatura
    const handleConfirmSignature = () => {
        if (signatureRef.current.isEmpty()) {
            alert('Por favor, assine antes de confirmar.');
            return;
        }
        const signatureData = signatureRef.current.toDataURL();
        if (signatureContext === 'saida') {
            setNewSaida((prev) => ({ ...prev, assinaturaMotorista: signatureData }));
            setOpenSignatureModal(false);
            finalSaveSaida();
        }
        setSignatureContext(null);
    };

    // Exporta a lista local de Saídas para Excel (opcional)
    const exportSaidasToExcel = () => {
        const headers = [
            'Empresa',
            'Departamento',
            'Veículo',
            'Semi-reboque',
            'Placa Semi-reboque',
            'KM Saída',
            'Data/Hora Saída',
            'Horímetro Saída',
            'Inspecionado Por',
            'Motorista',
            'Motivo de Saída',
            'Destino',
            'Observações',
            'Anexos',
            'Assinatura Motorista',
            'Status',
        ];
        const data = [headers];
        saidas.forEach((s) => {
            const dataSaidaFormatted = s.dataSaida
                ? new Date(s.dataSaida).toLocaleString('pt-BR')
                : '';
            const status = s.closed ? 'Fechada' : 'Aberta';
            data.push([
                s.empresa,
                s.departamento,
                s.vehicle,
                s.semiReboque,
                s.placaSemiReboque,
                s.kmSaida,
                dataSaidaFormatted,
                s.horimetroSaida,
                s.inspecionadoPor,
                s.motorista1,
                s.motivoSaida,
                s.destino,
                s.observacoesSaida,
                s.attachments.map((f) => (f.name ? f.name : f)).join(', '),
                s.assinaturaMotorista ? 'Sim' : 'Não',
                status,
            ]);
        });
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        // Formata cabeçalho
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
            { wpx: 150 },
            { wpx: 150 },
            { wpx: 100 },
            { wpx: 120 },
            { wpx: 120 },
            { wpx: 100 },
            { wpx: 140 },
            { wpx: 100 },
            { wpx: 150 },
            { wpx: 120 },
            { wpx: 150 },
            { wpx: 150 },
            { wpx: 200 },
            { wpx: 150 },
            { wpx: 120 },
            { wpx: 100 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Saidas');
        XLSX.writeFile(workbook, 'saidas.xlsx');
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Saída de Veículos
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenSaidaDialog}>
                    Nova Saída
                </Button>
            </Box>

            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Saídas (local)</Typography>
                        <Button variant="outlined" onClick={exportSaidasToExcel}>
                            Exportar Saídas para Excel
                        </Button>
                    </Box>
                    <DataGrid
                        rows={saidas}
                        columns={saidaColumns}
                        pageSize={5}
                        autoHeight
                        sx={{ bgcolor: 'background.paper' }}
                    />
                </CardContent>
            </Card>

            <Dialog open={openSaidaDialog} onClose={handleCloseSaidaDialog} maxWidth="md" fullWidth>
                <DialogTitle>Nova Saída</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {/* Autocomplete para pesquisar veículo */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={vehicles}
                                getOptionLabel={(option) =>
                                    `${option.placa} - ${option.marca} ${option.modelo}`
                                }
                                onChange={(event, newValue) => {
                                    if (newValue) {
                                        setNewSaida((prev) => ({
                                            ...prev,
                                            vehicle: newValue.objectId, // ID do veículo no Parse
                                            kmSaida: newValue.quilometragem,
                                        }));
                                        setInitialKm(newValue.quilometragem);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Veículo (Placa)" variant="outlined" />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Departamento do veículo"
                                fullWidth
                                value={newSaida.departamento}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, departamento: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Semi-reboque"
                                fullWidth
                                value={newSaida.semiReboque}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, semiReboque: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Placa do Semi-reboque"
                                fullWidth
                                value={newSaida.placaSemiReboque}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, placaSemiReboque: e.target.value })
                                }
                            />
                        </Grid>
                        {/* KM (Saída) - não permite diminuir abaixo de initialKm */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="KM (Saída)"
                                type="number"
                                fullWidth
                                value={newSaida.kmSaida}
                                onChange={(e) => {
                                    const newKm = Number(e.target.value);
                                    if (newKm >= initialKm) {
                                        setNewSaida({ ...newSaida, kmSaida: newKm });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Data/Hora de Saída"
                                type="datetime-local"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newSaida.dataSaida}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, dataSaida: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Horímetro (Saída)"
                                type="number"
                                fullWidth
                                value={newSaida.horimetroSaida}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, horimetroSaida: e.target.value })
                                }
                            />
                        </Grid>
                        {/* Inspecionado por -> localStorage */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Inspecionado por"
                                fullWidth
                                value={newSaida.inspecionadoPor}
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="1° Motorista"
                                fullWidth
                                value={newSaida.motorista1}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, motorista1: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Motivo de Saída"
                                fullWidth
                                value={newSaida.motivoSaida}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, motivoSaida: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Destino"
                                fullWidth
                                value={newSaida.destino}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, destino: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Observações (Saída)"
                                multiline
                                minRows={2}
                                fullWidth
                                value={newSaida.observacoesSaida}
                                onChange={(e) =>
                                    setNewSaida({ ...newSaida, observacoesSaida: e.target.value })
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2">
                                Anexos (Saída) <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <TextField
                                type="file"
                                inputProps={{ multiple: true }}
                                onChange={handleSaidaAttachments}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSaidaDialog}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveSaida}>
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
        </Box>
    );
}
