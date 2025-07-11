import React, { useEffect, useState } from "react";
import {
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
  InputLabel,
  Input,
  Autocomplete,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { InputError } from "../InputError";
import api from "../../services/apiFlask";
import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PictureAsPdfIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";

export function RefuelingDialog({ open, onClose, selectedItem, onSubmit }) {
  /* ───────────── state ───────────── */
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [attachments, setAttachments] = useState(selectedItem?.attachments ?? []);
  const [userRole, setUserRole] = useState("");
  const [kmLabel, setKmLabel] = useState("Quilometragem atual");

  /* ───────────── role ───────────── */
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) setUserRole(storedRole);
  }, []);

  const isAdmin = userRole === "admin";
  const isCreating = selectedItem?.id === undefined;
  const isDisabled = !isAdmin && !isCreating;

  /* ───────────── form ───────────── */
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const postValue = watch("post");
  const isInternal = postValue === "interno";
  const kmValue = watch("mileage");

  useEffect(() => {
    setKmLabel(kmValue ? "" : "Quilometragem atual");
  }, [kmValue]);

  /* ───────────── load vehicles ───────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/vehicles/available");
        setVehicles(data);
      } catch (err) {
        console.error("Erro ao buscar veículos:", err);
      }
    })();
  }, []);

  /* ───────────── open / edit ───────────── */
  useEffect(() => {
    if (!open) return;
    setSelectedVehicle(null);
    setAttachments(selectedItem?.attachments ?? []);
    setTimeout(() => {
      [
        "vehicle_id",
        "fuelType",
        "date",
        "invoiceNumber",
        "unitPrice",
        "liters",
        "mileage",
        "observation",
        "post",
        "pump",
      ].forEach((f) => setValue(f, selectedItem?.[f] ?? ""));
    });
  }, [open, selectedItem, setValue]);

  /* ───────────── handlers ───────────── */
  const handleClose = () => {
    setSelectedVehicle(null);
    reset();
    onClose();
  };

  const handleNumberField = (e, field) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join("")}`;
    setValue(field, value, { shouldValidate: true });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const upd = [...attachments, ...files];
    setAttachments(upd);
    // não enviamos attachments via react-hook-form; só validamos quantidade
    setValue("attachments", upd, { shouldValidate: true });
    e.target.value = "";
  };

  const onSubmitReal = (data) => {
    if (!data.vehicle_id) {
      alert("Selecione o veículo na lista antes de salvar.");
      return;
    }

    /*  ① Mantém anexos já salvos
        ② Envia apenas arquivos novos ao backend  */
    const newFiles = attachments.filter((f) => f instanceof File);
    onSubmit(data, newFiles);
  };

  /* ───────────── render ───────────── */
  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>
        {selectedItem?.id ? "Editar abastecimento" : "Novo abastecimento"}
      </DialogTitle>

      <DialogContent className="!pt-2 pb-6">
        <form
          onSubmit={handleSubmit(onSubmitReal)}
          className="w-full flex flex-col gap-6 md:grid grid-cols-2"
        >
          {/* ───────────────────────── veículo ───────────────────────── */}
          <Autocomplete
            className="col-span-2"
            readOnly={isDisabled}
            value={
              selectedVehicle ||
              vehicles.find((v) => v.id === watch("vehicle_id")) ||
              null
            }
            onChange={(_, newValue) => {
              const vObj = newValue || null;
              setSelectedVehicle(vObj);
              setValue("vehicle_id", vObj?.id || "", { shouldValidate: true });
              if (vObj?.quilometragem) setValue("mileage", vObj.quilometragem);
              setKmLabel("");
            }}
            options={vehicles}
            getOptionLabel={(opt) =>
              opt?.placa
                ? `${opt.placa} - ${opt.marca || ""} ${opt.modelo || ""}`
                : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Placa ou nome do Veículo"
                variant="outlined"
                error={!!errors.vehicle_id}
                helperText={errors.vehicle_id?.message}
              />
            )}
          />

          {/* ───────────────────────── combustível ───────────────────── */}
          <FormControl className="col-span-2">
            <FormLabel>Combustível</FormLabel>
            <Controller
              name="fuelType"
              control={control}
              disabled={isDisabled}
              rules={{ required: "Selecione o tipo de combustível" }}
              render={({ field }) => (
                <RadioGroup row {...field} value={field.value || ""}>
                  <FormControlLabel value="ARLA" control={<Radio />} label="ARLA" />
                  <FormControlLabel value="DIESEL" control={<Radio />} label="DIESEL" />
                </RadioGroup>
              )}
            />
            {errors.fuelType && <InputError>{errors.fuelType.message}</InputError>}
          </FormControl>

          {/* ───────────────────────── data ──────────────────────────── */}
          <FormControl className="col-span-2">
            <FormLabel htmlFor="date">Data do abastecimento</FormLabel>
            <Input
              type="datetime-local"
              readOnly={isDisabled}
              {...register("date", { required: "Insira a data do abastecimento" })}
            />
            {errors.date && <InputError>{errors.date.message}</InputError>}
          </FormControl>

          {/* ───────────────────────── posto ─────────────────────────── */}
          <FormControl className="col-span-2">
            <InputLabel id="post-label">Posto</InputLabel>
            <Controller
              name="post"
              control={control}
              disabled={isDisabled}
              rules={{ required: "Selecione se o posto é interno ou externo" }}
              render={({ field }) => (
                <Select {...field} labelId="post-label" label="Posto" value={field.value || ""}>
                  <MenuItem value="interno">Interno</MenuItem>
                  <MenuItem value="externo">Externo</MenuItem>
                </Select>
              )}
            />
            {errors.post && <InputError>{errors.post.message}</InputError>}
          </FormControl>

          {/* ───────────────────────── bomba (interno) ───────────────── */}
          {isInternal && (
            <FormControl>
              <InputLabel>Bomba</InputLabel>
              <Input
                readOnly={isDisabled}
                {...register("pump", { required: "Insira a bomba" })}
              />
              {errors.pump && <InputError>{errors.pump.message}</InputError>}
            </FormControl>
          )}

          {/* ───────────────────────── nota / preço (externo) ────────── */}
          {!isInternal && (
            <>
              <FormControl>
                <InputLabel htmlFor="invoiceNumber">Número da nota</InputLabel>
                <Input
                  disabled={isDisabled}
                  {...register("invoiceNumber", { required: "Insira o número da nota" })}
                />
                {errors.invoiceNumber && <InputError>{errors.invoiceNumber.message}</InputError>}
              </FormControl>

              <FormControl>
                <InputLabel htmlFor="unitPrice">Preço unitário</InputLabel>
                <Input
                  disabled={isDisabled}
                  {...register("unitPrice", { required: "Insira o preço unitário" })}
                  onChange={(e) => handleNumberField(e, "unitPrice")}
                />
                {errors.unitPrice && <InputError>{errors.unitPrice.message}</InputError>}
              </FormControl>
            </>
          )}

          {/* ───────────────────────── litros ────────────────────────── */}
          <FormControl className="self-end">
            <InputLabel htmlFor="liters">Litros abastecidos</InputLabel>
            <Input
              readOnly={isDisabled}
              {...register("liters", { required: "Insira quantos litros foram abastecidos" })}
              onChange={(e) => handleNumberField(e, "liters")}
            />
            {errors.liters && <InputError>{errors.liters.message}</InputError>}
          </FormControl>

          {/* ───────────────────────── quilometragem ─────────────────── */}
          <FormControl>
            <InputLabel htmlFor="mileage">{kmLabel}</InputLabel>
            <Input
              type="number"
              readOnly={isDisabled}
              {...register("mileage", {
                required: "Insira a quilometragem atual",
                min: {
                  value: selectedItem?.mileage,
                  message: "A quilometragem não pode ser menor que a atual",
                },
              })}
            />
            {errors.mileage && <InputError>{errors.mileage.message}</InputError>}
          </FormControl>

          {/* ───────────────────────── observação ────────────────────── */}
          <FormControl className="col-span-2">
            <InputLabel htmlFor="observation">Observação</InputLabel>
            <Input readOnly={isDisabled} {...register("observation")} />
          </FormControl>

          {/* ───────────────────────── anexos ────────────────────────── */}
          <FormControl className="col-span-2">
            <label htmlFor="attachments">
              <Button variant="contained" component="span" disabled={isDisabled}>
                Adicionar Arquivos
              </Button>
            </label>
            <Input
              id="attachments"
              type="file"
              sx={{ display: "none" }}
              onChange={handleFileChange}
              disabled={isDisabled}
              inputProps={{ multiple: true, accept: "image/*,application/pdf" }}
            />
            <Typography variant="caption">Necessário pelo menos 1</Typography>
          </FormControl>

          {/* ───────────────────────── lista anexos ──────────────────── */}
          {attachments.length > 0 && (
            <div className="col-span-2">
              <Typography variant="subtitle2" gutterBottom>
                Arquivos anexados:
              </Typography>

              <List dense className="w-full md:grid grid-cols-2 gap-4">
                {attachments.map((file, idx) => {
                  /* File novo × objeto da API */
                  const isNew = file instanceof File;
                  const isObj = !isNew && typeof file === "object";

                  const mime = isNew
                    ? file.type
                    : isObj
                      ? file.mimeType || ""
                      : "";

                  const icon =
                    mime.includes("image") ? (
                      <ImageIcon />
                    ) : mime.includes("pdf") ? (
                      <PictureAsPdfIcon />
                    ) : (
                      <InsertDriveFileIcon />
                    );

                  const displayName = isNew
                    ? file.name
                    : isObj
                      ? file.fileName
                      : String(file);

                  const sizeLabel = isNew ? `${(file.size / 1024).toFixed(2)} KB` : "";

                  return (
                    <ListItem
                      key={isObj ? file.id : idx}
                      secondaryAction={
                        !isDisabled && (
                          <IconButton
                            edge="end"
                            onClick={() => {
                              const upd = attachments.filter((_, i) => i !== idx);
                              setAttachments(upd);
                              setValue("attachments", upd, { shouldValidate: true });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                      sx={{
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                        mb: 1,
                        p: "8px 16px",
                      }}
                    >
                      <ListItemIcon>{icon}</ListItemIcon>
                      <ListItemText primary={displayName} secondary={sizeLabel} />
                    </ListItem>
                  );
                })}
              </List>
            </div>
          )}

          {/* campo oculto vehicle_id */}
          <input type="hidden" {...register("vehicle_id", { required: true })} />

          {/* ───────────────────────── ações ─────────────────────────── */}
          <div className="flex justify-end col-span-2">
            <DialogActions>
              <Button onClick={onClose}>Cancelar</Button>
              <Button variant="contained" type="submit" disabled={isDisabled}>
                Salvar
              </Button>
            </DialogActions>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
