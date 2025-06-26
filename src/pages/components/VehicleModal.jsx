import React from 'react';
import { X, FileText, RotateCcw, Truck } from 'lucide-react';
import TireCard from './TireCard.jsx';

export default function VehicleModal({
  isOpen, onClose, vehicle, layout, vehicleTires,
  swapMode, setSwapMode, swapA, swapB,
  onTireClick, onExportPdf, calculateKm
}) {
  if (!isOpen) return null;

  const renderTireLayout = (axle, idx) => (
    <div key={idx} className="mb-6 text-center">
      <h4 className="text-sm font-medium mb-3">{axle.eixo}</h4>
      <div className="flex justify-center flex-wrap gap-4">
        {axle.pos.map((pos) => {
          const tire = vehicleTires.find((t) => t.posicaoVeiculo === pos);
          const sel = swapA?.pos === pos || swapB?.pos === pos;
          return (
            <TireCard
              key={pos}
              position={pos}
              tire={tire}
              isSelected={sel}
              onClick={() => onTireClick(pos, tire)}
              calculateKm={calculateKm}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* ---------- Cabeçalho ---------- */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Veículo: {vehicle.placa}</h2>
              <p className="text-sm text-gray-500">
                {vehicle.marca} {vehicle.modelo} · {vehicle.tipo}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---------- Barra de ações ---------- */}
        <div className="p-6 border-b bg-gray-50 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSwapMode(!swapMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${swapMode
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
              }`}
          >
            <RotateCcw className="inline mr-2 h-4 w-4" />
            {swapMode ? 'Cancelar Troca' : 'Modo Troca de Posições'}
          </button>

          <button
            onClick={onExportPdf}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <FileText className="inline mr-2 h-4 w-4" />
            Exportar PDF
          </button>

          {swapMode && (swapA || swapB) && (
            <span className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
              {swapA && !swapB && (
                <>
                  Posição <strong>{swapA.pos}</strong> selecionada.
                </>
              )}
              {swapA && swapB && (
                <>
                  Pronto para trocar <strong>{swapA.pos}</strong> ↔{' '}
                  <strong>{swapB.pos}</strong>
                </>
              )}
            </span>
          )}
        </div>

        {/* ---------- Layout dos pneus ---------- */}
        <div className="p-8 max-w-5xl mx-auto">
          {layout.map((axle, idx) => renderTireLayout(axle, idx))}
        </div>
      </div>
    </div>
  );
}
