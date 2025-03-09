// src/pages/DriverChecklistsList.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableRow,
    TableCell
} from '@mui/material';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import api from '../services/api';

// -------------------------------------
// Tabela de referência code -> description
// -------------------------------------
const checklistItems = [
    { code: 1, description: "CRLV do veículo está ok?" },
    { code: 2, description: "CNH está ok?" },
    { code: 3, description: "Está uniformizado?" },
    { code: 4, description: "Certificado de Cronotacógrafo está ok?" },
    { code: 5, description: "Condições Gerais: Lataria, Cabine, Baú." },
    { code: 6, description: "AET está ok?" },
    { code: 7, description: "Exame Toxicológico está em dia?" },
    { code: 8, description: "Condições gerais internas: bancada, tapete, forros, bancos." },
    { code: 9, description: "Condições de Rodagem: Pneus, Rodas, Pressão de Ar." },
    { code: 10, description: "Sistema de Freios: nível de fluido, altura do pedal." },
    { code: 11, description: "Sistema de Arrefecimento: nível de água e temperatura." },
    { code: 12, description: "Sistema de Alimentação: Bomba injetora, combustível." },
    { code: 13, description: "Sistema Elétrico: Painel, iluminação, bateria." },
    { code: 14, description: "Sistema Trator: (Diferencial) Eixo Cardan." },
    { code: 15, description: "Sistema Câmbio: Engate marchas, folgas, ruídos." },
    { code: 16, description: "Parte do motor: vazamentos, ruídos, fumaça." },
    { code: 17, description: "Embreagem: Altura do Pedal, Estressamento." },
    { code: 18, description: "Tacógrafo: marcação, hora, agulha, está conforme." },
    { code: 19, description: "Carrinho de entrega está ok?" },
    { code: 20, description: "Itens de segurança: macaco, triângulo, chave de roda." },
    { code: 21, description: "Possui EPI necessário?" }
];

function getDescriptionByCode(code) {
    const found = checklistItems.find((item) => item.code === code);
    return found ? found.description : `Item ${code}`;
}

// Funções para pegar dados do backend
async function fetchAllChecklists(sessionToken) {
    const resp = await api.post(
        '/functions/getAllChecklists',
        {},
        { headers: { 'X-Parse-Session-Token': sessionToken } }
    );
    return resp.data.result || [];
}

async function fetchChecklistById(checklistId, sessionToken) {
    const resp = await api.post(
        '/functions/getChecklistById',
        { checklistId },
        { headers: { 'X-Parse-Session-Token': sessionToken } }
    );
    return resp.data.result;
}

export default function DriverChecklistsList() {
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');

    useEffect(() => {
        loadChecklists();
    }, []);

    const loadChecklists = async () => {
        setLoading(true);
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const data = await fetchAllChecklists(sessionToken);
            setChecklists(data);
        } catch (error) {
            console.error('Erro ao buscar checklists:', error);
            showSnackbar('error', 'Falha ao carregar checklists.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetails = async (checklistId) => {
        setLoadingDetails(true);
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const detail = await fetchChecklistById(checklistId, sessionToken);
            setSelectedChecklist(detail);
            setDetailsOpen(true);
        } catch (error) {
            console.error('Erro ao buscar detalhes do checklist:', error);
            showSnackbar('error', 'Falha ao carregar detalhes do checklist.');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedChecklist(null);
    };

    const showSnackbar = (severity, message) => {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    const handleGeneratePDF = () => {
        if (!selectedChecklist) return;
        try {
            const doc = new jsPDF('p', 'pt');
            doc.setFontSize(14);
            doc.text('Checklist de Inspeção', 40, 40);

            doc.setFontSize(10);
            const placa = selectedChecklist.placa || '';
            const motorista = selectedChecklist.userFullname || '';
            doc.text(`Placa: ${placa}`, 40, 60);
            doc.text(`Motorista: ${motorista}`, 40, 75);

            // Data de criação
            const createdAtIso = selectedChecklist.createdAt?.iso;
            const createdStr = createdAtIso
                ? new Date(createdAtIso).toLocaleString('pt-BR')
                : 'Data inválida';
            doc.text(`Data: ${createdStr}`, 40, 90);

            let startTableY = 115;
            // Tabela de itens
            if (Array.isArray(selectedChecklist.items)) {
                const rows = selectedChecklist.items.map((it) => {
                    const desc = getDescriptionByCode(it.code);
                    return [desc, it.answer, it.obs || ''];
                });
                autoTable(doc, {
                    startY: startTableY,
                    head: [['Item', 'Resposta', 'Observações']],
                    body: rows,
                    didParseCell: (data) => {
                        if (data.section === 'body' && data.column.index === 1) {
                            const ans = data.cell.raw;
                            if (ans === 'sim') {
                                data.cell.styles.fillColor = [204, 255, 204]; // verde
                            } else if (ans === 'nao') {
                                data.cell.styles.fillColor = [255, 204, 204]; // vermelho
                            }
                        }
                    },
                });
            }

            const tableState = doc.lastAutoTable;
            let finalY = tableState ? tableState.finalY : 115;

            // Assinatura
            if (selectedChecklist.signature) {
                doc.text('Assinatura:', 40, finalY + 30);
                doc.addImage(
                    selectedChecklist.signature,
                    'PNG',
                    40,
                    finalY + 40,
                    150,
                    60
                );
                finalY += 110;
            }

            // Verifica se haverá espaço para título "Anexos:"
            // Se finalY + ~60 >= 720, pula para nova página
            if (finalY + 60 > 720) {
                doc.addPage();
                finalY = 50;
            }

            // Anexos - 2 imagens por linha, sem nome do arquivo, só "Anexo #1"
            if (
                Array.isArray(selectedChecklist.attachments) &&
                selectedChecklist.attachments.length > 0
            ) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Anexos:', 40, finalY + 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                finalY += 45;

                const attachments = selectedChecklist.attachments;

                let xStart = 40;
                let yPos = finalY;
                const imageWidth = 150;
                const imageHeight = 100;
                const gapX = 40;
                const gapY = 20;
                const maxY = 720;
                const columnsPerRow = 2;
                let colIndex = 0;

                attachments.forEach((attach, index) => {
                    // Se não couber a imagem + algo de margem, pula pra outra página
                    if (yPos > maxY) {
                        doc.addPage();
                        yPos = 50;
                        xStart = 40;
                        colIndex = 0;
                    }

                    // Mostra "Anexo #1", "Anexo #2"...
                    doc.setTextColor(0, 0, 150);
                    doc.text(`Anexo #${index + 1}`, xStart, yPos);
                    doc.setTextColor(0, 0, 0);

                    // Imagem
                    const imageTop = yPos + 10;
                    if (attach.fileBase64) {
                        doc.addImage(
                            attach.fileBase64,
                            'JPEG',
                            xStart,
                            imageTop,
                            imageWidth,
                            imageHeight
                        );
                    }

                    // Ajusta posição para próxima imagem
                    colIndex++;
                    if (colIndex < columnsPerRow) {
                        xStart += imageWidth + gapX;
                    } else {
                        // Nova linha
                        colIndex = 0;
                        xStart = 40;
                        yPos += imageHeight + gapY + 10;
                    }
                });
            }

            doc.save('checklist.pdf');
            showSnackbar('success', 'PDF gerado com sucesso!');
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            showSnackbar('error', 'Falha ao gerar PDF.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (checklists.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6">Nenhum checklist encontrado.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Meus Checklists
            </Typography>

            {checklists.map((ch) => {
                const isoDate = ch.createdAt?.iso;
                const createdStr = isoDate
                    ? new Date(isoDate).toLocaleString('pt-BR')
                    : 'Data inválida';

                return (
                    <Paper
                        key={ch.objectId}
                        sx={{
                            p: 2,
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Placa: {ch.placa || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Motorista: {ch.userFullname || 'N/A'}
                        </Typography>
                        <Typography variant="body2">Criado em: {createdStr}</Typography>

                        <Button
                            variant="contained"
                            sx={{ mt: 1, alignSelf: 'flex-start' }}
                            onClick={() => handleOpenDetails(ch.objectId)}
                        >
                            Ver Detalhes
                        </Button>
                    </Paper>
                );
            })}

            {/* Modal de Detalhes */}
            <Dialog
                open={detailsOpen}
                onClose={handleCloseDetails}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Detalhes do Checklist</DialogTitle>
                <DialogContent dividers>
                    {loadingDetails && <CircularProgress />}

                    {!loadingDetails && selectedChecklist && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                Placa: {selectedChecklist.placa}
                            </Typography>
                            <Typography variant="body2">
                                Motorista: {selectedChecklist.userFullname}
                            </Typography>
                            <Typography variant="body2">
                                {selectedChecklist.createdAt?.iso
                                    ? `Criado em: ${new Date(
                                        selectedChecklist.createdAt.iso
                                    ).toLocaleString('pt-BR')}`
                                    : 'Data inválida'}
                            </Typography>

                            {Array.isArray(selectedChecklist.items) && (
                                <Table size="small">
                                    <TableBody>
                                        {selectedChecklist.items.map((it, idx) => {
                                            const desc = getDescriptionByCode(it.code);
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        {desc}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color:
                                                                it.answer === 'sim'
                                                                    ? 'green'
                                                                    : it.answer === 'nao'
                                                                        ? 'red'
                                                                        : 'inherit',
                                                        }}
                                                    >
                                                        {it.answer}
                                                    </TableCell>
                                                    <TableCell>{it.obs}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Assinatura */}
                            {selectedChecklist.signature && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                        Assinatura:
                                    </Typography>
                                    <img
                                        src={selectedChecklist.signature}
                                        alt="Assinatura"
                                        style={{ border: '1px solid #ccc', maxWidth: '300px' }}
                                    />
                                </Box>
                            )}

                            {/* Anexos */}
                            {Array.isArray(selectedChecklist.attachments) &&
                                selectedChecklist.attachments.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                            Anexos:
                                        </Typography>
                                        {selectedChecklist.attachments.map((att, i) => (
                                            <Box key={att.objectId} sx={{ mb: 1 }}>
                                                {/* Exemplo: só "Anexo #1" no modal (ou nada) */}
                                                <Typography variant="body2">
                                                    Anexo #{i + 1}
                                                </Typography>
                                                {att.fileBase64 ? (
                                                    <img
                                                        src={att.fileBase64}
                                                        alt="Anexo"
                                                        style={{
                                                            border: '1px solid #ccc',
                                                            maxWidth: '300px',
                                                        }}
                                                    />
                                                ) : (
                                                    <a
                                                        href={att.fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Abrir
                                                    </a>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={handleGeneratePDF}
                        disabled={!selectedChecklist || loadingDetails}
                    >
                        Gerar PDF
                    </Button>
                    <Button onClick={handleCloseDetails}>Fechar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
