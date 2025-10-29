import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Elimina el token al cargar el componente
  useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  // Validaciones
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) =>
    password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email !== 'sistemas@somosbauhaus.com.ar' || password !== 'Bauhaus2025') {
      setError('Credenciales incorrectas');
      return;
    }
    // Simula guardar el token ficticio
    localStorage.setItem('token', 'fake-token');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-400 px-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Imagen lado izquierdo */}
        <div className="md:w-1/2 flex items-center justify-center bg-[#1d3570] p-12">
          <img
            src="/img/logo.png"
            alt="Bauhaus Logo"
            className="w-56 h-56 object-contain"
          />
        </div>
        {/* Formulario lado derecho */}
        <div className="md:w-1/2 w-full p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-extrabold mb-8 text-center text-blue-700">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 text-lg">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-lg"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-lg">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-12 text-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <span
                  className="absolute right-3 top-3 text-2xl text-gray-500 hover:text-blue-600 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  role="button"
                  tabIndex={0}
                >
                  {showPassword ? FiEyeOff({}) : FiEye({})}
                </span>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-base text-center">{error}</div>
            )}
            <div className="flex flex-col space-y-4">
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-xl"
              >
                Ingresar
              </Button>
             
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;