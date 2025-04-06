import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { formatMoney } from "../lib/utils";
import dayjs from "dayjs";

const columns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "vehicle", headerName: "Veículo", width: 350 },
  {
    field: "date",
    headerName: "Data",
    width: 150,
    valueGetter: (value, row) => dayjs(value.row.date).format("DD/MM/YYYY"),
  },
  { field: "post", headerName: "Posto", width: 100 },
  { field: "pump", headerName: "Bomba", width: 100 },
  {
    field: "unitPrice",
    headerName: "Preço / L",
    width: 100,
    valueGetter: (value, row) => `R$ ${formatMoney(value.row.unitPrice)}`,
  },
  { field: "liters", headerName: "Litros", width: 100 },
  { field: "mileage", headerName: "KM", width: 100 },
];

export default function RefuelingsReport() {
  const [refuelings, setRefuelings] = useState([
    {
      id: 1,
      vehicle: "HHK1G29 - M. BENZ M. BENZ 710",
      fuelType: "DIESEL",
      date: "2022-11-03T00:00",
      post: "interno",
      pump: "B1",
      invoiceNumber: "",
      unitPrice: 0,
      liters: 107,
      mileage: 376918,
      observation: "Tanque cheio",
      signature: "", // Assinatura do motorista
      attachments: [], // Anexos
    },
    {
      id: 2,
      vehicle: "OSY1H11 - M. BENZ M. BENZ ACELLO 815",
      fuelType: "ARLA",
      date: "2025-01-10T10:00",
      post: "externo",
      pump: "HAHA",
      invoiceNumber: "NF-123",
      unitPrice: 4.5,
      liters: 20,
      mileage: 42000,
      observation: "",
      signature: "",
      attachments: [],
    },
  ]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Oficina – Troca de Peças
      </Typography>

      <DataGrid
        className="lg:max-w-[calc(100svw-280px)] max-w-[90vw] mx-auto"
        rows={refuelings}
        columns={columns}
        pageSize={5}
        autoHeight
        sx={{ bgcolor: "background.paper" }}
      />

      {/* Botão para exportar os registros para Excel */}
      {/* <Box sx={{ my: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={exportToExcel}>
          Exportar para Excel (.xlsx)
        </Button>
      </Box> */}
    </Box>
  );
}
