import React, { useState, useEffect } from 'react';
import { fetchVentasPorProducto, VentaProducto } from '../../api/reportes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

interface VentasPorProductoProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const VentasPorProducto: React.FC<VentasPorProductoProps> = ({ fechaInicio: propFechaInicio, fechaFin: propFechaFin, onFechaChange }) => {
  const [data, setData] = useState<VentaProducto[]>([]);
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
      const result = await fetchVentasPorProducto(fechaInicio, fechaFin);
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

  const totalLitros = data.reduce((sum, item) => sum + item.litros, 0);
  const totalImporte = data.reduce((sum, item) => sum + item.importe, 0);
  const promedioPrecio = totalLitros > 0 ? totalImporte / totalLitros : 0;

  const chartData = data.map(item => ({
    nombre: item.nombre,
    litros: item.litros,
    importe: item.importe,
  }));

  const pieData = data.slice(0, 5).map(item => ({
    name: item.nombre,
    value: item.importe,
  }));

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Ventas por Producto/Litro
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
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Litros</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">{totalLitros.toLocaleString()} L</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Importe</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">${totalImporte.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Precio Promedio</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">${promedioPrecio.toFixed(2)}</span>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de barras */}
          <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Ventas por Producto</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="litros" name="Litros" fill="#1e3a8a" />
                <Bar dataKey="importe" name="Importe ($)" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de torta */}
          <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Distribución de Ventas (Top 5)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Ventas</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Producto</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Litros</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Importe</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Precio Promedio</th>
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
                data.map((item, index) => (
                  <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 md:px-6">{item.nombre}</td>
                    <td className="py-3 px-4 md:px-6 text-right">{item.litros.toLocaleString()}</td>
                    <td className="py-3 px-4 md:px-6 text-right">${item.importe.toLocaleString()}</td>
                    <td className="py-3 px-4 md:px-6 text-right">${item.precio_promedio.toFixed(2)}</td>
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

export default VentasPorProducto;

