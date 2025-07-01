// src/pages/Refueling.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import { useTheme } from "@mui/material/styles";

import { RefuelingDialog } from "../components/Refueling/RefuelingDialog";
import RefuelingCard from "../components/Refueling/RefuelingCard";
import RefuelingDetails from "../components/Refueling/RefuelingDetails";

import {
  fetchRefuelings,
  createRefueling,
  updateRefueling,
  deleteRefueling,        // ← import adicionado
  fetchProductStock,
} from "../services/refuelingService";

export default function Refueling() {
  /* ───── estados principais ───── */
  const [refuelings, setRefuelings] = useState([]);
  const [selectedItem, setSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  /* anexos + assinatura */
  const [formState, setFormState] = useState({});
  const [dialogFiles, setDialogFiles] = useState([]);
  const [openSignature, setOpenSignature] = useState(false);
  const sigRef = useRef(null);

  /* detalhes */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  /* filtros */
  const [search, setSearch] = useState("");
  const [fuel, setFuel] = useState("");
  const [dIni, setDIni] = useState("");
  const [dFim, setDFim] = useState("");

  /* estoques */
  const [stockDiesel, setStockDiesel] = useState(0);
  const [stockArla, setStockArla] = useState(0);

  /* layout helper */
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  /* ───── carregar lista + estoques ───── */
  useEffect(() => {
    fetchRefuelings().then(setRefuelings);

    fetchProductStock([33940, 34345])
      .then(rows => {
        rows.forEach(r => {
          if (r.CODPROD === 33940) setStockDiesel(r.QTESTGER);
          if (r.CODPROD === 34345) setStockArla(r.QTESTGER);
        });
      })
      .catch(err => console.error("Falha ao buscar estoque:", err));
  }, []);

  /* ───── handler de exclusão ───── */
  const handleDelete = async (id) => {
    if (!window.confirm("Confirma exclusão deste abastecimento?")) return;
    try {
      await deleteRefueling(id);
      const updated = await fetchRefuelings();
      setRefuelings(updated);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir: " + (err.response?.data?.error || err.message));
    }
  };

  /* ───── filtro de pesquisa ───── */
  const normalize = (s = "") =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const dataFiltered = refuelings.filter(r => {
    const label = r.vehicleLabel || r.vehicle_id;
    const vMatch = normalize(label).includes(normalize(search));
    const fMatch = !fuel || r.fuelType === fuel;
    const d = r.date.split("T")[0];
    const dMatch = (!dIni || d >= dIni) && (!dFim || d <= dFim);
    return vMatch && fMatch && dMatch;
  });

  /* ───── abrir/fechar formulário ───── */
  function openForm(item = null) {
    if (item) {
      setIsEditing(true);
      setSelected(item);
      setFormState({
        vehicle_id: item.vehicle_id,
        fuelType: item.fuelType,
        date: item.date.split("T")[0],
        post: item.post,
        pump: item.pump || "",
        invoiceNumber: item.invoiceNumber || "",
        unitPrice: item.unitPrice || "",
        liters: item.liters,
        mileage: item.mileage,
        observation: item.observation || "",
        signature: item.signatureUrl || "",
      });
    } else {
      setIsEditing(false);
      setSelected(null);
      setFormState({
        vehicle_id: "",
        fuelType: "DIESEL",
        date: "",
        post: "interno",
        pump: "",
        invoiceNumber: "",
        unitPrice: "",
        liters: "",
        mileage: "",
        observation: "",
        signature: "",
      });
    }
    setDialogFiles([]);
    setOpenDialog(true);
  }
  function closeForm() {
    setOpenDialog(false);
    setIsEditing(false);
    setSelected(null);
    setDialogFiles([]);
    setFormState({});
  }

  /* ───── salvar ───── */
  function handleSave(data, newFiles) {
    const persisted = isEditing ? (selectedItem?.attachments?.length || 0) : 0;
    if (persisted === 0 && newFiles.length === 0)
      return alert("Anexe pelo menos um arquivo.");
    if (data.post === "interno" && !data.pump)
      return alert("Informe a bomba.");
    if (data.post === "externo" && (!data.invoiceNumber || !data.unitPrice))
      return alert("Informe nota e preço.");

    setFormState({ ...data });
    setDialogFiles(newFiles);
    if (!data.signature) setOpenSignature(true);
    else doSave(data, newFiles, data.signature);
  }
  async function doSave(payload, files, sigUrl) {
    try {
      const sigBlob = sigUrl?.startsWith("data:")
        ? await fetch(sigUrl).then(r => r.blob())
        : null;
      if (isEditing)
        await updateRefueling(selectedItem.id, payload, files, sigBlob);
      else
        await createRefueling(payload, files, sigBlob);

      const updated = await fetchRefuelings();
      setRefuelings(updated);
      closeForm();
    } catch (err) {
      console.error(err);
      alert("Erro: " + (err.response?.data?.error || err.message));
    }
  }

  /* ───── assinatura ───── */
  const confirmSignature = () => {
    if (sigRef.current.isEmpty())
      return alert("Assine antes de confirmar.");
    const url = sigRef.current.toDataURL();
    setOpenSignature(false);
    doSave(formState, dialogFiles, url);
  };

  /* ───── detalhes ───── */
  const openDetails = item => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  return (
    <>
      {/* cabeçalho */}
      <div className="flex justify-between py-8 px-4">
        <Typography variant="h4">Abastecimentos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openForm()}
        >
          Novo abastecimento
        </Button>
      </div>

      {/* exibição de estoque */}
      <div className="px-4 mb-4">
        <Typography variant="subtitle1">
          Estoque Atual →
          <strong className="ml-2">Diesel:</strong> {stockDiesel} L |{" "}
          <strong className="ml-2">Arla:</strong> {stockArla} L
        </Typography>
      </div>

      {/* filtros */}
      <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end px-4">
        <TextField
          label="Pesquisar veículo"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="lg:col-span-2"
        />
        <TextField
          select
          label="Combustível"
          value={fuel}
          onChange={e => setFuel(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="DIESEL">DIESEL</MenuItem>
          <MenuItem value="ARLA">ARLA</MenuItem>
        </TextField>
        <TextField
          type="date"
          label="Início"
          InputLabelProps={{ shrink: true }}
          value={dIni}
          onChange={e => setDIni(e.target.value)}
        />
        <TextField
          type="date"
          label="Fim"
          InputLabelProps={{ shrink: true }}
          value={dFim}
          onChange={e => setDFim(e.target.value)}
        />
      </div>

      {/* lista de cards */}
      <div className="grid gap-4 mb-10 px-4 grid-cols-1 lg:grid-cols-2">
        {dataFiltered.map(r => (
          <RefuelingCard
            key={r.id}
            refueling={r}
            onEdit={() => openForm(r)}
            onDetails={() => openDetails(r)}
            onDelete={() => handleDelete(r.id)}  // ← prop adicionada
          />
        ))}
      </div>

      {/* CRUD dialog */}
      <RefuelingDialog
        open={openDialog}
        selectedItem={selectedItem}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      {/* detalhes */}
      <RefuelingDetails
        item={detailItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

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
          <Button variant="contained" onClick={confirmSignature}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
