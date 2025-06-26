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

    /* ---------- PDF ---------- */
    const exportPdf = useCallback(() => {
        if (!selectedVehicle) return;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();

        const BOX_H = 24, MARK_W = 28, INFO_W = 28, GAP_W = 10, GAP_H = 12;
        const FIRE = 6, FIRE_G = 1;
        const drawFire = (x, y) => { for (let i = 0; i < 6; i++) doc.rect(x + i * (FIRE + FIRE_G), y, FIRE, FIRE); };
        const lineField = (lab, x, y, w) => {
            doc.text(lab, x, y); const lw = doc.getTextWidth(lab);
            doc.line(x + lw + 2, y - 1.5, x + lw + 2 + w, y - 1.5);
        };

        /* cabeçalho */
        doc.setFont('helvetica', 'bold').setFontSize(10);
        doc.text('DISTRIBUIDORA PRINCESA', 10, 10);
        doc.text('Cartão de Troca de Pneu', 10, 16);
        doc.setFont('helvetica', 'normal').setFontSize(9);
        lineField('Veículo:', 60, 22, 32);
        lineField('Placa :', 105, 22, 28);
        lineField('Km. Atual :', 145, 22, 26);
        doc.setFontSize(8);
        doc.text('Data ______/______/______', 10, 28);
        doc.text('Local ______________________', 65, 28);
        doc.text('Responsável/Borracheiro ______________________', 125, 28);
        doc.line(10, 30, pageW - 10, 30);
        doc.text('Preencha com Marca de Fogo do Pneu dentro das Respectivas Posições', 10, 34);
        doc.text('Km Pneu = Total', pageW - 38, 34);

        /* linhas de eixos */
        const groupW = MARK_W + INFO_W;
        const maxRowW = Math.max(...layout().map(ax => ax.pos.length * groupW + (ax.pos.length - 1) * GAP_W));
        const baseX = (pageW - maxRowW) / 2;
        const rows = []; let yOff = 38;

        layout().forEach(axle => {
            let x = baseX; const marks = [];
            axle.pos.forEach(p => {
                const t = vehicleTires.find(vt => vt.posicaoVeiculo === p) || {};
                doc.rect(x, yOff, MARK_W, BOX_H);
                doc.setFontSize(9).text(p, x + 2, yOff + 5);
                drawFire(x + 4, yOff + 10);
                marks.push(x + MARK_W / 2);

                const infoX = x + MARK_W;
                doc.rect(infoX, yOff, INFO_W, BOX_H);
                doc.setFontSize(7);
                doc.text('Nº:', infoX + 2, yOff + 8);
                doc.text(String(t.numeroSerie || '___'), infoX + 10, yOff + 8);
                doc.text('Km:', infoX + 2, yOff + 13);
                doc.text(String(t.kmInicial ?? 0), infoX + 10, yOff + 13);
                doc.text('Dim.', infoX + 2, yOff + 18);
                doc.text(String(t.dimensao || ''), infoX + 10, yOff + 18);

                x += groupW + GAP_W;
            });
            rows.push({ y: yOff, marks });
            yOff += BOX_H + GAP_H;
        });

        /* ligações + quadrado */
        doc.setLineWidth(0.4);
        for (let i = 0; i < rows.length - 1; i++) {
            const x = rows[0].marks[0];
            doc.line(x, rows[i].y + BOX_H, x, rows[i + 1].y);
        }
        if (rows.length >= 2) {
            const x = rows[0].marks[0];
            const y = (rows[0].y + BOX_H + rows[1].y) / 2 - 3;
            doc.setFillColor(0).rect(x - 3, y, 6, 6, 'F');
        }
        doc.setLineWidth(0.2);

        /* estepe */
        const sparePos = layout().find(ax => ax.eixo.toLowerCase().includes('estepe'))?.pos[0] || 'E1';
        const st = vehicleTires.find(vt => vt.posicaoVeiculo === sparePos) || {};
        const sX = baseX, sY = yOff + 5;
        doc.rect(sX, sY, MARK_W, BOX_H);
        doc.setFontSize(9).text(sparePos, sX + 2, sY + 5);
        drawFire(sX + 4, sY + 10);
        doc.rect(sX + MARK_W, sY, INFO_W, BOX_H);
        doc.setFontSize(7);
        doc.text('Nº:', sX + MARK_W + 2, sY + 8);
        doc.text(String(st.numeroSerie || '***'), sX + MARK_W + 10, sY + 8);
        doc.text('Km :', sX + MARK_W + 2, sY + 13);
        doc.text(String(st.kmInicial ?? 0), sX + MARK_W + 10, sY + 13);
        doc.text('Dim.', sX + MARK_W + 2, sY + 18);
        doc.text(String(st.dimensao || ''), sX + MARK_W + 10, sY + 18);

        doc.text('TL15560 / RL15560', pageW - 35, doc.internal.pageSize.getHeight() - 5);
        doc.save(`cartao-${selectedVehicle.placa}.pdf`);
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
                        <tr>{['Placa', 'Marca', 'Modelo', 'Tipo', 'Km', 'Ações'].map(h => (
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
                                    {getKmField(v)?.toLocaleString?.() ?? '—'} km
                                </td>
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
