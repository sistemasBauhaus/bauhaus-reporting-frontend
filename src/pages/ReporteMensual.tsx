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
    <div className="max-w-5xl mx-auto mt-10 px-2">
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-8 tracking-tight">
        Subdiario de Caja - Ventas Diarias
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-8 items-center justify-center bg-white shadow-sm p-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs" htmlFor="desde">Desde</label>
          <input
            id="desde"
            type="date"
            value={fechaInicio}
            onChange={handleFechaInicio}
            max={fechaFin || undefined}
            className="border border-gray-300 px-3 py-2 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs" htmlFor="hasta">Hasta</label>
          <input
            id="hasta"
            type="date"
            value={fechaFin}
            onChange={handleFechaFin}
            min={fechaInicio || undefined}
            className="border border-gray-300 px-3 py-2 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">Estación</label>
          <select
            value={estacionFiltro}
            onChange={e => setEstacionFiltro(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Todas las estaciones</option>
            {estaciones.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">Caja</label>
          <select
            value={cajaFiltro}
            onChange={e => setCajaFiltro(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Todas las cajas</option>
            {cajas.map(caja => (
              <option key={caja} value={caja}>{caja}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleBuscar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold transition"
        >
          Buscar
        </button>
        <button
          onClick={handleLimpiar}
          className="bg-gray-100 hover:bg-gray-200 text-blue-700 px-4 py-2 font-semibold transition"
        >
          Limpiar
        </button>
      </div>

      {/* Chips de categorías */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setCategoriaActiva(null)}
          className={`px-4 py-1 font-semibold transition ${
            categoriaActiva === null
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-900 hover:bg-blue-50"
          }`}
        >
          Todas
        </button>
        {categoriasPosibles.map((c) => (
          <button
            key={c}
            onClick={() => setCategoriaActiva(c)}
            className={`px-4 py-1 font-semibold transition ${
              categoriaActiva === c
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900 hover:bg-blue-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Tarjetas de días */}
      <div className="flex flex-col gap-8">
        {fechasMostradas.length > 0 ? (
          fechasMostradas.map((fecha) => {
            const resumen = resumenPorFecha.find((r) => r.fecha === fecha);
            if (!resumen) return null;
            const { categoriasConDatos, totalDia, litrosDia } = resumen;
            return (
              <div
                key={fecha}
                className="bg-blue-50 shadow border border-blue-200 mb-2"
              >
                <div className="bg-blue-200 border-b border-blue-300 px-6 py-3 flex justify-between items-center rounded-t">
                  <span className="text-blue-900 font-bold text-lg">
                    {new Date(fecha).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-bold text-blue-900 text-base">
                    Total Día: <span className="text-green-700">${totalDia.toLocaleString("es-AR")}</span> | <span className="text-blue-700">{litrosDia.toLocaleString("es-AR")} litros</span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-100 bg-white">
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
                        const p = cat.productos[0];
                        return (
                          <tr key={cat.categoria + idx} className="hover:bg-blue-50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-900">{cat.categoria}</td>
                            <td className="px-4 py-2 text-blue-900 text-sm">
                              <ProductoDesplegable productos={cat.productos} />
                            </td>
                            <td className="px-4 py-2 text-sm text-blue-900" title={p.nombre_estacion || "Sin estación"}>
                              {p.nombre_estacion || "Sin estación"}
                            </td>
                            <td className="px-4 py-2 text-sm text-blue-900" title={p.nombre_caja || "Sin caja"}>
                              {p.nombre_caja || "Sin caja"}
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

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center mt-8 gap-4">
          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 0))}
            disabled={pagina === 0}
            className="px-3 py-2 bg-gray-100 text-gray-700 font-bold disabled:opacity-50"
          >
            ◀
          </button>
          <div className="font-bold text-gray-900 text-lg">
            Página {pagina + 1} de {totalPaginas}
          </div>
          <button
            onClick={() => setPagina((p) => (p + 1 < totalPaginas ? p + 1 : p))}
            disabled={pagina + 1 >= totalPaginas}
            className="px-3 py-2 bg-gray-100 text-gray-700 font-bold disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      )}

      {/* Total general */}
      <div className="text-right font-bold text-gray-900 text-xl mt-12 mb-8 border-t border-gray-200 pt-6">
        TOTAL GENERAL: <span className="text-green-700">${totalGeneral.toLocaleString("es-AR")}</span>
        <br />
        TOTAL LITROS: <span className="text-blue-700">{totalLitrosGeneral.toLocaleString("es-AR")}</span>
      </div>
    </div>
  );
}

function ProductoDesplegable({ productos }: { productos: RegistroSubdiario[] }) {
  const [open, setOpen] = useState(false);

  if (productos.length === 0) return null;
  if (productos.length === 1) return <span>{productos[0].nombre}</span>;

  return (
    <div>
      <button
        type="button"
        className="text-blue-700 underline text-xs"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Ocultar productos" : `Ver productos (${productos.length})`}
      </button>
      {open && (
        <ul className="mt-2 bg-blue-50 rounded p-2 shadow text-xs space-y-1">
          {productos.map((p, i) => (
            <li key={p.nombre + i} className="pl-2 list-disc list-inside">
              {p.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
