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
 * Obtiene niveles de tanques y stock valorizado
 * Usa el endpoint /api/reportes/subdiario y calcula los niveles basándose en los últimos datos
 */
export async function fetchNivelesTanques(
  empresaId?: number
): Promise<NivelTanque[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener datos recientes (últimos 30 días) para calcular niveles
  const fechaFin = new Date().toISOString().split('T')[0];
  const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const params = new URLSearchParams();
  params.append("fechaInicio", fechaInicio);
  params.append("fechaFin", fechaFin);
  if (empresaId) params.append("empresaId", empresaId.toString());

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
    throw new Error(json.error || json.message || "Error al obtener niveles de tanques");
  }

  // Agrupar por producto y estación, obtener el último nivel conocido
  // El endpoint subdiario devuelve: fecha, nombre (producto), litros, importe, nombre_estacion, nombre_caja
  const nivelesMap = new Map<string, { producto_id: number; nombre_producto: string; estacion_id: number; nombre_estacion: string; cantidad: number; importe: number; fecha: string }>();
  
  json.data.forEach((item: any) => {
    const nombreProducto = item.nombre || item.Nombre || 'Sin nombre';
    const nombreEstacion = item.nombre_estacion || item.NombreEstacion || 'Sin estación';
    const estacionId = item.estacion_id || item.id_estacion || 0;
    const key = `${nombreProducto}_${estacionId}`;
    const cantidad = Number(item.litros || item.Litros || 0);
    const fecha = item.fecha || item.Fecha || new Date().toISOString();
    
    if (!nivelesMap.has(key) || new Date(fecha) > new Date(nivelesMap.get(key)!.fecha)) {
      nivelesMap.set(key, {
        producto_id: 0,
        nombre_producto: nombreProducto,
        estacion_id: estacionId,
        nombre_estacion: nombreEstacion,
        cantidad,
        importe: convertirImporte(Number(item.importe || item.Importe || 0)),
        fecha,
      });
    }
  });

  // Convertir a array y calcular niveles estimados
  let tanqueId = 1;
  return Array.from(nivelesMap.values()).map((item) => {
    const capacidad = 50000; // Capacidad estimada por defecto
    const nivel_actual = item.cantidad;
    const porcentaje = capacidad > 0 ? (nivel_actual / capacidad) * 100 : 0;
    const precioUnitario = item.cantidad > 0 ? item.importe / item.cantidad : 0;
    const valor_stock = nivel_actual * precioUnitario;

    return {
      tanque_id: tanqueId++,
      producto_id: item.producto_id,
      nombre_producto: item.nombre_producto,
      capacidad,
      nivel_actual,
      porcentaje,
      valor_stock,
      estacion_id: item.estacion_id,
      nombre_estacion: item.nombre_estacion,
    };
  });
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
 * Obtiene unidades de la empresa con geolocalización y alertas
 * Usa el endpoint /api/reportes/subdiario para obtener las estaciones únicas
 */
export async function fetchUnidadesEmpresa(
  empresaId?: number
): Promise<UnidadEmpresa[]> {
  // La variable de entorno ya incluye /api, no agregar otro /api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  
  // Obtener datos recientes para identificar estaciones activas
  const fechaFin = new Date().toISOString().split('T')[0];
  const fechaInicio = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const params = new URLSearchParams();
  params.append("fechaInicio", fechaInicio);
  params.append("fechaFin", fechaFin);
  if (empresaId) params.append("empresaId", empresaId.toString());

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
    throw new Error(json.error || json.message || "Error al obtener unidades de la empresa");
  }

  // Agrupar por estación y calcular estado y alertas
  // El endpoint subdiario devuelve: fecha, nombre (producto), litros, importe, nombre_estacion, nombre_caja
  const estacionesMap = new Map<number, { nombre_estacion: string; ultima_actividad: string; alertas: string[] }>();
  
  json.data.forEach((item: any) => {
    const estacionId = item.estacion_id || item.id_estacion || 0;
    const nombreEstacion = item.nombre_estacion || item.NombreEstacion || `Estación ${estacionId}`;
    const fecha = item.fecha || item.Fecha || new Date().toISOString();
    
    if (!estacionesMap.has(estacionId)) {
      estacionesMap.set(estacionId, {
        nombre_estacion: nombreEstacion,
        ultima_actividad: fecha,
        alertas: [],
      });
    } else {
      const existente = estacionesMap.get(estacionId)!;
      if (new Date(fecha) > new Date(existente.ultima_actividad)) {
        existente.ultima_actividad = fecha;
      }
    }
  });

  // Convertir a array y calcular estados y alertas
  let unidadId = 1;
  return Array.from(estacionesMap.entries()).map(([estacion_id, datos]) => {
    const ultimaActividad = new Date(datos.ultima_actividad);
    const ahora = new Date();
    const diasInactivo = Math.floor((ahora.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24));
    
    const alertas: string[] = [];
    if (diasInactivo > 7) {
      alertas.push(`Sin actividad desde hace ${diasInactivo} días`);
    }
    
    const estado = diasInactivo <= 7 ? 'Activa' : 'Inactiva';

    return {
      unidad_id: unidadId++,
      nombre: datos.nombre_estacion,
      direccion: 'Dirección no disponible',
      latitud: -34.6037, // Buenos Aires por defecto
      longitud: -58.3816,
      tipo: 'Estación de Servicio',
      estado,
      alertas,
    };
  });
}

function getMockUnidadesEmpresa(): UnidadEmpresa[] {
  return [
    { unidad_id: 1, nombre: "Estación Centro", direccion: "Av. Corrientes 1234, CABA", latitud: -34.603722, longitud: -58.381592, tipo: "Estación de Servicio", estado: "Activa", alertas: ["Nivel bajo en tanque NAFTA PREMIUM"] },
    { unidad_id: 2, nombre: "Estación Norte", direccion: "Av. Libertador 5678, CABA", latitud: -34.570000, longitud: -58.410000, tipo: "Estación de Servicio", estado: "Activa", alertas: [] },
    { unidad_id: 3, nombre: "Depósito Sur", direccion: "Ruta 3 Km 45, Buenos Aires", latitud: -34.650000, longitud: -58.500000, tipo: "Depósito", estado: "Activa", alertas: ["Mantenimiento pendiente"] },
    { unidad_id: 4, nombre: "Oficina Administrativa", direccion: "Av. 9 de Julio 1000, CABA", latitud: -34.608000, longitud: -58.373000, tipo: "Oficina", estado: "Activa", alertas: [] },
  ];
}
