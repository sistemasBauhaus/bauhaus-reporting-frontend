import React, { useState, useEffect } from 'react';
import { fetchFacturasProveedoresPendientes, FacturaProveedorPendiente } from '../../api/reportes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FacturasProveedoresPendientesProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const FacturasProveedoresPendientes: React.FC<FacturasProveedoresPendientesProps> = ({ fechaInicio, fechaFin, onFechaChange }) => {
  const [data, setData] = useState<FacturaProveedorPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchFacturasProveedoresPendientes();
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

  const totalImporte = data.reduce((sum, item) => sum + item.importe, 0);
  const facturasVencidas = data.filter(item => item.dias_vencido > 0).length;
  const totalVencido = data
    .filter(item => item.dias_vencido > 0)
    .reduce((sum, item) => sum + item.importe, 0);

  // Agrupar por proveedor
  const facturasPorProveedor = data.reduce((acc, item) => {
    if (!acc[item.proveedor]) {
      acc[item.proveedor] = { proveedor: item.proveedor, importe: 0, cantidad: 0 };
    }
    acc[item.proveedor].importe += item.importe;
    acc[item.proveedor].cantidad += 1;
    return acc;
  }, {} as Record<string, { proveedor: string; importe: number; cantidad: number }>);

  const chartData = Object.values(facturasPorProveedor)
    .sort((a, b) => b.importe - a.importe)
    .slice(0, 10)
    .map(item => ({
      proveedor: item.proveedor.length > 15 ? item.proveedor.substring(0, 15) + '...' : item.proveedor,
      importe: item.importe,
      cantidad: item.cantidad,
    }));

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Facturas de Proveedores Pendientes
        </h1>

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Pendiente</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">${totalImporte.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Facturas Vencidas</span>
            <span className="text-2xl md:text-3xl font-extrabold text-red-600">{facturasVencidas}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Vencido</span>
            <span className="text-2xl md:text-3xl font-extrabold text-red-600">${totalVencido.toLocaleString()}</span>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Top 10 Proveedores por Importe Pendiente</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="proveedor" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="importe" name="Importe Pendiente ($)" fill="#ef4444" />
              <Bar dataKey="cantidad" name="Cantidad Facturas" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Facturas Pendientes</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">N° Factura</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Proveedor</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Fecha Emisión</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Fecha Vencimiento</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Importe</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Días Vencido</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Estado</th>
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
                data
                  .sort((a, b) => b.dias_vencido - a.dias_vencido)
                  .map((item, index) => (
                    <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                      <td className="py-3 px-4 md:px-6">{item.numero_factura}</td>
                      <td className="py-3 px-4 md:px-6">{item.proveedor}</td>
                      <td className="py-3 px-4 md:px-6">
                        {new Date(item.fecha_emision).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4 md:px-6">
                        {new Date(item.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4 md:px-6 text-right font-semibold">${item.importe.toLocaleString()}</td>
                      <td className={`py-3 px-4 md:px-6 text-right font-semibold ${
                        item.dias_vencido > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.dias_vencido > 0 ? `${item.dias_vencido} días` : 'Al día'}
                      </td>
                      <td className="py-3 px-4 md:px-6">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.estado === 'Vencida'
                              ? 'bg-red-100 text-red-800'
                              : item.estado === 'Por Vencer'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.estado}
                        </span>
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

export default FacturasProveedoresPendientes;

