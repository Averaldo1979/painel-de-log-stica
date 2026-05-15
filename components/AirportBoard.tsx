
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  CheckCircle, 
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
  Users as UsersIcon
} from 'lucide-react';
import { Cargo, Team, CargoStatus, Unit } from '../types';

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
  isTvMode = false
}) => {
  const [now, setNow] = useState(new Date());
  
  // Filtros
  const [filterUnitId, setFilterUnitId] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterSlaughterDate, setFilterSlaughterDate] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
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

  const getStatusStyle = (status: CargoStatus) => {
    switch (status) {
      case CargoStatus.PROGRAMADO: return 'text-sky-400 bg-sky-400/5 border-sky-400/30';
      case CargoStatus.CARREGANDO: return 'text-slate-950 bg-yellow-500 border-yellow-500 font-black shadow-[0_0_15px_rgba(234,179,8,0.4)]';
      case CargoStatus.FINALIZADO: return 'text-emerald-400 bg-emerald-400/5 border-emerald-400/30';
      case CargoStatus.ATRASADO: return 'text-white bg-red-600 border-red-500 font-black animate-pulse';
      default: return 'text-slate-400';
    }
  };

  // Lógica de Filtragem e Ordenação
  const filteredAndSortedCargos = useMemo(() => {
    return cargos
      .filter(cargo => {
        const matchesUnit = !filterUnitId || cargo.unitId === filterUnitId;
        const matchesTeam = !filterTeamId || cargo.teamId === filterTeamId;
        
        let matchesDate = true;
        if (filterSlaughterDate) {
          const cargoDate = cargo.slaughterTime.split('T')[0];
          matchesDate = cargoDate === filterSlaughterDate;
        }

        return matchesUnit && matchesTeam && matchesDate;
      })
      .sort((a, b) => {
        return a.cargoNumber.localeCompare(b.cargoNumber, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [cargos, filterUnitId, filterTeamId, filterSlaughterDate]);

  const clearFilters = () => {
    setFilterUnitId('');
    setFilterTeamId('');
    setFilterSlaughterDate('');
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      {!isTvMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#1e293b] p-4 rounded-xl border border-slate-700">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Building2 size={12} /> Unidade
            </label>
            <select 
              value={filterUnitId}
              onChange={(e) => setFilterUnitId(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-800 text-white rounded-lg py-2 px-3 outline-none focus:border-yellow-500/50 transition-all text-xs font-black uppercase appearance-none"
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
              className="w-full bg-[#0f172a] border border-slate-800 text-white rounded-lg py-2 px-3 outline-none focus:border-yellow-500/50 transition-all text-xs font-black uppercase appearance-none"
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
              className="w-full bg-[#0f172a] border border-slate-800 text-white rounded-lg py-2 px-3 outline-none focus:border-yellow-500/50 transition-all text-xs font-black uppercase"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={clearFilters}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600"
            >
              <XCircle size={14} /> Limpar
            </button>
          </div>
        </div>
      )}

      {/* Grid de Voos */}
      <div className="bg-[#020617]">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-12 pt-4 pb-8 px-2">
            {filteredAndSortedCargos.map((cargo) => {
              const pickup = formatDateTime(cargo.pickupTime);
              const slaughter = formatDateTime(cargo.slaughterTime);
              const effectiveStatus = getEffectiveStatus(cargo);
              const isDelayed = effectiveStatus === CargoStatus.ATRASADO;
              const isLoading = effectiveStatus === CargoStatus.CARREGANDO;
              
              return (
                <div key={cargo.id} className="relative pb-6 pt-2 drop-shadow-2xl hover:scale-[1.02] transition-transform duration-300 group">
                  <div className="flex items-end h-full">
                    {/* Trailer */}
                    <div 
                      className={`relative z-10 flex-1 w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-y border-l border-r border-slate-700/80 rounded-l-2xl rounded-tr-md p-5 flex flex-col justify-between
                        ${isDelayed ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] row-atrasado-blink' : ''} 
                        ${isLoading ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] row-carregando-blink' : 'shadow-xl'}`}
                    >
                      {/* Top vents / details */}
                      <div className="absolute top-0 left-0 w-full flex justify-around opacity-20 px-6 pt-1.5 pointer-events-none">
                        {[...Array(6)].map((_, i) => <div key={i} className="w-10 h-1.5 bg-slate-400 rounded-full"></div>)}
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-yellow-500 font-black text-xl airport-font drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                              #{cargo.cargoNumber}
                            </div>
                            <div className="font-bold text-white text-sm uppercase tracking-tight">
                              {getTeamLabel(cargo.teamId)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded bg-slate-800 border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(effectiveStatus)}`}>
                              {effectiveStatus}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-y border-slate-700/50 py-3">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Integrado</p>
                            <p className="text-slate-200 text-sm font-medium uppercase truncate" title={cargo.integrated}>{cargo.integrated}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Origem/Cidade</p>
                            <p className="text-slate-400 text-sm font-medium uppercase truncate" title={cargo.city}>{cargo.city}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Unidade Raízes</p>
                            <p className="text-slate-200 text-sm font-medium uppercase truncate">{cargo.unit}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Aves / Peso</p>
                            <p className="text-slate-200 text-sm font-medium uppercase">
                              <span className="text-white">{(Number(cargo.birdCount) || 0).toLocaleString()}</span> / <span className="text-yellow-500">{(Number(cargo.totalLoad) || 0).toLocaleString()} Kg</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Hora Apanha</p>
                            <div className={`font-black text-lg ${isDelayed || isLoading ? 'text-white' : 'text-sky-400'} glow-text leading-none airport-font`}>
                              {pickup.time}
                            </div>
                            <div className="text-[9px] font-black uppercase text-slate-600 mt-1">{pickup.date}</div>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Previsão Abate</p>
                            <div className="font-black text-lg text-yellow-500/80 leading-none airport-font">
                              {slaughter.time}
                            </div>
                            <div className="text-[9px] font-black uppercase text-slate-600 mt-1">{slaughter.date}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700/50">
                        <div className="text-[9px] font-black text-emerald-500/40 uppercase">
                          {cargo.status === CargoStatus.FINALIZADO ? `${cargo.endDate} ${cargo.endTime}` : ''}
                        </div>
                        {!isTvMode && (
                          <div className="flex justify-end gap-2">
                            {cargo.status === CargoStatus.PROGRAMADO && (
                              <button onClick={() => onStart(cargo.id)} className="px-3 py-1.5 bg-sky-500 text-slate-950 rounded-lg font-black text-[9px] uppercase hover:bg-white transition-all shadow-lg z-20 relative">
                                Iniciar
                              </button>
                            )}
                            {cargo.status === CargoStatus.CARREGANDO && (
                              <button onClick={() => onEnd(cargo.id)} className="px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-lg font-black text-[9px] uppercase hover:bg-white transition-all animate-pulse shadow-lg z-20 relative">
                                Finalizar
                              </button>
                            )}
                            <button onClick={() => onEdit(cargo)} className="p-2 text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all z-20 relative" title="Editar"><Edit2 size={16} /></button>
                            <button onClick={() => onDelete(cargo.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all z-20 relative" title="Excluir"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cabin */}
                    <div className={`w-14 sm:w-20 h-36 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-y border-r border-slate-700/80 rounded-r-3xl relative z-0 flex flex-col justify-start pb-4 shrink-0 shadow-lg transition-all duration-300 ${isLoading ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : isDelayed ? 'border-red-500/50' : 'group-hover:border-slate-500'}`}>
                       {/* Window */}
                       <div className="mt-4 ml-1 mr-2 h-14 bg-gradient-to-br from-sky-400/40 to-sky-600/20 border border-sky-400/30 rounded-tr-2xl rounded-bl-md flex items-center justify-center relative overflow-hidden">
                          {/* Glare effect */}
                          <div className="absolute -top-4 -left-4 w-12 h-16 bg-white/20 rotate-45"></div>
                          {isLoading && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping absolute bottom-2 right-2"></div>}
                       </div>
                       {/* Door handle */}
                       <div className="w-4 h-1.5 bg-slate-600 rounded-full ml-3 mt-4"></div>
                       
                       {/* Exhaust/Pipe details */}
                       <div className="absolute bottom-12 -left-1.5 w-2 h-16 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full border border-slate-800 hidden sm:block"></div>

                       {/* Front Grill/Lights */}
                       <div className="absolute bottom-5 right-0 w-2.5 h-6 bg-yellow-500 rounded-l-full blur-[1px] shadow-[0_0_10px_rgba(234,179,8,0.8)] z-10"></div>
                       <div className="absolute bottom-5 right-0 w-1.5 h-6 bg-white rounded-l-full z-20"></div>
                       
                       {/* Front Wheel */}
                       <div className="absolute -bottom-6 right-2 w-10 h-10 sm:w-12 sm:h-12 bg-[#0a0a0a] rounded-full border-[3.5px] border-slate-400 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-30">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border border-slate-500"></div>
                          {isLoading && <div className="absolute inset-0 rounded-full border-[2px] border-dashed border-yellow-500/50 animate-[spin_2s_linear_infinite]"></div>}
                       </div>
                    </div>
                  </div>
                  
                  {/* Back Wheels */}
                  <div className="absolute -bottom-2 left-6 sm:left-10 flex gap-1 sm:gap-2 z-20">
                     <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0a0a0a] rounded-full border-[3.5px] border-slate-400 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border border-slate-500"></div>
                        {isLoading && <div className="absolute inset-0 rounded-full border-[2px] border-dashed border-yellow-500/50 animate-[spin_2s_linear_infinite]"></div>}
                     </div>
                     <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0a0a0a] rounded-full border-[3.5px] border-slate-400 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border border-slate-500"></div>
                        {isLoading && <div className="absolute inset-0 rounded-full border-[2px] border-dashed border-yellow-500/50 animate-[spin_2s_linear_infinite]"></div>}
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
