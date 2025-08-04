// src/pages/TravelReportPage.jsx
import React, { useState } from "react";
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import dayjs from "dayjs";
import api from "../services/apiFlask";          // helper axios com baseURL do backend

const TravelReportPage = () => {
    // datas padrão: 1º dia do mês atual → hoje
    const today = dayjs().format("YYYY-MM-DD");
    const firstDay = dayjs().startOf("month").format("YYYY-MM-DD");

    const [start, setStart] = useState(firstDay);
    const [end, setEnd] = useState(today);
    const [placa, setPlaca] = useState("");

    const handleGenerate = () => {
        const qs = new URLSearchParams({
            de: start,
            ate: end,
            ...(placa.trim() && { placa: placa.trim().toUpperCase() }),
        }).toString();

        // Abre o PDF em nova aba
        window.open(`${api.defaults.baseURL}/reports/saida-chegada.pdf?${qs}`, "_blank");
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Relatório Saída × Chegada
                </Typography>

                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Grid container spacing={3}>
                        {/* Data inicial */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                type="date"
                                label="De"
                                fullWidth
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Data final */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                type="date"
                                label="Até"
                                fullWidth
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Filtro de placa (opcional) */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Placa (opcional)"
                                fullWidth
                                value={placa}
                                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                            />
                        </Grid>

                        {/* Botão Gerar PDF */}
                        <Grid item xs={12} textAlign="right">
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<GetAppIcon />}
                                onClick={handleGenerate}
                                sx={{
                                    fontWeight: 600,
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                }}
                            >
                                Gerar PDF
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
};

export default TravelReportPage;
