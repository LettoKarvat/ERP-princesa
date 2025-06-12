import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Chip, Box, List, ListItem, ListItemText,
    ListItemIcon, ImageList, ImageListItem
} from "@mui/material";
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
    m.includes("image") ? <ImageIcon /> :
        m.includes("pdf") ? <PictureAsPdfIcon /> :
            <InsertDriveFileIcon />;

export default function RefuelingDetails({ item, open, onClose }) {
    if (!item) return null;

    const when = dayjs(item.date).format("DD/MM/YYYY HH:mm");
    const isExterno = item.post === "externo";
    const total = isExterno && item.unitPrice
        ? (item.unitPrice * item.liters).toFixed(2)
        : null;

    /* separe imagens × não-imagens ─────────────────────── */
    const imgFiles = item.attachments.filter(a => a.mimeType?.includes("image"));
    const otherFiles = item.attachments.filter(a => !a.mimeType?.includes("image"));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Detalhes do Abastecimento</DialogTitle>

            <DialogContent dividers>

                {/* cabeçalho */}{
                    <Typography variant="h6" gutterBottom>
                        {item.vehicleLabel}
                    </Typography>}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Chip icon={<SpeedIcon />} label={`Km ${item.mileage}`} />
                    <Chip icon={<LocalGasStationIcon />} label={`${item.liters} L`} color="warning" />
                    <Chip label={item.fuelType} color={item.fuelType === "DIESEL" ? "info" : "success"} />
                    <Chip icon={<EventIcon />} label={when} />
                    <Chip
                        label={item.post.toUpperCase()}
                        color={isExterno ? "primary" : "secondary"}
                    />
                </Box>

                {/* bloco interno/externo ------------------------------------ */}
                {isExterno ? (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <ReceiptLongIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                            Nota:&nbsp;<b>{item.invoiceNumber}</b> &nbsp;|&nbsp; Unitário:&nbsp;
                            <b>R$ {Number(item.unitPrice).toFixed(2)}</b>
                            {total && <> &nbsp;|&nbsp; Total:&nbsp;<b>R$ {total}</b></>}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            Bomba:&nbsp;<b>{item.pump || "-"}</b>
                        </Typography>
                    </Box>
                )}

                {/* observação ---------------------------------------------- */}
                {item.observation && (
                    <>
                        <Typography variant="subtitle2" gutterBottom>Observação</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>{item.observation}</Typography>
                    </>
                )}

                {/* pré-visualização de imagens ----------------------------- */}
                {imgFiles.length > 0 && (
                    <>
                        <Typography variant="subtitle2" gutterBottom>Imagens&nbsp;({imgFiles.length})</Typography>
                        <ImageList cols={3} gap={8} sx={{ mb: 2 }}>
                            {imgFiles.map(img => (
                                <ImageListItem key={img.id}>
                                    <img
                                        src={`${baseURL}${img.url}`}
                                        alt={img.fileName}
                                        loading="lazy"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => window.open(`${baseURL}${img.url}`, "_blank")}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    </>
                )}

                {/* anexos não-imagem --------------------------------------- */}
                {otherFiles.length > 0 && (
                    <>
                        <Typography variant="subtitle2" gutterBottom>Anexos&nbsp;({otherFiles.length})</Typography>
                        <List dense>
                            {otherFiles.map(a => (
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

                {/* assinatura ---------------------------------------------- */}
                {item.signatureUrl && (
                    <>
                        <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>Assinatura</Typography>
                        <Box component="img"
                            src={`${baseURL}${item.signatureUrl}`}
                            alt="Assinatura"
                            sx={{ border: '1px solid #ccc', width: '100%', p: 1, objectFit: 'contain' }}
                        />
                    </>
                )}

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}
