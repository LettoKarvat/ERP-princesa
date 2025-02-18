import { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  DirectionsCar,
  BuildCircle,
  LocalGasStation,
  CheckCircle,
} from '@mui/icons-material';
import { BarChart, PieChart } from '@mui/x-charts';

function Dashboard() {
  // Aqui simulamos métricas vindas de outro local
  const [metrics] = useState({
    totalVehicles: 15,
    activeVehicles: 12,
    pendingMaintenance: 3,
    fuelExpenses: 5000,
    totalChecklists: 27,
  });

  // Exemplo de dados de gastos mensais (combustível, pneus, peças)
  // para exibir num gráfico "agrupado" ou "empilhado".
  const monthlyExpenses = [
    { month: 'Jan', combustivel: 1200, pneus: 500, pecas: 300 },
    { month: 'Fev', combustivel: 1300, pneus: 200, pecas: 600 },
    { month: 'Mar', combustivel: 1500, pneus: 800, pecas: 200 },
    { month: 'Abr', combustivel: 1000, pneus: 400, pecas: 300 },
    { month: 'Mai', combustivel: 1800, pneus: 300, pecas: 200 },
  ];

  // Dados para o gráfico de pizza (ex.: status de veículos)
  const [vehicleStatusData] = useState([
    { status: 'Ativo', count: 12 },
    { status: 'Manutenção', count: 2 },
    { status: 'Inativo', count: 1 },
  ]);

  // Preparando dados para o BarChart “empilhado” ou “agrupado”
  // Precisamos de 3 séries: combustivel, pneus, pecas
  const categories = monthlyExpenses.map((item) => item.month);
  const combustivelSeries = monthlyExpenses.map((item) => item.combustivel);
  const pneusSeries = monthlyExpenses.map((item) => item.pneus);
  const pecasSeries = monthlyExpenses.map((item) => item.pecas);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Primeira linha de cartões */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DirectionsCar sx={{ color: '#1976d2', mr: 1 }} />
                <Typography color="textSecondary" sx={{ fontWeight: 'bold' }}>
                  Total de Veículos
                </Typography>
              </Box>
              <Typography variant="h4">{metrics.totalVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'green', mr: 1 }} />
                <Typography color="textSecondary" sx={{ fontWeight: 'bold' }}>
                  Veículos Ativos
                </Typography>
              </Box>
              <Typography variant="h4">{metrics.activeVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BuildCircle sx={{ color: '#ff9800', mr: 1 }} />
                <Typography color="textSecondary" sx={{ fontWeight: 'bold' }}>
                  Manutenções Pendentes
                </Typography>
              </Box>
              <Typography variant="h4">{metrics.pendingMaintenance}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalGasStation sx={{ color: '#f44336', mr: 1 }} />
                <Typography color="textSecondary" sx={{ fontWeight: 'bold' }}>
                  Gastos com Combustível
                </Typography>
              </Box>
              <Typography variant="h4">R$ {metrics.fuelExpenses}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Segunda linha de cartões / gráficos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Exemplo de gráfico de pizza: status dos veículos */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Status de Veículos
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <PieChart
                series={[
                  {
                    innerRadius: 0, // 0 para pizza, >0 para donut
                    data: vehicleStatusData.map((item) => item.count),
                  },
                ]}
                slices={[
                  {
                    value: vehicleStatusData.map((item) => item.count),
                    label: vehicleStatusData.map((item) => item.status),
                  },
                ]}
                height={300}
              />
            </Box>
          </Card>
        </Grid>

        {/* Exemplo: total de checklists feitos */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Checklists Realizados
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {metrics.totalChecklists}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Coloque algum outro indicador aqui, por exemplo, tempo médio de uso */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Indicador Personalizado
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body1">
                Coloque aqui alguma métrica relevante (ex.: “Tempo médio de uso do veículo”, “Serviços concluídos no mês” ou “% de utilização da frota”).
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de gastos mensais por categoria (Combustível, Pneus, Peças) */}
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Gastos Mensais (por Categoria)
        </Typography>
        <Box sx={{ width: '100%', height: 350 }}>

          <BarChart
            // Podemos ter 3 séries: combustivel, pneus, pecas
            series={[
              { data: combustivelSeries, label: 'Combustível' },
              { data: pneusSeries, label: 'Pneus' },
              { data: pecasSeries, label: 'Peças' },
            ]}
            xAxis={[
              {
                scaleType: 'band',
                data: categories,
              },
            ]}

            height={350}
          // Se quiser barras "agrupadas", está ok.
          // Se quiser "empilhar", acrescente stack=true nas séries.
          />
        </Box>
      </Card>
    </Box>
  );
}

// Exemplo de dados mockados (fora do componente, se preferir)
const combustivelSeries = [];
const pneusSeries = [];
const pecasSeries = [];
const categories = [];


export default Dashboard;