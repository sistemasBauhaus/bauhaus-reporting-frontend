// API para endpoints de facturación y recibos diarios

export interface FacturacionDiariaLiquidos {
  anio: number;
  mes_numero: number;
  nombre_dia: string;
  fecha: string;
  qn_ac: number;
  quantium_nafta: number;
  s_ac: number;
  super: number;
  diesel_x10_liviano_ac: number;
  diesel_x10_liviano: number;
  diesel_x10_pesado_ac: number;
  diesel_x10_pesado: number;
  quantium_diesel_x10_liviano_ac: number;
  quantium_diesel_x10_liviano: number;
  quantium_diesel_x10_pesado_ac: number;
  quantium_diesel_x10_pesado: number;
  total_dinero_dia: number;
}

export async function fetchFacturacionDiariaLiquidos(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturacionDiariaLiquidos[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const url = `${API_URL}/reportes/facturacion-diaria-liquidos?${params.toString()}`;
  const response = await fetch(url);
  console.log("[fetchFacturacionDiariaLiquidos] URL:", url);
  const text = await response.text();
  console.log("[fetchFacturacionDiariaLiquidos] Response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON. Verifica el backend.");
  }
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener la facturación diaria de líquidos");
  }
  return json.data;
}

export interface FacturacionDiariaCliente {
  fecha: string;
  razon_social: string;
  localidad: string;
  tipo_pago: string;
  neto_gravado: number;
  impuesto_interno: number;
  tasas: number;
  tasas_viales: number;
  juristiccion: string;
  percepcion_iibb: number;
  percepcion_iva: number;
  otras_percepciones: number;
  total: number;
}

export async function fetchFacturacionDiariaCliente(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturacionDiariaCliente[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const url = `${API_URL}/reportes/facturacion-diaria-cliente?${params.toString()}`;
  const response = await fetch(url);
  console.log("[fetchFacturacionDiariaCliente] URL:", url);
  const text = await response.text();
  console.log("[fetchFacturacionDiariaCliente] Response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON. Verifica el backend.");
  }
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener la facturación diaria por cliente");
  }
  return json.data;
}

export interface FacturacionDiariaGNC {
  anio: string;
  mes_numero: string;
  nombre_dia: string;
  fecha: string;
  gnc: string;
  gnc_ac: string;
  total_gnc_dinero: string;
}

export async function fetchFacturacionDiariaGNC(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturacionDiariaGNC[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const url = `${API_URL}/reportes/facturacion-diaria-gnc?${params.toString()}`;
  const response = await fetch(url);
  console.log("[fetchFacturacionDiariaGNC] URL:", url);
  const text = await response.text();
  console.log("[fetchFacturacionDiariaGNC] Response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON. Verifica el backend.");
  }
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener la facturación diaria de GNC");
  }
  return json.data;
}

export interface FacturacionDiariaOtros {
  anio: number;
  mes_numero: number;
  nombre_dia: string;
  fecha: string;
  eco_blue: number;
  lubricantes: number;
  otros: number;
  total_otros_dinero: number;
}

export async function fetchFacturacionDiariaOtros(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturacionDiariaOtros[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const url = `${API_URL}/reportes/facturacion-diaria-otros?${params.toString()}`;
  const response = await fetch(url);
  console.log("[fetchFacturacionDiariaOtros] URL:", url);
  const text = await response.text();
  console.log("[fetchFacturacionDiariaOtros] Response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON. Verifica el backend.");
  }
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener la facturación diaria de otros");
  }
  return json.data;
}

export interface FacturacionDiariaShop {
  anio: number;
  mes_numero: number;
  nombre_dia: string;
  fecha: string;
  cortesias_discriminado: number;
  total_comidas: number;
  total_liquidos: number;
  total_kiosco: number;
  total_venta_dia: number;
}

export async function fetchFacturacionDiariaShop(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturacionDiariaShop[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const url = `${API_URL}/reportes/facturacion-diaria-shop?${params.toString()}`;
  const response = await fetch(url);
  console.log("[fetchFacturacionDiariaShop] URL:", url);
  const text = await response.text();
  console.log("[fetchFacturacionDiariaShop] Response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON. Verifica el backend.");
  }
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener la facturación diaria de shop");
  }
  return json.data;
}

export interface ReciboDiarioCliente {
  fecha: string;
  cliente: string;
  importe: number;
}

export async function fetchReciboDiarioCliente(
  fechaInicio?: string,
  fechaFin?: string
): Promise<ReciboDiarioCliente[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const url = `${API_URL}/reportes/recibo-diario-cliente?${params.toString()}`;
  const response = await fetch(url);
  console.log("[fetchReciboDiarioCliente] URL:", url);
  const text = await response.text();
  console.log("[fetchReciboDiarioCliente] Response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON. Verifica el backend.");
  }
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener el recibo diario por cliente");
  }
  return json.data;
}
