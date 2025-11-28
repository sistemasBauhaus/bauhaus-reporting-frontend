import React, { useState, useEffect } from 'react';
import {
  fetchFacturasVenta,
  FacturaVenta,
} from '../../api/reportes';

interface FacturasProveedoresPendientesProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const FacturasProveedoresPendientes: React.FC<FacturasProveedoresPendientesProps> = ({
  fechaInicio: propFechaInicio,
  fechaFin: propFechaFin,
  onFechaChange,
}) => {
  const [data, setData] = useState<FacturaVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>(propFechaInicio || '');
  const [fechaFin, setFechaFin] = useState<string>(propFechaFin || '');

  useEffect(() => {
    if (propFechaInicio && propFechaFin) {
      setFechaInicio(propFechaInicio);
      setFechaFin(propFechaFin);
    } else {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const inicio = firstDay.toISOString().split('T')[0];
      const fin = today.toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(fin);
      if (onFechaChange) {
        onFechaChange(inicio, fin);
      }
    }
  }, [propFechaInicio, propFechaFin, onFechaChange]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchData();
    }
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFacturasVenta(fechaInicio, fechaFin);
      setData(result);
      
      // Si no hay datos, mostrar mensaje
      if (result.length === 0) {
        setError('No se encontraron facturas para el período seleccionado.');
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error al cargar datos: ${errorMessage}`);
      setData([]);
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

  const totalMonto = data.reduce((sum, item) => sum + (item.MontoTotal || 0), 0);

  return (
    <div className="py-6 px-2 md:px-6 min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Facturas de Proveedores
        </h1>

        {/* Mensaje de error o advertencia */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <p className="text-yellow-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Filtros de fecha */}
        {!propFechaInicio && (
          <div className="flex flex-wrap gap-4 mb-6 justify-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
            <div>
              <label className="block text-blue-900 font-semibold mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex gap-2 mt-6 md:mt-8">
              <button
                onClick={fetchData}
                className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-base"
              >
                Buscar
              </button>
            </div>
          </div>
        )}

        {/* Card Total */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Monto</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">
              ${totalMonto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Tabla de facturas */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">
              Facturas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-blue-900 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">IdFactura</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">FechaEmision</th>
                  <th className="py-3 px-4 md:px-6 text-right font-semibold">MontoTotal</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">NombreCliente</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  <>
                    {data.map((item, index) => (
                      <tr
                        key={item.IdFactura || index}
                        className={`border-t border-blue-100 hover:bg-blue-50 transition ${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-25'
                        }`}
                      >
                        <td className="py-3 px-4 md:px-6">{item.IdFactura || '-'}</td>
                        <td className="py-3 px-4 md:px-6">
                          {item.FechaEmision ? new Date(item.FechaEmision).toLocaleDateString('es-AR') : '-'}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-right font-semibold text-blue-900">
                          ${(item.MontoTotal || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 md:px-6">{item.NombreCliente || '-'}</td>
                      </tr>
                    ))}
                    {/* Fila de totales */}
                    <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
                      <td className="py-3 px-4 md:px-6" colSpan={2}>TOTAL</td>
                      <td className="py-3 px-4 md:px-6 text-right">
                        ${totalMonto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 md:px-6"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturasProveedoresPendientes;
