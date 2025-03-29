import React, { useState, useRef } from "react";
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
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

  // --------------------------------------------------------------------------------
  // HANDLES DO FORMULÁRIO
  // --------------------------------------------------------------------------------

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

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        {refuelings.map((refueling) => (
          <RefuelingCard
            key={refueling.id}
            refueling={refueling}
            handleOpenDialog={() => handleOpenDialog(refueling)}
          />
        ))}
      </div>

      <RefuelingDialog
        handleSave={handleSave}
        onClose={handleCloseDialog}
        open={open}
        selectedItem={selectedItem}
        isEditing={isEditing}
        handleChange={handleChange}
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
