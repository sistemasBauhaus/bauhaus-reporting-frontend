const API_URL = process.env.REACT_APP_API_URL;

export interface NivelTanque {
  id_tanque: number;
  producto: string;
  capacidad: number;
  nivel_actual: number;
  temperatura: number;
  fecha_actualizacion: string;
  porcentaje: number;
}

export const fetchNivelesTanques = async (): Promise<NivelTanque[]> => {
  const response = await fetch(`${API_URL}/tanques/niveles`);
  const data = await response.json();
  console.log('Datos tanques recibidos:', data);
  return data.map((tanque: any) => ({
    ...tanque,
    porcentaje: (tanque.nivel_actual / tanque.capacidad) * 100,
  }));
};