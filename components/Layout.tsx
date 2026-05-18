
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Clock, 
  RefreshCcw, 
  Building2, 
  Menu, 
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  Radio,
  UserCircle,
  Monitor,
  ArrowLeft,
  Cloud
} from 'lucide-react';
import { ViewMode, Unit, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  onReset: () => void;
  units: Unit[];
  currentUser?: User | null;
  users?: User[];
  setCurrentUser?: (u: User | null) => void;
  pendingSyncCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onReset, units, currentUser, users, setCurrentUser, pendingSyncCount }) => {
  const [time, setTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const allNavItems = [
    { id: 'DASHBOARD' as ViewMode, label: 'Painel Logístico', icon: <LayoutDashboard size={18} /> },
    { id: 'CARGOS_LIST' as ViewMode, label: 'Voos de Cargas', icon: <Truck size={18} /> },
    { id: 'CARGO_ENTRY' as ViewMode, label: 'Gerir Cargas', icon: <Truck size={18} /> },
    { id: 'TEAMS' as ViewMode, label: 'Equipes', icon: <Users size={18} /> },
    { id: 'UNITS' as ViewMode, label: 'Unidades', icon: <Building2 size={18} /> },
    { id: 'USERS' as ViewMode, label: 'Usuários', icon: <Users size={18} /> },
    { id: 'TV_PANEL' as ViewMode, label: 'Painel de TV', icon: <Monitor size={18} /> },
  ];

  const permittedNavItems = currentUser?.role === 'ADMIN' 
    ? allNavItems 
    : allNavItems.filter(nav => currentUser?.allowedMenus.includes(nav.id));

  // Temporary fail-safe if no users or no permission system set yet
  const navItems = (!users?.length && !currentUser) ? allNavItems : permittedNavItems;

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-200 selection:bg-yellow-500 selection:text-slate-900 pb-16 lg:pb-0">
      {view === 'TV_PANEL' ? (
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
          <div className="absolute top-4 left-4 z-50">
            <button 
              onClick={() => setView('DASHBOARD')}
              className="p-3 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all shadow-lg backdrop-blur-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
            <button onClick={toggleFullscreen} className="p-3 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all shadow-lg backdrop-blur-sm">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
             <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-700 shadow-inner group">
              <Clock size={18} className="text-yellow-500 group-hover:scale-110 transition-transform" />
              <span className="airport-font text-yellow-500 font-black text-xl glow-text">
                {time.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
          <main className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a]/20 custom-scrollbar">
            <div className="h-full w-full max-w-[1920px] mx-auto animate-in fade-in duration-1000">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <>
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] border-r border-slate-800/50 transition-all duration-300 lg:translate-x-0 lg:static
            ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}>
        <div className="h-full flex flex-col bg-gradient-to-b from-[#020617] to-[#0f172a]/80">
          <div className="p-8 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl text-slate-950 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <Radio size={22} strokeWidth={3} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70 leading-none">Cargo</span>
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 uppercase tracking-tighter leading-none mt-1">Transportation</span>
              </div>
            </div>
            <button className="lg:hidden p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="p-6 space-y-2">
            <p className="px-3 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operações Principais</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase transition-all duration-300 group
                  ${view === item.id 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-transparent text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                `}
              >
                <div className={`transition-transform duration-300 ${view === item.id ? 'scale-110' : 'group-hover:scale-110 group-hover:text-yellow-500'}`}>
                  {item.icon}
                </div>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6 space-y-1.5 custom-scrollbar">
            <div className="flex items-center justify-between px-3 mb-4">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Hubs / Unidades</p>
              <span className="text-[9px] bg-slate-950 text-yellow-500/80 px-2.5 py-1 rounded-full font-black border border-yellow-500/20">
                {units.length}
              </span>
            </div>
            {units.length === 0 ? (
              <div className="px-3 py-8 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-[9px] text-slate-600 font-bold uppercase text-center leading-relaxed tracking-widest">
                  Terminal Vazio
                </p>
              </div>
            ) : (
              units.map(unit => (
                <div key={unit.id} className="group flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-slate-800/40 transition-all cursor-pointer border border-transparent hover:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-yellow-500 group-hover:shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight group-hover:text-white transition-colors">
                      {unit.name}
                    </span>
                  </div>
                  <ChevronRight size={12} className="text-slate-700 group-hover:text-yellow-500 transition-all" />
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-slate-800/50">
            <button 
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-red-500 transition-all py-4 border border-slate-800 hover:border-red-500/40 rounded-2xl group"
            >
              <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
              Resetar Base
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 md:h-20 bg-[#020617]/95 backdrop-blur-2xl border-b border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
          <div className="flex items-center gap-3 md:gap-8">
            <button className="lg:hidden p-2.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                <Radio size={10} className="text-emerald-500" />
                <span className="hidden sm:inline">Torre de Controle Logística</span>
                <span className="sm:hidden">Torre de Controle</span>
              </div>
              <div className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-widest mt-0.5">
                <span className="text-yellow-500">
                  {view === 'DASHBOARD' && 'PAINEL LOGÍSTICO'}
                  {view === 'CARGOS_LIST' && 'VOOS DE CARGAS'}
                  {view === 'CARGO_ENTRY' && 'GERIR CARGAS'}
                  {view === 'TEAMS' && 'EQUIPES'}
                  {view === 'UNITS' && 'UNIDADES'}
                  {view === 'USERS' && 'USUÁRIOS'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {pendingSyncCount !== undefined && pendingSyncCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl animate-pulse cursor-help" title={`${pendingSyncCount} ações salvas offline aguardando sincronização`}>
                <Cloud size={14} className="animate-bounce" />
                <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Ações Pendentes ({pendingSyncCount})</span>
                <span className="text-[9px] font-black uppercase tracking-wider sm:hidden">({pendingSyncCount})</span>
              </div>
            )}
            {currentUser && setCurrentUser && (
              <>
                {/* Mobile: só ícone de logout */}
                <button 
                  onClick={() => setCurrentUser(null)}
                  className="sm:hidden flex items-center gap-1.5 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-red-500 text-[9px] font-black uppercase"
                >
                  <UserCircle size={14} />
                  Sair
                </button>
                {/* Desktop: card completo */}
                <div className="hidden sm:flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${currentUser?.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                      <UserCircle size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 leading-none">{currentUser.name}</span>
                      <span className="text-[9px] font-bold text-yellow-500 uppercase mt-1 tracking-widest">{currentUser.role}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCurrentUser(null)}
                    className="ml-2 pl-4 border-l border-slate-800 text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
            
            <button onClick={toggleFullscreen} className="hidden sm:flex p-3 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg" title="Tela Cheia">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner group">
              <Clock size={16} className="text-yellow-500" />
              <span className="airport-font text-yellow-500 font-black text-lg glow-text">
                {time.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            {/* Mobile clock */}
            <div className="sm:hidden flex items-center gap-1.5 bg-slate-950 px-2.5 py-2 rounded-xl border border-slate-800">
              <Clock size={12} className="text-yellow-500" />
              <span className="airport-font text-yellow-500 font-black text-sm">
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 md:p-10 overflow-y-auto bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a]/20 custom-scrollbar">
          <div className="max-w-[1700px] mx-auto animate-in fade-in duration-1000">
            {children}
          </div>
        </main>

            <footer className="hidden sm:block p-6 text-center border-t border-slate-800/30 bg-[#020617]/90 backdrop-blur-md">
              <div className="text-slate-600 text-[9px] font-black uppercase tracking-[0.5em] opacity-40">
                &copy; {new Date().getFullYear()} CARGO TRANSPORTATION LOGISTICS SYSTEM • INDUSTRIAL GRADE
              </div>
            </footer>
          </div>

          {/* ── Mobile Bottom Navigation ── */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/98 backdrop-blur-xl border-t border-slate-800 flex items-stretch safe-area-inset-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {navItems.slice(0, 5).map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all ${
                  view === item.id
                    ? 'text-yellow-500'
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <span className={`transition-transform ${ view === item.id ? 'scale-110' : '' }`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
                </span>
                <span className="text-[8px] font-black uppercase tracking-tight leading-none">
                  {item.label.split(' ')[0]}
                </span>
                {view === item.id && <span className="absolute bottom-0 w-8 h-0.5 bg-yellow-500 rounded-full" />}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
};
