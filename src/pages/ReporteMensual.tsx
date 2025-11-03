import { useEffect, useState, useMemo } from "react";

interface RegistroSubdiario {
  fecha: string;
  categoria: string;
  nombre: string;
  litros: number;
  importe: number;
  estacion_id: number;
  nombre_estacion: string;
  caja_id: number;
  nombre_caja: string;
}

const DIAS_POR_VISTA = 10; // Ahora muestra de a 10 días por página
const DIAS_POR_DEFECTO = 10;

export default function ReporteSubdiario() {
  const [data, setData] = useState<RegistroSubdiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);

  // Filtros nuevos
  const [estacionFiltro, setEstacionFiltro] = useState<string>('');
  const [cajaFiltro, setCajaFiltro] = useState<string>('');

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  // Fetch data
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);

      const res = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
      const json = await res.json();
      if (!json.ok) throw new Error("Error al obtener datos");
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Fechas únicas ordenadas (todas las filtradas o los últimos 10 días si no hay filtro)
  const fechasUnicas = useMemo(() => {
    let fechas = Array.from(new Set(data.map((d) => d.fecha))).sort();

    if (categoriaActiva) {
      fechas = fechas.filter((fecha) =>
        data.some((d) => d.fecha === fecha && d.categoria === categoriaActiva)
      );
    }

    // Mostrar los últimos 10 días con datos si no hay filtro de fechas
    if (!fechaInicio && !fechaFin) {
      fechas = fechas.slice(-DIAS_POR_DEFECTO);
    }

    return fechas;
  }, [data, fechaInicio, fechaFin, categoriaActiva]);

  // Paginación de fechas (siempre sobre fechasUnicas)
  const totalPaginas = Math.ceil(fechasUnicas.length / DIAS_POR_VISTA);
  const fechasMostradas = fechasUnicas.slice(
    pagina * DIAS_POR_VISTA,
    pagina * DIAS_POR_VISTA + DIAS_POR_VISTA
  );

  // Categorías únicas
  const estaciones = useMemo(
    () => Array.from(new Set(data.map((d) => d.nombre_estacion).filter(Boolean))),
    [data]
  );
  const cajas = useMemo(
    () =>
      Array.from(
        new Set(
          data.map((d) => `${d.nombre_caja} - ${d.nombre_estacion}`).filter(Boolean)
        )
      ),
    [data]
  );

  // Filtrar por estación y caja además de categoría
  const dataFiltrada = data.filter((d) => {
    if (categoriaActiva && d.categoria !== categoriaActiva) return false;
    if (estacionFiltro && d.nombre_estacion !== estacionFiltro) return false;
    if (cajaFiltro && d.nombre_caja !== cajaFiltro) return false;
    return true;
  });

  // Resumen por fecha
  const resumenPorFecha = useMemo(
    () =>
      fechasUnicas.map((fecha) => {
        const registros = dataFiltrada.filter((r) => r.fecha === fecha);
        const categoriasEnFecha = Array.from(new Set(registros.map((r) => r.categoria)));
        const categoriasConDatos = categoriasEnFecha.map((cat) => {
          const productos = registros.filter((r) => r.categoria === cat);
          const totalLitros = productos.reduce((a, b) => a + Number(b.litros), 0);
          const totalImporte = productos.reduce((a, b) => a + Number(b.importe), 0);
          return { categoria: cat, productos, totalLitros, totalImporte };
        });
        const totalDia = categoriasConDatos.reduce((a, b) => a + b.totalImporte, 0);
        const litrosDia = categoriasConDatos.reduce((a, b) => a + b.totalLitros, 0);
        return { fecha, categoriasConDatos, totalDia, litrosDia };
      }),
    [fechasUnicas, dataFiltrada]
  );

  // Totales generales
  const totalGeneral = resumenPorFecha.reduce((a, b) => a + b.totalDia, 0);
  const totalLitrosGeneral = resumenPorFecha.reduce((a, b) => a + b.litrosDia, 0);

  // Resetear página al buscar o limpiar
  const handleBuscar = () => {
    setCategoriaActiva(null);
    setPagina(0);
    fetchData();
  };

  const handleLimpiar = () => {
    setFechaInicio("");
    setFechaFin("");
    setCategoriaActiva(null);
    setPagina(0);
    fetchData();
  };

  const handleFechaInicio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFechaInicio(value);
    if (fechaFin && value > fechaFin) setFechaFin(value);
  };

  const handleFechaFin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFechaFin(value);
    if (fechaInicio && value < fechaInicio) setFechaInicio(value);
  };

  // Si cambia el filtro de fechas y la página queda fuera de rango, la ajusta
  useEffect(() => {
    if (pagina > totalPaginas - 1) setPagina(0);
  }, [totalPaginas, pagina]);

  const categoriasPosibles = ["SHOP", "LIQUIDOS", "GNC", "OTROS"];

  if (loading)
    return <div className="text-center text-blue-700 mt-10 font-medium">Cargando reporte subdiario...</div>;

  if (error)
    return <div className="text-center text-red-600 mt-10 font-medium">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-blue-900 text-center mb-8">
        Subdiario de Caja - Ventas Diarias
      </h1>

      {/* Cartel de aviso de los últimos 10 días por defecto */}
      {!fechaInicio && !fechaFin && (
        <div className="mb-4 text-center text-blue-800 bg-blue-50 border border-blue-200 rounded py-2 font-semibold">
          Mostrando por defecto los últimos 10 días del mes en curso.
        </div>
      )}

      {/* Filtros arriba */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-center justify-center shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs text-blue-900 font-semibold mb-1">Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={handleFechaInicio}
            max={fechaFin || undefined}
            className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-blue-900 font-semibold mb-1">Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={handleFechaFin}
            min={fechaInicio || undefined}
            className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-blue-900 font-semibold mb-1">Estación</label>
          <select
            value={estacionFiltro}
            onChange={e => setEstacionFiltro(e.target.value)}
            className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Todas las estaciones</option>
            {estaciones.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-blue-900 font-semibold mb-1">Caja</label>
          <select
            value={cajaFiltro}
            onChange={e => setCajaFiltro(e.target.value)}
            className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Todas las cajas</option>
            {cajas.map(caja => (
              <option key={caja} value={caja}>{caja}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleBuscar}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold transition"
        >
          Buscar
        </button>
        <button
          onClick={handleLimpiar}
          className="bg-gray-100 hover:bg-gray-200 text-blue-700 px-4 py-2 rounded font-semibold transition"
        >
          Limpiar
        </button>
      </div>

      {/* Categorías como chips */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setCategoriaActiva(null)}
          className={`px-4 py-1 rounded-full ${
            categoriaActiva === null
              ? "bg-blue-700 text-white"
              : "bg-gray-100 text-blue-900"
          }`}
        >
          Todas
        </button>
        {categoriasPosibles.map((c) => (
          <button
            key={c}
            onClick={() => setCategoriaActiva(c)}
            className={`px-4 py-1 rounded-full ${
              categoriaActiva === c
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-blue-900"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Tarjetas de días estilo tabla */}
      <div className="flex flex-col gap-8">
        {fechasMostradas.length > 0 ? (
          fechasMostradas.map((fecha) => {
            const resumen = resumenPorFecha.find((r) => r.fecha === fecha);
            if (!resumen) return null;
            const { categoriasConDatos, totalDia, litrosDia } = resumen;
            return (
              <div
                key={fecha}
                className="bg-white rounded-xl shadow border border-blue-200"
              >
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 rounded-t-xl flex justify-between items-center">
                  <span className="text-blue-800 font-bold text-lg">
                    {new Date(fecha).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-bold text-blue-900">
                    Total Día: ${totalDia.toLocaleString("es-AR")} | {litrosDia.toLocaleString("es-AR")} litros
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 uppercase">Categoría</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 uppercase">Productos</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 uppercase">Estación</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 uppercase">Caja</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-blue-900 uppercase">Litros</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-blue-900 uppercase">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriasConDatos.map((cat, idx) => {
                        // Solo una estación/caja por categoría
                        const p = cat.productos[0];
                        return (
                          <tr key={cat.categoria + idx} className="hover:bg-blue-50">
                            <td className="px-4 py-2 font-semibold text-blue-900">{cat.categoria}</td>
                            <td className="px-4 py-2 text-gray-700 text-xs">
                              {cat.productos.map((p) => p.nombre).join(", ")}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs font-medium max-w-[110px] truncate"
                                title={p.nombre_estacion || "Sin estación"}
                                style={{ display: "inline-block" }}
                              >
                                {p.nombre_estacion || "Sin estación"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs font-medium max-w-[90px] truncate"
                                title={p.nombre_caja || "Sin caja"}
                                style={{ display: "inline-block" }}
                              >
                                {p.nombre_caja || "Sin caja"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-blue-700 font-semibold">
                              {cat.totalLitros.toLocaleString("es-AR")}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-green-700">
                              ${cat.totalImporte.toLocaleString("es-AR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center text-blue-700 mt-10 font-medium">No hay datos para mostrar.</div>
        )}
      </div>

      {/* Paginación abajo */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center mt-8 gap-4">
          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 0))}
            disabled={pagina === 0}
            className="px-3 py-2 rounded-full bg-blue-100 text-blue-700 font-bold disabled:opacity-50"
          >
            ◀
          </button>
          <div className="font-bold text-blue-900 text-lg">
            Página {pagina + 1} de {totalPaginas}
          </div>
          <button
            onClick={() => setPagina((p) => (p + 1 < totalPaginas ? p + 1 : p))}
            disabled={pagina + 1 >= totalPaginas}
            className="px-3 py-2 rounded-full bg-blue-100 text-blue-700 font-bold disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      )}

      {/* Total general abajo */}
      <div className="text-right font-extrabold text-blue-900 text-xl mt-12 mb-8 border-t-2 border-blue-200 pt-6">
        TOTAL GENERAL: ${totalGeneral.toLocaleString("es-AR")}
        <br />
        TOTAL LITROS: {totalLitrosGeneral.toLocaleString("es-AR")}
      </div>
    </div>
  );
}
