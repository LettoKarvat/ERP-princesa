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
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import api from '../services/api';
import VehicleTireManagement from './VehicleTireManagement';

// Componente estilizado para cada pneu
const TireCard = styled(Paper)(({ theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
}));

function TireManagement() {
  // Abas
  const [viewMode, setViewMode] = useState('stock');

  // Listagem de pneus em estoque
  const [stockTires, setStockTires] = useState([]);
  const [stockSearch, setStockSearch] = useState('');

  // Listagem de pneus em recapagem
  const [recapTires, setRecapTires] = useState([]);
  const [recapSearch, setRecapSearch] = useState('');

  // Modal de criar pneu
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newTire, setNewTire] = useState({
    kmInicial: 0,
    kmFinal: 0,
    numeroSerie: '',
    fabricante: '',
    modelo: '',
    dimensao: '',
    vida: 0,
  });
  const [addError, setAddError] = useState('');

  // Modal de detalhes/edição
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedTire, setSelectedTire] = useState(null);
  // Estado para controlar se estamos em modo de edição no modal
  const [isEditing, setIsEditing] = useState(false);
  // Objeto local para editar o pneu
  const [editTireData, setEditTireData] = useState({
    objectId: '',
    status: '',
    kmInicial: 0,
    kmFinal: 0,
    numeroSerie: '',
    fabricante: '',
    modelo: '',
    dimensao: '',
    vida: 0,
  });
  const [editError, setEditError] = useState('');

  // --------------------------------------------------------------------------
  //  1) Carregar Pneus em ESTOQUE
  // --------------------------------------------------------------------------
  const loadStockTires = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/getAllPneus',
        {},
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      if (response.data) {
        const result = response.data.result || [];
        // Filtra apenas status "Em estoque"
        const stock = result.filter(
          (p) => (p.status || '').toLowerCase() === 'em estoque'
        );
        setStockTires(stock);
      }
    } catch (err) {
      console.error('Erro ao carregar pneus em estoque:', err);
    }
  };

  // --------------------------------------------------------------------------
  //  2) Carregar Pneus em RECAPAGEM
  // --------------------------------------------------------------------------
  const loadRecapTires = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await api.post(
        '/functions/getAllPneus',
        {},
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      if (response.data) {
        const result = response.data.result || [];
        // Filtra apenas status "Em recapagem"
        const recaps = result.filter(
          (p) => (p.status || '').toLowerCase() === 'em recapagem'
        );
        setRecapTires(recaps);
      }
    } catch (err) {
      console.error('Erro ao carregar pneus em recapagem:', err);
    }
  };

  // --------------------------------------------------------------------------
  // Ao mudar de aba, carregamos os pneus correspondentes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (viewMode === 'stock') {
      loadStockTires();
    } else if (viewMode === 'recapadora') {
      loadRecapTires();
    }
  }, [viewMode]);

  // --------------------------------------------------------------------------
  // Filtros para Exibição
  // --------------------------------------------------------------------------
  const filteredStockTires = stockTires.filter((tire) => {
    const searchTerm = stockSearch.toLowerCase();
    return (
      tire.numeroSerie?.toLowerCase().includes(searchTerm) ||
      tire.fabricante?.toLowerCase().includes(searchTerm) ||
      tire.modelo?.toLowerCase().includes(searchTerm) ||
      tire.dimensao?.toLowerCase().includes(searchTerm)
    );
  });

  const filteredRecapTires = recapTires.filter((tire) => {
    const searchTerm = recapSearch.toLowerCase();
    return (
      tire.numeroSerie?.toLowerCase().includes(searchTerm) ||
      tire.fabricante?.toLowerCase().includes(searchTerm) ||
      tire.modelo?.toLowerCase().includes(searchTerm) ||
      tire.dimensao?.toLowerCase().includes(searchTerm)
    );
  });

  // --------------------------------------------------------------------------
  // Criação de Pneu (Modal)
  // --------------------------------------------------------------------------
  const handleOpenAddModal = () => {
    setAddError('');
    // Reseta o objeto local
    setNewTire({
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

  const validateNewTire = () => {
    const errors = {};
    if (!newTire.numeroSerie.trim()) {
      errors.numeroSerie = 'Número de série é obrigatório.';
    }
    return errors;
  };

  const handleAddTire = () => {
    const errors = validateNewTire();
    if (Object.keys(errors).length > 0) {
      setAddError(Object.values(errors)[0]);
      return;
    }

    // Chama a API
    const sessionToken = localStorage.getItem('sessionToken');
    api
      .post(
        '/functions/criarPneu',
        {
          // Forçar status = 'Em estoque'
          status: 'Em estoque',
          kmInicial: Number(newTire.kmInicial),
          kmFinal: Number(newTire.kmFinal),
          numeroSerie: newTire.numeroSerie,
          fabricante: newTire.fabricante,
          modelo: newTire.modelo,
          dimensao: newTire.dimensao,
          vida: Number(newTire.vida),
        },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      )
      .then(() => {
        loadStockTires(); // recarrega a lista de estoque
      })
      .catch((err) => {
        console.error('Erro ao criar pneu:', err);
      });

    // Fecha modal
    handleCloseAddModal();
  };

  // --------------------------------------------------------------------------
  // Detalhes / Edição / Exclusão de Pneu
  // --------------------------------------------------------------------------
  const handleTireClick = (tire) => {
    setSelectedTire(tire);
    // Carrega no estado local para edição (se o usuário clicar em "Editar")
    setEditTireData({
      objectId: tire.objectId,
      status: tire.status || '',
      kmInicial: tire.kmInicial || 0,
      kmFinal: tire.kmFinal || 0,
      numeroSerie: tire.numeroSerie || '',
      fabricante: tire.fabricante || '',
      modelo: tire.modelo || '',
      dimensao: tire.dimensao || '',
      vida: tire.vida || 0,
    });
    setIsEditing(false);
    setEditError('');
    setOpenDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedTire(null);
    setIsEditing(false);
    setEditError('');
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditTireData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      setEditError('');
      const sessionToken = localStorage.getItem('sessionToken');
      await api.post(
        '/functions/editarPneu',
        {
          objectId: editTireData.objectId,
          status: editTireData.status,
          kmInicial: Number(editTireData.kmInicial),
          kmFinal: Number(editTireData.kmFinal),
          numeroSerie: editTireData.numeroSerie,
          fabricante: editTireData.fabricante,
          modelo: editTireData.modelo,
          dimensao: editTireData.dimensao,
          vida: Number(editTireData.vida),
        },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );

      // Se estamos alterando algo no pneu da aba estoque, atualiza
      if (viewMode === 'stock') {
        await loadStockTires();
      }
      // Se for da aba recapadora e editamos, atualiza também
      else if (viewMode === 'recapadora') {
        await loadRecapTires();
      }

      // Sai do modo de edição
      setIsEditing(false);

      // Atualizar 'selectedTire' local
      setSelectedTire((prev) => ({ ...prev, ...editTireData }));
    } catch (err) {
      console.error('Erro ao editar pneu:', err);
      setEditError('Erro ao editar pneu. Verifique o console.');
    }
  };

  const handleDeleteTire = async () => {
    if (!selectedTire) return;
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await api.post(
        '/functions/softDeletePneu',
        { objectId: selectedTire.objectId },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );

      // Atualiza a lista correspondente e fecha modal
      if (viewMode === 'stock') {
        await loadStockTires();
      } else if (viewMode === 'recapadora') {
        await loadRecapTires();
      }

      handleCloseDetailsModal();
    } catch (err) {
      console.error('Erro ao deletar pneu:', err);
      setEditError('Não foi possível excluir o pneu. Verifique o console.');
    }
  };

  // --------------------------------------------------------------------------
  // Ações para a aba RECAPADORA
  //  - "Voltar ao estoque"
  //  - "Enviar para sucata"
  // --------------------------------------------------------------------------
  const handleReturnToStock = async (tire) => {
    if (!tire) return;
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await api.post(
        '/functions/editarPneu',
        {
          objectId: tire.objectId,
          status: 'Em estoque',
          // limpar veiculoId e posicaoVeiculo
          veiculoId: '',
          posicaoVeiculo: '',
        },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      loadRecapTires();
    } catch (err) {
      console.error('Erro ao retornar pneu ao estoque:', err);
      alert('Não foi possível retornar o pneu ao estoque. Verifique o console.');
    }
  };

  const handleSendToScrap = async (tire) => {
    if (!tire) return;
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await api.post(
        '/functions/editarPneu',
        {
          objectId: tire.objectId,
          status: 'Sucata',
          veiculoId: '',
          posicaoVeiculo: '',
        },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
      );
      loadRecapTires();
    } catch (err) {
      console.error('Erro ao enviar pneu para sucata:', err);
      alert('Não foi possível enviar o pneu para sucata. Verifique o console.');
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
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

      {/* -------------------------------------------------------------
          ABA: Estoque de Pneus 
      ------------------------------------------------------------- */}
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
                    <MdOutlineTireRepair
                      size={50}
                      style={{ marginBottom: '8px' }}
                    />
                    <Typography variant="body2">
                      N°: {tire.numeroSerie}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {tire.fabricante} - {tire.modelo} - {tire.dimensao}
                    </Typography>
                    {/* Exemplo: mostrar recapCount */}
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.8rem', color: 'gray' }}
                    >
                      Recap: {tire.recapCount || 0}
                    </Typography>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* -------------------------------------------------------------
          ABA: Recapadora (Pneus em Recapagem)
      ------------------------------------------------------------- */}
      {viewMode === 'recapadora' && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pneus em Recapagem
          </Typography>
          <TextField
            label="Buscar Pneus"
            variant="outlined"
            size="small"
            sx={{ width: '300px', mb: 2 }}
            value={recapSearch}
            onChange={(e) => setRecapSearch(e.target.value)}
          />

          {filteredRecapTires.length === 0 ? (
            <Typography>Nenhum pneu em recapagem.</Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredRecapTires.map((tire) => (
                <Grid item xs={6} sm={4} md={3} key={tire.objectId}>
                  <TireCard>
                    <MdOutlineTireRepair
                      size={50}
                      style={{ marginBottom: '8px' }}
                    />
                    <Typography variant="body2">
                      N°: {tire.numeroSerie}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {tire.fabricante} - {tire.modelo} - {tire.dimensao}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      Vida: {tire.vida}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.8rem', color: 'gray' }}
                    >
                      Recapagens: {tire.recapCount || 0}
                    </Typography>

                    {/* Botões de ação */}
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleReturnToStock(tire)}
                      >
                        Voltar ao Estoque
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleSendToScrap(tire)}
                      >
                        Sucata
                      </Button>
                    </Box>

                    {/* Exemplo: se quiser editar detalhes, clique no card */}
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleTireClick(tire)}
                      >
                        Editar Detalhes
                      </Button>
                    </Box>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* -------------------------------------------------------------
          ABA: Veículos e Pneus
      ------------------------------------------------------------- */}
      {viewMode === 'vehicle' && (
        <Box>
          <VehicleTireManagement />
        </Box>
      )}

      {/* -------------------------------------------------------------
          MODAL: Adicionar Novo Pneu
      ------------------------------------------------------------- */}
      <Dialog
        open={openAddModal}
        onClose={handleCloseAddModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Novo Pneu</DialogTitle>
        <DialogContent dividers>
          <Alert
            severity="error"
            sx={{ mb: 2, display: addError ? 'block' : 'none' }}
          >
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddTire}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* -------------------------------------------------------------
          MODAL: Detalhes do Pneu + Edição + Exclusão
      ------------------------------------------------------------- */}
      <Dialog
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalhes do Pneu</DialogTitle>
        <DialogContent dividers>
          {/* Exibe erros de edição/exclusão */}
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}

          {/* Se não estiver em modo de edição, exibir somente as informações */}
          {!isEditing && selectedTire && (
            <>
              <Box sx={{ p: 1 }}>
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
                {/* Exibir recapCount, caso já exista no pneu */}
                <Typography variant="subtitle1">
                  <strong>Recapagens:</strong> {selectedTire.recapCount || 0}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Status:</strong> {selectedTire.status}
                </Typography>
              </Box>
            </>
          )}

          {/* Modo de edição: textfields para editar cada campo */}
          {isEditing && (
            <>
              <TextField
                margin="dense"
                name="numeroSerie"
                label="Número de Série"
                fullWidth
                variant="outlined"
                value={editTireData.numeroSerie}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="fabricante"
                label="Fabricante"
                fullWidth
                variant="outlined"
                value={editTireData.fabricante}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="modelo"
                label="Modelo"
                fullWidth
                variant="outlined"
                value={editTireData.modelo}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="dimensao"
                label="Dimensão"
                fullWidth
                variant="outlined"
                value={editTireData.dimensao}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="vida"
                label="Vida"
                type="number"
                fullWidth
                variant="outlined"
                value={editTireData.vida}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="kmInicial"
                label="KM Inicial"
                type="number"
                fullWidth
                variant="outlined"
                value={editTireData.kmInicial}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="kmFinal"
                label="KM Final"
                type="number"
                fullWidth
                variant="outlined"
                value={editTireData.kmFinal}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="status"
                label="Status"
                fullWidth
                variant="outlined"
                value={editTireData.status}
                onChange={handleEditChange}
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {/* Se não estiver editando, mostra botão Editar e Excluir */}
          {!isEditing && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteTire}
              >
                Excluir
              </Button>
              <Button variant="contained" onClick={handleStartEdit}>
                Editar
              </Button>
            </>
          )}

          {/* Se estiver editando, mostra Salvar e Cancelar */}
          {isEditing && (
            <>
              <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
            </>
          )}

          <Button onClick={handleCloseDetailsModal}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TireManagement;
