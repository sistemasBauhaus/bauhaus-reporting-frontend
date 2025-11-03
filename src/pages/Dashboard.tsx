import React, { useState, useEffect } from 'react';
import { fetchPcMensual } from '../api/pcMensual';

interface Grupo {
  categoria: string;
  origen: string;
  litros: number;
  monto: number;
  promedio: number;
  fecha: string;
  id_estacion?: number;
  id_caja?: number;
}

const Dashboard: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaMes, setFechaMes] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Si hay mes seleccionado, calcula el primer y último día del mes
      let fechaInicio = "";
      let fechaFin = "";
      if (fechaMes) {
        fechaInicio = fechaMes.slice(0, 7) + "-01";
        // Obtener último día del mes seleccionado
        const [anio, mes] = fechaMes.slice(0, 7).split("-");
        const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();
        fechaFin = `${anio}-${mes}-${ultimoDia}`;
      }
      const data = await fetchPcMensual(fechaInicio, fechaFin);
      const mapped = data.map(item => ({
        categoria: item.categoria,
        origen: item.producto,
        fecha: item.fecha,
        litros: Number(item.total_cantidad),
        monto: Number(item.total_importe),
        promedio: Number(item.total_cantidad) > 0
          ? Number(item.total_importe) / Number(item.total_cantidad)
          : 0,
      }));
      setGrupos(mapped);

      // Si no hay mes seleccionado, setear el mes del primer dato (más reciente)
      if (!fechaMes && mapped.length > 0) {
        const fechas = mapped.map(g => g.fecha).sort().reverse();
        setFechaMes(fechas[0].slice(0, 7) + "-01");
      }
    } catch (err) {
      setError('Error al cargar datos: ' + (err as Error).message);
    }
    setLoading(false);
  };

  const handleBuscar = () => {
    fetchData();
  };

  const handleLimpiar = () => {
    setFechaMes('');
    setCategoriaFiltro('');
    fetchData();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

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

  // Agrupar por categoría
  const categorias = Array.from(new Set(grupos.map(g => g.categoria)));
  // Filtrar por categoría seleccionada y mes (solo mes)
  const gruposFiltrados = grupos.filter(g => {
    if (categoriaFiltro && g.categoria !== categoriaFiltro) return false;
    if (fechaMes) {
      const mesFiltro = fechaMes.slice(0, 7);
      if (!g.fecha.startsWith(mesFiltro)) return false;
    }
    return true;
  });

  // Resumen por categoría
  const resumenPorCategoria = categorias.map(cat => {
    const items = gruposFiltrados.filter(g => g.categoria === cat);
    const litros = items.reduce((a, b) => a + b.litros, 0);
    const monto = items.reduce((a, b) => a + b.monto, 0);
    const promedio = monto / (litros || 1);
    return { categoria: cat, litros, monto, promedio };
  });

  // Totales globales
  const totalLitros = gruposFiltrados.reduce((a, b) => a + b.litros, 0);
  const totalMonto = gruposFiltrados.reduce((a, b) => a + b.monto, 0);
  const totalPromedio = totalMonto / (totalLitros || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-10 px-2 md:px-0">
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        <div className="mb-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
            Dashboard de Consumos Mensuales
          </h1>
         
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-10 items-center justify-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
          <div>
            <label className="block text-blue-900 font-semibold mb-1" htmlFor="mes">Mes</label>
            <input
              id="mes"
              type="month"
              value={fechaMes.slice(0, 7)}
              onChange={e => setFechaMes(e.target.value + "-01")}
              className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-blue-900 font-semibold mb-1" htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value)}
              className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-6 md:mt-8">
            <button
              onClick={handleBuscar}
              className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-base"
            >
              Buscar
            </button>
            <button
              onClick={handleLimpiar}
              className="bg-gray-100 hover:bg-gray-200 transition text-blue-900 px-5 py-2 rounded font-semibold shadow text-base"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 justify-items-center">
          <div className="bg-white border border-blue-100 rounded-2xl shadow flex flex-col items-center py-7 px-4 w-full max-w-xs">
            <span className="text-base font-semibold text-blue-700 mb-1">Total litros</span>
            <span className="text-3xl font-extrabold text-blue-900">{totalLitros.toLocaleString()} L</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-2xl shadow flex flex-col items-center py-7 px-4 w-full max-w-xs">
            <span className="text-base font-semibold text-blue-700 mb-1">Total monto</span>
            <span className="text-3xl font-extrabold text-blue-900">${totalMonto.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-blue-100 rounded-2xl shadow flex flex-col items-center py-7 px-4 w-full max-w-xs">
            <span className="text-base font-semibold text-blue-700 mb-1">Promedio por litro</span>
            <span className="text-3xl font-extrabold text-blue-900">
              ${Number(totalPromedio).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tabla resumen por categoría */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow max-w-4xl mx-auto w-full mb-10">
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

        {/* Total general destacado */}
        <div className="mt-10 bg-blue-900 text-white font-bold rounded-2xl px-6 py-7 flex flex-col md:flex-row justify-between items-center shadow-lg border-2 border-blue-900 text-lg">
          <span className="text-xl md:text-2xl">Total General</span>
          <span className="flex gap-6 mt-4 md:mt-0 text-base md:text-lg">
            <span className="bg-blue-700 px-5 py-2 rounded">{totalLitros.toLocaleString()} litros</span>
            <span className="bg-blue-700 px-5 py-2 rounded">${totalMonto.toLocaleString()}</span>
            <span className="bg-blue-700 px-5 py-2 rounded">Promedio: ${Number(totalPromedio).toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;