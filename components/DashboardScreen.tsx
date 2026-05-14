import React, { useMemo, useState, useEffect } from 'react';
import { Cargo, Team, Unit, CargoStatus } from '../types';
import { CheckCircle, Zap, Calendar, AlertCircle, Clock, Bird, Radio } from 'lucide-react';

interface DashboardScreenProps {
  cargos: Cargo[];
  teams: Team[];
  units: Unit[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ cargos, teams, units }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);
  
  // Default to today's date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    now.toISOString().split('T')[0]
  );
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Basic status getter
  const getEffectiveStatus = (cargo: Cargo): CargoStatus => {
    if (cargo.status === CargoStatus.PROGRAMADO) {
      const scheduledDate = new Date(cargo.pickupTime);
      if (now > scheduledDate) return CargoStatus.ATRASADO;
    }
    return cargo.status;
  };

  const filteredCargos = useMemo(() => {
    return cargos.filter(cargo => {
      if (selectedDate) {
        const cargoDate = cargo.slaughterTime.split('T')[0];
        if (cargoDate !== selectedDate) return false;
      }
      if (selectedUnit) {
        if (cargo.unitId !== selectedUnit) return false;
      }
      return true;
    }).sort((a, b) => {
      return a.cargoNumber.localeCompare(b.cargoNumber, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [cargos, selectedDate, selectedUnit]);

  const stats = useMemo(() => {
    return filteredCargos.reduce((acc, cargo) => {
      const status = getEffectiveStatus(cargo);
      const birds = cargo.birdCount || 0;
      if (status === CargoStatus.FINALIZADO) { acc.finalizado++; acc.avesFinalizado += birds; }
      else if (status === CargoStatus.CARREGANDO) { acc.carregando++; acc.avesCarregando += birds; }
      else if (status === CargoStatus.ATRASADO) { acc.apenasAtrasado++; acc.avesAtrasado += birds; }
      else { acc.apenasProgramado++; acc.avesProgramado += birds; }
      return acc;
    }, { finalizado: 0, avesFinalizado: 0, carregando: 0, avesCarregando: 0, apenasAtrasado: 0, avesAtrasado: 0, apenasProgramado: 0, avesProgramado: 0 });
  }, [filteredCargos, now]);

  const getTeamLabel = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? `EQP ${team.number}` : '---';
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-yellow-500 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded">AO VIVO</span>
            <div className="h-px w-12 bg-slate-800" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Painel Logístico</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white airport-font">
            Cargo<span className="text-yellow-500">Transportation</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Visão Geral da Operação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a]/40 border border-sky-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Calendar size={64} className="text-sky-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-sky-500 tracking-[0.2em] mb-2">Programado</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-black text-white airport-font leading-none">{stats.apenasProgramado}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Em Fila</span>
          </div>
          <div className="flex items-center gap-2 font-black text-xs airport-font uppercase text-sky-400">
             <Clock size={14} />
             {stats.avesProgramado.toLocaleString()} Aves
          </div>
          <div className="mt-6 w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full transition-all duration-1000" style={{ width: filteredCargos.length ? `${(stats.apenasProgramado / filteredCargos.length) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="bg-[#0f172a]/40 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <CheckCircle size={64} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-2">Completados</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-black text-white airport-font leading-none">{stats.finalizado}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Viagens</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400/80 font-black text-xs airport-font uppercase">
            <Bird size={14} /> {stats.avesFinalizado.toLocaleString()} Aves
          </div>
          <div className="mt-6 w-full bg-emerald-500/5 h-2 rounded-full overflow-hidden border border-emerald-500/10">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: filteredCargos.length ? `${(stats.finalizado / filteredCargos.length) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="bg-[#0f172a]/40 border border-yellow-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Zap size={64} className="text-yellow-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.2em] mb-2">Em Execução</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-black text-white airport-font leading-none">{stats.carregando}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativas</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-500 font-black text-xs airport-font uppercase">
            <Radio size={14} className="animate-pulse" /> {stats.avesCarregando.toLocaleString()} Aves
          </div>
          <div className="mt-6 w-full bg-yellow-500/5 h-2 rounded-full overflow-hidden border border-yellow-500/10">
            <div className="bg-yellow-500 h-full animate-pulse" style={{ width: filteredCargos.length ? `${(stats.carregando / filteredCargos.length) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="bg-[#0f172a]/40 border border-red-500/40 bg-red-500/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <AlertCircle size={64} className="text-red-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] mb-2">Atrasados</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-black text-white airport-font leading-none">{stats.apenasAtrasado}</span>
            <span className="text-[10px] font-bold text-red-500/50 uppercase tracking-widest">Atrasos</span>
          </div>
          <div className="flex items-center gap-2 font-black text-xs airport-font uppercase text-red-500 animate-pulse">
             <AlertCircle size={14} />
             {stats.avesAtrasado.toLocaleString()} Aves
          </div>
          <div className="mt-6 w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: filteredCargos.length ? `${(stats.apenasAtrasado / filteredCargos.length) * 100}%` : '0%' }} />
          </div>
        </div>
      </div>

      {/* Grid de Cargas */}
      <div className="pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-black uppercase text-white border-l-4 border-yellow-500 pl-3">
            Cargas do Dia: {selectedDate ? selectedDate.split('-').reverse().join('/') : 'Todas'}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Bird size={14} />
              </div>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full sm:w-auto bg-[#0f172a] border border-slate-800 text-white rounded-xl py-2 pl-9 pr-4 outline-none focus:border-yellow-500/50 transition-all text-sm font-black uppercase cursor-pointer appearance-none"
              >
                <option value="">Todas as Unidades</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            <div className="relative group shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Calendar size={14} />
              </div>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto bg-[#0f172a] border border-slate-800 text-white rounded-xl py-2 pl-9 pr-4 outline-none focus:border-yellow-500/50 transition-all text-sm font-black uppercase cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        {filteredCargos.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 shadow-2xl py-20 text-center text-slate-700 bg-slate-900/20">
            <div className="flex flex-col items-center gap-3">
              <Radio size={32} className="opacity-10 animate-pulse" />
              <span className="uppercase font-black tracking-[0.2em] text-[10px]">
                Nenhuma carga encontrada para esta data.
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 shadow-2xl bg-[#020617] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left airport-font min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-900/60 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-800">
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Carga ID</th>
                    <th className="px-6 py-4">Equipe / Unidade</th>
                    <th className="px-6 py-4">Integrado</th>
                    <th className="px-6 py-4 text-center">Origem</th>
                    <th className="px-6 py-4 text-center">Apanha</th>
                    <th className="px-6 py-4 text-center">Abate</th>
                    <th className="px-6 py-4 text-center">Quant/Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCargos.map((cargo) => {
                    const pickup = formatDateTime(cargo.pickupTime);
                    const slaughter = formatDateTime(cargo.slaughterTime);
                    const effectiveStatus = getEffectiveStatus(cargo);
                    const isDelayed = effectiveStatus === CargoStatus.ATRASADO;
                    const isLoading = effectiveStatus === CargoStatus.CARREGANDO;
                    
                    const getRowBackgroundColor = () => {
                      if (isDelayed) return 'row-atrasado-blink';
                      if (isLoading) return 'row-carregando-blink';
                      if (effectiveStatus === CargoStatus.FINALIZADO) return 'bg-emerald-900/10 hover:bg-emerald-900/20';
                      if (effectiveStatus === CargoStatus.PROGRAMADO) return 'bg-sky-900/10 hover:bg-sky-900/20';
                      return 'hover:bg-slate-900/40';
                    };
                    
                    return (
                      <tr 
                        key={cargo.id} 
                        className={`group transition-all ${getRowBackgroundColor()}`}
                      >
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(effectiveStatus)}`}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-white font-black text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                             #{cargo.cargoNumber}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-yellow-500 text-sm uppercase tracking-tight">
                            {getTeamLabel(cargo.teamId)}
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                            {cargo.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-200 text-xs font-medium uppercase truncate max-w-[150px]" title={cargo.integrated}>{cargo.integrated}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-400 text-xs font-medium uppercase">{cargo.city}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`font-black text-lg ${isDelayed || isLoading ? 'text-white' : 'text-sky-400'} glow-text leading-none`}>
                            {pickup.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-black text-lg text-yellow-500/80 leading-none">
                            {slaughter.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-black text-white text-sm leading-none">{cargo.birdCount.toLocaleString()}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-1">{cargo.totalLoad.toLocaleString()} KG</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
