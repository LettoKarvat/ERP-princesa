import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Paper,
    styled,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import api from '../services/api';

// Layouts por tipo de veículo
const TIRE_LAYOUTS = {
    'Passeio': [
        {
            label: 'Eixo Dianteiro',
            positions: ['1E', '1D']
        },
        {
            label: 'Eixo Traseiro',
            positions: ['2E', '2D']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    'Delivery': [
        {
            label: '1º Eixo (Dianteiro)',
            positions: ['1E', '1D']
        },
        {
            label: '2º Eixo (Traseiro)',
            positions: ['2E', '2D']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    '3/4': [
        {
            label: '1º Eixo (Dianteiro)',
            positions: ['1E', '1D']
        },
        {
            label: '2º Eixo (Traseiro)',
            positions: ['2DI', '2DE', '2EI', '2EE']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    'Toco': [
        {
            label: '1º Eixo (Dianteiro)',
            positions: ['1E', '1D']
        },
        {
            label: '2º Eixo (Traseiro)',
            positions: ['2DI', '2DE', '2EI', '2EE']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    'Truck': [
        {
            label: '1º Eixo (Dianteiro)',
            positions: ['1E', '1D']
        },
        {
            label: '2º Eixo (Traseiro)',
            positions: ['2DI', '2DE', '2EI', '2EE']
        },
        {
            label: '3º Eixo (Traseiro)',
            positions: ['3DI', '3DE', '3EI', '3EE']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    'Bi-Truck': [
        {
            label: '1º Eixo (Dianteiro)',
            positions: ['1E', '1D']
        },
        {
            label: '2º Eixo',
            positions: ['2E', '2D']
        },
        {
            label: '3º Eixo',
            positions: ['3DI', '3DE', '3EI', '3EE']
        },
        {
            label: '4º Eixo',
            positions: ['4DI', '4DE', '4EI', '4EE']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    'Cavalo': [
        {
            label: '1º Eixo (Dianteiro)',
            positions: ['1E', '1D']
        },
        {
            label: '2º Eixo',
            positions: ['2DI', '2DE', '2EI', '2EE']
        },
        {
            label: '3º Eixo',
            positions: ['3I', '3E']
        },
        {
            label: 'Estepe',
            positions: ['E']
        }
    ],
    'Semi-Reboque (Bi-Trem)': [
        {
            label: '1º Eixo',
            positions: ['1DE', '1E']
        },
        {
            label: '2º Eixo',
            positions: ['2DI', '2DE', '2EI', '2EE']
        },
        {
            label: 'Estepe',
            positions: ['E', 'E']
        }
    ],
    'Semi-Reboque (Rodo-Trem)': [
        {
            label: '1º Eixo',
            positions: ['1D', '1E']
        },
        {
            label: '2º Eixo',
            positions: ['2DI', '2DE', '2EI', '2EE']
        },
        {
            label: '3º Eixo',
            positions: ['3DI', '3DE', '3EI', '3EE']
        },
        {
            label: 'Estepe',
            positions: ['E', 'E']
        }
    ]
};

// Card para exibir cada posição de pneu
const TirePositionCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
    textAlign: 'center',
    cursor: 'pointer',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing(1),
}));

function VehicleTireManagement() {
    // Lista de veículos
    const [vehicles, setVehicles] = useState([]);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Pneus do veículo selecionado
    const [vehicleTires, setVehicleTires] = useState([]);

    // Pneus em estoque (para troca)
    const [stockTires, setStockTires] = useState([]);

    // Modal do veículo (layout)
    const [openVehicleModal, setOpenVehicleModal] = useState(false);

    // Modal de troca de pneu (posição)
    const [openPositionModal, setOpenPositionModal] = useState(false);
    const [modalError, setModalError] = useState('');
    const [positionToEdit, setPositionToEdit] = useState('');
    const [assignedTire, setAssignedTire] = useState(null); // pneu que está no slot
    const [selectedStockTire, setSelectedStockTire] = useState(null);

    // Destino do pneu antigo (quando houver)
    const [oldTireDestination, setOldTireDestination] = useState('Em recapagem');

    useEffect(() => {
        loadVehicles();
    }, []);

    // Carrega veículos
    const loadVehicles = async () => {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await api.post(
                '/functions/getAllVeiculos',
                {},
                { headers: { 'X-Parse-Session-Token': sessionToken } }
            );
            if (response.data.result) {
                setVehicles(response.data.result);
            }
        } catch (err) {
            console.error('Erro ao carregar veículos:', err);
        }
    };

    // Ao selecionar um veículo, carrega pneus e abre modal
    const handleSelectVehicle = async (vehicle) => {
        setSelectedVehicle(vehicle);
        await loadVehicleTires(vehicle.objectId);
        setOpenVehicleModal(true);
    };

    const handleCloseVehicleModal = () => {
        setOpenVehicleModal(false);
        setSelectedVehicle(null);
        setVehicleTires([]);
    };

    // Carrega pneus do veículo
    const loadVehicleTires = async (vehicleId) => {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await api.post(
                '/functions/getAllPneus',
                {},
                { headers: { 'X-Parse-Session-Token': sessionToken } }
            );
            if (response.data.result) {
                const tires = response.data.result.filter((t) => t.veiculoId === vehicleId);
                setVehicleTires(tires);
            }
        } catch (err) {
            console.error('Erro ao carregar pneus do veículo:', err);
        }
    };

    // Carrega pneus em estoque
    const loadStockTires = async () => {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await api.post(
                '/functions/getAllPneus',
                {},
                { headers: { 'X-Parse-Session-Token': sessionToken } }
            );
            if (response.data.result) {
                const stock = response.data.result.filter(
                    (p) => p.status && p.status.toLowerCase() === 'em estoque'
                );
                setStockTires(stock);
            }
        } catch (err) {
            console.error('Erro ao carregar pneus em estoque:', err);
        }
    };

    // Filtro de veículos pela placa
    const filteredVehicles = vehicles.filter((v) =>
        v.placa.toLowerCase().includes(vehicleSearch.toLowerCase())
    );

    // Ao clicar em um slot, abrimos o modal de posição
    const openPositionDetails = (position, currentTire) => {
        setPositionToEdit(position);
        setAssignedTire(currentTire || null);
        setModalError('');
        setSelectedStockTire(null);
        setOldTireDestination('Em recapagem'); // define default
        // Carrega pneus em estoque
        loadStockTires();
        setOpenPositionModal(true);
    };

    const handleClosePositionModal = () => {
        setOpenPositionModal(false);
        setPositionToEdit('');
        setAssignedTire(null);
        setSelectedStockTire(null);
        setModalError('');
        setOldTireDestination('Em recapagem');
    };

    // Trocar/Atribuir pneu
    const handleSwapTire = async () => {
        if (!selectedStockTire) {
            setModalError('Selecione um pneu do estoque para atribuir/trocar.');
            return;
        }
        try {
            const sessionToken = localStorage.getItem('sessionToken');

            // Se já existe um pneu nessa posição, atualizamos o status/destino dele
            if (assignedTire) {
                await api.post(
                    '/functions/editarPneu',
                    {
                        objectId: assignedTire.objectId,
                        veiculoId: '',
                        posicaoVeiculo: '',
                        status: oldTireDestination, // "Em recapagem", "Sucata" ou "Em estoque"
                    },
                    { headers: { 'X-Parse-Session-Token': sessionToken } }
                );
            }

            // Atribui o pneu do estoque à posição
            await api.post(
                '/functions/editarPneu',
                {
                    objectId: selectedStockTire.objectId,
                    veiculoId: selectedVehicle.objectId,
                    posicaoVeiculo: positionToEdit,
                    status: 'Em uso',
                },
                { headers: { 'X-Parse-Session-Token': sessionToken } }
            );

            alert('Pneu atribuído/trocado com sucesso!');
            handleClosePositionModal();
            // Recarrega pneus do veículo
            loadVehicleTires(selectedVehicle.objectId);
        } catch (err) {
            console.error('Erro ao trocar pneu:', err);
            setModalError(err.message || 'Erro ao realizar a troca de pneu.');
        }
    };

    // Calcula quantos km o pneu rodou
    const getKmsRodados = (tire) => {
        if (!tire) return 0;
        return (Number(tire.kmFinal) || 0) - (Number(tire.kmInicial) || 0);
    };

    // Pega o layout do tipo do veículo
    const getVehicleLayout = () => {
        if (!selectedVehicle || !selectedVehicle.tipo) return [];
        return TIRE_LAYOUTS[selectedVehicle.tipo] || [];
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Pesquisa de Veículos por Placa
            </Typography>

            <TextField
                label="Buscar Veículo pela Placa"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
            />

            {/* Lista de veículos filtrados */}
            {filteredVehicles.length === 0 ? (
                <Typography>Nenhum veículo encontrado.</Typography>
            ) : (
                <List>
                    {filteredVehicles.map((vehicle) => (
                        <ListItem
                            key={vehicle.objectId}
                            button
                            onClick={() => handleSelectVehicle(vehicle)}
                            selected={selectedVehicle && selectedVehicle.objectId === vehicle.objectId}
                        >
                            <ListItemText
                                primary={`${vehicle.placa} - ${vehicle.marca} ${vehicle.modelo} (${vehicle.tipo})`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {/* MODAL: Layout de Pneus do Veículo */}
            <Dialog
                open={openVehicleModal}
                onClose={handleCloseVehicleModal}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedVehicle
                        ? `Veículo: ${selectedVehicle.placa} - ${selectedVehicle.tipo}`
                        : 'Veículo não selecionado'}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedVehicle && (
                        <>
                            {getVehicleLayout().length === 0 ? (
                                <Typography sx={{ mt: 2 }}>
                                    Não há layout definido para o tipo "{selectedVehicle.tipo}".
                                </Typography>
                            ) : (
                                getVehicleLayout().map((axle, index) => (
                                    <Box key={index} sx={{ mt: 3 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ mb: 1, fontWeight: 'bold' }}
                                        >
                                            {axle.label}
                                        </Typography>
                                        <Grid container justifyContent="center">
                                            {axle.positions.map((pos) => {
                                                // Achar se existe um pneu nessa posição
                                                const currentTire = vehicleTires.find(
                                                    (t) => t.posicaoVeiculo === pos
                                                );
                                                return (
                                                    <Grid item key={pos}>
                                                        <TirePositionCard
                                                            onClick={() =>
                                                                openPositionDetails(pos, currentTire)
                                                            }
                                                        >
                                                            <MdOutlineTireRepair size={24} />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ fontWeight: 'bold' }}
                                                            >
                                                                {pos}
                                                            </Typography>
                                                            {currentTire ? (
                                                                <>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{ fontSize: '0.8rem' }}
                                                                    >
                                                                        {currentTire.numeroSerie}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{ fontSize: '0.7rem' }}
                                                                    >
                                                                        {currentTire.fabricante} -{' '}
                                                                        {currentTire.modelo}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{ fontSize: '0.7rem' }}
                                                                    >
                                                                        {getKmsRodados(currentTire)} km rodados
                                                                    </Typography>
                                                                    {/* Exibe quantas recapagens esse pneu tem, se quiser */}
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{ fontSize: '0.7rem' }}
                                                                    >
                                                                        Recap: {currentTire.recapCount || 0}
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{ fontSize: '0.8rem' }}
                                                                >
                                                                    [Vazio]
                                                                </Typography>
                                                            )}
                                                        </TirePositionCard>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                ))
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseVehicleModal}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: Detalhes da Posição (troca/atribuição de pneu) */}
            <Dialog
                open={openPositionModal}
                onClose={handleClosePositionModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Detalhes da Posição: {positionToEdit}</DialogTitle>
                <DialogContent dividers>
                    {assignedTire && (
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Pneu atual: {assignedTire.numeroSerie} (
                                {assignedTire.fabricante} {assignedTire.modelo})<br />
                                <strong>Status:</strong> {assignedTire.status}
                            </Alert>
                            <Typography variant="body2">
                                <strong>KM Inicial:</strong> {assignedTire.kmInicial}
                            </Typography>
                            <Typography variant="body2">
                                <strong>KM Final:</strong> {assignedTire.kmFinal}
                            </Typography>
                            <Typography variant="body2">
                                <strong>KM Rodados:</strong> {getKmsRodados(assignedTire)}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Dimensão:</strong> {assignedTire.dimensao}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Vida:</strong> {assignedTire.vida}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Recapagens:</strong> {assignedTire.recapCount || 0}
                            </Typography>
                        </Box>
                    )}

                    {modalError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {modalError}
                        </Alert>
                    )}

                    {/* Se houver pneu antigo, escolher destino */}
                    {assignedTire && (
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="destino-label">Destino do Pneu Antigo</InputLabel>
                            <Select
                                labelId="destino-label"
                                value={oldTireDestination}
                                label="Destino do Pneu Antigo"
                                onChange={(e) => setOldTireDestination(e.target.value)}
                            >
                                <MenuItem value="Em recapagem">Em recapagem</MenuItem>
                                <MenuItem value="Sucata">Sucata</MenuItem>
                                <MenuItem value="Em estoque">Em estoque</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    {/* Lista de pneus em estoque para trocar/atribuir */}
                    <FormControl fullWidth>
                        <InputLabel id="stock-tire-label">Selecionar Pneu do Estoque</InputLabel>
                        <Select
                            labelId="stock-tire-label"
                            fullWidth
                            value={selectedStockTire ? selectedStockTire.objectId : ''}
                            onChange={(e) => {
                                const selected = stockTires.find((t) => t.objectId === e.target.value);
                                setSelectedStockTire(selected);
                            }}
                            label="Selecionar Pneu do Estoque"
                        >
                            <MenuItem value="">
                                <em>Selecione um pneu</em>
                            </MenuItem>
                            {stockTires.map((t) => (
                                <MenuItem key={t.objectId} value={t.objectId}>
                                    {t.numeroSerie} - {t.fabricante} {t.modelo}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePositionModal}>Fechar</Button>
                    <Button variant="contained" onClick={handleSwapTire}>
                        Confirmar Troca/Atribuição
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default VehicleTireManagement;
