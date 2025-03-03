// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import api from '../services/api'; // Axios config que chama o Back4App

// Validação com Yup
const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup.string().required('Senha é obrigatória'),
});

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // react-hook-form com yup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Mapeamento de roles -> rotas padrão
  const roleToRoute = {
    admin: '/dashboard',
    abastecimento: '/refueling',
    manutencao: '/parts-replacement',
    motorista: '/checklist',
    portaria: '/checklist', // Redireciona para checklist
    // Adicione outras roles conforme precisar
  };

  const onSubmit = async (data) => {
    try {
      // Faz a chamada à Cloud Function "login"
      const response = await api.post('/functions/login', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      // Se deu certo, retorna { result: { user: {...} } }
      if (response.data.result && response.data.result.user) {
        const { token, role, fullname } = response.data.result.user;

        // Guarda no localStorage para identificar a sessão
        localStorage.setItem('sessionToken', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullname', fullname);

        // Verifica se a role está mapeada
        const defaultRoute = roleToRoute[role];
        if (defaultRoute) {
          navigate(defaultRoute);
        } else {
          setError('Permissão inválida. Contate o suporte.');
        }
      } else {
        throw new Error('Login falhou. Verifique suas credenciais.');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Painel Princesa
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 1, width: '100%' }}
          >
            {/* Campo de Email */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            {/* Campo de Senha */}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
