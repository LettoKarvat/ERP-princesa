// src/pages/Refueling.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  AppBar,
  Toolbar,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  LocalGasStation as FuelIcon,
  Speed as SpeedIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { RefuelingDialog } from '../components/Refueling/RefuelingDialog';
import { RefuelingDetails } from '../components/Refueling/RefuelingDetails';
import {
  fetchRefuelings,
  createRefueling,
  updateRefueling,
  deleteRefueling,
  fetchProductStock,
} from '../services/refuelingService';

export default function Refueling() {
  // principais estados
  const [refuelings, setRefuelings] = useState([]);
  const [selectedItem, setSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // para payload pendente e arquivos antes da assinatura
  const pendingSaveRef = useRef({ payload: null, files: [] });
  const sigRef = useRef(null);
  const [openSignature, setOpenSignature] = useState(false);

  // diálogo e detalhes
  const [dialogFiles, setDialogFiles] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // filtros
  const [search, setSearch] = useState('');
  const [fuel, setFuel] = useState('');
  const [dIni, setDIni] = useState('');
  const [dFim, setDFim] = useState('');

  // estoques
  const [stockDiesel, setStockDiesel] = useState(0);
  const [stockArla, setStockArla] = useState(0);

  // breakpoint para fullScreen dialog de assinatura
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchRefuelings().then(setRefuelings);
    fetchProductStock([33940, 34345])
      .then(rows => {
        rows.forEach(r => {
          if (r.CODPROD === 33940) setStockDiesel(r.QTESTGER);
          if (r.CODPROD === 34345) setStockArla(r.QTESTGER);
        });
      })
      .catch(console.error);
  }, []);

  const handleDelete = async id => {
    if (!window.confirm('Confirma exclusão deste abastecimento?')) return;
    try {
      await deleteRefueling(id);
      setRefuelings(await fetchRefuelings());
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
    }
  };

  const normalize = s =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const dataFiltered = refuelings.filter(r => {
    const label = r.vehicleLabel || r.vehicle_id;
    const vMatch = normalize(label).includes(normalize(search));
    const fMatch = !fuel || r.fuelType === fuel;
    const date = r.date.split('T')[0];
    const dMatch = (!dIni || date >= dIni) && (!dFim || date <= dFim);
    return vMatch && fMatch && dMatch;
  });

  function openForm(item = null) {
    setIsEditing(!!item);
    setSelected(item);
    setDialogFiles([]);
    setOpenDialog(true);
  }

  function closeForm() {
    setOpenDialog(false);
    setIsEditing(false);
    setSelected(null);
    setDialogFiles([]);
  }

  // salva payload e arquivos no ref; abre assinatura ou grava direto
  function handleSave(data, newFiles) {
    const persisted = isEditing ? selectedItem?.attachments?.length || 0 : 0;
    if (persisted === 0 && newFiles.length === 0)
      return alert('Anexe pelo menos um arquivo.');
    if (data.post === 'interno' && !data.pump)
      return alert('Informe a bomba.');
    if (data.post === 'externo' && (!data.invoiceNumber || !data.unitPrice))
      return alert('Informe nota e preço.');

    // guarda no ref
    pendingSaveRef.current = { payload: data, files: newFiles };

    // se não tiver assinatura, abre o diálogo dela
    if (!data.signature) {
      setOpenSignature(true);
    } else {
      doSave(data, newFiles, data.signature);
    }
  }
  const [isSaving, setIsSaving] = useState(false);

  async function doSave(payload, files, sigUrl) {
    setIsSaving(true);
    try {
      const sigBlob = sigUrl?.startsWith('data:')
        ? await fetch(sigUrl).then(r => r.blob())
        : null;

      if (isEditing) {
        await updateRefueling(selectedItem.id, payload, files, sigBlob);
      } else {
        await createRefueling(payload, files, sigBlob);
      }

      setRefuelings(await fetchRefuelings());
      closeForm();
      setOpenSignature(false);

    } catch (err) {
      console.error(err);
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  }

  // dispara ao confirmar assinatura
  const confirmSignature = () => {
    if (sigRef.current.isEmpty()) {
      return alert('Assine antes de confirmar.');
    }
    const url = sigRef.current.toDataURL();
    setOpenSignature(false);
    const { payload, files } = pendingSaveRef.current;
    doSave(payload, files, url);
  };

  const openDetails = item => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const formatDate = d =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStockStatus = stock => {
    if (stock > 1000) return { color: '#2E7D32', icon: CheckCircleIcon, label: 'Normal' };
    if (stock > 500) return { color: '#F57C00', icon: WarningIcon, label: 'Atenção' };
    return { color: '#C62828', icon: WarningIcon, label: 'Crítico' };
  };
  const dieselStatus = getStockStatus(stockDiesel);
  const arlaStatus = getStockStatus(stockArla);
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: '#1e293b',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FuelIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: 'white' }}>
              Sistema de Abastecimento
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Abastecimentos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openForm()}
            size="large"
            sx={{
              bgcolor: '#1e293b',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(30, 41, 59, 0.15)',
              '&:hover': {
                bgcolor: '#334155',
                boxShadow: '0 6px 16px rgba(30, 41, 59, 0.25)',
              },
            }}
          >
            Novo abastecimento
          </Button>
        </Box>

        {/* Cards de Estoque Profissionais */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Estoque Diesel */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              transition: 'box-shadow 0.2s ease'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FuelIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                        Bomba Diesel
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Combustível Principal
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <dieselStatus.icon sx={{ color: dieselStatus.color, fontSize: 28, mb: 0.5 }} />
                    <Typography variant="caption" sx={{
                      color: dieselStatus.color,
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {dieselStatus.status}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stockDiesel.toLocaleString()}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
                      litros
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    icon={<InfoIcon />}
                    label="Monitorado"
                    size="small"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 500,
                      '& .MuiChip-icon': { color: '#475569' }
                    }}
                  />
                  <Chip
                    label="Bomba 1"
                    size="small"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Estoque Arla */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              transition: 'box-shadow 0.2s ease'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FuelIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                        Bomba Arla
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Aditivo Diesel
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <arlaStatus.icon sx={{ color: arlaStatus.color, fontSize: 28, mb: 0.5 }} />
                    <Typography variant="caption" sx={{
                      color: arlaStatus.color,
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {arlaStatus.status}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stockArla.toLocaleString()}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
                      litros
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    icon={<InfoIcon />}
                    label="Monitorado"
                    size="small"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 500,
                      '& .MuiChip-icon': { color: '#475569' }
                    }}
                  />
                  <Chip
                    label="Bomba 2"
                    size="small"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Card sx={{
          mb: 4,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              Filtros de Pesquisa
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Pesquisar veículo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Digite a placa ou modelo..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1e293b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1e293b',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Combustível"
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1e293b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1e293b',
                      },
                    },
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="DIESEL">DIESEL</MenuItem>
                  <MenuItem value="ARLA">ARLA</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data início"
                  value={dIni}
                  onChange={(e) => setDIni(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1e293b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1e293b',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data fim"
                  value={dFim}
                  onChange={(e) => setDFim(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1e293b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1e293b',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Lista de cards */}
        <Grid container spacing={3}>
          {dataFiltered.map(r => (
            <Grid item xs={12} md={6} lg={4} key={r.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Header */}
                <Box sx={{
                  bgcolor: r.fuelType === 'DIESEL' ? '#1e293b' : '#166534',
                  p: 3,
                  borderRadius: '12px 12px 0 0'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: 'white', flex: 1 }}>
                      {r.vehicleLabel || r.vehicle || r.vehicle_id}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<FuelIcon />}
                        label={r.fuelType}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 500,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                      <Chip
                        icon={<LocationIcon />}
                        label={r.post.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 500,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Dados principais */}
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <SpeedIcon sx={{ color: '#64748b' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                          Quilometragem
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {r.mileage?.toLocaleString()} km
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <FuelIcon sx={{ color: '#64748b' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                          Volume
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {r.liters} litros
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <CalendarIcon sx={{ color: '#64748b' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                          Data/Hora
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                          {formatDate(r.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  {/* Informações específicas do posto */}
                  {r.post === 'externo' && r.unitPrice && (
                    <Paper sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: '#fef3c7',
                      border: '1px solid #fbbf24'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ReceiptIcon sx={{ color: '#92400e', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
                          Posto Externo
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#92400e', mb: 0.5 }}>
                        <strong>Preço:</strong> R$ {Number(r.unitPrice).toFixed(2)}/L
                      </Typography>
                      {r.invoiceNumber && (
                        <Typography variant="body2" sx={{ color: '#92400e', mb: 0.5 }}>
                          <strong>NF:</strong> {r.invoiceNumber}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600 }}>
                        Total: R$ {(r.unitPrice * r.liters).toFixed(2)}
                      </Typography>
                    </Paper>
                  )}

                  {r.post === 'interno' && r.pump && (
                    <Paper sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: '#dcfce7',
                      border: '1px solid #22c55e'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FuelIcon sx={{ color: '#166534', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#166534' }}>
                          Bomba: {r.pump}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </CardContent>

                {/* Ações */}
                <Divider />
                <Box sx={{ p: 3, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<VisibilityIcon />}
                    onClick={() => openDetails(r)}
                    size="small"
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      bgcolor: '#1e293b',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: '#334155',
                      }
                    }}
                  >
                    Detalhes
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => openForm(r)}
                    size="small"
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      bgcolor: '#166534',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: '#15803d',
                      }
                    }}
                  >
                    Editar
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(r.id)}
                    size="small"
                    sx={{
                      bgcolor: '#dc2626',
                      color: 'white',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#b91c1c',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {dataFiltered.length === 0 && (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'white',
            borderRadius: 3,
            border: '1px solid #e2e8f0'
          }}>
            <Typography variant="h6" sx={{ color: '#64748b', mb: 2, fontWeight: 500 }}>
              Nenhum abastecimento encontrado
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Tente ajustar os filtros ou adicione um novo abastecimento
            </Typography>
          </Box>
        )}

        {/* CRUD dialog */}
        <RefuelingDialog
          open={openDialog}
          selectedItem={selectedItem}
          onClose={closeForm}
          onSubmit={handleSave}
        />

        {/* Detalhes */}
        <RefuelingDetails
          item={detailItem}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />

        {/* Assinatura */}
        {/* assinatura */}
        <Dialog
          open={openSignature}
          onClose={() => setOpenSignature(false)}
          fullScreen={fullScreen}
        >
          <DialogTitle>Assinatura do Responsável</DialogTitle>
          <DialogContent dividers>
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: fullScreen ? window.innerWidth - 20 : 400,
                height: 200,
              }}
            />
            <Button onClick={() => sigRef.current.clear()} sx={{ mt: 1 }}>
              Limpar
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSignature(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={confirmSignature}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Confirmar'}
            </Button>

          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}