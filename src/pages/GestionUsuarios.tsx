import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Paper
} from '@mui/material';

import EditNoteIcon from '@mui/icons-material/EditNote';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import {
  getAllUsers,
  getEmpresas,
  getRoles,
  editarUsuario
} from '../api/usuarios';

import TablaUserOriginal from '../components/TablaUser';
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
  empresa?: string;
  rol?: string;
  permisos?: number[];
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

  const [modal, setModal] = useState<{ open: boolean; usuario?: Usuario; accion?: 'inactivar' | 'activar'; }>({ open: false });
  const [editModal, setEditModal] = useState<{ open: boolean; usuario?: Usuario }>({ open: false });
  const [addModal, setAddModal] = useState<{ open: boolean }>({ open: false });

  const [search, setSearch] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);

  // Cargar usuarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      setLoading(true);
      const data = await getAllUsers();
      setUsuarios(data.usuarios || []);
      setLoading(false);
    };
    cargarUsuarios();
  }, []);

  // Cargar empresas y roles
  useEffect(() => {
    getEmpresas().then(r => setEmpresas(r.empresas || []));
    getRoles().then(r => setRoles(r.roles || []));
  }, []);

  /* =============================
        🔍 FILTROS FUNCIONANDO
     ============================= */
  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch =
      u.nombre_usuario.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesEmpresa = empresaFilter ? u.empresa === empresaFilter : true;
    const matchesRol = rolFilter ? u.rol === rolFilter : true;

    const matchesEstado =
      estadoFilter === ''
        ? true
        : estadoFilter === 'activo'
        ? u.activo
        : !u.activo;

    return matchesSearch && matchesEmpresa && matchesRol && matchesEstado;
  });

  /* =============================
        ❌ ACTIVAR / INACTIVAR
     ============================= */
  const handleInactivar = async (id: number) => {
    await editarUsuario(id, { activo: false });
    setUsuarios(prev => prev.map(u => u.user_id === id ? { ...u, activo: false } : u));
    setModal({ open: false });
  };

  const handleActivar = async (id: number) => {
    await editarUsuario(id, { activo: true });
    setUsuarios(prev => prev.map(u => u.user_id === id ? { ...u, activo: true } : u));
    setModal({ open: false });
  };

  /* =============================
        ✏️ EDITAR
     ============================= */
  const handleEditar = (usuario: Usuario) => {
    setEditModal({ open: true, usuario });
  };

  const handleEditSave = async (usuarioActualizado: Usuario) => {
    await editarUsuario(usuarioActualizado.user_id, usuarioActualizado);
    setUsuarios(u =>
      u.map(x => x.user_id === usuarioActualizado.user_id ? usuarioActualizado : x)
    );
    setEditModal({ open: false });
  };

  /* =============================
        ➕ AGREGAR
     ============================= */
  const handleAgregar = () => setAddModal({ open: true });

  const handleAddSave = async (nuevoUsuario: any) => {
    const { agregarUsuario } = await import('../api/usuarios');
    await agregarUsuario(nuevoUsuario);

    const data = await getAllUsers();
    setUsuarios(data.usuarios || []);

    setAddModal({ open: false });
  };

  /* =============================
        UI PRINCIPAL
     ============================= */
  return (
    <div className="w-full max-w-7xl mx-auto mt-10 px-4 min-h-screen">

      {/* Título */}
      <Typography variant="h3" fontWeight={900} textAlign="center" sx={{ mb: 4, color: '#12326b' }}>
        Gestión de Usuarios
      </Typography>

      {/* Botón agregar */}
      <Box textAlign="right" sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={handleAgregar}
          sx={{
            background: 'linear-gradient(90deg,#1e3c72,#2a5298)',
            fontWeight: 700,
            px: 3,
            py: 1.2,
            borderRadius: 3,
            textTransform: 'none',
          }}
        >
          Nuevo usuario
        </Button>
      </Box>

  

{/* BUSCADOR + FILTROS — ESTILO SIMPLE & PROFESIONAL */}

<Paper
  elevation={2}
  sx={{
    p: 2.5,
    mb: 3,
    borderRadius: 3,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  }}
>
  <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
  
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Buscar por nombre o email..."
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        padding: "12px 18px",
        fontSize: 18,
        width: 340,
        boxShadow: "0 2px 8px #e0e6f1",
        outline: "none",
        transition: "border-color 0.2s",
      }}
    />
    <select
      value={empresaFilter}
      onChange={(e) => setEmpresaFilter(e.target.value)}
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 16,
        minWidth: 180,
        background: "#f8fafc",
        boxShadow: "0 2px 8px #e0e6f1",
      }}
    >
      <option value="">Empresa</option>
      {empresas.map((emp) => (
        <option key={emp.empresa_id} value={emp.nombre}>
          {emp.nombre}
        </option>
      ))}
    </select>
    <select
      value={rolFilter}
      onChange={(e) => setRolFilter(e.target.value)}
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 16,
        minWidth: 180,
        background: "#f8fafc",
        boxShadow: "0 2px 8px #e0e6f1",
      }}
    >
      <option value="">Rol</option>
      {roles.map((rol) => (
        <option key={rol.rol_id} value={rol.nombre}>
          {rol.nombre}
        </option>
      ))}
    </select>
    <select
      value={estadoFilter}
      onChange={(e) => setEstadoFilter(e.target.value)}
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 16,
        minWidth: 180,
        background: "#f8fafc",
        boxShadow: "0 2px 8px #e0e6f1",
      }}
    >
      <option value="">Estado</option>
      <option value="activo">Activo</option>
      <option value="inactivo">Inactivo</option>
    </select>
    <Button
      variant="outlined"
      onClick={() => {
        setSearch("");
        setEmpresaFilter("");
        setRolFilter("");
        setEstadoFilter("");
      }}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        height: 48,
        color: "#334155",
        borderColor: "#94a3b8",
        background: "#f8fafc",
        boxShadow: "0 2px 8px #e0e6f1",
        '&:hover': { borderColor: '#64748b', color: '#1e293b', background: '#f1f5f9' },
      }}
    >
      Limpiar
    </Button>
  </Box>
</Paper>




      {/* ================================================
            📌 AQUÍ ESTÁ TU TABLA COMPLETA INCLUIDA
         ================================================ */}
      <TablaUserOriginal
        columns={[
          {
            id: 'usuario',
            label: 'Usuario',
            minWidth: 150,
            renderCell: (usuario: Usuario) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: usuario.activo ? 'primary.main' : 'grey.400',
                    width: 32,
                    height: 32,
                    fontSize: 15,
                    boxShadow: 2
                  }}
                >
                  {getInitials(usuario.nombre_usuario)}
                </Avatar>
                <Typography fontWeight={600}>{usuario.nombre_usuario}</Typography>
              </Box>
            )
          },
          { id: 'email', label: 'Email', minWidth: 100 },
          { id: 'dni', label: 'DNI', renderCell: (u: Usuario) => u.dni || '-' },
          { id: 'empresa', label: 'Empresa', renderCell: (u: Usuario) => u.empresa },
          { id: 'rol', label: 'Rol', renderCell: (u: Usuario) => u.rol },
          {
            id: 'estado',
            label: 'Estado',
            align: 'center',
            renderCell: (u: Usuario) =>
              u.activo ? (
                <PersonIcon color="success" fontSize="small" />
              ) : (
                <PersonOffIcon color="error" fontSize="small" />
              )
          },
          {
            id: 'acciones',
            label: 'Acciones',
            align: 'center',
            minWidth: 120,
            renderCell: (usuario: Usuario) => (
              <>
                <Tooltip title="Editar">
                  <IconButton onClick={() => handleEditar(usuario)}>
                    <EditNoteIcon />
                  </IconButton>
                </Tooltip>

                {usuario.activo ? (
                  <Tooltip title="Inactivar">
                    <IconButton color="error" onClick={() => setModal({ open: true, usuario, accion: 'inactivar' })}>
                      <PersonOffIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Activar">
                    <IconButton color="success" onClick={() => setModal({ open: true, usuario, accion: 'activar' })}>
                      <PersonIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )
          }
        ]}
        rows={filteredUsuarios}
        loading={loading}
        rowKey={u => u.user_id}
        emptyMessage="No hay usuarios para mostrar."
      />

      {/* ================================
            MODALES
         ================================ */}

      {/* Confirmación activar/inactivar */}
      <Dialog open={modal.open} onClose={() => setModal({ open: false })}>
        <DialogTitle>
          {modal.accion === 'inactivar'
            ? '¿Inactivar usuario?'
            : '¿Activar usuario?'}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
            <Avatar sx={{ width: 48, height: 48 }}>
              {modal.usuario ? getInitials(modal.usuario.nombre_usuario) : ''}
            </Avatar>
            <Typography fontWeight={700}>
              {modal.usuario?.nombre_usuario}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModal({ open: false })}>Cancelar</Button>

          <Button
            variant="contained"
            color={modal.accion === 'inactivar' ? 'error' : 'success'}
            onClick={() => {
              if (modal.usuario?.user_id && modal.accion === 'inactivar')
                handleInactivar(modal.usuario.user_id);
              if (modal.usuario?.user_id && modal.accion === 'activar')
                handleActivar(modal.usuario.user_id);
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Editar */}
      <Dialog open={editModal.open} onClose={() => setEditModal({ open: false })} fullWidth maxWidth="lg">
        <DialogContent>
          {editModal.usuario && (
            <FormEditUser
              usuario={editModal.usuario}
              empresas={empresas}
              roles={roles}
              onSave={handleEditSave}
              onCancel={() => setEditModal({ open: false })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Agregar */}
      <Dialog open={addModal.open} onClose={() => setAddModal({ open: false })} fullWidth maxWidth="lg">
        <DialogContent>
          <FormAddUser
            empresas={empresas}
            roles={roles}
            onSave={handleAddSave}
            onCancel={() => setAddModal({ open: false })}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
}
