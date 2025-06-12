// src/components/Refueling/RefuelingCard.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SpeedIcon from "@mui/icons-material/Speed";
import EventIcon from "@mui/icons-material/Event";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import dayjs from "dayjs";

/**
 * Card compacto – exibe resumo do abastecimento
 * e emite onDetails / onEdit via props.
 */
export default function RefuelingCard({ refueling, onDetails, onEdit }) {
  const label =
    refueling.vehicleLabel ||
    refueling.vehicle ||
    refueling.vehicle_id;

  const when = dayjs(refueling.date).format("DD/MM/YYYY HH:mm");

  /* chip de posto */
  const postChipColor =
    refueling.post === "interno" ? "success" : "info";

  return (
    <Card elevation={3} sx={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={label}
        titleTypographyProps={{ variant: "h6" }}
        sx={{ pb: 0.5 }}
      />

      <CardContent
        sx={{ pt: 0.5, display: "flex", flexDirection: "column", gap: 1 }}
      >
        {/* quilometragem */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SpeedIcon fontSize="small" color="action" />
          <Typography variant="body2">
            Km&nbsp;<b>{refueling.mileage}</b>
          </Typography>
        </Box>

        {/* litros e combustível */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <LocalDrinkIcon fontSize="small" color="action" />
          <Typography variant="body2">
            Litros&nbsp;<b>{refueling.liters}</b>
          </Typography>

          <Chip size="small" label={refueling.fuelType} sx={{ ml: 1 }} />
        </Box>

        {/* data */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EventIcon fontSize="small" color="action" />
          <Typography variant="body2">{when}</Typography>
        </Box>

        {/* posto */}
        <Box>
          <Chip
            size="small"
            label={refueling.post.toUpperCase()}
            color={postChipColor}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </CardContent>

      <Divider />

      <Box
        sx={{
          p: 1.5,
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
        }}
      >
        <Button size="small" variant="outlined" onClick={onDetails}>
          Detalhes
        </Button>
        <Button size="small" variant="contained" onClick={onEdit}>
          Editar
        </Button>
      </Box>
    </Card>
  );
}
