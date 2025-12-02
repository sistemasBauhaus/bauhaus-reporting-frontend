import React from 'react';
import { NivelTanque } from '../api/tanques';

interface NivelesTanquesDashboardProps {
  tanques: NivelTanque[];
}

const NivelesTanquesDashboard: React.FC<NivelesTanquesDashboardProps> = ({ tanques }) => {
  // Agrupar y sumar por producto
  const tanquesPorProducto: Record<string, NivelTanque[]> = {};
  tanques.forEach((tanque) => {
    const prod = tanque.producto.trim().toUpperCase();
    if (!tanquesPorProducto[prod]) tanquesPorProducto[prod] = [];
    tanquesPorProducto[prod].push(tanque);
  });

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow p-6 mb-6 w-full">
      <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Informe de Tanques</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(tanquesPorProducto).length > 0 ? Object.entries(tanquesPorProducto).map(([producto, tanquesGrupo]) => {
          const totalCapacidad = tanquesGrupo.reduce((acc, t) => acc + Number(t.capacidad), 0);
          const totalNivel = tanquesGrupo.reduce((acc, t) => acc + Number(t.nivel_actual), 0);
          const porcentajeTotal = totalCapacidad > 0 ? (totalNivel / totalCapacidad) * 100 : 0;
          // Tomar la última actualización y temperatura del tanque más reciente
          const lastUpdateTanque = tanquesGrupo.reduce((latest, t) => {
            return new Date(t.fecha_actualizacion) > new Date(latest.fecha_actualizacion) ? t : latest;
          }, tanquesGrupo[0]);
          return (
            <div key={producto} className="bg-blue-50 rounded-xl p-4 shadow flex flex-col items-center">
              <div className="text-base font-bold text-blue-900 mb-2 text-center uppercase">
                {producto}
              </div>
              <div className="text-xs text-gray-600 mb-1">Estación: <span className="font-semibold text-blue-700">Los Olmos</span></div>
              <div className="relative w-16 h-40 bg-gray-200 rounded-t-lg border-2 border-blue-400 overflow-hidden flex flex-col justify-end mb-2">
                <div
                  className="w-full bg-blue-500 transition-all"
                  style={{ height: `${Math.min(porcentajeTotal, 100)}%` }}
                />
                <div className="absolute top-1 left-0 right-0 text-center text-xs font-bold text-blue-900 z-10">
                  {porcentajeTotal.toFixed(0)}%
                </div>
              </div>
              <div className="mt-1 text-center">
                <div className="text-xs text-gray-600">
                  Capacidad total: {totalCapacidad.toLocaleString()} L
                </div>
                <div className="text-xs text-gray-600">
                  Nivel total: {totalNivel.toLocaleString()} L
                </div>
                <div className="text-xs text-gray-600">
                  Temperatura última: {Number(lastUpdateTanque.temperatura).toLocaleString()}°C
                </div>
                <div className="text-xs text-gray-600">
                  Última actualización (UTC): {new Date(lastUpdateTanque.fecha_actualizacion).toISOString()}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  <span className="font-semibold text-blue-900">Tanques incluidos:</span> {tanquesGrupo.map(t => `#${t.id_tanque}`).join(', ')}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-2 text-center text-gray-500 py-8">
            No hay datos de tanques disponibles
          </div>
        )}
      </div>
    </div>
  );
};

export default NivelesTanquesDashboard;

