import { useEffect, useState, useMemo } from "react";

interface RegistroSubdiario {
  fecha: string;
  nombre: string;
  litros: number;
  importe: number;
  nombre_estacion?: string;
  nombre_caja?: string;
  total_efectivo_recaudado?: number; 
  importe_ventas_totales_contado?: number; 
}

const DIAS_POR_VISTA = 10;
const productosSinLitros = ["SHOP", "GOLOSINAS", "BEBIDAS", "Golosinas/Bebidas"];
const combustiblesLiquidos = [
  "SUPER",
  "QUANTIUM NAFTA",
  "QUANTIUM DIESEL",
  "DIESEL X10",
  "ECO BLUE",
  "GNC",
  "GNC AC"
];

export default function ReporteSubdiario() {
  const [data, setData] = useState<RegistroSubdiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [productoFiltro, setProductoFiltro] = useState<string>("TODOS");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaError, setFechaError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const [defaultInicio, setDefaultInicio] = useState("");
  const [defaultFin, setDefaultFin] = useState("");

  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const inicio = primerDia.toISOString().split("T")[0];
    const fin = ultimoDia.toISOString().split("T")[0];
    setFechaInicio(inicio);
    setFechaFin(fin);
    setDefaultInicio(inicio);
    setDefaultFin(fin);
  }, []);

  const hoyStr = useMemo(() => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  }, []);

  async function fetchData() {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      setFechaError("La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'.");
      setLoading(false);
      return;
    } else {
      setFechaError(null);
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);

      const res = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
      const json = await res.json();
      if (!json.ok) throw new Error("Error al obtener datos");

      const normalizados = json.data
        .map((d: any) => ({
          fecha: d.fecha || d.Fecha,
          nombre: d.nombre || d.Nombre,
          litros: Number(d.litros || d.Litros || 0),
          importe: Number(d.importe || d.Importe || 0),
          nombre_estacion: d.nombre_estacion || d.NombreEstacion,
          nombre_caja: d.nombre_caja || d.NombreCaja,
          total_efectivo_recaudado: Number(d.total_efectivo_recaudado || 0),
          importe_ventas_totales_contado: Number(d.importe_ventas_totales_contado || 0),
        }))
        .filter((d: any) => d.importe > 0 || d.litros > 0);

      setData(normalizados);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!fechaInicio || !fechaFin) {
      setFechaInicio(defaultInicio);
      setFechaFin(defaultFin);
      return;
    }
    fetchData();
    // eslint-disable-next-line
  }, [fechaInicio, fechaFin, defaultInicio, defaultFin]);

  // Filtro por fecha y producto (usa fecha local Argentina tal como viene del backend)
  const registrosFiltrados = useMemo(() => {
    let filtrados = data;
    if (fechaInicio && fechaFin) {
      filtrados = filtrados.filter(item => {
        // Usa directamente la fecha que viene del backend (ya es local)
        return item.fecha >= fechaInicio && item.fecha <= fechaFin;
      });
    }
    if (productoFiltro !== "TODOS") {
      filtrados = filtrados.filter(item => item.nombre === productoFiltro);
    }
    return filtrados;
  }, [data, fechaInicio, fechaFin, productoFiltro]);
  console.log("Filtrados por fecha:", registrosFiltrados);

  const productos = useMemo(() => {
    const productosEnDatos = Array.from(new Set(registrosFiltrados.map(d => d.nombre)));
    // Solo incluye combustibles líquidos y productosSinLitros, excluye lubricantes y otros
    return [
      ...combustiblesLiquidos.filter(prod => productosEnDatos.includes(prod)),
      ...productosSinLitros.filter(prod => productosEnDatos.includes(prod)),
    ];
  }, [registrosFiltrados]);
  console.log("Productos para columnas:", productos);

  // Agrupa por fecha local (sin conversión)
  const datosPorFecha = useMemo(() => {
    const agrupado: Record<string, any> = {};
    registrosFiltrados.forEach(item => {
      const fecha = item.fecha;
      if (!agrupado[fecha]) {
        agrupado[fecha] = { fecha };
        productos.forEach(prod => {
          agrupado[fecha][`${prod}_litros`] = 0;
          agrupado[fecha][`${prod}_importe`] = 0;
        });
      }
      agrupado[fecha][`${item.nombre}_litros`] += item.litros;
      agrupado[fecha][`${item.nombre}_importe`] += item.importe;
    });
    Object.values(agrupado).forEach(fila => {
      productos.forEach(prod => {
        if (typeof fila[`${prod}_litros`] !== "number") fila[`${prod}_litros`] = 0;
        if (typeof fila[`${prod}_importe`] !== "number") fila[`${prod}_importe`] = 0;
      });
    });
    return Object.values(agrupado).sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
  }, [registrosFiltrados, productos]);
  console.log("Datos agrupados por fecha:", datosPorFecha);

  // Subtotales por producto
  const subtotal = useMemo(() => {
    const base: any = { fecha: "Subtotal" };
    productos.forEach(prod => {
      base[`${prod}_litros`] = 0;
      base[`${prod}_importe`] = 0;
    });
    datosPorFecha.forEach(fila => {
      productos.forEach(prod => {
        base[`${prod}_litros`] += fila[`${prod}_litros`] || 0;
        base[`${prod}_importe`] += fila[`${prod}_importe`] || 0;
      });
    });
    return base;
  }, [datosPorFecha, productos]);

  // Suma total de importe de combustibles líquidos
  const totalImporteLiquidos = useMemo(() => {
    let total = 0;
    datosPorFecha.forEach(fila => {
      combustiblesLiquidos.forEach(prod => {
        total += fila[`${prod}_importe`] || 0;
      });
    });
    return total;
  }, [datosPorFecha]);

  // Paginación
  const fechasUnicas = datosPorFecha.map(f => f.fecha);
  const totalPaginas = Math.ceil(fechasUnicas.length / DIAS_POR_VISTA);
  const fechasMostradas = fechasUnicas.slice(
    pagina * DIAS_POR_VISTA,
    pagina * DIAS_POR_VISTA + DIAS_POR_VISTA
  );

  if (loading)
    return <div className="text-center text-blue-700 mt-10 font-medium">Cargando reporte...</div>;
  if (error)
    return <div className="text-center text-red-600 mt-10 font-medium">{error}</div>;

  const handleBuscar = () => {
    setPagina(0);
    fetchData();
  };

  const handleLimpiar = () => {
    setProductoFiltro("TODOS");
    setFechaInicio(defaultInicio);
    setFechaFin(defaultFin);
    setPagina(0);
    setFechaError(null);
    fetchData();
  };

  return (
    <div className="w-full max-w-none mx-auto mt-10 px-2 overflow-x-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-900 drop-shadow-lg tracking-tight">
        Subdiario de Caja
      </h1>
      {/* 🎛️ Filtros */}
      <div className="flex flex-wrap gap-4 items-center justify-center mb-8 p-4 bg-white rounded-xl shadow-md border border-blue-200">
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Producto:&nbsp;
          <select
            value={productoFiltro}
            onChange={e => setProductoFiltro(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          >
            <option value="TODOS">Todos</option>
            {Array.from(new Set(data.map(d => d.nombre))).map(prod => (
              <option key={prod} value={prod}>{prod}</option>
            ))}
          </select>
        </label>
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Desde:&nbsp;
          <input
            type="date"
            value={fechaInicio}
            max={defaultFin}
            onChange={e => setFechaInicio(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          />
        </label>
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Hasta:&nbsp;
          <input
            type="date"
            value={fechaFin}
            max={hoyStr}
            onChange={e => setFechaFin(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          />
        </label>
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white font-semibold shadow hover:bg-blue-900 transition"
          onClick={handleBuscar}
        >
          Buscar
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-200 text-blue-900 font-semibold shadow hover:bg-gray-300 transition border border-blue-300"
          onClick={handleLimpiar}
        >
          Limpiar filtros
        </button>
      </div>
      {fechaError && (
        <div className="flex items-center justify-center mb-4">
          <span className="text-red-700 font-semibold text-lg flex items-center gap-2">
            <span>⚠️</span> {fechaError}
          </span>
        </div>
      )}

      {/* 📋 Tabla */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-full border-separate border-spacing-0 border border-blue-400 rounded-lg shadow-lg text-sm bg-white">
          <thead>
            <tr className="bg-blue-700 text-white text-center">
              <th rowSpan={2} className="px-2 py-3 font-semibold border border-blue-400">Fecha</th>
              {productos.map(prod => (
                <th key={prod + "_head"} colSpan={2} className="px-2 py-3 font-semibold border border-blue-400">{prod}</th>
              ))}
            </tr>
            <tr className="bg-blue-600 text-white text-center">
              {productos.map(prod =>
                combustiblesLiquidos.includes(prod) ? (
                  <>
                    <th key={prod + "_litros"} className="px-2 py-2 font-normal border border-blue-400">Litros</th>
                    <th key={prod + "_importe"} className="px-2 py-2 font-normal border border-blue-400">Importe</th>
                  </>
                ) : productosSinLitros.includes(prod) ? (
                  <th key={prod + "_importe"} colSpan={2} className="px-2 py-2 font-normal border border-blue-400">Importe</th>
                ) : null
              )}
            </tr>
          </thead>
          <tbody>
            {fechasMostradas.map(fecha => {
              const fila = datosPorFecha.find(f => f.fecha === fecha);
              if (!fila) return null;
              return (
                <tr key={fecha} className="odd:bg-white even:bg-blue-50 text-right hover:bg-blue-100 transition border-b-2 border-blue-300 text-xs">
                  <td className="text-left px-2 py-3 font-medium text-blue-900 border border-blue-400">
                    {new Date(fila.fecha).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short"
                    })}
                  </td>
                  {productos.map(prod =>
                    combustiblesLiquidos.includes(prod) ? (
                      <>
                        <td key={prod + "_l"} className="border border-blue-400 px-2 py-3">
                          {fila[`${prod}_litros`]?.toLocaleString("es-AR")}
                        </td>
                        <td key={prod + "_i"} className="border border-blue-400 px-2 py-3 text-green-700 font-semibold">
                          ${fila[`${prod}_importe`]?.toLocaleString("es-AR")}
                        </td>
                      </>
                    ) : productosSinLitros.includes(prod) ? (
                      <td
                        key={prod + "_i"}
                        colSpan={2}
                        className="border border-blue-400 px-2 py-3 text-green-700 font-semibold text-center"
                      >
                        ${fila[`${prod}_importe`]?.toLocaleString("es-AR")}
                      </td>
                    ) : null
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-blue-200 font-bold text-xs">
            <tr>
              <td className="px-2 py-3 text-left border border-blue-400">Subtotal</td>
              {productos.map(prod =>
                combustiblesLiquidos.includes(prod) ? (
                  <>
                    <td key={prod + "_l_t"} className="border border-blue-400 px-2 py-3">
                      {subtotal[`${prod}_litros`]?.toLocaleString("es-AR")}
                    </td>
                    <td key={prod + "_i_t"} className="border border-blue-400 px-2 py-3">
                      ${subtotal[`${prod}_importe`]?.toLocaleString("es-AR")}
                    </td>
                  </>
                ) : productosSinLitros.includes(prod) ? (
                  <td
                    key={prod + "_i_t"}
                    colSpan={2}
                    className="border border-blue-400 px-2 py-3"
                  >
                    ${subtotal[`${prod}_importe`]?.toLocaleString("es-AR")}
                  </td>
                ) : null
              )}
            </tr>
            <tr>
              <td
                className="px-2 py-4 text-center border-t-4 border-blue-700 bg-blue-700 text-white font-extrabold text-base"
                colSpan={productos.length * 2 + 1}
              >
                TOTAL IMPORTE COMBUSTIBLES LÍQUIDOS:&nbsp;
                <span className="text-green-500 drop-shadow-lg">
                  ${totalImporteLiquidos.toLocaleString("es-AR")}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white font-semibold shadow hover:bg-blue-900 transition disabled:bg-blue-300"
          disabled={pagina === 0}
          onClick={() => setPagina(pagina - 1)}
        >
          ← Anterior
        </button>
        <span className="font-bold text-blue-900 text-lg">
          Página {pagina + 1} de {totalPaginas}
        </span>
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white font-semibold shadow hover:bg-blue-900 transition disabled:bg-blue-300"
          disabled={pagina >= totalPaginas - 1}
          onClick={() => setPagina(pagina + 1)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}