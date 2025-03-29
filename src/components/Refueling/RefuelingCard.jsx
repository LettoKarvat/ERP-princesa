import { Button, Card, CardContent } from "@mui/material";
import dayjs from "dayjs";

export function RefuelingCard({ refueling, handleOpenDialog }) {
  return (
    <Card className="p-4">
      <h3>{refueling.vehicle}</h3>
      <CardContent className="!p-0">
        <p>{refueling.mileage}</p>
        <p>{dayjs(refueling.date).format("DD/MM/YYYY HH:mm")}</p>
        <div className=" w-full flex justify-end">
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
