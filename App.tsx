
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { DashboardScreen } from './components/DashboardScreen';
import { AirportBoard } from './components/AirportBoard';
import { TeamManager } from './components/TeamManager';
import { CargoManager } from './components/CargoManager';
import { UnitManager } from './components/UnitManager';
import { UsersScreen } from './components/UsersScreen';
import { LoginScreen } from './components/LoginScreen';
import { Team, Cargo, ViewMode, CargoStatus, Unit, User } from './types';
import { Database, WifiOff, Wifi } from 'lucide-react';
import { unitsApi, teamsApi, cargosApi, pingApi } from './sheetsApi';
import { useRealtimeSync } from './useRealtimeSync';

// ── Diagnostic Logger ─────────────────────────────────────────
const diagLog = (stage: string, data?: unknown) => {
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const msg = `[DIAG ${ts}] ▶ ${stage}`;
  if (data !== undefined) {
    console.groupCollapsed(msg);
    console.log(data);
    console.groupEnd();
  } else {
    console.log(msg);
  }
};
const diagError = (stage: string, err: unknown) => {
  const ts = new Date().toISOString().slice(11, 23);
  console.error(`[DIAG ${ts}] ❌ ${stage}`, err);
};

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
};

const USERS_KEY = 'users_v2';

const App: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [view, setView] = useState<ViewMode>('DASHBOARD');
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [syncError, setSyncError] = useState<string>('');

  // ----------------------------------------------------------------
  // Carregamento inicial
  // ----------------------------------------------------------------
  const loadData = useCallback(async () => {
    diagLog('LOAD_DATA — iniciando carregamento');
    setIsSyncing(true);
    setSyncError('');

    try {
      diagLog('PING_API — verificando conectividade com a API');
      const apiAvailable = await pingApi();
      diagLog('PING_API — resultado', { apiAvailable, url: import.meta.env.VITE_SHEETS_API_URL });
      setIsOnline(apiAvailable);

      if (apiAvailable) {
        const loadSafe = async <T,>(fn: () => Promise<T[]>, key: string): Promise<T[]> => {
          diagLog(`LOAD_ENTITY — buscando "${key}" da API`);
          try {
            const data = await fn();
            diagLog(`LOAD_ENTITY ✓ "${key}"`, { count: data.length });
            localStorage.setItem(key, JSON.stringify(data));
            return data;
          } catch (e: any) {
            diagError(`LOAD_ENTITY "${key}" — falhou, usando cache local`, e);
            const cached = localStorage.getItem(key);
            diagLog(`LOAD_ENTITY ⚠ "${key}" — cache local`, { found: !!cached });
            return cached ? JSON.parse(cached) : [];
          }
        };

        const [remoteUnits, remoteTeams, remoteCargos] = await Promise.all([
          loadSafe<Unit>(unitsApi.getAll, 'units_v2'),
          loadSafe<Team>(teamsApi.getAll, 'teams_v2'),
          loadSafe<Cargo>(cargosApi.getAll, 'cargos_v2'),
        ]);

        diagLog('LOAD_DATA ✓ remoto completo', {
          units: remoteUnits.length,
          teams: remoteTeams.length,
          cargos: remoteCargos.length,
        });
        setUnits(remoteUnits);
        setTeams(remoteTeams);
        setCargos(remoteCargos);
      } else {
        // Sem API: carrega do localStorage (modo offline)
        diagLog('LOAD_DATA ⚠ offline — carregando localStorage');
        const savedUnits = localStorage.getItem('units_v2');
        const savedTeams = localStorage.getItem('teams_v2');
        const savedCargos = localStorage.getItem('cargos_v2');
        diagLog('LOAD_DATA localStorage', {
          units: savedUnits ? JSON.parse(savedUnits).length : 'vazio',
          teams: savedTeams ? JSON.parse(savedTeams).length : 'vazio',
          cargos: savedCargos ? JSON.parse(savedCargos).length : 'vazio',
        });

        if (savedUnits) setUnits(JSON.parse(savedUnits));
        if (savedTeams) setTeams(JSON.parse(savedTeams));
        if (savedCargos) setCargos(JSON.parse(savedCargos));

        if (!import.meta.env.VITE_SHEETS_API_URL) {
          setSyncError('API não configurada. Configure VITE_SHEETS_API_URL no .env.local');
        } else {
          setSyncError('Sem conexão com o Google Sheets. Usando dados locais.');
        }
      }
    } catch (err: any) {
      diagError('LOAD_DATA — erro geral na inicialização', err);
      setSyncError('Erro ao carregar: ' + err.message);
      const savedUnits = localStorage.getItem('units_v2');
      const savedTeams = localStorage.getItem('teams_v2');
      const savedCargos = localStorage.getItem('cargos_v2');
      if (savedUnits) setUnits(JSON.parse(savedUnits));
      if (savedTeams) setTeams(JSON.parse(savedTeams));
      if (savedCargos) setCargos(JSON.parse(savedCargos));
    }

    diagLog('LOAD_DATA ✓ concluído — carregando usuários');
    loadUsers();
    setIsSyncing(false);
    diagLog('LOAD_DATA ✓✓ pronto');
  }, []);

  useEffect(() => {
    // Diagnóstico: executa apenas uma vez na montagem
    diagLog('APP_MOUNT — React tree montado (uma vez)');
    diagLog('ENV', {
      VITE_SHEETS_API_URL: import.meta.env.VITE_SHEETS_API_URL ?? '(não definida)',
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      userAgent: navigator.userAgent,
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Sincronização em tempo real (polling + Visibility API + BroadcastChannel) ──
  const syncState = useRealtimeSync({
    intervalMs: 30_000,          // atualiza a cada 30 segundos
    enabled: !!currentUser,      // só quando logado
    onSync: loadData,
  });

  // ----------------------------------------------------------------
  // Usuários (localStorage, sem persistência remota para segurança)
  // ----------------------------------------------------------------
  const loadUsers = () => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    let parsedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [];

    const hasAdmin = parsedUsers.some(u => u.role === 'ADMIN');
    if (!hasAdmin) {
      parsedUsers.unshift({
        id: generateId(),
        name: 'Administrador',
        email: 'admin@logistica.com',
        password: 'admin',
        role: 'ADMIN',
        allowedMenus: ['DASHBOARD', 'CARGOS_LIST', 'CARGO_ENTRY', 'TEAMS', 'UNITS', 'USERS', 'TV_PANEL']
      });
    }
    setUsers(parsedUsers);
    return parsedUsers;
  };

  useEffect(() => {
    if (users.length) localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  // ----------------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------------
  const handleLogin = (email: string, password?: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (!user.password || user.password === password) {
        setCurrentUser(user);
        setLoginError('');
      } else {
        setLoginError('Senha incorreta.');
      }
    } else {
      setLoginError('Usuário não encontrado.');
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  // ----------------------------------------------------------------
  // UNITS
  // ----------------------------------------------------------------
  const addUnit = async (unitData: Omit<Unit, 'id'>) => {
    setIsSyncing(true);
    const newUnit: Unit = { ...unitData, id: generateId() };
    try {
      if (isOnline) await unitsApi.create(newUnit);
    } catch (e) { /* offline */ }
    setUnits(prev => {
      const next = [...prev, newUnit];
      localStorage.setItem('units_v2', JSON.stringify(next));
      return next;
    });
    setIsSyncing(false);
  };

  const updateUnit = async (id: string, updated: Omit<Unit, 'id'>) => {
    setIsSyncing(true);
    const full: Unit = { ...updated, id };
    try {
      if (isOnline) await unitsApi.update(id, full);
    } catch (e) { /* offline */ }
    setUnits(prev => {
      const next = prev.map(u => u.id === id ? full : u);
      localStorage.setItem('units_v2', JSON.stringify(next));
      return next;
    });
    setTeams(prev => prev.map(t => t.unitId === id ? { ...t, unit: updated.name } : t));
    setCargos(prev => prev.map(c => c.unitId === id ? { ...c, unit: updated.name } : c));
    setIsSyncing(false);
  };

  const deleteUnit = async (id: string) => {
    if (!window.confirm('Excluir esta unidade?')) return;
    setIsSyncing(true);
    try {
      if (isOnline) await unitsApi.delete(id);
    } catch (e) { /* offline */ }
    setUnits(prev => {
      const next = prev.filter(u => u.id !== id);
      localStorage.setItem('units_v2', JSON.stringify(next));
      return next;
    });
    setTeams(prev => prev.map(t => t.unitId === id ? { ...t, unitId: '', unit: 'N/A' } : t));
    setCargos(prev => prev.map(c => c.unitId === id ? { ...c, unitId: '', unit: 'N/A' } : c));
    setIsSyncing(false);
  };

  // ----------------------------------------------------------------
  // TEAMS
  // ----------------------------------------------------------------
  const addTeam = async (teamData: Omit<Team, 'id'>) => {
    setIsSyncing(true);
    const unit = units.find(u => u.id === teamData.unitId);
    const newTeam: Team = { ...teamData, unit: unit?.name || 'N/A', id: generateId() };
    try {
      if (isOnline) await teamsApi.create(newTeam);
    } catch (e) { /* offline */ }
    setTeams(prev => {
      const next = [...prev, newTeam];
      localStorage.setItem('teams_v2', JSON.stringify(next));
      return next;
    });
    setIsSyncing(false);
  };

  const updateTeam = async (id: string, updated: Omit<Team, 'id'>) => {
    setIsSyncing(true);
    const unit = units.find(u => u.id === updated.unitId);
    const full: Team = { ...updated, unit: unit?.name || 'N/A', id };
    try {
      if (isOnline) await teamsApi.update(id, full);
    } catch (e) { /* offline */ }
    setTeams(prev => {
      const next = prev.map(t => t.id === id ? full : t);
      localStorage.setItem('teams_v2', JSON.stringify(next));
      return next;
    });
    setIsSyncing(false);
  };

  const deleteTeam = async (id: string) => {
    if (!window.confirm('Excluir esta equipe?')) return;
    setIsSyncing(true);
    try {
      if (isOnline) await teamsApi.delete(id);
    } catch (e) { /* offline */ }
    setTeams(prev => {
      const next = prev.filter(t => t.id !== id);
      localStorage.setItem('teams_v2', JSON.stringify(next));
      return next;
    });
    setCargos(prev => prev.filter(c => c.teamId !== id));
    setIsSyncing(false);
  };

  // ----------------------------------------------------------------
  // CARGOS
  // ----------------------------------------------------------------
  const addCargo = async (cargo: Omit<Cargo, 'id' | 'status'>) => {
    setIsSyncing(true);
    const unit = units.find(u => u.id === cargo.unitId);
    const newCargo: Cargo = {
      ...cargo,
      unit: unit?.name || 'N/A',
      id: generateId(),
      status: CargoStatus.PROGRAMADO
    };
    try {
      if (isOnline) await cargosApi.create(newCargo);
    } catch (e) { /* offline */ }
    setCargos(prev => {
      const next = [...prev, newCargo];
      localStorage.setItem('cargos_v2', JSON.stringify(next));
      return next;
    });
    setView('DASHBOARD');
    setIsSyncing(false);
  };

  const updateCargo = async (id: string, updated: Partial<Cargo>) => {
    setIsSyncing(true);
    const unit = units.find(u => u.id === updated.unitId);
    const cargoToUpdate = cargos.find(c => c.id === id);
    if (!cargoToUpdate) { setIsSyncing(false); return; }
    const merged: Cargo = {
      ...cargoToUpdate,
      ...updated,
      unit: unit ? unit.name : (updated.unit || cargoToUpdate.unit)
    };
    try {
      if (isOnline) await cargosApi.update(id, merged);
    } catch (e) { /* offline */ }
    setCargos(prev => {
      const next = prev.map(c => c.id === id ? merged : c);
      localStorage.setItem('cargos_v2', JSON.stringify(next));
      return next;
    });
    setEditingCargo(null);
    setView('DASHBOARD');
    setIsSyncing(false);
  };

  const deleteCargo = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir esta carga?')) return;
    setIsSyncing(true);
    try {
      if (isOnline) await cargosApi.delete(id);
    } catch (e) { /* offline */ }
    setCargos(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem('cargos_v2', JSON.stringify(next));
      return next;
    });
    if (editingCargo?.id === id) setEditingCargo(null);
    setIsSyncing(false);
  };

  const clearAllCargos = async () => {
    if (!window.confirm('Limpar TODAS as cargas? Isso não pode ser desfeito.')) return;
    setIsSyncing(true);
    try {
      if (isOnline) await cargosApi.deleteAll();
    } catch (e) { /* offline */ }
    setCargos([]);
    localStorage.setItem('cargos_v2', JSON.stringify([]));
    setIsSyncing(false);
  };

  const startCargo = (id: string) => {
    const now = new Date();
    const dateTime = now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const horario_inicio = now.toISOString(); // timestamp completo para auditoria
    updateCargo(id, { status: CargoStatus.CARREGANDO, startTime: dateTime, horario_inicio });
  };

  const endCargo = (id: string) => {
    const now = new Date();
    const dateTime = now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('pt-BR');
    const horario_fim = now.toISOString(); // timestamp completo para auditoria
    updateCargo(id, { status: CargoStatus.FINALIZADO, endTime: dateTime, endDate: date, horario_fim });
  };

  const handleEditCargo = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setView('CARGO_ENTRY');
  };

  // ----------------------------------------------------------------
  // USERS
  // ----------------------------------------------------------------
  const addUser = async (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: generateId() };
    setUsers(prev => [...prev, newUser]);
    if (!currentUser) setCurrentUser(newUser);
  };

  const updateUser = async (id: string, updated: Partial<User>) => {
    setUsers(prev => {
      const next = prev.map(u => u.id === id ? { ...u, ...updated } : u);
      if (currentUser?.id === id) setCurrentUser(next.find(u => u.id === id) || null);
      return next;
    });
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Excluir este usuário?')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser?.id === id) setCurrentUser(null);
  };

  // ----------------------------------------------------------------
  // Filtros por unidade permitida
  // ----------------------------------------------------------------
  const isAdmin = currentUser?.role === 'ADMIN';
  const noFilter = !currentUser?.allowedUnits || currentUser.allowedUnits.length === 0;
  const filteredUnits  = isAdmin || noFilter ? units  : units.filter(u  => currentUser.allowedUnits!.includes(u.id));
  const filteredTeams  = isAdmin || noFilter ? teams  : teams.filter(t  => currentUser.allowedUnits!.includes(t.unitId));
  const filteredCargos = isAdmin || noFilter ? cargos : cargos.filter(c => currentUser.allowedUnits!.includes(c.unitId));

  return (
    <Layout
      view={view}
      setView={setView}
      onReset={() => {}}
      units={filteredUnits}
      currentUser={currentUser}
      users={users}
      setCurrentUser={setCurrentUser}
    >
      {/* Indicador de sync */}
      <div className={`fixed top-4 right-8 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all duration-500 ${
        isSyncing
          ? 'opacity-100 translate-y-0 bg-slate-900/80 border border-slate-800'
          : 'opacity-0 -translate-y-4 pointer-events-none bg-transparent'
      }`}>
        <Database size={12} className="text-yellow-500 animate-bounce" />
        <span className="text-[9px] font-black text-white uppercase tracking-widest">Sincronizando...</span>
      </div>

      {/* Badge de status da conexão */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all duration-700 ${
        syncError
          ? 'opacity-100 bg-red-900/80 border-red-700'
          : 'opacity-0 pointer-events-none bg-transparent border-transparent'
      }`}>
        <WifiOff size={12} className="text-red-400" />
        <span className="text-[9px] font-black text-red-200 uppercase tracking-widest max-w-xs truncate">{syncError}</span>
      </div>

      {view === 'DASHBOARD' && (
        <DashboardScreen cargos={filteredCargos} teams={filteredTeams} units={filteredUnits} />
      )}
      {view === 'TV_PANEL' && (
        <DashboardScreen cargos={filteredCargos} teams={filteredTeams} units={filteredUnits} />
      )}
      {view === 'CARGOS_LIST' && (
        <AirportBoard
          cargos={filteredCargos} teams={filteredTeams} units={filteredUnits}
          onStart={startCargo} onEnd={endCargo}
          onDelete={deleteCargo} onEdit={handleEditCargo}
          onClearAll={clearAllCargos}
          syncState={syncState}
        />
      )}
      {view === 'UNITS' && (
        <UnitManager units={filteredUnits} onAdd={addUnit} onUpdate={updateUnit} onDelete={deleteUnit} />
      )}
      {view === 'TEAMS' && (
        <TeamManager teams={filteredTeams} units={filteredUnits} onAdd={addTeam} onUpdate={updateTeam} onDelete={deleteTeam} />
      )}
      {view === 'USERS' && (
        <UsersScreen users={users} units={units} onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} />
      )}
      {view === 'CARGO_ENTRY' && (
        <CargoManager
          cargos={filteredCargos} teams={filteredTeams} units={filteredUnits}
          onAdd={addCargo}
          onBulkAdd={(list) => list.forEach(addCargo)}
          onUpdate={updateCargo} onDelete={deleteCargo} onEdit={handleEditCargo}
          editingCargo={editingCargo}
          onCancel={() => { setEditingCargo(null); setView('DASHBOARD'); }}
        />
      )}
    </Layout>
  );
};

export default App;
