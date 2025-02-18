import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button
} from '@mui/material';
import { BarChart } from '@mui/x-charts';

function ConsumptionControl() {
  const [consumptionData] = useState([
    { month: 'Jan', liters: 250, cost: 1250 },
    { month: 'Fev', liters: 280, cost: 1400 },
    { month: 'Mar', liters: 300, cost: 1500 },
    { month: 'Abr', liters: 260, cost: 1300 },
    { month: 'Mai', liters: 290, cost: 1450 },
  ]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>Controle de Consumo</Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Novo Registro de Abastecimento</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Litros"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Valor Total"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Quilometragem"
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained">Registrar Abastecimento</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Consumo Mensal (Litros)</Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  series={[{
                    data: consumptionData.map(item => item.liters),
                  }]}
                  xAxis={[{
                    scaleType: 'band',
                    data: consumptionData.map(item => item.month),
                  }]}
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Gastos Mensais (R$)</Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  series={[{
                    data: consumptionData.map(item => item.cost),
                  }]}
                  xAxis={[{
                    scaleType: 'band',
                    data: consumptionData.map(item => item.month),
                  }]}
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ConsumptionControl;