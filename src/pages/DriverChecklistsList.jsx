import { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Button, CircularProgress, Snackbar, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, InputAdornment
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/apiFlask";

/* ───── tabela código → descrição ───── */
const ITEMS = [
    { code: 1, description: "CRLV atualizado" },
    { code: 2, description: "CNH atualizada" },
    { code: 3, description: "Motorista e ajudantes uniformizados" },
    { code: 4, description: "Certificado de cronotacógrafo atualizado" },
    { code: 5, description: "Exame toxicológico atualizado" },
    { code: 6, description: "Macaco, triângulo e chave de roda" },
    { code: 7, description: "Cinto de segurança e extintor de incêndio" },
    { code: 8, description: "Funcionamento do limpador de para-brisa e água" },
    { code: 9, description: "Nível de combustível e bomba injetora" },
    { code: 10, description: "Nível de água do radiador e temperatura" },
    { code: 11, description: "Nível do óleo lubrificante e fluido de freio" },
    { code: 12, description: "Sistema elétrico, luzes do painel e bateria" },
    { code: 13, description: "Condição dos pneus, rodas e calibração" },
    { code: 14, description: "Condição geral da cabine, baú e lataria" },
    { code: 15, description: "Espelhos retrovisores e buzina" },
    { code: 16, description: "Faróis, pisca, luz de ré, seta, freio e lanternas" },
    { code: 17, description: "Faixas refletivas, luzes laterais, portas e janelas" },
    { code: 18, description: "Funcionamento do tacógrafo" },
    { code: 19, description: "Motor sem vazamento, ruídos ou fumaça" },
    { code: 20, description: "Carrinho de entrega" },
];
const desc = (c) => ITEMS.find((i) => i.code === c)?.description || `Item ${c}`;

/* URLs do ngrok precisam do parâmetro para pular o banner */
const skipNgrok = (url = "") =>
    url.includes("ngrok-skip-browser-warning")
        ? url
        : `${url}${url.includes("?") ? "&" : "?"}ngrok-skip-browser-warning=true`;

/* chamadas ---------------------------------------------------- */
const allChecklists = () => api.get("/inspection/checklists").then((r) => r.data);
const oneChecklist = async (id) => {
    const { data } = await api.get(`/inspection/checklists/${id}`);
    /* vacina todos os attachments contra o banner */
    data.items?.forEach((it) => {
        it.attachments = (it.attachments || []).map((a) => ({
            ...a,
            url: skipNgrok(a.url),
        }));
    });
    return data;
};

/* componente -------------------------------------------------- */
export default function DriverChecklistsList() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qPlaca, setQPlaca] = useState("");
    const [qMot, setQMot] = useState("");
    const [qDate, setQDate] = useState("");

    const [dlgOpen, setDlgOpen] = useState(false);
    const [sel, setSel] = useState(null);
    const [loadingDet, setLoadingDet] = useState(false);

    const [sn, setSn] = useState({ open: false, msg: "", sev: "info" });
    const role = localStorage.getItem("role") || "";

    /* -------- carregamento inicial -------- */
    useEffect(() => { load(); }, []);
    const load = async () => {
        setLoading(true);
        try { setRows(await allChecklists()); }
        catch { setSn({ open: true, sev: "error", msg: "Falha ao carregar." }); }
        finally { setLoading(false); }
    };

    /* -------- detalhes -------- */
    const open = async (id) => {
        setLoadingDet(true);
        try {
            const detail = await oneChecklist(id);
            console.log("Anexos recebidos:", detail.items.flatMap(i => i.attachments));
            setSel(detail);
            setDlgOpen(true);
        } catch {
            setSn({ open: true, sev: "error", msg: "Falha ao detalhar." });
        } finally { setLoadingDet(false); }
    };

    /* -------- delete (opcional) -------- */
    const del = async (id) => {
        if (!window.confirm("Apagar checklist?")) return;
        try { await api.delete(`/inspection/checklists/${id}`); load(); }
        catch { setSn({ open: true, sev: "error", msg: "Falha ao deletar." }); }
    };

    /* -------- filtros -------- */
    const list = rows.filter(r => {
        const okPl = !qPlaca || (r.placa || "").toLowerCase().includes(qPlaca.toLowerCase());
        const okMo = !qMot || (r.motorista || "").toLowerCase().includes(qMot.toLowerCase());
        const okDt = !qDate || (r.createdAt && r.createdAt.slice(0, 10) === qDate);
        return okPl && okMo && okDt;
    });

    /* -------- PDF (sem imagens remotas para evitar CORS) -------- */
    const pdf = () => {
        if (!sel) return;
        const doc = new jsPDF("p", "pt");
        doc.setFontSize(14).text("Checklist de Inspeção", 40, 40);
        doc.setFontSize(10);
        doc.text(`Placa: ${sel.placa}`, 40, 60);
        doc.text(`Motorista: ${sel.motorista}`, 40, 75);
        doc.text(`Data: ${new Date(sel.createdAt).toLocaleString("pt-BR")}`, 40, 90);

        autoTable(doc, {
            startY: 110,
            head: [["Item", "Resposta", "Observações"]],
            body: sel.items.map(it => [desc(it.code), it.answer, it.obs || "-"]),
            didParseCell: ({ section, column, cell }) => {
                if (section === "body" && column.index === 1)
                    cell.styles.fillColor = cell.raw === "sim" ? [204, 255, 204] : [255, 204, 204];
            }
        });

        /* (imagens remotas removidas para evitar CORS e corromper o PDF) */

        if (sel.signature) {
            const y = doc.lastAutoTable.finalY + 30;
            doc.text("Assinatura:", 40, y);
            doc.addImage(sel.signature, "PNG", 40, y + 10, 150, 60);
        }

        doc.save("checklist.pdf");
    };

    /* -------- UI -------- */
    if (loading)
        return <Box sx={{ p: 2, textAlign: "center" }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Checklists</Typography>

            {/* filtros */}
            <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
                <TextField placeholder="Placa" value={qPlaca} onChange={e => setQPlaca(e.target.value)}
                    InputProps={{
                        startAdornment:
                            <InputAdornment position="start"><DirectionsCarIcon /></InputAdornment>
                    }} />
                <TextField placeholder="Motorista" value={qMot} onChange={e => setQMot(e.target.value)}
                    InputProps={{
                        startAdornment:
                            <InputAdornment position="start"><PersonIcon /></InputAdornment>
                    }} />
                <TextField type="date" value={qDate} onChange={e => setQDate(e.target.value)}
                    InputProps={{
                        startAdornment:
                            <InputAdornment position="start"><EventIcon /></InputAdornment>
                    }} />
            </Box>

            {/* lista */}
            {list.length === 0 ? <Typography>Nenhum checklist.</Typography>
                : list.map(r => (
                    <Paper key={r.objectId} sx={{ p: 2, mb: 2 }}>
                        <Typography fontWeight="bold">Placa: {r.placa}</Typography>
                        <Typography>Motorista: {r.motorista}</Typography>
                        <Typography>Criado em: {new Date(r.createdAt).toLocaleString("pt-BR")}</Typography>
                        <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                            <Button variant="contained" onClick={() => open(r.objectId)}>Detalhes</Button>
                            {role === "admin" &&
                                <Button variant="outlined" color="error" onClick={() => del(r.objectId)}>Deletar</Button>}
                        </Box>
                    </Paper>
                ))}

            {/* detalhes */}
            <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Detalhes do Checklist</DialogTitle>
                <DialogContent dividers>
                    {loadingDet && <CircularProgress />}
                    {!loadingDet && sel && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography fontWeight="bold">Placa: {sel.placa}</Typography>
                            <Typography>Motorista: {sel.motorista}</Typography>
                            <Typography>Criado em: {new Date(sel.createdAt).toLocaleString("pt-BR")}</Typography>

                            {sel.items.map(it => (
                                <Box key={it.code} sx={{ pb: 1, mb: 1, borderBottom: "1px solid #ccc" }}>
                                    <Typography fontWeight="bold">{desc(it.code)}</Typography>
                                    <Typography sx={{ color: it.answer === "sim" ? "green" : "red" }}>
                                        Resposta: {it.answer}
                                    </Typography>
                                    <Typography>Observações: {it.obs || "-"}</Typography>

                                    {(it.attachments || []).length > 0 && (
                                        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {it.attachments.map(a => (
                                                <img key={a.attachmentId} src={a.url}
                                                    alt="Anexo" style={{ border: "1px solid #ccc", maxWidth: 200 }} />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            ))}

                            {sel.signature && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>Assinatura:</Typography>
                                    <img src={sel.signature} alt="Assinatura"
                                        style={{ border: "1px solid #ccc", maxWidth: 300 }} />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={pdf} disabled={!sel || loadingDet}>Gerar PDF</Button>
                    <Button onClick={() => setDlgOpen(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* snackbar */}
            <Snackbar open={sn.open} autoHideDuration={3000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={() => setSn(s => ({ ...s, open: false }))}>
                <Alert severity={sn.sev} onClose={() => setSn(s => ({ ...s, open: false }))}>
                    {sn.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
