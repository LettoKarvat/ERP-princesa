import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Chip,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ImageList,
    ImageListItem,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SpeedIcon from "@mui/icons-material/Speed";
import EventIcon from "@mui/icons-material/Event";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import dayjs from "dayjs";

/* ─── util ─── */
const baseURL = import.meta.env.VITE_FLASK_URL ?? "";
const iconByMime = (m = "") =>
    m.includes("image") ? (
        <ImageIcon />
    ) : m.includes("pdf") ? (
        <PictureAsPdfIcon />
    ) : (
        <InsertDriveFileIcon />
    );

/* ────────────────────────────────────────────────────────── */
export default function RefuelingDetails({ item, open, onClose }) {
    const [zoomSrc, setZoomSrc] = useState(null); // modal de zoom

    if (!item) return null;

    const when = dayjs(item.date).format("DD/MM/YYYY HH:mm");
    const isExterno = item.post === "externo";
    const total =
        isExterno && item.unitPrice
            ? (item.unitPrice * item.liters).toFixed(2)
            : null;

    /* separa imagens × demais ------------------------------------------------ */
    const imgFiles = item.attachments.filter((a) =>
        a.mimeType?.includes("image")
    );
    const otherFiles = item.attachments.filter(
        (a) => !a.mimeType?.includes("image")
    );

    /* src helper – prefere base64 se existir --------------------------------- */
    const srcFor = (a) => a.preview || `${baseURL}${a.url}`;

    /* ───────── render ───────── */
    return (
        <>
            {/* 𝗠𝗢𝗗𝗔𝗟 𝗣𝗥𝗜𝗡𝗖𝗜𝗣𝗔𝗟 */}
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Detalhes do Abastecimento</DialogTitle>

                <DialogContent dividers>
                    {/* cabeçalho */}
                    <Typography variant="h6" gutterBottom>
                        {item.vehicleLabel}
                    </Typography>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                        <Chip icon={<SpeedIcon />} label={`Km ${item.mileage}`} />
                        <Chip
                            icon={<LocalGasStationIcon />}
                            label={`${item.liters} L`}
                            color="warning"
                        />
                        <Chip
                            label={item.fuelType}
                            color={item.fuelType === "DIESEL" ? "info" : "success"}
                        />
                        <Chip icon={<EventIcon />} label={when} />
                        <Chip
                            label={item.post.toUpperCase()}
                            color={isExterno ? "primary" : "secondary"}
                        />
                    </Box>

                    {/* interno × externo */}
                    {isExterno ? (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <ReceiptLongIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                Nota:&nbsp;<b>{item.invoiceNumber}</b> &nbsp;|&nbsp; Unitário:&nbsp;
                                <b>R$ {Number(item.unitPrice).toFixed(2)}</b>
                                {total && (
                                    <>
                                        {" "}
                                        &nbsp;|&nbsp; Total:&nbsp;<b>R$ {total}</b>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                Bomba:&nbsp;<b>{item.pump || "-"}</b>
                            </Typography>
                        </Box>
                    )}

                    {/* observação */}
                    {item.observation && (
                        <>
                            <Typography variant="subtitle2" gutterBottom>
                                Observação
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {item.observation}
                            </Typography>
                        </>
                    )}

                    {/* imagens */}
                    {imgFiles.length > 0 && (
                        <>
                            <Typography variant="subtitle2" gutterBottom>
                                Imagens&nbsp;({imgFiles.length})
                            </Typography>
                            <ImageList cols={3} gap={8} sx={{ mb: 2 }}>
                                {imgFiles.map((img) => (
                                    <ImageListItem key={img.id}>
                                        <img
                                            src={srcFor(img)}
                                            alt={img.fileName}
                                            loading="lazy"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setZoomSrc(srcFor(img))}
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        </>
                    )}

                    {/* anexos outros */}
                    {otherFiles.length > 0 && (
                        <>
                            <Typography variant="subtitle2" gutterBottom>
                                Anexos&nbsp;({otherFiles.length})
                            </Typography>
                            <List dense>
                                {otherFiles.map((a) => (
                                    <ListItem
                                        key={a.id}
                                        component="a"
                                        href={`${baseURL}${a.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        button
                                    >
                                        <ListItemIcon>{iconByMime(a.mimeType)}</ListItemIcon>
                                        <ListItemText primary={a.fileName} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {/* assinatura (altura menor) */}
                    {(item.signatureData || item.signatureUrl) && (
                        <>
                            <Typography
                                variant="subtitle2"
                                sx={{ mt: 2 }}
                                gutterBottom
                            >
                                Assinatura
                            </Typography>
                            <Box
                                component="img"
                                src={item.signatureData || `${baseURL}${item.signatureUrl}`}
                                alt="Assinatura"
                                sx={{
                                    border: "1px solid #ccc",
                                    width: "100%",
                                    maxHeight: 120, // assinatura mais discreta
                                    p: 1,
                                    objectFit: "contain",
                                }}
                            />
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* 𝗠𝗢𝗗𝗔𝗟 𝗭𝗢𝗢𝗠 𝗜𝗠𝗔𝗚𝗘𝗠 */}
            <Dialog
                open={!!zoomSrc}
                onClose={() => setZoomSrc(null)}
                maxWidth={false}
                /* folha transparente, nada de sombra */
                PaperProps={{
                    sx: {
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        width: "80vw",
                        maxWidth: 900,
                    },
                }}
            >
                {/* botão fechar flutuante */}
                <IconButton
                    onClick={() => setZoomSrc(null)}
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        color: "#fff",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {/* overlay preto translúcido */}
                <DialogContent
                    dividers={false}
                    sx={{
                        p: 0,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {zoomSrc && (
                        <Box
                            component="img"
                            src={zoomSrc}
                            alt="Imagem ampliada"
                            sx={{
                                maxWidth: "90%",
                                maxHeight: "90vh",
                                objectFit: "contain",
                                borderRadius: 1,
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
