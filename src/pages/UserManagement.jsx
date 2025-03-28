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
    // ---------------------------
    // ESTADOS PARA CRIAR USUÁRIO
    // ---------------------------
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');       // usado quando role = admin
    const [matricula, setMatricula] = useState(''); // usado quando role != admin
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');

    // ---------------------------
    // LISTA DE USUÁRIOS
    // ---------------------------
    const [users, setUsers] = useState([]);

    // ---------------------------
    // CAMPO DE BUSCA
    // ---------------------------
    const [searchTerm, setSearchTerm] = useState('');

    // ---------------------------
    // MODAL DE CREDENCIAIS (PÓS-CRIAÇÃO)
    // ---------------------------
    const [modalCredOpen, setModalCredOpen] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    // ---------------------------
    // MODAL DE EDIÇÃO
    // ---------------------------
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState('');
    const [editFullname, setEditFullname] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editMatricula, setEditMatricula] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('');

    // ---------------------------
    // MODAL DE EXCLUSÃO
    // ---------------------------
    const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState('');

    // Carrega usuários ao montar
    useEffect(() => {
        loadUsers();
    }, []);

    // ---------------------------
    // CARREGAR LISTA DE USUÁRIOS
    // ---------------------------
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

    // ---------------------------
    // CRIAR NOVO USUÁRIO
    // ---------------------------
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');

        // Verificação básica
        if (!fullname || !password || !role) {
            setError('Preencha nome completo, senha e tipo de usuário.');
            return;
        }

        // Se for admin, exigimos email. Se não for, exigimos matrícula
        if (role === 'admin' && !email) {
            setError('Para criar um Admin, informe o email.');
            return;
        } else if (role !== 'admin' && !matricula) {
            setError('Para criar usuários não-admin, informe a matrícula.');
            return;
        }

        try {
            // Monta o payload conforme a role
            const payload = {
                fullname,
                password,
                role,
            };

            if (role === 'admin') {
                payload.email = email;
            } else {
                payload.matricula = matricula;
            }

            // Chama a Cloud Function "signup"
            const response = await api.post('/functions/signup', payload);

            if (response.data.result && response.data.result.user) {
                // Salva as credenciais e exibe no modal
                const created = {
                    fullname,
                    role,
                    password,
                };

                // username = email (admin) ou matricula (não-admin)
                if (role === 'admin') {
                    created.username = email;
                } else {
                    created.username = matricula;
                }

                setCreatedUser(created);
                setModalCredOpen(true);

                // Recarrega a lista de usuários
                loadUsers();

                // Limpa os campos
                setFullname('');
                setEmail('');
                setMatricula('');
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

    // ---------------------------
    // COPIAR CREDENCIAIS
    // ---------------------------
    const handleCopy = () => {
        if (createdUser) {
            const creds = `Nome: ${createdUser.fullname}\n` +
                `Usuário (Email/Matrícula): ${createdUser.username}\n` +
                `Tipo: ${createdUser.role}\n` +
                `Senha: ${createdUser.password}`;
            navigator.clipboard.writeText(creds).then(() => {
                alert('Credenciais copiadas para a área de transferência!');
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
        setEditUserId(user.objectId);
        setEditFullname(user.fullname);
        setEditPassword(''); // começa vazio, se não quiser alterar
        setEditRole(user.role);

        // Se for admin, usamos .email; se não for, usamos .matricula
        if (user.role === 'admin') {
            setEditEmail(user.email || '');
            setEditMatricula('');
        } else {
            setEditEmail('');
            setEditMatricula(user.matricula || '');
        }

        setModalEditOpen(true);
    };

    // ---------------------------
    // FECHAR MODAL DE EDIÇÃO
    // ---------------------------
    const closeEditModal = () => {
        setModalEditOpen(false);
        setEditUserId('');
        setEditFullname('');
        setEditEmail('');
        setEditMatricula('');
        setEditPassword('');
        setEditRole('');
    };

    // ---------------------------
    // SALVAR EDIÇÃO
    // ---------------------------
    const handleSaveEdit = async () => {
        if (!editUserId) return;

        // Se for admin, precisamos de email; se não for admin, precisamos de matrícula
        if (editRole === 'admin' && !editEmail) {
            alert('Admin precisa de email');
            return;
        }
        if (editRole !== 'admin' && !editMatricula) {
            alert('Usuário não-admin precisa de matrícula');
            return;
        }

        try {
            // Monta o payload
            const payload = {
                userId: editUserId,
                fullname: editFullname,
                role: editRole,
                password: editPassword, // Se vazio, o back-end ignora
            };

            if (editRole === 'admin') {
                payload.email = editEmail;
            } else {
                payload.matricula = editMatricula;
            }

            await api.post('/functions/updateUser', payload, {
                headers: {
                    'X-Parse-Session-Token': localStorage.getItem('sessionToken'),
                },
            });
            closeEditModal();
            loadUsers();
        } catch (err) {
            console.error('Erro ao editar user:', err);
            alert('Erro ao editar usuário.');
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
        setDeleteUserId('');
        setModalDeleteOpen(false);
    };

    // ---------------------------
    // CONFIRMAR EXCLUSÃO (SOFT DELETE)
    // ---------------------------
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

    // ---------------------------
    // FILTRO DE BUSCA
    // ---------------------------
    const filteredUsers = users.filter((u) => {
        // Se for admin, usamos `email` como identificador;
        // senão, usamos `matricula`.
        const isAdmin = u.role === 'admin';
        const identifierValue = isAdmin ? u.email : u.matricula;

        // Verifica se o nome, matrícula ou email correspondem ao searchTerm (ignora caixa alta/baixa)
        const lowerSearch = searchTerm.toLowerCase();
        const matchesFullname = u.fullname?.toLowerCase().includes(lowerSearch);
        const matchesIdentifier = identifierValue?.toLowerCase().includes(lowerSearch);

        return matchesFullname || matchesIdentifier;
    });

    // ======================
    // RENDER
    // ======================
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

            {/* FORM DE CRIAR NOVO USUÁRIO */}
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

                {/* Se role=admin => pede email; senão => pede matrícula */}
                {role === 'admin' ? (
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
                label="Pesquisar usuário por nome, matrícula ou email"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* LISTA DE USUÁRIOS */}
            <Typography variant="h6" sx={{ mb: 2 }}>
                Usuários Cadastrados
            </Typography>

            {filteredUsers.map((u) => {
                // Se for admin => 'Email', senão => 'Matrícula'
                const isAdmin = u.role === 'admin';
                const identifierLabel = isAdmin ? 'Email' : 'Matrícula';
                const identifierValue = isAdmin ? u.email : u.matricula;

                return (
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
                                <strong>{identifierLabel}:</strong> {identifierValue || '—'}
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
                );
            })}

            {/* MODAL DE CREDENCIAIS (criação) */}
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
                                <strong>Usuário (Email/Matrícula):</strong> {createdUser.username}
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

                    {/* Se editRole=admin => Email, senão => Matrícula */}
                    {editRole === 'admin' ? (
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
                    <Typography>
                        Tem certeza que deseja excluir este usuário?
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
