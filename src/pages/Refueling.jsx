import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

export default function Refueling() {
    // Lista de abastecimentos salvos
    const [refuelings, setRefuelings] = useState([
        {
            id: 1,
            vehicle: 'HHK1G29',
            fuelType: 'DIESEL',
            date: '2025-01-02T15:20',
            post: 'interno',
            pump: 'B1',
            invoiceNumber: '',
            unitPrice: 0,
            liters: 107,
            mileage: 376918,
            tankMeasurement: 100,
            observation: 'Tanque cheio',
        },
        {
            id: 2,
            vehicle: 'ABC1234',
            fuelType: 'ARLA',
            date: '2025-01-10T10:00',
            post: 'externo',
            pump: '',
            invoiceNumber: 'NF-123',
            unitPrice: 4.5,
            liters: 20,
            mileage: 42000,
            tankMeasurement: 50,
            observation: '',
        },
    ]);

    // Controles do diálogo
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Estado para o abastecimento "em edição/criação"
    const [newRefueling, setNewRefueling] = useState(initialRefueling());

    // Estado para anexos
    const [attachments, setAttachments] = useState([]);

    // Handler para o input de arquivos
    const handleFileChange = (e) => {
        setAttachments(Array.from(e.target.files));
    };

    // Colunas do DataGrid
    const columns = [
        { field: 'vehicle', headerName: 'Veículo', width: 130 },
        { field: 'fuelType', headerName: 'Combustível', width: 120 },
        {
            field: 'date',
            headerName: 'Data',
            width: 160,
        },
        { field: 'post', headerName: 'Posto', width: 100 },
        { field: 'pump', headerName: 'Bomba', width: 90 },
        { field: 'invoiceNumber', headerName: 'Nota', width: 90 },
        {
            field: 'unitPrice',
            headerName: 'Preço Un.',
            width: 90,
            valueFormatter: (params) => (params.value ? `R$ ${params.value}` : ''),
        },
        { field: 'liters', headerName: 'Litros', width: 80 },
        { field: 'mileage', headerName: 'KM', width: 100 },
        { field: 'tankMeasurement', headerName: 'Medição Tanque', width: 130 },
        {
            field: 'observation',
            headerName: 'Observação',
            width: 150,
            flex: 1,
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 100,
            renderCell: (params) => (
                <>
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
                </>
            ),
        },
    ];

    // Handler para abrir o diálogo de novo abastecimento
    const handleOpenDialog = () => {
        setIsEditing(false);
        setEditId(null);
        setNewRefueling(initialRefueling());
        setAttachments([]); // Limpa os anexos
        setOpen(true);
    };

    // Handler para abrir o diálogo em modo edição
    const handleEdit = (id) => {
        const refuelToEdit = refuelings.find((r) => r.id === id);
        if (!refuelToEdit) return;

        setIsEditing(true);
        setEditId(id);
        setNewRefueling({
            vehicle: refuelToEdit.vehicle,
            fuelType: refuelToEdit.fuelType,
            date: refuelToEdit.date,
            post: refuelToEdit.post,
            pump: refuelToEdit.pump,
            invoiceNumber: refuelToEdit.invoiceNumber,
            unitPrice: refuelToEdit.unitPrice,
            liters: refuelToEdit.liters,
            mileage: refuelToEdit.mileage,
            tankMeasurement: refuelToEdit.tankMeasurement,
            observation: refuelToEdit.observation,
        });
        setAttachments([]); // Opcional: carregar anexos se houver
        setOpen(true);
    };

    // Exclui um registro
    const handleDelete = (id) => {
        const confirmed = window.confirm('Deseja excluir este abastecimento?');
        if (!confirmed) return;
        setRefuelings((prev) => prev.filter((r) => r.id !== id));
    };

    // Fecha o diálogo
    const handleCloseDialog = () => {
        setOpen(false);
    };

    // Atualiza o estado quando digitar nos campos
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewRefueling((prev) => ({ ...prev, [name]: value }));
    };

    // Salva (novo ou edição)
    const handleSave = () => {
        // Validações básicas
        if (!newRefueling.vehicle.trim()) {
            alert('Informe o veículo!');
            return;
        }
        if (!newRefueling.date) {
            alert('Informe a data!');
            return;
        }
        if (!newRefueling.liters) {
            alert('Informe a quantidade de litros!');
            return;
        }

        if (isEditing && editId != null) {
            // Modo edição
            setRefuelings((prev) =>
                prev.map((r) =>
                    r.id === editId
                        ? {
                            ...r,
                            ...newRefueling,
                            liters: Number(newRefueling.liters),
                            mileage: Number(newRefueling.mileage),
                            tankMeasurement: Number(newRefueling.tankMeasurement),
                            unitPrice: Number(newRefueling.unitPrice),
                        }
                        : r
                )
            );
        } else {
            // Novo abastecimento
            const newId = refuelings.length
                ? refuelings[refuelings.length - 1].id + 1
                : 1;
            const recordToAdd = {
                id: newId,
                ...newRefueling,
                liters: Number(newRefueling.liters),
                mileage: Number(newRefueling.mileage),
                tankMeasurement: Number(newRefueling.tankMeasurement),
                unitPrice: Number(newRefueling.unitPrice),
            };
            setRefuelings((prev) => [...prev, recordToAdd]);
        }

        // Aqui você pode tratar os anexos (por exemplo, enviá-los para o servidor)
        console.log('Arquivos anexados:', attachments);

        setOpen(false);
    };

    // Habilita/desabilita campos conforme o "post" (interno/externo)
    const isInternal = newRefueling.post === 'interno';
    const isExternal = newRefueling.post === 'externo';

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Abastecimentos</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                >
                    Novo Abastecimento
                </Button>
            </Box>

            <DataGrid
                rows={refuelings}
                columns={columns}
                pageSize={5}
                autoHeight
                sx={{ bgcolor: 'background.paper' }}
            />

            {/* Diálogo de criar/editar */}
            <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {isEditing ? 'Editar Abastecimento' : 'Novo Abastecimento'}
                </DialogTitle>
                <DialogContent dividers>
                    {/* Veículo */}
                    <TextField
                        margin="dense"
                        name="vehicle"
                        label="Veículo (Placa ou Nome)"
                        fullWidth
                        value={newRefueling.vehicle}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    />

                    {/* Tipo Combustível & Data */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel id="fuel-label">Combustível</InputLabel>
                            <Select
                                labelId="fuel-label"
                                name="fuelType"
                                label="Combustível"
                                value={newRefueling.fuelType}
                                onChange={handleChange}
                            >
                                <MenuItem value="DIESEL">DIESEL</MenuItem>
                                <MenuItem value="ARLA">ARLA</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            margin="dense"
                            name="date"
                            label="Data de Abastecimento"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={newRefueling.date}
                            onChange={handleChange}
                        />
                    </Box>

                    {/* Posto (interno/externo) */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="post-label">Posto</InputLabel>
                        <Select
                            labelId="post-label"
                            name="post"
                            label="Posto"
                            value={newRefueling.post}
                            onChange={handleChange}
                        >
                            <MenuItem value="interno">Interno</MenuItem>
                            <MenuItem value="externo">Externo</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Se for interno: exibe campo bomba */}
                    {isInternal && (
                        <TextField
                            margin="dense"
                            name="pump"
                            label="Bomba"
                            fullWidth
                            value={newRefueling.pump}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                    )}

                    {/* Se for externo: exibe campos de nota e preço */}
                    {isExternal && (
                        <>
                            <TextField
                                margin="dense"
                                name="invoiceNumber"
                                label="Número da Nota"
                                fullWidth
                                value={newRefueling.invoiceNumber}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                name="unitPrice"
                                label="Preço Unitário (R$)"
                                type="number"
                                fullWidth
                                value={newRefueling.unitPrice}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                            />
                        </>
                    )}

                    {/* Litros abastecidos e KM */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            margin="dense"
                            name="liters"
                            label="Litros Abastecidos"
                            type="number"
                            fullWidth
                            value={newRefueling.liters}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="dense"
                            name="mileage"
                            label="KM Atual"
                            type="number"
                            fullWidth
                            value={newRefueling.mileage}
                            onChange={handleChange}
                        />
                    </Box>
                    <TextField
                        margin="dense"
                        name="tankMeasurement"
                        label="Medição do Tanque (Total)"
                        type="number"
                        fullWidth
                        value={newRefueling.tankMeasurement}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    />

                    {/* Observação */}
                    <TextField
                        margin="dense"
                        name="observation"
                        label="Observação"
                        multiline
                        minRows={2}
                        fullWidth
                        value={newRefueling.observation}
                        onChange={handleChange}
                    />

                    {/* Seção de Anexos */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Anexos</Typography>
                        <input
                            accept="image/*,application/pdf"
                            style={{ display: 'none' }}
                            id="attachment-upload"
                            multiple
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="attachment-upload">
                            <Button variant="contained" component="span">
                                Adicionar Arquivos
                            </Button>
                        </label>
                        {attachments.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                {attachments.map((file, index) => (
                                    <Typography key={index} variant="body2">
                                        {file.name}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </Box>
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

// Função que devolve um objeto “limpo” para criar abastecimento
function initialRefueling() {
    return {
        vehicle: '',
        fuelType: 'DIESEL',
        date: '',
        post: 'interno',
        pump: '',
        invoiceNumber: '',
        unitPrice: 0,
        liters: '',
        mileage: '',
        tankMeasurement: '',
        observation: '',
    };
}
