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
import api from '../services/api'; // Axios configurado
import { useNavigate } from 'react-router-dom';

// Mapeamento de tipos de veículo para quantidade de pneus
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

  // Lista de veículos (carregados do Parse)
  const [vehicles, setVehicles] = useState([]);

  // Estado para o formulário
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

  const navigate = useNavigate();

  // Carregar veículos ao montar
  useEffect(() => {
    loadVehicles();
  }, []);

  // Função para carregar todos os veículos do Parse
  const loadVehicles = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/getAllVeiculos',
        {},
        {
          headers: {
            'X-Parse-Session-Token': sessionToken,
          },
        }
      );
      if (response.data.result) {
        // Ajustamos para que a DataGrid use "id" = objectId
        const fetched = response.data.result.map((v) => ({
          id: v.objectId,
          placa: v.placa || '',
          marca: v.marca || '',
          modelo: v.modelo || '',
          ano: v.ano || '',
          cor: v.cor || '',
          quilometragem: v.quilometragem || 0,
          chassi: v.chassi || '',
          status: v.status || 'Ativo',
          tipo: v.tipo || '',
          qtdPneus: v.qtdPneus || 0,
        }));
        setVehicles(fetched);
      }
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
      alert('Não foi possível carregar os veículos. Verifique se você tem permissão.');
    }
  };

  // Colunas da DataGrid
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
          <IconButton
            color="primary"
            onClick={() => handleEdit(params.row.id)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Abrir modal para criar
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

  // Editar existente
  const handleEdit = (vehicleId) => {
    const vehicleToEdit = vehicles.find((v) => v.id === vehicleId);
    if (!vehicleToEdit) return;

    setIsEditing(true);
    setEditId(vehicleId);
    setErrors({});

    setNewVehicle({
      placa: vehicleToEdit.placa,
      marca: vehicleToEdit.marca,
      modelo: vehicleToEdit.modelo,
      ano: vehicleToEdit.ano,
      cor: vehicleToEdit.cor,
      quilometragem: vehicleToEdit.quilometragem,
      chassi: vehicleToEdit.chassi,
      status: vehicleToEdit.status,
      tipo: vehicleToEdit.tipo,
      qtdPneus: vehicleToEdit.qtdPneus,
    });
    setOpen(true);
  };

  // Excluir (soft-delete)
  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Deseja realmente excluir este veículo?')) return;
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await api.post(
        '/functions/softDeleteVeiculo',
        { objectId: vehicleId },
        {
          headers: { 'X-Parse-Session-Token': sessionToken },
        }
      );
      // Recarregar lista
      loadVehicles();
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
      alert('Falha ao excluir veículo.');
    }
  };

  // Fechar modal
  const handleCloseDialog = () => {
    setOpen(false);
  };

  // Ao digitar no form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle((prev) => ({ ...prev, [name]: value }));
  };

  // Ao escolher o tipo, atualiza qtdPneus automaticamente
  const handleTipoChange = (e) => {
    const selectedValue = e.target.value;
    const found = vehicleTypes.find((t) => t.value === selectedValue);
    setNewVehicle((prev) => ({
      ...prev,
      tipo: selectedValue,
      qtdPneus: found ? found.tires : 0,
    }));
  };

  // Validações simples
  const validateVehicle = () => {
    const newErrors = {};
    if (!newVehicle.placa.trim()) {
      newErrors.placa = 'Placa é obrigatória.';
    }
    if (!newVehicle.modelo.trim()) {
      newErrors.modelo = 'Modelo é obrigatório.';
    }
    if (!newVehicle.marca.trim()) {
      newErrors.marca = 'Marca é obrigatória.';
    }
    if (!newVehicle.ano) {
      newErrors.ano = 'Ano é obrigatório.';
    } else {
      const yearNum = parseInt(newVehicle.ano, 10);
      if (yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        newErrors.ano = 'Ano inválido.';
      }
    }
    if (!newVehicle.quilometragem.toString().trim()) {
      newErrors.quilometragem = 'Quilometragem é obrigatória.';
    } else {
      const mileageNum = parseInt(newVehicle.quilometragem, 10);
      if (mileageNum < 0) {
        newErrors.quilometragem = 'Quilometragem inválida.';
      }
    }
    return newErrors;
  };

  // Criar ou Editar
  const handleSave = async () => {
    const newErrors = validateVehicle();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Montar objeto para enviar
    const vehicleData = {
      placa: newVehicle.placa,
      marca: newVehicle.marca,
      modelo: newVehicle.modelo,
      ano: parseInt(newVehicle.ano, 10) || 0,
      cor: newVehicle.cor,
      quilometragem: parseInt(newVehicle.quilometragem, 10) || 0,
      chassi: newVehicle.chassi,
      status: newVehicle.status,
      tipo: newVehicle.tipo,
      qtdPneus: parseInt(newVehicle.qtdPneus, 10) || 0,
    };

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (isEditing && editId) {
        // Editar
        await api.post(
          '/functions/editarVeiculo',
          {
            objectId: editId,
            ...vehicleData,
          },
          {
            headers: {
              'X-Parse-Session-Token': sessionToken,
            },
          }
        );
      } else {
        // Criar
        await api.post(
          '/functions/criarVeiculo',
          {
            ...vehicleData,
          },
          {
            headers: {
              'X-Parse-Session-Token': sessionToken,
            },
          }
        );
      }

      // Fecha modal e recarrega
      setOpen(false);
      loadVehicles();
    } catch (err) {
      console.error('Erro ao salvar veículo:', err);
      alert('Falha ao salvar veículo.');
    }
  };

  return (
    <Box>
      {/* Título e botão "Novo Veículo" */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Veículos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Novo Veículo
        </Button>
      </Box>

      {/* Tabela de veículos */}
      <DataGrid
        rows={vehicles}
        columns={columns}
        pageSize={5}
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      {/* Diálogo de cadastro/edição */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
        </DialogTitle>
        <DialogContent dividers>
          {/* Placa */}
          <TextField
            autoFocus
            margin="dense"
            name="placa"
            label="Placa"
            fullWidth
            variant="outlined"
            value={newVehicle.placa}
            onChange={handleChange}
            error={!!errors.placa}
            helperText={errors.placa}
            sx={{ mb: 2 }}
          />

          {/* Marca e Modelo */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="marca"
              label="Marca"
              fullWidth
              variant="outlined"
              value={newVehicle.marca}
              onChange={handleChange}
              error={!!errors.marca}
              helperText={errors.marca}
            />
            <TextField
              margin="dense"
              name="modelo"
              label="Modelo"
              fullWidth
              variant="outlined"
              value={newVehicle.modelo}
              onChange={handleChange}
              error={!!errors.modelo}
              helperText={errors.modelo}
            />
          </Box>

          {/* Ano e Cor */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="ano"
              label="Ano"
              type="number"
              fullWidth
              variant="outlined"
              value={newVehicle.ano}
              onChange={handleChange}
              error={!!errors.ano}
              helperText={errors.ano}
            />
            <TextField
              margin="dense"
              name="cor"
              label="Cor"
              fullWidth
              variant="outlined"
              value={newVehicle.cor}
              onChange={handleChange}
            />
          </Box>

          {/* Quilometragem */}
          <TextField
            margin="dense"
            name="quilometragem"
            label="Quilometragem"
            type="number"
            fullWidth
            variant="outlined"
            value={newVehicle.quilometragem}
            onChange={handleChange}
            error={!!errors.quilometragem}
            helperText={errors.quilometragem}
            sx={{ mb: 2 }}
          />

          {/* Chassi */}
          <TextField
            margin="dense"
            name="chassi"
            label="Chassi"
            fullWidth
            variant="outlined"
            value={newVehicle.chassi}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          {/* Status */}
          <Box sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              fullWidth
              value={newVehicle.status}
              onChange={(e) =>
                setNewVehicle((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <MenuItem value="Ativo">Ativo</MenuItem>
              <MenuItem value="Manutenção">Manutenção</MenuItem>
              <MenuItem value="Inativo">Inativo</MenuItem>
            </Select>
          </Box>

          {/* Tipo e QtdPneus */}
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
            margin="dense"
            name="qtdPneus"
            label="Qtd. Pneus"
            type="number"
            fullWidth
            variant="outlined"
            value={newVehicle.qtdPneus}
            onChange={(e) =>
              setNewVehicle((prev) => ({
                ...prev,
                qtdPneus: e.target.value,
              }))
            }
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
