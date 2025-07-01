import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    ImageList,
    ImageListItem,
    Card,
    CardContent,
    Avatar,
} from '@mui/material';
import {
    Speed as SpeedIcon,
    LocalGasStation as FuelIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    Receipt as ReceiptIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as FileIcon,
    Close as CloseIcon,
    AttachMoney as MoneyIcon,
    Description as DescriptionIcon,
    Create as SignatureIcon,
    Inventory as InventoryIcon,
} from '@mui/icons-material';

export const RefuelingDetails = ({ item, open, onClose }) => {
    const [zoomImage, setZoomImage] = useState(null);

    if (!item) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isExternal = item.post === 'externo';
    const total = isExternal && item.unitPrice
        ? (item.unitPrice * item.liters).toFixed(2)
        : null;

    const imageFiles = item.attachments?.filter(a => a.mimeType?.includes('image')) || [];
    const otherFiles = item.attachments?.filter(a => !a.mimeType?.includes('image')) || [];

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('image')) return <ImageIcon />;
        if (mimeType?.includes('pdf')) return <PdfIcon />;
        return <FileIcon />;
    };

    const getFuelGradient = (fuel) => {
        return fuel === 'DIESEL'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    };

    const getPostGradient = (post) => {
        return post === 'interno'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    background: getFuelGradient(item.fuelType),
                    color: 'white',
                    textAlign: 'center',
                    borderRadius: '16px 16px 0 0',
                    py: 3
                }}>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Detalhes do Abastecimento
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        {item.vehicleLabel}
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    {/* Cards de informações principais */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Card Quilometragem */}
                        <Grid item xs={12} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white',
                                borderRadius: 3,
                                height: '100%'
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Avatar sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        mx: 'auto',
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}>
                                        <SpeedIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {item.mileage?.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Quilômetros
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Card Volume */}
                        <Grid item xs={12} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: 'white',
                                borderRadius: 3,
                                height: '100%'
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Avatar sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        mx: 'auto',
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}>
                                        <FuelIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {item.liters}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Litros
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Card Data */}
                        <Grid item xs={12} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                color: 'white',
                                borderRadius: 3,
                                height: '100%'
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Avatar sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        mx: 'auto',
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}>
                                        <CalendarIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {formatDate(item.date)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Data/Hora
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Card Valor Total (se externo) */}
                        {isExternal && total && (
                            <Grid item xs={12} md={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                                    color: '#333',
                                    borderRadius: 3,
                                    height: '100%'
                                }}>
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <Avatar sx={{
                                            bgcolor: 'rgba(0,0,0,0.1)',
                                            mx: 'auto',
                                            mb: 2,
                                            width: 56,
                                            height: 56
                                        }}>
                                            <MoneyIcon sx={{ fontSize: 32 }} />
                                        </Avatar>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            R$ {total}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Valor Total
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>

                    {/* Chips de informações */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, justifyContent: 'center' }}>
                        <Chip
                            icon={<FuelIcon />}
                            label={item.fuelType}
                            sx={{
                                background: getFuelGradient(item.fuelType),
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                height: 40,
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                        <Chip
                            icon={<LocationIcon />}
                            label={`Posto ${item.post.toUpperCase()}`}
                            sx={{
                                background: getPostGradient(item.post),
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                height: 40,
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                    </Box>

                    {/* Detalhes do posto */}
                    <Paper sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 3,
                        background: isExternal
                            ? 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                            : 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                        border: 'none'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {isExternal ? <ReceiptIcon /> : <InventoryIcon />}
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {isExternal ? 'Informações do Posto Externo' : 'Informações do Posto Interno'}
                            </Typography>
                        </Box>

                        {isExternal ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        <strong>Número da Nota:</strong> {item.invoiceNumber}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Preço Unitário:</strong> R$ {Number(item.unitPrice).toFixed(2)}/L
                                    </Typography>
                                </Grid>
                                {total && (
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d84315' }}>
                                            Total: R$ {total}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        ) : (
                            <Typography variant="body1">
                                <strong>Bomba utilizada:</strong> {item.pump || 'Não informado'}
                            </Typography>
                        )}
                    </Paper>

                    {/* Observação */}
                    {item.observation && (
                        <Paper sx={{
                            p: 3,
                            mb: 4,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <DescriptionIcon />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Observações
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                {item.observation}
                            </Typography>
                        </Paper>
                    )}

                    {/* Imagens */}
                    {imageFiles.length > 0 && (
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'rgba(255,255,255,0.8)' }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ImageIcon />
                                Imagens Anexadas ({imageFiles.length})
                            </Typography>
                            <ImageList cols={4} gap={16}>
                                {imageFiles.map((img) => (
                                    <ImageListItem key={img.id}>
                                        <img
                                            src={img.preview || img.url}
                                            alt={img.fileName}
                                            loading="lazy"
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: 12,
                                                height: 150,
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.05)'
                                                }
                                            }}
                                            onClick={() => setZoomImage(img.preview || img.url)}
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        </Paper>
                    )}

                    {/* Outros arquivos */}
                    {otherFiles.length > 0 && (
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'rgba(255,255,255,0.8)' }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FileIcon />
                                Outros Anexos ({otherFiles.length})
                            </Typography>
                            <List>
                                {otherFiles.map((file) => (
                                    <ListItem
                                        key={file.id}
                                        component="a"
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                            borderRadius: 2,
                                            mb: 1,
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                transform: 'translateX(8px)'
                                            }
                                        }}
                                    >
                                        <ListItemIcon>
                                            {getFileIcon(file.mimeType)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={file.fileName}
                                            primaryTypographyProps={{ fontWeight: 'medium' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {/* Assinatura */}
                    {(item.signatureData || item.signatureUrl) && (
                        <Paper sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                                <SignatureIcon />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Assinatura do Responsável
                                </Typography>
                            </Box>
                            <Box sx={{
                                background: 'white',
                                borderRadius: 2,
                                p: 2,
                                display: 'inline-block',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}>
                                <img
                                    src={item.signatureData || item.signatureUrl}
                                    alt="Assinatura"
                                    style={{
                                        maxWidth: '300px',
                                        height: 'auto',
                                        maxHeight: '120px',
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                        </Paper>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                    <Button
                        onClick={onClose}
                        variant="contained"
                        size="large"
                        sx={{
                            borderRadius: 3,
                            px: 4,
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                            }
                        }}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de zoom da imagem */}
            <Dialog
                open={!!zoomImage}
                onClose={() => setZoomImage(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.95)',
                        boxShadow: 'none',
                        borderRadius: 4
                    }
                }}
            >
                <DialogContent sx={{ p: 0, position: 'relative' }}>
                    <Button
                        onClick={() => setZoomImage(null)}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            zIndex: 1,
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: 2,
                            minWidth: 48,
                            height: 48,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.9)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </Button>
                    {zoomImage && (
                        <img
                            src={zoomImage}
                            alt="Imagem ampliada"
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                borderRadius: 16
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};