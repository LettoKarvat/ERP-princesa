import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Paper,
  styled,
  Button,
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import { GiFlatTire } from 'react-icons/gi';

// Componente estilizado para representar cada pneu no grid
const TireCard = styled(Paper)(({ theme, selected }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: selected ? theme.palette.action.hover : '#f5f5f5',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #ccc',
}));

function TireManagement() {
  // Dados simulados para veículos (com seus pneus)
  const vehicles = [
    {
      id: 'CAMINHAO_01',
      nome: 'Caminhão 01',
      pneus: [
        {
          id: 101,
          posicao: 'Dianteiro Esquerdo',
          marca: 'Michelin',
          dataInstalacao: '2024-05-10',
          pressaoAtual: 110,
          status: 'Em uso',
          kmRodados: 15000,
        },
        {
          id: 102,
          posicao: 'Dianteiro Direito',
          marca: 'Pirelli',
          dataInstalacao: '2024-06-12',
          pressaoAtual: 105,
          status: 'Em uso',
          kmRodados: 12000,
        },
        {
          id: 103,
          posicao: 'Traseiro Esquerdo Interno',
          marca: 'Bridgestone',
          dataInstalacao: '2024-07-01',
          pressaoAtual: 100,
          status: 'Em uso',
          kmRodados: 8000,
        },
        {
          id: 104,
          posicao: 'Traseiro Esquerdo Externo',
          marca: 'Bridgestone',
          dataInstalacao: '2024-07-01',
          pressaoAtual: 100,
          status: 'Em uso',
          kmRodados: 8000,
        },
        {
          id: 105,
          posicao: 'Traseiro Direito Interno',
          marca: 'Goodyear',
          dataInstalacao: '2024-08-15',
          pressaoAtual: 100,
          status: 'Em uso',
          kmRodados: 5000,
        },
        {
          id: 106,
          posicao: 'Traseiro Direito Externo',
          marca: 'Goodyear',
          dataInstalacao: '2024-08-15',
          pressaoAtual: 100,
          status: 'Em uso',
          kmRodados: 5000,
        },
        {
          id: 107,
          posicao: 'Estepe',
          marca: 'Pirelli',
          dataInstalacao: '2024-09-10',
          pressaoAtual: 100,
          status: 'Reserva',
          kmRodados: 0,
        },
      ],
    },
  ];

  // Dados simulados para pneus em estoque ou isolados
  const stockTires = [
    {
      id: 201,
      posicao: 'Estoque - Tire A',
      marca: 'Michelin',
      dataInstalacao: 'N/A',
      pressaoAtual: 0,
      status: 'Em estoque',
      kmRodados: 0,
    },
    {
      id: 202,
      posicao: 'Estoque - Tire B',
      marca: 'Pirelli',
      dataInstalacao: 'N/A',
      pressaoAtual: 0,
      status: 'Em estoque',
      kmRodados: 0,
    },
    {
      id: 203,
      posicao: 'Estoque - Tire C',
      marca: 'Goodyear',
      dataInstalacao: 'N/A',
      pressaoAtual: 0,
      status: 'Em estoque',
      kmRodados: 0,
    },
  ];

  // Layout para exibição dos pneus vinculados a um veículo (posição fixa no grid)
  const tireLayout = [
    { positionId: 'FRONT_LEFT', displayName: 'Dianteiro Esquerdo', gridRow: 1, gridColumn: 2 },
    { positionId: 'FRONT_RIGHT', displayName: 'Dianteiro Direito', gridRow: 1, gridColumn: 4 },
    { positionId: 'REAR_LEFT_INNER', displayName: 'Traseiro Esquerdo Interno', gridRow: 2, gridColumn: 1 },
    { positionId: 'REAR_LEFT_OUTER', displayName: 'Traseiro Esquerdo Externo', gridRow: 2, gridColumn: 2 },
    { positionId: 'REAR_RIGHT_INNER', displayName: 'Traseiro Direito Interno', gridRow: 2, gridColumn: 3 },
    { positionId: 'REAR_RIGHT_OUTER', displayName: 'Traseiro Direito Externo', gridRow: 2, gridColumn: 4 },
    { positionId: 'SPARE', displayName: 'Estepe', gridRow: 3, gridColumn: 2 },
  ];

  // Estados
  const [viewMode, setViewMode] = useState('vehicle'); // 'vehicle' ou 'stock'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedTire, setSelectedTire] = useState(null);
  const [stockSearch, setStockSearch] = useState('');

  // Filtra os pneus em estoque de acordo com o termo de busca
  const filteredStockTires = stockTires.filter((tire) =>
    tire.marca.toLowerCase().includes(stockSearch.toLowerCase()) ||
    tire.posicao.toLowerCase().includes(stockSearch.toLowerCase())
  );

  // Handlers
  const handleVehicleChange = (event) => {
    const vehicleId = event.target.value;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle);
    setSelectedTire(null);
  };

  const handleTireClick = (tire) => {
    setSelectedTire(tire);
  };

  const handleTabChange = (event, newValue) => {
    setViewMode(newValue);
    setSelectedTire(null);
  };

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
      {/* Coluna da esquerda: Conteúdo principal */}
      <Box sx={{ flex: 1 }}>
        <Tabs value={viewMode} onChange={handleTabChange}>
          <Tab label="Por Veículo" value="vehicle" />
          <Tab label="Pneus em Estoque" value="stock" />
        </Tabs>

        {viewMode === 'vehicle' && (
          <Box sx={{ mt: 2 }}>
            <FormControl sx={{ minWidth: 200, mb: 2 }}>
              <InputLabel id="vehicle-select-label">Veículo</InputLabel>
              <Select
                labelId="vehicle-select-label"
                value={selectedVehicle ? selectedVehicle.id : ''}
                label="Veículo"
                onChange={handleVehicleChange}
              >
                <MenuItem value="">
                  <em>Selecione um veículo</em>
                </MenuItem>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedVehicle && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 2,
                  width: '80%',
                  maxWidth: 600,
                  margin: '0 auto',
                  mt: 3,
                }}
              >
                {tireLayout.map((layoutItem) => {
                  const tireData = selectedVehicle.pneus.find(
                    (t) => t.posicao === layoutItem.displayName
                  );
                  return (
                    <Box
                      key={layoutItem.positionId}
                      sx={{
                        gridRow: layoutItem.gridRow,
                        gridColumn: layoutItem.gridColumn,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {tireData ? (
                        <TireCard
                          onClick={() => handleTireClick(tireData)}
                          selected={selectedTire && selectedTire.id === tireData.id}
                        >
                          <MdOutlineTireRepair size={50} style={{ marginBottom: '8px' }} />
                          <Typography variant="body2">{tireData.posicao}</Typography>
                        </TireCard>
                      ) : (
                        <TireCard>
                          <MdOutlineTireRepair
                            size={50}
                            style={{ marginBottom: '8px', opacity: 0.3 }}
                          />
                          <Typography variant="body2">Sem pneu</Typography>
                        </TireCard>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {viewMode === 'stock' && (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Buscar Pneus"
              variant="outlined"
              fullWidth
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
            />
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {filteredStockTires.map((tire) => (
                  <Grid item xs={6} sm={4} md={3} key={tire.id}>
                    <TireCard
                      onClick={() => handleTireClick(tire)}
                      selected={selectedTire && selectedTire.id === tire.id}
                    >
                      <MdOutlineTireRepair size={50} style={{ marginBottom: '8px' }} />
                      <Typography variant="body2">{tire.posicao}</Typography>
                    </TireCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </Box>

      {/* Coluna da direita: Painel de detalhes */}
      <Box
        sx={{
          width: 320,
          borderLeft: '1px solid #ccc',
          p: 2,
          height: '100%',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Detalhes do Pneu
        </Typography>
        {selectedTire ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GiFlatTire size={50} style={{ marginRight: '8px' }} />
              <Typography variant="h6">{selectedTire.posicao}</Typography>
            </Box>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Marca:
                </Typography>
                <Typography variant="body1">{selectedTire.marca}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data de Instalação:
                </Typography>
                <Typography variant="body1">{selectedTire.dataInstalacao}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Pressão:
                </Typography>
                <Typography variant="body1">{selectedTire.pressaoAtual} psi</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  KM Rodados:
                </Typography>
                <Typography variant="body1">{selectedTire.kmRodados}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status:
                </Typography>
                <Typography variant="body1">{selectedTire.status}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" onClick={() => setSelectedTire(null)}>
                  Limpar Seleção
                </Button>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Typography variant="body1">
            Selecione um pneu para ver os detalhes.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default TireManagement;
