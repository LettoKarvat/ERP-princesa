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
import { MdOutlineTireRepair } from 'react-icons/md'; // Ícone de pneu (pode usar outro)
import api from '../services/api';

/**
 * Layout top-down dos pneus, por tipo de veículo.
 * Cada tipo é um array de "eixos", e cada eixo tem:
 *  - label: nome ou descrição (ex.: "1º Eixo Dianteiro")
 *  - positions: array com as posições (ex.: ["1E", "1D"])
 */
/**
 * Layout top-down dos pneus, por tipo de veículo.
 * Cada tipo é um array de "eixos", e cada eixo tem:
 *  - label: nome ou descrição (ex.: "1º Eixo Dianteiro")
 *  - positions: array com as posições (ex.: ["1E", "1D"])
 */
const TIRE_LAYOUTS = {
    "Passeio": [
        {
            label: "Eixo Dianteiro",
            positions: ["1E", "1D"]
        },
        {
            label: "Eixo Traseiro",
            positions: ["2E", "2D"]
        },
        {
            label: "Estepe",
            positions: ["E"]
        }
    ],
    "Delivery": [
        {
            label: "1º Eixo (Dianteiro)",
            positions: ["1E", "1D"]
        },
        {
            label: "2º Eixo (Traseiro)",
            positions: ["2E", "2D"]
        },
        {
            label: "Estepe",
            positions: ["E"]
        }
    ],
    "3/4": [
        {
            label: "1º Eixo (Dianteiro)",
            positions: ["1E", "1D"]
        },
        {
            label: "2º Eixo (Traseiro)",
            positions: ["2DI", "2DE", "2EI", "2EE"]
        },
        {
            label: "Estepe",
            positions: ["E"]
        }
    ],
    "Toco": [
        {
            label: "1º Eixo (Dianteiro)",
            positions: ["1E", "1D"]
        },
        {
            label: "2º Eixo (Traseiro)",
            positions: ["2DI", "2DE", "2EI", "2EE"]
        },
        {
            label: "Estepe",
            positions: ["E"]
        }
    ],
    "Truck": [
        {
            label: "1º Eixo (Dianteiro)",
            positions: ["1E", "1D"]
        },
        {
            label: "2º Eixo (Traseiro)",
            positions: ["2DI", "2DE", "2EI", "2EE"]
        },
        {
            label: "3º Eixo (Traseiro)",
            positions: ["3DI", "3DE", "3EI", "3EE"]
        },
        {
            label: "Estepe",
            positions: ["E"]
        }
    ],
    "Bi-Truck": [
        {
            label: "1º Eixo (Dianteiro)",
            positions: ["1E", "1D"]
        },
        {
            label: "2º Eixo",
            positions: ["2E", "2D"]
        },
        {
            label: "3º Eixo",
            positions: ["3DI", "3DE", "3EI", "3EE"]
        },
        {
            label: "4º Eixo",
            positions: ["4DI", "4DE", "4EI", "4EE"]
        },
        {
            label: "Estepe",
            positions: ["E"]
        }
    ],
    "Cavalo": [
        {
            label: "1º Eixo (Dianteiro)",
            positions: ["1E", "1D"]
        },
        {
            label: "2º Eixo",
            positions: ["2DI", "2DE", "2EI", "2EE"]
        },
        {
            label: "3º Eixo",
            positions: ["3I", "3E"]
        },
        {
            label: "Estepe",
            positions: ["E"] // Corrigido, adicionado estepe
        }
    ],
    "Semi-Reboque (Bi-Trem)": [
        {
            label: "1º Eixo",
            positions: ["1DE", "1E"]
        },
        {
            label: "2º Eixo",
            positions: ["2DI", "2DE", "2EI", "2EE"]
        },
        {
            label: "Estepe",
            positions: ["E", "E"] // Corrigido, adicionado segundo estepe
        }
    ],
    "Semi-Reboque (Rodo-Trem)": [
        {
            label: "1º Eixo",
            positions: ["1D", "1E"]
        },
        {
            label: "2º Eixo",
            positions: ["2DI", "2DE", "2EI", "2EE"]
        },
        {
            label: "3º Eixo",
            positions: ["3DI", "3DE", "3EI", "3EE"]
        },
        {
            label: "Estepe",
            positions: ["E", "E"] // Mantidos dois estepes conforme a imagem
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

    // Modal
    const [openModal, setOpenModal] = useState(false);
    const [modalError, setModalError] = useState('');
    const [positionToEdit, setPositionToEdit] = useState('');
    const [assignedTire, setAssignedTire] = useState(null); // pneu que está no slot
    const [selectedStockTire, setSelectedStockTire] = useState(null);

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

    // Ao selecionar um veículo, carrega os pneus dele
    const handleSelectVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        loadVehicleTires(vehicle.objectId);
    };

    // Carrega todos os pneus e filtra por veiculoId
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

    // Ao clicar em um slot, abrimos o modal
    const handleOpenModal = (position, currentTire) => {
        setPositionToEdit(position);
        setAssignedTire(currentTire || null);
        setModalError('');
        setSelectedStockTire(null);
        // Carrega pneus em estoque
        loadStockTires();
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setPositionToEdit('');
        setAssignedTire(null);
        setSelectedStockTire(null);
        setModalError('');
    };

    // Trocar/Atribuir pneu
    const handleSwapTire = async () => {
        if (!selectedStockTire) {
            setModalError('Selecione um pneu do estoque para atribuir/trocar.');
            return;
        }
        try {
            const sessionToken = localStorage.getItem('sessionToken');

            // Se já existe um pneu nessa posição, removemos ele do veículo
            if (assignedTire) {
                // Ajuste se quiser mandar de volta para "Em estoque" ou "Trocado"
                await api.post(
                    '/functions/editarPneu',
                    {
                        objectId: assignedTire.objectId,
                        veiculoId: '',
                        posicaoVeiculo: '',
                        status: 'Trocado',
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
            handleCloseModal();
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
                                primary={`${vehicle.placa} - ${vehicle.marca} ${vehicle.modelo}   (${vehicle.tipo})`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Se um veículo foi selecionado, desenhar o layout */}
            {selectedVehicle && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5">
                        Veículo: {selectedVehicle.placa} - {selectedVehicle.tipo}
                    </Typography>

                    {/* Layout top-down, por eixos */}
                    {getVehicleLayout().length === 0 ? (
                        <Typography sx={{ mt: 2 }}>
                            Não há layout definido para o tipo "{selectedVehicle.tipo}".
                        </Typography>
                    ) : (
                        getVehicleLayout().map((axle, index) => (
                            <Box key={index} sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
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
                                                    onClick={() => handleOpenModal(pos, currentTire)}
                                                >
                                                    <MdOutlineTireRepair size={24} />
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {pos}
                                                    </Typography>
                                                    {currentTire ? (
                                                        <>
                                                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                                {currentTire.numeroSerie}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                                                                {currentTire.fabricante} - {currentTire.modelo}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                                                                {getKmsRodados(currentTire)} km rodados
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
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
                </Box>
            )}

            {/* Modal de detalhes e troca de pneu */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>Detalhes da Posição: {positionToEdit}</DialogTitle>
                <DialogContent dividers>
                    {/* Se existe pneu na posição, exibe as infos */}
                    {assignedTire && (
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Pneu atual: {assignedTire.numeroSerie} (
                                {assignedTire.fabricante} {assignedTire.modelo})
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
                                <strong>Status:</strong> {assignedTire.status}
                            </Typography>
                        </Box>
                    )}

                    {/* Exibe erros no modal, se houver */}
                    {modalError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {modalError}
                        </Alert>
                    )}

                    {/* Lista de pneus em estoque para trocar/atribuir */}
                    <FormControl fullWidth sx={{ mt: 2 }}>
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
                    <Button onClick={handleCloseModal}>Fechar</Button>
                    <Button variant="contained" onClick={handleSwapTire}>
                        Confirmar Troca/Atribuição
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default VehicleTireManagement;
