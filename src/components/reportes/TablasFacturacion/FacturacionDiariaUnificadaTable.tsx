import React, { useEffect, useState } from 'react';
import {
  fetchFacturacionDiariaLiquidos,
  fetchFacturacionDiariaGNC,
  fetchFacturacionDiariaOtros,
  fetchFacturacionDiariaShop,
  FacturacionDiariaLiquidos,
  FacturacionDiariaGNC,
  FacturacionDiariaOtros,
  FacturacionDiariaShop
} from '../../../api/facturacion';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, TablePagination
} from '@mui/material';

// Helper para formatear fecha DD-MM
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${month}`;
};

// Tipo de fila unificada
type UnifiedRow = {
  fecha: string;
  super?: number;
  s_ac?: number;
  quantium_nafta?: number;
  qn_ac?: number;
  diesel_x10_liviano?: number;
  diesel_x10_pesado?: number;
  diesel_x10_liviano_ac?: number;
  diesel_x10_pesado_ac?: number;
  quantium_diesel_x10_liviano?: number;
  quantium_diesel_x10_pesado?: number;
  quantium_diesel_x10_liviano_ac?: number;
  quantium_diesel_x10_pesado_ac?: number;
  total_dinero_dia?: number;
  gnc_livianos?: number;
  gnc_alto_caudal?: number;
  gnc_venta_diaria?: number;
  eco_blue?: number;
  lubricantes?: number;
  otros?: number;
  complementos_venta_diaria?: number;
  bebidas?: number;
  comidas?: number;
  kiosco?: number;
  cortesias?: number;
  spot_venta_diaria?: number;
};

const FacturacionDiariaUnificadaTable: React.FC = () => {
        // Estados para paginación
        const [page, setPage] = useState(0);
        const [rowsPerPage, setRowsPerPage] = useState(20);
      // Estilos base para headers
      const baseHeaderStyle = {
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 0.5,
        padding: '7px 6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        textAlign: 'center',
        border: '1px solid #bdbdbd',
      };
      // Colores por sección para headers
      const liquidosHeader = { background: '#1976d2', color: '#fff' };
      const gncHeader = { background: '#1565c0', color: '#fff' };
      const complementosHeader = { background: '#64b5f6', color: '#1565c0', fontStyle: 'italic' };
      const spotHeader = { background: '#0288d1', color: '#fff', fontStyle: 'italic' };
    // Estilos base para todas las columnas
    const baseCellStyle = {
      padding: '8px',
      fontWeight: 'bold',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: '1px solid #cfd8dc',
      fontSize: 15,
    };
    // Colores por sección
    const liquidosColor = { background: '#fff', color: '#1976d2' };
    const gncColor = { background: '#fff', color: '#1976d2' };
      const gncCellStyle = { ...baseCellStyle, ...gncColor, borderRadius: 0, border: '1.5px solid #90caf9' };
    const complementosColor = { background: '#fff', color: '#1565c0' };
      const complementosCellStyle = { ...baseCellStyle, ...complementosColor, borderRadius: 0, border: '1.5px solid #90caf9' };
    const spotColor = { background: '#fff', color: '#01579b' };
    const spotColorNoItalic = { background: '#fff', color: '#01579b' };
    const spotCellStyle = { ...baseCellStyle, ...spotColorNoItalic, borderRadius: 0, border: '1.5px solid #4fc3f7' };
  const [liquidos, setLiquidos] = useState<FacturacionDiariaLiquidos[]>([]);
  const [gnc, setGnc] = useState<FacturacionDiariaGNC[]>([]);
  const [otros, setOtros] = useState<FacturacionDiariaOtros[]>([]);
  const [shop, setShop] = useState<FacturacionDiariaShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiquidosGncOtrosShop = async () => {
      try {
        const [liquidosData, gncData, otrosData, shopData] = await Promise.all([
          fetchFacturacionDiariaLiquidos(),
          fetchFacturacionDiariaGNC(),
          fetchFacturacionDiariaOtros(),
          fetchFacturacionDiariaShop()
        ]);
        setLiquidos(Array.isArray(liquidosData) ? liquidosData : []);
        setGnc(Array.isArray(gncData) ? gncData : []);
        setOtros(Array.isArray(otrosData) ? otrosData : []);
        setShop(Array.isArray(shopData) ? shopData : []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
        setLiquidos([]);
        setGnc([]);
        setOtros([]);
        setShop([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLiquidosGncOtrosShop();
  }, []);

  // ...existing code...

  return (
    <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-8 text-center">Ventas Diarias</h1>
      {/* Cards resumen - arriba de la tabla */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(() => {
          const isCurrentMonth = (dateStr: string) => {
            const d = new Date(dateStr);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          };
          type Row = { fecha: string; [key: string]: any };
          const rowMap: { [fecha: string]: Row } = {};
          liquidos.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
            const key = formatDate(row.fecha);
            if (!rowMap[key]) rowMap[key] = { fecha: key };
            Object.assign(rowMap[key], row);
          });
          gnc.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
            const key = formatDate(row.fecha);
            if (!rowMap[key]) rowMap[key] = { fecha: key };
            Object.assign(rowMap[key], row);
          });
          shop.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
            const key = formatDate(row.fecha);
            if (!rowMap[key]) rowMap[key] = { fecha: key };
            Object.assign(rowMap[key], row);
          });
          otros.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
            const key = formatDate(row.fecha);
            if (!rowMap[key]) rowMap[key] = { fecha: key };
            Object.assign(rowMap[key], row);
          });
          const rows: Row[] = Object.values(rowMap).sort((a, b) => b.fecha.localeCompare(a.fecha));
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();
          const diasDelMes = new Date(year, month + 1, 0).getDate();

          // Última fecha incluida
          const lastDate = rows.length > 0 ? formatDate(rows[0].fecha) : '';

          // Proyectado: total ventas al día (suma de totales dividido por días del mes)
          const totalVentasDia = rows.reduce((acc, r) => acc + (
            (r.total_dinero_dia ?? 0) + (r.total_gnc_dinero ?? 0) + (r.total_venta_dia ?? 0) + (r.total_otros_dinero ?? 0)
          ), 0);
          const proyectadoVentasDia = totalVentasDia / diasDelMes;

          // Totales individuales
          const totalDineroLiquidos = rows.reduce((acc, r) => acc + (r.total_dinero_dia ?? 0), 0);
          const totalDineroGNC = rows.reduce((acc, r) => acc + (r.total_gnc_dinero ?? 0), 0);
          const totalStop = rows.reduce((acc, r) => acc + (r.total_venta_dia ?? 0), 0);
          const totalComplementos = rows.reduce((acc, r) => acc + (r.total_otros_dinero ?? 0), 0);

          // Card color scheme
          const colorLiquidos = '#0d47a1';
          const colorGNC = '#1565c0';
          const colorStop = '#1976d2';
          // Nuevo tono de azul para Complementos
          const colorComplementos = '#1e88e5'; // Azul más intenso y diferente

          return (
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Líquidos */}
              <div style={{
                background: '#fff',
                border: `2px solid ${colorLiquidos}`,
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                minWidth: 200,
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 8
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: colorLiquidos, marginBottom: 6 }}>Líquidos</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: colorLiquidos, marginBottom: 2 }}>
                  {totalDineroLiquidos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>Hasta el día {lastDate}</div>
                <div style={{ fontSize: 14, color: colorLiquidos, fontWeight: 700, marginBottom: 8 }}>Proyectado: {proyectadoVentasDia.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</div>
              </div>
              {/* GNC */}
              <div style={{
                background: '#fff',
                border: `2px solid ${colorGNC}`,
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                minWidth: 200,
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 8
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: colorGNC, marginBottom: 6 }}>GNC</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: colorGNC, marginBottom: 2 }}>
                  {totalDineroGNC.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>Hasta el día {lastDate}</div>
                <div style={{ fontSize: 14, color: colorGNC, fontWeight: 700, marginBottom: 8 }}>Proyectado: {proyectadoVentasDia.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</div>
              </div>
              {/* Stop */}
              <div style={{
                background: '#fff',
                border: `2px solid ${colorStop}`,
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                minWidth: 200,
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 8
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: colorStop, marginBottom: 6 }}>Stop</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: colorStop, marginBottom: 2 }}>
                  {totalStop.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>Hasta el día {lastDate}</div>
                <div style={{ fontSize: 14, color: colorStop, fontWeight: 700, marginBottom: 8 }}>Proyectado: {proyectadoVentasDia.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</div>
              </div>
              {/* Complementos */}
              <div style={{
                background: '#fff',
                border: `2.5px solid ${colorComplementos}`,
                boxShadow: '0 1px 8px rgba(30,136,229,0.13)',
                minWidth: 200,
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 8
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: colorComplementos, marginBottom: 6 }}>Complementos</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: colorComplementos, marginBottom: 2 }}>
                  {totalComplementos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>Hasta el día {lastDate}</div>
                <div style={{ fontSize: 14, color: colorComplementos, fontWeight: 700, marginBottom: 8 }}>Proyectado: {proyectadoVentasDia.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          );
        })()}
      </div>
      {/* Tabla y paginación */}
      {(() => {
        // Helpers
        const isCurrentMonth = (dateStr: string) => {
          const d = new Date(dateStr);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        };
        type Row = { fecha: string; [key: string]: any };
        const rowMap: { [fecha: string]: Row } = {};
        liquidos.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
          const key = formatDate(row.fecha);
          if (!rowMap[key]) rowMap[key] = { fecha: key };
          Object.assign(rowMap[key], row);
        });
        gnc.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
          const key = formatDate(row.fecha);
          if (!rowMap[key]) rowMap[key] = { fecha: key };
          Object.assign(rowMap[key], row);
        });
        shop.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
          const key = formatDate(row.fecha);
          if (!rowMap[key]) rowMap[key] = { fecha: key };
          Object.assign(rowMap[key], row);
        });
        otros.filter((row: any) => isCurrentMonth(row.fecha)).forEach((row: any) => {
          const key = formatDate(row.fecha);
          if (!rowMap[key]) rowMap[key] = { fecha: key };
          Object.assign(rowMap[key], row);
        });
        const rows: Row[] = Object.values(rowMap).sort((a, b) => b.fecha.localeCompare(a.fecha));
        const paginatedRows: Row[] = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        return (
          <>
             <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', overflowY: 'visible', boxShadow: 2, borderRadius: 2, background: '#e3f2fd' }}>
            <Table sx={{ minWidth: 900, width: 'auto', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ ...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>Fecha</TableCell>
                  <TableCell colSpan={2} align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>SUPER</TableCell>
                  <TableCell colSpan={2} align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>QUANTIUM NAFTA</TableCell>
                  <TableCell colSpan={4} align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>DIESEL X10</TableCell>
                  <TableCell colSpan={4} align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>QUANTIUM DIESEL X10</TableCell>
                  <TableCell rowSpan={2} align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>VENTAS DIARIAS</TableCell>
                  {/* GNC - Nueva "tabla" */}
                  <TableCell colSpan={3} align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderLeft: '4px solid #1976d2', borderRight: '2px solid #0d47a1' }}>GNC</TableCell>
                  <TableCell colSpan={4} align="center" sx={{...baseHeaderStyle, ...liquidosHeader, borderRight: '2px solid #1565c0' }}>COMPLEMENTOS</TableCell>
                  <TableCell colSpan={5} align="center" sx={{  ...baseHeaderStyle, ...gncHeader, borderLeft: '4px solid #1976d2', borderRight: '2px solid #0d47a1' }}>SPOT</TableCell>
                </TableRow>
                <TableRow>
                  {/* SUPER */}
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Regular</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '2px solid #1565c0' }}>AC</TableCell>
                  {/* QUANTIUM NAFTA */}
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Regular</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '2px solid #1565c0' }}>AC</TableCell>
                  {/* DIESEL X10 */}
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Liviano Regular</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Liviano AC</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Pesado Regular</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '2px solid #1565c0' }}>Pesado AC</TableCell>
                  {/* QUANTIUM DIESEL X10 */}
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #bbdefb' }}>Liviano Regular</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #bbdefb' }}>Liviano AC</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #bbdefb' }}>Pesado Regular</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '2px solid #1565c0' }}>Pesado AC</TableCell>
                  {/* GNC HEADERS - mismo color que las celdas */}
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderLeft: '4px solid #1565c0', borderRight: '1px solid #bbdefb' }}>Livianos</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderRight: '1px solid #bbdefb' }}>Alto Caudal</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderRight: '2px solid #1565c0' }}>Ventas Diarias</TableCell>
                  {/* Complementos HEADERS - estilo propio */}
                 <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Eco-Blue</TableCell>
                 <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Lubricantes</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Otros</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...liquidosHeader, background: '#2196f3', borderRight: '1px solid #90caf9' }}>Ventas Diarias</TableCell>
                  {/* Spot HEADERS */}
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderLeft: '4px solid #1565c0', borderRight: '1px solid #bbdefb' }}>Bebidas</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderLeft: '4px solid #1565c0', borderRight: '1px solid #bbdefb' }}>Comida</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderRight: '1px solid #bbdefb' }}>Kiosco</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderRight: '1px solid #bbdefb' }}>Cortesías</TableCell>
                  <TableCell align="center" sx={{ ...baseHeaderStyle, ...gncHeader, borderRight: '2px solid #1565c0' }}>Ventas Diarias</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center">Sin datos</TableCell>
                  </TableRow>
                ) : (
                  rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                    <TableRow key={idx + page * rowsPerPage}>
                      <TableCell sx={{ borderRight: '2px solid #1565c0' }}>{formatDate(row.fecha)}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.super?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.s_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.quantium_nafta?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.qn_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.diesel_x10_liviano?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.diesel_x10_liviano_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.diesel_x10_pesado?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.diesel_x10_pesado_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.quantium_diesel_x10_liviano?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.quantium_diesel_x10_liviano_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.quantium_diesel_x10_pesado?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.quantium_diesel_x10_pesado_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={{ ...baseCellStyle, ...liquidosColor }}>{row.total_dinero_dia?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      {/* GNC */}
                      <TableCell sx={gncCellStyle}>{row.gnc?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={gncCellStyle}>{row.gnc_ac?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={gncCellStyle}>{row.total_gnc_dinero?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      {/* Complementos */}
                      <TableCell sx={complementosCellStyle}>{row.eco_blue?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={complementosCellStyle}>{row.lubricantes?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={complementosCellStyle}>{row.otros?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={complementosCellStyle}>{row.total_otros_dinero?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      {/* Spot */}
                      <TableCell sx={spotCellStyle}>{row.total_liquidos?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={spotCellStyle}>{row.total_comidas?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={spotCellStyle}>{row.total_kiosco?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={spotCellStyle}>{row.cortesias_discriminado?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? ''}</TableCell>
                      <TableCell sx={spotCellStyle}>{row.total_venta_dia?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) ?? ''}</TableCell>
                    </TableRow>
                  ))
                )}
                {/* Fila de totales */}
                <TableRow sx={{ background: '#1976d2', borderTop: '4px solid #1565c0', height: 40 }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', background: '#1976d2', minWidth: 70, fontSize: 16, borderTop: '4px solid #1565c0', borderRight: '2px solid #1565c0', letterSpacing: 1 }}>Totales</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.super ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.s_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.quantium_nafta ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.qn_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.diesel_x10_liviano ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.diesel_x10_liviano_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.diesel_x10_pesado ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.diesel_x10_pesado_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.quantium_diesel_x10_liviano ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.quantium_diesel_x10_liviano_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.quantium_diesel_x10_pesado ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '2px solid #1565c0', borderLeft: '2px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.quantium_diesel_x10_pesado_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 16, borderRight: '2px solid #1976d2', letterSpacing: 1 }}>{rows.reduce((acc, r) => acc + (r.total_dinero_dia ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                  {/* Totales GNC */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderLeft: '4px solid #1565c0', borderRight: '1px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.gnc ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '1px solid #1565c0', borderLeft: '1px solid #1565c0', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.gnc_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 16, borderRight: '2px solid #1976d2', letterSpacing: 1  }}>{rows.reduce((acc, r) => acc + (r.total_gnc_dinero ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                  {/* Totales Complementos */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#1565c0', background: '#fff', textAlign: 'center', fontSize: 15, borderLeft: '4px solid #0d47a1', borderRight: '1px solid #bbdefb', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.eco_blue ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1565c0', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '1px solid #bbdefb', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.lubricantes ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1565c0', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '1px solid #bbdefb', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.otros ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 16, borderRight: '2px solid #1976d2', letterSpacing: 1 }}>{rows.reduce((acc, r) => acc + (r.total_otros_dinero ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                  {/* Totales Spot */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#01579b', background: '#fff', textAlign: 'center', fontSize: 15, borderLeft: '4px solid #0288d1', borderRight: '1px solid #b3e5fc', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.total_liquidos ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#01579b', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '1px solid #b3e5fc', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.total_comidas ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#01579b', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '1px solid #b3e5fc', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.total_kiosco ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#01579b', background: '#fff', textAlign: 'center', fontSize: 15, borderRight: '1px solid #b3e5fc', boxShadow: '0 2px 8px #e0e0e0' }}>{rows.reduce((acc, r) => acc + (r.cortesias_discriminado ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 16, borderRight: '2px solid #1976d2', letterSpacing: 1 }}>{rows.reduce((acc, r) => acc + (r.total_venta_dia ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '24px 0 8px 0',
            background: '#f5faff',
            borderRadius: 10,
            padding: '8px 18px',
            width: 'fit-content',
            minWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
            boxShadow: 'none',
            border: '1px solid #e3f2fd',
          }}>
            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={(_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Filas por página"
              sx={{
                '.MuiTablePagination-toolbar': {
                  background: '#fff',
                  borderRadius: 7,
                  minHeight: 44,
                  fontWeight: 600,
                  color: '#1976d2',
                  boxShadow: 'none',
                  border: 'none',
                },
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  color: '#1976d2',
                  fontWeight: 500,
                  fontSize: 15,
                },
                '.MuiTablePagination-actions': {
                  color: '#1976d2',
                },
                '.MuiInputBase-root': {
                  color: '#1976d2',
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: 5,
                  background: '#f5faff',
                  boxShadow: 'none',
                  border: '1px solid #e3f2fd',
                },
                '.MuiSvgIcon-root': {
                  color: '#1976d2',
                },
              }}
            />
          </div>
        </>
        );
      })()}
    </Paper>
  )};
        export default FacturacionDiariaUnificadaTable;