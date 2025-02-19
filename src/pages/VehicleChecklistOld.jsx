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
      vehicle: 'ABC1234',
      date: '2025-01-01',
      mileage: 50000,
      tireCondition: 'Bom',
      oilLevel: 'Normal',
      brakeCondition: 'Bom',
      attachments: [ 'foto1.jpg', 'doc.pdf', ... ],
      observations: 'Veículo saiu em bom estado.',
      closed: false,
      additionalFields: [ { label: 'Filtro de ar', value: 'Ok' }, ... ]
    },
    ...
  ]

  retornos: [
    {
      id: 1,
      saidaId: 1,         // Relaciona a qual "Saída" corresponde
      vehicle: 'ABC1234', // Copiado da saída
      date: '2025-01-05',
      mileage: 50400,
      tireCondition: 'Regular',
      oilLevel: 'Baixo',
      brakeCondition: 'Regular',
      attachments: [...],
      observations: 'Observações de retorno',
      additionalFields: [...]
    },
    ...
  ]
*/

export default function CheckList() {
  const [saidas, setSaidas] = useState([
    {
      id: 1,
      vehicle: 'ABC1234',
      date: '2025-01-01',
      mileage: 50000,
      tireCondition: 'Bom',
      oilLevel: 'Normal',
      brakeCondition: 'Bom',
      attachments: ['saida_foto1.png'],
      observations: 'Veículo saiu em bom estado.',
      closed: false,
      additionalFields: [
        { label: 'Filtro de Ar', value: 'Ok' },
        { label: 'Pintura', value: 'Sem arranhões' },
      ],
    },
  ]);

  const [retornos, setRetornos] = useState([]);

  // -- Estados de abertura dos diálogos
  const [openSaidaDialog, setOpenSaidaDialog] = useState(false);
  const [openRetornoDialog, setOpenRetornoDialog] = useState(false);
  const [openCompareDialog, setOpenCompareDialog] = useState(false);

  // -- Formulário de Saída
  const [newSaida, setNewSaida] = useState(initialSaidaForm());
  //  Campos adicionais dinâmicos (rascunho para inserir)
  const [saidaFieldLabel, setSaidaFieldLabel] = useState('');
  const [saidaFieldValue, setSaidaFieldValue] = useState('');

  // -- Formulário de Retorno
  const [newRetorno, setNewRetorno] = useState(initialRetornoForm());
  //  Campos adicionais dinâmicos (rascunho para inserir)
  const [retornoFieldLabel, setRetornoFieldLabel] = useState('');
  const [retornoFieldValue, setRetornoFieldValue] = useState('');

  // -- Dados para comparar
  const [compareData, setCompareData] = useState({ saida: null, retorno: null });

  // Colunas da grid de SAÍDAS
  const saidaColumns = [
    { field: 'vehicle', headerName: 'Veículo', width: 120 },
    { field: 'date', headerName: 'Data Saída', width: 110 },
    { field: 'mileage', headerName: 'KM Saída', width: 100 },
    { field: 'tireCondition', headerName: 'Pneu', width: 100 },
    { field: 'oilLevel', headerName: 'Óleo', width: 90 },
    { field: 'brakeCondition', headerName: 'Freios', width: 100 },
    {
      field: 'status',
      headerName: 'Retorno?',
      width: 120,
      renderCell: (params) => (params.row.closed ? 'Concluído' : 'Em uso'),
    },
  ];

  // Colunas da grid de RETORNOS
  const retornoColumns = [
    { field: 'saidaId', headerName: 'ID Saída', width: 90 },
    { field: 'vehicle', headerName: 'Veículo', width: 120 },
    { field: 'date', headerName: 'Data Retorno', width: 110 },
    { field: 'mileage', headerName: 'KM Retorno', width: 110 },
    { field: 'tireCondition', headerName: 'Pneu', width: 100 },
    { field: 'oilLevel', headerName: 'Óleo', width: 80 },
    { field: 'brakeCondition', headerName: 'Freios', width: 100 },
    {
      field: 'actions',
      headerName: 'Comparar',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Comparar Saída vs Retorno">
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
    setSaidaFieldLabel('');
    setSaidaFieldValue('');
    setOpenSaidaDialog(true);
  }
  function handleCloseSaidaDialog() {
    setOpenSaidaDialog(false);
  }

  function handleOpenRetornoDialog() {
    setNewRetorno(initialRetornoForm());
    setRetornoFieldLabel('');
    setRetornoFieldValue('');
    setOpenRetornoDialog(true);
  }
  function handleCloseRetornoDialog() {
    setOpenRetornoDialog(false);
  }

  function handleCloseCompareDialog() {
    setCompareData({ saida: null, retorno: null });
    setOpenCompareDialog(false);
  }

  // --------------------- SALVAR SAÍDA ---------------------
  function handleSaveSaida() {
    const newId = saidas.length ? saidas[saidas.length - 1].id + 1 : 1;
    const saidaToAdd = {
      ...newSaida,
      id: newId,
      mileage: Number(newSaida.mileage) || 0,
      closed: false,
    };
    setSaidas((prev) => [...prev, saidaToAdd]);
    setOpenSaidaDialog(false);
  }

  // --------------------- SALVAR RETORNO ---------------------
  function handleSaveRetorno() {
    // Vincula este retorno a uma saída não-fechada
    const saidaId = Number(newRetorno.saidaId);
    const saidaRef = saidas.find((s) => s.id === saidaId);
    if (!saidaRef) {
      alert('Saída inválida ou não encontrada!');
      return;
    }
    // Cria o retorno
    const newId = retornos.length ? retornos[retornos.length - 1].id + 1 : 1;
    const retornoToAdd = {
      ...newRetorno,
      id: newId,
      vehicle: saidaRef.vehicle,
      mileage: Number(newRetorno.mileage) || 0,
    };
    // Marca a saída como fechada
    setSaidas((prev) =>
      prev.map((s) => (s.id === saidaId ? { ...s, closed: true } : s))
    );
    // Adiciona na lista
    setRetornos((prev) => [...prev, retornoToAdd]);
    setOpenRetornoDialog(false);
  }

  // --------------------- COMPARAÇÃO ---------------------
  function handleCompare(retorno) {
    const saidaRef = saidas.find((s) => s.id === retorno.saidaId);
    if (!saidaRef) {
      alert('Saída correspondente não encontrada!');
      return;
    }
    setCompareData({ saida: saidaRef, retorno: retorno });
    setOpenCompareDialog(true);
  }

  // Lista de saídas disponíveis para retorno (closed = false)
  const availableSaidas = saidas.filter((s) => !s.closed);

  // --------------------- CAMPOS ADICIONAIS DINÂMICOS (SAÍDA) ---------------------
  function handleAddSaidaField() {
    if (!saidaFieldLabel.trim()) return;
    setNewSaida((prev) => ({
      ...prev,
      additionalFields: [
        ...prev.additionalFields,
        { label: saidaFieldLabel, value: saidaFieldValue },
      ],
    }));
    setSaidaFieldLabel('');
    setSaidaFieldValue('');
  }
  function handleRemoveSaidaField(index) {
    setNewSaida((prev) => {
      const newFields = [...prev.additionalFields];
      newFields.splice(index, 1);
      return { ...prev, additionalFields: newFields };
    });
  }

  // --------------------- CAMPOS ADICIONAIS DINÂMICOS (RETORNO) ---------------------
  function handleAddRetornoField() {
    if (!retornoFieldLabel.trim()) return;
    setNewRetorno((prev) => ({
      ...prev,
      additionalFields: [
        ...prev.additionalFields,
        { label: retornoFieldLabel, value: retornoFieldValue },
      ],
    }));
    setRetornoFieldLabel('');
    setRetornoFieldValue('');
  }
  function handleRemoveRetornoField(index) {
    setNewRetorno((prev) => {
      const newFields = [...prev.additionalFields];
      newFields.splice(index, 1);
      return { ...prev, additionalFields: newFields };
    });
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

  function handleRetornoAttachments(e) {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setNewRetorno((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...names],
    }));
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Checklist de Veículos
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

      {/** SEÇÃO DE RETORNOS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Retornos</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenRetornoDialog}
            >
              Novo Retorno
            </Button>
          </Box>

          <DataGrid
            rows={retornos}
            columns={retornoColumns}
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
        <DialogTitle>Nova Saída</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
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
                label="Data Saída"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newSaida.date}
                onChange={(e) => setNewSaida({ ...newSaida, date: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="KM Saída"
                type="number"
                fullWidth
                value={newSaida.mileage}
                onChange={(e) => setNewSaida({ ...newSaida, mileage: e.target.value })}
              />
            </Grid>

            {/* Pneu */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Pneu</InputLabel>
                <Select
                  value={newSaida.tireCondition}
                  label="Pneu"
                  onChange={(e) =>
                    setNewSaida({ ...newSaida, tireCondition: e.target.value })
                  }
                >
                  <MenuItem value="Bom">Bom</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Ruim">Ruim</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Óleo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Óleo</InputLabel>
                <Select
                  value={newSaida.oilLevel}
                  label="Óleo"
                  onChange={(e) =>
                    setNewSaida({ ...newSaida, oilLevel: e.target.value })
                  }
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Baixo">Baixo</MenuItem>
                  <MenuItem value="Muito Baixo">Muito Baixo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Freios */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Freios</InputLabel>
                <Select
                  value={newSaida.brakeCondition}
                  label="Freios"
                  onChange={(e) =>
                    setNewSaida({ ...newSaida, brakeCondition: e.target.value })
                  }
                >
                  <MenuItem value="Bom">Bom</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Ruim">Ruim</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                label="Observações"
                multiline
                minRows={2}
                fullWidth
                value={newSaida.observations}
                onChange={(e) =>
                  setNewSaida({ ...newSaida, observations: e.target.value })
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

          {/* Campos adicionais dinâmicos */}
          <Box sx={{ mt: 3, borderTop: '1px solid #ccc', pt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Campos Opcionais (Saída)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Nome do campo (ex: Filtro de ar)"
                value={saidaFieldLabel}
                onChange={(e) => setSaidaFieldLabel(e.target.value)}
              />
              <TextField
                label="Valor (ex: Sujo, Ok)"
                value={saidaFieldValue}
                onChange={(e) => setSaidaFieldValue(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddSaidaField}>
                Adicionar
              </Button>
            </Box>

            {newSaida.additionalFields.length > 0 && (
              <Box>
                {newSaida.additionalFields.map((field, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>{field.label}:</strong> {field.value}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveSaidaField(idx)}
                      size="small"
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseSaidaDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveSaida}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/** DIALOG - NOVO RETORNO */}
      <Dialog
        open={openRetornoDialog}
        onClose={handleCloseRetornoDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Novo Retorno</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Saída (disponível)</InputLabel>
                <Select
                  value={newRetorno.saidaId}
                  label="Saída (disponível)"
                  onChange={(e) =>
                    setNewRetorno({ ...newRetorno, saidaId: e.target.value })
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

            <Grid item xs={12} sm={6}>
              <TextField
                label="Data Retorno"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newRetorno.date}
                onChange={(e) => setNewRetorno({ ...newRetorno, date: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="KM Retorno"
                type="number"
                fullWidth
                value={newRetorno.mileage}
                onChange={(e) =>
                  setNewRetorno({ ...newRetorno, mileage: e.target.value })
                }
              />
            </Grid>

            {/* Pneu */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Pneu</InputLabel>
                <Select
                  value={newRetorno.tireCondition}
                  label="Pneu"
                  onChange={(e) =>
                    setNewRetorno({ ...newRetorno, tireCondition: e.target.value })
                  }
                >
                  <MenuItem value="Bom">Bom</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Ruim">Ruim</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Óleo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Óleo</InputLabel>
                <Select
                  value={newRetorno.oilLevel}
                  label="Óleo"
                  onChange={(e) =>
                    setNewRetorno({ ...newRetorno, oilLevel: e.target.value })
                  }
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Baixo">Baixo</MenuItem>
                  <MenuItem value="Muito Baixo">Muito Baixo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Freios */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Freios</InputLabel>
                <Select
                  value={newRetorno.brakeCondition}
                  label="Freios"
                  onChange={(e) =>
                    setNewRetorno({ ...newRetorno, brakeCondition: e.target.value })
                  }
                >
                  <MenuItem value="Bom">Bom</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Ruim">Ruim</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                label="Observações Retorno"
                multiline
                minRows={2}
                fullWidth
                value={newRetorno.observations}
                onChange={(e) =>
                  setNewRetorno({ ...newRetorno, observations: e.target.value })
                }
              />
            </Grid>

            {/* Anexos */}
            <Grid item xs={12}>
              <Typography variant="subtitle2">Anexos (Retorno)</Typography>
              <TextField
                type="file"
                inputProps={{ multiple: true }}
                onChange={handleRetornoAttachments}
              />
            </Grid>
          </Grid>

          {/* Campos opcionais (dinâmicos) no Retorno */}
          <Box sx={{ mt: 3, borderTop: '1px solid #ccc', pt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Campos Opcionais (Retorno)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Nome do campo (ex: Filtro de ar)"
                value={retornoFieldLabel}
                onChange={(e) => setRetornoFieldLabel(e.target.value)}
              />
              <TextField
                label="Valor (ex: Sujo, Ok)"
                value={retornoFieldValue}
                onChange={(e) => setRetornoFieldValue(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddRetornoField}>
                Adicionar
              </Button>
            </Box>

            {newRetorno.additionalFields.length > 0 && (
              <Box>
                {newRetorno.additionalFields.map((field, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>{field.label}:</strong> {field.value}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveRetornoField(idx)}
                      size="small"
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRetornoDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveRetorno}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/** DIALOG - COMPARAR SAÍDA vs RETORNO */}
      <Dialog
        open={openCompareDialog}
        onClose={handleCloseCompareDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Comparar Saída x Retorno
          <IconButton
            onClick={handleCloseCompareDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {compareData.saida && compareData.retorno && (
          <DialogContent dividers>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              <strong>Veículo:</strong> {compareData.saida.vehicle}
            </Typography>

            <Grid container spacing={2}>
              {/* COLUNA SAÍDA */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Saída
                </Typography>
                <Typography>Data: {compareData.saida.date}</Typography>
                <Typography>KM: {compareData.saida.mileage}</Typography>
                <Typography>Pneu: {compareData.saida.tireCondition}</Typography>
                <Typography>Óleo: {compareData.saida.oilLevel}</Typography>
                <Typography>Freios: {compareData.saida.brakeCondition}</Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Observações:</strong> {compareData.saida.observations}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Anexos:</strong>{' '}
                  {compareData.saida.attachments.join(', ')}
                </Typography>

                {/* Campos adicionais da saída */}
                {compareData.saida.additionalFields?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Campos Opcionais (Saída)</Typography>
                    {compareData.saida.additionalFields.map((field, idx) => (
                      <Typography key={idx}>
                        - <strong>{field.label}:</strong> {field.value}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* COLUNA RETORNO */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Retorno
                </Typography>
                <Typography>Data: {compareData.retorno.date}</Typography>
                <Typography>KM: {compareData.retorno.mileage}</Typography>
                <Typography>Pneu: {compareData.retorno.tireCondition}</Typography>
                <Typography>Óleo: {compareData.retorno.oilLevel}</Typography>
                <Typography>Freios: {compareData.retorno.brakeCondition}</Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Observações:</strong> {compareData.retorno.observations}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Anexos:</strong>{' '}
                  {compareData.retorno.attachments.join(', ')}
                </Typography>

                {/* Campos adicionais do retorno */}
                {compareData.retorno.additionalFields?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Campos Opcionais (Retorno)</Typography>
                    {compareData.retorno.additionalFields.map((field, idx) => (
                      <Typography key={idx}>
                        - <strong>{field.label}:</strong> {field.value}
                      </Typography>
                    ))}
                  </Box>
                )}
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
    vehicle: '',
    date: '',
    mileage: '',
    tireCondition: 'Bom',
    oilLevel: 'Normal',
    brakeCondition: 'Bom',
    attachments: [],
    observations: '',
    additionalFields: [],
  };
}

function initialRetornoForm() {
  return {
    saidaId: '',
    date: '',
    mileage: '',
    tireCondition: 'Bom',
    oilLevel: 'Normal',
    brakeCondition: 'Bom',
    attachments: [],
    observations: '',
    additionalFields: [],
  };
}
