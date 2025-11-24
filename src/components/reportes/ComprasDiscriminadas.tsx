import React, { useState, useEffect } from 'react';
import { fetchComprasDiscriminadas, CompraDiscriminada } from '../../api/reportes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ComprasDiscriminadasProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const ComprasDiscriminadas: React.FC<ComprasDiscriminadasProps> = ({ fechaInicio: propFechaInicio, fechaFin: propFechaFin, onFechaChange }) => {
  const [data, setData] = useState<CompraDiscriminada[]>([]);
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

  useEffect(() => {
    if (propFechaInicio && propFechaFin) {
      setFechaInicio(propFechaInicio);
      setFechaFin(propFechaFin);
    }
  }, [propFechaInicio, propFechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchComprasDiscriminadas(fechaInicio, fechaFin);
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

  const totalImporte = data.reduce((sum, item) => sum + item.importe_total, 0);
  const totalCantidad = data.reduce((sum, item) => sum + item.cantidad, 0);
  const promedioPrecio = totalCantidad > 0 ? totalImporte / totalCantidad : 0;

  // Agrupar por fecha para el gráfico de líneas
  const comprasPorFecha = data.reduce((acc, item) => {
    const fecha = item.fecha.split('T')[0];
    if (!acc[fecha]) {
      acc[fecha] = { fecha, importe: 0, cantidad: 0 };
    }
    acc[fecha].importe += item.importe_total;
    acc[fecha].cantidad += item.cantidad;
    return acc;
  }, {} as Record<string, { fecha: string; importe: number; cantidad: number }>);

  const lineChartData = Object.values(comprasPorFecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(item => ({
      fecha: new Date(item.fecha).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
      importe: item.importe,
    }));

  // Agrupar por proveedor
  const comprasPorProveedor = data.reduce((acc, item) => {
    if (!acc[item.proveedor]) {
      acc[item.proveedor] = { proveedor: item.proveedor, importe: 0 };
    }
    acc[item.proveedor].importe += item.importe_total;
    return acc;
  }, {} as Record<string, { proveedor: string; importe: number }>);

  const barChartData = Object.values(comprasPorProveedor)
    .sort((a, b) => b.importe - a.importe)
    .slice(0, 10)
    .map(item => ({
      proveedor: item.proveedor.length > 15 ? item.proveedor.substring(0, 15) + '...' : item.proveedor,
      importe: item.importe,
    }));

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Compras Discriminadas
        </h1>

        {/* Botón de actualización si es necesario */}
        {!propFechaInicio && (
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <button
              onClick={fetchData}
              className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-sm"
            >
              Actualizar
            </button>
          </div>
        )}

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Importe</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">${totalImporte.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Cantidad</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">{totalCantidad.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Precio Promedio</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">${promedioPrecio.toFixed(2)}</span>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de líneas */}
          <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Evolución de Compras</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="importe" name="Importe ($)" stroke="#1e3a8a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de barras por proveedor */}
          <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Top 10 Proveedores</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="proveedor" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="importe" name="Importe ($)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Compras</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Fecha</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Proveedor</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Producto</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Cantidad</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Precio Unitario</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Importe Total</th>
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
                data.map((item, index) => (
                  <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 md:px-6">
                      {new Date(item.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4 md:px-6">{item.proveedor}</td>
                    <td className="py-3 px-4 md:px-6">{item.producto}</td>
                    <td className="py-3 px-4 md:px-6 text-right">{item.cantidad.toLocaleString()}</td>
                    <td className="py-3 px-4 md:px-6 text-right">${item.precio_unitario.toFixed(2)}</td>
                    <td className="py-3 px-4 md:px-6 text-right font-semibold">${item.importe_total.toLocaleString()}</td>
                    <td className="py-3 px-4 md:px-6">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.estado === 'Pagado'
                            ? 'bg-green-100 text-green-800'
                            : item.estado === 'Pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
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

export default ComprasDiscriminadas;

