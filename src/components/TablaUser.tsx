import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Avatar, IconButton, Tooltip
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';

export interface TableColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  renderCell?: (row: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  rows: any[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: (row: any) => string | number;
}

const TablaUserOriginal: React.FC<TableProps> = ({ columns, rows, loading = false, emptyMessage = 'Sin datos', rowKey }) => {
  return (
<TableContainer
  component={Paper}
  elevation={0}
  sx={{
    borderRadius: 1,
    maxWidth: '1300px',
    mx: 'auto',
    background: '#fff',
    boxShadow: '0 6px 22px rgba(0,0,0,0.06)'
  }}
>

      <Box sx={{ px: 4, pt: 3, pb: 1 }}>

      </Box>
      <Table size="medium">
        <TableHead>
          <TableRow sx={{ background: '#1746a0' }}>
            {columns.map(col => (
              <TableCell
                key={col.id}
                align={col.align || 'left'}
                sx={{ fontWeight: 700, fontSize: 16, minWidth: col.minWidth || 90, color: '#fff', borderBottom: '2px solid #e3eafc', letterSpacing: 0.5 }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography color="text.secondary">Cargando...</Typography>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={rowKey ? rowKey(row) : idx}
                hover
                sx={{ background: idx % 2 === 0 ? '#fff' : '#f6f8fa', transition: 'background 0.2s' }}
              >
                {columns.map(col => (
                  <TableCell key={col.id} align={col.align || 'left'} sx={{ fontSize: 15 }}>
                    {col.renderCell
                      ? col.renderCell(row)
                      : col.id === 'acciones'
                        ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Editar usuario">
                              <IconButton sx={{ color: '#1746a0' }} size="small">
                                <EditOutlinedIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>
                            {row.activo ? (
                              <Tooltip title="Desactivar usuario">
                                <IconButton sx={{ color: '#0c2340' }} size="small">
                                  <BlockIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Activar usuario">
                                <IconButton sx={{ color: '#1746a0' }} size="small">
                                  <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )
                        : row[col.id]
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TablaUserOriginal;
