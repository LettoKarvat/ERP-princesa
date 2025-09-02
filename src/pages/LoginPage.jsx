import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container, Box, TextField, Button,
  Typography, Alert, Paper,
} from "@mui/material";
import api from "../services/apiFlask";

/* validação */
const schema = yup.object({
  username: yup.string().required("Informe seu usuário"),
  password: yup.string().required("Senha é obrigatória"),
});

/* rota inicial conforme papel */
const roleToRoute = {
  admin: "/dashboard",
  abastecimento: "/refueling",
  manutencao: "/parts-replacement/maintenance",
  motorista: "/driver-checklists",
  portaria: "/portaria/saida",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  /* ───────── submit ───────── */
  const onSubmit = async ({ username, password }) => {
    setError("");
    try {
      const res = await api.post("/auth/login", {
        username: username.trim().toLowerCase(),
        password: password.trim(),
      });

      /* back responde: { access_token, user:{ id, fullname, role } } */
      const { access_token, user } = res.data;

      /* grava token e dados */
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("fullname", user.fullname);

      navigate(roleToRoute[user.role] || "/");
    } catch (err) {
      console.error(err);
      setError("Usuário ou senha inválidos.");
    }
  };

  /* ───────── UI ───────── */
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

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Usuário"
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
