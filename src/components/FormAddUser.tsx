import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getPermisosList } from '../api/usuarios';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper
} from '@mui/material';

// NOMBRES AMIGABLES PARA USUARIO
const PERMISO_LABELS: Record<string, string> = {
  "menu.inicio": "Inicio",
  "menu.reporte_diario": "Reporte Diario",
  "menu.ventas_diarias": "Ventas Diarias",
  "menu.niveles_tanques": "Niveles de Tanques",
  "menu.saldos_cuentas_corrientes": "Saldos Cuentas Corrientes",
  "menu.compras_discriminadas": "Compras Discriminadas",
  "menu.facturas_proveedores": "Facturas Proveedores",
  "menu.unidades_empresa": "Unidades de Empresa",
  "menu.gestion_usuarios": "Gestión de Usuarios",
};

type Empresa = { empresa_id: number; nombre: string };
type Rol = { rol_id: number; nombre: string };

type NuevoUsuario = {
  nombre_usuario: string;
  email: string;
  dni: string;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
  password: string;
  permisos_ids: number[];
};

type Props = {
  onSave: (usuario: NuevoUsuario) => Promise<void>;
  onCancel: () => void;
  empresas: Empresa[];
  roles: Rol[];
};

const FormAddUser: React.FC<Props> = ({ onSave, onCancel, empresas, roles }) => {
  const navigate = useNavigate();
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<NuevoUsuario>({
    nombre_usuario: '',
    email: '',
    dni: '',
    empresa_id: empresas[0]?.empresa_id || 0,
    rol_id: roles[0]?.rol_id || 0,
    activo: true,
    password: '',
    permisos_ids: [],
  });

  const [permisosList, setPermisosList] = useState<{ id: number; nombre: string }[]>([]);
  const [superadmin, setSuperadmin] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getPermisosList();
        setPermisosList(data.permisos || []);
      } catch {
        setPermisosList([]);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    setForm(f => ({
      ...f,
      permisos_ids: superadmin ? permisosList.map(p => p.id) : []
    }));
  }, [superadmin, permisosList]);

  const validate = () => {
    const errs: any = {};
    if (!form.nombre_usuario) errs.nombre_usuario = 'Requerido';
    if (!form.email) errs.email = 'Requerido';
    if (!form.dni) errs.dni = 'Requerido'; // DNI vuelve a ser requerido
    if (!form.password) errs.password = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const togglePermiso = (id: number) => {
    if (superadmin) return;
    setForm(prev => {
      const nuevosPermisos = prev.permisos_ids.includes(id)
        ? prev.permisos_ids.filter(p => p !== id)
        : [...prev.permisos_ids, id];
      console.log('Permisos seleccionados (add):', nuevosPermisos);
      return {
        ...prev,
        permisos_ids: nuevosPermisos
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Payload enviado (add):', form);
    try {
      await onSave(form);
      setSuccessOpen(true);
    } catch (err) {
      setErrorOpen(true);
    }
  };

  return (
    <>
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: '1000px',
          margin: '32px auto',
          p: 0,
          borderRadius: 4,
          background: '#f8fafc',
          boxShadow: '0 4px 16px rgba(30,60,114,0.10)',
        }}
        component="form"
        onSubmit={handleSubmit}
      >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%' }}>
        {/* Columna izquierda: datos usuario */}
        <Box sx={{ flex: 1, p: 4, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={900} sx={{ mb: 2, color: '#1e3c72' }}>
            Nuevo Usuario
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={superadmin}
                onChange={e => setSuperadmin(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography fontWeight={700} color="primary.main">
                Superadmin (todos los permisos)
              </Typography>
            }
            sx={{ mb: 2 }}
          />
          <Divider sx={{ my: 2 }} />
          {/* Empresa y Rol en la misma fila */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Empresa"
              value={form.empresa_id}
              onChange={e => setForm(f => ({ ...f, empresa_id: Number(e.target.value) }))}
              error={!!errors.empresa_id}
              sx={{ flex: 1 }}
            >
              {empresas.map(emp => (
                <MenuItem key={emp.empresa_id} value={emp.empresa_id}>
                  {emp.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Rol"
              value={form.rol_id}
              onChange={e => setForm(f => ({ ...f, rol_id: Number(e.target.value) }))}
              error={!!errors.rol_id}
              sx={{ flex: 1 }}
            >
              {roles.map(rol => (
                <MenuItem key={rol.rol_id} value={rol.rol_id}>
                  {rol.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            label="Nombre de usuario"
            value={form.nombre_usuario}
            onChange={e => setForm(f => ({ ...f, nombre_usuario: e.target.value }))}
            error={!!errors.nombre_usuario}
            helperText={errors.nombre_usuario}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            sx={{ mb: 2 }}
          />
          {/* DNI y Contraseña en la misma fila */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="DNI"
              value={form.dni}
              onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
              error={!!errors.dni}
              helperText={errors.dni}
              fullWidth
            />
            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowPassword((show) => !show)}
                    sx={{ minWidth: 0, p: 0 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                )
              }}
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={form.activo}
                onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                color="primary"
              />
            }
            label={form.activo ? 'Activo' : 'Inactivo'}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ px: 4, fontWeight: 700, borderRadius: 2, borderColor: '#1e3c72', color: '#1e3c72' }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              sx={{
                px: 4,
                fontWeight: 700,
                borderRadius: 2,
                background: 'linear-gradient(90deg,#1e3c72,#2a5298)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(30,60,114,0.10)'
              }}
            >
              Guardar
            </Button>
          </Box>
        </Box>
        {/* Columna derecha: permisos */}
        <Box sx={{ flex: 1, p: 4, borderLeft: { md: '2px solid #e0e6f1' }, background: '#f8fafc', borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={900} sx={{ color: '#1e3c72', mb: 2 }}>
            Permisos
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#526074', fontWeight: 500 }}>
            Seleccioná los permisos manualmente o habilitá "Superadmin".
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {permisosList.map(perm => (
              <Box
                key={perm.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  px: 0,
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <Checkbox
                  checked={form.permisos_ids.includes(perm.id)}
                  onChange={() => togglePermiso(perm.id)}
                  disabled={superadmin}
                  sx={{ color: '#1e3c72' }}
                />
                <Typography fontWeight={500} sx={{ color: '#1e3c72', ml: 1 }}>
                  {PERMISO_LABELS[perm.nombre] || perm.nombre}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      </Paper>
      <Dialog open={successOpen} onClose={() => {}}>
        <DialogTitle>Usuario creado con éxito</DialogTitle>
        <DialogContent>
          <Typography>El usuario fue creado correctamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSuccessOpen(false);
              navigate('/gestion-usuarios');
            }}
            variant="contained"
            color="primary"
          >
            Ir a Gestión de Usuarios
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)}>
        <DialogTitle>Error al crear usuario</DialogTitle>
        <DialogContent>
          <Typography color="error">No se pudo registrar el usuario. Intente nuevamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorOpen(false)} color="primary">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormAddUser;
