/**
 * Convierte importes de centavos a pesos (divide por 100)
 * Los importes en la base de datos están almacenados como int8 (centavos)
 * según db.sql: total_efectivo_recaudado e importe_ventas_totales_contado son int8
 */
export function convertirImporte(centavos: number): number {
  // Los importes vienen en centavos desde la base de datos, dividir por 100 para obtener pesos
  if (centavos === 0 || isNaN(centavos)) {
    return 0;
  }
  return centavos / 100;
}

export interface RegistroSubdiario {
  fecha: string;
  nombre: string;
  litros: number;
  importe: number;
  nombre_estacion?: string;
  nombre_caja?: string;
  numero_factura?: string;
  factura_id?: string;
}

export interface FacturaVenta {
  IdFactura?: number;
  idFactura?: number;
  FechaEmision?: string;
  fechaEmision?: string;
  MontoTotal?: number;
  montoTotal?: number;
  NombreCliente?: string;
  nombreCliente?: string;
  NumeroFactura?: string;
  numeroFactura?: string;
}

/**
 * Obtiene el reporte subdiario del backend
 * con los parámetros opcionales de fechaInicio y fechaFin
 */
export async function fetchReporteSubdiario(
  fechaInicio?: string,
  fechaFin?: string
): Promise<RegistroSubdiario[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();

  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);

  // Usar el endpoint reportes/subdiario
  const response = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
  const json = await response.json();

  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error("Error al obtener el reporte subdiario");
  }

  // Transformar datos de reportes/subdiario a formato subdiario
  // El endpoint ya devuelve el formato correcto: fecha, nombre, litros, importe, nombre_estacion, nombre_caja
  const data: RegistroSubdiario[] = json.data.map((d: any) => ({
    fecha: d.fecha || d.Fecha || new Date().toISOString(),
    nombre: d.nombre || d.Nombre || 'Sin nombre',
    litros: Number(d.litros || d.Litros || 0),
    importe: convertirImporte(Number(d.importe || d.Importe || 0)),
    nombre_estacion: d.nombre_estacion || d.NombreEstacion || "",
    nombre_caja: d.nombre_caja || d.NombreCaja || "",
    numero_factura: d.numero_factura || d.NumeroFactura || d.factura_id || d.FacturaId || "",
    factura_id: d.factura_id || d.FacturaId || d.numero_factura || d.NumeroFactura || "",
  }));

  // Filtramos filas vacías
  return data.filter(d => d.litros > 0 || d.importe > 0);
}

// Interfaces para los nuevos reportes
export interface VentaProducto {
  producto_id: number;
  nombre: string;
  litros: number;
  importe: number;
  precio_promedio: number;
  fecha: string;
}

export interface NivelTanque {
  tanque_id: number;
  producto_id: number;
  nombre_producto: string;
  capacidad: number;
  nivel_actual: number;
  porcentaje: number;
  valor_stock: number;
  estacion_id: number;
  nombre_estacion: string;
}

export interface SaldoCuentaCorriente {
  cliente_id: number;
  nombre_cliente: string;
  saldo: number;
  facturas_pendientes: number;
  remitos_pendientes: number;
  ultima_actualizacion: string;
}

export interface CompraDiscriminada {
  compra_id: number;
  fecha: string;
  proveedor: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  importe_total: number;
  estado: string;
}

export interface FacturaProveedorPendiente {
  factura_id: number;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  proveedor: string;
  importe: number;
  dias_vencido: number;
  estado: string;
}

export interface FacturasProveedorPorMes {
  proveedor: string;
  total_importe: number;
  cantidad_facturas: number;
}

export interface UnidadEmpresa {
  unidad_id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  tipo: string;
  estado: string;
  alertas: string[];
}

export interface UnidadesEmpresaResponse {
  empresa_id: number;
  nombre_empresa: string;
  total_estaciones: number;
  total_cajas: number;
  total_unidades: number;
  total_importe: number;
  dias_con_actividad: number;
}

export interface CuentasAging {
  vencido: number;
  a_dia: number;
  cinco_dias: number;
  quince_dias: number;
  treinta_dias_o_mas: number;
}

export interface StockValorizado {
  categoria: string;
  producto: string;
  cantidad: number;
  costo_neto: number;
  impuesto_interno?: number;
  costo_total: number;
  valor_stock: number;
  ubicacion: string; // "Playa" o "Shop"
}

export interface Proyectado {
  categoria: string;
  producto: string;
  monto: number;
}

/**
 * Obtiene ventas por producto/litro del mes
 * Usa el endpoint /api/reportes/subdiario y transforma los datos
 */
export async function fetchVentasPorProducto(
  fechaInicio?: string,
  fechaFin?: string
): Promise<VentaProducto[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const params = new URLSearchParams();
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);

  const response = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
  }

  const json = await response.json();

  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error(json.error || json.message || "Error al obtener ventas por producto");
  }

  // Transformar datos de reportes/subdiario a formato de ventas por producto
  // El endpoint devuelve: fecha, nombre (producto), litros, importe, nombre_estacion, nombre_caja
  const productosMap = new Map<string, { producto_id: number; nombre: string; litros: number; importe: number; fechas: string[] }>();
  
  json.data.forEach((item: any) => {
    const nombre = item.nombre || item.Nombre || 'Sin nombre';
    const litros = Number(item.litros || item.Litros || 0);
    const importe = convertirImporte(Number(item.importe || item.Importe || 0));
    const fecha = item.fecha || item.Fecha || new Date().toISOString();
    
    // Usar nombre como clave ya que no tenemos producto_id en subdiario
    const key = nombre;

    if (productosMap.has(key)) {
      const existente = productosMap.get(key)!;
      existente.litros += litros;
      existente.importe += importe;
      existente.fechas.push(fecha);
    } else {
      productosMap.set(key, { producto_id: 0, nombre, litros, importe, fechas: [fecha] });
    }
  });

  // Convertir a array y calcular precios promedios
  let productoId = 1;
  return Array.from(productosMap.entries()).map(([_, datos]) => ({
    producto_id: datos.producto_id || productoId++,
    nombre: datos.nombre,
    litros: datos.litros,
    importe: datos.importe,
    precio_promedio: datos.litros > 0 ? datos.importe / datos.litros : 0,
    fecha: datos.fechas[0] || new Date().toISOString(),
  }));
}

// Datos mock para desarrollo
function getMockVentasPorProducto(): VentaProducto[] {
  return [
    { producto_id: 1, nombre: "NAFTA SUPER", litros: 15000, importe: 1200000, precio_promedio: 80, fecha: new Date().toISOString() },
    { producto_id: 2, nombre: "NAFTA PREMIUM", litros: 8000, importe: 720000, precio_promedio: 90, fecha: new Date().toISOString() },
    { producto_id: 3, nombre: "DIESEL", litros: 25000, importe: 2000000, precio_promedio: 80, fecha: new Date().toISOString() },
    { producto_id: 4, nombre: "GNC", litros: 5000, importe: 300000, precio_promedio: 60, fecha: new Date().toISOString() },
    { producto_id: 5, nombre: "ADBLUE", litros: 2000, importe: 180000, precio_promedio: 90, fecha: new Date().toISOString() },
  ];
}

/**
 * Obtiene niveles de tanques
 * Usa el endpoint /api/Tanques/GetAllTanques (API Externa - Caldenon)
 */
export async function fetchNivelesTanques(
  empresaId?: number
): Promise<NivelTanque[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const params = new URLSearchParams();
  if (empresaId) params.append("empresaId", empresaId.toString());

  try {
    const url = params.toString() 
      ? `${API_URL}/Tanques/GetAllTanques?${params.toString()}`
      : `${API_URL}/Tanques/GetAllTanques`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }

    const json = await response.json();

    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }

    // El endpoint GetAllTanques debería devolver datos directamente de tanques
    // Mapear campos posibles del endpoint a la estructura NivelTanque
    return data.map((item: any, index: number) => {
      // Mapear campos posibles del endpoint
      const tanque_id = item.tanque_id || item.id || item.tanqueId || index + 1;
      const producto_id = item.producto_id || item.productoId || item.id_producto || 0;
      const nombre_producto = item.nombre_producto || item.producto || item.nombre || item.Nombre || 'Sin nombre';
      const capacidad = Number(item.capacidad || item.Capacidad || item.capacidad_litros || 50000);
      const nivel_actual = Number(item.nivel_actual || item.NivelActual || item.cantidad || item.Cantidad || item.litros || item.Litros || 0);
      const estacion_id = Number(item.estacion_id || item.estacionId || item.id_estacion || item.EstacionId || 0);
      const nombre_estacion = item.nombre_estacion || item.estacion || item.NombreEstacion || item.Estacion || 'Sin estación';
      
      // Calcular porcentaje
      const porcentaje = capacidad > 0 ? (nivel_actual / capacidad) * 100 : 0;
      
      // Calcular valor_stock si hay precio unitario disponible
      const precioUnitario = item.precio_unitario || item.precioUnitario || item.precio || item.Precio || 0;
      const importe = item.importe || item.Importe || 0;
      // Si hay importe pero no precio unitario, calcularlo
      const precioCalculado = precioUnitario > 0 
        ? precioUnitario 
        : (nivel_actual > 0 && importe > 0 ? convertirImporte(Number(importe)) / nivel_actual : 0);
      const valor_stock = nivel_actual * precioCalculado;

      return {
        tanque_id,
        producto_id,
        nombre_producto,
        capacidad,
        nivel_actual,
        porcentaje,
        valor_stock,
        estacion_id,
        nombre_estacion,
      };
    });
  } catch (error) {
    console.warn("Error al obtener niveles de tanques:", error);
    // Retornar datos mock en caso de error para desarrollo
    return getMockNivelesTanques();
  }
}

function getMockNivelesTanques(): NivelTanque[] {
  return [
    { tanque_id: 1, producto_id: 1, nombre_producto: "NAFTA SUPER", capacidad: 50000, nivel_actual: 35000, porcentaje: 70, valor_stock: 2800000, estacion_id: 1, nombre_estacion: "Estación Centro" },
    { tanque_id: 2, producto_id: 2, nombre_producto: "NAFTA PREMIUM", capacidad: 30000, nivel_actual: 8000, porcentaje: 26.7, valor_stock: 720000, estacion_id: 1, nombre_estacion: "Estación Centro" },
    { tanque_id: 3, producto_id: 3, nombre_producto: "DIESEL", capacidad: 80000, nivel_actual: 60000, porcentaje: 75, valor_stock: 4800000, estacion_id: 1, nombre_estacion: "Estación Centro" },
    { tanque_id: 4, producto_id: 1, nombre_producto: "NAFTA SUPER", capacidad: 50000, nivel_actual: 5000, porcentaje: 10, valor_stock: 400000, estacion_id: 2, nombre_estacion: "Estación Norte" },
  ];
}

/**
 * Obtiene saldos de cuentas corrientes, facturas y remitos pendientes
 * Usa el endpoint /api/reportes/subdiario para obtener datos de ventas
 * Nota: Este endpoint no tiene información directa de cuentas corrientes, pero podemos usar los datos de ventas
 * como aproximación agrupando por estación/caja
 */
export async function fetchSaldosCuentasCorrientes(
  empresaId?: number
): Promise<SaldoCuentaCorriente[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener datos de los últimos 90 días
  const fechaFin = new Date().toISOString().split('T')[0];
  const fechaInicio = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const params = new URLSearchParams();
  params.append("fechaInicio", fechaInicio);
  params.append("fechaFin", fechaFin);
  if (empresaId) params.append("empresaId", empresaId.toString());

  try {
    const response = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }

    const json = await response.json();

    if (!json.ok || !Array.isArray(json.data)) {
      throw new Error(json.error || json.message || "Error al obtener saldos de cuentas corrientes");
    }

    // Agrupar por estación/caja como "clientes" y calcular saldos pendientes
    // El endpoint subdiario devuelve: fecha, nombre (producto), litros, importe, nombre_estacion, nombre_caja
    const clientesMap = new Map<string, { nombre_cliente: string; saldo: number; facturas_pendientes: number; remitos_pendientes: number; ultima_actualizacion: string }>();
    
    json.data.forEach((item: any) => {
      const nombreEstacion = item.nombre_estacion || item.NombreEstacion || 'Sin estación';
      const nombreCaja = item.nombre_caja || item.NombreCaja || 'Sin caja';
      const clienteKey = `${nombreEstacion} - ${nombreCaja}`;
      const importe = convertirImporte(Number(item.importe || item.Importe || 0));
      const fecha = item.fecha || item.Fecha || new Date().toISOString();
      
      if (!clientesMap.has(clienteKey)) {
        clientesMap.set(clienteKey, {
          nombre_cliente: clienteKey,
          saldo: 0,
          facturas_pendientes: 0,
          remitos_pendientes: 0,
          ultima_actualizacion: fecha,
        });
      }
      
      const cliente = clientesMap.get(clienteKey)!;
      cliente.saldo += importe;
      cliente.facturas_pendientes++; // Cada registro cuenta como factura pendiente
      
      if (new Date(fecha) > new Date(cliente.ultima_actualizacion)) {
        cliente.ultima_actualizacion = fecha;
      }
    });

    // Convertir a array
    let clienteId = 1;
    return Array.from(clientesMap.entries()).map(([_, datos]) => ({
      cliente_id: clienteId++,
      nombre_cliente: datos.nombre_cliente,
      saldo: datos.saldo,
      facturas_pendientes: datos.facturas_pendientes,
      remitos_pendientes: datos.remitos_pendientes,
      ultima_actualizacion: datos.ultima_actualizacion,
    }));
  } catch (error) {
    console.warn("Error al obtener saldos de cuentas corrientes:", error);
    return [];
  }
}

function getMockSaldosCuentasCorrientes(): SaldoCuentaCorriente[] {
  return [
    { cliente_id: 1, nombre_cliente: "Transportes ABC S.A.", saldo: 150000, facturas_pendientes: 3, remitos_pendientes: 2, ultima_actualizacion: new Date().toISOString() },
    { cliente_id: 2, nombre_cliente: "Logística XYZ", saldo: 85000, facturas_pendientes: 2, remitos_pendientes: 1, ultima_actualizacion: new Date().toISOString() },
    { cliente_id: 3, nombre_cliente: "Distribuidora Sur", saldo: 250000, facturas_pendientes: 5, remitos_pendientes: 3, ultima_actualizacion: new Date().toISOString() },
    { cliente_id: 4, nombre_cliente: "Fletes del Norte", saldo: 45000, facturas_pendientes: 1, remitos_pendientes: 0, ultima_actualizacion: new Date().toISOString() },
  ];
}

/**
 * Obtiene compras discriminadas
 * Usa el endpoint /api/reportes/subdiario para obtener datos de ventas
 * Nota: Este endpoint es para ventas, no compras. Se usa como aproximación agrupando por producto y fecha
 */
export async function fetchComprasDiscriminadas(
  fechaInicio?: string,
  fechaFin?: string
): Promise<CompraDiscriminada[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Si no se proporcionan fechas, usar el mes actual
  if (!fechaInicio || !fechaFin) {
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
    fechaInicio = primerDiaMes.toISOString().split('T')[0];
    fechaFin = now.toISOString().split('T')[0];
  }
  
  const params = new URLSearchParams();
  params.append("fechaInicio", fechaInicio);
  params.append("fechaFin", fechaFin);

  try {
    const response = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }

    const json = await response.json();

    if (!json.ok || !Array.isArray(json.data)) {
      throw new Error(json.error || json.message || "Error al obtener compras discriminadas");
    }

    // Agrupar por fecha y producto para simular compras
    // El endpoint subdiario devuelve: fecha, nombre (producto), litros, importe, nombre_estacion, nombre_caja
    const comprasMap = new Map<string, { fecha: string; producto: string; cantidad: number; importe_total: number }>();
    
    json.data.forEach((item: any) => {
      const fecha = item.fecha || item.Fecha || new Date().toISOString();
      const producto = item.nombre || item.Nombre || 'Sin producto';
      const litros = Number(item.litros || item.Litros || 0);
      const importe = convertirImporte(Number(item.importe || item.Importe || 0));
      const key = `${fecha}_${producto}`;
      
      if (comprasMap.has(key)) {
        const existente = comprasMap.get(key)!;
        existente.cantidad += litros;
        existente.importe_total += importe;
      } else {
        comprasMap.set(key, {
          fecha,
          producto,
          cantidad: litros,
          importe_total: importe,
        });
      }
    });

    // Transformar a formato de compras discriminadas
    let compraId = 1;
    return Array.from(comprasMap.values()).map((compra) => {
      const precioUnitario = compra.cantidad > 0 ? compra.importe_total / compra.cantidad : 0;
      
      return {
        compra_id: compraId++,
        fecha: compra.fecha,
        proveedor: 'Proveedor no especificado', // No hay información de proveedor en subdiario
        producto: compra.producto,
        cantidad: compra.cantidad,
        precio_unitario: precioUnitario,
        importe_total: compra.importe_total,
        estado: 'Pendiente', // Por defecto
      };
    });
  } catch (error) {
    console.warn("Error al obtener compras discriminadas:", error);
    return [];
  }
}

function getMockComprasDiscriminadas(): CompraDiscriminada[] {
  const fecha = new Date();
  return [
    { compra_id: 1, fecha: fecha.toISOString(), proveedor: "YPF S.A.", producto: "NAFTA SUPER", cantidad: 50000, precio_unitario: 75, importe_total: 3750000, estado: "Pagado" },
    { compra_id: 2, fecha: new Date(fecha.getTime() - 86400000).toISOString(), proveedor: "Shell Argentina", producto: "DIESEL", cantidad: 80000, precio_unitario: 78, importe_total: 6240000, estado: "Pendiente" },
    { compra_id: 3, fecha: new Date(fecha.getTime() - 172800000).toISOString(), proveedor: "Axion Energy", producto: "NAFTA PREMIUM", cantidad: 30000, precio_unitario: 85, importe_total: 2550000, estado: "Pagado" },
    { compra_id: 4, fecha: new Date(fecha.getTime() - 259200000).toISOString(), proveedor: "YPF S.A.", producto: "GNC", cantidad: 20000, precio_unitario: 55, importe_total: 1100000, estado: "Pendiente" },
  ];
}

/**
 * Obtiene facturas de proveedores pendientes de pago
 * Usa el endpoint /api/reportes/subdiario para obtener datos de ventas
 * Nota: Este endpoint es para ventas, no facturas de proveedores. Se usa como aproximación
 * agrupando por fecha y producto para simular facturas pendientes
 */
export async function fetchFacturasProveedoresPendientes(
  empresaId?: number
): Promise<FacturaProveedorPendiente[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener datos de los últimos 90 días
  const fechaFin = new Date().toISOString().split('T')[0];
  const fechaInicio = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const params = new URLSearchParams();
  params.append("fechaInicio", fechaInicio);
  params.append("fechaFin", fechaFin);
  if (empresaId) params.append("empresaId", empresaId.toString());

  try {
    const response = await fetch(`${API_URL}/reportes/subdiario?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }

    const json = await response.json();

    if (!json.ok || !Array.isArray(json.data)) {
      throw new Error(json.error || json.message || "Error al obtener facturas de proveedores pendientes");
    }

    // Agrupar por fecha y producto para simular facturas pendientes
    // El endpoint subdiario devuelve: fecha, nombre (producto), litros, importe, nombre_estacion, nombre_caja
    const facturasMap = new Map<string, { fecha: string; producto: string; importe: number }>();
    
    json.data.forEach((item: any) => {
      const fecha = item.fecha || item.Fecha || new Date().toISOString();
      const producto = item.nombre || item.Nombre || 'Sin producto';
      const importe = convertirImporte(Number(item.importe || item.Importe || 0));
      const key = `${fecha}_${producto}`;
      
      if (facturasMap.has(key)) {
        const existente = facturasMap.get(key)!;
        existente.importe += importe;
      } else {
        facturasMap.set(key, {
          fecha,
          producto,
          importe,
        });
      }
    });

    // Transformar a formato de facturas pendientes
    const hoy = new Date();
    let facturaId = 1;
    
    return Array.from(facturasMap.entries()).map(([key, factura]) => {
      const fechaEmision = factura.fecha;
      const fechaVencimiento = new Date(new Date(fechaEmision).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const fechaVenc = new Date(fechaVencimiento);
      const diasVencido = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
      const estado = diasVencido > 0 ? 'Vencida' : (diasVencido > -10 ? 'Por Vencer' : 'Al día');

      return {
        factura_id: facturaId++,
        numero_factura: `FC-${facturaId}-${factura.fecha.split('T')[0].replace(/-/g, '')}`,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        proveedor: 'Proveedor no especificado', // No hay información de proveedor en subdiario
        importe: factura.importe,
        dias_vencido: Math.max(0, diasVencido),
        estado,
      };
    });
  } catch (error) {
    console.warn("Error al obtener facturas de proveedores pendientes:", error);
    return [];
  }
}

function getMockFacturasProveedoresPendientes(): FacturaProveedorPendiente[] {
  const hoy = new Date();
  const vencida1 = new Date(hoy.getTime() - 15 * 86400000);
  const vencida2 = new Date(hoy.getTime() - 5 * 86400000);
  const porVencer = new Date(hoy.getTime() + 10 * 86400000);
  
  return [
    { factura_id: 1, numero_factura: "FC-001-2024", fecha_emision: vencida1.toISOString(), fecha_vencimiento: new Date(vencida1.getTime() + 30 * 86400000).toISOString(), proveedor: "YPF S.A.", importe: 3750000, dias_vencido: 15, estado: "Vencida" },
    { factura_id: 2, numero_factura: "FC-002-2024", fecha_emision: vencida2.toISOString(), fecha_vencimiento: new Date(vencida2.getTime() + 30 * 86400000).toISOString(), proveedor: "Shell Argentina", importe: 6240000, dias_vencido: 5, estado: "Vencida" },
    { factura_id: 3, numero_factura: "FC-003-2024", fecha_emision: hoy.toISOString(), fecha_vencimiento: porVencer.toISOString(), proveedor: "Axion Energy", importe: 2550000, dias_vencido: 0, estado: "Por Vencer" },
    { factura_id: 4, numero_factura: "FC-004-2024", fecha_emision: hoy.toISOString(), fecha_vencimiento: porVencer.toISOString(), proveedor: "YPF S.A.", importe: 1100000, dias_vencido: 0, estado: "Por Vencer" },
  ];
}

/**
 * Obtiene unidades de la empresa usando el endpoint correcto
 * GET /api/reportes?tipo=unidades-empresa
 */
export async function fetchUnidadesEmpresa(
  fechaInicio?: string,
  fechaFin?: string
): Promise<UnidadEmpresa[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar el mes actual por defecto
  if (!fechaInicio || !fechaFin) {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fechaInicio = primerDiaMes.toISOString().split('T')[0];
    fechaFin = hoy.toISOString().split('T')[0];
  }
  
  const params = new URLSearchParams();
  params.append("tipo", "unidades-empresa");
  params.append("fechaInicio", fechaInicio);
  params.append("fechaFin", fechaFin);

  try {
    const response = await fetch(`${API_URL}/reportes?${params.toString()}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }

    const json = await response.json();

    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }

    // Transformar la respuesta del endpoint a formato UnidadEmpresa
    // El endpoint retorna: empresa_id, nombre_empresa, total_estaciones, total_cajas, total_unidades, total_importe, dias_con_actividad
    return data.map((item: any, index: number) => {
      const empresaId = item.empresa_id || item.EmpresaId || index + 1;
      const nombreEmpresa = item.nombre_empresa || item.NombreEmpresa || `Empresa ${empresaId}`;
      const totalEstaciones = item.total_estaciones || item.TotalEstaciones || 0;
      const totalCajas = item.total_cajas || item.TotalCajas || 0;
      const totalUnidades = item.total_unidades || item.TotalUnidades || 0;
      const diasActividad = item.dias_con_actividad || item.DiasConActividad || 0;
      
      // Calcular estado basado en días con actividad
      const estado = diasActividad > 0 ? 'Activa' : 'Inactiva';
      
      // Generar alertas basadas en la información disponible
      const alertas: string[] = [];
      if (diasActividad === 0) {
        alertas.push('Sin actividad en el período seleccionado');
      }
      if (totalEstaciones === 0) {
        alertas.push('No hay estaciones registradas');
      }
      
      return {
        unidad_id: empresaId,
        nombre: nombreEmpresa,
        direccion: 'Dirección no disponible', // El endpoint no retorna dirección
        latitud: -34.6037, // Buenos Aires por defecto (no hay coordenadas en el endpoint)
        longitud: -58.3816,
        tipo: 'Empresa',
        estado,
        alertas,
      };
    });
  } catch (error) {
    console.warn("Error al obtener unidades de la empresa:", error);
    // Retornar datos mock
    return getMockUnidadesEmpresa();
  }
}

function getMockUnidadesEmpresa(): UnidadEmpresa[] {
  return [
    { unidad_id: 1, nombre: "Estación Centro", direccion: "Av. Corrientes 1234, CABA", latitud: -34.603722, longitud: -58.381592, tipo: "Estación de Servicio", estado: "Activa", alertas: ["Nivel bajo en tanque NAFTA PREMIUM"] },
    { unidad_id: 2, nombre: "Estación Norte", direccion: "Av. Libertador 5678, CABA", latitud: -34.570000, longitud: -58.410000, tipo: "Estación de Servicio", estado: "Activa", alertas: [] },
    { unidad_id: 3, nombre: "Depósito Sur", direccion: "Ruta 3 Km 45, Buenos Aires", latitud: -34.650000, longitud: -58.500000, tipo: "Depósito", estado: "Activa", alertas: ["Mantenimiento pendiente"] },
    { unidad_id: 4, nombre: "Oficina Administrativa", direccion: "Av. 9 de Julio 1000, CABA", latitud: -34.608000, longitud: -58.373000, tipo: "Oficina", estado: "Activa", alertas: [] },
  ];
}

/**
 * Obtiene cuentas a cobrar (facturas impagas) con aging buckets
 * Las facturas impagas surgen de las facturas no pagadas
 */
export async function fetchCuentasACobrar(): Promise<CuentasAging> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener facturas impagas - usar endpoint de facturas pendientes o similar
  // Por ahora, usar datos de saldos de cuentas corrientes como aproximación
  try {
    const saldos = await fetchSaldosCuentasCorrientes();
    const hoy = new Date();
    
    const aging: CuentasAging = {
      vencido: 0,
      a_dia: 0,
      cinco_dias: 0,
      quince_dias: 0,
      treinta_dias_o_mas: 0,
    };
    
    // Calcular aging basado en última actualización y saldo
    saldos.forEach(saldo => {
      const fechaUltima = new Date(saldo.ultima_actualizacion);
      const diasDiferencia = Math.floor((hoy.getTime() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasDiferencia < 0) {
        aging.a_dia += saldo.saldo;
      } else if (diasDiferencia === 0) {
        aging.a_dia += saldo.saldo;
      } else if (diasDiferencia <= 5) {
        aging.cinco_dias += saldo.saldo;
      } else if (diasDiferencia <= 15) {
        aging.quince_dias += saldo.saldo;
      } else if (diasDiferencia <= 30) {
        aging.treinta_dias_o_mas += saldo.saldo;
      } else {
        aging.vencido += saldo.saldo;
      }
    });
    
    return aging;
  } catch (error) {
    console.warn("Error al obtener cuentas a cobrar:", error);
    return {
      vencido: 650000,
      a_dia: 15000000,
      cinco_dias: 3600000,
      quince_dias: 25000000,
      treinta_dias_o_mas: 15000000,
    };
  }
}

/**
 * Obtiene cuentas a pagar (facturas de proveedores pendientes) con aging buckets
 */
export async function fetchCuentasAPagar(): Promise<CuentasAging> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  try {
    const facturas = await fetchFacturasProveedoresPendientes();
    const hoy = new Date();
    
    const aging: CuentasAging = {
      vencido: 0,
      a_dia: 0,
      cinco_dias: 0,
      quince_dias: 0,
      treinta_dias_o_mas: 0,
    };
    
    facturas.forEach(factura => {
      const fechaVenc = new Date(factura.fecha_vencimiento);
      const diasDiferencia = Math.floor((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasDiferencia < 0) {
        aging.vencido += factura.importe;
      } else if (diasDiferencia === 0) {
        aging.a_dia += factura.importe;
      } else if (diasDiferencia <= 5) {
        aging.cinco_dias += factura.importe;
      } else if (diasDiferencia <= 15) {
        aging.quince_dias += factura.importe;
      } else {
        aging.treinta_dias_o_mas += factura.importe;
      }
    });
    
    return aging;
  } catch (error) {
    console.warn("Error al obtener cuentas a pagar:", error);
    return {
      vencido: 650000,
      a_dia: 15000000,
      cinco_dias: 3600000,
      quince_dias: 25000000,
      treinta_dias_o_mas: 15000000,
    };
  }
}

/**
 * Obtiene stock valorizado
 * Para líquidos: costo = neto + impuesto interno
 * Para el resto: costo = solo neto
 */
export async function fetchStockValorizado(): Promise<StockValorizado[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Productos líquidos que requieren impuesto interno
  const productosLiquidos = [
    "NAFTA SUPER", "NAFTA PREMIUM", "DIESEL", "DIESEL PREMIUM", 
    "DIESEL X10", "QUANTUM DIESEL", "QUANTUM NAFTA", "QUANTIUM NAFTA",
    "FUEL OIL"
  ];
  
  try {
    // Obtener datos de niveles de tanques y ventas para calcular stock
    const niveles = await fetchNivelesTanques();
    const ventas = await fetchVentasPorProducto();
    
    const stockMap = new Map<string, StockValorizado>();
    
    // Procesar niveles de tanques (líquidos en playa)
    niveles.forEach(nivel => {
      const esLiquido = productosLiquidos.some(p => 
        nivel.nombre_producto.toUpperCase().includes(p.toUpperCase())
      );
      
      // Buscar precio/costo en ventas
      const venta = ventas.find(v => 
        v.nombre.toUpperCase() === nivel.nombre_producto.toUpperCase()
      );
      
      const costoNeto = venta && venta.litros > 0 
        ? (venta.importe / venta.litros) * 0.7 // Aproximación: 70% del precio de venta es costo
        : 50; // Costo por defecto
      
      const impuestoInterno = esLiquido ? costoNeto * 0.1 : 0; // 10% impuesto interno aproximado
      const costoTotal = esLiquido ? costoNeto + impuestoInterno : costoNeto;
      const valorStock = nivel.nivel_actual * costoTotal;
      
      const key = `${nivel.nombre_producto}_Playa`;
      stockMap.set(key, {
        categoria: esLiquido ? "Líquidos" : "Otros",
        producto: nivel.nombre_producto,
        cantidad: nivel.nivel_actual,
        costo_neto: costoNeto,
        impuesto_interno: esLiquido ? impuestoInterno : undefined,
        costo_total: costoTotal,
        valor_stock: valorStock,
        ubicacion: "Playa",
      });
    });
    
    // Agregar stock de Shop (aproximación)
    const shopStock: StockValorizado = {
      categoria: "Shop",
      producto: "Shop",
      cantidad: 1,
      costo_neto: 15000000,
      costo_total: 15000000,
      valor_stock: 15000000,
      ubicacion: "Shop",
    };
    stockMap.set("Shop_Shop", shopStock);
    
    return Array.from(stockMap.values());
  } catch (error) {
    console.warn("Error al obtener stock valorizado:", error);
    return [
      {
        categoria: "Líquidos",
        producto: "NAFTA SUPER",
        cantidad: 7000,
        costo_neto: 50,
        impuesto_interno: 5,
        costo_total: 55,
        valor_stock: 385000,
        ubicacion: "Playa",
      },
      {
        categoria: "Shop",
        producto: "Shop",
        cantidad: 1,
        costo_neto: 15000000,
        costo_total: 15000000,
        valor_stock: 15000000,
        ubicacion: "Shop",
      },
    ];
  }
}

// Interfaces para las 3 grillas de saldos de cuentas corrientes
export interface SaldoCuentaCorrienteConSaldo {
  cliente_id: number;
  nombre_cliente: string;
  saldo: number;
  ultima_actualizacion: string;
}

export interface ClienteConDeudaPendiente {
  cliente_id: number;
  nombre_cliente: string;
  deuda_total: number;
  facturas_pendientes: FacturaPendiente[];
}

export interface FacturaPendiente {
  factura_id: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  importe: number;
  dias_vencido: number;
  estado: string;
}

export interface RemitoPendienteFacturar {
  remito_id: number;
  numero_remito: string;
  fecha: string;
  cliente: string;
  importe: number;
  dias_pendiente: number;
  estado: string;
}

/**
 * Obtiene saldos de cuentas corrientes que no sean = cero
 * Usa el endpoint /api/CtaCte/GetRecibosEntreFechas
 */
export async function fetchSaldosCuentasCorrientesConSaldo(
  desdeFecha?: string,
  hastaFecha?: string
): Promise<SaldoCuentaCorrienteConSaldo[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar últimos 90 días
  if (!desdeFecha || !hastaFecha) {
    const hoy = new Date();
    hastaFecha = hoy.toISOString().split('T')[0];
    const fechaInicio = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
    desdeFecha = fechaInicio.toISOString().split('T')[0];
  }
  
  const params = new URLSearchParams();
  params.append("desdeFecha", desdeFecha);
  params.append("hastaFecha", hastaFecha);
  
  try {
    const response = await fetch(`${API_URL}/CtaCte/GetRecibosEntreFechas?${params.toString()}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }
    
    const json = await response.json();
    
    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }
    
    // Agrupar por cliente y calcular saldos
    const clientesMap = new Map<string, { nombre_cliente: string; saldo: number; ultima_actualizacion: string }>();
    
    data.forEach((item: any) => {
      const nombreCliente = item.cliente || item.nombre_cliente || item.Cliente || item.NombreCliente || 'Sin cliente';
      const importe = convertirImporte(Number(item.importe || item.Importe || item.saldo || item.Saldo || 0));
      const fecha = item.fecha || item.Fecha || item.fecha_emision || item.FechaEmision || new Date().toISOString();
      
      if (!clientesMap.has(nombreCliente)) {
        clientesMap.set(nombreCliente, {
          nombre_cliente: nombreCliente,
          saldo: 0,
          ultima_actualizacion: fecha,
        });
      }
      
      const cliente = clientesMap.get(nombreCliente)!;
      cliente.saldo += importe;
      
      if (new Date(fecha) > new Date(cliente.ultima_actualizacion)) {
        cliente.ultima_actualizacion = fecha;
      }
    });
    
    // Filtrar solo los que tienen saldo != 0 y convertir a array
    let clienteId = 1;
    return Array.from(clientesMap.values())
      .filter(cliente => cliente.saldo !== 0)
      .map(cliente => ({
        cliente_id: clienteId++,
        nombre_cliente: cliente.nombre_cliente,
        saldo: cliente.saldo,
        ultima_actualizacion: cliente.ultima_actualizacion,
      }));
  } catch (error) {
    console.warn("Error al obtener saldos de cuentas corrientes:", error);
    // Retornar datos mock
    return getMockSaldosConSaldo();
  }
}

function getMockSaldosConSaldo(): SaldoCuentaCorrienteConSaldo[] {
  return [
    { cliente_id: 1, nombre_cliente: "Transportes ABC S.A.", saldo: 150000, ultima_actualizacion: new Date().toISOString() },
    { cliente_id: 2, nombre_cliente: "Logística XYZ", saldo: -85000, ultima_actualizacion: new Date().toISOString() },
    { cliente_id: 3, nombre_cliente: "Distribuidora Sur", saldo: 250000, ultima_actualizacion: new Date().toISOString() },
  ];
}

/**
 * Obtiene clientes con deuda pendiente de cobro
 * Machea facturas con recibos para determinar qué facturas quedan pendientes
 */
export async function fetchClientesConDeudaPendiente(
  desdeFecha?: string,
  hastaFecha?: string
): Promise<ClienteConDeudaPendiente[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar últimos 90 días
  if (!desdeFecha || !hastaFecha) {
    const hoy = new Date();
    hastaFecha = hoy.toISOString().split('T')[0];
    const fechaInicio = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
    desdeFecha = fechaInicio.toISOString().split('T')[0];
  }
  
  try {
    // Convertir fechas al formato YYYYMMDD requerido por los endpoints
    // GetFacturasVenta requiere YYYYMMDD según la documentación
    const desdeFechaFormato = convertirFechaFormato(desdeFecha);
    const hastaFechaFormato = convertirFechaFormato(hastaFecha);
    
    // Obtener facturas y recibos
    const paramsFacturas = new URLSearchParams();
    paramsFacturas.append("desdeFecha", desdeFechaFormato);
    paramsFacturas.append("hastaFecha", hastaFechaFormato);
    
    const [responseFacturas, responseRecibos] = await Promise.all([
      fetch(`${API_URL}/Facturacion/GetFacturasVenta?${paramsFacturas.toString()}`, {
        method: 'GET',
        headers: headers
      }),
      fetch(`${API_URL}/CtaCte/GetRecibosEntreFechas?${paramsFacturas.toString()}`, {
        method: 'GET',
        headers: headers
      })
    ]);
    
    if (!responseFacturas.ok || !responseRecibos.ok) {
      throw new Error(`Error HTTP al obtener facturas o recibos`);
    }
    
    const jsonFacturas = await responseFacturas.json();
    const jsonRecibos = await responseRecibos.json();
    
    // Procesar facturas
    let facturasData: any[] = [];
    if (Array.isArray(jsonFacturas)) {
      facturasData = jsonFacturas;
    } else if (jsonFacturas.ok && Array.isArray(jsonFacturas.data)) {
      facturasData = jsonFacturas.data;
    } else if (jsonFacturas.data && Array.isArray(jsonFacturas.data)) {
      facturasData = jsonFacturas.data;
    }
    
    // Procesar recibos
    let recibosData: any[] = [];
    if (Array.isArray(jsonRecibos)) {
      recibosData = jsonRecibos;
    } else if (jsonRecibos.ok && Array.isArray(jsonRecibos.data)) {
      recibosData = jsonRecibos.data;
    } else if (jsonRecibos.data && Array.isArray(jsonRecibos.data)) {
      recibosData = jsonRecibos.data;
    }
    
    // Mapear recibos por factura (asumiendo que hay un campo que relaciona recibos con facturas)
    const recibosPorFactura = new Map<string, number>();
    recibosData.forEach((recibo: any) => {
      const facturaId = recibo.factura_id || recibo.FacturaId || recibo.numero_factura || recibo.NumeroFactura || '';
      const importe = convertirImporte(Number(recibo.importe || recibo.Importe || 0));
      if (recibosPorFactura.has(facturaId)) {
        recibosPorFactura.set(facturaId, recibosPorFactura.get(facturaId)! + importe);
      } else {
        recibosPorFactura.set(facturaId, importe);
      }
    });
    
    // Agrupar facturas pendientes por cliente
    const clientesMap = new Map<string, { facturas: FacturaPendiente[] }>();
    const hoy = new Date();
    
    facturasData.forEach((factura: any) => {
      const cliente = factura.cliente || factura.nombre_cliente || factura.Cliente || factura.NombreCliente || 'Sin cliente';
      const facturaId = factura.factura_id || factura.FacturaId || factura.numero_factura || factura.NumeroFactura || '';
      const numeroFactura = factura.numero_factura || factura.NumeroFactura || facturaId;
      const fechaEmision = factura.fecha_emision || factura.FechaEmision || factura.fecha || factura.Fecha || new Date().toISOString();
      const fechaVencimiento = factura.fecha_vencimiento || factura.FechaVencimiento || 
        new Date(new Date(fechaEmision).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const importeTotal = convertirImporte(Number(factura.importe || factura.Importe || factura.total || factura.Total || 0));
      const importePagado = recibosPorFactura.get(facturaId) || 0;
      const importePendiente = importeTotal - importePagado;
      
      // Solo incluir facturas con saldo pendiente
      if (importePendiente > 0) {
        if (!clientesMap.has(cliente)) {
          clientesMap.set(cliente, { facturas: [] });
        }
        
        const fechaVenc = new Date(fechaVencimiento);
        const diasVencido = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
        const estado = diasVencido > 0 ? 'Vencida' : (diasVencido > -10 ? 'Por Vencer' : 'Al día');
        
        clientesMap.get(cliente)!.facturas.push({
          factura_id: facturaId,
          numero_factura: numeroFactura,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento,
          importe: importePendiente,
          dias_vencido: Math.max(0, diasVencido),
          estado,
        });
      }
    });
    
    // Convertir a array
    let clienteId = 1;
    return Array.from(clientesMap.entries())
      .filter(([_, datos]) => datos.facturas.length > 0)
      .map(([nombreCliente, datos]) => ({
        cliente_id: clienteId++,
        nombre_cliente: nombreCliente,
        deuda_total: datos.facturas.reduce((sum, f) => sum + f.importe, 0),
        facturas_pendientes: datos.facturas,
      }));
  } catch (error) {
    console.warn("Error al obtener clientes con deuda pendiente:", error);
    // Retornar datos mock
    return getMockClientesConDeuda();
  }
}

function getMockClientesConDeuda(): ClienteConDeudaPendiente[] {
  const hoy = new Date();
  const vencida1 = new Date(hoy.getTime() - 15 * 86400000);
  const vencida2 = new Date(hoy.getTime() - 5 * 86400000);
  
  return [
    {
      cliente_id: 1,
      nombre_cliente: "Transportes ABC S.A.",
      deuda_total: 450000,
      facturas_pendientes: [
        {
          factura_id: "FC-001",
          numero_factura: "FC-001-2024",
          fecha_emision: vencida1.toISOString(),
          fecha_vencimiento: new Date(vencida1.getTime() + 30 * 86400000).toISOString(),
          importe: 250000,
          dias_vencido: 15,
          estado: "Vencida",
        },
        {
          factura_id: "FC-002",
          numero_factura: "FC-002-2024",
          fecha_emision: vencida2.toISOString(),
          fecha_vencimiento: new Date(vencida2.getTime() + 30 * 86400000).toISOString(),
          importe: 200000,
          dias_vencido: 5,
          estado: "Vencida",
        },
      ],
    },
    {
      cliente_id: 2,
      nombre_cliente: "Logística XYZ",
      deuda_total: 180000,
      facturas_pendientes: [
        {
          factura_id: "FC-003",
          numero_factura: "FC-003-2024",
          fecha_emision: hoy.toISOString(),
          fecha_vencimiento: new Date(hoy.getTime() + 30 * 86400000).toISOString(),
          importe: 180000,
          dias_vencido: 0,
          estado: "Al día",
        },
      ],
    },
  ];
}

/**
 * Obtiene remitos pendientes de facturar
 * Nota: No hay endpoint específico para remitos, se usa aproximación
 */
export async function fetchRemitosPendientesFacturar(
  desdeFecha?: string,
  hastaFecha?: string
): Promise<RemitoPendienteFacturar[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar últimos 90 días
  if (!desdeFecha || !hastaFecha) {
    const hoy = new Date();
    hastaFecha = hoy.toISOString().split('T')[0];
    const fechaInicio = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
    desdeFecha = fechaInicio.toISOString().split('T')[0];
  }
  
  try {
    // Intentar obtener remitos desde facturas no facturadas o usar endpoint alternativo
    // Por ahora, usar datos mock ya que no hay endpoint específico
    console.warn("No hay endpoint específico para remitos pendientes, usando datos mock");
    return getMockRemitosPendientes();
  } catch (error) {
    console.warn("Error al obtener remitos pendientes:", error);
    return getMockRemitosPendientes();
  }
}

function getMockRemitosPendientes(): RemitoPendienteFacturar[] {
  const hoy = new Date();
  const remito1 = new Date(hoy.getTime() - 20 * 86400000);
  const remito2 = new Date(hoy.getTime() - 10 * 86400000);
  const remito3 = new Date(hoy.getTime() - 5 * 86400000);
  
  return [
    {
      remito_id: 1,
      numero_remito: "REM-001-2024",
      fecha: remito1.toISOString(),
      cliente: "Transportes ABC S.A.",
      importe: 320000,
      dias_pendiente: 20,
      estado: "Pendiente",
    },
    {
      remito_id: 2,
      numero_remito: "REM-002-2024",
      fecha: remito2.toISOString(),
      cliente: "Logística XYZ",
      importe: 150000,
      dias_pendiente: 10,
      estado: "Pendiente",
    },
    {
      remito_id: 3,
      numero_remito: "REM-003-2024",
      fecha: remito3.toISOString(),
      cliente: "Distribuidora Sur",
      importe: 280000,
      dias_pendiente: 5,
      estado: "Pendiente",
    },
  ];
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a YYYYMMDD
 */
function convertirFechaFormato(fecha: string): string {
  // Si ya está en formato YYYYMMDD, retornar tal cual
  if (/^\d{8}$/.test(fecha)) {
    return fecha;
  }
  // Si está en formato YYYY-MM-DD, convertir a YYYYMMDD
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha.replace(/-/g, '');
  }
  // Si está en formato DD-MM-YYYY, convertir a YYYYMMDD
  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
    const [dia, mes, anio] = fecha.split('-');
    return `${anio}${mes}${dia}`;
  }
  // Intentar parsear como Date y convertir
  const date = new Date(fecha);
  if (!isNaN(date.getTime())) {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}${mes}${dia}`;
  }
  throw new Error(`Formato de fecha no reconocido: ${fecha}`);
}

/**
 * Obtiene facturas de venta desde GetFacturasVenta
 * Filtra las que tienen NombreCliente === "Axion Card"
 */
export async function fetchFacturasVentaAC(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturaVenta[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar el mes actual
  if (!fechaInicio || !fechaFin) {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fechaInicio = primerDiaMes.toISOString().split('T')[0];
    fechaFin = hoy.toISOString().split('T')[0];
  }
  
  try {
    // Convertir fechas al formato YYYYMMDD requerido por el endpoint GetFacturasVenta
    // Según la documentación: "en formato YYYYMMDD"
    const desdeFechaFormato = convertirFechaFormato(fechaInicio);
    const hastaFechaFormato = convertirFechaFormato(fechaFin);
    
    const params = new URLSearchParams();
    params.append("desdeFecha", desdeFechaFormato);
    params.append("hastaFecha", hastaFechaFormato);
    
    const response = await fetch(`${API_URL}/Facturacion/GetFacturasVenta?${params.toString()}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }
    
    const json = await response.json();
    
    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }
    
    // Filtrar facturas con NombreCliente === "Axion Card"
    const facturasAC = data
      .filter((factura: any) => {
        const nombreCliente = factura.NombreCliente || factura.nombreCliente || factura.Cliente || factura.cliente || '';
        return nombreCliente.toUpperCase().trim() === 'AXION CARD';
      })
      .map((factura: any) => ({
        IdFactura: factura.IdFactura || factura.idFactura,
        idFactura: factura.idFactura || factura.IdFactura,
        FechaEmision: factura.FechaEmision || factura.fechaEmision || factura.Fecha || factura.fecha,
        fechaEmision: factura.fechaEmision || factura.FechaEmision || factura.Fecha || factura.fecha,
        MontoTotal: factura.MontoTotal || factura.montoTotal || factura.Total || factura.total || 0,
        montoTotal: factura.montoTotal || factura.MontoTotal || factura.Total || factura.total || 0,
        NombreCliente: factura.NombreCliente || factura.nombreCliente || factura.Cliente || factura.cliente,
        nombreCliente: factura.nombreCliente || factura.NombreCliente || factura.Cliente || factura.cliente,
        NumeroFactura: factura.NumeroFactura || factura.numeroFactura || factura.IdFactura || factura.idFactura,
        numeroFactura: factura.numeroFactura || factura.NumeroFactura || factura.IdFactura || factura.idFactura,
      }));
    
    return facturasAC;
  } catch (error) {
    console.warn("Error al obtener facturas AC:", error);
    return [];
  }
}

/**
 * Obtiene la suma de facturas en el mes por proveedor
 * Usa el endpoint /api/Facturacion/GetFacturasCompra
 * Ordenadas de mayor a menor valor
 */
/**
 * Obtiene facturas de venta desde GetFacturasVenta
 * Parámetros: desdeFecha, hastaFecha (formato: YYYY-MM-DD)
 * Respuesta: IdFactura, FechaEmision, MontoTotal, NombreCliente
 */
export async function fetchFacturasVenta(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturaVenta[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar el mes actual
  if (!fechaInicio || !fechaFin) {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fechaInicio = primerDiaMes.toISOString().split('T')[0];
    fechaFin = hoy.toISOString().split('T')[0];
  }
  
  try {
    const params = new URLSearchParams();
    params.append("desdeFecha", fechaInicio);
    params.append("hastaFecha", fechaFin);
    
    const response = await fetch(`${API_URL}/Facturacion/GetFacturasVenta?${params.toString()}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }
    
    const json = await response.json();
    
    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }
    
    // Mapear a la interfaz FacturaVenta
    return data.map((item: any) => ({
      IdFactura: item.IdFactura || item.idFactura,
      FechaEmision: item.FechaEmision || item.fechaEmision,
      MontoTotal: item.MontoTotal || item.montoTotal || 0,
      NombreCliente: item.NombreCliente || item.nombreCliente || '',
    }));
  } catch (error) {
    console.error("Error al obtener facturas de venta:", error);
    throw error;
  }
}

export async function fetchFacturasProveedoresPorMes(
  fechaInicio?: string,
  fechaFin?: string
): Promise<FacturasProveedorPorMes[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si no se proporcionan fechas, usar el mes actual
  if (!fechaInicio || !fechaFin) {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fechaInicio = primerDiaMes.toISOString().split('T')[0];
    fechaFin = hoy.toISOString().split('T')[0];
  }
  
  try {
    // Convertir fechas al formato YYYYMMDD requerido por el endpoint
    const desdeFechaFormato = convertirFechaFormato(fechaInicio);
    const hastaFechaFormato = convertirFechaFormato(fechaFin);
    
    const params = new URLSearchParams();
    params.append("desdeFecha", desdeFechaFormato);
    params.append("hastaFecha", hastaFechaFormato);
    
    const response = await fetch(`${API_URL}/Facturacion/GetFacturasCompra?${params.toString()}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }
    
    const json = await response.json();
    
    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }
    
    // Agrupar por proveedor y sumar importes
    // El endpoint retorna: IdFactura, FechaEmision, MontoTotal, NombreCliente (que es el proveedor en facturas de compra)
    const proveedoresMap = new Map<string, { total_importe: number; cantidad_facturas: number }>();
    
    data.forEach((factura: any) => {
      // El proveedor puede estar en diferentes campos según la respuesta
      const proveedor = factura.NombreProveedor || factura.nombreProveedor || 
                       factura.NombreCliente || factura.nombreCliente || 
                       factura.Proveedor || factura.proveedor || 
                       'Proveedor no especificado';
      
      const importe = convertirImporte(Number(factura.MontoTotal || factura.montoTotal || factura.Importe || factura.importe || 0));
      
      if (!proveedoresMap.has(proveedor)) {
        proveedoresMap.set(proveedor, {
          total_importe: 0,
          cantidad_facturas: 0,
        });
      }
      
      const proveedorData = proveedoresMap.get(proveedor)!;
      proveedorData.total_importe += importe;
      proveedorData.cantidad_facturas += 1;
    });
    
    // Convertir a array y ordenar de mayor a menor valor
    return Array.from(proveedoresMap.entries())
      .map(([proveedor, datos]) => ({
        proveedor,
        total_importe: datos.total_importe,
        cantidad_facturas: datos.cantidad_facturas,
      }))
      .sort((a, b) => b.total_importe - a.total_importe);
  } catch (error) {
    console.warn("Error al obtener facturas de proveedores por mes:", error);
    // Retornar datos mock
    return getMockFacturasProveedoresPorMes();
  }
}

function getMockFacturasProveedoresPorMes(): FacturasProveedorPorMes[] {
  return [
    { proveedor: "YPF S.A.", total_importe: 4850000, cantidad_facturas: 2 },
    { proveedor: "Shell Argentina", total_importe: 6240000, cantidad_facturas: 1 },
    { proveedor: "Axion Energy", total_importe: 2550000, cantidad_facturas: 1 },
    { proveedor: "Repsol YPF", total_importe: 1800000, cantidad_facturas: 3 },
    { proveedor: "Petrobras", total_importe: 950000, cantidad_facturas: 2 },
  ];
}

// Interfaces para posiciones de unidades móviles
export interface PosicionUnidad {
  lat: string;
  lng: string;
  date: string;
  speed: string;
  direction: string;
  event_code: string;
  event: string;
  plate: string;
  imei?: string;
  odometer?: number;
  hourmeter?: number;
  driver_key?: string;
  driver_name?: string;
  driver_document?: string;
}

/**
 * Sincroniza posiciones desde MaxTracker a la base de datos
 * POST /api/positions/sincronizar
 */
export async function sincronizarPosiciones(plate?: string): Promise<void> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const body: any = {};
  if (plate) {
    body.plate = plate;
  }
  
  try {
    const response = await fetch(`${API_URL}/positions/sincronizar`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const json = await response.json();
    if (!json.ok && json.error) {
      throw new Error(json.error || json.message || "Error al sincronizar posiciones");
    }
  } catch (error) {
    console.warn("Error al sincronizar posiciones:", error);
    // No lanzar error, solo loguear para que continúe con la obtención de datos
  }
}

/**
 * Obtiene las posiciones de las unidades móviles desde MaxTracker
 * Primero sincroniza las posiciones y luego las obtiene
 * Usa el endpoint /api/positions
 */
export async function fetchPosicionesUnidades(
  limit: number = 100,
  sincronizar: boolean = true
): Promise<PosicionUnidad[]> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    // Primero sincronizar las posiciones si se solicita
    if (sincronizar) {
      await sincronizarPosiciones();
    }
    
    // Luego obtener las posiciones
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    
    const response = await fetch(`${API_URL}/positions?${params.toString()}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`El backend devolvió ${contentType || 'text/html'} en lugar de JSON. Respuesta: ${text.substring(0, 200)}`);
    }
    
    const json = await response.json();
    
    // Manejar diferentes formatos de respuesta
    let data: any[] = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json.ok && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else {
      throw new Error(json.error || json.message || "Formato de respuesta inesperado");
    }
    
    // Transformar a formato PosicionUnidad
    return data.map((item: any) => ({
      lat: item.lat || item.Lat || item.latitude || item.Latitude || "0",
      lng: item.lng || item.Lng || item.longitude || item.Longitude || "0",
      date: item.date || item.Date || item.fecha || item.Fecha || new Date().toISOString(),
      speed: item.speed || item.Speed || item.velocidad || item.Velocidad || "0",
      direction: item.direction || item.Direction || item.direccion || item.Direccion || "0",
      event_code: item.event_code || item.EventCode || item.codigo_evento || item.CodigoEvento || "",
      event: item.event || item.Event || item.evento || item.Evento || "",
      plate: item.plate || item.Plate || item.placa || item.Placa || "",
      imei: item.imei || item.IMEI,
      odometer: item.odometer || item.Odometer || item.odometro || item.Odometro,
      hourmeter: item.hourmeter || item.Hourmeter || item.horometro || item.Horometro,
      driver_key: item.driver_key || item.DriverKey || item.clave_conductor || item.ClaveConductor,
      driver_name: item.driver_name || item.DriverName || item.nombre_conductor || item.NombreConductor,
      driver_document: item.driver_document || item.DriverDocument || item.documento_conductor || item.DocumentoConductor,
    }));
  } catch (error) {
    console.warn("Error al obtener posiciones de unidades:", error);
    // Retornar datos mock
    return getMockPosicionesUnidades();
  }
}

/**
 * Obtiene la última posición de un vehículo específico
 * GET /api/positions/ultima-posicion/:placa
 */
export async function fetchUltimaPosicion(placa: string): Promise<PosicionUnidad | null> {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener token de autenticación
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_URL}/positions/ultima-posicion/${encodeURIComponent(placa)}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const json = await response.json();
    
    // Manejar diferentes formatos de respuesta
    let data: any = null;
    if (json.ok && json.data) {
      data = json.data;
    } else if (!json.ok && json.error) {
      throw new Error(json.error || json.message);
    } else {
      data = json;
    }
    
    if (!data) {
      return null;
    }
    
    // Transformar a formato PosicionUnidad
    return {
      lat: data.lat || data.Lat || data.latitude || data.Latitude || "0",
      lng: data.lng || data.Lng || data.longitude || data.Longitude || "0",
      date: data.date || data.Date || data.fecha || data.Fecha || new Date().toISOString(),
      speed: data.speed || data.Speed || data.velocidad || data.Velocidad || "0",
      direction: data.direction || data.Direction || data.direccion || data.Direccion || "0",
      event_code: data.event_code || data.EventCode || data.codigo_evento || data.CodigoEvento || "",
      event: data.event || data.Event || data.evento || data.Evento || "",
      plate: data.plate || data.Plate || data.placa || data.Placa || placa,
      imei: data.imei || data.IMEI,
      odometer: data.odometer || data.Odometer || data.odometro || data.Odometro,
      hourmeter: data.hourmeter || data.Hourmeter || data.horometro || data.Horometro,
      driver_key: data.driver_key || data.DriverKey || data.clave_conductor || data.ClaveConductor,
      driver_name: data.driver_name || data.DriverName || data.nombre_conductor || data.NombreConductor,
      driver_document: data.driver_document || data.DriverDocument || data.documento_conductor || data.DocumentoConductor,
    };
  } catch (error) {
    console.warn(`Error al obtener última posición de ${placa}:`, error);
    return null;
  }
}

function getMockPosicionesUnidades(): PosicionUnidad[] {
  return [
    {
      lat: "-34.603722",
      lng: "-58.381592",
      date: new Date().toISOString(),
      speed: "60.5",
      direction: "180",
      event_code: "MOV",
      event: "Movimiento",
      plate: "AD776WH",
      imei: "123456789",
      odometer: 50000,
      hourmeter: 2000,
      driver_key: "KEY123",
      driver_name: "Juan Pérez",
      driver_document: "12345678"
    },
    {
      lat: "-34.570000",
      lng: "-58.410000",
      date: new Date(Date.now() - 3600000).toISOString(),
      speed: "45.2",
      direction: "90",
      event_code: "MOV",
      event: "Movimiento",
      plate: "BC123XY",
      imei: "987654321",
      odometer: 35000,
      hourmeter: 1500,
      driver_key: "KEY456",
      driver_name: "María González",
      driver_document: "87654321"
    },
    {
      lat: "-34.650000",
      lng: "-58.500000",
      date: new Date(Date.now() - 7200000).toISOString(),
      speed: "0",
      direction: "0",
      event_code: "STP",
      event: "Detenido",
      plate: "CD456AB",
      imei: "456789123",
      odometer: 28000,
      hourmeter: 1200,
      driver_key: "KEY789",
      driver_name: "Carlos Rodríguez",
      driver_document: "11223344"
    },
  ];
}
