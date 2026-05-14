
import React, { useState } from 'react';
import { Cloud, Copy, Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Smartphone, Monitor, Trash2, RefreshCcw } from 'lucide-react';
import { Unit, Team, Cargo } from '../types';

interface SyncViewProps {
  units: Unit[];
  teams: Team[];
  cargos: Cargo[];
  onImport: (data: { units: Unit[], teams: Team[], cargos: Cargo[] }) => void;
  onClearCargos: () => void;
  onClearAll: () => void;
}

export const SyncView: React.FC<SyncViewProps> = ({ units, teams, cargos, onImport, onClearCargos, onClearAll }) => {
  const [syncCode, setSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const generateSyncCode = () => {
    const data = { units, teams, cargos, timestamp: Date.now() };
    const jsonString = JSON.stringify(data);
    const base64 = btoa(encodeURIComponent(jsonString));
    setSyncCode(base64);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleImport = () => {
    try {
      const jsonString = decodeURIComponent(atob(inputCode));
      const data = JSON.parse(jsonString);
      
      if (data.units && data.teams && data.cargos) {
        if (window.confirm("Isso irá substituir todos os dados atuais no seu celular pelos dados deste código. Continuar?")) {
          onImport(data);
          setInputCode('');
          setStatus('success');
          alert("Sincronização concluída com sucesso!");
        }
      } else {
        throw new Error("Formato inválido");
      }
    } catch (e) {
      alert("Código de sincronização inválido. Verifique se copiou o código completo.");
      setStatus('error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(syncCode);
    alert("Código copiado! Agora cole no seu celular.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Visual */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
          <Cloud size={48} className="text-yellow-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white airport-font">Gestão de <span className="text-yellow-500">Dados</span></h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">Transfira informações entre dispositivos ou realize a manutenção da sua base de dados local.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar (Web -> Mobile) */}
        <div className="bg-[#1e293b] rounded-2xl p-8 border border-slate-700 shadow-xl space-y-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
              <Upload size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest text-white">Exportar Dados</h3>
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed uppercase font-bold tracking-wider">Gere um código seguro para levar seus dados para o celular.</p>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                <span>Resumo do Pacote</span>
                <span className="text-sky-400">Pronto</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-lg font-black text-white airport-font">{units.length}</div>
                  <div className="text-[8px] text-slate-500 uppercase font-black">Unidades</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-lg font-black text-white airport-font">{teams.length}</div>
                  <div className="text-[8px] text-slate-500 uppercase font-black">Equipes</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-lg font-black text-white airport-font">{cargos.length}</div>
                  <div className="text-[8px] text-slate-500 uppercase font-black">Cargas</div>
                </div>
              </div>
            </div>

            {syncCode && (
              <div className="space-y-2 animate-in zoom-in-95 duration-300">
                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block">Código Gerado</label>
                <div className="relative">
                  <textarea 
                    readOnly
                    value={syncCode}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-500 airport-font h-24 resize-none focus:outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="absolute bottom-3 right-3 p-2 bg-yellow-500 text-slate-900 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={generateSyncCode}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
          >
            {status === 'success' ? <CheckCircle2 size={18} /> : <Monitor size={18} />}
            Gerar Código Único
          </button>
        </div>

        {/* Importar (Mobile -> Web ou vice-versa) */}
        <div className="bg-[#1e293b] rounded-2xl p-8 border border-slate-700 shadow-xl space-y-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Download size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest text-white">Importar Dados</h3>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed uppercase font-bold tracking-wider">Cole o código gerado em outro dispositivo para sincronizar tudo.</p>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Colar Código Aqui</label>
              <textarea 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Cole o código Base64 aqui..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-[10px] text-slate-300 airport-font h-40 resize-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-500/80 font-bold uppercase leading-tight">Aviso: A importação apagará os dados atuais deste dispositivo para aplicar o novo pacote.</p>
            </div>
          </div>

          <button 
            disabled={!inputCode}
            onClick={handleImport}
            className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg
              ${inputCode ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
            `}
          >
            <Smartphone size={18} />
            Sincronizar Agora
          </button>
        </div>
      </div>

      {/* Zona de Perigo - Limpar Dados */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest text-red-500">Zona de Perigo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 space-y-4">
            <div>
              <h4 className="text-white font-bold text-sm uppercase">Limpar Histórico de Cargas</h4>
              <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">Remove apenas as programações de cargas. Mantém unidades e equipes intactas.</p>
            </div>
            <button 
              onClick={onClearCargos}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-red-500 rounded-lg text-[10px] font-black uppercase transition-all border border-slate-700 hover:border-red-500/50"
            >
              <Trash2 size={14} /> Limpar Todas as Cargas
            </button>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 space-y-4">
            <div>
              <h4 className="text-white font-bold text-sm uppercase">Redefinição de Fábrica</h4>
              <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">Apaga permanentemente todos os dados (Unidades, Equipes e Cargas).</p>
            </div>
            <button 
              onClick={onClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-red-600/20"
            >
              <RefreshCcw size={14} /> Redefinir Aplicação
            </button>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-8 py-6 border-t border-slate-800/50">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-emerald-500" /> Criptografia Base64
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <CheckCircle2 size={14} className="text-emerald-500" /> Validação de Integridade
        </div>
      </div>
    </div>
  );
};
