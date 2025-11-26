import React, { useState, useEffect } from 'react';
import { fetchUnidadesEmpresa, fetchPosicionesUnidades, UnidadEmpresa, PosicionUnidad } from '../../api/reportes';

// Importación dinámica del componente del mapa
let MapComponent: React.ComponentType<{ posiciones: PosicionUnidad[]; onMarkerClick: (posicion: PosicionUnidad) => void }> | null = null;

const loadMapComponent = async () => {
  if (!MapComponent) {
    const module = await import('./MapComponent');
    MapComponent = module.default;
  }
  return MapComponent;
};

interface UnidadesEmpresaProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const UnidadesEmpresa: React.FC<UnidadesEmpresaProps> = ({ fechaInicio, fechaFin, onFechaChange }) => {
  const [data, setData] = useState<UnidadEmpresa[]>([]);
  const [posiciones, setPosiciones] = useState<PosicionUnidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadEmpresa | null>(null);
  const [selectedPosicion, setSelectedPosicion] = useState<PosicionUnidad | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [MapComponentLoaded, setMapComponentLoaded] = useState<React.ComponentType<{ posiciones: PosicionUnidad[]; onMarkerClick: (posicion: PosicionUnidad) => void }> | null>(null);

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    // Cargar el componente del mapa de forma asíncrona después del primer render
    const timer = setTimeout(() => {
      loadMapComponent().then((Component) => {
        setMapComponentLoaded(() => Component);
        setMapLoaded(true);
      }).catch((err) => {
        console.error('Error al cargar el componente del mapa:', err);
        setError('Error al cargar el mapa. Por favor, recarga la página.');
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primero obtener las unidades
      const unidadesData = await fetchUnidadesEmpresa(fechaInicio, fechaFin);
      setData(unidadesData);
      
      // Luego sincronizar y obtener las posiciones (sincronizar=true por defecto)
      const posicionesData = await fetchPosicionesUnidades(100, true);
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

  return (
    <div className="py-6 px-2 md:px-6 min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Unidades de la Empresa
        </h1>

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Unidades Activas</span>
            <span className="text-2xl md:text-3xl font-extrabold text-green-600">{unidadesActivas}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Unidades Inactivas</span>
            <span className="text-2xl md:text-3xl font-extrabold text-red-600">{unidadesInactivas}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Unidades en Movimiento</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-600">{posicionesUnicas.length}</span>
          </div>
        </div>

        {/* Mapa de Argentina con posiciones */}
        <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Mapa de Argentina - Posiciones de Unidades Móviles</h2>
          <div className="w-full h-[600px] rounded-lg overflow-hidden border border-blue-200">
            {!mapLoaded || !MapComponentLoaded ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-blue-700 text-base font-medium">Cargando mapa...</span>
              </div>
            ) : (
              <MapComponentLoaded 
                posiciones={posicionesUnicas} 
                onMarkerClick={setSelectedPosicion}
              />
            )}
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
