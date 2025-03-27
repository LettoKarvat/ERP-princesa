import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import * as XLSX from "xlsx";
import { DataGrid } from "@mui/x-data-grid";

function PartsReplacementReport() {
  // Lista de registros cadastrados
  const [records, setRecords] = useState([]);

  // Estado para controle de edição
  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Função para exportar os registros para Excel (.xlsx)
  const exportToExcel = () => {
    const headers = [
      "Código da Peça",
      "Caminhão",
      "Placa",
      "Quilometragem",
      "Data de Instalação",
      "Qtd",
      "Valor da Peça (R$)",
      "Mão de Obra (R$)",
      "Custo Total (R$)",
      "Observação",
    ];

    const data = [headers];
    records.forEach((r) => {
      data.push([
        r.partCode,
        r.truck,
        r.truckPlate,
        r.mileage, // Exporta a quilometragem
        r.installationDate,
        r.quantity,
        r.partValue,
        r.laborValue,
        r.totalCost,
        r.observation,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "registros_troca_de_pecas.xlsx");
  };

  // Configuração das colunas da DataGrid
  const columns = [
    {
      field: "partCode",
      headerName: "Código da Peça",
      width: 150,
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            name="partCode"
            value={editValues.partCode}
            onChange={handleEditChange}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "truck",
      headerName: "Caminhão",
      width: 150,
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            name="truck"
            value={editValues.truck}
            onChange={handleEditChange}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "truckPlate",
      headerName: "Placa",
      width: 130,
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            name="truckPlate"
            value={editValues.truckPlate}
            onChange={handleEditChange}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "mileage",
      headerName: "Quilometragem",
      width: 130,
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            name="mileage"
            value={editValues.mileage}
            onChange={handleEditChange}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "installationDate",
      headerName: "Data de Instalação",
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
      field: "quantity",
      headerName: "Qtd",
      width: 80,
      type: "number",
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            type="number"
            name="quantity"
            value={editValues.quantity}
            onChange={handleEditChange}
            sx={{ width: "70px" }}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "partValue",
      headerName: "Valor Peça (R$)",
      width: 140,
      type: "number",
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            type="number"
            name="partValue"
            value={editValues.partValue}
            onChange={handleEditChange}
            sx={{ width: "100px" }}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "laborValue",
      headerName: "Mão de Obra (R$)",
      width: 140,
      type: "number",
      renderCell: (params) =>
        editRowId === params.row.id ? (
          <TextField
            type="number"
            name="laborValue"
            value={editValues.laborValue}
            onChange={handleEditChange}
            sx={{ width: "100px" }}
          />
        ) : (
          params.value
        ),
    },
    {
      field: "totalCost",
      headerName: "Custo Total (R$)",
      width: 150,
      type: "number",
      editable: false,
    },
    {
      field: "observation",
      headerName: "Observação",
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
      field: "actions",
      headerName: "Ações",
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

  // Função para iniciar a edição de um registro
  const handleEditClick = (params) => {
    setEditRowId(params.row.id);
    setEditValues({ ...params.row });
  };

  // Atualiza os valores em edição
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Função para salvar as alterações
  const handleSaveEdit = (id) => {
    if (
      !editValues.partCode ||
      !editValues.truck ||
      !editValues.installationDate ||
      !editValues.partValue ||
      !editValues.mileage
    ) {
      alert("Preencha os campos obrigatórios antes de salvar.");
      return;
    }
    if (editValues.includeLabor && !editValues.laborValue) {
      alert(
        'Preencha o valor da mão de obra ou desmarque "Incluir Mão de Obra".'
      );
      return;
    }
    if (editValues.quantity <= 0) {
      alert("A quantidade de peças deve ser pelo menos 1.");
      return;
    }

    const partValue = parseFloat(editValues.partValue) || 0;
    const laborValue = editValues.includeLabor
      ? parseFloat(editValues.laborValue) || 0
      : 0;
    const quantity = parseInt(editValues.quantity, 10);
    const totalCost = partValue * quantity + laborValue;

    setRecords((prev) =>
      prev.map((record) =>
        record.id === id
          ? {
            ...record,
            ...editValues,
            partValue,
            laborValue,
            quantity,
            totalCost,
          }
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
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      setRecords((prev) => prev.filter((record) => record.id !== id));
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Oficina – Troca de Peças
      </Typography>

      <DataGrid
        className="lg:max-w-[calc(100svw-280px)] max-w-[90vw] mx-auto"
        rows={records}
        columns={columns}
        pageSize={5}
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      {/* Botão para exportar os registros para Excel */}
      <Box sx={{ my: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={exportToExcel}>
          Exportar para Excel (.xlsx)
        </Button>
      </Box>
    </Box>
  );
}

export default PartsReplacementReport;
