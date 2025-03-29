import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
} from "@mui/material";

export function RefuelingDialog({
  open,
  onClose,
  selectedItem,
  isEditing = false,
  handleSave,
}) {
  const isInternal = selectedItem?.post === "interno";

  const [attachments, setAttachments] = useState([]);

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    setAttachments(Array.from(e.target.files));
  };

  const [newRefueling, setNewRefueling] = useState(initialRefueling);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRefueling((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {isEditing ? "Editar Abastecimento" : "Novo Abastecimento"}
      </DialogTitle>

      <DialogContent
        dividers
        className="md:grid md:grid-cols-2 gap-4 *:self-center *:w-full flex flex-col "
      >
        {/* Veículo */}
        <TextField
          margin="dense"
          name="vehicle"
          label="Veículo"
          placeholder="Placa ou nome do veículo"
          InputLabelProps={{ shrink: true }}
          value={selectedItem?.vehicle}
          onChange={handleChange}
          className="md:col-span-2"
        />

        {/* Combustível e Data */}
        <FormControl component="fieldset" className="col-span-2">
          <FormLabel component="legend">Combustível</FormLabel>
          <RadioGroup
            row
            className="gap-8"
            name="fuelType"
            value={selectedItem?.fuelType}
            onChange={handleChange}
          >
            <FormControlLabel
              value="DIESEL"
              control={<Radio />}
              label="DIESEL"
              size=""
            />
            <FormControlLabel value="ARLA" control={<Radio />} label="ARLA" />
          </RadioGroup>
        </FormControl>

        <TextField
          margin="dense"
          name="date"
          label="Data de Abastecimento"
          type="datetime-local"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={selectedItem?.date}
          onChange={handleChange}
        />

        {/* Posto (interno/externo) */}
        <FormControl>
          <Select
            name="post"
            margin="dense"
            value={selectedItem?.post}
            onChange={handleChange}
            displayEmpty
          >
            <MenuItem value="interno">Interno</MenuItem>
            <MenuItem value="externo">Externo</MenuItem>
          </Select>
        </FormControl>

        {/* Se for interno: exibe campo bomba */}
        {isInternal && (
          <TextField
            margin="dense"
            label="Bomba"
            name="pump"
            value={selectedItem?.pump}
            onChange={handleChange}
          />
        )}

        {/* Se for externo: exibe campos de nota e preço */}
        {!isInternal && (
          <>
            <TextField
              margin="dense"
              name="invoiceNumber"
              label="Número da Nota"
              value={selectedItem?.invoiceNumber}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="unitPrice"
              label="Preço Unitário (R$)"
              type="number"
              value={selectedItem?.unitPrice}
              onChange={handleChange}
            />
          </>
        )}

        {/* Litros abastecidos e KM */}
        <TextField
          margin="dense"
          name="liters"
          label="Litros Abastecidos"
          type="number"
          value={selectedItem?.liters}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="mileage"
          label="KM Atual"
          type="number"
          value={selectedItem?.mileage}
          onChange={handleChange}
        />

        {/* Observação */}
        <TextField
          className="col-span-2"
          margin="dense"
          name="observation"
          label="Observação"
          multiline
          minRows={2}
          fullWidth
          value={selectedItem?.observation}
          onChange={handleChange}
        />

        {/* Seção de Anexos */}
        <Box>
          <Typography variant="subtitle1">
            Anexos (obrigatório pelo menos um)
          </Typography>
          <input
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            id="attachment-upload"
            multiple
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="attachment-upload">
            <Button variant="contained" component="span">
              Adicionar Arquivos
            </Button>
          </label>
          {attachments.length > 0 && (
            <Box>
              {attachments.map((file, index) => (
                <Typography key={index} variant="body2">
                  {file.name || file}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
