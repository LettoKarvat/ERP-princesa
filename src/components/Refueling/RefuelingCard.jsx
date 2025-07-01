import React from 'react';
import { Calendar, Fuel, Gauge, Edit3, Eye, Trash2, MapPin, Receipt, Wrench } from 'lucide-react';

export const RefuelingCard = ({ refueling, onEdit, onDetails, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFuelColor = (fuel) => {
    return fuel === 'DIESEL'
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
  };

  const getPostColor = (post) => {
    return post === 'interno'
      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
  };

  const label = refueling.vehicleLabel || refueling.vehicle || refueling.vehicle_id;

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {label}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${getFuelColor(refueling.fuelType)}`}>
              <Fuel className="h-4 w-4 inline mr-2" />
              {refueling.fuelType}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${getPostColor(refueling.post)}`}>
              <MapPin className="h-4 w-4 inline mr-2" />
              {refueling.post.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Dados principais com ícones coloridos */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Gauge className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Quilometragem</p>
              <p className="text-lg font-bold text-blue-900">{refueling.mileage?.toLocaleString()} km</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Fuel className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Volume</p>
              <p className="text-lg font-bold text-emerald-900">{refueling.liters} litros</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Data/Hora</p>
              <p className="text-sm font-semibold text-purple-900">{formatDate(refueling.date)}</p>
            </div>
          </div>
        </div>

        {/* Informações específicas do posto */}
        {refueling.post === 'externo' && refueling.unitPrice && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border-l-4 border-orange-400">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800">Posto Externo</span>
            </div>
            <p className="text-sm text-orange-700">
              <span className="font-medium">Preço:</span> R$ {Number(refueling.unitPrice).toFixed(2)}/L
            </p>
            {refueling.invoiceNumber && (
              <p className="text-sm text-orange-700">
                <span className="font-medium">Nota Fiscal:</span> {refueling.invoiceNumber}
              </p>
            )}
            {refueling.unitPrice && (
              <p className="text-sm font-bold text-orange-800 mt-1">
                Total: R$ {(refueling.unitPrice * refueling.liters).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {refueling.post === 'interno' && refueling.pump && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-purple-400">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Bomba: {refueling.pump}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ações com design moderno */}
      <div className="px-6 pb-6">
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={onDetails}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <Eye className="h-4 w-4" />
            Detalhes
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};