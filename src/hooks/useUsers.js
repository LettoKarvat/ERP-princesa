import { useState, useCallback, useEffect } from 'react';
import api from '../services/apiFlask';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users?include_inactive=1');
      setUsers(response.data);
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      setError('Não foi possível listar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    try {
      const { data: newUser } = await api.post('/users', payload);
      await loadUsers();
      return {
        fullname: newUser.fullname,
        role: newUser.role,
        password: payload.password,
        username: newUser.username,
      };
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      const errorMessage = err.response?.data?.error || 'Erro na criação do usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (id, payload) => {
    setLoading(true);
    setError('');
    try {
      await api.put(`/users/${id}`, payload);
      await loadUsers();
    } catch (err) {
      console.error('Erro ao editar usuário:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao editar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const deleteUser = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/users/${id}`);
      await loadUsers();
    } catch (err) {
      console.error('Erro ao desativar usuário:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao desativar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const reactivateUser = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/users/${id}/restore`);
      await loadUsers();
    } catch (err) {
      console.error('Erro ao reativar usuário:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao reativar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    reactivateUser,
    loadUsers,
    clearError,
  };
};