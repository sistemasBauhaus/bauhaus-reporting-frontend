import React, { useState, useEffect } from 'react';
import { fetchNivelesTanques, NivelTanque } from '../../api/tanques';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface NivelesTanquesProps {}

const NivelesTanques: React.FC<NivelesTanquesProps> = () => {
  const [data, setData] = useState<NivelTanque[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Actualiza cada 60 segundos
    return () => clearInterval(interval);
  }, []);

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


  // Filtrar datos según el filtro de texto
  const dataFiltrada = data.filter(tanque => {
    const texto = filtro.toLowerCase();
    return (
      tanque.producto.toLowerCase().includes(texto) ||
      String(tanque.id_tanque).includes(texto)
    );
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

  // Obtener la fecha más reciente de los datos
  const fechaMostrada = data.length > 0 ? new Date(data[0].fecha_actualizacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-2 text-center">
            Niveles de Tanques y Stock Valorizado
          </h1>
          {fechaMostrada && (
            <div className="flex items-center gap-3 bg-white border border-blue-200 rounded-xl shadow px-6 py-3 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-base md:text-lg font-semibold text-blue-900">
                <span className="text-blue-700 font-bold">Actualizado al:</span> {fechaMostrada}
              </span>
            </div>
          )}
        </div>

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <ResponsiveContainer width="100%" height={600}>
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
          <div className="px-4 md:px-8 pt-6 pb-3 flex flex-col items-center gap-2">
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
              {dataFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                dataFiltrada.map((tanque) => (
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

