import React from 'react';
import { Circle } from 'lucide-react';

export default function TireCard({
  position,
  tire,
  isSelected,
  onClick,
  calculateKm,
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer p-4 rounded-lg border-2 transition min-w-[120px] ${isSelected
        ? 'border-blue-500 bg-blue-50 shadow-lg'
        : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
    >
      {/* ícone e posição */}
      <div className="text-center mb-2">
        <Circle
          className={`mx-auto h-8 w-8 ${tire ? 'text-green-500' : 'text-gray-300'
            }`}
        />
        <span className="font-bold text-sm">{position}</span>
      </div>

      {/* info do pneu ou vazio */}
      {tire ? (
        <div className="text-center space-y-1">
          <div className="text-xs font-medium">{tire.numeroSerie}</div>
          <div className="text-xs text-gray-600">
            {tire.fabricante} {tire.modelo}
          </div>
          <div className="text-xs text-gray-500">{tire.dimensao}</div>
          <div className="text-xs font-medium text-blue-600">
            {calculateKm(tire).toLocaleString()} km
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic text-center">[Vazio]</div>
      )}

      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
    </div>
  );
}
