import React, { useState } from 'react';
import { User, ViewMode, Unit } from '../types';
import { Plus, Edit2, Trash2, Shield, LayoutDashboard, Truck, Users, Building2, Save, X } from 'lucide-react';

interface UsersScreenProps {
  users: User[];
  units: Unit[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

const MENU_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'DASHBOARD', label: 'Painel Logístico' },
  { id: 'CARGOS_LIST', label: 'Voos de Cargas' },
  { id: 'CARGO_ENTRY', label: 'Gerir Cargas' },
  { id: 'TEAMS', label: 'Equipes' },
  { id: 'UNITS', label: 'Unidades' },
  { id: 'USERS', label: 'Usuários' },
  { id: 'TV_PANEL', label: 'Painel de TV' }
];

export const UsersScreen: React.FC<UsersScreenProps> = ({ users, units, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData(user);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.role) return;

    if (editingId === 'new') {
      onAddUser({
        name: formData.name,
        email: formData.email,
        password: formData.password || '',
        role: formData.role as 'ADMIN' | 'USER',
        allowedMenus: formData.allowedMenus || [],
        allowedUnits: formData.allowedUnits || []
      });
    } else if (editingId) {
      onUpdateUser(editingId, formData);
    }
    
    setEditingId(null);
    setFormData({});
  };

  const toggleMenuPermission = (menuId: ViewMode) => {
    const currentSpecs = formData.allowedMenus || [];
    if (currentSpecs.includes(menuId)) {
      setFormData({ ...formData, allowedMenus: currentSpecs.filter(m => m !== menuId) });
    } else {
      setFormData({ ...formData, allowedMenus: [...currentSpecs, menuId] });
    }
  };

  const toggleUnitPermission = (unitId: string) => {
    const currentUnits = formData.allowedUnits || [];
    if (currentUnits.includes(unitId)) {
      setFormData({ ...formData, allowedUnits: currentUnits.filter(u => u !== unitId) });
    } else {
      setFormData({ ...formData, allowedUnits: [...currentUnits, unitId] });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white airport-font">
            Cargo<span className="text-yellow-500">Users</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Gestão de Acessos</p>
        </div>
        
        {!editingId && (
          <button 
            onClick={() => {
              setEditingId('new');
              setFormData({ role: 'USER', allowedMenus: ['DASHBOARD'] });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-tighter rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> Novo Usuário
          </button>
        )}
      </div>

      {editingId ? (
        <div className="bg-[#0f172a] border border-yellow-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Nome Completo</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#020617] border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50 transition-all text-sm font-bold placeholder-slate-700"
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#020617] border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50 transition-all text-sm font-bold placeholder-slate-700"
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Senha</label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#020617] border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50 transition-all text-sm font-bold placeholder-slate-700"
                placeholder="Deixar vazio p/ não alterar"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Nível de Acesso</label>
              <select
                value={formData.role || 'USER'}
                onChange={e => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
                className="w-full bg-[#020617] border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50 transition-all text-sm font-bold uppercase"
              >
                <option value="USER">Usuário Padrão</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          {formData.role !== 'ADMIN' && (
            <div className="space-y-4 mb-8">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Unidades Permitidas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {units.map(unit => {
                  const isActive = (formData.allowedUnits || []).includes(unit.id);
                  return (
                    <button
                      key={unit.id}
                      onClick={() => toggleUnitPermission(unit.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isActive 
                          ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                          : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isActive ? 'bg-yellow-500 border-yellow-500 text-slate-900' : 'border-slate-700'
                      }`}>
                        {isActive && <Shield size={10} />}
                      </div>
                      <span className="text-xs font-black tracking-widest">{unit.name}</span>
                    </button>
                  );
                })}
                {units.length === 0 && (
                  <div className="col-span-full py-4 text-center border border-dashed border-slate-800 rounded-xl relative">
                     <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Nenhuma unidade cadastrada</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Permissões de Menu</label>
            
            {formData.role === 'ADMIN' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                <Shield className="text-emerald-500" size={24} />
                <div>
                  <div className="text-emerald-400 font-black uppercase tracking-widest text-xs">Acesso Total Concedido</div>
                  <div className="text-emerald-500/70 text-[10px] font-bold mt-1">O perfil administrador tem acesso a todos os módulos do sistema.</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {MENU_OPTIONS.map(menu => {
                  const isActive = (formData.allowedMenus || []).includes(menu.id);
                  return (
                    <button
                      key={menu.id}
                      onClick={() => toggleMenuPermission(menu.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        isActive 
                          ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                          : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isActive ? 'bg-yellow-500 border-yellow-500 text-slate-900' : 'border-slate-700'
                      }`}>
                        {isActive && <Shield size={10} />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{menu.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800/60">
            <button
              onClick={() => { setEditingId(null); setFormData({}); }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-tighter rounded-xl transition-all"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-tighter rounded-xl transition-all shadow-lg"
            >
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
            <div key={user.id} className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-white font-black text-lg truncate" title={user.name}>{user.name}</div>
                  <div className="text-slate-500 text-xs font-bold">{user.email}</div>
                </div>
                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
                  user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {user.role}
                </span>
              </div>

              <div className="flex-1">
                <div className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2">Acessos:</div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {user.role === 'ADMIN' ? (
                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1 text-[8px] font-black uppercase rounded">
                        <Shield size={10} /> Acesso Total (Todos os Módulos)
                      </span>
                    ) : (
                      <>
                        {user.allowedMenus.map(menu => {
                          const option = MENU_OPTIONS.find(m => m.id === menu);
                          return (
                            <span key={menu} className="px-2 py-1 bg-black/40 border border-slate-800 text-slate-400 text-[8px] font-black uppercase rounded">
                              {option?.label || menu}
                            </span>
                          );
                        })}
                        {user.allowedMenus.length === 0 && (
                          <span className="text-xs text-slate-600 font-medium italic">Nenhum acesso</span>
                        )}
                      </>
                    )}
                  </div>
                  {user.role !== 'ADMIN' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                       <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] w-full mb-1">Unidades:</span>
                       {user.allowedUnits && user.allowedUnits.length > 0 ? (
                         user.allowedUnits.map(unitId => {
                           const unitName = units.find(u => u.id === unitId)?.name || 'Desconhecida';
                           return (
                             <span key={unitId} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase rounded flex items-center gap-1">
                               <Building2 size={10} /> {unitName}
                             </span>
                           );
                         })
                       ) : (
                         <span className="text-xs text-slate-600 font-medium italic">Todas as unidades (sem restrição)</span>
                       )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(user)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Nenhum usuário cadastrado</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
