import React, { useState, useEffect } from 'react';
import { fetchNivelesTanques, NivelTanque } from '../../api/reportes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface NivelesTanquesProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const NivelesTanques: React.FC<NivelesTanquesProps> = ({ fechaInicio, fechaFin, onFechaChange }) => {
  const [data, setData] = useState<NivelTanque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchNivelesTanques();
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

  const totalStockValorizado = data.reduce((sum, item) => sum + item.valor_stock, 0);
  const totalCapacidad = data.reduce((sum, item) => sum + item.capacidad, 0);
  const totalNivel = data.reduce((sum, item) => sum + item.nivel_actual, 0);
  const porcentajePromedio = totalCapacidad > 0 ? (totalNivel / totalCapacidad) * 100 : 0;

  const chartData = data.map(item => ({
    nombre: item.nombre_producto,
    nivel: item.nivel_actual,
    capacidad: item.capacidad,
    porcentaje: item.porcentaje,
    estacion: item.nombre_estacion,
  }));

  const getColorByPorcentaje = (porcentaje: number) => {
    if (porcentaje < 20) return '#ef4444'; // rojo
    if (porcentaje < 50) return '#f59e0b'; // amarillo
    return '#10b981'; // verde
  };

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Niveles de Tanques y Stock Valorizado
        </h1>

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Stock Valorizado</span>
            <span className="text-xl md:text-2xl font-extrabold text-blue-900">${totalStockValorizado.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Capacidad Total</span>
            <span className="text-xl md:text-2xl font-extrabold text-blue-900">{totalCapacidad.toLocaleString()} L</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Nivel Total</span>
            <span className="text-xl md:text-2xl font-extrabold text-blue-900">{totalNivel.toLocaleString()} L</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">% Promedio</span>
            <span className="text-xl md:text-2xl font-extrabold text-blue-900">{porcentajePromedio.toFixed(1)}%</span>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Niveles de Tanques</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="nivel" name="Nivel Actual (L)" fill="#3b82f6" />
              <Bar dataKey="capacidad" name="Capacidad (L)" fill="#dbeafe" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Tanques</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Producto</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Estación</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Nivel Actual</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Capacidad</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">%</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Stock Valorizado</th>
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
                    <td className="py-3 px-4 md:px-6">{item.nombre_producto}</td>
                    <td className="py-3 px-4 md:px-6">{item.nombre_estacion}</td>
                    <td className="py-3 px-4 md:px-6 text-right">{item.nivel_actual.toLocaleString()} L</td>
                    <td className="py-3 px-4 md:px-6 text-right">{item.capacidad.toLocaleString()} L</td>
                    <td className="py-3 px-4 md:px-6 text-right">
                      <span
                        className={`font-semibold ${
                          item.porcentaje < 20
                            ? 'text-red-600'
                            : item.porcentaje < 50
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {item.porcentaje.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 md:px-6 text-right">${item.valor_stock.toLocaleString()}</td>
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

export default NivelesTanques;

