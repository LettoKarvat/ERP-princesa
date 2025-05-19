import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, List, ListItem, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Paper, styled, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api';

/* layouts por tipo de veículo */
const TIRE_LAYOUTS = {
    'Passeio': [
        { label: 'Eixo Dianteiro', positions: ['1E', '1D'] },
        { label: 'Eixo Traseiro', positions: ['2E', '2D'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    'Delivery': [
        { label: '1º Eixo (Dianteiro)', positions: ['1E', '1D'] },
        { label: '2º Eixo (Traseiro)', positions: ['2E', '2D'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    '3/4': [
        { label: '1º Eixo (Dianteiro)', positions: ['1E', '1D'] },
        { label: '2º Eixo (Traseiro)', positions: ['2DI', '2DE', '2EI', '2EE'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    'Toco': [
        { label: '1º Eixo (Dianteiro)', positions: ['1E', '1D'] },
        { label: '2º Eixo (Traseiro)', positions: ['2DI', '2DE', '2EI', '2EE'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    'Truck': [
        { label: '1º Eixo (Dianteiro)', positions: ['1E', '1D'] },
        { label: '2º Eixo (Traseiro)', positions: ['2DI', '2DE', '2EI', '2EE'] },
        { label: '3º Eixo (Traseiro)', positions: ['3DI', '3DE', '3EI', '3EE'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    'Bi-Truck': [
        { label: '1º Eixo (Dianteiro)', positions: ['1E', '1D'] },
        { label: '2º Eixo', positions: ['2E', '2D'] },
        { label: '3º Eixo', positions: ['3DI', '3DE', '3EI', '3EE'] },
        { label: '4º Eixo', positions: ['4DI', '4DE', '4EI', '4EE'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    'Cavalo': [
        { label: '1º Eixo (Dianteiro)', positions: ['1E', '1D'] },
        { label: '2º Eixo', positions: ['2DI', '2DE', '2EI', '2EE'] },
        { label: '3º Eixo', positions: ['3I', '3E'] },
        { label: 'Estepe', positions: ['E'] }
    ],
    'Semi-Reboque (Bi-Trem)': [
        { label: '1º Eixo', positions: ['1DE', '1E'] },
        { label: '2º Eixo', positions: ['2DI', '2DE', '2EI', '2EE'] },
        { label: 'Estepe', positions: ['E', 'E'] }
    ],
    'Semi-Reboque (Rodo-Trem)': [
        { label: '1º Eixo', positions: ['1D', '1E'] },
        { label: '2º Eixo', positions: ['2DI', '2DE', '2EI', '2EE'] },
        { label: '3º Eixo', positions: ['3DI', '3DE', '3EI', '3EE'] },
        { label: 'Estepe', positions: ['E', 'E'] }
    ]
};

const TirePositionCard = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'selected'
})(({ theme, selected }) => ({
    padding: theme.spacing(1),
    textAlign: 'center',
    cursor: 'pointer',
    minHeight: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing(1),
    border: selected ? `2px solid ${theme.palette.primary.main}` : undefined,
    backgroundColor: selected ? theme.palette.action.selected : undefined
}));

export default function VehicleTireManagement() {
    const [vehicles, setVehicles] = useState([]);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [vehicleTires, setVehicleTires] = useState([]);
    const [stockTires, setStockTires] = useState([]);

    const [openVehicleModal, setOpenVehicleModal] = useState(false);
    const [openPositionModal, setOpenPositionModal] = useState(false);
    const [openSwapConfirm, setOpenSwapConfirm] = useState(false);

    const [modalError, setModalError] = useState('');
    const [positionToEdit, setPositionToEdit] = useState('');
    const [assignedTire, setAssignedTire] = useState(null);
    const [selectedStockTire, setSelectedStockTire] = useState(null);
    const [oldTireDestination, setOldTireDestination] = useState('Em recapagem');

    const [swapMode, setSwapMode] = useState(false);
    const [swapFirst, setSwapFirst] = useState(null);
    const [swapSecond, setSwapSecond] = useState(null);

    const layoutRef = useRef(null);

    useEffect(() => { loadVehicles(); }, []);

    const sessionToken = () => localStorage.getItem('sessionToken');

    const loadVehicles = async () => {
        try {
            const { data } = await api.post('/functions/getAllVeiculos', {}, {
                headers: { 'X-Parse-Session-Token': sessionToken() }
            });
            setVehicles(data?.result ?? []);
        } catch (e) { console.error(e); }
    };

    const loadVehicleTires = async (vehicleId) => {
        try {
            const { data } = await api.post('/functions/getAllPneus', {}, {
                headers: { 'X-Parse-Session-Token': sessionToken() }
            });
            setVehicleTires((data?.result ?? []).filter(t => t.veiculoId === vehicleId));
        } catch (e) { console.error(e); }
    };

    const loadStockTires = async () => {
        try {
            const { data } = await api.post('/functions/getAllPneus', {}, {
                headers: { 'X-Parse-Session-Token': sessionToken() }
            });
            setStockTires((data?.result ?? []).filter(p => (p.status || '').toLowerCase() === 'em estoque'));
        } catch (e) { console.error(e); }
    };

    const getKmsRodados = t => (Number(t.kmFinal) || 0) - (Number(t.kmInicial) || 0);
    const getVehicleLayout = () =>
        selectedVehicle?.tipo ? TIRE_LAYOUTS[selectedVehicle.tipo] || [] : [];

    const handleSelectVehicle = async v => {
        setSelectedVehicle(v);
        await loadVehicleTires(v.objectId);
        setOpenVehicleModal(true);
    };

    const openPositionDetails = (pos, current) => {
        setPositionToEdit(pos);
        setAssignedTire(current || null);
        setModalError('');
        setSelectedStockTire(null);
        setOldTireDestination('Em recapagem');
        loadStockTires();
        setOpenPositionModal(true);
    };

    const handleSwapTire = async () => {
        if (!selectedStockTire) return setModalError('Selecione um pneu do estoque primeiro.');
        try {
            const tokenHeader = { headers: { 'X-Parse-Session-Token': sessionToken() } };
            if (assignedTire) {
                await api.post('/functions/editarPneu', {
                    objectId: assignedTire.objectId, veiculoId: '', posicaoVeiculo: '',
                    status: oldTireDestination
                }, tokenHeader);
            }
            await api.post('/functions/editarPneu', {
                objectId: selectedStockTire.objectId,
                veiculoId: selectedVehicle.objectId,
                posicaoVeiculo: positionToEdit,
                status: 'Em uso'
            }, tokenHeader);
            alert('Pneu atribuído/trocado com sucesso!');
            setOpenPositionModal(false);
            loadVehicleTires(selectedVehicle.objectId);
        } catch (e) {
            console.error(e);
            setModalError('Falha na troca de pneu.');
        }
    };

    const exportToPdf = async () => {
        if (!layoutRef.current) return;
        const canvas = await html2canvas(layoutRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`layout-${selectedVehicle.placa}.pdf`);
    };

    const handleCardClick = (pos, current) => {
        if (swapMode) {
            if (!swapFirst) {
                setSwapFirst({ pos, current });
            } else if (!swapSecond && swapFirst.pos !== pos) {
                setSwapSecond({ pos, current });
                setOpenSwapConfirm(true);
            }
        } else {
            openPositionDetails(pos, current);
        }
    };

    const confirmSwap = async () => {
        try {
            const tokenHeader = { headers: { 'X-Parse-Session-Token': sessionToken() } };
            await api.post('/functions/editarPneu', {
                objectId: swapFirst.current?.objectId || '',
                veiculoId: selectedVehicle.objectId,
                posicaoVeiculo: swapSecond.pos,
                status: 'Em uso'
            }, tokenHeader);
            await api.post('/functions/editarPneu', {
                objectId: swapSecond.current?.objectId || '',
                veiculoId: selectedVehicle.objectId,
                posicaoVeiculo: swapFirst.pos,
                status: 'Em uso'
            }, tokenHeader);
            alert('Pneus trocados com sucesso!');
            setOpenSwapConfirm(false);
            setSwapMode(false);
            loadVehicleTires(selectedVehicle.objectId);
        } catch (e) {
            console.error(e);
            alert('Falha ao trocar posições.');
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.placa.toLowerCase().includes(vehicleSearch.toLowerCase())
    );

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Pesquisa de Veículos por Placa</Typography>
            <TextField
                label="Buscar Veículo pela Placa"
                fullWidth sx={{ mb: 2 }}
                value={vehicleSearch}
                onChange={e => setVehicleSearch(e.target.value)}
            />
            {filteredVehicles.length === 0 ? (
                <Typography>Nenhum veículo encontrado.</Typography>
            ) : (
                <List>
                    {filteredVehicles.map(v => (
                        <ListItem
                            key={v.objectId}
                            button
                            onClick={() => handleSelectVehicle(v)}
                            selected={selectedVehicle?.objectId === v.objectId}
                        >
                            <ListItemText
                                primary={`${v.placa} - ${v.marca} ${v.modelo} (${v.tipo})`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Modal Veículo */}
            <Dialog open={openVehicleModal} onClose={() => setOpenVehicleModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedVehicle && `Veículo: ${selectedVehicle.placa} - ${selectedVehicle.tipo}`}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant={swapMode ? 'contained' : 'outlined'}
                            color="secondary"
                            onClick={() => { setSwapMode(!swapMode); setSwapFirst(null); setSwapSecond(null); }}
                        >
                            {swapMode ? 'Cancelar Troca' : 'Modo Troca de Posições'}
                        </Button>
                        <Button sx={{ ml: 2 }} variant="contained" onClick={exportToPdf}>
                            Exportar PDF
                        </Button>
                    </Box>
                    <Box ref={layoutRef} sx={{ py: 2 }}>
                        {selectedVehicle ? (
                            getVehicleLayout().map((axle, i) => (
                                <Box key={i} sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        {axle.label}
                                    </Typography>
                                    <Grid container justifyContent="center">
                                        {axle.positions.map(pos => {
                                            const current = vehicleTires.find(t => t.posicaoVeiculo === pos);
                                            const isFirst = swapFirst?.pos === pos;
                                            const isSecond = swapSecond?.pos === pos;
                                            return (
                                                <Grid item key={pos}>
                                                    <TirePositionCard
                                                        selected={isFirst || isSecond}
                                                        onClick={() => handleCardClick(pos, current)}
                                                    >
                                                        <MdOutlineTireRepair size={24} />
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{pos}</Typography>
                                                        {current ? (
                                                            <>
                                                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{current.numeroSerie}</Typography>
                                                                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{current.fabricante} - {current.modelo}</Typography>
                                                                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{getKmsRodados(current)} km rodados</Typography>
                                                                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Recap: {current.recapCount || 0}</Typography>
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>[Vazio]</Typography>
                                                        )}
                                                    </TirePositionCard>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            ))
                        ) : (
                            <Typography sx={{ mt: 2 }}>
                                Não há layout definido para "{selectedVehicle?.tipo}".
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenVehicleModal(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* Modal Posição */}
            <Dialog open={openPositionModal} onClose={() => setOpenPositionModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Posição: {positionToEdit}</DialogTitle>
                <DialogContent dividers>
                    {assignedTire && (
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Pneu atual: {assignedTire.numeroSerie} ({assignedTire.fabricante} {assignedTire.modelo})<br />
                                <strong>Status:</strong> {assignedTire.status}
                            </Alert>
                            {[
                                ['KM Inicial', assignedTire.kmInicial],
                                ['KM Final', assignedTire.kmFinal],
                                ['KM Rodados', getKmsRodados(assignedTire)],
                                ['Dimensão', assignedTire.dimensao],
                                ['Vida', assignedTire.vida],
                                ['Recapagens', assignedTire.recapCount || 0],
                            ].map(([lbl, val]) => (
                                <Typography key={lbl} variant="body2"><strong>{lbl}:</strong> {val}</Typography>
                            ))}
                        </Box>
                    )}
                    {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
                    {assignedTire && (
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="destino-label">Destino do Pneu Antigo</InputLabel>
                            <Select
                                labelId="destino-label"
                                value={oldTireDestination}
                                label="Destino do Pneu Antigo"
                                onChange={e => setOldTireDestination(e.target.value)}
                            >
                                <MenuItem value="Em recapagem">Em recapagem</MenuItem>
                                <MenuItem value="Sucata">Sucata</MenuItem>
                                <MenuItem value="Em estoque">Em estoque</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                    <FormControl fullWidth>
                        <InputLabel id="stock-label">Selecionar Pneu do Estoque</InputLabel>
                        <Select
                            labelId="stock-label"
                            value={selectedStockTire?.objectId || ''}
                            label="Selecionar Pneu do Estoque"
                            onChange={e => {
                                const t = stockTires.find(s => s.objectId === e.target.value);
                                setSelectedStockTire(t);
                            }}
                        >
                            <MenuItem value=""><em>Selecione um pneu</em></MenuItem>
                            {stockTires.map(t => (
                                <MenuItem key={t.objectId} value={t.objectId}>
                                    {t.numeroSerie} - {t.fabricante} {t.modelo}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPositionModal(false)}>Fechar</Button>
                    <Button variant="contained" onClick={handleSwapTire}>Confirmar Troca/Atribuição</Button>
                </DialogActions>
            </Dialog>

            {/* Modal Confirmação de Swap */}
            <Dialog open={openSwapConfirm} onClose={() => setOpenSwapConfirm(false)}>
                <DialogTitle>Confirmar troca</DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Trocar pneu da posição <strong>{swapFirst?.pos}</strong> com <strong>{swapSecond?.pos}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSwapConfirm(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmSwap}>Confirmar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
