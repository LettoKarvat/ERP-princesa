import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import * as XLSX from 'xlsx';

function PartsReplacement() {
    // Lista de registros cadastrados
    const [records, setRecords] = useState([]);

    // Estado para o novo registro
    const [newRecord, setNewRecord] = useState({
        partCode: '',
        truck: '',
        truckPlate: '',
        installationDate: '',
        quantity: 1,
        partValue: '',
        includeLabor: false,
        laborValue: '',
        observation: '',
    });

    // Estado para controle de edição
    const [editRowId, setEditRowId] = useState(null);
    const [editValues, setEditValues] = useState({});

    // Atualiza os campos do formulário de novo registro
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewRecord((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Função para registrar o novo dado
    const handleRegister = () => {
        if (!newRecord.partCode || !newRecord.truck || !newRecord.installationDate || !newRecord.partValue) {
            alert('Preencha os campos obrigatórios: Código da Peça, Caminhão, Data de Instalação e Valor da Peça.');
            return;
        }
        if (newRecord.includeLabor && !newRecord.laborValue) {
            alert('Preencha o valor da mão de obra ou desmarque "Incluir Mão de Obra".');
            return;
        }
        if (newRecord.quantity <= 0) {
            alert('A quantidade de peças deve ser pelo menos 1.');
            return;
        }

        const id = records.length ? records[records.length - 1].id + 1 : 1;
        const partValue = parseFloat(newRecord.partValue) || 0;
        const laborValue = newRecord.includeLabor ? parseFloat(newRecord.laborValue) || 0 : 0;
        const quantity = parseInt(newRecord.quantity, 10);
        const totalCost = partValue * quantity + laborValue;

        const recordToAdd = {
            id,
            partCode: newRecord.partCode,
            truck: newRecord.truck,
            truckPlate: newRecord.truckPlate,
            installationDate: newRecord.installationDate,
            quantity,
            partValue,
            laborValue,
            totalCost,
            observation: newRecord.observation,
        };

        setRecords((prev) => [...prev, recordToAdd]);

        // Limpa o formulário
        setNewRecord({
            partCode: '',
            truck: '',
            truckPlate: '',
            installationDate: '',
            quantity: 1,
            partValue: '',
            includeLabor: false,
            laborValue: '',
            observation: '',
        });
    };

    // Função para iniciar a edição de um registro
    const handleEditClick = (params) => {
        setEditRowId(params.row.id);
        setEditValues({ ...params.row });
    };

    // Atualiza os valores em edição
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Função para salvar as alterações
    const handleSaveEdit = (id) => {
        if (!editValues.partCode || !editValues.truck || !editValues.installationDate || !editValues.partValue) {
            alert('Preencha os campos obrigatórios antes de salvar.');
            return;
        }
        if (editValues.includeLabor && !editValues.laborValue) {
            alert('Preencha o valor da mão de obra ou desmarque "Incluir Mão de Obra".');
            return;
        }
        if (editValues.quantity <= 0) {
            alert('A quantidade de peças deve ser pelo menos 1.');
            return;
        }

        const partValue = parseFloat(editValues.partValue) || 0;
        const laborValue = editValues.includeLabor ? parseFloat(editValues.laborValue) || 0 : 0;
        const quantity = parseInt(editValues.quantity, 10);
        const totalCost = partValue * quantity + laborValue;

        setRecords((prev) =>
            prev.map((record) =>
                record.id === id
                    ? { ...record, ...editValues, partValue, laborValue, quantity, totalCost }
                    : record
            )
        );
        setEditRowId(null);
        setEditValues({});
    };

    // Função para cancelar a edição
    const handleCancelEdit = () => {
        setEditRowId(null);
        setEditValues({});
    };

    // Função para remover um registro
    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            setRecords((prev) => prev.filter((record) => record.id !== id));
        }
    };

    // Função para exportar os registros para Excel (.xlsx) com cabeçalhos formatados
    const exportToExcel = () => {
        // Definindo os títulos das colunas em português
        const headers = [
            "Código da Peça",
            "Caminhão",
            "Placa",
            "Data de Instalação",
            "Qtd",
            "Valor da Peça (R$)",
            "Mão de Obra (R$)",
            "Custo Total (R$)",
            "Observação",
        ];

        // Monta os dados como array de arrays
        const data = [headers];
        records.forEach((r) => {
            data.push([
                r.partCode,
                r.truck,
                r.truckPlate,
                r.installationDate,
                r.quantity,
                r.partValue,
                r.laborValue,
                r.totalCost,
                r.observation,
            ]);
        });

        // Cria a worksheet a partir do array de arrays
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Aplica formatação simples aos cabeçalhos (primeira linha)
        // Observação: para que os estilos sejam aplicados, pode ser necessário utilizar uma versão que suporte estilos (como xlsx-style ou a versão Pro do SheetJS).
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F81BD" } },
            };
        }

        // Define larguras para as colunas (em pixels)
        worksheet["!cols"] = [
            { wpx: 100 }, // Código da Peça
            { wpx: 100 }, // Caminhão
            { wpx: 80 },  // Placa
            { wpx: 120 }, // Data de Instalação
            { wpx: 60 },  // Qtd
            { wpx: 120 }, // Valor da Peça
            { wpx: 120 }, // Mão de Obra
            { wpx: 120 }, // Custo Total
            { wpx: 150 }, // Observação
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
        XLSX.writeFile(workbook, 'registros_troca_de_pecas.xlsx');
    };

    // Configuração das colunas da DataGrid
    const columns = [
        {
            field: 'partCode',
            headerName: 'Código da Peça',
            width: 150,
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField name="partCode" value={editValues.partCode} onChange={handleEditChange} />
                ) : (
                    params.value
                ),
        },
        {
            field: 'truck',
            headerName: 'Caminhão',
            width: 150,
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField name="truck" value={editValues.truck} onChange={handleEditChange} />
                ) : (
                    params.value
                ),
        },
        {
            field: 'truckPlate',
            headerName: 'Placa',
            width: 130,
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField name="truckPlate" value={editValues.truckPlate} onChange={handleEditChange} />
                ) : (
                    params.value
                ),
        },
        {
            field: 'installationDate',
            headerName: 'Data de Instalação',
            width: 150,
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField
                        type="date"
                        name="installationDate"
                        value={editValues.installationDate}
                        onChange={handleEditChange}
                        InputLabelProps={{ shrink: true }}
                    />
                ) : (
                    params.value
                ),
        },
        {
            field: 'quantity',
            headerName: 'Qtd',
            width: 80,
            type: 'number',
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField
                        type="number"
                        name="quantity"
                        value={editValues.quantity}
                        onChange={handleEditChange}
                        sx={{ width: '70px' }}
                    />
                ) : (
                    params.value
                ),
        },
        {
            field: 'partValue',
            headerName: 'Valor Peça (R$)',
            width: 140,
            type: 'number',
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField
                        type="number"
                        name="partValue"
                        value={editValues.partValue}
                        onChange={handleEditChange}
                        sx={{ width: '100px' }}
                    />
                ) : (
                    params.value
                ),
        },
        {
            field: 'laborValue',
            headerName: 'Mão de Obra (R$)',
            width: 140,
            type: 'number',
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField
                        type="number"
                        name="laborValue"
                        value={editValues.laborValue}
                        onChange={handleEditChange}
                        sx={{ width: '100px' }}
                    />
                ) : (
                    params.value
                ),
        },
        {
            field: 'totalCost',
            headerName: 'Custo Total (R$)',
            width: 150,
            type: 'number',
            editable: false,
        },
        {
            field: 'observation',
            headerName: 'Observação',
            width: 200,
            renderCell: (params) =>
                editRowId === params.row.id ? (
                    <TextField
                        name="observation"
                        value={editValues.observation}
                        onChange={handleEditChange}
                        multiline
                        maxRows={4}
                    />
                ) : (
                    params.value
                ),
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 140,
            sortable: false,
            renderCell: (params) => {
                const isInEditMode = editRowId === params.row.id;
                return isInEditMode ? (
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleSaveEdit(params.row.id)}
                            sx={{ mr: 1 }}
                        >
                            Salvar
                        </Button>
                        <Button variant="outlined" color="error" onClick={handleCancelEdit}>
                            Cancelar
                        </Button>
                    </>
                ) : (
                    <>
                        <IconButton onClick={() => handleEditClick(params)}>
                            <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(params.row.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            },
        },
    ];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Oficina – Troca de Peças
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
                                label="Código da Peça *"
                                name="partCode"
                                value={newRecord.partCode}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Caminhão *"
                                name="truck"
                                value={newRecord.truck}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Placa do Caminhão (opcional)"
                                name="truckPlate"
                                value={newRecord.truckPlate}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Data de Instalação *"
                                type="date"
                                name="installationDate"
                                InputLabelProps={{ shrink: true }}
                                value={newRecord.installationDate}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Quantidade"
                                type="number"
                                name="quantity"
                                value={newRecord.quantity}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 1 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Valor da Peça (R$) *"
                                type="number"
                                name="partValue"
                                value={newRecord.partValue}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="includeLabor"
                                        checked={newRecord.includeLabor}
                                        onChange={handleChange}
                                    />
                                }
                                label="Incluir Mão de Obra"
                            />
                        </Grid>
                        {newRecord.includeLabor && (
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    label="Valor da Mão de Obra (R$)"
                                    type="number"
                                    name="laborValue"
                                    value={newRecord.laborValue}
                                    onChange={handleChange}
                                />
                            </Grid>
                        )}
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

            {/* Botão para exportar os registros para Excel */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={exportToExcel}>
                    Exportar para Excel (.xlsx)
                </Button>
            </Box>

            {/* Tabela para exibição dos registros */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Registros de Troca de Peças
                    </Typography>
                    <Box sx={{ height: 500 }}>
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

export default PartsReplacement;
