import React, { useEffect, useState } from "react";
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
  InputLabel,
  Input,
  Autocomplete,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { InputError } from "../InputError";
import { getAllVeiculos } from "../../services/vehicleService";

export function RefuelingDialog({ open, onClose, selectedItem }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  console.log(selectedItem);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      mileage: selectedItem?.mileage,
    },
    // shouldUnregister: false,
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  const postValue = watch("post");
  const isInternal = postValue === "interno";

  // useEffect(() => {
  //   if (selectedItem) {
  //     reset(selectedItem);
  //   }
  //   setSelectedVehicle(null);
  // }, [selectedItem, reset]);

  useEffect(() => {
    const getVehicles = async () => {
      try {
        const vehiclesData = await getAllVeiculos();
        setVehicles(vehiclesData);
        console.log(vehiclesData);
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
      }
    };

    getVehicles();
  }, []);

  useEffect(() => {
    setTimeout(() => setValue("mileage", 123));
  }, [setValue, open]);

  const handleClose = () => {
    setSelectedVehicle(null);
    reset();

    onClose();
  };

  const handleInputChange = (e, field) => {
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

  const changeValue = () => {
    setTimeout(() => setValue("mileage", 123));

    // setValue("mileage", 100, {
    //   shouldValidate: true,
    //   shouldDirty: true,
    //   shouldTouch: true,
    // });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>
        {selectedItem?.id ? "Editar abastecimento" : "Novo abastecimento"}
      </DialogTitle>

      <DialogContent className="!pt-2 pb-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-6 md:grid grid-cols-2"
        >
          <Button onClick={changeValue}>mudar valor</Button>
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
              setMileageState(newValue?.quilometragem ?? "");
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

          {/* <FormControl className="col-span-2">
            <InputLabel htmlFor="vehicle">Veículo (Nome ou placa)</InputLabel>
            <Input
              {...register("vehicle", {
                required: "Insira o nome ou a placa do veículo",
              })}
              aria-describedby="vehicle"
            />
            {errors.vehicle && (
              <InputError>{errors.vehicle.message}</InputError>
            )}
          </FormControl> */}

          <FormControl className="col-span-2">
            <FormLabel component="legend">Combustível</FormLabel>

            <Controller
              name="fuelType"
              control={control}
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
              type="date"
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
                  {...register("unitPrice", {
                    required: "Insira o preço unitário",
                  })}
                  aria-describedby="unitPrice"
                />
                {errors.unitPrice && (
                  <InputError>{errors.unitPrice.message}</InputError>
                )}
              </FormControl>
            </>
          )}

          <FormControl>
            <InputLabel htmlFor="liters">Litros abastecidos</InputLabel>
            <Input
              {...register("liters", {
                required: "Insira quantos litros foram abastecidos",
              })}
              aria-describedby="liters"
            />
            {errors.liters && <InputError>{errors.liters.message}</InputError>}
          </FormControl>

          {/* <Controller
            as={
              <TextField
                error={!!errors.mileage}
                helperText={errors.mileage && errors.mileage.message}
              />
            }
            control={control}
            name="mileage"
            rule={{
              required: "Insira a quilometragem atual",
              min: {
                value: selectedVehicle?.quilometragem,
                message: "A quilometragem não pode ser menor que a anterior",
              },
            }}
          /> */}

          <FormControl>
            <InputLabel htmlFor="mileage">Quilometragem atual</InputLabel>
            <Input
              {...register("mileage", {
                required: "Insira a quilometragem atual",
                min: {
                  value: selectedVehicle?.quilometragem,
                  message: "A quilometragem não pode ser menor que a anterior",
                },
              })}
              aria-describedby="mileage"
            />
            {errors.mileage && (
              <InputError>{errors.mileage.message}</InputError>
            )}
          </FormControl>

          <FormControl className="col-span-2">
            <InputLabel htmlFor="observation">Observação</InputLabel>
            <Input
              {...register("observation")}
              aria-describedby="observation"
            />
          </FormControl>

          <div className="flex justify-end col-span-2">
            <Button variant="contained" type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions> */}
    </Dialog>
  );
}
