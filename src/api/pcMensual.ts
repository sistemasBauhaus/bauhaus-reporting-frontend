export interface PcMensualBackend {
  fecha: string;
  producto: string;
  categoria: string;
  total_importe: string;
  total_cantidad: string;
}

export async function fetchPcMensual(): Promise<PcMensualBackend[]> {
  const API_URL = process.env.REACT_APP_API_URL;
  const fullUrl = `${API_URL}/pcMensual`;
  console.log("🌍 Fetch a:", fullUrl);

  const response = await fetch(fullUrl);
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ No es JSON, respuesta recibida:", text);
    throw new Error("Respuesta inválida del servidor");
  }
}

