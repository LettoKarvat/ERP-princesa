import React, { useState, useRef } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  CompareArrows,
  Close as CloseIcon,
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import * as XLSX from 'xlsx';

/*
  Estrutura dos dados:

  saidas: [
    {
      id: 1,
      empresa: '298 DISTRIBUIDORA PRINCESA',
      departamento: '100 TRANSPORTE URBANO',
      vehicle: 'HHK1G29',
      semiReboque: '',
      placaSemiReboque: '',
      kmRodado: 152,
      dataSaida: '2025-02-05T06:25',
      horimetroSaida: 0,
      kmSaida: 377115,
      inspecionadoPor: '',
      motorista1: '1057 - José Raimundo',
      motivoSaida: 'Entrega Capital',
      destino: 'Santa Izabel / Belém',
      observacoesSaida: '',
      attachments: ['saida_foto1.png'],
      closed: false,
      assinaturaMotorista: '', // Assinatura para a Saída
    },
  ]

  chegadas: [
    {
      id: 1,
      saidaId: 1,
      dataChegada: '2025-02-05T20:14',
      horimetroChegada: 0,
      kmChegada: 0,
      motorista1Cheg: '',
      assinaturaMotorista: '', // será preenchida via assinatura
      observacoesChegada: '',
      attachments: [],
    },
    ...
  ]
*/

// Função utilitária para extrair "mês/ano" de uma data "YYYY-MM-DD"
function getMonthYear(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default function CheckList() {
  const [saidas, setSaidas] = useState([
    {
      id: 1,
      empresa: '298 DISTRIBUIDORA PRINCESA',
      departamento: '100 TRANSPORTE URBANO',
      vehicle: 'HHK1G29',
      semiReboque: '',
      placaSemiReboque: '',
      kmRodado: 152,
      dataSaida: '2025-02-05T06:25',
      horimetroSaida: 0,
      kmSaida: 377115,
      inspecionadoPor: '',
      motorista1: '1057 - José Raimundo',
      motivoSaida: 'Entrega Capital',
      destino: 'Santa Izabel / Belém',
      observacoesSaida: '',
      attachments: ['saida_foto1.png'],
      closed: false,
      assinaturaMotorista: '',
    },
  ]);
  const [chegadas, setChegadas] = useState([]);
  const [openOperationDialog, setOpenOperationDialog] = useState(false);
  const [modalTab, setModalTab] = useState(0); // 0 = Saída, 1 = Chegada
  const [openCompareDialog, setOpenCompareDialog] = useState(false);
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [signatureContext, setSignatureContext] = useState(null); // 'saida' ou 'chegada'
  const [newSaida, setNewSaida] = useState(initialSaidaForm());
  const [newChegada, setNewChegada] = useState(initialChegadaForm());
  const [compareData, setCompareData] = useState({ saida: null, chegada: null });
  const signatureRef = useRef(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // --------------------- COLUNAS DE SAÍDAS ---------------------
  const saidaColumns = [
    { field: 'empresa', headerName: 'Empresa', width: 200 },
    { field: 'vehicle', headerName: 'Placa', width: 100 },
    {
      field: 'dataSaida',
      headerName: 'Data/Hora Saída',
      width: 160,
      valueGetter: (params) => {
        const dt = params.row.dataSaida;
        if (!dt) return '';
        const d = new Date(dt);
        return d.toLocaleString('pt-BR');
      },
    },
    { field: 'kmSaida', headerName: 'KM Saída', width: 100 },
    { field: 'motivoSaida', headerName: 'Motivo', width: 150 },
    {
      field: 'status',
      headerName: 'Chegou?',
      width: 120,
      renderCell: (params) => (params.row.closed ? 'Sim' : 'Não'),
    },
  ];

  // --------------------- COLUNAS DE CHEGADAS ---------------------
  const chegadaColumns = [
    { field: 'saidaId', headerName: 'ID Saída', width: 90 },
    {
      field: 'dataChegada',
      headerName: 'Data/Hora Chegada',
      width: 160,
      valueGetter: (params) => {
        const dt = params.row.dataChegada;
        if (!dt) return '';
        const d = new Date(dt);
        return d.toLocaleString('pt-BR');
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

  // --------------------- MANIPULAÇÃO DE MODAL UNIFICADO ---------------------
  const handleOpenOperationDialog = () => {
    // Reinicia os formulários ao abrir o modal
    setNewSaida(initialSaidaForm());
    setNewChegada(initialChegadaForm());
    setModalTab(0); // Opcional: define como padrão a aba Saída
    setOpenOperationDialog(true);
  };

  const handleCloseOperationDialog = () => {
    setOpenOperationDialog(false);
  };

  const handleSaveOperation = () => {
    if (modalTab === 0) {
      handleSaveSaida();
    } else {
      handleSaveChegada();
    }
  };

  // --------------------- SALVAR SAÍDA ---------------------
  function handleSaveSaida() {
    if (!newSaida.attachments || newSaida.attachments.length === 0) {
      alert('Anexos são obrigatórios para a Saída!');
      return;
    }
    if (Number(newSaida.kmSaida) < Number(newSaida.kmRodado)) {
      alert('KM Saída não pode ser menor que o KM Rodado atual!');
      return;
    }
    if (!newSaida.assinaturaMotorista || newSaida.assinaturaMotorista.trim() === '') {
      setSignatureContext('saida');
      setOpenSignatureModal(true);
      return;
    }
    finalSaveSaida();
  }

  function finalSaveSaida() {
    const newId = saidas.length ? saidas[saidas.length - 1].id + 1 : 1;
    const saidaToAdd = {
      ...newSaida,
      id: newId,
      kmRodado: Number(newSaida.kmRodado) || 0,
      horimetroSaida: Number(newSaida.horimetroSaida) || 0,
      kmSaida: Number(newSaida.kmSaida) || 0,
      closed: false,
    };
    setSaidas((prev) => [...prev, saidaToAdd]);
    setOpenOperationDialog(false);
  }

  // --------------------- SALVAR CHEGADA ---------------------
  function handleSaveChegada() {
    const saidaId = Number(newChegada.saidaId);
    const saidaRef = saidas.find((s) => s.id === saidaId);
    if (!saidaRef) {
      alert('Saída inválida ou não encontrada!');
      return;
    }
    if (!newChegada.attachments || newChegada.attachments.length === 0) {
      alert('Anexos são obrigatórios para a Chegada!');
      return;
    }
    if (Number(newChegada.kmChegada) < Number(saidaRef.kmSaida)) {
      alert('KM Chegada não pode ser menor que o KM Saída registrado!');
      return;
    }
    if (!newChegada.assinaturaMotorista || newChegada.assinaturaMotorista.trim() === '') {
      setSignatureContext('chegada');
      setOpenSignatureModal(true);
      return;
    }
    finalSaveChegada();
  }

  function finalSaveChegada() {
    const saidaId = Number(newChegada.saidaId);
    const saidaRef = saidas.find((s) => s.id === saidaId);
    if (!saidaRef) {
      alert('Saída inválida ou não encontrada!');
      return;
    }
    const newId = chegadas.length ? chegadas[chegadas.length - 1].id + 1 : 1;
    const chegadaToAdd = {
      ...newChegada,
      id: newId,
      horimetroChegada: Number(newChegada.horimetroChegada) || 0,
      kmChegada: Number(newChegada.kmChegada) || 0,
    };
    setSaidas((prev) =>
      prev.map((s) => (s.id === saidaId ? { ...s, closed: true } : s))
    );
    setChegadas((prev) => [...prev, chegadaToAdd]);
    setOpenOperationDialog(false);
  }

  // --------------------- COMPARAÇÃO ---------------------
  function handleCompare(chegada) {
    const saidaRef = saidas.find((s) => s.id === chegada.saidaId);
    if (!saidaRef) {
      alert('Saída correspondente não encontrada!');
      return;
    }
    setCompareData({ saida: saidaRef, chegada: chegada });
    setOpenCompareDialog(true);
  }

  // --------------------- UPLOAD DE ARQUIVOS (ANEXOS) ---------------------
  function handleSaidaAttachments(e) {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setNewSaida((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...names],
    }));
  }

  function handleChegadaAttachments(e) {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setNewChegada((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...names],
    }));
  }

  // --------------------- MODAL DE ASSINATURA ---------------------
  function handleConfirmSignature() {
    if (signatureRef.current.isEmpty()) {
      alert('Por favor, assine antes de confirmar.');
      return;
    }
    const signatureData = signatureRef.current.toDataURL();
    if (signatureContext === 'chegada') {
      setNewChegada((prev) => ({ ...prev, assinaturaMotorista: signatureData }));
      setOpenSignatureModal(false);
      finalSaveChegada();
    } else if (signatureContext === 'saida') {
      setNewSaida((prev) => ({ ...prev, assinaturaMotorista: signatureData }));
      setOpenSignatureModal(false);
      finalSaveSaida();
    }
    setSignatureContext(null);
  }

  // --------------------- EXPORTAÇÃO PARA EXCEL ---------------------
  const exportSaidasToExcel = () => {
    const headers = [
      "Empresa",
      "Departamento",
      "Veículo",
      "Semi-reboque",
      "Placa Semi-reboque",
      "KM Rodado",
      "Data/Hora Saída",
      "Horímetro Saída",
      "KM Saída",
      "Inspecionado Por",
      "Motorista",
      "Motivo de Saída",
      "Destino",
      "Observações",
      "Anexos",
      "Assinatura Motorista",
      "Status",
    ];
    const data = [headers];
    saidas.forEach((s) => {
      const dataSaidaFormatted = s.dataSaida ? new Date(s.dataSaida).toLocaleString('pt-BR') : "";
      const status = s.closed ? "Fechada" : "Aberta";
      data.push([
        s.empresa,
        s.departamento,
        s.vehicle,
        s.semiReboque,
        s.placaSemiReboque,
        s.kmRodado,
        dataSaidaFormatted,
        s.horimetroSaida,
        s.kmSaida,
        s.inspecionadoPor,
        s.motorista1,
        s.motivoSaida,
        s.destino,
        s.observacoesSaida,
        s.attachments.join(', '),
        s.assinaturaMotorista ? "Sim" : "Não",
        status,
      ]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
      };
    }
    worksheet["!cols"] = [
      { wpx: 150 },
      { wpx: 150 },
      { wpx: 100 },
      { wpx: 120 },
      { wpx: 120 },
      { wpx: 100 },
      { wpx: 140 },
      { wpx: 100 },
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Saídas");
    XLSX.writeFile(workbook, "saidas.xlsx");
  };

  const exportChegadasToExcel = () => {
    const headers = [
      "ID Saída",
      "Data/Hora Chegada",
      "Horímetro Chegada",
      "KM Chegada",
      "Motorista (Chegada)",
      "Observações",
      "Anexos",
      "Assinatura Motorista",
    ];
    const data = [headers];
    chegadas.forEach((c) => {
      const dataChegadaFormatted = c.dataChegada ? new Date(c.dataChegada).toLocaleString('pt-BR') : "";
      data.push([
        c.saidaId,
        dataChegadaFormatted,
        c.horimetroChegada,
        c.kmChegada,
        c.motorista1Cheg,
        c.observacoesChegada,
        c.attachments.join(', '),
        c.assinaturaMotorista ? "Sim" : "Não",
      ]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
      };
    }
    worksheet["!cols"] = [
      { wpx: 100 },
      { wpx: 140 },
      { wpx: 120 },
      { wpx: 120 },
      { wpx: 150 },
      { wpx: 200 },
      { wpx: 150 },
      { wpx: 120 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chegadas");
    XLSX.writeFile(workbook, "chegadas.xlsx");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Saída/Chegada de Veículos
      </Typography>

      {/* Botão único para nova operação */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenOperationDialog}>
          Nova Operação
        </Button>
      </Box>

      {/* SEÇÃO DE SAÍDAS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Saídas</Typography>
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

      {/* SEÇÃO DE CHEGADAS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Chegadas</Typography>
            <Button variant="outlined" onClick={exportChegadasToExcel}>
              Exportar Chegadas para Excel
            </Button>
          </Box>
          <DataGrid
            rows={chegadas}
            columns={chegadaColumns}
            pageSize={5}
            autoHeight
            sx={{ bgcolor: 'background.paper' }}
          />
        </CardContent>
      </Card>

      {/* DIALOG UNIFICADO - NOVA OPERAÇÃO */}
      <Dialog open={openOperationDialog} onClose={handleCloseOperationDialog} maxWidth="md" fullWidth>
        <DialogTitle>Nova Operação</DialogTitle>
        <DialogContent dividers>
          <Tabs
            value={modalTab}
            onChange={(e, newValue) => setModalTab(newValue)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Saída" />
            <Tab label="Chegada" />
          </Tabs>

          {modalTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Empresa"
                  fullWidth
                  value={newSaida.empresa}
                  onChange={(e) => setNewSaida({ ...newSaida, empresa: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Departamento do veículo"
                  fullWidth
                  value={newSaida.departamento}
                  onChange={(e) => setNewSaida({ ...newSaida, departamento: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Veículo (Placa)"
                  fullWidth
                  value={newSaida.vehicle}
                  onChange={(e) => setNewSaida({ ...newSaida, vehicle: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Semi-reboque"
                  fullWidth
                  value={newSaida.semiReboque}
                  onChange={(e) => setNewSaida({ ...newSaida, semiReboque: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Placa do Semi-reboque"
                  fullWidth
                  value={newSaida.placaSemiReboque}
                  onChange={(e) => setNewSaida({ ...newSaida, placaSemiReboque: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="KM Rodado (Atual)"
                  type="number"
                  fullWidth
                  value={newSaida.kmRodado}
                  onChange={(e) => setNewSaida({ ...newSaida, kmRodado: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data/Hora de Saída"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newSaida.dataSaida}
                  onChange={(e) => setNewSaida({ ...newSaida, dataSaida: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Horímetro (Saída)"
                  type="number"
                  fullWidth
                  value={newSaida.horimetroSaida}
                  onChange={(e) => setNewSaida({ ...newSaida, horimetroSaida: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="KM (Saída)"
                  type="number"
                  fullWidth
                  value={newSaida.kmSaida}
                  onChange={(e) => setNewSaida({ ...newSaida, kmSaida: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inspecionado por"
                  fullWidth
                  value={newSaida.inspecionadoPor}
                  onChange={(e) => setNewSaida({ ...newSaida, inspecionadoPor: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="1° Motorista"
                  fullWidth
                  value={newSaida.motorista1}
                  onChange={(e) => setNewSaida({ ...newSaida, motorista1: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Motivo de Saída"
                  fullWidth
                  value={newSaida.motivoSaida}
                  onChange={(e) => setNewSaida({ ...newSaida, motivoSaida: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Destino"
                  fullWidth
                  value={newSaida.destino}
                  onChange={(e) => setNewSaida({ ...newSaida, destino: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observações (Saída)"
                  multiline
                  minRows={2}
                  fullWidth
                  value={newSaida.observacoesSaida}
                  onChange={(e) => setNewSaida({ ...newSaida, observacoesSaida: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  Anexos (Saída) <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField type="file" inputProps={{ multiple: true }} onChange={handleSaidaAttachments} />
              </Grid>
            </Grid>
          )}

          {modalTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Saída (disponível)</InputLabel>
                  <Select
                    value={newChegada.saidaId}
                    label="Saída (disponível)"
                    onChange={(e) => setNewChegada({ ...newChegada, saidaId: e.target.value })}
                  >
                    {saidas.filter((s) => !s.closed).map((s) => (
                      <MenuItem key={s.id} value={s.id}>{`ID ${s.id} - ${s.vehicle}`}</MenuItem>
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
                  onChange={(e) => setNewChegada({ ...newChegada, horimetroChegada: e.target.value })}
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
                  onChange={(e) => setNewChegada({ ...newChegada, motorista1Cheg: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observações (Chegada)"
                  multiline
                  minRows={2}
                  fullWidth
                  value={newChegada.observacoesChegada}
                  onChange={(e) => setNewChegada({ ...newChegada, observacoesChegada: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  Anexos (Chegada) <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField type="file" inputProps={{ multiple: true }} onChange={handleChegadaAttachments} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOperationDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveOperation}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG - COMPARAR SAÍDA x CHEGADA */}
      <Dialog open={openCompareDialog} onClose={() => { setCompareData({ saida: null, chegada: null }); setOpenCompareDialog(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          Comparar Saída x Chegada
          <IconButton onClick={() => { setCompareData({ saida: null, chegada: null }); setOpenCompareDialog(false); }} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {compareData.saida && compareData.chegada && (
          <DialogContent dividers>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              <strong>Veículo (Placa):</strong> {compareData.saida.vehicle}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Saída
                </Typography>
                <Typography>
                  <strong>Data/Hora:</strong> {new Date(compareData.saida.dataSaida).toLocaleString('pt-BR')}
                </Typography>
                <Typography>
                  <strong>KM Saída:</strong> {compareData.saida.kmSaida}
                </Typography>
                <Typography>
                  <strong>Horímetro:</strong> {compareData.saida.horimetroSaida}
                </Typography>
                <Typography>
                  <strong>Motorista:</strong> {compareData.saida.motorista1}
                </Typography>
                <Typography>
                  <strong>Motivo:</strong> {compareData.saida.motivoSaida}
                </Typography>
                <Typography>
                  <strong>Destino:</strong> {compareData.saida.destino}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Observações:</strong> {compareData.saida.observacoesSaida}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Anexos:</strong> {compareData.saida.attachments.join(', ')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Chegada
                </Typography>
                <Typography>
                  <strong>Data/Hora:</strong> {new Date(compareData.chegada.dataChegada).toLocaleString('pt-BR')}
                </Typography>
                <Typography>
                  <strong>KM Chegada:</strong> {compareData.chegada.kmChegada}
                </Typography>
                <Typography>
                  <strong>Horímetro:</strong> {compareData.chegada.horimetroChegada}
                </Typography>
                <Typography>
                  <strong>Motorista:</strong> {compareData.chegada.motorista1Cheg}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Observações:</strong> {compareData.chegada.observacoesChegada}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Anexos:</strong> {compareData.chegada.attachments.join(', ')}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
        )}
      </Dialog>

      {/* DIALOG - ASSINATURA DO MOTORISTA */}
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

// ------------- FORMULÁRIOS INICIAIS -------------
function initialSaidaForm() {
  return {
    empresa: '298 DISTRIBUIDORA PRINCESA',
    departamento: '100 TRANSPORTE URBANO',
    vehicle: '',
    semiReboque: '',
    placaSemiReboque: '',
    kmRodado: 0,
    dataSaida: '',
    horimetroSaida: 0,
    kmSaida: 0,
    inspecionadoPor: '',
    motorista1: '',
    motivoSaida: '',
    destino: '',
    observacoesSaida: '',
    attachments: [],
    closed: false,
    assinaturaMotorista: '',
  };
}

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
