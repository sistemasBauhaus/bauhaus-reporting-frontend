import React, { useState, useEffect } from 'react';
import {
  convertirImporte,
  SaldoCuentaCorrienteConSaldo,
  ClienteConDeudaPendiente,
  RemitoPendienteFacturar,
} from '../../api/reportes';

interface SaldosCuentasCorrientesProps {
  fechaInicio?: string;
  fechaFin?: string;
  onFechaChange?: (inicio: string, fin: string) => void;
}

const SaldosCuentasCorrientes: React.FC<SaldosCuentasCorrientesProps> = ({
  fechaInicio: propFechaInicio,
  fechaFin: propFechaFin,
  onFechaChange,
}) => {
  const [saldos, setSaldos] = useState<SaldoCuentaCorrienteConSaldo[]>([]);
  const [clientesDeuda, setClientesDeuda] = useState<ClienteConDeudaPendiente[]>([]);
  const [remitosPendientes, setRemitosPendientes] = useState<RemitoPendienteFacturar[]>([]);
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
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Convertir fechas al formato YYYYMMDD requerido por los endpoints
      const convertirFecha = (fecha: string): string => {
        if (/^\d{8}$/.test(fecha)) return fecha;
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha.replace(/-/g, '');
        }
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

      // Obtener facturas y recibos en paralelo
      const [responseFacturas, responseRecibos] = await Promise.all([
        fetch(`${API_URL}/Facturacion/GetFacturasVenta?${params.toString()}`, {
          method: 'GET',
          headers: headers
        }),
        fetch(`${API_URL}/CtaCte/GetRecibosEntreFechas?${params.toString()}`, {
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

      // ===== GRILLA 1: Saldos de cuentas corrientes que no sean = cero =====
      // Calcular saldos por cliente: Suma de Facturas - Suma de Recibos
      const saldosPorCliente = new Map<string, { nombre_cliente: string; saldo: number; ultima_actualizacion: string }>();

      // Sumar facturas (debe)
      facturasData.forEach((factura: any) => {
        const nombreCliente = factura.NombreCliente || factura.nombreCliente || factura.Cliente || factura.cliente || 'Sin cliente';
        const montoTotal = convertirImporte(Number(factura.MontoTotal || factura.montoTotal || factura.Monto || factura.monto || 0));
        const fecha = factura.FechaEmision || factura.fechaEmision || factura.Fecha || factura.fecha || new Date().toISOString();

        if (!saldosPorCliente.has(nombreCliente)) {
          saldosPorCliente.set(nombreCliente, {
            nombre_cliente: nombreCliente,
            saldo: 0,
            ultima_actualizacion: fecha,
          });
        }

        const cliente = saldosPorCliente.get(nombreCliente)!;
        cliente.saldo += montoTotal; // Sumar facturas (debe)

        if (new Date(fecha) > new Date(cliente.ultima_actualizacion)) {
          cliente.ultima_actualizacion = fecha;
        }
      });

      // Restar recibos (haber)
      recibosData.forEach((recibo: any) => {
        const nombreCliente = recibo.NombreCliente || recibo.nombreCliente || recibo.Cliente || recibo.cliente || 'Sin cliente';
        const monto = convertirImporte(Number(recibo.Monto || recibo.monto || recibo.Importe || recibo.importe || 0));
        const fecha = recibo.FechaEmision || recibo.fechaEmision || recibo.Fecha || recibo.fecha || new Date().toISOString();

        if (!saldosPorCliente.has(nombreCliente)) {
          saldosPorCliente.set(nombreCliente, {
            nombre_cliente: nombreCliente,
            saldo: 0,
            ultima_actualizacion: fecha,
          });
        }

        const cliente = saldosPorCliente.get(nombreCliente)!;
        cliente.saldo -= monto; // Restar recibos (haber)

        if (new Date(fecha) > new Date(cliente.ultima_actualizacion)) {
          cliente.ultima_actualizacion = fecha;
        }
      });

      // Convertir saldos a array (solo los que tienen saldo != 0)
      let clienteId = 1;
      const saldosData: SaldoCuentaCorrienteConSaldo[] = Array.from(saldosPorCliente.values())
        .filter(cliente => cliente.saldo !== 0)
        .map(cliente => ({
          cliente_id: clienteId++,
          nombre_cliente: cliente.nombre_cliente,
          saldo: cliente.saldo,
          ultima_actualizacion: cliente.ultima_actualizacion,
        }));

      // ===== GRILLA 2: Clientes con deuda pendiente de cobro =====
      // Mapear recibos por factura para calcular qué facturas están pendientes
      const recibosPorFactura = new Map<string, number>();
      recibosData.forEach((recibo: any) => {
        const facturaId = recibo.factura_id || recibo.FacturaId || recibo.IdFactura || recibo.idFactura || '';
        const monto = convertirImporte(Number(recibo.Monto || recibo.monto || recibo.Importe || recibo.importe || 0));
        if (facturaId) {
          recibosPorFactura.set(facturaId.toString(), (recibosPorFactura.get(facturaId.toString()) || 0) + monto);
        }
      });

      const clientesConDeuda = new Map<string, { facturas: any[] }>();
      const hoy = new Date();

      facturasData.forEach((factura: any) => {
        const cliente = factura.NombreCliente || factura.nombreCliente || factura.Cliente || factura.cliente || 'Sin cliente';
        const facturaId = factura.IdFactura || factura.idFactura || factura.NumeroFactura || factura.numeroFactura || '';
        const numeroFactura = factura.NumeroFactura || factura.numeroFactura || facturaId.toString();
        const fechaEmision = factura.FechaEmision || factura.fechaEmision || factura.Fecha || factura.fecha || new Date().toISOString();
        const fechaVencimiento = factura.FechaVencimiento || factura.fecha_vencimiento || 
          new Date(new Date(fechaEmision).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const montoTotal = convertirImporte(Number(factura.MontoTotal || factura.montoTotal || factura.Monto || factura.monto || 0));
        const importePagado = recibosPorFactura.get(facturaId.toString()) || 0;
        const importePendiente = montoTotal - importePagado;

        // Solo incluir facturas con saldo pendiente
        if (importePendiente > 0) {
          if (!clientesConDeuda.has(cliente)) {
            clientesConDeuda.set(cliente, { facturas: [] });
          }

          const fechaVenc = new Date(fechaVencimiento);
          const diasVencido = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
          const estado = diasVencido > 0 ? 'Vencida' : (diasVencido > -10 ? 'Por Vencer' : 'Al día');

          clientesConDeuda.get(cliente)!.facturas.push({
            factura_id: facturaId.toString(),
            numero_factura: numeroFactura,
            fecha_emision: fechaEmision,
            fecha_vencimiento: fechaVencimiento,
            importe: importePendiente,
            dias_vencido: Math.max(0, diasVencido),
            estado,
          });
        }
      });

      // Convertir clientes con deuda a array
      clienteId = 1;
      const clientesData: ClienteConDeudaPendiente[] = Array.from(clientesConDeuda.entries())
        .filter(([_, datos]) => datos.facturas.length > 0)
        .map(([nombreCliente, datos]) => ({
          cliente_id: clienteId++,
          nombre_cliente: nombreCliente,
          deuda_total: datos.facturas.reduce((sum, f) => sum + f.importe, 0),
          facturas_pendientes: datos.facturas,
        }));

      // ===== GRILLA 3: Remitos pendientes de facturar =====
      // Por ahora usar datos mock ya que no hay endpoint específico para remitos
      const remitosData: RemitoPendienteFacturar[] = [];

      setSaldos(saldosData);
      setClientesDeuda(clientesData);
      setRemitosPendientes(remitosData);

      // Si todos están vacíos, mostrar advertencia
      if (saldosData.length === 0 && clientesData.length === 0 && remitosData.length === 0) {
        setError('No se encontraron datos para el período seleccionado. Se muestran datos de demostración.');
      }
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

  return (
    <div className="py-6 px-2 md:px-6 min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Saldos de Cuentas Corrientes
        </h1>

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
            </div>
          </div>
        )}

        {/* Grilla 1: Saldos de cuentas corrientes que no sean = cero */}
        <div className="bg-white border border-blue-100 rounded-xl shadow mb-6">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Saldos de Cuentas Corrientes</h2>
            <p className="text-sm text-gray-600">Clientes con saldo diferente de cero</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-blue-900 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Cliente</th>
                  <th className="py-3 px-4 md:px-6 text-right font-semibold">Saldo</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {saldos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No hay saldos de cuentas corrientes
                    </td>
                  </tr>
                ) : (
                  saldos.map((item, index) => (
                    <tr key={item.cliente_id} className={`border-t border-blue-100 hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}`}>
                      <td className="py-3 px-4 md:px-6">{item.nombre_cliente}</td>
                      <td className={`py-3 px-4 md:px-6 text-right font-semibold ${
                        item.saldo > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${item.saldo.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 md:px-6">
                        {new Date(item.ultima_actualizacion).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grilla 2: Clientes con deuda pendiente de cobro */}
        <div className="bg-white border border-blue-100 rounded-xl shadow mb-6">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Clientes con Deuda Pendiente de Cobro</h2>
            <p className="text-sm text-gray-600">Facturas pendientes de pago por cliente</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-blue-900 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Cliente</th>
                  <th className="py-3 px-4 md:px-6 text-right font-semibold">Deuda Total</th>
                  <th className="py-3 px-4 md:px-6 text-right font-semibold">Facturas Pendientes</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {clientesDeuda.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No hay clientes con deuda pendiente
                    </td>
                  </tr>
                ) : (
                  clientesDeuda.map((cliente, index) => (
                    <React.Fragment key={cliente.cliente_id}>
                      <tr className={`border-t border-blue-100 hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}`}>
                        <td className="py-3 px-4 md:px-6 font-semibold">{cliente.nombre_cliente}</td>
                        <td className="py-3 px-4 md:px-6 text-right font-semibold text-red-600">
                          ${cliente.deuda_total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-right">{cliente.facturas_pendientes.length}</td>
                        <td className="py-3 px-4 md:px-6">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">Ver facturas</summary>
                            <div className="mt-2 pl-4 border-l-2 border-blue-200">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-blue-50">
                                    <th className="py-2 px-2 text-left">N° Factura</th>
                                    <th className="py-2 px-2 text-left">Fecha Emisión</th>
                                    <th className="py-2 px-2 text-left">Fecha Vencimiento</th>
                                    <th className="py-2 px-2 text-right">Importe</th>
                                    <th className="py-2 px-2 text-right">Días Vencido</th>
                                    <th className="py-2 px-2 text-left">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cliente.facturas_pendientes.map((factura) => (
                                    <tr key={factura.factura_id} className="border-t border-blue-100">
                                      <td className="py-2 px-2">{factura.numero_factura}</td>
                                      <td className="py-2 px-2">
                                        {new Date(factura.fecha_emision).toLocaleDateString('es-AR')}
                                      </td>
                                      <td className="py-2 px-2">
                                        {new Date(factura.fecha_vencimiento).toLocaleDateString('es-AR')}
                                      </td>
                                      <td className="py-2 px-2 text-right">
                                        ${factura.importe.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                                      </td>
                                      <td className={`py-2 px-2 text-right ${
                                        factura.dias_vencido > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'
                                      }`}>
                                        {factura.dias_vencido}
                                      </td>
                                      <td className={`py-2 px-2 ${
                                        factura.estado === 'Vencida' ? 'text-red-600' :
                                        factura.estado === 'Por Vencer' ? 'text-yellow-600' : 'text-green-600'
                                      }`}>
                                        {factura.estado}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grilla 3: Remitos pendientes de facturar */}
        <div className="bg-white border border-blue-100 rounded-xl shadow mb-6">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Remitos Pendientes de Facturar</h2>
            <p className="text-sm text-gray-600">Remitos que aún no han sido facturados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-blue-900 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">N° Remito</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Fecha</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Cliente</th>
                  <th className="py-3 px-4 md:px-6 text-right font-semibold">Importe</th>
                  <th className="py-3 px-4 md:px-6 text-right font-semibold">Días Pendiente</th>
                  <th className="py-3 px-4 md:px-6 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {remitosPendientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No hay remitos pendientes de facturar
                    </td>
                  </tr>
                ) : (
                  remitosPendientes.map((remito, index) => (
                    <tr key={remito.remito_id} className={`border-t border-blue-100 hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}`}>
                      <td className="py-3 px-4 md:px-6">{remito.numero_remito}</td>
                      <td className="py-3 px-4 md:px-6">
                        {new Date(remito.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4 md:px-6">{remito.cliente}</td>
                      <td className="py-3 px-4 md:px-6 text-right">
                        ${remito.importe.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 md:px-6 text-right ${
                        remito.dias_pendiente > 15 ? 'text-red-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {remito.dias_pendiente}
                      </td>
                      <td className="py-3 px-4 md:px-6">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          remito.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {remito.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaldosCuentasCorrientes;
