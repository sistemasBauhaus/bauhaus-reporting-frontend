import React from 'react';
import { NivelTanque } from '../api/reportes';

interface NivelesTanquesDashboardProps {
  tanquesPorEstacion: Record<string, NivelTanque[]>;
}

const NivelesTanquesDashboard: React.FC<NivelesTanquesDashboardProps> = ({ tanquesPorEstacion }) => {
  const estaciones = Object.entries(tanquesPorEstacion);
  const numEstaciones = estaciones.length;
  
  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow p-6 mb-6 w-full">
      <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Niveles de Tanques</h2>
      <div className="flex justify-center w-full">
        <div className={`grid gap-8 ${numEstaciones === 1 ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 w-full max-w-6xl'}`}>
          {estaciones.map(([estacion, tanques]) => (
            <div key={estacion} className="flex flex-col items-center w-full">
              <h3 className="text-xl font-bold text-blue-900 mb-4 text-center w-full">{estacion}</h3>
              <div className="flex justify-center w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 place-items-center w-auto">
                  {tanques.map((tanque) => (
                    <div key={tanque.tanque_id} className="flex flex-col items-center">
                      <div className="text-xs font-bold text-blue-900 mb-2 text-center uppercase">
                        {tanque.nombre_producto}
                      </div>
                      <div className="relative w-16 h-40 bg-gray-200 rounded-t-lg border-2 border-blue-400 overflow-hidden flex flex-col justify-end">
                        <div
                          className="w-full bg-blue-500 transition-all"
                          style={{ height: `${Math.min(tanque.porcentaje, 100)}%` }}
                        />
                        <div className="absolute top-1 left-0 right-0 text-center text-xs font-bold text-blue-900 z-10">
                          {tanque.porcentaje.toFixed(0)}%
                        </div>
                      </div>
                      {/* Fuel pump icon representation */}
                      <div className="mt-1 text-center">
                        <div className="text-xs text-gray-600">
                          {tanque.capacidad.toLocaleString()} LITER CAPACITY
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {numEstaciones === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-8">
              No hay datos de tanques disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NivelesTanquesDashboard;

