import React, { useEffect, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, TablePagination
} from '@mui/material';
import {
  fetchFacturacionDiariaLiquidos, FacturacionDiariaLiquidos,
  fetchFacturacionDiariaGNC, FacturacionDiariaGNC,
  fetchFacturacionDiariaShop, FacturacionDiariaShop,
  fetchFacturacionDiariaOtros, FacturacionDiariaOtros
} from '../../../api/facturacion';

// Helper para formatear fecha DD-MM
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FacturacionDiariaUnificadaTable: React.FC = () => {
  // Estado para mostrar/ocultar grupos de columnas
  const [visibleGroups, setVisibleGroups] = useState({
    liquidos: true,
    gnc: true,
    shop: true,
    otros: true,
  });

  const handleToggleGroup = (group: keyof typeof visibleGroups) => {
    setVisibleGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const [liquidos, setLiquidos] = useState<FacturacionDiariaLiquidos[]>([]);
  const [gnc, setGnc] = useState<FacturacionDiariaGNC[]>([]);
  const [shop, setShop] = useState<FacturacionDiariaShop[]>([]);
  const [otros, setOtros] = useState<FacturacionDiariaOtros[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get current month/year
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  useEffect(() => {
    Promise.all([
      fetchFacturacionDiariaLiquidos(),
      fetchFacturacionDiariaGNC(),
      fetchFacturacionDiariaShop(),
      fetchFacturacionDiariaOtros()
    ])
      .then(([liq, gncData, shopData, otrosData]) => {
        setLiquidos(liq);
        setGnc(gncData);
        setShop(shopData);
        setOtros(otrosData);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al obtener la facturación diaria');
        setLoading(false);
      });
  }, []);

  // Helper para filtrar solo mes en curso
  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
  };

  // Unificar por fecha y filtrar solo mes en curso
  type Row = {
    fecha: string;
    [key: string]: any;
  };
  const rowMap: { [fecha: string]: Row } = {};
  liquidos.filter(row => isCurrentMonth(row.fecha)).forEach(row => {
    const key = formatDate(row.fecha);
    if (!rowMap[key]) rowMap[key] = { fecha: key };
    Object.assign(rowMap[key], row);
  });
  gnc.filter(row => isCurrentMonth(row.fecha)).forEach(row => {
    const key = formatDate(row.fecha);
    if (!rowMap[key]) rowMap[key] = { fecha: key };
    Object.assign(rowMap[key], row);
  });
  shop.filter(row => isCurrentMonth(row.fecha)).forEach(row => {
    const key = formatDate(row.fecha);
    if (!rowMap[key]) rowMap[key] = { fecha: key };
    Object.assign(rowMap[key], row);
  });
  otros.filter(row => isCurrentMonth(row.fecha)).forEach(row => {
    const key = formatDate(row.fecha);
    if (!rowMap[key]) rowMap[key] = { fecha: key };
    Object.assign(rowMap[key], row);
  });
  const rows = Object.values(rowMap).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Calcular días del mes en curso
  const diasDelMes = new Date(year, month + 1, 0).getDate();

  // Cards resumen con diseño profesional y azul
  const resumen = [
    {
      label: 'Líquidos',
      value: rows.reduce((acc, r) => acc + (r.total_dinero_dia ?? 0), 0),
      sub: rows.reduce((acc, r) => acc
        + (r.qn_ac ?? 0)
        + (r.quantium_nafta ?? 0)
        + (r.s_ac ?? 0)
        + (r.super ?? 0)
        + (r.diesel_x10_liviano_ac ?? 0)
        + (r.diesel_x10_liviano ?? 0)
        + (r.diesel_x10_pesado_ac ?? 0)
        + (r.diesel_x10_pesado ?? 0)
        + (r.quantium_diesel_x10_liviano_ac ?? 0)
        + (r.quantium_diesel_x10_liviano ?? 0)
        + (r.quantium_diesel_x10_pesado_ac ?? 0)
        + (r.quantium_diesel_x10_pesado ?? 0)
      , 0),
      subLabel: 'Litros',
      proyectado: function() {
        return this.value / diasDelMes;
      },
      color: '#1976d2'
    },
    {
      label: 'GNC',
      value: rows.reduce((acc, r) => acc + (Number(r.total_gnc_dinero) || 0), 0),
      sub: rows.reduce((acc, r) => acc + (Number(r.gnc) || 0), 0),
      subLabel: 'M3',
      proyectado: function() {
        return this.value / diasDelMes;
      },
      color: '#1565c0'
    },
    {
      label: 'Shop',
      value: rows.reduce((acc, r) => acc + (r.total_venta_dia ?? 0), 0),
      sub: rows.reduce((acc, r) => acc + (r.total_liquidos ?? 0), 0),
      subLabel: 'Litros',
      proyectado: function() {
        return this.value / diasDelMes;
      },
      color: '#2196f3'
    },
    {
      label: 'Otros',
      value: rows.reduce((acc, r) => acc + (r.total_otros_dinero ?? 0), 0),
      sub: rows.reduce((acc, r) => acc + (r.eco_blue ?? 0) + (r.lubricantes ?? 0) + (r.otros ?? 0), 0),
      subLabel: 'Unidades',
      proyectado: function() {
        return this.value / diasDelMes;
      },
      color: '#64b5f6'
    }
  ];

  return (
    <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2', mb: 4, textAlign: 'center', letterSpacing: 1 }}>
        Ventas Diarias
      </Typography>

      <div style={{
        display: 'flex',
        gap: 20,
        marginBottom: 28,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {resumen.map((item) => (
          <div
            key={item.label}
            style={{
              minWidth: 200,
              background: '#f4f8fb',
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
              border: `2px solid ${item.color}`,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: 6,
              background: item.color, borderTopLeftRadius: 10, borderTopRightRadius: 10
            }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: item.color, mb: 0.5, fontSize: 18 }}>
              {item.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#222', mb: 0.5 }}>
              {item.value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2" sx={{ color: item.color, fontSize: 15, mb: 0.5 }}>
              {item.subLabel}: <b>{item.sub.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</b>
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', fontSize: 14, mt: 1 }}>
              Proyectado diario: <b>{(typeof item.proyectado === 'function' ? item.proyectado() : 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</b>
            </Typography>
          </div>
        ))}
      </div>

      {/* Barra de toggles minimalista sobre la tabla */}
      <div style={{ display: 'flex', gap: 8, margin: '0 0 8px 0', justifyContent: 'flex-start' }}>
        {['liquidos', 'gnc', 'shop', 'otros'].map((group) => (
          <button
            key={group}
            onClick={() => handleToggleGroup(group as keyof typeof visibleGroups)}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: visibleGroups[group as keyof typeof visibleGroups] ? '2px solid #1976d2' : '1px solid #d1d5db',
              background: '#fff',
              color: visibleGroups[group as keyof typeof visibleGroups] ? '#1976d2' : '#555',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
              boxShadow: 'none',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          >
            {group.charAt(0).toUpperCase() + group.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <Typography variant="body1" color="primary">Cargando datos...</Typography>
      ) : error ? (
        <Typography variant="body1" color="error">{error}</Typography>
      ) : (
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', boxShadow: 2, borderRadius: 2, background: '#f8fafc' }}>
          <Table sx={{ minWidth: 600, width: 'auto', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ background: '#e3f2fd', fontWeight: 'bold', color: '#0d47a1', borderRight: '2px solid #90caf9', minWidth: 70, px: 1, textAlign: 'center', borderTopLeftRadius: 8 }}>Fecha</TableCell>
                {visibleGroups.liquidos && <TableCell colSpan={13} align="center" sx={{ background: '#1976d2', fontWeight: 'bold', color: '#fff', borderRight: '2px solid #90caf9', minWidth: 120, px: 1, borderTopRightRadius: 8, borderLeft: '2px solid #90caf9', fontSize: 15 }}>LÍQUIDOS</TableCell>}
                {visibleGroups.gnc && <TableCell colSpan={3} align="center" sx={{ background: '#0288d1', fontWeight: 'bold', color: '#fff', borderRight: '2px solid #90caf9', minWidth: 70, px: 1, borderLeft: '2px solid #90caf9', fontSize: 15 }}>GNC</TableCell>}
                {visibleGroups.shop && <TableCell colSpan={5} align="center" sx={{ background: '#039be5', fontWeight: 'bold', color: '#fff', borderRight: '2px solid #90caf9', minWidth: 90, px: 1, borderLeft: '2px solid #90caf9', fontSize: 15 }}>SHOP</TableCell>}
                {visibleGroups.otros && <TableCell colSpan={4} align="center" sx={{ background: '#29b6f6', fontWeight: 'bold', color: '#fff', minWidth: 70, px: 1, borderLeft: '2px solid #90caf9', borderTopRightRadius: 8, fontSize: 15 }}>OTROS</TableCell>}
              </TableRow>
              <TableRow>
                {visibleGroups.liquidos && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, borderLeft: '2px solid #1976d2', fontSize: 12 }}><Tooltip title="Quantium Nafta AC"><span>QN</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Quantium Nafta"><span>QNafta</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Super AC"><span>SAC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Super"><span>Super</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Diesel X10 Liviano AC"><span>D L AC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Diesel X10 Liviano"><span>D L</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Diesel X10 Pesado AC"><span>D P AC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Diesel X10 Pesado"><span>D P</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Quantium Diesel X10 Liviano AC"><span>Q D L AC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Quantium Diesel X10 Liviano"><span>Q D L</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Quantium Diesel X10 Pesado AC"><span>Q D P AC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Quantium Diesel X10 Pesado"><span>Q D P</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', background: '#bbdefb', borderRight: '2px solid #90caf9', minWidth: 60, px: 1, fontSize: 13 }}>Total Líquidos</TableCell>
                </>}
                {visibleGroups.gnc && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0288d1', background: '#e3f2fd', minWidth: 30, px: 0.5, borderLeft: '2px solid #0288d1', fontSize: 12 }}><Tooltip title="GNC (metros cúbicos)"><span>GNC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0288d1', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="GNC acumulado (metros cúbicos)"><span>GNC AC</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0288d1', background: '#bbdefb', borderRight: '2px solid #90caf9', minWidth: 40, px: 0.5, fontSize: 13 }}><Tooltip title="Total GNC Dinero"><span>GNC Totales</span></Tooltip></TableCell>
                </>}
                {visibleGroups.shop && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#039be5', background: '#e3f2fd', minWidth: 30, px: 0.5, borderLeft: '2px solid #039be5', fontSize: 12 }}><Tooltip title="Cortesías Discriminado"><span>Cortesías</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#039be5', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Total Comidas"><span>Comidas</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#039be5', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Total Líquidos Shop"><span>Liq. Shop</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#039be5', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Total Kiosco"><span>Kiosco</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#039be5', background: '#bbdefb', borderRight: '2px solid #90caf9', minWidth: 40, px: 1, fontSize: 13 }}><Tooltip title="Total Venta Shop"><span>Venta Shop Totales</span></Tooltip></TableCell>
                </>}
                {visibleGroups.otros && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#29b6f6', background: '#e3f2fd', minWidth: 30, px: 0.5, borderLeft: '2px solid #29b6f6', fontSize: 12 }}><Tooltip title="Eco Blue"><span>EcoBlue</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#29b6f6', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Lubricantes"><span>Lubric.</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#29b6f6', background: '#e3f2fd', minWidth: 30, px: 0.5, fontSize: 12 }}><Tooltip title="Otros"><span>Otros Totales</span></Tooltip></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#29b6f6', background: '#bbdefb', minWidth: 40, px: 1, borderRight: '2px solid #29b6f6', fontSize: 13 }}><Tooltip title="Total Otros Dinero"><span>Otros $</span></Tooltip></TableCell>
                </>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, idx) => (
                <TableRow key={idx} hover sx={{ backgroundColor: idx % 2 === 0 ? '#f4f8fb' : '#e3f2fd', borderBottom: '2px solid #90caf9', height: 32 }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center', background: '#e3f2fd', borderRight: '2px solid #90caf9', minWidth: 70, px: 0.5, fontSize: 13 }}>
                    {formatDate(row.fecha)}
                  </TableCell>
                  {visibleGroups.liquidos && <>
                    <TableCell>{row.qn_ac !== undefined ? Number(row.qn_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.quantium_nafta !== undefined ? Number(row.quantium_nafta).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.s_ac !== undefined ? Number(row.s_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.super !== undefined ? Number(row.super).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.diesel_x10_liviano_ac !== undefined ? Number(row.diesel_x10_liviano_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.diesel_x10_liviano !== undefined ? Number(row.diesel_x10_liviano).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.diesel_x10_pesado_ac !== undefined ? Number(row.diesel_x10_pesado_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.diesel_x10_pesado !== undefined ? Number(row.diesel_x10_pesado).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.quantium_diesel_x10_liviano_ac !== undefined ? Number(row.quantium_diesel_x10_liviano_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.quantium_diesel_x10_liviano !== undefined ? Number(row.quantium_diesel_x10_liviano).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.quantium_diesel_x10_pesado_ac !== undefined ? Number(row.quantium_diesel_x10_pesado_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.quantium_diesel_x10_pesado !== undefined ? Number(row.quantium_diesel_x10_pesado).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_dinero_dia !== undefined ? Number(row.total_dinero_dia).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) : ''}</TableCell>
                  </>}
                  {visibleGroups.gnc && <>
                    <TableCell>{row.gnc !== undefined ? Number(row.gnc).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.gnc_ac !== undefined ? Number(row.gnc_ac).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_gnc_dinero !== undefined ? Number(row.total_gnc_dinero).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) : ''}</TableCell>
                  </>}
                  {visibleGroups.shop && <>
                    <TableCell>{row.cortesias_discriminado !== undefined ? Number(row.cortesias_discriminado).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_comidas !== undefined ? Number(row.total_comidas).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_liquidos !== undefined ? Number(row.total_liquidos).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_kiosco !== undefined ? Number(row.total_kiosco).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_venta_dia !== undefined ? Number(row.total_venta_dia).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) : ''}</TableCell>
                  </>}
                  {visibleGroups.otros && <>
                    <TableCell>{row.eco_blue !== undefined ? Number(row.eco_blue).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.lubricantes !== undefined ? Number(row.lubricantes).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.otros !== undefined ? Number(row.otros).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : ''}</TableCell>
                    <TableCell>{row.total_otros_dinero !== undefined ? Number(row.total_otros_dinero).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }) : ''}</TableCell>
                  </>}
                </TableRow>
              ))}
              {/* Fila de totales dinámica: solo muestra totales de los grupos visibles */}
              <TableRow sx={{ background: '#0d47a1', borderTop: '4px solid #1976d2', height: 36 }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', background: '#0d47a1', borderRight: '2px solid #90caf9', minWidth: 70, fontSize: 14, borderTop: '4px solid #1976d2' }} />
                {visibleGroups.liquidos && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.qn_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.quantium_nafta ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.s_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.super ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.diesel_x10_liviano_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.diesel_x10_liviano ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.diesel_x10_pesado_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.diesel_x10_pesado ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.quantium_diesel_x10_liviano_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.quantium_diesel_x10_liviano ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.quantium_diesel_x10_pesado_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderRight: '2px solid #90caf9', borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.quantium_diesel_x10_pesado ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#0d47a1', textAlign: 'center', fontSize: 14, borderRight: '2px solid #90caf9', borderTop: '4px solid #1976d2', backgroundColor: '#1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_dinero_dia ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                </>}
                {visibleGroups.gnc && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1565c0', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.gnc ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1565c0', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.gnc_ac ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderRight: '2px solid #90caf9', borderTop: '4px solid #1976d2', backgroundColor: '#1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_gnc_dinero ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                </>}
                {visibleGroups.shop && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.cortesias_discriminado ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_comidas ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_liquidos ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_kiosco ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderRight: '2px solid #90caf9', borderTop: '4px solid #1976d2', backgroundColor: '#1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_venta_dia ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                </>}
                {visibleGroups.otros && <>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.eco_blue ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.lubricantes ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderTop: '4px solid #1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.otros ?? 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#fff', background: '#1976d2', textAlign: 'center', fontSize: 14, borderRight: '2px solid #29b6f6', borderTop: '4px solid #1976d2', backgroundColor: '#1976d2' }}>{paginatedRows.reduce((acc, r) => acc + (r.total_otros_dinero ?? 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</TableCell>
                </>}
              </TableRow>
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página"
            sx={{ background: '#e3f2fd', borderRadius: 1 }}
          />
        </TableContainer>
      )}
    </Paper>
  );
};

export default FacturacionDiariaUnificadaTable;