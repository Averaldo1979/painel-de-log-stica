
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
  ArrowLeft
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
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onReset, units, currentUser, users, setCurrentUser }) => {
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
    <div className="min-h-screen flex bg-[#020617] text-slate-200 selection:bg-yellow-500 selection:text-slate-900">
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
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-2xl text-slate-950 shadow-[0_0_25px_rgba(234,179,8,0.2)]">
                <Radio size={22} strokeWidth={3} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white leading-none">Cargo</span>
                <span className="text-sm font-black text-yellow-500 uppercase tracking-tighter leading-none mt-1">Transportation</span>
              </div>
            </div>
            <button className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="p-6 space-y-1.5">
            <p className="px-3 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Operações Principais</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-black uppercase transition-all duration-200
                  ${view === item.id 
                    ? 'bg-yellow-500 text-slate-950 shadow-[0_8px_20px_rgba(234,179,8,0.2)] scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-800'}
                `}
              >
                {item.icon}
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
        <header className="h-20 bg-[#020617]/95 backdrop-blur-2xl border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
          <div className="flex items-center gap-8">
            <button className="lg:hidden p-3 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                <Radio size={12} className="text-emerald-500" />
                <span>Torre de Controle Logística</span>
              </div>
              <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">
                Acesso: <span className="text-yellow-500">
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

          <div className="flex items-center gap-4">
            {currentUser && setCurrentUser && (
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
            )}
            
            <button onClick={toggleFullscreen} className="p-3 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg" title="Tela Cheia">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <div className="flex items-center gap-4 bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800 shadow-inner group">
              <Clock size={18} className="text-yellow-500 group-hover:scale-110 transition-transform" />
              <span className="airport-font text-yellow-500 font-black text-xl glow-text">
                {time.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a]/20 custom-scrollbar">
          <div className="max-w-[1700px] mx-auto animate-in fade-in duration-1000">
            {children}
          </div>
        </main>

            <footer className="p-6 text-center border-t border-slate-800/30 bg-[#020617]/90 backdrop-blur-md">
              <div className="text-slate-600 text-[9px] font-black uppercase tracking-[0.5em] opacity-40">
                &copy; {new Date().getFullYear()} CARGO TRANSPORTATION LOGISTICS SYSTEM • INDUSTRIAL GRADE
              </div>
            </footer>
          </div>
        </>
      )}
    </div>
  );
};
