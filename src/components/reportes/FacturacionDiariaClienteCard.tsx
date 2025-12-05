import { useEffect, useState } from "react";
import { fetchFacturacionDiariaCliente, FacturacionDiariaCliente } from "../../api/facturacion";

export default function FacturacionDiariaClienteCard() {
  const [data, setData] = useState<FacturacionDiariaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    setFechaInicio(primerDia.toISOString().split("T")[0]);
    setFechaFin(ultimoDia.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetchFacturacionDiariaCliente(fechaInicio, fechaFin);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (fechaInicio && fechaFin) fetchData();
  }, [fechaInicio, fechaFin]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 mb-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">Facturación Diaria por Cliente</h2>
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={fechaInicio}
          onChange={e => setFechaInicio(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={e => setFechaFin(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>
      {loading ? (
        <div className="text-purple-600">Cargando...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-100">
              <th className="px-2 py-2">Fecha</th>
              <th className="px-2 py-2">Cliente</th>
              <th className="px-2 py-2">Importe</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
                <tr key={row.fecha + row.razon_social} className="border-b">
                  <td className="px-2 py-1">{row.fecha}</td>
                  <td className="px-2 py-1">{row.razon_social}</td>
                  <td className="px-2 py-1 text-purple-700 font-semibold">{typeof row.total === "number" ? `$${row.total.toLocaleString("es-AR")}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
