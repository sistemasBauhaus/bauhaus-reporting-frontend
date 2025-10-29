import { useEffect, useState, useMemo } from "react";

interface RegistroSubdiario {
  fecha: string;
  categoria: string;
  nombre: string;
  litros: number;
  importe: number;
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

    // Si hay categoría activa, solo fechas donde hay datos de esa categoría
    if (categoriaActiva) {
      fechas = fechas.filter((fecha) =>
        data.some((d) => d.fecha === fecha && d.categoria === categoriaActiva)
      );
    }

    // Si no hay filtro de fechas, mostrar solo los últimos 10 días del mes en curso
    if (!fechaInicio && !fechaFin) {
      const now = new Date();
      const mesActual = now.getMonth();
      const anioActual = now.getFullYear();

      // Filtrar fechas del mes y año actual
      fechas = fechas.filter((f) => {
        const fd = new Date(f);
        return fd.getMonth() === mesActual && fd.getFullYear() === anioActual;
      });

      // Tomar los últimos 10 días del mes en curso
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
  const categorias = useMemo(
    () => Array.from(new Set(data.map((d) => d.categoria))),
    [data]
  );

  // Filtrar por categoría activa
  const dataFiltrada = categoriaActiva
    ? data.filter((d) => d.categoria === categoriaActiva)
    : data;

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

  // Si cambia el filtro de fechas y la página queda fuera de rango, la ajusta
  useEffect(() => {
    if (pagina > totalPaginas - 1) setPagina(0);
  }, [totalPaginas, pagina]);

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
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleBuscar}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
        <button
          onClick={handleLimpiar}
          className="bg-gray-200 text-blue-700 px-4 py-2 rounded"
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
        {categorias.map((c) => (
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

      {/* Tarjetas de días */}
      <div className="grid md:grid-cols-2 gap-6">
        {fechasMostradas.length > 0 ? (
          fechasMostradas.map((fecha) => {
            const resumen = resumenPorFecha.find((r) => r.fecha === fecha);
            if (!resumen) return null;
            const { categoriasConDatos, totalDia, litrosDia } = resumen;
            return (
              <div key={fecha} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-blue-100">
                <div className="text-blue-800 font-bold text-lg mb-2 border-b pb-2">
                  {new Date(fecha).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {categoriasConDatos.map((cat) => (
                  <div key={cat.categoria} className="flex justify-between items-center py-1 border-b last:border-b-0">
                    <span className="font-semibold text-blue-900">{cat.categoria}</span>
                    <span className="text-sm text-gray-700">{cat.productos.map((p) => p.nombre).join(", ")}</span>
                    <span className="text-right text-blue-700">
                      {cat.totalLitros.toLocaleString("es-AR")} <span className="text-xs text-gray-500">litros</span>
                    </span>
                    <span className="text-right font-bold text-green-700">
                      ${cat.totalImporte.toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t flex flex-col gap-1">
                  {categoriasConDatos.length > 1 && (
                    <div className="flex justify-between font-bold text-blue-900">
                      <span>Total Día:</span>
                      <span>
                        {litrosDia.toLocaleString("es-AR")} <span className="text-xs text-gray-500">litros</span>
                      </span>
                      <span>${totalDia.toLocaleString("es-AR")}</span>
                    </div>
                  )}
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
