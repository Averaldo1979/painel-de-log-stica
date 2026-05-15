
export enum CargoStatus {
  PROGRAMADO = 'PROGRAMADO',
  CARREGANDO = 'CARREGANDO',
  FINALIZADO = 'FINALIZADO',
  ATRASADO = 'ATRASADO'
}

export interface Unit {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  number: string;
  unitId: string;
  unit: string;
}

export interface Cargo {
  id: string;
  cargoNumber: string; 
  slaughterTime: string; 
  teamId: string;
  integrated: string;
  city: string;
  pickupTime: string; 
  birdCount: number;
  totalLoad: number;
  unitId: string;
  unit: string;
  status: CargoStatus;
  startTime?: string;          // HH:MM (legado — exibição)
  endTime?: string;            // HH:MM (legado — exibição)
  endDate?: string;            // DD/MM/YYYY (legado — exibição)
  horario_inicio?: string;     // ISO 8601 — timestamp completo de início da operação
  horario_fim?: string;        // ISO 8601 — timestamp completo de finalização da operação
}

export type ViewMode = 'DASHBOARD' | 'CARGOS_LIST' | 'TEAMS' | 'CARGO_ENTRY' | 'UNITS' | 'LOADING' | 'USERS' | 'TV_PANEL';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'USER';
  allowedMenus: ViewMode[];
  allowedUnits?: string[];
}
