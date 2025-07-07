/*  src/pages/VehicleTireManagement.jsx
 *  Tela integrada ao Flask (apiFlask.js)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2 } from 'lucide-react';
import jsPDF from 'jspdf';
import api from '../services/apiFlask';
import VehicleModal from './components/VehicleModal.jsx';
import TirePositionModal from './components/TirePositionModal.jsx';
import SwapConfirmModal from './components/SwapConfirmModal.jsx';

/* ───────────────────────── layouts ───────────────────────── */
const TIRE_LAYOUTS = {
    'Passeio': [{ eixo: 'Eixo Dianteiro', pos: ['1E', '1D'] }, { eixo: 'Eixo Traseiro', pos: ['2E', '2D'] }, { eixo: 'Estepe', pos: ['E'] }],
    'Delivery': [{ eixo: '1º Eixo (Dianteiro)', pos: ['1E', '1D'] }, { eixo: '2º Eixo (Traseiro)', pos: ['2E', '2D'] }, { eixo: 'Estepe', pos: ['E'] }],
    '3/4': [{ eixo: '1º Eixo (Dianteiro)', pos: ['1E', '1D'] }, { eixo: '2º Eixo (Traseiro)', pos: ['2DI', '2DE', '2EI', '2EE'] }, { eixo: 'Estepe', pos: ['E'] }],
    'Toco': [{ eixo: '1º Eixo (Dianteiro)', pos: ['1E', '1D'] }, { eixo: '2º Eixo (Traseiro)', pos: ['2DI', '2DE', '2EI', '2EE'] }, { eixo: 'Estepe', pos: ['E'] }],
    'Truck': [{ eixo: '1º Eixo (Dianteiro)', pos: ['1E', '1D'] }, { eixo: '2º Eixo (Traseiro)', pos: ['2DI', '2DE', '2EI', '2EE'] }, { eixo: '3º Eixo (Traseiro)', pos: ['3DI', '3DE', '3EI', '3EE'] }, { eixo: 'Estepe', pos: ['E'] }],
    'Bi-Truck': [{ eixo: '1º Eixo (Dianteiro)', pos: ['1E', '1D'] }, { eixo: '2º Eixo', pos: ['2E', '2D'] }, { eixo: '3º Eixo', pos: ['3DI', '3DE', '3EI', '3EE'] }, { eixo: '4º Eixo', pos: ['4DI', '4DE', '4EI', '4EE'] }, { eixo: 'Estepe', pos: ['E'] }],
    'Cavalo': [{ eixo: '1º Eixo (Dianteiro)', pos: ['1E', '1D'] }, { eixo: '2º Eixo', pos: ['2DI', '2DE', '2EI', '2EE'] }, { eixo: '3º Eixo', pos: ['3I', '3E'] }, { eixo: 'Estepe', pos: ['E'] }],
    'Semi-Reboque (Bi-Trem)': [{ eixo: '1º Eixo', pos: ['1DE', '1E'] }, { eixo: '2º Eixo', pos: ['2DI', '2DE', '2EI', '2EE'] }, { eixo: 'Estepe', pos: ['E', 'E'] }],
    'Semi-Reboque (Rodo-Trem)': [{ eixo: '1º Eixo', pos: ['1D', '1E'] }, { eixo: '2º Eixo', pos: ['2DI', '2DE', '2EI', '2EE'] }, { eixo: '3º Eixo', pos: ['3DI', '3DE', '3EI', '3EE'] }, { eixo: 'Estepe', pos: ['E', 'E'] }]
};

export default function VehicleTireManagement() {
    /* ---------- dados ---------- */
    const [vehicles, setVehicles] = useState([]);
    const [vehicleTires, setVehicleTires] = useState([]);
    const [stockTires, setStockTires] = useState([]);

    /* ---------- UI / estados ---------- */
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [openVehicle, setOpenVehicle] = useState(false);
    const [openPos, setOpenPos] = useState(false);
    const [openSwap, setOpenSwap] = useState(false);

    const [swapMode, setSwapMode] = useState(false);
    const [swapA, setSwapA] = useState(null);
    const [swapB, setSwapB] = useState(null);

    const [posToEdit, setPosToEdit] = useState('');
    const [assignedTire, setAssignedTire] = useState(null);
    const [selectedStockTire, setSelectedStockTire] = useState(null);
    const [oldTireDestination, setOldTireDestination] = useState('Em recapagem');

    /* ---------- load inicial ---------- */
    useEffect(() => {
        loadVehicles();
        loadStockTires();
    }, []);

    const loadVehicles = async () => {
        try {
            const { data } = await api.get('/vehicles');
            setVehicles(data ?? []);
        } catch (err) { console.error(err); }
    };

    const loadStockTires = async () => {
        try {
            const { data } = await api.post('/functions/getAllPneus');
            setStockTires(
                (data?.result ?? []).filter(
                    p => (p.status || '').toLowerCase() === 'em estoque',
                ),
            );
        } catch (err) { console.error(err); }
    };

    const loadVehicleTires = async (vehicleId) => {
        try {
            const { data } = await api.post('/functions/getPneusByVeiculo', { vehicleId });
            setVehicleTires(data?.result ?? []);
        } catch (err) { console.error(err); }
    };

    /* ---------- helpers ---------- */
    const calcKm = (t) => (Number(t.kmFinal) || 0) - (Number(t.kmInicial) || 0);
    const layout = () => selectedVehicle?.tipo ? TIRE_LAYOUTS[selectedVehicle.tipo] || [] : [];

    /* ---------- PDF - LAYOUT EXATO DO MODELO ---------- */
    const exportPdf = useCallback(() => {
        if (!selectedVehicle) return;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
        const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

        // ═══════════════════════════════════════════════════════════
        // CABEÇALHO
        // ═══════════════════════════════════════════════════════════

        // Título principal
        doc.setFont('helvetica', 'bold').setFontSize(12);
        doc.text('DISTRIBUIDORA PRINCESA', 15, 15);

        // Data e página no canto direito
        doc.setFont('helvetica', 'normal').setFontSize(9);
        doc.text('Data: ___/___/______', pageWidth - 80, 15);
        doc.text('Pág.: 1 / 1', pageWidth - 80, 22);

        // Subtítulo
        doc.setFont('helvetica', 'bold').setFontSize(11);
        doc.text('Cartão de Troca de Pneu', 15, 25);

        // Campos do cabeçalho com linhas
        doc.setFont('helvetica', 'normal').setFontSize(9);
        const drawFieldLine = (label, x, y, lineWidth) => {
            doc.text(label, x, y);
            const labelWidth = doc.getTextWidth(label);
            doc.setLineWidth(0.3);
            doc.line(x + labelWidth + 2, y + 1, x + labelWidth + 2 + lineWidth, y + 1);
        };

        drawFieldLine('Veículo:', 70, 35, 60);
        drawFieldLine('Placa:', 150, 35, 50);
        drawFieldLine('Km. Atual:', 220, 35, 50);

        // Segunda linha do cabeçalho
        doc.setFont('helvetica', 'normal').setFontSize(8);
        doc.text('Data ____________', 15, 45);
        doc.text('Local ________________________', 80, 45);
        doc.text('Responsável/Borracheiro ________________________', 160, 45);

        // Linha separadora
        doc.setLineWidth(0.5);
        doc.line(15, 50, pageWidth - 15, 50);

        // Instruções
        doc.setFont('helvetica', 'normal').setFontSize(9);
        doc.text('Preencha com Marca de Fogo do Pneu dentro das Respectivas Posições', 15, 58);
        doc.text('Km Pneu = Total', pageWidth - 50, 58);

        // ═══════════════════════════════════════════════════════════
        // LAYOUT ESPECÍFICO BASEADO NO PDF DE REFERÊNCIA
        // ═══════════════════════════════════════════════════════════

        const TIRE_BOX = { width: 80, height: 50 };
        const FIRE_SQUARES = { size: 4, gap: 1, count: 5 };

        // Helper para desenhar marcas de fogo
        const drawFireMarks = (x, y) => {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            for (let i = 0; i < FIRE_SQUARES.count; i++) {
                const markX = x + 5 + i * (FIRE_SQUARES.size + FIRE_SQUARES.gap);
                const markY = y + 20;
                doc.rect(markX, markY, FIRE_SQUARES.size, FIRE_SQUARES.size);
            }
        };

        // Helper para desenhar um pneu completo
        const drawTire = (x, y, position, tire) => {
            // Caixa principal
            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);
            doc.rect(x, y, TIRE_BOX.width, TIRE_BOX.height);

            // Posição do pneu
            doc.setFont('helvetica', 'bold').setFontSize(10);
            doc.text(position, x + 5, y + 12);

            // Marcas de fogo
            drawFireMarks(x, y);

            // Informações do pneu
            doc.setFont('helvetica', 'normal').setFontSize(8);
            doc.text('Nº:', x + 45, y + 12);
            doc.text(String(tire.numeroSerie || '___'), x + 55, y + 12);
            doc.text('Km:', x + 45, y + 22);
            doc.text(String(tire.kmInicial || '0'), x + 55, y + 22);
            doc.text('Dim.:', x + 45, y + 32);
            doc.text(String(tire.dimensao || ''), x + 55, y + 32);
        };

        // ═══════════════════════════════════════════════════════════
        // POSICIONAMENTO DOS PNEUS CONFORME O MODELO
        // ═══════════════════════════════════════════════════════════

        const vehicleLayout = layout().filter(axle => !axle.eixo.toLowerCase().includes('estepe'));

        if (vehicleLayout.length > 0) {
            // Posições específicas baseadas no PDF de referência
            const positions = {
                // Eixo dianteiro - parte superior
                '1E': { x: 50, y: 80 },
                '2DE': { x: 150, y: 80 },

                // Chassi central com quadrado
                chassis: { x: 100, y: 130, width: 80, height: 8 },
                square: { x: 135, y: 125, size: 18 },

                // Eixo traseiro - parte inferior
                '1D': { x: 50, y: 150 },
                '2DI': { x: 150, y: 150 },

                // Estepe - canto inferior esquerdo
                'E': { x: 30, y: 220 }
            };

            // Desenhar pneus nas posições específicas
            vehicleLayout.forEach(axle => {
                axle.pos.forEach(position => {
                    const tire = vehicleTires.find(vt => vt.posicaoVeiculo === position) || {};
                    const pos = positions[position];

                    if (pos) {
                        drawTire(pos.x, pos.y, position, tire);
                    }
                });
            });

            // Desenhar chassi (linha horizontal)
            doc.setLineWidth(3);
            doc.setDrawColor(0, 0, 0);
            doc.line(positions.chassis.x, positions.chassis.y,
                positions.chassis.x + positions.chassis.width, positions.chassis.y);

            // Desenhar quadrado central sólido
            doc.setFillColor(0, 0, 0);
            doc.rect(positions.square.x, positions.square.y,
                positions.square.size, positions.square.size, 'F');

            // Linhas de conexão verticais
            doc.setLineWidth(2);
            doc.line(positions.square.x + positions.square.size / 2, positions.square.y,
                positions.square.x + positions.square.size / 2, positions.square.y - 15);
            doc.line(positions.square.x + positions.square.size / 2, positions.square.y + positions.square.size,
                positions.square.x + positions.square.size / 2, positions.square.y + positions.square.size + 15);
        }

        // ═══════════════════════════════════════════════════════════
        // ESTEPE
        // ═══════════════════════════════════════════════════════════

        const spareAxle = layout().find(axle => axle.eixo.toLowerCase().includes('estepe'));
        if (spareAxle && spareAxle.pos.length > 0) {
            const sparePosition = spareAxle.pos[0];
            const spareTire = vehicleTires.find(vt => vt.posicaoVeiculo === sparePosition) || {};

            // Posicionar estepe conforme o modelo
            drawTire(30, 220, sparePosition, spareTire);
        }

        // ═══════════════════════════════════════════════════════════
        // RODAPÉ
        // ═══════════════════════════════════════════════════════════

        doc.setFont('helvetica', 'normal').setFontSize(8);
        doc.text('TL15560 / RL15560', pageWidth - 60, pageHeight - 10);

        // Salvar o arquivo
        doc.save(`cartao-${selectedVehicle.placa || 'veiculo'}.pdf`);
    }, [selectedVehicle, vehicleTires]);

    /* ---------- cliques ---------- */
    const clickVehicle = async v => {
        await loadVehicleTires(v.id || v.objectId);
        setSelectedVehicle(v);
        setOpenVehicle(true);
    };

    const handleTireClick = (pos, tire) => {
        if (!swapMode) {
            setPosToEdit(pos); setAssignedTire(tire || null); setOpenPos(true);
        } else if (!swapA) {
            setSwapA({ pos, tire });
        } else if (!swapB && swapA.pos !== pos) {
            setSwapB({ pos, tire }); setOpenSwap(true);
        }
    };

    /* ---------- salvar atribuição ---------- */
    const swapOrAssign = async () => {
        if (!selectedStockTire) return alert('Selecione um pneu');
        try {
            if (assignedTire) {
                await api.post('/functions/editarPneu', {
                    objectId: assignedTire.objectId,
                    veiculoId: '', posicaoVeiculo: '', status: oldTireDestination,
                });
            }
            await api.post('/functions/editarPneu', {
                objectId: selectedStockTire.objectId,
                veiculoId: selectedVehicle.id || selectedVehicle.objectId,
                posicaoVeiculo: posToEdit, status: 'Em uso',
            });
            await loadVehicleTires(selectedVehicle.id || selectedVehicle.objectId);
            setOpenPos(false);
        } catch (e) { console.error(e); alert('Falha na troca'); }
    };

    const confirmSwap = async () => {
        try {
            await api.post('/functions/editarPneu', {
                objectId: swapA.tire?.objectId,
                veiculoId: selectedVehicle.id || selectedVehicle.objectId,
                posicaoVeiculo: swapB.pos, status: 'Em uso',
            });
            await api.post('/functions/editarPneu', {
                objectId: swapB.tire?.objectId,
                veiculoId: selectedVehicle.id || selectedVehicle.objectId,
                posicaoVeiculo: swapA.pos, status: 'Em uso',
            });
            await loadVehicleTires(selectedVehicle.id || selectedVehicle.objectId);
            setOpenSwap(false); setSwapMode(false); setSwapA(null); setSwapB(null);
        } catch (e) { console.error(e); }
    };

    /* ---------- filtro ---------- */
    const filtered = vehicles.filter(v =>
        v.placa.toLowerCase().includes(vehicleSearch.toLowerCase())
    );

    const getKmField = (v) =>
        v.km ?? v.kmAtual ?? v.km_atual ?? v.odometro ?? null;

    /* ---------- render ---------- */
    return (
        <div className="space-y-6">
            {/* busca */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Search className="mr-3 h-6 w-6 text-blue-600" />
                    Pesquisa de Veículos por Placa
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Buscar pela placa..."
                        value={vehicleSearch}
                        onChange={e => setVehicleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* tabela */}
            <div className="bg-white rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>{['Placa', 'Marca', 'Modelo', 'Tipo', 'Ações'].map(h => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium">{v.placa}</td>
                                <td className="px-6 py-4 text-sm">{v.marca}</td>
                                <td className="px-6 py-4 text-sm">{v.modelo}</td>
                                <td className="px-6 py-4 text-sm">{v.tipo}</td>

                                <td className="px-6 py-4 text-sm">
                                    <button
                                        onClick={() => clickVehicle(v)}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center"
                                    >
                                        <Edit2 className="mr-2 h-4 w-4" />Gerenciar Pneus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-500">Nenhum veículo encontrado</div>
                )}
            </div>

            {/* modais */}
            {selectedVehicle && (
                <VehicleModal
                    isOpen={openVehicle} onClose={() => setOpenVehicle(false)}
                    vehicle={selectedVehicle} layout={layout()}
                    vehicleTires={vehicleTires} swapMode={swapMode} setSwapMode={setSwapMode}
                    swapA={swapA} swapB={swapB}
                    onTireClick={handleTireClick} onExportPdf={exportPdf} calculateKm={calcKm}
                />
            )}

            <TirePositionModal
                isOpen={openPos} onClose={() => setOpenPos(false)}
                position={posToEdit} assignedTire={assignedTire}
                stockTires={stockTires} selectedStockTire={selectedStockTire} setSelectedStockTire={setSelectedStockTire}
                oldTireDestination={oldTireDestination} setOldTireDestination={setOldTireDestination}
                onConfirm={swapOrAssign}
            />

            <SwapConfirmModal
                isOpen={openSwap} onClose={() => setOpenSwap(false)}
                swapA={swapA} swapB={swapB}
                onConfirm={confirmSwap}
            />
        </div>
    );
}