import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TablePagination, TextField, Box } from '@mui/material';
import { Tooltip } from '@mui/material';
import { fetchFacturacionDiariaShop, FacturacionDiariaShop } from '../../../api/facturacion';

const FacturacionDiariaShopTable: React.FC = () => {

  const [data, setData] = useState<FacturacionDiariaShop[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proyección y acumulado mensual para Shop (debe ir después de declarar data)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = today.getDate();

  const dataMesActual = data.filter(row => {
    if (!row.fecha) return false;
    const fechaRow = new Date(row.fecha);
    return fechaRow.getMonth() === month && fechaRow.getFullYear() === year;
  });

  const totalVentasMes = dataMesActual.reduce((acc, row) => acc + Number(row.total_venta_dia), 0);
  const proyectado = currentDay > 0 ? (totalVentasMes / currentDay) * daysInMonth : 0;

  useEffect(() => {
    fetchFacturacionDiariaShop()
      .then((res: FacturacionDiariaShop[]) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Error al obtener la facturación diaria de shop');
        setLoading(false);
      });
  }, []);

  // Filtrar por rango de fechas
  let filteredData = data;
  if (filterFechaInicio) {
    filteredData = filteredData.filter(row => row.fecha >= filterFechaInicio);
  }
  if (filterFechaFin) {
    filteredData = filteredData.filter(row => row.fecha <= filterFechaFin);
  }
  // Buscador general
  if (search) {
    filteredData = filteredData.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }

  // Limitar a máximo 10 filas por página
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + Math.min(rowsPerPage, 10));

  return (
    <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
      <Typography variant="h5" sx={{ color: '#0d47a1', fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 }}>
        Facturación Diaria Shop
      </Typography>

      {/* Cards de resumen mensual */}
      <Box
        sx={{
          background: 'white',
          borderRadius: 3,
          boxShadow: 3,
          p: 2,
          minWidth: 260,
          flex: '0 0 auto',
          marginBottom: 5,
          borderLeft: '6px solid #0d47a1'
        }}
      >
        {/* Título */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0d47a1' }}>
          Proyección mensual
        </Typography>

        {/* Total acumulado hasta hoy */}
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Total acumulado al día {today.getDate()}:
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#0d47a1' }}>
          {totalVentasMes.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
          })}
        </Typography>

        {/* Proyección del mes */}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Proyección al {daysInMonth} de {today.toLocaleDateString('es-AR', { month: 'long' })}:
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#0d47a1' }}>
          {proyectado.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
          })}
        </Typography>

        {/* Diferencia entre acumulado y proyectado */}
        <Typography variant="body2" sx={{ color: '#0d47a1', fontWeight: 'bold', mb: 1 }}>
          Diferencia: {(proyectado - totalVentasMes).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
          })}
        </Typography>

      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Fecha inicio"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterFechaInicio}
          onChange={e => setFilterFechaInicio(e.target.value)}
          sx={{ background: '#e3f2fd', borderRadius: 1, minWidth: 150 }}
        />
        <TextField
          label="Fecha fin"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterFechaFin}
          onChange={e => setFilterFechaFin(e.target.value)}
          sx={{ background: '#e3f2fd', borderRadius: 1, minWidth: 150 }}
        />
        <TextField
          label="Buscar en tabla"
          type="search"
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ background: '#e3f2fd', borderRadius: 1, minWidth: 200 }}
        />
      </Box>
      {loading ? (
        <Typography variant="body1" color="primary">Cargando datos...</Typography>
      ) : error ? (
        <Typography variant="body1" color="error">{error}</Typography>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Año</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Mes</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Día</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Fecha</TableCell>
                <Tooltip title="Cortesías Discriminado" arrow><TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Cortesías Discriminado</TableCell></Tooltip>
                <Tooltip title="Total Comidas" arrow><TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Total Comidas</TableCell></Tooltip>
                <Tooltip title="Total Líquidos" arrow><TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Total Líquidos</TableCell></Tooltip>
                <Tooltip title="Total Kiosco" arrow><TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Total Kiosco</TableCell></Tooltip>
                <Tooltip title="Total Venta Día" arrow><TableCell sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Total Venta Día</TableCell></Tooltip>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow key={idx} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#e3f2fd' }}>
                  <TableCell>{row.anio}</TableCell>
                  <TableCell>{row.mes_numero}</TableCell>
                  <TableCell>{row.nombre_dia}</TableCell>
                  <TableCell>{row.fecha ? row.fecha.split('T')[0] : ''}</TableCell>
                  <TableCell>{Number(row.cortesias_discriminado).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{Number(row.total_comidas).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{Number(row.total_liquidos).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{Number(row.total_kiosco).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{Number(row.total_venta_dia).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              {/* Totales al pie */}
              <TableRow sx={{ backgroundColor: '#0d47a1' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff' }} colSpan={4}>Totales</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {filteredData.length > 0 ?
                    filteredData.reduce((acc, row) => acc + Number(row.cortesias_discriminado), 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {filteredData.length > 0 ?
                    filteredData.reduce((acc, row) => acc + Number(row.total_comidas), 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {filteredData.length > 0 ?
                    filteredData.reduce((acc, row) => acc + Number(row.total_liquidos), 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {filteredData.length > 0 ?
                    filteredData.reduce((acc, row) => acc + Number(row.total_kiosco), 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {filteredData.length > 0 ?
                    filteredData.reduce((acc, row) => acc + Number(row.total_venta_dia), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '$0.00'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredData.length}
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

export default FacturacionDiariaShopTable;
