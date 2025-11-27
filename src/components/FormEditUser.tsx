import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getPermisosList, getUserPermisos } from '../api/usuarios';

// Nombres amigables
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

type Usuario = {
  user_id: number;
  nombre_usuario: string;
  email: string;
  dni: string | null;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
  empresa?: string;
  rol?: string;
};

type Props = {
  usuario: Usuario;
  empresas: Empresa[];
  roles: Rol[];
  onSave: (usuarioEditado: any) => Promise<void>;
  onCancel: () => void;
};

const FormEditUser: React.FC<Props> = ({
  usuario,
  empresas,
  roles,
  onSave,
  onCancel
}) => {
  const navigate = useNavigate();
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [superadmin, setSuperadmin] = useState(false);
  const [form, setForm] = useState({
    ...usuario,
    password: "",
    permisos: [] as number[]
  });
  const [permisosList, setPermisosList] = useState<{ id: number; nombre: string }[]>([]);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const cargar = async () => {
      try {
        const listaPermisos = await getPermisosList();
        const usuarioPermisos = await getUserPermisos(usuario.user_id);
        setPermisosList(listaPermisos.permisos || []);
        let permisosArray = usuarioPermisos.permisos_ids ?? usuarioPermisos.permisos ?? [];
        if (Array.isArray(permisosArray) && permisosArray.length > 0 && typeof permisosArray[0] === 'object') {
          permisosArray = permisosArray.map(p => p.id);
        }
        console.log('Permisos del usuario:', permisosArray);
        setForm(f => ({
          ...f,
          permisos: Array.isArray(permisosArray) ? permisosArray : []
        }));
        // Si el usuario tiene todos los permisos, activa superadmin
        if (Array.isArray(permisosArray) && listaPermisos.permisos && permisosArray.length === listaPermisos.permisos.length) {
          setSuperadmin(true);
        } else {
          setSuperadmin(false);
        }
      } catch (err) {
        console.error("Error cargando permisos", err);
      }
    };
    cargar();
  }, [usuario]);
  // Actualiza los permisos si superadmin cambia
  useEffect(() => {
    setForm(f => ({
      ...f,
      permisos: superadmin ? permisosList.map(p => p.id) : f.permisos
    }));
  }, [superadmin, permisosList]);

  const togglePermiso = (id: number) => {
    setForm(prev => {
      const nuevosPermisos = prev.permisos.includes(id)
        ? prev.permisos.filter(p => p !== id)
        : [...prev.permisos, id];
      console.log('Permisos actualizados:', nuevosPermisos);
      return {
        ...prev,
        permisos: nuevosPermisos
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Enviar permisos_ids en vez de permisos
    const payload = {
      ...form,
      permisos_ids: form.permisos
    };
    console.log('Enviando usuario editado:', payload);
    try {
      await onSave(payload);
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
              Editar Usuario
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
                value={form.dni || ''}
                onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
                error={!!errors.dni}
                helperText={errors.dni}
                fullWidth
              />
              <TextField
                label="Nueva contraseña "
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
                Guardar Cambios
              </Button>
            </Box>
          </Box>
          {/* Columna derecha: permisos */}
          <Box sx={{ flex: 1, p: 4, borderLeft: { md: '2px solid #e0e6f1' }, background: '#f8fafc', borderRadius: 4 }}>
            <Typography variant="h5" fontWeight={900} sx={{ color: '#1e3c72', mb: 2 }}>
              Permisos
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#526074', fontWeight: 500 }}>
              Modificá los permisos del usuario.
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
                    checked={form.permisos.includes(perm.id)}
                    onChange={() => togglePermiso(perm.id)}
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
        <DialogTitle>Usuario editado con éxito</DialogTitle>
        <DialogContent>
          <Typography>Los cambios fueron guardados correctamente.</Typography>
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
        <DialogTitle>Error al editar usuario</DialogTitle>
        <DialogContent>
          <Typography color="error">No se pudo editar el usuario. Intente nuevamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorOpen(false)} color="primary">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormEditUser;
