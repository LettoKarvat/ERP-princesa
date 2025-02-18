import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart } from '@mui/x-charts';
import { Delete as DeleteIcon } from '@mui/icons-material';

// Função utilitária para extrair "mês/ano" de uma data "YYYY-MM-DD"
// e retornar ex: "2025-02".
function getMonthYear(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const m = date.getMonth() + 1; // (0-11) + 1
  const y = date.getFullYear();
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default function ConsumptionControl() {
  // Lista geral de gastos. Cada item pode ser de Combustível, Pneus ou Peças.
  const [expenditures, setExpenditures] = useState([
    {
      id: 1,
      date: '2025-01-10',
      vehicle: 'ABC1234',
      category: 'Combustível', // Combustível | Pneus | Peças
      // Campos para combustível:
      liters: 50,
      // Campos para pneus:
      tireQty: 0,
      tireBrand: '',
      // Campos para peças:
      partName: '',
      partQty: 0,
      // Comum a todas:
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

  // Estado do formulário para criar novo registro
  const [newRecord, setNewRecord] = useState({
    date: '',
    vehicle: '',
    category: 'Combustível',
    // Combustível
    liters: '',
    // Pneus
    tireQty: '',
    tireBrand: '',
    // Peças
    partName: '',
    partQty: '',
    // Comum
    cost: '',
    observation: '',
  });

  // Ao digitar nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({ ...prev, [name]: value }));
  };

  // Quando mudamos a categoria, limpamos os campos específicos?
  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setNewRecord((prev) => ({
      ...prev,
      category: selected,
      liters: '',
      tireQty: '',
      tireBrand: '',
      partName: '',
      partQty: '',
    }));
  };

  // Botão "Registrar"
  const handleRegister = () => {
    // Validação simples
    if (!newRecord.date || !newRecord.vehicle || !newRecord.cost) {
      alert('Preencha ao menos Data, Veículo e Custo!');
      return;
    }

    // Gera ID
    const newId = expenditures.length
      ? expenditures[expenditures.length - 1].id + 1
      : 1;

    const recordToAdd = {
      id: newId,
      date: newRecord.date,
      vehicle: newRecord.vehicle,
      category: newRecord.category,
      liters: Number(newRecord.liters) || 0,
      tireQty: Number(newRecord.tireQty) || 0,
      tireBrand: newRecord.tireBrand || '',
      partName: newRecord.partName || '',
      partQty: Number(newRecord.partQty) || 0,
      cost: Number(newRecord.cost) || 0,
      observation: newRecord.observation || '',
    };

    // Salva no array
    setExpenditures((prev) => [...prev, recordToAdd]);

    // Limpa formulário
    setNewRecord({
      date: '',
      vehicle: '',
      category: newRecord.category, // mantém a mesma categoria selecionada
      liters: '',
      tireQty: '',
      tireBrand: '',
      partName: '',
      partQty: '',
      cost: '',
      observation: '',
    });
  };

  // Excluir registro
  const handleDelete = (id) => {
    if (!window.confirm('Deseja realmente excluir este registro?')) return;
    setExpenditures((prev) => prev.filter((item) => item.id !== id));
  };

  // ----- Montando colunas da tabela -----
  // Exibimos colunas comuns: Data, Veículo, Categoria, Custo, Observação
  // E colunas específicas se quiser (Litros, Qtd Pneus, Peça etc.).
  const columns = [
    { field: 'date', headerName: 'Data', width: 110 },
    { field: 'vehicle', headerName: 'Veículo', width: 110 },
    { field: 'category', headerName: 'Categoria', width: 120 },
    {
      field: 'specific',
      headerName: 'Detalhes',
      width: 180,
      // Exibir algo de acordo com a categoria
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

  // ----- Gráficos -----
  // a) Gasto total mensal (somando todos).
  // b) Gasto mensal por categoria (opcional).

  // Montar um map { '2025-01': { totalCost: 0, fuelCost: 0, tireCost: 0, partsCost: 0 } }
  const monthlyMap = {};
  expenditures.forEach((item) => {
    const key = getMonthYear(item.date);
    if (!key) return;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { total: 0, fuel: 0, tire: 0, parts: 0 };
    }
    // Soma no total
    monthlyMap[key].total += item.cost;

    // Soma em cada categoria
    if (item.category === 'Combustível') {
      monthlyMap[key].fuel += item.cost;
    } else if (item.category === 'Pneus') {
      monthlyMap[key].tire += item.cost;
    } else if (item.category === 'Peças') {
      monthlyMap[key].parts += item.cost;
    }
  });

  // Convertendo em array ordenada
  const monthlyData = Object.entries(monthlyMap)
    .map(([month, val]) => ({
      month,
      total: val.total,
      fuel: val.fuel,
      tire: val.tire,
      parts: val.parts,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Vamos criar um array para o BarChart do total
  const totalCosts = monthlyData.map((item) => item.total);
  const months = monthlyData.map((item) => item.month);

  // Se quiser 3 gráficos (um para cada categoria) ou um stacked chart
  //  *Exemplo rápido: 3 bar charts, um para cada*
  const fuelCosts = monthlyData.map((item) => item.fuel);
  const tireCosts = monthlyData.map((item) => item.tire);
  const partsCosts = monthlyData.map((item) => item.parts);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Controle de Gastos (Combustível, Pneus, Peças)
      </Typography>

      {/* Formulário de novo registro */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Novo Registro de Consumo
          </Typography>
          <Grid container spacing={2}>
            {/* Data */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                name="date"
                InputLabelProps={{ shrink: true }}
                value={newRecord.date}
                onChange={handleChange}
              />
            </Grid>
            {/* Veículo */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Veículo (Placa)"
                name="vehicle"
                value={newRecord.vehicle}
                onChange={handleChange}
              />
            </Grid>
            {/* Categoria */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="category"
                  label="Categoria"
                  value={newRecord.category}
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="Combustível">Combustível</MenuItem>
                  <MenuItem value="Pneus">Pneus</MenuItem>
                  <MenuItem value="Peças">Peças</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Se for Combustível, mostra Litros */}
            {newRecord.category === 'Combustível' && (
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Litros"
                  type="number"
                  name="liters"
                  value={newRecord.liters}
                  onChange={handleChange}
                />
              </Grid>
            )}

            {/* Se for Pneus, mostra Qtd e Marca */}
            {newRecord.category === 'Pneus' && (
              <>
                <Grid item xs={12} sm={6} md={1.5}>
                  <TextField
                    fullWidth
                    label="Qtd Pneus"
                    type="number"
                    name="tireQty"
                    value={newRecord.tireQty}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    label="Marca Pneus"
                    name="tireBrand"
                    value={newRecord.tireBrand}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}

            {/* Se for Peças, mostra nome e qtd */}
            {newRecord.category === 'Peças' && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Peça"
                    name="partName"
                    value={newRecord.partName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                  <TextField
                    fullWidth
                    label="Qtd"
                    type="number"
                    name="partQty"
                    value={newRecord.partQty}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}

            {/* Custo */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Custo (R$)"
                type="number"
                name="cost"
                value={newRecord.cost}
                onChange={handleChange}
              />
            </Grid>

            {/* Observação */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Observação"
                name="observation"
                value={newRecord.observation}
                onChange={handleChange}
              />
            </Grid>

            {/* Botão */}
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleRegister}>
                Registrar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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

        {/* Gráficos de cada categoria separada (opcional) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Gasto por Categoria
              </Typography>
              {/* Exemplo: 3 gráficos em colunas (poderia ser stacked etc.) */}
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
