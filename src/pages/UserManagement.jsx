// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
} from "@mui/material";
import api from "../services/apiFlask"; // Axios configurado para o Flask

// Lista de roles disponíveis
const roleOptions = [
    { value: "admin", label: "Administrador" },
    { value: "abastecimento", label: "Abastecimento" },
    { value: "manutencao", label: "Manutenção" },
    { value: "portaria", label: "Portaria" },
    { value: "motorista", label: "Motorista" },
];

export default function UserManagement() {
    // ---------------------------
    // ESTADOS PARA CRIAR USUÁRIO
    // ---------------------------
    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState(""); // usado quando role = admin
    const [matricula, setMatricula] = useState(""); // usado quando role != admin
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");

    // ---------------------------
    // LISTA DE USUÁRIOS
    // ---------------------------
    const [users, setUsers] = useState([]);

    // ---------------------------
    // CAMPO DE BUSCA
    // ---------------------------
    const [searchTerm, setSearchTerm] = useState("");

    // ---------------------------
    // MODAL DE CREDENCIAIS (PÓS-CRIAÇÃO)
    // ---------------------------
    const [modalCredOpen, setModalCredOpen] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    // ---------------------------
    // MODAL DE EDIÇÃO
    // ---------------------------
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState("");
    const [editFullname, setEditFullname] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editMatricula, setEditMatricula] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState("");

    // ---------------------------
    // MODAL DE EXCLUSÃO
    // ---------------------------
    const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState("");

    // Carrega usuários ao montar
    useEffect(() => {
        loadUsers();
    }, []);

    // ---------------------------
    // CARREGAR LISTA DE USUÁRIOS
    // ---------------------------
    const loadUsers = async () => {
        try {
            // Chama GET /users no Flask (retorna só is_active=true)
            const response = await api.get("/users");
            setUsers(response.data);
        } catch (err) {
            console.error("Erro ao listar usuários:", err);
            setError("Não foi possível listar usuários");
        }
    };

    // ---------------------------
    // CRIAR NOVO USUÁRIO
    // ---------------------------
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError("");

        // Verificação básica
        if (!fullname || !password || !role) {
            setError("Preencha nome completo, senha e tipo de usuário.");
            return;
        }

        // Se for admin, exigimos email. Se não for, exigimos matrícula
        if (role === "admin" && !email) {
            setError("Para criar um Admin, informe o email.");
            return;
        } else if (role !== "admin" && !matricula) {
            setError("Para criar usuários não-admin, informe a matrícula.");
            return;
        }

        try {
            // Monta o payload conforme a role
            const payload = {
                fullname,
                password,
                role,
            };

            if (role === "admin") {
                payload.email = email.trim().toLowerCase();
            } else {
                payload.matricula = matricula.trim();
            }

            // Chama POST /users para criar usuário no Flask
            const response = await api.post("/users", payload);

            // Supondo que o Flask retorne o objeto criado em { id, fullname, role, username }
            const newUser = response.data;
            const created = {
                fullname: newUser.fullname,
                role: newUser.role,
                password,
                username: newUser.username,
            };

            setCreatedUser(created);
            setModalCredOpen(true);

            // Recarrega a lista de usuários
            loadUsers();

            // Limpa os campos
            setFullname("");
            setEmail("");
            setMatricula("");
            setPassword("");
            setRole("");
        } catch (err) {
            console.error("Erro ao criar usuário:", err);
            setError(err.response?.data?.error || "Erro na criação do usuário");
        }
    };

    // ---------------------------
    // COPIAR CREDENCIAIS
    // ---------------------------
    const handleCopy = () => {
        if (createdUser) {
            const creds =
                `Nome: ${createdUser.fullname}\n` +
                `Usuário: ${createdUser.username}\n` +
                `Tipo: ${createdUser.role}\n` +
                `Senha: ${createdUser.password}`;
            navigator.clipboard.writeText(creds).then(() => {
                alert("Credenciais copiadas para a área de transferência!");
            });
        }
    };

    // ---------------------------
    // FECHAR MODAL DE CREDENCIAIS
    // ---------------------------
    const handleCloseCredModal = () => {
        setModalCredOpen(false);
        setCreatedUser(null);
    };

    // ---------------------------
    // ABRIR MODAL DE EDIÇÃO
    // ---------------------------
    const openEditModal = (user) => {
        setEditUserId(user.id);
        setEditFullname(user.fullname);
        setEditPassword(""); // começa vazio, se não quiser alterar
        setEditRole(user.role);

        // Se for admin, usamos .username (que é o e-mail); se não for, também `username`
        if (user.role === "admin") {
            setEditEmail(user.username || "");
            setEditMatricula("");
        } else {
            setEditEmail("");
            setEditMatricula(user.username || "");
        }

        setModalEditOpen(true);
    };

    // ---------------------------
    // FECHAR MODAL DE EDIÇÃO
    // ---------------------------
    const closeEditModal = () => {
        setModalEditOpen(false);
        setEditUserId("");
        setEditFullname("");
        setEditEmail("");
        setEditMatricula("");
        setEditPassword("");
        setEditRole("");
    };

    // ---------------------------
    // SALVAR EDIÇÃO
    // ---------------------------
    const handleSaveEdit = async () => {
        if (!editUserId) return;

        // Se for admin, precisamos de e-mail; se não for admin, precisamos de matrícula
        if (editRole === "admin" && !editEmail) {
            alert("Admin precisa de e-mail");
            return;
        }
        if (editRole !== "admin" && !editMatricula) {
            alert("Usuário não-admin precisa de matrícula");
            return;
        }

        try {
            // Monta o payload
            const payload = {
                fullname: editFullname,
                role: editRole,
            };

            if (editPassword) {
                payload.password = editPassword;
            }

            if (editRole === "admin") {
                payload.email = editEmail.trim().toLowerCase();
            } else {
                payload.matricula = editMatricula.trim();
            }

            // Chama PUT /users/:id para atualizar usuário no Flask
            await api.put(`/users/${editUserId}`, payload);

            closeEditModal();
            loadUsers();
        } catch (err) {
            console.error("Erro ao editar usuário:", err);
            alert(err.response?.data?.error || "Erro ao editar usuário.");
        }
    };

    // ---------------------------
    // ABRIR MODAL DE EXCLUSÃO
    // ---------------------------
    const openDeleteModal = (userId) => {
        setDeleteUserId(userId);
        setModalDeleteOpen(true);
    };

    // ---------------------------
    // FECHAR MODAL DE EXCLUSÃO
    // ---------------------------
    const closeDeleteModal = () => {
        setDeleteUserId("");
        setModalDeleteOpen(false);
    };

    // ---------------------------
    // CONFIRMAR EXCLUSÃO (SOFT DELETE)
    // ---------------------------
    const handleConfirmDelete = async () => {
        if (!deleteUserId) return;
        try {
            // Chama DELETE /users/:id no Flask
            await api.delete(`/users/${deleteUserId}`);
            closeDeleteModal();
            loadUsers();
        } catch (err) {
            console.error("Erro ao excluir usuário:", err);
            alert(err.response?.data?.error || "Erro ao excluir usuário.");
        }
    };

    // ---------------------------
    // FILTRO DE USUÁRIOS ATIVOS E BUSCA
    // ---------------------------
    const activeUsers = users.filter((u) => u.is_active);
    const filteredUsers = activeUsers.filter((u) => {
        const identifierValue = u.username || "";
        const lowerSearch = searchTerm.toLowerCase();
        const matchesFullname = u.fullname.toLowerCase().includes(lowerSearch);
        const matchesIdentifier = identifierValue.toLowerCase().includes(lowerSearch);
        return matchesFullname || matchesIdentifier;
    });

    // ======================
    // RENDER
    // ======================
    return (
        <Box sx={{ maxWidth: 900, margin: "0 auto", mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Gerenciamento de Usuários
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* FORM DE CRIAR NOVO USUÁRIO */}
            <Box
                component="form"
                onSubmit={handleCreateUser}
                sx={{
                    p: 2,
                    mb: 3,
                    border: "1px solid #ccc",
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Criar Novo Usuário
                </Typography>

                <TextField
                    label="Nome Completo"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                />

                {/* Se role=admin => pede email; senão => pede matrícula */}
                {role === "admin" ? (
                    <TextField
                        label="Email"
                        type="email"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                ) : (
                    <TextField
                        label="Matrícula"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                    />
                )}

                <TextField
                    label="Senha"
                    type="password"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="role-label">Tipo de Usuário</InputLabel>
                    <Select
                        labelId="role-label"
                        label="Tipo de Usuário"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <MenuItem value="">Selecione...</MenuItem>
                        {roleOptions.map((r) => (
                            <MenuItem key={r.value} value={r.value}>
                                {r.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button type="submit" variant="contained" color="primary">
                    Criar Usuário
                </Button>
            </Box>

            {/* CAMPO DE BUSCA */}
            <TextField
                label="Pesquisar usuário por nome ou usuário"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* LISTA DE USUÁRIOS */}
            <Typography variant="h6" sx={{ mb: 2 }}>
                Usuários Ativos
            </Typography>

            {filteredUsers.map((u) => (
                <Paper
                    key={u.id}
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        mb: 1,
                    }}
                >
                    <Box>
                        <Typography>
                            <strong>Nome:</strong> {u.fullname}
                        </Typography>
                        <Typography>
                            <strong>Usuário:</strong> {u.username}
                        </Typography>
                        <Typography>
                            <strong>Tipo:</strong> {u.role}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button variant="outlined" onClick={() => openEditModal(u)}>
                            Editar
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => openDeleteModal(u.id)}
                        >
                            Excluir
                        </Button>
                    </Box>
                </Paper>
            ))}

            {/* MODAL DE CREDENCIAIS (criação) */}
            <Dialog open={modalCredOpen} onClose={handleCloseCredModal}>
                <DialogTitle sx={{ bgcolor: "#1976d2", color: "#fff" }}>
                    Credenciais do Usuário
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: "#f0f4ff" }}>
                    {createdUser && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                <strong>Nome:</strong> {createdUser.fullname}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                <strong>Usuário:</strong> {createdUser.username}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                <strong>Tipo de Usuário:</strong> {createdUser.role}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                <strong>Senha:</strong> {createdUser.password}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Copie e entregue ao usuário. Ele poderá alterar a senha depois.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ bgcolor: "#f0f4ff" }}>
                    <Button onClick={handleCopy} variant="contained" sx={{ bgcolor: "#1976d2" }}>
                        Copiar Credenciais
                    </Button>
                    <Button onClick={handleCloseCredModal}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE EDIÇÃO */}
            <Dialog open={modalEditOpen} onClose={closeEditModal}>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Nome Completo"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={editFullname}
                        onChange={(e) => setEditFullname(e.target.value)}
                    />

                    {/* Se editRole=admin => Email, senão => Matrícula */}
                    {editRole === "admin" ? (
                        <TextField
                            label="Email"
                            type="email"
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 2 }}
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                        />
                    ) : (
                        <TextField
                            label="Matrícula"
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 2 }}
                            value={editMatricula}
                            onChange={(e) => setEditMatricula(e.target.value)}
                        />
                    )}

                    <TextField
                        label="Nova Senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        helperText="Deixe em branco se não quiser alterar a senha."
                    />

                    <FormControl fullWidth>
                        <InputLabel id="edit-role-label">Tipo de Usuário</InputLabel>
                        <Select
                            labelId="edit-role-label"
                            label="Tipo de Usuário"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                        >
                            {roleOptions.map((r) => (
                                <MenuItem key={r.value} value={r.value}>
                                    {r.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditModal}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveEdit}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE EXCLUSÃO */}
            <Dialog open={modalDeleteOpen} onClose={closeDeleteModal}>
                <DialogTitle>Excluir Usuário</DialogTitle>
                <DialogContent dividers>
                    <Typography>Tem certeza que deseja excluir este usuário?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteModal}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmDelete}>
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
