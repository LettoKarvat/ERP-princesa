// src/pages/Refueling.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  TextField,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import { useTheme } from "@mui/material/styles";
import { RefuelingDialog } from "../components/Refueling/RefuelingDialog";
import { RefuelingCard } from "../components/Refueling/RefuelingCard";
import {
  fetchRefuelings,
  createRefueling,
  updateRefueling,
} from "../services/refuelingService";

export default function Refueling() {
  const [refuelings, setRefuelings] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formDataState, setFormDataState] = useState({
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
    signature: "",
  });
  const [dialogAttachments, setDialogAttachments] = useState([]);
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const signatureRef = useRef(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchRefuelings().then(data => setRefuelings(data));
  }, []);

  function handleOpenDialog(item) {
    if (item) {
      setSelectedItem(item);
      setIsEditing(true);
      setFormDataState({
        vehicle: item.vehicle_id,
        fuelType: item.fuelType,
        date: item.date,
        post: item.post,
        pump: item.pump || "",
        invoiceNumber: item.invoiceNumber || "",
        unitPrice: item.unitPrice || 0,
        liters: item.liters,
        mileage: item.mileage,
        observation: item.observation || "",
        signature: item.signatureUrl || "",
      });
    } else {
      setSelectedItem(null);
      setIsEditing(false);
      setFormDataState({
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
        signature: "",
      });
    }
    setDialogAttachments([]);
    setOpenDialog(true);
  }

  function handleCloseDialog() {
    setOpenDialog(false);
    setIsEditing(false);
    setSelectedItem(null);
    setDialogAttachments([]);
  }

  // recebe do diálogo: data = campos, atchs = arquivos
  function handleSave(data, atchs) {
    console.log("handleSave:", { data, attachments: atchs });
    if (!atchs?.length) {
      alert("É obrigatório adicionar pelo menos um anexo!");
      return;
    }
    setFormDataState(prev => ({ ...prev, ...data }));
    setDialogAttachments(atchs);

    if (!formDataState.signature) {
      setOpenSignatureModal(true);
    } else {
      doFinalSave(data, atchs);
    }
  }

  function doFinalSave(data, atchs) {
    const token = localStorage.getItem("access_token");
    console.log("JWT being sent:", token);

    const fd = new FormData();
    fd.append("vehicle_id", data.vehicle);
    fd.append("fuel_type", data.fuelType);
    fd.append("date", data.date);
    fd.append("post", data.post);
    fd.append("pump", data.pump);
    fd.append("invoice_number", data.invoiceNumber);
    fd.append("unit_price", data.unitPrice);
    fd.append("liters", data.liters);
    fd.append("mileage", data.mileage);
    fd.append("observation", data.observation);

    fetch(formDataState.signature)
      .then(res => res.blob())
      .then(blob => {
        fd.append("signature", blob, "signature.png");
        atchs.forEach(file => fd.append("attachments", file, file.name));

        const action = isEditing
          ? updateRefueling(selectedItem.id, fd, true)
          : createRefueling(fd);

        action
          .then(() => {
            console.log("Upload successful");
            fetchRefuelings().then(setRefuelings);
            handleCloseDialog();
          })
          .catch(err => {
            console.error("Upload error:", err);
            console.error("Request headers were:", err.config?.headers);
            alert("Erro ao salvar abastecimento: " + (err.response?.data?.error || err.message));
          });
      });
  }

  function handleConfirmSignature() {
    if (signatureRef.current.isEmpty()) {
      alert("Por favor, faça a assinatura antes de confirmar.");
      return;
    }
    const sigDataUrl = signatureRef.current.toDataURL();
    setFormDataState(prev => ({ ...prev, signature: sigDataUrl }));
    setOpenSignatureModal(false);
    doFinalSave(formDataState, dialogAttachments);
  }

  // filtros...
  const [searchTerm, setSearchTerm] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredData = refuelings.filter(item => {
    const vehicleMatch = item.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase());
    const fuelMatch = !fuelFilter || item.fuelType === fuelFilter;
    const dateOnly = item.date.split("T")[0];
    const dateMatch =
      (!startDate || dateOnly >= startDate) &&
      (!endDate || dateOnly <= endDate);
    return vehicleMatch && fuelMatch && dateMatch;
  });

  return (
    <>
      <div className="py-8 w-full flex justify-between px-4">
        <Typography variant="h4">Abastecimentos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(null)}
        >
          Novo abastecimento
        </Button>
      </div>

      {/* filtros */}
      <div className="gap-4 my-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
        <TextField
          variant="outlined"
          placeholder="Pesquise um veículo:"
          className="lg:col-span-2 p-4"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          value={fuelFilter}
          onChange={e => setFuelFilter(e.target.value)}
          className="border p-4 h-fit rounded border-gray-300"
        >
          <option value="">Todos os combustíveis</option>
          <option value="DIESEL">DIESEL</option>
          <option value="ARLA">ARLA</option>
        </select>
        <div>
          <label className="block text-sm">Data inicial:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border p-3 h-fit w-full rounded border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm">Data final:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border p-3 h-fit w-full rounded border-gray-300"
          />
        </div>
      </div>

      {/* cards */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {filteredData.map(ref => (
          <RefuelingCard
            key={ref.id}
            refueling={ref}
            handleOpenDialog={() => handleOpenDialog(ref)}
          />
        ))}
      </div>

      {/* diálogo de formulário */}
      <RefuelingDialog
        open={openDialog}
        selectedItem={selectedItem}
        onClose={handleCloseDialog}
        onSubmit={handleSave}
      />

      {/* modal de assinatura */}
      <Dialog
        open={openSignatureModal}
        onClose={() => setOpenSignatureModal(false)}
        fullScreen={fullScreen}
      >
        <DialogTitle>Assinatura</DialogTitle>
        <DialogContent dividers>
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              width: fullScreen ? window.innerWidth - 20 : 400,
              height: 200,
            }}
          />
          <Button onClick={() => signatureRef.current.clear()} sx={{ mt: 1 }}>
            Limpar
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignatureModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmSignature}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
