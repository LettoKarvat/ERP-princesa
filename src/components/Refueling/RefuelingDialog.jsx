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
import { getAllVeiculos } from "../../services/vehicleService";
import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PictureAsPdfIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";

export function RefuelingDialog({ open, onClose, selectedItem, onSubmit }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [attachments, setAttachments] = useState(
    selectedItem?.attachments ?? []
  );
  const [userRole, setUserRole] = useState("");
  const [kmLabel, setKmLabel] = useState("Quilometragem atual");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) setUserRole(storedRole);
  }, []);

  const isAdmin = userRole === "admin";
  const isCreating = selectedItem?.id === undefined;

  const isDisabled = !isAdmin && !isCreating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmitReal = (data) => {
    // Do something with the data
    console.table(data);

    onSubmit();
  };

  const postValue = watch("post");
  const isInternal = postValue === "interno";

  const kmValue = watch("mileage");

  useEffect(() => {
    !kmValue ? setKmLabel("Quilometragem atual") : setKmLabel("");
  }, [kmValue]);

  useEffect(() => {
    const getVehicles = async () => {
      try {
        const vehiclesData = await getAllVeiculos();
        setVehicles(vehiclesData);
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
      }
    };

    getVehicles();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setValue("vehicle", selectedItem?.vehicle);
      setValue("fuelType", selectedItem?.fuelType);
      setValue("date", selectedItem?.date);
      setValue("invoiceNumber", selectedItem?.invoiceNumber);
      setValue("unitPrice", selectedItem?.unitPrice);
      setValue("liters", selectedItem?.liters);
      setValue("mileage", selectedItem?.mileage);
      setValue("observation", selectedItem?.observation);
      setValue("post", selectedItem?.post);
    });
  }, [setValue, open]);

  const handleClose = () => {
    setSelectedVehicle(null);
    reset();

    onClose();
  };

  const handleNumberField = (e, field) => {
    let value = e.target.value;

    // Permitir apenas números e ponto (para decimais)
    value = value.replace(/[^0-9.]/g, "");

    // Evitar múltiplos pontos seguidos
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    setValue(field, value, { shouldValidate: true });
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;

    setAttachments((prev) => [...prev, ...Array.from(e.target.files)]);

    setValue("attachments", attachments);
  };

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
          <Autocomplete
            className="col-span-2"
            freeSolo
            value={selectedItem?.vehicle ?? selectedVehicle}
            onChange={(e, newValue) => {
              if (typeof newValue === "string") {
                setSelectedVehicle(null);
              } else if (newValue && newValue.placa) {
                setSelectedVehicle(newValue);
              } else {
                setSelectedVehicle(null);
              }

              setKmLabel("");
              setValue("mileage", newValue?.quilometragem);
            }}
            onInputChange={(event, newInputValue) => {
              setSelectedVehicle(null);
            }}
            options={vehicles}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.placa
                ? `${option.placa} - ${option.marca || ""} ${
                    option.modelo || ""
                  }`
                : "";
            }}
            renderInput={(params) => (
              <>
                <TextField
                  {...params}
                  disabled={isDisabled}
                  label="Placa ou nome do Veículo"
                  variant="outlined"
                  {...register("vehicle", {
                    required: "Insira o nome ou a placa do veículo",
                  })}
                  aria-describedby="vehicle"
                />
                {errors.vehicle && (
                  <InputError>{errors.vehicle.message}</InputError>
                )}
              </>
            )}
          />

          <FormControl className="col-span-2">
            <FormLabel component="legend">Combustível</FormLabel>

            <Controller
              name="fuelType"
              control={control}
              disabled={isDisabled}
              rules={{ required: "Selecione o tipo de combustível" }}
              render={({ field }) => (
                <RadioGroup row {...field} value={field.value || ""}>
                  <FormControlLabel
                    value="ARLA"
                    control={<Radio />}
                    label="ARLA"
                  />
                  <FormControlLabel
                    value="DIESEL"
                    control={<Radio />}
                    label="DIESEL"
                  />
                </RadioGroup>
              )}
            />

            {errors.fuelType && (
              <InputError>{errors.fuelType.message}</InputError>
            )}
          </FormControl>

          <FormControl className="col-span-2">
            <FormLabel component="legend" htmlFor="date">
              Data do abastecimento
            </FormLabel>
            <Input
              type="datetime-local"
              disabled={isDisabled}
              {...register("date", {
                required: "Insira a data do abastecimento",
              })}
              aria-describedby="date"
            />
            {errors.date && <InputError>{errors.date.message}</InputError>}
          </FormControl>

          <FormControl className="col-span-2">
            <InputLabel htmlFor="post">Posto</InputLabel>

            <Controller
              name="post"
              disabled={isDisabled}
              control={control}
              rules={{ required: "Selecione se o posto é interno ou externo" }}
              render={({ field }) => (
                <Select {...field} value={field.value || ""}>
                  <MenuItem value="interno">Interno</MenuItem>
                  <MenuItem value="externo">Externo</MenuItem>
                </Select>
              )}
            />

            {errors.post && (
              <span className="text-red-500">{errors.post.message}</span>
            )}
          </FormControl>

          {isInternal && (
            <FormControl>
              <InputLabel htmlFor="pump">Bomba</InputLabel>
              <Input
                disabled={isDisabled}
                {...register("pump", {
                  required: "Insira a bomba",
                })}
                aria-describedby="pump"
              />
              {errors.pump && <InputError>{errors.pump.message}</InputError>}
            </FormControl>
          )}

          {!isInternal && (
            <>
              <FormControl>
                <InputLabel htmlFor="invoiceNumber">Número da nota</InputLabel>
                <Input
                  disabled={isDisabled}
                  {...register("invoiceNumber", {
                    required: "Insira o número da nota",
                  })}
                  aria-describedby="invoiceNumber"
                />
                {errors.invoiceNumber && (
                  <InputError>{errors.invoiceNumber.message}</InputError>
                )}
              </FormControl>

              <FormControl>
                <InputLabel htmlFor="unitPrice">Preço unitário</InputLabel>
                <Input
                  disabled={isDisabled}
                  {...register("unitPrice", {
                    required: "Insira o preço unitário",
                  })}
                  aria-describedby="unitPrice"
                  onChange={(e) => handleNumberField(e, "unitPrice")}
                />
                {errors.unitPrice && (
                  <InputError>{errors.unitPrice.message}</InputError>
                )}
              </FormControl>
            </>
          )}

          <FormControl className="self-end">
            <InputLabel htmlFor="liters">Litros abastecidos</InputLabel>
            <Input
              disabled={isDisabled}
              {...register("liters", {
                required: "Insira quantos litros foram abastecidos",
              })}
              aria-describedby="liters"
              onChange={(e) => handleNumberField(e, "liters")}
            />
            {errors.liters && <InputError>{errors.liters.message}</InputError>}
          </FormControl>

          <div>
            <p className="text-xs text-black/60">Km</p>
            <FormControl className="w-full">
              <InputLabel htmlFor="mileage">{kmLabel}</InputLabel>
              <Input
                type="number"
                disabled={isDisabled}
                {...register("mileage", {
                  required: "Insira a quilometragem atual",
                  min: {
                    value: selectedItem?.mileage,
                    message: `A quilometragem não pode ser menor que a atual`,
                  },
                })}
                aria-describedby="mileage"
              />
              {errors.mileage && (
                <InputError>{errors.mileage.message}</InputError>
              )}
            </FormControl>
          </div>

          <FormControl className="col-span-2">
            <InputLabel htmlFor="observation">Observação</InputLabel>
            <Input
              disabled={isDisabled}
              {...register("observation")}
              aria-describedby="observation"
            />
          </FormControl>

          <FormControl className="col-span-2">
            <label htmlFor="attachments">
              <Button variant="contained" component="span">
                Adicionar Arquivos
              </Button>
            </label>
            <Input
              disabled={isDisabled}
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              id="attachments"
              multiple
              type="file"
              {...register(
                "attachments"
                //   {
                //   required: "Adicione pelo menos 1 anexo!",
                // }
              )}
              onChange={handleFileChange}
            />
            <p className="mt-2">Necessário pelo menos 1</p>
            {/* {errors.attachments && (
              <InputError>{errors.attachments.message}</InputError>
            )} */}
          </FormControl>

          {attachments.length > 0 && (
            <div className="col-span-2">
              <Typography variant="subtitle2" gutterBottom>
                Arquivos anexados:
              </Typography>
              <List dense className="w-full md:grid grid-cols-2 gap-4">
                {attachments.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="remover"
                        onClick={() => {
                          if (isDisabled) return;
                          const newAttachments = [...attachments];
                          newAttachments.splice(index, 1);
                          setAttachments(newAttachments);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      marginBottom: "8px",
                      padding: "8px 16px",
                    }}
                  >
                    <ListItemIcon>
                      {file.type?.includes("image") ? (
                        <ImageIcon />
                      ) : file.type?.includes("pdf") ? (
                        <PictureAsPdfIcon />
                      ) : (
                        <InsertDriveFileIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name || file}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </div>
          )}

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
