// src/pages/ChecklistPrint.jsx
import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Stack,
    FormControlLabel,
    Checkbox,
    TextField,
    IconButton,
    Typography,
} from "@mui/material";
import { Add, Remove, Today as TodayIcon, Event as EventIcon, Print as PrintIcon } from "@mui/icons-material";

/** Itens do modelo impresso (atualizado conforme solicitação) */
const DEFAULT_ITEMS = [
    { code: "1.1", description: "Documentos do motorista (CNH e toxicológico)" },   // alterado
    { code: "1.2", description: "Documentos do veículo e carga" },
    { code: "1.3", description: "Cinto de segurança retrátil de 3 pontos" },
    { code: "1.4", description: "Banco em bom estado" },
    { code: "1.5", description: "Direção em bom estado" },
    { code: "1.6", description: "Luzes do painel" },
    { code: "1.7", description: "Tacógrafo" },
    { code: "1.8", description: "Extintor de incêndio (prazo de validade)" },
    { code: "1.9", description: "Portas e janelas" },
    { code: "1.10", description: "Limpador de para-brisa (funcionando e com água)" },
    { code: "1.11", description: "Buzina" },
    { code: "1.12", description: "Freio" },                                          // alterado
    { code: "1.13", description: "Cabine limpa e organizada" },
    { code: "1.14", description: "Pneus (estado de conservação e fixação das rodas)" },
    { code: "1.15", description: "Ausência de vazamentos" },
    { code: "1.16", description: "Sinalização (triângulo/cones)" },
    { code: "1.17", description: "Espelhos retrovisores" },
    { code: "1.18", description: "Lona da carga (conservação/funcionamento)" },
    { code: "1.19", description: "Faixas refletivas" },
    { code: "1.20", description: "Luzes laterais" },
    { code: "1.21", description: "Luzes de freio" },
    { code: "1.22", description: "Farol alto / baixo" },
    { code: "1.23", description: "Pisca alerta" },
    { code: "1.24", description: "Luz e sinal sonoro de ré" },
    { code: "1.25", description: "Setas" },
    { code: "1.26", description: "Macaco / Chave de rodas / Estepe" },
    { code: "1.27", description: "Condições do baú" },
    { code: "1.28", description: "Lanternas traseiras e luz de placa" },
    // novos
    { code: "1.29", description: "EPI do motorista validado" },                      // novo
    { code: "1.30", description: "Câmbio do veículo" },                              // novo
    { code: "1.31", description: "Água e óleo do veículo" },                         // novo
];

export default function ChecklistPrint({
    companyName = "298 - DISTRIBUIDORA PRINCESA",
    logoUrl = "https://iili.io/F6BcJtf.png",
    items = DEFAULT_ITEMS,
}) {
    const rows = useMemo(() => items.map((it, i) => ({ ...it, idx: i + 1 })), [items]);
    const [twoCopies, setTwoCopies] = useState(false);
    const [dateISO, setDateISO] = useState(""); // yyyy-mm-dd

    // helpers de data
    const pad = (n) => String(n).padStart(2, "0");
    const formatISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toBR = (iso) => (!iso ? "" : iso.split("-").reverse().join("/"));

    const setToday = () => setDateISO(formatISO(new Date()));
    const setTomorrow = () => {
        const d = new Date(); d.setDate(d.getDate() + 1); setDateISO(formatISO(d));
    };
    const shiftDays = (delta) => {
        const base = dateISO ? new Date(dateISO + "T00:00:00") : new Date();
        base.setDate(base.getDate() + delta);
        setDateISO(formatISO(base));
    };

    const dateBR = toBR(dateISO);

    return (
        <Box sx={{ p: 2 }}>
            {/* Barra de ações (não imprime) */}
            <Stack className="screen-only" spacing={1.5} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                        Imprimir / Salvar em PDF
                    </Button>

                    <Button variant="outlined" startIcon={<TodayIcon />} onClick={setToday}>Hoje</Button>
                    <Button variant="outlined" startIcon={<EventIcon />} onClick={setTomorrow}>Amanhã</Button>

                    {/* Controle de data com – / + */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { xs: 0, sm: 1 } }}>
                        <Typography variant="body2" sx={{ minWidth: 36 }}>Data:</Typography>
                        <IconButton aria-label="diminuir 1 dia" onClick={() => shiftDays(-1)}><Remove /></IconButton>
                        <TextField
                            type="date"
                            size="small"
                            value={dateISO}
                            onChange={(e) => setDateISO(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 165, "& input": { paddingY: "7px" } }}
                        />
                        <IconButton aria-label="aumentar 1 dia" onClick={() => shiftDays(1)}><Add /></IconButton>
                    </Stack>

                    <FormControlLabel
                        sx={{ ml: { xs: 0, sm: 2 } }}
                        control={<Checkbox checked={twoCopies} onChange={(e) => setTwoCopies(e.target.checked)} />}
                        label="Imprimir em 2 vias"
                    />
                </Stack>
            </Stack>

            {/* 🔒 Só o que está dentro de #print-root aparece na impressão */}
            <div id="print-root">
                <PrintPage companyName={companyName} logoUrl={logoUrl} rows={rows} dateStr={dateBR} isCopy={false} />
                {twoCopies && <PrintPage companyName={companyName} logoUrl={logoUrl} rows={rows} dateStr={dateBR} isCopy />}
            </div>

            <style>{css}</style>
        </Box>
    );
}

function PrintPage({ companyName, logoUrl, rows, dateStr, isCopy }) {
    return (
        <div className="print-page">
            {/* Cabeçalho */}
            <div className="header">
                <div className="brand">
                    {logoUrl ? <img src={logoUrl} alt="logo" /> : <div className="logo-fallback">LOGO</div>}
                    <div className="company">{companyName}</div>
                    {isCopy && <div className="copy-tag">2ª VIA</div>}
                </div>
                <div className="head-fields">
                    <div><strong>Data:</strong> {dateStr || "____ / ____ / ______"}</div>
                    <div><strong>Motorista:</strong> _________________________________________</div>
                    <div>
                        <strong>Placa veículo:</strong> ____________________{" "}
                        <strong>Placa carreta:</strong> ____________________
                    </div>
                    <div><strong>Rota / Viagem:</strong> ____________________________________</div>
                    {/* novos campos solicitados */}
                    <div><strong>KM de Saída:</strong> ____________________</div>
                    <div><strong>KM de Entrada:</strong> __________________</div>
                </div>
            </div>

            <div className="title">Checklist de Inspeção do Veículo</div>

            {/* Tabela */}
            <table className="tbl">
                <thead>
                    <tr>
                        <th className="col-num">#</th>
                        <th>Item de verificação</th>
                        <th className="col-check">Conforme</th>
                        <th className="col-check">Não conforme</th>
                        <th className="col-check">N.A.</th>
                        <th className="col-obs">Observação</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.code ?? r.idx}>
                            <td className="col-num">{r.code ?? r.idx}</td>
                            <td>{r.description}</td>
                            <td className="col-check"><div className="box" /></td>
                            <td className="col-check"><div className="box" /></td>
                            <td className="col-check"><div className="box" /></td>
                            <td className="col-obs" />
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Observações e assinaturas */}
            <div className="obs-block">
                <div className="obs-title">Observações gerais / Soluções adotadas:</div>
                <div className="obs-area" />
            </div>

            <div className="signs">
                <div className="sign-line">Assinatura do Motorista</div>
                <div className="sign-line">Assinatura do Conferente</div>
                <div className="sign-line">Assinatura do Fiscal / Supervisor</div>
            </div>
        </div>
    );
}

/* ---------- CSS (A4, pronto para impressão e isolado da sidebar) ---------- */
const css = `
@page { size: A4 portrait; margin: 12mm; }
* { box-sizing: border-box; }

/* Oculta botões na impressão */
.screen-only { display: block; }
@media print { .screen-only { display: none !important; } }

/* 🔐 Isola a área imprimível: só #print-root aparece no papel */
@media print {
  html, body { background: #fff !important; }
  body { margin: 0 !important; }
  body * { visibility: hidden !important; }
  #print-root, #print-root * { visibility: visible !important; }
  #print-root { position: absolute; left: 0; top: 0; width: 100%; z-index: 9999; }
}

/* --- estilos da página A4 --- */
.print-page { page-break-after: always; font-family: Arial, Helvetica, sans-serif; color: #000; }
.header { display: grid; grid-template-columns: 1.3fr 2fr; gap: 8mm; align-items: center; }
.brand { display: grid; grid-template-columns: 22mm 1fr; align-items: center; gap: 4mm; }
.brand img { width: 22mm; height: auto; object-fit: contain; }
.logo-fallback { width: 22mm; height: 22mm; border: 1px solid #000; display: grid; place-items: center; font-size: 10pt; }
.company { font-size: 11pt; font-weight: 700; }
.copy-tag { background: #eee; padding: 1mm 2mm; font-size: 8pt; border: 1px solid #000; margin-top: 2mm; width: fit-content; }

.head-fields { font-size: 10pt; display: grid; gap: 2mm; }

.title { margin: 6mm 0 3mm; font-size: 12.5pt; font-weight: 700; text-align: left; }

.tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tbl th, .tbl td { border: 0.4pt solid #000; padding: 2mm; font-size: 10pt; }
.tbl thead th { background: #f5f5f5; }
.col-num { width: 12mm; text-align: center; }
.col-check { width: 22mm; text-align: center; }
.col-obs { width: 60mm; }

.box { width: 10mm; height: 6mm; border: 0.5pt solid #000; margin: 0 auto; }

.tbl tbody td.col-obs { height: 9mm; }  /* altura para escrita */
.tbl tbody tr { page-break-inside: avoid; }

.obs-block { margin-top: 6mm; }
.obs-title { font-size: 10pt; margin-bottom: 2mm; }
.obs-area { height: 32mm; border: 0.4pt solid #000; }

.signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; margin-top: 10mm; }
.sign-line { border-top: 0.6pt solid #000; text-align: center; padding-top: 3mm; font-size: 10pt; }
`;
