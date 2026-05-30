
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, Truck, Trash2, Edit2, FileUp, Download, Loader2 } from 'lucide-react';
import { Cargo, Team, CargoStatus, Unit } from '../types';

interface CargoManagerProps {
  cargos: Cargo[];
  teams: Team[];
  units: Unit[];
  onAdd: (cargo: Omit<Cargo, 'id' | 'status'>) => void;
  onBulkAdd: (cargos: Omit<Cargo, 'id' | 'status'>[]) => void;
  onUpdate: (id: string, cargo: Partial<Cargo>) => void;
  onDelete: (id: string) => void;
  onEdit: (cargo: Cargo) => void;
  editingCargo: Cargo | null;
  onCancel: () => void;
}

export const CargoManager: React.FC<CargoManagerProps> = ({ 
  cargos, 
  teams, 
  units,
  onAdd, 
  onBulkAdd,
  onUpdate, 
  onDelete, 
  onEdit,
  editingCargo, 
  onCancel 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [form, setForm] = useState<Omit<Cargo, 'id' | 'status'>>({
    cargoNumber: '',
    slaughterTime: '',
    teamId: '',
    integrated: '',
    city: '',
    pickupTime: '',
    birdCount: 0,
    totalLoad: 0,
    unitId: '',
    unit: ''
  });

  useEffect(() => {
    if (editingCargo) {
      setForm({
        cargoNumber: editingCargo.cargoNumber || '',
        slaughterTime: editingCargo.slaughterTime || '',
        teamId: editingCargo.teamId,
        integrated: editingCargo.integrated,
        city: editingCargo.city,
        pickupTime: editingCargo.pickupTime,
        birdCount: editingCargo.birdCount,
        totalLoad: editingCargo.totalLoad,
        unitId: editingCargo.unitId || '',
        unit: editingCargo.unit
      });
    } else {
      setForm({
        cargoNumber: '',
        slaughterTime: '',
        teamId: '',
        integrated: '',
        city: '',
        pickupTime: '',
        birdCount: 0,
        totalLoad: 0,
        unitId: '',
        unit: ''
      });
    }
  }, [editingCargo]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getEffectiveStatus = (cargo: Cargo): CargoStatus => {
    if (cargo.status === CargoStatus.PROGRAMADO) {
      const scheduledDate = new Date(cargo.pickupTime);
      if (now > scheduledDate) return CargoStatus.ATRASADO;
    }
    return cargo.status;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCargo) {
      onUpdate(editingCargo.id, form);
    } else {
      onAdd(form);
    }
  };

  /**
   * Converte datas nos formatos:
   *  - "D/M/AA H:MM"  → exportação do Google Sheets (ex: 15/5/26 0:30)
   *  - "YYYY-MM-DDTHH:mm" → formato ISO padrão
   * Retorna string no formato YYYY-MM-DDTHH:mm compatível com <input datetime-local>.
   */
  const parseCsvDate = (raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    // Formato Google Sheets ou BR: D/M/AA H:MM ou DD/MM/AAAA HH:MM:SS
    const sheetMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (sheetMatch) {
      const day   = sheetMatch[1].padStart(2, '0');
      const month = sheetMatch[2].padStart(2, '0');
      const rawYear = parseInt(sheetMatch[3], 10);
      const year  = rawYear < 100 ? 2000 + rawYear : rawYear;
      const hour  = sheetMatch[4].padStart(2, '0');
      const min   = sheetMatch[5];
      return `${year}-${month}-${day}T${hour}:${min}`;
    }
    // Formato ISO (YYYY-MM-DDTHH:mm) — retorna apenas até os minutos
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 16);
    return trimmed; // fallback
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Remove BOM e divide linhas
        const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
        const importedCargos: Omit<Cargo, 'id' | 'status'>[] = [];
        let errors = 0;

        /**
         * Divide uma linha CSV respeitando campos entre aspas
         * (evita quebrar cidades/nomes que contenham vírgulas).
         */
        const splitCsvLine = (line: string, sep: string): string[] => {
          const result: string[] = [];
          let current = '';
          let insideQuote = false;
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === '"') { insideQuote = !insideQuote; continue; }
            if (ch === sep && !insideQuote) { result.push(current.trim()); current = ''; continue; }
            current += ch;
          }
          result.push(current.trim());
          return result;
        };

        // Itera as linhas pulando o cabeçalho
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Detecta separador: ponto-e-vírgula tem prioridade sobre vírgula
          const separator = line.includes(';') ? ';' : ',';
          const values = splitCsvLine(line, separator);
          
          if (values.length >= 6) {
            /** 
             * Ordem esperada no CSV:
             * 0: Equipe                  — Ex: 401
             * 1: Integrado               — Ex: Luziane Godoy Ribeiro av2
             * 2: Cidade                  — Ex: Itapejara D' Oeste
             * 3: Hora Apanha             — Ex: 15/5/26 0:30  OU  2026-05-15T00:30
             * 4: Numero Aves             — Ex: 7020
             * 5: Total Carga (Kg)        — Ex: 9266
             * 6: Unidade                 — Ex: FRG-IO  (opcional)
             * 7: Nº Carga (ID Logístico) — Ex: 1
             * 8: Hora Abate              — Ex: 15/5/26 5:10  OU  2026-05-15T05:10
             */

            const teamNum    = values[0] || '';
            const integrated = values[1] || '';
            const city       = values[2] || '';
            const pickup     = parseCsvDate(values[3] || '');
            const birds      = parseInt((values[4] || '').replace(/\D/g, '')) || 0;
            const load       = parseInt((values[5] || '').replace(/\D/g, '')) || 0;
            const unitName   = values[6] || '';
            const cargoNum   = values[7] || (Math.floor(Math.random() * 90000) + 10000).toString();
            const slaughter  = values[8] ? parseCsvDate(values[8]) : pickup;

            // Busca a equipe exata, limpando o texto caso o usuário cole "EQP 401 (FRG-IO)" do dropdown
            const cleanedTeamNum = teamNum
              .replace(/^EQP\s+/i, '') // Remove o "EQP " do início
              .replace(/\s*\(.*?\)$/, '') // Remove o " (UNIDADE)" do final
              .trim();

            const team = teams.find(t => 
              String(t.number).trim() === cleanedTeamNum
            );

            if (team) {
              // Busca a unidade se o nome foi fornecido, senão usa a da equipe
              const unit = units.find(u => u.name.toLowerCase() === unitName.toLowerCase());
              
              importedCargos.push({
                cargoNumber: cargoNum,
                slaughterTime: slaughter,
                teamId: team.id,
                integrated: integrated,
                city: city,
                pickupTime: pickup,
                birdCount: birds,
                totalLoad: load,
                unitId: unit?.id || team.unitId || '',
                unit: unit?.name || team.unit || 'N/A'
              });
            } else {
              errors++;
              console.warn(`Equipe ${teamNum} não encontrada na linha ${i + 1}`);
            }
          }
        }

        if (importedCargos.length > 0) {
          onBulkAdd(importedCargos);
          if (errors > 0) {
            alert(`Importação concluída: ${importedCargos.length} cargas adicionadas. ${errors} linhas ignoradas por equipe não encontrada.`);
          }
        } else {
          alert("Nenhuma carga válida encontrada. Verifique se os números das equipes no CSV existem no sistema.");
        }
      } catch (err) {
        console.error("Erro no processamento:", err);
        alert("Falha ao ler o arquivo CSV. Certifique-se de que ele segue o modelo padrão.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const downloadTemplate = () => {
    const header = "Equipe;Integrado;Cidade;Hora Apanha;Numero Aves;Total Carga;Unidade;Numero Carga;Hora Abate\n";
    const example = "401;Produtor Exemplo;Cidade Exemplo;15/05/2026 08:00;5000;12500;UNIDADE A;1;15/05/2026 14:30";
    const blob = new Blob(["\uFEFF" + header + example], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_cargoboard.csv';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-[#0f172a]/80 to-[#020617] backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Truck size={24} className="text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-widest leading-none">
                {editingCargo ? 'Editar Carga' : 'Gestão de Cargas'}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Cadastro e Importação</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700"
            >
              <Download size={14} /> Modelo CSV
            </button>
            <button 
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg 
                ${isImporting ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sky-600/20'}`}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              {isImporting ? 'Lendo Arquivo...' : 'Importar Planilha'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº da Carga (ID Logístico)</label>
            <input 
              required
              type="text" 
              value={form.cargoNumber}
              onChange={e => setForm({...form, cargoNumber: e.target.value})}
              placeholder="Ex: 10442"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all airport-font font-bold text-sky-400 placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe Responsável</label>
            <select 
              required
              value={form.teamId}
              onChange={e => {
                const team = teams.find(t => t.id === e.target.value);
                setForm({...form, teamId: e.target.value, unitId: team?.unitId || '', unit: team?.unit || ''})
              }}
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all appearance-none"
            >
              <option value="">Selecione a Equipe...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>EQP {t.number} ({t.unit})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrado (Produtor)</label>
            <input 
              required
              type="text" 
              value={form.integrated}
              onChange={e => setForm({...form, integrated: e.target.value})}
              placeholder="Nome do integrado"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
            <input 
              required
              type="text" 
              value={form.city}
              onChange={e => setForm({...form, city: e.target.value})}
              placeholder="Cidade de origem/destino"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data e Hora Apanha</label>
            <input 
              required
              type="datetime-local" 
              value={form.pickupTime}
              onChange={e => setForm({...form, pickupTime: e.target.value})}
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all font-bold airport-font"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data e Hora Abate (Previsão)</label>
            <input 
              required
              type="datetime-local" 
              value={form.slaughterTime}
              onChange={e => setForm({...form, slaughterTime: e.target.value})}
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all font-bold airport-font text-yellow-500/80"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Aves</label>
            <input 
              required
              type="number" 
              value={form.birdCount || ''}
              onChange={e => setForm({...form, birdCount: parseInt(e.target.value) || 0})}
              placeholder="0"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all airport-font placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Carga (Kg)</label>
            <input 
              required
              type="number" 
              value={form.totalLoad || ''}
              onChange={e => setForm({...form, totalLoad: parseInt(e.target.value) || 0})}
              placeholder="0"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all airport-font placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</label>
            <select 
              required
              value={form.unitId}
              onChange={e => {
                const unit = units.find(u => u.id === e.target.value);
                setForm({...form, unitId: e.target.value, unit: unit?.name || ''})
              }}
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all appearance-none"
            >
              <option value="">Selecione a Unidade...</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-700/50 mt-4">
            <button 
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-700 text-white hover:bg-slate-600 transition-all uppercase text-xs"
            >
              <X size={16} /> Cancelar
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-10 py-3 rounded-xl font-bold bg-yellow-500 text-slate-900 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 uppercase text-xs"
            >
              {editingCargo ? <Check size={18} /> : <Plus size={18} />}
              {editingCargo ? 'Salvar Alterações' : 'Cadastrar Carga'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gradient-to-br from-[#0f172a]/60 to-[#020617]/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargas Cadastradas no Sistema</p>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black">{cargos.length}</span>
        </div>
        <div className="p-4">
          {cargos.length === 0 ? (
            <div className="py-12 text-center text-slate-600 uppercase font-bold text-xs tracking-widest">Nenhuma carga cadastrada</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...cargos].sort((a,b) => String(a.cargoNumber ?? '').localeCompare(String(b.cargoNumber ?? ''), undefined, {numeric: true})).map(cargo => {
                const team = teams.find(t => t.id === cargo.teamId);
                const formatTime = (timeStr: string) => {
                  try {
                    return timeStr ? new Date(timeStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '---';
                  } catch { return '---'; }
                };

                const effectiveStatus = getEffectiveStatus(cargo);

                return (
                  <div key={cargo.id} className="group bg-[#020617]/40 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl hover:bg-slate-800/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-yellow-500 font-black text-xl airport-font">#{cargo.cargoNumber}</div>
                          <div className="font-bold text-white text-sm uppercase tracking-tight">EQP {team?.number || '---'}</div>
                        </div>
                        <div className="text-right max-w-[50%]">
                          <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest block text-center break-words leading-tight ${getStatusStyle(effectiveStatus)}`}>
                            {getStatusLabel(effectiveStatus)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-y border-slate-800 py-3">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Integrado</p>
                          <p className="text-slate-200 text-sm font-medium uppercase truncate" title={cargo.integrated}>{cargo.integrated}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Origem/Cidade</p>
                          <p className="text-slate-200 text-sm font-medium uppercase truncate" title={cargo.city}>{cargo.city}</p>
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
                          <p className="text-sky-400 text-xs font-black airport-font">{formatTime(cargo.pickupTime)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Previsão Abate</p>
                          <p className="text-yellow-500/80 text-xs font-black airport-font">{formatTime(cargo.slaughterTime)}</p>
                        </div>
                      </div>

                      {(cargo.horario_inicio || cargo.horario_fim) && (
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/50">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Início Real</p>
                            <p className="text-sky-400/80 text-xs font-black airport-font">
                              {cargo.horario_inicio ? new Date(cargo.horario_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Fim Real</p>
                            <p className="text-emerald-400/80 text-xs font-black airport-font">
                              {cargo.horario_fim ? new Date(cargo.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Duração</p>
                            <p className={`text-xs font-black airport-font ${
                              effectiveStatus === CargoStatus.CARREGANDO ? 'text-yellow-400 animate-pulse' : 'text-slate-400'
                            }`}>
                              {formatStopwatch(cargo.horario_inicio, cargo.horario_fim) ?? '--:--:--'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-800">
                      <button 
                        onClick={() => onEdit(cargo)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => onDelete(cargo.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
