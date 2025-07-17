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

/* --------- ROLES DISPONÍVEIS ---------- */
const roleOptions = [
    { value: "admin", label: "Administrador" },
    { value: "abastecimento", label: "Abastecimento" },
    { value: "manutencao", label: "Manutenção" },
    { value: "portaria", label: "Portaria" },
    { value: "motorista", label: "Motorista" },
];

export default function UserManagement() {
    /* ---------- ESTADOS: CRIAÇÃO --------- */
    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState("");
    const [matricula, setMatricula] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");

    /* ---------- ESTADOS: LISTA ----------- */
    const [users, setUsers] = useState([]);

    /* ---------- BUSCA & FILTRO ----------- */
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("");

    /* ---------- MODAL CREDENCIAIS -------- */
    const [modalCredOpen, setModalCredOpen] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    /* ---------- MODAL EDIÇÃO ------------- */
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState("");
    const [editFullname, setEditFullname] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editMatricula, setEditMatricula] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState("");

    /* ---------- MODAL DESATIVAÇÃO -------- */
    const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState("");

    /* ---------- CARREGAR USUÁRIOS -------- */
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            // traz ativos + inativos
            const response = await api.get("/users?include_inactive=1");
            setUsers(response.data);
        } catch (err) {
            console.error("Erro ao listar usuários:", err);
            setError("Não foi possível listar usuários");
        }
    };

    /* ---------- CRIAR USUÁRIO ------------ */
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError("");

        if (!fullname || !password || !role) {
            setError("Preencha nome completo, senha e tipo de usuário.");
            return;
        }
        if (role === "admin" && !email) {
            setError("Para criar um Admin, informe o email.");
            return;
        }
        if (role !== "admin" && !matricula) {
            setError("Para criar usuários não-admin, informe a matrícula.");
            return;
        }

        try {
            const payload = { fullname, password, role };
            if (role === "admin") payload.email = email.trim().toLowerCase();
            else payload.matricula = matricula.trim();

            const { data: newUser } = await api.post("/users", payload);

            setCreatedUser({
                fullname: newUser.fullname,
                role: newUser.role,
                password,
                username: newUser.username,
            });
            setModalCredOpen(true);

            loadUsers();
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

    /* ---------- CÓPIA DE CREDENCIAIS ----- */
    const handleCopy = () => {
        if (!createdUser) return;
        const creds =
            `Nome: ${createdUser.fullname}
Usuário: ${createdUser.username}
Tipo: ${createdUser.role}
Senha: ${createdUser.password}`;
        navigator.clipboard.writeText(creds)
            .then(() => alert("Credenciais copiadas para a área de transferência!"));
    };

    /* ---------- ABERTURA/FECHO MODAIS ---- */
    const handleCloseCredModal = () => {
        setModalCredOpen(false);
        setCreatedUser(null);
    };

    const openEditModal = (user) => {
        setEditUserId(user.id);
        setEditFullname(user.fullname);
        setEditPassword("");
        setEditRole(user.role);

        if (user.role === "admin") {
            setEditEmail(user.username || "");
            setEditMatricula("");
        } else {
            setEditEmail("");
            setEditMatricula(user.username || "");
        }
        setModalEditOpen(true);
    };

    const closeEditModal = () => {
        setModalEditOpen(false);
        setEditUserId("");
        setEditFullname("");
        setEditEmail("");
        setEditMatricula("");
        setEditPassword("");
        setEditRole("");
    };

    const handleSaveEdit = async () => {
        if (!editUserId) return;
        if (editRole === "admin" && !editEmail) {
            alert("Admin precisa de e-mail");
            return;
        }
        if (editRole !== "admin" && !editMatricula) {
            alert("Usuário não-admin precisa de matrícula");
            return;
        }

        try {
            const payload = { fullname: editFullname, role: editRole };
            if (editPassword) payload.password = editPassword;
            if (editRole === "admin")
                payload.email = editEmail.trim().toLowerCase();
            else payload.matricula = editMatricula.trim();

            await api.put(`/users/${editUserId}`, payload);
            closeEditModal();
            loadUsers();
        } catch (err) {
            console.error("Erro ao editar usuário:", err);
            alert(err.response?.data?.error || "Erro ao editar usuário.");
        }
    };

    /* ---------- DESATIVAÇÃO -------------- */
    const openDeleteModal = (userId) => {
        setDeleteUserId(userId);
        setModalDeleteOpen(true);
    };
    const closeDeleteModal = () => {
        setDeleteUserId("");
        setModalDeleteOpen(false);
    };
    const handleConfirmDelete = async () => {
        if (!deleteUserId) return;
        try {
            await api.delete(`/users/${deleteUserId}`);
            closeDeleteModal();
            loadUsers();
        } catch (err) {
            console.error("Erro ao desativar usuário:", err);
            alert(err.response?.data?.error || "Erro ao desativar usuário.");
        }
    };

    /* ---------- REATIVAÇÃO --------------- */
    const handleReactivate = async (userId) => {
        try {
            await api.post(`/users/${userId}/restore`);
            loadUsers();
        } catch (err) {
            console.error("Erro ao reativar usuário:", err);
            alert(err.response?.data?.error || "Erro ao reativar usuário.");
        }
    };

    /* ---------- FILTRO & BUSCA ----------- */
    const lowerSearch = searchTerm.toLowerCase();
    const activeUsers = users.filter((u) => u.is_active);
    const inactiveUsers = users.filter((u) => !u.is_active);

    const filteredActive = activeUsers.filter((u) => {
        const nameMatch = u.fullname.toLowerCase().includes(lowerSearch);
        const idMatch = (u.username || "").toLowerCase().includes(lowerSearch);
        const roleMatch = filterRole ? u.role === filterRole : true;
        return (nameMatch || idMatch) && roleMatch;
    });

    const filteredInactive = inactiveUsers.filter((u) => {
        const nameMatch = u.fullname.toLowerCase().includes(lowerSearch);
        const idMatch = (u.username || "").toLowerCase().includes(lowerSearch);
        const roleMatch = filterRole ? u.role === filterRole : true;
        return (nameMatch || idMatch) && roleMatch;
    });

    /* ================ RENDER =============== */
    return (
        <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Gerenciamento de Usuários
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* -------- FORM: CRIAR USUÁRIO -------- */}
            <Box
                component="form"
                onSubmit={handleCreateUser}
                sx={{ p: 2, mb: 3, border: "1px solid #ccc", borderRadius: 2 }}
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

                <Button type="submit" variant="contained">
                    Criar Usuário
                </Button>
            </Box>

            {/* -------- BUSCA & FILTRO -------- */}
            <TextField
                label="Pesquisar usuário por nome ou usuário"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="filter-role-label">Filtrar por Tipo</InputLabel>
                <Select
                    labelId="filter-role-label"
                    label="Filtrar por Tipo"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    <MenuItem value="">Todos</MenuItem>
                    {roleOptions.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                            {r.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* -------- LISTA DE USUÁRIOS ATIVOS ------- */}
            <Typography variant="h6" sx={{ mb: 2 }}>
                Usuários Ativos
            </Typography>

            {filteredActive.map((u) => (
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
                        <Typography><strong>Nome:</strong> {u.fullname}</Typography>
                        <Typography><strong>Usuário:</strong> {u.username}</Typography>
                        <Typography><strong>Tipo:</strong> {u.role}</Typography>
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
                            Desativar
                        </Button>
                    </Box>
                </Paper>
            ))}

            {/* -------- LISTA DE USUÁRIOS DESATIVADOS ------- */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Usuários Desativados
            </Typography>

            {filteredInactive.length === 0 && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Nenhum usuário desativado.
                </Typography>
            )}

            {filteredInactive.map((u) => (
                <Paper
                    key={u.id}
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        mb: 1,
                        opacity: 0.75,
                        bgcolor: "#f8d7da22",
                    }}
                >
                    <Box>
                        <Typography><strong>Nome:</strong> {u.fullname}</Typography>
                        <Typography><strong>Usuário:</strong> {u.username}</Typography>
                        <Typography><strong>Tipo:</strong> {u.role}</Typography>
                        <Typography color="error.main" variant="body2">(Desativado)</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleReactivate(u.id)}
                        >
                            Reativar
                        </Button>
                        <Button variant="outlined" onClick={() => openEditModal(u)}>
                            Editar
                        </Button>
                    </Box>
                </Paper>
            ))}

            {/* -------- MODAL CREDENCIAIS ------- */}
            <Dialog open={modalCredOpen} onClose={handleCloseCredModal}>
                <DialogTitle sx={{ bgcolor: "primary.main", color: "#fff" }}>
                    Credenciais do Usuário
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: "#f0f4ff" }}>
                    {createdUser && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Nome:</strong> {createdUser.fullname}</Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Usuário:</strong> {createdUser.username}</Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Tipo de Usuário:</strong> {createdUser.role}</Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Senha:</strong> {createdUser.password}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Copie e entregue ao usuário. Ele poderá alterar a senha depois.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ bgcolor: "#f0f4ff" }}>
                    <Button onClick={handleCopy} variant="contained">Copiar Credenciais</Button>
                    <Button onClick={handleCloseCredModal}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* -------- MODAL EDIÇÃO ----------- */}
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
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditModal}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveEdit}>Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* -------- MODAL DESATIVAÇÃO --------- */}
            <Dialog open={modalDeleteOpen} onClose={closeDeleteModal}>
                <DialogTitle>Desativar Usuário</DialogTitle>
                <DialogContent dividers>
                    <Typography>Tem certeza que deseja desativar este usuário?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteModal}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmDelete}>
                        Desativar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
