import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart } from '@mui/x-charts';
import { Delete as DeleteIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

// Função utilitária para extrair "mês/ano" de uma data "YYYY-MM-DD"
function getMonthYear(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const m = date.getMonth() + 1; // (0-11) + 1
  const y = date.getFullYear();
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default function ConsumptionControl() {
  // Lista geral de consumos (registros)
  const [expenditures, setExpenditures] = useState([
    {
      id: 1,
      date: '2025-01-10',
      vehicle: 'ABC1234',
      category: 'Combustível',
      liters: 50,
      tireQty: 0,
      tireBrand: '',
      partName: '',
      partQty: 0,
      cost: 250,
      observation: 'Posto Shell',
    },
    {
      id: 2,
      date: '2025-01-15',
      vehicle: 'ABC1234',
      category: 'Peças',
      liters: 0,
      tireQty: 0,
      tireBrand: '',
      partName: 'Filtro de Óleo',
      partQty: 1,
      cost: 80,
      observation: 'Troca do filtro',
    },
    {
      id: 3,
      date: '2025-02-01',
      vehicle: 'DEF5678',
      category: 'Pneus',
      liters: 0,
      tireQty: 2,
      tireBrand: 'Michelin',
      partName: '',
      partQty: 0,
      cost: 600,
      observation: 'Pneus dianteiros',
    },
    {
      id: 4,
      date: '2025-02-10',
      vehicle: 'ABC1234',
      category: 'Combustível',
      liters: 45,
      tireQty: 0,
      tireBrand: '',
      partName: '',
      partQty: 0,
      cost: 225,
      observation: 'Gasolina comum',
    },
  ]);

  // Função para excluir um registro
  const handleDelete = (id) => {
    if (!window.confirm('Deseja realmente excluir este registro?')) return;
    setExpenditures((prev) => prev.filter((item) => item.id !== id));
  };

  // Função para exportar os registros para Excel (.xlsx) com cabeçalhos em português
  const exportToExcel = () => {
    const headers = [
      "Data",
      "Veículo",
      "Categoria",
      "Detalhes",
      "Custo (R$)",
      "Observação",
    ];

    // Prepara os dados para o Excel: transforma cada registro em um array
    const data = [headers];
    expenditures.forEach((r) => {
      let details = '';
      switch (r.category) {
        case 'Combustível':
          details = `Litros: ${r.liters}`;
          break;
        case 'Pneus':
          details = `Qtd: ${r.tireQty} / Marca: ${r.tireBrand}`;
          break;
        case 'Peças':
          details = `Peça: ${r.partName} (x${r.partQty})`;
          break;
        default:
          break;
      }
      data.push([
        r.date,
        r.vehicle,
        r.category,
        details,
        r.cost,
        r.observation,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Aplica formatação simples aos cabeçalhos (primeira linha)
    // Obs: Para que os estilos sejam aplicados, pode ser necessário utilizar uma versão que suporte estilos (como o xlsx-style ou a versão Pro do SheetJS)
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
      { wpx: 100 }, // Data
      { wpx: 100 }, // Veículo
      { wpx: 120 }, // Categoria
      { wpx: 180 }, // Detalhes
      { wpx: 100 }, // Custo
      { wpx: 150 }, // Observação
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consumos');
    XLSX.writeFile(workbook, 'registros_consumos.xlsx');
  };

  // Configuração das colunas da DataGrid
  const columns = [
    { field: 'date', headerName: 'Data', width: 110 },
    { field: 'vehicle', headerName: 'Veículo', width: 110 },
    { field: 'category', headerName: 'Categoria', width: 120 },
    {
      field: 'specific',
      headerName: 'Detalhes',
      width: 180,
      renderCell: (params) => {
        const row = params.row;
        switch (row.category) {
          case 'Combustível':
            return `Litros: ${row.liters}`;
          case 'Pneus':
            return `Qtd: ${row.tireQty} / Marca: ${row.tireBrand}`;
          case 'Peças':
            return `Peça: ${row.partName} (x${row.partQty})`;
          default:
            return '';
        }
      },
    },
    { field: 'cost', headerName: 'Custo (R$)', width: 110 },
    { field: 'observation', headerName: 'Observação', width: 150 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 70,
      renderCell: (params) => (
        <IconButton
          color="error"
          size="small"
          onClick={() => handleDelete(params.row.id)}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  // ----- Cálculo dos dados mensais para gráficos -----
  // Monta um map { '2025-01': { total, fuel, tire, parts } }
  const monthlyMap = {};
  expenditures.forEach((item) => {
    const key = getMonthYear(item.date);
    if (!key) return;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { total: 0, fuel: 0, tire: 0, parts: 0 };
    }
    monthlyMap[key].total += item.cost;
    if (item.category === 'Combustível') {
      monthlyMap[key].fuel += item.cost;
    } else if (item.category === 'Pneus') {
      monthlyMap[key].tire += item.cost;
    } else if (item.category === 'Peças') {
      monthlyMap[key].parts += item.cost;
    }
  });
  const monthlyData = Object.entries(monthlyMap)
    .map(([month, val]) => ({
      month,
      total: val.total,
      fuel: val.fuel,
      tire: val.tire,
      parts: val.parts,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  const totalCosts = monthlyData.map((item) => item.total);
  const months = monthlyData.map((item) => item.month);
  const fuelCosts = monthlyData.map((item) => item.fuel);
  const tireCosts = monthlyData.map((item) => item.tire);
  const partsCosts = monthlyData.map((item) => item.parts);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Controle de Gastos (Combustível, Pneus, Peças)
      </Typography>

      {/* Botão de exportação */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={exportToExcel}>
          Exportar para Excel (.xlsx)
        </Button>
      </Box>

      {/* Tabela de registros */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Registros de Consumo
          </Typography>
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={expenditures}
              columns={columns}
              pageSize={5}
              disableSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {/* Gráficos de gastos mensais */}
      <Grid container spacing={3}>
        {/* Gráfico de gasto total por mês */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Gasto Mensal (Total)
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  series={[{ data: totalCosts }]}
                  xAxis={[{ scaleType: 'band', data: months }]}
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráficos por categoria */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Gasto por Categoria
              </Typography>
              <Typography variant="subtitle2">Combustível</Typography>
              <Box sx={{ width: '100%', height: 150, mb: 2 }}>
                <BarChart
                  series={[{ data: fuelCosts }]}
                  xAxis={[{ scaleType: 'band', data: months }]}
                  height={150}
                />
              </Box>
              <Typography variant="subtitle2">Pneus</Typography>
              <Box sx={{ width: '100%', height: 150, mb: 2 }}>
                <BarChart
                  series={[{ data: tireCosts }]}
                  xAxis={[{ scaleType: 'band', data: months }]}
                  height={150}
                />
              </Box>
              <Typography variant="subtitle2">Peças</Typography>
              <Box sx={{ width: '100%', height: 150 }}>
                <BarChart
                  series={[{ data: partsCosts }]}
                  xAxis={[{ scaleType: 'band', data: months }]}
                  height={150}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
