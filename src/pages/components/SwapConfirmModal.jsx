import React from 'react';
import { X, RotateCcw } from 'lucide-react';

export default function SwapConfirmModal({ isOpen, onClose, swapA, swapB, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <RotateCcw className="h-5 w-5 text-orange-600"/>
            <h2 className="text-lg font-bold">Confirmar Troca</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <div className="p-6">
          <p className="text-center mb-6">
            Deseja trocar <strong>{swapA?.pos}</strong> ↔ <strong>{swapB?.pos}</strong>?
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-center space-y-3">
            {swapA?.tire && <div><strong>{swapA.pos}:</strong> {swapA.tire.numeroSerie}</div>}
            <div className="text-gray-400">↕️</div>
            {swapB?.tire && <div><strong>{swapB.pos}:</strong> {swapB.tire.numeroSerie}</div>}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-orange-600 text-white rounded-lg">Confirmar Troca</button>
        </div>
      </div>
    </div>
  );
}
