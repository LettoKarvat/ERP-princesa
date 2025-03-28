import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  useMediaQuery,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import SignatureCanvas from "react-signature-canvas";
import { useTheme } from "@mui/material/styles";

export default function Refueling() {
  // Lista de abastecimentos salvos
  const [refuelings, setRefuelings] = useState([
    {
      id: 1,
      vehicle: "HHK1G29",
      fuelType: "DIESEL",
      date: "2025-01-02T15:20",
      post: "interno",
      pump: "B1",
      invoiceNumber: "",
      unitPrice: 0,
      liters: 107,
      mileage: 376918,
      observation: "Tanque cheio",
      signature: "", // Assinatura do motorista
      attachments: [], // Anexos
    },
    {
      id: 2,
      vehicle: "ABC1234",
      fuelType: "ARLA",
      date: "2025-01-10T10:00",
      post: "externo",
      pump: "",
      invoiceNumber: "NF-123",
      unitPrice: 4.5,
      liters: 20,
      mileage: 42000,
      observation: "",
      signature: "",
      attachments: [],
    },
  ]);

  // Controles do diálogo principal (novo/editar)
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Objeto abastecimento em edição
  const [newRefueling, setNewRefueling] = useState(initialRefueling());

  // Estado para anexos (no momento da criação/edição)
  const [attachments, setAttachments] = useState([]);

  // -- CONTROLES DE ASSINATURA --
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const signatureRef = useRef(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // --------------------------------------------------------------------------------
  // UPLOAD DE ARQUIVOS (ANEXOS)
  // --------------------------------------------------------------------------------
  const handleFileChange = (e) => {
    if (!e.target.files) return;
    setAttachments(Array.from(e.target.files));
  };

  // --------------------------------------------------------------------------------
  // EXPORTAR PARA EXCEL
  // --------------------------------------------------------------------------------
  const exportToExcel = () => {
    // Definindo os títulos das colunas em português
    const headers = [
      "Veículo",
      "Combustível",
      "Data",
      "Posto",
      "Bomba",
      "Nota",
      "Preço Unitário",
      "Litros",
      "KM",
      "Observação",
      "Assinatura",
      "Anexos",
    ];

    // Monta os dados (array de arrays)
    const data = [headers];
    refuelings.forEach((r) => {
      data.push([
        r.vehicle,
        r.fuelType,
        r.date,
        r.post,
        r.pump,
        r.invoiceNumber,
        r.unitPrice,
        r.liters,
        r.mileage,
        r.observation,
        r.signature ? "Sim" : "Não",
        r.attachments.map((f) => f.name || f).join(", "),
      ]);
    });

    // Cria a worksheet a partir do array de arrays
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Aplica formatação simples nos cabeçalhos (primeira linha)
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
      };
    }

    // Define larguras para as colunas (em pixels)
    worksheet["!cols"] = [
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 120 },
      { wpx: 80 },
      { wpx: 80 },
      { wpx: 80 },
      { wpx: 120 },
      { wpx: 80 },
      { wpx: 80 },
      { wpx: 150 },
      { wpx: 90 },
      { wpx: 160 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Abastecimentos");
    XLSX.writeFile(workbook, "registros_abastecimentos.xlsx");
  };

  // --------------------------------------------------------------------------------
  // COLUNAS DO DATA GRID
  // --------------------------------------------------------------------------------
  const columns = [
    { field: "vehicle", headerName: "Veículo", width: 130 },
    { field: "fuelType", headerName: "Combustível", width: 120 },
    {
      field: "date",
      headerName: "Data",
      width: 160,
    },
    { field: "post", headerName: "Posto", width: 100 },
    { field: "pump", headerName: "Bomba", width: 90 },
    { field: "invoiceNumber", headerName: "Nota", width: 90 },
    {
      field: "unitPrice",
      headerName: "Preço Un.",
      width: 90,
      valueFormatter: (params) => (params.value ? `R$ ${params.value}` : ""),
    },
    { field: "liters", headerName: "Litros", width: 80 },
    { field: "mileage", headerName: "KM", width: 100 },
    {
      field: "observation",
      headerName: "Observação",
      width: 150,
      flex: 1,
    },
    {
      field: "signature",
      headerName: "Assinatura",
      width: 100,
      renderCell: (params) => (params.value ? "OK" : "Falta"),
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 130,
      renderCell: (params) => (
        <>
          <Tooltip title="Editar">
            <IconButton
              color="primary"
              onClick={() => handleEdit(params.row.id)}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row.id)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  // --------------------------------------------------------------------------------
  // AÇÕES DE ABRIR/FECHAR DIÁLOGO
  // --------------------------------------------------------------------------------
  const handleOpenDialog = () => {
    setIsEditing(false);
    setEditId(null);
    setNewRefueling(initialRefueling());
    setAttachments([]);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  // --------------------------------------------------------------------------------
  // EDIÇÃO E EXCLUSÃO
  // --------------------------------------------------------------------------------
  const handleEdit = (id) => {
    const refuelToEdit = refuelings.find((r) => r.id === id);
    if (!refuelToEdit) return;

    setIsEditing(true);
    setEditId(id);
    setNewRefueling({
      vehicle: refuelToEdit.vehicle,
      fuelType: refuelToEdit.fuelType,
      date: refuelToEdit.date,
      post: refuelToEdit.post,
      pump: refuelToEdit.pump,
      invoiceNumber: refuelToEdit.invoiceNumber,
      unitPrice: refuelToEdit.unitPrice,
      liters: refuelToEdit.liters,
      mileage: refuelToEdit.mileage,
      observation: refuelToEdit.observation,
      signature: refuelToEdit.signature, // Carrega a assinatura já existente
    });
    setAttachments(refuelToEdit.attachments || []);
    setOpen(true);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("Deseja excluir este abastecimento?");
    if (!confirmed) return;
    setRefuelings((prev) => prev.filter((r) => r.id !== id));
  };

  // --------------------------------------------------------------------------------
  // HANDLES DO FORMULÁRIO
  // --------------------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRefueling((prev) => ({ ...prev, [name]: value }));
  };

  // --------------------------------------------------------------------------------
  // SALVAR (NOVO OU EDIÇÃO)
  // --------------------------------------------------------------------------------
  const handleSave = () => {
    // Validações básicas
    if (!newRefueling.vehicle.trim()) {
      alert("Informe o veículo!");
      return;
    }
    if (!newRefueling.date) {
      alert("Informe a data!");
      return;
    }
    if (!newRefueling.liters) {
      alert("Informe a quantidade de litros!");
      return;
    }

    // Validação: precisa ter ANEXOS
    if (!attachments || attachments.length === 0) {
      alert("É obrigatório adicionar pelo menos um anexo!");
      return;
    }

    // Validação: precisa ter ASSINATURA
    if (!newRefueling.signature) {
      // Se não houver assinatura, abre modal para assinar
      setOpenSignatureModal(true);
      return;
    }

    // Se estiver tudo certo, salva
    doFinalSave();
  };

  // Função que realmente salva (após validação e assinatura)
  const doFinalSave = () => {
    if (isEditing && editId != null) {
      // Modo edição
      setRefuelings((prev) =>
        prev.map((r) =>
          r.id === editId
            ? {
                ...r,
                ...newRefueling,
                liters: Number(newRefueling.liters),
                mileage: Number(newRefueling.mileage),
                unitPrice: Number(newRefueling.unitPrice),
                attachments: attachments, // Salva anexos
              }
            : r
        )
      );
    } else {
      // Novo abastecimento
      const newId = refuelings.length
        ? refuelings[refuelings.length - 1].id + 1
        : 1;
      const recordToAdd = {
        id: newId,
        ...newRefueling,
        liters: Number(newRefueling.liters),
        mileage: Number(newRefueling.mileage),
        unitPrice: Number(newRefueling.unitPrice),
        attachments: attachments,
      };
      setRefuelings((prev) => [...prev, recordToAdd]);
    }

    console.log("Arquivos anexados:", attachments);

    setOpen(false);
  };

  // --------------------------------------------------------------------------------
  // HANDLES DE ASSINATURA (CHAMADO AO TENTAR SALVAR)
  // --------------------------------------------------------------------------------
  const handleCloseSignature = () => {
    setOpenSignatureModal(false);
  };

  const handleConfirmSignature = () => {
    if (signatureRef.current && signatureRef.current.isEmpty()) {
      alert("Por favor, faça a assinatura antes de confirmar.");
      return;
    }
    const signatureDataUrl = signatureRef.current.toDataURL();

    // Salva no estado do abastecimento atual
    setNewRefueling((prev) => ({ ...prev, signature: signatureDataUrl }));

    // Fecha modal
    setOpenSignatureModal(false);

    // Agora que temos a assinatura, finalizamos o save
    doFinalSave();
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  // Verifica se é posto interno ou externo para renderizar campos específicos
  const isInternal = newRefueling.post === "interno";
  const isExternal = newRefueling.post === "externo";

  return (
    <>
      <Typography variant="h4">Abastecimentos</Typography>

      <div className="py-8 w-full flex justify-end px-4">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Novo abastecimento
        </Button>
      </div>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? "Editar Abastecimento" : "Novo Abastecimento"}
        </DialogTitle>
        <DialogContent dividers className="grid grid-cols-2 gap-4">
          {/* Veículo */}
          <TextField
            margin="dense"
            name="vehicle"
            label="Veículo (Placa ou Nome)"
            value={newRefueling.vehicle}
            onChange={handleChange}
            className="col-span-2"
          />

          {/* Combustível e Data */}
          <FormControl component="fieldset" className="col-span-2">
            <FormLabel component="legend">Combustível</FormLabel>
            <RadioGroup
              className="flex"
              name="fuelType"
              value={newRefueling.fuelType}
              onChange={handleChange}
            >
              <FormControlLabel
                value="DIESEL"
                control={<Radio />}
                label="DIESEL"
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
            value={newRefueling.date}
            onChange={handleChange}
          />

          {/* Posto (interno/externo) */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              name="post"
              value={newRefueling.post}
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
              name="pump"
              label="Bomba"
              fullWidth
              value={newRefueling.pump}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          )}

          {/* Se for externo: exibe campos de nota e preço */}
          {isExternal && (
            <>
              <TextField
                margin="dense"
                name="invoiceNumber"
                label="Número da Nota"
                fullWidth
                value={newRefueling.invoiceNumber}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="unitPrice"
                label="Preço Unitário (R$)"
                type="number"
                fullWidth
                value={newRefueling.unitPrice}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
            </>
          )}

          {/* Litros abastecidos e KM */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="liters"
              label="Litros Abastecidos"
              type="number"
              fullWidth
              value={newRefueling.liters}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="mileage"
              label="KM Atual"
              type="number"
              fullWidth
              value={newRefueling.mileage}
              onChange={handleChange}
            />
          </Box>

          {/* Observação */}
          <TextField
            margin="dense"
            name="observation"
            label="Observação"
            multiline
            minRows={2}
            fullWidth
            value={newRefueling.observation}
            onChange={handleChange}
          />

          {/* Seção de Anexos */}
          <Box sx={{ mt: 2 }}>
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
              <Box sx={{ mt: 1 }}>
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
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE ASSINATURA (chamado se não tiver assinatura no momento do Save) */}
      <Dialog
        open={openSignatureModal}
        onClose={handleCloseSignature}
        fullScreen={fullScreen}
      >
        <DialogTitle>Assinatura</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Por favor, assine abaixo:
          </Typography>
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              width: fullScreen ? window.innerWidth - 20 : 400,
              height: 200,
              className: "sigCanvas",
            }}
          />
          <Button onClick={handleClearSignature} sx={{ mt: 1 }}>
            Limpar Assinatura
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignature}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmSignature}>
            Confirmar Assinatura
          </Button>
        </DialogActions>
      </Dialog>
    </>
    //   </Box>
  );
}

// Função que devolve um objeto “limpo” para criar abastecimento
function initialRefueling() {
  return {
    vehicle: "",
    fuelType: "DIESEL",
    date: "",
    post: "interno",
    pump: "",
    invoiceNumber: "",
    unitPrice: 0,
    liters: "",
    mileage: "",
    observation: "",
    signature: "", // Campo para armazenar a assinatura
    attachments: [], // Campo para armazenar anexos
  };
}
