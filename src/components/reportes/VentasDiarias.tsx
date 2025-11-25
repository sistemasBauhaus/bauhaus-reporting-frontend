import React, { useState, useEffect } from 'react';
import { fetchPcMensual, PcMensualBackend } from '../../api/pcMensual';

interface VentasDiariasProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

interface VentaDiaria {
  fecha: string;
  liquidos: {
    [producto: string]: {
      ac: { litros: number; importe: number };
      directos: { litros: number; importe: number };
    };
  };
  otros: {
    [producto: string]: {
      litros: number;
      importe: number;
    };
  };
  totalFacturado: number; // Neto + impuesto interno
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
  const [data, setData] = useState<VentaDiaria[]>([]);
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawData = await fetchPcMensual(fechaInicio, fechaFin);
      
      // Agrupar por fecha
      const ventasPorFecha = new Map<string, VentaDiaria>();
      
      rawData.forEach((item: PcMensualBackend) => {
        const fecha = item.fecha;
        const producto = item.producto;
        const litros = Number(item.total_cantidad);
        const importeNeto = Number(item.total_importe);
        const metodoPago = item.metodo_pago;
        
        if (!ventasPorFecha.has(fecha)) {
          ventasPorFecha.set(fecha, {
            fecha,
            liquidos: {},
            otros: {},
            totalFacturado: 0,
          });
        }
        
        const ventaDia = ventasPorFecha.get(fecha)!;
        
        if (esLiquido(producto)) {
          // Para líquidos: separar por método de pago
          if (!ventaDia.liquidos[producto]) {
            ventaDia.liquidos[producto] = {
              ac: { litros: 0, importe: 0 },
              directos: { litros: 0, importe: 0 },
            };
          }
          
          if (esAxionCard(metodoPago)) {
            ventaDia.liquidos[producto].ac.litros += litros;
            ventaDia.liquidos[producto].ac.importe += importeNeto;
          } else {
            ventaDia.liquidos[producto].directos.litros += litros;
            ventaDia.liquidos[producto].directos.importe += importeNeto;
          }
          
          // Valor facturado = Neto + impuesto interno (21%)
          const valorFacturado = importeNeto * 1.21;
          ventaDia.totalFacturado += valorFacturado;
        } else {
          // Para otros productos: solo neto
          if (!ventaDia.otros[producto]) {
            ventaDia.otros[producto] = {
              litros: 0,
              importe: 0,
            };
          }
          
          ventaDia.otros[producto].litros += litros;
          ventaDia.otros[producto].importe += importeNeto;
          ventaDia.totalFacturado += importeNeto;
        }
      });
      
      // Convertir a array y ordenar por fecha
      const ventasArray = Array.from(ventasPorFecha.values()).sort((a, b) => 
        a.fecha.localeCompare(b.fecha)
      );
      
      setData(ventasArray);
    } catch (err) {
      setError('Error al cargar datos: ' + (err as Error).message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-blue-700 text-base font-medium animate-pulse">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-red-600 text-base font-medium">{error}</span>
      </div>
    );
  }

  // Obtener todos los productos líquidos únicos
  const productosLiquidosUnicos = new Set<string>();
  data.forEach(dia => {
    Object.keys(dia.liquidos).forEach(prod => productosLiquidosUnicos.add(prod));
  });
  const productosLiquidosArray = Array.from(productosLiquidosUnicos).sort();

  // Obtener todos los productos otros únicos
  const productosOtrosUnicos = new Set<string>();
  data.forEach(dia => {
    Object.keys(dia.otros).forEach(prod => productosOtrosUnicos.add(prod));
  });
  const productosOtrosArray = Array.from(productosOtrosUnicos).sort();

  // Calcular totales
  const totales = {
    liquidos: {} as Record<string, { ac: { litros: number; importe: number }; directos: { litros: number; importe: number } }>,
    otros: {} as Record<string, { litros: number; importe: number }>,
    totalFacturado: 0,
  };

  data.forEach(dia => {
    Object.keys(dia.liquidos).forEach(prod => {
      if (!totales.liquidos[prod]) {
        totales.liquidos[prod] = {
          ac: { litros: 0, importe: 0 },
          directos: { litros: 0, importe: 0 },
        };
      }
      totales.liquidos[prod].ac.litros += dia.liquidos[prod].ac.litros;
      totales.liquidos[prod].ac.importe += dia.liquidos[prod].ac.importe;
      totales.liquidos[prod].directos.litros += dia.liquidos[prod].directos.litros;
      totales.liquidos[prod].directos.importe += dia.liquidos[prod].directos.importe;
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

  return (
    <div className="py-6 px-2 md:px-6 min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Ventas Diarias
        </h1>

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
            </div>
          </div>
        )}

        {/* Tabla completa */}
        <div className="bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Detalle de Ventas Diarias</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-blue-900 text-sm min-w-[1200px]">
              <thead className="bg-blue-50 sticky top-0">
                <tr>
                  <th rowSpan={2} className="py-3 px-4 md:px-6 text-left font-semibold border border-blue-200">
                    Fecha
                  </th>
                  {productosLiquidosArray.length > 0 && (
                    <>
                      <th colSpan={productosLiquidosArray.length * 2} className="py-3 px-4 md:px-6 text-center font-semibold border border-blue-200 bg-blue-100">
                        Líquidos
                      </th>
                    </>
                  )}
                  {productosOtrosArray.length > 0 && (
                    <>
                      <th colSpan={productosOtrosArray.length} className="py-3 px-4 md:px-6 text-center font-semibold border border-blue-200 bg-blue-100">
                        Otros Productos
                      </th>
                    </>
                  )}
                  <th rowSpan={2} className="py-3 px-4 md:px-6 text-right font-semibold border border-blue-200">
                    Total Facturado
                  </th>
                </tr>
                <tr>
                  {productosLiquidosArray.map(prod => (
                    <React.Fragment key={prod}>
                      <th className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                        {prod}<br />AC (L)
                      </th>
                      <th className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                        {prod}<br />Directos (L)
                      </th>
                    </React.Fragment>
                  ))}
                  {productosOtrosArray.map(prod => (
                    <th key={prod} className="py-2 px-2 text-center font-semibold border border-blue-200 bg-blue-50 text-xs">
                      {prod}<br />(L)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={1 + productosLiquidosArray.length * 2 + productosOtrosArray.length + 1} 
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
                              {dia.liquidos[prod]?.ac.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                            </td>
                            <td className="py-3 px-2 text-right border border-blue-200">
                              {dia.liquidos[prod]?.directos.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                            </td>
                          </React.Fragment>
                        ))}
                        {productosOtrosArray.map(prod => (
                          <td key={prod} className="py-3 px-2 text-right border border-blue-200">
                            {dia.otros[prod]?.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                          </td>
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
                            {totales.liquidos[prod]?.ac.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                          </td>
                          <td className="py-3 px-2 text-right border border-blue-200">
                            {totales.liquidos[prod]?.directos.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                          </td>
                        </React.Fragment>
                      ))}
                      {productosOtrosArray.map(prod => (
                        <td key={prod} className="py-3 px-2 text-right border border-blue-200">
                          {totales.otros[prod]?.litros.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}
                        </td>
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
      </div>
    </div>
  );
};

export default VentasDiarias;

