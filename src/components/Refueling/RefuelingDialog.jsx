// src/components/Refueling/RefuelingDialog.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Box, Typography,
  Paper, List, ListItem, ListItemIcon, ListItemText,
  ListItemSecondaryAction, IconButton, Autocomplete, MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon, Image as ImageIcon,
  PictureAsPdf as PdfIcon, InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/apiFlask';

/* data+hora local no formato YYYY-MM-DDTHH:MM */
const nowLocalISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 16);
};

const pumpMap = { DIESEL: 'B1', ARLA: 'B2' };

export function RefuelingDialog({ open, onClose, selectedItem, onSubmit }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [attachments, setAttachments] = useState([]);

  const initialForm = {
    vehicle_id: '',
    fuelType: 'DIESEL',
    date: nowLocalISO(),        // já vem com “agora”
    post: 'interno',
    pump: pumpMap.DIESEL,
    invoiceNumber: '',
    unitPrice: '',
    liters: '',
    mileage: '',
    observation: '',
    signature: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  /* carrega veículos ao abrir */
  useEffect(() => {
    if (!open) return;
    api.get('/vehicles/available')
      .then(res => setVehicles(res.data))
      .catch(console.error);
  }, [open]);

  /* inicializa edição / novo */
  useEffect(() => {
    if (!open) return;

    if (selectedItem) {
      setSelectedVehicle(
        vehicles.find(v => v.id === selectedItem.vehicle_id) || null
      );
      setFormData({
        vehicle_id: selectedItem.vehicle_id,
        fuelType: selectedItem.fuelType,
        date: selectedItem.date.slice(0, 16),
        post: selectedItem.post,
        pump: selectedItem.pump || pumpMap[selectedItem.fuelType],
        invoiceNumber: selectedItem.invoiceNumber || '',
        unitPrice: selectedItem.unitPrice?.toString() || '',
        liters: selectedItem.liters.toString(),
        mileage: selectedItem.mileage.toString(),
        observation: selectedItem.observation || '',
        signature: selectedItem.signatureUrl || '',
      });
      setAttachments(selectedItem.attachments || []);
    } else {
      setSelectedVehicle(null);
      setFormData(initialForm);          // sempre “reset” com data/hora atual
      setAttachments([]);
    }
    setErrors({});
  }, [open, selectedItem, vehicles]);

  /* genérico */
  const handleInputChange = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  /* troca combustível → ajusta bomba */
  const handleFuelChange = e => {
    const ft = e.target.value;
    setFormData(p => ({ ...p, fuelType: ft, pump: pumpMap[ft] }));
    setErrors(e => ({ ...e, fuelType: '', pump: '' }));
  };

  /* seleção veículo */
  const handleVehicleChange = (_, v) => {
    setSelectedVehicle(v);
    handleInputChange('vehicle_id', v?.id || '');
    if (v?.quilometragem)
      handleInputChange('mileage', v.quilometragem.toString());
  };

  /* anexos */
  const handleFileChange = e => {
    const files = Array.from(e.target.files || []);
    if (files.length) setAttachments(prev => [...prev, ...files]);
    fileInputRef.current.value = '';
  };
  const removeAttachment = idx =>
    setAttachments(prev => prev.filter((_, i) => i !== idx));

  /* validação mínima */
  const validate = () => {
    const err = {};
    if (!formData.vehicle_id) err.vehicle_id = 'Selecione veículo';
    if (!formData.date) err.date = 'Informe data/hora';
    if (!formData.liters) err.liters = 'Informe litros';
    if (!formData.mileage) err.mileage = 'Informe quilometragem';
    if (formData.post === 'interno' && !formData.pump) err.pump = 'Informe bomba';
    if (formData.post === 'externo') {
      if (!formData.invoiceNumber) err.invoiceNumber = 'Informe nota';
      if (!formData.unitPrice) err.unitPrice = 'Informe preço';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* submit */
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    const newFiles = attachments.filter(f => f instanceof File); // só arquivos novos
    onSubmit(formData, newFiles);
    onClose();
  };

  /* --- JSX --- */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {selectedItem ? 'Editar Abastecimento' : 'Novo Abastecimento'}
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Box mt={2}>
            <Grid container spacing={3}>
              {/* veículo */}
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

              {/* combustível */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel>Combustível</FormLabel>
                  <RadioGroup
                    row
                    value={formData.fuelType}
                    onChange={handleFuelChange}
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

              {/* data/hora */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Data e hora"
                  value={formData.date}
                  onChange={e => handleInputChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.date}
                  helperText={errors.date}
                  required
                />
              </Grid>

              {/* posto */}
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

              {/* bomba OU nota+preço */}
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
                      label="Número da nota"
                      value={formData.invoiceNumber}
                      onChange={e =>
                        handleInputChange('invoiceNumber', e.target.value)
                      }
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
                      onChange={e =>
                        handleInputChange('unitPrice', e.target.value)
                      }
                      error={!!errors.unitPrice}
                      helperText={errors.unitPrice}
                      required
                    />
                  </Grid>
                </>
              )}

              {/* litros */}
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

              {/* quilometragem */}
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

              {/* observação */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observação"
                  value={formData.observation}
                  onChange={e =>
                    handleInputChange('observation', e.target.value)
                  }
                />
              </Grid>

              {/* anexos */}
              <Grid item xs={12}>
                <Typography variant="subtitle1">Anexos</Typography>
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
                    hidden
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                </Button>

                {attachments.length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <List dense>
                      {attachments.map((f, i) => (
                        <ListItem key={i} divider>
                          <ListItemIcon>
                            {f.type?.startsWith('image') ? (
                              <ImageIcon />
                            ) : f.type?.includes('pdf') ? (
                              <PdfIcon />
                            ) : (
                              <FileIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={f.name}
                            secondary={`${(f.size / 1024).toFixed(1)} KB`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton onClick={() => removeAttachment(i)}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>

              {/* ações */}
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
}
