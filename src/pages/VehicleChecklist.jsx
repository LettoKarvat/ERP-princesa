import React, { useState } from 'react';
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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  CompareArrows,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

/*
  Estrutura dos dados:

  saidas: [
    {
      id: 1,
      empresa: '298 DISTRIBUIDORA PRINCESA',
      departamento: '100 TRANSPORTE URBANO',
      vehicle: 'HHK1G29',         // Placa principal
      semiReboque: '',
      placaSemiReboque: '',
      kmRodado: 152,
      capacidadeCarga: 0,
      dataSaida: '2025-02-05T06:25',
      horimetroSaida: 0,
      kmSaida: 0,
      cargaSaida: 0,
      inspecionadoPor: '',
      motorista1: '',
      motorista2: '',
      motorista3: '',
      motivoSaida: '',
      destino: '',
      funcionalAtendido: '',
      observacoesSaida: '',
      attachments: [],
      closed: false,
    },
  ]

  chegadas: [
    {
      id: 1,
      saidaId: 1,                // Relaciona a qual "Saída" corresponde
      dataChegada: '2025-02-05T20:14',
      horimetroChegada: 0,
      kmChegada: 0,
      cargaChegada: 0,
      motorista1Cheg: '',
      motorista2Cheg: '',
      motorista3Cheg: '',
      observacoesChegada: '',
      attachments: [],
      ...
    },
    ...
  ]
*/

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
      capacidadeCarga: 0,
      dataSaida: '2025-02-05T06:25',
      horimetroSaida: 0,
      kmSaida: 377115,
      cargaSaida: 0,
      inspecionadoPor: '',
      motorista1: '1057 - José Raimundo',
      motorista2: '',
      motorista3: '',
      motivoSaida: 'Entrega Capital',
      destino: 'Santa Izabel / Belém',
      funcionalAtendido: '',
      observacoesSaida: '',
      attachments: ['saida_foto1.png'],
      closed: false,
    },
  ]);

  // Agora chamamos de chegadas
  const [chegadas, setChegadas] = useState([]);

  // -- Estados de abertura dos diálogos
  const [openSaidaDialog, setOpenSaidaDialog] = useState(false);
  const [openChegadaDialog, setOpenChegadaDialog] = useState(false);
  const [openCompareDialog, setOpenCompareDialog] = useState(false);

  // -- Formulário de Saída
  const [newSaida, setNewSaida] = useState(initialSaidaForm());

  // -- Formulário de Chegada
  const [newChegada, setNewChegada] = useState(initialChegadaForm());

  // -- Dados para comparar
  const [compareData, setCompareData] = useState({ saida: null, chegada: null });

  // --------------------- Colunas de SAÍDAS ---------------------
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

  // --------------------- Colunas de CHEGADAS ---------------------
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

  // --------------------- MANIPULAÇÃO DE DIÁLOGOS ---------------------
  function handleOpenSaidaDialog() {
    setNewSaida(initialSaidaForm());
    setOpenSaidaDialog(true);
  }
  function handleCloseSaidaDialog() {
    setOpenSaidaDialog(false);
  }

  function handleOpenChegadaDialog() {
    setNewChegada(initialChegadaForm());
    setOpenChegadaDialog(true);
  }
  function handleCloseChegadaDialog() {
    setOpenChegadaDialog(false);
  }

  function handleCloseCompareDialog() {
    setCompareData({ saida: null, chegada: null });
    setOpenCompareDialog(false);
  }

  // --------------------- SALVAR SAÍDA ---------------------
  function handleSaveSaida() {
    const newId = saidas.length ? saidas[saidas.length - 1].id + 1 : 1;

    const saidaToAdd = {
      ...newSaida,
      id: newId,
      kmRodado: Number(newSaida.kmRodado) || 0,
      capacidadeCarga: Number(newSaida.capacidadeCarga) || 0,
      horimetroSaida: Number(newSaida.horimetroSaida) || 0,
      kmSaida: Number(newSaida.kmSaida) || 0,
      cargaSaida: Number(newSaida.cargaSaida) || 0,
      closed: false,
    };

    setSaidas((prev) => [...prev, saidaToAdd]);
    setOpenSaidaDialog(false);
  }

  // --------------------- SALVAR CHEGADA ---------------------
  function handleSaveChegada() {
    // Vincula esta chegada a uma saída não-fechada
    const saidaId = Number(newChegada.saidaId);
    const saidaRef = saidas.find((s) => s.id === saidaId);

    if (!saidaRef) {
      alert('Saída inválida ou não encontrada!');
      return;
    }

    // Cria a chegada
    const newId = chegadas.length ? chegadas[chegadas.length - 1].id + 1 : 1;
    const chegadaToAdd = {
      ...newChegada,
      id: newId,
      horimetroChegada: Number(newChegada.horimetroChegada) || 0,
      kmChegada: Number(newChegada.kmChegada) || 0,
      cargaChegada: Number(newChegada.cargaChegada) || 0,
    };

    // Marca a saída como fechada
    setSaidas((prev) =>
      prev.map((s) => (s.id === saidaId ? { ...s, closed: true } : s))
    );
    // Adiciona na lista de chegadas
    setChegadas((prev) => [...prev, chegadaToAdd]);
    setOpenChegadaDialog(false);
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

  // Lista de saídas disponíveis para chegada (closed = false)
  const availableSaidas = saidas.filter((s) => !s.closed);

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

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Saída/Chegada de Veículos
      </Typography>

      {/** SEÇÃO DE SAÍDAS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Saídas</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenSaidaDialog}
            >
              Nova Saída
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

      {/** SEÇÃO DE CHEGADAS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Chegadas</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenChegadaDialog}
            >
              Nova Chegada
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

      {/** DIALOG - NOVA SAÍDA */}
      <Dialog
        open={openSaidaDialog}
        onClose={handleCloseSaidaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Saída do Veículo</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Empresa */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Empresa"
                fullWidth
                value={newSaida.empresa}
                onChange={(e) => setNewSaida({ ...newSaida, empresa: e.target.value })}
              />
            </Grid>

            {/* Departamento */}
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

            {/* Placa Principal */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Veículo (Placa)"
                fullWidth
                value={newSaida.vehicle}
                onChange={(e) => setNewSaida({ ...newSaida, vehicle: e.target.value })}
              />
            </Grid>

            {/* Semi-Reboque */}
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

            {/* Placa do Semi-Reboque */}
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

            {/* KM Rodado (info) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="KM Rodado (info)"
                type="number"
                fullWidth
                value={newSaida.kmRodado}
                onChange={(e) =>
                  setNewSaida({ ...newSaida, kmRodado: e.target.value })
                }
              />
            </Grid>

            {/* Capacidade de Carga */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacidade de Carga (kg)"
                type="number"
                fullWidth
                value={newSaida.capacidadeCarga}
                onChange={(e) =>
                  setNewSaida({ ...newSaida, capacidadeCarga: e.target.value })
                }
              />
            </Grid>

            {/* Data/Hora Saída */}
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

            {/* Horímetro Saída */}
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

            {/* KM Saída */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="KM (Saída)"
                type="number"
                fullWidth
                value={newSaida.kmSaida}
                onChange={(e) => setNewSaida({ ...newSaida, kmSaida: e.target.value })}
              />
            </Grid>

            {/* Carga Útil Saída */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Carga útil (Saída)"
                type="number"
                fullWidth
                value={newSaida.cargaSaida}
                onChange={(e) =>
                  setNewSaida({ ...newSaida, cargaSaida: e.target.value })
                }
              />
            </Grid>

            {/* Inspecionado por */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Inspecionado por"
                fullWidth
                value={newSaida.inspecionadoPor}
                onChange={(e) =>
                  setNewSaida({ ...newSaida, inspecionadoPor: e.target.value })
                }
              />
            </Grid>

            {/* Motoristas */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="1° Motorista"
                fullWidth
                value={newSaida.motorista1}
                onChange={(e) => setNewSaida({ ...newSaida, motorista1: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="2° Motorista"
                fullWidth
                value={newSaida.motorista2}
                onChange={(e) => setNewSaida({ ...newSaida, motorista2: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="3° Motorista"
                fullWidth
                value={newSaida.motorista3}
                onChange={(e) => setNewSaida({ ...newSaida, motorista3: e.target.value })}
              />
            </Grid>

            {/* Motivo de saída */}
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

            {/* Destino */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Destino"
                fullWidth
                value={newSaida.destino}
                onChange={(e) => setNewSaida({ ...newSaida, destino: e.target.value })}
              />
            </Grid>

            {/* Funcional Atendido (caso exista) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Funcional Atendido"
                fullWidth
                value={newSaida.funcionalAtendido}
                onChange={(e) =>
                  setNewSaida({ ...newSaida, funcionalAtendido: e.target.value })
                }
              />
            </Grid>

            {/* Observações (Saída) */}
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

            {/* Anexos */}
            <Grid item xs={12}>
              <Typography variant="subtitle2">Anexos (Saída)</Typography>
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

      {/** DIALOG - NOVA CHEGADA */}
      <Dialog
        open={openChegadaDialog}
        onClose={handleCloseChegadaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chegada do Veículo</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Selecione a Saída */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Saída (disponível)</InputLabel>
                <Select
                  value={newChegada.saidaId}
                  label="Saída (disponível)"
                  onChange={(e) =>
                    setNewChegada({ ...newChegada, saidaId: e.target.value })
                  }
                >
                  {availableSaidas.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {`ID ${s.id} - ${s.vehicle}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Data/Hora Chegada */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data/Hora de Chegada"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newChegada.dataChegada}
                onChange={(e) =>
                  setNewChegada({ ...newChegada, dataChegada: e.target.value })
                }
              />
            </Grid>

            {/* Horímetro Chegada */}
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

            {/* KM Chegada */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="KM (Chegada)"
                type="number"
                fullWidth
                value={newChegada.kmChegada}
                onChange={(e) =>
                  setNewChegada({ ...newChegada, kmChegada: e.target.value })
                }
              />
            </Grid>

            {/* Carga Útil Chegada */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Carga útil (Chegada)"
                type="number"
                fullWidth
                value={newChegada.cargaChegada}
                onChange={(e) =>
                  setNewChegada({ ...newChegada, cargaChegada: e.target.value })
                }
              />
            </Grid>

            {/* Motoristas (Chegada) */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="1° Motorista"
                fullWidth
                value={newChegada.motorista1Cheg}
                onChange={(e) =>
                  setNewChegada({ ...newChegada, motorista1Cheg: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="2° Motorista"
                fullWidth
                value={newChegada.motorista2Cheg}
                onChange={(e) =>
                  setNewChegada({ ...newChegada, motorista2Cheg: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="3° Motorista"
                fullWidth
                value={newChegada.motorista3Cheg}
                onChange={(e) =>
                  setNewChegada({ ...newChegada, motorista3Cheg: e.target.value })
                }
              />
            </Grid>

            {/* Observações Chegada */}
            <Grid item xs={12}>
              <TextField
                label="Observações (Chegada)"
                multiline
                minRows={2}
                fullWidth
                value={newChegada.observacoesChegada}
                onChange={(e) =>
                  setNewChegada({
                    ...newChegada,
                    observacoesChegada: e.target.value,
                  })
                }
              />
            </Grid>

            {/* Anexos (Chegada) */}
            <Grid item xs={12}>
              <Typography variant="subtitle2">Anexos (Chegada)</Typography>
              <TextField
                type="file"
                inputProps={{ multiple: true }}
                onChange={handleChegadaAttachments}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChegadaDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveChegada}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/** DIALOG - COMPARAR SAÍDA vs CHEGADA */}
      <Dialog
        open={openCompareDialog}
        onClose={handleCloseCompareDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Comparar Saída x Chegada
          <IconButton
            onClick={handleCloseCompareDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {compareData.saida && compareData.chegada && (
          <DialogContent dividers>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              <strong>Veículo (Placa):</strong> {compareData.saida.vehicle}
            </Typography>

            <Grid container spacing={2}>
              {/* COLUNA SAÍDA */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Saída
                </Typography>
                <Typography>
                  <strong>Data/Hora:</strong>{' '}
                  {new Date(compareData.saida.dataSaida).toLocaleString('pt-BR')}
                </Typography>
                <Typography>
                  <strong>KM Saída:</strong> {compareData.saida.kmSaida}
                </Typography>
                <Typography>
                  <strong>Horímetro:</strong> {compareData.saida.horimetroSaida}
                </Typography>
                <Typography>
                  <strong>Carga Útil Saída:</strong> {compareData.saida.cargaSaida}
                </Typography>
                <Typography>
                  <strong>Motorista 1:</strong> {compareData.saida.motorista1}
                </Typography>
                <Typography>
                  <strong>Motorista 2:</strong> {compareData.saida.motorista2}
                </Typography>
                <Typography>
                  <strong>Motorista 3:</strong> {compareData.saida.motorista3}
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
                  <strong>Anexos:</strong>{' '}
                  {compareData.saida.attachments.join(', ')}
                </Typography>
              </Grid>

              {/* COLUNA CHEGADA */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Chegada
                </Typography>
                <Typography>
                  <strong>Data/Hora:</strong>{' '}
                  {new Date(compareData.chegada.dataChegada).toLocaleString('pt-BR')}
                </Typography>
                <Typography>
                  <strong>KM Chegada:</strong> {compareData.chegada.kmChegada}
                </Typography>
                <Typography>
                  <strong>Horímetro:</strong> {compareData.chegada.horimetroChegada}
                </Typography>
                <Typography>
                  <strong>Carga Útil Chegada:</strong>{' '}
                  {compareData.chegada.cargaChegada}
                </Typography>
                <Typography>
                  <strong>Motorista 1:</strong> {compareData.chegada.motorista1Cheg}
                </Typography>
                <Typography>
                  <strong>Motorista 2:</strong> {compareData.chegada.motorista2Cheg}
                </Typography>
                <Typography>
                  <strong>Motorista 3:</strong> {compareData.chegada.motorista3Cheg}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Observações:</strong>{' '}
                  {compareData.chegada.observacoesChegada}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Anexos:</strong>{' '}
                  {compareData.chegada.attachments.join(', ')}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
        )}
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
    capacidadeCarga: 0,
    dataSaida: '',
    horimetroSaida: 0,
    kmSaida: 0,
    cargaSaida: 0,
    inspecionadoPor: '',
    motorista1: '',
    motorista2: '',
    motorista3: '',
    motivoSaida: '',
    destino: '',
    funcionalAtendido: '',
    observacoesSaida: '',
    attachments: [],
    closed: false,
  };
}

function initialChegadaForm() {
  return {
    saidaId: '',
    dataChegada: '',
    horimetroChegada: 0,
    kmChegada: 0,
    cargaChegada: 0,
    motorista1Cheg: '',
    motorista2Cheg: '',
    motorista3Cheg: '',
    observacoesChegada: '',
    attachments: [],
  };
}
