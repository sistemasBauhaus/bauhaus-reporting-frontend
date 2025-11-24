const API_URL = process.env.REACT_APP_API_URL;

export async function login(email: string, password: string) {
  console.log('Login payload:', { email, password }); // <-- Agrega este log
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  console.log('Login response status:', res.status); // <-- Log de status
  const data = await res.json();
  console.log('Login response data:', data); // <-- Log de respuesta
  if (!res.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }
  return data;
}

export async function register(payload: {
  nombre: string;
  email: string;
  password: string;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
}) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al registrar usuario');
  }
  return res.json();
}

export async function getEmpresas() {
  const res = await fetch(`${API_URL}/empresas`);
  if (!res.ok) throw new Error('Error al cargar empresas');
  return res.json();
}

export async function getRoles() {
  const res = await fetch(`${API_URL}/roles`);
  if (!res.ok) throw new Error('Error al cargar roles');
  return res.json();
}

export async function agregarUsuario(nuevoUsuario: {
  email: string;
  password: string;
  nombre_usuario: string;
  empresa_id: number;
  rol_id: number;
}) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoUsuario),
  });
  if (!res.ok) throw new Error('Error al registrar usuario');
  return res.json();
}