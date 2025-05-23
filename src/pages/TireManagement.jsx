import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Tabs,
  Tab,
  Paper,
  styled,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import api from '../services/apiFlask';
import VehicleTireManagement from './VehicleTireManagement';

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
    empresa: '',
    codigo: '',
    filial: '',
    departamento: '',
    numeroSerie: '',
    dot: '',
    vencimento: '',
    vidaAtual: '',
    modelo: '',
    chipInstalado: false,
    nroChip: '',
    desenhoOriginal: '',
    desenhoAtual: '',
    fabricante: '',
    nrSulcos: '',
    nrLonas: '',
    dimensao: '',
    librasInicial: '',
    librasFinal: '',
    hod: Array(7).fill({ previsto: '', implantacao: '', realizado: '' }),
    hori: Array(7).fill({ previsto: '', implantacao: '', realizado: '' }),
  });
  const [newErrors, setNewErrors] = useState({});

  const [openDet, setOpenDet] = useState(false);
  const [selTire, setSelTire] = useState(null);
  const [edit, setEdit] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editT, setEditT] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => { loadTires(); }, [viewMode]);

  async function loadTires() {
    try {
      const { data } = await api.post('/functions/getAllPneus', {});
      const list = data.result || [];
      setStockTires(list.filter(p => p.status?.toLowerCase() === 'em estoque'));
      setRecapTires(list.filter(p => p.status?.toLowerCase() === 'em recapagem'));
    } catch (e) {
      console.error(e);
    }
  }

  const filtra = (arr, termo) =>
    arr.filter(x =>
      ['numeroSerie', 'fabricante', 'modelo', 'dimensao'].some(k =>
        x[k]?.toLowerCase().includes(termo.toLowerCase())
      )
    );

  function validate(tire) {
    const errs = {};
    if (!tire.numeroSerie.trim()) errs.numeroSerie = 'Obrigatório';
    ['nrSulcos', 'nrLonas', 'librasInicial', 'librasFinal', 'vidaAtual'].forEach(k => {
      if (tire[k] && isNaN(Number(tire[k]))) errs[k] = 'Deve ser número';
    });
    if (tire.vencimento && isNaN(Date.parse(tire.vencimento))) {
      errs.vencimento = 'Data inválida';
    }
    return errs;
  }

  async function handleAdd() {
    const errs = validate(newTire);
    if (Object.keys(errs).length) {
      setNewErrors(errs);
      setAddErr('Corrija os campos em destaque.');
      return;
    }
    setNewErrors({});
    try {
      await api.post('/functions/criarPneu', {
        ...newTire,
        status: 'Em estoque',
        chipInstalado: newTire.chipInstalado ? 'Sim' : 'Não',
        kmInicial: +newTire.librasInicial,
        kmFinal: +newTire.librasFinal,
        vida: +newTire.vidaAtual,
      });
      setOpenAdd(false);
      loadTires();
    } catch {
      setAddErr('Falha ao cadastrar.');
    }
  }

  function openDetails(t) {
    setSelTire(t);
    setEditT({
      ...t,
      chipInstalado: t.chipInstalado === 'Sim'
    });
    setEdit(false);
    setEditErr('');
    setEditErrors({});
    setOpenDet(true);
  }

  async function saveEdit() {
    const errs = validate(editT);
    if (Object.keys(errs).length) {
      setEditErrors(errs);
      setEditErr('Corrija os campos em destaque.');
      return;
    }
    setEditErrors({});
    try {
      await api.post('/functions/editarPneu', {
        ...editT,
        chipInstalado: editT.chipInstalado ? 'Sim' : 'Não'
      });
      setOpenDet(false);
      loadTires();
    } catch {
      setEditErr('Falha ao salvar.');
    }
  }

  async function delTire() {
    try {
      await api.post('/functions/softDeletePneu', { objectId: selTire.objectId });
      setOpenDet(false);
      loadTires();
    } catch {
      setEditErr('Falha ao excluir.');
    }
  }

  const change = key => e => setNewTire(n => ({ ...n, [key]: e.target.value }));
  const changeToggle = key => (_e, checked) => setNewTire(n => ({ ...n, [key]: checked }));
  const changeEdit = key => (_e, value) => {
    const v = typeof value === 'boolean' ? value : value.target.value;
    setEditT(n => ({ ...n, [key]: v }));
  };
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
            <TextField
              size="small"
              sx={{ width: 300 }}
              label="Buscar Pneus"
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
            />
            <Button variant="contained" onClick={() => setOpenAdd(true)}>
              Cadastrar Pneu
            </Button>
          </Box>

          {filtra(stockTires, stockSearch).length === 0 ? (
            <Typography>Nenhum pneu em estoque.</Typography>
          ) : (
            <Grid container spacing={2}>
              {filtra(stockTires, stockSearch).map(t => (
                <Grid item xs={6} sm={4} md={3} key={t.objectId}>
                  <TireCard onClick={() => openDetails(t)}>
                    <MdOutlineTireRepair size={50} style={{ marginBottom: 8 }} />
                    <Typography>N°: {t.numeroSerie}</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>
                      {t.fabricante} - {t.modelo}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'gray' }}>
                      Recap: {t.recapCount || 0}
                    </Typography>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {viewMode === 'recapadora' && (
        <Box>
          <TextField
            size="small"
            sx={{ width: 300, mb: 2 }}
            label="Buscar Pneus"
            value={recapSearch}
            onChange={e => setRecapSearch(e.target.value)}
          />
          {filtra(recapTires, recapSearch).length === 0 ? (
            <Typography>Nenhum pneu em recapagem.</Typography>
          ) : (
            <Grid container spacing={2}>
              {filtra(recapTires, recapSearch).map(t => (
                <Grid item xs={6} sm={4} md={3} key={t.objectId}>
                  <TireCard onClick={() => openDetails(t)}>
                    <MdOutlineTireRepair size={50} style={{ marginBottom: 8 }} />
                    <Typography>N°: {t.numeroSerie}</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>Vida: {t.vida}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'gray' }}>
                      Recap: {t.recapCount || 0}
                    </Typography>
                  </TireCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {viewMode === 'vehicle' && <VehicleTireManagement />}

      {/* Modal Cadastrar */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar Pneu</DialogTitle>
        <DialogContent dividers>
          {addErr && <Alert severity="error" sx={{ mb: 2 }}>{addErr}</Alert>}

          {/* Cabeçalho */}
          <Grid container spacing={2} mb={2}>
            {['empresa', 'codigo', 'filial', 'departamento'].map(k => (
              <Grid item xs={3} key={k}>
                <TextField
                  label={k.charAt(0).toUpperCase() + k.slice(1)}
                  size="small"
                  fullWidth
                  value={newTire[k]}
                  onChange={change(k)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Principais */}
          <Grid container spacing={2} mb={2}>
            {[
              { key: 'numeroSerie', label: 'Nº de Série', type: 'text' },
              { key: 'dot', label: 'DOT', type: 'text' },
              { key: 'vencimento', label: 'Vencimento', type: 'date' },
              { key: 'vidaAtual', label: 'Vida Atual', type: 'number' },
              { key: 'modelo', label: 'Modelo', type: 'text' }
            ].map(({ key, label, type }) => (
              <Grid item xs={3} key={key}>
                <TextField
                  label={label}
                  size="small"
                  fullWidth
                  type={type}
                  InputLabelProps={type === 'date' ? { shrink: true } : undefined}
                  value={newTire[key]}
                  onChange={change(key)}
                  error={!!newErrors[key]}
                  helperText={newErrors[key]}
                />
              </Grid>
            ))}

            {/* Switch CHIP */}
            <Grid item xs={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newTire.chipInstalado}
                    onChange={changeToggle('chipInstalado')}
                  />
                }
                label="CHIP instalado?"
              />
            </Grid>

            {/* Nº CHIP */}
            <Grid item xs={3}>
              <TextField
                label="Nº CHIP"
                size="small"
                fullWidth
                value={newTire.nroChip}
                onChange={change('nroChip')}
              />
            </Grid>
          </Grid>

          {/* Características */}
          <Grid container spacing={2} mb={2}>
            {[
              ['Desenho Original', 'desenhoOriginal'],
              ['Desenho Atual', 'desenhoAtual'],
              ['Fabricante', 'fabricante'],
              ['N° Sulcos', 'nrSulcos', 'number'],
              ['N° Lonas', 'nrLonas', 'number'],
              ['Dimensão', 'dimensao'],
              ['Libras Inicial', 'librasInicial', 'number'],
              ['Libras Final', 'librasFinal', 'number'],
            ].map(([lbl, key, type]) => (
              <Grid item xs={3} key={key}>
                <TextField
                  label={lbl}
                  size="small"
                  fullWidth
                  type={type || 'text'}
                  value={newTire[key]}
                  onChange={change(key)}
                  error={!!newErrors[key]}
                  helperText={newErrors[key]}
                />
              </Grid>
            ))}
          </Grid>

          {/* Marcadores */}
          {['hod', 'hori'].map(type => (
            <Box key={type} mb={2}>
              <Typography variant="subtitle1">
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
                          size="small"
                          fullWidth
                          type="number"
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
        {selTire && (
          <DialogContent dividers>
            {editErr && <Alert severity="error" sx={{ mb: 2 }}>{editErr}</Alert>}
            {edit ? (
              <>
                {[
                  'empresa', 'codigo', 'filial', 'departamento',
                  'numeroSerie', 'dot', 'vencimento', 'vidaAtual',
                  'modelo', 'status'
                ].map(key => (
                  <TextField
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    margin="dense"
                    fullWidth
                    size="small"
                    type={key === 'vencimento' ? 'date' : 'text'}
                    InputLabelProps={key === 'vencimento' ? { shrink: true } : undefined}
                    value={editT[key] || ''}
                    onChange={e => changeEdit(key)(_, e.target.value)}
                    error={!!editErrors[key]}
                    helperText={editErrors[key]}
                    sx={{ mb: 2 }}
                  />
                ))}

                <FormControlLabel
                  control={
                    <Switch
                      checked={!!editT.chipInstalado}
                      onChange={e => changeEdit('chipInstalado')(_, e.target.checked)}
                    />
                  }
                  label="CHIP instalado?"
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Nº CHIP"
                  margin="dense"
                  fullWidth
                  size="small"
                  value={editT.nroChip || ''}
                  onChange={e => changeEdit('nroChip')(_, e.target.value)}
                  sx={{ mb: 2 }}
                />
              </>
            ) : (
              <Box>
                {[
                  ['Empresa', selTire.empresa],
                  ['Código', selTire.codigo],
                  ['Filial', selTire.filial],
                  ['Depto', selTire.departamento],
                  ['Nº Série', selTire.numeroSerie],
                  ['DOT', selTire.dot],
                  ['Vida Atual', selTire.vidaAtual],
                  ['Modelo', selTire.modelo],
                  ['Status', selTire.status],
                  ['CHIP', selTire.chipInstalado],
                  ['Nº CHIP', selTire.nroChip]
                ].map(([l, v]) => (
                  <Typography key={l} variant="subtitle1">
                    <strong>{l}:</strong> {v}
                  </Typography>
                ))}
              </Box>
            )}
          </DialogContent>
        )}
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
