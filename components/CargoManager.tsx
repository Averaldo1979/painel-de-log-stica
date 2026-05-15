
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
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getEffectiveStatus = (cargo: Cargo): CargoStatus => {
    if (cargo.status === CargoStatus.PROGRAMADO) {
      const scheduledDate = new Date(cargo.pickupTime);
      if (now > scheduledDate) return CargoStatus.ATRASADO;
    }
    return cargo.status;
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
    const trimmed = raw.trim();
    // Formato Google Sheets: D/M/AA H:MM ou DD/MM/AA HH:MM
    const sheetMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})$/);
    if (sheetMatch) {
      const day   = sheetMatch[1].padStart(2, '0');
      const month = sheetMatch[2].padStart(2, '0');
      const rawYear = parseInt(sheetMatch[3], 10);
      const year  = rawYear < 100 ? 2000 + rawYear : rawYear;
      const hour  = sheetMatch[4].padStart(2, '0');
      const min   = sheetMatch[5];
      return `${year}-${month}-${day}T${hour}:${min}`;
    }
    // Formato ISO (YYYY-MM-DDTHH:mm) — retorna como está
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return trimmed;
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
             * 0: Nº Carga (ID Logístico) — Ex: 1
             * 1: Equipe                  — Ex: 401
             * 2: Integrado               — Ex: Luziane Godoy Ribeiro av2
             * 3: Cidade                  — Ex: Itapejara D' Oeste
             * 4: Hora Apanha             — Ex: 15/5/26 0:30  OU  2026-05-15T00:30
             * 5: Numero Aves             — Ex: 7020
             * 6: Total Carga (Kg)        — Ex: 9266
             * 7: Unidade                 — Ex: FRG-IO  (opcional)
             * 8: Hora Abate              — Ex: 15/5/26 5:10  OU  2026-05-15T05:10
             */

            const cargoNum   = values[0] || (Math.floor(Math.random() * 90000) + 10000).toString();
            const teamNum    = values[1];
            const integrated = values[2];
            const city       = values[3];
            const pickup     = parseCsvDate(values[4]);
            const birds      = parseInt(values[5].replace(/\D/g, '')) || 0;
            const load       = parseInt(values[6].replace(/\D/g, '')) || 0;
            const unitName   = values[7] || '';
            const slaughter  = values[8] ? parseCsvDate(values[8]) : pickup;

            // Busca a equipe exata
            const team = teams.find(t => 
              t.number.trim() === teamNum.replace(/^EQP\s+/i, '')
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
    const header = "Nº Carga (ID Logístico),Equipe,Integrado,Cidade,Hora Apanha,Numero Aves,Total Carga,Unidade,Hora Abate\n";
    const example = "1,401,Produtor Exemplo,Cidade Exemplo,15/5/26 8:00,5000,12500,UNIDADE A,15/5/26 14:30";
    const blob = new Blob(["\uFEFF" + header + example], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_cargoboard.csv';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 shadow-2xl">
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all airport-font font-bold text-yellow-500"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all appearance-none"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data e Hora Apanha</label>
            <input 
              required
              type="datetime-local" 
              value={form.pickupTime}
              onChange={e => setForm({...form, pickupTime: e.target.value})}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all font-bold airport-font"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data e Hora Abate (Previsão)</label>
            <input 
              required
              type="datetime-local" 
              value={form.slaughterTime}
              onChange={e => setForm({...form, slaughterTime: e.target.value})}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all font-bold airport-font text-yellow-500/80"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all airport-font"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all airport-font"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all appearance-none"
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

      <div className="bg-[#020617] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
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
                  <div key={cargo.id} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl hover:bg-slate-900/60 transition-colors flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-yellow-500 font-black text-xl airport-font">#{cargo.cargoNumber}</div>
                          <div className="font-bold text-white text-sm uppercase tracking-tight">EQP {team?.number || '---'}</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase text-white ${
                            effectiveStatus === CargoStatus.ATRASADO ? 'bg-red-600 border-red-500 animate-pulse' :
                            effectiveStatus === CargoStatus.CARREGANDO ? 'bg-yellow-500 border-yellow-500 text-slate-950 text-black' :
                            effectiveStatus === CargoStatus.FINALIZADO ? 'bg-emerald-600 border-emerald-500' :
                            'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {effectiveStatus}
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
