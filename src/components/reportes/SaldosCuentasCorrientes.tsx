import React, { useState, useEffect } from 'react';
import { fetchSaldosCuentasCorrientes, SaldoCuentaCorriente } from '../../api/reportes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SaldosCuentasCorrientesProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const SaldosCuentasCorrientes: React.FC<SaldosCuentasCorrientesProps> = ({ fechaInicio, fechaFin, onFechaChange }) => {
  const [data, setData] = useState<SaldoCuentaCorriente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchSaldosCuentasCorrientes();
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

  const totalSaldo = data.reduce((sum, item) => sum + item.saldo, 0);
  const totalFacturasPendientes = data.reduce((sum, item) => sum + item.facturas_pendientes, 0);
  const totalRemitosPendientes = data.reduce((sum, item) => sum + item.remitos_pendientes, 0);

  const chartData = data.slice(0, 10).map(item => ({
    nombre: item.nombre_cliente.length > 15 ? item.nombre_cliente.substring(0, 15) + '...' : item.nombre_cliente,
    saldo: item.saldo,
    facturas: item.facturas_pendientes,
    remitos: item.remitos_pendientes,
  }));

  return (
    <div className="py-6 px-2 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Saldos de Cuentas Corrientes
        </h1>

        {/* Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Total Saldo</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">${totalSaldo.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Facturas Pendientes</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">{totalFacturasPendientes}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl shadow flex flex-col items-center py-6 px-4">
            <span className="text-sm font-semibold text-blue-700 mb-1">Remitos Pendientes</span>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-900">{totalRemitosPendientes}</span>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white border border-blue-100 rounded-xl shadow p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Top 10 Clientes por Saldo</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="saldo" name="Saldo ($)" fill="#1e3a8a" />
              <Bar dataKey="facturas" name="Facturas Pendientes" fill="#ef4444" />
              <Bar dataKey="remitos" name="Remitos Pendientes" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Cuentas Corrientes</h2>
          </div>
          <table className="w-full text-blue-900 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Cliente</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Saldo</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Facturas Pendientes</th>
                <th className="py-3 px-4 md:px-6 text-right font-semibold">Remitos Pendientes</th>
                <th className="py-3 px-4 md:px-6 text-left font-semibold">Última Actualización</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 md:px-6">{item.nombre_cliente}</td>
                    <td className={`py-3 px-4 md:px-6 text-right font-semibold ${
                      item.saldo > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${item.saldo.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 md:px-6 text-right">{item.facturas_pendientes}</td>
                    <td className="py-3 px-4 md:px-6 text-right">{item.remitos_pendientes}</td>
                    <td className="py-3 px-4 md:px-6">
                      {new Date(item.ultima_actualizacion).toLocaleDateString('es-AR')}
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

export default SaldosCuentasCorrientes;

