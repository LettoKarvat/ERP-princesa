import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import api from "../services/apiFlask";

// validação com Yup
const schema = yup.object({
  username: yup.string().required("Informe seu usuário"),
  password: yup.string().required("Senha é obrigatória"),
});

// mapa de papéis → rotas iniciais
const roleToRoute = {
  admin: "/dashboard",
  abastecimento: "/refueling",
  manutencao: "/parts-replacement/maintenance",
  motorista: "/driver-checklists",
  portaria: "/checklist",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      // -------- chamada ao Flask --------
      const res = await api.post("/auth/login", {
        username: data.username.trim(),
        password: data.password,
      });

      // resposta = { fullname, role, token? }
      const { fullname, role, token } = res.data;

      /* -------------------------------------------------------------------
         Se o back‑end não enviar JWT (usa cookie de sessão),
         gravamos um marcador “cookie” para que as rotas privadas reconheçam
      -------------------------------------------------------------------- */
      if (token) {
        localStorage.setItem("sessionToken", token); // futuro JWT
      } else {
        localStorage.setItem("sessionToken", "cookie");
      }

      localStorage.setItem("role", role);
      localStorage.setItem("fullname", fullname);

      const route = roleToRoute[role];
      if (route) navigate(route);
      else setError("Permissão inválida. Contate o suporte.");
    } catch (err) {
      console.error(err);
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", textAlign: "center" }}>
          <Typography variant="h5">Painel Princesa</Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 1 }}
          >
            <TextField
              fullWidth
              label="Usuário (E‑mail ou Matrícula)"
              {...register("username")}
              error={!!errors.username}
              helperText={errors.username?.message}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
