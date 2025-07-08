// src/pages/VehicleTireManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2 } from 'lucide-react';
import api from '../services/apiFlask';
import VehicleModal from './components/VehicleModal.jsx';
import TirePositionModal from './components/TirePositionModal.jsx';
import SwapConfirmModal from './components/SwapConfirmModal.jsx';

/* ───────────────────────── layouts ───────────────────────── */
const TIRE_LAYOUTS = {
    Passeio: [
        { eixo: "Eixo Dianteiro", pos: ["1E", "1D"] },
        { eixo: "Eixo Traseiro", pos: ["2E", "2D"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    Delivery: [
        { eixo: "1º Eixo (Dianteiro)", pos: ["1E", "1D"] },
        { eixo: "2º Eixo (Traseiro)", pos: ["2E", "2D"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    "3/4": [
        { eixo: "1º Eixo (Dianteiro)", pos: ["1E", "1D"] },
        { eixo: "2º Eixo (Traseiro)", pos: ["2DE", "2DI", "2EI", "2EE"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    Toco: [
        { eixo: "1º Eixo (Dianteiro)", pos: ["1E", "1D"] },
        { eixo: "2º Eixo (Traseiro)", pos: ["2DE", "2DI", "2EI", "2EE"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    Truck: [
        { eixo: "1º Eixo (Dianteiro)", pos: ["1E", "1D"] },
        { eixo: "2º Eixo (Traseiro)", pos: ["2E", "2D"] },
        { eixo: "3º Eixo (Traseiro)", pos: ["3DE", "3DI", "3EI", "3EE"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    "Bi-truck": [
        { eixo: "1º Eixo (Dianteiro)", pos: ["1E", "1D"] },
        { eixo: "2º Eixo", pos: ["2E", "2D"] },
        { eixo: "3º Eixo", pos: ["3DE", "3DI", "3EI", "3EE"] },
        { eixo: "4º Eixo", pos: ["4DE", "4DI", "4EI", "4EE"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    Cavalo: [
        { eixo: "1º Eixo (Dianteiro)", pos: ["1E", "1D"] },
        { eixo: "2º Eixo", pos: ["2DE", "2DI", "2EI", "2EE"] },
        { eixo: "3º Eixo", pos: ["3D", "3E"] },
        { eixo: "Estepe", pos: ["E"] },
    ],
    "Semi-Reboque (Bi-Trem)": [
        { eixo: "1º Eixo", pos: ["1DE", "1E"] },
        { eixo: "2º Eixo", pos: ["2DE", "2DI", "2EI", "2EE"] },
        { eixo: "Estepe", pos: ["E", "E"] },
    ],
    "Semi-Reboque (Rodo-Trem)": [
        { eixo: "1º Eixo", pos: ["1D", "1E"] },
        { eixo: "2º Eixo", pos: ["2DE", "2DI", "2EI", "2EE"] },
        { eixo: "3º Eixo", pos: ["3DE", "3DI", "3EI", "3EE"] },
        { eixo: "Estepe", pos: ["E", "E"] },
    ],
};

// Base64 da imagem de slot de pneu (copie a string completa do seu código)
const SLOT_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAu4AAACoCAYAAAC/g2uSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAASXSURBVHhe7dzBbRpRAEXR77RCDVRAK0hQEki0QgWmBFzLZBOjgcUEOZbjK58jefEHVm8x3MWXX6ZpmsYf5/N5nE6n9yMAAPBNvMzD/Xg8jv1+f/8NAADgv/v1+AAAAPh+hDsAAAQIdwAACFi8477ZbMZ2u72dAfjZlv6Jgd8MgM83f+8uhvtutxuHw+F2BuBne/ydmPObAfD55u9dV2UAACBAuAMAQIBwBwCAAOEOAAABwh0AAAKEOwAABAh3AAAIEO4AABAg3AEAIEC4AwBAgHAHAIAA4Q4AAAHCHQAAAoQ7AAAECHcAAAgQ7gAAECDcAQAgQLgDAECAcAcAgADhDgAAAcIdAAAChDsAAAQIdwAACBDuAAAQINwBACBAuAMAQIBwBwCAAOEOAAABwh0AAAKEOwAABAh3AAAIEO4AABAg3AEAIEC4AwBAgHAHAIAA4Q4AAAHCHQAAAoQ7AAAECHcAAAgQ7gAAECDcAQAgQLgDAECAcAcAgADhDgAAAcIdAAAChDsAAAQIdwAACBDuAAAQINwBACBAuAMAQIBwBwCAAOEOAAABwh0AAAKEOwAABAh3AAAIEO4AABAg3AEAIEC4AwBAgHAHAIAA4Q4AAAHCHQAAAoQ7AAAECHcAAAgQ7gAAECDcAQAgQLgDAECAcAcAgADhDgAAAcIdAAAChDsAAAQIdwAACBDuAAAQINwBACBAuAMAQIBwBwCAgJdpmqb3w/F4HPv9/vbharUa6/X6dgbgZ7ter+NyuTw+HmOMsdvtxuFweHwMwD+Y9/liuAPAs4Q7wOeb97mrMgAAECDcAQAgYPGqzGazGdvt9nbm787n8zidTo+Px7DnIrt9zNJuw3ZPW9rRhveWtnJVBuDz3fX5NHM4HKYxxu1vt9vNP+YJjxva8zl2+5il3Wz3vKUdbXjPVgBfa/7edVUGAAAChDsAAAQIdwAACBDuAAAQINwBACBAuAMAQIBwBwCAAOEOAAABwh0AAAKEOwAABAh3AAAIEO4AABAg3AEAIEC4AwBAgHAHAIAA4Q4AAAHCHQAAAoQ7AAAECHcAAAgQ7gAAECDcAQAgQLgDAECAcAcAgADhDgAAAcIdAAAChDsAAAQIdwAACBDuAAAQINwBACBAuAMAQIBwBwCAAOEOAAABwh0AAAKEOwAABAh3AAAIEO4AABAg3AEAIEC4AwBAgHAHAIAA4Q4AAAHCHQAAAoQ7AAAECHcAAAgQ7gAAECDcAQAgQLgDAECAcAcAgADhDgAAAcIdAAAChDsAAAQIdwAACBDuAAAQINwBACBAuAMAQIBwBwCAAOEOAAABwh0AAAKEOwAABAh3AAAIEO4AABAg3AEAIEC4AwBAgHAHAIAA4Q4AAAHCHQAAAoQ7AAAECHcAAAgQ7gAAECDcAQAgQLgDAECAcAcAgADhDgAAAcIdAAAChDsAAAQIdwAACHiZpml6PxyPx7Hf728frlarsV6vb2f+7nq9jsvl8vh4DHsustvHLO02bPe0pR1teM9WAF9r/t5dDHcAAOB7cFUGAAAChDsAAATcXZV5e3sbr6+v998AAAD+u98vtOpufHnQ4wAAAABJRU5ErkJggg==';

export default function VehicleTireManagement() {
    const [vehicles, setVehicles] = useState([]);
    const [vehicleTires, setVehicleTires] = useState([]);
    const [stockTires, setStockTires] = useState([]);
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

    useEffect(() => {
        loadVehicles();
        loadStockTires();
    }, []);

    const calculateKm = useCallback(tire => {
        // se kmInicial ou kmFinal não estiver definido, retorna traço
        if (tire.kmInicial == null || tire.kmFinal == null) return '–';
        // calcula a diferença entre kmFinal e kmInicial
        return tire.kmFinal;
    }, []);


    async function loadVehicles() {
        try {
            const { data } = await api.get('/vehicles');
            setVehicles(data || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function loadStockTires() {
        try {
            const { data } = await api.post('/functions/getAllPneus');
            setStockTires(
                (data.result || []).filter(p => p.status.toLowerCase() === 'em estoque')
            );
        } catch (err) {
            console.error(err);
        }
    }

    async function loadVehicleTires(vehicleId) {
        try {
            const { data } = await api.post('/functions/getPneusByVeiculo', { vehicleId });
            setVehicleTires(data.result || []);
        } catch (err) {
            console.error(err);
        }
    }

    const exportPdf = useCallback(() => {
        if (!selectedVehicle) return;
        const date = new Date().toLocaleDateString('pt-BR');
        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Layout Eixos – ${selectedVehicle.tipo}</title>
  <style>
    body { font-family: "Courier New", monospace; font-size:11px; padding:20px; }

    /* cabeçalho principal */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 4px;
    }
    .header-company {
      font-weight: bold;
      font-size: 14px;
    }
    .header-meta {
      text-align: right;
      font-size: 11px;
      line-height: 1.2;
    }
    .header-meta div + div {
      margin-top: 2px;
    }

    /* título sublinhado */
    .header-title {
      font-weight: bold;
      font-size: 12px;
      text-decoration: underline;
      margin: 4px 0 8px;
    }

    /* linha Veículo / Placa / Km Atual */
    .header-vehicle {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .field-underline {
      display: inline-block;
      min-width: 80px;
      border-bottom: 1px solid #000;
      margin-left: 4px;
    }

    /* linha Data / Local / Responsável */
    .header-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 8px;
    }
    .header-info div {
      white-space: nowrap;
    }

    hr { border: none; border-top: 1px solid #000; margin: 0 0 8px; }

    /* instruções */
    .header-instr {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 12px;
    }

    /* layout de eixos */
    .axle-dual {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
    }
    .axle-vertical {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      min-width: 230px;
    }
    .slot {
      position: relative;
      display: inline-block;
    }
    .slot.tight { margin: 2px 0; }
    .slot img {
      width: 210px;
      height: 60px;
      display: block;
    }
    .txt {
      position: absolute;
      font-size: 11px;
      pointer-events: none;
    }
    .txt.code   { font-weight: 700; top: 4px;  left: 4px;   }
    .txt.nlabel { top: 4px;  left: 115px; }
    .txt.km     { top: 18px; left: 115px; }
    .txt.dim    { top: 34px; left: 115px; }
    .connectors {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: -2px 0;
    }
    .connector-vertical {
      width: 0;
  height: 40px;
  border-left: 2px solid #000;
    }
    .reinforced {
      width: 25px; height: 25px;
      border: 5px solid #000;
      border-radius: 70%;
      background: #fff;
    }
    .small-connector-group {
      display: flex;
      gap: 36px;
      margin: -2px 0;
    }
    .small-connector {
      width: 2px;
      height: 10px;
      border-left: 2px solid #000;
    }
  </style>
</head>
<body>
  <div class="header-top">
    <div class="header-company">DISTRIBUIDORA PRINCESA</div>
    <div class="header-meta">
      <div>Data: <span class="field-underline">${date}</span></div>
      <div>Pág.: <span class="field-underline">1 / 1</span></div>
    </div>
  </div>

  <div class="header-title">Cartão de Troca de Pneu</div>

  <div class="header-vehicle">
    <div>Veículo: <span class="field-underline">${selectedVehicle.modelo}</span></div>
    <div>Placa:  <span class="field-underline">${selectedVehicle.placa}</span></div>
    <div>Km. Atual: <span class="field-underline">__________</span></div>
  </div>

  <div class="header-info">
    <div>Data <span class="field-underline"></span></div>
    <div>Local <span class="field-underline"></span></div>
    <div>Responsável/Borracheiro <span class="field-underline"></span></div>
  </div>

  <hr />

  <div class="header-instr">
    <div>Preencha com Marca de Fogo do Pneu dentro das Respectivas Posições</div>
    <div>Km Pneu = Total</div>
  </div>

  <h1 style="text-align:center">Layout de Eixos Dinâmico – ${selectedVehicle.tipo}</h1>
  <div class="axle-dual" id="axlesContainer"></div>

  <script>
    const TIRE_LAYOUTS = ${JSON.stringify(TIRE_LAYOUTS)};
    const vehicleTires = ${JSON.stringify(vehicleTires)};

    function createSlot({ code, numeroSerie, km, dim }, tight=false) {
      const s = document.createElement('div');
      s.className = tight ? 'slot tight' : 'slot';
      const img = new Image(); img.src='${SLOT_PNG}';
      s.appendChild(img);
      [
        [code, 'code'],
        ['N: ' + (numeroSerie || '–'), 'nlabel'],
        ['Km: ' + (km || '–'), 'km'],
        ['Dim.: ' + (dim || '–'), 'dim']
      ].forEach(([txt, cls]) => {
        const d = document.createElement('div');
        d.className = 'txt ' + cls;
        d.textContent = txt;
        s.appendChild(d);
      });
      return s;
    }

    function createSmallConnector() {
      const d = document.createElement('div');
      d.className = 'small-connector';
      return d;
    }

    function mountLayout() {
      const c = document.getElementById('axlesContainer');
      c.innerHTML = '';
      (TIRE_LAYOUTS['${selectedVehicle.tipo}'] || []).forEach(def => {
        const col = document.createElement('div');
        col.className = 'axle-vertical';
        const conn = document.createElement('div');
        conn.className = 'connectors';

        if (def.pos.length === 2) {
          conn.appendChild(Object.assign(document.createElement('div'),{className:'connector-vertical'}));
          conn.appendChild(Object.assign(document.createElement('div'),{className:'connector-vertical'}));
        } else if (def.pos.length === 4) {
          conn.appendChild(Object.assign(document.createElement('div'),{className:'connector-vertical'}));
          const r = document.createElement('div');
          r.className = 'reinforced';
          conn.appendChild(r);
          conn.appendChild(Object.assign(document.createElement('div'),{className:'connector-vertical'}));
        }

        col.appendChild(conn);

        if (def.pos.length === 2) {
          def.pos.forEach((code, i) => {
            const t = vehicleTires.find(t => t.posicaoVeiculo === code) || {};
            const slot = createSlot({
              code,
              numeroSerie: t.numeroSerie,
              km: t.kmFinal,
              dim: t.dimensao
            });
            i === 0 ? col.insertBefore(slot, conn) : col.appendChild(slot);
          });
        } else if (def.pos.length === 4) {
          const [a,b,c,d] = def.pos;
          const tA = vehicleTires.find(t => t.posicaoVeiculo === a) || {};
          const tB = vehicleTires.find(t => t.posicaoVeiculo === b) || {};
          const tC = vehicleTires.find(t => t.posicaoVeiculo === c) || {};
          const tD = vehicleTires.find(t => t.posicaoVeiculo === d) || {};
          col.insertBefore(createSlot({code:a, numeroSerie:tA.numeroSerie, km:tA.kmInicial, dim:tA.dimensao}, true), conn);

          const topG = document.createElement('div');
          topG.className = 'small-connector-group';
          topG.append(createSmallConnector(), createSmallConnector());
          col.insertBefore(topG, conn);

          col.insertBefore(createSlot({code:b, numeroSerie:tB.numeroSerie, km:tB.kmInicial, dim:tB.dimensao}, true), conn);
          col.appendChild(createSlot({code:c, numeroSerie:tC.numeroSerie, km:tC.kmInicial, dim:tC.dimensao}, true));

          const botG = document.createElement('div');
          botG.className = 'small-connector-group';
          botG.append(createSmallConnector(), createSmallConnector());
          col.appendChild(botG);

          col.appendChild(createSlot({code:d, numeroSerie:tD.numeroSerie, km:tD.kmInicial, dim:tD.dimensao}, true));
        } else {
          const code = def.pos[0];
          const t = vehicleTires.find(t => t.posicaoVeiculo === code) || {};
          col.insertBefore(createSlot({
            code,
            numeroSerie: t.numeroSerie,
            km: t.kmFinal,
            dim: t.dimensao
          }), conn);
        }

        c.appendChild(col);
      });
    }

    mountLayout();
  </script>
</body>
</html>`;

        const win = window.open();
        win.document.write(html);
        win.document.close();
    }, [selectedVehicle, vehicleTires]);

    const clickVehicle = async v => {
        await loadVehicleTires(v.id || v.objectId);
        setSelectedVehicle(v);
        setOpenVehicle(true);
    };

    const handleTireClick = (pos, tire) => {
        if (!swapMode) {
            setPosToEdit(pos);
            setAssignedTire(tire || null);
            setOpenPos(true);
        } else if (!swapA) {
            setSwapA({ pos, tire });
        } else if (!swapB && swapA.pos !== pos) {
            setSwapB({ pos, tire });
            setOpenSwap(true);
        }
    };

    const swapOrAssign = async () => {
        if (!selectedStockTire) return alert('Selecione um pneu');
        try {
            if (assignedTire) {
                await api.post('/functions/editarPneu', {
                    objectId: assignedTire.objectId,
                    veiculoId: '',
                    posicaoVeiculo: '',
                    status: oldTireDestination
                });
            }
            await api.post('/functions/editarPneu', {
                objectId: selectedStockTire.objectId,
                veiculoId: selectedVehicle.id || selectedVehicle.objectId,
                posicaoVeiculo: posToEdit,
                status: 'Em uso'
            });
            await loadVehicleTires(selectedVehicle.id || selectedVehicle.objectId);
            setOpenPos(false);
        } catch (e) {
            console.error(e);
            alert('Falha na troca');
        }
    };

    const confirmSwap = async () => {
        try {
            await api.post('/functions/editarPneu', {
                objectId: swapA.tire?.objectId,
                veiculoId: selectedVehicle.id || selectedVehicle.objectId,
                posicaoVeiculo: swapB.pos,
                status: 'Em uso'
            });
            await api.post('/functions/editarPneu', {
                objectId: swapB.tire?.objectId,
                veiculoId: selectedVehicle.id || selectedVehicle.objectId,
                posicaoVoiculo: swapA.pos,
                status: 'Em uso'
            });
            await loadVehicleTires(selectedVehicle.id || selectedVehicle.objectId);
            setOpenSwap(false);
            setSwapMode(false);
            setSwapA(null);
            setSwapB(null);
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = vehicles.filter(v =>
        v.placa.toLowerCase().includes(vehicleSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Pesquisa */}
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

            {/* Tabela de veículos */}
            <div className="bg-white rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Placa', 'Marca', 'Modelo', 'Tipo', 'Ações'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
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
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Gerenciar Pneus
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

            {/* Modais */}
            {selectedVehicle && (
                <VehicleModal
                    isOpen={openVehicle}
                    onClose={() => setOpenVehicle(false)}
                    vehicle={selectedVehicle}
                    layout={TIRE_LAYOUTS[selectedVehicle.tipo] || []}
                    vehicleTires={vehicleTires}
                    swapMode={swapMode}
                    setSwapMode={setSwapMode}
                    swapA={swapA}
                    swapB={swapB}
                    onTireClick={handleTireClick}
                    onExportPdf={exportPdf}
                    calculateKm={calculateKm}
                />
            )}

            <TirePositionModal
                isOpen={openPos}
                onClose={() => setOpenPos(false)}
                position={posToEdit}
                assignedTire={assignedTire}
                stockTires={stockTires}
                selectedStockTire={selectedStockTire}
                setSelectedStockTire={setSelectedStockTire}
                oldTireDestination={oldTireDestination}
                setOldTireDestination={setOldTireDestination}
                onConfirm={swapOrAssign}
            />

            <SwapConfirmModal
                isOpen={openSwap}
                onClose={() => setOpenSwap(false)}
                swapA={swapA}
                swapB={swapB}
                onConfirm={confirmSwap}
            />
        </div>
    );
}
