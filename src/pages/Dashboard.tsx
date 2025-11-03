import React, { useState, useEffect } from 'react';
import { fetchPcMensual, fetchPcResumenMensual } from '../api/pcMensual';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Grupo {
  categoria: string;
  origen: string;
  litros: number;
  monto: number;
  promedio: number;
  fecha: string;
  metodo_pago?: string;
  nro_surtidor?: string;
}

interface Resumen {
  tipo: string;
  total_importe: number;
  total_cantidad: number;
  promedio_precio: number;
}

// Mapeo de categorías según lo que pide el cliente
const categoriaMap: Record<string, string> = {
  "NAFTA SUPER": "COMBUSTIBLES",
  "NAFTA PREMIUM": "COMBUSTIBLES",
  "DIESEL": "COMBUSTIBLES",
  "DIESEL PREMIUM": "COMBUSTIBLES",
  "GNC": "GNC",
  "LUBRICANTES": "LUBRICANTES",
  "ADBLUE": "ADBLUE",
  "SPOT": "SPOT",
  "BAR": "SPOT",
  "SHOP": "SHOP",
};

const Dashboard: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [resumenMensual, setResumenMensual] = useState<Resumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaMes, setFechaMes] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  // 🔹 Carga de datos principal
  const fetchData = async () => {
    setLoading(true);
    try {
      let fechaInicio = "";
      let fechaFin = "";
      if (fechaMes) {
        fechaInicio = fechaMes.slice(0, 7) + "-01";
        const [anio, mes] = fechaMes.slice(0, 7).split("-");
        const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();
        fechaFin = `${anio}-${mes}-${ultimoDia}`;
      }

      const data = await fetchPcMensual(fechaInicio, fechaFin);
      const mapped = data.map(item => ({
        categoria: categoriaMap[item.categoria.toUpperCase()] || item.categoria,
        origen: item.producto,
        fecha: item.fecha,
        litros: Number(item.total_cantidad),
        monto: Number(item.total_importe),
        promedio: Number(item.total_cantidad) > 0 ? Number(item.total_importe) / Number(item.total_cantidad) : 0,
        metodo_pago: item.metodo_pago,
        nro_surtidor: item.nro_surtidor,
      }));
      setGrupos(mapped);

      // Si no hay mes seleccionado, usar el más reciente
      if (!fechaMes && mapped.length > 0) {
        const fechas = mapped.map(g => g.fecha).sort().reverse();
        setFechaMes(fechas[0].slice(0, 7) + "-01");
      }

      // Cargar resumen mensual consolidado
      const resumen = await fetchPcResumenMensual(fechaInicio, fechaFin);
      setResumenMensual(resumen);
    } catch (err) {
      setError('Error al cargar datos: ' + (err as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleBuscar = () => fetchData();
  const handleLimpiar = () => {
    setFechaMes('');
    setCategoriaFiltro('');
    fetchData();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="text-blue-700 text-base font-medium animate-pulse">
          Cargando datos...
        </span>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="text-red-600 text-base font-medium">{error}</span>
      </div>
    );

  // 🔹 Agrupar y calcular totales
  const categorias = Array.from(new Set(grupos.map(g => g.categoria)));
  const gruposFiltrados = grupos.filter(g => {
    if (categoriaFiltro && g.categoria !== categoriaFiltro) return false;
    if (fechaMes) {
      const mesFiltro = fechaMes.slice(0, 7);
      if (!g.fecha.startsWith(mesFiltro)) return false;
    }
    return true;
  });

  const resumenPorCategoria = categorias.map(cat => {
    const items = gruposFiltrados.filter(g => g.categoria === cat);
    const litros = items.reduce((a, b) => a + b.litros, 0);
    const monto = items.reduce((a, b) => a + b.monto, 0);
    const promedio = monto / (litros || 1);
    return { categoria: cat, litros, monto, promedio };
  });

  const totalLitros = gruposFiltrados.reduce((a, b) => a + b.litros, 0);
  const totalMonto = gruposFiltrados.reduce((a, b) => a + b.monto, 0);
  const totalPromedio = totalMonto / (totalLitros || 1);

  // 🔹 Agrupar por mes
  const gruposPorMes: Record<string, Grupo[]> = {};
  grupos.forEach(g => {
    const mes = g.fecha.slice(0, 7);
    if (!gruposPorMes[mes]) gruposPorMes[mes] = [];
    gruposPorMes[mes].push(g);
  });
  const meses = Object.keys(gruposPorMes).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-10 px-2 md:px-0">
      <div className="max-w-5xl mx-auto">
        {/* 🔹 Título */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
            Dashboard de Consumos Mensuales
          </h1>
        </div>

        {/* 🔹 Filtros */}
        <div className="flex flex-wrap gap-4 mb-10 justify-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Mes</label>
            <input
              type="month"
              value={fechaMes.slice(0, 7)}
              onChange={e => setFechaMes(e.target.value + "-01")}
              className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Categoría</label>
            <select
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value)}
              className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Todas</option>
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-6 md:mt-8">
            <button onClick={handleBuscar} className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-base">
              Buscar
            </button>
            <button onClick={handleLimpiar} className="bg-gray-100 hover:bg-gray-200 transition text-blue-900 px-5 py-2 rounded font-semibold shadow text-base">
              Limpiar
            </button>
          </div>
        </div>

        {/* 🔹 Cards Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Total litros" value={`${totalLitros.toLocaleString()} L`} />
          <Card title="Total monto" value={`$${totalMonto.toLocaleString()}`} />
          <Card title="Promedio por litro" value={`$${Number(totalPromedio).toFixed(2)}`} />
        </div>

        {/* 🔹 Resumen mensual consolidado */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow w-full mb-10">
          <div className="px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Resumen mensual consolidado</h2>
          </div>
          <table className="w-full text-blue-900 text-base">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-6 text-left font-semibold">Tipo</th>
                <th className="py-3 px-6 text-right font-semibold">Litros</th>
                <th className="py-3 px-6 text-right font-semibold">Importe</th>
                <th className="py-3 px-6 text-right font-semibold">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {resumenMensual.map((r, i) => (
                <tr key={i} className="border-t border-blue-100 hover:bg-blue-50 transition">
                  <td className="py-3 px-6 font-semibold">{r.tipo.toUpperCase()}</td>
                  <td className="py-3 px-6 text-right">{r.total_cantidad.toLocaleString()}</td>
                  <td className="py-3 px-6 text-right">${r.total_importe.toLocaleString()}</td>
                  <td className="py-3 px-6 text-right">${r.promedio_precio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 🔹 Gráfico resumen */}
          <div className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumenMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_importe" name="Importe ($)" fill="#1e3a8a" />
                <Bar dataKey="total_cantidad" name="Litros" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔹 Tabla resumen por categoría */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow mb-10">
          <div className="px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Resumen por Categoría</h2>
          </div>
          <table className="w-full text-blue-900 text-base">
            <thead className="bg-blue-50">
              <tr>
                <th className="py-3 px-6 text-left font-semibold">Categoría</th>
                <th className="py-3 px-6 text-right font-semibold">Litros</th>
                <th className="py-3 px-6 text-right font-semibold">Monto</th>
                <th className="py-3 px-6 text-right font-semibold">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {resumenPorCategoria.map(r => (
                <tr key={r.categoria} className="border-t border-blue-100 hover:bg-blue-50 transition">
                  <td className="py-3 px-6">{r.categoria}</td>
                  <td className="py-3 px-6 text-right">{r.litros.toLocaleString()}</td>
                  <td className="py-3 px-6 text-right">${r.monto.toLocaleString()}</td>
                  <td className="py-3 px-6 text-right">${r.promedio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Resumen mensual por mes (solo totales y categorías) */}
        <div className="mb-12">
          {meses.map(mes => {
            const gruposMes = gruposPorMes[mes];
            const categoriasMes = Array.from(new Set(gruposMes.map(g => g.categoria)));
            const resumenPorCategoria = categoriasMes.map(cat => {
              const items = gruposMes.filter(g => g.categoria === cat);
              const litros = items.reduce((a, b) => a + b.litros, 0);
              const monto = items.reduce((a, b) => a + b.monto, 0);
              const promedio = monto / (litros || 1);
              return { categoria: cat, litros, monto, promedio };
            });
            const totalMes = gruposMes.reduce((a, b) => a + b.monto, 0);
            const litrosMes = gruposMes.reduce((a, b) => a + b.litros, 0);

            return (
              <div key={mes} className="bg-white shadow rounded-xl border border-blue-100 mb-8">
                <div className="flex justify-between items-center px-8 py-4 bg-blue-50 border-b border-blue-100 rounded-t-xl">
                  <span className="text-blue-900 font-bold text-lg">
                    {new Date(mes + "-01").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                  </span>
                  <span className="font-bold text-blue-900 text-base">
                    Total: <span className="text-green-700">${totalMes.toLocaleString("es-AR")}</span> |{" "}
                    <span className="text-blue-700">{litrosMes.toLocaleString("es-AR")} litros</span>
                  </span>
                </div>
                <table className="w-full text-blue-900 text-base">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="py-3 px-6 text-left font-semibold">Categoría</th>
                      <th className="py-3 px-6 text-right font-semibold">Litros</th>
                      <th className="py-3 px-6 text-right font-semibold">Monto</th>
                      <th className="py-3 px-6 text-right font-semibold">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenPorCategoria.map(r => (
                      <tr key={r.categoria} className="border-t border-blue-50 hover:bg-blue-50 transition">
                        <td className="py-3 px-6">{r.categoria}</td>
                        <td className="py-3 px-6 text-right">{r.litros.toLocaleString()}</td>
                        <td className="py-3 px-6 text-right">${r.monto.toLocaleString()}</td>
                        <td className="py-3 px-6 text-right">${r.promedio.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* 🔹 Gráfico comparativo de meses (al final y más chico) */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow w-full mb-10 p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Comparativo mensual</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={meses.map(mes => {
                const gruposMes = gruposPorMes[mes];
                return {
                  mes: new Date(mes + "-01").toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                  monto: gruposMes.reduce((a, b) => a + b.monto, 0),
                  litros: gruposMes.reduce((a, b) => a + b.litros, 0),
                };
              }).reverse()}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="monto" name="Importe ($)" fill="#1e3a8a" />
              <Bar dataKey="litros" name="Litros" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
      </div>
    </div>
  );
};

// 🔹 Card Component
const Card = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white border border-blue-100 rounded-2xl shadow flex flex-col items-center py-7 px-4 w-full">
    <span className="text-base font-semibold text-blue-700 mb-1">{title}</span>
    <span className="text-3xl font-extrabold text-blue-900">{value}</span>
  </div>
);

export default Dashboard;
