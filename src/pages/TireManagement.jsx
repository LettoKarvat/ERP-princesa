import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Tabs,
  Tab,
  Paper,
  styled,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import api from '../services/api';
import VehicleTireManagement from './VehicleTireManagement'; // Importando o componente de gerenciamento por veículo

// Componente estilizado para cada pneu
const TireCard = styled(Paper)(({ theme, selected }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: selected ? theme.palette.action.hover : '#f5f5f5',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #ccc',
}));

function TireManagement() {
  // Estados para as abas: 'stock', 'recapadora' e 'vehicle'
  const [viewMode, setViewMode] = useState('stock');
  // Pneus em estoque
  const [stockTires, setStockTires] = useState([]);
  // Termo de busca para pneus
  const [stockSearch, setStockSearch] = useState('');
  // Modal para adicionar pneu novo
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newTire, setNewTire] = useState({
    status: 'Em estoque',
    posicaoVeiculo: '',
    kmInicial: 0,
    kmFinal: 0,
    numeroSerie: '',
    fabricante: '',
    modelo: '',
    dimensao: '',
    vida: 0,
  });
  const [addError, setAddError] = useState('');

  // Modal para visualizar detalhes e atribuir pneu a veículo
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedTire, setSelectedTire] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehiclesForAssignment, setVehiclesForAssignment] = useState([]);
  const [assignError, setAssignError] = useState('');

  // Carrega pneus em estoque
  const loadStockTires = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/getAllPneus',
        {},
        {
          headers: { 'X-Parse-Session-Token': sessionToken },
        }
      );
      if (response.data.result) {
        const stock = response.data.result.filter(
          (p) => p.status.toLowerCase() === 'em estoque'
        );
        setStockTires(stock);
      }
    } catch (err) {
      console.error('Erro ao carregar pneus em estoque:', err);
    }
  };

  // Carrega veículos disponíveis para atribuição
  const loadVehiclesForAssignment = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/getAllVeiculos',
        {},
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      if (response.data.result) {
        setVehiclesForAssignment(response.data.result);
      }
    } catch (err) {
      console.error('Erro ao carregar veículos para atribuição:', err);
    }
  };

  // useEffect para carregar pneus quando viewMode for "stock"
  useEffect(() => {
    if (viewMode === 'stock') {
      loadStockTires();
    }
  }, [viewMode]);

  // Filtrar pneus com base no termo de busca
  const filteredStockTires = stockTires.filter((tire) => {
    const searchTerm = stockSearch.toLowerCase();
    return (
      tire.numeroSerie?.toLowerCase().includes(searchTerm) ||
      tire.fabricante?.toLowerCase().includes(searchTerm) ||
      tire.modelo?.toLowerCase().includes(searchTerm) ||
      tire.dimensao?.toLowerCase().includes(searchTerm)
    );
  });

  // Handler para abrir modal de adicionar pneu novo
  const handleOpenAddModal = () => {
    setAddError('');
    setNewTire({
      status: 'Em estoque',
      posicaoVeiculo: '',
      kmInicial: 0,
      kmFinal: 0,
      numeroSerie: '',
      fabricante: '',
      modelo: '',
      dimensao: '',
      vida: 0,
    });
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleNewTireChange = (e) => {
    const { name, value } = e.target;
    setNewTire((prev) => ({ ...prev, [name]: value }));
  };

  const validateTire = () => {
    const errors = {};
    if (!newTire.numeroSerie.trim()) {
      errors.numeroSerie = 'Número de série é obrigatório.';
    }
    return errors;
  };

  // Salvar novo pneu
  const handleAddTire = async () => {
    const errors = validateTire();
    if (Object.keys(errors).length > 0) {
      setAddError(Object.values(errors)[0]);
      return;
    }
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/criarPneu',
        {
          status: newTire.status,
          posicaoVeiculo: newTire.posicaoVeiculo,
          kmInicial: Number(newTire.kmInicial),
          kmFinal: Number(newTire.kmFinal),
          numeroSerie: newTire.numeroSerie,
          fabricante: newTire.fabricante,
          modelo: newTire.modelo,
          dimensao: newTire.dimensao,
          vida: Number(newTire.vida),
        },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      if (response.data.status === 'success') {
        alert('Pneu criado com sucesso!');
        handleCloseAddModal();
        loadStockTires();
      }
    } catch (err) {
      console.error('Erro ao criar pneu:', err);
      setAddError(err.message || 'Erro ao criar pneu.');
    }
  };

  // Ao clicar em um pneu, abre modal de detalhes e atribuição
  const handleTireClick = (tire) => {
    setSelectedTire(tire);
    loadVehiclesForAssignment();
    setOpenDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedTire(null);
    setSelectedVehicleId('');
    setAssignError('');
  };

  // Atribuir pneu a um veículo
  const handleAssignTire = async () => {
    if (!selectedVehicleId) {
      setAssignError('Selecione um veículo para atribuir.');
      return;
    }
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/editarPneu',
        {
          objectId: selectedTire.objectId,
          veiculoId: selectedVehicleId,
          status: 'Em uso',
        },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      if (response.data.status === 'success') {
        alert('Pneu atribuído com sucesso!');
        handleCloseDetailsModal();
        loadStockTires();
      }
    } catch (err) {
      console.error('Erro ao atribuir pneu:', err);
      setAssignError(err.message || 'Erro ao atribuir pneu.');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Gestão de Pneus
      </Typography>

      <Tabs
        value={viewMode}
        onChange={(e, newValue) => setViewMode(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label="Pneus em Estoque" value="stock" />
        <Tab label="Recapadora" value="recapadora" />
        <Tab label="Gerenciar Veículos" value="vehicle" />
      </Tabs>

      {viewMode === 'stock' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Buscar Pneus"
              variant="outlined"
              size="small"
              sx={{ width: '300px' }}
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
            />
            <Button variant="contained" onClick={handleOpenAddModal}>
              Adicionar Pneu Novo
            </Button>
          </Box>
          {filteredStockTires.length === 0 ? (
            <Typography>Nenhum pneu disponível em estoque.</Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredStockTires.map((tire) => (
                <Grid item xs={6} sm={4} md={3} key={tire.objectId}>
                  <TireCard onClick={() => handleTireClick(tire)}>
                    <MdOutlineTireRepair size={50} style={{ marginBottom: '8px' }} />
                    <Typography variant="body2">
                      N°: {tire.numeroSerie}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {tire.fabricante} - {tire.modelo} - {tire.dimensao}
                    </Typography>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {viewMode === 'recapadora' && (
        <Box>
          <Typography variant="h6">Funcionalidade para recapadora em desenvolvimento.</Typography>
        </Box>
      )}

      {viewMode === 'vehicle' && (
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Gerenciamento de Veículos e Pneus
          </Typography>
          <VehicleTireManagement />
        </Box>
      )}

      {/* Modal para adicionar novo pneu */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Novo Pneu</DialogTitle>
        <DialogContent dividers>
          <Alert severity="error" sx={{ mb: 2, display: addError ? 'block' : 'none' }}>
            {addError}
          </Alert>
          <TextField
            margin="dense"
            name="numeroSerie"
            label="Número de Série"
            fullWidth
            variant="outlined"
            value={newTire.numeroSerie}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="fabricante"
            label="Fabricante"
            fullWidth
            variant="outlined"
            value={newTire.fabricante}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="modelo"
            label="Modelo"
            fullWidth
            variant="outlined"
            value={newTire.modelo}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="dimensao"
            label="Dimensão"
            fullWidth
            variant="outlined"
            value={newTire.dimensao}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="vida"
            label="Vida (em km ou outro)"
            type="number"
            fullWidth
            variant="outlined"
            value={newTire.vida}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="kmInicial"
            label="KM Inicial"
            type="number"
            fullWidth
            variant="outlined"
            value={newTire.kmInicial}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="kmFinal"
            label="KM Final"
            type="number"
            fullWidth
            variant="outlined"
            value={newTire.kmFinal}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="posicaoVeiculo"
            label="Posição (se aplicável)"
            fullWidth
            variant="outlined"
            value={newTire.posicaoVeiculo}
            onChange={handleNewTireChange}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddTire}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalhes do pneu e atribuição */}
      <Dialog
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalhes do Pneu</DialogTitle>
        <DialogContent dividers>
          {selectedTire && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1">
                <strong>Número de Série:</strong> {selectedTire.numeroSerie}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Fabricante:</strong> {selectedTire.fabricante}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Modelo:</strong> {selectedTire.modelo}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Dimensão:</strong> {selectedTire.dimensao}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Vida:</strong> {selectedTire.vida}
              </Typography>
              <Typography variant="subtitle1">
                <strong>KM Inicial:</strong> {selectedTire.kmInicial}
              </Typography>
              <Typography variant="subtitle1">
                <strong>KM Final:</strong> {selectedTire.kmFinal}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Status:</strong> {selectedTire.status}
              </Typography>
              {assignError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {assignError}
                </Alert>
              )}
              <Box sx={{ mt: 2 }}>
                <InputLabel id="vehicle-assignment-label">
                  Atribuir a Veículo
                </InputLabel>
                <Select
                  labelId="vehicle-assignment-label"
                  fullWidth
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Selecione um veículo</em>
                  </MenuItem>
                  {vehiclesForAssignment.map((v) => (
                    <MenuItem key={v.objectId} value={v.objectId}>
                      {v.placa} - {v.marca} {v.modelo}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleAssignTire}>
            Atribuir Pneu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TireManagement;
