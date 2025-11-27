import { useEffect, useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("usuario");
    const p = localStorage.getItem("permisos");
    const e = localStorage.getItem("empresaId");
    const r = localStorage.getItem("rol");

    setToken(t);
    setUsuario(u ? JSON.parse(u) : null);
    setPermisos(p ? JSON.parse(p) : []);
    setEmpresaId(e ? Number(e) : null);
    setRol(r || null);
  }, []);

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUsuario(null);
    setPermisos([]);
    setEmpresaId(null);
    setRol(null);
  };

  return {
    token,
    usuario,
    permisos,
    empresaId,
    rol,
    isLogged: !!token,
    hasPermiso: (permiso: string) => permisos.includes(permiso),
    logout
  };
}
