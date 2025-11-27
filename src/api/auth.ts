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
