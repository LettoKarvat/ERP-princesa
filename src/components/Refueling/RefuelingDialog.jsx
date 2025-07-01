// src/components/Refueling/RefuelingDialog.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/apiFlask';

// Mapeamento de bomba padrão conforme tipo de combustível
const pumpMap = {
  DIESEL: 'B1',
  ARLA: 'B2',
};

export const RefuelingDialog = ({ open, onClose, selectedItem, onSubmit }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    fuelType: 'DIESEL',
    date: '',
    post: 'interno',
    pump: pumpMap['DIESEL'],
    invoiceNumber: '',
    unitPrice: '',
    liters: '',
    mileage: '',
    observation: '',
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Carrega veículos disponíveis
  useEffect(() => {
    if (!open) return;
    api.get('/vehicles/available')
      .then(({ data }) => setVehicles(data))
      .catch(console.error);
  }, [open]);

  // Inicializa o form ao abrir
  useEffect(() => {
    if (!open) return;

    if (selectedItem) {
      const veh = vehicles.find(v => v.id === selectedItem.vehicle_id) || null;
      setSelectedVehicle(veh);
      setFormData({
        vehicle_id: selectedItem.vehicle_id,
        fuelType: selectedItem.fuelType,
        date: selectedItem.date.split('T')[0],
        post: selectedItem.post,
        pump: selectedItem.pump || pumpMap[selectedItem.fuelType],
        invoiceNumber: selectedItem.invoiceNumber || '',
        unitPrice: selectedItem.unitPrice?.toString() || '',
        liters: selectedItem.liters.toString(),
        mileage: selectedItem.mileage.toString(),
        observation: selectedItem.observation || '',
      });
      setAttachments(selectedItem.attachments || []);
    } else {
      setSelectedVehicle(null);
      setFormData({
        vehicle_id: '',
        fuelType: 'DIESEL',
        date: '',
        post: 'interno',
        pump: pumpMap['DIESEL'],
        invoiceNumber: '',
        unitPrice: '',
        liters: '',
        mileage: '',
        observation: '',
      });
      setAttachments([]);
    }
    setErrors({});
  }, [open, selectedItem, vehicles]);

  // Atualiza valor de campo genérico
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Troca de combustível ajusta bomba
  const handleFuelTypeChange = e => {
    const fuelType = e.target.value;
    setFormData(prev => ({
      ...prev,
      fuelType,
      pump: pumpMap[fuelType],
    }));
    setErrors(prev => ({ ...prev, fuelType: '', pump: '' }));
  };

  // Seleção de veículo via Autocomplete
  const handleVehicleChange = (_, vehicle) => {
    setSelectedVehicle(vehicle);
    handleInputChange('vehicle_id', vehicle?.id || '');
    if (vehicle?.quilometragem) {
      handleInputChange('mileage', vehicle.quilometragem.toString());
    }
  };

  // Adiciona arquivos
  const handleFileChange = e => {
    const files = Array.from(e.target.files || []);
    if (files.length) setAttachments(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove anexo
  const removeAttachment = idx => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = file => {
    const type = file.mimeType ?? file.type;
    if (type.includes('image')) return <ImageIcon />;
    if (type.includes('pdf')) return <PdfIcon />;
    return <FileIcon />;
  };
  const getFileName = file => file.fileName ?? file.name;
  const getFileSize = file => `${(file.size / 1024).toFixed(1)} KB`;

  // Validação básica dos campos
  const validateForm = () => {
    const errs = {};
    if (!formData.vehicle_id) errs.vehicle_id = 'Selecione um veículo';
    if (!formData.date) errs.date = 'Informe a data';
    if (!formData.liters) errs.liters = 'Informe os litros';
    if (!formData.mileage) errs.mileage = 'Informe a quilometragem';
    if (formData.post === 'interno' && !formData.pump) {
      errs.pump = 'Informe a bomba';
    }
    if (formData.post === 'externo') {
      if (!formData.invoiceNumber) errs.invoiceNumber = 'Informe número da nota';
      if (!formData.unitPrice) errs.unitPrice = 'Informe preço unitário';
    }
    // precisa de pelo menos 1 anexo (antigo ou novo)
    const hasOld = attachments.filter(a => !('size' in a)).length > 0;
    const hasNew = attachments.filter(a => 'size' in a).length > 0;
    if (!hasOld && !hasNew) {
      alert('Anexe pelo menos um arquivo');
      return false;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // SUBMIT: monta FormData com os nomes corretos e envia
  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) return;

    const fd = new FormData();
    fd.append("vehicle_id", formData.vehicle_id);
    fd.append("fuel_type", formData.fuelType);
    fd.append("date", formData.date);
    fd.append("post", formData.post);
    fd.append("liters", formData.liters);
    fd.append("mileage", formData.mileage);
    fd.append("pump", formData.pump || "");
    fd.append("observation", formData.observation || "");
    if (formData.post === "externo") {
      fd.append("invoice_number", formData.invoiceNumber);
      fd.append("unit_price", formData.unitPrice);
    }
    // anexos novos
    attachments
      .filter(f => f instanceof File)
      .forEach(f => fd.append("attachments", f, f.name));

    const call = selectedItem
      ? api.patch(`/refuelings/${selectedItem.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      : api.post('/refuelings', fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

    call
      .then(() => {
        onSubmit();  // re-fetch na página
        onClose();
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao salvar abastecimento');
      });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {selectedItem ? 'Editar Abastecimento' : 'Novo Abastecimento'}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Box mt={2}>
            <Grid container spacing={3}>

              {/* VEÍCULO */}
              <Grid item xs={12}>
                <Autocomplete
                  options={vehicles}
                  getOptionLabel={v =>
                    v.placa ? `${v.placa} – ${v.marca} ${v.modelo}` : ''
                  }
                  value={selectedVehicle}
                  onChange={handleVehicleChange}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Veículo"
                      error={!!errors.vehicle_id}
                      helperText={errors.vehicle_id}
                      required
                    />
                  )}
                  fullWidth
                />
              </Grid>

              {/* COMBUSTÍVEL */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel>Combustível</FormLabel>
                  <RadioGroup
                    row
                    value={formData.fuelType}
                    onChange={handleFuelTypeChange}
                  >
                    <FormControlLabel
                      value="DIESEL"
                      control={<Radio />}
                      label="DIESEL"
                    />
                    <FormControlLabel
                      value="ARLA"
                      control={<Radio />}
                      label="ARLA"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* DATA */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={formData.date}
                  onChange={e => handleInputChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.date}
                  helperText={errors.date}
                  required
                />
              </Grid>

              {/* POSTO */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Posto"
                  value={formData.post}
                  onChange={e => handleInputChange('post', e.target.value)}
                >
                  <MenuItem value="interno">Interno</MenuItem>
                  <MenuItem value="externo">Externo</MenuItem>
                </TextField>
              </Grid>

              {/* BOMBA ou NOTA+PREÇO */}
              {formData.post === 'interno' ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bomba"
                    value={formData.pump}
                    onChange={e => handleInputChange('pump', e.target.value)}
                    error={!!errors.pump}
                    helperText={errors.pump}
                    required
                  />
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nota"
                      value={formData.invoiceNumber}
                      onChange={e => handleInputChange('invoiceNumber', e.target.value)}
                      error={!!errors.invoiceNumber}
                      helperText={errors.invoiceNumber}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      inputProps={{ step: 0.01 }}
                      label="Preço unitário"
                      value={formData.unitPrice}
                      onChange={e => handleInputChange('unitPrice', e.target.value)}
                      error={!!errors.unitPrice}
                      helperText={errors.unitPrice}
                      required
                    />
                  </Grid>
                </>
              )}

              {/* LITROS */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 0.1 }}
                  label="Litros"
                  value={formData.liters}
                  onChange={e => handleInputChange('liters', e.target.value)}
                  error={!!errors.liters}
                  helperText={errors.liters}
                  required
                />
              </Grid>

              {/* QUILOMETRAGEM */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quilometragem"
                  value={formData.mileage}
                  onChange={e => handleInputChange('mileage', e.target.value)}
                  error={!!errors.mileage}
                  helperText={errors.mileage}
                  required
                />
              </Grid>

              {/* OBSERVAÇÃO */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observação"
                  value={formData.observation}
                  onChange={e => handleInputChange('observation', e.target.value)}
                />
              </Grid>

              {/* ANEXOS */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Anexos (pelo menos 1)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Adicionar Arquivos
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    hidden
                  />
                </Button>
                {attachments.length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <List dense>
                      {attachments.map((file, i) => (
                        <ListItem key={i} divider>
                          <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                          <ListItemText
                            primary={getFileName(file)}
                            secondary={'size' in file ? getFileSize(file) : ''}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => removeAttachment(i)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>

              {/* Ações */}
              <Grid item xs={12}>
                <DialogActions>
                  <Button onClick={onClose}>Cancelar</Button>
                  <Button type="submit" variant="contained">
                    {selectedItem ? 'Atualizar' : 'Salvar'}
                  </Button>
                </DialogActions>
              </Grid>

            </Grid>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};
