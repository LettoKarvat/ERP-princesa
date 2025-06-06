import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Paper, Button, CircularProgress, Snackbar, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, InputAdornment
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import SignatureCanvas from "react-signature-canvas";
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

/* chamadas ---------------------------------------------------- */
const allChecklists = () => api.get("/inspection/checklists").then((r) => r.data);
const oneChecklist = async (id) => {
    const { data } = await api.get(`/inspection/checklists/${id}`);
    return data;
};
const assignSecondSign = async (id, signatureBase64) => {
    await api.post(
        `/inspection/checklists/${id}/second-signature`,
        { signature: signatureBase64 }
    );
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
    const userFullName = (localStorage.getItem("fullname") || "").toLowerCase();
    const isDriver = role === "motorista";

    // estados e ref para segunda assinatura
    const [signModalOpen, setSignModalOpen] = useState(false);
    const signatureRef = useRef(null);
    const [savedSecondSignature, setSavedSecondSignature] = useState(null);

    /* -------- carregamento inicial -------- */
    useEffect(() => { load(); }, []);
    const load = async () => {
        setLoading(true);
        try {
            const data = await allChecklists();
            setRows(data);
        } catch {
            setSn({ open: true, sev: "error", msg: "Falha ao carregar." });
        } finally {
            setLoading(false);
        }
    };

    /* -------- detalhes -------- */
    const open = async (id) => {
        setLoadingDet(true);
        try {
            const detail = await oneChecklist(id);

            // buscar base64 de cada attachment
            await Promise.all(
                detail.items.map(async (item) => {
                    if (Array.isArray(item.attachments)) {
                        await Promise.all(
                            item.attachments.map(async (att) => {
                                try {
                                    const secureUrl = att.url.startsWith("http://")
                                        ? att.url.replace(/^http:\/\//, "https://")
                                        : att.url;
                                    const resp = await api.get(secureUrl);
                                    att.dataUrl = resp.data.data;
                                } catch {
                                    att.dataUrl = null;
                                }
                            })
                        );
                    }
                })
            );

            setSel(detail);
            setDlgOpen(true);
        } catch {
            setSn({ open: true, sev: "error", msg: "Falha ao detalhar." });
        } finally {
            setLoadingDet(false);
        }
    };

    /* -------- abrir modal de segunda assinatura -------- */
    const handleSecondSignClick = () => {
        if (!sel) return;
        setSavedSecondSignature(null);
        setSignModalOpen(true);
    };

    /* -------- salvar desenho da segunda assinatura -------- */
    const handleSaveSecondSignature = () => {
        if (signatureRef.current.isEmpty()) {
            setSn({ open: true, sev: "error", msg: "Assine antes de salvar." });
            return;
        }
        const base64 = signatureRef.current.getTrimmedCanvas().toDataURL("image/png");
        setSavedSecondSignature(base64);
        setSn({ open: true, sev: "success", msg: "Assinatura salva." });
    };

    /* -------- confirmar segunda assinatura -------- */
    const handleConfirmSecondSignature = async () => {
        if (!savedSecondSignature) {
            setSn({ open: true, sev: "error", msg: "Salve a assinatura antes de confirmar." });
            return;
        }
        setLoadingDet(true);
        try {
            await assignSecondSign(sel.objectId, savedSecondSignature);
            const updatedFull = await oneChecklist(sel.objectId);
            await Promise.all(
                updatedFull.items.map(async (item) => {
                    if (Array.isArray(item.attachments)) {
                        await Promise.all(
                            item.attachments.map(async (att) => {
                                try {
                                    const secureUrl = att.url.startsWith("http://")
                                        ? att.url.replace(/^http:\/\//, "https://")
                                        : att.url;
                                    const resp = await api.get(secureUrl);
                                    att.dataUrl = resp.data.data;
                                } catch {
                                    att.dataUrl = null;
                                }
                            })
                        );
                    }
                })
            );
            setSel(updatedFull);
            setSignModalOpen(false);
            setSn({ open: true, sev: "success", msg: "Segunda assinatura aplicada." });
            // também recarrega a lista para atualizar cor de card
            load();
        } catch {
            setSn({ open: true, sev: "error", msg: "Falha ao atribuir segunda assinatura." });
        } finally {
            setLoadingDet(false);
        }
    };

    /* -------- delete (opcional) -------- */
    const del = async (id) => {
        if (!window.confirm("Apagar checklist?")) return;
        try {
            await api.delete(`/inspection/checklists/${id}`);
            load();
        } catch {
            setSn({ open: true, sev: "error", msg: "Falha ao deletar." });
        }
    };

    /* -------- filtros -------- */
    const list = rows.filter(r => {
        // 1) motorista vê só os próprios
        if (isDriver) {
            if ((r.motorista || "").toLowerCase() !== userFullName) return false;
        }
        // 2) filtros existentes
        const okPl = !qPlaca || (r.placa || "").toLowerCase().includes(qPlaca.toLowerCase());
        const okMo = !qMot || (r.motorista || "").toLowerCase().includes(qMot.toLowerCase());
        const okDt = !qDate || (r.createdAt && r.createdAt.slice(0, 10) === qDate);
        return okPl && okMo && okDt;
    });

    /* -------- PDF (com duas assinaturas e borda colorida) -------- */
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
                if (section === "body" && column.index === 1) {
                    cell.styles.fillColor = cell.raw === "sim"
                        ? [204, 255, 204] : [255, 204, 204];
                }
            }
        });

        let y = doc.lastAutoTable.finalY + 20;

        // inserir primeira assinatura
        if (sel.signature) {
            if (y + 80 > doc.internal.pageSize.height - 40) {
                doc.addPage();
                y = 40;
            }
            doc.setFontSize(12).text("Assinatura Motorista:", 40, y);
            doc.addImage(sel.signature, "PNG", 40, y + 10, 150, 60);
            y += 80;
        }

        // inserir segunda assinatura ou placeholder com borda
        if (!sel.secondSignature) {
            if (y + 50 > doc.internal.pageSize.height - 40) {
                doc.addPage();
                y = 40;
            }
            doc.setDrawColor(255, 193, 7);
            doc.setLineWidth(1.5);
            doc.rect(38, y - 2, 154, 64);
            doc.setFontSize(12).text("Sem 2ª assinatura", 44, y + 30);
            y += 80;
        } else {
            if (y + 80 > doc.internal.pageSize.height - 40) {
                doc.addPage();
                y = 40;
            }
            doc.setFontSize(12).text("2ª Assinatura (Revisor):", 40, y);
            doc.setDrawColor(76, 175, 80);
            doc.setLineWidth(1.5);
            doc.rect(38, y + 2, 154, 64);
            doc.addImage(sel.secondSignature, "PNG", 40, y + 10, 150, 60);
            y += 80;
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
                <TextField
                    placeholder="Placa"
                    value={qPlaca}
                    onChange={e => setQPlaca(e.target.value)}
                    InputProps={{
                        startAdornment:
                            <InputAdornment position="start"><DirectionsCarIcon /></InputAdornment>
                    }}
                />
                <TextField
                    placeholder="Motorista"
                    value={qMot}
                    onChange={e => setQMot(e.target.value)}
                    InputProps={{
                        startAdornment:
                            <InputAdornment position="start"><PersonIcon /></InputAdornment>
                    }}
                />
                <TextField
                    type="date"
                    value={qDate}
                    onChange={e => setQDate(e.target.value)}
                    InputProps={{
                        startAdornment:
                            <InputAdornment position="start"><EventIcon /></InputAdornment>
                    }}
                />
            </Box>

            {/* lista */}
            {list.length === 0
                ? <Typography>Nenhum checklist.</Typography>
                : list.map(r => {
                    // se não tiver secondSignature, borda amarela (precisa revisar); caso contrário, borda verde
                    const needsReview = !r.secondSignature;
                    return (
                        <Paper
                            key={r.objectId}
                            sx={{
                                p: 2,
                                mb: 2,
                                border: `2px solid ${needsReview ? "#FFC107" : "#4CAF50"}`,
                            }}
                        >
                            <Typography fontWeight="bold">Placa: {r.placa}</Typography>
                            <Typography>Motorista: {r.motorista}</Typography>
                            <Typography>
                                Criado em: {new Date(r.createdAt).toLocaleString("pt-BR")}
                            </Typography>
                            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                <Button variant="contained" onClick={() => open(r.objectId)}>
                                    Detalhes
                                </Button>
                                {role === "admin" && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => del(r.objectId)}
                                    >
                                        Deletar
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    );
                })
            }

            {/* detalhes */}
            <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Detalhes do Checklist</DialogTitle>
                <DialogContent dividers>
                    {loadingDet && <CircularProgress />}
                    {!loadingDet && sel && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography fontWeight="bold">Placa: {sel.placa}</Typography>
                            <Typography>Motorista: {sel.motorista}</Typography>
                            <Typography>
                                Criado em: {new Date(sel.createdAt).toLocaleString("pt-BR")}
                            </Typography>

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
                                                a.dataUrl
                                                    ? <img
                                                        key={a.attachmentId}
                                                        src={a.dataUrl}
                                                        alt="Anexo"
                                                        style={{ border: "1px solid #ccc", maxWidth: 200 }}
                                                    />
                                                    : <Box
                                                        key={a.attachmentId}
                                                        sx={{
                                                            width: 200, height: 150,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            border: "1px solid #ccc", bgcolor: "#f5f5f5"
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="textSecondary">
                                                            Não foi possível carregar
                                                        </Typography>
                                                    </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            ))}

                            {/* primeira assinatura */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                    Assinatura Motorista:
                                </Typography>
                                {sel.signature
                                    ? <img
                                        src={sel.signature}
                                        alt="Assinatura"
                                        style={{ border: "1px solid #ccc", maxWidth: 300 }}
                                    />
                                    : <Box
                                        sx={{
                                            width: 300, height: 60,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            border: "1px dashed #ccc", bgcolor: "#f5f5f5"
                                        }}
                                    >
                                        <Typography variant="caption" color="textSecondary">
                                            Sem assinatura
                                        </Typography>
                                    </Box>
                                }
                            </Box>

                            {/* segunda assinatura */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                    2ª Assinatura (Revisor):
                                </Typography>
                                {sel.secondSignature
                                    ? <Box
                                        sx={{
                                            boxShadow: "0 0 8px 2px rgba(76,175,80,0.6)",
                                            display: "inline-block"
                                        }}
                                    >
                                        <img
                                            src={sel.secondSignature}
                                            alt="2ª Assinatura"
                                            style={{ border: "1px solid #ccc", maxWidth: 300 }}
                                        />
                                    </Box>
                                    : <Box
                                        sx={{
                                            boxShadow: "0 0 8px 2px rgba(255,193,7,0.6)",
                                            width: 300, height: 60,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            border: "1px dashed #ccc", bgcolor: "#fff59d"
                                        }}
                                    >
                                        <Typography variant="caption" color="textSecondary">
                                            Aguardando 2ª assinatura
                                        </Typography>
                                    </Box>
                                }
                            </Box>

                            {/* botão de revisar e assinar (para admins) */}
                            {role === "admin" && !sel.secondSignature && (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleSecondSignClick}
                                    disabled={loadingDet}
                                >
                                    Criar 2ª Assinatura
                                </Button>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={pdf} disabled={!sel || loadingDet}>
                        Gerar PDF
                    </Button>
                    <Button onClick={() => setDlgOpen(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* modal para desenhar segunda assinatura */}
            <Dialog
                open={signModalOpen}
                onClose={() => setSignModalOpen(false)}
                disableEscapeKeyDown={loadingDet}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Desenhar 2ª Assinatura</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ border: "1px solid #ccc", height: 200, mb: 2 }}>
                        <SignatureCanvas
                            ref={signatureRef}
                            penColor="black"
                            canvasProps={{ width: 500, height: 200, style: { background: "#fff" } }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button onClick={() => signatureRef.current.clear()} disabled={loadingDet}>
                            Limpar
                        </Button>
                        <Button onClick={handleSaveSecondSignature} variant="outlined" disabled={loadingDet}>
                            Salvar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSignModalOpen(false)} disabled={loadingDet}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmSecondSignature}
                        disabled={!savedSecondSignature || loadingDet}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* snackbar */}
            <Snackbar
                open={sn.open}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={() => setSn(s => ({ ...s, open: false }))}
            >
                <Alert severity={sn.sev} onClose={() => setSn(s => ({ ...s, open: false }))}>
                    {sn.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
