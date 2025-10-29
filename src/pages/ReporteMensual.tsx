import React, { useEffect, useState } from "react";
import { fetchReporteMensual, ReporteMensual } from "../api/reportes";

const GRUPOS = [
  { key: "liquidos_importe", label: "Líquidos" },
  { key: "gnc_importe", label: "GNC" },
  { key: "lubricantes_importe", label: "Lubricantes" },
  { key: "adblue_importe", label: "AdBlue" },
  { key: "shop_importe", label: "Shop" },
];

function agruparPorMes(data: ReporteMensual[]) {
  // Agrupa los datos por mes (YYYY-MM)
  return data.reduce((acc, item) => {
    const mes = item.fecha.slice(0, 7); // "2025-10"
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(item);
    return acc;
  }, {} as Record<string, ReporteMensual[]>);
}

function ReporteMensualComponent() {
  const [pivot, setPivot] = useState<ReporteMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupoActivo, setGrupoActivo] = useState("liquidos_importe");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({ fechaDesde: "", fechaHasta: "" });

  useEffect(() => {
    setLoading(true);
    fetchReporteMensual({ fechaInicio: filtros.fechaDesde, fechaFin: filtros.fechaHasta })
      .then((data) => setPivot(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filtros]);

  const pivotFiltrado = pivot.filter((r) => {
    const texto = `${r.fecha} ${GRUPOS.map(g => r[g.key as keyof ReporteMensual] ?? "").join(" ")}`.toLowerCase();
    return busqueda ? texto.includes(busqueda.toLowerCase()) : true;
  });

  const totalGrupo = pivotFiltrado.reduce(
    (sum, r) => sum + (Number(r[grupoActivo as keyof ReporteMensual]) || 0),
    0
  );

  const handleBuscar = () => {
    setFiltros({ fechaDesde, fechaHasta });
  };

  const handleLimpiar = () => {
    setFechaDesde("");
    setFechaHasta("");
    setBusqueda("");
    setFiltros({ fechaDesde: "", fechaHasta: "" });
  };

  // Agrupar por mes para mostrar separadores en la tabla
  const datosPorMes = agruparPorMes(pivotFiltrado);

  if (loading)
    return <div className="text-center py-10 text-blue-900 font-semibold">Cargando datos...</div>;

  if (error)
    return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">Reporte Mensual - Ventas por Día</h1>
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-blue-900 mb-1">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="border border-blue-200 rounded px-4 py-2 text-blue-900 text-base"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-blue-900 mb-1">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="border border-blue-200 rounded px-4 py-2 text-blue-900 text-base"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-sm text-blue-900 mb-1">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por fecha o importe..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="border border-blue-200 rounded px-4 py-2 text-blue-900 text-base w-full"
          />
        </div>
        <button
          onClick={handleBuscar}
          className="bg-blue-700 text-white px-4 py-2 rounded text-base font-semibold shadow hover:bg-blue-800 transition"
        >
          Buscar
        </button>
        <button
          onClick={handleLimpiar}
          className="bg-gray-200 text-blue-700 px-4 py-2 rounded text-base font-semibold shadow hover:bg-gray-300 transition"
        >
          Limpiar
        </button>
      </div>
      {/* Solapas */}
      <div className="flex gap-4 mb-6 border-b border-blue-200">
        {GRUPOS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGrupoActivo(g.key)}
            className={`px-6 py-3 rounded-t-lg text-base font-medium transition
              ${grupoActivo === g.key
                ? "bg-blue-700 text-white shadow"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"}
            border border-b-0 border-blue-200`}
            style={{ minWidth: 120 }}
          >
            {g.label}
          </button>
        ))}
      </div>
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-blue-200 rounded-lg shadow-sm bg-white text-base">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-blue-50 border-b border-blue-200 text-blue-900 text-left">Fecha</th>
              <th className="px-4 py-3 bg-blue-50 border-b border-blue-200 text-blue-900 text-left">
                {GRUPOS.find((g) => g.key === grupoActivo)?.label}
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(datosPorMes).map(([mes, filas]) => (
              <React.Fragment key={mes}>
                <tr>
                  <td colSpan={2} className="bg-blue-100 text-blue-900 font-bold text-base px-4 py-2 border-b border-blue-200">
                    {new Date(mes + "-02").toLocaleString("es-AR", { month: "long", year: "numeric" })}
                  </td>
                </tr>
                {filas.map((r, i) => (
                  <tr key={r.fecha} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                    <td className="px-4 py-2 border-b border-blue-100">{r.fecha}</td>
                    <td className="px-4 py-2 border-b border-blue-100 font-semibold">
                      ${Number(r[grupoActivo as keyof ReporteMensual] || 0).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {/* Fila de totales */}
            <tr className="bg-blue-100 font-bold">
              <td className="px-4 py-3 border-b border-blue-200">Total</td>
              <td className="px-4 py-3 border-b border-blue-200">
                ${totalGrupo.toLocaleString("es-AR")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-base text-blue-400 mt-6">* Haz clic en cada solapa para ver el grupo correspondiente.</div>
    </div>
  );
}

export default ReporteMensualComponent;
