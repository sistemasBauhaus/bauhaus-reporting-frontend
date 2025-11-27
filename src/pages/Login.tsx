import React, { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import { login } from "../api/auth";

const Login: React.FC = () => {
    const { permisos } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
    // Validaciones en tiempo real
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password: string) => password.length >= 6;
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear(); // limpia datos anteriores
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      // guardar datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.user));
      localStorage.setItem("empresaId", data.user.empresaId || "");
      localStorage.setItem("rol", data.user.rol || "");

      // guardar permisos
      if (data.user?.permisos) {
        localStorage.setItem("permisos", JSON.stringify(data.user.permisos));
      }

      // Navegar a la primera ruta permitida
      const routes = [
        { path: "/dashboard", permiso: "menu.inicio" },
        { path: "/reporte-diario", permiso: "menu.reporte_diario" },
        { path: "/usuarios", permiso: "menu.gestion_usuarios" },
        { path: "/reportes", permiso: "menu.ventas_diarias" }
      ];
      const userPermisos = data.user?.permisos || [];
      const found = routes.find(r => userPermisos.includes(r.permiso));
      navigate(found ? found.path : "/login");

    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bauhaus-light to-bauhaus px-2 sm:px-4 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        {/* Imagen lado izquierdo */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-br from-bauhaus to-bauhaus-dark p-6 sm:p-10 md:p-16 min-h-[220px] sm:min-h-[320px] md:min-h-[400px] dark:from-gray-900 dark:to-gray-800">
            <img
              src="/img/logo.png"
              alt="Logo Bauhaus"
              className="w-[180px] h-[80px] sm:w-[260px] sm:h-[120px] md:w-[340px] md:h-[190px] object-contain drop-shadow-xl mb-4 sm:mb-8"
            />
          </div>
        {/* Formulario lado derecho */}
          <div className="w-full md:w-1/2 flex items-center justify-center bg-white dark:bg-gray-900 p-4 sm:p-8 md:p-16 min-h-[220px] sm:min-h-[320px] md:min-h-[400px]">
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg flex flex-col justify-center shadow-lg rounded-xl p-4 sm:p-8 md:p-12 bg-white dark:bg-gray-900">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 text-center text-bauhaus dark:text-white">Iniciar sesión</h2>
            <p className="text-base sm:text-lg text-center text-bauhaus-dark dark:text-gray-300 mb-4 sm:mb-6 animate-fade-in">Bienvenido/a, ingresa tus credenciales para acceder al sistema.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-2">Email</label>
                <input
                  type="email"
                  className={`w-full px-4 py-2 border border-bauhaus rounded text-base sm:text-lg focus:ring focus:ring-bauhaus-light dark:bg-gray-800 dark:text-white ${emailTouched && !validateEmail(email) ? 'border-red-400' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  required
                />
                {emailTouched && !validateEmail(email) && (
                  <span className="text-red-500 text-sm animate-fade-in">Email inválido</span>
                )}
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-4 py-2 border border-bauhaus rounded text-base sm:text-lg pr-12 focus:ring focus:ring-bauhaus-light dark:bg-gray-800 dark:text-white ${passwordTouched && !validatePassword(password) ? 'border-red-400' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    required
                  />
                  <span
                    className="absolute right-3 top-3 text-2xl cursor-pointer text-bauhaus hover:text-bauhaus-dark dark:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? FiEyeOff({}) : FiEye({})}
                  </span>
                </div>
                {passwordTouched && !validatePassword(password) && (
                  <span className="text-red-500 text-sm animate-fade-in">La contraseña debe tener al menos 6 caracteres</span>
                )}
              </div>
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  className="text-bauhaus hover:underline text-sm font-medium dark:text-bauhaus-light"
                  onClick={() => alert('Funcionalidad de recuperación próximamente')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-center animate-shake animate-fade-in">{error}</p>
              )}
              <Button className="w-full py-2 sm:py-3 text-base sm:text-lg bg-bauhaus text-white rounded-lg hover:bg-bauhaus-dark transition flex items-center justify-center gap-2 dark:bg-bauhaus-dark dark:hover:bg-bauhaus" disabled={loading || !validateEmail(email) || !validatePassword(password)}>
                {loading ? (
                  <span className="animate-pulse">Cargando...</span>
                ) : (
                  <>
                    {FiLogIn({ className: "text-2xl" })}
                    <span>Ingresar</span>
                  </>
                )}
              </Button>
            </form>
            <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} Bauhaus. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
