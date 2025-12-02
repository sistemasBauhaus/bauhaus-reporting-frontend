// Consulta el histórico de un tanque por id y fecha (YYYY-MM-DD)
export interface HistoricoTanque {
  id_tanque: number;
  producto: string;
  capacidad: number;
  nivel: number;
  temperatura: number;
  fecha: string;
}

export const fetchTanqueHistorico = async (idTanque: number, fecha: string): Promise<HistoricoTanque> => {
  const response = await fetch(`${API_URL}/tanques/historico?idTanque=${idTanque}&fecha=${fecha}`);
  if (!response.ok) throw new Error('No se pudo obtener el histórico del tanque');
  return await response.json();
};

const API_URL = process.env.REACT_APP_API_URL;

// Consulta el histórico mensual de un tanque por id, mes y año
export interface HistoricoTanqueDia {
  id_tanque: number;
  producto: string;
  capacidad: number;
  nivel: number;
  temperatura: number;
  fecha: string;
}

export const fetchTanqueHistoricoMes = async (
  idTanque: number,
  mes: number,
  anio: number
): Promise<HistoricoTanqueDia[]> => {
  const response = await fetch(`${API_URL}/tanques/historico-mes?idTanque=${idTanque}&mes=${mes}&anio=${anio}`);
  if (!response.ok) throw new Error('No se pudo obtener el histórico mensual del tanque');
  return await response.json();
};

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