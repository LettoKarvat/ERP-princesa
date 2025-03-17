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
    TextField,
    InputAdornment
} from '@mui/material';

import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import api from '../services/api';

// -------------------------------------
// Tabela de referência: código -> descrição dos itens
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
    { code: 21, description: "Possui EPI necessário?" },
];

// Mapeia code -> descrição
function getDescriptionByCode(code) {
    const found = checklistItems.find((item) => item.code === code);
    return found ? found.description : `Item ${code}`;
}

// ----------- Funções de acesso ao backend -----------
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

// ----------------------------------------------------
export default function DriverChecklistsList() {
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Campos de busca
    const [searchPlate, setSearchPlate] = useState('');        // placa
    const [searchMotorista, setSearchMotorista] = useState(''); // motorista
    const [searchDate, setSearchDate] = useState('');          // data (yyyy-mm-dd)

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');

    // ADIÇÃO: role do usuário (salvo em localStorage no momento do login)
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Resgata o role do localStorage
        const storedRole = localStorage.getItem('role');
        if (storedRole) {
            setUserRole(storedRole);
        }

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

    // ADIÇÃO: Deletar (soft-delete) checklist
    const handleDeleteChecklist = async (objectId) => {
        const confirmDelete = window.confirm('Tem certeza que deseja deletar este checklist?');
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            // Chama a Cloud Function de soft-delete
            await api.post(
                '/functions/softDeleteChecklist',
                { checklistId: objectId },  // a CF espera "checklistId"
                { headers: { 'X-Parse-Session-Token': sessionToken } }
            );
            showSnackbar('success', 'Checklist deletado com sucesso.');
            // Recarrega a lista
            loadChecklists();
        } catch (error) {
            console.error('Erro ao deletar checklist:', error);
            showSnackbar('error', 'Falha ao deletar checklist.');
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

    // Filtra os checklists localmente
    const filteredChecklists = checklists.filter((ch) => {
        // Filtro por placa
        if (searchPlate) {
            if (!ch.placa?.toLowerCase().includes(searchPlate.toLowerCase())) {
                return false;
            }
        }
        // Filtro por motorista
        if (searchMotorista) {
            if (!ch.userFullname?.toLowerCase().includes(searchMotorista.toLowerCase())) {
                return false;
            }
        }
        // Filtro por data
        if (searchDate) {
            const cDateIso = ch.createdAt?.iso;
            if (!cDateIso) return false;
            const cDate = new Date(cDateIso);
            const sDate = new Date(searchDate);
            if (
                cDate.getDate() !== sDate.getDate() ||
                cDate.getMonth() !== sDate.getMonth() ||
                cDate.getFullYear() !== sDate.getFullYear()
            ) {
                return false;
            }
        }

        return true;
    });

    // Geração do PDF
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

            // Tabela de itens
            let startY = 110;
            const rows = selectedChecklist.items.map((it) => {
                const desc = getDescriptionByCode(it.code);
                return [desc, it.answer, it.obs || ''];
            });

            autoTable(doc, {
                startY,
                head: [['Item', 'Resposta', 'Observações']],
                body: rows,
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 1) {
                        const ans = data.cell.raw;
                        if (ans === 'sim') {
                            data.cell.styles.fillColor = [204, 255, 204]; // verde claro
                        } else if (ans === 'nao') {
                            data.cell.styles.fillColor = [255, 204, 204]; // vermelho claro
                        }
                    }
                },
            });

            const tableState = doc.lastAutoTable;
            let currentY = tableState.finalY + 20;

            // Assinatura
            if (selectedChecklist.signature) {
                if (currentY + 80 > 720) {
                    doc.addPage();
                    currentY = 50;
                }
                doc.text('Assinatura:', 40, currentY);
                doc.addImage(selectedChecklist.signature, 'PNG', 40, currentY + 10, 150, 60);
                currentY += 80;
            }

            // Anexos
            const allAttachments = selectedChecklist.attachments || [];
            if (allAttachments.length > 0) {
                const spaceNeeded = 50;
                if (currentY + spaceNeeded > 720) {
                    doc.addPage();
                    currentY = 50;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Anexos:', 40, currentY);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                currentY += 20;

                // Agrupa por itemCode
                const grouped = {};
                allAttachments.forEach((att) => {
                    const code = att.itemCode;
                    if (!grouped[code]) grouped[code] = [];
                    grouped[code].push(att);
                });

                for (const codeStr of Object.keys(grouped)) {
                    const code = parseInt(codeStr, 10);
                    const desc = getDescriptionByCode(code);
                    const itemAtts = grouped[codeStr];

                    if (currentY + 60 > 720) {
                        doc.addPage();
                        currentY = 50;
                    }
                    doc.setTextColor(0, 0, 150);
                    doc.text(`Item ${code} - ${desc}`, 40, currentY);
                    doc.setTextColor(0, 0, 0);
                    currentY += 15;

                    let xPos = 40;
                    const imageWidth = 150;
                    const imageHeight = 100;
                    const gapX = 30;
                    const gapY = 20;
                    let colIndex = 0;

                    itemAtts.forEach((att) => {
                        if (currentY + imageHeight > 720) {
                            doc.addPage();
                            currentY = 50;
                            xPos = 40;
                            colIndex = 0;
                        }
                        doc.addImage(att.fileBase64, 'JPEG', xPos, currentY, imageWidth, imageHeight);
                        colIndex++;
                        if (colIndex === 2) {
                            xPos = 40;
                            currentY += imageHeight + gapY;
                            colIndex = 0;
                        } else {
                            xPos += imageWidth + gapX;
                        }
                    });

                    if (colIndex === 1) {
                        colIndex = 0;
                        xPos = 40;
                        currentY += imageHeight + gapY;
                    }
                    currentY += 10;
                }
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

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Meus Checklists
            </Typography>

            {/* Campos de busca */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
                    variant="outlined"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <DirectionsCarIcon />
                            </InputAdornment>
                        ),
                    }}
                    placeholder="Placa"
                />
                <TextField
                    variant="outlined"
                    value={searchMotorista}
                    onChange={(e) => setSearchMotorista(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonIcon />
                            </InputAdornment>
                        ),
                    }}
                    placeholder="Motorista"
                />
                <TextField
                    type="date"
                    variant="outlined"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <EventIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Lista Filtrada */}
            {filteredChecklists.length === 0 ? (
                <Typography variant="h6">Nenhum checklist encontrado.</Typography>
            ) : (
                filteredChecklists.map((ch) => {
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
                            <Typography variant="body2">
                                Criado em: {createdStr}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => handleOpenDetails(ch.objectId)}
                                >
                                    Ver Detalhes
                                </Button>

                                {/* Botão de Deletar (somente para admin) */}
                                {userRole === 'admin' && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleDeleteChecklist(ch.objectId)}
                                    >
                                        Deletar
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    );
                })
            )}

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
                                    ? `Criado em: ${new Date(selectedChecklist.createdAt.iso).toLocaleString('pt-BR')}`
                                    : 'Data inválida'}
                            </Typography>

                            {/* Exemplo de exibir os itens */}
                            {selectedChecklist.items?.map((item, idx) => {
                                const desc = getDescriptionByCode(item.code);
                                const itemAttachments = selectedChecklist.attachments?.filter(
                                    (att) => att.itemCode === item.code
                                ) || [];
                                return (
                                    <Box
                                        key={idx}
                                        sx={{
                                            mb: 2,
                                            borderBottom: '1px solid #ccc',
                                            pb: 1,
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {desc}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: item.answer === 'sim' ? 'green' : 'red',
                                            }}
                                        >
                                            Resposta: {item.answer}
                                        </Typography>
                                        <Typography variant="body2">
                                            Observações: {item.obs || '-'}
                                        </Typography>
                                        {itemAttachments.length > 0 && (
                                            <Box
                                                sx={{
                                                    mt: 1,
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1,
                                                }}
                                            >
                                                {itemAttachments.map((att) => (
                                                    <Box
                                                        key={att.objectId}
                                                        sx={{ textAlign: 'center' }}
                                                    >
                                                        <img
                                                            src={att.fileBase64}
                                                            alt="Anexo"
                                                            style={{
                                                                border: '1px solid #ccc',
                                                                maxWidth: '200px',
                                                            }}
                                                        />
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}

                            {/* Assinatura, se existir */}
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
