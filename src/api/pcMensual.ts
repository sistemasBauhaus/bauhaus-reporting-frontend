export interface PcMensualBackend {
  fecha: string;
  producto: string;
  categoria: string;
  total_importe: number;    // Usa number si el backend envía número, o string si es string
  total_cantidad: number;   // Usa number si el backend envía número, o string si es string
  estacion_id: number;
  nombre_estacion: string;
  caja_id: number;
  nombre_caja: string;
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

