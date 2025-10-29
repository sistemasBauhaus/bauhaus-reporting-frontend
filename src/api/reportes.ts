export interface ReporteSubdiario {
  fecha: string;
  quantium: number;
  super: number;
  diesel_x10: number;
  quantium_diesel: number;
  gnc: number;
  lubricantes: number;
  adblue: number;
  shop: number;
  total: number;
  
}

export async function fetchReporteSubdiario(): Promise<ReporteSubdiario[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const response = await fetch(`${API_URL}/reportes/subdiario`);
  const data = await response.json();
  if (!data.ok) throw new Error("Error al obtener el reporte subdiario");
  return data.data;
}
