import { Button, Card, CardContent, CardHeader } from "@mui/material";
import dayjs from "dayjs";

export function RefuelingCard({ refueling, handleOpenDialog }) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-bold text-lg">
        <span className="text-[var(--muted-foreground)] font-normal">
          Veículo:{" "}
        </span>
        {refueling.vehicle}
      </h3>
      <CardContent className="!p-0">
        <p>
          <span className="text-[var(--muted-foreground)]">
            Quilometragem:{" "}
          </span>
          {refueling.mileage}
        </p>
        <p>
          <span className="text-[var(--muted-foreground)]">Data: </span>
          {dayjs(refueling.date).format("DD/MM/YYYY HH:mm")}
        </p>
        <div className="w-full flex justify-end mt-4">
          <Button
            onClick={() => handleOpenDialog(refueling)}
            variant="contained"
          >
            Mais informações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
