import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

function TireReplacement() {
    // Lista de registros de troca de pneus
    const [records, setRecords] = useState([]);

    // Estado para o novo registro
    const [newRecord, setNewRecord] = useState({
        truck: '',
        swapDate: '',
        tireQty: '',
        tireBrand: '',
        tireCost: '',
        observation: '',
    });

    // Atualiza os campos do formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewRecord((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Função para registrar um novo dado
    const handleRegister = () => {
        // Validação básica dos campos obrigatórios
        if (
            !newRecord.truck ||
            !newRecord.swapDate ||
            !newRecord.tireQty ||
            !newRecord.tireBrand ||
            !newRecord.tireCost
        ) {
            alert(
                'Preencha os campos obrigatórios: Caminhão, Data da Troca, Quantidade, Marca e Valor dos Pneus.'
            );
            return;
        }

        const id = records.length ? records[records.length - 1].id + 1 : 1;
        const recordToAdd = {
            id,
            truck: newRecord.truck,
            swapDate: newRecord.swapDate,
            tireQty: Number(newRecord.tireQty),
            tireBrand: newRecord.tireBrand,
            tireCost: Number(newRecord.tireCost),
            observation: newRecord.observation,
        };

        setRecords((prev) => [...prev, recordToAdd]);

        // Limpa o formulário
        setNewRecord({
            truck: '',
            swapDate: '',
            tireQty: '',
            tireBrand: '',
            tireCost: '',
            observation: '',
        });
    };

    // Configuração das colunas da DataGrid
    const columns = [
        { field: 'truck', headerName: 'Caminhão', width: 150 },
        { field: 'swapDate', headerName: 'Data da Troca', width: 150 },
        { field: 'tireQty', headerName: 'Qtd de Pneus', width: 150, type: 'number' },
        { field: 'tireBrand', headerName: 'Marca dos Pneus', width: 150 },
        { field: 'tireCost', headerName: 'Valor (R$)', width: 150, type: 'number' },
        { field: 'observation', headerName: 'Observação', width: 250 },
    ];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Troca de Pneus
            </Typography>

            {/* Formulário para novo registro */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        Novo Registro
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Caminhão"
                                name="truck"
                                value={newRecord.truck}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Data da Troca"
                                type="date"
                                name="swapDate"
                                InputLabelProps={{ shrink: true }}
                                value={newRecord.swapDate}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Qtd de Pneus"
                                type="number"
                                name="tireQty"
                                value={newRecord.tireQty}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Marca dos Pneus"
                                name="tireBrand"
                                value={newRecord.tireBrand}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Valor (R$)"
                                type="number"
                                name="tireCost"
                                value={newRecord.tireCost}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observação"
                                name="observation"
                                value={newRecord.observation}
                                onChange={handleChange}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button variant="contained" onClick={handleRegister}>
                                Registrar
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Tabela de registros */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Registros de Troca de Pneus
                    </Typography>
                    <Box sx={{ height: 400 }}>
                        <DataGrid
                            rows={records}
                            columns={columns}
                            pageSize={5}
                            disableSelectionOnClick
                        />
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

export default TireReplacement;
