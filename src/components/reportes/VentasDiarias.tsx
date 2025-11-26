import React, { useState, useEffect } from 'react';
import { fetchReporteSubdiario, fetchFacturasVentaAC, RegistroSubdiario, FacturaVenta } from '../../api/reportes';

interface VentasDiariasProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

interface VentaDiariaAC {
  fecha: string;
  liquidos: {
    [producto: string]: { litros: number; importe: number };
  };
  otros: {
    [producto: string]: { litros: number; importe: number };
  };
  totalFacturado: number; // Neto + impuesto interno para líquidos
}

interface VentaDiariaDirectos {
  fecha: string;
  liquidos: {
    [producto: string]: { litros: number; importe: number };
  };
  otros: {
    [producto: string]: { litros: number; importe: number };
  };
  totalFacturado: number; // Neto + impuesto interno para líquidos
}

// Productos líquidos que requieren impuesto interno
const productosLiquidos = [
  "NAFTA SUPER", "NAFTA PREMIUM", "DIESEL", "DIESEL PREMIUM", 
  "DIESEL X10", "QUANTUM DIESEL", "QUANTUM NAFTA", "QUANTIUM NAFTA",
  "FUEL OIL"
];

const esLiquido = (producto: string): boolean => {
  const prodUpper = producto.toUpperCase();
  return productosLiquidos.some(p => prodUpper.includes(p.toUpperCase()));
};

const esAxionCard = (metodoPago?: string): boolean => {
  if (!metodoPago) return false;
  const metodoUpper = metodoPago.toUpperCase();
  return metodoUpper.includes('AC') || metodoUpper.includes('AXION') || metodoUpper.includes('CARD');
};

const VentasDiarias: React.FC<VentasDiariasProps> = ({ 
  fechaInicio: propFechaInicio, 
  fechaFin: propFechaFin, 
  onFechaChange 
}) => {
  const [dataAC, setDataAC] = useState<VentaDiariaAC[]>([]);
  const [dataDirectos, setDataDirectos] = useState<VentaDiariaDirectos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>(propFechaInicio || '');
  const [fechaFin, setFechaFin] = useState<string>(propFechaFin || '');

  useEffect(() => {
    if (propFechaInicio && propFechaFin) {
      setFechaInicio(propFechaInicio);
      setFechaFin(propFechaFin);
    } else {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const inicio = firstDay.toISOString().split('T')[0];
      const fin = today.toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(fin);
      if (onFechaChange) {
        onFechaChange(inicio, fin);
      }
    }
  }, [propFechaInicio, propFechaFin, onFechaChange]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchData();
    }
  }, [fechaInicio, fechaFin]);

  // Función para debug: obtener y mostrar facturas en consola
  const debugFacturasVenta = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Convertir fechas al formato YYYYMMDD requerido por GetFacturasVenta
      // Según la documentación: "en formato YYYYMMDD"
      const convertirFecha = (fecha: string): string => {
        // Si ya está en formato YYYYMMDD, retornar tal cual
        if (/^\d{8}$/.test(fecha)) return fecha;
        // Si está en formato YYYY-MM-DD, convertir a YYYYMMDD
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha.replace(/-/g, '');
        }
        // Intentar parsear como Date y convertir
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          const anio = date.getFullYear();
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const dia = String(date.getDate()).padStart(2, '0');
          return `${anio}${mes}${dia}`;
        }
        return fecha;
      };
      
      const desdeFechaFormato = convertirFecha(fechaInicio);
      const hastaFechaFormato = convertirFecha(fechaFin);
      
      const params = new URLSearchParams();
      params.append("desdeFecha", desdeFechaFormato);
      params.append("hastaFecha", hastaFechaFormato);
      
      console.log('🔍 [DEBUG] Llamando a GetFacturasVenta...');
      console.log('🔍 [DEBUG] Parámetros:', { desdeFecha: desdeFechaFormato, hastaFecha: hastaFechaFormato });
      
      const response = await fetch(`${API_URL}/Facturacion/GetFacturasVenta?${params.toString()}`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const json = await response.json();
      
      console.log('✅ [DEBUG] Respuesta completa de GetFacturasVenta:');
      console.log(JSON.stringify(json, null, 2));
      
      // Mostrar también solo las facturas AC
      let data: any[] = [];
      if (Array.isArray(json)) {
        data = json;
      } else if (json.ok && Array.isArray(json.data)) {
        data = json.data;
      } else if (json.data && Array.isArray(json.data)) {
        data = json.data;
      }
      
      const facturasAC = data.filter((factura: any) => {
        const nombreCliente = factura.NombreCliente || factura.nombreCliente || factura.Cliente || factura.cliente || '';
        return nombreCliente.toUpperCase().trim() === 'AXION CARD';
      });
      
      console.log('🎯 [DEBUG] Facturas con cliente "Axion Card":');
      console.log(JSON.stringify(facturasAC, null, 2));
      console.log(`📊 [DEBUG] Total facturas: ${data.length}, Facturas AC: ${facturasAC.length}`);
      
      // Mostrar estructura de la primera factura
      if (data.length > 0) {
        console.log('📋 [DEBUG] Estructura de la primera factura:');
        console.log(JSON.stringify(data[0], null, 2));
      }
      
      alert(`✅ Resultado en consola. Total facturas: ${data.length}, Facturas AC: ${facturasAC.length}`);
    } catch (error) {
      console.error('❌ [DEBUG] Error al obtener facturas:', error);
      alert(`❌ Error: ${(error as Error).message}`);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener facturas AC y datos del subdiario en paralelo
      const [facturasAC, rawData] = await Promise.all([
        fetchFacturasVentaAC(fechaInicio, fechaFin),
        fetchReporteSubdiario(fechaInicio, fechaFin)
      ]);
      
      // Crear un mapa de facturas AC por fecha para relacionar con ventas del subdiario
      // Como el subdiario no tiene número de factura, relacionamos por fecha y productos específicos
      const facturasACPorFecha = new Map<string, Set<string>>(); // fecha -> Set de productos que son AC
      
      // Productos que típicamente se venden con Axion Card (Diesel X10, Quantium Diesel)
      const productosAC = ['DIESEL X10', 'QUANTIUM DIESEL', 'QUANTUM DIESEL'];
      
      facturasAC.forEach((factura: FacturaVenta) => {
        const fechaFactura = factura.FechaEmision || factura.fechaEmision || '';
        if (fechaFactura) {
          const fechaNormalizada = fechaFactura.split('T')[0]; // YYYY-MM-DD
          if (!facturasACPorFecha.has(fechaNormalizada)) {
            facturasACPorFecha.set(fechaNormalizada, new Set<string>());
          }
          // Marcar que en esta fecha hay facturas AC (para productos específicos)
          facturasACPorFecha.get(fechaNormalizada)!.add('AC_FECHA');
        }
      });
      
      // Separar en dos mapas: uno para AC y otro para Directos
      const ventasPorFechaAC = new Map<string, VentaDiariaAC>();
      const ventasPorFechaDirectos = new Map<string, VentaDiariaDirectos>();
      
      rawData.forEach((item: RegistroSubdiario) => {
        const fecha = item.fecha.split('T')[0]; // Normalizar fecha a YYYY-MM-DD
        const producto = item.nombre;
        const litros = Number(item.litros || 0);
        const importeNeto = Number(item.importe || 0);
        
        // Determinar método de pago:
        // 1. Si el producto es Diesel X10 o Quantium Diesel Y hay facturas AC en esa fecha -> AC
        // 2. Si el nombre de caja incluye AC/AXION/CARD -> AC
        // 3. Si hay número de factura y está en facturas AC -> AC
        // 4. Sino -> Directos
        const nombreCaja = (item.nombre_caja || '').toUpperCase();
        const productoUpper = producto.toUpperCase();
        const tieneFacturaACEnFecha = facturasACPorFecha.has(fecha);
        const esProductoAC = productosAC.some(p => productoUpper.includes(p));
        const numFactura = (item.numero_factura || item.factura_id || '').toString();
        
        const esAC = (esProductoAC && tieneFacturaACEnFecha) || 
                     nombreCaja.includes('AC') || 
                     nombreCaja.includes('AXION') || 
                     nombreCaja.includes('CARD') ||
                     (numFactura && facturasACPorFecha.has(fecha)); // Si hay factura AC en esa fecha y tenemos número
        
        if (esAC) {
          // Procesar para tabla AC
          if (!ventasPorFechaAC.has(fecha)) {
            ventasPorFechaAC.set(fecha, {
              fecha,
              liquidos: {},
              otros: {},
              totalFacturado: 0,
            });
          }
          
          const ventaDia = ventasPorFechaAC.get(fecha)!;
          
          if (esLiquido(producto)) {
            if (!ventaDia.liquidos[producto]) {
              ventaDia.liquidos[producto] = { litros: 0, importe: 0 };
            }
            ventaDia.liquidos[producto].litros += litros;
            ventaDia.liquidos[producto].importe += importeNeto;
            // Valor facturado = Neto + impuesto interno (21%)
            ventaDia.totalFacturado += importeNeto * 1.21;
          } else {
            if (!ventaDia.otros[producto]) {
              ventaDia.otros[producto] = { litros: 0, importe: 0 };
            }
            ventaDia.otros[producto].litros += litros;
            ventaDia.otros[producto].importe += importeNeto;
            ventaDia.totalFacturado += importeNeto;
          }
        } else {
          // Procesar para tabla Directos
          if (!ventasPorFechaDirectos.has(fecha)) {
            ventasPorFechaDirectos.set(fecha, {
              fecha,
              liquidos: {},
              otros: {},
              totalFacturado: 0,
            });
          }
          
          const ventaDia = ventasPorFechaDirectos.get(fecha)!;
          
          if (esLiquido(producto)) {
            if (!ventaDia.liquidos[producto]) {
              ventaDia.liquidos[producto] = { litros: 0, importe: 0 };
            }
            ventaDia.liquidos[producto].litros += litros;
            ventaDia.liquidos[producto].importe += importeNeto;
            // Valor facturado = Neto + impuesto interno (21%)
            ventaDia.totalFacturado += importeNeto * 1.21;
          } else {
            if (!ventaDia.otros[producto]) {
              ventaDia.otros[producto] = { litros: 0, importe: 0 };
            }
            ventaDia.otros[producto].litros += litros;
            ventaDia.otros[producto].importe += importeNeto;
            ventaDia.totalFacturado += importeNeto;
          }
        }
      });
      
      // Convertir a arrays y ordenar por fecha
      const ventasACArray = Array.from(ventasPorFechaAC.values()).sort((a, b) => 
        a.fecha.localeCompare(b.fecha)
      );
      const ventasDirectosArray = Array.from(ventasPorFechaDirectos.values()).sort((a, b) => 
        a.fecha.localeCompare(b.fecha)
      );
      
      // Si no hay datos, usar datos mock
      if (ventasACArray.length === 0 && ventasDirectosArray.length === 0) {
        const { mockAC, mockDirectos, razon } = getMockData();
        setDataAC(mockAC);
        setDataDirectos(mockDirectos);
        setError(`⚠️ ${razon}`);
      } else {
        setDataAC(ventasACArray);
        setDataDirectos(ventasDirectosArray);
        setError(null);
      }
    } catch (err) {
      // En caso de error, también mostrar datos mock
      const { mockAC, mockDirectos, razon } = getMockData();
      setDataAC(mockAC);
      setDataDirectos(mockDirectos);
      setError(`⚠️ Error al cargar datos: ${(err as Error).message}. ${razon}`);
    }
    setLoading(false);
  };

  // Función para generar datos mock
  const getMockData = () => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const anteayer = new Date(hoy);
    anteayer.setDate(anteayer.getDate() - 2);

    const mockAC: VentaDiariaAC[] = [
      {
        fecha: ayer.toISOString().split('T')[0],
        liquidos: {
          'NAFTA SUPER': { litros: 1500, importe: 120000 },
          'DIESEL': { litros: 2000, importe: 160000 },
        },
        otros: {
          'GNC': { litros: 500, importe: 30000 },
        },
        totalFacturado: (120000 + 160000) * 1.21 + 30000,
      },
      {
        fecha: hoy.toISOString().split('T')[0],
        liquidos: {
          'NAFTA SUPER': { litros: 1800, importe: 144000 },
          'DIESEL': { litros: 2200, importe: 176000 },
        },
        otros: {
          'GNC': { litros: 600, importe: 36000 },
        },
        totalFacturado: (144000 + 176000) * 1.21 + 36000,
      },
    ];

    const mockDirectos: VentaDiariaDirectos[] = [
      {
        fecha: ayer.toISOString().split('T')[0],
        liquidos: {
          'NAFTA PREMIUM': { litros: 800, importe: 72000 },
          'DIESEL': { litros: 1500, importe: 120000 },
        },
        otros: {
          'ADBLUE': { litros: 200, importe: 18000 },
        },
        totalFacturado: (72000 + 120000) * 1.21 + 18000,
      },
      {
        fecha: hoy.toISOString().split('T')[0],
        liquidos: {
          'NAFTA PREMIUM': { litros: 1000, importe: 90000 },
          'DIESEL': { litros: 1800, importe: 144000 },
        },
        otros: {
          'ADBLUE': { litros: 250, importe: 22500 },
        },
        totalFacturado: (90000 + 144000) * 1.21 + 22500,
      },
    ];

    const razon = 'No se encontraron datos reales para el período seleccionado. Se muestran datos de demostración para ilustrar cómo se vería la tabla con información.';

    return { mockAC, mockDirectos, razon };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-blue-700 text-base font-medium animate-pulse">Cargando datos...</span>
      </div>
    );
  }

  // No mostrar error como bloqueo, solo como advertencia si hay datos mock

  // Función para obtener productos únicos y calcular totales
  const procesarDatos = (data: VentaDiariaAC[] | VentaDiariaDirectos[]) => {
    const productosLiquidosUnicos = new Set<string>();
    const productosOtrosUnicos = new Set<string>();
    
    data.forEach(dia => {
      Object.keys(dia.liquidos).forEach(prod => productosLiquidosUnicos.add(prod));
      Object.keys(dia.otros).forEach(prod => productosOtrosUnicos.add(prod));
    });
    
    const productosLiquidosArray = Array.from(productosLiquidosUnicos).sort();
    const productosOtrosArray = Array.from(productosOtrosUnicos).sort();
    
    // Calcular totales
    const totales = {
      liquidos: {} as Record<string, { litros: number; importe: number }>,
      otros: {} as Record<string, { litros: number; importe: number }>,
      totalFacturado: 0,
    };
    
    data.forEach(dia => {
      Object.keys(dia.liquidos).forEach(prod => {
        if (!totales.liquidos[prod]) {
          totales.liquidos[prod] = { litros: 0, importe: 0 };
        }
        totales.liquidos[prod].litros += dia.liquidos[prod].litros;
        totales.liquidos[prod].importe += dia.liquidos[prod].importe;
      });
      Object.keys(dia.otros).forEach(prod => {
        if (!totales.otros[prod]) {
          totales.otros[prod] = { litros: 0, importe: 0 };
        }
        totales.otros[prod].litros += dia.otros[prod].litros;
        totales.otros[prod].importe += dia.otros[prod].importe;
      });
      totales.totalFacturado += dia.totalFacturado;
    });
    
    return { productosLiquidosArray, productosOtrosArray, totales };
  };

  const datosAC = procesarDatos(dataAC);
  const datosDirectos = procesarDatos(dataDirectos);
  
  // Componente para renderizar una tabla
  const renderTabla = (
    titulo: string,
    data: VentaDiariaAC[] | VentaDiariaDirectos[],
    productosLiquidosArray: string[],
    productosOtrosArray: string[],
    totales: { liquidos: Record<string, { litros: number; importe: number }>; otros: Record<string, { litros: number; importe: number }>; totalFacturado: number }
  ) => (
    <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto mb-6">
      <div className="px-4 md:px-8 pt-6 pb-3">
        <h2 className="text-lg font-bold text-blue-900 mb-2">{titulo}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-blue-900 text-sm min-w-[800px]">
          <thead className="bg-blue-50 sticky top-0">
            <tr>
              <th className="py-3 px-4 md:px-6 text-left font-semibold border border-blue-200">Fecha</th>
              {productosLiquidosArray.length > 0 && (
                <th colSpan={productosLiquidosArray.length * 2} className="py-3 px-4 md:px-6 text-center font-semibold border border-blue-200 bg-blue-100">
                  Líquidos
                </th>
              )}
              {productosOtrosArray.length > 0 && (
                <th colSpan={productosOtrosArray.length * 2} className="py-3 px-4 md:px-6 text-center font-semibold border border-blue-200 bg-blue-100">
                  Otros Productos
                </th>
              )}
              <th className="py-3 px-4 md:px-6 text-right font-semibold border border-blue-200">Total Facturado</th>
            </tr>
            <tr>
              <th className="py-2 px-4 md:px-6 text-left font-semibold border border-blue-200 bg-blue-50"></th>
              {productosLiquidosArray.map(prod => (
                <React.Fragment key={prod}>
                  <th className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                    {prod}<br />(L)
                  </th>
                  <th className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                    {prod}<br />Neto ($)
                  </th>
                </React.Fragment>
              ))}
              {productosOtrosArray.map(prod => (
                <React.Fragment key={prod}>
                  <th className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                    {prod}<br />(L)
                  </th>
                  <th className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                    {prod}<br />Neto ($)
                  </th>
                </React.Fragment>
              ))}
              <th className="py-2 px-4 md:px-6 text-right font-semibold border border-blue-200 bg-blue-50"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={1 + productosLiquidosArray.length * 2 + productosOtrosArray.length * 2 + 1} 
                  className="py-8 text-center text-gray-500 border border-blue-200"
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              <>
                {data.map((dia, index) => (
                  <tr key={dia.fecha} className={`border-t border-blue-100 hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}`}>
                    <td className="py-3 px-4 md:px-6 font-semibold border border-blue-200">
                      {new Date(dia.fecha).toLocaleDateString('es-AR')}
                    </td>
                    {productosLiquidosArray.map(prod => (
                      <React.Fragment key={prod}>
                        <td className="py-3 px-2 text-right border border-blue-200">
                          {dia.liquidos[prod]?.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                        </td>
                        <td className="py-3 px-2 text-right border border-blue-200">
                          ${dia.liquidos[prod]?.importe.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                        </td>
                      </React.Fragment>
                    ))}
                    {productosOtrosArray.map(prod => (
                      <React.Fragment key={prod}>
                        <td className="py-3 px-2 text-right border border-blue-200">
                          {dia.otros[prod]?.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                        </td>
                        <td className="py-3 px-2 text-right border border-blue-200">
                          ${dia.otros[prod]?.importe.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="py-3 px-4 md:px-6 text-right font-semibold border border-blue-200">
                      ${dia.totalFacturado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
                  <td className="py-3 px-4 md:px-6 border border-blue-200">TOTAL</td>
                  {productosLiquidosArray.map(prod => (
                    <React.Fragment key={prod}>
                      <td className="py-3 px-2 text-right border border-blue-200">
                        {totales.liquidos[prod]?.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                      </td>
                      <td className="py-3 px-2 text-right border border-blue-200">
                        ${totales.liquidos[prod]?.importe.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                      </td>
                    </React.Fragment>
                  ))}
                  {productosOtrosArray.map(prod => (
                    <React.Fragment key={prod}>
                      <td className="py-3 px-2 text-right border border-blue-200">
                        {totales.otros[prod]?.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                      </td>
                      <td className="py-3 px-2 text-right border border-blue-200">
                        ${totales.otros[prod]?.importe.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="py-3 px-4 md:px-6 text-right border border-blue-200">
                    ${totales.totalFacturado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="py-6 px-2 md:px-6 min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 text-center">
            Ventas Diarias
          </h1>
          <button
            onClick={debugFacturasVenta}
            className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded font-semibold shadow text-base whitespace-nowrap"
            title="Debug: Ver respuesta de GetFacturasVenta en consola"
          >
             Debug Facturas
          </button>
        </div>

        {/* Mensaje de advertencia si hay datos mock */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <p className="text-yellow-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Filtros de fecha */}
        {!propFechaInicio && (
          <div className="flex flex-wrap gap-4 mb-6 justify-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
            <div>
              <label className="block text-blue-900 font-semibold mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex gap-2 mt-6 md:mt-8">
              <button
                onClick={fetchData}
                className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-base"
              >
                Buscar
              </button>
              <button
                onClick={debugFacturasVenta}
                className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded font-semibold shadow text-base"
                title="Debug: Ver respuesta de GetFacturasVenta en consola"
              >
                🔍 Debug Facturas
              </button>
            </div>
          </div>
        )}

        {/* Tabla AC */}
        {renderTabla(
          'Ventas con Axion Card (AC)',
          dataAC,
          datosAC.productosLiquidosArray,
          datosAC.productosOtrosArray,
          datosAC.totales
        )}

        {/* Tabla Directos */}
        {renderTabla(
          'Ventas Directas',
          dataDirectos,
          datosDirectos.productosLiquidosArray,
          datosDirectos.productosOtrosArray,
          datosDirectos.totales
        )}
      </div>
    </div>
  );
};

export default VentasDiarias;

