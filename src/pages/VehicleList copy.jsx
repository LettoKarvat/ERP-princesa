import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../services/apiFlask'; // Axios configurado para apontar ao seu Flask

const vehicleTypes = [
  { label: 'Passeio', value: 'Passeio', tires: 5 },
  { label: 'Delivery', value: 'Delivery', tires: 5 },
  { label: '3/4', value: '3/4', tires: 7 },
  { label: 'Toco', value: 'Toco', tires: 7 },
  { label: 'Truck', value: 'Truck', tires: 11 },
  { label: 'Bi-truck', value: 'Bi-truck', tires: 13 },
  { label: 'Cavalo', value: 'Cavalo', tires: 10 },
  { label: 'Semi-reboque Bi-trem', value: 'Semi-Reboque (Bi-Trem)', tires: 10 },
  { label: 'Semi-reboque Rodo-trem', value: 'Semi-Reboque (Rodo-Trem)', tires: 14 },
];

function VehicleList() {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    cor: '',
    quilometragem: '',
    chassi: '',
    status: 'Ativo',
    tipo: '',
    qtdPneus: 0,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadVehicles();
  }, []);

  // === LISTAGEM VIA FLASK ===
  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      // response.data é um array de veículos no formato Snake_case
      const fetched = response.data.map((v) => ({
        id: v.id,
        placa: v.placa || '',
        marca: v.marca || '',
        modelo: v.modelo || '',
        ano: v.ano || '',
        cor: v.cor || '',
        quilometragem: v.quilometragem || 0,
        chassi: v.chassi || '',
        status: v.status || 'Ativo',
        tipo: v.tipo || '',
        qtdPneus: v.qtd_pneus || 0,
      }));
      setVehicles(fetched);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
      alert('Não foi possível carregar os veículos.');
    }
  };

  const columns = [
    { field: 'placa', headerName: 'Placa', width: 100 },
    { field: 'marca', headerName: 'Marca', width: 90 },
    { field: 'modelo', headerName: 'Modelo', width: 100 },
    { field: 'ano', headerName: 'Ano', width: 70 },
    { field: 'cor', headerName: 'Cor', width: 70 },
    { field: 'quilometragem', headerName: 'KM', width: 100 },
    { field: 'chassi', headerName: 'Chassi', width: 150 },
    { field: 'status', headerName: 'Status', width: 90 },
    { field: 'tipo', headerName: 'Tipo', width: 100 },
    { field: 'qtdPneus', headerName: 'Pneus', width: 80 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 130,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleEdit(params.row.id)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleOpenDialog = () => {
    setIsEditing(false);
    setEditId(null);
    setErrors({});
    setNewVehicle({
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      cor: '',
      quilometragem: '',
      chassi: '',
      status: 'Ativo',
      tipo: '',
      qtdPneus: 0,
    });
    setOpen(true);
  };

  const handleEdit = (vehicleId) => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) return;
    setIsEditing(true);
    setEditId(vehicleId);
    setErrors({});
    setNewVehicle({ ...v });
    setOpen(true);
  };

  // === SOFT-DELETE VIA FLASK ===
  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Deseja realmente excluir este veículo?')) return;
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      loadVehicles();
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
      alert('Falha ao excluir veículo.');
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (e) => {
    const selected = e.target.value;
    const found = vehicleTypes.find((t) => t.value === selected);
    setNewVehicle((prev) => ({
      ...prev,
      tipo: selected,
      qtdPneus: found ? found.tires : 0,
    }));
  };

  const validateVehicle = () => {
    const errs = {};
    if (!newVehicle.placa.trim()) errs.placa = 'Placa é obrigatória.';
    if (!newVehicle.modelo.trim()) errs.modelo = 'Modelo é obrigatório.';
    if (!newVehicle.marca.trim()) errs.marca = 'Marca é obrigatória.';
    if (!newVehicle.ano) errs.ano = 'Ano é obrigatório.';
    else {
      const y = parseInt(newVehicle.ano, 10);
      if (y < 1900 || y > new Date().getFullYear() + 1) errs.ano = 'Ano inválido.';
    }
    if (!newVehicle.quilometragem.toString().trim()) errs.quilometragem = 'Quilometragem é obrigatória.';
    else if (parseInt(newVehicle.quilometragem, 10) < 0) errs.quilometragem = 'Quilometragem inválida.';
    return errs;
  };

  // === CREATE / UPDATE VIA FLASK ===
  const handleSave = async () => {
    const newErrors = validateVehicle();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    const payload = {
      placa: newVehicle.placa,
      marca: newVehicle.marca,
      modelo: newVehicle.modelo,
      ano: parseInt(newVehicle.ano, 10),
      cor: newVehicle.cor,
      quilometragem: parseInt(newVehicle.quilometragem, 10),
      chassi: newVehicle.chassi,
      status: newVehicle.status,
      tipo: newVehicle.tipo,
      qtd_pneus: parseInt(newVehicle.qtdPneus, 10),
    };

    try {
      if (isEditing && editId) {
        await api.put(`/vehicles/${editId}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      setOpen(false);
      loadVehicles();
    } catch (err) {
      console.error('Erro ao salvar veículo:', err);
      alert('Falha ao salvar veículo.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Veículos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Novo Veículo
        </Button>
      </Box>

      <DataGrid
        rows={vehicles}
        columns={columns}
        pageSize={5}
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            name="placa"
            label="Placa"
            fullWidth
            value={newVehicle.placa}
            onChange={handleChange}
            error={!!errors.placa}
            helperText={errors.placa}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              name="marca"
              label="Marca"
              fullWidth
              value={newVehicle.marca}
              onChange={handleChange}
              error={!!errors.marca}
              helperText={errors.marca}
            />
            <TextField
              name="modelo"
              label="Modelo"
              fullWidth
              value={newVehicle.modelo}
              onChange={handleChange}
              error={!!errors.modelo}
              helperText={errors.modelo}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              name="ano"
              label="Ano"
              type="number"
              fullWidth
              value={newVehicle.ano}
              onChange={handleChange}
              error={!!errors.ano}
              helperText={errors.ano}
            />
            <TextField
              name="cor"
              label="Cor"
              fullWidth
              value={newVehicle.cor}
              onChange={handleChange}
            />
          </Box>

          <TextField
            name="quilometragem"
            label="Quilometragem"
            type="number"
            fullWidth
            value={newVehicle.quilometragem}
            onChange={handleChange}
            error={!!errors.quilometragem}
            helperText={errors.quilometragem}
            sx={{ mb: 2 }}
          />

          <TextField
            name="chassi"
            label="Chassi"
            fullWidth
            value={newVehicle.chassi}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              fullWidth
              value={newVehicle.status}
              onChange={(e) => setNewVehicle((prev) => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="Ativo">Ativo</MenuItem>
              <MenuItem value="Manutenção">Manutenção</MenuItem>
              <MenuItem value="Inativo">Inativo</MenuItem>
            </Select>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="tipo-label">Tipo do Veículo</InputLabel>
            <Select
              labelId="tipo-label"
              name="tipo"
              label="Tipo do Veículo"
              value={newVehicle.tipo}
              onChange={handleTipoChange}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {vehicleTypes.map((vt) => (
                <MenuItem key={vt.value} value={vt.value}>
                  {vt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="qtdPneus"
            label="Qtd. Pneus"
            type="number"
            fullWidth
            value={newVehicle.qtdPneus}
            onChange={(e) => setNewVehicle((prev) => ({ ...prev, qtdPneus: e.target.value }))}
            helperText="Preenchido automaticamente pelo tipo escolhido."
            sx={{ mb: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default VehicleList;
