export interface PcMensualBackend {
  categoria: string;
  producto: string;
  fecha: string;
  total_cantidad: number;
  total_importe: number;
  metodo_pago?: string;    
  nro_surtidor?: string;
   promedio_precio: number;    
}

export async function fetchPcMensual(
  fechaInicio: string,
  fechaFin: string
): Promise<PcMensualBackend[]> {
  const API_URL = process.env.REACT_APP_API_URL;
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const fullUrl = `${API_URL}/pcMensual?${params.toString()}`;
  console.log("🌍 Fetch a:", fullUrl);

  const response = await fetch(fullUrl);
  const text = await response.text();

  try {
    const json = JSON.parse(text);
    console.log("Respuesta backend:", json);
    if (json.ok && Array.isArray(json.data)) {
      return json.data;
    } else {
      console.error("❌ Respuesta inesperada:", json);
      throw new Error("Respuesta inválida del servidor");
    }
  } catch {
    console.error("❌ No es JSON, respuesta recibida:", text);
    throw new Error("Respuesta inválida del servidor");
  }
}

// Nuevo endpoint: /api/pcMensual/resumen
export interface PcResumenMensual {
  tipo: string;
  total_importe: number;
  total_cantidad: number;
  promedio_precio: number;
}

export async function fetchPcResumenMensual(
  fechaInicio: string,
  fechaFin: string
): Promise<PcResumenMensual[]> {
   const API_URL = process.env.REACT_APP_API_URL;
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);

  const fullUrl = `${API_URL}/pcMensual/resumen?${params.toString()}`;
  console.log("🌍 Fetch resumen mensual:", fullUrl);

  const response = await fetch(fullUrl);
  const json = await response.json();

  if (json.ok && Array.isArray(json.data)) return json.data;
  throw new Error("Respuesta inválida del servidor");
}
