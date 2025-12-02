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
  const estacion = 'Los Olmos';


  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow p-6 mb-6 w-full">
      <div className="mb-4 text-center">
        <span className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-xl shadow px-4 py-2 text-base font-semibold text-blue-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-1a3 3 0 00-3 3v2h5zM9 20h6v-2a3 3 0 00-3-3H9a3 3 0 00-3 3v2h6zM12 4v4m0 0a4 4 0 00-4 4v4h8v-4a4 4 0 00-4-4z" /></svg>
          Estación <span className="text-blue-700 font-bold">{estacion}</span>
        </span>
      </div>
      <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Informe de Tanques</h2>
      <div className="bg-blue-50 rounded-xl p-4 shadow w-full max-w-6xl mx-auto">
        {Object.entries(tanquesPorProducto).length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tanquesPorProducto).map(([producto, tanquesGrupo]) => {
              const totalCapacidad = tanquesGrupo.reduce((acc, t) => acc + Number(t.capacidad), 0);
              const totalNivel = tanquesGrupo.reduce((acc, t) => acc + Number(t.nivel_actual), 0);
              const porcentajeTotal = totalCapacidad > 0 ? (totalNivel / totalCapacidad) * 100 : 0;
              // Tomar la última actualización y temperatura del tanque más reciente
              const lastUpdateTanque = tanquesGrupo.reduce((latest, t) => {
                return new Date(t.fecha_actualizacion) > new Date(latest.fecha_actualizacion) ? t : latest;
              }, tanquesGrupo[0]);
              // Mostrar mensaje si todos los tanques del grupo no tienen datos históricos para el mes
              const todosSinHistorico = tanquesGrupo.every(t => Array.isArray((t as any).historicoMes) && (t as any).historicoMes.length === 0);
                return (
                  <div key={producto} className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center border border-blue-100 hover:shadow-2xl transition-all duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-extrabold text-blue-800 uppercase tracking-wide">{producto}</span>
                      <span className="inline-flex items-center gap-1 bg-blue-200 border border-blue-300 text-blue-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="8" width="14" height="8" rx="3" fill="#e0e7ff" stroke="#3b82f6" strokeWidth="1.5" /><rect x="9" y="10" width="6" height="4" rx="1.5" fill="#60a5fa" /></svg>
                        <span className="font-extrabold text-blue-900 text-xs">{tanquesGrupo.length}</span>
                        <span className="text-[10px] text-blue-700 font-semibold">tanque{tanquesGrupo.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                    {todosSinHistorico ? (
                      <div className="flex flex-col items-center justify-center my-8">
                        <svg className="w-10 h-10 text-blue-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                        </svg>
                        <span className="text-base text-blue-700 font-semibold">Sin datos históricos para este mes</span>
                      </div>
                    ) : (
                      <>
                        <div className="relative w-20 h-44 bg-gradient-to-t from-blue-100 to-blue-50 rounded-t-2xl border-2 border-blue-400 overflow-hidden flex flex-col justify-end mb-3">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                            style={{ height: `${Math.min(porcentajeTotal, 100)}%` }}
                          />
                          <div className="absolute top-2 left-0 right-0 text-center">
                            <span className="inline-block bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow">{porcentajeTotal.toFixed(0)}%</span>
                          </div>
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="inline-block bg-blue-100 text-blue-900 text-xs font-bold px-2 py-1 rounded-full shadow">{totalNivel.toLocaleString()} L</span>
                          </div>
                        </div>
                        <div className="mt-2 w-full flex flex-col gap-1 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-gray-500">Capacidad:</span>
                            <span className="font-bold text-blue-900 text-sm">{totalCapacidad.toLocaleString()} L</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-gray-500">Temperatura última:</span>
                            <span className="font-bold text-blue-900 text-sm">{Number(lastUpdateTanque.temperatura).toLocaleString()}°C</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-gray-500">Actualización:</span>
                            <span className="font-bold text-blue-900 text-xs">{new Date(lastUpdateTanque.fecha_actualizacion).toLocaleString('es-AR')}</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-1 mt-2">
                            <span className="font-semibold text-blue-900 text-xs">Tanques:</span>
                            {tanquesGrupo.map(t => (
                              <span key={t.id_tanque} className="inline-flex items-center gap-1 bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="7" y="10" width="10" height="4" rx="2" fill="#e0e7ff" stroke="#60a5fa" strokeWidth="1" /></svg>
                                <span className="font-extrabold text-blue-900 text-[10px]">{t.id_tanque}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-blue-200 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <span className="text-lg text-blue-700 font-semibold">No hay datos de tanques disponibles para el mes seleccionado</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NivelesTanquesDashboard;

