import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Avatar
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import FormEditUser from '../components/FormEditUser';
import FormAddUser from '../components/FormAddUser';

const API_URL = process.env.REACT_APP_API_URL;

type Empresa = { empresa_id: number; nombre: string };
type Rol = { rol_id: number; nombre: string };

type Usuario = {
  user_id: number;
  email: string;
  nombre_usuario: string;
  dni: string | null;
  activo: boolean;
  empresa_id: number;
  rol_id: number;
  empresa?: string;      // <-- agrega esto
  rol?: string;          // <-- agrega esto
  empresa_nombre?: string;
  rol_nombre?: string;
  password?: string;
};

type NuevoUsuario = {
  nombre_usuario: string;
  email: string;
  dni: string | null;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
  password: string;
};

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    open: boolean;
    usuario?: Usuario;
    accion?: 'inactivar' | 'activar';
  }>({ open: false });

  // Modal edición
  const [editModal, setEditModal] = useState<{ open: boolean; usuario?: Usuario }>({ open: false });
  const [addModal, setAddModal] = useState<{ open: boolean }>({ open: false });

  const [search, setSearch] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => {
        console.log('Usuarios:', data.usuarios); // <-- Verifica aquí los campos
        setUsuarios(data.usuarios || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/empresas`)
      .then(res => res.json())
      .then(data => setEmpresas(data.empresas || []));
    fetch(`${API_URL}/roles`)
      .then(res => res.json())
      .then(data => setRoles(data.roles || []));
  }, []);

  // Filtros usando nombre de empresa y rol
  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch =
      u.nombre_usuario.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const empresaNombre = empresas.find(e => e.empresa_id === u.empresa_id)?.nombre || '';
    const rolNombre = roles.find(r => r.rol_id === u.rol_id)?.nombre || '';
    const matchesEmpresa = empresaFilter ? empresaNombre === empresaFilter : true;
    const matchesRol = rolFilter ? rolNombre === rolFilter : true;
    const matchesEstado =
      estadoFilter === ''
        ? true
        : estadoFilter === 'activo'
        ? u.activo
        : !u.activo;
    return matchesSearch && matchesEmpresa && matchesRol && matchesEstado;
  });

  const handleInactivar = async (id: number) => {
    await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: false }),
    });
    setUsuarios(usuarios => usuarios.map(u => u.user_id === id ? { ...u, activo: false } : u));
    setModal({ open: false });
  };

  const handleActivar = async (id: number) => {
    await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: true }),
    });
    setUsuarios(usuarios => usuarios.map(u => u.user_id === id ? { ...u, activo: true } : u));
    setModal({ open: false });
  };

  const handleEditar = (usuario: Usuario) => {
    setEditModal({ open: true, usuario });
  };

  const handleEditSave = async (usuarioActualizado: Usuario) => {
    await fetch(`${API_URL}/users/${usuarioActualizado.user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioActualizado),
    });
    setUsuarios(usuarios =>
      usuarios.map(u =>
        u.user_id === usuarioActualizado.user_id ? { ...u, ...usuarioActualizado } : u
      )
    );
    setEditModal({ open: false });
  };

  const handleEditCancel = () => setEditModal({ open: false });

  const handleAgregar = () => {
    setAddModal({ open: true });
  };

  const openModal = (usuario: Usuario, accion: 'inactivar' | 'activar') => {
    setModal({ open: true, usuario, accion });
  };

  const closeModal = () => setModal({ open: false });

  const confirmarAccion = () => {
    if (modal.usuario && modal.accion === 'inactivar') {
      handleInactivar(modal.usuario.user_id);
    }
    if (modal.usuario && modal.accion === 'activar') {
      handleActivar(modal.usuario.user_id);
    }
  };

const handleAddSave = async (nuevoUsuario: NuevoUsuario) => {
  await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: nuevoUsuario.email,
      password: nuevoUsuario.password,
      nombre_usuario: nuevoUsuario.nombre_usuario,
      empresa_id: nuevoUsuario.empresa_id,
      rol_id: nuevoUsuario.rol_id,
    }),
  });
  setAddModal({ open: false });
  setLoading(true);
  fetch(`${API_URL}/users`)
    .then(res => res.json())
    .then(data => {
      setUsuarios(data.usuarios || []);
      setLoading(false);
    });
};

  const handleAddCancel = () => setAddModal({ open: false });

  return (
    <div className="w-full max-w-none mx-auto mt-10 px-2 overflow-x-auto min-h-screen">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-900 drop-shadow-lg tracking-tight">
        Gestión de Usuarios
      </h1>
      <div className="flex justify-end mb-6">
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white font-semibold shadow hover:bg-blue-900 transition mr-4"
          style={{ marginRight: '5rem' }}
          onClick={handleAgregar}
        >
          Agregar Usuario
        </button>
      </div>
      {/* 🎛️ Filtros */}
      <div className="flex flex-wrap gap-4 items-center justify-center mb-8 p-4 bg-white rounded-xl shadow-md border border-blue-200">
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Buscar:&nbsp;
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nombre o email"
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          />
        </label>
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Empresa:&nbsp;
          <select
            value={empresaFilter}
            onChange={e => setEmpresaFilter(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          >
            <option value="">Todas</option>
            {empresas.map(emp => (
              <option key={emp.empresa_id} value={emp.nombre}>{emp.nombre}</option>
            ))}
          </select>
        </label>
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Rol:&nbsp;
          <select
            value={rolFilter}
            onChange={e => setRolFilter(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          >
            <option value="">Todos</option>
            {roles.map(rol => (
              <option key={rol.rol_id} value={rol.nombre}>{rol.nombre}</option>
            ))}
          </select>
        </label>
        <label className="font-semibold text-blue-900 flex items-center gap-2">
          Estado:&nbsp;
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 shadow focus:ring focus:ring-blue-200 transition"
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white font-semibold shadow hover:bg-blue-900 transition"
          onClick={() => {
            setSearch('');
            setEmpresaFilter('');
            setRolFilter('');
            setEstadoFilter('');
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {loading ? (
        <Typography>Cargando usuarios...</Typography>
      ) : (
        <TableContainer component={Paper} elevation={6} sx={{ borderRadius: 4, maxWidth: 1200, mx: 'auto', boxShadow: 6 }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ background: '#e3f2fd' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 18, width: 180 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 16, width: 100 }}>DNI</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 16, width: 140 }}>Empresa</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 16, width: 120 }}>Rol</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16, width: 80 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16, width: 160 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsuarios.map(usuario => (
                <TableRow
                  key={usuario.user_id}
                  hover
                  sx={{
                    opacity: usuario.activo ? 1 : 0.5,
                    background: usuario.activo ? '#fff' : '#f3f3f3',
                    transition: 'background 0.2s'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: usuario.activo ? 'primary.main' : 'grey.400',
                          width: 36,           // más chico
                          height: 36,          // más chico
                          fontSize: 16,        // más chico
                          fontWeight: 700,
                          boxShadow: 2
                        }}
                        title={usuario.nombre_usuario}
                      >
                        {getInitials(usuario.nombre_usuario)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600} fontSize={18}>{usuario.nombre_usuario}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 15 }}>{usuario.email}</TableCell>
                  <TableCell sx={{ fontSize: 15 }}>{usuario.dni || '-'}</TableCell>
                  <TableCell sx={{ fontSize: 15 }}>{usuario.empresa || '-'}</TableCell>
                  <TableCell sx={{ fontSize: 15 }}>{usuario.rol || '-'}</TableCell>
                  <TableCell align="center">
                    {usuario.activo ? (
                      <PersonIcon color="success" fontSize="medium" titleAccess="Usuario activo" />
                    ) : (
                      <PersonOffIcon color="error" fontSize="medium" titleAccess="Usuario inactivo" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton color="primary" size="medium" onClick={() => handleEditar(usuario)}>
                        <EditNoteIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                    {usuario.activo ? (
                      <Tooltip title="Inactivar">
                        <IconButton color="error" size="medium" onClick={() => openModal(usuario, 'inactivar')}>
                          <PersonOffIcon fontSize="medium" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Activar">
                        <IconButton color="success" size="medium" onClick={() => openModal(usuario, 'activar')}>
                          <PersonIcon fontSize="medium" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de confirmación */}
      <Dialog open={modal.open} onClose={closeModal}>
        <DialogTitle>
          {modal.accion === 'inactivar'
            ? '¿Estás seguro de inactivar este usuario?'
            : '¿Estás seguro de activar este usuario?'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', mt: 1 }}>
            <Avatar
              sx={{
                bgcolor: modal.usuario?.activo ? 'primary.main' : 'grey.400',
                width: 48,
                height: 48,
                fontSize: 22,
                fontWeight: 700,
                boxShadow: 2
              }}
            >
              {modal.usuario ? getInitials(modal.usuario.nombre_usuario) : ''}
            </Avatar>
            <Typography fontWeight={700} fontSize={18}>
              {modal.usuario?.nombre_usuario}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button
            onClick={confirmarAccion}
            color={modal.accion === 'inactivar' ? 'error' : 'success'}
            variant="contained"
            sx={{ fontWeight: 600, fontSize: 16 }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={editModal.open} onClose={handleEditCancel} maxWidth="sm" fullWidth>
     
        <DialogContent>
          {editModal.usuario && (
            <FormEditUser
              usuario={editModal.usuario}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
              empresas={empresas}
              roles={roles}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de agregar usuario */}
      <Dialog open={addModal.open} onClose={handleAddCancel} maxWidth="sm" fullWidth>
      
        <DialogContent>
          <FormAddUser
            onSave={handleAddSave}
            onCancel={handleAddCancel}
            empresas={empresas}
            roles={roles}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}