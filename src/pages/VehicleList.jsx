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
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Badge as BadgeIcon,
  DirectionsCar as CarIcon,
  Business as BrandIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import api from '../services/apiFlask';

const vehicleTypes = [
  { label: 'Passeio', value: 'Passeio', tires: 5 },
  { label: 'Delivery', value: 'Delivery', tires: 5 },
  { label: '3/4', value: '3/4', tires: 7 },
  { label: 'Toco', value: 'Toco', tires: 7 },
  { label: 'Truck', value: 'Truck', tires: 11 },
  { label: 'Bi-truck', value: 'Bi-truck', tires: 13 },
  { label: 'Cavalo', value: 'Cavalo', tires: 10 },
  { label: 'Semi-Reboque (Bi-Trem)', value: 'Semi-Reboque (Bi-Trem)', tires: 10 },
  { label: 'Semi-Reboque (Rodo-Trem)', value: 'Semi-Reboque (Rodo-Trem)', tires: 14 },
];

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
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

  async function loadVehicles() {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.map(v => ({ ...v, qtdPneus: v.qtd_pneus })));
    } catch (err) {
      console.error(err);
      alert('Não foi possível carregar os veículos.');
    }
  }

  function handleOpenDialog() {
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
  }

  function handleEdit(id) {
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    setIsEditing(true);
    setEditId(id);
    setErrors({});
    setNewVehicle({ ...v });
    setOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja realmente excluir este veículo?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadVehicles();
    } catch {
      alert('Falha ao excluir veículo.');
    }
  }

  function handleClose() {
    setOpen(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  }

  function handleTipoChange(e) {
    const tipo = e.target.value;
    const found = vehicleTypes.find(t => t.value === tipo);
    setNewVehicle(prev => ({
      ...prev,
      tipo,
      qtdPneus: found ? found.tires : 0,
    }));
  }

  function validateVehicle() {
    const errs = {};
    if (!newVehicle.placa.trim()) errs.placa = 'Placa é obrigatória.';
    if (!newVehicle.marca.trim()) errs.marca = 'Marca é obrigatória.';
    if (!newVehicle.modelo.trim()) errs.modelo = 'Modelo é obrigatório.';
    if (!newVehicle.ano) errs.ano = 'Ano é obrigatório.';
    else {
      const y = parseInt(newVehicle.ano, 10);
      if (y < 1900 || y > new Date().getFullYear() + 1)
        errs.ano = 'Ano inválido.';
    }
    if (!newVehicle.quilometragem.toString().trim())
      errs.quilometragem = 'Quilometragem é obrigatória.';
    else if (parseInt(newVehicle.quilometragem, 10) < 0)
      errs.quilometragem = 'Quilometragem inválida.';
    return errs;
  }

  async function handleSave() {
    const newErrs = validateVehicle();
    if (Object.keys(newErrs).length) {
      setErrors(newErrs);
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
      if (isEditing) await api.put(`/vehicles/${editId}`, payload);
      else await api.post('/vehicles', payload);
      handleClose();
      loadVehicles();
    } catch {
      alert('Falha ao salvar veículo.');
    }
  }

  const filtered = vehicles.filter(v => {
    const term = filter.toLowerCase();
    return (
      v.placa.toLowerCase().includes(term) ||
      v.modelo.toLowerCase().includes(term) ||
      v.marca.toLowerCase().includes(term)
    );
  });

  return (
    <Box p={2}>
      {/* Cabeçalho */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Veículos</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Buscar placa/modelo/marca"
            size="small"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Novo
          </Button>
        </Box>
      </Box>

      {/* Cards com cor clara e ícones */}
      <Grid container spacing={2}>
        {filtered.map(v => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={v.id}>
            <Card
              sx={{
                bgcolor: '#e0f2f1', // tom de verde-água suave
                color: '#004d40',
                boxShadow: 4,
                borderRadius: 2,
                transition: 'transform .2s',
                '&:hover': { transform: 'scale(1.03)' },
              }}
            >
              <CardActionArea onClick={() => handleEdit(v.id)}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <BadgeIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">{v.placa}</Typography>
                  </Box>
                  <Divider sx={{ bgcolor: '#004d40', mb: 1 }} />
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <CarIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">Modelo: {v.modelo}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <BrandIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">Marca: {v.marca}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <SpeedIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      KM: {v.quilometragem}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
              <Box display="flex" justifyContent="flex-end" p={1}>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(v.id)}
                  sx={{ color: '#b71c1c' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal de cadastro/edição */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
        </DialogTitle>
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
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={newVehicle.status}
              onChange={e =>
                setNewVehicle(prev => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
            >
              <MenuItem value="Ativo">Ativo</MenuItem>
              <MenuItem value="Manutenção">Manutenção</MenuItem>
              <MenuItem value="Inativo">Inativo</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="tipo-label">Tipo do Veículo</InputLabel>
            <Select
              labelId="tipo-label"
              name="tipo"
              value={newVehicle.tipo}
              onChange={handleTipoChange}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {vehicleTypes.map(vt => (
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
            onChange={handleChange}
            helperText="Preenchido automaticamente pelo tipo escolhido."
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
