import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getEmpresas, getRoles } from '../api/auth';

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
  password?: string;
  empresa?: string; // <-- opcional
  rol?: string;     // <-- opcional
};

type Props = {
  usuario: Usuario;
  onSave: (usuarioActualizado: Usuario) => Promise<void>;
  onCancel: () => void;
  empresas?: Empresa[];
  roles?: Rol[];
};

const FormEditUser: React.FC<Props> = ({
  usuario,
  onSave,
  onCancel,
  empresas = [],
  roles = []
}) => {
  const [form, setForm] = useState<Usuario>(usuario);
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [empresasData, setEmpresas] = useState<Empresa[]>([]);
  const [rolesData, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const empresasResponse = await getEmpresas();
        const rolesResponse = await getRoles();
        setEmpresas(Array.isArray(empresasResponse.empresas) ? empresasResponse.empresas : []);
        // Ajusta aquí según la estructura real de rolesResponse
        setRoles(Array.isArray(rolesResponse.roles) ? rolesResponse.roles : Array.isArray(rolesResponse) ? rolesResponse : []);
      } catch (error) {
        setEmpresas([]);
        setRoles([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (empresasData.length > 0 && rolesData.length > 0 && usuario) {
      setForm({
        ...usuario,
        empresa_id: usuario.empresa_id,
        rol_id: usuario.rol_id,
      });
    }
  }, [usuario, empresasData, rolesData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      empresa_id: Number(e.target.value),
    }));
  };

  const handleRolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      rol_id: Number(e.target.value),
    }));
  };

  const handleSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      activo: e.target.checked,
    }));
  };

  const handleClickShowPassword = () => setShowPassword(show => !show);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(form);
      setSuccessModal(true);
    } catch (error) {
      alert('Error al guardar usuario');
    }
  };

  const handleSuccessClose = () => {
    setSuccessModal(false);
    onCancel();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] bg-white">
        <span className="text-blue-700 text-sm font-medium animate-pulse px-2 py-1">
          Cargando datos de usuario...
        </span>
      </div>
    );
  }

  return (
    <>
      <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight={700} color="primary" textAlign="center">
            Editar Usuario
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              mt: 1,
              minWidth: 400,
              maxWidth: 700,
              mx: 'auto',
              p: 1
            }}
            onSubmit={handleSubmit}
          >
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4
            }}>
              <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Nombre de usuario"
                  name="nombre_usuario"
                  value={form.nombre_usuario}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  required
                  size="medium"
                />
                <TextField
                  label="DNI"
                  name="dni"
                  value={form.dni || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
                <TextField
                  select
                  label="Empresa"
                  name="empresa_id"
                  value={form.empresa_id} // <-- este valor viene del usuario
                  onChange={handleEmpresaChange}
                  fullWidth
                  variant="outlined"
                  required
                  size="medium"
                >
                  {empresasData.map(emp => (
                    <MenuItem key={emp.empresa_id} value={emp.empresa_id}>{emp.nombre}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  required
                  size="medium"
                />
                <TextField
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  placeholder="Nueva contraseña"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Mostrar contraseña"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  label="Rol"
                  name="rol_id"
                  value={form.rol_id}
                  onChange={handleRolChange}
                  fullWidth
                  variant="outlined"
                  required
                  size="medium"
                >
                  {rolesData.map(rol => (
                    <MenuItem key={rol.rol_id} value={rol.rol_id}>{rol.nombre}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={form.activo}
                  onChange={handleSwitch}
                  color="primary"
                />
              }
              label={form.activo ? 'Activo' : 'Inactivo'}
              sx={{ mt: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
              <Button
                onClick={onCancel}
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  fontSize: 16,
                  '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' }
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ fontWeight: 600, px: 3, py: 1, fontSize: 16 }}
              >
                Guardar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de éxito */}
      <Dialog open={successModal} onClose={handleSuccessClose}>
        <DialogTitle>
          <Typography variant="h6" color="success.main" textAlign="center">
            Usuario editado con éxito
          </Typography>
        </DialogTitle>
        <DialogActions>
          <Button onClick={handleSuccessClose} variant="contained" color="primary">
            Volver
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormEditUser;