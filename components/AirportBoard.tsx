
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  CheckCircle, 
  Check,
  Trash2, 
  Edit2, 
  AlertCircle, 
  ListX, 
  Clock, 
  Calendar, 
  Zap, 
  Bird, 
  Hash, 
  Radio, 
  Filter, 
  XCircle,
  Building2,
  Users as UsersIcon,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Cargo, Team, CargoStatus, Unit } from '../types';
import { SyncState } from '../useRealtimeSync';

interface AirportBoardProps {
  cargos: Cargo[];
  teams: Team[];
  units: Unit[];
  onStart: (id: string) => void;
  onEnd: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (cargo: Cargo) => void;
  onClearAll: () => void;
  isTvMode?: boolean;
  syncState?: SyncState;
}

export const AirportBoard: React.FC<AirportBoardProps> = ({ 
  cargos, 
  teams, 
  units,
  onStart, 
  onEnd, 
  onDelete, 
  onEdit,
  onClearAll,
  isTvMode = false,
  syncState
}) => {
  const [now, setNow] = useState(new Date());
  
  // Filtros
  const [filterUnitId, setFilterUnitId] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterSlaughterDate, setFilterSlaughterDate] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTeamLabel = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? `EQP ${team.number}` : '---';
  };

  const getEffectiveStatus = (cargo: Cargo): CargoStatus => {
    if (cargo.status === CargoStatus.PROGRAMADO) {
      const scheduledDate = new Date(cargo.pickupTime);
      if (now > scheduledDate) return CargoStatus.ATRASADO;
    }
    return cargo.status;
  };

  const formatDateTime = (isoString: string): { date: string; time: string; isPast: boolean } => {
    if (!isoString) return { date: '---', time: '---', isPast: false };
    try {
      const scheduledDate = new Date(isoString);
      if (isNaN(scheduledDate.getTime())) return { date: '---', time: isoString || '---', isPast: false };
      return {
        date: scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        time: scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isPast: now > scheduledDate
      };
    } catch {
      return { date: '---', time: isoString || '---', isPast: false };
    }
  };

  // Calcula duração entre dois timestamps ISO
  const calcDuracao = (inicio?: string, fim?: string): string | null => {
    if (!inicio) return null;
    try {
      const t0 = new Date(inicio).getTime();
      const t1 = fim ? new Date(fim).getTime() : now.getTime();
      if (isNaN(t0) || isNaN(t1)) return null;
      const totalMin = Math.round((t1 - t0) / 60000);
      if (totalMin < 0) return null;
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return h > 0 ? `${h}h ${m.toString().padStart(2,'0')}m` : `${m}m`;
    } catch {
      return null;
    }
  };

  const formatStopwatch = (inicio?: string, fim?: string): string | null => {
    if (!inicio) return null;
    try {
      const t0 = new Date(inicio).getTime();
      const t1 = fim ? new Date(fim).getTime() : now.getTime();
      if (isNaN(t0) || isNaN(t1)) return null;
      const totalSecs = Math.max(0, Math.floor((t1 - t0) / 1000));
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } catch {
      return null;
    }
  };

  const getStatusStyle = (status: string) => {
    const s = String(status).toUpperCase();
    if (s.includes('ATRASADO')) {
      return 'text-rose-400 bg-rose-500/10 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)] font-black animate-pulse';
    }
    if (s.includes('DESLOCAMENTO') || s.includes('TRÂNSITO') || s.includes('TRANSITO')) {
      return 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-black animate-pulse';
    }
    if (s.includes('CARREGANDO')) {
      return 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] font-black';
    }
    if (s.includes('FINALIZADO') || s.includes('CONCLUÍDO') || s.includes('CONCLUIDO')) {
      return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-bold';
    }
    // Default to PROGRAMADO / other
    return 'text-sky-400 bg-sky-500/10 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]';
  };

  const getStatusLabel = (status: string) => {
    const s = String(status).toUpperCase();
    if (s.includes('ATRASADO')) return 'Atrasado';
    if (s.includes('DESLOCAMENTO') || s.includes('TRÂNSITO') || s.includes('TRANSITO')) return 'Em Trânsito';
    if (s.includes('CARREGANDO')) return 'Carregando';
    if (s.includes('FINALIZADO')) return 'Finalizado';
    return 'Programado';
  };

  // Lógica de Filtragem e Ordenação
  const filteredAndSortedCargos = useMemo(() => {
    return cargos
      .filter(cargo => {
        const matchesUnit = !filterUnitId || cargo.unitId === filterUnitId;
        const matchesTeam = !filterTeamId || cargo.teamId === filterTeamId;
        
        let matchesDate = true;
        if (filterSlaughterDate) {
          const rawDate = cargo.slaughterTime ?? '';
          const cargoDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.substring(0, 10);
          matchesDate = !!cargoDate && cargoDate === filterSlaughterDate;
        }

        return matchesUnit && matchesTeam && matchesDate;
      })
      .sort((a, b) => {
        return String(a.cargoNumber ?? '').localeCompare(String(b.cargoNumber ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [cargos, filterUnitId, filterTeamId, filterSlaughterDate]);

  const clearFilters = () => {
    setFilterUnitId('');
    setFilterTeamId('');
    setFilterSlaughterDate('');
  };

  return (
    <div className="space-y-6">

      {/* ── Barra de Status em Tempo Real ── */}
      {syncState && (
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 ${
          syncState.isSyncing
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : syncState.errorCount > 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <div className="flex items-center gap-3">
            {/* Dot ao vivo */}
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                syncState.isSyncing ? 'bg-yellow-400' : syncState.errorCount > 0 ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                syncState.isSyncing ? 'bg-yellow-500' : syncState.errorCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
              }`} />
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              syncState.isSyncing ? 'text-yellow-400' : syncState.errorCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {syncState.isSyncing
                ? 'Sincronizando dados...'
                : syncState.errorCount > 0
                ? `Erro de conexão (${syncState.errorCount}x)`
                : 'Ao Vivo • Tempo Real'}
            </span>
            {!syncState.isSyncing && syncState.lastSync && (
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider hidden sm:inline">
                Atualizado: {syncState.lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!syncState.isSyncing && (
              <div className="flex items-center gap-2">
                <RefreshCw size={10} className="text-slate-600" />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                  Próx. em {syncState.nextSyncIn}s
                </span>
                {/* Barra de progresso do countdown */}
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-emerald-500/50 rounded-full transition-all duration-1000"
                    style={{ width: `${(1 - syncState.nextSyncIn / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {syncState.errorCount > 0 ? (
              <WifiOff size={14} className="text-red-500" />
            ) : (
              <Wifi size={14} className={syncState.isSyncing ? 'text-yellow-500 animate-pulse' : 'text-emerald-500'} />
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      {!isTvMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-br from-[#0f172a]/80 to-[#020617] p-5 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Building2 size={12} /> Unidade
            </label>
            <select 
              value={filterUnitId}
              onChange={(e) => setFilterUnitId(e.target.value)}
              className="w-full bg-[#020617]/50 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all text-xs font-black uppercase appearance-none"
            >
              <option value="">Todas</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <UsersIcon size={12} /> Equipe
            </label>
            <select 
              value={filterTeamId}
              onChange={(e) => setFilterTeamId(e.target.value)}
              className="w-full bg-[#020617]/50 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all text-xs font-black uppercase appearance-none"
            >
              <option value="">Todas</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>EQP {t.number}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Data de Abate
            </label>
            <input 
              type="date"
              value={filterSlaughterDate}
              onChange={(e) => setFilterSlaughterDate(e.target.value)}
              className="w-full bg-[#020617]/50 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all text-xs font-black uppercase"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={clearFilters}
              className="w-full py-2.5 bg-[#020617] hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700"
            >
              <XCircle size={14} /> Limpar
            </button>
          </div>
        </div>
      )}

      {/* Grid de Voos */}
      <div className="bg-transparent">
        {filteredAndSortedCargos.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 shadow-2xl py-20 text-center text-slate-700">
            <div className="flex flex-col items-center gap-3">
              <Radio size={32} className="opacity-10 animate-pulse" />
              <span className="uppercase font-black tracking-[0.2em] text-[10px]">
                {cargos.length > 0 ? 'Nenhum voo encontrado.' : 'Aguardando torre...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 pt-4 pb-8 px-1">
            {filteredAndSortedCargos.map((cargo) => {
              const pickup = formatDateTime(cargo.pickupTime);
              const slaughter = formatDateTime(cargo.slaughterTime);
              const effectiveStatus = getEffectiveStatus(cargo);
              const isDelayed = effectiveStatus === CargoStatus.ATRASADO;
              const isLoading = effectiveStatus === CargoStatus.CARREGANDO;
              
              return (
                <div key={cargo.id} className="relative pb-6 pt-2 drop-shadow-2xl hover:scale-[1.02] transition-transform duration-300 group">
                  <div className="flex items-stretch h-full">
                    {/* Trailer */}
                    <div 
                      className={`relative z-10 flex-1 w-full bg-gradient-to-br from-[#0f172a]/95 to-[#1e293b]/90 backdrop-blur-md border-y border-l border-white/5 rounded-l-3xl rounded-tr-md p-3.5 sm:p-4 lg:p-3.5 xl:p-4 flex flex-col justify-between
                        ${isDelayed ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] row-atrasado-blink' : ''} 
                        ${isLoading ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] row-carregando-blink' : 'shadow-xl'}`}
                    >
                      {/* Top vents / details */}
                      <div className="absolute top-0 left-0 w-full flex justify-center gap-1 opacity-20 px-4 pt-1 pointer-events-none">
                        {[...Array(6)].map((_, i) => <div key={i} className="flex-1 max-w-[36px] h-1 bg-slate-400 rounded-full"></div>)}
                      </div>
                      
                      <div className="space-y-3 pt-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="text-yellow-500 font-black text-base sm:text-lg airport-font drop-shadow-[0_0_8px_rgba(234,179,8,0.2)] truncate leading-none mb-1">
                              #{cargo.cargoNumber}
                            </div>
                            <div className="font-bold text-white text-xs sm:text-xs uppercase tracking-tight truncate leading-none">
                              {getTeamLabel(cargo.teamId)}
                            </div>
                          </div>
                          <div className="text-right shrink-0 max-w-[50%]">
                            <span className={`px-2 py-1 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider block text-center break-words leading-tight ${getStatusStyle(effectiveStatus)}`}>
                              {getStatusLabel(effectiveStatus)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-2 border-y border-slate-700/50 py-2">
                          <div className="min-w-0">
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Integrado</p>
                            <p className="text-slate-200 text-xs font-semibold uppercase break-words whitespace-normal line-clamp-2 leading-tight" title={cargo.integrated}>{cargo.integrated}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Origem/Cidade</p>
                            <p className="text-slate-400 text-xs font-semibold uppercase break-words whitespace-normal line-clamp-2 leading-tight" title={cargo.city}>{cargo.city}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Unidade Raízes</p>
                            <p className="text-slate-200 text-xs font-semibold uppercase break-words whitespace-normal line-clamp-2 leading-tight">{cargo.unit}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Aves / Peso</p>
                            <p className="text-slate-200 text-xs font-semibold uppercase leading-tight">
                              <span className="text-white">{(Number(cargo.birdCount) || 0).toLocaleString()}</span> / <span className="text-yellow-500">{(Number(cargo.totalLoad) || 0).toLocaleString()} K</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Hora Apanha</p>
                            <div className={`font-black text-sm sm:text-base ${isDelayed || isLoading ? 'text-white' : 'text-sky-400'} glow-text leading-none airport-font`}>
                              {pickup.time}
                            </div>
                            <div className="text-[8px] font-bold uppercase text-slate-600 mt-0.5">{pickup.date}</div>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Previsão Abate</p>
                            <div className="font-black text-sm sm:text-base text-yellow-500/80 leading-none airport-font">
                              {slaughter.time}
                            </div>
                            <div className="text-[8px] font-bold uppercase text-slate-600 mt-0.5">{slaughter.date}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 mt-3 pt-2.5 border-t border-slate-700/50">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {/* Horário de início */}
                          <div className="flex flex-col flex-1 min-w-[55px]">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Início</span>
                            <span className={`text-xs font-bold text-center airport-font py-0.5 rounded border ${cargo.horario_inicio ? 'text-sky-400 bg-sky-400/5 border-sky-400/20' : 'text-slate-600 bg-slate-800/20 border-slate-800'}`}>
                              {cargo.horario_inicio ? new Date(cargo.horario_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>
                          
                          {/* Horário de fim */}
                          <div className="flex flex-col flex-1 min-w-[55px]">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Fim</span>
                            <span className={`text-xs font-bold text-center airport-font py-0.5 rounded border ${cargo.horario_fim ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20' : 'text-slate-600 bg-slate-800/20 border-slate-800'}`}>
                              {cargo.horario_fim ? new Date(cargo.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>

                          {/* Cronômetro */}
                          <div className="flex flex-col flex-1 min-w-[65px]">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Duração</span>
                            <span className={`text-xs font-bold text-center airport-font py-0.5 rounded border tracking-wider ${
                              cargo.status === CargoStatus.CARREGANDO 
                                ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 animate-pulse' 
                                : cargo.status === CargoStatus.FINALIZADO && cargo.horario_inicio
                                ? 'text-slate-300 bg-slate-800/80 border-slate-700'
                                : 'text-slate-600 bg-slate-800/20 border-slate-800'
                            }`}>
                              {formatStopwatch(cargo.horario_inicio, cargo.horario_fim) ?? '--:--:--'}
                            </span>
                          </div>
                        </div>

                        {!isTvMode && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/30">
                            {cargo.status === CargoStatus.PROGRAMADO && (
                              <button 
                                onClick={() => onStart(cargo.id)} 
                                className="w-full py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(14,165,233,0.35)] hover:shadow-[0_0_20px_rgba(14,165,233,0.6)] active:scale-[0.98] z-20 relative flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Play size={12} className="fill-current" />
                                Iniciar Transporte
                              </button>
                            )}
                            {cargo.status === CargoStatus.CARREGANDO && (
                              <button 
                                onClick={() => onEnd(cargo.id)} 
                                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] active:scale-[0.98] z-20 relative flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Check size={12} strokeWidth={3} />
                                Finalizar Transporte
                              </button>
                            )}
                            
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => onEdit(cargo)} className="flex-1 py-1.5 flex items-center justify-center gap-1 text-slate-400 bg-slate-800/40 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all border border-slate-700 hover:border-yellow-500/30 z-20 relative cursor-pointer" title="Editar">
                                <Edit2 size={11} /> <span className="text-[10px] font-bold uppercase tracking-wider">Editar</span>
                              </button>
                              <button onClick={() => onDelete(cargo.id)} className="flex-1 py-1.5 flex items-center justify-center gap-1 text-slate-400 bg-slate-800/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-slate-700 hover:border-red-500/30 z-20 relative cursor-pointer" title="Excluir">
                                <Trash2 size={11} /> <span className="text-[10px] font-bold uppercase tracking-wider">Excluir</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cabin */}
                    <div className={`w-12 sm:w-16 lg:w-12 xl:w-14 2xl:w-12 self-stretch min-h-[110px] bg-gradient-to-b from-[#1e293b]/90 to-[#0f172a]/90 backdrop-blur-md border-y border-r border-white/5 rounded-r-[24px] relative z-0 flex flex-col justify-start pb-4 shrink-0 shadow-lg transition-all duration-300 ${isLoading ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : isDelayed ? 'border-red-500/50' : 'group-hover:border-slate-500/50'}`}>
                       {/* Window */}
                       <div className="mt-3.5 ml-1 mr-1.5 h-8 sm:h-11 lg:h-8 xl:h-10 bg-gradient-to-br from-sky-400/40 to-sky-600/20 border border-sky-400/30 rounded-tr-xl rounded-bl-md flex items-center justify-center relative overflow-hidden shrink-0">
                          {/* Glare effect */}
                          <div className="absolute -top-4 -left-4 w-12 h-16 bg-white/20 rotate-45"></div>
                          {isLoading && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping absolute bottom-1 right-1"></div>}
                       </div>
                       {/* Door handle */}
                       <div className="w-3.5 h-1 bg-slate-600 rounded-full ml-2 mt-3 shrink-0"></div>
                       
                       {/* Exhaust/Pipe details */}
                       <div className="absolute bottom-10 -left-1 w-1.5 h-10 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full border border-slate-800 hidden sm:block"></div>

                       {/* Front Grill/Lights */}
                       <div className="absolute bottom-3 right-0 w-2.5 h-5 bg-yellow-500 rounded-l-full blur-[1px] shadow-[0_0_10px_rgba(234,179,8,0.8)] z-10"></div>
                       <div className="absolute bottom-3 right-0 w-1.5 h-5 bg-white rounded-l-full z-20"></div>
                    </div>
                  </div>
                  
                  {/* Back Wheels */}
                  <div className="absolute -bottom-2.5 left-5 sm:left-8 flex gap-1 z-20">
                     <div className="w-9 h-9 sm:w-11 lg:w-9 xl:w-10 2xl:w-9 bg-[#0a0a0a] rounded-full border-[2px] sm:border-[2.5px] border-slate-400 flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                        <div className="w-3 h-3 sm:w-4 lg:w-3 xl:w-3.5 2xl:w-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border border-slate-500"></div>
                        {isLoading && <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-yellow-500/50 animate-[spin_2s_linear_infinite]"></div>}
                     </div>
                     <div className="w-9 h-9 sm:w-11 lg:w-9 xl:w-10 2xl:w-9 bg-[#0a0a0a] rounded-full border-[2px] sm:border-[2.5px] border-slate-400 flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                        <div className="w-3 h-3 sm:w-4 lg:w-3 xl:w-3.5 2xl:w-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border border-slate-500"></div>
                        {isLoading && <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-yellow-500/50 animate-[spin_2s_linear_infinite]"></div>}
                     </div>
                  </div>

                  {/* Front Wheel */}
                  <div className="absolute -bottom-2.5 right-2 xs:right-3 sm:right-4 lg:right-3 xl:right-3.5 z-20">
                     <div className="w-9 h-9 sm:w-11 lg:w-9 xl:w-10 2xl:w-9 bg-[#0a0a0a] rounded-full border-[2px] sm:border-[2.5px] border-slate-400 flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                        <div className="w-3 h-3 sm:w-4 lg:w-3 xl:w-3.5 2xl:w-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border border-slate-500"></div>
                        {isLoading && <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-yellow-500/50 animate-[spin_2s_linear_infinite]"></div>}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
