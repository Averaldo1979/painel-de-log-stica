
// =============================================================
// sheetsApi.ts — Camada de serviço: React → Google Apps Script
// =============================================================
// Configure a URL abaixo após publicar o Apps Script como
// "Aplicativo da Web" com acesso "Qualquer pessoa".
// =============================================================

import { Unit, Team, Cargo } from './types';

// Leia a URL da variável de ambiente (configure no .env.local)
const API_URL = import.meta.env.VITE_SHEETS_API_URL as string;

// ---------------------------------------------------------------
// Utilitário de requisição
// ---------------------------------------------------------------

async function apiGet<T>(entity: string): Promise<T[]> {
  if (!API_URL) throw new Error('VITE_SHEETS_API_URL não configurada');
  const url = `${API_URL}?entity=${entity}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data as T[];
}

async function apiPost<T>(body: object): Promise<T> {
  if (!API_URL) throw new Error('VITE_SHEETS_API_URL não configurada');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script exige text/plain para evitar preflight CORS
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

// ---------------------------------------------------------------
// UNITS
// ---------------------------------------------------------------
export const unitsApi = {
  getAll: () => apiGet<Unit>('units'),
  create: (data: Unit) => apiPost<Unit>({ action: 'create', entity: 'units', data }),
  update: (id: string, data: Unit) => apiPost<Unit>({ action: 'update', entity: 'units', id, data }),
  delete: (id: string) => apiPost<void>({ action: 'delete', entity: 'units', id }),
  replaceAll: (data: Unit[]) => apiPost<void>({ action: 'replaceAll', entity: 'units', data }),
};

// ---------------------------------------------------------------
// TEAMS
// ---------------------------------------------------------------
export const teamsApi = {
  getAll: () => apiGet<Team>('teams'),
  create: (data: Team) => apiPost<Team>({ action: 'create', entity: 'teams', data }),
  update: (id: string, data: Team) => apiPost<Team>({ action: 'update', entity: 'teams', id, data }),
  delete: (id: string) => apiPost<void>({ action: 'delete', entity: 'teams', id }),
  replaceAll: (data: Team[]) => apiPost<void>({ action: 'replaceAll', entity: 'teams', data }),
};

// ---------------------------------------------------------------
// CARGOS
// ---------------------------------------------------------------
export const cargosApi = {
  getAll: () => apiGet<Cargo>('cargos'),
  create: (data: Cargo) => apiPost<Cargo>({ action: 'create', entity: 'cargos', data }),
  update: (id: string, data: Cargo) => apiPost<Cargo>({ action: 'update', entity: 'cargos', id, data }),
  delete: (id: string) => apiPost<void>({ action: 'delete', entity: 'cargos', id }),
  deleteAll: () => apiPost<void>({ action: 'deleteAll', entity: 'cargos', data: [] }),
  replaceAll: (data: Cargo[]) => apiPost<void>({ action: 'replaceAll', entity: 'cargos', data }),
};

// ---------------------------------------------------------------
// Verifica conectividade com a API
// ---------------------------------------------------------------
export async function pingApi(): Promise<boolean> {
  try {
    if (!API_URL) return false;
    const url = `${API_URL}?action=ping`;
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}
