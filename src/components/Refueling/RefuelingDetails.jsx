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

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: item.fuelType === 'DIESEL' ? '#1e293b' : '#166534',
                    color: 'white',
                    textAlign: 'center',
                    borderRadius: '12px 12px 0 0',
                    py: 3
                }}>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                        Detalhes do Abastecimento
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {item.vehicleLabel}
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: '#f8fafc' }}>
                    {/* Cards de informações principais */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Card Quilometragem */}
                        <Grid item xs={12} md={3}>
                            <Card sx={{
                                bgcolor: 'white',
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                height: '100%',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Avatar sx={{
                                        bgcolor: '#1e293b',
                                        mx: 'auto',
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}>
                                        <SpeedIcon sx={{ fontSize: 28 }} />
                                    </Avatar>
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                                        {item.mileage?.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                        Quilômetros
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Card Volume */}
                        <Grid item xs={12} md={3}>
                            <Card sx={{
                                bgcolor: 'white',
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                height: '100%',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Avatar sx={{
                                        bgcolor: '#166534',
                                        mx: 'auto',
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}>
                                        <FuelIcon sx={{ fontSize: 28 }} />
                                    </Avatar>
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                                        {item.liters}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                        Litros
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Card Data */}
                        <Grid item xs={12} md={3}>
                            <Card sx={{
                                bgcolor: 'white',
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                height: '100%',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Avatar sx={{
                                        bgcolor: '#64748b',
                                        mx: 'auto',
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}>
                                        <CalendarIcon sx={{ fontSize: 28 }} />
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
                                        {formatDate(item.date)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                        Data/Hora
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Card Valor Total (se externo) */}
                        {isExternal && total && (
                            <Grid item xs={12} md={3}>
                                <Card sx={{
                                    bgcolor: 'white',
                                    borderRadius: 3,
                                    border: '1px solid #e2e8f0',
                                    height: '100%',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <Avatar sx={{
                                            bgcolor: '#dc2626',
                                            mx: 'auto',
                                            mb: 2,
                                            width: 56,
                                            height: 56
                                        }}>
                                            <MoneyIcon sx={{ fontSize: 28 }} />
                                        </Avatar>
                                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                                            R$ {total}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
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
                                bgcolor: item.fuelType === 'DIESEL' ? '#1e293b' : '#166534',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '1rem',
                                height: 40,
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                        <Chip
                            icon={<LocationIcon />}
                            label={`Posto ${item.post.toUpperCase()}`}
                            sx={{
                                bgcolor: '#64748b',
                                color: 'white',
                                fontWeight: 600,
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
                        bgcolor: 'white',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {isExternal ? <ReceiptIcon sx={{ color: '#1e293b' }} /> : <InventoryIcon sx={{ color: '#1e293b' }} />}
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                {isExternal ? 'Informações do Posto Externo' : 'Informações do Posto Interno'}
                            </Typography>
                        </Box>

                        {isExternal ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body1" sx={{ mb: 1, color: '#334155' }}>
                                        <strong>Número da Nota:</strong> {item.invoiceNumber}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#334155' }}>
                                        <strong>Preço Unitário:</strong> R$ {Number(item.unitPrice).toFixed(2)}/L
                                    </Typography>
                                </Grid>
                                {total && (
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#dc2626' }}>
                                            Total: R$ {total}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        ) : (
                            <Typography variant="body1" sx={{ color: '#334155' }}>
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
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <DescriptionIcon sx={{ color: '#1e293b' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    Observações
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#334155' }}>
                                {item.observation}
                            </Typography>
                        </Paper>
                    )}

                    {/* Imagens */}
                    {imageFiles.length > 0 && (
                        <Paper sx={{
                            p: 3,
                            mb: 4,
                            borderRadius: 3,
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <Typography variant="h6" sx={{
                                mb: 3,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: '#1e293b'
                            }}>
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
                                                borderRadius: 8,
                                                height: 150,
                                                objectFit: 'cover',
                                                transition: 'transform 0.2s ease',
                                                border: '1px solid #e2e8f0'
                                            }}
                                            onClick={() => setZoomImage(img.preview || img.url)}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        </Paper>
                    )}

                    {/* Outros arquivos */}
                    {otherFiles.length > 0 && (
                        <Paper sx={{
                            p: 3,
                            mb: 4,
                            borderRadius: 3,
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <Typography variant="h6" sx={{
                                mb: 3,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: '#1e293b'
                            }}>
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
                                            bgcolor: '#f8fafc',
                                            borderRadius: 2,
                                            mb: 1,
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: '#1e293b',
                                                color: 'white',
                                                transform: 'translateX(4px)',
                                                '& .MuiListItemIcon-root': {
                                                    color: 'white'
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: '#64748b' }}>
                                            {getFileIcon(file.mimeType)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={file.fileName}
                                            primaryTypographyProps={{ fontWeight: 500 }}
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
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                                <SignatureIcon sx={{ color: '#1e293b' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    Assinatura do Responsável
                                </Typography>
                            </Box>
                            <Box sx={{
                                bgcolor: '#f8fafc',
                                borderRadius: 2,
                                p: 2,
                                display: 'inline-block',
                                border: '1px solid #e2e8f0'
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

                <DialogActions sx={{ p: 3, justifyContent: 'center', bgcolor: '#f8fafc' }}>
                    <Button
                        onClick={onClose}
                        variant="contained"
                        size="large"
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            bgcolor: '#1e293b',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                bgcolor: '#334155',
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
                        borderRadius: 3
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
                                borderRadius: 12
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};