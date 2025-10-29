import React, { useState, useEffect } from 'react';
import { fetchPcMensual, PcMensualBackend } from '../api/pcMensual';

interface Grupo {
  categoria: string;
  origen: string;
  litros: number;
  monto: number;
  promedio: number;
  fecha: string; 
}

const ArrowIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 20 20"
    fill="none"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 8L10 12L14 8"
      stroke="#1e3a8a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Dashboard: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openSubcat, setOpenSubcat] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

const fetchData = async () => {
  setLoading(true);
  try {
    console.log("🔹 Ejecutando fetchPcMensual desde Dashboard...");
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
  } catch (err) {
    console.error("❌ Error en fetchData:", err);
    setError('Error al cargar datos: ' + (err as Error).message);
  }
  setLoading(false);
};


  const handleBuscar = () => {
    fetchData();
  };

  const handleLimpiar = () => {
    setFechaInicio('');
    setFechaFin('');
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
  // Filtrar por categoría seleccionada
  const gruposFiltrados = categoriaFiltro ? grupos.filter(g => g.categoria === categoriaFiltro) : grupos;

  // Agrupar por subcategoría (origen)
  const getSubcategorias = (cat: string) => {
    return Array.from(new Set(gruposFiltrados.filter(g => g.categoria === cat).map(g => g.origen)));
  };

  // Totales globales
  const totalLitros = gruposFiltrados.reduce((a, b) => a + b.litros, 0);
  const totalMonto = gruposFiltrados.reduce((a, b) => a + b.monto, 0);
  const totalPromedio = totalMonto / (totalLitros || 1);

  // Resumen por fecha
  const fechas = Array.from(new Set(gruposFiltrados.map(g => g.fecha)));
  const resumenPorFecha = fechas.map(f => {
    const items = gruposFiltrados.filter(g => g.fecha === f);
    const litros = items.reduce((a, b) => a + b.litros, 0);
    const monto = items.reduce((a, b) => a + b.monto, 0);
    return { fecha: f, litros, monto, promedio: monto / (litros || 1) };
  });

  return (
    <div className="h-screen overflow-y-auto bg-white py-6 px-2 md:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-8 border border-blue-100">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 text-center mb-6 tracking-tight">
          PC Mensual - Ventas Agrupadas
        </h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6 items-center justify-center bg-blue-50 rounded-lg p-3 shadow">
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="border rounded px-2 py-1 text-blue-900"
            placeholder="Desde"
          />
          <span className="text-blue-700 font-bold">—</span>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="border rounded px-2 py-1 text-blue-900"
            placeholder="Hasta"
          />
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="border rounded px-2 py-1 text-blue-900"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button
            onClick={handleBuscar}
            className="bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
          >
            Buscar
          </button>
          <button
            onClick={handleLimpiar}
            className="bg-gray-200 text-blue-900 px-4 py-2 rounded font-semibold shadow"
          >
            Limpiar
          </button>
        </div>

        {/* Cards resumen arriba */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-900 text-white rounded-xl shadow-lg flex flex-col items-center py-6 px-4">
            <span className="text-lg font-bold mb-2">Litros</span>
            <span className="text-2xl font-extrabold">{totalLitros.toLocaleString()}</span>
          </div>
          <div className="bg-blue-700 text-white rounded-xl shadow-lg flex flex-col items-center py-6 px-4">
            <span className="text-lg font-bold mb-2">Monto</span>
            <span className="text-2xl font-extrabold">${totalMonto.toLocaleString()}</span>
          </div>
          <div className="bg-blue-500 text-white rounded-xl shadow-lg flex flex-col items-center py-6 px-4">
            <span className="text-lg font-bold mb-2">Promedio (por litro)</span>
            <span className="text-2xl font-extrabold">
              ${Number(totalPromedio).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Categorías y subcategorías desplegables */}
        <div className="space-y-4">
          {categorias.map(cat => {
            const subcats = getSubcategorias(cat);
            return (
              <div key={cat} className="mb-8 bg-white rounded-xl shadow border border-blue-200 p-4">
                <h2 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">{cat}</h2>
                {subcats.map(subcat => {
                  const items = gruposFiltrados.filter(g => g.categoria === cat && g.origen === subcat);
                  const subtotalLitros = items.reduce((a, b) => a + b.litros, 0);
                  const subtotalMonto = items.reduce((a, b) => a + b.monto, 0);
                  const subtotalPromedio = subtotalMonto / (subtotalLitros || 1);
                  const isOpen = openSubcat === `${cat}-${subcat}`;
                  return (
                    <div key={subcat} className="mb-4">
                      <button
                        className="w-full flex justify-between items-center px-4 py-2 font-semibold text-blue-700 focus:outline-none hover:bg-blue-100 transition rounded"
                        onClick={() => setOpenSubcat(isOpen ? null : `${cat}-${subcat}`)}
                      >
                        <span>{subcat}</span>
                        <span className="flex gap-2 text-xs">
                          <span>{subtotalLitros.toLocaleString()} L</span>
                          <span>${subtotalMonto.toLocaleString()}</span>
                          <span>Prom: ${Number(subtotalPromedio).toFixed(2)}</span>
                          <ArrowIcon open={isOpen} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="bg-blue-50 px-2 pb-2 rounded-b">
                          <table className="w-full text-base text-left border-collapse mt-2">
                            <thead>
                              <tr className="bg-blue-100 text-blue-900 border-b">
                                <th className="py-2 px-3">Fecha</th>
                                <th className="py-2 px-3 text-right">Litros</th>
                                <th className="py-2 px-3 text-right">Monto</th>
                                <th className="py-2 px-3 text-right">Promedio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-blue-50 hover:bg-blue-50 transition">
                                  <td className="py-2 px-3">{new Date(item.fecha).toLocaleDateString()}</td>
                                  <td className="py-2 px-3 text-right">{item.litros.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right">${item.monto.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right text-blue-700">
                                    {item.litros > 0
                                      ? `$${Number(item.promedio).toFixed(2)}`
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Resumen diario destacado */}
        <div className="mt-10">
          <div className="bg-gradient-to-r from-blue-200 via-blue-100 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-blue-400">
            <h2 className="text-xl font-bold text-blue-900 mb-4 text-center">Resumen diario</h2>
            <table className="w-full text-base border-collapse rounded-lg overflow-hidden shadow">
              <thead className="bg-blue-100 text-blue-900">
                <tr>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3 text-right">Litros</th>
                  <th className="py-2 px-3 text-right">Monto</th>
                  <th className="py-2 px-3 text-right">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {resumenPorFecha.map((r, i) => (
                  <tr key={i} className="border-b border-blue-50 hover:bg-blue-50 transition">
                    <td className="py-2 px-3 font-semibold">{new Date(r.fecha).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-right">{r.litros.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">${r.monto.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-blue-700">${Number(r.promedio).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diferenciación visual del total general */}
        <div className="mt-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold rounded-lg px-4 py-4 flex flex-col md:flex-row justify-between items-center shadow border-2 border-blue-900 text-base">
          <span>TOTAL GENERAL</span>
          <span className="flex gap-2">
            <span className="bg-blue-700 px-3 py-1 rounded">{totalLitros.toLocaleString()} litros</span>
            <span className="bg-blue-700 px-3 py-1 rounded">${totalMonto.toLocaleString()}</span>
            <span className="bg-blue-700 px-3 py-1 rounded">Promedio: ${Number(totalPromedio).toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;