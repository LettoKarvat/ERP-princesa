import { useState } from 'react';
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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

function VehicleList() {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // controla se estamos editando ou criando
  const [editId, setEditId] = useState(null);        // guarda o ID do veículo em edição

  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      plate: 'ABC1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Prata',
      mileage: 15000,
      chassis: '9BWZZZ377VT004251',
      status: 'Ativo',
    },
    {
      id: 2,
      plate: 'DEF5678',
      brand: 'Honda',
      model: 'Civic',
      year: 2021,
      color: 'Preto',
      mileage: 10000,
      chassis: '9BWZZZ377VT004252',
      status: 'Ativo',
    },
    {
      id: 3,
      plate: 'GHI9012',
      brand: 'Ford',
      model: 'Ranger',
      year: 2019,
      color: 'Branco',
      mileage: 5000,
      chassis: '9BWZZZ377VT004253',
      status: 'Manutenção',
    },
  ]);

  // Estado para armazenar as informações do veículo em edição/criação
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    mileage: '',
    chassis: '',
    status: 'Ativo',
  });

  // Estado para guardar mensagens de erro simples
  const [errors, setErrors] = useState({});

  // Colunas na DataGrid (incluindo colunas de ação: Editar/Excluir)
  const columns = [
    { field: 'plate', headerName: 'Placa', width: 120 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    { field: 'model', headerName: 'Modelo', width: 150 },
    { field: 'year', headerName: 'Ano', width: 90 },
    { field: 'color', headerName: 'Cor', width: 100 },
    { field: 'mileage', headerName: 'Quilometragem', width: 140 },
    { field: 'chassis', headerName: 'Chassi', width: 180 },
    { field: 'status', headerName: 'Status', width: 120 },
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

  /**
   * Abre o diálogo para criar um veículo
   */
  const handleOpenDialog = () => {
    setIsEditing(false);
    setEditId(null);
    // limpa estado de erros
    setErrors({});
    // limpa formulário
    setNewVehicle({
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      mileage: '',
      chassis: '',
      status: 'Ativo',
    });
    setOpen(true);
  };

  /**
   * Abre o diálogo para editar um veículo existente
   */
  const handleEdit = (id) => {
    const vehicleToEdit = vehicles.find((v) => v.id === id);
    if (!vehicleToEdit) return;
    setIsEditing(true);
    setEditId(id);
    setErrors({}); // limpa erros
    setNewVehicle({
      plate: vehicleToEdit.plate,
      brand: vehicleToEdit.brand,
      model: vehicleToEdit.model,
      year: vehicleToEdit.year,
      color: vehicleToEdit.color,
      mileage: vehicleToEdit.mileage,
      chassis: vehicleToEdit.chassis,
      status: vehicleToEdit.status,
    });
    setOpen(true);
  };

  /**
   * Exclui o veículo pelo ID
   */
  const handleDelete = (id) => {
    const confirmed = window.confirm('Deseja realmente excluir este veículo?');
    if (confirmed) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    }
  };

  /**
   * Fecha o diálogo sem salvar
   */
  const handleCloseDialog = () => {
    setOpen(false);
  };

  /**
   * Atualiza os campos do formulário
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setNewVehicle((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Valida campos obrigatórios simples
   */
  const validateVehicle = () => {
    const newErrors = {};
    if (!newVehicle.plate.trim()) {
      newErrors.plate = 'Placa é obrigatória.';
    }
    if (!newVehicle.model.trim()) {
      newErrors.model = 'Modelo é obrigatório.';
    }
    if (!newVehicle.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória.';
    }
    if (!newVehicle.year) {
      newErrors.year = 'Ano é obrigatório.';
    } else {
      const yearNum = parseInt(newVehicle.year, 10);
      if (yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        newErrors.year = 'Ano inválido.';
      }
    }
    if (!newVehicle.mileage.toString().trim()) {
      newErrors.mileage = 'Quilometragem é obrigatória.';
    } else {
      const mileageNum = parseInt(newVehicle.mileage, 10);
      if (mileageNum < 0) {
        newErrors.mileage = 'Quilometragem inválida.';
      }
    }
    return newErrors;
  };

  /**
   * Salva o novo veículo (ou atualiza, se for edição)
   */
  const handleSave = () => {
    // Valida antes de salvar
    const newErrors = validateVehicle();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Se está editando...
    if (isEditing && editId !== null) {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id === editId) {
            return {
              ...v,
              ...newVehicle,
              year: parseInt(newVehicle.year, 10),
              mileage: parseInt(newVehicle.mileage, 10),
            };
          }
          return v;
        })
      );
    } else {
      // Criação de um novo
      const newId = vehicles.length ? vehicles[vehicles.length - 1].id + 1 : 1;
      const vehicleToAdd = {
        ...newVehicle,
        id: newId,
        year: parseInt(newVehicle.year, 10),
        mileage: parseInt(newVehicle.mileage, 10),
      };
      setVehicles((prev) => [...prev, vehicleToAdd]);
    }

    // Fecha o diálogo
    setOpen(false);
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
            name="plate"
            label="Placa"
            fullWidth
            variant="outlined"
            value={newVehicle.plate}
            onChange={handleChange}
            error={!!errors.plate}
            helperText={errors.plate}
            sx={{ mb: 2 }}
          />

          {/* Marca e Modelo */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="brand"
              label="Marca"
              fullWidth
              variant="outlined"
              value={newVehicle.brand}
              onChange={handleChange}
              error={!!errors.brand}
              helperText={errors.brand}
            />
            <TextField
              margin="dense"
              name="model"
              label="Modelo"
              fullWidth
              variant="outlined"
              value={newVehicle.model}
              onChange={handleChange}
              error={!!errors.model}
              helperText={errors.model}
            />
          </Box>

          {/* Ano e Cor */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="year"
              label="Ano"
              type="number"
              fullWidth
              variant="outlined"
              value={newVehicle.year}
              onChange={handleChange}
              error={!!errors.year}
              helperText={errors.year}
            />
            <TextField
              margin="dense"
              name="color"
              label="Cor"
              fullWidth
              variant="outlined"
              value={newVehicle.color}
              onChange={handleChange}
            />
          </Box>

          {/* Quilometragem */}
          <TextField
            margin="dense"
            name="mileage"
            label="Quilometragem"
            type="number"
            fullWidth
            variant="outlined"
            value={newVehicle.mileage}
            onChange={handleChange}
            error={!!errors.mileage}
            helperText={errors.mileage}
            sx={{ mb: 2 }}
          />

          {/* Chassi */}
          <TextField
            margin="dense"
            name="chassis"
            label="Chassi"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            value={newVehicle.chassis}
            onChange={handleChange}
          />

          {/* Status */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              label="Status"
              value={newVehicle.status}
              onChange={handleChange}
            >
              <MenuItem value="Ativo">Ativo</MenuItem>
              <MenuItem value="Manutenção">Manutenção</MenuItem>
              <MenuItem value="Inativo">Inativo</MenuItem>
            </Select>
          </FormControl>
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
