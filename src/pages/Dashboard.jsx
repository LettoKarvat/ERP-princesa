import { useState } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts';

function Dashboard() {
  const [metrics] = useState({
    totalVehicles: 15,
    activeVehicles: 12,
    pendingMaintenance: 3,
    fuelExpenses: 5000
  });

  const chartData = [
    { month: 'Jan', expenses: 4200 },
    { month: 'Fev', expenses: 4500 },
    { month: 'Mar', expenses: 5000 },
    { month: 'Abr', expenses: 4800 },
    { month: 'Mai', expenses: 5200 },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Veículos
              </Typography>
              <Typography variant="h4">{metrics.totalVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Veículos Ativos
              </Typography>
              <Typography variant="h4">{metrics.activeVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Manutenções Pendentes
              </Typography>
              <Typography variant="h4">{metrics.pendingMaintenance}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gastos com Combustível
              </Typography>
              <Typography variant="h4">R$ {metrics.fuelExpenses}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Gastos Mensais</Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <BarChart
            series={[{
              data: chartData.map(item => item.expenses),
            }]}
            xAxis={[{
              scaleType: 'band',
              data: chartData.map(item => item.month),
            }]}
            height={300}
          />
        </Box>
      </Card>
    </Box>
  );
}

export default Dashboard;