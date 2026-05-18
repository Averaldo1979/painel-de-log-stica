import React, { useState } from 'react';
import { User } from '../types';
import { Truck, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password?: string) => void;
  error?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden text-slate-200">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]"></div>
      
      <div className="w-full max-w-md relative z-10 px-6">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(234,179,8,0.15)] relative">
            <Truck size={36} className="text-yellow-500 absolute" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white airport-font">
              Cargo<span className="text-yellow-500">Transportation</span>
            </h1>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mt-2">
              Controle Logístico • Acesso Restrito
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0f172a]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
              <ShieldCheck size={16} /> {error}
            </div>
          )}

          <div className="space-y-6 flex flex-col items-center">
            <div className="w-full space-y-2 group">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] group-focus-within:text-yellow-500 transition-colors block">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="digite seu e-mail"
                  className="w-full bg-[#020617]/90 border border-slate-800 text-white rounded-2xl py-4 pl-11 pr-4 outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 transition-all text-sm font-bold placeholder-slate-700 shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="w-full space-y-2 group">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] group-focus-within:text-yellow-500 transition-colors block">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="digite sua senha"
                  className="w-full bg-[#020617]/90 border border-slate-800 text-white rounded-2xl py-4 pl-11 pr-4 outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 transition-all text-sm font-bold placeholder-slate-700 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(234,179,8,0.2)]"
            >
              Acessar Sistema <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">
            Uso exclusivo para colaboradores autorizados.
          </p>
        </div>
      </div>
    </div>
  );
};
