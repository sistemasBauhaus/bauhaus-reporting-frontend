// Obtener todos los permisos disponibles
export async function getPermisosList() {
  const res = await fetch(`${API_URL}/permisos`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Error al cargar permisos');
  return res.json();
}
const API_URL = process.env.REACT_APP_API_URL;

function getToken() {
  return localStorage.getItem("token") || "";
}

/* =========================
   EMPRESAS Y ROLES
   ========================= */

export async function getEmpresas() {
  const res = await fetch(`${API_URL}/empresas`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error("Error al cargar empresas");
  return res.json();
}

export async function getRoles() {
  const res = await fetch(`${API_URL}/roles`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error("Error al cargar roles");
  return res.json();
}


/* =========================
   USUARIOS
   ========================= */

// Obtener todos los usuarios
export async function getAllUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}

// Crear usuario (con permisos)
export async function agregarUsuario(nuevoUsuario: {
  email: string;
  password: string;
  nombre_usuario: string;
  dni: string;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
  permisos_ids: number[]; // ids de permisos seleccionados
}) {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(nuevoUsuario)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error al registrar usuario");
  }

  return res.json();
}




// Editar usuario (datos básicos, empresa, rol, etc.)
export async function editarUsuario(id: number, payload: any) {
  const res = await fetch(`${API_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Error al actualizar usuario");
  return res.json();
}

/* =========================
   PERMISOS POR USUARIO
   ========================= */

export async function getUserPermisos(user_id: number) {
  const res = await fetch(
    `${API_URL}/permisos/${user_id}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );
  if (!res.ok) throw new Error("Error al obtener permisos");
  return res.json();
}

export async function agregarPermiso(
  user_id: number,
  empresa_id: number,
  permiso_id: number
) {
  const res = await fetch(`${API_URL}/usuarios/permisos/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ user_id, empresa_id, permiso_id })
  });

  if (!res.ok) throw new Error("Error al asignar permiso");
  return res.json();
}

export async function quitarPermiso(
  user_id: number,
  empresa_id: number,
  permiso_id: number
) {
  const res = await fetch(`${API_URL}/usuarios/permisos/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ user_id, empresa_id, permiso_id })
  });

  if (!res.ok) throw new Error("Error al eliminar permiso");
  return res.json();
}
