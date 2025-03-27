import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

function PartsReplacementMaintenance() {

  // Lista de registros cadastrados
  const [records, setRecords] = useState([]);

  // Estado para o novo registro
  const [newRecord, setNewRecord] = useState({
    partCode: "",
    truck: "",
    truckPlate: "",
    mileage: "", // Campo de quilometragem
    installationDate: "",
    quantity: 1,
    partValue: "",
    includeLabor: false,
    laborValue: "",
    observation: "",
  });

  // Atualiza os campos do formulário de novo registro
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Função para registrar o novo dado
  const handleRegister = () => {
    if (
      !newRecord.partCode ||
      !newRecord.truck ||
      !newRecord.installationDate ||
      !newRecord.partValue ||
      !newRecord.mileage
    ) {
      alert(
        "Preencha os campos obrigatórios: Código da Peça, Caminhão, Quilometragem, Data de Instalação e Valor da Peça."
      );
      return;
    }
    if (newRecord.includeLabor && !newRecord.laborValue) {
      alert(
        'Preencha o valor da mão de obra ou desmarque "Incluir Mão de Obra".'
      );
      return;
    }
    if (newRecord.quantity <= 0) {
      alert("A quantidade de peças deve ser pelo menos 1.");
      return;
    }

    const id = records.length ? records[records.length - 1].id + 1 : 1;
    const partValue = parseFloat(newRecord.partValue) || 0;
    const laborValue = newRecord.includeLabor
      ? parseFloat(newRecord.laborValue) || 0
      : 0;
    const quantity = parseInt(newRecord.quantity, 10);
    const totalCost = partValue * quantity + laborValue;

    const recordToAdd = {
      id,
      partCode: newRecord.partCode,
      truck: newRecord.truck,
      truckPlate: newRecord.truckPlate,
      mileage: newRecord.mileage, // Incluído
      installationDate: newRecord.installationDate,
      quantity,
      partValue,
      laborValue,
      totalCost,
      observation: newRecord.observation,
    };

    setRecords((prev) => [...prev, recordToAdd]);

    // Limpa o formulário
    setNewRecord({
      partCode: "",
      truck: "",
      truckPlate: "",
      mileage: "", // Reset do campo
      installationDate: "",
      quantity: 1,
      partValue: "",
      includeLabor: false,
      laborValue: "",
      observation: "",
    });
  };


  const fields = [
    { label: "Código da Peça *", name: "partCode" },
    { label: "Caminhão *", name: "truck" },
    { label: "Placa do Caminhão", name: "truckPlate" },
    { label: "Quilometragem *", name: "mileage" },
    {
      label: "Data de Instalação *",
      name: "installationDate",
      type: "date",
      InputLabelProps: { shrink: true },
    },
    {
      label: "Quantidade",
      name: "quantity",
      type: "number",
      InputProps: { inputProps: { min: 1 } },
    },
    { label: "Valor da Peça (R$) *", name: "partValue", type: "number" },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Oficina – Troca de Peças
      </Typography>

      {/* Formulário para novo registro */}
      <Card>
        <CardContent>
          <h3 className="text-xl mb-4">Novo registro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field, index) => (
              <TextField
                key={index}
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type || "text"}
                value={newRecord[field.name]}
                onChange={handleChange}
                {...(field.InputLabelProps
                  ? { InputLabelProps: field.InputLabelProps }
                  : {})}
                {...(field.InputProps ? { InputProps: field.InputProps } : {})}
              />
            ))}
            <FormControlLabel
              className="col-span-full"
              control={
                <Checkbox
                  name="includeLabor"
                  checked={newRecord.includeLabor}
                  onChange={handleChange}
                />
              }
              label="Incluir Mão de Obra"
            />
            {newRecord.includeLabor && (
              <TextField
                className="col-span-full"
                label="Valor da Mão de Obra (R$)"
                type="number"
                name="laborValue"
                value={newRecord.laborValue}
                onChange={handleChange}
              />
            )}
            <TextField
              className="col-span-full"
              label="Observação"
              name="observation"
              value={newRecord.observation}
              onChange={handleChange}
              multiline
              minRows={2}
            />
            <div className="col-span-full flex justify-end">
              <Button variant="contained" onClick={handleRegister}>
                Registrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </Box>
  );
}

export default PartsReplacementMaintenance;
