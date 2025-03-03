import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import api from '../services/api';

// Lista de roles disponíveis
const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'abastecimento', label: 'Abastecimento' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'portaria', label: 'Portaria' },
    { value: 'motorista', label: 'Motorista' },
];

function UserManagement() {
    // ----- ESTADOS PARA CRIAR USUÁRIO -----
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');

    // ----- LISTA DE USUÁRIOS -----
    const [users, setUsers] = useState([]);

    // ----- MODAL DE CREDENCIAIS (APÓS CRIAR) -----
    const [modalCredOpen, setModalCredOpen] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    // ----- MODAL DE EDIÇÃO -----
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState('');
    const [editFullname, setEditFullname] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('');

    // ----- MODAL DE EXCLUSÃO -----
    const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState('');

    // Carrega usuários ao montar
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.post(
                '/functions/listUsers',
                {},
                {
                    headers: {
                        'X-Parse-Session-Token': localStorage.getItem('sessionToken'),
                    },
                }
            );
            if (response.data.result) {
                setUsers(response.data.result);
            }
        } catch (err) {
            console.error('Erro ao listar usuários:', err);
            setError('Não foi possível listar usuários');
        }
    };

    // Criar novo usuário
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');

        if (!fullname || !email || !password || !role) {
            setError('Preencha todos os campos!');
            return;
        }

        try {
            // Chama a Cloud Function "signup"
            const response = await api.post('/functions/signup', {
                fullname,
                email,
                password,
                role,
            });

            if (response.data.result && response.data.result.user) {
                // Salva as credenciais e exibe no modal
                setCreatedUser({
                    fullname,
                    email,
                    role,
                    password,
                });
                setModalCredOpen(true);

                // Recarrega a lista de usuários
                loadUsers();

                // Limpa os campos
                setFullname('');
                setEmail('');
                setPassword('');
                setRole('');
            } else {
                throw new Error('Erro ao criar usuário (sem detalhes).');
            }
        } catch (err) {
            console.error('Erro ao criar usuário:', err);
            setError(err.message || 'Erro na criação do usuário');
        }
    };

    // Copiar credenciais
    const handleCopy = () => {
        if (createdUser) {
            const creds = `Nome: ${createdUser.fullname}\nEmail: ${createdUser.email}\nTipo: ${createdUser.role}\nSenha: ${createdUser.password}`;
            navigator.clipboard.writeText(creds).then(() => {
                alert('Credenciais copiadas para a área de transferência!');
            });
        }
    };

    const handleCloseCredModal = () => {
        setModalCredOpen(false);
        setCreatedUser(null);
    };

    // ----- ABRIR MODAL DE EDIÇÃO -----
    const openEditModal = (user) => {
        setEditUserId(user.objectId);
        setEditFullname(user.fullname);
        setEditEmail(user.email);
        setEditPassword(''); // começa vazio, se o admin não quiser mudar a senha
        setEditRole(user.role);
        setModalEditOpen(true);
    };

    const closeEditModal = () => {
        setModalEditOpen(false);
        setEditUserId('');
        setEditFullname('');
        setEditEmail('');
        setEditPassword('');
        setEditRole('');
    };

    // ----- SALVAR EDIÇÃO -----
    const handleSaveEdit = async () => {
        if (!editUserId) return;
        try {
            // Chamamos updateUser, podendo passar email e password também
            await api.post(
                '/functions/updateUser',
                {
                    userId: editUserId,
                    fullname: editFullname,
                    email: editEmail,       // <-- Novo
                    password: editPassword, // <-- Novo
                    role: editRole,
                },
                {
                    headers: {
                        'X-Parse-Session-Token': localStorage.getItem('sessionToken'),
                    },
                }
            );
            closeEditModal();
            loadUsers();
        } catch (err) {
            console.error('Erro ao editar user:', err);
            alert('Erro ao editar usuário.');
        }
    };

    // ----- ABRIR MODAL DE EXCLUSÃO -----
    const openDeleteModal = (userId) => {
        setDeleteUserId(userId);
        setModalDeleteOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteUserId('');
        setModalDeleteOpen(false);
    };

    // ----- CONFIRMAR EXCLUSÃO -----
    const handleConfirmDelete = async () => {
        if (!deleteUserId) return;
        try {
            await api.post(
                '/functions/softDeleteUser',
                { userId: deleteUserId },
                {
                    headers: {
                        'X-Parse-Session-Token': localStorage.getItem('sessionToken'),
                    },
                }
            );
            closeDeleteModal();
            loadUsers();
        } catch (err) {
            console.error('Erro ao excluir user:', err);
            alert('Erro ao excluir usuário.');
        }
    };

    return (
        <Box sx={{ maxWidth: 900, margin: '0 auto', mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Gerenciamento de Usuários
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Formulário de criar novo usuário */}
            <Box
                component="form"
                onSubmit={handleCreateUser}
                sx={{
                    p: 2,
                    mb: 3,
                    border: '1px solid #ccc',
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
                <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
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

            {/* Lista de usuários existentes */}
            <Typography variant="h6" sx={{ mb: 2 }}>
                Usuários Cadastrados
            </Typography>

            {users.map((u) => (
                <Paper
                    key={u.objectId}
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 1,
                    }}
                >
                    <Box>
                        <Typography>
                            <strong>Nome:</strong> {u.fullname}
                        </Typography>
                        <Typography>
                            <strong>Email:</strong> {u.email}
                        </Typography>
                        <Typography>
                            <strong>Tipo:</strong> {u.role}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => openEditModal(u)}
                        >
                            Editar
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => openDeleteModal(u.objectId)}
                        >
                            Excluir
                        </Button>
                    </Box>
                </Paper>
            ))}

            {/* MODAL DE CREDENCIAIS (com mais cor e destaque) */}
            <Dialog open={modalCredOpen} onClose={handleCloseCredModal}>
                <DialogTitle sx={{ bgcolor: '#1976d2', color: '#fff' }}>
                    Credenciais do Usuário
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: '#f0f4ff' }}>
                    {createdUser && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                <strong>Nome:</strong> {createdUser.fullname}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                <strong>Email:</strong> {createdUser.email}
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
                <DialogActions sx={{ bgcolor: '#f0f4ff' }}>
                    <Button
                        onClick={handleCopy}
                        variant="contained"
                        sx={{ bgcolor: '#1976d2' }}
                    >
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
                    <TextField
                        label="Email"
                        type="email"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                    />
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
                    <Typography>
                        Tem certeza que deseja excluir (soft-delete) este usuário?
                    </Typography>
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

export default UserManagement;
