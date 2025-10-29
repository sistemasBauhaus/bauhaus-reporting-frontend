import React, { useState, useEffect } from 'react';
import { fetchPcMensual } from '../api/pcMensual';

interface Grupo {
  categoria: string;
  origen: string;
  litros: number;
  monto: number;
  promedio: number;
  fecha: string;
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
      const data = await fetchPcMensual();
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
        // Buscar el mes más reciente
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
    <div className="min-h-screen bg-white py-6 px-2 md:px-8">
      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-8 text-center tracking-tight">
        Resumen Mensual de Consumos
      </h1>

      {/* Margen lateral y centrado */}
      <div className="max-w-3xl mx-auto">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6 items-center justify-center bg-blue-50 rounded-lg p-2 shadow">
          <input
            type="month"
            value={fechaMes.slice(0, 7)}
            onChange={e => setFechaMes(e.target.value + "-01")}
            className="border rounded px-2 py-1 text-blue-900 text-base"
            placeholder="Mes"
          />
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="border rounded px-2 py-1 text-blue-900 text-base"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button
            onClick={handleBuscar}
            className="bg-blue-700 text-white px-4 py-1 rounded font-semibold shadow text-base"
          >
            Buscar
          </button>
          <button
            onClick={handleLimpiar}
            className="bg-gray-200 text-blue-900 px-4 py-1 rounded font-semibold shadow text-base"
          >
            Limpiar
          </button>
        </div>

        {/* Cards resumen arriba - un poquito menos anchos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 justify-items-center">
          <div className="bg-blue-900 text-white rounded-xl shadow-lg flex flex-col items-center py-5 px-3 max-w-xs w-full">
            <span className="text-lg font-bold mb-1">Total litros</span>
            <span className="text-2xl font-extrabold">{totalLitros.toLocaleString()} litros</span>
          </div>
          <div className="bg-blue-700 text-white rounded-xl shadow-lg flex flex-col items-center py-5 px-3 max-w-xs w-full">
            <span className="text-lg font-bold mb-1">Total monto</span>
            <span className="text-2xl font-extrabold">${totalMonto.toLocaleString()}</span>
          </div>
          <div className="bg-blue-500 text-white rounded-xl shadow-lg flex flex-col items-center py-5 px-3 max-w-xs w-full">
            <span className="text-lg font-bold mb-1">Promedio por litro</span>
            <span className="text-2xl font-extrabold">
              ${Number(totalPromedio).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tabla resumen por categoría */}
        <div className="max-w-2xl mx-auto w-full">
          <table className="w-full mt-4 text-blue-900 border rounded-lg overflow-hidden shadow text-base">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-2 px-3 text-left">Categoría</th>
                <th className="py-2 px-3 text-right">Litros</th>
                <th className="py-2 px-3 text-right">Monto</th>
                <th className="py-2 px-3 text-right">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {resumenPorCategoria.map(r => (
                <tr key={r.categoria} className="border-t">
                  <td className="py-2 px-3">{r.categoria}</td>
                  <td className="py-2 px-3 text-right">{r.litros.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">${r.monto.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">${r.promedio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total general destacado */}
        <div className="mt-10 bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold rounded-xl px-4 py-6 flex flex-col md:flex-row justify-between items-center shadow border-2 border-blue-900 text-lg">
          <span className="text-xl">TOTAL GENERAL</span>
          <span className="flex gap-6 mt-4 md:mt-0">
            <span className="bg-blue-700 px-4 py-2 rounded">{totalLitros.toLocaleString()} litros</span>
            <span className="bg-blue-700 px-4 py-2 rounded">${totalMonto.toLocaleString()}</span>
            <span className="bg-blue-700 px-4 py-2 rounded">Promedio: ${Number(totalPromedio).toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;