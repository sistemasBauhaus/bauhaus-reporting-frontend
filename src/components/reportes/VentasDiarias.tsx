import FacturacionDiariaOtrosTable from './TablasFacturacion/FacturacionDiariaOtrosTable';
import FacturacionDiariaGncTable from './TablasFacturacion/FacturacionDiariaGncTable';
import FacturacionDiariaLiquidosTable from './TablasFacturacion/FacturacionDiariaLiquidosTable';
import FacturacionDiariaShopTable from './TablasFacturacion/FacturacionDiariaShopTable';
import FacturacionDiariaClienteTable from './TablasFacturacion/FacturacionDiariaClienteTable';
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { fetchReporteSubdiario, fetchFacturasVentaAC, RegistroSubdiario, FacturaVenta } from '../../api/reportes';



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

const VentasDiarias: React.FC = () => {
    useEffect(() => {
      setLoading(false);
    }, []);
  const [dataAC, setDataAC] = useState<VentaDiariaAC[]>([]);
  const [dataDirectos, setDataDirectos] = useState<VentaDiariaDirectos[]>([]);
  // Estado para pestañas
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);








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
          <div className="w-full flex justify-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 text-center">
              Ventas Diarias
            </h1>
          </div>
         
        </div>

        {/* Mensaje de advertencia si hay datos mock */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <p className="text-yellow-800 text-sm font-medium">{error}</p>
          </div>
        )}




        {/* Tabs para mostrar solo una tabla a la vez */}
        <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 4 }}>
          <Tabs
            value={tabIndex}
            onChange={(e, v) => setTabIndex(v)}
            centered
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 56,
              '.MuiTabs-indicator': {
                height: 5,
                borderRadius: 2,
                backgroundColor: '#1976d2',
              },
            }}
          >
            <Tab label="Líquidos" sx={{ fontWeight: 'bold', fontSize: 14, minHeight: 56, py: 2 }} />
            <Tab label="GNC" sx={{ fontWeight: 'bold', fontSize: 14, minHeight: 56, py: 2 }} />
            <Tab label="Otros" sx={{ fontWeight: 'bold', fontSize: 14, minHeight: 56, py: 2 }} />
            <Tab label="Shop" sx={{ fontWeight: 'bold', fontSize: 14, minHeight: 56, py: 2 }} />
            <Tab label="Cliente" sx={{ fontWeight: 'bold', fontSize: 14, minHeight: 56, py: 2 }} />
          </Tabs>
        </Box>
        {tabIndex === 0 && <FacturacionDiariaLiquidosTable />}
        {tabIndex === 1 && <FacturacionDiariaGncTable />}
        {tabIndex === 2 && <FacturacionDiariaOtrosTable />}
        {tabIndex === 3 && <FacturacionDiariaShopTable />}
        {tabIndex === 4 && <FacturacionDiariaClienteTable />}

        {/* Tabla AC 
        {renderTabla(
          'Ventas con Axion Card (AC)',
          dataAC,
          datosAC.productosLiquidosArray,
          datosAC.productosOtrosArray,
          datosAC.totales
        )}
          */}

        {/* Tabla Directos 
        {renderTabla(
          'Ventas Directas',
          dataDirectos,
          datosDirectos.productosLiquidosArray,
          datosDirectos.productosOtrosArray,
          datosDirectos.totales
        )}
          */}
      </div>
    </div>
  );
};

export default VentasDiarias;

