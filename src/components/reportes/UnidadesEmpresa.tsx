import React, { useState, useEffect } from 'react';
import { fetchUnidadesEmpresa, UnidadEmpresa } from '../../api/reportes';

interface UnidadesEmpresaProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const UnidadesEmpresa: React.FC<UnidadesEmpresaProps> = ({ fechaInicio, fechaFin, onFechaChange }) => {
  const [data, setData] = useState<UnidadEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadEmpresa | null>(null);

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchUnidadesEmpresa();
      setData(result);
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

  const getGoogleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
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
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Alertas</span>
            <span className="text-2xl md:text-3xl font-extrabold text-yellow-600">{totalAlertas}</span>
          </div>
        </div>

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
              <p className="text-sm text-gray-600 mb-2">{unidad.direccion}</p>
              <p className="text-xs text-gray-500 mb-2">
                <span className="font-semibold">Tipo:</span> {unidad.tipo}
              </p>
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
              <a
                href={getGoogleMapsUrl(unidad.latitud, unidad.longitud)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800"
                onClick={e => e.stopPropagation()}
              >
                Ver en mapa →
              </a>
            </div>
          ))}
        </div>

        {/* Mapa embebido (si hay una unidad seleccionada) */}
        {selectedUnidad && (
          <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-blue-900">{selectedUnidad.nombre}</h2>
              <button
                onClick={() => setSelectedUnidad(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Dirección:</span> {selectedUnidad.direccion}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Tipo:</span> {selectedUnidad.tipo}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Estado:</span>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    selectedUnidad.estado === 'Activa'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedUnidad.estado}
                </span>
              </p>
              {selectedUnidad.alertas.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-yellow-700 mb-1">Alertas:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-600">
                    {selectedUnidad.alertas.map((alerta, i) => (
                      <li key={i}>{alerta}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="w-full h-64 rounded-lg overflow-hidden border border-blue-200">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${selectedUnidad.latitud},${selectedUnidad.longitud}`}
                allowFullScreen
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Nota: Para mostrar el mapa, necesitas configurar una API key de Google Maps.
            </p>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Listado de Unidades</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Nombre</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Dirección</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Tipo</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Estado</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Alertas</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 md:px-6 font-semibold">{item.nombre}</td>
                    <td className="py-3 px-4 md:px-6">{item.direccion}</td>
                    <td className="py-3 px-4 md:px-6">{item.tipo}</td>
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
                    <td className="py-3 px-4 md:px-6">
                      <a
                        href={getGoogleMapsUrl(item.latitud, item.longitud)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Ver mapa
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnidadesEmpresa;

