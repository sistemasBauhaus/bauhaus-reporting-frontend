
import React, { useState, useEffect } from 'react';
import { fetchUnidadesEmpresa, fetchPosicionesUnidades, UnidadEmpresa, PosicionUnidad } from '../../api/reportes';
import MapComponent from './MapComponent';




const UnidadesEmpresa: React.FC = () => {
  // Hooks de estado SIEMPRE al inicio
  const [data, setData] = useState<UnidadEmpresa[]>([]);
  const [posiciones, setPosiciones] = useState<PosicionUnidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadEmpresa | null>(null);
  const [selectedPosicion, setSelectedPosicion] = useState<PosicionUnidad | null>(null);
  // Eliminar estados de carga de mapa dinámico
  // Filtros visuales para el mapa (deben estar aquí, no después de ningún return)
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPlaca, setFiltroPlaca] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Eliminar useEffect de carga dinámica

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener las unidades sin filtro de fechas
      const unidadesData = await fetchUnidadesEmpresa();
      console.log('📦 Unidades crudas recibidas:', unidadesData);
      setData(unidadesData);

      // Obtener las posiciones (sincronizar=true por defecto)
      const posicionesData = await fetchPosicionesUnidades(100, true);
      console.log('📦 Posiciones crudas recibidas:', posicionesData);
      setPosiciones(posicionesData);
    } catch (err) {
      setError('Error al cargar datos: ' + (err as Error).message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-blue-700 text-base font-medium animate-pulse">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-red-600 text-base font-medium">{error}</span>
      </div>
    );
  }


  // Cálculo correcto de unidades activas/inactivas y en movimiento
  const unidadesActivas = data.filter(item => item.estado === 'Activa').length;
  const unidadesInactivas = data.filter(item => item.estado === 'Inactiva').length;
  const totalAlertas = data.reduce((sum, item) => sum + item.alertas.length, 0);

  // Agrupar posiciones por placa (última posición de cada vehículo)
  const posicionesPorPlaca = new Map<string, PosicionUnidad>();
  posiciones.forEach(pos => {
    if (!posicionesPorPlaca.has(pos.plate) || 
        new Date(pos.date) > new Date(posicionesPorPlaca.get(pos.plate)!.date)) {
      posicionesPorPlaca.set(pos.plate, pos);
    }
  });

  const posicionesUnicas = Array.from(posicionesPorPlaca.values());
  // Unidades en movimiento: speed > 0
  const unidadesEnMovimiento = posicionesUnicas.filter(pos => parseFloat(pos.speed) > 0).length;

  // Filtros para el mapa (mantener lógica original)
  const posicionesFiltradas = posicionesUnicas.filter(pos => {
    const isMoving = parseFloat(pos.speed) > 0;
    let estadoOk = true;
    if (filtroEstado === 'movimiento') estadoOk = isMoving;
    if (filtroEstado === 'detenido') estadoOk = !isMoving;
    let placaOk = true;
    if (filtroPlaca) placaOk = pos.plate.toLowerCase().includes(filtroPlaca.toLowerCase());
    return estadoOk && placaOk;
  });

  return (
    <div className="py-6 px-2 md:px-6 min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Unidades de la Empresa
        </h1>

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card Activas */}
          <div className="flex flex-col items-center bg-white border-2 border-blue-200 rounded-2xl shadow p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.3 7.3-5 5a1 1 0 0 1-1.4 0l-2-2a1 1 0 1 1 1.4-1.4l1.3 1.3 4.3-4.3a1 1 0 1 1 1.4 1.4Z"/></svg>
            </div>
            <span className="text-xs font-semibold text-blue-700 mb-1">Unidades Activas</span>
            <span className="text-3xl font-extrabold text-blue-900">{unidadesActivas}</span>
          </div>
          {/* Card Inactivas */}
          <div className="flex flex-col items-center bg-white border-2 border-blue-200 rounded-2xl shadow p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.3 7.3a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4 0l-2-2a1 1 0 1 1 1.4-1.4l1.3 1.3 4.3-4.3a1 1 0 0 1 1.4 0Z"/></svg>
            </div>
            <span className="text-xs font-semibold text-blue-700 mb-1">Unidades Inactivas</span>
            <span className="text-3xl font-extrabold text-blue-900">{unidadesInactivas}</span>
          </div>
          {/* Card En Movimiento */}
          <div className="flex flex-col items-center bg-white border-2 border-blue-200 rounded-2xl shadow p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M4 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1Zm12 0v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1ZM3 13h18v-2a1 1 0 0 0-1-1h-1.34l-1.6-4.79A2 2 0 0 0 15.15 4H8.85a2 2 0 0 0-1.91 1.21L5.34 10H4a1 1 0 0 0-1 1v2Zm2.42-6.21A4 4 0 0 1 8.85 6h6.3a4 4 0 0 1 3.43 1.79L20.66 12H3.34l2.08-5.21ZM12 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
            </div>
            <span className="text-xs font-semibold text-blue-700 mb-1">Unidades en Movimiento</span>
            <span className="text-3xl font-extrabold text-blue-900">{unidadesEnMovimiento}</span>
          </div>
        </div>

        {/* Filtros visuales para el mapa */}
        <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Mapa de Argentina - Posiciones de Unidades Móviles</h2>
          
          <div className="w-full h-[600px] rounded-lg overflow-hidden border border-blue-200">
            <MapComponent 
              posiciones={posicionesFiltradas} 
              onMarkerClick={setSelectedPosicion}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Haz clic en los marcadores para ver información detallada. Verde = En movimiento, Rojo = Detenido
          </p>
        </div>

        {/* Información detallada de posición seleccionada */}
        {selectedPosicion && (
          <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-blue-900">Información Detallada - {selectedPosicion.plate}</h2>
              <button
                onClick={() => setSelectedPosicion(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Fecha y Hora:</span> {new Date(selectedPosicion.date).toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Ubicación:</span> {selectedPosicion.lat}, {selectedPosicion.lng}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Velocidad:</span> {selectedPosicion.speed} km/h
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Dirección:</span> {selectedPosicion.direction}°
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Evento:</span> {selectedPosicion.event} ({selectedPosicion.event_code})
                </p>
              </div>
              <div>
                {selectedPosicion.driver_name && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Conductor:</span> {selectedPosicion.driver_name}
                  </p>
                )}
                {selectedPosicion.driver_document && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Documento:</span> {selectedPosicion.driver_document}
                  </p>
                )}
                {selectedPosicion.odometer !== undefined && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Odómetro:</span> {selectedPosicion.odometer.toLocaleString('es-AR')} km
                  </p>
                )}
                {selectedPosicion.hourmeter !== undefined && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Horómetro:</span> {selectedPosicion.hourmeter.toLocaleString('es-AR')} horas
                  </p>
                )}
                {selectedPosicion.imei && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">IMEI:</span> {selectedPosicion.imei}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid de Unidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.map((unidad, index) => (
            <div
              key={index}
              className={`bg-white border rounded-xl shadow p-4 cursor-pointer transition hover:shadow-lg ${
                unidad.estado === 'Activa' ? 'border-green-200' : 'border-red-200'
              }`}
              onClick={() => setSelectedUnidad(unidad)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-blue-900">{unidad.nombre}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    unidad.estado === 'Activa'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {unidad.estado}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Estaciones:</span> {(unidad as any).total_estaciones || 0}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Cajas:</span> {(unidad as any).total_cajas || 0}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Unidades:</span> {(unidad as any).total_unidades || 0}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Días Actividad:</span> {(unidad as any).dias_con_actividad || 0}
                </p>
              </div>
              {unidad.alertas.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Alertas:</p>
                  <ul className="list-disc list-inside text-xs text-yellow-600">
                    {unidad.alertas.slice(0, 2).map((alerta, i) => (
                      <li key={i}>{alerta}</li>
                    ))}
                    {unidad.alertas.length > 2 && (
                      <li className="text-gray-500">+{unidad.alertas.length - 2} más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Listado de Unidades</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Empresa</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Estaciones</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Cajas</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Unidades</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Días Actividad</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Estado</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const unidadExtendida = item as any;
                  return (
                    <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                      <td className="py-3 px-4 md:px-6 font-semibold">{item.nombre}</td>
                      <td className="py-3 px-4 md:px-6 text-right">{unidadExtendida.total_estaciones || 0}</td>
                      <td className="py-3 px-4 md:px-6 text-right">{unidadExtendida.total_cajas || 0}</td>
                      <td className="py-3 px-4 md:px-6 text-right">{unidadExtendida.total_unidades || 0}</td>
                      <td className="py-3 px-4 md:px-6 text-right">{unidadExtendida.dias_con_actividad || 0}</td>
                      <td className="py-3 px-4 md:px-6">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.estado === 'Activa'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 md:px-6 text-right">
                        {item.alertas.length > 0 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            {item.alertas.length}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnidadesEmpresa;
