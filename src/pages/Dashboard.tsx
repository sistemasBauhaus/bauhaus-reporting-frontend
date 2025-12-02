import React, { useState, useEffect } from 'react';
import { fetchPcMensual, fetchPcResumenMensual } from '../api/pcMensual';
import { 
  fetchNivelesTanques,
  NivelTanque
} from '../api/tanques';
import { 
  fetchCuentasACobrar, 
  fetchCuentasAPagar, 
  fetchStockValorizado,
  CuentasAging,
  StockValorizado
} from '../api/reportes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

interface Proyectado {
  categoria: string;
  producto: string;
  monto: number;
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
  const [proyectados, setProyectados] = useState<Proyectado[]>([]);
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
      // Calcular proyectados
      let hoy: Date;
      let primerDiaMes: Date;
      let ultimoDiaMes: Date;
      let diasTranscurridos: number;
      
      if (fechaMesInicio) {
        // Usar el mes seleccionado
        const [anio, mes] = fechaMesInicio.slice(0, 7).split("-");
        primerDiaMes = new Date(Number(anio), Number(mes) - 1, 1);
        ultimoDiaMes = new Date(Number(anio), Number(mes), 0);
        hoy = new Date(); // Usar hoy para calcular días transcurridos
        const diaActual = hoy.getDate();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        
        // Si el mes seleccionado es el mes actual, usar días transcurridos
        if (Number(mes) === mesActual && Number(anio) === anioActual) {
          diasTranscurridos = diaActual;
        } else {
          // Si es un mes pasado, usar todos los días del mes
          diasTranscurridos = ultimoDiaMes.getDate();
        }
      } else {
        // Usar mes actual por defecto
        hoy = new Date();
        primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        diasTranscurridos = hoy.getDate();
      }
      
      const diasDelMes = ultimoDiaMes.getDate();
      const fechaInicio = primerDiaMes.toISOString().split('T')[0];
      const fechaFin = fechaMesInicio 
        ? ultimoDiaMes.toISOString().split('T')[0]
        : hoy.toISOString().split('T')[0];
      
      const data = await fetchPcMensual(fechaInicio, fechaFin);
      
      // Calcular proyectados: suma ventas / días transcurridos * días del mes
      const ventasPorProducto = new Map<string, number>();
      data.forEach(item => {
        const key = item.producto;
        const monto = Number(item.total_importe);
        ventasPorProducto.set(key, (ventasPorProducto.get(key) || 0) + monto);
      });
      
      const proyectadosCalculados: Proyectado[] = [];
      ventasPorProducto.forEach((monto, producto) => {
        const sumaVentas = monto;
        // Proyectado = suma de ventas / días del mes transcurrido * cantidad de días del mes
        const proyectado = diasTranscurridos > 0 
          ? (sumaVentas / diasTranscurridos) * diasDelMes 
          : sumaVentas; // Si no hay días transcurridos, usar el monto actual
        proyectadosCalculados.push({
          categoria: categoriaMap[producto.toUpperCase()] || 'OTROS',
          producto,
          monto: Math.round(proyectado * 100) / 100, // Redondear a 2 decimales
        });
      });
      setProyectados(proyectadosCalculados);
      
      // Cargar niveles de tanques
      const niveles = await fetchNivelesTanques();
      setNivelesTanques(niveles);
      
      // Cargar cuentas a cobrar y pagar
      const cuentasCobrar = await fetchCuentasACobrar();
      setCuentasACobrar(cuentasCobrar);
      
      const cuentasPagar = await fetchCuentasAPagar();
      setCuentasAPagar(cuentasPagar);
      
      // Cargar stock valorizado
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

      const data = await fetchPcMensual(fechaInicio, fechaFin);
      const mapped = data.map(item => ({
        categoria: categoriaMap[item.categoria.toUpperCase()] || item.categoria,
        origen: item.producto,
        fecha: item.fecha,
        litros: Number(item.total_cantidad),
        monto: Number(item.total_importe),
        promedio: Number(item.total_cantidad) > 0 ? Number(item.total_importe) / Number(item.total_cantidad) : 0,
        metodo_pago: item.metodo_pago,
        nro_surtidor: item.nro_surtidor,
      }));
      setGrupos(mapped);

      if (!fechaMes && mapped.length > 0) {
        const fechas = mapped.map(g => g.fecha).sort().reverse();
        setFechaMes(fechas[0].slice(0, 7) + "-01");
      }

      const resumen = await fetchPcResumenMensual(fechaInicio, fechaFin);
      setResumenMensual(resumen);
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

  // Agrupar proyectados por categoría
  const proyectadosPorCategoria = {
    liquidos: proyectados.filter(p => {
      const prodUpper = p.producto.toUpperCase();
      return prodUpper.includes('DIESEL') || 
             prodUpper.includes('NAFTA') || 
             prodUpper.includes('QUANTUM') || 
             prodUpper.includes('QUANTIUM') ||
             prodUpper.includes('FUEL OIL') ||
             p.categoria === 'COMBUSTIBLES';
    }),
    gnc: proyectados.filter(p => {
      const prodUpper = p.producto.toUpperCase();
      return p.categoria === 'GNC' || 
             prodUpper.includes('GNC') ||
             prodUpper.includes('AL CAUDAL');
    }),
    complementos: proyectados.filter(p => {
      const prodUpper = p.producto.toUpperCase();
      return prodUpper.includes('LUBRICANT') || 
             prodUpper.includes('LUBICANT') ||
             prodUpper.includes('ADBLUE') || 
             prodUpper.includes('AD BLUE') ||
             p.categoria === 'LUBRICANTES' ||
             p.categoria === 'ADBLUE';
    }),
    shop: proyectados.filter(p => {
      const prodUpper = p.producto.toUpperCase();
      return p.categoria === 'SHOP' || 
             prodUpper.includes('SHOP') ||
             prodUpper.includes('SPOT') ||
             prodUpper.includes('BAR');
    }),
  };

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
              proyectadosPorCategoria={proyectadosPorCategoria}
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
  proyectadosPorCategoria: {
    liquidos: Proyectado[];
    gnc: Proyectado[];
    complementos: Proyectado[];
    shop: Proyectado[];
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
  proyectadosPorCategoria,
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
      {/* Filtro de Mes */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Mes</label>
          <input
            type="month"
            value={fechaMesInicio.slice(0, 7)}
            onChange={e => setFechaMesInicio(e.target.value + "-01")}
            className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex gap-2 mt-6 md:mt-8">
          <button onClick={handleBuscar} className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-base">
            Buscar
          </button>
          <button onClick={handleLimpiar} className="bg-gray-100 hover:bg-gray-200 transition text-blue-900 px-5 py-2 rounded font-semibold shadow text-base">
            Limpiar
          </button>
        </div>
      </div>

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
        Proyectados {mesTitulo}
      </h1>

      {/* Sección Proyectados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Líquidos */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Líquidos</h3>
          <div className="space-y-2">
            {proyectadosPorCategoria.liquidos.map((p, i) => (
              <div key={i} className="flex justify-center">
                <span className="text-blue-800">{p.producto}</span>
                <span className="font-semibold text-blue-900">
                  ${p.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
            {proyectadosPorCategoria.liquidos.length === 0 && (
              <span className="text-gray-500 text-sm">No hay datos</span>
            )}
          </div>
        </div>

        {/* GNC */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">GNC</h3>
          <div className="space-y-2">
            {proyectadosPorCategoria.gnc.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-blue-800">{p.producto}</span>
                <span className="font-semibold text-blue-900">
                  ${p.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
            {proyectadosPorCategoria.gnc.length === 0 && (
              <span className="text-gray-500 text-sm">No hay datos</span>
            )}
          </div>
        </div>

        {/* Complementos */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Complementos</h3>
          <div className="space-y-2">
            {proyectadosPorCategoria.complementos.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-blue-800">{p.producto}</span>
                <span className="font-semibold text-blue-900">
                  ${p.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
            {proyectadosPorCategoria.complementos.length === 0 && (
              <span className="text-gray-500 text-sm">No hay datos</span>
            )}
          </div>
        </div>

        {/* Shop */}
        <div className="bg-white border border-blue-200 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Shop</h3>
          <div className="space-y-2">
            {proyectadosPorCategoria.shop.length > 0 ? (
              proyectadosPorCategoria.shop.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-blue-800">{p.producto}</span>
                  <span className="font-semibold text-blue-900">
                    ${p.monto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No hay datos</span>
            )}
          </div>
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
  const categorias = Array.from(new Set(grupos.map(g => g.categoria)));
  const gruposFiltrados = grupos.filter(g => {
    if (categoriaFiltro && g.categoria !== categoriaFiltro) return false;
    if (fechaMes) {
      const mesFiltro = fechaMes.slice(0, 7);
      if (!g.fecha.startsWith(mesFiltro)) return false;
    }
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

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
          Dashboard de Consumos Mensuales
        </h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-10 justify-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Mes</label>
          <input
            type="month"
            value={fechaMes.slice(0, 7)}
            onChange={e => setFechaMes(e.target.value + "-01")}
            className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-blue-900 font-semibold mb-1">Categoría</label>
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Todas</option>
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex gap-2 mt-6 md:mt-8">
          <button onClick={handleBuscar} className="bg-blue-700 hover:bg-blue-800 transition text-white px-5 py-2 rounded font-semibold shadow text-base">
            Buscar
          </button>
          <button onClick={handleLimpiar} className="bg-gray-100 hover:bg-gray-200 transition text-blue-900 px-5 py-2 rounded font-semibold shadow text-base">
            Limpiar
          </button>
        </div>
      </div>

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
