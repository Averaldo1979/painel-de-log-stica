
// =============================================================
// sheetsApi.ts — Camada de serviço: React → Google Apps Script
// =============================================================
// Configure a URL abaixo após publicar o Apps Script como
// "Aplicativo da Web" com acesso "Qualquer pessoa".
// =============================================================

import { Unit, Team, Cargo, User } from './types';

// Leia a URL da variável de ambiente (configure no .env.local)
const API_URL = import.meta.env.VITE_SHEETS_API_URL as string;

import { enqueueAction, getSyncQueue, removeActionFromQueue } from './offlineQueue';

// ---------------------------------------------------------------
// Utilitário de requisição
// ---------------------------------------------------------------

async function apiGet<T>(entity: string): Promise<T[]> {
  if (!API_URL) throw new Error('VITE_SHEETS_API_URL não configurada');
  const url = `${API_URL}?entity=${entity}`;
  const t0 = performance.now();
  console.log(`[DIAG API] GET ${entity} →`, url);
  const res = await fetch(url);
  console.log(`[DIAG API] GET ${entity} ← status=${res.status} (${(performance.now()-t0).toFixed(0)}ms)`);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data as T[];
}

async function apiPost<T>(body: object): Promise<T> {
  if (!API_URL) throw new Error('VITE_SHEETS_API_URL não configurada');
  const t0 = performance.now();
  console.log(`[DIAG API] POST`, body);
  let res;

  if (!navigator.onLine) {
    console.warn('[DIAG API] POST Offline (navigator.onLine=false), salvando na fila');
    enqueueAction(body);
    throw new Error('Offline');
  }

  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
  } catch (err) {
    console.warn('[DIAG API] POST Offline, salvando na fila:', err);
    enqueueAction(body);
    throw new Error('Offline');
  }

  console.log(`[DIAG API] POST ← status=${res.status} (${(performance.now()-t0).toFixed(0)}ms)`);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

export async function processSyncQueue() {
  const queue = getSyncQueue();
  if (queue.length === 0) return;
  if (!navigator.onLine) {
    console.log('[DIAG API] Offline. Ignorando processamento da fila.');
    return;
  }
  
  console.log(`[DIAG API] Processando ${queue.length} ações offline pendentes...`);
  for (const action of queue) {
    try {
      console.log(`[DIAG API] Processando fila ID ${action.id} (entidade: ${(action.body as any)?.entity})`);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(action.body),
        redirect: 'follow',
      });
      if (res.ok) {
        removeActionFromQueue(action.id);
      }
    } catch (e) {
      console.warn(`[DIAG API] Falha ao processar fila ID ${action.id}, continuará pendente.`);
      break; // Interrompe a fila se não tiver internet
    }
  }
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
// USERS
// ---------------------------------------------------------------
export const usersApi = {
  getAll: () => apiGet<User>('users'),
  create: (data: User) => apiPost<User>({ action: 'create', entity: 'users', data }),
  update: (id: string, data: User) => apiPost<User>({ action: 'update', entity: 'users', id, data }),
  delete: (id: string) => apiPost<void>({ action: 'delete', entity: 'users', id }),
  replaceAll: (data: User[]) => apiPost<void>({ action: 'replaceAll', entity: 'users', data }),
};

// ---------------------------------------------------------------
// Verifica conectividade com a API
// ---------------------------------------------------------------
export async function pingApi(): Promise<boolean> {
  try {
    if (!navigator.onLine) return false;
    if (!API_URL) {
      console.warn('[DIAG API] pingApi: VITE_SHEETS_API_URL não definida');
      return false;
    }
    const url = `${API_URL}?action=ping`;
    const t0 = performance.now();
    console.log('[DIAG API] ping →', url);
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    console.log(`[DIAG API] ping ← ok=${json.ok} (${(performance.now()-t0).toFixed(0)}ms)`);
    return json.ok === true;
  } catch (err) {
    console.error('[DIAG API] ping falhou:', err);
    return false;
  }
}
