import React, { useState, useRef } from "react";
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Input,
  TextField,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import { useTheme } from "@mui/material/styles";
import { RefuelingDialog } from "../components/Refueling/RefuelingDialog";
import { RefuelingCard } from "../components/Refueling/RefuelingCard";

export default function Refueling() {
  // Lista de abastecimentos salvos
  const [refuelings, setRefuelings] = useState([
    {
      id: 1,
      vehicle: "HHK1G29 - M. BENZ M. BENZ 710",
      fuelType: "DIESEL",
      date: "2022-11-03T00:00",
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
      vehicle: "OSY1H11 - M. BENZ M. BENZ ACELLO 815",
      fuelType: "ARLA",
      date: "2025-01-10T10:00",
      post: "externo",
      pump: "HAHA",
      invoiceNumber: "NF-123",
      unitPrice: 4.5,
      liters: 20,
      mileage: 42000,
      observation: "",
      signature: "",
      attachments: [],
    },
  ]);

  const initialRefueling = {
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

  // Controles do diálogo principal (novo/editar)
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Objeto abastecimento em edição
  const [newRefueling, setNewRefueling] = useState(initialRefueling);

  // Estado para anexos (no momento da criação/edição)
  const [attachments, setAttachments] = useState([]);

  // -- CONTROLES DE ASSINATURA --
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const signatureRef = useRef(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // --------------------------------------------------------------------------------
  // AÇÕES DE ABRIR/FECHAR DIÁLOGO
  // --------------------------------------------------------------------------------
  const handleOpenDialog = (item) => {
    if (item) {
      setSelectedItem(item);
      setIsEditing(true);
    } else {
      setIsEditing(false);
      setEditId(null);
      setNewRefueling(initialRefueling);
      setAttachments([]);
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedItem(null);
    setIsEditing(false);
    setEditId(null);
    setNewRefueling(initialRefueling);
    setAttachments([]);
  };

  const handleSave = () => {
    if (!attachments || attachments.length === 0) {
      alert("É obrigatório adicionar pelo menos um anexo!");
      return;
    }

    // Validação: precisa ter ASSINATURA
    if (!newRefueling.signature) {
      setOpenSignatureModal(true);
      return;
    }

    doFinalSave();
  };

  // Função que realmente salva (após validação e assinatura)
  const doFinalSave = () => {
    // Save the refueling

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

  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [postFilter, setPostFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredData = refuelings.filter((item) => {
    const searchMatch =
      item.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.observation.toLowerCase().includes(searchTerm.toLowerCase());

    const fuelMatch = fuelFilter === "" || item.fuelType === fuelFilter;

    const postMatch = postFilter === "" || item.post === postFilter;

    const itemDate = item.date.split("T")[0];

    const dateMatch =
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate);

    return searchMatch && fuelMatch && postMatch && dateMatch;
  });

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

      <div className="gap-4 my-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
        <TextField
          variant="outlined"
          placeholder="Pesquise um veículo:"
          className="lg:col-span-2 p-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={fuelFilter}
          onChange={(e) => setFuelFilter(e.target.value)}
          className="border p-4 h-fit rounded border-gray-300"
        >
          <option value="">Todos os combustíveis</option>
          <option value="DIESEL">DIESEL</option>
          <option value="ARLA">ARLA</option>
        </select>

        <select
          value={postFilter}
          onChange={(e) => setPostFilter(e.target.value)}
          className="border p-4 h-fit rounded border-gray-300"
        >
          <option value="">Todos os postos</option>
          <option value="interno">Interno</option>
          <option value="externo">Externo</option>
        </select>

        <div className="">
          <label className="block text-sm">Data inicial:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-3 h-fit w-full rounded border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm">Data final:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-3 h-fit w-full rounded border-gray-300"
          />
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {filteredData.map((refueling) => (
          <RefuelingCard
            key={refueling.id}
            refueling={refueling}
            handleOpenDialog={() => handleOpenDialog(refueling)}
          />
        ))}
      </div>

      <RefuelingDialog
        onClose={handleCloseDialog}
        open={open}
        selectedItem={selectedItem}
        onSubmit={handleSave}
      />

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
  );
}
