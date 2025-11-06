export interface RegistroSubdiario {
  fecha: string;
  nombre: string;
  litros: number;
  importe: number;
  nombre_estacion?: string;
  nombre_caja?: string;
}

/**
 * Obtiene el reporte subdiario del backend
 * con los parámetros opcionales de fechaInicio y fechaFin
 */
export async function fetchReporteSubdiario(
  fechaInicio?: string,
  fechaFin?: string
): Promise<RegistroSubdiario[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const params = new URLSearchParams();

  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);

  // 🔹 Log para verificar qué se está enviando
  console.log("📤 Enviando al backend:", Object.fromEntries(params.entries()));

  const response = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
  const json = await response.json();

  console.log("📦 Respuesta completa del backend:", json);

  if (!json.ok) throw new Error("Error al obtener el reporte subdiario");

  // 🔹 Normalizamos para asegurar formato consistente
  const data: RegistroSubdiario[] = json.data.map((d: any) => ({
    fecha: d.fecha || d.Fecha,
    nombre: d.nombre || d.Nombre,
    litros: Number(d.litros || d.Litros || 0),
    importe: Number(d.importe || d.Importe || 0),
    nombre_estacion: d.nombre_estacion || d.NombreEstacion || "",
    nombre_caja: d.nombre_caja || d.NombreCaja || "",
  }));

  // 🔹 Filtramos filas vacías
  return data.filter(d => d.litros > 0 || d.importe > 0);
}
