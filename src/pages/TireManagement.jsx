import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, TextField, Tabs, Tab, Paper, styled,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, MenuItem
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import api from '../services/api';
import VehicleTireManagement from './VehicleTireManagement';

/* card de pneu */
const TireCard = styled(Paper)(({ theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
}));

export default function TireManagement() {
  const [viewMode, setViewMode] = useState('stock');
  const [stockTires, setStockTires] = useState([]);
  const [recapTires, setRecapTires] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [recapSearch, setRecapSearch] = useState('');

  const [openAdd, setOpenAdd] = useState(false);
  const [addErr, setAddErr] = useState('');
  const [newTire, setNewTire] = useState({
    empresa: '', codigo: '', filial: '', departamento: '',
    numeroSerie: '', dot: '', vencimento: '', vidaAtual: '',
    modelo: '', chipInstalado: 'Não', nroChip: '',
    desenhoOriginal: '', desenhoAtual: '', fabricante: '',
    nrSulcos: '', nrLonas: '', dimensao: '',
    librasInicial: '', librasFinal: '',
    hod: Array(7).fill({ previsto: '', implantacao: '', realizado: '' }),
    hori: Array(7).fill({ previsto: '', implantacao: '', realizado: '' }),
  });

  const [openDet, setOpenDet] = useState(false);
  const [selTire, setSelTire] = useState(null);
  const [edit, setEdit] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editT, setEditT] = useState({});

  const tokenHdr = { headers: { 'X-Parse-Session-Token': localStorage.getItem('sessionToken') } };

  /* carregar pneus */
  const loadTires = async () => {
    try {
      const { data } = await api.post('/functions/getAllPneus', {}, tokenHdr);
      const list = data?.result ?? [];
      setStockTires(list.filter(p => (p.status || '').toLowerCase() === 'em estoque'));
      setRecapTires(list.filter(p => (p.status || '').toLowerCase() === 'em recapagem'));
    } catch (e) { console.error(e); }
  };
  useEffect(() => { loadTires(); }, [viewMode]);

  const filtra = (arr, t) =>
    arr.filter(x =>
      ['numeroSerie', 'fabricante', 'modelo', 'dimensao']
        .some(k => x[k]?.toLowerCase().includes(t.toLowerCase()))
    );

  /* add */
  const handleAdd = async () => {
    if (!newTire.numeroSerie.trim()) return setAddErr('Número de série obrigatório.');
    try {
      await api.post('/functions/criarPneu',
        {
          ...newTire,
          status: 'Em estoque',
          kmInicial: +newTire.librasInicial,
          kmFinal: +newTire.librasFinal,
          vida: +newTire.vidaAtual
        }, tokenHdr);
      setOpenAdd(false);
      loadTires();
    } catch (e) { console.error(e); }
  };

  /* detalhes */
  const openDetails = t => {
    setSelTire(t);
    setEditT({ ...t });
    setEdit(false);
    setEditErr('');
    setOpenDet(true);
  };
  const saveEdit = async () => {
    try {
      await api.post('/functions/editarPneu',
        { ...editT }, tokenHdr);
      setOpenDet(false);
      loadTires();
    } catch (e) { setEditErr('Falha ao salvar.'); }
  };
  const delTire = async () => {
    try {
      await api.post('/functions/softDeletePneu', { objectId: selTire.objectId }, tokenHdr);
      setOpenDet(false);
      loadTires();
    } catch (e) { setEditErr('Falha ao excluir.'); }
  };

  /* handlers genéricos */
  const change = key => e => setNewTire(n => ({ ...n, [key]: e.target.value }));
  const changeEdit = key => e => setEditT(n => ({ ...n, [key]: e.target.value }));

  /* marcadores */
  const changeMarker = (type, i, field) => e => {
    const arr = [...newTire[type]];
    arr[i] = { ...arr[i], [field]: e.target.value };
    setNewTire(n => ({ ...n, [type]: arr }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestão de Pneus</Typography>
      <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ mb: 2 }}>
        <Tab label="Pneus em Estoque" value="stock" />
        <Tab label="Recapadora" value="recapadora" />
        <Tab label="Gerenciar Veículos" value="vehicle" />
      </Tabs>

      {viewMode === 'stock' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField size="small" sx={{ width: 300 }} label="Buscar Pneus"
              value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
            <Button variant="contained" onClick={() => setOpenAdd(true)}>Cadastrar Pneu</Button>
          </Box>
          {filtra(stockTires, stockSearch).length === 0
            ? <Typography>Nenhum pneu em estoque.</Typography>
            : <Grid container spacing={2}>
              {filtra(stockTires, stockSearch).map(t => (
                <Grid item xs={6} sm={4} md={3} key={t.objectId}>
                  <TireCard onClick={() => openDetails(t)}>
                    <MdOutlineTireRepair size={50} style={{ marginBottom: 8 }} />
                    <Typography>N°: {t.numeroSerie}</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>{t.fabricante} - {t.modelo}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'gray' }}>Recap: {t.recapCount || 0}</Typography>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          }
        </Box>
      )}

      {viewMode === 'recapadora' && (
        <Box>
          <TextField size="small" sx={{ width: 300, mb: 2 }} label="Buscar Pneus"
            value={recapSearch} onChange={e => setRecapSearch(e.target.value)} />
          {filtra(recapTires, recapSearch).length === 0
            ? <Typography>Nenhum pneu em recapagem.</Typography>
            : <Grid container spacing={2}>
              {filtra(recapTires, recapSearch).map(t => (
                <Grid item xs={6} sm={4} md={3} key={t.objectId}>
                  <TireCard onClick={() => openDetails(t)}>
                    <MdOutlineTireRepair size={50} style={{ marginBottom: 8 }} />
                    <Typography>N°: {t.numeroSerie}</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>Vida: {t.vida}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'gray' }}>Recap: {t.recapCount || 0}</Typography>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          }
        </Box>
      )}

      {viewMode === 'vehicle' && <VehicleTireManagement />}

      {/* Modal Cadastrar */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar Pneu</DialogTitle>
        <DialogContent dividers>
          {addErr && <Alert severity="error" sx={{ mb: 2 }}>{addErr}</Alert>}

          {/* cabeçalho */}
          <Grid container spacing={2} mb={2}>
            {['empresa', 'codigo', 'filial', 'departamento'].map(key => (
              <Grid item xs={3} key={key}>
                <TextField
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  size="small" fullWidth
                  value={newTire[key]} onChange={change(key)}
                />
              </Grid>
            ))}
          </Grid>

          {/* principais */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={3}>
              <TextField
                label="Nº de Série" size="small" fullWidth
                value={newTire.numeroSerie} onChange={change('numeroSerie')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="DOT" size="small" fullWidth
                value={newTire.dot} onChange={change('dot')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Vencimento" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTire.vencimento} onChange={change('vencimento')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Vida Atual" size="small" fullWidth
                value={newTire.vidaAtual} onChange={change('vidaAtual')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Modelo" size="small" fullWidth
                value={newTire.modelo} onChange={change('modelo')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="CHIP instalado?" size="small" fullWidth select
                value={newTire.chipInstalado} onChange={change('chipInstalado')}
              >
                <MenuItem value="Sim">Sim</MenuItem>
                <MenuItem value="Não">Não</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Nº CHIP" size="small" fullWidth
                value={newTire.nroChip} onChange={change('nroChip')}
              />
            </Grid>
          </Grid>

          {/* características */}
          <Grid container spacing={2} mb={2}>
            {[
              ['Desenho Original', 'desenhoOriginal'],
              ['Desenho Atual', 'desenhoAtual'],
              ['Fabricante', 'fabricante'],
              ['N° Sulcos', 'nrSulcos'],
              ['N° Lonas', 'nrLonas'],
              ['Dimensão', 'dimensao'],
              ['Libras Inicial', 'librasInicial'],
              ['Libras Final', 'librasFinal'],
            ].map(([label, key]) => (
              <Grid item xs={3} key={key}>
                <TextField
                  label={label} size="small" fullWidth
                  value={newTire[key]} onChange={change(key)}
                />
              </Grid>
            ))}
          </Grid>

          {/* marcadores */}
          {['hod', 'hori'].map(type => (
            <Box key={type} mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                {type === 'hod' ? 'Hodômetro' : 'Horímetro'}
              </Typography>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={2}><Typography>Vida</Typography></Grid>
                <Grid item xs={3}><Typography>Previsto</Typography></Grid>
                <Grid item xs={3}><Typography>Implantação</Typography></Grid>
                <Grid item xs={3}><Typography>Realizado</Typography></Grid>
                {newTire[type].map((m, i) => (
                  <React.Fragment key={i}>
                    <Grid item xs={2}><Typography>{i + 1}ª</Typography></Grid>
                    {['previsto', 'implantacao', 'realizado'].map(f => (
                      <Grid item xs={3} key={f}>
                        <TextField
                          size="small" fullWidth type="number"
                          value={m[f]}
                          onChange={changeMarker(type, i, f)}
                        />
                      </Grid>
                    ))}
                  </React.Fragment>
                ))}
              </Grid>
            </Box>
          ))}

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdd}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={openDet} onClose={() => setOpenDet(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do Pneu</DialogTitle>
        <DialogContent dividers>
          {editErr && <Alert severity="error" sx={{ mb: 2 }}>{editErr}</Alert>}

          {!edit && selTire && (
            <Box>
              {[
                ['Empresa', selTire.empresa], ['Código', selTire.codigo],
                ['Filial', selTire.filial], ['Depto', selTire.departamento],
                ['Nº Série', selTire.numeroSerie], ['DOT', selTire.dot],
                ['Vida Atual', selTire.vidaAtual], ['Modelo', selTire.modelo],
                ['Status', selTire.status], ['CHIP', selTire.chipInstalado ? 'Sim' : 'Não'],
                ['Nº CHIP', selTire.nroChip]
              ].map(([l, v]) => (
                <Typography key={l} variant="subtitle1">
                  <strong>{l}:</strong> {v}
                </Typography>
              ))}
            </Box>
          )}

          {edit && selTire && (
            <Box>
              {['empresa', 'codigo', 'filial', 'departamento',
                'numeroSerie', 'dot', 'vidaAtual', 'modelo', 'status', 'chipInstalado', 'nroChip'
              ].map(key => (
                <TextField
                  key={key} margin="dense" fullWidth size="small"
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={editT[key]} onChange={changeEdit(key)}
                  sx={{ mb: 2 }}
                />
              ))}
            </Box>
          )}

        </DialogContent>
        <DialogActions>
          {!edit ? (
            <>
              <Button color="error" onClick={delTire}>Excluir</Button>
              <Button variant="contained" onClick={() => setEdit(true)}>Editar</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEdit(false)}>Cancelar</Button>
              <Button variant="contained" onClick={saveEdit}>Salvar Alterações</Button>
            </>
          )}
          <Button onClick={() => setOpenDet(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
