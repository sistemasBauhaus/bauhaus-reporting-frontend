import React, { useState, useEffect } from 'react';
import { fetchNivelesTanques, NivelTanque } from '../../api/tanques';
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
    const interval = setInterval(fetchData, 60000); // Actualiza cada 60 segundos
    return () => clearInterval(interval);
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

  // Agrupar tanques por producto
  const tanquesPorProducto: Record<string, NivelTanque[]> = {};
  data.forEach((tanque) => {
    const prod = tanque.producto.trim().toUpperCase();
    if (!tanquesPorProducto[prod]) tanquesPorProducto[prod] = [];
    tanquesPorProducto[prod].push(tanque);
  });

  const totalCapacidad = data.reduce((sum, item) => sum + (isNaN(Number(item.capacidad)) ? 0 : Number(item.capacidad)), 0);
  const totalNivel = data.reduce((sum, item) => sum + (isNaN(Number(item.nivel_actual)) ? 0 : Number(item.nivel_actual)), 0);
  const porcentajePromedio = totalCapacidad > 0 ? (totalNivel / totalCapacidad) * 100 : 0;

  // Para el gráfico, mostrar cada tanque por separado
  const chartData = data.map((tanque) => ({
    producto: `${tanque.producto} (${tanque.id_tanque})`,
    tanque: `Tanque ${tanque.id_tanque}`,
    nivel: Number(tanque.nivel_actual),
    capacidad: Number(tanque.capacidad),
    porcentaje: tanque.porcentaje,
  }));

  // Debug: mostrar totales, gráfico y tabla
  console.log('Totales:', { totalCapacidad, totalNivel, porcentajePromedio });
  console.log('Datos gráfico:', chartData);
  console.log('Datos tabla:', data);

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
          {/* Removed Total Stock Valorizado card, not present in NivelTanque */}
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
              <YAxis
                dataKey="producto"
                type="category"
                width={90}
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#1e3a8a' }}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  const tanque = props.payload.tanque;
                  return [`${value} (${tanque})`, name];
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="nivel" name="Nivel Actual (L)" fill="#3b82f6" />
              <Bar dataKey="capacidad" name="Capacidad (L)" fill="#dbeafe" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla tanque por tanque */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Tanques</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Tanque</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Producto</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Capacidad</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Nivel</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">%</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Temperatura</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Última actualización</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Estación</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.map((tanque) => (
                  <tr key={tanque.id_tanque} className="border-t border-blue-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 md:px-6">Tanque {tanque.id_tanque}</td>
                    <td className="py-3 px-4 md:px-6">{tanque.producto}</td>
                    <td className="py-3 px-4 md:px-6 text-right">{Number(tanque.capacidad).toLocaleString()} L</td>
                    <td className="py-3 px-4 md:px-6 text-right">{Number(tanque.nivel_actual).toLocaleString()} L</td>
                    <td className="py-3 px-4 md:px-6 text-right">
                      <span className={`font-semibold ${
                        tanque.porcentaje < 20
                          ? 'text-red-600'
                          : tanque.porcentaje < 50
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {tanque.porcentaje.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 md:px-6 text-right">{Number(tanque.temperatura).toLocaleString()}°C</td>
                    <td className="py-3 px-4 md:px-6 text-right">
                      {tanque.fecha_actualizacion.replace('T', ' ').replace(/\..*Z$/, '')}
                    </td>
                    <td className="py-3 px-4 md:px-6">Los Olmos</td>
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

