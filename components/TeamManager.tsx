
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Users } from 'lucide-react';
import { Team, Unit } from '../types';

interface TeamManagerProps {
  teams: Team[];
  units: Unit[];
  onAdd: (team: Omit<Team, 'id'>) => void;
  onUpdate: (id: string, team: Omit<Team, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ teams, units, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Team, 'id'>>({ number: '', unitId: '', unit: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdate(isEditing, form);
      setIsEditing(null);
    } else {
      onAdd(form);
    }
    setForm({ number: '', unitId: '', unit: '' });
  };

  const handleEdit = (team: Team) => {
    setIsEditing(team.id);
    setForm({ number: team.number, unitId: team.unitId, unit: team.unit });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-[#0f172a]/80 to-[#020617] backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-3 uppercase tracking-widest">
          <Users size={24} className="text-yellow-500" />
          {isEditing ? 'Editar Equipe' : 'Cadastro de Equipes'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número da Equipe</label>
            <input 
              required
              type="text" 
              value={form.number}
              onChange={e => setForm({...form, number: e.target.value})}
              placeholder="Ex: 001"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 outline-none transition-all placeholder:text-slate-700 airport-font"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</label>
            <select 
              required
              value={form.unitId}
              onChange={e => setForm({...form, unitId: e.target.value})}
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 outline-none transition-all appearance-none"
            >
              <option value="">Selecione a Unidade...</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 mt-4 pt-6 border-t border-slate-700/50">
            {isEditing && (
              <button 
                type="button"
                onClick={() => { setIsEditing(null); setForm({ number: '', unitId: '', unit: '' }); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-700 text-white hover:bg-slate-600 transition-all uppercase text-xs"
              >
                <X size={16} /> Cancelar
              </button>
            )}
            <button 
              type="submit"
              className="flex items-center gap-2 px-10 py-3 rounded-xl font-bold bg-yellow-500 text-slate-900 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 uppercase text-xs"
            >
              {isEditing ? <Check size={18} /> : <Plus size={18} />}
              {isEditing ? 'Atualizar Equipe' : 'Cadastrar Equipe'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gradient-to-br from-[#0f172a]/60 to-[#020617]/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipes Cadastradas</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black">{teams.length}</span>
        </div>
        <table className="w-full text-left airport-font">
          <thead>
            <tr className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="px-6 py-4">Equipe</th>
              <th className="px-6 py-4">Unidade</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-600 uppercase font-bold text-xs tracking-widest">Nenhuma equipe cadastrada</td>
              </tr>
            ) : (
              teams.map(team => (
                <tr key={team.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-5 font-bold text-white text-lg">EQP {team.number}</td>
                  <td className="px-6 py-5 text-slate-400 uppercase">{team.unit}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(team)}
                        className="p-2 text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(team.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
