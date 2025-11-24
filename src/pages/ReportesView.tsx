import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VentasPorProducto from '../components/reportes/VentasPorProducto';
import NivelesTanques from '../components/reportes/NivelesTanques';
import SaldosCuentasCorrientes from '../components/reportes/SaldosCuentasCorrientes';
import ComprasDiscriminadas from '../components/reportes/ComprasDiscriminadas';
import FacturasProveedoresPendientes from '../components/reportes/FacturasProveedoresPendientes';
import UnidadesEmpresa from '../components/reportes/UnidadesEmpresa';

const ReportesView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tipoReporte = searchParams.get('tipo') || 'ventas-producto';
  
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFechaInicio(firstDay.toISOString().split('T')[0]);
    setFechaFin(today.toISOString().split('T')[0]);
  }, []);

  const renderReporte = () => {
    switch (tipoReporte) {
      case 'ventas-producto':
        return <VentasPorProducto fechaInicio={fechaInicio} fechaFin={fechaFin} onFechaChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); }} />;
      case 'niveles-tanques':
        return <NivelesTanques fechaInicio={fechaInicio} fechaFin={fechaFin} onFechaChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); }} />;
      case 'saldos-cuentas':
        return <SaldosCuentasCorrientes fechaInicio={fechaInicio} fechaFin={fechaFin} onFechaChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); }} />;
      case 'compras-discriminadas':
        return <ComprasDiscriminadas fechaInicio={fechaInicio} fechaFin={fechaFin} onFechaChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); }} />;
      case 'facturas-proveedores':
        return <FacturasProveedoresPendientes fechaInicio={fechaInicio} fechaFin={fechaFin} onFechaChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); }} />;
      case 'unidades-empresa':
        return <UnidadesEmpresa fechaInicio={fechaInicio} fechaFin={fechaFin} onFechaChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); }} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-blue-900 mb-4">Reporte no encontrado</h1>
              <p className="text-gray-600">El tipo de reporte especificado no existe.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      {/* Filtro de fecha compartido */}
      <div className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-wrap gap-4 items-end justify-center">
            <div>
              <label className="block text-blue-900 font-semibold mb-1 text-sm">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-1 text-sm">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="border border-blue-200 rounded px-3 py-2 text-blue-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <button
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setFechaInicio(firstDay.toISOString().split('T')[0]);
                  setFechaFin(today.toISOString().split('T')[0]);
                }}
                className="bg-gray-100 hover:bg-gray-200 transition text-blue-900 px-4 py-2 rounded font-semibold shadow text-sm"
              >
                Mes Actual
              </button>
            </div>
          </div>
        </div>
      </div>
      {renderReporte()}
    </div>
  );
};

export default ReportesView;

