import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, TextField, Tabs, Tab, Paper, styled, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Switch, FormControlLabel
} from '@mui/material';
import { MdOutlineTireRepair } from 'react-icons/md';
import api from '../services/apiFlask';
import VehicleTireManagement from './VehicleTireManagement';

/* ─── estilos ─── */
const TireCard = styled(Paper)(({ theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
}));

/* ─── helper numérico ─── */
const onlyNum = v => v.replace(/[^0-9]/g, '');

export default function TireManagement() {
  const [viewMode, setViewMode] = useState('stock');
  const [stockTires, setStockTires] = useState([]);
  const [recapTires, setRecapTires] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [recapSearch, setRecapSearch] = useState('');

  /* -------- estado do modal -------- */
  const blankTire = {
    empresa: '', codigo: '', filial: '', departamento: '',
    numeroSerie: '', dot: '', vencimento: '',
    vidaAtual: '', modelo: '', chipInstalado: false, nroChip: '',
    desenhoOriginal: '', desenhoAtual: '', fabricante: '',
    nrSulcos: '', nrLonas: '', dimensao: '',
    librasInicial: '', librasFinal: '',
    // novos campos de compra
    fornecedor: '', nfNumero: '', nfSerie: '',
    dataCompra: '', valorCusto: '', valorFrete: '',
    despesasAcessorias: '', sulcoOriginal: '', sulcoAtual: '',
    // hod / hori
    hod: Array(7).fill({ previsto: '', implantacao: '', realizado: '' }),
    hori: Array(7).fill({ previsto: '', implantacao: '', realizado: '' }),
  };

  const [openAdd, setOpenAdd] = useState(false);
  const [addErr, setAddErr] = useState('');
  const [newTire, setNewTire] = useState(blankTire);
  const [newErrors, setNewErrors] = useState({});

  /* -------- detalhes / edição -------- */
  const [openDet, setOpenDet] = useState(false);
  const [selTire, setSelTire] = useState(null);
  const [edit, setEdit] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editT, setEditT] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => { loadTires(); }, [viewMode]);

  async function loadTires() {
    try {
      const { data } = await api.post('/functions/getAllPneus');
      const list = data.result || [];
      setStockTires(list.filter(p => (p.status || '').toLowerCase() === 'em estoque'));
      setRecapTires(list.filter(p => (p.status || '').toLowerCase() === 'em recapagem'));
    } catch (e) { console.error(e); }
  }

  /* -------- filtros / validações -------- */
  const filtra = (arr, termo) =>
    arr.filter(x =>
      ['numeroSerie', 'fabricante', 'modelo', 'dimensao'].some(k =>
        x[k]?.toLowerCase().includes(termo.toLowerCase())
      )
    );

  function validate(tire) {
    const errs = {};
    const mustNum = k => {
      const v = tire[k]?.toString().trim();
      if (!v) errs[k] = 'Obrigatório';
      else if (isNaN(Number(v))) errs[k] = 'Somente números';
    };

    if (!tire.numeroSerie.trim()) errs.numeroSerie = 'Obrigatório';
    ['nrSulcos', 'nrLonas', 'librasInicial', 'librasFinal', 'vidaAtual'].forEach(mustNum);

    if (tire.vencimento && isNaN(Date.parse(tire.vencimento))) errs.vencimento = 'Data inválida';
    if (tire.dataCompra && isNaN(Date.parse(tire.dataCompra))) errs.dataCompra = 'Data inválida';

    // valores monetários
    ['valorCusto', 'valorFrete', 'despesasAcessorias'].forEach(k => {
      if (tire[k] && isNaN(Number(tire[k].replace(',', '.')))) errs[k] = 'Número inválido';
    });
    return errs;
  }

  /* -------- handlers de cadastro -------- */
  async function handleAdd() {
    const errs = validate(newTire);
    if (Object.keys(errs).length) { setNewErrors(errs); setAddErr('Corrija os campos.'); return; }
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
      setNewTire(blankTire);
      loadTires();
    } catch { setAddErr('Falha ao cadastrar.'); }
  }

  /* -------- detalhes -------- */
  function openDetails(t) {
    setSelTire(t);
    setEditT({ ...t, chipInstalado: t.chipInstalado === 'Sim' });
    setEdit(false); setEditErr(''); setEditErrors({});
    setOpenDet(true);
  }

  async function saveEdit() {
    const errs = validate(editT);
    if (Object.keys(errs).length) { setEditErrors(errs); setEditErr('Corrija os campos.'); return; }
    setEditErrors({});
    try {
      await api.post('/functions/editarPneu', {
        ...editT,
        chipInstalado: editT.chipInstalado ? 'Sim' : 'Não'
      });
      setOpenDet(false);
      loadTires();
    } catch { setEditErr('Falha ao salvar.'); }
  }

  /* -------- misc handlers -------- */
  const change = key => e => {
    setNewTire(n => ({ ...n, [key]: e.target.value }));
    if (Object.keys(newErrors).length) setNewErrors(validate({ ...newTire, [key]: e.target.value }));
  };
  const changeToggle = key => (_e, chk) => setNewTire(n => ({ ...n, [key]: chk }));
  const changeEdit = key => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditT(n => ({ ...n, [key]: v }));
    if (Object.keys(editErrors).length) setEditErrors(validate({ ...editT, [key]: v }));
  };

  const changeMarker = (type, i, field) => e => {
    const vv = onlyNum(e.target.value);
    const arr = [...newTire[type]];
    arr[i] = { ...arr[i], [field]: vv };
    setNewTire(n => ({ ...n, [type]: arr }));
  };

  /* -------- render -------- */
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestão de Pneus</Typography>

      {/* abas */}
      <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ mb: 2 }}>
        <Tab label="Pneus em Estoque" value="stock" />
        <Tab label="Recapadora" value="recapadora" />
        <Tab label="Gerenciar Veículos" value="vehicle" />
      </Tabs>

      {/* estoque */}
      {viewMode === 'stock' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField size="small" sx={{ width: 300 }} label="Buscar Pneus"
              value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
            <Button variant="contained" onClick={() => setOpenAdd(true)}>Cadastrar Pneu</Button>
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

      {/* recapadora */}
      {viewMode === 'recapadora' && (
        <Box>
          <TextField size="small" sx={{ width: 300, mb: 2 }} label="Buscar Pneus"
            value={recapSearch} onChange={e => setRecapSearch(e.target.value)} />
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

      {/* gerenciar veículos */}
      {viewMode === 'vehicle' && <VehicleTireManagement />}

      {/* ---------- Modal Cadastrar ---------- */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar Pneu</DialogTitle>
        <DialogContent dividers>
          {addErr && <Alert severity="error" sx={{ mb: 2 }}>{addErr}</Alert>}

          {/* cabeçalho */}
          <Grid container spacing={2} mb={2}>
            {['empresa', 'codigo', 'filial', 'departamento'].map(k => (
              <Grid item xs={3} key={k}>
                <TextField label={k.charAt(0).toUpperCase() + k.slice(1)}
                  size="small" fullWidth value={newTire[k]} onChange={change(k)} />
              </Grid>
            ))}
          </Grid>

          {/* principais */}
          <Grid container spacing={2} mb={2}>
            {[
              ['numeroSerie', 'Nº de Série', 'text', true],
              ['dot', 'DOT', 'text', false],
              ['vencimento', 'Vencimento', 'date', false],
              ['vidaAtual', 'Vida Atual', 'number', true],
              ['modelo', 'Modelo', 'text', false],
            ].map(([key, label, type, req]) => (
              <Grid item xs={3} key={key}>
                <TextField required={req} label={label} size="small" fullWidth
                  type={type} InputLabelProps={type === 'date' ? { shrink: true } : undefined}
                  inputMode={type === 'number' ? 'numeric' : undefined}
                  onInput={type === 'number' ? e => e.target.value = onlyNum(e.target.value) : undefined}
                  value={newTire[key]} onChange={change(key)}
                  error={!!newErrors[key]} helperText={newErrors[key]}
                />
              </Grid>
            ))}

            {/* switch chip */}
            <Grid item xs={3}>
              <FormControlLabel
                control={<Switch checked={newTire.chipInstalado}
                  onChange={changeToggle('chipInstalado')} />}
                label="CHIP instalado?"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField label="Nº CHIP" size="small" fullWidth
                value={newTire.nroChip} onChange={change('nroChip')} />
            </Grid>
          </Grid>

          {/* características */}
          <Grid container spacing={2} mb={2}>
            {[
              ['Desenho Original', 'desenhoOriginal', 'text'],
              ['Desenho Atual', 'desenhoAtual', 'text'],
              ['Fabricante', 'fabricante', 'text'],
              ['N° Sulcos', 'nrSulcos', 'number', true],
              ['N° Lonas', 'nrLonas', 'number', true],
              ['Dimensão', 'dimensao', 'text'],
              ['Libras Inicial', 'librasInicial', 'number', true],
              ['Libras Final', 'librasFinal', 'number', true],
            ].map(([lbl, key, type, req]) => (
              <Grid item xs={3} key={key}>
                <TextField required={req} label={lbl} size="small" fullWidth
                  type={type} inputMode={type === 'number' ? 'numeric' : undefined}
                  onInput={type === 'number' ? e => e.target.value = onlyNum(e.target.value) : undefined}
                  value={newTire[key]} onChange={change(key)}
                  error={!!newErrors[key]} helperText={newErrors[key]}
                />
              </Grid>
            ))}
          </Grid>

          {/* dados de compra */}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Dados de Compra</Typography>
          <Grid container spacing={2} mb={2}>
            {[
              ['Fornecedor', 'fornecedor'],
              ['NF Nº', 'nfNumero'],
              ['NF Série', 'nfSerie'],
              ['Data Compra', 'dataCompra', 'datetime-local'],
              ['Valor Custo', 'valorCusto'],
              ['Valor Frete', 'valorFrete'],
              ['Despesas', 'despesasAcessorias'],
              ['Sulco Orig. (mm)', 'sulcoOriginal', 'number'],
              ['Sulco Atual (mm)', 'sulcoAtual', 'number'],
            ].map(([lbl, key, type = 'text']) => (
              <Grid item xs={3} key={key}>
                <TextField label={lbl} size="small" fullWidth type={type}
                  InputLabelProps={type.startsWith('datetime') ? { shrink: true } : undefined}
                  inputMode={type === 'number' ? 'numeric' : undefined}
                  onInput={type === 'number' ? e => e.target.value = onlyNum(e.target.value) : undefined}
                  value={newTire[key]} onChange={change(key)}
                  error={!!newErrors[key]} helperText={newErrors[key]}
                />
              </Grid>
            ))}
          </Grid>

          {/* hod / hori (mantido igual) */}
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
                        <TextField required size="small" fullWidth type="number"
                          inputMode="numeric" onInput={e => e.target.value = onlyNum(e.target.value)}
                          value={m[f]} onChange={changeMarker(type, i, f)} />
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
          <Button variant="contained" onClick={handleAdd}
            disabled={Object.keys(newErrors).length > 0}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Modal Detalhes ---------- */}
      <Dialog open={openDet} onClose={() => setOpenDet(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do Pneu</DialogTitle>
        {selTire && (
          <DialogContent dividers>
            {editErr && <Alert severity="error" sx={{ mb: 2 }}>{editErr}</Alert>}
            {edit ? (
              <>
                {[
                  // lista reduzida para exemplo; inclua mais se precisar
                  'empresa', 'codigo', 'filial', 'departamento',
                  'numeroSerie', 'dot', 'vencimento', 'vidaAtual', 'modelo', 'status',
                  'fornecedor', 'nfNumero', 'nfSerie', 'dataCompra'
                ].map(key => (
                  <TextField
                    key={key}
                    label={key}
                    margin="dense" fullWidth size="small"
                    type={key === 'vencimento' || key === 'dataCompra' ? 'date' : 'text'}
                    InputLabelProps={key === 'vencimento' || key === 'dataCompra' ? { shrink: true } : undefined}
                    value={editT[key] || ''}
                    onChange={changeEdit(key)}
                    sx={{ mb: 2 }}
                  />
                ))}

                <FormControlLabel control={
                  <Switch checked={!!editT.chipInstalado} onChange={changeEdit('chipInstalado')} />
                } label="CHIP instalado?" sx={{ mb: 2 }} />

                <TextField label="Nº CHIP" margin="dense" fullWidth size="small"
                  value={editT.nroChip || ''} onChange={changeEdit('nroChip')} sx={{ mb: 2 }} />
              </>
            ) : (
              <Box>
                {[
                  ['Empresa', selTire.empresa],
                  ['Fornecedor', selTire.fornecedor],
                  ['Nº Série', selTire.numeroSerie],
                  ['Vida Atual', selTire.vidaAtual],
                  ['Valor Custo', selTire.valorCusto],
                  ['Status', selTire.status],
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
              <Button color="error" /* onClick={delTire} */>Excluir</Button>
              <Button variant="contained" onClick={() => setEdit(true)}>Editar</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEdit(false)}>Cancelar</Button>
              <Button variant="contained" onClick={saveEdit}
                disabled={Object.keys(editErrors).length > 0}>Salvar</Button>
            </>
          )}
          <Button onClick={() => setOpenDet(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
