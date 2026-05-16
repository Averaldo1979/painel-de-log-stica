
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Building2 } from 'lucide-react';
import { Unit } from '../types';

interface UnitManagerProps {
  units: Unit[];
  onAdd: (unit: Omit<Unit, 'id'>) => void;
  onUpdate: (id: string, unit: Omit<Unit, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const UnitManager: React.FC<UnitManagerProps> = ({ units, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Unit, 'id'>>({ name: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (/^\d+$/.test(form.name.trim())) {
      alert('O nome da unidade não pode conter apenas números (ex: 500). Por favor, insira um nome válido.');
      return;
    }

    if (isEditing) {
      onUpdate(isEditing, form);
      setIsEditing(null);
    } else {
      onAdd(form);
    }
    setForm({ name: '' });
  };

  const handleEdit = (unit: Unit) => {
    setIsEditing(unit.id);
    setForm({ name: unit.name });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-[#0f172a]/80 to-[#020617] backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-3 uppercase tracking-widest">
          <Building2 size={24} className="text-yellow-500" />
          {isEditing ? 'Editar Unidade' : 'Cadastro de Unidades'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Unidade</label>
            <input 
              required
              type="text" 
              value={form.name}
              onChange={e => setForm({ name: e.target.value })}
              placeholder="Ex: Unidade Industrial 01 ou Unidade B"
              className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/50 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-700/50">
            {isEditing && (
              <button 
                type="button"
                onClick={() => { setIsEditing(null); setForm({ name: '' }); }}
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
              {isEditing ? 'Atualizar Unidade' : 'Cadastrar Unidade'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gradient-to-br from-[#0f172a]/60 to-[#020617]/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <table className="w-full text-left airport-font">
          <thead>
            <tr className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="px-6 py-4">Nome da Unidade</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {units.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-slate-600 uppercase font-bold text-xs tracking-widest">Nenhuma unidade cadastrada</td>
              </tr>
            ) : (
              units.map(unit => (
                <tr key={unit.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-5 font-bold text-white text-lg uppercase">{unit.name}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(unit)}
                        className="p-2 text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(unit.id)}
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
