const API_URL = process.env.REACT_APP_API_URL;

export async function login(email: string, password: string) {
  const startTotal = performance.now();
  console.log('Login payload:', { email, password });
  const startFetch = performance.now();
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const endFetch = performance.now();
  console.log('Login response status:', res.status, 'Fetch time:', (endFetch - startFetch).toFixed(1), 'ms');
  const startJson = performance.now();
  const data = await res.json();
  const endJson = performance.now();
  console.log('Login response data:', data, 'JSON parse time:', (endJson - startJson).toFixed(1), 'ms');
  if (!res.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }
  const endTotal = performance.now();
  console.log('Total login time:', (endTotal - startTotal).toFixed(1), 'ms');
  return data;
}
