import React, { useState, useEffect } from 'react';
import { fetchFacturacionDiariaLiquidos, fetchFacturacionDiariaGNC, fetchFacturacionDiariaOtros, fetchFacturacionDiariaShop } from '../api/facturacion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  fetchNivelesTanques,
  fetchTanqueHistorico,
  fetchTanqueHistoricoMes,
  NivelTanque,
  HistoricoTanqueDia
} from '../api/tanques';
import { 
  fetchCuentasACobrar, 
  fetchCuentasAPagar, 
  fetchStockValorizado,
  CuentasAging,
  StockValorizado
} from '../api/reportes';

import NivelesTanquesDashboard from '../components/NivelesTanquesDashboard';

interface Grupo {
  categoria: string;
  origen: string;
  litros: number;
  monto: number;
  promedio: number;
  fecha: string;
  metodo_pago?: string;
  nro_surtidor?: string;
}

interface Resumen {
  tipo: string;
  total_importe: number;
  total_cantidad: number;
  promedio_precio: number;
}



// Mapeo de categorías según lo que pide el cliente
const categoriaMap: Record<string, string> = {
  "NAFTA SUPER": "COMBUSTIBLES",
  "NAFTA PREMIUM": "COMBUSTIBLES",
  "DIESEL": "COMBUSTIBLES",
  "DIESEL PREMIUM": "COMBUSTIBLES",
  "GNC": "GNC",
  "LUBRICANTES": "LUBRICANTES",
  "ADBLUE": "ADBLUE",
  "SPOT": "SPOT",
  "BAR": "SPOT",
  "SHOP": "SHOP",
};

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inicio' | 'consumos'>('inicio');
  
  // Estados para tab Inicio
  // Totales y proyectados reales desde facturación diaria
  // Totales y proyectados unificados como en la tabla
  const [totalesFacturacion, setTotalesFacturacion] = useState({
    liquidos: 0,
    gnc: 0,
    complementos: 0,
    stop: 0,
    proyectadoLiquidos: 0,
    proyectadoGNC: 0,
    proyectadoComplementos: 0,
    proyectadoStop: 0,
    lastDate: '',
    diasDelMes: 0,
  });
  const [nivelesTanques, setNivelesTanques] = useState<NivelTanque[]>([]);
  const [cuentasACobrar, setCuentasACobrar] = useState<CuentasAging | null>(null);
  const [cuentasAPagar, setCuentasAPagar] = useState<CuentasAging | null>(null);
  const [stockValorizado, setStockValorizado] = useState<StockValorizado[]>([]);
  const [loadingInicio, setLoadingInicio] = useState(true);
  const [fechaMesInicio, setFechaMesInicio] = useState<string>('');
  
  // Estados para tab Consumos (existente)
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [resumenMensual, setResumenMensual] = useState<Resumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaMes, setFechaMes] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  // Cargar datos del tab Inicio
  const fetchInicioData = async () => {
    setLoadingInicio(true);
    try {
      // Obtener datos de facturación diaria para el mes actual
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = hoy.getMonth();
      const diasDelMes = new Date(year, month + 1, 0).getDate();
      const fechaInicio = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const fechaFin = `${year}-${String(month + 1).padStart(2, '0')}-${String(diasDelMes).padStart(2, '0')}`;

      const [liquidos, gnc, otros, shop] = await Promise.all([
        fetchFacturacionDiariaLiquidos(fechaInicio, fechaFin),
        fetchFacturacionDiariaGNC(fechaInicio, fechaFin),
        fetchFacturacionDiariaOtros(fechaInicio, fechaFin),
        fetchFacturacionDiariaShop(fechaInicio, fechaFin)
      ]);

      // Unificar datos por fecha como en la tabla
      type Row = { fecha: string; [key: string]: any };
      const rowMap: { [fecha: string]: Row } = {};
      const isCurrentMonth = (dateStr: string): boolean => {
        if (!dateStr) return false;
        const [yearS, monthS] = dateStr.split("T")[0].split("-");
        return Number(yearS) === year && Number(monthS) === month + 1;
      };
      const addRow = (row: any) => {
        if (!isCurrentMonth(row.fecha)) return;
        const [y, m, d] = row.fecha.split("T")[0].split("-");
        const key = `${d}-${m}`;
        if (!rowMap[key]) rowMap[key] = { fecha: key };
        Object.assign(rowMap[key], row);
      };
      liquidos.forEach(addRow);
      gnc.forEach(addRow);
      otros.forEach(addRow);
      shop.forEach(addRow);
      const rows: Row[] = Object.values(rowMap);
      const fechas = rows.map((r: Row) => r.fecha).sort();
      const lastDate = fechas.length > 0 ? fechas[fechas.length - 1] : '';

      // Totales y proyectados igual que la tabla
      const totalLiquidos = rows.reduce((acc: number, r: Row) => acc + (r.total_dinero_dia ?? 0), 0);
      const totalGNC = rows.reduce((acc: number, r: Row) => acc + (r.total_gnc_dinero ?? 0), 0);
      const totalComplementos = rows.reduce((acc: number, r: Row) => acc + (r.total_otros_dinero ?? 0), 0);
      const totalStop = rows.reduce((acc: number, r: Row) => acc + (r.total_venta_dia ?? 0), 0);

      setTotalesFacturacion({
        liquidos: totalLiquidos,
        gnc: totalGNC,
        complementos: totalComplementos,
        stop: totalStop,
        proyectadoLiquidos: totalLiquidos * diasDelMes,
        proyectadoGNC: totalGNC * diasDelMes,
        proyectadoComplementos: totalComplementos * diasDelMes,
        proyectadoStop: totalStop * diasDelMes,
        lastDate,
        diasDelMes
      });
      
      // Cargar niveles de tanques (histórico mensual si hay filtro de mes)
      let niveles: NivelTanque[] = [];
      niveles = await fetchNivelesTanques();
      setNivelesTanques(niveles);
      
      // Cargar cuentas a cobrar y pagar
      const cuentasCobrar = await fetchCuentasACobrar();
      setCuentasACobrar(cuentasCobrar);
      const cuentasPagar = await fetchCuentasAPagar();
      setCuentasAPagar(cuentasPagar);
      const stock = await fetchStockValorizado();
      setStockValorizado(stock);
    } catch (err) {
      console.error('Error al cargar datos de inicio:', err);
    }
      setLoadingInicio(false);
    };

  // Cargar datos del tab Consumos
  const fetchData = async () => {
    setLoading(true);
    try {
      let fechaInicio = "";
      let fechaFin = "";
      if (fechaMes) {
        fechaInicio = fechaMes.slice(0, 7) + "-01";
        const [anio, mes] = fechaMes.slice(0, 7).split("-");
        const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();
        fechaFin = `${anio}-${mes}-${ultimoDia}`;
      }

      // Eliminado fetchPcMensual y mapeo relacionado porque no se usa y causa error

      // Eliminado uso de 'mapped' porque ya no existe

      // const resumen = await fetchPcResumenMensual(fechaInicio, fechaFin);
      // setResumenMensual(resumen);
    } catch (err) {
      setError('Error al cargar datos: ' + (err as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'inicio') {
      fetchInicioData();
    } else {
      fetchData();
    }
  }, [activeTab, fechaMesInicio]);



  // Ya no agrupamos por estación, pasamos el array directo

  // Agrupar stock por ubicación
  const stockPorUbicacion = stockValorizado.reduce((acc, item) => {
    if (!acc[item.ubicacion]) acc[item.ubicacion] = 0;
    acc[item.ubicacion] += item.valor_stock;
    return acc;
  }, {} as Record<string, number>);

  if (loadingInicio && activeTab === 'inicio') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="text-blue-700 text-base font-medium animate-pulse">
          Cargando datos...
        </span>
      </div>
    );
  }

  if (loading && activeTab === 'consumos') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="text-blue-700 text-base font-medium animate-pulse">
          Cargando datos...
        </span>
      </div>
    );
  }

  if (error && activeTab === 'consumos') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="text-red-600 text-base font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-10 px-2 md:px-0">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="mb-6 border-b border-blue-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('inicio')}
              className={`px-6 py-3 font-semibold text-base transition ${
                activeTab === 'inicio'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-blue-400 hover:text-blue-600'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => setActiveTab('consumos')}
              className={`px-6 py-3 font-semibold text-base transition ${
                activeTab === 'consumos'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-blue-400 hover:text-blue-600'
              }`}
            >
              Consumos Mensuales
            </button>
          </div>
        </div>

        {activeTab === 'inicio' ? (
            <TabInicio
              totalesFacturacion={totalesFacturacion}
              nivelesTanques={nivelesTanques}
              cuentasACobrar={cuentasACobrar}
              cuentasAPagar={cuentasAPagar}
              stockPorUbicacion={stockPorUbicacion}
              fechaMesInicio={fechaMesInicio}
              setFechaMesInicio={setFechaMesInicio}
              fetchInicioData={fetchInicioData}
            />
        ) : (
          <TabConsumos
            grupos={grupos}
            resumenMensual={resumenMensual}
            fechaMes={fechaMes}
            setFechaMes={setFechaMes}
            categoriaFiltro={categoriaFiltro}
            setCategoriaFiltro={setCategoriaFiltro}
            fetchData={fetchData}
          />
        )}
      </div>
    </div>
  );
};

// Componente Tab Inicio
interface TabInicioProps {
  totalesFacturacion: {
    liquidos: number;
    gnc: number;
    complementos: number;
    stop: number;
    proyectadoLiquidos: number;
    proyectadoGNC: number;
    proyectadoComplementos: number;
    proyectadoStop: number;
    lastDate: string;
    diasDelMes: number;
  };
  nivelesTanques: NivelTanque[];
  cuentasACobrar: CuentasAging | null;
  cuentasAPagar: CuentasAging | null;
  stockPorUbicacion: Record<string, number>;
  fechaMesInicio: string;
  setFechaMesInicio: (value: string) => void;
  fetchInicioData: () => void;
}

const TabInicio: React.FC<TabInicioProps> = ({
  totalesFacturacion,
  nivelesTanques,
  cuentasACobrar,
  cuentasAPagar,
  stockPorUbicacion,
  fechaMesInicio,
  setFechaMesInicio,
  fetchInicioData,
}) => {
  const hoy = new Date();
  let mesTitulo: string;
  
  if (fechaMesInicio) {
    const [anio, mes] = fechaMesInicio.slice(0, 7).split("-");
    const fecha = new Date(Number(anio), Number(mes) - 1, 1);
    mesTitulo = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    mesTitulo = mesTitulo.charAt(0).toUpperCase() + mesTitulo.slice(1);
  } else {
    const mesActual = hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    mesTitulo = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
  }

  const handleBuscar = () => fetchInicioData();
  const handleLimpiar = () => {
    setFechaMesInicio('');
    fetchInicioData();
  };

  return (
    <div className="space-y-6">
      {/* Filtro de mes eliminado */}

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
        Proyectados {mesTitulo}
      </h1>

      {/* Sección Totales - solo total y fecha (año, mes, día) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Líquidos */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl shadow-lg p-7 flex flex-col items-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2 tracking-wide uppercase">Líquidos</h3>
          <span className="font-extrabold text-blue-900 text-xl md:text-2xl mb-1 text-center">
            {totalesFacturacion.liquidos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-blue-700 font-medium mt-1">{(() => {
            if (!totalesFacturacion.lastDate) return '';
            let dateStr = totalesFacturacion.lastDate;
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let y = new Date().getFullYear();
            let m = '';
            let d = '';
            if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              const [yy, mm, dd] = dateStr.split('-');
              y = Number(yy);
              m = mm;
              d = dd;
            } else if (/\d{2}-\d{2}/.test(dateStr)) {
              [d, m] = dateStr.split('-');
            }
            return `Hasta el día ${y}/${m}/${d}`;
          })()}</span>
        </div>
        {/* GNC */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl shadow-lg p-7 flex flex-col items-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2 tracking-wide uppercase">GNC</h3>
          <span className="font-extrabold text-blue-900 text-xl md:text-2xl mb-1 text-center">
            {totalesFacturacion.gnc.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-blue-700 font-medium mt-1">{(() => {
            if (!totalesFacturacion.lastDate) return '';
            let dateStr = totalesFacturacion.lastDate;
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let y = new Date().getFullYear();
            let m = '';
            let d = '';
            if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              const [yy, mm, dd] = dateStr.split('-');
              y = Number(yy);
              m = mm;
              d = dd;
            } else if (/\d{2}-\d{2}/.test(dateStr)) {
              [d, m] = dateStr.split('-');
            }
            return `Hasta el día ${y}/${m}/${d}`;
          })()}</span>
        </div>
        {/* Complementos */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl shadow-lg p-7 flex flex-col items-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2 tracking-wide uppercase">Complementos</h3>
          <span className="font-extrabold text-blue-900 text-xl md:text-2xl mb-1 text-center">
            {totalesFacturacion.complementos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-blue-700 font-medium mt-1">{(() => {
            if (!totalesFacturacion.lastDate) return '';
            let dateStr = totalesFacturacion.lastDate;
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let y = new Date().getFullYear();
            let m = '';
            let d = '';
            if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              const [yy, mm, dd] = dateStr.split('-');
              y = Number(yy);
              m = mm;
              d = dd;
            } else if (/\d{2}-\d{2}/.test(dateStr)) {
              [d, m] = dateStr.split('-');
            }
            return `Hasta el día ${y}/${m}/${d}`;
          })()}</span>
        </div>
        {/* Stop */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl shadow-lg p-7 flex flex-col items-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2 tracking-wide uppercase">Stop</h3>
        <span className="font-extrabold text-blue-900 text-xl md:text-2xl mb-1 text-center">
            {totalesFacturacion.stop.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-blue-700 font-medium mt-1">{(() => {
            if (!totalesFacturacion.lastDate) return '';
            let dateStr = totalesFacturacion.lastDate;
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let y = new Date().getFullYear();
            let m = '';
            let d = '';
            if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              const [yy, mm, dd] = dateStr.split('-');
              y = Number(yy);
              m = mm;
              d = dd;
            } else if (/\d{2}-\d{2}/.test(dateStr)) {
              [d, m] = dateStr.split('-');
            }
            return `Hasta el día ${y}/${m}/${d}`;
          })()}</span>
        </div>
      </div>

      {/* Sección Niveles de Tanques */}
      <NivelesTanquesDashboard tanques={nivelesTanques} />

      {/* Sección Cuentas a Cobrar, Cuentas a Pagar y Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cuentas a Cobrar */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Cuentas a cobrar</h3>
          {cuentasACobrar ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-800">Vencido</span>
                <span className="font-semibold text-red-600">
                  ${cuentasACobrar.vencido.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">a día</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasACobrar.a_dia.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">5 días</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasACobrar.cinco_dias.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">15 días</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasACobrar.quince_dias.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">30 días o más</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasACobrar.treinta_dias_o_mas.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Cargando...</span>
          )}
        </div>

        {/* Cuentas a Pagar */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Cuentas a pagar</h3>
          {cuentasAPagar ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-800">Vencido</span>
                <span className="font-semibold text-red-600">
                  ${cuentasAPagar.vencido.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">a día</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasAPagar.a_dia.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">5 días</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasAPagar.cinco_dias.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">15 días</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasAPagar.quince_dias.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">30 días o más</span>
                <span className="font-semibold text-blue-900">
                  ${cuentasAPagar.treinta_dias_o_mas.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Cargando...</span>
          )}
        </div>

        {/* Stock */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Stock</h3>
          <div className="space-y-2">
            {Object.entries(stockPorUbicacion).map(([ubicacion, valor]) => (
              <div key={ubicacion} className="flex justify-between">
                <span className="text-blue-800">{ubicacion}</span>
                <span className="font-semibold text-blue-900">
                  ${valor.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
            {Object.keys(stockPorUbicacion).length === 0 && (
              <span className="text-gray-500 text-sm">No hay datos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Tab Consumos (existente)
interface TabConsumosProps {
  grupos: Grupo[];
  resumenMensual: Resumen[];
  fechaMes: string;
  setFechaMes: (value: string) => void;
  categoriaFiltro: string;
  setCategoriaFiltro: (value: string) => void;
  fetchData: () => void;
}

const TabConsumos: React.FC<TabConsumosProps> = ({
  grupos,
  resumenMensual,
  fechaMes,
  setFechaMes,
  categoriaFiltro,
  setCategoriaFiltro,
  fetchData,
}) => {
  // Eliminar filtro por fechas: mostrar todos los datos
  const categorias = Array.from(new Set(grupos.map(g => g.categoria)));
  const gruposFiltrados = grupos.filter(g => {
    if (categoriaFiltro && g.categoria !== categoriaFiltro) return false;
    return true;
  });

  const resumenPorCategoria = categorias.map(cat => {
    const items = gruposFiltrados.filter(g => g.categoria === cat);
    const litros = items.reduce((a, b) => a + b.litros, 0);
    const monto = items.reduce((a, b) => a + b.monto, 0);
    const promedio = monto / (litros || 1);
    return { categoria: cat, litros, monto, promedio };
  });

  const totalLitros = gruposFiltrados.reduce((a, b) => a + b.litros, 0);
  const totalMonto = gruposFiltrados.reduce((a, b) => a + b.monto, 0);
  const totalPromedio = totalMonto / (totalLitros || 1);

  const gruposPorMes: Record<string, Grupo[]> = {};
  grupos.forEach(g => {
    const mes = g.fecha.slice(0, 7);
    if (!gruposPorMes[mes]) gruposPorMes[mes] = [];
    gruposPorMes[mes].push(g);
  });
  const meses = Object.keys(gruposPorMes).sort((a, b) => b.localeCompare(a));

  const handleBuscar = () => fetchData();
  const handleLimpiar = () => {
    setFechaMes('');
    setCategoriaFiltro('');
    fetchData();
  };


  // Cards de Proyectados (mes en curso) y Año en curso
  // Calcular totales proyectados del mes en curso
  const hoy = new Date();
  const mesActual = hoy.toISOString().slice(0, 7);
  const anioActual = hoy.getFullYear();
  const gruposMesActual = grupos.filter(g => g.fecha.startsWith(mesActual));
  const gruposAnioActual = grupos.filter(g => g.fecha.startsWith(anioActual.toString()));
  const totalMontoMesActual = gruposMesActual.reduce((a, b) => a + b.monto, 0);
  const totalMontoAnioActual = gruposAnioActual.reduce((a, b) => a + b.monto, 0);

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
          Dashboard de Consumos Mensuales
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card title="Proyectado (Mes en curso)" value={`$${totalMontoMesActual.toLocaleString()}`} />
        <Card title="Total Año en curso" value={`$${totalMontoAnioActual.toLocaleString()}`} />
      </div>

        {/* Filtro de categoría eliminado */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card title="Total litros" value={`${totalLitros.toLocaleString()} L`} />
        <Card title="Total monto" value={`$${totalMonto.toLocaleString()}`} />
        <Card title="Promedio por litro" value={`$${Number(totalPromedio).toFixed(2)}`} />
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl shadow w-full mb-10">
        <div className="px-8 pt-6 pb-3">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Resumen mensual consolidado</h2>
        </div>
        <table className="w-full text-blue-900 text-base">
          <thead className="bg-blue-50">
            <tr>
              <th className="py-3 px-6 text-left font-semibold">Tipo</th>
              <th className="py-3 px-6 text-right font-semibold">Litros</th>
              <th className="py-3 px-6 text-right font-semibold">Importe</th>
              <th className="py-3 px-6 text-right font-semibold">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {resumenMensual.map((r, i) => (
              <tr key={i} className="border-t border-blue-100 hover:bg-blue-50 transition">
                <td className="py-3 px-6 font-semibold">{r.tipo.toUpperCase()}</td>
                <td className="py-3 px-6 text-right">{r.total_cantidad.toLocaleString()}</td>
                <td className="py-3 px-6 text-right">${r.total_importe.toLocaleString()}</td>
                <td className="py-3 px-6 text-right">${r.promedio_precio.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl shadow mb-10">
        <div className="px-8 pt-6 pb-3">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Resumen por Categoría</h2>
        </div>
        <table className="w-full text-blue-900 text-base">
          <thead className="bg-blue-50">
            <tr>
              <th className="py-3 px-6 text-left font-semibold">Categoría</th>
              <th className="py-3 px-6 text-right font-semibold">Litros</th>
              <th className="py-3 px-6 text-right font-semibold">Monto</th>
              <th className="py-3 px-6 text-right font-semibold">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {resumenPorCategoria.map(r => (
              <tr key={r.categoria} className="border-t border-blue-100 hover:bg-blue-50 transition">
                <td className="py-3 px-6">{r.categoria}</td>
                <td className="py-3 px-6 text-right">{r.litros.toLocaleString()}</td>
                <td className="py-3 px-6 text-right">${r.monto.toLocaleString()}</td>
                <td className="py-3 px-6 text-right">${r.promedio.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-12">
        {meses.map(mes => {
          const gruposMes = gruposPorMes[mes];
          const categoriasMes = Array.from(new Set(gruposMes.map(g => g.categoria)));
          const resumenPorCategoria = categoriasMes.map(cat => {
            const items = gruposMes.filter(g => g.categoria === cat);
            const litros = items.reduce((a, b) => a + b.litros, 0);
            const monto = items.reduce((a, b) => a + b.monto, 0);
            const metodos = Array.from(new Set(items.map(i => i.metodo_pago).filter(Boolean)));
            const surtidores = Array.from(new Set(items.map(i => i.nro_surtidor).filter(Boolean)));
            return {
              categoria: cat,
              litros,
              monto,
              metodo_pago: metodos.length === 1 ? metodos[0] : (metodos.length === 0 ? "-" : "Varios"),
              nro_surtidor: surtidores.length === 1 ? surtidores[0] : (surtidores.length === 0 ? "-" : "Varios")
            };
          });
          const totalMes = gruposMes.reduce((a, b) => a + b.monto, 0);
          const litrosMes = gruposMes.reduce((a, b) => a + b.litros, 0);

          return (
            <div key={mes} className="bg-white shadow rounded-xl border border-blue-100 mb-8">
              <div className="flex justify-between items-center px-8 py-4 bg-blue-50 border-b border-blue-100 rounded-t-xl">
                <span className="text-blue-900 font-bold text-lg">
                  {new Date(mes + "-01").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                </span>
                <span className="font-bold text-blue-900 text-base">
                  Total: <span className="text-green-700">${totalMes.toLocaleString("es-AR")}</span> |{" "}
                  <span className="text-blue-700">{litrosMes.toLocaleString("es-AR")} litros</span>
                </span>
              </div>
              <table className="w-full text-blue-900 text-base">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="py-3 px-6 text-left font-semibold">Categoría</th>
                    <th className="py-3 px-6 text-right font-semibold">Litros</th>
                    <th className="py-3 px-6 text-right font-semibold">Monto</th>
                    <th className="py-3 px-6 text-right font-semibold">Método de Pago</th>
                    <th className="py-3 px-6 text-right font-semibold">Nro Surtidor</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenPorCategoria.map(r => (
                    <tr key={r.categoria} className="border-t border-blue-50 hover:bg-blue-50 transition">
                      <td className="py-3 px-6">{r.categoria}</td>
                      <td className="py-3 px-6 text-right">{r.litros.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right">${r.monto.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right">{r.metodo_pago}</td>
                      <td className="py-3 px-6 text-right">{r.nro_surtidor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl shadow w-full mb-10 p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Comparativo mensual</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={meses.map(mes => {
              const gruposMes = gruposPorMes[mes];
              return {
                mes: new Date(mes + "-01").toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                monto: gruposMes.reduce((a, b) => a + b.monto, 0),
                litros: gruposMes.reduce((a, b) => a + b.litros, 0),
              };
            }).reverse()}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="monto" name="Importe ($)" fill="#1e3a8a" />
            <Bar dataKey="litros" name="Litros" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Card Component
const Card = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white border border-blue-100 rounded-2xl shadow flex flex-col items-center py-7 px-4 w-full">
    <span className="text-base font-semibold text-blue-700 mb-1">{title}</span>
    <span className="text-3xl font-extrabold text-blue-900">{value}</span>
  </div>
);

export default Dashboard;
