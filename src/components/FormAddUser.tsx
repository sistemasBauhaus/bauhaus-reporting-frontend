import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

type Empresa = { empresa_id: number; nombre: string };
type Rol = { rol_id: number; nombre: string };

type Usuario = {
  nombre_usuario: string;
  email: string;
  dni: string;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
  password: string;
};

type Props = {
  onSave: (nuevoUsuario: Usuario) => Promise<void>;
  onCancel: () => void;
  empresas?: Empresa[];
  roles?: Rol[];
};

const FormAddUser: React.FC<Props> = ({
  onSave,
  onCancel,
  empresas = [],
  roles = [],
}) => {
  const [form, setForm] = useState<Usuario>({
    nombre_usuario: '',
    email: '',
    dni: '',
    empresa_id: empresas[0]?.empresa_id || 0,
    rol_id: roles[0]?.rol_id || 0,
    activo: true,
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successModal, setSuccessModal] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nombre_usuario) newErrors.nombre_usuario = 'Campo obligatorio';
    if (!form.email) newErrors.email = 'Campo obligatorio';
    if (!form.dni) newErrors.dni = 'Campo obligatorio';
    if (!form.empresa_id) newErrors.empresa_id = 'Campo obligatorio';
    if (!form.rol_id) newErrors.rol_id = 'Campo obligatorio';
    if (!form.password) newErrors.password = 'Campo obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      empresa_id: Number(e.target.value),
    }));
    setErrors(prev => ({ ...prev, empresa_id: '' }));
  };

  const handleRolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      rol_id: Number(e.target.value),
    }));
    setErrors(prev => ({ ...prev, rol_id: '' }));
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
    if (validate()) {
      try {
        await onSave(form);
        setSuccessModal(true);
      } catch (error) {
        alert('Error al agregar usuario');
      }
    }
  };

  return (
    <Box
      component="form"
      sx={{
        mt: 1,
        minWidth: 400,
        maxWidth: 700,
        mx: 'auto',
        p: 3,
        bgcolor: '#fff',
        borderRadius: 4,
        boxShadow: 6
      }}
      onSubmit={handleSubmit}
    >
      <Typography variant="h5" fontWeight={700} color="primary" mb={3} textAlign="center">
        Agregar Usuario
      </Typography>
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
            error={!!errors.nombre_usuario}
            helperText={errors.nombre_usuario}
          />
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
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            label="DNI"
            name="dni"
            value={form.dni}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
            size="medium"
            error={!!errors.dni}
            helperText={errors.dni}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            select
            label="Empresa"
            name="empresa_id"
            value={form.empresa_id}
            onChange={handleEmpresaChange}
            fullWidth
            variant="outlined"
            required
            size="medium"
            error={!!errors.empresa_id}
            helperText={errors.empresa_id}
          >
            {empresas.map(emp => (
              <MenuItem key={emp.empresa_id} value={emp.empresa_id}>{emp.nombre}</MenuItem>
            ))}
          </TextField>
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
            error={!!errors.rol_id}
            helperText={errors.rol_id}
          >
            {roles.map(rol => (
              <MenuItem key={rol.rol_id} value={rol.rol_id}>{rol.nombre}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
            size="medium"
            error={!!errors.password}
            helperText={errors.password}
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
        <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 600, px: 3, py: 1, fontSize: 16 }}>
          Guardar
        </Button>
      </Box>
      {successModal && (
        <Box sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Box sx={{
            bgcolor: '#fff',
            p: 4,
            borderRadius: 3,
            boxShadow: 8,
            minWidth: 300,
            textAlign: 'center'
          }}>
            <Typography variant="h6" color="success.main" mb={2}>
              Usuario agregado con éxito
            </Typography>
            <Button variant="contained" color="success" onClick={() => setSuccessModal(false)}>
              Cerrar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FormAddUser;