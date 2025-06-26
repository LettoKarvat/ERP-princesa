import React from 'react';
import { X, AlertCircle, Wrench } from 'lucide-react';

export default function TirePositionModal({
  isOpen, onClose, position, assignedTire, stockTires,
  selectedStockTire, setSelectedStockTire,
  oldTireDestination, setOldTireDestination, onConfirm
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Wrench className="h-5 w-5 text-blue-600"/>
            <h2 className="text-lg font-bold">Posição: {position}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {assignedTire && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600"/>
                <div>
                  <h3 className="font-medium text-blue-900">Pneu Atual</h3>
                  <p className="text-sm">{assignedTire.numeroSerie} ({assignedTire.fabricante} {assignedTire.modelo})</p>
                  <p className="text-sm">Status: <strong>{assignedTire.status}</strong></p>
                </div>
              </div>
            </div>
          )}

          {assignedTire && (
            <div>
              <label className="block text-sm font-medium">Destino do Pneu Antigo</label>
              <select value={oldTireDestination} onChange={e=>setOldTireDestination(e.target.value)}
                      className="w-full mt-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="Em recapagem">Em recapagem</option>
                <option value="Sucata">Sucata</option>
                <option value="Em estoque">Em estoque</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Selecionar Pneu do Estoque</label>
            <select value={selectedStockTire?.id||''}
                    onChange={e=>setSelectedStockTire(stockTires.find(t=>t.id===Number(e.target.value)))}
                    className="w-full mt-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione um pneu</option>
              {stockTires.map(t=>(
                <option key={t.id} value={t.id}>{t.numeroSerie} · {t.fabricante} {t.modelo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 bg-white border rounded-lg">Cancelar</button>
          <button onClick={onConfirm} disabled={!selectedStockTire}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
