export interface ReporteMensual {
  fecha: string;
  liquidos_importe?: number;
  gnc_importe?: number;
  lubricantes_importe?: number;
  adblue_importe?: number;
  shop_importe?: number;
  total?: number;
}

export async function fetchReporteMensual({ fechaInicio, fechaFin }: { fechaInicio?: string, fechaFin?: string }): Promise<ReporteMensual[]> {
  let url = "/api/reportes/mensual";
  const params = [];
  if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
  if (fechaFin) params.push(`fechaFin=${fechaFin}`);
  if (params.length) url += "?" + params.join("&");
  const res = await fetch(url);
  const contentType = res.headers.get("content-type");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Respuesta inesperada del servidor: ${text}`);
  }
  const data = await res.json();
  return data.data;
}
